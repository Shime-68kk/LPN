'use strict';
// Móc mở Kết 2 ở cuối phim Băng số 2: chỉ bật khi máy đã xem hết phim từ trước (lpn:bang2xong) hoặc ?roi=1 trên máy nhà.
(() => {
  const doc = (k) => {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  };
  const q = new URLSearchParams(location.search);
  if (q.get('trailer') === '1') return;
  const DA_XEM = !!doc('lpn:bang2xong');
  const ROI = q.get('roi') === '1' && /^(localhost|127\.0\.0\.1|192\.168\.)/.test(location.hostname);
  if (!DA_XEM && !ROI) return;
  // lối vào thẳng cho người đã xem hết (chon.js): mảnh rơi ngay sau khi dòng chúc mừng viết xong, không chờ hết danh đề im lặng
  if (q.get('moc') === '1' && typeof MK !== 'undefined') MK.t0 = 118.6;

  // Màu vàng cam của mảnh Mi4 trong dan.js
  const MI4_RGB = '218,158,58';
  const MI4_RIM = '246,198,108';
  const MI4_GLOW = '252,208,118';

  const PIECE_X = 800, PIECE_Y = 640, PIECE_ROT = -0.14;
  const BAG_X = POCKET.r.x + POCKET.r.w / 2;
  const BAG_Y = POCKET.r.y + POCKET.r.h / 2 - 6;

  const LINE1 = 'Cái gì vừa rơi vậy?';
  const LINE2 = 'Một mảnh nhựa nhỏ. Hình như ai đó để quên.';
  const CPS = 22;
  const T_L1 = 3.2;
  const T_L1_END = T_L1 + LINE1.length / CPS;
  const T_L2 = T_L1_END + 1.0;
  const T_L2_END = T_L2 + LINE2.length / CPS;

  const ST = {
    started: false,
    cut: false,
    clink: false,
    s: 0,
    n1: 0,
    n2: 0,
    picked: false,
    pickAt: 0,
    menuShown: false,
    lastCharS: -9,
  };

  let warmSpr = null;
  let sparkSpr = null;
  let revNode = null;
  let revCtx = null;

  function makeGlowSprite(rgb, size, stops) {
    const cv2 = document.createElement('canvas');
    cv2.width = cv2.height = size;
    const g2 = cv2.getContext('2d');
    const half = size * 0.5;
    const gr = g2.createRadialGradient(half, half, 0, half, half, half);
    for (let i = 0; i < stops.length; i++) {
      gr.addColorStop(stops[i][0], `rgba(${rgb},${stops[i][1]})`);
    }
    g2.fillStyle = gr;
    g2.fillRect(0, 0, size, size);
    return cv2;
  }

  function ensureSprites() {
    if (!warmSpr) {
      warmSpr = makeGlowSprite('255,204,132', 160, [
        [0, 0.85],
        [0.32, 0.38],
        [0.68, 0.1],
        [1, 0],
      ]);
    }
    if (!sparkSpr) {
      sparkSpr = makeGlowSprite(MI4_GLOW, 96, [
        [0, 0.95],
        [0.25, 0.45],
        [0.6, 0.12],
        [1, 0],
      ]);
    }
  }

  function getReverb() {
    if (!ac || !master) return null;
    if (revNode && revCtx === ac) return revNode;
    try {
      const len = Math.max(1, Math.floor(ac.sampleRate * 1.1));
      const ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.6) * 0.45;
        }
      }
      const cv2 = ac.createConvolver();
      cv2.buffer = ir;
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2600;
      const wet = ac.createGain();
      wet.gain.value = 0.28;
      cv2.connect(lp).connect(wet).connect(master);
      revNode = cv2;
      revCtx = ac;
      return cv2;
    } catch (e) {
      return null;
    }
  }

  function playDrop() {
    if (!ac || !master) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t = ac.currentTime;
    const rev = getReverb();
    const hits = [
      { dt: 0, amp: 1.0, freq: 3200, pan: 0.02 },
      { dt: 0.09, amp: 0.42, freq: 3450, pan: -0.02 },
      { dt: 0.16, amp: 0.19, freq: 3650, pan: 0.03 },
    ];
    for (let i = 0; i < hits.length; i++) {
      const h = hits[i];
      const ht = t + h.dt;
      nz(ht, 0.025, 'bandpass', h.freq, 2.5, 1.1 * h.amp, h.pan);
      if (rev) nz(ht, 0.025, 'bandpass', h.freq, 2.2, 0.85 * h.amp, h.pan, 0, rev);
      nz(ht, 0.018, 'bandpass', 560, 1.4, 0.22 * h.amp, h.pan);
      tone(ht, 1480 + i * 160, 920 + i * 100, 0.048 * h.amp, 0.018, 'triangle');
      if (rev) tone(ht, 1480 + i * 160, 920 + i * 100, 0.032 * h.amp, 0.018, 'triangle', rev);
    }
  }

  function playKeyTick(s) {
    if (!ac || !master || ac.state !== 'running') return;
    if (s - ST.lastCharS < 0.025) return;
    ST.lastCharS = s;
    const t = ac.currentTime;
    const f = 2250 + Math.random() * 500;
    const pan = (Math.random() - 0.5) * 0.12;
    nz(t, 0.012, 'bandpass', f, 2.4, 0.065 + Math.random() * 0.025, pan);
    tone(t, 340 + Math.random() * 60, 150, 0.014, 0.012, 'triangle');
  }

  function drawPieceBody(c, x, y, rot, sc, alpha, shimmer, shadow) {
    const len = 110, thick = 28, r = 8;
    const hw = len * 0.5, hh = thick * 0.5;
    if (shadow > 0.01) {
      c.save();
      c.translate(x + 3, y + 6);
      c.rotate(rot);
      c.scale(sc, sc);
      c.fillStyle = `rgba(0,0,0,${0.55 * alpha * shadow})`;
      roundRect(c, -hw - 2, -hh - 1, len + 4, thick + 3, r + 2);
      c.fill();
      c.fillStyle = `rgba(0,0,0,${0.28 * alpha * shadow})`;
      roundRect(c, -hw - 6, -hh - 3, len + 12, thick + 7, r + 4);
      c.fill();
      c.restore();
    }

    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(sc, sc);
    c.globalAlpha *= alpha;

    const bg = c.createLinearGradient(0, -hh, 0, hh);
    bg.addColorStop(0, `rgb(${MI4_RIM})`);
    bg.addColorStop(0.55, `rgb(${MI4_RGB})`);
    bg.addColorStop(1, 'rgb(154,106,32)');
    c.fillStyle = bg;
    roundRect(c, -hw, -hh, len, thick, r);
    c.fill();

    // Độ bóng nhựa dịu dọc mép trên
    const sheen = c.createLinearGradient(0, -hh + 1.5, 0, -hh + thick * 0.46);
    sheen.addColorStop(0, `rgba(255,248,232,${0.24 + shimmer * 0.12})`);
    sheen.addColorStop(1, 'rgba(255,248,232,0)');
    c.fillStyle = sheen;
    roundRect(c, -hw + 2.5, -hh + 1.5, len - 5, thick * 0.44, r - 2);
    c.fill();

    // Viền bắt sáng mảnh
    c.strokeStyle = `rgba(${MI4_RIM},${0.38 + shimmer * 0.28})`;
    c.lineWidth = 1.1;
    roundRect(c, -hw, -hh, len, thick, r);
    c.stroke();

    // Lấp lánh rất nhẹ ở một điểm bắt sáng trên cạnh trên
    if (shimmer > 0.02 && sparkSpr) {
      const sx = -hw + 28, sy = -hh + 5;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha *= shimmer * 0.55;
      c.drawImage(sparkSpr, sx - 16, sy - 16, 32, 32);
      c.strokeStyle = 'rgba(255,248,232,0.75)';
      c.lineWidth = 1;
      c.lineCap = 'round';
      const arm = 4 + shimmer * 3;
      c.beginPath();
      c.moveTo(sx - arm, sy);
      c.lineTo(sx + arm, sy);
      c.moveTo(sx, sy - arm * 0.75);
      c.lineTo(sx, sy + arm * 0.75);
      c.stroke();
      c.restore();
    }

    c.restore();
  }

  function drawManhBag(c, sc = 1) {
    drawPieceBody(c, 0, 0, PIECE_ROT, sc, 1, 0, 0);
  }

  function saveManh() {
    try {
      let arr = [];
      try {
        const raw = JSON.parse(localStorage.getItem('lpn:bang2manh') || '[]');
        if (Array.isArray(raw)) arr = raw;
      } catch (e) { arr = []; }
      if (!arr.includes('Mi4')) arr.push('Mi4');
      localStorage.setItem('lpn:bang2manh', JSON.stringify(arr));
    } catch (e) { /* bỏ qua */ }
  }

  function showMenu() {
    if (ST.menuShown || document.getElementById('lpn-rot')) return;
    ST.menuShown = true;

    const css = document.createElement('style');
    css.textContent = [
      "#lpn-rot{position:fixed;top:0;right:0;bottom:0;left:0;z-index:12;background:radial-gradient(ellipse at 50% 45%,#16120e 0%,#050403 70%);display:flex;flex-direction:column;align-items:center;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));box-sizing:border-box;font-family:'Patrick Hand','Be Vietnam Pro',sans-serif;opacity:0;transition:opacity .65s ease;}",
      '#lpn-rot.on{opacity:1;}',
      '#lpn-rot .khung{margin:auto 0;display:flex;flex-direction:column;align-items:center;width:100%;max-width:340px;}',
      '#lpn-rot .nut{display:flex;flex-direction:column;gap:8px;width:100%;}',
      '#lpn-rot button{appearance:none;-webkit-appearance:none;width:100%;min-height:52px;padding:10px 20px;box-sizing:border-box;font-family:inherit;font-size:26px;line-height:1.25;color:rgba(240,232,220,.88);background:none;border:0;border-radius:26px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}',
      '#lpn-rot button:active,#lpn-rot button:hover{background:rgba(255,214,160,.08);color:rgba(255,232,200,.98);}',
    ].join('\n');
    document.head.appendChild(css);

    const lop = document.createElement('div');
    lop.id = 'lpn-rot';
    const chan = (e) => e.stopPropagation();
    ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click'].forEach((ev) => lop.addEventListener(ev, chan));

    const khung = document.createElement('div');
    khung.className = 'khung';
    const nhom = document.createElement('div');
    nhom.className = 'nut';

    const MUC = [
      { chu: 'Về trang chủ', go: () => { location.href = '../../home/'; } },
      // phòng 502
      { chu: 'Tìm tiếp', go: () => { location.replace('?phong=12&tu=1'); } },
      { chu: 'Chơi lại từ đầu', go: () => { location.replace('?moi=1&tu=1'); } },
    ];
    MUC.forEach((m) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = m.chu;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        m.go();
      });
      nhom.appendChild(btn);
    });

    khung.appendChild(nhom);
    lop.appendChild(khung);
    document.body.appendChild(lop);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => lop.classList.add('on'));
    });
  }

  function drawTypeLine(c, str, n, y, size, alpha) {
    if (n <= 0 || alpha <= 0.01) return;
    c.save();
    let fs = size;
    c.font = `${fs}px ${HAND}`;
    let fullW = c.measureText(str).width;
    if (fullW > 1320) {
      fs = Math.floor((fs * 1320) / fullW);
      c.font = `${fs}px ${HAND}`;
      fullW = c.measureText(str).width;
    }
    c.textBaseline = 'alphabetic';
    const x0 = W / 2 - fullW / 2;
    c.textAlign = 'left';
    c.fillStyle = `rgba(236,230,218,${0.92 * alpha})`;
    c.fillText(str.slice(0, n), x0, y);
    c.restore();
  }

  matKhuat = function (c, now, s) {
    // Phim hết: đứng lại đúng sân đình vừa thấy trong phim (san.js). Mảnh nhựa rơi ở đó, không còn bảng ba lựa chọn.
    if (typeof SC !== 'undefined' && SC.san && q.get('roicu') !== '1') {
      if (!ST.started) { ST.started = true; HINT.off = true; HINT.text = ''; if (typeof KET !== 'undefined' && KET.el && !KET.el.paused) { try { KET.el.pause(); } catch (e) {} } }
      if (!ST.veSan && s >= 0.5) { ST.veSan = true; go('san', 1800); }
      return;
    }
    ensureSprites();
    ST.s = s;

    // 1. s = 0: giữ nguyên khung cuối, nhạc tắt phụt, màn tối dần về đen trong 1.2 giây
    if (!ST.started) {
      ST.started = true;
      HINT.off = true;
      HINT.text = '';
      if (typeof KET !== 'undefined' && KET.el && !KET.el.paused) {
        if (!KET.endAt) {
          KET.endT = typeof ketT === 'function' ? ketT() : MK.t0;
          KET.endAt = performance.now();
        }
        try { KET.el.pause(); } catch (e) {}
      }
      if (!ST.cut && ac && master) {
        ST.cut = true;
        const t = ac.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0, t + 0.08);
        master.gain.setValueAtTime(0, t + 0.5);
        master.gain.linearRampToValueAtTime(1, t + 0.55);
      }
    }

    const dark = clamp(s / 1.2, 0, 1);
    c.fillStyle = `rgba(0,0,0,${dark})`;
    c.fillRect(-300, -300, W + 600, H + 600);

    // 2. s = 1.6: tiếng "tách" nhựa rơi xuống sàn + 2 cú nảy
    if (s >= 1.6 && !ST.clink) {
      ST.clink = true;
      if (s < 3.0) playDrop();
    }

    const pickElap = ST.picked ? (now - ST.pickAt) / 1000 : -1;
    const uiFade = ST.picked ? 1 - clamp(pickElap / 0.35, 0, 1) : 1;
    const spotFade = ST.picked ? 1 - clamp(pickElap / 0.5, 0, 1) : 1;

    // 3. s = 2.2 → 4: vệt sáng ấm hiện dần và mảnh nhựa màu vàng cam
    const spotK = sstep(2.2, 4.0, s) * spotFade;
    if (spotK > 0.005 && warmSpr) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha *= 0.28 * spotK;
      c.drawImage(warmSpr, PIECE_X - 180, PIECE_Y - 68, 360, 148);
      c.globalAlpha *= 0.9;
      c.drawImage(warmSpr, PIECE_X - 96, PIECE_Y - 36, 192, 82);
      c.restore();
    }

    const pieceA = sstep(2.35, 3.6, s);
    if (pieceA > 0.005) {
      const shimmer = Math.pow(0.5 + 0.5 * Math.sin(now * 0.0028), 3);
      if (!ST.picked) {
        drawPieceBody(c, PIECE_X, PIECE_Y, PIECE_ROT, 1, pieceA, shimmer * pieceA, 1);
      } else {
        const u = clamp(pickElap / 0.55, 0, 1);
        const e = ease(u);
        if (u < 1) {
          const px = lerp(PIECE_X, BAG_X, e);
          const py = lerp(PIECE_Y, BAG_Y, e) - Math.sin(Math.PI * u) * 85;
          const sc = lerp(1, 0.36, e);
          const rot = lerp(PIECE_ROT, -0.32, e);
          const al = u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25;
          drawPieceBody(c, px, py, rot, sc, al, 0, (1 - e) * 0.5);
        }
        const bagFade = u < 0.7 ? clamp(pickElap / 0.2, 0, 1) : 1 - clamp((pickElap - 0.55) / 0.25, 0, 1);
        if (bagFade > 0.01) {
          if (warmSpr && u > 0.55) {
            const fl = Math.sin(Math.PI * clamp((pickElap - 0.3) / 0.45, 0, 1));
            c.save();
            c.globalCompositeOperation = 'lighter';
            c.globalAlpha *= 0.32 * fl;
            c.drawImage(warmSpr, BAG_X - 95, BAG_Y - 95, 190, 190);
            c.restore();
          }
          if (POCKET.may && typeof drawMiniWalkman === 'function') {
            c.save();
            c.globalAlpha *= 0.7 * bagFade;
            c.translate(BAG_X, BAG_Y);
            c.rotate(-0.08);
            drawMiniWalkman(c, 0.5);
            c.restore();
          } else if (typeof drawPouch === 'function') {
            drawPouch(c, BAG_X, BAG_Y + 6, 0.78 * bagFade);
          }
        }
      }
    }

    // 4. s = 3.2: gõ từng ký tự (~22 ký tự/giây)
    const n1 = s >= T_L1 ? clamp(Math.floor((s - T_L1) * CPS) + 1, 0, LINE1.length) : 0;
    if (n1 > ST.n1) {
      if (n1 - ST.n1 <= 2 && LINE1[n1 - 1] !== ' ') playKeyTick(s);
      ST.n1 = n1;
    }
    const n2 = s >= T_L2 ? clamp(Math.floor((s - T_L2) * CPS) + 1, 0, LINE2.length) : 0;
    if (n2 > ST.n2) {
      if (n2 - ST.n2 <= 2 && LINE2[n2 - 1] !== ' ') playKeyTick(s);
      ST.n2 = n2;
    }

    if (uiFade > 0.01) {
      drawTypeLine(c, LINE1, n1, 345, 48, uiFade);
      drawTypeLine(c, LINE2, n2, 415, 48, uiFade);
    }

    if (s >= T_L2_END && !ST.picked) {
      const elap = s - T_L2_END;
      const inA = clamp(elap / 0.5, 0, 1);
      const pulse = 0.32 + 0.36 * (0.5 + 0.5 * Math.sin(elap * 3.2));
      text(c, 'chạm để nhặt', PIECE_X, 744, 34, inA * pulse);
    }

    // 6. Sau khi nhặt 0.8 giây: hiện ba lựa chọn
    if (ST.picked && !ST.menuShown && now - ST.pickAt >= 800) {
      showMenu();
    }
  };

  // 5. Chạm vào mảnh để nhặt
  SC.ket.tapBelow = true;
  const ketTap0 = SC.ket.tap;
  SC.ket.tap = function (p) {
    if (ST.menuShown || ST.picked) return;
    if (ST.started && ST.s >= T_L2_END) {
      if (Math.abs(p[0] - PIECE_X) <= 150 && p[1] >= 540 && p[1] <= 760) {
        ST.picked = true;
        ST.pickAt = performance.now();
        if (typeof bagAdd === 'function') bagAdd('manh_Mi4', 'mảnh nhựa màu cam', drawManhBag);
        saveManh();
        return;
      }
    }
    if (ketTap0) ketTap0.call(this, p);
  };
})();
