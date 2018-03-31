var curentCacheName = 'restCache';
var versionCacheName = curentCacheName + '-v1';
var myArr = [
  '/',
  '/css/styles.css',
  '/data/restaurants.json',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/js/dbhelper.js',
   '/img/'
];
/* install service worker */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(versionCacheName).then((cache) => {
      return cache.addAll(myArr).then(() => self.skipWaiting());
    })
  );
});

/* fetch resource */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((respSrv) => {
      return respSrv || fetch(event.request).then((response) => {
        return caches.open(versionCacheName).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        })
      });
    }).catch(() => {
      console.log('Failure fetching. Sorry.......');
    })
  );
});

/* remove old cache */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNume) => {
      return Promise.all(cacheNume.filter((cacheName) => {
        return cacheName.startsWith(curentCacheName) && cacheName != versionCacheName;
      }).map((cacheName) => {
        return caches.delete(cacheName);
      })
      );
    })
  );
});