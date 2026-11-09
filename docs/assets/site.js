/* OldPadDeck website: nav, scroll reveal, copy buttons, the hero mode switcher, the docs table of contents
   and the live demo (the real iPad interface talking to the mock Mac server from web/mock). */
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
    // The mock Mac (web/mock/server.mjs) runs on this machine; `#pair=123456` pairs the demo by itself.
    // same host as this page, so the iframe's pairing cookie is first-party (localhost and 127.0.0.1 are different sites)
    var base = location.protocol === 'file:' ? 'http://localhost:' + demo.getAttribute('data-port') + '/'
      : location.protocol + '//' + location.hostname + ':' + demo.getAttribute('data-port') + '/';
    var frame = $('iframe', demo), vp = $('.viewport', demo), off = $('.demo-off', demo), status = $('#demoStatus');
    var fit = function () {
      var w = vp.clientWidth, h = vp.clientHeight, k = Math.min(w / 1024, h / 768);
      frame.style.transform = 'scale(' + k + ')';
      frame.style.left = (w - 1024 * k) / 2 + 'px'; frame.style.top = (h - 768 * k) / 2 + 'px';
    };
    var load = function () { frame.src = base + '#pair=123456'; };
    var setStatus = function (ok) {
      status.className = 'status ' + (ok ? 'ok' : 'ko');
      status.lastChild.textContent = ok ? 'Live: connected to a simulated Mac' : 'Demo server offline';
      off.classList.toggle('show', !ok);
    };
    var probe = function () {
      // no-cors: an opaque answer still means the server is up
      return fetch(base + 'apple-touch-icon.png', { mode: 'no-cors', cache: 'no-store' }).then(function () { return true; }, function () { return false; });
    };
    window.addEventListener('resize', fit); fit();
    probe().then(function (ok) { setStatus(ok); if (ok) load(); });
    $('#demoReload').addEventListener('click', function () { probe().then(function (ok) { setStatus(ok); if (ok) load(); }); });
    $('#demoOpen').setAttribute('href', base + '#pair=123456');
    $('#demoFull').addEventListener('click', function () {
      var el = vp;
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el);
    });
    document.addEventListener('fullscreenchange', function () { setTimeout(fit, 50); });
    document.addEventListener('webkitfullscreenchange', function () { setTimeout(fit, 50); });
  }
})();
