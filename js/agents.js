/* ==========================================================
   AI AGENTS PAGE — Page-specific overrides
   Replaces hero terminal content and CTA prompt.
   Loaded after animations.js, before main.js.
   ========================================================== */

/* -----------------------------------------------------------
   AGENTS HERO CODE LINES
   Agent deployment status output
   ----------------------------------------------------------- */
const agentsCodeLines = [
  '<span class="syn-cm">$ magnetiz agents --status production</span>',
  '',
  '<span class="syn-kw">from</span> magnetiz <span class="syn-kw">import</span> <span class="syn-cl">AgentFleet</span>, <span class="syn-cl">Guardrails</span>',
  '',
  'fleet = <span class="syn-cl">AgentFleet</span>(',
  '    mode=<span class="syn-st">"production"</span>,',
  '    guardrails=<span class="syn-cl">Guardrails</span>(<span class="syn-st">"strict"</span>)',
  ')',
  '',
  '<span class="syn-cm"># Active agents:</span>',
  '<span class="syn-fn">►</span> <span class="syn-st">support_router</span>       <span class="syn-fn">✓ 2.4k tickets/day</span>',
  '<span class="syn-fn">►</span> <span class="syn-st">invoice_recon</span>        <span class="syn-fn">✓ 98.7% match rate</span>',
  '<span class="syn-fn">►</span> <span class="syn-st">lead_enrichment</span>      <span class="syn-fn">✓ &lt;3s routing</span>',
  '<span class="syn-fn">►</span> <span class="syn-st">alert_correlation</span>    <span class="syn-fn">✓ 91% noise reduced</span>',
  '<span class="syn-fn">►</span> <span class="syn-st">onboarding_orch</span>      <span class="syn-fn">✓ 0 blockers open</span>',
  '<span class="syn-fn">►</span> <span class="syn-st">procurement_approvals</span> <span class="syn-fn">✓ 4h avg cycle</span>',
  '',
  'fleet.health() <span class="syn-cm"># → all agents operational</span>',
];

/* -----------------------------------------------------------
   OVERRIDE: Hero Terminal
   ----------------------------------------------------------- */
initHeroTerminal = function () {
  const codeContent = document.getElementById('hero-code-content');
  const lineNumbers = document.getElementById('hero-line-numbers');
  if (!codeContent) return;

  setTimeout(() => {
    const typer = new TerminalTyper(codeContent, lineNumbers, agentsCodeLines, {
      lineDelay: 95,
      onComplete: cycleAgentsStatus,
    });
    typer.start();
  }, 600);
};

/* -----------------------------------------------------------
   AGENTS STATUS CYCLE
   DEPLOYING → MONITORING → ALL OPERATIONAL
   ----------------------------------------------------------- */
function cycleAgentsStatus() {
  const statusEl = document.getElementById('hero-status');
  const posEl = document.getElementById('hero-pos');
  if (!statusEl) return;

  const states = [
    { text: 'MONITORING', cls: 'status-amber' },
    { text: 'ALL OPERATIONAL', cls: 'status-ready' },
  ];

  let i = 0;
  function next() {
    if (i >= states.length) return;
    const s = states[i];
    statusEl.textContent = s.text;
    statusEl.className = s.cls;
    if (posEl && i === 1) posEl.textContent = 'Ln 18, Col 1';
    i++;
    if (i < states.length) setTimeout(next, 2000);
  }

  setTimeout(next, 1200);
}

/* -----------------------------------------------------------
   OVERRIDE: CTA Prompt
   ----------------------------------------------------------- */
initCtaPrompt = function () {
  const promptEl = document.getElementById('cta-typed');
  if (!promptEl) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const typer = new PromptTyper(promptEl, 'deploy --agents', 65);
          typer.start();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(promptEl);
};
