'use strict';
// TRÁI ĐẤT (S 180–204). Cú đinh số 2.
// Vị trí thật lúc 00:00 ngày 24/11/2026 giờ Việt Nam (17:00 UTC): Mặt Trời trên đỉnh đầu điểm 20.4°N… (thực ra 20.44°S, 78.38°W),
// Mặt Trăng gần tròn trên đỉnh đầu 22.1°N 87.1°E (vịnh Bengal) nên phía đêm châu Á được trăng soi; tia sáng đến từ hướng sao Eta Cassiopeiae
// (trên đỉnh đầu 57.8°N 54.6°E) lao xuống Thái Nguyên (21.59°N 105.85°E).
// Lao vào phía đêm thì thấy Mặt Trời khuất sau mép Trái Đất: cho khoảnh khắc ấy trùng đúng giây nhạc tụt (M.DROP).
// Ảnh: NASA "Earth at Night" (ánh đèn ban đêm) và Blue Marble (bề mặt), dùng tự do.
(() => {
  const SN = window.SN, M = SN.M, { clamp, mix, ease, io, ramp } = SN.u;
  const R = Math.PI / 180;
  const geo = (lat, lon) => [Math.cos(lat * R) * Math.cos(lon * R), Math.sin(lat * R), -Math.cos(lat * R) * Math.sin(lon * R)];
  const TN = geo(21.59, 105.85), ETA = geo(57.82, 54.59), SUN = geo(-20.44, -78.38), MOON = geo(22.13, 87.05);
  const add = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  const FRAG = `
  uniform sampler2D tDem, tDemR, tNgay;
  uniform vec3 uSun, uMoon, uSunT;
  uniform float uSunK, uMoonK, uLightK, uStarK, uFine, uGlow;
  uniform vec3 uTA, uTB; uniform float uTrI, uTrW;   // vệt khí sao băng (đơn vị bán kính Trái Đất)
  uniform vec3 uLPn; uniform float uLI;              // điểm ngay dưới tia sáng, độ sáng hắt xuống mây
  uniform float uSpr, uSprS;                         // đèn li ti: độ sáng, độ nhoè (ô)
  const float RA = 1.05, HR = .0066, HM = .0022;
  const vec3 BR = vec3(9.5, 22., 54.);
  const float BM = 5.;
  vec2 cauCat(vec3 ro, vec3 rd, float r){ float b = dot(ro, rd), c = dot(ro, ro) - r * r, h = b * b - c; if (h < 0.) return vec2(-1.); h = sqrt(h); return vec2(-b - h, -b + h); }
  vec3 tex(sampler2D t, vec2 uv){ return pow(texture(t, uv).rgb, vec3(2.2)); }
  float may(vec3 n){ // mây: dải lớn theo vĩ độ + xoáy
    float c = fbm4(n * 1.9 + vec3(.2, .7, .1)) + .55 * fbm3(n * 5.2 + vec3(1.3));
    c += .22 * pn(n * 13.);
    return smoothstep(.06, .42, c);
  }
  vec3 matDat(vec3 n, vec3 v){
    float lat = asin(clamp(n.y, -1., 1.)), lon = atan(-n.z, n.x);
    vec2 uvG = vec2(lon / TAU + .5, lat / PI + .5);
    vec3 dem = tex(tDem, uvG);
    float lonD = degrees(lon), latD = degrees(lat);
    vec2 uvR = vec2((lonD - 92.) / 40., (latD + 5.) / 40.);
    float inR = smoothstep(0., .04, min(min(uvR.x, 1. - uvR.x), min(uvR.y, 1. - uvR.y)));
    if (inR > 0.) dem = mix(dem, tex(tDemR, uvR), inR);
    vec3 day = tex(tNgay, uvG);
    float ocean = smoothstep(.015, -.005, max(day.r, day.g) - day.b * .95) * smoothstep(.12, .02, day.b);
    // đèn thành phố: bỏ lớp nền xanh mờ của ảnh, giữ phần sáng; hạt mịn khi lại gần cho đỡ nhoè
    float lum = dot(dem, vec3(.45, .45, .1));
    vec3 lights = vec3(1., .74, .42) * pow(max(lum - .022, 0.), 1.15) * uLightK * (1. + uFine * (pn(n * 900.) * 1.6 + pn(n * 2600.) * 1.2));
    if (uSpr > 0.) {   // xuống thấp: rắc những ngọn đèn li ti theo mật độ ảnh NASA, cho thành phố sắc nét thay vì một vệt nhoè
      vec2 q = vec2(lonD, latD) * 260.;
      vec2 ce = floor(q), fq = fract(q) - .5;
      vec4 hh = h43(vec3(ce, 11.));
      float pr = clamp((lum - .01) * 7., 0., .85);
      if (hh.w < pr) { vec2 o = (hh.xy - .5) * .6; float r2 = dot(fq - o, fq - o); lights = mix(lights, lights * .35, uSpr) + vec3(1., .76, .46) * exp(-r2 / (uSprS * uSprS)) * (.5 + hh.z) * uSpr * .9 / (uSprS * 4.); }
      else lights *= mix(1., .35, uSpr);
    }
    float mu = dot(n, uMoon), su = dot(n, uSun);
    vec3 land = day * (max(mu, 0.) * uMoonK * vec3(.7, .8, 1.) + max(su, 0.) * uSunK * .55 * vec3(1., .96, .9));
    // chạng vạng: rìa phía ngày đỏ ấm
    land += day * smoothstep(-.08, .05, su) * (1. - smoothstep(.05, .3, su)) * uSunK * .12 * vec3(1., .45, .25);
    lights *= smoothstep(.06, -.12, su);
    float cl = may(n);
    vec3 cCol = vec3(1.) * (max(mu, 0.) * uMoonK * 1.35 * vec3(.75, .85, 1.) + max(su, 0.) * uSunK * .62);
    vec3 h = normalize(uMoon - v);
    float spec = pow(max(dot(n, h), 0.), 260.) * ocean * max(mu, 0.) * uMoonK * 22.;
    vec3 col = land + lights * (1. - cl * .9) + spec * vec3(.82, .88, 1.) * (1. - cl);
    col = mix(col, cCol, cl * .93);
    col += lights * cl * .2;
    // tia sáng đang lao xuống hắt ánh vàng lên mây và đất ngay bên dưới
    float dp = length(n - uLPn);
    col += vec3(1., .78, .5) * uLI * (exp(-dp * dp / 1.2e-5) * (.35 + 1.4 * cl) + exp(-dp / .006) * .08);
    return col;
  }
  // độ sâu quang học từ x tới đỉnh khí quyển theo hướng L (Rayleigh, Mie); chạm đất thì coi như bị che
  vec2 doSau(vec3 x, vec3 L){
    vec2 tp = cauCat(x, L, 1.);
    if (tp.x > 0.) return vec2(1e4);
    vec2 ta = cauCat(x, L, RA);
    float t1 = max(ta.y, 0.), ds = t1 / 6.;
    vec2 od = vec2(0.);
    for (int i = 0; i < 6; i++) { float h = length(x + L * (ds * (float(i) + .5))) - 1.; od += vec2(exp(-h / HR), exp(-h / HM)) * ds; }
    return od;
  }
  vec3 khiQuyen(vec3 ro, vec3 rd, float tMax, out vec3 trans){
    trans = vec3(1.);
    vec2 ta = cauCat(ro, rd, RA);
    if (ta.y < 0.) return vec3(0.);
    float t0 = max(ta.x, 0.), t1 = min(ta.y, tMax);
    if (t1 <= t0) return vec3(0.);
    const int N = 14; float ds = (t1 - t0) / float(N);
    vec3 sR = vec3(0.), sM = vec3(0.), sMo = vec3(0.); vec2 odV = vec2(0.);
    float jit = h12(gl_FragCoord.xy + uSeed);
    for (int i = 0; i < N; i++) {
      vec3 x = ro + rd * (t0 + ds * (float(i) + jit));
      float h = length(x) - 1.;
      vec2 rho = vec2(exp(-h / HR), exp(-h / HM));
      odV += rho * ds;
      vec2 odS = doSau(x, uSun);
      vec3 att = exp(-(BR * (odV.x + odS.x) + BM * (odV.y + odS.y)));
      sR += rho.x * att * ds; sM += rho.y * att * ds;
      sMo += rho.x * exp(-(BR * odV.x + BM * odV.y)) * ds;
    }
    trans = exp(-(BR * odV.x + BM * odV.y));
    float mu = dot(rd, uSun);
    float pR = .0597 * (1. + mu * mu);
    float g = .76, pM = .0796 * (1. - g * g) / pow(1. + g * g - 2. * g * mu, 1.5);
    float muM = dot(rd, uMoon);
    return uSunK * 15. * (sR * BR * pR + sM * BM * pM) + uMoonK * .9 * sMo * BR * .06 * (1. + muM * muM);
  }
  void main(){
    vec3 rd = tiaNhin(vUv), ro = uCP;
    vec3 col = vec3(0.);
    vec2 tp = cauCat(ro, rd, 1.);
    bool hit = tp.x > 0.;
    float tMax = hit ? tp.x : 1e9;
    // nền sao (bị Mặt Trời làm loá thì mờ đi)
    if (!hit) col += (bauTroiSao(rd, uPxA) + nganHa(rd, normalize(vec3(.3, .4, -.86)), uPxA) * .5) * uStarK;
    // Mặt Trời: đĩa + quầng + tia sao; độ xuyên qua khí quyển tính sẵn (uSunT) nên sát mép thì đỏ dần rồi tắt
    float ca = dot(rd, uSun);
    float ang = acos(clamp(ca, -1., 1.));
    if (!hit) {
      float disk = smoothstep(.0052, .0044, ang);
      col += uSunT * (disk * 60. + exp(-ang / .006) * 9. + exp(-ang / .04) * 1.4 + exp(-ang / .2) * .25);
    }
    vec3 trans;
    vec3 sc = khiQuyen(ro, rd, tMax, trans);
    // quầng sáng lúc Mặt Trời trượt sau mép: ôm theo vành khí quyển gần chỗ Mặt Trời
    {
      float bb = length(cross(ro, rd)), alt = bb - 1.;
      float rim = (dot(-ro, rd) > 0.) ? exp(-max(alt, 0.) / .02) * (alt > -.002 ? 1. : 0.) : 0.;
      sc += uGlow * (vec3(1., .55, .25) * exp(-ang / .09) * rim * 6. + vec3(1., .82, .6) * exp(-ang / .02) * 3.5 + vec3(.8, .7, .6) * exp(-ang / .25) * .35);
    }
    if (hit) {
      vec3 p = ro + rd * tp.x, n = normalize(p);
      col = matDat(n, rd) * trans;
    } else col *= trans;
    col += sc;
    // dải sáng xanh lục mờ ở tầng cao (khoảng 95 km), thấy rõ khi nhìn lướt mép phía đêm
    float b = length(cross(ro, rd));
    float fore = dot(-ro, rd) > 0. ? 1. : 0.;
    float lay = (sqrt(max(1.0172 * 1.0172 - b * b, 0.)) - sqrt(max(1.0140 * 1.0140 - b * b, 0.))) * fore;
    if (hit) lay *= .5;
    col += vec3(.32, 1., .42) * lay * .22 * (1. + 1.6 * uSpr);
    float layR = (sqrt(max(1.0245 * 1.0245 - b * b, 0.)) - sqrt(max(1.0185 * 1.0185 - b * b, 0.))) * fore * (hit ? .5 : 1.);
    col += vec3(1., .3, .25) * layR * .12;
    // vệt sao băng: đoạn đường tia sáng đã đi trong khí quyển, phát sáng xanh lục (ôxy), sát đầu thì trắng; phần cũ loang rộng, mờ dần
    if (uTrI > 0.) {
      vec3 v = uTB - uTA, w0 = ro - uTA;
      float bb = dot(rd, v), cc = dot(v, v), dd = dot(rd, w0), ee = dot(v, w0);
      float den = cc - bb * bb;
      float sp = den > 1e-14 ? (bb * ee - cc * dd) / den : 0.;
      float tc = clamp((ee + sp * bb) / max(cc, 1e-14), 0., 1.);
      sp = max(dot(uTA + v * tc - ro, rd), 0.);
      float dT = length(ro + rd * sp - (uTA + v * tc));
      float wd = uTrW * (.5 + 1.5 * pow(1. - tc, 1.4)) + sp * uPxA * .8;
      float fl = .8 + .4 * pn(vec3(tc * 22., uS * .4, 3.1));        // vệt khí không đều: chỗ đậm chỗ nhạt
      float tr = uTrI * exp(-dT * dT / (wd * wd)) * pow(tc, 1.3) * (uTrW / wd) * fl;
      if (hit && sp > tp.x) tr = 0.;
      vec3 trc = mix(vec3(1., .42, .25) * .55, vec3(.24, 1., .5), smoothstep(.0, .45, tc));
      trc = mix(trc, vec3(.9, 1., .93), pow(tc, 12.));
      col += trc * tr * 2.2;
    }
    gl_FragColor = vec4(col * uA, uA);
  }`;

  // ---------- đường bay ----------
  // tia sáng đi trên đường thẳng P(s) = TN + s·ETA (s = khoảng cách tới Thái Nguyên, đơn vị bán kính Trái Đất)
  const Ps = (s) => add(TN, ETA, s);
  const camOff = (s) => { // máy quay theo sau, hơi lệch lên để thấy cả tia sáng lẫn hành tinh
    const side = nrm(cross(ETA, TN)), up = nrm(cross(side, ETA));
    return add(add(Ps(s + 0.05 + s * 0.04), up, 0.012 + s * 0.035), side, -0.01 - s * 0.02);
  };
  // độ cao Mặt Trời nhìn từ vị trí x (dương = còn thấy)
  const sunMargin = (x) => { const b = dot(x, SUN); if (b > 0) return 1; const c2 = dot(x, x) - b * b; return Math.sqrt(Math.max(c2, 0)) - 1.0; };
  let sSet = 1.27;
  { let lo = 0.6, hi = 3.0; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (sunMargin(camOff(m)) > 0.004) hi = m; else lo = m; } sSet = (lo + hi) / 2; }
  // s theo thời gian: qua đúng sSet ở giây nhạc tụt
  const SK = SN.duong([
    [179.5, sSet + 1.25],
    [M.SEAM, sSet + 0.62],
    [M.DROP, sSet],
    [189, sSet - 0.26],
    [194, 0.62],
    [198.5, 0.22],
    [202, 0.045],
    [204, 0.01],
  ]);
  const sAt = (S) => SK(S)[0];
  // hướng nhìn: lúc đầu khung cả mép Trái Đất lẫn Mặt Trời, sau đó cúi dần về Việt Nam
  const LK = SN.duong([
    [179.5, 0.62, 0.0],
    [M.DROP, 0.50, 0.02],
    [188.5, 0.32, 0.12],
    [192.5, 0.08, 0.55],
    [196, 0.0, 0.9],
    [204, 0.0, 1.0],
  ]);
  // pha C: khoảng cách tới Thái Nguyên dọc đường bay (bán kính Trái Đất): 0.03 (khoảng 110 km cao) lúc 201.6 → 0.0016 lúc 206.6 → chạm mây
  const SC = SN.duong([[200.6, 0.045], [201.6, 0.031], [204.2, 0.011], [206.6, 0.0016], [207.7, 0.0005]]);
  const C = { pos: [0, 0, 0], tgt: [0, 0, 0], up: [0, 1, 0], fov: 50 };
  // Pha B (sau khi Mặt Trời khuất): lượn sang đứng trên biển Đông, nhìn xuống như bản đồ (bắc ở trên), rồi lao về Thái Nguyên.
  // [S, vĩ độ, kinh độ, độ cao (bán kính Trái Đất), vĩ độ điểm nhìn, kinh độ điểm nhìn]
  const BK = SN.duong([
    [185.2, 40.0, 92.0, 1.05, 30.0, 100.0],
    [189.0, 31.0, 101.5, 0.80, 22.0, 105.0],
    [192.5, 20.5, 106.8, 0.56, 17.6, 106.6],
    [196.5, 17.2, 107.4, 0.44, 16.4, 106.8],
    [199.6, 20.3, 106.35, 0.2, 21.0, 106.1],
    [202.3, 20.85, 107.0, 0.075, 21.6, 104.9],
    [204.8, 21.2, 107.5, 0.041, 21.9, 102.2],
    [207.7, 21.32, 107.42, 0.035, 21.9, 102.6],
  ]);
  function camAt(S) {
    const s = sAt(S), cpA = camOff(s);
    const k = LK(S), ks = k[0];
    const toC = nrm([-cpA[0], -cpA[1], -cpA[2]]);
    const dA = nrm([mix(toC[0], SUN[0], ks), mix(toC[1], SUN[1], ks), mix(toC[2], SUN[2], ks)]);
    const b = BK(S);
    const g = geo(b[0], b[1]);
    const cpB = [g[0] * (1 + b[2]), g[1] * (1 + b[2]), g[2] * (1 + b[2])];
    const tg = geo(b[3], b[4]);
    const dB = nrm([tg[0] - cpB[0], tg[1] - cpB[1], tg[2] - cpB[2]]);
    const kB = io((S - 185.4) / 5.2);
    const cp = [mix(cpA[0], cpB[0], kB), mix(cpA[1], cpB[1], kB), mix(cpA[2], cpB[2], kB)];
    let d = nrm([mix(dA[0], dB[0], kB), mix(dA[1], dB[1], kB), mix(dA[2], dB[2], kB)]);
    // pha C: hướng nhìn ghé về phía tia sáng đang lao xuống để nó luôn ở trong khung (chân trời vẫn ở trên)
    const kL = 0.3 * ease((S - 202.6) / 1.6);
    if (kL > 0) {
      const lp = add(TN, ETA, SC(clamp(S, 200.6, 207.7))[0]);
      const tl = nrm([lp[0] - cp[0], lp[1] - cp[1], lp[2] - cp[2]]);
      d = nrm([mix(d[0], tl[0], kL), mix(d[1], tl[1], kL), mix(d[2], tl[2], kL)]);
    }
    C.pos = cp; C.tgt = add(cp, d, 1);
    // "trên": pha A hướng ra xa tâm Trái Đất; pha B hướng bắc (bản đồ)
    const radial = nrm(cp);
    const north = nrm([-radial[0] * radial[1], 1 - radial[1] * radial[1], -radial[2] * radial[1]]);
    const kU = kB * (1 - ease((S - 199.8) / 3.4));     // pha C: "trên" lại là hướng ra xa tâm Trái Đất (chân trời nằm ngang)
    const upRef = nrm([mix(radial[0], north[0], kU), mix(radial[1], north[1], kU), mix(radial[2], north[2], kU)]);
    const side = nrm(cross(d, upRef));
    const up0 = nrm(cross(side, d));
    const roll = (8 - 8 * ease((S - 185) / 5)) * R;
    C.up = [up0[0] * Math.cos(roll) + side[0] * Math.sin(roll), up0[1] * Math.cos(roll) + side[1] * Math.sin(roll), up0[2] * Math.cos(roll) + side[2] * Math.sin(roll)];
    C.fov = mix(52, 48, ease((S - 189) / 5)) - 2 * ease((S - 202) / 4);
    C.kB = kB;
    return C;
  }
  // vị trí tia sáng: pha A trên đường thẳng từ ngôi sao; pha B ở giữa máy quay và Thái Nguyên
  const sTrue = (S) => SC(clamp(S, 200.6, 207.7))[0];
  function sparkAt(S, out) {
    const pa = Ps(sAt(S));
    const c = camAt(S), kB = c.kB;
    const k = 0.3;
    const pb = [mix(c.pos[0], TN[0], k), mix(c.pos[1], TN[1], k), mix(c.pos[2], TN[2], k)];
    out[0] = mix(pa[0], pb[0], kB); out[1] = mix(pa[1], pb[1], kB); out[2] = mix(pa[2], pb[2], kB);
    const kC = ease((S - 200.3) / 1.8);
    if (kC > 0) { const pt = Ps(sTrue(S)); out[0] = mix(out[0], pt[0], kC); out[1] = mix(out[1], pt[1], kC); out[2] = mix(out[2], pt[2], kC); }
    return out;
  }
  const S_IGN = 0.03;   // chỗ bắt đầu bốc cháy (khoảng 110 km)
  // ánh sáng Mặt Trời tới máy quay: bị khí quyển lọc (đỏ dần) rồi bị hành tinh che
  const BRv = [9.5, 22, 54], BMv = 5, HR = 0.0066, HM = 0.0022, RAv = 1.05;
  function sunTrans(x, out) {
    const b = dot(x, SUN);
    const c2 = dot(x, x) - b * b;
    if (b < 0 && c2 < 1) { out[0] = out[1] = out[2] = 0; return out; }
    // tích phân độ sâu quang học dọc tia tới Mặt Trời
    let odR = 0, odM = 0; const L = 1.5, n = 40;
    for (let i = 0; i < n; i++) { const t = (i + 0.5) * L / n; const p = add(x, SUN, t); const h = len(p) - 1; if (h < RAv - 1) { odR += Math.exp(-h / HR) * L / n; odM += Math.exp(-h / HM) * L / n; } }
    for (let c = 0; c < 3; c++) out[c] = Math.exp(-(BRv[c] * odR + BMv * odM));
    // mép đĩa Mặt Trời trượt sau chân trời: che dần chứ không tắt cụt
    const marg = Math.sqrt(Math.max(c2, 0)) - 1, sunR = 0.00465 * Math.max(-b, 1e-3);
    if (b < 0) { const vis = clamp(0.5 + marg / (2 * sunR), 0, 1); out[0] *= vis; out[1] *= vis; out[2] *= vis; }
    return out;
  }
  const sp = [0, 0, 0], tmp = [0, 0, 0], st = [1, 1, 1];
  SN.dung.push((T) => {
    const tDem = SN.taiAnh('anh/dem-toan-cau.jpg'), tDemR = SN.taiAnh('anh/dem-dong-nam-a.jpg'), tNgay = SN.taiAnh('anh/ngay-toan-cau.jpg');
    [tDem, tDemR, tNgay].forEach((t) => { t.wrapS = T.RepeatWrapping; });
    tDemR.wrapS = tDemR.wrapT = T.ClampToEdgeWrapping;
    const mesh = SN.quad(FRAG, {
      tDem: { value: tDem }, tDemR: { value: tDemR }, tNgay: { value: tNgay },
      uSun: { value: new T.Vector3(...SUN) }, uMoon: { value: new T.Vector3(...MOON) }, uSunT: { value: new T.Vector3(1, 1, 1) },
      uSunK: { value: 1 }, uMoonK: { value: 0.035 }, uLightK: { value: 2 }, uStarK: { value: 1 }, uFine: { value: 0 }, uGlow: { value: 0 },
      uTA: { value: new T.Vector3() }, uTB: { value: new T.Vector3() }, uTrI: { value: 0 }, uTrW: { value: 0.00018 },
      uLPn: { value: new T.Vector3(0, 1, 0) }, uLI: { value: 0 }, uSpr: { value: 0 }, uSprS: { value: 0.3 },
    });
    const tr = [];
    SN.them({
      ten: 'traidat', tu: 179.5, den: 207.7, lop: 50, mesh, warmS: 186,
      a: (S) => ramp(S, 180.6, 181.75),
      cap(S, a) {
        const u = mesh.material.uniforms;
        const c0 = camAt(S), c = { pos: c0.pos.slice(), tgt: c0.tgt.slice(), up: c0.up.slice(), fov: c0.fov };
        SN.camQuad(mesh.material, c.pos, c.tgt, c.up, c.fov);
        SN.uChung.uPxA.value = 2 * Math.tan(c.fov * Math.PI / 360) / Math.max(1, SN.size()[1]);
        sunTrans(c.pos, st);
        u.uSunT.value.set(st[0], st[1], st[2]);
        const sunVis = (st[0] + st[1] + st[2]) / 3;
        u.uStarK.value = mix(0.25, 1.0, 1 - sunVis);
        const s = sAt(S);
        u.uFine.value = clamp(1 - s / 0.5, 0, 1);
        u.uLightK.value = mix(1.6, 2.2, clamp(1 - s / 0.8, 0, 1));
        const mg = sunMargin(c.pos); u.uGlow.value = Math.exp(-Math.abs(mg) / 0.006) * (mg < 0 ? Math.exp(-(S - M.DROP) * 0.5) : 1) * 1.0;
        // tia sáng: phía trước máy quay trên đường bay
        const h = SN.chieu(mesh.material, sparkAt(S, sp), [0, 0, 0]);
        tr.length = 0;
        for (let k = 0; k < 14; k++) { const q = SN.chieu(mesh.material, sparkAt(S - k * 0.05, tmp), [0, 0, 0]); tr.push(q[2] > 0 ? [q[0], q[1]] : [-9, -9]); }
        // vào khí quyển: bốc cháy, sáng lên, kéo vệt khí xanh lục; sát mây thì loé rồi lặn vào mây (207.2), cắt sang mặt đất
        const sT = sTrue(S), ign = S > 200.6 ? ease((S_IGN + 0.002 - sT) / 0.006) : 0;
        const dive = 1 - ease((S - 207.05) / 0.35);
        const iH = a * (1 + 0.55 * ign * (1 + 0.12 * Math.sin(S * 47) * Math.sin(S * 29))) * dive + 1.2 * Math.exp(-Math.pow((S - 206.95) / 0.12, 2));
        SN.tiaDat([h[0], h[1]], tr, iH, 1.8 + 0.5 * ign, 1 - ease((S - 200.8) / 1.0));
        if (ign > 0) {
          const pA = Ps(Math.max(S_IGN, sT)), pB = sparkAt(S, tmp);
          u.uTA.value.set(pA[0], pA[1], pA[2]); u.uTB.value.set(pB[0], pB[1], pB[2]);
          u.uTrI.value = ign * 1.6 * (1 - 0.3 * ease((S - 206.6) / 1));
          u.uTrW.value = 0.00007 + 0.00005 * ease((S - 203) / 4);
          const g = nrm(pB);
          u.uLPn.value.set(g[0], g[1], g[2]);
          u.uLI.value = ign * ease((0.012 - sT) / 0.01) * 0.9 + 1.6 * Math.exp(-Math.pow((S - 206.95) / 0.2, 2));
        } else { u.uTrI.value = 0; u.uLI.value = 0; }
        const alt = Math.hypot(c.pos[0], c.pos[1], c.pos[2]) - 1;
        u.uSpr.value = clamp((0.1 - alt) / 0.05, 0, 1);
        u.uSprS.value = clamp(alt * (2 * Math.tan(c.fov * Math.PI / 360) / SN.size()[1]) / (1 / 6371 * 0.43) * 0.55, 0.1, 0.45);
        // hậu kỳ: lúc Mặt Trời còn chói thì hạ phơi sáng; khuất rồi thì mở dần cho phía đêm hiện lên
        const flash = Math.exp(-Math.abs(S - M.DROP) * 5) * 0.0;
        SN.gradeMix({ exp: mix(1.3, 0.7, sunVis), bloom: 0.95, thr: 1.5, streak: mix(0.3, 0.42, sunVis), sat: 1.08, con: 1.05, vig: 0.4, grain: 0.03, ca: 0.012, bars: 1,
          lift: [0.006, 0.009, 0.018], gain: [1.0, 1.0, 1.03], sc: [0.55, 0.68, 1.0], white: flash }, a);
      },
    });
  });
  SN.traidat = { camAt, sAt, sSet: () => sSet };
})();
