/* ==========================================================
   ASSESSMENT QUIZ — One question at a time, terminal-themed
   ========================================================== */
(function () {
  'use strict';

  var startTime = Date.now();

  var QUESTIONS = [
    {
      key: 'department',
      text: 'What department do you work in?',
      answers: [
        { label: 'Rev Ops', points: 3, param: 'rev_ops' },
        { label: 'Marketing', points: 2, param: 'marketing' },
        { label: 'Sales', points: 1, param: 'sales' }
      ]
    },
    {
      key: 'manual_hours',
      text: 'How many hours per week does your team spend on manual tasks (reporting, data entry, CRM updates, campaign tracking, list building)?',
      answers: [
        { label: 'Under 10 hours/week', points: 1, param: 'under_10' },
        { label: '10\u201330 hours/week', points: 2, param: '10-30' },
        { label: '30+ hours/week', points: 3, param: '30+' }
      ]
    },
    {
      key: 'ai_maturity',
      text: 'Where are you with AI adoption today?',
      answers: [
        { label: 'Haven\u2019t started \u2014 exploring options', points: 1, param: 'exploring' },
        { label: 'Ran pilots or POCs but nothing in production', points: 2, param: 'pilots_no_production' },
        { label: 'Have AI in production but want to expand', points: 3, param: 'in_production' }
      ]
    },
    {
      key: 'workflows',
      text: 'How many distinct workflows could benefit from AI?',
      answers: [
        { label: '1\u20132 (e.g., lead routing, campaign reporting, or CRM cleanup)', points: 1, param: '1-2' },
        { label: '3\u20135 (e.g., lead scoring, content ops, deal tracking, auditing)', points: 2, param: '3-5' },
        { label: '6+ (end-to-end from demand gen through retention)', points: 3, param: '6+' }
      ]
    },
    {
      key: 'apps',
      text: 'How many apps does your team use daily (CRM, email, sales intelligence, intent data, etc.)?',
      answers: [
        { label: '1\u20132 apps', points: 1, param: '1-2' },
        { label: '3\u20135 apps', points: 2, param: '3-5' },
        { label: '6+ apps', points: 3, param: '6+' }
      ]
    },
    {
      key: 'ai_pressure',
      text: 'How much pressure is your organization facing to adopt AI in its operations?',
      answers: [
        { label: 'Low \u2014 AI isn\u2019t a priority for leadership right now', points: 1, param: 'low' },
        { label: 'Medium \u2014 leadership is asking questions but no mandate yet', points: 2, param: 'medium' },
        { label: 'High \u2014 there\u2019s a clear directive to integrate AI into our workflows', points: 3, param: 'high' }
      ]
    },
    {
      key: 'pipeline_visibility',
      text: 'How much visibility do you have into your pipeline right now?',
      answers: [
        { label: 'Strong \u2014 we can see what\u2019s working and where deals stand', points: 1, param: 'strong' },
        { label: 'Partial \u2014 some blind spots, we\u2019re often reacting instead of planning', points: 2, param: 'partial' },
        { label: 'Low \u2014 we\u2019re piecing it together from multiple sources and still missing things', points: 3, param: 'low' }
      ]
    },
    {
      key: 'decision_authority',
      text: 'What\u2019s your role in AI purchase decisions?',
      answers: [
        { label: 'I influence the decision but need leadership approval', points: 1, param: 'influencer' },
        { label: 'I own the budget and can make the call', points: 2, param: 'budget_owner' },
        { label: 'I\u2019m the executive sponsor for this initiative', points: 3, param: 'executive_sponsor' }
      ]
    }
  ];

  var state = {
    current: 0,
    answers: [null, null, null, null, null, null, null, null]
  };

  var meta = document.getElementById('quiz-meta');
  var progress = document.getElementById('quiz-progress');
  var area = document.getElementById('quiz-question-area');
  var backBtn = document.getElementById('quiz-back');

  function renderQuestion(direction) {
    var q = QUESTIONS[state.current];
    var idx = state.current;

    // Update progress
    meta.textContent = 'Question ' + (idx + 1) + ' / 8';
    progress.style.width = ((idx + 1) / 8 * 100) + '%';

    // Show/hide back button
    backBtn.style.display = idx > 0 ? 'inline-flex' : 'none';

    // Build question HTML
    var html = '<div class="quiz-question" id="quiz-q">';
    html += '<h2>' + q.text + '</h2>';
    html += '<div class="quiz-answers">';

    for (var i = 0; i < q.answers.length; i++) {
      var a = q.answers[i];
      var selected = state.answers[idx] === i ? ' selected' : '';
      html += '<div class="quiz-answer' + selected + '" data-index="' + i + '">';
      html += '<div class="quiz-answer-header">';
      html += '<div class="quiz-answer-dots">';
      html += '<span class="quiz-answer-dot red"></span>';
      html += '<span class="quiz-answer-dot yellow"></span>';
      html += '<span class="quiz-answer-dot green"></span>';
      html += '</div>';
      html += '<span class="quiz-answer-label">option_' + String.fromCharCode(97 + i) + '</span>';
      html += '</div>';
      html += '<div class="quiz-answer-body">';
      html += '<span class="prompt">$</span>' + a.label;
      html += '</div>';
      html += '</div>';
    }

    html += '</div></div>';

    // Animate out old question
    var oldQ = document.getElementById('quiz-q');
    if (oldQ) {
      oldQ.classList.remove('active');
      oldQ.classList.add(direction === 'back' ? 'exit-right' : 'exit-left');
      setTimeout(function () {
        area.innerHTML = html;
        bindAnswers();
        // Trigger entrance
        requestAnimationFrame(function () {
          var newQ = document.getElementById('quiz-q');
          if (newQ) newQ.classList.add('active');
        });
      }, 250);
    } else {
      area.innerHTML = html;
      bindAnswers();
      requestAnimationFrame(function () {
        var newQ = document.getElementById('quiz-q');
        if (newQ) newQ.classList.add('active');
      });
    }
  }

  function bindAnswers() {
    var answers = area.querySelectorAll('.quiz-answer');
    for (var i = 0; i < answers.length; i++) {
      answers[i].addEventListener('click', handleAnswer);
    }
  }

  function handleAnswer(e) {
    var card = e.currentTarget;
    var idx = parseInt(card.getAttribute('data-index'), 10);
    state.answers[state.current] = idx;

    // Track answer
    if (typeof gtag === 'function') {
      gtag('event', 'question_answered', {
        question_number: state.current + 1,
        answer: QUESTIONS[state.current].answers[idx].param
      });
    }

    // Visual feedback
    var all = area.querySelectorAll('.quiz-answer');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
    card.classList.add('selected');

    // Auto-advance after 300ms
    setTimeout(function () {
      if (state.current < 7) {
        state.current++;
        renderQuestion('forward');
      } else {
        completeQuiz();
      }
    }, 300);
  }

  function completeQuiz() {
    var score = 0;
    var params = {};

    for (var i = 0; i < 8; i++) {
      var q = QUESTIONS[i];
      var aIdx = state.answers[i];
      score += q.answers[aIdx].points;
      params[q.key] = q.answers[aIdx].param;
    }

    var tier = score <= 14 ? 'launch' : score <= 21 ? 'growth' : 'enterprise';
    var elapsed = Math.round((Date.now() - startTime) / 1000);

    // Track completion
    if (typeof gtag === 'function') {
      gtag('event', 'quiz_completed', { score: score, tier: tier });
    }

    // Store results in sessionStorage for the results page
    sessionStorage.setItem('magnetiz_quiz', JSON.stringify({
      score: score,
      tier: tier,
      answers: state.answers,
      params: params,
      elapsed: elapsed
    }));

    // Navigate to results
    window.location.href = 'assessment-results.html';
  }

  // Back button
  backBtn.addEventListener('click', function () {
    if (state.current > 0) {
      state.current--;
      renderQuestion('back');
    }
  });

  // Track abandonment
  window.addEventListener('beforeunload', function () {
    if (state.current < 7 || state.answers[7] === null) {
      if (typeof gtag === 'function') {
        gtag('event', 'quiz_abandoned', { last_question: state.current + 1 });
      }
    }
  });

  // Init
  renderQuestion('forward');
})();
