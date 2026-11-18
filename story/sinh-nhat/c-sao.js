'use strict';
// NGÔI SAO ETA CASSIOPEIAE (S 0–52): mở đầu. Sao vàng trắng cùng họ Mặt Trời (~6000 K).
// Bề mặt sôi hạt gạo (tế bào đối lưu, mỗi hạt cỡ cả một nước), cụm vết đen có vùng nửa tối toả sợi, mép đĩa tối và đỏ dần,
// vành sắc cầu hồng với gai lửa, những vòng lửa plasma khổng lồ cuộn trên chân trời, nhật hoa toả tia.
// 20.5: tia sáng tách khỏi bề mặt và bay đi; máy quay lùi xa dần thấy cả quả cầu lửa; 46–52 quay về phía trước, vào tinh vân.
(() => {
  const SN = window.SN, { clamp, mix, ease, io, ramp } = SN.u;
  const FRAG = `
  uniform vec3 uSs;      // nơi tia sáng ra đời (trên bề mặt)
  uniform float uBirth;  // loé sáng lúc ra đời
  uniform float uK;      // độ sáng tổng
  uniform vec3 uVP[39];  // 3 vòng lửa × 13 điểm, tính sẵn trong JS (không đổi theo thời gian)
  uniform vec4 uVB[3];   // mặt cầu bao từng vòng
  const vec3 SPOT = vec3(.0501, .9958, -.0753);
  vec2 cau(vec3 ro, vec3 rd, float r){ float b = dot(ro, rd), c = dot(ro, ro) - r * r, h = b * b - c; if (h < 0.) return vec2(-1.); h = sqrt(h); return vec2(-b - h, -b + h); }
  // vòng lửa plasma: đường cong nối hai chân A, B trên bề mặt, cao h
  vec3 vongP(vec3 A, vec3 B, float h, float t){ vec3 m = normalize(mix(A, B, t)); return m * (1. + h * sin(PI * t)); }
  float khoangCachVong(vec3 x, vec3 A, vec3 B, float h, out float tt){
    float best = 1e9; tt = 0.; vec3 pa = vongP(A, B, h, 0.);
    for (int i = 1; i <= 14; i++) {
      float t = float(i) / 14.; vec3 pb = vongP(A, B, h, t);
      vec3 ab = pb - pa, ap = x - pa; float k = clamp(dot(ap, ab) / dot(ab, ab), 0., 1.);
      float d = length(ap - ab * k); if (d < best) { best = d; tt = (float(i) - 1. + k) / 14.; }
      pa = pb;
    }
    return best;
  }
  // vòng lửa: tính giải tích khoảng cách từ tia nhìn tới từng đoạn của vòng → mịn, không lấm tấm
  vec3 motVong(vec3 ro, vec3 rd, float tMax, int o, vec4 bs, float w0, float k){
    vec3 acc = vec3(0.);
    { vec3 oc = ro - bs.xyz; float bb = dot(oc, rd), cc = dot(oc, oc) - bs.w * bs.w; if (bb * bb - cc < 0.) return acc; }   // tia không đi gần vòng: bỏ qua
    float R = w0 * 7.5;                         // xa ống lửa hơn thế thì ánh sáng ≈ 0: khỏi tra nhiễu
    vec3 pa = uVP[o];
    for (int i = 1; i <= 12; i++) {
      vec3 pb = uVP[o + i];
      vec3 u = pb - pa; float L = length(u); u /= L;
      vec3 w = ro - pa;
      float b = dot(rd, u), d = dot(rd, w), e = dot(u, w);
      float den = max(1. - b * b, 1e-4);
      float tr = clamp((b * e - d) / den, 0., tMax);
      float ts = clamp((e - b * d) / den, 0., L);
      float dist = length(ro + rd * tr - pa - u * ts);
      if (dist < R) {
        vec3 ps = pa + u * ts;
        float t01 = (float(i) - 1. + ts / L) / 12.;
        float ww = w0 * (1. + .9 * sin(t01 * 9. + uS * .3)) * (.8 + .5 * pn(ps * 40.));
        float th = .55 + .9 * sat(pn(ps * 110. + vec3(0., uS * .05, 0.)) * 2.2 + .5);     // sợi plasma
        acc += vec3(1., .32, .12) * exp(-sq(dist / ww)) * th * k / sqrt(den);
      }
      pa = pb;
    }
    return acc;
  }
  vec3 vongLua(vec3 ro, vec3 rd, float tMax){
    return motVong(ro, rd, tMax, 0, uVB[0], .016, .55) + motVong(ro, rd, tMax, 13, uVB[1], .009, .45) + motVong(ro, rd, tMax, 26, uVB[2], .011, .4);
  }
  vec3 beMat(vec3 n, vec3 rd, float dist){
    float mu = max(dot(n, -rd), 0.);
    // hạt gạo: hàng vạn tế bào đối lưu sáng vàng, rãnh cam đỏ (như ảnh kính thiên văn DKIST); sôi chậm theo thời gian
    vec3 p = n * 7.5 + vec3(0., 0., uS * .0045);
    float fp = dist * uPxA / max(mu, .05) * 60.;                  // một điểm ảnh rộng bao nhiêu tế bào
    float aa = 1. - smoothstep(.12, .6, fp);
    vec4 c1 = n4(p);
    float cell = smoothstep(.85, .15, c1.g);                     // tâm tế bào sáng
    float lane = smoothstep(.0, .09, c1.a);                      // rãnh tối giữa các tế bào
    float gran = cell * .55 + lane * .45;
    vec4 c2 = n4(p * 2.03 + 3.1);
    gran *= .82 + .18 * smoothstep(.0, .12, c2.a);
    float sup = pn(n * 3.1 + 1.7) * .4 + pn(n * 7.3) * .2;       // siêu hạt
    gran = mix(.62, gran, aa);
    float I = (.62 + .7 * gran) * (1. + sup * .35);
    // vết đen
    float ds = length(n - SPOT);
    float ang = atan(dot(n - SPOT, vec3(1., 0., 0.)), dot(n - SPOT, vec3(0., 0., 1.)));
    float fil = .75 + .25 * sat(pn(vec3(ang * 6., ds * 140., 1.)) * 3.);
    float pen = 1. - smoothstep(.026, .034, ds + pn(n * 60.) * .005);
    float umb = 1. - smoothstep(.011, .015, ds + pn(n * 90.) * .003);
    float ds2 = length(n - normalize(SPOT + vec3(.035, -.002, .02)));
    pen = max(pen, 1. - smoothstep(.012, .017, ds2)); umb = max(umb, (1. - smoothstep(.005, .007, ds2)));
    I *= mix(1., mix(.55 * fil, .13, umb), pen);
    // mép tối dần, đỏ dần; đốm sáng gần mép
    float limb = .55 + .45 * mu - .08 * (1. - mu * mu);
    float fac = (1. - mu) * smoothstep(.1, .45, pn(n * 9. + 4.)) * .6;
    I = I * limb + fac * .25;
    float Tk = mix(3900., 5900., pow(mu, .5));
    vec3 col = mix(vec3(1., .34, .06), vec3(1., .74, .36), sat(gran * 1.2 - .1)) * I * mix(.75, 1.15, pow(mu, .5));
    col = mix(col, nhiet(Tk) * I, .15);
    // loé tại chỗ tia sáng ra đời
    col += vec3(1., .95, .85) * exp(-length(n - uSs) / .006) * uBirth * 12.;
    return col * 1.25;
  }
  void main(){
    vec3 ro = uCP, rd = tiaNhin(vUv);
    vec2 ts = cau(ro, rd, 1.);
    vec3 col = vec3(0.);
    float tMax = 1e9;
    if (ts.x > 0.) {
      vec3 p = ro + rd * ts.x; vec3 n = normalize(p);
      col = beMat(n, rd, ts.x);
      tMax = ts.x;
    } else {
      // ngoài đĩa: sắc cầu, nhật hoa, nền sao
      float tc = dot(-ro, rd);
      vec3 cp = ro + rd * max(tc, 0.);
      float b = length(cp);
      vec3 cn = normalize(cp);
      float alt = max(b - 1., 0.);
      float fore = .5 + .5 * tanh(tc / .12);
      float spic = .55 + .45 * sat(pn(vec3(cn * 260.)) * 2.5 + .3);
      col += vec3(1., .3, .35) * exp(-max(alt, 0.) / (.006 * spic)) * 1.2 * fore;     // sắc cầu + gai lửa
      float streamer = .6 + .8 * sat(fbm3(cn * 3.3 + 2.) + .3);
      col += vec3(1., .82, .62) * (exp(-alt / .04) * .16 + exp(-alt / .25) * .05 * streamer + exp(-alt / 1.2) * .015) * fore;
      col += bauTroiSao(rd, uPxA) * .45;
    }
    col += vongLua(ro, rd, tMax);
    gl_FragColor = vec4(col * uK * uA, uA);
  }`;
  // ---------- máy quay & tia sáng ----------
  const R = Math.PI / 180;
  const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // máy quay gần bề mặt, đi chậm về phía -z, nhìn ra chân trời phía trước (vòng lửa đứng trên chân trời)
  const CK = SN.duong([
    // S, góc dọc kinh tuyến (độ, quanh trục x), độ cao (bán kính), cúi (độ), góc nhìn
    [0, 6.0, 1.05, -9.5, 50],
    [19, 3.2, 1.045, -9.0, 50],
  ]);
  const SS = nrm([0.012, 0.9993, -0.035]);           // nơi tia sáng ra đời: ngay trước mặt
  function sparkAt(S, out) {
    if (S < 20.5) { const k = Math.max(0, (S - 19.6) / 0.9); out[0] = SS[0] * (1 + 0.004 * k); out[1] = SS[1] * (1 + 0.004 * k); out[2] = SS[2] * (1 + 0.004 * k); return out; }
    const t = S - 20.5;
    // bay lên rồi lao về phía trước (-z), nhanh dần
    const up = 0.004 + 0.012 * t + 0.0042 * t * t;
    const fw = 0.0016 * t * t + 0.00012 * t * t * t;
    out[0] = SS[0] * (1 + up) + 0.002 * t; out[1] = SS[1] * (1 + up); out[2] = SS[2] * (1 + up) - fw;
    return out;
  }
  const C = { pos: [0, 0, 0], tgt: [0, 0, 0], up: [0, 1, 0], fov: 50 };
  const sp = [0, 0, 0], tmp = [0, 0, 0];
  function camAt(S) {
    if (S <= 19.2) {
      const c = CK(S);
      const th = c[0] * R, r = c[1];
      const pos = [0, Math.cos(th) * r, Math.sin(th) * r];
      const fwd = [0, Math.sin(th), -Math.cos(th)];           // tiếp tuyến hướng -z
      const tilt = c[2] * R;
      const upv = nrm(pos);
      const d = nrm([fwd[0] * Math.cos(tilt) + upv[0] * Math.sin(tilt), fwd[1] * Math.cos(tilt) + upv[1] * Math.sin(tilt), fwd[2] * Math.cos(tilt) + upv[2] * Math.sin(tilt)]);
      C.pos = pos; C.tgt = [pos[0] + d[0], pos[1] + d[1], pos[2] + d[2]]; C.up = upv; C.fov = c[3];
      return C;
    }
    // sau 19.2: máy quay ở thấp, ngước theo tia sáng bay vút lên; rồi lên cao dần, cuối cùng quay ra phía trước (vào tinh vân)
    const s19 = camAt.base || (camAt.base = (() => { const c = CK(19.2), th = c[0] * R, r = c[1]; return [0, Math.cos(th) * r, Math.sin(th) * r]; })());
    sparkAt(S, sp);
    const o = PK(S);
    const pos = [s19[0] + o[0], s19[1] + o[1], s19[2] + o[2]];
    const kf = ease((S - 42) / 7);
    const toS = nrm([sp[0] - pos[0], sp[1] - pos[1], sp[2] - pos[2]]);
    const look0 = nrm([mix(toS[0], 0, o[3]), mix(toS[1], -0.25, o[3]), mix(toS[2], -1, o[3])]);
    const d = nrm([mix(look0[0], 0, kf), mix(look0[1], 0.15, kf), mix(look0[2], -1, kf)]);
    C.pos = pos; C.tgt = [pos[0] + d[0], pos[1] + d[1], pos[2] + d[2]];
    C.up = nrm(pos);
    C.fov = o[4];
    return C;
  }
  // độ lệch máy quay so với chỗ đứng lúc 19.2: [S, dx, dy, dz, kéo về chân trời (0..1), góc nhìn]
  const PK = SN.duong([
    [19.2, 0, 0, 0, 0.0, 50],
    [23.0, 0.0, 0.004, 0.06, 0.18, 50],
    [30.0, 0.0, 0.03, 0.2, 0.22, 52],
    [38.0, 0.0, 0.22, 0.42, 0.1, 55],
    [46.0, 0.0, 0.9, 0.5, 0.0, 58],
    [53.0, 0.0, 1.9, 0.2, 0.0, 60],
  ]);
  SN.dung.push((T) => {
    // ba vòng lửa: [chân A, chân B, độ cao] → 13 điểm mỗi vòng + mặt cầu bao (giống công thức cũ trong shader)
    const VONG = [[[-.19, .96, -.2], [.12, .97, -.2], .26], [[.32, .93, -.13], [.38, .91, -.03], .1], [[-.42, .89, -.12], [-.34, .92, -.21], .14]];
    const vp = [], vb = [];
    for (const [A0, B0, h] of VONG) {
      const A = nrm(A0), B = nrm(B0);
      for (let i = 0; i <= 12; i++) { const t = i / 12, m = nrm([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]), k = 1 + h * Math.sin(Math.PI * t); vp.push(new T.Vector3(m[0] * k, m[1] * k, m[2] * k)); }
      const c = nrm([A[0] + B[0], A[1] + B[1], A[2] + B[2]]), ck = 1 + h * 0.55, rr = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) * 0.6 + h * 0.6 + 0.06;
      vb.push(new T.Vector4(c[0] * ck, c[1] * ck, c[2] * ck, rr));
    }
    const mesh = SN.quad(FRAG, { uSs: { value: new T.Vector3(...SS) }, uBirth: { value: 0 }, uK: { value: 1 }, uVP: { value: vp }, uVB: { value: vb } });
    const tr = [];
    SN.them({
      ten: 'sao', tu: 0, den: 53, lop: 10, mesh, warmS: 14,
      a: (S) => 1 - ramp(S, 47.5, 52.5),
      cap(S, a) {
        const u = mesh.material.uniforms;
        const c = camAt(S);
        const cc = { pos: c.pos.slice(), tgt: c.tgt.slice(), up: c.up.slice(), fov: c.fov };
        SN.camQuad(mesh.material, cc.pos, cc.tgt, cc.up, cc.fov);
        SN.uChung.uPxA.value = 2 * Math.tan(cc.fov * Math.PI / 360) / Math.max(1, SN.size()[1]);
        u.uK.value = ease(S / 6) ;
        u.uBirth.value = Math.exp(-Math.abs(S - 20.4) * 2.2) * ramp(S, 19.2, 20.4);
        // tia sáng
        if (S > 19.4) {
          const h = SN.chieu(mesh.material, sparkAt(S, sp), [0, 0, 0]);
          tr.length = 0;
          for (let k = 0; k < 14; k++) { const q = SN.chieu(mesh.material, sparkAt(Math.max(19.6, S - k * 0.05), tmp), [0, 0, 0]); tr.push(q[2] > 0 ? [q[0], q[1]] : [-9, -9]); }
          SN.tiaDat([h[0], h[1]], tr, ramp(S, 19.5, 20.6) * a, 2.4);
        }
        SN.gradeMix({ exp: 0.95 + 0.2 * ease((S - 30) / 15), bloom: 0.55, thr: 2.2, streak: 0.4, sat: 1.22, con: 1.12, vig: 0.42, grain: 0.03, ca: 0.01, bars: 1, lift: [0.008, 0.006, 0.006], gain: [1.03, 1.0, 0.95], warm: 0.4 }, a);
      },
    });
  });
})();
