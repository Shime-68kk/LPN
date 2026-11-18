'use strict';
// SAO THỔ (S 145–182). Sau cú quăng quanh hố đen, tia sáng vút lên giữa vũ trụ (để trọn cảm giác bay):
//  146–157 bay giữa trời sao và dải Ngân Hà; phía trước Mặt Trời là ngôi sao sáng nhất, sao Thổ còn nhỏ bên cạnh.
//  158–161 lướt sát trên vành sao Thổ vài chục mét: biển hạt băng tròn, sáng trong, nhiều cỡ, viền loé nắng, lấp lánh,
//          trôi qua dưới chân (không lao vào mặt), xa dần hoà vào mặt vành.
//  162.5   vút lên khỏi vành, Mặt Trời trượt ra sau mép hành tinh (loé "nhẫn kim cương") → sao Thổ ngược sáng như ảnh Cassini,
//          một chấm xanh nhỏ là Trái Đất; 176–182 lao về chấm xanh.
// Đơn vị hành tinh: 1000 km. Bán kính xích đạo 60.3, cực 54.4. Vành: C 74.5–92, B 92–117.5, khe Cassini, A 122–136.8, F 140.2.
// Lớp hạt băng tính theo mét quanh máy quay (độ cao máy quay trên mặt vành tính theo mét).
(() => {
  const SN = window.SN, M = SN.M, { clamp, mix, ease, io, ramp } = SN.u;
  const FRAG = `
  uniform vec3 uSunD;     // hướng tới Mặt Trời
  uniform vec3 uEarth;    // hướng tới Trái Đất (chấm xanh)
  uniform float uEarthK;  // độ sáng chấm xanh (to dần khi lao tới)
  uniform vec3 uFOff;     // gốc lưới hạt băng (mét), trôi theo hướng bay
  uniform float uHm;      // độ cao máy quay trên mặt phẳng vành (mét)
  uniform float uHat;     // độ hiện lớp hạt băng
  uniform float uDen;     // mật độ hạt (theo độ dày vành chỗ máy quay)
  const float RE = 60.3, RP = 54.4;
  vec2 elip(vec3 ro, vec3 rd){ vec3 s = vec3(1., RE / RP, 1.); vec3 o = ro * s, d = rd * s; float a = dot(d, d), b = dot(o, d), c = dot(o, o) - RE * RE, h = b * b - a * c; if (h < 0.) return vec2(-1.); h = sqrt(h); return vec2(-b - h, -b + h) / a; }
  float vanhF(float r, float fr){ // độ dày quang học theo bán kính; fr = bề rộng một điểm ảnh theo bán kính (gợn nhỏ hơn thì gộp trung bình)
    float k3 = 1. - smoothstep(.15, .6, fr * 3.1), k9 = 1. - smoothstep(.15, .6, fr * 9.3), k4 = 1. - smoothstep(.15, .6, fr * 4.4), k17 = 1. - smoothstep(.1, .5, fr * 17.);
    float t = 0.;
    t += smoothstep(74.5, 75.5, r) * (1. - smoothstep(91.5, 92.2, r)) * (.12 + .08 * sin(r * 3.1) * k3);          // vành C
    t += smoothstep(92., 93., r) * (1. - smoothstep(117., 117.6, r)) * (1.1 + .7 * sin(r * 1.7) + .4 * sin(r * 9.3) * k9);   // vành B dày
    t += smoothstep(122., 122.4, r) * (1. - smoothstep(136.4, 136.8, r)) * (.55 + .2 * sin(r * 4.4) * k4) * (1. - .8 * exp(-sq((r - 133.6) / max(.2, fr))) * min(1., .2 / max(fr, .2)));  // vành A + khe Encke
    t += exp(-sq((r - 140.2) / max(.12, fr))) * .6 * min(1., .12 / max(fr, .12));                            // vành F
    t *= .75 + .5 * pn(vec3(r * 2.2, .3, .7)) + .3 * pn(vec3(r * 17., .1, .2)) * k17;                         // vô số vành con
    return max(t, 0.);
  }
  float vanh(float r){ return vanhF(r, 0.); }
  vec3 mauVanh(float r){ return r < 92. ? vec3(.55, .58, .62) : (r < 118. ? vec3(.9, .8, .62) : vec3(.75, .72, .66)); }
  bool bongTho(vec3 p){ return elip(p, uSunD).x > 0.; }
  vec3 vanhMau(vec3 ro, vec3 rd, out float tr, out float tHit){
    tr = 1.; tHit = 1e9;
    if (abs(rd.y) < 1e-5) return vec3(0.);
    float t = -ro.y / rd.y;
    if (t <= 0.) return vec3(0.);
    vec3 p = ro + rd * t; float r = length(p.xz);
    float tau = vanhF(r, fwidth(r));
    if (tau < .001) return vec3(0.);
    tHit = t;
    float mu = abs(rd.y), mu0 = max(abs(uSunD.y), .004);
    float a = 1. - exp(-tau / max(mu, .02));
    tr = 1. - a;
    float cosg = dot(rd, uSunD);
    float pha = .3 + 1.9 * pow(max(cosg, 0.), 6.) + .45 * pow(max(cosg, 0.), 2.);   // hạt băng tán xạ mạnh về phía trước
    vec3 c;
    if (ro.y * uSunD.y > 0.) c = mauVanh(r) * a * (mu0 / (mu0 + mu)) * pha * 1.7;   // nhìn mặt được nắng: phản xạ (sáng dần sát chân trời)
    else { float through = exp(-tau * .9); c = mauVanh(r) * a * pha * (.25 + 1.6 * through) * .6; }   // nhìn mặt kia: ánh xuyên vành
    c += mauVanh(r) * a * .012;
    if (dot(-p, uSunD) > 0.) { float bs = length(cross(p, uSunD) * vec3(1., RE / RP, 1.)); c *= mix(.05, 1., smoothstep(RE - 1.6, RE + 1.6, bs)); }   // bóng sao Thổ đổ lên vành, mép mềm
    // ánh hành tinh hắt lên vành (vàng nhạt)
    c += mauVanh(r) * a * vec3(.9, .75, .5) * .05 * smoothstep(140., 70., r);
    return c * mix(1.15, .85, uHat);
  }
  // ---- Mặt Trời: chấm sáng gắt + quầng; khuất sau hành tinh (mép mềm cho loé nhẫn kim cương) ----
  float matTroiVis(vec3 ro){
    float tc = dot(-ro, uSunD); if (tc < 0.) return 1.;
    vec3 cp = ro + uSunD * tc;
    float b = length(cp * vec3(1., RE / RP, 1.));
    return smoothstep(RE - .35, RE + .5, b);
  }
  vec3 hanhTinh(vec3 ro, vec3 rd, float t){
    vec3 p = ro + rd * t; vec3 n = normalize(p * vec3(1., (RE / RP) * (RE / RP), 1.));
    float lat = asin(clamp(p.y / RP, -1., 1.));
    float band = sin(lat * 18. + pn(vec3(lat * 6., p.x * .02, 1.)) * 2.) * .5 + .5;
    vec3 alb = mix(vec3(.82, .7, .5), vec3(.95, .86, .66), band) * (.85 + .3 * pn(vec3(lat * 40., p.x * .05, 2.)));
    float d = dot(n, uSunD);
    vec3 col = alb * max(d, 0.) * 1.5;
    // viền sáng khí quyển khi ngược sáng
    float ecl = 1. - matTroiVis(ro);
    float rim = pow(1. - max(dot(n, -rd), 0.), 6.) * pow(max(dot(rd, uSunD), 0.), 2.) * smoothstep(-.3, .55, dot(n, uSunD) + .8 * ecl);
    col += vec3(1., .85, .6) * rim * 3.5;
    // phía đêm: ánh vành hắt (rất mờ), bóng vành đổ lên hành tinh
    col += alb * vec3(.6, .55, .45) * .025 * (.5 + .5 * n.y * sign(p.y + .001));
    float tv = -p.y / uSunD.y; vec3 pr = p + uSunD * tv; float sr = length(pr.xz);
    if (tv > 0.) col *= mix(1., exp(-vanh(sr) * 1.5), .9);
    return col;
  }
  // ---- biển hạt băng (mét): các lớp ngang trong bề dày vành, mỗi ô tối đa một hạt tròn; vẽ từ lớp trên xuống ----
  vec4 hatBang(vec3 rd){
    vec4 acc = vec4(0.);
    if (rd.y > -1e-4) return acc;
    vec3 eye = vec3(0., uHm, 0.);
    for (int k = 0; k < 8; k++) {
      float fk = float(k);
      // 6 lớp tảng (cao → thấp) rồi 2 lớp hạt li ti sát mặt vành cho mặt vành có độ lấm tấm
      float yk = k < 6 ? (2.5 - fk) * 2.1 : -.4 - (fk - 6.) * 1.3;
      float c = k < 6 ? 6.5 + fk * 2.2 : 1.9 + (fk - 6.) * 1.1;
      float t = (yk - uHm) / rd.y;
      if (t <= 0.) continue;
      vec2 hp = rd.xz * t + uFOff.xz;
      vec2 cid = floor(hp / c);
      vec4 h = h43(vec3(cid, fk * 7.13 + 3.1));
      if (h.w > uDen) continue;
      float R = k < 6 ? c * (.035 + .23 * pow(h.z, 3.6)) : c * (.05 + .1 * h.z);   // phần lớn hạt nhỏ, lác đác hạt to
      vec2 cc = (cid + .5 + (h.xy - .5) * max(1. - 2.4 * R / c, 0.)) * c;  // tâm (nằm gọn trong ô)
      vec3 P = vec3(cc.x - uFOff.x, yk + (fract(h.x * 7.31) - .5) * 1.2, cc.y - uFOff.z);
      vec3 o = eye - P;
      float b = dot(o, rd), oo = dot(o, o);
      float tc = -b;
      if (tc <= 0.) continue;
      // hạt không tròn: bán kính đổi theo hướng (cục tuyết đá lồi lõm)
      vec3 cpv = o + rd * tc; float cpl = length(cpv);
      vec3 ud = cpv / max(cpl, 1e-4);
      float Rl = R * (1. + .34 * pn(ud * .28 + h.xyz * 11.) + .1 * pn(ud * .62 + h.zxy * 7.));
      float dmin = cpl - Rl;
      float pw = tc * uPxA * 1.1;
      float cov = 1. - smoothstep(-pw, pw, dmin);
      cov *= 1. - smoothstep(.5, 2.2, pw / R);                             // nhỏ hơn điểm ảnh: mặt vành đã gánh phần trung bình
      if (cov <= 0.) continue;
      float disc = b * b - (oo - Rl * Rl);
      vec3 n0 = disc > 0. ? normalize(o + rd * (-b - sqrt(disc))) : ud;
      vec3 n = normalize(n0 + .55 * vec3(pn(n0 * .34 + h.xyz * 5.), pn(n0 * .34 + h.yzx * 5. + 3.), pn(n0 * .34 + h.zxy * 5. + 7.)));
      // băng nước: trắng hơi xanh, mặt hướng nắng sáng, viền loé khi nhìn ngược nắng, lấp lánh tinh thể
      // băng tuyết nhám: mặt hướng nắng sáng, chuyển mềm sang tối; ngược nắng thì cả hạt trong và sáng dịu, mép sáng hơn
      float nl = dot(n, uSunD);
      vec3 ice = vec3(.78, .82, .88) * (.78 + .35 * h.x);
      float rim = pow(1. - max(dot(n0, -rd), 0.), 2.);
      float nguoc = pow(max(dot(rd, uSunD), 0.), 3.);
      float gr = .72 + .45 * (pn(n0 * 5.1 + h.xyz * 9.) + .5 * pn(n0 * 13. + h.yzx * 4.));   // mặt sần như tuyết
      vec3 cl = ice * gr * (smoothstep(-.15, .7, nl) * .95 + .02);
      cl += vec3(.75, .86, 1.) * nguoc * (.12 + .25 * rim) * gr;
      cl += vec3(1., .95, .88) * rim * smoothstep(0., .55, dot(n0, uSunD)) * 1.3;   // viền nắng ở phía hạt hướng về Mặt Trời
      cl += vec3(1.) * pow(max(dot(reflect(rd, n), uSunD), 0.), 40.) * 1.1 * step(.62, fract(h.y * 13.7));   // vài hạt lấp lánh
      cl += vec3(.9, .76, .52) * .02 * (.5 + .5 * n.y);                   // ánh sao Thổ hắt lên
      cl *= exp(-tc / 900.);
      acc.rgb += (1. - acc.a) * cl * cov;
      acc.a += (1. - acc.a) * cov;
      if (acc.a > .985) break;
    }
    return acc;
  }
  void main(){
    vec3 ro = uCP, rd = tiaNhin(vUv);
    vec3 col = bauTroiSao(rd, uPxA) * .7 + nganHa(rd, normalize(vec3(.4, .6, .7)), uPxA) * .25;
    // Mặt Trời: ngôi sao sáng nhất, gắt và nhỏ; quầng mềm
    float vis = matTroiVis(ro);
    float ca = dot(rd, uSunD), sa = sqrt(max(2. - 2. * ca, 0.));
    vec3 sun = vec3(1., .93, .82) * (exp(-sa * sa / (uPxA * uPxA * 2.2)) * 40. + exp(-sa / .0035) * 1.6 + exp(-sa / .03) * .22 + exp(-sa / .2) * .04);
    col += sun * vis;
    // Trái Đất: chấm xanh
    float de = length(rd - uEarth);
    col += vec3(.45, .62, 1.) * (exp(-de * de / (uPxA * uPxA * 1.6)) * 5. + exp(-de / (uPxA * 5.)) * .25) * uEarthK;
    // quầng sáng quanh hành tinh khi Mặt Trời nấp sau
    vec2 tp = elip(ro, rd);
    float b = length(cross(ro, rd)); float alt = b - RE;
    if (tp.x < 0.) { vec3 cn = normalize(ro + rd * max(dot(-ro, rd), 0.)); col += vec3(1., .85, .62) * exp(-max(alt, 0.) / 2.5) * pow(max(dot(rd, uSunD), 0.), 2.) * 1.2 * (1. - vis * .7) * smoothstep(-.3, .55, dot(cn, uSunD) + .8 * (1. - vis)) * (dot(-ro, rd) > 0. ? 1. : 0.); }
    float trR, tR; vec3 rc = vanhMau(ro, rd, trR, tR);
    if (tp.x > 0.) {
      vec3 pc = hanhTinh(ro, rd, tp.x);
      if (tR < tp.x) col = rc + trR * pc; else col = pc;
    } else col = rc + trR * col;
    // biển hạt băng khi lướt sát vành
    if (uHat > .001) {
      float hz = exp(-abs(rd.y) * 60.) * .04 * uHat;
      col += vec3(.75, .8, .88) * hz * (.4 + pow(max(dot(rd, uSunD), 0.), 2.));
      vec4 hb = hatBang(rd);
      col = col * (1. - hb.a * uHat) + hb.rgb * uHat;
    }
    // loé nhẫn kim cương: Mặt Trời đang trượt ra sau mép hành tinh
    float nhan = vis * (1. - vis) * 4.;
    col += vec3(1., .9, .75) * nhan * (exp(-sa / .006) * 3. + exp(-sa / .05) * .35);
    gl_FragColor = vec4(col * uA, uA);
  }`;
  const R = Math.PI / 180;
  const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  // Mặt Trời: phía sau sao Thổ nhìn từ phía máy quay (+z), cao hơn mặt phẳng vành 1.5°
  const SUN = nrm([0.08, 0.026, -1.0]);
  const PHI0 = Math.atan2(-SUN[0], -SUN[2]);   // phương đối diện Mặt Trời trên mặt phẳng vành
  // máy quay: [S, bán kính (1000 km), lệch khỏi trục đối Mặt Trời (độ), log10 độ cao trên mặt vành (mét),
  //            nhìn (0 về sao Thổ … 1 về Mặt Trời), lệch ngang (độ), ngóc (độ), nghiêng (độ), góc nhìn]
  const CK = SN.duong([
    [144.5, 1750, 12.5, 8.2, 0.42, 2, 2, -8, 52],
    [151.0, 1000, 15.0, 7.85, 0.5, 0, 0, 5, 50],
    [156.0, 340, 25.0, 6.9, 0.55, -3, -2, 7, 54],
    [158.3, 150, 35.0, 3.0, 0.5, -6, -6, 3, 62],
    [159.8, 134, 33.0, 1.72, 0.38, -8, -8, 0, 64],
    [161.0, 131, 30.0, 1.85, 0.4, -6, -7, -2, 64],
    [162.6, 145, 24.0, 6.2, 0.5, 0, -4, -4, 60],
    [166.0, 168, 15.0, 7.1, 0.3, 4, -8, -6, 56],
    [172.0, 180, 10.0, 7.38, 0.2, 6, -11, -4, 50],
    [176.0, 186, 9.0, 7.43, 0.2, 6, -12, -3, 48],
    [182.0, 190, 9.0, 7.45, 0.2, 6, -12, -3, 46],
  ]);
  const C = { pos: [0, 0, 0], tgt: [0, 0, 0], up: [0, 1, 0], fov: 60, hm: 1e9, r: 0 };
  function camAt(S) {
    const c = CK(S);
    const r = c[0], ph = PHI0 + c[1] * R, hm = Math.pow(10, c[2]), y = hm / 1e6;
    const pos = [Math.sin(ph) * r, y, Math.cos(ph) * r];
    const toS = nrm([-pos[0], -pos[1], -pos[2]]);
    let L = nrm([toS[0] + (SUN[0] - toS[0]) * c[3], toS[1] + (SUN[1] - toS[1]) * c[3], toS[2] + (SUN[2] - toS[2]) * c[3]]);
    const yaw = c[4] * R, pit = c[5] * R;
    const lx = L[0] * Math.cos(yaw) + L[2] * Math.sin(yaw), lz = -L[0] * Math.sin(yaw) + L[2] * Math.cos(yaw), hl = Math.hypot(lx, lz) || 1;
    const el = Math.atan2(L[1], hl) + pit;
    L = [lx / hl * Math.cos(el), Math.sin(el), lz / hl * Math.cos(el)];
    const rgt = nrm([-L[2], 0, L[0]]);
    const up0 = [rgt[1] * L[2] - rgt[2] * L[1], rgt[2] * L[0] - rgt[0] * L[2], rgt[0] * L[1] - rgt[1] * L[0]];
    const rl = c[6] * R;
    C.pos = pos; C.tgt = [pos[0] + L[0], pos[1] + L[1], pos[2] + L[2]];
    C.up = [up0[0] * Math.cos(rl) + rgt[0] * Math.sin(rl), up0[1] * Math.cos(rl) + rgt[1] * Math.sin(rl), up0[2] * Math.cos(rl) + rgt[2] * Math.sin(rl)];
    C.fov = c[7]; C.hm = hm; C.r = r;
    return C;
  }
  // độ dày vành chỗ máy quay (để biết có hạt băng hay khe trống)
  const dayVanh = (r) => { const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }; return ss(74.5, 76, r) * (1 - ss(91.5, 92.2, r)) * 0.25 + ss(92, 93, r) * (1 - ss(117, 117.6, r)) * 0.85 + ss(122, 122.6, r) * (1 - ss(136.2, 136.8, r)) * 0.62; };
  // sau khi khuất: Mặt Trời nấp đúng sau tâm sao Thổ nhìn từ máy quay lúc 172, hơi dưới mặt phẳng vành → vành sáng ngược, quầng trọn vòng
  const SUN_SAU = (() => { const p = camAt(172).pos.slice(); const t = nrm([-p[0], -p[1], -p[2]]); return nrm([t[0], t[1] + 0.02, t[2]]); })();
  SN.dung.push((T) => {
    const sunD = new T.Vector3(SUN[0], SUN[1], SUN[2]);
    const mesh = SN.quad(FRAG, { uSunD: { value: sunD }, uEarth: { value: new T.Vector3() }, uEarthK: { value: 0 }, uFOff: { value: new T.Vector3() }, uHm: { value: 1e9 }, uHat: { value: 0 }, uDen: { value: 0 } });
    const tr = [], sp = [0, 0, 0];
    SN.them({
      ten: 'sautho', tu: 144.8, den: 182, lop: 40, mesh, warmS: 159.8,
      a: (S) => ramp(S, 145.3, 147.9) * (1 - ramp(S, 180.6, 181.8)),
      cap(S, a) {
        const u = mesh.material.uniforms;
        // Mặt Trời đã khuất sau hành tinh (từ 162.9) thì hạ dần xuống dưới mặt phẳng vành: vành bừng sáng ngược (ánh xuyên),
        // không ai thấy Mặt Trời xê dịch vì nó đang nấp sau sao Thổ
        { const ky = ease((S - 162.9) / 3.2); const sd = nrm([SUN[0] + (SUN_SAU[0] - SUN[0]) * ky, SUN[1] + (SUN_SAU[1] - SUN[1]) * ky, SUN[2] + (SUN_SAU[2] - SUN[2]) * ky]); u.uSunD.value.set(sd[0], sd[1], sd[2]); }
        const c = camAt(S);
        const cc = { pos: c.pos.slice(), tgt: c.tgt.slice(), up: c.up.slice(), fov: c.fov, hm: c.hm, r: c.r };
        const f = SN.camQuad(mesh.material, cc.pos, cc.tgt, cc.up, cc.fov);
        const fx = f.f.slice(), rx = f.r.slice(), ux = f.u.slice();
        SN.uChung.uPxA.value = 2 * Math.tan(cc.fov * Math.PI / 360) / Math.max(1, SN.size()[1]);
        // biển hạt băng: chỉ khi sát mặt vành; trôi theo hướng bay (70 m/s, tích phân hướng bay để đúng chiều)
        u.uHm.value = cc.hm;
        u.uHat.value = (1 - ramp(Math.log10(cc.hm), 2.55, 3.2)) * (dayVanh(cc.r) > 0.05 ? 1 : 0);
        u.uDen.value = clamp(dayVanh(cc.r) * 0.62, 0, 0.6);
        let ox = 0, oz = 0; const n = 40, s0 = 157, s1 = clamp(S, s0, 163);
        for (let i = 0; i < n; i++) {
          const ta = s0 + (s1 - s0) * i / n, tb = s0 + (s1 - s0) * (i + 1) / n;
          const pa = camAt(ta).pos.slice(), pb = camAt(tb).pos;
          const dx = pb[0] - pa[0], dz = pb[2] - pa[2], dl = Math.hypot(dx, dz) || 1;
          ox += dx / dl * 70 * (tb - ta); oz += dz / dl * 70 * (tb - ta);
        }
        u.uFOff.value.set(ox, 0, oz);
        // Trái Đất: trước mặt, hơi dưới phải khung hình; to và sáng dần khi lao tới
        const e = [fx[0] * 0.92 + rx[0] * 0.3 - ux[0] * 0.22, fx[1] * 0.92 + rx[1] * 0.3 - ux[1] * 0.22, fx[2] * 0.92 + rx[2] * 0.3 - ux[2] * 0.22];
        if (S < 169) { const el = Math.hypot(...e); u.uEarth.value.set(e[0] / el, e[1] / el, e[2] / el); SN.saoTho_e = u.uEarth.value.clone(); }
        else if (SN.saoTho_e) u.uEarth.value.copy(SN.saoTho_e);
        u.uEarthK.value = ease((S - 168.5) / 2) * (1 + 6 * Math.pow(ease((S - 176) / 5.5), 2));
        // tia sáng: bay trước máy quay, hơi lệch dưới phải; đuôi là đường nó vừa đi (thấy rõ lúc vút giữa vũ trụ)
        const lech = ease((S - 146.4) / 2.2) * (1 - ease((S - 157) / 2));
        const spark = (t, out) => {
          const q = camAt(t + 0.55).pos;
          const dd = Math.hypot(q[0] - cc.pos[0], q[1] - cc.pos[1], q[2] - cc.pos[2]);
          out[0] = q[0] + (rx[0] * 0.05 - ux[0] * 0.03) * dd * lech; out[1] = q[1] + (rx[1] * 0.05 - ux[1] * 0.03) * dd * lech; out[2] = q[2] + (rx[2] * 0.05 - ux[2] * 0.03) * dd * lech;
          return out;
        };
        let h;
        if (S < 165) {
          // từ 156.3 máy quay bổ nhào xuống vành, điểm "phía trước trên đường bay" văng khỏi khung: tia trượt dần về giữa khung,
          // bay ngay trước mặt suốt đoạn lướt (đuôi thu dần vào đầu tia), khỏi vọt ra mép rồi bật lại
          const wg = ease((S - 156.3) / 1.6);
          const p0 = SN.chieu(mesh.material, spark(S, sp), [0, 0, 0]);
          const a0 = p0[2] > 0 ? [p0[0], p0[1]] : [0.5, 0.47];
          h = [mix(a0[0], 0.5, wg), mix(a0[1], 0.47, wg)];
          tr.length = 0;
          for (let k = 0; k < 14; k++) {
            const q = SN.chieu(mesh.material, spark(S - k * 0.05, [0, 0, 0]), [0, 0, 0]);
            tr.push(q[2] > 0 && wg < 0.999 ? [mix(q[0], h[0], wg), mix(q[1], h[1], wg)] : (wg >= 0.999 ? [h[0], h[1]] : [-9, -9]));
          }
          camAt(S);   // trả lại máy quay hiện tại cho các lệnh sau
        } else {
          const ed = u.uEarth.value;
          const pe = SN.chieu(mesh.material, [cc.pos[0] + ed.x * 50, cc.pos[1] + ed.y * 50, cc.pos[2] + ed.z * 50], [0, 0, 0]);
          const k5 = ease((S - 165) / 6);
          h = [mix(0.5, pe[0], k5), mix(0.47, pe[1], k5)]; tr.length = 0;
        }
        if (S > 146.6) {   // trọng số tăng dần từ 0: tia trượt mượt từ chỗ của cảnh hố đen sang
          const iT = a * (S < 176 ? 1 : 1 - ease((S - 179) / 2));
          SN.tiaDat(h, tr, iT, 2.1, lech, iT * ease((S - 146.6) / 1.2));
        }
        // hậu kỳ: vút đi giữa vũ trụ có nhoè hướng tâm nhẹ; cuối đoạn lao về chấm xanh
        const vut = Math.exp(-Math.max(0, S - 146) / 2.2) * 0.26 * ramp(S, 145, 146.5);
        const zb = Math.pow(ease((S - 176.5) / 4.5), 2);
        SN.gradeMix({ exp: 1.08, bloom: 0.9, thr: 1.1, streak: 0.62, sat: 1.08, con: 1.08, vig: 0.42, grain: 0.035, ca: 0.012 + 0.04 * zb, bars: 1, lift: [0.008, 0.01, 0.016], gain: [1.02, 1.0, 0.98], zoom: zb * 0.9 + vut, zc: [h[0], h[1]] }, a);
      },
    });
  });
})();
