'use strict';
// CẬN CẢNH BẬU CỬA (S 240–251): đốm sáng cuối cùng bay qua song cửa, đậu vào lòng chiếc kẹp tóc càng cua đứng trên bậu.
// Kẹp dựng theo kẹp thật của em (video anh Quang gửi): kẹp lớn, nhựa mờ trắng sữa hơi hồng, nhìn ngang ra hình chữ thập
// (thân chữ nhật dài, hai tay cầm xoè ra hai bên), răng lược nhựa trong cài so le, bản lề nhựa trong nhiều đốt,
// lò xo đồng nằm ngang giữa hai tay cầm, xỏ qua một vòng thép chữ D.
// Đốm sáng đậu vào giữa hai tay cầm: nhựa mờ hứng sáng, cả chiếc kẹp hồng lên như một ngọn đèn nhỏ;
// ánh sáng lọt qua răng nhựa trong tách màu, in một cung cầu vồng có vạch răng lược lên bậu.
// Dựng bằng hàm khoảng cách (SDF) dò tia. Đơn vị: mét. Tường là mặt z = 0 (trong phòng là z > 0), bậu cửa là mặt y = 0.
(() => {
  const SN = window.SN, { clamp, mix, ease, io, ramp } = SN.u;
  const FRAG = `
  uniform vec3 uMote; uniform float uMoteI, uRain, uFoc, uBlur, uLand;
  uniform vec3 uKC; uniform vec2 uKR;      // chỗ kẹp đứng trên bậu, góc xoay (cos, sin)
  const vec3 MOON = normalize(vec3(-.35, .62, -.7));
  float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
  float sdRB(vec2 p, vec2 b, vec4 r){ r.xy = (p.x > 0.) ? r.xy : r.zw; r.x = (p.y > 0.) ? r.x : r.y; vec2 q = abs(p) - b + r.x; return min(max(q.x, q.y), 0.) + length(max(q, 0.)) - r.x; }
  float giao(float a, float b, float r){ vec2 w = vec2(a + r, b + r); return min(max(w.x, w.y), 0.) + length(max(w, 0.)) - r; }
  float smin(float a, float b, float k){ float h = sat(.5 + .5 * (b - a) / k); return mix(b, a, h) - k * h * (1. - h); }
  // ---- kẹp càng cua (hệ toạ độ riêng: x dọc thân, y lên, z ngang; mỗi nửa s = ±1 là một má) ----
  const float KL = .0525, KYC = .0215, KHY = .0195, KHZ = .0145, KT = .0012;
  const float TY = .0405;               // độ cao bản lề
  const vec2 TD = vec2(.707, .707);     // hướng tay cầm xoè (ngang, lên)
  const float TLEN = .028;
  const float LY = .0466;               // trục lò xo
  vec3 kepLocal(vec3 p){ vec3 q = p - uKC; return vec3(uKR.x * q.x - uKR.y * q.z, q.y, uKR.y * q.x + uKR.x * q.z); }
  // (khoảng cách, vật liệu): 2 nhựa mờ, 3 nhựa trong, 4 đồng
  vec2 kepQ(vec3 q){
    float bb = sdBox(q - vec3(0., .029, 0.), vec3(.056, .031, .032));
    if (bb > .004) return vec2(bb, 2.);
    float shell = abs(sdRB(vec2(q.z, q.y - KYC), vec2(KHZ, KHY), vec4(.006, .0125, .006, .0125))) - KT;
    float sil = sdRB(vec2(q.x, q.y - KYC), vec2(KL, KHY + KT + .001), vec4(.0045));
    float base = giao(shell, sil, .0006);
    float cl = abs(sdRB(vec2(q.z, q.y - KYC), vec2(KHZ, KHY), vec4(.006, .0125, .006, .0125)));   // khoảng cách tới đường giữa vỏ
    float mo = 1e9, tr = 1e9;
    for (int i = 0; i < 2; i++) {
      float s = i == 0 ? 1. : -1.;
      float zs = q.z * s;
      float wall = q.y > KYC ? max(base, .0011 - zs) : max(base, .0082 - q.y);   // nửa dưới: nhựa mờ dừng ở đây, bên dưới là răng
      // tay cầm: tấm phẳng hơi lõm (chỗ đặt ngón tay), xoè chéo lên
      vec2 rel = vec2(zs, q.y) - vec2(.003, TY);
      float u = dot(rel, TD), v = dot(rel, vec2(-TD.y, TD.x));
      float uk = clamp(u / TLEN, 0., 1.);
      float hw = .024 - .004 * uk;
      float pl = sdRB(vec2(q.x, u - TLEN * .5), vec2(hw, TLEN * .5), vec4(.0035));
      float tab = giao(pl, abs(v + .0016 * sin(uk * 3.1416)) - .0012, .0006);
      wall = smin(wall, tab, .0015);
      mo = min(mo, wall);
      // răng lược nhựa trong: 7 răng mỗi má, so le với má kia, đầu răng vòng qua giữa
      float xs = q.x - s * .00375;
      float k = clamp(floor(xs / .015 + .5), -3., 3.);
      float lx = xs - k * .015;
      float th = length(vec2(cl, lx / 1.35)) - .0019;                 // ngón răng tròn, cong theo vỏ
      th = giao(th, -(zs + .0104), .0017);
      th = max(th, q.y - .0095);
      tr = min(tr, th);
    }
    // bản lề nhựa trong: các đốt xen kẽ
    float kn = max(length(q.yz - vec2(TY, 0.)) - .0028, abs(q.x) - .0105);
    kn = max(kn, .00012 - abs(fract((q.x + .0105) / .0042 + .5) - .5) * .0042);
    tr = min(tr, kn);
    // lò xo đồng quấn dọc theo chốt bản lề, xỏ qua vòng thép chữ D nằm dọc bên cạnh
    vec3 c = q - vec3(0., LY, 0.);
    float me = sdBox(c, vec3(.0125, .0035, .0075));
    if (me < .002) {
      float r = length(c.yz), a = atan(c.z, c.y);
      float f = (fract(c.x / .0021 - a / 6.2832 + .5) - .5) * .0021;
      float coil = max(length(vec2(r - .0026, f)) - .00048, abs(c.x) - .0105);
      float dl = abs(sdRB(vec2(c.x, c.z + .003), vec2(.0118, .003), vec4(0., .003, 0., .003)));
      me = min(coil, length(vec2(dl, c.y)) - .00055);
    }
    float d = min(mo, min(tr, me));
    return vec2(d, d == mo ? 2. : (d == tr ? 3. : 4.));
  }
  float dKep(vec3 p){ return kepQ(kepLocal(p)).x; }
  // ---- phòng: tường, lỗ cửa, bậu, khung ----
  float sdPhong(vec3 p){
    float wall = p.z;
    float hole = sdBox(p - vec3(0., .65, -.11), vec3(.55, .65, .3));
    float d = max(wall, -hole);
    d = max(d, -(p.z + .23));
    float sill = sdBox(p - vec3(0., -.03, -.08), vec3(.6, .03, .17));
    float ledge = sdBox(p - vec3(0., -.018, .03), vec3(.62, .018, .035));
    d = min(d, min(sill, ledge));
    float frame = sdBox(p - vec3(0., .65, -.175), vec3(.56, .66, .02));
    frame = max(frame, -sdBox(p - vec3(0., .65, -.175), vec3(.5, .6, .05)));
    d = min(d, frame);
    return d;
  }
  vec2 map(vec3 p){ float a = sdPhong(p); vec2 b = kepQ(kepLocal(p)); return a < b.x ? vec2(a, 1.) : b; }
  vec3 norK(vec3 p){ const vec2 k = vec2(1., -1.); const float e = .00015; return normalize(k.xyy * dKep(p + k.xyy * e) + k.yyx * dKep(p + k.yyx * e) + k.yxy * dKep(p + k.yxy * e) + k.xxx * dKep(p + k.xxx * e)); }
  vec3 norPh(vec3 p){ vec2 e = vec2(.0008, 0.); return normalize(vec3(sdPhong(p + e.xyy) - sdPhong(p - e.xyy), sdPhong(p + e.yxy) - sdPhong(p - e.yxy), sdPhong(p + e.yyx) - sdPhong(p - e.yyx))); }
  // bóng mềm; kẹp là nhựa mờ nên chỉ chắn bớt (để lọt khoảng 4 phần 10)
  float bong(vec3 ro, vec3 rd, float tmax){
    float rR = 1., rK = 1., t = .0015 + .003 * h12(gl_FragCoord.xy + uSeed);
    for (int i = 0; i < 30; i++) {
      vec3 p = ro + rd * t;
      float a = sdPhong(p), b = dKep(p);
      rR = min(rR, 8. * a / t); rK = min(rK, 3. * b / t);
      t += clamp(min(a, b) * .8, .0012, .04);
      if (rR < .01 || t > tmax) break;
    }
    rR = sat(rR); rK = sat(rK);
    return rR * rR * (3. - 2. * rR) * mix(.42, 1., rK * rK * (3. - 2. * rK));
  }
  // song sắt (tính riêng, có nhoè theo độ xa tiêu cự)
  float songSat(vec3 ro, vec3 rd, out float tHit){
    float cov = 0.; tHit = 1e9;
    for (int i = -4; i <= 4; i++) {
      float x0 = float(i) * .11;
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
  vec3 phoMau(float t){ return sat3(vec3(abs(t * 6. - 3.) - 1., 2. - abs(t * 6. - 2.), 2. - abs(t * 6. - 4.))); }
  // cung cầu vồng trên bậu: ánh đốm sáng lọt qua răng nhựa trong, tách màu; răng lược in thành những vạch mảnh toả ra
  vec3 cauVong(vec3 p, vec3 n){
    vec3 v = p - uKC;
    float r = length(v.xz);
    vec2 dir = v.xz / max(r, 1e-4);
    float sector = smoothstep(.4, .92, dot(dir, normalize(vec2(-.75, 1.))));
    float t = (r - .07) / .042;
    float band = smoothstep(0., .28, t) * smoothstep(1., .68, t);
    float phi = atan(dir.y, dir.x);
    float comb = .62 + .38 * smoothstep(-.2, .6, sin(phi * 46. + 2.5 * pn(vec3(phi * .7, r * 18., .3))));
    float sp = .7 + .55 * smoothstep(-.3, .5, pn(vec3(p * 70.)));
    vec3 c = mix(phoMau(.78 * (1. - sat(t))), vec3(.75), .12);
    return c * band * sector * comb * sp * max(n.y, 0.) * uRain;
  }
  vec3 anhSang(vec3 p, vec3 n, vec3 alb, float ao, bool full){
    vec3 col = vec3(0.);
    float sh = 1., bar = 0., tb;
    if (full) { sh = bong(p + n * .002, MOON, .5); bar = songSat(p + n * .002, MOON, tb); }
    col += alb * vec3(.32, .4, .55) * max(dot(n, MOON), 0.) * sh * (1. - bar * .9) * 1.4;
    vec3 lm = uMote - p; float l2 = dot(lm, lm); vec3 ld = lm * inversesqrt(l2);
    float shm = full ? bong(p + n * .002, ld, sqrt(l2) - .004) : 1.;
    col += alb * vec3(1., .72, .42) * max(dot(n, ld), 0.) * shm * uMoteI * .0075 / (l2 + .0004);
    col += alb * vec3(.22, .3, .5) * max(dot(n, normalize(vec3(-.8, .3, .6))), 0.) * .18;
    col += alb * vec3(.03, .035, .05) * ao;
    col += alb * cauVong(p, n) * 1.5 * uMoteI;
    return col;
  }
  // nhựa mờ trắng sữa: hứng sáng cả hai mặt, tán sáng trong khối, viền dày sáng hơn, nhám, lấm tấm hạt nhũ
  // nhìn xuyên lớp nhựa mờ: lờ mờ thấy má bên kia, răng, lò xo; càng xa sau lớp nhựa càng nhoè (độ phủ mềm theo hình nón)
  vec3 toMo(vec3 x){
    float mt = kepQ(kepLocal(x)).y;
    vec3 lm = uMote - x; float l2 = dot(lm, lm);
    vec3 E = vec3(1., .72, .45) * uMoteI * .012 / (l2 + .0009);
    vec3 al = mt > 3.5 ? vec3(1., .74, .4) * 1.4 : vec3(.92, .84, .87);
    return al * (E * .07 + vec3(.06, .07, .09)) + vec3(1., .74, .52) * uMoteI * exp(-sqrt(l2) / .015) * .25 * uLand;
  }
  vec3 xuyen(vec3 p, vec3 rd){
    float tt = .0004;
    for (int k = 0; k < 10; k++) { float d = dKep(p + rd * tt); if (d > .0002) break; tt += max(-d, .0003) + .0002; }
    float cv = 0.; vec3 pc = p; bool ra = false, cham = false;
    for (int k = 0; k < 26; k++) {
      vec3 x = p + rd * tt; float d = dKep(x);
      if (d > .0012) ra = true;
      if (ra) { float c = 1. - smoothstep(0., 1., d / (tt * .12 + .0003)); if (c > cv) { cv = c; pc = x; } }
      if (d < .0002 && ra) { cham = true; break; }
      if (tt > .07) break;
      tt += max(d, .0004);
    }
    vec3 hc = toMo(pc);
    if (cham) return hc;
    vec3 q = p + rd * tt; float t2 = 0.;
    for (int k = 0; k < 16; k++) { float dd = sdPhong(q + rd * t2); if (dd < .0008 || t2 > 1.5) break; t2 += dd; }
    vec3 pp = q + rd * t2;
    vec3 bg = t2 < 1.5 ? anhSang(pp, norPh(pp), vec3(.5, .47, .42), 1., false) : ngoai(rd);
    return mix(bg, hc, cv);
  }
  // hoa nhí in dưới lớp nhựa nhám (như kẹp thật của em): hoa hồng năm cánh nhỏ, cành lá xanh rêu, in mờ
  vec3 hoaNhi(vec2 uv, vec3 nen){
    vec3 col = nen;
    vec2 g = uv / .0085, id = floor(g);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 c = id + vec2(float(i), float(j));
      float h = h12(c * 1.37 + 4.1), h2 = h12(c * 2.71 + 9.3), h3 = h12(c + 17.7);
      vec2 d = (g - (c + .5 + (vec2(h, h2) - .5) * .7)) * .0085;
      float ang = h3 * 6.2832;
      vec2 l = vec2(cos(ang) * d.x + sin(ang) * d.y, -sin(ang) * d.x + cos(ang) * d.y);
      float big = mix(.0021, .0031, h2);
      for (int k = 0; k < 3; k++) {                       // lá mảnh quanh hoa
        float la = ang + float(k) * 2.1 + h * 1.3;
        vec2 dir = vec2(cos(la), sin(la));
        vec2 lp = d - dir * (big + .0021);
        float leaf = length(vec2(dot(lp, dir), dot(lp, vec2(-dir.y, dir.x))) / vec2(.0019, .00062)) - 1.;
        float fl = (1. - smoothstep(-.2, .2, leaf)) * step(.3, h12(c + float(k) * 3.3));
        col = mix(col, vec3(.6, .66, .42), fl * .7);
      }
      if (h > .22) {                                      // hoa
        float r = length(l), th = atan(l.y, l.x);
        float pet = r - big * (.6 + .4 * abs(cos(th * 2.5)));
        float f = 1. - smoothstep(-.00025, .00025, pet);
        vec3 pc = mix(vec3(.97, .7, .79), vec3(.9, .5, .63), smoothstep(big * .95, big * .3, r));
        pc = mix(pc, vec3(.98, .9, .82), smoothstep(big * .26, big * .08, r));
        col = mix(col, pc, f * .85);
      }
    }
    return col;
  }
  // nhựa mờ trắng sữa: hứng sáng cả hai mặt, tán sáng trong khối, viền dày sáng hơn, nhám, lấm tấm hạt nhũ
  vec3 nhuaMo(vec3 p, vec3 n, vec3 rd){
    vec3 q = kepLocal(p), v = -rd;
    float nv = abs(dot(n, v));
    vec3 nL = vec3(uKR.x * n.x - uKR.y * n.z, n.y, uKR.y * n.x + uKR.x * n.z);
    vec2 uv = abs(nL.z) > .7 ? q.xy : vec2(q.x, q.z * 1.18 + q.y * .3);
    vec3 alb = hoaNhi(uv, vec3(.93, .87, .89)) * (.95 + .1 * pn(q * 260.));
    vec3 lm = uMote - p; float l2 = dot(lm, lm), lD = sqrt(l2); vec3 ld = lm / lD;
    float shm = bong(p + n * .0015, ld, lD - .004);
    float nl = dot(n, ld);
    vec3 E = vec3(1., .72, .45) * uMoteI * .012 / (l2 + .0009);
    vec3 col = alb * E * (max(nl, 0.) + max(-nl, 0.) * .7) * mix(.5, 1., shm) * .085;
    col += vec3(1., .74, .52) * uMoteI * exp(-lD / .016) * (.06 + .3 * uLand);            // sáng lan trong lòng nhựa
    float sh = bong(p + n * .0015, MOON, .5), tb; float bar = songSat(p + n * .0015, MOON, tb);
    float ml = dot(n, MOON);
    col += alb * vec3(.32, .4, .55) * (max(ml, 0.) + max(-ml, 0.) * .45) * sh * (1. - bar * .85) * .8;
    col += alb * vec3(.22, .3, .5) * (dot(n, normalize(vec3(-.8, .3, .6))) * .5 + .5) * .1;
    col += alb * vec3(.03, .035, .045);
    float tr = .42 * nv;                                                                      // nhìn thẳng thì thấu hơn
    col = mix(col, xuyen(p, rd) * (alb / vec3(.93, .87, .89)) * vec3(.95, .93, .96), tr);
    col *= 1. + .9 * pow(1. - nv, 2.5);                                                       // mép tấm nhựa: dày hơn, sáng hơn
    vec3 hm = normalize(ld + v), hn = normalize(MOON + v);
    col += vec3(1., .82, .62) * pow(max(dot(n, hm), 0.), 26.) * E * shm * .05;
    col += vec3(.5, .6, .8) * pow(max(dot(n, hn), 0.), 18.) * sh * .1;
    float fr = .04 + .96 * pow(1. - nv, 5.);
    col += ngoai(reflect(rd, n)) * fr * .3;
    vec3 gc = floor(q * 2600.); float g = h13(gc);
    col += step(.985, g) * vec3(1., .95, .9) * pow(max(dot(n, hm), 0.), 4.) * (E * .06 + .25) * (.5 + .5 * sin(h13(gc + 5.) * 40. + uS * 2.));  // nhũ li ti  // hạt nhũ
    return col;
  }
  // đồng: lò xo, vòng chữ D
  vec3 dong(vec3 p, vec3 n, vec3 rd){
    vec3 base = vec3(1., .74, .4) * .85;
    vec3 rf = reflect(rd, n);
    vec3 lm = uMote - p; float l2 = dot(lm, lm); vec3 ld = lm * inversesqrt(l2);
    vec3 col = base * (ngoai(rf) * .7 + vec3(.05, .045, .04));
    col += base * vec3(1., .75, .45) * uMoteI * (.012 / (l2 + .0006)) * (max(dot(n, ld), 0.) * .12 + pow(max(dot(rf, ld), 0.), 40.) * .6);
    col += base * vec3(.5, .6, .8) * pow(max(dot(rf, MOON), 0.), 30.) * .8;
    return col;
  }
  // nhựa trong (răng, bản lề): phản chiếu + khúc xạ tách màu + viền sáng
  vec3 nhuaTrong(vec3 p, vec3 n, vec3 rd){
    float nv = max(dot(-rd, n), 0.);
    float fr = .04 + .96 * pow(1. - nv, 5.);
    vec3 bgc = vec3(0.);
    for (int c = 0; c < 3; c++) {
      vec3 rr = refract(rd, n, 1. / (1.49 + float(c) * .018));
      if (dot(rr, rr) < .5) rr = reflect(rd, n);
      rr = normalize(rr + n * -.35);                                   // khối tròn: bẻ tia mạnh như thấu kính
      float t2 = 0.; vec3 q = p + rr * .004;
      for (int k = 0; k < 24; k++) { float dd = sdPhong(q + rr * t2); if (dd < .0006 || t2 > 1.5) break; t2 += dd; }
      vec3 pp = q + rr * t2;
      vec3 cc = t2 < 1.5 ? anhSang(pp, norPh(pp), vec3(.5, .47, .42), 1., false) : ngoai(rr);
      bgc[c] = cc[c];
    }
    float edge = pow(1. - nv, 1.6);
    bgc *= (1. - .85 * edge) * vec3(.8, .83, .88);                    // mép khối nhựa trong tối lại (phản xạ toàn phần bên trong)
    vec3 rf = reflect(rd, n);
    vec3 lm = uMote - p; float l2 = dot(lm, lm); vec3 ld = lm * inversesqrt(l2);
    vec3 env = ngoai(rf) * .9 + vec3(.5, .6, .8) * pow(max(dot(rf, MOON), 0.), 60.) * 1.4;
    vec3 col = mix(bgc, env, fr);
    col += vec3(1., .8, .55) * uMoteI * (.012 / (l2 + .0006)) * pow(max(dot(rf, ld), 0.), 90.) * .9;   // chấm sáng gắt trên mặt nhựa
    col += vec3(1., .78, .52) * uMoteI * exp(-sqrt(l2) / .02) * .12 * uLand;
    col += vec3(1., .8, .58) * pow(1. - nv, 4.) * uMoteI * (.04 + .12 * uLand);                          // viền sáng
    col += phoMau(fract(edge * 1.7 + .1)) * pow(edge, 2.) * uRain * .18;
    return col;
  }
  void main(){
    vec3 ro = uCP, rd = tiaNhin(vUv);
    float t = 0.; vec2 h = vec2(0.);
    for (int i = 0; i < 120; i++) { h = map(ro + rd * t); if (h.x < .00025 * t || t > 4.) break; t += h.x * .9; }
    vec3 col;
    float tb; float bar = songSat(ro, rd, tb);
    if (t < 4. && h.y < 1.5) {
      vec3 p = ro + rd * t, n = norPh(p);
      vec3 alb = vec3(.62, .58, .5) * (.88 + .2 * pn(vec3(p * 18.)));
      if (p.y < .002 && p.z < .07) alb = vec3(.5, .47, .42) * (.85 + .25 * pn(vec3(p * 30.)) + .1 * pn(vec3(p * 120.)));
      if (p.z < -.15) alb = vec3(.06, .1, .09);
      float ao = clamp(sdPhong(p + n * .02) / .02, .2, 1.) * mix(.55, 1., sat(dKep(p + n * .01) / .012));
      col = anhSang(p, n, alb, ao, true);
      if (bar > .01 && tb < t) col = mix(col, vec3(.01, .012, .014), bar);
    } else if (t < 4.) {
      vec3 p = ro + rd * t, n = norK(p);
      col = h.y < 2.5 ? nhuaMo(p, n, rd) : (h.y < 3.5 ? nhuaTrong(p, n, rd) : dong(p, n, rd));
      if (bar > .01 && tb < t) col = mix(col, vec3(.012, .014, .016), bar);
    } else {
      col = ngoai(rd);
      if (bar > .01) col = mix(col, vec3(.01, .012, .014), bar);
    }
    // đốm sáng: quả cầu ấm, quầng mềm (đậu xuống rồi thì thu nhỏ quầng lại, để nhìn rõ chiếc kẹp)
    vec3 om = uMote - ro; float tm = dot(om, rd);
    if (tm > 0. && (tm < t + .01 || t > 4.)) { float dm = length(om - rd * tm); float s2 = mix(.000012, .000005, uLand); col += vec3(1., .78, .5) * (exp(-dm * dm / s2) * mix(9., 6., uLand) + exp(-dm / mix(.005, .0028, uLand)) * mix(1.4, .7, uLand) + exp(-dm / .03) * mix(.25, .07, uLand)) * uMoteI; }
    gl_FragColor = vec4(col, 1.);
  }`;
  // kẹp đứng trên bậu, xoay chếch để thấy được cả hình chữ thập lẫn lò xo
  const KC = [0.03, 0, -0.065], KA = 0.1;
  const kCos = Math.cos(KA), kSin = Math.sin(KA);
  const kw = (x, y, z) => [KC[0] + kCos * x + kSin * z, KC[1] + y, KC[2] - kSin * x + kCos * z];
  const DAU = kw(0, 0.0545, 0);   // chỗ đốm sáng đậu: lòng chữ V giữa hai tay cầm, ngay trên lò xo
  const CAMK = SN.duong([
    // S, x, y, z, nhìn x, nhìn y, nhìn z, góc nhìn
    [240.0, 0.249, 0.3, 0.225, 0.02, 0.075, -0.09, 34],
    [243.6, 0.209, 0.229, 0.13, 0.03, 0.035, -0.068, 30],
    [251.0, 0.178, 0.204, 0.08, 0.03, 0.03, -0.065, 26.5],
  ]);
  const MOTEK = SN.duong([
    [240.0, 0.14, 0.62, -1.1],
    [241.4, 0.09, 0.36, -0.55],
    [242.5, 0.058, 0.17, -0.17],
    [243.15, DAU[0] + 0.008, DAU[1] + 0.03, DAU[2] - 0.022],
    [243.6, DAU[0], DAU[1], DAU[2]],
    [251.0, DAU[0], DAU[1], DAU[2]],
  ]);
  // LAN: ?kc=x,y,z,nx,ny,nz,góc để soi kẹp từ góc khác
  const KCQ = SN.NHA && SN.Q.get('kc') ? SN.Q.get('kc').split(',').map(Number) : null;
  SN.dung.push((T) => {
    const mesh = SN.quad(FRAG, {
      uMote: { value: new T.Vector3() }, uMoteI: { value: 1 }, uRain: { value: 0 }, uFoc: { value: 0.3 }, uBlur: { value: 0.03 }, uLand: { value: 0 },
      uKC: { value: new T.Vector3(KC[0], KC[1], KC[2]) }, uKR: { value: new T.Vector2(kCos, kSin) },
    }, { low: true });
    const low = SN.lowres(mesh, SN.HQ ? 1 : (SN.DT ? 0.55 : 0.7));
    SN.them({
      ten: 'kep', tu: 239.9, den: 251.2, lop: 80, low, warmS: 246,
      a: (S) => ramp(S, 240.1, 241.3) * (1 - ramp(S, 248.7, 250.9)),
      cap(S, a) {
        const u = mesh.material.uniforms;
        const c = KCQ || CAMK(S);
        SN.camQuad(mesh.material, [c[0], c[1], c[2]], [c[3], c[4], c[5]], [0, 1, 0], c[6]);
        SN.uChung.uPxA.value = 2 * Math.tan(c[6] * Math.PI / 360) / Math.max(1, SN.size()[1]);
        const land = ease((S - 243.2) / 1.1);
        const m = MOTEK(S), amp = mix(0.003, 0.0007, land);
        u.uMote.value.set(m[0] + Math.sin(S * 2.1) * amp, m[1] + Math.sin(S * 1.4) * amp * 1.3, m[2] + Math.sin(S * 1.7 + 1) * amp * 0.6);
        u.uMoteI.value = 1 + 0.1 * Math.sin(S * 3.1);
        u.uLand.value = land;
        u.uRain.value = ease((S - 243.8) / 1.8);
        u.uFoc.value = Math.hypot(c[0] - c[3], c[1] - c[4], c[2] - c[5]);
        SN.gradeMix({ exp: 1.15, bloom: 0.9, thr: 1.0, streak: 0.25, sat: 1.05, con: 1.05, vig: 0.5, grain: 0.035, ca: 0.01, bars: 0, lift: [0.012, 0.012, 0.018], gain: [1.02, 1.0, 0.98], warm: 0.3 }, a);
      },
    });
  });
})();
