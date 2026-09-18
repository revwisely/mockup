#!/usr/bin/env bash
# Rebuild the seven playbook kit zips.
#
# Each zip is: the kit's markdown worksheets (canonical source, edited in the vault)
# plus the rendered playbook PDF. A PDF in assets/kits/pdf/ wins; otherwise the one
# already inside the zip is carried forward untouched. Render them with
# scripts/build-playbook-pdfs.sh, whose source lives in pdf-src/.
#
#   ./scripts/build-kits.sh
#
set -euo pipefail

VAULT="$HOME/life_os/magnetiz/playbooks"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KITS="$ROOT/assets/kits"
PDFS="$KITS/pdf"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Drive from the vault, never from the existing zips. A new playbook has worksheets
# and a rendered PDF but no zip yet, so iterating over *-kit.zip would skip it in
# silence — which is exactly what the weekly build produces.
shopt -s nullglob
for src in "$VAULT"/*-kit; do
  kit="$(basename "$src")"
  zip="$KITS/$kit.zip"

  if ! compgen -G "$src/*.md" >/dev/null; then
    echo "SKIP $kit (no worksheets in $src)" >&2
    continue
  fi

  stage="$WORK/$kit"
  mkdir -p "$stage"

  # A freshly rendered PDF wins; otherwise carry the current zip's forward.
  fresh="$PDFS/${kit%-kit}-playbook.pdf"
  if [ -f "$fresh" ]; then
    cp "$fresh" "$stage/"
    pdf_src="rendered"
  else
    unzip -qj "$zip" '*.pdf' -d "$stage" || {
      echo "FAIL $kit (no rendered PDF, and none in the existing zip)" >&2
      exit 1
    }
    pdf_src="carried"
  fi

  cp "$src"/*.md "$stage/"

  ( cd "$WORK" && rm -f "$kit.zip" && zip -qr "$kit.zip" "$kit" -x '.*' '__MACOSX/*' )
  mv "$WORK/$kit.zip" "$zip"

  echo "$kit  ->  $(unzip -l "$zip" | tail -1 | awk '{print $2}') files (pdf $pdf_src)"
done
