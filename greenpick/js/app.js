(function () {
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/tahsinsakin/greenpick@b2a81118c8e0d048bde124005aae8ed272a62015/js/app.js";
  s.onerror = function () {
    var el = document.getElementById("app");
    if (el) el.textContent = "GreenPick UI yuklenemedi.";
  };
  document.body.appendChild(s);
})();
