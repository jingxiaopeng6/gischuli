window.FocusPage = (function () {
  const els = {
    chapterGrid: null,
    focusOnlyToggle: null,
    compactToggle: null,
    focusModal: null,
    focusModalTitle: null,
    focusModalBody: null,
    focusDrawer: null,
    drawerTitle: null,
    drawerBody: null
  };

  let chapters = [];
  let studyUnits = [];

  function normalizeText(value) {
    if (typeof value !== "string") return "";
    return value.trim().replace(/[\s]+/g, " ").toLowerCase();
  }

  function unique(list) {
    return [...new Set(list.filter((item) => item !== undefined && item !== null && item !== ""))];
  }

  function init() {
    const data = window.reviewData || {};
    chapters = data.chapters || [];
    studyUnits = data.studyUnits || [];

    els.chapterGrid = document.getElementById("chapterGrid");
    els.focusOnlyToggle = document.getElementById("focusOnlyToggle");
    els.compactToggle = document.getElementById("compactToggle");
    els.focusModal = document.getElementById("focusModal");
    els.focusModalTitle = document.getElementById("focusModalTitle");
    els.focusModalBody = document.getElementById("focusModalBody");
    els.focusDrawer = document.getElementById("focusDrawer");
    els.drawerTitle = document.getElementById("drawerTitle");
    els.drawerBody = document.getElementById("drawerBody");

    bindEvents();
  }

  function bindEvents() {
    els.focusOnlyToggle?.addEventListener("change", renderChapters);
    els.compactToggle?.addEventListener("change", renderChapters);

    els.focusModal?.addEventListener("click", (event) => {
      if (event.target.closest("[data-focus-close]")) closeFocusModal();
    });

    els.focusDrawer?.addEventListener("click", (event) => {
      if (event.target.closest("[data-drawer-close]")) closeDrawer();
    });

    let drawerStartY = 0;
    let drawerCurrentY = 0;
    els.focusDrawer?.addEventListener("touchstart", (event) => {
      drawerStartY = event.touches[0].clientY;
    }, { passive: true });
    els.focusDrawer?.addEventListener("touchmove", (event) => {
      drawerCurrentY = event.touches[0].clientY;
    }, { passive: true });
    els.focusDrawer?.addEventListener("touchend", () => {
      if (drawerCurrentY - drawerStartY > 80) closeDrawer();
      drawerStartY = 0;
      drawerCurrentY = 0;
    });
  }

  function activate() {
    renderChapters();
  }

  function renderChapters() {
    if (!els.chapterGrid || !chapters.length) return;
    const focusOnly = els.focusOnlyToggle?.checked ?? true;
    const compact = els.compactToggle?.checked ?? false;

    els.chapterGrid.innerHTML = chapters
      .map((chapter) => {
        const tags = chapter.focus
          .map((item) => `<button type="button" class="focus-chip" data-focus-chapter="${chapter.id}" data-focus-label="${item}"><strong>${item}</strong><small>点击查看</small></button>`)
          .join("");
        const styleClass = compact ? "chapter-card compact" : "chapter-card";
        return `
          <article class="${styleClass} fade-in">
            <div class="chapter-head">
              <div>
                <h3>${chapter.title}</h3>
                <div class="chapter-meta">${chapter.subtitle}</div>
              </div>
              <span class="pill pill-soft">${chapter.id.toUpperCase()}</span>
            </div>
            <p class="chapter-meta">${chapter.note}</p>
            <div class="chapter-focus">
              ${focusOnly ? tags : `<span class="tag muted">重点提示 · 共 ${chapter.focus.length} 条</span>${tags}`}
            </div>
          </article>
        `;
      })
      .join("");

    els.chapterGrid.querySelectorAll(".focus-chip[data-focus-chapter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const chapterId = chip.getAttribute("data-focus-chapter");
        const label = chip.getAttribute("data-focus-label");
        renderFocusDetail(chapterId, label);
      });
    });
  }

  function getChapterKey(chapter) {
    return chapter.title;
  }

  function pickFocusUnits(chapter, label) {
    const chapterKey = getChapterKey(chapter);
    const normalizedLabel = normalizeText(label);
    const chapterUnits = studyUnits.filter((unit) => unit.chapter === chapterKey);
    const matched = chapterUnits.filter((unit) => {
      const topic = normalizeText(unit.topic);
      const core = normalizeText(unit.core);
      return normalizedLabel.includes(topic) || topic.includes(normalizedLabel) ||
        core.includes(normalizedLabel.slice(0, Math.min(normalizedLabel.length, 10)));
    });

    const fallback = chapterUnits.slice(0, 4);
    return (matched.length ? matched : fallback).slice(0, 4);
  }

  function buildFocusDetailHtml(chapterId, label) {
    const chapter = chapters.find((item) => item.id === chapterId) || chapters[0];
    if (!chapter) return "";
    const units = pickFocusUnits(chapter, label);
    const keywords = unique(units.flatMap((unit) => unit.keywords || [])).slice(0, 10);
    const examples = unique(units.map((unit) => unit.example).filter(Boolean)).slice(0, 3);
    const pitfalls = unique(units.map((unit) => unit.pitfall).filter(Boolean)).slice(0, 3);
    const comparePoints = unique(units.map((unit) => unit.compare).filter(Boolean)).slice(0, 3);
    const summary = units.map((unit) => unit.core).join(" ");
    const questionType = ["区别", "对比", "比较"].some((keyword) => label.includes(keyword))
      ? "对比类"
      : ["什么", "定义", "解释"].some((keyword) => label.includes(keyword))
        ? "名词解释"
        : ["算法", "步骤", "流程", "计算"].some((keyword) => label.includes(keyword))
          ? "算法与流程"
          : ["模型", "结构", "关系"].some((keyword) => label.includes(keyword))
            ? "模型结构"
            : "综合复习";

    const chapterDetail = chapter.details || {};
    const definitionList = Array.isArray(chapterDetail.definitions) ? chapterDetail.definitions : [];
    const comparisonList = Array.isArray(chapterDetail.comparisons) ? chapterDetail.comparisons : [];
    const algorithmList = Array.isArray(chapterDetail.algorithms) ? chapterDetail.algorithms : [];
    const applicationList = Array.isArray(chapterDetail.applications) ? chapterDetail.applications : [];

    const definitionHtml = definitionList.length
      ? `<div class="focus-detail-card"><h4>概念定义</h4>${definitionList.map((item) => `<p><strong>${item.term}</strong>${item.definition}</p>`).join("")}</div>`
      : "";

    const comparisonHtml = comparisonList.length
      ? comparisonList.map((item) => `<div class="focus-detail-card" style="margin-top:10px;"><h4>${item.title}</h4><ul>${item.points.map((point) => `<li>${point}</li>`).join("")}</ul></div>`).join("")
      : "";

    const algorithmHtml = algorithmList.length
      ? `<div class="focus-detail-card"><h4>算法 / 公式</h4>${algorithmList.map((item) => `<p><strong>${item.name}</strong>${item.formula}</p><p>${item.description}</p>`).join("")}</div>`
      : "";

    const applicationHtml = applicationList.length
      ? `<div class="focus-detail-card"><h4>应用场景</h4><ul>${applicationList.map((item) => `<li>${item}</li>`).join("")}</ul></div>`
      : "";

    const unitHtml = units.length
      ? `<div class="focus-unit-grid">${units
          .map(
            (unit) => `<div class="focus-unit"><strong>${unit.topic}</strong><p>${unit.core}</p><p><strong>关键词：</strong>${(unit.keywords || []).join("、")}</p><p><strong>例子：</strong>${unit.example || "暂无示例"}</p><p><strong>易错点：</strong>${unit.pitfall || "暂无提示"}</p></div>`
          )
          .join("")}</div>`
      : `<p>暂无可展开的细化内容，请切换到其他提纲项查看。</p>`;

    const answerTemplate = [
      `1. 先说清定义和核心含义：${summary || chapter.note || "结合教材概括核心概念"}`,
      `2. 再列出关键词：${keywords.length ? keywords.join("、") : "结合章节内容补充关键词"}`,
      `3. 最好举一个典型例子：${examples[0] || "联系教材或课堂案例说明"}`,
      `4. 注意常见易错点：${pitfalls[0] || "区分概念边界和适用场景"}`,
      `5. 如果是${questionType}题，补充对比或步骤说明：${comparePoints[0] || "联系相关概念展开"}`
    ];

    return `
      <div class="focus-detail-head">
        <div>
          <h3>${label}</h3>
          <div class="focus-detail-meta">
            <span class="pill">${chapter.title}</span>
            <span class="pill pill-soft">${chapter.id.toUpperCase()}</span>
            <span class="pill pill-soft">${questionType}</span>
          </div>
        </div>
        <p class="study-summary">${chapter.note}</p>
      </div>
      <div class="focus-detail-grid">
        <div class="focus-detail-section">
          <div class="focus-detail-card"><h4>怎么答</h4><p>${summary || chapter.note}</p></div>
          <div class="focus-detail-card"><h4>答题模板</h4><ul>${answerTemplate.map((item) => `<li>${item}</li>`).join("")}</ul></div>
          <div class="focus-detail-card"><h4>关键词</h4><div class="chapter-focus">${keywords.length ? keywords.map((item) => `<span class="tag focus">${item}</span>`).join("") : `<span class="tag muted">暂无关键词</span>`}</div></div>
          <div class="focus-detail-card"><h4>关联单元</h4>${unitHtml}</div>
        </div>
        <div class="focus-detail-stack">
          ${definitionHtml}${comparisonHtml}${algorithmHtml}${applicationHtml}
          <div class="focus-detail-card"><h4>典型例子</h4><ul>${examples.length ? examples.map((example) => `<li>${example}</li>`).join("") : "<li>可结合教材中的案例进行说明</li>"}</ul></div>
          <div class="focus-detail-card"><h4>易错点</h4><ul>${pitfalls.length ? pitfalls.map((pitfall) => `<li>${pitfall}</li>`).join("") : "<li>注意概念边界、适用范围和常见混淆点</li>"}</ul></div>
        </div>
      </div>
      <div class="focus-detail-card" style="margin-top:16px;"><h4>同类可切换考点</h4><div class="chapter-focus">${chapter.focus.map((item) => `<button type="button" class="focus-chip" data-focus-chapter="${chapter.id}" data-focus-label="${item}"><strong>${item}</strong><small>点击切换</small></button>`).join("")}</div></div>
    `;
  }

  function renderFocusDetail(chapterId, label, shouldOpen = true) {
    const chapter = chapters.find((item) => item.id === chapterId) || chapters[0];
    if (!chapter) return;
    const html = buildFocusDetailHtml(chapterId, label);
    const isMobile = window.innerWidth <= 760;

    if (isMobile && els.drawerTitle && els.drawerBody) {
      els.drawerTitle.textContent = label;
      els.drawerBody.innerHTML = html;
      bindDetailSwitchButtons();
      if (shouldOpen) openDrawer();
    } else if (els.focusModalTitle && els.focusModalBody) {
      els.focusModalTitle.textContent = label;
      els.focusModalBody.innerHTML = html;
      bindDetailSwitchButtons();
      if (shouldOpen) openFocusModal();
    }
  }

  function bindDetailSwitchButtons() {
    const container = els.drawerBody || els.focusModalBody;
    if (!container) return;
    container.querySelectorAll(".focus-chip[data-focus-chapter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const chapterId = chip.getAttribute("data-focus-chapter");
        const label = chip.getAttribute("data-focus-label");
        renderFocusDetail(chapterId, label);
      });
    });
  }

  function openFocusModal() {
    if (!els.focusModal) return;
    els.focusModal.classList.remove("hidden");
    els.focusModal.setAttribute("aria-hidden", "false");
    document.body?.classList.add("modal-open");
  }

  function closeFocusModal() {
    if (!els.focusModal) return;
    els.focusModal.classList.add("hidden");
    els.focusModal.setAttribute("aria-hidden", "true");
    document.body?.classList.remove("modal-open");
  }

  function openDrawer() {
    if (!els.focusDrawer) return;
    els.focusDrawer.classList.remove("hidden");
    els.focusDrawer.classList.add("is-open");
    els.focusDrawer.setAttribute("aria-hidden", "false");
    document.body?.classList.add("modal-open");
  }

  function closeDrawer() {
    if (!els.focusDrawer) return;
    els.focusDrawer.classList.remove("is-open");
    els.focusDrawer.classList.add("hidden");
    els.focusDrawer.setAttribute("aria-hidden", "true");
    document.body?.classList.remove("modal-open");
  }

  return {
    init,
    activate,
    renderChapters,
    renderFocusDetail,
    openFocusModal,
    closeFocusModal,
    openDrawer,
    closeDrawer
  };
})();
