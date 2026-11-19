(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  root.setAttribute('data-ready', '');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header: transparent over the hero, solid cream after scrolling */
  var hdr = $('.hdr');
  if (hdr && !hdr.hasAttribute('data-solid')) {
    var onScroll = function () { hdr.classList.toggle('solid', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* dialogs */
  function openDlg(dlg) { if (!dlg) return; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  function closeDlg(dlg) { if (!dlg) return; if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  $$('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDlg(dlg); });
    $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { closeDlg(dlg); }); });
  });
  $$('[data-ar]').forEach(function (b) {
    b.addEventListener('click', function () { closeDlg($('#drawer')); openDlg($('#arDialog')); });
  });
  $$('[data-sheet]').forEach(function (b) {
    b.addEventListener('click', function () { openDlg($('#callSheet')); });
  });
  var burger = $('.burger'), drawer = $('#drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () { openDlg(drawer); burger.setAttribute('aria-expanded', 'true'); });
    drawer.addEventListener('close', function () { burger.setAttribute('aria-expanded', 'false'); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { closeDlg(drawer); }); });
  }

  /* one gentle fade per whole section, triggered early */
  var rv = $$('.rv');
  if (rv.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.02, rootMargin: '0px 0px 15% 0px' });
      rv.forEach(function (e) { io.observe(e); });
    } else { rv.forEach(function (e) { e.classList.add('in'); }); }
  }

  /* phone bottom bar: hides on scroll down, over the plan block and over the footer */
  var bar = $('.bar');
  if (bar) {
    var lastY = window.scrollY, hideBy = {}, anyHide = function () { return Object.keys(hideBy).some(function (k) { return hideBy[k]; }); };
    var down = false;
    var apply = function () { bar.classList.toggle('hide', down || anyHide()); };
    window.addEventListener('scroll', function () {
      var y = window.scrollY, dy = y - lastY;
      if (Math.abs(dy) > 6) { down = dy > 0 && y > 120; lastY = y; apply(); }
    }, { passive: true });
    ['#plan', '.footer'].forEach(function (sel) {
      var el = $(sel); if (!el || !('IntersectionObserver' in window)) return;
      new IntersectionObserver(function (es) { hideBy[sel] = es[0].isIntersecting; apply(); }, { threshold: 0.02 }).observe(el);
    });
  }

  /* menu chips: scroll-spy */
  var chips = $('.chips');
  if (chips) {
    var links = $$('a', chips), groups = links.map(function (a) { return $(a.getAttribute('href')); });
    var setActive = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        if (on) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
        if (on && chips.scrollWidth > chips.clientWidth) {
          var l = a.offsetLeft - (chips.clientWidth - a.offsetWidth) / 2;
          if (chips.scrollTo) chips.scrollTo({ left: l, behavior: reduce ? 'auto' : 'smooth' }); else chips.scrollLeft = l;
        }
      });
    };
    var spy = function () {
      var line = (parseInt(getComputedStyle(root).getPropertyValue('--hh')) || 64) + (parseInt(getComputedStyle(root).getPropertyValue('--chips-h')) || 56) + 40;
      var cur = null;
      groups.forEach(function (g) { if (g && g.getBoundingClientRect().top <= line) cur = g; });
      if (cur) setActive(cur.id); else links.forEach(function (a) { a.removeAttribute('aria-current'); });
    };
    var tick = false;
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; spy(); }); } }, { passive: true });
    spy();
  }

  /* plan a table */
  var form = $('#planForm');
  if (form) {
    var BR = {
      'open-air': { name: 'Open Air Mall, Madinaty', tel: '+201103351699', disp: '011 03351699', wa: '201103351699', open: 540, close: 1440, hours: 'Open 9 AM to 12 AM, every day.' },
      'leven': { name: 'Leven Square, New Cairo', tel: '+201500103312', disp: '015 00103312', wa: '201500103312', open: 540, close: 1410, hours: 'Open 9 AM to 11:30 PM, every day.' },
      'strip': { name: 'The Strip Mall, Madinaty', tel: '+201500103358', disp: '015 00103358', wa: '201500103358', open: 540, close: 1395, closeLate: 1425, lateDays: [4, 5], hours: 'Open 9 AM to 11:15 PM (Thursday and Friday to 11:45 PM).' }
    };
    var f = form.elements, selBranch = f.branch, selTime = f.time, inDate = f.date, guests = 2;
    var out = $('#guestsOut'), callBtn = $('#planCall'), meta = $('#planMeta');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var fmt = function (m) { var h = Math.floor(m / 60) % 24, mm = m % 60, ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12; return h12 + ':' + pad(mm) + ' ' + ap; };
    var today = new Date(); inDate.min = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    var parseDate = function () { var v = inDate.value; if (!v) return null; var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
    var buildTimes = function () {
      var b = BR[selBranch.value], dt = parseDate(), close = b.close;
      if (b.closeLate && dt && b.lateDays.indexOf(dt.getDay()) > -1) close = b.closeLate;
      var keep = selTime.value, now = new Date(), isToday = dt && dt.toDateString() === now.toDateString(), nowM = now.getHours() * 60 + now.getMinutes();
      selTime.innerHTML = '<option value="">Choose a time</option>';
      for (var t = b.open; t <= close - 60; t += 30) {
        var o = d.createElement('option'); o.value = fmt(t); o.textContent = fmt(t);
        if (isToday && t <= nowM) o.disabled = true;
        selTime.appendChild(o);
      }
      if (keep) { var m = $$('option', selTime).filter(function (o) { return o.value === keep && !o.disabled; })[0]; if (m) selTime.value = keep; }
    };
    var syncBranch = function () {
      var b = BR[selBranch.value];
      callBtn.href = 'tel:' + b.tel; callBtn.querySelector('span').textContent = 'Call ' + b.disp;
      meta.textContent = b.hours; buildTimes();
    };
    selBranch.addEventListener('change', syncBranch);
    inDate.addEventListener('change', buildTimes);
    $$('[data-step]', form).forEach(function (b) {
      b.addEventListener('click', function () { guests = Math.max(1, Math.min(20, guests + (+b.getAttribute('data-step')))); out.textContent = guests; });
    });
    var setErr = function (el, id, msg) {
      var e = $('#' + id); e.textContent = msg || '';
      if (msg) { el.setAttribute('aria-invalid', 'true'); } else { el.removeAttribute('aria-invalid'); }
    };
    ['name', 'date', 'time'].forEach(function (k) {
      f[k].addEventListener('blur', function () { if (f[k].value.trim()) setErr(f[k], 'err-' + k, ''); });
      f[k].addEventListener('input', function () { if (f[k].value.trim()) setErr(f[k], 'err-' + k, ''); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      if (!f.name.value.trim()) { setErr(f.name, 'err-name', 'Add a name for the table.'); ok = false; first = first || f.name; }
      if (!f.date.value) { setErr(f.date, 'err-date', 'Choose a date.'); ok = false; first = first || f.date; }
      if (!f.time.value) { setErr(f.time, 'err-time', 'Choose a time.'); ok = false; first = first || f.time; }
      if (!ok) { first.focus(); return; }
      var b = BR[selBranch.value], dt = parseDate();
      var occ = (form.querySelector('input[name="occasion"]:checked') || {}).value;
      var lines = ['Hello Brisk & Brew ' + b.name + ', I would like to plan a table.',
        'Name: ' + f.name.value.trim(),
        'Date: ' + dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
        'Time: ' + f.time.value,
        'Guests: ' + guests];
      if (occ) lines.push('Occasion: ' + occ);
      if (f.note.value.trim()) lines.push('Note: ' + f.note.value.trim());
      var url = 'https://wa.me/' + b.wa + '?text=' + encodeURIComponent(lines.join('\n'));
      form.setAttribute('data-last-url', url);
      var w = window.open(url, '_blank', 'noopener');
      if (!w) { location.href = url; }
    });
    syncBranch();
  }

  /* Ahmed's signature */
  (function () { var a = document.querySelector('a.sig'); if (!a) return; function play() { a.classList.remove('on'); void a.getBoundingClientRect(); a.classList.add('on') } a.addEventListener('mouseenter', function () { if (!a.classList.contains('on')) play() }); if (!matchMedia('(hover: none)').matches || !('IntersectionObserver' in window)) return; var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(play, 400) } }, { threshold: .9 }); io.observe(a) })();
})();
