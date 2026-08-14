/* ==========================================================
   MAGNETIZ.AI — Animation Engine
   Terminal typing, scroll reveals, counter animations
   ========================================================== */

/* -----------------------------------------------------------
   TERMINAL CODE TYPER
   Reveals pre-highlighted code lines one at a time with
   natural timing to simulate live coding.
   ----------------------------------------------------------- */
class TerminalTyper {
  constructor(container, lineNumEl, lines, options = {}) {
    this.container = container;
    this.lineNumEl = lineNumEl;
    this.lines = lines;
    this.index = 0;
    this.lineDelay = options.lineDelay || 120;
    this.onComplete = options.onComplete || null;
  }

  start() {
    this.showNextLine();
  }

  showNextLine() {
    if (this.index >= this.lines.length) {
      this.addCursor();
      if (this.onComplete) this.onComplete();
      return;
    }

    const html = this.lines[this.index];
    const el = document.createElement('div');
    el.className = 'code-line';
    el.innerHTML = html || '\u00A0';
    el.style.opacity = '0';
    el.style.transform = 'translateX(-4px)';
    this.container.appendChild(el);

    // Update line numbers
    this.updateLineNumbers();

    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.12s ease, transform 0.12s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    });

    this.index++;

    // Variable timing: empty lines are fast, code lines have natural variance
    const isEmpty = html === '' || html === '\u00A0';
    const delay = isEmpty
      ? 60
      : this.lineDelay + Math.random() * 100;

    setTimeout(() => this.showNextLine(), delay);
  }

  updateLineNumbers() {
    if (!this.lineNumEl) return;
    const count = this.container.children.length;
    this.lineNumEl.innerHTML = Array.from(
      { length: count },
      (_, i) => (i + 1)
    ).join('<br>');
  }

  addCursor() {
    const lastLine = this.container.lastElementChild;
    if (lastLine) {
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      lastLine.appendChild(cursor);
    }
  }
}

/* -----------------------------------------------------------
   HERO CODE CONTENT
   Pre-highlighted Python code for the hero terminal
   ----------------------------------------------------------- */
const heroCodeLines = [
  '<span class="syn-kw">from</span> magnetiz <span class="syn-kw">import</span> <span class="syn-cl">Agent</span>, <span class="syn-cl">EvalFramework</span>',
  '',
  '<span class="syn-kw">class</span> <span class="syn-cl">ProductionAgent</span>(<span class="syn-cl">Agent</span>):',
  '    <span class="syn-st">"""Evaluation-first. Production-ready."""</span>',
  '',
  '    model = <span class="syn-st">"gpt-4-turbo"</span>',
  '    eval = <span class="syn-cl">EvalFramework</span>(',
  '        assertions=[<span class="syn-st">"accuracy &gt; 0.95"</span>, <span class="syn-st">"latency &lt; 2s"</span>],',
  '        guardrails=[<span class="syn-st">"pii_filter"</span>, <span class="syn-st">"hallucination_check"</span>]',
  '    )',
  '',
  '    <span class="syn-kw">async def</span> <span class="syn-fn">execute</span>(<span class="syn-sf">self</span>, task):',
  '        result = <span class="syn-kw">await</span> <span class="syn-sf">self</span>.process(task)',
  '        validated = <span class="syn-sf">self</span>.eval.validate(result)',
  '        <span class="syn-kw">return</span> validated.deploy()',
  '',
  '<span class="syn-cm"># Production deployment</span>',
  'agent = <span class="syn-cl">ProductionAgent</span>()',
  'result = <span class="syn-kw">await</span> agent.execute(<span class="syn-st">"Process Q1 pipeline"</span>)',
  '<span class="syn-cm"># ✓ All assertions passed | Ready for production</span>',
];

/* -----------------------------------------------------------
   CTA TERMINAL TYPER
   Types out a single command in the CTA terminal
   ----------------------------------------------------------- */
class PromptTyper {
  constructor(element, text, speed = 50) {
    this.element = element;
    this.text = text;
    this.speed = speed;
    this.index = 0;
    this.started = false;
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.type();
  }

  type() {
    if (this.index >= this.text.length) {
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      this.element.appendChild(cursor);
      return;
    }

    const char = this.text[this.index];
    const span = document.createElement('span');

    // Color flags differently
    if (this.text.substring(this.index).startsWith('--')) {
      span.className = 'flag';
    } else if (char === '$') {
      span.className = 'dollar';
    }

    span.textContent = char;
    this.element.appendChild(span);
    this.index++;

    const delay = this.speed + Math.random() * 40;
    setTimeout(() => this.type(), delay);
  }
}

/* -----------------------------------------------------------
   NUMBER COUNTER ANIMATION
   Counts from 0 to target with easing
   ----------------------------------------------------------- */
function animateCounter(element, target, suffix = '', prefix = '', duration = 2000) {
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    element.textContent = prefix + current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* -----------------------------------------------------------
   SCROLL REVEAL (IntersectionObserver)
   ----------------------------------------------------------- */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

/* -----------------------------------------------------------
   STATS COUNTER TRIGGER
   Watches for stats section to enter viewport
   ----------------------------------------------------------- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          const prefix = el.dataset.prefix || '';
          animateCounter(el, target, suffix, prefix, 2200);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.3 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* -----------------------------------------------------------
   HERO STATUS BAR CYCLE
   Updates the terminal status after typing completes
   ----------------------------------------------------------- */
function cycleHeroStatus() {
  const statusEl = document.getElementById('hero-status');
  const posEl = document.getElementById('hero-pos');
  if (!statusEl) return;

  const states = [
    { text: 'DEPLOYING', cls: 'status-amber' },
    { text: 'LIVE', cls: 'status-ready' },
  ];

  let i = 0;
  function next() {
    if (i >= states.length) return;
    const s = states[i];
    statusEl.textContent = s.text;
    statusEl.className = s.cls;
    if (posEl && i === 1) posEl.textContent = 'Ln 18, Col 1';
    i++;
    if (i < states.length) setTimeout(next, 2500);
  }

  setTimeout(next, 1500);
}

/* -----------------------------------------------------------
   CTA PROMPT ANIMATION TRIGGER
   ----------------------------------------------------------- */
function initCtaPrompt() {
  const promptEl = document.getElementById('cta-typed');
  if (!promptEl) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cmd = promptEl.dataset.cmd || 'start --ai-audit';
          const typer = new PromptTyper(promptEl, cmd, 65);
          typer.start();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(promptEl);
}

/* -----------------------------------------------------------
   INIT HERO TERMINAL
   ----------------------------------------------------------- */
function initHeroTerminal() {
  const codeContent = document.getElementById('hero-code-content');
  const lineNumbers = document.getElementById('hero-line-numbers');
  if (!codeContent) return;

  // Small delay so page settles first
  setTimeout(() => {
    const typer = new TerminalTyper(codeContent, lineNumbers, heroCodeLines, {
      lineDelay: 110,
      onComplete: cycleHeroStatus,
    });
    typer.start();
  }, 600);
}

/* -----------------------------------------------------------
   EDITOR GUTTER — Scrolling line numbers
   Fixed column on the left that tracks scroll position,
   like a code editor's line number gutter.
   ----------------------------------------------------------- */
function initEditorGutter() {
  const gutter = document.getElementById('editor-gutter');
  if (!gutter || window.innerWidth < 1024) return;

  const LINE_H = 22;
  const visibleCount = Math.ceil(window.innerHeight / LINE_H);

  // Create line elements
  for (let i = 0; i < visibleCount; i++) {
    const el = document.createElement('div');
    el.className = 'gutter-line';
    gutter.appendChild(el);
  }

  const lineEls = gutter.querySelectorAll('.gutter-line');
  const midIndex = Math.floor(visibleCount / 2);

  function update() {
    const docH = document.documentElement.scrollHeight;
    const winH = window.innerHeight;
    const maxScroll = docH - winH;
    const scrollY = window.scrollY;
    const totalLines = Math.ceil(docH / LINE_H);
    const scrollPct = maxScroll > 0 ? scrollY / maxScroll : 0;
    const startLine = Math.floor(scrollPct * (totalLines - visibleCount));

    for (let i = 0; i < lineEls.length; i++) {
      const num = startLine + i + 1;
      lineEls[i].textContent = num;

      if (i === midIndex) {
        lineEls[i].classList.add('active');
      } else {
        lineEls[i].classList.remove('active');
      }
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => {
    // Rebuild on resize if needed
    if (window.innerWidth < 1024) {
      gutter.style.display = 'none';
    } else {
      gutter.style.display = 'flex';
      update();
    }
  });

  update();
}

/* -----------------------------------------------------------
   EXPORT / INIT ALL
   ----------------------------------------------------------- */
function initAnimations() {
  initHeroTerminal();
  initScrollReveal();
  initCounters();
  initCtaPrompt();
  initEditorGutter();
}
