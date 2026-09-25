(function (g) {
  var EARTH = 6371000, FENCE = 300;
  function toRad(d) { return d * Math.PI / 180; }
  function haversine(aLat, aLng, bLat, bLng) {
    var dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
    var s = Math.sin(dLat / 2), t = Math.sin(dLng / 2);
    var h = s * s + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * t * t;
    return 2 * EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function cellSizeDeg(lat, metres) {
    var m = metres || FENCE;
    return { lat: m / 111320, lng: m / (111320 * Math.max(0.2, Math.cos(toRad(lat)))) };
  }
  function cellKey(lat, lng, metres) {
    var s = cellSizeDeg(lat, metres);
    return Math.floor(lat / s.lat) + ":" + Math.floor(lng / s.lng);
  }
  function neighbourKeys(lat, lng, metres) {
    var s = cellSizeDeg(lat, metres);
    var i = Math.floor(lat / s.lat), j = Math.floor(lng / s.lng), out = [], di, dj;
    for (di = -1; di <= 1; di++) for (dj = -1; dj <= 1; dj++) out.push((i + di) + ":" + (j + dj));
    return out;
  }
  function buildIndex(listings, metres) {
    var map = Object.create(null), i, L, key;
    for (i = 0; i < listings.length; i++) {
      L = listings[i];
      if (!L || L.active === false || typeof L.lat !== "number") continue;
      key = cellKey(L.lat, L.lng, metres);
      if (!map[key]) map[key] = [];
      map[key].push(L);
    }
    return map;
  }
  function near(listings, lat, lng, radius, index) {
    var r = radius == null ? FENCE : radius, keys = neighbourKeys(lat, lng, r), seen = Object.create(null), hits = [], k, bucket, i, L, d;
    var use = index || buildIndex(listings, r);
    for (k = 0; k < keys.length; k++) {
      bucket = use[keys[k]]; if (!bucket) continue;
      for (i = 0; i < bucket.length; i++) {
        L = bucket[i]; if (seen[L.id]) continue; seen[L.id] = 1;
        d = haversine(lat, lng, L.lat, L.lng);
        if (d <= r) hits.push({ listing: L, metres: d });
      }
    }
    hits.sort(function (a, b) { return a.metres - b.metres; });
    return hits;
  }
  function attachDistance(listings, lat, lng) {
    return listings.map(function (L) {
      var copy = Object.assign({}, L);
      copy.metres = (typeof lat === "number" && typeof lng === "number") ? haversine(lat, lng, L.lat, L.lng) : null;
      return copy;
    }).sort(function (a, b) {
      if (a.metres == null && b.metres == null) return 0;
      if (a.metres == null) return 1;
      if (b.metres == null) return -1;
      return a.metres - b.metres;
    });
  }
  function fmtMetres(m) {
    if (m == null || !isFinite(m)) return "-";
    if (m < 1000) return Math.round(m) + " m";
    return (m / 1000).toFixed(m < 10000 ? 1 : 0) + " km";
  }
  g.GPSpatial = { FENCE: FENCE, haversine: haversine, cellKey: cellKey, buildIndex: buildIndex, near: near, attachDistance: attachDistance, fmtMetres: fmtMetres };
})(window);
