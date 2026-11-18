'use strict';
// RƠI VÀO KHÍ QUYỂN (S 200.8–207.7): nhìn từ chính tia sáng. Lửa plasma cam hồng viền tím trùm quanh khung, chảy ngược ra mép;
// tàn lửa vụt qua, khung rung, nhoè nóng; biển mây trăng soi bạc lao lên; xuyên mây thấy đồi tối và đèn doanh trại bên dưới.
// 207.7: cắt phụt sang mặt đất (máy quay đứng yên lần đầu tiên). Nhạc lúc này gần như lặng.
(() => {
  const SN = window.SN, M = SN.M, { clamp, mix, ease, io, ramp } = SN.u;
  const T_CUT = 207.7;
  const FRAG = `
  uniform float uT;      // 0..1 tiến trình rơi
  uniform float uHeat;   // độ dày lửa plasma
  uniform float uCloud;  // 0 trên mây, 1 trong mây, 2 dưới mây
  uniform vec2 uShake;
  float may2(vec2 p){ return fbm4(vec3(p, .37)) + .5 * fbm3(vec3(p * 2.7, 1.3)); }
  void main(){
    vec2 asp = vec2(uAsp, 1.);
    vec2 uv = (vUv - .5) * asp + uShake;
    float r = length(uv), a = atan(uv.y, uv.x);
    // nhoè nóng: lệch toạ độ theo nhiễu chảy ra ngoài
    vec2 hz = vec2(pn(vec3(uv * 6., uS * 3.)), pn(vec3(uv * 6. + 7., uS * 3.))) * .012 * uHeat;
    vec2 q = uv + hz;
    // ---- bên dưới: mây hoặc mặt đất ----
    vec3 col = vec3(0.);
    float z = mix(3.2, .25, uT);                         // khoảng cách tới biển mây (thu nhỏ dần = lao tới)
    vec2 cp = q * z + vec2(0., uS * .05);
    float c = may2(cp * .8);
    float cov = smoothstep(-.05, .3, c);
    float gx = may2(cp * .8 + vec2(.02, 0.)) - c, gy = may2(cp * .8 + vec2(0., .02)) - c;
    vec3 nrm = normalize(vec3(-gx * 30., -gy * 30., 1.));
    float moon = sat(dot(nrm, normalize(vec3(-.5, .4, .75))));
    vec3 cloudC = vec3(.18, .22, .3) * (.35 + .9 * moon) * cov;
    // mặt đất qua khe mây: đồi tối, chấm đèn
    vec2 gp = q * z * 3.5;
    vec3 ground = vec3(.01, .014, .02) * (.6 + .8 * sat(.5 + fbm3(vec3(gp * .3, 2.))));
    vec2 cell = floor(gp * 2.); vec2 fr = fract(gp * 2.) - .5;
    vec4 hh = h43(vec3(cell, 3.));
    if (hh.w < .09) ground += vec3(1., .68, .35) * exp(-dot(fr - (hh.xy - .5) * .6, fr - (hh.xy - .5) * .6) * 900.) * 3.;
    col = mix(ground, cloudC, cov * (1. - smoothstep(1.2, 1.9, uCloud)));
    // trong mây: mù trắng bạc
    float inC = smoothstep(.6, 1., uCloud) * (1. - smoothstep(1.2, 1.7, uCloud));
    col = mix(col, vec3(.16, .19, .25) * (.7 + .5 * may2(q * 3. + uS * .6)), inC);
    // dưới mây: thung lũng, sương, đèn doanh trại
    float below = smoothstep(1.4, 2., uCloud);
    if (below > 0.) {
      vec2 lp = q * mix(1.6, .9, smoothstep(1.4, 2.2, uCloud));
      vec3 land = vec3(.012, .018, .025) + vec3(.03, .04, .055) * sat(fbm4(vec3(lp * 2.2, 4.)) + .3);
      land += vec3(.06, .07, .09) * smoothstep(.1, .5, fbm3(vec3(lp * 3., 8.))) * .6;   // sương bạc
      vec2 cm = lp - vec2(.12, -.05);
      land += vec3(1., .66, .34) * exp(-dot(cm * vec2(1., 3.), cm * vec2(1., 3.)) * 2400.) * 2.5;  // dãy đèn trại
      vec2 lc = floor(lp * 9.); vec2 lf = fract(lp * 9.) - .5; vec4 lh = h43(vec3(lc, 5.));
      if (lh.w < .07) land += vec3(1., .7, .38) * exp(-dot(lf - (lh.xy - .5) * .6, lf - (lh.xy - .5) * .6) * 1400.) * 1.6;  // đèn nhà dân rải rác
      col = mix(col, land, below);
    }
    // ---- lửa plasma: trùm quanh tâm, chảy ra mép ----
    float lr = log(max(r, .02));
    float f1 = fbm4(vec3(a * 1.7, lr * 2.2 - uS * 3.2, uS * .6));
    float f2 = fbm3(vec3(a * 4.1 + 2., lr * 5. - uS * 6., 1.7));
    float tongue = smoothstep(-.05, .25, f2 + f1 * .6);            // lưỡi lửa: chỗ rực, chỗ tối
    float sheath = smoothstep(.22, .8, r + f1 * .4) * (.15 + 1.1 * tongue);
    vec3 fire = mix(vec3(1., .42, .1), vec3(1., .22, .5), smoothstep(.45, .95, r + f2 * .25));
    fire = mix(fire, vec3(.5, .28, 1.), smoothstep(.85, 1.3, r + f1 * .35));
    col += fire * sheath * uHeat * 1.35;
    col += vec3(1., .8, .55) * exp(-r * 7.) * uHeat * .35;           // vùng sáng trắng ở mũi tia
    // tàn lửa vụt ra mép
    vec2 pc = vec2(a * 9., lr * 6. - uS * 14.);
    vec2 ic = floor(pc); vec2 fc = fract(pc) - .5;
    vec4 e = h43(vec3(ic, 9.));
    float spark = e.w < .18 ? exp(-fc.x * fc.x * 400.) * exp(-(fc.y - (e.y - .5) * .6) * (fc.y - (e.y - .5) * .6) * 18.) : 0.;
    col += vec3(1., .75, .45) * spark * uHeat * 1.6 * smoothstep(.15, .5, r);
    gl_FragColor = vec4(col * uA, uA);
  }`;
  SN.dung.push((T) => {
    const mesh = SN.quad(FRAG, { uT: { value: 0 }, uHeat: { value: 0 }, uCloud: { value: 0 }, uShake: { value: new T.Vector2() } });
    SN.them({
      ten: 'roi', tu: 200.6, den: T_CUT, lop: 60, mesh, warmS: 204,
      a: (S) => ramp(S, 200.7, 202.6),
      cap(S, a) {
        const u = mesh.material.uniforms;
        u.uT.value = clamp((S - 200.6) / 5.2, 0, 1);
        u.uHeat.value = ease((S - 200.9) / 1.6) * (1 - ease((S - 205.0) / 1.1));
        u.uCloud.value = clamp((S - 204.6) / 0.9, 0, 1) + clamp((S - 205.6) / 1.2, 0, 1);
        const k = u.uHeat.value;
        u.uShake.value.set(Math.sin(S * 37) * 0.006 * k + Math.sin(S * 23.7) * 0.004 * k, Math.cos(S * 31) * 0.006 * k);
        SN.gradeMix({ exp: 1.0, bloom: 1.05, thr: 1.0, streak: 0.2, sat: 1.05, con: 1.05, vig: 0.55, grain: 0.045, ca: 0.02 * k, bars: 1, lift: [0.01, 0.01, 0.016], gain: [1, 1, 1], zoom: k * 0.35 }, a);
      },
    });
  });
})();
