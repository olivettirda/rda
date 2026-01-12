// 스티키 노트 서비스 워커
const CACHE_NAME = 'sticky-notes-v1';
const urlsToCache = [
  '/mobile.html',
  '/assets/icon.png',
  '/assets/pencil.png',
  '/assets/trashcan.png',
  '/assets/palette.png',
  '/assets/passed.png',
  '/assets/share.png',
  '/assets/folder.png',
  '/assets/pin.png',
  '/assets/manual.png'
];

// 설치 시 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 열림');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('캐시 실패:', err);
      })
  );
});

// 요청 가로채기
self.addEventListener('fetch', (event) => {
  // API 요청은 네트워크 우선
  if (event.request.url.includes('supabase')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시에서 반환
        if (response) {
          return response;
        }
        // 없으면 네트워크 요청
        return fetch(event.request);
      })
  );
});

// 활성화 시 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
