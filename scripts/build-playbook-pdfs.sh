#!/usr/bin/env bash
# Render the playbook PDFs from pdf-src/*.html.
#
# Read pdf-src/README.md before editing a source or adding a playbook.
#
# Pipeline, reproduced and verified 2026-09-17 against the shipped files:
#   1. serve the repo root over localhost, so /assets/... resolves exactly as it does
#      in production (brand fonts, diagrams). Never use file:// — the font CSS uses
#      site-absolute paths and silently falls back to system fonts under file://,
#      which is how these shipped in Helvetica Neue for two weeks.
#   2. Chrome headless --print-to-pdf. The page CSS carries @page { size: letter }.
#   3. a plain pypdf rewrite, which sets Producer to pypdf and drops ~7%.
#
# Output lands in assets/kits/pdf/. scripts/build-kits.sh picks it up from there.
#
#   ./scripts/build-playbook-pdfs.sh              # all of them
#   ./scripts/build-playbook-pdfs.sh 02 05        # just these
#
# Page counts are asserted. A layout edit that spills onto an extra page fails the
# build rather than shipping quietly. To add a playbook, add a row to `names` below.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/kits/pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PY="${PLAYBOOK_PDF_PYTHON:-python3}"
PORT="${PLAYBOOK_PDF_PORT:-8731}"

# number : kit slug : expected page count
names=(
  "01:meeting-intelligence:7"
  "02:stalled-build-handoff:5"
  "03:ai-ready-data:5"
  "04:inbound-signup-routing:5"
  "05:reply-triage:5"
  "06:crm-enrichment-review:5"
  "07:brand-voice-context-layer:5"
  "08:target-account-ads:5"
  "09:provable-icp:5"
  "10:ai-rollout-one-number:5"
  "11:buying-signal-testing:5"
  "12:champion-job-change:5"
  "13:hubspot-lead-scoring:5"
)

[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME" >&2; exit 1; }

# pypdf, without asking anything of the system Python. Homebrew's is externally
# managed (PEP 668), so installing into it needs --break-system-packages. Build our
# own venv instead, once, and reuse it. Override with PLAYBOOK_PDF_PYTHON.
if ! "$PY" -c 'import pypdf' 2>/dev/null; then
  VENV="$ROOT/.venv"
  if [ ! -x "$VENV/bin/python" ]; then
    echo "setting up $VENV (one time, for pypdf)"
    "$PY" -m venv "$VENV" >/dev/null
  fi
  "$VENV/bin/python" -m pip install --quiet --disable-pip-version-check pypdf || {
    echo "could not install pypdf into $VENV" >&2; exit 1; }
  PY="$VENV/bin/python"
fi

mkdir -p "$OUT"
WORK="$(mktemp -d)"

cd "$ROOT"
set +m   # no job-control chatter when the trap kills the server
"$PY" -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
# Keep the script's own exit status. Without capturing it first, `wait` on the killed
# server returns 143 and that becomes the script's status, failing every && chain.
# Every step needs `|| true`: under `set -e` a non-zero `wait` (143, the SIGTERM we
# just sent) aborts the trap before `exit $status` runs, and 143 leaks out as the
# script's status.
cleanup() {
  status=$?
  kill $SERVER 2>/dev/null || true
  wait $SERVER 2>/dev/null || true
  rm -rf "$WORK" || true
  exit $status
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  curl -sf "http://127.0.0.1:$PORT/pdf-src/playbook.css" -o /dev/null && break
  sleep 0.25
done
curl -sf "http://127.0.0.1:$PORT/pdf-src/playbook.css" -o /dev/null || {
  echo "local server never came up on port $PORT" >&2; exit 1; }

fail=0
for entry in "${names[@]}"; do
  num="${entry%%:*}"; rest="${entry#*:}"; kit="${rest%%:*}"; want="${rest##*:}"

  if [ "$#" -gt 0 ]; then
    case " $* " in *" $num "*) ;; *) continue ;; esac
  fi

  page="pdf-src/playbook-$num-$kit.html"
  [ -f "$ROOT/$page" ] || { echo "MISSING $page" >&2; fail=1; continue; }

  "$CHROME" --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
    --print-to-pdf="$WORK/$kit.raw.pdf" "http://127.0.0.1:$PORT/$page" >/dev/null 2>&1

  "$PY" - "$WORK/$kit.raw.pdf" "$OUT/$kit-playbook.pdf" <<'PY'
import sys
from pypdf import PdfReader, PdfWriter
reader, writer = PdfReader(sys.argv[1]), PdfWriter()
for page in reader.pages:
    writer.add_page(page)
with open(sys.argv[2], "wb") as fh:
    writer.write(fh)
PY

  pdf="$OUT/$kit-playbook.pdf"
  got="$("$PY" -c "from pypdf import PdfReader;print(len(PdfReader('$pdf').pages))")"
  # The brand faces embed as composite CID fonts, which pypdf's /BaseFont lookup
  # returns None for. Scan the file bytes instead; subset font names sit there
  # uncompressed, and "did the brand font embed" is exactly what needs to be true.
  fonts="$("$PY" -c "
d = open('$pdf','rb').read()
print(','.join(n for n in ('DMSans','JetBrainsMono','Menlo') if n.encode() in d))")"

  if [ "$got" != "$want" ]; then
    echo "FAIL $kit: rendered $got pages, expected $want. Layout spilled; fix the source or update the expectation." >&2
    fail=1
  elif ! printf '%s' "$fonts" | grep -q 'DMSans'; then
    echo "FAIL $kit: DM Sans did not embed (got $fonts). The server or /assets/fonts is not resolving." >&2
    fail=1
  else
    echo "$kit-playbook.pdf  $got pages  $(stat -f%z "$pdf") bytes  [$fonts]"
  fi
done

exit $fail
