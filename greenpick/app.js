const KEY = "greenpick.iphone.v1";
const FENCE_M = 300;
const STOPAJ_UNREG = 0.02;

const FARMS = [
  { id: "golbasi", name: "Gölbaşı Bahçe", farmer: "Ayşe Kaya", phone: "+90 532 111 2233", address: "Karşıyaka Mah., Gölbaşı, Ankara", lat: 39.787, lng: 32.8041, taxRegistered: false },
  { id: "cubuk", name: "Çubuk Toprak", farmer: "Mehmet Demir", phone: "+90 533 444 5566", address: "Yukarı Çavundur, Çubuk, Ankara", lat: 40.2386, lng: 33.033, taxRegistered: true },
  { id: "kizilay", name: "Kızılay Pop-up Tezgah", farmer: "Elif Yılmaz", phone: "+90 535 777 8899", address: "Sakarya Cad., Kızılay, Ankara", lat: 39.9208, lng: 32.8541, taxRegistered: false }
];

const SEED_PRODUCTS = [
  { id: "p1", farmId: "golbasi", name: "Açık tarla çilek", desc: "Sabah hasadı. Soğuk zincir yok.", price: 95, stock: 40, cat: "Meyve" },
  { id: "p2", farmId: "golbasi", name: "Roka + semizotu", desc: "Kesilmiş yeşillik kasası.", price: 45, stock: 25, cat: "Yeşillik" },
  { id: "p3", farmId: "cubuk", name: "Yerli kuru fasulye", desc: "Çubuk ovası, küçük kasa.", price: 80, stock: 60, cat: "Baklagil" },
  { id: "p4", farmId: "cubuk", name: "Pembe sıra domates", desc: "İlaçsız hasat günü.", price: 38, stock: 90, cat: "Sebze" },
  { id: "p5", farmId: "kizilay", name: "Günlük maydanoz demeti", desc: "Kent içi 300 m denemesi için canlı tezgah.", price: 20, stock: 30, cat: "Yeşillik" }
];

function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) { try { return JSON.parse(raw); } catch (e) {} }
  return { role: "CUSTOMER", products: SEED_PRODUCTS.map((p) => Object.assign({}, p)), orders: [], notifs: [], fenceSeen: {}, harvestPhoto: "" };
}
let S = load();
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

function haversine(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(bLat - aLat);
  const dLng = toR(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function farmById(id) { return FARMS.find((f) => f.id === id); }
function productById(id) { return S.products.find((p) => p.id === id); }
function money(n) { return Number(n).toFixed(2) + " ₺"; }
function carbonKg(km) { const supermarket = Math.max(km, 8); return Number(((supermarket - km) * 0.12 + 0.35).toFixed(3)); }
function stopaj(farm, base) {
  const rate = farm.taxRegistered ? 0 : STOPAJ_UNREG;
  const tax = Math.round(base * rate * 100) / 100;
  return { rate: rate, tax: tax, net: Math.round((base - tax) * 100) / 100 };
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return (h % 1000) / 1000; }
function jitter(farm) { return { lat: farm.lat + (hash(farm.id) - 0.5) * 0.012, lng: farm.lng + (hash(farm.id + "x") - 0.5) * 0.012 }; }
async function shaHex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const $ = (id) => document.getElementById(id);
function show(id) {
  document.querySelectorAll("[data-screen]").forEach((el) => el.classList.add("hidden"));
  $(id).classList.remove("hidden");
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.go === id));
  window.scrollTo(0, 0);
}
function renderMarket() {
  $("market-list").innerHTML = S.products.filter((p) => p.stock > 0).map((p) => {
    const f = farmById(p.farmId);
    return '<article class="card"><span class="pill">vegan · ' + p.cat + '</span><div class="row"><strong>' + p.name + '</strong><span class="price">' + money(p.price) + '</span></div><p class="meta">' + f.name + ' · stok ' + p.stock + '</p><p class="meta">' + p.desc + '</p><button class="btn" onclick="openBuy(\'' + p.id + '\')">Al ve konumu aç</button></article>';
  }).join("");
}
function renderMap(origin) {
  const o = origin || { lat: 39.9334, lng: 32.8597 };
  $("map-frame").src = "https://www.openstreetmap.org/export/embed.html?bbox=" + (o.lng - 0.25) + "%2C" + (o.lat - 0.18) + "%2C" + (o.lng + 0.25) + "%2C" + (o.lat + 0.18) + "&layer=mapnik&marker=" + o.lat + "%2C" + o.lng;
  $("farm-cards").innerHTML = FARMS.map((f) => {
    const d = haversine(o.lat, o.lng, f.lat, f.lng) / 1000;
    const j = jitter(f);
    return '<article class="card"><div class="row"><strong>' + f.name + '</strong><span class="meta">≈ ' + d.toFixed(1) + ' km</span></div><p class="lock">Tam GPS kilitli (' + j.lat.toFixed(3) + ', ' + j.lng.toFixed(3) + ' kaydırılmış). Ödeme sonrası açılır.</p><p class="meta">' + S.products.filter((p) => p.farmId === f.id && p.stock > 0).length + ' ürün</p></article>';
  }).join("");
}
window.openBuy = function (pid) {
  const p = productById(pid);
  const f = farmById(p.farmId);
  $("buy-pid").value = pid;
  $("buy-title").textContent = p.name;
  $("buy-farm").textContent = f.name + (f.taxRegistered ? " · kayıtlı" : " · kayıtsız, %2 stopaj");
  $("buy-qty").value = 1;
  quoteBuy();
  show("screen-buy");
};
window.quoteBuy = function () {
  const p = productById($("buy-pid").value);
  if (!p) return;
  const f = farmById(p.farmId);
  const qty = Math.max(1, Number($("buy-qty").value || 1));
  const base = p.price * qty;
  const tax = stopaj(f, base);
  const km = Number($("buy-km").value || 12);
  const co2 = carbonKg(km);
  $("quote-box").innerHTML = '<div class="statgrid"><div class="stat"><span>Tutar</span><b>' + money(base) + '</b></div><div class="stat"><span>Stopaj</span><b>' + money(tax.tax) + '</b></div><div class="stat"><span>Çiftçi net</span><b>' + money(tax.net) + '</b></div><div class="stat"><span>Karbon</span><b>' + co2 + ' kg</b></div></div>';
};
window.payNow = async function () {
  const p = productById($("buy-pid").value);
  const f = farmById(p.farmId);
  const qty = Math.max(1, Number($("buy-qty").value || 1));
  if (qty > p.stock) { $("buy-msg").innerHTML = '<div class="err">Stok yetmiyor</div>'; return; }
  const pan = $("buy-pan").value.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(pan)) { $("buy-msg").innerHTML = '<div class="err">Kart numarası geçersiz</div>'; return; }
  if (pan.endsWith("3")) { $("buy-msg").innerHTML = '<div class="err">Simüle red: son hane 3</div>'; return; }
  const base = p.price * qty;
  const tax = stopaj(f, base);
  const km = Number($("buy-km").value || 12);
  const secret = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const order = { id: "gp" + Date.now().toString(36), productId: p.id, farmId: f.id, qty: qty, base: base, tax: tax.tax, net: tax.net, carbon: carbonKg(km), km: km, status: "PAID", nfcSecret: secret, unlocked: true, createdAt: new Date().toISOString() };
  p.stock -= qty;
  S.orders.unshift(order);
  save();
  $("buy-msg").innerHTML = '<div class="ok">Ödendi. Konum kilidi açıldı.<br><b>' + f.name + '</b><br>' + f.address + '<br>' + f.lat.toFixed(5) + ', ' + f.lng.toFixed(5) + '<br>Tel: ' + f.phone + '<br>NFC sır: <code>' + secret + '</code></div>';
  renderMarket();
  renderOrders();
};
function renderOrders() {
  if (!S.orders.length) { $("order-list").innerHTML = '<div class="card meta">Henüz sipariş yok.</div>'; return; }
  $("order-list").innerHTML = S.orders.map((o) => {
    const p = productById(o.productId) || { name: "ürün" };
    const f = farmById(o.farmId);
    const loc = o.unlocked ? (f.lat.toFixed(5) + ', ' + f.lng.toFixed(5) + ' · ' + f.phone) : 'konum kilitli';
    return '<article class="card"><span class="pill">' + o.status + '</span><div class="row"><strong>' + p.name + '</strong><span>' + money(o.base) + '</span></div><p class="meta">stopaj ' + money(o.tax) + ' · net ' + money(o.net) + '</p><p class="meta">karbon ' + o.carbon + ' kg · ' + o.km + ' km</p><p class="meta">' + loc + '</p><p class="meta">NFC: ' + o.nfcSecret + '</p></article>';
  }).join("");
}
window.useGps = function () {
  if (!navigator.geolocation) { $("geo-msg").textContent = "Konum yok"; return; }
  navigator.geolocation.getCurrentPosition(function (pos) {
    const o = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    S.lastGps = o; save(); renderMap(o); scanFence(o);
  }, function () { $("geo-msg").textContent = "Konum izni ver; HTTPS üzerinde çalışır."; }, { enableHighAccuracy: true, timeout: 12000 });
};
window.simulateNear = function () {
  const f = farmById("kizilay");
  const o = { lat: f.lat + 0.0008, lng: f.lng + 0.0004 };
  S.lastGps = o; save(); renderMap(o); scanFence(o);
};
function scanFence(o) {
  const hits = [];
  S.products.forEach((p) => {
    const f = farmById(p.farmId);
    const m = haversine(o.lat, o.lng, f.lat, f.lng);
    if (m <= FENCE_M && p.stock > 0) hits.push({ p: p, f: f, m: m });
  });
  let sent = 0;
  hits.forEach((h) => {
    if (S.fenceSeen[h.p.id]) return;
    S.fenceSeen[h.p.id] = true;
    S.notifs.unshift({ t: Date.now(), title: h.p.name + " hazır", body: h.f.name + " " + Math.round(h.m) + " m yakınında" });
    sent += 1;
  });
  save();
  $("geo-msg").innerHTML = hits.length
    ? ('<div class="ok">' + hits.length + ' ürün 300 m içinde. ' + sent + ' yeni bildirim.</div>' + hits.map((h) => '<p class="meta">' + h.p.name + ' · ' + Math.round(h.m) + ' m · ' + h.f.name + '</p>').join(""))
    : '<div class="lock">300 m içinde aktif hasat yok. Tezgahın yanındayım ile dene.</div>';
  renderNotifs();
  if (sent && "Notification" in window && Notification.permission === "granted") {
    new Notification(S.notifs[0].title, { body: S.notifs[0].body });
  }
}
function renderNotifs() {
  $("notif-list").innerHTML = S.notifs.slice(0, 8).map((n) => '<div class="card"><strong>' + n.title + '</strong><p class="meta">' + n.body + '</p></div>').join("") || '<p class="meta">Bildirim yok.</p>';
}
window.askPush = function () { if ("Notification" in window) Notification.requestPermission(); };
window.setRole = function (role) { S.role = role; save(); $("role-label").textContent = role === "FARMER" ? "Çiftçi" : "Alıcı"; };
window.publishHarvest = function () {
  const name = $("h-name").value.trim();
  const price = Number($("h-price").value);
  const stock = Number($("h-stock").value);
  if (name.length < 2 || !(price > 0) || !(stock >= 0)) { $("h-msg").innerHTML = '<div class="err">Ad, fiyat ve stok gerekli</div>'; return; }
  S.products.unshift({ id: "u" + Date.now().toString(36), farmId: "golbasi", name: name, desc: $("h-desc").value || "Bugünkü hasat", price: price, stock: stock, cat: $("h-cat").value, photo: S.harvestPhoto || "" });
  save();
  $("h-msg").innerHTML = '<div class="ok">Tezgaha düştü. 300 m içindeki alıcıya bildirim gidebilir.</div>';
  renderMarket();
};
window.onPhoto = function (input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () { S.harvestPhoto = reader.result; save(); $("h-preview").src = reader.result; $("h-preview").classList.remove("hidden"); };
  reader.readAsDataURL(file);
};
window.nfcTap = async function () {
  const orderId = $("nfc-order").value.trim();
  const secret = $("nfc-secret").value.trim();
  const o = S.orders.find((x) => x.id === orderId);
  if (!o) { $("nfc-msg").innerHTML = '<div class="err">Sipariş bulunamadı</div>'; return; }
  if (o.nfcSecret !== secret) { $("nfc-msg").innerHTML = '<div class="err">NFC sır eşleşmedi</div>'; return; }
  const mac = (await shaHex(secret + "." + orderId)).slice(0, 16);
  o.status = "COMPLETED"; o.nfcMac = mac; save();
  $("nfc-msg").innerHTML = '<div class="ok">HMAC ' + mac + ' doğrulandı. Sipariş COMPLETED.</div>';
  renderOrders();
};
window.resetDemo = function () { localStorage.removeItem(KEY); S = load(); boot(); };
function boot() {
  $("role-label").textContent = S.role === "FARMER" ? "Çiftçi" : "Alıcı";
  renderMarket(); renderMap(S.lastGps); renderOrders(); renderNotifs();
  if (S.harvestPhoto) { $("h-preview").src = S.harvestPhoto; $("h-preview").classList.remove("hidden"); }
  show("screen-home");
}
document.querySelectorAll(".tabs button").forEach((b) => { b.addEventListener("click", function () { show(b.dataset.go); }); });
if ("serviceWorker" in navigator) { navigator.serviceWorker.register("./sw.js"); }
boot();
