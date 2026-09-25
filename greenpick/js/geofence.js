(function (g) {
  var watchId = null, lastFix = null, COOL_MS = 30 * 60 * 1000;
  function askNotify() {
    if (!g.Notification) return Promise.resolve("denied");
    if (Notification.permission === "granted") return Promise.resolve("granted");
    return Notification.requestPermission();
  }
  function postAlert(title, body, tag) {
    var payload = { title: title, body: body, tag: tag || "greenpick" };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "notify", payload: payload });
      return;
    }
    if (g.Notification && Notification.permission === "granted") {
      try { new Notification(title, { body: body, tag: tag }); } catch (e) {}
    }
  }
  function evaluate(state, lat, lng) {
    var hits = g.GPSpatial.near(state.listings, lat, lng, g.GPSpatial.FENCE), now = Date.now(), i, hit, L;
    for (i = 0; i < hits.length; i++) {
      hit = hits[i]; L = hit.listing;
      if (now - (state.fenceSeen[L.id] || 0) < COOL_MS) continue;
      state.fenceSeen[L.id] = now;
      state.alerts.unshift({ id: g.GPVault.uid("al"), listingId: L.id, title: L.title, farm: L.farm, crop: L.crop, metres: Math.round(hit.metres), at: new Date().toISOString() });
      if (state.alerts.length > 40) state.alerts.length = 40;
      if (state.notifyOn && state.consent && state.consent.notify) {
        postAlert(L.crop + " — " + Math.round(hit.metres) + " m", "Fresh " + L.crop + " are ready to be picked " + Math.round(hit.metres) + " meters away from you!", L.id);
      }
    }
    return hits;
  }
  function start(state, onChange, onErr) {
    if (!state.consent || !state.consent.location) { if (onErr) onErr(new Error("Konum rizasi yok.")); return; }
    if (!navigator.geolocation) { if (onErr) onErr(new Error("Konum yok.")); return; }
    stop(); state.watchOn = true;
    watchId = navigator.geolocation.watchPosition(function (pos) {
      var lat = pos.coords.latitude, lng = pos.coords.longitude;
      if (lastFix && g.GPSpatial.haversine(lastFix.lat, lastFix.lng, lat, lng) < 25) return;
      lastFix = { lat: lat, lng: lng };
      state.me.lat = lat; state.me.lng = lng;
      evaluate(state, lat, lng); g.GPVault.save(state);
      if (onChange) onChange(state);
    }, function (err) { if (onErr) onErr(err); }, { enableHighAccuracy: false, maximumAge: 15000, timeout: 20000 });
  }
  function stop() {
    if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  function oneShot(ok, err) {
    if (!navigator.geolocation) { if (err) err(new Error("konum yok")); return; }
    navigator.geolocation.getCurrentPosition(ok, err, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
  }
  g.GPFence = { start: start, stop: stop, evaluate: evaluate, askNotify: askNotify, oneShot: oneShot };
})(window);
