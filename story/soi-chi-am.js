// Chương 19 · Sợi chỉ: âm thanh tự tổng hợp (không cần tệp). Tiếng nền từng nơi, nhạc nền piano điện dày dần theo
// từng phần, còi hú doanh trại, tiếng rung, chuông gọi, tiếng chỉ. Dùng: window.SoiChiAm (init() sau lần chạm đầu).
'use strict';
(() => {
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } } };
  // ================= Âm thanh (tự tổng hợp, không cần tệp) =================
  const A = {
    ctx: null, out: null, amb: null, muted: ls.get('lpn:soichi-mute') === '1',
    init() {
      if (this.ctx) return;
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      const ctx = (this.ctx = new C());
      // iPhone: phát như nhạc (gạt nút im lặng vẫn nghe). Bị ngắt (cuộc gọi, chuyển app) thì chạm hay quay lại là bật lại.
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* bỏ qua */ }
      ['pointerdown', 'touchend'].forEach((n) => document.addEventListener(n, () => this.resume(), true));
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.resume(); });
      this.out = ctx.createGain();
      this.out.gain.value = this.muted ? 0 : 1;
      this.out.connect(ctx.destination);
      // Hai loại tiếng ồn dựng sẵn: nâu (trầm, tiếng phòng, gió) và trắng (tiếng xì, dế, bước chân)
      const len = ctx.sampleRate * 4, mk = () => ctx.createBuffer(1, len, ctx.sampleRate);
      const brown = mk(), white = mk(), bd = brown.getChannelData(0), wd = white.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; wd[i] = w; last = (last + 0.02 * w) / 1.02; bd[i] = last * 3.2; }
      this.noise = brown; this.white = white;
      // Vang: phòng nhỏ ấm, dựng từ tiếng ồn tắt dần (không cần tệp)
      const ir = ctx.createBuffer(2, ctx.sampleRate * 2.6, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2); }
      this.verb = ctx.createConvolver(); this.verb.buffer = ir;
      const vg = ctx.createGain(); vg.gain.value = 0.5;
      this.verb.connect(vg).connect(this.out);
      // Nhạc và tiếng nền đi qua bus riêng để hạ xuống khi có tiếng còi, cuộc gọi
      this.bed = ctx.createGain(); this.bed.gain.value = 1;
      // Nhường chỗ: lúc có tiếng lệch một bên, tiếng phòng khẽ lùi xuống (~3 dB) rồi trở lại, để tiếng ấy nổi lên mà không phải to, chói
      this.bedSpot = ctx.createGain(); this.bed.connect(this.bedSpot).connect(this.out);
      // Tiếng hiệu ứng (còi, chuông, tiếng chỉ): ra thẳng loa, thêm chút vang cho ấm
      this.fx = ctx.createGain(); this.fx.connect(this.out); this.wet(this.fx, 0.28);
      // Bus khô cho tiếng đặt quanh đầu: không vang chính giữa (vang chính giữa kéo tiếng về giữa đầu, mất cảm giác 8D)
      // To hơn tiếng phòng ~3 dB: tiếng quanh đầu là nhân vật chính, tiếng phòng chỉ là mặt phẳng làm mốc.
      this.fxd = ctx.createGain(); this.fxd.gain.value = 1.4; this.fxd.connect(this.out);
      // Hai tiếng dội sớm của bức tường (không phải vang): một tiếng cùng phía sau 7 ms, một tiếng phía đối diện sau 16 ms, nhỏ và tối.
      // Tai vẫn nghe hướng theo tiếng tới trước (lệch rõ một bên), còn hai tiếng dội làm tiếng nằm NGOÀI đầu, trong một căn phòng thật.
      if (ctx.createChannelSplitter) {
        const er = (ms, hz, v, swap) => { const d = ctx.createDelay(0.05), f = this.filt('lowpass', hz), g = ctx.createGain(); d.delayTime.value = ms / 1000; g.gain.value = v; d.connect(f).connect(g).connect(this.out); return d; };
        this.fxd.connect(er(7, 5200, 0.2));
        const sp = ctx.createChannelSplitter(2), mg = ctx.createChannelMerger(2);
        this.fxd.connect(sp); sp.connect(mg, 0, 1); sp.connect(mg, 1, 0); mg.connect(er(16, 2800, 0.09));
      }
      this.music.init(this);
    },
    // Gửi một nhánh tiếng vào vang
    wet(node, amt = 0.3) { const g = this.ctx.createGain(); g.gain.value = amt; node.connect(g).connect(this.verb); return node; },
    duck(level, sec) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime, g = this.bed.gain;
      g.cancelScheduledValues(t); g.setTargetAtTime(level, t, 0.15); g.setTargetAtTime(1, t + sec, 0.8);
    },
    spot(sec = 1) {
      if (!this.ctx || !this.bedSpot) return;
      const t = this.ctx.currentTime, g = this.bedSpot.gain;
      g.cancelScheduledValues(t); g.setTargetAtTime(0.7, t, 0.04); g.setTargetAtTime(1, t + sec, 0.35);
    },
    loopSrc(buf, rate = 1) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.start(0, Math.random() * 3); return s; },
    filt(type, f, q = 0.7) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; },

    // ---------- Tiếng nền từng nơi (đổi mượt khi sang cảnh khác) ----------
    // phong-dem: tiếng phòng, đồng hồ tích tắc, thỉnh thoảng một chiếc xe máy xa
    // phong-ngay: phố Hà Nội rì rầm, còi xe xa
    // trai-sang: gió sớm, chim
    // trai-ngay: gió nắng, tiếng bước đều xa
    // trai-dem: dế, gió đêm
    // Màn hình chia đôi: mỗi nửa có tiếng nền riêng, đặt lệch về tai bên đó (side 'l' | 'r', 'c' là chính giữa).
    // Đeo tai nghe sẽ nghe Hà Nội bên trái, doanh trại bên phải.
    place: {}, amb: {},
    // Một nhánh tiếng đặt lệch trái / phải, nối vào đích (mặc định: tiếng hiệu ứng)
    pan(side, dest) {
      const to = dest || this.fx;
      if (!this.ctx.createStereoPanner || side === 'c') return to;
      const p = this.ctx.createStereoPanner(); p.pan.value = side === 'l' ? -0.6 : side === 'r' ? 0.6 : 0; p.connect(to); return p;
    },
    setPlace(place, side = 'c', vol = 1) {
      if (!this.ctx) return;
      if (place === this.place[side] && this.amb[side]) { this.amb[side].g.gain.setTargetAtTime(this.amb[side].base * vol, this.ctx.currentTime, 0.6); return; }
      this.place[side] = place;
      const ctx = this.ctx, t = ctx.currentTime, old = this.amb[side];
      this.placeT = t;  // lúc tiếng nền bắt đầu: game chờ nền ổn định rồi mới cho tiếng lệch một bên vang lên
      if (old) { old.g.gain.setTargetAtTime(0.0001, t, 0.5); setTimeout(() => old.stop(), 2500); }
      if (!place) { this.amb[side] = null; return; }
      const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(this.pan(side, this.bed));
      const nodes = [], timers = [];
      // Tiếng nền: hai tai to bằng nhau nhưng mỗi tai một dải ồn riêng (lệch nhau), nghe như đang ngồi giữa căn phòng chứ không ở trong đầu.
      // Đây là "mặt phẳng" đều đều: có nó làm mốc thì một tiếng "ting" lệch hẳn một bên mới nghe ra là thật sự ở bên đó.
      const bed = (buf, type, f, v, q) => {
        const sL = this.loopSrc(buf), sR = this.loopSrc(buf), m = ctx.createChannelMerger(2), fl = this.filt(type, f, q), vg = ctx.createGain(); vg.gain.value = v;
        sL.connect(m, 0, 0); sR.connect(m, 0, 1); m.connect(fl).connect(vg).connect(g); nodes.push(sL, sR); return { s: sL, fl, vg };
      };
      const every = (ms, jitter, fn) => { const run = () => { fn(); timers.push(setTimeout(run, ms + Math.random() * jitter)); }; timers.push(setTimeout(run, Math.random() * ms)); };
      const night = place.endsWith('dem') || place === 'hanh-lang';
      if (place === 'phong-toi') {
        // Phòng anh lúc đêm: tiếng phòng trầm, xe máy xa. Tích tắc do game gõ theo kim giây (clockTick).
        bed(this.noise, 'lowpass', 300, 0.55);
        every(16000, 10000, () => this.passBy(g, 0.04));
      } else if (place === 'hanh-lang') {
        // Hành lang đêm: gió nhẹ phập phồng, dế lác đác ở xa (dế theo nhịp thì game tự gõ)
        const w = bed(this.noise, 'lowpass', 420, 0.75);
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 140; lfo.connect(lg).connect(w.fl.frequency); lfo.start(); nodes.push(lfo);
        const far = this.filt('lowpass', 3800); far.connect(g); this.wet(far, 0.6);
        every(2200, 2600, () => this.cricket(far));
      } else if (place === 'phong-trai') {
        // Phòng em lúc rạng sáng: tiếng phòng, chim ngoài cửa sổ nghe nghẹt
        bed(this.noise, 'lowpass', 240, 0.5);
        const out = this.filt('lowpass', 2400); out.connect(g);
        every(2600, 3200, () => this.bird(out, 0.7));
      } else if (place === 'ngu') {
        bed(this.noise, 'lowpass', 220, 0.5);
        const out = this.filt('lowpass', 3000); out.connect(g);
        every(1100, 900, () => this.cricket(out));
        every(1500, 1700, () => this.breathe(g, Math.random() * 2 - 1, 0.35 + Math.random() * 0.3));
      } else if (place === 'lop') {
        // Phòng học buổi tối: tiếng phòng, đèn tuýp rè rất khẽ, quạt trần
        bed(this.noise, 'lowpass', 260, 0.5);
        const o = ctx.createOscillator(), og = ctx.createGain(), lp = this.filt('lowpass', 700); o.type = 'sawtooth'; o.frequency.value = 100; og.gain.value = 0.012; o.connect(lp).connect(og).connect(g); o.start(); nodes.push(o);
        const w = bed(this.noise, 'bandpass', 500, 0.35, 0.6);
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 1.6; lg.gain.value = 0.12; lfo.connect(lg).connect(w.vg.gain); lfo.start(); nodes.push(lfo);
      } else if (place === 'phong-dem') {
        bed(this.noise, 'lowpass', 300, 0.55);
        every(1000, 0, () => this.click(g, 0.02, 2600));
        every(14000, 9000, () => this.passBy(g, 0.05));
      } else if (place === 'phong-ngay' || place === 'pho') {
        bed(this.noise, 'bandpass', 520, 0.9, 0.5);
        bed(this.white, 'bandpass', 1800, 0.03, 0.6);
        every(7000, 6000, () => this.horn(g));
        if (place === 'pho') every(5000, 4000, () => this.passBy(g, 0.07));
      } else if (place === 'trai-sang') {
        bed(this.noise, 'lowpass', 600, 0.6);
        every(1800, 2600, () => this.bird(g));
      } else if (place === 'trai-ngay') {
        const w = bed(this.noise, 'bandpass', 700, 0.9, 0.4);
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 260; lfo.connect(lg).connect(w.fl.frequency); lfo.start(); nodes.push(lfo);
        every(5000, 5000, () => this.bird(g, 0.5));
      } else if (night) {
        bed(this.noise, 'lowpass', 260, 0.5);
        every(900, 700, () => this.cricket(g));
      }
      const base = night ? 0.09 : 0.075;
      g.gain.setTargetAtTime(base * vol, t + 0.3, 0.9);
      this.amb[side] = { g, base, stop: () => { nodes.forEach((n) => { try { n.stop(); } catch (e) { /* đã dừng */ } }); timers.forEach(clearTimeout); g.disconnect(); } };
    },
    click(to, vol, f) {
      const t = this.ctx.currentTime, s = this.ctx.createBufferSource(), b = this.filt('bandpass', f, 4), g = this.ctx.createGain();
      s.buffer = this.white; this.env(g, t, vol, 0.001, 0.03);
      s.connect(b).connect(g).connect(to); s.start(t, Math.random() * 3, 0.06);
    },
    // Xe máy chạy ngang xa xa: to dần rồi nhỏ dần, cao độ trượt xuống
    passBy(to, vol) {
      const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), lp = this.filt('lowpass', 500);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(70, t + 4);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 1.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
      o.connect(lp).connect(g).connect(to); o.start(t); o.stop(t + 4.3);
    },
    horn(to) {
      const f = 380 + Math.random() * 120, lp = this.filt('lowpass', 1200); lp.connect(to);
      this.tone('square', f, 0.02, 0.02, 0.25, 0, lp); if (Math.random() < 0.5) this.tone('square', f, 0.02, 0.02, 0.2, 0.32, lp);
    },
    bird(to, vol = 1) {
      const ctx = this.ctx, n = 2 + Math.floor(Math.random() * 4), base = 2600 + Math.random() * 1400;
      for (let i = 0; i < n; i++) {
        const t = ctx.currentTime + i * (0.09 + Math.random() * 0.05), o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), t + 0.06);
        this.env(g, t, 0.022 * vol, 0.005, 0.07); o.connect(g).connect(to); o.start(t); o.stop(t + 0.1);
      }
    },
    cricket(to) {
      const ctx = this.ctx, f = 4300 + Math.random() * 500;
      for (let i = 0; i < 3; i++) {
        const t = ctx.currentTime + i * 0.05, o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f; this.env(g, t, 0.012, 0.004, 0.035); o.connect(g).connect(to); o.start(t); o.stop(t + 0.05);
      }
    },
    // ---------- Tiếng hành động nhỏ (đặt lệch theo nửa màn hình) ----------
    // Chăn sột soạt khi gấp
    swish(side, vol = 0.12) {
      const ctx = this.ctx, t = ctx.currentTime, s = ctx.createBufferSource(), bp = this.filt('bandpass', 1400, 0.8), g = ctx.createGain();
      bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.28);
      s.buffer = this.white; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      s.connect(bp).connect(g).connect(this.pan(side)); s.start(t, Math.random() * 3, 0.45);
    },
    // Điện thoại úp xuống gối: tiếng bịch mềm
    soft(side) { const p = this.pan(side); this.tone('sine', 120, 0.22, 0.004, 0.16, 0, p); this.tone('triangle', 240, 0.05, 0.004, 0.08, 0, p); },
    // Đèn tuýp bật: tách, rè rè, chớp vài lần
    tube(side) {
      const p = this.pan(side), ctx = this.ctx;
      [0, 0.18, 0.32].forEach((w) => this.tone('square', 1900 + Math.random() * 300, 0.03, 0.002, 0.03, w, p));
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + 0.35; o.type = 'sawtooth'; o.frequency.value = 100;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.012, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(this.filt('lowpass', 900)).connect(g).connect(p); o.start(t); o.stop(t + 1.7);
    },
    // Tin nhắn bay đi: một tiếng "bụp" nhỏ, cao dần theo số thứ tự
    pop(side, i = 0) { const p = this.flat(typeof side === 'number' ? side * 0.3 : 0); this.tone('sine', 880 * Math.pow(2, (i % 5) * 2 / 12), 0.07, 0.004, 0.14, 0, p); },
    rungSide(side) {
      const lp = this.filt('lowpass', 420); lp.connect(this.pan(side));
      for (const w of [0, 0.5]) this.tone('square', 150 + Math.random() * 6, 0.16, 0.02, 0.34, w, lp);
    },

    // ---------- Nhạc nền: piano điện nhẹ + đệm, dày dần theo tầng ----------
    // Vòng hợp âm D – Bm – G – A (sus) ở 64 nhịp/phút. level 0: tắt · 1: thưa · 2: thêm rải hợp âm · 3: thêm đệm dài · 4: cao trào
    music: {
      A: null, level: 0, bar: 0, next: 0, timer: 0, out: null,
      CH: [[50, 57, 62, 66, 69], [47, 54, 62, 66, 69], [43, 50, 59, 62, 66], [45, 52, 59, 62, 64]],
      init(A) { this.A = A; this.out = A.ctx.createGain(); this.out.gain.value = 0.0001; this.out.connect(A.bed); A.wet(this.out, 0.55); },
      hz: (n) => 440 * Math.pow(2, (n - 69) / 12),
      set(level) {
        const A = this.A; if (!A || !A.ctx) return;
        this.level = level;
        const t = A.ctx.currentTime;
        this.out.gain.setTargetAtTime(level ? [0, 0.5, 0.65, 0.8, 1][level] : 0.0001, t, level === 4 ? 1.2 : 2.5);
        if (level && !this.timer) { this.next = t + 0.2; this.timer = setInterval(() => this.tick(), 120); }
      },
      key(f, when, vol, dur = 2.6) {
        const A = this.A, ctx = A.ctx, t = when;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const lp = A.filt('lowpass', 2600); lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
        for (const [type, m, v] of [['sine', 1, 1], ['triangle', 2, 0.18], ['sine', 3, 0.06]]) {
          const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = f * m; og.gain.value = v;
          o.connect(og).connect(lp); o.start(t); o.stop(t + dur + 0.05);
        }
        lp.connect(g).connect(this.out);
      },
      pad(notes, when, len, vol) {
        const A = this.A, ctx = A.ctx;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(vol, when + len * 0.4); g.gain.linearRampToValueAtTime(0.0001, when + len + 0.6);
        const lp = A.filt('lowpass', 900); lp.connect(g).connect(this.out);
        for (const n of notes) for (const det of [-7, 7]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = this.hz(n); o.detune.value = det; const og = ctx.createGain(); og.gain.value = 0.12; o.connect(og).connect(lp); o.start(when); o.stop(when + len + 0.7); }
      },
      tick() {
        const A = this.A, ctx = A.ctx, beat = 60 / 64, barLen = beat * 4;
        if (!this.level) { if (this.next < ctx.currentTime) { clearInterval(this.timer); this.timer = 0; } return; }
        while (this.next < ctx.currentTime + 0.6) {
          const c = this.CH[this.bar % 4], t = this.next, L = this.level;
          this.key(this.hz(c[0] - 12), t, 0.16, barLen * 1.1);                 // bè trầm
          this.key(this.hz(c[2]), t + beat * 0.02, 0.07);
          if (L >= 1) this.key(this.hz(c[3]), t + beat * 2, 0.06);
          if (L >= 2) [c[1], c[3], c[4], c[2]].forEach((n, i) => this.key(this.hz(n + (i === 2 && L >= 4 ? 12 : 0)), t + beat * (0.5 + i), 0.045 + (L >= 4 ? 0.02 : 0)));
          if (L >= 3) this.pad(c.slice(1, 4), t, barLen, L >= 4 ? 0.07 : 0.04);
          if (L >= 4 && this.bar % 2 === 0) this.key(this.hz(c[4] + 12), t + beat * 3, 0.05, 3.5);
          this.next += barLen; this.bar++;
        }
      },
    },
    resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); },
    mute(on) {
      this.muted = on; ls.set('lpn:soichi-mute', on ? '1' : '0');
      if (this.out) this.out.gain.setTargetAtTime(on ? 0 : 1, this.ctx.currentTime, 0.05);
    },
    env(g, t, peak, a, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
    tone(type, f, peak, a, d, when = 0, dest) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = f; this.env(g, t, peak, a, d);
      o.connect(g).connect(dest || this.fx); o.start(t); o.stop(t + a + d + 0.05);
      return o;
    },
    // Còi hú doanh trại: hai lần hú lên xuống, vang
    coi() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const g = ctx.createGain(), lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 2400;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + 0.25);
      g.gain.setValueAtTime(0.11, t + 2.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
      lp.connect(g).connect(this.fx);
      this.duck(0.2, 3.6);
      for (const [type, det] of [['sawtooth', 0], ['square', 6]]) {
        const o = ctx.createOscillator(); o.type = type; o.detune.value = det;
        const f = o.frequency;
        f.setValueAtTime(560, t);
        for (let k = 0; k < 2; k++) { f.linearRampToValueAtTime(1150, t + k * 1.6 + 0.8); f.linearRampToValueAtTime(600, t + k * 1.6 + 1.6); }
        const og = ctx.createGain(); og.gain.value = type === 'square' ? 0.35 : 0.6;
        o.connect(og).connect(lp); o.start(t); o.stop(t + 3.5);
      }
    },
    // Điện thoại rung hai nhịp
    rung() {
      if (!this.ctx) return;
      const ctx = this.ctx, lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(this.fx);
      for (const w of [0, 0.5]) this.tone('square', 150 + Math.random() * 6, 0.16, 0.02, 0.34, w, lp);
    },
    // Chuông gọi đến
    chuong(pan = 0, far = 0) {
      if (!this.ctx) return;
      this.duck(0.5, 2.6);
      const lp = this.filt('lowpass', 7000 - far * 4800), g = this.ctx.createGain(); g.gain.value = 1 - far * 0.5;
      lp.connect(g).connect(this.panN(pan, undefined, far || 0));
      [659, 784, 988, 784, 659, 784, 988, 1175].forEach((f, i) => this.tone('sine', f, 0.08, 0.01, 0.42, i * 0.18 + (i > 3 ? 0.5 : 0), lp));
    },
    // Tiếng thở của một người đang ngủ, ở một chỗ quanh đầu (nhiều người ngủ chung phòng)
    breathe(to, pan, vol = 0.03) {
      const ctx = this.ctx, t = ctx.currentTime, p = this.flat(pan, to);
      [[0, 1.3, 500, 700], [1.5, 1.8, 600, 380]].forEach(([w, d, f0, f1]) => {
        const s = ctx.createBufferSource(), b = this.filt('bandpass', f0, 0.9), g = ctx.createGain();
        b.frequency.setValueAtTime(f0, t + w); b.frequency.linearRampToValueAtTime(f1, t + w + d);
        g.gain.setValueAtTime(0.0001, t + w); g.gain.linearRampToValueAtTime(vol, t + w + d * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + w + d);
        s.buffer = this.white; s.connect(b).connect(g).connect(p); s.start(t + w, Math.random() * 3, d + 0.1);
      });
    },
    pluck(f = 660) { this.tone('triangle', f, 0.14, 0.005, 0.9); this.tone('sine', f * 2, 0.04, 0.005, 0.5); },
    chime() { [784, 988, 1175].forEach((f, i) => this.tone('sine', f, 0.08, 0.01, 1.1, i * 0.12)); },
    thud() { this.tone('sine', 96, 0.2, 0.005, 0.28); },
    tick() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime, s = this.ctx.createBufferSource(), hp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      s.buffer = this.noise; hp.type = 'highpass'; hp.frequency.value = 3200; this.env(g, t, 0.05, 0.002, 0.02);
      s.connect(hp).connect(g).connect(this.fx); s.start(t, Math.random() * 2, 0.05);
    },
    play(name) { if (name && this[name]) this[name](); },

    // ================= Bản 7: tiếng của sợi chỉ =================
    // Đặt lệch theo số (-1 trái … 1 phải)
    // Âm thanh 3D cho tai nghe (HRTF: mô phỏng hai tai người, nghe ra trái / phải / trước / sau, kiểu "8D").
    // v: -1 hẳn bên trái … 0 chính giữa phía trước … 1 hẳn bên phải. dist: xa gần (1 = sát bên).
    // Máy không có HRTF thì lùi về trái / phải thường.
    // v: -1 trái · 0 trước mặt · 1 phải · ±2 ra hẳn sau gáy (đi vòng quanh đầu kiểu "8D").
    // Vị trí vòng quanh đầu: v đi tròn, 4 đơn vị là một vòng (v = 3 cũng là v = -1). Không chặn ở ±2 để tiếng bay được vòng qua sau gáy.
    wrap(v) { return ((v + 2) % 4 + 4) % 4 - 2; },
    pos(p, v, dist = 1.6) {
      const P = p._p || (p.positionX || p.setPosition ? p : null), d = p._d || dist, a = v * Math.PI / 2, x = Math.sin(a) * d, z = -Math.cos(a) * d * 0.6 - 0.25;
      if (P) { if (P.positionX) { P.positionX.value = x; P.positionY.value = 0; P.positionZ.value = z; } else P.setPosition(x, 0, z); }
      if (p._w) p._w.pan.value = P ? this.side(v) : Math.max(-1, Math.min(1, v));
      if (p._p !== undefined && p.frequency) p.frequency.value = this.back(v);
    },
    // Độ lệch hai tai thêm (sau HRTF): HRTF thật trên tai nghe điện thoại chỉ lệch ~7 dB, nghe không ra.
    // Lớp này đẩy rõ sang một bên ở ±1 nhưng tai bên kia vẫn còn chút tiếng (lệch hẳn 100% nghe như tai nghe hỏng). Vang lấy SAU khi đã đặt hướng.
    side(v) { return Math.max(-1, Math.min(1, Math.sin(v * Math.PI / 2) * 0.8)); },
    // Sau gáy nghe tối hơn trước mặt (tai người dựa vào đó để biết trước / sau): lọc dần từ 20 kHz xuống ~2,6 kHz ở ngay sau gáy.
    back(v) { const b = Math.max(0, Math.abs(this.wrap(v)) - 1); return 20000 * Math.pow(2600 / 20000, b); },
    // Một nhánh tiếng đặt trong không gian quanh đầu. Trả về nút vào (lọc trước/sau), kèm ._p (HRTF), ._w (đẩy hai tai).
    // Mặc định ra bus khô (không vang chính giữa); muốn vang thì truyền wet: vang lấy sau khi đã đặt hướng nên đuôi vang cũng nằm bên đó.
    spat(v, dest, dist, wet = 0) {
      const to = dest || this.fxd || this.fx, ctx = this.ctx, d = dist || 1.6;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5; lp.frequency.value = this.back(v);
      let out = lp, P = null;
      if (ctx.createPanner && this.hrtf !== false) {
        try {
          P = ctx.createPanner(); P.panningModel = 'HRTF'; P.distanceModel = 'inverse'; P.refDistance = 1; P.rolloffFactor = 0.35;
          out.connect(P); out = P;
        } catch (e) { this.hrtf = false; P = null; }
      }
      lp._p = P; lp._d = d;
      if (ctx.createStereoPanner) { const w = ctx.createStereoPanner(); out.connect(w); out = w; lp._w = w; }
      this.pos(lp, v, d);
      out.connect(to);
      if (wet) { const g = ctx.createGain(); g.gain.value = wet; out.connect(g).connect(this.verb); }
      return lp;
    },
    panN(v, dest, wet) { return this.spat(v || 0, dest, undefined, wet); },
    // Đường ra THƯỜNG (không 8D): chỉ lệch nhẹ trái / phải, có chút vang phòng. Mọi tiếng "trong tay" đi đường này:
    // kéo chỉ, cuộn chỉ, gảy chỉ, đồ vật, tiếng chuông máy mình đang cầm. 8D chỉ dành cho tin chạy trong sợi chỉ
    // và những tiếng vọng từ bên kia cửa, để tai không lẫn: cái gì quanh đầu là cái đang đi giữa hai người.
    flat(pan = 0, dest, wet = 0) {
      const to = dest || this.fx;
      if (!this.ctx.createStereoPanner) return to;
      const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-0.35, Math.min(0.35, pan * 0.35)); p.connect(to);
      if (wet) this.wet(p, wet);
      return p;
    },
    // Tiếng bay: vị trí trượt từ v0 sang v1 trong dur giây. |v| > 1 là đi ra sau gáy; v đi quá 2 là vòng sang tai bên kia.
    // dist nhỏ (≈0,6) là bay sát tai.
    fly(v0, v1, dur, dest, wet, dist) {
      const n = this.spat(v0, dest, dist, wet), P = n._p, d = n._d, t = this.ctx.currentTime, steps = Math.max(16, Math.ceil(Math.abs(v1 - v0) * 12));
      for (let i = 1; i <= steps; i++) {
        const k = i / steps, v = v0 + (v1 - v0) * k, a = v * Math.PI / 2, at = t + dur * k;
        if (P && P.positionX) { P.positionX.linearRampToValueAtTime(Math.sin(a) * d, at); P.positionZ.linearRampToValueAtTime(-Math.cos(a) * d * 0.6 - 0.25, at); }
        if (n._w) n._w.pan.linearRampToValueAtTime(P ? this.side(v) : Math.max(-1, Math.min(1, this.wrap(v))), at);
        n.frequency.linearRampToValueAtTime(this.back(v), at);
      }
      return n;
    },
    // Cho một nhánh tiếng (từ spat) di chuyển lâu dài: lướt tới chỗ khác, hoặc chạy vòng quanh đầu (nhạc 8D).
    mover(n, v0 = 0) {
      const A = this, ctx = this.ctx; let iv = null, cur = v0;
      const set = (v, tc) => {
        cur = v; const P = n._p, d = n._d, t = ctx.currentTime, a = v * Math.PI / 2;
        if (P && P.positionX) { P.positionX.setTargetAtTime(Math.sin(a) * d, t, tc); P.positionZ.setTargetAtTime(-Math.cos(a) * d * 0.6 - 0.25, t, tc); }
        if (n._w) n._w.pan.setTargetAtTime(P ? A.side(v) : Math.max(-1, Math.min(1, A.wrap(v))), t, tc);
        n.frequency.setTargetAtTime(A.back(v), t, tc);
      };
      const stop = () => { clearInterval(iv); iv = null; };
      return {
        get v() { return cur; },
        stop,
        to(v, sec = 1) {
          stop(); const a = cur, t0 = performance.now();
          iv = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / 1000 / sec), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; set(a + (v - a) * e, 0.03); if (k >= 1) stop(); }, 40);
        },
        // period: giây cho một vòng. dir 1: theo chiều kim đồng hồ (phải → sau gáy → trái → trước mặt)
        orbit(period = 12, dir = 1) {
          stop(); let v = cur, last = performance.now();
          iv = setInterval(() => { const now = performance.now(); v = A.wrap(v + dir * 4 * (now - last) / 1000 / period); last = now; set(v, 0.03); }, 40);
        },
      };
    },
    clockTick(pan = 0, vol = 0.035, far = false) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime, s = ctx.createBufferSource(), b = this.filt('bandpass', far ? 1500 : 3200, 3.5), g = ctx.createGain();
      s.buffer = this.white; this.env(g, t, vol, 0.001, far ? 0.06 : 0.03);
      const p = far ? this.panN(pan, undefined, 1.1) : this.flat(pan); s.connect(b).connect(g).connect(p);
      s.start(t, Math.random() * 3, 0.1);
      this.tone('sine', far ? 760 : 1250, vol * 0.3, 0.001, 0.035, 0, p);
    },
    // Một tràng dế (game gõ theo nhịp)
    cricketAt(pan = 0, vol = 0.016, far = false) {
      if (!this.ctx) return;
      const ctx = this.ctx, f = 4200 + Math.random() * 300;
      let p = far ? this.panN(pan) : this.flat(pan);
      if (far) { const lp = this.filt('lowpass', 3400), hp = this.filt('highpass', 400); hp.connect(lp).connect(p); this.wet(lp, 0.8); p = hp; }
      for (let i = 0; i < 3; i++) {
        const t = ctx.currentTime + i * 0.048, o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f; this.env(g, t, vol, 0.004, 0.034); o.connect(g).connect(p); o.start(t); o.stop(t + 0.05);
      }
    },
    // Chuông tin nhắn: MỖI MÁY MỘT CÂU, đều là tiếng dây gảy (như sợi chỉ), khác nhau cả nhịp lẫn độ cao:
    //   who 'q' (máy anh): hai nốt trầm ấm, thong thả, đi lên: La4 → Rê5   ("tình… tang")
    //   who 't' (máy em):  ba nốt cao hơn, nhanh, đi lên: La5 · Rê6 · Fa#6  ("ting-ting-tinh")
    // Mỗi lần có tin, máy nhận kêu (notify, trong tay) và khi tin được đọc, máy bên kia cửa kêu (ting, 8D):
    // nghe đi nghe lại hai câu này là phân biệt được máy ai.
    bell(who, dest, t, v = 1) {
      const ctx = this.ctx;
      const notes = who === 'q' ? [[440, 0, 1], [587.3, 0.2, 1.05]] : [[880, 0, 0.75], [1174.7, 0.09, 0.8], [1480, 0.18, 1]];
      for (const [f, w, a] of notes) {
        this.kp(f, t + w, (who === 'q' ? 0.34 : 0.24) * a * v, dest, who === 'q' ? 3000 : 5600, 1.6);
        // một lớp chuông mỏng cùng cao độ (q: quãng tám trên, ấm; t: ngay cao độ, lấp lánh)
        const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = who === 'q' ? f * 2 : f; o.detune.value = who === 't' ? 6 : 0;
        og.gain.setValueAtTime(0.0001, t + w); og.gain.exponentialRampToValueAtTime(0.03 * a * v, t + w + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + w + (who === 'q' ? 0.9 : 0.6));
        o.connect(og).connect(dest); o.start(t + w); o.stop(t + w + 1);
      }
    },
    // Máy MÌNH đang cầm nhận tin: kêu ngay trong tay, rõ, không 8D (far: máy trong ngăn kéo, trong giỏ thì nghẹt đi)
    notify(who = 'q', pan = 0, far = 0) {
      if (!this.ctx) return;
      const lp = this.filt('lowpass', 9000 - far * 6000), g = this.ctx.createGain(); g.gain.value = 1.5 * (1 - far * 0.35);
      lp.connect(g).connect(this.flat(pan, undefined, 0.15 + far * 0.4));
      this.bell(who, lp, this.ctx.currentTime + 0.01);
    },
    // Máy BÊN KIA cửa kêu (người ấy vừa đọc tin): 8D, lệch hẳn về phía cửa, xa, nghẹt hơn. far 0..1
    ting(pan = 0, far = 0.5, who = 't') {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + 0.01;
      if (Math.abs(pan) > 0.3) this.spot(1.3);
      const lp = this.filt('lowpass', 7200 - far * 4300), g = ctx.createGain(); g.gain.value = (who === 'q' ? 0.8 : 1.05) - far * 0.3;
      lp.connect(g).connect(this.panN(pan, undefined, 0.3 + far * 0.9));
      this.bell(who, lp, t);
    },
    // Bộ đệm dây gảy (Karplus–Strong), lưu theo cao độ
    ksBuf(f) {
      const ctx = this.ctx, sr = ctx.sampleRate; this._ks = this._ks || {};
      const key = Math.round(f);
      let buf = this._ks[key];
      if (!buf) {
        const len = Math.floor(sr * 3), N = Math.max(2, Math.round(sr / f));
        buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0);
        let prev = 0; for (let i = 0; i < N; i++) { prev = prev * 0.45 + (Math.random() * 2 - 1) * 0.55; d[i] = prev; }
        for (let i = N; i < len; i++) d[i] = 0.4993 * (d[i - N] + d[i - N + 1 < i ? i - N + 1 : i - N]);
        this._ks[key] = buf;
      }
      return buf;
    },
    // Một nốt dây gảy vào lúc when (giờ AudioContext), vào đích dest
    kp(f, when, vol, dest, lp = 3600, dur = 3) {
      const ctx = this.ctx, s = ctx.createBufferSource(), g = ctx.createGain(), l = this.filt('lowpass', lp);
      s.buffer = this.ksBuf(f); g.gain.value = vol; s.connect(l).connect(g).connect(dest); s.start(when, 0, dur);
    },
    // Gảy sợi chỉ (người chơi chạm vào): tiếng trong tay, không 8D
    ks(f, vol = 0.14, pan = 0) {
      if (!this.ctx) return;
      const p = this.flat(pan, undefined, 0.25);
      this.kp(f, this.ctx.currentTime, vol, p);
      // thân đàn: một nốt sine rất mỏng cho ấm
      this.tone('sine', f, vol * 0.18, 0.01, 1.6, 0, p);
    },
    // Tiếng thở run, sụt sịt rất khẽ, qua loa điện thoại (lọc dải hẹp)
    sob(vol = 0.05, pan = 0) {
      if (!this.ctx) return;
      const ctx = this.ctx, t0 = ctx.currentTime;
      const hp = this.filt('highpass', 380), lp = this.filt('lowpass', 2900), trem = ctx.createGain();
      hp.connect(lp).connect(trem).connect(this.flat(pan, this.bed, 0.15));
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 6.5; lg.gain.value = 0.35; trem.gain.value = 0.65;
      lfo.connect(lg).connect(trem.gain); lfo.start(t0); lfo.stop(t0 + 3.4);
      const burst = (t, dur, f0, f1, v) => {
        const s = ctx.createBufferSource(), b = this.filt('bandpass', f0, 1.1), g = ctx.createGain();
        b.frequency.setValueAtTime(f0, t); b.frequency.linearRampToValueAtTime(f1, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
        s.buffer = this.white; s.connect(b).connect(g).connect(hp); s.start(t, Math.random() * 3, dur + 0.05);
      };
      // ba nhịp hít vào bị nghẹn, rồi một hơi thở ra dài, run
      burst(t0, 0.15, 950, 1500, vol); burst(t0 + 0.21, 0.13, 1050, 1600, vol * 0.85); burst(t0 + 0.4, 0.24, 1150, 1800, vol * 1.1);
      burst(t0 + 0.95, 1.7, 820, 520, vol * 0.75);
    },
    // Còi xa, nghe qua tường (ở phòng em lúc 5 giờ): giống chuông báo thức lạ
    coiXa() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const g = ctx.createGain(), lp = this.filt('lowpass', 1000);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.5);
      g.gain.setValueAtTime(0.06, t + 3.0); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
      lp.connect(g).connect(this.flat(0.35, undefined, 1.3)); this.duck(0.35, 4.4);
      for (const [type, det] of [['sawtooth', 0], ['square', 7]]) {
        const o = ctx.createOscillator(); o.type = type; o.detune.value = det; const f = o.frequency;
        f.setValueAtTime(560, t);
        for (let k = 0; k < 2; k++) { f.linearRampToValueAtTime(1150, t + k * 1.6 + 0.8); f.linearRampToValueAtTime(600, t + k * 1.6 + 1.6); }
        const og = ctx.createGain(); og.gain.value = type === 'square' ? 0.3 : 0.6;
        o.connect(og).connect(lp); o.start(t); o.stop(t + 4.3);
      }
    },
    // Công tắc đèn: bấm xuống, nhả ra
    sw(pan = 0) { if (!this.ctx) return; const p = Math.abs(pan) > 0.6 ? this.panN(pan) : this.flat(pan); this.click(p, 0.09, 1700); setTimeout(() => this.click(p, 0.05, 2700), 60); },
    // Bước chân khẽ (đi qua cửa)
    steps(pan = 0, n = 3) {
      if (!this.ctx) return;
      const ctx = this.ctx, p = this.flat(pan);
      for (let i = 0; i < n; i++) {
        const t = ctx.currentTime + i * 0.34, s = ctx.createBufferSource(), b = this.filt('lowpass', 520), g = ctx.createGain();
        s.buffer = this.noise; this.env(g, t, 0.16, 0.01, 0.12); s.connect(b).connect(g).connect(p); s.start(t, Math.random() * 3, 0.2);
      }
    },
    // Cuộn chỉ về: tiếng sợi chỉ sượt, cao dần theo lượt kéo
    rasp(i = 0, pan = 0) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime, p = this.flat(pan), s = ctx.createBufferSource(), b = this.filt('bandpass', 2600 + i * 120, 2.2), g = ctx.createGain();
      s.buffer = this.white; this.env(g, t, 0.05, 0.01, 0.14); s.connect(b).connect(g).connect(p); s.start(t, Math.random() * 3, 0.2);
      this.tone('sine', 520 * Math.pow(2, (i % 7) / 12), 0.025, 0.004, 0.12, 0, p);
    },
    // Tin CHẠY TRONG SỢI CHỈ: tiếng 8D chính của chương. Hạt tin lăn lạch tạch trên sợi chỉ căng, sợi chỉ khẽ "hát" theo.
    // Đi đúng hướng hạt: từ v0 tới v1 trong dur giây (gửi: từ điện thoại → phía cửa → ra sau gáy; nhận: ngược lại).
    // Lạch tạch = nhiều tiếng gõ rất ngắn: thứ tai định vị chính xác nhất, nên nghe rõ đường đi hơn hẳn tiếng gió.
    // who: máy gửi (q nhịp thưa, trầm hơn; t nhịp dày, sáng hơn), cùng màu với chuông của máy ấy.
    chay(v0, v1, dur = 1.1, who = 'q', vol = 1) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime + 0.02, p = this.fly(v0, v1, dur + 0.05, undefined, 0.16, 0.85), sr = ctx.sampleRate;
      const n = Math.ceil((dur + 0.1) * sr), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0), rate = who === 'q' ? 26 : 36, L = Math.floor(0.005 * sr);
      for (let tt = 0.012; tt < dur - 0.01; tt += (0.75 + Math.random() * 0.5) / rate) {
        const i0 = Math.floor(tt * sr), env = Math.min(1, tt / 0.14, (dur - tt) / 0.2), a = (0.5 + Math.random() * 0.5) * env;
        for (let i = 0; i < L && i0 + i < n; i++) d[i0 + i] += (Math.random() * 2 - 1) * a * Math.exp(-i / (L * 0.22));
      }
      const s = ctx.createBufferSource(), bp = this.filt('bandpass', who === 'q' ? 2300 : 3300, 0.8), g = ctx.createGain();
      s.buffer = buf; g.gain.value = 0.25 * vol; s.connect(bp).connect(g).connect(p); s.start(t);
      // sợi chỉ "hát": một nốt mỏng (nốt đầu chuông của máy gửi), trượt xuống chút xíu khi chạy qua
      const f0 = who === 'q' ? 440 : 880, o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.setValueAtTime(f0 * 1.015, t); o.frequency.linearRampToValueAtTime(f0 * 0.985, t + dur);
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.026 * vol, t + 0.14); og.gain.setValueAtTime(0.026 * vol, t + Math.max(0.15, dur - 0.22)); og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(og).connect(p); o.start(t); o.stop(t + dur + 0.05);
      // hơi gió rất khẽ cho có thân
      const w = ctx.createBufferSource(), wb = this.filt('bandpass', 1100, 0.7), wg = ctx.createGain();
      w.buffer = this.white; wg.gain.setValueAtTime(0.0001, t); wg.gain.exponentialRampToValueAtTime(0.03 * vol, t + dur * 0.4); wg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      w.connect(wb).connect(wg).connect(p); w.start(t, Math.random() * 3, dur + 0.05);
      this.spot(dur + 0.2);
    },
    // Tin rời tay: từ điện thoại (pan) chạy ra phía cửa rồi ra sau gáy
    vut(pan = 0, i = 0, who = 'q', dur = 1.1) { const dir = pan < 0 ? -1 : 1; this.chay(pan * 0.25, dir * 1.4, dur, who, i ? 0.8 : 1); },
    // Tin tới: từ sau gáy phía cửa chạy về điện thoại trước mặt
    toi(pan = 0, who = 't', dur = 1.1) { const dir = pan < 0 ? -1 : 1; this.chay(dir * 1.5, pan * 0.2, dur, who); },
    // Tiếng trầm "phù" của một luồng gió lướt sát tai: dày nhất đúng lúc gần tai nhất (lúc at giây)
    body(p, t, at, dur, v) {
      const ctx = this.ctx, s = ctx.createBufferSource(), f = this.filt('lowpass', 220, 0.9), g = ctx.createGain();
      s.buffer = this.noise; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(p); s.start(t, Math.random() * 3, dur + 0.05);
    },
    // Đi qua cánh cửa sang nhà bên kia: tiếng gió đi từ tai phía cửa, vòng qua sau gáy, sang hẳn tai bên kia (xuyên qua đầu).
    qua(side = 1) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime, p = this.fly(side * 0.75, side * 3.1, 1.5, undefined, 0.2, 0.75);
      const s = ctx.createBufferSource(), b = this.filt('bandpass', 700, 0.8), g = ctx.createGain();
      b.frequency.setValueAtTime(450, t); b.frequency.exponentialRampToValueAtTime(1500, t + 0.7); b.frequency.exponentialRampToValueAtTime(600, t + 1.5);
      s.buffer = this.white; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.085, t + 0.35); g.gain.exponentialRampToValueAtTime(0.055, t + 1.0); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.55);
      s.connect(b).connect(g).connect(p); s.start(t, Math.random() * 3, 1.6);
      this.body(p, t, 0.75, 1.5, 0.13); this.spot(1.7);
    },
    // Chùm chìa khoá leng keng
    keys() {
      if (!this.ctx) return;
      for (let i = 0; i < 5; i++) this.tone('sine', 3000 + Math.random() * 2200, 0.03, 0.002, 0.12 + Math.random() * 0.1, i * 0.05 + Math.random() * 0.03, this.flat(0.5));
    },
    // Còi thổi ngắn ngoài sân (hết giờ nghỉ): hai hồi "tuýt" xa, run nhẹ
    huyt() {
      if (!this.ctx) return;
      const ctx = this.ctx, lp = this.filt('lowpass', 3200), g = ctx.createGain(); g.gain.value = 0.5;
      lp.connect(g).connect(this.flat(0.45, undefined, 1.2));
      [[0, 0.32], [0.5, 0.75]].forEach(([w, d]) => {
        const t = ctx.currentTime + w, o = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        o.frequency.value = 2300; lfo.frequency.value = 28; lg.gain.value = 70; lfo.connect(lg).connect(o.frequency);
        og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.05, t + 0.03); og.gain.setValueAtTime(0.05, t + d - 0.05); og.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(og).connect(lp); o.start(t); lfo.start(t); o.stop(t + d + 0.05); lfo.stop(t + d + 0.05);
      });
    },
    // Cắt phụt: mọi tiếng tắt ngay, ms sau mới mở lại loa (tiếng nền phải đặt lại)
    cut(ms = 1500) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.out.gain.cancelScheduledValues(t); this.out.gain.setValueAtTime(0, t);
      for (const k in this.amb) if (this.amb[k]) { this.amb[k].stop(); this.amb[k] = null; this.place[k] = null; }
      this.music.set(0); this.music.out.gain.cancelScheduledValues(t); this.music.out.gain.setValueAtTime(0.0001, t);
      setTimeout(() => { if (!this.muted) this.out.gain.setTargetAtTime(1, this.ctx.currentTime, 0.25); }, ms);
    },
    // Nhạc từ tệp (để sau này thêm nhạc thật, cắt bằng tools/trailer-music): tải một lần, phát có mờ vào / mờ ra
    tracks: {},
    async load(url) {
      if (!this.ctx) return null;
      if (!this.tracks[url]) this.tracks[url] = fetch(url).then((r) => r.arrayBuffer()).then((b) => new Promise((res, rej) => this.ctx.decodeAudioData(b, res, rej)));
      try { return await this.tracks[url]; } catch (e) { delete this.tracks[url]; return null; }
    },
    // Phát nhạc từ tệp. lp: lọc nghẹt (Hz, như nghe vọng qua sợi chỉ / điện thoại). Trả về lúc bắt đầu (giờ của performance.now, giây)
    // để game rơi hình đúng phách: vị trí s giây trong bài vang ra loa lúc start + (s - at).
    // when: giờ của AudioContext để vào nhạc (đúng một vạch nhịp của nhạc lồng); bỏ trống thì vào ngay.
    async track(url, { vol = 0.8, fade = 2, loop = false, at = 0, lp = 0, when = 0, v = null } = {}) {
      if (!this.ctx) return null;
      const buf = await this.load(url);
      if (!buf) return null;
      const ctx = this.ctx, s = ctx.createBufferSource(), g = ctx.createGain(), lead = 0.08, t = Math.max(when, ctx.currentTime + lead);
      s.buffer = buf; s.loop = loop; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.max(0.02, fade));
      let node = s;
      const f = lp ? this.filt('lowpass', lp, 0.8) : null;
      if (f) { node.connect(f); node = f; }
      // v: đặt nhạc trong không gian quanh đầu (chạy vòng được, kiểu nhạc 8D). Bỏ trống: phát thẳng như thường.
      const sp = v == null ? null : this.spat(v, this.out, 1.6, 0), mv = sp ? this.mover(sp, v) : null;
      node.connect(g).connect(sp || this.out); this.wet(g, lp ? 0.6 : 0.12);
      s.start(t, at);
      const start = performance.now() / 1000 + (t - ctx.currentTime) + (ctx.outputLatency || ctx.baseLatency || 0);
      return {
        start, at, gain: g, filter: f, mv,
        open: (sec = 1) => { if (f) f.frequency.setTargetAtTime(18000, ctx.currentTime, sec / 3); },
        // Dâng đều (tuyến tính) tới âm lượng v trong sec giây, lọc mở dần tới hz: cho một đoạn crescendo dài, không giật
        ramp: (v, sec, hz) => { const n = ctx.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), n); g.gain.linearRampToValueAtTime(v, n + sec);
          if (f && hz) { f.frequency.cancelScheduledValues(n); f.frequency.setValueAtTime(f.frequency.value, n); f.frequency.exponentialRampToValueAtTime(hz, n + sec); } },
        swell: (v, sec = 4) => { const n = ctx.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.setTargetAtTime(v, n, sec / 3); },
        stop: (fd = 2) => { const n = ctx.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.setTargetAtTime(0.0001, n, Math.max(0.005, fd / 4)); setTimeout(() => { try { s.stop(); } catch (e) { /* đã dừng */ } if (mv) mv.stop(); }, fd * 1000 + 200); },
      };
    },
    // Nhạc lồng: phát một bài theo danh sách đoạn [từ, tới] (giây trong tệp), nối liền mạch, chỗ nối nằm đúng vạch nhịp
    // nên tai không nghe ra. Đoạn cuối lặp mãi. Lọc nghẹt, nhỏ, như vọng từ xa: âm ỉ suốt cả chuyện.
    async long(url, segs, { vol = 0.1, lp = 900, fade = 3, v = null } = {}) {
      if (!this.ctx) return null;
      const buf = await this.load(url);
      if (!buf) return null;
      const ctx = this.ctx, f = this.filt('lowpass', lp, 0.7), g = ctx.createGain(), X = 0.02, plan = [], srcs = [];
      const sp = v == null ? null : this.spat(v, this.out, 1.6, 0), mv = sp ? this.mover(sp, v) : null;
      f.connect(g).connect(sp || this.out); this.wet(g, 0.45);
      const t0 = ctx.currentTime + 0.08;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.max(0.05, fade));
      let k = 0, when = t0, alive = true;
      const add = () => {
        const [a, b] = segs[k < segs.length ? k : 2 + ((k - segs.length) % Math.max(1, segs.length - 2))] || segs[segs.length - 1], first = k === 0; k++;
        const s = ctx.createBufferSource(), sg = ctx.createGain(); s.buffer = buf; s.connect(sg).connect(f);
        const st = first ? when : when - X, off = first ? a : Math.max(0, a - X), end = when + (b - a);
        if (first) sg.gain.setValueAtTime(1, st); else { sg.gain.setValueAtTime(0, st); sg.gain.linearRampToValueAtTime(1, when); }
        sg.gain.setValueAtTime(1, end - X); sg.gain.linearRampToValueAtTime(0, end);
        s.start(st, off, end - st + 0.01);
        plan.push({ W: when, a, b }); srcs.push(s); if (plan.length > 6) { plan.shift(); srcs.shift(); }
        when = end;
      };
      const tick = () => { if (!alive) return; while (when < ctx.currentTime + 2.5) add(); };
      tick(); const iv = setInterval(tick, 300);
      const lat = () => ctx.outputLatency || ctx.baseLatency || 0;
      const pos = (ct) => { for (const e of plan) if (ct >= e.W && ct < e.W + (e.b - e.a)) return e.a + (ct - e.W); return -1; };
      return {
        mv,
        pos: () => pos(ctx.currentTime - lat()),
        posAt: (ct) => pos(ct),
        get vol() { return g.gain.value; }, get hz() { return f.frequency.value; },
        // Vạch nhịp kế tiếp (lưới: g0 + n·bar, giây trong bài), sau ít nhất ahead giây: trả về giờ AudioContext
        nextBar(g0, bar, ahead = 0.3) {
          const ct = ctx.currentTime + ahead, p = pos(ct);
          if (p < 0) return ct;
          const n = Math.ceil((p - g0) / bar - 1e-4);
          return ct + (g0 + n * bar - p);
        },
        set(v, hz, sec = 2) { const n = ctx.currentTime; g.gain.setTargetAtTime(Math.max(0.0001, v), n, sec / 3); f.frequency.setTargetAtTime(hz, n, sec / 3); },
        stop(fd = 2, at = 0) {
          const n = Math.max(ctx.currentTime, at); g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0.0001, n, Math.max(0.005, fd / 4));
          setTimeout(() => { alive = false; clearInterval(iv); if (mv) mv.stop(); for (const s of srcs) { try { s.stop(); } catch (e) { /* đã dừng */ } } }, (n - ctx.currentTime + fd) * 1000 + 400);
        },
      };
    },
  };

  window.SoiChiAm = A;
})();
