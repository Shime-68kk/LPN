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
  let KET = Q.get('ket') === 'a' ? 'a' : 'b';
  const T0 = Math.max(0, Number(Q.get('t')) || 0); // xem thử: nhảy tới giây này của bài

  // ================= Mốc theo lời bài hát (giây) =================
  const CUE = {
    verse: 10.9,      // "Từ lần đầu tiên ta đi bên nhau"
    sit: 25.6,        // "Cách anh lặng lẽ ngồi / Ngồi nhìn bóng tối lặng thầm"
    weak: 36.0,       // "…có những phút giây yếu đuối không ngờ"
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
  const LINES_COMMON = [
    [3.2, 9.8, 'Ở rất xa, có một ô cửa vừa sáng đèn.'],
  ];
  const LINES = {
    b: [
      [89.5, 95.2, 'Anh đi hết phần của anh rồi.'],
      [96.2, 103.4, 'Chín trăm chín mươi chín vạch sáng. Chỉ còn một khe tối, dày bằng cánh cổng.'],
      [104.4, 110.6, 'Từ hôm em đi, chưa lúc nào anh ở gần em như lúc này.'],
      [111.6, 118.2, 'Em ở đâu đó sau những bức tường kia. Có khi đang ngủ gật.'],
      [119.4, 125.6, 'Hôm nay mình chưa gặp được nhau.'],
      [126.8, 134.4, 'Nhưng anh đã đứng ở chỗ gần em nhất.'],
      [136, 144.5, 'Đường về, anh không thấy dài.'],
      [155.6, 165, 'Em chỉ cần một bước. Phần còn lại là của anh.', 1],
      [166.4, 176, 'Khe tối ấy, để dành cho ngày em về.'],
    ],
    a: [
      [89.5, 95, 'Anh đi hết phần của anh rồi.'],
      [96, 101.4, 'Rồi cánh cổng mở.'],
      [102.4, 112.6, 'Bài hát bảo em chỉ cần một bước. Em lại bước những hai: một bước trên màn hình từ sáng, một bước ra tới cổng.'],
      [121.5, 130.6, 'Lần trước mình giận nhau vì anh xin mười phút.'],
      [131.8, 140, 'Hôm nay anh đi cả buổi sáng, để được đứng trước em mấy phút.'],
      [155.6, 165, 'Em chỉ cần một bước. Phần còn lại là của anh.', 1],
    ],
  };
  const CAPS_COMMON = [
    [27.2, 33.6, 'Đèn bàn sáng từ đêm qua. Bộ câu hỏi soạn chưa xong thì trời đã sáng.'],
    [38.6, 46.2, 'Lần ấy em gọi mãi anh mới nghe. Lần này anh tự đi tìm em.'],
    [51.4, 57.6, 'Tối nào em cũng hỏi anh ăn chưa. Còn khay cơm của em thì cứ để nguyên.'],
  ];
  const CAPS = { b: [], a: [[143.6, 151.5, 'Đồng hồ vẫn để đó. Anh không bấm.']] };
  // Đồ vật hiện giữa trời: [từ, tới, tên]
  const OBJ_COMMON = [[25.4, 34.4, 'den'], [36, 47, 'goi'], [49.6, 58.4, 'khay']];
  const OBJ = { b: [], a: [[141.5, 152.5, 'bam']] };

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
      gy: H * (P ? 0.865 : 0.84),    // chân cổng
      rw: Math.min(W * (P ? 0.35 : 0.24), H * 0.5), // nửa bề rộng đường ở chân cổng
    });
    L.fy = L.gy + (H - L.gy) * 0.56; // dấu chân của em
    L.fr = Math.min(Math.max(21, L.rw * 0.25), (H - L.gy) * 0.36);
    L.bs = clamp(L.m * 0.105, 34, 64); // khoảng cách song cổng
    L.bw = Math.max(3.5, L.m * 0.0125);
    L.rail = L.hy - H * (P ? 0.115 : 0.16);
    // Đồ vật và chữ: màn dọc xếp giữa trời, màn ngang đồ vật bên trái, chữ bên phải
    if (P) { L.ox = W / 2; L.oy = L.hy * 0.43; L.or = Math.min(W * 0.3, L.hy * 0.25); }
    else { L.ox = W * 0.25; L.oy = H * 0.37; L.or = Math.min(H * 0.27, W * 0.16); }
    const line = $('line'), cap = $('cap');
    if (P) {
      line.style.top = Math.round(L.hy * 0.36) + 'px'; line.style.left = '50%';
      cap.style.top = Math.round(L.oy + L.or * 1.2) + 'px'; cap.style.left = '50%'; cap.style.width = '';
    } else {
      line.style.top = Math.round(H * 0.2) + 'px'; line.style.left = '50%';
      cap.style.top = Math.round(H * 0.25) + 'px'; cap.style.left = '66%'; cap.style.width = Math.round(W * 0.42) + 'px';
    }
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
      p: t < 0 ? 0 : ramp(t, [[CUE.verse, 0], [CUE.rap, 0.45], [CUE.nine, 0.7], [71.3, 1]]),
      count: t < 0 ? 0 : Math.round(ramp(t, [[CUE.verse, 0], [CUE.rap, 450], [CUE.nine, 700], [CUE.nineEnd, 999]])),
      dawn: t < 0 ? 0.03 : ramp(t, [[0, 0.03], [CUE.rap, 0.2], [CUE.dawn, 0.42], [CUE.chorus, 0.58], [CUE.chorus + 5, 0.86], [CUE.chorus2, 0.9], [CUE.chorus2 + 6, 1]]),
      gold: ramp(t, [[CUE.dawn, 0], [CUE.chorus, 0.3], [CUE.chorus + 7, 0.78], [CUE.chorus2, 0.82], [CUE.chorus2 + 7, 1]]),
      win: t < 0 ? 0 : ss(1.6, 3, t) * (1 + 1.6 * ss(CUE.window - 0.3, CUE.window + 0.7, t) * (1 - ss(CUE.window + 2.5, CUE.window + 7, t))),
      reveal: ss(CUE.thousand, CUE.thousand + 0.9, t) * (1 - ss(CUE.thousand + 1.4, CUE.thousand + 3.2, t)),
      gate: ss(CUE.toward, CUE.toward + 1.6, t),            // ánh đèn áp vào song cổng
      twinkle: ss(CUE.chorus, CUE.chorus + 1.2, t),
      bloom: ss(CUE.chorus - 0.05, CUE.chorus + 0.5, t) * (1 - ss(CUE.chorus + 0.8, CUE.chorus + 5, t)) + 0.7 * ss(CUE.chorus2 - 0.05, CUE.chorus2 + 0.5, t) * (1 - ss(CUE.chorus2 + 0.8, CUE.chorus2 + 5, t)),
      still: ss(CUE.calm - 0.3, CUE.calm + 0.6, t) * (1 - ss(CUE.chorus - 0.2, CUE.chorus + 0.2, t)), // nhịp lặng trước điệp khúc
      open: KET === 'a' ? ss(CUE.chorus + 0.2, CUE.chorus + 5.5, t) : 0,
      foot: st,
    };
    // "bước một bước": dấu chân em bừng lên đúng chữ
    v.footFlare = Math.max(S.flare, ss(CUE.one - 0.08, CUE.one + 0.1, t) * (1 - ss(CUE.one + 0.3, CUE.one + 2.2, t)));
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
      g.globalAlpha = 0.95; g.drawImage(SP.glow, hx - hr, yh - hr * 0.9, hr * 2, hr * 1.5);
      g.globalAlpha = 0.5; g.drawImage(SP.warm, hx - hr * 1.8, yh - hr * 0.5, hr * 3.6, hr * 1.1);
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
    const list = OBJ_COMMON.concat(OBJ[KET]);
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
    if (S.phase === 'alone' && !S.stepped) {
      if (S.holding) { S.hold = Math.min(1, S.hold + S.dt / 0.95); if (S.hold >= 1) doStep(); } else S.hold = Math.max(0, S.hold - S.dt * 2.2);
    }
    S.flare = Math.max(0, S.flare - S.dt * 0.55);
    if (S.phase === 'show') {
      S.prevT = S.t;
      const at = A.songTime();
      if (at >= 0) { S.t = at; S.clock = at; } else { S.clock += S.dt; S.t = S.clock; } // bài không phát được thì vẫn chạy theo đồng hồ
      runCues(S.prevT, S.t);
    }
    const v = show(S.phase === 'show' || S.phase === 'after' ? S.t : -1);
    g.clearRect(0, 0, L.W, L.H);
    drawScene(v); drawGate(v);
    if (S.phase === 'show' || S.phase === 'after') drawObject(S.t);
    drawFinish(v);
    if (S.phase === 'show') {
      const n = $('count-n'); if (n.textContent !== String(v.count)) n.textContent = v.count;
      $('count').classList.toggle('on', S.t >= CUE.verse && S.t < CUE.bridge);
      $('count').classList.toggle('full', v.count >= 999);
      const li = pick(LINES_COMMON.concat(LINES[KET]), S.t); setText('line', li ? li[2] : '', li && li[3]);
      const ca = pick(CAPS_COMMON.concat(CAPS[KET]), S.t); setText('cap', ca ? ca[2] : '');
    }
    requestAnimationFrame(tick);
  }

  // Tiếng và việc xảy ra một lần khi bài chạy qua từng mốc
  function runCues(a, b) {
    if (b - a > 1.5 || b < a) { A.songDist(distOf(b), 0.2); return; } // vừa tua: bỏ qua tiếng một lần
    A.songDist(distOf(b), 0.25);
    const F = (at) => fireBetween(a, b, at);
    if (F(1.9)) { A.bell(329.6, 0.1, 4); A.bell(493.9, 0.06, 4, 0.5); }                    // ô cửa sáng đèn
    if (F(4)) A.droneOff(5);
    // bước chân anh ở xa, rơi đúng phách của bài, gần dần; vào đoạn rap thì nhường cho bài hát
    const k = Math.floor((b - 0.03) / BEAT);
    if (k !== lastBeat) { lastBeat = k; if (b > CUE.verse && b < CUE.rap - 0.5) { const n = (b - CUE.verse) / (CUE.rap - CUE.verse); A.step(0.04 + 0.22 * n, (k & 1 ? 0.2 : -0.2)); } }
    if (F(CUE.verse)) A.windTo(0.34, 4);
    if (F(CUE.sit)) A.lamp();
    if (F(CUE.weak + 1.4)) A.buzz(2);
    if (F(CUE.rice)) A.clink();
    if (F(CUE.rap)) A.windTo(0.14, 3);
    if (F(CUE.one)) A.step(0.75, 0);                                                         // "bước một bước": tiếng bước của em vọng lại
    if (F(CUE.nineEnd)) A.bell(659.3, 0.07, 3.5);                                            // 999
    if (F(CUE.calm)) A.hush(1.2);                                                            // lặng một nhịp
    if (F(CUE.chorus)) { A.warm(6, 0.05); A.sparkle(8, 0.03); if (KET === 'a') A.latch(); }  // vỡ oà
    if (F(CUE.chorus2)) { A.warm(6, 0.04); A.sparkle(6, 0.024); }
    if (F(CUE.bridge + 3)) { S.phase = 'show'; $('after').hidden = false; }
    if (F(CUE.end)) { S.phase = 'after'; }
  }

  // Em bước một bước
  function doStep() {
    if (S.stepped) return;
    S.stepped = true; S.holding = false; S.flare = 1; S.stepAt = S.now; S.stepClock = new Date();
    A.step(1, 0);
    $('hint').classList.remove('on'); setText('line', '');
    setTimeout(() => { S.phase = 'show'; S.t = S.prevT = S.clock = T0; A.songDist(distOf(T0), 0.05); A.songPlay(T0); }, 1900);
  }

  // ================= Chạm =================
  function down(e) {
    if (e.target.closest('button, a')) return;
    if (S.phase === 'alone' && !S.stepped) { S.holding = true; return; }
    // Sau bước ấy, chạm nữa cũng không có gì xảy ra: phần còn lại không phải của em
    if (S.phase === 'show' && S.t < CUE.rap && ++S.tried === 2) { $('hint').textContent = 'Một bước là đủ rồi.'; $('hint').classList.add('on'); setTimeout(() => $('hint').classList.remove('on'), 3600); }
  }
  const up = () => { S.holding = false; };
  window.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  window.addEventListener('keydown', (e) => { if (e.code === 'Space' && S.phase === 'alone') S.holding = true; });
  window.addEventListener('keyup', (e) => { if (e.code === 'Space') S.holding = false; });
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  // ================= Bắt đầu =================
  $('st-demo').hidden = false;
  document.querySelectorAll('#st-demo button').forEach((b) => {
    b.classList.toggle('on', b.dataset.ket === KET);
    b.addEventListener('click', () => { KET = b.dataset.ket; document.querySelectorAll('#st-demo button').forEach((x) => x.classList.toggle('on', x === b)); });
  });
  $('btn-go').addEventListener('click', () => {
    A.init(); A.resume(); A.bedStart();
    // iPhone chỉ cho phát nhạc khi bắt đầu từ một lần chạm: mở sẵn bài (im lặng) ngay ở lần chạm này
    if (A.el) { const p = A.el.play(); if (p && p.then) p.then(() => { if (S.phase !== 'show') A.el.pause(); }).catch(() => {}); }
    $('start').classList.add('go'); $('top').hidden = false;
    S.phase = 'alone';
    setTimeout(() => { if (!S.stepped) setText('line', 'Bước một bước thôi.'); }, 3200);
    setTimeout(() => { if (!S.stepped) { $('hint').textContent = 'chạm và giữ'; $('hint').classList.add('on'); } }, 6000);
  });
  $('btn-sound').classList.toggle('off', A.muted);
  $('btn-sound').addEventListener('click', () => { A.mute(!A.muted); $('btn-sound').classList.toggle('off', A.muted); });
  $('btn-again').addEventListener('click', () => location.reload());

  window.addEventListener('resize', layout);
  layout();
  requestAnimationFrame(tick);
  window.__conlai = { S, CUE, show }; // để thử
})();
