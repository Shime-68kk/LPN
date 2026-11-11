// "Phần còn lại": âm thanh. Bài "Có Em Chờ" đi qua bộ lọc "khoảng cách" (xa: nghẹt, vang dài, nhỏ → gần: rõ, khô, đầy).
// Tiếng nền tự tổng hợp: gió trước bình minh, tiếng ù một mình, bước chân, tiếng của từng đồ vật.
// Dùng: window.ConLaiAm (init() sau lần chạm đầu).
'use strict';
(() => {
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } } };
  const SONG = '../assets/sound/' + encodeURIComponent('Có Em Chờ') + '.mp3';

  const A = {
    ctx: null, out: null, muted: ls.get('lpn:conlai-mute') === '1', el: null, dist: 0,
    init() {
      if (this.ctx) return;
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      const ctx = (this.ctx = new C());
      // iPhone: phát như nhạc (gạt nút im lặng vẫn nghe). Bị ngắt thì chạm hay quay lại là bật lại.
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* bỏ qua */ }
      ['pointerdown', 'touchend'].forEach((n) => document.addEventListener(n, () => this.resume(), true));
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.resume(); });
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -8; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
      this.out = ctx.createGain();
      this.out.gain.value = this.muted ? 0 : 1;
      this.out.connect(comp).connect(ctx.destination);

      const len = ctx.sampleRate * 4, mk = () => ctx.createBuffer(1, len, ctx.sampleRate);
      const brown = mk(), white = mk(), bd = brown.getChannelData(0), wd = white.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; wd[i] = w; last = (last + 0.02 * w) / 1.02; bd[i] = last * 3.2; }
      this.brown = brown; this.white = white;

      // Vang dài của một nơi trống (dùng cho "ở xa" và cho tiếng đồ vật)
      const ir = ctx.createBuffer(2, ctx.sampleRate * 3.8, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.6); }
      this.verb = ctx.createConvolver(); this.verb.buffer = ir;
      this.verbOut = ctx.createGain(); this.verbOut.gain.value = 0.55;
      this.verb.connect(this.verbOut).connect(this.out);

      // Tiếng hiệu ứng: ra loa kèm chút vang
      this.fx = ctx.createGain(); this.fx.connect(this.out);
      const fxw = ctx.createGain(); fxw.gain.value = 0.35; this.fx.connect(fxw).connect(this.verb);

      // ----- Bài hát qua bộ lọc khoảng cách -----
      const el = (this.el = new Audio());
      el.preload = 'auto'; el.src = SONG; el.playsInline = true;
      try {
        const src = ctx.createMediaElementSource(el);
        this.lp1 = this.filt('lowpass', 300, 0.6); this.lp2 = this.filt('lowpass', 300, 0.5);
        this.hp = this.filt('highpass', 20, 0.5);
        this.dry = ctx.createGain(); this.dry.gain.value = 0;
        this.wetS = ctx.createGain(); this.wetS.gain.value = 0;
        src.connect(this.lp1).connect(this.lp2).connect(this.hp);
        this.hp.connect(this.dry).connect(this.out);
        this.hp.connect(this.wetS).connect(this.verb);
      } catch (e) { /* trình duyệt cũ: phát thẳng */ }
    },
    resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); },
    mute(on) {
      this.muted = on; ls.set('lpn:conlai-mute', on ? '1' : '0');
      if (this.out) this.out.gain.setTargetAtTime(on ? 0 : 1, this.ctx.currentTime, 0.05);
    },
    filt(type, f, q = 0.7) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; },
    loopSrc(buf, rate = 1) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.start(0, Math.random() * 3); return s; },
    env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },

    // ---------- Bài hát ----------
    // x: 0 = rất xa (nghẹt, vang, nhỏ) → 1 = ngay đây (rõ, khô, đầy). Đổi mượt trong `sec` giây.
    songDist(x, sec = 0.6) {
      this.dist = x;
      if (!this.ctx || !this.lp1) return;
      const t = this.ctx.currentTime, tc = Math.max(0.02, sec / 3);
      const cut = 260 * Math.pow(20000 / 260, Math.pow(x, 1.15));
      this.lp1.frequency.setTargetAtTime(cut, t, tc);
      this.lp2.frequency.setTargetAtTime(Math.min(20000, cut * 1.5), t, tc);
      this.hp.frequency.setTargetAtTime(x < 0.5 ? 140 - x * 200 : 25, t, tc);
      this.dry.gain.setTargetAtTime(0.1 + 0.9 * Math.pow(x, 1.4), t, tc);
      this.wetS.gain.setTargetAtTime(0.5 * (1 - x) * (1 - x) + 0.02, t, tc);
    },
    songPlay(at = 0) {
      if (!this.el) return;
      try { this.el.currentTime = at; } catch (e) { /* bỏ qua */ }
      const p = this.el.play(); if (p && p.catch) p.catch(() => {});
    },
    songStop() { if (this.el) { this.el.pause(); } if (this.dry) { this.dry.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); this.wetS.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); } },
    songTime() { return this.el && !this.el.paused ? this.el.currentTime : -1; },

    // ---------- Nền: gió trước bình minh + tiếng ù một mình ----------
    bedStart() {
      if (!this.ctx || this.wind) return;
      const ctx = this.ctx, t = ctx.currentTime;
      // Gió: tiếng ồn nâu qua lọc dải, tần số trôi chậm
      const bp = this.filt('bandpass', 380, 0.9), g = (this.wind = ctx.createGain());
      g.gain.value = 0; g.gain.setTargetAtTime(0.5, t, 2.5);
      const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 0.07; lg.gain.value = 170; l.connect(lg).connect(bp.frequency); l.start();
      const l2 = ctx.createOscillator(), lg2 = ctx.createGain(); l2.frequency.value = 0.19; lg2.gain.value = 0.16; l2.connect(lg2).connect(g.gain); l2.start();
      this.loopSrc(this.brown, 1).connect(bp).connect(g).connect(this.out);
      const gw = ctx.createGain(); gw.gain.value = 0.5; g.connect(gw).connect(this.verb);
      // Hơi gió cao, rất khẽ
      const hp = this.filt('bandpass', 2600, 0.6), hg = (this.air = ctx.createGain()); hg.gain.value = 0; hg.gain.setTargetAtTime(0.012, t, 3);
      this.loopSrc(this.white, 0.7).connect(hp).connect(hg).connect(this.out);
      // Tiếng ù: hai nốt trầm lệch nhau, phách chậm (gai người nhẹ)
      const dg = (this.drone = ctx.createGain()); dg.gain.value = 0; dg.gain.setTargetAtTime(0.055, t + 1, 3);
      [82.4, 84.1, 123.5].forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; const og = ctx.createGain(); og.gain.value = i === 2 ? 0.35 : 1; o.connect(og).connect(dg); o.start(); });
      const dlp = this.filt('lowpass', 420, 0.5); dg.connect(dlp).connect(this.out); const dw = ctx.createGain(); dw.gain.value = 0.6; dlp.connect(dw).connect(this.verb);
    },
    // Tiếng ù tan đi (có người rồi); gió lùi xuống theo mức
    droneOff(sec = 3) { if (this.drone) this.drone.gain.setTargetAtTime(0, this.ctx.currentTime, sec / 3); },
    windTo(v, sec = 2) { if (this.wind) { this.wind.gain.setTargetAtTime(v, this.ctx.currentTime, sec / 3); this.air.gain.setTargetAtTime(v * 0.024, this.ctx.currentTime, sec / 3); } },
    // Im hẳn một nhịp (mọi tiếng nền)
    hush(sec = 0.2) { this.windTo(0, sec); this.droneOff(sec); },

    // ---------- Bước chân ----------
    // near = 1: ngay dưới chân em (đầy, rõ). near nhỏ: bước của anh ở xa (nghẹt, khẽ).
    step(near = 1, pan = 0) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + 0.01;
      const bus = ctx.createGain(); bus.gain.value = 0.25 + 0.75 * near;
      const lp = this.filt('lowpass', 500 + 9000 * near * near, 0.5);
      let tail = lp;
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; lp.connect(p); tail = p; }
      tail.connect(this.out);
      const w = ctx.createGain(); w.gain.value = 0.25 + 0.5 * (1 - near); tail.connect(w).connect(this.verb);
      bus.connect(lp);
      // gót: tiếng thụp trầm
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.11);
      this.env(og, t, 0.004, 0.9, 0.16); o.connect(og).connect(bus); o.start(t); o.stop(t + 0.3);
      // sỏi, cát dưới đế giày: mấy hạt tiếng ồn ngắn
      for (let i = 0; i < 5; i++) {
        const s = ctx.createBufferSource(); s.buffer = this.white; const f = this.filt('bandpass', 1400 + Math.random() * 2600, 1.4), g = ctx.createGain();
        const tt = t + 0.012 + i * 0.022 + Math.random() * 0.012;
        this.env(g, tt, 0.003, 0.22 * (1 - i * 0.13), 0.05 + Math.random() * 0.04);
        s.connect(f).connect(g).connect(bus); s.start(tt, Math.random() * 3, 0.2);
      }
      // mũi giày chạm sau gót một chút
      const s2 = ctx.createBufferSource(); s2.buffer = this.brown; const g2 = ctx.createGain(); this.env(g2, t + 0.09, 0.005, 0.5, 0.09);
      s2.connect(g2).connect(bus); s2.start(t + 0.09, Math.random() * 3, 0.25);
    },

    // ---------- Chuông ấm (ô cửa sáng đèn, vạch 999) ----------
    bell(freq, vol = 0.12, dur = 3.2, when = 0) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + when;
      [[1, 1], [2.01, 0.28], [3.02, 0.1]].forEach(([m, v]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq * m;
        this.env(g, t, 0.012, vol * v, dur / m); o.connect(g).connect(this.fx); o.start(t); o.stop(t + dur + 0.2);
      });
    },
    // Ánh sáng lấp lánh: mấy hạt chuông cao, thưa, rất khẽ (giọng Mi trưởng của bài)
    sparkle(sec = 7, vol = 0.035) {
      if (!this.ctx) return;
      const notes = [1318.5, 1661.2, 1975.5, 2217.5, 2637];
      for (let i = 0, t = 0; t < sec; i++) { this.bell(notes[(i * 3 + (i % 2)) % notes.length], vol * (0.6 + Math.random() * 0.6), 1.6, t); t += 0.28 + Math.random() * 0.5; }
    },
    // Hơi ấm tràn vào: tiếng ồn cao mở ra như nắng (không có cao độ nên không lệch tông bài)
    warm(sec = 5, vol = 0.05) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = this.white; s.loop = true;
      const f = this.filt('bandpass', 900, 0.5), g = ctx.createGain();
      f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(5200, t + sec * 0.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + sec * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + sec);
      s.connect(f).connect(g).connect(this.fx); s.start(t); s.stop(t + sec + 0.1);
    },

    // ---------- Tiếng của phim ----------
    // Bước của em: một tiếng trầm sâu lan ra (như cả khoảng tối rung lên)
    boom() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + 0.02, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(31, t + 1.4);
      this.env(g, t, 0.02, 0.55, 2.4); o.connect(g).connect(this.out); const w = ctx.createGain(); w.gain.value = 0.5; g.connect(w).connect(this.verb);
      o.start(t); o.stop(t + 2.8);
    },
    // Dồn lên trước điệp khúc: hơi gió hút ngược, cắt đúng lúc điệp khúc vào
    riser(sec = 3.4) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = this.white; s.loop = true;
      const f = this.filt('bandpass', 400, 1.2), g = ctx.createGain();
      f.frequency.setValueAtTime(350, t); f.frequency.exponentialRampToValueAtTime(7000, t + sec);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.075, t + sec * 0.97); g.gain.linearRampToValueAtTime(0, t + sec);
      s.connect(f).connect(g).connect(this.fx); s.start(t); s.stop(t + sec + 0.05);
    },
    // Điệp khúc vào: một nhịp trầm đỡ dưới bài hát
    hit() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + 0.005, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(41, t + 0.5);
      this.env(g, t, 0.006, 0.5, 2); o.connect(g).connect(this.out); o.start(t); o.stop(t + 2.3);
      const s = ctx.createBufferSource(); s.buffer = this.brown; const sg = ctx.createGain(); this.env(sg, t, 0.004, 0.35, 0.5); s.connect(sg).connect(this.fx); s.start(t, 1, 0.7);
    },
    // Ánh sáng chững lại: một tiếng tụt xuống, khẽ
    down() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + 0.02, o = ctx.createOscillator(), g = ctx.createGain(), f = this.filt('lowpass', 900, 0.7);
      o.type = 'triangle'; o.frequency.setValueAtTime(196, t); o.frequency.exponentialRampToValueAtTime(61, t + 1.1);
      this.env(g, t, 0.03, 0.1, 1.3); o.connect(f).connect(g).connect(this.fx); o.start(t); o.stop(t + 1.6);
    },

    // ---------- Tiếng đồ vật ----------
    // Công tắc đèn bàn: tách một tiếng, rồi tiếng quạt laptop rì rì vài giây
    lamp() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + 0.02;
      const s = ctx.createBufferSource(); s.buffer = this.white; const f = this.filt('bandpass', 2400, 2), g = ctx.createGain();
      this.env(g, t, 0.001, 0.32, 0.03); s.connect(f).connect(g).connect(this.fx); s.start(t, 1, 0.1);
      const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.05);
      this.env(og, t, 0.002, 0.25, 0.07); o.connect(og).connect(this.fx); o.start(t); o.stop(t + 0.2);
      const n = ctx.createBufferSource(); n.buffer = this.brown; n.loop = true; const nf = this.filt('bandpass', 520, 1.1), ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t + 0.2); ng.gain.exponentialRampToValueAtTime(0.11, t + 1.4); ng.gain.setTargetAtTime(0.0001, t + 5, 0.9);
      n.connect(nf).connect(ng).connect(this.fx); n.start(t + 0.2); n.stop(t + 9);
    },
    // Điện thoại rung trên mặt bàn: hai hồi
    buzz(times = 2) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      for (let k = 0; k < times; k++) {
        const t = ctx.currentTime + 0.05 + k * 0.95, d = 0.55;
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 158;
        const am = ctx.createOscillator(), amg = ctx.createGain(); am.type = 'square'; am.frequency.value = 27; amg.gain.value = 0.5;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.03); g.gain.setValueAtTime(0.5, t + d - 0.05); g.gain.linearRampToValueAtTime(0, t + d);
        const trem = ctx.createGain(); trem.gain.value = 0.5; am.connect(amg).connect(trem.gain);
        const lp = this.filt('lowpass', 620, 0.8), v = ctx.createGain(); v.gain.value = 0.2;
        o.connect(trem).connect(g).connect(lp).connect(v).connect(this.fx);
        // mặt bàn kêu lạch cạch theo
        const s = ctx.createBufferSource(); s.buffer = this.white; s.loop = true; const sf = this.filt('bandpass', 1900, 3), sg = ctx.createGain(); sg.gain.value = 0.05;
        const sam = ctx.createGain(); sam.gain.value = 0; amg.connect(sam.gain); s.connect(sf).connect(sam).connect(sg).connect(g);
        o.start(t); am.start(t); s.start(t); o.stop(t + d + 0.05); am.stop(t + d + 0.05); s.stop(t + d + 0.05);
      }
    },
    // Khay inox: tiếng đũa chạm khay, vang trong nhà ăn vắng
    clink() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      [[0, 1], [0.34, 0.5]].forEach(([dt, v]) => {
        const t = ctx.currentTime + 0.03 + dt;
        [[1873, 1], [2817, 0.6], [4388, 0.35], [6120, 0.18]].forEach(([f, a]) => {
          const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
          this.env(g, t, 0.002, 0.07 * a * v, 0.5 + 0.5 / a * 0.3); o.connect(g).connect(this.fx); const w = ctx.createGain(); w.gain.value = 0.9; g.connect(w).connect(this.verb);
          o.start(t); o.stop(t + 1.6);
        });
      });
    },
    // Lá chè xào xạc trong sương
    rustle() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + 0.02, s = ctx.createBufferSource(); s.buffer = this.white; s.loop = true;
      const f = this.filt('highpass', 3200, 0.5), g = ctx.createGain(); g.gain.value = 0;
      for (let i = 0; i < 4; i++) { const tt = t + i * 0.9 + Math.random() * 0.3; g.gain.setTargetAtTime(0.035, tt, 0.25); g.gain.setTargetAtTime(0.004, tt + 0.5, 0.25); }
      g.gain.setTargetAtTime(0, t + 4, 0.4);
      s.connect(f).connect(g).connect(this.fx); s.start(t); s.stop(t + 6);
    },
    // Then cổng sắt: tiếng kim loại nặng, ấm (kết gặp được)
    latch() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + 0.02;
      [[212, 1, 1.4], [331, 0.5, 1.1], [540, 0.3, 0.8], [1290, 0.12, 0.5]].forEach(([f, a, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; this.env(g, t, 0.003, 0.2 * a, d);
        o.connect(g).connect(this.fx); o.start(t); o.stop(t + d + 0.2);
      });
      const s = ctx.createBufferSource(); s.buffer = this.brown; const g = ctx.createGain(); this.env(g, t, 0.002, 0.5, 0.12); s.connect(g).connect(this.fx); s.start(t, 1, 0.3);
      // bản lề kêu kéo dài
      const o = ctx.createOscillator(), og = ctx.createGain(), of = this.filt('bandpass', 900, 6); o.type = 'sawtooth';
      o.frequency.setValueAtTime(190, t + 0.5); o.frequency.linearRampToValueAtTime(260, t + 2.6);
      og.gain.setValueAtTime(0.0001, t + 0.5); og.gain.exponentialRampToValueAtTime(0.03, t + 1.1); og.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
      o.connect(of).connect(og).connect(this.fx); o.start(t + 0.5); o.stop(t + 3);
    },
  };
  window.ConLaiAm = A;
})();
