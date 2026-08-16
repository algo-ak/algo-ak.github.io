(function () {
  "use strict";

  function initialize() {
    var body = document.body;
    var main = document.querySelector("main, .chapter-body, .chapter");
    if (!main) return;
    if (!main.id) main.id = "chapter-content";

    if (!document.querySelector(".skip, .skip-link, .quality-skip")) {
      var skip = document.createElement("a");
      skip.className = "quality-skip";
      skip.href = "#" + main.id;
      skip.textContent = "Skip to chapter content";
      body.insertBefore(skip, body.firstChild);
    }

    var ownProgress = !document.querySelector("#progress, #reading-progress-bar");
    var progressBar = document.getElementById("progress") || document.getElementById("reading-progress-bar");
    if (ownProgress) {
      var progress = document.createElement("div");
      progress.className = "quality-progress";
      progress.setAttribute("aria-hidden", "true");
      progress.innerHTML = "<span></span>";
      body.insertBefore(progress, body.firstChild);
      progressBar = progress.firstElementChild;
    }

    var topButton = document.getElementById("top") || document.getElementById("back-top");
    var ownTop = !topButton;
    if (ownTop) {
      topButton = document.createElement("button");
      topButton.type = "button";
      topButton.className = "quality-top";
      body.appendChild(topButton);
    }
    topButton.type = "button";
    topButton.setAttribute("aria-label", "Back to the top");
    topButton.setAttribute("title", "Back to the top");
    topButton.innerHTML = "↑ <span>Back to top</span>";

    document.querySelectorAll("button:not([type])").forEach(function (button) {
      button.type = "button";
    });
    document.querySelectorAll(".nav").forEach(function (nav) {
      if (!nav.getAttribute("aria-label")) nav.setAttribute("aria-label", "Main navigation");
    });
    document.querySelectorAll(".chapter-nav").forEach(function (nav) {
      if (!nav.getAttribute("aria-label")) nav.setAttribute("aria-label", "Chapter navigation");
    });
    document.querySelectorAll(".toc").forEach(function (toc) {
      if (!toc.getAttribute("aria-label")) toc.setAttribute("aria-label", "Chapter contents");
    });
    document.querySelectorAll(".nav a.active").forEach(function (link) {
      link.setAttribute("aria-current", "page");
    });
    document.querySelectorAll("a[download]").forEach(function (link) {
      if (!link.getAttribute("aria-label")) {
        link.setAttribute("aria-label", "Download the chapter presentation");
      }
    });
    document.querySelectorAll("details").forEach(function (details) {
      var summary = details.querySelector(":scope > summary");
      if (!summary) return;
      summary.setAttribute("aria-expanded", details.open ? "true" : "false");
      details.addEventListener("toggle", function () {
        summary.setAttribute("aria-expanded", details.open ? "true" : "false");
      });
    });
    document.querySelectorAll("a[target='_blank']").forEach(function (link) {
      var rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      rel.add("noopener"); rel.add("noreferrer");
      link.setAttribute("rel", Array.from(rel).join(" "));
    });
    document.querySelectorAll(".readout, .status, .viz-status, .viz-message, .anim-message, .result-text").forEach(function (node) {
      if (!node.getAttribute("aria-live")) node.setAttribute("aria-live", "polite");
      node.setAttribute("aria-atomic", "true");
    });
    document.querySelectorAll("canvas").forEach(function (canvas, index) {
      if (!canvas.getAttribute("role")) canvas.setAttribute("role", "img");
      if (!canvas.getAttribute("aria-label")) {
        var panel = canvas.closest("figure, .lab, .visual, .viz, .canvas-wrap, section");
        var heading = panel && panel.querySelector("figcaption, h3, h2, .lab-title");
        canvas.setAttribute("aria-label", heading ? heading.textContent.trim() : "Interactive chapter diagram " + (index + 1));
      }
    });
    document.querySelectorAll("input:not([type='hidden']), select, textarea").forEach(function (control, index) {
      if (control.getAttribute("aria-label") || control.getAttribute("aria-labelledby")) return;
      if (control.id && document.querySelector("label[for='" + CSS.escape(control.id) + "']")) return;
      var readable = control.id ? control.id.replace(/[-_]+/g, " ") : "control " + (index + 1);
      control.setAttribute("aria-label", "Interactive setting: " + readable);
    });

    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function update() {
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var pct = Math.min(100, Math.max(0, window.scrollY / max * 100));
      if (ownProgress && progressBar) progressBar.style.width = pct + "%";
      var showTop = window.scrollY > 650;
      topButton.classList.toggle("show", showTop);
      topButton.classList.toggle("visible", showTop);
    }
    topButton.addEventListener("click", function () {
      window.scrollTo({top: 0, behavior: reduced ? "auto" : "smooth"});
    });
    window.addEventListener("scroll", update, {passive: true});
    window.addEventListener("resize", update);
    update();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
