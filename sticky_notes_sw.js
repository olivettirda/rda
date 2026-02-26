// 스티키 노트 Service Worker
const CACHE_NAME = 'sticky-notes-v2';
const OFFLINE_URL = 'sticky_notes.html';

// 캐시할 파일들
const CACHE_FILES = [
    './sticky_notes.html',
    './sticky_notes_manifest.json',
    './ssallogo.png',
    'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
    console.log('[SW] 설치 중...');
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('[SW] 캐시 저장 중...');
                // 각 리소스를 개별적으로 캐시 (하나가 실패해도 나머지는 캐시됨)
                const cachePromises = CACHE_FILES.map(async (url) => {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                            console.log('[SW] 캐시 성공:', url);
                        } else {
                            console.log('[SW] 캐시 건너뜀 (status:', response.status, '):', url);
                        }
                    } catch (err) {
                        console.log('[SW] 캐시 실패:', url, err);
                    }
                });
                return Promise.all(cachePromises);
            })
            .then(() => {
                console.log('[SW] 설치 완료');
            })
            .catch((error) => {
                console.error('[SW] 캐시 저장 실패:', error);
            })
    );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
    console.log('[SW] 활성화 중...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] 이전 캐시 삭제:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] 활성화 완료');
                return self.clients.claim();
            })
    );
});

// Fetch 이벤트
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API 요청은 네트워크 우선
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    console.log('[SW] API 오프라인 - 캐시된 응답 없음');
                    return new Response(
                        JSON.stringify({ error: 'offline' }),
                        {
                            status: 503,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
        return;
    }

    // HTML 요청은 네트워크 우선, 404 시 캐시 폴백
    if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        // 200 OK만 캐시에 저장
                        console.log('[SW] HTML 네트워크 성공, 캐시 업데이트:', request.url);
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                        return response;
                    }
                    // 404 등 에러 응답이면 캐시에서 반환 시도
                    console.log('[SW] HTML 에러 응답 (status:', response.status, '), 캐시 폴백 시도:', request.url);
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            console.log('[SW] 캐시에서 HTML 반환 성공:', request.url);
                            return cachedResponse;
                        }
                        return caches.match(OFFLINE_URL).then((offlineResponse) => {
                            return offlineResponse || response;
                        });
                    });
                })
                .catch(() => {
                    console.log('[SW] HTML 네트워크 실패, 캐시 폴백:', request.url);
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // 그 외 요청은 캐시 우선, 네트워크 폴백
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] 캐시에서 반환:', request.url);
                    return cachedResponse;
                }

                console.log('[SW] 네트워크 요청:', request.url);
                return fetch(request)
                    .then((response) => {
                        // 유효한 응답인 경우 캐시에 저장
                        if (response && response.status === 200 && response.type === 'basic') {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        console.log('[SW] 네트워크 실패:', request.url);
                        return new Response('오프라인 상태입니다', { status: 503 });
                    });
            })
    );
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
    console.log('[SW] 백그라운드 동기화:', event.tag);

    if (event.tag === 'sync-notes') {
        event.waitUntil(
            // 오프라인 상태에서 저장된 변경사항 동기화
            syncOfflineChanges()
        );
    }
});

// 푸시 알림
self.addEventListener('push', (event) => {
    console.log('[SW] 푸시 알림 수신');

    const options = {
        body: event.data ? event.data.text() : '새로운 알림이 있습니다',
        icon: './ssallogo.png',
        badge: './ssallogo.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('스티키 노트', options)
    );
});

// 오프라인 변경사항 동기화 함수
async function syncOfflineChanges() {
    try {
        // IndexedDB에서 오프라인 변경사항 가져오기
        const offlineChanges = await getOfflineChanges();

        if (offlineChanges && offlineChanges.length > 0) {
            console.log('[SW] 오프라인 변경사항 동기화:', offlineChanges.length);

            // 각 변경사항을 서버에 전송
            for (const change of offlineChanges) {
                await sendChangeToServer(change);
            }

            // 동기화 완료 후 오프라인 데이터 삭제
            await clearOfflineChanges();
        }
    } catch (error) {
        console.error('[SW] 동기화 실패:', error);
    }
}

// 오프라인 변경사항 가져오기 (placeholder)
async function getOfflineChanges() {
    // 실제 구현에서는 IndexedDB 사용
    return [];
}

// 서버로 변경사항 전송 (placeholder)
async function sendChangeToServer(change) {
    // 실제 구현에서는 Supabase API 호출
    console.log('[SW] 변경사항 전송:', change);
}

// 오프라인 변경사항 삭제 (placeholder)
async function clearOfflineChanges() {
    // 실제 구현에서는 IndexedDB 데이터 삭제
    console.log('[SW] 오프라인 데이터 삭제 완료');
}

console.log('[SW] Service Worker 로드 완료');
