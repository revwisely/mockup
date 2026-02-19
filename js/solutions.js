/* ==========================================================
   AI SOLUTIONS PAGE — Page-specific overrides
   Replaces hero terminal content and CTA prompt for the
   solutions page. Loaded after animations.js, before main.js.
   ========================================================== */

/* -----------------------------------------------------------
   SOLUTIONS HERO CODE LINES
   AI Design Sprint planning output
   ----------------------------------------------------------- */
const solutionsCodeLines = [
  '<span class="syn-cm">$ magnetiz sprint --init design_sprint</span>',
  '',
  '<span class="syn-kw">from</span> magnetiz <span class="syn-kw">import</span> <span class="syn-cl">DesignSprint</span>',
  '',
  'sprint = <span class="syn-cl">DesignSprint</span>(',
  '    client=<span class="syn-st">"operations_team"</span>,',
  '    goal=<span class="syn-st">"ai_automation"</span>',
  ')',
  '',
  '<span class="syn-cm"># Sprint modules loaded:</span>',
  '<span class="syn-kw">[1]</span> <span class="syn-st">opportunity_mapping</span>    <span class="syn-fn">✓ ready</span>',
  '<span class="syn-kw">[2]</span> <span class="syn-st">process_mapping</span>       <span class="syn-fn">✓ ready</span>',
  '<span class="syn-kw">[3]</span> <span class="syn-st">concept_development</span>   <span class="syn-fn">✓ ready</span>',
  '<span class="syn-kw">[4]</span> <span class="syn-st">assessment</span>            <span class="syn-fn">✓ ready</span>',
  '<span class="syn-kw">[5]</span> <span class="syn-st">technical_check</span>       <span class="syn-fn">✓ ready</span>',
  '<span class="syn-kw">[6]</span> <span class="syn-st">adoption_training</span>     <span class="syn-fn">✓ ready</span>',
  '<span class="syn-kw">[7]</span> <span class="syn-st">documentation</span>         <span class="syn-fn">✓ ready</span>',
  '',
  'sprint.run() <span class="syn-cm"># → validated AI concept</span>',
];

/* -----------------------------------------------------------
   OVERRIDE: Hero Terminal
   Uses solutions-specific sprint code lines
   ----------------------------------------------------------- */
initHeroTerminal = function () {
  const codeContent = document.getElementById('hero-code-content');
  const lineNumbers = document.getElementById('hero-line-numbers');
  if (!codeContent) return;

  setTimeout(() => {
    const typer = new TerminalTyper(codeContent, lineNumbers, solutionsCodeLines, {
      lineDelay: 100,
      onComplete: cycleSprintStatus,
    });
    typer.start();
  }, 600);
};

/* -----------------------------------------------------------
   SPRINT STATUS CYCLE
   INITIALIZING → MAPPING → SPRINT ACTIVE
   ----------------------------------------------------------- */
function cycleSprintStatus() {
  const statusEl = document.getElementById('hero-status');
  const posEl = document.getElementById('hero-pos');
  if (!statusEl) return;

  const states = [
    { text: 'MAPPING', cls: 'status-amber' },
    { text: 'SPRINT ACTIVE', cls: 'status-ready' },
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
   Types "start --design-sprint" instead of default
   ----------------------------------------------------------- */
initCtaPrompt = function () {
  const promptEl = document.getElementById('cta-typed');
  if (!promptEl) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const typer = new PromptTyper(promptEl, 'start --design-sprint', 65);
          typer.start();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(promptEl);
};
