// Ví chung cho game, cốt truyện và Tiệm Sâu: đốt cây, điểm lẻ, đồ đã có và đồ đang mặc.
// Lưu trên máy (localStorage); sync.js sao lưu lên Firebase nếu đã chọn "máy của ai".
'use strict';
(() => {
  const KEY = 'lpn:wallet';
  // 100.000 điểm = 30 đốt cây; đổi theo từng gói 10.000 điểm = 3 đốt, phần lẻ để dành ván sau.
  const PACK_POINTS = 10000;
  const PACK_DOT = 3;
  // Quà tặng một lần cho mỗi máy mở link.
  const GIFT_DOT = 1200;
  const DEFAULT_EQUIP = { skin: 'tim', fx: 'la', wing: 'canh-tim', bg: 'troi' };
  // Bộ đi kèm phần thưởng: có skin là tự có cả bộ (phá án xong có Sâu Thám Tử thì có luôn hiệu ứng, cánh, nền).
  const REWARD_SETS = { 'skin:tham-tu': ['fx:manh-moi', 'wing:canh-tham-tu', 'bg:nen-vach-la'] };
  const SET_NOTICE = 'lpn:setGift';

  const read = () => {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* bỏ qua */ }
    v = v || {};
    return {
      points: Math.max(0, Math.floor(v.points || 0)),
      dot: Math.max(0, Math.floor(v.dot || 0)),
      migrated: !!v.migrated,
      gift: !!v.gift,
      giftSeen: !!v.giftSeen,
      // Đồ đã có: { "skin:sa-pa": thời điểm có }. Đồ mặc định luôn có, không cần ghi.
      owned: v.owned && typeof v.owned === 'object' ? v.owned : {},
      equip: Object.assign({}, DEFAULT_EQUIP, v.equip || {}),
      // Hộp quà: số hộp đã mở và số hộp liên tiếp chưa ra Sử thi / Huyền thoại (để bảo đảm).
      boxes: Math.max(0, Math.floor(v.boxes || 0)),
      pityEpic: Math.max(0, Math.floor(v.pityEpic || 0)),
      pityLegend: Math.max(0, Math.floor(v.pityLegend || 0)),
      // Hộp quà được tặng (vd. phần thưởng phá án): mở không mất đốt.
      freeBoxes: Math.max(0, Math.floor(v.freeBoxes || 0)),
      // Quà đốt đã nhận từ Firebase: { mã: thời điểm nhận } (sync.js dùng để không cộng hai lần).
      grants: v.grants && typeof v.grants === 'object' ? v.grants : {},
      // Sự kiện: { sapa: { spins, pity } } — số lượt đã quay và số lượt chưa ra Huyền thoại.
      ev: v.ev && typeof v.ev === 'object' ? v.ev : {},
      updatedAt: v.updatedAt || 0,
    };
  };
  // Thêm các món còn thiếu của bộ; máy nào vừa được thêm thì nhớ để Tiệm Sâu báo một lần.
  const fillSets = (w) => {
    const got = [];
    for (const [k, list] of Object.entries(REWARD_SETS)) {
      if (!w.owned[k]) continue;
      let added = false;
      for (const it of list) if (!w.owned[it]) { w.owned[it] = Date.now(); added = true; }
      if (added) got.push(k);
    }
    if (got.length) {
      try {
        const old = JSON.parse(localStorage.getItem(SET_NOTICE)) || [];
        localStorage.setItem(SET_NOTICE, JSON.stringify([...new Set(old.concat(got))]));
      } catch (e) { /* bỏ qua */ }
    }
    return got.length > 0;
  };
  const write = (w) => {
    fillSets(w);
    w.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) { /* bỏ qua */ }
    if (window.Sync) window.Sync.dirty();
    return w;
  };
  // Đủ gói nào thì đổi luôn gói đó, không cần bấm đổi tay.
  const convert = (w) => {
    const packs = Math.floor(w.points / PACK_POINTS);
    w.points -= packs * PACK_POINTS;
    w.dot += packs * PACK_DOT;
    return packs * PACK_DOT;
  };

  (() => {
    const w = read();
    const before = JSON.stringify(w);
    // Một lần duy nhất: cộng điểm đã chơi trước khi có ví. Game chỉ lưu kỷ lục
    // của từng bài ở mỗi độ khó, nên đó là phần điểm cũ còn lấy lại được.
    if (!w.migrated) {
      try {
        const best = (JSON.parse(localStorage.getItem('sautim:v1')) || {}).best || {};
        for (const b of Object.values(best)) w.points += Math.max(0, Math.floor((b && b.score) || 0));
      } catch (e) { /* bỏ qua */ }
      w.migrated = true;
    }
    if (!w.gift) { w.dot += GIFT_DOT; w.gift = true; }
    fillSets(w);
    convert(w);
    if (JSON.stringify(w) !== before) write(w);
  })();

  window.Wallet = {
    PACK_POINTS,
    PACK_DOT,
    GIFT_DOT,
    DEFAULT_EQUIP,
    REWARD_SETS,
    get: read,
    // Bộ phần thưởng vừa nhận mà chưa báo (Tiệm Sâu lấy ra để hiện màn tặng quà).
    takeSetNotice() {
      let list = [];
      try { list = JSON.parse(localStorage.getItem(SET_NOTICE)) || []; localStorage.removeItem(SET_NOTICE); } catch (e) { /* bỏ qua */ }
      return list;
    },
    hasSetNotice() {
      try { return (JSON.parse(localStorage.getItem(SET_NOTICE)) || []).length > 0; } catch (e) { return false; }
    },
    // Sửa ví trong một lần đọc/ghi; fn trả false thì không ghi.
    update(fn) {
      const w = read();
      if (fn(w) === false) return null;
      return write(w);
    },
    // Cộng điểm ván vừa chơi, trả về số đốt cây vừa đổi được.
    addPoints(n) {
      const w = read();
      w.points += Math.max(0, Math.floor(n));
      const got = convert(w);
      write(w);
      return got;
    },
    // Số đốt đổi được ngay (thường là 0 vì đã tự đổi; còn để nút Đổi trong game dùng).
    canExchange(w) { return Math.floor((w || read()).points / PACK_POINTS) * PACK_DOT; },
    exchangeAll() {
      const w = read();
      const got = convert(w);
      write(w);
      return got;
    },
    // Quà chưa báo cho người dùng thì báo một lần.
    takeGiftNotice() {
      const w = read();
      if (!w.gift || w.giftSeen) return 0;
      w.giftSeen = true;
      write(w);
      return GIFT_DOT;
    },
    spend(dot) {
      const w = read();
      if (w.dot < dot) return false;
      w.dot -= dot;
      write(w);
      return true;
    },
    // ----- Đồ trong Tiệm Sâu -----
    owns(slot, id, w) {
      if (DEFAULT_EQUIP[slot] === id) return true;
      return !!(w || read()).owned[slot + ':' + id];
    },
    equipped() { return read().equip; },
    equip(slot, id) {
      return this.update((w) => {
        if (!this.owns(slot, id, w)) return false;
        w.equip[slot] = id;
      });
    },
  };
})();
