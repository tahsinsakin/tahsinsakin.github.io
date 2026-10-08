const CACHE = "greenpick-iphone-v17";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./img/strawberries.jpg",
  "./img/strawberries-2.jpg",
  "./img/tomatoes.jpg",
  "./img/greens.jpg",
  "./img/parsley.jpg",
  "./img/beans.jpg",
  "./img/leaf-plate.jpg",
  "./img/stall-day.jpg",
  "./img/stall-city.jpg",
  "./img/farm-sunrise.jpg",
  "./img/farm-anatolia.jpg",
  "./img/eu-flag.jpg",
  "./img/dossier-plate.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const live = /index\.html|styles\.css|app\.js|manifest|icon\.svg/.test(url.pathname)
    || url.pathname.endsWith("/greenpick/")
    || url.pathname.endsWith("/greenpick");
  if (live) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return res;
    }).catch(() => caches.match(event.request)))
  );
});
