// ================= TRAILER · Cuộn băng số 2 (?trailer=1) =================
// Dựng từ chính các cảnh của game, chạy theo nhạc am/trailer.mp3 (Txmy · Solace, cắt 0:00–0:44 + 1:31.9–hết; bùng 27.0 và 61.6).
// Giao diện chơi ẩn hết; tiếng của game tắt, chỉ còn nhạc trailer và tiếng hiệu ứng riêng của trailer (TR.bus).
// Lớp khung phim (viền đen, hạt phim, thẻ chữ, tiếng chuyển cảnh) lấy từ tr-khung.js nếu có (TRK), không có thì dùng bản tối giản bên dưới.
(() => {
  if (!/[?&]trailer=1\b/.test(location.search)) return;
  const QS = new URLSearchParams(location.search), QUAY = QS.get('quay') === '1', GHI = QS.get('ghitieng') === '1'; // chỉ dùng khi đóng clip: vẽ từng khung (không tiếng) / thu riêng tiếng
  const TR = { el: null, T: 0, t0: 0, i: -1, bus: null, z: 1, px: 800, py: 450, tn: 58, started: false, end: false };
  window.TR = TR;

  // ---- ẩn giao diện chơi ----
  drawPocket = () => {}; drawHint = () => {}; drawBack = () => {};
  HINT.off = true;

  // ---- lớp khung phim tối giản (khi chưa có tr-khung.js) ----
  const K = typeof TRK !== 'undefined' ? TRK : (() => {
    const cards = [], cuts = [], flashes = [], snd = [];
    let bars = 0, barsTo = 0, barsSec = 1, dark = 1, darkTo = 1, darkSec = 1;
    const k = {
      out: null,
      reset() { cards.length = cuts.length = flashes.length = snd.length = 0; },
      bars(v, sec = 1) { barsTo = v; barsSec = Math.max(0.01, sec); },
      dark(v, sec = 1) { darkTo = v; darkSec = Math.max(0.01, sec); },
      card(o) { cards.push(o); },
      cut(at, quick) { cuts.push({ at, quick }); snd.push({ at: at - (quick ? 0 : 0.35), fn: () => (quick ? 0 : k.snd.swell(0.35)) }, { at, fn: () => (quick ? k.snd.shutter() : k.snd.thud()) }); },
      flash(at, mau) { flashes.push({ at, mau: mau || '255,214,160' }); },
      tick(T) { for (const s of snd) { if (!s.done && T >= s.at) { s.done = true; if (T - s.at < 0.4) s.fn(); } } },
      draw(c, T, now, dt = 0.016) {
        bars += (barsTo - bars) * Math.min(1, dt / barsSec * 3); dark += (darkTo - dark) * Math.min(1, dt / darkSec * 3);
        if (dark > 0.002) { c.fillStyle = `rgba(0,0,0,${dark})`; c.fillRect(-300, -300, W + 600, H + 600); }
        for (const f of flashes) { const e = T - f.at; if (e >= 0 && e < 0.6) { c.fillStyle = `rgba(${f.mau},${0.5 * (1 - e / 0.6)})`; c.fillRect(-300, -300, W + 600, H + 600); } }
        for (const u of cuts) { const e = T - u.at, d = u.quick ? 0.12 : 0.2; if (Math.abs(e) < d) { c.fillStyle = `rgba(0,0,0,${1 - Math.abs(e) / d})`; c.fillRect(-300, -300, W + 600, H + 600); } }
        for (const o of cards) { if (T < o.at || T > o.until + 0.7) continue; const a = Math.min(1, (T - o.at) / 0.8, (o.until + 0.7 - T) / 0.7);
          const big = o.kieu === 'ten', y = o.y || H / 2; o.lines.forEach((s, j) => text(c, s, W / 2, y + j * (big ? 70 : 52), big ? (j ? 30 : 64) : o.kieu === 'nho' ? 26 : 40, 0.9 * a, 'center', '240,232,220')); }
        const bh = 0.122 * H * bars; c.fillStyle = '#000'; c.fillRect(-300, -300, W + 600, 300 + bh); c.fillRect(-300, H - bh, W + 600, 300 + bh);
      },
      snd: {
        swell(d) { const t = ac.currentTime; nz(t, d + 0.1, 'lowpass', 180, 0.7, 0.5, 0, 900, TR.bus); },
        thud() { const t = ac.currentTime; tone(t, 68, 34, 0.5, 0.9, 'sine', TR.bus); nz(t, 0.25, 'lowpass', 220, 0.7, 0.35, 0, 0, TR.bus); },
        shutter() { const t = ac.currentTime; nz(t, 0.012, 'bandpass', 2600, 2, 0.45, 0, 0, TR.bus); nz(t + 0.035, 0.012, 'bandpass', 1900, 2, 0.35, 0, 0, TR.bus); tone(t, 90, 45, 0.3, 0.18, 'sine', TR.bus); },
        boom() { const t = ac.currentTime; tone(t, 95, 30, 0.9, 1.4, 'sine', TR.bus); nz(t, 0.6, 'lowpass', 260, 0.7, 0.6, 0, 0, TR.bus); },
        heart(n = 2) { const t = ac.currentTime; for (let i = 0; i < n; i++) { tone(t + i * 0.9, 62, 48, 0.5, 0.16, 'sine', TR.bus); tone(t + i * 0.9 + 0.22, 58, 45, 0.32, 0.14, 'sine', TR.bus); } },
        riser(d) { const t = ac.currentTime; nz(t, d, 'highpass', 300, 0.7, 0.25, 0, 7000, TR.bus); },
      },
    };
    return k;
  })();

  const viaBus = (fn) => { const m0 = master; master = TR.bus || m0; try { return fn(); } finally { master = m0; } };
  const KS = (name, ...a) => viaBus(() => K.snd[name] && K.snd[name](...a));
  // ---- tiếng riêng của trailer (đi vào TR.bus) ----
  const amb = {};
  function bed(name, gain, type, f, q, fadeSec = 1.5) { if (!amb[name]) { const n = loopNoise(0, type, f, q); n.gain.connect(TR.bus); amb[name] = n; } ramp(amb[name].gain.gain, gain, fadeSec); }
  const fade = (name, v, sec) => { if (amb[name]) ramp(amb[name].gain.gain, v, sec); };
  const sfx = {
    thunder() { const t = ac.currentTime; nz(t, 0.06, 'highpass', 2500, 0.7, 0.5, 0, 0, TR.bus); nz(t + 0.25, 3.2, 'lowpass', 160, 0.8, 0.9, 0, 70, TR.bus); nz(t + 0.4, 2.2, 'lowpass', 420, 0.7, 0.35, -0.3, 0, TR.bus); },
    car(dir) { const t = ac.currentTime; nz(t, 2.6, 'bandpass', 380, 1.2, 0.35, -0.8 * dir, 0, TR.bus); nz(t + 0.6, 1.8, 'lowpass', 220, 0.8, 0.3, 0.6 * dir, 0, TR.bus); },
    chirps() { const ct = ac.currentTime; for (let r = 0; r < 4; r++) { const f = 4300 + Math.random() * 500, t0 = ct + r * (0.6 + Math.random() * 0.9); for (let i = 0; i < 3; i++) nz(t0 + i * 0.055, 0.03, 'bandpass', f, 12, 0.05, Math.random() - 0.5, 0, TR.bus); } },
    play() { const t = ac.currentTime; nz(t, 0.018, 'bandpass', 2300, 2, 0.55, 0, 0, TR.bus); tone(t, 160, 70, 0.35, 0.16, 'sine', TR.bus); nz(t + 0.09, 0.012, 'bandpass', 3400, 3, 0.25, 0, 0, TR.bus); }, // bấm play: cạch
    drone(on, sec) { // tiếng trầm rền dồn lên trong khoảng lặng
      if (!amb.drone) { const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter(); o.frequency.value = 46; o2.frequency.value = 46.7; o2.type = 'triangle'; lp.type = 'lowpass'; lp.frequency.value = 180; g.gain.value = 0; o.connect(lp); o2.connect(lp); lp.connect(g).connect(TR.bus); o.start(); o2.start(); amb.drone = { gain: g, o, lp }; }
      ramp(amb.drone.gain.gain, on, sec); },
    ffJam() { // tua nhanh rít lên rồi kẹt cứng: "không tua nhanh được"
      const t = ac.currentTime, o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(1500, t + 0.85);
      bp.type = 'bandpass'; bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 0.85); bp.Q.value = 1.2; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.25); g.gain.setValueAtTime(0.09, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(bp).connect(g).connect(TR.bus); o.start(t); o.stop(t + 0.95);
      nz(t, 0.85, 'highpass', 2500, 0.7, 0.08, 0, 6000, TR.bus); for (let i = 0; i < 9; i++) nz(t + i * 0.09, 0.02, 'bandpass', 1400 + i * 120, 4, 0.1, 0, 0, TR.bus); // rít + lạch cạch bánh răng
      nz(t + 0.86, 0.06, 'bandpass', 900, 2, 0.8, 0, 0, TR.bus); tone(t + 0.86, 120, 55, 0.6, 0.35, 'sine', TR.bus); nz(t + 0.9, 0.3, 'lowpass', 300, 0.8, 0.5, 0, 0, TR.bus); }, // kẹt: cụp
    water() { const ct = ac.currentTime; for (let i = 0; i < 6; i++) nz(ct + i * 0.45 + Math.random() * 0.2, 0.35, 'bandpass', 500 + Math.random() * 400, 2, 0.06, Math.random() - 0.5, 0, TR.bus); }, // nước vỗ mép hồ
    clunk() { const t = ac.currentTime; nz(t, 0.02, 'bandpass', 2400, 2, 0.6, 0, 0, TR.bus); tone(t, 140, 60, 0.4, 0.2, 'sine', TR.bus); nz(t + 0.2, 0.03, 'bandpass', 1800, 2, 0.4, 0, 0, TR.bus); },
  };

  // ---- máy quay: phóng chậm toàn khung (sau khi cảnh đã vẽ), dùng được cho mọi cảnh kể cả cảnh dựng sẵn ----
  let camC = null;
  function camApply(g) {
    const z = TR.z; if (z <= 1.001) return;
    if (!camC) camC = document.createElement('canvas');
    if (camC.width !== cv.width || camC.height !== cv.height) { camC.width = cv.width; camC.height = cv.height; }
    const m = camC.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, camC.width, camC.height); m.drawImage(cv, 0, 0);
    const dx = (OX + S * TR.px) * dpr, dy = (OY + S * TR.py) * dpr;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.translate(dx, dy); g.scale(z, z); g.translate(-dx, -dy); g.drawImage(camC, 0, 0); g.restore();
  }

  // ---- cảnh tường bóng (chỉ vài giây đầu kịch bóng: em chạm vai, anh bỏ đi) ----
  SC.trTuong = { noBag: true, draw(c, now) { drawTuongBong(c, now, TR.tn); } };

  // ---- danh sách cảnh: at (giây trailer), sc, set (chuẩn bị trạng thái), up (mỗi khung), z [đầu, cuối], p [tâm phóng] ----
  const lerpT = (T, a, b) => clamp((T - a) / (b - a), 0, 1);
  const SHOTS = [
    { at: 0, sc: 'dorm', z: [1.02, 1.1], p: [820, 520], set() { P1.torch = false; bed('mua', 0.22, 'bandpass', 3200, 0.5, 3); bed('muaTram', 0.12, 'lowpass', 260, 0.7, 3); },
      up(T) { if (T > 7.2) { P1.torch = true; const u = lerpT(T, 7.2, 13); P1.tp = [330 + 980 * ease(u), 600 - 120 * Math.sin(u * Math.PI) + 18 * Math.sin(T * 1.7)]; } } },
    { at: 13.0, sc: 'hall', cut: 1, z: [1.0, 1.12], p: [800, 430], set() { fade('mua', 0, 1.2); fade('muaTram', 0, 1.2); bed('gio', 0.1, 'bandpass', 520, 0.6, 1.5); } },
    { at: 17.4, sc: 'cauthang', cut: 1, z: [1.06, 1.0], p: [700, 420], set() { fade('gio', 0.03, 2); } },
    { at: 27.0, sc: 'anh1', cut: 1, flash: 1, z: [1.0, 1.06], p: [800, 480], set() { ANH.mode = 2; ANH.dur = 1e9; ANH.done = null; fade('gio', 0, 0.6); }, after() { ANH.t = 6; } },
    { at: 31.2, sc: 'buctuong', cut: 1, z: [1.0, 1.08], p: [700, 420], set() { Object.assign(P4, { marks: 15, peel: 1, solved: true, done: false, lightT: 0 }); } },
    { at: 34.8, sc: 'dinhngoai', cut: 1, z: [1.0, 1.07], p: [800, 470], set() { sfx.chirps(); } },
    { at: 37.6, sc: 'benphai', cut: 1, z: [1.04, 1.0], p: [900, 600], set() { if (typeof BP !== 'undefined') BP.reveal = 1; P5.seenLoi = true; sfx.water(); } },
    { at: 40.2, sc: 'luotngo', cut: 1, z: [1.0, 1.08], p: [800, 450], set() { sfx.chirps(); } },
    { at: 44.6, sc: 'hall', z: [1.0, 1.05], p: [800, 470], set() { bed('gio', 0.06, 'bandpass', 520, 0.6, 3); } },
    { at: 55.6, sc: 'khuon', cut: 2, z: [1.06, 1.0], p: [800, 380], set() { Object.assign(P9.placed, { khuon_nu: true, khuon_nam: true }); P9.glow = 0.4; fade('gio', 0, 0.4); } },
    { at: 56.8, sc: 'hopsat', cut: 2, z: [1.08, 1.0], p: [700, 460], set() { P3.open = true; if (typeof HS !== 'undefined') HS.mo = 1; } },
    { at: 57.9, sc: 'radio', cut: 2, z: [1.0, 1.08], p: [800, 440], set() { P5.radioLat = false; } },
    { at: 58.9, sc: 'cuatro', cut: 2, z: [1.0, 1.06], p: [800, 450] },
    { at: 61.6, sc: 'ketduong', cut: 1, flash: 1, z: [1.22, 1.04], p: [520, 300], set() { if (SC.ketduong.enter) SC.ketduong.enter(); KT.den = 0; KT.cam = 0; KT.bong = 0; KT.sang = 0.7; KT.dom = 0; },
      up(T) { const u = lerpT(T, 61.6, 75); KT.den = 99 * (1 - (1 - u) * (1 - u)); KT.cam = 0.5 * Math.min(1, KT.den / 100) + 0.5 * ease(u); } },
    { at: 68.8, sc: 'ketdinh', cut: 1, z: [1.0, 1.07], p: [800, 420], set() { if (SC.ketdinh.enter) SC.ketdinh.enter(); KT.sang = 0.85; KT.dom = 0.6; KT.bong = 0; sfx.chirps(); } },
    { at: 75.6, sc: 'trTuong', cut: 1, z: [1.0, 1.0], p: [800, 450], up(T) { TR.tn = 58.6 + (T - 75.6) * 1.05; } },
    { at: 81.6, sc: 'trTuong', end: 1 },
  ];
  // ---- thẻ chữ ----
  [
    { at: 1.4, until: 4.6, lines: ['ĐÊM 9 · 11'], kieu: 'nho' },
    { at: 8.2, until: 11.0, lines: ['Ba lá thư.'], kieu: 'cau', y: 420 },
    { at: 9.8, until: 12.6, lines: ['Ba câu hỏi.'], kieu: 'cau', y: 490 },
    { at: 21.6, until: 25.8, lines: ['Mỗi câu hỏi… một cuộn băng.'], kieu: 'cau' },
    { at: 27.7, until: 30.6, lines: ['Ở MỘT NƠI KHÁC · CÙNG ĐÊM ẤY'], kieu: 'nho', y: 780 },
    { at: 32.0, until: 34.4, lines: ['Một trăm ngày.'], kieu: 'cau', y: 760 },
    { at: 46.4, until: 51.2, lines: ['Nếu thấy ai đứng trong bóng tối…'], kieu: 'cau' },
    { at: 54.1, until: 57.4, lines: ['…đừng sợ quá nhé.'], kieu: 'cau', y: 760 },
    { at: 70.2, until: 74.6, lines: ['Từng ngày một.'], kieu: 'tay', y: 760 },
    { at: 82.4, until: 89.4, lines: ['Không tua nhanh được', 'Cuộn băng số 2 · Chương 22'], kieu: 'ten' },
    { at: 86.9, until: 89.6, lines: ['Câu trả lời nằm trong ba cuộn băng.'], kieu: 'cau', y: 690 },
    { at: 89.4, until: 92.6, lines: ['Chờ em mở nha.'], kieu: 'tay', y: 760 },
  ].forEach((o) => K.card(o));
  SHOTS.forEach((s) => { if (s.cut) K.cut(s.at, s.cut === 2); if (s.flash) K.flash(s.at); });
  // các mốc khác: chớp, đèn xe, tim, bóng, tên phim, nhả băng
  const EV = [
    { at: 0, fn: () => { K.dark(1, 0.01); sfx.play(); bed('xi', 0.012, 'highpass', 3600, 0.7, 0.4); } },
    { at: 0.05, fn: () => K.bars(1, 2.5) },
    { at: 2.6, fn: () => K.dark(0, 2.6) },
    { at: 5.0, fn: () => { P1.flash = performance.now(); sfx.thunder(); } },
    { at: 7.2, fn: () => { const t = ac.currentTime; nz(t, 0.02, 'bandpass', 2600, 2, 0.4, 0, 0, TR.bus); tone(t, 1900, 1700, 0.05, 0.05, 'triangle', TR.bus); } }, // tách: đèn pin bật
    { at: 11.0, fn: () => { P1.flash = performance.now(); sfx.thunder(); } },
    { at: 17.9, fn: () => { CT.quet(1); sfx.car(1); } },
    { at: 20.4, fn: () => { CT.quet(-1); sfx.car(-1); } },
    { at: 24.6, fn: () => KS('riser', 2.3) },
    { at: 42.0, fn: () => K.dark(1, 1.6) },
    { at: 45.0, fn: () => K.dark(0.45, 3.5) },
    { at: 45.2, fn: () => sfx.drone(0.16, 7.5) },
    { at: 48.6, fn: () => KS('heart', 2) },
    { at: 51.4, fn: () => KS('heart', 1) },
    { at: 52.55, fn: () => sfx.drone(0, 0.08) }, // lặng hẳn một nhịp trước khi bóng bật ra
    { at: 52.9, fn: () => { K.dark(0.05, 0.05); HELP.at = performance.now(); HELP.x = 1060; HELP.y = 430; HELP.fx = 1; scareHit(1); } },
    { at: 53.9, fn: () => K.dark(0.5, 1.2) },
    { at: 55.4, fn: () => K.dark(0, 0.3) },
    { at: 59.6, fn: () => { K.dark(1, 1.4); KS('riser', 1.9); } },
    { at: 61.6, fn: () => { K.dark(0, 0.05); KS('boom'); } },
    { at: 80.45, fn: () => sfx.ffJam() },
    { at: 81.32, fn: () => { K.dark(1, 0.06); if (TR.mg) ramp(TR.mg.gain, 0, 0.05); } }, // băng kẹt: nhạc tắt phụt theo
    { at: 82.36, fn: () => { if (TR.mg) ramp(TR.mg.gain, 0.95, 0.35); } },
    { at: 82.4, fn: () => KS('boom') },
    { at: 92.4, fn: () => { sfx.clunk(); fade('xi', 0, 0.3); TR.end = true; } },
  ];

  // ---- đồng hồ & điều khiển ----
  // đã phát được nhạc thì luôn bám theo nhạc (nhạc dừng thì hình đứng yên cùng chỗ, không chạy vượt lên)
  const clock = () => (TR.el && TR.elOk && TR.el.currentTime > (TR.sk || 0) - 1 ? TR.el.currentTime : TR.started ? (performance.now() - TR.t0) / 1000 : 0);
  function shotAt(T) { let i = -1; for (let j = 0; j < SHOTS.length; j++) if (T >= SHOTS[j].at) i = j; return i; }
  function enterShot(i) {
    const s = SHOTS[i]; TR.i = i; if (s.end) return;
    if (s.set) s.set();
    V.prev = null; V.cur = null; go(s.sc, 1); V.prev = null; V.k = 1;
    if (s.after) s.after();
    HINT.off = true; HINT.text = '';
  }
  let lastT = -1;
  OVER.push((c, now, dt) => {
    if (!TR.started) return;
    const T = clock(); TR.T = T;
    lastT = T;
    const i = shotAt(T); if (i !== TR.i && i >= 0) enterShot(i);
    const s = SHOTS[TR.i];
    if (s && !s.end && V.cur !== s.sc) { V.cur = null; go(s.sc, 1); V.prev = null; V.k = 1; if (s.after) s.after(); } // lệnh chuyển cảnh cũ của game (hẹn giờ) không được kéo cảnh đi
    if (s && !s.end) { if (s.up) s.up(T); const nx = SHOTS[TR.i + 1], e = nx ? lerpT(T, s.at, nx.at) : 0, z = s.z || [1, 1]; TR.z = z[0] + (z[1] - z[0]) * e; TR.px = (s.p || [800, 450])[0]; TR.py = (s.p || [800, 450])[1]; }
    else TR.z = 1;
    for (const ev of EV) if (!ev.done && T >= ev.at) { ev.done = true; if (T - ev.at < 0.5) ev.fn(); }
    // nhạc đứng (rời trang, máy ngưng tiếng, mạng chậm) quá 1.5 giây: hỏi chạm để xem tiếp
    if (TR.elOk && !TR.end && !document.hidden && TR.el) { const ct = TR.el.currentTime; if (TR.el.paused || ct !== TR.lastCT) { TR.lastCT = ct; TR.lastMove = now; } else if (now - TR.lastMove > 1500) TR.ask = true; if (TR.el.paused && !TR.el.ended) TR.ask = true; }
    camApply(c);
    setT(c); viaBus(() => K.tick(T)); K.draw(c, T, now, dt);
    if (TR.end && T > 93.5) { text(c, 'chạm để xem lại', W / 2, H - 160, 24, 0.35 + 0.1 * Math.sin(now * 0.003)); }
    if (TR.ask && !TR.end) { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(-300, -300, W + 600, H + 600); c.fillStyle = 'rgba(240,232,220,.9)'; c.beginPath(); c.moveTo(W / 2 - 22, H / 2 - 30); c.lineTo(W / 2 + 30, H / 2); c.lineTo(W / 2 - 22, H / 2 + 30); c.closePath(); c.fill(); text(c, 'chạm để xem tiếp', W / 2, H / 2 + 86, 28, 0.8); }
  });

  // ---- đóng clip: dựng tiếng KHÔNG theo thời gian thực (OfflineAudioContext), cùng nhạc, cùng bộ nén như trên trang.
  // Thu tiếng lúc máy đang bận vẽ hình thì bộ phát tiếng hụt nhịp → lẹt xẹt; dựng tính từng mẫu thì không bao giờ hụt.
  TR.renderAudio = async (DUR = 93.6) => {
    const SR = 48000, oac = new OfflineAudioContext(2, Math.ceil(SR * DUR), SR);
    ac = oac; master = oac.createGain(); master.gain.value = 0; master.connect(oac.destination);
    noiseBuf = oac.createBuffer(2, SR * 4, SR);
    for (let ch = 0; ch < 2; ch++) { const d = noiseBuf.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; d[i] = (b0 + b1 + b2 + w * 0.02) * 0.5; } }
    try { FX = makeFX(); } catch (e) { /* bỏ qua */ }
    TR.bus = oac.createGain(); TR.bus.gain.value = 0.9; const lim = oac.createDynamicsCompressor(); lim.threshold.value = -8; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2; TR.bus.connect(lim).connect(oac.destination);
    SCARE_LIM = null; scareLim(); try { SCARE_LIM.disconnect(); } catch (e) { /* bỏ qua */ } SCARE_LIM.connect(TR.bus);
    const mus = await oac.decodeAudioData(await (await fetch('am/trailer.mp3')).arrayBuffer());
    const src = oac.createBufferSource(), g2 = oac.createGain(); src.buffer = mus; g2.gain.value = 0.95; src.connect(g2).connect(TR.bus); TR.mg = g2; src.start(0);
    const q = (t) => Math.max(0, Math.round(t * SR / 128) * 128 / SR);
    const times = new Set(); SHOTS.forEach((s) => { times.add(q(s.at)); if (s.cut && s.cut !== 2) times.add(q(s.at - 0.35)); }); EV.forEach((e) => times.add(q(e.at)));
    const safe = (fn) => { try { fn(); } catch (e) { /* cảnh chưa sẵn: chỉ cần tiếng */ } };
    [...times].filter((t) => t > 0 && t < DUR - 0.01).sort((x, y) => x - y).forEach((t) => oac.suspend(t).then(() => {
      viaBus(() => K.tick(t + 0.001));
      SHOTS.forEach((s) => { if (q(s.at) === t && s.set) safe(() => s.set()); });
      EV.forEach((e) => { if (q(e.at) === t && !e.done) { e.done = true; safe(e.fn); } });
      oac.resume();
    }));
    // giây 0: các tiếng mở màn
    viaBus(() => K.tick(0)); SHOTS.forEach((s) => { if (s.at === 0 && s.set) safe(() => s.set()); }); EV.forEach((e) => { if (e.at === 0) { e.done = true; safe(e.fn); } });
    const out = await oac.startRendering(); const L = out.getChannelData(0), R = out.getChannelData(1), n = out.length, o = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { o[2 * i] = L[i]; o[2 * i + 1] = R[i]; } window.__tieng = o; let pk = 0; for (let i = 0; i < o.length; i++) pk = Math.max(pk, Math.abs(o[i])); return { n, pk };
  };

  // ---- bắt đầu (cần cú chạm đầu tiên để có âm thanh) ----
  const st0 = START;
  START = () => {
    st0(); INTRO.t = 99; HINT.off = true; HINT.text = '';
    master.gain.value = 0; // tiếng của game tắt hẳn
    TR.bus = ac.createGain(); TR.bus.gain.value = 0.9; const lim = ac.createDynamicsCompressor(); lim.threshold.value = -8; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2; TR.bus.connect(lim).connect(ac.destination); // chặn đỉnh: cú dội to mà không rè
    scareLim(); try { SCARE_LIM.disconnect(); } catch (e) { /* bỏ qua */ } SCARE_LIM.connect(TR.bus);
    if (GHI) { // thu không nén 4 kênh: tiếng hiệu ứng (0,1) + nhạc (2,3, chỉ để căn khớp) ngay từ lúc bấm
      window.__cap = []; const mg = ac.createChannelMerger(4), s1 = ac.createChannelSplitter(2), sp = ac.createScriptProcessor(4096, 4, 1), mute = ac.createGain(); mute.gain.value = 0;
      TR.bus.connect(s1); s1.connect(mg, 0, 0); s1.connect(mg, 1, 1); TR.capMg = mg;
      sp.channelCountMode = 'explicit'; sp.channelCount = 4; mg.connect(sp); sp.connect(mute).connect(ac.destination);
      sp.onaudioprocess = (e) => { const b = e.inputBuffer, n = b.length, o = new Float32Array(n * 4); for (let ch = 0; ch < 4; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) o[i * 4 + ch] = d[i]; } window.__cap.push(o); };
      window.__capSr = ac.sampleRate; }
    if (QUAY) { TR.bus.gain.value = 0; TR.t0 = performance.now(); TR.started = true; return; } // đóng clip: hình chạy theo đồng hồ ảo, tiếng ghép sau
    const el = new Audio('am/trailer.mp3'); el.preload = 'auto'; TR.el = el;
    try { const src = ac.createMediaElementSource(el), g2 = ac.createGain(); g2.gain.value = 0.95; src.connect(g2); if (GHI) { TR.mbus = ac.createGain(); g2.connect(TR.mbus); TR.mbus.connect(ac.destination); const s2 = ac.createChannelSplitter(2); TR.mbus.connect(s2); s2.connect(TR.capMg, 0, 2); s2.connect(TR.capMg, 1, 3); } else g2.connect(TR.bus); TR.mg = g2; } catch (e) { /* bỏ qua */ }
    const sk = +(new URLSearchParams(location.search).get('t') || 0); TR.sk = sk;
    if (sk) { const go2 = () => { el.currentTime = sk; }; if (el.readyState >= 1) go2(); else el.addEventListener('loadedmetadata', go2, { once: true }); }
    el.addEventListener('playing', () => { TR.elOk = true; TR.ask = false; TR.lastMove = performance.now(); });
    el.play().catch(() => {}); TR.t0 = performance.now() - sk * 1000; TR.started = true;
    if (sk) { K.dark(sk > 81.4 || (sk > 42 && sk < 45) ? 1 : 0, 0.01); K.bars(1, 0.01); EV.forEach((ev) => { if (ev.at < sk) ev.done = true; }); } // nhảy tới giây sk (để thử)
    setTimeout(() => { HINT.off = true; HINT.text = ''; }, 50);
  };
  // xem xong: chạm để xem lại · đang dừng giữa chừng: chạm để xem tiếp (iPhone cần cú chạm mới phát lại tiếng)
  addEventListener('pointerdown', () => {
    if (TR.end && TR.T > 93.5) { location.reload(); return; }
    if (TR.ask && TR.el) { try { ac.resume(); } catch (e) { /* bỏ qua */ } TR.el.play().then(() => { TR.ask = false; TR.lastMove = performance.now(); }).catch(() => {}); }
  });
  // rời trang (chuyển ứng dụng, khoá máy): dừng hẳn nhạc để hình và tiếng giữ nguyên chỗ; quay lại thì chạm để xem tiếp
  const away = () => { if (TR.started && !TR.end && TR.el && !TR.el.paused) { TR.el.pause(); TR.ask = true; } };
  document.addEventListener('visibilitychange', () => { if (document.hidden) away(); });
  addEventListener('pagehide', away);
})();
