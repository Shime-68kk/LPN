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
  // các quả đồi bát úp: [x, bắc, cao, bán kính, loại (0 chè, 1 rừng, 2 trại)]
  // 0: đồi máy quay (đứng gần đỉnh, nhìn ra thung lũng) · 1: đồi doanh trại (đỉnh cắt bằng) · còn lại: đồi chè thấp dưới thung lũng, rặng rừng xa
  const DOMES = [[0, -46, 31, 128, 0], [34, 142, 33, 120, 2],
    [-72, 176, 12, 78, 0], [-182, 268, 15, 104, 0], [62, 306, 11, 86, 0], [-26, 424, 17, 120, 0], [-276, 150, 10, 72, 0], [152, 236, 9, 70, 0], [-118, 66, 7, 60, 0],
    [-130, 560, 13, 108, 0], [190, 470, 15, 112, 0], [-360, 420, 18, 138, 0],
    [-430, 920, 58, 390, 1], [260, 1320, 72, 460, 1], [-930, 1520, 82, 530, 1], [720, 1930, 62, 520, 1], [0, 2450, 95, 720, 1], [-1500, 2200, 90, 650, 1], [1300, 1500, 55, 480, 1]];
  {
    let s = 9;
    const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 0; i < 60; i++) {
      const az = (338 + (r() - 0.5) * 200) * D2R, dist = 700 + Math.pow(r(), 0.7) * 3200;
      DOMES.push([Math.sin(az) * dist, Math.cos(az) * dist, 16 + r() * 50 * (0.45 + dist / 3500), 150 + r() * 330, r() < 0.55 ? 1 : 0]);
    }
    // phía nam (sau lưng đồi máy quay): đồi chè thấp gần, đồi rừng xa — chỉ thấy khi máy bay theo mảnh sáng
    for (let i = 0; i < 26; i++) {
      const az = (158 + (r() - 0.5) * 170) * D2R, dist = 260 + Math.pow(r(), 0.8) * 3000;
      DOMES.push([Math.sin(az) * dist, Math.cos(az) * dist, 10 + r() * 40 * (0.4 + dist / 3000), 110 + r() * 300, dist < 700 ? (r() < 0.6 ? 0 : 1) : (r() < 0.7 ? 1 : 0)]);
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
    h += fbm(x * 0.03, n * 0.03, 2) * 0.7;
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
  SN.dat = { hDat, domeAt, DOMES };

  // ---------- shader chung cho mặt đất / cây / nhà ----------
  const CHUNG3 = `
  uniform vec3 uMoonL;       // hướng trăng
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
  float quangPho(float az){ // ánh đèn thành phố / xóm hắt lên sương, theo phương vị (rad, 0 = bắc, dương = đông)
    float a1 = abs(mod(az + 1.06 + PI, TAU) - PI), a2 = abs(mod(az - .78 + PI, TAU) - PI), a3 = abs(mod(az + .5 + PI, TAU) - PI);
    return exp(-a1 * a1 / .045) + .35 * exp(-a2 * a2 / .02) + .25 * exp(-a3 * a3 / .03);
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
    fc = mix(vec3(.105, .125, .16), vec3(.07, .085, .115), smoothstep(0., 30., hv));
    fc += uMet * vec3(.08, .12, .1);
    fc += vec3(.05, .03, .014) * quangPho(atan(dv.x, -dv.z)) * smoothstep(200., 1300., dist) * exp(-max(hv, 0.) / 40.);
    return clamp(1. - exp(-dist * dens), 0., 1.);
  }
  vec3 suong(vec3 col, vec3 wp){ vec3 fc; float f = suongF(wp, fc); return mix(col, fc, f); }
  vec3 anhTrang(vec3 n, float ao){
    float d = max(dot(n, uMoonL), 0.);
    vec3 L = vec3(.36, .42, .55) * d * 2.6;
    L += vec3(.05, .066, .1) * (.55 + .45 * n.y) * ao * 1.25;           // trời
    L += uMet * vec3(.55, .8, .7) * (.35 + .65 * max(dot(n, uMetP), 0.));
    return L;
  }
  vec3 dongDom(vec3 wp, vec3 n){ // ánh ấm của các đốm sáng gần
    vec3 s = vec3(0.);
    for (int i = 0; i < 19; i++) {
      if (uMI[i] < .001) continue;
      vec3 d = uMP[i] - wp; float l2 = dot(d, d);
      if (l2 > 4900.) continue;                              // xa quá 70 m: không đáng kể, bỏ qua cho máy yếu
      s += uMI[i] * max(dot(n, d) * inversesqrt(l2 + 1e-4), 0.) * 26. / (l2 + 4.);
    }
    if (uFP.w > .001) { vec3 d = uFP.xyz - wp; float l2 = dot(d, d); s += uFP.w * (.25 + .75 * max(dot(n, d) * inversesqrt(l2 + 1e-4), 0.)) * 26. / (l2 + 9.); }
    return s * vec3(1., .72, .42);
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
  attribute vec3 aRow; // x: toạ độ hàng (đã chia khoảng cách hàng), y: độ phủ chè, z: rừng
  attribute vec2 aC;   // tâm quả đồi chi phối (x, z)
  varying vec3 vW; varying vec3 vN; varying vec3 vRow; varying vec2 vC;
  void main(){ vW = (modelMatrix * vec4(position, 1.)).xyz; vN = normal; vRow = aRow; vC = aC; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`;
  const TER_F = `
  varying vec3 vW; varying vec3 vN; varying vec3 vRow; varying vec2 vC;
  uniform vec4 uL[8]; uniform float uLK;
  void main(){
    vec3 n = vN / max(length(vN), 1e-4);
    float tea = vRow.y, rung = vRow.z;
    // hàng chè: toạ độ ngang hàng = khoảng cách tới tâm đồi (đã chia sẵn), lượn nhẹ
    float rowF = vRow.x + pn(vec3(vW.xz * .02, .5)) * .35 + pn(vec3(vW.xz * .11, 2.7)) * .12;
    float fw = fwidth(rowF);
    float u = fract(rowF);
    // dọc theo hàng: từng bụi dài ~1.3 m, có khe nhỏ, thỉnh thoảng khuyết
    vec2 rdv = vW.xz - vC; float rdl = length(rdv);
    vec2 rd2 = rdl > .01 ? rdv / rdl : vec2(0.);
    float along = atan(rdv.y, rdv.x) * rdl / 1.3;
    float seg = fract(along + floor(rowF) * .37);
    float segId = floor(along + floor(rowF) * .37);
    float gap = smoothstep(.0, .08, seg) * smoothstep(1., .92, seg) * step(.06, h12(vec2(segId, floor(rowF))));
    float bushW = .78 + .12 * h12(vec2(segId * 1.7, floor(rowF)));
    float edgeN = pn(vec3(vW.xz * 3.1, vW.y * 3.1)) * .16 + pn(vec3(vW.xz * 9.3, 2.2)) * .07;   // mép bụi lởm chởm lá
    float uu = u + edgeN;
    float bush = smoothstep(.5 - bushW * .5, .5 - bushW * .5 + .16, uu) * smoothstep(.5 + bushW * .5, .5 + bushW * .5 - .16, uu) * mix(1., gap, 1. - smoothstep(.15, .5, fwidth(along)));
    float top = sat(1. - abs(uu - .5) * 2.4);                  // đỉnh bụi tròn
    float aaK = 1. - smoothstep(.06, .26, fw);  // xa quá thì gộp hàng, khỏi rung hình
    vec3 nb = normalize(n + vec3(rd2.x, 0., rd2.y) * (u - .5) * 1.8 * aaK * bush);
    float leaf = pn(vec3(vW.xz * 1.9, vW.y * 1.9)) * .5 + pn(vec3(vW.xz * 6.5, 1.3)) * .35;
    float patchV = pn(vec3(vW.xz * .012, 4.4)) + .5 * pn(vec3(vW.xz * .045, 1.9));   // nương chè già / non
    vec3 aTea = mix(vec3(.026, .044, .024), vec3(.06, .088, .044), .5 + leaf) * (.75 + .5 * smoothstep(-.35, .35, patchV)) * (.7 + .45 * top);
    vec3 aDat = vec3(.014, .012, .011);
    float grass = pn(vec3(vW.xz * 4.3, .9)) * .6 + pn(vec3(vW.xz * 17., 3.1)) * .4 + pn(vec3(vW.xz * .35, 5.2)) * .5;
    vec3 aCo = mix(vec3(.028, .034, .02), vec3(.06, .062, .036), sat(.5 + grass));
    vec3 aRung = vec3(.018, .025, .018) * (.7 + .6 * pn(vec3(vW.xz * .08, 2.1)));
    // lối đi xẻ dọc sườn đồi (từ đỉnh xuống), đất sáng hơn
    float ang = atan(rdv.y, rdv.x);
    float pw = abs(fract(ang * 6. / 6.2831853 + .13 + pn(vec3(rdl * .02, ang, .3)) * .04) - .5) * 6.2831853 / 6. * rdl;
    float path = (1. - smoothstep(.55, 1.1, pw)) * tea * step(8., rdl) * .55;
    float bushM = mix(.7, bush, aaK);
    vec3 alb = mix(aDat, aTea, bushM);
    alb = mix(alb, vec3(.05, .043, .035), path);
    alb = mix(aCo, alb, tea);
    alb = mix(alb, aRung, rung);
    float ao = mix(1., mix(.18, 1., bush), tea * aaK * (1. - path));
    vec3 nm = mix(n, nb, tea); vec3 nn = nm / max(length(nm), 1e-4);
    vec3 col = alb * anhTrang(nn, ao);
    // lá chè bóng: lấp lánh nhẹ dưới trăng
    vec3 vdir = normalize(vW - uCam);
    vec3 hh = normalize(uMoonL - vdir);
    float sp = pow(max(dot(nn, hh), 0.), 60.) * tea * bush * smoothstep(.55, .85, pn(vec3(vW.xz * 9., vW.y * 9.)) + .5) * aaK;
    col += vec3(.3, .36, .45) * sp * .5;
    col += alb * dongDom(vW, nn) * 3.5;
    col += songChe(vW, bush * tea * aaK + .15 * tea) * mix(.4, 1., tea) * (.35 + top * .9 * tea);
    if (length(vW.xz - vec2(34., -142.)) < 115.) for (int i = 0; i < 8; i++) { vec3 dl = uL[i].xyz - vW; float l2 = dot(dl, dl); col += alb * uL[i].w * max(dot(nn, dl) * inversesqrt(l2), 0.) * 30. / (l2 + 6.) * vec3(1., .6, .27) * uLK; }
    col = suong(col, vW);
    if (!(dot(col, col) < 1e8)) col = vec3(0.);   // chốt an toàn: không để điểm ảnh hỏng loé thành đốm chói
    gl_FragColor = vec4(col, 1.);
  }`;
  const SKY_V = `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); gl_Position = p.xyww; }`;
  const SKY_F = `
  varying vec3 vD;
  uniform vec3 uMoonD;
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
    col += dongDom(vW, vec3(0., 1., 0.)) * .05;
    col = suong(col, vW);
    gl_FragColor = vec4(col, 1.);
  }`;

  // ---------- dựng lưới địa hình (lưới cực quanh máy quay) ----------
  function buildTerrain(T) {
    const NR = 210, NA = 560, R0 = 0.35, R1 = 4200, A0 = 0, A1 = 2 * Math.PI;
    const nv = (NR + 1) * (NA + 1);
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), RW = new Float32Array(nv * 3), CC = new Float32Array(nv * 2);
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
        let tea = 0, rung = 0, row = 0, cx = x, cz = z;
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
        }
        // rừng tạp ở các khe giữa đồi xa
        rung = Math.max(rung, ss(0.15, 0.4, fbm(x * 0.004, z * 0.004, 2) + 0.2) * ss(500, 900, r));
        RW[o * 3] = row; RW[o * 3 + 1] = tea; RW[o * 3 + 2] = rung;
        CC[o * 2] = cx; CC[o * 2 + 1] = cz;
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
    g.setAttribute('aRow', new T.BufferAttribute(RW, 3)); g.setAttribute('aC', new T.BufferAttribute(CC, 2));
    g.setIndex(idx);
    return g;
  }

  // ---------- cây ----------
  function buildTrees(T, U, them) {
    const items = [];
    let s = 31;
    const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const add = (x, z, hgt, cell) => { items.push([x, hDat(x, z) - 0.4, z, hgt, cell, r() < 0.5 ? 1 : -1]); };
    // rừng trên các rặng xa (bóng cây in lên trời), cây lác đác ở chân các đồi chè
    DOMES.forEach((D, i) => {
      if (i <= 1) return;
      const dist = Math.hypot(D[0], D[1]);
      const cnt = D[4] === 1 ? Math.floor(30 + D[3] / 5) : (r() < 0.7 ? 3 + Math.floor(r() * 6) : 0);
      for (let k = 0; k < cnt; k++) {
        const a = r() * 6.283, rr = Math.sqrt(r()) * D[3] * (D[4] === 1 ? 0.8 : 0.98);
        if (D[4] === 0 && rr < D[3] * 0.72) continue;               // đồi chè: cây chỉ ở chân đồi
        const x = D[0] + Math.cos(a) * rr, n = D[1] + Math.sin(a) * rr;
        const far = dist > 900;
        add(x, -n, (far ? 15 : 11) + r() * 9, far ? 6 : [0, 1, 2, 6, 0][Math.floor(r() * 5)]);
      }
    });
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
  // Các cảnh quay của đoạn nửa đêm (cắt đúng phách nhạc, nhịp 1 giây: phách mạnh 211.72, 212.72, 213.72…):
  //  2 · 207.65 chờ nửa đêm: hạ máy xuống giữa hàng chè, chòm W trên trời, doanh trại bên phải
  //  3 · 211.72 nửa đêm: sao băng vụt ra từ chòm W; máy đẩy nhẹ và lia theo; 212.72 tách mảnh
  //  4 · 213.72 bay theo mảnh sáng: từ sau lưng vòng ra bên cạnh trong lúc nó bổ nhào rồi hãm dần xuống doanh trại
  //  5 · 216.72 góc thấp từ trong cổng trại: mảnh sáng lơ lửng trên sân, đập sáng hai lần, 217.72 nở bung
  //  6 · 221.72 về lại đồi chè: đốm sáng rơi khắp thung lũng; máy tiến dần tới cửa sổ của em
  // [S, x, độ cao tuyệt đối (m), z, hướng (độ, liên tục: 360 chứ không về 0), ngóc (độ), góc nhìn dọc]
  const CAM2 = SN.duong([
    [207.65, 0.3, 4.8, 2.4, 336.4, 18, 63.5],
    [209.4, 0.04, 1.85, 0.25, 337.7, 13.7, 60.4],
    [211.72, 0, 1.6, 0, 338.2, 13.4, 60],
    [214.72, 0.2, 1.75, -2.2, 347, 13, 44],
  ]);
  const CAMK = SN.duong([
    [221.72, -0.6, 1.7, 0.6, 343, 9.8, 58],
    [224.0, 0.5, 1.9, -10, 346, 8.5, 56],
    [231.0, 6.0, 2.4, -36, 360, 3.0, 46],
    [237.0, 17.0, 6.6, -62, 368, 1.0, 32],
    [242.0, 20.0, 8.4, -70, 372, 0.4, 13],
  ]);
  const T_C4 = 214.72, T_C5 = 216.72, T_C6 = 221.72;
  let SB = null;   // sao băng (c-saobang.js), dựng lúc tải
  const CAM = { pos: [0, 0, 0], tgt: [0, 0, 0], fov: 56, roll: 0 };
  const DCQ = SN.NHA && SN.Q.get('dc') ? SN.Q.get('dc').split(',').map(Number) : null;
  const ssC = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const smoother = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  const nrm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  function tuKhoa(c) {   // khoá máy quay [x, cao, z, hướng, ngóc, góc nhìn] → vị trí + điểm nhìn
    const y = Math.max(hDat(c[0], c[2]) + 1.3, c[1]);
    const yaw = c[3] * D2R, pit = c[4] * D2R;
    CAM.pos = [c[0], y, c[2]];
    CAM.tgt = [c[0] + Math.sin(yaw) * Math.cos(pit) * 10, y + Math.sin(pit) * 10, c[2] - Math.cos(yaw) * Math.cos(pit) * 10];
    CAM.fov = c[5]; CAM.roll = 0;
  }
  function nhinVe(p, k) {   // xoay dần hướng nhìn về điểm p (k: 0 giữ nguyên, 1 nhìn thẳng vào p)
    const a = nrm3([CAM.tgt[0] - CAM.pos[0], CAM.tgt[1] - CAM.pos[1], CAM.tgt[2] - CAM.pos[2]]);
    const b = nrm3([p[0] - CAM.pos[0], p[1] - CAM.pos[1], p[2] - CAM.pos[2]]);
    const d = nrm3([mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)]);
    CAM.tgt = [CAM.pos[0] + d[0] * 10, CAM.pos[1] + d[1] * 10, CAM.pos[2] + d[2] * 10];
  }
  function camAt(S) {
    if (DCQ) {
      const yaw = DCQ[3] * D2R, pit = DCQ[4] * D2R;
      CAM.pos = [DCQ[0], DCQ[1], DCQ[2]];
      CAM.tgt = [DCQ[0] + Math.sin(yaw) * Math.cos(pit) * 10, DCQ[1] + Math.sin(pit) * 10, DCQ[2] - Math.cos(yaw) * Math.cos(pit) * 10];
      CAM.fov = DCQ[5]; CAM.roll = 0; return CAM;
    }
    if (S < T_C4 || !SB) {
      // cảnh 2–3: đồi chè; sau phách nửa đêm thì lia nhẹ theo sao băng / mảnh sáng (máy theo sau một chút, không giật)
      tuKhoa(CAM2(Math.min(S, T_C4)));
      if (SB && S > M.BOOM) nhinVe(SB.fragPos(S - 0.2), 0.5 * ssC(M.BOOM + 0.3, M.BOOM + 1.9, S));
      return CAM;
    }
    if (S < T_C5) {
      // cảnh 4: bay theo mảnh sáng. Máy ở sau lưng hơi cao, vòng dần ra bên cạnh, tới gần khi nó hãm lại
      const w = smoother((S - T_C4) / (T_C5 - T_C4));
      const F = SB.fragPos(S), dV = nrm3(SB.fragVel(S));
      const sd = nrm3(cross3(dV, [0, 1, 0])), up = cross3(sd, dV);
      const th = mix(-58, -100, w) * D2R, r = mix(30, 17, w), el = mix(-5, -1, w) * D2R;   // máy thấp hơn mảnh một chút: mảnh in trên nền trời
      const bx = -dV[0] * Math.cos(th) + sd[0] * Math.sin(th), by = -dV[1] * Math.cos(th) + sd[1] * Math.sin(th), bz = -dV[2] * Math.cos(th) + sd[2] * Math.sin(th);
      CAM.pos = [F[0] + (bx * Math.cos(el) + up[0] * Math.sin(el)) * r, F[1] + (by * Math.cos(el) + up[1] * Math.sin(el)) * r, F[2] + (bz * Math.cos(el) + up[2] * Math.sin(el)) * r];
      CAM.pos[1] = Math.max(CAM.pos[1], hDat(CAM.pos[0], CAM.pos[2]) + 6);
      const lead = mix(18, 2.5, w);
      CAM.tgt = [F[0] + dV[0] * lead, F[1] + dV[1] * lead - mix(2, 1, w), F[2] + dV[2] * lead];
      CAM.fov = mix(52, 50, w); CAM.roll = mix(-10, 3, w) * D2R;
      return CAM;
    }
    if (S < T_C6) {
      // cảnh 5: góc thấp từ trong cổng trại nhìn lên; cột cờ sát bên, dãy nhà phía sau; máy nâng rất chậm
      const k = (S - T_C5) / (T_C6 - T_C5);
      const p = SN.dat.tC(mix(4.6, 4.2, k), 0, mix(45.4, 44.9, k));
      CAM.pos = [p[0], SN.dat.Yp + mix(1.4, 2.5, ease(k)), p[2]];
      const F = SB.fragPos(Math.min(S, SB.T_BLOOM)), PB = SB.PB;
      const db = Math.max(0, S - SB.T_BLOOM);
      const look = S < SB.T_BLOOM ? F : [PB[0], PB[1] - 9 * ease(db / 4.5), PB[2]];
      CAM.tgt = [mix(CAM.pos[0], look[0], 1), mix(CAM.pos[1], look[1], 1) - 3, mix(CAM.pos[2], look[2], 1)];
      CAM.fov = mix(66, 62, ease(k)); CAM.roll = 0;
      return CAM;
    }
    tuKhoa(CAMK(S));
    const kw = ease((S - 230) / 7.5);
    if (kw > 0 && SN.dat.cuaSo) nhinVe(SN.dat.cuaSo, kw);
    return CAM;
  }
  SN.dat.camAt = camAt;

  SN.dung.push((T) => {
    const moonAlt = 72.6 * D2R, moonAz = 275.3 * D2R;
    const moonD = new T.Vector3(Math.cos(moonAlt) * Math.sin(moonAz), Math.sin(moonAlt), -Math.cos(moonAlt) * Math.cos(moonAz));
    const la = 50 * D2R, lz = 262 * D2R; // hướng chiếu sáng (nghệ thuật): thấp hơn trăng thật một chút
    const lightD = new T.Vector3(Math.cos(la) * Math.sin(lz), Math.sin(la), -Math.cos(la) * Math.cos(lz));
    const v3 = () => { const a = []; for (let i = 0; i < 19; i++) a.push(new T.Vector3(0, -999, 0)); return a; };
    const v2 = () => { const a = []; for (let i = 0; i < 19; i++) a.push(new T.Vector2(0, 0)); return a; };
    const U = Object.assign({}, SN.uChung, {
      uMoonL: { value: lightD }, uMet: { value: 0 }, uMetP: { value: new T.Vector3(0, 1, 0) },
      uMP: { value: v3() }, uMI: { value: new Array(19).fill(0) }, uRP: { value: v2() }, uRT: { value: new Array(19).fill(9999) },
      uFogK: { value: 0.0011 }, uCam: { value: new T.Vector3() }, uYV: { value: Y_THUNG }, uFP: { value: new T.Vector4(0, -999, 0, 0) },
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
    terM.uniforms.uL = { value: nha.lamps }; terM.uniforms.uLK = { value: 1 };
    // cây
    const trees = buildTrees(T, U, nha.cay); group.add(trees);
    group.visible = false;
    SN.scene().add(group);
    const an = SN.NHA ? (SN.Q.get('an') || '') : '';
    if (an.includes('s')) stars.visible = false; if (an.includes('c')) trees.visible = false; if (an.includes('t')) ter.visible = false; if (an.includes('k')) sky.visible = false;
    group.userData.an = an;
    if (an.includes('n')) { nha.mesh.visible = false; nha.co.visible = false; } if (an.includes('g')) { nha.sangP.visible = false; nha.vungMesh.visible = false; }
    const etaD = window.SN_SAO.eta;
    // sao băng: từ ngay chòm W (gần Eta Cas) vụt xuống phía phải, về phía doanh trại
    const MA = new T.Vector3(etaD[0], etaD[1], etaD[2]).normalize();
    const az2 = 352 * D2R, al2 = 17 * D2R;
    const MB = new T.Vector3(Math.cos(al2) * Math.sin(az2), Math.sin(al2), -Math.cos(al2) * Math.cos(az2));
    const camP = camAt(M.BOOM).pos.slice();
    SB = SN.dat.dungSaoBang(T, U, { camP, MA: [MA.x, MA.y, MA.z], MB: [MB.x, MB.y, MB.z], tC: SN.dat.tC, Yp: SN.dat.Yp, hDat, cuaSo: SN.dat.cuaSo, cuaSoN: SN.dat.cuaSoN || [0, 0, 1] });
    group.add(SB.group);
    SN.dat.moteAt = SB.moteAt; SN.dat.MOTES = SB.MOTES;
    SB.MOTES.forEach((mo, i) => { U.uRP.value[i].set(mo.L[0], mo.L[2]); U.uRT.value[i] = mo.tLand; });
    const cP3 = [0, 0, 0];
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
      },
      cap(S, a) {
        nha.mat.uniforms.uThuy.value = 0.85 + 0.12 * Math.sin(S * 1.3) + 0.06 * Math.sin(S * 4.1 + 1) + 2.2 * ease((S - 238.6) / 1.6);
        nha.cap(S, U.uCam.value);
        cP3[0] = U.uCam.value.x; cP3[1] = U.uCam.value.y; cP3[2] = U.uCam.value.z;
        SB.cap(S, cP3);
        const c4 = S > T_C4 && S < T_C5 ? 1 : 0, c5 = S >= T_C5 && S < T_C6 ? 1 : 0;
        SN.gradeMix({ exp: 1.3 - 0.12 * c4, bloom: 0.85 - 0.2 * c4 - 0.1 * c5, thr: 0.9 + 0.35 * c4 + 0.2 * c5, streak: 0.4 - 0.28 * c4 - 0.18 * c5, sat: 0.9 + 0.08 * (c4 + c5), con: 1.08, vig: 0.46, grain: 0.035, ca: 0.0, bars: 0, lift: [0.012, 0.016, 0.026], gain: [0.98, 1.0, 1.04], sc: [0.5, 0.7, 1.0], white: 0 }, a);
      },
    });
  });
})();
