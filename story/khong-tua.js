// Khung trang chương 22 (c24 · "Không tua nhanh được" · Băng số 2 Mặt A).
// Phần thân sẽ được thay sau; khung vẽ nền tối 1 lần theo kích thước khung, không chạy vòng rAF ngầm và không ghi localStorage.
'use strict';
(() => {
  const cv = document.getElementById('cv');
  if (!cv) return;
  const g = cv.getContext('2d');
  const L = { W: 0, H: 0 };

  function draw() {
    if (!g) return;
    const W = L.W, H = L.H;
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#03050c');
    sky.addColorStop(0.6, '#070b18');
    sky.addColorStop(1, '#020308');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    const r = Math.min(W, H) * 0.36;
    const glow = g.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, r);
    glow.addColorStop(0, 'rgba(255, 212, 142, .08)');
    glow.addColorStop(1, 'rgba(255, 170, 90, 0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);
  }

  function layout() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth, H = window.innerHeight;
    L.W = W;
    L.H = H;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  window.addEventListener('resize', layout);
  layout();
})();
