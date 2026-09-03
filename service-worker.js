// Service Worker for Yêu Lệ Thủy (LPN) PWA
const CACHE_NAME = 'lpn-cache-v39.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style/style.css',
  './style/script.js',
  './style/gift/games.js',
  './style/pop.mp3',
  './style/letter.txt',
  './style/img/logoweb.jpeg',
  './style/img/Anhnen.JPG',
  './style/img/icon-192.png',
  './style/img/icon-512.png',
  './style/img/apple-touch-icon.png'
];

// Install: Cache critical core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Some precache assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Remove stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy:
// 1. Bypass Firebase, Discord & External APIs (Network Only)
// 2. Network-First with Cache Fallback for HTML/CSS/JS (Always fresh updates)
// 3. Cache-First for static media (Images, Sound, Icons)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external APIs & Firebase database & Discord
  if (
    requestUrl.origin !== location.origin ||
    requestUrl.href.includes('firebasedatabase.app') ||
    requestUrl.href.includes('discord.com') ||
    requestUrl.href.includes('emailjs.com')
  ) {
    return;
  }

  // Static media (images, audio, fonts): Cache-First
  const isMedia = /\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|woff2?|ttf)$/i.test(requestUrl.pathname);
  if (isMedia) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // App core (HTML, JS, CSS): Network-First with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Fallback to index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
