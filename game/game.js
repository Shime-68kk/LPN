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
  // ?thu=lanhdia: chơi thử Lãnh Địa Vi Mạch với skin nào cũng được, nạp sẵn đầy; không trừ đốt, không cộng điểm.
  const TRY_DOMAIN = params.get('thu') === 'lanhdia';
  const REDUCED_MOTION = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PATH_STAR = 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5l-5.3 2.9 1.2-6-4.5-4.1 6-.7z';
  const PATH_HEART = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z';
  const PATH_PLAY = 'M8 5v14l11-7z';
  let touched = false;
  const buzz = (ms) => { if (touched && navigator.vibrate) navigator.vibrate(ms); };
  document.addEventListener('pointerdown', (e) => {
    touched = true;
    // Lãnh địa: chạm ở đâu cũng tính (pha chạm liên tục), còn pha né thì bắt đầu kéo.
    if (typeof Game !== 'undefined' && Game.state === 'domain') domainPointer(e);
    // Đang đếm ngược hồi sinh mà âm thanh bị tắt: chạm là bật lại (iPhone chỉ cho bật khi có chạm).
    if (typeof Game !== 'undefined' && Game.state === 'count' && Sound.ctx && Sound.ctx.state !== 'running') Sound.ctx.resume().catch(() => {});
  }, { capture: true, passive: true });

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
  // Quà dùng thử (bảng cập nhật ở trang chủ ghi lpn:trial): mặc tạm một skin ở bậc kỹ năng cao nhất trong vài ván.
  const TRIAL_KEY = 'lpn:trial';
  const trialGet = () => { try { return JSON.parse(localStorage.getItem(TRIAL_KEY)); } catch (e) { return null; } };
  const trialSet = (t) => { try { localStorage.setItem(TRIAL_KEY, JSON.stringify(t)); } catch (e) { /* bỏ qua */ } };
  const trialNow = () => { const t = trialGet(); return t && t.left > 0 && Skins.byKey('skin:' + t.skin) ? t : null; };
  function loadLook() {
    const eq = window.Wallet ? Wallet.equipped() : {};
    LOOK.trial = trialNow();
    LOOK.skin = Skins.get('skin', LOOK.trial ? LOOK.trial.skin : eq.skin);
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
    LOOK.skill = Skins.skillOf ? Skins.skillOf(LOOK.skin, LOOK.trial ? LOOK.trial.level : window.Wallet ? Wallet.skillLevel(LOOK.skin.id) : 0) : null;
    if (TRY_DOMAIN && LOOK.skill) LOOK.skill = Object.assign({}, LOOK.skill, { fx: Object.assign({}, LOOK.skill.fx, { domain: true }) });
    const ms = document.getElementById('menu-skill');
    if (ms) {
      const sk = LOOK.skill;
      ms.hidden = !sk;
      if (sk) {
        ms.style.setProperty('--sk', sk.color);
        ms.style.setProperty('--sk-bg', sk.color + '24');
        document.getElementById('menu-skill-ic').innerHTML = Skins.skillIcon(sk.id, sk.iconTier ? 30 : 22, sk.iconTier);
        document.getElementById('menu-skill-name').textContent = sk.name;
        document.getElementById('menu-skill-sub').textContent = LOOK.trial ? 'Dùng thử · còn ' + LOOK.trial.left + ' ván'
          : sk.breakthrough ? 'Đột phá · ' + sk.breakthrough : sk.level ? 'Kỹ năng · bậc ' + sk.level + '/' + sk.max : 'Kỹ năng · xem';
        ms.setAttribute('aria-label', 'Kỹ năng ' + sk.name + ', xem chi tiết');
      }
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
      // Lãnh Địa Vi Mạch: nhạc nền riêng và tiếng laze là tín hiệu để né, nên đi thẳng ra loa (như tiếng đếm 3-2-1).
      this.dsfx = ctx.createGain();
      this.dsfx.gain.value = 0.8;
      this.dsfx.connect(this.master);
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
      if (!ctx || (!Store.data.sfx && bus !== this.dsfx)) return;
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
      if (!ctx || (!Store.data.sfx && bus !== this.dsfx)) return;
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
    // ----- Lãnh Địa Vi Mạch -----
    superReady() {
      this.arp([7, 9, 12, 14, 16], 0.05, 'square', 0.1, 0.2);
      this.tone(this.freq(19), 0.5, 'sine', 0.18, null, 0.26);
    },
    // một nốt hẹn đúng giờ t (giờ đồng hồ âm thanh), đi qua kênh lãnh địa
    dnote(t, f, dur, type, vol, slide, dest) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(dest || this.dm.bus);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    dhit(t, dur, f, q, vol, dest) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(bp); bp.connect(g); g.connect(dest || this.dm.bus);
      src.start(t, Math.random() * 0.3, dur + 0.02);
    },
    // Nhạc nền của lãnh địa: điện tử 140 nhịp/phút, giọng La thứ. Kick mỗi phách, hi-hat nhịp lẻ, snare phách 2 và 4,
    // bass móc qua lọc, arp chip; pha chạm liên tục thì dồn dập hơn, lúc nổ thì ngân một hợp âm lớn.
    dmusic(on) {
      const ctx = this.ctx;
      if (!ctx) return;
      if (on) {
        if (this.dm) return;
        const bus = ctx.createGain();
        const t0 = ctx.currentTime;
        bus.gain.setValueAtTime(0.0001, t0);
        bus.gain.exponentialRampToValueAtTime(0.85, t0 + 0.5);
        bus.connect(this.master);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1400;
        lp.Q.value = 6;
        lp.connect(bus);
        const dm = { bus, lp, step: 0, next: t0 + 0.08, timer: 0 };
        this.dm = dm;
        const spb = 60 / 140 / 4;
        const BASS = [0, 0, 12, 0, 10, 0, 12, 7, 0, 0, 12, 0, 15, 12, 10, 7];
        const ARP = [12, 15, 19, 24, 19, 15, 12, 7];
        const hz = (base, semi) => base * Math.pow(2, semi / 12);
        const tick = () => {
          while (dm.next < ctx.currentTime + 0.14) {
            const st = dm.step, t = dm.next, ph = DM.phase;
            const hot = ph === 'spam';
            if (ph !== 'boom' && ph !== 'exit') {
              if (st % 4 === 0) { this.dnote(t, 170, 0.16, 'sine', 0.9, 48); this.dhit(t, 0.02, 2500, 1.5, 0.35); }
              if (st % 2 === 1 || (hot && st % 1 === 0)) this.dhit(t, 0.035, 9000, 1.2, hot ? 0.16 : 0.22);
              if (st % 8 === 4 || (hot && st % 4 === 2)) { this.dhit(t, 0.14, 1900, 0.8, 0.45); this.dnote(t, 210, 0.08, 'triangle', 0.25, 160); }
              this.dnote(t, hz(110, BASS[st % 16]), 0.12, 'sawtooth', 0.32, null, lp);
              const a = ARP[(st + (st >> 4)) % 8] + (hot ? 12 : 0) + ((st >> 5) % 2 ? 3 : 0);
              this.dnote(t, hz(220, a), 0.08, 'square', hot ? 0.11 : 0.08);
              // lọc của bass mở dần theo nhịp cho có "thở"
              lp.frequency.setTargetAtTime(900 + 900 * ((st % 16) / 16), t, 0.05);
            }
            dm.step++;
            dm.next += spb;
          }
        };
        tick();
        dm.timer = setInterval(tick, 25);
      } else if (this.dm) {
        const dm = this.dm, t = ctx.currentTime;
        clearInterval(dm.timer);
        dm.bus.gain.cancelScheduledValues(t);
        dm.bus.gain.setValueAtTime(Math.max(0.0001, dm.bus.gain.value), t);
        dm.bus.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        setTimeout(() => { try { dm.bus.disconnect(); } catch (e) { /* bỏ qua */ } }, 700);
        this.dm = null;
      }
    },
    // giữ tên cũ: hum(true/false) bật / tắt nhạc nền lãnh địa
    hum(on) { this.dmusic(on); },
    domainEnter() {
      const b = this.dsfx;
      this.tone(120, 0.9, 'sawtooth', 0.3, 1600, 0, b);
      this.noise(0.9, 2400, 0.5, 0.35, 0, b);
      [0, 7, 12, 19, 24].forEach((s2, i) => this.tone(220 * Math.pow(2, s2 / 12), 0.25, 'square', 0.14, null, 0.15 + i * 0.07, b));
    },
    lzWarn() {
      const b = this.dsfx;
      this.tone(1480, 0.06, 'square', 0.18, null, 0, b);
      this.tone(1480, 0.06, 'square', 0.18, null, 0.1, b);
    },
    lzFire() {
      const b = this.dsfx;
      this.tone(2600, 0.3, 'sawtooth', 0.3, 320, 0, b);
      this.tone(1300, 0.3, 'square', 0.12, 160, 0, b);
      this.noise(0.22, 5000, 0.7, 0.3, 0, b);
    },
    lzHit() {
      const b = this.dsfx;
      this.tone(330, 0.32, 'square', 0.45, 110, 0, b);
      this.noise(0.3, 1200, 0.6, 0.5, 0, b);
    },
    item() {
      const b = this.dsfx;
      [12, 16, 19, 24, 28].forEach((s2, i) => this.tone(220 * Math.pow(2, s2 / 12), 0.18, 'triangle', 0.35, null, i * 0.045, b));
    },
    whoosh() {
      const b = this.dsfx;
      this.noise(0.5, 1500, 0.5, 0.45, 0, b);
      this.tone(300, 0.5, 'triangle', 0.25, 1400, 0, b);
    },
    ram() {
      const b = this.dsfx;
      this.noise(0.45, 700, 0.6, 0.8, 0, b);
      this.tone(220, 0.45, 'square', 0.4, 60, 0, b);
      this.noise(0.6, 6500, 0.8, 0.3, 0.02, b);
    },
    tap(n) {
      const b = this.dsfx, f = 380 + Math.min(1, n / 24) * 1100;
      this.tone(f, 0.07, 'square', 0.24, f * 1.4, 0, b);
      this.noise(0.05, 3200, 1.2, 0.22, 0, b);
    },
    boom() {
      const b = this.dsfx;
      this.noise(1.2, 900, 0.5, 0.9, 0, b);
      this.noise(1.6, 6500, 0.7, 0.4, 0, b);
      this.tone(260, 1.0, 'sawtooth', 0.4, 45, 0, b);
      // hợp âm La thứ ngân dài, rồi chuỗi lấp lánh
      for (const f of [440, 523.25, 659.25, 880]) this.tone(f, 1.6, 'triangle', 0.16, null, 0.05, b);
      [12, 15, 19, 24, 27, 31].forEach((s2, i) => this.tone(440 * Math.pow(2, s2 / 12), 0.3, 'square', 0.1, null, 0.3 + i * 0.06, b));
    },
    domainExit() {
      const b = this.dsfx;
      this.tone(1600, 0.65, 'sawtooth', 0.25, 120, 0, b);
      this.noise(0.6, 1500, 0.6, 0.3, 0, b);
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
    const surf = Game.state === 'play' && Game.skFx() && Game.skFx().surf;
    Sau.headX += (Sau.target - Sau.headX) * (1 - Math.exp(-dt * (surf ? 40 : 26)));
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
    sk: { charge: 0, on: 0, ready: false, told: false, fx: null, hit: 0, cnt: 0, net: 0, lotus: 0, label: '', sup: 0 },
    vmul: 1, bonusDot: 0, bonusBanked: 0,
    endT: 0, speed: 460, lead: 1.3, shake: 0, hintT: 0, resultShown: false, pulse: 0,

    setup() {
      const lvl = this.diff;
      this.notes = this.map.notes
        .filter((n) => n[3] <= lvl)
        .map((n) => ({ t: n[0], x: n[1], x0: n[1], dur: n[2], state: 0, held: 0, eaten: [], cur: null, grow: 0, crunch: 0, vac: 0 }));
      this.beats = this.map.beats;
      this.resetNotes();
      this.score = 0; this.combo = 0; this.maxCombo = 0; this.hearts = 3; this.banked = 0; this.dotGot = 0;
      this.revives = 0; this.count = null; this.pendingPos = null;
      this.sk = { charge: 0, on: 0, ready: false, told: false, fx: null, hit: 0, cnt: 0, net: 0, lotus: 0, label: '', sup: TRY_DOMAIN ? DOMAIN_NEED : 0 };
      this.vmul = 1;
      this.bonusDot = 0; this.bonusBanked = 0;
      VAC.length = 0;
      STARS.length = 0;
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
        n.state = 0; n.held = 0; n.eaten = []; n.cur = null; n.grow = 0; n.crunch = 0; n.vac = 0; n.x = n.x0;
        n.total = 0; n.bounce = 0; n.ticks = 0;
      }
      this.holds = [];
      VAC.length = 0;
      STARS.length = 0;
      this.beatIdx = 0;
      this.noteHead = 0;
      this.drawStart = 0;
    },

    begin() {
      loadLook();
      const tr = LOOK.trial;
      if (tr) { tr.left--; trialSet(tr); }
      this.setup();
      if (tr && LOOK.skill && LOOK.skill.fx.domain) {
        this.sk.sup = Math.max(this.sk.sup, Math.round(DOMAIN_NEED / 2));
        setTimeout(() => UI.toast('Dùng thử ' + LOOK.skin.name + ' tối đa! Đủ 60 lá chạm đúp mở Lãnh Địa'), 1200);
      }
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

    // via: ai đớp lá này — null (bé sâu), 'book' (sách Gió Thơ), 'clone' (bé phân thân), 'star' (sao băng),
    // 'net' (lưới thổ cẩm), 'lotus' (sen đỡ). Điểm, vụn lá bung ra ở chỗ đó.
    eat(n, perfect, via) {
      n.state = 1;
      const fx = this.skFx(), K = this.sk;
      const mult = (1 + Math.min(4, Math.floor(this.combo / 10)) * 0.5) * this.boost();
      const pts = Math.round((perfect ? 300 : 200) * mult);
      this.score += pts;
      this.combo += fx && fx.combo2 ? 2 : 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      if (perfect) this.perfect++; else this.good++;
      Sau.segs++;
      if (via) {
        // Không phải bé tự đớp (sách, phân thân, sao, lưới, sen): bé không nhai, chỉ mỉm cười.
        const at = viaPos(via, n);
        Sau.happy = Math.max(Sau.happy, 0.3);
        burstCrumbs(at.x, at.y, perfect ? 8 : 5);
        ring(at.x, at.y, LOOK.skill ? LOOK.skill.color : '#FF8FA3');
        popup('+' + pts, at.x + (Math.random() - 0.5) * 40 * S, at.y - (via === 'book' ? bookW() * 0.95 : HEAD_R * 2), GOLD());
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
      if (fx) {
        K.cnt++;
        if (fx.healEvery && K.cnt % fx.healEvery === 0 && this.hearts < 3) {
          this.hearts++;
          popup('+1 tim', Sau.headX, Sau.headY - HEAD_R * 3, PINK(), 18);
          burstHearts(Sau.headX, Sau.headY - HEAD_R, 4);
          Sound.heart();
        }
        if (fx.overheal && K.cnt % fx.overheal === 0 && this.hearts < 5) {
          this.hearts++;
          popup(this.hearts > 3 ? '+1 tim thưởng' : '+1 tim', Sau.headX, Sau.headY - HEAD_R * 3, PINK(), 18);
          burstHearts(Sau.headX, Sau.headY - HEAD_R, 5);
          Sound.heart();
        }
        if (fx.harvest) {
          this.bonusDot += fx.harvest;
          const at = via ? viaPos(via, n) : { x: Sau.headX, y: Sau.headY };
          popup('+' + fx.harvest + ' đốt', at.x + 26 * S, at.y - HEAD_R * 3.2, T.night ? '#9BE58A' : '#2E8B3E', 15);
        }
        // Sao Băng: bé tự đớp một lá thì sao bay đi đớp giùm lá kế tiếp (sao không gọi thêm sao).
        if (fx.star && via !== 'star') { launchStar(this.songT); if (fx.star2) launchStar(this.songT); }
      }
      this.chargeSkill();
      UI.hud(this, true);
    },

    // ----- Kỹ năng của skin -----
    // Mỗi lá ăn được nạp một nấc; đầy thì nút sáng, chạm đúp màn hình (hoặc phím cách, hoặc nút) để dùng.
    // Đang dùng thì không nạp. Hiệu ứng ở sk.fx (Tưng Tửng mỗi lần bốc một phép khác).
    chargeSkill() {
      const sk = LOOK.skill, K = this.sk;
      if (!sk) return;
      // Lãnh Địa Vi Mạch: thanh nạp riêng, đủ 60 lá thì chạm đúp mở lãnh địa (ưu tiên hơn kỹ năng thường).
      if (sk.fx.domain && K.sup < DOMAIN_NEED) {
        K.sup++;
        if (K.sup >= DOMAIN_NEED) { Sound.superReady(); UI.toast('Lãnh Địa sẵn sàng! Chạm đúp'); buzz([20, 30, 20]); }
      }
      if (K.on > 0 || K.ready) return;
      K.charge = Math.min(sk.need, K.charge + 1);
      if (K.charge >= sk.need) {
        K.ready = true;
        Sound.skillReady();
        if (!K.told) { K.told = true; UI.toast('Chạm đúp để dùng ' + sk.name); }
      }
    },
    // Chạm đúp / phím cách / nút: lãnh địa sẵn sàng thì mở lãnh địa, không thì dùng kỹ năng thường.
    trigger() {
      if (this.state !== 'play') return;
      if (domainReady()) { startDomain(); return; }
      this.useSkill();
    },
    useSkill() {
      const sk = LOOK.skill, K = this.sk;
      if (!sk || !K.ready || this.state !== 'play') return;
      K.ready = false;
      K.charge = 0;
      K.on = sk.time;
      const pick = sk.fx.rand ? Skins.SKILL_RAND[Math.floor(Math.random() * Skins.SKILL_RAND.length)] : null;
      K.fx = pick ? pick.fx : sk.fx;
      K.label = pick ? pick.name : '';
      K.cnt = 0;
      K.net = K.fx.net || 0;
      K.lotus = K.fx.lotus || 0;
      if (K.fx.heal && this.hearts < 3) {
        this.hearts = Math.min(3, this.hearts + K.fx.heal);
        burstHearts(Sau.headX, Sau.headY - HEAD_R, 8);
        Sound.heart();
      }
      Sound.skill();
      buzz([12, 30, 12]);
      this.quest((q) => { q.uses = (q.uses || 0) + 1; });
      UI.toast(K.label ? sk.name + ': ' + K.label + '!' : sk.name + '!');
      skillBurst(18);
      ring(Sau.headX, Sau.headY, sk.color);
      UI.hud(this);
    },
    // Thử thách đột phá: chỉ tính khi đang mặc skin có đột phá và kỹ năng đã đủ 3 bậc (chưa đột phá).
    questOn() { const sk = LOOK.skill; return !!(sk && window.Wallet && Skins.BREAK && Skins.BREAK[sk.id] && sk.level === sk.max - 1); },
    quest(fn) {
      if (!this.questOn()) return;
      const id = LOOK.skill.id;
      Wallet.update((w) => { const q = w.quest[id] || (w.quest[id] = { uses: 0, combo: 0, hard: {} }); q.hard = q.hard || {}; fn(q); });
    },
    // Hiệu ứng đang bật (null nếu không dùng kỹ năng).
    skFx() { return this.sk.on > 0 ? this.sk.fx : null; },
    // Gió Thơ đang mở sách: bé đứng yên, kéo tay cũng không đi.
    reading() { const fx = this.skFx(); return !!(fx && fx.vacuum); },
    // Điểm nhân: score cố định, ramp tăng dần theo số lá đã ăn trong lúc dùng (tới ×2).
    boost() {
      const fx = this.skFx();
      if (!fx) return 1;
      return (fx.score || 1) * (fx.ramp ? Math.min(2, 1 + fx.ramp * this.sk.cnt) : 1);
    },
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
      const fx = this.skFx();
      // Sen Đỡ: còn cánh sen thì lá rơi trượt vẫn được đỡ, tính là ăn.
      if (fx && fx.lotus && this.sk.lotus > 0) {
        this.sk.lotus--;
        this.eat(n, false, 'lotus');
        popup('Sen đỡ!', PX0 + n.x * PW, Sau.headY - HEAD_R * 2.6, PINK(), 17);
        return;
      }
      n.state = 2;
      this.miss++;
      // Ghẹo Ma: lá hụt hoá kẹo, không mất tim, không mất combo, còn được điểm.
      if (fx && fx.candy) {
        const px = PX0 + n.x * PW;
        const pts = Math.round(fx.candy * (fx.score || 1));
        this.score += pts;
        this.sk.hit = 1;
        for (let i = 0; i < 6; i++) spawn(12, px, Sau.headY, (Math.random() - 0.5) * 160 * S, -(60 + Math.random() * 120) * S, 0.7, 4 * S, ['#FF8A1F', '#9B5DE5', '#7CC46E', '#FF6F8E'][i % 4]);
        popup('Kẹo nè! +' + pts, px, Sau.headY - HEAD_R * 2.4, GOLD(), 17);
        Sound.shield();
        UI.hud(this);
        return;
      }
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
      // Hết tim: còn lượt thì luôn mời hồi sinh (kể cả khi đã đủ 3 sao, để chơi tiếp vòng nhanh kiếm điểm).
      // Hết lượt: đủ 3 sao thì vẫn là thắng (sâu hoá bướm), chưa đủ thì thua.
      if (this.hearts <= 0) {
        if (this.revives < REVIVE.length) this.down();
        else if (this.stars >= 3) this.finish();
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
      // Âm thanh chưa chạy lại (iPhone vừa có cuộc gọi, Siri…): đồng hồ âm thanh đứng yên nên đếm mãi không xong.
      // Thử bật lại mỗi nửa giây; chạm màn hình cũng bật lại (xem pointerdown ở dưới).
      if (Sound.ctx.state !== 'running') {
        const t = performance.now();
        if (!c.kick || t - c.kick > 500) { c.kick = t; Sound.ctx.resume().catch(() => {}); }
        return;
      }
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
      // Đã đủ 3 sao: không hồi sinh thì hoá bướm (vẫn là thắng).
      if (this.stars >= 3) { const go = () => { if (this.state === 'down') this.finish(); }; Sound.ctx.resume().then(go, go); setTimeout(go, 600); return; }
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
          // Phủ Sóng: dùng xong tự nạp lại sẵn một phần
          if (K.on === 0 && K.fx && K.fx.refill && LOOK.skill) K.charge = Math.round(LOOK.skill.need * K.fx.refill);
          K.hit = Math.max(0, K.hit - dt * 2.5);
          // Khoá Sóng: tự lướt tới lá
          if (K.fx && K.fx.auto) this.bot();
          if (Math.random() < dt * 7) { if (K.fx && K.fx.vacuum) bookSpark(); else skillBurst(1); }
          UI.skill(this);
        }
        if (this.botOn && K.ready) this.useSkill();
        const fxNow = this.skFx();
        // Mưa Chậm: lá rơi chậm lại (chỉ đổi tốc độ nhìn thấy, nhịp lá vẫn khớp nhạc), về lại từ từ.
        this.vmul = lerp(this.vmul, fxNow && fxNow.slow ? fxNow.slow : 1, 1 - Math.exp(-dt * 4));
        if (fxNow && (fxNow.magnet || fxNow.wind)) {
          const hxN = (Sau.headX - PX0) / PW;
          for (let i = this.noteHead; i < this.notes.length; i++) {
            const n = this.notes[i];
            const ahead = n.t - t;
            if (ahead > 1.6) break;
            if (n.state !== 0 || ahead < 0) continue;
            // Húp Sụp: lá thường rơi gần miệng bị hút trượt dần về phía miệng.
            if (fxNow.magnet && !n.dur && ahead < 0.75 && Math.abs(n.x - hxN) * PW < CATCH_R * fxNow.magnet) {
              n.x = lerp(n.x, hxN, 1 - Math.exp(-dt * 9 * (1 - ahead / 0.75)));
            }
            // Gió Núi: lá (cả cành) dạt về giữa màn.
            if (fxNow.wind) n.x = lerp(n.x, 0.5 + (n.x0 - 0.5) * (1 - fxNow.wind), 1 - Math.exp(-dt * 3));
          }
        }
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
      } else if (this.state === 'domain') {
        domainTick(dt);
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
      const sfx = this.skFx();
      const cx = sfx && sfx.clone ? cloneX() : null;
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
        if (n.state === 3) this.eat(n, true, 'book');
        if (this.state !== 'play') return;
      }
      // Sao băng đã bay tới lá: tới nhịp của lá thì đớp giùm.
      for (let i = STARS.length - 1; i >= 0; i--) {
        const st = STARS[i];
        if (t < st.n.t) continue;
        STARS.splice(i, 1);
        if (st.n.state === 4) this.eat(st.n, true, 'star');
        if (this.state !== 'play') return;
      }
      let anticip = 0;
      for (let i = this.noteHead; i < notes.length; i++) {
        const n = notes[i];
        if (n.t - t > 0.4) break;
        if (n.state !== 0) continue;
        const px = PX0 + n.x * PW;
        let d = Math.abs(Sau.headX - px), via = null;
        if (n.t - t > 0 && d < R * 1.8) anticip = Math.max(anticip, 1 - (n.t - t) / 0.4);
        // Phân Thân: bé đứng đối xứng cũng đớp được (lấy đứa gần lá hơn).
        if (cx !== null && Math.abs(cx - px) < d) { d = Math.abs(cx - px); via = 'clone'; }
        if (n.t - t > EARLY) continue;
        if (d <= R) this.eat(n, d <= PERFECT_R || !!(sfx && sfx.perfect), via);
        // Lưới Thổ Cẩm: lá tới đúng nhịp mà không ai đớp thì lưới đỡ (còn sợi thì còn đỡ).
        else if (sfx && this.sk.net > 0 && t >= n.t) { this.sk.net--; this.eat(n, false, 'net'); }
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
        const hx0 = PX0 + n.x * PW;
        const byClone = cx !== null && Math.abs(cx - hx0) <= R * 0.95 && Math.abs(Sau.headX - hx0) > R * 0.95;
        const inside = n.vac ? true : Math.abs(Sau.headX - hx0) <= R * 0.95 || byClone || !!(sfx && this.sk.net > 0);
        const bx = n.vac ? bookPos().x : byClone ? cx : Sau.headX, by = n.vac ? bookPos().y - bookW() * 0.6 : Sau.headY - HEAD_R * 1.6;
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
  // Sao Băng: sao đang bay tới / đậu trên lá (lá state 4), tới nhịp của lá thì đớp giùm.
  const STARS = [];
  const vis = () => Game.speed * Game.vmul; // tốc độ lá rơi trên màn (Mưa Chậm làm chậm lại)
  const cloneX = () => PX0 + PW - (Sau.headX - PX0);
  // Chỗ bung điểm, vụn lá khi lá không phải do bé tự đớp.
  function viaPos(via, n) {
    if (via === 'book') return bookPos();
    if (via === 'clone') return { x: cloneX(), y: Sau.headY };
    return { x: PX0 + n.x * PW, y: Sau.headY };
  }
  function launchStar(t) {
    const notes = Game.notes;
    for (let i = Game.noteHead; i < notes.length; i++) {
      const n = notes[i];
      if (n.state !== 0 || n.dur > 0 || n.t < t + 0.12) continue;
      n.state = 4;
      STARS.push({ n, t0: t, x0: Sau.headX, y0: Sau.headY - HEAD_R });
      return;
    }
  }
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
    const yNat = Sau.headY - (tau - t) * vis();
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
  // Huy hiệu bồng bềnh cạnh đầu: "×1,5" (điểm), "Combo ×2"…; side -1 là bên trái.
  function drawScoreBadge(k, mult, label, side) {
    const x = Sau.headX + HEAD_R * 1.9 * (side || 1), y = Sau.headY - HEAD_R * 1.9 + Math.sin(clock * 4) * 2 * S;
    g.save();
    g.globalAlpha = k;
    g.font = '700 ' + Math.round(16 * S) + 'px "Be Vietnam Pro", system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = 4 * S;
    g.strokeStyle = 'rgba(43,33,64,0.75)';
    const txt = label || '×' + String(mult).replace('.', ',');
    g.strokeText(txt, x, y);
    g.fillStyle = '#FFC24B';
    g.fillText(txt, x, y);
    g.restore();
  }

  // Phân Thân: bé bóng mờ đứng đối xứng qua giữa màn, nối với bé thật bằng vệt chấm.
  function drawClone(k, sk) {
    const x = cloneX(), y = Sau.headY;
    g.save();
    g.globalAlpha = 0.35 * k;
    g.strokeStyle = sk.color;
    g.lineWidth = 2 * S;
    g.setLineDash([2 * S, 6 * S]);
    g.beginPath(); g.moveTo(Sau.headX, y + HEAD_R * 1.2); g.lineTo(x, y + HEAD_R * 1.2); g.stroke();
    g.setLineDash([]);
    const glow = g.createRadialGradient(x, y, 0, x, y, HEAD_R * 2.4);
    glow.addColorStop(0, hexA(sk.color, 0.35 * k));
    glow.addColorStop(1, hexA(sk.color, 0));
    g.globalAlpha = 1;
    g.fillStyle = glow;
    g.beginPath(); g.arc(x, y, HEAD_R * 2.4, 0, TAU); g.fill();
    g.globalAlpha = 0.55 * k;
    for (let i = 3; i >= 1; i--) {
      g.save();
      g.translate(x + Math.sin(clock * 3 - i) * 4 * S, y + i * SEG_GAP * 0.85);
      Skins.drawSegment(g, SEG_R * (1 - i * 0.06), LOOK.skin, i % 2, S);
      g.restore();
    }
    g.restore();
    g.save();
    g.globalAlpha = 0.6 * k;
    drawHead(x, y, Game.pulse || 0);
    g.restore();
  }
  // Lưới Thổ Cẩm: dải lưới đỏ chỉ vàng giăng ngang hàng đớp, còn bao nhiêu sợi thì ghi ở đầu lưới.
  function drawNet(k, sk) {
    const K = Game.sk, left = K.net / Math.max(1, K.fx.net), y = Sau.headY + HEAD_R * 0.35, x0 = PX0 + 6 * S, x1 = PX0 + PW - 6 * S;
    g.save();
    g.globalAlpha = k * (0.35 + 0.65 * left);
    g.fillStyle = hexA('#D62F45', 0.82);
    g.fillRect(x0, y - 5 * S, x1 - x0, 10 * S);
    g.fillStyle = '#FFC93C';
    for (let x = x0 + 8 * S; x < x1 - 4 * S; x += 16 * S) {
      g.beginPath(); g.moveTo(x, y - 4 * S); g.lineTo(x + 4 * S, y); g.lineTo(x, y + 4 * S); g.lineTo(x - 4 * S, y); g.closePath(); g.fill();
    }
    g.strokeStyle = '#2F3B85';
    g.lineWidth = 1.6 * S;
    g.beginPath(); g.moveTo(x0, y - 5 * S); g.lineTo(x1, y - 5 * S); g.moveTo(x0, y + 5 * S); g.lineTo(x1, y + 5 * S); g.stroke();
    g.globalAlpha = k;
    g.font = '700 ' + Math.round(13 * S) + 'px "Be Vietnam Pro", system-ui, sans-serif';
    g.textAlign = 'right';
    g.textBaseline = 'bottom';
    g.fillStyle = T.night ? '#FFF1C9' : '#7A1E2E';
    g.fillText('lưới ×' + K.net, x1, y - 7 * S);
    g.restore();
  }
  // Sen Đỡ: đoá sen dưới cằm bé, còn mấy lần đỡ thì còn mấy cánh sáng.
  function drawLotus(k, sk) {
    const left = Game.sk.lotus, x = Sau.headX, y = Sau.headY + HEAD_R * 0.95;
    g.save();
    g.globalAlpha = k;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.5, on = i - 1 < left && i >= 1 && i <= 3;
      g.save();
      g.translate(x, y);
      g.rotate(a + Math.PI / 2);
      g.fillStyle = on ? hexA(sk.color, 0.9) : hexA(sk.color, 0.25);
      g.beginPath(); g.ellipse(0, -HEAD_R * 0.75, HEAD_R * 0.32, HEAD_R * 0.75, 0, 0, TAU); g.fill();
      g.restore();
    }
    g.fillStyle = '#FFE08A';
    g.beginPath(); g.arc(x, y - HEAD_R * 0.1, HEAD_R * 0.22, 0, TAU); g.fill();
    g.restore();
  }
  // Mưa Chậm: chiếc ô che trên đầu bé, mấy giọt mưa lơ lửng rơi chậm.
  function drawUmbrella(k, sk) {
    const x = Sau.headX, y = Sau.headY - HEAD_R * 2.1, r = HEAD_R * 1.9;
    g.save();
    g.globalAlpha = k;
    g.fillStyle = sk.color;
    g.beginPath();
    g.moveTo(x - r, y);
    g.quadraticCurveTo(x - r, y - r * 0.95, x, y - r * 0.95);
    g.quadraticCurveTo(x + r, y - r * 0.95, x + r, y);
    // mép ô lượn sóng: sáu nhịp cong từ phải sang trái
    for (let i = 3; i > -3; i--) g.quadraticCurveTo(x + ((i - 0.5) * r) / 3, y - r * 0.16, x + ((i - 1) * r) / 3, y);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.55)';
    g.lineWidth = 1.4 * S;
    g.beginPath();
    for (const f of [-0.5, 0, 0.5]) { g.moveTo(x, y - r * 0.92); g.quadraticCurveTo(x + f * r * 0.8, y - r * 0.6, x + f * r * 0.95, y - r * 0.05); }
    g.stroke();
    g.strokeStyle = T.night ? '#E8E0F8' : '#5A4A6E';
    g.lineWidth = 2.2 * S;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y - r * 0.95); g.lineTo(x, y - r * 1.15); g.stroke();
    g.fillStyle = hexA(sk.color, 0.6);
    for (let i = 0; i < 6; i++) {
      const dx = (rnd01(i) - 0.5) * PW * 0.9, dy = ((clock * 0.25 + rnd01(i + 9)) % 1) * H * 0.6;
      g.beginPath(); g.ellipse(PX0 + PW / 2 + dx, dy + 40 * S, 1.6 * S, 4 * S, 0, 0, TAU); g.fill();
    }
    g.restore();
  }
  const rnd01 = (i) => { const v = Math.sin(i * 91.7 + 3.1) * 43758.5453; return v - Math.floor(v); };
  // Lướt Sóng: con sóng nhỏ dưới chân bé, lướt theo bé.
  function drawSurf(k, sk) {
    const x = Sau.headX, y = Sau.headY + HEAD_R * 1.15, w = HEAD_R * 3.2, lean = clamp(Sau.vx / (PW * 3), -1, 1);
    g.save();
    g.globalAlpha = 0.85 * k;
    g.fillStyle = hexA(sk.color, 0.55);
    g.beginPath();
    g.moveTo(x - w, y + 8 * S);
    for (let i = 0; i <= 20; i++) {
      const u = i / 20, xx = x - w + u * w * 2;
      g.lineTo(xx, y - Math.sin(u * Math.PI) * HEAD_R * 0.7 - Math.sin(u * 9 + clock * 8) * 2 * S + lean * (u - 0.5) * 10 * S);
    }
    g.lineTo(x + w, y + 8 * S);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)';
    g.lineWidth = 2 * S;
    g.beginPath();
    for (let i = 0; i <= 20; i++) {
      const u = i / 20, xx = x - w + u * w * 2, yy = y - Math.sin(u * Math.PI) * HEAD_R * 0.7 - Math.sin(u * 9 + clock * 8) * 2 * S + lean * (u - 0.5) * 10 * S;
      if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy);
    }
    g.stroke();
    g.restore();
  }
  // Húp Sụp: vòng xoáy hút quanh miệng, bán kính đúng bằng vùng hút.
  function drawMagnet(k, sk) {
    const fx = Game.sk.fx, r = CATCH_R * fx.magnet, x = Sau.headX, y = Sau.headY - HEAD_R * 0.6;
    g.save();
    g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = clock * 4 + (i * TAU) / 4, rr = r * (0.45 + 0.55 * ((clock * 0.9 + i / 4) % 1));
      g.globalAlpha = 0.6 * k * (1 - rr / r + 0.25);
      g.strokeStyle = sk.color;
      g.lineWidth = 2.4 * S;
      g.beginPath(); g.arc(x, y, rr, a, a + 1.1); g.stroke();
    }
    g.globalAlpha = 0.25 * k;
    g.setLineDash([3 * S, 5 * S]);
    g.beginPath(); g.arc(x, y, r, Math.PI, TAU); g.stroke();
    g.setLineDash([]);
    g.restore();
  }
  // Gió Núi: vệt gió thổi từ hai bên vào, một dải sáng ở giữa là chỗ lá dạt về.
  function drawWind(k, sk) {
    const cx = PX0 + PW / 2;
    g.save();
    const band = g.createLinearGradient(cx - 50 * S, 0, cx + 50 * S, 0);
    band.addColorStop(0, hexA(sk.color, 0));
    band.addColorStop(0.5, hexA(sk.color, 0.16 * k));
    band.addColorStop(1, hexA(sk.color, 0));
    g.fillStyle = band;
    g.fillRect(cx - 50 * S, 0, 100 * S, H);
    g.strokeStyle = T.night ? 'rgba(230,236,255,0.6)' : hexA(sk.color, 0.7);
    g.lineWidth = 2 * S;
    g.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const p = (clock * 0.7 + i * 0.137) % 1, y = H * (0.12 + 0.075 * i);
      g.globalAlpha = k * Math.sin(p * Math.PI) * 0.8;
      for (const side of [-1, 1]) {
        const x = cx + side * PW * (0.5 - 0.42 * p);
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - side * 18 * S, y - 6 * S, x - side * 38 * S, y); g.stroke();
      }
    }
    g.restore();
  }
  // Sao Băng: sao bay từ miệng bé tới chiếc lá kế tiếp, đậu trên lá lấp lánh cho tới nhịp.
  function drawStars() {
    const t = Game.songT, s = SPR.starSize;
    for (const st of STARS) {
      // lá còn ở ngoài màn thì sao đứng chờ ở mép trên, đúng cột lá sẽ rơi
      const n = st.n, lx = PX0 + n.x * PW, ly = Math.max(34 * S, Sau.headY - Math.max(0, n.t - t) * vis() - SPR.leafCY * 0.4);
      const u = clamp((t - st.t0) / 0.3, 0, 1), e = 1 - (1 - u) * (1 - u);
      const x = lerp(st.x0, lx, e), y = lerp(st.y0, ly, e) - Math.sin(u * Math.PI) * 40 * S;
      g.save();
      if (u < 1) {
        g.strokeStyle = 'rgba(255,224,138,0.6)';
        g.lineWidth = 3 * S;
        g.lineCap = 'round';
        g.beginPath(); g.moveTo(lerp(st.x0, x, 0.6), lerp(st.y0, y, 0.6)); g.lineTo(x, y); g.stroke();
      }
      const sc = 0.75 + 0.15 * Math.sin(clock * 12);
      g.translate(x, y);
      g.rotate(clock * 5);
      g.drawImage(SPR.star, (-s * sc) / 2, (-s * sc) / 2, s * sc, s * sc);
      g.restore();
    }
  }
  // Tự lướt (Khoá Sóng): tia sóng nối đầu bé với chiếc lá đang nhắm, có vòng ngắm trên lá.
  function drawBeam(k, sk) {
    const n = Game.holds.length ? Game.holds[0] : nextLeaf();
    if (!n) return;
    const tx = PX0 + n.x * PW, ty = Math.max(30 * S, Sau.headY - Math.max(0, n.t - Game.songT) * vis());
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
      const stepT = (24 * S) / vis(), pts = [];
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

  // ================= Lãnh Địa Vi Mạch: đột phá siêu cấp của Sâu Vi Mạch =================
  // Nạp đủ 60 lá (vòng vàng ngoài nút kỹ năng) rồi chạm đúp: nhạc dừng, mở ra một thế giới bảng mạch riêng.
  //  1. Né laze (~5,6 giây): chiếc lá chip khổng lồ bắn laze dọc / ngang, có vạch đỏ báo trước. Trong lãnh địa
  //     bé đi được cả lên xuống; chỉ tính trúng khi tia chạm vào đầu, mỗi lần trúng mất 60 đốt.
  //     Hai món bay ra: ×2 ĐIỂM, ×2 ĐỐT — chạm đầu vào là nhận.
  //  2. Húc: bé lao lên húc vào lá.  3. Chạm liên tục (máy tính: phím cách) cho lá nổ tung.
  //  4. Thu về tới 300 lá, 300.000 điểm và 300 đốt (tuỳ né được bao nhiêu, chạm nhanh cỡ nào), rồi về lại bài,
  //     đếm 3-2-1 và nhạc chạy tiếp từ chỗ cũ.
  const DOMAIN_NEED = 60;
  const DM_T = { enter: 0.85, dodge: 5.6, ram: 0.95, spam: 3.0, boom: 1.9, exit: 0.85 };
  const LZ_WARN = 0.62, LZ_FIRE = 0.3, TAP_FULL = 24;
  const DM = {
    phase: '', pt: 0, pos: 0, lasers: [], next: 0, pat: 0, hits: 0, lost: 0, inv: 0, items: [], spawned: 0,
    x2pts: false, x2dot: false, taps: 0, leaf: null, ty: 0, reward: null, flash: 0, flashCol: '#FFFFFF', fly: [],
    bg: null, bgKey: '', traces: [],
  };
  const domainReady = () => !!(LOOK.skill && LOOK.skill.fx.domain && Game.sk.sup >= DOMAIN_NEED);
  const leafR = () => Math.min(PW * 0.3, 110 * S);
  const dmYMin = () => Math.max(H * 0.42, DM.leaf ? DM.leaf.y + leafR() * 1.1 + 34 * S : H * 0.42);
  const dmYMax = () => H * 0.9;

  function startDomain() {
    const G = Game;
    if (G.state !== 'play' || !domainReady()) return false;
    G.sk.sup = 0;
    DM.pos = G.songT - (G.song.offset || 0);
    Sound.stopMusic();
    G.state = 'domain';
    document.body.classList.add('in-domain');
    Object.assign(DM, {
      phase: 'enter', pt: 0, lasers: [], next: 0.35, pat: 0, hits: 0, lost: 0, inv: 0, items: [], spawned: 0,
      x2pts: false, x2dot: false, taps: 0, reward: null, flash: 1, flashCol: '#5FFFE0', fly: [],
    });
    DM.leaf = { x: PX0 + PW / 2, y: H * 0.2, shake: 0, crack: 0, gone: false };
    DM.ty = Sau.headY;
    UI.showHint(false);
    Sound.domainEnter();
    Sound.hum(true);
    buzz([30, 40, 90]);
    burstSparks(Sau.headX, Sau.headY, 30, '#5FFFE0');
    UI.skill(G);
    return true;
  }
  function dmPhase(p) {
    DM.phase = p;
    DM.pt = 0;
    if (p === 'dodge') DM.ty = clamp(Sau.headY, dmYMin(), dmYMax());
    else if (p === 'ram') { DM.lasers = []; DM.items = []; Sound.whoosh(); }
    else if (p === 'boom') {
      // Thưởng: né càng giỏi (mỗi lần trúng -15%) và chạm càng nhanh thì càng nhiều.
      const dodge = Math.max(0.2, 1 - DM.hits * 0.15);
      const spam = Math.min(1, DM.taps / TAP_FULL);
      const f = dodge * (0.4 + 0.6 * spam);
      const leaves = Math.max(1, Math.round(300 * f));
      let pts = Math.round((300000 * f) / 100) * 100;
      if (DM.x2pts) pts *= 2;
      // mỗi lá thu về là 1 đốt cộng thẳng vào ví (×2 ĐỐT thì gấp đôi); điểm thì vẫn quy ra đốt như thường
      const dot = leaves * (DM.x2dot ? 2 : 1);
      if (!TRY_DOMAIN) { Game.score += pts; Game.bonusDot += dot; }
      Game.domLeaves = (Game.domLeaves || 0) + leaves;
      Sau.segs += Math.round(leaves / 15);
      DM.reward = { leaves, pts, dot, t: 0 };
      DM.leaf.gone = true;
      DM.flash = 1;
      DM.flashCol = '#FFFFFF';
      Game.shake = 0.45;
      Sau.happy = 1;
      Sound.boom();
      buzz([60, 40, 120]);
      const L = DM.leaf;
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * TAU, sp = (180 + Math.random() * 420) * S;
        DM.fly.push({ x: L.x, y: L.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, home: 0.35 + Math.random() * 0.5, rot: Math.random() * 6, done: false });
      }
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * TAU, sp = (120 + Math.random() * 360) * S;
        spawn(i % 2 ? 15 : 16, L.x, L.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.7 + Math.random() * 0.6, (i % 2 ? 6 : 12) * S, i % 3 ? '#5FFFE0' : '#FFC24B');
      }
      UI.hud(Game);
    } else if (p === 'exit') { Sound.hum(false); Sound.domainExit(); }
  }
  function endDomain() {
    DM.phase = '';
    document.body.classList.remove('in-domain');
    DM.lasers = [];
    DM.fly = [];
    Game.startCount(DM.pos);
  }
  function domainHit() {
    DM.hits++;
    DM.inv = 0.5;
    let lost = 0;
    if (window.Wallet && !TRY_DOMAIN) Wallet.update((w) => { lost = Math.min(60, w.dot); w.dot -= lost; });
    else lost = 60;
    DM.lost += lost;
    DM.flash = 0.9;
    DM.flashCol = '#FF3B6B';
    Game.shake = 0.3;
    Sau.sad = 0.6;
    Sound.lzHit();
    buzz([40, 30, 60]);
    popup('−60 đốt', Sau.headX, Sau.headY - HEAD_R * 2.4, '#FF6F8E', 22);
  }
  function domainTap() {
    if (Game.state !== 'domain' || DM.phase !== 'spam') return;
    DM.taps++;
    const L = DM.leaf, R = leafR();
    L.shake = 1;
    L.crack = Math.min(1, DM.taps / TAP_FULL);
    Sau.chew = 0.2;
    Sau.happy = 0.5;
    burstSparks(L.x + (Math.random() - 0.5) * R * 0.9, L.y + (Math.random() - 0.3) * R, 7, Math.random() < 0.5 ? '#5FFFE0' : '#FFC24B');
    Sound.tap(DM.taps);
    buzz(6);
    if (DM.taps >= TAP_FULL) DM.pt = Math.max(DM.pt, DM_T.spam);
  }
  // Mỗi đợt laze: nhắm vào đầu bé hoặc rải ra, luôn chừa chỗ để né (vạch đỏ báo trước LZ_WARN giây).
  function spawnPattern() {
    const k = DM.pat++ % 6;
    const hx = Sau.headX, hy = DM.ty;
    const L = (kind, at, delay) => DM.lasers.push({ kind, at, t: -(delay || 0), hit: false });
    const xin = (x) => clamp(x, PX0 + 20 * S, PX0 + PW - 20 * S);
    const yin = (y) => clamp(y, dmYMin(), dmYMax());
    if (k === 0) L('v', xin(hx));
    else if (k === 1) L('h', yin(hy));
    else if (k === 2) { L('v', xin(hx)); L('v', xin(hx + (hx < PX0 + PW / 2 ? 1 : -1) * PW * 0.34)); }
    else if (k === 3) { L('v', xin(hx)); L('h', yin(hy)); }
    else if (k === 4) { for (let i = 0; i < 3; i++) L('v', PX0 + PW * (0.18 + 0.32 * i), i * 0.16); }
    else { L('h', yin(hy)); L('h', yin(hy + (hy < (dmYMin() + dmYMax()) / 2 ? 1 : -1) * H * 0.15)); }
    Sound.lzWarn();
  }
  function spawnItem(kind) {
    const R = leafR();
    let x = 0, y = 0;
    for (let i = 0; i < 8; i++) {
      x = PX0 + PW * (0.15 + Math.random() * 0.7);
      y = dmYMin() + Math.random() * (dmYMax() - dmYMin()) * 0.8;
      if (Math.hypot(x - Sau.headX, y - Sau.headY) > R) break;
    }
    DM.items.push({ kind, x, y, t: 0, life: 2.7 });
  }
  function domainTick(dt) {
    DM.pt += dt;
    DM.inv = Math.max(0, DM.inv - dt);
    DM.flash = Math.max(0, DM.flash - dt * 2.4);
    if (DM.leaf) DM.leaf.shake = Math.max(0, DM.leaf.shake - dt * 5);
    const ph = DM.phase, L = DM.leaf, R = leafR();
    if (ph === 'dodge') {
      if (keys.up || keys.down) DM.ty = clamp(DM.ty + (keys.down - keys.up) * H * 1.25 * dt, dmYMin(), dmYMax());
      if (keys.left || keys.right) Sau.target = clamp(Sau.target + (keys.right - keys.left) * PW * 2.2 * dt, PX0 + 18 * S, PX0 + PW - 18 * S);
    }
    Sau.headY = lerp(Sau.headY, DM.ty, 1 - Math.exp(-dt * (ph === 'ram' ? 9 : 16)));
    if (ph === 'enter') {
      if (DM.pt >= DM_T.enter) dmPhase('dodge');
    } else if (ph === 'dodge') {
      DM.next -= dt;
      if (DM.pt < DM_T.dodge - 1.0 && DM.next <= 0) { spawnPattern(); DM.next = 0.62 - Math.min(0.16, DM.pt * 0.035); }
      if (DM.spawned === 0 && DM.pt > 1.3) { DM.spawned = 1; spawnItem('pts'); }
      if (DM.spawned === 1 && DM.pt > 3.0) { DM.spawned = 2; spawnItem('dot'); }
      for (const z of DM.lasers) {
        const before = z.t;
        z.t += dt;
        if (before < LZ_WARN && z.t >= LZ_WARN) { Sound.lzFire(); Game.shake = Math.max(Game.shake, 0.08); }
        const firing = z.t >= LZ_WARN && z.t < LZ_WARN + LZ_FIRE;
        if (firing && !z.hit && DM.inv <= 0) {
          const d = z.kind === 'v' ? Math.abs(Sau.headX - z.at) : Math.abs(Sau.headY - z.at);
          if (d < 13 * S + HEAD_R * 0.55) { z.hit = true; domainHit(); }
        }
      }
      DM.lasers = DM.lasers.filter((z) => z.t < LZ_WARN + LZ_FIRE + 0.12);
      for (const it of DM.items) {
        it.t += dt;
        if (!it.got && Math.hypot(it.x - Sau.headX, it.y - Sau.headY) < HEAD_R * 1.8) {
          it.got = true;
          if (it.kind === 'pts') DM.x2pts = true; else DM.x2dot = true;
          Sound.item();
          burstSparks(it.x, it.y, 18, it.kind === 'pts' ? '#FFC24B' : '#7CE08A');
          popup(it.kind === 'pts' ? '×2 điểm!' : '×2 đốt!', it.x, it.y - 24 * S, it.kind === 'pts' ? GOLD() : '#7CE08A', 20);
        }
      }
      DM.items = DM.items.filter((it) => !it.got && it.t < it.life);
      if (DM.pt >= DM_T.dodge && !DM.lasers.length) dmPhase('ram');
    } else if (ph === 'ram') {
      // lao lên húc vào mũi lá, rồi bật lại một chút
      Sau.target = L.x;
      DM.ty = DM.pt < 0.45 ? L.y + R * 1.12 : L.y + R * 1.3;
      if (DM.pt >= 0.45 && !L.hitOnce) {
        L.hitOnce = true;
        L.shake = 1;
        L.crack = 0.12;
        DM.flash = 0.8;
        DM.flashCol = '#FFFFFF';
        Game.shake = 0.35;
        Sound.ram();
        buzz([50, 30, 50]);
        burstSparks(L.x, L.y + R, 26, '#5FFFE0');
        ring(L.x, L.y + R, '#5FFFE0');
      }
      if (DM.pt >= DM_T.ram) dmPhase('spam');
    } else if (ph === 'spam') {
      Sau.target = L.x;
      DM.ty = L.y + R * 1.25 - Math.max(0, Sau.chew) * 30 * S;
      if (DM.pt >= DM_T.spam) dmPhase('boom');
    } else if (ph === 'boom') {
      DM.ty = H * 0.62;
      if (DM.reward) DM.reward.t += dt;
      for (const f of DM.fly) {
        f.t += dt;
        f.rot += dt * 8;
        if (f.t < f.home) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - 2.5 * dt; f.vy *= 1 - 2.5 * dt; }
        else {
          const k = 1 - Math.exp(-dt * 9);
          f.x = lerp(f.x, Sau.headX, k);
          f.y = lerp(f.y, Sau.headY, k);
          if (!f.done && Math.hypot(f.x - Sau.headX, f.y - Sau.headY) < HEAD_R) { f.done = true; Sau.chew = 0.12; }
        }
      }
      if (DM.pt >= DM_T.boom) dmPhase('exit');
    } else if (ph === 'exit') {
      if (DM.pt >= DM_T.exit) endDomain();
    }
  }

  // ----- Vẽ lãnh địa -----
  // Nền bảng mạch vẽ sẵn một lần: xanh đen, lưới mờ, đường mạch rẽ góc 45°, chân hàn, vài con IC.
  function domainBg() {
    const key = W + 'x' + H + '@' + DPR;
    if (DM.bgKey === key) return DM.bg;
    const c = document.createElement('canvas');
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
    const x = c.getContext('2d');
    x.scale(DPR, DPR);
    const gr = x.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.8);
    gr.addColorStop(0, '#0C3036');
    gr.addColorStop(0.55, '#061A20');
    gr.addColorStop(1, '#02090C');
    x.fillStyle = gr;
    x.fillRect(0, 0, W, H);
    const step = 26 * S;
    x.strokeStyle = 'rgba(31,200,166,0.06)';
    x.lineWidth = 1;
    x.beginPath();
    for (let gx = 0; gx < W; gx += step) { x.moveTo(gx, 0); x.lineTo(gx, H); }
    for (let gy = 0; gy < H; gy += step) { x.moveTo(0, gy); x.lineTo(W, gy); }
    x.stroke();
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    DM.traces = [];
    for (let i = 0; i < 34; i++) {
      let px = Math.floor(rnd() * (W / step)) * step, py = Math.floor(rnd() * (H / step)) * step;
      let d = Math.floor(rnd() * 4) * 2;
      const pts = [[px, py]];
      const n = 5 + Math.floor(rnd() * 9);
      for (let j = 0; j < n; j++) {
        if (rnd() < 0.35) d = (d + (rnd() < 0.5 ? 1 : 7)) % 8;
        px += dirs[d][0] * step; py += dirs[d][1] * step;
        pts.push([px, py]);
      }
      const gold = i % 5 === 0;
      x.strokeStyle = gold ? 'rgba(232,184,74,0.28)' : 'rgba(31,200,166,0.26)';
      x.lineWidth = (gold ? 2.2 : 1.6) * S;
      x.lineJoin = 'round';
      x.beginPath();
      pts.forEach((p, k) => (k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])));
      x.stroke();
      x.fillStyle = '#061A20';
      for (const p of [pts[0], pts[pts.length - 1]]) { x.beginPath(); x.arc(p[0], p[1], 3 * S, 0, TAU); x.fill(); x.stroke(); }
      let len = 0;
      for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      DM.traces.push({ pts, len, gold, off: rnd() });
    }
    for (let i = 0; i < 6; i++) {
      const cx = rnd() * W, cy = rnd() * H, w = (30 + rnd() * 30) * S, h = (18 + rnd() * 18) * S;
      x.fillStyle = 'rgba(8,24,28,0.95)';
      x.fillRect(cx - w / 2, cy - h / 2, w, h);
      x.strokeStyle = 'rgba(31,200,166,0.3)';
      x.lineWidth = 1;
      x.strokeRect(cx - w / 2, cy - h / 2, w, h);
      x.fillStyle = 'rgba(232,184,74,0.35)';
      for (let k = 0; k < 5; k++) {
        x.fillRect(cx - w / 2 + (k + 0.5) * (w / 5) - 1.5 * S, cy - h / 2 - 4 * S, 3 * S, 4 * S);
        x.fillRect(cx - w / 2 + (k + 0.5) * (w / 5) - 1.5 * S, cy + h / 2, 3 * S, 4 * S);
      }
    }
    DM.bg = c;
    DM.bgKey = key;
    return c;
  }
  function tracePoint(tr, u) {
    let d = u * tr.len;
    for (let k = 1; k < tr.pts.length; k++) {
      const a = tr.pts[k - 1], b = tr.pts[k], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d <= l) return [lerp(a[0], b[0], d / l), lerp(a[1], b[1], d / l)];
      d -= l;
    }
    return tr.pts[tr.pts.length - 1];
  }
  function drawDomainBg(k) {
    g.save();
    g.globalAlpha = k;
    g.drawImage(domainBg(), 0, 0, W, H);
    // xung điện chạy dọc đường mạch
    for (const tr of DM.traces) {
      const u = (clock * (tr.gold ? 0.22 : 0.35) + tr.off) % 1;
      const [px, py] = tracePoint(tr, u);
      const col = tr.gold ? '255,201,60' : '95,255,224';
      const gl = g.createRadialGradient(px, py, 0, px, py, 9 * S);
      gl.addColorStop(0, 'rgba(' + col + ',0.9)');
      gl.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = gl;
      g.beginPath(); g.arc(px, py, 9 * S, 0, TAU); g.fill();
    }
    // vạch quét ngang chầm chậm
    const sy = ((clock * 0.18) % 1) * H;
    const sc = g.createLinearGradient(0, sy - 40 * S, 0, sy + 4 * S);
    sc.addColorStop(0, 'rgba(95,255,224,0)');
    sc.addColorStop(1, 'rgba(95,255,224,0.12)');
    g.fillStyle = sc;
    g.fillRect(0, sy - 40 * S, W, 44 * S);
    g.restore();
  }
  // Chiếc lá chip khổng lồ: lá treo ngược làm bằng bảng mạch, gân là đường bus vàng, giữa là con chip "mắt"
  // (đỏ rực khi sắp bắn), nứt dần khi bị chạm, nổ tung ở cuối.
  function drawChipLeaf() {
    const L = DM.leaf;
    if (!L || L.gone) return;
    const R = leafR();
    const sh = L.shake * 9 * S;
    const x = L.x + (sh ? (Math.random() - 0.5) * sh : 0), y = L.y + Math.sin(clock * 1.6) * 5 * S + (sh ? (Math.random() - 0.5) * sh : 0);
    const warn = DM.lasers.some((z) => z.t >= 0 && z.t < LZ_WARN + LZ_FIRE);
    const leafPath = () => {
      g.beginPath();
      g.moveTo(0, -R);
      g.bezierCurveTo(R * 0.98, -R * 0.78, R * 0.92, R * 0.4, 0, R * 1.08);
      g.bezierCurveTo(-R * 0.92, R * 0.4, -R * 0.98, -R * 0.78, 0, -R);
      g.closePath();
    };
    g.save();
    g.translate(x, y);
    const glow = g.createRadialGradient(0, 0, R * 0.4, 0, 0, R * 1.7);
    glow.addColorStop(0, warn ? 'rgba(255,59,107,0.32)' : 'rgba(31,200,166,0.3)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.beginPath(); g.arc(0, 0, R * 1.7, 0, TAU); g.fill();
    const body = g.createLinearGradient(-R, -R, R, R);
    body.addColorStop(0, '#17695A');
    body.addColorStop(1, '#0A3A33');
    g.fillStyle = body;
    leafPath(); g.fill();
    g.save();
    leafPath(); g.clip();
    // gân lá là đường bus vàng, nhánh rẽ vuông góc, chân hàn ở đầu nhánh
    g.strokeStyle = '#E8B84A';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = 5 * S;
    g.beginPath(); g.moveTo(0, -R * 0.95); g.lineTo(0, R); g.stroke();
    g.lineWidth = 2.2 * S;
    for (let i = 0; i < 6; i++) {
      const yy = -R * 0.7 + i * R * 0.27;
      for (const side of [-1, 1]) {
        const ex = side * R * (0.75 - Math.abs(i - 2) * 0.08);
        g.beginPath();
        g.moveTo(0, yy);
        g.lineTo(side * R * 0.22, yy - R * 0.12);
        g.lineTo(ex, yy - R * 0.12);
        g.stroke();
        g.fillStyle = '#0A3A33';
        g.beginPath(); g.arc(ex, yy - R * 0.12, 3.4 * S, 0, TAU); g.fill(); g.stroke();
      }
    }
    // linh kiện nhỏ
    g.fillStyle = '#1C2A30';
    for (let i = 0; i < 6; i++) g.fillRect((i % 2 ? 1 : -1) * R * 0.4 - 6 * S, -R * 0.55 + i * R * 0.24, 12 * S, 6 * S);
    // vết nứt
    if (L.crack > 0) {
      g.strokeStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * L.crack) + ')';
      g.lineWidth = 2.2 * S;
      const n = Math.ceil(L.crack * 9);
      for (let i = 0; i < n; i++) {
        const a = (i / 9) * TAU + 0.4;
        let px = 0, py = 0;
        g.beginPath(); g.moveTo(0, 0);
        for (let j = 1; j <= 4; j++) {
          px = Math.cos(a + (j % 2 ? 0.25 : -0.2)) * R * 0.28 * j * (0.6 + L.crack * 0.5);
          py = Math.sin(a + (j % 2 ? 0.25 : -0.2)) * R * 0.28 * j * (0.6 + L.crack * 0.5);
          g.lineTo(px, py);
        }
        g.stroke();
      }
    }
    g.restore();
    g.strokeStyle = warn ? '#FF6F8E' : '#5FFFE0';
    g.lineWidth = 2.6 * S;
    leafPath(); g.stroke();
    // con chip ở giữa: chân vàng bốn phía, lõi sáng
    const c = R * 0.26;
    g.fillStyle = '#E8B84A';
    for (let i = -2; i <= 2; i++) {
      g.fillRect(i * c * 0.36 - 2 * S, -c - 6 * S, 4 * S, 6 * S);
      g.fillRect(i * c * 0.36 - 2 * S, c, 4 * S, 6 * S);
      g.fillRect(-c - 6 * S, i * c * 0.36 - 2 * S, 6 * S, 4 * S);
      g.fillRect(c, i * c * 0.36 - 2 * S, 6 * S, 4 * S);
    }
    g.fillStyle = '#10161C';
    g.fillRect(-c, -c, c * 2, c * 2);
    const pulse = 0.6 + 0.4 * Math.sin(clock * (warn ? 18 : 4));
    const core = g.createRadialGradient(0, 0, 0, 0, 0, c * 0.9);
    core.addColorStop(0, warn ? 'rgba(255,90,120,' + pulse + ')' : 'rgba(95,255,224,' + pulse + ')');
    core.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = core;
    g.fillRect(-c, -c, c * 2, c * 2);
    g.restore();
  }
  function drawLasers() {
    const L = DM.leaf, R = leafR();
    for (const z of DM.lasers) {
      if (z.t < 0) continue;
      const vert = z.kind === 'v';
      const x0 = vert ? z.at : 0, y0 = vert ? L.y + R * 0.6 : z.at, x1 = vert ? z.at : W, y1 = vert ? H : z.at;
      g.save();
      g.lineCap = 'round';
      if (z.t < LZ_WARN) {
        // báo trước: vạch đỏ nhấp nháy, dày dần, hai đầu có dấu "!"
        const a = 0.35 + 0.35 * Math.abs(Math.sin(z.t * 22));
        g.strokeStyle = 'rgba(255,59,107,' + a + ')';
        g.lineWidth = (2 + 10 * (z.t / LZ_WARN)) * S;
        g.setLineDash([10 * S, 8 * S]);
        g.lineDashOffset = -clock * 60 * S;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        g.setLineDash([]);
        g.fillStyle = 'rgba(255,90,120,' + (a + 0.3) + ')';
        g.font = '800 ' + Math.round(18 * S) + 'px "Be Vietnam Pro", system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        if (vert) g.fillText('!', x0, H - 24 * S); else { g.fillText('!', 14 * S, y0); g.fillText('!', W - 14 * S, y0); }
      } else {
        const f = 1 - (z.t - LZ_WARN) / LZ_FIRE;
        const w = 13 * S * (0.6 + 0.4 * f);
        g.globalAlpha = Math.max(0, Math.min(1, f * 1.4));
        g.strokeStyle = 'rgba(255,40,110,0.35)';
        g.lineWidth = w * 3.2;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        g.strokeStyle = '#FF3B6B';
        g.lineWidth = w * 1.6;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        g.strokeStyle = '#FFFFFF';
        g.lineWidth = w * 0.55;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
      g.restore();
    }
  }
  function drawItems() {
    for (const it of DM.items) {
      const pts = it.kind === 'pts';
      const blink = it.life - it.t < 0.8 ? 0.4 + 0.6 * Math.abs(Math.sin(it.t * 14)) : 1;
      const y = it.y + Math.sin(clock * 4 + it.x) * 4 * S, w = 66 * S, h = 30 * S;
      g.save();
      g.globalAlpha = blink;
      const gl = g.createRadialGradient(it.x, y, 0, it.x, y, 46 * S);
      gl.addColorStop(0, pts ? 'rgba(255,201,60,0.45)' : 'rgba(124,224,138,0.45)');
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl;
      g.beginPath(); g.arc(it.x, y, 46 * S, 0, TAU); g.fill();
      const bg = g.createLinearGradient(it.x, y - h / 2, it.x, y + h / 2);
      bg.addColorStop(0, pts ? '#FFE08A' : '#A6F0B0');
      bg.addColorStop(1, pts ? '#E8A21E' : '#2FA36B');
      g.fillStyle = bg;
      g.beginPath();
      if (g.roundRect) g.roundRect(it.x - w / 2, y - h / 2, w, h, 9 * S); else g.rect(it.x - w / 2, y - h / 2, w, h);
      g.fill();
      g.strokeStyle = '#FFFFFF';
      g.lineWidth = 1.6 * S;
      g.stroke();
      g.fillStyle = '#2B2140';
      g.font = '800 ' + Math.round(13 * S) + 'px "Be Vietnam Pro", system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(pts ? '×2 ĐIỂM' : '×2 ĐỐT', it.x, y + 0.5 * S);
      g.restore();
    }
  }
  function banner(text, y, size, color) {
    g.save();
    g.font = '800 ' + Math.round(size * S) + 'px "Be Vietnam Pro", system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = 6 * S;
    g.strokeStyle = 'rgba(2,9,12,0.85)';
    g.strokeText(text, W / 2, y);
    g.fillStyle = color;
    g.fillText(text, W / 2, y);
    g.restore();
  }
  function bar(y, p, color) {
    const w = Math.min(PW * 0.7, 260 * S), x = W / 2 - w / 2, h = 8 * S;
    g.fillStyle = 'rgba(255,255,255,0.15)';
    g.fillRect(x, y, w, h);
    g.fillStyle = color;
    g.fillRect(x, y, w * clamp(p, 0, 1), h);
  }
  function renderDomain(dt) {
    const ph = DM.phase;
    const k = ph === 'enter' ? clamp(DM.pt / 0.55, 0, 1) : ph === 'exit' ? clamp(1 - DM.pt / DM_T.exit, 0, 1) : 1;
    if (k < 1) drawBackground(0, 0, 0);
    drawDomainBg(k);
    // vòng sóng loang ra khi mở / thu lại khi đóng lãnh địa
    if (ph === 'enter' || ph === 'exit') {
      const u = ph === 'enter' ? DM.pt / DM_T.enter : 1 - DM.pt / DM_T.exit;
      g.save();
      g.strokeStyle = 'rgba(95,255,224,' + (1 - Math.abs(u - 0.5) * 1.6) + ')';
      g.lineWidth = 6 * S;
      g.beginPath(); g.arc(Sau.headX, Sau.headY, u * Math.hypot(W, H), 0, TAU); g.stroke();
      g.restore();
    }
    g.save();
    g.globalAlpha = k;
    drawChipLeaf();
    drawLasers();
    drawItems();
    g.restore();
    drawSau(Game.speed * 0.8, Game.pulse || 0, 0);
    if (DM.inv > 0) {
      g.save();
      g.strokeStyle = 'rgba(255,59,107,' + DM.inv * 1.6 + ')';
      g.lineWidth = 3 * S;
      g.beginPath(); g.arc(Sau.headX, Sau.headY, HEAD_R * 1.5, 0, TAU); g.stroke();
      g.restore();
    }
    for (const f of DM.fly) {
      if (f.done) continue;
      const sc = 0.55;
      g.save();
      g.translate(f.x, f.y);
      g.rotate(f.rot);
      g.drawImage(SPR.leaf, (-SPR.leafW * sc) / 2, -SPR.leafCY * sc, SPR.leafW * sc, SPR.leafH * sc);
      g.restore();
    }
    drawParticles();
    drawPopups(dt);
    // chữ hướng dẫn từng pha
    const by = H * 0.4;
    if (TRY_DOMAIN) banner('Chơi thử: không trừ đốt, không cộng điểm', H - 14 * S, 11, '#9BE5D5');
    if (ph === 'enter') banner('LÃNH ĐỊA VI MẠCH', by, 26, '#5FFFE0');
    else if (ph === 'dodge') {
      // chữ to chỉ hiện lúc đầu rồi mờ đi; thời gian, số lần trúng, món đã nhặt nằm sát đáy cho khỏi che chỗ né
      if (DM.pt < 1.6) {
        g.save();
        g.globalAlpha = clamp((1.6 - DM.pt) / 0.4, 0, 1);
        banner('NÉ LAZE!', H * 0.55, 28, '#FFFFFF');
        banner(('ontouchstart' in window) ? 'Kéo ngón tay để né, chỉ cần đầu không trúng' : 'Rê chuột (hoặc W A S D) để né, chỉ cần đầu không trúng', H * 0.55 + 30 * S, 13, '#9BE5D5');
        g.restore();
      }
      const fy = H - 46 * S;
      bar(fy, 1 - DM.pt / DM_T.dodge, '#5FFFE0');
      const info = [DM.hits ? 'Trúng ' + DM.hits + ' · −' + fmtNum(DM.lost) + ' đốt' : 'Chưa trúng tia nào', DM.x2pts && '×2 ĐIỂM', DM.x2dot && '×2 ĐỐT'].filter(Boolean).join('  ·  ');
      banner(info, fy - 16 * S, 13, DM.hits ? '#FF8FA3' : '#9BE5D5');
    } else if (ph === 'ram') banner('HÚC!', by, 30, '#FFE08A');
    else if (ph === 'spam') {
      const isPc = !('ontouchstart' in window);
      banner(isPc ? 'BẤM PHÍM CÁCH LIÊN TỤC!' : 'CHẠM LIÊN TỤC!', by, 22, '#FFFFFF');
      bar(by + 22 * S, DM.taps / TAP_FULL, '#FFC24B');
      banner(String(DM.taps), by + 62 * S, 34 + Math.min(14, DM.taps * 0.5), '#FFC24B');
    } else if ((ph === 'boom' || ph === 'exit') && DM.reward) {
      const r = DM.reward, u = clamp(r.t / 0.8, 0, 1);
      banner('+' + Math.round(r.leaves * u) + ' lá', by - 10 * S, 30, '#9BE58A');
      banner('+' + fmtNum(Math.round((r.pts * u) / 100) * 100) + ' điểm' + (DM.x2pts ? ' (×2)' : ''), by + 30 * S, 22, '#FFE08A');
      banner('+' + fmtNum(Math.round(r.dot * u)) + ' đốt' + (DM.x2dot ? ' (×2)' : ''), by + 64 * S, 20, '#9BE58A');
      if (TRY_DOMAIN) banner('(chơi thử nên không cộng vào ví)', by + 92 * S, 12, '#9BE5D5');
    }
    if (DM.flash > 0) {
      g.save();
      g.globalAlpha = DM.flash * 0.55;
      g.fillStyle = DM.flashCol;
      g.fillRect(0, 0, W, H);
      g.restore();
    }
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
    const t = Game.songT, v = vis(), hy = Sau.headY;
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
    if (Game.state === 'domain') { renderDomain(dt); return; }
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
        if (fx.wind) drawWind(lk, sk);
        if (fx.wide && !LZ) drawWideRing(lk, sk);
        if (fx.magnet) drawMagnet(lk, sk);
        if (fx.foresight) drawMarks(lk, sk);
        if (fx.auto) drawBeam(lk, sk);
        if (fx.net && Game.sk.net > 0) drawNet(lk, sk);
        if (fx.clone) drawClone(lk, sk);
        if (fx.surf) drawSurf(lk, sk);
        if (fx.lotus) drawLotus(lk, sk);
        if (sk.look === 'waves') drawWaves(lk, sk);
      }
      drawSau(wallSpeed, Game.pulse || 0, 0);
      if (STARS.length) drawStars();
      if (fx && fx.shield) drawShield(lk, sk);
      if (fx && fx.slow) drawUmbrella(lk, sk);
      if (fx && fx.combo2) drawScoreBadge(lk, 0, 'Combo ×2', -1);
      const bst = fx ? Math.round(Game.boost() * 10) / 10 : 1;
      if (bst > 1) drawScoreBadge(lk, bst);
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
  const SUP_LEN = 2 * Math.PI * 22; // vòng vàng mảnh phía trong: nạp Lãnh Địa Vi Mạch
  const UI = {
    els: {
      hud: $('hud'), menu: $('menu'), pause: $('pause'), result: $('result'), revive: $('revive'), hint: $('hint'), toast: $('toast'),
      score: $('score'), scoreBox: $('score').parentElement, length: $('length'), hearts: $('hearts'), combo: $('combo'), comboNum: $('combo-num'),
      progress: $('progress-fill'), songs: $('songs'), pstars: $('pstars'), speed: $('speed'), wallet: $('wallet'),
      skill: $('skill'), skillFill: $('skill-fill'), skillIc: $('skill-ic'), skillSup: $('skill-sup'),
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
        for (let i = 0; i < Math.max(3, gm.hearts); i++) e.hearts.appendChild(svgIcon(PATH_HEART, i < gm.hearts ? (i >= 3 ? 'bonus' : '') : 'lost'));
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
      const sup = !!sk.fx.domain, supReady = sup && gm.sk.sup >= DOMAIN_NEED;
      const icKey = sk.id + '|' + sk.iconTier + '|' + supReady;
      if (this.last.skId !== icKey) {
        this.els.skillIc.innerHTML = Skins.skillIcon(sk.id, 28, supReady ? 2 : sk.iconTier);
        el.style.setProperty('--sk', sk.color);
        el.classList.toggle('has-sup', sup);
        el.classList.toggle('super', supReady);
        this.last.skId = icKey;
      }
      if (sup) {
        const sp = Math.round((gm.sk.sup / DOMAIN_NEED) * 100) / 100;
        if (this.last.supP !== sp) { this.els.skillSup.style.strokeDashoffset = (SUP_LEN * (1 - sp)).toFixed(1); this.last.supP = sp; }
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
      $('rv-msg').textContent = gm.stars >= 3
        ? 'Đủ 3 sao rồi, hoá bướm luôn cũng được. Hay dùng ' + step.dot + ' đốt cây hồi sinh với ' + step.hearts + ' tim, chơi tiếp kiếm thêm điểm?'
        : 'Dùng ' + step.dot + ' đốt cây để hồi sinh với ' + step.hearts + ' tim, chơi tiếp từ chỗ vừa rồi nha?';
      $('btn-giveup').textContent = gm.stars >= 3 ? 'Thôi, hoá bướm luôn' : 'Thôi, xem kết quả';
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
      mw.hidden = !window.Wallet;
      if (window.Wallet) $('menu-wallet-n').textContent = fmtNum(Wallet.get().dot);
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
      gm.quest((q) => {
        q.combo = Math.max(q.combo || 0, gm.maxCombo);
        if (gm.diff === 2 && stars >= 3 && !gm.revives) q.hard[gm.song.id] = 1;
      });
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
    // Được Mùa: đốt cây thưởng cộng thẳng vào ví.
    const extra = (Game.bonusDot || 0) - (Game.bonusBanked || 0);
    if (extra > 0 && window.Wallet) {
      Wallet.update((w) => { w.dot += extra; });
      Game.bonusBanked = Game.bonusDot;
      Game.dotGot = (Game.dotGot || 0) + extra;
    }
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
    const wasTrial = !!LOOK.trial;
    loadLook();
    const t = trialGet();
    if (wasTrial && !LOOK.trial && t && !t.told) {
      t.told = true;
      trialSet(t);
      setTimeout(() => UI.toast('Hết lượt dùng thử. Nâng cấp ở Tiệm Sâu nhé!'), 400);
    }
    UI.renderSongs(SONGS);
    UI.els.menu.classList.remove('away');
  }

  // ================= Điều khiển =================
  const SENS = 1.25;
  let dragId = null, lastPX = 0, lastPY = 0;
  const lastTap = { t: 0, x: 0, y: 0 };
  function domainPointer(e) {
    if (DM.phase === 'spam') { domainTap(); return; }
    dragId = e.pointerId;
    lastPX = e.clientX;
    lastPY = e.clientY;
  }
  // Pha né: kéo ngón tay để bé đi cả ngang lẫn dọc.
  window.addEventListener('pointermove', (e) => {
    if (Game.state !== 'domain') return;
    // chuột: bé đi thẳng tới chỗ con trỏ, không cần giữ nút
    if (e.pointerType === 'mouse') {
      if (DM.phase === 'dodge') {
        Sau.target = clamp(e.clientX, PX0 + 18 * S, PX0 + PW - 18 * S);
        DM.ty = clamp(e.clientY, dmYMin(), dmYMax());
      }
      return;
    }
    if (e.pointerId !== dragId) return;
    if (DM.phase === 'dodge') {
      Sau.target = clamp(Sau.target + (e.clientX - lastPX) * SENS, PX0 + 18 * S, PX0 + PW - 18 * S);
      DM.ty = clamp(DM.ty + (e.clientY - lastPY) * SENS, dmYMin(), dmYMax());
    }
    lastPX = e.clientX;
    lastPY = e.clientY;
  });
  // Chạm liên tục trong lãnh địa không được phóng to màn hình hay cuộn trang.
  document.addEventListener('touchstart', (e) => { if (Game.state === 'domain' && e.cancelable) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchend', (e) => { if (Game.state === 'domain' && e.cancelable) e.preventDefault(); }, { passive: false });
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
    if (Game.state === 'domain') return;
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
    if (now - lastTap.t < 330 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 80 * S) { lastTap.t = 0; Game.trigger(); }
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
    const surf = (Game.skFx() && Game.skFx().surf) || 1;
    if (!Game.reading()) Sau.target = clamp(Sau.target + (e.clientX - lastPX) * SENS * surf, PX0 + 18 * S, PX0 + PW - 18 * S);
    lastPX = e.clientX;
  });
  const endDrag = (e) => {
    if (petId !== null && e.pointerId === petId) { if (PET) PET.pointer('up', e.clientX - Sau.headX, e.clientY - Sau.headY, HEAD_R); petId = null; }
    if (e.pointerId === dragId) dragId = null;
  };
  window.addEventListener('pointerup', (e) => { if (Game.state === 'domain' && e.pointerId === dragId) dragId = null; });
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  const keys = { left: false, right: false, up: false, down: false };
  window.addEventListener('keydown', (e) => {
    const kk = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (kk === 'ArrowLeft' || (kk === 'a' && Game.state === 'domain')) keys.left = true;
    else if (kk === 'ArrowRight' || (kk === 'd' && Game.state === 'domain')) keys.right = true;
    else if (kk === 'ArrowUp' || (kk === 'w' && Game.state === 'domain')) { keys.up = true; if (Game.state === 'domain') e.preventDefault(); }
    else if (kk === 'ArrowDown' || (kk === 's' && Game.state === 'domain')) { keys.down = true; if (Game.state === 'domain') e.preventDefault(); }
    else if (e.key === ' ' && Game.state === 'domain') { e.preventDefault(); if (!e.repeat) domainTap(); }
    else if ((e.key === 'Escape' || e.key === 'p') && Game.state === 'play') Game.pause();
    else if ((e.key === ' ' || e.key === 'k') && Game.state === 'play') { e.preventDefault(); Game.trigger(); }
  });
  window.addEventListener('keyup', (e) => {
    const kk = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (kk === 'ArrowLeft' || kk === 'a') keys.left = false;
    else if (kk === 'ArrowRight' || kk === 'd') keys.right = false;
    else if (kk === 'ArrowUp' || kk === 'w') keys.up = false;
    else if (kk === 'ArrowDown' || kk === 's') keys.down = false;
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
  // Màn chọn bài: bấm nút kỹ năng thì mở thẻ chi tiết.
  function showSkillInfo() {
    const sk = LOOK.skill;
    if (!sk) return;
    const card = document.querySelector('#skillinfo .skill-card');
    card.style.setProperty('--sk', sk.color);
    card.style.setProperty('--sk-bg', sk.color + '24');
    $('si-ic').innerHTML = Skins.skillIcon(sk.id, sk.iconTier ? 56 : 38, sk.iconTier);
    $('si-tier').textContent = 'Kỹ năng · ' + Skins.RARITY[sk.rarity].name + (sk.max ? ' · bậc ' + sk.level + '/' + sk.max : '');
    $('si-name').textContent = sk.breakthrough ? sk.name + ' · ' + sk.breakthrough : sk.name;
    $('si-line').textContent = sk.line;
    const list = $('si-list');
    list.replaceChildren(...sk.effects.map((e) => { const li = document.createElement('li'); li.textContent = e.charAt(0).toUpperCase() + e.slice(1) + '.'; return li; }));
    $('si-how').textContent = sk.how;
    $('skillinfo').hidden = false;
    $('btn-si-close').focus({ preventScroll: true });
  }
  $('menu-skill').addEventListener('click', () => { Sound.click(); showSkillInfo(); });
  $('btn-si-close').addEventListener('click', () => { Sound.click(); $('skillinfo').hidden = true; });
  $('skillinfo').addEventListener('click', (e) => { if (e.target === $('skillinfo')) $('skillinfo').hidden = true; });
  // Nút kỹ năng: bấm xuống là dùng ngay (không chờ nhấc tay).
  $('skill').addEventListener('pointerdown', (e) => { e.preventDefault(); Game.trigger(); });
  $('skill').addEventListener('click', () => Game.trigger());
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
    if (window.Wallet) $('menu-wallet-n').textContent = fmtNum(Wallet.get().dot);
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
        Sau.target = clamp(Sau.target + (keys.right - keys.left) * PW * 1.6 * ((Game.skFx() && Game.skFx().surf) || 1) * dt, PX0 + 18 * S, PX0 + PW - 18 * S);
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
  if (DEBUG) window.__sautim = { Game, Sau, Sound, DM, startDomain, domainTap };
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
