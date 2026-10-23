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
  const WHO = { thuy: 'Lệ Thủy', quang: 'Anh Quang' };

  const load = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } };
  const getWho = () => { try { const w = localStorage.getItem(WHO_KEY); return WHO[w] ? w : null; } catch (e) { return null; } };
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
  // Gộp hai bản: đồ đã có, chương đã đọc, kỷ lục… thì cộng dồn; số đốt thì lấy bản sửa sau cùng.
  function merge(local, remote, first) {
    const out = {};
    const lw = local.wallet, rw = remote.wallet;
    if (lw && rw) {
      // Lần đầu nối máy này với bản sao lưu: tin bản sao lưu (máy mới chỉ có quà tặng).
      const base = first || (rw.updatedAt || 0) > (lw.updatedAt || 0) ? rw : lw;
      out.wallet = Object.assign({}, base, {
        owned: union(lw.owned, rw.owned),
        grants: union(lw.grants, rw.grants),
        up: maxMap(lw.up, rw.up),
        quest: questMerge(lw.quest, rw.quest),
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
    status: 'idle', // idle | syncing | ok | denied | offline | nowho
    lastAt: (load(META_KEY) || {}).lastAt || 0,
    timer: 0,
    listeners: [],
    on(fn) { this.listeners.push(fn); },
    emit() { for (const fn of this.listeners) { try { fn(this); } catch (e) { /* bỏ qua */ } } },
    setStatus(s) { this.status = s; this.emit(); },

    setWho(who) {
      if (!WHO[who]) return;
      try { localStorage.setItem(WHO_KEY, who); } catch (e) { /* bỏ qua */ }
      const meta = load(META_KEY) || {};
      meta.first = true; // máy này chưa từng nối với bản sao lưu của người này
      save(META_KEY, meta);
      this.who = who;
      return this.pull();
    },

    // Kéo bản sao lưu về, gộp với máy, rồi đẩy bản gộp lên.
    async pull() {
      if (!this.who) { this.setStatus('nowho'); return false; }
      this.setStatus('syncing');
      let remote;
      try {
        const res = await fetch(url(this.who), { cache: 'no-store' });
        if (res.status === 401 || res.status === 403) { this.setStatus('denied'); return false; }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        remote = (await res.json()) || {};
      } catch (e) { this.setStatus('offline'); return false; }
      const meta = load(META_KEY) || {};
      const local = snapshot();
      const merged = merge(local, remote, !!meta.first && !!remote.wallet);
      claimGrants(merged.wallet, remote.grants);
      const changed = stable(merged) !== stable(local);
      if (changed) apply(merged);
      meta.first = false;
      save(META_KEY, meta);
      const ok = await this.push(merged);
      if (changed) this.changed();
      return ok;
    },

    async push(data, keepalive) {
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
        save(META_KEY, Object.assign(load(META_KEY) || {}, { lastAt: this.lastAt }));
        this.setStatus('ok');
        return true;
      } catch (e) { if (!keepalive) this.setStatus('offline'); return false; }
    },

    // Có gì thay đổi trên máy thì 1,5 giây sau đẩy lên (gom nhiều thay đổi một lần).
    dirty() {
      if (!this.who || this.status === 'denied') return;
      this.pending = true;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.pending = false; this.push(); }, 1500);
    },
    flush() {
      if (!this.pending || !this.who) return;
      clearTimeout(this.timer);
      this.pending = false;
      this.push(null, true);
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
