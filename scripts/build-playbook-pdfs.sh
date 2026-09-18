#!/usr/bin/env bash
# Render the playbook PDFs from pdf-src/*.html.
#
# Pipeline, reproduced and verified 2026-09-17 against the shipped files:
#   1. Chrome headless --print-to-pdf  (the page CSS carries @page { size: letter })
#   2. a plain pypdf rewrite, which is what sets Producer to pypdf and drops ~7%
#
# Output lands in assets/kits/pdf/. scripts/build-kits.sh picks it up from there when
# rebuilding the zips; without it, that script carries the PDF already inside each zip
# forward untouched.
#
#   ./scripts/build-playbook-pdfs.sh              # all seven
#   ./scripts/build-playbook-pdfs.sh 01 02        # just these
#
# Page counts are asserted below. A layout edit that spills onto an extra page fails
# the build rather than shipping quietly.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/pdf-src"
OUT="$ROOT/assets/kits/pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PY="${PLAYBOOK_PDF_PYTHON:-python3}"

# slug -> kit name, and the page count this playbook is expected to render to.
names=(
  "01:meeting-intelligence:7"
  "02:stalled-build-handoff:5"
  "03:ai-ready-data:5"
  "04:inbound-signup-routing:5"
  "05:reply-triage:5"
  "06:crm-enrichment-review:5"
  "07:brand-voice-context-layer:5"
)

[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME" >&2; exit 1; }
"$PY" -c 'import pypdf' 2>/dev/null || {
  echo "pypdf missing. pip install pypdf, or set PLAYBOOK_PDF_PYTHON to an interpreter that has it." >&2
  exit 1
}

mkdir -p "$OUT"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT

fail=0
for entry in "${names[@]}"; do
  num="${entry%%:*}"; rest="${entry#*:}"; kit="${rest%%:*}"; want="${rest##*:}"

  if [ "$#" -gt 0 ]; then
    case " $* " in *" $num "*) ;; *) continue ;; esac
  fi

  html="$SRC/playbook-$num-$kit.html"
  [ -f "$html" ] || { echo "MISSING $html" >&2; fail=1; continue; }

  "$CHROME" --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
    --print-to-pdf="$WORK/$kit.raw.pdf" "file://$html" >/dev/null 2>&1

  "$PY" - "$WORK/$kit.raw.pdf" "$OUT/$kit-playbook.pdf" <<'PY'
import sys
from pypdf import PdfReader, PdfWriter
reader, writer = PdfReader(sys.argv[1]), PdfWriter()
for page in reader.pages:
    writer.add_page(page)
with open(sys.argv[2], "wb") as fh:
    writer.write(fh)
PY

  got="$("$PY" -c "from pypdf import PdfReader;print(len(PdfReader('$OUT/$kit-playbook.pdf').pages))")"
  if [ "$got" != "$want" ]; then
    echo "FAIL $kit: rendered $got pages, expected $want. Layout spilled; fix the source or update the expectation." >&2
    fail=1
  else
    echo "$kit-playbook.pdf  $got pages  $(stat -f%z "$OUT/$kit-playbook.pdf") bytes"
  fi
done

exit $fail
