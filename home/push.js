// Thông báo đẩy: đăng ký service worker, xin quyền, lưu địa chỉ nhận của máy này lên Firebase
// (lpn/players/{ai}/push/{mã}) để tools/push.mjs gửi thông báo chương mới, skin mới, sự kiện mới.
// iPhone chỉ nhận được khi mở app từ biểu tượng ngoài màn hình chính (iOS 16.4 trở lên).
'use strict';
(() => {
  const DB = 'https://yeult-diary-default-rtdb.asia-southeast1.firebasedatabase.app/';
  // Khoá công khai VAPID; khoá bí mật chỉ nằm trên máy gửi (~/.config/lpn-push/vapid.json).
  const VAPID = 'BIL-ajE7FIJEbzbnMxi92I9Ov_kbwBCJFrmapYuaQc-rWIKgZOUBr5Zj1ZJNTP29KFtFjrCVNKTRII6C8KOGumU';
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const bytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const idOf = (s) => {
    let h = 0x811c9dc5;
    for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16);
  };
  if (ok) navigator.serviceWorker.register('../service-worker.js', { scope: '../' }).catch(() => {});

  // Lưu địa chỉ nhận dưới tên người đang dùng máy, và gỡ khỏi người kia (máy vừa đổi tài khoản).
  async function save(sub) {
    const S = window.Sync;
    if (!S || !S.who) return false;
    const j = sub.toJSON();
    const id = idOf(j.endpoint);
    const res = await fetch(DB + 'lpn/players/' + S.who + '/push/' + id + '.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys, at: Date.now() }),
    });
    for (const other of Object.keys(S.WHO)) {
      if (other !== S.who) fetch(DB + 'lpn/players/' + other + '/push/' + id + '.json', { method: 'DELETE' }).catch(() => {});
    }
    return res.ok;
  }
  async function subscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription())
      || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes(VAPID) }));
    return save(sub);
  }

  window.Push = {
    // install: iPhone mở trong Safari, cần mở từ màn hình chính; unsupported: máy không hỗ trợ.
    state() {
      if (!ok) return ios && !standalone ? 'install' : 'unsupported';
      if (Notification.permission === 'denied') return 'denied';
      return Notification.permission === 'granted' ? 'on' : 'off';
    },
    // Gọi ngay trong lúc chạm (iPhone chỉ cho xin quyền khi người dùng vừa chạm).
    async enable() {
      if (!ok) return this.state();
      const p = await Notification.requestPermission();
      if (p !== 'granted') return this.state();
      try { await subscribe(); } catch (e) { return 'error'; }
      return 'on';
    },
  };

  // Đã cho phép từ trước: mỗi lần mở lưu lại địa chỉ nhận (phòng máy đổi địa chỉ hay đổi tài khoản).
  if (ok && Notification.permission === 'granted') setTimeout(() => subscribe().catch(() => {}), 1500);
})();
