/* ==========================================================
   AI AUDIT PAGE — Page-specific overrides
   Replaces hero terminal content and CTA prompt for the
   audit page. Loaded after animations.js, before main.js.
   ========================================================== */

/* -----------------------------------------------------------
   AUDIT HERO CODE LINES
   Diagnostic scan output instead of the homepage code
   ----------------------------------------------------------- */
const auditCodeLines = [
  '<span class="syn-cm">$ magnetiz diagnose --target production</span>',
  '',
  '<span class="syn-kw">[INFO]</span> Loading trace data...',
  '<span class="syn-kw">[INFO]</span> Analyzing <span class="syn-fn">2,847</span> production traces',
  '',
  '<span class="syn-cl">[SCAN]</span> Module: <span class="syn-st">intent_classifier</span>',
  '  ├─ accuracy: <span class="syn-am">0.73</span>    <span class="syn-cm">← below threshold</span>',
  '  ├─ failures: <span class="syn-am">412</span>/2847 (<span class="syn-am">14.5%</span>)',
  '  └─ top_error: <span class="syn-st">"misclassified_intent"</span>',
  '',
  '<span class="syn-cl">[SCAN]</span> Module: <span class="syn-st">response_generator</span>',
  '  ├─ hallucination_rate: <span class="syn-am">0.12</span>',
  '  ├─ failures: <span class="syn-am">198</span>/2847 (<span class="syn-am">7.0%</span>)',
  '  └─ eval_coverage: <span class="syn-am">0%</span>   <span class="syn-cm">← no evals</span>',
  '',
  '<span class="syn-kw">[RESULT]</span> <span class="syn-fn">3</span> critical failure modes found',
  '<span class="syn-kw">[RESULT]</span> Recommended: <span class="syn-cl">build eval framework</span>',
  '<span class="syn-cm"># Assessment complete — report generating...</span>',
];

/* -----------------------------------------------------------
   OVERRIDE: Hero Terminal
   Uses audit-specific diagnostic code lines
   ----------------------------------------------------------- */
// Replace the homepage initHeroTerminal with the audit version
initHeroTerminal = function () {
  const codeContent = document.getElementById('hero-code-content');
  const lineNumbers = document.getElementById('hero-line-numbers');
  if (!codeContent) return;

  setTimeout(() => {
    const typer = new TerminalTyper(codeContent, lineNumbers, auditCodeLines, {
      lineDelay: 90,
      onComplete: cycleAuditStatus,
    });
    typer.start();
  }, 600);
};

/* -----------------------------------------------------------
   AUDIT STATUS CYCLE
   SCANNING → ANALYZING → COMPLETE
   ----------------------------------------------------------- */
function cycleAuditStatus() {
  const statusEl = document.getElementById('hero-status');
  const posEl = document.getElementById('hero-pos');
  if (!statusEl) return;

  const states = [
    { text: 'ANALYZING', cls: 'status-amber' },
    { text: 'COMPLETE', cls: 'status-ready' },
  ];

  let i = 0;
  function next() {
    if (i >= states.length) return;
    const s = states[i];
    statusEl.textContent = s.text;
    statusEl.className = s.cls;
    if (posEl && i === 1) posEl.textContent = 'Ln 17, Col 1';
    i++;
    if (i < states.length) setTimeout(next, 2000);
  }

  setTimeout(next, 1200);
}

/* -----------------------------------------------------------
   OVERRIDE: CTA Prompt
   Types "start --audit" instead of "start --ai-audit"
   ----------------------------------------------------------- */
initCtaPrompt = function () {
  const promptEl = document.getElementById('cta-typed');
  if (!promptEl) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const typer = new PromptTyper(promptEl, 'start --audit', 65);
          typer.start();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(promptEl);
};
