'use strict';
// ĐỒI CHÈ THÁI NGUYÊN, 23:59 đêm 23/11/2026 (S 206–245). Cú đinh số 3.
// Toạ độ: x = đông, y = lên, -z = bắc (mét). Máy quay đặt thấp giữa hàng chè ở sườn một quả đồi bát úp, nhìn về Bắc Tây Bắc:
// chòm Cassiopeia (chữ W) đúng vị trí thật trên trời, trăng 97% cao 72° ở phía tây (chiếu từ trên, lệch trái khung hình).
// Hàng chè chạy theo vòng đồng mức quanh tâm mỗi quả đồi (vòng tròn đồng tâm như đồi chè thật). Doanh trại trên đỉnh đồi bằng.
// 00:00:00 (M.BOOM): sao băng vụt ra từ chòm W → tách thành 19 đốm sáng rơi xuống, mỗi đốm chạm đất làm hàng chè sáng lan thành sóng.
(() => {
  const SN = window.SN, M = SN.M, { clamp, mix, ease, io, ramp } = SN.u;
  const D2R = Math.PI / 180;
  // ---------- địa hình ----------
  function h2(x, y) { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
  function vn(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = h2(ix, iy), b = h2(ix + 1, iy), c = h2(ix, iy + 1), d = h2(ix + 1, iy + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y, o) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * (vn(x * f, y * f) - 0.5); f *= 2.03; a *= 0.5; } return s; }
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // THÁI NGUYÊN LÀ MỘT THÀNH PHỐ: phía bắc (sau doanh trại, cách một quãng) là đồng bằng có thành phố cao tầng sáng đèn;
  // gần doanh trại là đồi thấp: đồi chè cạnh trại (chỗ tia sáng rơi xuống), còn lại là rừng keo, vườn, xóm nhà dân; xa xa mới thấy vài quả đồi chè.
  // các quả đồi bát úp: [x, bắc, cao, bán kính, loại (0 chè · 1 rừng · 2 trại · 3 vườn, xóm)]
  // 0: đồi chè máy quay đứng (sườn bắc, nhìn ra thung lũng) · 1: đồi doanh trại (đỉnh cắt bằng) · 2: đồi chè tròn cạnh trại, phía tây (tia sáng rơi xuống đỉnh)
  const DOMES = [[0, -46, 31, 128, 0], [34, 142, 33, 120, 2],
    [-52, 174, 16, 50, 0], [-182, 268, 15, 104, 1], [62, 306, 14, 96, 1], [-276, 150, 10, 72, 3], [152, 236, 11, 80, 1], [-118, 66, 7, 60, 3],
    // núi rừng xa làm nền sau thành phố, dãy Tam Đảo phía tây
    [-1500, 2900, 120, 820, 1], [700, 3400, 150, 950, 1], [-250, 3700, 170, 1050, 1], [1900, 2900, 120, 760, 1], [-2700, 1600, 160, 900, 1], [-3300, 400, 190, 1100, 1], [2600, 1200, 90, 700, 1]];
  // vùng thành phố: khoảng cách tới máy quay (m), phương vị (độ, 0 = bắc, dương = đông)
  const PHO = { r0: 470, r1: 2750, a0: -74, a1: 62, y: -12 };
  function phoK(x, z) {
    const d = Math.hypot(x, z), az = Math.atan2(x, -z) / D2R;
    return ss(PHO.r0 - 60, PHO.r0 + 90, d) * (1 - ss(PHO.r1 - 220, PHO.r1 + 160, d)) * ss(PHO.a0 - 9, PHO.a0 + 6, az) * (1 - ss(PHO.a1 - 6, PHO.a1 + 9, az));
  }
  {
    let s = 9;
    const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 0; i < 60; i++) {
      const az = (338 + (r() - 0.5) * 200) * D2R, dist = 700 + Math.pow(r(), 0.7) * 3200;
      const x = Math.sin(az) * dist, nb = Math.cos(az) * dist, H = 16 + r() * 50 * (0.45 + dist / 3500), R = 150 + r() * 330, tea = r() < 0.18;
      if (phoK(x, -nb) > 0.02 || Math.hypot(x, nb) - R < 2900 && phoK(x * (1 - R / Math.hypot(x, nb)), -nb * (1 - R / Math.hypot(x, nb))) > 0.3) continue;   // không mọc đồi giữa thành phố
      DOMES.push([x, nb, H, R, tea ? 0 : 1]);
    }
    // phía nam (sau lưng đồi chè): đồi thấp gần là vườn, xóm, rừng keo; vài quả đồi chè xa xa để nhận ra vùng chè
    for (let i = 0; i < 26; i++) {
      const az = (158 + (r() - 0.5) * 170) * D2R, dist = 260 + Math.pow(r(), 0.8) * 3000;
      const q = r();
      DOMES.push([Math.sin(az) * dist, Math.cos(az) * dist, 10 + r() * 40 * (0.4 + dist / 3000), 110 + r() * 300, dist < 700 ? (q < 0.55 ? 3 : 1) : (q < 0.25 ? 0 : 1)]);
    }
  }
  const dome = (d, H, R) => H * (1 - ss(0, 1, d / R));
  let H0 = 0;
  const PLATEAU_R = 52;
  function hRaw(x, z) {
    const n = -z;
    let h = -9 + fbm(x * 0.0019, n * 0.0019, 3) * 6;
    for (const D of DOMES) { const dx = x - D[0], dn = n - D[1]; const d = Math.sqrt(dx * dx + dn * dn); if (d < D[3]) h += dome(d, D[2], D[3]); }
    // mặt bằng doanh trại: cắt phẳng đỉnh đồi trại
    const C = DOMES[1], dc = Math.hypot(x - C[0], n - C[1]);
    const k = 1 - ss(PLATEAU_R, PLATEAU_R + 14, dc);
    if (k > 0) { const top = -9 + fbm(C[0] * 0.0019, C[1] * 0.0019, 3) * 6 + dome(PLATEAU_R, C[2], C[3]); h = mix(h, Math.min(h, top - 0.12), k); }
    // thành phố: đồng bằng gần như phẳng
    const kc = phoK(x, z);
    if (kc > 0) h = mix(h, PHO.y + fbm(x * 0.0011, n * 0.0011, 2) * 2.2, kc);
    h += fbm(x * 0.03, n * 0.03, 2) * 0.7 * (1 - kc * 0.85);
    return h;
  }
  H0 = hRaw(0, 0);
  const hDat = (x, z) => hRaw(x, z) - H0;
  const Y_THUNG = Math.min(hDat(-20, -90), hDat(-120, -200), hDat(60, -220)) + 1.5; // đáy thung lũng (sương đọng)
  // quả đồi chi phối điểm (x, z): để hàng chè chạy vòng quanh tâm đồi đó
  function domeAt(x, z) {
    const n = -z; let best = -1, bv = 0, second = 0;
    for (let i = 0; i < DOMES.length; i++) { const D = DOMES[i]; const d = Math.hypot(x - D[0], n - D[1]); if (d >= D[3]) continue; const v = dome(d, D[2], D[3]); if (v > bv) { second = bv; bv = v; best = i; } else if (v > second) second = v; }
    return [best, bv, second];
  }
  // mức vườn / xóm ở chân đồi, thung lũng (khớp với lưới địa hình)
  const langNen = (x, z) => ss(-0.1, 0.25, fbm(x * 0.006 + 3.1, z * 0.006, 2) + 0.05) * 0.85;
  SN.dat = { hDat, domeAt, DOMES, phoK, PHO, langNen };

  // ---------- shader chung cho mặt đất / cây / nhà ----------
  const CHUNG3 = `
  precision highp sampler2DShadow;
  uniform vec3 uMoonL;       // hướng trăng
  uniform vec3 uMoonC, uSkyC;  // màu, độ sáng của trăng và của trời (đêm thật: trăng là nguồn sáng chính nhưng yếu, đèn đường mới là chỗ sáng)
  // BÓNG ĐỔ: bóng trăng tính một lần (cảnh đứng yên); bóng động theo sao băng hoặc mảnh sáng. So độ sâu bằng phần cứng (mềm 4×4 điểm).
  uniform sampler2DShadow tBM, tBD;
  uniform mat4 uBMm, uBDm;
  uniform vec4 uBMp, uBDp;   // x: độ mềm (uv), y: bật / độ mạnh, z: đẩy theo pháp tuyến (m); w (động): 0 = sao băng, 1 = mảnh sáng
  float layBong(sampler2DShadow t, mat4 m, vec3 wp, float soft){
    vec4 q = m * vec4(wp, 1.);
    if (q.w <= 0.) return 1.;
    vec3 c = q.xyz / q.w * .5 + .5;
    if (c.x < .002 || c.y < .002 || c.x > .998 || c.y > .998 || c.z > .9999) return 1.;
    vec2 o = vec2(soft * .5);
    return (texture(t, vec3(c.xy - o, c.z)) + texture(t, vec3(c.xy + vec2(o.x, -o.y), c.z)) + texture(t, vec3(c.xy + vec2(-o.x, o.y), c.z)) + texture(t, vec3(c.xy + o, c.z))) * .25;
  }
  float bongTrang(vec3 wp, vec3 n){ return uBMp.y > .5 ? layBong(tBM, uBMm, wp + n * uBMp.z, uBMp.x) : 1.; }
  float bongDong(vec3 wp, vec3 n){ return uBDp.y > .001 ? mix(1., layBong(tBD, uBDm, wp + n * uBDp.z, uBDp.x), uBDp.y) : 1.; }
  uniform float uMet;        // ánh sao băng (loé)
  uniform vec3 uMetP;        // hướng sao băng (để chiếu sáng có hướng)
  uniform vec3 uMP[19];      // vị trí 19 đốm sáng
  uniform float uMI[19];     // độ sáng từng đốm
  uniform vec2 uRP[19];      // chỗ đốm chạm đất (x, z)
  uniform float uRT[19];     // lúc chạm đất
  uniform vec4 uFP;          // mảnh sáng đang bay: vị trí, độ sáng (hắt xuống đồi, mái nhà, cây)
  uniform float uFogK;       // độ đặc sương
  uniform vec3 uCam;
  uniform float uYV;         // độ cao mặt thung lũng
  float quangPho(float az){ // ánh đèn hắt lên sương và trời theo phương vị (rad, 0 = bắc, dương = đông): thành phố phía bắc (rộng), xóm phố tây
    float a1 = abs(mod(az + .1 + PI, TAU) - PI), a2 = abs(mod(az + 1.06 + PI, TAU) - PI);
    return exp(-a1 * a1 / .36) * 1.3 + exp(-a1 * a1 / .05) * .6 + .3 * exp(-a2 * a2 / .03);
  }
  float suongF(vec3 wp, out vec3 fc){
    vec3 dv = wp - uCam;
    float dist = length(dv);
    float hv = wp.y - uYV;                                   // cao hơn mặt thung lũng bao nhiêu mét
    float hp = max(hv, 0.), hc = max(uCam.y - uYV, 0.);
    float mE = exp(-hp / 3.6);
    float mA = abs(hc - hp) > .5 ? (exp(-hp / 3.6) - exp(-hc / 3.6)) / ((hc - hp) / 3.6) : mE;   // trung bình dọc tia nhìn
    float mist = mix(mE, mA, smoothstep(22., 70., hc)) * (.55 + .9 * smoothstep(-.25, .35, pn(vec3(wp.xz * .0016, .37))));
    float dens = uFogK * (mix(.16, .07, smoothstep(30., 120., hc)) + 2.6 * mist);
    fc = mix(vec3(.042, .05, .067), vec3(.028, .034, .048), smoothstep(0., 30., hv));
    fc += uMet * vec3(.08, .12, .1);
    fc += vec3(.06, .038, .018) * quangPho(atan(dv.x, -dv.z)) * smoothstep(400., 2400., dist) * exp(-max(hv, 0.) / 60.) * .55;
    return clamp(1. - exp(-dist * dens), 0., 1.);
  }
  vec3 suong(vec3 col, vec3 wp){ vec3 fc; float f = suongF(wp, fc); return mix(col, fc, f); }
  // shM: bóng trăng; shD: bóng động (chỉ tính cho sao băng khi uBDp.w = 0)
  vec3 anhTrang(vec3 n, float ao, float shM, float shD){
    float d = max(dot(n, uMoonL), 0.);
    vec3 L = uMoonC * d * shM;
    L += uSkyC * (.55 + .45 * n.y) * ao;                                 // trời
    L += uMet * vec3(.68, .86, .8) * (.3 + .7 * max(dot(n, uMetP), 0.) * mix(shD, 1., uBDp.w));
    return L;
  }
  vec3 dongDom(vec3 wp, vec3 n, float shD){ // ánh ấm của các đốm sáng gần; mảnh sáng có bóng (khi uBDp.w = 1)
    vec3 s = vec3(0.);
    for (int i = 0; i < 19; i++) {
      if (uMI[i] < .001) continue;
      vec3 d = uMP[i] - wp; float l2 = dot(d, d);
      if (l2 > 4900.) continue;                              // xa quá 70 m: không đáng kể, bỏ qua cho máy yếu
      s += uMI[i] * max(dot(n, d) * inversesqrt(l2 + 1e-4), 0.) * 26. / (l2 + 4.);
    }
    if (uFP.w > .001) { vec3 d = uFP.xyz - wp; float l2 = dot(d, d); s += uFP.w * (.06 + .94 * max(dot(n, d) * inversesqrt(l2 + 1e-4), 0.) * mix(1., shD, uBDp.w)) * 26. / (l2 + 9.); }
    return s * vec3(1., .72, .42);
  }
  // VA CHẠM: sóng sáng chạy từ đỉnh đồi ra theo từng vòng hàng chè (như gợn nước), hai vòng dội theo sau; đỉnh đồi còn rực một lúc
  uniform vec4 uIMP;   // chỗ va chạm (x, y, z), lúc va chạm
  vec3 vongVa(vec3 wp, float bush){
    float t = uS - uIMP.w;
    if (t < 0. || t > 16.) return vec3(0.);
    float d = length(wp.xz - uIMP.xz);
    float R = 78. * (1. - exp(-t / 1.1)) + 11. * t;
    float w = 1.6 + 1.3 * t;
    float ring = exp(-sq((d - R) / w)) * exp(-t * .3) + .45 * exp(-sq((d - R * .68) / (w * .8))) * exp(-t * .42) + .25 * exp(-sq((d - R * .4) / (w * .7))) * exp(-t * .6);
    float sau = smoothstep(R + w, R - w * 3., d) * exp(-d / 40.) * (exp(-t / 1.8) * .22 + .07 * exp(-t / 7.));   // sau khi sóng qua: lá còn ấm
    float dinh = exp(-d / 7.) * (exp(-t / 1.2) * 1.4 + .35 * exp(-t / 6.));                                      // đỉnh đồi rực đỏ
    float loe = exp(-t / .07) * 6. * exp(-d / 40.);
    return vec3(1., .62, .3) * (ring * 2.4 * (.06 + bush) + sau * (.05 + bush) + dinh * (.2 + bush)) + vec3(1., .9, .75) * loe;
  }
  vec3 songChe(vec3 wp, float bush){ // sóng sáng lan theo hàng chè sau khi đốm chạm đất
    vec3 s = vec3(0.);
    float spn = smoothstep(.3, .8, pn(vec3(wp.xz * 1.7, uS * .4)) + .5);
    for (int i = 0; i < 19; i++) {
      float t = uS - uRT[i];
      if (t < 0. || t > 26.) continue;
      float dd = length(wp.xz - uRP[i]);
      float r = t * 7.5, wr = 2.2 + t * .5;
      if (dd > r + wr * 3. && dd > 160.) continue;
      float ring = exp(-sq((dd - r) / wr));
      float lin = exp(-dd / 30.) * exp(-t * .14);
      float sp = .65 + .7 * (.5 + .5 * sin(spn * 6.283 + float(i) * 2.4));
      s += (ring * .9 * exp(-t * .17) * sp + lin * .22 * smoothstep(0., 1.5, t)) * (.15 + bush);
    }
    return s * vec3(1., .66, .3);
  }
  `;
  const TER_V = `
  attribute vec4 aRow; // x: toạ độ hàng (đã chia khoảng cách hàng), y: chè, z: rừng, w: vườn / xóm
  attribute vec3 aC;   // tâm quả đồi chi phối (x, z), mức thành phố
  varying vec3 vW; varying vec3 vN; varying vec4 vRow; varying vec3 vC;
  void main(){ vW = (modelMatrix * vec4(position, 1.)).xyz; vN = normal; vRow = aRow; vC = aC; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`;
  const TER_F = `
  varying vec3 vW; varying vec3 vN; varying vec4 vRow; varying vec3 vC;
  uniform vec4 uL[8]; uniform float uLK;
  uniform vec4 uChe, uChe2;   // vùng hàng chè dựng khối (x, z, bán kính trong, ngoài): ở đó mặt đất chỉ còn rãnh đất giữa hàng
  void main(){
    vec3 n = vN / max(length(vN), 1e-4);
    float tea = vRow.y, rung = vRow.z, lang = vRow.w, pho = vC.z;
    vec2 cen = vC.xy;
    // ---------- chè: toạ độ ngang hàng = khoảng cách tới tâm đồi (đã chia sẵn), lượn nhẹ ----------
    float rowF = vRow.x + pn(vec3(vW.xz * .02, .5)) * .35 + pn(vec3(vW.xz * .11, 2.7)) * .12;
    float fw = fwidth(rowF);
    float u = fract(rowF);
    vec2 rdv = vW.xz - cen; float rdl = length(rdv);
    vec2 rd2 = rdl > .01 ? rdv / rdl : vec2(0.);
    float along = atan(rdv.y, rdv.x) * rdl / 1.3;
    float seg = fract(along + floor(rowF) * .37);
    float segId = floor(along + floor(rowF) * .37);
    float gap = smoothstep(.0, .08, seg) * smoothstep(1., .92, seg) * step(.06, h12(vec2(segId, floor(rowF))));
    float bushW = .78 + .12 * h12(vec2(segId * 1.7, floor(rowF)));
    float edgeN = pn(vec3(vW.xz * 3.1, vW.y * 3.1)) * .16 + pn(vec3(vW.xz * 9.3, 2.2)) * .07;
    float uu = u + edgeN;
    float bush = smoothstep(.5 - bushW * .5, .5 - bushW * .5 + .16, uu) * smoothstep(.5 + bushW * .5, .5 + bushW * .5 - .16, uu) * mix(1., gap, 1. - smoothstep(.15, .5, fwidth(along)));
    float top = sat(1. - abs(uu - .5) * 2.4);
    float aaK = 1. - smoothstep(.06, .26, fw);
    // vùng hàng chè dựng khối: mặt đất chỉ còn rãnh (khối bụi chè vẽ riêng)
    float khoi = max(uChe.w > 0. ? 1. - smoothstep(uChe.z, uChe.w, length(vW.xz - uChe.xy)) : 0., uChe2.w > 0. ? 1. - smoothstep(uChe2.z, uChe2.w, length(vW.xz - uChe2.xy)) : 0.);
    bush *= 1. - khoi; top *= 1. - khoi;
    vec3 nb = normalize(n + vec3(rd2.x, 0., rd2.y) * (u - .5) * 1.8 * aaK * bush);
    float leaf = pn(vec3(vW.xz * 1.9, vW.y * 1.9)) * .5 + pn(vec3(vW.xz * 6.5, 1.3)) * .35;
    float patchV = pn(vec3(vW.xz * .012, 4.4)) + .5 * pn(vec3(vW.xz * .045, 1.9));
    vec3 aTea = mix(vec3(.022, .038, .021), vec3(.05, .074, .038), .5 + leaf) * (.75 + .5 * smoothstep(-.35, .35, patchV)) * (.7 + .45 * top);
    vec3 aDat = vec3(.016, .013, .011) * (.8 + .5 * pn(vec3(vW.xz * 2.3, 6.1)));
    // ---------- cỏ, vườn, xóm: cỏ khô cuối thu loang lổ, bụi cây, luống rau, đất trống ----------
    float grass = pn(vec3(vW.xz * 4.3, .9)) * .6 + pn(vec3(vW.xz * 17., 3.1)) * .4 + pn(vec3(vW.xz * .35, 5.2)) * .5;
    vec3 aCo = mix(vec3(.03, .033, .02), vec3(.062, .058, .034), sat(.5 + grass));
    float bui = smoothstep(.05, .3, pn(vec3(vW.xz * .07, 8.3)) + .25 * pn(vec3(vW.xz * .31, 2.2)));
    vec3 aVuon = mix(aCo, vec3(.016, .026, .015) * (.8 + .5 * leaf), bui);
    float luong = smoothstep(.2, .4, pn(vec3(vW.xz * .02, 9.1))) * (.5 + .5 * sin((vW.x * .8 + vW.z * .3) * 3.1416)) * (1. - smoothstep(.2, .6, fwidth(vW.x * .8)));
    aVuon = mix(aVuon, vec3(.024, .03, .016), luong * .6);
    aCo = mix(aCo, aVuon, lang);
    // ---------- rừng keo: tán cây lồi lõm từng vòm (ô tế bào ~8 m), khe tối giữa các tán ----------
    vec3 nR = n; float aoR = 1.;
    vec3 aRung = vec3(.017, .024, .016) * (.75 + .6 * pn(vec3(vW.xz * .03, 2.1)));
    if (rung > .02) {
      vec3 q = vec3(vW.xz * .016, .37);
      float c0 = cel(q);
      float far = smoothstep(.04, .2, fwidth(c0));
      float e = .006;
      vec2 g = vec2(cel(q + vec3(e, 0., 0.)) - c0, cel(q + vec3(0., e, 0.)) - c0) / e;
      nR = normalize(n + vec3(g.x, 0., g.y) * .055 * (1. - far));
      aoR = mix(1. - smoothstep(.28, .62, c0) * .8, .6, far);
      aRung *= .8 + .45 * edg(q * 1.7);
    }
    // ---------- phố: mặt đường nhựa, sân bê tông ----------
    vec3 aPho = vec3(.03, .03, .032) * (.75 + .5 * pn(vec3(vW.xz * .05, 7.7)));
    // lối đi xẻ dọc sườn đồi chè (từ đỉnh xuống), đất sáng hơn
    float ang = atan(rdv.y, rdv.x);
    float pw = abs(fract(ang * 6. / 6.2831853 + .13 + pn(vec3(rdl * .02, ang, .3)) * .04) - .5) * 6.2831853 / 6. * rdl;
    float path = (1. - smoothstep(.55, 1.1, pw)) * tea * step(8., rdl) * .55;
    float bushM = mix(.7, bush, aaK) * (1. - khoi);
    vec3 alb = mix(aDat, aTea, bushM);
    alb = mix(alb, vec3(.045, .039, .032), path);
    alb = mix(aCo, alb, tea);
    alb = mix(alb, aRung, rung);
    alb = mix(alb, aPho, pho);
    float ao = mix(1., mix(.18, 1., bush), tea * aaK * (1. - path)) * mix(1., .35, khoi * tea) * mix(1., aoR, rung);
    vec3 nm = mix(mix(n, nb, tea), nR, rung); vec3 nn = nm / max(length(nm), 1e-4);
    float shM = bongTrang(vW, n), shD = bongDong(vW, n);
    vec3 col = alb * anhTrang(nn, ao, shM * mix(1., .4, khoi * tea), shD);
    // lá chè bóng: lấp lánh nhẹ dưới trăng
    vec3 vdir = normalize(vW - uCam);
    vec3 hh = normalize(uMoonL - vdir);
    float sp = pow(max(dot(nn, hh), 0.), 60.) * tea * bush * smoothstep(.55, .85, pn(vec3(vW.xz * 9., vW.y * 9.)) + .5) * aaK;
    col += vec3(.3, .36, .45) * sp * .4 * shM;
    col += alb * dongDom(vW, nn, shD) * 3.5;
    col += songChe(vW, bush * tea * aaK + .15 * tea + .1 * lang) * mix(.4, 1., tea) * (.35 + top * .9 * tea) * (1. - pho);
    col += vongVa(vW, (bush * aaK + .2) * tea + .08) * mix(.35, 1., tea) * (1. - pho);
    if (length(vW.xz - vec2(34., -142.)) < 115.) for (int i = 0; i < 8; i++) { vec3 dl = uL[i].xyz - vW; float l2 = dot(dl, dl); col += alb * uL[i].w * max(dot(nn, dl) * inversesqrt(l2), 0.) * 30. / (l2 + 6.) * vec3(1., .6, .27) * uLK; }
    col = suong(col, vW);
    if (!(dot(col, col) < 1e8)) col = vec3(0.);   // chốt an toàn: không để điểm ảnh hỏng loé thành đốm chói
    gl_FragColor = vec4(col, 1.);
  }`;
  const SKY_V = `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); gl_Position = p.xyww; }`;
  const SKY_F = `
  varying vec3 vD;
  uniform vec3 uMoonD, uMayD; uniform float uMay;
  float nui(float az, float s, float base, float amp){ // đường núi xa theo góc phương vị
    float a = az * s;
    float r = 0.; float w = .5;
    for (int i = 0; i < 4; i++) { r += w * (1. - abs(pn(vec3(a, 1.7 + float(i), .3)) * 2.)); a *= 2.1; w *= .5; }
    return base + amp * r;
  }
  void main(){
    vec3 d = normalize(vD);
    float alt = asin(clamp(d.y, -1., 1.));
    float az = atan(d.x, -d.z);
    // trời đêm trăng: xanh thẫm, sáng dần về phía trăng (cao, bên trái) và chân trời
    vec3 zen = vec3(.0055, .0095, .024), hor = vec3(.024, .034, .052);
    vec3 col = mix(hor, zen, pow(sat(d.y), .5));
    float cm = max(dot(d, uMoonD), 0.);
    col += vec3(.035, .05, .085) * pow(cm, 5.) + vec3(.2, .24, .3) * pow(cm, 80.) * .25;
    col += vec3(.016, .013, .008) * exp(-max(alt, 0.) * 22.);
    col += vec3(.004, .012, .007) * exp(-max(alt, 0.) * 9.);           // dải khí trời phát sáng mờ
    col += vec3(.05, .03, .014) * quangPho(az) * exp(-max(alt, 0.) * 15.) * 1.3;   // quầng đèn thành phố, xóm phố hắt lên trời
    col += vec3(.035, .024, .012) * exp(-sq((az - .236) / .16)) * exp(-max(alt, 0.) * 28.);   // quầng đèn doanh trại
    // mây ti mảnh kéo dài theo gió, trăng soi bạc; trôi rất chậm
    vec2 cp = d.xz / (d.y + .1) + vec2(uS * .0035, uS * .001);
    vec2 cq = vec2(cp.x * .55 + cp.y * .3, cp.y * 2.6 - cp.x * .4);
    if (d.y > .03) {                                                     // mây chỉ có ở trời cao: dưới đó khỏi tính
      float ci = smoothstep(.12, .5, fbm4(vec3(cq * .5, .2)) + .25 * pn(vec3(cq * 2.2, 1.1))) * smoothstep(.03, .3, d.y);
      col = mix(col, vec3(.05, .062, .085) + vec3(.07, .08, .1) * pow(cm, 3.), ci * .32);
    }
    // đám mây cạnh chòm W: một dải mây tích mỏng kéo ngang; sao băng ở trong mây làm mây sáng lên từ bên trong, rồi xé mây lao ra
    float ca = dot(d, uMayD);
    if (ca > .93) {
      vec3 ax = normalize(cross(uMayD, vec3(0., 1., 0.))), ay = cross(ax, uMayD);
      vec2 q = vec2(dot(d, ax), dot(d, ay)) * vec2(3.2, 7.5);                 // toạ độ quanh tâm đám mây (kéo dài theo chiều ngang)
      float shape = 1. - smoothstep(.25, 1., length(q));
      float m = shape * 1.2 + fbm4(vec3(q * 1.3, 1.7)) * .85 + pn(vec3(q * 3.1, 3.1)) * .1 - .62;
      float dens = smoothstep(0., .45, m);
      float lit = smoothstep(-.2, .5, fbm3(vec3(q * 2.1 + vec2(.3, -.6), 5.2)) + q.y * .3);    // mặt trên hứng trăng sáng hơn
      vec3 cMoon = mix(vec3(.03, .036, .05), vec3(.075, .085, .11), lit);
      col = mix(col, cMoon, dens * .9);
      float core = exp(-dot(q, q) * 5.);
      col += vec3(.5, 1., .68) * uMay * (dens * (.08 + 1.2 * core) * (.7 + .5 * lit) + exp(-dot(q, q) * 1.6) * .1);
    }
    // núi xa hai lớp, chìm trong sương
    vec3 fogC = vec3(.072, .088, .118) + vec3(.03, .035, .04);
    if (alt < .046) {                                                    // núi xa chỉ sát chân trời
      float m1 = nui(az, 2.2, .010, .034);
      float m2 = nui(az + 1.3, 3.6, .003, .02);
      if (alt < m1) col = mix(col, vec3(.055, .068, .092), .85);
      if (alt < m2) col = mix(col, vec3(.042, .052, .072), .9);
    }
    if (alt < .0) col = fogC * .9;
    gl_FragColor = vec4(col, 1.);
  }`;
  const STAR_V = `
  attribute float aMag; attribute float aK; attribute float aSeed;
  varying vec3 vC; varying float vA;
  uniform float uPx; uniform float uLim;
  void main(){
    vec3 d = normalize(position);
    vec4 p = projectionMatrix * viewMatrix * vec4(d * 4000. + cameraPosition, 1.);
    gl_Position = p.xyww;
    float alt = d.y;
    float ext = smoothstep(-.02, .25, alt);                      // tắt dần sát chân trời
    float b = pow(2.512, -(aMag - 1.)) * smoothstep(uLim, uLim - .9, aMag) * ext;
    float tw = 1. + .35 * sin(uS * (9. + aSeed * 13.) + aSeed * 60.) * (1. - smoothstep(.0, .5, alt)) + .12 * sin(uS * 23. + aSeed * 90.);
    b *= tw;
    vC = (vec3(1.) * .3 + nhiet(aK) * .7) * b * 7.;
    vA = b;
    gl_PointSize = clamp((1.8 + 3.6 * sqrt(b)) * uPx, 1.6, 13.);
  }`;
  const STAR_F = `varying vec3 vC; varying float vA; void main(){ vec2 q = gl_PointCoord - .5; float r2 = dot(q, q) * 4.; float a = exp(-r2 * 4.5); gl_FragColor = vec4(vC * a * 2.2, 1.); }`;
  const TREE_V = `
  attribute vec4 iP; // x y z, cao
  attribute vec2 iK; // ô ảnh, lật
  varying vec2 vUv; varying vec3 vW; varying float vH;
  void main(){
    vec3 base = iP.xyz; float hgt = iP.w;
    vec3 toC = cameraPosition - base; toC.y = 0.; toC = normalize(toC);
    vec3 right = vec3(toC.z, 0., -toC.x);
    float flip = iK.y;
    vec3 wp = base + right * position.x * hgt * flip + vec3(0., (position.y + .5) * hgt, 0.);
    vW = wp; vH = position.y + .5;
    float cell = iK.x;
    vUv = vec2((mod(cell, 4.) + position.x + .5) / 4., (1. - floor(cell / 4.)) * .5 + (position.y + .5) * .5);
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
  }`;
  const TREE_F = `
  uniform sampler2D tCay;
  varying vec2 vUv; varying vec3 vW; varying float vH;
  void main(){
    vec4 c = texture2D(tCay, vUv);
    if (c.a < .45) discard;
    vec3 col = pow(c.rgb, vec3(2.2)) * 1.6;
    col *= vec3(.82, .92, 1.15);
    col += uMet * vec3(.012, .02, .016) * (.4 + vH);
    col += dongDom(vW, vec3(0., 1., 0.), 1.) * .05;
    col = suong(col, vW);
    gl_FragColor = vec4(col, 1.);
  }`;

  // ---------- dựng lưới địa hình (lưới cực quanh máy quay) ----------
  function buildTerrain(T) {
    const NR = 210, NA = 560, R0 = 0.35, R1 = 4200, A0 = 0, A1 = 2 * Math.PI;
    const nv = (NR + 1) * (NA + 1);
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), RW = new Float32Array(nv * 4), CC = new Float32Array(nv * 3);
    const k = Math.log(R1 / R0) / NR;
    let o = 0;
    for (let i = 0; i <= NR; i++) {
      const r = R0 * Math.exp(i * k);
      for (let j = 0; j <= NA; j++) {
        const a = A0 + (A1 - A0) * j / NA;
        const x = Math.sin(a) * r, z = -Math.cos(a) * r;
        const y = hDat(x, z);
        P[o * 3] = x; P[o * 3 + 1] = y; P[o * 3 + 2] = z;
        const e = Math.max(0.25, r * 0.004);
        const hx = (hDat(x + e, z) - hDat(x - e, z)) / (2 * e), hz = (hDat(x, z + e) - hDat(x, z - e)) / (2 * e);
        const l = Math.hypot(hx, 1, hz); N[o * 3] = -hx / l; N[o * 3 + 1] = 1 / l; N[o * 3 + 2] = -hz / l;
        const [bi, bv, sv] = domeAt(x, z);
        let tea = 0, rung = 0, lang = 0, row = 0, cx = x, cz = z;
        if (bi >= 0) {
          const D = DOMES[bi];
          const dd = Math.hypot(x - D[0], -z - D[1]);
          row = dd / 1.8;
          cx = D[0]; cz = -D[1];
          const dom = clamp((bv - sv) / Math.max(1, bv) * 3, 0, 1);
          const slope = Math.hypot(hx, hz);
          if (D[4] === 0) tea = dom * ss(0.02, 0.06, slope) * (1 - ss(0.95, 1.0, dd / D[3]));
          if (D[4] === 1) rung = ss(0.0, 0.35, 1 - dd / D[3]) * 0.9 + 0.1 * dom;
          if (D[4] === 2) { tea = dom * ss(0.03, 0.07, slope) * (1 - ss(58, 72, dd) * 0) * ss(64, 78, dd); }
          if (D[4] === 3) lang = ss(0.0, 0.3, 1 - dd / D[3]) * 0.9 + 0.1 * dom;
        }
        // chân đồi, thung lũng: vườn, xóm; rừng tạp ở các khe giữa đồi xa
        const pk = phoK(x, z);
        lang = Math.max(lang, (1 - tea) * langNen(x, z));
        rung = Math.max(rung, ss(0.15, 0.4, fbm(x * 0.004, z * 0.004, 2) + 0.2) * ss(500, 900, r));
        rung *= 1 - pk; lang *= 1 - pk; tea *= 1 - pk;
        RW[o * 4] = row; RW[o * 4 + 1] = tea; RW[o * 4 + 2] = rung; RW[o * 4 + 3] = lang;
        CC[o * 3] = cx; CC[o * 3 + 1] = cz; CC[o * 3 + 2] = pk;
        o++;
      }
    }
    const idx = [];
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
      const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('normal', new T.BufferAttribute(N, 3));
    g.setAttribute('aRow', new T.BufferAttribute(RW, 4)); g.setAttribute('aC', new T.BufferAttribute(CC, 3));
    g.setIndex(idx);
    return g;
  }

  // ---------- cây ----------
  function buildTrees(T, U, them) {
    const items = [];
    let s = 31;
    const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const add = (x, z, hgt, cell) => { items.push([x, hDat(x, z) - 0.4, z, hgt, cell, r() < 0.5 ? 1 : -1]); };
    // rừng keo trên các đồi (dày ở đồi gần), cây lác đác ở chân đồi chè, vườn cây quanh xóm
    DOMES.forEach((D, i) => {
      if (i <= 2) return;   // đồi máy quay, đồi trại, đồi chè tròn (chỗ sao băng rơi): để trống cho sạch khung hình
      const dist = Math.hypot(D[0], D[1]);
      const cnt = D[4] === 1 ? Math.floor((dist < 900 ? 70 : 30) + D[3] / (dist < 900 ? 2.5 : 5)) : D[4] === 3 ? Math.floor(26 + D[3] / 3) : (r() < 0.7 ? 3 + Math.floor(r() * 6) : 0);
      for (let k = 0; k < cnt; k++) {
        const a = r() * 6.283, rr = Math.sqrt(r()) * D[3] * (D[4] === 0 ? 0.98 : 0.85);
        if (D[4] === 0 && rr < D[3] * 0.72) continue;               // đồi chè: cây chỉ ở chân đồi
        const x = D[0] + Math.cos(a) * rr, n = D[1] + Math.sin(a) * rr;
        if (phoK(x, -n) > 0.3) continue;
        const far = dist > 900;
        add(x, -n, (far ? 15 : 11) + r() * 9, far ? 6 : D[4] === 3 ? [3, 4, 5, 7, 0, 6][Math.floor(r() * 6)] : [0, 1, 2, 6, 0][Math.floor(r() * 5)]);
      }
    });
    // thung lũng, chân đồi quanh trại: vườn cây, bụi tre, hàng cây ven đường (không mọc trên đồi chè, sân trại, thành phố)
    for (let k = 0; k < 1400; k++) {
      const a = r() * 6.283, rr = 60 + Math.pow(r(), 0.75) * 900, x = Math.sin(a) * rr, z = -Math.cos(a) * rr;
      if (phoK(x, z) > 0.15) continue;
      const lg = langNen(x, z), dm = domeAt(x, z), D = dm[0] >= 0 ? DOMES[dm[0]] : null;
      if (D && (D[4] === 0 || D[4] === 2) && dm[1] > 2) continue;
      if (Math.hypot(x - 34, z + 142) < 70) continue;
      if (r() > lg * 1.15 + 0.08) continue;
      add(x, z, 7 + r() * 8, [3, 4, 5, 7, 0, 1, 6][Math.floor(r() * 7)]);
    }
    // quanh mặt bằng doanh trại: cây bóng mát, bụi tre ở mép đồi
    const C = DOMES[1];
    for (let k = 0; k < 11; k++) { const a = (-160 + k * 22 + r() * 8) * D2R; const rr = 58 + r() * 8; add(C[0] + Math.sin(a) * rr, -(C[1] + Math.cos(a) * rr), 10 + r() * 5, r() < 0.7 ? 3 : 0); }
    [[-30, 118], [72, 120], [-22, 190], [80, 175], [0, 205], [60, 200]].forEach((p) => add(p[0], -p[1], 8.5 + r() * 4, 4 + Math.floor(r() * 2)));
    // tiền cảnh: bụi tre bên trái mép khung, cây keo mép phải
    add(-16, -6, 9, 4); add(-20, -1, 7.5, 5);
    add(10, -17, 13, 0);
    // cây bóng mát rải rác giữa nương chè
    DOMES.slice(2, 12).forEach((D) => { const m = 2 + Math.floor(r() * 3); for (let k = 0; k < m; k++) { const a = r() * 6.283, rr = r() * D[3] * 0.6; add(D[0] + Math.cos(a) * rr, -(D[1] + Math.sin(a) * rr), 9 + r() * 6, [0, 1, 3][Math.floor(r() * 3)]); } });
    // keo dọc khe thung lũng bên trái
    for (let k = 0; k < 18; k++) add(-140 - r() * 120, -(90 + r() * 160), 12 + r() * 6, [0, 1, 2][Math.floor(r() * 3)]);
    (them || []).forEach((c) => add(c[0], c[1], c[2], c[3]));
    const n = items.length;
    const ig = new T.InstancedBufferGeometry();
    const base = new T.PlaneGeometry(1, 1);
    ig.index = base.index; ig.setAttribute('position', base.attributes.position);
    const iP = new Float32Array(n * 4), iK = new Float32Array(n * 2);
    items.forEach((it, i) => { iP.set([it[0], it[1], it[2], it[3]], i * 4); iK.set([it[4], it[5]], i * 2); });
    ig.setAttribute('iP', new T.InstancedBufferAttribute(iP, 4)); ig.setAttribute('iK', new T.InstancedBufferAttribute(iK, 2));
    ig.instanceCount = n;
    const tCay = SN.taiAnh('anh/cay.png'); tCay.wrapS = tCay.wrapT = T.ClampToEdgeWrapping;
    const mat = new T.ShaderMaterial({ uniforms: Object.assign({}, U, { tCay: { value: tCay } }), vertexShader: TREE_V, fragmentShader: SN_GLSL.CHUNG + CHUNG3 + TREE_F });
    const m = new T.Mesh(ig, mat); m.frustumCulled = false;
    return m;
  }
  SN.dat.buildTrees = buildTrees;


  SN.dat.CHUNG3 = CHUNG3;

  // sao băng, mảnh tách, đốm sáng, tàn lửa: c-saobang.js (vẽ trong không gian 3D)

  // ---------- máy quay ----------
  // Các cảnh quay (cắt đúng phách; cú đánh mạnh nhất của đoạn nhạc ở 217.6, cao trào ở 228.85):
  //  2 · 207.65 chờ nửa đêm: máy thấp giữa hàng chè ở sườn bắc đồi chè; giữa khung là quả đồi chè tròn cạnh trại, trại bên phải,
  //      thành phố phía sau, mép trên là đám mây cạnh chòm W (bắt đầu sáng lên từ bên trong lúc 210.4)
  //  3 · 211.72 sao băng xé mây lao ra, cắm dần về quả đồi phía trước: máy ngóc lên một chút, đẩy vào chậm, rung nhẹ theo tiếng gầm
  //  4 · 215.85 nhìn ngang từ nóc một khu chung cư phía đông: sao băng vạch chéo từ trên phải xuống, lướt qua sau doanh trại
  //  5 · 216.95 sát đỉnh đồi chè tròn, máy thấp nhìn ngược lên đường bay: nó lao thẳng xuống… 217.62 va chạm (loé trắng)
  //  6 · 217.62 về lại sườn đồi chè, ống kính dài: quầng sáng nở, sóng sáng chạy theo hàng chè, tàn lửa, khói; 19 đốm sáng bay lên
  //  7 · 221.72 máy rời đồi, theo các đốm sáng qua thung lũng; đốm đáp tới đâu đất sáng lan tới đó; lên dần tới cửa sổ của em
  const T_S3 = 211.72, T_S4 = 215.85, T_S5 = 216.95, T_S6 = 217.62, T_S7 = 221.72;
  // [S, x, cao trên mặt đất (m), z, hướng (độ, liên tục), ngóc (độ), góc nhìn dọc]
  const CAM2 = SN.duong([
    [207.65, -4.6, 10.5, 4.6, 343, -2.5, 52],     // từ trên cao: thấy rõ quả đồi chè tròn, doanh trại, thành phố
    [209.4, -3.7, 4.4, 2.3, 343.2, 4, 54],
    [211.0, -2.9, 1.35, 0.8, 343.4, 10.5, 56],    // hạ xuống giữa hàng chè
    [211.72, -2.8, 1.25, 0.4, 343.5, 12.5, 57],
    [213.6, -2.65, 1.25, -0.4, 342.2, 14.5, 52],
    [215.85, -2.55, 1.26, -1.0, 341.5, 15.5, 48],
  ]);
  // [S, x, độ cao tuyệt đối (m), z, hướng, ngóc, góc nhìn]
  const CAMK = SN.duong([
    [221.72, -5.5, 3.6, 1.0, 343.5, 1.8, 30],
    [225.0, -3.0, 5.5, -16, 348, 1.5, 38],
    [229.0, 3.0, 6.6, -38, 357, 1.2, 40],
    [233.0, 10.0, 6.6, -52, 364, 1.2, 36],
    [237.0, 17.0, 6.6, -62, 368, 1.0, 30],
    [242.0, 20.0, 8.4, -70, 372, 0.4, 13],
  ]);
  let SB = null, SH = null;   // sao băng (c-saobang.js), các điểm đặt máy (tính lúc dựng)
  const CAM = { pos: [0, 0, 0], tgt: [0, 0, 0], fov: 56, roll: 0, canh: 2 };
  const DCQ = SN.NHA && SN.Q.get('dc') ? SN.Q.get('dc').split(',').map(Number) : null;
  const ssC = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const nrm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  function huong(pos, yawD, pitD) {
    const yaw = yawD * D2R, pit = pitD * D2R;
    return [pos[0] + Math.sin(yaw) * Math.cos(pit) * 10, pos[1] + Math.sin(pit) * 10, pos[2] - Math.cos(yaw) * Math.cos(pit) * 10];
  }
  function tuKhoa(c, tuongDoi) {   // khoá máy quay → vị trí + điểm nhìn (tuongDoi: độ cao tính từ mặt đất)
    const g = hDat(c[0], c[2]);
    const y = tuongDoi ? g + c[1] : Math.max(g + 1.3, c[1]);
    CAM.pos = [c[0], y, c[2]];
    CAM.tgt = huong(CAM.pos, c[3], c[4]);
    CAM.fov = c[5]; CAM.roll = 0;
  }
  function nhinVe(p, k) {   // xoay dần hướng nhìn về điểm p (k: 0 giữ nguyên, 1 nhìn thẳng vào p)
    const a = nrm3([CAM.tgt[0] - CAM.pos[0], CAM.tgt[1] - CAM.pos[1], CAM.tgt[2] - CAM.pos[2]]);
    const b = nrm3([p[0] - CAM.pos[0], p[1] - CAM.pos[1], p[2] - CAM.pos[2]]);
    const d = nrm3([mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)]);
    CAM.tgt = [CAM.pos[0] + d[0] * 10, CAM.pos[1] + d[1] * 10, CAM.pos[2] + d[2] * 10];
  }
  const nhinHuong = (p) => { const d = [p[0] - CAM.pos[0], p[1] - CAM.pos[1], p[2] - CAM.pos[2]]; return [Math.atan2(d[0], -d[2]) / D2R, Math.atan2(d[1], Math.hypot(d[0], d[2])) / D2R]; };
  const _m = [0, 0, 0, 0];
  function camAt(S) {
    if (DCQ) {
      CAM.pos = [DCQ[0], DCQ[1], DCQ[2]]; CAM.tgt = huong(CAM.pos, DCQ[3], DCQ[4]);
      CAM.fov = DCQ[5]; CAM.roll = 0; CAM.canh = 0; return CAM;
    }
    if (!SB || S < T_S4) {
      // cảnh 2–3: sườn bắc đồi chè; từ lúc sao băng ló ra, máy theo nó một phần (không giật)
      CAM.canh = S < T_S3 ? 2 : 3;
      tuKhoa(CAM2(Math.min(S, T_S4)), true);
      if (SB && S > T_S3) nhinVe(SB.posAt(S - 0.15), 0.2 * ssC(T_S3 + 0.15, T_S3 + 1.6, S));
    } else if (S < T_S5) {
      // cảnh 4: nóc chung cư phía đông, nhìn sang tây; lia chậm sang trái theo sao băng
      CAM.canh = 4;
      const k = ssC(T_S4, T_S5, S);
      CAM.pos = SH.V.slice();
      CAM.tgt = huong(CAM.pos, mix(283, 275, k), mix(9, 7, k));
      nhinVe(SB.posAt(S), 0.18);
      CAM.fov = mix(47, 45, k); CAM.roll = 0;
    } else if (S < T_S6) {
      // cảnh 5: sát đỉnh đồi chè tròn phía đông nam, thấp ngang ngọn chè, nhìn ngược lên đường bay
      CAM.canh = 5;
      const k = (S - T_S5) / (T_S6 - T_S5);
      CAM.pos = [SH.C5[0], SH.C5[1] - 0.12 * k, SH.C5[2]];
      CAM.tgt = huong(CAM.pos, mix(320, 317, k), mix(15, 9, k));
      CAM.fov = mix(60, 64, k); CAM.roll = mix(0, -3, k) * D2R;
    } else if (S < T_S7) {
      // cảnh 6: sườn đồi chè, ống kính dài nhìn sang quả đồi bị va chạm; ngước theo các đốm sáng bay lên
      CAM.canh = 6;
      const k = ssC(T_S6, T_S7, S);
      CAM.pos = SH.C6.slice();
      const h = nhinHuong([SB.IMP[0], SB.IMP[1] + 4, SB.IMP[2]]);
      CAM.tgt = huong(CAM.pos, h[0] + mix(1.5, 3.5, k), h[1] + mix(2, 5.5, ssC(219, 221.6, S)));
      CAM.fov = mix(31, 29, k); CAM.roll = 0;
    } else {
      CAM.canh = 7;
      tuKhoa(CAMK(S));
      const kw = ease((S - 230) / 7.5);
      if (kw > 0 && SN.dat.cuaSo) nhinVe(SN.dat.cuaSo, kw);
    }
    // rung máy: tiếng gầm khi sao băng lại gần, cú sốc va chạm tới chỗ máy quay theo khoảng cách
    if (SB && S > T_S3 && S < 224) {
      const r = SB.rung(S, CAM.pos);
      CAM.pos = [CAM.pos[0] + r[0], CAM.pos[1] + r[1], CAM.pos[2] + r[2]];
      CAM.tgt = [CAM.tgt[0] + r[0] * 0.4, CAM.tgt[1] + r[1] * 0.4, CAM.tgt[2] + r[2] * 0.4];
      CAM.roll += r[3];
    }
    return CAM;
  }
  SN.dat.camAt = camAt;

  SN.dung.push((T) => {
    const moonAlt = 72.6 * D2R, moonAz = 275.3 * D2R;
    const moonD = new T.Vector3(Math.cos(moonAlt) * Math.sin(moonAz), Math.sin(moonAlt), -Math.cos(moonAlt) * Math.cos(moonAz));
    const la = 63 * D2R, lz = 266 * D2R; // hướng chiếu sáng: trăng thật cao 72.6° ở phía tây; hạ một chút cho bóng đổ còn rõ
    const lightD = new T.Vector3(Math.cos(la) * Math.sin(lz), Math.sin(la), -Math.cos(la) * Math.cos(lz));
    const v3 = () => { const a = []; for (let i = 0; i < 19; i++) a.push(new T.Vector3(0, -999, 0)); return a; };
    const v2 = () => { const a = []; for (let i = 0; i < 19; i++) a.push(new T.Vector2(0, 0)); return a; };
    // bóng đổ: hai tấm độ sâu (trăng: tính một lần; động: sao băng / mảnh sáng, vẽ lại mỗi khung khi cần)
    const depthRT = (n) => {
      const rt = new T.WebGLRenderTarget(n, n, { depthBuffer: true, stencilBuffer: false });
      const dt = new T.DepthTexture(n, n); dt.type = T.UnsignedIntType; dt.format = T.DepthFormat;
      dt.compareFunction = T.LessEqualCompare; dt.minFilter = dt.magFilter = T.LinearFilter;
      rt.depthTexture = dt; rt.texture.generateMipmaps = false;
      return rt;
    };
    const rtM = depthRT(2048), rtD = depthRT(SN.DT ? 1024 : 2048);
    const U = Object.assign({}, SN.uChung, {
      uMoonL: { value: lightD }, uMet: { value: 0 }, uMetP: { value: new T.Vector3(0, 1, 0) },
      uMoonC: { value: new T.Vector3(0.21, 0.26, 0.4) }, uSkyC: { value: new T.Vector3(0.019, 0.026, 0.044) },
      uMP: { value: v3() }, uMI: { value: new Array(19).fill(0) }, uRP: { value: v2() }, uRT: { value: new Array(19).fill(9999) },
      uFogK: { value: 0.0011 }, uCam: { value: new T.Vector3() }, uYV: { value: Y_THUNG }, uFP: { value: new T.Vector4(0, -999, 0, 0) },
      tBM: { value: rtM.depthTexture }, tBD: { value: rtD.depthTexture }, uBMm: { value: new T.Matrix4() }, uBDm: { value: new T.Matrix4() },
      uBMp: { value: new T.Vector4(1.6 / 2048, 0, 0.22, 0) }, uBDp: { value: new T.Vector4(1.5 / rtD.width, 0, 0.3, 0) },
      uChe: { value: new T.Vector4(0, 46, 0, 0) }, uChe2: { value: new T.Vector4(0, 0, 0, 0) }, uIMP: { value: new T.Vector4(0, -999, 0, 9999) }, uMay: { value: 0 }, uMayD: { value: new T.Vector3(0, 1, 0) },
    });
    const group = new T.Group();
    // trời
    const skyM = new T.ShaderMaterial({ uniforms: Object.assign({}, U, { uMoonD: { value: moonD } }),
      vertexShader: SKY_V, fragmentShader: SN_GLSL.CHUNG + CHUNG3 + SKY_F, depthWrite: false, depthTest: false, side: T.BackSide });
    const sky = new T.Mesh(new T.SphereGeometry(10, 48, 24), skyM); sky.frustumCulled = false; sky.userData.ro = -9; group.add(sky);
    // sao
    const SD = window.SN_SAO.d, ns = SD.length / 5;
    const sp = new Float32Array(ns * 3), sm = new Float32Array(ns), sk = new Float32Array(ns), se = new Float32Array(ns);
    for (let i = 0; i < ns; i++) { sp.set([SD[i * 5], SD[i * 5 + 1], SD[i * 5 + 2]], i * 3); sm[i] = SD[i * 5 + 3]; sk[i] = SD[i * 5 + 4]; se[i] = (i * 0.6180339) % 1; }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); sg.setAttribute('aMag', new T.BufferAttribute(sm, 1)); sg.setAttribute('aK', new T.BufferAttribute(sk, 1)); sg.setAttribute('aSeed', new T.BufferAttribute(se, 1));
    const starM = new T.ShaderMaterial({ uniforms: Object.assign({}, U, { uPx: { value: 1 }, uLim: { value: 4.4 } }), vertexShader: SN_GLSL.CHUNG + STAR_V, fragmentShader: STAR_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false, depthTest: false });
    const stars = new T.Points(sg, starM); stars.frustumCulled = false; stars.userData.ro = -8; group.add(stars);
    // địa hình
    const terM = new T.ShaderMaterial({ uniforms: U, vertexShader: TER_V, fragmentShader: SN_GLSL.CHUNG + CHUNG3 + TER_F, extensions: { derivatives: true } });
    const ter = new T.Mesh(buildTerrain(T), terM); ter.frustumCulled = false; group.add(ter);
    // nhà cửa: doanh trại nhiều dãy nhà tầng, xóm phố, thành phố xa, đường, đèn, xe (c-nha.js)
    const nha = SN.dat.dungNha(T, U);
    group.add(nha.mesh); group.add(nha.co); group.add(nha.vungMesh); group.add(nha.sangP); group.add(nha.xeP);
    terM.uniforms.uL = { value: nha.lamps }; terM.uniforms.uLK = { value: 1.5 };
    // cây
    const trees = buildTrees(T, U, nha.cay); group.add(trees);
    group.visible = false;
    // hàng chè dựng khối (c-che.js): cả quả đồi chè tròn cạnh trại (chỗ sao băng rơi), một mảng sườn đồi trước máy quay
    const D2 = DOMES[2], CHE1 = [D2[0], -D2[1]], CHE2 = [-4, -8];
    const che = SN.dat.dungChe(T, U, [
      { cx: D2[0], cz: -D2[1], r0: 0, r1: 44, keep: (x, z) => x > -88 && Math.hypot(x - 34, z + 142) > 60, taper: (x, z) => 1 - ss(40, 44, Math.hypot(x - CHE1[0], z - CHE1[1])) },
      { cx: 0, cz: 46, r0: 30, r1: 90, keep: (x, z) => z < 10 && Math.hypot(x - CHE2[0], z - CHE2[1]) < 34, taper: (x, z) => 1 - ss(27, 34, Math.hypot(x - CHE2[0], z - CHE2[1])) },
    ]);
    group.add(che.mesh);
    U.uChe.value.set(CHE1[0], CHE1[1], 39, 44.5); U.uChe2.value.set(CHE2[0], CHE2[1], 26, 33.5);
    // ---------- cảnh vẽ bóng: cùng hình khối, chỉ ghi độ sâu ----------
    const sceneB = new T.Scene();
    const depM = new T.ShaderMaterial({ vertexShader: 'void main(){ gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }', fragmentShader: 'void main(){}', colorWrite: false, side: T.DoubleSide });
    const treeDep = new T.ShaderMaterial({ uniforms: trees.material.uniforms, vertexShader: TREE_V, fragmentShader: 'uniform sampler2D tCay; varying vec2 vUv; void main(){ if (texture2D(tCay, vUv).a < .45) discard; }', colorWrite: false, side: T.DoubleSide });
    const bongVat = [new T.Mesh(ter.geometry, depM), new T.Mesh(nha.mesh.geometry, depM), new T.Mesh(trees.geometry, treeDep), new T.Mesh(nha.co.geometry, nha.coDep), new T.Mesh(che.geo, depM)];
    bongVat.forEach((m) => { m.frustumCulled = false; sceneB.add(m); });
    SN.dat.themBong = (geo, mat) => { const m = new T.Mesh(geo, mat || depM); m.frustumCulled = false; sceneB.add(m); return m; };
    SN.dat.depM = depM;
    // trăng: chiếu trực giao theo hướng trăng, phủ đồi máy quay, thung lũng và doanh trại (≈0.15 m một ô)
    const camM = new T.OrthographicCamera(-150, 150, 150, -150, 1, 2200);
    { const c = new T.Vector3(0, -6, -75); camM.position.copy(c).addScaledVector(lightD, 1000); camM.up.set(0, 1, 0); camM.lookAt(c); camM.updateMatrixWorld(); camM.updateProjectionMatrix(); }
    U.uBMm.value.multiplyMatrices(camM.projectionMatrix, camM.matrixWorldInverse);
    const camDo = new T.OrthographicCamera(-230, 230, 230, -230, 1, 5000), camDp = new T.PerspectiveCamera(90, 1, 0.4, 1200);
    let daNuong = false;
    function veBong(rt, cam) {
      const r = SN.renderer();
      r.setRenderTarget(rt); r.clear(false, true, false); r.render(sceneB, cam);
    }
    SN.dat.bong = { sceneB, camM, camDo, camDp, rtM, rtD };
    SN.scene().add(group);
    const an = SN.NHA ? (SN.Q.get('an') || '') : '';
    if (an.includes('s')) stars.visible = false; if (an.includes('c')) trees.visible = false; if (an.includes('t')) ter.visible = false; if (an.includes('k')) sky.visible = false;
    group.userData.an = an;
    if (an.includes('n')) { nha.mesh.visible = false; nha.co.visible = false; } if (an.includes('g')) { nha.sangP.visible = false; nha.vungMesh.visible = false; }
    // ---------- sao băng: một đường thẳng từ hướng sao Eta Cassiopeiae (chòm W) cắm xuống đỉnh đồi chè ----------
    const etaD = window.SN_SAO.eta, eL = Math.hypot(etaD[0], etaD[1], etaD[2]);
    const E = [etaD[0] / eL, etaD[1] / eL, etaD[2] / eL];
    const IMP = [DOMES[2][0], hDat(DOMES[2][0], -DOMES[2][1]) + 0.4, -DOMES[2][1]];
    SB = SN.dat.dungSaoBang(T, U, { E, IMP, tC: SN.dat.tC, Yp: SN.dat.Yp, hDat, cuaSo: SN.dat.cuaSo, cuaSoN: SN.dat.cuaSoN || [0, 0, 1] });
    group.add(SB.group);
    SN.dat.SB = SB; SN.dat.moteAt = SB.moteAt; SN.dat.MOTES = SB.MOTES;
    SB.MOTES.forEach((mo, i) => { U.uRP.value[i].set(mo.L[0], mo.L[2]); U.uRT.value[i] = mo.tLand; });
    U.uIMP.value.set(IMP[0], IMP[1], IMP[2], SB.T_IMP);
    const P_RA = SB.posAt(SB.T_RA);   // chỗ sao băng xé mây lao ra
    // các điểm đặt máy
    {
      const nv = SN.dat.nocV;   // nóc chung cư phía đông (c-nha.js)
      const c5x = IMP[0] + 10.5, c5z = IMP[2] + 8.5;
      SH = {
        V: nv ? [nv[0], nv[1] + 1.65, nv[2]] : [340, 25, -250],
        C5: [c5x, hDat(c5x, c5z) + 1.2, c5z],
        C6: [-5.5, hDat(-5.5, 1) + 3.6, 1],
      };
    }
    const cP3 = [0, 0, 0];
    const tamBong = new T.Vector3(-10, -6, -62), _v = new T.Vector3();
    const coP = SN.dat.tC(0, 15, 40);
    SN.them({
      ten: 'dat', tu: 207.65, den: 242, lop: 70, group, warmS: 214,
      a: (S) => 1,
      may(S, cam) {
        const c = camAt(S);
        cam.position.set(c.pos[0], c.pos[1], c.pos[2]);
        if (c.roll) {   // nghiêng máy quanh trục nhìn
          const f = nrm3([c.tgt[0] - c.pos[0], c.tgt[1] - c.pos[1], c.tgt[2] - c.pos[2]]), rt = nrm3(cross3(f, [0, 1, 0])), u0 = cross3(rt, f);
          cam.up.set(u0[0] * Math.cos(c.roll) + rt[0] * Math.sin(c.roll), u0[1] * Math.cos(c.roll) + rt[1] * Math.sin(c.roll), u0[2] * Math.cos(c.roll) + rt[2] * Math.sin(c.roll));
        } else cam.up.set(0, 1, 0);
        cam.lookAt(c.tgt[0], c.tgt[1], c.tgt[2]);
        cam.fov = c.fov; cam.near = 0.1; cam.far = 9000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
        U.uCam.value.copy(cam.position);
        SN.uChung.uPxA.value = 2 * Math.tan(c.fov * D2R / 2) / Math.max(1, SN.size()[1]);
        starM.uniforms.uPx.value = SN.size()[1] / 900;
        nha.uPx(SN.size()[1] / 900);
        const md = nrm3([P_RA[0] - c.pos[0], P_RA[1] - c.pos[1], P_RA[2] - c.pos[2]]);
        U.uMayD.value.set(md[0], md[1], md[2]);
      },
      cap(S, a) {
        if (!daNuong) {   // bóng trăng: nướng một lần (lúc làm nóng shader, ảnh đã tải xong); tấm bóng động cũng phải cấp phát trước khi đọc
          daNuong = true; veBong(rtM, camM); U.uBMp.value.y = 1;
          const r = SN.renderer(); r.setRenderTarget(rtD); r.clear(false, true, false);
        }
        nha.mat.uniforms.uThuy.value = 0.85 + 0.12 * Math.sin(S * 1.3) + 0.06 * Math.sin(S * 4.1 + 1) + 2.2 * ease((S - 238.6) / 1.6);
        nha.cap(S, U.uCam.value);
        nha.coM.uniforms.uGio.value = SB.gio(S, coP);
        cP3[0] = U.uCam.value.x; cP3[1] = U.uCam.value.y; cP3[2] = U.uCam.value.z;
        SB.cap(S, cP3);
        // ---------- bóng động: sao băng ở xa (chiếu song song), lại gần (đèn điểm), va chạm (đèn điểm trên đỉnh đồi, chiếu xuống) ----------
        const bd = U.uBDp.value;
        bd.y = 0;
        if (S > SB.T_RA && S < SB.T_IMP) {
          const d = SB.dOf(S), hp = SB.posAt(S);
          if (d > 700) {
            _v.set(hp[0], hp[1], hp[2]).sub(tamBong).normalize();
            camDo.position.copy(tamBong).addScaledVector(_v, 1600); camDo.up.set(0, 1, 0); camDo.lookAt(tamBong); camDo.updateMatrixWorld(); camDo.updateProjectionMatrix();
            veBong(rtD, camDo); U.uBDm.value.multiplyMatrices(camDo.projectionMatrix, camDo.matrixWorldInverse);
            bd.w = 0; bd.y = clamp(SB.headI(S), 0, 1); bd.x = 1.5 / rtD.width; bd.z = 0.3;
          } else {
            const k = ssC(700, 60, d);
            const tg = [mix(tamBong.x, SB.IMP[0], k), mix(tamBong.y, SB.IMP[1], k), mix(tamBong.z, SB.IMP[2], k)];
            const dist = Math.hypot(tg[0] - hp[0], tg[1] - hp[1], tg[2] - hp[2]);
            camDp.position.set(hp[0], hp[1], hp[2]); camDp.up.set(0, 1, 0); camDp.lookAt(tg[0], tg[1], tg[2]);
            camDp.fov = clamp(2 * Math.atan(170 / Math.max(dist, 1)) / D2R, 40, 150); camDp.near = 0.5; camDp.far = dist + 500; camDp.updateMatrixWorld(); camDp.updateProjectionMatrix();
            veBong(rtD, camDp); U.uBDm.value.multiplyMatrices(camDp.projectionMatrix, camDp.matrixWorldInverse);
            bd.w = 1; bd.y = 1; bd.x = 1.2 / rtD.width; bd.z = 0.25;
          }
        } else if (S >= SB.T_IMP && S < 223) {
          const P = SB.IMP;
          camDp.position.set(P[0], P[1] + 6, P[2]); camDp.up.set(0, 0, -1); camDp.lookAt(P[0], P[1] - 20, P[2] + 0.01);
          camDp.fov = 150; camDp.near = 0.5; camDp.far = 300; camDp.updateMatrixWorld(); camDp.updateProjectionMatrix();
          veBong(rtD, camDp); U.uBDm.value.multiplyMatrices(camDp.projectionMatrix, camDp.matrixWorldInverse);
          bd.w = 1; bd.y = 1 - ssC(221, 223, S); bd.x = 1.2 / rtD.width; bd.z = 0.2;
        }
        // ---------- ống kính: lấy nét, độ nhoè trước/sau theo từng cảnh; sương hắt sáng quanh các nguồn sáng ----------
        {
          const C = camAt(S), cp = C.pos, dist = (p) => Math.hypot(p[0] - cp[0], p[1] - cp[1], p[2] - cp[2]);
          let f = 170, k = 0.6, mx = 8;
          if (C.canh === 2) { f = 175; k = 0.75; }                                                // nét ở quả đồi, doanh trại; ngọn chè trước mặt nhoè khi máy hạ xuống
          else if (C.canh === 3) { f = mix(175, 420, ssC(T_S3, T_S3 + 2.5, S)); k = 0.55; }
          else if (C.canh === 4) { f = dist([34, 4, -142]); k = 0.4; }
          else if (C.canh === 5) { f = 13; k = 1.15; }
          else if (C.canh === 6) { f = dist(SB.IMP); k = 1.6; mx = 9; }
          else if (C.canh === 7) {
            const kw = ssC(229, 237, S);
            f = mix(dist(SB.IMP), dist(SN.dat.cuaSo), kw); k = mix(0.7, 1.4, ssC(234, 240, S)); mx = 9;
          }
          k *= 1 - ssC(239.4, 240.1, S);   // sang cảnh kẹp tóc: thôi nhoè
          const den = [];
          const fp = U.uFP.value;
          if (fp.w > 0.01) den.push([fp.x, fp.y, fp.z, fp.w * 6, 1, 0.82, 0.62]);
          for (let i = 0; i < 19; i++) { const m = U.uMP.value[i], I = U.uMI.value[i]; if (I > 0.01) den.push([m.x, m.y, m.z, I * 55, 1, 0.74, 0.42]); }
          const tat = 1 - ssC(239.6, 240.4, S);
          den.forEach((l) => { l[3] *= tat; });
          SN.dof = { f: Math.max(f, 0.5), k, max: mx, den, mist: [0.00045, Y_THUNG, 6, 3.2] };
        }
        // ---------- hậu kỳ theo cảnh ----------
        const cn = camAt(S).canh, ti = S - SB.T_IMP;
        const loe = ti > 0 ? Math.exp(-ti / 0.07) * 0.95 + Math.exp(-ti / 0.5) * 0.12 : 0;
        const gamTo = S > SB.T_RA && S < SB.T_IMP ? Math.min(1, SB.headI(S)) : 0;
        SN.gradeMix({ exp: 1.65, bloom: 0.9 + 0.25 * gamTo, thr: 1.0, streak: 0.42 + 0.25 * gamTo, sat: 0.92, con: 1.1, vig: 0.5, grain: 0.035, ca: 0.006, bars: 1,
          lift: [0.006, 0.009, 0.017], gain: [1.0, 1.0, 1.03], sc: [0.55, 0.85, 0.75], white: loe }, a);
        if (cn === 5) SN.gradeMix({ bloom: 1.0, streak: 0.4, thr: 1.3 }, a);
      },
    });
  });
})();
