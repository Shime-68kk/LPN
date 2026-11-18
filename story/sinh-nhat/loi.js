'use strict';
// LÕI của màn trình diễn Chương 23: trình vẽ WebGL2, đồng hồ theo nhạc, quản lý cảnh, hậu kỳ điện ảnh, tự hạ độ nét.
// Mọi chuyển động là hàm thuần của S (giây trong file nhạc am/nhac.mp3) nên tua, xem lại, quay video đều khớp.
//   ?S=123      đứng hình ở giây 123 (không nhạc), để soi từng cảnh
//   ?tu=100     phát từ giây 100
//   ?q=0.7      ghim độ nét (0.35..1)
//   ?do=1       dòng đo tốc độ, CHỈ trong mạng nhà
(() => {
  const Q = new URLSearchParams(location.search);
  const NHA = /^(localhost|127\.0\.0\.1|192\.168\.)/.test(location.hostname);
  const M = { SEAM: 181.7, DROP: 185.2, BOOM: 211.7, WALL: 244.4, END: 259.82 };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const ease3 = (t) => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  const io = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const ramp = (S, a, b) => clamp((S - a) / (b - a), 0, 1);
  const SN = window.SN = { M, Q, NHA, worlds: [], u: { clamp, mix, ease, ease3, io, ramp } };

  // Đường cong qua các mốc [S, v0, v1, ...]: Catmull-Rom theo thời gian, hai đầu giữ nguyên
  SN.duong = function (keys) {
    const n = keys.length, dim = keys[0].length - 1;
    const out = new Array(dim).fill(0);
    return function (S) {
      if (S <= keys[0][0]) { for (let d = 0; d < dim; d++) out[d] = keys[0][d + 1]; return out; }
      if (S >= keys[n - 1][0]) { for (let d = 0; d < dim; d++) out[d] = keys[n - 1][d + 1]; return out; }
      let i = 0; while (i < n - 2 && S > keys[i + 1][0]) i++;
      const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
      const t = (S - k1[0]) / (k2[0] - k1[0]), t2 = t * t, t3 = t2 * t;
      const d1 = k2[0] - k1[0];
      for (let d = 1; d <= dim; d++) {
        const m1 = (k2[d] - k0[d]) / Math.max(1e-6, k2[0] - k0[0]) * d1;
        const m2 = (k3[d] - k1[d]) / Math.max(1e-6, k3[0] - k1[0]) * d1;
        out[d - 1] = (2 * t3 - 3 * t2 + 1) * k1[d] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * k2[d] + (t3 - t2) * m2;
      }
      return out;
    };
  };

  let T = null, renderer = null, cvs = null, scene = null, cam3 = null, quadGeo = null, noise3 = null;
  let W = 0, H = 0, basePR = 1, quality = 1, pinQ = parseFloat(Q.get('q')) || 0;
  let ready = false, failed = false, started = false;
  let DT = false; try { DT = matchMedia('(pointer: coarse)').matches; } catch (e) { /* bỏ qua */ }
  SN.DT = DT;
  const DO = Q.get('do') === '1' && NHA;

  // ================= HẬU KỲ =================
  const P = {};
  function rt(w, h, opt) {
    const r = new T.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), Object.assign({ type: T.HalfFloatType, format: T.RGBAFormat, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false, stencilBuffer: false }, opt || {}));
    r.texture.generateMipmaps = false; return r;
  }
  function passMat(frag, uniforms, blend) {
    const m = new T.ShaderMaterial({ uniforms, vertexShader: SN_GLSL.QUAD_V, fragmentShader: frag, depthTest: false, depthWrite: false });
    if (blend === 'add') { m.transparent = true; m.blending = T.CustomBlending; m.blendSrc = T.OneFactor; m.blendDst = T.OneFactor; m.blendEquation = T.AddEquation; }
    return m;
  }
  const PRE = `uniform sampler2D tS; uniform vec2 uTx; uniform float uThr; in vec2 vUv;
  vec3 tap(vec2 o){ return texture(tS, vUv + o * uTx).rgb; }
  void main(){ // lọc 13 điểm (kiểu Call of Duty) + cắt ngưỡng mềm, chống nháy điểm sáng đơn lẻ
    vec3 a = tap(vec2(-2,-2)), b = tap(vec2(0,-2)), c = tap(vec2(2,-2)), d = tap(vec2(-1,-1)), e = tap(vec2(1,-1)), f = tap(vec2(-2,0)), g = tap(vec2(0,0));
    vec3 h = tap(vec2(2,0)), i = tap(vec2(-1,1)), j = tap(vec2(1,1)), k = tap(vec2(-2,2)), l = tap(vec2(0,2)), m = tap(vec2(2,2));
    vec3 s = (d + e + i + j) * .125 + (a + b + f + g) * .03125 + (b + c + g + h) * .03125 + (f + g + k + l) * .03125 + (g + h + l + m) * .03125;
    float br = max(s.r, max(s.g, s.b));
    float kk = max(br - uThr, 0.); kk = kk * kk / (kk + uThr * .5 + 1e-4);
    s *= max(kk, br - uThr) / max(br, 1e-4);
    gl_FragColor = vec4(min(s, vec3(60.)), 1.);
  }`;
  const DOWN = `uniform sampler2D tS; uniform vec2 uTx; in vec2 vUv;
  vec3 tap(vec2 o){ return texture(tS, vUv + o * uTx).rgb; }
  void main(){
    vec3 a = tap(vec2(-2,-2)), b = tap(vec2(0,-2)), c = tap(vec2(2,-2)), d = tap(vec2(-1,-1)), e = tap(vec2(1,-1)), f = tap(vec2(-2,0)), g = tap(vec2(0,0));
    vec3 h = tap(vec2(2,0)), i = tap(vec2(-1,1)), j = tap(vec2(1,1)), k = tap(vec2(-2,2)), l = tap(vec2(0,2)), m = tap(vec2(2,2));
    gl_FragColor = vec4((d + e + i + j) * .125 + (a + b + f + g) * .03125 + (b + c + g + h) * .03125 + (f + g + k + l) * .03125 + (g + h + l + m) * .03125, 1.);
  }`;
  const UP = `uniform sampler2D tS; uniform vec2 uTx; uniform float uK; in vec2 vUv;
  void main(){ // lều 9 điểm
    vec3 s = texture(tS, vUv + vec2(-1,-1) * uTx).rgb + texture(tS, vUv + vec2(1,-1) * uTx).rgb + texture(tS, vUv + vec2(-1,1) * uTx).rgb + texture(tS, vUv + vec2(1,1) * uTx).rgb;
    s += 2. * (texture(tS, vUv + vec2(0,-1) * uTx).rgb + texture(tS, vUv + vec2(0,1) * uTx).rgb + texture(tS, vUv + vec2(-1,0) * uTx).rgb + texture(tS, vUv + vec2(1,0) * uTx).rgb);
    s += 4. * texture(tS, vUv).rgb;
    gl_FragColor = vec4(s / 16. * uK, 1.);
  }`;
  const STREAK = `uniform sampler2D tS; uniform vec2 uTx; uniform float uStep; in vec2 vUv;
  void main(){ // vệt loé ống kính dẹt: nhoè ngang rất dài
    vec3 s = vec3(0.); float wsum = 0.;
    for (int i = -6; i <= 6; i++) { float fi = float(i); float w = exp(-fi * fi / 18.); s += texture(tS, vUv + vec2(fi * uStep * uTx.x, 0.)).rgb * w; wsum += w; }
    gl_FragColor = vec4(s / wsum, 1.);
  }`;
  const FINAL = `uniform sampler2D tScene; uniform sampler2D tBloom; uniform sampler2D tStreak;
  uniform float uExp, uBloom, uStreakK, uSat, uCon, uVig, uGrain, uCA, uBars, uFade, uWhite, uTime, uWarm, uZoomBlur;
  uniform vec3 uLift, uGain, uStreakC; uniform vec2 uZC; uniform vec2 uResF; in vec2 vUv;
  float hh(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  vec3 aces(vec3 x){ return clamp(x * (2.51 * x + .03) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  vec3 scn(vec2 uv){
    // lệch màu ở mép (ống kính), nhoè hướng tâm khi lao nhanh
    vec2 dc = uv - .5; float r2 = dot(dc, dc);
    vec2 o = dc * r2 * uCA;
    vec3 c = vec3(texture(tScene, uv - o).r, texture(tScene, uv).g, texture(tScene, uv + o).b);
    if (uZoomBlur > .001) {
      vec2 dz = (uv - uZC) * uZoomBlur * .06; vec3 acc = c;
      for (int i = 1; i < 9; i++) { float fi = float(i); acc += texture(tScene, uv - dz * fi).rgb * (1. - fi / 10.); }
      c = acc / 5.4;
    }
    return c;
  }
  void main(){
    vec2 uv = vUv;
    vec3 c = scn(uv) + texture(tBloom, uv).rgb * uBloom + texture(tStreak, uv).rgb * uStreakC * uStreakK;
    c *= uExp;
    c += uWhite * vec3(.9, .95, 1.);
    c = aces(c);
    c = pow(c, vec3(1. / 2.2));
    // chỉnh màu: nâng vùng tối, ép vùng sáng, tương phản, độ bão hoà
    c = c * uGain + uLift * (1. - c);
    c = mix(vec3(.5), c, uCon);
    float l = dot(c, vec3(.299, .587, .114));
    c = mix(vec3(l), c, uSat);
    c *= mix(vec3(1.), vec3(1.04, 1., .95), uWarm);
    vec2 q = (uv - .5) * vec2(uResF.x / uResF.y, 1.);
    c *= 1. - uVig * pow(length(q) * .82, 2.4);
    float g = hh(uv * uResF + fract(uTime) * 917.) - .5;
    c += g * uGrain * (1.15 - l);
    c = clamp(c, 0., 1.);
    // dải đen trên dưới kiểu phim màn ảnh rộng
    float bar = uBars * .5 * (1. - (uResF.y > 0. ? min(1., (uResF.x / uResF.y) / 2.2) : 1.)) ;
    float yb = min(uv.y, 1. - uv.y);
    c *= smoothstep(bar - .0015, bar + .0015, yb);
    gl_FragColor = vec4(c * uFade, 1.);
  }`;
  function buildPost() {
    P.scene = rt(1, 1, { depthBuffer: true });
    P.down = []; P.mats = {};
    for (let i = 0; i < 6; i++) P.down.push(rt(1, 1));
    P.s0 = rt(1, 1); P.s1 = rt(1, 1);
    P.mPre = passMat(PRE, { tS: { value: null }, uTx: { value: new T.Vector2() }, uThr: { value: 1.0 } });
    P.mDown = passMat(DOWN, { tS: { value: null }, uTx: { value: new T.Vector2() } });
    P.mUp = passMat(UP, { tS: { value: null }, uTx: { value: new T.Vector2() }, uK: { value: 1 } }, 'add');
    P.mStreak = passMat(STREAK, { tS: { value: null }, uTx: { value: new T.Vector2() }, uStep: { value: 1 } });
    P.fin = passMat(FINAL, {
      tScene: { value: null }, tBloom: { value: null }, tStreak: { value: null },
      uExp: { value: 1 }, uBloom: { value: 0.9 }, uStreakK: { value: 0.5 }, uSat: { value: 1 }, uCon: { value: 1 }, uVig: { value: 0.35 }, uGrain: { value: 0.03 },
      uCA: { value: 0.012 }, uBars: { value: 1 }, uFade: { value: 1 }, uWhite: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 0 }, uZoomBlur: { value: 0 },
      uLift: { value: new T.Vector3(0.012, 0.014, 0.022) }, uGain: { value: new T.Vector3(1, 1, 1) }, uStreakC: { value: new T.Vector3(0.45, 0.62, 1.0) },
      uZC: { value: new T.Vector2(0.5, 0.5) }, uResF: { value: new T.Vector2(1, 1) },
    });
    P.quad = new T.Mesh(quadGeo, P.mPre); P.quad.frustumCulled = false;
    P.qs = new T.Scene(); P.qs.add(P.quad);
    P.oc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  function sizePost() {
    P.scene.setSize(W, H);
    let w = W >> 1, h = H >> 1;
    for (let i = 0; i < 6; i++) { P.down[i].setSize(Math.max(1, w), Math.max(1, h)); w >>= 1; h >>= 1; }
    P.s0.setSize(Math.max(1, W >> 2), Math.max(1, H >> 3)); P.s1.setSize(Math.max(1, W >> 2), Math.max(1, H >> 3));
    P.fin.uniforms.uResF.value.set(W, H);
  }
  function blit(mat, target) { P.quad.material = mat; renderer.setRenderTarget(target); renderer.render(P.qs, P.oc); }
  SN.post = { grade: null }; // cảnh đặt: SN.post.set({...})
  const GR = { exp: 1, bloom: 0.9, thr: 1.0, streak: 0.45, sat: 1, con: 1, vig: 0.35, grain: 0.03, ca: 0.012, bars: 1, fade: 1, white: 0, warm: 0, zoom: 0, zc: [0.5, 0.5], lift: [0.012, 0.014, 0.022], gain: [1, 1, 1], sc: [0.45, 0.62, 1.0] };
  function postRender() {
    const u = P.fin.uniforms, g = GR;
    // ánh sáng lan: lọc + thu nhỏ 6 tầng rồi phóng ngược cộng dồn
    P.mPre.uniforms.tS.value = P.scene.texture; P.mPre.uniforms.uTx.value.set(1 / W, 1 / H); P.mPre.uniforms.uThr.value = g.thr;
    blit(P.mPre, P.down[0]);
    for (let i = 1; i < 6; i++) { const s = P.down[i - 1]; P.mDown.uniforms.tS.value = s.texture; P.mDown.uniforms.uTx.value.set(1 / s.width, 1 / s.height); blit(P.mDown, P.down[i]); }
    for (let i = 5; i > 0; i--) { const s = P.down[i]; P.mUp.uniforms.tS.value = s.texture; P.mUp.uniforms.uTx.value.set(1 / s.width, 1 / s.height); P.mUp.uniforms.uK.value = 1; blit(P.mUp, P.down[i - 1]); }
    // vệt loé ngang từ tầng 1/4
    const src = P.down[1];
    P.mStreak.uniforms.tS.value = src.texture; P.mStreak.uniforms.uTx.value.set(1 / P.s0.width, 1 / P.s0.height); P.mStreak.uniforms.uStep.value = 1.5; blit(P.mStreak, P.s0);
    P.mStreak.uniforms.tS.value = P.s0.texture; P.mStreak.uniforms.uStep.value = 5; blit(P.mStreak, P.s1);
    P.mStreak.uniforms.tS.value = P.s1.texture; P.mStreak.uniforms.uStep.value = 15; blit(P.mStreak, P.s0);
    u.tScene.value = P.scene.texture; u.tBloom.value = P.down[0].texture; u.tStreak.value = P.s0.texture;
    u.uExp.value = g.exp; u.uBloom.value = g.bloom; u.uStreakK.value = g.streak; u.uSat.value = g.sat; u.uCon.value = g.con; u.uVig.value = g.vig; u.uGrain.value = g.grain;
    u.uCA.value = g.ca; u.uBars.value = g.bars; u.uFade.value = g.fade; u.uWhite.value = g.white; u.uWarm.value = g.warm; u.uZoomBlur.value = g.zoom;
    u.uZC.value.set(g.zc[0], g.zc[1]); u.uLift.value.set(g.lift[0], g.lift[1], g.lift[2]); u.uGain.value.set(g.gain[0], g.gain[1], g.gain[2]); u.uStreakC.value.set(g.sc[0], g.sc[1], g.sc[2]);
    u.uTime.value = (u.uTime.value + 0.6180339) % 1;
    blit(P.fin, null);
  }

  // ================= CẢNH =================
  // Mỗi cảnh: { ten, tu, den, lop, a(S) độ hiện, cap(S) cập nhật, mesh (mặt phẳng phủ màn hình) hoặc group (vật thể 3D), may(S) máy quay 3D }
  SN.uChung = null;
  SN.quad = function (frag, uniforms, opt) {
    opt = opt || {};
    const u = Object.assign({}, SN.uChung, { uA: { value: 1 }, uCP: { value: new T.Vector3() }, uCR: { value: new T.Matrix3() }, uTF: { value: 0.5 }, uAsp: { value: 1 } }, uniforms || {});
    const m = new T.ShaderMaterial({ uniforms: u, vertexShader: SN_GLSL.QUAD_V, fragmentShader: SN_GLSL.CHUNG + SN_GLSL.TIA + frag, depthTest: false, depthWrite: false, transparent: true });
    m.blending = T.CustomBlending; m.blendSrc = T.OneFactor; m.blendDst = T.OneMinusSrcAlphaFactor; m.blendEquation = T.AddEquation;
    const mesh = new T.Mesh(quadGeo, m); mesh.frustumCulled = false; mesh.visible = false;
    if (!opt.low) scene.add(mesh);
    return mesh;
  };
  // vẽ cảnh nặng (khối khí) ở độ phân giải thấp rồi phóng lên
  SN.lowres = function (mesh, scale) {
    const L = { mesh, scale, rt: rt(1, 1), sc: new T.Scene() };
    L.sc.add(mesh);
    const up = new T.ShaderMaterial({ uniforms: { tL: { value: L.rt.texture }, uA: { value: 1 }, uTx: { value: new T.Vector2() } }, vertexShader: SN_GLSL.QUAD_V,
      fragmentShader: `uniform sampler2D tL; uniform float uA; uniform vec2 uTx; in vec2 vUv;
      void main(){ vec4 c = texture(tL, vUv) * .5 + (texture(tL, vUv + vec2(uTx.x, 0.)) + texture(tL, vUv - vec2(uTx.x, 0.)) + texture(tL, vUv + vec2(0., uTx.y)) + texture(tL, vUv - vec2(0., uTx.y))) * .125;
        gl_FragColor = c * uA; }`, depthTest: false, depthWrite: false, transparent: true });
    up.blending = T.CustomBlending; up.blendSrc = T.OneFactor; up.blendDst = T.OneMinusSrcAlphaFactor;
    L.upMesh = new T.Mesh(quadGeo, up); L.upMesh.frustumCulled = false; L.upMesh.visible = false; scene.add(L.upMesh);
    L.rt.setSize(Math.max(1, W * scale | 0), Math.max(1, H * scale | 0)); up.uniforms.uTx.value.set(1 / L.rt.width, 1 / L.rt.height);
    SN.lows.push(L); return L;
  };
  SN.lows = [];
  SN.them = function (w) { w.lop = w.lop || 0; SN.worlds.push(w); return w; };
  // đặt máy quay cho mặt phẳng phủ màn hình
  const _f = [0, 0, 0], _r = [0, 0, 0], _u = [0, 0, 0];
  SN.camQuad = function (mat, pos, tgt, up, fovDeg) {
    const u = mat.uniforms;
    let fx = tgt[0] - pos[0], fy = tgt[1] - pos[1], fz = tgt[2] - pos[2]; let l = Math.hypot(fx, fy, fz) || 1; fx /= l; fy /= l; fz /= l;
    let rx = fy * up[2] - fz * up[1], ry = fz * up[0] - fx * up[2], rz = fx * up[1] - fy * up[0]; l = Math.hypot(rx, ry, rz) || 1; rx /= l; ry /= l; rz /= l;
    const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
    u.uCP.value.set(pos[0], pos[1], pos[2]);
    u.uCR.value.set(rx, ux, -fx, ry, uy, -fy, rz, uz, -fz);
    u.uTF.value = Math.tan(fovDeg * Math.PI / 360); u.uAsp.value = W / Math.max(1, H);
    _f[0] = fx; _f[1] = fy; _f[2] = fz; _r[0] = rx; _r[1] = ry; _r[2] = rz; _u[0] = ux; _u[1] = uy; _u[2] = uz;
    return { f: _f, r: _r, u: _u };
  };
  // chiếu một điểm 3D (theo máy quay vừa đặt) ra toạ độ màn hình 0..1
  SN.chieu = function (mat, p, out) {
    const u = mat.uniforms, c = u.uCP.value, e = u.uCR.value.elements;
    const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z;
    const x = dx * e[0] + dy * e[1] + dz * e[2], y = dx * e[3] + dy * e[4] + dz * e[5], z = -(dx * e[6] + dy * e[7] + dz * e[8]);
    out = out || [0, 0, 0];
    if (z <= 1e-6) { out[0] = -9; out[1] = -9; out[2] = z; return out; }
    out[0] = 0.5 + 0.5 * x / (z * u.uTF.value * u.uAsp.value); out[1] = 0.5 + 0.5 * y / (z * u.uTF.value); out[2] = z; return out;
  };
  // mỗi cảnh trộn thông số hậu kỳ của mình theo độ hiện (cảnh vẽ sau, hiện rõ hơn thì chiếm ưu thế)
  const GR0 = JSON.parse(JSON.stringify(GR));
  SN.gradeReset = () => { for (const k in GR0) GR[k] = Array.isArray(GR0[k]) ? GR0[k].slice() : GR0[k]; };
  SN.gradeMix = (p, a) => {
    for (const k in p) {
      if (Array.isArray(p[k])) for (let i = 0; i < p[k].length; i++) GR[k][i] = mix(GR[k][i], p[k][i], a);
      else GR[k] = mix(GR[k], p[k], a);
    }
  };
  SN.cam3 = () => cam3;
  SN.scene = () => scene;
  SN.renderer = () => renderer;
  SN.size = () => [W, H];
  SN.grade = GR;

  // ================= ĐỒNG HỒ =================
  let audio = null, playing = false, perf0 = 0, s0 = 0, endedAt = 0, fixS = Q.has('S') ? parseFloat(Q.get('S')) : NaN;
  const START = parseFloat(Q.get('tu')) || 0;
  function clock() {
    const now = performance.now();
    if (!isNaN(fixS)) return fixS;
    if (!playing) return s0;
    if (endedAt) return M.END + (now - endedAt) / 1000;
    let s = s0 + (now - perf0) / 1000;
    const a = audio.currentTime;
    if (!audio.paused && a > 0) {
      const err = a - s;
      if (Math.abs(err) > 0.3) { s0 = a; perf0 = now; s = a; } else { s0 += err * 0.04; s += err * 0.04; }
    } else if (audio.paused && !audio.ended) { s0 = a; perf0 = now; s = a; }
    return s;
  }
  SN.clock = clock;
  SN.setFix = (s) => { fixS = s; };

  // ================= KHỞI ĐỘNG =================
  function resize() {
    if (!renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    basePR = Math.min(window.devicePixelRatio || 1, DT ? 1.5 : 1.75);
    const pr = basePR * quality;
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
    W = Math.floor(w * pr); H = Math.floor(h * pr);
    sizePost();
    for (const L of SN.lows) { L.rt.setSize(Math.max(1, W * L.scale | 0), Math.max(1, H * L.scale | 0)); L.upMesh.material.uniforms.uTx.value.set(1 / L.rt.width, 1 / L.rt.height); }
    cam3.aspect = w / h; cam3.updateProjectionMatrix();
    SN.uChung.uRes.value.set(W, H);
  }
  SN.resize = () => resize();

  function setupWorlds(S) {
    // độ hiện, thứ tự vẽ, máy quay 3D
    let geoWorld = null;
    const act = [];
    for (const w of SN.worlds) {
      const on = S >= w.tu && S < w.den;
      const a = on ? (w.a ? w.a(S) : 1) : 0;
      w.on = on && a > 0.001;
      if (w.mesh) w.mesh.visible = false;
      if (w.low) w.low.upMesh.visible = false;
      if (w.group) w.group.visible = false;
      if (w.on) act.push([w, a]);
    }
    act.sort((x, y) => x[0].lop - y[0].lop);
    let order = 0;
    for (const [w, a] of act) {
      w.aNow = a;
      if (w.cap) w.cap(S, a);
      if (w.group) { w.group.visible = true; geoWorld = w; w.group.traverse((o) => { if (o.isMesh || o.isPoints) o.renderOrder = order * 10 + (o.userData.ro || 0); }); }
      if (w.mesh) { w.mesh.visible = true; w.mesh.renderOrder = order * 10 - 5; w.mesh.material.uniforms.uA.value = a; }
      if (w.low) { w.low.upMesh.visible = true; w.low.upMesh.renderOrder = order * 10 - 5; w.low.upMesh.material.uniforms.uA.value = a; w.low.mesh.visible = true; w.low.mesh.material.uniforms.uA.value = 1; }
      order++;
    }
    if (geoWorld && geoWorld.may) geoWorld.may(S, cam3);
    return act;
  }
  let lastT = 0, frameMs = 16, slowN = 0, thuNet = 0, khoaNet = false, msTruoc = 0, needResize = false;
  let doEl = null, doN = 0, doT = 0;
  function renderAt(S) {
    SN.uChung.uS.value = S;
    SN.uChung.uPxA.value = 2 * Math.tan(cam3.fov * Math.PI / 360) / Math.max(1, H);
    SN.gradeReset();
    SN.beforeFrame && SN.beforeFrame(S);
    setupWorlds(S);
    SN.afterSetup && SN.afterSetup(S);
    for (const L of SN.lows) {
      if (!L.upMesh.visible) continue;
      renderer.setRenderTarget(L.rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(L.sc, P.oc);
    }
    renderer.setRenderTarget(P.scene); renderer.setClearColor(0x000000, 1); renderer.clear();
    renderer.render(scene, cam3);
    postRender();
  }
  SN.renderAt = renderAt;
  function loop() {
    requestAnimationFrame(loop);
    if (!ready) return;
    const now = performance.now(), gap = now - lastT;
    if (gap < 1000 / 62) return; // màn 120 Hz cũng chỉ vẽ 60 khung/giây cho mát máy
    lastT = now;
    if (needResize) { needResize = false; resize(); }
    const S = clock();
    try { renderAt(S); SN.chu && SN.chu.cap(S, playing || !isNaN(fixS)); } catch (e) { console.error(e); failed = true; ready = false; SN.fallback && SN.fallback(e); return; }
    if (DO) { doN++; if (now - doT > 500) { doEl.textContent = 'S ' + S.toFixed(2) + ' · ' + Math.round(doN * 1000 / (now - doT)) + ' khung/giây · nét ' + Math.round(quality * 100) + '% · ' + W + '×' + H; doN = 0; doT = now; } }
    if (!pinQ && playing && gap > 0 && gap < 250) {
      frameMs = frameMs * 0.94 + gap * 0.06;
      const lim = 1000 / 60 * 1.3;
      if (khoaNet) { /* máy bị trình duyệt ghìm tốc độ (tiết kiệm pin): hạ nét vô ích */ }
      else if (thuNet > 0) { if (--thuNet === 0) { if (frameMs > msTruoc * 0.88) { quality = Math.min(1, quality + 0.15); khoaNet = true; needResize = true; } slowN = 0; } }
      else if (frameMs > lim && ++slowN > 45 && quality > 0.5) { msTruoc = frameMs; thuNet = 70; quality = Math.max(0.5, quality - 0.15); slowN = 0; needResize = true; }
      else if (frameMs < 1000 / 60 * 1.06 && quality < 1 && ++slowN > 240) { quality = Math.min(1, quality + 0.1); slowN = 0; needResize = true; }
      else if (frameMs <= lim) slowN = Math.max(0, slowN - 1);
    }
  }
  // vẽ thử mọi cảnh một lần khi còn che màn hình: trình duyệt biên dịch shader xong trước khi phát, khỏi giật
  function warm(done) {
    const L = SN.worlds.map((w) => w.warmS != null ? w.warmS : (w.tu + w.den) / 2);
    let i = 0;
    const step = () => {
      try { renderAt(L[i]); } catch (e) { console.error(e); }
      SN.chu && SN.chu.tienDo && SN.chu.tienDo(0.55 + 0.4 * (i + 1) / L.length);
      if (++i < L.length) setTimeout(step, 30); else done();
    };
    step();
  }
  function start() {
    T = SN.T = window.THREE;
    cvs = document.getElementById('cv');
    renderer = new T.WebGLRenderer({ canvas: cvs, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    if (!renderer.capabilities.isWebGL2) throw new Error('cần WebGL2');
    T.ColorManagement.enabled = false; renderer.outputColorSpace = T.LinearSRGBColorSpace;
    renderer.autoClear = false;
    scene = new T.Scene();
    cam3 = new T.PerspectiveCamera(50, 1, 0.05, 2e6);
    quadGeo = new T.PlaneGeometry(2, 2);
    noise3 = SN_GLSL.noiseTexture(T);
    SN.uChung = { uN3: { value: noise3 }, uS: { value: 0 }, uRes: { value: new T.Vector2(1, 1) }, uPxA: { value: 0.001 } };
    if (pinQ) quality = clamp(pinQ, 0.35, 1); else if (DT) quality = 0.85;
    buildPost();
    resize();
    window.addEventListener('resize', () => { needResize = true; });
    cvs.addEventListener('webglcontextlost', (e) => { e.preventDefault(); failed = true; ready = false; SN.fallback && SN.fallback(new Error('mất ngữ cảnh đồ hoạ')); });
    if (DO) { doEl = document.createElement('div'); doEl.style.cssText = 'position:fixed;left:8px;top:6px;z-index:50;color:#fff;font:12px monospace;background:rgba(0,0,0,.55);padding:3px 7px;border-radius:5px;pointer-events:none'; document.body.appendChild(doEl); }
    // dựng các cảnh (các tệp c-*.js đăng ký hàm dựng)
    for (const f of SN.dung) f(T);
    SN.chu && SN.chu.tienDo && SN.chu.tienDo(0.5);
  }
  SN.dung = [];
  SN.phat = function () { // bấm bắt đầu
    if (started) return; started = true;
    if (!isNaN(fixS)) return;
    audio.currentTime = START;
    const p = audio.play();
    s0 = START; perf0 = performance.now(); playing = true;
    if (p && p.catch) p.catch(() => { /* bị chặn tự phát: vẫn chạy hình, thử lại khi chạm */ });
  };
  SN.dangPhat = () => playing;
  SN.nap = function (onReady) {
    audio = document.getElementById('nhac');
    audio.addEventListener('ended', () => { endedAt = performance.now(); });
    try { start(); } catch (e) { console.error(e); failed = true; SN.fallback && SN.fallback(e); return; }
    let left = 2;
    const one = () => { if (--left === 0) warm(() => { ready = true; lastT = 0; requestAnimationFrame(loop); onReady && onReady(); }); };
    // chờ nhạc tải đủ để phát liền mạch
    if (audio.readyState >= 3) one(); else { let ok = false; const go = () => { if (!ok) { ok = true; one(); } }; audio.addEventListener('canplaythrough', go, { once: true }); audio.addEventListener('loadeddata', () => setTimeout(go, 2500), { once: true }); setTimeout(go, 15000); audio.load(); }
    // chờ ảnh của các cảnh
    Promise.all(SN.cho || []).then(one, one);
  };
  SN.cho = [];
  SN.taiAnh = function (url) {
    const tex = new T.Texture();
    SN.cho.push(new Promise((res) => {
      const im = new Image(); im.decoding = 'async';
      im.onload = () => { tex.image = im; tex.needsUpdate = true; res(); };
      im.onerror = () => res();
      im.src = url;
    }));
    tex.minFilter = T.LinearMipmapLinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
    return tex;
  };
})();
