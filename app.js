(function () {
  "use strict";

  const pages = {
    home: window.HomePage,
    focus: window.FocusPage,
    study: window.StudyPage,
    bank: window.BankPage,
    exam: window.ExamPage
  };

  function init() {
    Object.values(pages).forEach((page) => {
      if (page && typeof page.init === "function") page.init();
    });
    attachViewSwitcher();
    attachEscapeKey();
    if (pages.home && typeof pages.home.activate === "function") pages.home.activate();
    window.scrollTo(0, 0);
  }

  function setActiveView(view) {
    const nextView = ["home", "focus", "study", "bank", "exam"].includes(view) ? view : "home";
    document.querySelectorAll("[data-view]").forEach((page) => {
      const isActive = page.dataset.view === nextView;
      page.classList.toggle("hidden", !isActive);
      page.setAttribute("aria-hidden", String(!isActive));
    });
    document.querySelectorAll("[data-view-target]").forEach((btn) => {
      const isActive = btn.dataset.viewTarget === nextView;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
    const page = pages[nextView];
    if (page && typeof page.activate === "function") page.activate();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function attachViewSwitcher() {
    document.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-view-target]");
      if (!btn) return;
      setActiveView(btn.dataset.viewTarget);
    });
  }

  function attachEscapeKey() {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (pages.focus && typeof pages.focus.closeFocusModal === "function") pages.focus.closeFocusModal();
      if (pages.focus && typeof pages.focus.closeDrawer === "function") pages.focus.closeDrawer();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
