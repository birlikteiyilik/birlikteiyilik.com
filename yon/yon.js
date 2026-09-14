(function () {
  "use strict";

  const root = document.documentElement;
  const story = document.querySelector(".story");
  const stage = document.getElementById("storyStage");
  const panels = Array.from(document.querySelectorAll(".story-panel"));
  const pageProgress = document.getElementById("pageProgress");
  const chapterProgress = document.getElementById("chapterProgress");
  const chapterTitle = document.getElementById("chapterTitle");
  const currentStep = document.getElementById("currentStep");
  const totalSteps = document.getElementById("totalSteps");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeIndex = -1;
  let ticking = false;

  root.style.setProperty("--slides", panels.length);
  totalSteps.textContent = String(panels.length).padStart(2, "0");

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setActivePanel(index) {
    if (index === activeIndex) return;
    panels.forEach(function (panel, panelIndex) {
      const active = panelIndex === index;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", active ? "false" : "true");
      if ("inert" in panel) panel.inert = !active;
    });
    const panel = panels[index];
    chapterTitle.textContent = panel.dataset.title || "";
    currentStep.textContent = String(index + 1).padStart(2, "0");
    stage.classList.toggle("is-last", index === panels.length - 1);
    activeIndex = index;
  }

  function render() {
    const storyTop = story.offsetTop;
    const travel = Math.max(1, story.offsetHeight - window.innerHeight);
    const ratio = clamp((window.scrollY - storyTop) / travel, 0, 1);
    const rawIndex = ratio * (panels.length - 1);
    const nearestIndex = clamp(Math.round(rawIndex), 0, panels.length - 1);

    setActivePanel(nearestIndex);
    pageProgress.style.transform = `scaleX(${ratio})`;
    chapterProgress.style.transform = `scaleX(${ratio})`;

    panels.forEach(function (panel, index) {
      const active = index === nearestIndex;
      panel.style.opacity = active ? "1" : "0";
      panel.style.transform = active || reduceMotion ? "none" : `translate3d(0,${index > nearestIndex ? 34 : -34}px,0)`;
      panel.style.visibility = active ? "visible" : "hidden";
    });
  }

  function scheduleRender() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      render();
      ticking = false;
    });
  }

  window.addEventListener("scroll", scheduleRender, { passive: true });
  window.addEventListener("resize", scheduleRender, { passive: true });
  window.addEventListener("pageshow", scheduleRender);
  render();
}());
