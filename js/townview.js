// My Small Town — the full-screen town view: drag to look around, pinch or use
// the buttons to zoom. It works by moving the drawing's viewBox, so the town
// stays sharp at any zoom. On a phone it opens as a panorama, filling the
// screen's height, with the rest of the town a drag away.

const SCENE_W = 350;
const SCENE_H = 260;
const SMALLEST_VIEW = 60; // scene units across at full zoom

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const ICON = {
  out: '<path d="M5 12h14"/>',
  in: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>'
};
const icon = (name) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">${ICON[name]}</svg>`;

// Adds a "Zoom" button to a .scene element, and makes tapping the town open it too.
// render: returns the town's SVG markup for the full-screen view.
export function addTownZoom(sceneEl, render) {
  const open = () => openTownView(render);
  sceneEl.classList.add('scene--zoomable');
  sceneEl.insertAdjacentHTML('beforeend', `<button type="button" class="zoom-btn" aria-label="Zoom in on the town">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21M11 8v6M8 11h6"/></svg>Zoom</button>`);
  sceneEl.querySelector('.zoom-btn').addEventListener('click', open);
  sceneEl.querySelector('svg').addEventListener('click', open);
}

export function openTownView(render) {
  const dialog = document.createElement('dialog');
  dialog.className = 'town-view';
  dialog.setAttribute('aria-label', 'Zoomed view of the town');
  dialog.innerHTML = `
    <div class="town-view__stage">${render()}</div>
    <p class="town-view__hint">Drag to look around. Pinch or use the buttons to zoom.</p>
    <div class="town-view__bar">
      <button type="button" class="icon-btn" data-zoom="out" aria-label="Zoom out">${icon('out')}</button>
      <button type="button" class="icon-btn" data-zoom="in" aria-label="Zoom in">${icon('in')}</button>
      <button type="button" class="pill-btn" data-zoom="all">Whole town</button>
      <button type="button" class="icon-btn" data-close aria-label="Close">${icon('close')}</button>
    </div>`;
  document.body.append(dialog);

  const stage = dialog.querySelector('.town-view__stage');
  const svg = stage.querySelector('svg');
  svg.removeAttribute('aria-hidden');
  let zoom = 1;
  let cx = SCENE_W / 2;
  let cy = SCENE_H / 2;

  // At zoom 1 the whole town fits on screen.
  function fit() {
    const { width, height } = stage.getBoundingClientRect();
    const aspect = width / height;
    const fitW = Math.max(SCENE_W, SCENE_H * aspect);
    return { width, height, fitW, fitH: fitW / aspect };
  }

  function draw() {
    const { fitW, fitH } = fit();
    zoom = clamp(zoom, 1, fitW / SMALLEST_VIEW);
    const w = fitW / zoom;
    const h = fitH / zoom;
    cx = w >= SCENE_W ? SCENE_W / 2 : clamp(cx, w / 2, SCENE_W - w / 2);
    cy = h >= SCENE_H ? SCENE_H / 2 : clamp(cy, h / 2, SCENE_H - h / 2);
    svg.setAttribute('viewBox', `${cx - w / 2} ${cy - h / 2} ${w} ${h}`);
  }

  // Zooms while keeping the spot under (px, py) in place.
  function zoomAt(factor, px, py) {
    const { width, height, fitW, fitH } = fit();
    const x = px ?? width / 2;
    const y = py ?? height / 2;
    const fx = x / width - 0.5;
    const fy = y / height - 0.5;
    const pointX = cx + fx * (fitW / zoom);
    const pointY = cy + fy * (fitH / zoom);
    zoom = clamp(zoom * factor, 1, fitW / SMALLEST_VIEW);
    cx = pointX - fx * (fitW / zoom);
    cy = pointY - fy * (fitH / zoom);
    draw();
  }

  function pan(dx, dy) {
    const { width, height, fitW, fitH } = fit();
    cx -= (dx / width) * (fitW / zoom);
    cy -= (dy / height) * (fitH / zoom);
    draw();
  }

  // One finger or mouse drags; two fingers pinch.
  const pointers = new Map();
  let lastPinch = null;
  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPinch = null;
  });
  stage.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      pan(e.clientX - prev.x, e.clientY - prev.y);
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const box = stage.getBoundingClientRect();
      if (lastPinch) zoomAt(distance / lastPinch, (a.x + b.x) / 2 - box.left, (a.y + b.y) / 2 - box.top);
      lastPinch = distance;
    }
  });
  const release = (e) => { pointers.delete(e.pointerId); lastPinch = null; };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const box = stage.getBoundingClientRect();
    zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - box.left, e.clientY - box.top);
  }, { passive: false });
  stage.addEventListener('dblclick', (e) => {
    const box = stage.getBoundingClientRect();
    zoomAt(2, e.clientX - box.left, e.clientY - box.top);
  });

  dialog.addEventListener('keydown', (e) => {
    const step = 40;
    const actions = {
      ArrowLeft: () => pan(step, 0), ArrowRight: () => pan(-step, 0), ArrowUp: () => pan(0, step), ArrowDown: () => pan(0, -step),
      '+': () => zoomAt(1.4), '=': () => zoomAt(1.4), '-': () => zoomAt(1 / 1.4)
    };
    if (actions[e.key]) { e.preventDefault(); actions[e.key](); }
  });

  dialog.querySelector('[data-zoom="in"]').addEventListener('click', () => zoomAt(1.4));
  dialog.querySelector('[data-zoom="out"]').addEventListener('click', () => zoomAt(1 / 1.4));
  dialog.querySelector('[data-zoom="all"]').addEventListener('click', () => { zoom = 1; draw(); });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());

  window.addEventListener('resize', draw);
  dialog.addEventListener('close', () => {
    window.removeEventListener('resize', draw);
    dialog.remove();
  });

  dialog.showModal();
  // Panorama: open filling the screen's height, then let people drag sideways.
  const { fitH } = fit();
  zoom = Math.max(1, fitH / SCENE_H);
  draw();
}
