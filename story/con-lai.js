// "Phần còn lại" (12/11/2026): cảnh và nhịp. Kịch bản: _kich-ban-999-buoc.md.
// Máy quay đặt TRONG cổng, nhìn ra con đường. Không vẽ người: chỉ đồ vật và ánh sáng.
// Em chỉ làm một việc: chạm giữ để bước một bước. Sau đó cả màn diễn chạy theo đồng hồ của bài "Có Em Chờ":
// mọi mốc (CUE) là giây trong bài, đã dò theo lời hát, nên hình, chữ và tiếng luôn khớp với câu đang hát.
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const A = window.ConLaiAm;
  const cv = $('cv'), g = cv.getContext('2d');
  const Q = new URLSearchParams(location.search);
  let KET = Q.get('ket') === 'a' ? 'a' : Q.get('ket') === 'b' ? 'b' : null; // kết em tìm ra ở cổng: 'a' cổng mở · 'b' cổng đóng · null chưa rõ
  const SKIP = Q.has('t'); // xem thử: bỏ phần chơi, vào thẳng thước phim
  const T0 = Math.max(0, Number(Q.get('t')) || 0); // xem thử: nhảy tới giây này của bài

  // ================= Mốc theo lời bài hát (giây) =================
  const CUE = {
    verse: 10.9,      // "Từ lần đầu tiên ta đi bên nhau"
    sit: 25.6,        // "Cách anh lặng lẽ ngồi / Ngồi nhìn bóng tối lặng thầm"
    weak: 36.0,       // "…có những phút giây yếu đuối không ngờ": ánh sáng chững lại
    wake: 47.3,       // sau "…về nhà anh nhé, có em chờ": dấu chân em sáng lên, ánh sáng đi tiếp
    wait: 46.6,       // "…về nhà anh nhé, có em chờ"
    rice: 50.6,       // "Có dư vị mỗi bữa cơm"
    rap: 58.9,        // "Có định mệnh nào…"
    thousand: 65.15,  // "Và nếu khoảng cách là một nghìn bước"
    one: 68.33,       // "thì em chỉ cần BƯỚC một bước"
    nine: 68.93,      // "Anh sẽ bước 999 bước còn lại"
    nineEnd: 70.5,
    toward: 71.6,     // "Bước về phía em"
    dawn: 75.4,       // "Nơi mà anh thấy nắng mai"
    calm: 79.5,       // "…yên bình và mong thế thôi"
    chorus: 83.25,    // "Tình yêu là những ánh sáng lấp lánh"
    window: 85.7,     // "Đèn vàng thắp lên bên ô cửa nhỏ"
    sorry: 127.5,     // "Xin em đừng giận anh nhé"
    chorus2: 155.2,
    bridge: 179.5,
    end: 228,
  };
  const BEAT = 0.75; // 80 nhịp/phút

  // Chữ giữa trời (line) và chú thích dưới đồ vật (cap): [từ giây, tới giây, chữ, đậm?]
  const LINES_COMMON = [[89.5, 95.4, 'Anh đi hết phần của anh rồi.']];
  const LINES = {
    none: [],
    b: [
      [105.4, 111.4, 'Còi gọi em đi. Cánh cổng vẫn đóng.'],
      [112.4, 118.6, 'Chín trăm chín mươi chín vạch sáng. Chỉ còn một khe tối, dày bằng cánh cổng.'],
      [119.6, 125.8, 'Từ hôm em đi, chưa lúc nào anh ở gần em như lúc này.'],
      [126.8, 134.4, 'Hôm nay mình chưa gặp được nhau. Nhưng anh đã đứng ở chỗ gần em nhất.'],
      [136, 144.5, 'Đường về, anh không thấy dài.'],
      [155.6, 165, 'Em chỉ cần một bước. Phần còn lại là của anh.', 1],
      [166.4, 176, 'Khe tối ấy, để dành cho ngày em về.'],
    ],
    a: [
      [105.4, 113.6, 'Bài hát bảo em chỉ cần một bước. Em lại bước những hai.'],
      [121.5, 130.6, 'Lần trước mình giận nhau vì anh xin mười phút.'],
      [131.8, 140, 'Hôm nay anh đi cả buổi sáng, để được đứng trước em mấy phút.'],
      [155.6, 165, 'Em chỉ cần một bước. Phần còn lại là của anh.', 1],
    ],
  };
  const ASK = [84.6, 103]; // khoảng em tự quyết ở cổng: bước thêm một bước (cổng mở) hay đứng yên tới lúc còi gọi (cổng đóng)
  const CAPS_COMMON = [
    [27.2, 33.9, 'Đèn bàn sáng từ đêm qua. Bộ câu hỏi soạn chưa xong thì trời đã sáng.'],
    [38.8, 46.5, 'Lần ấy em gọi mãi, anh mới nghe.'],
    [47.7, 50.2, 'Lần này, anh tự đi tìm em.'],
    [51.6, 56.9, 'Tối nào em cũng hỏi anh ăn chưa. Còn khay cơm của em thì cứ để nguyên.'],
  ];
  const CAPS = { none: [], b: [], a: [[143.6, 151.5, 'Đồng hồ vẫn để đó. Anh không bấm.']] };
  // Cảnh cắt cận đồ vật (cả khung hình): [từ, tới, tên]. Cắt đúng đầu câu hát, như phim dựng theo nhạc.
  const INSERTS = [[25.4, 34.4, 'den'], [36.0, 47.0, 'goi'], [50.4, 57.5, 'khay']];
  // Đồ vật hiện giữa trời (không cắt cảnh)
  const OBJ_COMMON = [];
  const OBJ = { none: [], b: [], a: [[141.5, 152.5, 'bam']] };

  // ================= Tiện ích =================
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const ramp = (x, pts) => { // nội suy từng đoạn: [[t, v], …]
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [t0, v0] = pts[i - 1], [t1, v1] = pts[i]; const k = (x - t0) / (t1 - t0); return v0 + (v1 - v0) * k * k * (3 - 2 * k); }
    return pts[pts.length - 1][1];
  };
  const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
  const rgb = (c, a = 1) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const keyed = (keys, x) => { // màu theo mốc: [[x, [r,g,b]], …]
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) return mix(keys[i - 1][1], keys[i][1], (x - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
    return keys[keys.length - 1][1];
  };
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // ================= Trạng thái =================
  const S = {
    phase: 'start',   // start → alone (chờ em bước) → show (chạy theo bài) → after
    t: -1,            // giây trong bài (âm: chưa phát)
    prevT: -1,
    clock: 0,         // đồng hồ thay thế khi bài không phát được
    now: 0, dt: 0,
    hold: 0, holding: false, stepped: false, stepAt: 0, stepClock: null,
    fin: false, tA: 1e9, ask: false, other: null,
    flare: 0, tried: 0,
  };

  // ================= Bố cục =================
  const L = {};
  const stars = [], marks = [];
  for (let i = 0; i < 150; i++) stars.push({ x: rnd(), y: Math.pow(rnd(), 1.4), r: 0.5 + rnd() * 1.1, f: 0.4 + rnd() * 1.6, p: rnd() * 6.28 });
  for (let j = 0; j <= 999; j++) marks.push({ f: 1.2 + rnd() * 3.4, p: rnd() * 6.28, j: (rnd() - 0.5) * 0.3 });
  const KP = 8.5; // độ sâu phối cảnh của con đường

  function layout() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const P = H >= W; // màn dọc
    Object.assign(L, {
      W, H, P, m: Math.min(W, H),
      hy: H * (P ? 0.5 : 0.44),      // đường chân trời
      gy: H * (P ? 0.79 : 0.74),     // chân cổng (sân trong cổng phải đủ cao để dấu chân nằm TRÊN dải đen khung phim)
      rw: Math.min(W * (P ? 0.35 : 0.24), H * 0.5), // nửa bề rộng đường ở chân cổng
    });
    L.lbh = H * (P ? 0.085 : 0.075); // dải đen khung phim
    const yard = H - L.lbh - L.gy;   // phần sân còn thấy được khi có dải đen
    L.fy = L.gy + yard * 0.52;       // dấu chân của em: luôn nằm giữa phần sân nhìn thấy
    L.fr = Math.min(Math.max(21, L.rw * 0.25), yard * 0.62);
    L.bs = clamp(L.m * 0.105, 34, 64); // khoảng cách song cổng
    L.bw = Math.max(3.5, L.m * 0.0125);
    L.rail = L.hy - H * (P ? 0.115 : 0.16);
    // Đồ vật và chữ: màn dọc xếp giữa trời, màn ngang đồ vật bên trái, chữ bên phải
    if (P) { L.ox = W / 2; L.oy = L.hy * 0.43; L.or = Math.min(W * 0.3, L.hy * 0.25); }
    else { L.ox = W * 0.25; L.oy = H * 0.37; L.or = Math.min(H * 0.27, W * 0.16); }
    $('line').style.top = Math.round(P ? L.hy * 0.34 : H * 0.2) + 'px';
    buildSprites();
  }

  // Ảnh sáng dựng sẵn
  const SP = {};
  function buildSprites() {
    const mk = (n, stops) => { const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), gr = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(([o, col]) => gr.addColorStop(o, col)); x.fillStyle = gr; x.fillRect(0, 0, n, n); return c; };
    SP.glow = mk(96, [[0, 'rgba(255,236,190,1)'], [0.18, 'rgba(255,205,130,.7)'], [0.5, 'rgba(255,170,90,.2)'], [1, 'rgba(255,150,70,0)']]);
    SP.fog = mk(128, [[0, 'rgba(190,200,230,.5)'], [0.6, 'rgba(180,190,225,.16)'], [1, 'rgba(170,180,220,0)']]);
    SP.warm = mk(128, [[0, 'rgba(255,200,130,.55)'], [0.55, 'rgba(255,170,100,.16)'], [1, 'rgba(255,150,80,0)']]);
    // hạt nhiễu phim
    const n = 128, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), im = x.createImageData(n, n);
    for (let i = 0; i < n * n; i++) { const v = 110 + Math.random() * 145; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    x.putImageData(im, 0, 0); SP.grain = g.createPattern(c, 'repeat');
  }

  // Con đường: s = 0 ở chân trời → 1 ở chân cổng
  const sOf = (u) => 1 / (1 + KP * (1 - u));
  const roadY = (s) => L.hy + (L.gy - L.hy) * s;
  const roadX = (s) => L.W / 2 + L.W * (L.P ? 0.16 : 0.1) * Math.sin((1 - s) * 2.5) * (1 - s);
  const roadH = (s) => Math.max(0.6, L.rw * s);

  // ================= Diễn biến theo giây của bài =================
  function show(t) {
    const st = S.stepped ? 1 : 0;
    const v = {
      p: t < 0 ? 0 : ramp(t, [[CUE.verse, 0], [CUE.weak, 0.2], [CUE.wake + 0.3, 0.2], [CUE.rap, 0.45], [CUE.nine, 0.7], [71.3, 1]]),
      count: t < 0 ? 0 : S.fin ? Math.round(ramp(t, [[57.4, 950], [CUE.nine, 972], [CUE.nineEnd, 999]])) : Math.round(ramp(t, [[CUE.verse, 0], [CUE.weak, 200], [CUE.wake + 0.3, 200], [CUE.rap, 450], [CUE.nine, 700], [CUE.nineEnd, 999]])),
      dawn: t < 0 ? 0.03 : ramp(t, [[0, 0.03], [CUE.rap, 0.2], [CUE.dawn, 0.42], [CUE.chorus, 0.58], [CUE.chorus + 5, 0.86], [CUE.chorus2, 0.9], [CUE.chorus2 + 6, 1]]),
      gold: ramp(t, [[CUE.dawn, 0], [CUE.chorus, 0.3], [CUE.chorus + 7, 0.78], [CUE.chorus2, 0.82], [CUE.chorus2 + 7, 1]]),
      win: t < 0 ? 0 : ss(1.6, 3, t) * (1 + 1.6 * ss(CUE.window - 0.3, CUE.window + 0.7, t) * (1 - ss(CUE.window + 2.5, CUE.window + 7, t))),
      reveal: ss(CUE.thousand, CUE.thousand + 0.9, t) * (1 - ss(CUE.thousand + 1.4, CUE.thousand + 3.2, t)),
      gate: ss(CUE.toward, CUE.toward + 1.6, t),            // ánh đèn áp vào song cổng
      twinkle: ss(CUE.chorus, CUE.chorus + 1.2, t),
      bloom: ss(CUE.chorus - 0.05, CUE.chorus + 0.5, t) * (1 - ss(CUE.chorus + 0.8, CUE.chorus + 5, t)) + 0.7 * ss(CUE.chorus2 - 0.05, CUE.chorus2 + 0.5, t) * (1 - ss(CUE.chorus2 + 0.8, CUE.chorus2 + 5, t)),
      still: ss(CUE.calm - 0.3, CUE.calm + 0.6, t) * (1 - ss(CUE.chorus - 0.2, CUE.chorus + 0.2, t)), // nhịp lặng trước điệp khúc
      open: KET === 'a' ? ss(S.tA + 0.3, S.tA + 5.4, t) : 0,
      foot: st,
      // ánh sáng chững lại và mờ đi ở "yếu đuối không ngờ", sáng lại sau khi dấu chân em gọi
      dim: 1 - 0.82 * ss(CUE.weak + 0.6, CUE.weak + 1.5, t) * (1 - ss(CUE.wake + 0.1, CUE.wake + 1, t)),
      lb: t < 0 ? 1 : (S.fin ? ss(57.4, 59.6, t) : 1) * (1 - ss(CUE.chorus, CUE.chorus + 2.8, t)),                       // dải đen khung phim: mở ra ở điệp khúc
      zoom: t < 0 ? 1 : ramp(t, [[0, 1], [71.3, 1.06], [CUE.chorus, 1.085], [CUE.chorus + 7, 1.035]]), // máy quay tiến chậm về phía cổng
    };
    // "bước một bước": dấu chân em bừng lên đúng chữ
    v.footFlare = Math.max(S.flare, ss(CUE.one - 0.08, CUE.one + 0.1, t) * (1 - ss(CUE.one + 0.3, CUE.one + 2.2, t)), 0.9 * ss(CUE.wake - 0.1, CUE.wake + 0.15, t) * (1 - ss(CUE.wake + 0.5, CUE.wake + 2.4, t)));
    return v;
  }
  // Bài nghe gần / xa theo giây
  const distOf = (t) => ramp(t, [[0, 0.1], [CUE.verse, 0.16], [CUE.rap - 1, 0.44], [CUE.rap + 2.2, 0.8], [CUE.one - 0.4, 0.84], [CUE.one + 0.5, 1]]);

  // ================= Vẽ cảnh =================
  const SKY_TOP = [[0, [4, 6, 14]], [0.3, [9, 13, 36]], [0.6, [26, 33, 78]], [0.86, [58, 84, 142]], [1, [96, 132, 190]]];
  const SKY_MID = [[0, [8, 11, 26]], [0.3, [20, 22, 58]], [0.6, [72, 58, 112]], [0.86, [176, 128, 158]], [1, [222, 178, 178]]];
  const SKY_LOW = [[0, [13, 17, 36]], [0.3, [36, 32, 72]], [0.6, [128, 82, 118]], [0.86, [242, 164, 142]], [1, [255, 214, 172]]];

  function ridgeY(i, x) { // dãy núi xa (i = 0 xa nhất)
    const a = [[0.9, 2.1, 0.3], [1.7, 4.3, 1.9], [3.1, 7.7, 4.2]][i];
    const h = 0.5 + 0.28 * Math.sin(x * a[0] * 6.28 + a[2]) + 0.15 * Math.sin(x * a[1] * 6.28 + a[2] * 2.3) + 0.07 * Math.sin(x * 19 + i * 5);
    return L.hy - L.H * [0.105, 0.07, 0.04][i] * (0.35 + h) - L.H * [0.02, 0.008, 0][i];
  }
  function ridgePath(i) {
    g.beginPath(); g.moveTo(0, L.hy + 4);
    for (let k = 0; k <= 48; k++) g.lineTo(L.W * k / 48, ridgeY(i, k / 48));
    g.lineTo(L.W, L.hy + 4); g.closePath();
  }
  function hillTop(X, hy, H) { g.bezierCurveTo(X(0.08), hy - H * 0.058, X(0.27), hy - H * 0.064, X(0.42), hy + H * 0.006); }
  function hillPath(side) { // hai đồi chè thấp kẹp hai bên đường, sát chân trời
    const W = L.W, H = L.H, hy = L.hy, d = side < 0 ? 0 : 1, X = (f) => (d ? W - W * f : W * f);
    g.beginPath(); g.moveTo(X(-0.05), hy + H * 0.17); g.lineTo(X(-0.05), hy + H * 0.02);
    hillTop(X, hy, H);
    g.bezierCurveTo(X(0.36), hy + H * 0.075, X(0.15), hy + H * 0.14, X(-0.05), hy + H * 0.17); g.closePath();
  }
  // Cột điện ven đường: cho cảnh có chiều sâu (bóng đen, bắt sáng khi ánh đèn đi ngang)
  const POLES = [0.085, 0.125, 0.18, 0.26, 0.38, 0.56, 0.84];
  function drawPoles(v, sh) {
    const col = rgb(mix([3, 4, 9], [46, 50, 66], v.dawn));
    let px = null, py = null, pa = null;
    for (const s of POLES) {
      const x = roadX(s) + roadH(s) * 1.55, y = roadY(s), h = L.H * 0.36 * s + 3, w = Math.max(1, L.m * 0.016 * s), arm = h * 0.16;
      g.fillStyle = col; g.fillRect(x - w / 2, y - h, w, h); g.fillRect(x - arm, y - h + h * 0.06, arm * 2, Math.max(1, w * 0.7));
      const near = clamp(1 - Math.abs(s - sh) / 0.14) * (v.p > 0.001 ? 1 : 0);
      if (near > 0.02) { g.fillStyle = 'rgba(255,200,130,' + 0.75 * near + ')'; g.fillRect(x - w / 2, y - h, Math.max(0.8, w * 0.35), h); }
      if (px !== null) { // dây điện võng giữa hai cột
        g.strokeStyle = col; g.lineWidth = Math.max(0.5, w * 0.22);
        for (const o of [-1, 1]) { g.beginPath(); g.moveTo(px + o * pa, py); g.quadraticCurveTo((px + x) / 2 + o * (pa + arm) / 2, (py + y - h + h * 0.06) / 2 + (h * 0.1), x + o * arm, y - h + h * 0.06); g.stroke(); }
      }
      px = x; py = y - h + h * 0.06; pa = arm;
    }
  }

  function drawScene(v) {
    const { W, H, hy, gy } = L, d = v.dawn, now = S.now;
    // ----- trời -----
    let gr = g.createLinearGradient(0, 0, 0, hy + 2);
    gr.addColorStop(0, rgb(keyed(SKY_TOP, d))); gr.addColorStop(0.62, rgb(keyed(SKY_MID, d))); gr.addColorStop(1, rgb(keyed(SKY_LOW, d)));
    g.fillStyle = gr; g.fillRect(0, 0, W, hy + 2);
    // sao
    const sa = clamp(1 - d * 1.5);
    if (sa > 0.01) for (const s of stars) {
      g.globalAlpha = sa * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * s.f + s.p))) * (1 - s.y * 0.5);
      g.fillStyle = '#E9ECFF'; g.fillRect(s.x * W, s.y * hy * 0.96, s.r, s.r);
    }
    g.globalAlpha = 1;
    // ----- núi xa -----
    for (let i = 0; i < 3; i++) {
      const base = mix([[17, 21, 46], [13, 17, 38], [9, 13, 29]][i], [[150, 140, 178], [104, 108, 150], [62, 82, 104]][i], Math.pow(d, 1.25));
      ridgePath(i); g.fillStyle = rgb(base); g.fill();
      if (v.gold > 0.01) { // nắng từ phía em rọi lên sườn núi: đỉnh trước, chân sau
        g.save(); ridgePath(i); g.clip();
        const top = hy - H * 0.18, reach = top + (hy - top) * (0.25 + 0.95 * v.gold);
        gr = g.createLinearGradient(0, top, 0, reach);
        gr.addColorStop(0, 'rgba(255,196,128,' + (0.62 * v.gold * (1 - i * 0.16)) + ')'); gr.addColorStop(1, 'rgba(255,170,110,0)');
        g.fillStyle = gr; g.fillRect(0, top, W, hy - top + 4); g.restore();
      }
    }
    // ----- mặt đất và đồi chè -----
    gr = g.createLinearGradient(0, hy, 0, gy);
    gr.addColorStop(0, rgb(mix([7, 10, 20], [70, 92, 96], d))); gr.addColorStop(1, rgb(mix([4, 6, 12], [30, 44, 46], d)));
    g.fillStyle = gr; g.fillRect(0, hy, W, gy - hy + 2);
    for (const side of [-1, 1]) {
      hillPath(side); g.fillStyle = rgb(mix([6, 10, 17], [38, 74, 62], Math.pow(d, 1.1))); g.fill();
      g.save(); hillPath(side); g.clip();
      // luống chè: những đường cong song song ôm theo lưng đồi
      const dd = side < 0 ? 0 : 1, X = (f) => (dd ? W - W * f : W * f);
      for (let k = 1; k < 9; k++) {
        const off = k * H * 0.0085 + k * k * H * 0.0011;
        g.beginPath(); g.moveTo(X(-0.05), hy + H * 0.02 + off); g.save(); g.translate(0, off); hillTop(X, hy, H); g.restore();
        g.strokeStyle = rgb(mix([15, 24, 36], [92, 140, 100], d), 0.42); g.lineWidth = 1 + k * 0.2; g.stroke();
        if (v.gold > 0.02) { g.strokeStyle = 'rgba(255,205,130,' + (0.34 * v.gold * clamp(1.2 - k * 0.11)) + ')'; g.lineWidth = 0.8 + k * 0.1; g.stroke(); }
      }
      g.restore();
    }
    // ----- ô cửa sáng đèn ở rất xa (cuối con đường) -----
    const wx = roadX(0), wy = hy - 3;
    g.fillStyle = rgb(mix([5, 7, 14], [40, 48, 70], d)); // mái nhà nhỏ
    g.beginPath(); g.moveTo(wx - 7, wy + 3); g.lineTo(wx - 7, wy - 3); g.lineTo(wx, wy - 8); g.lineTo(wx + 7, wy - 3); g.lineTo(wx + 7, wy + 3); g.closePath(); g.fill();
    if (v.win > 0.01) {
      g.globalCompositeOperation = 'lighter';
      const r = (9 + 16 * Math.min(1, v.win)) * (1 + 0.5 * Math.max(0, v.win - 1)) * (1 + 0.04 * Math.sin(now * 2.3));
      g.globalAlpha = Math.min(1, v.win) * 0.9; g.drawImage(SP.glow, wx - r, wy - r, r * 2, r * 2);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(255,224,160,' + Math.min(1, v.win) + ')'; g.fillRect(wx - 1.5, wy - 2.5, 3, 3.4);
    }

    // ----- con đường -----
    const N = 40; g.beginPath();
    for (let k = 0; k <= N; k++) { const s = k / N; g.lineTo(roadX(s) - roadH(s), roadY(s)); }
    for (let k = N; k >= 0; k--) { const s = k / N; g.lineTo(roadX(s) + roadH(s), roadY(s)); }
    g.closePath();
    gr = g.createLinearGradient(0, hy, 0, gy);
    gr.addColorStop(0, rgb(mix([12, 15, 27], [112, 108, 122], d))); gr.addColorStop(1, rgb(mix([15, 17, 28], [78, 74, 84], d)));
    g.fillStyle = gr; g.fill();
    const sh = sOf(v.p), yh = roadY(sh);
    for (const o of [-1, 1]) { // vạch sơn hai mép đường
      g.beginPath(); for (let k = 0; k <= N; k++) { const s = k / N; g.lineTo(roadX(s) + o * roadH(s) * 0.93, roadY(s)); }
      g.strokeStyle = rgb(mix([120, 128, 160], [240, 236, 224], d), 0.16 + 0.2 * d); g.lineWidth = 1.2; g.stroke();
    }
    if (v.p > 0.001) { // mặt đường hắt sáng ở đoạn đã có đèn
      g.save(); g.clip(); gr = g.createLinearGradient(0, hy, 0, yh + 6);
      gr.addColorStop(0, 'rgba(255,190,110,.05)'); gr.addColorStop(1, 'rgba(255,190,110,' + (0.2 + 0.16 * v.twinkle) + ')');
      g.fillStyle = gr; g.fillRect(0, hy, W, yh - hy + 6); g.restore();
    }
    if (v.gold > 0.02) { // bóng song cổng đổ dài ra đường (nắng ở sau lưng em)
      g.save(); g.globalAlpha = 0.2 * v.gold; g.fillStyle = '#0a0c16';
      for (const x of barXs(0)) { const sx = W / 2 + (x - W / 2) * 0.16; g.beginPath(); g.moveTo(x - L.bw * 0.6, gy); g.lineTo(x + L.bw * 0.6, gy); g.lineTo(sx, roadY(0.2)); g.closePath(); g.fill(); }
      g.restore();
    }

    drawPoles(v, sh);
    // ----- sương -----
    for (let i = 0; i < 4; i++) {
      const fyy = hy + (gy - hy) * [0.0, 0.05, 0.16, 0.36][i], fw = W * [1.5, 1.7, 2, 2.4][i], fh = H * [0.05, 0.06, 0.09, 0.13][i];
      const fx = ((now * [5, -7, 9, -12][i] + i * 333) % (fw * 0.5)) - fw * 0.25 + W / 2 - fw / 2;
      g.globalAlpha = [0.5, 0.42, 0.3, 0.2][i] * (1 - 0.45 * d); g.drawImage(SP.fog, fx, fyy - fh / 2, fw, fh);
      const near = clamp(1 - Math.abs(fyy - yh) / (H * 0.09)) * (v.p > 0.001 ? 1 : 0);
      if (near > 0.01) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 * near; const ww = L.rw * 3 * (0.3 + sh); g.drawImage(SP.warm, roadX(sh) - ww / 2, fyy - fh * 0.6, ww, fh * 1.2); g.globalCompositeOperation = 'source-over'; }
    }
    g.globalAlpha = 1;

    // ----- 999 vạch -----
    // Ở xa các vạch dày đặc thành một sợi sáng; về gần, chỉ vẽ những vạch đủ cách nhau để từng vạch đứng riêng.
    const lit = Math.floor(v.p * 999 + 0.0001), mr = L.rw * 0.058, lastY = [-99, -99];
    for (let j = 1; j <= 999; j++) {
      const s = sOf(j / 999), r = mr * s, m = marks[j], side = j & 1;
      const x = roadX(s) + roadH(s) * ((side ? 1 : -1) * 0.15 + m.j * 0.05), y = roadY(s);
      const isLit = j <= lit;
      if (r >= 1.1) { if (y - lastY[side] < r * 1.5 && j !== lit) continue; lastY[side] = y; }
      if (isLit) {
        const tw = 1 - v.twinkle * 0.6 * (0.5 + 0.5 * Math.sin(now * m.f + m.p));
        const fresh = 1 + 1.6 * clamp(1 - (lit - j) / 22);
        if (r < 1.1) { g.fillStyle = 'rgba(255,214,150,' + clamp(0.3 + r * 0.55) * tw + ')'; g.fillRect(x - 0.6, y - 0.6, 1.3, 1.3); continue; }
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = clamp(0.3 * tw * fresh);
        const gw = r * 5 * (1 + 0.2 * v.twinkle); g.drawImage(SP.glow, x - gw / 2, y - gw * 0.3, gw, gw * 0.6);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        g.fillStyle = 'rgba(255,236,196,' + clamp(0.92 * tw) + ')'; g.beginPath(); g.ellipse(x, y, r, r * 0.4, 0, 0, 6.29); g.fill();
      } else {
        const a = (0.07 + 0.2 * d) * clamp(r / 1.6) + v.reveal * 0.5 * clamp(r / 0.6 + 0.25);
        if (a < 0.02) continue;
        g.fillStyle = 'rgba(206,214,238,' + a + ')';
        if (r < 1.1) g.fillRect(x - 0.5, y - 0.5, 1, 1); else { g.beginPath(); g.ellipse(x, y, r * 0.86, r * 0.36, 0, 0, 6.29); g.fill(); }
      }
    }
    // ----- đầu ánh sáng đang tới -----
    if (v.p > 0.0005) {
      const hx = roadX(sh), hr = Math.max(7, L.rw * 1.5 * sh) * (1 + 0.05 * Math.sin(now * 3.1)) * (1 - 0.25 * v.gate);
      g.globalCompositeOperation = 'lighter';
      const fl = v.dim < 0.95 ? v.dim * (0.75 + 0.25 * Math.sin(now * 23) * Math.sin(now * 7.1)) : 1; // chập chờn khi chững lại
      g.globalAlpha = 0.95 * fl; g.drawImage(SP.glow, hx - hr, yh - hr * 0.9, hr * 2, hr * 1.5);
      g.globalAlpha = 0.5 * fl; g.drawImage(SP.warm, hx - hr * 1.8, yh - hr * 0.5, hr * 3.6, hr * 1.1);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    // nắng phủ nhẹ cả cảnh
    if (v.gold > 0.02) { g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,190,120,' + 0.28 * v.gold + ')'; g.fillRect(0, hy - H * 0.2, W, gy - hy + H * 0.2); g.globalCompositeOperation = 'source-over'; }
  }

  // Vị trí các song cổng (đã tính độ mở: mỗi cánh xoay quanh bản lề ở mép màn hình)
  function barXs(open) {
    const xs = [], W = L.W, c = Math.cos(open * 1.38), hl = -L.bs * 0.3, hr = W + L.bs * 0.3;
    for (let k = 0; ; k++) { const x = W / 2 - L.bs * 0.16 - k * L.bs; if (x < hl) break; xs.push(hl + (x - hl) * c); }
    for (let k = 0; ; k++) { const x = W / 2 + L.bs * 0.16 + k * L.bs; if (x > hr) break; xs.push(hr + (x - hr) * c); }
    return xs;
  }

  // Dấu giày của em trên sân (mũi hướng ra cổng), nằm bẹt theo mặt đất
  function footShape(x, y, r) {
    g.beginPath();
    g.ellipse(x, y - r * 0.13, r * 0.5, r * 0.25, 0, 0, 6.29);
    g.moveTo(x + r * 0.34, y + r * 0.27); g.ellipse(x, y + r * 0.27, r * 0.34, r * 0.13, 0, 0, 6.29);
  }

  function drawGate(v) {
    const { W, H, hy, gy, bw } = L, c = Math.cos(v.open * 1.38), now = S.now;
    const hl = -L.bs * 0.3, hr = W + L.bs * 0.3, seamL = hl + (W / 2 - L.bs * 0.16 - hl) * c, seamR = hr + (W / 2 + L.bs * 0.16 - hr) * c;
    // ----- sân trong cổng -----
    let gr = g.createLinearGradient(0, gy, 0, H);
    gr.addColorStop(0, rgb(mix([9, 10, 17], [74, 60, 54], v.gold))); gr.addColorStop(1, rgb(mix([4, 4, 8], [42, 34, 34], v.gold)));
    g.fillStyle = gr; g.fillRect(0, gy, W, H - gy);
    // ánh đèn ngoài đường lọt qua khe song, loang trên sân
    const spill = clamp(v.gate * 0.75 + v.twinkle * 0.25 + v.open * 0.6);
    const xs = barXs(v.open).sort((a, b) => a - b);
    if (spill > 0.01) {
      g.save(); g.beginPath(); g.rect(0, gy, W, H - gy); g.clip(); g.globalCompositeOperation = 'lighter';
      const edges = v.open > 0.03 ? [seamL, seamR] : [hl - 20, ...xs, hr + 20];
      for (let i = 0; i < edges.length - 1; i++) {
        const a = edges[i] + bw * 0.7, b = edges[i + 1] - bw * 0.7; if (b - a < 2) continue;
        const k = 1.9, ax = W / 2 + (a - W / 2) * k, bx = W / 2 + (b - W / 2) * k;
        const mid = (a + b) / 2, fall = clamp(1.1 - Math.abs(mid - W / 2) / (L.rw * 1.5));
        if (fall <= 0) continue;
        gr = g.createLinearGradient(0, gy, 0, H);
        gr.addColorStop(0, 'rgba(255,196,120,' + 0.5 * spill * fall + ')'); gr.addColorStop(1, 'rgba(255,170,100,' + 0.1 * spill * fall + ')');
        g.fillStyle = gr; g.beginPath(); g.moveTo(a, gy); g.lineTo(b, gy); g.lineTo(bx, H); g.lineTo(ax, H); g.closePath(); g.fill();
      }
      g.restore();
    }
    // ----- dấu chân của em (vạch số 1) -----
    const fx = W / 2, fy = L.fy, fr = L.fr;
    if (!S.stepped) {
      const pu = 0.5 + 0.5 * Math.sin(now * 2.1);
      g.strokeStyle = 'rgba(232,226,214,' + (0.3 + 0.3 * pu) + ')'; g.lineWidth = 1.4; g.setLineDash([4, 5]);
      footShape(fx, fy, fr); g.stroke(); g.setLineDash([]);
      if (S.hold > 0) {
        g.strokeStyle = 'rgba(255,220,160,.95)'; g.lineWidth = 2.4; g.beginPath(); g.ellipse(fx, fy, fr * 1.3, fr * 0.56, 0, -1.571, -1.571 + 6.283 * S.hold); g.stroke();
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = S.hold * 0.7; g.drawImage(SP.glow, fx - fr * 2, fy - fr * 0.9, fr * 4, fr * 1.8); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      }
    } else {
      const fl = v.footFlare, gw = fr * (5 + 5 * fl);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.75 + 0.25 * fl; g.drawImage(SP.glow, fx - gw / 2, fy - gw * 0.27, gw, gw * 0.54);
      if (fl > 0.02) { g.globalAlpha = fl * 0.7; g.drawImage(SP.warm, fx - gw * 1.1, fy - gw * 0.42, gw * 2.2, gw * 0.84); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#FFF1D2'; footShape(fx, fy, fr); g.fill();
      if (S.ask) { // ở cổng: dấu chân lại mời em, dù một bước đã là đủ
        const pu = 0.5 + 0.5 * Math.sin(now * 2.6);
        g.strokeStyle = 'rgba(255,236,200,' + (0.35 + 0.45 * pu) + ')'; g.lineWidth = 1.6; g.setLineDash([4, 6]); g.beginPath(); g.ellipse(fx, fy, fr * (1.5 + 0.12 * pu), fr * (0.72 + 0.06 * pu), 0, 0, 6.29); g.stroke(); g.setLineDash([]);
        if (S.hold > 0) { g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 2.6; g.beginPath(); g.ellipse(fx, fy, fr * 1.5, fr * 0.72, 0, -1.571, -1.571 + 6.283 * S.hold); g.stroke(); }
      }
    }
    // ----- cánh cổng: song sắt chạy hết chiều cao, một thanh ngang trên, một thanh ngang dưới -----
    const iron = rgb(mix([5, 6, 11], [38, 33, 34], v.gold * 0.9));
    const rim = clamp(v.gate * 0.85 + v.twinkle * 0.15);
    for (const x of xs) {
      const seam = Math.abs(x - seamL) < 0.5 || Math.abs(x - seamR) < 0.5, w = (seam ? bw * 1.7 : bw) * (0.55 + 0.45 * c);
      g.fillStyle = iron; g.fillRect(x - w / 2, -4, w, gy + 4);
      if (rim > 0.01) { // mép song phía con đường bắt ánh đèn
        const side = x < W / 2 ? 1 : -1, hot = clamp(1.25 - Math.abs(x - W / 2) / (L.rw * 1.7));
        gr = g.createLinearGradient(0, hy - H * 0.1, 0, gy);
        gr.addColorStop(0, 'rgba(255,205,135,0)'); gr.addColorStop(0.55, 'rgba(255,205,135,' + 0.55 * rim * hot + ')'); gr.addColorStop(1, 'rgba(255,220,160,' + 0.95 * rim * hot + ')');
        g.fillStyle = gr; g.fillRect(x + side * (w / 2 - 1.2) - 0.6, hy - H * 0.1, 1.3, gy - hy + H * 0.1);
      }
    }
    const railH = Math.max(4, bw * 1.25);
    for (const [a, b] of [[hl, seamL], [seamR, hr]]) {
      g.fillStyle = iron; g.fillRect(Math.min(a, b) - bw, L.rail, Math.abs(b - a) + bw * 2, railH); g.fillRect(Math.min(a, b) - bw, gy - railH * 1.6, Math.abs(b - a) + bw * 2, railH * 1.3);
      if (rim > 0.01) { g.fillStyle = 'rgba(255,214,150,' + 0.4 * rim + ')'; g.fillRect(Math.min(a, b), gy - railH * 1.6, Math.abs(b - a), 1.2); }
    }
    // then cài giữa hai cánh
    if (v.open < 0.02) {
      const ly = L.rail + railH * 3.2, lw = L.bs * 0.62, lh = Math.max(16, L.m * 0.05);
      g.fillStyle = iron; g.fillRect(W / 2 - lw / 2, ly, lw, lh);
      g.fillStyle = rgb(mix([14, 15, 24], [70, 60, 56], v.gold)); g.fillRect(W / 2 - lw / 2 + 2, ly + 2, lw - 4, lh - 4);
      g.fillStyle = iron; g.beginPath(); g.arc(W / 2, ly + lh * 0.45, lh * 0.13, 0, 6.29); g.fill(); g.fillRect(W / 2 - lh * 0.045, ly + lh * 0.45, lh * 0.09, lh * 0.3);
    }
    // chân tường hai bên
    g.fillStyle = iron; g.fillRect(0, gy - 2, W, 3.5);
  }

  // ================= Đồ vật (hiện giữa trời như một ký ức nổi lên) =================
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  const OBJS = {
    // Đèn bàn còn sáng, laptop mở bộ câu hỏi ôn thi
    den(u, k) {
      // mặt bàn
      let gr = g.createLinearGradient(-u, 0.52 * u, u, 0.52 * u); gr.addColorStop(0, 'rgba(60,44,36,0)'); gr.addColorStop(0.2, '#3a2a22'); gr.addColorStop(0.8, '#46332a'); gr.addColorStop(1, 'rgba(60,44,36,0)');
      g.fillStyle = gr; g.fillRect(-u, 0.52 * u, 2 * u, 0.07 * u);
      // laptop: màn hình
      g.save(); g.translate(-0.3 * u, 0); g.transform(1, 0, -0.06, 1, 0, 0);
      rr(-0.44 * u, -0.34 * u, 0.88 * u, 0.6 * u, 0.03 * u); g.fillStyle = '#15171f'; g.fill();
      gr = g.createLinearGradient(0, -0.32 * u, 0, 0.24 * u); gr.addColorStop(0, '#f1f4fb'); gr.addColorStop(1, '#d5dcee');
      rr(-0.41 * u, -0.31 * u, 0.82 * u, 0.54 * u, 0.015 * u); g.fillStyle = gr; g.fill();
      // một câu hỏi trắc nghiệm
      g.fillStyle = '#3b4664'; g.fillRect(-0.36 * u, -0.26 * u, 0.2 * u, 0.028 * u);
      g.fillStyle = '#7a84a0'; g.fillRect(-0.36 * u, -0.2 * u, 0.7 * u, 0.02 * u); g.fillRect(-0.36 * u, -0.16 * u, 0.52 * u, 0.02 * u);
      for (let i = 0; i < 4; i++) {
        const y = (-0.1 + i * 0.075) * u; rr(-0.36 * u, y, 0.72 * u, 0.055 * u, 0.012 * u);
        g.fillStyle = i === 1 ? '#f6dca4' : '#ffffff'; g.fill(); g.strokeStyle = i === 1 ? '#d9a64e' : '#b9c2d8'; g.lineWidth = 1; g.stroke();
        g.fillStyle = '#8791ab'; g.fillRect(-0.33 * u, y + 0.02 * u, (0.3 + ((i * 37) % 5) * 0.06) * u, 0.016 * u);
      }
      g.restore();
      // laptop: thân
      g.beginPath(); g.moveTo(-0.78 * u, 0.28 * u); g.lineTo(0.14 * u, 0.28 * u); g.lineTo(0.24 * u, 0.52 * u); g.lineTo(-0.88 * u, 0.52 * u); g.closePath();
      gr = g.createLinearGradient(0, 0.28 * u, 0, 0.52 * u); gr.addColorStop(0, '#2a2d38'); gr.addColorStop(1, '#1a1c25'); g.fillStyle = gr; g.fill();
      g.fillStyle = 'rgba(210,222,250,.12)'; for (let r2 = 0; r2 < 3; r2++) g.fillRect((-0.72 - r2 * 0.03) * u, (0.32 + r2 * 0.055) * u, (0.8 + r2 * 0.06) * u, 0.03 * u);
      // đèn bàn
      g.strokeStyle = '#1b1c24'; g.lineWidth = 0.035 * u; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0.66 * u, 0.5 * u); g.lineTo(0.72 * u, -0.08 * u); g.lineTo(0.46 * u, -0.44 * u); g.stroke();
      g.fillStyle = '#1b1c24'; g.beginPath(); g.ellipse(0.66 * u, 0.515 * u, 0.17 * u, 0.035 * u, 0, 0, 6.29); g.fill();
      g.save(); g.translate(0.44 * u, -0.46 * u); g.rotate(-0.62);
      g.beginPath(); g.moveTo(-0.07 * u, -0.06 * u); g.lineTo(0.07 * u, -0.06 * u); g.lineTo(0.17 * u, 0.12 * u); g.lineTo(-0.17 * u, 0.12 * u); g.closePath(); g.fillStyle = '#2b2a30'; g.fill();
      g.fillStyle = '#FFE9B8'; g.beginPath(); g.ellipse(0, 0.12 * u, 0.15 * u, 0.03 * u, 0, 0, 6.29); g.fill(); g.restore();
      // vùng sáng của đèn
      g.globalCompositeOperation = 'lighter';
      for (let q = 0; q < 4; q++) { // nhiều lớp chồng nhau cho mép vùng sáng mềm
        const e = q * 0.07 * u;
        gr = g.createLinearGradient(0.36 * u, -0.36 * u, 0.1 * u, 0.52 * u); gr.addColorStop(0, 'rgba(255,214,140,' + 0.17 * k + ')'); gr.addColorStop(1, 'rgba(255,190,110,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(0.3 * u, -0.38 * u); g.lineTo(0.5 * u, -0.3 * u); g.lineTo(0.5 * u - e, 0.52 * u); g.lineTo(-0.62 * u + e * 2.4, 0.52 * u); g.closePath(); g.fill();
      }
      g.globalAlpha *= 0.8; g.drawImage(SP.glow, 0.1 * u, -0.72 * u, 0.6 * u, 0.6 * u);
      g.globalCompositeOperation = 'source-over';
    },
    // Điện thoại: lịch sử những cuộc gọi nhỡ từ "Em"
    goi(u, k, t) {
      const bz = (t > 1.4 && t < 2 || t > 2.35 && t < 2.95) ? Math.sin(t * 190) * 0.012 * u : 0;
      g.save(); g.translate(bz, 0); g.rotate(-0.05 + bz * 0.02);
      const w = 0.72 * u, h = 1.42 * u;
      rr(-w / 2, -h / 2, w, h, 0.1 * u); g.fillStyle = '#0c0d13'; g.fill(); g.strokeStyle = '#3a3d4c'; g.lineWidth = 1.5; g.stroke();
      rr(-w / 2 + 0.03 * u, -h / 2 + 0.03 * u, w - 0.06 * u, h - 0.06 * u, 0.075 * u); g.fillStyle = '#10131f'; g.fill();
      g.fillStyle = '#05060a'; rr(-0.1 * u, -h / 2 + 0.055 * u, 0.2 * u, 0.05 * u, 0.025 * u); g.fill();
      g.textBaseline = 'middle'; g.textAlign = 'left';
      g.fillStyle = '#E9ECF6'; g.font = '600 ' + (0.085 * u) + 'px "Be Vietnam Pro", sans-serif'; g.fillText('Gần đây', -w / 2 + 0.09 * u, -h / 2 + 0.2 * u);
      for (let i = 0; i < 6; i++) {
        const y = -h / 2 + (0.36 + i * 0.165) * u, on = clamp((t - 0.5 - i * 0.16) * 3);
        g.globalAlpha *= 1; g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(-w / 2 + 0.08 * u, y + 0.078 * u, w - 0.16 * u, 1);
        const a0 = g.globalAlpha; g.globalAlpha = a0 * on;
        // mũi tên gọi nhỡ
        g.strokeStyle = '#FF6B6B'; g.lineWidth = Math.max(1.2, 0.014 * u); g.lineCap = 'round';
        g.beginPath(); g.moveTo(-w / 2 + 0.16 * u, y - 0.03 * u); g.lineTo(-w / 2 + 0.1 * u, y + 0.03 * u); g.moveTo(-w / 2 + 0.1 * u, y - 0.012 * u); g.lineTo(-w / 2 + 0.1 * u, y + 0.03 * u); g.lineTo(-w / 2 + 0.142 * u, y + 0.03 * u); g.stroke();
        g.fillStyle = '#FF8080'; g.font = '600 ' + (0.092 * u) + 'px "Be Vietnam Pro", sans-serif'; g.fillText('Em', -w / 2 + 0.21 * u, y - 0.012 * u);
        g.fillStyle = 'rgba(233,236,246,.5)'; g.font = '400 ' + (0.052 * u) + 'px "Be Vietnam Pro", sans-serif'; g.fillText('Cuộc gọi nhỡ', -w / 2 + 0.21 * u, y + 0.048 * u);
        g.globalAlpha = a0;
      }
      g.restore();
      g.globalCompositeOperation = 'lighter'; g.globalAlpha *= 0.35; g.drawImage(SP.fog, -0.7 * u, -0.95 * u, 1.4 * u, 1.9 * u); g.globalCompositeOperation = 'source-over';
    },
    // Khay cơm căng tin còn nguyên, đôi đũa chưa ai cầm
    khay(u) {
      g.save(); g.transform(1, 0, -0.18, 0.6, 0, 0.12 * u);
      let gr = g.createLinearGradient(-u, -0.7 * u, u, 0.7 * u); gr.addColorStop(0, '#aeb6c4'); gr.addColorStop(0.45, '#7b8494'); gr.addColorStop(1, '#565e6e');
      rr(-0.9 * u, -0.66 * u, 1.8 * u, 1.32 * u, 0.12 * u); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(235,240,250,.55)'; g.lineWidth = 1.4; g.stroke();
      const well = (x, y, w, h) => { const q = g.createLinearGradient(x, y, x + w, y + h); q.addColorStop(0, '#4d5565'); q.addColorStop(1, '#8a93a3'); rr(x, y, w, h, 0.07 * u); g.fillStyle = q; g.fill(); g.strokeStyle = 'rgba(20,24,34,.5)'; g.lineWidth = 1; g.stroke(); };
      well(-0.8 * u, -0.56 * u, 0.5 * u, 0.44 * u); well(-0.24 * u, -0.56 * u, 0.5 * u, 0.44 * u); well(0.32 * u, -0.56 * u, 0.48 * u, 0.44 * u);
      well(-0.8 * u, -0.04 * u, 0.94 * u, 0.6 * u); well(0.2 * u, -0.04 * u, 0.6 * u, 0.6 * u);
      g.restore();
      // ụ cơm trắng còn nguyên
      let q = g.createRadialGradient(-0.36 * u, 0.2 * u, 0.02 * u, -0.3 * u, 0.3 * u, 0.36 * u); q.addColorStop(0, '#ffffff'); q.addColorStop(0.7, '#ece8de'); q.addColorStop(1, '#cfc9bc');
      g.fillStyle = q; g.beginPath(); g.ellipse(-0.3 * u, 0.3 * u, 0.33 * u, 0.15 * u, -0.05, Math.PI, 0); g.ellipse(-0.3 * u, 0.3 * u, 0.33 * u, 0.07 * u, -0.05, 0, Math.PI); g.fill();
      g.fillStyle = 'rgba(160,150,130,.5)'; for (let i = 0; i < 26; i++) { const a = i * 2.4, r0 = 0.05 + (i % 7) * 0.035; g.fillRect((-0.3 + Math.cos(a) * r0 * 1.6) * u, (0.24 + Math.sin(a) * r0 * 0.5) * u, 0.018 * u, 0.008 * u); }
      // đôi đũa đặt ngay ngắn bên mép khay
      g.lineCap = 'round'; g.lineWidth = 0.026 * u;
      for (const o of [0, 0.05]) { q = g.createLinearGradient(-0.2 * u, 0, 0.95 * u, 0); q.addColorStop(0, '#c9a476'); q.addColorStop(1, '#8a6846'); g.strokeStyle = q; g.beginPath(); g.moveTo(-0.26 * u, (0.62 + o) * u); g.lineTo(0.92 * u, (0.5 + o) * u); g.stroke(); }
    },
    // Đồng hồ bấm giờ 00:00, chưa ai bấm (kết gặp được)
    bam(u) {
      const w = 0.72 * u, h = 1.42 * u;
      g.save(); g.rotate(0.04);
      rr(-w / 2, -h / 2, w, h, 0.1 * u); g.fillStyle = '#0c0d13'; g.fill(); g.strokeStyle = '#3a3d4c'; g.lineWidth = 1.5; g.stroke();
      rr(-w / 2 + 0.03 * u, -h / 2 + 0.03 * u, w - 0.06 * u, h - 0.06 * u, 0.075 * u); g.fillStyle = '#0a0b10'; g.fill();
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#F4F1EA'; g.font = '300 ' + (0.2 * u) + 'px "Fraunces", serif'; g.fillText('00:00', 0, -0.2 * u);
      g.fillStyle = 'rgba(244,241,234,.45)'; g.font = '400 ' + (0.056 * u) + 'px "Be Vietnam Pro", sans-serif'; g.fillText('Bấm giờ', 0, -0.47 * u);
      g.strokeStyle = 'rgba(120,220,150,.8)'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0.33 * u, 0.13 * u, 0, 6.29); g.stroke();
      g.fillStyle = 'rgba(120,220,150,.85)'; g.font = '500 ' + (0.058 * u) + 'px "Be Vietnam Pro", sans-serif'; g.fillText('Bắt đầu', 0, 0.335 * u);
      g.restore();
    },
  };
  function drawObject(t) {
    const list = OBJ_COMMON.concat(OBJ[KET || 'none']);
    for (const [a, b, id] of list) {
      if (t < a || t > b) continue;
      const k = ss(a, a + 1.3, t) * (1 - ss(b - 1.3, b, t)), u = L.or;
      g.save(); g.translate(L.ox, L.oy + (1 - k) * u * 0.08 + Math.sin(S.now * 0.7) * u * 0.012);
      // nền tối mềm để đồ vật nổi khỏi trời sao và song cổng
      const kb = k * (1 - 0.8 * ss(0.3, 0.9, show(t).dawn));
      const gr = g.createRadialGradient(0, 0, u * 0.3, 0, 0, u * 1.55); gr.addColorStop(0, 'rgba(6,8,18,' + 0.9 * kb + ')'); gr.addColorStop(0.7, 'rgba(6,8,18,' + 0.72 * kb + ')'); gr.addColorStop(1, 'rgba(6,8,18,0)');
      g.fillStyle = gr; g.fillRect(-u * 1.6, -u * 1.6, u * 3.2, u * 3.2);
      g.globalAlpha = k; OBJS[id](u, k, t - a); g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  }

  // ----- Cảnh cắt cận: cả khung hình là một góc tĩnh vật, máy quay tiến rất chậm -----
  function drawInsert(id, tt, dur) {
    const { W, H } = L, z = 1.02 + 0.06 * tt / dur;
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    let gr;
    if (id === 'den') {
      const dy = H * 0.63, u = Math.min(W * 0.4, H * 0.27);
      gr = g.createLinearGradient(0, 0, 0, dy); gr.addColorStop(0, '#05060d'); gr.addColorStop(1, '#0d0d18'); g.fillStyle = gr; g.fillRect(0, 0, W, dy);
      // ô cửa sổ: trời ngoài kia đã hửng xanh
      const ww = Math.min(W * 0.3, u * 1.1), wh = ww * 1.25, wx = W * 0.1, wy = H * 0.17;
      gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#16224a'); gr.addColorStop(1, '#4a4a78'); g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = '#07080f'; g.fillRect(wx + ww / 2 - 2, wy, 4, wh); g.fillRect(wx, wy + wh * 0.5 - 2, ww, 4); g.strokeStyle = '#07080f'; g.lineWidth = 5; g.strokeRect(wx, wy, ww, wh);
      // vầng sáng của đèn hắt lên tường
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(SP.warm, W / 2 - u * 1.4, dy - u * 2.3, u * 3.4, u * 2.9); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      gr = g.createLinearGradient(0, dy, 0, H); gr.addColorStop(0, '#3b2a21'); gr.addColorStop(0.12, '#2a1d17'); gr.addColorStop(1, '#0b0807'); g.fillStyle = gr; g.fillRect(0, dy, W, H - dy);
      g.fillStyle = 'rgba(255,214,150,.22)'; g.fillRect(0, dy, W, 1.5);
      g.save(); g.translate(W / 2 + u * 0.08, dy - 0.52 * u); OBJS.den(u, 1, tt); g.restore();
    } else if (id === 'goi') {
      const u = Math.min(W * 0.4, H * 0.27);
      gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#1d1511'); gr.addColorStop(1, '#0b0807'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,220,190,.035)'; g.lineWidth = 1; for (let i = 0; i < 26; i++) { const y = H * (i / 26) + Math.sin(i * 7.3) * 6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + Math.sin(i) * 9, W * 0.7, y - Math.cos(i * 2) * 9, W, y + 4); g.stroke(); }
      // màn hình hắt sáng lên mặt bàn, bừng hơn ở mỗi hồi rung
      const bz = (tt > 1.4 && tt < 2) || (tt > 2.35 && tt < 2.95) ? 1 : 0;
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 + 0.25 * bz; g.drawImage(SP.fog, W / 2 - u * 2, H * 0.47 - u * 2.1, u * 4, u * 4.2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.save(); g.translate(W / 2, H * 0.47); OBJS.goi(u, 1, tt); g.restore();
    } else if (id === 'khay') {
      const u = Math.min(W * 0.43, H * 0.25);
      gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0a0d14'); gr.addColorStop(0.5, '#161b25'); gr.addColorStop(1, '#090b11'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // mặt bàn inox nhà ăn: mấy vệt sáng lạnh chạy ngang
      for (let i = 0; i < 7; i++) { const y = H * (0.2 + i * 0.1); g.fillStyle = 'rgba(190,205,230,' + (0.018 + 0.012 * (i % 3)) + ')'; g.fillRect(0, y, W, 2 + (i % 2) * 5); }
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(SP.fog, W / 2 - u * 2.2, H * 0.46 - u * 1.7, u * 4.4, u * 3.4); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.save(); g.translate(W / 2, H * 0.44); OBJS.khay(u, 1, tt); g.restore();
    }
    g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  // Độ tối của nhát cắt (chìm nhanh vào đen rồi hiện ra): cho cả cảnh đường lẫn cảnh cận
  function cutDark(t) {
    let dk = 0;
    for (const [a, b] of INSERTS) dk = Math.max(dk, ss(a - 0.28, a, t) * (1 - ss(a, a + 0.32, t)), ss(b - 0.28, b, t) * (1 - ss(b, b + 0.32, t)));
    return dk;
  }

  function drawFinish(v) {
    const { W, H } = L;
    // loé sáng lúc điệp khúc vỡ ra
    if (v.bloom > 0.01) { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,214,160,' + 0.34 * v.bloom + ')'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
    // tối bốn góc + hạt phim
    const gr = g.createRadialGradient(W / 2, H * 0.52, Math.min(W, H) * 0.35, W / 2, H * 0.52, Math.max(W, H) * 0.78);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,6,' + (0.62 - 0.3 * v.dawn) + ')'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (SP.grain) { g.globalAlpha = 0.05; g.globalCompositeOperation = 'overlay'; g.save(); g.translate((S.now * 997) % 128 | 0, (S.now * 613) % 128 | 0); g.fillStyle = SP.grain; g.fillRect(-128, -128, W + 256, H + 256); g.restore(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
  }

  // ================= Chữ =================
  const txt = { line: { el: $('line'), cur: '' }, cap: { el: $('cap'), cur: '' } };
  function setText(which, text, bold) {
    const o = txt[which]; if (o.cur === text) return;
    const had = !!o.cur; o.cur = text; o.el.classList.remove('on');
    clearTimeout(o.tm);
    o.tm = setTimeout(() => { if (o.cur !== text) return; o.el.textContent = text; o.el.classList.toggle('dam', !!bold); if (text) { void o.el.offsetWidth; o.el.classList.add('on'); } }, had ? 900 : 40);
  }
  const pick = (list, t) => { for (const r of list) if (t >= r[0] && t < r[1]) return r; return null; };

  // ================= Nhịp chạy =================
  let lastBeat = -1;
  function fireBetween(a, b, at) { return a < at && b >= at; }
  function tick(ms) {
    const now = ms / 1000; S.dt = Math.min(0.1, now - S.now || 0); S.now = now;
    if (S.phase === 'play') { // phần chơi: hai nửa màn hình (con-lai-choi.js)
      g.clearRect(0, 0, L.W, L.H);
      window.ConLaiChoi.frame(g, L, now, S.dt);
      drawFinish({ bloom: 0, dawn: 0.2 });
      if (S.lbCss !== 0) { S.lbCss = 0; document.documentElement.style.setProperty('--lb', '0px'); }
      requestAnimationFrame(tick); return;
    }
    if (S.phase === 'alone' && !S.stepped) {
      if (S.holding) { S.hold = Math.min(1, S.hold + S.dt / 0.95); if (S.hold >= 1) doStep(); } else S.hold = Math.max(0, S.hold - S.dt * 2.2);
    }
    S.flare = Math.max(0, S.flare - S.dt * 0.55);
    // Ở cổng: em tự tìm ra kết
    S.ask = S.phase === 'show' && S.fin && !KET && S.t >= ASK[0] && S.t < ASK[1];
    if (S.ask) { if (S.holding) { S.hold = Math.min(1, S.hold + S.dt / 0.95); if (S.hold >= 1) choose('a'); } else S.hold = Math.max(0, S.hold - S.dt * 2.2); }
    else if (S.phase === 'show' && S.fin && !KET && S.t >= ASK[1]) choose('b');
    if (S.phase === 'show') {
      S.prevT = S.t;
      const at = A.songTime();
      if (at >= 0) { S.t = at; S.clock = at; } else { S.clock += S.dt; S.t = S.clock; } // bài không phát được thì vẫn chạy theo đồng hồ
      runCues(S.prevT, S.t);
    }
    const v = show(S.phase === 'show' || S.phase === 'after' ? S.t : -1);
    g.clearRect(0, 0, L.W, L.H);
    const tt = S.phase === 'show' || S.phase === 'after' ? S.t : -1, ins = S.fin ? null : pick(INSERTS, tt);
    if (ins) drawInsert(ins[2], tt - ins[0], ins[1] - ins[0]);
    else {
      // máy quay cầm tay rất khẽ + tiến chậm; cổng ở gần nên trôi nhiều hơn cảnh xa (thị sai)
      const zs = v.zoom * 1.012, zg = 1.012 + (v.zoom - 1) * 2.2, hold = 1 - v.still;
      const dx = (Math.sin(now * 0.47) * 1.6 + Math.sin(now * 1.31) * 0.7) * hold, dy = (Math.sin(now * 0.61 + 1) * 1.2 + Math.sin(now * 1.7) * 0.5) * hold;
      g.save(); g.translate(L.W / 2 + dx * 0.45, L.hy + dy * 0.45); g.scale(zs, zs); g.translate(-L.W / 2, -L.hy); drawScene(v); g.restore();
      g.save(); g.translate(L.W / 2 + dx, L.gy + dy); g.scale(zg, zg); g.translate(-L.W / 2, -L.gy); drawGate(v); g.restore();
      if (tt >= 0) drawObject(tt);
    }
    const dk = tt >= 0 && !S.fin ? cutDark(tt) : 0;
    if (dk > 0.01) { g.fillStyle = 'rgba(0,0,0,' + dk + ')'; g.fillRect(0, 0, L.W, L.H); }
    drawFinish(v);
    // dải đen khung phim
    const lbh = L.lbh * v.lb;
    if (lbh > 0.3) { g.fillStyle = '#000'; g.fillRect(0, 0, L.W, lbh); g.fillRect(0, L.H - lbh, L.W, lbh); }
    if (Math.abs(lbh - (S.lbCss == null ? -9 : S.lbCss)) > 0.5) { S.lbCss = lbh; document.documentElement.style.setProperty('--lb', lbh.toFixed(1) + 'px'); }
    $('title').classList.toggle('on', S.phase === 'show' && S.t >= 3.4 && S.t < 9.2);
    if (S.phase === 'show') {
      const n = $('count-n'); if (n.textContent !== String(v.count)) n.textContent = v.count;
      $('count').classList.toggle('on', S.t >= CUE.verse && S.t < CUE.bridge);
      $('count').classList.toggle('full', v.count >= 999);
      $('count').classList.toggle('pop', S.t >= CUE.nineEnd - 0.12 && S.t < CUE.toward + 2.6);
      const li = pick(LINES_COMMON.concat(LINES[KET || 'none']), S.t); setText('line', li ? li[2] : '', li && li[3]);
      const ca = pick(CAPS_COMMON.concat(CAPS[KET || 'none']), S.t); setText('cap', ca ? ca[2] : '');
    }
    requestAnimationFrame(tick);
  }

  function choose(k) {
    KET = k; S.holding = false; S.hold = 0; $('hint').classList.remove('on');
    if (k === 'a') { S.tA = S.t; S.flare = 1; A.step(1, 0); A.boom(); A.latch(); A.warm(5, 0.05); try { if (navigator.vibrate) navigator.vibrate(35); } catch (e) { /* bỏ qua */ } }
    else A.siren(4.6);
    try { const f = JSON.parse(localStorage.getItem('lpn:conlai')) || {}; f[k] = 1; localStorage.setItem('lpn:conlai', JSON.stringify(f)); } catch (e) { /* bỏ qua */ }
  }
  const foundKet = () => { try { return JSON.parse(localStorage.getItem('lpn:conlai')) || {}; } catch (e) { return {}; } };
  // Chữ cuối phim: đã tìm mấy kết, còn kết nào
  function showAfter() {
    const f = foundKet(), n = (f.a ? 1 : 0) + (f.b ? 1 : 0);
    $('af-ket').textContent = n >= 2 ? 'Em đã tìm đủ hai cái kết' : 'Em đã tìm được 1 trong 2 cái kết';
    $('btn-other').hidden = n >= 2; $('after').hidden = false;
  }
  // Về lại khoảnh khắc ở cổng để tìm kết còn lại
  function replayGate() {
    const f = foundKet(); S.other = f.a && !f.b ? 'b' : 'a';
    KET = null; S.tA = 1e9; S.hold = 0; $('after').hidden = true; S.phase = 'show'; S.fin = true;
    S.t = S.prevT = S.clock = 70.6; A.songDist(1, 0.1); A.songPlay(70.6);
  }
  // Vào đoạn cao trào (gọi từ phần chơi khi anh đã đi 950 bước)
  function finale() {
    S.fin = true; S.stepped = true; S.phase = 'show'; S.t = S.prevT = S.clock = 57.4;
    $('count').classList.add('on'); A.windTo(0.14, 2); A.songDist(distOf(57.4), 0.4); A.songPlay(57.4);
  }

  // Tiếng và việc xảy ra một lần khi bài chạy qua từng mốc
  function runCues(a, b) {
    if (b - a > 1.5 || b < a) { A.songDist(distOf(b), 0.2); return; } // vừa tua: bỏ qua tiếng một lần
    A.songDist(distOf(b), 0.25);
    const F = (at) => fireBetween(a, b, at);
    if (F(1.9)) { A.bell(329.6, 0.1, 4); A.bell(493.9, 0.06, 4, 0.5); }                    // ô cửa sáng đèn
    if (F(CUE.weak + 0.9)) A.down();                                                        // ánh sáng chững lại
    if (F(CUE.wake)) { A.step(0.5, 0); A.bell(493.9, 0.07, 3); }                             // dấu chân em gọi, ánh sáng đi tiếp
    if (F(CUE.chorus - 3.5)) A.riser(3.45);                                                 // dồn lên rồi vỡ ra
    if (F(4)) A.droneOff(5);
    // bước chân anh ở xa, rơi đúng phách của bài, gần dần; vào đoạn rap thì nhường cho bài hát
    const k = Math.floor((b - 0.03) / BEAT);
    if (k !== lastBeat) { lastBeat = k; if (b > CUE.verse && b < CUE.rap - 0.5 && !(b > CUE.weak + 1 && b < CUE.wake + 0.5) && !pick(INSERTS, b)) { const n = (b - CUE.verse) / (CUE.rap - CUE.verse); A.step(0.04 + 0.22 * n, (k & 1 ? 0.2 : -0.2)); } }
    if (F(CUE.verse)) A.windTo(0.34, 4);
    if (F(CUE.sit)) A.lamp();
    if (F(CUE.weak + 1.4)) A.buzz(2);
    if (F(CUE.rice)) A.clink();
    if (F(CUE.rap)) A.windTo(0.14, 3);
    if (F(CUE.one)) A.step(0.75, 0);                                                         // "bước một bước": tiếng bước của em vọng lại
    if (F(CUE.nineEnd)) A.bell(659.3, 0.07, 3.5);                                            // 999
    if (F(CUE.calm)) A.hush(1.2);                                                            // lặng một nhịp
    if (F(CUE.chorus)) { A.hit(); A.warm(6, 0.05); A.sparkle(8, 0.03); }
    if (S.fin && S.other && F(87.5)) { $('hint').textContent = S.other === 'a' ? 'em vẫn còn bước được một bước nữa' : 'lần này, em thử đứng yên'; $('hint').classList.add('on'); setTimeout(() => $('hint').classList.remove('on'), 9000); }  // vỡ oà
    if (F(CUE.chorus2)) { A.warm(6, 0.04); A.sparkle(6, 0.024); }
    if (F(CUE.bridge + 3)) showAfter();
    if (F(CUE.end)) { S.phase = 'after'; }
  }

  // Em bước một bước
  function doStep() {
    if (S.stepped) return;
    S.stepped = true; S.holding = false; S.flare = 1; S.stepAt = S.now; S.stepClock = new Date();
    A.step(1, 0); A.boom();
    try { if (navigator.vibrate) navigator.vibrate(35); } catch (e) { /* bỏ qua */ }
    $('hint').classList.remove('on'); setText('line', '');
    setTimeout(() => { S.phase = 'show'; S.t = S.prevT = S.clock = T0; A.songDist(distOf(T0), 0.05); A.songPlay(T0); }, 1900);
  }

  // ================= Chạm =================
  function down(e) {
    if (e.target.closest('button, a')) return;
    if (S.phase === 'play') { window.ConLaiChoi.down(e.clientX, e.clientY); return; }
    if (S.ask) { S.holding = true; return; }
    if (S.phase === 'alone' && !S.stepped) { S.holding = true; return; }
    // Sau bước ấy, chạm nữa cũng không có gì xảy ra: phần còn lại không phải của em
    if (S.phase === 'show' && S.t < CUE.rap && ++S.tried === 2) { $('hint').textContent = 'Một bước là đủ rồi.'; $('hint').classList.add('on'); setTimeout(() => $('hint').classList.remove('on'), 3600); }
  }
  const up = (e) => { S.holding = false; if (S.phase === 'play') window.ConLaiChoi.up(e.clientX, e.clientY); };
  window.addEventListener('pointermove', (e) => { if (S.phase === 'play') window.ConLaiChoi.move(e.clientX, e.clientY); });
  window.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  window.addEventListener('keydown', (e) => { if (e.code === 'Space' && S.phase === 'alone') S.holding = true; });
  window.addEventListener('keyup', (e) => { if (e.code === 'Space') S.holding = false; });
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  // ================= Bắt đầu =================
  $('st-demo').hidden = !SKIP;
  document.querySelectorAll('#st-demo button').forEach((b) => {
    b.classList.toggle('on', b.dataset.ket === KET);
    b.addEventListener('click', () => { KET = b.dataset.ket; document.querySelectorAll('#st-demo button').forEach((x) => x.classList.toggle('on', x === b)); });
  });
  $('btn-go').addEventListener('click', () => {
    A.init(); A.resume(); A.bedStart();
    // iPhone chỉ cho phát nhạc khi bắt đầu từ một lần chạm: mở sẵn bài (im lặng) ngay ở lần chạm này
    if (A.el) { const p = A.el.play(); if (p && p.then) p.then(() => { if (S.phase !== 'show') A.el.pause(); }).catch(() => {}); }
    $('btn-go').classList.add('fire'); $('start').classList.add('out'); $('top').hidden = false;
    if (!SKIP) { S.phase = 'play'; window.ConLaiChoi.start(); return; }
    S.phase = 'alone';
    setTimeout(() => { if (!S.stepped) setText('line', 'Bước một bước thôi.'); }, 4200);
    setTimeout(() => { if (!S.stepped) { $('hint').textContent = 'chạm và giữ'; $('hint').classList.add('on'); } }, 7000);
  });
  $('btn-sound').classList.toggle('off', A.muted);
  $('btn-sound').addEventListener('click', () => { A.mute(!A.muted); $('btn-sound').classList.toggle('off', A.muted); });
  $('btn-again').addEventListener('click', () => location.reload());
  $('btn-other').addEventListener('click', replayGate);

  window.addEventListener('resize', layout);
  layout();
  requestAnimationFrame(tick);
  window.ConLai = { S, L, SP, OBJS, setText, finale, CUE, show, get ket() { return KET; } };
  window.__conlai = window.ConLai; // để thử
})();
