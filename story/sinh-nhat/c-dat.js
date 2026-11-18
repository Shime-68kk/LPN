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
  uniform float uFogK;       // độ đặc sương
  uniform vec3 uCam;
  uniform float uYV;         // độ cao mặt thung lũng
  vec3 suong(vec3 col, vec3 wp){
    float dist = length(wp - uCam);
    float hv = wp.y - uYV;                                   // cao hơn mặt thung lũng bao nhiêu mét
    float mist = exp(-max(hv, 0.) / 3.6) * (.55 + .9 * smoothstep(-.25, .35, pn(vec3(wp.xz * .0016, .37))));
    float dens = uFogK * (.16 + 2.6 * mist);
    float f = 1. - exp(-dist * dens);
    vec3 fc = mix(vec3(.105, .125, .16), vec3(.07, .085, .115), smoothstep(0., 30., hv));
    fc += uMet * vec3(.08, .12, .1);
    return mix(col, fc, clamp(f, 0., 1.));
  }
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
      s += uMI[i] * max(dot(n, d) * inversesqrt(l2 + 1e-4), 0.) * 26. / (l2 + 4.);
    }
    return s * vec3(1., .72, .42);
  }
  vec3 songChe(vec3 wp, float bush){ // sóng sáng lan theo hàng chè sau khi đốm chạm đất
    vec3 s = vec3(0.);
    for (int i = 0; i < 19; i++) {
      float t = uS - uRT[i];
      if (t < 0. || t > 26.) continue;
      float dd = length(wp.xz - uRP[i]);
      float r = t * 7.5;
      float ring = exp(-sq((dd - r) / (2.2 + t * .5)));
      float lin = exp(-dd / 30.) * exp(-t * .14);
      float sp = .65 + .7 * smoothstep(.3, .8, pn(vec3(wp.xz * 1.7, uS * .4 + float(i))) + .5);
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
  uniform vec3 uL[5]; uniform float uLK;
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
    for (int i = 0; i < 4; i++) { vec3 dl = uL[i] - vW; float l2 = dot(dl, dl); col += alb * max(dot(nn, dl) * inversesqrt(l2), 0.) * 30. / (l2 + 6.) * vec3(1., .6, .27) * uLK; }
    col = suong(col, vW);
    if (!(dot(col, col) < 1e8)) col = vec3(0.);   // chốt an toàn: không để điểm ảnh hỏng loé thành đốm chói
    gl_FragColor = vec4(col, 1.);
  }`;
  const SKY_V = `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); gl_Position = p.xyww; }`;
  const SKY_F = `
  varying vec3 vD;
  uniform vec3 uMoonD; uniform vec3 uMA, uMB; uniform float uMT, uMI2, uTrain;
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
    // mây ti mảnh kéo dài theo gió, trăng soi bạc; trôi rất chậm
    vec2 cp = d.xz / (d.y + .1) + vec2(uS * .0035, uS * .001);
    vec2 cq = vec2(cp.x * .55 + cp.y * .3, cp.y * 2.6 - cp.x * .4);
    float ci = smoothstep(.12, .5, fbm4(vec3(cq * .5, .2)) + .25 * pn(vec3(cq * 2.2, 1.1))) * smoothstep(.03, .3, d.y);
    col = mix(col, vec3(.05, .062, .085) + vec3(.07, .08, .1) * pow(cm, 3.), ci * .32);
    // sao băng: đầu sáng xanh trắng, đuôi dài; vệt khí phát sáng còn lại sau đó
    if (uMI2 > 0. || uTrain > 0.) {
      vec3 ab = uMB - uMA; vec3 head = normalize(uMA + ab * uMT);
      vec3 tdir = normalize(head - normalize(uMA + ab * max(uMT - .22, 0.)));
      // khoảng cách góc tới đoạn đuôi
      vec3 ta = normalize(uMA + ab * max(uMT - .55, 0.));
      vec3 pa = d - ta, ba = head - ta;
      float t = sat(dot(pa, ba) / max(dot(ba, ba), 1e-8));
      float dl = length(pa - ba * t);
      float dh = length(d - head);
      float px = uPxA;
      col += uMI2 * (vec3(.75, 1., .85) * exp(-dh * dh / (px * px * 2.5)) * 16. + vec3(.6, .95, .8) * exp(-dh / (px * 7.)) * .45 + vec3(.55, .9, .75) * exp(-dl * dl / (px * px * 1.6)) * pow(t, 1.3) * 5.);
      // vệt khí: dọc cả đường đã bay, mờ dần, xoắn nhẹ
      vec3 pa2 = d - normalize(uMA), ba2 = head - normalize(uMA);
      float t2 = sat(dot(pa2, ba2) / max(dot(ba2, ba2), 1e-8));
      vec3 q = pa2 - ba2 * t2;
      float wob = pn(vec3(t2 * 6., uS * .15, 0.)) * px * 3.;
      float dl2 = length(q) + wob;
      col += uTrain * vec3(.35, .75, .55) * exp(-dl2 * dl2 / (px * px * (3. + uTrain * 0.))) * smoothstep(0., .15, t2) * 1.4;
    }
    // núi xa hai lớp, chìm trong sương
    float m1 = nui(az, 2.2, .010, .034);
    float m2 = nui(az + 1.3, 3.6, .003, .02);
    vec3 fogC = vec3(.072, .088, .118) + vec3(.03, .035, .04);
    if (alt < m1) col = mix(col, vec3(.055, .068, .092), .85);
    if (alt < m2) col = mix(col, vec3(.042, .052, .072), .9);
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
    const NR = 210, NA = 300, R0 = 0.35, R1 = 4200, A0 = (338 - 95) * D2R, A1 = (338 + 95) * D2R;
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
  function buildTrees(T, U) {
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


  // ---------- doanh trại ----------
  const BLD_V = `
  attribute vec4 aB; // vật liệu, u, v (mét trên mặt tường/mái), mã nhà
  varying vec3 vW; varying vec3 vN; varying vec4 vB;
  void main(){ vW = (modelMatrix * vec4(position, 1.)).xyz; vN = normalize((modelMatrix * vec4(normal, 0.)).xyz); vB = aB; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`;
  const BLD_F = `
  varying vec3 vW; varying vec3 vN; varying vec4 vB;
  uniform float uThuy; uniform vec3 uL[5]; uniform float uLK;
  vec3 denCot(vec3 wp, vec3 n){ vec3 s = vec3(0.); for (int i = 0; i < 5; i++) { vec3 d = uL[i] - wp; float l2 = dot(d, d); s += max(dot(n, d) * inversesqrt(l2), 0.) * 30. / (l2 + 6.); } return s * vec3(1., .6, .27) * uLK; }
  float star5(vec2 p, float r){ // ngôi sao năm cánh
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
    vec3 alb = vec3(.5); vec3 emi = vec3(0.); float ao = 1.;
    float grime = pn(vec3(vW.xz * .45, vW.y * .45)) ;
    if (mat < .5 || (mat > 3.5 && mat < 4.5)) {            // tường vàng, chân tường ố
      alb = vec3(.55, .45, .26) * (.88 + .25 * grime) * (.78 + .22 * smoothstep(0., 1.1, v));
      if (mat > 3.5) {                                      // mặt trước: cửa sổ, cửa đi; nằm dưới hiên nên khuất trăng
        ao = .42;
        float bay = floor(u / 3.6), bu = u - bay * 3.6;
        bool door = mod(bay, 4.) == 1.;
        vec2 lo = door ? vec2(1.25, 0.) : vec2(1.15, 1.0), hi = door ? vec2(2.35, 2.35) : vec2(2.45, 2.3);
        vec2 q = vec2(bu, v);
        float inW = step(lo.x, q.x) * step(q.x, hi.x) * step(lo.y, q.y) * step(q.y, hi.y);
        float h = h12(vec2(bay * 1.37 + bid * 11.1, bid));
        float lit = step(.64, h);
        bool thuy = abs(bid - 1.) < .1 && abs(bay - 10.) < .1;
        float ed = min(min(q.x - lo.x, hi.x - q.x), min(q.y - lo.y, hi.y - q.y));
        float frame = 1. - smoothstep(.04, .07, ed);
        float bars = door ? 0. : step(.86, fract((q.x - lo.x) / .26));
        vec2 wc = (q - (lo + hi) * .5) / (hi - lo);
        if (inW > .5) {
          vec3 warm = vec3(1., .66, .34) * (1.5 + .9 * h) * (1. - .55 * smoothstep(.0, .5, abs(wc.x)) * step(.5, h)); // rèm khép một nửa
          vec3 inside = lit > .5 ? warm : vec3(.008, .011, .016) + vec3(.02, .03, .05) * smoothstep(.6, -.2, wc.y);
          if (thuy) inside = vec3(.36, .55, 1.15) * uThuy * 1.6 * (1.25 - .55 * length(wc)) + vec3(.02, .02, .03);
          if (door && lit < .5) inside = vec3(.006, .007, .01);
          emi = inside * (1. - frame) * (1. - bars * .85);
          alb = mix(alb * .25, vec3(.03, .045, .04), frame + bars);   // khung, song sơn xanh sẫm
        } else {
          // ánh đèn hắt quanh ô cửa sáng
          float bay2 = floor(u / 3.6); float h2v = h12(vec2(bay2 * 1.37 + bid * 11.1, bid));
          float lit2 = step(.64, h2v); bool thuy2 = abs(bid - 1.) < .1 && abs(bay2 - 10.) < .1;
          vec2 cc = vec2(bay2 * 3.6 + 1.8, 1.65);
          float gl = exp(-length((vec2(u, v) - cc) * vec2(.8, 1.)) * 1.6);
          emi += alb * (lit2 * vec3(1., .66, .34) * .9 + (thuy2 ? vec3(.4, .55, 1.) * uThuy * .7 : vec3(0.))) * gl;
        }
      }
    } else if (mat < 1.5) {                                 // mái ngói
      float course = fract(v / .3), tile = fract(u / .24 + step(.5, fract(v / .6)) * .5);
      alb = vec3(.2, .085, .055) * (.75 + .35 * grime) * (.7 + .3 * smoothstep(.0, .25, course)) * (.85 + .15 * smoothstep(.0, .12, tile));
      alb = mix(alb, vec3(.07, .08, .06), smoothstep(.3, .7, pn(vec3(vW.xz * .08, 3.3))) * .5);    // rêu, ố
    } else if (mat < 2.5) {                                 // cột hiên
      alb = vec3(.6, .5, .3) * (.85 + .2 * grime); ao = .7;
    } else if (mat < 3.5) {                                 // nền, sân bê tông
      alb = vec3(.2, .2, .19) * (.8 + .4 * grime);
    } else if (mat < 5.5) {                                 // cờ đỏ sao vàng
      vec2 fp = vec2(u - .9, v - .6);
      alb = star5(fp, .33) < 0. ? vec3(.8, .62, .05) : vec3(.5, .03, .025);
    } else alb = vec3(.25);                                  // cột cờ
    vec3 col = alb * anhTrang(n, ao) + emi;
    col += alb * denCot(vW, n);
    col += alb * dongDom(vW, n) * 2.;
    col = suong(col, vW);
    gl_FragColor = vec4(col, 1.);
  }`;
  const GLOW_V = `attribute vec4 aG; varying vec3 vC; uniform float uPx; void main(){ vec4 mv = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; vC = vec3(1., .62, .3) * aG.x; gl_PointSize = clamp(aG.y * uPx * 300. / max(-mv.z, 1.), 2., 140.); }`;
  const GLOW_F = `varying vec3 vC; void main(){ float r = length(gl_PointCoord - .5) * 2.; float a = exp(-r * r * 60.) * 3.5 + exp(-r * 4.2) * .3; gl_FragColor = vec4(vC * a * smoothstep(1., .8, r), 1.); }`;
  function buildCamp(T, U) {
    const P = [], N = [], B = [];
    function tri(a, b, c, n, ua, ub, uc, mat, bid) {
      P.push(...a, ...b, ...c); N.push(...n, ...n, ...n);
      B.push(mat, ua[0], ua[1], bid, mat, ub[0], ub[1], bid, mat, uc[0], uc[1], bid);
    }
    function quad(a, b, c, d, mat, bid, uvA, uvB, uvC, uvD) { // a b c d ngược chiều kim đồng hồ khi nhìn từ phía mặt
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = Math.hypot(...n) || 1; n = n.map((x) => x / l);
      tri(a, b, c, n, uvA, uvB, uvC, mat, bid); tri(a, c, d, n, uvA, uvC, uvD, mat, bid);
    }
    function xf(cx, cy, cz, rot) { const c = Math.cos(rot), s2 = Math.sin(rot); return (x, y, z) => [cx + x * c + z * s2, cy + y, cz - x * s2 + z * c]; }
    function box(t, x0, x1, y0, y1, z0, z1, mat, bid, frontMat) {
      const p = (x, y, z) => t(x, y, z);
      quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1), frontMat == null ? mat : frontMat, bid, [0, 0], [x1 - x0, 0], [x1 - x0, y1 - y0], [0, y1 - y0]); // trước (+z)
      quad(p(x1, y0, z0), p(x0, y0, z0), p(x0, y1, z0), p(x1, y1, z0), mat, bid, [0, 0], [x1 - x0, 0], [x1 - x0, y1 - y0], [0, y1 - y0]);   // sau
      quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0), mat, bid, [0, 0], [z1 - z0, 0], [z1 - z0, y1 - y0], [0, y1 - y0]);   // trái
      quad(p(x1, y0, z1), p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), mat, bid, [0, 0], [z1 - z0, 0], [z1 - z0, y1 - y0], [0, y1 - y0]);   // phải
      quad(p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0), p(x0, y1, z0), mat, bid, [0, 0], [1, 0], [1, 1], [0, 1]);                             // nóc
    }
    const Yp = hDat(34, -142);
    function nha(cx, cz, L, Dp, rot, bid) {
      const t = xf(cx, Yp, cz, rot), Hw = 3.4, x0 = -L / 2, x1 = L / 2, zf = Dp / 2;
      box(t, x0 - 0.3, x1 + 0.3, -0.7, 0.18, -zf - 0.3, zf + 2.6, 3, bid);       // nền + hiên
      box(t, x0, x1, 0.18, Hw, -zf, zf, 0, bid, 4);                               // thân nhà (mặt trước có cửa)
      // mái chính hai mái + đầu hồi
      const ov = 0.9, ry = Hw + 2.1, ey = Hw - 0.15, ez = zf + ov, rl = Math.hypot(ez, ry - ey);
      quad(t(x0 - 0.8, ey, ez), t(x1 + 0.8, ey, ez), t(x1 + 0.8, ry, 0), t(x0 - 0.8, ry, 0), 1, bid, [0, 0], [L + 1.6, 0], [L + 1.6, rl], [0, rl]);
      quad(t(x1 + 0.8, ey, -ez), t(x0 - 0.8, ey, -ez), t(x0 - 0.8, ry, 0), t(x1 + 0.8, ry, 0), 1, bid, [0, 0], [L + 1.6, 0], [L + 1.6, rl], [0, rl]);
      const g = (sx) => { const a = t(sx, Hw, -zf), b = t(sx, Hw, zf), c = t(sx, ry - 0.08, 0); return [a, b, c]; };
      { const [a, b, c] = g(x1); tri(a, b, c, (() => { const v = t(1, 0, 0), o = t(0, 0, 0); return [v[0] - o[0], v[1] - o[1], v[2] - o[2]]; })(), [0, 0], [Dp, 0], [Dp / 2, 2], 0, bid); }
      { const [a, b, c] = g(x0); tri(b, a, c, (() => { const v = t(-1, 0, 0), o = t(0, 0, 0); return [v[0] - o[0], v[1] - o[1], v[2] - o[2]]; })(), [0, 0], [Dp, 0], [Dp / 2, 2], 0, bid); }
      // mái hiên
      const hy0 = Hw - 0.25, hy1 = Hw - 0.75, hz = zf + 2.5, hl = Math.hypot(2.5, 0.5);
      quad(t(x0, hy1, hz), t(x1, hy1, hz), t(x1, hy0, zf), t(x0, hy0, zf), 1, bid, [0, 0], [L, 0], [L, hl], [0, hl]);
      quad(t(x1, hy1 - 0.08, hz), t(x0, hy1 - 0.08, hz), t(x0, hy0 - 0.08, zf), t(x1, hy0 - 0.08, zf), 2, bid, [0, 0], [L, 0], [L, hl], [0, hl]); // mặt dưới hiên
      for (let x = x0 + 1.8; x <= x1 - 1.0; x += 3.6) box(t, x - 0.15, x + 0.15, 0.18, hy1 + 0.05, hz - 0.45, hz - 0.15, 2, bid);
    }
    nha(34, -128, 50, 8.5, 0, 1);
    nha(31, -153, 44, 8.5, 0, 2);
    nha(-5, -146, 24, 8, Math.PI / 2, 3);
    // sân, cột cờ, cờ
    { const t = xf(34, Yp, -109, 0); box(t, -21, 21, -0.3, 0.06, -7, 7, 3, 0); box(t, -0.07, 0.07, 0.06, 9.5, -0.07, 0.07, 6, 0);
      quad(t(0.07, 7.9, 0), t(1.87, 7.9, 0.05), t(1.87, 9.1, 0.05), t(0.07, 9.1, 0), 5, 0, [0, 0], [1.8, 0], [1.8, 1.2], [0, 1.2]);
      quad(t(1.87, 7.9, 0.05), t(0.07, 7.9, 0), t(0.07, 9.1, 0), t(1.87, 9.1, 0.05), 5, 0, [1.8, 0], [0, 0], [0, 1.2], [1.8, 1.2]); }
    [[8, -112], [60, -112], [34, -97], [-12, -128]].forEach((l) => { const t = xf(l[0], Yp, l[1], 0); box(t, -0.07, 0.07, 0.0, 5.0, -0.07, 0.07, 6, 0); box(t, -0.22, 0.22, 5.0, 5.12, -0.12, 0.12, 6, 0); });
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('aB', new T.Float32BufferAttribute(B, 4));
    const lamps = [[8, Yp + 5.2, -112], [60, Yp + 5.2, -112], [34, Yp + 5.2, -97], [-12, Yp + 5.2, -128], [22, Yp + 2.6, -121.2]];
    const lv = lamps.map((l) => new T.Vector3(l[0], l[1], l[2]));
    const mat = new T.ShaderMaterial({ uniforms: Object.assign({}, U, { uThuy: { value: 1 }, uL: { value: lv }, uLK: { value: 1 } }), vertexShader: BLD_V, fragmentShader: SN_GLSL.CHUNG + CHUNG3 + BLD_F });
    const mesh = new T.Mesh(g, mat); mesh.frustumCulled = false;
    // quầng đèn
    const gp = new Float32Array(lamps.length * 3), ga = new Float32Array(lamps.length * 4);
    lamps.forEach((l, i) => { gp.set(l, i * 3); ga.set([i === 4 ? 2.2 : 3.2, i === 4 ? 2.4 : 4.5, 0, 0], i * 4); });
    const gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(gp, 3)); gg.setAttribute('aG', new T.BufferAttribute(ga, 4));
    const glowM = new T.ShaderMaterial({ uniforms: { uPx: { value: 1 } }, vertexShader: GLOW_V, fragmentShader: GLOW_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    const glow = new T.Points(gg, glowM); glow.frustumCulled = false; glow.userData.ro = 5;
    // cửa sổ của em (bay 9 nhà 1): chỗ máy quay zoom vào và đốm sáng cuối cùng bay tới
    SN.dat.cuaSo = [34 - 25 + 10 * 3.6 + 1.8, Yp + 1.65, -128 + 4.25];
    SN.dat.Yp = Yp;
    return { mesh, glow, mat, glowM, lamps: lv };
  }


  // ---------- 19 đốm sáng ----------
  const MOTE_V = `
  attribute float aI; attribute float aSz;
  varying float vI; varying float vR;
  uniform float uPx;
  void main(){
    vec4 mv = viewMatrix * vec4(position, 1.);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    // bokeh: gần máy quay thì to và mềm
    float sz = aSz * uPx * (1300. / max(dist, 1.) + 7.) ;
    vR = smoothstep(18., 2., dist);
    gl_PointSize = clamp(sz, 2., 160.);
    vI = aI;
  }`;
  const MOTE_F = `varying float vI; varying float vR;
  void main(){ float r = length(gl_PointCoord - .5) * 2.; if (r > 1.) discard;
    float core = exp(-r * r * mix(14., 5., vR)), halo = exp(-r * 3.4) * .5;
    float ring = smoothstep(.75, .95, r) * smoothstep(1., .95, r) * vR * .4;   // viền bokeh khi ở gần
    vec3 c = vec3(1., .76, .46) * (core * 5. + halo * 1.4 + ring) * vI;
    gl_FragColor = vec4(c, 1.); }`;
  function buildMotes(T) {
    const n = 19, pos = new Float32Array(n * 3), I = new Float32Array(n), Sz = new Float32Array(n);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aI', new T.BufferAttribute(I, 1)); g.setAttribute('aSz', new T.BufferAttribute(Sz, 1));
    const m = new T.ShaderMaterial({ uniforms: { uPx: { value: 1 } }, vertexShader: MOTE_V, fragmentShader: MOTE_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    const pts = new T.Points(g, m); pts.frustumCulled = false; pts.userData.ro = 6;
    return { pts, g, m, pos, I, Sz };
  }
  // điểm vỡ (cuối đường sao băng, trong không gian 3D phía trên thung lũng) và chỗ hạ của từng đốm
  const MOTES = [];
  function planMotes(burst) {
    let s = 77;
    const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const land = [];
    // rải chỗ hạ trên các đồi chè thấy được và quanh doanh trại, trải đều khung hình
    const targets = [[-72, 176], [-182, 268], [62, 306], [-26, 424], [-276, 150], [152, 236], [-118, 66], [-130, 560], [190, 470], [-360, 420], [34, 112], [10, 96], [70, 126]];
    for (let i = 0; i < 18; i++) {
      const T0 = targets[i % targets.length];
      const a = r() * 6.283, rr = (0.15 + r() * 0.55) * (i % targets.length < 10 ? 70 : 18);
      const x = T0[0] + Math.cos(a) * rr, z = -(T0[1] + Math.sin(a) * rr);
      land.push([x, hDat(x, z) + 0.6, z]);
    }
    land.push(SN.dat.cuaSo.slice());
    for (let i = 0; i < 19; i++) {
      const L = land[i];
      const tLand = i === 18 ? 239.4 : 222.0 + (i / 17) * 13.5 + (r() - 0.5) * 2.4;
      MOTES.push({ L, tLand, sway: 3 + r() * 9, ph: r() * 6.28, fr: 0.25 + r() * 0.35, spread: [ (r() - 0.5) * 60, (r() - 0.3) * 30, (r() - 0.5) * 60 ], sz: 0.9 + r() * 0.5 });
    }
    MOTES.burst = burst;
  }
  const T_BURST = M.BOOM + 2.15;
  function moteAt(i, S, out) {
    const mo = MOTES[i], B = MOTES.burst;
    if (S < T_BURST) { out[3] = 0; return out; }
    const life = mo.tLand - T_BURST;
    const t = clamp((S - T_BURST) / life, 0, 1);
    // toả ra quanh điểm vỡ trong 1.5 giây đầu, rồi lả lướt rơi về chỗ hạ
    const e = ease(clamp((S - T_BURST) / 1.6, 0, 1));
    const sx = B[0] + mo.spread[0] * e, sy = B[1] + mo.spread[1] * e, sz = B[2] + mo.spread[2] * e;
    const k = Math.pow(t, 1.25);
    const kk = k * k * (3 - 2 * k);
    const sw = Math.sin((S - T_BURST) * mo.fr * 2 + mo.ph) * mo.sway * Math.sin(Math.PI * t);
    out[0] = mix(sx, mo.L[0], kk) + sw; out[1] = mix(sy, mo.L[1], kk) + Math.sin((S - T_BURST) * 0.7 + mo.ph) * 2 * (1 - t); out[2] = mix(sz, mo.L[2], kk) + sw * 0.6;
    const flash = Math.exp(-(S - T_BURST) * 2.2) * 2.5;
    out[3] = (1 + flash) * (t < 1 ? 1 : Math.exp(-(S - mo.tLand) * 3));
    return out;
  }
  SN.dat.moteAt = moteAt; SN.dat.MOTES = MOTES;

  // ---------- máy quay ----------
  const CAMK = SN.duong([
    // S, x, độ cao tuyệt đối thêm (m trên mặt đất tại chỗ đứng ban đầu), z, hướng (độ), ngóc (độ), góc nhìn dọc
    [205.0, 0, 1.6, 0, 338, 13, 60],
    [216.5, 0, 1.6, 0, 338.5, 12.6, 60],
    [224.0, 2.5, 1.9, -10, 346, 8.5, 56],
    [231.0, 9.5, 2.2, -36, 0, 3.0, 46],
    [237.0, 17.0, 2.3, -62, 8, 1.0, 32],
    [242.0, 20.0, 2.3, -70, 12, 0.4, 13],
  ]);
  const CAM = { pos: [0, 0, 0], tgt: [0, 0, 0], fov: 56 };
  function camAt(S) {
    const c = CAMK(S);
    const y = Math.max(hDat(c[0], c[2]) + 1.3, c[1]);
    const yaw = c[3] * D2R, pit = c[4] * D2R;
    CAM.pos = [c[0], y, c[2]];
    CAM.tgt = [c[0] + Math.sin(yaw) * Math.cos(pit) * 10, y + Math.sin(pit) * 10, c[2] - Math.cos(yaw) * Math.cos(pit) * 10];
    const kw = ease((S - 230) / 7.5);
    if (kw > 0 && SN.dat.cuaSo) {
      const w = SN.dat.cuaSo, dx = w[0] - c[0], dy = w[1] - y, dz = w[2] - c[2], l = Math.hypot(dx, dy, dz);
      const t0 = [CAM.tgt[0] - c[0], CAM.tgt[1] - y, CAM.tgt[2] - c[2]], l0 = Math.hypot(...t0);
      CAM.tgt = [c[0] + mix(t0[0] / l0, dx / l, kw) * 10, y + mix(t0[1] / l0, dy / l, kw) * 10, c[2] + mix(t0[2] / l0, dz / l, kw) * 10];
    }
    CAM.fov = c[5];
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
      uFogK: { value: 0.0011 }, uCam: { value: new T.Vector3() }, uYV: { value: Y_THUNG },
    });
    const group = new T.Group();
    // trời
    const skyM = new T.ShaderMaterial({ uniforms: Object.assign({}, U, { uMoonD: { value: moonD }, uMA: { value: new T.Vector3() }, uMB: { value: new T.Vector3() }, uMT: { value: 0 }, uMI2: { value: 0 }, uTrain: { value: 0 } }),
      vertexShader: SKY_V, fragmentShader: SN_GLSL.CHUNG + SKY_F, depthWrite: false, depthTest: false, side: T.BackSide });
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
    // doanh trại
    const camp = buildCamp(T, U); group.add(camp.mesh); group.add(camp.glow);
    terM.uniforms.uL = { value: camp.lamps }; terM.uniforms.uLK = { value: 1 };
    // cây
    const trees = buildTrees(T, U); group.add(trees);
    const motes = buildMotes(T); group.add(motes.pts);
    group.visible = false;
    SN.scene().add(group);
    const an = SN.NHA ? (SN.Q.get('an') || '') : '';
    if (an.includes('s')) stars.visible = false; if (an.includes('c')) trees.visible = false; if (an.includes('t')) ter.visible = false; if (an.includes('k')) sky.visible = false;
    group.userData.an = an;
    if (an.includes('n')) { camp.mesh.visible = false; } if (an.includes('g')) camp.glow.visible = false;
    const etaD = window.SN_SAO.eta;
    // sao băng: từ ngay chòm W (gần Eta Cas) vụt xuống phía phải, về phía doanh trại
    const MA = new T.Vector3(etaD[0], etaD[1], etaD[2]).normalize();
    const az2 = 352 * D2R, al2 = 17 * D2R;
    const MB = new T.Vector3(Math.cos(al2) * Math.sin(az2), Math.sin(al2), -Math.cos(al2) * Math.cos(az2));
    skyM.uniforms.uMA.value.copy(MA); skyM.uniforms.uMB.value.copy(MB);
    U.uMetP.value.copy(MA.clone().add(MB).normalize());
    // điểm vỡ: theo hướng cuối đường sao băng, cách máy quay ~540 m
    planMotes([MB.x * 540, 1.6 + MB.y * 540, MB.z * 540]);
    const mt4 = [0, 0, 0, 0];
    MOTES.forEach((mo, i) => { U.uRP.value[i].set(mo.L[0], mo.L[2]); U.uRT.value[i] = mo.tLand; });
    SN.them({
      ten: 'dat', tu: 207.65, den: 242, lop: 70, group, warmS: 214,
      a: (S) => 1,
      may(S, cam) {
        const c = camAt(S);
        cam.position.set(c.pos[0], c.pos[1], c.pos[2]);
        cam.up.set(0, 1, 0);
        cam.lookAt(c.tgt[0], c.tgt[1], c.tgt[2]);
        cam.fov = c.fov; cam.near = 0.1; cam.far = 9000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
        U.uCam.value.copy(cam.position);
        SN.uChung.uPxA.value = 2 * Math.tan(c.fov * D2R / 2) / Math.max(1, SN.size()[1]);
        starM.uniforms.uPx.value = SN.size()[1] / 900;
        camp.glowM.uniforms.uPx.value = SN.size()[1] / 900;
        motes.m.uniforms.uPx.value = SN.size()[1] / 900;
      },
      cap(S, a) {
        // sao băng 211.7 → 214.0: lao nhanh, loé sáng ở cuối rồi tách thành 19 đốm
        const t = (S - M.BOOM) / 2.2;
        const mt = clamp(t, 0, 1);
        const su = skyM.uniforms;
        su.uMT.value = 1 - Math.pow(1 - mt, 1.6);
        su.uMI2.value = t > -0.02 && t < 1.15 ? Math.min(1, (t + 0.02) * 12) * (t < 0.92 ? 0.75 + 0.6 * mt : Math.max(0, 1 - (t - 0.92) / 0.23) * 1.35) : 0;
        su.uTrain.value = t > 0.1 ? Math.min(1, (t - 0.1) * 2) * Math.exp(-Math.max(0, t - 1) * 0.55) : 0;
        camp.mat.uniforms.uThuy.value = 0.85 + 0.12 * Math.sin(S * 1.3) + 0.06 * Math.sin(S * 4.1 + 1) + 2.2 * ease((S - 238.6) / 1.6);
        for (let i = 0; i < 19; i++) {
          moteAt(i, S, mt4);
          motes.pos[i * 3] = mt4[0]; motes.pos[i * 3 + 1] = mt4[1]; motes.pos[i * 3 + 2] = mt4[2];
          motes.I[i] = mt4[3]; motes.Sz[i] = MOTES[i].sz;
          U.uMP.value[i].set(mt4[0], mt4[1], mt4[2]); U.uMI.value[i] = mt4[3] * 0.6;
        }
        motes.g.attributes.position.needsUpdate = true; motes.g.attributes.aI.needsUpdate = true; motes.g.attributes.aSz.needsUpdate = true;
        U.uMet.value = su.uMI2.value * 0.55 + (t > 0.85 && t < 1.4 ? Math.exp(-Math.abs(t - 1.0) * 9) * 0.9 : 0);
        SN.gradeMix({ exp: 1.3, bloom: 0.85, thr: 0.9, streak: 0.4, sat: 0.9, con: 1.08, vig: 0.46, grain: 0.035, ca: 0.0, bars: 0, lift: [0.012, 0.016, 0.026], gain: [0.98, 1.0, 1.04], sc: [0.5, 0.7, 1.0], white: 0 }, a);
      },
    });
  });
})();
