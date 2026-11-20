(() => {
  'use strict';

  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const breadcrumbs = document.getElementById('breadcrumbs');
  const STORAGE_KEY = 'az900-practice-portal-attempts-v1';

  let catalog = null;
  let questionBank = [];
  let activeView = 'home';
  let activePhaseId = 'phase-1';
  let activeQuiz = null;
  let lastResult = null;
  let phaseSearch = '';

  const phaseList = () => catalog ? catalog.phases : [];
  const allEpisodes = () => phaseList().flatMap(phase => phase.episodes.map(episode => ({ ...episode, phaseId: phase.id, phaseTitle: phase.title })));
  const getEpisode = id => allEpisodes().find(episode => episode.id === id);
  const getPhase = id => phaseList().find(phase => phase.id === id);
  const getQuestionsForEpisode = id => questionBank.filter(question => question.episodeId === id);
  const getAttempts = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  };
  const saveAttempt = attempt => {
    const attempts = getAttempts();
    attempts.unshift(attempt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts.slice(0, 100)));
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const shuffle = items => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const questionTypeLabel = type => ({ single:'Single choice', multiple:'Multiple select', truefalse:'True / False', matching:'Match the following' }[type] || 'Question');
  const findOption = (question, id) => (question.options || []).find(option => option.id === id);
  const correctIds = question => question.type === 'matching'
    ? Object.entries(question.correctMatches || {}).map(([key, value]) => `${key}=${value}`)
    : (question.correctAnswers || []);
  const answerLabels = (question, ids) => question.type === 'matching'
    ? ids.map(pair => { const [key, value] = pair.split('='); const item = (question.matches || []).find(match => match.id === key); return `${item?.label || key} → ${value || ''}`; })
    : ids.map(id => findOption(question, id)?.text || id);
  const sameSet = (a, b) => a.length === b.length && a.every(value => b.includes(value));
  const getQuestionCount = episodeId => getQuestionsForEpisode(episodeId).length;
  const getPhaseQuestionCount = phase => phase.episodes.reduce((sum, episode) => sum + getQuestionCount(episode.id), 0);
  const getSampledEpisodeCount = phase => phase.episodes.filter(episode => getQuestionCount(episode.id) > 0).length;
  const episodeTag = episode => getQuestionCount(episode.id) > 0
    ? `<span class="tag tag-ready">${getQuestionCount(episode.id)} sample ${getQuestionCount(episode.id) === 1 ? 'question' : 'questions'}</span>`
    : '<span class="tag">Question bank pending</span>';

  function setView(view) {
    activeView = view;
    sidebar.classList.remove('open');
    document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    render();
  }

  function setBreadcrumb(label) {
    breadcrumbs.innerHTML = `Learning space <span>/</span> ${escapeHtml(label)}`;
  }

  function renderStats() {
    const attempts = getAttempts();
    const uniqueEpisodes = new Set(attempts.map(attempt => attempt.episodeId).filter(Boolean)).size;
    const average = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percent, 0) / attempts.length) : 0;
    return `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-top">Learning phases <span class="stat-icon">▤</span></div><div class="stat-value">${phaseList().length}</div><div class="stat-caption">Your complete learning path</div></div>
        <div class="stat-card"><div class="stat-top">Topics / episodes <span class="stat-icon">▣</span></div><div class="stat-value">${allEpisodes().length}</div><div class="stat-caption">Organized phase by phase</div></div>
        <div class="stat-card"><div class="stat-top">Sample questions <span class="stat-icon">✓</span></div><div class="stat-value">${questionBank.length}</div><div class="stat-caption">Starter question bank included</div></div>
        <div class="stat-card"><div class="stat-top">Your average <span class="stat-icon">％</span></div><div class="stat-value">${attempts.length ? `${average}%` : '—'}</div><div class="stat-caption">Across ${attempts.length} saved ${attempts.length === 1 ? 'attempt' : 'attempts'}</div></div>
      </div>`;
  }

  function renderHome() {
    setBreadcrumb('Dashboard');
    const attempts = getAttempts();
    const latest = attempts[0];
    app.innerHTML = `
      <section class="hero">
        <div class="hero-content">
          <div class="eyebrow">Microsoft Azure Fundamentals · AZ-900</div>
          <h1>Practice with purpose.<br>Be exam ready.</h1>
          <p>Build confidence topic by topic with interactive questions, instant feedback, and answer explanations. Start with a phase or try a practice mock test.</p>
          <div class="hero-actions">
            <button class="btn btn-primary" data-action="start-featured">Start practicing&nbsp; →</button>
            <button class="btn btn-light" data-view="mock">Explore mock test</button>
          </div>
        </div>
      </section>
      ${renderStats()}
      <div class="section-head"><div><div class="eyebrow">Your learning path</div><h2>Explore by phase</h2><p>Follow the topics in sequence or jump to a topic you want to revise.</p></div><button class="text-link" data-view="phases">View all topics&nbsp; →</button></div>
      <section class="phase-grid">${phaseList().map(phase => renderPhaseCard(phase)).join('')}</section>
      <section class="two-col">
        <div class="panel">
          <div class="section-head"><div><div class="eyebrow">Quick start</div><h2>Continue learning</h2></div></div>
          <div class="quick-list">
            <div class="quick-item"><div class="quick-dot">01</div><div><strong>Cloud computing foundations</strong><small>Episode 1 · Core concepts and cloud benefits</small></div><button class="text-link" data-action="start-episode" data-episode="ep-01">Practice →</button></div>
            <div class="quick-item"><div class="quick-dot">10</div><div><strong>Azure networking services</strong><small>Episode 10 · VNet and load balancing</small></div><button class="text-link" data-action="start-episode" data-episode="ep-10">Practice →</button></div>
            <div class="quick-item"><div class="quick-dot">31</div><div><strong>Azure Policy</strong><small>Episode 31 · Governance and compliance</small></div><button class="text-link" data-action="start-episode" data-episode="ep-31">Practice →</button></div>
          </div>
        </div>
        <div class="panel">
          <div class="section-head"><div><div class="eyebrow">Your activity</div><h2>Recent practice</h2></div><button class="text-link" data-view="progress">See all</button></div>
          ${latest ? `<div class="quick-item"><div class="quick-dot">✓</div><div><strong>${escapeHtml(latest.title)}</strong><small>${new Date(latest.date).toLocaleString()} · ${latest.score}/${latest.total} correct</small></div><span class="tag ${latest.percent >= 70 ? 'tag-ready' : 'tag-new'}">${latest.percent}%</span></div>` : `<div class="empty-state"><strong>No attempts yet</strong>Complete your first quiz and your activity will appear here.</div>`}
        </div>
      </section>
      <div class="notice"><strong>Starter content:</strong> The portal currently includes ${questionBank.length} illustrative practice questions. The 40-episode structure is ready; the full external question bank has not been imported yet.</div>`;
  }

  function renderPhaseCard(phase) {
    const count = getPhaseQuestionCount(phase);
    const samples = getSampledEpisodeCount(phase);
    const pct = Math.round((samples / phase.episodes.length) * 100);
    return `<article class="phase-card">
      <div class="phase-head"><div class="phase-number">${phase.number}</div><span class="tag">${phase.episodes.length} episodes</span></div>
      <h3>${escapeHtml(phase.title)}</h3><p>${escapeHtml(phase.subtitle)}</p>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="phase-meta"><span>${samples} of ${phase.episodes.length} topics have sample questions · ${count} questions</span><button class="text-link" data-action="open-phase" data-phase="${phase.id}">Explore →</button></div>
    </article>`;
  }

  function renderPhases() {
    setBreadcrumb('All phases & topics');
    const active = getPhase(activePhaseId) || phaseList()[0];
    const episodes = active.episodes.filter(episode => `${episode.title} ${episode.description} Episode ${episode.number}`.toLowerCase().includes(phaseSearch.toLowerCase()));
    app.innerHTML = `
      <div class="section-head"><div><div class="eyebrow">Course catalogue</div><h2>Phases & topics</h2><p>All 40 episodes from your shared topic list, arranged into four study phases.</p></div><span class="tag">${allEpisodes().length} topics</span></div>
      <div class="phase-tabs">${phaseList().map(phase => `<button class="tab-btn ${phase.id === active.id ? 'active' : ''}" data-action="select-phase" data-phase="${phase.id}">Phase ${phase.number} · ${escapeHtml(phase.title)}</button>`).join('')}</div>
      <div class="panel" style="margin-bottom:14px"><div class="eyebrow">Phase ${active.number}</div><h2 style="font:800 18px Manrope;margin:6px 0">${escapeHtml(active.title)}</h2><p class="muted" style="font-size:11px;line-height:1.6;margin:0">${escapeHtml(active.description)}</p></div>
      <input class="search-box" id="topicSearch" type="search" placeholder="Search a topic or episode number…" value="${escapeHtml(phaseSearch)}" aria-label="Search topics">
      <div class="topic-list" style="margin-top:12px">${episodes.length ? episodes.map(episode => renderTopicRow(episode)).join('') : '<div class="empty-state"><strong>No matching topics</strong>Try a different search term.</div>'}</div>
      <div class="notice">Topics marked <strong>Question bank pending</strong> are included in the course map but do not yet have imported questions. They will become clickable as soon as their question data is added.</div>`;
  }

  function renderTopicRow(episode) {
    const count = getQuestionCount(episode.id);
    return `<div class="topic-row">
      <div class="topic-main"><div class="topic-index">${String(episode.number).padStart(2,'0')}</div><div><div class="topic-title">${escapeHtml(episode.title)}</div><div class="topic-sub">Episode ${episode.number} · ${escapeHtml(episode.description)}</div></div></div>
      <div style="display:flex;align-items:center;gap:9px">${episodeTag(episode)}<button class="btn ${count ? 'btn-primary' : 'btn-outline'} btn-small" data-action="start-episode" data-episode="${episode.id}" ${count ? '' : 'disabled title="Question bank will be added later"'}>${count ? 'Practice' : 'Coming soon'}</button></div>
    </div>`;
  }

  function startQuiz(questions, title, episodeId = null, isMock = false) {
    if (!questions.length) return;
    activeQuiz = {
      questions: [...questions], title, episodeId, isMock,
      index: 0, answers: {}, checked: false
    };
    activeView = 'quiz';
    document.querySelectorAll('.nav-link').forEach(button => button.classList.remove('active'));
    renderQuiz();
  }

  function startEpisode(episodeId) {
    const episode = getEpisode(episodeId);
    const questions = getQuestionsForEpisode(episodeId);
    if (!episode || !questions.length) return;
    startQuiz(questions, `Episode ${episode.number}: ${episode.title}`, episode.id, false);
  }

  function renderQuiz() {
    if (!activeQuiz) return setView('home');
    const question = activeQuiz.questions[activeQuiz.index];
    const selected = activeQuiz.answers[question.id] || [];
    const checked = activeQuiz.checked;
    const isCorrect = checked && sameSet(selected, correctIds(question));
    setBreadcrumb('Practice quiz');
    const progress = Math.round(((activeQuiz.index + (checked ? 1 : 0)) / activeQuiz.questions.length) * 100);
    app.innerHTML = `
      <div class="quiz-shell">
        <div class="quiz-top"><div><div class="eyebrow">${activeQuiz.isMock ? 'Practice mock test' : 'Topic-wise practice'}</div><h1>${escapeHtml(activeQuiz.title)}</h1><div class="muted" style="font-size:11px">Instant feedback · Review explanations as you go</div></div><div class="quiz-counter">Question <strong>${activeQuiz.index + 1}</strong> of ${activeQuiz.questions.length}</div></div>
        <div class="quiz-progress"><div style="width:${progress}%"></div></div>
        <section class="question-card">
          <div class="question-meta"><span class="question-number">QUESTION ${activeQuiz.index + 1}</span><span class="question-type">${questionTypeLabel(question.type)}</span><span class="tag">${escapeHtml(question.difficulty || 'Practice')}</span></div>
          <h2 class="question-text">${escapeHtml(question.question)}</h2>
          <p class="question-instruction">${escapeHtml(question.instruction || (question.type === 'multiple' ? 'Select all correct answers.' : question.type === 'matching' ? 'Choose the best match for each item.' : 'Choose one answer.'))}</p>
          ${question.image ? `<img class="question-image" src="${escapeHtml(question.image)}" alt="${escapeHtml(question.imageAlt || 'Question diagram')}">` : ''}
          ${question.type === 'matching' ? `<div class="matching-list">${(question.matches || []).map(match => { const selectedValue = selected.find(pair => pair.startsWith(`${match.id}=`))?.split('=').slice(1).join('=') || ''; return `<div class="matching-row"><label for="match-${escapeHtml(match.id)}">${escapeHtml(match.label)}</label><select id="match-${escapeHtml(match.id)}" class="match-select" data-action="match-answer" data-match="${escapeHtml(match.id)}" ${checked ? 'disabled' : ''}><option value="">Select a match…</option>${match.options.map(option => `<option value="${escapeHtml(option)}" ${selectedValue === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></div>`; }).join('')}</div>` : `<div class="answer-options">${(question.options || []).map(option => {
            const isSelected = selected.includes(option.id);
            const optionCorrect = correctIds(question).includes(option.id);
            let stateClass = isSelected ? 'selected' : '';
            let indicator = isSelected ? '✓' : '';
            if (checked && optionCorrect) { stateClass = 'correct'; indicator = '✓'; }
            else if (checked && isSelected && !optionCorrect) { stateClass = 'incorrect'; indicator = '×'; }
            return `<button class="answer-option ${question.type === 'single' || question.type === 'truefalse' ? 'single' : ''} ${stateClass}" data-action="select-answer" data-option="${escapeHtml(option.id)}" ${checked ? 'disabled' : ''}>
              <span class="option-indicator">${indicator}</span><span class="option-label">${escapeHtml(option.text)}</span>
            </button>`;
          }).join('')}</div>`}
          ${checked ? `<div class="feedback-panel ${isCorrect ? 'success' : 'error'}"><strong>${isCorrect ? 'That is correct.' : 'Not quite — review the correct answer.'}</strong><p>${escapeHtml(question.explanation)}</p>${question.type === 'multiple' ? `<p><b>Correct choices:</b> ${escapeHtml(answerLabels(question, correctIds(question)).join('; '))}</p>` : ''}</div>${(question.options || []).some(option => option.feedback) ? `<details class="option-feedback"><summary>View option-by-option explanations</summary>${question.options.map(option => `<div class="option-feedback-row"><b>${escapeHtml(option.text)}:</b> ${escapeHtml(option.feedback || '')}</div>`).join('')}</details>` : ''}` : ''}
          <div class="quiz-controls">
            <div class="left-controls"><button class="btn btn-outline" data-action="exit-quiz">Exit quiz</button></div>
            ${checked
              ? `<button class="btn btn-primary" data-action="next-question">${activeQuiz.index === activeQuiz.questions.length - 1 ? 'View results →' : 'Next question →'}</button>`
              : `<button class="btn btn-primary" data-action="check-answer" ${(question.type === 'matching' ? selected.length === (question.matches || []).length : selected.length > 0) ? '' : 'disabled'}>Check answer</button>`}
          </div>
        </section>
        ${activeQuiz.isMock ? '<div class="notice">Mock test uses the currently available starter questions. Its question count will grow when the full bank is imported.</div>' : ''}
      </div>`;
  }

  function checkAnswer() {
    if (!activeQuiz) return;
    const question = activeQuiz.questions[activeQuiz.index];
    const selected = activeQuiz.answers[question.id] || [];
    if (!selected.length || (question.type === 'matching' && selected.length !== (question.matches || []).length)) return;
    activeQuiz.checked = true;
    renderQuiz();
  }

  function selectAnswer(optionId) {
    if (!activeQuiz || activeQuiz.checked) return;
    const question = activeQuiz.questions[activeQuiz.index];
    const current = activeQuiz.answers[question.id] || [];
    let next;
    if (question.type === 'matching') return;
    if (question.type === 'multiple') {
      next = current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId];
    } else {
      next = [optionId];
    }
    activeQuiz.answers[question.id] = next;
    renderQuiz();
  }

  function selectMatch(matchId, value) {
    if (!activeQuiz || activeQuiz.checked) return;
    const question = activeQuiz.questions[activeQuiz.index];
    const current = activeQuiz.answers[question.id] || [];
    const withoutThisMatch = current.filter(pair => !pair.startsWith(`${matchId}=`));
    if (value) withoutThisMatch.push(`${matchId}=${value}`);
    activeQuiz.answers[question.id] = withoutThisMatch;
    renderQuiz();
  }

  function completeQuiz() {
    const answers = activeQuiz.questions.map(question => {
      const selected = activeQuiz.answers[question.id] || [];
      const correct = sameSet(selected, correctIds(question));
      return { question, selected, correct };
    });
    const score = answers.filter(answer => answer.correct).length;
    const percent = Math.round((score / answers.length) * 100);
    const episode = activeQuiz.episodeId ? getEpisode(activeQuiz.episodeId) : null;
    const attempt = {
      id: `attempt-${Date.now()}`,
      date: new Date().toISOString(),
      title: activeQuiz.title,
      episodeId: activeQuiz.episodeId,
      isMock: activeQuiz.isMock,
      score, total: answers.length, percent,
      answers: answers.map(answer => ({ questionId: answer.question.id, selected: answer.selected, correct: answer.correct }))
    };
    saveAttempt(attempt);
    lastResult = { ...attempt, answers, episode };
    activeQuiz = null;
    activeView = 'result';
    renderResult();
  }

  function renderResult() {
    if (!lastResult) return setView('home');
    setBreadcrumb('Quiz results');
    const scoreText = lastResult.percent >= 80 ? 'Excellent work!' : lastResult.percent >= 60 ? 'Good effort!' : 'Keep practicing!';
    app.innerHTML = `
      <div class="quiz-shell">
        <div class="result-card">
          <div class="result-icon">★</div>
          <div class="eyebrow">Practice session completed</div>
          <h1>${scoreText}</h1>
          <p>${escapeHtml(lastResult.title)}</p>
          <div class="score-ring" style="--score:${lastResult.percent}%"><div class="score-ring-inner"><strong>${lastResult.percent}%</strong><span>score</span></div></div>
          <div class="result-stats">
            <div class="result-stat"><strong>${lastResult.total}</strong><small>Total questions</small></div>
            <div class="result-stat"><strong style="color:var(--green)">${lastResult.score}</strong><small>Correct</small></div>
            <div class="result-stat"><strong style="color:var(--red)">${lastResult.total - lastResult.score}</strong><small>Incorrect</small></div>
          </div>
          <p>${lastResult.percent >= 70 ? 'You are building a solid understanding. Review the missed questions to strengthen your preparation.' : 'Use the answer review below to understand the concepts, then retry the topic.'}</p>
          <div class="result-actions">
            <button class="btn btn-primary" data-action="retry-last">Retry quiz</button>
            <button class="btn btn-outline" data-action="show-review">Review answers</button>
            <button class="btn btn-outline" data-view="phases">Back to topics</button>
          </div>
        </div>
        <div id="answerReview" style="margin-top:24px">
          <div class="section-head"><div><div class="eyebrow">Learn from every question</div><h2>Answer review</h2><p>Compare your selection with the correct answer and read the explanation.</p></div><span class="tag">${lastResult.answers.length} reviewed</span></div>
          <div class="review-list">${lastResult.answers.map((answer, index) => renderReviewItem(answer, index)).join('')}</div>
        </div>
      </div>`;
  }

  function renderReviewItem(answer, index) {
    const question = answer.question;
    const yourAnswer = answer.selected.length ? answerLabels(question, answer.selected).join('; ') : 'Not answered';
    const correctAnswer = answerLabels(question, correctIds(question)).join('; ');
    return `<article class="review-item">
      <div class="review-item-head"><strong>Question ${index + 1} · ${questionTypeLabel(question.type)}</strong><span class="tag ${answer.correct ? 'tag-ready' : 'tag-new'}">${answer.correct ? 'Correct' : 'Incorrect'}</span></div>
      <div class="review-question">${escapeHtml(question.question)}</div>
      <div class="review-detail"><b>Your answer:</b> ${escapeHtml(yourAnswer)}</div>
      ${!answer.correct ? `<div class="review-detail"><b>Correct answer:</b> ${escapeHtml(correctAnswer)}</div>` : ''}
      <div class="review-detail"><b>Explanation:</b> ${escapeHtml(question.explanation)}</div>
    </article>`;
  }

  function renderMock() {
    setBreadcrumb('Mock tests');
    app.innerHTML = `
      <div class="section-head"><div><div class="eyebrow">Exam practice</div><h2>Practice mock tests</h2><p>Combine questions from the currently available topic banks into one mixed practice session.</p></div><span class="tag tag-ready">Ready to attempt</span></div>
      <div class="phase-grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
        <article class="phase-card"><div class="phase-head"><div class="phase-number">A</div><span class="tag tag-ready">Available now</span></div><h3>AZ-900 Starter Mock</h3><p>A mixed set drawn from the sample questions across all four phases. Question order is shuffled for each attempt.</p><div class="phase-meta"><span>${questionBank.length} questions · Mixed topics · Instant feedback</span><button class="btn btn-primary btn-small" data-action="start-mock">Start mock →</button></div></article>
        <article class="phase-card"><div class="phase-head"><div class="phase-number">B</div><span class="tag">After bank import</span></div><h3>Full-length exam simulation</h3><p>We can configure the final mock length, time limit, and exam-style review once the complete question bank is imported.</p><div class="phase-meta"><span>Awaiting full question bank</span><span class="tag">Coming later</span></div></article>
      </div>
      <div class="notice"><strong>Important:</strong> The Starter Mock is for testing the website workflow, not a complete or official AZ-900 mock exam. It only includes the sample questions currently stored in this project.</div>`;
  }

  function renderProgress() {
    setBreadcrumb('My progress');
    const attempts = getAttempts();
    const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
    const average = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percent, 0) / attempts.length) : 0;
    app.innerHTML = `
      <div class="section-head"><div><div class="eyebrow">Your learning activity</div><h2>My progress</h2><p>Attempts are saved in this browser on this device.</p></div><button class="btn btn-outline btn-small" data-action="clear-progress" ${attempts.length ? '' : 'disabled'}>Clear history</button></div>
      <div class="progress-summary">
        <div class="stat-card"><div class="stat-top">Quiz attempts</div><div class="stat-value">${attempts.length}</div><div class="stat-caption">Saved in this browser</div></div>
        <div class="stat-card"><div class="stat-top">Average score</div><div class="stat-value">${attempts.length ? `${average}%` : '—'}</div><div class="stat-caption">Across completed attempts</div></div>
        <div class="stat-card"><div class="stat-top">Correct answers</div><div class="stat-value">${totalCorrect}/${totalQuestions}</div><div class="stat-caption">Across all saved attempts</div></div>
      </div>
      <div class="panel"><div class="section-head"><div><div class="eyebrow">History</div><h2>Recent attempts</h2></div></div>
        ${attempts.length ? `<div class="topic-list">${attempts.map(attempt => `<div class="topic-row"><div class="topic-main"><div class="topic-index">${attempt.isMock ? 'M' : 'Q'}</div><div><div class="topic-title">${escapeHtml(attempt.title)}</div><div class="topic-sub">${new Date(attempt.date).toLocaleString()} · ${attempt.score}/${attempt.total} correct</div></div></div><span class="tag ${attempt.percent >= 70 ? 'tag-ready' : 'tag-new'}">${attempt.percent}%</span></div>`).join('')}</div>` : '<div class="empty-state"><strong>No practice history yet</strong>Complete a topic quiz or mock test and your result will be saved here.</div>'}
      </div>
      <div class="notice">Progress is stored locally using your browser's storage. It is not sent to the instructor or shared across devices. A shared teacher dashboard would require a backend and student identity system.</div>`;
  }

  function render() {
    if (!catalog) return;
    if (activeView === 'home') renderHome();
    else if (activeView === 'phases') renderPhases();
    else if (activeView === 'mock') renderMock();
    else if (activeView === 'progress') renderProgress();
    else if (activeView === 'result') renderResult();
    document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === activeView));
  }

  document.addEventListener('click', event => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) { setView(viewButton.dataset.view); return; }
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    if (action === 'start-featured') startEpisode('ep-01');
    else if (action === 'start-episode') startEpisode(actionButton.dataset.episode);
    else if (action === 'open-phase') { activePhaseId = actionButton.dataset.phase; phaseSearch = ''; setView('phases'); }
    else if (action === 'select-phase') { activePhaseId = actionButton.dataset.phase; phaseSearch = ''; renderPhases(); }
    else if (action === 'select-answer') selectAnswer(actionButton.dataset.option);
    else if (action === 'check-answer') checkAnswer();
    else if (action === 'next-question') {
      if (activeQuiz.index === activeQuiz.questions.length - 1) completeQuiz();
      else { activeQuiz.index += 1; activeQuiz.checked = false; renderQuiz(); }
    }
    else if (action === 'exit-quiz') { activeQuiz = null; setView('phases'); }
    else if (action === 'start-mock') startQuiz(shuffle(questionBank), 'AZ-900 Starter Mock', null, true);
    else if (action === 'retry-last' && lastResult) {
      const retryQuestions = lastResult.answers.map(answer => answer.question);
      startQuiz(retryQuestions, lastResult.title, lastResult.episodeId, lastResult.isMock);
    }
    else if (action === 'show-review') document.getElementById('answerReview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (action === 'clear-progress') {
      if (window.confirm('Clear all practice history saved in this browser?')) { localStorage.removeItem(STORAGE_KEY); renderProgress(); }
    }
  });

  document.addEventListener('change', event => {
    if (event.target.matches('select[data-action="match-answer"]')) selectMatch(event.target.dataset.match, event.target.value);
  });

  document.addEventListener('input', event => {
    if (event.target.id === 'topicSearch') {
      const position = event.target.selectionStart;
      phaseSearch = event.target.value;
      renderPhases();
      const input = document.getElementById('topicSearch');
      input.focus();
      input.setSelectionRange(position, position);
    }
  });

  document.querySelectorAll('.nav-link').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  document.getElementById('mobileMenu').addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', event => {
    if (window.innerWidth <= 700 && sidebar.classList.contains('open') && !event.target.closest('#sidebar') && !event.target.closest('#mobileMenu')) sidebar.classList.remove('open');
  });

  async function init() {
    try {
      const [catalogResponse, questionsResponse] = await Promise.all([
        fetch('data/catalog.json'), fetch('data/questions.json')
      ]);
      if (!catalogResponse.ok || !questionsResponse.ok) throw new Error('Could not load the course data files.');
      catalog = await catalogResponse.json();
      const data = await questionsResponse.json();
      questionBank = data.questions || [];
      render();
    } catch (error) {
      app.innerHTML = `<div class="empty-state"><strong>Unable to load the practice portal</strong>${escapeHtml(error.message)}<br><br>Run this project through a local web server (for example, VS Code Live Server) instead of opening index.html directly.</div>`;
    }
  }

  init();
})();
