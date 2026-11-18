'use strict';
// SAO BĂNG LÚC NỬA ĐÊM (S 211.7–242), vẽ thật trong không gian 3D để máy quay bay theo được.
// Thân sao: đầu chói xanh trắng, vệt khí ion hoá còn lơ lửng sau lưng, loang rộng và trôi theo gió.
// 212.72 (phách mạnh): một mảnh sáng tách khỏi đầu sao, lao về doanh trại rồi hãm dần như chiếc đèn trời hạ xuống,
// nguội từ trắng xanh sang vàng ấm, đuôi lửa ngắn lại theo tốc độ. Lơ lửng trên doanh trại một nhịp, đập sáng hai lần,
// 217.72 nở bung thành 19 đốm sáng ấm và kim tuyến lấp lánh rơi chậm.
// Tàn lửa và kim tuyến vẽ thành vệt nhoè theo chuyển động (không phải chấm tròn); đuôi là dải lụa sáng cong theo đường bay.
(() => {
  const SN = window.SN, M = SN.M, { clamp, mix, ease } = SN.u;
  const T_SPLIT = 212.72, T_ARR = 216.95, T_BLOOM = 217.72;
  const T_MAIN = 2.35;
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ---------- vệt nhoè (đầu sao, tàn lửa, kim tuyến, đốm sáng) ----------
  // mỗi vệt là một hình con nhộng trên màn hình nối vị trí hiện tại với vị trí một chút trước đó; độ sáng chia đều theo chiều dài
  const STREAK_V = `
  attribute vec4 iA;   // vị trí hiện tại, bán kính (m)
  attribute vec4 iB;   // vị trí trước đó, độ sáng
  attribute vec4 iC;   // màu, loại (0 tàn/kim tuyến, 1 đốm sáng, 2 đầu sao)
  varying vec2 vQ; varying vec3 vC; varying float vI; varying float vL; varying float vR; varying float vK; varying float vBok; varying float vRR;
  void main(){
    vI = iB.w; vC = iC.rgb; vK = iC.w;
    vec4 c1 = projectionMatrix * viewMatrix * vec4(iA.xyz, 1.);
    vec4 c0 = projectionMatrix * viewMatrix * vec4(iB.xyz, 1.);
    if (vI <= 0. || c1.w < .2) { gl_Position = vec4(2., 2., 2., 1.); return; }
    vec2 h = .5 * uRes;
    vec2 s1 = c1.xy / c1.w * h, s0 = c0.xy / max(c0.w, .2) * h;
    float pxm = projectionMatrix[1][1] * h.y / c1.w;              // điểm ảnh trên một mét ở độ sâu này
    float r = iA.w * pxm;
    vBok = vK > .5 && vK < 1.5 ? smoothstep(16., 3., c1.w) : 0.;   // đốm sáng ở sát máy quay: nhoè thành vòng bokeh
    float rmin = (vK > 1.5 ? 1.6 : (vK > .5 ? 2.6 : 1.1)) * uRes.y / 900.;
    float rr = max(r, rmin);
    vI *= min(1., (r * r + .3) / (rr * rr + .3)) ;                 // nhỏ hơn một điểm ảnh: giữ đúng tổng ánh sáng
    vec2 d = s1 - s0; float L = length(d);
    L = min(L, 420. * uRes.y / 900.);
    vec2 ax = L > .01 ? d / max(length(d), 1e-4) : vec2(1., 0.), ay = vec2(-ax.y, ax.x);
    float halo = vK > 2.5 ? 3.2 : (vK > 1.5 ? 9. : (vK > .5 ? mix(4.5, 1.6, vBok) : 3.5));
    float R = min(rr * halo, (vK > 1.5 ? 110. : 60.) * uRes.y / 900.);
    if (vK > 1.5 && vK < 2.5) vI *= mix(.45, 1., smoothstep(12., 110., c1.w));    // đầu sao ở sát máy quay: bớt chói, khỏi loá thành mảng trắng
    vRR = R;
    vec2 mid = s1 - ax * L * .5;
    vec2 p = mid + ax * position.x * (L * .5 + R) + ay * position.y * R;
    vQ = vec2(position.x * (L * .5 + R), position.y * R);
    vL = L * .5; vR = rr;
    vI *= rr / (rr + L * .5);                                       // nhoè dài thì mờ đi (cùng một lượng ánh sáng)
    gl_Position = vec4(p / h * c1.w, c1.z, c1.w);
  }`;
  const STREAK_F = `
  varying vec2 vQ; varying vec3 vC; varying float vI; varying float vL; varying float vR; varying float vK; varying float vBok; varying float vRR;
  void main(){
    float dx = max(abs(vQ.x) - vL, 0.);
    float dp = length(vec2(dx, vQ.y));
    float d = dp / vR;
    float edge = smoothstep(vRR, vRR * .55, dp);                    // tắt hẳn trước mép khung vẽ (không lộ ô vuông)
    float a;
    if (vK > 2.5) a = exp(-d * d * 1.1) * 1.3 + exp(-d * 1.2) * .25;                          // vỏ sáng quanh mảnh
    else if (vK > 1.5) a = exp(-d * d * 1.6) * 5. + exp(-d * .9) * .5 + exp(-d * .28) * .06;      // đầu sao: lõi chói + quầng rộng
    else if (vK > .5) {
      float core = exp(-d * d * mix(2.2, .35, vBok)) * mix(2.4, 1.1, vBok);
      float ring = vBok * smoothstep(1.05, 1.4, d) * smoothstep(1.75, 1.45, d) * .55;
      a = core + exp(-d * .8) * .62 + ring;
    } else a = exp(-d * d * 1.8) * 3.2 + exp(-d * 1.1) * .35;
    gl_FragColor = vec4(vC * a * vI * edge, 1.);
  }`;

  // ---------- dải lụa sáng (vệt khí của thân sao, đuôi lửa của mảnh) ----------
  const RIB_V = `
  attribute vec3 aP; attribute vec3 aT; attribute float aS; attribute float aW; attribute float aI; attribute float aG; attribute float aU;
  varying float vV; varying float vI; varying float vG; varying float vU;
  void main(){
    vec4 cc = viewMatrix * vec4(aP, 1.);
    vec3 tv = mat3(viewMatrix) * aT;
    vec3 sd = cross(tv, cc.xyz); float sl = length(sd); sd = sl > 1e-6 ? sd / sl : vec3(1., 0., 0.);
    float pxm = projectionMatrix[1][1] * .5 * uRes.y / max(-cc.z, .1);
    float wpx = aW * pxm, wmin = 1.15 * uRes.y / 900.;
    float wmax = 26. * uRes.y / 900.;
    float k = max(wpx, wmin) / max(wpx, 1e-5);
    if (wpx > wmax) k = wmax / wpx;                                  // sát máy quay: giữ dải lụa mảnh, không thành mảng sáng
    float sinA = length(cross(normalize(tv + 1e-6), normalize(cc.xyz)));
    vI = aI / max(k, 1.) * smoothstep(5., 32., -cc.z) * smoothstep(.12, .55, sinA); vV = aS; vG = aG; vU = aU;
    gl_Position = projectionMatrix * vec4(cc.xyz + sd * aW * k * aS, 1.);
  }`;
  const RIB_F = `
  uniform vec3 uC0, uC1, uC2;   // màu theo tuổi: mới, giữa, cũ
  uniform float uNz, uSeed2;
  varying float vV; varying float vI; varying float vG; varying float vU;
  void main(){
    float across = exp(-vV * vV * 2.6);
    float core = exp(-vV * vV * 14.) * (1. - vG) * .8;
    float n = .55 + .9 * sat(.5 + pn(vec3(vU * uNz, uSeed2, uS * .35)) * 1.6 + pn(vec3(vU * uNz * 3.1, uSeed2 + 3.7, uS * .7)) * .7);
    vec3 c = mix(mix(uC0, uC1, sat(vG * 2.)), uC2, sat(vG * 2. - 1.));
    gl_FragColor = vec4(c * (across + core) * vI * mix(1., n, sat(vG * 3.)), 1.);
  }`;

  SN.dat.dungSaoBang = function (T, U, ctx) {
    const { camP, MA, MB, tC, Yp, hDat, cuaSo, cuaSoN } = ctx;
    // ---------- đường bay của thân sao: đường thẳng trong không gian, từ hướng sao Eta Cassiopeiae ----------
    const MA3 = add(camP, MA, 3400), MB3 = add(camP, MB, 2600);
    const mainU = (S) => { const u = clamp((S - M.BOOM) / T_MAIN, 0, 1); return u * (1.18 - 0.18 * u); };
    const mainPos = (S) => lerp3(MA3, MB3, mainU(S));
    const mainDirV = nrm(sub(MB3, MA3));
    const tEnd = M.BOOM + T_MAIN;
    function mainI(S) {
      const t = S - M.BOOM;
      if (t < 0 || S > tEnd + 0.05) return 0;
      const grow = ease(t / 0.12) * (0.7 + 0.55 * ease(t / 1.0));
      const die = S < T_SPLIT ? 1 : 1 - 0.86 * ease((S - T_SPLIT) / 1.3);
      const end = 1 - ease((S - (tEnd - 0.22)) / 0.25);
      const fl = 1 + 0.16 * Math.sin(S * 61) * Math.sin(S * 37 + 1) + 0.07 * Math.sin(S * 113 + 2);
      return grow * die * end * fl + 1.5 * Math.exp(-Math.pow((S - T_SPLIT) / 0.065, 2));
    }
    // ---------- đường bay của mảnh tách: cong Hermite từ đầu sao (giữ đà) tới trên doanh trại, đi theo độ dài cung ----------
    const W = (x, y, z) => tC(x, 0, z).map((v, k) => (k === 1 ? Yp + y : v));
    const BP = W(-4, 46, 6);
    const dirEnd = nrm(sub(W(0.35, -0.13, 1), W(0, 0, 0)).map((v, k) => (k === 1 ? -0.13 : v)));
    // hai đoạn: bổ nhào từ trên trời xuống thấp (Pm, cách trại 420 m, cao hơn sân trại 90 m) rồi lướt chậm dần về trại
    const P0 = mainPos(T_SPLIT);
    const hz = nrm([BP[0] - P0[0], 0, BP[2] - P0[2]]);
    const Pm = [BP[0] - hz[0] * 420, BP[1] + 90, BP[2] - hz[2] * 420];
    const dM = nrm(sub(BP, Pm));
    const LA = len(sub(Pm, P0)), LB = len(sub(BP, Pm));
    const herm = (A, mA, B, mB, u) => { const u2 = u * u, u3 = u2 * u; const a = 2 * u3 - 3 * u2 + 1, b = u3 - 2 * u2 + u, c = -2 * u3 + 3 * u2, d = u3 - u2; return [0, 1, 2].map((k) => a * A[k] + b * mA[k] + c * B[k] + d * mB[k]); };
    const mA0 = mainDirV.map((v) => v * LA * 0.7), mA1 = dM.map((v) => v * LA * 0.55);
    const mB0 = dM.map((v) => v * LB * 0.9), mB1 = dirEnd.map((v) => v * LB * 0.7);
    const NP = 480, PP = [], CUM = [0];
    for (let i = 0; i <= NP; i++) {
      const u = i / NP;
      PP.push(u < 0.5 ? herm(P0, mA0, Pm, mA1, u * 2) : herm(Pm, mB0, BP, mB1, u * 2 - 1));
      if (i) CUM.push(CUM[i - 1] + len(sub(PP[i], PP[i - 1])));
    }
    const LP = CUM[NP];
    function byS(s) {
      s = clamp(s, 0, LP);
      let lo = 0, hi = NP;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (CUM[m] <= s) lo = m; else hi = m; }
      const f = (s - CUM[lo]) / Math.max(1e-6, CUM[hi] - CUM[lo]);
      return lerp3(PP[lo], PP[hi], f);
    }
    // tốc độ: lao rất nhanh lúc tách, hãm mạnh dần (luỹ thừa 2.5) tới 4 m/s khi tới nơi; không có khung nào dừng hẳn
    const TF = T_ARR - T_SPLIT, Q = 2.5, VE = 4;
    const V0 = VE + (LP - VE * TF) * (Q + 1) / TF;
    const sOf = (t) => VE * t + (V0 - VE) * TF / (Q + 1) * (1 - Math.pow(1 - t / TF, Q + 1));
    function fragPos(S) {
      if (S <= T_SPLIT) return mainPos(S);
      const t = S - T_SPLIT;
      if (t < TF) return byS(sOf(t));
      const dt = t - TF;
      const d = 1.2 * dt + (VE - 1.2) * 1.8 * (1 - Math.exp(-dt / 1.8));   // trôi chậm dần, vẫn đi tiếp
      const p = add(BP, dirEnd, d);
      p[1] += Math.sin(dt * 2.6) * 0.35 * ss(0, 0.8, dt);
      return p;
    }
    const fragVel = (S) => { const a = fragPos(S - 0.004), b = fragPos(S + 0.004); return [0, 1, 2].map((k) => (b[k] - a[k]) / 0.008); };
    const fragSpeed = (S) => len(fragVel(S));
    function fragI(S) {
      if (S < T_SPLIT - 0.01) return 0;
      const v = fragSpeed(S);
      let I = ss(T_SPLIT - 0.01, T_SPLIT + 0.1, S) * (0.62 + 0.5 * clamp(v / 700, 0, 1));
      I *= 1 + 0.14 * Math.sin(S * 57) * Math.sin(S * 23 + 2) + 0.06 * Math.sin(S * 131);
      // lơ lửng: thở nhẹ, đập sáng hai lần theo nhạc rồi phồng lên
      I += 0.5 * Math.exp(-Math.pow((S - (T_BLOOM - 0.5)) / 0.07, 2)) + 0.9 * ease((S - (T_BLOOM - 0.22)) / 0.22);
      if (S > T_BLOOM) I *= Math.max(0, 1 - (S - T_BLOOM) / 0.12);
      return I;
    }
    // độ nguội: 0 trắng xanh (lúc lao nhanh) → 1 vàng ấm (lúc chậm)
    const coolOf = (S) => S < T_SPLIT ? 0 : clamp(1 - fragSpeed(S) / 900, 0, 1) * ss(T_SPLIT, T_SPLIT + 1.2, S);
    const fragCol = (S) => { const k = coolOf(S); return [mix(0.82, 1.0, k), mix(1.0, 0.8, k), mix(0.95, 0.52, k)]; };

    // ---------- 19 đốm sáng: nở từ chỗ mảnh lơ lửng, toả chậm rồi lả lướt về chỗ hạ ----------
    const MOTES = [];
    {
      let s = 77;
      const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
      const PB = fragPos(T_BLOOM), VB = fragVel(T_BLOOM);
      const targets = [[-72, 176], [-182, 268], [62, 306], [-26, 424], [-276, 150], [152, 236], [-118, 66], [-130, 560], [190, 470], [-360, 420]];
      const trai = [[-12, -15], [14, -2], [-6, 24], [10, 30], [20, 18], [-20, 6], [0, -12], [-14, 44]];   // vườn trong, sân điều lệnh, trước cổng
      const land = [];
      for (let i = 0; i < 18; i++) {
        if (i % 9 >= 5) { const q = trai[(i * 5) % trai.length], p = tC(q[0] + (r() - 0.5) * 3, 0, q[1] + (r() - 0.5) * 3); land.push([p[0], Yp + 1.2, p[2]]); continue; }
        const T0 = targets[i % targets.length];
        const a = r() * 6.283, rr = (0.15 + r() * 0.55) * 70;
        const x = T0[0] + Math.cos(a) * rr, z = -(T0[1] + Math.sin(a) * rr);
        land.push([x, hDat(x, z) + 0.6, z]);
      }
      land.push([cuaSo[0] + cuaSoN[0] * 0.35, cuaSo[1], cuaSo[2] + cuaSoN[2] * 0.35]);
      for (let i = 0; i < 19; i++) {
        const L = land[i], dist = len(sub(L, PB));
        const tLand = i === 18 ? 239.4 : clamp(T_BLOOM + 3.6 + dist / 34 + (r() - 0.5) * 1.6, 222.2, 236.8);
        // hướng toả: đều mọi phía, hơi ngửa lên như hoa nở; tốc độ nhẹ 3–9 m/s
        let dx = r() * 2 - 1, dy = r() * 2 - 1, dz = r() * 2 - 1; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
        const hue = r();
        MOTES.push({ L, tLand, sway: 2 + r() * 7, ph: r() * 6.28, fr: 0.25 + r() * 0.35, dir: [dx, dy * 0.6 + 0.25, dz], sp: 3 + r() * 6, sz: 0.85 + r() * 0.5,
          col: [1, mix(0.72, 0.84, hue), mix(0.4, 0.56, hue)], tw: 0.7 + r() * 0.8 });
      }
      MOTES.PB = PB; MOTES.VB = VB.map((v) => v * 0.5);
    }
    function moteAt(i, S, out) {
      const mo = MOTES[i], B = MOTES.PB, V = MOTES.VB;
      if (S < T_BLOOM) { out[3] = 0; return out; }
      const dt = S - T_BLOOM;
      const life = mo.tLand - T_BLOOM;
      const t = clamp(dt / life, 0, 1);
      const kV = 1.2 * (1 - Math.exp(-dt / 1.2)), kR = 1.3 * (1 - Math.exp(-dt / 1.3));
      const sx = B[0] + V[0] * kV + mo.dir[0] * mo.sp * kR, sy = B[1] + V[1] * kV + mo.dir[1] * mo.sp * kR - 0.35 * dt, sz = B[2] + V[2] * kV + mo.dir[2] * mo.sp * kR;
      const k = Math.pow(t, 1.35);
      const kk = k * k * (3 - 2 * k);
      const sw = Math.sin(dt * mo.fr * 2 + mo.ph) * mo.sway * Math.sin(Math.PI * t);
      out[0] = mix(sx, mo.L[0], kk) + sw; out[1] = mix(sy, mo.L[1], kk) + Math.sin(dt * 0.7 + mo.ph) * 1.5 * (1 - t); out[2] = mix(sz, mo.L[2], kk) + sw * 0.6;
      const flash = Math.exp(-dt * 3) * 1.4;
      out[3] = (1 + flash) * (t < 1 ? 1 : Math.exp(-(S - mo.tLand) * 3));
      return out;
    }

    // ---------- tàn lửa và kim tuyến ----------
    const SPK = [];
    {
      let s2 = 4242; const r = () => { s2 = (s2 * 16807) % 2147483647; return (s2 - 1) / 2147483646; };
      const rs = (m) => { let x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1; const l = Math.hypot(x, y, z) || 1; return [x / l * m, y / l * m, z / l * m]; };
      const vMain = (S) => { const a = mainPos(S - 0.005), b = mainPos(S + 0.005); return [0, 1, 2].map((k) => (b[k] - a[k]) / 0.01); };
      for (let i = 0; i < 26; i++) {   // thân sao bốc cháy, rụng tàn xanh trắng
        const tb = M.BOOM + 0.15 + r() * (T_MAIN - 0.35), v = vMain(tb), j = rs(30 + r() * 50);
        SPK.push({ tb, p: mainPos(tb), v: [0, 1, 2].map((k) => v[k] * 0.72 + j[k]), life: 0.3 + r() * 0.55, sz: 1.6 + r() * 1.2, c: [0.7, 1, 0.86], tau: 0.6, g: 9, tw: 0 });
      }
      for (let i = 0; i < 46; i++) {   // mảnh tách rụng tàn: dày khi còn lao nhanh, thưa dần khi chậm
        const u = Math.pow(r(), 1.7), tb = T_SPLIT + 0.06 + u * (TF + 0.4), v = fragVel(tb), sp = len(v), j = rs(6 + 0.03 * sp + r() * 10);
        const c = fragCol(tb), wr = 0.5 + 0.5 * r();
        SPK.push({ tb, p: fragPos(tb), v: [0, 1, 2].map((k) => v[k] * 0.28 + j[k]), life: 0.25 + r() * 0.5, sz: 0.05 + r() * 0.07 + 0.00012 * sp, c: [1, mix(c[1], 0.62, wr), mix(c[2], 0.3, wr)], tau: 0.4, g: 9, tw: 0 });
      }
      const PB = MOTES.PB, VB = MOTES.VB;
      for (let i = 0; i < 96; i++) {   // nở: kim tuyến vàng lấp lánh, rơi chậm như mưa sao
        const tb = T_BLOOM + r() * r() * 0.3, j = rs(3 + r() * 13);
        SPK.push({ tb, p: PB.slice(), v: [0, 1, 2].map((k) => VB[k] + j[k] + (k === 1 ? 2.5 : 0)), life: 1.6 + r() * 2.2, sz: 0.07 + r() * 0.09,
          c: [1, 0.82 + r() * 0.14, 0.5 + r() * 0.3], tau: 0.85, g: 2.4, tw: 7 + r() * 9, ph: r() * 6.28 });
      }
    }
    function sparkAt(sp, S, out) {
      const a = S - sp.tb;
      if (a < 0 || a > sp.life) { out[3] = 0; return out; }
      const e = sp.tau * (1 - Math.exp(-a / sp.tau));
      out[0] = sp.p[0] + sp.v[0] * e; out[1] = sp.p[1] + sp.v[1] * e - 0.5 * sp.g * a * a; out[2] = sp.p[2] + sp.v[2] * e;
      const k = a / sp.life;
      let I = Math.pow(1 - k, 1.5) * (1 + 1.3 * Math.exp(-a * 10));
      if (sp.tw) I *= 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(a * sp.tw + sp.ph), 3);   // kim tuyến lấp lánh
      else I *= 0.8 + 0.2 * Math.sin(a * 47 + sp.tb * 13);
      out[3] = I;
      return out;
    }

    // ---------- bộ đệm vẽ ----------
    const NI = 4 + 19 + SPK.length;
    const base = new T.PlaneGeometry(2, 2);
    const ig = new T.InstancedBufferGeometry();
    ig.index = base.index; ig.setAttribute('position', base.attributes.position);
    const iA = new Float32Array(NI * 4), iB = new Float32Array(NI * 4), iC = new Float32Array(NI * 4);
    const aA = new T.InstancedBufferAttribute(iA, 4), aB = new T.InstancedBufferAttribute(iB, 4), aC = new T.InstancedBufferAttribute(iC, 4);
    [aA, aB, aC].forEach((a) => a.setUsage(T.DynamicDrawUsage));
    ig.setAttribute('iA', aA); ig.setAttribute('iB', aB); ig.setAttribute('iC', aC);
    ig.instanceCount = NI;
    const stM = new T.ShaderMaterial({ uniforms: Object.assign({}, U), vertexShader: SN_GLSL.CHUNG + STREAK_V, fragmentShader: SN_GLSL.CHUNG + STREAK_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
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
      const m = new T.ShaderMaterial({ uniforms: Object.assign({}, U, uni), vertexShader: SN_GLSL.CHUNG + RIB_V, fragmentShader: SN_GLSL.CHUNG + RIB_F, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      const mesh = new T.Mesh(g, m); mesh.frustumCulled = false; mesh.userData.ro = 6;
      return { mesh, g, n, P, Tg, Wd, In, Ag, Uu,
        set(i, p, t, w, I, age, u) { P.set(p, i * 6); P.set(p, i * 6 + 3); Tg.set(t, i * 6); Tg.set(t, i * 6 + 3); Wd[i * 2] = Wd[i * 2 + 1] = w; In[i * 2] = In[i * 2 + 1] = I; Ag[i * 2] = Ag[i * 2 + 1] = age; Uu[i * 2] = Uu[i * 2 + 1] = u; },
        done() { ['aP', 'aT', 'aW', 'aI', 'aG', 'aU'].forEach((k) => { g.attributes[k].needsUpdate = true; }); } };
    }
    const V3 = (a, b, c) => new T.Vector3(a, b, c);
    const train = ribbon(96, { uC0: { value: V3(0.85, 1, 0.95) }, uC1: { value: V3(0.3, 1, 0.55) }, uC2: { value: V3(0.3, 0.42, 0.95) }, uNz: { value: 7 }, uSeed2: { value: 1.3 } });
    const tail = ribbon(80, { uC0: { value: V3(1, 0.86, 0.62) }, uC1: { value: V3(1, 0.55, 0.2) }, uC2: { value: V3(0.75, 0.18, 0.12) }, uNz: { value: 1.6 }, uSeed2: { value: 5.1 } });
    const group = new T.Group();
    group.add(train.mesh); group.add(tail.mesh); group.add(streaks);

    const WIND = [5.5, 0.4, 2.2];
    const tmp4 = [0, 0, 0, 0], tmp4b = [0, 0, 0, 0];
    function cap(S, camPos) {
      // vệt khí thân sao: từ lúc loé tới đầu sao hiện tại; điểm nào sinh ra càng lâu càng loang rộng, mờ, trôi theo gió
      const te1 = Math.min(S, tEnd - 0.02);
      const onTrain = S > M.BOOM + 0.01 && S < 226;
      for (let i = 0; i <= train.n; i++) {
        if (!onTrain) { train.set(i, [0, -999, 0], [1, 0, 0], 0, 0, 1, 0); continue; }
        const f = i / train.n;
        const te = M.BOOM + (te1 - M.BOOM) * Math.pow(f, 0.85);
        const age = Math.max(0, S - te);
        const p = add(mainPos(te), WIND, age);
        const tw = Math.sin(te * 2.1 + 0.7) * 0.7 + Math.sin(te * 4.3 + 2.1) * 0.3;
        p[1] += tw * age * 3.5; p[0] += Math.cos(te * 1.7) * age * 2.5;
        const hp = mainI(te) / 1.6;
        const I = (Math.exp(-age / 0.3) * 1.15 + 0.2 * Math.exp(-age / 1.9)) * (0.35 + 0.65 * Math.min(1, hp)) * ss(0, 0.05, S - te + 0.001) * 3.2;
        train.set(i, p, mainDirV, 3 + age * 13, I * (1 - 0.55 * clamp((age - 1.5) / 3, 0, 1)), clamp(age / 3.2, 0, 1), te * 3.0);
      }
      train.done();
      // đuôi lửa của mảnh: nửa giây đường vừa đi, nóng ở gần đầu, nguội và tản dần
      const fI = fragI(S);
      for (let i = 0; i <= tail.n; i++) {
        if (fI <= 0.001) { tail.set(i, [0, -999, 0], [1, 0, 0], 0, 0, 1, 0); continue; }
        const f = i / tail.n;
        const age = 0.55 * f * f;
        const te = Math.max(T_SPLIT, S - age);
        const p = fragPos(te), vv = fragVel(te), sp = len(vv);
        const a = S - te;
        const wob = Math.sin(te * 31) * 0.3 * a * Math.min(1, sp / 200);
        p[1] += wob;
        const I = Math.exp(-a / 0.15) * fragI(te) * (0.35 + 0.65 * Math.min(1, sp / 300)) * 5 * clamp(len(sub(p, camPos)) / 60, 0.35, 1);
        tail.set(i, p, nrm(vv), 0.3 + a * 5.5 + Math.min(1.2, sp * 0.0015), I, clamp(a / 0.4, 0, 1), te * 3);
      }
      tail.done();
      // đầu sao, đầu mảnh, chớp nở
      const mI = mainI(S), mp = mainPos(S), mq = mainPos(S - 0.006);
      setI(0, mp, mq, 7 + 4 * mI, mI * 9, [0.86, 1, 0.97], 2);
      const fp = fragPos(S), fq = fragPos(S - 0.006), fc = fragCol(S);
      const gan = clamp(len(sub(fp, camPos)) / 70, 0.3, 1);                    // ở sát máy quay thì bớt chói (khỏi loá trắng cả khung)
      setI(1, fp, fq, 0.2 + 0.08 * fI, fI * 5.5 * gan, [mix(fc[0], 1, 0.5), mix(fc[1], 1, 0.5), mix(fc[2], 1, 0.5)], 2);   // lõi trắng nóng
      const fr = fragPos(S - 0.016), k1 = coolOf(S);
      setI(3, fp, fr, 0.5 + 0.2 * fI, fI * 0.75 * mix(0.6, 1, gan), [1, mix(0.78, 0.62, k1), mix(0.5, 0.3, k1)], 3);    // vỏ sáng vàng cam, kéo về sau
      const db = S - T_BLOOM;
      const bl = db > -0.05 && db < 1.2 ? Math.exp(-Math.max(db, 0) * 3.5) * ss(-0.05, 0.05, db) : 0;
      setI(2, MOTES.PB, MOTES.PB, 1.2 + 4.5 * ease(Math.max(db, 0) / 0.5), bl * 1.1, [1, 0.84, 0.6], 1);
      // đốm sáng
      for (let i = 0; i < 19; i++) {
        moteAt(i, S, tmp4); moteAt(i, S - 0.02, tmp4b);
        const mo = MOTES[i];
        const grow = S < T_BLOOM ? 0 : 0.35 + 0.65 * ease((S - T_BLOOM) / 1.3);
        const tw = 1 + 0.12 * Math.sin(S * mo.tw * 2.1 + mo.ph) + 0.05 * Math.sin(S * 7.3 + mo.ph * 3);
        setI(4 + i, tmp4, tmp4b[3] > 0 ? tmp4b : tmp4, 0.42 * mo.sz * grow, tmp4[3] * tw * 1.4, mo.col, 1);
      }
      // tàn lửa, kim tuyến
      for (let i = 0; i < SPK.length; i++) {
        const sp = SPK[i];
        sparkAt(sp, S, tmp4); sparkAt(sp, S - 0.012, tmp4b);
        setI(4 + 19 + i, tmp4, tmp4b[3] > 0 ? tmp4b : tmp4, sp.sz, tmp4[3] * 1.4, sp.c, 0);
      }
      aA.needsUpdate = true; aB.needsUpdate = true; aC.needsUpdate = true;
      // ánh sáng hắt xuống cảnh vật
      U.uFP.value.set(fp[0], fp[1], fp[2], fI * (6 + 14 * coolOf(S)) + bl * 60);
      const md = nrm(sub(mp, camPos));
      U.uMetP.value.set(md[0], md[1], md[2]);
      U.uMet.value = mI * 0.42 + bl * 0.25;
      for (let i = 0; i < 19; i++) {
        moteAt(i, S, tmp4);
        U.uMP.value[i].set(tmp4[0], tmp4[1], tmp4[2]); U.uMI.value[i] = tmp4[3] * 0.6;
      }
    }
    return { group, cap, mainPos, fragPos, fragVel, fragI, MOTES, moteAt, T_SPLIT, T_ARR, T_BLOOM, BP, PB: MOTES.PB };
  };
})();
