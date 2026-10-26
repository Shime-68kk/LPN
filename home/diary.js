// Nhật ký: một mạng xã hội nhỏ của hai người (đăng bài, thả cảm xúc, bình luận).
// Dùng chung database Firebase (diary/), định dạng dữ liệu và bộ nhớ đệm với trang cũ,
// nên các trang đã viết, cảm xúc và bình luận vẫn còn nguyên.
// Người viết lấy từ tài khoản đang dùng máy (Sync.who, chọn ở màn khoá), không phải chọn tay.
// Bài cũ chưa ghi người viết thì hiện là "Tụi mình"; ai viết thì tự nhận lại ở nút ⋯.
// Bài mới, bình luận mới: báo lên điện thoại người kia qua worker lpn-push (tools/push-worker/).
'use strict';
(() => {
  const FIREBASE_DB_URL = 'https://yeult-diary-default-rtdb.asia-southeast1.firebasedatabase.app/';
  const NOTIFY_URL = 'https://lpn-push.luongquang060804.workers.dev/diary';
  const CACHE_KEY = 'loveDiaryEntries';
  const REACTIONS = ['❤️', '🥰', '🥺', '🫂', '🌸'];
  // legacy: tên người viết bình luận như trang cũ vẫn ghi, để trang cũ đọc được.
  const PEOPLE = {
    quang: { name: 'Anh Quang', initial: 'Q', photo: '../assets/img/avt-quang.webp', full: '../assets/img/avt-quang-full.webp', legacy: '🧸 Anh Quang' },
    thuy: { name: 'Lệ Thủy', initial: 'T', photo: '../assets/img/avt-thuy.webp', full: '../assets/img/avt-thuy-full.webp', legacy: '👑 Lệ Thủy' },
  };
  const SEEN_KEY = 'lpn:seen:diary'; // lần cuối mở nhật ký trên máy này (trang chủ dùng để rung ô Nhật ký)
  const PAGE = 10;
  const LONG = 260; // dài hơn thì thu gọn, có nút "Xem thêm"

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const svg = (d) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
    return s;
  };
  const ICON = {
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
    mine: 'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    comment: 'M12 20a8 8 0 1 0-7.2-4.5L4 20l4.5-.8A8 8 0 0 0 12 20z',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
    smile: 'M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18zM8.5 14.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8M9 9.5h.01M15 9.5h.01',
    send: 'M4 12l16-8-6 16-2-7z',
  };

  const me = () => (window.Sync && window.Sync.who) || null;
  const pad = (n) => String(n).padStart(2, '0');
  const asList = (c) => (Array.isArray(c) ? c : Object.values(c || {})).filter(Boolean);
  const keyOf = (e) => e.id || 'local_' + e.timestamp;
  // Bình luận cũ chỉ có tên kèm biểu tượng ("🧸 Anh Quang" / "👑 Lệ Thủy").
  const commentBy = (c) => c.by || (String(c.author || '').includes('Quang') ? 'quang' : 'thuy');
  const canManage = (entry) => !entry.author || entry.author === me();
  // Nhóm bình luận: bình luận gốc kèm các câu trả lời (re = mã bình luận gốc). Gốc đã xoá thì câu trả lời đứng riêng.
  const threadsOf = (comments) => {
    const ids = new Set(comments.map((c) => c.id));
    return comments
      .filter((c) => !c.re || !ids.has(c.re))
      .map((c) => ({ c, replies: comments.filter((r) => r.re === c.id) }));
  };

  // "Vừa xong", "5 phút", "3 giờ", "Hôm qua lúc 21:30", "12 tháng 10 lúc 21:30", "12/10/2025"
  // short (bình luận): "Hôm qua", "12/10"
  function ago(ts, short) {
    const s = (Date.now() - ts) / 1000;
    const d = new Date(ts);
    const at = ' lúc ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (s < 60) return 'Vừa xong';
    if (s < 3600) return Math.floor(s / 60) + ' phút';
    if (s < 86400) return Math.floor(s / 3600) + ' giờ';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (ts >= today.getTime() - 86400000) return 'Hôm qua' + (short ? '' : at);
    if (d.getFullYear() === today.getFullYear()) return short ? d.getDate() + '/' + (d.getMonth() + 1) : d.getDate() + ' tháng ' + (d.getMonth() + 1) + at;
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  }
  // Avatar mỗi người là nút: chạm để xem ảnh lớn (như Facebook). Bài chung thì là trái tim.
  function avatar(who, small) {
    const cls = 'd-av av-' + (PEOPLE[who] ? who : 'both') + (small ? ' sm' : '');
    const p = PEOPLE[who];
    if (!p) {
      const a = el('span', cls);
      a.setAttribute('aria-hidden', 'true');
      a.appendChild(svg(ICON.heart));
      return a;
    }
    const a = el('button', cls, p.initial);
    a.type = 'button';
    a.setAttribute('aria-label', 'Xem ảnh đại diện của ' + p.name);
    a.addEventListener('click', () => { if (window.Viewer) window.Viewer.show(0, [{ thumb: p.photo, full: p.full }]); });
    // Ảnh đại diện; tải lỗi thì để lại chữ cái đầu.
    const img = el('img');
    img.src = p.photo;
    img.alt = '';
    img.decoding = 'async';
    img.addEventListener('error', () => img.remove());
    a.appendChild(img);
    return a;
  }

  const cache = {
    read() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch (e) { return []; } },
    write(list) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch (e) { /* đầy bộ nhớ: bỏ qua */ } },
  };
  // Cảm xúc trang cũ lưu theo máy; giờ lưu theo người ở entry.by, cái theo máy chỉ còn để đọc bài cũ.
  const myReaction = {
    key: (id, ts) => 'myDiaryReaction_' + (id || 'local_' + ts),
    get(id, ts) { try { return localStorage.getItem(this.key(id, ts)); } catch (e) { return null; } },
    set(id, ts, v) { try { v ? localStorage.setItem(this.key(id, ts), v) : localStorage.removeItem(this.key(id, ts)); } catch (e) { /* bỏ qua */ } },
  };
  const safeImage = (src) => typeof src === 'string' && (src.startsWith('data:image/') || src.startsWith('https://'));

  // ===== Thông báo =====
  // Chỉ báo khi có điều muốn người kia đọc: bài mới và bình luận. Sửa, xoá, thả cảm xúc thì thôi.
  // Worker tự đọc lại bài trên Firebase để soạn nội dung và gửi tới máy người kia.
  function notify(body) {
    fetch(NOTIFY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true })
      .catch(() => {});
  }

  // Mốc "vừa viết gì đó" của mỗi người (lpn/players/{ai}/diaryAt): trang chủ máy người kia đọc để rung ô Nhật ký.
  function stamp(who) {
    fetch(FIREBASE_DB_URL + 'lpn/players/' + who + '/diaryAt.json', { method: 'PUT', body: String(Date.now()) }).catch(() => {});
  }

  // ===== Firebase =====
  async function api(path, method, body) {
    const res = await fetch(FIREBASE_DB_URL + path + '.json', {
      method: method || 'GET',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 || res.status === 403) throw new Error('PERMISSION_DENIED');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  const Diary = {
    entries: [],
    visible: PAGE,
    editing: null,
    image: null,
    threads: new Set(), // bài đang mở hết bình luận
    expanded: new Set(), // bài dài đang mở hết chữ
    pickerFor: null,
    menuFor: null,
    replyTo: null, // { key: bài, root: mã bình luận gốc, name } khi đang trả lời một bình luận
    bound: false,

    since: Date.now(), // bài, bình luận của người kia sau mốc này hiện chữ "Mới"

    open() {
      if (!this.bound) this.bind();
      let seen = null;
      try { seen = Number(localStorage.getItem(SEEN_KEY)) || null; localStorage.setItem(SEEN_KEY, String(Date.now())); } catch (e) { /* bỏ qua */ }
      this.since = seen || Date.now();
      this.entries = cache.read();
      this.composer();
      this.render();
      this.sync();
    },

    status(text, isError) {
      const s = $('diary-status');
      s.textContent = text || '';
      s.classList.toggle('error', !!isError);
      s.hidden = !text;
    },

    async sync() {
      if (!this.entries.length) this.status('Đang tải nhật ký…');
      try {
        const data = await api('diary');
        const list = Object.keys(data || {}).map((id) => Object.assign({ id }, data[id]));
        list.sort((a, b) => b.timestamp - a.timestamp);
        this.entries = list;
        cache.write(list);
        this.status('');
        this.render();
      } catch (err) {
        if (err.message === 'PERMISSION_DENIED') {
          this.status('Máy chủ nhật ký đang khoá quyền truy cập, nên chỉ hiện các trang đã lưu trên máy này. Anh Quang cần mở lại quyền trong Firebase nha.', true);
        } else {
          this.status(this.entries.length ? 'Chưa kết nối được, đang xem bản lưu trên máy.' : 'Chưa kết nối được máy chủ, em thử lại sau nha.', true);
        }
      }
    },

    // ===== Viết / sửa =====
    bind() {
      this.bound = true;
      const text = $('diary-text');
      text.addEventListener('input', () => this.grow());
      $('diary-photo').addEventListener('change', (e) => this.pickPhoto(e.target.files[0]));
      $('diary-photo-remove').addEventListener('click', () => this.setImage(null));
      $('diary-save').addEventListener('click', () => this.save());
      $('diary-cancel').addEventListener('click', () => this.resetForm());
      document.addEventListener('click', (e) => {
        if (this.pickerFor && !e.target.closest('.d-picker, .d-like, .d-pick')) this.closePops();
        else if (this.menuFor && !e.target.closest('.d-menu, .d-more')) this.closePops();
      });
    },

    // Ô viết bài mang avatar người đang dùng máy; chưa chọn tài khoản (hay bản xem thử) thì chỉ đọc.
    composer() {
      const who = me();
      $('diary-compose').hidden = !who;
      $('diary-readonly').hidden = !!who;
      if (who) $('diary-me').replaceWith(Object.assign(avatar(who), { id: 'diary-me' }));
      this.grow();
    },

    grow() {
      const t = $('diary-text');
      t.style.height = 'auto';
      t.style.height = Math.min(t.scrollHeight, 260) + 'px';
      $('diary-save').disabled = !t.value.trim() && !this.image;
    },

    pickPhoto(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 900;
          let w = img.width, h = img.height;
          if (w > max || h > max) {
            if (w > h) { h = Math.round((h * max) / w); w = max; } else { w = Math.round((w * max) / h); h = max; }
          }
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          this.setImage(c.toDataURL('image/jpeg', 0.72));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    },

    setImage(data) {
      this.image = data;
      $('diary-photo').value = '';
      $('diary-preview').hidden = !data;
      $('diary-preview-img').src = data || '';
      this.grow();
    },

    resetForm() {
      $('diary-text').value = '';
      this.setImage(null);
      this.editing = null;
      $('diary-save').textContent = 'Đăng';
      $('diary-cancel').hidden = true;
      $('diary-compose').classList.remove('editing');
    },

    async save() {
      const who = me();
      const text = $('diary-text').value.trim();
      if (!who || (!text && !this.image)) return;
      this.status('');
      if (this.editing) {
        const entry = this.editing;
        const change = { text, image: this.image || null, isEdited: true };
        Object.assign(entry, change);
        if (!entry.image) delete entry.image;
        cache.write(this.entries);
        this.resetForm();
        this.redraw(entry);
        if (!entry.id) return;
        try {
          await api('diary/' + entry.id, 'PATCH', change);
        } catch (err) { this.saveError(err); }
        return;
      }
      const entry = { author: who, text, timestamp: Date.now() };
      if (this.image) entry.image = this.image;
      this.entries.unshift(entry);
      cache.write(this.entries);
      this.visible = PAGE;
      this.resetForm();
      this.render();
      $('diary-list').firstElementChild.classList.add('fresh');
      try {
        const res = await api('diary', 'POST', entry);
        if (res && res.name) {
          entry.id = res.name;
          cache.write(this.entries);
          this.redraw(entry, 'local_' + entry.timestamp);
          notify({ from: who, id: entry.id });
          stamp(who);
        }
      } catch (err) { this.saveError(err); }
    },

    saveError(err) {
      this.status(err.message === 'PERMISSION_DENIED'
        ? 'Đã lưu trên máy này, nhưng chưa gửi lên máy chủ được vì máy chủ đang khoá quyền.'
        : 'Đã lưu trên máy này, sẽ cần gửi lại khi có mạng.', true);
    },

    edit(entry) {
      this.closePops();
      this.editing = entry;
      $('diary-text').value = entry.text || '';
      this.setImage(safeImage(entry.image) ? entry.image : null);
      $('diary-save').textContent = 'Lưu';
      $('diary-cancel').hidden = false;
      $('diary-compose').classList.add('editing');
      $('panel-diary').querySelector('.d-scroll').scrollTo({ top: 0, behavior: 'smooth' });
      $('diary-text').focus({ preventScroll: true });
    },

    async remove(entry) {
      this.closePops();
      if (!confirm('Xoá bài nhật ký này nha?')) return;
      this.entries = this.entries.filter((e) => e !== entry);
      cache.write(this.entries);
      this.render();
      if (!entry.id) return;
      try {
        await api('diary/' + entry.id, 'DELETE');
      } catch (err) { this.saveError(err); }
    },

    // Bài cũ chưa ghi người viết: người viết tự nhận lại.
    async claim(entry) {
      const who = me();
      this.closePops();
      if (!who) return;
      entry.author = who;
      cache.write(this.entries);
      this.redraw(entry);
      if (entry.id) api('diary/' + entry.id + '/author', 'PUT', who).catch((err) => this.saveError(err));
    },

    // ===== Cảm xúc =====
    mine(entry) {
      const who = me();
      if (!who) return null;
      if (entry.by && entry.by[who]) return entry.by[who];
      return myReaction.get(entry.id, entry.timestamp);
    },

    // Chạm lại đúng cảm xúc đang chọn là bỏ; force = chỉ thêm (chạm đúp vào ảnh), không bỏ.
    react(entry, emoji, force) {
      const who = me();
      if (!who) return;
      const prev = this.mine(entry);
      if (force && prev) return;
      const next = prev === emoji ? null : emoji;
      entry.reactions = entry.reactions || {};
      if (prev) entry.reactions[prev] = Math.max(0, (entry.reactions[prev] || 1) - 1);
      if (next) entry.reactions[next] = (entry.reactions[next] || 0) + 1;
      entry.by = Object.assign({}, entry.by);
      if (next) entry.by[who] = next; else delete entry.by[who];
      myReaction.set(entry.id, entry.timestamp, next);
      this.pickerFor = null;
      cache.write(this.entries);
      this.redraw(entry);
      if (!entry.id) return;
      api('diary/' + entry.id + '/reactions', 'PUT', entry.reactions).catch(() => {});
      api('diary/' + entry.id + '/by/' + who, next ? 'PUT' : 'DELETE', next || undefined).catch(() => {});
    },

    // "❤️🥰  Anh Quang và Lệ Thủy"; cảm xúc cũ không biết của ai thì chỉ đếm số.
    summary(entry) {
      const r = entry.reactions || {};
      const by = entry.by || {};
      const people = Object.keys(by).filter((w) => PEOPLE[w]);
      const total = Math.max(Object.values(r).reduce((n, v) => n + (v > 0 ? v : 0), 0), people.length);
      if (!total) return null;
      const emojis = [...new Set(people.map((w) => by[w]).concat(Object.keys(r).filter((k) => r[k] > 0)))].slice(0, 3);
      const row = el('div', 'd-summary');
      const icons = el('span', 'd-emojis');
      for (const e of emojis) icons.appendChild(el('i', '', e));
      const names = people.map((w) => PEOPLE[w].name).join(' và ');
      const rest = total - people.length;
      row.append(icons, el('span', '', names ? names + (rest > 0 ? ' và ' + rest + ' lượt khác' : '') : String(total)));
      return row;
    },

    // ===== Bình luận =====
    async comment(entry, text) {
      const who = me();
      if (!who) return;
      const c = { id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), by: who, author: PEOPLE[who].legacy, text, timestamp: Date.now() };
      const rt = this.replyTo;
      if (rt && rt.key === keyOf(entry)) { c.re = rt.root; this.replyTo = null; }
      entry.comments = asList(entry.comments).concat(c);
      cache.write(this.entries);
      this.redraw(entry, null, true);
      if (!entry.id) return;
      try {
        // Đọc lại trước khi ghi, để không đè bình luận người kia vừa gửi.
        const list = asList(await api('diary/' + entry.id + '/comments')).filter((x) => x.id !== c.id).concat(c);
        await api('diary/' + entry.id + '/comments', 'PUT', list);
        entry.comments = list;
        cache.write(this.entries);
        this.redraw(entry);
        notify({ from: who, id: entry.id, cid: c.id });
        stamp(who);
      } catch (err) { this.saveError(err); }
    },

    async uncomment(entry, cid) {
      if (!confirm('Xoá bình luận này nha?')) return;
      entry.comments = asList(entry.comments).filter((c) => c.id !== cid);
      cache.write(this.entries);
      this.redraw(entry);
      if (!entry.id) return;
      try {
        const list = asList(await api('diary/' + entry.id + '/comments')).filter((c) => c.id !== cid);
        await api('diary/' + entry.id + '/comments', 'PUT', list);
        entry.comments = list;
        cache.write(this.entries);
      } catch (err) { this.saveError(err); }
    },

    // ===== Vẽ =====
    render() {
      const list = $('diary-list');
      list.replaceChildren();
      if (!this.entries.length) {
        list.appendChild(el('p', 'd-empty', 'Chưa có bài nào. Viết dòng đầu tiên để giữ lại kỷ niệm nha.'));
        return;
      }
      for (const entry of this.entries.slice(0, this.visible)) list.appendChild(this.card(entry));
      if (this.entries.length > this.visible) {
        const more = el('button', 'btn d-older', 'Xem các bài cũ hơn');
        more.type = 'button';
        more.addEventListener('click', () => { this.visible += PAGE; this.render(); });
        list.appendChild(more);
      }
    },

    // Vẽ lại một bài, giữ chữ đang gõ dở ở ô bình luận.
    redraw(entry, oldKey, focusReply) {
      const node = $('diary-list').querySelector('[data-key="' + (oldKey || keyOf(entry)) + '"]');
      if (!node) return;
      const input = node.querySelector('.d-reply input');
      const typing = input && input.value;
      const focused = focusReply || (input && document.activeElement === input);
      const fresh = this.card(entry);
      node.replaceWith(fresh);
      const next = fresh.querySelector('.d-reply input');
      if (next && typing && !focusReply) next.value = typing;
      if (next && focused) next.focus({ preventScroll: true });
    },

    // Bảng cảm xúc chỉ ẩn / hiện (không vẽ lại bài, để cú giữ lâu trên nút tim không bị tính thành chạm).
    // Menu ⋯ thì vẽ lại bài.
    showPicker(key, on) {
      const node = $('diary-list').querySelector('[data-key="' + key + '"]');
      if (!node) return;
      node.querySelector('.d-picker').hidden = !on;
      node.querySelector('.d-pick').setAttribute('aria-expanded', String(on));
    },
    closePops() {
      if (this.pickerFor) { this.showPicker(this.pickerFor, false); this.pickerFor = null; }
      if (!this.menuFor) return;
      const e = this.entries.find((x) => keyOf(x) === this.menuFor);
      this.menuFor = null;
      if (e) this.redraw(e);
    },
    togglePop(kind, entry) {
      const key = keyOf(entry);
      const open = this[kind] === key;
      this.closePops();
      if (open) return;
      this[kind] = key;
      if (kind === 'pickerFor') this.showPicker(key, true); else this.redraw(entry);
    },

    card(entry) {
      const key = keyOf(entry);
      const who = me();
      const card = el('article', 'd-card');
      card.dataset.key = key;

      // Đầu bài: avatar, tên, thời gian, nút ⋯
      const head = el('header', 'd-head');
      const meta = el('div', 'd-meta');
      const when = el('time', 'd-time', ago(entry.timestamp) + (entry.isEdited ? ' · đã sửa' : ''));
      when.dateTime = new Date(entry.timestamp).toISOString();
      when.title = new Date(entry.timestamp).toLocaleString('vi-VN');
      const name = el('b', 'd-name', PEOPLE[entry.author] ? PEOPLE[entry.author].name : 'Tụi mình');
      if (this.isNew(entry.author, entry.timestamp)) name.appendChild(el('span', 'd-new', 'Mới'));
      meta.append(name, when);
      head.append(avatar(entry.author), meta);
      if (who && canManage(entry)) {
        const more = this.iconBtn(ICON.more, 'Tuỳ chọn', () => this.togglePop('menuFor', entry), 'd-more');
        more.setAttribute('aria-expanded', String(this.menuFor === key));
        head.appendChild(more);
        if (this.menuFor === key) {
          const menu = el('div', 'd-menu');
          menu.setAttribute('role', 'menu');
          const item = (icon, label, fn, cls) => {
            const b = el('button', cls || '');
            b.type = 'button';
            b.setAttribute('role', 'menuitem');
            b.append(svg(icon), document.createTextNode(label));
            b.addEventListener('click', fn);
            menu.appendChild(b);
          };
          if (!entry.author) item(ICON.mine, 'Bài này của mình', () => this.claim(entry));
          item(ICON.edit, 'Sửa bài', () => this.edit(entry));
          item(ICON.trash, 'Xoá bài', () => this.remove(entry), 'danger');
          head.appendChild(menu);
        }
      }
      card.appendChild(head);

      // Chữ (dài thì thu gọn)
      if (entry.text) {
        const long = entry.text.length > LONG && !this.expanded.has(key);
        const p = el('p', 'd-text' + (long ? ' clamp' : ''), entry.text);
        card.appendChild(p);
        if (long) {
          const more = el('button', 'd-seemore', 'Xem thêm');
          more.type = 'button';
          more.addEventListener('click', () => { this.expanded.add(key); this.redraw(entry); });
          card.appendChild(more);
        }
      }

      // Ảnh: chạm để xem lớn, chạm đúp để thả tim
      if (safeImage(entry.image)) {
        const fig = el('figure', 'd-media');
        const img = el('img');
        img.src = entry.image;
        img.alt = 'Ảnh trong nhật ký';
        img.loading = 'lazy';
        img.decoding = 'async';
        const burst = el('span', 'd-burst');
        burst.appendChild(svg(ICON.heart));
        fig.append(img, burst);
        let timer = null;
        fig.addEventListener('click', () => {
          if (timer) {
            clearTimeout(timer);
            timer = null;
            if (!who) return;
            this.react(entry, '❤️', true);
            const b = $('diary-list').querySelector('[data-key="' + key + '"] .d-burst');
            if (b) { b.classList.remove('go'); void b.offsetWidth; b.classList.add('go'); }
            return;
          }
          timer = setTimeout(() => {
            timer = null;
            if (window.Viewer) window.Viewer.show(0, [{ thumb: entry.image, full: entry.image }]);
          }, 260);
        });
        card.appendChild(fig);
      }

      // Hàng nút: tim (giữ lâu để chọn cảm xúc khác), bình luận, mặt cười
      const comments = asList(entry.comments);
      const mine = this.mine(entry);
      const acts = el('div', 'd-acts');
      const like = el('button', 'd-act d-like' + (mine ? ' on' : ''));
      like.type = 'button';
      like.disabled = !who;
      like.setAttribute('aria-pressed', String(!!mine));
      like.setAttribute('aria-label', mine ? 'Bỏ ' + mine : 'Thả tim (giữ lâu để chọn cảm xúc khác)');
      if (mine && mine !== '❤️') like.appendChild(el('span', 'd-mine', mine)); else like.appendChild(svg(ICON.heart));
      let hold = null, held = false;
      like.addEventListener('pointerdown', () => {
        held = false;
        hold = setTimeout(() => { held = true; this.togglePop('pickerFor', entry); }, 420);
      });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) like.addEventListener(ev, () => clearTimeout(hold));
      like.addEventListener('contextmenu', (e) => e.preventDefault());
      like.addEventListener('click', () => { if (!held) this.react(entry, mine || '❤️'); });
      const cm = el('button', 'd-act');
      cm.type = 'button';
      cm.setAttribute('aria-label', 'Bình luận');
      cm.appendChild(svg(ICON.comment));
      if (comments.length) cm.appendChild(el('b', '', String(comments.length)));
      cm.addEventListener('click', () => {
        const input = $('diary-list').querySelector('[data-key="' + key + '"] .d-reply input');
        if (input) input.focus();
      });
      const pick = el('button', 'd-act d-pick');
      pick.type = 'button';
      pick.disabled = !who;
      pick.setAttribute('aria-label', 'Chọn cảm xúc');
      pick.setAttribute('aria-expanded', String(this.pickerFor === key));
      pick.appendChild(svg(ICON.smile));
      pick.addEventListener('click', () => this.togglePop('pickerFor', entry));
      const picker = el('div', 'd-picker');
      picker.hidden = this.pickerFor !== key;
      for (const emoji of REACTIONS) {
        const p = el('button', mine === emoji ? 'on' : '', emoji);
        p.type = 'button';
        p.setAttribute('aria-label', 'Thả ' + emoji);
        p.addEventListener('click', () => this.react(entry, emoji));
        picker.appendChild(p);
      }
      acts.append(like, cm, pick, picker);
      card.appendChild(acts);
      const sum = this.summary(entry);
      if (sum) card.appendChild(sum);

      // Bình luận: hiện 2 nhóm mới nhất (bình luận gốc kèm các câu trả lời), còn lại bấm "Xem cả"
      if (comments.length) {
        const thread = el('div', 'd-thread');
        const groups = threadsOf(comments);
        const all = this.threads.has(key) || groups.length <= 2;
        if (!all) {
          const b = el('button', 'd-viewall', 'Xem cả ' + comments.length + ' bình luận');
          b.type = 'button';
          b.addEventListener('click', () => { this.threads.add(key); this.redraw(entry); });
          thread.appendChild(b);
        }
        for (const g of all ? groups : groups.slice(-2)) {
          thread.appendChild(this.commentRow(entry, g.c, g.c.id));
          if (!g.replies.length) continue;
          const box = el('div', 'd-replies');
          for (const r of g.replies) box.appendChild(this.commentRow(entry, r, g.c.id));
          thread.appendChild(box);
        }
        card.appendChild(thread);
      }
      if (who) card.appendChild(this.replyForm(entry, who));
      return card;
    },

    isNew(by, ts) { return !!me() && !!PEOPLE[by] && by !== me() && ts > this.since; },

    // root: mã bình luận gốc của nhóm; trả lời một câu trả lời thì vẫn xếp vào nhóm đó.
    commentRow(entry, c, root) {
      const by = commentBy(c);
      const row = el('div', 'd-c');
      const body = el('div', 'd-c-body');
      const bubble = el('div', 'd-bubble');
      bubble.append(el('b', '', PEOPLE[by].name), el('p', '', c.text || ''));
      const meta = el('div', 'd-c-meta');
      meta.appendChild(el('span', '', ago(c.timestamp || entry.timestamp, true)));
      if (this.isNew(by, c.timestamp)) meta.appendChild(el('span', 'd-new', 'Mới'));
      if (me()) {
        const re = el('button', '', 'Trả lời');
        re.type = 'button';
        re.addEventListener('click', () => this.startReply(entry, root, PEOPLE[by].name));
        meta.appendChild(re);
      }
      if (by === me()) {
        const del = el('button', '', 'Xoá');
        del.type = 'button';
        del.addEventListener('click', () => this.uncomment(entry, c.id));
        meta.appendChild(del);
      }
      body.append(bubble, meta);
      row.append(avatar(by, true), body);
      return row;
    },

    startReply(entry, root, name) {
      this.replyTo = { key: keyOf(entry), root, name };
      this.redraw(entry);
      const input = $('diary-list').querySelector('[data-key="' + keyOf(entry) + '"] .d-reply input');
      if (input) input.focus();
    },

    replyForm(entry, who) {
      const form = el('form', 'd-reply');
      const rt = this.replyTo && this.replyTo.key === keyOf(entry) ? this.replyTo : null;
      if (rt) {
        const chip = el('div', 'd-replying');
        chip.append(document.createTextNode('Đang trả lời '), el('b', '', rt.name), document.createTextNode(' · '));
        const cancel = el('button', '', 'Huỷ');
        cancel.type = 'button';
        cancel.addEventListener('click', () => { this.replyTo = null; this.redraw(entry); });
        chip.appendChild(cancel);
        form.appendChild(chip);
      }
      const input = el('input');
      input.type = 'text';
      input.maxLength = 300;
      input.enterKeyHint = 'send';
      input.placeholder = rt ? 'Trả lời ' + rt.name + '…' : 'Viết bình luận…';
      input.setAttribute('aria-label', rt ? 'Trả lời ' + rt.name : 'Viết bình luận');
      const send = el('button', 'd-send');
      send.type = 'submit';
      send.setAttribute('aria-label', 'Gửi bình luận');
      send.appendChild(svg(ICON.send));
      send.disabled = true;
      input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
      form.append(avatar(who, true), input, send);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) this.comment(entry, text);
      });
      return form;
    },

    iconBtn(d, label, fn, extra) {
      const b = el('button', 'd-icon' + (extra ? ' ' + extra : ''));
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.appendChild(svg(d));
      b.addEventListener('click', fn);
      return b;
    },
  };

  window.Diary = Diary;
})();
