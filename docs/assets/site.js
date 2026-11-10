/* OldPadDeck website: nav, scroll reveal, copy buttons, the hero mode switcher, the docs table of contents
   and the live demo (the real iPad interface with a simulated Mac running in the page, docs/demo-app). */
(function () {
  var root = document.documentElement;
  root.className += ' js';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  // ---- nav ----
  var nav = $('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    var burger = $('.burger', nav);
    if (burger) burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ---- reveal on scroll ----
  var items = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- copy buttons ----
  var icon = function (id) { return '<svg class="i" width="16" height="16"><use href="assets/icons.svg#' + id + '"/></svg>'; };
  $$('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = b.getAttribute('data-copy');
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(txt).then(function () {
        b.classList.add('done'); b.innerHTML = icon('check');
        setTimeout(function () { b.classList.remove('done'); b.innerHTML = icon('copy'); }, 1600);
      }, function () {});
    });
  });

  // ---- hero mode switcher ----
  var seg = $('#seg');
  if (seg) {
    var tabs = $$('button', seg), imgs = $$('#screen > img'), ind = $('#segInd'), cap = $('#caption');
    var cur = 0, timer = null, visible = true;
    var place = function () { var t = tabs[cur]; ind.style.width = t.offsetWidth + 'px'; ind.style.transform = 'translateX(' + t.offsetLeft + 'px)'; };
    var show = function (i) {
      cur = i;
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); imgs[k].classList.toggle('on', k === i); });
      cap.innerHTML = tabs[i].getAttribute('data-caption');
      place();
      if (seg.scrollWidth > seg.clientWidth) seg.scrollLeft = tabs[i].offsetLeft - (seg.clientWidth - tabs[i].offsetWidth) / 2;
    };
    var stop = function () { clearInterval(timer); timer = null; };
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { stop(); show(i); }); });
    seg.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      stop(); show((cur + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length); tabs[cur].focus();
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe($('#screen'));
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    show(0);
    if (!reduce) timer = setInterval(function () { if (visible) show((cur + 1) % tabs.length); }, 4500);
  }

  // ---- docs table of contents: highlight the section in view ----
  var toc = $$('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var byId = {};
    toc.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        toc.forEach(function (a) { a.classList.remove('on'); });
        var a = byId[e.target.id]; if (a) a.classList.add('on');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  // ---- live demo ----
  var demo = $('#demo');
  if (demo) {
    // demo-app/ is the real iPad client with a simulated Mac running inside the page (web/src/demo): static files only.
    var base = demo.getAttribute('data-src');
    var frame = $('iframe', demo), vp = $('.viewport', demo), off = $('.demo-off', demo), status = $('#demoStatus');
    var fit = function () {
      var w = vp.clientWidth, h = vp.clientHeight, k = Math.min(w / 1024, h / 768);
      frame.style.transform = 'scale(' + k + ')';
      frame.style.left = (w - 1024 * k) / 2 + 'px'; frame.style.top = (h - 768 * k) / 2 + 'px';
    };
    var setStatus = function (ok) {
      status.className = 'status ' + (ok ? 'ok' : 'ko');
      status.lastChild.textContent = ok ? 'Live: a simulated Mac, running in your browser' : 'Demo unavailable';
      off.classList.toggle('show', !ok);
    };
    // The deck (.app, after the splash) shows up once the bundle is in: watch for it rather than judge once, so a slow
    // connection doesn't leave "didn't start" over a demo that works.
    var watch = null;
    var check = function () {
      var tries = 0;
      clearInterval(watch);
      watch = setInterval(function () {
        var d = null, ok = false;
        try { d = frame.contentDocument; ok = !!(d && d.querySelector('.app')); } catch (e) { ok = true; /* can't look inside: assume fine */ }
        if (ok) { clearInterval(watch); setStatus(true); }
        else if (++tries >= 40) { clearInterval(watch); setStatus(false); }   // 20 s
      }, 500);
    };
    var load = function () { off.classList.remove('show'); frame.src = base + '?t=' + Date.now(); check(); };
    load();
    window.addEventListener('resize', fit); fit();
    $('#demoReload').addEventListener('click', load);
    $('#demoOpen').setAttribute('href', base);
    // iPhone Safari has no element fullscreen: don't offer a button that does nothing
    if (!(vp.requestFullscreen || vp.webkitRequestFullscreen)) $('#demoFull').style.display = 'none';
    $('#demoFull').addEventListener('click', function () {
      var el = vp;
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el);
    });
    document.addEventListener('fullscreenchange', function () { setTimeout(fit, 50); });
    document.addEventListener('webkitfullscreenchange', function () { setTimeout(fit, 50); });
  }
})();
