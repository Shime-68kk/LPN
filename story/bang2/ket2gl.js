'use strict';
// Kết 2 · Hoạt cảnh "Mưa rơi ngược" (bản 3D, three.js chép sẵn ở lib/three-k2.js).
// Mọi thứ là hàm thuần của S (giây của am/dct.mp3) nên tua tới đâu cũng ra đúng hình.
// Nhịp bài: 60 nhịp/phút, phách rơi vào x.8 (48.8, 49.8 …); 131.0–132.0 nhạc im hẳn → mưa đứng hình.
// dan.js gọi KET2GL.nap() lúc đèn tắt và KET2GL.frame(S, now, dt) mỗi khung hình; trả false thì dan.js dùng bản 2D cũ.
(() => {
  const Q = new URLSearchParams(location.search);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const S_IN = 47.2, S_A = 48.8, S_B = 80.8, S_FRZ = 130.9, S_UP = 134.6, S_E = 142.8, S_END = 166;
  const KEYC = [[1.0, 0.66, 0.22], [0.72, 0.44, 0.95], [1.0, 0.40, 0.26], [0.40, 0.92, 0.48], [1.0, 0.46, 0.68]]; // cam, tím, đỏ cam, xanh, hồng
  const ORG = [40, 30, 0]; // mái nhà anh: tâm các sóng màu
  const WAVE_T = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => S_A + 4 * k);
  const WAVE_C = [KEYC[0], KEYC[1], KEYC[2], KEYC[3], KEYC[4], [1.0, 0.55, 0.45], [0.55, 0.6, 1.0], [1.0, 0.86, 0.62]];

  // ---- quãng đường máy quay đi (trục z = hướng bắc, về phía em) ----
  const VK = [[80.8, 30], [86.8, 50], [102.8, 50], [116.8, 70], [130.9, 92], [131.3, 1.6], [166, 1.0]];
  const D0 = 60;
  function dcam(S) {
    if (S <= VK[0][0]) return D0;
    let d = D0;
    for (let i = 0; i < VK.length - 1; i++) {
      const s0 = VK[i][0], v0 = VK[i][1], s1 = VK[i + 1][0], v1 = VK[i + 1][1];
      if (S >= s1) d += (v0 + v1) / 2 * (s1 - s0);
      else { const t = S - s0, v = v0 + (v1 - v0) * t / (s1 - s0); return d + (v0 + v) / 2 * t; }
    }
    return d + VK[VK.length - 1][1] * (S - VK[VK.length - 1][0]);
  }
  const D_FR = dcam(S_FRZ);      // chỗ mưa đứng hình
  const Z_TRAI = D_FR + 150;     // dãy nhà doanh trại
  const LEAD = 160;
  const frontZ = (S) => (S < 76.8 ? 60 : S < 80.8 ? 60 + LEAD * ease((S - 76.8) / 4) : dcam(S) + LEAD);
  const FT = []; for (let s = 76.8; s <= 131.2; s += 0.02) FT.push(frontZ(s));
  // lúc một vật ven đường "bật lên": khi mép đường sáng chạm tới, làm tròn lên nhịp 1/4 giây
  function birthAt(z) {
    let lo = 0, hi = FT.length - 1;
    if (z <= FT[0]) return 76.8;
    if (z > FT[hi]) return 131;
    while (lo < hi) { const m = (lo + hi) >> 1; if (FT[m] >= z) hi = m; else lo = m + 1; }
    const s = 76.8 + lo * 0.02;
    return Math.ceil((s - 0.05) * 4) / 4 + 0.05;
  }
  function kf(K, S) {
    if (S <= K[0][0]) return K[0][1];
    for (let i = 0; i < K.length - 1; i++) if (S < K[i + 1][0]) return mix(K[i][1], K[i + 1][1], ease((S - K[i][0]) / (K[i + 1][0] - K[i][0])));
    return K[K.length - 1][1];
  }
  const YK = [[80.8, 4.4], [94, 5.2], [104, 5.0], [117, 5.6], [126, 6.4], [130.9, 9], [142.8, 13], [152, 17], [166, 19]];
  const PK = [[80.8, 0.03], [104, 0.05], [117, 0.09], [128, 0.15], [131, 0.17], [142.8, 0.20], [152, 0.21], [166, 0.215]];
  const FK = [[80.8, 62], [104, 68], [128, 77], [131.4, 70], [142.8, 60], [152, 54], [166, 52]];
  // máy quay đoạn "tô màu thế giới": [S, x,y,z, nhìn x,y,z, góc mở]
  const AK = [
    [47.2, 41.6, 15.2, 25, 41.35, 14.5, 11, 34],
    [50.2, 41.2, 16.4, 31, 41.35, 15.0, 11, 38],
    [54, 36, 26, 60, 40, 19, 0, 46],
    [62, 12, 68, 168, 40, 14, -50, 50],
    [70, -46, 114, 268, 40, 6, -130, 52],
    [74.6, -152, 120, 150, 36, 12, -20, 52],
    [77.6, -118, 84, -40, 20, 10, 170, 57],
    [79.8, -34, 30, 0, 4, 8, 290, 60],
  ];
  function herm(K, S) {
    const n = K.length, o = new Array(7);
    if (S <= K[0][0]) return K[0].slice(1);
    if (S >= K[n - 1][0]) return K[n - 1].slice(1);
    let i = 0; while (S > K[i + 1][0]) i++;
    const a = K[i], b = K[i + 1], h = b[0] - a[0], t = (S - a[0]) / h, t2 = t * t, t3 = t2 * t;
    const p = K[Math.max(0, i - 1)], q = K[Math.min(n - 1, i + 2)];
    for (let j = 1; j <= 7; j++) {
      const m0 = i === 0 ? 0 : (b[j] - p[j]) / (b[0] - p[0]), m1 = i + 2 >= n ? 0 : (q[j] - a[j]) / (q[0] - a[0]);
      o[j - 1] = (2 * t3 - 3 * t2 + 1) * a[j] + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * b[j] + (t3 - t2) * h * m1;
    }
    return o;
  }
  function camAt(S) {
    const A = herm(AK, S);
    if (S <= 77.8) return A;
    const lg = ease((S - 131) / 11) * 13 - ease((S - 143) / 12) * 9;
    const z = dcam(S), sw = Math.sin(S * 0.31) * 1.2 + lg, y = kf(YK, S), pt = kf(PK, S);
    const B = [sw, y, z, sw * 0.4 - lg * 0.25, y + pt * 60, z + 60, kf(FK, S)];
    const w = ease((S - 77.8) / 3.8);
    return A.map((v, i) => mix(v, B[i], w));
  }
  // năm đốm sáng (năm phím). 136.8 trở đi chúng vút lên như pháo hoa và nổ lần lượt ở TB[i], mỗi nhịp một quả
  const TB = [142.8, 143.8, 144.8, 145.8, 146.8], HX = [-104, -52, 0, 52, 104], HY = [112, 96, 128, 92, 110];
  function headAt(i, S, o) {
    const ph = i * 1.2566;
    const ang = S * 0.55 + ph, R = 8 + 1.5 * Math.sin(S * 0.9 + i);
    let ax = ORG[0] + Math.cos(ang) * R, ay = 37 + 2.2 * Math.sin(S * 1.3 + ph), az = Math.sin(ang) * R;
    const e = ease((S - 48.2 - i * 0.28) / 3.4);
    const wx = 41.35 + (i - 2) * 0.3, wy = 14.5, wz = 11.4 + clamp((S - 47.4) / 1.4, 0, 1) * 1.6;
    ax = mix(wx, ax, e); ay = mix(wy, ay, e) + Math.sin(e * Math.PI) * 3; az = mix(wz, az, e) + Math.sin(e * Math.PI) * 10;
    const Sf = Math.min(S, S_FRZ), pz = Sf + (S - Sf) * 0.05;
    const near = 1 - 0.45 * ease((S - 112) / 14);
    const upl = clamp((S - 136.8) / (TB[i] - 136.8), 0, 1), up2 = 1 - (1 - upl) * (1 - upl);
    const bz = dcam(S) + 30 + 5 * Math.sin(pz * 0.7 + i * 1.7) + 250 * up2;
    const bx = 3.8 * near * Math.sin(pz * 1.15 + ph) * (1 - up2) + HX[i] * up2;
    const by = kf(YK, S) + 0.5 + 1.5 * near * Math.sin(pz * 1.9 + ph * 1.7) * (1 - up2) + HY[i] * up2;
    const w = ease((S - 77.2 - i * 0.2) / 3.4);
    o[0] = mix(ax, bx, w); o[1] = mix(ay, by, w); o[2] = mix(az, bz, w);
    return o;
  }
  // sét: [giây, độ mạnh, lệch x, lệch z so với máy quay]; khớp tiếng trống đã đo từ bài
  const FL = [[73.8, 0.25, -300, 1500], [77.8, 0.3, 380, 1700], [81.8, 0.3, -420, 1500], [85.8, 0.35, 300, 1400], [89.8, 0.35, -260, 1300], [93.8, 0.4, 420, 1200],
    [97.8, 0.45, -380, 1100], [101.8, 0.5, 300, 1000], [104.8, 0.85, -220, 820], [105.8, 0.5, 340, 900], [107.8, 0.6, -400, 800], [108.8, 0.5, 180, 760], [109.8, 0.7, 420, 720],
    [111.8, 0.7, -300, 700], [112.8, 0.95, 120, 640], [113.8, 0.7, -460, 700], [114.8, 0.6, 380, 660], [115.8, 0.8, -160, 600],
    [116.8, 1.0, 240, 560], [117.8, 0.7, -340, 600], [118.8, 0.9, 420, 540], [119.8, 0.7, -120, 520], [120.8, 1.0, -420, 560], [121.8, 0.75, 300, 500], [122.8, 0.95, -220, 480], [123.8, 0.8, 160, 520], [124.8, 1.05, -360, 460],
    [125.81, 0.7, 320, 440], [125.97, 0.6, -150, 500], [126.13, 0.8, 100, 420], [126.47, 0.7, -400, 460], [126.56, 0.6, 260, 520], [126.79, 0.9, -80, 400], [126.99, 0.7, 380, 440], [127.13, 0.8, -300, 420], [127.47, 0.9, 180, 380], [127.8, 1.0, -200, 400],
    [128.8, 1.7, 60, 420], [129.3, 1.0, -340, 400], [129.8, 1.1, 320, 380], [130.3, 1.0, -160, 360], [130.9, 1.25, 150, 330]];
  const FRZ_I = FL.length - 1;
  function flashEnv(k, S) {
    const t = S - FL[k][0];
    if (t < 0) return 0;
    if (k === FRZ_I) return FL[k][1] * (0.42 * (1 - ease((S - 133) / 5.5)) + 0.7 * Math.exp(-t * 5));
    if (t > 1.2) return 0;
    return FL[k][1] * Math.max(0, Math.exp(-t * 6.5) * (1 + 0.45 * Math.sin(t * 55)) + (t > 0.17 ? 0.55 * Math.exp(-(t - 0.17) * 9) : 0));
  }
  // "thời gian của mưa": chạy đều tới 130.9, đứng yên, rồi chạy NGƯỢC nhanh dần
  const rainRate = (S) => (S < S_FRZ ? 1 : S < S_UP ? 0 : -Math.min(2.2, (S - S_UP) * 0.3));
  function rainT(S) {
    if (S < S_FRZ) return S;
    if (S < S_UP) return S_FRZ;
    const t = S - S_UP, tm = 2.2 / 0.3;
    return S_FRZ - (t < tm ? 0.15 * t * t : 0.15 * tm * tm + 2.2 * (t - tm));
  }
  function doiH(x, z) { // đồi chè: giống hệt hàm trong shader mặt đất
    const sm = (a, b, v) => ease((v - a) / (b - a));
    const m = sm(1980, 2450, z), w = mix(24, 86, sm(3040, 3150, z));
    const side = sm(w, w + 150, Math.abs(x));
    const n = 0.5 + 0.25 * Math.sin(x * 0.011 + 1.3) + 0.15 * Math.sin(z * 0.0083 + x * 0.004) + 0.10 * Math.sin(z * 0.019 - 0.5);
    return m * side * (16 + 52 * n) + sm(3290, 3650, z) * 70 * (0.6 + 0.4 * Math.sin(x * 0.006 + 1.0));
  }

  let T = null, ready = false, failed = false, loading = false;
  let renderer = null, composer = null, bloomPass = null, gradePass = null, scene = null, cam = null, cvs = null;
  let G = null, lastCall = 0, shown = false, quality = 1, basePR = 1, frameMs = 16, slowN = 0, wPx = 0, hPx = 0;
  let skyM, roadM, rainM, starM, textMesh, headPts, glowUs = [], ribbons = [], bolts = [], camVelPrev = null;
  const QPIN = parseFloat(Q.get('k2q')) || 0;
  // dòng đo tốc độ: chỉ dùng khi thử trong mạng nhà, trên web thật không bao giờ hiện
  const DO = Q.get('k2do') === '1' && /^(localhost|127\.0\.0\.1|192\.168\.)/.test(location.hostname); let doEl = null, doN = 0, doT = 0, doCham = 0;
  let DT = false; try { DT = matchMedia('(pointer: coarse)').matches; } catch (e) { /* bỏ qua */ }
  const LOW = Q.get('k2nhe') === '1' || (DT && Q.get('k2nhe') !== '0');
  const FPS = parseFloat(Q.get('k2fps')) || 0; // ép số khung hình mỗi giây (thử)
  let lastDraw = 0, needResize = false, nDoi = -1, nMat = 0, nAn = 0, gapMax = 0;
  let khoaNet = false, thuNet = 0, msTruoc = 0;

  // ================= SHADER =================
  const CH = `
  uniform float uS; uniform vec3 uFogCol; uniform float uFogD; uniform float uFlash; uniform vec3 uSun; uniform float uDawn; uniform float uAmb;
  uniform float uWaveR[8]; uniform vec3 uWaveC[8]; uniform vec3 uOrg; uniform float uBeat; uniform float uGrey; uniform vec3 uKey[5];
  uniform vec3 uBC[5]; uniform float uBT[5]; uniform vec3 uBurst;
  float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float h11(float n){ return h21(vec2(n, n * 1.7 + 3.1)); }
  float qua(int k, float d){ return smoothstep(0., 36., uWaveR[k]-d); }
  vec3 nhuom(vec3 col, vec3 wp, float glowK){
    float d = length(wp.xz - uOrg.xz); float gs = 0.; vec3 ring = vec3(0.);
    for (int k = 0; k < 8; k++) { float r = uWaveR[k]; if (r > 0.) { gs += smoothstep(0., 36., r - d); float q = (d - r) / (11. + r * .02); ring += uWaveC[k] * exp(-q*q) * (1. - smoothstep(650., 1250., r)); } }
    float sat = mix(1., clamp(gs * .125, 0., 1.), uGrey);
    float l = dot(col, vec3(.3,.59,.11));
    col = mix(vec3(l) * vec3(.9,.96,1.07), col, sat);
    return col + ring * glowK;
  }
  vec3 suong(vec3 col, vec3 wp, float k){ float dist = length(wp - cameraPosition); return mix(col, uFogCol, 1. - exp(-dist * uFogD * k)); }
  vec3 sang(vec3 n){
    float hemi = .5 + .5 * n.y;
    vec3 L = uAmb * mix(vec3(.10,.115,.15), vec3(.27,.31,.41), hemi);
    L += uFlash * vec3(.8,.9,1.15) * .40 * (.3 + .7 * max(dot(n, normalize(vec3(.2,.8,.55))), 0.));
    L += uDawn * (vec3(1.25,.74,.48) * max(dot(n, uSun), 0.) + vec3(.40,.34,.42) * hemi);
    L += uBurst * (.2 + .5 * hemi);
    return L;
  }
  float bat(float birth){ // bật lên có nảy
    if (birth <= 0.) return 1.;
    float t = (uS - birth) / .55;
    if (t <= 0.) return 0.; if (t >= 1.) return 1.;
    return pow(2., -10. * t) * sin((t * 10. - .75) * 2.0944) + 1.;
  }`;

  const SKY_V = `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); gl_Position = p.xyww; }`;
  const SKY_F = CH + `
  varying vec3 vDir; uniform sampler2D uNoise; uniform float uCov, uGlow, uStars, uMount; uniform vec3 uSkyTint; uniform vec3 uFP[3]; uniform float uFI[3];
  float nz(vec2 p){ return texture2D(uNoise, p * .00390625).r; }
  float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * nz(p); p = p * 2.03 + vec2(.31,.17); a *= .5; } return s; }
  void main(){
    vec3 d = normalize(vDir); float y = d.y;
    vec3 night = mix(vec3(.055,.068,.10), vec3(.008,.014,.035), pow(clamp(y, 0., 1.), .45));
    vec3 dawnC = mix(mix(vec3(1.,.58,.32), vec3(.86,.44,.55), smoothstep(0., .16, y)), vec3(.15,.19,.43), smoothstep(.06, .52, y));
    float sunA = max(dot(d, uSun), 0.);
    dawnC += vec3(1.,.62,.34) * pow(sunA, 40.) * .38 + vec3(1.,.86,.62) * pow(sunA, 2600.) * .9;
    vec3 col = mix(night, dawnC, uDawn);
    float dens = 0.;
    if (y > 0.) {
      float inv = 1. / (y + .07);
      vec2 wp = cameraPosition.xz + d.xz * inv * 260.;
      vec2 p = wp * .0052 + vec2(uS * .020, uS * .011);
      float n = fbm(p), n2 = fbm(p * 2.3 + 31.);
      dens = smoothstep(1. - uCov, 1. - uCov + .30, n * .78 + n2 * .40);
      float thick = smoothstep(.15, 1., dens * (n * 1.5));
      vec3 cn = mix(vec3(.105,.12,.155), vec3(.026,.032,.048), thick);
      cn += vec3(.20,.15,.13) * uGlow * exp(-y * 6.) * (.4 + .9 * n2);
      cn += uSkyTint * (.35 + .9 * n2) * exp(-y * 1.6);
      for (int i = 0; i < 3; i++) { vec2 q = wp - uFP[i].xz; float rr = uFP[i].y; cn += vec3(.72,.84,1.25) * uFI[i] * exp(-dot(q,q) / (rr*rr)) * (.25 + 1.5 * n2 * n); }
      cn += uFlash * vec3(.05,.06,.085) + uBurst * .07 * (.4 + n2);
      vec3 cd = mix(vec3(.98,.60,.50), vec3(.42,.32,.52), thick) + pow(sunA, 8.) * vec3(.3,.14,.04);
      vec3 cc = mix(cn, cd, uDawn);
      col = mix(col, cc, dens * smoothstep(0., .09, y));
      vec2 sp = d.xz / (y + .4) * 150.; float sh = h21(floor(sp)); vec2 sf = fract(sp) - .5;
      col += vec3(.9,.95,1.) * step(.9965, sh) * (1. - smoothstep(.05, .32, length(sf))) * (.5 + .5 * sin(uS * 2. + sh * 90.)) * uStars * (1. - dens) * smoothstep(.05, .3, y);
    }
    float az = atan(d.x, d.z);
    float mh = (.030 + .040 * nz(vec2(az * 3.1 + 7., 3.5)) + .014 * nz(vec2(az * 11., 9.5))) * uMount * smoothstep(-.2, .35, d.z);
    vec3 haze = uFogCol + uDawn * vec3(.30,.15,.04) * pow(sunA, 14.);
    col = mix(col, haze, exp(-max(y, 0.) * (9. - 4. * uDawn)));
    vec3 mc = mix(vec3(.018,.024,.036) + uFlash * vec3(.03,.035,.05), vec3(.20,.13,.19), uDawn);
    col = mix(col, mix(mc, haze, .25), (1. - smoothstep(mh - .002, mh + .004, y)) * step(.0001, uMount));
    if (y < 0.) col = mix(col, uFogCol, .85);
    gl_FragColor = vec4(clamp(col, 0., 30.), 1.);
  }`;

  const GROUND_V = CH + `
  varying vec3 vW;
  float doi(vec2 p){
    float m = smoothstep(1980., 2450., p.y), w = mix(24., 86., smoothstep(3040., 3150., p.y));
    float side = smoothstep(w, w + 150., abs(p.x));
    float n = .5 + .25 * sin(p.x * .011 + 1.3) + .15 * sin(p.y * .0083 + p.x * .004) + .10 * sin(p.y * .019 - .5);
    return m * side * (16. + 52. * n) + smoothstep(3290., 3650., p.y) * 70. * (.6 + .4 * sin(p.x * .006 + 1.));
  }
  void main(){ vec4 w = modelMatrix * vec4(position, 1.); w.y = doi(w.xz); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const GROUND_F = CH + `
  varying vec3 vW; uniform sampler2D uNoise; uniform float uPylOn[5]; uniform float uFront;
  void main(){
    float x = vW.x, z = vW.z, dO = length(vW.xz - uOrg.xz);
    if (abs(x) < 6.9 && z > 41. && z < min(uFront, 3299.) - .5) discard;
    vec3 n = cross(dFdx(vW), dFdy(vW)); n = dot(n, n) > 1e-14 ? normalize(n) : vec3(0., 1., 0.); if (n.y < 0.) n = -n;
    vec3 V = normalize(cameraPosition - vW); float fres = pow(1. - max(dot(V, n), 0.), 4.);
    // phố
    vec2 g = abs(fract(vec2(x, z) / 64.) - .5) * 64.; vec2 gw = max(vec2(.5), fwidth(vec2(x, z)));
    float st = max(smoothstep(27. - gw.x, 27. + gw.x, g.x), smoothstep(27. - gw.y, 27. + gw.y, g.y)); st = max(st, 1. - smoothstep(13., 14.5, abs(x)));
    vec3 city = mix(vec3(.058,.060,.066), vec3(.034,.036,.043), st);
    vec2 lp = abs(fract(vec2(x, z) / 32.) - .5) * 32.;
    vec3 em = vec3(1.,.64,.30) * exp(-dot(lp, lp) / 46.) * st * qua(1, dO) * .5;
    float wet = st * .9;
    // sông
    float rv = smoothstep(596., 612., z) * (1. - smoothstep(1186., 1204., z));
    vec2 rp = vW.xz * .16 + vec2(uS * .35, uS * .5); float rip = texture2D(uNoise, rp * .0039).r + .5 * texture2D(uNoise, (rp * 2.7 - vec2(uS * .8)) * .0039).r;
    vec3 river = vec3(.012,.020,.036) + uFogCol * .5 * rip;
    vec3 remi = vec3(0.);
    for (int k = 0; k < 5; k++) { float dz = z - (700. + 100. * float(k)); remi += uKey[k] * uPylOn[k] * exp(-dz * dz / 420.) * exp(-abs(x) / 150.) * (.25 + .9 * rip) * .55; }
    // ruộng nước
    float fd = smoothstep(1196., 1230., z);
    vec2 c = vec2(x + 11. * sin(z * .013), z) / vec2(31., 23.); vec2 f = abs(fract(c) - .5); vec2 cw = fwidth(c); float cxa = smoothstep(.12, .45, max(cw.x, cw.y));
    float bund = smoothstep(.44, .485, max(f.x, f.y)) * (1. - cxa); float wc = mix(h21(floor(c)), .5, cxa);
    float luong = mix(.5 + .5 * sin(x * 2.4 + wc * 6.), .5, smoothstep(.5, 1.8, fwidth(x) * 2.4));
    vec3 field = mix(vec3(.016,.034,.026), vec3(.022,.034,.046), wc) * (.8 + .4 * luong); field = mix(field, vec3(.012,.016,.014), bund);
    float fwet = (.25 + .75 * wc) * (1. - bund) * (.55 + .45 * luong);
    // đồi chè
    float hl = smoothstep(.6, 5., vW.y);
    float row = abs(fract(vW.y / 2.5) - .5); float rw = fwidth(vW.y / 2.5); float sp = mix(smoothstep(.16 - rw, .30 + rw, row), .54, smoothstep(.3, .8, rw));
    vec3 tea = mix(vec3(.024,.052,.036), vec3(.060,.135,.075), sp) * (.75 + .5 * texture2D(uNoise, vW.xz * .00022).r);
    vec3 col = mix(city, river, rv); wet = mix(wet, 1., rv);
    col = mix(col, field, fd); wet = mix(wet, fwet, fd); em *= (1. - rv) * (1. - fd);
    col = mix(col, tea, hl); wet *= (1. - hl);
    col *= sang(n) * 2.1;
    col += (uFogCol * 1.5 + uFlash * vec3(.22,.26,.36)) * fres * wet;
    col += uFlash * vec3(.30,.36,.48) * fwet * fd * (1. - hl) * .22;
    col = nhuom(col, vW, .85) + em + remi * rv;
    gl_FragColor = vec4(clamp(suong(col, vW, 1.), 0., 30.), 1.);
  }`;

  const ROAD_V = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const ROAD_F = CH + `
  varying vec3 vW; uniform float uFront;
  void main(){
    float x = vW.x, z = vW.z; if (z > uFront) discard;
    vec3 V = normalize(cameraPosition - vW); float fres = pow(1. - max(V.y, 0.), 4.);
    vec3 col = vec3(.040,.042,.050) * sang(vec3(0.,1.,0.)) * 2.4;
    float xw = fwidth(x) + 1e-4, zw = fwidth(z / 8.);
    float dsh = (1. - smoothstep(.2, .2 + xw, abs(x))) * mix(step(.5, fract(z / 8.)), .5, smoothstep(.2, .55, zw)) * min(1., .5 / xw + .25);
    float edge = (1. - smoothstep(.13, .13 + xw, abs(abs(x) - 6.3))) * min(1., .35 / xw + .25);
    col += vec3(.80,.76,.62) * (dsh * .5 + edge * .32) * (.35 + uFlash + uDawn);
    float i = floor((z - 90.) / 30. + .5); float dz = z - (90. + 30. * i); int ci = int(mod(i, 5.));
    vec3 lc = mix(uKey[ci], vec3(1.,.8,.55), .35);
    float lampOn = step(z, 2010.);
    col += lc * exp(-dz * dz / 60.) * exp(-(abs(x) - 6.6) * (abs(x) - 6.6) / 9.) * .42 * (.75 + .35 * uBeat) * lampOn;
    col += (uFogCol * 1.8 + uFlash * vec3(.28,.32,.42)) * fres;
    float eq = (uFront - z) / 6.; float e = exp(-eq * eq);
    col += vec3(1.,.84,.58) * e * 1.5;
    gl_FragColor = vec4(clamp(suong(col, vW, 1.), 0., 30.), 1.);
  }`;

  const BLD_V = CH + `
  attribute vec3 iPos; attribute vec3 iSc; attribute vec4 iCol;
  varying vec3 vW, vN, vL, vC; varying float vSeed;
  void main(){ vL = position * iSc; vec3 p = vL + iPos; vW = p; vN = normal; vC = iCol.rgb; vSeed = iCol.a; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`;
  const BLD_F = CH + `
  varying vec3 vW, vN, vL, vC; varying float vSeed;
  void main(){
    vec3 n = normalize(vN); float dO = length(vW.xz - uOrg.xz);
    vec3 col; vec3 em = vec3(0.);
    if (n.y > .5) {
      float tile = step(.62, h11(vSeed * 7.3));
      col = mix(vec3(.085,.088,.095), mix(vec3(.10,.085,.08), vec3(.42,.17,.11), qua(2, dO)), tile);
    } else {
      float u = abs(n.x) > .5 ? vL.z : vL.x; float fid = n.x * 1.7 + n.z * 3.1;
      vec2 gq = vec2(u / 2.7 + 50., vL.y / 3.2); vec2 id = floor(gq), f = fract(gq);
      vec2 fw = fwidth(gq) * .75 + 1e-4; float xa = smoothstep(.22, .6, max(fw.x, fw.y)); // xa: ô cửa nhỏ hơn điểm ảnh → dùng giá trị trung bình
      float win = smoothstep(.2 - fw.x, .2 + fw.x, f.x) * (1. - smoothstep(.8 - fw.x, .8 + fw.x, f.x)) * smoothstep(.26 - fw.y, .26 + fw.y, f.y) * (1. - smoothstep(.80 - fw.y, .80 + fw.y, f.y)) * step(3.2, vL.y);
      float h = h21(id + vec2(vSeed * 31.7, fid));
      float pl = (.02 + .15 * qua(0, dO) + .05 * qua(4, dO) + .06 * qua(6, dO)) * step(vSeed, .99);
      float lit = step(h, pl);
      vec3 wc = mix(vec3(1.,.70,.34), vec3(.70,.82,1.), step(.88, h11(h * 91.)));
      win = mix(win, .32 * step(3.2, vL.y), xa);
      col = mix(vC, vec3(.035,.045,.06), win);
      em = mix(win * lit * wc * (.70 + .5 * h11(h * 13.)), vec3(.95,.70,.40) * .32 * pl * .95 * step(3.2, vL.y), xa);
      if (vL.y < 3.2) { // hàng quán tầng trệt: năm màu của năm phím, sóng màu nào qua thì màu ấy sáng
        float sid = floor(u / 5.4 + 20.); float sh = h21(vec2(sid, vSeed * 53. + fid)); int kc = int(mod(floor(sh * 97.), 5.));
        float son = step(sh, .55) * qua(kc, dO) * step(.6, vL.y) * step(vL.y, 2.7) * step(.12, fract(u / 5.4));
        em += uKey[kc] * son * .6 * (1. - xa);
      }
    }
    col *= sang(n) * 1.5 * (.55 + .45 * smoothstep(0., 14., vW.y));
    col = nhuom(col, vW, .95);
    gl_FragColor = vec4(clamp(suong(col, vW, 1.) + suong(em, vW, .8) - suong(vec3(0.), vW, .8), 0., 30.), 1.);
  }`;

  const PROP_V = CH + `
  attribute vec3 aCol; attribute vec2 aMix; attribute vec3 iPos; attribute vec3 iSc; attribute float iRot; attribute vec3 iCol; attribute vec2 iTime;
  varying vec3 vW, vN, vC; varying float vE;
  void main(){
    float pop = bat(iTime.x);
    vec3 p = position * iSc; p.y *= pop; p.xz *= mix(.55, 1., min(pop, 1.)) * step(.001, pop);
    float c = cos(iRot), s = sin(iRot);
    p.xz = mat2(c, -s, s, c) * p.xz; vec3 nn = normal; nn.xz = mat2(c, -s, s, c) * nn.xz;
    p += iPos; vW = p; vN = nn; vC = mix(aCol, iCol * aCol, aMix.y);
    vE = aMix.x * (iTime.y <= 0. ? 1. : smoothstep(0., .5, uS - iTime.y));
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  }`;
  const PROP_F = CH + `
  varying vec3 vW, vN, vC; varying float vE; uniform float uEmK; uniform float uWaveEm; uniform float uLitK;
  void main(){
    vec3 n = normalize(vN);
    vec3 col = vC * sang(n) * uLitK * (1. - vE);
    col = nhuom(col, vW, .5);
    float we = uWaveEm < 0. ? 0. : qua(int(uWaveEm), length(vW.xz - uOrg.xz)) * uGrey;
    col += vC * we * .35;
    col += vC * vE * uEmK * (.8 + .3 * uBeat);
    gl_FragColor = vec4(clamp(suong(col, vW, mix(1., .3, step(.5, vE))), 0., 30.), 1.);
  }`;

  const GLOW_V = CH + `
  attribute vec3 aCol; attribute vec3 aInf; // aInf: cỡ, lúc bật, số sóng (-1: không chờ sóng)
  uniform float uPx; uniform float uK; varying vec3 vC;
  void main(){
    vec4 mv = viewMatrix * vec4(position, 1.); float dist = -mv.z;
    float on = aInf.y <= 0. ? 1. : smoothstep(0., .35, uS - aInf.y);
    if (aInf.z >= 0.) on *= qua(int(aInf.z), length(position.xz - uOrg.xz));
    float sz = aInf.x * uPx / max(dist, .5);
    float a = on * exp(-dist * uFogD * .45) * uK;
    if (sz < 2.) { a *= sz * .5; sz = 2.; }
    vC = aCol * a * (.8 + .3 * uBeat);
    gl_PointSize = min(sz, 120.);
    gl_Position = projectionMatrix * mv;
    if (dist < .5 || a < .003) gl_Position = vec4(2., 2., 2., 1.);
  }`;
  const GLOW_F = `varying vec3 vC; void main(){ float r = length(gl_PointCoord - .5) * 2.; float a = pow(max(1. - r, 0.), 2.4); gl_FragColor = vec4(vC * a, 1.); }`;

  // một đoạn thẳng vẽ thành hình viên thuốc trên màn hình (mưa và sét dùng chung)
  const RAIN_V = CH + `
  attribute vec3 iBase; attribute vec4 iRnd;
  uniform vec3 uBox, uRV, uVec, uHead[5]; uniform float uRT, uRainA, uDrop, uHeadK, uRpx, uTint, uPx; uniform vec2 uRes;
  varying vec2 vP; varying float vHalf; varying vec3 vC; varying float vDropK; varying float vSoft; varying float vTw;
  void main(){
    float sp = .7 + .6 * iRnd.x;
    vec3 p = iBase * uBox + uRV * sp * uRT;
    p = mod(p - cameraPosition, uBox) - .5 * uBox;
    vec3 wp = cameraPosition + p; vec3 sv = uVec * sp;
    vec4 a = projectionMatrix * viewMatrix * vec4(wp, 1.), b = projectionMatrix * viewMatrix * vec4(wp + sv, 1.);
    if (a.w < .25 || b.w < .25 || iRnd.w > uRainA) { gl_Position = vec4(2., 2., 2., 1.); return; }
    vec2 sa = a.xy / a.w, sb = b.xy / b.w; vec2 dpx = (sb - sa) * uRes * .5; float L = length(dpx);
    float Lm = uRes.y * .11; if (L > Lm) { sb = sa + (sb - sa) * (Lm / L); L = Lm; }
    vec2 dir = L > .001 ? dpx / length(dpx) : vec2(0., 1.); vec2 nrm = vec2(-dir.y, dir.x);
    float dist = a.w;
    float R = mix(clamp(uRpx * (.7 + .8 * iRnd.y) * 12. / dist, .85, 46.), clamp(.11 * (.55 + .9 * iRnd.y) * uPx / dist, 1.3, 60.), uDrop);
    // giọt ở xa nhỏ hơn vài điểm ảnh: vẽ thành đốm sáng mềm (không thì lộ ô vuông), giữ nguyên tổng độ sáng
    float Rv = max(R, mix(.85, 2.8, uDrop)); float nho = (R / Rv) * (R / Rv); vSoft = uDrop * (1. - smoothstep(3., 7., R)); R = Rv;
    float tw = pow(.5 + .5 * sin(uS * 2.6 + iRnd.z * 50.), 6.); vTw = tw * uDrop * (1. - vSoft);
    R *= mix(1., 1.7, uDrop * (1. - vSoft)); // chừa chỗ quanh hạt cho tia lấp lánh
    vHalf = L * .5 / R; vDropK = uDrop;
    float al = position.y * 2. - 1.;
    vec2 px = mix(sa, sb, position.y) * uRes * .5 + dir * al * R + nrm * position.x * R;
    vP = vec2(position.x, al * (vHalf + 1.));
    float fade = (1. - smoothstep(uBox.z * .34, uBox.z * .5, length(p.xz))) * min(1., 7. / R + .10);
    fade *= mix(1., .75 + 1.6 * pow(.5 + .5 * sin(uS * 2.6 + iRnd.z * 50.), 6.), uDrop);
    fade *= mix(1., 1.7, uDrop * (1. - smoothstep(3., 7., R))) ;
    vec3 col = vec3(.55,.66,.92) * mix(.13 + .26 * uFlash, .13 + .20 * uFlash, uDrop) + uDawn * vec3(1.,.62,.42) * .22;
    for (int k = 0; k < 5; k++) { vec3 q = wp - uHead[k]; col += uKey[k] * uHeadK / (1. + dot(q, q) * .07); }
    col = mix(col, col * (.4 + 1.6 * uKey[int(mod(floor(iRnd.z * 5.), 5.))]), uTint);
    vC = col * fade * mix(1., min(1., nho * 2.2), uDrop);
    gl_Position = vec4(px / (uRes * .5), a.z / a.w, 1.);
  }`;
  const RAIN_F = `
  varying vec2 vP; varying float vHalf; varying vec3 vC; varying float vDropK; varying float vSoft; varying float vTw;
  void main(){
    float d = length(vec2(vP.x, max(abs(vP.y) - vHalf, 0.)));
    float a = 1. - smoothstep(.25, 1., d);
    float k = mix(1., 1.7, vDropK * (1. - vSoft)); float db = d * k; vec2 q = vP * k - vec2(-.32, .34);
    float bead = (.10 + .75 * smoothstep(.35, .95, db)) * (1. - smoothstep(.88, 1., db)) + 1.5 * exp(-dot(q, q) * 18.);
    // tia lấp lánh bốn cánh, loé lên theo nhịp nhấp nháy riêng của từng hạt
    vec2 ap = abs(vP); float tia = (exp(-ap.x * 11.) * exp(-ap.y * 2.6) + exp(-ap.y * 11.) * exp(-ap.x * 2.6)) * (1. - smoothstep(.7, 1., max(ap.x, ap.y)));
    bead += tia * vTw * 2.2;
    a = mix(a * .7, mix(bead, 1.0 * exp(-d * d * 3.2) * (1. - smoothstep(.85, 1., d)), vSoft), vDropK);
    gl_FragColor = vec4(vC * a, 1.);
  }`;
  const BOLT_V = `
  attribute vec3 aB; attribute vec3 aInf; uniform vec3 uOff; uniform vec2 uRes; uniform float uW; varying float vX; varying float vK;
  void main(){
    vec4 a = projectionMatrix * viewMatrix * vec4(position + uOff, 1.), b = projectionMatrix * viewMatrix * vec4(aB + uOff, 1.);
    if (a.w < 1. || b.w < 1.) { gl_Position = vec4(2., 2., 2., 1.); return; }
    vec2 sa = a.xy / a.w, sb = b.xy / b.w; vec2 dpx = (sb - sa) * uRes * .5; float L = max(length(dpx), .001); vec2 nrm = vec2(-dpx.y, dpx.x) / L;
    vec2 px = mix(sa, sb, aInf.y) * uRes * .5 + nrm * aInf.x * uW * aInf.z;
    vX = aInf.x; vK = aInf.z; gl_Position = vec4(px / (uRes * .5), mix(a.z / a.w, b.z / b.w, aInf.y), 1.);
  }`;
  const BOLT_F = `varying float vX; varying float vK; uniform float uI; void main(){ float a = pow(1. - abs(vX), 1.6); gl_FragColor = vec4(vec3(.78,.86,1.15) * a * uI * (.5 + .5 * vK), 1.); }`;

  const STAR_V = CH + `
  attribute vec3 aT; attribute vec3 aD; attribute vec4 aR; attribute vec3 aCol; uniform float uPx; varying vec3 vC;
  void main(){
    vec3 p; float a, sz, tk = 0.; vec3 c = aCol;
    float fadeOut = 1. - smoothstep(161.4, 165.6, uS);
    if (aT.y > -9000.) { // hạt của pháo: nổ ra, rồi tụ thành giọt nước, rồi thành chữ
      int id = int(mod(floor(aR.x * 5.), 5.)); float t = uS - uBT[id] - aR.w * .22;
      if (t < 0.) { gl_Position = vec4(2., 2., 2., 1.); gl_PointSize = 1.; vC = vec3(0.); return; }
      p = uBC[id] + position * 96. * (1. - exp(-t * 1.7)) - vec3(0., min(1.5 * t * t, 30.), 0.);
      vec3 wob = vec3(sin(uS * .9 + aR.z * 20.), cos(uS * .8 + aR.w * 20.), 0.);
      float td = clamp((uS - 147.3 - aR.z * 1.3) / 2.0, 0., 1.); td = td * td * (3. - 2. * td);
      p = mix(p, aD + wob * .7, td);
      tk = clamp((uS - 151.2 - aR.y * 2.0) / 2.6, 0., 1.); tk = tk * tk * (3. - 2. * tk);
      p = mix(p, aT + wob * .5, tk);
      c = mix(mix(uKey[id], vec3(1.), .25), vec3(.50,.80,1.0), td); c = mix(c, vec3(1.,.90,.70), tk);
      float gl = .40 + 1.25 * pow(.5 + .5 * sin(uS * (4. + aR.z * 7.) + aR.w * 40.), 3.);
      a = min(1., t * 6.) * mix(gl, .85 + .15 * gl, tk) * (1. + 2.5 * exp(-t * 3.)) * fadeOut;
      sz = mix(2.4 + 3.2 * aR.w * aR.w, 3.2, max(td * .7, tk));
    } else { // sao nền: những giọt mưa đã bay lên trời
      float rise = smoothstep(0., 1., (uS - 135.2 - aR.x * 9.5) / 6.5);
      p = position; p.y -= 170. * (1. - rise) * (1. - rise);
      p += vec3(sin(uS * .31 + aR.y * 6.3), cos(uS * .23 + aR.z * 6.3), sin(uS * .27 + aR.w * 6.3)) * 5.;
      a = rise * fadeOut * mix(1., .5, smoothstep(152., 155., uS)) * (.72 + .28 * sin(uS * (2. + aR.z * 3.) + aR.w * 40.));
      sz = 3.2 + 4.0 * aR.w * aR.w;
    }
    vec4 mv = viewMatrix * vec4(p, 1.); float dist = -mv.z;
    sz = sz * uPx / max(dist, 1.);
    if (sz < 2.2) { a *= sz / 2.2; sz = 2.2; }
    vC = c * a * mix(1., 1.25, tk);
    gl_PointSize = min(sz, 90.);
    gl_Position = projectionMatrix * mv;
  }`;
  // tia pháo có đuôi: mỗi tia vẽ thành vài chấm lùi dần theo thời gian
  const FW_V = CH + `
  attribute vec4 aF; uniform float uPx; varying vec3 vC; // aF: quả số mấy, chấm đuôi thứ mấy, sức bắn, ngẫu nhiên
  void main(){
    int id = int(aF.x); float t = uS - uBT[id] - aF.y * .05;
    if (t < 0. || t > 3.6) { gl_Position = vec4(2., 2., 2., 1.); gl_PointSize = 1.; vC = vec3(0.); return; }
    vec3 p = uBC[id] + position * 84. * aF.z * (1. - exp(-t * 2.2)) - vec3(0., 3.0 * t * t, 0.);
    vec4 mv = viewMatrix * vec4(p, 1.); float dist = -mv.z;
    float life = exp(-t * .85) * (1. - smoothstep(2.7, 3.6, t)), tr = 1. - aF.y / 8.;
    float cr = t > 1.4 ? .35 + 1.8 * step(.55, h21(vec2(aF.w * 91., floor(uS * 20.)))) : 1.;
    vC = mix(vec3(1.,.96,.86), uKey[id], smoothstep(0., .4, t)) * life * tr * tr * cr * 1.6;
    gl_PointSize = clamp((1.3 + 2.4 * tr) * uPx / max(dist, 1.), 1.6, 40.);
    gl_Position = projectionMatrix * mv;
  }`;
  const RIB_V = `attribute vec2 aUV; varying vec2 vUV; varying float vZ; void main(){ vUV = aUV; vec4 mv = viewMatrix * vec4(position, 1.); vZ = -mv.z; gl_Position = projectionMatrix * mv; }`;
  const RIB_F = `varying vec2 vUV; varying float vZ; uniform vec3 uCol; uniform float uA; void main(){ float a = pow(max(1. - vUV.x, 0.), 1.7) * pow(max(1. - abs(vUV.y), 0.), 1.5) * smoothstep(1.2, 4., vZ); gl_FragColor = vec4(uCol * a * uA, 1.); }`;
  const CABLE_V = CH + `attribute vec3 aCol; attribute float aLit; varying vec3 vC; void main(){ float on = smoothstep(0., .3, uS - aLit); vec4 mv = viewMatrix * vec4(position, 1.); vC = aCol * on * exp(mv.z * uFogD * .35) * (.7 + .4 * uBeat); gl_Position = projectionMatrix * mv; }`;
  const CABLE_F = `varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.); }`;
  const GRADE = {
    uniforms: { tDiffuse: { value: null }, uFade: { value: 1 }, uWhite: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uFade, uWhite, uTime, uWarm; varying vec2 vUv;
    float h(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    void main(){
      vec3 c = max(texture2D(tDiffuse, vUv).rgb, 0.) + uWhite * vec3(.85,.92,1.);
      c = 1. - exp(-c * 1.5);
      c = mix(c, c * c * (3. - 2. * c), .35);
      c *= mix(vec3(.96,1.,1.06), vec3(1.05,1.,.94), uWarm);
      vec2 q = (vUv - .5) * vec2(1., .74); c *= 1. - .40 * pow(length(q) * 1.28, 2.6);
      c += (h(vUv * 811. + uTime) - .5) * .014;
      gl_FragColor = vec4(mix(vec3(.0235,.0196,.0157), c, uFade), 1.);
    }`,
  };

  // ================= DỰNG CẢNH =================
  let seedN = 7;
  const rnd = () => { seedN = (seedN * 16807) % 2147483647; return (seedN - 1) / 2147483646; };
  function Geo() { this.p = []; this.n = []; this.c = []; this.m = []; }
  function geoAdd(G0, g, col, em, tint) {
    if (g.index) g = g.toNonIndexed();
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    for (let i = 0; i < P.length; i += 3) { G0.p.push(P[i], P[i + 1], P[i + 2]); G0.n.push(N[i], N[i + 1], N[i + 2]); G0.c.push(col[0], col[1], col[2]); G0.m.push(em || 0, tint || 0); }
  }
  function geoBox(G0, w, h, d, x, y, z, col, em, tint, rz) {
    const g = new T.BoxGeometry(w, h, d);
    if (rz) { g.rotateZ(rz); g.translate(x, y, z); } else g.translate(x, y + h / 2, z);
    geoAdd(G0, g, col, em, tint);
  }
  function geoDone(G0) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(G0.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(G0.n, 3));
    g.setAttribute('aCol', new T.Float32BufferAttribute(G0.c, 3)); g.setAttribute('aMix', new T.Float32BufferAttribute(G0.m, 2));
    return g;
  }
  function U(extra) { return Object.assign({}, G, extra || {}); }
  function propMesh(geo, items, opt) {
    opt = opt || {};
    const ig = new T.InstancedBufferGeometry();
    ['position', 'normal', 'aCol', 'aMix'].forEach((k) => ig.setAttribute(k, geo.attributes[k]));
    const n = items.length, P = new Float32Array(n * 3), Sc = new Float32Array(n * 3), R = new Float32Array(n), C = new Float32Array(n * 3), Tm = new Float32Array(n * 2);
    items.forEach((it, i) => {
      P.set([it.x, it.y || 0, it.z], i * 3); const s = it.s || 1; Sc.set([it.sx || s, it.sy || s, it.sz || s], i * 3); R[i] = it.r || 0;
      C.set(it.c || [1, 1, 1], i * 3); Tm.set([it.b == null ? -1 : it.b, it.l || 0], i * 2);
    });
    ig.setAttribute('iPos', new T.InstancedBufferAttribute(P, 3)); ig.setAttribute('iSc', new T.InstancedBufferAttribute(Sc, 3)); ig.setAttribute('iRot', new T.InstancedBufferAttribute(R, 1));
    ig.setAttribute('iCol', new T.InstancedBufferAttribute(C, 3)); ig.setAttribute('iTime', new T.InstancedBufferAttribute(Tm, 2));
    ig.instanceCount = n;
    const mat = new T.ShaderMaterial({ uniforms: U({ uEmK: { value: opt.em == null ? 1.6 : opt.em }, uWaveEm: { value: opt.wave == null ? -1 : opt.wave }, uLitK: { value: opt.lit || 2.3 } }), vertexShader: PROP_V, fragmentShader: PROP_F });
    const m = new T.Mesh(ig, mat); m.frustumCulled = false; scene.add(m); return m;
  }
  function glowPts(list, k) { // list: [x,y,z, r,g,b, cỡ, lúc bật, sóng]
    const n = list.length, P = new Float32Array(n * 3), C = new Float32Array(n * 3), I = new Float32Array(n * 3);
    list.forEach((a, i) => { P.set([a[0], a[1], a[2]], i * 3); C.set([a[3], a[4], a[5]], i * 3); I.set([a[6], a[7] == null ? -1 : a[7], a[8] == null ? -1 : a[8]], i * 3); });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('aCol', new T.BufferAttribute(C, 3)); g.setAttribute('aInf', new T.BufferAttribute(I, 3));
    const u = { value: k == null ? 1 : k };
    const mat = new T.ShaderMaterial({ uniforms: U({ uK: u }), vertexShader: GLOW_V, fragmentShader: GLOW_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    const m = new T.Points(g, mat); m.frustumCulled = false; scene.add(m); m.userData.k = u; return m;
  }

  function build() {
    scene = new T.Scene();
    cam = new T.PerspectiveCamera(50, 2, 1.0, 7000);
    const V3 = (a) => new T.Vector3(a[0], a[1], a[2]);
    // nhiễu dùng chung cho mây, sóng nước
    const nd = new Uint8Array(256 * 256 * 4); for (let i = 0; i < nd.length; i++) nd[i] = Math.floor(rnd() * 256);
    const noise = new T.DataTexture(nd, 256, 256, T.RGBAFormat); noise.wrapS = noise.wrapT = T.RepeatWrapping; noise.magFilter = noise.minFilter = T.LinearFilter; noise.needsUpdate = true;
    G = {
      uS: { value: 0 }, uFogCol: { value: new T.Vector3(0.07, 0.08, 0.1) }, uFogD: { value: 0.0016 }, uFlash: { value: 0 }, uSun: { value: new T.Vector3(-0.56, 0.03, 0.83).normalize() }, uDawn: { value: 0 }, uAmb: { value: 1 },
      uWaveR: { value: [0, 0, 0, 0, 0, 0, 0, 0] }, uWaveC: { value: WAVE_C.map(V3) }, uOrg: { value: V3(ORG) }, uBeat: { value: 0 }, uGrey: { value: 1 }, uKey: { value: KEYC.map(V3) },
      uPx: { value: 500 }, uRes: { value: new T.Vector2(800, 400) }, uNoise: { value: noise },
      uBC: { value: [0, 1, 2, 3, 4].map((i) => V3(headAt(i, TB[i], [0, 0, 0]))) }, uBT: { value: TB.slice() }, uBurst: { value: new T.Vector3() },
    };
    // ---- trời ----
    skyM = new T.ShaderMaterial({ uniforms: U({ uCov: { value: 0.8 }, uGlow: { value: 0.3 }, uStars: { value: 0 }, uMount: { value: 0 }, uSkyTint: { value: new T.Vector3() }, uFP: { value: [new T.Vector3(), new T.Vector3(), new T.Vector3()] }, uFI: { value: [0, 0, 0] } }), vertexShader: SKY_V, fragmentShader: SKY_F, side: T.BackSide, depthWrite: false, depthTest: false });
    const sky = new T.Mesh(new T.SphereGeometry(10, 24, 16), skyM); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
    // ---- mặt đất, đường ----
    const gg = new T.PlaneGeometry(2400, 5000, LOW ? 60 : 96, LOW ? 250 : 400); gg.rotateX(-Math.PI / 2); gg.translate(0, 0, 1400);
    G.uFront = { value: 60 };
    const ground = new T.Mesh(gg, new T.ShaderMaterial({ uniforms: U({ uPylOn: { value: [0, 0, 0, 0, 0] } }), vertexShader: GROUND_V, fragmentShader: GROUND_F })); ground.frustumCulled = false; scene.add(ground);
    G.uPylOn = ground.material.uniforms.uPylOn;
    const rg = new T.PlaneGeometry(14, 3260, 1, 1); rg.rotateX(-Math.PI / 2); rg.translate(0, 0.06, 40 + 1630);
    roadM = new T.ShaderMaterial({ uniforms: U(), vertexShader: ROAD_V, fragmentShader: ROAD_F, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const road = new T.Mesh(rg, roadM); road.frustumCulled = false; scene.add(road);

    // ---- nhà: thành phố + làng ven ruộng ----
    const WALL = [[0.42, 0.36, 0.22], [0.40, 0.38, 0.33], [0.30, 0.36, 0.33], [0.42, 0.31, 0.29], [0.34, 0.35, 0.38], [0.44, 0.41, 0.30], [0.30, 0.33, 0.40]];
    const B = [], tanks = [], redTop = [], pinks = [], lane = [];
    for (let q = 47.2; q < 82.5; q += 0.12) lane.push(camAt(q));
    const chan = (x, z, w, d, h) => lane.some((c) => Math.abs(c[0] - x) < w / 2 + 9 && Math.abs(c[2] - z) < d / 2 + 9 && h > c[1] - 9);
    for (let bx = -12; bx < 12; bx++) for (let bz = -15; bz < 9; bz++) for (let lx = 0; lx < 3; lx++) for (let lz = 0; lz < 3; lz++) {
      const x = bx * 64 + 14 + lx * 18, z = bz * 64 + 14 + lz * 18;
      if (Math.abs(x) < 23 || z > 586) { rnd(); continue; }
      if (Math.abs(x - 40) < 26 && Math.abs(z) < 24) continue;
      const far = Math.hypot(x, z) / 800;
      if (rnd() > 0.93 - far * far * 0.45 || (LOW && rnd() < 0.3)) continue;
      const tower = rnd() < 0.045 && Math.hypot(x - 40, z) > 150;
      const w = 12 + rnd() * 5, d = 12 + rnd() * 5; let h = tower ? 34 + rnd() * 44 : 8 + rnd() * rnd() * 20;
      if (chan(x, z, w, d, h)) { if (tower || chan(x, z, w, d, 7)) continue; h = 7; }
      B.push([x, z, w, h, d]);
      if (!tower && rnd() < 0.34) tanks.push({ x: x + (rnd() - 0.5) * w * 0.4, y: h, z: z + (rnd() - 0.5) * d * 0.4, s: 0.8 + rnd() * 0.35, r: rnd() * 3 });
      if (tower) redTop.push([x, h + 1.2, z, 1, 0.16, 0.1, 5, -1, 2]);
      if (!tower && rnd() < 0.2) pinks.push([x + (rnd() - 0.5) * w, h * (0.3 + rnd() * 0.6), z + d / 2 + 0.6, KEYC[4][0], KEYC[4][1], KEYC[4][2], 3.2, -1, 4]);
    }
    for (let i = 0; i < 150; i++) { // làng ven ruộng, thưa
      const x = (rnd() < 0.5 ? -1 : 1) * (34 + rnd() * rnd() * 520), z = 1240 + rnd() * 740;
      B.push([x, z, 8 + rnd() * 5, 4 + rnd() * 5, 8 + rnd() * 5]);
    }
    B.push([40, 0, 26, 24, 22]); // nhà anh
    const bg = new T.InstancedBufferGeometry(); const bb = new T.BoxGeometry(1, 1, 1); bb.translate(0, 0.5, 0);
    bg.index = bb.index; bg.setAttribute('position', bb.attributes.position); bg.setAttribute('normal', bb.attributes.normal);
    const bP = new Float32Array(B.length * 3), bS = new Float32Array(B.length * 3), bC = new Float32Array(B.length * 4);
    B.forEach((b, i) => { bP.set([b[0], 0, b[1]], i * 3); bS.set([b[2], b[3], b[4]], i * 3); const c = WALL[Math.floor(rnd() * WALL.length)]; const k = 0.75 + rnd() * 0.4; bC.set([c[0] * k, c[1] * k, c[2] * k, i === B.length - 1 ? 0.999 : rnd() * 0.9], i * 4); });
    bg.setAttribute('iPos', new T.InstancedBufferAttribute(bP, 3)); bg.setAttribute('iSc', new T.InstancedBufferAttribute(bS, 3)); bg.setAttribute('iCol', new T.InstancedBufferAttribute(bC, 4)); bg.instanceCount = B.length;
    const bm = new T.Mesh(bg, new T.ShaderMaterial({ uniforms: U(), vertexShader: BLD_V, fragmentShader: BLD_F })); bm.frustumCulled = false; scene.add(bm);
    // bồn nước inox trên mái (rất Hà Nội)
    const tk = new Geo(); { const c = new T.CylinderGeometry(1.1, 1.1, 2.6, 10); c.rotateZ(Math.PI / 2); c.translate(0, 2.3, 0); geoAdd(tk, c, [0.55, 0.58, 0.62]); [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]].forEach((q) => geoBox(tk, 0.14, 1.3, 0.14, q[0], 0, q[1], [0.2, 0.2, 0.22])); }
    tanks.push({ x: 46, y: 24, z: -3, s: 1.5, r: 0.3 });
    propMesh(geoDone(tk), tanks, { lit: 2.6 });
    // ô cửa sổ phòng anh: ô duy nhất còn sáng
    const wn = new Geo(); geoBox(wn, 2.3, 2.5, 0.12, 0, 0, 0, [1.0, 0.60, 0.22], 1); geoBox(wn, 0.12, 2.5, 0.2, 0, 0, 0.02, [0.05, 0.04, 0.03]); geoBox(wn, 2.3, 0.12, 0.2, 0, 1.2, 0.02, [0.05, 0.04, 0.03]); geoBox(wn, 2.7, 0.16, 0.5, 0, -0.16, 0.12, [0.2, 0.2, 0.22]);
    propMesh(geoDone(wn), [{ x: 41.35, y: 13.25, z: 11.3 }], { em: 0.8 });
    // đèn đường thành phố (bật theo sóng tím), đèn đỏ nóc nhà cao, đốm hồng
    const cl = [];
    for (let i = -12; i <= 12; i++) for (let j = -30; j <= 18; j++) { const a = i * 64, b = j * 32; if (b < 590) { if (Math.abs(a) > 20) cl.push([a + 2.5, 7.5, b, 1, 0.66, 0.32, 4.2, -1, 1]); if (Math.abs(b * 2 - 0) > 40 && j % 2 === 0 && Math.abs(i * 32 + 16) > 20) cl.push([i * 32 + 16, 7.5, j * 32 + 2.5, 1, 0.66, 0.32, 4.2, -1, 1]); } }
    glowPts(cl.concat(redTop, pinks), 0.9);
    // ---- cây ----
    const tr = new Geo(); geoBox(tr, 0.42, 4.4, 0.42, 0, 0, 0, [0.07, 0.055, 0.05]); { const c = new T.IcosahedronGeometry(2.3, 1); c.scale(1, 1.3, 1); c.translate(0, 6.4, 0); geoAdd(tr, c, [1.1, 1.1, 1.1], 0, 1); const c2 = new T.IcosahedronGeometry(1.6, 1); c2.translate(1.25, 4.9, 0.5); geoAdd(tr, c2, [0.8, 0.8, 0.8], 0, 1); const c3 = new T.IcosahedronGeometry(1.45, 1); c3.translate(-1.1, 5.2, -0.6); geoAdd(tr, c3, [0.9, 0.9, 0.9], 0, 1); }
    const trG = geoDone(tr), cityTrees = [], roadTrees = [];
    const grn = () => { const k = 0.6 + rnd() * 0.6; return [0.10 * k, 0.26 * k, 0.12 * k]; };
    for (let i = 0; i < (LOW ? 500 : 900); i++) { const sx = (Math.floor(rnd() * 24) - 12) * 64, o = (rnd() - 0.5) * 1500; const al = rnd() < 0.5; const x = al ? sx + (rnd() < 0.5 ? -6 : 6) : o, z = al ? -360 + o * 0.62 : (Math.floor(rnd() * 24) - 15) * 64 + (rnd() < 0.5 ? -6 : 6); if (Math.abs(x) < 17 || z > 588 || (Math.abs(x - 40) < 22 && Math.abs(z) < 20)) continue; cityTrees.push({ x, z, s: 0.8 + rnd() * 0.6, r: rnd() * 6, c: grn() }); }
    propMesh(trG, cityTrees, { wave: 3 });
    for (let z = 105; z < 3050; z += 30) for (const sd of [-1, 1]) {
      if (z > 600 && z < 1200) continue;
      const hill = z > 2000; if (hill && rnd() < 0.6) continue;
      const x = sd * (hill ? 30 + rnd() * 40 : 15.5 + rnd() * 4);
      roadTrees.push({ x, y: doiH(x, z), z: z + rnd() * 6, s: (hill ? 1.0 : 0.9) + rnd() * 0.5, sy: hill ? 1.3 + rnd() * 0.4 : 0, r: rnd() * 6, c: grn(), b: birthAt(z) });
    }
    roadTrees.forEach((t) => { if (t.sy) { t.sx = t.s; t.sz = t.s; } else delete t.sy; });
    propMesh(trG, roadTrees);
    // ---- cột đèn dọc đường: mỗi cột một màu phím ----
    const lpG = new Geo(); geoBox(lpG, 0.26, 8.6, 0.26, 0, 0, 0, [0.10, 0.10, 0.12]); geoBox(lpG, 2.0, 0.18, 0.18, -0.9, 8.5, 0, [0.10, 0.10, 0.12]); geoBox(lpG, 0.9, 0.2, 0.42, -1.6, 8.3, 0, [1, 1, 1], 1, 1);
    const lamps = [], lampGl = [];
    for (let i = 0, z = 90; z < 2010; i++, z += 30) for (const sd of [-1, 1]) {
      const k = KEYC[i % 5], c = [mix(k[0], 1, 0.3), mix(k[1], 0.85, 0.3), mix(k[2], 0.6, 0.3)], b = birthAt(z);
      lamps.push({ x: sd * 8.3, z, r: sd > 0 ? 0 : Math.PI, c, b });
      lampGl.push([sd * 6.7, 8.2, z, c[0], c[1], c[2], 3.6, b, -1]);
    }
    propMesh(geoDone(lpG), lamps, { em: 1.5 });
    for (let z = 2010; z < Z_TRAI - 30; z += 15) for (const sd of [-1, 1]) lampGl.push([sd * 7.6, 0.9, z, 1, 0.5, 0.3, 1.5, birthAt(z), -1]); // cọc tiêu phản quang đường đồi
    for (let z = 612; z < 1190; z += 10) for (const sd of [-1, 1]) lampGl.push([sd * 8.9, 1.5, z, 0.75, 0.85, 1, 2.0, birthAt(z), -1]); // đèn lan can cầu
    glowPts(lampGl, 1);
    // ---- cầu năm trụ: mỗi trụ sáng một màu phím ----
    const py = new Geo(); const CONC = [0.34, 0.35, 0.38]; const la = Math.atan2(11.5, 46), ll = Math.hypot(11.5, 46);
    for (const sd of [-1, 1]) { geoBox(py, 1.9, ll, 2.6, sd * 5.75, 23, 0, CONC, 0, 0, sd * la); geoBox(py, 0.5, ll * 0.94, 2.8, sd * 6.75, 23, 0, [1, 1, 1], 1, 1, sd * la); }
    geoBox(py, 1.7, 11, 2.4, 0, 45, 0, CONC); geoBox(py, 0.5, 11, 2.6, 0, 45, 0, [1, 1, 1], 1, 1); geoBox(py, 26, 1.2, 3, 0, -1.2, 0, CONC);
    const pyl = [], cab = [], cabC = [], cabL = [];
    for (let k = 0; k < 5; k++) {
      const z = 700 + 100 * k, c = KEYC[k], lit = 90.8 + 2 * k;
      pyl.push({ x: 0, z, c, b: 88.8 + 2 * k, l: lit });
      for (let j = 0; j < 6; j++) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        cab.push(0, 53 - j * 3.4, z, sx * 7.6, 1.2, z + sz * (9 + j * 7.4));
        const cc = [mix(c[0], 1, 0.25), mix(c[1], 1, 0.25), mix(c[2], 1, 0.25)].map((v) => v * 0.55);
        cabC.push(...cc, ...cc); cabL.push(lit + 0.25 + j * 0.09, lit + 0.25 + j * 0.09);
      }
    }
    propMesh(geoDone(py), pyl, { em: 1.5, lit: 1.7 });
    const cg = new T.BufferGeometry(); cg.setAttribute('position', new T.Float32BufferAttribute(cab, 3)); cg.setAttribute('aCol', new T.Float32BufferAttribute(cabC, 3)); cg.setAttribute('aLit', new T.Float32BufferAttribute(cabL, 1));
    const cm = new T.LineSegments(cg, new T.ShaderMaterial({ uniforms: U(), vertexShader: CABLE_V, fragmentShader: CABLE_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); cm.frustumCulled = false; scene.add(cm);
    const rl = new Geo(); geoBox(rl, 0.3, 1.2, 588, 0, 0, 0, [0.16, 0.17, 0.2]);
    propMesh(geoDone(rl), [{ x: -8.9, z: 900 }, { x: 8.9, z: 900 }]);
    // ---- cột điện cao thế giữa ruộng ----
    const pw = new Geo(); { const c = new T.ConeGeometry(4.2, 36, 4, 1, true); c.translate(0, 18, 0); geoAdd(pw, c, [0.11, 0.12, 0.14]); geoBox(pw, 15, 0.5, 0.5, 0, 25, 0, [0.11, 0.12, 0.14]); geoBox(pw, 10, 0.5, 0.5, 0, 31, 0, [0.11, 0.12, 0.14]); }
    const pws = []; for (let z = 1280, i = 0; z < 2000; z += 150, i++) pws.push({ x: i % 2 ? -64 : 78, z, r: 0.2, b: birthAt(z) });
    const pwm = propMesh(geoDone(pw), pws); pwm.material.side = T.DoubleSide;
    // ---- doanh trại: dãy nhà thấp, một ô cửa sổ ----
    const tr2 = new Geo(); const WALLC = [0.50, 0.47, 0.38], ROOF = [0.36, 0.16, 0.11];
    function barrack(x0, z0, w, emWin) {
      geoBox(tr2, w, 5.2, 11, x0, 0, z0, WALLC);
      const rf = new T.CylinderGeometry(0.01, 7.6, 3.4, 4, 1); rf.rotateY(Math.PI / 4); rf.scale(w / 10.4, 1, 1); rf.translate(x0, 5.2 + 1.7, z0); geoAdd(tr2, rf, ROOF);
      const n = Math.floor(w / 7.5);
      for (let i = 0; i < n; i++) {
        const wx = x0 - w / 2 + (i + 0.5) * (w / n), her = emWin === i;
        if (i === 2 && emWin >= 0) { geoBox(tr2, 1.9, 3.6, 0.2, wx, 0, z0 - 5.78, [0.16, 0.2, 0.17]); continue; }
        geoBox(tr2, 2.5, 2.3, 0.14, wx, 1.7, z0 - 5.78, her ? [1.0, 0.72, 0.40] : [0.05, 0.065, 0.085], her ? 1 : 0);
        geoBox(tr2, 0.14, 2.3, 0.24, wx, 1.7, z0 - 5.84, [0.13, 0.17, 0.15]); geoBox(tr2, 2.5, 0.14, 0.24, wx, 2.8, z0 - 5.84, [0.13, 0.17, 0.15]);
      }
    }
    barrack(4, Z_TRAI, 62, 5); barrack(-52, Z_TRAI + 46, 46, -1); barrack(58, Z_TRAI + 52, 40, -1);
    geoBox(tr2, 0.22, 15, 0.22, -30, 0, Z_TRAI - 16, [0.5, 0.5, 0.52]);
    for (const sd of [-1, 1]) { geoBox(tr2, 1.5, 4.2, 1.5, sd * 9, 0, Z_TRAI - 40, WALLC); for (let i = 0; i < 14; i++) geoBox(tr2, 0.3, 1.9, 0.3, sd * (11 + i * 4), 0, Z_TRAI - 40, [0.36, 0.34, 0.3]); geoBox(tr2, 54, 0.16, 0.16, sd * 37, 1.7, Z_TRAI - 40, [0.36, 0.34, 0.3]); }
    propMesh(geoDone(tr2), [{ x: 0, z: 0 }], { em: 0.75, lit: 2.2 });
    const HERW = [4 - 31 + 5.5 * (62 / 8), 2.85, Z_TRAI - 6.1];
    const ct = []; for (let i = 0; i < 26; i++) { const x = (rnd() - 0.5) * 230, z = Z_TRAI + 20 + rnd() * 90; if (Math.abs(x - 4) < 36 && z < Z_TRAI + 14) continue; ct.push({ x, y: doiH(x, z), z, s: 1.2 + rnd() * 0.8, r: rnd() * 6, c: grn() }); }
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) ct.push({ x: sd * (36 + i * 11), z: Z_TRAI - 30 + (i % 2) * 5, s: 1.1 + rnd() * 0.5, r: rnd() * 6, c: grn() });
    propMesh(trG, ct);
    const herGlow = glowPts([[HERW[0], HERW[1], HERW[2], 1, 0.72, 0.4, 9, -1, -1]], 0); glowUs.her = herGlow.userData.k;

    // ---- mưa ----
    const RN = Math.floor((LOW ? 9000 : 13000));
    const rq = new T.InstancedBufferGeometry(); rq.setAttribute('position', new T.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); rq.setIndex([0, 1, 2, 0, 2, 3]);
    const rB = new Float32Array(RN * 3), rR = new Float32Array(RN * 4); for (let i = 0; i < RN * 3; i++) rB[i] = rnd(); for (let i = 0; i < RN * 4; i++) rR[i] = rnd();
    rq.setAttribute('iBase', new T.InstancedBufferAttribute(rB, 3)); rq.setAttribute('iRnd', new T.InstancedBufferAttribute(rR, 4)); rq.instanceCount = RN;
    rainM = new T.ShaderMaterial({ uniforms: U({ uBox: { value: new T.Vector3(72, 46, 72) }, uRV: { value: new T.Vector3(5, -36, -3) }, uVec: { value: new T.Vector3(0, -1, 0) }, uHead: { value: [0, 1, 2, 3, 4].map(() => new T.Vector3()) }, uRT: { value: 0 }, uRainA: { value: 0.3 }, uDrop: { value: 0 }, uHeadK: { value: 0.5 }, uRpx: { value: 1 }, uTint: { value: 0 } }), vertexShader: RAIN_V, fragmentShader: RAIN_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false, depthTest: true, side: T.DoubleSide });
    const rain = new T.Mesh(rq, rainM); rain.frustumCulled = false; rain.renderOrder = 5; scene.add(rain);
    // ---- sét ----
    for (let k = 0; k < 5; k++) {
      const P = [], Bq = [], I = [], idx = []; let vi = 0;
      const seg = (a, b, w) => { for (const q of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { P.push(a[0], a[1], a[2]); Bq.push(b[0], b[1], b[2]); I.push(q[0], q[1], w); } idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4; };
      const grow = (x, y, z, w, depth) => { let px = x, py2 = y, pz = z; while (py2 > 4) { const ny = py2 - (10 + rnd() * 16), nx = px + (rnd() - 0.5) * 30, nz2 = pz + (rnd() - 0.5) * 16; seg([px, py2, pz], [nx, Math.max(ny, 0), nz2], w); if (depth < 2 && rnd() < 0.22) grow(nx, ny, nz2, w * 0.5, depth + 1 + (rnd() < 0.5 ? 1 : 0)); px = nx; py2 = ny; pz = nz2; if (depth > 0 && rnd() < 0.2) break; } };
      grow(0, 255, 0, 1, 0);
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('aB', new T.Float32BufferAttribute(Bq, 3)); g.setAttribute('aInf', new T.Float32BufferAttribute(I, 3)); g.setIndex(idx);
      const m = new T.Mesh(g, new T.ShaderMaterial({ uniforms: { uOff: { value: new T.Vector3() }, uRes: G.uRes, uW: { value: 2.4 }, uI: { value: 0 } }, vertexShader: BOLT_V, fragmentShader: BOLT_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      m.frustumCulled = false; m.visible = false; scene.add(m); bolts.push(m);
    }
    // ---- năm đốm sáng và dải sáng ----
    const hp = []; for (let i = 0; i < 5; i++) { hp.push([0, 0, 0, 1, 0.95, 0.85, 1.5, -1, -1]); hp.push([0, 0, 0, KEYC[i][0], KEYC[i][1], KEYC[i][2], 6.5, -1, -1]); }
    headPts = glowPts(hp, 1); headPts.renderOrder = 8;
    const SEG = 40;
    for (let i = 0; i < 5; i++) {
      const g = new T.BufferGeometry(), P = new Float32Array((SEG + 1) * 6), UV = new Float32Array((SEG + 1) * 4), idx = [];
      for (let j = 0; j <= SEG; j++) { UV.set([j / SEG, -1, j / SEG, 1], j * 4); if (j < SEG) idx.push(j * 2, j * 2 + 1, j * 2 + 2, j * 2 + 1, j * 2 + 3, j * 2 + 2); }
      g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('aUV', new T.BufferAttribute(UV, 2)); g.setIndex(idx);
      const m = new T.Mesh(g, new T.ShaderMaterial({ uniforms: { uCol: { value: V3(KEYC[i]) }, uA: { value: 1 } }, vertexShader: RIB_V, fragmentShader: RIB_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      m.frustumCulled = false; m.renderOrder = 7; scene.add(m); ribbons.push(m);
    }
    buildStars();
    // ---- hậu kỳ ----
    composer = new T.EffectComposer(renderer);
    composer.addPass(new T.RenderPass(scene, cam));
    bloomPass = new T.UnrealBloomPass(new T.Vector2(256, 256), 0.62, 0.86, 0.66); composer.addPass(bloomPass);
    try { bloomPass.highPassUniforms.smoothWidth.value = 0.3; } catch (e) { /* bỏ qua */ }
    gradePass = new T.ShaderPass(GRADE); composer.addPass(gradePass);
    resize();
  }
  function warm(done) { // vẽ thử vài mốc khi canvas còn ẩn: trình duyệt biên dịch shader, nạp bộ đệm ngay từ bây giờ
    const L = [60, 97, 125.85, 131.2, 138, 143.6, 149, 156]; let i = 0;
    const step = () => { try { applyS(L[i], 0); bolts.forEach((b) => { b.visible = true; }); composer.render(); } catch (e) { /* bỏ qua */ } if (++i < L.length) setTimeout(step, 40); else done(); };
    step();
  }

  // hạt pháo → giọt nước (dấu riêng của Thủy) → chữ viết tay. Lấy mẫu điểm từ canvas.
  let textTex = null, textDone = false;
  function dropPath(c, x, y, h) { // giọt nước: đỉnh nhọn ở (x, y), cao h
    const r = h * 0.3;
    c.beginPath(); c.moveTo(x, y);
    c.bezierCurveTo(x - r * 0.25, y + h * 0.28, x - r, y + h * 0.48, x - r, y + h - r);
    c.arc(x, y + h - r, r, Math.PI, 0, true);
    c.bezierCurveTo(x + r, y + h * 0.48, x + r * 0.25, y + h * 0.28, x, y);
    c.closePath();
  }
  function buildStars() {
    const cA = camAt(155), cp = new T.Vector3(cA[0], cA[1], cA[2]), ct = new T.Vector3(cA[3], cA[4], cA[5]);
    const f = ct.clone().sub(cp).normalize(), r = new T.Vector3().crossVectors(f, new T.Vector3(0, 1, 0)).normalize(), u = new T.Vector3().crossVectors(r, f).normalize();
    const DIST = 430, WID = 500, C = cp.clone().addScaledVector(f, DIST).addScaledVector(u, 70);
    const tc = document.createElement('canvas'); tc.width = 2048; tc.height = 420; const x2 = tc.getContext('2d', { willReadFrequently: true });
    const draw = () => { // dấu chấm cuối câu là một giọt nước nhỏ
      x2.clearRect(0, 0, tc.width, tc.height); x2.fillStyle = '#fff'; x2.textAlign = 'left'; x2.textBaseline = 'middle'; x2.font = "700 250px 'Dancing Script', cursive";
      const tx = 'Đến ôm em bằng được'; let w = x2.measureText(tx).width;
      if (w + 84 > 1960) { x2.font = "700 " + Math.floor(250 * 1960 / (w + 84)) + "px 'Dancing Script', cursive"; w = x2.measureText(tx).width; } // phông dự phòng rộng hơn: thu nhỏ cho đủ câu, không để mất chữ
      const x0 = 1024 - (w + 84) / 2;
      x2.fillText(tx, x0, 215); dropPath(x2, x0 + w + 50, 168, 112); x2.fill();
    };
    draw();
    // giọt nước lớn: viền dày, một vệt sáng bên trong
    const dc = document.createElement('canvas'); dc.width = 400; dc.height = 560; const x3 = dc.getContext('2d', { willReadFrequently: true });
    x3.strokeStyle = '#fff'; x3.lineWidth = 20; x3.lineJoin = 'round'; dropPath(x3, 200, 30, 500); x3.stroke();
    x3.fillStyle = 'rgba(255,255,255,0.3)'; dropPath(x3, 200, 30, 500); x3.fill();
    x3.lineWidth = 16; x3.lineCap = 'round'; x3.beginPath(); x3.arc(200, 380, 92, Math.PI * 0.62, Math.PI * 0.95); x3.stroke();
    const dm = x3.getImageData(0, 0, 400, 560).data, dA = [], dB = [];
    for (let y = 0; y < 560; y += 3) for (let x = 0; x < 400; x += 3) { const al = dm[(y * 400 + x) * 4 + 3]; if (al > 200) dA.push(x, y); else if (al > 40) dB.push(x, y); }
    const DH = 150, DC = C.clone().addScaledVector(u, 8);
    const NT = LOW ? 2000 : 3400, NF = LOW ? 900 : 1700, N = NT + NF;
    const P = new Float32Array(N * 3), Tg = new Float32Array(N * 3), Dg = new Float32Array(N * 3), R = new Float32Array(N * 4), Cc = new Float32Array(N * 3);
    const fill = () => {
      const im = x2.getImageData(0, 0, tc.width, tc.height).data, pts = [];
      for (let y = 0; y < tc.height; y += 3) for (let x = 0; x < tc.width; x += 3) if (im[(y * tc.width + x) * 4 + 3] > 150) pts.push(x, y);
      const np = pts.length / 2; let s2 = 99;
      const r2 = () => { s2 = (s2 * 16807) % 2147483647; return (s2 - 1) / 2147483646; };
      for (let i = 0; i < N; i++) {
        R.set([r2(), r2(), r2(), r2()], i * 4);
        const k = KEYC[Math.floor(r2() * 5)], wv = r2() < 0.25 ? 0.6 : 0.15; Cc.set([mix(k[0], 1, wv), mix(k[1], 0.92, wv), mix(k[2], 0.8, wv)], i * 3);
        if (i < NT && np > 50) {
          const zz = r2() * 2 - 1, aa = r2() * 6.283, rr = Math.sqrt(1 - zz * zz), m = 0.25 + 0.75 * Math.cbrt(r2()); // hướng bắn của hạt
          P.set([Math.cos(aa) * rr * m, zz * m, Math.sin(aa) * rr * m], i * 3);
          const j = Math.floor(r2() * np), tx = (pts[j * 2] + r2() * 3) / tc.width - 0.5, ty = (pts[j * 2 + 1] + r2() * 3 - tc.height / 2) / tc.width;
          const q = C.clone().addScaledVector(r, tx * WID).addScaledVector(u, -ty * WID);
          Tg.set([q.x, q.y, q.z], i * 3); R[i * 4 + 1] = clamp(tx + 0.5 + (r2() - 0.5) * 0.25, 0, 1); // viết từ trái sang phải
          const L = r2() < 0.72 ? dA : dB, dj = Math.floor(r2() * (L.length / 2));
          const d = DC.clone().addScaledVector(r, (L[dj * 2] + r2() * 3 - 200) / 560 * DH).addScaledVector(u, -(L[dj * 2 + 1] + r2() * 3 - 280) / 560 * DH);
          Dg.set([d.x, d.y, d.z], i * 3);
        } else {
          const px = (r2() - 0.5) * 900, py = 40 + r2() * 330, pz = D_FR + 60 + r2() * 700;
          P.set([px, Math.max(py, doiH(px, pz) + 20), pz], i * 3); Tg.set([0, -9999, 0], i * 3);
        }
      }
    };
    fill();
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('aT', new T.BufferAttribute(Tg, 3)); g.setAttribute('aD', new T.BufferAttribute(Dg, 3)); g.setAttribute('aR', new T.BufferAttribute(R, 4)); g.setAttribute('aCol', new T.BufferAttribute(Cc, 3));
    starM = new T.ShaderMaterial({ uniforms: U(), vertexShader: STAR_V, fragmentShader: GLOW_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    const m = new T.Points(g, starM); m.frustumCulled = false; m.renderOrder = 9; scene.add(m);
    textTex = new T.CanvasTexture(tc); textTex.minFilter = T.LinearFilter; textTex.generateMipmaps = false;
    textMesh = new T.Mesh(new T.PlaneGeometry(WID, WID * tc.height / tc.width), new T.MeshBasicMaterial({ map: textTex, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, depthTest: false, color: new T.Color(1, 0.9, 0.72) }));
    textMesh.position.copy(C); textMesh.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(r, u, f.clone().negate())); textMesh.renderOrder = 10; textMesh.frustumCulled = false; scene.add(textMesh);
    // Google Fonts tách chữ có dấu tiếng Việt thành tệp riêng, tải chậm hơn. Phông chưa về thì canvas vẽ bằng phông khác.
    // document.fonts.check() báo sai (bảo "sẵn sàng" khi chưa có), nên tự đo: bề rộng chữ đổi khác so với phông dự phòng thì phông mới thật sự về.
    const FONT = "700 250px 'Dancing Script'", CAU = 'Đến ôm em bằng được';
    const rong = (t, f) => { x2.font = '700 100px ' + f; return x2.measureText(t).width; };
    const sanSang = () => { try { return Math.abs(rong('ếằđượ', "'Dancing Script', monospace") - rong('ếằđượ', 'monospace')) > 1 && Math.abs(rong('Đnmbg', "'Dancing Script', monospace") - rong('Đnmbg', 'monospace')) > 1; } catch (e) { return false; } };
    const redo = () => { draw(); fill(); ['position', 'aT', 'aD', 'aR'].forEach((k) => { g.attributes[k].needsUpdate = true; }); textTex.needsUpdate = true; };
    const cho = (n) => {
      if (sanSang()) { textDone = true; redo(); return; }
      if (n % 6 === 0) { try { document.fonts.load(FONT, CAU).catch(() => {}); } catch (e) { /* bỏ qua */ } }
      if (n < 300) setTimeout(() => cho(n + 1), 600);
    };
    textDone = false; cho(0);
    // tia pháo có đuôi
    const ND = LOW ? 90 : 150, NJ = LOW ? 5 : 8, fp = [], ff = []; let s3 = 5;
    const r3 = () => { s3 = (s3 * 16807) % 2147483647; return (s3 - 1) / 2147483646; };
    for (let b = 0; b < 5; b++) for (let i = 0; i < ND; i++) {
      const zz = 1 - 2 * (i + 0.5) / ND, rr = Math.sqrt(1 - zz * zz), aa = i * 2.39996 + b, sp = (i % 5 < 3 ? 1 : 0.55) * (0.92 + 0.16 * r3()), rn = r3();
      for (let j = 0; j < NJ; j++) { fp.push(Math.cos(aa) * rr, zz, Math.sin(aa) * rr); ff.push(b, j * 8 / NJ, sp, rn); }
    }
    const fg = new T.BufferGeometry(); fg.setAttribute('position', new T.Float32BufferAttribute(fp, 3)); fg.setAttribute('aF', new T.Float32BufferAttribute(ff, 4));
    const fm = new T.Points(fg, new T.ShaderMaterial({ uniforms: U(), vertexShader: FW_V, fragmentShader: GLOW_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    fm.frustumCulled = false; fm.renderOrder = 9; scene.add(fm);
  }

  function resize() {
    if (!renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    basePR = Math.min(window.devicePixelRatio || 1, LOW ? 1.5 : 1.6);
    const pr = basePR * quality;
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
    composer.setPixelRatio(pr); composer.setSize(w, h);
    wPx = Math.floor(w * pr); hPx = Math.floor(h * pr);
    nDoi++;
    cam.aspect = w / h; G.uRes.value.set(wPx, hPx);
  }

  const _h = [0, 0, 0], _h2 = [0, 0, 0], _c0 = [0, 0, 0];
  function applyS(S, dt) {
    const c = camAt(S);
    // đỉnh nhạc và lúc đứng hình: máy rung nhẹ theo sét
    let fl = 0; const top = [[0, 0], [0, 0], [0, 0]];
    for (let k = 0; k < FL.length; k++) { const e = flashEnv(k, S); if (e > 0.002) { fl += e; let m = 0; if (top[1][0] < top[m][0]) m = 1; if (top[2][0] < top[m][0]) m = 2; if (e > top[m][0]) top[m] = [e, k]; } }
    const shake = S > 104 && S < S_FRZ ? Math.min(fl, 1.2) * 0.10 : 0;
    cam.position.set(c[0] + Math.sin(S * 19) * shake, c[1] + Math.sin(S * 23) * shake, c[2]);
    const bf0 = (((S - 0.8) % 1) + 1) % 1, beat = bf0 < 0.07 ? bf0 / 0.07 : Math.exp(-6 * (bf0 - 0.07));
    cam.fov = c[6] - (S > S_B && S < S_FRZ ? beat * 0.4 : 0); cam.updateProjectionMatrix();
    cam.lookAt(c[3], c[4], c[5]); cam.updateMatrixWorld();
    G.uS.value = S; G.uBeat.value = S > 76 && S < S_FRZ ? beat : 0;
    G.uPx.value = hPx / (2 * Math.tan(cam.fov * Math.PI / 360));
    for (let k = 0; k < 8; k++) { const t = S - WAVE_T[k]; G.uWaveR.value[k] = t > 0 ? t * (150 + 26 * t) : 0; }
    G.uGrey.value = 1 - ease((S - 81) / 5);
    for (let k = 0; k < 5; k++) G.uPylOn.value[k] = ease((S - 90.8 - 2 * k) / 0.6);
    // không khí theo đoạn
    const wv = clamp((S - S_A) / 30, 0, 1), storm = ease((S - 98) / 20), dawn = ease((S - 145) / 13.5), dz = ease((S - 131) / 6);
    G.uDawn.value = dawn; G.uFlash.value = fl;
    G.uAmb.value = mix(mix(mix(0.95, 1.2, wv), 0.9, storm), 1.0, dawn);
    G.uFogD.value = mix(mix(mix(0.0034, 0.0023, ease((S - 77) / 6)), 0.0027, storm), 0.0011, Math.max(dz * 0.5, dawn));
    const fc = G.uFogCol.value; fc.set(mix(0.075, 0.115, wv), mix(0.085, 0.10, wv), mix(0.105, 0.125, wv));
    const sb = ease((S - 79) / 8); fc.set(mix(fc.x, 0.046, sb), mix(fc.y, 0.060, sb), mix(fc.z, 0.096, sb));
    fc.x += fl * 0.035; fc.y += fl * 0.042; fc.z += fl * 0.058;
    fc.set(mix(fc.x, 0.72, dawn), mix(fc.y, 0.44, dawn), mix(fc.z, 0.42, dawn));
    const su = skyM.uniforms;
    su.uCov.value = mix(mix(0.80, 0.97, storm), 0.36, ease((S - 142.5) / 11));
    su.uGlow.value = mix(0.25, 1, wv) * (1 - sb * 0.85); su.uStars.value = ease((S - 143) / 6) * (1 - dawn * 0.8); su.uMount.value = ease((S - 100) / 14);
    const tw = ease((S - 68.8) / 3) * (1 - ease((S - 84) / 10)); su.uSkyTint.value.set(0.30 * tw, 0.16 * tw, 0.26 * tw);
    const cp0 = camAt(Math.min(S, 200));
    for (let i = 0; i < 3; i++) { const e = top[i][0], k = top[i][1], f = FL[k], cc = camAt(f[0]); su.uFI.value[i] = e; su.uFP.value[i].set(cc[0] + f[2], 520, cc[2] + f[3] * 1.3); }
    // sét đánh xuống
    for (let b = 0; b < bolts.length; b++) bolts[b].visible = false;
    for (let i = 0; i < 3; i++) { const e = top[i][0], k = top[i][1]; if (e > 0.04 && FL[k][1] >= 0.7) { const m = bolts[k % bolts.length], cc = camAt(FL[k][0]); if (m.visible) continue; m.visible = true; m.material.uniforms.uOff.value.set(cc[0] + FL[k][2], 0, cc[2] + FL[k][3]); m.material.uniforms.uI.value = e * 2.2; m.material.uniforms.uW.value = (k === FRZ_I ? 3.4 : 2.4) * quality * basePR; } }
    roadM.uniforms.uFront.value = frontZ(Math.min(S, 131.2));
    // mưa: thời gian riêng, đứng hình rồi chạy ngược
    const ru = rainM.uniforms, rate = rainRate(S);
    const c1 = camAt(S - 0.03); _c0[0] = (c[0] - c1[0]) / 0.03; _c0[1] = (c[1] - c1[1]) / 0.03; _c0[2] = (c[2] - c1[2]) / 0.03;
    const ex = 0.028;
    ru.uVec.value.set((5 * rate - _c0[0]) * ex, (-36 * rate - _c0[1]) * ex, (-3 * rate - _c0[2]) * ex);
    ru.uRT.value = rainT(S);
    ru.uRainA.value = mix(mix(mix(0.22, 0.34, ease((S - 80) / 6)), 0.7, ease((S - 100) / 18)), 1, ease((S - S_FRZ) / 0.3)) * (1 - ease((S - 143.5) / 5.5));
    const drop = ease((S - S_FRZ) / 0.25) * (1 - ease((S - 135.2) / 3.2));
    ru.uDrop.value = drop; ru.uRpx.value = 1.05 * quality * basePR; ru.uHeadK.value = mix(0.5, 1.5, drop); ru.uTint.value = Math.max(ease((S - 68.8) / 3) * (1 - ease((S - 82) / 6)) * 0.6, ease((S - 136) / 6) * 0.8);
    // năm đốm sáng + dải sáng
    const hpA = headPts.geometry.attributes.position, hi = headPts.geometry.attributes.aInf;
    const headA = ease((S - 47.6) / 1.2); let bR = 0, bG = 0, bB = 0;
    for (let i = 0; i < 5; i++) {
      headAt(i, S, _h); hpA.setXYZ(i * 2, _h[0], _h[1], _h[2]); hpA.setXYZ(i * 2 + 1, _h[0], _h[1], _h[2]); ru.uHead.value[i].set(_h[0], _h[1], _h[2]);
      const wk = S - WAVE_T[i], wall = Math.min(Math.abs(S - WAVE_T[5]), Math.abs(S - WAVE_T[6]), Math.abs(S - WAVE_T[7]));
      const pulse = (wk > -0.3 && wk < 1.2 ? Math.exp(-Math.abs(wk) * 3) : 0) + (wall < 1.2 ? Math.exp(-wall * 3) : 0);
      const tb = S - TB[i], alive = tb < 0, bf = alive ? 0 : Math.exp(-tb * 4.5);
      hi.setX(i * 2, alive ? 1.5 + pulse * 3 + ease((S - 137) / 4) * 1.5 : 18 * bf); hi.setX(i * 2 + 1, alive ? (S < S_B ? 5 : 3.2) + pulse * 16 + ease((S - 137) / 4) * 4 : 90 * bf);
      if (!alive) { const e = Math.exp(-tb * 2.0); bR += KEYC[i][0] * e; bG += KEYC[i][1] * e; bB += KEYC[i][2] * e; }
      const rb = ribbons[i], P = rb.geometry.attributes.position, tail = S < 78 ? 1.3 : 1.5, wd = S < 78 ? 0.34 : 0.3;
      let lx = _h[0], ly = _h[1], lz = _h[2];
      for (let j = 0; j <= SEGN; j++) {
        headAt(i, S - (j / SEGN) * tail, _h2);
        let tx = lx - _h2[0], ty = ly - _h2[1], tz = lz - _h2[2]; if (j === 0) { headAt(i, S - 0.02, _h); tx = _h2[0] - _h[0]; ty = _h2[1] - _h[1]; tz = _h2[2] - _h[2]; }
        const vx = cam.position.x - _h2[0], vy = cam.position.y - _h2[1], vz = cam.position.z - _h2[2];
        let sx = ty * vz - tz * vy, sy = tz * vx - tx * vz, sz = tx * vy - ty * vx; const sl = Math.hypot(sx, sy, sz) || 1; sx *= wd / sl; sy *= wd / sl; sz *= wd / sl;
        P.setXYZ(j * 2, _h2[0] - sx, _h2[1] - sy, _h2[2] - sz); P.setXYZ(j * 2 + 1, _h2[0] + sx, _h2[1] + sy, _h2[2] + sz);
        lx = _h2[0]; ly = _h2[1]; lz = _h2[2];
      }
      P.needsUpdate = true; rb.material.uniforms.uA.value = headA * 0.85 * (alive ? 1 : Math.exp(-tb * 3));
    }
    hpA.needsUpdate = true; hi.needsUpdate = true; headPts.userData.k.value = headA;
    G.uBurst.value.set(bR * 0.5, bG * 0.5, bB * 0.5);
    // ô cửa sổ của em: nắng đầu ngày bắt vào kính
    glowUs.her.value = 0.35 * ease((S - 128) / 3) + 1.6 * ease((S - 148) / 5);
    textMesh.material.opacity = 0.5 * ease((S - 153.4) / 2.6) * (1 - ease((S - 161.4) / 4.0));
    // hậu kỳ
    const gu = gradePass.uniforms;
    gu.uFade.value = 1 - ease((S - 162.2) / 3.6); gu.uTime.value = (S * 7.13) % 10; gu.uWarm.value = dawn;
    gu.uWhite.value = (S > 128.8 ? 0.6 * Math.exp(-(S - 128.8) * 3.2) : 0) + (bR + bG + bB) * 0.012;
    bloomPass.strength = 0.62 + fl * 0.08;
  }
  const SEGN = 40;

  let an2d = false;
  function hide() { if (an2d) { an2d = false; const g2 = document.getElementById('cv'); if (g2) g2.style.visibility = ''; } if (shown && cvs) { cvs.style.display = 'none'; shown = false; } }
  // Điện thoại: đoạn chậm (thành phố, mưa đứng hình, bình minh) vẽ 30 khung/giây cho mát máy; đoạn lao nhanh vẽ 60.
  function capFor(S) { return FPS || 60; } // màn 120 Hz cũng chỉ vẽ 60 cho mát máy
  function frame(S, now, dt) {
    if (!ready) return false;
    const tn = performance.now(); lastCall = tn;
    if (!(S >= S_IN && S < S_END)) { hide(); return false; }
    if (!shown) { cvs.style.display = 'block'; shown = true; frameMs = 16; slowN = 0; lastDraw = 0; }
    // khi bản 3D đã phủ kín thì ẩn canvas 2D bên dưới, trình duyệt khỏi phải ghép hai lớp
    const g2 = document.getElementById('cv'); if (g2) { const an = S > S_IN + 1.5; if (an !== an2d) { an2d = an; g2.style.visibility = an ? 'hidden' : ''; } }
    const cap = capFor(S), gap = tn - lastDraw;
    if (gap < 600 / cap) return true; // chưa tới lượt vẽ: giữ nguyên hình cũ
    lastDraw = tn;
    if (needResize) { needResize = false; resize(); }
    const op = clamp((S - S_IN) / 1.3, 0, 1); if (op < 1 || cvs.style.opacity !== '1') cvs.style.opacity = op.toFixed(3);
    try {
      applyS(S, dt);
      composer.render();
    } catch (e) { failed = true; ready = false; hide(); try { console.warn('KET2GL', e); } catch (_) {} return false; }
    if (DO) { doN++; if (gap > 1000 / cap + 14 && gap < 4000) { doCham++; if (gap > gapMax) gapMax = gap; } if (tn - doT > 500) { doEl.textContent = Math.round(doN * 1000 / (tn - doT)) + ' khung/giây · nét ' + Math.round(quality * 100) + '% · ' + wPx + '×' + hPx + ' · khựng ' + doCham + ' (dài nhất ' + Math.round(gapMax) + ' ms) · đổi nét ' + Math.max(0, nDoi) + (khoaNet ? ' (máy bị ghìm tốc độ, giữ nét)' : '') + ' · ẩn ' + nAn + (textDone ? '' : ' · phông chưa về'); doN = 0; doT = tn; } }
    // máy yếu: tự hạ độ nét (áp dụng ở khung hình sau, trước khi vẽ)
    if (!QPIN && gap > 0 && gap < 250) {
      frameMs = frameMs * 0.94 + gap * 0.06;
      const lim = 1000 / cap * 1.32;
      // Hạ độ nét chỉ có ích khi máy chậm vì phải tô nhiều điểm ảnh. Điện thoại bật tiết kiệm pin (hoặc đang nóng) bị trình duyệt
      // ghìm ở 30 khung/giây: hạ nét không nhanh hơn mà chỉ mờ đi. Nên hạ thử một nấc, không thấy nhanh hơn thì trả lại nét cũ và thôi.
      if (khoaNet) { /* đã biết hạ nét vô ích */ }
      else if (thuNet > 0) { if (--thuNet === 0) { if (frameMs > msTruoc * 0.88) { quality = 1; khoaNet = true; needResize = true; } slowN = 0; } }
      else if (frameMs > lim && ++slowN > 40 && quality > 0.66) { if (quality >= 0.999) { msTruoc = frameMs; thuNet = 75; } quality = Math.max(0.66, quality - 0.17); slowN = 0; needResize = true; }
      else if (frameMs <= lim) slowN = Math.max(0, slowN - 1);
    }
    return true;
  }
  function start() {
    try {
      T = window.THREE;
      cvs = document.createElement('canvas');
      cvs.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;display:none;z-index:4;pointer-events:none;background:#060504';
      renderer = new T.WebGLRenderer({ canvas: cvs, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
      if (!renderer.capabilities.isWebGL2) throw new Error('cần WebGL2');
      T.ColorManagement.enabled = false; renderer.outputColorSpace = T.LinearSRGBColorSpace;
      renderer.setClearColor(0x060504, 1);
      if (QPIN) quality = clamp(QPIN, 0.3, 1);
      document.body.appendChild(cvs);
      if (DO) { doEl = document.createElement('div'); doEl.style.cssText = 'position:fixed;left:8px;top:6px;z-index:9;color:#fff;font:13px monospace;background:rgba(0,0,0,.5);padding:3px 7px;border-radius:5px;pointer-events:none'; document.body.appendChild(doEl); }
      build();
      window.addEventListener('resize', resize);
      setInterval(() => { if (shown && performance.now() - lastCall > 2500) { nAn++; hide(); } }, 800);
      cvs.addEventListener('webglcontextlost', (e) => { e.preventDefault(); nMat++; failed = true; ready = false; hide(); if (doEl) doEl.textContent = 'MẤT HÌNH 3D (máy thu hồi bộ nhớ đồ hoạ)'; });
      warm(() => { ready = true; });
    } catch (e) { failed = true; try { console.warn('KET2GL', e); if (cvs && cvs.parentNode) cvs.parentNode.removeChild(cvs); } catch (_) {} }
  }
  function nap() {
    if (ready || failed || loading || Q.get('k2cu') === '1') return;
    loading = true;
    const done = () => setTimeout(start, 30);
    if (window.THREE && window.THREE.WebGLRenderer) { done(); return; }
    const s = document.createElement('script'); s.src = 'lib/three-k2.js?v=1'; s.onload = done; s.onerror = () => { failed = true; };
    document.head.appendChild(s);
  }
  window.KET2GL = { nap, frame, hide, ok: () => ready, phu: () => shown && cvs && cvs.style.opacity === '1', camAt, dcam, D_FR, Z_TRAI };
})();
