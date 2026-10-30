#!/bin/bash
# Push the GOLDEN FINANCIAL SERVICES admin portal to GitHub.
#
# Usage:
#   ./push-to-github.sh                       # uses the default repo below, prompts for credentials
#   ./push-to-github.sh <repo-url>            # pushes to a different repo
#   GH_TOKEN=<fine-grained-PAT> ./push-to-github.sh
#
set -e
cd "$(dirname "$0")"

REPO_URL="${1:-https://github.com/wwwmaryemmanuel01/golden-loan-services.git}"
[ "${REPO_URL%.git}" = "$REPO_URL" ] && REPO_URL="$REPO_URL.git"

if [ -n "$GH_TOKEN" ]; then
  PUSH_URL="https://x-access-token:${GH_TOKEN}@${REPO_URL#https://}"
else
  PUSH_URL="$REPO_URL"
fi

# make sure everything current is committed
git add -A
git diff --cached --quiet || git commit -q -m "Update admin portal"

git remote remove origin 2>/dev/null || true
git remote add origin "$PUSH_URL"
git branch -M main

# if the repo already has commits (e.g. an auto-created README), rebase onto them first
if git ls-remote --heads origin main | grep -q main; then
  echo "Remote has existing commits — rebasing local history onto origin/main…"
  git fetch origin main
  git rebase origin/main
fi

git push -u origin main
echo
echo "Pushed to ${REPO_URL%.git}"
echo "Enable Pages: Settings → Pages → Deploy from a branch → main → /(root)"
echo "Site: https://${REPO_URL#https://github.com/}" | sed 's|\.git$||'
