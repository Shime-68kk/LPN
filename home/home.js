// Trang chủ mới: bầu trời theo thời tiết thật, lời chào, nhạc gợi ý và các mục.
'use strict';
(() => {
  // ================= Cấu hình =================
  const NAME = 'Thủy';
  const ANNIVERSARY = '2026-08-06T23:38:58';
  // Em ở Thái Nguyên: dùng khi máy chưa cho phép lấy vị trí.
  const DEFAULT_LOC = { lat: 21.5942, lon: 105.8482, name: 'Thái Nguyên' };
  // Anh ở Hà Nội: hiện thêm trong bảng thời tiết.
  const PARTNER_LOC = { lat: 21.0285, lon: 105.8542, name: 'Hà Nội' };
  const WEATHER_TTL = 20 * 60 * 1000;
  const SONG_FOR = { binhminh: 'lo-say-bye', nang: 'noi-nay-co-anh', may: 'ai-ngoai-anh', mua: 'missing-you', hoanghon: 'in-love', dem: 'anh-la-ai' };
  const SKY_COLOR = { binhminh: '#FFE3D3', nang: '#BFE4FF', may: '#D5DBE9', mua: '#8D9AB5', hoanghon: '#FFB996', dem: '#29224E' };
  const ICON = {
    binhminh: 'M3 19h18M7 19a5 5 0 0 1 10 0M12 5v4M4.9 11.9l1.4 1.4M19.1 11.9l-1.4 1.4M9.5 7.5L12 5l2.5 2.5',
    nang: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    may: 'M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 11.1A3.5 3.5 0 0 0 7 18z',
    mua: 'M7 15h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 8.1A3.5 3.5 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3',
    hoanghon: 'M3 19h18M7 19a5 5 0 0 1 10 0M12 4v5M4.9 11.9l1.4 1.4M19.1 11.9l-1.4 1.4M9.5 6.5L12 9l2.5-2.5',
    dem: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  };
  const SKY_NAME = { binhminh: 'Bình minh', nang: 'Nắng', may: 'Mây', mua: 'Mưa', hoanghon: 'Hoàng hôn', dem: 'Đêm' };
  const LEDE = {
    binhminh: ['Dậy sớm thế, trời đang hửng nắng kìa.', 'Chào ngày mới, hôm nay cũng cố lên nha.'],
    nang: ['Trời trong veo, hợp đi uống trà sữa đó.', 'Nắng đẹp như em vậy á.'],
    may: ['Mây nhiều thì để anh làm mặt trời cho.', 'Trời hơi âm u, nhớ ăn uống đủ nha.'],
    mua: ['Mưa rồi, nhớ mang ô nha.', 'Ở nhà nghe nhạc với anh không?'],
    hoanghon: ['Ra ban công ngắm trời cùng anh nè.', 'Chiều nay trời đẹp ghê.'],
    dem: ['Hôm nay em đã giỏi lắm rồi.', 'Ngủ sớm nha, mai gặp anh.'],
  };
  const SONG_NOTE = { binhminh: 'Nhạc cho buổi sớm', nang: 'Nhạc cho ngày nắng', may: 'Nhạc cho trời mây', mua: 'Nhạc nghe khi mưa', hoanghon: 'Nhạc lúc hoàng hôn', dem: 'Nhạc trước khi ngủ' };

  const $ = (id) => document.getElementById(id);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } },
  };
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (ms) => { const d = new Date(ms); return d.getHours() + ':' + pad(d.getMinutes()); };

  // ================= Thời tiết =================
  const RAIN = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
  function codeLabel(code, night) {
    if (code === 0) return night ? 'Trời sao' : 'Trời quang';
    if (code === 1) return night ? 'Trời sao' : 'Nắng nhẹ';
    if (code === 2) return 'Có mây';
    if (code === 3) return 'Nhiều mây';
    if (code === 45 || code === 48) return 'Sương mù';
    if (code >= 51 && code <= 57) return 'Mưa phùn';
    if (code >= 61 && code <= 67) return 'Có mưa';
    if (code >= 80 && code <= 82) return 'Mưa rào';
    if (code >= 95) return 'Dông';
    return 'Có mây';
  }
  // Giờ địa phương của Open-Meteo ("2026-10-16T05:58") → mốc thời gian thật.
  function localToEpoch(s, offsetSec) {
    const [d, t] = s.split('T');
    const [y, mo, da] = d.split('-').map(Number);
    const [h, mi] = t.split(':').map(Number);
    return Date.UTC(y, mo - 1, da, h, mi) - offsetSec * 1000;
  }

  function classify(data) {
    const now = Date.now();
    const c = data.current;
    const off = data.utc_offset_seconds || 0;
    const rise = localToEpoch(data.daily.sunrise[0], off);
    const set = localToEpoch(data.daily.sunset[0], off);
    const night = now < rise - 30 * 60e3 || now > set + 30 * 60e3;
    let sky;
    if (RAIN.has(c.weather_code)) sky = 'mua';
    else if (night) sky = 'dem';
    else if (Math.abs(now - rise) <= 45 * 60e3) sky = 'binhminh';
    else if (Math.abs(now - set) <= 40 * 60e3) sky = 'hoanghon';
    else if (c.cloud_cover >= 70 || c.weather_code === 3 || c.weather_code === 45 || c.weather_code === 48) sky = 'may';
    else sky = 'nang';
    let label = codeLabel(c.weather_code, night);
    if (sky === 'binhminh' || sky === 'hoanghon') label = SKY_NAME[sky];
    return { sky, night, label, temp: Math.round(c.temperature_2m), rise, set };
  }

  // Không có mạng: đoán theo giờ.
  function guessByClock() {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    const night = h >= 18.5 || h < 5.5;
    const sky = night ? 'dem' : h < 6.5 ? 'binhminh' : h >= 17 ? 'hoanghon' : 'nang';
    return { sky, night, label: night ? 'Buổi tối' : 'Hôm nay', temp: null, rise: null, set: null };
  }

  async function fetchWeather(loc) {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat.toFixed(3) + '&longitude=' + loc.lon.toFixed(3) +
      '&current=temperature_2m,weather_code,cloud_cover,is_day&daily=sunrise,sunset&timezone=auto&forecast_days=1';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo ' + res.status);
    return res.json();
  }

  // Lưu tạm theo từng vị trí 20 phút; lỗi mạng thì dùng bản cũ.
  async function weatherFor(loc, force) {
    const key = 'lpn:wx:' + loc.lat.toFixed(2) + ',' + loc.lon.toFixed(2);
    const cached = store.get(key);
    if (cached && !force && Date.now() - cached.at < WEATHER_TTL) return classify(cached.data);
    try {
      const data = await fetchWeather(loc);
      store.set(key, { at: Date.now(), data });
      return classify(data);
    } catch (err) {
      console.warn(err);
      return cached ? classify(cached.data) : null;
    }
  }

  const Weather = {
    current: null,
    preview: null,
    loc() { return store.get('lpn:loc') || DEFAULT_LOC; },

    partner: null,

    async refresh(force) {
      this.current = (await weatherFor(this.loc(), force)) || guessByClock();
      this.apply();
      this.partner = await weatherFor(PARTNER_LOC, force);
      this.renderPanel();
    },

    apply() {
      const w = this.current || guessByClock();
      const sky = this.preview || w.sky;
      document.body.dataset.weather = sky;
      document.body.classList.toggle('night', this.preview ? sky === 'dem' : w.night);
      document.querySelector('meta[name="theme-color"]').setAttribute('content', SKY_COLOR[sky]);
      $('weather-icon').setAttribute('d', ICON[sky]);
      $('weather-text').textContent = this.preview
        ? 'Xem thử: ' + SKY_NAME[sky]
        : w.label + (w.temp !== null ? ' · ' + w.temp + '°' : '');
      // Game Sâu Tím đọc giá trị này để nền game giống trời thật.
      if (!this.preview) store.set('lpn:sky', { sky, at: Date.now() });
      Home.render(sky);
      this.renderPanel();
    },

    renderPanel() {
      const w = this.current || guessByClock();
      $('wx-temp').textContent = w.temp !== null ? w.temp + '°' : '--°';
      $('wx-label').textContent = w.label;
      $('wx-sun').textContent = w.rise ? 'Mặt trời mọc ' + hm(w.rise) + ' · lặn ' + hm(w.set) : 'Chưa lấy được thời tiết';
      $('wx-place').textContent = store.get('lpn:loc') ? 'Theo vị trí hiện tại' : 'Chỗ em · ' + DEFAULT_LOC.name;
      const p = this.partner;
      $('wx-partner').hidden = !p;
      if (p) {
        $('wx-partner-icon').setAttribute('d', ICON[p.sky]);
        $('wx-partner-text').textContent = PARTNER_LOC.name + ' · ' + p.label + ' · ' + p.temp + '°';
      }
      const box = $('wx-try');
      box.replaceChildren();
      for (const id of Object.keys(ICON)) {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(this.preview === id));
        b.appendChild(icon(ICON[id]));
        b.appendChild(document.createTextNode(SKY_NAME[id]));
        b.addEventListener('click', () => { this.preview = this.preview === id ? null : id; this.apply(); });
        box.appendChild(b);
      }
    },

    locate() {
      if (!navigator.geolocation) return;
      const btn = $('btn-locate');
      btn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          store.set('lpn:loc', { lat: pos.coords.latitude, lon: pos.coords.longitude, name: 'here' });
          btn.disabled = false;
          this.preview = null;
          this.refresh(true);
        },
        () => { btn.disabled = false; $('wx-place').textContent = 'Chưa được phép lấy vị trí, đang dùng ' + DEFAULT_LOC.name; },
        { timeout: 10000, maximumAge: 30 * 60e3 },
      );
    },
  };

  function icon(d) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
    return s;
  }

  // ================= Nội dung trang chủ =================
  let SONGS = [];
  const Home = {
    render(sky) {
      const now = new Date();
      const h = now.getHours();
      const part = h < 5 ? 'Khuya rồi' : h < 11 ? 'Chào buổi sáng' : h < 13 ? 'Trưa rồi' : h < 18 ? 'Chiều rồi' : h < 22 ? 'Tối rồi' : 'Khuya rồi';
      $('greet').textContent = part + ', ' + NAME;
      const lines = LEDE[sky];
      $('lede').textContent = lines[now.getDate() % lines.length];
      $('today').textContent = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
      const days = Math.floor((now - new Date(ANNIVERSARY)) / 864e5) + 1;
      $('days').hidden = !(days > 0);
      $('days-text').textContent = 'Ngày thứ ' + days + ' bên nhau';
      this.suggest(sky);
    },

    suggest(sky) {
      const song = SONGS.find((s) => s.id === SONG_FOR[sky]) || SONGS[0];
      if (!song) return;
      $('sugg-note').textContent = SONG_NOTE[sky];
      $('sugg-title').textContent = song.title;
      $('sugg-cover').src = song.cover;
      $('sugg-play').dataset.id = song.id;
      Player.sync();
    },

    // Thẻ cốt truyện: chương đang chờ và tiến độ (đọc tiến độ lưu trên máy).
    story() {
      fetch('../story/chapters.json')
        .then((r) => r.json())
        .then((d) => {
          const list = d.chapters || [];
          let saved = store.get('lpn:story') || {};
          if (saved.ver !== 2) saved = {};
          const done = saved.done || {};
          const open = saved.open || {};
          const n = list.filter((c) => done[c.id]).length;
          const nextI = list.findIndex((c) => !done[c.id]);
          $('story-fill').style.width = (list.length ? (n / list.length) * 100 : 0) + '%';
          if (nextI < 0) {
            $('story-eyebrow').textContent = 'Cốt truyện · ' + n + '/' + list.length + ' chương';
            $('story-title').textContent = 'Đã đi hết hành trình';
            return;
          }
          const ch = list[nextI];
          const locked = ch.cost && !open[ch.id];
          $('story-eyebrow').textContent = 'Cốt truyện · Chương ' + (nextI + 1) + '/' + list.length + (locked ? ' · cần ' + ch.cost + ' đốt cây' : '');
          $('story-title').textContent = locked ? 'Một chương bí mật' : ch.title;
        })
        .catch(() => {});
    },

    gameStars() {
      const best = (store.get('sautim:v1') || {}).best || {};
      const per = {};
      for (const [key, v] of Object.entries(best)) {
        const id = key.split(':')[0];
        per[id] = Math.max(per[id] || 0, v.stars || 0);
      }
      const got = Object.values(per).reduce((a, b) => a + b, 0);
      const el = $('game-stars');
      el.replaceChildren();
      if (!got) { el.textContent = 'Chưa chơi lần nào, thử nha'; return; }
      el.appendChild(icon('M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5l-5.3 2.9 1.2-6-4.5-4.1 6-.7z'));
      el.appendChild(document.createTextNode(got + '/' + (SONGS.length || 6) * 3 + ' sao'));
    },
  };

  // ================= Nghe nhạc =================
  const Player = {
    audio: new Audio(),
    id: null,

    toggle(id) {
      const song = SONGS.find((s) => s.id === id);
      if (!song) return;
      if (this.id === id) {
        if (this.audio.paused) this.audio.play().catch(() => {});
        else this.audio.pause();
        return;
      }
      this.id = id;
      this.audio.src = song.src;
      this.audio.play().catch(() => {});
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: 'Dành cho ' + NAME,
          artwork: [{ src: new URL(song.cover, location.href).href, sizes: '160x160', type: 'image/webp' }],
        });
      }
    },

    // Cập nhật nút phát ở gợi ý và trong danh sách.
    sync() {
      const playing = !this.audio.paused;
      const sugg = $('sugg-play');
      sugg.classList.toggle('playing', playing && sugg.dataset.id === this.id);
      for (const li of document.querySelectorAll('.track')) li.classList.toggle('playing', playing && li.dataset.id === this.id);
    },

    progress() {
      const a = this.audio;
      const p = a.duration ? (a.currentTime / a.duration) * 100 : 0;
      const li = document.querySelector('.track[data-id="' + this.id + '"] .t-bar');
      if (li) li.style.width = p.toFixed(1) + '%';
    },
  };
  Player.audio.preload = 'none';
  ['play', 'pause', 'ended'].forEach((ev) => Player.audio.addEventListener(ev, () => Player.sync()));
  Player.audio.addEventListener('timeupdate', () => Player.progress());
  Player.audio.addEventListener('ended', () => {
    const i = SONGS.findIndex((s) => s.id === Player.id);
    if (i >= 0) Player.toggle(SONGS[(i + 1) % SONGS.length].id);
  });

  function renderPlaylist() {
    const list = $('playlist');
    list.replaceChildren();
    for (const s of SONGS) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'track';
      b.dataset.id = s.id;
      const img = document.createElement('img');
      img.src = s.cover;
      img.alt = '';
      img.width = 48;
      img.height = 48;
      const name = document.createElement('span');
      name.className = 't-name';
      name.textContent = s.title;
      const st = document.createElement('span');
      st.className = 't-state';
      const sv = icon('M8 5v14l11-7z');
      sv.firstChild.setAttribute('class', 'ic-play');
      const pause = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pause.setAttribute('d', 'M8 5v14M16 5v14');
      pause.setAttribute('class', 'ic-pause');
      sv.appendChild(pause);
      st.appendChild(sv);
      const bar = document.createElement('span');
      bar.className = 't-bar';
      b.append(img, name, st, bar);
      b.addEventListener('click', () => Player.toggle(s.id));
      li.appendChild(b);
      list.appendChild(li);
    }
    Player.sync();
  }

  // ================= Bảng trượt =================
  const Panels = {
    open: null,
    show(name) {
      if (this.open) this.hide(true);
      const el = $('panel-' + name);
      if (!el) return;
      if (name === 'letter') loadLetter();
      if (name === 'album') renderAlbum();
      if (name === 'music') renderPlaylist();
      if (name === 'diary' && window.Diary) window.Diary.open();
      $('backdrop').hidden = false;
      el.hidden = false;
      document.body.classList.add('locked');
      this.open = el;
      history.pushState({ panel: name }, '');
      el.querySelector('.close').focus({ preventScroll: true });
    },
    hide(fromHistory) {
      if (!this.open) return;
      this.open.hidden = true;
      this.open = null;
      $('backdrop').hidden = true;
      document.body.classList.remove('locked');
      if (!fromHistory && history.state && history.state.panel) history.back();
    },
  };
  window.addEventListener('popstate', () => { if (Viewer.open) Viewer.hide(true); else Panels.hide(true); });

  let letterLoaded = false;
  function loadLetter() {
    if (letterLoaded) return;
    letterLoaded = true;
    const box = $('letter');
    box.textContent = 'Đang mở thư…';
    fetch('../style/letter.txt')
      .then((r) => r.text())
      .then((text) => {
        box.textContent = text.trim();
        const sign = document.createElement('span');
        sign.className = 'sign';
        sign.textContent = 'Anh Quang';
        box.appendChild(sign);
      })
      .catch(() => { box.textContent = 'Chưa mở được thư, em thử lại sau nha.'; letterLoaded = false; });
  }

  // ================= Album =================
  const PHOTOS = Array.from({ length: 18 }, (_, i) => ({
    thumb: '../style/thumbs/anh-' + (i + 1) + '.webp',
    full: '../style/img/Anh (' + (i + 1) + ').jpg',
  }));
  let albumDone = false;
  function renderAlbum() {
    if (albumDone) return;
    albumDone = true;
    const box = $('album');
    PHOTOS.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Xem ảnh ' + (i + 1));
      const img = document.createElement('img');
      img.src = p.thumb;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      b.appendChild(img);
      b.addEventListener('click', () => Viewer.show(i));
      box.appendChild(b);
    });
  }

  const Viewer = {
    open: false,
    i: 0,
    show(i) {
      this.i = i;
      this.open = true;
      $('viewer').hidden = false;
      this.draw();
      history.pushState({ viewer: true }, '');
    },
    hide(fromHistory) {
      this.open = false;
      $('viewer').hidden = true;
      if (!fromHistory && history.state && history.state.viewer) history.back();
    },
    step(d) {
      this.i = (this.i + d + PHOTOS.length) % PHOTOS.length;
      this.draw();
    },
    draw() {
      const img = $('viewer-img');
      img.src = PHOTOS[this.i].thumb;
      const full = new Image();
      const want = this.i;
      full.onload = () => { if (want === this.i) img.src = full.src; };
      full.src = PHOTOS[this.i].full;
      new Image().src = PHOTOS[(this.i + 1) % PHOTOS.length].full;
      $('viewer-count').textContent = this.i + 1 + ' / ' + PHOTOS.length;
    },
  };
  (() => {
    const v = $('viewer');
    v.querySelector('.v-close').addEventListener('click', () => Viewer.hide());
    v.querySelector('.v-prev').addEventListener('click', () => Viewer.step(-1));
    v.querySelector('.v-next').addEventListener('click', () => Viewer.step(1));
    let x0 = null;
    v.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    v.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) Viewer.step(dx < 0 ? 1 : -1);
    });
  })();

  // ================= Màn khoá =================
  // Lưu mã băm của mật khẩu (giống trang cũ: 4680) thay vì ghi thẳng số ra.
  const LOCK_HASH = 'a9ed65df';
  const fnv = (str) => {
    let h = 0x811c9dc5;
    for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16);
  };
  const Lock = {
    pin: '',
    show() {
      this.pin = '';
      this.draw();
      $('lock-msg').textContent = '';
      document.documentElement.classList.add('need-lock');
      try { localStorage.removeItem('lpn:unlock'); } catch (e) { /* bỏ qua */ }
      Player.audio.pause();
    },
    press(k) {
      if (k === 'del') this.pin = this.pin.slice(0, -1);
      else if (this.pin.length < 4) this.pin += k;
      this.draw();
      if (this.pin.length === 4) this.check();
    },
    draw() {
      [...$('lock-dots').children].forEach((d, i) => d.classList.toggle('on', i < this.pin.length));
    },
    check() {
      const dots = $('lock-dots');
      if (fnv('lpn:' + this.pin) === LOCK_HASH) {
        dots.classList.add('ok');
        try { localStorage.setItem('lpn:unlock', LOCK_HASH); } catch (e) { /* bỏ qua */ }
        $('lock-msg').textContent = '';
        setTimeout(() => {
          document.documentElement.classList.remove('need-lock');
          dots.classList.remove('ok');
          this.pin = '';
          this.draw();
        }, 280);
      } else {
        $('lock-msg').textContent = 'Sai rồi, thử lại nha';
        dots.classList.remove('shake');
        void dots.offsetWidth;
        dots.classList.add('shake');
        setTimeout(() => { this.pin = ''; this.draw(); }, 400);
      }
    },
  };
  $('lock-pad').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) Lock.press(b.dataset.k);
  });
  $('btn-lock').addEventListener('click', () => Lock.show());

  // ================= Sự kiện =================
  document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => Panels.show(b.dataset.open)));
  document.querySelectorAll('.panel .close').forEach((b) => b.addEventListener('click', () => Panels.hide()));
  $('backdrop').addEventListener('click', () => Panels.hide());
  $('btn-weather').addEventListener('click', () => Panels.show('weather'));
  $('btn-locate').addEventListener('click', () => Weather.locate());
  $('sugg-play').addEventListener('click', (e) => Player.toggle(e.currentTarget.dataset.id));
  window.addEventListener('keydown', (e) => {
    if (document.documentElement.classList.contains('need-lock')) {
      if (/^[0-9]$/.test(e.key)) Lock.press(e.key);
      else if (e.key === 'Backspace') Lock.press('del');
      return;
    }
    if (Viewer.open) {
      if (e.key === 'Escape') Viewer.hide();
      else if (e.key === 'ArrowRight') Viewer.step(1);
      else if (e.key === 'ArrowLeft') Viewer.step(-1);
    } else if (e.key === 'Escape') Panels.hide();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { Home.gameStars(); Home.story(); Weather.refresh(false); }
  });

  // ================= Khởi động =================
  Weather.current = guessByClock();
  Weather.apply();
  fetch('../game/beatmaps/index.json')
    .then((r) => r.json())
    .then((d) => {
      SONGS = d.songs.map((s) => ({ id: s.id, title: s.title, cover: s.cover, src: s.src }));
      Home.gameStars();
      Home.story();
      Weather.apply();
    })
    .catch((err) => console.warn(err));
  Weather.refresh(false);
  // Đã cho phép vị trí từ trước thì tự dùng, không hỏi lại.
  if (navigator.permissions && navigator.permissions.query && !store.get('lpn:loc')) {
    navigator.permissions.query({ name: 'geolocation' }).then((p) => { if (p.state === 'granted') Weather.locate(); }).catch(() => {});
  }
  setInterval(() => Weather.refresh(false), WEATHER_TTL);
})();
