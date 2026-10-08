const KEY = "greenpick.iphone.v16";
const FENCE_M = 300;
const STOPAJ_UNREG = 0.02;
const PLANT = ["Fruit", "Vegetable", "Greens", "Pantry", "Bakery"];
const CATS = ["All", "Fruit", "Vegetable", "Greens", "Pantry", "Bakery", "Eggs", "Honey"];
const FARMS = [
  { id: "valley", name: "Green Valley Farm", farmer: "Elif Yilmaz", phone: "+90 535 777 8899", address: "Kizilay, Ankara", lat: 39.9208, lng: 32.8541, taxRegistered: false },
  { id: "cankaya", name: "Ahmet's Garden", farmer: "Ahmet Kaya", phone: "+90 532 111 2233", address: "Cankaya, Ankara", lat: 39.9176, lng: 32.8592, taxRegistered: true },
  { id: "kecioren", name: "Ayse's Greens", farmer: "Ayse Demir", phone: "+90 533 444 5566", address: "Kecioren, Ankara", lat: 39.9262, lng: 32.8601, taxRegistered: false },
  { id: "yenimahalle", name: "Mehmet's Orchard", farmer: "Mehmet Arslan", phone: "+90 534 222 3344", address: "Yenimahalle, Ankara", lat: 39.9310, lng: 32.8448, taxRegistered: true }
];
const SEED = [
  { id: "p1", farmId: "valley", name: "Strawberries", desc: "Ready to harvest", price: 4.5, stock: 6, cat: "Fruit", eu: "none", harvested: "Ready now", vegan: true },
  { id: "p2", farmId: "cankaya", name: "Tomatoes", desc: "Harvested today", price: 2.8, stock: 12, cat: "Vegetable", eu: "organic", harvested: "Harvested today", vegan: true },
  { id: "p3", farmId: "kecioren", name: "Garden lettuce", desc: "Cut this morning", price: 2.4, stock: 8, cat: "Greens", eu: "none", harvested: "This morning", vegan: true },
  { id: "p4", farmId: "yenimahalle", name: "Apples", desc: "Autumn orchard", price: 2.9, stock: 20, cat: "Fruit", eu: "organic", harvested: "Today", vegan: true },
  { id: "p5", farmId: "cankaya", name: "Peppers", desc: "Seasonal crate", price: 3.2, stock: 7, cat: "Vegetable", eu: "organic", harvested: "Today", vegan: true },
  { id: "p6", farmId: "valley", name: "Farm eggs", desc: "Collected this morning", price: 3.6, stock: 24, cat: "Eggs", eu: "none", harvested: "This morning", vegan: false },
  { id: "p7", farmId: "yenimahalle", name: "Olive oil", desc: "Cold pressed, small batch", price: 14, stock: 10, cat: "Pantry", eu: "organic", harvested: "This week", vegan: true },
  { id: "p8", farmId: "kecioren", name: "Wildflower honey", desc: "Local frames", price: 9.5, stock: 5, cat: "Honey", eu: "none", harvested: "This season", vegan: false },
  { id: "p9", farmId: "valley", name: "Village bread", desc: "Wood oven, baked today", price: 2.2, stock: 9, cat: "Bakery", eu: "none", harvested: "Baked today", vegan: true }
];
const LABEL = { organic: "EU Organic Certified", conv: "In conversion", none: "Not certified" };
const PHOTOS = {
  p1: "./img/strawberries.jpg",
  p2: "./img/tomatoes.jpg",
  p3: "./img/greens.jpg",
  p4: "./img/farm-sunrise.jpg",
  p5: "./img/parsley.jpg",
  p6: "./img/stall-day.jpg",
  p7: "./img/beans.jpg",
  p8: "./img/stall-city.jpg",
  p9: "./img/leaf-plate.jpg",
  valley: "./img/farm-sunrise.jpg",
  cankaya: "./img/farm-anatolia.jpg",
  kecioren: "./img/greens.jpg",
  yenimahalle: "./img/stall-day.jpg"
};
const FALLBACK = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10"><rect width="16" height="10" fill="#1A2E1C"/><path d="M8 2c2.4 1.4 3.6 3.6 3.2 5.8-1.6-.5-2.8-1.6-3.2-3-.4 1.4-1.6 2.5-3.2 3C4.4 5.6 5.6 3.4 8 2z" fill="#7CB518"/></svg>');
const ORIGIN = { lat: 39.9228, lng: 32.8560 };

function shot(p) { return (p && p.photo) || (p && PHOTOS[p.id]) || FALLBACK; }
function img(src, alt) {
  return '<img src="' + src + '" alt="' + (alt || "") + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + FALLBACK + '\'" />';
}
function blank() {
  return { role: "CUSTOMER", products: SEED.map((p) => ({ ...p })), orders: [], notifs: [], fenceSeen: {}, favs: {}, harvestPhoto: "", vegan: false, simple: false, radiusM: 1000, cat: "All", lastGps: ORIGIN };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved.products)) return blank();
    return Object.assign(blank(), saved);
  } catch (err) {
    console.error("GreenPick state reset", err);
    return blank();
  }
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (err) { console.error("GreenPick save failed", err); } }
function hav(a, b, c, d) {
  const R = 6371000;
  const t = (x) => x * Math.PI / 180;
  const x = t(c - a);
  const y = t(d - b);
  const q = Math.sin(x / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(y / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(q));
}
function farm(id) { return FARMS.find((f) => f.id === id); }
function prod(id) { return S.products.find((p) => p.id === id); }
function money(n) { return Number(n).toFixed(2) + " €"; }
function co2(km) { return Number(((Math.max(Number(km) || 0, 8) - Number(km || 0)) * 0.12 + 0.35).toFixed(3)); }
function tax(f, base) {
  const rate = f && f.taxRegistered ? 0 : STOPAJ_UNREG;
  const amount = Math.round(base * rate * 100) / 100;
  return { rate, tax: amount, net: Math.round((base - amount) * 100) / 100 };
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return (h % 1000) / 1000; }
function jitter(f) { return { lat: f.lat + (hash(f.id) - 0.5) * 0.008, lng: f.lng + (hash(f.id + "x") - 0.5) * 0.008 }; }
async function sha(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const $ = (id) => document.getElementById(id);
function html(id, value) { const el = $(id); if (el) el.innerHTML = value; }
function text(id, value) { const el = $(id); if (el) el.textContent = value; }
function origin() { return S.lastGps || ORIGIN; }
function metres(f) { const o = origin(); return hav(o.lat, o.lng, f.lat, f.lng); }
function dist(m) { return m < 950 ? Math.round(m) + " m" : (m / 1000).toFixed(1) + " km"; }
function plant(p) { return p.vegan !== false && (PLANT.indexOf(p.cat) !== -1 || p.vegan === true); }
function toast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), 2200);
}
function visible() {
  const q = (($("q") || {}).value || "").trim().toLowerCase();
  return S.products.filter((p) => {
    if (p.stock <= 0) return false;
    if (S.vegan && !plant(p)) return false;
    if (S.cat && S.cat !== "All" && p.cat !== S.cat) return false;
    if (q && !(p.name + " " + p.desc + " " + ((farm(p.farmId) || {}).name || "")).toLowerCase().includes(q)) return false;
    return true;
  }).map((p) => ({ p, f: farm(p.farmId), m: farm(p.farmId) ? metres(farm(p.farmId)) : 99999 })).sort((a, b) => a.m - b.m);
}
function show(id) {
  const page = $(id);
  const pager = $("pager");
  if (!page || !pager) return;
  const go = () => {
    try { pager.scrollTo({ left: page.offsetLeft, behavior: "smooth" }); }
    catch (err) { pager.scrollLeft = page.offsetLeft; }
    page.scrollTop = 0;
  };
  go();
  requestAnimationFrame(go);
  document.querySelectorAll(".tabbar button").forEach((btn) => btn.classList.toggle("on", btn.getAttribute("data-go") === id));
}
function heart(on) {
  return '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.5-8.2C.7 10.2 1.2 7 3.6 5.6 5.4 4.6 7.7 5 9 6.4L12 9l3-2.6C16.3 5 18.6 4.6 20.4 5.6c2.4 1.4 2.9 4.6 1.1 7.2C19 16.4 12 21 12 21Z" fill="' + (on ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.8"/></svg>';
}
function card(row) {
  const p = row.p;
  const f = row.f || { name: "Farm", farmer: "Grower" };
  const liked = !!S.favs[p.id];
  return '<article class="pcard"><button type="button" class="fav' + (liked ? " on" : "") + '" data-act="fav" data-id="' + p.id + '" aria-label="Favorite">' + heart(liked) + '</button><div class="media">' + img(shot(p), p.name) + '</div><div class="body"><div class="row"><strong>' + p.name + '</strong><span class="price">' + money(p.price) + ' / kg</span></div><p class="meta">' + p.desc + ' · <span class="dist">' + dist(row.m) + '</span></p><p class="meta">From ' + f.name + ' · ' + f.farmer + '</p><span class="badge">' + (p.harvested || "Available now") + '</span> <span class="badge">' + (LABEL[p.eu] || "Not certified") + '</span><p class="lockline">Exact GPS locked until payment</p><div class="cta"><button type="button" class="btn" data-act="buy" data-id="' + p.id + '">See & buy</button></div></div></article>';
}
function chips(id) {
  const box = $(id);
  if (!box) return;
  box.innerHTML = CATS.map((c) => '<button type="button" class="chip' + (S.cat === c ? " on" : "") + '" data-act="cat" data-cat="' + c + '">' + c + "</button>").join("");
}
function renderHome() {
  chips("home-cats");
  const list = visible();
  const first = list[0];
  html("home-hero", first ? card(first) : '<div class="lock">Nothing listed in this filter.</div>');
  html("home-list", list.slice(1, 5).map(card).join(""));
  if (first) text("miles-n", dist(first.m));
  const plantLots = S.products.filter((p) => p.stock > 0 && plant(p)).length;
  const live = S.products.filter((p) => p.stock > 0).length;
  text("vegan-n", live ? Math.round((plantLots / live) * 100) + "%" : "—");
  const saved = S.orders.reduce((n, o) => n + Number(o.carbon || 0), 0);
  text("co2-n", saved.toFixed(2) + " kg");
}
function renderExplore() {
  chips("explore-cats");
  const list = visible();
  html("explore-list", list.length ? list.map(card).join("") : '<div class="lock">No matches. Try All.</div>');
}
function renderMap() {
  const o = origin();
  const frame = $("map-frame");
  if (frame) frame.src = "https://www.openstreetmap.org/export/embed.html?bbox=" + (o.lng - 0.08) + "%2C" + (o.lat - 0.05) + "%2C" + (o.lng + 0.08) + "%2C" + (o.lat + 0.05) + "&layer=mapnik&marker=" + o.lat + "%2C" + o.lng;
  html("pinrow", visible().slice(0, 6).map((r) => '<button type="button" class="pin" data-act="buy" data-id="' + r.p.id + '">' + r.p.name + " · " + dist(r.m) + "</button>").join(""));
  html("farm-cards", FARMS.map((f) => {
    const lots = S.products.filter((p) => p.farmId === f.id && p.stock > 0);
    const j = jitter(f);
    return '<article class="pcard"><div class="media">' + img(PHOTOS[f.id] || FALLBACK, f.name) + '</div><div class="body"><div class="row"><strong>' + f.name + '</strong><span class="dist">' + dist(metres(f)) + '</span></div><p class="meta">' + f.farmer + "</p><p class=\"meta\">" + (lots.map((p) => p.name).join(" · ") || "No harvest today") + "</p><p class=\"lockline\">Offset pin " + j.lat.toFixed(3) + ", " + j.lng.toFixed(3) + " · exact GPS locked</p></div></article>";
  }).join(""));
}
function renderOrders() {
  const box = $("order-list");
  if (!box) return;
  if (!S.orders.length) { box.innerHTML = '<div class="lock">No purchases yet.</div>'; return; }
  box.innerHTML = S.orders.map((o) => {
    const p = prod(o.productId) || { name: "lot" };
    const f = farm(o.farmId);
    const loc = o.unlocked && f
      ? (f.address + " · " + f.lat.toFixed(5) + ", " + f.lng.toFixed(5) + " · " + f.phone)
      : "Location and phone locked";
    return '<article class="pcard"><div class="media">' + img(shot(p), p.name) + '</div><div class="body"><div class="row"><strong>' + p.name + '</strong><span class="price">' + money(o.base) + '</span></div><p class="meta">' + o.status + " · " + dist((o.km || 0.3) * 1000) + " · est. " + o.carbon + " kg CO₂e</p><p class=\"meta\">" + loc + "</p><p class=\"meta\">Code <code>" + o.nfcSecret + "</code></p><button type=\"button\" class=\"btn ghost\" data-act=\"nfc-fill\" data-id=\"" + o.id + "\">Fill handover</button></div></article>";
  }).join("");
}
function renderNotifs() {
  html("notif-list", S.notifs.slice(0, 6).map((n) => '<article class="pcard"><div class="body"><strong>' + n.title + '</strong><p class="meta">' + n.body + '</p></div></article>').join("") || '<p class="meta">No alerts yet. A ping fires only inside 300 m.</p>');
}
function renderMore() {
  const avg = S.orders.length ? S.orders.reduce((n, o) => n + Number(o.km || 0), 0) / S.orders.length : 0;
  const plantLots = S.products.filter((p) => p.stock > 0 && plant(p)).length;
  const live = S.products.filter((p) => p.stock > 0).length;
  html("impact-grid",
    '<div class="stat"><span>Farms</span><b>' + FARMS.length + "</b></div>" +
    '<div class="stat"><span>Live lots</span><b>' + live + "</b></div>" +
    '<div class="stat"><span>Plant-based</span><b>' + plantLots + "</b></div>" +
    '<div class="stat"><span>Orders</span><b>' + S.orders.length + "</b></div>" +
    '<div class="stat"><span>Avg km</span><b>' + avg.toFixed(2) + "</b></div>" +
    '<div class="stat"><span>Fence</span><b>300 m</b></div>');
  const grower = S.role === "FARMER";
  document.documentElement.classList.toggle("grower", grower);
  text("who-role", grower ? "Grower" : "Buyer");
  text("who-name", grower ? "Elif Yilmaz" : "Guest");
  text("who-sub", grower ? "Green Valley Farm · list what is ready" : "Ankara · exact GPS stays locked until payment");
  const veganBtn = $("btn-vegan");
  const simpleBtn = $("btn-simple");
  const buyer = $("role-c");
  const growerBtn = $("role-f");
  if (veganBtn) veganBtn.classList.toggle("on", !!S.vegan);
  if (simpleBtn) simpleBtn.classList.toggle("on", !!S.simple);
  if (buyer) buyer.classList.toggle("on", !grower);
  if (growerBtn) growerBtn.classList.toggle("on", grower);
}
function chrome() { document.documentElement.classList.toggle("simple", !!S.simple); }
function paint() { chrome(); renderHome(); renderExplore(); renderMap(); renderOrders(); renderNotifs(); renderMore(); }
function setRole(role) { S.role = role === "FARMER" ? "FARMER" : "CUSTOMER"; save(); paint(); toast(S.role === "FARMER" ? "Grower mode" : "Buyer mode"); }
function openBuy(pid) {
  const p = prod(pid);
  if (!p) { toast("That harvest is gone."); return; }
  const f = farm(p.farmId) || { name: "Farm", farmer: "Grower", taxRegistered: false };
  $("buy-pid").value = pid;
  text("buy-title", p.name);
  text("buy-farm", f.farmer + " · " + f.name + " · " + dist(metres(f)) + " · " + (LABEL[p.eu] || "Not certified") + " · GPS locked");
  const hero = $("buy-hero");
  const cap = $("buy-cap");
  if (hero) { hero.src = shot(p); hero.alt = p.name; }
  if (cap) cap.textContent = p.name + " · address opens after payment";
  $("buy-qty").value = 1;
  $("buy-form").classList.remove("hidden");
  $("buy-empty-go").classList.add("hidden");
  html("buy-msg", "");
  quote();
  show("screen-orders");
}
function quote() {
  const p = prod(($("buy-pid") || {}).value);
  if (!p) return;
  const f = farm(p.farmId);
  const qty = Math.max(1, Number(($("buy-qty") || {}).value || 1));
  const base = p.price * qty;
  const t = tax(f, base);
  const km = Number(($("buy-km") || {}).value || 0.3);
  html("quote-box", '<div class="quote"><div class="line"><span>Amount</span><span>' + money(base) + '</span></div><div class="line"><span>Withholding</span><span>' + money(t.tax) + '</span></div><div class="line"><span>Grower net</span><span>' + money(t.net) + '</span></div><div class="line"><span>Est. CO₂e avoided</span><span>' + co2(km) + ' kg</span></div><div class="line"><span>Plant-based</span><span>' + (plant(p) ? "Yes" : "No") + "</span></div></div><p class=\"fine\">Estimate only. Payment unlocks the farm point. This is not a zero-carbon certificate.</p>");
}
async function payNow() {
  const p = prod(($("buy-pid") || {}).value);
  if (!p) { html("buy-msg", '<div class="err">Pick a harvest first.</div>'); return; }
  const f = farm(p.farmId);
  if (!f) { html("buy-msg", '<div class="err">Farm record missing for this lot.</div>'); return; }
  const qty = Math.max(1, Number(($("buy-qty") || {}).value || 1));
  if (qty > p.stock) { html("buy-msg", '<div class="err">Only ' + p.stock + " kg left.</div>"); return; }
  const pan = String(($("buy-pan") || {}).value || "").replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(pan)) { html("buy-msg", '<div class="err">Check the card number.</div>'); return; }
  if (pan.endsWith("3")) { html("buy-msg", '<div class="err">Declined. Last digit 3 is the failure fixture. Location stays locked.</div>'); return; }
  const base = p.price * qty;
  const t = tax(f, base);
  const km = Number(($("buy-km") || {}).value || 0.3);
  const secret = [...crypto.getRandomValues(new Uint8Array(10))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const order = { id: "gp" + Date.now().toString(36), productId: p.id, farmId: f.id, qty, base, tax: t.tax, net: t.net, carbon: co2(km), km, status: "PAID", nfcSecret: secret, unlocked: true };
  p.stock -= qty;
  S.orders.unshift(order);
  save();
  if ($("nfc-order")) $("nfc-order").value = order.id;
  if ($("nfc-secret")) $("nfc-secret").value = secret;
  html("buy-msg", '<div class="ok">Paid. Farm location is open.<br><b>' + f.name + "</b><br>" + f.farmer + "<br>" + f.address + "<br>" + f.lat.toFixed(5) + ", " + f.lng.toFixed(5) + "<br>" + f.phone + "<br>Code <code>" + secret + "</code></div>");
  toast("Location unlocked");
  paint();
}
function useGps() {
  html("geo-msg", '<div class="note">Asking for location…</div>');
  if (!navigator.geolocation) { html("geo-msg", '<div class="err">Location unavailable.</div>'); return; }
  navigator.geolocation.getCurrentPosition((pos) => {
    S.lastGps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    save();
    paint();
    scan();
  }, (err) => {
    html("geo-msg", '<div class="err">Location needed. Code ' + (err && err.code ? err.code : "?") + ".</div>");
  }, { enableHighAccuracy: true, timeout: 12000 });
}
function simulateNear() { S.lastGps = { lat: FARMS[0].lat, lng: FARMS[0].lng }; save(); paint(); scan(); }
function scan(point) {
  const pt = point || origin();
  const hits = [];
  S.products.forEach((p) => {
    const f = farm(p.farmId);
    if (!f || p.stock <= 0) return;
    if (S.vegan && !plant(p)) return;
    const m = hav(pt.lat, pt.lng, f.lat, f.lng);
    if (m <= FENCE_M) hits.push({ p, f, m });
  });
  let sent = 0;
  hits.forEach((h) => {
    if (S.fenceSeen[h.p.id]) return;
    S.fenceSeen[h.p.id] = true;
    S.notifs.unshift({ t: Date.now(), title: h.p.name + " " + dist(h.m) + " away", body: h.f.name + " · " + Math.round(h.m) + " m · inside the 300 m fence" });
    sent += 1;
  });
  save();
  const msg = hits.length
    ? '<div class="ok">' + hits.length + " harvest(s) inside 300 m. " + sent + " new alert(s).</div>"
    : '<div class="lock">Nothing inside 300 m. Wider radius only changes the list, not the fence.</div>';
  html("geo-msg", msg);
  html("alert-msg", msg);
  renderNotifs();
  if (sent && "Notification" in window && Notification.permission === "granted") {
    try { new Notification(S.notifs[0].title, { body: S.notifs[0].body }); } catch (err) { console.error(err); }
  }
  if (sent) toast(S.notifs[0].title);
}
async function askPush() {
  if (!("Notification" in window)) { html("alert-msg", '<div class="err">Alerts unavailable.</div>'); return; }
  try {
    const perm = await Notification.requestPermission();
    html("alert-msg", '<div class="ok">Permission: ' + perm + "</div>");
    if (perm === "granted") scan();
  } catch (err) {
    html("alert-msg", '<div class="err">Could not ask for alerts.</div>');
    console.error(err);
  }
}
function publish() {
  const name = (($("h-name") || {}).value || "").trim();
  const price = Number(($("h-price") || {}).value);
  const stock = Number(($("h-stock") || {}).value);
  if (name.length < 2 || !(price > 0) || !(stock >= 0)) { html("h-msg", '<div class="err">Product, price and kilos are required.</div>'); return; }
  const cat = ($("h-cat") || {}).value || "Fruit";
  S.products.unshift({ id: "u" + Date.now().toString(36), farmId: "valley", name, desc: ($("h-desc") || {}).value || "Today", price, stock, cat, eu: ($("h-eu") || {}).value || "none", harvested: ($("h-when") || {}).value || "Today", vegan: PLANT.indexOf(cat) !== -1, photo: S.harvestPhoto || "" });
  save();
  html("h-msg", '<div class="ok">Published. Buyers inside 300 m can be alerted.</div>');
  toast("Harvest published");
  paint();
}
function onPhoto(input) {
  const file = input && input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    S.harvestPhoto = reader.result;
    save();
    const preview = $("h-preview");
    if (preview) { preview.src = reader.result; preview.classList.remove("hidden"); }
  };
  reader.readAsDataURL(file);
}
async function nfcTap() {
  const id = (($("nfc-order") || {}).value || "").trim();
  const secret = (($("nfc-secret") || {}).value || "").trim();
  const order = S.orders.find((x) => x.id === id);
  if (!order) { html("nfc-msg", '<div class="err">Order not found.</div>'); return; }
  if (order.nfcSecret !== secret) { html("nfc-msg", '<div class="err">Code does not match.</div>'); return; }
  order.status = "COMPLETED";
  order.nfcMac = (await sha(secret + "." + id)).slice(0, 16);
  save();
  html("nfc-msg", '<div class="ok">Handover complete.</div>');
  toast("Handover verified");
  renderOrders();
}
function fillNfc(id) {
  const order = S.orders.find((x) => x.id === id);
  if (!order) return;
  if ($("nfc-order")) $("nfc-order").value = order.id;
  if ($("nfc-secret")) $("nfc-secret").value = order.nfcSecret;
  show("screen-profile");
  html("nfc-msg", '<div class="ok">Code pasted.</div>');
}
function onAct(act, el) {
  if (act === "role") setRole(el.getAttribute("data-role"));
  else if (act === "buy") openBuy(el.getAttribute("data-id"));
  else if (act === "pay") payNow();
  else if (act === "gps") useGps();
  else if (act === "near") simulateNear();
  else if (act === "push") askPush();
  else if (act === "publish") publish();
  else if (act === "nfc") nfcTap();
  else if (act === "nfc-fill") fillNfc(el.getAttribute("data-id"));
  else if (act === "reset") { try { localStorage.removeItem(KEY); } catch (err) { console.error(err); } S = blank(); paint(); show("screen-home"); toast("Demo reset"); }
  else if (act === "go") show(el.getAttribute("data-go"));
  else if (act === "vegan") { S.vegan = !S.vegan; save(); paint(); toast(S.vegan ? "Plant-based on" : "All food"); }
  else if (act === "simple") { S.simple = !S.simple; save(); paint(); }
  else if (act === "cat") { S.cat = el.getAttribute("data-cat") || "All"; save(); paint(); }
  else if (act === "fav") { const id = el.getAttribute("data-id"); S.favs[id] = !S.favs[id]; save(); paint(); toast(S.favs[id] ? "Saved" : "Removed"); }
}
function boot() {
  paint();
  const sel = $("radius-sel");
  if (sel) sel.value = String(S.radiusM || 1000);
  if (S.harvestPhoto && $("h-preview")) { $("h-preview").src = S.harvestPhoto; $("h-preview").classList.remove("hidden"); }
  const has = $("buy-pid") && $("buy-pid").value;
  if ($("buy-form")) $("buy-form").classList.toggle("hidden", !has);
  if ($("buy-empty-go")) $("buy-empty-go").classList.toggle("hidden", !!has);
  show("screen-home");
}
document.addEventListener("click", (event) => {
  const rail = event.target.closest && event.target.closest(".tabbar button[data-go]");
  if (rail) { event.preventDefault(); show(rail.getAttribute("data-go")); return; }
  const btn = event.target.closest && event.target.closest("[data-act]");
  if (!btn) return;
  event.preventDefault();
  onAct(btn.getAttribute("data-act"), btn);
});
["buy-qty", "buy-km"].forEach((id) => { const el = $(id); if (el) el.addEventListener("input", quote); });
const file = $("h-file");
if (file) file.addEventListener("change", () => onPhoto(file));
const rad = $("radius-sel");
if (rad) rad.addEventListener("change", () => { S.radiusM = Number(rad.value) || 1000; save(); });
const q = $("q");
if (q) q.addEventListener("input", renderExplore);
const pager = $("pager");
if (pager) pager.addEventListener("scroll", () => {
  const pages = [].slice.call(pager.querySelectorAll(".page"));
  const i = Math.round(pager.scrollLeft / Math.max(pager.clientWidth, 1));
  const id = pages[i] && pages[i].id;
  if (!id) return;
  document.querySelectorAll(".tabbar button").forEach((btn) => btn.classList.toggle("on", btn.getAttribute("data-go") === id));
}, { passive: true });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js?v=gp16").catch((err) => console.error("SW", err));
boot();
