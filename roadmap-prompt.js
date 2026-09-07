(function () {
  "use strict";

  if (document.getElementById("roadmapPrompt")) return;

  var stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "./roadmap-prompt.css?v=20260907";
  document.head.appendChild(stylesheet);

  var promptElement = document.createElement("aside");
  promptElement.className = "roadmap-prompt";
  promptElement.id = "roadmapPrompt";
  promptElement.setAttribute("aria-label", "Course roadmap");
  promptElement.hidden = true;
  promptElement.innerHTML =
    '<svg class="roadmap-prompt-thread" viewBox="0 0 116 88" aria-hidden="true" preserveAspectRatio="none">' +
      '<path d="M96 0 C 97 23, 59 22, 61 47 S 82 68, 52 87"></path>' +
      '<circle cx="96" cy="1" r="3.2"></circle>' +
      '<circle cx="52" cy="87" r="3.2"></circle>' +
    '</svg>' +
    '<button class="roadmap-prompt-close" type="button" aria-label="Dismiss roadmap suggestion">&times;</button>' +
    '<a class="roadmap-prompt-action" href="roadmap.html#roadmap">' +
      'Visit roadmap' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<path d="M5 12h14M13 6l6 6-6 6"></path>' +
      '</svg>' +
    '</a>';
  document.body.appendChild(promptElement);

  var storageKey = "daa-roadmap-prompt-dismissed";
  var dismissed = false;
  try { dismissed = window.sessionStorage.getItem(storageKey) === "true"; } catch (error) {}
  if (dismissed) return;

  window.setTimeout(function () {
    promptElement.hidden = false;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        promptElement.classList.add("is-visible");
      });
    });
  }, 650);

  promptElement.querySelector(".roadmap-prompt-close").addEventListener("click", function () {
    promptElement.classList.remove("is-visible");
    try { window.sessionStorage.setItem(storageKey, "true"); } catch (error) {}
    window.setTimeout(function () { promptElement.hidden = true; }, 280);
  });
})();
