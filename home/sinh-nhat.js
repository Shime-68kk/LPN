'use strict';
// Thiệp sinh nhật 19 tuổi của Lệ Thủy (24/11/2026), cũng là ngày thứ 110 bên nhau.
// Tự bật một lần trên mỗi máy, từ 00:00 24/11 tới hết 26/11 (giờ VN), sau màn khoá.
// Xem thử không đánh dấu: home/?bao=sn. Mở lại bất cứ lúc nào: home/?thiep=19.
// Phong bì tím, dấu sáp hình giọt nước → mở ra hai bé hạt đậu cầm bánh nến "19" → chạm thổi nến → hoa bay, hiện lời chúc.
(() => {
  const TU = Date.parse('2026-11-24T00:00:00+07:00'), DEN = Date.parse('2026-11-27T00:00:00+07:00');
  const qs = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();
  const XEM_THU = qs.get('bao') === 'sn', MO_LAI = qs.get('thiep') === '19';
  const docSeen = () => { try { return JSON.parse(localStorage.getItem('lpn:news')) || {}; } catch (e) { return {}; } };
  const danhDau = () => { try { const s = docSeen(); s.sn19 = Date.now(); localStorage.setItem('lpn:news', JSON.stringify(s)); } catch (e) { /* bỏ qua */ } };
  const ITMOTION = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

  // Lời chúc (bản nháp Claude viết theo lời anh Quang, chờ anh duyệt)
  const LOI = [
    'Hôm nay em tròn mười chín tuổi. Hôm nay cũng là ngày thứ 110 mình bên nhau. Một ngày mà anh có tới hai điều để vui.',
    'Anh chúc em tuổi mới thật khoẻ, ngủ thật ngon, học quân sự xong thật nhẹ nhàng, thi thật tốt. Chúc em cười nhiều hơn khóc. Mà có lỡ khóc thì để anh lau cho.',
    'Cảm ơn em đã kiên nhẫn với anh, đã chờ anh, đã thương anh cả những lúc anh vụng về nhất.',
    'Anh thương em nhiều lắm. Hôm nay, ngày mai, và cả những ngày em không hỏi.',
    'Mấy hôm nữa em về, mình bù cho nhau một ngày sinh nhật thật to nhé.',
  ];

  const CSS = `
.sn19 { position: fixed; inset: 0; z-index: 40; overflow: hidden auto; -webkit-overflow-scrolling: touch;
  background: radial-gradient(120% 80% at 50% 0%, #5a3d86 0%, #3a2862 38%, #221a40 72%, #17112c 100%);
  font-family: 'Patrick Hand', 'Be Vietnam Pro', cursive; color: #fff; animation: sn-fade .6s ease-out both; }
.sn19[hidden] { display: none; }
/* trang chủ đặt viền chung cho mọi svg (icon): thiệp tự vẽ nên bỏ hết */
.sn19 svg { width: 100%; height: 100%; fill: #000; stroke: none; stroke-width: 1; stroke-linecap: butt; stroke-linejoin: miter; flex: initial; }
.sn19 svg.sn-tranh { height: auto; }
.sn-card:not(.da-uoc) .sn-than, .sn-card:not(.da-uoc) .sn-ky-hang, .sn-card:not(.da-uoc) .sn-nut { display: none; }
@keyframes sn-fade { from { opacity: 0; } }
.sn-sky { position: fixed; inset: 0; pointer-events: none; }
.sn-star { position: absolute; width: 2px; height: 2px; border-radius: 50%; background: #fff4d6; opacity: .5; animation: sn-tw var(--d, 3s) ease-in-out var(--l, 0s) infinite alternate; }
@keyframes sn-tw { to { opacity: .08; transform: scale(.6); } }
.sn-glow { position: fixed; left: 50%; top: 52%; width: 130vmax; height: 130vmax; transform: translate(-50%, -50%); pointer-events: none;
  background: radial-gradient(closest-side, rgba(255, 190, 210, .22), rgba(183, 156, 240, .08) 45%, transparent 70%); }
.sn-sao-bang { position: fixed; top: 8vh; right: -10vw; width: 160px; height: 2px; pointer-events: none; opacity: 0;
  background: linear-gradient(90deg, rgba(255, 244, 214, 0), #fff4d6); border-radius: 2px; transform: rotate(-28deg); transform-origin: right center;
  animation: sn-bay 1.6s .7s cubic-bezier(.3, .1, .2, 1) forwards; }
.sn-sao-bang::after { content: ''; position: absolute; right: -3px; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: #fff; box-shadow: 0 0 12px 4px rgba(255, 236, 190, .9); }
@keyframes sn-bay { 0% { opacity: 0; transform: translate(0, 0) rotate(-28deg); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(-62vw, 34vh) rotate(-28deg); } }

/* Màn 1: phong bì */
.sn-man { position: relative; min-height: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: calc(env(safe-area-inset-top, 0px) + 24px) 16px calc(env(safe-area-inset-bottom, 0px) + 24px); }
.sn-loi-mo { margin: 0 0 26px; font-size: 22px; color: #f4e9ff; text-align: center; opacity: 0; animation: sn-len .8s 1.4s ease-out forwards; }
.sn-loi-mo b { display: block; font: 700 34px/1.15 'Dancing Script', cursive; color: #ffd3e0; margin-top: 2px; }
@keyframes sn-len { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.sn-env { position: relative; width: min(84vw, 340px); aspect-ratio: 1.5; perspective: 900px; cursor: pointer; -webkit-tap-highlight-color: transparent;
  animation: sn-env-in 1s .5s cubic-bezier(.2, .9, .3, 1.15) both; }
.sn-env.cho { animation: sn-env-in 1s .5s cubic-bezier(.2, .9, .3, 1.15) both, sn-nhun 2.8s 1.6s ease-in-out infinite; }
@keyframes sn-env-in { from { opacity: 0; transform: translateY(60px) scale(.8) rotate(-6deg); } }
@keyframes sn-nhun { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-6px) rotate(-1deg); } }
.sn-env > div { position: absolute; }
.sn-lot { inset: 0; border-radius: 6px; background: #c6aef0;
  background-image: radial-gradient(circle at 25% 30%, rgba(255, 176, 192, .55) 0 2.2px, transparent 2.6px), radial-gradient(circle at 75% 70%, rgba(255, 255, 255, .45) 0 1.8px, transparent 2.2px);
  background-size: 22px 22px; box-shadow: 0 24px 50px rgba(8, 4, 20, .55), 0 6px 14px rgba(8, 4, 20, .35); }
.sn-peek { left: 5%; right: 5%; top: 6%; height: 88%; border-radius: 4px; background: #fffbf3; z-index: 2; display: flex; flex-direction: column; align-items: center; padding-top: 7%;
  box-sizing: border-box; transition: transform 1s cubic-bezier(.3, .1, .2, 1); color: #9c3f58; font: 700 clamp(22px, 7.2vw, 30px)/1 'Dancing Script', cursive; }
.sn-peek small { font: 17px/1.3 'Patrick Hand', cursive; color: #7b6aa6; margin-top: 6px; }
.sn-tui { inset: 0; z-index: 3; border-radius: 6px; clip-path: polygon(0 0, 50% 54%, 100% 0, 100% 100%, 0 100%);
  background: linear-gradient(170deg, #efe5fd 0%, #e4d6fa 60%, #d9c8f6 100%); }
.sn-tui::before { content: ''; position: absolute; inset: 0; clip-path: polygon(0 0, 50% 54%, 0 100%); background: rgba(160, 130, 220, .12); }
.sn-tui::after { content: ''; position: absolute; inset: 0; clip-path: polygon(100% 0, 50% 54%, 100% 100%); background: rgba(160, 130, 220, .2); }
.sn-nap { left: 0; right: 0; top: 0; height: 60%; z-index: 4; transform-origin: 50% 0; transition: transform .7s cubic-bezier(.4, .1, .3, 1), z-index 0s .35s;
  clip-path: polygon(0 0, 100% 0, 50% 100%); background: linear-gradient(180deg, #d7c4f7 0%, #cbb4f3 100%); border-radius: 6px 6px 0 0; }
.sn-gui { left: 9%; bottom: 10%; z-index: 5; font: 700 clamp(22px, 7vw, 29px)/1 'Dancing Script', cursive; color: #5a3f86; transform: rotate(-4deg); }
.sn-gui small { display: block; font: 15px/1.2 'Patrick Hand', cursive; color: #8a78b8; margin: 6px 0 0 4px; }
.sn-dau { right: 7%; bottom: 9%; z-index: 5; width: 27%; aspect-ratio: 1; transform: rotate(14deg); opacity: .82; }
.sn-sap { left: 50%; top: 60%; z-index: 6; width: 15%; aspect-ratio: .8; transform: translate(-50%, -62%); transition: transform .35s ease-in, opacity .35s ease-in; }
.sn-sap svg, .sn-dau svg { display: block; width: 100%; height: 100%; overflow: visible; }
.sn-cham { margin-top: 30px; font-size: 20px; color: #e8dcff; opacity: 0; animation: sn-len .6s 2s ease-out forwards, sn-tho 1.8s 2.6s ease-in-out infinite; }
@keyframes sn-tho { 50% { opacity: .45; } }
.sn19.mo .sn-sap { transform: translate(-50%, -62%) scale(1.5); opacity: 0; }
.sn19.mo .sn-nap { transform: rotateX(180deg); z-index: 1; transition-delay: .25s, .6s; }
.sn19.mo .sn-peek { transform: translateY(-58%); transition-delay: .9s; }
.sn19.mo .sn-cham, .sn19.mo .sn-loi-mo { animation: none; opacity: 0; transition: opacity .3s; }
.sn19.mo .sn-env { animation: none; }
.sn19.thiep .sn-man1 { opacity: 0; transform: translateY(40px) scale(.94); transition: opacity .5s, transform .6s; pointer-events: none; }
.sn-man1 { transition: opacity .5s; }
/* .sn-man đặt display:flex nên phải ép [hidden] ẩn hẳn, không thì phong bì tàng hình vẫn chiếm cả màn, đẩy thiệp xuống dưới */
.sn19 [hidden] { display: none !important; }

/* Màn 2: tấm thiệp */
.sn-card { position: relative; width: min(100%, 390px); box-sizing: border-box; margin: 10px auto 0; padding: 20px 20px 18px; border-radius: 3px;
  background: radial-gradient(ellipse 90% 70% at 50% 30%, #fffdf8, #fff8ee 70%, #fbf0e0); color: #4e3a26;
  box-shadow: 0 2px 3px rgba(20, 10, 30, .2), 0 28px 60px rgba(8, 4, 20, .55); animation: sn-card-in .9s cubic-bezier(.2, .9, .3, 1.1) both; }
@keyframes sn-card-in { from { opacity: 0; transform: translateY(70px) scale(.92) rotate(2deg); } }
.sn-card::before { content: ''; position: absolute; top: -12px; left: 50%; width: 104px; height: 26px; margin-left: -52px; transform: rotate(-3deg);
  background: repeating-linear-gradient(90deg, rgba(247, 163, 187, .85) 0 8px, rgba(255, 196, 212, .85) 8px 16px); box-shadow: 0 1px 2px rgba(0, 0, 0, .1); }
.sn-vien { position: absolute; inset: 8px; border: 1px dashed rgba(183, 156, 240, .55); border-radius: 2px; pointer-events: none; }
.sn-tranh { position: relative; display: block; width: 100%; height: auto; overflow: visible; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.sn-goi { margin: 2px 0 0; text-align: center; font-size: 19px; color: #9c3f58; animation: sn-tho 1.8s ease-in-out infinite; }
.sn-goi[hidden] { display: none; }
.sn-ky-hang { display: flex; align-items: center; justify-content: space-between; margin: 10px 4px 0 2px; }
.sn19 .sn-moc { width: 86px; height: 86px; flex: none; transform: rotate(-12deg) scale(1.6); opacity: 0; transition: opacity .6s, transform .7s cubic-bezier(.3, 1.6, .5, 1); }
.sn19 .sn-moc.hien { opacity: .88; transform: rotate(-12deg) scale(1); }
.sn-tieu { margin: 4px 0 0; text-align: center; font: 700 26px/1.1 'Dancing Script', cursive; color: #9c3f58; }
.sn-ten { margin: 0; text-align: center; font: 700 54px/1.05 'Dancing Script', cursive; color: #5a3f86; }
.sn-tuoi { margin: 2px 0 0; text-align: center; font-size: 20px; color: #8a6a7a; }
.sn-than { margin-top: 14px; padding: 0 6px; }
.sn-than p { margin: 0; font: 20px/1.42 'Patrick Hand', cursive; color: #4e3a26; opacity: 0; transform: translateY(8px); transition: opacity .8s, transform .8s; }
.sn-than p + p { margin-top: 10px; }
.sn-than p.hien { opacity: 1; transform: none; }
.sn-ky { display: block; margin-right: 6px; font: 700 30px/1 'Dancing Script', cursive; color: #9c3f58; opacity: 0; transition: opacity .8s; }
.sn-ky.hien { opacity: 1; }
.sn-nut { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-top: 16px; padding: 0 6px; opacity: 0; transition: opacity .8s; }
.sn-nut.hien { opacity: 1; }
.sn-nut a, .sn-nut button { font: 19px 'Patrick Hand', cursive; color: #5a3f86; background: none; border: 0; padding: 6px 0; cursor: pointer;
  text-decoration: underline; text-decoration-color: rgba(90, 63, 134, .35); text-underline-offset: 4px; }
.sn-nut button { color: #8a6a7a; }
.sn-cuoi { height: calc(env(safe-area-inset-bottom, 0px) + 28px); }

/* Hoa bay */
.sn-hoa { position: fixed; top: -40px; left: var(--x); width: var(--s); height: var(--s); pointer-events: none; z-index: 41;
  animation: sn-roi var(--t) var(--l) linear forwards; }
.sn-hoa > i { display: block; width: 100%; height: 100%; animation: sn-lac calc(var(--t) / 3) ease-in-out infinite alternate; }
.sn-hoa svg { display: block; width: 100%; height: 100%; animation: sn-xoay var(--t) linear infinite; }
@keyframes sn-roi { to { transform: translateY(calc(100vh + 80px)); } }
@keyframes sn-lac { from { transform: translateX(calc(var(--w) * -1)); } to { transform: translateX(var(--w)); } }
@keyframes sn-xoay { to { transform: rotate(var(--r)); } }
.sn-no { position: fixed; left: var(--x); top: var(--y); width: var(--s); height: var(--s); pointer-events: none; z-index: 41; opacity: 0;
  animation: sn-bung 1.6s var(--l) cubic-bezier(.15, .7, .3, 1) forwards; }
.sn-no svg { display: block; width: 100%; height: 100%; }
@keyframes sn-bung { 0% { opacity: 1; transform: translate(0, 0) rotate(0) scale(.4); } 70% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--r)) scale(1); } }

/* Trong tranh */
.sn-lua { transform-box: fill-box; transform-origin: 50% 100%; animation: sn-chay .5s ease-in-out infinite alternate; }
.sn-lua2 { animation-duration: .42s; animation-delay: -.2s; }
@keyframes sn-chay { from { transform: scale(1, 1) rotate(-3deg); } to { transform: scale(.88, 1.1) rotate(3deg); } }
.sn-sang { animation: sn-sang .5s ease-in-out infinite alternate; }
@keyframes sn-sang { to { opacity: .55; } }
.sn-khoi { opacity: 0; }
.sn-card.da-uoc .sn-lua, .sn-card.da-uoc .sn-sang { animation: sn-tat .35s ease-in forwards; }
@keyframes sn-tat { to { opacity: 0; transform: scale(.2, .3); } }
.sn-card.da-uoc .sn-khoi { animation: sn-khoi 2.4s .25s ease-out forwards; }
@keyframes sn-khoi { 0% { opacity: .8; stroke-dashoffset: 1; } 60% { opacity: .5; } 100% { opacity: 0; stroke-dashoffset: 0; transform: translateY(-10px); } }
.sn-bong { transform-box: fill-box; transform-origin: 50% 100%; animation: sn-bong 3.2s ease-in-out infinite alternate; }
@keyframes sn-bong { from { transform: rotate(-5deg) translateY(0); } to { transform: rotate(4deg) translateY(-4px); } }
.sn-be-h { animation: sn-nhun2 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.sn-be-t { animation: sn-nhun2 1.6s -.8s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes sn-nhun2 { 50% { transform: scale(1.02, .975); } }
.sn-mat-vui, .sn-tim { opacity: 0; }
.sn-card.da-uoc .sn-mat-tron { opacity: 0; transition: opacity .2s .5s; }
.sn-card.da-uoc .sn-mat-vui { opacity: 1; transition: opacity .2s .5s; }
.sn-card.da-uoc .sn-tim { animation: sn-tim 1.6s .7s ease-out forwards; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes sn-tim { 0% { opacity: 0; transform: translateY(6px) scale(.3); } 30% { opacity: 1; transform: translateY(0) scale(1.15); } 50% { transform: scale(1); } 100% { opacity: 1; transform: translateY(-3px); } }
.sn-lap { animation: sn-lap 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.sn-lap:nth-of-type(2n) { animation-delay: -.9s; }
@keyframes sn-lap { 50% { opacity: .25; transform: scale(.6); } }
@media (prefers-reduced-motion: reduce) {
  .sn19 *, .sn19 *::before, .sn19 *::after { animation-duration: .01s !important; animation-iteration-count: 1 !important; }
}
`;

  const f = (n) => (Math.round(n * 10) / 10).toString();
  // Hoa năm cánh (Lệ Thủy thích hoa, thích màu tím)
  const hoaSvg = (canh, nhuy) => {
    let s = '<svg viewBox="-10 -10 20 20" aria-hidden="true">';
    for (let i = 0; i < 5; i++) { const a = (i * 72 - 90) * Math.PI / 180; s += `<ellipse cx="${f(Math.cos(a) * 4.6)}" cy="${f(Math.sin(a) * 4.6)}" rx="3.9" ry="4.9" transform="rotate(${i * 72} ${f(Math.cos(a) * 4.6)} ${f(Math.sin(a) * 4.6)})" fill="${canh}"/>`; }
    return s + `<circle r="2.3" fill="${nhuy}"/></svg>`;
  };
  const giayHinh = (mau) => `<svg viewBox="0 0 10 14" aria-hidden="true"><rect x="1" y="1" width="8" height="12" rx="1.2" fill="${mau}"/></svg>`;
  const HOA_MAU = [['#d9c8ef', '#f6cf5e'], ['#b79cf0', '#fff1b8'], ['#ffd1dc', '#f6b94a'], ['#ffffff', '#f6cf5e'], ['#f7a3bb', '#fff1b8']];
  const GIAY_MAU = ['#ffe08a', '#9fd0ee', '#f7a3bb', '#c9b2f5', '#ffffff'];
  const rand = (a, b) => a + Math.random() * (b - a);

  // giọt nước (biểu tượng mít ướt của em): đỉnh (x, y), cao h
  const giot = (x, y, h) => { const r = h * 0.3;
    return `M ${f(x)} ${f(y)} C ${f(x - r * 0.25)} ${f(y + h * 0.28)} ${f(x - r)} ${f(y + h * 0.48)} ${f(x - r)} ${f(y + h - r)} A ${f(r)} ${f(r)} 0 0 0 ${f(x + r)} ${f(y + h - r)} C ${f(x + r)} ${f(y + h * 0.48)} ${f(x + r * 0.25)} ${f(y + h * 0.28)} ${f(x)} ${f(y)} Z`; };

  const SAP = `<svg viewBox="-20 -26 40 50" aria-hidden="true">
    <path d="${giot(0, -24, 46)}" fill="#e27a99"/><path d="${giot(0, -19, 37)}" fill="#f08fab"/>
    <path d="M -7 4 A 7.5 7.5 0 0 0 -4 12" stroke="#ffd3e0" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
    <text x="0" y="10" text-anchor="middle" style="font:700 15px 'Dancing Script',cursive;fill:#fff3f6">19</text></svg>`;
  const DAU_BUU_DIEN = `<svg viewBox="-50 -50 100 100" aria-hidden="true">
    <circle r="44" fill="none" stroke="#9c5a86" stroke-width="2.4"/><circle r="36" fill="none" stroke="#9c5a86" stroke-width="1.2"/>
    <text y="-12" text-anchor="middle" style="font:13px 'Patrick Hand',cursive;fill:#9c5a86">ngày thứ</text>
    <text y="16" text-anchor="middle" style="font:700 30px 'Patrick Hand',cursive;fill:#9c5a86">110</text>
    <text y="30" text-anchor="middle" style="font:10px 'Patrick Hand',cursive;fill:#9c5a86;letter-spacing:.5px">24 · 11 · 2026</text></svg>`;

  // Tranh: bé hồng (bạn nam, cao hơn) bưng bánh nến "19" cho bé tím (bạn nữ, nhỏ, đội mũ sinh nhật, cột bóng bay hình giọt nước)
  const EYE = '#2a1e3d', BLUSH = '#ff7fa0';
  const tranh = () => {
    const co = ['#f7a3bb', '#b79cf0', '#ffe08a', '#9fd0ee', '#ffd1dc', '#c9b2f5', '#f7a3bb', '#ffe08a', '#9fd0ee'];
    let day = '<path d="M 30 18 Q 160 52 290 18" fill="none" stroke="#b9a6d6" stroke-width="1.2"/>';
    co.forEach((m, i) => { const t = (i + 0.5) / co.length, x = 6 + 308 * t, y = 18 + 34 * 2 * t * (1 - t) * 1; const a = (t - 0.5) * 22;
      day += `<path d="M ${f(x - 9)} ${f(y)} L ${f(x + 9)} ${f(y)} L ${f(x)} ${f(y + 17)} Z" fill="${m}" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`; });
    const lap = [[52, 70, 4], [284, 70, 3.4], [124, 56, 2.6], [272, 118, 2.6], [64, 120, 3]].map(([x, y, r]) =>
      `<path class="sn-lap" d="M ${x} ${y - r * 2} Q ${x} ${y} ${x + r * 2} ${y} Q ${x} ${y} ${x} ${y + r * 2} Q ${x} ${y} ${x - r * 2} ${y} Q ${x} ${y} ${x} ${y - r * 2} Z" fill="#f6cf5e"/>`).join('');
    const co2 = [[46, 174, '#d9c8ef'], [64, 179, '#ffd1dc'], [278, 176, '#d9c8ef'], [260, 180, '#ffffff']].map(([x, y, m]) =>
      `<g transform="translate(${x} ${y}) scale(.62)">${hoaSvg(m, '#f6cf5e').replace(/<\/?svg[^>]*>/g, '')}</g>`).join('');
    // bé hồng: x 92–132, y 98–164; bé tím: x 196–228, y 120–164
    const beHong = `<g class="sn-be-h"><rect x="92" y="98" width="40" height="66" rx="20" fill="#ffb0c0"/>
      <path d="M 103 115 q 3.4 -4.4 6.8 0 M 115 115 q 3.4 -4.4 6.8 0" stroke="${EYE}" stroke-width="1.9" fill="none" stroke-linecap="round"/>
      <ellipse cx="102" cy="123" rx="3.6" ry="2.1" fill="${BLUSH}" opacity=".6"/><ellipse cx="124" cy="123" rx="3.6" ry="2.1" fill="${BLUSH}" opacity=".6"/>
      <path d="M 109 122 q 3.5 3.6 7 0" stroke="${EYE}" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>`;
    const tay = `<path d="M 128 134 Q 142 136 150 140" stroke="#f58fa9" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M 127 146 Q 150 152 172 142" stroke="#f58fa9" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    // bánh: đĩa ở y 142, thân bánh 148–176 × 116–140
    const banh = `<ellipse cx="162" cy="142" rx="22" ry="4.4" fill="#ffffff" stroke="#e7d9f3" stroke-width="1"/>
      <rect x="146" y="118" width="32" height="23" rx="4" fill="#fff3e4"/>
      <path d="M 146 124 q 0 -6 5 -6 h 22 q 5 0 5 6 v 3 q -2.6 3 -4.4 0 q -2.4 5.6 -5 0 q -2.6 4 -5.2 0 q -2.6 6 -5.4 0 q -2.4 3.6 -4.6 0 q -2 4.6 -4.4 0 z" fill="#c9b2f5"/>
      <circle cx="152" cy="133" r="1" fill="#f7a3bb"/><circle cx="159" cy="136" r="1" fill="#9fd0ee"/><circle cx="167" cy="132" r="1" fill="#f6cf5e"/><circle cx="173" cy="136" r="1" fill="#f7a3bb"/>
      <text x="156" y="117" text-anchor="middle" style="font:700 17px 'Fraunces',serif;fill:#f58fa9;stroke:#fff;stroke-width:.8;paint-order:stroke">1</text>
      <text x="168" y="117" text-anchor="middle" style="font:700 17px 'Fraunces',serif;fill:#b79cf0;stroke:#fff;stroke-width:.8;paint-order:stroke">9</text>
      <circle class="sn-sang" cx="156" cy="97" r="7" fill="#ffe7a6" opacity=".45"/><circle class="sn-sang" cx="168" cy="97" r="7" fill="#ffe7a6" opacity=".45"/>
      <path class="sn-lua" d="${giot(156, 92, 9)}" fill="#ffb347"/><path class="sn-lua sn-lua2" d="${giot(168, 92, 9)}" fill="#ffb347"/>
      <path class="sn-lua" d="${giot(156, 95, 5.4)}" fill="#fff3b0"/><path class="sn-lua sn-lua2" d="${giot(168, 95, 5.4)}" fill="#fff3b0"/>
      <path class="sn-khoi" pathLength="1" stroke-dasharray="1" d="M 156 100 c -5 -5 4 -9 -1 -15 c -5 -6 4 -9 -1 -16" stroke="#cfc6dc" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path class="sn-khoi" pathLength="1" stroke-dasharray="1" d="M 168 100 c 5 -5 -4 -9 1 -15 c 5 -6 -4 -9 1 -16" stroke="#cfc6dc" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    const beTim = `<g class="sn-be-t"><rect x="196" y="120" width="32" height="44" rx="16" fill="#b79cf0"/>
      <g class="sn-mat-tron">
        <ellipse cx="205.5" cy="134" rx="4" ry="4.8" fill="#fff" stroke="${EYE}" stroke-width=".9"/><ellipse cx="218.5" cy="134" rx="4" ry="4.8" fill="#fff" stroke="${EYE}" stroke-width=".9"/>
        <circle cx="203.6" cy="134.6" r="2" fill="${EYE}"/><circle cx="216.6" cy="134.6" r="2" fill="${EYE}"/>
        <circle cx="203" cy="133.6" r=".8" fill="#fff"/><circle cx="216" cy="133.6" r=".8" fill="#fff"/>
        <ellipse cx="212" cy="145" rx="1.9" ry="2.3" fill="${EYE}"/></g>
      <g class="sn-mat-vui"><path d="M 202 135 q 3.5 -4.6 7 0 M 215 135 q 3.5 -4.6 7 0" stroke="${EYE}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M 208.5 143 q 3.5 3.8 7 0" stroke="${EYE}" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>
      <ellipse cx="201" cy="141" rx="3.2" ry="1.9" fill="${BLUSH}" opacity=".6"/><ellipse cx="223" cy="141" rx="3.2" ry="1.9" fill="${BLUSH}" opacity=".6"/>
      <g transform="rotate(14 214 121)"><path d="M 204 122 L 214 96 L 224 122 Z" fill="#ffe08a"/>
        <path d="M 207.4 113 L 220.6 113 M 210.6 105 L 217.4 105" stroke="#f7a3bb" stroke-width="2.6"/>
        <path d="M 204 122 L 214 96 L 224 122 Z" fill="none" stroke="#f0c24e" stroke-width=".8" stroke-linejoin="round"/>
        <circle cx="214" cy="95" r="3.4" fill="#f7a3bb"/></g>
      <g transform="translate(-20 -16)"><path class="sn-tim" d="M 212 112 c -2.8 -3.8 -8.6 -2.2 -7 2.4 c 1.1 2.8 7 6.4 7 6.4 s 5.9 -3.6 7 -6.4 c 1.6 -4.6 -4.2 -6.2 -7 -2.4 z" fill="#ff6f8e"/></g></g>`;
    const bong = `<path d="M 226 146 C 240 136 236 112 250 94" stroke="#8a78b8" stroke-width="1" fill="none"/>
      <g class="sn-bong"><path d="${giot(252, 46, 46)}" fill="#9fd0ee" stroke="#5f9fc8" stroke-width="1.2"/>
        <path d="M 244 74 A 8 8 0 0 0 247 84" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="M 252 92 l -6 -3.2 l 0 6.4 z M 252 92 l 6 -3.2 l 0 6.4 z" fill="#f7a3bb"/><circle cx="252" cy="92" r="1.7" fill="#e86d8e"/></g>`;
    return `<svg class="sn-tranh" viewBox="26 8 268 176" role="img" aria-label="Bé hồng bưng bánh sinh nhật mười chín nến cho bé tím">
      ${day}${lap}
      <ellipse cx="112" cy="166" rx="26" ry="4" fill="#efe2cf"/><ellipse cx="212" cy="166" rx="22" ry="3.6" fill="#efe2cf"/>
      <path d="M 34 170 Q 160 160 286 170" stroke="#eadbc4" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      ${co2}${bong}${beHong}${beTim}${tay}${banh}</svg>`;
  };

  let goc = null;
  const SN19 = window.SN19 = {
    open: false,
    onClose: null,
    nen() {
      if (MO_LAI || XEM_THU) return true;
      const t = Date.now();
      return t >= TU && t < DEN && !docSeen().sn19;
    },
    show() {
      if (this.open || !this.nen()) return false;
      if (document.documentElement.classList.contains('need-lock')) return false;
      this.open = true;
      if (!document.getElementById('sn19-css')) { const st = document.createElement('style'); st.id = 'sn19-css'; st.textContent = CSS; document.head.appendChild(st); }
      goc = document.createElement('div');
      goc.className = 'sn19';
      goc.setAttribute('role', 'dialog'); goc.setAttribute('aria-modal', 'true'); goc.setAttribute('aria-label', 'Thiệp sinh nhật');
      let sao = '';
      for (let i = 0; i < 46; i++) sao += `<i class="sn-star" style="left:${rand(0, 100).toFixed(1)}%;top:${rand(0, 100).toFixed(1)}%;--d:${rand(1.8, 4.2).toFixed(1)}s;--l:${rand(-4, 0).toFixed(1)}s;${Math.random() < .25 ? 'width:3px;height:3px;' : ''}"></i>`;
      goc.innerHTML = `<div class="sn-sky">${sao}</div><div class="sn-glow"></div><div class="sn-sao-bang"></div>
        <div class="sn-man sn-man1">
          <p class="sn-loi-mo">Hôm nay có thư cho em<b>24 · 11</b></p>
          <div class="sn-env cho" role="button" tabindex="0" aria-label="Mở thiệp">
            <div class="sn-lot"></div>
            <div class="sn-peek">Sinh nhật vui vẻ<small>mít ướt ơi</small></div>
            <div class="sn-tui"></div>
            <div class="sn-nap"></div>
            <div class="sn-gui">Gửi mít ướt<small>của anh</small></div>
            <div class="sn-dau">${DAU_BUU_DIEN}</div>
            <div class="sn-sap">${SAP}</div>
          </div>
          <p class="sn-cham">chạm vào phong bì để mở nha</p>
        </div>
        <div class="sn-man sn-man2" hidden></div>`;
      document.body.appendChild(goc);
      const env = goc.querySelector('.sn-env');
      const moThu = () => {
        if (goc.classList.contains('mo')) return;
        goc.classList.add('mo');
        env.classList.remove('cho');
        setTimeout(() => this.bung(innerWidth / 2, innerHeight * 0.45, 30), 500);
        setTimeout(() => this.thiep(), 2100);
      };
      env.addEventListener('click', moThu);
      env.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); moThu(); } });
      return true;
    },
    thiep() {
      goc.classList.add('thiep');
      const m2 = goc.querySelector('.sn-man2');
      m2.innerHTML = `<div class="sn-card">
          <div class="sn-vien"></div>
          ${tranh()}
          <p class="sn-goi">Ước một điều đi, rồi chạm vào nến nha</p>
          <p class="sn-tieu">Chúc mừng sinh nhật</p>
          <p class="sn-ten">Lệ Thủy</p>
          <p class="sn-tuoi">mười chín tuổi rồi đó</p>
          <div class="sn-than">${LOI.map((l) => `<p>${l}</p>`).join('')}</div>
          <div class="sn-ky-hang"><svg class="sn-moc" viewBox="-50 -50 100 100" aria-hidden="true">${DAU_BUU_DIEN.replace(/<\/?svg[^>]*>/g, '')}</svg><span class="sn-ky">anh</span></div>
          <div class="sn-nut"><a href="../story/?play=c25">Món quà của anh: Phút đầu tiên</a><button type="button" class="sn-dong">Cất thiệp</button></div>
        </div><div class="sn-cuoi"></div>`;
      setTimeout(() => {
        // bỏ hẳn phong bì khỏi trang (không chỉ ẩn), rồi kéo về đầu để thiệp hiện ngay trước mắt
        const m1 = goc.querySelector('.sn-man1');
        if (m1) m1.remove();
        m2.hidden = false;
        const len = () => { goc.scrollTop = 0; };
        len(); requestAnimationFrame(len); setTimeout(len, 120);
      }, 450);
      const card = m2.querySelector('.sn-card'), anh = m2.querySelector('.sn-tranh');
      const uoc = (e) => {
        if (card.classList.contains('da-uoc')) return;
        card.classList.add('da-uoc');
        m2.querySelector('.sn-goi').hidden = true;
        const r = anh.getBoundingClientRect();
        this.bung(r.left + r.width * 0.5, r.top + r.height * 0.5, 34);
        setTimeout(() => this.mua(44), 500);
        const ps = card.querySelectorAll('.sn-than p');
        ps.forEach((p, i) => setTimeout(() => p.classList.add('hien'), 1100 + i * 700));
        setTimeout(() => card.querySelector('.sn-ky').classList.add('hien'), 1100 + ps.length * 700);
        setTimeout(() => card.querySelector('.sn-moc').classList.add('hien'), 1500 + ps.length * 700);
        setTimeout(() => card.querySelector('.sn-nut').classList.add('hien'), 1500 + ps.length * 700);
        if (!XEM_THU) danhDau();
      };
      anh.addEventListener('click', uoc);
      m2.querySelector('.sn-dong').addEventListener('click', () => this.close());
    },
    // hoa + giấy màu bung ra từ một điểm
    bung(x, y, n) {
      if (!goc || ITMOTION) return;
      for (let i = 0; i < n; i++) {
        const d = document.createElement('div');
        d.className = 'sn-no';
        const a = rand(0, Math.PI * 2), r = rand(90, Math.min(innerWidth, 520) * 0.62), s = rand(14, 26);
        d.style.cssText = `--x:${x - s / 2}px;--y:${y - s / 2}px;--s:${s}px;--dx:${f(Math.cos(a) * r)}px;--dy:${f(Math.sin(a) * r + 40)}px;--r:${f(rand(-260, 260))}deg;--l:${f(rand(0, .15))}s`;
        const hm = HOA_MAU[i % HOA_MAU.length];
        d.innerHTML = i % 3 === 2 ? giayHinh(GIAY_MAU[i % GIAY_MAU.length]) : hoaSvg(hm[0], hm[1]);
        goc.appendChild(d);
        setTimeout(() => d.remove(), 2000);
      }
    },
    // mưa hoa rơi khắp màn hình
    mua(n) {
      if (!goc || ITMOTION) return;
      for (let i = 0; i < n; i++) {
        const d = document.createElement('div');
        d.className = 'sn-hoa';
        const t = rand(5, 9), s = rand(14, 28);
        d.style.cssText = `--x:${rand(-2, 98).toFixed(1)}vw;--s:${s}px;--t:${t.toFixed(1)}s;--l:${rand(0, 3.5).toFixed(2)}s;--w:${rand(10, 34).toFixed(0)}px;--r:${rand(-540, 540).toFixed(0)}deg`;
        const hm = HOA_MAU[i % HOA_MAU.length];
        d.innerHTML = `<i>${i % 4 === 3 ? giayHinh(GIAY_MAU[i % GIAY_MAU.length]) : hoaSvg(hm[0], hm[1])}</i>`;
        goc.appendChild(d);
        setTimeout(() => d.remove(), (t + 4) * 1000);
      }
    },
    close() {
      if (!goc) return;
      if (!XEM_THU) danhDau();
      goc.style.transition = 'opacity .5s';
      goc.style.opacity = '0';
      const g = goc; goc = null;
      setTimeout(() => { g.remove(); this.open = false; if (typeof this.onClose === 'function') this.onClose(); }, 500);
      if (MO_LAI || XEM_THU) { try { history.replaceState(null, '', location.pathname); } catch (e) { /* bỏ qua */ } }
    },
  };
})();
