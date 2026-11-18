'use strict';
// TIA SÁNG: nhân vật chính của cả chuyến đi. Vẽ trên màn hình (cộng sáng) sau mọi cảnh vũ trụ:
// lõi trắng vàng, quầng mềm, hai vệt chữ thập rất mảnh, và sợi đuôi theo đúng đường tia vừa đi qua (cảnh tính sẵn rồi chiếu ra màn hình).
(() => {
  const SN = window.SN;
  const NT = 24;
  const FRAG = `
  uniform vec2 uH; uniform vec2 uTr[${NT}]; uniform float uTrN; uniform float uI; uniform float uW; uniform float uTrK;
  void main(){
    if (uI <= 0.) discard;                          // không cảnh nào gọi tia: bỏ ngay, khỏi tốn
    vec2 px = vUv * uRes;
    vec2 hp = uH * uRes;
    vec2 dd = px - hp;
    float d0 = length(dd);
    float w = uW;
    float core = exp(-d0 * d0 / (w * w * .45));
    float halo = exp(-d0 / (w * 7.)) * .28 + exp(-d0 / (w * 26.)) * .06;
    float sp = exp(-abs(dd.y) / (w * .22)) * exp(-abs(dd.x) / (w * 22.)) * .55 + exp(-abs(dd.x) / (w * .22)) * exp(-abs(dd.y) / (w * 11.)) * .3;
    float tr = 0.;
    for (int i = 0; i < ${NT - 1}; i++) {
      if (float(i) >= uTrN - 1.) break;
      vec2 a = uTr[i] * uRes, b = uTr[i + 1] * uRes;
      if (a.x < -1000. || b.x < -1000.) continue;
      vec2 lo = min(a, b) - w * 2.2, hi = max(a, b) + w * 2.2;   // đuôi chỉ là sợi mảnh: điểm ảnh ở xa đoạn này thì bỏ qua
      if (px.x < lo.x || px.y < lo.y || px.x > hi.x || px.y > hi.y) continue;
      vec2 ab = b - a, ap = px - a;
      float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-3), 0., 1.);
      float d = length(ap - ab * t);
      float f = (1. - (float(i) + t) / (uTrN - 1.)) * exp(-length(a + ab * t - hp) / (uRes.y * .16));
      float ww = w * (.18 + .5 * f);
      tr = max(tr, exp(-d * d / (ww * ww)) * f * f);
    }
    vec3 col = vec3(1., .94, .84) * (core * 7. + halo + sp) + vec3(1., .83, .62) * tr * 1.9 * uTrK;
    gl_FragColor = vec4(col * uI, 0.);
  }`;
  const D = { h: [0.5, 0.5], tr: [], i: 0, w: 2.2, k: 1 };
  // cảnh gọi mỗi khung: đầu tia (0..1), mảng các điểm đuôi [[x,y],...] (cũ dần), độ sáng
  SN.tiaDat = (h, tr, i, w, k) => { D.h[0] = h[0]; D.h[1] = h[1]; D.tr = tr; D.i = Math.max(D.i, i); D.w = w || 2.2; D.k = k == null ? 1 : k; };
  SN.dung.push((T) => {
    const trV = []; for (let i = 0; i < NT; i++) trV.push(new T.Vector2(-9999, -9999));
    const mesh = SN.quad(FRAG, { uH: { value: new T.Vector2(0.5, 0.5) }, uTr: { value: trV }, uTrN: { value: 0 }, uI: { value: 0 }, uW: { value: 2 }, uTrK: { value: 1 } });
    SN.beforeFrame = ((prev) => (S) => { D.i = 0; prev && prev(S); })(SN.beforeFrame);
    SN.them({
      ten: 'tia', tu: 17, den: 212.5, lop: 90, mesh, warmS: 60,
      cap() {
        const u = mesh.material.uniforms;
        u.uH.value.set(D.h[0], D.h[1]);
        const n = Math.min(NT, D.tr.length);
        for (let i = 0; i < NT; i++) { const p = i < n ? D.tr[i] : null; if (p && p[0] > -5) u.uTr.value[i].set(p[0], p[1]); else u.uTr.value[i].set(-9999, -9999); }
        u.uTrN.value = n; u.uI.value = D.i; u.uW.value = D.w * (SN.size()[1] / 900); u.uTrK.value = D.k;
      },
    });
  });
})();
