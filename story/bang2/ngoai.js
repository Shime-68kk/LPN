// Kết 2: hành lang, sân xe, sân thượng (bài 39)
(() => {

  // layer() của core.js không nhận kích thước: tự đặt cỡ. Lớp nền toàn cảnh vẽ theo pixel màn hình (như phong502.js).
  const lop = (w, h) => { const [cv0, g] = layer(); cv0.width = Math.max(1, Math.ceil(w)); cv0.height = Math.max(1, Math.ceil(h)); return [cv0, g]; };
  const lopNen = () => { const [cv0, g] = layer(); cv0.width = cv.width || W; cv0.height = cv.height || H; setT(g); return [cv0, g]; };
  const veNen = (c, img) => { if (!img) return; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(img, 0, 0); c.restore(); };
  const lechCo = (img) => !img || img.width !== cv.width || img.height !== cv.height;
  'use strict';

  const NGOAI_KEY = 'lpn:ket2ngoai';
  const ALL_MANH = ['Mi4', 'Si4', 'La4', 'Đô#5', 'Fa#5'];

  // ---------- Trạng thái phụ dùng chung với window.KET2 ----------
  function hasPiece(id) {
    return typeof KET2 !== 'undefined' && KET2.has(id);
  }

  function hasAll5() {
    if (typeof KET2 === 'undefined') return false;
    for (let i = 0; i < ALL_MANH.length; i++) {
      if (!KET2.has(ALL_MANH[i])) return false;
    }
    return true;
  }

  function restoreNgoaiState() {
    if (typeof KET2 === 'undefined' || !KET2.st) return;
    try {
      const rawMain = localStorage.getItem('lpn:ket2');
      if (!rawMain) {
        localStorage.removeItem(NGOAI_KEY);
        return;
      }
      const mainObj = JSON.parse(rawMain);
      const rawExtra = localStorage.getItem(NGOAI_KEY);
      const extraObj = rawExtra ? JSON.parse(rawExtra) : null;
      if (mainObj && mainObj.cop) KET2.st.cop = true;
      if (extraObj && extraObj.cop) KET2.st.cop = true;
      if (hasPiece('Đô#5')) KET2.st.cop = true;
      if (mainObj && mainObj.thayCuaSo) KET2.st.thayCuaSo = true;
      if (extraObj && extraObj.thayCuaSo) KET2.st.thayCuaSo = true;
    } catch (_) {}
  }

  function saveNgoaiState() {
    if (typeof KET2 === 'undefined' || !KET2.st) return;
    KET2.save();
    try {
      const extra = {
        cop: !!KET2.st.cop,
        thayCuaSo: !!KET2.st.thayCuaSo,
      };
      localStorage.setItem(NGOAI_KEY, JSON.stringify(extra));
      const raw = localStorage.getItem('lpn:ket2');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object') {
          obj.cop = extra.cop;
          obj.thayCuaSo = extra.thayCuaSo;
          localStorage.setItem('lpn:ket2', JSON.stringify(obj));
        }
      }
    } catch (_) {}
  }

  function sayVi(s) {
    if (window.KET2_PHIM_DANG) return;
    if (typeof KET2 !== 'undefined' && KET2.say) KET2.say(s);
    else if (typeof sayNow === 'function') sayNow(s);
  }

  function clearSayVi() {
    if (typeof KET2 !== 'undefined' && KET2.clearSay) KET2.clearSay();
  }

  function setSceneHints(list) {
    if (typeof HINT === 'undefined' || typeof hints !== 'function') return;
    HINT.off = false;
    hints(list);
  }

  let all5SayTimer = null;
  function scheduleAll5Say() {
    if (all5SayTimer) clearTimeout(all5SayTimer);
    all5SayTimer = setTimeout(() => {
      all5SayTimer = null;
      if (typeof V === 'undefined') return;
      if (V.cur !== 'sanxe' && V.cur !== 'santhuong' && V.cur !== 'hanhlang') return;
      if (!hasAll5()) return;
      sayVi('Đủ năm mảnh rồi. Về phòng thôi.');
    }, 2500);
  }

  function updateNgoaiHints(scene) {
    if (hasAll5()) {
      setSceneHints(['Đủ năm mảnh rồi. Về phòng thôi.']);
      return;
    }
    if (scene === 'sanxe') {
      if (hasPiece('Đô#5')) {
        setSceneHints([
          'Trong cốp xe hết đồ cần tìm rồi.',
          'Quay lại hành lang bằng nút mũi tên góc trên.',
        ]);
      } else {
        setSceneHints([
          'Chiếc xe gần nhất được đèn rọi sáng hơn.',
          'Cốp xe nằm dưới yên.',
          'Mở túi, cầm chìa khoá xe rồi chạm vào yên.',
        ]);
      }
    } else if (scene === 'santhuong') {
      if (hasPiece('Fa#5')) {
        setSceneHints([
          'Còn một mảnh nữa chưa nhặt ở tầng dưới.',
          'Cầu thang xuống hành lang ở góc trên bên trái.',
        ]);
      } else {
        setSceneHints([
          'Trời tối quá, phải chờ.',
          'Tia chớp soi rõ mọi thứ trong một khoảnh khắc.',
          'Nhìn chân bồn nước lúc trời chớp.',
        ]);
      }
    } else {
      if (!hasPiece('Đô#5') && !hasPiece('Fa#5')) {
        setSceneHints([
          'Thang máy bên trái xuống sân xe.',
          'Cầu thang bên phải lên sân thượng.',
        ]);
      } else if (!hasPiece('Đô#5')) {
        setSceneHints([
          'Còn một mảnh nữa ở tầng dưới.',
          'Thang máy bên trái đi xuống sân xe.',
        ]);
      } else {
        setSceneHints([
          'Còn một mảnh nữa ở trên cao.',
          'Cầu thang bên phải đi lên sân thượng.',
        ]);
      }
    }
  }

  // ---------- Random & Engine phối cảnh 3D riêng ----------
  let seedN = 3907;
  function nseed(v) {
    seedN = (v | 0) || 1;
  }
  function nrnd() {
    seedN = (seedN * 16807) % 2147483647;
    return (seedN - 1) / 2147483646;
  }

  const CAM = { x: 0, y: 1.45, z: -1.1, f: 1060, hx: 800, hy: 455 };
  function setCam(x, y, z, f, hx, hy) {
    CAM.x = x;
    CAM.y = y;
    CAM.z = z;
    CAM.f = f;
    CAM.hx = hx;
    CAM.hy = hy;
  }
  function P(x, y, z) {
    const dz = z - CAM.z;
    const d = dz > 0.14 ? dz : 0.14;
    const sc = CAM.f / d;
    return [CAM.hx + (x - CAM.x) * sc, CAM.hy - (y - CAM.y) * sc, sc];
  }

  function poly(c, pts, fill, stroke, lw) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = lw || 1.2;
      c.stroke();
    }
  }

  function seg(c, a, b, col, lw) {
    const p1 = P(a[0], a[1], a[2]);
    const p2 = P(b[0], b[1], b[2]);
    c.beginPath();
    c.moveTo(p1[0], p1[1]);
    c.lineTo(p2[0], p2[1]);
    c.strokeStyle = col;
    c.lineWidth = lw || 2;
    c.stroke();
  }

  // ---------- Glow sprites dựng sẵn (không shadowBlur) ----------
  function makeGlow(r, rgb, aMax) {
    const [cvG, cx] = lop(r * 2, r * 2);
    const g = cx.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, `rgba(${rgb},${aMax})`);
    g.addColorStop(0.28, `rgba(${rgb},${(aMax * 0.42).toFixed(3)})`);
    g.addColorStop(0.62, `rgba(${rgb},${(aMax * 0.12).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    cx.fillStyle = g;
    cx.fillRect(0, 0, r * 2, r * 2);
    return cvG;
  }

  function makeOvalGlow(rw, rh, rgb, aMax) {
    const [cvG, cx] = lop(rw * 2, rh * 2);
    cx.save();
    cx.translate(rw, rh);
    cx.scale(1, rh / rw);
    const g = cx.createRadialGradient(0, 0, 0, 0, 0, rw);
    g.addColorStop(0, `rgba(${rgb},${aMax})`);
    g.addColorStop(0.35, `rgba(${rgb},${(aMax * 0.36).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    cx.fillStyle = g;
    cx.fillRect(-rw, -rw, rw * 2, rw * 2);
    cx.restore();
    return cvG;
  }

  const GLOW = {
    warm: makeGlow(280, '255,204,126', 0.44),
    warmDot: makeGlow(52, '255,198,112', 0.72),
    cold: makeGlow(320, '204,228,255', 0.38),
    street: makeOvalGlow(240, 86, '248,186,104', 0.32),
    green: makeGlow(88, '88,214,142', 0.45),
    pink: makeGlow(82, '244,132,182', 0.48),
    flash: makeOvalGlow(640, 290, '212,232,255', 0.45),
  };

  function drawGlow(c, img, x, y, scale, alpha, additive) {
    if (alpha <= 0.002) return;
    const prevA = c.globalAlpha;
    const prevComp = c.globalCompositeOperation;
    c.globalAlpha = prevA * alpha;
    if (additive) c.globalCompositeOperation = 'lighter';
    const w = img.width * (scale || 1);
    const h = img.height * (scale || 1);
    c.drawImage(img, x - w * 0.5, y - h * 0.5, w, h);
    c.globalCompositeOperation = prevComp;
    c.globalAlpha = prevA;
  }

  // ---------- Âm thanh WebAudio & dọn sạch khi rời cảnh ----------
  let amb = null;

  function stopAmbient(immediate) {
    if (!amb) return;
    const old = amb;
    amb = null;
    try {
      if (ac && old.masterG) {
        if (immediate) {
          old.masterG.gain.setValueAtTime(0.0001, ac.currentTime);
        } else {
          ramp(old.masterG.gain, 0.0001, 0.16);
        }
      }
    } catch (_) {}
    const stopNodes = () => {
      for (let i = 0; i < old.nodes.length; i++) {
        const n = old.nodes[i];
        try {
          if (n && n.stop) n.stop();
          if (n && n.src && n.src.stop) n.src.stop();
        } catch (_) {}
      }
      try {
        if (old.masterG && old.masterG.disconnect) old.masterG.disconnect();
      } catch (_) {}
    };
    if (immediate) stopNodes();
    else setTimeout(stopNodes, 240);
  }

  function startAmbient(scene, setupFn) {
    stopAmbient(true);
    if (!ac || !master) return;
    if (ac.state === 'suspended') {
      try {
        ac.resume();
      } catch (_) {}
    }
    const mg = ac.createGain();
    mg.gain.value = 0.0001;
    mg.connect(master);
    const rec = { scene: scene, masterG: mg, nodes: [] };
    amb = rec;
    setupFn(rec);
    if (!document.hidden) ramp(mg.gain, 1, 0.35);
  }

  if (typeof go === 'function') {
    const _ngoaiOrigGo = go;
    go = function (name, ms) {
      if (amb && amb.scene !== name) stopAmbient();
      return _ngoaiOrigGo(name, ms);
    };
  }

  if (typeof OVER !== 'undefined') {
    OVER.push(() => {
      if (amb && typeof V !== 'undefined' && V.cur !== amb.scene) {
        stopAmbient();
      }
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (!amb || !ac || !amb.masterG) return;
    try {
      if (document.hidden) ramp(amb.masterG.gain, 0.0001, 0.08);
      else if (typeof V !== 'undefined' && V.cur === amb.scene) ramp(amb.masterG.gain, 1, 0.25);
    } catch (_) {}
  });

  function playSensorClick() {
    if (!ac || !master) return;
    const t = ac.currentTime + 0.01;
    nz(t, 0.025, 'bandpass', 2400, 3.2, 0.06, 0, 1100);
    tone(t, 360, 140, 0.04, 0.032, 'triangle');
  }

  function playElevChime() {
    if (!ac || !master) return;
    const t = ac.currentTime + 0.01;
    tone(t, 1046.5, 1042, 0.06, 0.62, 'sine');
    tone(t, 1569.8, 1564, 0.022, 0.48, 'sine');
    nz(t + 0.16, 0.56, 'bandpass', 340, 1.4, 0.038, -0.35, 220);
  }

  function playStairSteps() {
    if (!ac || !master) return;
    const t = ac.currentTime + 0.04;
    for (let i = 0; i < 3; i++) {
      const ti = t + i * 0.25;
      if (typeof FX !== 'undefined' && FX.step) FX.step(ti, 0.24);
      nz(ti, 0.055, 'lowpass', 420 + i * 55, 0.9, 0.045 - i * 0.008, 0.25);
    }
  }

  function playLockedRattle() {
    if (!ac || !master) return;
    const t = ac.currentTime + 0.01;
    tone(t, 185, 92, 0.036, 0.055, 'triangle');
    nz(t, 0.038, 'bandpass', 740, 2.5, 0.035);
    tone(t + 0.075, 165, 86, 0.024, 0.045, 'triangle');
  }

  function playUnlockTrunk() {
    if (!ac || !master) return;
    const t = ac.currentTime + 0.01;
    nz(t, 0.048, 'bandpass', 2700, 3.6, 0.042);
    tone(t + 0.07, 410, 145, 0.062, 0.055, 'square');
    nz(t + 0.07, 0.048, 'bandpass', 1800, 2.8, 0.068);
    tone(t + 0.13, 185, 315, 0.03, 0.17, 'sine');
  }

  function playDistantThunder() {
    if (!ac || !master) return;
    if (typeof V !== 'undefined' && V.cur !== 'santhuong') return;
    const t = ac.currentTime + 0.02;
    const dest = amb && amb.scene === 'santhuong' ? amb.masterG : master;
    nz(t, 2.3, 'lowpass', 138, 0.85, 0.088, -0.08, 62, dest);
    tone(t + 0.05, 54, 34, 0.052, 1.85, 'sine', dest);
  }

  function drawHandLabel(c, str, x, y, dir, alpha) {
    if (window.KET2_PHIM_DANG) return;
    c.save();
    c.globalAlpha = c.globalAlpha * (alpha || 0.56);
    c.font = `19px ${HAND}`;
    c.fillStyle = 'rgba(224,218,205,1)';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(str, x, y);

    c.strokeStyle = 'rgba(224,218,205,0.85)';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    c.beginPath();
    if (dir === 'down') {
      const ax = x;
      const ay = y + 17;
      c.moveTo(ax - 1, ay);
      c.quadraticCurveTo(ax + 1, ay + 11, ax - 1, ay + 21);
      c.moveTo(ax - 6, ay + 15);
      c.lineTo(ax - 1, ay + 22);
      c.lineTo(ax + 5, ay + 15);
    } else {
      const ax = x + 3;
      const ay = y + 19;
      c.moveTo(ax - 8, ay + 12);
      c.quadraticCurveTo(ax + 2, ay + 4, ax + 11, ay - 6);
      c.moveTo(ax + 4, ay - 6);
      c.lineTo(ax + 12, ay - 7);
      c.lineTo(ax + 10, ay + 2);
    }
    c.stroke();
    c.restore();
  }

  const RETURN_LABEL_R = { x: 660, y: 700, w: 280, h: 112 };

  function drawReturnLabel(c, label, dir, now, fade) {
    if (window.KET2_PHIM_DANG) return;
    const f = fade == null ? 1 : fade;
    if (f <= 0.005) return;
    const cx = 800;
    const cy = 742;
    const ready = hasAll5();
    const tNow = now || 0;
    const pulse = ready
      ? 0.72 + 0.26 * (0.5 + 0.5 * Math.sin(tNow * 0.0034))
      : 0.56 + 0.08 * Math.sin(tNow * 0.0022);
    const col = ready ? '252,232,196' : '236,230,218';

    c.save();
    if (ready) {
      const b = 0.5 + 0.5 * Math.sin(tNow * 0.0034);
      drawGlow(c, GLOW.warm, cx, cy + 12, 0.44 + 0.05 * b, (0.20 + 0.14 * b) * f, true);
    }
    c.strokeStyle = `rgba(${col},${(pulse * f).toFixed(3)})`;
    c.lineWidth = ready ? 3.5 : 3.2;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    c.beginPath();
    if (dir === 'up') {
      c.moveTo(cx + 6, cy + 15);
      c.bezierCurveTo(cx + 12, cy + 4, cx - 6, cy - 4, cx - 2, cy - 16);
      c.stroke();
      c.beginPath();
      c.moveTo(cx - 10, cy - 7);
      c.lineTo(cx - 2, cy - 17);
      c.lineTo(cx + 7, cy - 8);
    } else if (dir === 'down') {
      c.moveTo(cx - 5, cy - 15);
      c.bezierCurveTo(cx - 11, cy - 3, cx + 7, cy + 4, cx + 2, cy + 15);
      c.stroke();
      c.beginPath();
      c.moveTo(cx - 7, cy + 7);
      c.lineTo(cx + 2, cy + 16);
      c.lineTo(cx + 11, cy + 6);
    } else {
      c.moveTo(cx - 18, cy + 9);
      c.bezierCurveTo(cx - 19, cy - 14, cx + 16, cy - 17, cx + 12, cy + 11);
      c.stroke();
      c.beginPath();
      c.moveTo(cx + 4, cy + 3);
      c.lineTo(cx + 12, cy + 12);
      c.lineTo(cx + 20, cy + 4);
    }
    c.stroke();
    text(c, label, cx, cy + 38, ready ? 18 : 17, pulse * (ready ? 0.94 : 0.78) * f, 'center', col);
    c.restore();
  }

  // =====================================================================
  // B1 · CẢNH 1: SC.hanhlang (Ngoài cửa 502, 3 giờ sáng)
  // =====================================================================
  let hlDarkC = null;
  let hlLitC = null;
  let hlTime = 0;
  let hlLampAt = 0.2;
  let hlLampClicked = false;
  let hlAnim = null;

  const HL_ELEV_R = { x: 245, y: 190, w: 255, h: 615 };
  const HL_STAIR_TOP_R = { x: 1085, y: 175, w: 365, h: 455 };
  const HL_STAIR_BOT_R = { x: 1125, y: 625, w: 255, h: 175 };

  function renderHanhLang(lit) {
    const [cvO, c] = lopNen();
    setCam(0, 1.42, -1.2, 1080, 800, 455);

    const xL = -1.48;
    const xR = 1.48;
    const yCeil = 2.74;
    const zNear = 1.1;
    const zFar = 5.55;

    // 1. Nền tối chung cư 3h sáng
    const bgG = c.createLinearGradient(0, 0, 0, H);
    bgG.addColorStop(0, lit ? '#14151c' : '#08090e');
    bgG.addColorStop(0.55, lit ? '#1b1a1f' : '#0b0d14');
    bgG.addColorStop(1, lit ? '#141318' : '#08090e');
    c.fillStyle = bgG;
    c.fillRect(0, 0, W, H);

    // 2. Trần, tường trái, tường phải, tường cuối, sàn
    const cLN = P(xL, yCeil, zNear), cRN = P(xR, yCeil, zNear);
    const cLF = P(xL, yCeil, zFar), cRF = P(xR, yCeil, zFar);
    const fLN = P(xL, 0, zNear), fRN = P(xR, 0, zNear);
    const fLF = P(xL, 0, zFar), fRF = P(xR, 0, zFar);

    poly(c, [cLN, cRN, cRF, cLF], lit ? '#1d1c22' : '#090b11');
    poly(c, [fLN, fRN, fRF, fLF], lit ? '#25211e' : '#0c0e15');
    poly(c, [cLN, cLF, fLF, fLN], lit ? '#272422' : '#0e1118');
    poly(c, [cRF, cRN, fRN, fRF], lit ? '#1b1a1e' : '#090b11');
    poly(c, [cLF, cRF, fRF, fLF], lit ? '#181920' : '#0a0d14');

    // Đường ron gạch sàn & len tường
    nseed(3911);
    const cols = 5;
    const rows = 8;
    c.strokeStyle = lit ? 'rgba(18,15,14,0.48)' : 'rgba(6,8,12,0.55)';
    c.lineWidth = 1.4;
    for (let i = 1; i < cols; i++) {
      const gx = lerp(xL, xR, i / cols);
      seg(c, [gx, 0, zNear], [gx, 0, zFar], c.strokeStyle, 1.4);
    }
    for (let j = 1; j < rows; j++) {
      const gz = lerp(zNear, zFar, j / rows);
      seg(c, [xL, 0, gz], [xR, 0, gz], c.strokeStyle, 1.5);
    }
    if (lit) {
      for (let t = 0; t < 12; t++) {
        const tx = lerp(xL + 0.15, xR - 0.15, nrnd());
        const tz = lerp(zNear + 0.4, zFar - 0.5, nrnd());
        const p1 = P(tx - 0.25, 0, tz);
        const p2 = P(tx + 0.25, 0, tz + 0.42);
        c.fillStyle = `rgba(255,212,148,${(0.02 + nrnd() * 0.03).toFixed(3)})`;
        c.fillRect(Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1]), Math.abs(p2[0] - p1[0]), Math.abs(p2[1] - p1[1]));
      }
    }

    // Gờ chân tường trái & phần chân tường cuối
    poly(
      c,
      [P(xL, 0.14, zNear), P(xL, 0.14, zFar), P(xL, 0, zFar), P(xL, 0, zNear)],
      lit ? '#1c1a1c' : '#080a0f'
    );
    poly(
      c,
      [P(xL, 0.14, zFar), P(xR, 0.14, zFar), P(xR, 0, zFar), P(xL, 0, zFar)],
      lit ? '#16161c' : '#07090e'
    );

    // 3. Cửa sổ kính mờ nhỏ ở cuối hành lang (hắt ánh đêm mưa mờ ảo)
    const wTL = P(-0.48, 2.05, zFar);
    const wTR = P(0.48, 2.05, zFar);
    const wBR = P(0.48, 1.02, zFar);
    const wBL = P(-0.48, 1.02, zFar);
    poly(c, [wTL, wTR, wBR, wBL], '#121c2c', '#0d1018', 3);
    const wmT = P(0, 2.05, zFar), wmB = P(0, 1.02, zFar);
    const wmL = P(-0.48, 1.54, zFar), wmR = P(0.48, 1.54, zFar);
    c.strokeStyle = '#0e131c';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(wmT[0], wmT[1]);
    c.lineTo(wmB[0], wmB[1]);
    c.moveTo(wmL[0], wmL[1]);
    c.lineTo(wmR[0], wmR[1]);
    c.stroke();

    // 4. Bên trái: khung bao thang máy inox (cửa trượt vẽ động khi mở)
    const ez0 = 2.08;
    const ez1 = 3.68;
    const eyH = 2.18;
    const elFrame = [
      P(xL, eyH + 0.08, ez0 - 0.1),
      P(xL, eyH + 0.08, ez1 + 0.1),
      P(xL, 0, ez1 + 0.1),
      P(xL, 0, ez0 - 0.1),
    ];
    poly(c, elFrame, lit ? '#2e323c' : '#11151d', lit ? '#464c58' : '#1b202c', 2);

    // Mặt bảng nút gọi thang máy
    const pTL = P(xL, 1.28, ez0 - 0.34);
    const pTR = P(xL, 1.28, ez0 - 0.16);
    const pBR = P(xL, 0.96, ez0 - 0.16);
    const pBL = P(xL, 0.96, ez0 - 0.34);
    poly(c, [pTL, pTR, pBR, pBL], lit ? '#3d414b' : '#181c24', lit ? '#595f6d' : '#262b38', 1.6);

    // 5. Bên phải: Lối hốc cầu thang bộ đi lên (tối dần lên trên)
    const sz0 = 1.92;
    const sz1 = 4.42;
    const archPts = [
      P(xR, yCeil - 0.08, sz0),
      P(xR, yCeil - 0.08, sz1),
      P(xR, 0, sz1),
      P(xR, 0, sz0),
    ];
    poly(c, archPts, '#0a0b10');
    // Tường sau hốc cầu thang & trần xiên đi lên
    const xDeep = 2.55;
    poly(
      c,
      [P(xR, yCeil - 0.08, sz0), P(xDeep, yCeil + 0.45, sz0), P(xDeep, 0, sz0), P(xR, 0, sz0)],
      lit ? '#1c1b20' : '#0b0d13'
    );
    poly(
      c,
      [P(xDeep, yCeil + 0.45, sz0), P(xDeep, yCeil + 1.15, sz1 + 0.3), P(xDeep, 0, sz1 + 0.3), P(xDeep, 0, sz0)],
      lit ? '#121319' : '#08090e'
    );

    // 10 bậc thang đi lên và tối dần về phía trên
    const nSteps = 10;
    const rise = 0.175;
    const runZ = 0.21;
    const zStart = 2.22;
    for (let s = 0; s < nSteps; s++) {
      const yBot = s * rise;
      const yTop = (s + 1) * rise;
      const zA = zStart + s * runZ;
      const zB = zA + runZ;
      const shade = lit ? Math.max(0.18, 1 - s * 0.095) : 0.24;
      const rV = Math.round(42 * shade + (lit ? 10 : 0));
      const gV = Math.round(39 * shade + (lit ? 7 : 4));
      const bV = Math.round(44 * shade + (lit ? 4 : 10));
      const riserCol = `rgb(${Math.round(rV * 0.72)},${Math.round(gV * 0.72)},${Math.round(bV * 0.76)})`;
      const treadCol = `rgb(${rV},${gV},${bV})`;
      const lipCol = `rgba(255,214,158,${(lit ? 0.14 * shade : 0.03).toFixed(3)})`;

      // Mặt đứng bậc
      poly(
        c,
        [P(xR + 0.02, yTop, zA), P(xDeep, yTop, zA), P(xDeep, yBot, zA), P(xR + 0.02, yBot, zA)],
        riserCol
      );
      // Mặt ngang bậc
      poly(
        c,
        [P(xR + 0.02, yTop, zB), P(xDeep, yTop, zB), P(xDeep, yTop, zA), P(xR + 0.02, yTop, zA)],
        treadCol,
        lipCol,
        1
      );
    }

    // Lan can sắt theo độ dốc bậc thang
    const railCol = lit ? '#32343d' : '#181a22';
    const railHi = lit ? 'rgba(255,216,154,0.22)' : 'rgba(130,150,185,0.08)';
    for (let p = 0; p < 4; p++) {
      const idx = p * 3;
      const yp = idx * rise;
      const zp = zStart + idx * runZ + 0.05;
      seg(c, [xR + 0.07, yp, zp], [xR + 0.07, yp + 0.86, zp], railCol, 3.2);
    }
    const r0 = [xR + 0.07, 0.86, zStart + 0.05];
    const r1 = [xR + 0.07, 0.86 + nSteps * rise, zStart + nSteps * runZ];
    seg(c, r0, r1, railCol, 5.5);
    seg(c, [r0[0], r0[1] + 0.015, r0[2]], [r1[0], r1[1] + 0.015, r1[2]], railHi, 1.6);

    // 6. Đèn cảm ứng gắn trần (chỉ bật ấm ở phiên bản lit)
    const lampP = P(0, yCeil - 0.02, 2.68);
    c.save();
    c.translate(lampP[0], lampP[1]);
    c.scale(1, 0.34);
    c.beginPath();
    c.arc(0, 0, 38, 0, Math.PI * 2);
    c.fillStyle = lit ? '#ffdca0' : '#1b1e28';
    c.fill();
    c.strokeStyle = lit ? '#8e744e' : '#2a2e3c';
    c.lineWidth = 3;
    c.stroke();
    c.restore();

    if (lit) {
      drawGlow(c, GLOW.warm, lampP[0], lampP[1] + 50, 1.38, 0.72, true);
      drawGlow(c, GLOW.warm, 800, 680, 1.65, 0.34, true);
    }

    // Hơi mờ rìa khung cửa phòng 502 ngay sát mép dưới (dấu hiệu cửa sau lưng)
    c.fillStyle = lit ? 'rgba(255,205,135,0.04)' : 'rgba(120,145,180,0.03)';
    c.fillRect(0, H - 14, W, 14);

    return cvO;
  }

  function bakeHanhLang() {
    hlDarkC = renderHanhLang(false);
    hlLitC = renderHanhLang(true);
  }

  function drawElevatorDoors(c, openK, litA) {
    setCam(0, 1.42, -1.2, 1080, 800, 455);
    const xL = -1.48;
    const ez0 = 2.15;
    const ez1 = 3.6;
    const eyT = 2.12;

    const tl = P(xL, eyT, ez0);
    const tr = P(xL, eyT, ez1);
    const br = P(xL, 0, ez1);
    const bl = P(xL, 0, ez0);

    c.save();
    c.beginPath();
    c.moveTo(tl[0], tl[1]);
    c.lineTo(tr[0], tr[1]);
    c.lineTo(br[0], br[1]);
    c.lineTo(bl[0], bl[1]);
    c.closePath();
    c.clip();

    // Khoang cabin bên trong (hé lộ khi mở cửa)
    const cabG = c.createLinearGradient(tl[0], tl[1], br[0], br[1]);
    cabG.addColorStop(0, '#16181f');
    cabG.addColorStop(0.5, '#252321');
    cabG.addColorStop(1, '#121318');
    poly(c, [tl, tr, br, bl], cabG);
    const cabStripA = P(xL - 0.1, eyT - 0.08, ez0 + 0.18);
    const cabStripB = P(xL - 0.1, eyT - 0.08, ez1 - 0.18);
    c.strokeStyle = 'rgba(255,214,152,0.55)';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(cabStripA[0], cabStripA[1]);
    c.lineTo(cabStripB[0], cabStripB[1]);
    c.stroke();

    // Hai cánh cửa inox trượt sang hai bên
    const gap = 0.44 * openK;
    const zMid = (ez0 + ez1) * 0.5;
    const leftStop = Math.max(ez0 + 0.04, zMid - gap);
    const rightStart = Math.min(ez1 - 0.04, zMid + gap);

    const doorCol1 = litA > 0.4 ? '#393d48' : '#1a1e28';
    const doorCol2 = litA > 0.4 ? '#4d525f' : '#242936';
    const seamCol = litA > 0.4 ? 'rgba(255,222,175,0.22)' : 'rgba(130,152,188,0.12)';

    const lDoor = [P(xL, eyT, ez0), P(xL, eyT, leftStop), P(xL, 0, leftStop), P(xL, 0, ez0)];
    const rDoor = [P(xL, eyT, rightStart), P(xL, eyT, ez1), P(xL, 0, ez1), P(xL, 0, rightStart)];

    const lGrad = c.createLinearGradient(tl[0], tl[1], tr[0], tl[1]);
    lGrad.addColorStop(0, doorCol1);
    lGrad.addColorStop(0.55, doorCol2);
    lGrad.addColorStop(1, doorCol1);

    poly(c, lDoor, lGrad, seamCol, 1.4);
    poly(c, rDoor, lGrad, seamCol, 1.4);
    c.restore();

    // Đèn nút gọi thang máy sáng dịu
    const btnP = P(xL, 1.12, 1.83);
    drawGlow(c, GLOW.warmDot, btnP[0], btnP[1], 0.46, 0.72 + litA * 0.25, true);
    c.beginPath();
    c.arc(btnP[0], btnP[1], 5.2, 0, Math.PI * 2);
    c.fillStyle = '#ffcb74';
    c.fill();
  }

  SC.hanhlang = {
    back: 'p502sau',
    tapBelow: true,
    hintY: 692,
    bake: bakeHanhLang,
    enter() {
      if (lechCo(hlDarkC) || lechCo(hlLitC)) bakeHanhLang();
      hlTime = 0;
      hlLampClicked = false;
      hlAnim = null;
      stopAmbient();
      clearSayVi();
      updateNgoaiHints('hanhlang');
    },
    exit() {
      stopAmbient();
    },
    draw(c, now, dt) {
      if (lechCo(hlDarkC) || lechCo(hlLitC)) bakeHanhLang();
      const ba = c.globalAlpha;
      hlTime += dt;

      if (!hlLampClicked && hlTime >= hlLampAt) {
        hlLampClicked = true;
        playSensorClick();
      }
      const litA = hlLampClicked ? clamp((hlTime - hlLampAt) / 0.14, 0, 1) : 0;

      veNen(c, hlDarkC);
      if (litA > 0.005) {
        c.globalAlpha = ba * litA;
        veNen(c, hlLitC);
        c.globalAlpha = ba;
      }

      let elevOpen = 0;
      if (hlAnim && hlAnim.type === 'elev') {
        hlAnim.t += dt;
        elevOpen = ease(clamp(hlAnim.t / 0.78, 0, 1));
      } else if (hlAnim && hlAnim.type === 'stair') {
        hlAnim.t += dt;
      }
      drawElevatorDoors(c, elevOpen, litA);

      if (litA > 0.25) {
        const lblA = clamp((litA - 0.25) / 0.45, 0, 1) * 0.56;
        drawHandLabel(c, 'xuống sân xe', 376, 616, 'down', lblA);
        drawHandLabel(c, 'lên sân thượng', 1232, 326, 'up', lblA);
      }

      c.globalAlpha = ba;
      vignette(c, 0.72);

      const retFade = litA > 0.1 ? clamp((litA - 0.1) / 0.45, 0, 1) : 0;
      if (retFade > 0.005) {
        c.globalAlpha = ba;
        drawReturnLabel(c, 'về phòng', 'back', now, retFade);
      }
    },
    tap(p) {
      if (hlAnim) return;
      if (inR(p, RETURN_LABEL_R)) {
        hlAnim = { type: 'back', t: 0 };
        if (typeof FX !== 'undefined' && FX && FX.latch) FX.latch();
        clearSayVi();
        go('p502sau', 700);
        return;
      }
      if (inR(p, HL_ELEV_R)) {
        hlAnim = { type: 'elev', t: 0 };
        playElevChime();
        clearSayVi();
        go('sanxe', 900);
        return;
      }
      if (inR(p, HL_STAIR_TOP_R) || inR(p, HL_STAIR_BOT_R)) {
        hlAnim = { type: 'stair', t: 0 };
        playStairSteps();
        clearSayVi();
        go('santhuong', 900);
        return;
      }
    },
  };

  // =====================================================================
  // B2 · CẢNH 2: SC.sanxe (Tầng 1, nhà để xe)
  // =====================================================================
  let sxBgC = null;
  let sxRain = [];
  let sxLockTries = 0;
  let sxSeatOpen = false;
  let sxSeatAnim = 0; // 0..1
  let sxTime = 0;

  const SX_SEAT_R = { x: 675, y: 392, w: 305, h: 168 };
  const SX_PIECE_PT = [838, 474];
  const SX_PIECE_R = { x: 778, y: 422, w: 120, h: 112 };

  function initSxRain() {
    sxRain = [];
    for (let i = 0; i < 42; i++) {
      sxRain.push({
        x: 560 + Math.random() * 520,
        y: 230 + Math.random() * 195,
        len: 16 + Math.random() * 18,
        spd: 620 + Math.random() * 240,
      });
    }
  }

  // Vẽ xe máy đỗ nền (xe số / xe tay ga đơn giản, không biển số đọc được)
  function drawParkedBike(c, cx, baseY, scale, isScooter, colBody, colShade) {
    c.save();
    c.translate(cx, baseY);
    c.scale(scale, scale);

    // Bóng chân xe trên nền bê tông
    c.fillStyle = 'rgba(4,6,10,0.62)';
    c.beginPath();
    c.ellipse(0, 6, 132, 16, 0, 0, Math.PI * 2);
    c.fill();

    // Hai bánh xe
    const wheelR = isScooter ? 36 : 42;
    const wy = -wheelR;
    const drawWheel = (wx) => {
      c.beginPath();
      c.arc(wx, wy, wheelR, 0, Math.PI * 2);
      c.fillStyle = '#090b10';
      c.fill();
      c.strokeStyle = '#1b1f29';
      c.lineWidth = 4;
      c.stroke();
      c.beginPath();
      c.arc(wx, wy, wheelR * 0.56, 0, Math.PI * 2);
      c.strokeStyle = '#242936';
      c.lineWidth = 2.4;
      c.stroke();
    };
    drawWheel(-92);
    drawWheel(86);

    // Thân xe & yếm trước
    c.fillStyle = colBody;
    c.beginPath();
    if (isScooter) {
      c.moveTo(-108, -76);
      c.quadraticCurveTo(-96, -158, -68, -172);
      c.lineTo(-42, -162);
      c.lineTo(-34, -84);
      c.lineTo(20, -82);
      c.lineTo(36, -124);
      c.lineTo(108, -118);
      c.quadraticCurveTo(118, -94, 96, -72);
      c.lineTo(-48, -62);
    } else {
      c.moveTo(-106, -86);
      c.lineTo(-74, -162);
      c.lineTo(-46, -152);
      c.lineTo(-36, -94);
      c.lineTo(14, -92);
      c.lineTo(28, -126);
      c.lineTo(106, -118);
      c.lineTo(88, -74);
      c.lineTo(-44, -68);
    }
    c.closePath();
    c.fill();

    // Yên xe
    c.fillStyle = colShade;
    c.beginPath();
    c.moveTo(-18, -118);
    c.quadraticCurveTo(38, -124, 98, -130);
    c.quadraticCurveTo(104, -116, 94, -108);
    c.lineTo(-14, -102);
    c.closePath();
    c.fill();

    // Đuôi xe, biển số trắng mờ (TRỐNG, không chữ/số), đèn hậu đỏ
    c.fillStyle = '#5a2026';
    c.beginPath();
    c.ellipse(106, -116, 6, 8, 0.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#333844';
    c.fillRect(102, -96, 18, 13);

    // Tay lái + hai gương chiếu hậu
    c.strokeStyle = colBody;
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-66, -172);
    c.lineTo(-68, -196);
    c.lineTo(-82, -206);
    c.moveTo(-64, -172);
    c.lineTo(-50, -198);
    c.lineTo(-38, -206);
    c.stroke();
    c.fillStyle = '#242936';
    c.beginPath();
    c.ellipse(-84, -208, 10, 6, -0.2, 0, Math.PI * 2);
    c.ellipse(-36, -208, 10, 6, 0.2, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  function bakeSanXe() {
    const [cvO, c] = lopNen();

    // 1. Trần thấp, tường bê tông & nền tầng 1 ẩm nước
    const wallG = c.createLinearGradient(0, 0, 0, H);
    wallG.addColorStop(0, '#090c13');
    wallG.addColorStop(0.42, '#10151f');
    wallG.addColorStop(0.62, '#121822');
    wallG.addColorStop(1, '#0b0f16');
    c.fillStyle = wallG;
    c.fillRect(0, 0, W, H);

    // Đường chân tường xa & cột bê tông hai bên
    poly(c, [[0, 0], [W, 0], [1340, 145], [260, 145]], '#0d111a');
    poly(c, [[0, 0], [260, 145], [260, 560], [0, 740]], '#0b0f17');
    poly(c, [[W, 0], [1340, 145], [1340, 560], [W, 740]], '#0a0e16');

    // Dầm trần ngang
    c.fillStyle = '#090c12';
    c.fillRect(190, 98, 1220, 32);
    c.fillRect(260, 145, 1080, 18);

    // Nền bê tông + vệt ẩm bóng nhẹ
    poly(c, [[260, 445], [1340, 445], [W, H], [0, H]], '#111620');
    const wetG = c.createLinearGradient(0, 445, 0, H);
    wetG.addColorStop(0, 'rgba(30,42,58,0.34)');
    wetG.addColorStop(0.5, 'rgba(18,24,34,0.18)');
    wetG.addColorStop(1, 'rgba(8,11,17,0.45)');
    c.fillStyle = wetG;
    c.fillRect(0, 445, W, H - 445);

    // 2. Cửa cuốn kéo nửa chừng ở tường cuối (x: 560..1080, y: 165..445)
    // Phía ngoài trời mưa & vệt ánh đèn đường vàng ấm hắt trên đường ướt
    c.fillStyle = '#0c131f';
    c.fillRect(560, 290, 520, 155);
    drawGlow(c, GLOW.street, 830, 435, 1.15, 0.72, false);
    // Vệt đèn đường loang kéo vào trong cửa cuốn trên nền ướt
    const puddleG = c.createLinearGradient(830, 442, 830, 625);
    puddleG.addColorStop(0, 'rgba(232,175,98,0.22)');
    puddleG.addColorStop(0.5, 'rgba(180,140,86,0.08)');
    puddleG.addColorStop(1, 'rgba(100,120,145,0)');
    poly(c, [[700, 445], [960, 445], [1040, 620], [640, 620]], puddleG);

    // Lá cửa cuốn kéo xuống nửa chừng (tới y = 305)
    c.fillStyle = '#1b202b';
    c.fillRect(552, 162, 536, 144);
    for (let y = 172; y < 302; y += 13) {
      c.fillStyle = 'rgba(255,255,255,0.035)';
      c.fillRect(556, y, 528, 2);
      c.fillStyle = 'rgba(0,0,0,0.34)';
      c.fillRect(556, y + 6, 528, 2.5);
    }
    // Thanh đáy cửa cuốn + ray hai bên
    c.fillStyle = '#252b38';
    c.fillRect(548, 300, 544, 10);
    c.fillStyle = '#151922';
    c.fillRect(546, 162, 12, 283);
    c.fillRect(1082, 162, 12, 283);

    // 3. Hàng xe máy đỗ trong tối (xe số + xe tay ga rõ dáng, không biển đọc được)
    drawParkedBike(c, 345, 512, 0.86, false, '#171c26', '#10141c');
    drawParkedBike(c, 505, 488, 0.74, true, '#1a202b', '#12161f');
    drawParkedBike(c, 1245, 504, 0.82, false, '#181d27', '#10141c');

    // 4. Bóng đèn tuýp lạnh treo trần (máng đèn cố định, ống phát sáng vẽ động rất nhẹ)
    c.fillStyle = '#1f2430';
    roundRect(c, 610, 114, 380, 14, 4);
    c.fill();

    // Bóng đổ rộng dưới chiếc xe gần nhất (xe của anh)
    c.fillStyle = 'rgba(4,6,11,0.72)';
    c.beginPath();
    c.ellipse(765, 672, 255, 34, 0, 0, Math.PI * 2);
    c.fill();

    return cvO;
  }

  function drawHeroBike(c, openK, lightPulse) {
    // Xe tay ga của anh đỗ gần góc giữa-trái-phải, rõ dáng, được đèn tuýp rọi sáng hơn
    c.save();

    // Hào quang đèn lạnh phủ xuống mặt sàn quanh xe
    drawGlow(c, GLOW.cold, 775, 520, 1.38, 0.34 * lightPulse, true);

    // 1. Bánh trước & bánh sau (rõ nét, có phuộc & mâm xe)
    const drawWheel = (wx, wy, rx) => {
      c.beginPath();
      c.arc(wx, wy, rx, 0, Math.PI * 2);
      c.fillStyle = '#0c0f15';
      c.fill();
      c.strokeStyle = '#252c3a';
      c.lineWidth = 6;
      c.stroke();
      c.beginPath();
      c.arc(wx, wy, rx * 0.58, 0, Math.PI * 2);
      c.fillStyle = '#161b24';
      c.fill();
      c.strokeStyle = '#384356';
      c.lineWidth = 2.6;
      c.stroke();
      c.beginPath();
      c.arc(wx, wy, 9, 0, Math.PI * 2);
      c.fillStyle = '#4f5d74';
      c.fill();
    };
    drawWheel(564, 608, 60);
    drawWheel(924, 608, 56);

    // Gầm xe tối & chân chống giữa nhỏ, ngắn, sát gầm
    c.fillStyle = '#151a24';
    c.beginPath();
    c.moveTo(626, 564);
    c.quadraticCurveTo(744, 582, 858, 558);
    c.lineTo(848, 548);
    c.lineTo(632, 554);
    c.closePath();
    c.fill();

    c.strokeStyle = '#2b3342';
    c.lineWidth = 4.5;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(762, 572);
    c.lineTo(784, 585);
    c.lineTo(800, 583);
    c.stroke();
    c.lineCap = 'butt';

    // Chắn bùn sau nối liền từ đuôi xe, ôm theo vòng bánh sau
    c.fillStyle = '#181e28';
    c.beginPath();
    c.moveTo(858, 556);
    c.quadraticCurveTo(918, 526, 988, 510);
    c.quadraticCurveTo(1005, 552, 996, 598);
    c.lineTo(987, 602);
    c.arc(924, 608, 63, -0.1, Math.PI * 1.18, true);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(176,208,242,0.16)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(988, 510);
    c.quadraticCurveTo(1005, 552, 996, 598);
    c.stroke();

    // 2. Phuộc trước & chắn bùn trước
    c.strokeStyle = '#3b4454';
    c.lineWidth = 11;
    c.beginPath();
    c.moveTo(600, 444);
    c.lineTo(564, 608);
    c.stroke();
    c.fillStyle = '#242c3a';
    c.beginPath();
    c.arc(564, 594, 68, Math.PI * 1.12, Math.PI * 1.72);
    c.lineWidth = 12;
    c.strokeStyle = '#2f3a4d';
    c.stroke();

    // 3. Yếm trước, sàn để chân & thân vỏ sau xe (dáng xe tay ga bo tròn mềm)
    const bodyG = c.createLinearGradient(545, 390, 995, 575);
    bodyG.addColorStop(0, '#364256');
    bodyG.addColorStop(0.45, '#2b3446');
    bodyG.addColorStop(1, '#1e2533');

    c.fillStyle = bodyG;
    c.beginPath();
    c.moveTo(614, 386);
    c.bezierCurveTo(568, 392, 536, 434, 540, 476);
    c.bezierCurveTo(544, 508, 574, 530, 616, 552);
    c.quadraticCurveTo(626, 568, 646, 570);
    c.quadraticCurveTo(754, 574, 860, 558);
    c.quadraticCurveTo(918, 534, 986, 512);
    c.bezierCurveTo(1008, 504, 1012, 468, 962, 452);
    c.quadraticCurveTo(840, 448, 720, 456);
    c.bezierCurveTo(708, 458, 706, 488, 704, 526);
    c.quadraticCurveTo(702, 546, 684, 546);
    c.quadraticCurveTo(654, 546, 650, 528);
    c.bezierCurveTo(644, 486, 654, 432, 658, 408);
    c.quadraticCurveTo(640, 386, 614, 386);
    c.closePath();
    c.fill();

    // Viền sáng đèn tuýp trên mép vỏ xe
    c.strokeStyle = `rgba(195,222,250,${(0.28 * lightPulse).toFixed(3)})`;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(552, 464);
    c.bezierCurveTo(548, 430, 578, 396, 614, 389);
    c.quadraticCurveTo(638, 389, 654, 406);
    c.stroke();

    // Biển số trống trên chắn bùn sau
    poly(c, [[966, 526], [992, 530], [989, 551], [963, 547]], '#4e5563', '#252a34', 1.6);

    // Đèn hậu đỏ (tắt nhẹ/phản quang)
    c.fillStyle = '#7e252e';
    c.beginPath();
    c.moveTo(984, 468);
    c.quadraticCurveTo(997, 471, 1000, 480);
    c.quadraticCurveTo(999, 492, 992, 498);
    c.lineTo(977, 489);
    c.closePath();
    c.fill();

    // Tay dắt yên sau
    c.strokeStyle = '#4b5568';
    c.lineWidth = 6.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(952, 450);
    c.lineTo(986, 444);
    c.lineTo(992, 458);
    c.stroke();
    c.lineCap = 'butt';

    // Đầu xe, đèn pha tắt & 2 gương chiếu hậu
    c.fillStyle = '#2b3446';
    c.beginPath();
    c.ellipse(606, 372, 30, 18, -0.16, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#7a8a9e';
    c.beginPath();
    c.ellipse(582, 375, 9, 13, -0.24, 0, Math.PI * 2);
    c.fill();
    // Gọng & mặt gương trái phải
    c.strokeStyle = '#4a5365';
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(598, 360);
    c.lineTo(582, 328);
    c.lineTo(564, 322);
    c.moveTo(618, 358);
    c.lineTo(632, 326);
    c.lineTo(652, 320);
    c.stroke();
    c.fillStyle = '#1b222e';
    c.strokeStyle = '#525d72';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(560, 321, 16, 9, -0.15, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.ellipse(656, 319, 16, 9, 0.15, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // 4. Hộc cốp dưới yên (luôn vẽ bên dưới, lộ ra khi yên bật mở)
    if (openK > 0.04) {
      c.save();
      // Miệng hộc cốp nhựa đen xám
      c.fillStyle = '#12151c';
      c.beginPath();
      c.moveTo(718, 456);
      c.lineTo(944, 448);
      c.lineTo(926, 518);
      c.lineTo(726, 522);
      c.closePath();
      c.fill();
      c.strokeStyle = '#3c4658';
      c.lineWidth = 2.4;
      c.stroke();

      // Đổ tối lòng cốp
      const innerG = c.createLinearGradient(820, 452, 820, 522);
      innerG.addColorStop(0, '#0a0d13');
      innerG.addColorStop(1, '#181e29');
      c.fillStyle = innerG;
      c.beginPath();
      c.moveTo(732, 464);
      c.lineTo(926, 456);
      c.lineTo(914, 512);
      c.lineTo(738, 514);
      c.closePath();
      c.fill();

      // Áo mưa gấp gọn bên trái trong cốp
      c.globalAlpha = c.globalAlpha * clamp((openK - 0.12) / 0.4, 0, 1);
      c.fillStyle = '#2b405b';
      roundRect(c, 742, 468, 66, 38, 9);
      c.fill();
      c.strokeStyle = 'rgba(155,188,225,0.28)';
      c.lineWidth = 1.4;
      c.stroke();
      // Nếp gấp áo mưa
      c.strokeStyle = 'rgba(12,18,28,0.55)';
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(746, 483);
      c.quadraticCurveTo(775, 480, 804, 485);
      c.moveTo(748, 495);
      c.quadraticCurveTo(776, 492, 802, 496);
      c.stroke();

      // Mảnh nhựa màu xanh (Đô#5) phát sáng nhẹ nằm cạnh áo mưa
      if (!hasPiece('Đô#5') && typeof KET2 !== 'undefined' && KET2.drawPiece && KET2.meta) {
        const gm = KET2.meta['Đô#5'];
        const pulse = 0.72 + 0.28 * Math.sin(sxTime * 2.5);
        drawGlow(c, GLOW.green, SX_PIECE_PT[0], SX_PIECE_PT[1], 0.72, 0.56 * pulse, true);
        c.save();
        c.translate(SX_PIECE_PT[0], SX_PIECE_PT[1]);
        c.rotate(-0.26);
        KET2.drawPiece(c, 50, gm.rgb, gm.rim);
        c.restore();
      }
      c.restore();
    }

    // 5. Yên xe (xoay quanh bản lề trước [714, 456] khi openK tăng 0 -> 1)
    c.save();
    c.translate(714, 456);
    c.rotate(-0.92 * openK);
    // Vỏ đế nhựa mặt dưới yên (lộ ra khi bật lên)
    if (openK > 0.15) {
      c.fillStyle = '#1d222c';
      c.beginPath();
      c.moveTo(-4, 6);
      c.lineTo(234, 2);
      c.lineTo(222, 14);
      c.lineTo(8, 16);
      c.closePath();
      c.fill();
    }
    // Đệm da yên xe bo tròn mềm
    const seatG = c.createLinearGradient(0, -28, 240, 12);
    seatG.addColorStop(0, '#2a2e38');
    seatG.addColorStop(0.55, '#1d2129');
    seatG.addColorStop(1, '#262a34');
    c.fillStyle = seatG;
    c.beginPath();
    c.moveTo(-6, 2);
    c.bezierCurveTo(-8, -14, 14, -22, 62, -19);
    c.bezierCurveTo(126, -16, 178, -28, 224, -24);
    c.bezierCurveTo(246, -22, 252, -4, 240, 5);
    c.quadraticCurveTo(130, 8, 4, 7);
    c.quadraticCurveTo(-5, 6, -6, 2);
    c.closePath();
    c.fill();
    // Viền sáng đèn tuýp trên mặt da yên
    c.strokeStyle = `rgba(186,214,244,${(0.32 * lightPulse).toFixed(3)})`;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(4, -13);
    c.bezierCurveTo(46, -20, 118, -18, 174, -23);
    c.quadraticCurveTo(208, -26, 232, -19);
    c.stroke();
    c.restore();

    c.restore();
  }

  SC.sanxe = {
    back: 'hanhlang',
    tapBelow: true,
    hintY: 692,
    bake: bakeSanXe,
    enter() {
      if (lechCo(sxBgC)) sxBgC = bakeSanXe();
      if (!sxRain.length) initSxRain();
      sxTime = 0;
      sxLockTries = 0;
      sxSeatOpen = !!(typeof KET2 !== 'undefined' && KET2.st && KET2.st.cop) || hasPiece('Đô#5');
      sxSeatAnim = sxSeatOpen ? 1 : 0;
      clearSayVi();
      updateNgoaiHints('sanxe');

      startAmbient('sanxe', (rec) => {
        if (!ac || typeof loopNoise !== 'function') return;
        const rainN = loopNoise(0.036, 'bandpass', 580, 0.7);
        if (rainN) {
          rainN.gain.connect(rec.masterG);
          rec.nodes.push(rainN);
        }
        try {
          const osc1 = ac.createOscillator();
          const osc2 = ac.createOscillator();
          const hg = ac.createGain();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.value = 100;
          osc2.frequency.value = 200;
          hg.gain.value = 0.008;
          osc1.connect(hg);
          osc2.connect(hg);
          hg.connect(rec.masterG);
          osc1.start();
          osc2.start();
          rec.nodes.push(osc1, osc2);
        } catch (_) {}
      });
    },
    exit() {
      stopAmbient();
    },
    draw(c, now, dt) {
      if (lechCo(sxBgC)) sxBgC = bakeSanXe();
      const ba = c.globalAlpha;
      sxTime += dt;

      // Chập chờn cực nhẹ của đèn tuýp (không bao giờ tắt phụt)
      const wobble =
        0.94 +
        0.045 * Math.sin(sxTime * 1.9) +
        0.02 * Math.sin(sxTime * 27.3) * (Math.sin(sxTime * 0.72) > 0.84 ? 1 : 0.15);
      const lightPulse = clamp(wobble, 0.84, 1.0);

      // Hoạt hoạ mở yên ~400ms
      if (sxSeatOpen && sxSeatAnim < 1) {
        sxSeatAnim = Math.min(1, sxSeatAnim + dt / 0.4);
      }
      const openK = ease(sxSeatAnim);

      veNen(c, sxBgC);

      // Vệt mưa ngoài cửa cuốn (x: 560..1080, y: 310..445)
      c.save();
      c.beginPath();
      c.rect(560, 310, 520, 136);
      c.clip();
      c.strokeStyle = 'rgba(176,196,220,0.24)';
      c.lineWidth = 1.4;
      c.beginPath();
      for (let i = 0; i < sxRain.length; i++) {
        const r = sxRain[i];
        r.y += r.spd * dt;
        r.x -= r.spd * 0.14 * dt;
        if (r.y > 460) {
          r.y = 290 - Math.random() * 45;
          r.x = 560 + Math.random() * 540;
        }
        c.moveTo(r.x, r.y);
        c.lineTo(r.x - r.len * 0.14, r.y + r.len);
      }
      c.stroke();
      c.restore();

      // Đèn tuýp trần + hào quang dịu
      drawGlow(c, GLOW.cold, 800, 128, 0.92, 0.36 * lightPulse, true);
      c.fillStyle = `rgba(218,236,255,${(0.82 * lightPulse).toFixed(3)})`;
      roundRect(c, 622, 121, 356, 7, 3);
      c.fill();

      // Xe của anh + cốp + mảnh xanh
      drawHeroBike(c, openK, lightPulse);

      c.globalAlpha = ba;
      vignette(c, 0.72);

      c.globalAlpha = ba;
      drawReturnLabel(c, 'lên hành lang', 'up', now, 1);
      if (window.LPN_SAN && !window.KET2_PHIM_DANG) { c.save(); text(c, 'ra sân đình', 866, 286, 26, 0.5 + 0.14 * Math.sin(now * 0.0026), 'center', '255,236,206'); c.restore(); } // cửa cuốn: lối về không gian chung
    },
    tap(p) {
      if (window.LPN_SAN && inR(p, { x: 640, y: 150, w: 450, h: 170 })) { clearSayVi(); window.LPN_SAN.ve(); return; }
      // 1. Khi cốp đã mở và mảnh xanh vẫn nằm trong cốp: ưu tiên chạm mảnh
      if (sxSeatOpen && sxSeatAnim >= 0.75 && !hasPiece('Đô#5') && inR(p, SX_PIECE_R)) {
        const wasAll5 = hasAll5();
        if (typeof KET2 !== 'undefined' && KET2.addManh) KET2.addManh('Đô#5');
        saveNgoaiState();
        updateNgoaiHints('sanxe');
        sayVi('Một mảnh nhựa màu xanh, nằm trong cốp xe.');
        if (!wasAll5 && hasAll5()) scheduleAll5Say();
        return;
      }

      if (inR(p, RETURN_LABEL_R)) {
        playElevChime();
        clearSayVi();
        go('hanhlang', 800);
        return;
      }

      // 2. Chạm vùng yên xe khi cốp chưa mở
      if (!sxSeatOpen && inR(p, SX_SEAT_R)) {
        const hasKeyInHand = typeof BAG !== 'undefined' && BAG.sel === 'chia';
        if (hasKeyInHand) {
          sxSeatOpen = true;
          sxSeatAnim = 0;
          BAG.sel = null; // Vẫn giữ nguyên chìa trong túi
          if (typeof KET2 !== 'undefined' && KET2.st) KET2.st.cop = true;
          saveNgoaiState();
          playUnlockTrunk();
          clearSayVi();
          return;
        }
        sxLockTries += 1;
        playLockedRattle();
        if (typeof nudge === 'function') nudge();
        const hasKeyInBag = typeof bagHas === 'function' && bagHas('chia');
        if (!hasKeyInBag && sxLockTries >= 2) {
          sayVi('Cốp xe khoá rồi. Cần chìa khoá xe.');
        } else {
          sayVi('Cốp xe khoá rồi.');
        }
        return;
      }
    },
  };

  // =====================================================================
  // B3 · CẢNH 3: SC.santhuong (Sân thượng tầng 7, đêm mưa)
  // =====================================================================
  let stBgC = null;
  let stFlashC = null;
  let stRain = [];
  let stTime = 0;
  let stNextFlash = 3.0;
  let stFlashElapsed = -1; // >= 0 đang chạy nhịp chớp hoặc thời gian sau chớp
  let stFlashDur = 0.6;
  let stTwistFlash = false;
  let stThunderDone = false;
  let stTwistSaid = false;
  let stWasLit = false;
  let stGlintFrame = 0;
  let stDarkTaps = 0;

  const ST_TANK_BASE_R = { x: 920, y: 505, w: 245, h: 175 };
  const ST_PIECE_PT = [1042, 616];

  function initStRain() {
    stRain = [];
    for (let i = 0; i < 86; i++) {
      stRain.push({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 20 + Math.random() * 24,
        spd: 760 + Math.random() * 280,
      });
    }
  }

  function drawTankAndStand(c, lit) {
    // Bồn nước inox đặt trên chân sắt (tâm ngang x = 1042)
    const tx = 1042;
    const legTopY = 472;
    const legBotY = 636;

    // Chân sắt & giằng chéo
    c.strokeStyle = lit ? '#465264' : '#161b24';
    c.lineWidth = 6.5;
    c.beginPath();
    c.moveTo(tx - 78, legTopY);
    c.lineTo(tx - 92, legBotY);
    c.moveTo(tx + 78, legTopY);
    c.lineTo(tx + 92, legBotY);
    c.moveTo(tx - 32, legTopY + 10);
    c.lineTo(tx - 38, legBotY - 10);
    c.moveTo(tx + 32, legTopY + 10);
    c.lineTo(tx + 38, legBotY - 10);
    c.stroke();

    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(tx - 84, 540);
    c.lineTo(tx + 84, 540);
    c.moveTo(tx - 88, 594);
    c.lineTo(tx + 88, 594);
    c.moveTo(tx - 82, legTopY + 14);
    c.lineTo(tx + 88, 594);
    c.moveTo(tx + 82, legTopY + 14);
    c.lineTo(tx - 88, 594);
    c.stroke();

    // Đế bê tông nhỏ kê chân sắt
    c.fillStyle = lit ? '#384252' : '#141820';
    c.fillRect(tx - 104, legBotY - 6, 26, 12);
    c.fillRect(tx + 78, legBotY - 6, 26, 12);

    // Thân bồn nước inox hình trụ đứng (x: tx-92 .. tx+92, y: 264 .. 476)
    const bw = 184;
    const bx = tx - bw * 0.5;
    const by = 266;
    const bh = 210;

    const inoxG = c.createLinearGradient(bx, 0, bx + bw, 0);
    if (lit) {
      inoxG.addColorStop(0, '#3a4658');
      inoxG.addColorStop(0.22, '#9eb5cf');
      inoxG.addColorStop(0.42, '#5a6a80');
      inoxG.addColorStop(0.75, '#788ca4');
      inoxG.addColorStop(1, '#2d3746');
    } else {
      inoxG.addColorStop(0, '#12161f');
      inoxG.addColorStop(0.24, '#242d3b');
      inoxG.addColorStop(0.55, '#19202b');
      inoxG.addColorStop(1, '#0f131b');
    }

    c.fillStyle = inoxG;
    roundRect(c, bx, by, bw, bh, 22);
    c.fill();

    // Nắp tròn nhẹ trên đỉnh bồn
    c.beginPath();
    c.ellipse(tx, by + 10, bw * 0.45, 16, 0, Math.PI, Math.PI * 2);
    c.fillStyle = lit ? '#70849d' : '#1d2431';
    c.fill();

    // Gân dập nổi ngang trên bồn inox
    c.strokeStyle = lit ? 'rgba(218,236,255,0.45)' : 'rgba(92,112,140,0.16)';
    c.lineWidth = 2;
    for (let r = 0; r < 4; r++) {
      const ry = by + 48 + r * 42;
      c.beginPath();
      c.moveTo(bx + 3, ry);
      c.quadraticCurveTo(tx, ry + 7, bx + bw - 3, ry);
      c.stroke();
    }
  }

  function renderSanThuong(lit) {
    const [cvO, c] = lopNen();

    // 1. Bầu trời đêm mưa & mây nặng
    const skyG = c.createLinearGradient(0, 0, 0, 500);
    if (lit) {
      skyG.addColorStop(0, '#2a3952');
      skyG.addColorStop(0.52, '#3a4c69');
      skyG.addColorStop(1, '#26344a');
    } else {
      skyG.addColorStop(0, '#070a11');
      skyG.addColorStop(0.65, '#0d1421');
      skyG.addColorStop(1, '#131d2d');
    }
    c.fillStyle = skyG;
    c.fillRect(0, 0, W, 520);

    // Cụm mây mưa nặng tầng tầng trên trời
    nseed(3977);
    for (let i = 0; i < 16; i++) {
      const cx = (i / 15) * (W + 160) - 80;
      const cy = 70 + nrnd() * 210;
      const rx = 170 + nrnd() * 140;
      const ry = 55 + nrnd() * 48;
      c.fillStyle = lit
        ? `rgba(28,39,58,${(0.32 + nrnd() * 0.25).toFixed(3)})`
        : `rgba(8,12,20,${(0.45 + nrnd() * 0.28).toFixed(3)})`;
      c.beginPath();
      c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
    }

    // 2. Chân trời thành phố xa mờ (ánh đèn vàng/xanh nhỏ li ti)
    c.fillStyle = lit ? '#162030' : '#090d16';
    c.fillRect(0, 422, W, 42);
    nseed(3988);
    for (let i = 0; i < 62; i++) {
      const lx = nrnd() * W;
      const ly = 432 + nrnd() * 26;
      const warm = nrnd() > 0.35;
      c.fillStyle = warm
        ? `rgba(242,188,108,${(lit ? 0.26 : 0.38) * (0.4 + nrnd() * 0.6)})`
        : `rgba(148,196,238,${(lit ? 0.2 : 0.32) * (0.4 + nrnd() * 0.6)})`;
      c.fillRect(lx, ly, 2.2 + nrnd() * 2.5, 2.2);
    }

    // 3. Cột ăng-ten mảnh phía bên phải lan can
    c.strokeStyle = lit ? '#364256' : '#141a25';
    c.lineWidth = 3.6;
    c.beginPath();
    c.moveTo(1312, 138);
    c.lineTo(1312, 470);
    c.stroke();
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(1264, 178);
    c.lineTo(1360, 178);
    c.moveTo(1276, 214);
    c.lineTo(1348, 214);
    c.moveTo(1288, 250);
    c.lineTo(1336, 250);
    c.moveTo(1312, 236);
    c.lineTo(1254, 466);
    c.stroke();

    // 4. Lan can thấp ngang sân thượng
    c.fillStyle = lit ? '#2b3444' : '#111621';
    c.fillRect(0, 466, W, 58);
    c.fillStyle = lit ? '#3b475c' : '#181e2c';
    c.fillRect(0, 462, W, 7);
    // Thanh sắt lan can trên bờ tường
    c.strokeStyle = lit ? '#465368' : '#19202e';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(0, 424);
    c.lineTo(W, 424);
    for (let px = 70; px < W; px += 195) {
      c.moveTo(px, 424);
      c.lineTo(px, 466);
    }
    c.stroke();

    // 5. Nền bê tông sân thượng ướt nước mưa
    const flG = c.createLinearGradient(0, 524, 0, H);
    if (lit) {
      flG.addColorStop(0, '#242e3e');
      flG.addColorStop(0.55, '#19212d');
      flG.addColorStop(1, '#10151f');
    } else {
      flG.addColorStop(0, '#0e131d');
      flG.addColorStop(0.6, '#0b0f18');
      flG.addColorStop(1, '#080b12');
    }
    c.fillStyle = flG;
    c.fillRect(0, 524, W, H - 524);

    // Đường khe co giãn sàn bê tông (mờ)
    c.strokeStyle = lit ? 'rgba(18,24,35,0.12)' : 'rgba(6,8,13,0.14)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(640, 524);
    c.lineTo(520, H);
    c.moveTo(1080, 524);
    c.lineTo(1260, H);
    c.moveTo(0, 678);
    c.lineTo(W, 678);
    c.stroke();

    // 6. Cột phơi đồ & dây phơi trống bên trái
    c.strokeStyle = lit ? '#48566c' : '#171d29';
    c.lineWidth = 6.5;
    c.beginPath();
    c.moveTo(232, 318);
    c.lineTo(232, 548);
    c.moveTo(528, 344);
    c.lineTo(528, 594);
    c.stroke();
    // Dây phơi trùng nhẹ (trống không quần áo)
    c.strokeStyle = lit ? 'rgba(182,202,226,0.45)' : 'rgba(72,88,112,0.34)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(232, 336);
    c.quadraticCurveTo(380, 368, 528, 360);
    c.moveTo(232, 382);
    c.quadraticCurveTo(380, 412, 528, 402);
    c.stroke();

    // 7. Bồn nước inox trên chân sắt
    drawTankAndStand(c, lit);

    return cvO;
  }

  function bakeSanThuong() {
    stBgC = renderSanThuong(false);
    stFlashC = renderSanThuong(true);
  }

  // Khung cửa sổ 3:2 chia 4 ô dấu + giống khung kính phòng trại p1.js (CHỈ khung, không có bóng người)
  function drawCloudWindowFrame(c, alpha) {
    if (alpha <= 0.01) return;
    const x = 448;
    const y = 268;
    const w = 132;
    const h = 88; // Tỉ lệ 3:2 giống WIN_C (1080x720) của p1.js

    c.save();
    drawGlow(c, GLOW.cold, x + w * 0.5, y + h * 0.5, 0.42, alpha * 0.42, true);
    c.globalAlpha = c.globalAlpha * alpha;

    // Ánh lờ mờ trên bề mặt mây quanh ô kính
    c.fillStyle = 'rgba(205,228,255,0.14)';
    c.fillRect(x, y, w, h);

    // Khung bao ngoài & khung kính trong
    c.strokeStyle = 'rgba(222,238,255,0.9)';
    c.lineWidth = 3;
    c.strokeRect(x, y, w, h);
    c.lineWidth = 1.5;
    c.strokeRect(x + 5, y + 5, w - 10, h - 10);

    // Thanh chữ thập (+) chia 4 ô kính
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(x + w * 0.5, y + 4);
    c.lineTo(x + w * 0.5, y + h - 4);
    c.moveTo(x + 4, y + h * 0.5);
    c.lineTo(x + w - 4, y + h * 0.5);
    c.stroke();

    c.restore();
  }

  function evalFlashPulse(t, dur, twist) {
    if (t < 0 || t > dur) return 0;
    // Hai nhịp chớp nhanh ở đầu (~0.03s & ~0.19s) rồi tắt dần
    if (t < 0.13) {
      const k = t / 0.13;
      return k < 0.25 ? (k / 0.25) * 0.88 : lerp(0.88, 0.18, (k - 0.25) / 0.75);
    }
    if (t < 0.22) {
      const k = (t - 0.13) / 0.09;
      return k < 0.55 ? lerp(0.18, 1.0, k / 0.55) : lerp(1.0, 0.82, (k - 0.55) / 0.45);
    }
    const tail = clamp((t - 0.22) / Math.max(0.15, dur - 0.22), 0, 1);
    return twist ? 0.82 * Math.pow(1 - tail, 1.35) : 0.82 * Math.pow(1 - tail, 2.2);
  }

  function triggerFlash(twist) {
    stTwistFlash = !!twist;
    stFlashDur = twist ? 0.96 : 0.6;
    stFlashElapsed = 0;
    stThunderDone = false;
    stDarkTaps = 0;
    stNextFlash = 7.0 + Math.random() * 3.0;
  }

  SC.santhuong = {
    back: 'hanhlang',
    tapBelow: true,
    hintY: 692,
    bake: bakeSanThuong,
    enter() {
      if (lechCo(stBgC) || lechCo(stFlashC)) bakeSanThuong();
      if (!stRain.length) initStRain();
      stTime = 0;
      stNextFlash = 3.0;
      stFlashElapsed = -1;
      stFlashDur = 0.6;
      stTwistFlash = false;
      stThunderDone = false;
      stTwistSaid = !!(typeof KET2 !== 'undefined' && KET2.st && KET2.st.thayCuaSo);
      stWasLit = false;
      stGlintFrame = 0;
      stDarkTaps = 0;
      clearSayVi();
      updateNgoaiHints('santhuong');

      startAmbient('santhuong', (rec) => {
        if (typeof loopNoise !== 'function') return;
        const rainLow = loopNoise(0.052, 'lowpass', 1100, 0.5);
        if (rainLow) {
          rainLow.gain.connect(rec.masterG);
          rec.nodes.push(rainLow);
        }
        const rainAir = loopNoise(0.016, 'bandpass', 2400, 0.8);
        if (rainAir) {
          rainAir.gain.connect(rec.masterG);
          rec.nodes.push(rainAir);
        }
      });
    },
    exit() {
      stopAmbient();
    },
    draw(c, now, dt) {
      if (lechCo(stBgC) || lechCo(stFlashC)) bakeSanThuong();
      const ba = c.globalAlpha;
      stTime += dt;

      // Nhịp chớp tự động & sấm trễ 1.2s
      if (stFlashElapsed >= 0) {
        stFlashElapsed += dt;
        if (!stThunderDone && stFlashElapsed >= 1.2) {
          stThunderDone = true;
          playDistantThunder();
        }
        if (stTwistFlash && !stTwistSaid && stFlashElapsed >= 0.42) {
          stTwistSaid = true;
          if (typeof KET2 !== 'undefined' && KET2.st) KET2.st.thayCuaSo = true;
          saveNgoaiState();
          sayVi('Đêm ấy, tia chớp ngoài cửa sổ của em cũng từ cơn mưa này.');
        }
        if (stFlashElapsed > stFlashDur + 2.2) {
          stFlashElapsed = -1;
        }
      }

      stNextFlash -= dt;
      if (stNextFlash <= 0) {
        const shouldTwist = hasPiece('Fa#5') && !stTwistSaid;
        triggerFlash(shouldTwist);
      }

      const pulse = stFlashElapsed >= 0 ? evalFlashPulse(stFlashElapsed, stFlashDur, stTwistFlash) : 0;
      const litNow = pulse > 0.04;
      if (stWasLit && !litNow && !hasPiece('Fa#5')) {
        stGlintFrame = 1;
      }
      stWasLit = litNow;

      // Nền tối & lớp sáng chớp
      veNen(c, stBgC);
      if (pulse > 0.005) {
        c.globalAlpha = ba * clamp(pulse, 0, 1);
        veNen(c, stFlashC);
        c.globalAlpha = ba;
        drawGlow(c, GLOW.flash, 560, 210, 1.35, pulse * 0.48, true);
      }

      // Khung cửa sổ mờ trên đám mây chân trời (chỉ lộ trong ánh chớp)
      if (pulse > 0.04) {
        const winA = stTwistFlash ? clamp(pulse * 0.62, 0, 0.6) : clamp(pulse * 0.24, 0, 0.22);
        drawCloudWindowFrame(c, winA);
      }

      // Mảnh nhựa hồng dưới chân bồn: CHỈ hiện trong ánh chớp + 1 khung hình loé khẽ ngay sau chớp
      if (!hasPiece('Fa#5') && typeof KET2 !== 'undefined' && KET2.drawPiece && KET2.meta) {
        const pm = KET2.meta['Fa#5'];
        if (litNow) {
          const pa = clamp(pulse * 1.15, 0, 1);
          drawGlow(c, GLOW.pink, ST_PIECE_PT[0], ST_PIECE_PT[1], 0.72, 0.52 * pa, true);
          c.save();
          c.globalAlpha = ba * pa;
          c.translate(ST_PIECE_PT[0], ST_PIECE_PT[1]);
          c.rotate(0.2);
          KET2.drawPiece(c, 44, pm.rgb, pm.rim);
          c.restore();
        } else if (stGlintFrame > 0) {
          stGlintFrame = 0;
          drawGlow(c, GLOW.pink, ST_PIECE_PT[0], ST_PIECE_PT[1], 0.34, 0.26, true);
        }
      }

      // Mưa đều toàn cảnh
      c.strokeStyle = litNow ? 'rgba(202,224,248,0.34)' : 'rgba(132,158,188,0.18)';
      c.lineWidth = 1.4;
      c.beginPath();
      for (let i = 0; i < stRain.length; i++) {
        const r = stRain[i];
        r.y += r.spd * dt;
        r.x -= r.spd * 0.16 * dt;
        if (r.y > H + 30) {
          r.y = -30 - Math.random() * 40;
          r.x = Math.random() * (W + 180);
        }
        c.moveTo(r.x, r.y);
        c.lineTo(r.x - r.len * 0.16, r.y + r.len);
      }
      c.stroke();

      c.globalAlpha = ba;
      vignette(c, 0.68);

      c.globalAlpha = ba;
      drawReturnLabel(c, 'xuống hành lang', 'down', now, 1);
    },
    tap(p) {
      if (!hasPiece('Fa#5') && inR(p, ST_TANK_BASE_R)) {
        const canPick = stFlashElapsed >= 0 && stFlashElapsed <= stFlashDur + 1.5;
        if (canPick) {
          const wasAll5 = hasAll5();
          if (typeof KET2 !== 'undefined' && KET2.addManh) KET2.addManh('Fa#5');
          saveNgoaiState();
          updateNgoaiHints('santhuong');
          sayVi('Một mảnh nhựa màu hồng, nằm dưới chân bồn nước.');
          if (!wasAll5 && hasAll5()) scheduleAll5Say();
          // Kéo lần chớp kế tiếp đến vừa đủ để thấy cú lật khung cửa sổ
          if (!stTwistSaid) stNextFlash = clamp(stNextFlash, 2.8, 3.2);
          return;
        }
        stDarkTaps += 1;
        if (typeof nudge === 'function') nudge();
        sayVi('Tối quá. Chờ một chút.');
        if (stDarkTaps >= 2 && stNextFlash > 0.85) {
          stNextFlash = 0.85;
        }
        return;
      }
      if (inR(p, RETURN_LABEL_R)) {
        playStairSteps();
        clearSayVi();
        go('hanhlang', 800);
        return;
      }
    },
  };

  restoreNgoaiState();
})();
