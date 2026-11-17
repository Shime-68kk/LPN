'use strict';
const DCT_AT = 3.85; // am/dct.mp3 cắt từ giây 50 của bài gốc (Erik, giọng La trưởng). Vào đúng khoảng lặng trước điệp khúc đầu "Dù cho tận thế…" (giây 53.85): em đàn xong thì ca sĩ hát lại chính câu ấy, chữ hiện như phụ đề

(() => {
  const X0 = 200;
  const KW = 120;
  const KY = 456;
  const KH = 264;
  const BW = 66;
  const BH = 166;
  const BY = 454;

  const Q11 = new URLSearchParams(location.search);
  const IS_THU = Q11.get('thu') === '1';
  const IS_DU = Q11.get('du') === '1';
  const IS_KET = Q11.get('ket') === '1';
  const IS_KETXEM = Q11.get('ketxem') === '1';
  const KET2_ON = !IS_THU || IS_KET || IS_KETXEM;
  const INIT_DU = IS_DU || IS_KETXEM;
  const KET2_KEY = 'lpn:ket2';
  const SCRIPT = "'Dancing Script', cursive";
  const CAL_FONT = "'Fraunces', serif";
  const UI_FONT = "'Be Vietnam Pro', sans-serif";

  function readKet2Lap() {
    if (IS_THU) return [];
    try {
      const raw = localStorage.getItem(KET2_KEY);
      if (!raw) return [];
      const d = JSON.parse(raw);
      return d && Array.isArray(d.lap) ? d.lap : [];
    } catch (_) {
      return [];
    }
  }

  function updateKet2Storage(fn) {
    try {
      let d = {};
      const raw = localStorage.getItem(KET2_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') d = parsed;
      }
      fn(d);
      localStorage.setItem(KET2_KEY, JSON.stringify(d));
    } catch (_) {}
  }

  function saveKet2Lap(id) {
    if (IS_THU) return;
    updateKet2Storage((d) => {
      const lap = Array.isArray(d.lap) ? d.lap.slice() : [];
      if (lap.indexOf(id) < 0) lap.push(id);
      d.lap = lap;
    });
  }

  function saveKet2Xong() {
    if (IS_THU && !IS_KET) return;
    updateKet2Storage((d) => {
      d.xong = true;
    });
    if (window.KET2 && window.KET2.st && typeof window.KET2.st === 'object') {
      window.KET2.st.xong = true;
    }
  }

  // 5 màu ấm, dịu cho 5 cao độ trong câu hát
  const COL = {
    'Mi4':   { rgb: '218,158,58',  rim: '246,198,108', glow: '252,208,118' },
    'Si4':   { rgb: '156,104,158', rim: '198,150,200', glow: '214,166,216' },
    'La4':   { rgb: '214,102,76',  rim: '245,146,118', glow: '250,156,126' },
    'Fa#5':  { rgb: '216,122,146', rim: '246,164,186', glow: '252,174,194' },
    'Đô#5':  { rgb: '116,166,104', rim: '158,206,144', glow: '168,216,154' }
  };
  const THU_ORDER = ['Mi4', 'La4', 'Si4', 'Đô#5', 'Fa#5'];
  const COL_RGB = {};
  for (const cid in COL) {
    COL_RGB[cid] = {
      rgb: COL[cid].rgb.split(',').map(Number),
      rim: COL[cid].rim.split(',').map(Number)
    };
  }
  function shadeRgb(arr, f) {
    return `rgb(${clamp(Math.round(arr[0] * f), 0, 255)},${clamp(Math.round(arr[1] * f), 0, 255)},${clamp(Math.round(arr[2] * f), 0, 255)})`;
  }

  // Câu nhạc 10 nốt theo đúng thứ tự và lời
  const MELODY = [
    { k: 'Mi4',   w: 'Dù' },
    { k: 'Si4',   w: 'cho' },
    { k: 'La4',   w: 'tận' },
    { k: 'Fa#5',  w: 'thế' },
    { k: 'Si4',   w: 'vẫn' },
    { k: 'Đô#5',  w: 'yêu' },
    { k: 'Đô#5',  w: 'em' },
    { k: 'La4',   w: 'luôn' },
    { k: 'Si4',   w: 'yêu' },
    { k: 'Si4',   w: 'em' }
  ];

  // 10 phím trắng từ Mi4 tới Sol5 (mỗi phím rộng 120px). Câu hát ở giọng La trưởng, đúng giọng bài gốc.
  const WHITES = [
    { id: 'Mi4',  freq: 329.63, wi: 0 },
    { id: 'Fa4',  freq: 349.23, wi: 1 },
    { id: 'Sol4', freq: 392.00, wi: 2 },
    { id: 'La4',  freq: 440.00, wi: 3 },
    { id: 'Si4',  freq: 493.88, wi: 4 },
    { id: 'Đô5',  freq: 523.25, wi: 5 },
    { id: 'Rê5',  freq: 587.33, wi: 6 },
    { id: 'Mi5',  freq: 659.26, wi: 7 },
    { id: 'Fa5',  freq: 698.46, wi: 8 },
    { id: 'Sol5', freq: 783.99, wi: 9 }
  ];

  // 6 phím đen đúng vị trí đàn thật trong quãng Mi4..Sol5
  const BLACKS = [
    { id: 'Fa#4',  freq: 369.99, gap: 2, dx: -6 },
    { id: 'Sol#4', freq: 415.30, gap: 3, dx: 0 },
    { id: 'La#4',  freq: 466.16, gap: 4, dx: 6 },
    { id: 'Đô#5',  freq: 554.37, gap: 6, dx: -5 },
    { id: 'Rê#5',  freq: 622.25, gap: 7, dx: 5 },
    { id: 'Fa#5',  freq: 739.99, gap: 9, dx: -6 }
  ];

  const KEYS = [];
  const KEY_BY_ID = {};
  for (const w of WHITES) {
    const x = X0 + w.wi * KW;
    const k = {
      id: w.id,
      freq: w.freq,
      black: false,
      wi: w.wi,
      x: x + 1.5,
      y: KY,
      w: KW - 3,
      h: KH,
      cx: x + KW * 0.5,
      pan: ((w.wi / 9) - 0.5) * 0.56,
      col: COL[w.id] || null,
      press: 0,
      glow: 0,
      drop: 0,
      dropAt: 0,
      snapDone: false
    };
    KEYS.push(k);
    KEY_BY_ID[k.id] = k;
  }
  for (const b of BLACKS) {
    const cx = X0 + b.gap * KW + b.dx;
    const k = {
      id: b.id,
      freq: b.freq,
      black: true,
      leftW: KEYS[b.gap - 1] || null,
      rightW: KEYS[b.gap] || null,
      x: cx - BW * 0.5,
      y: BY,
      w: BW,
      h: BH,
      cx,
      pan: (((cx - X0) / (10 * KW)) - 0.5) * 0.56,
      col: COL[b.id] || null,
      press: 0,
      glow: 0,
      drop: 0,
      dropAt: 0,
      snapDone: false
    };
    KEYS.push(k);
    KEY_BY_ID[k.id] = k;
  }

  const WHITE_KEYS = KEYS.filter(k => !k.black);
  const BLACK_KEYS = KEYS.filter(k => k.black);

  // Hạt bụi ấm nhỏ bay rất khẽ dưới ánh đèn bàn
  const DUST = [
    { x: 420, y: 215, r: 1.6, sp: 0.7, ph: 0.3 },
    { x: 560, y: 175, r: 1.3, sp: 0.9, ph: 1.9 },
    { x: 690, y: 270, r: 1.8, sp: 0.6, ph: 3.1 },
    { x: 840, y: 195, r: 1.4, sp: 0.8, ph: 4.4 },
    { x: 980, y: 245, r: 1.5, sp: 0.75, ph: 2.2 },
    { x: 760, y: 318, r: 1.3, sp: 0.85, ph: 5.1 },
    { x: 615, y: 350, r: 1.5, sp: 0.65, ph: 0.9 }
  ];

  let step = 0;
  let warm = 0;
  let errPulse = 0;
  let errAt = 0;
  let doneAt = 0;
  let songT0 = 0; // lúc bài gốc bắt đầu phát (performance.now)
  // giây (trong bài gốc) ca sĩ hát từng tiếng của câu, đo từ giọng hát tách riêng; bài phát từ giây SONG_T0
  const WORD_T = [54.15, 54.75, 55.25, 55.80, 56.30, 56.60, 56.95, 57.40, 57.62, 57.90];
  const SONG_T0 = 50 + DCT_AT;
  const KET2_WORD_DONE_AT = (WORD_T[WORD_T.length - 1] - SONG_T0) + 0.45;
  const KET2_WAIT_S = 10.0;
  const SONG_BASE_GAIN = 0.9;
  const SONG_DIM_GAIN = SONG_BASE_GAIN * Math.pow(10, -4 / 20);
  let heldKey = null;
  const dotFlash = new Float32Array(MELODY.length);

  let msgText = '';
  let msgAt = 0;
  let msgDur = 3;
  let pieceShakeAt = 0;
  let thuRunning = false;
  let thuTextW = 0;
  const thuTimers = [];

  const TAPE_ANGLE = { 'Mi4': -0.13, 'La4': 0.11, 'Si4': -0.09, 'Đô#5': 0.14, 'Fa#5': -0.12 };
  // 5 mảnh màu rời trên mặt bàn (?thu=1); tách qua laMauTrenBan() để sau này đổi sang BAG dễ dàng
  const DESK_PIECES = [
    { id: 'Đô#5', x: 280,  y: 771, len: 66, thick: 21, r: 5.5, rot: -0.17, black: true,  lift: 0 },
    { id: 'Si4',  x: 515,  y: 776, len: 98, thick: 26, r: 7,   rot:  0.12, black: false, lift: 0 },
    { id: 'Fa#5', x: 795,  y: 769, len: 66, thick: 21, r: 5.5, rot: -0.09, black: true,  lift: 0 },
    { id: 'Mi4',  x: 1055, y: 777, len: 98, thick: 26, r: 7,   rot:  0.15, black: false, lift: 0 },
    { id: 'La4',  x: 1315, y: 771, len: 98, thick: 26, r: 7,   rot: -0.13, black: false, lift: 0 }
  ];

  function laMauTrenBan() {
    return IS_THU;
  }
  function showMsg(txt, dur = 3) {
    msgText = txt;
    msgAt = performance.now();
    msgDur = dur;
  }

  function hasKey(k) {
    return !k.col || !!(SC.dan && SC.dan.co && SC.dan.co[k.id]);
  }
  function isKeyReady(k) {
    return hasKey(k) && !(k.drop > 0);
  }
  function hasAllKeys() {
    if (!SC.dan || !SC.dan.co) return false;
    for (const cid in COL) {
      if (!SC.dan.co[cid]) return false;
    }
    return true;
  }
  function clearThu() {
    while (thuTimers.length) clearTimeout(thuTimers.pop());
    thuRunning = false;
  }

  // Âm thanh bài gốc
  let songArr = null;
  let songBuf = null;
  let songLoading = false;
  let songDecodeLock = false;
  let songTimer = 0;
  let songWantPlay = false;
  let songStarted = false;
  let songSrc = null;
  let songGain = null;
  let songEnded = false;
  // ---- Hoạt cảnh "Đường của năm phím" (bài 48): khung thời gian theo giây của am/dct.mp3 ----
  const K2_BAT_DAU = 34;   // cuối điệp khúc 1: đèn bàn tắt
  const K2_PHIM = 48;      // ket2phim.js vẽ từ đây
  const K2_LICH = 166;     // trang lịch
  const TUA = Math.max(0, parseFloat(Q11.get('tua')) || 0);
  let tuaDaLam = false;
  // S = giây của file dct.mp3 (songT0 ứng với vị trí DCT_AT)
  const ket2S = () => (songStarted && songT0 !== 0 ? DCT_AT + (performance.now() - songT0) / 1000 : (ket2 && ket2.on ? K2_BAT_DAU + ket2.t : -1));
  window.KET2_T = () => (songStarted && songT0 !== 0 ? DCT_AT + (performance.now() - songT0) / 1000 : -1);
  window.KET2_CANH = {
    // vẽ nguyên một cảnh có sẵn để hoạt cảnh mượn hình (không nhãn, không chữ, không tiếng)
    ve(c, ten, now, dt) {
      const sc = SC[ten]; if (!sc || !sc.draw) return;
      const ga = c.globalAlpha;
      window.KET2_PHIM_DANG = true;
      try { c.save(); setT(c); sc.draw(c, now, 0); } catch (e) { /* bỏ qua */ }
      finally { c.restore(); window.KET2_PHIM_DANG = false; c.globalAlpha = ga; setT(c); }
    },
    diem: { 'Si4': ['p502sau', 327, 469], 'La4': ['gac', 844, 385], 'Đô#5': ['sanxe', 827, 476], 'Fa#5': ['santhuong', 1042, 592] },
    mau: { 'Mi4': '218,158,58', 'Si4': '156,104,158', 'La4': '214,102,76', 'Đô#5': '116,166,104', 'Fa#5': '216,122,146' },
    phim: { 'Mi4': [260, 600], 'La4': [620, 600], 'Si4': [740, 600], 'Đô#5': [918, 530], 'Fa#5': [1276, 530] },
  };

  // Lớp vẽ tĩnh & sprite ánh sáng tạo sẵn (không cấp phát mỗi khung hình)
  let bgDark = null;
  let bgWarm = null;
  let bgW = 0;
  let bgH = 0;
  let warmGlowSpr = null;
  const colGlowSpr = {};

  function makeBuf(w, h) {
    const [cv2, g2] = layer();
    cv2.width = w;
    cv2.height = h;
    return [cv2, g2];
  }

  function makeGlowSprite(rgb, size = 128) {
    const [cv2, g] = makeBuf(size, size);
    const half = size * 0.5;
    const gr = g.createRadialGradient(half, half, 0, half, half, half);
    gr.addColorStop(0, `rgba(${rgb},0.85)`);
    gr.addColorStop(0.32, `rgba(${rgb},0.38)`);
    gr.addColorStop(0.68, `rgba(${rgb},0.1)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, size, size);
    return cv2;
  }

  function ensureSprites() {
    if (!warmGlowSpr) warmGlowSpr = makeGlowSprite('255,204,132', 160);
    for (const k in COL) {
      if (!colGlowSpr[k]) colGlowSpr[k] = makeGlowSprite(COL[k].glow, 128);
    }
  }

  function drawDeskLamp(c, bright) {
    // Bóng chân đèn trên mặt bàn phía sau góc trái đàn
    c.fillStyle = `rgba(0,0,0,${0.48 - bright * 0.08})`;
    c.beginPath();
    c.ellipse(174, 376, 52, 16, 0, 0, Math.PI * 2);
    c.fill();

    // Đế đèn tròn nặng
    const baseG = c.createLinearGradient(128, 354, 214, 380);
    baseG.addColorStop(0, bright > 0.5 ? '#3a3430' : '#262324');
    baseG.addColorStop(1, '#121012');
    c.fillStyle = baseG;
    c.beginPath();
    c.ellipse(172, 369, 44, 13, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = `rgba(255,212,150,${0.12 + bright * 0.14})`;
    c.beginPath();
    c.ellipse(174, 364, 36, 9, 0, Math.PI * 1.05, Math.PI * 1.95);
    c.fill();

    // Cổ khớp đồng dưới chân đèn
    c.fillStyle = bright > 0.5 ? '#7c6244' : '#584632';
    roundRect(c, 164, 344, 15, 22, 4);
    c.fill();

    // Cần đèn đôi gập mềm
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = '#18171c';
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(171, 346);
    c.lineTo(156, 206);
    c.lineTo(278, 126);
    c.stroke();

    // Viền sáng ấm dọc cạnh phải của cần đèn
    c.strokeStyle = `rgba(255,208,142,${0.22 + bright * 0.18})`;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(174, 343);
    c.lineTo(160, 208);
    c.lineTo(278, 130);
    c.stroke();

    // Khớp gập giữa cần
    c.fillStyle = bright > 0.5 ? '#8e6e48' : '#655038';
    c.beginPath();
    c.arc(156, 206, 8.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(278, 126, 7.5, 0, Math.PI * 2);
    c.fill();

    // Chụp đèn hướng chéo về giá nhạc và bàn phím
    c.save();
    c.translate(306, 146);
    c.rotate(0.56);

    // Ánh sáng bên trong miệng chụp
    const mouthG = c.createRadialGradient(20, 4, 2, 18, 4, 42);
    mouthG.addColorStop(0, `rgba(255,244,210,${0.95})`);
    mouthG.addColorStop(0.55, `rgba(255,198,118,${0.72 + bright * 0.18})`);
    mouthG.addColorStop(1, 'rgba(210,128,62,0)');
    c.fillStyle = mouthG;
    c.beginPath();
    c.ellipse(18, 2, 18, 40, 0, 0, Math.PI * 2);
    c.fill();

    // Thân chụp đèn kim loại tối
    const hoodG = c.createLinearGradient(-44, -22, 26, 36);
    hoodG.addColorStop(0, '#363236');
    hoodG.addColorStop(0.45, '#201e23');
    hoodG.addColorStop(1, '#100f14');
    c.fillStyle = hoodG;
    c.beginPath();
    c.moveTo(-42, -16);
    c.quadraticCurveTo(-24, -40, 20, -40);
    c.lineTo(24, 40);
    c.quadraticCurveTo(-24, 40, -42, 16);
    c.closePath();
    c.fill();

    // Đuôi chụp
    c.fillStyle = bright > 0.5 ? '#886945' : '#604b33';
    roundRect(c, -48, -14, 14, 28, 5);
    c.fill();

    // Viền sáng ấm quanh mép chụp đèn
    c.strokeStyle = `rgba(255,216,154,${0.38 + bright * 0.28})`;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(22, 0, 8.5, 39.5, 0, -1.45, 1.45);
    c.stroke();

    c.restore();
  }

  function paintRoomLayer(c, bright) {
    // Tường đêm phía sau (tràn lề để không hở viền trên mọi tỉ lệ màn)
    const wall = c.createLinearGradient(0, -100, 0, 355);
    wall.addColorStop(0, bright > 0.5 ? '#151520' : '#090b11');
    wall.addColorStop(1, bright > 0.5 ? '#201c22' : '#101118');
    c.fillStyle = wall;
    c.fillRect(-300, -300, W + 600, 655);

    // Hắt sáng ấm từ đèn bàn lên tường phía trái-giữa
    const wGlow = c.createRadialGradient(480, 240, 20, 620, 250, 620);
    wGlow.addColorStop(0, `rgba(225,154,84,${0.12 + bright * 0.24})`);
    wGlow.addColorStop(0.45, `rgba(176,112,62,${0.05 + bright * 0.14})`);
    wGlow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = wGlow;
    c.fillRect(-300, -300, W + 600, 655);

    // Mặt bàn tối (gỗ trầm mịn)
    const desk = c.createLinearGradient(0, 336, 0, H);
    desk.addColorStop(0, bright > 0.5 ? '#261f1b' : '#151213');
    desk.addColorStop(0.48, bright > 0.5 ? '#1c1715' : '#0f0d0f');
    desk.addColorStop(1, bright > 0.5 ? '#131011' : '#080709');
    c.fillStyle = desk;
    c.fillRect(-300, 336, W + 600, H - 36);

    // Mép sau bàn bắt sáng rất nhẹ
    c.fillStyle = `rgba(235,186,128,${0.05 + bright * 0.08})`;
    c.fillRect(-300, 336, W + 600, 2.5);

    // Vân gỗ tinh tế trên mặt bàn (PRNG cục bộ cố định)
    let r = 1973;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    c.strokeStyle = `rgba(255,214,168,${0.02 + bright * 0.025})`;
    c.lineWidth = 1.2;
    for (let i = 0; i < 24; i++) {
      const y = 348 + i * 23 + rnd() * 9;
      c.beginPath();
      c.moveTo(-300, y);
      c.bezierCurveTo(W * 0.33, y + (rnd() - 0.5) * 6, W * 0.66, y + (rnd() - 0.5) * 6, W + 300, y);
      c.stroke();
    }

    // Quầng sáng ấm của đèn bàn phủ xuống bàn, giá nhạc và đàn
    const pool = c.createRadialGradient(730, 380, 30, 760, 410, 680);
    pool.addColorStop(0, `rgba(255,198,124,${0.18 + bright * 0.24})`);
    pool.addColorStop(0.5, `rgba(220,146,78,${0.08 + bright * 0.14})`);
    pool.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = pool;
    c.fillRect(0, 60, W, H - 60);

    // Bóng đổ mềm dưới thân đàn xuống mặt bàn
    for (let i = 0; i < 4; i++) {
      c.fillStyle = `rgba(0,0,0,${0.26 - i * 0.05})`;
      roundRect(c, 152 - i * 8, 728 - i * 2, 1296 + i * 16, 28 + i * 8, 16);
      c.fill();
    }

    // Cây đàn điện tử dài thân đen (không ghi tên hãng)
    const bodyG = c.createLinearGradient(0, 340, 0, 748);
    bodyG.addColorStop(0, bright > 0.5 ? '#2b2d36' : '#1b1c23');
    bodyG.addColorStop(0.18, bright > 0.5 ? '#1c1d24' : '#121318');
    bodyG.addColorStop(0.92, '#0d0e13');
    bodyG.addColorStop(1, '#08090c');
    c.fillStyle = bodyG;
    roundRect(c, 166, 340, 1268, 408, 16);
    c.fill();

    // Đường bo cạnh trên thân đàn bắt ánh đèn ấm
    c.strokeStyle = `rgba(255,214,160,${0.12 + bright * 0.16})`;
    c.lineWidth = 1.6;
    roundRect(c, 167, 341, 1266, 406, 15);
    c.stroke();

    // Má đàn hai bên (trái & phải)
    const cheekL = c.createLinearGradient(166, 342, 200, 342);
    cheekL.addColorStop(0, bright > 0.5 ? '#252328' : '#15151a');
    cheekL.addColorStop(1, '#101116');
    c.fillStyle = cheekL;
    roundRect(c, 168, 344, 30, 396, 10);
    c.fill();

    const cheekR = c.createLinearGradient(1402, 342, 1434, 342);
    cheekR.addColorStop(0, '#101116');
    cheekR.addColorStop(1, bright > 0.5 ? '#201f25' : '#131419');
    c.fillStyle = cheekR;
    roundRect(c, 1402, 344, 30, 396, 10);
    c.fill();

    // Khay phím lõm vào bên trong thân đàn
    c.fillStyle = '#090a0e';
    roundRect(c, 196, 446, 1208, 282, 5);
    c.fill();

    // Viền nỉ đỏ trầm ngay trên đầu dãy phím
    const feltG = c.createLinearGradient(200, 449, 200, 456);
    feltG.addColorStop(0, '#3a1416');
    feltG.addColorStop(0.5, bright > 0.5 ? '#75292d' : '#581f22');
    feltG.addColorStop(1, '#260c0e');
    c.fillStyle = feltG;
    c.fillRect(200, 449, 1200, 7);

    // Lưới loa chìm hai bên mặt đàn (rất mảnh, tối)
    c.fillStyle = 'rgba(6,7,10,0.82)';
    for (let gx = 290; gx <= 438; gx += 12) {
      for (let gy = 360; gy <= 394; gy += 9) {
        c.beginPath();
        c.arc(gx, gy, 1.7, 0, Math.PI * 2);
        c.fill();
      }
    }
    for (let gx = 1162; gx <= 1354; gx += 12) {
      for (let gy = 360; gy <= 394; gy += 9) {
        c.beginPath();
        c.arc(gx, gy, 1.7, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Cụm nút nguồn & thanh âm lượng tối giản bên trái (không chữ, không logo)
    c.fillStyle = '#0b0c10';
    roundRect(c, 224, 360, 46, 36, 6);
    c.fill();
    c.fillStyle = '#d86652';
    c.beginPath();
    c.arc(236, 378, 3.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#181a22';
    roundRect(c, 248, 369, 14, 18, 3);
    c.fill();
    c.fillStyle = '#383a46';
    c.fillRect(250, 374, 10, 4);

    // Mép gờ mặt trên đàn dưới giá nhạc (tuyệt đối không ghi tên hãng)
    c.fillStyle = `rgba(255,218,168,${0.05 + bright * 0.05})`;
    c.fillRect(202, 434, 1196, 1.2);

    // Giá nhạc tối đặt phía sau giữa đàn
    c.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(c, 458, 109, 684, 236, 12);
    c.fill();

    const standG = c.createLinearGradient(462, 102, 1138, 338);
    standG.addColorStop(0, bright > 0.5 ? '#262730' : '#181920');
    standG.addColorStop(1, '#101116');
    c.fillStyle = standG;
    roundRect(c, 462, 102, 676, 236, 11);
    c.fill();
    c.strokeStyle = `rgba(255,212,154,${0.12 + bright * 0.14})`;
    c.lineWidth = 1.4;
    roundRect(c, 462, 102, 676, 236, 11);
    c.stroke();

    // Thanh đỡ đáy giá nhạc
    const ledgeG = c.createLinearGradient(0, 326, 0, 342);
    ledgeG.addColorStop(0, bright > 0.5 ? '#353742' : '#24252d');
    ledgeG.addColorStop(1, '#121318');
    c.fillStyle = ledgeG;
    roundRect(c, 454, 326, 692, 14, 5);
    c.fill();

    // Vẽ đèn bàn lên lớp tĩnh
    drawDeskLamp(c, bright);

    // Phủ ánh sáng nhẹ khắp phòng khi hoàn thành
    if (bright > 0.5) {
      const roomLift = c.createRadialGradient(W * 0.5, H * 0.44, 60, W * 0.5, H * 0.48, 920);
      roomLift.addColorStop(0, 'rgba(255,214,154,0.16)');
      roomLift.addColorStop(0.55, 'rgba(240,180,110,0.08)');
      roomLift.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = roomLift;
      c.fillRect(-300, -300, W + 600, H + 600);
    }

    vignette(c, bright > 0.5 ? 0.56 : 0.84);
  }

  let calC = null;
  let calW = 0;
  let calH = 0;

  function bake() {
    if (!cv.width || !cv.height) return;
    ensureSprites();

    const [c0, g0] = makeBuf(cv.width, cv.height);
    setT(g0);
    paintRoomLayer(g0, 0);
    bgDark = c0;

    const [c1, g1] = makeBuf(cv.width, cv.height);
    setT(g1);
    paintRoomLayer(g1, 1);
    bgWarm = c1;

    bgW = cv.width;
    bgH = cv.height;
    calW = 0;
  }

  function drawSheet(c, now, ba, wEase) {
    const sx = 486;
    const sy = 122;
    const sw = 628;
    const sh = 200;

    c.save();
    c.translate(sx + sw * 0.5, sy + sh * 0.5);
    c.rotate(-0.006);
    c.translate(-(sx + sw * 0.5), -(sy + sh * 0.5));

    // Bóng tờ giấy trên giá đàn
    c.fillStyle = `rgba(0,0,0,${0.34 - wEase * 0.08})`;
    roundRect(c, sx - 2, sy + 5, sw + 4, sh + 2, 5);
    c.fill();

    // Tờ nhạc giấy kem ấm (dần ấm sáng lên khi xong câu)
    const pg = c.createLinearGradient(sx, sy, sx + sw, sy + sh);
    if (wEase > 0.01) {
      const r0 = Math.round(lerp(236, 250, wEase));
      const g0 = Math.round(lerp(222, 236, wEase));
      const b0 = Math.round(lerp(194, 206, wEase));
      const r1 = Math.round(lerp(218, 240, wEase));
      const g1 = Math.round(lerp(200, 218, wEase));
      const b1 = Math.round(lerp(168, 180, wEase));
      pg.addColorStop(0, `rgb(${r0},${g0},${b0})`);
      pg.addColorStop(1, `rgb(${r1},${g1},${b1})`);
    } else {
      pg.addColorStop(0, '#ecdec2');
      pg.addColorStop(1, '#dac8a8');
    }
    c.fillStyle = pg;
    roundRect(c, sx, sy, sw, sh, 4);
    c.fill();

    // Ánh đèn ấm rơi chéo từ góc trái trên tờ nhạc
    const shLight = c.createRadialGradient(sx + 130, sy + 50, 10, sx + 220, sy + 95, 420);
    shLight.addColorStop(0, `rgba(255,244,218,${0.32 + wEase * 0.28})`);
    shLight.addColorStop(1, 'rgba(255,220,160,0)');
    c.fillStyle = shLight;
    roundRect(c, sx, sy, sw, sh, 4);
    c.fill();

    // Đường mép giấy tinh tế (tuyệt đối không vẽ khuông nhạc)
    c.strokeStyle = `rgba(116,92,64,${0.2 + wEase * 0.12})`;
    c.lineWidth = 1.2;
    roundRect(c, sx, sy, sw, sh, 4);
    c.stroke();

    // 1 hàng 10 chấm tròn màu và tiếng hát bên dưới
    const startX = 530;
    const dx = 60;
    const dotY = 198;
    const txtY = 250;

    let pulseVal = 0;
    if (errPulse > 0.01 && step < MELODY.length) {
      pulseVal = (0.5 + 0.5 * Math.sin((now - errAt) * 0.013)) * errPulse;
    }

    for (let i = 0; i < MELODY.length; i++) {
      const m = MELODY[i];
      const col = COL[m.k];
      const x = startX + i * dx;
      const hit = i < step;
      const isCur = i === step && step < MELODY.length;
      const fl = dotFlash[i];

      // Hào quang cho chấm đã đánh đúng hoặc đang nhấp nháy gợi ý
      const halo = hit ? (0.34 + wEase * 0.26 + fl * 0.45) : (isCur ? pulseVal * 0.58 : 0);
      if (halo > 0.01 && colGlowSpr[m.k]) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = ba * Math.min(1, halo);
        const rad = hit ? (28 + fl * 12) : (26 + pulseVal * 10);
        c.drawImage(colGlowSpr[m.k], x - rad, dotY - rad, rad * 2, rad * 2);
        c.restore();
      }

      // Vòng nhấp nháy nhẹ quanh chấm kế tiếp khi bấm sai nốt
      if (isCur && pulseVal > 0.04) {
        c.strokeStyle = `rgba(${col.rgb},${pulseVal * 0.85})`;
        c.lineWidth = 2.4;
        c.beginPath();
        c.arc(x, dotY, 17 + pulseVal * 6, 0, Math.PI * 2);
        c.stroke();
      }

      // Chấm tròn màu
      const r = hit ? (14.5 + fl * 2.5) : (isCur ? 13.5 + pulseVal * 2.2 : 12.5);
      const fillAlpha = hit ? 1 : (isCur ? (0.76 + pulseVal * 0.24) : 0.54);
      c.fillStyle = `rgba(${col.rgb},${fillAlpha})`;
      c.beginPath();
      c.arc(x, dotY, r, 0, Math.PI * 2);
      c.fill();

      // Điểm sáng nhỏ bên trong chấm khi nốt đó đã sáng hẳn
      if (hit) {
        c.fillStyle = `rgba(${col.rim},${0.55 + fl * 0.35 + wEase * 0.15})`;
        c.beginPath();
        c.arc(x - 3, dotY - 3, r * 0.42, 0, Math.PI * 2);
        c.fill();
      }

      c.strokeStyle = hit
        ? `rgba(48,30,18,0.45)`
        : `rgba(82,62,42,${isCur ? 0.36 : 0.22})`;
      c.lineWidth = hit ? 1.5 : 1.1;
      c.beginPath();
      c.arc(x, dotY, r, 0, Math.PI * 2);
      c.stroke();

      // Chữ của câu hát GIẤU tới khi bài gốc vang lên (giữ bất ngờ): mỗi tiếng hiện đúng lúc ca sĩ hát tiếng đó
      const wt = songT0 ? (now - songT0) / 1000 - (WORD_T[i] - SONG_T0) : -1;
      if (wt > 0) {
        const a = Math.min(1, wt / 0.45);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = `700 31px ${HAND}`;
        c.fillStyle = `rgba(28,16,8,${0.96 * a})`;
        c.fillText(m.w, x, txtY + (1 - a) * 6);
        c.strokeStyle = `rgba(28,16,8,${0.55 * a})`;
        c.lineWidth = 0.75;
        c.strokeText(m.w, x, txtY + (1 - a) * 6);
      }
    }

    c.restore();
  }

  function drawWhiteKey(c, k, ba, wEase) {
    const dip = k.press * 7;
    const x = k.x;
    const y = k.y + dip;
    const w = k.w;
    const h = k.h - dip;
    const lip = 15;

    // Mặt hông trước phím trắng (lún xuống khi bấm)
    c.fillStyle = '#9c9385';
    roundRect(c, x, y + h - lip - 4, w, lip + 4, 7);
    c.fill();

    // Mặt trên phím trắng (ngà ấm, hơi sáng lên khi chạm hoặc khi đèn sáng dần)
    const g = c.createLinearGradient(x, y, x, y + h - lip);
    const lgt = k.glow * 0.14 + wEase * 0.08;
    const topR = Math.min(255, Math.round(238 + lgt * 17));
    const topG = Math.min(252, Math.round(230 + lgt * 18));
    const topB = Math.min(244, Math.round(215 + lgt * 18));
    const botR = Math.min(252, Math.round(224 + lgt * 22));
    const botG = Math.min(246, Math.round(214 + lgt * 22));
    const botB = Math.min(232, Math.round(196 + lgt * 20));
    g.addColorStop(0, `rgb(${topR},${topG},${topB})`);
    g.addColorStop(0.75, `rgb(${botR},${botG},${botB})`);
    g.addColorStop(1, '#d3c8b4');
    c.fillStyle = g;
    roundRect(c, x, y, w, h - lip + 4, 6);
    c.fill();
    if (k.col) { // phím màu (mảnh ghép em tìm được): cả thân một màu, sáng lên khi chạm
      const cg = c.createLinearGradient(x, y, x, y + h - lip);
      cg.addColorStop(0, `rgba(${k.col.rim},${0.9})`);
      cg.addColorStop(0.8, `rgba(${k.col.rgb},${0.92})`);
      cg.addColorStop(1, `rgba(${k.col.rgb},1)`);
      c.fillStyle = cg; roundRect(c, x, y, w, h - lip + 4, 6); c.fill();
      if (k.glow > 0.01) { c.fillStyle = `rgba(255,248,232,${0.35 * k.glow})`; roundRect(c, x, y, w, h - lip + 4, 6); c.fill(); }
    }

    // Bóng đổ rất mảnh từ thanh nỉ đỏ trên đầu phím
    const sh = c.createLinearGradient(0, k.y, 0, k.y + 18);
    sh.addColorStop(0, `rgba(12,10,14,${0.32 + k.press * 0.25})`);
    sh.addColorStop(1, 'rgba(12,10,14,0)');
    c.fillStyle = sh;
    c.fillRect(x, y, w, 18);

    // Ánh sáng nhẹ trên phím khi chạm
    if (k.glow > 0.01) {
      const rgb = k.col ? k.col.glow : '255,224,168';
      const tg = c.createLinearGradient(x, y + h * 0.35, x, y + h - lip);
      tg.addColorStop(0, `rgba(${rgb},0)`);
      tg.addColorStop(1, `rgba(${rgb},${k.glow * 0.34})`);
      c.fillStyle = tg;
      roundRect(c, x + 2, y, w - 4, h - lip + 2, 5);
      c.fill();
    }

    // Dấu màu nhỏ trên phím có trong câu hát
    if (false && k.col) { // chấm màu cũ, giờ cả thân phím có màu
      const mx = k.cx;
      const my = y + h - lip - 34;
      if (k.glow > 0.02 && colGlowSpr[k.id]) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = ba * k.glow * 0.72;
        c.drawImage(colGlowSpr[k.id], mx - 30, my - 30, 60, 60);
        c.restore();
      }
      c.fillStyle = `rgba(${k.col.rgb},${0.92 + k.glow * 0.08})`;
      c.beginPath();
      c.arc(mx, my, 9.5 + k.press * 1.2, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(54,38,24,0.38)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(mx, my, 9.5 + k.press * 1.2, 0, Math.PI * 2);
      c.stroke();
    }
  }

  function isSlotOpen(k) {
    return !hasKey(k) || k.drop > 0;
  }

  function drawWhiteSlot(c, k, wi, wEase) {
    const prevOpen = wi > 0 && isSlotOpen(WHITE_KEYS[wi - 1]);
    const nextOpen = wi < WHITE_KEYS.length - 1 && isSlotOpen(WHITE_KEYS[wi + 1]);
    const x = k.x - (prevOpen ? 1.5 : 0);
    const y = k.y;
    const w = k.w + (prevOpen ? 1.5 : 0) + (nextOpen ? 1.5 : 0);
    const h = k.h + 2;

    // Lòng đàn tối bên dưới khe phím trắng
    const bg = c.createLinearGradient(0, y, 0, y + h);
    bg.addColorStop(0, '#05060a');
    bg.addColorStop(0.18, '#08090f');
    bg.addColorStop(0.84, wEase > 0.4 ? '#11121a' : '#0c0d14');
    bg.addColorStop(1, '#07080c');
    c.fillStyle = bg;
    roundRect(c, x, y, w, h, 3);
    c.fill();

    // Thanh đỡ ngang bên trong lòng đàn
    c.fillStyle = '#12141c';
    c.fillRect(x + 2, y + 18, w - 4, 12);
    c.fillStyle = `rgba(255,216,168,${0.035 + wEase * 0.035})`;
    c.fillRect(x + 2, y + 30, w - 4, 1);

    // Rãnh dẫn và chốt ngàm giữ phím ở giữa khe
    const cx = k.cx;
    c.fillStyle = '#13151e';
    roundRect(c, cx - 5, y + 58, 10, 96, 3);
    c.fill();
    c.fillStyle = '#25262e';
    roundRect(c, cx - 2.5, y + 90, 5, 22, 2);
    c.fill();
    c.fillStyle = `rgba(255,216,168,${0.12 + wEase * 0.08})`;
    c.fillRect(cx - 2.5, y + 91, 1, 20);

    // Vách ngăn mảnh giữa hai khe liền nhau (vd La4 - Si4 cùng trống)
    if (nextOpen) {
      const rx = k.x + k.w + 0.3;
      c.fillStyle = '#14161f';
      c.fillRect(rx, y + 14, 2.4, h - 22);
      c.fillStyle = `rgba(255,216,168,${0.04 + wEase * 0.04})`;
      c.fillRect(rx, y + 14, 0.9, h - 22);
    }

    // Mép trước hốc phím
    c.fillStyle = '#0f1017';
    c.fillRect(x + 1, y + h - 9, w - 2, 9);
    c.fillStyle = `rgba(255,214,168,${0.05 + wEase * 0.05})`;
    c.fillRect(x + 1, y + h - 1, w - 2, 1);

    // Bóng đổ từ thanh nỉ đỏ phía trên và mép trái xuống lòng đàn
    const topSh = c.createLinearGradient(0, y, 0, y + 24);
    topSh.addColorStop(0, 'rgba(2,2,4,0.75)');
    topSh.addColorStop(1, 'rgba(2,2,4,0)');
    c.fillStyle = topSh;
    c.fillRect(x, y, w, 24);

    if (!prevOpen) {
      const sideSh = c.createLinearGradient(k.x, 0, k.x + 22, 0);
      sideSh.addColorStop(0, 'rgba(2,2,5,0.44)');
      sideSh.addColorStop(1, 'rgba(2,2,5,0)');
      c.fillStyle = sideSh;
      c.fillRect(k.x, y, 22, h);
    }

    // Một chút bụi mỏng đọng ở góc và đáy khe
    const dustFilm = c.createRadialGradient(cx, y + h - 24, 4, cx, y + h - 24, 52);
    dustFilm.addColorStop(0, `rgba(178,166,148,${0.055 + wEase * 0.035})`);
    dustFilm.addColorStop(1, 'rgba(178,166,148,0)');
    c.fillStyle = dustFilm;
    c.fillRect(x + 4, y + h - 76, w - 8, 72);

    const seed = wi * 41 + 7;
    for (let j = 0; j < 6; j++) {
      const rx = ((seed + j * 37) % 86) / 100 + 0.07;
      const ry = ((seed + j * 59) % 74) / 100 + 0.16;
      const dr = 0.9 + ((seed + j * 13) % 7) * 0.1;
      const da = (0.14 + ((seed + j * 19) % 12) * 0.012) * (0.8 + wEase * 0.35);
      c.fillStyle = `rgba(202,190,172,${da})`;
      c.beginPath();
      c.arc(k.x + k.w * rx, y + k.h * ry, dr, 0, Math.PI * 2);
      c.fill();
    }

    if (k.col) {
      drawSlotTape(c, k, y + h - 38, 48, 20, wEase);
    }
  }

  function drawWhiteSlotWalls(c, k, wi, wEase) {
    const lip = 15;
    const prevOpen = wi > 0 && isSlotOpen(WHITE_KEYS[wi - 1]);
    const nextOpen = wi < WHITE_KEYS.length - 1 && isSlotOpen(WHITE_KEYS[wi + 1]);

    // Mép trái khe (mặt hông phải của phím bên trái, khuất đèn nên tối hơn)
    if (!prevOpen) {
      if (wi === 0) {
        const wg = c.createLinearGradient(k.x - 2, 0, k.x + 4, 0);
        wg.addColorStop(0, '#1d1e26');
        wg.addColorStop(1, '#0d0e13');
        c.fillStyle = wg;
        c.fillRect(k.x - 2, k.y + 1, 5.5, k.h - 2);
        c.fillStyle = `rgba(255,214,164,${0.07 + wEase * 0.06})`;
        c.fillRect(k.x + 3, k.y + 2, 1, k.h - 4);
      } else {
        const lk = WHITE_KEYS[wi - 1];
        const wy = lk.y + lk.press * 7 + 1;
        const wh = lk.h - lk.press * 7 - 2;
        const wx = lk.x + lk.w;
        const lg = c.createLinearGradient(0, wy, 0, wy + wh);
        if (lk.col) {
          const rgb = COL_RGB[lk.id].rgb;
          lg.addColorStop(0, shadeRgb(rgb, 0.56));
          lg.addColorStop(0.85, shadeRgb(rgb, 0.42));
          lg.addColorStop(1, shadeRgb(rgb, 0.30));
        } else {
          lg.addColorStop(0, '#968d7f');
          lg.addColorStop(0.85, '#726b5f');
          lg.addColorStop(1, '#585249');
        }
        c.fillStyle = lg;
        c.fillRect(wx - 0.5, wy, 5.5, wh);
        c.fillStyle = 'rgba(0,0,0,0.22)';
        c.fillRect(wx - 0.5, wy + wh - lip, 5.5, lip);
        c.fillStyle = `rgba(255,244,224,${0.12 + wEase * 0.08})`;
        c.fillRect(wx + 4, wy + 1, 1, wh - lip);
      }
    }

    // Mép phải khe (mặt hông trái của phím bên phải, hướng về đèn bàn nên sáng ấm)
    if (!nextOpen && wi < WHITE_KEYS.length - 1) {
      const rk = WHITE_KEYS[wi + 1];
      const wy = rk.y + rk.press * 7 + 1;
      const wh = rk.h - rk.press * 7 - 2;
      const wx = rk.x - 5;
      const rg = c.createLinearGradient(0, wy, 0, wy + wh);
      if (rk.col) {
        const rgb = COL_RGB[rk.id].rgb;
        const rim = COL_RGB[rk.id].rim;
        rg.addColorStop(0, shadeRgb(rim, 0.84));
        rg.addColorStop(0.85, shadeRgb(rgb, 0.70));
        rg.addColorStop(1, shadeRgb(rgb, 0.52));
      } else {
        rg.addColorStop(0, '#dcd2c0');
        rg.addColorStop(0.85, '#b6ab99');
        rg.addColorStop(1, '#8c8374');
      }
      c.fillStyle = rg;
      c.fillRect(wx, wy, 5.5, wh);
      c.fillStyle = 'rgba(0,0,0,0.16)';
      c.fillRect(wx, wy + wh - lip, 5.5, lip);
      c.fillStyle = `rgba(255,244,224,${0.30 + wEase * 0.14})`;
      c.fillRect(wx, wy + 1, 1.1, wh - lip);
    }
  }

  function traceTapePath(c, hw, hh, seed) {
    const j = (n) => (((seed * (n + 3) * 37) % 11) - 5) * 0.28;
    c.beginPath();
    c.moveTo(-hw + j(1), -hh);
    c.lineTo(hw + j(2), -hh);
    c.lineTo(hw - 1.2 + j(3), -hh * 0.32);
    c.lineTo(hw + 0.9 + j(4), hh * 0.34);
    c.lineTo(hw + j(5), hh);
    c.lineTo(-hw + j(6), hh);
    c.lineTo(-hw + 1.1 + j(7), hh * 0.3);
    c.lineTo(-hw - 0.9 + j(8), -hh * 0.35);
    c.closePath();
  }

  function drawSlotTape(c, k, yCenter, wTape, hTape, wEase) {
    if (!k.col || !COL_RGB[k.id]) return;
    const hw = wTape * 0.5;
    const hh = hTape * 0.5;
    const ang = TAPE_ANGLE[k.id] || -0.1;
    const seed = Math.round(k.cx) + (k.black ? 17 : 5);
    const rgb = COL_RGB[k.id].rgb;
    const rim = COL_RGB[k.id].rim;

    c.save();
    c.translate(k.cx, yCenter);
    c.rotate(ang);

    // Bóng đổ rất mảnh dưới mẩu băng dính giấy
    c.save();
    c.translate(1.2, 2.2);
    traceTapePath(c, hw, hh, seed);
    c.fillStyle = 'rgba(0,0,0,0.44)';
    c.fill();
    c.restore();

    // Thân mẩu băng dính giấy đúng màu phím bị mất
    const tg = c.createLinearGradient(-hw, -hh, hw, hh);
    tg.addColorStop(0, shadeRgb(rim, 0.96 + wEase * 0.04));
    tg.addColorStop(0.55, shadeRgb(rgb, 0.95 + wEase * 0.05));
    tg.addColorStop(1, shadeRgb(rgb, 0.84 + wEase * 0.06));
    traceTapePath(c, hw, hh, seed);
    c.fillStyle = tg;
    c.fill();

    // Thớ giấy mờ & mép sáng nhẹ bắt ánh đèn bàn
    c.fillStyle = `rgba(255,248,236,${0.14 + wEase * 0.06})`;
    c.fillRect(-hw + 3, -hh + 1.5, wTape - 6, 2.2);
    c.strokeStyle = `rgba(${COL[k.id].rim},${0.32 + wEase * 0.12})`;
    c.lineWidth = 0.85;
    traceTapePath(c, hw, hh, seed);
    c.stroke();

    c.restore();
  }

  function drawBlackSlot(c, k, wEase) {
    const x = k.x;
    const y = KY;
    const w = k.w;
    const h = k.y + k.h - KY;
    const lw = k.leftW;
    const rw = k.rightW;
    const dipL = lw ? lw.press * 7 : 0;
    const dipR = rw ? rw.press * 7 : 0;
    const seamL = lw ? lw.x + lw.w : k.cx - 1.5;
    const seamR = rw ? rw.x : k.cx + 1.5;

    // Lòng khe gỗ nâu ấm sáng hơn hẳn phím đen để nhận ra ngay đang trống
    const woodG = c.createLinearGradient(x, y, x + w, y + h);
    woodG.addColorStop(0, wEase > 0.4 ? '#4d3523' : '#3d2a1c');
    woodG.addColorStop(0.38, wEase > 0.4 ? '#6e4d34' : '#5a3f2a');
    woodG.addColorStop(0.78, wEase > 0.4 ? '#785439' : '#63442d');
    woodG.addColorStop(1, wEase > 0.4 ? '#583d29' : '#452f20');
    c.fillStyle = woodG;
    roundRect(c, x, y, w, h, 3);
    c.fill();

    // Vân gỗ mảnh dọc đáy khe
    c.strokeStyle = 'rgba(32,18,10,0.22)';
    c.lineWidth = 1;
    for (let gi = 0; gi < 4; gi++) {
      const gx = x + 12 + gi * 13 + (gi % 2 ? 2 : -1);
      c.beginPath();
      c.moveTo(gx, y + 6);
      c.quadraticCurveTo(gx + (gi % 2 ? 2.5 : -2), y + h * 0.5, gx + (gi % 2 ? -1 : 1.5), y + h - 6);
      c.stroke();
    }

    // Ánh đèn bàn từ góc trên trái hắt vào lòng khe gỗ
    const lampG = c.createRadialGradient(x + w * 0.62, y + h * 0.58, 3, x + w * 0.58, y + h * 0.55, 58);
    lampG.addColorStop(0, `rgba(255,212,152,${0.26 + wEase * 0.14})`);
    lampG.addColorStop(0.55, `rgba(240,178,108,${0.10 + wEase * 0.08})`);
    lampG.addColorStop(1, 'rgba(240,178,108,0)');
    c.fillStyle = lampG;
    c.fillRect(x + 4, y + 8, w - 8, h - 12);

    // Bóng đổ từ thanh nỉ đỏ phía trên và vách trái vào lòng khe (tạo chiều sâu hõm)
    const topSh = c.createLinearGradient(0, y, 0, y + 28);
    topSh.addColorStop(0, 'rgba(8,5,3,0.82)');
    topSh.addColorStop(0.55, 'rgba(12,7,4,0.34)');
    topSh.addColorStop(1, 'rgba(12,7,4,0)');
    c.fillStyle = topSh;
    c.fillRect(x, y, w, 28);

    const sideSh = c.createLinearGradient(x + 4, 0, x + 24, 0);
    sideSh.addColorStop(0, 'rgba(10,6,4,0.58)');
    sideSh.addColorStop(0.5, 'rgba(10,6,4,0.22)');
    sideSh.addColorStop(1, 'rgba(10,6,4,0)');
    c.fillStyle = sideSh;
    c.fillRect(x + 4, y, 20, h);

    const botSh = c.createLinearGradient(0, y + h - 14, 0, y + h - 3);
    botSh.addColorStop(0, 'rgba(10,6,4,0)');
    botSh.addColorStop(1, 'rgba(10,6,4,0.34)');
    c.fillStyle = botSh;
    c.fillRect(x + 4, y + h - 14, w - 8, 11);

    // Rãnh ngàm nhỏ, trục kim loại và lò xo hồi phím bên trong lòng khe
    c.fillStyle = '#261911';
    roundRect(c, k.cx - 5.5, y + 26, 11, 64, 3);
    c.fill();
    c.strokeStyle = `rgba(255,214,168,${0.12 + wEase * 0.08})`;
    c.lineWidth = 0.8;
    roundRect(c, k.cx - 5.5, y + 26, 11, 64, 3);
    c.stroke();

    // Trục dẫn đứng kim loại
    const pinG = c.createLinearGradient(k.cx - 1.5, 0, k.cx + 1.5, 0);
    pinG.addColorStop(0, '#787066');
    pinG.addColorStop(0.45, '#ded4c2');
    pinG.addColorStop(1, '#4f4942');
    c.fillStyle = pinG;
    roundRect(c, k.cx - 1.5, y + 30, 3, 52, 1.2);
    c.fill();

    // Vòng lò xo nhỏ quấn quanh trục
    c.lineCap = 'round';
    c.lineWidth = 1.6;
    c.strokeStyle = 'rgba(10,6,4,0.52)';
    for (let si = 0; si < 5; si++) {
      const sy = y + 46 + si * 5.6;
      c.beginPath();
      c.moveTo(k.cx - 4.2, sy + 1.2);
      c.lineTo(k.cx + 4.2, sy + 3.4);
      c.stroke();
    }
    c.strokeStyle = wEase > 0.4 ? '#dfd3be' : '#c6b8a0';
    for (let si = 0; si < 5; si++) {
      const sy = y + 45 + si * 5.6;
      c.beginPath();
      c.moveTo(k.cx - 4.2, sy);
      c.lineTo(k.cx + 4.2, sy + 2.2);
      c.stroke();
    }
    c.fillStyle = '#8b7f70';
    c.fillRect(k.cx - 4.5, y + 42.5, 9, 2);
    c.fillRect(k.cx - 4.5, y + 73, 9, 2);

    // Dấu băng dính giấy màu dưới đáy khe (lắp phím rồi sẽ không thấy)
    if (k.col) {
      drawSlotTape(c, k, y + h - 27, 36, 16, wEase);
    }

    // Mép cắt bên trái (cạnh phím trắng bên trái) + viền sáng mảnh mép khe
    const lg = c.createLinearGradient(0, y + dipL, 0, y + h + dipL);
    lg.addColorStop(0, '#a69d8e');
    lg.addColorStop(1, '#7a7165');
    c.fillStyle = lg;
    c.fillRect(x, y + dipL, 4.5, h);
    c.fillStyle = `rgba(255,244,226,${0.42 + wEase * 0.16})`;
    c.fillRect(x + 3.6, y + dipL + 1, 1.1, h - 4);
    c.fillStyle = `rgba(255,246,232,${0.18 + wEase * 0.08})`;
    c.fillRect(x, y + dipL + 1, 0.9, h - 4);

    // Mép cắt bên phải (cạnh phím trắng bên phải, bắt sáng đèn bàn) + viền sáng mảnh
    const rg = c.createLinearGradient(0, y + dipR, 0, y + h + dipR);
    rg.addColorStop(0, '#e5dccb');
    rg.addColorStop(1, '#bbb09e');
    c.fillStyle = rg;
    c.fillRect(x + w - 4.5, y + dipR, 4.5, h);
    c.fillStyle = `rgba(255,248,234,${0.58 + wEase * 0.18})`;
    c.fillRect(x + w - 4.6, y + dipR + 1, 1.3, h - 4);

    // Mép đáy hốc khớp đúng khe 3px giữa hai phím trắng bên dưới
    c.fillStyle = '#bfb4a1';
    c.fillRect(x + 3.5, y + h + dipL - 3.5, Math.max(0, seamL - (x + 3.5)), 3.5);
    c.fillStyle = '#d4c9b5';
    c.fillRect(seamR, y + h + dipR - 3.5, Math.max(0, (x + w - 3.5) - seamR), 3.5);
    c.fillStyle = `rgba(255,248,232,${0.36 + wEase * 0.14})`;
    c.fillRect(x + 4, y + h + dipL - 3.5, Math.max(0, seamL - (x + 4)), 1);
    c.fillRect(seamR, y + h + dipR - 3.5, Math.max(0, (x + w - 4) - seamR), 1);

    // Một chút bụi nhẹ trên đáy gỗ
    const seed = Math.round(k.cx) % 97;
    for (let j = 0; j < 4; j++) {
      const rx = ((seed + j * 29) % 68) / 100 + 0.16;
      const ry = ((seed + j * 43) % 42) / 100 + 0.24;
      const dr = 0.85 + ((seed + j * 11) % 6) * 0.1;
      c.fillStyle = `rgba(232,216,192,${0.14 + wEase * 0.08})`;
      c.beginPath();
      c.arc(x + w * rx, y + h * ry, dr, 0, Math.PI * 2);
      c.fill();
    }
  }

  function drawBlackKey(c, k, ba, wEase) {
    const dip = k.press * 5;
    const x = k.x;
    const y = k.y + dip;
    const w = k.w;
    const h = k.h - dip;

    // Bóng đổ của phím đen lên phím trắng bên cạnh
    c.fillStyle = `rgba(0,0,0,${0.36 - k.press * 0.14})`;
    roundRect(c, x + 4, y + 6, w + 4, h + 4, 6);
    c.fill();

    if (k.col) {
      const colRgb = COL_RGB[k.id].rgb;
      const colRim = COL_RGB[k.id].rim;
      const lift = k.glow * 0.18 + wEase * 0.08;

      // Thân phím đen nhuộm màu (đậm hơn phím trắng một chút để ra phím đen)
      const bg = c.createLinearGradient(x, y, x + w, y);
      bg.addColorStop(0, shadeRgb(colRgb, 0.72 + lift));
      bg.addColorStop(0.55, shadeRgb(colRgb, 0.54 + lift * 0.8));
      bg.addColorStop(1, shadeRgb(colRgb, 0.34 + lift * 0.6));
      c.fillStyle = bg;
      roundRect(c, x, y, w, h, 5);
      c.fill();

      // Mặt vát phía trước dưới phím
      const skirtG = c.createLinearGradient(0, y + h - 22, 0, y + h);
      skirtG.addColorStop(0, 'rgba(10,8,14,0.06)');
      skirtG.addColorStop(1, 'rgba(6,5,10,0.44)');
      c.fillStyle = skirtG;
      roundRect(c, x, y + h - 22, w, 22, 5);
      c.fill();

      // Mặt vát phía trên phím đen bắt ánh đèn ấm
      const topG = c.createLinearGradient(x, y + 3, x, y + h - 19);
      topG.addColorStop(0, shadeRgb(colRim, 0.88 + lift * 0.7));
      topG.addColorStop(0.15, shadeRgb(colRgb, 0.84 + lift));
      topG.addColorStop(0.78, shadeRgb(colRgb, 0.72 + lift));
      topG.addColorStop(1, shadeRgb(colRgb, 0.58 + lift * 0.8));
      c.fillStyle = topG;
      roundRect(c, x + 6, y + 3, w - 12, h - 22, 4);
      c.fill();

      // Độ bóng nhẹ trên mặt phím đen
      const sheenG = c.createLinearGradient(x + 8, y + 5, x + 8, y + 36);
      sheenG.addColorStop(0, `rgba(255,248,236,${0.14 + k.glow * 0.16 + wEase * 0.06})`);
      sheenG.addColorStop(1, 'rgba(255,248,236,0)');
      c.fillStyle = sheenG;
      roundRect(c, x + 9, y + 5, w - 18, 28, 3);
      c.fill();

      // Đường highlight mảnh cạnh trái mặt trên và mép vát dưới
      c.strokeStyle = `rgba(${k.col.rim},${0.42 + k.glow * 0.36 + wEase * 0.12})`;
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x + 8, y + 6);
      c.lineTo(x + 8, y + h - 24);
      c.stroke();

      c.strokeStyle = `rgba(${k.col.rim},${0.26 + k.glow * 0.34 + wEase * 0.10})`;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + 9, y + h - 20);
      c.lineTo(x + w - 9, y + h - 20);
      c.stroke();

      // Phím đen màu sáng lên khi chạm hoặc khi vừa lắp vào
      if (k.glow > 0.01) {
        if (colGlowSpr[k.id]) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = c.globalAlpha * k.glow * 0.44;
          c.drawImage(colGlowSpr[k.id], k.cx - 48, y + h * 0.45 - 52, 96, 104);
          c.restore();
        }
        const kg = c.createLinearGradient(x, y, x, y + h - 18);
        kg.addColorStop(0, `rgba(${k.col.glow},${k.glow * 0.24})`);
        kg.addColorStop(1, `rgba(${k.col.glow},${k.glow * 0.44})`);
        c.fillStyle = kg;
        roundRect(c, x + 6, y + 3, w - 12, h - 22, 4);
        c.fill();

        c.fillStyle = `rgba(255,248,232,${0.22 * k.glow})`;
        roundRect(c, x, y, w, h, 5);
        c.fill();
      }
      return;
    }

    // Thân phím đen thường
    const bg = c.createLinearGradient(x, y, x + w, y);
    bg.addColorStop(0, wEase > 0.4 ? '#20222a' : '#16171d');
    bg.addColorStop(0.5, '#121318');
    bg.addColorStop(1, '#090a0e');
    c.fillStyle = bg;
    roundRect(c, x, y, w, h, 5);
    c.fill();

    // Mặt vát phía trên phím đen bắt ánh đèn ấm
    const topG = c.createLinearGradient(x, y, x, y + h - 18);
    topG.addColorStop(0, `rgba(48,50,60,${0.95})`);
    topG.addColorStop(0.14, k.glow > 0.02 ? '#2c2d37' : '#1e2028');
    topG.addColorStop(1, '#121318');
    c.fillStyle = topG;
    roundRect(c, x + 6, y + 3, w - 12, h - 22, 4);
    c.fill();

    // Đường highlight mảnh cạnh trái mặt trên (ánh sáng từ đèn bàn trái)
    c.strokeStyle = `rgba(255,214,160,${0.12 + k.glow * 0.28 + wEase * 0.12})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x + 8, y + 6);
    c.lineTo(x + 8, y + h - 24);
    c.stroke();

    // Phím đen sáng nhẹ khi chạm
    if (k.glow > 0.01) {
      const kg = c.createLinearGradient(x, y, x, y + h - 18);
      kg.addColorStop(0, `rgba(255,216,156,${k.glow * 0.2})`);
      kg.addColorStop(1, `rgba(255,216,156,${k.glow * 0.4})`);
      c.fillStyle = kg;
      roundRect(c, x + 6, y + 3, w - 12, h - 22, 4);
      c.fill();
    }
  }

  function drawSlidingKey(c, k, ba, wEase) {
    const u = clamp(1 - k.drop, 0, 1);
    const easePos = 1 - Math.pow(1 - u, 3);
    const slideY = (1 - easePos) * (k.black ? 48 : 54);
    const slideA = clamp(u / 0.16, 0, 1);

    // Bóng mờ rơi xuống lòng khe khi phím đang trượt vào
    c.fillStyle = `rgba(0,0,0,${(1 - easePos) * 0.34 * slideA})`;
    roundRect(c, k.x + 4, k.y + 4, k.w - 4, k.h - 6, 6);
    c.fill();

    c.save();
    c.globalAlpha = ba * slideA;
    c.translate(0, -slideY);
    if (k.black) drawBlackKey(c, k, ba * slideA, wEase);
    else drawWhiteKey(c, k, ba * slideA, wEase);
    c.restore();
  }

  function drawDeskPiece(c, dp, now, ba, wEase) {
    if (SC.dan.co && SC.dan.co[dp.id]) return;
    const isHeld = SC.dan.tay === dp.id;
    let sx = 0;
    let sr = 0;
    if (isHeld && pieceShakeAt) {
      const se = (now - pieceShakeAt) / 1000;
      if (se >= 0 && se < 0.36) {
        const env = 1 - se / 0.36;
        sx = Math.sin(se * 56) * 7.5 * env;
        sr = Math.sin(se * 56) * 0.055 * env;
      } else if (se >= 0.36) {
        pieceShakeAt = 0;
      }
    }

    const lift = dp.lift;
    const liftY = lift * 11;
    const hw = dp.len * 0.5;
    const hh = dp.thick * 0.5;

    // Bóng đổ mềm trên mặt bàn (tách xa khi mảnh nổi lên)
    c.save();
    c.translate(dp.x + sx * 0.45 + 2 + lift * 4, dp.y + 4 + lift * 8);
    c.rotate(dp.rot + sr * 0.5);
    c.fillStyle = `rgba(0,0,0,${0.46 - lift * 0.16})`;
    roundRect(c, -hw - lift * 2, -hh - lift, dp.len + lift * 4, dp.thick + lift * 2, dp.r + 1);
    c.fill();
    c.restore();

    // Quầng sáng nhẹ quanh mảnh đang cầm
    if (lift > 0.02 && colGlowSpr[dp.id]) {
      const gw = dp.len + 46;
      const gh = dp.thick + 46;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * lift * 0.48;
      c.drawImage(colGlowSpr[dp.id], dp.x + sx - gw * 0.5, dp.y - liftY - gh * 0.5, gw, gh);
      c.restore();
    }

    // Thanh nhựa màu bo góc (chưa vẽ mép phím để chưa lộ dáng phím đàn rõ)
    c.save();
    c.translate(dp.x + sx, dp.y - liftY);
    c.rotate(dp.rot + sr);

    const rgb = COL_RGB[dp.id].rgb;
    const rim = COL_RGB[dp.id].rim;
    const bg = c.createLinearGradient(0, -hh, 0, hh);
    if (dp.black) {
      const f = lift * 0.14 + wEase * 0.06;
      bg.addColorStop(0, shadeRgb(rgb, 0.78 + f));
      bg.addColorStop(0.55, shadeRgb(rgb, 0.58 + f));
      bg.addColorStop(1, shadeRgb(rgb, 0.40 + f));
    } else {
      const f = lift * 0.10 + wEase * 0.05;
      bg.addColorStop(0, shadeRgb(rim, 0.96 + f));
      bg.addColorStop(0.6, shadeRgb(rgb, 0.94 + f));
      bg.addColorStop(1, shadeRgb(rgb, 0.76 + f));
    }
    c.fillStyle = bg;
    roundRect(c, -hw, -hh, dp.len, dp.thick, dp.r);
    c.fill();

    // Độ bóng nhựa dịu dọc mép trên
    const sheen = c.createLinearGradient(0, -hh + 1, 0, -hh + dp.thick * 0.45);
    sheen.addColorStop(0, `rgba(255,248,236,${(dp.black ? 0.14 : 0.24) + lift * 0.14})`);
    sheen.addColorStop(1, 'rgba(255,248,236,0)');
    c.fillStyle = sheen;
    roundRect(c, -hw + 2, -hh + 1.5, dp.len - 4, dp.thick * 0.42, Math.max(2, dp.r - 2));
    c.fill();

    // Viền sáng mảnh khi mảnh được cầm lên
    c.strokeStyle = lift > 0.05
      ? `rgba(${COL[dp.id].rim},${0.35 + lift * 0.5})`
      : `rgba(${COL[dp.id].rim},${dp.black ? 0.18 : 0.26})`;
    c.lineWidth = lift > 0.05 ? 1.4 : 0.9;
    roundRect(c, -hw, -hh, dp.len, dp.thick, dp.r);
    c.stroke();

    c.restore();
  }

  function drawDeskPieces(c, now, ba, wEase) {
    if (!laMauTrenBan()) return;
    let lifted = null;
    for (let i = 0; i < DESK_PIECES.length; i++) {
      const dp = DESK_PIECES[i];
      if (SC.dan.co && SC.dan.co[dp.id]) continue;
      if (SC.dan.tay === dp.id || dp.lift > 0.01) {
        lifted = dp;
        continue;
      }
      drawDeskPiece(c, dp, now, ba, wEase);
    }
    if (lifted) drawDeskPiece(c, lifted, now, ba, wEase);
  }

  function hitDeskPiece(p) {
    if (!laMauTrenBan()) return null;
    const px = p[0];
    const py = p[1];
    for (let i = DESK_PIECES.length - 1; i >= 0; i--) {
      const dp = DESK_PIECES[i];
      if (SC.dan.co && SC.dan.co[dp.id]) continue;
      const cy = dp.y - dp.lift * 11;
      const dx = px - dp.x;
      const dy = py - cy;
      const cos = Math.cos(-dp.rot);
      const sin = Math.sin(-dp.rot);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;
      if (Math.abs(lx) <= dp.len * 0.5 + 18 && Math.abs(ly) <= dp.thick * 0.5 + 20) {
        return dp;
      }
    }
    return null;
  }

  function piecePan(dp) {
    return ((dp.x - X0) / (10 * KW) - 0.5) * 0.56;
  }

  function drawToastMsg(c, now, ba) {
    if (!msgText || !msgAt) return;
    const elap = Math.max(0, (now - msgAt) / 1000);
    const dur = msgDur || 3;
    if (elap >= dur) {
      msgText = '';
      msgAt = 0;
      return;
    }
    const fadeIn = Math.min(1, elap / 0.25);
    const fadeOutStart = Math.max(0.25, dur - 0.6);
    const fadeOut = elap > fadeOutStart ? Math.max(0, (dur - elap) / 0.6) : 1;
    const a = ba * fadeIn * fadeOut;
    if (a <= 0.01) return;

    c.save();
    c.globalAlpha = a;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '400 28px "Be Vietnam Pro", sans-serif';
    const my = 372 + (1 - fadeIn) * 6; // giữa tờ nhạc và thân đàn: màn điện thoại ngang cắt mất phần trên y < 80
    c.fillStyle = 'rgba(6,8,14,0.9)';
    c.fillText(msgText, 800, my + 2);
    c.fillStyle = 'rgba(246,234,212,0.98)';
    c.fillText(msgText, 800, my);
    c.restore();
  }

  function drawThuBtn(c, ba) {
    if (!IS_THU) return;
    const doneAll = hasAllKeys();
    const alpha = ba * (thuRunning || doneAll ? 0.42 : 0.78);
    c.save();
    c.globalAlpha = alpha;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    c.font = '400 24px "Be Vietnam Pro", sans-serif';
    const tx = W - 40;
    const ty = 118;
    const label = 'lắp đủ phím (thử)';
    if (!thuTextW) thuTextW = c.measureText(label).width;
    c.fillStyle = 'rgba(6,8,14,0.85)';
    c.fillText(label, tx, ty + 1.5);
    c.fillStyle = 'rgba(243,230,207,0.95)';
    c.fillText(label, tx, ty);
    c.strokeStyle = 'rgba(255,215,154,0.48)';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(tx - thuTextW, ty + 14);
    c.lineTo(tx, ty + 14);
    c.stroke();
    c.restore();
  }

  function hitThuBtn(p) {
    if (!IS_THU) return false;
    const px = p[0];
    const py = p[1];
    return px >= W - 260 && px <= W - 12 && py >= 84 && py <= 160;
  }

  function runThu() {
    if (!IS_THU || thuRunning) return;
    const missing = [];
    for (let i = 0; i < THU_ORDER.length; i++) {
      const id = THU_ORDER[i];
      if (!SC.dan.co[id]) missing.push(id);
    }
    if (!missing.length) return;
    thuRunning = true;
    for (let i = 0; i < missing.length; i++) {
      const id = missing[i];
      const isLast = i === missing.length - 1;
      if (i === 0) {
        SC.dan.lap(id);
        if (isLast) thuRunning = false;
      } else {
        const tm = setTimeout(() => {
          if (V.cur !== 'dan') return;
          SC.dan.lap(id);
          if (isLast) thuRunning = false;
        }, i * 800);
        thuTimers.push(tm);
      }
    }
  }

  let CLICK_NOISE = null;
  function clickNoise() {
    if (CLICK_NOISE && CLICK_NOISE.ctx === ac) return CLICK_NOISE.buf;
    const len = Math.max(1, Math.floor(ac.sampleRate * 0.045));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
    CLICK_NOISE = { ctx: ac, buf };
    return buf;
  }

  function outDest(pan) {
    if (typeof ac.createStereoPanner === 'function') {
      const p = ac.createStereoPanner();
      p.pan.value = clamp(pan, -0.6, 0.6);
      p.connect(master);
      return p;
    }
    return master;
  }

  function playKeySnap(pan) {
    if (!ac || !master) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t = ac.currentTime;
    const dest = outDest(pan);

    // Tiếng "tách" nhựa nhẹ khi phím khớp vào khe
    const ns = ac.createBufferSource();
    ns.buffer = clickNoise();
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2500;
    bp.Q.value = 2.4;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.linearRampToValueAtTime(0.14, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0002, t + 0.032);
    ns.connect(bp); bp.connect(ng); ng.connect(dest);
    ns.start(t); ns.stop(t + 0.04);

    const body = ac.createOscillator();
    const bg = ac.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(540, t);
    body.frequency.exponentialRampToValueAtTime(185, t + 0.026);
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.linearRampToValueAtTime(0.08, t + 0.002);
    bg.gain.exponentialRampToValueAtTime(0.0002, t + 0.032);
    body.connect(bg); bg.connect(dest);
    body.start(t); body.stop(t + 0.036);
  }

  function playSlotTap(pan) {
    if (!ac || !master) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t = ac.currentTime;
    const dest = outDest(pan);

    // Tiếng "cạch" gỗ rất khẽ khi chạm vào khe trống
    const ns = ac.createBufferSource();
    ns.buffer = clickNoise();
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 850;
    bp.Q.value = 1.6;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.linearRampToValueAtTime(0.045, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0002, t + 0.024);
    ns.connect(bp); bp.connect(ng); ng.connect(dest);
    ns.start(t); ns.stop(t + 0.03);

    const wood = ac.createOscillator();
    const wg = ac.createGain();
    wood.type = 'sine';
    wood.frequency.setValueAtTime(170, t);
    wood.frequency.exponentialRampToValueAtTime(82, t + 0.034);
    wg.gain.setValueAtTime(0.0001, t);
    wg.gain.linearRampToValueAtTime(0.055, t + 0.003);
    wg.gain.exponentialRampToValueAtTime(0.0002, t + 0.038);
    wood.connect(wg); wg.connect(dest);
    wood.start(t); wood.stop(t + 0.042);
  }

  function playWrongSlot(pan) {
    if (!ac || !master) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t = ac.currentTime;
    const dest = outDest(pan);

    // Tiếng "cộc" gỗ trầm ngắn khi đặt nhầm khe
    const ns = ac.createBufferSource();
    ns.buffer = clickNoise();
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 420;
    bp.Q.value = 2.1;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.linearRampToValueAtTime(0.14, t + 0.003);
    ng.gain.exponentialRampToValueAtTime(0.0002, t + 0.038);
    ns.connect(bp); bp.connect(ng); ng.connect(dest);
    ns.start(t); ns.stop(t + 0.044);

    const knock = ac.createOscillator();
    const kg = ac.createGain();
    knock.type = 'triangle';
    knock.frequency.setValueAtTime(165, t);
    knock.frequency.exponentialRampToValueAtTime(68, t + 0.062);
    kg.gain.setValueAtTime(0.0001, t);
    kg.gain.linearRampToValueAtTime(0.16, t + 0.003);
    kg.gain.exponentialRampToValueAtTime(0.0002, t + 0.068);
    knock.connect(kg); kg.connect(dest);
    knock.start(t); knock.stop(t + 0.072);
  }

  function playPiecePick(pan) {
    if (!ac || !master) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t = ac.currentTime;
    const dest = outDest(pan);

    const ns = ac.createBufferSource();
    ns.buffer = clickNoise();
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1450;
    bp.Q.value = 1.8;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.linearRampToValueAtTime(0.055, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0002, t + 0.025);
    ns.connect(bp); bp.connect(ng); ng.connect(dest);
    ns.start(t); ns.stop(t + 0.03);

    const pop = ac.createOscillator();
    const pg = ac.createGain();
    pop.type = 'triangle';
    pop.frequency.setValueAtTime(260, t);
    pop.frequency.exponentialRampToValueAtTime(380, t + 0.024);
    pg.gain.setValueAtTime(0.0001, t);
    pg.gain.linearRampToValueAtTime(0.04, t + 0.002);
    pg.gain.exponentialRampToValueAtTime(0.0002, t + 0.028);
    pop.connect(pg); pg.connect(dest);
    pop.start(t); pop.stop(t + 0.032);
  }

  function playPiecePut(pan) {
    if (!ac || !master) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t = ac.currentTime;
    const dest = outDest(pan);

    const ns = ac.createBufferSource();
    ns.buffer = clickNoise();
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 540;
    bp.Q.value = 1.5;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.linearRampToValueAtTime(0.05, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0002, t + 0.026);
    ns.connect(bp); bp.connect(ng); ng.connect(dest);
    ns.start(t); ns.stop(t + 0.032);

    const wood = ac.createOscillator();
    const wg = ac.createGain();
    wood.type = 'sine';
    wood.frequency.setValueAtTime(150, t);
    wood.frequency.exponentialRampToValueAtTime(92, t + 0.03);
    wg.gain.setValueAtTime(0.0001, t);
    wg.gain.linearRampToValueAtTime(0.045, t + 0.002);
    wg.gain.exponentialRampToValueAtTime(0.0002, t + 0.034);
    wood.connect(wg); wg.connect(dest);
    wood.start(t); wood.stop(t + 0.038);
  }

  // Tiếng đàn điện tử trong, sạch (hoà âm sine/triangle, tấn công nhanh, tắt dần ~1.4s)
  // tiếng đàn điện tử ấm (kiểu đàn Rhodes): sóng sine được điều tần bởi một sine cùng tần số, độ điều tần tắt dần
  // → lúc chạm có tiếng "tinh" sáng, rồi lắng thành tiếng tròn; thêm một lớp lệch vài cent cho dày, và vang phòng nhỏ.
  let REV = null;
  function reverb() {
    if (REV && REV.ctx === ac) return REV.in;
    const len = Math.floor(ac.sampleRate * 2.2), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * 0.5; }
    const cv = ac.createConvolver(); cv.buffer = ir; const wet = ac.createGain(); wet.gain.value = 0.22; cv.connect(wet); wet.connect(master);
    REV = { ctx: ac, in: cv }; return cv;
  }
  function playPianoNote(freq, pan) {
    if (!ac || !master) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t = ac.currentTime, dur = 2.6;
    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(0.3, t + 0.006);
    out.gain.exponentialRampToValueAtTime(0.12, t + 0.35);
    out.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(7000, freq * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(900, freq * 2.5), t + 1.2);
    lp.connect(out);
    let dest = master;
    if (typeof ac.createStereoPanner === 'function') { const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -0.6, 0.6); out.connect(p); p.connect(master); p.connect(reverb()); }
    else { out.connect(master); out.connect(reverb()); }
    const voice = (det, amp) => {
      const car = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
      car.type = 'sine'; mod.type = 'sine';
      car.frequency.value = freq; car.detune.value = det; mod.frequency.value = freq; mod.detune.value = det;
      mg.gain.setValueAtTime(freq * 1.8, t); mg.gain.exponentialRampToValueAtTime(freq * 0.25, t + 0.9); mg.gain.exponentialRampToValueAtTime(freq * 0.05, t + dur);
      mod.connect(mg); mg.connect(car.frequency);
      g.gain.value = amp; car.connect(g); g.connect(lp);
      car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
    };
    voice(-4, 0.55); voice(4, 0.55);
    // tiếng "tinh" kim loại rất ngắn lúc búa chạm thanh (bậc 14), làm nốt rõ mà không gắt
    const tine = ac.createOscillator(), tg = ac.createGain(); tine.type = 'sine'; tine.frequency.value = freq * 7;
    tg.gain.setValueAtTime(0.05, t); tg.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
    tine.connect(tg); tg.connect(lp); tine.start(t); tine.stop(t + 0.15);
  }

  function tryDecodeSong() {
    if (songBuf || !songArr || !ac || songDecodeLock) return;
    songDecodeLock = true;
    const copy = songArr.slice(0);
    ac.decodeAudioData(copy).then(b => {
      songBuf = b;
      songDecodeLock = false;
      if (songWantPlay && !songStarted && SC.dan.xong && V.cur === 'dan') {
        playSongNow();
      }
    }).catch(() => {
      songDecodeLock = false;
    });
  }

  function preloadSong() {
    if (songArr) {
      tryDecodeSong();
      return;
    }
    if (songLoading) return;
    songLoading = true;
    fetch('am/dct.mp3').then(r => {
      if (!r.ok) throw new Error('missing');
      return r.arrayBuffer();
    }).then(ab => {
      songArr = ab;
      songLoading = false;
      tryDecodeSong();
    }).catch(() => {
      songLoading = false;
    });
  }

  function tuaBai(S) {
    if (!songBuf || !ac || !master) return;
    try { if (songSrc) { const old = songSrc; songSrc = null; old.onended = null; old.stop(); } } catch (_) {}
    const src = ac.createBufferSource(); src.buffer = songBuf;
    const g = ac.createGain(); const t = ac.currentTime;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(SONG_BASE_GAIN, t + 0.35);
    src.connect(g); g.connect(master);
    src.onended = () => { if (songSrc === src) { songSrc = null; songGain = null; songEnded = true; } };
    const off = clamp(S, 0, Math.max(0, songBuf.duration - 0.1));
    src.start(t, off); songSrc = src; songGain = g; songStarted = true; songEnded = false;
    songT0 = performance.now() - (off - DCT_AT) * 1000;
  }

  function playSongNow() {
    if (songStarted || !songBuf || !ac || !master) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    songStarted = true;
    songWantPlay = false;
    songEnded = false;

    const src = ac.createBufferSource();
    src.buffer = songBuf;
    const gainNode = ac.createGain();
    const t = ac.currentTime;
    const targetGain = ket2.on && ket2.exiting ? 0.0001 : SONG_BASE_GAIN;
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(targetGain, t + 0.25);
    src.connect(gainNode);
    gainNode.connect(master);

    src.onended = () => {
      if (songSrc === src) {
        songSrc = null;
        songGain = null;
        songEnded = true;
      }
    };

    const off = clamp(DCT_AT, 0, Math.max(0, songBuf.duration - 0.1));
    src.start(t, off);
    songSrc = src;
    songGain = gainNode;
    songT0 = performance.now();
    if (IS_KETXEM && TUA > 0 && !tuaDaLam) { tuaDaLam = true; tuaBai(TUA); }
  }

  function scheduleSong() {
    clearTimeout(songTimer);
    songWantPlay = true;
    songTimer = setTimeout(() => {
      if (V.cur !== 'dan' || !SC.dan.xong || songStarted) return;
      if (songBuf) {
        playSongNow();
      } else {
        tryDecodeSong();
      }
    }, 500);
  }

  function hitKey(p) {
    const px = p[0];
    const py = p[1];
    for (let i = 0; i < BLACK_KEYS.length; i++) {
      const k = BLACK_KEYS[i];
      const padX = hasKey(k) ? 4 : 0;
      const padTop = hasKey(k) ? 6 : 0;
      const padBot = hasKey(k) ? 4 : 0;
      if (px >= k.x - padX && px <= k.x + k.w + padX && py >= k.y - padTop && py <= k.y + k.h + padBot) {
        return k;
      }
    }
    for (let i = 0; i < WHITE_KEYS.length; i++) {
      const k = WHITE_KEYS[i];
      if (px >= k.x && px <= k.x + k.w && py >= k.y && py <= k.y + k.h + 8) {
        return k;
      }
    }
    return null;
  }

  function stopSong() {
    clearTimeout(songTimer);
    songTimer = 0;
    songWantPlay = false;
    songStarted = false;
    songEnded = false;
    songGain = null;
    if (songSrc) {
      try { songSrc.onended = null; } catch (_) {}
      try { songSrc.stop(); } catch (_) {}
      songSrc = null;
    }
  }

  // =========================================================================
  // ĐOẠN KẾT KẾT 2 — "Chiều ngược lại"
  // =========================================================================
  const KET2_LINE = 'Đến ôm em bằng được.';
  const KET2_CAL_TITLE = 'Tháng 11';
  const KET2_CAL_NOTE = 'đón em';
  const KET2_DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const CAL_GEO = {
    x: 560,
    y: 124,
    w: 480,
    h: 572,
    padX: 34,
    headY: 304,
    dowY: 348,
    gridY: 368,
    rowH: 49,
  };

  const BTN_REPLAY = { x: 670, y: 774, hw: 98, hh: 34, label: 'Xem lại' };
  const BTN_HOME = { x: 930, y: 774, hw: 120, hh: 34, label: 'Về sân đình' }; // về không gian chung (san.js)

  const CAL_LOOP_PTS = [];
  (function buildCalLoop() {
    const colW = (CAL_GEO.w - CAL_GEO.padX * 2) / 7;
    const cx = CAL_GEO.x + CAL_GEO.padX + 6 * colW;
    const cy = CAL_GEO.gridY + 4.5 * CAL_GEO.rowH;
    const rx = colW * 1.04;
    const ry = CAL_GEO.rowH * 0.44;
    const tilt = -0.045;
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const n = 72;
    const a0 = -2.18;
    const span = Math.PI * 2 + 0.36;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const th = a0 + u * span;
      const wob = Math.sin(th * 2 + 0.7) * 1.9 + Math.cos(th * 3 - 0.5) * 1.2 + u * 2.4;
      const lx = Math.cos(th) * (rx + wob);
      const ly = Math.sin(th) * (ry + wob * 0.55) + u * 2.0 - 1.0;
      CAL_LOOP_PTS.push([cx + lx * ct - ly * st, cy + lx * st + ly * ct]);
    }
  })();

  const ket2 = {
    on: false,
    t: 0,
    exiting: false,
    exitT: 0,
    navigated: false,
    lineW: 0,
    fontsAsked: false,
    savedBack: null,
    hadSavedBack: false,
    xemAt: 0,
  };

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      calW = 0;
      ket2.lineW = 0;
    }).catch(() => {});
  }

  function ensureKet2Fonts() {
    if (ket2.fontsAsked || typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
    ket2.fontsAsked = true;
    Promise.all([
      document.fonts.load(`700 74px ${SCRIPT}`, 'Đến ôm em bằng được. đón em'),
      document.fonts.load(`600 40px ${CAL_FONT}`, 'Tháng 11'),
      document.fonts.load(`600 22px ${UI_FONT}`, 'Xem lại Về sân đình đón em'),
    ]).then(() => {
      calW = 0;
      ket2.lineW = 0;
    }).catch(() => {});
  }

  function playLampSwitchOff() {
    if (!ac || !master) return;
    try {
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const t = ac.currentTime;
      const len = Math.max(1, Math.floor(ac.sampleRate * 0.024));
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.0042));
      }
      const nSrc = ac.createBufferSource();
      nSrc.buffer = buf;
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2250, t);
      bp.Q.setValueAtTime(1.9, t);
      const ng = ac.createGain();
      ng.gain.setValueAtTime(0.18, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
      nSrc.connect(bp);
      bp.connect(ng);
      ng.connect(master);
      nSrc.start(t);

      const osc = ac.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(112, t + 0.028);
      const og = ac.createGain();
      og.gain.setValueAtTime(0.075, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);
      osc.connect(og);
      og.connect(master);
      osc.start(t);
      osc.stop(t + 0.035);
    } catch (_) {}
  }

  function dimSongForKet2(sec) {
    if (!songGain || !ac || ket2.exiting) return;
    try {
      const t = ac.currentTime;
      const g = songGain.gain;
      const cur = g.value;
      if (typeof g.cancelScheduledValues === 'function') g.cancelScheduledValues(t);
      g.setValueAtTime(cur, t);
      g.linearRampToValueAtTime(SONG_DIM_GAIN, t + (sec || 2.5));
    } catch (_) {}
  }

  function fadeOutSong(sec) {
    if (!songGain || !ac) return;
    try {
      const t = ac.currentTime;
      const g = songGain.gain;
      const cur = Math.max(0.0001, g.value);
      if (typeof g.cancelScheduledValues === 'function') g.cancelScheduledValues(t);
      g.setValueAtTime(cur, t);
      g.linearRampToValueAtTime(0.0001, t + (sec || 1.0));
      g.setValueAtTime(0, t + (sec || 1.0) + 0.02);
    } catch (_) {}
  }

  function drawDeskLampOffCover(c, offK) {
    if (offK <= 0.01) return;
    c.save();
    c.globalAlpha *= offK;
    c.translate(306, 146);
    c.rotate(0.56);

    c.fillStyle = '#121015';
    c.beginPath();
    c.ellipse(20, 2, 19, 41, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#18161c';
    c.beginPath();
    c.moveTo(-42, -16);
    c.quadraticCurveTo(-24, -40, 20, -40);
    c.lineTo(24, 40);
    c.quadraticCurveTo(-24, 40, -42, 16);
    c.closePath();
    c.fill();

    c.strokeStyle = 'rgba(72,66,76,0.45)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(22, 0, 8.5, 39.5, 0, -1.45, 1.45);
    c.stroke();
    c.restore();
  }

  function drawHairTieOnSpiral(c, x, y) {
    c.save();

    // Hai dải ruy băng xanh nhạt mảnh rủ xuống và chiếc scrunchie trắng ngà nhăn bồng
    const ribDrop = 58;
    const drawRibbons = (isShadow) => {
      c.save();
      c.lineCap = 'round';
      c.lineJoin = 'round';
      if (isShadow) c.translate(2.5, 4);

      // dải ruy băng trái hơi uốn lượn
      c.beginPath();
      c.moveTo(x - 10, y + 10);
      c.bezierCurveTo(x - 16, y + 26, x - 21, y + 44, x - 23, y + ribDrop);
      c.lineTo(x - 18, y + ribDrop - 4);
      c.lineTo(x - 14, y + ribDrop + 2);
      c.bezierCurveTo(x - 11, y + 42, x - 7, y + 25, x - 2, y + 11);
      c.closePath();
      c.fillStyle = isShadow ? 'rgba(20,30,45,0.22)' : '#9ec6e4';
      c.fill();

      // dải ruy băng phải buông chếch nhẹ
      c.beginPath();
      c.moveTo(x + 4, y + 10);
      c.bezierCurveTo(x + 11, y + 25, x + 16, y + 42, x + 19, y + ribDrop - 2);
      c.lineTo(x + 13, y + ribDrop - 5);
      c.lineTo(x + 9, y + ribDrop + 1);
      c.bezierCurveTo(x + 6, y + 40, x + 2, y + 24, x - 3, y + 11);
      c.closePath();
      c.fillStyle = isShadow ? 'rgba(20,30,45,0.20)' : '#add2ec';
      c.fill();

      if (!isShadow) {
        c.strokeStyle = 'rgba(232,245,255,0.55)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(x - 7, y + 13);
        c.bezierCurveTo(x - 12, y + 28, x - 16, y + 42, x - 18, y + ribDrop - 7);
        c.moveTo(x + 2, y + 13);
        c.bezierCurveTo(x + 8, y + 27, x + 12, y + 40, x + 14, y + ribDrop - 7);
        c.stroke();
      }
      c.restore();
    };

    // Các cụm vải tròn chồng nhau tạo vòng scrunchie trắng ngà nhăn bồng
    const puffs = [
      [-28, 2, 11.0],
      [-21, -7, 10.5],
      [-8, -10, 10.8],
      [7, -10, 10.6],
      [21, -7, 10.5],
      [28, 2, 11.0],
      [18, 9, 10.4],
      [3, 10, 10.6],
      [-14, 9, 10.6],
    ];

    // Bóng đổ mềm của scrunchie và ruy băng lên mặt tờ lịch
    c.save();
    c.beginPath();
    c.rect(CAL_GEO.x, CAL_GEO.y, CAL_GEO.w, CAL_GEO.h);
    c.clip();
    drawRibbons(true);
    c.fillStyle = 'rgba(20,28,40,0.22)';
    puffs.forEach(([px, py, pr]) => {
      c.beginPath();
      c.arc(x + px + 2, y + py + 5, pr * 1.04, 0, Math.PI * 2);
      c.fill();
    });
    c.restore();

    // Vẽ hai dải ruy băng xanh nhạt phía dưới nút buộc
    drawRibbons(false);

    // Lớp đáy tối nhẹ tạo khối vải nhăn của scrunchie trắng ngà
    puffs.forEach(([px, py, pr]) => {
      c.fillStyle = '#d3cbbd';
      c.beginPath();
      c.arc(x + px, y + py + 1.8, pr, 0, Math.PI * 2);
      c.fill();
    });

    // Lớp vải chính trắng ngà + nếp nhăn hướng tâm
    puffs.forEach(([px, py, pr], idx) => {
      c.fillStyle = idx % 2 === 0 ? '#f0ebe0' : '#ebe4d6';
      c.beginPath();
      c.arc(x + px, y + py, pr * 0.92, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = 'rgba(162,150,132,0.34)';
      c.lineWidth = 1.2;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x + px * 0.62, y + py * 0.62);
      c.quadraticCurveTo(x + px * 0.85, y + py * 0.85 + 2, x + px * 1.06, y + py * 1.05);
      c.stroke();
    });

    // Chấm sáng nhẹ phía trên do ánh đèn bàn hắt xuống
    c.fillStyle = 'rgba(255,252,244,0.68)';
    [[-16, -8, 5.0], [-3, -11, 5.6], [12, -10, 4.8]].forEach(([hx, hy, hr]) => {
      c.beginPath();
      c.arc(x + hx, y + hy, hr, 0, Math.PI * 2);
      c.fill();
    });

    // Nút thắt ruy băng nhỏ ở phần đáy scrunchie
    c.fillStyle = '#97c1e0';
    roundRect(c, x - 7, y + 6, 12, 8, 3.5);
    c.fill();
    c.fillStyle = 'rgba(230,244,255,0.5)';
    roundRect(c, x - 5, y + 7, 7, 3, 1.5);
    c.fill();

    c.restore();
  }

  function bakeCal() {
    if (!cv.width || !cv.height) return;
    const [c0, g0] = makeBuf(cv.width, cv.height);
    setT(g0);

    // Nền phòng tối với quầng sáng ấm dịu hắt quanh trang lịch
    g0.fillStyle = '#060504';
    g0.fillRect(-300, -300, W + 600, H + 600);

    const wallLight = g0.createRadialGradient(735, 310, 40, 785, 390, 560);
    wallLight.addColorStop(0, '#221810');
    wallLight.addColorStop(0.42, '#130d09');
    wallLight.addColorStop(1, 'rgba(6,5,4,0)');
    g0.fillStyle = wallLight;
    g0.fillRect(-300, -300, W + 600, H + 600);

    const { x, y, w, h, padX, headY, dowY, gridY, rowH } = CAL_GEO;
    const illusH = Math.round(h * 0.25);

    // Bóng mềm sau xấp lịch treo tường
    g0.fillStyle = 'rgba(0,0,0,0.48)';
    roundRect(g0, x + 10, y + 14, w, h + 6, 5);
    g0.fill();
    g0.fillStyle = 'rgba(0,0,0,0.34)';
    roundRect(g0, x + 4, y + 6, w, h + 3, 5);
    g0.fill();

    // Các tờ lịch sau tạo độ dày
    g0.fillStyle = '#c4c1b9';
    roundRect(g0, x + 3, y + 5, w, h, 4);
    g0.fill();
    g0.fillStyle = '#d8d5cd';
    roundRect(g0, x + 1.5, y + 2.5, w, h, 4);
    g0.fill();

    // Tờ giấy lịch chính (giấy trắng ngà dưới ánh đèn bàn)
    const paperG = g0.createLinearGradient(x, y, x + w, y + h);
    paperG.addColorStop(0, '#f5f2eb');
    paperG.addColorStop(0.58, '#edeae2');
    paperG.addColorStop(1, '#e1ddd3');
    g0.fillStyle = paperG;
    roundRect(g0, x, y, w, h, 4);
    g0.fill();

    // Dải minh hoạ trên cùng (~25% chiều cao trang): nền xanh da trời nhạt + khối hình học nhỏ
    g0.save();
    roundRect(g0, x, y, w, h, 4);
    g0.clip();
    const skyG = g0.createLinearGradient(x, y, x, y + illusH);
    skyG.addColorStop(0, '#96c4e6');
    skyG.addColorStop(1, '#c8e3f5');
    g0.fillStyle = skyG;
    g0.fillRect(x, y, w, illusH);

    // Dải nền chân trời nhẹ phía dưới dải minh hoạ
    g0.fillStyle = '#aacbdd';
    g0.fillRect(x, y + illusH - 24, w, 24);
    g0.fillStyle = 'rgba(32,58,92,0.12)';
    g0.beginPath();
    g0.ellipse(x + w * 0.52, y + illusH - 20, 128, 7, 0, 0, Math.PI * 2);
    g0.fill();

    // Các khối hình học mềm xếp chồng giống lịch trên tường (lam, vàng, cam, tím - không chữ, không logo)
    const drawGeoBlock = (bx, by, bw, bh, br, fCol, sCol) => {
      g0.fillStyle = 'rgba(24,42,68,0.14)';
      roundRect(g0, bx - 3, by + 3, bw, bh, br);
      g0.fill();
      g0.fillStyle = fCol;
      roundRect(g0, bx, by, bw, bh, br);
      g0.fill();
      g0.fillStyle = sCol;
      roundRect(g0, bx + bw * 0.72, by, bw * 0.28, bh, Math.min(br, 4));
      g0.fill();
    };
    const bBaseY = y + illusH - 22;
    drawGeoBlock(x + 152, bBaseY - 48, 86, 48, 5, '#4c80b4', '#396796');
    drawGeoBlock(x + 230, bBaseY - 36, 94, 36, 5, '#e8be56', '#cca03c');
    drawGeoBlock(x + 186, bBaseY - 78, 66, 32, 5, '#df7d4a', '#be6236');
    drawGeoBlock(x + 258, bBaseY - 64, 52, 28, 5, '#8a6eb0', '#6f5494');

    // Đường ngăn mảnh giữa dải minh hoạ và phần lịch trắng
    g0.fillStyle = 'rgba(30,58,96,0.12)';
    g0.fillRect(x, y + illusH, w, 1.5);
    g0.restore();

    // Lỗ đục gáy lò xo trên
    const holes = 14;
    const hx0 = x + 30;
    const hxStep = (w - 60) / (holes - 1);
    const holeY = y + 15;
    for (let i = 0; i < holes; i++) {
      const hx = hx0 + i * hxStep;
      g0.fillStyle = '#1b1e24';
      g0.beginPath();
      g0.arc(hx, holeY, 4.6, 0, Math.PI * 2);
      g0.fill();
    }

    // Tiêu đề "Tháng 11" màu xanh lam đậm, căn trái gọn trong lề, kiểm bề rộng không tràn
    const innerW = w - padX * 2;
    g0.fillStyle = '#1e4478';
    g0.textAlign = 'left';
    g0.textBaseline = 'middle';
    let titleFs = 32;
    while (titleFs > 18) {
      g0.font = `600 ${titleFs}px ${CAL_FONT}`;
      if (g0.measureText(KET2_CAL_TITLE).width <= innerW) break;
      titleFs--;
    }
    g0.fillText(KET2_CAL_TITLE, x + padX, headY, innerW);

    // Đường kẻ mảnh dưới tiêu đề
    g0.strokeStyle = 'rgba(34,64,106,0.20)';
    g0.lineWidth = 1;
    g0.beginPath();
    g0.moveTo(x + padX, headY + 23);
    g0.lineTo(x + w - padX, headY + 23);
    g0.stroke();

    // Tên các thứ (7 cột: T2 -> CN)
    const colW = innerW / 7;
    g0.textAlign = 'center';
    g0.font = `600 15px ${UI_FONT}`;
    for (let col = 0; col < 7; col++) {
      const cx = x + padX + (col + 0.5) * colW;
      g0.fillStyle = col === 6 ? '#963532' : '#4a5a70';
      g0.fillText(KET2_DOW[col], cx, dowY);
    }

    g0.strokeStyle = 'rgba(34,64,106,0.18)';
    g0.beginPath();
    g0.moveTo(x + padX, dowY + 15);
    g0.lineTo(x + w - padX, dowY + 15);
    g0.stroke();

    // Lưới 7 cột nhẹ
    g0.strokeStyle = 'rgba(34,64,106,0.09)';
    g0.lineWidth = 1;
    for (let row = 1; row <= 5; row++) {
      const ly = gridY + row * rowH;
      g0.beginPath();
      g0.moveTo(x + padX, ly);
      g0.lineTo(x + w - padX, ly);
      g0.stroke();
    }
    for (let col = 1; col < 7; col++) {
      const lx = x + padX + col * colW;
      g0.beginPath();
      g0.moveTo(lx, gridY + 4);
      g0.lineTo(lx, gridY + 6 * rowH - 4);
      g0.stroke();
    }

    // Các ngày 1-30 của tháng 11/2026 (ngày 1 là Chủ nhật)
    const first = (new Date(2026, 10, 1).getDay() + 6) % 7;
    g0.font = `600 21px ${UI_FONT}`;
    for (let d = 1; d <= 30; d++) {
      const idx = first + d - 1;
      const col = idx % 7;
      const row = Math.floor(idx / 7);
      const cx = x + padX + (col + 0.5) * colW;
      const cy = gridY + (row + 0.5) * rowH;
      g0.fillStyle = col === 6 ? '#8f2f2d' : '#242d3a';
      g0.fillText(String(d), cx, cy);
    }

    // Ánh đèn ấm mềm hắt chéo từ góc trên trái xuống trang lịch
    g0.save();
    roundRect(g0, x, y, w, h, 4);
    g0.clip();
    const sheetLight = g0.createRadialGradient(x + 95, y + 60, 20, x + 210, y + 210, 480);
    sheetLight.addColorStop(0, 'rgba(255,244,218,0.20)');
    sheetLight.addColorStop(0.58, 'rgba(255,226,184,0.05)');
    sheetLight.addColorStop(1, 'rgba(18,22,30,0.16)');
    g0.fillStyle = sheetLight;
    g0.fillRect(x, y, w, h);
    g0.restore();

    // Gáy lò xo kim loại phía trên
    g0.lineCap = 'round';
    for (let i = 0; i < holes; i++) {
      const hx = hx0 + i * hxStep;
      g0.strokeStyle = '#606670';
      g0.lineWidth = 4.4;
      g0.beginPath();
      g0.moveTo(hx - 4, holeY + 1);
      g0.bezierCurveTo(hx - 6, y - 22, hx + 6, y - 22, hx + 4, holeY);
      g0.stroke();

      g0.strokeStyle = '#d4dae2';
      g0.lineWidth = 1.6;
      g0.beginPath();
      g0.moveTo(hx - 2.5, y - 7);
      g0.quadraticCurveTo(hx, y - 19, hx + 3, y - 7);
      g0.stroke();
    }

    // Scrunchie trắng ngà nhăn bồng có hai dải ruy băng xanh nhạt vắt qua gáy lò xo
    drawHairTieOnSpiral(g0, x + w * 0.48, y - 2);

    // Tối nhẹ bốn góc phòng
    vignette(g0, 0.54);

    calC = c0;
    calW = cv.width;
    calH = cv.height;
  }

  function beginKet2(isReplay) {
    if (!ket2.hadSavedBack) {
      ket2.savedBack = SC.dan.back;
      ket2.hadSavedBack = true;
    }
    ket2.on = true;
    ket2.t = 0;
    ket2.exiting = false;
    ket2.exitT = 0;
    ket2.navigated = false;
    heldKey = null;
    SC.dan.tay = null;
    SC.dan.back = null;
    SC.dan.noBag = true;
    HINT.off = true;
    HINT.text = '';
    if (isReplay) warm = 1;
    if (!isReplay) saveKet2Xong();
    ensureKet2Fonts();
    playLampSwitchOff();
    try { if (window.KET2PHIM && KET2PHIM.reset) KET2PHIM.reset(); } catch (_) {}
    try { if (window.KET2GL) KET2GL.nap(); } catch (_) {} // bản 3D "Mưa rơi ngược": nạp sẵn từ lúc đèn tắt
  }

  function drawCalRedLoop(c, prog, alpha) {
    if (prog <= 0.004 || CAL_LOOP_PTS.length < 2) return;
    const maxF = prog * (CAL_LOOP_PTS.length - 1);
    const whole = Math.floor(maxF);
    const frac = maxF - whole;

    c.save();
    c.globalAlpha *= alpha;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    for (let pass = 0; pass < 2; pass++) {
      const dx = pass === 0 ? 0 : 0.6;
      const dy = pass === 0 ? 0 : 0.45;
      c.strokeStyle = pass === 0 ? 'rgba(186,34,32,0.92)' : 'rgba(140,20,20,0.44)';
      c.lineWidth = pass === 0 ? 2.7 : 1.15;
      c.beginPath();
      c.moveTo(CAL_LOOP_PTS[0][0] + dx, CAL_LOOP_PTS[0][1] + dy);
      for (let i = 1; i <= whole; i++) {
        c.lineTo(CAL_LOOP_PTS[i][0] + dx, CAL_LOOP_PTS[i][1] + dy);
      }
      if (whole < CAL_LOOP_PTS.length - 1 && frac > 0) {
        const p0 = CAL_LOOP_PTS[whole];
        const p1 = CAL_LOOP_PTS[whole + 1];
        c.lineTo(lerp(p0[0], p1[0], frac) + dx, lerp(p0[1], p1[1], frac) + dy);
      }
      c.stroke();
    }
    c.restore();
  }

  function drawKet2Btn(c, btn, alpha) {
    if (alpha <= 0.01) return;
    c.save();
    c.font = `400 26px ${HAND}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const w = c.measureText(btn.label).width;
    c.fillStyle = `rgba(232,218,192,${0.56 * alpha})`;
    c.fillText(btn.label, btn.x, btn.y);
    c.strokeStyle = `rgba(232,218,192,${0.22 * alpha})`;
    c.lineWidth = 1.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(btn.x - w * 0.5, btn.y + 15);
    c.quadraticCurveTo(btn.x, btn.y + 16.5, btn.x + w * 0.5, btn.y + 14.5);
    c.stroke();
    c.restore();
  }

  // S 34 → 48: phòng tối, năm phím màu phát sáng như năm đốm lửa nhỏ; 44 → 48 bay vút lên khỏi đàn
  function drawKet2Dau(c, S, now) {
    const ba = c.globalAlpha;
    const darkK = ease(clamp((S - K2_BAT_DAU) / 2.5, 0, 1));
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = `rgba(6,5,4,${(darkK * 0.86 * ba).toFixed(3)})`; c.fillRect(0, 0, cv.width, cv.height);
    c.restore(); setT(c);
    const C = window.KET2_CANH, ids = ['Mi4', 'Si4', 'La4', 'Đô#5', 'Fa#5'];
    const sang = ease(clamp((S - K2_BAT_DAU - 1.2) / 3.0, 0, 1));
    if (sang <= 0) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    ids.forEach((id, i) => {
      const [kx, ky] = C.phim[id], rgb = C.mau[id];
      const bay = ease(clamp((S - 44 - i * 0.45) / 2.2, 0, 1));
      const x = kx + (800 - kx) * 0.35 * bay + Math.sin(S * 1.3 + i) * 3 * (1 - bay);
      const y = ky - (ky + 160) * bay;
      const tho = 0.82 + 0.18 * Math.sin(S * 2.1 + i * 1.7);
      const r = (34 + 10 * tho) * (1 - 0.35 * bay);
      if (bay > 0.02) { // vệt đuôi
        const tail = c.createLinearGradient(x, y, x, y + 160 * bay);
        tail.addColorStop(0, `rgba(${rgb},${(0.42 * sang).toFixed(3)})`); tail.addColorStop(1, `rgba(${rgb},0)`);
        c.fillStyle = tail; c.fillRect(x - 5, y, 10, 160 * bay);
      }
      const g = c.createRadialGradient(x, y, 0, x, y, r * 2.4);
      g.addColorStop(0, `rgba(255,246,228,${(0.95 * sang * ba).toFixed(3)})`);
      g.addColorStop(0.18, `rgba(${rgb},${(0.75 * sang * tho * ba).toFixed(3)})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.4, 0, Math.PI * 2); c.fill();
    });
    c.restore();
  }

  function drawKet2(c, now, dt) {
    if (!ket2.on) return;
    const ba = c.globalAlpha;
    const S = ket2S();
    let gl3 = false; // bản 3D vẽ trên canvas riêng phủ lên; không chạy được thì dùng bản 2D cũ
    try { gl3 = !!(window.KET2GL && KET2GL.frame(S, now, dt)); } catch (_) { gl3 = false; }
    if (S < K2_PHIM) { drawKet2Dau(c, S, now); return; }
    if (S < K2_LICH) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#060504'; c.fillRect(0, 0, cv.width, cv.height); c.restore(); setT(c);
      try { if (!gl3 && window.KET2PHIM && KET2PHIM.draw) { c.save(); KET2PHIM.draw(c, S, now, dt); c.restore(); setT(c); c.globalAlpha = ba; } } catch (e) { setT(c); c.globalAlpha = ba; }
      return;
    }
    // trang lịch: dùng lại nhịp cũ (lịch hiện ở 11.9, vòng đỏ 13.45, "đón em" 14.7, nút 18.5)
    const t = 11.9 + (S - K2_LICH);

    // Bước 1 (0 -> 2.5s): cảnh tối dần về màn đen sau khi tắt đèn bàn
    if (t < 2.5) {
      const darkK = ease(clamp(t / 2.5, 0, 1));
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = `rgba(6,5,4,${darkK * ba})`;
      c.fillRect(0, 0, cv.width, cv.height);
      c.restore();
      setT(c);
      return;
    }

    // Từ 2.5s trở đi: nền đen toàn màn hình
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = ba;
    c.fillStyle = '#060504';
    c.fillRect(0, 0, cv.width, cv.height);
    c.restore();
    setT(c);

    // Bước 2 (4.0 -> 11.4s): "Đến ôm em bằng được." viết lộ trái sang phải, giữ 4s, mờ đi
    if (t >= 4.0 && t < 11.4) {
      const rev = clamp((t - 4.0) / 2.2, 0, 1);
      const fadeOut = t >= 10.2 ? 1 - ease(clamp((t - 10.2) / 1.2, 0, 1)) : 1;
      const lineA = ba * fadeOut;
      if (lineA > 0.005) {
        c.save();
        c.font = `700 74px ${SCRIPT}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        let tw = ket2.lineW;
        if (!tw) {
          tw = c.measureText(KET2_LINE).width;
          if (typeof document === 'undefined' || !document.fonts || document.fonts.status === 'loaded') {
            ket2.lineW = tw;
          }
        }
        c.fillStyle = '#f4e6cc';
        if (rev >= 1) {
          c.globalAlpha = lineA;
          c.fillText(KET2_LINE, 800, 442);
        } else {
          const x0 = 800 - tw * 0.5 - 32;
          const x1 = 800 + tw * 0.5 + 32;
          const wp = 0.25 * rev + 0.75 * ease(rev);
          const cutX = lerp(x0, x1, wp);
          const fw = 28;
          const bodyW = cutX - fw - x0;
          if (bodyW > 0) {
            c.save();
            c.beginPath();
            c.rect(x0, 340, bodyW, 210);
            c.clip();
            c.globalAlpha = lineA;
            c.fillText(KET2_LINE, 800, 442);
            c.restore();
          }
          const strips = 4;
          const sw = fw / strips;
          for (let i = 0; i < strips; i++) {
            const sx = cutX - fw + i * sw;
            if (sx + sw <= x0) continue;
            c.save();
            c.beginPath();
            c.rect(Math.max(x0, sx), 340, sw + 0.5, 210);
            c.clip();
            c.globalAlpha = lineA * (0.78 - i * 0.21);
            c.fillText(KET2_LINE, 800, 442);
            c.restore();
          }
        }
        c.restore();
      }
    }

    // Bước 3 (11.9s+): Trang lịch tháng 11, khoanh 28-29 bút đỏ, "đón em"
    if (t >= 11.9) {
      if (!calC || calW !== cv.width || calH !== cv.height) bakeCal();
      const calA = ease(clamp((t - 11.9) / 1.4, 0, 1));
      if (calC && calA > 0.004) {
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = ba * calA;
        c.drawImage(calC, 0, 0);
        c.restore();
        setT(c);
      }

      const loopP = ease(clamp((t - 13.45) / 1.2, 0, 1));
      if (loopP > 0.004) {
        drawCalRedLoop(c, loopP, ba * calA);
      }

      const noteP = ease(clamp((t - 14.70) / 0.8, 0, 1));
      if (noteP > 0.004) {
        const colW = (CAL_GEO.w - CAL_GEO.padX * 2) / 7;
        const noteX = CAL_GEO.x + CAL_GEO.padX + 6 * colW - 4;
        const noteY = CAL_GEO.gridY + 5.5 * CAL_GEO.rowH - 2;
        c.save();
        c.translate(noteX, noteY);
        c.rotate(-0.045);
        c.beginPath();
        c.rect(-64, -28, 128 * noteP, 56);
        c.clip();
        c.globalAlpha = ba * Math.min(1, noteP * 1.15);
        c.fillStyle = '#b42322';
        c.font = `700 28px ${SCRIPT}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(KET2_CAL_NOTE, 0, 0);
        c.restore();
      }
    }

    // Bước 4 (18.5s+, tức 3s sau khi xong trang lịch): 2 nút viết tay nhỏ mờ ở dưới
    if (t >= 18.5) {
      const btnA = ba * ease(clamp((t - 18.5) / 0.9, 0, 1));
      drawKet2Btn(c, BTN_REPLAY, btnA);
      drawKet2Btn(c, BTN_HOME, btnA);
    }

    // Fade 1s khi rời về trang chủ
    if (ket2.exiting) {
      const exitK = ease(clamp(ket2.exitT / 1.0, 0, 1));
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = ba;
      c.fillStyle = `rgba(6,5,4,${exitK})`;
      c.fillRect(0, 0, cv.width, cv.height);
      c.restore();
      setT(c);
    }
  }

  function leaveToHome() {
    if (ket2.navigated) return;
    ket2.navigated = true;
    location.replace('?phong=13&tu=1');
  }

  function hitKet2Btn(p, btn) {
    return Math.abs(p[0] - btn.x) <= btn.hw && Math.abs(p[1] - btn.y) <= btn.hh;
  }

  function tapKet2(p) {
    if (ket2.exiting) return;
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    if (ket2S() < K2_LICH + 6.7) return;

    if (hitKet2Btn(p, BTN_REPLAY)) {
      // Xem lại: phát lại bài từ cuối điệp khúc 1 (đèn tắt) và chạy lại cả hoạt cảnh
      if (songBuf) tuaBai(K2_BAT_DAU);
      beginKet2(true);
      return;
    }

    if (hitKet2Btn(p, BTN_HOME)) {
      ket2.exiting = true;
      ket2.exitT = 0;
      fadeOutSong(1.0);
      setTimeout(leaveToHome, 1120);
    }
  }

  SC.dan = {
    xong: false,
    tapBelow: true,
    hintY: 788,
    back: null,
    tay: null,
    co: { 'Mi4': INIT_DU, 'La4': INIT_DU, 'Si4': INIT_DU, 'Đô#5': INIT_DU, 'Fa#5': INIT_DU },

    bake,

    lap(id) {
      if (!COL[id] || SC.dan.co[id]) return false;
      let hadAny = false;
      for (const cid in COL) {
        if (SC.dan.co[cid]) { hadAny = true; break; }
      }
      SC.dan.co[id] = true;
      if (SC.dan.tay === id) SC.dan.tay = null;
      if (!IS_THU) {
        if (typeof BAG !== 'undefined' && Array.isArray(BAG.items)) {
          const itemId = 'manh_' + id;
          BAG.items = BAG.items.filter(it => it.id !== itemId);
          if (BAG.sel === itemId) BAG.sel = null;
        }
        saveKet2Lap(id);
      }
      if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
      const k = KEY_BY_ID[id];
      if (k) {
        k.drop = 1;
        k.dropAt = performance.now();
        k.snapDone = false;
        k.press = 0;
        k.glow = 0;
      }
      showMsg(hadAny ? 'Thêm một phím.' : 'Khớp rồi. Hoá ra là một phím đàn.', 3);
      if (hasAllKeys()) {
        SC.dan.hintY = 788;
        hints([
          'Tờ nhạc trên giá đàn có màu.',
          'Mỗi chấm màu ứng với một phím cùng màu.',
          'Bấm lần lượt từ trái sang phải.'
        ]);
      } else if (!IS_THU) {
        SC.dan.hintY = 788;
        hints([
          'Chạm chiếc máy ở góc để mở túi đồ.',
          'Cây đàn thiếu mấy phím. Đáy mỗi khe có một vệt màu.',
          'Cầm mảnh màu trong túi, chạm vào khe có cùng màu.'
        ]);
      }
      return true;
    },

    enter() {
      stopSong();
      clearThu();
      if (ket2.hadSavedBack) {
        SC.dan.back = ket2.savedBack;
        ket2.hadSavedBack = false;
        ket2.savedBack = null;
      }
      SC.dan.noBag = false;
      ket2.on = false;
      ket2.t = 0;
      ket2.exiting = false;
      ket2.exitT = 0;
      ket2.navigated = false;
      ket2.xemAt = 0;
      step = 0;
      warm = 0;
      errPulse = 0;
      errAt = 0;
      doneAt = 0;
      msgText = '';
      msgAt = 0;
      msgDur = 3;
      pieceShakeAt = 0;
      heldKey = null;
      SC.dan.tay = null;
      SC.dan.xong = false;
      if (INIT_DU) {
        for (const cid in COL) SC.dan.co[cid] = true;
      } else if (!IS_THU) {
        const savedLap = readKet2Lap();
        for (let i = 0; i < savedLap.length; i++) {
          const cid = savedLap[i];
          if (COL[cid]) SC.dan.co[cid] = true;
        }
      }
      dotFlash.fill(0);
      for (let i = 0; i < KEYS.length; i++) {
        KEYS[i].press = 0;
        KEYS[i].glow = 0;
        KEYS[i].drop = 0;
        KEYS[i].dropAt = 0;
        KEYS[i].snapDone = false;
      }
      for (let i = 0; i < DESK_PIECES.length; i++) {
        DESK_PIECES[i].lift = 0;
      }
      if (IS_KETXEM) {
        step = MELODY.length;
        SC.dan.xong = true;
        doneAt = performance.now();
        warm = 1;
        HINT.off = true;
        HINT.text = '';
        ket2.xemAt = doneAt + 2000;
        ensureKet2Fonts();
        scheduleSong();
      } else if (hasAllKeys()) {
        SC.dan.hintY = 788;
        hints([
          'Tờ nhạc trên giá đàn có màu.',
          'Mỗi chấm màu ứng với một phím cùng màu.',
          'Bấm lần lượt từ trái sang phải.'
        ]);
      } else if (IS_THU) {
        SC.dan.hintY = 420;
        hints([
          'Mấy mảnh màu này có vẻ vừa với cái gì đó trên bàn.',
          'Cây đàn thiếu mấy phím. Đáy mỗi khe có một vệt màu.',
          'Cầm mảnh màu, chạm vào khe có cùng màu.'
        ]);
      } else {
        SC.dan.hintY = 788;
        hints([
          'Chạm chiếc máy ở góc để mở túi đồ.',
          'Cây đàn thiếu mấy phím. Đáy mỗi khe có một vệt màu.',
          'Cầm mảnh màu trong túi, chạm vào khe có cùng màu.'
        ]);
      }
      preloadSong();
      if (!bgDark || bgW !== cv.width || bgH !== cv.height) bake();
    },

    draw(c, now, dt) {
      if (!bgDark || bgW !== cv.width || bgH !== cv.height) bake();
      const s = Math.min(0.05, dt || 0.016);
      const ba = c.globalAlpha;

      // Bài hát chưa phát được vì lúc đó chưa có chạm (âm thanh chưa mở): thử lại mỗi khung hình
      if (SC.dan.xong && songWantPlay && !songStarted && typeof ac !== 'undefined' && ac) {
        if (songBuf) playSongNow(); else if (songArr) tryDecodeSong();
      }

      // Kích hoạt đoạn kết khi đủ điều kiện
      if (KET2_ON && !ket2.on && SC.dan.xong) {
        if (songStarted && songT0 !== 0) {
          if (ket2S() >= K2_BAT_DAU) beginKet2(false);
        } else if (IS_KETXEM && !songLoading && !songBuf && ket2.xemAt && now >= ket2.xemAt + 3000) {
          beginKet2(false);
        } else if (!IS_KETXEM) {
          const elapDone = (now - doneAt) / 1000;
          if ((!songLoading && !songDecodeLock && !songBuf && elapDone >= 15.5) || elapDone >= 20.0) {
            beginKet2(false);
          }
        }
      }

      if (ket2.on) {
        ket2.t += s;
        if (ket2.exiting) {
          ket2.exitT += s;
          if (ket2.exitT >= 1.02) leaveToHome();
        }
        if (ket2S() >= K2_PHIM) {
          drawKet2(c, now, dt);
          return;
        }
      }

      const lampLit = ket2.on ? 1 - clamp(ket2.t / 0.14, 0, 1) : 1;

      // Tiến độ sáng dần toàn cảnh khi hoàn thành 10 nốt
      if (SC.dan.xong) {
        const elap = (now - doneAt) / 1000;
        const target = IS_KETXEM ? 1 : (elap > 0.35 ? clamp((elap - 0.35) / 2.2, 0, 1) : 0);
        warm = IS_KETXEM ? 1 : lerp(warm, target, Math.min(1, s * 2.8));
      } else {
        warm = 0;
      }
      const wEase = ease(warm);

      if (errPulse > 0) {
        errPulse = Math.max(0, errPulse - s * 0.44);
      }
      for (let i = 0; i < dotFlash.length; i++) {
        if (dotFlash[i] > 0) dotFlash[i] = Math.max(0, dotFlash[i] - s * 1.8);
      }
      for (let i = 0; i < DESK_PIECES.length; i++) {
        const dp = DESK_PIECES[i];
        const targetLift = SC.dan.tay === dp.id ? 1 : 0;
        dp.lift = lerp(dp.lift, targetLift, Math.min(1, s * 14));
      }
      for (let i = 0; i < KEYS.length; i++) {
        const k = KEYS[i];
        if (k.drop > 0 && k.dropAt) {
          const elap = Math.max(0, (now - k.dropAt) / 1000);
          if (elap >= 0.58) {
            k.drop = 0;
            k.dropAt = 0;
            if (!k.snapDone) {
              k.snapDone = true;
              k.press = 0.32;
              k.glow = 1;
              if (elap < 1.2) playKeySnap(k.pan);
            }
          } else {
            k.drop = 1 - clamp(elap / 0.58, 0, 1);
          }
        }
        const minPress = heldKey === k ? 0.85 : 0;
        if (k.press > minPress) {
          k.press = Math.max(minPress, k.press - s * 5.2);
        } else if (k.press < minPress) {
          k.press = Math.min(minPress, k.press + s * 14);
        }
        if (k.glow > 0) k.glow = Math.max(0, k.glow - s * 0.78);
      }

      // 1. Nền phòng, đèn bàn, thân đàn (trộn mượt sang bản sáng ấm khi hoàn thành)
      if (bgDark) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.drawImage(bgDark, 0, 0);
        if (wEase > 0.004 && bgWarm) {
          c.globalAlpha = ba * wEase;
          c.drawImage(bgWarm, 0, 0);
          c.globalAlpha = ba;
        }
        setT(c);
      }

      if (ket2.on) {
        drawDeskLampOffCover(c, 1 - lampLit);
      }

      // 2. Quầng đèn bàn rọi ấm dịu xuống khu vực giá nhạc và phím
      if (warmGlowSpr && lampLit > 0.004) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = ba * lampLit * (0.24 + wEase * 0.24);
        c.drawImage(warmGlowSpr, 220, 40, 860, 560);
        c.globalAlpha = ba * lampLit * (0.22 + wEase * 0.22);
        c.drawImage(warmGlowSpr, 250, 92, 160, 160);
        c.restore();
      }

      // 3. Tờ nhạc trên giá đàn
      drawSheet(c, now, ba, wEase);

      // 4. Khe trống & dãy phím trắng, rồi khe & dãy phím đen (và phím đang trượt lắp vào)
      for (let i = 0; i < WHITE_KEYS.length; i++) {
        if (isSlotOpen(WHITE_KEYS[i])) drawWhiteSlot(c, WHITE_KEYS[i], i, wEase);
      }
      for (let i = 0; i < WHITE_KEYS.length; i++) {
        if (!isSlotOpen(WHITE_KEYS[i])) drawWhiteKey(c, WHITE_KEYS[i], ba, wEase);
      }
      for (let i = 0; i < WHITE_KEYS.length; i++) {
        if (isSlotOpen(WHITE_KEYS[i])) drawWhiteSlotWalls(c, WHITE_KEYS[i], i, wEase);
      }
      for (let i = 0; i < WHITE_KEYS.length; i++) {
        const k = WHITE_KEYS[i];
        if (hasKey(k) && k.drop > 0) drawSlidingKey(c, k, ba, wEase);
      }

      for (let i = 0; i < BLACK_KEYS.length; i++) {
        if (isSlotOpen(BLACK_KEYS[i])) drawBlackSlot(c, BLACK_KEYS[i], wEase);
      }
      for (let i = 0; i < BLACK_KEYS.length; i++) {
        if (!isSlotOpen(BLACK_KEYS[i])) drawBlackKey(c, BLACK_KEYS[i], ba, wEase);
      }
      for (let i = 0; i < BLACK_KEYS.length; i++) {
        const k = BLACK_KEYS[i];
        if (hasKey(k) && k.drop > 0) drawSlidingKey(c, k, ba, wEase);
      }

      // 5. Hạt bụi nhỏ li ti trong ánh đèn ấm
      if (lampLit > 0.01) {
        const tSec = now * 0.001;
        for (let i = 0; i < DUST.length; i++) {
          const d = DUST[i];
          const dx = d.x + Math.sin(tSec * 0.45 * d.sp + d.ph) * 14;
          const dy = d.y + Math.cos(tSec * 0.35 * d.sp + d.ph * 1.3) * 9;
          const da = (0.14 + wEase * 0.22) * (0.65 + 0.35 * Math.sin(tSec * 1.1 + d.ph)) * lampLit;
          c.fillStyle = `rgba(255,222,166,${da})`;
          c.beginPath();
          c.arc(dx, dy, d.r, 0, Math.PI * 2);
          c.fill();
        }
      }

      // 6. Các mảnh màu trên bàn (?thu=1)
      drawDeskPieces(c, now, ba, wEase);

      // 7. Dòng chữ báo lắp phím & nút thử (?thu=1)
      drawToastMsg(c, now, ba);
      drawThuBtn(c, ba);

      if (ket2.on) {
        drawKet2(c, now, dt);
      }
    },

    down(p) {
      if (ket2.on) {
        heldKey = null;
        return false;
      }
      if (IS_THU && hitThuBtn(p)) {
        heldKey = null;
        return false;
      }
      if (laMauTrenBan() && hitDeskPiece(p)) {
        heldKey = null;
        return false;
      }
      const k = hitKey(p);
      heldKey = (k && isKeyReady(k)) ? k : null;
      return false;
    },

    up() {
      heldKey = null;
      return false;
    },

    tap(p) {
      if (ket2.on) {
        tapKet2(p);
        return;
      }
      if (IS_THU && hitThuBtn(p)) {
        runThu();
        return;
      }
      if (laMauTrenBan()) {
        const dp = hitDeskPiece(p);
        if (dp) {
          pieceShakeAt = 0;
          if (SC.dan.tay === dp.id) {
            SC.dan.tay = null;
            playPiecePut(piecePan(dp));
          } else {
            SC.dan.tay = dp.id;
            playPiecePick(piecePan(dp));
          }
          return;
        }
      }
      const k = hitKey(p);
      if (!k) return;

      if (!hasKey(k)) {
        const heldId = laMauTrenBan()
          ? SC.dan.tay
          : (typeof BAG !== 'undefined' && BAG.sel && BAG.sel.indexOf('manh_') === 0 ? BAG.sel.slice(5) : null);
        if (heldId) {
          if (heldId === k.id) {
            SC.dan.lap(k.id);
          } else {
            playWrongSlot(k.pan);
            pieceShakeAt = performance.now();
            showMsg('Không vừa chỗ này.', 2);
          }
        } else if (!laMauTrenBan() && typeof BAG !== 'undefined' && BAG.sel) {
          playWrongSlot(k.pan);
          showMsg('Không vừa chỗ này.', 2);
        } else {
          playSlotTap(k.pan);
        }
        return;
      }
      if (k.drop > 0) return;

      k.press = 1;
      k.glow = 1;
      playPianoNote(k.freq, k.pan);

      if (step < MELODY.length) {
        if (k.id === MELODY[step].k) {
          dotFlash[step] = 1;
          step += 1;
          errPulse = 0;
          if (step >= MELODY.length && hasAllKeys()) {
            SC.dan.xong = true;
            doneAt = performance.now();
            HINT.off = true;
            HINT.text = '';
            scheduleSong();
          }
        } else {
          errPulse = 1;
          errAt = performance.now();
        }
      }
    }
  };

  // Mở thẳng cảnh bằng ?phong=11 (bọc START giống p7.js)
  if (Q11.get('phong') === '11') {
    const st0 = START;
    START = () => {
      st0();
      INTRO.t = 9;
      setTimeout(() => {
        if (typeof P1 !== 'undefined') Object.assign(P1, { torch: true, calm: true, calmT: 99, done: true });
        if (typeof quietPast === 'function') quietPast(0.2);
        for (const cid in COL) SC.dan.co[cid] = INIT_DU;
        go('dan', 400);
      }, 300);
    };
  }
})();
