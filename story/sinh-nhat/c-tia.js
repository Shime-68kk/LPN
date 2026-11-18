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
  // cảnh gọi mỗi khung: đầu tia (0..1), mảng các điểm đuôi [[x,y],...] (cũ dần), độ sáng, độ dày, độ đậm đuôi, trọng số.
  // Lúc chuyển cảnh hai cảnh cùng gọi: vị trí lấy trung bình theo trọng số (mặc định = độ sáng, tăng dần từ 0) nên tia trượt mượt
  // từ chỗ của cảnh cũ sang chỗ của cảnh mới, không nhảy.
  const A = { n: 0, h: [0, 0], w: 0, k: 0, tx: [], ty: [], tw: [] };
  SN._tia = D;   // để đo (chỉ đọc)
  SN.tiaDat = (h, tr, i, w, k, wt) => {
    D.i = Math.max(D.i, i);
    wt = wt == null ? i : wt;
    if (!(wt > 1e-5)) return;
    A.n += wt; A.h[0] += h[0] * wt; A.h[1] += h[1] * wt; A.w += (w || 2.2) * wt; A.k += (k == null ? 1 : k) * wt;
    for (let j = 0; j < tr.length; j++) {
      const p = tr[j];
      if (A.tx.length <= j) { A.tx.push(0); A.ty.push(0); A.tw.push(0); }
      if (!p || p[0] < -5) continue;
      A.tx[j] += p[0] * wt; A.ty[j] += p[1] * wt; A.tw[j] += wt;
    }
  };
  function gop() {
    if (A.n > 0) {
      D.h[0] = A.h[0] / A.n; D.h[1] = A.h[1] / A.n; D.w = A.w / A.n; D.k = A.k / A.n;
      D.tr = [];
      for (let j = 0; j < A.tx.length; j++) D.tr.push(A.tw[j] > 0 ? [A.tx[j] / A.tw[j], A.ty[j] / A.tw[j]] : [-9, -9]);
    }
    A.n = 0; A.h[0] = A.h[1] = 0; A.w = A.k = 0; A.tx.length = A.ty.length = A.tw.length = 0;
  }
  SN.dung.push((T) => {
    const trV = []; for (let i = 0; i < NT; i++) trV.push(new T.Vector2(-9999, -9999));
    const mesh = SN.quad(FRAG, { uH: { value: new T.Vector2(0.5, 0.5) }, uTr: { value: trV }, uTrN: { value: 0 }, uI: { value: 0 }, uW: { value: 2 }, uTrK: { value: 1 } });
    SN.beforeFrame = ((prev) => (S) => { D.i = 0; prev && prev(S); })(SN.beforeFrame);
    SN.them({
      ten: 'tia', tu: 17, den: 212.5, lop: 90, mesh, warmS: 60,
      cap() {
        gop();
        const u = mesh.material.uniforms;
        u.uH.value.set(D.h[0], D.h[1]);
        const n = Math.min(NT, D.tr.length);
        for (let i = 0; i < NT; i++) { const p = i < n ? D.tr[i] : null; if (p && p[0] > -5) u.uTr.value[i].set(p[0], p[1]); else u.uTr.value[i].set(-9999, -9999); }
        u.uTrN.value = n; u.uI.value = D.i; u.uW.value = D.w * (SN.size()[1] / 900); u.uTrK.value = D.k;
      },
    });
  });
})();
