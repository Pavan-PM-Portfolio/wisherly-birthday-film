#!/usr/bin/env bash
# Push this folder to GitHub. GitHub Actions then builds and publishes it to Pages.
#
#   1. Create an EMPTY repo on github.com (no README), e.g. Pavan-PM-Portfolio/wisherly-cinematic
#   2. Run:  ./deploy.sh Pavan-PM-Portfolio/wisherly-cinematic
#      (run the same command again after any change to publish an update)
#   3. Paste a GitHub token when asked (needs "repo" + "workflow" scopes). It is not shown or saved.
#   4. On GitHub: Settings → Pages → Source: "GitHub Actions".
set -euo pipefail

REPO="${1:-Pavan-PM-Portfolio/wisherly-cinematic}"
USER_NAME="${REPO%%/*}"

read -r -s -p "GitHub token for $USER_NAME: " TOKEN
echo

[ -d .git ] || git init -q
git add -A
git commit -q -m "${2:-Wisherly cinematic birthday — update}" || echo "(nothing new to commit)"
git branch -M main

git push "https://${USER_NAME}:${TOKEN}@github.com/${REPO}.git" main
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${REPO}.git"
unset TOKEN

echo
echo "Pushed. Now open https://github.com/${REPO}/settings/pages and set Source to \"GitHub Actions\"."
echo "Your site will be at https://${USER_NAME,,}.github.io/${REPO#*/}/ once the Actions run finishes."
