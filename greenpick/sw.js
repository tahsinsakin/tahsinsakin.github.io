var CACHE = "greenpick-pages-v2";
var CORE = ["./index.html","./app.css","./js/spatial.js","./js/catalog.js","./js/tax.js","./js/impact.js","./js/escrow.js","./js/vault.js","./js/geofence.js","./js/app.js"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(function (hit) {
    return hit || fetch(e.request).catch(function () { return caches.match("./index.html"); });
  }));
});
self.addEventListener("message", function (e) {
  var data = e.data || {};
  if (data.type !== "notify") return;
  var p = data.payload || {};
  self.registration.showNotification(p.title || "GreenPick", { body: p.body || "", tag: p.tag || "greenpick", renotify: true });
});
