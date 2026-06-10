window.StudyPage = (function () {
  const els = {
    studyMap: null
  };

  let chapters = [];
  let studyUnits = [];

  function init() {
    els.studyMap = document.getElementById("studyMap");
  }

  function activate() {
    const data = window.reviewData || {};
    chapters = data.chapters || [];
    studyUnits = data.studyUnits || [];
    renderStudyMap();
  }

  function renderStudyMap() {
    if (!els.studyMap) return;

    const grouped = new Map();
    for (const unit of studyUnits) {
      if (!grouped.has(unit.chapter)) grouped.set(unit.chapter, []);
      grouped.get(unit.chapter).push(unit);
    }

    els.studyMap.innerHTML = chapters
      .map((chapter) => {
        const units = grouped.get(chapter.title) || [];
        const topicPreview = units.slice(0, 4).map((unit) => unit.topic);
        return `
          <article class="study-chapter fade-in">
            <div class="study-chapter-head">
              <div>
                <h3>${chapter.title}</h3>
                <p class="study-summary">${chapter.note} 建议按"定义 - 关系 - 方法 - 应用"的顺序复习。</p>
              </div>
              <span class="pill pill-soft">${units.length} 个知识点</span>
            </div>
            <div class="study-steps">
              ${topicPreview.map((topic) => `<span class="study-step">${topic}</span>`).join("")}
            </div>
            <div class="study-topic-grid">
              ${units.map((unit) => `<div class="study-topic"><strong>${unit.topic}</strong><p>${unit.core}</p></div>`).join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  return {
    init,
    activate,
    renderStudyMap
  };
})();
