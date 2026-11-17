// Phòng trọ 502 · Băng số 2 · Kết 2
// Khớp đúng phối cảnh và bố cục của cảnh phòng anh (SC.anh1 trong anh.js):
//   - SC.p502: góc bàn làm việc, dùng lại hình đã nướng anhC + drawAnhDyn của anh.js,
//              thêm 5 khe trống sáng nhẹ trên cây đàn, chạm vào đàn mở cảnh cận SC.dan.
//   - SC.p502sau: quay lại phía sau (sau lưng chiếc ghế), cùng hệ phối cảnh P/box/seg của p1.js
//                 (CAM.y = 1.45), nguồn sáng chính từ đèn bàn sau lưng người xem.
//   - Chuyển qua lại bằng một mũi tên vẽ tay nhỏ, mảnh ở mép dưới.
(() => {
  'use strict';

  const NO_BUZZ = [];
  const NAV_R = { x: 685, y: 695, w: 230, h: 108 };
  const KB_RECT = { x: 1030, y: 550, w: 660, h: 245 };
  const LAMP_R = { x: 576, y: 356, w: 84, h: 128 };
  const CAL_R = { x: 452, y: 256, w: 166, h: 222 };
  const CACTUS_R = { x: 916, y: 500, w: 72, h: 102 };
  const OUT_LABEL_R = { x: 145, y: 535, w: 96, h: 90 };
  const Q12 = new URLSearchParams(location.search);

  // ================= TRẠNG THÁI & LƯU KẾT 2 ('lpn:ket2') =================
  const KET2_KEY = 'lpn:ket2';
  // ?xoa502=1: xoá tiến trình Kết 2 để chơi lại từ đầu (thử nghiệm)
  try { if (/[?&]xoa502=1/.test(location.search)) { ['lpn:ket2', 'lpn:ket2ngoai', 'lpn:bang2manh'].forEach(k => localStorage.removeItem(k)); history.replaceState(null, '', location.pathname + location.search.replace(/[?&]xoa502=1/, '').replace(/^&/, '?')); } } catch (e) {}
  const MANH2_KEY = 'lpn:bang2manh';

  const MANH_META = {
    'Mi4':  { label: 'mảnh nhựa màu cam',    rgb: '218,158,58',  rim: '246,198,108', glow: '252,208,118' },
    'Si4':  { label: 'mảnh nhựa màu tím',    rgb: '156,104,158', rim: '198,150,200', glow: '214,166,216' },
    'La4':  { label: 'mảnh nhựa màu đỏ cam', rgb: '214,102,76',  rim: '245,146,118', glow: '250,156,126' },
    'Fa#5': { label: 'mảnh nhựa màu hồng',   rgb: '216,122,146', rim: '246,164,186', glow: '252,174,194' },
    'Đô#5': { label: 'mảnh nhựa màu xanh',   rgb: '116,166,104', rim: '158,206,144', glow: '168,216,154' },
  };

  const ket2 = {
    manh: [],
    lap: [],
    denLen: false,
    chia: false,
    chiatu: false,
    tuMo: false,
    cuc: [false, false],
  };

  let lastHintStep = -1;
  let lastHintGroup = '';
  let pendingLa4ReturnSay = false;
  let la4BackSaid = false;
  let sauStep3BoostAt = 0;

  function uniqPush(arr, id) {
    if (typeof id === 'string' && id && arr.indexOf(id) < 0) arr.push(id);
  }

  function loadKet2() {
    let dirty = false;
    try {
      const raw = localStorage.getItem(KET2_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === 'object') {
          if (Array.isArray(d.manh)) {
            for (let i = 0; i < d.manh.length; i++) uniqPush(ket2.manh, d.manh[i]);
          }
          if (Array.isArray(d.lap)) {
            for (let i = 0; i < d.lap.length; i++) uniqPush(ket2.lap, d.lap[i]);
          }
          if (typeof d.denLen === 'boolean') ket2.denLen = d.denLen;
          if (typeof d.chia === 'boolean') ket2.chia = d.chia;
          if (typeof d.chiatu === 'boolean') ket2.chiatu = d.chiatu;
          if (typeof d.tuMo === 'boolean') ket2.tuMo = d.tuMo;
          if (Array.isArray(d.cuc) && d.cuc.length >= 2) {
            ket2.cuc = [!!d.cuc[0], !!d.cuc[1]];
          }
        }
      }
    } catch (_) {}
    try {
      const raw2 = localStorage.getItem(MANH2_KEY);
      if (raw2) {
        const arr2 = JSON.parse(raw2);
        if (Array.isArray(arr2)) {
          for (let i = 0; i < arr2.length; i++) {
            if (ket2.manh.indexOf(arr2[i]) < 0) {
              uniqPush(ket2.manh, arr2[i]);
              dirty = true;
            }
          }
        }
      }
    } catch (_) {}
    if (Q12.get('tu') === '1' && ket2.manh.indexOf('Mi4') < 0 && ket2.lap.indexOf('Mi4') < 0) {
      ket2.manh.push('Mi4');
      dirty = true;
    }
    if (dirty) saveKet2();
  }

  function saveKet2() {
    try {
      let prev = null;
      try {
        const raw = localStorage.getItem(KET2_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (p && typeof p === 'object') prev = p;
        }
      } catch (_) {}
      const out = Object.assign({}, prev || {}, {
        manh: ket2.manh.slice(),
        lap: ket2.lap.slice(),
        denLen: !!ket2.denLen,
        chia: !!ket2.chia,
        chiatu: !!ket2.chiatu,
        tuMo: !!ket2.tuMo,
        cuc: [!!ket2.cuc[0], !!ket2.cuc[1]],
      });
      delete out.khoa;
      localStorage.setItem(KET2_KEY, JSON.stringify(out));
    } catch (_) {}
  }

  function ket2HasManh(id) {
    return ket2.manh.indexOf(id) >= 0;
  }

  function ket2HasLap(id) {
    return ket2.lap.indexOf(id) >= 0;
  }

  function ket2HasPicked(id) {
    return ket2HasManh(id) || ket2HasLap(id);
  }

  function showSay(s) {
    if (window.KET2_PHIM_DANG) return;
    if (typeof HINT !== 'undefined') HINT.off = false;
    if (typeof sayNow === 'function') {
      sayNow(s);
    } else if (typeof HINT !== 'undefined') {
      HINT.text = s;
      HINT.show = performance.now();
    }
  }

  function clearSay() {
    if (typeof HINT !== 'undefined') {
      HINT.text = '';
      HINT.show = 0;
    }
    if (typeof nudge === 'function') nudge();
  }

  function drawPieceShape(c, s, rgb, rim) {
    const r = s * 0.14;
    c.beginPath();
    c.moveTo(-s * 0.44 + r, -s * 0.24);
    c.lineTo(s * 0.16, -s * 0.24);
    c.lineTo(s * 0.16, -s * 0.08);
    c.lineTo(s * 0.44, -s * 0.08);
    c.lineTo(s * 0.44, s * 0.24 - r);
    c.quadraticCurveTo(s * 0.44, s * 0.24, s * 0.44 - r, s * 0.24);
    c.lineTo(-s * 0.44 + r, s * 0.24);
    c.quadraticCurveTo(-s * 0.44, s * 0.24, -s * 0.44, s * 0.24 - r);
    c.lineTo(-s * 0.44, -s * 0.24 + r);
    c.quadraticCurveTo(-s * 0.44, -s * 0.24, -s * 0.44 + r, -s * 0.24);
    c.closePath();

    c.fillStyle = `rgba(${rgb},0.88)`;
    c.fill();

    c.strokeStyle = `rgba(${rim},0.82)`;
    c.lineWidth = Math.max(1.1, s * 0.036);
    c.stroke();

    c.strokeStyle = 'rgba(255,250,242,0.5)';
    c.lineWidth = Math.max(0.8, s * 0.02);
    c.beginPath();
    c.moveTo(-s * 0.34, -s * 0.14);
    c.lineTo(s * 0.08, -s * 0.14);
    c.stroke();
  }

  function makePieceBagIcon(id) {
    const meta = MANH_META[id] || MANH_META.Mi4;
    return (c, sc) => {
      const s = (sc || 1) * 130; // túi đồ truyền tỉ lệ (0.5–0.82), không phải số điểm ảnh
      c.save();
      c.rotate(-0.34);
      drawPieceShape(c, s, meta.rgb, meta.rim);
      c.restore();
    };
  }

  function drawChiaBag(c, sc) {
    const s = (sc || 1) * 150; // tỉ lệ → điểm ảnh
    c.save();
    // Vòng khoá kim loại
    c.strokeStyle = 'rgba(205,214,226,0.82)';
    c.lineWidth = Math.max(1.4, s * 0.045);
    c.beginPath();
    c.arc(-s * 0.16, -s * 0.22, s * 0.14, 0, Math.PI * 2);
    c.stroke();

    // Điều khiển khoá xe đen mờ
    c.save();
    c.translate(-s * 0.08, s * 0.10);
    c.rotate(-0.42);
    c.fillStyle = '#1b1f26';
    roundRect(c, -s * 0.14, -s * 0.22, s * 0.28, s * 0.44, s * 0.08);
    c.fill();
    c.strokeStyle = 'rgba(180,196,218,0.55)';
    c.lineWidth = Math.max(1, s * 0.025);
    c.stroke();
    c.fillStyle = 'rgba(195,210,228,0.45)';
    c.fillRect(-s * 0.06, -s * 0.09, s * 0.12, s * 0.055);
    c.fillRect(-s * 0.06, s * 0.01, s * 0.12, s * 0.055);
    c.restore();

    // Lưỡi chìa kim loại mảnh
    c.save();
    c.translate(s * 0.06, -s * 0.02);
    c.rotate(0.45);
    c.fillStyle = '#bcc6d4';
    c.fillRect(-s * 0.035, -s * 0.16, s * 0.07, s * 0.46);
    c.fillRect(s * 0.02, s * 0.12, s * 0.045, s * 0.06);
    c.fillRect(s * 0.02, s * 0.22, s * 0.05, s * 0.055);
    c.restore();
    c.restore();
  }

  function drawChiaTuBag(c, sc) {
    const px = (sc || 1) * 130; // tỉ lệ (0.5–0.82) → kích thước điểm ảnh
    c.save();

    // Sợi dây đỏ ngắn buộc qua vòng tròn đầu chìa
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = '#992b25';
    c.lineWidth = Math.max(1.5, px * 0.028);
    c.beginPath();
    c.moveTo(-px * 0.26, -px * 0.15);
    c.quadraticCurveTo(-px * 0.35, -px * 0.04, -px * 0.30, px * 0.15);
    c.moveTo(-px * 0.25, -px * 0.14);
    c.quadraticCurveTo(-px * 0.24, px * 0.02, -px * 0.19, px * 0.18);
    c.stroke();

    c.strokeStyle = 'rgba(232,126,112,0.52)';
    c.lineWidth = Math.max(0.8, px * 0.011);
    c.beginPath();
    c.moveTo(-px * 0.27, -px * 0.14);
    c.quadraticCurveTo(-px * 0.34, -px * 0.04, -px * 0.30, px * 0.11);
    c.stroke();

    // Chiếc chìa đồng nhỏ (tâm vòng tại (-0.16, -0.10), xoay xuống phải)
    c.save();
    c.translate(-px * 0.16, -px * 0.10);
    c.rotate(0.46);

    // Vòng tròn đầu chìa rỗng giữa
    c.fillStyle = '#b48b42';
    c.beginPath();
    c.arc(0, 0, px * 0.135, 0, Math.PI * 2);
    c.arc(0, 0, px * 0.060, 0, Math.PI * 2, true);
    c.fill('evenodd');

    c.strokeStyle = 'rgba(246,222,162,0.62)';
    c.lineWidth = Math.max(0.9, px * 0.014);
    c.beginPath();
    c.arc(0, 0, px * 0.122, -Math.PI * 0.92, -Math.PI * 0.15);
    c.stroke();

    c.strokeStyle = 'rgba(72,48,18,0.55)';
    c.lineWidth = Math.max(0.9, px * 0.014);
    c.beginPath();
    c.arc(0, 0, px * 0.062, 0, Math.PI * 2);
    c.stroke();

    // Cổ chìa + thân chìa mảnh + răng chìa nhỏ hai nấc
    roundRect(c, px * 0.12, -px * 0.042, px * 0.042, px * 0.084, px * 0.014);
    c.fillStyle = '#c9a156';
    c.fill();

    roundRect(c, px * 0.155, -px * 0.025, px * 0.34, px * 0.050, px * 0.014);
    c.fillStyle = '#b0863e';
    c.fill();

    c.beginPath();
    c.moveTo(px * 0.38, px * 0.023);
    c.lineTo(px * 0.38, px * 0.102);
    c.lineTo(px * 0.425, px * 0.102);
    c.lineTo(px * 0.425, px * 0.070);
    c.lineTo(px * 0.452, px * 0.070);
    c.lineTo(px * 0.452, px * 0.102);
    c.lineTo(px * 0.486, px * 0.102);
    c.lineTo(px * 0.486, px * 0.023);
    c.closePath();
    c.fillStyle = '#a47b35';
    c.fill();

    c.strokeStyle = 'rgba(248,226,172,0.68)';
    c.lineWidth = Math.max(0.9, px * 0.013);
    c.beginPath();
    c.moveTo(px * 0.165, -px * 0.014);
    c.lineTo(px * 0.48, -px * 0.014);
    c.stroke();
    c.restore();

    // Nút thắt đỏ nhỏ ôm mép vòng chìa
    c.fillStyle = '#7e211c';
    c.beginPath();
    c.arc(-px * 0.255, -px * 0.155, px * 0.028, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  function addManh(id) {
    const meta = MANH_META[id];
    if (!meta) return;
    uniqPush(ket2.manh, id);
    saveKet2();
    const itemId = 'manh_' + id;
    if (typeof bagHas === 'function' && !bagHas(itemId) && typeof bagAdd === 'function') {
      bagAdd(itemId, meta.label, makePieceBagIcon(id));
    }
  }

  function restoreKet2() {
    loadKet2();
    // Đã vào phòng 502 tức là đã nhặt mảnh cam rơi ở cuối phim; vào thẳng bằng link hay mất dữ liệu thì vẫn trả mảnh ấy vào túi
    if (!ket2.manh.includes('Mi4')) { ket2.manh.unshift('Mi4'); saveKet2(); }
    if (typeof SC !== 'undefined' && SC.dan && SC.dan.co) {
      for (let i = 0; i < ket2.lap.length; i++) {
        const id = ket2.lap[i];
        if (MANH_META[id]) SC.dan.co[id] = true;
      }
    }
    for (let i = 0; i < ket2.manh.length; i++) {
      const id = ket2.manh[i];
      const meta = MANH_META[id];
      if (!meta || ket2HasLap(id)) continue;
      const itemId = 'manh_' + id;
      if (typeof bagHas === 'function' && !bagHas(itemId) && typeof bagAdd === 'function') {
        bagAdd(itemId, meta.label, makePieceBagIcon(id));
      }
    }
    if (ket2.chia && typeof bagHas === 'function' && !bagHas('chia') && typeof bagAdd === 'function') {
      bagAdd('chia', 'chìa khoá xe', drawChiaBag);
    }
    if (ket2.chiatu && !ket2.tuMo && typeof bagHas === 'function' && !bagHas('chiatu') && typeof bagAdd === 'function') {
      bagAdd('chiatu', 'chìa khoá tủ', drawChiaTuBag);
    }
    if (ket2.tuMo && typeof BAG !== 'undefined' && Array.isArray(BAG.items)) {
      BAG.items = BAG.items.filter(it => it.id !== 'chiatu');
      if (BAG.sel === 'chiatu') BAG.sel = null;
    }
    if (typeof BAG !== 'undefined' && Array.isArray(BAG.items) && ket2.lap.length) {
      for (let i = 0; i < ket2.lap.length; i++) {
        const installedId = 'manh_' + ket2.lap[i];
        BAG.items = BAG.items.filter(it => it.id !== installedId);
        if (BAG.sel === installedId) BAG.sel = null;
      }
    }
  }

  function getHintStep() {
    if (!ket2HasLap('Mi4')) return 0;
    if (!ket2HasPicked('Si4')) return 1;
    if (!ket2HasPicked('La4')) return 2;
    if (!ket2HasPicked('Đô#5') || !ket2HasPicked('Fa#5')) return 3;
    return 4;
  }

  function updateHints(force) {
    if (typeof HINT === 'undefined' || typeof hints !== 'function') return;
    HINT.off = false;
    const step = getHintStep();
    const all5Picked = ket2HasPicked('Mi4') && ket2HasPicked('Si4') && ket2HasPicked('La4') && ket2HasPicked('Đô#5') && ket2HasPicked('Fa#5');
    const all5Lap = ket2HasLap('Mi4') && ket2HasLap('Si4') && ket2HasLap('La4') && ket2HasLap('Đô#5') && ket2HasLap('Fa#5');
    const inSauNeedDesk = typeof V !== 'undefined' && V.cur === 'p502sau' && all5Picked && !all5Lap;
    const effStep = inSauNeedDesk
      ? 'sau5'
      : (step === 1 ? (ket2.tuMo ? '1_mo' : '1_khoa') : step);
    if (!force && effStep === lastHintStep && lastHintGroup === '502') return;
    lastHintStep = effStep;
    lastHintGroup = '502';
    if (inSauNeedDesk) {
      hints(['Về bàn, lắp phím vào cây đàn.']);
      showSay('Về bàn, lắp phím vào cây đàn.');
    } else if (step === 0) {
      hints([
        'Cây đàn trên bàn hình như thiếu gì đó.',
        'Mảnh nhựa màu cam trong túi có vẻ vừa với một chỗ.',
        'Chạm cây đàn, mở túi, cầm mảnh cam rồi chạm khe cùng màu.',
      ]);
    } else if (step === 1) {
      if (!ket2.tuMo) {
        hints([
          'Phía sau lưng còn một nửa căn phòng.',
          'Có gì đó bị kẹp ở khe tủ.',
          'Tủ có một ổ khoá nhỏ.',
          'Chìa nhỏ thường bị bỏ quên giữa đồ lặt vặt trên bàn.',
        ]);
      } else {
        hints([
          'Áo khoác nâu treo trong tủ.',
          'Túi áo khoác có nắp cài.',
        ]);
      }
    } else if (step === 2) {
      hints([
        'Trên gác tối quá.',
        'Đèn bàn xoay được.',
        'Xoay đèn hướng lên gác rồi nhìn lại phía sau.',
      ]);
    } else if (step === 3) {
      hints([
        'Còn hai mảnh nữa, không ở trong phòng.',
        'Cửa phòng chưa khoá.',
        'Chìa khoá xe trên móc cạnh cửa sẽ cần đến.',
      ]);
      if (typeof V !== 'undefined' && V.cur === 'p502sau' && !pendingLa4ReturnSay) {
        sauStep3BoostAt = performance.now() + 800;
      }
    } else {
      HINT.list = [];
      HINT.idx = 0;
      HINT.text = '';
    }
  }

  // Lưới điểm ảnh tái sử dụng cho 5 khe trống, cây đàn và cốc bút (toạ độ theo CAM.y = 1.45)
  const KB_SLOTS = [];
  let KB_HIT = null;
  let PEN_CUP_R = null;
  let PEN_CUP_CORD = null;

  // Mặt sau (sau lưng chiếc ghế) và các lớp phụ trợ nướng khi đổi cỡ
  const [sauC, sauG] = layer();
  const [sauVignC, sauVignG] = layer();
  const [sauLoftDarkC, sauLoftDarkG] = layer();
  const [tuiaoBgC, tuiaoBgG] = layer();
  const [gacBgC, gacBgG] = layer();
  let sauWinPts = null;
  let sauWinDown = [0, 1];
  let sauWinAcross = [1, 0];
  let sauClipPt = [860, 208];
  let sauHookPt = [130, 430];
  let sauLampFloorPt = [820, 740];
  let sauLockPt = [404, 487];
  let sauPinchPt = [385, 444];

  // Hoạt ảnh nhẹ trong các cảnh Kết 2
  let doorAnim = 0;
  let flapAnim = 0;
  let gacClipAnim = 0;
  let gacDropAnim = 0;
  let gacOpening = false;
  let gacOpenT = 0;
  let wardShakeAt = 0;

  // Sprite ánh sáng và gradient cache (tránh tạo gradient mỗi khung hình)
  let warmSp = null, sparkSp = null;
  let scrTopGrad = null, scrGradY0 = 0, scrGradY1 = 0;
  let deskDimGrad = null, deskDimX = 0, deskDimY = 0;
  let sauDoorGeo = null;
  let pajamaShirtGrad = null, pajamaShirtY0 = 0, pajamaShirtY1 = 0;
  let pajamaPantsGrad = null, pajamaPantsY0 = 0, pajamaPantsY1 = 0;

  function makeGlow(r, stops) {
    const cv0 = document.createElement('canvas');
    cv0.width = cv0.height = r * 2;
    const c0 = cv0.getContext('2d');
    const gr = c0.createRadialGradient(r, r, 0, r, r, r);
    for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    c0.fillStyle = gr;
    c0.fillRect(0, 0, r * 2, r * 2);
    return cv0;
  }

  function initSprites() {
    if (!warmSp) {
      warmSp = makeGlow(128, [
        [0, 'rgba(255,212,150,.9)'],
        [0.42, 'rgba(255,186,115,.34)'],
        [1, 'rgba(255,165,90,0)'],
      ]);
    }
    if (!sparkSp) {
      sparkSp = makeGlow(48, [
        [0, 'rgba(255,244,218,.95)'],
        [0.25, 'rgba(255,218,165,.42)'],
        [1, 'rgba(255,205,140,0)'],
      ]);
    }
  }

  function hitPoly(p, pts) {
    if (!pts || pts.length < 3) return false;
    let inside = false;
    const px = p[0], py = p[1];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1];
      const xj = pts[j][0], yj = pts[j][1];
      const intersect = ((yi > py) !== (yj > py)) &&
        (px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-6) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Dự tính toạ độ 5 khe phím đàn bị thiếu và vùng chạm đàn đúng phối cảnh anh.js
  function rebuildFrontGeo() {
    const camY0 = CAM.y;
    CAM.y = 1.45;
    try {
      KB_SLOTS.length = 0;
      const specs = [
        { i: 15, id: 'Mi4',  x0: 0.953, x1: 1.176, w: 0.024, kind: 0 },
        { i: 21, id: 'La4',  x0: 0.953, x1: 1.176, w: 0.024, kind: 0 },
        { i: 25, id: 'Si4',  x0: 0.953, x1: 1.176, w: 0.024, kind: 0 },
        { i: 31, id: 'Đô#5', x0: 1.058, x1: 1.177, w: 0.022, kind: 1 },
        { i: 39, id: 'Fa#5', x0: 1.058, x1: 1.177, w: 0.022, kind: 1 },
      ];
      for (let idx = 0; idx < specs.length; idx++) {
        const sp = specs[idx];
        const z0 = 1.15 + sp.i * 0.026;
        const z1 = z0 + sp.w;
        const yTop = 0.8045;
        const p00 = P(sp.x0, yTop, z0);
        const p10 = P(sp.x1, yTop, z0);
        const p11 = P(sp.x1, yTop, z1);
        const p01 = P(sp.x0, yTop, z1);
        const cx = (p00[0] + p10[0] + p11[0] + p01[0]) * 0.25;
        const cy = (p00[1] + p10[1] + p11[1] + p01[1]) * 0.25;
        const spanW = Math.hypot(p10[0] - p00[0], p10[1] - p00[1]);
        KB_SLOTS.push({
          id: sp.id,
          pts: [p00, p10, p11, p01],
          front: [p00, p10],
          back: [p01, p11],
          cx,
          cy,
          spanW,
          kind: sp.kind,
          ph: idx * 1.15,
        });
      }
      KB_HIT = [
        P(0.88, 0.81, 2.58),
        P(1.36, 0.81, 2.58),
        P(1.36, 0.72, 1.08),
        P(0.88, 0.72, 1.08),
      ];
      // Vùng chạm cốc bút xanh đen (0.42, 0.87, 3.06) ≥ 110x130, không đè CACTUS_R
      const cupRim = P(0.42, 0.87, 3.06);
      const cupBase = P(0.42, 0.751, 3.06);
      const cupTop = P(0.42, 0.97, 3.06);
      const cw = 114, ch = 136;
      const cx = Math.min(cupRim[0] - cw * 0.5, CACTUS_R.x - cw - 8);
      const cy = Math.min(cupTop[1] - 24, (cupRim[1] + cupBase[1]) * 0.5 - ch * 0.5);
      PEN_CUP_R = { x: Math.round(cx), y: Math.round(cy), w: cw, h: ch };
      PEN_CUP_CORD = {
        inPt: P(0.425, 0.884, 3.06),
        peekMid: P(0.422, 0.916, 3.06),
        peekTip: P(0.418, 0.944, 3.058),
        rimPt: P(0.439, 0.875, 3.052),
        hangCtrl: P(0.445, 0.854, 3.049),
        hangPt: P(0.445, 0.822, 3.047),
      };
    } finally {
      CAM.y = camY0;
    }
  }

  function bakeFront() {
    initSprites();
    // đèn xoay lên: nướng lại nền góc bàn không có chao cũ (thay cho miếng vá cũ che mất góc lịch)
    if (anhC.width !== cv.width || anhC.height !== cv.height || !ANH.pool || window.ANH_KHONG_CHAO !== !!ket2.denLen) { window.ANH_KHONG_CHAO = !!ket2.denLen; bakeAnh(); }
    rebuildFrontGeo();
  }

  function drawMissingSlots(c, now) {
    if (!KB_SLOTS.length) rebuildFrontGeo();
    const t = now * 0.001;
    const ba = c.globalAlpha;
    c.save();
    for (let i = 0; i < KB_SLOTS.length; i++) {
      const s = KB_SLOTS[i];
      const br = 0.72 + 0.28 * Math.sin(t * 1.9 + s.ph);
      const meta = MANH_META[s.id];

      if (ket2HasLap(s.id) && meta) {
        // Phím đã lắp lại hiện màu ấm của mảnh nhựa trên dãy phím nhìn từ xa
        poly(c, s.pts, `rgba(${meta.rgb},0.92)`);
        c.strokeStyle = `rgba(${meta.rim},0.85)`;
        c.lineWidth = 1.15;
        c.beginPath();
        c.moveTo(s.front[0][0] + 1, s.front[0][1]);
        c.lineTo(s.front[1][0] - 1, s.front[1][1]);
        c.stroke();
        continue;
      }

      // Lòng khe tối sâu xuống (tạo cảm giác thiếu hẳn một phím đàn)
      poly(c, s.pts, '#040507');

      // Chút sắc màu rất khẽ ở đáy khe để gợi liên kết với mảnh trong túi
      if (meta) {
        c.strokeStyle = `rgba(${meta.rgb},${(0.24 + 0.1 * br).toFixed(3)})`;
        c.lineWidth = 2.0;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo((s.front[0][0] + s.back[0][0]) * 0.5 + 3, (s.front[0][1] + s.back[0][1]) * 0.5);
        c.lineTo((s.front[1][0] + s.back[1][0]) * 0.5 - 3, (s.front[1][1] + s.back[1][1]) * 0.5);
        c.stroke();
      }

      // Mép đáy khe bắt chút ánh sáng ấm rất khẽ từ góc phòng
      c.strokeStyle = `rgba(248,224,186,${(0.20 + 0.12 * br).toFixed(3)})`;
      c.lineWidth = 1.25;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(s.back[0][0] + 1.5, s.back[0][1] + 0.6);
      c.lineTo(s.back[1][0] - 1.5, s.back[1][1] + 0.6);
      c.stroke();

      // Viền mép cắt sáng mảnh của hai phím kề bên để mắt dừng lại
      c.strokeStyle = `rgba(232,240,234,${(0.26 + 0.14 * br).toFixed(3)})`;
      c.lineWidth = 1.05;
      c.beginPath();
      c.moveTo(s.front[0][0], s.front[0][1]);
      c.lineTo(s.front[1][0], s.front[1][1]);
      c.stroke();

      // Hơi sáng rất nhẹ quanh khe bằng sprite nướng sẵn
      if (warmSp) {
        const hw = Math.max(30, s.spanW * 0.62);
        const hh = 13;
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = ba * (0.08 + 0.045 * br);
        c.drawImage(warmSp, s.cx - hw, s.cy - hh, hw * 2, hh * 2);
        c.globalAlpha = ba;
        c.globalCompositeOperation = 'source-over';
      }
    }
    c.restore();
  }

  // Che phần đồng hồ laptop thành "03:07" khi đang ở Phòng 502 (không sửa anh.js)
  function drawLaptopTime0307(c) {
    const s2 = typeof ANH !== 'undefined' && ANH.scr;
    if (!s2 || s2.length < 3) return;
    const rx = s2[1][0] - 40;
    const ry = s2[0][1] + 1.5;
    c.save();
    c.fillStyle = '#0b0d12';
    c.fillRect(rx, ry, 38.5, 13.5);
    if (!scrTopGrad || scrGradY0 !== s2[0][1] || scrGradY1 !== s2[2][1]) {
      scrGradY0 = s2[0][1];
      scrGradY1 = s2[2][1];
      scrTopGrad = c.createLinearGradient(0, scrGradY0, 0, scrGradY1);
      scrTopGrad.addColorStop(0, 'rgba(150,180,230,.55)');
      scrTopGrad.addColorStop(1, 'rgba(110,140,200,.4)');
    }
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = scrTopGrad;
    c.fillRect(rx, ry, 38.5, 13.5);
    c.globalCompositeOperation = 'source-over';
    c.font = "11px 'Be Vietnam Pro', sans-serif";
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = 'rgba(235,240,250,.85)';
    c.fillText('03:07', s2[1][0] - 36, s2[0][1] + 12);
    c.restore();
  }

  // Khi đèn bàn hướng lên trên (denLen = true): che bóng chao cũ trên lớp nền và vẽ chao đèn xoay ngửa
  function coverDownLampOnWall(c) {
    c.save();
    const tr = c.getTransform();
    const sx = tr.a * 646 + tr.e;
    const sy = tr.d * 408 + tr.f;
    const sw = Math.max(1, tr.a * 22);
    const sh = Math.max(1, tr.d * 70);
    // Tường sau phẳng phía phải góc lịch (copy dải ngay bên cạnh để khớp sắc độ + vignette của anhC)
    if (anhC && anhC.width && anhC.height && sx >= 0 && sy >= 0 && sx + sw <= anhC.width && sy + sh <= anhC.height) {
      c.drawImage(anhC, sx, sy, sw, sh, 612.2, 408, 30, 70);
      const syBot = tr.d * 469.2 + tr.f;
      const shBot = Math.max(1, tr.d * 9);
      if (syBot >= 0 && syBot + shBot <= anhC.height) {
        c.drawImage(anhC, sx, syBot, sw, shBot, 587, 469.2, 26, 9);
      }
    } else {
      c.fillStyle = '#4c4e51';
      c.fillRect(612.2, 408, 30, 70);
      c.fillRect(587, 469.2, 26, 9);
    }
    // Góc dưới-phải tờ lịch PTIT bị chao đèn úp xuống che bớt
    c.fillStyle = '#6f7378';
    c.fillRect(587, 410, 25.2, 59.2);
    c.strokeStyle = 'rgba(30,32,38,.45)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(612.2, 410);
    c.lineTo(612.2, 469.2);
    c.lineTo(587, 469.2);
    c.stroke();
    c.restore();
  }

  function drawDeskLampUp(c, now) {
    const ba = c.globalAlpha;
    const jx = 588.9, jy = 413.9; // khớp J2 của đèn bàn trong anh.js
    const pulse = 0.92 + 0.08 * Math.sin(now * 0.0022);

    // Làm dịu nhẹ quầng sáng trên bàn khi đèn không rọi thẳng xuống
    if (typeof ANH !== 'undefined' && ANH.pool) {
      const px = ANH.pool[0], py = ANH.pool[1];
      if (!deskDimGrad || deskDimX !== px || deskDimY !== py) {
        deskDimX = px;
        deskDimY = py;
        deskDimGrad = c.createRadialGradient(px, py, 20, px, py, 440);
        deskDimGrad.addColorStop(0, 'rgba(6,8,12,.30)');
        deskDimGrad.addColorStop(0.65, 'rgba(6,8,12,.14)');
        deskDimGrad.addColorStop(1, 'rgba(6,8,12,0)');
      }
      c.fillStyle = deskDimGrad;
      c.fillRect(px - 440, py - 440, 880, 880);
    }

    c.save();
    // Cổ xoay khớp kim loại tại J2
    c.strokeStyle = '#383a40';
    c.lineWidth = 4.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(jx, jy);
    c.lineTo(jx + 7, jy - 10);
    c.stroke();
    c.fillStyle = '#7c7668';
    c.beginPath();
    c.arc(jx, jy, 3.2, 0, Math.PI * 2);
    c.fill();

    // Quầng sáng ấm hắt hướng lên trên và về phía gác sau lưng người xem
    if (warmSp) {
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * 0.22 * pulse;
      c.drawImage(warmSp, jx - 75, jy - 138, 220, 195);
      c.globalAlpha = ba;
      c.globalCompositeOperation = 'source-over';
    }

    // Chao đèn kim loại xoay ngửa lên (-0.72 rad hướng lên trên và về phía sau)
    c.translate(jx + 11, jy - 14);
    c.rotate(-0.62);

    // Đuôi chụp thép đen mờ
    c.fillStyle = '#15171b';
    c.beginPath();
    c.moveTo(-10, 12);
    c.quadraticCurveTo(-18, -4, -22, -18);
    c.lineTo(22, -18);
    c.quadraticCurveTo(18, -4, 10, 12);
    c.closePath();
    c.fill();

    // Ánh bắt sáng kim loại dọc sườn trái chao đèn
    c.strokeStyle = 'rgba(210,195,172,.28)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-10, 10);
    c.quadraticCurveTo(-17, -4, -21, -17);
    c.stroke();

    // Miệng chao hướng lên (lòng trong hắt cam ấm + bóng đèn sáng dịu)
    c.fillStyle = '#472d16';
    c.beginPath();
    c.ellipse(0, -18, 22, 10.5, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = 'rgba(255,222,162,.62)';
    c.beginPath();
    c.ellipse(0, -17.5, 13, 6.2, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = 'rgba(255,248,225,.92)';
    c.beginPath();
    c.ellipse(0, -17, 6.2, 3.6, 0, 0, Math.PI * 2);
    c.fill();

    // Viền mép chao bắt sáng ấm
    c.strokeStyle = 'rgba(255,212,155,.55)';
    c.lineWidth = 1.3;
    c.beginPath();
    c.ellipse(0, -18, 22, 10.5, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  // ================= NƯỚNG CẢNH PHÍA SAU (SC.p502sau) =================
  // Toàn bộ dùng P / box / seg của p1.js với CAM.y = 1.45
  // Độ sáng theo vật lý: nguồn sáng chính là đèn bàn ở SAU LƯNG người xem (z ~ -0.5, x ~ +0.3, y ~ 1.15),
  // hắt ấm yếu xuống sàn tiền cảnh và chân tủ; xa về bếp chìm tối; cửa sổ trái có ánh lạnh rất yếu.
  function kLampSau(x, y, z) {
    const dBack = Math.hypot((x - 0.15) * 0.7, (y - 0.95) * 0.65, z + 0.35);
    const floorBoost = y < 0.85 && z < 4.35 ? (1 - y / 0.85) * 0.14 : 0;
    const winCold = Math.max(0, 0.22 - Math.hypot(x + 2.35, (y - 1.45) * 0.8, z - 3.68) * 0.14);
    return clamp(1.18 - dBack * 0.175 + floorBoost + winCold, 0.09, 0.88);
  }

  // Mảng mặt phẳng tường/góc phòng sau lưng
  function drawSauShellAndFloor(c) {
    const L = -2.35, R = 2.35, Z_NEAR = 2.15, Z_MID = 4.85, Z_ALCOVE = 5.75, TOP = 2.95, LOFT_Y = 2.00;

    // 1. Trần phòng tối hẳn
    poly(c, [P(L, TOP, Z_NEAR), P(R, TOP, Z_NEAR), P(R, TOP, Z_ALCOVE), P(L, TOP, Z_ALCOVE)], '#08090b');

    // 2. Tường sau (phần sau tủ trái z = 4.85, và vách tầng gác xép y = 2.00..2.95)
    poly(c, [P(L, 0, Z_MID), P(-0.05, 0, Z_MID), P(-0.05, LOFT_Y, Z_MID), P(L, LOFT_Y, Z_MID)], '#1a1c20');
    // Lối hẹp bên trái góc bếp nối vào gầm gác
    poly(c, [P(-0.05, 0, Z_MID), P(-0.05, 0, Z_ALCOVE), P(-0.05, LOFT_Y, Z_ALCOVE), P(-0.05, LOFT_Y, Z_MID)], '#121418');
    // Tường sau sâu trong hốc bếp (z = 5.75)
    poly(c, [P(-0.05, 0, Z_ALCOVE), P(R, 0, Z_ALCOVE), P(R, LOFT_Y, Z_ALCOVE), P(-0.05, LOFT_Y, Z_ALCOVE)], '#111317');
    // Tường bên phải toàn phòng
    poly(c, [P(R, 0, Z_NEAR), P(R, TOP, Z_NEAR), P(R, TOP, Z_ALCOVE), P(R, 0, Z_ALCOVE)], '#121317');
    // Vách sau trên gác xép (y = 2.00..2.95, z = 5.55)
    poly(c, [P(L, LOFT_Y, 5.55), P(R, LOFT_Y, 5.55), P(R, TOP, 5.55), P(L, TOP, 5.55)], '#0d0f13');

    // 3. Tường trái (x = -2.35, z = 2.15..4.85): mảng xám lạnh tối, phía cửa sổ nhỉnh sáng hơn chút
    {
      const gW = c.createLinearGradient(P(L, 1.4, Z_NEAR)[0], 0, P(L, 1.4, Z_MID)[0], 0);
      gW.addColorStop(0, '#181a1e');
      gW.addColorStop(0.55, '#222832');
      gW.addColorStop(1, '#15171b');
      poly(c, [P(L, 0, Z_NEAR), P(L, 0, Z_MID), P(L, TOP, Z_MID), P(L, TOP, Z_NEAR)], gW);
    }

    // 4. Sàn gỗ màu mật ong (tối), ấm rõ hơn ở tiền cảnh nơi đèn bàn sau lưng hắt tới
    {
      const pN = P(0, 0, Z_NEAR), pF = P(0, 0, Z_ALCOVE);
      const gf = c.createLinearGradient(0, pN[1], 0, pF[1]);
      gf.addColorStop(0, '#4f3119');
      gf.addColorStop(0.45, '#342010');
      gf.addColorStop(0.78, '#1d1209');
      gf.addColorStop(1, '#0d0804');
      poly(c, [P(L, 0, Z_NEAR), P(R, 0, Z_NEAR), P(R, 0, Z_MID), P(L, 0, Z_MID)], gf);
      poly(c, [P(-0.05, 0, Z_MID), P(R, 0, Z_MID), P(R, 0, Z_ALCOVE), P(-0.05, 0, Z_ALCOVE)], '#0c0704');

      // Các tấm ván gỗ theo phối cảnh (chạy theo trục z) + mạch ghép so le
      const plankW = 0.19;
      for (let x = L + plankW; x < R; x += plankW) {
        const zEnd = x < -0.05 ? Z_MID : Z_ALCOVE;
        const a0 = x < -0.05 ? 0.36 : 0.25;
        seg(c, P(x, 0.001, Z_NEAR), P(x, 0.001, zEnd), 1.1, `rgba(12,6,2,${a0})`);
        if (Math.abs(x) < 1.55) {
          seg(c, P(x + 0.015, 0.001, Z_NEAR), P(x + 0.015, 0.001, 4.15), 0.7, 'rgba(215,155,95,.045)');
        }
        // Mối nối ngang từng thanh gỗ
        const idx = Math.round((x - L) / plankW);
        const zJoin = 2.65 + ((idx * 0.43) % 1.65);
        if (zJoin < zEnd - 0.2) {
          seg(c, P(x - plankW, 0.001, zJoin), P(x, 0.001, zJoin), 1, 'rgba(10,5,2,.32)');
        }
      }
      // Len chân tường tối bên trái
      poly(c, [P(L, 0, Z_NEAR), P(L, 0, Z_MID), P(L, 0.075, Z_MID), P(L, 0.075, Z_NEAR)], '#18130f');
    }
  }

  // Cửa ra vào ở mép trái + móc treo chùm chìa khoá xe nhỏ + cửa sổ nhỏ ngoài mưa
  function drawSauLeftDoorAndWindow(c) {
    const XW = -2.35;

    // 1. Cửa ra vào (z = 2.76..3.34, y = 0..2.06) sát mép trái
    {
      const z0 = 2.76, z1 = 3.34, y1 = 2.06;
      // Khuôn cửa tối
      poly(c, [P(XW, 0, z0 - 0.03), P(XW, 0, z1 + 0.03), P(XW, y1 + 0.04, z1 + 0.03), P(XW, y1 + 0.04, z0 - 0.03)], '#121316');
      // Cánh cửa chính
      const gd = c.createLinearGradient(P(XW, 1, z0)[0], 0, P(XW, 1, z1)[0], 0);
      gd.addColorStop(0, '#23262b');
      gd.addColorStop(1, '#191c20');
      poly(c, [P(XW + 0.01, 0.01, z0), P(XW + 0.01, 0.01, z1), P(XW + 0.01, y1, z1), P(XW + 0.01, y1, z0)], gd);
      // Gờ pano chìm đơn giản trên cánh
      for (const [py0, py1] of [[0.18, 0.88], [1.06, 1.92]]) {
        poly(c, [P(XW + 0.012, py0, z0 + 0.07), P(XW + 0.012, py0, z1 - 0.07), P(XW + 0.012, py1, z1 - 0.07), P(XW + 0.012, py1, z0 + 0.07)], 'rgba(0,0,0,.22)');
        seg(c, P(XW + 0.012, py1, z0 + 0.07), P(XW + 0.012, py1, z1 - 0.07), 0.9, 'rgba(180,190,205,.09)');
      }
      // Tay nắm cửa (hình khối chi tiết vẽ ở drawSauDoorInvite sau vignette để rõ trong tối); ở đây tính sẵn hình học vào cache
      const f0 = P(XW + 0.34, 0.002, z0 - 0.02), f1 = P(XW + 0.34, 0.002, z1 + 0.05);
      const s0 = P(XW + 0.01, 0.008, z0 + 0.01), s1 = P(XW + 0.01, 0.008, z1 - 0.01);
      const sdx = s1[0] - s0[0], sdy = s1[1] - s0[1], slen = Math.hypot(sdx, sdy) || 1;
      const snx = -sdy / slen, sny = sdx / slen;
      const sMidX = (s0[0] + s1[0]) * 0.5, sMidY = (s0[1] + s1[1]) * 0.5;
      const fMidX = (f0[0] + f1[0]) * 0.5, fMidY = (f0[1] + f1[1]) * 0.5;
      const perpD = Math.max(24, (fMidX - sMidX) * snx + (fMidY - sMidY) * sny);
      const spillGrad = c.createLinearGradient(sMidX, sMidY, sMidX + snx * perpD, sMidY + sny * perpD);
      spillGrad.addColorStop(0, 'rgba(255,214,148,.22)');
      spillGrad.addColorStop(0.32, 'rgba(248,196,124,.10)');
      spillGrad.addColorStop(1, 'rgba(240,180,104,0)');
      sauDoorGeo = {
        bL: P(XW + 0.01, 0.01, z0),
        bR: P(XW + 0.01, 0.01, z1),
        tR: P(XW + 0.01, y1, z1),
        tL: P(XW + 0.01, y1, z0),
        frBot: P(XW + 0.004, 0.01, z1 + 0.024),
        frTop: P(XW + 0.004, y1 + 0.02, z1 + 0.024),
        spillPts: [s0, s1, f1, f0],
        spillGrad,
        plate: [
          P(XW + 0.014, 0.90, z1 - 0.052),
          P(XW + 0.014, 0.90, z1 - 0.098),
          P(XW + 0.014, 1.05, z1 - 0.098),
          P(XW + 0.014, 1.05, z1 - 0.052),
        ],
        kh: P(XW + 0.015, 0.942, z1 - 0.075),
        hBase: P(XW + 0.016, 1.005, z1 - 0.075),
        hNeck: P(XW + 0.040, 1.005, z1 - 0.075),
        hEnd: P(XW + 0.040, 1.005, z1 - 0.195),
        hTip: P(XW + 0.020, 1.005, z1 - 0.212),
      };

      // Móc treo gắn mặt trong ngay sát mép cửa (z ~ 3.24, y ~ 1.33); chìa khoá vẽ động theo ket2.chia
      const hk = P(XW + 0.018, 1.33, z1 - 0.10);
      sauHookPt = [hk[0], hk[1]];
      c.fillStyle = '#2d3138';
      c.fillRect(hk[0] - 2.5, hk[1] - 4, 5, 8);
      c.strokeStyle = 'rgba(175,186,200,.42)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(hk[0] + 1, hk[1] + 5, 3.5, 0, Math.PI * 2);
      c.stroke();
    }

    // 2. Cửa sổ nhỏ (z = 3.44..4.00, y = 1.15..1.88) có ánh lạnh rất yếu và mưa đêm
    {
      const z0 = 3.44, z1 = 4.00, y0 = 1.15, y1 = 1.88, depth = -0.07;
      // Khung viền âm tường
      const outer = [P(XW, y1 + 0.03, z0 - 0.03), P(XW, y1 + 0.03, z1 + 0.03), P(XW, y0 - 0.03, z1 + 0.03), P(XW, y0 - 0.03, z0 - 0.03)];
      poly(c, outer, '#171b22');

      // Mặt kính ngoài trời đêm (chỉ sương đêm xanh sẫm, không cảnh nhận ra được)
      const gl = [P(XW + depth, y1, z0), P(XW + depth, y1, z1), P(XW + depth, y0, z1), P(XW + depth, y0, z0)];
      const gs = c.createLinearGradient(0, gl[0][1], 0, gl[2][1]);
      gs.addColorStop(0, '#0a121d');
      gs.addColorStop(0.55, '#101d2d');
      gs.addColorStop(1, '#162538');
      poly(c, gl, gs);
      sauWinPts = gl;
      const dDx = gl[3][0] - gl[0][0], dDy = gl[3][1] - gl[0][1];
      const dLen = Math.hypot(dDx, dDy) || 1;
      sauWinDown = [dDx / dLen, dDy / dLen];
      const aDx = gl[1][0] - gl[0][0], aDy = gl[1][1] - gl[0][1];
      const aLen = Math.hypot(aDx, aDy) || 1;
      sauWinAcross = [aDx / aLen, aDy / aLen];

      // Thành hốc cửa sổ (bậu dưới hắt lạnh rất khẽ)
      poly(c, [P(XW, y0, z0), P(XW, y0, z1), P(XW + depth, y0, z1), P(XW + depth, y0, z0)], '#233041');
      poly(c, [P(XW, y1, z0), P(XW, y1, z1), P(XW + depth, y1, z1), P(XW + depth, y1, z0)], '#0d1016');
      poly(c, [P(XW, y0, z1), P(XW, y1, z1), P(XW + depth, y1, z1), P(XW + depth, y0, z1)], '#13171f');
      // Chấn song chữ thập mảnh
      const zm = (z0 + z1) * 0.5, ym = (y0 + y1) * 0.5;
      seg(c, P(XW + depth + 0.005, y0, zm), P(XW + depth + 0.005, y1, zm), 2.4, '#13161c');
      seg(c, P(XW + depth + 0.005, ym, z0), P(XW + depth + 0.005, ym, z1), 2.2, '#13161c');
      seg(c, P(XW, y0, z0), P(XW, y0, z1), 1.3, 'rgba(135,175,218,.28)');
    }
  }

  // Góc bếp nhỏ bên phải, chìm trong tối: tủ trên trắng, máy hút mùi đen, mặt bếp sáng nhạt, vài cái bát
  function drawSauKitchen(c) {
    const x0 = -0.02, x1 = 2.28, zFront = 5.06, zBack = 5.74;
    const kLow = kLampSau(0.95, 0.45, zFront) * 0.72;

    // 1. Hệ tủ dưới tối + ranh giới từng cánh
    box(c, x0, x1, 0.05, 0.82, zFront, zBack, [42, 40, 38], kLow, false);
    box(c, x0 + 0.02, x1, 0, 0.05, zFront + 0.03, zBack, [22, 20, 19], kLow * 0.6, false);
    for (let x = 0.45; x < 2.15; x += 0.44) {
      seg(c, P(x, 0.06, zFront - 0.002), P(x, 0.81, zFront - 0.002), 1, 'rgba(0,0,0,.55)');
    }

    // 2. Mặt bếp sáng nhạt (tương phản nhẹ để nổi hình giữa góc tối)
    box(c, x0 - 0.02, x1 + 0.02, 0.82, 0.87, zFront - 0.03, zBack, [156, 154, 148], clamp(kLow + 0.16, 0.2, 0.45), true);
    // Hắt nhẹ mặt trên sáng hơn phần đứng
    poly(c, [P(x0 - 0.02, 0.871, zFront - 0.03), P(x1 + 0.02, 0.871, zFront - 0.03), P(x1 + 0.02, 0.871, zBack), P(x0 - 0.02, 0.871, zBack)], 'rgba(198,200,204,.16)');

    // 3. Vài cái bát trên mặt bếp bên trái (nhỏ, ra dáng gốm mờ)
    const drawBowl = (bx, bz, rPx, hPx, inv) => {
      const p = P(bx, 0.872, bz);
      c.save();
      c.translate(p[0], p[1]);
      c.fillStyle = 'rgba(0,0,0,.35)';
      c.beginPath();
      c.ellipse(0, 1, rPx * 0.85, rPx * 0.25, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#4c4e52';
      c.beginPath();
      if (inv) {
        c.moveTo(-rPx, 0);
        c.quadraticCurveTo(0, -hPx * 1.65, rPx, 0);
        c.closePath();
      } else {
        c.ellipse(0, -hPx, rPx, rPx * 0.3, 0, 0, Math.PI * 2);
        c.moveTo(-rPx, -hPx);
        c.quadraticCurveTo(0, hPx * 0.9, rPx, -hPx);
      }
      c.fill();
      if (!inv) {
        c.fillStyle = '#2d2f33';
        c.beginPath();
        c.ellipse(0, -hPx, rPx * 0.84, rPx * 0.22, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.strokeStyle = 'rgba(208,214,220,.32)';
      c.lineWidth = 1;
      c.beginPath();
      if (inv) {
        c.moveTo(-rPx * 0.72, -hPx * 0.65);
        c.quadraticCurveTo(0, -hPx * 1.15, rPx * 0.6, -hPx * 0.7);
      } else {
        c.ellipse(0, -hPx, rPx * 0.94, rPx * 0.26, 0, Math.PI * 1.05, Math.PI * 1.95);
      }
      c.stroke();
      c.restore();
    };
    drawBowl(0.24, 5.26, 10.5, 6.5, false);
    drawBowl(0.24, 5.26, 9.8, 11.5, false); // chồng hai bát
    drawBowl(0.46, 5.31, 9.5, 6.2, true);   // một bát úp
    drawBowl(0.65, 5.24, 8.8, 5.5, false);

    // 4. Tủ trên trắng hai bên (nằm trên tầm mắt -> vẽ thêm mặt đáy tủ)
    const drawUpperCab = (cx0, cx1) => {
      const y0 = 1.48, y1 = 1.98, z0 = 5.28, z1 = zBack;
      const ku = 0.27;
      box(c, cx0, cx1, y0, y1, z0, z1, [168, 170, 174], ku, false);
      // Mặt đáy tủ (vì y0 > CAM.y nên box() vẽ nắp thay vì đáy)
      poly(c, [P(cx0, y0, z0), P(cx1, y0, z0), P(cx1, y0, z1), P(cx0, y0, z1)], '#2a2c30');
      seg(c, P(cx0, y0, z0), P(cx1, y0, z0), 1, 'rgba(220,224,230,.14)');
      const xm = (cx0 + cx1) * 0.5;
      seg(c, P(xm, y0 + 0.02, z0 - 0.002), P(xm, y1 - 0.02, z0 - 0.002), 1, 'rgba(0,0,0,.45)');
    };
    drawUpperCab(0.00, 0.72);
    drawUpperCab(1.42, 2.26);

    // 5. Máy hút mùi đen ở giữa hai tủ trên
    {
      const hx0 = 0.74, hx1 = 1.40, hy0 = 1.41, hyTop = 1.66, zH0 = 5.14, zH1 = zBack;
      // Ống hút khói lên gầm gác xép
      box(c, 0.92, 1.22, hyTop, 2.00, 5.42, zH1, [20, 21, 24], 0.45, false);
      // Chụp nghiêng đen mờ
      poly(c, [P(0.88, hyTop, 5.36), P(1.26, hyTop, 5.36), P(hx1, hy0 + 0.06, zH0), P(hx0, hy0 + 0.06, zH0)], '#181a1e');
      poly(c, [P(hx0, hy0, zH0), P(hx1, hy0, zH0), P(hx1, hy0 + 0.06, zH0), P(hx0, hy0 + 0.06, zH0)], '#0d0e11');
      // Mặt đáy máy hút mùi + cạnh hông trái (vì x0 > 0)
      poly(c, [P(hx0, hy0, zH0), P(hx1, hy0, zH0), P(hx1, hy0, zH1), P(hx0, hy0, zH1)], '#08090b');
      poly(c, [P(hx0, hy0, zH0), P(hx0, hy0 + 0.06, zH0), P(0.88, hyTop, 5.36), P(hx0, hy0, zH1)], '#0f1013');
      seg(c, P(hx0, hy0 + 0.06, zH0), P(hx1, hy0 + 0.06, zH0), 1, 'rgba(175,190,210,.15)');
    }
  }

  // Chìa khoá xe treo trên móc cạnh cửa (ẩn ngay khi đã nhặt ket2.chia = true)
  function drawSauWallKey(c) {
    if (ket2.chia) return;
    const x = sauHookPt[0], y = sauHookPt[1];
    const t = performance.now() * 0.001;
    c.save();
    // quầng sáng ấm rất nhẹ từ khe cửa hắt lên chùm chìa (để mắt tìm thấy)
    const gl = c.createRadialGradient(x + 2, y + 26, 2, x + 2, y + 26, 46);
    gl.addColorStop(0, `rgba(255,214,160,${(0.16 + 0.05 * Math.sin(t * 1.6)).toFixed(3)})`);
    gl.addColorStop(1, 'rgba(255,214,160,0)');
    c.fillStyle = gl; c.fillRect(x - 44, y - 20, 92, 92);
    // móc dán tường
    c.fillStyle = '#9a9690'; roundRect(c, x - 5, y - 6, 10, 8, 2); c.fill();
    c.strokeStyle = '#b9b5ae'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 1); c.quadraticCurveTo(x + 1, y + 8, x + 5, y + 6); c.stroke();
    c.translate(x + 1, y + 6);
    c.rotate(-0.08 + 0.03 * Math.sin(t * 0.9));
    // vòng khoá kim loại
    c.strokeStyle = 'rgba(214,220,228,.95)'; c.lineWidth = 2.4;
    c.beginPath(); c.arc(0, 8, 7, 0, Math.PI * 2); c.stroke();
    // điều khiển xe: thân đen bo tròn, nút đỏ, đèn nhỏ
    c.fillStyle = '#16181d'; roundRect(c, -8, 14, 16, 26, 6); c.fill();
    c.strokeStyle = 'rgba(190,205,225,.55)'; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = '#b8323a'; c.beginPath(); c.arc(0, 22, 3.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(210,220,235,.55)'; c.beginPath(); c.arc(0, 32, 2.4, 0, Math.PI * 2); c.fill();
    // lưỡi chìa kim loại bên cạnh
    c.save(); c.rotate(0.38);
    c.fillStyle = '#c9ccd2'; roundRect(c, 4, 12, 7, 9, 2); c.fill();
    c.fillRect(6, 20, 3.2, 18);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(6, 21, 1.1, 16);
    c.restore();
    // ánh bắt sáng nhấp nháy trên vòng khoá
    c.fillStyle = `rgba(255,246,226,${(0.5 + 0.4 * Math.max(0, Math.sin(t * 2.3))).toFixed(3)})`;
    c.beginPath(); c.arc(-4, 3, 1.8, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  // Phần tĩnh của tủ quần áo (thân, khoang tối bên trong, thanh treo, cánh phải đóng)
  function drawSauWardrobeStatic(c) {
    const x0 = -2.30, x1 = -1.04, xm = -1.67;
    const y0 = 0.06, y1 = 1.96, z0 = 4.10, z1 = 4.82;
    const kBody = kLampSau(x1, 0.85, z0);

    // 1. Khung/thân tủ màu trắng
    box(c, x0, x1, 0, 2.00, z0, z1, [182, 178, 170], kBody * 0.65, false);
    box(c, x0, x1, 0, y0, z0 - 0.002, z1, [90, 86, 80], kBody * 0.5, false);

    // 2. Khoang tủ tối + thanh treo ngang
    poly(c, [
      P(x0 + 0.03, y0, z0 - 0.005),
      P(xm - 0.01, y0, z0 - 0.005),
      P(xm - 0.01, y1, z0 - 0.005),
      P(x0 + 0.03, y1, z0 - 0.005),
    ], '#070504');
    seg(c, P(x0 + 0.04, 1.66, 4.35), P(xm - 0.01, 1.66, 4.35), 2, 'rgba(155,160,168,.38)');

    // 3. Cánh tủ bên phải ĐÓNG (gỗ nâu sẫm)
    const pTop = P(xm, y1, z0), pBot = P(xm, y0, z0);
    const gr = c.createLinearGradient(0, pTop[1], 0, pBot[1]);
    gr.addColorStop(0, '#1e120a');
    gr.addColorStop(0.65, '#2b190d');
    gr.addColorStop(1, '#362011');
    poly(c, [P(xm + 0.01, y0, z0 - 0.01), P(x1 - 0.02, y0, z0 - 0.01), P(x1 - 0.02, y1, z0 - 0.01), P(xm + 0.01, y1, z0 - 0.01)], gr);
    for (let i = 0; i < 6; i++) {
      const vx = xm + 0.07 + i * 0.085;
      seg(c, P(vx, y0 + 0.08, z0 - 0.012), P(vx, y1 - 0.08, z0 - 0.012), 0.8, 'rgba(10,5,2,.26)');
    }
    seg(c, P(xm + 0.064, 0.896, z0 - 0.014), P(xm + 0.064, 1.116, z0 - 0.014), 3.4, 'rgba(6,3,1,.55)');
    seg(c, P(xm + 0.06, 0.90, z0 - 0.015), P(xm + 0.06, 1.12, z0 - 0.015), 3.0, '#2a190e');
    seg(c, P(xm + 0.056, 0.91, z0 - 0.016), P(xm + 0.056, 1.11, z0 - 0.016), 0.9, 'rgba(220,178,136,.24)');
  }

  // Đồ treo bên trong & cánh trái tủ đóng kín / mở rộng mượt
  function drawSauWardrobeDynamic(c, dt, now) {
    const camY0 = CAM.y;
    CAM.y = 1.45;
    try {
      const target = ket2.tuMo ? 1 : 0;
      doorAnim = lerp(doorAnim, target, Math.min(1, (dt || 0.016) * 8));

      const tNow = now || performance.now();
      let shakeAng = 0;
      if (!ket2.tuMo && wardShakeAt) {
        const dtS = tNow - wardShakeAt;
        if (dtS >= 0 && dtS < 380) {
          const env = 1 - dtS / 380;
          shakeAng = Math.abs(Math.sin(dtS * 0.052)) * env * 0.028;
        }
      }

      const x0 = -2.30, xm = -1.67, y0 = 0.06, y1 = 1.96, z0 = 4.10;
      const cavPoly = [
        P(x0 + 0.03, y0, z0 - 0.005),
        P(xm - 0.01, y0, z0 - 0.005),
        P(xm - 0.01, y1, z0 - 0.005),
        P(x0 + 0.03, y1, z0 - 0.005),
      ];

      if (doorAnim > 0.004) {
        c.save();
        c.beginPath();
        cavPoly.forEach((pt, idx) => (idx ? c.lineTo(pt[0], pt[1]) : c.moveTo(pt[0], pt[1])));
        c.closePath();
        c.clip();

      // ---- 1. Áo khoác dạ nâu treo móc (bên trái khoang tủ) ----
      {
        const xc = -2.12, zCoat = 4.36;
        // Móc treo kim loại + vai móc gỗ
        const rod = P(xc, 1.66, zCoat);
        c.strokeStyle = 'rgba(185,190,198,.48)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(rod[0], rod[1] - 2.5, 2.5, Math.PI, Math.PI * 2.15);
        c.stroke();
        seg(c, P(xc - 0.13, 1.565, zCoat), P(xc + 0.13, 1.565, zCoat), 2.4, '#4c3420');

        // Thân áo dạ dáng hơi xoè nhẹ (vai -> gấu)
        const body = [
          P(xc - 0.115, 1.56, zCoat),
          P(xc + 0.115, 1.56, zCoat),
          P(xc + 0.132, 0.84, zCoat),
          P(xc - 0.132, 0.84, zCoat),
        ];
        const bTop = P(xc, 1.56, zCoat), bBot = P(xc, 0.84, zCoat);
        const gb = c.createLinearGradient(0, bTop[1], 0, bBot[1]);
        gb.addColorStop(0, '#442917');
        gb.addColorStop(0.55, '#5b3922');
        gb.addColorStop(1, '#6a442a');
        poly(c, body, gb);

        // Nếp vạt giữa + hàng 4 cúc bấm kim loại xỉn dọc nẹp áo
        seg(c, P(xc + 0.01, 1.52, zCoat - 0.004), P(xc + 0.01, 0.85, zCoat - 0.004), 1.1, 'rgba(18,9,4,.58)');
        for (const by of [1.43, 1.30, 1.17, 1.04]) {
          const bp = P(xc + 0.018, by, zCoat - 0.005);
          c.fillStyle = '#8b6f50';
          c.beginPath();
          c.arc(bp[0], bp[1], 1.7, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = 'rgba(255,232,200,.35)';
          c.beginPath();
          c.arc(bp[0] - 0.4, bp[1] - 0.4, 0.65, 0, Math.PI * 2);
          c.fill();
        }

        // Gợi nắp túi hông phải áo khoác
        poly(c, [
          P(xc + 0.032, 1.10, zCoat - 0.004),
          P(xc + 0.105, 1.10, zCoat - 0.004),
          P(xc + 0.105, 1.06, zCoat - 0.004),
          P(xc + 0.032, 1.06, zCoat - 0.004),
        ], '#3f2615');
        seg(c, P(xc + 0.032, 1.06, zCoat - 0.005), P(xc + 0.105, 1.06, zCoat - 0.005), 0.9, 'rgba(255,212,175,.14)');

        // Cổ áo đứng (cổ đứng ôm nhẹ quanh cổ + chút lớp lót nâu ấm phía trong)
        poly(c, [
          P(xc - 0.048, 1.56, zCoat),
          P(xc + 0.048, 1.56, zCoat),
          P(xc + 0.038, 1.635, zCoat),
          P(xc - 0.038, 1.635, zCoat),
        ], '#4b2d19');
        poly(c, [
          P(xc - 0.025, 1.57, zCoat - 0.003),
          P(xc + 0.025, 1.57, zCoat - 0.003),
          P(xc + 0.018, 1.62, zCoat - 0.003),
          P(xc - 0.018, 1.62, zCoat - 0.003),
        ], '#76492b');

        // Hai tay áo buông hai bên + cổ tay lật nhẹ lộ lót kẻ ô nhỏ
        for (const sgn of [-1, 1]) {
          const sxTop = xc + sgn * 0.11;
          const sxMid = xc + sgn * 0.152;
          const sxBot = xc + sgn * 0.155;
          const slPts = [
            P(sxTop, 1.56, zCoat - 0.006),
            P(sxTop - sgn * 0.022, 1.51, zCoat - 0.006),
            P(sxMid - sgn * 0.018, 1.24, zCoat - 0.006),
            P(sxBot - sgn * 0.035, 0.96, zCoat - 0.006),
            P(sxBot + sgn * 0.024, 0.97, zCoat - 0.006),
            P(sxMid + sgn * 0.022, 1.25, zCoat - 0.006),
            P(sxTop + sgn * 0.024, 1.54, zCoat - 0.006),
          ];
          poly(c, slPts, sgn < 0 ? '#50321d' : '#583720');
          // Đường may vai và nếp khuỷu tay
          seg(c, P(sxTop, 1.55, zCoat - 0.007), P(sxTop + sgn * 0.02, 1.46, zCoat - 0.007), 0.9, 'rgba(18,8,3,.42)');

          // Cổ tay lót kẻ ô nhỏ (nền nâu cát ấm + các sọc ô vuông mảnh)
          const c0 = P(sxBot - sgn * 0.033, 0.962, zCoat - 0.008);
          const c1 = P(sxBot + sgn * 0.022, 0.972, zCoat - 0.008);
          const c2 = P(sxBot + sgn * 0.021, 1.018, zCoat - 0.008);
          const c3 = P(sxBot - sgn * 0.032, 1.008, zCoat - 0.008);
          poly(c, [c0, c1, c2, c3], '#7a4b30');
          c.strokeStyle = 'rgba(32,16,8,.55)';
          c.lineWidth = 0.7;
          for (let g = 0.25; g <= 0.75; g += 0.25) {
            c.beginPath();
            c.moveTo(lerp(c0[0], c1[0], g), lerp(c0[1], c1[1], g));
            c.lineTo(lerp(c3[0], c2[0], g), lerp(c3[1], c2[1], g));
            c.stroke();
          }
          c.strokeStyle = 'rgba(218,180,142,.42)';
          c.lineWidth = 0.65;
          c.beginPath();
          c.moveTo((c0[0] + c3[0]) * 0.5, (c0[1] + c3[1]) * 0.5);
          c.lineTo((c1[0] + c2[0]) * 0.5, (c1[1] + c2[1]) * 0.5);
          c.stroke();
        }
      }

      // ---- 2. Bộ pijama vải lanh treo móc (bên phải khoang tủ, nằm gọn trong khoang: áo + quần hai mảnh) ----
      {
        const xp = -1.822, zPij = 4.26;
        const trimCol = '#844856'; // viền hồng đậm hơn nền vải
        const ln = (a, b, w, col) => {
          c.strokeStyle = col;
          c.lineWidth = w;
          c.beginPath();
          c.moveTo(a[0], a[1]);
          c.lineTo(b[0], b[1]);
          c.stroke();
        };

        // Móc treo kim loại + vai móc ngang (áo khoác ngoài & quần vắt thanh ngang ở trong)
        const sRod = P(xp, 1.66, zPij);
        c.strokeStyle = 'rgba(198,200,208,.48)';
        c.lineWidth = 1.1;
        c.beginPath();
        c.arc(sRod[0], sRod[1] - 2.3, 2.2, Math.PI, Math.PI * 2.15);
        c.stroke();
        ln(P(xp - 0.056, 1.563, zPij), P(xp + 0.056, 1.563, zPij), 2.0, 'rgba(196,174,162,.48)');

        // --- Quần pijama dài ống suông: hai ống tách rõ rủ xuống dưới vạt áo ---
        const pTop = P(xp, 1.19, zPij), pBot = P(xp, 0.72, zPij);
        if (!pajamaPantsGrad || Math.abs(pajamaPantsY0 - pTop[1]) > 0.5 || Math.abs(pajamaPantsY1 - pBot[1]) > 0.5) {
          pajamaPantsY0 = pTop[1];
          pajamaPantsY1 = pBot[1];
          pajamaPantsGrad = c.createLinearGradient(0, pTop[1], 0, pBot[1]);
          pajamaPantsGrad.addColorStop(0, '#896a6b');
          pajamaPantsGrad.addColorStop(0.28, '#a68988');
          pajamaPantsGrad.addColorStop(0.75, '#ad908f');
          pajamaPantsGrad.addColorStop(1, '#987a79');
        }
        // Phần đũng/nếp gập ngay dưới vạt áo nối sang hai ống suông
        poly(c, [
          P(xp - 0.044, 1.195, zPij),
          P(xp + 0.044, 1.195, zPij),
          P(xp + 0.046, 1.135, zPij),
          P(xp - 0.046, 1.135, zPij),
        ], pajamaPantsGrad);
        // Hai ống quần thẳng tách rõ bởi khe hở ở giữa
        for (const sgn of [-1, 1]) {
          const xIn = xp + sgn * 0.007;
          const xOut = xp + sgn * 0.047;
          poly(c, [
            P(xIn, 1.150, zPij),
            P(xOut, 1.150, zPij),
            P(xOut + sgn * 0.001, 0.720, zPij),
            P(xIn - sgn * 0.001, 0.720, zPij),
          ], pajamaPantsGrad);
          // Bóng nhẹ mặt trong ống quần + nếp vải lanh mềm & sớ dệt mảnh mờ
          ln(P(xIn + sgn * 0.003, 1.135, zPij - 0.001), P(xIn + sgn * 0.002, 0.725, zPij - 0.001), 0.9, 'rgba(66,40,42,.22)');
          ln(P(xOut - sgn * 0.014, 1.01, zPij - 0.002), P(xIn + sgn * 0.006, 0.96, zPij - 0.002), 0.75, 'rgba(68,42,44,.16)');
          ln(P(xIn + sgn * 0.005, 0.87, zPij - 0.002), P(xOut - sgn * 0.008, 0.83, zPij - 0.002), 0.75, 'rgba(228,212,204,.09)');
          // Đường dệt lanh ngang rất mảnh mờ
          for (const wy of [1.08, 0.99, 0.91, 0.80]) {
            ln(P(xIn + sgn * 0.004, wy, zPij - 0.002), P(xOut - sgn * 0.004, wy, zPij - 0.002), 0.5, 'rgba(226,210,202,.07)');
          }
          // Viền hồng đậm ở gấu ống quần + đường gân mép ngoài
          ln(P(xIn - sgn * 0.001, 0.728, zPij - 0.003), P(xOut + sgn * 0.001, 0.728, zPij - 0.003), 1.4, trimCol);
          ln(P(xOut - sgn * 0.001, 1.135, zPij - 0.003), P(xOut + sgn * 0.001, 0.725, zPij - 0.003), 0.8, 'rgba(132,72,86,.45)');
        }
        // Bóng vạt áo phủ lên cạp/nếp gấp quần phía trên
        ln(P(xp - 0.048, 1.178, zPij - 0.002), P(xp + 0.048, 1.178, zPij - 0.002), 2.2, 'rgba(34,16,18,.34)');

        // --- Hai tay ngắn áo pijama + viền tay ---
        for (const sgn of [-1, 1]) {
          poly(c, [
            P(xp + sgn * 0.048, 1.554, zPij),
            P(xp + sgn * 0.066, 1.434, zPij),
            P(xp + sgn * 0.049, 1.422, zPij),
            P(xp + sgn * 0.047, 1.466, zPij),
          ], sgn < 0 ? '#a28382' : '#af908f');
          ln(P(xp + sgn * 0.066, 1.434, zPij - 0.002), P(xp + sgn * 0.049, 1.422, zPij - 0.002), 1.4, trimCol);
        }

        // --- Thân áo pijama vải lanh: vai ngang, suông nhẹ tới gấu ngang hông ---
        const sTop = P(xp, 1.564, zPij), sHem = P(xp, 1.182, zPij);
        if (!pajamaShirtGrad || Math.abs(pajamaShirtY0 - sTop[1]) > 0.5 || Math.abs(pajamaShirtY1 - sHem[1]) > 0.5) {
          pajamaShirtY0 = sTop[1];
          pajamaShirtY1 = sHem[1];
          pajamaShirtGrad = c.createLinearGradient(0, sTop[1], 0, sHem[1]);
          pajamaShirtGrad.addColorStop(0, '#a38382');
          pajamaShirtGrad.addColorStop(0.45, '#bb9e9c');
          pajamaShirtGrad.addColorStop(1, '#ae908e');
        }
        poly(c, [
          P(xp - 0.050, 1.554, zPij),
          P(xp - 0.021, 1.565, zPij),
          P(xp, 1.495, zPij),
          P(xp + 0.021, 1.565, zPij),
          P(xp + 0.050, 1.554, zPij),
          P(xp + 0.052, 1.466, zPij),
          P(xp + 0.055, 1.182, zPij),
          P(xp - 0.055, 1.182, zPij),
          P(xp - 0.052, 1.466, zPij),
        ], pajamaShirtGrad);

        // Hõm cổ tối bên trong cổ bẻ
        poly(c, [
          P(xp - 0.020, 1.564, zPij + 0.002),
          P(xp + 0.020, 1.564, zPij + 0.002),
          P(xp, 1.495, zPij + 0.002),
        ], '#5d3e40');

        // Mặt vải lanh mờ: vài nếp nhăn mềm + các đường dệt rất mảnh mờ (tuyệt đối không vệt bóng lụa)
        ln(P(xp - 0.042, 1.41, zPij - 0.002), P(xp - 0.012, 1.385, zPij - 0.002), 0.75, 'rgba(68,42,44,.15)');
        ln(P(xp + 0.012, 1.29, zPij - 0.002), P(xp + 0.044, 1.265, zPij - 0.002), 0.75, 'rgba(68,42,44,.14)');
        ln(P(xp - 0.036, 1.255, zPij - 0.002), P(xp - 0.008, 1.238, zPij - 0.002), 0.7, 'rgba(228,214,206,.09)');
        for (const wy of [1.48, 1.40, 1.33, 1.26]) {
          ln(P(xp - 0.044, wy, zPij - 0.002), P(xp + 0.044, wy, zPij - 0.002), 0.5, 'rgba(226,210,202,.065)');
        }
        ln(P(xp - 0.026, 1.49, zPij - 0.002), P(xp - 0.028, 1.20, zPij - 0.002), 0.5, 'rgba(72,46,48,.055)');
        ln(P(xp + 0.028, 1.45, zPij - 0.002), P(xp + 0.030, 1.20, zPij - 0.002), 0.5, 'rgba(72,46,48,.055)');

        // Cổ áo bẻ mềm + đường viền hồng đậm theo ve cổ
        for (const sgn of [-1, 1]) {
          const cNeck = P(xp + sgn * 0.021, 1.565, zPij - 0.003);
          const cTip = P(xp + sgn * 0.030, 1.505, zPij - 0.003);
          const cMid = P(xp + sgn * 0.008, 1.492, zPij - 0.003);
          const cTop = P(xp + sgn * 0.001, 1.504, zPij - 0.003);
          poly(c, [cNeck, cTip, cMid, cTop], '#c2a6a3');
          ln(cNeck, cTip, 1.15, trimCol);
          ln(cTip, cMid, 1.15, trimCol);
        }

        // Nẹp áo giữa + hàng cúc nhỏ đều
        ln(P(xp + 0.001, 1.495, zPij - 0.003), P(xp + 0.001, 1.186, zPij - 0.003), 1.0, 'rgba(92,54,60,.45)');
        ln(P(xp + 0.006, 1.495, zPij - 0.003), P(xp + 0.006, 1.186, zPij - 0.003), 0.7, 'rgba(226,208,200,.14)');
        for (const by of [1.462, 1.388, 1.314, 1.240]) {
          const bp = P(xp + 0.002, by, zPij - 0.004);
          c.fillStyle = '#ddd0c8';
          c.beginPath();
          c.arc(bp[0], bp[1], 1.15, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = 'rgba(72,40,46,.45)';
          c.lineWidth = 0.45;
          c.stroke();
        }

        // Một túi ngực nhỏ bên phải áo + đường viền miệng túi
        poly(c, [
          P(xp + 0.015, 1.418, zPij - 0.003),
          P(xp + 0.039, 1.418, zPij - 0.003),
          P(xp + 0.039, 1.348, zPij - 0.003),
          P(xp + 0.027, 1.338, zPij - 0.003),
          P(xp + 0.015, 1.348, zPij - 0.003),
        ], '#b19391');
        ln(P(xp + 0.015, 1.418, zPij - 0.004), P(xp + 0.039, 1.418, zPij - 0.004), 1.3, trimCol);
        ln(P(xp + 0.015, 1.348, zPij - 0.004), P(xp + 0.027, 1.338, zPij - 0.004), 0.65, 'rgba(72,42,46,.22)');
        ln(P(xp + 0.027, 1.338, zPij - 0.004), P(xp + 0.039, 1.348, zPij - 0.004), 0.65, 'rgba(72,42,46,.22)');

        // Viền gấu áo
        ln(P(xp - 0.055, 1.186, zPij - 0.003), P(xp + 0.055, 1.186, zPij - 0.003), 1.3, trimCol);
      }

        c.restore();
      }

      // 4. Cánh tủ bên trái: đóng kín (0 rad) khi khoá -> mở rộng (~1.38 rad) khi đã mở
      {
        const wDoor = (xm - x0) - 0.026;
        const ang = clamp(lerp(0, 1.38, ease(doorAnim)) + shakeAng, 0, 1.42);
        const xH = x0 + 0.02, zH = z0 - 0.01;
        const xE = xH + wDoor * Math.cos(ang), zE = zH - wDoor * Math.sin(ang);
        const gOpen = c.createLinearGradient(0, P(xE, y1, zE)[1], 0, P(xE, y0, zE)[1]);
        gOpen.addColorStop(0, doorAnim > 0.2 ? '#27170d' : '#1e120a');
        gOpen.addColorStop(0.6, doorAnim > 0.2 ? '#362012' : '#2b190d');
        gOpen.addColorStop(1, doorAnim > 0.2 ? '#482b18' : '#362011');
        poly(c, [P(xH, y0, zH), P(xE, y0, zE), P(xE, y1, zE), P(xH, y1, zH)], gOpen);
        for (let i = 0; i < 6; i++) {
          const u = (i + 0.7) / 6.8;
          const vx = lerp(xH, xE, u), vz = lerp(zH, zE, u);
          seg(c, P(vx, y0 + 0.08, vz - 0.001), P(vx, y1 - 0.08, vz - 0.001), 0.8, 'rgba(10,5,2,.26)');
        }
        if (ang > 0.06) {
          poly(c, [P(xE, y0, zE), P(xE - 0.022, y0, zE + 0.016), P(xE - 0.022, y1, zE + 0.016), P(xE, y1, zE)], '#5c3c24');
          seg(c, P(xE, y0, zE), P(xE, y1, zE), 1.1, 'rgba(255,212,165,.22)');
        } else {
          seg(c, P(xE + 0.004, y0, zE - 0.001), P(xE + 0.004, y1, zE - 0.001), 1.8, 'rgba(5,2,1,.88)');
        }
        const hx = lerp(xH, xE, 0.905), hz = lerp(zH, zE, 0.905);
        seg(c, P(hx + 0.004, 0.896, hz - 0.004), P(hx + 0.004, 1.116, hz - 0.004), 3.4, 'rgba(6,3,1,.55)');
        seg(c, P(hx, 0.90, hz - 0.005), P(hx, 1.12, hz - 0.005), 3.0, '#2a190e');
        seg(c, P(hx + 0.004, 0.91, hz - 0.006), P(hx + 0.004, 1.11, hz - 0.006), 0.9, 'rgba(220,178,136,.24)');
      }

      // 5. Cổ tay áo khoác dạ nâu (kèm lót kẻ ô nhỏ) bị kẹp thò ra ở khe giữa hai cánh tủ khi còn khoá
      if (!ket2.tuMo) {
        drawSauPinchedSleeve(c, P(xm - 0.002, 1.24, z0 - 0.012), shakeAng);
      }
    } finally {
      CAM.y = camY0;
    }
  }

  function drawSauPinchedSleeve(c, seamPt, shakeAng) {
    const px = seamPt[0] + (shakeAng || 0) * 18;
    const py = seamPt[1];
    c.save();
    c.translate(px, py);

    // Bóng vải đổ xuống cánh tủ bên phải
    c.fillStyle = 'rgba(6,3,2,.55)';
    c.beginPath();
    c.moveTo(0, -4);
    c.quadraticCurveTo(14, -4, 24, 2);
    c.quadraticCurveTo(27, 13, 19, 17);
    c.quadraticCurveTo(8, 13, -1, 7);
    c.closePath();
    c.fill();

    // Cổ tay áo dạ nâu bị ép hẹp tại khe, xòe nhẹ ra ngoài
    const sleeveGrad = c.createLinearGradient(0, -8, 20, 14);
    sleeveGrad.addColorStop(0, '#462a18');
    sleeveGrad.addColorStop(0.55, '#5d3b23');
    sleeveGrad.addColorStop(1, '#4c2e1a');
    c.fillStyle = sleeveGrad;
    c.beginPath();
    c.moveTo(-2, -4.5);
    c.quadraticCurveTo(10, -8, 19, -2.5);
    c.quadraticCurveTo(21, 5, 16, 11.5);
    c.quadraticCurveTo(8, 9, -2, 4.5);
    c.closePath();
    c.fill();

    // Nếp vải bị kẹp + viền sáng ấm nhẹ mép trên tay áo
    c.strokeStyle = 'rgba(22,10,4,.58)';
    c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-1, -0.5);
    c.quadraticCurveTo(7, 0.5, 13, 3);
    c.moveTo(-1, 2.5);
    c.quadraticCurveTo(6, 4.2, 12, 7.2);
    c.stroke();

    c.strokeStyle = 'rgba(248,214,178,.22)';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(0, -4.4);
    c.quadraticCurveTo(10, -7.2, 18.5, -2.4);
    c.stroke();

    // Viền lót gập ở cổ tay áo (kẻ ô nhỏ giống lót tay áo khoác bên trong tủ)
    c.save();
    c.beginPath();
    c.moveTo(15.5, -3.2);
    c.quadraticCurveTo(22.5, -0.5, 24.5, 5.2);
    c.quadraticCurveTo(23.2, 11.4, 17.5, 12.8);
    c.quadraticCurveTo(14.5, 6.2, 15.5, -3.2);
    c.closePath();
    c.fillStyle = '#8b5736';
    c.fill();
    c.clip();

    c.strokeStyle = 'rgba(32,16,8,.56)';
    c.lineWidth = 0.9;
    c.beginPath();
    for (let x = 16; x <= 24; x += 2.8) {
      c.moveTo(x, -4);
      c.lineTo(x + 1.5, 14);
    }
    c.moveTo(14, 1.5);
    c.lineTo(26, 4.5);
    c.moveTo(14, 6.2);
    c.lineTo(26, 9.2);
    c.stroke();

    c.strokeStyle = 'rgba(226,188,148,.46)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(18.5, -3);
    c.lineTo(20, 14);
    c.moveTo(14, 4);
    c.lineTo(26, 6.8);
    c.stroke();
    c.restore();

    c.restore();
  }

  // Sợi dây đỏ nhỏ buộc chìa khoá tủ thò nhẹ ở mép cốc bút trên bàn khi chưa nhặt
  function drawDeskPenCupCord(c) {
    if (ket2.chiatu || ket2.tuMo) return;
    if (!PEN_CUP_CORD) rebuildFrontGeo();
    const d = PEN_CUP_CORD;
    if (!d) return;
    const ba = c.globalAlpha;
    c.save();
    c.globalAlpha = ba * (ket2.denLen ? 0.68 : 0.94);
    c.lineCap = 'round';
    c.lineJoin = 'round';

    // Bóng mảnh trên mép cốc xanh đen
    c.strokeStyle = 'rgba(8,6,12,0.52)';
    c.lineWidth = 1.9;
    c.beginPath();
    c.moveTo(d.inPt[0] + 0.5, d.inPt[1] + 0.8);
    c.quadraticCurveTo(d.rimPt[0] + 0.5, d.rimPt[1] + 0.8, d.hangCtrl[0] + 0.5, d.hangCtrl[1] + 0.8);
    c.lineTo(d.hangPt[0] + 0.5, d.hangPt[1] + 0.8);
    c.stroke();

    // Thân sợi dây đỏ giữa các cây bút thò qua mép cốc
    c.strokeStyle = '#a8322c';
    c.lineWidth = 1.45;
    c.beginPath();
    c.moveTo(d.peekTip[0], d.peekTip[1]);
    c.quadraticCurveTo(d.peekMid[0], d.peekMid[1], d.inPt[0], d.inPt[1]);
    c.quadraticCurveTo(d.rimPt[0], d.rimPt[1], d.hangCtrl[0], d.hangCtrl[1]);
    c.lineTo(d.hangPt[0], d.hangPt[1]);
    c.stroke();

    // Đường bắt sáng mảnh trên sợi dây
    c.strokeStyle = 'rgba(235,134,118,0.52)';
    c.lineWidth = 0.65;
    c.beginPath();
    c.moveTo(d.peekTip[0] - 0.3, d.peekTip[1]);
    c.quadraticCurveTo(d.peekMid[0] - 0.3, d.peekMid[1], d.inPt[0], d.inPt[1] - 0.3);
    c.quadraticCurveTo(d.rimPt[0], d.rimPt[1] - 0.3, d.hangCtrl[0] - 0.2, d.hangCtrl[1]);
    c.stroke();

    c.restore();
  }

  // Ổ khoá tròn nhỏ bằng đồng âm trên mép cánh phải tủ quần áo (và chiếc chìa cắm lại khi đã mở)
  function drawSauWardrobeLock(c, now) {
    const ba = c.globalAlpha;
    let glintBoost = 0;
    if (!ket2.tuMo && wardShakeAt) {
      const dtS = now - wardShakeAt;
      if (dtS >= 0 && dtS < 380) {
        const env = 1 - dtS / 380;
        glintBoost = Math.abs(Math.sin(dtS * 0.03)) * env;
      }
    }

    const px = sauLockPt[0], py = sauLockPt[1];
    c.save();

    // Hõm âm khoét tròn trong gỗ sẫm
    c.fillStyle = '#0c0603';
    c.beginPath();
    c.arc(px, py, 3.9, 0, Math.PI * 2);
    c.fill();

    // Mép hõm trên-trái hắt nhẹ ánh đèn từ góc phải-dưới
    c.strokeStyle = 'rgba(116,76,46,0.58)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(px, py, 3.85, Math.PI * 0.92, Math.PI * 1.72);
    c.stroke();

    // Mặt đồng tròn nhỏ của ổ khoá
    c.fillStyle = '#6a4f21';
    c.beginPath();
    c.arc(px, py, 2.95, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#7e602b';
    c.beginPath();
    c.arc(px, py, 2.1, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = 'rgba(222,188,116,0.58)';
    c.lineWidth = 0.85;
    c.beginPath();
    c.arc(px, py, 2.55, -0.15, Math.PI * 0.68);
    c.stroke();

    // Khe chìa dọc nhỏ ở tâm
    c.fillStyle = '#090503';
    c.fillRect(px - 0.55, py - 1.7, 1.1, 3.4);
    c.beginPath();
    c.arc(px, py - 0.1, 0.8, 0, Math.PI * 2);
    c.fill();

    // Ánh bắt sáng rất nhẹ khi còn khoá để nhìn kỹ sẽ thấy
    if (!ket2.tuMo && sparkSp) {
      const pulse = 0.11 + 0.06 * Math.sin(now * 0.0024) + glintBoost * 0.24;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * Math.min(0.45, pulse);
      c.drawImage(sparkSp, px - 8.5, py - 8.5, 20, 20);
      c.restore();
    }

    // Khi tủ đã mở: chiếc chìa đồng nhỏ + đoạn dây đỏ cắm yên trong ổ
    if (ket2.tuMo) {
      c.save();
      c.translate(px, py);
      c.lineCap = 'round';

      // Sợi dây đỏ nhỏ rủ nhẹ từ vòng chìa
      c.strokeStyle = '#922a24';
      c.lineWidth = 1.05;
      c.beginPath();
      c.moveTo(7.9, 3.3);
      c.quadraticCurveTo(9.3, 6.0, 8.1, 9.1);
      c.stroke();

      // Thân chìa đồng cắm ngang hơi chếch
      c.rotate(0.22);
      c.strokeStyle = '#8b6b31';
      c.lineWidth = 1.45;
      c.beginPath();
      c.moveTo(0.4, 0);
      c.lineTo(6.2, 0);
      c.stroke();

      c.strokeStyle = 'rgba(226,192,120,0.68)';
      c.lineWidth = 0.65;
      c.beginPath();
      c.moveTo(0.8, -0.4);
      c.lineTo(5.8, -0.4);
      c.stroke();

      // Vòng tròn đầu chìa
      c.fillStyle = '#a3803c';
      c.beginPath();
      c.arc(8.1, 0, 2.25, 0, Math.PI * 2);
      c.arc(8.1, 0, 0.95, 0, Math.PI * 2, true);
      c.fill('evenodd');

      c.strokeStyle = 'rgba(232,198,128,0.65)';
      c.lineWidth = 0.65;
      c.beginPath();
      c.arc(8.1, 0, 2.0, -Math.PI * 0.9, -Math.PI * 0.15);
      c.stroke();
      c.restore();
    }

    c.restore();
  }

  // Gác xép ngủ phía trên + thành sắt trắng nhiều thanh dọc + thang sắt nhỏ (kẹp vẽ động theo denLen)
  function drawSauLoftStatic(c) {
    const L = -2.35, R = 2.35, Y_DECK0 = 2.00, Y_DECK1 = 2.12, Z_LOFT = 3.98;
    const Y_TOP = 2.72;
    const GAP_X0 = -0.84, GAP_X1 = -0.38;

    // 1. Nền gác xép chìm tối phía sau thanh chắn (chỉ gợi khối chăn gối mờ)
    poly(c, [P(L, Y_DECK1, Z_LOFT), P(R, Y_DECK1, Z_LOFT), P(R, Y_DECK1, 5.55), P(L, Y_DECK1, 5.55)], '#0d0f13');
    poly(c, [P(0.25, Y_DECK1, 4.65), P(2.05, Y_DECK1, 4.65), P(2.15, Y_DECK1 + 0.22, 5.25), P(0.15, Y_DECK1 + 0.18, 5.25)], '#13161c');

    // 2. Bề dày sàn gác xép và mặt dưới
    poly(c, [P(L, Y_DECK0, Z_LOFT), P(R, Y_DECK0, Z_LOFT), P(R, Y_DECK0, 4.85), P(L, Y_DECK0, 4.85)], '#1e2024');
    poly(c, [P(-0.05, Y_DECK0, 4.85), P(R, Y_DECK0, 4.85), P(R, Y_DECK0, 5.75), P(-0.05, Y_DECK0, 5.75)], '#141518');
    {
      const gEdge = c.createLinearGradient(P(L, Y_DECK0, Z_LOFT)[0], 0, P(R, Y_DECK0, Z_LOFT)[0], 0);
      gEdge.addColorStop(0, '#36383d');
      gEdge.addColorStop(0.55, '#6c6a66');
      gEdge.addColorStop(1, '#323438');
      poly(c, [P(L, Y_DECK0, Z_LOFT), P(R, Y_DECK0, Z_LOFT), P(R, Y_DECK1, Z_LOFT), P(L, Y_DECK1, Z_LOFT)], gEdge);
      seg(c, P(L, Y_DECK0, Z_LOFT), P(R, Y_DECK0, Z_LOFT), 1, 'rgba(255,220,175,.16)');
    }

    // 3. Thành sắt sơn trắng nhiều thanh dọc (sẽ được lớp sauLoftDarkC làm tối khi denLen = false)
    const railCol = (x) => {
      const k = clamp(1.05 - Math.abs(x - 0.35) * 0.22, 0.42, 1.0);
      const v = Math.round(78 + 72 * k);
      return `rgb(${v},${v},${v - 2})`;
    };
    const drawRailSpan = (rx0, rx1) => {
      seg(c, P(rx0, Y_TOP, Z_LOFT), P(rx1, Y_TOP, Z_LOFT), 3.5, railCol((rx0 + rx1) * 0.5));
      seg(c, P(rx0, Y_TOP + 0.005, Z_LOFT), P(rx1, Y_TOP + 0.005, Z_LOFT), 1, 'rgba(240,238,232,.26)');
      seg(c, P(rx0, Y_DECK1 + 0.02, Z_LOFT), P(rx1, Y_DECK1 + 0.02, Z_LOFT), 2.5, railCol((rx0 + rx1) * 0.5));
      for (const px of [rx0, rx1]) {
        seg(c, P(px, Y_DECK1, Z_LOFT), P(px, Y_TOP, Z_LOFT), 3.4, railCol(px));
      }
    };
    drawRailSpan(-2.30, GAP_X0);
    drawRailSpan(GAP_X1, 2.30);

    const drawVBar = (vx) => {
      seg(c, P(vx, Y_DECK1 + 0.02, Z_LOFT), P(vx, Y_TOP, Z_LOFT), 1.9, railCol(vx));
      seg(c, P(vx - 0.006, Y_DECK1 + 0.03, Z_LOFT), P(vx - 0.006, Y_TOP - 0.01, Z_LOFT), 0.7, 'rgba(244,242,234,.18)');
    };
    for (let vx = -2.22; vx <= GAP_X0 - 0.08; vx += 0.115) drawVBar(vx);
    const CLIP_X = -0.24 + 8 * 0.115; // = 0.68
    for (let i = 0; i <= 22; i++) {
      const vx = -0.24 + i * 0.115;
      if (vx < 2.26) drawVBar(vx);
    }
    sauClipPt = P(CLIP_X, 2.38, Z_LOFT);

    // 4. Thang sắt nhỏ tựa từ sàn lên lối mở gác xép
    {
      const lx0 = GAP_X0 + 0.04, lx1 = GAP_X1 - 0.04;
      const zBot = 3.36, zTop = Z_LOFT - 0.02;

      for (const lx of [lx0, lx1]) {
        const pf = P(lx, 0.002, zBot), ps = P(lx - 0.04, 0.002, zBot + 0.52);
        seg(c, pf, ps, 5, 'rgba(0,0,0,.38)');
      }

      for (const lx of [lx0, lx1]) {
        const A = P(lx, 0, zBot), B = P(lx, Y_DECK1 + 0.04, zTop), C = P(lx, Y_DECK1 + 0.16, zTop + 0.14);
        seg(c, A, B, 4.2, '#4a4d52');
        seg(c, B, C, 3.8, '#42454a');
        seg(c, [A[0] - 1.1, A[1]], [B[0] - 1.1, B[1]], 1.1, 'rgba(240,224,198,.22)');
      }
      for (let i = 1; i <= 7; i++) {
        const u = i / 7.8;
        const ry = u * Y_DECK1;
        const rz = lerp(zBot, zTop, u);
        const kl = clamp(1.1 - u * 0.35, 0.45, 0.95);
        const v = Math.round(58 + 56 * kl);
        seg(c, P(lx0, ry, rz), P(lx1, ry, rz), 3.0, `rgb(${v},${v},${v - 2})`);
        seg(c, P(lx0, ry + 0.004, rz), P(lx1, ry + 0.004, rz), 0.9, 'rgba(255,228,190,.16)');
      }
    }
  }

  // Kẹp tóc càng cua, nhựa trong. (x,y) = giữa bản lề; s = cỡ (1 ≈ rộng 100px).
  const KT = (a) => `rgba(238,212,224,${a})`;
  const KE = (a) => `rgba(255,249,242,${a})`;

  // Kiểu A: chính diện, dáng bát: sống lưng cong, răng cong mạnh vào trong, hàng răng sau lộ giữa khe.
  function veKep(c, x, y, s, mo = 0, giua = null) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const W = 50;                       // nửa bề rộng
    const hang = (back) => {
      const n = back ? 6 : 7;
      for (let i = 0; i < n; i++) {
        const u = (n === 1 ? 0 : (i + (back ? 0.5 : 0)) / (back ? n : n - 1)) * 2 - 1; // -1..1
        const sx = u * W * 0.86, sy = 12;
        const len = (back ? 36 : 40) - Math.pow(Math.abs(u), 3) * 6 - mo * (back ? 12 : 0);
        const ex = sx * 0.86, ey = sy + len;                // đầu răng hơi chụm
        const tw = back ? 4.6 : 5.6;
        c.beginPath();
        c.moveTo(sx - tw, sy);
        c.bezierCurveTo(sx - tw, sy + len * 0.6, ex - tw * 0.6, ey - 10, ex, ey);
        c.bezierCurveTo(ex + tw * 0.6, ey - 10, sx + tw, sy + len * 0.6, sx + tw, sy);
        c.closePath();
        c.fillStyle = back ? 'rgba(120,96,110,.30)' : KT(0.30); c.fill();
        c.strokeStyle = KE(back ? 0.25 : 0.7); c.lineWidth = back ? 1.3 : 1.9; c.stroke();
        if (!back) { // vệt sáng dọc răng + đầu răng quặp ra phía trước
          c.beginPath(); c.moveTo(sx - tw * 0.35, sy + 4); c.lineTo(ex - tw * 0.3, ey - 9);
          c.strokeStyle = KE(0.5); c.lineWidth = 1.3; c.stroke();
        }
      }
    };
    hang(true);
    if (giua) { c.save(); giua(c); c.restore(); } // thứ bị kẹp: vẽ giữa hàng răng sau và hàng răng trước (toạ độ của kẹp, s=1)
    // tay bóp: một bản nhựa rộng nhô lên trên bản lề, loe nhẹ ở mép trên
    c.save(); c.translate(0, 4); c.scale(0.92, 0.85 - mo * 0.2);
    c.beginPath();
    c.moveTo(-30, 2);
    c.lineTo(-37, -24); c.quadraticCurveTo(-38, -32, -30, -32);
    c.quadraticCurveTo(0, -38, 30, -32);
    c.quadraticCurveTo(38, -32, 37, -24);
    c.lineTo(30, 2);
    c.closePath();
    c.fillStyle = KT(0.30); c.fill(); c.strokeStyle = KE(0.7); c.lineWidth = 2; c.stroke();
    // gân nổi trên tay bóp
    c.strokeStyle = KE(0.35); c.lineWidth = 1.4;
    for (const gx of [-14, 0, 14]) { c.beginPath(); c.moveTo(gx * 1.1, -28); c.lineTo(gx, -4); c.stroke(); }
    c.restore();
    hang(false);
    // bản lề thẳng, bo tròn hai đầu, lò xo ở giữa
    c.beginPath(); c.roundRect(-W, 2, W * 2, 14, 7);
    c.fillStyle = KT(0.42); c.fill(); c.strokeStyle = KE(0.8); c.lineWidth = 2.1; c.stroke();
    c.beginPath(); c.moveTo(-W + 8, 6); c.lineTo(W - 8, 6); c.strokeStyle = KE(0.6); c.lineWidth = 1.4; c.stroke();
    c.strokeStyle = 'rgba(206,210,218,.85)'; c.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(i * 3.4, 9, 1.6, 5, 0.3, 0, Math.PI * 2); c.stroke(); }
    // lóa
    const g = c.createRadialGradient(-20, 0, 0, -20, 0, 12);
    g.addColorStop(0, KE(0.9)); g.addColorStop(1, KE(0));
    c.fillStyle = g; c.fillRect(-34, -12, 28, 24);
    c.restore();
  }

  // Kẹp tóc càng cua trên thành gác (+ vệt sáng ấm khi denLen = true)
  function drawSauClipAndLoftLight(c, now, lit) {
    const ba = c.globalAlpha;
    const t = now * 0.001;

    if (lit && warmSp) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      // Vệt sáng ấm từ đèn bàn xoay hắt lên thành gác và quanh chiếc kẹp
      c.globalAlpha = ba * (0.20 + 0.03 * Math.sin(t * 1.4));
      c.drawImage(warmSp, sauClipPt[0] - 260, sauClipPt[1] - 90, 480, 210);
      c.globalAlpha = ba * 0.11;
      c.drawImage(warmSp, 520, 125, 420, 185);
      // Mép sáng ấm dọc thanh chắn trắng phía trên & thanh dọc quanh kẹp
      c.globalAlpha = ba;
      c.strokeStyle = 'rgba(255,222,175,.28)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(645, 139);
      c.lineTo(1060, 139);
      c.moveTo(645, 258);
      c.lineTo(1060, 258);
      c.moveTo(sauClipPt[0], 141);
      c.lineTo(sauClipPt[0], 256);
      c.stroke();
      c.restore();
    }

    // Chiếc kẹp càng cua nhìn chính diện ôm đúng thanh dọc trên thành gác
    c.save();
    c.globalAlpha = ba * (lit ? 1.0 : 0.18);
    const giuaSau = (lit && !ket2HasPicked('La4')) ? (c2) => {
      roundRect(c2, -13, 14, 26, 64, 3);
      c2.fillStyle = '#e0562c';
      c2.fill();
      c2.fillStyle = 'rgba(255,244,230,.45)';
      c2.fillRect(-9, 18, 4, 54);
    } : null;
    veKep(c, sauClipPt[0], sauClipPt[1], 0.34, 0, giuaSau);
    c.restore();

    if (lit && sparkSp) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * (0.34 + 0.24 * (0.5 + 0.5 * Math.sin(t * 2.4)));
      c.drawImage(sparkSp, sauClipPt[0] - 22, sauClipPt[1] - 21, 24, 24);
      c.restore();
    }
  }

  // Nướng lớp tối phủ gác (khi denLen = false) + lớp vignette/hạt mịn phủ trên cùng SC.p502sau
  function drawSauOverlaysBake(w, h) {
    // 1. Lớp tối vùng gác xép khi đèn bàn chưa xoay lên
    sauLoftDarkC.width = w;
    sauLoftDarkC.height = h;
    {
      const c = sauLoftDarkG;
      setT(c);
      const gd = c.createLinearGradient(0, 60, 0, 360);
      gd.addColorStop(0, 'rgba(2,4,8,.84)');
      gd.addColorStop(0.55, 'rgba(3,5,10,.76)');
      gd.addColorStop(0.85, 'rgba(4,6,10,.32)');
      gd.addColorStop(1, 'rgba(4,6,10,0)');
      c.fillStyle = gd;
      c.fillRect(-300, -300, W + 600, 680);
    }

    // 2. Lớp bóng tối quanh mép phòng + hạt phim + vignette
    sauVignC.width = w;
    sauVignC.height = h;
    {
      const c = sauVignG;
      setT(c);
      const lp = P(0.18, 0.05, 2.75);
      sauLampFloorPt = [lp[0], lp[1]];

      const gDk = c.createRadialGradient(lp[0], lp[1] - 90, 90, lp[0], lp[1] - 110, 920);
      gDk.addColorStop(0, 'rgba(0,0,0,.02)');
      gDk.addColorStop(0.42, 'rgba(0,0,0,.22)');
      gDk.addColorStop(0.78, 'rgba(0,0,0,.52)');
      gDk.addColorStop(1, 'rgba(0,0,0,.74)');
      c.fillStyle = gDk;
      c.fillRect(-300, -300, W + 600, H + 600);

      for (let i = 0; i < 6500; i++) {
        c.fillStyle = `rgba(255,255,255,${rnd() * 0.018})`;
        c.fillRect(rnd() * W, rnd() * H, 1.3, 1.3);
      }
      vignette(c, 0.78);
    }
  }

  function bakeSau() {
    initSprites();
    const w = cv.width || W, h = cv.height || H;
    sauC.width = w;
    sauC.height = h;
    const c = sauG;
    setT(c);
    const camY0 = CAM.y, seed0 = seed;
    CAM.y = 1.45;
    seed = 5022;
    try {
      drawSauShellAndFloor(c);
      drawSauLeftDoorAndWindow(c);
      drawSauKitchen(c);
      drawSauWardrobeStatic(c);
      sauLockPt = P(-1.575, 1.015, 4.085);
      sauPinchPt = P(-1.67, 1.24, 4.088);
      drawSauLoftStatic(c);
      if (sauWinPts) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        const wx = (sauWinPts[0][0] + sauWinPts[2][0]) * 0.5;
        const wy = (sauWinPts[0][1] + sauWinPts[2][1]) * 0.5;
        const gc = c.createRadialGradient(wx + 22, wy + 18, 12, wx + 28, wy + 24, 240);
        gc.addColorStop(0, 'rgba(115,155,205,.12)');
        gc.addColorStop(0.55, 'rgba(90,130,185,.04)');
        gc.addColorStop(1, 'rgba(70,110,160,0)');
        c.fillStyle = gc;
        c.fillRect(wx - 240, wy - 240, 520, 520);
        c.restore();
      }
      drawSauOverlaysBake(w, h);
    } finally {
      CAM.y = camY0;
      seed = seed0;
    }
  }

  // ================= NƯỚNG & VẼ CẢNH CẬN TÚI ÁO KHOÁC (SC.tuiao) =================
  const TUIAO_SNAPS = [
    { x: 625, y: 458 },
    { x: 975, y: 458 },
  ];
  const TUIAO_PIECE_R = { x: 645, y: 345, w: 310, h: 215 };

  function bakeTuiaoBg() {
    initSprites();
    const w = cv.width || W, h = cv.height || H;
    tuiaoBgC.width = w;
    tuiaoBgC.height = h;
    const c = tuiaoBgG;
    setT(c);
    const seed0 = seed;
    seed = 5025;
    try {
      // Nền vạt áo khoác dạ nâu ấm kín khung hình
      const gw = c.createLinearGradient(250, 0, 1350, H);
      gw.addColorStop(0, '#321e11');
      gw.addColorStop(0.45, '#4c2e1b');
      gw.addColorStop(1, '#2b190d');
      c.fillStyle = gw;
      c.fillRect(-300, -300, W + 600, H + 600);

      // Sợi dạ đan chéo mảnh (nướng tĩnh 1 lần)
      for (let i = 0; i < 4200; i++) {
        const x = rnd() * W, y = rnd() * H;
        c.strokeStyle = rnd() < 0.5 ? `rgba(255,220,185,${rnd() * 0.035})` : `rgba(12,5,2,${rnd() * 0.06})`;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + (rnd() - 0.5) * 8, y + (rnd() - 0.5) * 8);
        c.stroke();
      }

      // Đường may nẹp dọc bên trái vạt áo + khuy áo lớn ở mép làm điểm tựa tỷ lệ
      c.strokeStyle = 'rgba(20,10,4,.48)';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(295, -50);
      c.lineTo(275, H + 50);
      c.stroke();

      c.save();
      c.setLineDash([8, 6]);
      c.strokeStyle = 'rgba(186,142,104,.24)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(278, -50);
      c.lineTo(258, H + 50);
      c.stroke();
      c.restore();

      c.fillStyle = '#2d1c10';
      c.beginPath();
      c.arc(215, 290, 26, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(170,132,96,.32)';
      c.lineWidth = 1.6;
      c.stroke();

      // Bóng đổ nhẹ dưới thân túi áo đắp
      c.fillStyle = 'rgba(10,4,1,.44)';
      roundRect(c, 528, 412, 560, 326, 28);
      c.fill();

      // Thân túi áo đắp (vải dạ nâu sậm hơn nhẹ ở mép, đường chỉ khâu tay đều)
      const gp = c.createLinearGradient(0, 395, 0, 725);
      gp.addColorStop(0, '#442817');
      gp.addColorStop(1, '#583620');
      c.fillStyle = gp;
      roundRect(c, 520, 398, 560, 324, 26);
      c.fill();
      c.strokeStyle = 'rgba(18,9,3,.52)';
      c.lineWidth = 2;
      c.stroke();

      c.save();
      c.setLineDash([7, 6]);
      c.strokeStyle = 'rgba(210,168,128,.28)';
      c.lineWidth = 1.6;
      roundRect(c, 534, 410, 532, 298, 20);
      c.stroke();
      c.restore();

      // Lỗ khuy nhận cúc dưới nằm trên mép trên túi (lộ ra khi tháo cúc / mở nắp)
      for (let i = 0; i < 2; i++) {
        const sx = TUIAO_SNAPS[i].x, sy = TUIAO_SNAPS[i].y;
        c.fillStyle = '#1b1410';
        c.beginPath();
        c.arc(sx, sy, 14, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#7e6953';
        c.lineWidth = 3.2;
        c.stroke();
        c.fillStyle = '#2a221c';
        c.beginPath();
        c.arc(sx, sy, 6.5, 0, Math.PI * 2);
        c.fill();
      }

      vignette(c, 0.72);
    } finally {
      seed = seed0;
    }
  }

  function drawTuiaoDynamic(c, now, dt) {
    const ba = c.globalAlpha;
    const s = Math.min(0.05, dt || 0.016);
    const openDone = !!(ket2.cuc[0] && ket2.cuc[1]);
    flapAnim = lerp(flapAnim, openDone ? 1 : 0, Math.min(1, s * 9));

    const openK = ease(flapAnim);

    // Miệng túi tối & mảnh nhựa màu tím lộ ra khi nắp mở
    if (openK > 0.03) {
      c.save();
      c.beginPath();
      c.rect(530, 360, 540, 120);
      c.clip();

      c.fillStyle = '#120904';
      roundRect(c, 544, 386, 512, 42, 10);
      c.fill();

      if (!ket2HasPicked('Si4')) {
        const pulse = 0.75 + 0.25 * Math.sin(now * 0.0028);
        c.save();
        c.translate(804, lerp(432, 408, openK));
        c.rotate(-0.18);
        drawPieceShape(c, 220, MANH_META.Si4.rgb, MANH_META.Si4.rim);
        c.restore();

        if (sparkSp && openK > 0.55) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = ba * 0.24 * pulse;
          c.drawImage(sparkSp, 745, 368, 74, 74);
          c.restore();
        }
      }
      c.restore();
    }

    // Nắp túi gập lên quanh mép trên y = 352; hai góc dưới nhấc nhẹ khi từng cúc được bấm mở
    const hingeY = 352;
    const liftL = ket2.cuc[0] ? 42 : 0;
    const liftR = ket2.cuc[1] ? 42 : 0;
    const botY = lerp(496, 252, openK);
    const foldBack = openK > 0.56;

    // Bóng đổ dưới nắp túi xuống thân túi
    c.fillStyle = `rgba(10,4,1,${(0.36 * (1 - openK * 0.65)).toFixed(3)})`;
    c.beginPath();
    c.moveTo(516, hingeY + 8);
    c.lineTo(1084, hingeY + 8);
    c.lineTo(1078, botY + 12 - liftR * (1 - openK));
    c.lineTo(522, botY + 12 - liftL * (1 - openK));
    c.closePath();
    c.fill();

    const gFlap = c.createLinearGradient(0, hingeY, 0, botY);
    if (foldBack) {
      gFlap.addColorStop(0, '#362113');
      gFlap.addColorStop(1, '#2a180d');
    } else {
      gFlap.addColorStop(0, '#5a3721');
      gFlap.addColorStop(1, '#482b18');
    }
    c.fillStyle = gFlap;
    c.beginPath();
    c.moveTo(512, hingeY);
    c.lineTo(1088, hingeY);
    c.lineTo(1082, botY - 26 - liftR * (1 - openK));
    c.quadraticCurveTo(1080, botY - liftR * (1 - openK), 1054, botY - liftR * (1 - openK));
    c.lineTo(546, botY - liftL * (1 - openK));
    c.quadraticCurveTo(520, botY - liftL * (1 - openK), 518, botY - 26 - liftL * (1 - openK));
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(18,9,3,.58)';
    c.lineWidth = 2;
    c.stroke();

    // Đường chỉ khâu quanh nắp
    c.save();
    c.setLineDash([7, 6]);
    c.strokeStyle = 'rgba(212,170,130,.28)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(526, hingeY + 8);
    c.lineTo(532, lerp(botY - 12 - liftL * (1 - openK), botY + 10, openK));
    c.lineTo(1068, lerp(botY - 12 - liftR * (1 - openK), botY + 10, openK));
    c.lineTo(1074, hingeY + 8);
    c.stroke();
    c.restore();

    // Hai cúc bấm kim loại trên nắp túi
    for (let i = 0; i < 2; i++) {
      const opened = ket2.cuc[i];
      const lift = opened ? 42 : 0;
      const syBase = lerp(TUIAO_SNAPS[i].y, 282, openK);
      const sy = syBase - lift * (1 - openK);
      const sx = TUIAO_SNAPS[i].x;

      c.save();
      c.translate(sx, sy);
      if (foldBack) c.scale(1, 0.72);

      if (!opened) {
        c.fillStyle = 'rgba(8,3,1,.45)';
        c.beginPath();
        c.arc(2, 4, 21, 0, Math.PI * 2);
        c.fill();

        const gBtn = c.createRadialGradient(-5, -6, 2, 0, 0, 21);
        gBtn.addColorStop(0, '#c8a982');
        gBtn.addColorStop(0.55, '#86694a');
        gBtn.addColorStop(1, '#4c3824');
        c.fillStyle = gBtn;
        c.beginPath();
        c.arc(0, 0, 20, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = 'rgba(255,228,192,.45)';
        c.lineWidth = 1.4;
        c.beginPath();
        c.arc(0, 0, 14, Math.PI * 1.1, Math.PI * 1.85);
        c.stroke();
      } else {
        // Khi cúc đã mở, thấy chấu bấm mặt trong nắp đã bật ra
        c.fillStyle = '#5c4b39';
        c.beginPath();
        c.arc(0, 0, 12, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = 'rgba(218,195,165,.42)';
        c.lineWidth = 1.2;
        c.stroke();
      }
      c.restore();
    }
  }

  // ================= NƯỚNG & VẼ CẢNH CẬN TRÊN GÁC (SC.gac) =================
  const GAC_CLIP_R = { x: 660, y: 215, w: 368, h: 375 };

  function drawSoftDefocus(c, drawShape, col, steps, spread) {
    c.save();
    for (let i = steps; i >= 1; i--) {
      c.globalAlpha = 0.08 + (steps - i) * 0.03;
      drawShape(i * spread);
      c.fillStyle = col;
      c.fill();
    }
    c.restore();
  }

  function bakeGacBg() {
    initSprites();
    const w = cv.width || W, h = cv.height || H;
    gacBgC.width = w;
    gacBgC.height = h;
    const c = gacBgG;
    setT(c);
    const seed0 = seed;
    seed = 5027;
    try {
      // Nền gác đêm sâu phía sau
      const gBg = c.createLinearGradient(0, 0, 0, H);
      gBg.addColorStop(0, '#07090e');
      gBg.addColorStop(0.55, '#0d121b');
      gBg.addColorStop(1, '#121822');
      c.fillStyle = gBg;
      c.fillRect(-300, -300, W + 600, H + 600);

      // Nệm và hai chiếc gối mờ giản lược phía sau thành sắt (không dùng ctx.filter/shadowBlur)
      drawSoftDefocus(c, (pad) => {
        roundRect(c, 150 - pad, 500 - pad * 0.6, 1340 + pad * 2, 340 + pad, 36 + pad * 0.5);
      }, '#19212e', 5, 10);

      drawSoftDefocus(c, (pad) => {
        roundRect(c, 690 - pad, 465 - pad * 0.6, 820 + pad * 2, 340 + pad, 44 + pad * 0.5);
      }, '#212b3b', 4, 9);

      // Hai chiếc gối mờ bên trái
      for (const [px, py, pw, ph, rot] of [[255, 420, 260, 105, -0.06], [495, 430, 240, 100, 0.05]]) {
        c.save();
        c.translate(px + pw * 0.5, py + ph * 0.5);
        c.rotate(rot);
        drawSoftDefocus(c, (pad) => {
          roundRect(c, -pw * 0.5 - pad, -ph * 0.5 - pad, pw + pad * 2, ph + pad * 2, 34 + pad * 0.4);
        }, '#2a3446', 4, 7);
        c.restore();
      }

      // Hắt sáng ấm rất dịu từ đèn bàn phía dưới hắt lên thành sắt trước mặt
      if (warmSp) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.22;
        c.drawImage(warmSp, 470, 240, 660, 520);
        c.restore();
      }

      // Hai thanh dọc phụ hai bên (mờ hơn thanh giữa)
      for (const bx of [270, 1330]) {
        c.fillStyle = '#2f343d';
        c.fillRect(bx - 12, 212, 24, 496);
        c.fillStyle = 'rgba(220,218,212,.14)';
        c.fillRect(bx - 9, 212, 5, 496);
      }

      // Thành sắt trắng ngang trên & dưới
      for (const [ry, rh] of [[194, 34], [690, 32]]) {
        const gH = c.createLinearGradient(0, ry, 0, ry + rh);
        gH.addColorStop(0, '#62666d');
        gH.addColorStop(0.45, '#b8b5ad');
        gH.addColorStop(0.85, '#d6cec0');
        gH.addColorStop(1, '#50545b');
        c.fillStyle = gH;
        c.fillRect(-50, ry, W + 100, rh);
      }

      // Thanh sắt trắng dọc chính giữa màn hình (x: 783..817)
      const gBar = c.createLinearGradient(783, 0, 817, 0);
      gBar.addColorStop(0, '#4c5159');
      gBar.addColorStop(0.28, '#e8e0d2');
      gBar.addColorStop(0.62, '#c8c4ba');
      gBar.addColorStop(1, '#585c64');
      c.fillStyle = gBar;
      c.fillRect(783, 216, 34, 488);
      c.fillStyle = 'rgba(255,248,236,.35)';
      c.fillRect(789, 216, 3, 488);

      for (let i = 0; i < 4500; i++) {
        c.fillStyle = `rgba(255,255,255,${rnd() * 0.015})`;
        c.fillRect(rnd() * W, rnd() * H, 1.3, 1.3);
      }
      vignette(c, 0.72);
    } finally {
      seed = seed0;
    }
  }

  function drawGacClipAndPiece(c, now, dt) {
    const ba = c.globalAlpha;
    const s = Math.min(0.05, dt || 0);
    const picked = ket2HasPicked('La4');

    if (gacOpening) {
      gacOpenT += s;
      if (gacOpenT < 0.35) {
        gacClipAnim = ease(clamp(gacOpenT / 0.35, 0, 1));
      } else if (gacOpenT < 0.50) {
        gacClipAnim = 1;
      } else {
        gacClipAnim = 1 - ease(clamp((gacOpenT - 0.50) / 0.30, 0, 1));
      }
      gacDropAnim = clamp((gacOpenT - 0.10) / 0.55, 0, 1);
      if (gacOpenT >= 0.80) {
        gacOpening = false;
        gacClipAnim = 0;
        gacDropAnim = 1;
      }
    } else {
      gacClipAnim = 0;
    }

    const cx = 844, cy = 330;

    // Vệt sáng ấm mềm phía sau kẹp (đèn bàn phía dưới hắt lên)
    if (warmSp) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * 0.18;
      c.drawImage(warmSp, cx - 220, cy - 110, 440, 400);
      c.restore();
    }

    const showPiece = !picked || (gacOpening && gacDropAnim < 1);
    const giuaGac = showPiece ? (c2) => {
      const dropK = gacOpening ? gacDropAnim * gacDropAnim : 0;
      const pAlpha = gacOpening ? 1 - clamp((gacDropAnim - 0.55) / 0.45, 0, 1) : 1;
      c2.save();
      c2.globalAlpha *= pAlpha;
      c2.translate(dropK * 6, dropK * 145);
      c2.rotate(dropK * 0.25);
      roundRect(c2, -13, 14, 26, 64, 3);
      c2.fillStyle = '#e0562c';
      c2.fill();
      c2.strokeStyle = 'rgba(255,196,160,.82)';
      c2.lineWidth = 1.4;
      c2.stroke();
      c2.fillStyle = 'rgba(255,244,230,.48)';
      c2.fillRect(-9.5, 18, 4, 56);
      c2.restore();
    } : null;

    veKep(c, cx, cy, 2.8, gacClipAnim, giuaGac);

    // Lấp lánh khẽ cạnh tay bóp khi còn giữ mảnh
    if (!picked && !gacOpening && sparkSp) {
      const pulse = 0.6 + 0.4 * Math.sin(now * 0.0026);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ba * 0.34 * pulse;
      c.drawImage(sparkSp, cx - 114, cy - 110, 56, 56);
      c.restore();
    }
  }

  // Mưa chảy khẽ trên kính cửa sổ nhỏ (cắt gọn trong sauWinPts, không tạo gradient)
  const RAINS = Array.from({ length: 14 }, (_, i) => ({
    u: (i + 0.5) / 14,
    phase: (i * 0.37) % 1,
    spd: 0.24 + (i % 4) * 0.06,
    len: 0.08 + (i % 3) * 0.05,
  }));

  function drawSauWindowRain(c, now) {
    if (!sauWinPts) return;
    const t = now * 0.001;
    const p0 = sauWinPts[0], p1 = sauWinPts[1], p2 = sauWinPts[2], p3 = sauWinPts[3];
    c.save();
    c.beginPath();
    c.moveTo(p0[0], p0[1]);
    c.lineTo(p1[0], p1[1]);
    c.lineTo(p2[0], p2[1]);
    c.lineTo(p3[0], p3[1]);
    c.closePath();
    c.clip();

    c.lineCap = 'round';
    c.strokeStyle = 'rgba(175,205,235,.22)';
    c.lineWidth = 1.05;
    for (let i = 0; i < RAINS.length; i++) {
      const r = RAINS[i];
      const v0 = (r.phase + t * r.spd) % 1.15 - 0.1;
      const v1 = v0 + r.len;
      const topX = lerp(p0[0], p1[0], r.u), topY = lerp(p0[1], p1[1], r.u);
      const botX = lerp(p3[0], p2[0], r.u), botY = lerp(p3[1], p2[1], r.u);
      const x0 = lerp(topX, botX, v0), y0 = lerp(topY, botY, v0);
      const x1 = lerp(topX, botX, v1), y1 = lerp(topY, botY, v1);
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1 + sauWinAcross[0] * 0.6, y1 + sauWinDown[1] * 0.4);
      c.stroke();
    }
    c.restore();
  }

  // ================= ÁNH SÁNG KHE CỬA, TAY NẮM & NHÃN "RA NGOÀI" =================
  function drawSauDoorInvite(c, now) {
    if (!sauDoorGeo) return;
    const d = sauDoorGeo;
    const t = now * 0.001;
    const breath = 0.92 + 0.08 * Math.sin(t * 1.15);

    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';

    // 1a. Vệt sáng ấm từ đèn hành lang lọt khe chân cửa + khe đứng rất mảnh dọc mép cửa
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = breath;
    poly(c, d.spillPts, d.spillGrad);

    if (warmSp) {
      c.globalAlpha = 0.085 * breath;
      c.drawImage(warmSp, d.bR[0] - 48, d.bR[1] - 34, 96, 68);
    }

    // Khe sáng dưới chân cửa (hơi ấm loe nhẹ + lõi mảnh rõ nét)
    c.globalAlpha = 1;
    c.strokeStyle = `rgba(248,194,122,${(0.20 * breath).toFixed(3)})`;
    c.lineWidth = 4.6;
    c.beginPath();
    c.moveTo(d.bL[0], d.bL[1]);
    c.lineTo(d.bR[0], d.bR[1]);
    c.stroke();

    c.strokeStyle = `rgba(255,232,188,${(0.68 * breath).toFixed(3)})`;
    c.lineWidth = 1.65;
    c.beginPath();
    c.moveTo(d.bL[0], d.bL[1]);
    c.lineTo(d.bR[0], d.bR[1]);
    c.stroke();

    // Khe sáng rất mảnh dọc mép đứng phía tay nắm & thoáng qua mép trên góc phải
    c.strokeStyle = `rgba(246,192,122,${(0.14 * breath).toFixed(3)})`;
    c.lineWidth = 3.8;
    c.beginPath();
    c.moveTo(d.bR[0], d.bR[1]);
    c.lineTo(d.tR[0], d.tR[1]);
    c.stroke();

    c.strokeStyle = `rgba(255,228,180,${(0.58 * breath).toFixed(3)})`;
    c.lineWidth = 1.15;
    c.beginPath();
    c.moveTo(d.bR[0], d.bR[1]);
    c.lineTo(d.tR[0], d.tR[1]);
    c.stroke();

    c.strokeStyle = `rgba(255,220,168,${(0.20 * breath).toFixed(3)})`;
    c.lineWidth = 0.95;
    c.beginPath();
    c.moveTo(d.tR[0], d.tR[1]);
    c.lineTo(lerp(d.tR[0], d.tL[0], 0.36), lerp(d.tR[1], d.tL[1], 0.36));
    c.stroke();

    // Quay về source-over để vẽ khung cửa & tay nắm kim loại bắt sáng
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;

    // Nét khuôn cửa nổi rõ nhẹ nhờ ánh sáng hành lang hắt chéo cạnh trong
    poly(c, [d.bR, d.frBot, d.frTop, d.tR], 'rgba(58,52,48,.48)');
    c.strokeStyle = 'rgba(235,204,158,.24)';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(d.bR[0] + 1.2, d.bR[1] - 1);
    c.lineTo(d.tR[0] + 1.2, d.tR[1] + 1);
    c.stroke();
    c.strokeStyle = 'rgba(130,136,146,.22)';
    c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(d.frBot[0], d.frBot[1]);
    c.lineTo(d.frTop[0], d.frTop[1]);
    c.stroke();

    // 1b. Tay nắm cửa kim loại có bóng đổ, đế khoá, lỗ chìa & ánh sáng bắt trên gạt tay
    c.strokeStyle = 'rgba(0,0,0,.52)';
    c.lineWidth = 5.4;
    c.beginPath();
    c.moveTo(d.hBase[0] - 2, d.hBase[1] + 3);
    c.lineTo(d.hNeck[0] - 2, d.hNeck[1] + 3);
    c.lineTo(d.hEnd[0] - 2, d.hEnd[1] + 3);
    c.lineTo(d.hTip[0] - 2, d.hTip[1] + 3);
    c.stroke();

    poly(c, d.plate, '#343942');
    c.strokeStyle = 'rgba(225,208,182,.42)';
    c.lineWidth = 1.05;
    c.beginPath();
    c.moveTo(d.plate[0][0], d.plate[0][1]);
    c.lineTo(d.plate[3][0], d.plate[3][1]);
    c.lineTo(d.plate[2][0], d.plate[2][1]);
    c.stroke();

    // Ổ khoá dưới tay nắm
    c.fillStyle = '#0e1014';
    c.beginPath();
    c.arc(d.kh[0], d.kh[1] - 2.2, 1.5, 0, Math.PI * 2);
    c.fill();
    c.fillRect(d.kh[0] - 0.9, d.kh[1] - 1.4, 1.8, 4.4);

    // Khớp tròn & cần gạt kim loại + viền bắt sáng ấm
    c.fillStyle = '#525965';
    c.beginPath();
    c.arc(d.hBase[0], d.hBase[1], 4.8, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(244,232,208,.48)';
    c.lineWidth = 1.0;
    c.beginPath();
    c.arc(d.hBase[0], d.hBase[1], 4.5, -Math.PI * 0.45, Math.PI * 0.45);
    c.stroke();

    c.strokeStyle = '#6c7584';
    c.lineWidth = 4.6;
    c.beginPath();
    c.moveTo(d.hBase[0], d.hBase[1]);
    c.lineTo(d.hNeck[0], d.hNeck[1]);
    c.lineTo(d.hEnd[0], d.hEnd[1]);
    c.lineTo(d.hTip[0], d.hTip[1]);
    c.stroke();

    c.strokeStyle = 'rgba(244,234,218,.82)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(d.hNeck[0], d.hNeck[1] - 1.2);
    c.lineTo(d.hEnd[0], d.hEnd[1] - 1.2);
    c.lineTo(d.hTip[0], d.hTip[1] - 0.9);
    c.stroke();

    c.fillStyle = 'rgba(255,226,176,.85)';
    c.beginPath();
    c.arc(d.hNeck[0] - 0.6, d.hNeck[1] - 1.0, 1.4, 0, Math.PI * 2);
    c.fill();

    // 1c. Nhãn viết tay "ra ngoài" (chỉ hiện sau khi đã có La4 hoặc Si4)
    if (!window.KET2_PHIM_DANG && (ket2HasPicked('La4') || ket2HasPicked('Si4'))) {
      const pulse = 0.56 + 0.1 * Math.sin(now * 0.0022);
      text(c, 'ra ngoài', 180, 562, 17, pulse * 0.78);
      c.strokeStyle = `rgba(236,230,218,${pulse.toFixed(3)})`;
      c.lineWidth = 2.8;
      c.beginPath();
      c.moveTo(196, 584);
      c.bezierCurveTo(182, 591, 166, 588, 154, 578);
      c.stroke();
      c.beginPath();
      c.moveTo(163, 574);
      c.lineTo(154, 578);
      c.lineTo(159, 587);
      c.stroke();
    }

    c.restore();
  }

  // ================= MŨI TÊN VẼ TAY CHUYỂN HƯỚNG (MÉP DƯỚI) =================
  function drawTurnArrow(c, toBack, now) {
    if (window.KET2_PHIM_DANG) return;
    const cx = 800, cy = 742;
    const pulse = 0.56 + 0.1 * Math.sin(now * 0.0022);
    c.save();
    c.strokeStyle = `rgba(236,230,218,${pulse.toFixed(3)})`;
    c.lineWidth = 3.2;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    if (toBack) {
      // Mũi tên cong xuống quay lại phía sau (cùng nét vẽ tay mảnh như drawBack)
      c.beginPath();
      c.moveTo(cx - 24, cy - 10);
      c.bezierCurveTo(cx - 10, cy - 22, cx + 16, cy - 14, cx + 8, cy + 12);
      c.stroke();
      c.beginPath();
      c.moveTo(cx + 1, cy + 5);
      c.lineTo(cx + 8, cy + 14);
      c.lineTo(cx + 17, cy + 7);
      c.stroke();
      text(c, 'quay lại phía sau', cx, cy + 38, 17, pulse * 0.72);
    } else {
      // Mũi tên mảnh hướng lên/quay lại góc bàn
      c.beginPath();
      c.moveTo(cx + 22, cy + 8);
      c.bezierCurveTo(cx + 10, cy + 20, cx - 16, cy + 14, cx - 8, cy - 12);
      c.stroke();
      c.beginPath();
      c.moveTo(cx - 17, cy - 5);
      c.lineTo(cx - 8, cy - 14);
      c.lineTo(cx + 1, cy - 6);
      c.stroke();
      text(c, 'nhìn về bàn', cx, cy + 38, 17, pulse * 0.72);
    }
    c.restore();
  }

  // ================= ÂM THANH NỀN & HIỆU ỨNG CỬA / KHỚP / CÚC / KẸP =================
  let p502G = null, ambNodes = [], rainTimer = null, bubbleTimer = null;

  function inP502AudioScene() {
    return V.cur === 'p502' || V.cur === 'p502sau' || V.cur === 'tuiao' || V.cur === 'gac';
  }

  // Tiếng khớp kim loại "cạch" khi xoay chao đèn bàn
  function playLampClick() {
    if (!ac || !master || ac.state !== 'running') return;
    const t = ac.currentTime;
    nz(t, 0.018, 'bandpass', 2100, 3.2, 0.18, -0.15, 1450, master);
    tone(t, 920, 620, 0.065, 0.032, 'triangle', master);
    tone(t + 0.012, 240, 115, 0.045, 0.042, 'sine', master);
  }

  // Tiếng cánh tủ mở rộng hơn (gỗ khẽ + lụa sột soạt)
  function playWardrobeOpen() {
    if (!ac || !master || ac.state !== 'running') return;
    const t = ac.currentTime;
    nz(t, 0.18, 'bandpass', 420, 1.4, 0.065, -0.35, 310, master);
    tone(t + 0.02, 138, 172, 0.024, 0.14, 'sine', master);
    if (typeof FX !== 'undefined' && FX.cloth) FX.cloth();
  }

  // Tiếng cúc bấm kim loại bật "tách"
  function playSnapOpen() {
    if (!ac || !master || ac.state !== 'running') return;
    const t = ac.currentTime;
    nz(t, 0.014, 'highpass', 3200, 1.1, 0.20, 0, 2400, master);
    nz(t + 0.002, 0.020, 'bandpass', 2350, 4.2, 0.16, 0, 1600, master);
    tone(t, 1520, 920, 0.052, 0.026, 'triangle', master);
  }

  // Tiếng cánh tủ rung nhẹ vướng chốt khi còn bị khoá
  function playWardrobeLocked() {
    if (!ac || !master || ac.state !== 'running') return;
    const t = ac.currentTime;
    nz(t, 0.045, 'lowpass', 360, 1.2, 0.09, -0.25, 220, master);
    tone(t, 125, 68, 0.085, 0.08, 'triangle', master);
    tone(t + 0.018, 1680, 1420, 0.018, 0.045, 'sine', master);
  }

  // Tiếng bút lách cách khẽ trong cốc khi nhặt chìa tủ
  function playPenCupPick() {
    if (!ac || !master || ac.state !== 'running') return;
    const t = ac.currentTime;
    nz(t, 0.016, 'bandpass', 2450, 3.6, 0.11, 0.12, 1750, master);
    nz(t + 0.036, 0.014, 'bandpass', 2950, 4.0, 0.08, 0.12, 2100, master);
    tone(t + 0.022, 3620, 3490, 0.026, 0.085, 'sine', master);
    tone(t + 0.056, 4580, 4460, 0.018, 0.08, 'sine', master);
  }

  // Tiếng tra chìa và xoay "cạch" nhỏ mở ổ khoá tủ
  function playWardrobeUnlockKey() {
    if (!ac || !master || ac.state !== 'running') return;
    const t = ac.currentTime;
    nz(t, 0.028, 'bandpass', 2800, 2.4, 0.085, -0.3, 1900, master);
    tone(t + 0.008, 2240, 1780, 0.018, 0.032, 'sine', master);
    nz(t + 0.095, 0.020, 'highpass', 2500, 1.4, 0.14, -0.3, 1850, master);
    tone(t + 0.098, 1560, 920, 0.048, 0.045, 'triangle', master);
    tone(t + 0.122, 2480, 2290, 0.016, 0.075, 'sine', master);
  }

  // Tiếng chùm chìa khoá khẽ leng keng khi nhặt
  function playKeyPick() {
    if (!ac || !master || ac.state !== 'running') return;
    const t = ac.currentTime;
    tone(t, 3380, 3290, 0.032, 0.095, 'sine', master);
    tone(t + 0.028, 4420, 4310, 0.026, 0.11, 'sine', master);
    nz(t, 0.025, 'highpass', 3800, 0.9, 0.08, -0.45, 0, master);
  }

  // Tiếng bước thang gác nhẹ
  function playStepUp() {
    if (!ac || !master || ac.state !== 'running') return;
    const t = ac.currentTime;
    nz(t, 0.042, 'bandpass', 380, 1.6, 0.08, 0, 290, master);
    nz(t + 0.14, 0.042, 'bandpass', 450, 1.6, 0.07, 0, 340, master);
  }

  // Tiếng nhựa đàn hồi "tách" khi bóp mở kẹp càng cua
  function playClipOpen() {
    if (!ac || !master || ac.state !== 'running') return;
    const t = ac.currentTime;
    nz(t, 0.016, 'bandpass', 1980, 3.8, 0.17, 0.15, 1380, master);
    tone(t, 1680, 1140, 0.058, 0.034, 'triangle', master);
    tone(t + 0.018, 2850, 2420, 0.020, 0.045, 'sine', master);
  }

  function scheduleRainDrop() {
    if (!ac || !p502G || !inP502AudioScene()) { rainTimer = null; return; }
    if (!document.hidden && ac.state === 'running') {
      const t = ac.currentTime;
      const pan = Math.random() * 0.85 - 0.42;
      const f = 1850 + Math.random() * 1900;
      const gDrop = 0.003 + Math.random() * 0.0055;
      nz(t, 0.022 + Math.random() * 0.015, 'bandpass', f, 3.6, gDrop, pan, f * 0.85, p502G);
      if (Math.random() < 0.38) {
        tone(t, 440 + Math.random() * 190, 390 + Math.random() * 160, 0.0006, 0.028, 'sine', p502G);
      }
    }
    rainTimer = setTimeout(scheduleRainDrop, 170 + Math.random() * 380);
  }

  function scheduleBubble() {
    if (!ac || !p502G || !inP502AudioScene()) { bubbleTimer = null; return; }
    if (!document.hidden && ac.state === 'running') {
      const t = ac.currentTime;
      const f0 = 370 + Math.random() * 170;
      const dur = 0.042 + Math.random() * 0.026;
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * 1.85, t + dur);
      const eg = ac.createGain();
      eg.gain.setValueAtTime(0.0001, t);
      eg.gain.linearRampToValueAtTime(0.0042 + Math.random() * 0.0028, t + 0.007);
      eg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      if (typeof ac.createStereoPanner === 'function') {
        const pn = ac.createStereoPanner();
        pn.pan.value = V.cur === 'p502sau' ? -0.35 : 0.48;
        o.connect(eg).connect(pn).connect(p502G);
      } else {
        o.connect(eg).connect(p502G);
      }
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    bubbleTimer = setTimeout(scheduleBubble, 420 + Math.random() * 880);
  }

  function startAudio(level = 1.0) {
    if (!ac || !master) return;
    if (!p502G) {
      p502G = ac.createGain();
      p502G.gain.value = 0.0001;
      p502G.connect(master);
      AMB.push(p502G);

      const rainBed = loopNoise(0.015, 'bandpass', 920, 0.65, 1);
      rainBed.gain.connect(p502G);
      const rainTin = loopNoise(0.0045, 'bandpass', 3250, 1.5, 1.05);
      rainTin.gain.connect(p502G);

      const fanAir = loopNoise(0.005, 'bandpass', 310, 2.8, 1);
      fanAir.gain.connect(p502G);
      const fanTone = ac.createOscillator();
      fanTone.type = 'sine';
      fanTone.frequency.value = 138;
      const fanToneG = ac.createGain();
      fanToneG.gain.value = 0.0011;
      fanTone.connect(fanToneG).connect(p502G);
      fanTone.start();

      const tankHiss = loopNoise(0.0032, 'bandpass', 640, 1.7, 1);
      if (typeof ac.createStereoPanner === 'function') {
        const tPan = ac.createStereoPanner();
        tPan.pan.value = 0.48;
        tankHiss.gain.connect(tPan).connect(p502G);
      } else {
        tankHiss.gain.connect(p502G);
      }

      ambNodes = [rainBed, rainTin, fanAir, fanTone, tankHiss];
    }
    ramp(p502G.gain, level, 1.2);
    if (!rainTimer) scheduleRainDrop();
    if (!bubbleTimer) scheduleBubble();
  }

  // ================= ĐĂNG KÝ CẢNH & LỐI MỞ ?phong=12 =================
  SC.p502 = {
    tapBelow: true,
    hintY: 118,
    bake: bakeFront,
    enter() {
      restoreKet2();
      if (typeof POCKET !== 'undefined') POCKET.may = POCKET.on = true;
      sauStep3BoostAt = 0;
      clearSay();
      updateHints(lastHintGroup !== '502');
      startAudio(1.0);
    },
    draw(c, now, dt) {
      if (anhC.width !== cv.width || anhC.height !== cv.height || !ANH.pool || window.ANH_KHONG_CHAO !== !!ket2.denLen) bakeFront();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(anhC, 0, 0);
      setT(c);


      // Dùng lại drawAnhDyn đúng cảnh SC.anh1, tắt rung điện thoại; khi denLen = true bỏ nón sáng chiếu thẳng xuống bàn
      const m0 = ANH.mode, b0 = ANH.buzz, ca0 = ANH.callAt, tp0 = ANH.tap, sh0 = ANH.shade;
      ANH.mode = 1;
      ANH.buzz = NO_BUZZ;
      ANH.callAt = 0;
      ANH.tap = -9999;
      if (ket2.denLen) ANH.shade = null;
      try {
        drawAnhDyn(c, now, dt);
      } finally {
        ANH.mode = m0;
        ANH.buzz = b0;
        ANH.callAt = ca0;
        ANH.tap = tp0;
        ANH.shade = sh0;
      }

      drawLaptopTime0307(c);
      if (ket2.denLen) drawDeskLampUp(c, now);
      if (!ket2.chiatu && !ket2.tuMo) drawDeskPenCupCord(c);
      drawMissingSlots(c, now);
      drawTurnArrow(c, true, now);
    },
    tap(p) {
      if (inR(p, NAV_R)) {
        if (typeof FX !== 'undefined' && FX.cloth) FX.cloth();
        go('p502sau', 700);
        return;
      }
      if (inR(p, LAMP_R)) {
        ket2.denLen = !ket2.denLen;
        saveKet2();
        clearSay();
        playLampClick();
        return;
      }
      if (inR(p, CAL_R)) {
        if (typeof FX !== 'undefined' && FX.tap) FX.tap();
        showSay('Có một sợi dây buộc tóc vắt ở gáy lịch. Tháng 11, hai ô 28 và 29 khoanh chung một vòng đỏ.');
        return;
      }
      if (inR(p, CACTUS_R)) {
        if (typeof FX !== 'undefined' && FX.tap) FX.tap();
        showSay('Cây xương rồng tô tượng. Tối hôm đầu tiên gặp nhau, hai đứa ngồi tô nó gần hồ Xương Rồng. Anh mang về, giữ tới giờ.');
        return;
      }
      if (!PEN_CUP_R) rebuildFrontGeo();
      if (inR(p, PEN_CUP_R)) {
        if (!ket2.chiatu && !ket2.tuMo) {
          ket2.chiatu = true;
          saveKet2();
          if (typeof bagHas === 'function' && !bagHas('chiatu') && typeof bagAdd === 'function') {
            bagAdd('chiatu', 'chìa khoá tủ', drawChiaTuBag);
          }
          playPenCupPick();
          if (typeof FX !== 'undefined' && FX.pick) FX.pick();
          showSay('Một chiếc chìa nhỏ buộc sợi dây đỏ, lẫn trong cốc bút.');
          return;
        }
        if (typeof FX !== 'undefined' && FX.tap) FX.tap();
        return;
      }
      if (inR(p, KB_RECT) || hitPoly(p, KB_HIT)) {
        if (typeof SC !== 'undefined' && SC.dan) SC.dan.back = 'p502';
        lastHintGroup = 'dan';
        if (p502G && ac) ramp(p502G.gain, 0, 0.5);
        if (typeof FX !== 'undefined' && FX.tap) FX.tap();
        go('dan', 600);
      }
    },
  };

  SC.p502sau = {
    tapBelow: true,
    hintY: 118,
    bake: bakeSau,
    enter() {
      restoreKet2();
      wardShakeAt = 0;
      if (typeof POCKET !== 'undefined') POCKET.may = POCKET.on = true;
      doorAnim = ket2.tuMo ? 1 : 0;
      sauStep3BoostAt = 0;
      clearSay();
      updateHints(lastHintGroup !== '502');
      if (pendingLa4ReturnSay && !la4BackSaid) {
        la4BackSaid = true;
        pendingLa4ReturnSay = false;
        showSay('Còn hai mảnh nữa. Hình như không ở trong phòng này.');
        if (getHintStep() === 3 && typeof HINT !== 'undefined' && HINT.tier === 0) {
          sauStep3BoostAt = performance.now() + 11500;
        }
      } else if (getHintStep() === 3 && typeof HINT !== 'undefined' && HINT.tier === 0) {
        sauStep3BoostAt = performance.now() + 800;
      }
      startAudio(1.0);
    },
    draw(c, now, dt) {
      if (!sauC.width || sauC.width !== cv.width || sauC.height !== cv.height) bakeSau();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(sauC, 0, 0);
      setT(c);

      drawSauWindowRain(c, now);
      drawSauWardrobeDynamic(c, dt, now);

      if (!ket2.denLen && sauLoftDarkC.width) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.drawImage(sauLoftDarkC, 0, 0);
        setT(c);
        drawSauClipAndLoftLight(c, now, false);
      } else {
        drawSauClipAndLoftLight(c, now, true);
      }

      if (sauVignC.width) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.drawImage(sauVignC, 0, 0);
        setT(c);
      }

      // Nhịp thở rất khẽ của đèn bàn sau lưng trên sàn (yếu đi khi đèn quay lên gác)
      const t = now * 0.001;
      if (warmSp) {
        const ba = c.globalAlpha;
        c.save();
        c.globalCompositeOperation = 'lighter';
        const baseGlow = ket2.denLen ? 0.032 : 0.072;
        c.globalAlpha = ba * (baseGlow + 0.015 * Math.sin(t * 1.4));
        c.drawImage(warmSp, sauLampFloorPt[0] - 260, sauLampFloorPt[1] - 120, 520, 220);
        c.restore();
      }

      drawSauWardrobeLock(c, now);
      drawSauWallKey(c); // vẽ sau lớp tối viền để chùm chìa không chìm mất

      if (V.cur === 'p502sau' && sauStep3BoostAt && now >= sauStep3BoostAt) {
        sauStep3BoostAt = 0;
        if (getHintStep() === 3 && typeof HINT !== 'undefined' && !HINT.off && HINT.tier === 0 && (!HINT.text || now - HINT.show >= 10600)) {
          HINT.at = now / 1000 - (typeof FAST !== 'undefined' && FAST ? 12.2 : 90.2);
        }
      }

      drawSauDoorInvite(c, now);
      drawTurnArrow(c, false, now);
    },
    tap(p) {
      if (inR(p, NAV_R)) {
        if (typeof FX !== 'undefined' && FX.cloth) FX.cloth();
        go('p502', 700);
        return;
      }
      const keyR = { x: sauHookPt[0] - 58, y: sauHookPt[1] - 46, w: 120, h: 136 };
      if (!ket2.chia) {
        if (inR(p, keyR)) {
          ket2.chia = true;
          saveKet2();
          if (typeof bagHas === 'function' && !bagHas('chia') && typeof bagAdd === 'function') {
            bagAdd('chia', 'chìa khoá xe', drawChiaBag);
          }
          playKeyPick();
          if (typeof FX !== 'undefined' && FX.pick) FX.pick();
          return;
        }
      }
      const doorR = { x: 0, y: 205, w: 166, h: 590 };
      const outVisible = ket2HasPicked('La4') || ket2HasPicked('Si4');
      if ((inR(p, doorR) && (ket2.chia || !inR(p, keyR))) || (outVisible && inR(p, OUT_LABEL_R))) {
        lastHintGroup = 'ngoai';
        if (p502G && ac) ramp(p502G.gain, 0, 0.6);
        if (typeof FX !== 'undefined' && FX.latch) FX.latch();
        go('hanhlang', 700);
        return;
      }
      const lockR = { x: sauLockPt[0] - 60, y: sauLockPt[1] - 60, w: 120, h: 120 };
      const wardLockedR = { x: 252, y: 300, w: 262, h: 375 };
      const wardOpenR = { x: 245, y: 315, w: 265, h: 355 };
      if (!ket2.tuMo) {
        if (inR(p, lockR) || inR(p, wardLockedR)) {
          if (typeof BAG !== 'undefined' && BAG.sel === 'chiatu') {
            ket2.tuMo = true;
            if (Array.isArray(BAG.items)) {
              BAG.items = BAG.items.filter(it => it.id !== 'chiatu');
            }
            BAG.sel = null;
            saveKet2();
            clearSay();
            updateHints(false);
            playWardrobeUnlockKey();
            setTimeout(() => { if (V.cur === 'p502sau') playWardrobeOpen(); }, 160);
            return;
          }
          wardShakeAt = performance.now();
          playWardrobeLocked();
          showSay('Tủ khoá rồi. Ổ khoá nhỏ xíu.');
          return;
        }
      } else if (inR(p, wardOpenR)) {
        if (typeof FX !== 'undefined' && FX.cloth) FX.cloth();
        go('tuiao', 600);
        return;
      }
      const clipR = { x: sauClipPt[0] - 85, y: sauClipPt[1] - 75, w: 170, h: 150 };
      const ladderR = { x: 515, y: 245, w: 135, h: 495 };
      if (inR(p, clipR) || inR(p, ladderR)) {
        if (!ket2.denLen) {
          if (typeof FX !== 'undefined' && FX.tap) FX.tap();
          showSay('Trên gác tối om, không thấy gì.');
        } else {
          playStepUp();
          go('gac', 700);
        }
      }
    },
  };

  SC.tuiao = {
    back: 'p502sau',
    tapBelow: true,
    hintY: 118,
    bake: bakeTuiaoBg,
    enter() {
      restoreKet2();
      if (typeof POCKET !== 'undefined') POCKET.may = POCKET.on = true;
      flapAnim = (ket2.cuc[0] && ket2.cuc[1]) ? 1 : 0;
      clearSay();
      startAudio(0.75);
    },
    draw(c, now, dt) {
      if (!tuiaoBgC.width || tuiaoBgC.width !== cv.width || tuiaoBgC.height !== cv.height) bakeTuiaoBg();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(tuiaoBgC, 0, 0);
      setT(c);
      drawTuiaoDynamic(c, now, dt);
    },
    tap(p) {
      // Cúc bấm 0 & 1 trên nắp túi
      for (let i = 0; i < 2; i++) {
        if (!ket2.cuc[i]) {
          const s = TUIAO_SNAPS[i];
          if (Math.hypot(p[0] - s.x, p[1] - s.y) <= 84) {
            ket2.cuc[i] = true;
            saveKet2();
            playSnapOpen();
            if (ket2.cuc[0] && ket2.cuc[1] && typeof FX !== 'undefined' && FX.cloth) {
              setTimeout(() => { if (V.cur === 'tuiao') FX.cloth(); }, 120);
            }
            return;
          }
        }
      }
      // Mảnh nhựa màu tím khi cả hai cúc đã mở
      if (ket2.cuc[0] && ket2.cuc[1] && !ket2HasPicked('Si4') && inR(p, TUIAO_PIECE_R)) {
        addManh('Si4');
        updateHints(false);
        if (typeof FX !== 'undefined' && FX.pick) FX.pick();
        showSay('Một mảnh nhựa màu tím, nằm trong túi áo em để quên.');
      }
    },
  };

  SC.gac = {
    back: 'p502sau',
    tapBelow: true,
    hintY: 118,
    bake: bakeGacBg,
    enter() {
      restoreKet2();
      if (typeof POCKET !== 'undefined') POCKET.may = POCKET.on = true;
      clearSay();
      const picked = ket2HasPicked('La4');
      gacClipAnim = 0;
      gacDropAnim = picked ? 1 : 0;
      gacOpening = false;
      gacOpenT = 0;
      startAudio(0.9);
    },
    draw(c, now, dt) {
      if (!gacBgC.width || gacBgC.width !== cv.width || gacBgC.height !== cv.height) bakeGacBg();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(gacBgC, 0, 0);
      setT(c);
      drawGacClipAndPiece(c, now, dt);
    },
    tap(p) {
      if (!ket2HasPicked('La4') && !gacOpening && inR(p, GAC_CLIP_R)) {
        gacOpening = true;
        gacOpenT = 0;
        gacDropAnim = 0;
        if (!la4BackSaid) pendingLa4ReturnSay = true;
        addManh('La4');
        updateHints(false);
        playClipOpen();
        if (typeof FX !== 'undefined' && FX.pick) FX.pick();
        showSay('Chiếc kẹp tóc của em vẫn còn kẹp ở đây. Nó giữ một mảnh nhựa màu đỏ cam.');
      }
    },
  };

  // Mở thẳng Phòng 502 bằng ?phong=12
  if (Q12.get('phong') === '12') {
    const st0 = START;
    START = () => {
      st0();
      INTRO.t = 9;
      setTimeout(() => {
        if (typeof P1 !== 'undefined') Object.assign(P1, { torch: true, calm: true, calmT: 99, done: true });
        if (typeof quietPast === 'function') quietPast(0.2);
        POCKET.may = true;
        POCKET.on = true;
        POCKET.msg = null;
        restoreKet2();
        go('p502', 400);
      }, 300);
    };
  }
  // Cửa cho ngoai.js (sân xe, sân thượng) và dan.js dùng chung trạng thái Kết 2
  // từ sân đình (san.js) đi thẳng vào phòng 502 trong cùng một lượt chơi, không tải lại trang
  function vaoTuSan() { POCKET.may = true; POCKET.on = true; POCKET.msg = null; if (typeof quietPast === 'function') quietPast(0.2); restoreKet2(); go('p502', 900); }
  window.KET2 = { st: ket2, save: saveKet2, addManh, has: ket2HasPicked, meta: MANH_META, drawPiece: drawPieceShape, say: showSay, clearSay, hints: updateHints, vao: vaoTuSan };
})();
