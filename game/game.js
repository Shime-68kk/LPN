// Sâu Tím — game nhịp điệu: bé sâu ăn lá theo nhạc, lớn dần rồi hoá bướm.
'use strict';
(() => {
  // ================= Tiện ích =================
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOutBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
  const TAU = Math.PI * 2;
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
    // Đã đoán sẵn trong <head> (cùng cách với mọi trang) thì dùng luôn.
    if (window.LPN_GAME && THEMES[window.LPN_GAME.w]) return window.LPN_GAME.w;
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
  // Skin đổi hình, và mỗi skin có một kỹ năng riêng khi chơi (skin càng hiếm kỹ năng càng mạnh).
  const LOOK = {};
  let PET = null;
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
    // skin có tính cách (Nàng Thơ, Vi Mạch): ở màn chọn bài chạm, vuốt được
    PET = Skins.makePet ? Skins.makePet(LOOK.skin, (window.Sync && window.Sync.who) || null) : null;
    // Kỹ năng riêng của skin (xem SKILLS trong skins.js)
    LOOK.skill = Skins.skillOf ? Skins.skillOf(LOOK.skin) : null;
    const ms = document.getElementById('menu-skill');
    if (ms) {
      const sk = LOOK.skill;
      ms.hidden = !sk;
      if (sk) ms.textContent = sk.icon + ' Kỹ năng ' + sk.name + ': ăn đủ ' + sk.need + ' lá rồi chạm đúp màn hình (máy tính bấm phím cách). Trong ' + sk.time + ' giây ' + sk.effects.join(', ') + '.';
    }
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
    // Kỹ năng nạp đầy: hai tiếng chuông nhỏ; dùng kỹ năng: tiếng vút lên lấp lánh; khiên đỡ một lá hụt: tiếng "boong" nhẹ.
    skillReady() {
      this.tone(this.freq(12), 0.18, 'sine', 0.14);
      this.tone(this.freq(14), 0.28, 'sine', 0.12, null, 0.09);
    },
    skill() {
      this.tone(520, 0.32, 'triangle', 0.12, 1560);
      this.arp([9, 12, 14, 16], 0.05, 'sine', 0.14, 0.32);
      this.noise(0.28, 3200, 1.4, 0.06);
    },
    shield() {
      this.tone(this.freq(9), 0.3, 'sine', 0.16, this.freq(7));
      this.noise(0.12, 2600, 2, 0.05);
    },
    // Đếm ngược hồi sinh: ba tiếng tách ở 3, 2, 1 và một tiếng cao, ngân hơn lúc vào nhạc.
    // Đi thẳng ra loa (không qua nút tắt âm hiệu ứng) vì đây là nhịp để vào lại bài.
    countTicks(t0, beat) {
      const ctx = this.ctx;
      const blip = (t, f, dur, vol, type) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f, t);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g);
        g.connect(this.master);
        o.start(t);
        o.stop(t + dur + 0.03);
      };
      for (let i = 0; i < 3; i++) {
        const t = t0 + i * beat;
        blip(t, 1046.5, 0.08, 0.16, 'square');
        blip(t, 523.25, 0.16, 0.34, 'sine');
      }
      const t = t0 + 3 * beat;
      blip(t, 1568, 0.42, 0.32, 'triangle');
      blip(t + 0.02, 2093, 0.34, 0.16, 'sine');
    },
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
      // quiet: đang bật kính lúp kỹ năng thì kính lúp của Nền Vạch Lá lui đi, cho khỏi lẫn
      Skins.drawBackdrop(g, LOOK.bg, { W, H, t: clock, dt, speed, dpr: DPR, night: weather === 'dem', st: BGST, quiet: LOOK.skill && LOOK.skill.look === 'lens' ? Game.skillK() : 0 });
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
    const pet = Game.state === 'menu' ? PET : null;
    g.save();
    g.translate(hx, hy);
    g.save();
    g.rotate(tilt);
    if (pet) pet.apply(g, r);
    Skins.drawHead(g, r, LOOK.skin, Object.assign({
      t: clock, ant: Sau.ant, bob: pulse, happy: Sau.happy, blink: Sau.blink, sad: Sau.sad, chew: Sau.chew, mouthOpen: Sau.mouthOpen,
    }, pet ? pet.face() : {}), S);
    g.restore();
    if (pet) {
      pet.drawFx(g, r, S);
      for (const e of pet.takeEvents()) petSound(e);
    }
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
  // Hết tim thì được dùng đốt cây hồi sinh, tối đa 3 lần mỗi ván: lần sau đắt hơn nhưng nhiều tim hơn.
  const REVIVE = [{ dot: 50, hearts: 1 }, { dot: 100, hearts: 2 }, { dot: 200, hearts: 3 }];
  const REWIND = 1.5; // giây nhạc lùi lại khi hồi sinh, để có đà vào lại
  const STAR_FLY = 0.75;
  const fmtRate = (r) => 'x' + r.toFixed(1).replace('.', ',');

  const Game = {
    state: 'menu', song: null, map: null, buffer: null, diff: Store.data.diff || 1,
    notes: [], beats: [], beatIdx: 0, noteHead: 0, drawStart: 0, holds: [],
    songT: 0, resync: true, lastEnd: 0, firstT: 0,
    loop: 0, rate: 1, maxRate: 1, loopStartCtx: 0, nextQueued: false, nextStart: 0, nextRate: 1,
    stars: 0, starFx: [], botOn: BOT,
    score: 0, combo: 0, maxCombo: 0, hearts: 3, perfect: 0, good: 0, miss: 0,
    revives: 0, downPos: 0, count: null, pendingPos: null,
    sk: { charge: 0, on: 0, ready: false, told: false, fx: null, hit: 0 },
    endT: 0, speed: 460, lead: 1.3, shake: 0, hintT: 0, resultShown: false, pulse: 0,

    setup() {
      const lvl = this.diff;
      this.notes = this.map.notes
        .filter((n) => n[3] <= lvl)
        .map((n) => ({ t: n[0], x: n[1], dur: n[2], state: 0, held: 0, eaten: [], cur: null, grow: 0, crunch: 0, vac: 0 }));
      this.beats = this.map.beats;
      this.resetNotes();
      this.score = 0; this.combo = 0; this.maxCombo = 0; this.hearts = 3; this.banked = 0; this.dotGot = 0;
      this.revives = 0; this.count = null; this.pendingPos = null;
      this.sk = { charge: 0, on: 0, ready: false, told: false, fx: null, hit: 0 };
      VAC.length = 0;
      UI.count(null);
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
        n.state = 0; n.held = 0; n.eaten = []; n.cur = null; n.grow = 0; n.crunch = 0; n.vac = 0;
        n.total = 0; n.bounce = 0; n.ticks = 0;
      }
      this.holds = [];
      VAC.length = 0;
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
      // Đang đếm ngược hồi sinh mà lỡ thoát app: quay lại thì đếm lại từ đầu (không mất đốt).
      if (this.pendingPos !== null) {
        const pos = this.pendingPos;
        this.pendingPos = null;
        Sound.ctx.resume().then(() => this.startCount(pos));
        return;
      }
      Sound.ctx.resume().then(() => { this.resync = true; this.state = 'play'; });
    },

    eat(n, perfect, book) {
      n.state = 1;
      const mult = (1 + Math.min(4, Math.floor(this.combo / 10)) * 0.5) * this.boost();
      const pts = Math.round((perfect ? 300 : 200) * mult);
      this.score += pts;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      if (perfect) this.perfect++; else this.good++;
      Sau.segs++;
      if (book) {
        // Gió Thơ: lá chạm trang sách; Nàng Thơ đứng yên đọc nên không nhai, chỉ mỉm cười.
        const b = bookPos();
        Sau.happy = Math.max(Sau.happy, 0.3);
        burstCrumbs(b.x, b.y, perfect ? 8 : 5);
        ring(b.x, b.y, LOOK.skill ? LOOK.skill.color : '#FF8FA3');
        popup('+' + pts, b.x + (Math.random() - 0.5) * 50 * S, b.y - bookW() * 0.95, GOLD());
      } else {
        Sau.chew = 0.24;
        Sau.gulp();
        if (perfect) Sau.happy = 0.35;
        const px = PX0 + n.x * PW;
        burstCrumbs(px, Sau.headY - HEAD_R * 0.6, perfect ? 9 : 6);
        if (perfect) ring(Sau.headX, Sau.headY, T.night ? '#8C6BC8' : '#D9C9F2');
        popup('+' + pts, Sau.headX, Sau.headY - HEAD_R * 2.2, this.boost() > 1 ? GOLD() : T.night ? '#FFF1C9' : '#3B2A4A');
      }
      Sound.eat(this.combo, perfect);
      buzz(8);
      if (n.dur > 0) { n.cur = [this.songT, this.songT]; n.eaten.push(n.cur); this.holds.push(n); }
      if (MILESTONES[this.combo]) { UI.toast(MILESTONES[this.combo]); Sound.milestone(); burstHearts(Sau.headX, Sau.headY - HEAD_R, 5); }
      if (this.combo % 30 === 0 && this.hearts < 3) {
        this.hearts++;
        UI.toast('+1 tim');
        Sound.heart();
      }
      this.chargeSkill();
      UI.hud(this, true);
    },

    // ----- Kỹ năng của skin -----
    // Mỗi lá ăn được nạp một nấc; đầy thì nút sáng, chạm đúp màn hình (hoặc phím cách, hoặc nút) để dùng.
    // Đang dùng thì không nạp. Hiệu ứng ở sk.fx (Tưng Tửng mỗi lần bốc một phép khác).
    chargeSkill() {
      const sk = LOOK.skill, K = this.sk;
      if (!sk || K.on > 0 || K.ready) return;
      K.charge = Math.min(sk.need, K.charge + 1);
      if (K.charge >= sk.need) {
        K.ready = true;
        Sound.skillReady();
        if (!K.told) { K.told = true; UI.toast(sk.icon + ' Chạm đúp để dùng ' + sk.name); }
      }
    },
    useSkill() {
      const sk = LOOK.skill, K = this.sk;
      if (!sk || !K.ready || this.state !== 'play') return;
      K.ready = false;
      K.charge = 0;
      K.on = sk.time;
      K.fx = sk.fx.rand ? Skins.SKILL_RAND[Math.floor(Math.random() * Skins.SKILL_RAND.length)] : sk.fx;
      if (K.fx.heal && this.hearts < 3) {
        this.hearts = Math.min(3, this.hearts + K.fx.heal);
        burstHearts(Sau.headX, Sau.headY - HEAD_R, 8);
        Sound.heart();
      }
      Sound.skill();
      buzz([12, 30, 12]);
      UI.toast(sk.icon + ' ' + sk.name + '!');
      skillBurst(18);
      ring(Sau.headX, Sau.headY, sk.color);
      UI.hud(this);
    },
    // Hiệu ứng đang bật (null nếu không dùng kỹ năng).
    skFx() { return this.sk.on > 0 ? this.sk.fx : null; },
    // Gió Thơ đang mở sách: bé đứng yên, kéo tay cũng không đi.
    reading() { const fx = this.skFx(); return !!(fx && fx.vacuum); },
    boost() { const fx = this.skFx(); return (fx && fx.score) || 1; },
    // Độ hiện của hình kỹ năng 0..1 (hiện dần lúc bật, mờ dần lúc sắp tắt).
    skillK() {
      const sk = LOOK.skill, K = this.sk;
      if (!sk || K.on <= 0) return 0;
      return clamp(Math.min((sk.time - K.on) / 0.25, K.on / 0.45), 0, 1);
    },
    // Bán kính đớp: mức Dễ rộng hơn một chút, kỹ năng có "wide" thì rộng thêm.
    catchR() {
      const fx = this.skFx();
      return CATCH_R * (this.diff === 1 ? 1.12 : 1) * ((fx && fx.wide) || 1);
    },

    lose(n) {
      n.state = 2;
      this.miss++;
      const fx = this.skFx();
      if (!(fx && fx.guard)) this.combo = 0;
      // Kỹ năng có khiên: lá hụt không làm mất tim.
      if (fx && fx.shield) {
        this.sk.hit = 1;
        Sound.shield();
        buzz(12);
        popup(fx.guard ? 'Không sao!' : 'Không mất tim!', Sau.headX, Sau.headY - HEAD_R * 2.4, PINK(), 18);
        UI.hud(this);
        return;
      }
      if (fx && fx.guard) popup('Giữ combo!', Sau.headX, Sau.headY - HEAD_R * 2.4, GOLD(), 16);
      this.hearts--;
      this.shake = REDUCED_MOTION ? 0 : 0.25;
      Sau.sad = 0.7;
      Sound.miss();
      buzz(30);
      UI.hud(this);
      // Đã đủ 3 sao thì hết tim vẫn là thắng: sâu hoá bướm. Chưa đủ thì mời hồi sinh (còn lượt).
      if (this.hearts <= 0) {
        if (this.stars >= 3) this.finish();
        else if (this.revives < REVIVE.length) this.down();
        else this.gameOver();
      }
    },

    // Hết tim: đứng hình, nhạc dừng đúng chỗ (để tiếng hụt kêu xong đã), mời dùng đốt cây hồi sinh.
    down() {
      this.state = 'down';
      this.downPos = this.songT - (this.song.offset || 0);
      setTimeout(() => { if (this.state === 'down') Sound.ctx.suspend(); }, 260);
      UI.showHint(false);
      UI.revive(this);
    },

    revive() {
      const step = REVIVE[this.revives];
      if (!step || this.state !== 'down') return;
      if (!window.Wallet || !Wallet.spend(step.dot)) { Sound.click(); UI.revive(this); return; }
      this.revives++;
      this.hearts = step.hearts;
      UI.hide('revive');
      UI.hud(this);
      Sau.sad = 0;
      Sau.happy = 0.6;
      burstHearts(Sau.headX, Sau.headY - HEAD_R, 6 + step.hearts * 2);
      // Nhạc lùi lại một chút để có đà; lá trong đoạn đó đã tính rồi nên không bị trừ tim lần nữa.
      // iPhone cần một nhịp để bật lại âm thanh: chờ chạy hẳn rồi mới hẹn giờ đếm, kẻo mất tiếng.
      const pos = Math.max(this.map.start, this.downPos - REWIND);
      this.state = 'count';
      this.count = null;
      const ctx = Sound.ctx;
      const start = () => { if (this.state === 'count' && !this.count) { Sound.heart(); this.startCount(pos); } };
      if (ctx.state === 'running') start();
      else { ctx.resume().then(start, start); setTimeout(start, 800); }
    },

    // Đếm 3, 2, 1 theo nhịp bài (mỗi số một hoặc hai phách) rồi nhạc vào đúng lúc hô "Ăn thôi!".
    // Tiếng đếm và nhạc hẹn giờ cùng trên đồng hồ âm thanh nên khớp nhau tuyệt đối.
    startCount(pos) {
      const ctx = Sound.ctx;
      Sound.stopMusic();
      this.nextQueued = false;
      this.songT = pos + (this.song.offset || 0);
      let beat = 60 / (this.map.bpm || 90) / this.rate;
      while (beat < 0.55) beat *= 2;
      while (beat > 1.1) beat /= 2;
      const t0 = ctx.currentTime + 0.3;
      const go = t0 + beat * 3;
      Sound.countTicks(t0, beat);
      Sound.playSection(this.buffer, pos, this.map.end - pos, go, this.rate, 0.2);
      this.loopStartCtx = go - (pos - this.map.start) / this.rate;
      this.count = { pos, t0, beat, go, shown: -1 };
      this.state = 'count';
    },

    countTick() {
      const c = this.count;
      if (!c) return;
      const now = Sound.now();
      const k = Math.floor((now - c.t0) / c.beat);
      if (k >= 0 && k < 3 && k !== c.shown) {
        c.shown = k;
        UI.count(3 - k, c.beat);
        buzz(12);
      }
      if (now >= c.go) {
        this.count = null;
        this.resync = true;
        this.state = 'play';
        UI.count(0, c.beat);
        setTimeout(() => { if (!this.count) UI.count(null); }, Math.round(c.beat * 900));
      }
    },

    // Thoát app giữa lúc đếm: dừng hẳn, quay lại bấm "Chơi tiếp" thì đếm lại.
    holdCount() {
      if (this.state !== 'count') return;
      this.pendingPos = this.count.pos;
      this.count = null;
      Sound.stopMusic();
      Sound.ctx.suspend();
      UI.count(null);
      this.state = 'paused';
      UI.show('pause');
    },

    giveUp() {
      if (this.state !== 'down') return;
      UI.hide('revive');
      Sound.stopMusic();
      Sound.ctx.resume();
      this.gameOver(true);
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
        if (this.botOn && !this.reading()) this.bot();
        if (this.reading()) Sau.target = Sau.headX;
        const K = this.sk;
        if (K.on > 0) {
          K.on = Math.max(0, K.on - dt);
          K.hit = Math.max(0, K.hit - dt * 2.5);
          // Khoá Sóng: tự lướt tới lá
          if (K.fx && K.fx.auto) this.bot();
          if (Math.random() < dt * 7) { if (K.fx && K.fx.vacuum) bookSpark(); else skillBurst(1); }
          UI.skill(this);
        }
        if (this.botOn && K.ready) this.useSkill();
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
        if (PET) PET.update(dt);
        // đang được chạm, vuốt thì đứng yên cho dễ cưng
        if (PET && PET.busy()) Sau.target = Sau.headX;
        else Sau.target = PX0 + PW * (0.5 + 0.26 * Math.sin(clock * 0.9));
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
      // Mức Dễ: vùng đớp rộng hơn một chút; kính lúp đang bật thì rộng thêm.
      const R = this.catchR();
      // Gió Thơ: quyển sách giữa màn bắt mọi lá đang có trên màn, cả cành dài (state 3, n.vac = lúc bắt).
      // Lá vẫn bay tới sách đúng nhịp của nó (xem vacPos) nên tới nhịp mới tính ăn, tiếng ăn khớp nhạc.
      if (this.reading()) {
        const lead = Sau.headY / this.speed + 0.3;
        for (let i = this.noteHead; i < notes.length; i++) {
          const n = notes[i];
          if (n.t - t > lead) break;
          if (n.state !== 0) continue;
          n.state = 3;
          n.vac = t;
          VAC.push(n);
        }
      }
      for (let i = VAC.length - 1; i >= 0; i--) {
        const n = VAC[i];
        if (t < n.t) continue;
        VAC.splice(i, 1);
        if (n.state === 3) this.eat(n, true, true);
        if (this.state !== 'play') return;
      }
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
        const inside = n.vac ? true : Math.abs(Sau.headX - (PX0 + n.x * PW)) <= R * 0.95;
        const bx = n.vac ? bookPos().x : Sau.headX, by = n.vac ? bookPos().y - bookW() * 0.6 : Sau.headY - HEAD_R * 1.6;
        const now = Math.min(t, end);
        if (inside) {
          if (!n.cur) { n.cur = [now, now]; n.eaten.push(n.cur); }
          n.cur[1] = now;
          n.held += dt;
          n.grow += dt;
          n.crunch += dt;
          if (!n.vac) Sau.chew = Math.max(Sau.chew, 0.1);
          if (n.grow >= beatLen) { n.grow -= beatLen; Sau.segs++; if (!n.vac) Sau.gulp(); }
          if (n.crunch >= 0.12) {
            // Mỗi miếng cắn trên cành dài: điểm nhỏ nảy lên, cộng dồn vào bong bóng tổng.
            n.crunch = 0;
            const pts = Math.round(25 * (1 + Math.min(4, Math.floor(this.combo / 10)) * 0.5) * this.boost());
            n.total = (n.total || 0) + pts;
            n.bounce = 1;
            this.score += pts;
            popup('+' + pts, bx + (Math.random() - 0.5) * 50 * S, by,
              (n.ticks = (n.ticks || 0) + 1) % 2 ? GOLD() : PINK(), 14, (Math.random() - 0.5) * 70 * S);
            Sound.bite((now - n.t) / Math.max(0.01, n.dur));
            burstCrumbs(bx, n.vac ? bookPos().y : Sau.headY - HEAD_R * 0.6, 2);
            UI.hud(this);
          }
        } else {
          n.cur = null;
        }
        if (n.bounce) n.bounce = Math.max(0, n.bounce - dt * 6);
        if (t >= end) {
          const ratio = clamp(n.held / Math.max(0.01, n.dur), 0, 1);
          const bonus = Math.round(ratio * 400 * this.boost());
          this.score += bonus;
          const total = (n.total || 0) + bonus;
          const ex = n.vac ? bookPos().x : Sau.headX, ey = n.vac ? bookPos().y - bookW() * 1.3 : Sau.headY - HEAD_R * 4;
          if (total > 0) popup('+' + total.toLocaleString('vi-VN'), ex, ey, GOLD(), 26);
          if (ratio > 0.8) {
            popup(n.vac ? 'Thơ quá!' : 'Ngon!', ex, ey - HEAD_R * 1.4, PINK(), 20);
            burstHearts(ex, n.vac ? bookPos().y : Sau.headY - HEAD_R, 4);
            burstSparks(ex, n.vac ? bookPos().y : Sau.headY - HEAD_R * 2.5, 10, '#FFC24B');
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

    // quick: hiện kết quả ngay (bấm "Thôi, xem kết quả"), không chờ bé sâu buồn xong.
    gameOver(quick) {
      this.state = 'over';
      Sound.fadeOutMusic(1.2);
      Sound.lose();
      UI.showHint(false);
      const show = () => {
        if (this.state !== 'over' || this.resultShown) return;
        this.resultShown = true;
        UI.result(false, this);
      };
      if (quick) show(); else setTimeout(show, 900);
    },
  };

  // ================= Hình kỹ năng =================
  // Lá (và cành dài) bị quyển sách Gió Thơ bắt, chờ tới nhịp để tính ăn.
  const VAC = [];
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1, 7), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  // Hạt của kỹ năng bung quanh đầu bé (loại hạt, màu theo từng skin); n = 1 là lấp lánh nhẹ lúc đang dùng.
  function skillBurst(n) {
    const sk = LOOK.skill;
    if (!sk) return;
    const size = sk.burst === 14 || sk.burst === 16 ? 12 : sk.burst === 17 ? 4.6 : 3.8;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
      const sp = (n > 1 ? 90 + Math.random() * 170 : 25 + Math.random() * 45) * S;
      const x = Sau.headX + (n > 1 ? 0 : (Math.random() - 0.5) * 70 * S);
      spawn(sk.burst, x, Sau.headY - HEAD_R * (n > 1 ? 0.6 : 0.1), Math.cos(a) * sp, Math.sin(a) * sp, 0.6 + Math.random() * 0.5, size * S, i % 3 ? sk.color : '#FFF1C9');
    }
  }
  // Quyển sách Gió Thơ mở ra giữa màn chơi.
  const bookPos = () => ({ x: PX0 + PW / 2, y: H * 0.4 });
  const bookW = () => Math.min(PW * 0.2, 92 * S);
  // Vị trí một chiếc lá đang bị hút: rơi như thường, tới VAC_A giây cuối trước nhịp của nó thì xoáy dần
  // về quyển sách và chạm trang đúng nhịp (s: 0 = chưa hút, 1 = đã vào sách).
  const VAC_A = 0.9;
  function vacPos(x, tau, t0, t, b, seed) {
    const s0 = Math.max(t0, tau - VAC_A);
    const s = clamp((t - s0) / Math.max(0.05, tau - s0), 0, 1);
    const e = s * s * (3 - 2 * s);
    const yNat = Sau.headY - (tau - t) * Game.speed;
    const sw = Math.sin(s * Math.PI) * 48 * S * (1 - e);
    const a = seed + s * 6.5;
    return { x: lerp(x, b.x, e) + Math.cos(a) * sw, y: lerp(yNat, b.y, e) + Math.sin(a) * sw * 0.45, s };
  }
  // Chữ, trang giấy bay lên từ quyển sách.
  function bookSpark() {
    const b = bookPos(), w = bookW(), sk = LOOK.skill;
    const kind = Math.random() < 0.6 ? 14 : 13;
    spawn(kind, b.x + (Math.random() - 0.5) * w * 1.4, b.y - w * 0.3, (Math.random() - 0.5) * 50 * S, -(40 + Math.random() * 50) * S,
      0.9 + Math.random() * 0.5, (kind === 14 ? 13 : 4) * S, kind === 13 ? '#FFFBF2' : (sk ? sk.color : '#FF8FA3'));
  }
  function nextLeaf() {
    const t = Game.songT;
    for (let i = Game.noteHead; i < Game.notes.length; i++) {
      const n = Game.notes[i];
      if (n.state === 0 && n.t - t > -0.05) return n;
    }
    return null;
  }
  // Vùng đớp đang mở rộng: vòng nét đứt dẹt quanh đầu, bề ngang đúng bằng vùng đớp.
  function drawWideRing(k, sk) {
    const r = Game.catchR(), x = Sau.headX, y = Sau.headY;
    g.save();
    g.globalAlpha = 0.14 * k;
    g.fillStyle = sk.color;
    g.beginPath(); g.ellipse(x, y, r, r * 0.34, 0, 0, TAU); g.fill();
    g.globalAlpha = 0.8 * k;
    g.strokeStyle = sk.color;
    g.lineWidth = 2.6 * S;
    g.setLineDash([7 * S, 6 * S]);
    g.lineDashOffset = -clock * 30 * S;
    g.beginPath(); g.ellipse(x, y, r, r * 0.34, 0, 0, TAU); g.stroke();
    g.setLineDash([]);
    g.restore();
  }
  // Khiên: bong bóng trong suốt quanh đầu, đỡ một lá hụt thì loé sáng.
  function drawShield(k, sk) {
    const hit = Game.sk.hit, r = HEAD_R * 1.9 * (1 + 0.08 * hit), x = Sau.headX, y = Sau.headY - HEAD_R * 0.2;
    g.save();
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,' + 0.2 * k + ')');
    gr.addColorStop(0.7, hexA(sk.color, 0.08 * k));
    gr.addColorStop(1, hexA(sk.color, (0.3 + 0.5 * hit) * k));
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = hexA(sk.color, (0.65 + 0.35 * hit) * k);
    g.lineWidth = (2 + 3 * hit) * S;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,' + 0.7 * k + ')';
    g.lineWidth = 2.4 * S;
    g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r * 0.78, Math.PI * 1.15, Math.PI * 1.4); g.stroke();
    g.restore();
  }
  // Điểm nhân: huy hiệu "×2" bồng bềnh cạnh đầu.
  function drawScoreBadge(k, mult) {
    const x = Sau.headX + HEAD_R * 1.7, y = Sau.headY - HEAD_R * 1.9 + Math.sin(clock * 4) * 2 * S;
    g.save();
    g.globalAlpha = k;
    g.font = '700 ' + Math.round(16 * S) + 'px "Be Vietnam Pro", system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = 4 * S;
    g.strokeStyle = 'rgba(43,33,64,0.75)';
    const txt = '×' + String(mult).replace('.', ',');
    g.strokeText(txt, x, y);
    g.fillStyle = '#FFC24B';
    g.fillText(txt, x, y);
    g.restore();
  }
  // Tự lướt (Khoá Sóng): tia sóng nối đầu bé với chiếc lá đang nhắm, có vòng ngắm trên lá.
  function drawBeam(k, sk) {
    const n = Game.holds.length ? Game.holds[0] : nextLeaf();
    if (!n) return;
    const tx = PX0 + n.x * PW, ty = Math.max(30 * S, Sau.headY - Math.max(0, n.t - Game.songT) * Game.speed);
    g.save();
    g.globalAlpha = 0.75 * k;
    g.strokeStyle = sk.color;
    g.lineWidth = 2 * S;
    g.setLineDash([3 * S, 7 * S]);
    g.lineDashOffset = -clock * 50 * S;
    g.beginPath(); g.moveTo(Sau.headX, Sau.headY - HEAD_R); g.lineTo(tx, ty); g.stroke();
    g.setLineDash([]);
    const rr = 15 * S;
    g.lineWidth = 2.2 * S;
    g.beginPath(); g.arc(tx, ty, rr, 0, TAU); g.stroke();
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + clock * 2;
      g.moveTo(tx + Math.cos(a) * rr * 0.6, ty + Math.sin(a) * rr * 0.6);
      g.lineTo(tx + Math.cos(a) * rr * 1.35, ty + Math.sin(a) * rr * 1.35);
    }
    g.stroke();
    g.restore();
  }
  // Sóng (Vi Mạch): ba vòng sóng toả lên từ đầu bé.
  function drawWaves(k, sk) {
    g.save();
    g.strokeStyle = sk.color;
    g.lineWidth = 2.4 * S;
    g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const q = (clock * 0.9 + i / 3) % 1;
      g.globalAlpha = (1 - q) * 0.75 * k;
      g.beginPath(); g.arc(Sau.headX, Sau.headY - HEAD_R * 0.8, HEAD_R * (1.4 + q * 5.5), Math.PI * 1.12, Math.PI * 1.88); g.stroke();
    }
    g.restore();
  }
  // Quyển sách (Nàng Thơ): mở ra giữa màn, quầng sáng, gió xoáy hút vào, trang lật phần phật, dải lụa đánh dấu.
  function drawBook(k, sk) {
    const b = bookPos(), w = bookW() * (0.75 + 0.25 * k), h = w * 0.78;
    g.save();
    g.globalAlpha = k;
    const gl = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, w * 2.6);
    gl.addColorStop(0, hexA(sk.color, 0.42));
    gl.addColorStop(0.5, hexA(sk.color, 0.14));
    gl.addColorStop(1, hexA(sk.color, 0));
    g.fillStyle = gl;
    g.beginPath(); g.arc(b.x, b.y, w * 2.6, 0, TAU); g.fill();
    // gió xoáy: các vệt cong quay vào tâm sách
    g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a = -clock * 2.6 + (i * TAU) / 5, r = w * (1.25 + 0.22 * ((i * 3) % 5));
      g.strokeStyle = hexA(i % 2 ? '#FFFFFF' : sk.color, 0.45);
      g.lineWidth = (2.6 - 0.3 * i) * S;
      g.beginPath(); g.arc(b.x, b.y, r, a, a + 0.9); g.stroke();
    }
    // bìa sách
    g.fillStyle = '#B8405E';
    g.beginPath();
    g.moveTo(b.x - w * 1.06, b.y - h * 0.5); g.lineTo(b.x + w * 1.06, b.y - h * 0.5);
    g.lineTo(b.x + w * 1.06, b.y + h * 0.56); g.quadraticCurveTo(b.x, b.y + h * 0.4, b.x - w * 1.06, b.y + h * 0.56);
    g.closePath();
    g.fill();
    g.fillStyle = '#D6455E';
    g.fillRect(b.x - 2.5 * S, b.y + h * 0.3, 5 * S, h * 0.85);
    // hai trang mở
    for (const side of [-1, 1]) {
      g.fillStyle = '#FFFBF2';
      g.strokeStyle = '#D9B26A';
      g.lineWidth = 1.4 * S;
      g.beginPath();
      g.moveTo(b.x, b.y - h * 0.36);
      g.quadraticCurveTo(b.x + side * w * 0.5, b.y - h * 0.62, b.x + side * w, b.y - h * 0.46);
      g.lineTo(b.x + side * w, b.y + h * 0.44);
      g.quadraticCurveTo(b.x + side * w * 0.5, b.y + h * 0.28, b.x, b.y + h * 0.5);
      g.closePath();
      g.fill();
      g.stroke();
      g.strokeStyle = 'rgba(122,90,138,0.45)';
      g.lineWidth = 1.3 * S;
      g.beginPath();
      for (let j = 0; j < 4; j++) {
        const yy = b.y - h * 0.22 + j * h * 0.17;
        g.moveTo(b.x + side * w * 0.14, yy); g.lineTo(b.x + side * w * (j === 3 ? 0.55 : 0.84), yy - h * 0.05);
      }
      g.stroke();
    }
    // trang đang lật từ phải sang trái
    const ph = (clock * 1.5) % 1, cx = Math.cos(ph * Math.PI);
    g.fillStyle = 'rgba(255,244,224,0.92)';
    g.strokeStyle = '#D9B26A';
    g.beginPath();
    g.moveTo(b.x, b.y - h * 0.36);
    g.quadraticCurveTo(b.x + cx * w * 0.5, b.y - h * (0.62 + 0.25 * Math.sin(ph * Math.PI)), b.x + cx * w, b.y - h * 0.46);
    g.lineTo(b.x + cx * w, b.y + h * 0.44);
    g.quadraticCurveTo(b.x + cx * w * 0.5, b.y + h * 0.28, b.x, b.y + h * 0.5);
    g.closePath();
    g.fill();
    g.stroke();
    // tâm sách sáng lên nơi lá bay vào
    const core = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, w * 0.5);
    core.addColorStop(0, 'rgba(255,255,255,' + (0.55 + 0.25 * (Game.pulse || 0)) + ')');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = core;
    g.beginPath(); g.arc(b.x, b.y, w * 0.5, 0, TAU); g.fill();
    g.restore();
  }
  // Lá đang bị hút: lá thường xoáy vào sách và nhỏ dần; cành dài thành một dải lá nối đuôi lượn vào sách.
  function drawVac(n, x, t) {
    const b = bookPos();
    if (n.dur > 0) {
      const stepT = (24 * S) / Game.speed, pts = [];
      for (let k = 0; ; k++) {
        const tau = n.t + k * stepT;
        if (tau > n.t + n.dur + 1e-6) break;
        if (tau <= t) continue;
        const p = vacPos(x, tau, n.vac, t, b, n.x * 9 + k * 0.32);
        if (p.s === 0 && p.y < -40 * S) break;
        pts.push(p);
      }
      if (!pts.length) return;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = T.stem;
      g.lineWidth = 5 * S;
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (const p of pts) g.lineTo(p.x, p.y);
      g.stroke();
      const lw = SPR.leafW * 0.55, lh = SPR.leafH * 0.55;
      pts.forEach((p, k) => {
        const sc = 1 - 0.6 * p.s;
        g.save();
        g.translate(p.x, p.y);
        g.rotate((k % 2 ? 0.9 : -0.9) + p.s * 6);
        g.drawImage(SPR.leaf, (-lw * sc) / 2, -SPR.leafCY * 0.55 * sc, lw * sc, lh * sc);
        g.restore();
      });
      return;
    }
    if (n.state === 1) return;
    const p = vacPos(x, n.t, n.vac, t, b, n.x * 9);
    if (p.s >= 1) return;
    const sc = 1 - 0.65 * p.s;
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.s * 7);
    g.drawImage(SPR.leaf, (-SPR.leafW * sc) / 2, -SPR.leafCY * sc, SPR.leafW * sc, SPR.leafH * sc);
    g.restore();
  }

  // ================= Vẽ màn chơi =================
  // Kính lúp lơ lửng ngay trên đầu bé sâu, bề ngang đúng bằng vùng đớp: lá nào rơi lọt qua kính là ăn được.
  function lensGeom(k) {
    const r = Game.catchR() * (0.82 + 0.18 * k);
    return { x: Sau.headX, y: Sau.headY - HEAD_R * 1.5 - r, r, k };
  }
  // Mặt kính và cán gỗ vẽ phía sau lá; viền vàng vẽ đè lên sau.
  function drawLensBack(L) {
    g.save();
    g.globalAlpha = L.k;
    const gr = g.createRadialGradient(L.x - L.r * 0.3, L.y - L.r * 0.3, 0, L.x, L.y, L.r);
    gr.addColorStop(0, T.night ? 'rgba(255,240,200,0.22)' : 'rgba(255,255,255,0.4)');
    gr.addColorStop(1, T.night ? 'rgba(160,200,255,0.1)' : 'rgba(170,215,255,0.2)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(L.x, L.y, L.r, 0, TAU); g.fill();
    const a = Math.PI * 0.25;
    const x0 = L.x + Math.cos(a) * L.r, y0 = L.y + Math.sin(a) * L.r;
    const x1 = L.x + Math.cos(a) * L.r * 1.7, y1 = L.y + Math.sin(a) * L.r * 1.7;
    g.lineCap = 'round';
    g.strokeStyle = '#3A2414';
    g.lineWidth = 12 * S;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = '#7A4E2C';
    g.lineWidth = 8 * S;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.restore();
  }
  function drawLensFront(L) {
    g.save();
    g.globalAlpha = L.k;
    const arc = (r, a0, a1, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(L.x, L.y, r, a0, a1); g.stroke(); };
    // quầng sáng nhịp theo nhạc để biết đây là kính lúp kỹ năng
    const halo = g.createRadialGradient(L.x, L.y, L.r * 0.9, L.x, L.y, L.r * 1.35);
    halo.addColorStop(0, 'rgba(255,194,75,' + (0.32 + 0.25 * (Game.pulse || 0)) + ')');
    halo.addColorStop(1, 'rgba(255,143,163,0)');
    g.fillStyle = halo;
    g.beginPath(); g.arc(L.x, L.y, L.r * 1.35, 0, TAU); g.arc(L.x, L.y, L.r * 0.9, 0, TAU, true); g.fill();
    arc(L.r + 2 * S, 0, TAU, 8 * S, 'rgba(0,0,0,0.22)');
    arc(L.r, 0, TAU, 5.5 * S, '#D9A441');
    arc(L.r + 1 * S, Math.PI * 1.05, Math.PI * 1.6, 1.6 * S, '#FFE39A');
    arc(L.r * 0.72, Math.PI * 1.1, Math.PI * 1.42, 3 * S, 'rgba(255,255,255,0.6)');
    // vòng hồng bên trong viền: còn bao lâu
    g.lineCap = 'round';
    const left = Game.sk.on / LOOK.skill.time;
    arc(L.r - 6 * S, -Math.PI / 2, -Math.PI / 2 + TAU * left, 2.6 * S, '#FF8FA3');
    g.restore();
  }
  function footprints(x, y, s) {
    for (const [ox, oy, a] of [[-s * 0.75, s * 0.4, -0.25], [s * 0.75, -s * 0.4, 0.25]]) {
      g.beginPath(); g.ellipse(x + ox, y + oy, s * 0.45, s * 0.72, a, 0, TAU); g.fill();
      g.beginPath(); g.arc(x + ox + a * s, y + oy - s * 1.1, s * 0.28, 0, TAU); g.fill();
    }
  }
  // Dấu chân chỉ chỗ mấy lá sắp rơi (kể cả lá chưa hiện trên màn): vòng vàng thu nhỏ dần khi lá tới gần,
  // và một vệt dấu chân từ đầu bé sâu tới chỗ lá gần nhất.
  function drawMarks(k, sk) {
    const t = Game.songT, notes = Game.notes, y = Sau.headY, col = sk.color;
    let shown = 0, first = null;
    g.save();
    for (let i = Game.noteHead; i < notes.length && shown < 3; i++) {
      const n = notes[i];
      if (n.state !== 0) continue;
      const ahead = n.t - t;
      if (ahead < -0.05) continue;
      if (ahead > 2.4) break;
      const x = PX0 + n.x * PW;
      const q = clamp(1 - ahead / 2.4, 0, 1);
      const rr = (13 + 18 * (1 - q)) * S;
      g.globalAlpha = k * (shown === 0 ? 1 : shown === 1 ? 0.65 : 0.4) * (0.5 + 0.5 * q);
      if (shown === 0) { g.fillStyle = hexA(col, 0.18); g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
      g.strokeStyle = col;
      g.lineWidth = (shown === 0 ? 3.2 : 2.4) * S;
      g.beginPath(); g.arc(x, y, rr, 0, TAU); g.stroke();
      g.fillStyle = col;
      footprints(x, y, 4 * S);
      if (first === null) first = x;
      shown++;
    }
    if (first !== null) {
      const dx = first - Sau.headX, step = 18 * S, cnt = Math.floor(Math.abs(dx) / step);
      g.fillStyle = col;
      for (let j = 1; j < cnt; j++) {
        g.globalAlpha = k * 0.5 * (1 - j / (cnt + 2));
        const px = Sau.headX + Math.sign(dx) * j * step, py = y + HEAD_R * 1.3 + (j % 2 ? -4 : 4) * S;
        g.beginPath(); g.ellipse(px, py, 2.6 * S, 4 * S, Math.sign(dx) * 1.2, 0, TAU); g.fill();
      }
    }
    g.restore();
  }
  function drawNotes(LZ) {
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
      if (n.vac) { drawVac(n, x, t); continue; }
      const yBottom = hy - ahead * v;
      if (n.dur > 0) drawStalk(n, x, yBottom, t, v, hy);
      if (n.state === 1 || n.state === 3) continue;
      let sc = 1 + Game.pulse * 0.08;
      // lá đang ở trong kính lúp thì to ra
      if (LZ) {
        const d = Math.hypot(x - LZ.x, yBottom - lh * 0.35 - LZ.y);
        sc *= 1 + 0.45 * LZ.k * clamp((LZ.r - d) / (LZ.r * 0.3), 0, 1);
      }
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
    const playing = Game.state === 'play' || Game.state === 'paused' || Game.state === 'over' || Game.state === 'down' || Game.state === 'count';
    const still = Game.state === 'paused' || Game.state === 'down' || Game.state === 'count';
    // Tốc độ thật trên màn hình (px/giây) tăng theo vòng nhanh.
    const wallSpeed = Game.speed * Game.rate;
    drawBackground(still ? 0 : dt, wallSpeed, Game.pulse || 0);
    const sk = LOOK.skill;
    const lk = playing && sk ? Game.skillK() : 0;
    const fx = lk > 0 ? Game.sk.fx : null;
    const LZ = fx && sk.look === 'lens' ? lensGeom(lk) : null;
    if (LZ) drawLensBack(LZ);
    const bookK = playing && sk && sk.fx.vacuum ? Math.max(lk, VAC.length ? 0.85 : 0) : 0;
    if (bookK > 0) drawBook(bookK, sk);
    if (playing) drawNotes(LZ);
    if (LZ) drawLensFront(LZ);
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
      if (fx) {
        if (fx.wide && !LZ) drawWideRing(lk, sk);
        if (fx.foresight) drawMarks(lk, sk);
        if (fx.auto) drawBeam(lk, sk);
        if (sk.look === 'waves') drawWaves(lk, sk);
      }
      drawSau(wallSpeed, Game.pulse || 0, 0);
      if (fx && fx.shield) drawShield(lk, sk);
      if (fx && fx.score > 1) drawScoreBadge(lk, fx.score);
      drawStarFx();
    }
    drawParticles();
    drawPopups(still ? 0 : dt);
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
  const SK_LEN = 2 * Math.PI * 29; // chu vi vòng nạp trên nút kỹ năng (r = 29 trong viewBox 64)
  const UI = {
    els: {
      hud: $('hud'), menu: $('menu'), pause: $('pause'), result: $('result'), revive: $('revive'), hint: $('hint'), toast: $('toast'),
      score: $('score'), scoreBox: $('score').parentElement, length: $('length'), hearts: $('hearts'), combo: $('combo'), comboNum: $('combo-num'),
      progress: $('progress-fill'), songs: $('songs'), pstars: $('pstars'), speed: $('speed'), wallet: $('wallet'),
      skill: $('skill'), skillFill: $('skill-fill'), skillIc: $('skill-ic'),
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
      this.skill(gm);
    },
    // Nút kỹ năng: biểu tượng của skin, vòng màu nạp dần theo số lá, đầy thì sáng; đang dùng thì vòng lùi dần.
    skill(gm) {
      const el = this.els.skill, sk = LOOK.skill;
      if (el.hidden !== !sk) el.hidden = !sk;
      if (!sk) return;
      if (this.last.skId !== sk.id) {
        this.els.skillIc.textContent = sk.icon;
        el.style.setProperty('--sk', sk.color);
        this.last.skId = sk.id;
      }
      const K = gm.sk;
      const st = K.on > 0 ? 'on' : K.ready ? 'ready' : '';
      if (this.last.skSt !== st) {
        el.classList.toggle('ready', st === 'ready');
        el.classList.toggle('on', st === 'on');
        el.setAttribute('aria-label', st === 'ready' ? 'Dùng kỹ năng ' + sk.name : st === 'on' ? 'Đang dùng ' + sk.name : sk.name + ' đang nạp');
        this.last.skSt = st;
      }
      const p = Math.round((K.on > 0 ? K.on / sk.time : K.charge / sk.need) * 200) / 200;
      if (this.last.skP !== p) { this.els.skillFill.style.strokeDashoffset = (SK_LEN * (1 - p)).toFixed(1); this.last.skP = p; }
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

    revive(gm) {
      const i = gm.revives, step = REVIVE[i];
      const dot = window.Wallet ? Wallet.get().dot : 0;
      const box = $('rv-hearts');
      box.replaceChildren();
      for (let k = 0; k < step.hearts; k++) box.appendChild(svgIcon(PATH_HEART));
      $('rv-title').textContent = i === REVIVE.length - 1 ? 'Cơ hội cuối cùng!' : 'Hết tim rồi!';
      $('rv-msg').textContent = 'Dùng ' + step.dot + ' đốt cây để hồi sinh với ' + step.hearts + ' tim, chơi tiếp từ chỗ vừa rồi nha?';
      const steps = $('rv-steps');
      steps.replaceChildren();
      REVIVE.forEach((r, j) => {
        const li = document.createElement('li');
        li.className = j < i ? 'used' : j === i ? 'now' : '';
        const b = document.createElement('b');
        b.textContent = '+' + r.hearts + ' tim';
        li.append(b, r.dot + ' đốt');
        li.setAttribute('aria-label', 'Lần ' + (j + 1) + ': ' + r.dot + ' đốt được ' + r.hearts + ' tim' + (j < i ? ', đã dùng' : ''));
        steps.appendChild(li);
      });
      const ok = dot >= step.dot;
      const btn = $('btn-revive');
      btn.disabled = !ok;
      btn.textContent = 'Hồi sinh · ' + step.dot + ' đốt';
      const need = $('rv-need');
      need.hidden = false;
      need.textContent = ok ? 'Ví đang có ' + fmtNum(dot) + ' đốt cây' : 'Em đang có ' + fmtNum(dot) + ' đốt, còn thiếu ' + fmtNum(step.dot - dot) + ' đốt nữa.';
      need.classList.toggle('short', !ok);
      this.show('revive');
      (ok ? btn : $('btn-giveup')).focus({ preventScroll: true });
    },
    // n: 3, 2, 1; 0 là "Ăn thôi!"; null là ẩn.
    count(n, beat) {
      const el = $('count'), b = $('count-num');
      if (n === null) { el.hidden = true; return; }
      el.hidden = false;
      b.textContent = n ? String(n) : 'Ăn thôi!';
      b.className = n ? '' : 'go';
      b.style.setProperty('--beat', (beat || 0.7) + 's');
      void b.offsetWidth;
      b.classList.add('tick');
    },

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
  const lastTap = { t: 0, x: 0, y: 0 };
  // Màn chọn bài: chạm, vuốt, giữ lâu bé sâu có tính cách để xem bé phản ứng.
  let petId = null;
  function petSound(e) {
    if (e === 'squish' || e === 'heart' || e === 'pet') Sound.tone(784 + Math.random() * 260, 0.12, 'sine', 0.12);
    else if (e === 'pout' || e === 'grumpy') { Sound.tone(300, 0.12, 'triangle', 0.16); Sound.tone(240, 0.16, 'triangle', 0.14, null, 0.08); }
    else if (e === 'teary') { Sound.tone(587, 0.22, 'sine', 0.12); Sound.tone(494, 0.3, 'sine', 0.12, null, 0.16); }
    else { Sound.tone(988, 0.08, 'triangle', 0.14); Sound.tone(1319, 0.12, 'sine', 0.1, null, 0.07); }
    buzz(8);
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (Game.state === 'menu' && PET) {
      if (PET.pointer('down', e.clientX - Sau.headX, e.clientY - Sau.headY, HEAD_R)) {
        Sound.unlock();
        petId = e.pointerId;
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
      }
      return;
    }
    if (Game.state !== 'play') return;
    // Chạm đúp (hai lần trong 0,33 giây, gần chỗ nhau) là dùng kỹ năng: chơi một tay vẫn bấm được.
    // Kéo là kéo tương đối nên hai cái chạm không làm bé sâu xê dịch.
    const now = performance.now();
    if (now - lastTap.t < 330 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 80 * S) { lastTap.t = 0; Game.useSkill(); }
    else { lastTap.t = now; lastTap.x = e.clientX; lastTap.y = e.clientY; }
    dragId = e.pointerId;
    lastPX = e.clientX;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
    if (Game.hintT > 0) Game.hintT = Math.min(Game.hintT, 0.6);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (petId !== null && e.pointerId === petId && PET) { PET.pointer('move', e.clientX - Sau.headX, e.clientY - Sau.headY, HEAD_R); return; }
    if (Game.state !== 'play') return;
    if (e.pointerType === 'mouse' && dragId === null) {
      if (!Game.reading()) Sau.target = clamp(e.clientX, PX0 + 18 * S, PX0 + PW - 18 * S);
      return;
    }
    if (e.pointerId !== dragId) return;
    if (!Game.reading()) Sau.target = clamp(Sau.target + (e.clientX - lastPX) * SENS, PX0 + 18 * S, PX0 + PW - 18 * S);
    lastPX = e.clientX;
  });
  const endDrag = (e) => {
    if (petId !== null && e.pointerId === petId) { if (PET) PET.pointer('up', e.clientX - Sau.headX, e.clientY - Sau.headY, HEAD_R); petId = null; }
    if (e.pointerId === dragId) dragId = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  const keys = { left: false, right: false };
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    else if (e.key === 'ArrowRight') keys.right = true;
    else if ((e.key === 'Escape' || e.key === 'p') && Game.state === 'play') Game.pause();
    else if ((e.key === ' ' || e.key === 'k') && Game.state === 'play') { e.preventDefault(); Game.useSkill(); }
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
    Game.holdCount();
    // Lỡ tắt app giữa chừng thì điểm đã ăn vẫn vào ví.
    if (Game.state === 'paused' || Game.state === 'down') bank();
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
  $('btn-revive').addEventListener('click', () => Game.revive());
  // Nút kỹ năng: bấm xuống là dùng ngay (không chờ nhấc tay).
  $('skill').addEventListener('pointerdown', (e) => { e.preventDefault(); Game.useSkill(); });
  $('skill').addEventListener('click', () => Game.useSkill());
  $('btn-giveup').addEventListener('click', () => { Sound.click(); Game.giveUp(); });

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
    if (Game.state === 'count') Game.countTick();
    const still = Game.state === 'paused' || Game.state === 'down' || Game.state === 'count';
    if (!still) {
      clock += dt;
      if (Game.state === 'play' && (keys.left || keys.right) && !Game.reading()) {
        Sau.target = clamp(Sau.target + (keys.right - keys.left) * PW * 1.6 * dt, PX0 + 18 * S, PX0 + PW - 18 * S);
      }
      Game.update(dt);
    }
    render(still ? 0 : dt);
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
