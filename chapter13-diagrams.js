/* Full-size views for the chapter's lecture diagrams. */
document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.getElementById('diagram-dialog');
  const image = document.getElementById('diagram-full-image');
  const viewport = document.getElementById('diagram-viewport');
  const zoomIn = document.getElementById('diagram-zoom-in');
  const zoomOut = document.getElementById('diagram-zoom-out');
  let opener = null, width = 0;

  function size(next) {
    if (!image.naturalWidth) return;
    width = Math.max(120, Math.min(image.naturalWidth * 3, next));
    image.style.width = `${Math.round(width)}px`;
    zoomIn.disabled = width >= image.naturalWidth * 3;
    zoomOut.disabled = width <= 120;
  }

  function fit() {
    if (!image.naturalWidth || !dialog.open) return;
    const availableWidth = Math.max(120, viewport.clientWidth - 48);
    const availableHeight = Math.max(120, viewport.clientHeight - 48);
    size(Math.min(image.naturalWidth, availableWidth,
      image.naturalWidth * availableHeight / image.naturalHeight));
    viewport.scrollTop = viewport.scrollLeft = 0;
  }

  image.addEventListener('load', fit);
  document.querySelectorAll('.diagram-open').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      document.getElementById('diagram-dialog-title').textContent = button.dataset.diagramTitle;
      image.alt = button.querySelector('img').alt;
      image.src = button.dataset.diagramSrc;
      dialog.showModal();
      if (image.complete) fit();
    });
  });
  document.getElementById('diagram-close').addEventListener('click', () => dialog.close());
  document.getElementById('diagram-fit').addEventListener('click', fit);
  zoomIn.addEventListener('click', () => size(width * 1.25));
  zoomOut.addEventListener('click', () => size(width / 1.25));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (opener) opener.focus({preventScroll: true});
  });
  window.addEventListener('resize', fit);
});
