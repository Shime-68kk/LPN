'use strict';
// Chữ trên màn hình: màn mở đầu, dòng dẫn chuyện (kiểu phim tài liệu, cho người chưa biết gì về thiên văn vẫn theo được),
// dòng năm/giờ chạy như phụ đề, chữ cuối (chữ Claude viết nháp (C), chờ anh Quang duyệt) và tấm thiệp cuối phim (thiep.js, lời anh Quang).
(() => {
  const SN = window.SN, M = SN.M;
  const $ = (id) => document.getElementById(id);
  // [bắt đầu, kết thúc, chữ]
  const DAN = [
    [5.5, 12.5, 'Ở rất xa, có một ngôi sao.'],
    [20.5, 27.5, 'Nó vừa gửi đi một tia sáng.'],
    [32, 38.6, 'Ánh sáng là thứ nhanh nhất vũ trụ.'],
    [39.2, 46, 'Chỉ một giây, nó đi được bảy vòng quanh Trái Đất.'],
    [56, 62.5, 'Nhưng vũ trụ thì rộng lắm.'],
    [66, 73.5, 'Có những đám mây khí, ánh sáng đi xuyên qua cũng mất nhiều năm.'],
    [104.6, 111.5, 'Có những nơi, đến ánh sáng cũng không thoát ra được.'],
    [118, 125, 'Đi ngang qua đó, thời gian trôi chậm lại.'],
    [141.2, 146.5, 'Nhưng tia sáng không dừng lại.'],
    [151, 157, 'Rồi nó tới gần Mặt Trời của chúng ta.'],
    [162.5, 168, 'Sao Thổ.'],
    [169.5, 176, 'Chấm sáng nhỏ xíu kia là Trái Đất.'],
    [193.5, 199.5, 'Việt Nam. Sắp nửa đêm.'],
  ];
  const KET = [
    [249.0, 'Tia sáng ấy rời ngôi sao Eta Cassiopeiae năm 2007,<br>năm em chào đời.'],
    [254.6, 'Nó đi mười chín năm, bằng đúng tuổi em. Không tua nhanh được.'],
    [259.0, 'Và tới đúng đêm nay.'],
    [263.6, 'Chúc mừng sinh nhật mười chín tuổi.'],
  ];
  const THU_LUC = 272;
  // dòng năm / giờ ở chân màn hình
  function namAt(S) {
    if (S < 7) return '';
    if (S < 52) return '2007';
    const yr = (a, b, t) => String(Math.floor(a + (b - a) * t));
    if (S < 100) return yr(2007.6, 2011.7, (S - 52) / 48);
    if (S < 140) { const t = (S - 100) / 40; return yr(2011.7, 2014.0, t * t * (3 - 2 * t) * 0.6 + t * 0.4); }
    if (S < 176) { const t = (S - 140) / 36; return yr(2014.0, 2025.99, Math.pow(t, 0.8)); }
    if (S < M.SEAM) return '2026';
    if (S < 207.7) return '23 · 11 · 2026';
    if (S < M.BOOM) { const k = Math.ceil(M.BOOM - S); return 'Thái Nguyên · 23:59:' + String(60 - k).padStart(2, '0'); }
    if (S < 217) return 'Thái Nguyên · 00:00:00';
    if (S < 224) return '24 · 11 · 2026';
    return '';
  }
  let danI = -1, namTxt = null, ketShown = 0, thuShown = false, cuoiShown = false, opMo = 1;
  function cap(S, running) {
    // dẫn chuyện: hiện mờ dần vào, mờ dần ra
    const el = $('dan');
    let k = -1;
    for (let i = 0; i < DAN.length; i++) if (S >= DAN[i][0] && S < DAN[i][1]) { k = i; break; }
    if (k !== danI) { danI = k; if (k >= 0) el.textContent = DAN[k][2]; }
    let op = 0;
    if (k >= 0) { const a = DAN[k][0], b = DAN[k][1]; op = Math.min(1, (S - a) / 0.9, (b - S) / 0.9); }
    el.style.opacity = op.toFixed(3);
    el.style.transform = 'translateY(' + ((1 - op) * 6).toFixed(1) + 'px)';
    const nm = $('nam'), t = namAt(S);
    if (t !== namTxt) { namTxt = t; nm.textContent = t; }
    let nop = S < 7 ? 0 : Math.min(1, (S - 7) / 2);
    if (S > 220) nop = Math.max(0, 1 - (S - 220) / 3);
    nm.style.opacity = (nop * 0.92).toFixed(3);
    // chữ cuối
    const kt = $('ket');
    while (ketShown < KET.length && S >= KET[ketShown][0]) {
      const p = document.createElement('p'); p.innerHTML = KET[ketShown][1]; if (ketShown === KET.length - 1) p.className = 'chot';
      kt.appendChild(p); requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('hien'))); ketShown++;
    }
    if (S < KET[0][0] && ketShown) { kt.innerHTML = ''; ketShown = 0; }
    kt.style.opacity = S > THU_LUC - 2 ? Math.max(0, 1 - (S - (THU_LUC - 2)) / 2).toFixed(3) : '1';
    if (S >= THU_LUC && !thuShown) { thuShown = true; moThu(); }
    if (S < THU_LUC && thuShown) { thuShown = false; $('thu').classList.remove('hien'); $('cuoi').classList.remove('hien'); cuoiShown = false; }
  }
  function moThu() {
    const t = $('thu');
    if (!t.dataset.xong) {
      if (SN.thiep) SN.thiep(t);   // tấm thiệp (thiep.js) tự dựng bên trong #thu
      t.dataset.xong = '1';
      t.addEventListener('scroll', () => { if (!cuoiShown && t.scrollTop + t.clientHeight > t.scrollHeight - 40) { cuoiShown = true; $('cuoi').classList.add('hien'); } });
      setTimeout(() => { if (!cuoiShown && t.scrollHeight <= t.clientHeight + 40) { cuoiShown = true; $('cuoi').classList.add('hien'); } }, 9000);
    }
    t.classList.add('hien');
  }
  function tienDo(x) { const b = $('mo-thanh'); if (b) b.style.transform = 'scaleX(' + Math.max(0, Math.min(1, x)).toFixed(3) + ')'; }
  SN.chu = { cap, tienDo, namAt };

  // màn mở đầu
  function xong() {
    const mo = $('mo');
    mo.classList.add('san');
    const go = () => {
      mo.removeEventListener('pointerup', go);
      mo.classList.add('di');
      SN.phat();
      setTimeout(() => { mo.style.display = 'none'; }, 1600);
    };
    mo.addEventListener('pointerup', go);
    if (SN.Q.has('S')) { mo.style.display = 'none'; }
  }
  window.addEventListener('DOMContentLoaded', () => {
    $('lai').addEventListener('click', () => { location.href = location.pathname + (SN.Q.has('q') ? '?q=' + SN.Q.get('q') : ''); });
    $('ve').addEventListener('click', () => { location.href = '../'; });
    const boot = () => {
      if (!window.THREE) { setTimeout(boot, 50); return; }
      SN.nap(xong);
    };
    boot();
  });
  SN.fallback = function () {
    // không có đồ hoạ 3D (máy quá cũ, hoặc mất ngữ cảnh đồ hoạ): vẫn có nhạc, chữ dẫn chuyện, chữ cuối và thư trên nền tối
    document.body.classList.add('khong3d');
    const mo = $('mo');
    if (mo && mo.style.display !== 'none' && !mo.classList.contains('san')) {
      mo.classList.add('san');
      const go = () => { mo.removeEventListener('pointerup', go); mo.classList.add('di'); SN.phat(); setTimeout(() => { mo.style.display = 'none'; }, 1600); };
      mo.addEventListener('pointerup', go);
    }
    const tick = () => { try { cap(SN.clock(), true); } catch (e) { /* bỏ qua */ } requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
})();
