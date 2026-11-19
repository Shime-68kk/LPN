'use strict';
// Tấm thiệp sinh nhật cuối phim (hiện trong #thu từ giây 272). Tĩnh hoàn toàn, không dùng ảnh hay icon ngoài.
(() => {
  const SN = window.SN || (window.SN = {});
  const CSS_ID = 'thiep-css';

  const CSS = `
#thu {
  box-sizing: border-box;
  display: flex; flex-direction: column; align-items: center;
  padding: max(6px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) calc(52px + 3.2vh + env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  background:
    radial-gradient(circle at 50% 46%, rgba(255, 206, 152, .13) 0%, rgba(232, 152, 124, .06) 36%, transparent 68%),
    radial-gradient(ellipse 72% 62% at 50% 47%, rgba(182, 114, 74, .21) 0%, rgba(108, 60, 46, .14) 38%, rgba(24, 16, 17, .94) 76%, #090608 100%);
}
.thiep-khung {
  position: relative; box-sizing: border-box; margin: auto 0;
  width: min(100%, clamp(650px, 56vw, 900px));
  padding: clamp(20px, 5.6vh, 46px) clamp(11px, 1.5vw, 18px) clamp(11px, 3.2vh, 24px);
}
.thiep-nap {
  position: absolute; left: 0; right: 0; top: 0; height: 29.6%; z-index: 0; pointer-events: none;
}
.thiep-nap-svg, .thiep-bi-svg { display: block; width: 100%; height: 100%; }
.thiep-bi {
  position: absolute; left: 0; right: 0; top: 29%; bottom: 0; z-index: 1; pointer-events: none; overflow: hidden;
  border-radius: 2px 2px 6px 6px;
  background: linear-gradient(172deg, #e5c2b7 0%, #d9b0a4 52%, #cb9c8f 100%);
  border: 1px solid rgba(112, 66, 56, .34);
  box-shadow: 0 18px 44px rgba(0, 0, 0, .66), 0 4px 14px rgba(0, 0, 0, .44);
}
.thiep-the {
  position: relative; z-index: 2; box-sizing: border-box; width: 100%; overflow: hidden;
  padding: clamp(19px, 4.8vh, 46px) clamp(38px, 5.4vw, 72px) clamp(19px, 4.4vh, 44px);
  border-radius: 4px; color: #3e2c24;
  background:
    radial-gradient(ellipse 84% 76% at 50% 42%, rgba(255, 250, 242, .65) 0%, transparent 72%),
    radial-gradient(ellipse 115% 110% at 50% 50%, transparent 60%, rgba(212, 182, 146, .24) 100%),
    repeating-linear-gradient(0deg, rgba(145, 110, 72, .018) 0 1px, transparent 1px 4px),
    repeating-linear-gradient(90deg, rgba(145, 110, 72, .014) 0 1px, transparent 1px 5px),
    linear-gradient(164deg, #f8f0e3 0%, #f5ead9 54%, #f1e5d2 100%);
  box-shadow: 0 10px 26px rgba(42, 18, 14, .34), 0 2px 6px rgba(42, 18, 14, .2);
}
.thiep-vien-ngoai {
  position: absolute; inset: clamp(10px, 2vh, 15px);
  border: 1px solid rgba(184, 146, 90, .58); border-radius: 2px; pointer-events: none;
}
.thiep-vien-trong {
  position: absolute; inset: calc(clamp(10px, 2vh, 15px) + 4px);
  border: 1px solid rgba(184, 146, 90, .34); border-radius: 1px; pointer-events: none;
}
.thiep-hoa {
  position: absolute; width: clamp(78px, min(9.2vw, 13.5vh), 126px); height: auto; pointer-events: none; z-index: 1;
}
.thiep-hoa-tl { top: clamp(11px, 2.2vh, 17px); left: clamp(11px, 2.2vh, 17px); }
.thiep-hoa-br { bottom: clamp(11px, 2.2vh, 17px); right: clamp(11px, 2.2vh, 17px); }
.thiep-sao {
  position: absolute; z-index: 1; pointer-events: none; height: auto;
  top: calc(clamp(10px, 2vh, 15px) + clamp(6px, 1.2vh, 12px));
  right: calc(clamp(10px, 2vh, 15px) + clamp(8px, 1.3vw, 15px));
  width: clamp(40px, min(5.4vw, 9.5vh), 66px);
}
.thiep-tieu {
  position: relative; z-index: 2; margin: 0; text-align: center;
  font: 600 clamp(25px, min(3.9vw, 6.4vh), 49px)/1.12 'Dancing Script', cursive;
  color: #9c3f58; letter-spacing: .01em;
}
.thiep-gach {
  display: block; position: relative; z-index: 2; pointer-events: none;
  margin: clamp(3px, .8vh, 7px) auto clamp(7px, 1.8vh, 18px);
  width: clamp(116px, 19vw, 200px); height: clamp(8px, 1.4vh, 12px);
}
.thiep-than {
  position: relative; z-index: 2; text-align: left; color: #3e2c24;
  font: 400 clamp(15px, min(1.85vw, 4.15vh), 23.5px)/1.48 'Cormorant Garamond', Georgia, serif;
}
.thiep-than p { margin: 0; }
.thiep-than p + p { margin-top: clamp(7px, 1.6vh, 15px); }
`;

  const f = (n) => n.toFixed(1);
  const rnd = (s, k) => {
    const x = Math.sin(s * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const el = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };

  // Hoa nhí năm cánh vẽ tay: từng cánh lệch nhẹ khác nhau, lòng cánh hồng đậm hơn, nhuỵ vàng nhạt
  function veHoa(cx, cy, r, goc, hat) {
    let out = '';
    for (let i = 0; i < 5; i++) {
      const k = i * 5 + 1;
      const a = goc + i * 1.256637 + (rnd(hat, k) - 0.5) * 0.16;
      const ri = r * (0.9 + 0.18 * rnd(hat, k + 1));
      const wa = 0.43 + 0.08 * rnd(hat, k + 2);
      const skew = (rnd(hat, k + 3) - 0.5) * 0.08;
      const p1x = cx + Math.cos(a - wa * 0.82) * ri * 0.46, p1y = cy + Math.sin(a - wa * 0.82) * ri * 0.46;
      const p2x = cx + Math.cos(a - wa * 0.42) * ri * 1.07, p2y = cy + Math.sin(a - wa * 0.42) * ri * 1.07;
      const tx = cx + Math.cos(a + skew) * ri * 0.94, ty = cy + Math.sin(a + skew) * ri * 0.94;
      const p3x = cx + Math.cos(a + wa * 0.44) * ri * 1.08, p3y = cy + Math.sin(a + wa * 0.44) * ri * 1.08;
      const p4x = cx + Math.cos(a + wa * 0.8) * ri * 0.45, p4y = cy + Math.sin(a + wa * 0.8) * ri * 0.45;
      out += `<path d="M ${f(cx)} ${f(cy)} C ${f(p1x)} ${f(p1y)}, ${f(p2x)} ${f(p2y)}, ${f(tx)} ${f(ty)} C ${f(p3x)} ${f(p3y)}, ${f(p4x)} ${f(p4y)}, ${f(cx)} ${f(cy)} Z" fill="#e9a3b6" fill-opacity="0.9" stroke="#c8708d" stroke-width="0.46" stroke-opacity="0.54"/>`;
      const b1x = cx + Math.cos(a - wa * 0.48) * ri * 0.52, b1y = cy + Math.sin(a - wa * 0.48) * ri * 0.52;
      const b2x = cx + Math.cos(a + wa * 0.48) * ri * 0.52, b2y = cy + Math.sin(a + wa * 0.48) * ri * 0.52;
      const btx = cx + Math.cos(a) * ri * 0.54, bty = cy + Math.sin(a) * ri * 0.54;
      out += `<path d="M ${f(cx)} ${f(cy)} Q ${f(b1x)} ${f(b1y)} ${f(btx)} ${f(bty)} Q ${f(b2x)} ${f(b2y)} ${f(cx)} ${f(cy)} Z" fill="#d9809b" fill-opacity="0.34"/>`;
    }
    const rx = r * 0.22, ry = r * 0.19, deg = (goc * 180 / Math.PI) % 360;
    out += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(deg)} ${f(cx)} ${f(cy)})" fill="#f4df9e" stroke="#cf9e4c" stroke-width="0.42"/>`;
    for (let j = 0; j < 4; j++) {
      const ba = goc + j * 1.57 + rnd(hat, 30 + j) * 0.7;
      const bd = r * (0.07 + 0.1 * rnd(hat, 40 + j));
      out += `<circle cx="${f(cx + Math.cos(ba) * bd)}" cy="${f(cy + Math.sin(ba) * bd)}" r="${f(0.45 + 0.28 * rnd(hat, 50 + j))}" fill="#c38e3c"/>`;
    }
    return out;
  }

  // Lá xanh rêu hơi cong lệch tự nhiên + gân giữa mảnh
  function veLa(x0, y0, x1, y1, rong, mau, op) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const c1x = x0 + dx * 0.36 + nx * rong, c1y = y0 + dy * 0.36 + ny * rong;
    const c2x = x0 + dx * 0.44 - nx * rong * 0.8, c2y = y0 + dy * 0.44 - ny * rong * 0.8;
    const mx = x0 + dx * 0.52 + nx * rong * 0.08, my = y0 + dy * 0.52 + ny * rong * 0.08;
    return `<path d="M ${f(x0)} ${f(y0)} Q ${f(c1x)} ${f(c1y)} ${f(x1)} ${f(y1)} Q ${f(c2x)} ${f(c2y)} ${f(x0)} ${f(y0)} Z" fill="${mau}" fill-opacity="${op}"/><path d="M ${f(x0)} ${f(y0)} Q ${f(mx)} ${f(my)} ${f(x0 + dx * 0.78)} ${f(y0 + dy * 0.78)}" fill="none" stroke="#4c592d" stroke-width="0.52" stroke-opacity="0.55" stroke-linecap="round"/>`;
  }

  // Nụ hoa hồng nhỏ với hai đài xanh ôm đáy
  function veNu(cx, cy, ang, r) {
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
    const tx = cx + ux * r * 2.1, ty = cy + uy * r * 2.1;
    const l1x = cx + ux * r * 0.85 + nx * r * 0.9, l1y = cy + uy * r * 0.85 + ny * r * 0.9;
    const r1x = cx + ux * r * 0.85 - nx * r * 0.85, r1y = cy + uy * r * 0.85 - ny * r * 0.85;
    const s1x = cx + ux * r * 0.95 + nx * r * 0.65, s1y = cy + uy * r * 0.95 + ny * r * 0.65;
    const s2x = cx + ux * r * 0.95 - nx * r * 0.65, s2y = cy + uy * r * 0.95 - ny * r * 0.65;
    return `<path d="M ${f(cx)} ${f(cy)} Q ${f(l1x)} ${f(l1y)} ${f(tx)} ${f(ty)} Q ${f(r1x)} ${f(r1y)} ${f(cx)} ${f(cy)} Z" fill="#e9a3b6" stroke="#c8708d" stroke-width="0.42" stroke-opacity="0.55"/><path d="M ${f(cx)} ${f(cy)} Q ${f(s1x)} ${f(s1y)} ${f(cx + ux * r * 0.55 + nx * r * 0.3)} ${f(cy + uy * r * 0.55 + ny * r * 0.3)} L ${f(cx)} ${f(cy)} Q ${f(s2x)} ${f(s2y)} ${f(cx + ux * r * 0.55 - nx * r * 0.3)} ${f(cy + uy * r * 0.55 - ny * r * 0.3)} Z" fill="#5f6e3a"/>`;
  }

  const veNhu = (ds) => ds.map(([x, y, r, op]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d4b06a" fill-opacity="${op}"/>`).join('');

  // Hai chùm hoa vẽ riêng ở 2 góc chéo nhau (không xoay lật đối xứng)
  function chumTrenTrai() {
    const canh =
      '<path d="M 11 16 C 32 10, 62 11, 95 19" fill="none" stroke="#5f6e3a" stroke-width="1.35" stroke-linecap="round"/>' +
      '<path d="M 27 15 C 31 33, 24 55, 16 79" fill="none" stroke="#5f6e3a" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M 38 14 C 46 21, 51 27, 56 32" fill="none" stroke="#7b8a4e" stroke-width="0.9" stroke-linecap="round"/>';
    const la =
      veLa(22, 13, 35, 5, 4.4, '#7b8a4e', 0.84) + veLa(49, 12, 64, 5, 4.2, '#5f6e3a', 0.84) +
      veLa(69, 15, 83, 22, 4.0, '#7b8a4e', 0.82) + veLa(84, 17, 94, 12, 3.2, '#5f6e3a', 0.78) +
      veLa(29, 32, 42, 40, 4.3, '#7b8a4e', 0.84) + veLa(24, 51, 11, 61, 4.5, '#5f6e3a', 0.85) +
      veLa(18, 69, 23, 86, 3.6, '#7b8a4e', 0.8);
    const hoa = veHoa(34, 21, 10.2, 0.3, 1.7) + veHoa(67, 19, 7.3, 1.1, 4.2) + veHoa(22, 46, 7.0, -0.4, 7.9) + veNu(95, 19, -0.1, 3.3);
    const nhu = veNhu([[47, 8, 1.3, 0.78], [80, 10, 1.1, 0.7], [104, 15, 1.4, 0.85], [39, 32, 1.1, 0.72], [11, 56, 1.3, 0.76], [28, 73, 1.0, 0.68]]);
    return `<svg class="thiep-hoa thiep-hoa-tl" viewBox="0 0 130 112" aria-hidden="true">${canh}${la}${hoa}${nhu}</svg>`;
  }

  function chumDuoiPhai() {
    const canh =
      '<path d="M 118 96 C 92 101, 59 98, 25 89" fill="none" stroke="#5f6e3a" stroke-width="1.35" stroke-linecap="round"/>' +
      '<path d="M 104 95 C 103 71, 107 47, 115 22" fill="none" stroke="#5f6e3a" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M 88 97 C 79 89, 72 84, 65 80" fill="none" stroke="#7b8a4e" stroke-width="0.9" stroke-linecap="round"/>';
    const la =
      veLa(108, 86, 121, 74, 4.2, '#7b8a4e', 0.84) + veLa(105, 68, 93, 57, 4.3, '#5f6e3a', 0.84) +
      veLa(109, 44, 121, 32, 4.1, '#7b8a4e', 0.82) + veLa(75, 98, 63, 107, 4.4, '#5f6e3a', 0.85) +
      veLa(52, 95, 39, 84, 4.0, '#7b8a4e', 0.82) + veLa(34, 91, 20, 97, 3.5, '#5f6e3a', 0.8);
    const hoa = veHoa(92, 87, 10.4, -0.5, 11.3) + veHoa(106, 56, 7.6, 0.8, 15.6) + veHoa(56, 94, 6.9, 2.1, 19.4) + veNu(115, 22, -1.35, 3.4) + veNu(25, 89, -2.9, 2.9);
    const nhu = veNhu([[104, 38, 1.2, 0.76], [96, 69, 1.4, 0.84], [74, 83, 1.1, 0.72], [43, 100, 1.3, 0.78], [120, 62, 1.0, 0.68], [71, 105, 1.2, 0.72]]);
    return `<svg class="thiep-hoa thiep-hoa-br" viewBox="0 0 130 112" aria-hidden="true">${canh}${la}${hoa}${nhu}</svg>`;
  }

  function chomSao() {
    const sao = [[8, 14, 1.55], [22, 32, 1.8], [38, 17, 1.65], [53, 29, 1.5], [68, 11, 1.4]];
    const net = `<path d="M ${sao.map((p) => p[0] + ' ' + p[1]).join(' L ')}" fill="none" stroke="rgba(184, 146, 90, 0.36)" stroke-width="0.85" stroke-linecap="round" stroke-linejoin="round"/>`;
    const cham = sao.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${f(r * 2.1)}" fill="rgba(212, 176, 106, 0.22)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#c99f50"/>`).join('');
    return `<svg class="thiep-sao" viewBox="0 0 76 42" aria-hidden="true">${net}${cham}</svg>`;
  }

  function gachTieuDe() {
    return (
      '<svg class="thiep-gach" viewBox="0 0 220 14" aria-hidden="true">' +
      '<path d="M 14 7 Q 64 9.6 102 6.6" fill="none" stroke="rgba(184, 146, 90, 0.56)" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M 118 6.6 Q 156 9.6 206 7" fill="none" stroke="rgba(184, 146, 90, 0.56)" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M 110 3.2 Q 113.4 6.5 110 9.8 Q 106.6 6.5 110 3.2 Z" fill="rgba(184, 146, 90, 0.62)"/>' +
      '<circle cx="101" cy="6.8" r="1.1" fill="rgba(184, 146, 90, 0.55)"/><circle cx="119" cy="6.8" r="1.1" fill="rgba(184, 146, 90, 0.55)"/>' +
      '</svg>'
    );
  }

  function phongBi() {
    const nap =
      '<div class="thiep-nap"><svg class="thiep-nap-svg" viewBox="0 0 760 140" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="thiep-nap-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f0d8cf"/><stop offset="65%" stop-color="#e5c2b6"/><stop offset="100%" stop-color="#d7ab9e"/></linearGradient></defs>' +
      '<path d="M 1 140 L 1 134 Q 4 126 18 118 L 351 11 Q 380 -1 409 11 L 742 118 Q 756 126 759 134 L 759 140 Z" fill="url(#thiep-nap-g)" stroke="#bc8f82" stroke-width="1.1" vector-effect="non-scaling-stroke"/>' +
      '<path d="M 22 135 L 354 20 Q 380 11 406 20 L 738 135" fill="none" stroke="rgba(184, 146, 90, 0.34)" stroke-width="0.9" vector-effect="non-scaling-stroke"/>' +
      '</svg></div>';
    const bi =
      '<div class="thiep-bi"><svg class="thiep-bi-svg" viewBox="0 0 760 300" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M 0 1 L 760 1" fill="none" stroke="rgba(255, 240, 232, 0.42)" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
      '<path d="M 4 298 L 285 95 M 756 298 L 475 95" fill="none" stroke="rgba(122, 74, 62, 0.22)" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
      '</svg></div>';
    return nap + bi;
  }

  const LOI = [
    'Chúc em có một tuổi mười chín thật rực rỡ.',
    'Mong em luôn bình an, luôn vui, và có thật nhiều điều em mong ước.',
    'Hôm nay có lẽ mình chưa gặp được nhau, dù với anh đây là ngày quan trọng nhất trong năm. Nhưng không sao đâu, anh vẫn ở đây chờ em. Đợi em học quân sự xong, anh sẽ đến tìm em, rồi mình bù cho nhau một ngày sinh nhật thật vui nhé.',
  ];

  SN.thiep = function (cha) {
    if (!cha) return;
    if (!document.getElementById(CSS_ID)) {
      const st = document.createElement('style');
      st.id = CSS_ID;
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    if (cha.querySelector('.thiep-khung')) return;

    const khung = el('div', 'thiep-khung');
    khung.innerHTML = phongBi();

    const the = el('div', 'thiep-the');
    the.innerHTML =
      '<div class="thiep-vien-ngoai"></div>' +
      '<div class="thiep-vien-trong"></div>' +
      chumTrenTrai() + chomSao() + chumDuoiPhai();

    the.appendChild(el('h1', 'thiep-tieu', 'Chúc mừng sinh nhật Lệ Thủy'));
    the.insertAdjacentHTML('beforeend', gachTieuDe());

    const than = el('div', 'thiep-than');
    for (const doan of LOI) than.appendChild(el('p', '', doan));
    the.appendChild(than);

    khung.appendChild(the);
    cha.appendChild(khung);
  };
})();
