(function (g) {
  function fuzz(lat, lng, listingId) {
    var h = 0, s = String(listingId || ""), i;
    for (i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    return { lat: lat + ((h % 200) - 100) / 12000, lng: lng + (((h / 200) % 200) - 100) / 12000 };
  }
  function paidFor(state, listingId) {
    if (state.unlocked && state.unlocked[listingId]) return true;
    return (state.orders || []).some(function (o) {
      return o.paid && (o.items || []).some(function (it) { return it.listingId === listingId; });
    });
  }
  function unlockOrder(state, items) {
    state.unlocked = state.unlocked || {};
    (items || []).forEach(function (it) { if (it.listingId) state.unlocked[it.listingId] = true; });
  }
  function publicPoint(state, listing) {
    if (paidFor(state, listing.id)) return { lat: listing.lat, lng: listing.lng, exact: true };
    return Object.assign(fuzz(listing.lat, listing.lng, listing.id), { exact: false });
  }
  function veganOk(crop) {
    var ban = ["bal", "peynir", "sut", "yogurt", "yumurta", "et", "tavuk", "balik", "honey", "cheese", "milk", "egg"];
    var c = String(crop || "").toLocaleLowerCase("tr");
    return !ban.some(function (b) { return c.indexOf(b) !== -1; });
  }
  g.GPEscrow = { fuzz: fuzz, paidFor: paidFor, unlockOrder: unlockOrder, publicPoint: publicPoint, veganOk: veganOk };
})(window);
