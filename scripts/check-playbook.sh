#!/usr/bin/env bash
# Preflight for a playbook. Checks every place a new one has to be wired, and says
# which ones are missing, all at once.
#
#   ./scripts/check-playbook.sh                      # all of them
#   ./scripts/check-playbook.sh reply-triage         # one
#
# The point is not to catch typos. It is that a new playbook touches nine places
# across two repos plus beehiiv, and finding them one failure at a time is how a
# two-hour job becomes a two-day job.
#
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VAULT="$HOME/life_os/magnetiz/playbooks"
BUILD="$ROOT/scripts/build-playbook-pdfs.sh"

slugs=()
if [ "$#" -gt 0 ]; then
  slugs=("$@")
else
  for d in "$VAULT"/*-kit; do [ -d "$d" ] && slugs+=("$(basename "$d" -kit)"); done
fi

total_fail=0

for slug in "${slugs[@]}"; do
  echo "══ $slug"
  fail=0
  ok()   { printf "   ok    %s\n" "$1"; }
  bad()  { printf "   MISS  %s\n" "$1"; printf "         → %s\n" "$2"; fail=$((fail+1)); }
  warn() { printf "   note  %s\n" "$1"; }

  # 1. worksheets, the canonical source
  if compgen -G "$VAULT/$slug-kit/*.md" >/dev/null; then
    ok "worksheets ($(ls "$VAULT/$slug-kit"/*.md | wc -l | tr -d ' ') files)"
  else
    bad "worksheets" "create $VAULT/$slug-kit/ and write the .md files there"
  fi

  # 2. PDF source
  src=$(ls "$ROOT"/pdf-src/playbook-*-"$slug".html 2>/dev/null | head -1)
  if [ -n "$src" ]; then ok "pdf source ($(basename "$src"))"
  else bad "pdf source" "cp pdf-src/TEMPLATE.html pdf-src/playbook-NN-$slug.html"; fi

  # 3. registered in the PDF build, with an expected page count
  if grep -q ":$slug:" "$BUILD"; then ok "registered in build-playbook-pdfs.sh"
  else bad "registered in build-playbook-pdfs.sh" "add a \"NN:$slug:PAGES\" row to names= in that script, or it is never rendered"; fi

  # 4. diagram
  if [ -f "$ROOT/assets/diagrams/$slug.svg" ]; then ok "diagram svg"
  else bad "diagram svg" "author assets/diagrams/$slug.svg (hand work, see an existing one)"; fi

  # 5. web page
  page="$ROOT/playbook-$slug.html"
  if [ -f "$page" ]; then ok "web page"
  else bad "web page" "cp an existing playbook-*.html to playbook-$slug.html and rewrite the content"; fi

  # 6. linked from the library index
  if grep -q "playbook-$slug.html" "$ROOT/playbooks.html" 2>/dev/null; then ok "card on playbooks.html"
  else bad "card on playbooks.html" "add a card linking playbook-$slug.html, or nobody can reach it"; fi

  # 7. the kit endpoint will reject an unlisted slug with a 400
  if grep -q "'$slug'" "$ROOT/api/kit-request.js" 2>/dev/null; then ok "slug in KNOWN_PLAYBOOKS"
  else bad "slug in KNOWN_PLAYBOOKS" "add '$slug' to KNOWN_PLAYBOOKS in api/kit-request.js, or every kit request 400s"; fi

  # 8. the page's form must name the slug the API expects
  if [ -f "$page" ] && grep -q "data-playbook=\"$slug\"" "$page"; then ok "form data-playbook matches"
  elif [ -f "$page" ]; then bad "form data-playbook matches" "the form on playbook-$slug.html must carry data-playbook=\"$slug\""; fi

  # 9. every worksheet is named on the PDF's "In this kit" page
  pdf="$ROOT/assets/kits/pdf/$slug-playbook.pdf"
  if [ -f "$pdf" ] && command -v pdftotext >/dev/null; then
    missing=""
    for f in "$VAULT/$slug-kit"/*.md; do
      n=$(basename "$f")
      pdftotext "$pdf" - 2>/dev/null | grep -qF "$n" || missing="$missing $n"
    done
    if [ -z "$missing" ]; then ok "pdf index names every worksheet"
    else bad "pdf index names every worksheet" "not listed on the In this kit page:$missing"; fi
  else
    warn "pdf not rendered yet, skipping the index check (run build-playbook-pdfs.sh)"
  fi

  # 10. shipped kit
  if [ -f "$ROOT/assets/kits/$slug-kit.zip" ]; then ok "kit zip built"
  else warn "kit zip not built yet (run build-kits.sh)"; fi

  # beehiiv lives outside the repo and its id is a Vercel Sensitive var, so it cannot
  # be checked from here. Naming it is the point: it is the step people forget.
  warn "beehiiv automation + BEEHIIV_KIT_AUTOMATIONS entry: verify by hand, see magnetiz/playbooks/automation-emails.md"

  if [ "$fail" -eq 0 ]; then echo "   ── wired"; else echo "   ── $fail missing"; total_fail=$((total_fail+fail)); fi
  echo
done

exit $((total_fail > 0))
