'use strict';
// BĂNG SỐ 2 · v7 · LÕI: khung vẽ, chạm, chuyển cảnh, túi đồ, dòng hướng dẫn, phụ đề, âm thanh, nghi thức nghe băng.
// Khung thiết kế 1600×900, phủ kín màn (cắt mép). Vùng an toàn: y 100..800 (màn điện thoại dài bị cắt ~80 trên/dưới).
const cv = document.getElementById('cv'), g = cv.getContext('2d');
const W = 1600, H = 900, Q = new URLSearchParams(location.search);
const FAST = Q.get('nhanh') === '1', RATE = Q.get('tuathu') === '1' ? 8 : 1;
let S = 1, OX = 0, OY = 0, dpr = 1;
const HAND = "'Patrick Hand', 'Be Vietnam Pro', sans-serif";
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const setT = (c) => c.setTransform(S * dpr, 0, 0, S * dpr, OX * dpr, OY * dpr);
const layer = () => { const c = document.createElement('canvas'); return [c, c.getContext('2d')]; };
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function text(c, s, x, y, size, a, align = 'center', col = '236,230,218') { c.font = `${size}px ${HAND}`; c.textAlign = align; c.fillStyle = `rgba(${col},${a})`; c.fillText(s, x, y); c.textAlign = 'left'; }
function wrap(c, s, maxW, size) { c.font = `${size}px ${HAND}`; const out = []; for (const para of s.split('\n')) { if (!para) { out.push(''); continue; } let line = ''; for (const w of para.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } out.push(line); } return out; }
function vignette(c, k = 0.8) { const gr = c.createRadialGradient(W * 0.5, H * 0.45, H * 0.28, W / 2, H / 2, H * 1.05); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${k})`); c.fillStyle = gr; c.fillRect(-300, -300, W + 600, H + 600); }
function grain(c, n, a) { for (let i = 0; i < n; i++) { c.fillStyle = `rgba(255,255,255,${rnd() * a})`; c.fillRect(rnd() * W, rnd() * H, 1.2, 1.2); } }
// dấu quay lại: một nét cong vẽ tay (không dùng biểu tượng sẵn), đặt trong vùng an toàn
function drawBack(c) { c.strokeStyle = 'rgba(236,230,218,.7)'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(150, 192); c.bezierCurveTo(130, 150, 92, 142, 70, 164); c.stroke(); c.beginPath(); c.moveTo(62, 142); c.lineTo(68, 168); c.lineTo(94, 166); c.stroke(); }
const inBack = (p) => p[0] < 200 && p[1] < 240;
const inR = (p, r) => r && p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;

// ================= CẢNH =================
// Mỗi cảnh: { draw(c, now, dt), tap?(p), down?(p), move?(p), up?(p), back?: 'tên cảnh', enter?(), bake?() }
const SC = {};
const V = { cur: null, prev: null, k: 1, lock: false };
function go(name, ms = 600) { if (V.cur === name) return; V.prev = V.cur; V.cur = name; V.k = 0; V.ms = ms; const s = SC[name]; if (s && s.enter) s.enter(); }

// ================= TÚI ĐỒ (vẽ tay, mép dưới) =================
const BAG = { items: [], open: true, sel: null }; // sel: món đang cầm trên tay (chọn trong túi)
const held = (id) => BAG.sel === id;
const BAG_VIEW = {}; // món xem kỹ được (dải ảnh): chạm trong túi thì mở ra xem, không cầm
// Không còn thanh đồ: em luôn cầm chiếc máy cát-sét có tai nghe (góc dưới phải). Chạm máy mở hộp băng (nghe lại) và túi nhỏ.
const POCKET = { on: false, flash: -9, ret: 'dorm', r: { x: 1395, y: 640, w: 170, h: 140 }, intro: -1e9, msg: null, seen: false };
// lời nhắn cạnh chiếc máy (lần đầu cầm máy, lần đầu có băng để nghe lại): hiện tới khi em mở túi, tối đa 14 giây
function pocketTell(a, b) { POCKET.intro = performance.now(); POCKET.msg = [a, b]; POCKET.seen = false; }
const TAPES = [];
function tapeAdd(label, url, subs, noBed) { if (!TAPES.find((t) => t.label === label)) TAPES.push({ label, url, subs, noBed }); }
function bagAdd(id, label, draw) {
  if (id === 'may' || id === 'tai') { if (!POCKET.on) pocketTell('máy và tai nghe giờ luôn theo em', 'chạm vào máy để mở túi'); POCKET.on = true; POCKET.flash = performance.now(); FX && ac && FX.pocket(); return; }
  if (id.startsWith('bang')) return; // cuộn băng: vào hộp băng khi nghe
  if (!BAG.items.find((x) => x.id === id)) BAG.items.push({ id, label, draw, t: 0 }); POCKET.flash = performance.now(); FX && ac && FX.pocket();
}
function bagHas(id) { return !!BAG.items.find((x) => x.id === id); }
function drawPocket(c, now) {
  if (!POCKET.on || typeof drawMiniWalkman !== 'function') return;
  const r = POCKET.r, cx = r.x + r.w / 2, cy = r.y + r.h / 2 - 6, f = clamp(1 - (now - POCKET.flash) / 1400, 0, 1);
  if (f > 0) { const g = c.createRadialGradient(cx, cy, 10, cx, cy, 110); g.addColorStop(0, `rgba(255,214,160,${0.35 * f})`); g.addColorStop(1, 'rgba(255,214,160,0)'); c.fillStyle = g; c.fillRect(cx - 110, cy - 110, 220, 220); }
  c.save(); c.globalAlpha = 0.82; c.translate(cx, cy); c.rotate(-0.08); drawMiniWalkman(c, 0.5); c.restore();
  c.strokeStyle = 'rgba(236,232,224,.55)'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - 40, cy - 40); c.bezierCurveTo(cx - 70, cy - 90, cx - 10, cy - 100, cx - 30, cy - 62); c.stroke();
  // món đang cầm trên tay: nổi cạnh chiếc máy, ấm nhẹ
  const it = BAG.sel && BAG.items.find((x) => x.id === BAG.sel);
  if (it) { const hx = r.x - 70, hy = cy + 10, gl = c.createRadialGradient(hx, hy, 6, hx, hy, 70); gl.addColorStop(0, `rgba(255,214,160,${0.22 + 0.08 * Math.sin(now * 0.004)})`); gl.addColorStop(1, 'rgba(255,214,160,0)'); c.fillStyle = gl; c.fillRect(hx - 70, hy - 70, 140, 140); c.save(); c.translate(hx, hy); c.rotate(-0.2); it.draw(c, 0.75); c.restore(); text(c, 'đang cầm', hx, hy + 52, 18, 0.5); }
  // lời nhắn lần đầu
  const age = (now - POCKET.intro) / 1000;
  if (POCKET.msg && !POCKET.seen && age < 14) {
    const a = clamp(age / 0.8, 0, 1) * clamp((14 - age) / 1.2, 0, 1), bob = Math.sin(now * 0.003) * 4;
    text(c, POCKET.msg[0], 1300, 560 + bob, 25, 0.85 * a); text(c, POCKET.msg[1], 1300, 594 + bob, 22, 0.6 * a);
    c.strokeStyle = `rgba(236,230,218,${0.55 * a})`; c.lineWidth = 2.5; c.beginPath(); c.moveTo(1360, 612 + bob); c.quadraticCurveTo(1400, 625, 1420, 662); c.stroke(); c.beginPath(); c.moveTo(1408, 652); c.lineTo(1421, 664); c.lineTo(1426, 647); c.stroke();
  }
}
function drawBag(c, now) {
  if (!BAG.items.length) return;
  const n = BAG.items.length, w = 110, x0 = W / 2 - (n * w) / 2, y = 712;
  BAG.items.forEach((it, i) => {
    it.t = Math.min(1, it.t + 0.03); const x = x0 + i * w, a = it.t;
    c.save(); c.globalAlpha = a * 0.92; c.strokeStyle = 'rgba(236,230,218,.35)'; c.lineWidth = 2; roundRect(c, x + 8, y, w - 16, 76, 10); c.stroke();
    c.translate(x + w / 2, y + 38); it.draw(c, 0.5); c.restore();
  });
}

// ================= DÒNG HƯỚNG DẪN (theo thời gian kẹt) =================
const HINT = { list: [], at: 0, tier: 0, text: '', show: 0, off: false };
const HINT_AT = FAST ? [12, 25, 40] : [90, 200, 330];
// gợi ý theo số lần thử sai: cứ 'every' lần sai lại hé thêm một bậc (phương pháp, không phải đáp án)
const MISS = {};
function missHint(key, list, every = 2) { const n = (MISS[key] = (MISS[key] || 0) + 1); if (n % every) return; const i = Math.min(n / every - 1, list.length - 1); sayNow(list[i]); nudge(); }
function hints(list) { HINT.list = list; HINT.tier = 0; HINT.text = ''; HINT.off = false; nudge(); }
function nudge() { HINT.at = performance.now() / 1000; }
function drawHint(c, now) {
  if (!HINT.off) { const idle = now / 1000 - HINT.at; for (let i = HINT.list.length - 1; i >= 0; i--) if (idle > HINT_AT[i] && HINT.tier <= i) { HINT.tier = i + 1; HINT.text = HINT.list[i]; HINT.show = now; break; } }
  if (!HINT.text || SUB.on) return;
  const a = clamp((now - HINT.show) / 1200, 0, 1) * clamp(1 - (now - HINT.show - 9000) / 1500, 0, 1);
  if (a > 0) text(c, HINT.text, W / 2, (SC[V.cur] && SC[V.cur].hintY) || 690, 30, 0.8 * a);
}

// ================= PHỤ ĐỀ GIỌNG ANH =================
const SUB = { on: false, lines: [], ac0: 0 };
function drawSub(c, now) {
  if (!SUB.on || !ac) return; const t = (ac.currentTime - (ac.outputLatency || ac.baseLatency || 0) - SUB.ac0) * RATE; // bám đồng hồ của chính tiếng băng
  const cur = SUB.lines.find((l) => t >= l[0] && t <= l[1] + 0.6); if (!cur) return;
  const a = clamp(Math.min(t - cur[0], cur[1] + 0.6 - t) / 0.35, 0, 1);
  c.save(); c.font = `34px ${HAND}`; const w = c.measureText(cur[2]).width; c.fillStyle = `rgba(0,0,0,${0.35 * a})`; roundRect(c, W / 2 - w / 2 - 22, 712, w + 44, 56, 14); c.fill(); c.restore();
  text(c, cur[2], W / 2, 752, 34, 0.92 * a);
}

// ================= ÂM THANH =================
let ac = null, master, noiseBuf, FX = null;
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* máy không hỗ trợ */ }
function wake() { if (document.hidden || !ac) return; if (ac.state !== 'running') ac.resume().catch(() => {}); }
document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend().catch(() => {}); else { wake(); setTimeout(wake, 600); } });
addEventListener('pageshow', () => setTimeout(wake, 300));
addEventListener('pointerdown', wake, true); // iPhone chỉ cho phát lại trong lúc chạm
function audioStart() {
  if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)();
  ac.addEventListener('statechange', () => { if (ac.state !== 'running') setTimeout(wake, 400); }); // cuộc gọi đến: iPhone để "interrupted", hết thì tự đánh thức
  master = ac.createGain(); master.connect(ac.destination);
  noiseBuf = ac.createBuffer(2, ac.sampleRate * 4, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = noiseBuf.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; d[i] = (b0 + b1 + b2 + w * 0.02) * 0.5; } }
  FX = makeFX();
}
function nz(t, dur, type, f, q, gain, pan = 0, f2 = 0, dest = null) {
  const o = ac.createBufferSource(); o.buffer = noiseBuf; const b = ac.createBiquadFilter(); b.type = type; b.frequency.setValueAtTime(f, t); if (f2) b.frequency.exponentialRampToValueAtTime(f2, t + dur); b.Q.value = q;
  const e = ac.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.004, dur / 4)); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const p = ac.createStereoPanner(); p.pan.value = pan; o.connect(b).connect(e).connect(p).connect(dest || master); o.start(t, Math.random() * 3, dur + 0.05);
}
function tone(t, f0, f1, g0, dur, type = 'sine', dest = null) { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); const e = ac.createGain(); e.gain.setValueAtTime(g0, t); e.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(e).connect(dest || master); o.start(t); o.stop(t + dur + 0.02); }
function loopNoise(gain, type, f, q, rate = 1) { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = rate; const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; const g2 = ac.createGain(); g2.gain.value = gain; s.connect(b).connect(g2); s.start(); return { src: s, filt: b, gain: g2 }; }
function rampF(param, v, sec) { const t = ac.currentTime; param.cancelScheduledValues(t); param.setValueAtTime(Math.max(1, param.value), t); param.exponentialRampToValueAtTime(v, t + sec); }
function ramp(param, v, sec) { const t = ac.currentTime; param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(v, t + sec); }
function makeFX() {
  const click = (t, g2 = 1, pan = 0) => { nz(t, 0.014, 'highpass', 2600, 0.7, 2.2 * g2, pan); nz(t + 0.002, 0.045, 'bandpass', 1150, 2.2, 1.6 * g2, pan); tone(t, 190, 110, 0.18 * g2, 0.06); };
  return {
    click, now: () => ac.currentTime,
    btn() { click(ac.currentTime, 1.1); },
    pick() { const t = ac.currentTime; nz(t, 0.22, 'bandpass', 2200, 0.7, 0.55, 0, 4200); click(t + 0.16, 0.45); },
    put() { const t = ac.currentTime; click(t, 0.5); nz(t, 0.09, 'lowpass', 320, 0.7, 1.4); },
    pocket() { const t = ac.currentTime; nz(t, 0.3, 'bandpass', 1800, 0.6, 0.6, 0, 3600); nz(t + 0.25, 0.12, 'lowpass', 500, 0.7, 0.8); },
    insert() { const t = ac.currentTime; nz(t, 0.16, 'bandpass', 1400, 1.2, 0.9, 0, 3800); click(t + 0.18, 1.3); click(t + 0.42, 1.0); nz(t + 0.42, 0.1, 'lowpass', 280, 0.7, 1.6); },
    jam() { const t = ac.currentTime; click(t, 1.3); const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t + 0.02); o.frequency.linearRampToValueAtTime(70, t + 0.14); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const e = ac.createGain(); e.gain.setValueAtTime(0.0001, t + 0.02); e.gain.exponentialRampToValueAtTime(0.16, t + 0.04); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); o.connect(lp).connect(e).connect(master); o.start(t + 0.02); o.stop(t + 0.2); click(t + 0.15, 1.1); },
    wheel() { const t = ac.currentTime; nz(t, 0.012, 'highpass', 3600, 0.7, 1.8); nz(t + 0.003, 0.03, 'bandpass', 1900, 3.5, 1.1); },
    wrong() { const t = ac.currentTime; nz(t, 0.05, 'bandpass', 900, 3, 1.2); click(t + 0.05, 0.6); },
    latch() { const t = ac.currentTime; [0, 0.17].forEach((d) => { nz(t + d, 0.03, 'highpass', 2400, 0.7, 2.4); tone(t + d, 2100, 1900, 0.12, 0.3, 'triangle'); tone(t + d, 3170, 3000, 0.05, 0.2, 'triangle'); }); nz(t + 0.32, 0.18, 'lowpass', 400, 0.7, 1.4); },
    paper() { const t = ac.currentTime; nz(t, 0.25, 'bandpass', 3800, 0.5, 0.7, 0, 5200); nz(t + 0.22, 0.2, 'bandpass', 3000, 0.5, 0.5, 0, 4500); },
    cloth() { const t = ac.currentTime; nz(t, 0.45, 'bandpass', 1200, 0.5, 0.5, 0, 2400); nz(t + 0.3, 0.3, 'bandpass', 900, 0.5, 0.35); },
    wipe() { const t = ac.currentTime; nz(t, 0.16, 'bandpass', 5200, 1.5, 0.12); },
    tap() { const t = ac.currentTime; tone(t, 2300, 2100, 0.05, 0.03); click(t, 0.35); },
    torch() { const t = ac.currentTime; click(t, 0.6); tone(t, 4200, 4100, 0.02, 0.05); },
    step(t, pan) { nz(t, 0.13, 'lowpass', 260, 0.7, 2.0, pan); nz(t + 0.02, 0.09, 'bandpass', 2600, 0.8, 0.35, pan); },
    breath() { const t = ac.currentTime; nz(t, 1.1, 'bandpass', 900, 0.6, 0.25, 0, 600); nz(t + 1.3, 1.4, 'bandpass', 700, 0.6, 0.18, 0, 500); },
    heart(n = 4) { const t = ac.currentTime; for (let i = 0; i < n; i++) { tone(t + i * 0.9, 62, 48, 0.35, 0.16); tone(t + i * 0.9 + 0.22, 58, 45, 0.22, 0.14); } },
    sleeper(pan) { const t = ac.currentTime; nz(t, 0.7, 'bandpass', 700, 0.5, 0.5, pan, 1400); tone(t + 0.15, 180, 150, 0.03, 0.4); },
  };
}
// tải trước băng/nhạc
const BUF = {};
function preload(urls) { urls.forEach((u) => { if (!BUF[u]) BUF[u] = fetch(u).then((r) => r.arrayBuffer()); }); }
async function buf(u) { if (!(BUF[u] instanceof AudioBuffer)) { const ab = await (BUF[u] || fetch(u).then((r) => r.arrayBuffer())); BUF[u] = await ac.decodeAudioData(ab); } return BUF[u]; }

// ================= NGHI THỨC NGHE BĂNG =================
// Tìm băng → lật nhãn → bỏ vào máy → đeo tai nghe (màn tối dần, tiếng phòng nghẹt) → ▶ → rè 3 s → giọng + phụ đề → hết → tháo tai nghe.
// Nhạc nền của phòng chui vào tai nghe khi đeo (không tắt, không có khoảng hẫng): phòng gán TMUSIC = { g, lp, far: [gain, Hz], near: [gain, Hz], duck }
let TMUSIC = null;
const AMB = []; // các bus tiếng phòng phụ (người ngủ…) cũng bị tai nghe chặn
function ambDuck(on) { const list = [TAPE.roomGain, ...AMB].filter(Boolean); for (const g of list) { if (on) { if (g._dv == null) g._dv = g.gain.value; ramp(g.gain, g._dv * 0.03, 1.6); } else if (g._dv != null) { ramp(g.gain, g._dv, 2.5); g._dv = null; } } }
// Nhạc chỉ vang khi tới gần cuộn băng: lúc tìm đồ thì im, tìm ra băng thì vọng rất xa, nghe xong ngân rồi tắt hẳn.
function musicNear() { if (!TMUSIC) return; rampF(TMUSIC.lp.frequency, 700, 3); ramp(TMUSIC.g.gain, 0.06, 4); }
function musicOff(sec = 8) { if (!TMUSIC) return; ramp(TMUSIC.g.gain, 0, sec); rampF(TMUSIC.lp.frequency, 500, sec); }
const TAPE = { phase: 'off', label: '', url: '', subs: [], dur: 0, t: 0, reel: 0, onEnd: null, roomGain: null };
// flip(done): máy tự lật mặt khi hết giọng; phòng tự dựng cảnh phía bên kia rồi gọi done() để tháo tai nghe
// opts.inMachine: băng nằm sẵn trong máy (bỏ bước lật nhãn, bỏ băng); opts.jam(done): bấm phát thì băng kẹt, phòng tự lo cảnh gỡ kẹt rồi gọi done()
function tapeStart(label, url, subs, roomGain, onEnd, flip = null, opts = {}) { if (!opts.replay) tapeAdd(label, url, subs, opts.noBed); TAPE.tm = TMUSIC; if (opts.noBed) TMUSIC = null; Object.assign(TAPE, { phase: opts.inMachine ? 'ready' : 'flip', label, url, subs, t: 0, onEnd, roomGain, rev: false, flipFn: flip, jamFn: opts.jam || null, replay: !!opts.replay, src: null, hiss: null }); preload([url]); go('tape', 500); }
SC.tape = {
  enter() { FX.pick(); },
  draw(c, now, dt) {
    TAPE.t += dt; const P = TAPE.phase, t = TAPE.t;
    c.fillStyle = '#060504'; c.fillRect(-300, -300, W + 600, H + 600);
    // bàn tay người chơi không vẽ; chỉ có vật: cuộn băng → máy
    if (P === 'flip') { // cuộn băng xoay một vòng cho thấy nhãn
      const k = ease(clamp(t / 1.4, 0, 1)), sx = Math.cos((1 - k) * Math.PI);
      c.save(); c.translate(W / 2, 420); c.scale(Math.abs(sx) * 1.6 || 0.01, 1.6); drawCassette(c, 0, 0, 1, sx > 0 ? TAPE.label : ''); c.restore();
      if (t > 2.2) text(c, 'chạm để bỏ băng vào máy', W / 2, 690, 26, clamp((t - 2.2) / 1, 0, 0.5));
    } else {
      const ins = P === 'insert' ? ease(clamp(t / 0.9, 0, 1)) : 1;
      drawWalkman(c, now, ins);
      if (P === 'ready' && t > 0.6) text(c, 'đeo tai nghe vào, rồi bấm phát', W / 2, 690, 26, clamp((t - 0.6) / 1, 0, 0.45));
      // đeo tai nghe: viền tối khép dần
      if (P === 'phones' || P === 'play' || P === 'end') { const k = P === 'end' ? 1 - clamp(t / 1.5, 0, 1) : clamp((P === 'phones' ? t : 2) / 1.8, 0, 1); const gr = c.createRadialGradient(W / 2, 420, 260 - 60 * k, W / 2, 420, 900 - 380 * k); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${0.94 * k})`); c.fillStyle = gr; c.fillRect(-300, -300, W + 600, H + 600); }
    }
    if (TAPE.replay && P.match(/ready|phones|armed|play/)) { drawBack(c); if (P === 'play' && t < 6) text(c, 'chạm mũi tên hoặc nút dừng để thôi nghe', W / 2, 760, 22, 0.4 * clamp((6 - t) / 1.5, 0, 1)); }
    if (P === 'insert' && t > 1.1) { TAPE.phase = 'ready'; TAPE.t = 0; }
    if (P === 'phones' && t > 2.4) { TAPE.phase = 'armed'; }
    if (P === 'play') TAPE.reel += dt * (TAPE.rev ? -2.6 : 2.6);
    if (P === 'end' && t > 1.6) { if (!TAPE.replay && TAPES.length === 1 && !POCKET.told1) { POCKET.told1 = true; pocketTell('cuộn băng đã cất vào hộp', 'chạm vào máy để nghe lại'); } TAPE.phase = 'off'; SUB.on = false; if (TAPE.tm) TMUSIC = TAPE.tm; if (TMUSIC) { rampF(TMUSIC.lp.frequency, TMUSIC.far[1], 3); ramp(TMUSIC.g.gain, TMUSIC.far[0], 3); } const f = TAPE.onEnd; TAPE.onEnd = null; f && f(); }
  },
  async tap(p) {
    if (TAPE.phase === 'flip' && TAPE.t > 1.4) { TAPE.phase = 'insert'; TAPE.t = 0; FX.insert(); return; }
    if (TAPE.phase === 'ready') { // chạm nút tua: kẹt; chạm chỗ khác/nút phát: đeo tai nghe trước
      if (inR(p, WM.btn.ff)) { WM.press = 'ff'; WM.pt = performance.now(); FX.jam(); return; }
      TAPE.phase = 'phones'; TAPE.t = 0; FX.cloth(); ambDuck(true); if (TMUSIC) { rampF(TMUSIC.lp.frequency, TMUSIC.near[1], 2.6); ramp(TMUSIC.g.gain, TMUSIC.near[0], 2.6); } else FX.heart(3); return;
    }
    if (TAPE.phase === 'armed') {
      if (inR(p, WM.btn.ff)) { WM.press = 'ff'; WM.pt = performance.now(); FX.jam(); return; }
      if (!inR(p, WM.btn.play)) return;
      if (TAPE.jamFn) { // băng kẹt: mô-tơ chạy được một lúc thì gằn, băng nhăn, máy nhả nút
        WM.press = 'play'; TAPE.phase = 'play'; TAPE.t = 0; FX.btn(); motorOn(); HINT.off = true; HINT.text = ''; const jf = TAPE.jamFn; TAPE.jamFn = null;
        const hz = loopNoise(0, 'highpass', 3200, 0.7); hz.gain.connect(master); ramp(hz.gain.gain, 0.03, 0.5);
        setTimeout(() => { const t = ac.currentTime; for (let i = 0; i < 6; i++) nz(t + i * 0.06, 0.05, 'bandpass', 2200 + i * 300, 2, 0.25); nz(t, 0.6, 'bandpass', 160, 3, 0.7); motorOff(); WM.press = null; ramp(hz.gain.gain, 0, 0.3); setTimeout(() => hz.src.stop(), 400); TAPE.phase = 'armed'; jf(() => go('tape', 500)); }, 2200 / RATE);
        return;
      }
      WM.press = 'play'; TAPE.phase = 'play'; TAPE.t = 0; FX.btn(); motorOn(); HINT.off = true; HINT.text = '';
      const gen = TAPE.gen = (TAPE.gen || 0) + 1;
      const b = await buf(TAPE.url); if (gen !== TAPE.gen || TAPE.phase !== 'play') return; const s = ac.createBufferSource(); TAPE.src = s; s.buffer = b; s.playbackRate.value = RATE;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9500;
      const g2 = ac.createGain(); g2.gain.value = 0; s.connect(hp).connect(lp).connect(g2).connect(master);
      const hiss = loopNoise(0.0, 'highpass', 3200, 0.7); TAPE.hiss = hiss; hiss.gain.connect(master); ramp(hiss.gain.gain, TMUSIC ? 0.011 : 0.022, 0.8);
      const t0 = ac.currentTime + 3 / RATE; s.start(t0); // 3 giây rè mỏng (nhạc vẫn chạy) trước khi có tiếng
      g2.gain.setValueAtTime(0, t0); g2.gain.linearRampToValueAtTime(0.95, t0 + 0.5);
      if (TMUSIC) { const mg = TMUSIC.g.gain; mg.cancelScheduledValues(ac.currentTime); mg.setValueAtTime(mg.value, t0 - 1.2); mg.linearRampToValueAtTime(TMUSIC.duck, t0 + 0.6); }
      SUB.on = true; SUB.lines = TAPE.subs; SUB.ac0 = t0;
      const finish = (wait) => setTimeout(() => { ramp(hiss.gain.gain, 0, 0.3); setTimeout(() => hiss.src.stop(), 400); motorOff(); WM.press = null; TAPE.rev = false; TAPE.phase = 'end'; TAPE.t = 0; FX.cloth(); ambDuck(false); }, wait);
      s.onended = () => {
        const fl = TAPE.flipFn;
        if (fl) { // hết mặt này: "cạch… cạch", mô-tơ ngừng nửa giây rồi chạy ngược, nhạc trong phòng lùi hẳn
          TAPE.flipFn = null; SUB.on = false; const t = ac.currentTime + 0.6 / RATE;
          FX.click(t, 1.1); FX.click(t + 0.32, 0.9); nz(t + 0.05, 0.12, 'bandpass', 380, 2, 0.6);
          ramp(hiss.gain.gain, 0.012, 0.6); if (TMUSIC) ramp(TMUSIC.g.gain, 0.0, 1.6);
          setTimeout(() => { TAPE.rev = true; }, 900 / RATE);
          setTimeout(() => fl(() => { go('tape', 700); finish(1200 / RATE); }), 1400 / RATE);
          return;
        }
        if (TMUSIC) ramp(TMUSIC.g.gain, TMUSIC.near[0], 2.5); finish(2000 / RATE);
      };
    }
  },
};
// đang nghe lại mà muốn thôi: dừng băng, tháo tai nghe, về hộp băng
function tapeCancel() {
  TAPE.gen = (TAPE.gen || 0) + 1;
  if (TAPE.src) { TAPE.src.onended = null; try { TAPE.src.stop(); } catch (e) {} TAPE.src = null; }
  if (TAPE.hiss) { const h = TAPE.hiss; ramp(h.gain.gain, 0, 0.2); setTimeout(() => h.src.stop(), 300); TAPE.hiss = null; }
  motorOff(); WM.press = 'stop'; WM.pt = performance.now(); FX.btn(); FX.cloth(); SUB.on = false; ambDuck(false);
  TAPE.phase = 'off'; TAPE.rev = false; TAPE.onEnd = null; TAPE.replay = false; if (TAPE.tm) TMUSIC = TAPE.tm; musicOff(2);
  HINT.off = false; nudge(); go('tui', 600);
}
// máy cát-sét nhìn chính diện (dùng chung cho mọi cuộn băng)
const WM = { x: 470, y: 120, w: 660, h: 540, press: null, pt: 0, btn: {} };
['stop', 'play', 'ff', 'eject'].forEach((k, i) => (WM.btn[k] = { x: 540 + i * 130, y: 560, w: 110, h: 76 }));
function drawWalkman(c, now, ins = 1) {
  let gr = c.createLinearGradient(WM.x, WM.y, WM.x + WM.w, WM.y + WM.h); gr.addColorStop(0, '#3c4147'); gr.addColorStop(1, '#1b1e22');
  c.fillStyle = gr; roundRect(c, WM.x, WM.y, WM.w, WM.h, 34); c.fill();
  c.strokeStyle = 'rgba(200,215,230,.22)'; c.lineWidth = 2; c.beginPath(); c.moveTo(WM.x + 34, WM.y + 3); c.lineTo(WM.x + WM.w - 34, WM.y + 3); c.stroke();
  for (let i = 0; i < 4; i++) { c.fillStyle = '#15171a'; c.beginPath(); c.arc(WM.x + 30 + (i % 2) * (WM.w - 60), WM.y + 30 + Math.floor(i / 2) * (WM.h - 60), 6, 0, Math.PI * 2); c.fill(); } // ốc
  const dx = WM.x + 60, dy = WM.y + 50, dw = WM.w - 120, dh = 300;
  c.fillStyle = '#0d0f12'; roundRect(c, dx, dy, dw, dh, 16); c.fill();
  c.save(); c.beginPath(); roundRect(c, dx, dy, dw, dh, 16); c.clip();
  drawCassette(c, dx + dw / 2, dy + dh / 2 + 6 - (1 - ins) * 420, 1.45, TAPE.label);
  [[dx + dw / 2 - 80, dy + dh / 2 + 64], [dx + dw / 2 + 80, dy + dh / 2 + 64]].forEach(([x, y]) => { c.strokeStyle = 'rgba(30,30,30,.9)'; c.lineWidth = 4; for (let i = 0; i < 6; i++) { const a = TAPE.reel + (i * Math.PI) / 3; c.beginPath(); c.moveTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4 - (1 - ins) * 420); c.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12 - (1 - ins) * 420); c.stroke(); } });
  c.restore();
  gr = c.createLinearGradient(dx, dy, dx + dw, dy + dh); gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(0.4, 'rgba(255,255,255,0)'); c.fillStyle = gr; roundRect(c, dx, dy, dw, dh, 16); c.fill();
  // bộ đếm ngày: đứng ở 099 (chỉ lăn ở cao trào)
  const cx = WM.x + WM.w - 230, cy = WM.y + 372; c.fillStyle = '#08090a'; c.fillRect(cx - 8, cy - 8, 172, 76);
  ['0', '9', '9'].forEach((d, i) => { c.fillStyle = '#e9e3d4'; c.fillRect(cx + i * 52, cy, 46, 60); c.fillStyle = '#1a1a1a'; c.font = `600 44px Georgia, serif`; c.textAlign = 'center'; c.fillText(d, cx + i * 52 + 23, cy + 46); c.textAlign = 'left'; });
  // lỗ loa
  for (let i = 0; i < 12; i++) { c.fillStyle = '#121417'; c.beginPath(); c.arc(WM.x + 80 + (i % 6) * 18, WM.y + 392 + Math.floor(i / 6) * 18, 4, 0, Math.PI * 2); c.fill(); }
  if (WM.press && performance.now() - WM.pt > 180 && WM.press !== 'play') WM.press = null;
  for (const k of ['stop', 'play', 'ff', 'eject']) {
    const b = WM.btn[k], down = WM.press === k ? 6 : 0;
    c.fillStyle = '#121417'; roundRect(c, b.x, b.y + 8, b.w, b.h, 10); c.fill();
    gr = c.createLinearGradient(0, b.y + down, 0, b.y + b.h + down); gr.addColorStop(0, '#50555c'); gr.addColorStop(1, '#2c3035'); c.fillStyle = gr; roundRect(c, b.x, b.y + down, b.w, b.h, 10); c.fill();
    const glow = k === 'play' && TAPE.phase === 'armed' ? 0.35 + 0.35 * Math.sin(now * 0.005) : 0;
    c.fillStyle = `rgba(${glow ? '255,225,180' : '230,230,225'},${0.7 + glow * 0.3})`;
    const mx = b.x + b.w / 2, my = b.y + b.h / 2 + down; c.beginPath();
    if (k === 'stop') { c.moveTo(mx - 13, my - 12); c.lineTo(mx + 13, my - 13); c.lineTo(mx + 12, my + 12); c.lineTo(mx - 12, my + 13); }
    if (k === 'play') { c.moveTo(mx - 10, my - 16); c.lineTo(mx + 17, my + 1); c.lineTo(mx - 11, my + 16); }
    if (k === 'ff') { c.moveTo(mx - 22, my - 13); c.lineTo(mx - 1, my); c.lineTo(mx - 22, my + 13); c.moveTo(mx, my - 13); c.lineTo(mx + 21, my + 1); c.lineTo(mx, my + 13); }
    if (k === 'eject') { c.moveTo(mx - 16, my + 2); c.lineTo(mx, my - 15); c.lineTo(mx + 16, my + 2); c.moveTo(mx - 15, my + 8); c.lineTo(mx + 15, my + 8); c.lineTo(mx + 15, my + 13); c.lineTo(mx - 15, my + 13); }
    c.closePath(); c.fill();
  }
}
function drawCassette(c, x, y, s, label) {
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.04);
  c.fillStyle = 'rgba(30,32,36,.97)'; roundRect(c, -170, -105, 340, 210, 12); c.fill();
  c.strokeStyle = 'rgba(200,210,220,.18)'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#efe7d6'; c.fillRect(-150, -88, 300, 92);
  c.strokeStyle = 'rgba(180,60,50,.5)'; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-140, -62 + i * 24); c.lineTo(140, -62 + i * 24); c.stroke(); }
  if (label) { c.fillStyle = '#222'; c.font = `46px ${HAND}`; c.fillText(label, -120, -36); }
  c.fillStyle = '#121417'; roundRect(c, -95, 14, 190, 52, 24); c.fill();
  [[-55, 40], [55, 40]].forEach(([cx, cy]) => { c.fillStyle = '#3a2a20'; c.beginPath(); c.arc(cx, cy, cx < 0 ? 22 : 16, 0, Math.PI * 2); c.fill(); c.fillStyle = '#d8d8d8'; c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2); c.fill(); });
  c.restore();
}
let motor = null;
function motorOn() {
  if (motor) return; const t = ac.currentTime;
  const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.35);
  const lp = ac.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 1300; lp.Q.value = 6; const g1 = ac.createGain(); g1.gain.setValueAtTime(0.0001, t); g1.gain.exponentialRampToValueAtTime(0.03, t + 0.3); g1.gain.exponentialRampToValueAtTime(0.0025, t + 1.4);
  o.connect(lp).connect(g1).connect(master); o.start(t);
  let rc = 0; const rattle = setInterval(() => { if (++rc < 5 || Math.random() < 0.15) nz(ac.currentTime, 0.008, 'highpass', 4500, 0.7, rc < 5 ? 0.08 : 0.02, Math.random() * 0.4 - 0.2); }, 300);
  motor = { o, g1, rattle };
}
function motorOff() { if (!motor) return; const t = ac.currentTime, m = motor; motor = null; clearInterval(m.rattle); m.o.frequency.setValueAtTime(m.o.frequency.value, t); m.o.frequency.exponentialRampToValueAtTime(20, t + 0.35); m.g1.gain.setValueAtTime(m.g1.gain.value, t); m.g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); m.o.stop(t + 0.4); FX.click(t + 0.3, 1.0); }

// ================= VÒNG CHẠY =================
let last = performance.now();
const OVER = []; // lớp vẽ thêm trên cùng (đếm thời gian, chữ mở đầu…)
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
  if (V.k < 1) V.k = Math.min(1, V.k + dt / ((V.ms || 600) / 1000));
  const k = ease(V.k);
  if (V.prev && k < 1 && SC[V.prev]) { g.globalAlpha = 1 - k; setT(g); SC[V.prev].draw(g, now, 0); }
  if (V.cur && SC[V.cur]) { g.globalAlpha = V.prev ? k : 1; setT(g); SC[V.cur].draw(g, now, dt); if (SC[V.cur].back && !TAPE.phase.match(/play|phones|armed/)) { setT(g); drawBack(g); } }
  g.globalAlpha = 1; setT(g);
  for (const f of OVER) f(g, now, dt);
  if (V.cur !== 'tape' && V.cur !== 'tui' && !(SC[V.cur] && SC[V.cur].noBag)) drawPocket(g, now);
  drawHint(g, now); drawSub(g, now);
  if (TOUCH && isPortrait()) { // cầm dọc: nhắc xoay ngang, tiếng vẫn chạy
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalAlpha = 1; g.fillStyle = '#050505'; g.fillRect(0, 0, innerWidth, innerHeight);
    g.textAlign = 'center'; g.fillStyle = 'rgba(236,230,218,.88)'; g.font = `26px ${HAND}`; g.fillText('Xoay ngang điện thoại nhé', innerWidth / 2, innerHeight / 2 - 6);
    g.fillStyle = 'rgba(236,230,218,.45)'; g.font = `18px ${HAND}`; g.fillText('cuộn băng được vẽ cho màn hình nằm ngang', innerWidth / 2, innerHeight / 2 + 26); g.textAlign = 'left';
  }
  requestAnimationFrame(frame);
}
// ================= CHẠM =================
const toD = (e) => [(e.clientX - OX) / S, (e.clientY - OY) / S];
let downP = null, moved = false;
cv.addEventListener('pointerdown', (e) => {
  if (TOUCH && isPortrait()) return;
  const p = toD(e); downP = p; moved = false;
  if (!ac) { audioStart(); START && START(); return; }
  const s = SC[V.cur]; if (s && s.down && s.down(p)) return;
});
cv.addEventListener('pointermove', (e) => { const p = toD(e); if (downP && Math.hypot(p[0] - downP[0], p[1] - downP[1]) > 14) moved = true; const s = SC[V.cur]; if (s && s.move) s.move(p, e.buttons); });
addEventListener('pointerup', (e) => {
  if (TOUCH && isPortrait()) { downP = null; return; }
  const p = toD(e); const s = SC[V.cur]; const wasDown = downP; downP = null;
  if (s && s.up && s.up(p, moved)) return;
  if (!wasDown || moved || V.k < 0.7) return;
  if (V.cur === 'tape' && TAPE.replay && TAPE.phase.match(/ready|phones|armed|play/) && (inBack(p) || inR(p, WM.btn.stop) || inR(p, WM.btn.eject))) { tapeCancel(); return; }
  if (HINT.text && p[1] > 640 && p[1] < 720 && Math.abs(p[0] - W / 2) < 480 && !(s && s.tapBelow)) { HINT.show = performance.now(); return; }
  if (s && s.back && inBack(p) && !TAPE.phase.match(/play|phones|armed/)) { FX.put(); go(s.back); nudge(); return; }
  if (POCKET.on && inR(p, POCKET.r) && !['tape', 'tui', 'anh1', 'qua', 'kenbang'].includes(V.cur) && !(s && s.noBag) && !(s && s.back === 'tui') && !TAPE.phase.match(/play|phones|armed|ready|flip|insert/)) { POCKET.ret = V.cur; FX.pick(); go('tui', 500); return; }
  if (s && s.tap) { s.tap(p); nudge(); }
});
let START = null;
function fit() { dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); S = Math.max(innerWidth / W, innerHeight / H); OX = (innerWidth - W * S) / 2; OY = (innerHeight - H * S) / 2; for (const k in SC) if (SC[k].bake) SC[k].bake(); }
let relayT = [], lastWH = '';
function refit() { const k = innerWidth + 'x' + innerHeight + 'x' + (devicePixelRatio || 1); if (k === lastWH) return; lastWH = k; fit(); }
function relayout() { refit(); relayT.forEach(clearTimeout); relayT = [80, 250, 600, 1200].map((ms) => setTimeout(refit, ms)); }
addEventListener('resize', relayout); addEventListener('orientationchange', relayout);
if (window.screen.orientation) window.screen.orientation.addEventListener('change', relayout);
if (window.visualViewport) visualViewport.addEventListener('resize', relayout);
matchMedia('(orientation: landscape)').addEventListener('change', relayout);
// đang cầm dọc trên điện thoại: phủ màn nhắc xoay ngang (game vẽ cho màn ngang), không nhận chạm
const TOUCH = matchMedia('(pointer: coarse)').matches;
function isPortrait() { const so = window.screen.orientation, o = so && so.type; if (o && o.startsWith('landscape')) return false; if (typeof window.orientation === 'number' && Math.abs(window.orientation) === 90) return false; if (matchMedia('(orientation: landscape)').matches) return false; return innerHeight > innerWidth; }
// chặn phóng to ngoài ý muốn (chụm hai ngón)
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
addEventListener('load', () => { refit(); requestAnimationFrame(frame); });

// ================= HỘP BĂNG + TÚI NHỎ (mở từ chiếc máy em cầm) =================
SC.tui = {
  back: 'dorm',
  enter() { this.back = POCKET.ret; POCKET.seen = true; FX.cloth(); },
  draw(c, now) {
    const g = c.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 900); g.addColorStop(0, '#1d1814'); g.addColorStop(1, '#060504'); c.fillStyle = g; c.fillRect(-300, -300, W + 600, H + 600);
    // hộp băng: các cuộn đã nghe, chạm để nghe lại
    text(c, 'nghe lại', 520, 200, 26, 0.5);
    c.fillStyle = '#16120e'; roundRect(c, 250, 230, 540, 470, 22); c.fill(); c.strokeStyle = 'rgba(236,220,190,.12)'; c.lineWidth = 2; c.stroke();
    SC.tui.tapeR = [];
    for (let i = 0; i < 3; i++) { const y = 320 + i * 140; if (TAPES[i]) { drawCassette(c, 520, y, 0.55, TAPES[i].label); SC.tui.tapeR.push({ x: 420, y: y - 70, w: 210, h: 130, t: TAPES[i] }); } else { c.strokeStyle = 'rgba(236,220,190,.08)'; c.setLineDash([8, 8]); roundRect(c, 430, y - 55, 180, 110, 10); c.stroke(); c.setLineDash([]); } }
    if (!TAPES.length) text(c, 'chưa có cuộn băng nào', 520, 470, 24, 0.35);
    // túi nhỏ: vài món mang theo
    text(c, 'trong túi', 1100, 200, 26, 0.5);
    SC.tui.itemR = [];
    BAG.items.forEach((it, i) => { const x = 900 + (i % 3) * 175, y = 310 + Math.floor(i / 3) * 172, on = BAG.sel === it.id;
      if (on) { c.fillStyle = 'rgba(255,214,160,.13)'; roundRect(c, x - 82, y - 70, 164, 160, 14); c.fill(); c.strokeStyle = 'rgba(255,214,160,.45)'; c.lineWidth = 2; c.stroke(); }
      c.save(); c.translate(x, y - 6); it.draw(c, 0.82); c.restore(); text(c, on ? it.label + ' · đang cầm' : it.label, x, y + 72, 19, on ? 0.85 : 0.55); SC.tui.itemR.push({ x: x - 82, y: y - 70, w: 164, h: 160, it }); });
    if (!BAG.items.length) text(c, 'trống', 1100, 470, 24, 0.35);
    else text(c, 'chạm một món để cầm lên, hoặc xem kỹ', 1100, 740, 20, 0.35);
  },
  tap(p) {
    const ih = (SC.tui.itemR || []).find((r) => inR(p, r));
    if (ih) { const v = BAG_VIEW[ih.it.id]; if (v && SC[v]) { SC[v].back = 'tui'; go(v, 500); return; }
      if (BAG.sel === ih.it.id) { BAG.sel = null; FX.put(); } else { BAG.sel = ih.it.id; FX.pick(); const ret = POCKET.ret; setTimeout(() => { if (V.cur === 'tui' && BAG.sel === ih.it.id) go(ret, 500); }, 500); } return; }
    const hit = (SC.tui.tapeR || []).find((r) => inR(p, r)); if (!hit) return;
    const ret = POCKET.ret; tapeStart(hit.t.label, hit.t.url, hit.t.subs, null, () => { HINT.off = false; nudge(); musicOff(6); go(ret, 700); }, null, { inMachine: true, replay: true, noBed: hit.t.noBed });
  },
};
