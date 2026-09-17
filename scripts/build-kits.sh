#!/usr/bin/env bash
# Rebuild the seven playbook kit zips.
#
# Each zip is: the kit's markdown worksheets (canonical source, edited in the vault)
# plus the rendered playbook PDF. The PDF has no generator in this repo — it is carried
# forward from the existing zip, so this script never regenerates it. If a PDF's own
# content needs to change, that is a separate job.
#
#   ./scripts/build-kits.sh
#
set -euo pipefail

VAULT="$HOME/life_os/magnetiz/playbooks"
KITS="$(cd "$(dirname "$0")/.." && pwd)/assets/kits"
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

  # Carry the rendered PDF forward from the current zip.
  unzip -qj "$zip" '*.pdf' -d "$stage" || {
    echo "FAIL $kit (no PDF in the existing zip)" >&2
    exit 1
  }

  cp "$src"/*.md "$stage/"

  ( cd "$WORK" && rm -f "$kit.zip" && zip -qr "$kit.zip" "$kit" -x '.*' '__MACOSX/*' )
  mv "$WORK/$kit.zip" "$zip"

  echo "$kit  ->  $(unzip -l "$zip" | tail -1 | awk '{print $2}') files"
done
