'use strict';
// NHÀ CỬA quanh đồi chè Thái Nguyên (dựng cho cảnh đất c-dat.js, S 207.65–242). Đêm 23:59, đèn lác đác.
//  - DOANH TRẠI trên mặt bằng đỉnh đồi, mở về phía máy quay: ba dãy nhà tầng quây chữ U quanh vườn trong
//    (dãy sau 5 tầng, cửa sổ phòng nhìn ra vườn — cửa sổ của em ở tầng 3; hai dãy cánh 4 tầng có hành lang sáng đèn),
//    phía trước là sân điều lệnh, bục cờ, cột cờ với lá cờ bay nhẹ trong gió, đèn rọi; tường rào, cổng có ngôi sao, chòi gác,
//    đèn đường trong trại; con đường có đèn leo dốc đồi chè lên cổng. Là chỗ sáng, rõ, nhiều chi tiết nhất khung hình.
//  - XÓM PHỐ dưới thung lũng phía tây: nhà ống 2–5 tầng sát nhau, mặt tiền sơn màu, tường hông bê tông thô, ban công,
//    cửa cuốn, biển hiệu, bồn nước inox và nhà tum trên mái; đèn đường cam; xe máy, ô tô chạy đêm.
//  - THÀNH PHỐ xa phía tây tây bắc: chung cư, nhà cao tầng, đèn viền đỉnh nhà, đèn báo máy bay nhấp nháy, đường vành đai có xe;
//    vài khối chung cư phía đông; nhà dân lác đác giữa các đồi chè.
// Mọi khối nhà gộp một lưới, vẽ một lần; cửa sổ, ban công, nan cửa cuốn… vẽ bằng shader theo toạ độ mét trên mặt tường,
// ở xa tự gộp thành độ sáng trung bình (khỏi lấp lánh răng cưa).
(() => {
  const SN = window.SN, { clamp, mix } = SN.u;
  const D2R = Math.PI / 180;
  let seed = 20261124;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // ---------- bộ dựng lưới ----------
  // mỗi đỉnh: vị trí (thế giới), pháp tuyến, aB = (vật liệu, u, v, mã nhà), aS = (kiểu mặt, cao tầng, rộng gian, tham số)
  const M_TUONG = 0, M_NGOI = 1, M_VIEN = 2, M_NEN = 3, M_SAN = 4, M_LANCAN = 5, M_SAT = 6, M_MAIBANG = 7, M_TRAN = 8, M_INOX = 9, M_PHAT = 10, M_SAO = 11, M_CAY = 12, M_DUONG = 13, M_KINH = 14, M_TON = 15;
  let G = null, ST = [8, 3.4, 3.6, 0], BID = 0;
  const kieu = (st, fh, bw, p) => { ST = [st, fh, bw, p]; };
  function tri(a, b, c, ua, ub, uc, mat) {
    const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2], e2x = c[0] - a[0], e2y = c[1] - a[1], e2z = c[2] - a[2];
    let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    const l = Math.hypot(nx, ny, nz); if (l < 1e-10) return; nx /= l; ny /= l; nz /= l;
    G.P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    G.N.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    G.B.push(mat, ua[0], ua[1], BID, mat, ub[0], ub[1], BID, mat, uc[0], uc[1], BID);
    for (let k = 0; k < 3; k++) G.S.push(ST[0], ST[1], ST[2], ST[3]);
  }
  // tứ giác a b c d, ngược chiều kim đồng hồ khi nhìn từ phía mặt; uv: toạ độ mét của 4 góc
  function quad(a, b, c, d, mat, uv) { tri(a, b, c, uv[0], uv[1], uv[2], mat); tri(a, c, d, uv[0], uv[2], uv[3], mat); }
  // khung toạ độ: x ngang, y lên, +z là mặt trước; xoay quanh trục đứng
  function khung(cx, cy, cz, rot) { const c = Math.cos(rot), s = Math.sin(rot); return (x, y, z) => [cx + x * c + z * s, cy + y, cz - x * s + z * c]; }
  function con(t, ox, oy, oz, rot) { const c = Math.cos(rot), s = Math.sin(rot); return (x, y, z) => t(ox + x * c + z * s, oy + y, oz - x * s + z * c); }
  // hộp; m = {f, b, l, r, t, d}: vật liệu từng mặt (bỏ trống = không vẽ). Mặt đứng: u tính từ mép trái khi nhìn từ ngoài, v = độ cao
  function hop(t, x0, x1, y0, y1, z0, z1, m, uo) {
    uo = uo || 0;
    const W = x1 - x0, D = z1 - z0;
    const vq = (a0, a1) => [[a0, y0], [a1, y0], [a1, y1], [a0, y1]];
    if (m.f != null) quad(t(x0, y0, z1), t(x1, y0, z1), t(x1, y1, z1), t(x0, y1, z1), m.f, vq(uo, uo + W));
    if (m.b != null) quad(t(x1, y0, z0), t(x0, y0, z0), t(x0, y1, z0), t(x1, y1, z0), m.b, vq(0, W));
    if (m.l != null) quad(t(x0, y0, z0), t(x0, y0, z1), t(x0, y1, z1), t(x0, y1, z0), m.l, vq(0, D));
    if (m.r != null) quad(t(x1, y0, z1), t(x1, y0, z0), t(x1, y1, z0), t(x1, y1, z1), m.r, vq(0, D));
    if (m.t != null) quad(t(x0, y1, z1), t(x1, y1, z1), t(x1, y1, z0), t(x0, y1, z0), m.t, [[x0, z1], [x1, z1], [x1, z0], [x0, z0]]);
    if (m.d != null) quad(t(x0, y0, z0), t(x1, y0, z0), t(x1, y0, z1), t(x0, y0, z1), m.d, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]);
  }
  const all = (m) => ({ f: m, b: m, l: m, r: m, t: m });
  // mái ngói bốn mái (mái chìa, diềm, mặt dưới mái chìa)
  function maiNgoi(t, x0, x1, z0, z1, ey, ov, k) {
    const X0 = x0 - ov, X1 = x1 + ov, Z0 = z0 - ov, Z1 = z1 + ov;
    const hd = (Z1 - Z0) / 2, zc = (Z0 + Z1) / 2, rise = hd * k, ry = ey + rise;
    const xm = (X0 + X1) / 2, rx0 = Math.min(X0 + hd, xm - 0.01), rx1 = Math.max(X1 - hd, xm + 0.01), sl = Math.hypot(hd, rise);
    quad(t(X0, ey, Z1), t(X1, ey, Z1), t(rx1, ry, zc), t(rx0, ry, zc), M_NGOI, [[0, 0], [X1 - X0, 0], [rx1 - X0, sl], [rx0 - X0, sl]]);
    quad(t(X1, ey, Z0), t(X0, ey, Z0), t(rx0, ry, zc), t(rx1, ry, zc), M_NGOI, [[0, 0], [X1 - X0, 0], [X1 - rx0, sl], [X1 - rx1, sl]]);
    tri(t(X1, ey, Z1), t(X1, ey, Z0), t(rx1, ry, zc), [0, 0], [Z1 - Z0, 0], [hd, sl], M_NGOI);
    tri(t(X0, ey, Z0), t(X0, ey, Z1), t(rx0, ry, zc), [0, 0], [Z1 - Z0, 0], [hd, sl], M_NGOI);
    const fy = ey - 0.24;
    quad(t(X0, fy, Z0), t(X1, fy, Z0), t(X1, fy, Z1), t(X0, fy, Z1), M_VIEN, [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]]);
    quad(t(X0, fy, Z1), t(X1, fy, Z1), t(X1, ey, Z1), t(X0, ey, Z1), M_VIEN, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    quad(t(X1, fy, Z0), t(X0, fy, Z0), t(X0, ey, Z0), t(X1, ey, Z0), M_VIEN, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    quad(t(X0, fy, Z0), t(X0, fy, Z1), t(X0, ey, Z1), t(X0, ey, Z0), M_VIEN, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    quad(t(X1, fy, Z1), t(X1, fy, Z0), t(X1, ey, Z0), t(X1, ey, Z1), M_VIEN, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // mái bằng có tường chắn mái
  function maiBang(t, x0, x1, z0, z1, y, ph) {
    quad(t(x0, y, z1), t(x1, y, z1), t(x1, y, z0), t(x0, y, z0), M_MAIBANG, [[x0, z1], [x1, z1], [x1, z0], [x0, z0]]);
    const th = 0.18;
    hop(t, x0, x1, y, y + ph, z1 - th, z1, { f: M_TUONG, b: M_VIEN, t: M_VIEN });
    hop(t, x0, x1, y, y + ph, z0, z0 + th, { b: M_TUONG, f: M_VIEN, t: M_VIEN });
    hop(t, x0, x0 + th, y, y + ph, z0 + th, z1 - th, { l: M_TUONG, r: M_VIEN, t: M_VIEN });
    hop(t, x1 - th, x1, y, y + ph, z0 + th, z1 - th, { r: M_TUONG, l: M_VIEN, t: M_VIEN });
  }
  // bồn nước inox nằm ngang trên giá sắt
  function bonNuoc(t, x, y, z, r, len, rot) {
    const tc = con(t, x, y, z, rot);
    hop(tc, -len * 0.38, -len * 0.3, 0, 0.55, -r * 0.8, r * 0.8, all(M_SAT));
    hop(tc, len * 0.3, len * 0.38, 0, 0.55, -r * 0.8, r * 0.8, all(M_SAT));
    const N = 8, y0 = 0.55 + r;
    const p = (a, xx) => tc(xx, y0 + Math.sin(a) * r, Math.cos(a) * r);
    for (let i = 0; i < N; i++) {
      const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
      quad(p(a1, -len / 2), p(a0, -len / 2), p(a0, len / 2), p(a1, len / 2), M_INOX, [[0, a1 * r], [0, a0 * r], [len, a0 * r], [len, a1 * r]]);
      tri(tc(len / 2, y0, 0), p(a1, len / 2), p(a0, len / 2), [0, 0], [1, 0], [1, 1], M_INOX);
      tri(tc(-len / 2, y0, 0), p(a0, -len / 2), p(a1, -len / 2), [0, 0], [1, 0], [1, 1], M_INOX);
    }
  }
  // dải đường (mặt nhựa) bám địa hình
  function resample(pts, step) {
    const out = [pts[0].slice()];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l / step));
      for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    // làm mượt góc
    for (let it = 0; it < 3; it++) for (let i = 1; i < out.length - 1; i++) { out[i][0] = (out[i - 1][0] + out[i][0] * 2 + out[i + 1][0]) / 4; out[i][1] = (out[i - 1][1] + out[i][1] * 2 + out[i + 1][1]) / 4; }
    return out;
  }
  function duong(R, w, ke) {
    const hDat = SN.dat.hDat;
    const nrm = (i) => { const a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 1)]; const tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1; return [-tz / l, tx / l]; };
    const yAt = (p, n) => { let m = -1e9; for (let k = -2; k <= 2; k++) m = Math.max(m, hDat(p[0] + n[0] * w * k / 3.6, p[1] + n[1] * w * k / 3.6)); return m + 0.4; };
    kieu(0, 1, 1, ke);
    let acc = 0;
    for (let i = 0; i < R.length - 1; i++) {
      const a = R[i], b = R[i + 1], na = nrm(i), nb = nrm(i + 1), l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ya = yAt(a, na), yb = yAt(b, nb), h = w / 2;
      const aL = [a[0] + na[0] * h, ya, a[1] + na[1] * h], aR = [a[0] - na[0] * h, ya, a[1] - na[1] * h];
      const bL = [b[0] + nb[0] * h, yb, b[1] + nb[1] * h], bR = [b[0] - nb[0] * h, yb, b[1] - nb[1] * h];
      // hướng lên trên
      const e1 = [bR[0] - aR[0], bR[2] - aR[2]], e2 = [aL[0] - aR[0], aL[2] - aR[2]];
      if (e1[1] * e2[0] - e1[0] * e2[1] > 0) quad(aR, bR, bL, aL, M_DUONG, [[acc, -h], [acc + l, -h], [acc + l, h], [acc, h]]);
      else quad(aL, bL, bR, aR, M_DUONG, [[acc, h], [acc + l, h], [acc + l, -h], [acc, -h]]);
      acc += l;
    }
  }

  // ---------- shader ----------
  const NHA_V = `
  attribute vec4 aB; attribute vec4 aS;
  varying vec3 vW; varying vec3 vN; varying vec4 vB; varying vec4 vS;
  void main(){ vW = position; vN = normal; vB = aB; vS = aS; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
  const NHA_F = `
  varying vec3 vW; varying vec3 vN; varying vec4 vB; varying vec4 vS;
  uniform vec4 uL[8]; uniform float uLK; uniform vec3 uTrai; uniform vec3 uThuyC; uniform float uThuy;
  vec3 denTrai(vec3 wp, vec3 n){
    vec3 s = vec3(0.);
    if (length(wp.xz - uTrai.xz) > 100.) return s;
    for (int i = 0; i < 8; i++) { vec3 d = uL[i].xyz - wp; float l2 = dot(d, d); s += uL[i].w * max(dot(n, d) * inversesqrt(l2 + 1e-4), 0.) * 30. / (l2 + 6.); }
    return s * vec3(1., .66, .36) * uLK;
  }
  vec3 mauNha(float h){
    return h < .16 ? vec3(.62, .55, .40) : h < .3 ? vec3(.64, .52, .26) : h < .44 ? vec3(.36, .48, .56) : h < .56 ? vec3(.6, .42, .42) : h < .7 ? vec3(.66, .66, .62) : h < .82 ? vec3(.44, .56, .46) : h < .92 ? vec3(.58, .5, .58) : vec3(.42, .42, .4);
  }
  vec3 mauDen(float h){ return h < .55 ? vec3(1., .62, .3) : (h < .86 ? vec3(1., .84, .62) : vec3(.5, .66, 1.)); }
  float oAA(vec2 q, vec2 lo, vec2 hi, vec2 fw){ vec2 a = smoothstep(lo - fw, lo + fw, q) * (1. - smoothstep(hi - fw, hi + fw, q)); return a.x * a.y; }
  float star5(vec2 p, float r){
    p += vec2(1e-4, 1.3e-4);
    float a = atan(p.x, p.y) + PI; float seg = TAU / 5.;
    a = mod(a, seg) - seg * .5; float l = length(p);
    vec2 q = l * vec2(cos(a), abs(sin(a)));
    vec2 k = vec2(cos(seg * .5), sin(seg * .5)) * r; vec2 k2 = vec2(r * .38, 0.);
    vec2 e = k - k2; vec2 w = q - k2; float h = clamp(dot(w, e) / dot(e, e), 0., 1.);
    float d = length(w - e * h); float side = e.x * w.y - e.y * w.x; return side > 0. ? -d : d;
  }
  void main(){
    vec3 n = normalize(vN);
    float mat = vB.x, u = vB.y, v = vB.z, bid = vB.w;
    float st = vS.x, fh = max(vS.y, .5), bw = max(vS.z, .3), pr = vS.w;
    vec2 fw = vec2(fwidth(u), fwidth(v)) * .75 + 1e-4;
    float hb = h12(vec2(bid * .731, 3.7));
    float grime = pn(vec3(vW.xz * .45, vW.y * .45));
    vec3 alb = vec3(.5), emi = vec3(0.); float ao = 1.;
    vec3 vdir = normalize(vW - uCam);
    float pho = bid > 299.5 ? .42 : 1.;                              // nhà trong thành phố: tường chìm vào đêm, chỉ còn cửa sổ sáng
    if (mat < .5) {                                                  // ===== mặt tường =====
      vec3 wall = (bid < 99.5 ? vec3(.54, .45, .27) : mauNha(hb)) * (.86 + .28 * grime);
      wall *= .72 + .28 * smoothstep(0., 1.6, v);
      float fl = floor(v / fh), fv = v - fl * fh;
      float bay = floor(u / bw), bu = u - bay * bw;
      // vệt ố: nước mưa chảy từ bậu cửa sổ xuống, rêu mốc loang ở chân tường (gần thì thấy, xa tự gộp)
      float gan = 1. - smoothstep(.04, .2, max(fw.x, fw.y));
      float ruou = smoothstep(.35, 1., 1. - abs(bu - bw * .5) / (bw * .32)) * smoothstep(.95, .1, fv) * (.5 + pn(vec3(u * 3.1, v * .35, bid)) ) * step(.5, st) * step(st, 1.5);
      float moc = smoothstep(.2, .6, pn(vec3(u * .35, v * .8, bid * .3)) + .5 * (1. - smoothstep(0., 2.2, v)));
      wall *= 1. - (.22 * sat(ruou) + .18 * moc) * gan;
      alb = wall;
      float far = smoothstep(.2, .6, max(fw.x / bw, fw.y / fh));
      if (st < 1.5) {                                                // 1: cửa sổ phòng có song sắt (trại, nhà quê)
        vec2 lo = vec2(bw * .5 - min(.75, bw * .3), .95), hi = vec2(bw * .5 + min(.75, bw * .3), 2.55);
        float w = oAA(vec2(bu, fv), lo, hi, fw);
        float h = h12(vec2(bay + bid * 13.1, fl + bid * 7.3));
        float lit = step(1. - pr, h);
        bool thuy = abs(bid - uThuyC.x) < .5 && abs(bay - uThuyC.y) < .5 && abs(fl - uThuyC.z) < .5;
        vec2 wc = (vec2(bu, fv) - (lo + hi) * .5) / (hi - lo);
        float ed = min(min(bu - lo.x, hi.x - bu), min(fv - lo.y, hi.y - fv));
        float frame = 1. - smoothstep(.035, .06 + fw.x, ed);
        float bars = step(.82, fract((bu - lo.x) / .25)) * (1. - smoothstep(.03, .08, fw.x));
        float hc = fract(h * 7.31);
        vec3 lc = bid < 99.5 ? (hc < .62 ? vec3(.78, .9, 1.) : hc < .85 ? vec3(1., .86, .66) : vec3(1., .66, .36)) : mauDen(hc);   // trại: đèn tuýp trắng xanh là chính
        float rem = step(.4, fract(h * 5.3));                                                // có rèm
        float remX = abs(wc.x) * 2.;
        float nep = .75 + .25 * sin(bu * 31. + h * 9.);                                     // nếp gấp của rèm
        vec3 remC = mix(vec3(.55, .62, .8), vec3(.9, .7, .6), step(.5, fract(h * 9.7)));
        vec3 sang = lc * (1.1 + .9 * fract(h * 3.17));
        sang = mix(sang, sang * remC * nep * .75, rem * smoothstep(.25, .45, remX + .2 * wc.y));
        vec3 toi = vec3(.004, .006, .011) + vec3(.016, .022, .036) * smoothstep(.7, -.4, wc.y + .3 * wc.x) + vec3(.02, .015, .01) * smoothstep(-.2, -.7, wc.y);   // kính tối: trời phản chiếu ở trên, đèn sân hắt ở dưới
        vec3 ins = lit > .5 ? sang : toi;
        if (thuy) { ins = vec3(.36, .55, 1.15) * uThuy * 1.6 * (1.25 - .55 * length(wc)) + vec3(.02, .02, .03); lc = vec3(.4, .55, 1.) * uThuy; lit = 1.; }
        emi = mix(ins * (1. - frame) * (1. - bars * .8), vec3(1., .7, .4) * pr * .7 + vec3(.003), far) * w;
        alb = mix(alb, mix(vec3(.035, .08, .065), alb * .2, far), w);
        emi += alb * lc * lit * .38 * exp(-length((vec2(bu, fv) - (lo + hi) * .5) * vec2(.8, 1.1)) * 1.5) * (1. - w) * (1. - far);
        alb *= 1. - .22 * (1. - smoothstep(0., .1 + fw.y, abs(fv - .05))) * (1. - far);
      } else if (st < 2.5) {                                         // 2: tường phòng trong hành lang, đèn trần chiếu xuống
        alb = vec3(.66, .6, .45) * (.9 + .2 * grime);
        float dI = oAA(vec2(bu, fv), vec2(.35, 0.), vec2(1.3, 2.15), fw);
        float wI = oAA(vec2(bu, fv), vec2(1.75, .95), vec2(bw - .35, 2.15), fw);
        float tI = oAA(vec2(bu, fv), vec2(.35, 2.27), vec2(1.3, 2.6), fw);
        float h = h12(vec2(bay + bid * 13.1, fl + bid * 7.3));
        float lit = step(.74, h);
        vec3 lc = mauDen(fract(h * 7.31)) * (1. + .6 * fract(h * 3.17));
        alb = mix(alb, vec3(.05, .1, .07), dI);
        alb = mix(alb, vec3(.03), clamp(wI + tI, 0., 1.));
        emi += clamp(wI + tI, 0., 1.) * (lit > .5 ? lc * .9 : vec3(.004));
        float cx = (bu - bw * .5) / bw;
        emi += alb * vec3(1., .72, .42) * pr * (.45 + 1.05 * exp(-cx * cx * 6.) * smoothstep(0., 2.6, fv)) * 1.05;
        emi = mix(emi, vec3(1., .78, .5) * (.35 * pr + .2), far);
      } else if (st < 3.5) {                                         // 3: mặt tiền nhà ống (một dãy có thể gồm nhiều căn: mỗi gian một màu sơn, đèn riêng)
        alb = mauNha(h12(vec2(bid * .731 + bay * 1.37, 3.7))) * (.86 + .28 * grime) * (.78 + .22 * smoothstep(0., 1.4, v));
        if (fl < .5) {
          float s = oAA(vec2(bu, fv), vec2(.22, 0.), vec2(bw - .22, 2.75), fw);
          float nan = mix(.78 + .22 * sin(fv * 69.8), .78, smoothstep(.015, .05, fw.y));
          float h = h12(vec2(bid + bay * 7.13, 1.7));
          float mo = step(.88, h), khe = step(.55, h) * (1. - mo);
          alb = mix(alb, mo > .5 ? vec3(.02) : vec3(.34, .35, .36) * nan, s);
          emi += s * (mo * mauDen(fract(h * 5.1)) * 1.4 + khe * vec3(1., .66, .34) * 1.6 * (1. - smoothstep(0., .1, fv)));
        } else {
          vec2 lo = vec2(bw * .16, .12), hi = vec2(bw * .84, 2.55);
          float w = oAA(vec2(bu, fv), lo, hi, fw);
          float h = h12(vec2(bid * 3.3 + bay * 5.71, fl));
          float lit = step(1. - pr, h);
          float mull = step(.9, fract((bu - lo.x) / ((hi.x - lo.x) * .25))) * (1. - smoothstep(.03, .08, fw.x));
          float rem = step(.35, abs(fract(bu * .9 + h) - .5));
          vec3 ins = lit > .5 ? mauDen(fract(h * 7.3)) * (.9 + .9 * fract(h * 3.1)) * mix(.45, 1., rem) : vec3(.004, .006, .01) + vec3(.01, .014, .022) * (1. - fv / 2.6);
          emi += mix(ins * (1. - mull), vec3(1., .72, .42) * pr * .6, far) * w;
          alb = mix(alb, vec3(.05), w);
        }
        emi += alb * vec3(1., .6, .28) * .4 * exp(-v / 3.5);          // đèn đường hắt lên tầng dưới
      } else if (st < 5.5) {                                         // 4: chung cư · 5: nhà cao tầng kính
        bool kinh = st > 4.5;
        alb *= .26;                                                  // ban đêm: tường khối nhà lớn chìm vào bóng tối, cửa sổ nổi lên
        if (kinh) alb = vec3(.03, .036, .046) * (.8 + .4 * grime);
        vec2 lo = kinh ? vec2(.12, .35) : vec2(bw * .2, .95), hi = kinh ? vec2(bw - .12, fh - .35) : vec2(bw * .8, fh - .45);
        float w = oAA(vec2(bu, fv), lo, hi, fw);
        float h = h12(vec2(bay + bid * 11.7, fl * 1.31 + bid * 5.3));
        float lit = step(1. - pr, h);
        vec3 lc = kinh ? mix(vec3(1., .86, .66), vec3(.7, .82, 1.), step(.6, fract(h * 9.1))) : mauDen(fract(h * 7.3));
        vec3 ins = lit > .5 ? lc * (.8 + .9 * fract(h * 3.7)) : vec3(.004, .006, .01);
        float band = kinh ? 0. : (1. - smoothstep(.0, .05 + fw.y, abs(fv - .9))) * .4;
        alb = mix(alb, kinh ? vec3(.02, .025, .03) : vec3(.04), w) * (1. + band);
        emi += mix(ins * (.55 + .9 * fract(h * 13.7)), lc * pr * .42, far) * mix(w, (hi.x - lo.x) * (hi.y - lo.y) / (bw * fh), far);
      } else if (st < 6.5) {                                         // 6: đầu hồi trại: hai cửa sổ nhỏ mỗi tầng
        float w = oAA(vec2(fract(u / (bw * .5)) * bw * .5, fv), vec2(bw * .25 - .45, 1.1), vec2(bw * .25 + .45, 2.3), fw);
        float h = h12(vec2(floor(u / (bw * .5)) + bid * 3.1, fl + bid));
        emi += w * (step(1. - pr, h) * vec3(1., .66, .34) * 1.2 + vec3(.003));
        alb = mix(alb, vec3(.035, .08, .065), w);
        alb *= 1. - .2 * (1. - smoothstep(0., .1 + fw.y, abs(fv - .05)));
      } else if (st < 7.5) {                                         // 7: tường hông bê tông thô, vệt nước mưa
        alb = vec3(.3, .29, .27) * (.72 + .45 * grime) * (.8 + .35 * pn(vec3(u * .9, v * .06, bid)));
      } else if (st > 10.5 && st < 11.5) {                           // 11: mặt sau nhà ống: tường thô / sơn cũ, ô cửa nhỏ mỗi tầng
        alb = mix(vec3(.3, .29, .27) * (.72 + .45 * grime), wall * .8, step(.5, hb));
        float w = oAA(vec2(bu, fv), vec2(bw * .5 - .55, 1.05), vec2(bw * .5 + .55, 2.25), fw);
        float h = h12(vec2(bid * 2.7, fl + 3.1));
        float lit = step(1. - pr, h) * step(.5, fl);
        vec3 lc = mauDen(fract(h * 7.3)) * (.9 + .8 * fract(h * 3.1));
        emi += w * mix(lit * lc + (1. - lit) * vec3(.004), vec3(1., .72, .42) * pr * .5, far);
        alb = mix(alb, vec3(.04), w);
        emi += alb * lc * lit * .3 * exp(-length((vec2(bu, fv) - vec2(bw * .5, 1.65)) * vec2(.8, 1.1)) * 1.6) * (1. - w) * (1. - far);
      }
    } else if (mat < 1.5) {                                          // ===== ngói =====
      float course = fract(v / .3), tile = fract(u / .24 + step(.5, fract(v / .6)) * .5);
      alb = vec3(.16, .066, .045) * (.75 + .35 * grime) * (.68 + .32 * smoothstep(.0, .25, course)) * (.84 + .16 * smoothstep(.0, .12, tile));
      alb = mix(alb, vec3(.07, .08, .06), smoothstep(.3, .7, pn(vec3(vW.xz * .08, 3.3))) * .45);
    } else if (mat < 2.5) {                                          // ===== gờ, cột, viền =====
      alb = (bid < 99.5 ? vec3(.7, .65, .52) : vec3(.62, .62, .6)) * (.85 + .25 * grime);
    } else if (mat < 3.5) {                                          // ===== nền bê tông =====
      alb = vec3(.13, .128, .122) * (.75 + .5 * grime);
      vec2 j = abs(fract(vec2(u, v) / 3.) - .5);
      alb *= 1. - .18 * (1. - smoothstep(.0, .02 + fwidth(u) * .5, min(j.x, j.y))) * (1. - smoothstep(.05, .2, fwidth(u)));
    } else if (mat < 4.5) {                                          // ===== sân điều lệnh: kẻ vạch trắng =====
      alb = vec3(.13, .13, .125) * (.78 + .44 * grime) * (.85 + .3 * pn(vec3(vW.xz * .6, 4.1)));
      float lw = .07 + fwidth(u) * .7;
      float ln = 1. - smoothstep(lw * .5, lw, min(abs(abs(u) - 23.4), min(abs(v - 14.6), abs(v - 35.4))));
      ln = max(ln, (1. - smoothstep(lw * .5, lw, abs(u))) * step(15., v) * step(v, 35.));
      ln = max(ln, 1. - smoothstep(lw * .5, lw, abs(length(vec2(u, v - 25.)) - 3.2)));
      vec2 g = abs(fract(vec2(u / 1.6, (v - 15.) / 2.2)) - .5) * vec2(1.6, 2.2);
      ln = max(ln, (1. - smoothstep(.08, .08 + lw, max(g.x, g.y))) * step(17., v) * step(v, 33.) * step(abs(u), 20.) * step(3.8, length(vec2(u, v - 25.))));
      ln *= 1. - smoothstep(.06, .25, fwidth(u));
      alb = mix(alb, vec3(.42, .42, .4), ln * .8);
    } else if (mat < 5.5) {                                          // ===== lan can =====
      float fv = v - floor(v / max(fh, .5)) * max(fh, .5);
      if (bid < 99.5) {                                              // trại: con tiện bê tông, khe hở thấy hành lang sáng đèn
        alb = vec3(.7, .64, .5) * (.88 + .2 * grime);
        float gp = smoothstep(.3, .36, fract(u / .24)) * (1. - smoothstep(.64, .7, fract(u / .24))) * step(.16, fv) * step(fv, .86);
        gp *= 1. - smoothstep(.04, .1, fwidth(u));
        alb = mix(alb, vec3(.02), gp);
        emi += gp * vec3(1., .78, .5) * .55 + vec3(1., .78, .5) * .1 * smoothstep(.05, .1, fwidth(u));
      } else {                                                       // nhà dân: lan can sắt sơn
        alb = vec3(.09, .09, .1);
        float bar = step(.78, fract(u / .14)) * (1. - smoothstep(.03, .08, fwidth(u)));
        alb = mix(alb * .5, vec3(.25, .25, .27), bar);
      }
    } else if (mat < 6.5) {                                          // ===== sắt =====
      alb = vec3(.1, .1, .11);
      float sp = pow(max(dot(reflect(vdir, n), uMoonL), 0.), 24.);
      emi += vec3(.25, .3, .4) * sp * .5;
    } else if (mat < 7.5) {                                          // ===== mái bằng =====
      alb = vec3(.16, .16, .15) * (.75 + .5 * grime) * (.85 + .3 * pn(vec3(vW.xz * .3, 1.9)));
    } else if (mat < 8.5) {                                          // ===== trần hành lang, bóng đèn =====
      alb = vec3(.7, .66, .55);
      vec2 q = vec2(u - bw * .5, v - 1.1);
      float r2 = dot(q, q);
      emi += pr * (vec3(1., .88, .66) * 9. * exp(-r2 / .006) + alb * vec3(1., .8, .55) * 1.3 * exp(-r2 * .35));
    } else if (mat < 9.5) {                                          // ===== inox =====
      alb = vec3(.45, .47, .5);
      float sp = pow(max(dot(reflect(vdir, n), uMoonL), 0.), 18.);
      emi += vec3(.35, .4, .5) * sp * .7;
    } else if (mat < 10.5) {                                         // ===== mặt phát sáng: chao đèn, biển hiệu, viền đỉnh nhà =====
      float h = h12(vec2(bid * 1.9, floor(u * .2) + 4.1));
      vec3 c = pr < .5 ? vec3(1., .82, .6) * 6. : (pr < 1.5 ? (h < .3 ? vec3(1., .2, .15) : h < .55 ? vec3(.2, .5, 1.) : h < .75 ? vec3(.2, 1., .5) : vec3(1., .9, .7)) * 2.4 * step(.25, h12(vec2(bid, 9.7))) : vec3(.7, .85, 1.) * 3.);
      alb = vec3(.05); emi += c;
    } else if (mat < 11.5) {                                         // ===== huy hiệu: ngôi sao vàng trên nền đỏ, viền vàng =====
      vec2 p = vec2(u, v);
      float r = length(p);
      alb = r < .82 ? vec3(.62, .04, .03) : vec3(.75, .58, .12);
      if (star5(p, .58) < 0.) alb = vec3(.95, .78, .08);
      if (r > 1.) alb = vec3(.6, .47, .24);
      emi += alb * .55;
    } else if (mat < 12.5) {                                         // ===== bờ cây, bồn hoa =====
      float lf = pn(vec3(vW * 2.3)) * .5 + pn(vec3(vW * 7.1)) * .35;
      alb = mix(vec3(.022, .045, .022), vec3(.05, .09, .04), .5 + lf);
      float hf = h12(floor(vW.xz * 11.) + floor(vW.y * 11.) * 1.7);
      if (st > .5 && hf > .93) alb = mix(alb, mix(vec3(.26, .06, .09), vec3(.34, .2, .24), fract(hf * 13.)), .7 * (1. - smoothstep(.02, .06, fwidth(vW.x))));
    } else if (mat < 13.5) {                                         // ===== mặt đường nhựa =====
      alb = vec3(.036, .036, .038) * (.8 + .35 * grime);
      float fu = fwidth(v) + .01;
      float dash = (1. - smoothstep(.06, .06 + fu, abs(v))) * step(fract(u / 9.), .4) * pr;
      alb = mix(alb, vec3(.45, .44, .4), dash * (1. - smoothstep(.1, .5, fu)));
    } else if (mat < 14.5) {                                         // ===== dải kính cầu thang sáng đèn =====
      vec2 g = abs(fract(vec2(u / .2, v / .2)) - .5);
      float vua = step(.42, max(g.x, g.y)) * (1. - smoothstep(.02, .06, fwidth(u)));
      alb = vec3(.05);
      emi += vec3(.85, .9, 1.) * .8 * (1. - .55 * vua) * (1. - .3 * (1. - smoothstep(.0, .25, abs(fract(v / 3.4) - .08))));
    } else {                                                         // ===== mái tôn =====
      vec3 c = hb < .4 ? vec3(.12, .2, .38) : hb < .7 ? vec3(.36, .1, .07) : vec3(.3, .31, .32);
      alb = c * (.8 + .2 * sin(u * 31.4)) * (.8 + .3 * grime);
    }
    float shD = bongDong(vW, n);
    alb *= pho;
    vec3 col = alb * anhTrang(n, ao, bongTrang(vW, n), shD);
    col += alb * denTrai(vW, n);
    col += alb * dongDom(vW, n, shD) * 2.;
    vec3 fc; float f = suongF(vW, fc);
    col = mix(col, fc, f) + emi * (1. - f * .8);
    if (!(dot(col, col) < 1e8)) col = vec3(0.);
    gl_FragColor = vec4(col, 1.);
  }`;
  // lá cờ: tấm vải lưới mịn, sóng gió chạy từ cán ra mép (đỉnh), cuộn nhẹ; đèn rọi từ chân bục
  const CO_V = `
  uniform vec3 uCoO, uCoX, uCoN; uniform vec2 uCoS; uniform float uGio;   // uGio: gió giật từ chỗ va chạm
  varying vec2 vF; varying vec3 vW; varying vec3 vNn;
  float song(float s, float t){
    float T = uS, g = 1. + 1.7 * uGio;
    return pow(s, 1.15) * g * (.23 * sin(TAU * (1.05 * s - .52 * T * (1. + uGio)) + .5 * t) + .07 * sin(TAU * (2.3 * s - 1.13 * T) + 1.4 * t + 1.) + .03 * g * sin(TAU * (4.1 * s - 1.9 * T * (1. + uGio)) + 2.2 * t));
  }
  void main(){
    float s = uv.x, t = 1. - uv.y;
    float w = song(s, t);
    vec3 Y = vec3(0., 1., 0.);
    vec3 p = uCoO + uCoX * (s * uCoS.x - .035 * s * s * uCoS.x) - Y * (t * uCoS.y + .06 * s * s) + uCoN * w;
    float e = .01;
    float dws = (song(s + e, t) - song(s - e, t)) / (2. * e), dwt = (song(s, t + e) - song(s, t - e)) / (2. * e);
    vec3 ds = uCoX * uCoS.x - Y * (.12 * s) + uCoN * dws;
    vec3 dt = -Y * uCoS.y + uCoN * dwt;
    vNn = normalize(cross(ds, dt));
    vF = vec2(s, t); vW = p;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  }`;
  const CO_F = `
  uniform vec3 uCoSpot; uniform vec2 uCoS;
  varying vec2 vF; varying vec3 vW; varying vec3 vNn;
  float star5(vec2 p, float r){
    p += vec2(1e-4, 1.3e-4);
    float a = atan(p.x, p.y) + PI; float seg = TAU / 5.;
    a = mod(a, seg) - seg * .5; float l = length(p);
    vec2 q = l * vec2(cos(a), abs(sin(a)));
    vec2 k = vec2(cos(seg * .5), sin(seg * .5)) * r; vec2 k2 = vec2(r * .38, 0.);
    vec2 e = k - k2; vec2 w = q - k2; float h = clamp(dot(w, e) / dot(e, e), 0., 1.);
    float d = length(w - e * h); float side = e.x * w.y - e.y * w.x; return side > 0. ? -d : d;
  }
  void main(){
    vec3 n = normalize(vNn);
    vec3 vd = normalize(uCam - vW);
    if (dot(n, vd) < 0.) n = -n;
    vec2 p = vec2((vF.x - .5) * uCoS.x, (.5 - vF.y) * uCoS.y);
    float sd = star5(p, uCoS.x * .2);
    float aa = fwidth(sd) + 1e-4;
    vec3 alb = mix(vec3(.62, .02, .015), vec3(1., .78, .02), 1. - smoothstep(-aa, aa, sd));
    // vải: sợi dệt rất mịn, nếp gấp tối hơn
    alb *= .92 + .08 * sin(vF.x * 900.) * sin(vF.y * 600.);
    float shD = bongDong(vW, n);
    vec3 col = alb * anhTrang(n, 1., bongTrang(vW, n), shD) * .8;
    vec3 ld = uCoSpot - vW; float d2 = dot(ld, ld); ld *= inversesqrt(d2);
    float sp = max(dot(n, ld), 0.) + .35 * max(-dot(n, ld), 0.);       // vải mỏng: ánh đèn xuyên qua mặt sau
    col += alb * vec3(1., .86, .7) * sp * 190. / (d2 + 20.);
    col += alb * dongDom(vW, n, shD) * 2.;
    vec3 hh = normalize(ld + vd);
    col += vec3(1., .8, .6) * pow(max(dot(n, hh), 0.), 18.) * .06 * 190. / (d2 + 20.);
    vec3 fc; float f = suongF(vW, fc);
    col = mix(col, fc, f);
    if (!(dot(col, col) < 1e8)) col = vec3(0.);
    gl_FragColor = vec4(col, 1.);
  }`;
  // đốm sáng: đèn đường, bóng hành lang, đèn báo máy bay, đèn xe (cỡ quầng theo mét, mờ dần trong sương)
  const SANG_V = `
  attribute vec4 aC; attribute float aBl;
  varying vec3 vC;
  uniform float uPx;
  void main(){
    vec4 mv = viewMatrix * vec4(position, 1.);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, .5);
    vec3 fc; float f = suongF(position, fc);
    float bl = aBl > 0. ? (.12 + .88 * step(.55, fract(uS * .7 + aBl))) : 1.;
    float px = aC.w * uPx * 600. / dist;
    vC = aC.rgb * bl * (1. - f * .72) * min(1., px / 2.2);
    gl_PointSize = clamp(px, 2.2, 90.);
  }`;
  const SANG_F = `varying vec3 vC; void main(){ float r = length(gl_PointCoord - .5) * 2.; if (r > 1.) discard; float a = exp(-r * r * 16.) * 2.4 + exp(-r * 4.2) * .32; gl_FragColor = vec4(vC * a * (1. - r * r), 1.); }`;
  // vũng sáng đèn đường in xuống mặt đất / mặt đường
  const VUNG_V = `attribute vec4 aD; attribute vec3 aCol; varying vec4 vD; varying vec3 vCol; varying vec3 vW;
  void main(){ vD = aD; vCol = aCol; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
  const VUNG_F = `varying vec4 vD; varying vec3 vCol; varying vec3 vW;
  void main(){ float r2 = dot(vD.xy, vD.xy); if (r2 > 1.) discard; float a = exp(-r2 * 3.6) * (1. - r2) * (.85 + .3 * pn(vec3(vW.xz * .7, 2.))) * .38; vec3 fc; float f = suongF(vW, fc); gl_FragColor = vec4(vCol * vD.z * a * (1. - f), 1.); }`;

  // ---------- dựng toàn bộ ----------
  SN.dat.dungNha = function (T, U) {
    const hDat = SN.dat.hDat;
    G = { P: [], N: [], B: [], S: [] };
    const sang = [];          // đốm sáng: [x, y, z, r, g, b, cỡ, nhấp nháy]
    const vung = [];          // vũng sáng: [x, z, bán kính, r, g, b, cường độ]
    const cay = [];           // cây thêm: [x, z, cao, ô ảnh]
    const lampsL = [];        // đèn chiếu sáng thật trong trại (tối đa 8)
    const AM = [1, 0.66, 0.36], TRANG = [1, 0.86, 0.66];

    // ======================= DOANH TRẠI =======================
    const TR = { x: 34, z: -142, rot: -11 * D2R };
    TR.y = hDat(TR.x, TR.z);
    const tC = khung(TR.x, TR.y, TR.z, TR.rot);
    const GN = 0.45;                                   // mặt nền nhà cao hơn mặt sân
    const denCot = (x, z, h, I, sang2, pool) => {      // cột đèn trong trại
      BID = 14; kieu(8, 3, 3, 0);
      const t = con(tC, x, 0, z, 0);
      hop(t, -0.07, 0.07, -0.3, h, -0.07, 0.07, all(M_SAT));
      hop(t, -0.07, 0.07, h - 0.08, h, 0.07, 0.55, all(M_SAT));
      kieu(8, 3, 3, 0); hop(t, -0.2, 0.2, h - 0.2, h - 0.02, 0.4, 0.75, { f: M_SAT, b: M_SAT, l: M_SAT, r: M_SAT, t: M_SAT, d: M_PHAT });
      const p = t(0, h - 0.25, 0.58);
      sang.push([p[0], p[1], p[2], 1, 0.8, 0.55, 1.1 * (sang2 || 1), 0]);
      if (pool !== false) vung.push([p[0], p[2], 6.5 * (sang2 || 1), 1, 0.66, 0.36, 0.5 * (sang2 || 1)]);
      if (I) lampsL.push([p[0], p[1], p[2], I]);
    };
    // --- dãy sau: 5 tầng, 15 gian, cửa sổ phòng nhìn ra vườn; khối cầu thang giữa có dải kính sáng và ngôi sao ---
    const bulbs = [];
    {
      BID = 1;
      const t = con(tC, 0, GN, -31.5, 0), Lh = 27, Dh = 5.5, fl = 5, fh = 3.4, H = fl * fh;
      kieu(8, fh, 3.6, 0); hop(t, -Lh - 0.3, Lh + 0.3, -GN - 0.6, 0, -Dh - 0.3, Dh + 0.4, { f: M_NEN, b: M_NEN, l: M_NEN, r: M_NEN, t: M_NEN });
      kieu(1, fh, 3.6, 0.15); hop(t, -Lh, Lh, 0, H, -Dh, Dh, { f: M_TUONG });
      kieu(1, fh, 3.6, 0.1); hop(t, -Lh, Lh, 0, H, -Dh, Dh, { b: M_TUONG });
      kieu(6, fh, 2 * Dh, 0.25); hop(t, -Lh, Lh, 0, H, -Dh, Dh, { l: M_TUONG, r: M_TUONG });
      kieu(8, fh, 3.6, 0);
      for (let k = 1; k <= fl; k++) hop(t, -Lh - 0.12, Lh + 0.12, k * fh - 0.17, k * fh - 0.02, -Dh - 0.12, Dh + 0.12, { f: M_VIEN, b: M_VIEN, l: M_VIEN, r: M_VIEN, d: M_VIEN });
      hop(t, -1.8, 1.8, 0, H + 2.4, Dh, Dh + 0.9, { f: M_TUONG, l: M_TUONG, r: M_TUONG, t: M_VIEN });
      hop(t, -0.55, 0.55, 1.1, H - 0.5, Dh + 0.9, Dh + 0.95, { f: M_KINH });
      // huy hiệu ngôi sao trên đỉnh khối cầu thang
      { const a = t(-0.85, H + 0.45, Dh + 0.95), b = t(0.85, H + 0.45, Dh + 0.95), c = t(0.85, H + 2.15, Dh + 0.95), d = t(-0.85, H + 2.15, Dh + 0.95); quad(a, b, c, d, M_SAO, [[-1, -1], [1, -1], [1, 1], [-1, 1]]); }
      hop(t, -2.8, 2.8, 2.85, 3.1, Dh + 0.9, Dh + 2.8, { f: M_VIEN, l: M_VIEN, r: M_VIEN, t: M_MAIBANG, d: M_VIEN });     // mái đón sảnh
      hop(t, -2.6, -2.4, 0, 2.85, Dh + 2.5, Dh + 2.7, all(M_VIEN)); hop(t, 2.4, 2.6, 0, 2.85, Dh + 2.5, Dh + 2.7, all(M_VIEN));
      maiNgoi(t, -Lh - 0.2, Lh + 0.2, -Dh - 0.2, Dh + 0.2, H + 0.06, 0.8, 0.62);
      TR.thuy = t(-Lh + 3.6 * 10 + 1.8, 2 * fh + 1.75, Dh + 0.05);
      TR.thuyN = (() => { const a = t(0, 0, 0), b = t(0, 0, 1); return [b[0] - a[0], 0, b[2] - a[2]]; })();
      // đèn hắt ngôi sao + đèn sảnh
      const s1 = t(0, H + 0.2, Dh + 2.0); sang.push([s1[0], s1[1], s1[2], 1, 0.85, 0.65, 0.35, 0]);
      const s2 = t(0, 2.75, Dh + 2.2); sang.push([s2[0], s2[1], s2[2], 1, 0.86, 0.66, 0.6, 0]); vung.push([s2[0], s2[2], 6, 1, 0.8, 0.55, 0.45]);
    }
    // --- hai dãy cánh: 4 tầng, hành lang quay vào vườn, đèn trần từng gian ---
    function canh(ox, oz, rot, bid, dau) {
      BID = bid;
      const t = con(tC, ox, GN, oz, rot), Lh = 21, Dh = 5, fl = 4, fh = 3.4, H = fl * fh, cw = 2.2, zr = Dh - cw, nb = 12, bw = 2 * Lh / nb;
      kieu(8, fh, bw, 0); hop(t, -Lh - 0.3, Lh + 0.3, -GN - 0.6, 0, -Dh - 0.3, Dh + 0.5, { f: M_NEN, b: M_NEN, l: M_NEN, r: M_NEN, t: M_NEN });
      kieu(1, fh, bw, 0.12); hop(t, -Lh, Lh, 0, H, -Dh, zr, { b: M_TUONG });
      kieu(6, fh, 2 * Dh, 0.2); hop(t, -Lh - 0.25, -Lh, 0, H, -Dh, Dh, { l: M_TUONG }); hop(t, Lh, Lh + 0.25, 0, H, -Dh, Dh, { r: M_TUONG });
      kieu(8, fh, bw, 0); hop(t, -Lh - 0.25, -Lh, 0, H, -Dh, Dh, { f: M_VIEN }); hop(t, Lh, Lh + 0.25, 0, H, -Dh, Dh, { f: M_VIEN });
      for (let k = 0; k < fl; k++) {
        for (let j = 0; j < nb; j++) {
          const on = rnd() < 0.84 ? 1 : 0, x0 = -Lh + j * bw, x1 = x0 + bw;
          // tường phòng trong hành lang (một gian một tầng, để biết bóng đèn gian đó bật hay tắt)
          kieu(2, fh, bw, on);
          quad(t(x0, k * fh, zr), t(x1, k * fh, zr), t(x1, (k + 1) * fh, zr), t(x0, (k + 1) * fh, zr), M_TUONG, [[x0 + Lh, k * fh], [x1 + Lh, k * fh], [x1 + Lh, (k + 1) * fh], [x0 + Lh, (k + 1) * fh]]);
          // trần hành lang
          const yc = (k + 1) * fh - 0.18;
          kieu(10, fh, bw, on);
          quad(t(x0, yc, zr), t(x1, yc, zr), t(x1, yc, Dh + 0.08), t(x0, yc, Dh + 0.08), M_TRAN, [[0, 0], [bw, 0], [bw, cw], [0, cw]]);
          if (on) bulbs.push(t(x0 + bw / 2, yc - 0.08, zr + 1.1));
        }
        kieu(8, fh, bw, 0);
        hop(t, -Lh, Lh, (k + 1) * fh - 0.18, (k + 1) * fh, zr, Dh + 0.08, { f: M_VIEN, t: M_NEN });
        if (k < fl - 1) { kieu(8, fh, bw, 0); hop(t, -Lh, Lh, (k + 1) * fh, (k + 1) * fh + 1.05, Dh - 0.12, Dh + 0.04, { f: M_LANCAN, b: M_LANCAN, t: M_VIEN }); }
      }
      kieu(8, fh, bw, 0);
      for (let j = 0; j <= nb; j++) { const x = -Lh + j * bw; hop(t, x - 0.18, x + 0.18, 0, H, Dh - 0.32, Dh + 0.1, { f: M_VIEN, l: M_VIEN, r: M_VIEN }); }
      maiNgoi(t, -Lh - 0.25, Lh + 0.25, -Dh, Dh + 0.1, H + 0.06, 0.8, 0.62);
      // cầu thang ngoài ở đầu hồi phía vườn: khối nhô có ô thoáng sáng
      const xa = dau < 0 ? -Lh - 3.2 : Lh + 0.25, xb = dau < 0 ? -Lh - 0.25 : Lh + 3.2, xm = (xa + xb) / 2;
      kieu(8, fh, bw, 0); hop(t, xa, xb, -GN - 0.4, H + 1.0, Dh - 3.0, Dh + 0.1, { f: M_TUONG, l: M_TUONG, r: M_TUONG, t: M_VIEN, b: M_TUONG });
      hop(t, xm - 0.45, xm + 0.45, 1.5, H - 0.4, Dh + 0.1, Dh + 0.14, { f: M_KINH });
    }
    canh(-36, -9, Math.PI / 2, 2, -1);
    canh(36, -9, -Math.PI / 2, 3, 1);
    // --- sân điều lệnh, đường nội bộ, lối vườn ---
    BID = 10; kieu(8, 3, 3, 0);
    hop(tC, -24, 24, -0.6, 0.3, 14, 36, { t: M_SAN, f: M_NEN, l: M_NEN, r: M_NEN, b: M_NEN });
    const nen = (x0, x1, z0, z1) => hop(tC, x0, x1, -0.6, 0.27, z0, z1, { t: M_NEN, f: M_NEN, b: M_NEN, l: M_NEN, r: M_NEN });
    nen(-30, 30, 10, 14); nen(-30, 30, 36, 40); nen(-30, -24, 14, 36); nen(24, 30, 14, 36);
    nen(-3.5, 3.5, 40, 53);
    nen(-28, 28, -26.2, -23.4);
    nen(-31.2, -28, -26.2, 10); nen(28, 31.2, -26.2, 10);
    nen(-1.5, 1.5, -23.4, 10); nen(-28, 28, -9.6, -6.6);
    // --- vườn trong: bờ cây xén, bồn hoa giữa, cây bóng mát, đèn vườn ---
    BID = 11;
    const bo = (x0, x1, z0, z1, hoa) => { kieu(8, 3, 3, hoa ? 1 : 0); ST[0] = hoa ? 1 : 0; hop(tC, x0, x1, 0, 0.62, z0, z1, all(M_CAY)); };
    for (const sx of [-1, 1]) {
      bo(sx > 0 ? 2.2 : -27, sx > 0 ? 27 : -2.2, -10.4, -9.9, false); bo(sx > 0 ? 2.2 : -27, sx > 0 ? 27 : -2.2, -6.3, -5.8, false);
      bo(sx * 2.2 - (sx > 0 ? 0 : 0.5), sx * 2.2 + (sx > 0 ? 0.5 : 0), -22.6, -10.4, false); bo(sx * 2.2 - (sx > 0 ? 0 : 0.5), sx * 2.2 + (sx > 0 ? 0.5 : 0), -5.8, 9.5, false);
      bo(sx > 0 ? 8 : -20, sx > 0 ? 20 : -8, -20, -17.5, true); bo(sx > 0 ? 8 : -20, sx > 0 ? 20 : -8, 3, 5.5, true);
      for (const z of [-15.5, -1.5, 7]) for (const xx of [17, 24.5]) { const p = tC(sx * xx + (rnd() - 0.5) * 1.2, 0, z + (rnd() - 0.5) * 2); cay.push([p[0], p[2], 8.5 + rnd() * 3.5, [0, 1, 3][Math.floor(rnd() * 3)]]); }
    }
    { // bồn hoa tròn giữa vườn (bát giác)
      kieu(1, 3, 3, 1); ST[0] = 1;
      const N = 10, r = 3.2, c = [0, -8.1];
      for (let i = 0; i < N; i++) {
        const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
        const p = (a, y, rr) => tC(c[0] + Math.sin(a) * rr, y, c[1] + Math.cos(a) * rr);
        quad(p(a0, 0, r), p(a1, 0, r), p(a1, 0.55, r), p(a0, 0.55, r), M_CAY, [[0, 0], [1, 0], [1, 1], [0, 1]]);
        tri(p(a0, 0.75, 0.01), p(a0, 0.55, r), p(a1, 0.55, r), [0, 0], [1, 0], [1, 1], M_CAY);
      }
    }
    // --- bục cờ, cột cờ ---
    BID = 13; kieu(8, 3, 3, 0);
    hop(tC, -3.2, 3.2, -0.3, 0.42, 36.8, 43.2, all(M_VIEN)); hop(tC, -2.4, 2.4, 0.42, 0.78, 37.6, 42.4, all(M_VIEN)); hop(tC, -1.6, 1.6, 0.78, 1.14, 38.4, 41.6, all(M_VIEN));
    hop(tC, -0.09, 0.09, 1.14, 16, 39.91, 40.09, all(M_SAT));
    hop(tC, -0.17, 0.17, 16, 16.34, 39.83, 40.17, all(M_INOX));
    const coO = tC(-0.09, 15.85, 40.0), coX = (() => { const a = tC(0, 0, 0), b = tC(-1, 0, 0); return [b[0] - a[0], 0, b[2] - a[2]]; })(), coN = (() => { const a = tC(0, 0, 0), b = tC(0, 0, 1); return [b[0] - a[0], 0, b[2] - a[2]]; })();
    const coSpot = tC(0.4, 1.3, 43.4);
    sang.push([coSpot[0], coSpot[1], coSpot[2], 0.5, 0.45, 0.38, 0.12, 0]);
    // --- đèn trại ---
    denCot(-26.2, 13, 6.5, 1.0, 1.2); denCot(26.2, 13, 6.5, 1.0, 1.2); denCot(-26.2, 37, 6.5, 1.0, 1.2); denCot(26.2, 37, 6.5, 1.0, 1.2);
    denCot(-13, -8.1, 4.2, 0.7, 0.9); denCot(13, -8.1, 4.2, 0.7, 0.9);
    denCot(-13, 7.5, 4.2, 0, 0.8); denCot(13, 7.5, 4.2, 0, 0.8); denCot(0, -20, 4.2, 0, 0.8);
    denCot(-29.6, -18, 4.6, 0, 0.8); denCot(29.6, -18, 4.6, 0, 0.8);
    // --- tường rào, cổng có ngôi sao, chòi gác ---
    BID = 12;
    const RR = 49.6;
    for (let a = -62; a < 62; a += 3.1) {
      if (Math.abs(a + 1.55) < 7.6) continue;
      const a0 = a * D2R, a1 = (a + 3.1) * D2R;
      const p0 = [Math.sin(a0) * RR, Math.cos(a0) * RR], p1 = [Math.sin(a1) * RR, Math.cos(a1) * RR];
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const t = con(tC, (p0[0] + p1[0]) / 2, 0, (p0[1] + p1[1]) / 2, (a + 1.55) * D2R);
      kieu(8, 3, 3, 0); hop(t, -len / 2, len / 2, -0.8, 2.0, -0.11, 0.11, { f: M_TUONG, b: M_TUONG, t: M_VIEN });
      hop(t, len / 2 - 0.22, len / 2 + 0.22, -0.8, 2.35, -0.22, 0.22, all(M_VIEN));
    }
    {
      const ga = 7.6 * D2R;
      for (const sx of [-1, 1]) {
        const t = con(tC, sx * Math.sin(ga) * RR, 0, Math.cos(ga) * RR, 0);
        kieu(8, 3, 3, 0); hop(t, -0.55, 0.55, -0.6, 4.4, -0.55, 0.55, all(M_TUONG)); hop(t, -0.7, 0.7, 4.4, 4.7, -0.7, 0.7, all(M_VIEN));
        const p = t(0, 5.0, 0); sang.push([p[0], p[1], p[2], 1, 0.84, 0.6, 1.0, 0]); vung.push([p[0], p[2], 8, 1, 0.7, 0.4, 0.45]);
      }
      const zc = Math.cos(ga) * RR, xw = Math.sin(ga) * RR;
      kieu(8, 3, 3, 0); hop(tC, -xw - 0.5, xw + 0.5, 3.5, 4.25, zc - 0.28, zc + 0.28, all(M_TUONG));
      hop(tC, -xw - 0.5, xw + 0.5, 4.25, 4.4, zc - 0.34, zc + 0.34, all(M_VIEN));
      { const a = tC(-0.62, 3.25, zc + 0.3), b = tC(0.62, 3.25, zc + 0.3), c = tC(0.62, 4.49, zc + 0.3), d = tC(-0.62, 4.49, zc + 0.3); quad(a, b, c, d, M_SAO, [[-1, -1], [1, -1], [1, 1], [-1, 1]]); }
      // chòi gác: cửa sổ sáng
      BID = 15; const tg = con(tC, 9.5, 0.2, zc - 4.0, -0.15);
      kieu(1, 2.9, 2.6, 1.0); hop(tg, -1.3, 1.3, 0, 2.9, -1.3, 1.3, { f: M_TUONG, l: M_TUONG, r: M_TUONG, b: M_TUONG });
      kieu(8, 3, 3, 0); hop(tg, -1.6, 1.6, 2.9, 3.15, -1.6, 1.6, { f: M_VIEN, b: M_VIEN, l: M_VIEN, r: M_VIEN, t: M_MAIBANG, d: M_VIEN });
      const pg = tg(0, 2.6, 1.5); sang.push([pg[0], pg[1], pg[2], 1, 0.82, 0.58, 0.5, 0]); vung.push([pg[0], pg[2], 5, 1, 0.72, 0.42, 0.4]);
    }
    // cây quanh trại (ngoài tường), tre bên sườn
    for (let k = 0; k < 16; k++) { const a = (-150 + k * 20 + rnd() * 8) * D2R, rr = 46 + rnd() * 3; if (Math.cos(a) > 0.55) continue; const p = tC(Math.sin(a) * rr, 0, Math.cos(a) * rr); cay.push([p[0], p[2], 10 + rnd() * 5, rnd() < 0.6 ? 3 : 0]); }
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) { const p = tC(sx * (33 + k * 5), 0, 24 + k * 6); cay.push([p[0], p[2], 9 + rnd() * 3, 1]); }
    // ánh sáng thật trong trại: 8 đèn mạnh nhất
    lampsL.sort((a, b) => b[3] - a[3]);
    while (lampsL.length < 8) lampsL.push([0, -999, 0, 0]);
    lampsL.length = 8;
    // bóng đèn hành lang → đốm sáng
    for (const b of bulbs) sang.push([b[0], b[1], b[2], 1, 0.8, 0.52, 0.5, 0]);

    // ======================= ĐƯỜNG =======================
    const gateOut = tC(0, 0, 52), g2 = tC(0, 0, 60), g3 = tC(-5, 0, 67);
    const DUONG_TRAI = resample([[gateOut[0], gateOut[2]], [g2[0], g2[2]], [g3[0], g3[2]], [6, -76], [-10, -69], [-36, -63], [-70, -67], [-106, -86], [-150, -106]], 4);
    const DUONG_A = resample([[-330, 20], [-250, -55], [-190, -85], [-150, -106], [-126, -140], [-113, -185], [-108, -230], [-118, -275], [-100, -330], [-60, -385], [0, -420], [60, -446]], 4);
    BID = 40; duong(DUONG_TRAI, 4.2, 0); duong(DUONG_A, 6.5, 1);
    // đèn dọc đường
    const denDuong = (R, every, side, h, col, sz, pool) => {
      let acc = 0, next = every * 0.5, k = 0;
      for (let i = 0; i < R.length - 1; i++) {
        const a = R[i], b = R[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        while (next <= acc + l) {
          const f = (next - acc) / l, x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
          const nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l, sd = side === 0 ? (k % 2 ? 1 : -1) : side;
          const px = x + nx * sd * 4, pz = z + nz * sd * 4, py = hDat(px, pz) + h;
          sang.push([px, py, pz, col[0], col[1], col[2], sz, 0]);
          if (pool) vung.push([px - nx * sd * 1.5, pz - nz * sd * 1.5, pool * 0.7, col[0], col[1] * 0.85, col[2] * 0.7, 0.55]);
          if (h < 9) { BID = 41; kieu(8, 3, 3, 0); const t = khung(px, hDat(px, pz) - 0.3, pz, 0); hop(t, -0.07, 0.07, 0, h + 0.3, -0.07, 0.07, all(M_SAT)); }
          next += every; k++;
        }
        acc += l;
      }
    };
    denDuong(DUONG_TRAI, 17, -1, 6, [1, 0.62, 0.3], 1.0, 9);
    denDuong(DUONG_A, 27, 0, 7, [1, 0.6, 0.28], 1.1, 10);

    // ======================= XÓM PHỐ (nhà ống dọc đường A) =======================
    let nId = 100;
    const placed = [];
    function nhaOng(fx, fz, rot, w, d, fl) {
      BID = nId++;
      const fh = 3.3, H = fl * fh;
      // độ cao nền: cao nhất dưới chân nhà (khỏi bị đất lấp), móng kéo xuống chỗ thấp nhất
      const t0 = khung(fx, 0, fz, rot);
      const cs = [t0(-w / 2, 0, 0), t0(w / 2, 0, 0), t0(-w / 2, 0, -d), t0(w / 2, 0, -d)].map((p) => hDat(p[0], p[2]));
      const by = Math.max(...cs) + 0.2, low = Math.min(...cs) - 0.6;
      const t = khung(fx, by, fz, rot);
      const lp = 0.22 + rnd() * 0.25;
      kieu(7, fh, w, 0); hop(t, -w / 2, w / 2, low - by, 0, -d, 0.6, { f: M_NEN, l: M_TUONG, r: M_TUONG, b: M_TUONG, t: M_NEN });
      kieu(3, fh, w, lp); hop(t, -w / 2, w / 2, 0, H, -d, 0, { f: M_TUONG });
      kieu(7, fh, w, 0); hop(t, -w / 2, w / 2, 0, H, -d, 0, { l: M_TUONG, r: M_TUONG });
      kieu(11, fh, w, 0.18 + rnd() * 0.25); hop(t, -w / 2, w / 2, 0, H, -d, 0, { b: M_TUONG });
      for (let k = 1; k < fl; k++) {
        kieu(8, fh, w, 0); hop(t, -w / 2 + 0.1, w / 2 - 0.1, k * fh - 0.16, k * fh, 0, 0.95, { f: M_VIEN, t: M_NEN, d: M_VIEN, l: M_VIEN, r: M_VIEN });
        kieu(3, fh, w, 0); hop(t, -w / 2 + 0.1, w / 2 - 0.1, k * fh, k * fh + 1.0, 0.86, 0.95, { f: M_LANCAN, l: M_LANCAN, r: M_LANCAN, t: M_SAT });
      }
      kieu(8, fh, w, 0); maiBang(t, -w / 2, w / 2, -d, 0, H, 0.85);
      if (rnd() < 0.85) bonNuoc(t, (rnd() - 0.5) * (w - 2), H, -d + 1.6, 0.48, 1.5, Math.PI / 2 * (rnd() < 0.5 ? 0 : 1));
      if (rnd() < 0.45) { kieu(7, 2.6, 3, 0); hop(t, -w / 2 + 0.3, -w / 2 + 0.3 + Math.min(3, w - 0.6), H, H + 2.5, -d + 3.2, -d + 6.2, { f: M_TUONG, l: M_TUONG, r: M_TUONG, b: M_TUONG }); kieu(8, 3, 3, 0); hop(t, -w / 2 + 0.1, -w / 2 + 0.5 + Math.min(3, w - 0.6), H + 2.5, H + 2.65, -d + 3.0, -d + 6.4, { t: M_MAIBANG, f: M_VIEN, b: M_VIEN, l: M_VIEN, r: M_VIEN }); }
      else if (rnd() < 0.35) { const y0 = H + 2.3, y1 = H + 1.2; quad(t(-w / 2, y1, -d * 0.55), t(w / 2, y1, -d * 0.55), t(w / 2, y0, -d * 0.95), t(-w / 2, y0, -d * 0.95), M_TON, [[0, 0], [w, 0], [w, 4], [0, 4]]); hop(t, -w / 2 + 0.2, -w / 2 + 0.3, H, y0, -d * 0.95, -d * 0.93, all(M_SAT)); hop(t, w / 2 - 0.3, w / 2 - 0.2, H, y0, -d * 0.95, -d * 0.93, all(M_SAT)); }
      if (rnd() < 0.38) { kieu(8, fh, w, 1); hop(t, -w / 2 + 0.2, w / 2 - 0.2, 2.78, 3.28, 0, 0.14, { f: M_PHAT, t: M_SAT, d: M_SAT }); }
      placed.push([fx, fz]);
    }
    function xom(R, from, to, density) {
      let acc = 0;
      const L = []; for (let i = 0; i < R.length - 1; i++) { const l = Math.hypot(R[i + 1][0] - R[i][0], R[i + 1][1] - R[i][1]); L.push([acc, l]); acc += l; }
      const at = (s) => { let i = 0; while (i < L.length - 1 && L[i][0] + L[i][1] < s) i++; const f = clamp((s - L[i][0]) / L[i][1], 0, 1); const a = R[i], b = R[i + 1]; const l = L[i][1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
      for (const side of [-1, 1]) {
        let s = from + rnd() * 6;
        while (s < to) {
          const w = 3.8 + rnd() * 2.6;
          if (rnd() > density) { s += w + rnd() * 10; continue; }
          const p = at(s + w / 2), nx = -p[3] * side, nz = p[2] * side;
          const fx = p[0] + nx * 5.6, fz = p[1] + nz * 5.6;
          if (placed.some((q) => Math.hypot(q[0] - fx, q[1] - fz) < 4.2)) { s += w; continue; }
          const rot = Math.atan2(-nx, -nz);
          const fl = [2, 3, 3, 3, 4, 4, 4, 5, 5][Math.floor(rnd() * 9)];
          nhaOng(fx, fz, rot, w, 11 + rnd() * 6, fl);
          s += w + (rnd() < 0.12 ? 3 + rnd() * 5 : 0.05);
        }
      }
    }
    xom(DUONG_A, 40, 120, 0.55); xom(DUONG_A, 120, 330, 0.88); xom(DUONG_A, 330, 470, 0.7);
    // cây trong xóm
    for (let k = 0; k < 26; k++) { const R = DUONG_A[Math.floor(rnd() * DUONG_A.length * 0.85)]; const a = rnd() * 6.283, rr = 18 + rnd() * 14; cay.push([R[0] + Math.cos(a) * rr, R[1] + Math.sin(a) * rr, 8 + rnd() * 6, [0, 1, 3, 4][Math.floor(rnd() * 4)]]); }
    // nhà dân lác đác giữa các đồi chè (một hai tầng, mái ngói, đèn hiên)
    let qId = 200;
    for (const [x, nb] of [[-95, 40], [-152, 46], [-205, 150], [-176, 232], [-246, 120], [96, 56], [136, 36], [161, 112], [186, 176], [-22, 248], [62, 256], [-62, 302], [126, 302], [206, 330], [-262, 332], [252, 232]]) {
      BID = qId++;
      const z = -nb, rot = rnd() * Math.PI, w = 8 + rnd() * 4, d = 6 + rnd() * 2, fl = rnd() < 0.6 ? 1 : 2, fh = 3.2;
      const t0 = khung(x, 0, z, rot), cs = [t0(-w / 2, 0, -d / 2), t0(w / 2, 0, -d / 2), t0(-w / 2, 0, d / 2), t0(w / 2, 0, d / 2)].map((p) => hDat(p[0], p[2]));
      const by = Math.max(...cs) + 0.15, t = khung(x, by, z, rot);
      kieu(7, fh, w, 0); hop(t, -w / 2, w / 2, Math.min(...cs) - by - 0.5, 0, -d / 2, d / 2, all(M_NEN));
      kieu(1, fh, 3.0, 0.35); hop(t, -w / 2, w / 2, 0, fl * fh, -d / 2, d / 2, { f: M_TUONG, b: M_TUONG });
      kieu(6, fh, d, 0.15); hop(t, -w / 2, w / 2, 0, fl * fh, -d / 2, d / 2, { l: M_TUONG, r: M_TUONG });
      maiNgoi(t, -w / 2, w / 2, -d / 2, d / 2, fl * fh + 0.05, 0.6, 0.6);
      const p = t(0, 2.6, d / 2 + 0.6); if (rnd() < 0.7) { sang.push([p[0], p[1], p[2], 1, 0.7, 0.4, 0.7, 0]); vung.push([p[0], p[2], 6, 1, 0.66, 0.36, 0.35]); }
      cay.push([x + (rnd() - 0.5) * 18, z + (rnd() - 0.5) * 18, 9 + rnd() * 5, [0, 1, 3][Math.floor(rnd() * 3)]]);
    }

    // ======================= CHUNG CƯ & NHÀ CAO TẦNG =======================
    let cId = 300;
    const khoi = (x, z, rot, w, d, fl, kinh) => {
      BID = cId++;
      const fh = kinh ? 3.3 : 3.0, H = fl * fh;
      const t0 = khung(x, 0, z, rot), cs = [t0(-w / 2, 0, -d / 2), t0(w / 2, 0, -d / 2), t0(-w / 2, 0, d / 2), t0(w / 2, 0, d / 2)].map((p) => hDat(p[0], p[2]));
      const by = Math.min(...cs), t = khung(x, by, z, rot);
      const lp = kinh ? 0.05 + rnd() * 0.09 : 0.09 + rnd() * 0.15;   // nửa đêm: văn phòng gần như tắt, chung cư còn lác đác
      kieu(kinh ? 5 : 4, fh, kinh ? 1.8 : 3.4, lp); hop(t, -w / 2, w / 2, -4, H, -d / 2, d / 2, { f: M_TUONG, b: M_TUONG, l: M_TUONG, r: M_TUONG });
      kieu(8, fh, 3, 0); maiBang(t, -w / 2, w / 2, -d / 2, d / 2, H, 1.0);
      hop(t, -w * 0.15, w * 0.15, H, H + 3.2, -d * 0.2, d * 0.2, { f: M_TUONG, b: M_TUONG, l: M_TUONG, r: M_TUONG, t: M_MAIBANG });
      if (kinh && rnd() < 0.55) { kieu(8, 3, 3, rnd() < 0.5 ? 2 : 0); hop(t, -w / 2 - 0.05, w / 2 + 0.05, H - 0.9, H - 0.55, -d / 2 - 0.05, d / 2 + 0.05, { f: M_PHAT, b: M_PHAT, l: M_PHAT, r: M_PHAT }); }
      if (H > 45) for (const c of [[-1, -1], [1, 1]]) { const p = t(c[0] * w * 0.15, H + 3.6, c[1] * d * 0.2); sang.push([p[0], p[1], p[2], 1, 0.08, 0.04, 4.0, 0.13 + rnd() * 0.7]); }
    };
    // ======================= THÀNH PHỐ THÁI NGUYÊN =======================
    // Đồng bằng phía bắc, sau doanh trại một quãng (từ ~470 m). Lưới phố xoay 14°, ô phố 96 m (gồm lòng đường 14 m).
    // Lõi phố quanh TPC: tháp kính 22–46 tầng, viền đèn LED, đèn báo máy bay; vành giữa: chung cư 10–24 tầng xen dãy nhà ống;
    // ngoài cùng: dãy nhà ống 3–6 tầng sát nhau, lác đác nhà 7–12 tầng; vài ô là công viên, trường học (cây, nhà thấp).
    const phoK = SN.dat.phoK;
    const TPC = [-140, -1020], ROT = 14 * D2R, BLK = 96, LD = 14;
    const pq = (i, j) => [TPC[0] + i * BLK * Math.cos(ROT) - j * BLK * Math.sin(ROT), TPC[1] + i * BLK * Math.sin(ROT) + j * BLK * Math.cos(ROT)];
    const thap = (x, z, rot, w, d, fl, led) => {   // tháp kính có đế, đỉnh thót lại, viền đèn
      BID = cId++;
      const fh = 3.4, H = fl * fh;
      const t0 = khung(x, 0, z, rot), cs = [t0(-w / 2, 0, -d / 2), t0(w / 2, 0, -d / 2), t0(-w / 2, 0, d / 2), t0(w / 2, 0, d / 2)].map((p) => hDat(p[0], p[2]));
      const by = Math.min(...cs), t = khung(x, by, z, rot);
      const pw = w + 10, pd = d + 10;   // khối đế 4 tầng: sảnh, trung tâm thương mại sáng đèn
      kieu(4, 4.5, 6, 0.75); hop(t, -pw / 2, pw / 2, -4, 18, -pd / 2, pd / 2, { f: M_TUONG, b: M_TUONG, l: M_TUONG, r: M_TUONG });
      kieu(8, 3, 3, 0); maiBang(t, -pw / 2, pw / 2, -pd / 2, pd / 2, 18, 1.1);
      BID = cId++;
      kieu(5, fh, 1.8, 0.04 + rnd() * 0.09); hop(t, -w / 2, w / 2, 18, H, -d / 2, d / 2, { f: M_TUONG, b: M_TUONG, l: M_TUONG, r: M_TUONG });
      const w2 = w * 0.72, d2 = d * 0.72, H2 = H + 7 + rnd() * 8;   // phần đỉnh thót vào
      kieu(5, fh, 1.8, 0.24); hop(t, -w2 / 2, w2 / 2, H, H2, -d2 / 2, d2 / 2, { f: M_TUONG, b: M_TUONG, l: M_TUONG, r: M_TUONG, t: M_MAIBANG });
      if (led) {   // viền đèn: bốn cạnh dọc thân tháp + đai sáng quanh đỉnh (kiểu LED trang trí ở các thành phố Việt Nam)
        kieu(8, 3, 3, led); const e = 0.25;
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) hop(t, sx * w / 2 - e, sx * w / 2 + e, 18, H, sz * d / 2 - e, sz * d / 2 + e, { f: M_PHAT, b: M_PHAT, l: M_PHAT, r: M_PHAT });
        hop(t, -w2 / 2 - 0.1, w2 / 2 + 0.1, H2 - 1.6, H2 - 0.9, -d2 / 2 - 0.1, d2 / 2 + 0.1, { f: M_PHAT, b: M_PHAT, l: M_PHAT, r: M_PHAT });
      }
      for (const c of [[-1, -1], [1, 1], [1, -1]]) { const p = t(c[0] * w2 * 0.45, H2 + 0.6, c[1] * d2 * 0.45); sang.push([p[0], p[1], p[2], 1, 0.08, 0.04, 4.5, 0.13 + rnd() * 0.7]); }
    };
    const dayOng = (t, x0, x1, z, dDep, flMin, flMax) => {   // một dãy nhà ống mặt quay ra đường (khung t: +z là phía đường)
      let x = x0;
      while (x < x1 - 3) {
        const len = Math.min(x1 - x, 9 + rnd() * 22), fl = flMin + Math.floor(rnd() * (flMax - flMin + 1)), fh = 3.3, H = fl * fh;
        BID = cId++;
        kieu(3, fh, 4.2 + rnd() * 1.4, 0.24 + rnd() * 0.3); hop(t, x, x + len, -3, H, z - dDep, z, { f: M_TUONG });
        kieu(7, fh, 4, 0); hop(t, x, x + len, -3, H, z - dDep, z, { l: M_TUONG, r: M_TUONG, b: M_TUONG });
        kieu(8, 3, 3, 0); quad(t(x, H, z), t(x + len, H, z), t(x + len, H, z - dDep), t(x, H, z - dDep), M_MAIBANG, [[x, z], [x + len, z], [x + len, z - dDep], [x, z - dDep]]);
        if (rnd() < 0.3) { kieu(8, fh, 4, 1); hop(t, x + 0.3, x + len - 0.3, 2.8, 3.3, z, z + 0.15, { f: M_PHAT }); }   // biển hiệu
        x += len;
      }
    };
    const xe2 = [];   // đường lớn có xe chạy
    let nB = 0;
    for (let i = -17; i <= 17; i++) for (let j = -15; j <= 15; j++) {
      const c = pq(i, j), dist = Math.hypot(c[0], c[1]);
      if (phoK(c[0], c[1]) < 0.6) continue;
      const dc = Math.hypot(c[0] - TPC[0], c[1] - TPC[1]);
      const t = khung(c[0], 0, c[1], -ROT);
      const H0b = hDat(c[0], c[1]), half = (BLK - LD) / 2, far = dist > 1700;
      const kind = rnd();
      if (kind < 0.06 && dc > 300) {   // công viên: cây, đèn vườn
        for (let k = 0; k < 10; k++) { const p = t((rnd() - 0.5) * 70, 0, (rnd() - 0.5) * 70); cay.push([p[0], p[2], 10 + rnd() * 6, [0, 1, 3][Math.floor(rnd() * 3)]]); }
        for (let k = 0; k < 5; k++) { const p = t((rnd() - 0.5) * 60, 0, (rnd() - 0.5) * 60); sang.push([p[0], H0b + 3.5, p[2], 1, 0.86, 0.66, 1.2, 0]); }
        continue;
      }
      // mặt tiền bốn phía là dãy nhà ống (ở xa thì gộp thành ít dãy hơn)
      const dDep = 13 + rnd() * 6;
      for (let sd = 0; sd < 4; sd++) {
        if (far && rnd() < 0.35) continue;
        const ts = con(t, 0, 0, 0, sd * Math.PI / 2);
        dayOng(ts, -half, half - (sd % 2 ? dDep : 0), half, dDep, dc < 600 ? 4 : 3, dc < 600 ? 7 : (far ? 5 : 6));
      }
      // giữa ô phố
      if (dc < 420) {   // lõi: tháp kính
        const m = 1 + Math.floor(rnd() * 2.4);
        for (let k = 0; k < m; k++) {
          const fl = Math.round(mix(40, 22, dc / 420) * (0.75 + rnd() * 0.45));
          const led = rnd() < 0.45 ? (rnd() < 0.5 ? 1 : 2) : 0;
          const p = t((m > 1 ? (k - (m - 1) / 2) * 30 : (rnd() - 0.5) * 12), 0, (rnd() - 0.5) * 14);
          thap(p[0], p[2], -ROT + (rnd() < 0.3 ? 0.3 : 0), 22 + rnd() * 10, 20 + rnd() * 10, fl, led);
          nB++;
        }
      } else if (dc < 1000 || rnd() < 0.3) {   // vành giữa: chung cư
        const m = rnd() < 0.5 ? 1 : 2;
        for (let k = 0; k < m; k++) {
          const fl = dc < 1000 ? 10 + Math.floor(rnd() * 15) : 7 + Math.floor(rnd() * 6);
          const p = t((m > 1 ? (k - 0.5) * 34 : 0) + (rnd() - 0.5) * 6, 0, (rnd() - 0.5) * 10);
          khoi(p[0], p[2], -ROT + (rnd() < 0.5 ? Math.PI / 2 : 0), m > 1 ? 18 + rnd() * 6 : 34 + rnd() * 12, 15 + rnd() * 5, fl, fl > 16 && rnd() < 0.5);
          nB++;
        }
      }
      // đèn đường: hai cạnh đường phía nam và phía đông của ô (mỗi đường chỉ đặt một lần)
      const nL = far ? 2 : 3;
      for (let k = 0; k < nL; k++) {
        const f = (k + 0.5) / nL - 0.5;
        for (const [ax, az2, side] of [[f * BLK, BLK / 2, 1], [BLK / 2, f * BLK, -1]]) {
          const p = t(ax + (side < 0 ? LD * 0.42 : 0), 0, az2 - (side > 0 ? LD * 0.42 : 0));
          const led = (i + j + k) % 5 === 0;
          sang.push([p[0], H0b + 8, p[2], led ? 0.85 : 1, led ? 0.9 : 0.6, led ? 1 : 0.28, far ? 3.2 : 2.2, 0]);
          if (!far && dist < 1100) vung.push([p[0], p[2], 9, 1, 0.62, 0.32, 0.4]);
        }
      }
      // mặt đường (một dải mỗi phía nam/đông của ô)
      if (dist < 1500) {
        BID = 42; kieu(0, 1, 1, 0);
        const y = H0b + 0.25, e = BLK / 2, w2 = LD / 2;
        const a1 = t(-e, 0, e - w2), a2 = t(e, 0, e - w2), a3 = t(e, 0, e + w2), a4 = t(-e, 0, e + w2);
        quad([a4[0], y, a4[2]], [a3[0], y, a3[2]], [a2[0], y, a2[2]], [a1[0], y, a1[2]], M_DUONG, [[0, w2], [BLK, w2], [BLK, -w2], [0, -w2]]);
      }
      if (j % 3 === 0 && dist < 2200) xe2.push(c);
    }
    SN.dat.soNhaPho = nB;
    // nóc một khu chung cư ở rìa thành phố phía đông: chỗ đặt máy quay cảnh 4 (nhìn ngang đường bay của sao băng)
    { const x = 352, z = -246, rot = -0.32; const t0 = khung(x, 0, z, rot); const by = Math.min(...[[-15, -8], [15, -8], [-15, 8], [15, 8]].map(([a, b]) => { const p = t0(a, 0, b); return hDat(p[0], p[2]); }));
      khoi(x, z, rot, 30, 16, 8, false); const c = t0(-12, 0, 0); SN.dat.nocV = [c[0], by + 24, c[2]]; }
    // ======================= LƯỚI + VẬT LIỆU =======================
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(G.P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(G.N, 3));
    g.setAttribute('aB', new T.Float32BufferAttribute(G.B, 4)); g.setAttribute('aS', new T.Float32BufferAttribute(G.S, 4));
    const lv = lampsL.map((l) => new T.Vector4(l[0], l[1], l[2], l[3]));
    const mat = new T.ShaderMaterial({
      uniforms: Object.assign({}, U, { uL: { value: lv }, uLK: { value: 1 }, uTrai: { value: new T.Vector3(TR.x, TR.y, TR.z) }, uThuyC: { value: new T.Vector3(1, 10, 2) }, uThuy: { value: 1 } }),
      vertexShader: NHA_V, fragmentShader: SN_GLSL.CHUNG + SN.dat.CHUNG3 + NHA_F, extensions: { derivatives: true },
    });
    const mesh = new T.Mesh(g, mat); mesh.frustumCulled = false;
    // lá cờ
    const coG = new T.PlaneGeometry(1, 1, 40, 26);
    const coM = new T.ShaderMaterial({
      uniforms: Object.assign({}, U, { uCoO: { value: new T.Vector3(...coO) }, uCoX: { value: new T.Vector3(...coX).normalize() }, uCoN: { value: new T.Vector3(...coN).normalize() }, uCoS: { value: new T.Vector2(3.0, 2.0) }, uCoSpot: { value: new T.Vector3(...coSpot) }, uGio: { value: 0 } }),
      vertexShader: SN_GLSL.CHUNG + CO_V, fragmentShader: SN_GLSL.CHUNG + SN.dat.CHUNG3 + CO_F, side: T.DoubleSide, extensions: { derivatives: true },
    });
    const co = new T.Mesh(coG, coM); co.frustumCulled = false;
    // đốm sáng tĩnh
    const sp = new Float32Array(sang.length * 3), sc = new Float32Array(sang.length * 4), sb = new Float32Array(sang.length);
    sang.forEach((q, i) => { sp.set([q[0], q[1], q[2]], i * 3); sc.set([q[3], q[4], q[5], q[6]], i * 4); sb[i] = q[7]; });
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); sg.setAttribute('aC', new T.BufferAttribute(sc, 4)); sg.setAttribute('aBl', new T.BufferAttribute(sb, 1));
    const sangM = new T.ShaderMaterial({ uniforms: Object.assign({}, U, { uPx: { value: 1 } }), vertexShader: SN_GLSL.CHUNG + SN.dat.CHUNG3 + SANG_V, fragmentShader: SANG_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    const sangP = new T.Points(sg, sangM); sangP.frustumCulled = false; sangP.userData.ro = 5;
    // vũng sáng
    const NV = 4, vp = [], vd = [], vc = [], vi = [];
    vung.forEach((q) => {
      const base = vp.length / 3;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NV; i++) {
        const rx = i / NV * 2 - 1, rz = j / NV * 2 - 1, x = q[0] + rx * q[2], z = q[1] + rz * q[2];
        vp.push(x, hDat(x, z) + 0.35, z); vd.push(rx, rz, q[6], 0); vc.push(q[3], q[4], q[5]);
      }
      for (let j = 0; j < NV; j++) for (let i = 0; i < NV; i++) { const a = base + j * (NV + 1) + i, b = a + 1, c = a + NV + 1, d = c + 1; vi.push(a, c, b, b, c, d); }
    });
    const vg = new T.BufferGeometry(); vg.setAttribute('position', new T.Float32BufferAttribute(vp, 3)); vg.setAttribute('aD', new T.Float32BufferAttribute(vd, 4)); vg.setAttribute('aCol', new T.Float32BufferAttribute(vc, 3)); vg.setIndex(vi);
    const vungM = new T.ShaderMaterial({ uniforms: U, vertexShader: VUNG_V, fragmentShader: SN_GLSL.CHUNG + SN.dat.CHUNG3 + VUNG_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const vungM2 = vungM; const vungMesh = new T.Mesh(vg, vungM2); vungMesh.frustumCulled = false; vungMesh.userData.ro = 4;
    // xe chạy đêm: đèn pha trắng khi chạy về phía máy quay, đèn hậu đỏ khi chạy ra xa
    const xe = [];
    const duongXe = (R) => { const L = [0]; for (let i = 0; i < R.length - 1; i++) L.push(L[i] + Math.hypot(R[i + 1][0] - R[i][0], R[i + 1][1] - R[i][1])); return { R, L, len: L[L.length - 1] }; };
    const dA = duongXe(DUONG_A);
    for (let k = 0; k < 4; k++) xe.push({ d: dA, s0: rnd() * dA.len, v: (k % 2 ? -1 : 1) * (7 + rnd() * 5), lane: 1.5, w: k === 0 ? 0.75 : 0, h: 0.9, sz: k === 0 ? 0.55 : 0.4 });
    // xe trên các trục phố lớn của thành phố (mỗi trục là một đường thẳng dọc lưới phố)
    const truc = [];
    for (const j of [-9, -6, -3, 0, 3, 6, 9]) { const R = []; for (let i = -17; i <= 17; i++) { const p = pq(i, j + 0.5); if (phoK(p[0], p[1]) > 0.5) R.push(p); } if (R.length > 3) truc.push(R); }
    for (const i of [-9, -3, 3, 9]) { const R = []; for (let j = -15; j <= 15; j++) { const p = pq(i + 0.5, j); if (phoK(p[0], p[1]) > 0.5) R.push(p); } if (R.length > 3) truc.push(R); }
    truc.forEach((R) => { const d = duongXe(R); for (let k = 0; k < 7; k++) xe.push({ d, s0: rnd() * d.len, v: (k % 2 ? -1 : 1) * (9 + rnd() * 7), lane: 2.5, w: 1.0, h: 1, sz: 1.6 }); });
    const NX = xe.length * 2, xp = new Float32Array(NX * 3), xc = new Float32Array(NX * 4), xb = new Float32Array(NX);
    const xg = new T.BufferGeometry(); xg.setAttribute('position', new T.BufferAttribute(xp, 3)); xg.setAttribute('aC', new T.BufferAttribute(xc, 4)); xg.setAttribute('aBl', new T.BufferAttribute(xb, 1));
    const xeP = new T.Points(xg, sangM); xeP.frustumCulled = false; xeP.userData.ro = 5;
    function capXe(S, cam) {
      xe.forEach((o, i) => {
        const { R, L, len } = o.d;
        let s = ((o.s0 + o.v * (S - 200)) % len + len) % len;
        let j = 0; while (j < L.length - 2 && L[j + 1] < s) j++;
        const a = R[j], b = R[j + 1], l = (L[j + 1] - L[j]) || 1, f = (s - L[j]) / l;
        const dx = (b[0] - a[0]) / l * Math.sign(o.v), dz = (b[1] - a[1]) / l * Math.sign(o.v);
        const x = a[0] + (b[0] - a[0]) * f - dz * o.lane, z = a[1] + (b[1] - a[1]) * f + dx * o.lane, y = hDat(x, z) + 0.3 + o.h;
        const toC = (cam.x - x) * dx + (cam.z - z) * dz;
        const toi = toC > 0;
        for (let e = 0; e < 2; e++) {
          const k = i * 2 + e, off = (e ? 1 : -1) * o.w * 0.5;
          xp[k * 3] = x - dz * off; xp[k * 3 + 1] = y; xp[k * 3 + 2] = z + dx * off;
          if (o.w === 0 && e === 1) { xc.set([0, 0, 0, 0.01], k * 4); continue; }
          if (toi) xc.set([1, 0.92, 0.8, o.sz * 1.15], k * 4); else xc.set([1, 0.06, 0.03, o.sz * 0.8], k * 4);
        }
      });
      xg.attributes.position.needsUpdate = true; xg.attributes.aC.needsUpdate = true;
    }
    SN.dat.cuaSo = TR.thuy.slice();
    SN.dat.cuaSoN = TR.thuyN;
    SN.dat.Yp = TR.y;
    SN.dat.trai = TR; SN.dat.tC = tC;
    const coDep = new T.ShaderMaterial({ uniforms: coM.uniforms, vertexShader: SN_GLSL.CHUNG + CO_V, fragmentShader: 'void main(){}', colorWrite: false, side: T.DoubleSide });
    return {
      mesh, mat, co, coM, coDep, sangP, sangM, vungMesh, xeP, cay, lamps: lv,
      cap(S, cam) { capXe(S, cam); },
      uPx(px) { sangM.uniforms.uPx.value = px; },
    };
  };
})();
