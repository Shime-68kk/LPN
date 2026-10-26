// Service worker của app (phạm vi cả trang, đăng ký từ home/ và story/ qua home/push.js).
// Chỉ làm một việc: nhận thông báo đẩy (chương mới, sự kiện mới) và chạm vào thì mở đúng trang.
// Không giữ bộ nhớ đệm nào: trang luôn tải bản mới từ mạng. Bộ nhớ đệm của bản cũ (web cũ) được xoá.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Nội dung gửi từ tools/push.mjs: { title, body, url, tag }.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Yêu Lệ Thủy', {
    body: data.body || '',
    icon: new URL('assets/img/icon-192.png', self.registration.scope).href,
    tag: data.tag || undefined,
    data: { url: data.url || 'home/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || 'home/', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('navigate' in c) return c.focus().then(() => c.navigate(url));
      }
      return self.clients.openWindow(url);
    })
  );
});
