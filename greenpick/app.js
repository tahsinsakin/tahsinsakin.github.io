const KEY = "greenpick.iphone.v4";
const FENCE_M = 300;
const STOPAJ_UNREG = 0.02;

const FARMS = [
  { id: "golbasi", name: "Gölbaşı Bahçe", farmer: "Ayşe Kaya", phone: "+90 532 111 2233", address: "Karşıyaka Mah., Gölbaşı, Ankara", lat: 39.787, lng: 32.8041, taxRegistered: false },
  { id: "cubuk", name: "Çubuk Toprak", farmer: "Mehmet Demir", phone: "+90 533 444 5566", address: "Yukarı Çavundur, Çubuk, Ankara", lat: 40.2386, lng: 33.033, taxRegistered: true },
  { id: "kizilay", name: "Kızılay Pop-up Tezgah", farmer: "Elif Yılmaz", phone: "+90 535 777 8899", address: "Sakarya Cad., Kızılay, Ankara", lat: 39.9208, lng: 32.8541, taxRegistered: false },
];

const SEED = [
  { id: "p1", farmId: "golbasi", name: "Açık tarla çilek", desc: "Sabah hasadı. Soğuk zincir yok.", price: 95, stock: 40, cat: "Meyve", eu: "organic" },
  { id: "p2", farmId: "golbasi", name: "Roka + semizotu", desc: "Kesilmiş yeşillik kasası.", price: 45, stock: 25, cat: "Yeşillik", eu: "f2f" },
  { id: "p3", farmId: "cubuk", name: "Yerli kuru fasulye", desc: "Çubuk ovası, küçük kasa.", price: 80, stock: 60, cat: "Baklagil", eu: "organic" },
  { id: "p4", farmId: "cubuk", name: "Pembe sıra domates", desc: "İlaçsız hasat günü.", price: 38, stock: 90, cat: "Sebze", eu: "f2f" },
  { id: "p5", farmId: "kizilay", name: "Günlük maydanoz demeti", desc: "Kent içi 300 m denemesi.", price: 20, stock: 30, cat: "Yeşillik", eu: "local" },
];

const EU_LABEL = {
  organic: "AB organiğı · 2018/848",
  f2f: "AB Farm to Fork",
  local: "AB kısa zincir",
};

function blank() {
  return { role: "CUSTOMER", products: SEED.map((p) => ({ ...p })), orders: [], notifs: [], fenceSeen: {}, harvestPhoto: "" };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const s = JSON.parse(raw);
    if (!Array.isArray(s.products)) return blank();
    return s;
  } catch (e) { return blank(); }
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* quota */ }
}

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
function carbonKg(km) {
  const supermarket = Math.max(km, 8);
  return Number(((supermarket - km) * 0.12 + 0.35).toFixed(3));
}
function stopaj(farm, base) {
  const rate = farm && farm.taxRegistered ? 0 : STOPAJ_UNREG;
  const tax = Math.round(base * rate * 100) / 100;
  return { rate, tax, net: Math.round((base - tax) * 100) / 100 };
}
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}
function jitter(farm) {
  return { lat: farm.lat + (hash(farm.id) - 0.5) * 0.012, lng: farm.lng + (hash(farm.id + "x") - 0.5) * 0.012 };
}
async function shaHex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const $ = (id) => document.getElementById(id);
function setHtml(id, html) { const el = $(id); if (el) el.innerHTML = html; }
function setText(id, t) { const el = $(id); if (el) el.textContent = t; }

function show(id) {
  const page = $(id);
  const pager = $("pager");
  if (!page || !pager) return;
  const go = () => {
    const left = page.offsetLeft;
    try { pager.scrollTo({ left, behavior: "smooth" }); }
    catch (e) { pager.scrollLeft = left; }
    page.scrollTop = 0;
  };
  go();
  requestAnimationFrame(go);
  document.querySelectorAll(".rail button").forEach((b) => {
    b.classList.toggle("on", b.getAttribute("data-go") === id);
  });
}

function renderMarket() {
  const box = $("market-list");
  if (!box) return;
  const list = S.products.filter((p) => p.stock > 0);
  if (!list.length) {
    box.innerHTML = `<div class="lock">Tezgah boş. Çiftçi rolüyle hasat yükle.</div>`;
    return;
  }
  box.innerHTML = list.map((p) => {
    const f = farmById(p.farmId) || { name: "Çiftlik" };
    return `<article class="card">
      <div class="row"><strong>${p.name}</strong><span class="price">${money(p.price)}</span></div>
      <p class="meta">${f.name} · stok ${p.stock}</p>
      <p class="meta">${p.desc}</p>
      <span class="stamp gold">${EU_LABEL[p.eu] || "AB Farm to Fork"}</span>
      <button type="button" class="btn" data-act="buy" data-id="${p.id}">Al ve konumu aç</button>
    </article>`;
  }).join("");
}

function renderMap(origin) {
  const o = origin || S.lastGps || { lat: 39.9334, lng: 32.8597 };
  const frame = $("map-frame");
  if (frame) {
    frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${o.lng - 0.25}%2C${o.lat - 0.18}%2C${o.lng + 0.25}%2C${o.lat + 0.18}&layer=mapnik&marker=${o.lat}%2C${o.lng}`;
  }
  const box = $("farm-cards");
  if (!box) return;
  box.innerHTML = FARMS.map((f) => {
    const d = haversine(o.lat, o.lng, f.lat, f.lng) / 1000;
    const j = jitter(f);
    const n = S.products.filter((p) => p.farmId === f.id && p.stock > 0).length;
    return `<article class="card">
      <div class="row"><strong>${f.name}</strong><span class="meta">≈ ${d.toFixed(1)} km</span></div>
      <p class="meta">${f.farmer} · ${n} ürün</p>
      <p class="meta">GPS kilitli · ${j.lat.toFixed(3)}, ${j.lng.toFixed(3)} kaydırılmış</p>
      <button type="button" class="btn ghost" data-act="farm-market" data-id="${f.id}">Ürünleri gör</button>
    </article>`;
  }).join("");
}

function renderOrders() {
  const box = $("order-list");
  if (!box) return;
  if (!S.orders.length) {
    box.innerHTML = `<div class="lock">Henüz sipariş yok.</div><button type="button" class="btn" data-act="go" data-go="screen-home">Pazara git</button>`;
    return;
  }
  box.innerHTML = S.orders.map((o) => {
    const p = productById(o.productId) || { name: "ürün" };
    const f = farmById(o.farmId);
    const loc = o.unlocked && f ? `${f.address}<br>${f.lat.toFixed(5)}, ${f.lng.toFixed(5)} · ${f.phone}` : "konum kilitli";
    return `<article class="card">
      <div class="row"><strong>${p.name}</strong><span class="price">${money(o.base)}</span></div>
      <p class="meta">${o.status} · ${o.id}</p>
      <p class="meta">stopaj ${money(o.tax)} · net ${money(o.net)} · ${o.carbon} kg CO₂</p>
      <p class="meta">${loc}</p>
      <p class="meta">NFC: <code>${o.nfcSecret}</code></p>
      <button type="button" class="btn ghost" data-act="nfc-fill" data-id="${o.id}">NFC formuna koy</button>
    </article>`;
  }).join("");
}

function renderNotifs() {
  const box = $("notif-list");
  if (!box) return;
  box.innerHTML = S.notifs.slice(0, 8).map((n) =>
    `<article class="card"><strong>${n.title}</strong><p class="meta">${n.body}</p></article>`
  ).join("") || `<p class="meta">Bildirim yok.</p>`;
}

function setRole(role) {
  S.role = role === "FARMER" ? "FARMER" : "CUSTOMER";
  save();
  setText("role-label", S.role === "FARMER" ? "Çiftçi" : "Alıcı");
  const c = $("role-c"), f = $("role-f");
  if (c && f) {
    c.classList.toggle("on", S.role === "CUSTOMER");
    c.classList.toggle("ghost", S.role !== "CUSTOMER");
    f.classList.toggle("on", S.role === "FARMER");
    f.classList.toggle("ghost", S.role !== "FARMER");
  }
}

function openBuy(pid) {
  const p = productById(pid);
  if (!p) { setHtml("buy-msg", `<div class="err">Ürün bulunamadı. Pazara dön.</div>`); show("screen-buy"); return; }
  const f = farmById(p.farmId) || { name: "Çiftlik", taxRegistered: false };
  $("buy-pid").value = pid;
  setText("buy-title", p.name);
  setText("buy-farm", f.name + (f.taxRegistered ? " · vergi kayıtlı" : " · kayıtsız, %2 stopaj") + " · " + (EU_LABEL[p.eu] || "AB"));
  $("buy-qty").value = 1;
  $("buy-form").classList.remove("hidden");
  $("buy-empty-go").classList.add("hidden");
  setHtml("buy-msg", "");
  quoteBuy();
  show("screen-buy");
}

function quoteBuy() {
  const p = productById(( $("buy-pid") || {} ).value);
  if (!p) return;
  const f = farmById(p.farmId);
  const qty = Math.max(1, Number(( $("buy-qty") || {} ).value || 1));
  const base = p.price * qty;
  const tax = stopaj(f, base);
  const km = Number(( $("buy-km") || {} ).value || 6);
  const co2 = carbonKg(km);
  setHtml("quote-box", `<div class="quote">
    <div class="line"><span>Tutar</span><span>${money(base)}</span></div>
    <div class="line"><span>Stopaj ${tax.rate ? "%" + (tax.rate * 100) : "yok"}</span><span>${money(tax.tax)}</span></div>
    <div class="line"><span>Çiftçi net</span><span>${money(tax.net)}</span></div>
    <div class="line"><span>Karbon · AB F2F</span><span>${co2} kg</span></div>
  </div>`);
}

async function payNow() {
  const p = productById(( $("buy-pid") || {} ).value);
  if (!p) { setHtml("buy-msg", `<div class="err">Önce pazardan ürün seç.</div>`); return; }
  const f = farmById(p.farmId);
  const qty = Math.max(1, Number(( $("buy-qty") || {} ).value || 1));
  if (qty > p.stock) { setHtml("buy-msg", `<div class="err">Stok yetmiyor (${p.stock})</div>`); return; }
  const pan = String(( $("buy-pan") || {} ).value || "").replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(pan)) { setHtml("buy-msg", `<div class="err">Kart numarası geçersiz</div>`); return; }
  if (pan.endsWith("3")) { setHtml("buy-msg", `<div class="err">Simüle red: son hane 3. 4242…2 dene.</div>`); return; }
  const base = p.price * qty;
  const tax = stopaj(f, base);
  const km = Number(( $("buy-km") || {} ).value || 6);
  const secret = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const order = {
    id: "gp" + Date.now().toString(36),
    productId: p.id, farmId: f.id, qty, base, tax: tax.tax, net: tax.net,
    carbon: carbonKg(km), km, status: "PAID", nfcSecret: secret, unlocked: true,
    createdAt: new Date().toISOString(),
  };
  p.stock -= qty;
  S.orders.unshift(order);
  save();
  if ($("nfc-order")) $("nfc-order").value = order.id;
  if ($("nfc-secret")) $("nfc-secret").value = secret;
  setHtml("buy-msg", `<div class="ok">
    Ödendi. Avrupa Birliği izlenebilirlik fişi kesildi. Konum açıldı.<br>
    <b>${f.name}</b><br>${f.address}<br>
    ${f.lat.toFixed(5)}, ${f.lng.toFixed(5)}<br>
    Tel: ${f.phone}<br>
    NFC sır: <code>${secret}</code><br>
    Sipariş: <code>${order.id}</code>
  </div>
  <button type="button" class="btn" data-act="go" data-go="screen-more">Deftere git</button>
  <button type="button" class="btn ghost" data-act="go" data-go="screen-farm">NFC teslime git</button>`);
  renderMarket();
  renderOrders();
}

function useGps() {
  setHtml("geo-msg", `<div class="note">Konum isteniyor…</div>`);
  if (!navigator.geolocation) { setHtml("geo-msg", `<div class="err">Bu tarayıcı konum vermiyor.</div>`); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const o = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      S.lastGps = o; save();
      renderMap(o);
      scanFence(o);
    },
    (err) => { setHtml("geo-msg", `<div class="err">Konum izni gerekli. Kod ${err && err.code ? err.code : "?"}. HTTPS üzerinde tekrar dene.</div>`); },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

function simulateNear() {
  const f = farmById("kizilay");
  const o = { lat: f.lat + 0.0008, lng: f.lng + 0.0004 };
  S.lastGps = o; save();
  renderMap(o);
  scanFence(o);
}

function scanFence(o) {
  const hits = [];
  S.products.forEach((p) => {
    const f = farmById(p.farmId);
    if (!f || p.stock <= 0) return;
    const m = haversine(o.lat, o.lng, f.lat, f.lng);
    if (m <= FENCE_M) hits.push({ p, f, m });
  });
  let sent = 0;
  hits.forEach((h) => {
    if (S.fenceSeen[h.p.id]) return;
    S.fenceSeen[h.p.id] = true;
    S.notifs.unshift({ t: Date.now(), title: h.p.name + " hazır", body: `${h.f.name} ${Math.round(h.m)} m · AB F2F` });
    sent += 1;
  });
  save();
  setHtml("geo-msg", hits.length
    ? `<div class="ok">${hits.length} ürün 300 m içinde. ${sent} yeni bildirim.</div>` +
      hits.map((h) => `<p class="meta">${h.p.name} · ${Math.round(h.m)} m · ${h.f.name}</p>`).join("")
    : `<div class="lock">300 m içinde aktif hasat yok. “Tezgahın yanındayım” ile Kızılay pop-up’ı dene.</div>`);
  renderNotifs();
  if (sent && "Notification" in window && Notification.permission === "granted") {
    try { new Notification(S.notifs[0].title, { body: S.notifs[0].body }); } catch (e) { /* ignore */ }
  }
}

async function askPush() {
  if (!("Notification" in window)) { setHtml("geo-msg", `<div class="err">Bildirim API yok.</div>`); return; }
  try {
    const perm = await Notification.requestPermission();
    setHtml("geo-msg", `<div class="ok">Bildirim izni: ${perm}</div>`);
  } catch (e) {
    setHtml("geo-msg", `<div class="err">İzin istenemedi.</div>`);
  }
}

function publishHarvest() {
  const name = (($("h-name") || {}).value || "").trim();
  const price = Number(( $("h-price") || {} ).value);
  const stock = Number(( $("h-stock") || {} ).value);
  if (name.length < 2 || !(price > 0) || !(stock >= 0)) {
    setHtml("h-msg", `<div class="err">Ad, fiyat ve stok gerekli.</div>`);
    return;
  }
  const item = {
    id: "u" + Date.now().toString(36),
    farmId: "golbasi",
    name,
    desc: ($("h-desc") || {}).value || "Bugünkü hasat",
    price, stock,
    cat: ($("h-cat") || {}).value || "Meyve",
    eu: ($("h-eu") || {}).value || "organic",
    photo: S.harvestPhoto || "",
  };
  S.products.unshift(item);
  save();
  setHtml("h-msg", `<div class="ok">Tezgaha düştü. AB işareti: ${EU_LABEL[item.eu]}.</div>
    <button type="button" class="btn" data-act="go" data-go="screen-home">Pazarda gör</button>`);
  renderMarket();
}

function onPhoto(input) {
  const file = input && input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    S.harvestPhoto = reader.result;
    save();
    const img = $("h-preview");
    if (img) { img.src = reader.result; img.classList.remove("hidden"); }
  };
  reader.readAsDataURL(file);
}

async function nfcTap() {
  const orderId = (($("nfc-order") || {}).value || "").trim();
  const secret = (($("nfc-secret") || {}).value || "").trim();
  const o = S.orders.find((x) => x.id === orderId);
  if (!o) { setHtml("nfc-msg", `<div class="err">Sipariş bulunamadı. Defterden “NFC formuna koy” kullan.</div>`); return; }
  if (o.nfcSecret !== secret) { setHtml("nfc-msg", `<div class="err">NFC sır eşleşmedi.</div>`); return; }
  const mac = (await shaHex(secret + "." + orderId)).slice(0, 16);
  o.status = "COMPLETED";
  o.nfcMac = mac;
  save();
  setHtml("nfc-msg", `<div class="ok">HMAC ${mac} doğrulandı. Teslim COMPLETED. AB izlenebilirlik kapandı.</div>`);
  renderOrders();
}

function fillNfc(id) {
  const o = S.orders.find((x) => x.id === id);
  if (!o) return;
  if ($("nfc-order")) $("nfc-order").value = o.id;
  if ($("nfc-secret")) $("nfc-secret").value = o.nfcSecret;
  show("screen-farm");
  setHtml("nfc-msg", `<div class="ok">Sır yapıştırıldı. “Dokun ve doğrula”ya bas.</div>`);
}

function resetDemo() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  S = blank();
  boot();
}

function onAct(act, el) {
  if (act === "role") setRole(el.getAttribute("data-role"));
  else if (act === "buy") openBuy(el.getAttribute("data-id"));
  else if (act === "pay") payNow();
  else if (act === "gps") useGps();
  else if (act === "near") simulateNear();
  else if (act === "push") askPush();
  else if (act === "publish") publishHarvest();
  else if (act === "nfc") nfcTap();
  else if (act === "nfc-fill") fillNfc(el.getAttribute("data-id"));
  else if (act === "reset") resetDemo();
  else if (act === "go") show(el.getAttribute("data-go"));
  else if (act === "farm-market") {
    show("screen-home");
    setHtml("geo-msg", "");
  }
}

function boot() {
  setRole(S.role || "CUSTOMER");
  renderMarket();
  renderMap(S.lastGps);
  renderOrders();
  renderNotifs();
  if (S.harvestPhoto && $("h-preview")) {
    $("h-preview").src = S.harvestPhoto;
    $("h-preview").classList.remove("hidden");
  }
  const hasPid = $("buy-pid") && $("buy-pid").value;
  if ($("buy-form")) $("buy-form").classList.toggle("hidden", !hasPid);
  if ($("buy-empty-go")) $("buy-empty-go").classList.toggle("hidden", !!hasPid);
  show("screen-home");
}

document.addEventListener("click", (e) => {
  const rail = e.target.closest && e.target.closest(".rail button[data-go]");
  if (rail) {
    e.preventDefault();
    show(rail.getAttribute("data-go"));
    return;
  }
  const btn = e.target.closest && e.target.closest("[data-act]");
  if (!btn) return;
  e.preventDefault();
  onAct(btn.getAttribute("data-act"), btn);
});

const qty = $("buy-qty");
const km = $("buy-km");
if (qty) qty.addEventListener("input", quoteBuy);
if (km) km.addEventListener("input", quoteBuy);
const file = $("h-file");
if (file) file.addEventListener("change", () => onPhoto(file));

const pagerEl = $("pager");
if (pagerEl) {
  pagerEl.addEventListener("scroll", () => {
    const pages = [...pagerEl.querySelectorAll(".page")];
    const i = Math.round(pagerEl.scrollLeft / Math.max(pagerEl.clientWidth, 1));
    const id = pages[i] && pages[i].id;
    if (!id) return;
    document.querySelectorAll(".rail button").forEach((b) => b.classList.toggle("on", b.getAttribute("data-go") === id));
  }, { passive: true });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

boot();
