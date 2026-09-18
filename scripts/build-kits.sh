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

for zip in "$KITS"/*-kit.zip; do
  kit="$(basename "$zip" .zip)"
  src="$VAULT/$kit"

  if [ ! -d "$src" ]; then
    echo "SKIP $kit (no source at $src)" >&2
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
