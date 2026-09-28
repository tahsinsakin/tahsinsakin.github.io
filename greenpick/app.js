const KEY = "greenpick.iphone.v7";
const FENCE_M = 300;
const STOPAJ_UNREG = 0.02;
const FARMS = [
  { id: "golbasi", name: "Golbasi Garden", farmer: "Ayse Kaya", phone: "+90 532 111 2233", address: "Karsiyaka Mah., Golbasi, Ankara", lat: 39.787, lng: 32.8041, taxRegistered: false },
  { id: "cubuk", name: "Cubuk Soil", farmer: "Mehmet Demir", phone: "+90 533 444 5566", address: "Yukari Cavundur, Cubuk, Ankara", lat: 40.2386, lng: 33.033, taxRegistered: true },
  { id: "kizilay", name: "Kizilay Pop-up Stall", farmer: "Elif Yilmaz", phone: "+90 535 777 8899", address: "Sakarya Cad., Kizilay, Ankara", lat: 39.9208, lng: 32.8541, taxRegistered: false }
];
const SEED = [
  { id: "p1", farmId: "golbasi", name: "Open-field strawberries", desc: "Morning pick. No cold chain.", price: 9.5, stock: 40, cat: "Fruit", eu: "organic" },
  { id: "p2", farmId: "golbasi", name: "Rocket and purslane", desc: "Cut greens crate.", price: 4.5, stock: 25, cat: "Greens", eu: "f2f" },
  { id: "p3", farmId: "cubuk", name: "Native dry beans", desc: "Cubuk plain, small crate.", price: 8, stock: 60, cat: "Pulses", eu: "organic" },
  { id: "p4", farmId: "cubuk", name: "Pink-row tomatoes", desc: "Harvest day, unsprayed.", price: 3.8, stock: 90, cat: "Vegetable", eu: "f2f" },
  { id: "p5", farmId: "kizilay", name: "Daily parsley bunch", desc: "Urban 300 m stall trial.", price: 2, stock: 30, cat: "Greens", eu: "local" }
];
const EU_LABEL = { organic: "EU organic \u00b7 2018/848", f2f: "EU Farm to Fork", local: "EU short supply chain" };
const PHOTOS = {
  p1: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=900&q=75",
  p2: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=75",
  p3: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=900&q=75",
  p4: "https://images.unsplash.com/photo-1546470427-e26264be0b2b?auto=format&fit=crop&w=900&q=75",
  p5: "https://images.unsplash.com/photo-1607305387299-8b4a0878b2db?auto=format&fit=crop&w=900&q=75",
  golbasi: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=75",
  cubuk: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=75",
  kizilay: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=75"
};
const FALLBACK_SHOT = PHOTOS.golbasi;
const STALL_SHOT = PHOTOS.kizilay;
function shotOf(p) { return (p && p.photo) || (p && PHOTOS[p.id]) || FALLBACK_SHOT; }
function blank() { return { role: "CUSTOMER", products: SEED.map((p) => ({ ...p })), orders: [], notifs: [], fenceSeen: {}, harvestPhoto: "" }; }
function load() { try { const raw = localStorage.getItem(KEY); if (!raw) return blank(); const s = JSON.parse(raw); if (!Array.isArray(s.products)) return blank(); return s; } catch (e) { return blank(); } }
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function haversine(aLat, aLng, bLat, bLng) { const R = 6371000; const toR = (d) => (d * Math.PI) / 180; const dLat = toR(bLat - aLat); const dLng = toR(bLng - aLng); const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); }
function farmById(id) { return FARMS.find((f) => f.id === id); }
function productById(id) { return S.products.find((p) => p.id === id); }
function money(n) { return Number(n).toFixed(2) + " \u20ac"; }
function carbonKg(km) { const supermarket = Math.max(km, 8); return Number(((supermarket - km) * 0.12 + 0.35).toFixed(3)); }
function stopaj(farm, base) { const rate = farm && farm.taxRegistered ? 0 : STOPAJ_UNREG; const tax = Math.round(base * rate * 100) / 100; return { rate, tax, net: Math.round((base - tax) * 100) / 100 }; }
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return (h % 1000) / 1000; }
function jitter(farm) { return { lat: farm.lat + (hash(farm.id) - 0.5) * 0.012, lng: farm.lng + (hash(farm.id + "x") - 0.5) * 0.012 }; }
async function shaHex(text) { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
const $ = (id) => document.getElementById(id);
function setHtml(id, html) { const el = $(id); if (el) el.innerHTML = html; }
function setText(id, t) { const el = $(id); if (el) el.textContent = t; }
function show(id) {
  const page = $(id); const pager = $("pager"); if (!page || !pager) return;
  const go = () => { const left = page.offsetLeft; try { pager.scrollTo({ left, behavior: "smooth" }); } catch (e) { pager.scrollLeft = left; } page.scrollTop = 0; };
  go(); requestAnimationFrame(go);
  document.querySelectorAll(".rail button").forEach((b) => { b.classList.toggle("on", b.getAttribute("data-go") === id); });
}
function renderMarket() {
  const box = $("market-list"); if (!box) return;
  const list = S.products.filter((p) => p.stock > 0);
  if (!list.length) { box.innerHTML = '<div class="lock">Stall is empty. Lodge a harvest as a grower.</div>'; return; }
  box.innerHTML = list.map((p) => {
    const f = farmById(p.farmId) || { name: "Holding" };
    const shot = shotOf(p);
    return '<article class="card"><img class="shot" src="' + shot + '" alt="' + p.name + '" /><div class="row"><strong>' + p.name + '</strong><span class="price">' + money(p.price) + '</span></div><p class="meta">' + f.name + ' \u00b7 stock ' + p.stock + '</p><p class="meta">' + p.desc + '</p><span class="stamp gold">' + (EU_LABEL[p.eu] || "EU Farm to Fork") + '</span><button type="button" class="btn" data-act="buy" data-id="' + p.id + '">Buy and unlock location</button></article>';
  }).join("");
}
function renderMap(origin) {
  const o = origin || S.lastGps || { lat: 39.9334, lng: 32.8597 };
  const frame = $("map-frame");
  if (frame) frame.src = "https://www.openstreetmap.org/export/embed.html?bbox=" + (o.lng - 0.25) + "%2C" + (o.lat - 0.18) + "%2C" + (o.lng + 0.25) + "%2C" + (o.lat + 0.18) + "&layer=mapnik&marker=" + o.lat + "%2C" + o.lng;
  const box = $("farm-cards"); if (!box) return;
  box.innerHTML = FARMS.map((f) => {
    const d = haversine(o.lat, o.lng, f.lat, f.lng) / 1000; const j = jitter(f);
    const n = S.products.filter((p) => p.farmId === f.id && p.stock > 0).length;
    const shot = PHOTOS[f.id] || FALLBACK_SHOT;
    return '<article class="card"><img class="shot" src="' + shot + '" alt="' + f.name + '" /><div class="row"><strong>' + f.name + '</strong><span class="meta">\u2248 ' + d.toFixed(1) + ' km</span></div><p class="meta">' + f.farmer + ' \u00b7 ' + n + ' lots</p><p class="meta">GPS locked \u00b7 ' + j.lat.toFixed(3) + ', ' + j.lng.toFixed(3) + ' offset</p><button type="button" class="btn ghost" data-act="farm-market" data-id="' + f.id + '">See lots</button></article>';
  }).join("");
}
function renderOrders() {
  const box = $("order-list"); if (!box) return;
  if (!S.orders.length) { box.innerHTML = '<div class="lock">No orders yet.</div><button type="button" class="btn" data-act="go" data-go="screen-home">Go to market</button>'; return; }
  box.innerHTML = S.orders.map((o) => {
    const p = productById(o.productId) || { name: "lot" }; const f = farmById(o.farmId);
    const loc = o.unlocked && f ? (f.address + '<br>' + f.lat.toFixed(5) + ', ' + f.lng.toFixed(5) + ' \u00b7 ' + f.phone) : "location locked";
    const shot = shotOf(p);
    return '<article class="card"><img class="shot" src="' + shot + '" alt="' + p.name + '" /><div class="row"><strong>' + p.name + '</strong><span class="price">' + money(o.base) + '</span></div><p class="meta">' + o.status + ' \u00b7 ' + o.id + '</p><p class="meta">withholding ' + money(o.tax) + ' \u00b7 net ' + money(o.net) + ' \u00b7 ' + o.carbon + ' kg CO2</p><p class="meta">' + loc + '</p><p class="meta">NFC: <code>' + o.nfcSecret + '</code></p><button type="button" class="btn ghost" data-act="nfc-fill" data-id="' + o.id + '">Fill NFC form</button></article>';
  }).join("");
}
function renderNotifs() {
  const box = $("notif-list"); if (!box) return;
  box.innerHTML = S.notifs.slice(0, 8).map((n) => '<article class="card"><strong>' + n.title + '</strong><p class="meta">' + n.body + '</p></article>').join("") || '<p class="meta">No notices.</p>';
}
function setRole(role) {
  S.role = role === "FARMER" ? "FARMER" : "CUSTOMER"; save();
  setText("role-label", S.role === "FARMER" ? "Grower" : "Buyer");
  const c = $("role-c"), f = $("role-f");
  if (c && f) { c.classList.toggle("on", S.role === "CUSTOMER"); c.classList.toggle("ghost", S.role !== "CUSTOMER"); f.classList.toggle("on", S.role === "FARMER"); f.classList.toggle("ghost", S.role !== "FARMER"); }
}
function openBuy(pid) {
  const p = productById(pid);
  if (!p) { setHtml("buy-msg", '<div class="err">Lot not found. Return to the stall.</div>'); show("screen-buy"); return; }
  const f = farmById(p.farmId) || { name: "Holding", taxRegistered: false };
  $("buy-pid").value = pid; setText("buy-title", p.name);
  setText("buy-farm", f.name + (f.taxRegistered ? " \u00b7 tax registered" : " \u00b7 unregistered, 2% withholding") + " \u00b7 " + (EU_LABEL[p.eu] || "EU"));
  const hero = $("buy-hero"); const cap = $("buy-cap"); const shot = shotOf(p) || STALL_SHOT;
  if (hero) { hero.src = shot; hero.alt = p.name; }
  if (cap) cap.textContent = p.name + " \u00b7 sealed until settlement";
  $("buy-qty").value = 1; $("buy-form").classList.remove("hidden"); $("buy-empty-go").classList.add("hidden"); setHtml("buy-msg", ""); quoteBuy(); show("screen-buy");
}
function quoteBuy() {
  const p = productById(($("buy-pid") || {}).value); if (!p) return;
  const f = farmById(p.farmId); const qty = Math.max(1, Number(($("buy-qty") || {}).value || 1)); const base = p.price * qty; const tax = stopaj(f, base); const km = Number(($("buy-km") || {}).value || 6); const co2 = carbonKg(km);
  setHtml("quote-box", '<div class="quote"><div class="line"><span>Amount</span><span>' + money(base) + '</span></div><div class="line"><span>Withholding ' + (tax.rate ? "%" + (tax.rate * 100) : "none") + '</span><span>' + money(tax.tax) + '</span></div><div class="line"><span>Grower net</span><span>' + money(tax.net) + '</span></div><div class="line"><span>Carbon \u00b7 EU F2F</span><span>' + co2 + ' kg</span></div></div>');
}
async function payNow() {
  const p = productById(($("buy-pid") || {}).value);
  if (!p) { setHtml("buy-msg", '<div class="err">Choose a lot at the stall first.</div>'); return; }
  const f = farmById(p.farmId); const qty = Math.max(1, Number(($("buy-qty") || {}).value || 1));
  if (qty > p.stock) { setHtml("buy-msg", '<div class="err">Not enough stock (' + p.stock + ')</div>'); return; }
  const pan = String(($("buy-pan") || {}).value || "").replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(pan)) { setHtml("buy-msg", '<div class="err">Invalid card number</div>'); return; }
  if (pan.endsWith("3")) { setHtml("buy-msg", '<div class="err">Simulated decline: last digit 3. Try 4242\u20262.</div>'); return; }
  const base = p.price * qty; const tax = stopaj(f, base); const km = Number(($("buy-km") || {}).value || 6);
  const secret = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const order = { id: "gp" + Date.now().toString(36), productId: p.id, farmId: f.id, qty: qty, base: base, tax: tax.tax, net: tax.net, carbon: carbonKg(km), km: km, status: "PAID", nfcSecret: secret, unlocked: true, createdAt: new Date().toISOString() };
  p.stock -= qty; S.orders.unshift(order); save();
  if ($("nfc-order")) $("nfc-order").value = order.id; if ($("nfc-secret")) $("nfc-secret").value = secret;
  setHtml("buy-msg", '<div class="ok">Paid. European Union traceability slip issued. Location unlocked.<br><b>' + f.name + '</b><br>' + f.address + '<br>' + f.lat.toFixed(5) + ', ' + f.lng.toFixed(5) + '<br>Tel: ' + f.phone + '<br>NFC secret: <code>' + secret + '</code><br>Order: <code>' + order.id + '</code></div><button type="button" class="btn" data-act="go" data-go="screen-more">Open dossier</button><button type="button" class="btn ghost" data-act="go" data-go="screen-farm">Go to NFC handover</button>');
  renderMarket(); renderOrders();
}
function useGps() {
  setHtml("geo-msg", '<div class="note">Requesting location\u2026</div>');
  if (!navigator.geolocation) { setHtml("geo-msg", '<div class="err">This browser will not share location.</div>'); return; }
  navigator.geolocation.getCurrentPosition(function(pos) { const o = { lat: pos.coords.latitude, lng: pos.coords.longitude }; S.lastGps = o; save(); renderMap(o); scanFence(o); }, function(err) { setHtml("geo-msg", '<div class="err">Location permission required. Code ' + (err && err.code ? err.code : "?") + '. Retry over HTTPS.</div>'); }, { enableHighAccuracy: true, timeout: 12000 });
}
function simulateNear() { const f = farmById("kizilay"); const o = { lat: f.lat + 0.0008, lng: f.lng + 0.0004 }; S.lastGps = o; save(); renderMap(o); scanFence(o); }
function scanFence(o) {
  const hits = []; S.products.forEach((p) => { const f = farmById(p.farmId); if (!f || p.stock <= 0) return; const m = haversine(o.lat, o.lng, f.lat, f.lng); if (m <= FENCE_M) hits.push({ p: p, f: f, m: m }); });
  let sent = 0; hits.forEach((h) => { if (S.fenceSeen[h.p.id]) return; S.fenceSeen[h.p.id] = true; S.notifs.unshift({ t: Date.now(), title: h.p.name + " ready", body: h.f.name + " " + Math.round(h.m) + " m \u00b7 EU F2F" }); sent += 1; }); save();
  setHtml("geo-msg", hits.length ? ('<div class="ok">' + hits.length + ' lots inside 300 m. ' + sent + ' new notice(s).</div>' + hits.map((h) => '<p class="meta">' + h.p.name + ' \u00b7 ' + Math.round(h.m) + ' m \u00b7 ' + h.f.name + '</p>').join("")) : '<div class="lock">No active harvest inside 300 m. Try \u201cI am at the stall\u201d for the Kizilay pop-up.</div>');
  renderNotifs();
  if (sent && "Notification" in window && Notification.permission === "granted") { try { new Notification(S.notifs[0].title, { body: S.notifs[0].body }); } catch (e) {} }
}
async function askPush() {
  if (!("Notification" in window)) { setHtml("geo-msg", '<div class="err">Notifications API missing.</div>'); return; }
  try { const perm = await Notification.requestPermission(); setHtml("geo-msg", '<div class="ok">Notification permission: ' + perm + '</div>'); } catch (e) { setHtml("geo-msg", '<div class="err">Permission request failed.</div>'); }
}
function publishHarvest() {
  const name = (($("h-name") || {}).value || "").trim(); const price = Number(($("h-price") || {}).value); const stock = Number(($("h-stock") || {}).value);
  if (name.length < 2 || !(price > 0) || !(stock >= 0)) { setHtml("h-msg", '<div class="err">Name, price and stock are required.</div>'); return; }
  const item = { id: "u" + Date.now().toString(36), farmId: "golbasi", name: name, desc: ($("h-desc") || {}).value || "Today's harvest", price: price, stock: stock, cat: ($("h-cat") || {}).value || "Fruit", eu: ($("h-eu") || {}).value || "organic", photo: S.harvestPhoto || "" };
  S.products.unshift(item); save();
  setHtml("h-msg", '<div class="ok">On the stall. EU mark: ' + EU_LABEL[item.eu] + '.</div><button type="button" class="btn" data-act="go" data-go="screen-home">See it at market</button>');
  renderMarket();
}
function onPhoto(input) {
  const file = input && input.files && input.files[0]; if (!file) return;
  const reader = new FileReader(); reader.onload = function() { S.harvestPhoto = reader.result; save(); const img = $("h-preview"); if (img) { img.src = reader.result; img.classList.remove("hidden"); } }; reader.readAsDataURL(file);
}
async function nfcTap() {
  const orderId = (($("nfc-order") || {}).value || "").trim(); const secret = (($("nfc-secret") || {}).value || "").trim();
  const o = S.orders.find((x) => x.id === orderId);
  if (!o) { setHtml("nfc-msg", '<div class="err">Order not found. Use Fill NFC form in the dossier.</div>'); return; }
  if (o.nfcSecret !== secret) { setHtml("nfc-msg", '<div class="err">NFC secret does not match.</div>'); return; }
  const mac = (await shaHex(secret + "." + orderId)).slice(0, 16); o.status = "COMPLETED"; o.nfcMac = mac; save();
  setHtml("nfc-msg", '<div class="ok">HMAC ' + mac + ' verified. Handover COMPLETED. EU traceability closed.</div>'); renderOrders();
}
function fillNfc(id) {
  const o = S.orders.find((x) => x.id === id); if (!o) return;
  if ($("nfc-order")) $("nfc-order").value = o.id; if ($("nfc-secret")) $("nfc-secret").value = o.nfcSecret;
  show("screen-farm"); setHtml("nfc-msg", '<div class="ok">Secret pasted. Tap Tap and verify.</div>');
}
function resetDemo() { try { localStorage.removeItem(KEY); } catch (e) {} S = blank(); boot(); }
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
  else if (act === "farm-market") { show("screen-home"); setHtml("geo-msg", ""); }
}
function boot() {
  setRole(S.role || "CUSTOMER"); renderMarket(); renderMap(S.lastGps); renderOrders(); renderNotifs();
  if (S.harvestPhoto && $("h-preview")) { $("h-preview").src = S.harvestPhoto; $("h-preview").classList.remove("hidden"); }
  const hasPid = $("buy-pid") && $("buy-pid").value;
  if ($("buy-form")) $("buy-form").classList.toggle("hidden", !hasPid);
  if ($("buy-empty-go")) $("buy-empty-go").classList.toggle("hidden", !!hasPid);
  show("screen-home");
}
document.addEventListener("click", function(e) {
  const rail = e.target.closest && e.target.closest(".rail button[data-go]");
  if (rail) { e.preventDefault(); show(rail.getAttribute("data-go")); return; }
  const btn = e.target.closest && e.target.closest("[data-act]");
  if (!btn) return; e.preventDefault(); onAct(btn.getAttribute("data-act"), btn);
});
const qty = $("buy-qty"); const km = $("buy-km");
if (qty) qty.addEventListener("input", quoteBuy);
if (km) km.addEventListener("input", quoteBuy);
const file = $("h-file"); if (file) file.addEventListener("change", function() { onPhoto(file); });
const pagerEl = $("pager");
if (pagerEl) pagerEl.addEventListener("scroll", function() { const pages = [].slice.call(pagerEl.querySelectorAll(".page")); const i = Math.round(pagerEl.scrollLeft / Math.max(pagerEl.clientWidth, 1)); const id = pages[i] && pages[i].id; if (!id) return; document.querySelectorAll(".rail button").forEach(function(b) { b.classList.toggle("on", b.getAttribute("data-go") === id); }); }, { passive: true });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(function() {});
boot();
