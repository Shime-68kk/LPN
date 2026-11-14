// ================= BỨC THƯ + PHẦN THƯỞNG CUỐI =================
// Thư: giấy kem kẻ dòng, phông Dancing Script, từng đoạn hiện dần như thư Băng 1 (chạm để đọc tiếp).
// Kết: "Yêu Được Không" (có lời, từ phiên khúc 2). 100 ngọn đèn sáng dọc đường từ trại về đình, tên chương ở ngọn đèn của ngày nó;
// ngọn thứ 100 sáng đúng câu "Yêu được không?"; nâng tông thì sân đình bừng sáng, hai cái bóng ngồi xuống ghế đá;
// đom đóm tụ thành tấm thiệp 100 ngày em tự làm; "Chúc mừng 100 ngày yêu nhau."; danh đề dừng ở "Hết cuộn băng số 2".
// THƯ: BẢN NHÁP Claude gọt từ lời anh Quang (14-thu-tay.md), CHỜ ANH DUYỆT. Câu chúc sinh nhật để dành cho lớp ngày 110.
const THU = [
  'Hà Nội, một đêm em đang ngủ.',
  'Thủy của anh,',
  'Ba lá thư em đưa anh hôm ở Thái Nguyên, đến tối hôm sau anh mới đọc. Anh đọc muộn. Nhưng anh đọc chậm, từng dòng một, không bỏ dòng nào.',
  'Đọc xong anh mới hiểu: em không thiếu tình cảm của anh, em chỉ không nhìn thấy nó. Vì anh dựng một bức tường. Anh im lặng, gồng lên, làm tiếp, và nghĩ như thế là đang bảo vệ em. Anh không biết em đứng bên kia một mình, sợ từng khoảng lặng.',
  'Anh xin lỗi. Vì đã vô tâm. Vì những tin nhắn em gửi rồi chờ tới hết ngày. Vì những lần anh im.',
  'Em hỏi có phải em đang yêu sai cách không. Không đâu em. Người cần học lại cách yêu là anh.',
  'Anh biết em đã xoá hết mọi thứ, chỉ còn nhắn với mỗi anh. Biết em thức tới một, hai giờ sáng dù bốn, năm giờ đã phải dậy. Biết em ngủ gật trên đồi. Biết cơm trong đó khó nuốt. Anh hơn em ba tuổi, vậy mà có lúc dỗi như trẻ con, còn em lại là người kéo anh về.',
  'Cuộn băng này anh làm vào những đêm em ngủ. Mình không chung giờ, nhưng anh chưa bao giờ đi đâu cả.',
  'Tháng Mười Một em nói em khóc nhiều nhất. Anh mong những ngày còn lại của tháng sẽ khác. Từ giờ, kể cả lúc giận, anh sẽ không im nữa. Có khi chỉ nói được một câu thôi: anh vẫn ở đây.',
  'Sau này anh muốn được đi cùng em, học cùng em, làm cùng em, lớn lên cùng em. Hôm nào mệt quá, chỉ cần ôm em ngủ một ngày là đủ.',
  'Anh vẫn ở đây.',
];
const SCRIPT = "'Dancing Script', cursive";
const SIG = new Image(); SIG.src = '../../assets/img/chu-ky.svg';
const TH = { shown: 0, t: [], scroll: 0, want: 0, lines: null, sig: 0, done: false };
function startThu() { if (typeof cuaNen === 'function') cuaNen(0.16, 4800, 5); TH.shown = 1; TH.t = [performance.now()]; TH.lines = null; go('thu', 2200); }
function thuLayout(c) { // gói chữ theo bề rộng giấy, nhớ dòng bắt đầu của mỗi đoạn
  c.font = `34px ${SCRIPT}`; const out = []; const maxW = 760;
  THU.forEach((para, k) => { const words = para.split(' '); let line = k >= 2 && k < THU.length - 1 ? '      ' : ''; const start = out.length;
    for (const w of words) { const test = line + (line.trim() ? ' ' : '') + w; if (c.measureText(test).width > maxW && line.trim()) { out.push({ s: line, k }); line = w; } else line = test; }
    out.push({ s: line, k }); if (k < 2) out.push({ s: '', k }); out[start].first = true; });
  return out;
}
SC.thu = {
  noBag: true,
  enter() { FX.paper(); HINT.off = true; HINT.text = ''; },
  draw(c, now, dt) {
    c.fillStyle = '#0b0907'; c.fillRect(-300, -300, W + 600, H + 600); warmSpot(c, 800, 380, 900, 0.14);
    if (!TH.lines) TH.lines = thuLayout(c);
    const LH = 50, top = 150 - TH.scroll, PX = 380, PW = 840, n = TH.lines.length, ph = n * LH + 200;
    TH.scroll += (TH.want - TH.scroll) * Math.min(1, dt * 3);
    // giấy kem kẻ dòng
    c.save(); c.translate(0, 0); const g = c.createLinearGradient(PX, top - 60, PX + PW, top + ph); g.addColorStop(0, '#fbf4e4'); g.addColorStop(1, '#e9d9b8');
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(PX + 10, top - 50, PW, ph); c.fillStyle = g; c.fillRect(PX, top - 60, PW, ph);
    for (let i = 0; i < n + 3; i++) { c.strokeStyle = 'rgba(120,90,60,.2)'; c.lineWidth = 1; c.beginPath(); c.moveTo(PX + 30, top + i * LH + 12); c.lineTo(PX + PW - 30, top + i * LH + 12); c.stroke(); }
    c.font = `34px ${SCRIPT}`;
    TH.lines.forEach((L, i) => { if (L.k >= TH.shown) return; const a = clamp((now - TH.t[L.k]) / 900, 0, 1); if (!a) return; const y = top + i * LH; if (y < 40 || y > 900) return;
      const last = L.k === THU.length - 1; c.fillStyle = last ? `rgba(140,59,59,${a})` : `rgba(74,51,38,${a})`; c.textAlign = last ? 'right' : 'left'; c.fillText(L.s, last ? PX + PW - 70 : PX + 60, y + (1 - a) * 6); });
    c.textAlign = 'left';
    // chữ ký
    if (TH.shown >= THU.length) { TH.sig = Math.min(1, TH.sig + dt / 2.4); const y = top + n * LH + 10; // chữ ký thật của anh Quang (chữ ký trong thư Băng 1), hiện dần như đang ký
      if (SIG.complete && SIG.naturalWidth) { const sh = 116, sw = (sh * SIG.naturalWidth) / SIG.naturalHeight, sx = PX + PW - 70 - sw; c.save(); c.beginPath(); c.rect(sx - 4, y - 10, (sw + 8) * ease(TH.sig), sh + 20); c.clip(); c.drawImage(SIG, sx, y, sw, sh); c.restore(); }
      else { c.save(); c.fillStyle = 'rgba(140,59,59,.95)'; c.font = `700 52px ${SCRIPT}`; c.textAlign = 'right'; c.fillText('Anh.', PX + PW - 80, y + 60); c.restore(); } }
    c.restore();
    const msg = TH.shown < THU.length ? 'chạm để đọc tiếp' : TH.sig >= 1 ? 'chạm để đi tiếp' : '';
    if (msg) text(c, msg, W / 2, 800, 22, 0.35 + 0.1 * Math.sin(now * 0.003));
  },
  move(p, b) { if (b && this.py != null) { TH.want = clamp(TH.want + (this.py - p[1]), 0, Math.max(0, (TH.lines ? TH.lines.length : 0) * 50 + 320 - 640)); this.py = p[1]; } },
  down(p) { this.py = p[1]; return false; },
  up(p, moved) { this.py = null; return moved; },
  tap() {
    if (TH.shown < THU.length) { TH.t[TH.shown] = performance.now(); TH.shown++; FX.paper(); // cuộn theo đoạn mới nhất
      const idx = TH.lines ? TH.lines.findIndex((L) => L.k === TH.shown - 1) : 0, last = TH.lines ? TH.lines.map((L) => L.k).lastIndexOf(TH.shown - 1) : 0; TH.want = Math.max(TH.want, last * 50 + 150 - 600 + (TH.shown >= THU.length ? 160 : 0)); return; }
    if (TH.sig >= 1 && !TH.done) { TH.done = true; startKet(); }
  },
};

// ---------- hai cái bóng trên tường đình (không vẽ hình người: chỉ bóng hắt lên tường) ----------
// Đèn lồng ở dưới, phía trước; hai người đứng giữa đèn và tường nên chỉ thấy bóng của họ, to, mềm mép.
// Bức tường cả cuộn băng ngăn hai đứa, đến cuối thành chỗ hai cái bóng gặp nhau. Vết nứt giữa tường sáng lên rồi tan khi nâng tông.
let TBwall = null, TBmask = null, TBglow = null, TBsoft = null;
function bakeTB() {
  const [cvs, g] = layer(); TBwall = cvs; cvs.width = Math.ceil(cv.width * 2.25); cvs.height = cv.height; setT(g); // tường dài liền một mạch (khung hình đi theo nhân vật)
  const WW = W * 2.3 + 300; g.fillStyle = '#2a2420'; g.fillRect(-300, -300, WW + 600, H + 600);
  for (let y = 150; y < 720; y += 34) for (let x = ((y / 34) % 2) * 36 - 72; x < WW + 72; x += 72) { const v = 34 + rnd() * 14; g.fillStyle = `rgba(${v + 18},${v + 8},${v},.55)`; g.fillRect(x + 2, y + 2, 68, 30); } // gạch dưới lớp vữa
  for (let i = 0; i < 60; i++) { const x = rnd() * WW, y = 160 + rnd() * 520, r = 60 + rnd() * 160; const v = g.createRadialGradient(x, y, 4, x, y, r); v.addColorStop(0, 'rgba(120,106,92,.32)'); v.addColorStop(1, 'rgba(120,106,92,0)'); g.fillStyle = v; g.fillRect(x - r, y - r, r * 2, r * 2); } // mảng vữa còn bám
  g.fillStyle = '#0d0b0a'; g.fillRect(-300, -300, WW + 600, 440); // bóng mái hiên phía trên
  const eg = g.createLinearGradient(0, 140, 0, 230); eg.addColorStop(0, 'rgba(13,11,10,1)'); eg.addColorStop(1, 'rgba(13,11,10,0)'); g.fillStyle = eg; g.fillRect(-300, 140, WW + 600, 90);
  g.fillStyle = '#141110'; g.fillRect(-300, 720, WW + 600, 600); for (let x = -40; x < WW + 40; x += 110) { g.strokeStyle = 'rgba(70,60,50,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 724); g.lineTo(x - 60, 900); g.stroke(); } // nền gạch sân
  for (let i = 0; i < 22000; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.03})`; g.fillRect(rnd() * WW, rnd() * H, 1.2, 1.2); }
  TBmask = document.createElement('canvas'); TBmask.width = W; TBmask.height = H; // giấy cắt: mép sắc, đủ nét cho ngón tay
  TBsoft = document.createElement('canvas'); TBsoft.width = W / 8; TBsoft.height = H / 8; // bóng mờ bên ngoài như đèn thật
  TBglow = document.createElement('canvas'); TBglow.width = W / 10; TBglow.height = H / 10;
}
// ---------- hình nhân giấy (múa rối bóng) ----------
// Mỗi hình nhân là giấy cắt có khớp đinh ghim (vai, khuỷu, hông, gối), một que giữ. Không bắt chước người thật:
// lướt, nhún nhẹ, tay chân đung đưa quanh khớp; quay người thì lật như tờ giấy. Ngực khoét một trái tim nhỏ.
// ---- hình nhân rối bóng (bản tinh chỉnh bài 27) ----
const sstep = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

function capsule(g, x0, y0, x1, y1, r0, r1) {
  const a = Math.atan2(y1 - y0, x1 - x0), px = Math.sin(a), py = -Math.cos(a);
  g.beginPath();
  g.moveTo(x0 + px * r0, y0 + py * r0);
  g.lineTo(x1 + px * r1, y1 + py * r1);
  g.arc(x1, y1, r1, a - Math.PI / 2, a + Math.PI / 2);
  g.lineTo(x0 - px * r0, y0 - py * r0);
  g.arc(x0, y0, r0, a + Math.PI / 2, a + Math.PI * 1.5);
  g.fill();
}

const tp = (g, x, y) => { const q = g.getTransform().transformPoint(new DOMPoint(x, y)); return [q.x, q.y]; };

// curlDir: +1 = ngón khum về phía lòng bàn tay thuận (+px, mặc định cho puppet2); -1 = đảo cho tay trái frontFig
function hand2(g, x, y, ang, H, open, pins, curlDir = 1, thumbTuck = 0) {
  const ux = Math.sin(ang), uy = Math.cos(ang), px = Math.cos(ang) * curlDir, py = -Math.sin(ang) * curlDir;
  const pw = 0.02 * H, pl = 0.035 * H;
  g.beginPath();
  g.ellipse(x + ux * pl * 0.5, y + uy * pl * 0.5, pl * 0.62, pw, Math.atan2(uy, ux), 0, Math.PI * 2);
  g.fill(); // lòng bàn tay
  const L = [0.035, 0.041, 0.039, 0.032], curl = (1 - clamp(open || 0, 0, 1)) * curlDir;
  for (let k = 0; k < 4; k++) {
    const off = (k - 1.5) * 0.35 * pw;
    const bx = x + ux * pl * 0.94 + px * off, by = y + uy * pl * 0.94 + py * off;
    const l = L[k] * H, a1 = ang + curl * 0.32, a2 = ang + curl * (0.85 + k * 0.08);
    const mx = bx + Math.sin(a1) * l * 0.5, my = by + Math.cos(a1) * l * 0.5;
    const ex = mx + Math.sin(a2) * l * 0.5, ey = my + Math.cos(a2) * l * 0.5;
    capsule(g, bx, by, mx, my, 0.006 * H, 0.0053 * H);
    capsule(g, mx, my, ex, ey, 0.0053 * H, 0.0042 * H);
  }
  const tOpen = 1 - clamp(thumbTuck || 0, 0, 0.85);
  const ta = ang + (-0.72 * tOpen + (1 - clamp(open || 0, 0, 1)) * 0.38 * tOpen) * curlDir;
  const tx = x + ux * pl * 0.35 + px * pw * (0.8 - 0.35 * (1 - tOpen)), ty = y + uy * pl * 0.35 + py * pw * (0.8 - 0.35 * (1 - tOpen));
  capsule(g, tx, ty, tx + Math.sin(ta) * 0.029 * H, ty + Math.cos(ta) * 0.029 * H, 0.0065 * H, 0.005 * H); // ngón cái
}

function limb2(g, x0, y0, a1, l1, w1, a2, l2, w2) {
  const x1 = x0 + Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1;
  const x2 = x1 + Math.sin(a1 + a2) * l2, y2 = y1 + Math.cos(a1 + a2) * l2;
  capsule(g, x0, y0, x1, y1, w1 / 2, w1 * 0.44);
  capsule(g, x1, y1, x2, y2, w2 / 2, w2 * 0.4);
  return [x1, y1, x2, y2];
}

function pin(g, x, y, H) {
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.beginPath();
  g.arc(x, y, 0.0056 * H, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

// ang: góc mũi giày (âm = nhón mũi / gót chạm đất; dương = duỗi mũi khi đạp chân sau)
function shoe(g, x, y, H, her, ang = 0) {
  g.save();
  g.translate(x, y);
  if (ang) g.rotate(ang);
  g.beginPath();
  if (her) {
    g.moveTo(-0.022 * H, -0.012 * H);
    g.quadraticCurveTo(0.03 * H, -0.022 * H, 0.062 * H, -0.004 * H);
    g.lineTo(0.062 * H, 0.004 * H);
    g.lineTo(-0.024 * H, 0.004 * H);
  } else {
    g.moveTo(-0.026 * H, -0.016 * H);
    g.quadraticCurveTo(0.03 * H, -0.028 * H, 0.07 * H, -0.004 * H);
    g.lineTo(0.07 * H, 0.006 * H);
    g.lineTo(-0.028 * H, 0.006 * H);
  }
  g.closePath();
  g.fill();
  g.restore();
}

function head2(g, H, her, t, ph, r, w, hairTrail = 0) { // gốc toạ độ ở đỉnh cổ, nhìn sang phải
  const P = (x, y) => [x * H, y * H];
  g.beginPath();
  g.moveTo(...P(-0.028, 0.004));
  g.bezierCurveTo(...P(-0.07, -0.02), ...P(-0.07, -0.1), ...P(-0.012, -0.118));
  g.bezierCurveTo(...P(0.03, -0.122), ...P(0.052, -0.1), ...P(0.054, -0.074)); // trán
  g.lineTo(...P(0.058, -0.062)); g.lineTo(...P(0.076, -0.04)); g.lineTo(...P(0.06, -0.033)); // mũi
  g.lineTo(...P(0.063, -0.025)); g.lineTo(...P(0.056, -0.019)); g.lineTo(...P(0.061, -0.013)); // môi
  g.quadraticCurveTo(...P(0.058, 0.002), ...P(0.04, 0.006));
  g.quadraticCurveTo(...P(0.022, 0.008), ...P(0.016, 0.016));
  g.lineTo(...P(-0.02, 0.02));
  g.closePath();
  g.fill();

  if (her) {
    g.beginPath();
    g.moveTo(...P(-0.07, -0.05));
    g.bezierCurveTo(...P(-0.078, -0.11), ...P(-0.02, -0.14), ...P(0.03, -0.124));
    g.bezierCurveTo(...P(0.055, -0.116), ...P(0.066, -0.098), ...P(0.062, -0.084));
    g.quadraticCurveTo(...P(0.03, -0.1), ...P(0.0, -0.096));
    g.quadraticCurveTo(...P(-0.03, -0.09), ...P(-0.05, -0.04));
    g.closePath();
    g.fill(); // tóc, mái

    // Đuôi tóc bay về sau mượt hơn khi chạy (r), khẽ lay khi đi (w) hoặc bay lơ lửng (hairTrail)
    const whip = Math.sin(ph - 0.5) * r * 0.14 + Math.cos(ph * 2 - 0.8) * r * 0.08;
    const idleSway = Math.sin(ph * 0.5 + t * 0.9) * (t || ph ? 0.09 : 0);
    const sway = idleSway * (1 - r * 0.5) + whip + r * 0.62 + w * 0.14 + hairTrail;
    const tipCurve = (r * 0.045 + hairTrail * 0.04) * H;
    g.save();
    g.translate(...P(-0.06, -0.095));
    g.rotate(0.42 + sway);
    g.beginPath();
    g.moveTo(-0.012 * H, 0);
    g.bezierCurveTo(-0.028 * H - tipCurve * 0.3, 0.05 * H, -0.016 * H - tipCurve * 0.7, 0.1 * H, -0.034 * H - tipCurve, 0.155 * H);
    g.bezierCurveTo(-0.008 * H - tipCurve * 0.5, 0.112 * H, 0.012 * H, 0.06 * H, 0.012 * H, 0);
    g.closePath();
    g.fill();
    g.restore(); // đuôi ngựa
    g.beginPath();
    g.arc(...P(-0.062, -0.095), 0.014 * H, 0, Math.PI * 2);
    g.fill();
  } else {
    g.beginPath();
    g.moveTo(...P(-0.068, -0.045));
    g.bezierCurveTo(...P(-0.076, -0.11), ...P(-0.02, -0.138), ...P(0.03, -0.126));
    g.quadraticCurveTo(...P(0.064, -0.118), ...P(0.066, -0.094));
    g.lineTo(...P(0.05, -0.1));
    g.lineTo(...P(0.046, -0.088));
    g.quadraticCurveTo(...P(0.0, -0.104), ...P(-0.03, -0.07));
    g.lineTo(...P(-0.03, -0.04));
    g.closePath();
    g.fill(); // tóc ngắn có mái
  }
}

// Tính góc đùi, gối, mũi chân cho một chân tại pha p (w: đi, r: chạy)
function legGait(p, w, r) {
  // Chạy: gối trước nâng cao, chân sau đạp thẳng, gối gập sâu ở pha thu chân
  const thR = 0.10 + 0.78 * Math.sin(p + 0.42) - 0.06 * Math.sin(2 * p + 0.3);
  const kRaw = 0.50 + 0.48 * Math.cos(p - 0.18) - 0.14 * Math.sin(2 * p - 0.2);
  const knR = -clamp(kRaw * 1.42, 0.08, 1.52);
  const ankR = -0.14 * Math.max(0, Math.sin(p + 0.1)) + 0.42 * Math.max(0, -Math.sin(p + 0.1));

  // Đi: bước nhẹ của rối giấy, gót chạm đất khi chân đưa tới, gối dịu lúc chuyển bước
  const thW = 0.32 * Math.sin(p);
  const swing = Math.max(0, Math.cos(p - 0.35));
  const stanceFlex = Math.max(0, -Math.sin(p)) * 0.07;
  const knW = -(0.04 + stanceFlex + 0.42 * swing * swing);
  const heelStrike = Math.max(0, Math.sin(p - 0.15));
  const pushToe = Math.max(0, -Math.sin(p + 0.35));
  const ankW = -0.22 * heelStrike + 0.22 * pushToe;

  const th = thW * w + thR * r;
  const kn = knW * w + knR * r;
  const ank = ankW * w + ankR * r;
  const reach = 0.235 * (Math.cos(th) + Math.cos(th + kn)) + (ank > 0 ? Math.sin(ank) * 0.038 : -Math.sin(ank) * 0.012);
  return { th, kn, ank, reach };
}

function puppet2(g, P) {
  const H = P.H, her = !!P.her;
  const w = clamp(P.walk || 0, 0, 1), r = clamp(P.run || 0, 0, 1);
  const ph = P.ph || 0, t = P.t || 0, anchors = [];
  const still = P.still || 0, air = clamp(P.air || 0, 0, 1), tilt = P.tilt || 0;
  const reach = clamp(P.reach || 0, 0, 1), hug = clamp(P.hug || 0, 0, 1), touch = clamp(P.touch || 0, 0, 1);

  const breathe = (1 - still) * Math.sin(t * 1.6) * 0.018;
  const moveMix = clamp(w + r, 0, 1);

  // Dáng chân: pha trộn mượt giữa đứng yên / đi / chạy / ôm / bay lơ lửng
  const gF = legGait(ph, w, r), gB = legGait(ph + Math.PI, w, r);
  const hugEase = sstep(0, 1, hug);
  const hugWrap = sstep(0.32, 1, hug); // độ vòng tay vào sau lưng đối phương

  // Khi ôm: hai chân đứng sát nhau tự nhiên, chỉ trùng gối thật nhẹ (không gập gối gượng về trước)
  const hugKneeGive = hugEase * (her ? 0.55 : 0.25);
  let thF = gF.th * (1 - hugEase * 0.9) + hugKneeGive * 0.11 + air * 0.14;
  let knF = gF.kn * (1 - hugEase * 0.9) - hugKneeGive * 0.18 - air * 0.28;
  let ankF = gF.ank * (1 - hugEase) + air * 0.34 + (P.shoeAng || 0);

  let thB = gB.th * (1 - hugEase * 0.9) - hugKneeGive * 0.08 - air * 0.16;
  let knB = gB.kn * (1 - hugEase * 0.9) - hugKneeGive * 0.14 - air * 0.42;
  let ankB = gB.ank * (1 - hugEase) + air * 0.36 + (P.shoeAng || 0);

  // Khi đứng / ôm vẫn bảo đảm chạm sàn đúng base; khi chạy có nhịp lơ lửng rõ
  const reachF = 0.235 * (Math.cos(thF) + Math.cos(thF + knF)) + (ankF > 0 ? Math.sin(ankF) * 0.038 : -Math.sin(ankF) * 0.012);
  const reachB = 0.235 * (Math.cos(thB) + Math.cos(thB + knB)) + (ankB > 0 ? Math.sin(ankB) * 0.038 : -Math.sin(ankB) * 0.012);
  const standReach = Math.max(reachF, reachB);

  const fl = 0.5 - 0.5 * Math.cos(2 * (ph + 0.42)); // đỉnh pha lơ lửng lúc 2 chân bung sải chạy
  const hipOffRun = 0.464 + 0.028 * Math.pow(fl, 1.3);
  const hipOffWalk = standReach + 0.005;
  const hipOffStand = 0.475 - (0.475 - Math.min(0.475, standReach + 0.005)) * hugEase;

  const wNorm = w + r > 0 ? w / (w + r) : 0, rNorm = w + r > 0 ? r / (w + r) : 0;
  const hipOffGait = hipOffWalk * wNorm + hipOffRun * rNorm;
  const hipOff = hipOffStand * (1 - moveMix) + hipOffGait * moveMix;
  const hipY = P.hipY !== undefined ? P.hipY : P.base - hipOff * H;

  // Độ đổ người về trước: chạy nghiêng vừa phải (không gập như vấp), đi nhún nhẹ, ôm áp sát
  const runPitch = r * (0.17 + 0.02 * Math.cos(2 * (ph + 0.42)));
  const walkPitch = w * (0.035 + 0.015 * Math.cos(2 * ph));
  const hugPitch = hugEase * (her ? 0.155 : 0.085);
  const lean = (P.lean || 0) * 0.3 + runPitch + walkPitch + hugPitch;

  g.save();
  g.translate(P.x, 0);
  g.scale(Math.abs(P.fx) < 0.04 ? 0.04 * Math.sign(P.fx || 1) : P.fx, 1);

  if (tilt) {
    g.translate(0, hipY);
    g.rotate(tilt);
    g.translate(0, -hipY);
  }

  const lw = her ? 0.05 : 0.058;

  // Chân sau (lớp sau)
  const LB = limb2(g, -0.004 * H, hipY, thB, 0.235 * H, lw * H, knB, 0.235 * H, (lw - 0.014) * H);
  shoe(g, LB[2], LB[3] + 0.004 * H, H, her, ankB);

  // Thân trên, tay sau, đầu, tay trước
  g.save();
  g.translate(0, hipY);
  g.rotate(lean);

  const sh = [0.006 * H, -0.292 * H];

  // Vung tay chạy đồng pha với đỉnh bước chân (+0.42), đi đung đưa nhẹ
  const snR = Math.sin(ph + 0.42), snW = Math.sin(ph);
  const armRunB = r * (0.64 * snR - 0.06), armWalkB = w * 0.15 * snW;
  const armRunF = -r * (0.66 * snR + 0.04), armWalkF = -w * 0.15 * snW;

  // Tay sau: khi ôm đưa xuống thấp hơn ôm quanh eo đối phương (rút ngắn nhẹ theo phối cảnh vòng qua lưng)
  const upB_base = armRunB + armWalkB + breathe - 0.03 * (1 - still) - air * 0.22;
  const elB_base = r * (1.36 + 0.28 * Math.max(0, snR) - 0.18 * Math.max(0, -snR)) + w * (0.14 + 0.06 * Math.max(0, snW)) + (1 - moveMix) * (0.12 - still * 0.06) + air * 0.26;
  const upB = upB_base * (1 - hugEase) + hugEase * (her ? 0.64 : 0.52);
  const elB = elB_base * (1 - hugEase) + hugEase * (her ? 0.78 : 0.72);
  const l1B = (0.155 - hugWrap * (her ? 0.022 : 0.020)) * H;
  const l2B = (0.145 - hugWrap * (her ? 0.072 : 0.074)) * H;
  const AB = limb2(g, sh[0], sh[1], upB, l1B, 0.04 * H, elB, l2B, 0.031 * H);
  const handAngB = upB + elB + hugWrap * 1.15;
  const openB = clamp(0.18 + r * 0.18 + w * 0.08 + hugEase * 0.28 + air * 0.25, 0, 1);
  hand2(g, AB[2], AB[3], handAngB, H, openB, false, 1, hugWrap * 0.75);
  anchors.push(tp(g, AB[2], AB[3]));

  // Thân áo / váy
  if (her) {
    const hemTrail = -r * 0.078 - w * 0.018 - air * 0.035;
    const hemWave = (Math.sin(ph * 2 - 0.6) * r * 0.015 + Math.sin(ph) * w * 0.011) * (1 - hugEase);
    const hemLift = r * 0.016 + air * 0.012;
    const frontHemX = (0.105 - r * 0.018 + hemWave * 0.4 - hugEase * 0.012) * H;
    const backHemX = (-0.095 + hemTrail + hemWave) * H;
    g.beginPath();
    g.moveTo(-0.04 * H, -0.3 * H);
    g.quadraticCurveTo(0, -0.322 * H, 0.046 * H, -0.298 * H);
    g.bezierCurveTo(0.07 * H, -0.24 * H, 0.05 * H, -0.17 * H, 0.04 * H, -0.08 * H);
    g.bezierCurveTo(0.068 * H + hemTrail * 0.2 * H, 0.0, frontHemX, 0.08 * H - hemLift * 0.6 * H, frontHemX, 0.13 * H - hemLift * H);
    g.quadraticCurveTo(hemTrail * 0.5 * H, 0.148 * H - hemLift * 0.7 * H, backHemX, 0.128 * H - hemLift * 0.9 * H);
    g.bezierCurveTo(-0.08 * H + hemTrail * 0.5 * H, 0.06 * H, -0.05 * H, 0.0, -0.042 * H, -0.08 * H);
    g.bezierCurveTo(-0.06 * H, -0.17 * H, -0.058 * H, -0.25 * H, -0.04 * H, -0.3 * H);
    g.closePath();
    g.fill();
  } else {
    g.beginPath();
    g.moveTo(-0.05 * H, -0.298 * H);
    g.quadraticCurveTo(0, -0.326 * H, 0.054 * H, -0.3 * H);
    g.bezierCurveTo(0.07 * H, -0.24 * H, 0.062 * H, -0.12 * H, 0.056 * H, 0.02 * H);
    g.lineTo(-0.058 * H, 0.02 * H);
    g.bezierCurveTo(-0.07 * H, -0.12 * H, -0.072 * H, -0.24 * H, -0.05 * H, -0.298 * H);
    g.closePath();
    g.fill();
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.moveTo(0.012 * H, -0.31 * H);
    g.lineTo(0.03 * H, -0.27 * H);
    g.lineTo(0.04 * H, -0.305 * H);
    g.fill();
    g.restore();
  }
  anchors.push(tp(g, -0.015 * H, -0.3 * H));

  // Cổ & đầu: khi chạy ngẩng bù nhẹ để nhìn tới trước; khi ôm nữ áp nhẹ vào ngực, vai nam, nam cúi xuống tóc nữ
  g.fillRect(-0.016 * H, -0.36 * H, 0.032 * H, 0.07 * H);
  g.save();
  g.translate(0.002 * H, -0.352 * H);
  const hugHeadTilt = hugWrap * (her ? 0.12 : 0.39);
  const runHeadComp = -lean * (r ? 0.45 : 0.26);
  g.rotate((P.look || 0) * 0.5 + runHeadComp + hugHeadTilt);
  const hairTrail = air * (0.38 + 0.08 * Math.sin(t * 2.2)) - hugWrap * 0.12;
  head2(g, H, her, still ? 0 : t, still ? 0 : ph, r, w, hairTrail);
  anchors.push(tp(g, 0, -0.125 * H));
  g.restore();

  // Tay trước: khi ôm vòng qua lưng người kia, bàn tay áp dọc theo đường lưng (thấy bàn tay ở sau lưng người kia, không chĩa que)
  const upF_base = armRunF + armWalkF - breathe + 0.03 * (1 - still) + touch * 2.0 + reach * 1.38 + air * 0.34;
  const elF_base = r * (1.36 + 0.28 * Math.max(0, -snR) - 0.18 * Math.max(0, snR)) + w * (0.14 + 0.06 * Math.max(0, -snW)) + (1 - moveMix) * (0.12 - still * 0.06) - touch * 0.3 - reach * 0.12 + air * 0.38;
  const upF = upF_base * (1 - hugEase) + hugEase * (her ? 0.98 : 0.90);
  const elF = elF_base * (1 - hugEase) + hugEase * (her ? 0.62 : 0.56);
  const l1F = (0.155 - hugWrap * (her ? 0.011 : 0.014)) * H;
  const l2F = (0.145 - hugWrap * (her ? 0.065 : 0.077)) * H;
  const AF = limb2(g, sh[0], sh[1], upF, l1F, 0.04 * H, elF, l2F, 0.031 * H);
  // Cổ tay gập mềm áp dọc đường nghiêng sống lưng người kia (không chĩa thẳng ra sau lưng)
  const targetHandHug = Math.PI + (her ? 0.11 : 0.14) + hugPitch;
  const handAngF = (upF + elF) * (1 - hugWrap) + targetHandHug * hugWrap;
  const openF = clamp(Math.max(reach, touch * 0.8, P.open || 0, r * 0.25 + w * 0.12 + hugEase * 0.60 + air * 0.32), 0, 1);
  hand2(g, AF[2], AF[3], handAngF, H, openF, true, 1, hugWrap * 0.75);
  anchors.push(tp(g, AF[2], AF[3]));

  pin(g, sh[0], sh[1], H);
  pin(g, AF[0], AF[1], H);
  const hd = tp(g, 0.028 * H, -0.23 * H);
  g.restore();

  // Chân trước (lớp trước)
  const LF = limb2(g, 0.004 * H, hipY, thF, 0.235 * H, lw * H, knF, 0.235 * H, (lw - 0.014) * H);
  shoe(g, LF[2], LF[3] + 0.004 * H, H, her, ankF);
  pin(g, 0.004 * H, hipY, H);
  pin(g, LF[0], LF[1], H);

  // Lỗ trái tim trên ngực
  g.save();
  g.translate(0, hipY);
  g.rotate(lean);
  g.globalCompositeOperation = 'destination-out';
  const hx = 0.028 * H, hy = -0.23 * H, hs = 0.016 * H;
  g.beginPath();
  g.moveTo(hx, hy + hs * 0.9);
  g.bezierCurveTo(hx - hs * 1.6, hy - hs * 0.2, hx - hs * 0.6, hy - hs * 1.3, hx, hy - hs * 0.4);
  g.bezierCurveTo(hx + hs * 0.6, hy - hs * 1.3, hx + hs * 1.6, hy - hs * 0.2, hx, hy + hs * 0.9);
  g.fill();
  g.restore();

  g.restore();
  return { heart: hd, anchors };
}

function frontFig(g, P) { // hình nhân ngồi nhìn từ trước, cùng nét với hình nhân nghiêng (váy, tóc, tay thon, ngón)
  const H = P.H, her = !!P.her, side = her ? 1 : -1, ln = clamp(P.lean || 0, 0, 1), t = P.t || 0, anchors = [];
  const br = Math.sin(t * 1.4) * 0.005 * H, lh = P.base - P.seat;
  g.save();
  g.translate(P.x, P.seat);
  g.scale(Math.max(0.03, P.w == null ? 1 : P.w), 1);

  // Chân, giày
  [-1, 1].forEach((k) => {
    capsule(g, k * 0.034 * H, 0.0, k * 0.038 * H, lh - 0.02 * H, 0.019 * H, 0.014 * H);
    g.beginPath();
    g.ellipse(k * 0.04 * H, lh - 0.01 * H, 0.026 * H, 0.012 * H, 0, 0, Math.PI * 2);
    g.fill();
  });

  g.rotate(side * ln * (her ? 0.15 : 0.04));
  const sw = her ? 0.082 : 0.1;

  if (her) { // váy phủ mép ghế
    g.beginPath();
    g.moveTo(-0.1 * H, 0.06 * H);
    g.quadraticCurveTo(0, 0.08 * H, 0.1 * H, 0.06 * H);
    g.bezierCurveTo(0.075 * H, 0.0, 0.05 * H, -0.04 * H, 0.04 * H, -0.08 * H);
    g.lineTo(-0.04 * H, -0.08 * H);
    g.bezierCurveTo(-0.05 * H, -0.04 * H, -0.075 * H, 0.0, -0.1 * H, 0.06 * H);
    g.fill();
  }

  g.beginPath();
  g.moveTo(-0.045 * H, -0.06 * H);
  g.bezierCurveTo(-0.05 * H, -0.15 * H, -sw * H, -0.22 * H, -sw * H, -0.265 * H);
  g.quadraticCurveTo(-sw * H * 0.9, -0.305 * H + br, -0.025 * H, -0.31 * H + br);
  g.lineTo(0.025 * H, -0.31 * H + br);
  g.quadraticCurveTo(sw * H * 0.9, -0.305 * H + br, sw * H, -0.265 * H);
  g.bezierCurveTo(sw * H, -0.22 * H, 0.05 * H, -0.15 * H, 0.045 * H, -0.06 * H);
  g.lineTo(0.045 * H, 0.02 * H);
  g.lineTo(-0.045 * H, 0.02 * H);
  g.closePath();
  g.fill();

  if (!her) { // khe cổ áo
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.moveTo(-0.018 * H, -0.31 * H);
    g.lineTo(0, -0.272 * H);
    g.lineTo(0.018 * H, -0.31 * H);
    g.fill();
    g.restore();
  }

  // Hai tay đặt nhẹ tự nhiên lên đùi (khuỷu mở nhẹ ra ngoài, cẳng tay khép vào đùi)
  [-1, 1].forEach((k) => {
    const a1 = k * (0.14 - ln * 0.03), a2 = -k * (0.42 + ln * 0.05);
    const A1 = limb2(g, k * sw * 0.9 * H, -0.265 * H, a1, 0.148 * H, 0.034 * H, a2, 0.132 * H, 0.027 * H);
    hand2(g, A1[2], A1[3], a1 + a2, H, 0.18, false, -k);
    anchors.push(tp(g, A1[2], A1[3]));
  });
  anchors.push(tp(g, 0, -0.3 * H));

  // Cổ & đầu
  g.fillRect(-0.016 * H, -0.36 * H, 0.032 * H, 0.06 * H);
  g.save();
  g.translate(0, -0.352 * H + br);
  g.rotate(side * ln * (her ? 0.42 : 0.24) + (P.look || 0) * 0.25);
  g.beginPath();
  g.ellipse(0, -0.055 * H, 0.05 * H, 0.064 * H, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(0, -0.085 * H, her ? 0.062 * H : 0.056 * H, 0.05 * H, 0, Math.PI * 0.92, Math.PI * 2.08);
  g.fill(); // tóc
  if (her) {
    g.save();
    g.translate(-0.052 * H, -0.09 * H);
    g.rotate(0.55 + Math.sin(t * 0.8) * 0.06 - ln * 0.12);
    g.beginPath();
    g.moveTo(-0.01 * H, 0);
    g.bezierCurveTo(-0.03 * H, 0.05 * H, -0.01 * H, 0.09 * H, -0.03 * H, 0.14 * H);
    g.bezierCurveTo(-0.004 * H, 0.1 * H, 0.012 * H, 0.05 * H, 0.012 * H, 0);
    g.closePath();
    g.fill();
    g.restore(); // đuôi ngựa buông phía ngoài
  }
  anchors.push(tp(g, 0, -0.125 * H));
  g.restore();

  const heart = tp(g, -side * 0.026 * H, -0.215 * H);
  g.save();
  g.globalCompositeOperation = 'destination-out';
  const hx = -side * 0.026 * H, hy = -0.215 * H, hs = 0.015 * H;
  g.beginPath();
  g.moveTo(hx, hy + hs * 0.9);
  g.bezierCurveTo(hx - hs * 1.6, hy - hs * 0.2, hx - hs * 0.6, hy - hs * 1.3, hx, hy - hs * 0.4);
  g.bezierCurveTo(hx + hs * 0.6, hy - hs * 1.3, hx + hs * 1.6, hy - hs * 0.2, hx, hy + hs * 0.9);
  g.fill();
  g.restore();

  g.restore();
  return { heart, anchors };
}

// Hình nhân nằm im trong khuôn gỗ ở (x0, y0) khi k=0, nhấc lên, khẽ xoay, bay theo đường cong tới đứng thẳng ở (x1, y1) khi k=1
function liftOff(g, k, her, x0, y0, x1, y1, H, t, opts) {
  const kk = clamp(k || 0, 0, 1);
  const tt = t || 0;
  const o = opts || {};
  const fx = o.fx !== undefined ? o.fx : (Math.abs(x1 - x0) > 1 ? (x1 >= x0 ? 1 : -1) : (her ? -1 : 1));

  // Dây điều khiển thả xuống chạm hình nhân trước (k: 0.02 -> 0.22), k=0 nằm im hoàn toàn
  const strDrop = sstep(0.02, 0.22, kk);
  const wake = sstep(0.14, 0.28, kk);

  // Quỹ đạo cong: đợi dây chạm rồi nhấc nhẹ ra khỏi khuôn, lượn cong cao dần sang đứng thẳng ở (x1, y1)
  const sx = sstep(0.24, 0.94, kk);
  const sy = sstep(0.18, 0.96, kk);
  const arcU = sstep(0.18, 0.95, kk);
  const arcLift = Math.max(0.42 * H, Math.hypot(x1 - x0, y1 - y0) * 0.24);
  const air = Math.sin(Math.PI * sstep(0.18, 0.92, kk));

  const hipX0 = x0;
  const hipY0 = y0 - 0.03 * H;
  const hipX1 = x1;
  const hipY1 = y1 - 0.475 * H;

  const hoverY = air * Math.sin(tt * 2.1) * 0.012 * H;
  const landDip = Math.sin(Math.PI * clamp((kk - 0.87) / 0.13, 0, 1)) * 0.012 * H;
  const hipX = hipX0 + (hipX1 - hipX0) * sx;
  const hipY = hipY0 + (hipY1 - hipY0) * sy - arcLift * Math.pow(Math.sin(Math.PI * arcU), 1.15) - hoverY + landDip;

  // Góc xoay: từ -PI/2 (nằm ngửa phẳng trong khuôn) nhấc đầu dậy, khẽ nghiêng lắc nhẹ giữa không trung, về 0 (đứng thẳng)
  const upright = sstep(0.20, 0.86, kk);
  const swayRot = air * (0.13 * Math.sin(arcU * Math.PI * 2.1 - 0.35) - 0.05);
  const tilt = -Math.PI * 0.5 * (1 - upright) + swayRot;

  const res = puppet2(g, {
    x: hipX,
    base: y1,
    hipY: hipY,
    H: H,
    fx: fx,
    her: !!her,
    lean: air * 0.12,
    look: -air * 0.18,
    air: air,
    still: 1 - wake,
    tilt: tilt,
    t: tt * wake,
    open: air * 0.35
  });

  // Vẽ dây điều khiển thả xuống từ trên bằng đúng màu g.fillStyle hiện tại
  if (!o.noStrings && strDrop > 0.005 && res && res.anchors) {
    const m = g.getTransform();
    const sc = Math.hypot(m.a, m.b) || 1;
    const topY = -20 * sc;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.strokeStyle = g.fillStyle;
    g.globalAlpha *= 0.40 * strDrop;
    g.lineWidth = Math.max(1, 0.0042 * H * sc);
    for (let i = 0; i < res.anchors.length; i++) {
      const pt = res.anchors[i];
      if (!pt) continue;
      const endY = topY + (pt[1] - topY) * strDrop;
      g.beginPath();
      g.moveTo(pt[0], topY);
      g.lineTo(pt[0], endY);
      g.stroke();
    }
    g.restore();
  }

  return res;
}

const span = (t, a, b, e = 0.45) => sstep(a, a + e, t) * (1 - sstep(b - e, b, t));

const flipTo = (t, a, b, from, to) => (t <= a ? from : t >= b ? to : from + (to - from) * (1 - Math.cos(Math.PI * (t - a) / (b - a))) / 2);

const glide = (t, a, b, x0, x1) => x0 + (x1 - x0) * sstep(a, b, t);
// chi: góc tính từ phương thẳng đứng xuống, dương = về phía trước mặt. fing: 0..1 xoè ngón tay
function limb(g, x0, y0, a1, l1, w1, a2, l2, w2, end, fing = 0) {
  const x1 = x0 + Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1, x2 = x1 + Math.sin(a1 + a2) * l2, y2 = y1 + Math.cos(a1 + a2) * l2;
  capsule(g, x0, y0, x1, y1, w1 / 2, w1 * 0.42); capsule(g, x1, y1, x2, y2, w2 / 2, w2 * 0.38);
  if (end === 'foot') { g.beginPath(); g.ellipse(x2 + l2 * 0.16, y2 + w2 * 0.12, l2 * 0.24, w2 * 0.3, 0, 0, Math.PI * 2); g.fill(); }
  else { const a = a1 + a2, ux = Math.sin(a), uy = Math.cos(a), px = Math.cos(a), py = -Math.sin(a), hw = w2 * 0.5;
    g.beginPath(); g.ellipse(x2 + ux * hw * 0.5, y2 + uy * hw * 0.5, hw * 0.95, hw * 0.75, Math.atan2(uy, ux), 0, Math.PI * 2); g.fill(); // lòng bàn tay
    if (fing > 0) { const fl = l2 * 0.22 * fing; for (let k = -1; k <= 1; k++) { const bx = x2 + ux * hw * 1.1 + px * k * hw * 0.42, by = y2 + uy * hw * 1.1 + py * k * hw * 0.42; capsule(g, bx, by, bx + ux * fl * (1 - 0.15 * Math.abs(k)), by + uy * fl * (1 - 0.15 * Math.abs(k)), hw * 0.17, hw * 0.12); }
      capsule(g, x2 + px * hw * 0.6, y2 + py * hw * 0.6, x2 + px * hw * 0.6 + (ux + px) * fl * 0.5, y2 + py * hw * 0.6 + (uy + py) * fl * 0.5, hw * 0.18, hw * 0.12); } } // ba ngón và ngón cái
  return [x2, y2];
}
// P: { x, base, H, fx (-1..1, lật giấy), her, ph, walk, run, touch (chạm vai), reach, fing, sit, seat, lean, look (âm = cúi), t }
// trả về: heart, anchors (điểm buộc dây điều khiển, toạ độ thiết bị của mặt nạ)
function puppet(g, P) {
  const H = P.H, w = P.walk || 0, r = P.run || 0, sit = P.sit || 0, ph = P.ph || 0, sn = Math.sin(ph);
  const bendF = (1 - Math.cos(ph - 0.7)) / 2, bendB = (1 - Math.cos(ph + Math.PI - 0.7)) / 2, breathe = Math.sin((P.t || 0) * 1.6) * 0.025;
  const bob = -(w * 0.012 + r * 0.035) * Math.abs(sn) * H, anchors = [];
  const hipStand = P.base - 0.47 * H, hipY = hipStand * (1 - sit) + (P.seat || hipStand) * sit + bob;
  g.save(); g.translate(P.x, 0); g.scale(Math.abs(P.fx) < 0.04 ? 0.04 * Math.sign(P.fx || 1) : P.fx, 1);
  const thF = (w * 0.34 + r * 0.9) * sn + sit * 1.5, thB = -(w * 0.34 + r * 0.9) * sn + sit * 1.5;
  const knF = -(w * 0.45 + r * 1.25) * bendF - sit * 1.5, knB = -(w * 0.45 + r * 1.25) * bendB - sit * 1.5;
  const touch = P.touch || 0, reach = P.reach || 0, hug = P.hug || 0, lean = (P.lean || 0) * 0.3 + r * 0.22 + hug * 0.16;
  limb(g, -0.005 * H, hipY, thB, 0.235 * H, 0.085 * H, knB, 0.235 * H, 0.062 * H, 'foot');
  g.save(); g.translate(0, hipY); g.rotate(lean);
  const sh = [0.005 * H, -0.285 * H];
  const upB = (w * 0.28 + r * 0.85) * sn + breathe - 0.04 + hug * 1.0, elB = r * 1.25 + w * 0.12 + 0.1 + hug * 1.55;
  const handB = limb(g, sh[0], sh[1], upB, 0.15 * H, 0.056 * H, elB, 0.14 * H, 0.044 * H); anchors.push(tp(g, handB[0], handB[1]));
  const tw = P.her ? 0.9 : 1;
  g.beginPath(); g.moveTo(-0.068 * H * tw, 0.025 * H);
  g.bezierCurveTo(-0.09 * H * tw, -0.11 * H, -0.082 * H * tw, -0.235 * H, -0.05 * H * tw, -0.31 * H);
  g.quadraticCurveTo(0, -0.34 * H, 0.052 * H * tw, -0.305 * H);
  g.bezierCurveTo((P.her ? 0.088 : 0.078) * H * tw, -0.25 * H, 0.07 * H * tw, -0.14 * H, 0.06 * H * tw, -0.06 * H);
  g.quadraticCurveTo(0.068 * H * tw, 0.025 * H, -0.068 * H * tw, 0.025 * H); g.fill();
  anchors.push(tp(g, -0.02 * H, -0.3 * H)); // dây lưng
  g.fillRect(-0.022 * H, -0.37 * H, 0.044 * H, 0.08 * H);
  g.save(); g.translate(0, -0.355 * H); g.rotate((P.look || 0) * 0.5 - lean * 0.3);
  g.beginPath(); g.ellipse(0.012 * H, -0.05 * H, 0.058 * H, 0.066 * H, 0.12, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(0.064 * H, -0.058 * H); g.lineTo(0.082 * H, -0.04 * H); g.lineTo(0.062 * H, -0.028 * H); g.fill();
  g.beginPath(); g.ellipse(-0.006 * H, -0.072 * H, 0.066 * H, 0.05 * H, -0.2, Math.PI * 0.85, Math.PI * 2.05); g.fill();
  if (P.her) { const sway = Math.sin(ph * 0.5 + (P.t || 0) * 0.9) * 0.16 + r * 0.4 + w * 0.15; g.save(); g.translate(-0.055 * H, -0.075 * H); g.rotate(0.35 + sway); capsule(g, 0, 0, -0.02 * H, 0.13 * H, 0.026 * H, 0.012 * H); g.restore(); g.beginPath(); g.arc(-0.058 * H, -0.075 * H, 0.022 * H, 0, Math.PI * 2); g.fill(); }
  anchors.push(tp(g, 0.01 * H, -0.12 * H)); // dây đầu
  g.restore();
  const upF = -(w * 0.28 + r * 0.85) * sn + touch * 2.0 + reach * 1.32 + hug * 1.15 - breathe + 0.03, elF = r * 1.25 + w * 0.12 - touch * 0.35 + reach * 0.04 + hug * 1.6 + 0.1;
  const handF = limb(g, sh[0], sh[1], upF, 0.15 * H, 0.056 * H, elF, 0.14 * H, 0.044 * H, 'hand', Math.max(P.fing || 0, touch)); anchors.push(tp(g, handF[0], handF[1]));
  const hd = tp(g, 0.03 * H, -0.225 * H);
  g.restore();
  limb(g, 0.005 * H, hipY, thF, 0.235 * H, 0.085 * H, knF, 0.235 * H, 0.062 * H, 'foot');
  // trái tim khoét trên ngực
  g.save(); g.translate(0, hipY); g.rotate(lean); g.globalCompositeOperation = 'destination-out'; const hx = 0.03 * H, hy = -0.225 * H, hs = 0.017 * H;
  g.beginPath(); g.moveTo(hx, hy + hs * 0.9); g.bezierCurveTo(hx - hs * 1.6, hy - hs * 0.2, hx - hs * 0.6, hy - hs * 1.3, hx, hy - hs * 0.4); g.bezierCurveTo(hx + hs * 0.6, hy - hs * 1.3, hx + hs * 1.6, hy - hs * 0.2, hx, hy + hs * 0.9); g.fill(); g.restore();
  g.restore();
  return { heart: hd, anchors };
}
// hình nhân ngồi nhìn từ phía trước (xoay mặt ra như tờ giấy lật). lean: 0..1 em tựa đầu lên vai anh, anh nghiêng đầu về em
// ---------- hình nhân cắt tay, nét tinh (bản 2) ----------
// mặt nghiêng có trán, mũi, môi, cằm; tóc; váy (em) / áo cổ (anh); tay chân thon; bàn tay 4 ngón + ngón cái; lỗ đinh ghim ở khớp
// dây điều khiển: từ điểm buộc thẳng lên mép trên, khẽ đung đưa
function strings(m, anchors, t, seed) { m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.lineWidth = 0.9; anchors.forEach(([x, y], i) => { const sw = Math.sin(t * 0.9 + seed + i * 1.7) * 6; m.beginPath(); m.moveTo(x, y); m.quadraticCurveTo(x + sw * 0.5, y * 0.5, x + sw, -4); m.stroke(); }); m.restore(); }
// ---------- kịch bóng trên bức tường dài của đình (khung hình đi theo nhân vật) ----------
// em chạm vai anh; anh bỏ đi dần, càng xa càng mệt; em đứng một góc cúi đầu; anh ngoảnh lại, thấy em vẫn chờ; anh chạy về
// qua bóng giấy của từng chương; dấu chân sáng, "999 bước" viết phấn lùi về 0; anh ôm lấy em đúng lúc nâng tông, vết nứt lành.
const CRACK_X = 561, LANTERN_X = 520; // vết nứt nằm đúng chỗ hai người ôm nhau
const PROPS = [ // bóng giấy treo trên tường: anh chạy về sẽ qua lần lượt từ xa tới gần
  { x: 2450, name: 'Cuộn băng số 1', k: 'bang' }, { x: 2150, name: 'Sợi chỉ', k: 'chi' }, { x: 1850, name: 'Ai đó, lúc năm giờ sáng', k: 'dongho' },
  { x: 1550, name: 'Người cúp máy sau cùng', k: 'nghe' }, { x: 1250, name: 'Phần còn lại', k: 'cong' }];
function propShape(g, k, x, y) { // hình cắt giấy đơn giản, đọc được ngay
  g.save(); g.translate(x, y);
  if (k === 'bang') { roundRect(g, -70, -42, 140, 84, 10); g.fill(); g.globalCompositeOperation = 'destination-out'; [-32, 32].forEach((cx) => { g.beginPath(); g.arc(cx, -4, 15, 0, Math.PI * 2); g.fill(); }); g.fillRect(-44, 20, 88, 10); }
  if (k === 'chi') { g.fillRect(-30, -40, 60, 12); g.fillRect(-30, 28, 60, 12); g.fillRect(-20, -30, 40, 60); g.lineWidth = 4; g.beginPath(); g.moveTo(20, 0); g.bezierCurveTo(70, 10, 40, 60, 95, 70); g.stroke(); }
  if (k === 'dongho') { g.beginPath(); g.arc(0, 0, 52, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 0, 44, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = 'source-over'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -32); g.moveTo(0, 0); g.lineTo(17, 21); g.stroke(); } // 5 giờ
  if (k === 'nghe') { g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(-50, -20); g.quadraticCurveTo(0, -60, 50, -20); g.stroke(); roundRect(g, -66, -30, 30, 44, 8); g.fill(); roundRect(g, 36, -30, 30, 44, 8); g.fill(); }
  if (k === 'cong') { g.fillRect(-60, -60, 14, 110); g.fillRect(46, -60, 14, 110); g.beginPath(); g.moveTo(-66, -60); g.quadraticCurveTo(0, -100, 66, -60); g.lineTo(66, -50); g.quadraticCurveTo(0, -88, -66, -50); g.fill(); for (let i = 0; i < 3; i++) g.fillRect(-40 + i * 6, 50 + i * 0, 80 - i * 12, 6); }
  g.restore();
}
function crackDraw(c, t, camX) { // vết nứt hiện dần khi anh bỏ đi; liền lại dần khi anh chạy về; lành hẳn khi nắm tay
  const grow = sstep(62.8, 67.6, t), seal = 0.8 * sstep(70.8, 76.4, t) + 0.2 * sstep(76.9, 77.5, t), heal = sstep(76.95, 77.8, t), gone = sstep(79.5, 83, t);
  if (grow <= 0 || gone >= 1) return;
  const P = []; for (let i = 0; i <= 12; i++) P.push([CRACK_X - camX + Math.sin(i * 2.7) * 9 + (i % 2 ? 4 : -4), 220 + i * 40]);
  const n = 12, vis = grow * n, sealFrom = (1 - seal) * n; // nhìn thấy từ trên xuống tới 'vis'; phần dưới 'sealFrom' đã liền
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); for (let i = 0; i <= Math.min(vis, sealFrom); i++) { const [x, y] = P[i]; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.strokeStyle = `rgba(8,6,5,${0.8 * (1 - heal)})`; c.lineWidth = 3.2; c.stroke();
  c.globalCompositeOperation = 'lighter'; c.beginPath(); let st = false; for (let i = Math.floor(Math.min(sealFrom, vis)); i <= vis; i++) { const [x, y] = P[i]; st ? c.lineTo(x, y) : c.moveTo(x, y); st = true; }
  const a = (0.55 + 0.45 * heal) * (1 - gone); c.strokeStyle = `rgba(255,210,150,${0.6 * a})`; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = `rgba(255,190,110,${0.1 * a + 0.1 * heal})`; c.lineWidth = 12; c.stroke();
  c.restore();
}
function drawTuongBong(c, now, tn) {
  if (!TBwall || TBwall.height !== cv.height) bakeTB();
  const t = tn, HB = 456, base = 712, seat = 600;
  // ---- nhân vật (toạ độ trên bức tường dài) ----
  // nhịp: chạm vai 61.3 · anh bỏ đi 62.6–67 · mệt, ngoảnh lại · tín hiệu 68–70.8 · chạy về 70.8–75.5 (chậm dần) · đứng một nhịp
  //       · giơ tay 76.1–77 (đầu ngón chạm) · nâng tông 77.4 bước tới ôm nhau thật chậm · đung đưa · ra ghế 80.2
  const E = { her: true, H: HB * 0.95, base, seat, t,
    x: t < 61.4 ? glide(t, 59, 61.4, 300, 858) : t < 64 ? 858 : t < 77.4 ? glide(t, 64, 66, 858, 400) : t < 80.2 ? glide(t, 77.4, 78.6, 400, 452) : glide(t, 80.2, 81.7, 452, 748),
    fx: t < 66 ? flipTo(t, 63.8, 64.4, 1, -1) : t < 81 ? flipTo(t, 66.0, 66.6, -1, 1) : flipTo(t, 81.6, 82.1, 1, 0),
    walk: Math.min(1, span(t, 59, 61.5) + 0.8 * span(t, 64.3, 66.1) + 0.35 * span(t, 77.4, 78.6) + 0.6 * span(t, 80.2, 81.8)),
    touch: span(t, 61.3, 63.7, 0.6), reach: 0.92 * span(t, 76.15, 78.2, 0.85), hug: span(t, 77.5, 80.4, 0.9) };
  const sad = sstep(66.2, 67.6, t) * (1 - 0.55 * sstep(69.6, 70.2, t)) * (1 - sstep(75.3, 76.0, t)); E.look = -0.9 * sad + 0.25 * span(t, 75.6, 77.6, 0.4) - 0.15 * span(t, 77.8, 80.2, 0.6); E.lean = 0.25 * sad; E.ph = E.x / 34;
  const u1 = clamp((t - 62.6) / 4.4, 0, 1), eR = sstep(70.8, 75.5, t);
  const ax = t < 62.6 ? 1000 : t < 70.8 ? 1000 + 1700 * (1 - (1 - u1) * (1 - u1)) : t < 75.5 ? 2700 - 1940 * eR : t < 77.4 ? glide(t, 75.5, 76.3, 760, 722) : t < 80.2 ? glide(t, 77.4, 78.6, 722, 528) : glide(t, 80.2, 81.7, 528, 852);
  const tired = sstep(65.8, 67.2, t) * (1 - sstep(67.4, 68.0, t));
  const A = { her: false, H: HB * (1 - 0.16 * clamp((ax - 900) / 1800, 0, 1)), base, seat, t, x: ax,
    fx: t < 81 ? flipTo(t, 67.4, 68.0, 1, -1) : flipTo(t, 81.6, 82.1, -1, 0),
    walk: Math.min(1, span(t, 62.6, 67.1, 0.6) * (1 - 0.5 * sstep(65, 67, t)) + 0.55 * span(t, 75.3, 76.35, 0.35) + 0.35 * span(t, 77.4, 78.6) + 0.6 * span(t, 80.2, 81.8)),
    run: span(t, 70.75, 75.7, 0.5) * (1 - 0.6 * sstep(74.4, 75.5, t)), reach: 0.92 * span(t, 76.05, 78.2, 0.85), hug: span(t, 77.5, 80.4, 0.9),
    look: -0.7 * tired + 0.35 * span(t, 67.4, 68.8, 0.3) - 0.45 * span(t, 77.8, 80.2, 0.6), lean: 0.6 * tired };
  A.ph = ax / 40;
  const sway = Math.sin((t - 78) * 1.6) * 6 * span(t, 78.4, 80.2, 0.5); E.x += sway; A.x += sway; // ôm nhau khẽ đung đưa
  const front = sstep(82.1, 82.6, t), restLean = sstep(83, 85.6, t);
  const sig1 = t > 68.3 && t < 69.5 ? 2700 - 2300 * sstep(68.3, 69.4, t) : null, sig2 = t > 69.9 && t < 70.85 ? 400 + 2300 * sstep(69.9, 70.8, t) : null;
  let camX = 0;
  if (t >= 62.6 && t < 68.3) camX = clamp(ax - 1000, 0, 1700);
  else if (t >= 68.3 && t < 69.5) camX = clamp(sig1 - 800, 0, 1700);
  else if (t >= 69.9 && t < 70.8) camX = clamp(sig2 - 1050, 0, 1650);
  else if (t >= 70.8 && t < 80) camX = 1650 * (1 - eR); // khung đi chậm hơn anh: kỷ niệm ở lại trong khung lâu
  const far = clamp(camX / 1700, 0, 1), warm = sstep(77.4, 84, t), runK = span(t, 70.8, 75.7, 0.4);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(TBwall, -camX * S * dpr, 0); c.restore(); setT(c);
  const lx = LANTERN_X - camX, flick = 1 + 0.03 * Math.sin(now * 0.011) + 0.02 * Math.sin(now * 0.027);
  c.save(); c.globalCompositeOperation = 'lighter';
  const lg = c.createRadialGradient(lx, 900, 40, lx, 900, (950 + 400 * warm) * flick); lg.addColorStop(0, `rgba(255,180,100,${0.36 + 0.26 * warm})`); lg.addColorStop(0.55, `rgba(255,150,80,${0.12 + 0.16 * warm})`); lg.addColorStop(1, 'rgba(255,140,70,0)');
  c.fillStyle = lg; c.fillRect(-300, -300, W + 600, H + 600); c.restore();
  c.save(); c.fillStyle = `rgba(4,5,9,${0.32 * far})`; c.fillRect(-300, -300, W + 600, H + 600); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(110,130,180,${0.05 * far})`; c.fillRect(-300, -300, W + 600, H + 600); c.restore();
  if (runK > 0) { const ex2 = ax - camX; c.save(); c.globalCompositeOperation = 'lighter'; const rg = c.createRadialGradient(ex2, 430, 20, ex2, 430, 420); rg.addColorStop(0, `rgba(255,190,120,${0.22 * runK})`); rg.addColorStop(1, 'rgba(255,170,90,0)'); c.fillStyle = rg; c.fillRect(ex2 - 420, 0, 840, H); const tg2 = c.createLinearGradient(ex2 - 160, 0, ex2 + 900, 0); tg2.addColorStop(0, 'rgba(255,190,120,0)'); tg2.addColorStop(0.15, `rgba(255,190,120,${0.1 * runK})`); tg2.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = tg2; c.fillRect(ex2 - 160, 150, 1060, 570); c.restore(); }
  crackDraw(c, t, camX);
  // ---- mặt nạ bóng (độ phân giải đầy đủ) ----
  const m = TBmask.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, TBmask.width, TBmask.height); m.setTransform(1, 0, 0, 1, -camX, 0); m.fillStyle = '#fff'; m.strokeStyle = '#fff';
  PROPS.forEach((pr) => { if (Math.abs(pr.x - camX - 800) < 1100) propShape(m, pr.k, pr.x, 330); });
  const pe = front > 0 ? frontFig(m, { her: true, x: 748, seat, base, H: HB * 0.95, w: front, lean: restLean, t }) : puppet2(m, E);
  const pa = front > 0 ? frontFig(m, { her: false, x: 852, seat, base, H: HB, w: front, lean: restLean, t }) : puppet2(m, A);
  m.fillRect(560, 596, 480, 20); m.fillRect(590, 616, 26, 96); m.fillRect(984, 616, 26, 96);
  m.setTransform(1, 0, 0, 1, 0, 0); m.lineWidth = 1.4; [[pe.anchors, 1], [pa.anchors, 4]].forEach(([an, sd]) => an.forEach(([x, y], i) => { const sw2 = Math.sin(t * 0.9 + sd + i * 1.7) * 6; m.beginPath(); m.moveTo(x, y); m.quadraticCurveTo(x + sw2 * 0.5, y * 0.5, x + sw2, -4); m.stroke(); }));
  const rim = Math.max(span(t, 61.6, 63.6, 0.5) * 0.4, sstep(77.5, 78.6, t) * (1 - 0.5 * sstep(88, 91, t)));
  if (rim > 0) { const gq = TBglow.getContext('2d'); gq.setTransform(1, 0, 0, 1, 0, 0); gq.clearRect(0, 0, TBglow.width, TBglow.height); gq.globalCompositeOperation = 'source-over'; gq.drawImage(TBmask, 0, 0, TBglow.width, TBglow.height); gq.globalCompositeOperation = 'source-in'; gq.fillStyle = 'rgb(255,196,120)'; gq.fillRect(0, 0, TBglow.width, TBglow.height);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 0.5 * rim; c.drawImage(TBglow, -14, -14, W + 28, H + 28); c.restore(); }
  const sq = TBsoft.getContext('2d'); sq.setTransform(1, 0, 0, 1, 0, 0); sq.globalCompositeOperation = 'source-over'; sq.clearRect(0, 0, TBsoft.width, TBsoft.height); sq.drawImage(TBmask, 0, 0, TBsoft.width, TBsoft.height); sq.globalCompositeOperation = 'source-in'; sq.fillStyle = 'rgb(16,10,7)'; sq.fillRect(0, 0, TBsoft.width, TBsoft.height);
  c.save(); c.globalAlpha *= 0.28 * (1 - 0.4 * far); c.drawImage(TBsoft, -16, -10, W + 32, H + 20); c.restore();
  m.globalCompositeOperation = 'source-in'; m.fillStyle = 'rgb(16,10,7)'; m.fillRect(0, 0, TBmask.width, TBmask.height); m.globalCompositeOperation = 'source-over';
  c.save(); c.globalAlpha *= (0.7 + 0.06 * warm) * (1 - 0.25 * far); c.drawImage(TBmask, 0, 0, W, H); c.restore();
  if (t > 70.8) PROPS.forEach((pr) => { const sx = pr.x - camX; if (sx < -300 || sx > W + 300) return; const d = ax - pr.x, lit = d > 0 ? Math.pow(clamp(1 - d / 650, 0, 1), 1.4) : 1; if (lit <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(sx, 330, 10, sx, 330, 210); gg.addColorStop(0, `rgba(255,200,130,${0.34 * lit})`); gg.addColorStop(1, 'rgba(255,180,100,0)'); c.fillStyle = gg; c.fillRect(sx - 210, 120, 420, 420); c.restore();
    text(c, pr.name, sx, 452, 30, 0.88 * lit, 'center', '255,226,180'); });
  // (không vẽ tia sáng giữa hai người: chỉ trái tim mỗi người sáng lên là đủ để nhận ra nhau)
  if (t > 70.8 && t < 80) { const fade = 1 - sstep(77.2, 78.8, t);
    c.save(); c.globalCompositeOperation = 'lighter'; for (let fxp = 2660; fxp > ax; fxp -= 74) { const sx = fxp - camX; if (sx < -40 || sx > W + 40) continue; const a = clamp(1 - (fxp - ax) / 1100, 0, 1) * 0.55 * fade; c.fillStyle = `rgba(255,206,140,${a})`; c.beginPath(); c.ellipse(sx, base + 6, 14, 4, 0, 0, Math.PI * 2); c.fill(); } c.restore();
    const n = Math.max(0, Math.round(999 * (ax - 722) / 1978)); text(c, n + ' bước', ax - camX, base + 62, 30, 0.8 * fade * sstep(71.0, 71.7, t), 'center', '236,232,222'); }
  const both = Math.max(span(t, 61.8, 63.6, 0.5) * 0.45, sstep(77.6, 78.6, t));
  const hv = [Math.max(both, span(t, 69.4, 70.6, 0.25), 0.35 * sstep(70.1, 70.5, t) * (1 - sstep(76.6, 77.4, t))), Math.max(both, span(t, 67.9, 69.1, 0.25), 0.45 * runK)];
  c.save(); c.globalCompositeOperation = 'lighter'; [pe.heart, pa.heart].forEach(([hx, hy], i) => { const a = hv[i]; if (a <= 0) return; const R = 34 + 40 * (i ? span(t, 67.9, 68.9, 0.2) : span(t, 69.4, 70.3, 0.2)), hg2 = c.createRadialGradient(hx, hy, 1, hx, hy, R); hg2.addColorStop(0, `rgba(255,224,170,${0.85 * a})`); hg2.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = hg2; c.fillRect(hx - R, hy - R, R * 2, R * 2); }); c.restore();
  // đầu ngón tay chạm nhau: một đốm sáng nhỏ; ôm nhau: sáng tràn
  const tip = span(t, 76.85, 77.7, 0.25), touch = sstep(77.5, 78.2, t) * (1 - sstep(79, 81, t));
  if (tip > 0) { const tx = CRACK_X - camX, ty = 412; c.save(); c.globalCompositeOperation = 'lighter'; const hg = c.createRadialGradient(tx, ty, 1, tx, ty, 46); hg.addColorStop(0, `rgba(255,236,196,${0.95 * tip})`); hg.addColorStop(1, 'rgba(255,200,130,0)'); c.fillStyle = hg; c.fillRect(tx - 46, ty - 46, 92, 92); c.restore(); }
  if (touch > 0) { const tx = 490 - camX, ty = 390; c.save(); c.globalCompositeOperation = 'lighter'; const hg = c.createRadialGradient(tx, ty, 2, tx, ty, 220); hg.addColorStop(0, `rgba(255,230,180,${0.6 * touch})`); hg.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = hg; c.fillRect(tx - 220, ty - 220, 440, 440); c.restore(); }
  vignette(c, 0.75);
}
// anh chạy: con đường đêm, đèn bật sáng sau lưng, tên các chương sáng lên khi chạy qua, "999 bước còn lại" đếm lùi
const RUN_SIGNS = ['Cuộn băng số 1', 'Sợi chỉ', 'Ai đó, lúc năm giờ sáng', 'Người cúp máy sau cùng', 'Phần còn lại'];
function drawRun(c, now, tn) {
  const T0 = 67.6, T1 = 76.6, k = kseg(tn, T0, T1), off = k * 5600, gy = 650, rx = 980;
  const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#070910'); sky.addColorStop(1, '#14100c'); c.fillStyle = sky; c.fillRect(-300, -300, W + 600, H + 600);
  for (let i = 0; i < 14; i++) { const x = ((i * 260 + off * 0.25) % 3640) - 300, h = 120 + ((i * 53) % 90); c.fillStyle = '#0d0e14'; c.fillRect(x, gy - 60 - h, 180, h + 60); } // dãy nhà xa (trôi chậm)
  c.fillStyle = '#0f0c0a'; c.fillRect(-300, gy, W + 600, 400);
  // vệt đường sáng sau lưng anh
  c.save(); c.globalCompositeOperation = 'lighter'; const rg = c.createLinearGradient(rx, 0, W + 300, 0); rg.addColorStop(0, 'rgba(255,190,110,.55)'); rg.addColorStop(1, 'rgba(255,170,90,.08)'); c.fillStyle = rg; c.fillRect(rx, gy - 3, W + 300 - rx, 6);
  // đèn đường: chưa qua thì tắt, qua rồi thì sáng
  for (let i = 0; i < 40; i++) { const wx = i * 170, x = wx - 6800 + off + 1600; if (x < -100 || x > W + 100) continue; const lit = x > rx - 20; c.fillStyle = 'rgba(60,55,50,.9)'; c.fillRect(x - 2, gy - 170, 4, 170);
    if (lit) { const lgx = c.createRadialGradient(x, gy - 172, 2, x, gy - 172, 46); lgx.addColorStop(0, 'rgba(255,214,150,.75)'); lgx.addColorStop(1, 'rgba(255,180,100,0)'); c.fillStyle = lgx; c.fillRect(x - 46, gy - 218, 92, 92); const pool = c.createRadialGradient(x, gy + 6, 4, x, gy + 6, 110); pool.addColorStop(0, 'rgba(255,190,110,.18)'); pool.addColorStop(1, 'rgba(255,170,90,0)'); c.fillStyle = pool; c.fillRect(x - 120, gy - 40, 240, 100); } }
  c.restore();
  // biển tên các chương bên đường
  RUN_SIGNS.forEach((s, i) => { const ki = (i + 0.7) / 5.6, x = rx + (k - ki) * 5600; if (x < -400 || x > W + 400) return; const lit = clamp((x - rx + 60) / 220, 0, 1), sy = gy - 420; // anh chạy sang trái: biển hiện từ bên trái, qua anh rồi sáng mãi phía sau
    c.fillStyle = 'rgba(46,38,30,.95)'; c.fillRect(x - 3, sy + 20, 6, gy - sy - 20);
    if (lit > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const sg = c.createRadialGradient(x, sy, 6, x, sy, 260); sg.addColorStop(0, `rgba(255,200,120,${0.3 * lit})`); sg.addColorStop(1, 'rgba(255,180,100,0)'); c.fillStyle = sg; c.fillRect(x - 260, sy - 260, 520, 520); c.restore(); }
    text(c, s, x, sy, 40, 0.3 + 0.68 * lit, 'center', lit > 0 ? '255,226,176' : '150,140,130'); });
  // hạt sáng bay ngược qua
  c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const x = ((i * 97 + off * 1.6) % (W + 200)) - 100, y = 200 + ((i * 131) % 420); c.fillStyle = 'rgba(255,214,150,.35)'; c.fillRect(x, y, 26, 2); } c.restore();
  // cái bóng anh đang chạy (cùng nét với bóng trên tường)
  const m = TBmask.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, TBmask.width, TBmask.height); m.fillStyle = '#fff'; m.strokeStyle = '#fff';
  m.setTransform(0.5, 0, 0, 0.5, 0, 0); puppet(m, { her: false, H: 330, base: gy, x: rx, fx: -1, run: 1, ph: tn * 10, t: tn }); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = 'rgb(6,4,3)'; m.fillRect(0, 0, TBmask.width, TBmask.height); m.globalCompositeOperation = 'source-over';
  c.save(); for (let i = 3; i >= 1; i--) { c.globalAlpha = 0.12 / i; c.drawImage(TBmask, 26 * i, 0, W, H); } c.globalAlpha = 0.95; c.drawImage(TBmask, 0, 0, W, H); c.restore(); // vệt mờ phía sau
  // "999 bước còn lại"
  const n = Math.max(0, Math.round(999 * (1 - k))); text(c, String(n), W / 2, 150, 60, 0.9, 'center', '255,228,190'); text(c, 'bước còn lại', W / 2, 190, 24, 0.6, 'center', '255,228,190');
  vignette(c, 0.7);
}
// ---------- phần thưởng cuối ----------
const CARD = new Image(); CARD.src = 'thiep-100.jpg';
const KET = { el: null, t0: 0, end: false, black: 0 };
const NHAN = { 1: 'Mười lăm bông sen cuối cùng', 76: 'Chờ chút…', 88: 'Cuộn băng số 1', 92: 'Hết ca sớm', 98: 'Phần còn lại', 100: 'Không tua nhanh được' };
const DANH = ['Không tua nhanh được', 'Cuộn băng số 2', '', 'Giọng trong băng', 'Anh', '', 'Bài hát', 'Yêu Được Không · Đức Phúc', '', 'Đình làng', 'như trong Cuộn băng số 1', '', 'Tấm thiệp 100 ngày', 'Lệ Thủy', '', '', 'Hết cuộn băng số 2'];
function startKet(goDelay = 0) {
  HINT.off = true; HINT.text = ''; if (typeof quietPast === 'function') quietPast(1.5);
  if (typeof P6 !== "undefined" && P6.nen) ramp(P6.nen.g.gain, 0, 3);
  // "Yêu Được Không" từ 3:04,5 (điệp khúc 2) tới ngay sau câu "Yêu được không?" cuối (5:02): bỏ câu nói "Khoan! Chưa kết thúc được!" và quảng cáo cuối file
  const el = new Audio('am/ydk-ket3.mp3'); el.preload = 'auto'; KET.el = el;
  try { const s = ac.createMediaElementSource(el), g = ac.createGain(); g.gain.value = 0.95; s.connect(g).connect(master); } catch (e) {}
  el.play().catch(() => {}); KET.t0 = performance.now();
  el.onended = () => { KET.endAt = performance.now(); KET.endT = el.duration || 117.5; }; // hết nhạc: đồng hồ vẫn chạy cho danh đề
  for (const k of ['ketduong', 'ketdinh']) if (SC[k] && SC[k].enter) SC[k].enter();
  if (goDelay) setTimeout(() => go('ket', 2600), goDelay); else go('ket', 2600); // từ bàn khuôn: để hai hình nhân bay lên trước rồi mới vào phim
}
const ketT = () => (KET.endAt ? KET.endT + (performance.now() - KET.endAt) / 1000 : KET.el && !KET.el.paused && KET.el.currentTime > 0 ? KET.el.currentTime : (performance.now() - KET.t0) / 1000);
const LAMP_T = 52.3; // giây cho 99 ngọn đèn đầu
const kseg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
SC.ket = {
  noBag: true,
  draw(c, now, dt) {
    const tn = ketT(), t = tn + 48.5; // tn: giây trong file mới; t: mốc cũ (tính từ 2:16) cho các đoạn sau đèn
    const u = clamp(tn / LAMP_T, 0, 1); KT.den = tn < 52.8 ? 99 * (1 - (1 - u) * (1 - u)) : 100; // nhanh lúc đầu, chậm dần khi về gần đình; ngọn 100 đúng "Yêu được không?" (4:00)
    KT.cam = 0.5 * Math.min(1, KT.den / 100) + 0.5 * ease(kseg(tn, 0, 55.5));
    KT.bong = 0; KT.sang = 0.7 + 0.3 * kseg(tn, 89, 96); KT.dom = kseg(tn, 89, 99.5); // sân đình không vẽ hình người: chỉ còn bóng trên tường
    const xf = kseg(tn, 55.5, 59), xf2 = kseg(tn, 89, 92.5); // đèn → tường bóng → sân đình
    if (xf < 1) { c.save(); SC.ketduong.draw(c, now, dt); c.restore(); setT(c); }
    if (xf > 0 && xf2 < 1) { c.save(); c.globalAlpha = xf; drawTuongBong(c, now, tn); c.restore(); setT(c); }
    if (xf2 > 0) { c.save(); c.globalAlpha = xf2; SC.ketdinh.draw(c, now, dt); c.restore(); setT(c); }
    // tên chương ở ngọn đèn của ngày nó
    if (xf < 1) { for (const d in NHAN) { const i = +d, tl = i === 100 ? 52.8 : LAMP_T * (1 - Math.sqrt(1 - i / 99)), hold = i === 100 ? 6 : i >= 85 ? 3 : 5, a = kseg(tn, tl, tl + 0.8) * (1 - kseg(tn, tl + hold, tl + hold + 1)) * (1 - xf); if (a <= 0) continue; const [x, y] = KT.lampXY(i); text(c, NHAN[d], clamp(x, 260, 1340), clamp(y - (i === 100 ? 90 : 46), 130, 740), i === 100 ? 30 : 25, 0.9 * a, 'center', '255,226,180'); }
      const n = Math.round(KT.den), a2 = kseg(tn, 1, 3) * (1 - xf); if (n > 0) { text(c, 'ngày thứ ' + n, W / 2, 790, 30, 0.75 * a2, 'center', '255,232,200'); if (n >= 100) { c.strokeStyle = `rgba(200,48,40,${0.85 * a2 * kseg(t, 101.3, 102.5)})`; c.lineWidth = 3; c.beginPath(); c.ellipse(W / 2 + 62, 780, 44, 26, -0.1, 0, Math.PI * 2 * kseg(t, 101.3, 102.5)); c.stroke(); } } }
    // tấm thiệp em làm, tụ lại từ đom đóm (rõ nét, không làm mờ)
    const cr = kseg(t, 148, 156);
    if (cr > 0 && CARD.complete && CARD.naturalWidth) {
      const h = 586, w = (h * CARD.naturalWidth) / CARD.naturalHeight, x = W / 2 - w / 2, y = 84;
      c.fillStyle = `rgba(0,0,0,${0.45 * cr})`; c.fillRect(-300, -300, W + 600, H + 600);
      c.save(); c.beginPath(); c.arc(W / 2, y + h / 2, ease(cr) * (h * 0.75), 0, Math.PI * 2); c.clip(); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(x + 8, y + 10, w, h); c.drawImage(CARD, x, y, w, h); c.restore();
      if (cr < 1) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 60; i++) { const a = i * 2.39996 + now * 0.0004, r = ease(cr) * (h * 0.75) + Math.sin(i * 7.1 + now * 0.002) * 12; c.fillStyle = `rgba(255,214,120,${0.5 * (1 - cr)})`; c.beginPath(); c.arc(W / 2 + Math.cos(a) * r, y + h / 2 + Math.sin(a) * r, 2.6, 0, Math.PI * 2); c.fill(); } c.restore(); }
    }
    // "Chúc mừng 100 ngày yêu nhau." — nét chữ của anh, số 100 khoanh đỏ
    const wr = kseg(t, 160.8, 164.5);
    if (wr > 0) { const s1 = 'Chúc mừng ', s2 = '100', s3 = ' ngày yêu nhau.'; c.font = `700 52px ${SCRIPT}`; const w1 = c.measureText(s1).width, w2 = c.measureText(s2).width, w3 = c.measureText(s3).width, x0 = W / 2 - (w1 + w2 + w3) / 2, y = 738;
      c.save(); c.beginPath(); c.rect(x0 - 20, y - 70, (w1 + w2 + w3 + 40) * wr, 110); c.clip(); c.fillStyle = 'rgba(255,240,214,.96)'; c.textAlign = 'left'; c.fillText(s1 + s2 + s3, x0, y); c.restore();
      const cc = kseg(t, 164.5, 166.2); if (cc > 0) { c.strokeStyle = 'rgba(200,48,40,.9)'; c.lineWidth = 3.5; c.beginPath(); c.ellipse(x0 + w1 + w2 / 2, y - 16, w2 / 2 + 18, 36, -0.08, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2.08 * cc); c.stroke(); } }
    // danh đề: chạy lên rồi dừng ở "Hết cuộn băng số 2"
    const cs = kseg(t, 162, 174.5); // danh đề: từ sau lời chúc tới khoảng giây 126
    if (t > 161) { const veil = kseg(t, 161, 163), CX = 1330; // cột danh đề bên phải tấm thiệp
      const pg = c.createLinearGradient(1080, 0, 1600, 0); pg.addColorStop(0, 'rgba(0,0,0,0)'); pg.addColorStop(0.35, `rgba(0,0,0,${0.6 * veil})`); pg.addColorStop(1, `rgba(0,0,0,${0.7 * veil})`); c.fillStyle = pg; c.fillRect(1080, -300, 820, H + 600);
      c.save(); c.beginPath(); c.rect(1090, 110, 520, 640); c.clip();
      const lastY = 430, y0 = 790 - cs * (790 - lastY + (DANH.length - 1) * 40);
      DANH.forEach((s, i) => { const y = y0 + i * 40; if (!s) return; const big = i < 2 || i === DANH.length - 1, a = clamp((y - 110) / 60, 0, 1) * clamp((750 - y) / 60, 0, 1); text(c, s, CX, y, big ? 30 : i % 3 === 0 ? 20 : 25, (big ? 0.92 : i % 3 === 0 ? 0.5 : 0.82) * veil * a, 'center', '255,236,210'); });
      c.restore(); }
    // hết nhạc: chỉ còn tiếng dế sân đình khẽ; danh đề dừng thì "cạch" nhả băng
    if (tn > 117.6 && tn < 131 && now > (KET.chirp || 0)) { KET.chirp = now + 700 + Math.random() * 2200; const ct = ac.currentTime, f = 4300 + Math.random() * 500; for (let i = 0; i < 3 + (Math.random() * 3 | 0); i++) nz(ct + i * 0.055, 0.03, 'bandpass', f, 18, 0.025, Math.random() * 1.2 - 0.6); }
    if (tn > 127.5 && !KET.end) { KET.end = true; const ct = ac.currentTime; FX.click(ct + 0.1, 1.2); FX.click(ct + 0.3, 0.8); nz(ct + 0.15, 0.2, 'lowpass', 300, 1, 0.8); }
    if (KET.end) { KET.black = Math.min(1, KET.black + dt / 3); c.fillStyle = `rgba(0,0,0,${KET.black * 0.85})`; c.fillRect(-300, -300, W + 600, H + 600); text(c, 'Hết cuộn băng số 2', W / 2, 450, 34, 0.9 * (1 - KET.black * 0.4), 'center', '255,236,210'); }
  },
};

// thử nhanh: ?phong=7 (bức thư rồi phần thưởng) · ?phong=8 (thẳng vào phần thưởng, &giay=… để nhảy tới giây)
const Q7 = new URLSearchParams(location.search);
if (Q7.get('phong') === '7' || Q7.get('phong') === '8') {
  const st0 = START;
  START = () => { st0(); INTRO.t = 9; setTimeout(() => { Object.assign(P1, { torch: true, calm: true, calmT: 9, done: true }); if (Q7.get('phong') === '7') startThu(); else { startKet(); const g = +Q7.get('giay') || 0; if (g && KET.el) { const sk = () => { KET.el.currentTime = g; }; if (KET.el.readyState >= 1) sk(); else KET.el.addEventListener('loadedmetadata', sk, { once: true }); KET.t0 = performance.now() - g * 1000; } } }, 300); };
}
