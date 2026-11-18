'use strict';
// HỐ ĐEN (S 99–147). Cú đinh số 1.
// Mỗi điểm ảnh bắn một tia sáng và cho nó đi theo đường cong của không gian quanh hố đen (gần đúng Schwarzschild:
// gia tốc -1.5·h²·r/|r|⁵, đơn vị bán kính chân trời = 1). Tia cắt mặt phẳng đĩa thì cộng ánh sáng của đĩa khí;
// tia thoát ra xa thì lấy bầu trời sao theo hướng đã bị bẻ cong → vòng sáng Einstein, ảnh đĩa vòng qua trên và dưới bóng đen.
// Khác hố đen phim Interstellar (phim cố ý bỏ hiệu ứng này): giữ đúng hiệu ứng Doppler tương đối tính —
// phía đĩa lao về phía ta sáng gắt, ngả xanh trắng; phía lùi ra xa tối, ngả cam đỏ. Thêm lệch đỏ do hấp dẫn sát mép trong.
(() => {
  const SN = window.SN, { clamp, mix, ease, io, ramp } = SN.u;
  const FRAG = `
  uniform float uNB;         // số bước tối đa (theo máy)
  uniform float uDt;         // hệ số bước
  uniform float uT0;         // thời gian quay của đĩa
  uniform vec3 uMW;          // pháp tuyến dải Ngân Hà
  uniform vec3 uNeb;         // hướng tinh vân vừa đi qua (còn thấy sau lưng)
  uniform float uDisk;       // độ sáng đĩa
  uniform float uHalo;       // quầng khí mỏng quanh đĩa
  const float RIN = 3.0, ROUT = 14.0;

  // k: sao điểm bị thấu kính kéo dài thành cung mảnh (sao nằm ngay sau hố đen) thì mờ đi theo độ kéo, khỏi loé vệt xanh tím
  vec3 nen(vec3 d, float k){
    vec3 c = bauTroiSao(d, uPxA) * 1.1 * k;
    c += nganHa(d, uMW, uPxA) * .32;
    // tinh vân phía sau: mảng màu vàng – lam mờ
    float a = max(dot(d, uNeb), 0.);
    float blob = pow(a, 14.) * sat(.5 + 1.2 * fbm4(d * 3.1 + 1.7));
    c += mix(vec3(.32, .5, .62), vec3(.95, .7, .45), sat(fbm3(d * 5.3) * 1.5 + .5)) * blob * .3;
    // vài thiên hà rất xa: đốm bầu dục mờ
    vec3 g = d * 9.; vec3 gc = floor(g); vec4 hh = h43(gc + 91.);
    if (hh.w < .07) { vec3 gp = normalize((gc + .5) / 9.); float r = length(d - gp); c += vec3(.9, .85, 1.) * exp(-r * r / (uPxA * uPxA * 9.)) * .5 * k; }
    return c;
  }

  // ánh sáng đĩa khí tại điểm cắt hp, tia đang đi theo hướng vdir; trả về màu (đã nhân độ đặc) và độ đặc
  vec4 dia(vec3 hp, vec3 vdir, float fineK){
    float r = length(hp.xz);
    if (r < RIN * .97 || r > ROUT) return vec4(0.);
    float ang = atan(hp.z, hp.x);
    float om = 1.25 * pow(r, -1.5);
    float a2 = ang - om * uT0;
    vec2 cs = vec2(cos(a2), sin(a2));
    // khí plasma xoáy: lớp xoáy lớn, lớp sợi kéo dài theo chiều quay, lớp vụn mịn (tắt dần ở ảnh phụ bị nén để khỏi lấm tấm)
    float lr = log(r);
    float n1 = fbm3(vec3(cs * .42, lr * 2.3) + vec3(.3, .1, .7));
    float n2 = fbm3(vec3(cs * 1.25, lr * 6.8) + vec3(3.1, 1.3, 2.2));
    float n3 = pn(vec3(cs * 3.4, lr * 17.) + vec3(7.1, 5.3, 1.2)) * fineK;
    float d1 = sat(.52 + 1.7 * n1);
    float d2 = sat(.5 + 1.9 * n2);
    float dens = d1 * (.4 + .6 * d2) * (.82 + .36 * n3);
    dens *= .93 + .07 * sin(lr * 23. + n1 * 15. + n2 * 6.);
    dens = pow(dens, 1.25);
    float edgeIn = smoothstep(RIN * .97, RIN * 1.07, r);
    float edgeOut = 1. - smoothstep(ROUT * .5, ROUT, r);
    float alpha = sat(dens * edgeIn * edgeOut * 1.05);
    // nhiệt độ: nóng nhất ngay ngoài mép trong
    float f = pow(r / RIN, -.75) * pow(max(1. - sqrt(RIN / r), 1e-4), .25) / .488;
    float Tem = 6200. * f;
    // Doppler + lệch đỏ hấp dẫn
    float v = min(sqrt(.5 / max(r - 1., .1)), .62);
    vec3 vel = v * normalize(vec3(-hp.z, 0., hp.x));
    vec3 n = -normalize(vdir);
    float gam = inversesqrt(1. - v * v);
    float g = sqrt(max(1. - 1. / r, .02)) / (gam * (1. - dot(vel, n)));
    float I = pow(g, 3.4) * pow(f, 2.2) * uDisk * (.45 + 1.1 * dens);
    vec3 c = nhiet(Tem * g);
    c = mix(vec3(dot(c, vec3(.3, .55, .15))), c, 1.45);
    vec3 col = max(c, 0.) * I;
    col += nhiet(Tem * g * 1.15) * exp(-sq((r - RIN * 1.04) / .09)) * .9 * pow(g, 3.) * uDisk;
    return vec4(col, alpha);
  }

  void main(){
    vec3 rd = tiaNhin(vUv);
    vec3 p = uCP, v = rd;
    vec3 hv = cross(p, v); float h2 = dot(hv, hv);
    vec3 col = vec3(0.); float tr = 1.; float hitH = 0.; float minR = 1e9; float nc = 0.;
    float jit = h12(gl_FragCoord.xy + uSeed) * .5 + .5;
    for (int i = 0; i < 260; i++) {
      if (float(i) >= uNB) break;
      float r2 = dot(p, p); float r = sqrt(r2);
      minR = min(minR, r);
      if (r < 1.) { hitH = 1.; break; }
      if (r > 34. && dot(p, v) > 0.) break;
      float dt = uDt * r * (i == 0 ? jit : 1.);
      dt = min(dt, max(.04, abs(p.y) * 1.6 + .02 * r));
      vec3 a = -1.5 * h2 * p / (r2 * r2 * r);
      vec3 pn2 = p + v * dt + .5 * a * dt * dt;
      float r2n = dot(pn2, pn2);
      vec3 an = -1.5 * h2 * pn2 / (r2n * r2n * sqrt(r2n));
      vec3 vn = v + .5 * (a + an) * dt;
      if (p.y * pn2.y < 0.) {
        float t = p.y / (p.y - pn2.y);
        vec4 d = dia(mix(p, pn2, t), normalize(mix(v, vn, t)), nc < .5 ? 1. : .2);
        nc += 1.;
        col += tr * d.rgb * d.a;
        tr *= 1. - d.a;
        if (tr < .01) break;
      }
      // quầng khí mỏng phát sáng phía trên và dưới đĩa (làm mềm, có chiều sâu)
      float rr = length(pn2.xz);
      if (rr > RIN && rr < ROUT * 1.3) {
        float hz = exp(-abs(pn2.y) / (.12 + rr * .03)) * exp(-rr / 3.2) * smoothstep(.0, 6., length(pn2 - uCP));
        col += tr * vec3(1., .66, .4) * hz * dt * uHalo;
      }
      p = pn2; v = vn;
    }
    vec3 vd = normalize(v);
    float keo = length(cross(dFdx(vd), dFdy(vd))) / max(uPxA * uPxA, 1e-12);   // tỉ lệ diện tích bầu trời / điểm ảnh: <1 là bị thấu kính phóng to kéo dài
    vec3 bg = nen(vd, sat(keo));
    col += tr * (1. - hitH) * bg;
    gl_FragColor = vec4(col * uA, uA);
  }`;

  // đường máy quay quanh hố đen: [S, khoảng cách, độ cao (độ), góc phương vị (độ), nghiêng (độ), góc nhìn]
  const CAM = SN.duong([
    [99, 210, 5.0, -52, -4, 34],
    [104, 170, 5.5, -46, -4, 34],
    [112, 92, 7.5, -32, -6, 38],
    [120, 52, 10.5, -14, -8, 42],
    [128, 31, 9.5, 8, -10, 48],
    [134, 21, 6.0, 30, -13, 52],
    [139, 15.5, 3.2, 58, -15, 56],
  ]);
  const P3 = [0, 0, 0], TG = [0, 0, 0], UP = [0, 1, 0];
  function camAt(S, out) {
    // trước 139: bay vòng vào gần; 139–146: văng ra (cú quăng quanh hố đen)
    const c = CAM(Math.min(S, 139));
    let dist = c[0], el = c[1], az = c[2], roll = c[3], fov = c[4];
    let look = 0;
    if (S > 139) {
      const t = (S - 139) / 7, k = io(Math.min(1, (S - 139) / 3.2));
      az = 58 + 170 * k + 30 * Math.max(0, t - 0.45);
      dist = 15.5 - 3.2 * Math.sin(Math.min(1, (S - 139) / 2.4) * Math.PI * 0.5) * (1 - ease((S - 141) / 1.5)) + 210 * Math.pow(ease((S - 140.8) / 5), 2.2);
      el = 3.2 + 7.5 * ease((S - 139) / 1.6) + 4 * ease((S - 141) / 4);
      roll = -15 + 40 * Math.sin(k * Math.PI) * 0.6;
      fov = 56 + 14 * Math.sin(Math.min(1, (S - 139) / 4) * Math.PI);
      look = ease((S - 140.6) / 2.4);
    }
    const ra = az * Math.PI / 180, re = el * Math.PI / 180;
    P3[0] = dist * Math.cos(re) * Math.cos(ra); P3[1] = dist * Math.sin(re); P3[2] = dist * Math.cos(re) * Math.sin(ra);
    // nhìn hơi lệch khỏi tâm theo chiều bay để khung hình có khoảng thở; khi văng ra thì nhìn theo hướng bay
    const side = 0.12 * dist;
    const tx = -Math.sin(ra) * side, tz = Math.cos(ra) * side;
    const ex = -Math.sin(ra), ez = Math.cos(ra); // hướng bay (tiếp tuyến)
    TG[0] = mix(tx, P3[0] + ex * 40 + P3[0] * 0.3, look); TG[1] = mix(0, P3[1] + 2, look); TG[2] = mix(tz, P3[2] + ez * 40 + P3[2] * 0.3, look);
    const rr = roll * Math.PI / 180;
    UP[0] = Math.sin(rr) * -Math.sin(ra) * 0; UP[1] = Math.cos(rr); UP[2] = 0;
    // nghiêng máy: xoay vector "trên" quanh trục nhìn
    const fx = TG[0] - P3[0], fy = TG[1] - P3[1], fz = TG[2] - P3[2], fl = Math.hypot(fx, fy, fz);
    const f = [fx / fl, fy / fl, fz / fl];
    let rx = f[1] * 0 - f[2] * 1, ry = f[2] * 0 - f[0] * 0, rz = f[0] * 1 - f[1] * 0; const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; ry /= rl; rz /= rl;
    const ux = ry * f[2] - rz * f[1], uy = rz * f[0] - rx * f[2], uz = rx * f[1] - ry * f[0];
    UP[0] = ux * Math.cos(rr) + rx * Math.sin(rr); UP[1] = uy * Math.cos(rr) + ry * Math.sin(rr); UP[2] = uz * Math.cos(rr) + rz * Math.sin(rr);
    out.pos = P3; out.tgt = TG; out.up = UP; out.fov = fov;
    return out;
  }
  const C = {}, C2 = {};
  const sp = [0, 0, 0], tmp = [0, 0, 0];
  function sparkAt(S, out) { // tia sáng bay trước máy quay một đoạn
    camAt(S, C2);
    const fx = C2.tgt[0] - C2.pos[0], fy = C2.tgt[1] - C2.pos[1], fz = C2.tgt[2] - C2.pos[2], l = Math.hypot(fx, fy, fz);
    const d = Math.min(6, C2.pos ? Math.hypot(C2.pos[0], C2.pos[1], C2.pos[2]) * 0.22 : 4);
    out[0] = C2.pos[0] + fx / l * d + C2.up[0] * d * 0.05; out[1] = C2.pos[1] + fy / l * d + C2.up[1] * d * 0.05; out[2] = C2.pos[2] + fz / l * d + C2.up[2] * d * 0.05;
    return out;
  }
  SN.dung.push((T) => {
    const mesh = SN.quad(FRAG, {
      uNB: { value: SN.HQ ? 260 : (SN.DT ? 110 : 160) }, uDt: { value: SN.HQ ? 0.045 : (SN.DT ? 0.085 : 0.062) }, uT0: { value: 0 },
      uMW: { value: new T.Vector3(0.25, 0.92, 0.3).normalize() }, uNeb: { value: new T.Vector3(0.64, 0.12, -0.77).normalize() },
      uDisk: { value: 1 }, uHalo: { value: 0.035 },
    });
    const tr = [];
    SN.them({
      ten: 'hoden', tu: 99, den: 148, lop: 30, mesh, warmS: 126,
      a: (S) => ramp(S, 99.5, 104.5) * (1 - ramp(S, 145.0, 147.7)),   // để trọn cú vút lên rồi mới nhường cảnh sao Thổ
      cap(S, a) {
        const u = mesh.material.uniforms;
        camAt(S, C);
        SN.camQuad(mesh.material, C.pos, C.tgt, C.up, C.fov);
        SN.uChung.uPxA.value = 2 * Math.tan(C.fov * Math.PI / 360) / Math.max(1, SN.size()[1]);
        u.uT0.value = 26 + (S - 99) * 1.15;
        u.uDisk.value = 0.7 * ease((S - 101) / 6);
        // tia sáng: đầu + đuôi theo đường đã qua
        const h = SN.chieu(mesh.material, sparkAt(S, sp), [0, 0, 0]);
        tr.length = 0;
        for (let k = 0; k < 14; k++) { const q = SN.chieu(mesh.material, sparkAt(S - k * 0.035, tmp), [0, 0, 0]); tr.push(q[2] > 0 ? [q[0], q[1]] : [-9, -9]); }
        SN.tiaDat([h[0], h[1]], tr, a * ease((S - 101) / 3), 2.0);
        // hậu kỳ: lạnh, tương phản, vệt loé mạnh; cú quăng có nhoè hướng tâm và loé trắng
        const sl = S > 139 ? Math.sin(Math.min(1, (S - 139) / 4) * Math.PI) : 0;
        SN.gradeMix({ exp: 1.05, bloom: 1.05, thr: 1.1, streak: 0.55, sat: 1.06, con: 1.06, vig: 0.42, grain: 0.032, ca: 0.016 + 0.05 * sl, bars: 1,
          lift: [0.008, 0.011, 0.02], gain: [1.0, 1.0, 1.02], sc: [0.5, 0.66, 1.0], zoom: sl * 0.85, white: 0 }, a);
      },
    });
  });
})();
