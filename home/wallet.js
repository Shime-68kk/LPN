// Ví chung cho game và cốt truyện: điểm chơi Sâu Tím tự đổi ra đốt cây để mở chương.
// Lưu trên máy (localStorage), mỗi điện thoại một ví riêng.
'use strict';
(() => {
  const KEY = 'lpn:wallet';
  // 100.000 điểm = 30 đốt cây; đổi theo từng gói 10.000 điểm = 3 đốt, phần lẻ để dành ván sau.
  const PACK_POINTS = 10000;
  const PACK_DOT = 3;
  // Quà tặng một lần cho mỗi máy mở link.
  const GIFT_DOT = 1200;

  const read = () => {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* bỏ qua */ }
    return {
      points: Math.max(0, Math.floor((v && v.points) || 0)),
      dot: Math.max(0, Math.floor((v && v.dot) || 0)),
      migrated: !!(v && v.migrated),
      gift: !!(v && v.gift),
      giftSeen: !!(v && v.giftSeen),
    };
  };
  const write = (w) => {
    try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) { /* bỏ qua */ }
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
    convert(w);
    write(w);
  })();

  window.Wallet = {
    PACK_POINTS,
    PACK_DOT,
    GIFT_DOT,
    get: read,
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
  };
})();
