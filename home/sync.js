// Sao lưu tiến độ lên Firebase để đổi máy hay xoá dữ liệu web cũng không mất:
// ví đốt cây + đồ trong Tiệm Sâu, tiến độ cốt truyện, kỷ lục Sâu Tím, bài hát đã mở.
// Mỗi người một bản: lpn/players/thuy hoặc lpn/players/quang (chọn "máy của ai" ở Tiệm Sâu).
// Tặng đốt: ghi lpn/players/{ai}/grants/{mã} = { dot, note }; máy nhận cộng đúng một lần khi đồng bộ.
// Chưa chọn hoặc Firebase chưa cho phép thì mọi thứ vẫn chạy bình thường trên máy.
'use strict';
(() => {
  const DB = 'https://yeult-diary-default-rtdb.asia-southeast1.firebasedatabase.app/';
  const WHO_KEY = 'lpn:who';
  const META_KEY = 'lpn:sync';
  const GRANT_KEY = 'lpn:grantNotice'; // quà đốt vừa nhận, chờ báo cho người dùng
  // Dữ liệu riêng của người đang dùng máy (xoá khi đổi người; kỷ lục game nằm trong sautim:v1.best).
  const PERSONAL = ['lpn:wallet', 'lpn:story', 'lpn:songs', GRANT_KEY, 'lpn:setGift', 'lpn:trial'];
  const WHO = { thuy: 'Lệ Thủy', quang: 'Anh Quang' };

  const load = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } };
  // Bản xem thử (lpn:preview = '1', chỉ đặt trên server local): không đồng bộ gì, không ghi vào tài khoản thật.
  const PREVIEW = (() => { try { return localStorage.getItem('lpn:preview') === '1'; } catch (e) { return false; } })();
  const getWho = () => { if (PREVIEW) return null; try { const w = localStorage.getItem(WHO_KEY); return WHO[w] ? w : null; } catch (e) { return null; } };
  const url = (who) => DB + 'lpn/players/' + who + '.json';

  // Ảnh chụp những gì cần sao lưu trên máy này.
  function snapshot() {
    const game = load('sautim:v1') || {};
    return {
      wallet: load('lpn:wallet') || null,
      story: load('lpn:story') || null,
      best: game.best || {},
      songs: load('lpn:songs') || {},
    };
  }

  const union = (a, b) => Object.assign({}, b || {}, a || {});
  // Bậc nâng cấp kỹ năng: lấy bậc cao hơn của hai máy.
  const maxMap = (a, b) => {
    const out = Object.assign({}, b || {});
    for (const [k, v] of Object.entries(a || {})) out[k] = Math.max(v || 0, out[k] || 0);
    return out;
  };
  // Tiến độ thử thách đột phá: số lần, combo lấy cao hơn; bài đã đạt thì gộp.
  const questMerge = (a, b) => {
    const out = {};
    for (const k of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
      const x = (a || {})[k] || {}, y = (b || {})[k] || {};
      out[k] = { uses: Math.max(x.uses || 0, y.uses || 0), combo: Math.max(x.combo || 0, y.combo || 0), hard: union(x.hard, y.hard) };
    }
    return out;
  };
  // Lượt dùng kỹ năng độc quyền trong tuần: cùng tuần thì lấy số ván cao hơn, khác tuần thì lấy tuần mới.
  const weekMerge = (a, b) => {
    const x = a || {}, y = b || {};
    if (x.id !== y.id) return (x.id || '') > (y.id || '') ? x : y;
    return { id: x.id, used: maxMap(x.used, y.used) };
  };
  // Gộp hai bản: đồ đã có, chương đã đọc, kỷ lục… thì cộng dồn.
  // Số đốt và điểm: lấy bản trên Firebase cộng phần máy này đã tiêu / kiếm thêm kể từ lần khớp cuối (synced).
  // Không lấy "bản sửa sau cùng": một máy để lâu không mở (hay app ngoài màn hình chính, bộ nhớ riêng với Safari)
  // còn số đốt cũ, chơi một ván là đè mất đốt thật và quà đã nhận (26/10 ví Thủy tụt từ hơn 8.000 xuống 130).
  // Lần đầu nối máy, hay máy chưa có mốc khớp: tin hẳn bản trên Firebase.
  function merge(local, remote, first, synced) {
    const out = {};
    const lw = local.wallet, rw = remote.wallet;
    if (lw && rw) {
      const base = first || (rw.updatedAt || 0) > (lw.updatedAt || 0) ? rw : lw;
      const delta = (k) => (!first && synced ? (lw[k] || 0) - (synced[k] || 0) : 0);
      out.wallet = Object.assign({}, base, {
        dot: Math.max(0, (rw.dot || 0) + delta('dot')),
        points: Math.max(0, (rw.points || 0) + delta('points')),
        owned: union(lw.owned, rw.owned),
        grants: union(lw.grants, rw.grants),
        up: maxMap(lw.up, rw.up),
        quest: questMerge(lw.quest, rw.quest),
        week: weekMerge(lw.week, rw.week),
        gift: !!(lw.gift || rw.gift),
        giftSeen: !!(lw.giftSeen || rw.giftSeen),
        migrated: !!(lw.migrated || rw.migrated),
      });
    } else out.wallet = lw || rw || null;

    const ls = local.story, rs = remote.story;
    if (ls && rs && ls.ver === rs.ver) {
      out.story = {
        ver: ls.ver,
        done: union(ls.done, rs.done),
        open: union(ls.open, rs.open),
        flags: union(ls.flags, rs.flags),
        peek: union(ls.peek, rs.peek),
      };
    } else out.story = (ls && rs ? ((ls.ver || 0) >= (rs.ver || 0) ? ls : rs) : ls || rs) || null;

    out.best = Object.assign({}, remote.best || {});
    for (const [k, v] of Object.entries(local.best || {})) {
      const r = out.best[k];
      out.best[k] = r ? { score: Math.max(v.score || 0, r.score || 0), stars: Math.max(v.stars || 0, r.stars || 0) } : v;
    }
    out.songs = union(local.songs, remote.songs);
    return out;
  }

  // Cộng các món quà đốt chưa nhận vào ví (đánh dấu theo mã để không cộng hai lần).
  function claimGrants(wallet, grants) {
    if (!wallet || !grants || typeof grants !== 'object') return;
    wallet.grants = wallet.grants || {};
    let dot = 0;
    const notes = [];
    for (const [id, g] of Object.entries(grants)) {
      if (wallet.grants[id] || !g) continue;
      const n = Math.max(0, Math.floor(g.dot || 0));
      wallet.dot = (wallet.dot || 0) + n;
      wallet.grants[id] = Date.now();
      dot += n;
      if (g.note) notes.push(g.note);
    }
    if (!dot) return;
    wallet.updatedAt = Date.now();
    const old = load(GRANT_KEY) || { dot: 0, notes: [] };
    save(GRANT_KEY, { dot: old.dot + dot, notes: old.notes.concat(notes) });
  }

  function apply(data) {
    if (data.wallet) save('lpn:wallet', data.wallet);
    if (data.story) save('lpn:story', data.story);
    const game = load('sautim:v1') || {};
    game.best = data.best || {};
    save('sautim:v1', game);
    save('lpn:songs', data.songs || {});
  }

  const stable = (o) => JSON.stringify(o, Object.keys(flatKeys(o)).sort());
  function flatKeys(o, acc) {
    acc = acc || {};
    if (o && typeof o === 'object') for (const k of Object.keys(o)) { acc[k] = 1; flatKeys(o[k], acc); }
    return acc;
  }

  const Sync = {
    WHO,
    who: getWho(),
    preview: PREVIEW,
    status: 'idle', // idle | syncing | ok | denied | offline | nowho
    lastAt: (load(META_KEY) || {}).lastAt || 0,
    timer: 0,
    listeners: [],
    on(fn) { this.listeners.push(fn); },
    emit() { for (const fn of this.listeners) { try { fn(this); } catch (e) { /* bỏ qua */ } } },
    setStatus(s) { this.status = s; this.emit(); },

    setWho(who) {
      if (PREVIEW) return Promise.resolve(false);
      if (!WHO[who]) return;
      try { localStorage.setItem(WHO_KEY, who); } catch (e) { /* bỏ qua */ }
      const meta = load(META_KEY) || {};
      meta.first = true; // máy này chưa từng nối với bản sao lưu của người này
      save(META_KEY, meta);
      this.who = who;
      return this.pull();
    },

    // Đổi người dùng máy này (chọn sau khi mở khoá ở trang chủ). Lưu bản của người cũ lên Firebase,
    // xoá dữ liệu riêng của người đó trên máy, rồi lấy bản của người mới về, không trộn hai người vào nhau.
    // Cần có mạng: tải bản mới hoặc lưu bản cũ không được thì không đổi gì, trả về false.
    async switchTo(who) {
      if (PREVIEW) return false;
      if (!WHO[who] || who === this.who) return true;
      if (!this.who) return this.setWho(who);
      let remote;
      try {
        const res = await fetch(url(who), { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        remote = (await res.json()) || {};
      } catch (e) { return false; }
      clearTimeout(this.timer);
      this.pending = false;
      if (!(await this.merge()).ok) return false;
      for (const k of PERSONAL) { try { localStorage.removeItem(k); } catch (e) { /* bỏ qua */ } }
      const game = load('sautim:v1') || {};
      delete game.best;
      save('sautim:v1', game);
      try { localStorage.setItem(WHO_KEY, who); } catch (e) { /* bỏ qua */ }
      this.who = who;
      const data = merge(snapshot(), remote, true, null);
      claimGrants(data.wallet, remote.grants);
      apply(data);
      save(META_KEY, Object.assign(load(META_KEY) || {}, { first: false }));
      await this.push(data);
      return true;
    },

    // Kéo bản sao lưu về, gộp với máy, rồi đẩy bản gộp lên. Trả về { ok, changed }.
    async merge() {
      if (PREVIEW || !this.who) return { ok: false };
      let remote;
      try {
        const res = await fetch(url(this.who), { cache: 'no-store' });
        if (res.status === 401 || res.status === 403) { this.setStatus('denied'); return { ok: false }; }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        remote = (await res.json()) || {};
      } catch (e) { this.setStatus('offline'); return { ok: false }; }
      const meta = load(META_KEY) || {};
      const local = snapshot();
      const merged = merge(local, remote, !!meta.first || !remote.wallet || !meta.synced, meta.synced);
      claimGrants(merged.wallet, remote.grants);
      const changed = stable(merged) !== stable(local);
      if (changed) apply(merged);
      meta.first = false;
      // Máy giờ đã tính trên nền bản Firebase vừa đọc; đẩy lên lỗi thì phần chênh vẫn còn để lần sau gộp tiếp.
      if (remote.wallet) meta.synced = { dot: remote.wallet.dot || 0, points: remote.wallet.points || 0 };
      save(META_KEY, meta);
      return { ok: await this.push(merged), changed };
    },
    async pull() {
      if (PREVIEW) return false;
      if (!this.who) { this.setStatus('nowho'); return false; }
      this.setStatus('syncing');
      const r = await this.merge();
      if (r.changed) this.changed();
      return r.ok;
    },

    async push(data, keepalive) {
      if (PREVIEW) return false;
      if (!this.who) return false;
      const body = Object.assign({}, data || snapshot(), { who: this.who, savedAt: Date.now() });
      try {
        // PATCH chỉ thay các mục của máy, giữ nguyên quà (grants) đang chờ trên Firebase.
        const res = await fetch(url(this.who), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          keepalive: !!keepalive,
        });
        if (res.status === 401 || res.status === 403) { this.setStatus('denied'); return false; }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        this.lastAt = Date.now();
        const meta = Object.assign(load(META_KEY) || {}, { lastAt: this.lastAt });
        // Mốc khớp: số đốt / điểm Firebase đang giữ đúng bằng của máy này.
        if (body.wallet) meta.synced = { dot: body.wallet.dot || 0, points: body.wallet.points || 0 };
        save(META_KEY, meta);
        this.setStatus('ok');
        return true;
      } catch (e) { if (!keepalive) this.setStatus('offline'); return false; }
    },

    // Có gì thay đổi trên máy thì 1,5 giây sau đẩy lên (gom nhiều thay đổi một lần).
    dirty() {
      if (!this.who || this.status === 'denied') return;
      this.pending = true;
      clearTimeout(this.timer);
      // Đọc lại Firebase rồi mới ghi, để không đè thay đổi từ máy khác.
      this.timer = setTimeout(() => { this.pending = false; this.merge(); }, 1500);
    },
    // Sắp rời trang: không kịp đọc lại Firebase, nên chỉ lưu tạm phần không phải ví; ví gộp ở lần mở sau.
    flush() {
      if (!this.pending || !this.who) return;
      clearTimeout(this.timer);
      this.pending = false;
      const data = snapshot();
      delete data.wallet;
      this.push(data, true);
    },

    // Bản gộp khác máy: trang nào có hàm làm mới thì gọi, không thì tải lại trang một lần.
    changed() {
      if (typeof window.LPN_onSync === 'function') { window.LPN_onSync(); return; }
      const key = 'lpn:syncReload:' + location.pathname;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
      } catch (e) { return; }
      location.reload();
    },
  };

  window.Sync = Sync;
  document.addEventListener('visibilitychange', () => { if (document.hidden) Sync.flush(); });
  window.addEventListener('pagehide', () => Sync.flush());
  if (Sync.who) Sync.pull(); else Sync.status = 'nowho';
})();
