// Bảng giới thiệu bản cập nhật "Kỹ năng skin" (giấy kem như các trang khác, hình bé sâu thật, lời nhắn ngắn):
// mỗi bé sâu có một kỹ năng, nâng cấp ở Tiệm Sâu, đột phá; kèm vé dùng thử Sâu Vi Mạch bậc tối đa (có Lãnh Địa) 3 ván.
// Hiện sau màn khoá, khi không có thông báo chương mới đang mở. Bấm "Để sau" thì nửa ngày sau nhắc lại
// (tối đa 3 lần); đã bấm dùng thử hoặc xem Tiệm Sâu thì thôi.
'use strict';
(() => {
  const KEY = 'lpn:upd:skills1';
  const TRIAL_KEY = 'lpn:trial';
  const $ = (id) => document.getElementById(id);
  const load = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } };
  const box = $('upd');
  if (!box || !window.Skins) return;

  const st = load(KEY) || { n: 0, at: 0, done: false };
  if (st.done || st.n >= 3 || Date.now() - st.at < 12 * 3600e3) return;

  // Hai biểu tượng nhỏ cạnh lời nhắn: kỹ năng nâng tối đa (đá quý) và đột phá siêu cấp.
  $('upd-ic-up').style.color = Skins.SKILLS['tho-cam'].color;
  $('upd-ic-up').innerHTML = Skins.skillIcon('tho-cam', 34, 1);
  $('upd-ic-brk').style.color = Skins.SKILLS['vi-mach'].color;
  $('upd-ic-brk').innerHTML = Skins.skillIcon('vi-mach', 34, 2);

  // Hình bé Sâu Vi Mạch thật (vẽ bằng skins.js), cựa quậy nhẹ khi bảng đang mở.
  const art = $('upd-art');
  const vm = Skins.byKey('skin:vi-mach');
  let raf = 0;
  function draw(now) {
    if (box.hidden) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = 160, h = 100;
    if (art.width !== w * dpr) { art.width = w * dpr; art.height = h * dpr; }
    const x = art.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, w, h);
    Skins.drawPreview(x, vm, w, h, now / 1000);
    raf = requestAnimationFrame(draw);
  }

  function close(done) {
    box.hidden = true;
    cancelAnimationFrame(raf);
    save(KEY, { n: st.n + 1, at: Date.now(), done: !!done });
  }
  $('upd-try').addEventListener('click', () => {
    // Quà dùng thử: 3 ván Sâu Vi Mạch bậc tối đa (game đọc lpn:trial). Đã nhận rồi thì không cộng thêm.
    const tr = load(TRIAL_KEY);
    if (!tr || !tr.given) save(TRIAL_KEY, { skin: 'vi-mach', level: 4, left: 3, given: Date.now() });
    close(true);
  });
  $('upd-shop').addEventListener('click', () => close(true));
  $('upd-later').addEventListener('click', () => close(false));

  // Chờ qua màn khoá và không có thông báo khác đang mở rồi mới hiện.
  let tries = 0;
  const wait = setInterval(() => {
    tries++;
    const locked = document.documentElement.classList.contains('need-lock');
    const news = $('news');
    if (!locked && (!news || news.hidden)) {
      clearInterval(wait);
      setTimeout(() => {
        if (news && !news.hidden) return;
        box.hidden = false;
        raf = requestAnimationFrame(draw);
        $('upd-try').focus({ preventScroll: true });
      }, 700);
    } else if (tries > 600) clearInterval(wait);
  }, 1000);
})();
