window.BankPage = (function () {
  const els = {
    bankList: null,
    bankSearch: null,
    bankLimit: null,
    bankCount: null,
    bankChapterFilter: null,
    bankTypeFilter: null,
    reshuffleBank: null
  };

  let currentBank = [];
  let questionBank = { choice: [], fill: [], term: [], short: [], essay: [] };
  let chapters = [];

  function normalizeText(value) {
    if (typeof value !== "string") return "";
    return value.trim().replace(/[\s]+/g, " ").toLowerCase();
  }

  function shuffle(list) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function safeText(value, fallback = "") {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value);
  }

  function getQuestionTitle(question) {
    if (question.term) return safeText(question.term, "未命名题目");
    if (question.prompt) return safeText(question.prompt, "未命名题目");
    if (question.title) return safeText(question.title, "未命名题目");
    return "未命名题目";
  }

  function init() {
    els.bankList = document.getElementById("bankList");
    els.bankSearch = document.getElementById("bankSearch");
    els.bankLimit = document.getElementById("bankLimit");
    els.bankCount = document.getElementById("bankCount");
    els.bankChapterFilter = document.getElementById("bankChapterFilter");
    els.bankTypeFilter = document.getElementById("bankTypeFilter");
    els.reshuffleBank = document.getElementById("reshuffleBank");
    bindEvents();
  }

  function bindEvents() {
    els.bankSearch?.addEventListener("input", renderBank);
    els.bankLimit?.addEventListener("change", renderBank);
    els.bankChapterFilter?.addEventListener("change", renderBank);
    els.bankTypeFilter?.addEventListener("change", renderBank);
    els.reshuffleBank?.addEventListener("click", () => {
      seedBank();
      renderBank();
    });
  }

  function allQuestions() {
    return [
      ...questionBank.choice.map((item) => ({ ...item, type: "choice" })),
      ...questionBank.fill.map((item) => ({ ...item, type: "fill" })),
      ...questionBank.term.map((item) => ({ ...item, type: "term" })),
      ...questionBank.short.map((item) => ({ ...item, type: "short" })),
      ...questionBank.essay.map((item) => ({ ...item, type: "essay" }))
    ];
  }

  function seedBank() {
    currentBank = shuffle(allQuestions());
  }

  function activate() {
    const data = window.reviewData || {};
    chapters = data.chapters || [];
    questionBank = data.questionBank || { choice: [], fill: [], term: [], short: [], essay: [] };
    renderFilters();
    seedBank();
    renderBank();
  }

  function sampleVisibleQuestions(bank, chapterFilter, typeFilter) {
    return bank.filter((item) => {
      if (chapterFilter && chapterFilter !== "all" && String(item.chapter) !== String(chapterFilter)) {
        return false;
      }
      if (typeFilter && typeFilter !== "all" && String(item.type) !== String(typeFilter)) {
        return false;
      }
      return true;
    });
  }

  function renderFilters() {
    if (!els.bankChapterFilter || !els.bankTypeFilter) return;
    const chaptersWithAll = ["all", ...chapters.map((chapter) => chapter.title)];
    const types = ["all", "choice", "fill", "term", "short", "essay"];
    els.bankChapterFilter.innerHTML = chaptersWithAll.map((chapter) => `<option value="${chapter}">${chapter === "all" ? "全部章节" : chapter}</option>`).join("");
    els.bankTypeFilter.innerHTML = types.map((item) => `<option value="${item}">${item === "all" ? "全部题型" : item}</option>`).join("");
    els.bankChapterFilter.value = "all";
    els.bankTypeFilter.value = "all";
  }

  function renderQuestionCard(question, examMode = false) {
    const meta = [
      safeText(question.chapter, "第1章"),
      question.focus ? "重点" : "普通",
      question.type === "choice" ? "选择题" :
      question.type === "fill" ? "填空题" :
      question.type === "term" ? "名词解释" :
      question.type === "short" ? "简答题" : "论述题"
    ];

    let body = "";
    if (question.type === "choice") {
      body = `<div class="option-list">${question.options.map((option, index) => `<label class="option"><input type="radio" name="${question.id}" value="${index}" /><span>${String.fromCharCode(65 + index)}. ${option}</span></label>`).join("")}</div>`;
    } else if (question.type === "fill") {
      body = `<input type="text" placeholder="填写答案" />`;
    } else if (question.type === "term") {
      body = `<textarea placeholder="请写出名词解释"></textarea>`;
    } else {
      body = `<textarea placeholder="请简要作答"></textarea>`;
    }

    return `
      <article class="question-card fade-in" data-qid="${question.id}">
        <div class="question-meta">${meta.map((item) => `<span class="pill pill-soft">${item}</span>`).join("")}</div>
        <h3>${getQuestionTitle(question)}</h3>
        ${body}
        ${examMode ? `<div class="answer-block hidden" data-answer-for="${question.id}"></div>` : ""}
      </article>
    `;
  }

  function renderBank() {
    if (!els.bankList || !els.bankSearch || !els.bankLimit || !els.bankChapterFilter || !els.bankTypeFilter) return;
    const search = normalizeText(els.bankSearch.value);
    const limit = Math.max(1, Number(els.bankLimit.value || 48));
    const visible = sampleVisibleQuestions(currentBank, els.bankChapterFilter.value, els.bankTypeFilter.value).filter((item) => {
      if (!search) return true;
      const haystack = normalizeText([item.chapter, item.prompt, item.term, item.explain, item.answer, Array.isArray(item.options) ? item.options.join(" ") : ""].join(" "));
      return haystack.includes(search);
    });
    const shown = visible.slice(0, limit);
    if (els.bankCount) els.bankCount.textContent = `共 ${visible.length} 题，当前显示 ${shown.length} 题`;
    els.bankList.innerHTML = shown.length
      ? shown.map((question) => renderQuestionCard(question, false)).join("")
      : `<div class="summary-banner">没有找到符合条件的题目，试试更换章节、题型或关键词。</div>`;
  }

  return {
    init,
    activate,
    renderBank,
    renderFilters,
    seedBank,
    allQuestions
  };
})();
