'use strict';
// TINH VÂN (S 46–106): bay xuyên giữa những cột khí khổng lồ cao hàng năm ánh sáng (kiểu "Cột trụ của sự sáng tạo" chụp bằng kính James Webb).
// Khối khí 3D dò tia: cột bụi tối, viền sáng vàng phía hướng về cụm sao trẻ, khí loãng phát sáng xanh lam/đỏ; sao trẻ có tia sáu cánh.
// Vẽ ở nửa độ phân giải rồi phóng lên (khí vốn mềm). Cuối đoạn lao vào một dải bụi tối rồi ra vùng không gian đen (nơi có hố đen).
(() => {
  const SN = window.SN, { clamp, mix, ease, io, ramp } = SN.u;
  const FRAG = `
  uniform float uNS;        // số bước
  uniform vec3 uLs;         // vị trí cụm sao chiếu sáng
  uniform float uDark;      // lao vào dải bụi tối cuối đoạn
  const vec3 LDIR = normalize(vec3(.25, 1., -.55));
  float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - r * (1. - .35 * h); }
  float cot(vec3 p){
    float d = sdCap(p, vec3(-46., -80., 30.), vec3(-34., 170., 12.), 24.);
    d = min(d, sdCap(p, vec3(40., -90., -50.), vec3(30., 150., -66.), 19.));
    d = min(d, sdCap(p, vec3(-30., -90., -140.), vec3(-22., 135., -158.), 26.));
    d = min(d, sdCap(p, vec3(55., -90., -205.), vec3(44., 120., -218.), 17.));
    d = min(d, sdCap(p, vec3(-60., -90., -250.), vec3(-50., 105., -262.), 21.));
    d = min(d, sdCap(p, vec3(10., -110., -300.), vec3(5., 60., -310.), 30.));   // dải bụi cuối đoạn (lao vào)
    return d;
  }
  float matDo(vec3 p, out float pill, float re){
    float d = cot(p);
    pill = 0.;
    if (d < 40.) { float disp = fbm3(p * .006 + .3) * 26. + pn(p * .024 + 1.7) * 8.; pill = smoothstep(5., -7., d + disp); }
    if (re > .5) return pill;
    float g = smoothstep(.12, .62, pn(p * .009 + 2.3) + .55 * pn(p * .021 + 5.1)) * .07;      // sợi khí loãng
    if (p.z < -350.) g += smoothstep(0., .5, fbm3(p * .0035 + 4.1) + .15) * smoothstep(-380., -470., p.z) * .35;  // tường khí sau xa
    return pill + g;
  }
  void main(){
    vec3 ro = uCP, rd = tiaNhin(vUv);
    vec3 col = vec3(0.); float Tr = 1.;
    float t = 2. + 4. * h12(gl_FragCoord.xy);
    for (int i = 0; i < 64; i++) {
      if (float(i) >= uNS || Tr < .03 || t > 700.) break;
      vec3 p = ro + rd * t;
      float bound = cot(p) - 34.;                  // còn xa mọi cột: bước dài
      float pill;
      float den = matDo(p, pill, 0.);
      float ds = clamp(bound * .7, 4., 34.) + t * .016;
      ds *= .75 + .5 * h12(gl_FragCoord.xy + float(i) * 7.13);     // xáo bước, khỏi sọc
      if (den > .004) {
        float lit = 0.;
        if (pill > .03) { float pill2; float den2 = matDo(p + LDIR * 6., pill2, 1.); lit = sat((pill - den2) * 3.2); }   // mặt hướng về cụm sao: một lớp viền mỏng
        float dl = length(uLs - p);
        float near = 1. / (1. + dl * dl * .00002);
        float skin = lit * smoothstep(.05, .5, pill) * (1. - smoothstep(.75, 1., pill));
        vec3 rim = mix(vec3(1., .55, .24), vec3(1., .82, .58), lit) * skin * (.75 + 1.6 * near);
        float hNoise = sat(fbm3(p * .012 + 6.) + .5);
        vec3 gas = mix(vec3(.05, .16, .26), vec3(.28, .07, .05), smoothstep(.45, .75, hNoise)) * (den - pill) * (.5 + 1.4 * near);
        vec3 body = vec3(.035, .014, .01) * pill;  // thân cột: bụi tối hút sáng
        vec3 em = (rim + gas + body) * (1. - uDark * .9);
        float sig = (den - pill) * .02 + pill * .16;
        col += Tr * em * ds * .085;
        Tr *= exp(-sig * ds);
      }
      t += ds;
    }
    // nền sau cùng: sao + quầng của cụm sao trẻ
    vec3 bg = bauTroiSao(rd, uPxA) * .9;
    vec3 ld = normalize(uLs - ro);
    float a = max(dot(rd, ld), 0.);
    bg += vec3(1., .88, .75) * pow(a, 4000.) * 6. + vec3(.6, .7, 1.) * pow(a, 80.) * .12;
    bg += lopSao(rd, 160., .35, .9, uPxA) * 1.5;   // nhiều sao trẻ
    col += Tr * bg * (1. - uDark);
    gl_FragColor = vec4(col, 1.);
  }`;
  const CK = SN.duong([
    // S, x, y, z, nhìn x, nhìn y, nhìn z, nghiêng, góc nhìn
    [46, -10, 40, 175, 0, 55, 0, -4, 56],
    [60, 6, 52, 95, 10, 70, -60, -6, 56],
    [72, -2, 62, 10, -10, 85, -140, 3, 54],
    [84, 8, 58, -80, 15, 70, -220, 7, 54],
    [95, -4, 46, -170, 0, 30, -320, -2, 56],
    [106, 6, 12, -285, 8, 0, -420, 0, 60],
  ]);
  const C = { pos: [0, 0, 0], tgt: [0, 0, 0], up: [0, 1, 0], fov: 56 };
  function camAt(S) {
    const c = CK(S);
    C.pos = [c[0], c[1], c[2]]; C.tgt = [c[3], c[4], c[5]];
    const r = c[6] * Math.PI / 180; C.up = [Math.sin(r), Math.cos(r), 0]; C.fov = c[7];
    return C;
  }
  const sp = [0, 0, 0], tmp = [0, 0, 0];
  function sparkAt(S, out) {
    const c = camAt(S);
    const fx = c.tgt[0] - c.pos[0], fy = c.tgt[1] - c.pos[1], fz = c.tgt[2] - c.pos[2], l = Math.hypot(fx, fy, fz);
    out[0] = c.pos[0] + fx / l * 14; out[1] = c.pos[1] + fy / l * 14 + 0.6; out[2] = c.pos[2] + fz / l * 14;
    return out;
  }
  SN.dung.push((T) => {
    const mesh = SN.quad(FRAG, { uNS: { value: SN.HQ ? 64 : (SN.DT ? 26 : 40) }, uLs: { value: new T.Vector3(30, 240, -330) }, uDark: { value: 0 } }, { low: true });
    const low = SN.lowres(mesh, SN.HQ ? 1 : (SN.DT ? 0.36 : 0.46));
    const tr = [];
    SN.them({
      ten: 'tinhvan', tu: 46, den: 106.5, lop: 20, low, warmS: 75,
      a: (S) => ramp(S, 46.5, 52) * (1 - ramp(S, 103.5, 106.3)),
      cap(S, a) {
        const c = camAt(S);
        const cc = { pos: c.pos.slice(), tgt: c.tgt.slice(), up: c.up.slice(), fov: c.fov };
        SN.camQuad(mesh.material, cc.pos, cc.tgt, cc.up, cc.fov);
        SN.uChung.uPxA.value = 2 * Math.tan(cc.fov * Math.PI / 360) / Math.max(1, SN.size()[1]);
        mesh.material.uniforms.uDark.value = ease((S - 99.5) / 4.5);
        const h = SN.chieu(mesh.material, sparkAt(S, sp), [0, 0, 0]);
        tr.length = 0;
        for (let k = 0; k < 14; k++) { const q = SN.chieu(mesh.material, sparkAt(S - k * 0.06, tmp), [0, 0, 0]); tr.push(q[2] > 0 ? [q[0], q[1]] : [-9, -9]); }
        SN.tiaDat([h[0], h[1]], tr, a, 2.1);
        SN.gradeMix({ exp: 1.05, bloom: 0.75, thr: 1.2, streak: 0.35, sat: 1.05, con: 1.12, vig: 0.42, grain: 0.035, ca: 0.012, bars: 1, lift: [0.01, 0.012, 0.02], gain: [1.02, 1.0, 1.0] }, a);
      },
    });
  });
})();
