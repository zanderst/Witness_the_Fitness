// Offline support: serve the app from cache, refresh the cache in the background.
const CACHE = "wtf-v6";
const FILES = ["./", "index.html", "styles.css", "app.js", "templates.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(e.request).then((hit) => {
        const fresh = fetch(e.request)
          .then((res) => {
            if (res.ok && new URL(e.request.url).origin === location.origin) cache.put(e.request, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || fresh;
      })
    )
  );
});
