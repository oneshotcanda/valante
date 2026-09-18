/* VALENTE — site behaviour */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Sticky header state ---- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile navigation ---- */
  var burger = document.querySelector('.burger');
  var drawer = document.querySelector('.mobile-nav');
  if (burger && drawer) {
    var toggleNav = function (open) {
      burger.classList.toggle('is-open', open);
      drawer.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-locked', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    burger.addEventListener('click', function () {
      toggleNav(!drawer.classList.contains('is-open'));
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { toggleNav(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') toggleNav(false);
    });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---- V-Rail: fill the track, light the nodes in sequence ---- */
  document.querySelectorAll('.rail').forEach(function (rail) {
    var track = rail.querySelector('.rail-track');
    var steps = rail.querySelectorAll('.rail-step');
    var run = function () {
      if (track) track.style.setProperty('--fill', '100%');
      steps.forEach(function (step, i) {
        setTimeout(function () { step.classList.add('is-lit'); }, reduced ? 0 : 220 * i);
      });
    };
    if (reduced || !('IntersectionObserver' in window)) { run(); return; }
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(); ro.unobserve(entry.target); }
      });
    }, { threshold: 0.35 });
    ro.observe(rail);
  });

  /* ---- Accordion ---- */
  document.querySelectorAll('.acc-btn').forEach(function (btn) {
    var item = btn.closest('.acc-item');
    var panel = item.querySelector('.acc-panel');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : 0;
    });
  });

  /* ---- Forms ---- */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var status = form.querySelector('.form-status');

    var showError = function (field, message) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.add('has-error');
      var err = wrap.querySelector('.err');
      if (err) err.textContent = message;
    };
    var clearError = function (field) {
      var wrap = field.closest('.field');
      if (wrap) wrap.classList.remove('has-error');
    };

    form.querySelectorAll('input,select,textarea').forEach(function (f) {
      f.addEventListener('input', function () { clearError(f); });
      f.addEventListener('change', function () { clearError(f); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;

      form.querySelectorAll('[required]').forEach(function (f) {
        clearError(f);
        var value = (f.value || '').trim();
        if (!value) {
          showError(f, 'Add your ' + (f.dataset.label || 'details') + ' so we can reply.');
          ok = false;
          firstBad = firstBad || f;
          return;
        }
        if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          showError(f, 'Check the email address, it looks incomplete.');
          ok = false;
          firstBad = firstBad || f;
        }
        if (f.type === 'tel' && value.replace(/\D/g, '').length < 10) {
          showError(f, 'Enter a 10 digit phone number.');
          ok = false;
          firstBad = firstBad || f;
        }
      });

      if (!ok) {
        if (firstBad) firstBad.focus();
        if (status) {
          status.textContent = 'Some fields still need attention.';
          status.classList.add('is-visible');
        }
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending'; }
      if (status) {
        status.textContent = 'Sending your message.';
        status.classList.add('is-visible');
      }

      var payload = {};
      new FormData(form).forEach(function (value, key) { payload[key] = value; });

      fetch(form.action, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (data) {
          if (data && (data.success === true || data.success === 'true')) {
            form.reset();
            if (status) status.textContent = 'Message sent. A project lead will reply within one business day.';
          } else {
            if (status) status.textContent = 'The form did not send. Call (905) 409-2072 or email us directly.';
          }
        })
        .catch(function () {
          if (status) status.textContent = 'The form did not send. Call (905) 409-2072 or email us directly.';
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  });

  /* ---- Current year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
