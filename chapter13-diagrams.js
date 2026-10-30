/* Full-size views clone the page's native diagram, retaining selectable text. */
document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.getElementById('diagram-dialog');
  const content = document.getElementById('diagram-full-content');
  const stage = document.getElementById('diagram-zoom-stage');
  const viewport = document.getElementById('diagram-viewport');
  const zoomIn = document.getElementById('diagram-zoom-in');
  const zoomOut = document.getElementById('diagram-zoom-out');
  if (!dialog || !content || !stage) return;
  let opener = null, width = 800, scale = 1;

  function layout() {
    if (!dialog.open) return;
    content.style.transform = `scale(${scale})`;
    stage.style.width = `${Math.ceil(width * scale)}px`;
    stage.style.height = `${Math.ceil(content.offsetHeight * scale)}px`;
    zoomIn.disabled = scale >= 3;
    zoomOut.disabled = scale <= .2;
  }

  function size(next) {
    scale = Math.max(.2, Math.min(3, next));
    layout();
  }

  function fit() {
    if (!dialog.open) return;
    size(Math.min(1, Math.max(120, viewport.clientWidth - 48) / width));
    viewport.scrollTop = viewport.scrollLeft = 0;
  }

  document.querySelectorAll('.diagram-open').forEach(button => {
    button.addEventListener('click', () => {
      const source = document.getElementById(button.dataset.diagramId);
      if (!source) return;
      opener = button;
      const copy = source.cloneNode(true);
      const renamed = new Map();
      [copy, ...copy.querySelectorAll('[id]')].forEach(node => {
        if (!node.id) return;
        const next = `enlarged-${node.id}`;
        renamed.set(node.id, next);
        node.id = next;
      });
      [copy, ...copy.querySelectorAll('[aria-labelledby], [aria-describedby]')].forEach(node => {
        ['aria-labelledby', 'aria-describedby'].forEach(attribute => {
          const value = node.getAttribute(attribute);
          if (value) node.setAttribute(attribute,
            value.split(/\s+/).map(id => renamed.get(id) || id).join(' '));
        });
      });
      const diagramWidth = Math.max(source.clientWidth,
        ...Array.from(source.querySelectorAll('.nd-canvas, .nd-lcs-matrix'), node => node.scrollWidth));
      width = Math.max(320, diagramWidth) + 44;
      content.style.width = `${width}px`;
      content.replaceChildren(copy);
      document.getElementById('diagram-dialog-title').textContent = button.dataset.diagramTitle;
      dialog.showModal();
      fit();
    });
  });
  document.getElementById('diagram-close').addEventListener('click', () => dialog.close());
  document.getElementById('diagram-fit').addEventListener('click', fit);
  zoomIn.addEventListener('click', () => size(scale * 1.25));
  zoomOut.addEventListener('click', () => size(scale / 1.25));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    content.replaceChildren();
    if (opener) opener.focus({preventScroll: true});
  });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(content);
  if (document.fonts) document.fonts.ready.then(layout);
  window.addEventListener('resize', fit);
});
