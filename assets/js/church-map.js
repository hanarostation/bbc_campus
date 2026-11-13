/* 연락하기 · 교회 지도 (Leaflet + OpenStreetMap 타일, API 키 불필요) */
(function () {
  "use strict";
  var el = document.getElementById("church-map");
  var dataEl = document.getElementById("church-data");
  if (!el || !dataEl || typeof L === "undefined") { if (el) el.classList.add("map-off"); return; }

  var DATA = JSON.parse(dataEl.textContent);
  var root = document.documentElement;
  var KOREA = L.latLngBounds([33.1, 125.0], [38.6, 130.0]);

  var map = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true, minZoom: 2, zoomSnap: 0.25 });
  map.fitBounds(KOREA);
  el.addEventListener("click", function () { map.scrollWheelZoom.enable(); });
  el.addEventListener("mouseleave", function () { map.scrollWheelZoom.disable(); });

  /* 타일: 테마에 맞춰 밝은/어두운 지도 */
  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  /* 지도 타일 (API 키 불필요)
     1순위: OpenStreetMap — 한글 지명 표시. 다크 모드에서는 CSS로 어둡게 처리
     2순위: Esri — OSM 타일이 막힐 때 자동 전환 (예: 파일을 직접 열어 Referer가 없는 경우) */
  var OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
  var ESRI_ATTR = 'Tiles &copy; Esri';
  var tiles = null, provider = "osm";
  function makeLayer() {
    if (provider === "osm") {
      return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: OSM_ATTR });
    }
    var svc = isDark() ? "Canvas/World_Dark_Gray_Base" : "World_Street_Map";
    return L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/" + svc + "/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16, attribution: ESRI_ATTR });
  }
  function setTiles() {
    el.classList.toggle("map-dark", isDark() && provider === "osm");
    var key = provider + (provider === "esri" && isDark() ? "-dark" : "");
    if (tiles && tiles._key === key) return;
    if (tiles) map.removeLayer(tiles);
    tiles = makeLayer();
    tiles._key = key;
    var errs = 0;
    tiles.on("tileerror", function () {
      if (provider !== "osm") return;
      if (++errs === 4) { provider = "esri"; setTiles(); }
    });
    tiles.addTo(map);
  }
  setTiles();
  new MutationObserver(setTiles).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(setTiles);
  }

  /* 마커 */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var pinIcon = L.divIcon({ className: "pin", html: "<span></span>", iconSize: [26, 34], iconAnchor: [13, 32], popupAnchor: [0, -28] });
  var markers = {};
  DATA.forEach(function (c) {
    if (c.lat == null) return;
    var links = "";
    if (c.url) links += '<a href="' + esc(c.url) + '"' + (c.url.indexOf("tel:") === 0 ? "" : ' target="_blank" rel="noopener"') + ">" + esc(c.label) + "</a>";
    links += '<a href="' + esc(c.map) + '" target="_blank" rel="noopener">' + (c.overseas ? "구글 지도" : "네이버 지도") + "</a>";
    var m = L.marker([c.lat, c.lng], { icon: pinIcon, title: c.name, keyboard: true })
      .bindPopup('<div class="pop"><b>' + esc(c.name) + "</b><span>" + esc(c.pastor) + "</span><p>" + esc(c.addr) + (c.approx ? '<em>지도상 위치는 대략적입니다</em>' : "") + '</p><div class="pop-links">' + links + "</div></div>");
    m.addTo(map);
    markers[c.id] = m;
  });

  /* 첫 화면: 국내 교회 전체가 보이도록 */
  var dom = DATA.filter(function (c) { return !c.overseas && c.lat != null; }).map(function (c) { return [c.lat, c.lng]; });
  if (dom.length) map.fitBounds(L.latLngBounds(dom).pad(0.08));

  /* 목록 ↔ 지도 연동 */
  function cardOf(id) { return document.querySelector('.ccard[data-id="' + id + '"]'); }
  function syncMarkers(fit) {
    var bounds = [];
    DATA.forEach(function (c) {
      var m = markers[c.id]; if (!m) return;
      var card = cardOf(c.id);
      var show = card && !card.hidden;
      if (show) { if (!map.hasLayer(m)) m.addTo(map); bounds.push(m.getLatLng()); }
      else if (map.hasLayer(m)) map.removeLayer(m);
    });
    if (fit && bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(0.15), { maxZoom: 14 });
  }
  document.addEventListener("churches:filtered", function (e) { syncMarkers(e.detail && e.detail.fit); });

  document.querySelectorAll(".ccard [data-focus]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var m = markers[btn.getAttribute("data-focus")]; if (!m) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      map.flyTo(m.getLatLng(), 15, { duration: 0.8 });
      setTimeout(function () { m.openPopup(); }, 850);
    });
  });

  /* 내 위치 기반 */
  var locBtn = document.getElementById("locate-btn");
  var status = document.getElementById("map-status");
  var nearWrap = document.getElementById("near-list");
  var meMarker = null;

  function km(a, b) {
    var R = 6371, d2r = Math.PI / 180;
    var dLat = (b[0] - a[0]) * d2r, dLng = (b[1] - a[1]) * d2r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * d2r) * Math.cos(b[0] * d2r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function fmt(d) { return d < 1 ? Math.round(d * 1000) + "m" : (d < 10 ? d.toFixed(1) : Math.round(d)) + "km"; }

  function showNearby(pos) {
    var me = [pos.coords.latitude, pos.coords.longitude];
    if (meMarker) map.removeLayer(meMarker);
    meMarker = L.marker(me, { icon: L.divIcon({ className: "me", html: "<span></span>", iconSize: [18, 18], iconAnchor: [9, 9] }), title: "내 위치", zIndexOffset: 1000 }).addTo(map);

    var list = DATA.filter(function (c) { return c.lat != null; }).map(function (c) {
      return { c: c, d: km(me, [c.lat, c.lng]) };
    }).sort(function (a, b) { return a.d - b.d; });

    document.querySelectorAll(".ccard .dist").forEach(function (n) { n.remove(); });
    list.forEach(function (o) {
      var card = cardOf(o.c.id); if (!card) return;
      var s = document.createElement("span"); s.className = "dist"; s.textContent = fmt(o.d);
      card.querySelector("h4").appendChild(s);
    });

    var top = list.slice(0, 6);
    if (nearWrap) {
      var grid = nearWrap.querySelector(".cgrid");
      grid.innerHTML = "";
      top.forEach(function (o) {
        var card = cardOf(o.c.id);
        if (card) {
          var clone = card.cloneNode(true);
          clone.hidden = false;
          clone.removeAttribute("data-search");
          clone.removeAttribute("data-id");
          clone.querySelectorAll("[data-focus]").forEach(function (b) {
            b.addEventListener("click", function () {
              var m = markers[b.getAttribute("data-focus")];
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              map.flyTo(m.getLatLng(), 15, { duration: 0.8 });
              setTimeout(function () { m.openPopup(); }, 850);
            });
          });
          grid.appendChild(clone);
        }
      });
      nearWrap.hidden = false;
    }
    var pts = [me].concat(top.slice(0, 3).map(function (o) { return [o.c.lat, o.c.lng]; }));
    map.fitBounds(L.latLngBounds(pts).pad(0.25), { maxZoom: 14 });
    if (status) status.textContent = top.length ? "가장 가까운 교회: " + top[0].c.name + " (" + fmt(top[0].d) + ")" : "";
  }

  if (locBtn) {
    if (!("geolocation" in navigator)) { locBtn.hidden = true; }
    locBtn.addEventListener("click", function () {
      if (status) status.textContent = "현재 위치를 확인하는 중입니다…";
      locBtn.disabled = true;
      navigator.geolocation.getCurrentPosition(function (pos) {
        locBtn.disabled = false; showNearby(pos);
      }, function () {
        locBtn.disabled = false;
        if (status) status.textContent = "위치 정보를 가져올 수 없습니다. 브라우저의 위치 권한을 확인해 주세요.";
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    });
  }
})();
