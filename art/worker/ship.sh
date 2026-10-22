#!/bin/sh
# usage: art/worker/ship.sh "<DELIVERED line>" "<commit msg>"  -- appends the line, commits worker files, pushes
cd "$(dirname "$0")/../.." || exit 1
echo "$1" >> art/DELIVERED.md
git add models/gen art/DELIVERED.md art/worker
git commit -q -m "$2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PQPpcnaNCMJua3ZyQYmvfh" || exit 1
for i in 1 2 3 4 5; do
  git push -q origin HEAD:main && exit 0
  git pull -q --rebase origin main; sleep $i
done
exit 1
