'use strict';
// Thư viện shader dùng chung cho Chương 23 "Phút đầu tiên":
// - kết cấu nhiễu 3D 64³ (lặp liền) tính sẵn trên máy: R = nhiễu Perlin (8 ô), G = khoảng cách tế bào gần nhất (Worley F1),
//   B = Perlin lớn (4 ô), A = mép tế bào (Worley F2 − F1, gần 0 ở đường ranh giữa các tế bào)
// - hàm băm không dùng sin (không bị sọc trên điện thoại), màu nhiệt độ sao, bầu trời sao, dải Ngân Hà
(() => {
  const N = 64;
  function perlin3(period, seed) {
    // nhiễu gradient lặp sau `period` ô, mỗi ô N/period điểm
    const P = new Uint16Array(period * period * period);
    let s = seed;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const G = [];
    for (let i = 0; i < P.length; i++) {
      const z = rnd() * 2 - 1, a = rnd() * 6.2831853, r = Math.sqrt(1 - z * z);
      G.push([r * Math.cos(a), r * Math.sin(a), z]);
    }
    const idx = (x, y, z) => (((x % period) + period) % period) + period * ((((y % period) + period) % period) + period * (((z % period) + period) % period));
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const out = new Float32Array(N * N * N), k = period / N;
    let o = 0;
    for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const px = x * k, py = y * k, pz = z * k;
      const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
      const fx = px - ix, fy = py - iy, fz = pz - iz;
      const u = fade(fx), v = fade(fy), w = fade(fz);
      let acc = 0;
      for (let c = 0; c < 8; c++) {
        const cx = c & 1, cy = (c >> 1) & 1, cz = (c >> 2) & 1;
        const g = G[idx(ix + cx, iy + cy, iz + cz)];
        const d = g[0] * (fx - cx) + g[1] * (fy - cy) + g[2] * (fz - cz);
        acc += d * (cx ? u : 1 - u) * (cy ? v : 1 - v) * (cz ? w : 1 - w);
      }
      out[o++] = acc;
    }
    return out;
  }
  function worley3(period, seed) {
    let s = seed;
    const rnd = () => { s = (s * 48271) % 2147483647; return (s - 1) / 2147483646; };
    const F = new Float32Array(period * period * period * 3);
    for (let i = 0; i < F.length; i++) F[i] = rnd();
    const f1 = new Float32Array(N * N * N), f2 = new Float32Array(N * N * N), k = period / N;
    let o = 0;
    for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const px = (x + 0.5) * k, py = (y + 0.5) * k, pz = (z + 0.5) * k;
      const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
      let d1 = 9, d2 = 9;
      for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const cx = ix + dx, cy = iy + dy, cz = iz + dz;
        const w = (((cx % period) + period) % period) + period * ((((cy % period) + period) % period) + period * (((cz % period) + period) % period));
        const qx = cx + F[w * 3] - px, qy = cy + F[w * 3 + 1] - py, qz = cz + F[w * 3 + 2] - pz;
        const d = qx * qx + qy * qy + qz * qz;
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      f1[o] = Math.sqrt(d1); f2[o] = Math.sqrt(d2); o++;
    }
    return [f1, f2];
  }
  function noiseTexture(T) {
    const a = perlin3(8, 7), b = perlin3(4, 1931);
    const [w1, w2] = worley3(8, 4242);
    const data = new Uint8Array(N * N * N * 4);
    const to8 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
    for (let i = 0; i < N * N * N; i++) {
      data[i * 4] = to8(a[i] * 0.85 + 0.5);
      data[i * 4 + 1] = to8(w1[i] / 1.1);
      data[i * 4 + 2] = to8(b[i] * 0.85 + 0.5);
      data[i * 4 + 3] = to8((w2[i] - w1[i]) / 0.9);
    }
    const t = new T.Data3DTexture(data, N, N, N);
    t.format = T.RGBAFormat; t.type = T.UnsignedByteType;
    t.minFilter = T.LinearFilter; t.magFilter = T.LinearFilter;
    t.wrapS = t.wrapT = t.wrapR = T.RepeatWrapping;
    t.unpackAlignment = 1; t.needsUpdate = true;
    return t;
  }

  // ---------- GLSL ----------
  const CHUNG = `
  precision highp float; precision highp sampler3D;
  uniform sampler3D uN3;
  uniform float uS;          // giây trong bài nhạc
  uniform vec2 uRes;         // số điểm ảnh khung vẽ
  uniform float uPxA;        // góc nhìn của một điểm ảnh (radian)
  #define PI 3.14159265
  #define TAU 6.2831853
  float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float h12(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float h13(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  vec3 h33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  vec4 h43(vec3 p){ vec4 q = fract(vec4(p.xyzx) * vec4(.1031, .1030, .0973, .1099)); q += dot(q, q.wzxy + 33.33); return fract((q.xxyz + q.yzzw) * q.zywx); }
  // nhiễu từ kết cấu 3D: giá trị khoảng -0.5..0.5 (Perlin) hoặc 0..1 (tế bào)
  float pn(vec3 p){ return texture(uN3, p).r - .5; }
  float pnL(vec3 p){ return texture(uN3, p).b - .5; }
  float cel(vec3 p){ return texture(uN3, p).g; }
  float edg(vec3 p){ return texture(uN3, p).a; }
  vec4 n4(vec3 p){ return texture(uN3, p); }
  float fbm3(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 3; i++) { s += a * pn(p); p = p * 2.03 + vec3(.131, .217, .073); a *= .5; } return s; }
  float fbm4(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * pn(p); p = p * 2.03 + vec3(.131, .217, .073); a *= .5; } return s; }
  float fbm5(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * pn(p); p = p * 2.03 + vec3(.131, .217, .073); a *= .5; } return s; }
  float sat(float x){ return clamp(x, 0., 1.); }
  vec3 sat3(vec3 x){ return clamp(x, 0., 1.); }
  float sq(float x){ return x * x; }
  mat2 rot2(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
  // màu của vật nóng theo nhiệt độ (Kelvin), đã đổi sang ánh sáng tuyến tính, độ sáng chuẩn hoá
  vec3 nhiet(float t){
    t = clamp(t, 1000., 40000.) / 100.;
    vec3 c;
    c.r = t <= 66. ? 1. : clamp(1.292936 * pow(t - 60., -.1332048), 0., 1.);
    c.g = t <= 66. ? clamp(.3900816 * log(t) - .6318414, 0., 1.) : clamp(1.1298909 * pow(t - 60., -.0755148), 0., 1.);
    c.b = t >= 66. ? 1. : (t <= 19. ? 0. : clamp(.5432068 * log(t - 10.) - 1.1962541, 0., 1.));
    return c * c;
  }
  // một lớp sao: mỗi ô lưới 3D có thể có một ngôi sao; sao nằm lọt trong ô nên không bị cắt.
  // Cấp sáng như trời thật: rất ít sao sáng, phần lớn mờ.
  vec3 lopSao(vec3 d, float n, float matDo, float sang, float px){
    vec3 p = d * n; vec3 c = floor(p);
    vec4 h = h43(c + 17.);
    if (h.w > matDo) return vec3(0.);
    vec3 sp = normalize((c + .25 + .5 * h.xyz) / n);
    float a = length(d - sp);
    float r = max(px * .55, 1e-5);
    float g = exp(-a * a / (r * r));
    float m = h.w / matDo;
    float br = .035 + 2.6 * pow(1. - m, 14.) + .25 * pow(1. - m, 4.);
    float k = h13(c + 3.7);
    vec3 col = nhiet(mix(3000., 15000., k * k * k));
    return col * g * sang * br;
  }
  vec3 bauTroiSao(vec3 d, float px){
    vec3 s = lopSao(d, 55., .30, 1., px);
    s += lopSao(d, 120., .10, .38, px);
    s += lopSao(d, 260., .035, .2, px);
    return s;
  }
  // dải Ngân Hà quanh mặt phẳng có pháp tuyến nP: hẹp, mờ; vệt bụi mảnh chạy dọc theo dải (toạ độ theo dải để kéo dài sợi bụi)
  vec3 nganHa(vec3 d, vec3 nP, float px){
    float b = dot(d, nP);
    float band = exp(-b * b * 50.);
    if (band < .003) return vec3(0.);
    vec3 e1 = normalize(cross(nP, abs(nP.y) < .9 ? vec3(0., 1., 0.) : vec3(1., 0., 0.)));
    vec3 e2 = cross(nP, e1);
    float l = atan(dot(d, e2), dot(d, e1));
    vec2 cl = vec2(cos(l), sin(l));
    float f = fbm4(vec3(cl * 1.1, b * 5.) + .3);
    float bui = fbm5(vec3(cl * 2.4, b * 11.) + vec3(4.1, 0., 2.));
    float bui2 = fbm4(vec3(cl * 7., b * 24.) + vec3(1.3, 7., 2.));
    float lane = smoothstep(.02, -.16, bui + b * 1.6 + bui2 * .35) * band;
    float core = exp(-b * b * 220.);
    vec3 col = mix(vec3(.62, .64, .72), vec3(1., .86, .7), core) * band * (.45 + .6 * sat(f + .5)) * (1. + .6 * smoothstep(.2, .9, cl.x));
    col *= 1. - .88 * lane;
    col += lopSao(d, 380., .3 * band, .3, px);
    return col * .22;
  }
  `;
  // đỉnh chung cho mặt phẳng phủ kín màn hình
  const QUAD_V = `out vec2 vUv; void main(){ vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, 0., 1.); }`;
  // dựng tia nhìn từ máy quay (uCR: cột 0 = phải, 1 = trên, 2 = sau)
  const TIA = `
  uniform vec3 uCP; uniform mat3 uCR; uniform float uTF; uniform float uAsp; uniform float uA;
  in vec2 vUv;
  vec3 tiaNhin(vec2 uv){ vec2 n = uv * 2. - 1.; return normalize(uCR * vec3(n.x * uTF * uAsp, n.y * uTF, -1.)); }
  `;
  window.SN_GLSL = { CHUNG, QUAD_V, TIA, noiseTexture };
})();
