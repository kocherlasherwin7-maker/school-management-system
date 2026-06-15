/**
 * Service Worker for St.Gaspar Vidyalaya - PWA
 * Provides offline caching and app-like experience
 * Compatible with GitHub Pages deployment
 */

const CACHE_NAME = 'sgv-cache-v1';
const STATIC_ASSETS = [
    '/school-management-system/',
    '/school-management-system/index.html',
    '/school-management-system/manifest.json',
    '/school-management-system/icons/icon-192.png',
    '/school-management-system/icons/icon-512.png',
    '/school-management-system/icons/school-logo.jpeg',
    '/school-management-system/css/style.css',
    '/school-management-system/js/utils/storage.js',
    '/school-management-system/js/utils/security.js',
    '/school-management-system/js/utils/validation.js',
    '/school-management-system/js/modules/auth.js',
    '/school-management-system/js/modules/dashboard.js',
    '/school-management-system/js/modules/students.js',
    '/school-management-system/js/modules/teachers.js',
    '/school-management-system/js/modules/classes.js',
    '/school-management-system/js/modules/attendance.js',
    '/school-management-system/js/modules/grades.js',
    '/school-management-system/js/modules/timetable.js',
    '/school-management-system/js/modules/assignments.js',
    '/school-management-system/js/modules/announcements.js',
    '/school-management-system/js/modules/fees.js',
    '/school-management-system/js/modules/library.js',
    '/school-management-system/js/modules/student-portal.js',
    '/school-management-system/js/modules/parent-portal.js',
    '/school-management-system/js/app.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => {
                console.error('SW install cache failed:', err);
                // Still activate even if caching fails
                self.skipWaiting();
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - Network-first, cache-fallback strategy
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Only handle requests within our scope
    if (!event.request.url.includes('/school-management-system/')) return;

    // Handle navigation requests - serve index.html for SPA routing
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match('/school-management-system/index.html')
                        .then(cached => {
                            if (cached) return cached;
                            return new Response('Offline', { status: 503 });
                        });
                })
        );
        return;
    }

    // For static assets - cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request)
                    .then((response) => {
                        // Cache successful responses
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, clone);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // If it's an HTML navigation, return index.html
                        if (event.request.headers.get('Accept').includes('text/html')) {
                            return caches.match('/school-management-system/index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});