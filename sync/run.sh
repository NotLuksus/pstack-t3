#!/usr/bin/env bash
# One sync: mirror upstream pstack onto the `upstream` branch (transformed), then merge that
# branch into `main`. A clean merge that validates is pushed to `main`; anything else goes to
# a `sync/pstack-<rev>` branch with a pull request (or an issue, when Actions may not open
# pull requests), and `main` stays as it was.
#
# Runs from a checkout of `main` with full history. Needs `gh` authenticated (GH_TOKEN) and
# push access to the repository; the workflow's GITHUB_TOKEN is enough.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
config=sync/config.json
repository=$(jq -r .upstream.repository "$config")
branch=$(jq -r .upstream.branch "$config")
path=$(jq -r .upstream.path "$config")

work=$(mktemp -d)
trap 'git worktree remove --force "$work/vendor" 2>/dev/null || true; rm -rf "$work"' EXIT

summary() { [[ -n "${GITHUB_STEP_SUMMARY:-}" ]] && printf '%s\n' "$*" >>"$GITHUB_STEP_SUMMARY"; printf '%s\n' "$*"; }

# Upstream: only the pstack directory, and its own last commit, so commits to other plugins
# in cursor/plugins never produce a sync.
git clone --quiet --filter=blob:none --no-checkout --branch "$branch" "$repository" "$work/up"
git -C "$work/up" sparse-checkout set --no-cone "/$path/"
git -C "$work/up" checkout --quiet
rev=$(git -C "$work/up" log -1 --format=%H -- "$path")
short=${rev:0:12}

git fetch --quiet origin upstream
synced=$(git show origin/upstream:.upstream-rev 2>/dev/null || true)
vendor=origin/upstream

# Transform on every run, not only when upstream moved: a change to sync/config.json or
# sync/transform.ts must reach the upstream branch too.
git worktree add --quiet --detach "$work/vendor" origin/upstream
git -C "$work/vendor" rm -rq --ignore-unmatch .
node sync/transform.ts "$work/up" "$work/tree"
cp -a "$work/tree/." "$work/vendor/"
echo "$rev" >"$work/vendor/.upstream-rev"
git -C "$work/vendor" add -A
if ! git -C "$work/vendor" diff --cached --quiet; then
  {
    if [[ "$rev" == "$synced" ]]; then
      echo "Re-apply the transform to cursor/plugins@$short"
      echo
      echo "sync/transform.ts or sync/config.json changed on main."
    else
      echo "Sync pstack from cursor/plugins@$short"
      echo
      if [[ -n "$synced" ]] && git -C "$work/up" cat-file -e "$synced^{commit}" 2>/dev/null; then
        git -C "$work/up" log --format='- %h %s' "$synced..$rev" -- "$path" | head -100
      else
        echo "Upstream: $repository/tree/$rev/$path"
      fi
    fi
  } >"$work/message"
  git -C "$work/vendor" commit --quiet -F "$work/message"
  git -C "$work/vendor" push --quiet origin HEAD:refs/heads/upstream
  vendor=$(git -C "$work/vendor" rev-parse HEAD)
  summary "Mirrored cursor/plugins@$short onto \`upstream\`."
fi

if git merge-base --is-ancestor "$vendor" HEAD; then
  summary "main already has cursor/plugins@$short."
  exit 0
fi

title="Sync pstack from cursor/plugins@$short"
conflicts=""
if ! git merge --quiet --no-ff --no-edit -m "$title" "$vendor"; then
  conflicts=$(git diff --name-only --diff-filter=U)
  git add -A
  git commit --quiet --no-verify -m "$title (unresolved conflicts)"
fi

validation=$(node sync/validate.ts . 2>&1) && valid=yes || valid=no

if [[ -z "$conflicts" && "$valid" == yes ]]; then
  git push --quiet origin HEAD:main
  summary "Merged cursor/plugins@$short into main."
  # Earlier sync pull requests are superseded by this merge. Their branches stay, in case
  # someone was part way through resolving one.
  gh pr list --state open --json number,headRefName \
    -q '.[] | select(.headRefName | startswith("sync/pstack-")) | .number' |
    while read -r number; do
      gh pr close "$number" --comment "Superseded: main merged cursor/plugins@$short cleanly."
    done
  exit 0
fi

head="sync/pstack-$short"
git push --quiet --force origin "HEAD:refs/heads/$head"

{
  echo "Upstream pstack moved to [cursor/plugins@$short]($repository/tree/$rev/$path) and the T3 adaptation no longer applies cleanly, so \`main\` was left as it was."
  echo
  if [[ -n "$conflicts" ]]; then
    echo "### Merge conflicts"
    echo
    echo "Committed with conflict markers; resolve them in this branch."
    echo
    printf -- '- `%s`\n' $conflicts
    echo
  fi
  echo "### Validation (\`node sync/validate.ts\`)"
  echo
  echo '```'
  printf '%s\n' "$validation" | head -200
  echo '```'
  echo
  echo "Rewrite each flagged line with its T3 Code mechanism (see AGENTS.md), keep pstack's wording elsewhere, and merge once \`node sync/validate.ts\` passes. Merge with a merge commit, so the \`upstream\` branch stays an ancestor of \`main\`."
} >"$work/body"

existing=$(gh pr list --state open --head "$head" --json number -q '.[0].number // empty')
if [[ -n "$existing" ]]; then
  gh pr edit "$existing" --body-file "$work/body"
  url=$(gh pr view "$existing" --json url -q .url)
elif ! url=$(gh pr create --base main --head "$head" --title "$title" --body-file "$work/body" 2>"$work/pr-error"); then
  # Actions may be barred from opening pull requests in the repository's settings.
  cat "$work/pr-error" >&2
  printf '\nBranch: `%s`. Actions could not open a pull request: %s\n' "$head" "$(head -c 300 "$work/pr-error")" >>"$work/body"
  url=$(gh issue create --title "$title" --body-file "$work/body")
fi
summary "Sync needs a person: $url"

gh pr list --state open --json number,headRefName \
  -q ".[] | select((.headRefName | startswith(\"sync/pstack-\")) and .headRefName != \"$head\") | .number" |
  while read -r number; do
    gh pr close "$number" --comment "Superseded by $url."
  done
