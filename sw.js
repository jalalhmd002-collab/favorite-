/* ==========================================================================
   sw.js - Service Worker لتطبيق الويب التقدمي (PWA)
   روابطي المفضلة - كاش وتصفح دون اتصال
   ========================================================================== */

const CACHE_NAME = 'my-favorites-pwa-v4';

// الملفات الأساسية للتخزين المؤقت المسبق
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './cloud.js',
  './forms.js',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-app.svg',
  './icon.svg'
];

// تثبيت الـ Service Worker وتخزين الملفات مسبقاً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// تنشيط الـ Service Worker وحذف النسخ القديمة من الكاش
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

// التعامل مع طلبات الشبكة
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // التعامل فقط مع طلبات GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // استثناء روابط المزامنة مع Google Apps Script من التخزين المؤقت
  if (url.hostname.includes('script.google.com') || url.hostname.includes('script.googleusercontent.com')) {
    return;
  }

  // استراتيجية طلبات التنقل بين الصفحات (Navigation Requests): الشبكة أولاً مع الاحتياط للكاش
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }

  // استراتيجية الملفات المحلية (Same-origin assets): الكاش أولاً ثم الشبكة مع التحديث في الخلفية (Stale-While-Revalidate)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => {
          // في حال انقطاع الشبكة يتم الاعتماد على الكاش
        });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // استراتيجية الملفات الخارجية مثل خطوط Google ومكتبة Tailwind CDN
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('cdn.tailwindcss.com') ||
      url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => {
          // تجاهل الخطأ إن تعذر الاتصال
        });
      })
    );
    return;
  }

  // باقي الطلبات تمر بشكل طبيعي
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request);
    })
  );
});
