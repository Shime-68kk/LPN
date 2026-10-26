// Nhật ký: dùng chung database Firebase, định dạng dữ liệu và bộ nhớ đệm với trang cũ,
// nên các trang đã viết, cảm xúc và bình luận vẫn còn nguyên.
'use strict';
(() => {
  const FIREBASE_DB_URL = 'https://yeult-diary-default-rtdb.asia-southeast1.firebasedatabase.app/';
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1534358624040910971/Cbckwdq-vB9yQmYaqNcHHFAbEVKfOdxe4G4NpF6q3kJDLmAopR92o-QP66dddtZe-Gg8';
  const EMAILJS = { service: 'service_wfekquk', template: 'template_fz6sdr8', key: 'eiEumZGjJAjTNCJw2', to: 'lethuynong2@gmail.com' };
  const CACHE_KEY = 'loveDiaryEntries';
  const REACTIONS = ['❤️', '🥰', '🥺', '🫂', '🌸'];
  const AUTHORS = [{ value: '👑 Lệ Thủy', label: 'Thủy' }, { value: '🧸 Anh Quang', label: 'Anh' }];
  const PAGE = 10;

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
    edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
    comment: 'M4 5h16v11H9l-5 4z',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
    close: 'M6 6l12 12M18 6L6 18',
    send: 'M4 12l16-8-6 16-2-7z',
  };

  const cache = {
    read() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch (e) { return []; } },
    write(list) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch (e) { /* đầy bộ nhớ: bỏ qua */ } },
  };
  const myReaction = {
    key: (id, ts) => 'myDiaryReaction_' + (id || 'local_' + ts),
    get(id, ts) { try { return localStorage.getItem(this.key(id, ts)); } catch (e) { return null; } },
    set(id, ts, v) { try { v ? localStorage.setItem(this.key(id, ts), v) : localStorage.removeItem(this.key(id, ts)); } catch (e) { /* bỏ qua */ } },
  };
  const safeImage = (src) => typeof src === 'string' && (src.startsWith('data:image/') || src.startsWith('https://'));

  // ===== Thông báo =====
  // Chỉ báo khi có điều muốn người kia đọc: trang nhật ký mới và bình luận. Sửa, xoá, thả cảm xúc thì thôi
  // (anh Quang thấy báo nhiều quá, như bị theo dõi).
  function discord(content) {
    fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) })
      .catch(() => {});
  }
  function emailThuy(title, message) {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0') +
      ' ngày ' + now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();
    const params = {
      to_email: EMAILJS.to, recipient: EMAILJS.to, email: EMAILJS.to,
      title, message, author: 'Anh Quang 👦', name: 'Anh Quang 👦', time,
      web_link: 'https://lpn.luongquang060804.workers.dev/',
    };
    fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: EMAILJS.service, template_id: EMAILJS.template, user_id: EMAILJS.key, template_params: params }),
    }).catch(() => {});
  }
  const snippet = (e) => (e.text ? (e.text.length > 35 ? e.text.slice(0, 35) + '...' : e.text) : e.image ? '[Hình ảnh kỉ niệm]' : 'trang nhật ký');

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
    openComments: new Set(),
    pickerFor: null,
    bound: false,

    open() {
      if (!this.bound) this.bind();
      this.entries = cache.read();
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
      $('diary-photo').addEventListener('change', (e) => this.pickPhoto(e.target.files[0]));
      $('diary-photo-remove').addEventListener('click', () => this.setImage(null));
      $('diary-save').addEventListener('click', () => this.save());
      $('diary-cancel').addEventListener('click', () => this.resetForm());
      document.addEventListener('click', (e) => {
        if (this.pickerFor && !e.target.closest('.d-react')) { this.pickerFor = null; this.render(); }
      });
    },

    pickPhoto(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 600;
          let w = img.width, h = img.height;
          if (w > max || h > max) {
            if (w > h) { h = Math.round((h * max) / w); w = max; } else { w = Math.round((w * max) / h); h = max; }
          }
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          this.setImage(c.toDataURL('image/jpeg', 0.7));
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
    },

    resetForm() {
      $('diary-text').value = '';
      this.setImage(null);
      this.editing = null;
      $('diary-save').textContent = 'Ghi sổ';
      $('diary-cancel').hidden = true;
    },

    async save() {
      const text = $('diary-text').value.trim();
      if (!text && !this.image) { $('diary-text').focus(); this.status('Em viết gì đó hoặc thêm ảnh nha.', true); return; }
      this.status('');
      if (this.editing) {
        const { id, timestamp } = this.editing;
        const old = this.entries.find((e) => (id ? e.id === id : e.timestamp === timestamp)) || {};
        const entry = { text, image: this.image, timestamp, isEdited: true };
        if (old.reactions) entry.reactions = old.reactions;
        if (old.comments) entry.comments = old.comments;
        Object.assign(old, entry);
        cache.write(this.entries);
        this.resetForm();
        this.render();
        if (!id) return;
        try {
          await api('diary/' + id, 'PUT', entry);
        } catch (err) { this.saveError(err); }
        return;
      }
      const entry = { text, image: this.image, timestamp: Date.now() };
      this.entries.unshift(entry);
      cache.write(this.entries);
      this.visible = PAGE;
      this.resetForm();
      this.render();
      try {
        const res = await api('diary', 'POST', entry);
        if (res && res.name) { entry.id = res.name; cache.write(this.entries); this.render(); }
        discord('✍️ **Nhật ký tình yêu vừa có trang mới!** 💕\n' + (text ? '📝 *"' + text + '"*\n' : '') + (entry.image ? '📸 *Có đính kèm hình ảnh kỉ niệm.*' : ''));
        emailThuy('Nhật ký tình yêu vừa có trang mới!', text || '(Có đính kèm hình ảnh kỉ niệm)');
      } catch (err) { this.saveError(err); }
    },

    saveError(err) {
      this.status(err.message === 'PERMISSION_DENIED'
        ? 'Đã lưu trên máy này, nhưng chưa gửi lên máy chủ được vì máy chủ đang khoá quyền.'
        : 'Đã lưu trên máy này, sẽ cần gửi lại khi có mạng.', true);
    },

    edit(entry) {
      this.editing = { id: entry.id, timestamp: entry.timestamp };
      $('diary-text').value = entry.text || '';
      this.setImage(safeImage(entry.image) ? entry.image : null);
      $('diary-save').textContent = 'Cập nhật';
      $('diary-cancel').hidden = false;
      $('panel-diary').querySelector('.d-scroll').scrollTo({ top: 0, behavior: 'smooth' });
      $('diary-text').focus({ preventScroll: true });
    },

    async remove(entry) {
      if (!confirm('Em có chắc muốn xoá trang nhật ký này không?')) return;
      this.entries = this.entries.filter((e) => e !== entry);
      cache.write(this.entries);
      this.render();
      if (!entry.id) return;
      try {
        await api('diary/' + entry.id, 'DELETE');
      } catch (err) { this.saveError(err); }
    },

    // ===== Cảm xúc & bình luận =====
    async react(entry, emoji) {
      entry.reactions = entry.reactions || {};
      const prev = myReaction.get(entry.id, entry.timestamp);
      if (prev === emoji) {
        entry.reactions[emoji] = Math.max(0, (entry.reactions[emoji] || 1) - 1);
        myReaction.set(entry.id, entry.timestamp, null);
      } else {
        if (prev && entry.reactions[prev]) entry.reactions[prev] = Math.max(0, entry.reactions[prev] - 1);
        entry.reactions[emoji] = (entry.reactions[emoji] || 0) + 1;
        myReaction.set(entry.id, entry.timestamp, emoji);
      }
      this.pickerFor = null;
      cache.write(this.entries);
      this.render();
      if (entry.id) api('diary/' + entry.id + '/reactions', 'PUT', entry.reactions).catch(() => {});
    },

    async comment(entry, author, text) {
      entry.comments = entry.comments || [];
      const c = { id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), author, text, timestamp: Date.now() };
      entry.comments.push(c);
      cache.write(this.entries);
      this.render();
      const snip = snippet(entry);
      discord('💬 **' + author + ' vừa bình luận về note "' + snip + '":**\n"' + text + '" 💕');
      if (author.includes('Quang')) emailThuy('Anh Quang vừa bình luận về note "' + snip + '"', '💬 Lời bình luận: "' + text + '"\n📝 Về dòng nhật ký: "' + snip + '"');
      if (entry.id) api('diary/' + entry.id + '/comments', 'PUT', entry.comments).catch(() => {});
    },

    uncomment(entry, cid) {
      if (!confirm('Em có muốn xoá bình luận này không?')) return;
      entry.comments = (entry.comments || []).filter((c) => c.id !== cid);
      cache.write(this.entries);
      this.render();
      if (entry.id) api('diary/' + entry.id + '/comments', 'PUT', entry.comments).catch(() => {});
    },

    // ===== Vẽ danh sách =====
    render() {
      const list = $('diary-list');
      list.replaceChildren();
      if (!this.entries.length) {
        list.appendChild(el('p', 'd-empty', 'Chưa có trang nào. Viết dòng đầu tiên để giữ lại kỷ niệm nha.'));
        return;
      }
      for (const entry of this.entries.slice(0, this.visible)) list.appendChild(this.card(entry));
      if (this.entries.length > this.visible) {
        const more = el('button', 'btn d-more', 'Xem các trang cũ hơn');
        more.type = 'button';
        more.addEventListener('click', () => { this.visible += PAGE; this.render(); });
        list.appendChild(more);
      }
    },

    card(entry) {
      const key = entry.id || 'local_' + entry.timestamp;
      const card = el('article', 'd-card');
      const d = new Date(entry.timestamp);
      const head = el('header', 'd-head');
      const when = el('time', 'd-date',
        d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' · ' +
        d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + (entry.isEdited ? ' · đã sửa' : ''));
      when.dateTime = d.toISOString();
      const actions = el('span', 'd-actions');
      actions.append(
        this.iconBtn(ICON.edit, 'Sửa trang này', () => this.edit(entry)),
        this.iconBtn(ICON.trash, 'Xoá trang này', () => this.remove(entry)),
      );
      head.append(when, actions);
      card.appendChild(head);
      if (entry.text) card.appendChild(el('p', 'd-text', entry.text));
      if (safeImage(entry.image)) {
        const img = el('img', 'd-img');
        img.src = entry.image;
        img.alt = 'Ảnh trong nhật ký';
        img.loading = 'lazy';
        img.decoding = 'async';
        card.appendChild(img);
      }

      // Cảm xúc
      const bar = el('div', 'd-bar');
      const mine = myReaction.get(entry.id, entry.timestamp);
      for (const [emoji, count] of Object.entries(entry.reactions || {})) {
        if (!(count > 0)) continue;
        const b = el('button', 'd-badge' + (mine === emoji ? ' mine' : ''));
        b.type = 'button';
        b.setAttribute('aria-label', emoji + ' ' + count + (mine === emoji ? ', bấm để bỏ' : ''));
        b.append(el('span', '', emoji), el('b', '', String(count)));
        b.addEventListener('click', () => this.react(entry, emoji));
        bar.appendChild(b);
      }
      const reactWrap = el('span', 'd-react');
      const reactBtn = el('button', 'd-chip');
      reactBtn.type = 'button';
      reactBtn.setAttribute('aria-expanded', String(this.pickerFor === key));
      reactBtn.append(svg(ICON.heart), document.createTextNode('Thả tim'));
      reactBtn.addEventListener('click', () => { this.pickerFor = this.pickerFor === key ? null : key; this.render(); });
      reactWrap.appendChild(reactBtn);
      if (this.pickerFor === key) {
        const picker = el('span', 'd-picker');
        for (const emoji of REACTIONS) {
          const p = el('button', '', emoji);
          p.type = 'button';
          p.setAttribute('aria-label', 'Thả ' + emoji);
          p.addEventListener('click', () => this.react(entry, emoji));
          picker.appendChild(p);
        }
        reactWrap.appendChild(picker);
      }
      const comments = entry.comments || [];
      const open = this.openComments.has(key);
      const cBtn = el('button', 'd-chip');
      cBtn.type = 'button';
      cBtn.setAttribute('aria-expanded', String(open));
      cBtn.append(svg(ICON.comment), document.createTextNode(comments.length ? comments.length + ' bình luận' : 'Bình luận'));
      cBtn.addEventListener('click', () => { open ? this.openComments.delete(key) : this.openComments.add(key); this.render(); });
      bar.append(reactWrap, cBtn);
      card.appendChild(bar);

      if (open) card.appendChild(this.commentBox(entry, comments));
      return card;
    },

    commentBox(entry, comments) {
      const box = el('div', 'd-comments');
      if (!comments.length) box.appendChild(el('p', 'd-empty small', 'Chưa có bình luận nào.'));
      for (const c of comments) {
        const row = el('div', 'd-comment');
        const top = el('div', 'd-comment-top');
        const t = new Date(c.timestamp || Date.now());
        top.append(
          el('b', '', String(c.author || '👑 Lệ Thủy').replace(/^\S+\s/, '')),
          el('span', 'd-comment-time', t.getHours().toString().padStart(2, '0') + ':' + t.getMinutes().toString().padStart(2, '0') + ' ' + t.getDate() + '/' + (t.getMonth() + 1)),
          this.iconBtn(ICON.close, 'Xoá bình luận', () => this.uncomment(entry, c.id), 'small'),
        );
        row.append(top, el('p', '', c.text || ''));
        box.appendChild(row);
      }
      const form = el('form', 'd-form');
      const who = el('span', 'd-who');
      who.setAttribute('role', 'radiogroup');
      who.setAttribute('aria-label', 'Người viết');
      let author = AUTHORS[0].value;
      const whoBtns = AUTHORS.map((a, i) => {
        const b = el('button', '', a.label);
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(i === 0));
        b.addEventListener('click', () => {
          author = a.value;
          whoBtns.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        });
        return b;
      });
      who.append(...whoBtns);
      const input = el('input');
      input.type = 'text';
      input.maxLength = 200;
      input.required = true;
      input.placeholder = 'Viết phản hồi…';
      input.setAttribute('aria-label', 'Bình luận');
      const send = el('button', 'd-send');
      send.type = 'submit';
      send.setAttribute('aria-label', 'Gửi bình luận');
      send.appendChild(svg(ICON.send));
      form.append(who, input, send);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) this.comment(entry, author, text);
      });
      box.appendChild(form);
      return box;
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
