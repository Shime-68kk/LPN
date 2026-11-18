'use strict';
// SAO BĂNG LÚC NỬA ĐÊM (S 210.4–242): một đường bay duy nhất, đúng hướng tia sáng tới từ sao Eta Cassiopeiae (chòm W).
// Ở cảnh Trái Đất, tia sáng lao vào khí quyển trên Việt Nam rồi chui vào mây. Dưới đất: đám mây cạnh chòm W sáng lên từ bên trong,
// 211.72 nó xé mây lao ra, cắm thẳng về đồi chè cạnh trại theo đường thẳng (không bẻ lái), hãm dần nhưng vẫn rất nhanh;
// 212.72 lớp ngoài bốc cháy, bung một chùm tàn lửa (nó nhỏ lại, nóng trắng hơn); vệt khí ion hoá xanh lục treo lại trên trời.
// 217.62 (phách mạnh nhất của đoạn nhạc) va vào đỉnh đồi chè: loé trắng, quầng sáng nở tròn trong sương, sóng sáng chạy theo
// từng vòng hàng chè như gợn nước, tàn lửa bắn tung, khói hồng bốc lên; gió từ chỗ va chạm tới doanh trại sau nửa giây.
// Từ đỉnh đồi còn rực, 19 đốm sáng (mười chín năm) bay lên, toả khắp thung lũng; một đốm bay vào cửa sổ của em.
(() => {
  const SN = window.SN, M = SN.M, { clamp, mix, ease } = SN.u;
  const T_RA = 211.72, T_FL = 212.72, T_IMP = 217.62;
  const VE = 160, AC = 145;                       // tốc độ lúc chạm đất (m/s), hệ số hãm: d = VE·τ + AC·τ² (τ: giây còn lại tới lúc va)
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const dOf = (S) => { const t = Math.max(0, T_IMP - S); return VE * t + AC * t * t; };
  const tAtD = (d) => T_IMP - (-VE + Math.sqrt(VE * VE + 4 * AC * Math.max(d, 0))) / (2 * AC);
  const D_RA = dOf(T_RA);

  // so độ sâu mềm với ảnh vật đặc (hiệu ứng vẽ sau lớp nhoè ống kính): khuất sau đồi, nhà thì tắt; sát mặt vật thì mờ dần
  const MEM = `
  uniform sampler2D tDep; uniform vec2 uDepTx, uNF; uniform vec3 uDofF;
  float zLin(float d){ return 2. * uNF.x * uNF.y / (uNF.y + uNF.x - (d * 2. - 1.) * (uNF.y - uNF.x)); }
  float mem(float soft){ float zs = zLin(texture(tDep, gl_FragCoord.xy * uDepTx).r), zf = zLin(gl_FragCoord.z); return sat((zs - zf) / soft); }`;
  // ---------- vệt nhoè (đầu sao, tàn lửa, đốm sáng) ----------
  const STREAK_V = `
  attribute vec4 iA;   // vị trí hiện tại, bán kính (m)
  attribute vec4 iB;   // vị trí trước đó, độ sáng
  attribute vec4 iC;   // màu, loại (0 tàn lửa, 1 đốm sáng, 2 đầu sao)
  varying vec2 vQ; varying vec3 vC; varying float vI; varying float vL; varying float vR; varying float vK; varying float vBok; varying float vRR;
  void main(){
    vI = iB.w; vC = iC.rgb; vK = iC.w;
    vec4 c1 = projectionMatrix * viewMatrix * vec4(iA.xyz, 1.);
    vec4 c0 = projectionMatrix * viewMatrix * vec4(iB.xyz, 1.);
    if (vI <= 0. || c1.w < .2) { gl_Position = vec4(2., 2., 2., 1.); return; }
    vec2 h = .5 * uRes;
    vec2 s1 = c1.xy / c1.w * h, s0 = c0.xy / max(c0.w, .2) * h;
    float pxm = projectionMatrix[1][1] * h.y / c1.w;
    float r = iA.w * pxm;
    float cocPx = uDofF.y > 0. ? min(uDofF.y * abs(1. - uDofF.x / c1.w), uDofF.z) * uRes.y / 900. : 0.;   // ngoài vùng nét: thành đốm tròn
    vBok = vK < 1.5 ? smoothstep(1.5, 6., cocPx) : 0.;
    float rmin = (vK > 1.5 ? 1.6 : (vK > .5 ? 2.4 : 1.0)) * uRes.y / 900.;
    float rr = max(max(r, rmin), cocPx);
    vI *= min(1., (r * r + .3) / (rr * rr + .3));
    vec2 d = s1 - s0; float L = length(d);
    L = min(L, 520. * uRes.y / 900.);
    vec2 ax = L > .01 ? d / max(length(d), 1e-4) : vec2(1., 0.), ay = vec2(-ax.y, ax.x);
    float halo = vK > 1.5 ? 7. : (vK > .5 ? mix(4.5, 1.5, vBok) : mix(3.2, 1.4, vBok));
    float R = min(rr * halo, (vK > 1.5 ? 150. : 60.) * uRes.y / 900.);
    vRR = R;
    vec2 mid = s1 - ax * L * .5;
    vec2 p = mid + ax * position.x * (L * .5 + R) + ay * position.y * R;
    vQ = vec2(position.x * (L * .5 + R), position.y * R);
    vL = L * .5; vR = rr;
    vI *= rr / (rr + L * .5);
    gl_Position = vec4(p / h * c1.w, c1.z, c1.w);
  }`;
  const STREAK_F = `
  varying vec2 vQ; varying vec3 vC; varying float vI; varying float vL; varying float vR; varying float vK; varying float vBok; varying float vRR;
  void main(){
    float dx = max(abs(vQ.x) - vL, 0.);
    float dp = length(vec2(dx, vQ.y));
    float d = dp / vR;
    float edge = smoothstep(vRR, vRR * .55, dp);
    float a;
    if (vK > 1.5) a = exp(-d * d * 1.5) * 5. + exp(-d * 1.1) * .55 + exp(-d * .4) * .08;            // đầu sao: lõi chói + quầng
    else {
      // đốm sáng / tàn lửa; ngoài vùng nét thì thành đĩa bokeh: mặt phẳng, mép sáng hơn một chút
      float disk = (1. - smoothstep(.86, 1.02, d)) * (.75 + .3 * smoothstep(.55, .95, d));
      float core = vK > .5 ? exp(-d * d * 2.2) * 2.4 + exp(-d * .8) * .62 : exp(-d * d * 1.8) * 3.2 + exp(-d * 1.1) * .32;
      a = mix(core, disk * 1.1, vBok);
    }
    gl_FragColor = vec4(vC * a * vI * edge * mem(vK > 1.5 ? 4. : 1.2), 1.);
  }`;

  // ---------- dải lụa sáng (vệt khí ion hoá) ----------
  const RIB_V = `
  attribute vec3 aP; attribute vec3 aT; attribute float aS; attribute float aW; attribute float aI; attribute float aG; attribute float aU;
  varying float vV; varying float vI; varying float vG; varying float vU;
  void main(){
    vec4 cc = viewMatrix * vec4(aP, 1.);
    vec3 tv = mat3(viewMatrix) * aT;
    vec3 sd = cross(tv, cc.xyz); float sl = length(sd); sd = sl > 1e-6 ? sd / sl : vec3(1., 0., 0.);
    float pxm = projectionMatrix[1][1] * .5 * uRes.y / max(-cc.z, .1);
    float wpx = aW * pxm, wmin = 1.2 * uRes.y / 900., wmax = 40. * uRes.y / 900.;
    float k = max(wpx, wmin) / max(wpx, 1e-5);
    if (wpx > wmax) k = wmax / wpx;
    float sinA = length(cross(normalize(tv + 1e-6), normalize(cc.xyz)));
    vI = aI / max(k, 1.) * smoothstep(8., 60., -cc.z) * smoothstep(.06, .4, sinA); vV = aS; vG = aG; vU = aU;
    gl_Position = projectionMatrix * vec4(cc.xyz + sd * aW * k * aS, 1.);
  }`;
  const RIB_F = `
  uniform vec3 uC0, uC1, uC2;
  uniform float uNz, uSeed2;
  varying float vV; varying float vI; varying float vG; varying float vU;
  void main(){
    float across = exp(-vV * vV * 2.6);
    float core = exp(-vV * vV * 14.) * (1. - vG) * .8;
    float n = .5 + .9 * sat(.5 + pn(vec3(vU * uNz, uSeed2, uS * .25)) * 1.6 + pn(vec3(vU * uNz * 3.1, uSeed2 + 3.7, uS * .5)) * .7);
    vec3 c = mix(mix(uC0, uC1, sat(vG * 2.)), uC2, sat(vG * 2. - 1.));
    gl_FragColor = vec4(c * (across + core) * vI * mix(1., n, sat(vG * 3.)) * mem(8.), 1.);
  }`;

  // ---------- quầng sáng va chạm: vỏ cầu nở ra trong sương (sáng ở viền như bong bóng ánh sáng) ----------
  const SHELL_V = `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vW = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`;
  const SHELL_F = `
  uniform float uShI; uniform vec3 uShC, uShO;
  varying vec3 vN; varying vec3 vW;
  void main(){
    vec3 v = normalize(cameraPosition - vW);
    float f = 1. - abs(dot(vN, v));
    float nz = .7 + .6 * (pn((vW - uShO) * .03 + vec3(0., uS * .8, 0.)) + .5);
    float low = smoothstep(-.1, .5, vN.y) * .6 + .4;                           // sát đất dày hơn (sương)
    gl_FragColor = vec4(uShC * (pow(f, 6.) * 1.1 + .015) * uShI * nz * low * mem(10.), 1.);
  }`;
  // ---------- khói hồng bốc lên từ chỗ va chạm (tấm mờ quay mặt về máy quay, ánh lửa hắt từ dưới) ----------
  const KHOI_V = `
  attribute vec4 iS; attribute vec4 iK;    // tâm, bán kính · độ sáng, hạt giống, độ hồng
  varying vec2 vP; varying vec4 vK; varying vec3 vW;
  void main(){
    vec3 r = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), u = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 wp = iS.xyz + (r * position.x + u * position.y) * iS.w;
    vP = position.xy; vK = iK; vW = wp;
    gl_Position = iK.x > 0. ? projectionMatrix * viewMatrix * vec4(wp, 1.) : vec4(2., 2., 2., 1.);
  }`;
  const KHOI_F = `
  varying vec2 vP; varying vec4 vK; varying vec3 vW;
  void main(){
    float r = length(vP);
    float n = fbm3(vec3(vW.xz * .05 + vK.y, vW.y * .05 - uS * .12));
    float a = smoothstep(1., .25, r + n * .55) * (.55 + .9 * (n + .5));
    vec3 c = mix(vec3(.55, .48, .5), vec3(1., .5, .2), vK.z) * (1. - .45 * smoothstep(.2, -.6, vP.y));   // dưới sáng ấm (lửa hắt lên)
    gl_FragColor = vec4(c * a * vK.x * mem(5.), 1.);
  }`;

  SN.dat.dungSaoBang = function (T, U, ctx) {
    const { E, IMP, hDat, cuaSo, cuaSoN, tC, Yp } = ctx;   // E: hướng tới sao Eta Cas (đơn vị), IMP: đỉnh đồi chè
    const posAt = (S) => add(IMP, E, dOf(S));
    const speedAt = (S) => VE + 2 * AC * Math.max(0, T_IMP - S);
    const velAt = (S) => E.map((v) => -v * speedAt(S));
    // độ sáng đầu sao: loé ra khỏi mây, chập chờn, bùng ở 212.72 (nhỏ lại sau đó), sát đất thì nóng trắng
    function headI(S) {
      if (S < T_RA - 0.06 || S >= T_IMP) return 0;
      const t = S - T_RA;
      let I = ss(-0.06, 0.1, t) * (1 + 0.6 * Math.exp(-t / 0.25));
      I *= 1 + 0.14 * Math.sin(S * 61) * Math.sin(S * 37 + 1) + 0.07 * Math.sin(S * 113 + 2);
      I *= S < T_FL ? 1 : 0.82;
      I += 2.4 * Math.exp(-Math.pow((S - T_FL) / 0.07, 2)) + 0.8 * Math.exp(-Math.pow((S - T_FL - 0.12) / 0.12, 2));
      return I;
    }
    const headCol = (S) => { const k = ss(T_IMP - 3.5, T_IMP - 0.4, S); return [mix(0.78, 1.0, k), 1.0, mix(0.86, 0.9, k)]; };
    // ánh đèn đám mây: trước khi ló ra, mây cạnh chòm W sáng dần từ bên trong
    const mayI = (S) => ss(210.4, 211.6, S) * (1 - ss(212.0, 213.4, S)) * (1 + 0.3 * Math.sin(S * 23) * Math.sin(S * 7.1));

    // ---------- 19 đốm sáng: bay lên từ đỉnh đồi còn rực, toả đi rồi đáp xuống ----------
    const MOTES = [];
    {
      let s = 77;
      const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
      const land = [];
      // trong trại: vườn trong, sân, quanh cột cờ (toạ độ khung trại)
      for (const q of [[-12, -15], [14, -2], [-6, 24], [10, 30], [20, 18], [-20, 6]]) { const p = tC(q[0] + (r() - 0.5) * 3, 0, q[1] + (r() - 0.5) * 3); land.push([p[0], Yp + 1.2, p[2]]); }
      // sườn đồi trại, thung lũng giữa hai đồi, xóm, sườn đồi chè (để sóng sáng lan ở nhiều nơi)
      for (const [x, z] of [[-30, -112], [70, -96], [-58, -64], [24, -40], [-14, -26], [52, -18], [-96, -150], [118, -180], [-150, -40], [160, -110], [-70, -210], [8, -250]]) land.push([x, hDat(x, z) + 0.6, z]);
      land.push([cuaSo[0] + cuaSoN[0] * 0.35, cuaSo[1], cuaSo[2] + cuaSoN[2] * 0.35]);    // đốm thứ 19: cửa sổ của em
      // lúc đáp: rải 222.4 → 236.6, dồn vài đốm vào cao trào nhạc 228.85; đốm cửa sổ 239.4
      const lich = [222.6, 223.5, 224.6, 225.4, 226.3, 227.2, 228.7, 228.85, 229.0, 229.15, 229.9, 230.8, 231.9, 232.8, 233.9, 234.8, 235.7, 236.6];
      for (let i = 0; i < 19; i++) {
        const L = land[i];
        const t0 = T_IMP + 1.25 + i * 0.075 + r() * 0.25;
        const tLand = i === 18 ? 239.4 : lich[i];
        const a = r() * 6.283, rr = 1 + r() * 4;
        const st = [IMP[0] + Math.cos(a) * rr, IMP[1] + 0.5, IMP[2] + Math.sin(a) * rr];
        const top = add(st, [Math.cos(a) * (4 + r() * 6), 9 + r() * 14, Math.sin(a) * (4 + r() * 6)]);
        const hc = 14 + r() * 26;
        MOTES.push({ L, st, top, hc, t0, tLand, sway: 1.5 + r() * 4, ph: r() * 6.28, fr: 0.3 + r() * 0.4, sz: 0.85 + r() * 0.45, col: [1, mix(0.74, 0.86, r()), mix(0.42, 0.58, r())], tw: 0.7 + r() * 0.8 });
      }
    }
    function moteAt(i, S, out) {
      const mo = MOTES[i], dt = S - mo.t0;
      if (dt < 0) { out[3] = 0; return out; }
      const kR = 1 - Math.exp(-dt / 0.7);   // vọt lên khỏi đỉnh đồi rồi chậm lại
      const life = mo.tLand - mo.t0;
      const u = clamp((dt - 1.2) / Math.max(0.5, life - 1.2), 0, 1), k = u * u * u * (u * (u * 6 - 15) + 10);
      const A = [mix(mo.st[0], mo.top[0], kR), mix(mo.st[1], mo.top[1], kR), mix(mo.st[2], mo.top[2], kR)];
      // đường cong bậc hai: đỉnh → điểm giữa nâng cao → chỗ đáp
      const C = [(mo.top[0] + mo.L[0]) / 2, Math.max(mo.top[1], mo.L[1]) + mo.hc, (mo.top[2] + mo.L[2]) / 2];
      const b0 = (1 - k) * (1 - k), b1 = 2 * (1 - k) * k, b2 = k * k;
      const P = [b0 * mo.top[0] + b1 * C[0] + b2 * mo.L[0], b0 * mo.top[1] + b1 * C[1] + b2 * mo.L[1], b0 * mo.top[2] + b1 * C[2] + b2 * mo.L[2]];
      const w = ss(0.6, 1.6, dt);
      const sw = Math.sin(dt * mo.fr * 2 + mo.ph) * mo.sway * Math.sin(Math.PI * k);
      out[0] = mix(A[0], P[0], w) + sw; out[1] = mix(A[1], P[1], w) + Math.sin(dt * 0.9 + mo.ph) * 0.8 * (1 - k); out[2] = mix(A[2], P[2], w) + sw * 0.6;
      const born = ss(0, 0.35, dt) * (1 + 0.7 * Math.exp(-dt / 0.4));
      out[3] = born * (S < mo.tLand ? 1 : Math.exp(-(S - mo.tLand) * 2.5));
      return out;
    }

    // ---------- tàn lửa ----------
    const SPK = [];
    {
      let s2 = 4242; const r = () => { s2 = (s2 * 16807) % 2147483647; return (s2 - 1) / 2147483646; };
      const rs = (m) => { let x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1; const l = Math.hypot(x, y, z) || 1; return [x / l * m, y / l * m, z / l * m]; };
      for (let i = 0; i < 70; i++) {   // dọc đường bay: đầu sao rụng tàn xanh trắng
        const tb = T_RA + 0.08 + r() * (T_IMP - T_RA - 0.4), v = velAt(tb), j = rs(25 + r() * 60);
        SPK.push({ tb, p: posAt(tb), v: [0, 1, 2].map((k) => v[k] * 0.55 + j[k]), life: 0.35 + r() * 0.6, sz: 0.9 + r() * 1.3 + dOf(tb) * 0.0004, c: [0.75, 1, 0.86], tau: 0.5, g: 9, tw: 0 });
      }
      for (let i = 0; i < 56; i++) {   // 212.72: lớp ngoài bốc cháy, bung một chùm tàn lửa toả nón quanh hướng bay
        const tb = T_FL + r() * 0.06, v = velAt(tb), j = rs(160 + r() * 380);
        SPK.push({ tb, p: posAt(tb), v: [0, 1, 2].map((k) => v[k] * 0.7 + j[k]), life: 0.5 + r() * 1.0, sz: 1.6 + r() * 2.4, c: [1, 0.86 + r() * 0.1, 0.55 + r() * 0.3], tau: 0.35, g: 9, tw: 0 });
      }
      for (let i = 0; i < 190; i++) {   // va chạm: vương miện tàn lửa bắn tung khỏi đỉnh đồi, rơi xuống sườn đồi
        const tb = T_IMP + r() * r() * 0.25, az = r() * 6.283, el = (14 + r() * 62) * Math.PI / 180, sp = 10 + Math.pow(r(), 0.7) * 42;
        const v = [Math.cos(az) * Math.cos(el) * sp, Math.sin(el) * sp, Math.sin(az) * Math.cos(el) * sp];
        SPK.push({ tb, p: add(IMP, [Math.cos(az) * r() * 1.5, 0.4, Math.sin(az) * r() * 1.5]), v, life: 1.3 + r() * 2.2, sz: 0.06 + r() * 0.12, c: [1, 0.78 + r() * 0.18, 0.4 + r() * 0.3], tau: 1.5, g: 9.8, tw: r() < 0.4 ? 6 + r() * 9 : 0, ph: r() * 6.28, dat: true });
      }
    }
    function sparkAt(sp, S, out) {
      const a = S - sp.tb;
      if (a < 0 || a > sp.life) { out[3] = 0; return out; }
      const e = sp.tau * (1 - Math.exp(-a / sp.tau));
      out[0] = sp.p[0] + sp.v[0] * e; out[1] = sp.p[1] + sp.v[1] * e - 0.5 * sp.g * a * a; out[2] = sp.p[2] + sp.v[2] * e;
      let k = a / sp.life, nam = 1;
      if (sp.dat) { const g = hDat(out[0], out[2]) + 0.25; if (out[1] < g) { out[1] = g; nam = 0.5; } }   // rơi xuống đất: nằm lại, cháy âm ỉ
      let I = Math.pow(1 - k, 1.4) * (1 + 1.4 * Math.exp(-a * 9)) * nam;
      if (sp.tw) I *= 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(a * sp.tw + sp.ph), 3);
      else I *= 0.8 + 0.2 * Math.sin(a * 47 + sp.tb * 13);
      out[3] = I;
      return out;
    }

    // ---------- bộ đệm vẽ ----------
    const NI = 1 + 19 + SPK.length;
    const base = new T.PlaneGeometry(2, 2);
    const ig = new T.InstancedBufferGeometry();
    ig.index = base.index; ig.setAttribute('position', base.attributes.position);
    const iA = new Float32Array(NI * 4), iB = new Float32Array(NI * 4), iC = new Float32Array(NI * 4);
    const aA = new T.InstancedBufferAttribute(iA, 4), aB = new T.InstancedBufferAttribute(iB, 4), aC = new T.InstancedBufferAttribute(iC, 4);
    [aA, aB, aC].forEach((a) => a.setUsage(T.DynamicDrawUsage));
    ig.setAttribute('iA', aA); ig.setAttribute('iB', aB); ig.setAttribute('iC', aC);
    ig.instanceCount = NI;
    const stM = new T.ShaderMaterial({ uniforms: Object.assign({}, U), vertexShader: SN_GLSL.CHUNG + `uniform vec3 uDofF;` + STREAK_V, fragmentShader: SN_GLSL.CHUNG + MEM + STREAK_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    const streaks = new T.Mesh(ig, stM); streaks.frustumCulled = false; streaks.userData.ro = 7;
    function setI(i, p, q, rad, I, c, kind) {
      iA[i * 4] = p[0]; iA[i * 4 + 1] = p[1]; iA[i * 4 + 2] = p[2]; iA[i * 4 + 3] = rad;
      iB[i * 4] = q[0]; iB[i * 4 + 1] = q[1]; iB[i * 4 + 2] = q[2]; iB[i * 4 + 3] = I;
      iC[i * 4] = c[0]; iC[i * 4 + 1] = c[1]; iC[i * 4 + 2] = c[2]; iC[i * 4 + 3] = kind;
    }
    function ribbon(n, uni) {
      const nv = (n + 1) * 2;
      const g = new T.BufferGeometry();
      const P = new Float32Array(nv * 3), Tg = new Float32Array(nv * 3), Sd = new Float32Array(nv), Wd = new Float32Array(nv), In = new Float32Array(nv), Ag = new Float32Array(nv), Uu = new Float32Array(nv);
      for (let i = 0; i <= n; i++) { Sd[i * 2] = -1; Sd[i * 2 + 1] = 1; }
      const at = (name, arr, k) => { const b = new T.BufferAttribute(arr, k); b.setUsage(T.DynamicDrawUsage); g.setAttribute(name, b); return b; };
      at('aP', P, 3); at('aT', Tg, 3); g.setAttribute('aS', new T.BufferAttribute(Sd, 1)); at('aW', Wd, 1); at('aI', In, 1); at('aG', Ag, 1); at('aU', Uu, 1);
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(nv * 3), 3));
      const idx = []; for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      g.setIndex(idx);
      const m = new T.ShaderMaterial({ uniforms: Object.assign({}, U, uni), vertexShader: SN_GLSL.CHUNG + RIB_V, fragmentShader: SN_GLSL.CHUNG + MEM + RIB_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      const mesh = new T.Mesh(g, m); mesh.frustumCulled = false; mesh.userData.ro = 6;
      return { mesh, g, n,
        set(i, p, t, w, I, age, u) { P.set(p, i * 6); P.set(p, i * 6 + 3); Tg.set(t, i * 6); Tg.set(t, i * 6 + 3); Wd[i * 2] = Wd[i * 2 + 1] = w; In[i * 2] = In[i * 2 + 1] = I; Ag[i * 2] = Ag[i * 2 + 1] = age; Uu[i * 2] = Uu[i * 2 + 1] = u; },
        done() { ['aP', 'aT', 'aW', 'aI', 'aG', 'aU'].forEach((k) => { g.attributes[k].needsUpdate = true; }); } };
    }
    const V3 = (a, b, c) => new T.Vector3(a, b, c);
    const train = ribbon(140, { uC0: { value: V3(0.85, 1, 0.92) }, uC1: { value: V3(0.28, 1, 0.5) }, uC2: { value: V3(0.25, 0.4, 0.9) }, uNz: { value: 9 }, uSeed2: { value: 1.3 } });
    // quầng va chạm
    const shM = new T.ShaderMaterial({ uniforms: Object.assign({}, U, { uShI: { value: 0 }, uShC: { value: V3(1, 0.78, 0.5) }, uShO: { value: V3(...IMP) } }), vertexShader: SHELL_V, fragmentShader: SN_GLSL.CHUNG + MEM + SHELL_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    const shell = new T.Mesh(new T.SphereGeometry(1, 48, 24), shM); shell.frustumCulled = false; shell.userData.ro = 6; shell.position.set(IMP[0], IMP[1], IMP[2]);
    // khói
    const NK = 18;
    const kg = new T.InstancedBufferGeometry(); kg.index = base.index; kg.setAttribute('position', base.attributes.position);
    const kS = new Float32Array(NK * 4), kK = new Float32Array(NK * 4);
    const aKS = new T.InstancedBufferAttribute(kS, 4), aKK = new T.InstancedBufferAttribute(kK, 4); aKS.setUsage(T.DynamicDrawUsage); aKK.setUsage(T.DynamicDrawUsage);
    kg.setAttribute('iS', aKS); kg.setAttribute('iK', aKK); kg.instanceCount = NK;
    const kM = new T.ShaderMaterial({ uniforms: Object.assign({}, U), vertexShader: KHOI_V, fragmentShader: SN_GLSL.CHUNG + MEM + KHOI_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    const khoi = new T.Mesh(kg, kM); khoi.frustumCulled = false; khoi.userData.ro = 5;
    const KH = [];
    { let s3 = 99; const r = () => { s3 = (s3 * 16807) % 2147483647; return (s3 - 1) / 2147483646; };
      for (let i = 0; i < NK; i++) KH.push({ t0: T_IMP + r() * 0.8, a: r() * 6.283, rr: r() * 5, up: 2 + r() * 4.5, r0: 2 + r() * 3, gr: 2.5 + r() * 4, seed: r() * 10 }); }
    const group = new T.Group();
    group.add(train.mesh); group.add(shell); group.add(khoi); group.add(streaks);
    const FX = [train.mesh, shell, khoi, streaks];
    FX.forEach((m) => { m.layers.set(1); m.material.depthTest = false; });   // lớp hiệu ứng: vẽ sau lớp nhoè ống kính (loi.js)

    const WIND = [3.2, 0.3, 1.6];
    const tmp4 = [0, 0, 0, 0], tmp4b = [0, 0, 0, 0];
    // gió/chấn động tới một điểm: sóng đi ~360 m/s từ chỗ va chạm
    const tToi = (p) => T_IMP + len(sub(p, IMP)) / 360;
    function cap(S, camPos) {
      const hI = headI(S), d = dOf(S), hp = posAt(S), hq = posAt(S - 0.008);
      // vệt khí: từ chỗ ló khỏi mây tới đầu sao (sau va chạm: tới đỉnh đồi), sáng mới thì trắng xanh, cũ thì xanh lục rồi tím nhạt, nở rộng và trôi theo gió
      const dHead = S < T_IMP ? d : 0;
      const on = S > T_RA && S < 241;
      for (let i = 0; i <= train.n; i++) {
        if (!on) { train.set(i, [0, -999, 0], [1, 0, 0], 0, 0, 1, 0); continue; }
        const f = i / train.n;
        const dk = dHead + (D_RA - dHead) * Math.pow(f, 1.8);
        const tk = tAtD(dk), age = Math.max(0, S - tk);
        const p = add(add(IMP, E, dk), WIND, age);
        const tw = Math.sin(dk * 0.004 + 0.7) * 0.7 + Math.sin(dk * 0.011 + 2.1) * 0.3;
        p[1] += tw * age * 2.2; p[0] += Math.cos(dk * 0.006) * age * 1.6;
        const hk = Math.max(0.3, headI(Math.min(tk, T_IMP - 0.01)));
        const near = ss(150, 1400, p[1] - IMP[1]);   // vệt khí chỉ còn đọng lại trên cao; xuống thấp chỉ là vệt nhoè rất mờ (không thành cột sáng)
        const I = (Math.exp(-age / 0.16) * 1.4 + 0.16 * Math.exp(-age / 1.6) + 0.06 * Math.exp(-age / 8)) * Math.min(1.5, hk) * ss(0, 0.05, S - tk + 0.001) * 1.1;
        train.set(i, p, E, 0.6 + age * 2.6 + dk * 0.0003, I * (age < 0.25 ? 1 : 0.04 + 0.96 * near), clamp(age / 4, 0, 1), dk * 0.004);
      }
      train.done();
      // đầu sao
      const gan = clamp(len(sub(hp, camPos)) / 260, 0.18, 1);
      setI(0, hp, hq, 1.6 + 0.8 * hI, hI * 4.2 * gan, headCol(S), 2);
      // đốm sáng
      for (let i = 0; i < 19; i++) {
        moteAt(i, S, tmp4); moteAt(i, S - 0.02, tmp4b);
        const mo = MOTES[i];
        const tw = 1 + 0.12 * Math.sin(S * mo.tw * 2.1 + mo.ph) + 0.05 * Math.sin(S * 7.3 + mo.ph * 3);
        setI(1 + i, tmp4, tmp4b[3] > 0 ? tmp4b : tmp4, 0.36 * mo.sz, tmp4[3] * tw * 1.1, mo.col, 1);
      }
      // tàn lửa
      for (let i = 0; i < SPK.length; i++) {
        const sp = SPK[i];
        sparkAt(sp, S, tmp4); sparkAt(sp, S - 0.012, tmp4b);
        setI(20 + i, tmp4, tmp4b[3] > 0 ? tmp4b : tmp4, sp.sz, tmp4[3] * 1.4, sp.c, 0);
      }
      aA.needsUpdate = true; aB.needsUpdate = true; aC.needsUpdate = true;
      // quầng va chạm: nở nhanh rồi chậm lại, mờ dần
      const ti = S - T_IMP;
      if (ti > 0 && ti < 2.2) {
        const R = 260 * (1 - Math.exp(-ti / 0.35)) + 40 * ti;
        shell.visible = true; shell.scale.setScalar(Math.max(0.5, R));
        shM.uniforms.uShI.value = Math.exp(-ti / 0.16) * 0.22 + 0.03 * Math.exp(-ti / 0.7);
      } else { shell.visible = false; shM.uniforms.uShI.value = 0; }
      // khói hồng
      for (let i = 0; i < NK; i++) {
        const k = KH[i], a = S - k.t0;
        if (a <= 0 || a > 14) { kK[i * 4] = 0; continue; }
        const up = k.up * 2.2 * (1 - Math.exp(-a / 2.2)) + 0.5 * a;
        kS[i * 4] = IMP[0] + Math.cos(k.a) * k.rr + WIND[0] * a * 0.6; kS[i * 4 + 1] = IMP[1] + 1 + up; kS[i * 4 + 2] = IMP[2] + Math.sin(k.a) * k.rr + WIND[2] * a * 0.6;
        kS[i * 4 + 3] = (k.r0 + k.gr * Math.sqrt(a)) * 0.7;
        kK[i * 4] = (ss(0, 0.4, a) * (Math.exp(-a / 1.1) * 0.5 + 0.08 * Math.exp(-a / 5))) * 0.32; kK[i * 4 + 1] = k.seed; kK[i * 4 + 2] = Math.exp(-a / 2.5);
      }
      aKS.needsUpdate = true; aKK.needsUpdate = true;
      // ---------- ánh sáng hắt xuống cảnh vật ----------
      // xa: ánh sao băng như một vầng sáng trên trời (có hướng); gần (< ~900 m): một ngọn đèn thật có vị trí, có bóng
      const kNear = S < T_IMP ? ss(950, 350, d) : 0;
      const md = nrm(sub(hp, camPos));
      U.uMetP.value.set(md[0], md[1], md[2]);
      U.uMet.value = S < T_IMP ? hI * 0.62 * Math.min(2.6, Math.pow(1500 / (d + 500), 1.15)) * (1 - kNear * 0.85) : 0;
      let fpI = 0, fpP = hp;
      if (S < T_IMP) fpI = hI * 110 * kNear;
      else {   // va chạm: loé chói, đỉnh đồi còn rực đỏ một lúc lâu
        fpP = [IMP[0], IMP[1] + 3, IMP[2]];
        fpI = 1500 * Math.exp(-ti / 0.07) + 110 * Math.exp(-ti / 0.35) + 8 * Math.exp(-ti / 2) + 2 * Math.exp(-ti / 10);
      }
      U.uFP.value.set(fpP[0], fpP[1], fpP[2], fpI);
      U.uIMP.value.set(IMP[0], IMP[1], IMP[2], T_IMP);
      U.uMay.value = mayI(S);
      for (let i = 0; i < 19; i++) {
        moteAt(i, S, tmp4);
        U.uMP.value[i].set(tmp4[0], tmp4[1], tmp4[2]); U.uMI.value[i] = tmp4[3] * 0.6;
      }
    }
    // rung máy: tiếng gầm tăng dần khi sao lại gần; cú sốc tới chỗ máy quay sau va chạm (theo khoảng cách)
    function rung(S, camPos) {
      const d = dOf(S);
      let A = S < T_IMP ? 0.012 * ss(T_RA, T_IMP, S) * Math.min(1, 300 / (d + 60)) : 0;
      const ta = tToi(camPos), b = S - ta;
      if (b > 0) A += 0.11 * Math.exp(-b / 0.38) * Math.min(1, 160 / len(sub(camPos, IMP)));
      const n1 = Math.sin(S * 41.3) * 0.6 + Math.sin(S * 73.1 + 1) * 0.4, n2 = Math.sin(S * 37.7 + 2) * 0.6 + Math.sin(S * 91.3) * 0.4, n3 = Math.sin(S * 29.9 + 4) * 0.5 + Math.sin(S * 67.7 + 3) * 0.5;
      return [n1 * A, n2 * A * 0.7, n3 * A, (n2 - n1) * A * 0.35];
    }
    const gio = (S, p) => { const b = S - tToi(p); return b > 0 ? Math.exp(-b / 1.4) * ss(0, 0.15, b) : 0; };
    return { group, FX, cap, posAt, velAt, dOf, headI, MOTES, moteAt, rung, gio, T_RA, T_FL, T_IMP, IMP, E, D_RA, PB: IMP };
  };
})();
