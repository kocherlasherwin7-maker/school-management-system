/**
 * Service Worker for St.Gaspar Vidyalaya - PWA
 * Provides offline caching and app-like experience
 * Compatible with GitHub Pages deployment
 */

const CACHE_NAME = 'sgv-cache-v3';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/school-logo.jpeg',
    './css/style.css',
    './js/utils/storage.js',
    './js/utils/security.js',
    './js/utils/validation.js',
    './js/modules/auth.js',
    './js/modules/dashboard.js',
    './js/modules/students.js',
    './js/modules/teachers.js',
    './js/modules/classes.js',
    './js/modules/attendance.js',
    './js/modules/grades.js',
    './js/modules/timetable.js',
    './js/modules/assignments.js',
    './js/modules/announcements.js',
    './js/modules/fees.js',
    './js/modules/library.js',
    './js/modules/student-portal.js',
    './js/modules/parent-portal.js',
    './js/app.js'
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
    // Handle all requests (relative paths now)

    // Handle navigation requests - serve index.html for SPA routing
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match('./index.html')
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
                        if (event.request.headers.get('Accept') && event.request.headers.get('Accept').includes('text/html')) {
                            return caches.match('./index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});