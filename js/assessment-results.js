/* ==========================================================
   ASSESSMENT RESULTS — Renders tier-specific results page
   ========================================================== */
(function () {
  'use strict';

  var data = sessionStorage.getItem('magnetiz_quiz');
  if (!data) {
    window.location.href = 'assessment.html';
    return;
  }

  var quiz = JSON.parse(data);
  var score = quiz.score;
  var tier = quiz.tier;
  var params = quiz.params;
  var elapsed = quiz.elapsed;

  // Human-readable answer labels
  var ANSWER_LABELS = {
    department: { sales: 'Sales', marketing: 'Marketing', rev_ops: 'Rev Ops' },
    manual_hours: { under_10: 'under 10 hours/week', '10-30': '10\u201330 hours/week', '30+': '30+ hours/week' },
    workflows: { '1-2': '1\u20132', '3-5': '3\u20135', '6+': '6+' },
    apps: { '1-2': '1\u20132', '3-5': '3\u20135', '6+': '6+' }
  };

  var department = ANSWER_LABELS.department[params.department] || params.department;
  var manualHours = ANSWER_LABELS.manual_hours[params.manual_hours] || params.manual_hours;
  var workflowCount = ANSWER_LABELS.workflows[params.workflows] || params.workflows;
  var appCount = ANSWER_LABELS.apps[params.apps] || params.apps;

  // Build booking URL
  var bookingUrl = 'https://calendly.com/chrisp-oymm/25min'
    + '?a1=' + encodeURIComponent(tier)
    + '&a2=' + encodeURIComponent(score);

  // Tier-specific content
  var TIERS = {
    launch: {
      label: 'Launch',
      statusText: 'LAUNCH',
      terminalFile: 'your_results.sh',
      summary: 'You\u2019re early \u2014 and that\u2019s actually an advantage. Most teams that jump into AI with 5 agents and 8 integrations end up with nothing in production 6 months later. You\u2019re in a position to do it right: one workflow, one agent, evaluation frameworks from day one.',
      answersText: function () {
        return 'Your team is spending ' + manualHours + ' on manual processes. You have ' + workflowCount + ' workflows ready to automate. You\u2019re using ' + appCount + ' apps. That\u2019s a clean starting point.';
      },
      recTitle: 'Your recommendation: Launch engagement',
      recItems: [
        '1\u20132 specialized AI agents deployed to production',
        'Your single highest-ROI workflow automated',
        'CRM + 1 platform integration',
        'Agent performance monitoring and dashboards',
        'Hands-on team training so you can manage it independently',
        '3-month engagement. Production-ready in 30 days.'
      ],
      consultItems: [
        'Which of your ' + workflowCount + ' workflows delivers the highest ROI',
        'What \u201cproduction-ready\u201d looks like for your specific CRM setup',
        'A realistic timeline and go/no-go assessment',
        'Clear cost structure \u2014 no surprises'
      ],
      ctaText: 'magnetiz.ai $ book --consultation --tier=launch'
    },
    growth: {
      label: 'Growth',
      statusText: 'GROWTH',
      terminalFile: 'your_results.sh',
      summary: 'You\u2019ve got the pain, the team, and the complexity to warrant a coordinated AI system \u2014 not just a single agent. Your answers show ' + manualHours + ' of manual work across ' + workflowCount + ' workflows on ' + appCount + ' apps. That\u2019s not a single-agent problem. That\u2019s a system problem.',
      answersText: function () {
        return 'You\u2019re dealing with operational blind spots, multiple disconnected workflows, and growing pressure from leadership to adopt AI. A single agent won\u2019t move the needle enough. You need coordinated agents that share context across your pipeline.';
      },
      recTitle: 'Your recommendation: Growth engagement',
      recItems: [
        '3\u20135 coordinated AI agents across multiple workflows',
        'Buying signal detection, deal risk scoring, and pipeline forecasting',
        'Account research, prioritization, and meeting prep',
        'CRM + 3\u20135 platform integrations',
        'Cross-workflow orchestration \u2014 agents talk to each other',
        'Comprehensive team training on multi-agent management',
        '3-month engagement. First agents in production in 30 days.'
      ],
      consultItems: [
        'How to sequence the rollout across your ' + workflowCount + ' workflows',
        'Which integrations deliver the fastest ROI',
        'How coordinated agents improve operational visibility',
        'Clear cost structure and 3-month timeline'
      ],
      ctaText: 'magnetiz.ai $ book --consultation --tier=growth'
    },
    enterprise: {
      label: 'Enterprise',
      statusText: 'ENTERPRISE',
      terminalFile: 'your_results.sh',
      summary: 'You need the full system. Not a pilot. Not a single workflow. A fleet of orchestrated AI agents spanning your entire revenue lifecycle \u2014 from demand generation through expansion and renewal. Your team is spending ' + manualHours + ' on manual operations across ' + workflowCount + ' workflows on ' + appCount + ' apps. At this scale, incremental automation won\u2019t move the margin.',
      answersText: function () {
        return 'You\u2019re facing a clear directive to adopt AI, your operational visibility gaps are costing you, and your team\u2019s overhead is scaling faster than revenue. This is the full-lifecycle AI revenue system.';
      },
      recTitle: 'Your recommendation: Enterprise engagement',
      recItems: [
        'Full agent fleet, orchestrated across the revenue lifecycle',
        'Demand-to-pipeline orchestration and multi-channel signal fusion',
        'Predictive forecasting and revenue performance intelligence',
        'Expansion detection, renewal/churn risk monitoring',
        'Unlimited platform integrations',
        'Executive-level training: system governance, AI strategy, change management',
        '6-month engagement. First agents in production in 30 days. Full system live in 90.'
      ],
      consultItems: [
        'Full-lifecycle workflow mapping for your revenue org',
        'Integration architecture across your platform stack',
        'Phased rollout plan \u2014 what ships in 30, 60, and 90 days',
        'ROI model and executive business case you can take to leadership'
      ],
      ctaText: 'magnetiz.ai $ book --consultation --tier=enterprise'
    }
  };

  var t = TIERS[tier];
  var container = document.getElementById('results-container');

  // Build rec list
  var recList = '';
  for (var i = 0; i < t.recItems.length; i++) {
    recList += '<li>' + t.recItems[i] + '</li>';
  }

  // Build consult list
  var consultList = '';
  for (var j = 0; j < t.consultItems.length; j++) {
    consultList += '<li>' + t.consultItems[j] + '</li>';
  }

  container.innerHTML =
    // Terminal header block
    '<div class="results-terminal">' +
      '<div class="terminal-header">' +
        '<div class="terminal-dots">' +
          '<span class="terminal-dot red"></span>' +
          '<span class="terminal-dot yellow"></span>' +
          '<span class="terminal-dot green"></span>' +
        '</div>' +
        '<span class="terminal-title">' + t.terminalFile + '</span>' +
      '</div>' +
      '<div class="results-terminal-body">' +
        '<div class="results-comment">// your_results</div>' +
        '<div class="results-tier-label">Your AI Readiness Profile: <span class="accent">' + t.label + '</span></div>' +
        '<div class="results-score">Score: ' + score + ' / 24</div>' +
        '<div class="results-summary">' + t.summary + '</div>' +
      '</div>' +
      '<div class="terminal-status">' +
        '<div class="status-group">' +
          '<span>TIER: <span class="status-ready">' + t.statusText + '</span></span>' +
        '</div>' +
        '<span>' + score + '/24 pts</span>' +
      '</div>' +
    '</div>' +

    // What your answers tell us
    '<div class="results-section">' +
      '<h3>// What your answers tell us</h3>' +
      '<p>' + t.answersText() + '</p>' +
    '</div>' +

    // Recommendation
    '<div class="results-section">' +
      '<h3>// ' + t.recTitle + '</h3>' +
      '<ul>' + recList + '</ul>' +
    '</div>' +

    // Consultation
    '<div class="results-section">' +
      '<h3>// In the consultation, we\u2019ll cover</h3>' +
      '<ol>' + consultList + '</ol>' +
    '</div>' +

    // CTA
    '<div class="results-cta" id="cta">' +
      '<a href="' + bookingUrl + '" class="btn-primary" id="booking-cta">' + t.ctaText + '</a>' +
      '<br>' +
      '<button class="results-retake" onclick="sessionStorage.removeItem(\'magnetiz_quiz\'); window.location.href=\'assessment-quiz.html\';">' +
        'Retake assessment' +
      '</button>' +
    '</div>';

  // Track results viewed
  if (typeof gtag === 'function') {
    gtag('event', 'results_viewed', { tier: tier, score: score });
  }

  // Track booking click
  var bookingCta = document.getElementById('booking-cta');
  if (bookingCta) {
    bookingCta.addEventListener('click', function (e) {
      if (typeof gtag === 'function') {
        gtag('event', 'booking_clicked', { tier: tier });
      }
      // Open Calendly popup instead of navigating
      e.preventDefault();
      if (typeof Calendly !== 'undefined') {
        Calendly.showPopupWidget('https://calendly.com/chrisp-oymm/25min');
      }
    });
  }
})();
