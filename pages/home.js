window.HomePage = (function () {
  const els = {
    cardGrid: null,
    chapterCount: null,
    focusCount: null,
    questionCount: null
  };

  let chapters = [];
  let questionBank = null;
  let quickCards = [];

  function init() {
    els.cardGrid = document.getElementById("cardGrid");
    els.chapterCount = document.getElementById("chapterCount");
    els.focusCount = document.getElementById("focusCount");
    els.questionCount = document.getElementById("questionCount");
  }

  function activate() {
    const data = window.reviewData || {};
    chapters = data.chapters || [];
    questionBank = data.questionBank || { choice: [], fill: [], term: [], short: [], essay: [] };
    quickCards = data.quickCards || [];
    renderStats();
    renderCards();
  }

  function renderStats() {
    if (!els.chapterCount) return;
    els.chapterCount.textContent = String(chapters.length);
    const focusCount = chapters.reduce((sum, chapter) => sum + chapter.focus.length, 0);
    if (els.focusCount) els.focusCount.textContent = String(focusCount);
    const questionCount = questionBank.choice.length + questionBank.fill.length +
      questionBank.term.length + questionBank.short.length + questionBank.essay.length;
    if (els.questionCount) els.questionCount.textContent = String(questionCount);
  }

  function renderCards() {
    if (!els.cardGrid) return;
    els.cardGrid.innerHTML = quickCards
      .map(
        (card) => `
      <article class="info-card fade-in">
        <h3>${card.title}</h3>
        <p>${card.body}</p>
      </article>
    `
      )
      .join("");
  }

  return {
    init,
    activate,
    renderStats,
    renderCards
  };
})();
