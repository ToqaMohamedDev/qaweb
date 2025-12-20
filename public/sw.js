// Empty service worker to prevent 404 errors
// This file prevents browsers from showing 404 errors when looking for service workers

self.addEventListener('install', () => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // Take control of all pages immediately
  self.clients.claim();
});

