window.ExamPage = (function () {
  const state = {
    currentExam: [],
    answers: new Map(),
    timer: null,
    timerRunning: false,
    timeLeft: 0
  };

  const els = {
    examPaper: null,
    examSummary: null,
    timerBadge: null,
    generateExam: null,
    startTimer: null,
    submitExam: null,
    countChoice: null,
    countFill: null,
    countTerm: null,
    countShort: null,
    countEssay: null,
    examMinutes: null,
    preferFocus: null,
    examHint: null,
    examNavBar: null,
    examProgress: null,
    prevQuestion: null,
    nextQuestion: null
  };

  let questionBank = { choice: [], fill: [], term: [], short: [], essay: [] };

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

  function takeQuestions(source, count, preferFocus = false) {
    if (!source || !source.length || count <= 0) return [];
    if (!preferFocus) return shuffle(source).slice(0, count);
    const preferred = shuffle(source.filter((item) => item.focus));
    const remaining = shuffle(source.filter((item) => !item.focus));
    return [...preferred, ...remaining].slice(0, count);
  }

  function init() {
    els.examPaper = document.getElementById("examPaper");
    els.examSummary = document.getElementById("examSummary");
    els.timerBadge = document.getElementById("timerBadge");
    els.generateExam = document.getElementById("generateExam");
    els.startTimer = document.getElementById("startTimer");
    els.submitExam = document.getElementById("submitExam");
    els.countChoice = document.getElementById("countChoice");
    els.countFill = document.getElementById("countFill");
    els.countTerm = document.getElementById("countTerm");
    els.countShort = document.getElementById("countShort");
    els.countEssay = document.getElementById("countEssay");
    els.examMinutes = document.getElementById("examMinutes");
    els.preferFocus = document.getElementById("preferFocus");
    els.examHint = document.getElementById("examHint");
    els.examNavBar = document.getElementById("examNavBar");
    els.examProgress = document.getElementById("examProgress");
    els.prevQuestion = document.getElementById("prevQuestion");
    els.nextQuestion = document.getElementById("nextQuestion");
    bindEvents();
  }

  function bindEvents() {
    els.generateExam?.addEventListener("click", renderExamPaper);
    els.startTimer?.addEventListener("click", startTimer);
    els.submitExam?.addEventListener("click", gradeExam);
    els.prevQuestion?.addEventListener("click", () => navigateQuestion(-1));
    els.nextQuestion?.addEventListener("click", () => navigateQuestion(1));
  }

  function activate() {
    const data = window.reviewData || {};
    questionBank = data.questionBank || { choice: [], fill: [], term: [], short: [], essay: [] };
  }

  function renderExamInput(question) {
    if (question.type === "choice") {
      return `<div class="option-list">${question.options.map((option, index) => `<label class="option"><input type="radio" name="${question.id}" value="${index}" /><span>${String.fromCharCode(65 + index)}. ${option}</span></label>`).join("")}</div>`;
    }
    if (question.type === "fill") return `<input type="text" data-question-input="${question.id}" placeholder="请填写答案" />`;
    if (question.type === "term") return `<textarea data-question-input="${question.id}" placeholder="请写出名词解释"></textarea>`;
    return `<textarea data-question-input="${question.id}" placeholder="请简要作答"></textarea>`;
  }

  function bindInputEvents() {
    state.currentExam.forEach((question) => {
      if (question.type === "choice") {
        const radios = document.querySelectorAll(`input[name="${question.id}"]`);
        radios.forEach((radio) => {
          radio.addEventListener("change", () => {
            state.answers.set(question.id, radio.value);
          });
        });
        return;
      }
      const input = document.querySelector(`[data-question-input="${question.id}"]`);
      if (input) {
        input.addEventListener("input", () => {
          state.answers.set(question.id, input.value);
        });
      }
    });
  }

  function renderExamPaper() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    state.timerRunning = false;
    updateTimerBadge();

    const counts = {
      choice: Math.max(0, Number(els.countChoice?.value || 0)),
      fill: Math.max(0, Number(els.countFill?.value || 0)),
      term: Math.max(0, Number(els.countTerm?.value || 0)),
      short: Math.max(0, Number(els.countShort?.value || 0)),
      essay: Math.max(0, Number(els.countEssay?.value || 0))
    };
    const preferFocus = els.preferFocus?.checked ?? false;

    const paper = [
      ...takeQuestions(questionBank.choice, counts.choice, preferFocus).map((item) => ({ ...item, type: "choice" })),
      ...takeQuestions(questionBank.fill, counts.fill, preferFocus).map((item) => ({ ...item, type: "fill" })),
      ...takeQuestions(questionBank.term, counts.term, preferFocus).map((item) => ({ ...item, type: "term" })),
      ...takeQuestions(questionBank.short, counts.short, preferFocus).map((item) => ({ ...item, type: "short" })),
      ...takeQuestions(questionBank.essay, counts.essay, preferFocus).map((item) => ({ ...item, type: "essay" }))
    ];

    state.currentExam = shuffle(paper);
    state.answers.clear();

    if (!state.currentExam.length) {
      els.examPaper.innerHTML = "";
      els.examSummary.textContent = "当前没有抽到题目，请先调整题量后重新生成。";
      return;
    }

    const typeLabel = (type) => type === "choice" ? "选择题" : type === "fill" ? "填空题" : type === "term" ? "名词解释" : type === "short" ? "简答题" : "论述题";

    els.examPaper.innerHTML = state.currentExam.map((question, index) => `
      <div class="question-wrap">
        <div class="question-card fade-in" data-exam-qid="${question.id}" style="animation-delay:${index * 35}ms;">
          <div class="question-meta">
            <span class="pill">第 ${index + 1} 题</span>
            <span class="pill pill-soft">${safeText(question.chapter, "第1章")}</span>
            <span class="pill pill-soft">${typeLabel(question.type)}</span>
          </div>
          <h3>${question.term || question.prompt || question.title || "未命名题目"}</h3>
          ${renderExamInput(question)}
          <div class="answer-block hidden" data-answer-for="${question.id}"></div>
        </div>
      </div>
    `).join("");

    els.examSummary.textContent = `已生成 ${state.currentExam.length} 道试题，请先作答后再提交。`;
    if (els.examHint) els.examHint.textContent = `本次共抽取 ${Object.values(counts).reduce((a, b) => a + b, 0)} 道题，支持选择题、填空题、名词解释、简答题和论述题。`;
    bindInputEvents();
    updateExamNavBar();
  }

  function gradeExam() {
    if (!state.currentExam.length) {
      els.examSummary.textContent = "请先生成试卷。";
      return;
    }
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    state.timerRunning = false;
    updateTimerBadge();

    let objectiveTotal = 0;
    let objectiveScore = 0;
    let fillTotal = 0;
    let fillScore = 0;
    let subjectiveTotal = 0;

    state.currentExam.forEach((question) => {
      const block = document.querySelector(`[data-answer-for="${question.id}"]`);
      if (!block) return;
      let result = "";
      let isCorrect = false;
      const userAnswer = state.answers.get(question.id) ?? "";

      if (question.type === "choice") {
        objectiveTotal += 1;
        const right = String(question.answer);
        isCorrect = String(userAnswer) === right;
        if (isCorrect) objectiveScore += 1;
        result = `<div class="${isCorrect ? "answer-good" : "answer-bad"}">${isCorrect ? "回答正确" : "回答错误"}，正确答案是 ${String.fromCharCode(65 + Number(question.answer || 0))}</div><small>${safeText(question.explain, "暂无解析")}</small>`;
      } else if (question.type === "fill") {
        fillTotal += 1;
        const normalized = normalizeText(userAnswer);
        const accepted = question.answer.map(normalizeText);
        isCorrect = accepted.includes(normalized);
        if (isCorrect) fillScore += 1;
        result = `<div class="${isCorrect ? "answer-good" : "answer-bad"}">${isCorrect ? "回答正确" : "答案不完整或不正确"}，参考答案：${safeText(question.answer?.[0], "暂无参考答案")}</div><small>${safeText(question.explain, "暂无解析")}</small>`;
      } else {
        subjectiveTotal += 1;
        result = `<div class="answer-good">参考答案</div><div>${safeText(question.answer, question.term || "暂无参考答案")}</div><small>主观题以关键词、概念完整度、逻辑结构和表达清晰度综合评分。</small>`;
      }

      block.classList.remove("hidden");
      block.innerHTML = result;
    });

    const totalScore = objectiveScore + fillScore;
    const totalObjective = objectiveTotal + fillTotal;
    const subjectiveNotice = subjectiveTotal > 0 ? `，其中主观题 ${subjectiveTotal} 道建议结合老师评分。` : "";
    els.examSummary.textContent = `本次共 ${state.currentExam.length} 题，客观题得分 ${totalScore}/${totalObjective}${subjectiveNotice}`;
  }

  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function startTimer() {
    if (!state.currentExam.length) {
      els.examSummary.textContent = "请先生成试卷再开始计时。";
      return;
    }
    const minutes = Math.max(5, Number(els.examMinutes?.value || 45));
    state.timeLeft = minutes * 60;
    state.timerRunning = true;
    updateTimerBadge();
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
      if (!state.timerRunning) return;
      state.timeLeft -= 1;
      updateTimerBadge();
      if (state.timeLeft <= 0) {
        clearInterval(state.timer);
        state.timer = null;
        state.timerRunning = false;
        updateTimerBadge(true);
        gradeExam();
      }
    }, 1000);
  }

  function updateTimerBadge(finished = false) {
    if (!els.timerBadge) return;
    if (finished) {
      els.timerBadge.textContent = "时间到";
      els.timerBadge.classList.add("pill-soft");
      return;
    }
    if (!state.timerRunning && state.timeLeft === 0) {
      els.timerBadge.textContent = "未开始";
      els.timerBadge.classList.add("pill-soft");
      return;
    }
    if (state.timerRunning) {
      els.timerBadge.textContent = `计时中 ${formatTime(state.timeLeft)}`;
    } else {
      els.timerBadge.textContent = `暂停 ${formatTime(state.timeLeft)}`;
    }
  }

  function navigateQuestion(direction) {
    if (!state.currentExam.length) return;
    const examSection = document.getElementById("exam");
    if (!examSection) return;
    const firstQuestion = examSection.querySelector(".question-card[data-exam-qid]");
    if (!firstQuestion) return;
    firstQuestion.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateExamNavBar() {
    if (!els.examNavBar) return;
    if (!state.currentExam.length) return;
    if (els.examProgress) els.examProgress.textContent = `${state.currentExam.length} 题`;
    els.examNavBar.style.display = window.innerWidth <= 760 ? "flex" : "none";
  }

  function getCurrentExam() {
    return state.currentExam;
  }

  return {
    init,
    activate,
    renderExamPaper,
    gradeExam,
    startTimer,
    getCurrentExam
  };
})();
