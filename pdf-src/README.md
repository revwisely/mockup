---
name: Playbook PDF build system
read_by: Any session building, editing, or adding a Magnetiz playbook PDF. Linked from
  the vault at life_os/CLAUDE.md and magnetiz/playbooks/README.md, and named in
  .claude/skills/magnetiz-web-copy/SKILL.md so a playbook session loads it.
---

# Playbook PDF build system

The rendered playbook PDF that ships inside every implementation kit is built from the
HTML in this folder. One playbook goes out per week, so the job is not "make a PDF." It
is **make the eighth one indistinguishable from the first seven.**

## Build it

```bash
cd ~/Projects/magnetiz_new
./scripts/build-playbook-pdfs.sh          # all of them
./scripts/build-playbook-pdfs.sh 02 05    # just these
./scripts/build-kits.sh                   # fold the PDFs into the kit zips
npx vercel deploy --prod                  # the only deploy command for this repo
```

Needs Chrome at `/Applications/Google Chrome.app`. Nothing else to install. The build
needs `pypdf`, and Homebrew's Python is externally managed (PEP 668), so rather than
ask you to `--break-system-packages` your system Python it creates `.venv/` in the repo
on first run and reuses it. That directory is gitignored and safe to delete; the next
run rebuilds it. `PLAYBOOK_PDF_PYTHON` overrides the interpreter if you want your own.

## Shipping a new playbook (the weekly job)

**Start and finish with the preflight.** It names every place a playbook has to be
wired, all at once, instead of one deploy failure at a time.

```bash
./scripts/check-playbook.sh <slug>
```

Nine wiring points, across two repos plus beehiiv:

| # | Thing | Where | If you forget |
|---|---|---|---|
| 1 | Worksheets | `~/life_os/magnetiz/playbooks/<slug>-kit/*.md` | the kit ships empty |
| 2 | PDF source | `pdf-src/playbook-NN-<slug>.html`, from `TEMPLATE.html` | no PDF |
| 3 | A row in `names=` | `scripts/build-playbook-pdfs.sh` | **the PDF is never rendered, silently** |
| 4 | Diagram | `assets/diagrams/<slug>.svg` | the page and PDF have a hole |
| 5 | Web page | `playbook-<slug>.html` | nothing to link to |
| 6 | Index card | `playbooks.html` | the page exists but nobody reaches it |
| 7 | `KNOWN_PLAYBOOKS` | `api/kit-request.js` | **every kit request 400s** |
| 8 | Form slug | `data-playbook="<slug>"` on the page's form | same 400 |
| 8b | `/playbook/<slug>` and `/k/<slug>` rewrites | `vercel.json` | **the delivery email's kit link 404s** |
| 8c | Share image, and the page's `og:image` | `assets/og/<slug>.jpg` | LinkedIn shows a title-only card |
| 9 | beehiiv automation + its id in `BEEHIIV_KIT_AUTOMATIONS` | beehiiv, then Vercel env | the form succeeds and **no email ever sends** |

Then the three commands, and the preflight once more to confirm.

**What is genuinely hand work**, and there is no shortcut for it:

- **The diagram.** Hand-authored SVG with animated packets and `id="n-*"` nodes that the
  page's accordion highlights. Copy the closest existing one and rework it. This is the
  longest part of a new playbook.
- **The page copy**, which is the actual job.
- **The beehiiv automation and its two emails.** UI work. `automation-emails.md` in the
  vault carries the pattern, the copy for all fourteen existing emails, and the three
  failure modes worth knowing before you start.

**What is not hand work:** the PDF design, the page design (all seven share
`/css/playbooks.css`, no page has its own CSS), the zip, and the deploy.

## What the build actually does

1. **Serves the repo root over localhost.** Not `file://`. The brand font CSS uses
   site-absolute paths (`/assets/fonts/...`), which resolve to nothing under `file://`.
   Chrome then falls back to system fonts without complaint, which is exactly how these
   shipped in Helvetica Neue and Menlo for two weeks before anyone noticed.
2. **Chrome headless `--print-to-pdf`.** `@page { size: letter; margin: 0 }` in the CSS
   does the page geometry, and each `.page` div is one physical page.
3. **A plain pypdf rewrite.** Sets `Producer: pypdf` and drops about 7%.

## The two assertions, and why they exist

The build fails rather than shipping when either breaks.

| Assertion | The bug it catches |
|---|---|
| Page count per playbook | A copy edit that pushes content onto an eighth page. Silent, and invisible until a reader opens the file. |
| DM Sans present in the output | The font path broke and Chrome quietly substituted a system face. This is the bug that actually happened. |

Adding a playbook means adding a row to `names` in `scripts/build-playbook-pdfs.sh`
with its expected page count. A playbook with no row does not get built.

## Staying on brand

**The design system is `playbook.css`, and it is the only stylesheet.** All seven
playbooks link it. Before this it was pasted into each file, byte-identical seven times,
which means week eight would have diverged and nobody would have seen it.

- **Never add a `<style>` block to a playbook.** Per-page inline `style=` attributes for
  one-off spacing are fine and already used throughout. A rule that should apply to every
  playbook goes in `playbook.css`.
- **Fonts are DM Sans and JetBrains Mono**, self-hosted at `/assets/fonts/`, the same
  faces the website loads. They are imported at the top of `playbook.css`. Do not
  declare a font family that is not one of those two.
- **Colours come from the `:root` variables.** `--blue` is the accent, the four
  semantic colours (`--green --amber --purple --coral`) carry meaning in chips and table
  cells and should keep meaning the same thing across playbooks.
- **The page shape is fixed**: 8.5x11in, 0.75in padding, the dot-grid background, and a
  footer on every page carrying the logo and the page number.

## Page structure

`TEMPLATE.html` is the skeleton, with every block pattern the seven shipped playbooks
use. Copy it to `playbook-NN-<kit-slug>.html`. The running order is:

1. **Cover.** Eyebrow, three-line H1, lead paragraph, function chips plus month, and a
   pull-quote anchored at the bottom naming the failure the playbook fixes.
2. **The system, end to end.** The workflow diagram, full page, the same SVG the web
   page uses from `/assets/diagrams/`.
3. **The method.** Numbered steps with `.step`, optional `.watch` line for a real failure
   mode, tables for anything with cases.
4. **Exhibits.** A JSON shape, a UI mock, or a fill-in worksheet table. One per page.
5. **In this kit, plus the CTA.** Always last.

## The rule that got broken once

**Every `.md` file in the kit folder must be named on the "In this kit" page.** Playbook
02 shipped a worksheet that the PDF's own index did not list, and it took an outside
reviewer to catch it. When two worksheets serve the same step, pair them in one box.
Never drop one to keep the page from spilling — shorten the descriptions instead.

## Where everything lives

| Thing | Path |
|---|---|
| PDF sources | `pdf-src/playbook-NN-<kit>.html` |
| Design system | `pdf-src/playbook.css` |
| Template | `pdf-src/TEMPLATE.html` |
| Build script | `scripts/build-playbook-pdfs.sh` |
| Rendered output | `assets/kits/pdf/` (gitignored, rebuild it) |
| Kit zips | `assets/kits/<kit>-kit.zip` (committed) |
| Kit worksheets, canonical | `~/life_os/magnetiz/playbooks/<kit>/*.md` |
| Diagrams | `assets/diagrams/<kit>.svg` |
| Brand fonts | `assets/fonts/` |

The worksheets are authored in the vault and copied into the zips by
`scripts/build-kits.sh`. Edit them there, never inside a zip.
