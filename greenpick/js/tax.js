(function (g) {
  var RATE = 0.04;
  function money(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function fmt(n) { return money(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL"; }
  function split(gross) {
    var grossAmt = money(gross), withhold = money(grossAmt * RATE);
    return { gross: grossAmt, rate: RATE, withhold: withhold, farmer: money(grossAmt - withhold) };
  }
  function labelMethod(method) { return method === "pickup" ? "Tarladan teslim" : method; }
  function receipt(order) {
    var tax = split(order.subtotal), lines = ["GREENPICK", "No " + order.id, new Date(order.at).toLocaleString("tr-TR"), ""];
    (order.items || []).forEach(function (it) { lines.push(it.qty + " x " + it.crop + " = " + fmt(it.qty * it.unit)); });
    lines.push("Toplam " + fmt(order.total), "Stopaj " + fmt(tax.withhold), "Simulasyon.");
    return lines.join("\n");
  }
  g.GPTax = { RATE: RATE, money: money, fmt: fmt, split: split, deliveryFee: function () { return 0; }, labelMethod: labelMethod, receipt: receipt };
})(window);
