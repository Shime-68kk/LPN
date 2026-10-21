// Sâu Tím — game nhịp điệu: bé sâu ăn lá theo nhạc, lớn dần rồi hoá bướm.
'use strict';
(() => {
  // ================= Tiện ích =================
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOutBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
  const params = new URLSearchParams(location.search);
  const BOT = params.get('bot') === '1';
  const DEBUG = params.get('debug') === '1';
  const REDUCED_MOTION = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PATH_STAR = 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5l-5.3 2.9 1.2-6-4.5-4.1 6-.7z';
  const PATH_HEART = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z';
  const PATH_PLAY = 'M8 5v14l11-7z';
  let touched = false;
  const buzz = (ms) => { if (touched && navigator.vibrate) navigator.vibrate(ms); };
  document.addEventListener('pointerdown', () => { touched = true; }, { capture: true, passive: true });

  function svgIcon(d, cls) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    if (cls) s.setAttribute('class', cls);
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
    return s;
  }

  // ================= Lưu trữ =================
  const Store = {
    data: { best: {}, sfx: true, hintSeen: false, diff: 1, eatVol: 70 },
    load() {
      try {
        const raw = localStorage.getItem('sautim:v1');
        if (raw) Object.assign(this.data, JSON.parse(raw));
      } catch (e) { /* chế độ riêng tư: bỏ qua */ }
    },
    save() {
      try { localStorage.setItem('sautim:v1', JSON.stringify(this.data)); } catch (e) { /* bỏ qua */ }
      if (window.Sync) window.Sync.dirty();
    },
  };
  Store.load();

  // ================= Bầu trời theo thời tiết =================
  const THEMES = {
    binhminh: { sky: '#FFE3D3', sun: '#FFC46B', cloud: '#FFFFFF', mote: ['#FFFFFF', '#FFE3B3'], leaf: '#62BC7C', leafLight: '#8FD6A0', leafDark: '#3D8A57', stem: '#4E8F5E' },
    nang: { sky: '#BFE4FF', sun: '#FFE48A', cloud: '#FFFFFF', mote: ['#FFFFFF', '#FFD3DC'], leaf: '#62BC7C', leafLight: '#8FD6A0', leafDark: '#3D8A57', stem: '#4E8F5E' },
    may: { sky: '#D5DBE9', sun: null, cloud: '#F6F7FB', mote: ['#FFFFFF', '#E6E9F2'], leaf: '#62B07A', leafLight: '#8CCB9C', leafDark: '#3D7F55', stem: '#4E855C' },
    mua: { sky: '#8D9AB5', sun: null, cloud: '#76829E', mote: null, rain: true, leaf: '#5DAF78', leafLight: '#86CC9A', leafDark: '#3A7A52', stem: '#467A57' },
    hoanghon: { sky: '#FFB996', sun: '#FF8E7A', cloud: '#FFD8C4', mote: ['#FFE7D6', '#FFC0CB'], leaf: '#5DB37A', leafLight: '#8BD09E', leafDark: '#3A8253', stem: '#4C8A5B' },
    dem: { sky: '#29224E', moon: true, cloud: '#3D3670', mote: null, stars: true, night: true, leaf: '#58B276', leafLight: '#86D29C', leafDark: '#2F7349', stem: '#3F7A52' },
  };
  function pickWeather() {
    const q = params.get('weather');
    if (THEMES[q]) return q;
    // Trang chủ lưu kiểu trời thật (Open-Meteo); dùng nếu còn mới trong 1 giờ.
    try {
      const s = JSON.parse(localStorage.getItem('lpn:sky'));
      if (s && THEMES[s.sky] && Date.now() - s.at < 3600e3) return s.sky;
    } catch (e) { /* bỏ qua */ }
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    if (h >= 18.5 || h < 5.5) return 'dem';
    if (h < 6.5) return 'binhminh';
    if (h >= 17) return 'hoanghon';
    return 'nang';
  }
  const weather = pickWeather();
  // Màu trời, lá, cành đang dùng: theo thời tiết thật, hoặc theo nền mua ở Tiệm Sâu.
  let T = THEMES[weather];

  // ================= Đồ đang mặc (Tiệm Sâu) =================
  // Skin chỉ đổi hình, không đổi cách chơi hay điểm.
  const LOOK = {};
  function loadLook() {
    const eq = window.Wallet ? Wallet.equipped() : {};
    LOOK.skin = Skins.get('skin', eq.skin);
    LOOK.fx = Skins.get('fx', eq.fx);
    LOOK.wing = Skins.get('wing', eq.wing);
    LOOK.bg = Skins.get('bg', eq.bg);
    // Nền riêng (Sa Pa, Lâu Đài Bí Ngô…) đổi luôn màu lá, cành; nền Lâu Đài thì lá hoá màu bí ngô.
    const bg = LOOK.bg.bg || {};
    T = Object.assign({}, THEMES[weather], bg.theme || {});
    const top = Skins.backdropTop ? Skins.backdropTop(LOOK.bg, weather === 'dem') : null;
    if (top) T.sky = top;
    document.body.classList.toggle('night', !!T.night);
    document.body.style.background = T.sky;
  }
  loadLook();

  // ================= Âm thanh (Web Audio) =================
  const Sound = {
    ctx: null, master: null, music: null, sfx: null, noiseBuf: null,
    cache: new Map(), voices: [], preview: null, root: 0,

    ensure() {
      if (this.ctx) return this.ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      // iOS: phát cả khi bật chế độ im lặng (Safari 16.4+).
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* bỏ qua */ }
      const ctx = new AC({ latencyHint: 'interactive' });
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      comp.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.connect(comp);
      this.music = ctx.createGain();
      this.music.gain.value = 0.9;
      this.music.connect(this.master);
      this.sfx = ctx.createGain();
      this.sfx.gain.value = Store.data.sfx ? 0.5 : 0;
      this.sfx.connect(this.master);
      // Riêng tiếng ăn lá có nút chỉnh to nhỏ; 70% là mức mặc định.
      this.eatBus = ctx.createGain();
      this.eatBus.gain.value = Store.data.eatVol / 70;
      this.eatBus.connect(this.sfx);
      const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
      const ch = nb.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      this.noiseBuf = nb;
      this.ctx = ctx;
      ctx.onstatechange = () => {
        if (ctx.state !== 'running' && Game.state === 'play') Game.pause();
      };
      return ctx;
    },

    // Phải gọi trong sự kiện chạm của người dùng (iOS).
    unlock() {
      const ctx = this.ensure();
      if (ctx.state !== 'running') ctx.resume();
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(ctx.destination);
      s.start(0);
    },

    setSfx(on) {
      if (this.sfx) this.sfx.gain.value = on ? 0.5 : 0;
    },
    setEatVol(v) {
      if (this.eatBus) this.eatBus.gain.value = v / 70;
    },

    async load(url, onProgress) {
      if (this.cache.has(url)) { onProgress(1); return this.cache.get(url); }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không tải được nhạc (' + res.status + ')');
      const total = Number(res.headers.get('content-length')) || 0;
      let ab;
      if (res.body && res.body.getReader && total) {
        const reader = res.body.getReader();
        const buf = new Uint8Array(total);
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (got + value.length > buf.length) break;
          buf.set(value, got);
          got += value.length;
          onProgress((got / total) * 0.85);
        }
        ab = buf.buffer.slice(0, got);
      } else {
        ab = await res.arrayBuffer();
      }
      onProgress(0.9);
      const audio = await new Promise((resolve, reject) => {
        const p = this.ctx.decodeAudioData(ab, resolve, reject);
        if (p && p.then) p.then(resolve, reject);
      });
      if (this.cache.size >= 2) this.cache.delete(this.cache.keys().next().value);
      this.cache.set(url, audio);
      onProgress(1);
      return audio;
    },

    // Phát một vòng của đoạn nhạc tại thời điểm `when` (đồng hồ audio), có thể tăng tốc.
    playSection(buffer, offset, duration, when, rate, fadeIn) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      src.connect(g);
      g.connect(this.music);
      const wall = duration / rate;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(1, when + fadeIn);
      g.gain.setValueAtTime(1, when + Math.max(fadeIn + 0.05, wall - 1.4));
      g.gain.linearRampToValueAtTime(0, when + wall);
      src.start(when, offset);
      src.stop(when + wall + 0.05);
      const now = ctx.currentTime;
      this.voices = this.voices.filter((v) => v.end > now);
      this.voices.push({ src, g, end: when + wall + 0.05 });
    },

    // Safari cũ ném lỗi khi gọi stop() lần hai, nên tắt tiếng bằng gain rồi ngắt kết nối.
    fadeOutMusic(sec) {
      const t = this.ctx.currentTime;
      for (const v of this.voices) {
        const gp = v.g.gain;
        gp.cancelScheduledValues(t);
        gp.setValueAtTime(gp.value, t);
        gp.linearRampToValueAtTime(0, t + sec);
        setTimeout(() => v.g.disconnect(), sec * 1000 + 100);
      }
      this.voices = [];
    },

    stopMusic() {
      for (const v of this.voices) {
        v.g.disconnect();
        try { v.src.stop(); } catch (e) { /* đã hẹn giờ dừng */ }
      }
      this.voices = [];
      this.stopPreview(0);
    },

    // Nghe thử ở menu: vào/ra nhỏ dần cho êm.
    playPreview(buffer, offset, duration) {
      this.stopPreview(0.1);
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const g = ctx.createGain();
      src.connect(g);
      g.connect(this.music);
      const t = ctx.currentTime + 0.05;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + 0.5);
      g.gain.setValueAtTime(1, t + Math.max(0.6, duration - 1.2));
      g.gain.linearRampToValueAtTime(0, t + duration);
      src.start(t, offset);
      src.stop(t + duration + 0.05);
      this.preview = { src, g };
    },

    stopPreview(sec) {
      const p = this.preview;
      if (!p) return;
      this.preview = null;
      if (!sec) { p.g.disconnect(); return; }
      const t = this.ctx.currentTime;
      p.g.gain.cancelScheduledValues(t);
      p.g.gain.setValueAtTime(p.g.gain.value, t);
      p.g.gain.linearRampToValueAtTime(0, t + sec);
      setTimeout(() => p.g.disconnect(), sec * 1000 + 100);
    },

    // Thời điểm âm thanh đang thực sự phát ra loa (đã trừ độ trễ).
    now() {
      const ctx = this.ctx;
      if (ctx.getOutputTimestamp) {
        const ts = ctx.getOutputTimestamp();
        if (ts && ts.contextTime > 0 && ts.performanceTime > 0) {
          const est = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
          // Safari cũ (iOS 16) trả performanceTime sai mốc: chỉ tin khi gần currentTime.
          if (Math.abs(est - ctx.currentTime) < 0.5) { this.clockSrc = 'output'; return est; }
        }
      }
      this.clockSrc = 'current';
      return ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0);
    },

    freq(step) {
      const P = [0, 2, 4, 7, 9];
      const r = ((this.root + 6) % 12) - 6;
      return 261.63 * Math.pow(2, (r + Math.floor(step / 5) * 12 + P[step % 5]) / 12);
    },

    tone(f, dur, type, vol, slide, delay, bus) {
      const ctx = this.ctx;
      if (!ctx || !Store.data.sfx) return;
      const t = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(bus || this.sfx);
      o.start(t);
      o.stop(t + dur + 0.02);
    },

    noise(dur, f, q, vol, delay, bus) {
      const ctx = this.ctx;
      if (!ctx || !Store.data.sfx) return;
      const t = ctx.currentTime + (delay || 0);
      const s = ctx.createBufferSource();
      s.buffer = this.noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(bp);
      bp.connect(g);
      g.connect(bus || this.sfx);
      s.start(t, Math.random() * 0.4, dur + 0.02);
    },

    eat(step, perfect) {
      const f = this.freq(5 + (step % 8));
      const bus = this.eatBus;
      this.tone(f, 0.12, 'sine', 1.05, f * 0.7, 0, bus);
      this.tone(f * 1.5, 0.05, 'triangle', 0.22, null, 0, bus);
      this.noise(0.05, 1900, 0.9, 0.34, 0, bus);
      if (perfect) this.tone(f * 2, 0.18, 'sine', 0.26, null, 0.035, bus);
    },

    // Mỗi miếng cắn trên cành dài: tiếng ăn lá bình thường, cao dần theo đoạn đã ăn.
    bite(progress) {
      const step = 5 + Math.round(clamp(progress, 0, 1) * 7);
      const f = this.freq(step);
      const bus = this.eatBus;
      this.tone(f, 0.09, 'sine', 0.85, f * 0.8, 0, bus);
      this.tone(f * 2, 0.04, 'triangle', 0.14, null, 0, bus);
      this.noise(0.035, 1700 + Math.random() * 600, 1.2, 0.26, 0, bus);
    },
    miss() {
      this.tone(200, 0.26, 'triangle', 0.32, 105);
      this.noise(0.09, 420, 0.8, 0.16);
    },
    arp(steps, gap, type, vol, dur) {
      steps.forEach((s, i) => this.tone(this.freq(s), dur || 0.3, type || 'triangle', vol || 0.18, null, i * gap));
    },
    milestone() { this.arp([5, 7, 9], 0.07, 'triangle', 0.16, 0.25); },
    record() { this.arp([5, 7, 9, 10, 12], 0.06, 'triangle', 0.2, 0.3); },
    heart() { this.arp([7, 9, 10, 12], 0.06, 'sine', 0.18, 0.3); },
    butterfly() { this.arp([5, 6, 7, 8, 9, 10, 12], 0.085, 'sine', 0.2, 0.6); },
    lose() { this.arp([9, 7, 6, 5], 0.16, 'triangle', 0.16, 0.4); },
    starTing() { this.tone(this.freq(12), 0.25, 'sine', 0.14); },
    star() {
      this.arp([9, 11, 12, 14], 0.06, 'triangle', 0.2, 0.35);
      this.tone(this.freq(15), 0.6, 'sine', 0.12, null, 0.24);
    },
    speedUp() {
      this.tone(320, 0.35, 'triangle', 0.14, 960);
      this.arp([5, 7, 9, 12], 0.05, 'square', 0.05, 0.15);
    },
    click() { this.tone(1100, 0.04, 'sine', 0.12, 760); },
  };

  // ================= Canvas & kích thước =================
  const canvas = $('stage');
  const g = canvas.getContext('2d', { alpha: false });
  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  let PW = 0, PX0 = 0, S = 1;
  let HEAD_R = 21, SEG_R = 17, SEG_GAP = 24, LEAF_H = 22, CATCH_R = 42, PERFECT_R = 16;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    PW = Math.min(W, H * 0.62, 520);
    PX0 = (W - PW) / 2;
    S = PW / 390;
    HEAD_R = 21 * S;
    SEG_R = 16.5 * S;
    SEG_GAP = 23 * S;
    LEAF_H = 28 * S;
    CATCH_R = 46 * S;
    PERFECT_R = 17 * S;
    buildSprites();
    Sau.headX = clamp(Sau.headX || W / 2, PX0 + 20 * S, PX0 + PW - 20 * S);
    Sau.target = Sau.headX;
    initAmbient();
  }

  // ================= Sprite vẽ sẵn =================
  const SPR = {};
  function makeSprite(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * DPR);
    c.height = Math.ceil(h * DPR);
    const x = c.getContext('2d');
    x.scale(DPR, DPR);
    draw(x, w, h);
    return c;
  }
  function leafPath(x, h, w) {
    x.beginPath();
    x.moveTo(0, -h);
    x.bezierCurveTo(w, -h * 0.5, w, h * 0.45, 0, h);
    x.bezierCurveTo(-w, h * 0.45, -w, -h * 0.5, 0, -h);
    x.closePath();
  }
  function buildSprites() {
    const h = LEAF_H, w = h * 0.68, pad = 4 * S;
    SPR.leafW = w * 2 + pad * 2;
    SPR.leafH = h * 2 + pad * 2 + 6 * S;
    SPR.leaf = makeSprite(SPR.leafW, SPR.leafH, (x) => {
      x.translate(SPR.leafW / 2, pad + h);
      x.strokeStyle = T.stem;
      x.lineCap = 'round';
      x.lineWidth = 2.4 * S;
      x.beginPath(); x.moveTo(0, h * 0.9); x.lineTo(0, h + 5 * S); x.stroke();
      leafPath(x, h, w);
      x.fillStyle = T.leaf;
      x.fill();
      x.beginPath();
      x.moveTo(0, -h);
      x.bezierCurveTo(w, -h * 0.5, w, h * 0.45, 0, h);
      x.closePath();
      x.fillStyle = T.leafLight;
      x.fill();
      x.strokeStyle = T.leafDark;
      x.lineWidth = 1.5 * S;
      x.beginPath(); x.moveTo(0, h * 0.85); x.lineTo(0, -h * 0.55); x.stroke();
      x.lineWidth = 1.2 * S;
      for (let i = 0; i < 3; i++) {
        const y = h * 0.45 - i * h * 0.4;
        x.beginPath(); x.moveTo(0, y); x.lineTo(-w * 0.45, y - h * 0.22); x.stroke();
        x.beginPath(); x.moveTo(0, y); x.lineTo(w * 0.45, y - h * 0.22); x.stroke();
      }
    });
    SPR.leafCY = pad + h;

    const r = SEG_R, sp = r + 6 * S;
    const seg = (variant) => makeSprite(sp * 2, sp * 2, (x) => {
      x.translate(sp, sp);
      Skins.drawSegment(x, r, LOOK.skin, variant, S);
    });
    SPR.segSize = sp * 2;
    SPR.seg = [seg(0), seg(1), seg(2)];

    const cloud = (scale) => makeSprite(150 * S * scale, 60 * S * scale, (x) => {
      x.scale(S * scale, S * scale);
      x.fillStyle = T.cloud;
      x.beginPath();
      x.arc(40, 38, 20, 0, Math.PI * 2);
      x.arc(70, 28, 26, 0, Math.PI * 2);
      x.arc(102, 38, 20, 0, Math.PI * 2);
      x.fill();
      x.fillRect(40, 38, 62, 20);
      x.beginPath(); x.arc(40, 48, 10, 0, Math.PI * 2); x.arc(102, 48, 10, 0, Math.PI * 2); x.fill();
    });
    SPR.cloud = [cloud(1), cloud(0.7)];

    SPR.starSize = 46 * S;
    SPR.star = makeSprite(SPR.starSize, SPR.starSize, (x) => {
      x.translate(SPR.starSize / 2, SPR.starSize / 2 + 1.5 * S);
      x.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? 9 * S : 20 * S;
        x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      x.closePath();
      x.fillStyle = '#FFC24B';
      x.fill();
      x.lineJoin = 'round';
      x.lineWidth = 2.2 * S;
      x.strokeStyle = '#E8962A';
      x.stroke();
      x.fillStyle = '#5A3A1A';
      x.beginPath(); x.arc(-4 * S, 0, 1.7 * S, 0, Math.PI * 2); x.arc(4 * S, 0, 1.7 * S, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,111,142,0.6)';
      x.beginPath(); x.arc(-7 * S, 3.5 * S, 2 * S, 0, Math.PI * 2); x.arc(7 * S, 3.5 * S, 2 * S, 0, Math.PI * 2); x.fill();
    });
  }

  // ================= Khung cảnh nền =================
  const ambient = { clouds: [], motes: [], stars: [], rain: [] };
  function initAmbient() {
    ambient.clouds = [];
    for (let i = 0; i < 4; i++) {
      ambient.clouds.push({ x: Math.random() * W, y: (i / 4) * H + Math.random() * 60, k: i % 2, drift: 6 + Math.random() * 8 });
    }
    ambient.motes = [];
    if (T.mote) {
      for (let i = 0; i < 16; i++) {
        ambient.motes.push({ x: Math.random() * W, y: Math.random() * H, r: (1.5 + Math.random() * 2.2) * S, ph: Math.random() * 6, c: T.mote[i % 2] });
      }
    }
    ambient.stars = [];
    if (T.stars) {
      for (let i = 0; i < 46; i++) {
        ambient.stars.push({ x: Math.random() * W, y: Math.random() * H, r: (0.7 + Math.random() * 1.4) * S, ph: Math.random() * 6 });
      }
    }
    ambient.rain = [];
    if (T.rain) {
      for (let i = 0; i < 42; i++) ambient.rain.push({ x: Math.random() * W, y: Math.random() * H, l: (10 + Math.random() * 10) * S });
    }
  }

  const BGST = {}; // trạng thái của nền riêng (ảnh vẽ sẵn, mây, dơi)
  function drawBackground(dt, speed, pulse) {
    if (LOOK.bg.bg && LOOK.bg.bg.kind !== 'weather') {
      Skins.drawBackdrop(g, LOOK.bg, { W, H, t: clock, dt, speed, dpr: DPR, night: weather === 'dem', st: BGST });
      return;
    }
    g.fillStyle = T.sky;
    g.fillRect(0, 0, W, H);
    if (T.sun) {
      g.fillStyle = '#FFFFFF';
      g.globalAlpha = 0.35;
      g.beginPath(); g.arc(W - 70 * S, 96 * S, 64 * S, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      g.fillStyle = T.sun;
      g.beginPath(); g.arc(W - 70 * S, 96 * S, 40 * S, 0, Math.PI * 2); g.fill();
    }
    if (T.moon) {
      g.fillStyle = '#FFF1C9';
      g.beginPath(); g.arc(W - 70 * S, 96 * S, 30 * S, 0, Math.PI * 2); g.fill();
      g.fillStyle = T.sky;
      g.beginPath(); g.arc(W - 56 * S, 86 * S, 26 * S, 0, Math.PI * 2); g.fill();
    }
    if (ambient.stars.length) {
      g.fillStyle = '#FFF4D6';
      for (const s of ambient.stars) {
        s.y += speed * 0.03 * dt;
        if (s.y > H + 4) { s.y = -4; s.x = Math.random() * W; }
        g.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(clock * 1.3 + s.ph));
        g.fillRect(s.x, s.y, s.r * 2, s.r * 2);
      }
      g.globalAlpha = 1;
    }
    for (const c of ambient.clouds) {
      const spr = SPR.cloud[c.k];
      c.y += speed * (c.k ? 0.05 : 0.08) * dt;
      c.x += c.drift * dt;
      if (c.y > H + 20) { c.y = -spr.height / DPR - Math.random() * 120; c.x = Math.random() * W - 60; }
      if (c.x > W + 20) c.x = -spr.width / DPR;
      g.globalAlpha = T.night ? 0.55 : 0.9;
      g.drawImage(spr, c.x, c.y, spr.width / DPR, spr.height / DPR);
    }
    g.globalAlpha = 1;
    for (const m of ambient.motes) {
      m.y += speed * 0.16 * dt;
      m.ph += dt;
      if (m.y > H + 6) { m.y = -6; m.x = Math.random() * W; }
      g.fillStyle = m.c;
      g.globalAlpha = 0.75;
      g.beginPath(); g.arc(m.x + Math.sin(m.ph * 1.6) * 8 * S, m.y, m.r, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    if (ambient.rain.length) {
      g.strokeStyle = 'rgba(228,236,248,0.6)';
      g.lineWidth = 1.6 * S;
      g.lineCap = 'round';
      g.beginPath();
      for (const r of ambient.rain) {
        r.y += (speed * 1.4 + 520 * S) * dt;
        r.x -= 90 * S * dt;
        if (r.y > H + 20) { r.y = -20; r.x = Math.random() * (W + 80); }
        g.moveTo(r.x, r.y);
        g.lineTo(r.x - r.l * 0.25, r.y + r.l);
      }
      g.stroke();
    }
  }

  // ================= Hạt hiệu ứng =================
  const PART_MAX = 180;
  const parts = [];
  for (let i = 0; i < PART_MAX; i++) parts.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1, kind: 0, color: '', rot: 0, vr: 0 });
  let partCursor = 0;
  function spawn(kind, x, y, vx, vy, life, size, color) {
    for (let n = 0; n < PART_MAX; n++) {
      const p = parts[partCursor];
      partCursor = (partCursor + 1) % PART_MAX;
      if (!p.on) {
        p.on = true; p.kind = kind; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.life = life; p.max = life; p.size = size; p.color = color;
        p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 10;
        return p;
      }
    }
    return null;
  }
  function burstCrumbs(x, y, n) {
    for (const q of Skins.eatBurst(LOOK.fx, n, S, [T.leafLight, T.leaf])) spawn(q.kind, x, y, q.vx, q.vy, q.life, q.size, q.color);
  }
  function burstHearts(x, y, n) {
    for (let i = 0; i < n; i++) {
      spawn(1, x + (Math.random() - 0.5) * 30 * S, y, (Math.random() - 0.5) * 50 * S, -(60 + Math.random() * 60) * S, 0.9 + Math.random() * 0.4, (5 + Math.random() * 3) * S, i % 2 ? '#FF8FA3' : '#FF6F8E');
    }
  }
  function burstSparks(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (60 + Math.random() * 200) * S;
      spawn(2, x, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.5 + Math.random() * 0.5, (2 + Math.random() * 2.5) * S, color || '#FFF1C9');
    }
  }
  function ring(x, y, color) { spawn(3, x, y, 0, 0, 0.4, 10 * S, color || '#FFFFFF'); }

  function updateParticles(dt) {
    for (const p of parts) {
      if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) { p.on = false; continue; }
      Skins.stepParticle(p, dt, S);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
  function drawParticles() {
    for (const p of parts) if (p.on) Skins.drawParticle(g, p, S);
    g.globalAlpha = 1;
  }

  const GOLD = () => (T.night ? '#FFC24B' : '#D9831A');
  const PINK = () => (T.night ? '#FFB0C0' : '#C23A5C');
  const POP_LIFE = 0.8;
  const popups = [];
  for (let i = 0; i < 28; i++) popups.push({ on: false, text: '', x: 0, y: 0, vx: 0, life: 0, color: '', size: 15 });
  let popCursor = 0;
  // Chữ điểm nổi lên: phóng to rồi nảy về cỡ thường, bay lên và mờ dần.
  function popup(text, x, y, color, size, vx) {
    const p = popups[popCursor];
    popCursor = (popCursor + 1) % popups.length;
    p.on = true; p.text = text; p.x = clamp(x, PX0 + 34 * S, PX0 + PW - 34 * S); p.y = y; p.vx = vx || 0;
    p.life = POP_LIFE; p.color = color; p.size = size || 15;
  }
  function popScale(age) {
    if (age < 0.12) return lerp(0.3, 1.3, age / 0.12);
    if (age < 0.26) return lerp(1.3, 1, (age - 0.12) / 0.14);
    return 1;
  }
  function drawPopText(text, x, y, size, scale, color) {
    g.save();
    g.translate(x, y);
    g.scale(scale, scale);
    g.font = `800 ${Math.round(size * S)}px "Be Vietnam Pro", system-ui, sans-serif`;
    g.lineJoin = 'round';
    g.lineWidth = 4 * S;
    g.strokeStyle = T.night ? 'rgba(29,24,50,0.85)' : 'rgba(255,255,255,0.9)';
    g.strokeText(text, 0, 0);
    g.fillStyle = color;
    g.fillText(text, 0, 0);
    g.restore();
  }
  function drawPopups(dt) {
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const p of popups) {
      if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) { p.on = false; continue; }
      const age = POP_LIFE - p.life;
      p.y -= 70 * S * dt;
      p.x += p.vx * dt;
      g.globalAlpha = Math.min(1, p.life * 3.5);
      drawPopText(p.text, p.x, p.y, p.size, popScale(age), p.color);
    }
    g.globalAlpha = 1;
    // Bong bóng tổng điểm khi đang ăn cành lá dài.
    const h = Game.holds[0];
    if (h && h.total) {
      const bx = clamp(Sau.headX, PX0 + 48 * S, PX0 + PW - 48 * S);
      drawPopText('+' + h.total.toLocaleString('vi-VN'), bx, Sau.headY - HEAD_R * 4, 22, 1 + 0.35 * (h.bounce || 0), GOLD());
    }
    g.textBaseline = 'alphabetic';
  }

  // ================= Bé sâu =================
  const TRAIL_N = 512;
  const Sau = {
    headX: 0, target: 0, vx: 0, headY: 0, segs: 4,
    trailT: new Float64Array(TRAIL_N), trailX: new Float32Array(TRAIL_N), trailI: 0, trailCount: 0,
    mouthOpen: 0, chew: 0, happy: 0, sad: 0, blink: 0, nextBlink: 2, ant: 0, gulps: [],
    mood: 'idle',

    record(t) {
      this.trailI = (this.trailI + 1) % TRAIL_N;
      this.trailT[this.trailI] = t;
      this.trailX[this.trailI] = this.headX;
      if (this.trailCount < TRAIL_N) this.trailCount++;
    },
    resetTrail(t) {
      this.trailCount = 0;
      this.record(t);
    },
    gulp() {
      this.gulps.push(clock);
      if (this.gulps.length > 4) this.gulps.shift();
    },
  };

  function updateSau(dt, speed, pulse) {
    const prev = Sau.headX;
    Sau.headX += (Sau.target - Sau.headX) * (1 - Math.exp(-dt * 26));
    Sau.vx = lerp(Sau.vx, (Sau.headX - prev) / Math.max(dt, 1e-4), 1 - Math.exp(-dt * 12));
    Sau.ant = lerp(Sau.ant, clamp(-Sau.vx * 0.012, -9 * S, 9 * S), 1 - Math.exp(-dt * 9));
    Sau.chew = Math.max(0, Sau.chew - dt);
    Sau.happy = Math.max(0, Sau.happy - dt);
    Sau.sad = Math.max(0, Sau.sad - dt);
    Sau.nextBlink -= dt;
    if (Sau.nextBlink <= 0) { Sau.blink = 0.12; Sau.nextBlink = 2 + Math.random() * 3; }
    Sau.blink = Math.max(0, Sau.blink - dt);
    Sau.record(clock);
  }

  function drawSau(speed, pulse, collapse) {
    const hx = Sau.headX, hy = Sau.headY;
    // Thân bò theo đúng đường đầu đã đi: đi ngược lịch sử di chuyển (điểm cũ trôi xuống
    // theo tốc độ lá rơi) và đặt mỗi đốt cách nhau một khoảng cố định, nên thân luôn liền.
    const xs = drawSau.xs || (drawSau.xs = new Float32Array(401));
    const ys = drawSau.ys || (drawSau.ys = new Float32Array(401));
    const maxSeg = Math.min(Sau.segs, 400);
    const bottom = H + SEG_R * 2;
    let px = hx, py = hy, need = SEG_GAP, k = 1;
    for (let n = 1; n < Sau.trailCount && k <= maxSeg && py < bottom; n++) {
      const idx = (Sau.trailI - n + TRAIL_N) % TRAIL_N;
      const qx = Sau.trailX[idx], qy = hy + (clock - Sau.trailT[idx]) * speed;
      let dx = qx - px, dy = qy - py, len = Math.hypot(dx, dy);
      while (len >= need && k <= maxSeg) {
        px += (dx * need) / len;
        py += (dy * need) / len;
        xs[k] = px; ys[k] = py; k++;
        dx = qx - px; dy = qy - py; len = Math.hypot(dx, dy);
        need = SEG_GAP;
      }
      need -= len;
      px = qx; py = qy;
    }
    while (k <= maxSeg && py < bottom) { py += SEG_GAP; xs[k] = px; ys[k] = py; k++; }
    const visible = k - 1;
    const size = SPR.segSize;
    for (let k = visible; k >= 1; k--) {
      const fromTail = Sau.segs - k;
      let sc = fromTail >= 3 ? 1 : 0.64 + fromTail * 0.12;
      for (const gt of Sau.gulps) {
        const pos = (clock - gt) * 26;
        const d = k - pos;
        if (d > -2 && d < 2) sc += 0.2 * Math.exp(-d * d);
      }
      let x = xs[k] + Math.sin(clock * 7 - k * 0.55) * (1.4 + pulse * 1.4) * S;
      let y = ys[k];
      if (collapse > 0) {
        x = lerp(x, hx, collapse);
        y = lerp(y, hy, collapse);
        sc *= 1 - collapse * 0.6;
      }
      const spr = SPR.seg[k % 5 === 0 ? 2 : k % 2];
      const s = size * sc;
      g.drawImage(spr, x - s / 2, y - s / 2, s, s);
    }
    drawHead(hx, hy, pulse);
  }

  function drawHead(hx, hy, pulse) {
    const r = HEAD_R * (1 + (Sau.chew > 0 ? Math.sin(Sau.chew * 50) * 0.05 : 0));
    const tilt = clamp(Sau.vx / (PW * 4), -0.3, 0.3);
    g.save();
    g.translate(hx, hy);
    g.rotate(tilt);
    Skins.drawHead(g, r, LOOK.skin, {
      t: clock, ant: Sau.ant, bob: pulse, happy: Sau.happy, blink: Sau.blink, sad: Sau.sad, chew: Sau.chew, mouthOpen: Sau.mouthOpen,
    }, S);
    g.restore();
  }

  function drawCocoon(x, y, sc, wobble, glow) {
    g.save();
    g.translate(x, y);
    g.rotate(wobble);
    g.scale(sc, sc);
    Skins.drawCocoon(g, LOOK.skin, S, glow, T.night);
    g.restore();
  }

  function drawButterfly(x, y, sc, t) {
    g.save();
    g.translate(x, y);
    g.scale(sc, sc);
    Skins.drawButterfly(g, LOOK.wing, S, t);
    g.restore();
  }

  // ================= Màn chơi =================
  const EARLY = 0.07, LATE = 0.09;
  const MILESTONES = { 10: 'Măm măm!', 25: 'Giỏi ghê!', 50: 'Siêu sâu!', 75: 'Không ai cản nổi!', 100: 'Đỉnh của chóp!' };
  // Tốc độ mỗi vòng sau khi đủ 3 sao (giống Like a Dino), và độ chồng nhạc giữa hai vòng.
  const RATES = [1, 1.2, 1.5, 1.8, 2, 2.2, 2.4, 2.6];
  const XFADE = 0.8;
  const STAR_FLY = 0.75;
  const fmtRate = (r) => 'x' + r.toFixed(1).replace('.', ',');

  const Game = {
    state: 'menu', song: null, map: null, buffer: null, diff: Store.data.diff || 1,
    notes: [], beats: [], beatIdx: 0, noteHead: 0, drawStart: 0, holds: [],
    songT: 0, resync: true, lastEnd: 0, firstT: 0,
    loop: 0, rate: 1, maxRate: 1, loopStartCtx: 0, nextQueued: false, nextStart: 0, nextRate: 1,
    stars: 0, starFx: [], botOn: BOT,
    score: 0, combo: 0, maxCombo: 0, hearts: 3, perfect: 0, good: 0, miss: 0,
    endT: 0, speed: 460, lead: 1.3, shake: 0, hintT: 0, resultShown: false, pulse: 0,

    setup() {
      const lvl = this.diff;
      this.notes = this.map.notes
        .filter((n) => n[3] <= lvl)
        .map((n) => ({ t: n[0], x: n[1], dur: n[2], state: 0, held: 0, eaten: [], cur: null, grow: 0, crunch: 0 }));
      this.beats = this.map.beats;
      this.resetNotes();
      this.score = 0; this.combo = 0; this.maxCombo = 0; this.hearts = 3; this.banked = 0; this.dotGot = 0;
      // Kỷ lục cũ của bài này ở độ khó này; vượt qua giữa ván thì báo ngay.
      this.prevBest = ((Store.data.best[this.song.id + ':' + this.diff] || {}).score) || 0;
      this.recordHit = false;
      UI.els.scoreBox.classList.remove('record');
      this.perfect = 0; this.good = 0; this.miss = 0;
      this.loop = 0; this.rate = 1; this.maxRate = 1; this.nextQueued = false;
      this.stars = 0; this.starFx = [];
      this.lastEnd = this.notes.reduce((m, n) => Math.max(m, n.t + n.dur), 0);
      this.firstT = this.notes.length ? this.notes[0].t : this.map.start;
      this.lead = lvl === 1 ? 1.35 : 1.12;
      this.speed = (H * 0.74) / this.lead;
      this.songT = this.map.start;
      this.resync = true;
      this.endT = 0;
      this.resultShown = false;
      Sau.segs = 4;
      Sau.sad = 0;
      Sound.root = this.map.key || 0;
      UI.hud(this);
      UI.resetStars();
      UI.speed(1);
    },

    // Đưa toàn bộ lá về trạng thái chưa ăn (đầu mỗi vòng).
    resetNotes() {
      for (const n of this.notes) {
        n.state = 0; n.held = 0; n.eaten = []; n.cur = null; n.grow = 0; n.crunch = 0;
        n.total = 0; n.bounce = 0; n.ticks = 0;
      }
      this.holds = [];
      this.beatIdx = 0;
      this.noteHead = 0;
      this.drawStart = 0;
    },

    begin() {
      this.setup();
      Sound.stopMusic();
      // ?debug=1&skip=80: bỏ qua 80 giây đầu để thử nhanh đoạn cuối.
      const skip = DEBUG ? Number(params.get('skip')) || 0 : 0;
      if (skip) for (const n of this.notes) if (n.t < this.map.start + skip + 1) n.state = 1;
      const when = Sound.ctx.currentTime + 0.1;
      Sound.playSection(this.buffer, this.map.start + skip, this.map.end - this.map.start - skip, when, 1, 1.2);
      this.loopStartCtx = when - skip;
      this.state = 'play';
      this.hintT = Store.data.hintSeen ? 0 : 3.2;
      UI.showHint(this.hintT > 0);
    },

    // Hẹn trước vòng nhạc kế tiếp (nhanh hơn) và chuyển sang nó đúng lúc.
    loopTick() {
      const len = this.map.end - this.map.start;
      const switchAt = this.loopStartCtx + len / this.rate - XFADE;
      if (!this.nextQueued && Sound.ctx.currentTime > switchAt - 1.5) {
        this.nextRate = RATES[Math.min(this.loop + 1, RATES.length - 1)];
        Sound.playSection(this.buffer, this.map.start, len, switchAt, this.nextRate, 0.9);
        this.nextQueued = true;
        this.nextStart = switchAt;
      }
      if (this.nextQueued && Sound.now() >= this.nextStart) {
        if (this.stars < 3) this.awardStar(3);
        this.loop++;
        this.rate = this.nextRate;
        this.maxRate = Math.max(this.maxRate, this.rate);
        this.loopStartCtx = this.nextStart;
        this.nextQueued = false;
        this.resetNotes();
        // Cập nhật thời gian ngay, nếu không khung hình kế tiếp vẫn vẽ theo giờ của vòng cũ
        // và bỏ qua toàn bộ lá của vòng mới.
        this.resync = true;
        this.time(0);
        UI.speed(this.rate);
        UI.toast('Tăng tốc ' + fmtRate(this.rate));
        Sound.speedUp();
      }
    },

    awardStar(k) {
      while (this.stars < k) {
        this.stars++;
        const p = UI.starOn(this.stars);
        this.starFx.push({ age: 0, x0: p.x, y0: p.y, done: false });
      }
      Sound.starTing();
      if (this.stars === 3) UI.toast('Đủ 3 sao rồi!');
    },

    updateStars(dt) {
      for (let i = this.starFx.length - 1; i >= 0; i--) {
        const f = this.starFx[i];
        f.age += dt;
        if (f.age > STAR_FLY * 0.45) Sau.mouthOpen = Math.max(Sau.mouthOpen, clamp((f.age - STAR_FLY * 0.45) / (STAR_FLY * 0.4), 0, 1));
        if (f.age >= STAR_FLY && !f.done) {
          f.done = true;
          Sau.chew = 0.32;
          Sau.happy = 0.6;
          Sau.gulp();
          burstSparks(Sau.headX, Sau.headY - HEAD_R * 0.4, 16, '#FFC24B');
          ring(Sau.headX, Sau.headY, '#FFC24B');
          Sound.star();
          this.starFx.splice(i, 1);
        }
      }
    },

    time(dt) {
      const raw = this.map.start + (Sound.now() - this.loopStartCtx) * this.rate + (this.song.offset || 0);
      if (this.resync) { this.songT = raw; this.resync = false; return; }
      const pred = this.songT + dt;
      const err = raw - pred;
      this.songT = Math.abs(err) > 0.1 ? raw : pred + err * 0.12;
    },

    pause() {
      if (this.state !== 'play') return;
      this.state = 'paused';
      Sound.ctx.suspend();
      UI.show('pause');
    },
    resume() {
      UI.hide('pause');
      Sound.ctx.resume().then(() => { this.resync = true; this.state = 'play'; });
    },

    eat(n, perfect) {
      n.state = 1;
      const mult = 1 + Math.min(4, Math.floor(this.combo / 10)) * 0.5;
      this.score += Math.round((perfect ? 300 : 200) * mult);
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      if (perfect) this.perfect++; else this.good++;
      Sau.segs++;
      Sau.chew = 0.24;
      Sau.gulp();
      if (perfect) Sau.happy = 0.35;
      const px = PX0 + n.x * PW;
      burstCrumbs(px, Sau.headY - HEAD_R * 0.6, perfect ? 9 : 6);
      if (perfect) ring(Sau.headX, Sau.headY, T.night ? '#8C6BC8' : '#D9C9F2');
      popup('+' + Math.round((perfect ? 300 : 200) * mult), Sau.headX, Sau.headY - HEAD_R * 2.2, T.night ? '#FFF1C9' : '#3B2A4A');
      Sound.eat(this.combo, perfect);
      buzz(8);
      if (n.dur > 0) { n.cur = [this.songT, this.songT]; n.eaten.push(n.cur); this.holds.push(n); }
      if (MILESTONES[this.combo]) { UI.toast(MILESTONES[this.combo]); Sound.milestone(); burstHearts(Sau.headX, Sau.headY - HEAD_R, 5); }
      if (this.combo % 30 === 0 && this.hearts < 3) {
        this.hearts++;
        UI.toast('+1 tim');
        Sound.heart();
      }
      UI.hud(this, true);
    },

    lose(n) {
      n.state = 2;
      this.miss++;
      this.combo = 0;
      this.hearts--;
      this.shake = REDUCED_MOTION ? 0 : 0.25;
      Sau.sad = 0.7;
      Sound.miss();
      buzz(30);
      UI.hud(this);
      // Đã đủ 3 sao thì hết tim vẫn là thắng: sâu hoá bướm.
      if (this.hearts <= 0) {
        if (this.stars >= 3) this.finish();
        else this.gameOver();
      }
    },

    update(dt) {
      if (this.state === 'play') this.time(dt);
      if (this.state === 'play' && !this.recordHit && this.prevBest > 0 && this.score > this.prevBest) {
        this.recordHit = true;
        UI.toast('Kỷ lục mới!');
        Sound.record();
        buzz(20);
        burstSparks(Sau.headX, Sau.headY - HEAD_R * 2, 16, '#FFC24B');
        burstHearts(Sau.headX, Sau.headY - HEAD_R, 4);
        UI.els.scoreBox.classList.add('record');
      }
      const t = this.songT;
      // Nhịp
      const b = this.beats;
      while (this.beatIdx < b.length - 1 && b[this.beatIdx + 1] <= t) this.beatIdx++;
      let pulse = 0;
      if (b.length && t >= b[this.beatIdx]) pulse = Math.exp(-(t - b[this.beatIdx]) * 7);

      if (this.state === 'play') {
        if (this.hintT > 0) {
          this.hintT -= dt;
          if (this.hintT <= 0) { UI.showHint(false); Store.data.hintSeen = true; Store.save(); }
        }
        const grow = easeInOut(clamp((Sau.segs - 4) / 60, 0, 1));
        Sau.headY = lerp(Sau.headY, H * (0.74 - 0.16 * grow), 1 - Math.exp(-dt * 3));
        if (this.botOn) this.bot();
        this.judge(t, dt);
        if (this.state === 'play') {
          const prog = clamp((t - this.firstT) / (this.lastEnd - this.firstT), 0, 1);
          UI.progress(prog);
          // Sao tính theo quãng đường đã đi được trong vòng đầu, không cần chính xác.
          if (this.loop === 0) {
            if (this.stars < 1 && prog >= 1 / 3) this.awardStar(1);
            if (this.stars < 2 && prog >= 2 / 3) this.awardStar(2);
            if (this.stars < 3 && prog >= 1 && !this.holds.length) this.awardStar(3);
          }
          this.updateStars(dt);
          this.loopTick();
        }
      } else if (this.state === 'menu') {
        Sau.target = PX0 + PW * (0.5 + 0.26 * Math.sin(clock * 0.9));
        Sau.headY = lerp(Sau.headY || H * 0.28, H * 0.27, 1 - Math.exp(-dt * 3));
        pulse = Math.exp(-((clock % 0.66) * 7)) * 0.6;
      } else if (this.state === 'over') {
        Sau.headY = lerp(Sau.headY, H * 0.34, 1 - Math.exp(-dt * 2.5));
        Sau.sad = Math.max(Sau.sad, 0.2);
      } else if (this.state === 'ending') {
        this.endT += dt;
        Sau.target = W / 2;
        Sau.headY = lerp(Sau.headY, H * 0.42, 1 - Math.exp(-dt * 3));
        if (this.endT > 2.3 && !this.burst) {
          this.burst = true;
          burstHearts(W / 2, Sau.headY, 12);
          burstSparks(W / 2, Sau.headY, 26);
          Sound.butterfly();
        }
        if (this.endT > 3.4 && !this.resultShown) { this.resultShown = true; UI.result(true, this); }
      }
      this.pulse = pulse;
      updateSau(dt, this.speed, pulse);
      updateParticles(dt);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    },

    judge(t, dt) {
      const notes = this.notes;
      // Mức Dễ: vùng đớp rộng hơn một chút.
      const R = CATCH_R * (this.diff === 1 ? 1.12 : 1);
      let anticip = 0;
      for (let i = this.noteHead; i < notes.length; i++) {
        const n = notes[i];
        if (n.t - t > 0.4) break;
        if (n.state !== 0) continue;
        const d = Math.abs(Sau.headX - (PX0 + n.x * PW));
        if (n.t - t > 0 && d < R * 1.8) anticip = Math.max(anticip, 1 - (n.t - t) / 0.4);
        if (n.t - t > EARLY) continue;
        if (d <= R) this.eat(n, d <= PERFECT_R);
        else if (t - n.t > LATE) this.lose(n);
        if (this.state !== 'play') return;
      }
      while (this.noteHead < notes.length && notes[this.noteHead].state !== 0) this.noteHead++;
      Sau.mouthOpen = lerp(Sau.mouthOpen, anticip, 1 - Math.exp(-dt * 20));

      // Nốt dài: giữ đầu sâu trong cành lá để ăn tiếp.
      const beatLen = 60 / (this.map.bpm || 90);
      for (let i = this.holds.length - 1; i >= 0; i--) {
        const n = this.holds[i];
        const end = n.t + n.dur;
        const inside = Math.abs(Sau.headX - (PX0 + n.x * PW)) <= R * 0.95;
        const now = Math.min(t, end);
        if (inside) {
          if (!n.cur) { n.cur = [now, now]; n.eaten.push(n.cur); }
          n.cur[1] = now;
          n.held += dt;
          n.grow += dt;
          n.crunch += dt;
          Sau.chew = Math.max(Sau.chew, 0.1);
          if (n.grow >= beatLen) { n.grow -= beatLen; Sau.segs++; Sau.gulp(); }
          if (n.crunch >= 0.12) {
            // Mỗi miếng cắn trên cành dài: điểm nhỏ nảy lên, cộng dồn vào bong bóng tổng.
            n.crunch = 0;
            const pts = Math.round(25 * (1 + Math.min(4, Math.floor(this.combo / 10)) * 0.5));
            n.total = (n.total || 0) + pts;
            n.bounce = 1;
            this.score += pts;
            popup('+' + pts, Sau.headX + (Math.random() - 0.5) * 50 * S, Sau.headY - HEAD_R * 1.6,
              (n.ticks = (n.ticks || 0) + 1) % 2 ? GOLD() : PINK(), 14, (Math.random() - 0.5) * 70 * S);
            Sound.bite((now - n.t) / Math.max(0.01, n.dur));
            burstCrumbs(Sau.headX, Sau.headY - HEAD_R * 0.6, 2);
            UI.hud(this);
          }
        } else {
          n.cur = null;
        }
        if (n.bounce) n.bounce = Math.max(0, n.bounce - dt * 6);
        if (t >= end) {
          const ratio = clamp(n.held / Math.max(0.01, n.dur), 0, 1);
          const bonus = Math.round(ratio * 400);
          this.score += bonus;
          const total = (n.total || 0) + bonus;
          if (total > 0) popup('+' + total.toLocaleString('vi-VN'), Sau.headX, Sau.headY - HEAD_R * 4, GOLD(), 26);
          if (ratio > 0.8) {
            popup('Ngon!', Sau.headX, Sau.headY - HEAD_R * 5.4, PINK(), 20);
            burstHearts(Sau.headX, Sau.headY - HEAD_R, 4);
            burstSparks(Sau.headX, Sau.headY - HEAD_R * 2.5, 10, '#FFC24B');
            Sau.happy = 0.4;
          }
          this.holds.splice(i, 1);
          UI.hud(this);
        }
      }
    },

    bot() {
      const t = this.songT;
      let tx = null;
      if (this.holds.length) tx = this.holds[0].x;
      else {
        for (let i = this.noteHead; i < this.notes.length; i++) {
          const n = this.notes[i];
          if (n.state === 0) { tx = n.x; break; }
        }
      }
      if (tx !== null) Sau.target = PX0 + tx * PW;
      return t;
    },

    finish() {
      this.state = 'ending';
      this.endT = 0;
      this.burst = false;
      this.starFx = [];
      Sound.fadeOutMusic(3.2);
      UI.hide('hud');
      UI.hide('pause');
      UI.showHint(false);
    },

    gameOver() {
      this.state = 'over';
      Sound.fadeOutMusic(1.2);
      Sound.lose();
      UI.showHint(false);
      setTimeout(() => { if (this.state === 'over') UI.result(false, this); }, 900);
    },
  };

  // ================= Vẽ màn chơi =================
  function drawNotes() {
    const t = Game.songT, v = Game.speed, hy = Sau.headY;
    const notes = Game.notes;
    const below = (H - hy) / v + 0.3;
    while (Game.drawStart < notes.length && notes[Game.drawStart].t + notes[Game.drawStart].dur < t - below) Game.drawStart++;
    const lw = SPR.leafW, lh = SPR.leafH;
    for (let i = Game.drawStart; i < notes.length; i++) {
      const n = notes[i];
      const ahead = n.t - t;
      if (ahead > hy / v + 0.3) break;
      const x = PX0 + n.x * PW;
      const yBottom = hy - ahead * v;
      if (n.dur > 0) drawStalk(n, x, yBottom, t, v, hy);
      if (n.state === 1) continue;
      const sc = 1 + Game.pulse * 0.08;
      const sway = Math.sin(clock * 3 + i) * 0.18;
      g.globalAlpha = n.state === 2 ? 0.3 : 1;
      g.save();
      g.translate(x, yBottom);
      g.rotate(sway);
      g.drawImage(SPR.leaf, -lw * sc / 2, -SPR.leafCY * sc, lw * sc, lh * sc);
      g.restore();
    }
    g.globalAlpha = 1;
  }

  function stalkEaten(n, tau) {
    for (const e of n.eaten) if (tau >= e[0] - 0.02 && tau <= e[1] + 0.02) return true;
    return false;
  }

  function drawStalk(n, x, yBottom, t, v, hy) {
    const yTop = yBottom - n.dur * v;
    const missedAll = n.state === 2;
    g.lineCap = 'round';
    g.lineWidth = 6 * S;
    g.strokeStyle = T.stem;
    // Phần còn ở phía trên đầu sâu: luôn vẽ rõ.
    const upperBottom = n.state === 1 ? Math.min(yBottom, hy) : yBottom;
    g.globalAlpha = missedAll ? 0.3 : 1;
    if (upperBottom > yTop) {
      g.beginPath(); g.moveTo(x, yTop); g.lineTo(x, upperBottom); g.stroke();
    }
    // Phần đã đi qua đầu sâu nhưng chưa ăn: mờ đi.
    const step = 24 * S;
    const lw = SPR.leafW * 0.55, lh = SPR.leafH * 0.55;
    for (let y = yTop + step * 0.5, k = 0; y < yBottom - step * 0.4; y += step, k++) {
      const tau = n.t + (yBottom - y) / v;
      let alpha = missedAll ? 0.3 : 1;
      if (n.state === 1 && y > hy) {
        if (stalkEaten(n, tau)) continue;
        alpha = 0.3;
        g.globalAlpha = alpha;
        g.beginPath(); g.moveTo(x, y - step / 2); g.lineTo(x, y + step / 2); g.stroke();
      }
      g.globalAlpha = alpha;
      const side = k % 2 ? 1 : -1;
      g.save();
      g.translate(x, y);
      g.rotate(side * 0.9 + Math.sin(clock * 3 + k) * 0.08);
      g.drawImage(SPR.leaf, -lw / 2, -SPR.leafCY * 0.55, lw, lh);
      g.restore();
    }
    g.globalAlpha = 1;
  }

  // Ngôi sao bay từ thanh tiến trình xuống miệng bé sâu.
  function drawStarFx() {
    const s = SPR.starSize;
    for (const f of Game.starFx) {
      const u = easeInOut(clamp(f.age / STAR_FLY, 0, 1));
      const hx = Sau.headX, hy = Sau.headY - HEAD_R * 0.2;
      const cx = (f.x0 + hx) / 2 + (f.x0 < hx ? -1 : 1) * 80 * S;
      const cy = f.y0 + 40 * S;
      const x = (1 - u) * (1 - u) * f.x0 + 2 * (1 - u) * u * cx + u * u * hx;
      const y = (1 - u) * (1 - u) * f.y0 + 2 * (1 - u) * u * cy + u * u * hy;
      const sc = 1.25 - 0.7 * u;
      g.save();
      g.translate(x, y);
      g.rotate(f.age * 7);
      g.drawImage(SPR.star, (-s * sc) / 2, (-s * sc) / 2, s * sc, s * sc);
      g.restore();
    }
  }

  function render(dt) {
    const sh = Game.shake > 0 ? Game.shake * 12 * S : 0;
    const ox = sh ? (Math.random() - 0.5) * sh : 0;
    const oy = sh ? (Math.random() - 0.5) * sh : 0;
    g.setTransform(DPR, 0, 0, DPR, ox * DPR, oy * DPR);
    const playing = Game.state === 'play' || Game.state === 'paused' || Game.state === 'over';
    // Tốc độ thật trên màn hình (px/giây) tăng theo vòng nhanh.
    const wallSpeed = Game.speed * Game.rate;
    drawBackground(Game.state === 'paused' ? 0 : dt, wallSpeed, Game.pulse || 0);
    if (playing) drawNotes();
    if (Game.state === 'ending') {
      const e = Game.endT;
      const collapse = easeInOut(clamp(e / 1.1, 0, 1));
      if (e < 2.3) {
        if (collapse < 1) drawSau(wallSpeed, 0, collapse);
        const sc = easeOutBack(clamp((e - 0.5) / 0.7, 0, 1));
        const wob = e > 1.1 ? Math.sin(e * 34) * 0.12 * clamp((e - 1.1) / 1.2, 0, 1) : 0;
        if (sc > 0) drawCocoon(Sau.headX, Sau.headY, sc, wob, clamp((e - 1.1) / 1.2, 0, 1));
      } else {
        const k = easeOutBack(clamp((e - 2.3) / 0.6, 0, 1));
        const y = lerp(Sau.headY, H * 0.2, easeInOut(clamp((e - 2.3) / 1.6, 0, 1))) + Math.sin(e * 2.2) * 8 * S;
        drawButterfly(W / 2 + Math.sin(e * 1.3) * 14 * S, y, 1.6 * k, e);
      }
    } else {
      drawSau(wallSpeed, Game.pulse || 0, 0);
      drawStarFx();
    }
    drawParticles();
    drawPopups(Game.state === 'paused' ? 0 : dt);
    if (DEBUG) {
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.fillStyle = '#000';
      g.font = '12px monospace';
      g.textAlign = 'left';
      g.fillText(`${fps.toFixed(0)} fps · dpr ${DPR} · t ${Game.songT.toFixed(2)}`, 8, H - 10);
      if (Sound.ctx) {
        const c = Sound.ctx;
        g.fillText(`audio ${c.state} ${c.currentTime.toFixed(2)} · ${Sound.clockSrc || '-'} · lat ${(((c.outputLatency || 0) + (c.baseLatency || 0)) * 1000).toFixed(0)}ms`, 8, H - 26);
      }
    }
  }

  // ================= Giao diện (DOM) =================
  const UI = {
    els: {
      hud: $('hud'), menu: $('menu'), pause: $('pause'), result: $('result'), hint: $('hint'), toast: $('toast'),
      score: $('score'), scoreBox: $('score').parentElement, length: $('length'), hearts: $('hearts'), combo: $('combo'), comboNum: $('combo-num'),
      progress: $('progress-fill'), songs: $('songs'), pstars: $('pstars'), speed: $('speed'), wallet: $('wallet'),
    },
    last: {},
    show(name) { this.els[name].hidden = false; },
    hide(name) { this.els[name].hidden = true; },
    hud(gm, bump) {
      const e = this.els;
      if (this.last.score !== gm.score) { e.score.textContent = gm.score.toLocaleString('vi-VN'); this.last.score = gm.score; }
      if (this.last.segs !== Sau.segs) { e.length.textContent = Sau.segs; this.last.segs = Sau.segs; }
      if (this.last.hearts !== gm.hearts) {
        e.hearts.replaceChildren();
        for (let i = 0; i < 3; i++) e.hearts.appendChild(svgIcon(PATH_HEART, i < gm.hearts ? '' : 'lost'));
        this.last.hearts = gm.hearts;
      }
      e.combo.hidden = gm.combo < 3;
      if (this.last.combo !== gm.combo) {
        e.comboNum.textContent = gm.combo;
        this.last.combo = gm.combo;
        if (bump) { e.combo.classList.remove('bump'); void e.combo.offsetWidth; e.combo.classList.add('bump'); }
      }
    },
    progress(p) {
      const v = Math.round(p * 200) / 200;
      if (this.last.p !== v) { this.els.progress.style.width = (v * 100).toFixed(1) + '%'; this.last.p = v; }
    },
    toast(text) {
      const el = this.els.toast;
      el.textContent = text;
      el.classList.remove('show');
      void el.offsetWidth;
      el.classList.add('show');
    },
    showHint(on) { this.els.hint.hidden = !on; },

    resetStars() {
      const box = this.els.pstars;
      box.replaceChildren();
      [33.3, 66.6, 97].forEach((left) => {
        const s = svgIcon(PATH_STAR);
        s.style.left = left + '%';
        box.appendChild(s);
      });
    },
    // Thắp sao thứ i trên thanh tiến trình, trả về vị trí để ngôi sao bay xuống.
    starOn(i) {
      const el = this.els.pstars.children[i - 1];
      if (!el) return { x: W / 2, y: 40 };
      el.setAttribute('class', 'on');
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
    speed(rate) {
      const el = this.els.speed;
      el.hidden = rate <= 1;
      el.textContent = fmtRate(rate);
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    },

    // Mỗi bài: chạm vào dòng để nghe thử đoạn hay nhất, nút hồng để vào chơi.
    renderSongs(songs) {
      Preview.stop(true);
      const mw = $('menu-wallet');
      mw.textContent = walletText();
      mw.hidden = !mw.textContent;
      const list = this.els.songs;
      list.replaceChildren();
      for (const s of songs) {
        const li = document.createElement('li');
        li.className = 'song';
        const main = document.createElement('button');
        main.type = 'button';
        main.className = 'song-main';
        main.setAttribute('aria-label', 'Nghe thử ' + s.title);
        const cover = document.createElement('span');
        cover.className = 'cover';
        const img = document.createElement('img');
        img.src = s.cover;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        const eq = document.createElement('span');
        eq.className = 'eq';
        eq.append(document.createElement('i'), document.createElement('i'), document.createElement('i'));
        cover.append(img, eq);
        const meta = document.createElement('span');
        meta.className = 'meta';
        const title = document.createElement('span');
        title.className = 'title';
        title.textContent = s.title;
        if (s.isNew) {
          const nb = document.createElement('span');
          nb.className = 'new-badge';
          nb.textContent = 'NEW';
          title.appendChild(nb);
        }
        const sub = document.createElement('span');
        sub.className = 'sub';
        const best = Store.data.best[s.id + ':' + Game.diff];
        sub.textContent = best && best.score ? 'Kỷ lục ' + best.score.toLocaleString('vi-VN') : 'Chạm để nghe thử';
        sub.dataset.idle = sub.textContent;
        meta.append(title, sub);
        const stars = document.createElement('span');
        stars.className = 'mini-stars';
        for (let i = 0; i < 3; i++) stars.appendChild(svgIcon(PATH_STAR, best && best.stars > i ? 'on' : ''));
        main.append(cover, meta, stars);
        const play = document.createElement('button');
        play.type = 'button';
        play.className = 'play';
        play.setAttribute('aria-label', 'Chơi ' + s.title);
        play.appendChild(svgIcon(PATH_PLAY));
        const bar = document.createElement('span');
        bar.className = 'bar';
        li.append(main, play, bar);
        main.addEventListener('click', () => Preview.toggle(s, li));
        play.addEventListener('click', () => startSong(s, li));
        list.appendChild(li);
      }
    },

    result(win, gm) {
      const stars = gm.stars;
      $('res-title').textContent = win ? 'Hoá bướm rồi!' : stars ? 'Được ' + stars + ' sao rồi!' : 'Bé sâu còn đói…';
      $('res-message').textContent = win
        ? gm.song.message
        : stars ? 'Thêm chút nữa là đủ 3 sao, thử lại nha?' : 'Lá rơi nhanh quá, mình thử lại nha?';
      $('res-score').textContent = gm.score.toLocaleString('vi-VN');
      $('res-combo').textContent = gm.maxCombo;
      $('res-length').textContent = Sau.segs + ' đốt';
      $('res-speed').textContent = fmtRate(gm.maxRate);
      const st = $('res-stars');
      st.replaceChildren();
      for (let i = 0; i < 3; i++) st.appendChild(svgIcon(PATH_STAR, i < stars ? 'on' : ''));
      const key = gm.song.id + ':' + gm.diff;
      const prev = Store.data.best[key] || { score: 0, stars: 0 };
      const isBest = gm.score > prev.score;
      if (isBest || stars > prev.stars) {
        Store.data.best[key] = { score: Math.max(gm.score, prev.score), stars: Math.max(stars, prev.stars) };
        Store.save();
      }
      $('res-best').hidden = !isBest;
      bank();
      const left = window.Wallet ? Wallet.get().points : 0;
      $('res-wallet').textContent = (gm.score
        ? '+' + fmtNum(gm.score) + ' điểm' + (gm.dotGot ? ' = +' + gm.dotGot + ' đốt cây' : '') + '. '
        : 'Ván này chưa có điểm. ') + walletText()
        + (left ? ' (dư ' + fmtNum(left) + ' điểm để dành ván sau).' : '.');
      this.hide('hud');
      this.show('result');
      $('btn-again').focus({ preventScroll: true });
    },
  };

  // Cất điểm vào ví chung; đủ 10.000 điểm là tự đổi ra 3 đốt cây. Chỉ cộng phần chưa cất.
  function bank() {
    const add = Game.score - (Game.banked || 0);
    if (add <= 0 || !window.Wallet) return 0;
    Game.banked = Game.score;
    Game.dotGot = (Game.dotGot || 0) + Wallet.addPoints(add);
    return add;
  }
  const fmtNum = (n) => n.toLocaleString('vi-VN');
  function walletText() {
    if (!window.Wallet) return '';
    const w = Wallet.get();
    return 'Ví: ' + fmtNum(w.dot) + ' đốt cây';
  }

  // ================= Nghe thử ở menu =================
  const PREVIEW_LEN = 15;
  const Preview = {
    id: null, row: null, token: 0, timer: 0,

    async toggle(song, row) {
      Sound.unlock();
      if (this.id === song.id) { this.stop(); return; }
      this.stop(true);
      const token = ++this.token;
      this.id = song.id;
      this.row = row;
      row.classList.add('preview-loading');
      this.setSub('Đang tải nhạc…');
      try {
        const buf = await Sound.load(new URL(song.src, location.href).href, (p) => {
          if (token === this.token && p < 1) this.setSub('Đang tải nhạc ' + Math.round(p * 100) + '%');
        });
        if (token !== this.token) return;
        const start = clamp(song.preview || 0, 0, Math.max(0, buf.duration - 5));
        const dur = Math.min(PREVIEW_LEN, buf.duration - start);
        Sound.playPreview(buf, start, dur);
        row.classList.remove('preview-loading');
        row.style.setProperty('--dur', dur + 's');
        row.classList.add('previewing');
        this.setSub('Đang nghe thử…');
        this.timer = setTimeout(() => { if (token === this.token) this.stop(); }, dur * 1000);
      } catch (err) {
        console.error(err);
        if (token === this.token) { this.stop(true); UI.toast('Không tải được nhạc'); }
      }
    },

    stop(fast) {
      this.token++;
      clearTimeout(this.timer);
      if (Sound.ctx) Sound.stopPreview(fast ? 0.12 : 0.45);
      if (this.row) {
        this.row.classList.remove('previewing', 'preview-loading');
        const sub = this.row.querySelector('.sub');
        if (sub) sub.textContent = sub.dataset.idle;
      }
      this.id = null;
      this.row = null;
    },

    setSub(text) {
      const sub = this.row && this.row.querySelector('.sub');
      if (sub) sub.textContent = text;
    },
  };

  // ================= Luồng chơi =================
  let SONGS = [];
  let loadingBtn = null;

  async function startSong(song, btn) {
    if (loadingBtn) return;
    Preview.stop(true);
    Sound.unlock();
    Sound.click();
    loadingBtn = btn || null;
    if (btn) btn.classList.add('loading');
    try {
      const [map, buffer] = await Promise.all([
        fetch(song.map).then((r) => { if (!r.ok) throw new Error('Thiếu beatmap'); return r.json(); }),
        Sound.load(new URL(song.src, location.href).href, () => {}),
      ]);
      Game.song = song;
      Game.map = map;
      Game.buffer = buffer;
      UI.els.menu.classList.add('away');
      UI.hide('result');
      UI.show('hud');
      Game.begin();
    } catch (err) {
      console.error(err);
      UI.toast('Không mở được bài này');
    } finally {
      if (btn) btn.classList.remove('loading');
      loadingBtn = null;
    }
  }

  function restart() {
    bank();
    UI.hide('pause');
    UI.hide('result');
    Sound.unlock();
    Sound.stopMusic();
    if (Sound.ctx.state !== 'running') Sound.ctx.resume();
    UI.show('hud');
    Game.begin();
  }

  function toMenu() {
    bank();
    Sound.stopMusic();
    if (Sound.ctx && Sound.ctx.state !== 'running') Sound.ctx.resume();
    Game.state = 'menu';
    Sau.segs = 4;
    Sau.sad = 0;
    UI.hide('pause');
    UI.hide('result');
    UI.hide('hud');
    UI.showHint(false);
    UI.renderSongs(SONGS);
    UI.els.menu.classList.remove('away');
  }

  // ================= Điều khiển =================
  const SENS = 1.25;
  let dragId = null, lastPX = 0;
  canvas.addEventListener('pointerdown', (e) => {
    if (Game.state !== 'play') return;
    dragId = e.pointerId;
    lastPX = e.clientX;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
    if (Game.hintT > 0) Game.hintT = Math.min(Game.hintT, 0.6);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (Game.state !== 'play') return;
    if (e.pointerType === 'mouse' && dragId === null) {
      Sau.target = clamp(e.clientX, PX0 + 18 * S, PX0 + PW - 18 * S);
      return;
    }
    if (e.pointerId !== dragId) return;
    Sau.target = clamp(Sau.target + (e.clientX - lastPX) * SENS, PX0 + 18 * S, PX0 + PW - 18 * S);
    lastPX = e.clientX;
  });
  const endDrag = (e) => { if (e.pointerId === dragId) dragId = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  const keys = { left: false, right: false };
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    else if (e.key === 'ArrowRight') keys.right = true;
    else if ((e.key === 'Escape' || e.key === 'p') && Game.state === 'play') Game.pause();
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    else if (e.key === 'ArrowRight') keys.right = false;
  });

  // Chặn cuộn/zoom của trình duyệt khi đang chơi.
  document.addEventListener('touchmove', (e) => {
    if (!e.target.closest || !e.target.closest('.songs, .vol')) e.preventDefault();
  }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    Game.pause();
    // Lỡ tắt app giữa chừng thì điểm đã ăn vẫn vào ví.
    if (Game.state === 'paused') bank();
    Preview.stop(true);
  });
  window.addEventListener('resize', () => resize());

  $('btn-pause').addEventListener('click', () => {
    Sound.click();
    Game.pause();
    $('btn-finish').hidden = Game.stars < 3;
  });
  $('btn-finish').addEventListener('click', () => {
    Sound.ctx.resume().then(() => { Sound.click(); Game.finish(); });
  });
  $('btn-resume').addEventListener('click', () => { Sound.click(); Game.resume(); });

  // Ví đốt cây trong game: xem số đốt, điểm còn dư tới 3 đốt tiếp theo, đổi nếu đủ.
  function showWallet() {
    const w = Wallet.get();
    const can = Wallet.canExchange(w);
    $('w-dot').textContent = fmtNum(w.dot);
    $('w-fill').style.width = Math.min(100, (w.points / Wallet.PACK_POINTS) * 100) + '%';
    $('w-note').textContent = fmtNum(Wallet.PACK_POINTS * 10) + ' điểm = ' + Wallet.PACK_DOT * 10 + ' đốt cây. Điểm tự đổi sau mỗi ván; đang dư '
      + fmtNum(w.points) + ' điểm, thêm ' + fmtNum(Wallet.PACK_POINTS - w.points) + ' điểm nữa là được +' + Wallet.PACK_DOT + ' đốt.';
    const ex = $('btn-w-exchange');
    ex.hidden = !can;
    ex.textContent = 'Đổi ' + fmtNum(w.points) + ' điểm ra ' + can + ' đốt';
    UI.show('wallet');
  }
  $('menu-wallet').addEventListener('click', () => { Sound.unlock(); Sound.click(); showWallet(); });
  $('btn-w-exchange').addEventListener('click', () => {
    const got = Wallet.exchangeAll();
    if (got) { Sound.milestone(); UI.toast('+' + got + ' đốt cây'); }
    showWallet();
    $('menu-wallet').textContent = walletText();
  });
  $('btn-w-close').addEventListener('click', () => { Sound.click(); UI.hide('wallet'); });
  $('wallet').addEventListener('click', (e) => { if (e.target.id === 'wallet') UI.hide('wallet'); });
  $('btn-restart').addEventListener('click', () => { Sound.click(); restart(); });
  $('btn-menu').addEventListener('click', () => { Sound.click(); toMenu(); });
  $('btn-again').addEventListener('click', () => { Sound.click(); restart(); });
  $('btn-songs').addEventListener('click', () => { Sound.click(); toMenu(); });

  const diffBtns = document.querySelectorAll('.segmented button');
  function setDiff(d) {
    Game.diff = d;
    Store.data.diff = d;
    Store.save();
    diffBtns.forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.diff) === d)));
    UI.renderSongs(SONGS);
  }
  diffBtns.forEach((b) => b.addEventListener('click', () => setDiff(Number(b.dataset.diff))));

  const sfxToggle = $('opt-sfx');
  sfxToggle.checked = Store.data.sfx;
  sfxToggle.addEventListener('change', () => {
    Store.data.sfx = sfxToggle.checked;
    Store.save();
    Sound.setSfx(sfxToggle.checked);
  });

  const eatVol = $('opt-eat');
  const eatVal = $('opt-eat-val');
  const showEatVol = () => {
    eatVal.textContent = eatVol.value + '%';
    eatVol.style.setProperty('--fill', eatVol.value + '%');
  };
  eatVol.value = Store.data.eatVol;
  showEatVol();
  const applyEatVol = () => {
    Store.data.eatVol = Number(eatVol.value);
    Sound.setEatVol(Store.data.eatVol);
    showEatVol();
  };
  eatVol.addEventListener('input', applyEatVol);
  // Tự kéo bằng ngón tay: trang chặn cuộn/zoom nên thanh trượt gốc trên iPhone không kéo được.
  let volDrag = null;
  const volFromX = (x) => {
    const r = eatVol.getBoundingClientRect();
    const p = clamp((x - r.left) / r.width, 0, 1);
    eatVol.value = Math.round((p * 100) / 5) * 5;
    applyEatVol();
  };
  eatVol.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    volDrag = e.pointerId;
    try { eatVol.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
    volFromX(e.clientX);
  });
  eatVol.addEventListener('pointermove', (e) => { if (volDrag === e.pointerId) volFromX(e.clientX); });
  const volEnd = (e) => {
    if (volDrag !== e.pointerId) return;
    volDrag = null;
    eatVol.dispatchEvent(new Event('change'));
  };
  eatVol.addEventListener('pointerup', volEnd);
  eatVol.addEventListener('pointercancel', volEnd);
  // Thả tay ra thì kêu thử một tiếng để nghe mức mới.
  eatVol.addEventListener('change', () => {
    Store.save();
    Sound.unlock();
    Sound.eat(Math.floor(Math.random() * 8), false);
  });

  // ================= Vòng lặp =================
  let clock = 0, lastTs = performance.now(), fps = 60;
  let slowTime = 0, lastDowngrade = 0;

  function frame(ts) {
    requestAnimationFrame(frame);
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (!(dt > 0)) return;
    dt = Math.min(dt, 0.05);
    fps = lerp(fps, 1 / dt, 0.05);
    // Máy yếu: giảm độ phân giải để giữ mượt.
    if (dt > 1 / 45) slowTime += dt; else slowTime = Math.max(0, slowTime - dt * 0.5);
    if (slowTime > 1.5 && DPR > 1 && ts - lastDowngrade > 3000) {
      DPR = Math.max(1, DPR - 0.5);
      lastDowngrade = ts;
      slowTime = 0;
      resize();
    }
    if (Game.state !== 'paused') {
      clock += dt;
      if (Game.state === 'play' && (keys.left || keys.right)) {
        Sau.target = clamp(Sau.target + (keys.right - keys.left) * PW * 1.6 * dt, PX0 + 18 * S, PX0 + PW - 18 * S);
      }
      Game.update(dt);
    }
    render(Game.state === 'paused' ? 0 : dt);
  }

  // Quay lại từ Tiệm Sâu bằng nút back (trang lấy từ bộ nhớ đệm): mặc lại đồ mới chọn.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    loadLook();
    buildSprites();
    initAmbient();
    if (Game.state === 'menu') UI.renderSongs(SONGS);
  });
  // Bản sao lưu khác máy: chỉ làm mới khi đang ở menu, đang chơi thì để ván sau.
  window.LPN_onSync = () => {
    if (Game.state !== 'menu') return;
    Store.load();
    loadLook();
    buildSprites();
    initAmbient();
    UI.renderSongs(SONGS);
  };

  // ================= Khởi động =================
  if (DEBUG) window.__sautim = { Game, Sau, Sound };
  resize();
  Sau.headY = H * 0.27;
  Sau.resetTrail(0);
  setDiff(Game.diff);
  requestAnimationFrame((ts) => { lastTs = ts; frame(ts); });

  fetch('beatmaps/index.json')
    .then((r) => r.json())
    .then((data) => {
      // Bài "locked" chỉ hiện khi đã mở khoá trong cốt truyện (lpn:songs).
      let opened = {};
      try { opened = JSON.parse(localStorage.getItem('lpn:songs')) || {}; } catch (e) { /* bỏ qua */ }
      SONGS = data.songs.filter((s) => !s.locked || opened[s.id]);
      UI.renderSongs(SONGS);
      const auto = params.get('song');
      if (auto) {
        const s = SONGS.find((x) => x.id === auto);
        if (s) startSong(s, null);
      }
    })
    .catch((err) => { console.error(err); UI.toast('Không tải được danh sách bài'); });
})();
