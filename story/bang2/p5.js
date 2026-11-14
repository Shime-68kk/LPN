// ================= ĐÌNH LÀNG (đúng nét Băng 1) · qua bức tường =================
// Tiếng dế, gió lá tre vào trước hình. Chiếc radio Băng 1 trong sân vẫn khẽ phát bài của Băng 1 ở 85.0.
// Sân trong: bàn đá (đưa hai ghế về chỗ cũ, xoay mặt đá cho khớp vết nứt) → mảnh bản đồ 3.
//            radio (lật ra sau, tháo 4 ốc theo 8 · 5 · . · 0) → bài hát nhoè thành rè rồi tắt → mảnh bản đồ 2.
// Lối đi: không qua đình mà men BÊN PHẢI tường đình; soi đèn chân tường mới thấy khe.
// Mảnh bản đồ: 0 hộp sắt cầu thang, 1 khe bức tường (phía em) · 2 radio, 3 bàn đá (phía anh). Mặt sau mỗi mảnh một chữ.
const P5 = { manh: {}, seen: {}, cong: false, oc: [0, 0, 0, 0], ocOut: [], ocBad: 0, radioOpen: 0, radioLat: 0, radioFace: 0, banGhe: null, banStage: 0, banRot: -2.2, banOpen: 0, loi: false, hintKey: '', on: false };
const MANH_CHU = ['Đ', 'Y', 'Ở', 'Â']; // xáo: thứ tự đúng chỉ có khi nhớ câu trong băng 11/11
const SONG1 = '../../assets/sound/bang1.mp3';
function manhCount() { return Object.keys(P5.manh).length; }
function manhAdd(i) {
  if (P5.manh[i]) return; P5.manh[i] = true; FX.paper();
  if (!bagHas('bando')) bagAdd('bando', 'mảnh bản đồ', drawManhIcon); else POCKET.flash = performance.now();
  nudge();
}
// một mảnh giấy (dùng BD.piece của bản đồ nếu đã có, không thì vẽ mảnh giấy gấp tạm)
function drawManh(c, i, x, y, s, back = false) {
  c.save(); c.translate(x, y);
  if (back) { // mặt sau: giấy kem, một chữ viết tay mực đỏ
    c.rotate(-0.04 + i * 0.03); c.fillStyle = '#e9e1cf'; c.beginPath(); manhPath(c, i, s); c.fill();
    c.strokeStyle = 'rgba(90,70,40,.35)'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = 'rgba(176,36,30,.88)'; c.font = `${Math.round(120 * s)}px ${HAND}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(MANH_CHU[i], 0, 6 * s); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  } else if (typeof BD !== 'undefined' && BD.piece) BD.piece(c, i, 0, 0, s * 0.9, -0.04 + i * 0.03);
  else {
    c.rotate(-0.04 + i * 0.03); c.fillStyle = '#e4dbc6'; c.beginPath(); manhPath(c, i, s); c.fill(); c.strokeStyle = 'rgba(90,70,40,.35)'; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = 'rgba(40,52,90,.75)'; c.setLineDash([6 * s, 7 * s]); c.lineWidth = 2.5 * s; c.beginPath(); c.moveTo(-70 * s, -30 * s + i * 8 * s); c.bezierCurveTo(-20 * s, 20 * s, 30 * s, -40 * s, 70 * s, 25 * s - i * 6 * s); c.stroke(); c.setLineDash([]);
  }
  c.restore();
}
function manhPath(c, i, s) { // mép răng cưa riêng từng mảnh
  const R = [[-95, -70], [95, -70], [95, 70], [-95, 70]], seed = [3, 7, 11, 5][i];
  for (let k = 0; k < 4; k++) { const [x0, y0] = R[k], [x1, y1] = R[(k + 1) % 4]; for (let j = 0; j < 6; j++) { const f = j / 6, jx = Math.sin((k * 6 + j) * seed) * 7, jy = Math.cos((k * 6 + j) * seed * 1.3) * 7; const x = (x0 + (x1 - x0) * f + jx) * s, y = (y0 + (y1 - y0) * f + jy) * s; if (!k && !j) c.moveTo(x, y); else c.lineTo(x, y); } }
  c.closePath();
}
function drawManhIcon(c, s) { const n = manhCount(); for (let k = 0; k < Math.max(1, n); k++) { c.save(); c.translate(-12 + k * 8, -6 + k * 5); c.rotate(-0.15 + k * 0.12); c.fillStyle = k === n - 1 ? '#e9e1cf' : '#cfc6b2'; c.beginPath(); manhPath(c, k % 4, 0.42 * s); c.fill(); c.strokeStyle = 'rgba(40,52,90,.5)'; c.lineWidth = 1; c.stroke(); c.restore(); } }

// ---------- xem các mảnh (mở từ túi): chạm để lật ----------
BAG_VIEW.bando = 'manh';
const MV = { flip: [0, 0, 0, 0], want: [0, 0, 0, 0], pos: [[560, 285], [1040, 285], [560, 560], [1040, 560]] }; // lưới 2×2, không mảnh nào đè mảnh nào
SC.manh = {
  back: 'tui',
  enter() { FX.paper(); },
  draw(c, now, dt) {
    c.fillStyle = '#0a0806'; c.fillRect(-300, -300, W + 600, H + 600); warmSpot(c, 800, 440, 760, 0.12);
    for (let i = 0; i < 4; i++) {
      MV.flip[i] += (MV.want[i] - MV.flip[i]) * Math.min(1, dt * 7);
      const [x, y] = MV.pos[i];
      if (!P5.manh[i]) { c.strokeStyle = 'rgba(236,220,190,.1)'; c.setLineDash([8, 8]); c.lineWidth = 2; c.save(); c.translate(x, y); c.beginPath(); manhPath(c, i, 0.9); c.stroke(); c.restore(); c.setLineDash([]); continue; }
      const k = MV.flip[i], sx = Math.cos(k * Math.PI); c.save(); c.translate(x, y); c.scale(Math.max(0.02, Math.abs(sx)), 1); drawManh(c, i, 0, 0, sx < 0 ? 1 : 0.62, sx < 0); c.restore();
    }
    text(c, manhCount() ? 'chạm một mảnh để lật' : 'chưa có mảnh nào', W / 2, 760, 22, 0.4);
  },
  tap(p) { for (let i = 0; i < 4; i++) { if (!P5.manh[i]) continue; const [x, y] = MV.pos[i]; if (Math.abs(p[0] - x) < 220 && Math.abs(p[1] - y) < 130) { MV.want[i] = MV.want[i] ? 0 : 1; FX.paper(); if (MV.want[i]) P5.seen[i] = true; return; } } },
};

// ---------- sang tới đình: tắt sạch tiếng của những nơi trước (mưa phòng ngủ, hơi thở, gió hành lang, gió cầu thang) ----------
function quietPast(sec = 3) {
  const L = [typeof rainG !== 'undefined' && rainG, typeof sleepG !== 'undefined' && sleepG, typeof hallG !== 'undefined' && hallG, typeof stairG !== 'undefined' && stairG];
  for (const g of L) { if (!g) continue; ramp(g.gain, 0, sec); g._dv = null; const i = AMB.indexOf(g); if (i >= 0) AMB.splice(i, 1); }
  if (typeof musicOff === 'function') musicOff(sec);
}
// ---------- âm thanh sân đình: dế, gió lá tre (sự kiện rời), bài Băng 1 từ radio ----------
let D5 = null; // { song:{src,hp,lp,g}, timers }
function dinhSound(where) {
  if (!D5) {
    quietPast(2.5); D5 = { g: ac.createGain(), alive: true };
    D5.g.gain.value = 0; D5.g.connect(master); AMB.push(D5.g); ramp(D5.g.gain, 1, 3);
    const cricket = () => { if (!D5 || !D5.alive) return; const t = ac.currentTime, n = 3 + Math.floor(Math.random() * 3), f = 4200 + Math.random() * 600, pan = Math.random() * 1.6 - 0.8, far = where === 'benphai' ? 0.4 : 1;
      for (let i = 0; i < n; i++) nz(t + i * 0.055, 0.03, 'bandpass', f, 18, 0.028 * far, pan, 0, D5.g);
      setTimeout(cricket, 1400 + Math.random() * 3800); };
    const gust = () => { if (!D5 || !D5.alive) return; const t = ac.currentTime, d = 2 + Math.random() * 2.5; nz(t, d, 'bandpass', 2400 + Math.random() * 1500, 0.6, 0.05, Math.random() - 0.5, 0, D5.g); setTimeout(gust, 7000 + Math.random() * 9000); };
    setTimeout(cricket, 300); // không có lớp gió liên tục: chỉ còn dế lác đác và bài hát từ radio
    buf(SONG1).then((b) => { if (!D5 || !D5.alive || P5.radioOpen >= 1) return; const s = ac.createBufferSource(); s.buffer = b; s.loop = true; const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 260; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; const g = ac.createGain(); g.gain.value = 0; s.connect(hp).connect(lp).connect(g).connect(D5.g); s.start(); D5.song = { s, hp, lp, g }; songAt(D5.where || 'dinhngoai'); });
  }
  D5.where = where; songAt(where);
}
function songAt(where) { // bài hát nghe như vọng ra từ chiếc radio trong sân
  if (!D5 || !D5.song || P5.radioOpen >= 1) return; const S = D5.song;
  const m = { dinhngoai: [0.09, 900], dinhtrong: [0.16, 3200], radio: [0.22, 4200], banda: [0.14, 2600], benphai: [0.04, 520], manh: [0.1, 2000], tui: [0.1, 2000] }[where] || [0.06, 800];
  ramp(S.g.gain, m[0], 1.6); rampF(S.lp.frequency, m[1], 1.6);
}
function dinhSoundOff(sec = 2) { if (!D5) return; D5.alive = false; const d = D5; ramp(d.g.gain, 0, sec); setTimeout(() => { if (d.song) try { d.song.s.stop(); } catch (e) {} const i = AMB.indexOf(d.g); if (i >= 0) AMB.splice(i, 1); }, sec * 1000 + 200); D5 = null; }

// ---------- gợi ý ----------
function dinhHints() {
  let k, L;
  if (!P5.cong) { k = 'd0'; L = ['Cổng đình này em từng mở rồi.', 'Bên phải cổng, men theo tường đình, có lối riêng của nó.', 'Chạm vào cánh cổng để vào sân.']; }
  else if (!P5.manh[2] || !P5.manh[3]) { k = 'd1' + (P5.manh[2] ? 'r' : '') + (P5.manh[3] ? 'b' : ''); L = ['Trong sân còn hai thứ của hai đứa: chiếc radio và bộ bàn ghế đá.', !P5.manh[2] ? 'Chiếc radio vẫn chỉnh ở chỗ cũ. Mặt sau nó có bốn con ốc.' : 'Bàn đá: hai chiếc ghế đã bị ai kéo đi.', !P5.manh[2] ? 'Mỗi con ốc khắc một ký hiệu. Ghép lại thành con số trên mặt radio.' : 'Đưa hai ghế về đúng vết cũ trên nền, rồi xoay mặt bàn cho vết nứt khớp với chân bàn.']; }
  else if (!P5.loi) { k = 'd2'; L = ['Đường tới chỗ anh không đi xuyên qua đình.', 'Bên phải đình là hồ. Có lối nào men theo tường không?', 'Chạm vào lối đá nhỏ sát chân tường đình, mép hồ.']; }
  else return;
  if (P5.hintKey !== k) { P5.hintKey = k; hints(L); }
}

// ---------- cổng đình ----------
const dnDraw = SC.dinhngoai.draw;
const dnEnter = SC.dinhngoai.enter; SC.dinhngoai.enter = function () { dnEnter && dnEnter.call(this); dinhSound('dinhngoai'); dinhHints(); nudge(); };
SC.dinhngoai.tap = function (p) {
  if (inR(p, HOT_D.cong)) {
    const t = ac.currentTime; tone(t, 180, 120, 0.05, 1.4, 'sawtooth'); nz(t, 1.3, 'bandpass', 700, 6, 0.25, 0, 1100); FX.step(t + 1.0, -0.1); FX.step(t + 1.5, 0.1);
    if (!P5.cong) { P5.cong = true; sayNow('Ổ khoá vẫn mở, như lần trước em mở.'); }
    go('dinhtrong', 1200); return;
  }
  if (inR(p, HOT_D.tuong_phai)) { const t = ac.currentTime; FX.step(t, 0.3); FX.step(t + 0.45, 0.4); go('benphai', 900); }
};
// ---------- sân trong ----------
const HOT_HOIUC = { x: 690, y: 286, w: 220, h: 60 };
SC.dinhtrong.back = 'dinhngoai';
const dtEnter = SC.dinhtrong.enter; SC.dinhtrong.enter = function () { dtEnter && dtEnter.call(this); dinhSound('dinhtrong'); dinhHints(); nudge(); };
SC.dinhtrong.tap = function (p) {
  if (inR(p, HOT_D.radio)) { go('radio', 700); return; }
  if (inR(p, HOT_D.ban_da) || (p[0] > 1080 && p[0] < 1560 && p[1] > 640 && p[1] < 810)) { go('banda', 700); return; }
  if (inR(p, HOT_HOIUC)) { FX.tap(); sayNow('Hai chữ ấy, cùng nét với nhãn trên chiếc máy em đang cầm.'); return; }
  if (inR(p, HOT_D.den_long)) { const t = ac.currentTime; tone(t, 1568, 1568, 0.012, 1.6); tone(t + 0.12, 2349, 2349, 0.008, 1.4); }
};

// ---------- radio Băng 1: mặt trước 85.0, mặt sau 4 con ốc ----------
const RD = { x: 430, y: 230, w: 740, h: 420, oc: [[560, 330, '5'], [1040, 330, '0'], [560, 560, '8'], [1040, 560, '.']], need: [2, 0, 3, 1] }; // 8 → 5 → . → 0
SC.radio = {
  back: 'dinhtrong',
  enter() { dinhSound('radio'); dinhHints(); nudge(); hints(P5.manh[2] ? ['Đã lấy mảnh giấy trong radio.', 'Quay lại sân.', 'Chạm mũi tên góc trên để quay lại.'] : ['Kim dò sóng vẫn nằm ở chỗ cũ.', 'Vuốt ngang để xoay chiếc radio ra phía sau.', 'Mỗi con ốc khắc một ký hiệu. Ghép lại thành con số trên mặt radio.']); },
  draw(c, now, dt) {
    c.fillStyle = '#080605'; c.fillRect(-300, -300, W + 600, H + 600); warmSpot(c, 760, 300, 820, 0.16);
    P5.radioFace += ((P5.radioLat ? 1 : 0) - P5.radioFace) * Math.min(1, dt * 5);
    const k = P5.radioFace, sx = Math.cos(k * Math.PI), back = sx < 0;
    c.save(); c.translate(800, 440); c.scale(Math.max(0.03, Math.abs(sx)), 1); c.translate(-800, -440);
    // thân gỗ
    const g = c.createLinearGradient(0, RD.y, 0, RD.y + RD.h); g.addColorStop(0, back ? '#3a2416' : '#7a4a2a'); g.addColorStop(1, back ? '#1d120b' : '#3c2213');
    c.fillStyle = g; roundRect(c, RD.x, RD.y, RD.w, RD.h, 34); c.fill(); c.strokeStyle = 'rgba(255,220,170,.18)'; c.lineWidth = 2; c.beginPath(); c.moveTo(RD.x + 34, RD.y + 3); c.lineTo(RD.x + RD.w - 34, RD.y + 3); c.stroke();
    for (let i = 0; i < 9; i++) { c.strokeStyle = `rgba(0,0,0,${0.06 + (i % 3) * 0.02})`; c.lineWidth = 1; c.beginPath(); c.moveTo(RD.x + 20, RD.y + 40 + i * 44 + Math.sin(i) * 6); c.bezierCurveTo(RD.x + 260, RD.y + 30 + i * 44, RD.x + 480, RD.y + 52 + i * 44, RD.x + RD.w - 20, RD.y + 40 + i * 44); c.stroke(); } // vân gỗ
    if (!back) {
      // loa vải
      c.fillStyle = '#2a1d14'; roundRect(c, RD.x + 50, RD.y + 60, 300, 300, 24); c.fill();
      c.strokeStyle = 'rgba(200,170,130,.14)'; c.lineWidth = 1; for (let i = 0; i < 28; i++) { c.beginPath(); c.moveTo(RD.x + 60, RD.y + 72 + i * 10); c.lineTo(RD.x + 340, RD.y + 72 + i * 10); c.stroke(); }
      // mặt số dò sóng
      const on = P5.radioOpen < 1, gl = on ? 0.85 + 0.08 * Math.sin(now * 0.003) : 0.25;
      c.fillStyle = `rgba(${on ? '246,226,180' : '120,110,95'},${gl})`; roundRect(c, RD.x + 390, RD.y + 70, 300, 120, 12); c.fill();
      c.strokeStyle = 'rgba(60,40,20,.7)'; c.lineWidth = 2; c.font = `20px ${HAND}`; c.fillStyle = 'rgba(60,40,20,.8)'; c.textAlign = 'center';
      for (let f = 80; f <= 108; f += 4) { const x = RD.x + 410 + ((f - 80) / 28) * 260; c.beginPath(); c.moveTo(x, RD.y + 150); c.lineTo(x, RD.y + 170); c.stroke(); c.fillText(String(f), x, RD.y + 140); }
      const nx = RD.x + 410 + ((85 - 80) / 28) * 260; c.strokeStyle = 'rgba(176,36,30,.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(nx, RD.y + 82); c.lineTo(nx, RD.y + 182); c.stroke();
      c.fillStyle = 'rgba(60,40,20,.85)'; c.font = `30px ${HAND}`; c.fillText('85.0', RD.x + 540, RD.y + 112); c.textAlign = 'left';
      // núm vặn
      [[RD.x + 450, RD.y + 290], [RD.x + 630, RD.y + 290]].forEach(([x, y]) => { c.fillStyle = '#1b130d'; c.beginPath(); c.arc(x, y, 46, 0, Math.PI * 2); c.fill(); c.fillStyle = '#c9a66b'; c.beginPath(); c.arc(x, y, 36, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#5a3d1e'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 30); c.stroke(); });
      if (on) { const a = 0.4 + 0.3 * Math.sin(now * 0.006); c.fillStyle = `rgba(255,120,80,${a})`; c.beginPath(); c.arc(RD.x + 700, RD.y + 360, 6, 0, Math.PI * 2); c.fill(); }
    } else {
      // mặt sau: tấm ván có khe thông gió, 4 con ốc khắc ký hiệu
      const lift = ease(P5.radioOpen);
      c.save(); c.translate(0, -lift * 60); c.globalAlpha = 1 - lift * 0.85;
      c.fillStyle = '#2b1b11'; roundRect(c, RD.x + 90, RD.y + 60, RD.w - 180, RD.h - 120, 16); c.fill(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 3; c.stroke();
      for (let i = 0; i < 6; i++) { c.fillStyle = '#120b07'; roundRect(c, RD.x + 260, RD.y + 120 + i * 34, 220, 12, 6); c.fill(); }
      c.fillStyle = 'rgba(220,205,170,.5)'; roundRect(c, RD.x + 500, RD.y + 140, 120, 70, 6); c.fill(); c.fillStyle = 'rgba(60,40,20,.6)'; c.font = `18px ${HAND}`; c.fillText('HỒI ỨC', RD.x + 520, RD.y + 182);
      RD.oc.forEach(([x, y, ch], i) => {
        const pr = P5.oc[i], out = pr >= 1;
        const ex = x + (x < 800 ? -60 : 60); c.fillStyle = 'rgba(232,220,196,.5)'; if (ch === '.') { c.beginPath(); c.arc(ex, y + 6, 6, 0, Math.PI * 2); c.fill(); } else { c.font = `34px ${HAND}`; c.textAlign = 'center'; c.fillText(ch, ex, y + 12); c.textAlign = 'left'; } // ký hiệu khắc mờ
        c.fillStyle = '#0c0805'; c.beginPath(); c.arc(x, y, 22, 0, Math.PI * 2); c.fill(); // lỗ ốc
        if (!out) { const s = 1 + pr * 0.25, a = -pr * Math.PI * 3 + i; c.save(); c.translate(x, y); c.scale(s, s); const sg = c.createRadialGradient(-6, -6, 2, 0, 0, 22); sg.addColorStop(0, '#d9d4c8'); sg.addColorStop(1, '#6d675c'); c.fillStyle = sg; c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#3a352d'; c.lineWidth = 4; c.beginPath(); c.moveTo(Math.cos(a) * -13, Math.sin(a) * -13); c.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); c.stroke(); c.restore(); }
      });
      c.restore();
      // ốc đã tháo nằm dưới đáy
      P5.ocOut.forEach((i, n) => { const x = 620 + n * 110, y = 700; c.save(); c.translate(x, y); c.rotate(0.6 + n); c.fillStyle = '#9a9488'; c.fillRect(-16, -5, 32, 10); c.beginPath(); c.arc(-18, 0, 10, 0, Math.PI * 2); c.fill(); c.restore(); });
      if (lift > 0.5) { // bên trong: một mảnh giấy gấp
        c.fillStyle = '#120b07'; roundRect(c, RD.x + 90, RD.y + 60, RD.w - 180, RD.h - 120, 16); c.fill();
        c.strokeStyle = 'rgba(180,150,110,.15)'; c.lineWidth = 6; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(RD.x + 200 + i * 120, RD.y + 300, 40, 0, Math.PI * 2); c.stroke(); } // đèn điện tử cũ
        if (!P5.manh[2]) { c.globalAlpha = clamp((lift - 0.5) * 2, 0, 1); drawManh(c, 2, 900, 430, 0.7); c.globalAlpha = 1; }
      }
    }
    c.restore();
    vignette(c, 0.7);
  },
  down(p) {
    this.sx = p[0]; this.sy = p[1]; this.oc = -1;
    if (P5.radioLat && P5.radioFace > 0.9 && P5.radioOpen < 1) for (let i = 0; i < 4; i++) { const [x, y] = RD.oc[i]; if (P5.oc[i] < 1 && Math.hypot(p[0] - x, p[1] - y) < 80) { this.oc = i; this.a = Math.atan2(p[1] - y, p[0] - x); this.tick = 0; return true; } }
    return false;
  },
  move(p, b) {
    if (!b) return;
    if (this.oc >= 0) { const i = this.oc, [x, y] = RD.oc[i], a = Math.atan2(p[1] - y, p[0] - x); let d = a - this.a; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; this.a = a;
      P5.oc[i] = clamp(P5.oc[i] + Math.abs(d) / (Math.PI * 3), 0, 1); this.tick += Math.abs(d);
      if (this.tick > 0.5) { this.tick = 0; nz(ac.currentTime, 0.02, 'bandpass', 3200 + Math.random() * 800, 6, 0.12); }
      if (P5.oc[i] >= 1) { this.oc = -1; ocOut(i); } return; }
  },
  up(p, moved) {
    if (this.oc >= 0) { this.oc = -1; return true; }
    if (moved && this.sx != null && Math.abs(p[0] - this.sx) > 140 && Math.abs(p[1] - this.sy) < 160) { P5.radioLat = P5.radioLat ? 0 : 1; FX.cloth(); nz(ac.currentTime, 0.3, 'lowpass', 300, 1, 0.5); nudge(); return true; }
    return false;
  },
  tap(p) {
    if (!P5.radioLat) { if (inR(p, RD)) { FX.tap(); sayNow(P5.radioOpen >= 1 ? 'Radio đã tắt.' : 'Vẫn là bài hát ấy, vẫn ở 85.0.'); } return; }
    if (P5.radioOpen >= 1 && !P5.manh[2] && Math.abs(p[0] - 900) < 130 && Math.abs(p[1] - 430) < 110) { manhAdd(2); sayNow('Một mảnh giấy gấp, trên có nét bút bi.'); dinhHints(); }
  },
};
function ocOut(i) {
  const t = ac.currentTime; tone(t, 2600, 2400, 0.04, 0.25, 'triangle'); nz(t + 0.25, 0.04, 'highpass', 3000, 1, 0.3); tone(t + 0.25, 3100, 2900, 0.03, 0.4, 'sine');
  P5.ocOut.push(i);
  if (P5.ocOut.length < 4) return;
  if (P5.ocOut.join() === RD.need.join()) { // đúng 8 · 5 · . · 0: nắp lưng nhấc ra, bài hát nhoè thành rè rồi tắt
    setTimeout(() => { FX.latch(); nz(ac.currentTime, 0.6, 'lowpass', 500, 1, 0.6); const T0 = performance.now(); const run = () => { P5.radioOpen = Math.min(1, (performance.now() - T0) / 1300); if (P5.radioOpen < 1) requestAnimationFrame(run); }; run(); radioDies(); }, 500);
  } else { // vặn ngược trở lại hết, không nói con nào sai
    setTimeout(() => { FX.jam(); P5.ocOut = []; P5.oc = [0, 0, 0, 0]; missHint('radio', ['Bốn con ốc phải tháo theo một thứ tự.', 'Bốn ký hiệu khắc cạnh ốc ghép lại thành một con số em từng gặp.', 'Kim dò sóng chỉ 85.0: tháo ốc 8, rồi 5, rồi dấu chấm, rồi 0.'], 1); }, 600);
  }
}
function radioDies() {
  if (!D5 || !D5.song) return; const S = D5.song, t = ac.currentTime;
  S.s.playbackRate.setValueAtTime(1, t); S.s.playbackRate.linearRampToValueAtTime(0.86, t + 3.2); rampF(S.lp.frequency, 420, 3.2);
  const hs = loopNoise(0, 'bandpass', 2600, 0.6); hs.gain.connect(D5.g); hs.gain.gain.linearRampToValueAtTime(0.05, t + 2.4); hs.gain.gain.linearRampToValueAtTime(0, t + 5.5);
  S.g.gain.cancelScheduledValues(t); S.g.gain.setValueAtTime(S.g.gain.value, t); S.g.gain.linearRampToValueAtTime(0, t + 3.6);
  setTimeout(() => { try { S.s.stop(); hs.src.stop(); } catch (e) {} if (D5) D5.song = null; FX.click(ac.currentTime, 0.8); }, 5800);
}

// ---------- bàn đá nhìn từ trên xuống: hai ghế về vết cũ, xoay mặt đá cho vết nứt khớp ----------
const BD5 = { cx: 800, cy: 430, r: 210, mark: [2.62, -0.52], notch: 1.15, crack0: 0 }; // vết ghế cũ ở hai phía đối diện; khấc ở chân bàn
let banTex = null;
function bakeBan() {
  const [cvs, g] = layer(); banTex = cvs; cvs.width = cv.width; cvs.height = cv.height; setT(g);
  // nền gạch sân dưới ánh đèn lồng
  g.fillStyle = '#16120e'; g.fillRect(-300, -300, W + 600, H + 600);
  for (let y = -90; y < H + 90; y += 90) for (let x = ((y + 90) / 90) % 2 ? -135 : -90; x < W + 90; x += 90) { g.fillStyle = `rgba(${36 + rnd() * 12},${29 + rnd() * 9},${22},${0.55})`; g.fillRect(x + 2, y + 2, 86, 86); }
  const lg = g.createRadialGradient(BD5.cx - 120, BD5.cy - 200, 40, BD5.cx, BD5.cy, 900); lg.addColorStop(0, "rgba(255,190,120,.13)"); lg.addColorStop(0.55, "rgba(0,0,0,.25)"); lg.addColorStop(1, "rgba(0,0,0,.72)"); g.fillStyle = lg; g.fillRect(-300, -300, W + 600, H + 600);
  // vết chân ghế cũ in trên nền (hai vòng mòn đối diện nhau)
  BD5.mark.forEach((a) => { const x = BD5.cx + Math.cos(a) * 330, y = BD5.cy + Math.sin(a) * 330; g.strokeStyle = 'rgba(190,170,140,.16)'; g.lineWidth = 10; g.beginPath(); g.arc(x, y, 62, 0, Math.PI * 2); g.stroke(); g.fillStyle = 'rgba(150,135,110,.07)'; g.beginPath(); g.arc(x, y, 58, 0, Math.PI * 2); g.fill(); });
  // chân bàn (vành đá to hơn mặt một chút) có một khấc
  g.fillStyle = '#4a4741'; g.beginPath(); g.arc(BD5.cx, BD5.cy, BD5.r + 18, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0d0c0a'; g.beginPath(); g.moveTo(BD5.cx + Math.cos(BD5.notch - 0.05) * (BD5.r - 4), BD5.cy + Math.sin(BD5.notch - 0.05) * (BD5.r - 4)); g.lineTo(BD5.cx + Math.cos(BD5.notch) * (BD5.r + 22), BD5.cy + Math.sin(BD5.notch) * (BD5.r + 22)); g.lineTo(BD5.cx + Math.cos(BD5.notch + 0.05) * (BD5.r - 4), BD5.cy + Math.sin(BD5.notch + 0.05) * (BD5.r - 4)); g.fill();
  g.strokeStyle = 'rgba(220,210,190,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(BD5.cx + Math.cos(BD5.notch - 0.06) * (BD5.r + 18), BD5.cy + Math.sin(BD5.notch - 0.06) * (BD5.r + 18)); g.lineTo(BD5.cx + Math.cos(BD5.notch) * (BD5.r + 26), BD5.cy + Math.sin(BD5.notch) * (BD5.r + 26)); g.lineTo(BD5.cx + Math.cos(BD5.notch + 0.06) * (BD5.r + 18), BD5.cy + Math.sin(BD5.notch + 0.06) * (BD5.r + 18)); g.stroke();
  grain(g, 9000, 0.03);
}
let banTop = null;
function bakeBanTop() { // mặt đá xoay được: hạt đá, viền, một vết nứt từ tâm ra mép
  const s = 2, size = (BD5.r + 4) * 2 * s; banTop = document.createElement('canvas'); banTop.width = banTop.height = size; const g = banTop.getContext('2d'); g.scale(s, s); g.translate(BD5.r + 4, BD5.r + 4);
  const gg = g.createRadialGradient(-60, -70, 20, 0, 0, BD5.r); gg.addColorStop(0, '#8e8a82'); gg.addColorStop(1, '#5d5a54'); g.fillStyle = gg; g.beginPath(); g.arc(0, 0, BD5.r, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 1400; i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * BD5.r; g.fillStyle = `rgba(${rnd() < 0.5 ? '20,20,20' : '230,225,215'},${0.05 + rnd() * 0.12})`; g.fillRect(Math.cos(a) * d, Math.sin(a) * d, 2.2, 2.2); }
  g.strokeStyle = 'rgba(255,250,240,.18)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, BD5.r - 6, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
  g.strokeStyle = 'rgba(15,12,10,.85)'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(0, 0); let x = 0, y = 0; for (let i = 1; i <= 8; i++) { x = (BD5.r * i) / 8; y = Math.sin(i * 2.3) * 6; g.lineTo(x, y); } g.stroke();
}
const GHE0 = [[330, 250], [1300, 610]];
SC.banda = {
  back: 'dinhtrong',
  bake: bakeBan,
  enter() { if (!banTex) bakeBan(); if (!banTop) bakeBanTop(); if (!P5.banGhe) P5.banGhe = GHE0.map((p) => ({ x: p[0], y: p[1], at: -1 })); dinhSound('banda'); nudge(); hints(P5.manh[3] ? ['Đã lấy mảnh giấy dưới bàn.', 'Quay lại sân.', 'Chạm mũi tên góc trên để quay lại.'] : P5.banStage ? ['Mặt đá đã lỏng ra.', 'Xoay mặt bàn bằng một ngón tay theo vòng tròn.', 'Cho vết nứt trên mặt đá chạy thẳng tới cái khấc ở chân bàn.'] : ['Hai chiếc ghế không ở chỗ của nó.', 'Trên nền còn in vết chân ghế cũ.', 'Kéo từng chiếc ghế về đúng vòng vết cũ, hai ghế quay mặt vào nhau.']); },
  draw(c, now, dt) {
    if (!banTex) bakeBan(); if (!banTop) bakeBanTop();
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(banTex, 0, 0); c.restore(); setT(c);
    // ngăn bí mật trượt ra từ khấc
    if (P5.banOpen > 0) { const a = BD5.notch, k = ease(P5.banOpen), x = BD5.cx + Math.cos(a) * (BD5.r + 20 + 70 * k), y = BD5.cy + Math.sin(a) * (BD5.r + 20 + 70 * k); c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#3d3a35'; c.fillRect(-60, -46, 120, 92); c.fillStyle = '#100e0c'; c.fillRect(-50, -36, 100, 72); if (!P5.manh[3]) { c.rotate(-a); drawManh(c, 3, 0, 0, 0.36); } c.restore(); }
    // mặt bàn
    c.save(); c.translate(BD5.cx, BD5.cy); c.rotate(P5.banRot); const s = (BD5.r + 4) * 2; c.drawImage(banTop, -s / 2, -s / 2, s, s); c.restore();
    if (P5.banStage && P5.banOpen <= 0) { const gl = 0.12 + 0.08 * Math.sin(now * 0.004); c.strokeStyle = `rgba(255,214,160,${gl})`; c.lineWidth = 2; c.beginPath(); c.arc(BD5.cx, BD5.cy, BD5.r + 9, 0, Math.PI * 2); c.stroke(); } // khe hở quanh mặt đá
    // hai ghế đá (trụ tròn nhìn từ trên)
    P5.banGhe.forEach((g) => { const sg = c.createRadialGradient(g.x - 18, g.y - 22, 6, g.x, g.y, 64); sg.addColorStop(0, '#85817a'); sg.addColorStop(1, '#4b4843'); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(g.x + 8, g.y + 10, 62, 0, Math.PI * 2); c.fill(); c.fillStyle = sg; c.beginPath(); c.arc(g.x, g.y, 58, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(255,250,240,.12)'; c.lineWidth = 2; c.beginPath(); c.arc(g.x, g.y, 52, Math.PI * 1.1, Math.PI * 1.7); c.stroke(); });
    vignette(c, 0.6);
  },
  down(p) {
    this.drag = null; this.rot = null;
    if (!P5.banStage) { for (const g of P5.banGhe) if (Math.hypot(p[0] - g.x, p[1] - g.y) < 70) { this.drag = g; g.at = -1; this.off = [g.x - p[0], g.y - p[1]]; nz(ac.currentTime, 0.2, 'lowpass', 260, 1, 0.5); return true; } return false; }
    if (P5.banOpen <= 0 && Math.hypot(p[0] - BD5.cx, p[1] - BD5.cy) < BD5.r) { this.rot = Math.atan2(p[1] - BD5.cy, p[0] - BD5.cx); this.acc = 0; return true; }
    return false;
  },
  move(p, b) {
    if (!b) return;
    if (this.drag) { const g = this.drag; g.x = clamp(p[0] + this.off[0], 120, 1480); g.y = clamp(p[1] + this.off[1], 140, 760); if (Math.hypot(g.x - BD5.cx, g.y - BD5.cy) < BD5.r + 70) { const a = Math.atan2(g.y - BD5.cy, g.x - BD5.cx); g.x = BD5.cx + Math.cos(a) * (BD5.r + 70); g.y = BD5.cy + Math.sin(a) * (BD5.r + 70); } this.acc = (this.acc || 0) + 1; if (this.acc % 6 === 0) nz(ac.currentTime, 0.08, 'lowpass', 220 + Math.random() * 80, 1, 0.35); return; }
    if (this.rot != null) { const a = Math.atan2(p[1] - BD5.cy, p[0] - BD5.cx); let d = a - this.rot; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; this.rot = a; P5.banRot += d * 0.6; this.acc += Math.abs(d); if (this.acc > 0.12) { this.acc = 0; nz(ac.currentTime, 0.12, 'lowpass', 160 + Math.random() * 60, 1.5, 0.45); }
      const off = banOff(), pv = this.prevOff == null ? off : this.prevOff; this.prevOff = off;
      if (Math.abs(off) < 0.05 || (Math.sign(off) !== Math.sign(pv) && Math.abs(off) < 0.4)) { P5.banRot -= off; this.rot = null; this.prevOff = null; banOpen(); } }
  },
  up(p, moved) {
    if (this.drag) { const g = this.drag; this.drag = null; BD5.mark.forEach((a, i) => { const mx = BD5.cx + Math.cos(a) * 330, my = BD5.cy + Math.sin(a) * 330; if (Math.hypot(g.x - mx, g.y - my) < 60 && !P5.banGhe.some((o) => o !== g && o.at === i)) { g.x = mx; g.y = my; g.at = i; nz(ac.currentTime, 0.3, 'lowpass', 140, 1, 0.9); } });
      if (P5.banGhe.every((o) => o.at >= 0)) setTimeout(() => { P5.banStage = 1; const t = ac.currentTime; nz(t, 0.5, 'lowpass', 120, 1, 1); FX.click(t + 0.1, 0.8); sayNow('Hai chiếc ghế lại quay mặt vào nhau. Mặt đá khẽ lỏng ra.'); SC.banda.enter(); }, 300);
      return true; }
    if (this.rot != null) { this.rot = null; return true; }
    return false;
  },
  tap(p) { if (P5.banOpen >= 1 && !P5.manh[3]) { const a = BD5.notch, x = BD5.cx + Math.cos(a) * (BD5.r + 90), y = BD5.cy + Math.sin(a) * (BD5.r + 90); if (Math.hypot(p[0] - x, p[1] - y) < 90) { manhAdd(3); sayNow('Thêm một mảnh giấy.'); dinhHints(); } } },
};
function banOff() { return ((P5.banRot + BD5.crack0 - BD5.notch) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI; }
function banOpen() { const t = ac.currentTime; nz(t, 0.7, 'lowpass', 180, 1, 1.1); FX.latch(); const T0 = performance.now(); const run = () => { P5.banOpen = Math.min(1, (performance.now() - T0) / 1100); if (P5.banOpen < 1) requestAnimationFrame(run); }; setTimeout(run, 300); }

// ---------- lối bên phải đình ----------
SC.benphai.back = 'dinhngoai';
const bpDown = SC.benphai.down;
const bpEnter = SC.benphai.enter; SC.benphai.enter = function () { bpEnter && bpEnter.call(this); dinhSound('benphai'); dinhHints(); nudge(); };
const bpMove = SC.benphai.move;
function loiCheck() { const s = BP.soi; if (!s || P5.seenLoi) return; if (typeof BP.reveal === 'number') { if (BP.reveal > 0.6) loiFound(); return; } const ax = 610, ay = 622, bx = 875, by = 578, t = clamp(((s[0] - ax) * (bx - ax) + (s[1] - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2), 0, 1), d = Math.hypot(s[0] - ax - t * (bx - ax), s[1] - ay - t * (by - ay));
  if (d < 80) loiFound(); }
function loiFound() { P5.seenLoi = true; const t0 = ac.currentTime; nz(t0, 1.2, 'bandpass', 600, 1, 0.08); tone(t0 + 0.2, 392, 392, 0.01, 1.4); sayNow(typeof BP.reveal === 'number' ? 'Sát chân tường đình, mép hồ có một lối đá nhỏ.' : 'Chân tường bên phải có một khe hẹp, vừa một người đi.'); }
SC.benphai.down = function (p) { bpDown.call(this, p); if (!this.lit) { this.lit = true; FX.torch && FX.torch(); } loiCheck(); return false; };
SC.benphai.move = function (p, b) { bpMove.call(this, p, b); if (b) loiCheck(); };
const bpEnter5 = SC.benphai.enter; SC.benphai.enter = function () { bpEnter5.call(this); if (!P5.seenLoi) setTimeout(() => { if (V.cur === 'benphai' && !P5.seenLoi) loiFound(); }, 1500); }; // cảnh tự sáng: vài giây sau tự báo có lối đá
const bpDraw = SC.benphai.draw; SC.benphai.draw = function (c, now, dt) { bpDraw.call(this, c, now, dt); if (BP.soi && !P5.seenLoi && typeof BP.reveal === 'number' && BP.reveal > 0.6) loiFound(); };
SC.benphai.up = function () { return false; };
SC.benphai.tap = function (p) {
  if (!inR(p, HOT_D.loi) || !P5.seenLoi) return;
  if (!P5.manh[2] || !P5.manh[3]) { sayNow('Lối đá men tường đình, dọc mép hồ ra phía ngõ. Nhưng trong sân còn thứ em chưa lấy.'); return; }
  P5.loi = true; HINT.text = ''; const t = ac.currentTime; for (let i = 0; i < 6; i++) FX.step(t + i * 0.42, i % 2 ? 0.2 : -0.2);
  dinhSoundOff(3); setTimeout(() => go('luotngo', 900), 1600);
};

// ---------- đoạn lướt qua ngõ: 7 giây, không bắt chạm ----------
const lnEnter = SC.luotngo.enter;
SC.luotngo.noBag = true;
SC.luotngo.enter = function () {
  lnEnter && lnEnter.call(this); LN.t = 0; LN.auto = true; HINT.off = true; HINT.text = '';
  LN.xong = () => { LN.xong = null; setTimeout(() => endNgo(), 600); };
  const t = ac.currentTime, g = ac.createGain(); g.gain.value = 0; g.connect(master); ramp(g.gain, 1, 1.2);
  for (let i = 0; i < 14; i++) FX.step(t + 0.3 + i * 0.36 * (i < 4 ? 1.2 : i > 10 ? 1.3 : 0.9), i % 2 ? 0.15 : -0.15);
  setTimeout(() => ramp(g.gain, 0, 1.5), 7600);
  nz(t + 2.2, 2.2, 'bandpass', 380, 1.2, 0.12, -0.6, 0, g); // xe máy xa vụt qua đầu ngõ
  for (let i = 0; i < 4; i++) tone(t + 1.2 + i * 1.3, 118, 118, 0.006, 0.9, 'sine', g); // đèn đường rè khẽ lướt qua
};
function endNgo() { HINT.off = false; go('end5', 1400); }
SC.end5 = { noBag: true, draw(c) { c.fillStyle = '#000'; c.fillRect(-300, -300, W + 600, H + 600); text(c, '(trước cửa khu trọ · câu đố cuối đang làm)', W / 2, H / 2, 28, 0.5); } };

// ---------- nối từ bức tường: tối hẳn, tiếng dế vào trước, rồi cổng đình hiện ra ----------
SC.qua5 = { noBag: true, draw(c) { c.fillStyle = '#000'; c.fillRect(-300, -300, W + 600, H + 600); } };
endWall = function () {
  quietPast(2); go('qua5', 1600); P5.on = true;
  setTimeout(() => { dinhSound('dinhngoai'); }, 1800);
  setTimeout(() => go('dinhngoai', 2600), 4200);
};

// thử nhanh: ?phong=5 (đình, đủ đồ của các phòng trước)
if (new URLSearchParams(location.search).get('phong') === '5') {
  const st0 = START;
  START = () => { st0(); INTRO.t = 9; setTimeout(() => { Object.assign(P1, { torch: true, calm: true, calmT: 9, done: true }); bagAdd('may', '', null); bagAdd('strip', 'dải ảnh', STRIP_DRAW); tapeAdd('9/11', 'am/giong1.mp3', SUB1); tapeAdd('10/11', 'am/giong2.mp3', SUB2); tapeAdd('11/11', 'am/bang3.mp3', SUB3, true); POCKET.msg = null; manhAdd(0); manhAdd(1); endWall(); }, 300); };
}
