'use strict';
// CẬN CẢNH BẬU CỬA (S 240–251): đốm sáng cuối cùng bay qua song cửa, đậu cạnh chiếc kẹp tóc càng cua trong suốt nằm trên bậu.
// Ánh sáng ấm xuyên qua nhựa trong tách thành dải cầu vồng in lên bậu và mép tường; trăng ngoài cửa in bóng song sắt.
// Dựng bằng hàm khoảng cách (SDF) dò tia: nhựa trong có khúc xạ tách màu, bóng mềm, hậu cảnh ngoài cửa nhoè như ống kính khẩu lớn.
// Đơn vị: mét. Tường là mặt z = 0 (trong phòng là z > 0), bậu cửa là mặt y = 0 trong lỗ cửa.
(() => {
  const SN = window.SN, { clamp, mix, ease, io, ramp } = SN.u;
  const FRAG = `
  uniform vec3 uMote; uniform float uMoteI, uRain, uFoc, uBlur;
  const vec3 MOON = normalize(vec3(-.35, .62, -.7));
  const vec3 CLIPC = vec3(.0, .085, -.13);
  // ---- kẹp càng cua kẹp vào một thanh song cửa: hai hàm cong ôm thanh sắt, răng lược cài nhau phía ngoài,
  //      gáy kẹp + lò xo phía trong phòng, hai tay cầm xoè ra về phía máy quay ----
  const vec3 KEPC = vec3(.0, .085, -.13);  // tâm thanh sắt chỗ kẹp (thấp, sát bậu)
  float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
  float hamKep(vec3 q, float side){
    // cung tròn quanh thanh sắt trong mặt xz, từ gáy (phía trong phòng, +z) vòng qua bên (side) tới phía ngoài (-z)
    float R = .0175, t = .0021;
    vec2 xz = vec2(q.x * side, q.z);
    float a = atan(xz.x, xz.y);                   // 0 ở phía trong phòng, PI ở phía ngoài
    float r = length(xz);
    float a1 = 3.05;
    float d = a >= 0. && a <= a1 ? abs(r - R) - t : length(xz - R * vec2(sin(clamp(a, 0., a1)), cos(clamp(a, 0., a1)))) - t;
    float k = clamp(a / a1, 0., 1.);
    float hw = mix(.022, .03, smoothstep(.0, .5, k));
    d = max(d, abs(q.y) - hw);
    if (k > .6) { float pitch = .0058; float f = fract(q.y / pitch + (side > 0. ? 0. : .5)); float tooth = (abs(f - .5) - .26) * pitch; d = max(d, tooth * smoothstep(.6, .7, k)); }
    return d;
  }
  float sdKep(vec3 p){
    vec3 q = p - KEPC;
    float d = min(hamKep(q, 1.), hamKep(q, -1.));
    // gáy + lò xo
    vec3 g = q - vec3(0., 0., .0205);
    float spr = max(length(g.xz) - .0044 + .0006 * sin(g.y * 900.), abs(q.y) - .026);
    d = min(d, spr);
    // hai tay cầm: tấm cong xoè về phía trong phòng
    for (int i = 0; i < 2; i++) {
      float sd = i == 0 ? 1. : -1.;
      vec3 h = q - vec3(sd * .006, 0., .024);
      float ang = sd * .5;
      h.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * h.xz;
      h.x -= .0035 * sin(h.z * 60.) * sd;
      float tay = sdBox(h - vec3(0., 0., .019), vec3(.0019, .024 - h.z * .1, .019));
      d = min(d, tay - .0006);
    }
    return d;
  }
  // ---- phòng: tường, lỗ cửa, bậu, khung ----
  float sdPhong(vec3 p){
    float wall = p.z;                                     // mặt tường trong phòng
    float hole = sdBox(p - vec3(0., .65, -.11), vec3(.55, .65, .3));
    float d = max(wall, -hole);
    d = max(d, -(p.z + .23));                             // tường dày 22 cm
    float sill = sdBox(p - vec3(0., -.03, -.08), vec3(.6, .03, .17));
    float ledge = sdBox(p - vec3(0., -.018, .03), vec3(.62, .018, .035));
    d = min(d, min(sill, ledge));
    float frame = sdBox(p - vec3(0., .65, -.175), vec3(.56, .66, .02));
    frame = max(frame, -sdBox(p - vec3(0., .65, -.175), vec3(.5, .6, .05)));
    d = min(d, frame);
    return d;
  }
  vec2 map(vec3 p){ float a = sdPhong(p), b = sdKep(p); return a < b ? vec2(a, 1.) : vec2(b, 2.); }
  vec3 nor(vec3 p){ vec2 e = vec2(.0006, 0.); return normalize(vec3(map(p + e.xyy).x - map(p - e.xyy).x, map(p + e.yxy).x - map(p - e.yxy).x, map(p + e.yyx).x - map(p - e.yyx).x)); }
  float nPhong(vec3 p){ return sdPhong(p); }
  vec3 norPh(vec3 p){ vec2 e = vec2(.0008, 0.); return normalize(vec3(nPhong(p + e.xyy) - nPhong(p - e.xyy), nPhong(p + e.yxy) - nPhong(p - e.yxy), nPhong(p + e.yyx) - nPhong(p - e.yyx))); }
  float bong(vec3 ro, vec3 rd, float tmax){ float r = 1., t = .002 + .004 * h12(gl_FragCoord.xy); for (int i = 0; i < 26; i++) { float h = map(ro + rd * t).x; r = min(r, 8. * h / t); t += clamp(h * .8, .002, .04); if (r < .01 || t > tmax) break; } r = clamp(r, 0., 1.); return r * r * (3. - 2. * r); }
  // song sắt (tính riêng, có nhoè theo độ xa tiêu cự)
  float songSat(vec3 ro, vec3 rd, out float tHit){
    float cov = 0.; tHit = 1e9;
    for (int i = -4; i <= 4; i++) {
      float x0 = float(i) * .11;
      // đường thẳng đứng x = x0, z = -.13: khoảng cách gần nhất từ tia (chiếu lên mặt xz)
      vec2 o = ro.xz - vec2(x0, -.13); vec2 d = normalize(rd.xz);
      float tt = -dot(o, d); vec2 cp = o + d * tt; float dist = length(cp);
      float tr = tt / length(rd.xz);
      if (tr < 0.) continue;
      float yy = ro.y + rd.y * tr; if (yy < 0. || yy > 1.28) continue;
      float blur = .0015 + abs(tr - uFoc) * uBlur;
      float c = 1. - smoothstep(.007 - blur, .007 + blur, dist);
      if (c > cov) { cov = c; tHit = tr; }
    }
    return cov;
  }
  vec3 ngoai(vec3 rd){ // ngoài cửa: đêm trăng, nhoè: bóng cây, quầng đèn xa
    vec3 c = mix(vec3(.02, .03, .055), vec3(.07, .09, .14), sat(rd.y * 1.5 + .4));
    float tree = smoothstep(.1, -.1, rd.y + .15 * pn(vec3(rd.x * 2., .3, .7)) - .05);
    c = mix(c, vec3(.008, .012, .016), tree * .85);
    vec2 l1 = vec2(rd.x / -rd.z, rd.y / -rd.z);
    c += vec3(1., .62, .3) * exp(-length(l1 - vec2(.55, -.05)) / .05) * .5 + vec3(1., .66, .34) * exp(-length(l1 - vec2(-.9, .02)) / .04) * .35;
    c += vec3(.4, .5, .7) * pow(max(dot(rd, MOON), 0.), 30.) * .4;
    return c;
  }
  vec3 phoMau(float t){ // dải phổ: tím → đỏ
    return sat3(vec3(abs(t * 6. - 3.) - 1., 2. - abs(t * 6. - 2.), 2. - abs(t * 6. - 4.)));
  }
  vec3 cauVong(vec3 p, vec3 n){ // ánh sáng đốm đi qua kẹp, tách màu, rơi lên bậu / mép tường
    vec3 d0 = normalize(CLIPC - uMote);
    vec3 v = p - CLIPC;
    float L = length(v); vec3 dv = v / max(L, 1e-4);
    float ang = acos(clamp(dot(dv, d0), -1., 1.));
    float t = (ang - .05) / .16;                              // lệch 3°–12°: dải màu
    float band = smoothstep(0., .12, t) * smoothstep(1., .88, t);
    // chỉ một cung (ánh sáng qua mép cong của kẹp), có vệt sáng đặc như tụ quang thật
    vec3 ax = normalize(cross(d0, vec3(0., 1., 0.))); vec3 ay = cross(ax, d0);
    float phi = atan(dot(dv, ay), dot(dv, ax));
    float arc = smoothstep(-1.4, -.6, phi) * smoothstep(.9, .1, phi);
    float sp = (.45 + .9 * smoothstep(.15, .85, pn(vec3(p * 140.)) + .5)) * (.7 + .6 * smoothstep(.3, .9, pn(vec3(phi * 3., t * 6., .5)) + .5));
    band *= arc;
    float fall = exp(-L / .55) * max(dot(n, -dv), 0.);
    return phoMau(clamp(1. - t, 0., 1.)) * band * fall * sp * uRain;
  }
  vec3 anhSang(vec3 p, vec3 n, vec3 alb, float ao){
    vec3 col = vec3(0.);
    // trăng qua cửa (lạnh), có bóng song sắt
    float sh = bong(p + n * .002, MOON, .5);
    float bar; float tb; bar = songSat(p + n * .002, MOON, tb);
    col += alb * vec3(.32, .4, .55) * max(dot(n, MOON), 0.) * sh * (1. - bar * .9) * 1.4;
    // đốm sáng ấm
    vec3 lm = uMote - p; float l2 = dot(lm, lm); vec3 ld = lm * inversesqrt(l2);
    float shm = bong(p + n * .002, ld, sqrt(l2));
    col += alb * vec3(1., .72, .42) * max(dot(n, ld), 0.) * shm * uMoteI * .012 / (l2 + .0004);
    // màn hình điện thoại trong phòng (trái, sau lưng máy quay): xanh lạnh rất nhẹ
    col += alb * vec3(.22, .3, .5) * max(dot(n, normalize(vec3(-.8, .3, .6))), 0.) * .18;
    col += alb * vec3(.03, .035, .05) * ao;
    col += alb * cauVong(p, n) * 2.2;
    return col;
  }
  void main(){
    vec3 ro = uCP, rd = tiaNhin(vUv);
    float t = 0.; vec2 h = vec2(0.);
    for (int i = 0; i < 90; i++) { h = map(ro + rd * t); if (h.x < .0004 * t || t > 4.) break; t += h.x * .9; }
    vec3 col;
    float tb; float bar = songSat(ro, rd, tb);
    if (t < 4. && h.y < 1.5) {
      vec3 p = ro + rd * t, n = norPh(p);
      // tường trắng ngà cũ, bậu sơn, khung cửa sơn xanh sẫm
      vec3 alb = vec3(.62, .58, .5) * (.88 + .2 * pn(vec3(p * 18.)));
      if (p.y < .002 && p.z < .07) alb = vec3(.5, .47, .42) * (.85 + .25 * pn(vec3(p * 30.)) + .1 * pn(vec3(p * 120.)));
      if (p.z < -.15) alb = vec3(.06, .1, .09);
      float ao = clamp(sdPhong(p + n * .02) / .02, .2, 1.);
      col = anhSang(p, n, alb, ao);
      if (bar > .01 && tb < t) col = mix(col, vec3(.01, .012, .014), bar);
    } else if (t < 4.) {
      // nhựa trong: phản chiếu + khúc xạ tách màu + viền sáng
      vec3 p = ro + rd * t, n = nor(p);
      float fr = .04 + .96 * pow(1. - max(dot(-rd, n), 0.), 5.);
      vec3 bgc = vec3(0.);
      for (int c = 0; c < 3; c++) {
        float eta = 1. / (1.49 + float(c) * .018);
        vec3 rr = refract(rd, n, eta);
        // nhìn xuyên: lấy màu bậu / ngoài cửa theo hướng khúc xạ
        float t2 = 0.; vec3 q = p + rr * .004;
        for (int k = 0; k < 28; k++) { float dd = sdPhong(q + rr * t2); if (dd < .0006 || t2 > 1.5) break; t2 += dd; }
        vec3 pp = q + rr * t2;
        vec3 cc = t2 < 1.5 ? anhSang(pp, norPh(pp), vec3(.55, .52, .46), 1.) : ngoai(rr);
        bgc[c] = cc[c];
      }
      vec3 rf = reflect(rd, n);
      vec3 env = ngoai(rf) * .6 + vec3(1., .75, .45) * pow(max(dot(rf, normalize(uMote - p)), 0.), 60.) * uMoteI * 1.6 + vec3(.5, .6, .8) * pow(max(dot(rf, MOON), 0.), 40.) * .8;
      float edge = pow(1. - abs(dot(rd, n)), 2.);
      col = mix(bgc * vec3(.96, .97, 1.), env, fr) + vec3(1., .8, .55) * edge * uMoteI * .08 + phoMau(fract(edge * 2.)) * edge * uRain * .25;
      if (bar > .01) col = mix(col, vec3(.012, .014, .016), bar * (tb < t ? 1. : .6));
    } else {
      col = ngoai(rd);
      if (bar > .01) col = mix(col, vec3(.01, .012, .014), bar);
    }
    // đốm sáng: quả cầu ấm, quầng mềm
    vec3 om = uMote - ro; float tm = dot(om, rd);
    if (tm > 0.) { float dm = length(om - rd * tm); col += vec3(1., .78, .5) * (exp(-dm * dm / .000015) * 9. + exp(-dm / .006) * 1.4 + exp(-dm / .03) * .25) * uMoteI; }
    gl_FragColor = vec4(col, 1.);
  }`;
  const CAMK = SN.duong([
    [240.0, 0.2, 0.22, 0.26, -0.005, 0.065, -0.12, 36],
    [244.4, 0.17, 0.2, 0.21, -0.005, 0.062, -0.12, 33],
    [251.0, 0.15, 0.185, 0.18, -0.005, 0.06, -0.12, 31],
  ]);
  const MOTEK = SN.duong([
    [240.0, -0.12, 0.55, -1.0],
    [241.4, -0.02, 0.38, -0.5],
    [242.6, 0.04, 0.27, -0.27],
    [243.6, 0.05, 0.245, -0.222],
    [251.0, 0.052, 0.242, -0.218],
  ]);
  SN.dung.push((T) => {
    const mesh = SN.quad(FRAG, { uMote: { value: new T.Vector3() }, uMoteI: { value: 1 }, uRain: { value: 0 }, uFoc: { value: 0.55 }, uBlur: { value: 0.03 } }, { low: true });
    const low = SN.lowres(mesh, SN.DT ? 0.55 : 0.7);
    SN.them({
      ten: 'kep', tu: 239.9, den: 251.2, lop: 80, low, warmS: 246,
      a: (S) => ramp(S, 240.1, 241.3) * (1 - ramp(S, 248.7, 250.9)),
      cap(S, a) {
        const u = mesh.material.uniforms;
        const c = CAMK(S);
        SN.camQuad(mesh.material, [c[0], c[1], c[2]], [c[3], c[4], c[5]], [0, 1, 0], c[6]);
        SN.uChung.uPxA.value = 2 * Math.tan(c[6] * Math.PI / 360) / Math.max(1, SN.size()[1]);
        const m = MOTEK(S), br = Math.sin(S * 2.1) * 0.003;
        u.uMote.value.set(m[0] + br, m[1] + Math.sin(S * 1.4) * 0.004, m[2]);
        u.uMoteI.value = 1 + 0.12 * Math.sin(S * 3.1);
        u.uRain.value = ease((S - 243.6) / 1.8);
        u.uFoc.value = Math.hypot(c[0] - c[3], c[1] - c[4], c[2] - c[5]);
        SN.gradeMix({ exp: 1.15, bloom: 0.9, thr: 1.0, streak: 0.25, sat: 1.05, con: 1.05, vig: 0.5, grain: 0.035, ca: 0.01, bars: 0, lift: [0.012, 0.012, 0.018], gain: [1.02, 1.0, 0.98], warm: 0.3 }, a);
      },
    });
  });
})();
