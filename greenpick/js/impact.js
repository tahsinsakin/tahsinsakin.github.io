(function (g) {
  var RETAIL = {"Cilek":1.4,"Yaban mersini":1.6,"Domates":1.1,"Visne":0.9,"Havuc":0.4,"Uzum":0.8,"Elma":0.5,"Ceviz":0.7,"Bugday":0.6};
  function factor(crop) { return RETAIL[crop] != null ? RETAIL[crop] : 0.8; }
  function line(crop, qty) {
    var q = Number(qty) || 0;
    return { crop: crop, qty: q, kgCo2e: Math.round(Math.max(0, (factor(crop) - 0.04) * q) * 1000) / 1000, plasticG: Math.round(18 * q) };
  }
  function order(items) {
    var rows = (items || []).map(function (it) { return line(it.crop || it.title, it.qty); });
    return { rows: rows, kgCo2e: Math.round(rows.reduce(function (n, r) { return n + r.kgCo2e; }, 0) * 1000) / 1000, plasticG: rows.reduce(function (n, r) { return n + r.plasticG; }, 0) };
  }
  function lifetime(orders) {
    return (orders || []).reduce(function (acc, o) {
      var i = o.impact || order(o.items || []);
      acc.kgCo2e += i.kgCo2e; acc.plasticG += i.plasticG; acc.picks += 1; return acc;
    }, { kgCo2e: 0, plasticG: 0, picks: 0 });
  }
  function fmtKg(n) {
    if (n < 1) return Math.round(n * 1000) + " g CO2e";
    return n.toFixed(n < 10 ? 2 : 1) + " kg CO2e";
  }
  g.GPImpact = { line: line, order: order, lifetime: lifetime, fmtKg: fmtKg };
})(window);
