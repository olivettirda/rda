// 스티키 노트 서비스 워커
const CACHE_NAME = 'sticky-notes-v15';
const urlsToCache = [
  './stickynote.html',
  './assets/icon.png',
  '../files/icon/ssal/pencil.png',
  '../files/icon/ssal/trashcan.png',
  '../files/icon/ssal/palette.png',
  '../files/icon/ssal/passed.png',
  '../files/icon/ssal/share.png',
  '../files/icon/ssal/folder.png',
  '../files/icon/ssal/pin.png',
  '../files/icon/ssal/manual.png'
];

// 설치 시 캐시 (즉시 활성화)
self.addEventListener('install', (event) => {
  console.log('[SW] 설치 중... 버전:', CACHE_NAME);
  // 즉시 활성화
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] 캐시 열림');
        // 각 리소스를 개별적으로 캐시 (404 에러가 있어도 다른 리소스는 캐시됨)
        const cachePromises = urlsToCache.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log('[SW] 캐시 성공:', url);
            } else {
              console.log('[SW] 캐시 건너뜀 (404):', url);
            }
          } catch (err) {
            console.log('[SW] 캐시 실패:', url, err);
          }
        });
        return Promise.all(cachePromises);
      })
      .catch((err) => {
        console.log('[SW] 캐시 오픈 실패:', err);
      })
  );
});

// 요청 가로채기 (네트워크 우선 전략)
self.addEventListener('fetch', (event) => {
  // API 요청은 네트워크 우선
  if (event.request.url.includes('supabase') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML 파일은 네트워크 우선, 실패/404 시 캐시 폴백
  if (event.request.url.includes('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 200 OK 응답만 캐시에 저장 (404 등 에러 응답은 캐시하지 않음)
          if (response.ok) {
            console.log('[SW] HTML 네트워크 성공, 캐시 업데이트:', event.request.url);
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return response;
          }
          // 404 등 에러 응답이면 캐시에서 반환 시도
          console.log('[SW] HTML 네트워크 응답 에러 (status:', response.status, '), 캐시 폴백 시도:', event.request.url);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] 캐시에서 HTML 반환 성공:', event.request.url);
              return cachedResponse;
            }
            // 캐시에도 없으면 원래 에러 응답 반환
            console.log('[SW] 캐시에도 없음, 에러 응답 그대로 반환:', event.request.url);
            return response;
          });
        })
        .catch(() => {
          // 네트워크 완전 실패 시 캐시에서 반환
          console.log('[SW] HTML 네트워크 실패, 캐시 폴백:', event.request.url);
          return caches.match(event.request);
        })
    );
    return;
  }

  // 나머지는 캐시 우선
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

// 활성화 시 오래된 캐시 삭제 (즉시 제어)
self.addEventListener('activate', (event) => {
  console.log('[SW] 활성화 중... 버전:', CACHE_NAME);
  // 즉시 클라이언트 제어
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] 오래된 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
  console.log('[SW] 활성화 완료, 모든 클라이언트 제어 시작');
});

// 메시지 수신 (SKIP_WAITING 처리)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING 메시지 수신, 즉시 활성화');
    self.skipWaiting();
  }
});
