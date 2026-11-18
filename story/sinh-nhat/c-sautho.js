'use strict';
// SAO THỔ (S 140–182): văng khỏi hố đen → lao qua rừng khối băng trong vành đai (sát máy quay, đơn vị mét) →
// vọt lên khỏi mặt phẳng vành đai: sao Thổ ngược sáng (Mặt Trời nấp sau hành tinh, như ảnh tàu Cassini "Ngày Trái Đất mỉm cười"):
// hành tinh là vầng tối viền sáng, vành đai rực lên khi ánh sáng xuyên qua; một chấm xanh nhỏ dưới vành đai là Trái Đất.
// Đơn vị hành tinh: 1000 km. Bán kính xích đạo 60.3, cực 54.4. Vành: C 74.5–92, B 92–117.5, khe Cassini, A 122–136.8, F 140.2.
(() => {
  const SN = window.SN, M = SN.M, { clamp, mix, ease, io, ramp } = SN.u;
  const FRAG = `
  uniform vec3 uSunD;     // hướng tới Mặt Trời
  uniform vec3 uEarth;    // hướng tới Trái Đất (chấm xanh)
  uniform float uEarthK;  // độ sáng chấm xanh (to dần khi lao tới)
  uniform vec3 uFOff;     // vị trí máy quay trong rừng băng (mét, quấn vòng)
  uniform float uRock;    // còn ở trong vành (1) hay đã lên cao (0)
  uniform float uRet;     // độ cao máy quay so với mặt phẳng vành (1000 km)
  const float RE = 60.3, RP = 54.4;
  vec2 elip(vec3 ro, vec3 rd){ vec3 s = vec3(1., RE / RP, 1.); vec3 o = ro * s, d = rd * s; float a = dot(d, d), b = dot(o, d), c = dot(o, o) - RE * RE, h = b * b - a * c; if (h < 0.) return vec2(-1.); h = sqrt(h); return vec2(-b - h, -b + h) / a; }
  float vanh(float r){ // độ dày quang học theo bán kính
    float t = 0.;
    t += smoothstep(74.5, 75.5, r) * (1. - smoothstep(91.5, 92.2, r)) * (.12 + .08 * sin(r * 3.1));          // vành C
    t += smoothstep(92., 93., r) * (1. - smoothstep(117., 117.6, r)) * (1.1 + .7 * sin(r * 1.7) + .4 * sin(r * 9.3));   // vành B dày
    t += smoothstep(122., 122.4, r) * (1. - smoothstep(136.4, 136.8, r)) * (.55 + .2 * sin(r * 4.4)) * (1. - .8 * exp(-sq((r - 133.6) / .2)));  // vành A + khe Encke
    t += exp(-sq((r - 140.2) / .12)) * .6;                                                                     // vành F
    t *= .75 + .5 * pn(vec3(r * 2.2, .3, .7)) + .3 * pn(vec3(r * 17., .1, .2));                               // vô số vành con
    return max(t, 0.);
  }
  vec3 mauVanh(float r){ return r < 92. ? vec3(.55, .58, .62) : (r < 118. ? vec3(.9, .8, .62) : vec3(.75, .72, .66)); }
  bool bongTho(vec3 p){ return elip(p, uSunD).x > 0.; }
  vec3 vanhMau(vec3 ro, vec3 rd, out float tr, out float tHit){
    tr = 1.; tHit = 1e9;
    if (abs(rd.y) < 1e-5) return vec3(0.);
    float t = -ro.y / rd.y;
    if (t <= 0.) return vec3(0.);
    vec3 p = ro + rd * t; float r = length(p.xz);
    float tau = vanh(r);
    if (tau < .001) return vec3(0.);
    tHit = t;
    float mu = abs(rd.y);
    float a = 1. - exp(-tau / max(mu, .02));
    tr = 1. - a;
    // ngược sáng: ánh sáng xuyên vành (tán xạ thuận) sáng nhất ở vành mỏng; vành dày tối hơn khi nhìn xuyên
    float cosg = dot(rd, uSunD);
    float fwd = pow(max(cosg, 0.), 3.) * 2.2 + .25;
    float through = exp(-tau * .9);
    vec3 c = mauVanh(r) * a * (fwd * (.25 + 1.6 * through) + .15);
    if (bongTho(p)) c *= .05;                                 // bóng sao Thổ đổ lên vành
    // ánh hành tinh hắt lên vành (vàng nhạt)
    c += mauVanh(r) * a * vec3(.9, .75, .5) * .05 * smoothstep(140., 70., r);
    return c * mix(1.2, .45, uRock);
  }
  vec3 hanhTinh(vec3 ro, vec3 rd, float t){
    vec3 p = ro + rd * t; vec3 n = normalize(p * vec3(1., (RE / RP) * (RE / RP), 1.));
    float lat = asin(clamp(p.y / RP, -1., 1.));
    float band = sin(lat * 18. + pn(vec3(lat * 6., p.x * .02, 1.)) * 2.) * .5 + .5;
    vec3 alb = mix(vec3(.82, .7, .5), vec3(.95, .86, .66), band) * (.85 + .3 * pn(vec3(lat * 40., p.x * .05, 2.)));
    float d = dot(n, uSunD);
    vec3 col = alb * max(d, 0.) * 1.5;
    // viền sáng khí quyển khi ngược sáng
    float rim = pow(1. - max(dot(n, -rd), 0.), 6.) * pow(max(dot(rd, uSunD), 0.), 2.);
    col += vec3(1., .85, .6) * rim * 3.5;
    // phía đêm: ánh vành hắt (rất mờ), bóng vành đổ lên hành tinh
    col += alb * vec3(.6, .55, .45) * .025 * (.5 + .5 * n.y * sign(p.y + .001));
    float tv = -p.y / uSunD.y; vec3 pr = p + uSunD * tv; float sr = length(pr.xz);
    if (tv > 0.) col *= mix(1., exp(-vanh(sr) * 1.5), .9);
    return col;
  }
  // ---- rừng khối băng sát máy quay (mét) ----
  vec4 h4c(vec3 c){ return h43(c + 31.); }
  float daBang(vec3 q, out vec3 cid){
    float s = 26.; vec3 c = floor(q / s); vec3 f = q - (c + .5) * s;
    cid = c;
    vec4 h = h4c(c);
    if (h.w > .2 || abs(c.y) > 1.) return s * .5;
    vec3 o = (h.xyz - .5) * s * .5;
    float rad = 1.2 + 4.5 * h.x * h.x;
    vec3 g = (f - o) / rad;
    float d = (max(max(abs(g.x * .9 + g.y * .3), abs(g.y * .8 - g.z * .4)), abs(g.z + g.x * .2)) * .55 + length(g) * .45 - 1.) * rad;   // khối có cạnh
    d += pn((f - o) * .07 + h.xyz * 9.) * rad * .22 + pn((f - o) * .25) * rad * .035;
    return d;
  }
  vec4 rungBang(vec3 rd, out float tHit){
    tHit = 1e9;
    float t = 1.;
    vec3 cid;
    for (int i = 0; i < 44; i++) {
      vec3 q = uFOff + rd * t;
      if (abs(q.y) > 60.) { if (q.y * rd.y > 0.) break; }
      float d = daBang(q, cid);
      if (d < .02 * t) { tHit = t; break; }
      t += max(d * .6, .03 * t);
      if (t > 520.) break;
    }
    if (tHit > 1e8) return vec4(0.);
    vec3 q = uFOff + rd * tHit; vec2 e = vec2(.06 * tHit * .01 + .02, 0.);
    vec3 n = normalize(vec3(daBang(q + e.xyy, cid) - daBang(q - e.xyy, cid), daBang(q + e.yxy, cid) - daBang(q - e.yxy, cid), daBang(q + e.yyx, cid) - daBang(q - e.yyx, cid)));
    float back = pow(max(dot(-n, uSunD), 0.), 2.) ;
    float rim = pow(1. - max(dot(n, -rd), 0.), 3.) * (.4 + 1.6 * max(dot(rd, uSunD), 0.));
    float sss = pow(max(dot(rd, uSunD), 0.), 4.) * .6;
    vec3 ice = vec3(.22, .25, .3);
    vec3 col = ice * (max(dot(n, uSunD), 0.) * .9 + .015) + vec3(.7, .8, .95) * rim * .55 + vec3(.45, .62, .85) * sss * .5 + vec3(.9, .75, .5) * .012;
    // lấp lánh tinh thể băng
    col += vec3(1.) * pow(max(dot(reflect(rd, n), uSunD), 0.), 120.) * 3. * step(.6, pn(q * 3.) + .5);
    float fog = exp(-tHit * .004);
    return vec4(col * fog, fog);
  }
  void main(){
    vec3 ro = uCP, rd = tiaNhin(vUv);
    vec3 col = bauTroiSao(rd, uPxA) * .7 + nganHa(rd, normalize(vec3(.4, .6, .7)), uPxA) * .25;
    // Trái Đất: chấm xanh
    float de = length(rd - uEarth);
    col += vec3(.45, .62, 1.) * (exp(-de * de / (uPxA * uPxA * 1.6)) * 5. + exp(-de / (uPxA * 5.)) * .25) * uEarthK;
    // quầng sáng quanh hành tinh (Mặt Trời nấp sau)
    vec2 tp = elip(ro, rd);
    float b = length(cross(ro, rd)) ; float alt = b - RE;
    if (tp.x < 0.) col += vec3(1., .85, .62) * exp(-max(alt, 0.) / 2.5) * pow(max(dot(rd, uSunD), 0.), 2.) * 1.2 * (dot(-ro, rd) > 0. ? 1. : 0.);
    float trR, tR; vec3 rc = vanhMau(ro, rd, trR, tR);
    if (tp.x > 0.) {
      vec3 pc = hanhTinh(ro, rd, tp.x);
      if (tR < tp.x) col = rc + trR * pc; else col = pc;
    } else col = rc + trR * col;
    // lớp hạt sát mặt phẳng vành khi máy quay ở trong vành: dải sáng mờ ở chân trời
    if (uRock > 0.) {
      float hz = exp(-abs(rd.y) * 70.) * .1 * uRock;
      col += vec3(.75, .78, .85) * hz * (.4 + pow(max(dot(rd, uSunD), 0.), 2.));
      float tb; vec4 rk = rungBang(rd, tb);
      col = mix(col, rk.rgb, rk.a > 0. ? (1. - .0) : 0.) * (rk.a > 0. ? 1. : 1.);
      if (rk.a > 0.) col = rk.rgb + (1. - rk.a) * col;
    }
    gl_FragColor = vec4(col * uA, uA);
  }`;
  // máy quay: [S, bán kính, độ cao (1000 km), góc phương vị (độ), nhìn vào trong (độ), ngóc (độ), góc nhìn]
  const CK = SN.duong([
    [140.0, 129.0, 0.00003, 10, 42, 2, 62],
    [152.0, 129.0, 0.00003, 30, 46, 3, 64],
    [159.5, 129.0, 0.00004, 46, 50, 4, 64],
    [163.0, 131.0, 6.0, 52, 62, -12, 58],
    [168.0, 150.0, 18.0, 60, 72, -14, 54],
    [176.0, 175.0, 26.0, 68, 76, -12, 50],
    [182.0, 185.0, 28.0, 70, 80, -12, 46],
  ]);
  const R = Math.PI / 180;
  const C = { pos: [0, 0, 0], tgt: [0, 0, 0], up: [0, 1, 0], fov: 60 };
  function camAt(S) {
    const c = CK(S);
    const r = c[0], y = c[1], az = c[2] * R;
    const pos = [Math.cos(az) * r, y, Math.sin(az) * r];
    // tiếp tuyến (chiều bay) quay vào trong một góc
    const tan = [-Math.sin(az), 0, Math.cos(az)], inn = [-Math.cos(az), 0, -Math.sin(az)];
    const k = c[3] * R, pt = c[4] * R;
    let d = [tan[0] * Math.cos(k) + inn[0] * Math.sin(k), 0, tan[2] * Math.cos(k) + inn[2] * Math.sin(k)];
    d = [d[0] * Math.cos(pt), Math.sin(pt), d[2] * Math.cos(pt)];
    C.pos = pos; C.tgt = [pos[0] + d[0], pos[1] + d[1], pos[2] + d[2]]; C.up = [0, 1, 0]; C.fov = c[5];
    return C;
  }
  SN.dung.push((T) => {
    // Mặt Trời nấp sau sao Thổ nhìn từ chặng cuối; Trái Đất: chấm dưới vành bên phải
    const c176 = camAt(172);
    const toSat = [-c176.pos[0], -c176.pos[1], -c176.pos[2]], l = Math.hypot(...toSat);
    const sunD = new T.Vector3(toSat[0] / l, toSat[1] / l + 0.02, toSat[2] / l).normalize();
    const mesh = SN.quad(FRAG, { uSunD: { value: sunD }, uEarth: { value: new T.Vector3() }, uEarthK: { value: 0 }, uFOff: { value: new T.Vector3() }, uRock: { value: 1 }, uRet: { value: 0 } });
    SN.them({
      ten: 'sautho', tu: 140.2, den: 182, lop: 40, mesh, warmS: 150,
      a: (S) => ramp(S, 140.6, 143.0) * (1 - ramp(S, 180.6, 181.8)),
      cap(S, a) {
        const u = mesh.material.uniforms;
        const c = camAt(S);
        const cc = { pos: c.pos.slice(), tgt: c.tgt.slice(), up: c.up.slice(), fov: c.fov };
        const f = SN.camQuad(mesh.material, cc.pos, cc.tgt, cc.up, cc.fov);
        SN.uChung.uPxA.value = 2 * Math.tan(cc.fov * Math.PI / 360) / Math.max(1, SN.size()[1]);
        // rừng băng: chạy theo máy quay (mét), quấn vòng để khỏi mất chính xác
        // tích phân hướng bay (tiếp tuyến) × tốc độ để khối băng trôi đúng chiều
        let ox = 0, oz = 0; const n = 60, s0 = 140, s1 = Math.min(S, 162);
        for (let i = 0; i < n; i++) { const ss = s0 + (s1 - s0) * (i + 0.5) / n, az = CK(ss)[2] * R; ox += -Math.sin(az); oz += Math.cos(az); }
        const v = 230 * (s1 - s0) / n;
        u.uFOff.value.set(((ox * v) % 5200 + 5200) % 5200, 22 + 6 * Math.sin(S * 0.7), ((oz * v) % 5200 + 5200) % 5200);
        u.uRock.value = 1 - ease((S - 159.6) / 1.8);
        // Trái Đất: trước mặt, hơi dưới phải khung hình; to và sáng dần khi lao tới
        const fx = f.f, rx = f.r, ux = f.u;
        const e = [fx[0] * 0.92 + rx[0] * 0.3 - ux[0] * 0.22, fx[1] * 0.92 + rx[1] * 0.3 - ux[1] * 0.22, fx[2] * 0.92 + rx[2] * 0.3 - ux[2] * 0.22];
        if (S < 169) { const el = Math.hypot(...e); u.uEarth.value.set(e[0] / el, e[1] / el, e[2] / el); SN.saoTho_e = u.uEarth.value.clone(); }
        else if (SN.saoTho_e) u.uEarth.value.copy(SN.saoTho_e);
        u.uEarthK.value = ease((S - 168.5) / 2) * (1 + 6 * Math.pow(ease((S - 176) / 5.5), 2));
        // tia sáng lao về phía chấm xanh
        const ed = u.uEarth.value;
        const sp = SN.chieu(mesh.material, [cc.pos[0] + ed.x * 50, cc.pos[1] + ed.y * 50, cc.pos[2] + ed.z * 50], [0, 0, 0]);
        const lead = 0.35 * (1 - ease((S - 172) / 6));
        const hx = mix(0.5, sp[0], 1 - lead * 0), hy = mix(0.5, sp[1], 1 - lead * 0);
        const h = S < 165 ? [0.5, 0.47] : [mix(0.5, hx, ease((S - 165) / 6)), mix(0.47, hy, ease((S - 165) / 6))];
        SN.tiaDat(h, [], a * (S < 176 ? 1 : 1 - ease((S - 179) / 2)), 2.1, 0);
        const zb = Math.pow(ease((S - 176.5) / 4.5), 2);
        SN.gradeMix({ exp: 1.1, bloom: 0.9, thr: 1.1, streak: 0.5, sat: 1.08, con: 1.08, vig: 0.42, grain: 0.035, ca: 0.012 + 0.04 * zb, bars: 1, lift: [0.008, 0.01, 0.016], gain: [1.02, 1.0, 0.98], zoom: zb * 0.9, zc: [h[0], h[1]] }, a);
      },
    });
  });
})();
