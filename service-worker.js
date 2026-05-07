const CACHE_NAME = "target-grind-v2";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./js/main.js",
  "./js/storage.js",
  "./js/countdown.js",
  "./js/tasks.js",
  "./js/streak.js",
  "./js/ui.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

function isCoreAssetRequest(requestUrl) {
  return requestUrl.origin === self.location.origin
    && (requestUrl.pathname.endsWith(".js")
      || requestUrl.pathname.endsWith(".css")
      || requestUrl.pathname.endsWith(".html")
      || requestUrl.pathname.endsWith(".json")
      || requestUrl.pathname === "/"
      || requestUrl.pathname.endsWith("/"));
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request, { cache: "no-store" });
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request) || await caches.match(request);
    if (cached) {
      return cached;
    }

    if (request.mode === "navigate") {
      return caches.match("./index.html");
    }

    throw new Error("Network and cache both unavailable");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const networkResponse = await fetch(request);
  if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
    return networkResponse;
  }

  const cache = await caches.open(CACHE_NAME);
  cache.put(request, networkResponse.clone());
  return networkResponse;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate" || isCoreAssetRequest(requestUrl)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
