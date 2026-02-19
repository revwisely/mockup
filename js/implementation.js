/* ==========================================================
   AI IMPLEMENTATION PAGE — Page-specific overrides
   Replaces hero terminal content and CTA prompt.
   Loaded after animations.js, before main.js.
   ========================================================== */

/* -----------------------------------------------------------
   IMPLEMENTATION HERO CODE LINES
   Project implementation plan output
   ----------------------------------------------------------- */
const implCodeLines = [
  '<span class="syn-cm">$ magnetiz implement --mode end-to-end</span>',
  '',
  '<span class="syn-kw">from</span> magnetiz <span class="syn-kw">import</span> <span class="syn-cl">Implementation</span>',
  '',
  'project = <span class="syn-cl">Implementation</span>(',
  '    scope=<span class="syn-st">"end_to_end"</span>,',
  '    owner=<span class="syn-st">"magnetiz"</span>',
  ')',
  '',
  '<span class="syn-cm"># Delivery pipeline:</span>',
  '<span class="syn-kw">[01]</span> use_case_prioritization  <span class="syn-fn">✓ ranked</span>',
  '<span class="syn-kw">[02]</span> roadmap_development      <span class="syn-fn">✓ defined</span>',
  '<span class="syn-kw">[03]</span> stakeholder_alignment    <span class="syn-fn">✓ aligned</span>',
  '<span class="syn-kw">[04]</span> sprint_planning          <span class="syn-fn">✓ scoped</span>',
  '<span class="syn-kw">[05]</span> feasibility_check        <span class="syn-fn">✓ passed</span>',
  '<span class="syn-kw">[06]</span> execution_oversight      <span class="syn-am">⧖ active</span>',
  '<span class="syn-kw">[07]</span> solution_rollout         <span class="syn-cm">○ queued</span>',
  '',
  'project.deploy() <span class="syn-cm"># → transformation</span>',
];

/* -----------------------------------------------------------
   OVERRIDE: Hero Terminal
   ----------------------------------------------------------- */
initHeroTerminal = function () {
  const codeContent = document.getElementById('hero-code-content');
  const lineNumbers = document.getElementById('hero-line-numbers');
  if (!codeContent) return;

  setTimeout(() => {
    const typer = new TerminalTyper(codeContent, lineNumbers, implCodeLines, {
      lineDelay: 100,
      onComplete: cycleImplStatus,
    });
    typer.start();
  }, 600);
};

/* -----------------------------------------------------------
   IMPLEMENTATION STATUS CYCLE
   PLANNING → EXECUTING → DEPLOYED
   ----------------------------------------------------------- */
function cycleImplStatus() {
  const statusEl = document.getElementById('hero-status');
  const posEl = document.getElementById('hero-pos');
  if (!statusEl) return;

  const states = [
    { text: 'EXECUTING', cls: 'status-amber' },
    { text: 'DEPLOYED', cls: 'status-ready' },
  ];

  let i = 0;
  function next() {
    if (i >= states.length) return;
    const s = states[i];
    statusEl.textContent = s.text;
    statusEl.className = s.cls;
    if (posEl && i === 1) posEl.textContent = 'Ln 19, Col 1';
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
          const typer = new PromptTyper(promptEl, 'start --implement', 65);
          typer.start();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(promptEl);
};
