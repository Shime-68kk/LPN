// Lưu chặng đã tới (lpn:bang2, chỉ trong máy): thoát ra rồi vào lại thì tiếp tục từ đầu chặng đó.
// Phim cuối bắt đầu thì xoá, để lần sau chơi lại từ đầu. Đánh dấu đã xem hết vào lpn:bang2xong.
(() => {
  const CK = { hall: 2, cauthang: 3, buctuong: 4, qua5: 5, dinhngoai: 5, cuatro: 6, thu: 7, khuon: 9 };
  const get = () => { try { return JSON.parse(localStorage.getItem('lpn:bang2') || '{}'); } catch (e) { return {}; } };
  const put = (o) => { try { localStorage.setItem('lpn:bang2', JSON.stringify(o)); } catch (e) { /* bỏ qua */ } };
  const go0 = go;
  go = function (name) { const n = CK[name]; if (n) { const s = get(); if (!(s.phong >= n)) put({ phong: n, at: Date.now() }); } return go0.apply(this, arguments); };
  const ket0 = startKet;
  startKet = function () { try { localStorage.removeItem('lpn:bang2'); localStorage.setItem('lpn:bang2xong', String(Date.now())); } catch (e) { /* bỏ qua */ } return ket0.apply(this, arguments); };
})();
