/* Save 119 · site script */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.remove("no-js");

  /* ----- 다크/라이트 모드 ----- */
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }
  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store("theme", next);
      btn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
    });
    btn.setAttribute("aria-pressed", currentTheme() === "dark" ? "true" : "false");
  });

  /* ----- 모바일 메뉴 ----- */
  var menuBtn = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      header.classList.toggle("is-solid", open || window.scrollY > 40);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ----- 헤더: 스크롤 시 배경 ----- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header || header.classList.contains("no-hero")) return;
    header.classList.toggle("is-solid", window.scrollY > 40 || (nav && nav.classList.contains("is-open")));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ----- 등장 애니메이션 ----- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ----- 연락하기: 지역 필터 & 검색 ----- */
  var finder = document.getElementById("finder");
  if (finder) {
    var chips = finder.querySelectorAll(".chip");
    var q = finder.querySelector("#church-search");
    var regions = finder.querySelectorAll(".region:not(#near-list)");
    var empty = finder.querySelector(".empty");
    var active = "all";
    function apply(fit) {
      var term = (q.value || "").trim().toLowerCase();
      var shown = 0;
      regions.forEach(function (sec) {
        var inRegion = active === "all" || sec.dataset.region === active;
        var n = 0;
        sec.querySelectorAll(".ccard").forEach(function (c) {
          var ok = inRegion && (!term || c.dataset.search.indexOf(term) !== -1);
          c.hidden = !ok; if (ok) n++;
        });
        sec.hidden = n === 0; shown += n;
      });
      if (empty) empty.style.display = shown ? "none" : "block";
      document.dispatchEvent(new CustomEvent("churches:filtered", { detail: { fit: fit } }));
    }
    chips.forEach(function (ch) {
      ch.addEventListener("click", function () {
        active = ch.dataset.filter;
        chips.forEach(function (c) { c.setAttribute("aria-pressed", c === ch ? "true" : "false"); });
        apply(true);
      });
    });
    var t;
    q.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { apply(!!q.value.trim()); }, 250); });
  }

  /* ----- 신앙 선언: 모두 펼치기/접기 ----- */
  document.querySelectorAll("[data-creed]").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.dataset.creed === "open";
      document.querySelectorAll(".creed details").forEach(function (d) { d.open = open; });
    });
  });
})();
