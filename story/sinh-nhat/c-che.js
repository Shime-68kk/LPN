'use strict';
// HÀNG CHÈ DỰNG KHỐI (cho cảnh đất c-dat.js): ở quả đồi chè tròn bị sao băng rơi xuống (cả quả) và một mảng sườn đồi ngay trước máy quay.
// Mỗi hàng chè là một dải bụi liền nhau chạy vòng quanh tâm đồi (như đồi chè bát úp thật ở Thái Nguyên), mặt tán xén phẳng,
// mép tròn; dọc hàng có từng gốc chè phình ra thót vào, thỉnh thoảng hở một khe. Lá dày bóng: dưới trăng ánh bạc lấm tấm,
// rãnh giữa hàng tối sâu. Sóng sáng lúc va chạm và lúc đốm sáng đáp chạy trên ngọn chè.
(() => {
  const SN = window.SN, { clamp } = SN.u;
  const CHE_V = `
  attribute vec3 aChe;   // x: độ cao trong mặt cắt (0 gốc → 1 mặt tán), y: toạ độ dọc hàng (m), z: số hàng
  varying vec3 vW; varying vec3 vN; varying vec3 vChe;
  void main(){ vW = position; vN = normal; vChe = aChe; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
  const CHE_F = `
  varying vec3 vW; varying vec3 vN; varying vec3 vChe;
  void main(){
    vec3 n = normalize(vN);
    float hv = vChe.x;
    // lá: cụm lá 6–12 cm làm pháp tuyến lồi lõm; xa quá thì bỏ cho khỏi lấp lánh răng cưa
    vec3 p = vW * 6.5;
    float l1 = pn(p), l2 = pn(p * 2.7 + 3.1);
    float e = .16;
    vec3 gn = vec3(pn(p + vec3(e, 0., 0.)) - l1, pn(p + vec3(0., e, 0.)) - l1, pn(p + vec3(0., 0., e)) - l1) / e;
    float px = length(fwidth(vW));
    float gan = 1. - smoothstep(.04, .22, px);
    vec3 nn = normalize(n + gn * .22 * gan);
    float young = smoothstep(.78, 1., hv) * smoothstep(-.05, .3, l2 + .2 * pn(vec3(vW.xz * .4, 2.)));
    vec3 alb = mix(vec3(.015, .022, .013), vec3(.033, .046, .022), sat(.5 + l1 * .9));
    alb = mix(alb, vec3(.05, .07, .03), young * .5);
    float cav = mix(1., smoothstep(-.28, .12, l1 + l2 * .45), gan);   // hốc giữa các cụm lá
    float ao = mix(.22, 1., smoothstep(0., .95, hv)) * mix(.4, 1., cav);
    float shM = bongTrang(vW, n), shD = bongDong(vW, n);
    vec3 col = alb * anhTrang(nn, ao, shM, shD);
    // lá chè dày, bóng: ánh trăng loáng trên mặt tán, lấm tấm giọt sương
    vec3 v = normalize(uCam - vW), h = normalize(uMoonL + v);
    float nh = max(dot(nn, h), 0.);
    float suongLa = step(.94, fract(l2 * 11.7 + l1 * 6.3)) * gan;
    col += uMoonC * (pow(nh, 24.) * .12 + pow(nh, 260.) * 1.3 * suongLa) * shM * cav * smoothstep(.4, .9, hv);
    col += alb * dongDom(vW, nn, shD) * 3.5;
    // sóng sáng: chạy trên ngọn chè
    col += songChe(vW, 1.) * (.35 + .9 * hv) * .9;
    col += vongVa(vW, 1.) * (.25 + .95 * hv) * mix(.6, 1., cav);
    col = suong(col, vW);
    if (!(dot(col, col) < 1e8)) col = vec3(0.);
    gl_FragColor = vec4(col, 1.);
  }`;

  // vùng dựng khối: { cx, cz: tâm vòng hàng (tâm đồi), r0, r1: bán kính hàng trong/ngoài, keep(x, z): giữ điểm này không, taper(x, z): 0..1 (bụi thấp dần ở mép vùng) }
  SN.dat.dungChe = function (T, U, vung) {
    const hDat = SN.dat.hDat;
    let seed = 7177;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const vn = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); const a = Math.sin(i * 127.1) * 43758.5453, b = Math.sin((i + 1) * 127.1) * 43758.5453; return (a - Math.floor(a)) * (1 - u) + (b - Math.floor(b)) * u - 0.5; };
    // mặt cắt bụi chè: [ngang (phần bề rộng), cao (phần chiều cao)]
    const PRO = SN.DT ? [[-1.0, 0.0], [-0.95, 0.45], [-0.72, 0.86], [0.0, 1.0], [0.72, 0.86], [0.95, 0.45], [1.0, 0.0]]   // điện thoại: mặt cắt ít điểm hơn
      : [[-1.0, 0.0], [-0.99, 0.28], [-0.9, 0.6], [-0.7, 0.86], [-0.34, 0.985], [0.0, 1.0], [0.34, 0.985], [0.7, 0.86], [0.9, 0.6], [0.99, 0.28], [1.0, 0.0]];
    const NP = PRO.length;
    const P = [], A = [], I = [];
    let nv = 0;
    for (const V of vung) {
      for (let k = Math.max(1, Math.round(V.r0 / 1.8)); 1.8 * (k + 0.5) <= V.r1; k++) {
        const R0 = 1.8 * (k + 0.5);
        const step = SN.DT ? 0.62 : 0.42, na = Math.max(8, Math.round(2 * Math.PI * R0 / step));
        let strip = [];   // các mặt cắt liền nhau
        const flush = () => {
          if (strip.length >= 2) {
            const base = nv;
            for (const c of strip) for (let j = 0; j < NP; j++) { P.push(c[j][0], c[j][1], c[j][2]); A.push(PRO[j][1] * c.hs, c.l, k); nv++; }
            for (let s = 0; s < strip.length - 1; s++) for (let j = 0; j < NP - 1; j++) {
              const a = base + s * NP + j, b = a + 1, c = a + NP, d = c + 1;
              I.push(a, c, b, b, c, d);
            }
          }
          strip = [];
        };
        const ph = rnd() * 6.283, gapSeed = rnd() * 100;
        for (let ia = 0; ia <= na; ia++) {
          const ang = ia / na * 2 * Math.PI + ph;
          const l = ang * R0;
          const wig = vn(l / 7.3 + k * 3.1) * 0.35 + vn(l / 2.1 + k) * 0.08;   // hàng lượn nhẹ
          const R = R0 + wig;
          const x = V.cx + Math.cos(ang) * R, z = V.cz + Math.sin(ang) * R;
          if (!V.keep(x, z)) { flush(); continue; }
          // khe hở giữa các gốc (thỉnh thoảng)
          const gk = vn(l / 1.7 + gapSeed);
          if (gk > 0.43) { flush(); continue; }
          const tp = V.taper ? V.taper(x, z) : 1;
          if (tp < 0.05) { flush(); continue; }
          const lump = 1 + 0.1 * Math.cos(l / 0.78 * Math.PI * 2 + vn(l / 3 + k) * 4) + 0.07 * vn(l / 0.55 + k * 7.7) + 0.05 * vn(l / 4.2 - k);
          const hgt = (0.82 + 0.1 * vn(l / 9 + k * 1.3)) * lump * tp;
          const hw = (0.47 + 0.05 * vn(l / 5.1 + k * 2.2)) * (0.92 + 0.08 * lump) * (0.55 + 0.45 * tp);
          const rx = Math.cos(ang), rz = Math.sin(ang);   // hướng ngang hàng (ra xa tâm đồi)
          const sec = [];
          for (let j = 0; j < NP; j++) {
            const s = PRO[j][0] * hw, px = x + rx * s, pz = z + rz * s;
            const g = hDat(px, pz);
            const yb = g - 0.06 + PRO[j][1] * hgt;
            sec.push([px, PRO[j][1] > 0.01 ? yb : g - 0.12, pz]);
          }
          sec.l = l; sec.hs = 1;
          strip.push(sec);
        }
        flush();
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    g.setAttribute('aChe', new T.Float32BufferAttribute(A, 3));
    g.setIndex(I);
    g.computeVertexNormals();
    const mat = new T.ShaderMaterial({ uniforms: U, vertexShader: CHE_V, fragmentShader: SN_GLSL.CHUNG + SN.dat.CHUNG3 + CHE_F, extensions: { derivatives: true } });
    const mesh = new T.Mesh(g, mat); mesh.frustumCulled = false;
    SN.dat.soCheTamGiac = I.length / 3;
    return { mesh, geo: g };
  };
})();
