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

  // ---- feedback form (docs/feedback.html): posts to the Worker of worker/feedback, falls back to e-mail ----
  var fb = $('#fbForm');
  if (fb) {
    var API = 'https://api.oldpaddeck.com/feedback', MAIL = 'hello@oldpaddeck.com';
    var q = {};
    location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
      var i = kv.indexOf('='); if (i < 1) return;
      try { q[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); } catch (e) {}
    });
    var tag = function (v) { return /^[0-9A-Za-z][0-9A-Za-z. _-]{0,23}$/.test(v || '') ? v : ''; };
    var version = tag(q.v), os = tag(q.os);
    var msg = $('#fbMessage'), mail = $('#fbEmail'), send = $('#fbSend'), err = $('#fbError'), meta = $('#fbMeta');
    var kindOf = function () { var c = $('input[name="kind"]:checked', fb); return c ? c.value : 'other'; };
    if (/^(thanks|idea|problem)$/.test(q.kind || '')) $('input[name="kind"][value="' + q.kind + '"]', fb).checked = true;
    if (version) { meta.textContent = 'Sent with your message: OldPadDeck ' + version + (os ? ' · macOS ' + os : '') + '.'; meta.hidden = false; }
    var fail = function (text, withMail) {
      err.textContent = text;
      if (withMail) {
        var a = document.createElement('a');
        a.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('OldPadDeck feedback') + '&body=' + encodeURIComponent(msg.value.slice(0, 1500));
        a.textContent = MAIL;
        err.appendChild(document.createTextNode(' You can also write to '));
        err.appendChild(a);
        err.appendChild(document.createTextNode('.'));
      }
      err.hidden = false; send.disabled = false; send.textContent = 'Send';
    };
    fb.addEventListener('submit', function (ev) {
      ev.preventDefault();
      err.hidden = true;
      var text = msg.value.replace(/^\s+|\s+$/g, ''), email = mail.value.replace(/^\s+|\s+$/g, '');
      if (!text) { fail('Write a few words first.'); msg.focus(); return; }
      if (email && !(mail.checkValidity ? mail.checkValidity() : /@/.test(email))) { fail('That e-mail address doesn’t look right. Fix it, or leave the field empty.'); mail.focus(); return; }
      if (!window.fetch) { fail('This browser can’t send the form.', true); return; }
      send.disabled = true; send.textContent = 'Sending…';
      var body = { kind: kindOf(), message: text, email: email, version: version, os: os, website: $('#fbWebsite').value };
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { return { status: r.status, d: d || {} }; }, function () { return { status: r.status, d: {} }; }); })
        .then(function (r) {
          if (r.status === 200 && r.d.ok) {
            $('#fbDoneText').textContent = email ? 'Your message is on its way. If it calls for an answer, it will come to ' + email + '.' : 'Your message is on its way.';
            fb.hidden = true; var done = $('#fbDone'); done.hidden = false;
            if (done.scrollIntoView) done.scrollIntoView({ block: 'center' });
          } else if (r.d.error === 'bad_email') { fail('That e-mail address doesn’t look right. Fix it, or leave the field empty.'); }
          else if (r.d.error === 'too_long') { fail('That message is too long for the form (4,000 characters).', true); }
          else if (r.d.error === 'rate_limited') { fail('That’s a lot of messages in one minute. Try again in a moment.'); }
          else { fail('The message couldn’t be sent.', true); }
        }, function () { fail('The message couldn’t be sent: check your connection.', true); });
    });
  }
})();
