(function (g) {
  var KEY = "greenpick-v2";
  function blank() {
    return {
      role: "buy",
      me: { name: "", city: "Ankara", district: "", lat: null, lng: null },
      farm: { name: "", district: "", city: "Ankara", lat: null, lng: null, about: "" },
      listings: [], cart: [], orders: [], reviews: [], alerts: [],
      fenceSeen: {}, unlocked: {}, notifyOn: false, watchOn: false,
      consent: { gdpr: false, location: false, notify: false, at: null }
    };
  }
  function load() {
    var raw = localStorage.getItem(KEY);
    if (!raw) return seed(blank());
    try {
      var data = Object.assign(blank(), JSON.parse(raw));
      data.consent = Object.assign(blank().consent, data.consent || {});
      if (!data.listings || !data.listings.length) data = seed(data);
      return data;
    } catch (e) { return seed(blank()); }
  }
  function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
  function uid(prefix) { return (prefix || "id") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  function seed(state) {
    if (state.listings && state.listings.length) return state;
    state.listings = g.GPCatalog ? g.GPCatalog.listings() : [];
    if (!state.reviews.length && g.GPCatalog && g.GPCatalog.reviews) state.reviews = g.GPCatalog.reviews();
    return state;
  }
  function reset() { localStorage.removeItem(KEY); return load(); }
  function exportJson(state) { return JSON.stringify(state, null, 2); }
  g.GPVault = { KEY: KEY, blank: blank, load: load, save: save, uid: uid, seed: seed, reset: reset, exportJson: exportJson };
})(window);
