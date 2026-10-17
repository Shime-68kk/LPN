// Ví chung cho game và cốt truyện: điểm chơi Sâu Tím đổi ra đốt cây để mở chương.
// Lưu trên máy (localStorage), mỗi điện thoại một ví riêng.
'use strict';
(() => {
  const KEY = 'lpn:wallet';
  // 100.000 điểm = 30 đốt cây; đổi theo từng gói 10.000 điểm = 3 đốt cho lẻ được.
  const PACK_POINTS = 10000;
  const PACK_DOT = 3;

  const read = () => {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* bỏ qua */ }
    return { points: Math.max(0, Math.floor((v && v.points) || 0)), dot: Math.max(0, Math.floor((v && v.dot) || 0)) };
  };
  const write = (w) => {
    try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) { /* bỏ qua */ }
    return w;
  };

  window.Wallet = {
    PACK_POINTS,
    PACK_DOT,
    get: read,
    // Số đốt đổi được ngay với số điểm đang có.
    canExchange(w) { return Math.floor((w || read()).points / PACK_POINTS) * PACK_DOT; },
    addPoints(n) {
      const w = read();
      w.points += Math.max(0, Math.floor(n));
      return write(w);
    },
    // Đổi hết số gói đủ điểm; phần lẻ dưới 10.000 điểm giữ lại.
    exchangeAll() {
      const w = read();
      const packs = Math.floor(w.points / PACK_POINTS);
      w.points -= packs * PACK_POINTS;
      w.dot += packs * PACK_DOT;
      write(w);
      return packs * PACK_DOT;
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
