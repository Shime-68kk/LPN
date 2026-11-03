// Dùng chung cho các thùng thử của Mặt B: thu phóng sân khấu 960×540, bộ âm thanh mặt A (giọng "tối"),
// phát file nhạc qua loa điện thoại hoặc ra cả phòng, kéo thả, lời dẫn, lớp phóng to.
'use strict';
window.MB = (() => {
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  let K = 1;
  function fit() {
    K = Math.min(innerWidth / 960, innerHeight / 540); stage.style.transform = 'translate(-50%, -50%) scale(' + K + ')';
    // Màn máy tính (K > 1): ô hạt phim thu lại theo K để hạt vẫn nhỏ cỡ một điểm ảnh, không phóng to thành vỡ hạt
    stage.style.setProperty('--gk', (1 / Math.max(1, K)).toFixed(4));
  }
  addEventListener('resize', fit); fit();

  // iPhone: chạm nhanh hai lần (gõ phím liên tục) hay chụm hai ngón sẽ phóng to cả trang rồi không thu lại được → chặn.
  // Chặn lần chạm nhanh thứ hai thì iPhone cũng bỏ luôn cú bấm, nên tự bấm hộ lại đúng chỗ đó. Lỡ bị phóng to thì đặt lại khung nhìn về 1.
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => { const now = Date.now(), quick = now - lastTouch < 380; lastTouch = now; if (!quick || e.target.closest('input, textarea')) return; e.preventDefault(); const t = e.changedTouches[0]; e.target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: t.clientX, clientY: t.clientY })); }, { passive: false });
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick'].forEach((n) => document.addEventListener(n, (e) => e.preventDefault(), { passive: false }));
  const vpMeta = document.querySelector('meta[name=viewport]'), VP = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
  if (window.visualViewport && vpMeta) visualViewport.addEventListener('resize', () => { if (visualViewport.scale > 1.01) { vpMeta.setAttribute('content', VP + ', minimum-scale=1'); setTimeout(() => vpMeta.setAttribute('content', VP), 60); } fit(); });

  // ===== Âm thanh: đúng bộ âm của story/hoi-uc.js =====
  let ac, out, rev;
  function AC() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* bỏ qua */ }
      out = ac.createGain(); out.gain.value = 0.9; out.connect(ac.destination);
      rev = ac.createConvolver(); const n = ac.sampleRate * 2.8, b = ac.createBuffer(2, n, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.4); }
      rev.buffer = b; const rg = ac.createGain(); rg.gain.value = 0.5; rev.connect(rg).connect(out);
    }
    // iPhone: ngoài 'suspended' còn 'interrupted' (sau cuộc gọi, chuyển app, iframe khác vừa phát) → cũng phải bật lại
    wake();
    return ac;
  }
  // chạm bất kỳ đâu hay quay lại trang mà âm thanh đang bị ngắt → bật lại (resume chỉ chắc ăn trong một cú chạm)
  function wake() { if (ac && ac.state !== 'running' && ac.state !== 'closed') { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } }
  ['pointerdown', 'touchend', 'click'].forEach((n) => document.addEventListener(n, wake, true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  function noise(t, dur, type, freq, q, gain) {
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(out); s.start(t);
  }
  function tone(t, dur, f0, f1, gain, type) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur);
  }
  function sweep(t, dur, type, f0, f1, gain, swell) {
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = type; f.Q.value = 1.2; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (swell) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.95); g.gain.linearRampToValueAtTime(0, t + dur); }
    else { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    src.connect(f).connect(g).connect(out); src.start(t);
  }
  const T = () => AC().currentTime;
  const sfx = {
    paper() { const t = T(); sweep(t, 0.16, 'highpass', 1800, 5200, 0.3); noise(t + 0.1, 0.04, 'bandpass', 3000, 0.8, 0.2); },
    page() { const t = T(); noise(t, 0.025, 'bandpass', 2000, 1.5, 0.07); noise(t, 0.04, 'lowpass', 320, 0.7, 0.06); },
    piece() { const t = T(); noise(t, 0.03, 'lowpass', 900, 0.7, 0.7); tone(t, 0.04, 320, 220, 0.12); },
    tile() { const t = T(); tone(t, 0.08, 620, 560, 0.25, 'triangle'); noise(t, 0.02, 'bandpass', 1800, 2, 0.3); },
    key() { const t = T(); noise(t, 0.02, 'bandpass', 2400 + Math.random() * 400, 1.5, 0.55); tone(t, 0.03, 260, 180, 0.12); },
    roller() { const t = T(); for (let i = 0; i < 3; i++) noise(t + i * 0.035, 0.012, 'bandpass', 4200 - i * 300, 4, 0.7 - i * 0.15); tone(t, 0.05, 2600, 2400, 0.05); },
    clack() { const t = T(); tone(t, 0.06, 520, 300, 0.2, 'triangle'); noise(t, 0.03, 'bandpass', 1400, 1.5, 0.6); },
    latch() { const t = T(); noise(t, 0.02, 'highpass', 3000, 0.7, 1); tone(t, 0.12, 900, 300, 0.25, 'triangle'); noise(t + 0.08, 0.25, 'lowpass', 500, 0.7, 0.5); tone(t + 0.08, 0.3, 90, 60, 0.4); },
    unlock() { const t = T(); noise(t, 0.03, 'highpass', 2500, 0.7, 0.8); tone(t, 0.18, 420, 160, 0.18, 'triangle'); noise(t + 0.12, 0.3, 'lowpass', 300, 0.7, 0.4); tone(t + 0.14, 1.4, 1046.5, 1010, 0.015); },
    find() { const t = T(); noise(t, 0.5, 'lowpass', 160, 0.7, 0.35); tone(t, 0.9, 98, 70, 0.22); tone(t + 0.05, 2.2, 293.66, 293.66, 0.05, 'triangle'); tone(t + 0.05, 2.2, 311.13, 311.13, 0.045, 'triangle'); tone(t + 0.25, 2.6, 1174.7, 1140, 0.012); sweep(t + 0.1, 1.6, 'bandpass', 500, 1500, 0.06, true); },
    cloth() { const t = T(); for (let i = 0; i < 5; i++) noise(t + i * 0.07 + Math.random() * 0.03, 0.12, 'bandpass', 1200 + Math.random() * 1200, 0.6, 0.22); },
    tap() { const t = T(); noise(t, 0.015, 'bandpass', 3200, 2, 0.12); },
  };

  // ===== File nhạc =====
  const bufs = {};
  // Mạng điện thoại chập chờn: tải hỏng thì thử lại (3 lần, mỗi lần tối đa 30s); hỏng hẳn thì quên đi để lần chạm sau tải lại từ đầu
  function load(url) {
    if (bufs[url]) return bufs[url];
    AC();
    const once = () => {
      const ctl = window.AbortController ? new AbortController() : null, to = ctl && setTimeout(() => ctl.abort(), 30000);
      return fetch(url, ctl ? { signal: ctl.signal } : {})
        .then((r) => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.arrayBuffer(); })
        .then((a) => new Promise((res, rej) => ac.decodeAudioData(a, res, rej)))
        .finally(() => clearTimeout(to));
    };
    const tryN = (n) => once().catch((e) => (n > 1 ? new Promise((r) => setTimeout(r, 800)).then(() => tryN(n - 1)) : Promise.reject(e)));
    bufs[url] = tryN(3).catch((e) => { delete bufs[url]; throw e; });
    return bufs[url];
  }
  // play(url, {offset, dur, gain, phone: true (loa điện thoại nhỏ, rè), wet}) → { src, gain, lpf, hpf, stop(sec) }
  async function play(url, o = {}) {
    const b = await load(url);
    const s = ac.createBufferSource(); s.buffer = b;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = o.phone ? 420 : 20;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.phone ? 3200 : 20000;
    const g = ac.createGain(); const v = o.gain == null ? 1 : o.gain;
    g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.linearRampToValueAtTime(v, ac.currentTime + (o.fade || 0.05));
    s.connect(hp).connect(lp).connect(g).connect(out);
    const w = ac.createGain(); w.gain.value = o.wet || 0; g.connect(w).connect(rev);
    s.start(ac.currentTime + (o.when || 0), o.offset || 0, o.dur);
    const h = { src: s, gain: g, lpf: lp, hpf: hp, wet: w, t0: ac.currentTime + (o.when || 0) - (o.offset || 0) };
    h.stop = (sec = 0.4) => { const t = ac.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0.0001, t + sec); try { s.stop(t + sec + 0.05); } catch (e) { /* bỏ qua */ } };
    h.ramp = (param, v2, sec) => { const t = ac.currentTime; param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(v2, t + sec); };
    h.pos = () => ac.currentTime - h.t0;
    return h;
  }

  // ===== Lời dẫn, phóng to =====
  let sayT;
  function say(s, ms = 4200) { const e = $('say'); e.textContent = s; e.style.opacity = 1; clearTimeout(sayT); sayT = setTimeout(() => { e.style.opacity = 0; }, ms); }
  function zoom(html) { $('zbody').innerHTML = html; $('zoom').classList.add('on'); return $('zbody'); }
  function unzoom() { $('zoom').classList.remove('on'); }
  $('zx') && ($('zx').onclick = () => { unzoom(); sfx.page(); });

  // ===== Kéo thả (toạ độ sân khấu) =====
  function drag(el, drop, tap) {
    let sx, sy, ox, oy, moved = false, id = null;
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); AC(); id = e.pointerId; el.setPointerCapture(id); moved = false; sx = e.clientX; sy = e.clientY; ox = parseFloat(el.style.left) || el.offsetLeft; oy = parseFloat(el.style.top) || el.offsetTop; });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const dx = (e.clientX - sx) / K, dy = (e.clientY - sy) / K;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) { moved = true; el.classList.add('drag'); sfx.paper(); }
      el.style.left = (ox + dx) + 'px'; el.style.top = (oy + dy) + 'px';
    });
    el.addEventListener('pointerup', (e) => { if (e.pointerId !== id) return; id = null; el.classList.remove('drag'); if (!moved) { tap && tap(); return; } drop && drop(el); });
  }
  const k = () => K;
  // Báo cho gác xép (trang cha) biết thùng này đã giải xong
  const done = (name) => {
    try { if (parent !== window) { parent.postMessage({ matb: name }, '*'); return; } } catch (e) { /* bỏ qua */ }
    // mở riêng (không qua gác xép): hiện lối về gác xép
    const a = document.createElement('a'); a.href = 'gac-xep.html'; a.textContent = 'Xong thùng này · về gác xép ›';
    a.style.cssText = 'position:absolute;right:16px;top:12px;z-index:75;background:#C9A24E;color:#2A1D08;font-weight:700;font-size:13px;padding:8px 16px;border-radius:18px;text-decoration:none';
    stage.appendChild(a);
  };
  const bus = () => { AC(); return { out, rev }; }; // đường ra chung + vang phòng, cho tiếng tự tổng hợp
  return { $, stage, AC, sfx, load, play, say, zoom, unzoom, drag, k, done, bus };
})();
