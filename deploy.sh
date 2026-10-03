#!/usr/bin/env bash
# Push this folder to GitHub. GitHub Actions then builds and publishes it to Pages.
#
#   1. Create an EMPTY repo on github.com (no README), e.g. Pavan-PM-Portfolio/wisherly-birthday-film
#   2. Run:  ./deploy.sh Pavan-PM-Portfolio/wisherly-birthday-film "What changed"
#      (run it again after any change; a freshly unzipped folder picks up the repo's history first)
#   3. Paste a GitHub token when asked (classic, "repo" + "workflow" scopes). It is not shown or saved.
#   4. Once, on GitHub: Settings → Pages → Source: "GitHub Actions".
set -euo pipefail

REPO="${1:-Pavan-PM-Portfolio/wisherly-birthday-film}"
USER_NAME="${REPO%%/*}"
REMOTE="https://github.com/${REPO}.git"

read -r -s -p "GitHub token for $USER_NAME: " TOKEN
echo
AUTH="https://${USER_NAME}:${TOKEN}@github.com/${REPO}.git"

if [ ! -d .git ]; then
  git init -q
  # If the repo already has commits (an earlier deploy), build on top of them.
  if git fetch -q "$AUTH" main 2>/dev/null; then
    git reset -q --soft FETCH_HEAD
    echo "(continuing from the existing history on GitHub)"
  fi
fi

git add -A
git commit -q -m "${2:-Wisherly birthday film: update}" || echo "(nothing new to commit)"
git branch -M main

git push "$AUTH" main
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
unset TOKEN AUTH

OWNER_LC="$(printf '%s' "$USER_NAME" | tr '[:upper:]' '[:lower:]')"
echo
echo "Pushed. If this is the first deploy, open https://github.com/${REPO}/settings/pages and set Source to \"GitHub Actions\"."
echo "Your site will be at https://${OWNER_LC}.github.io/${REPO#*/}/ once the Actions run finishes (2–3 minutes)."
