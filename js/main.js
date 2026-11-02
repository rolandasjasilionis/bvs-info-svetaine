/* BVS Info – puslapio elgsena: mobilus meniu, kalbų perjungiklis, paslaugos parinkimas, užklausos forma.
   Svetainė neįrašo slapukų ir nenaudoja localStorage.
   Tekstai ateina iš window.BVS_TEXT (įrašo kiekvienos kalbos puslapis); be jo – lietuviški. */
(function () {
  'use strict';

  var EMAIL = 'info@baltvesa.lt';

  var T = Object.assign({
    need: 'Įrašykite vardą ir trumpai aprašykite poreikį.',
    opening: 'Atidarome jūsų el. pašto programą. Jei ji neatsidarė, spauskite „Kopijuoti tekstą“ ir išsiųskite adresu {email}.',
    copied: 'Tekstas nukopijuotas. Įklijuokite jį į laišką adresu {email}.',
    copyFail: 'Nepavyko nukopijuoti automatiškai. Pažymėkite tekstą formoje ir nukopijuokite rankiniu būdu.',
    to: 'Kam',
    subject: 'Tema',
    subjectPrefix: 'Užklausa: ',
    greeting: 'Laba diena,',
    regards: 'Pagarbiai',
    tel: 'Tel.'
  }, window.BVS_TEXT || {});

  function t(key) { return T[key].replace('{email}', EMAIL); }

  /* --- Mobilus meniu ----------------------------------------------------- */
  var menuBtn = document.querySelector('.menu');
  var nav = document.getElementById('navigation');
  var lang = document.querySelector('.lang');

  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open && lang) lang.removeAttribute('open');
  }

  menuBtn.addEventListener('click', function () {
    setMenu(!nav.classList.contains('open'));
  });

  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* --- Kalbų perjungiklis (<details>) ------------------------------------- */
  if (lang) {
    lang.addEventListener('toggle', function () {
      if (lang.open) setMenu(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (nav.classList.contains('open')) {
      setMenu(false);
      menuBtn.focus();
    }
    if (lang && lang.open) {
      lang.removeAttribute('open');
      lang.querySelector('summary').focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !menuBtn.contains(e.target)) {
      setMenu(false);
    }
    if (lang && lang.open && !lang.contains(e.target)) {
      lang.removeAttribute('open');
    }
  });

  /* --- Paslaugos parinkimas iš nuorodų ------------------------------------ */
  var serviceSelect = document.getElementById('service');
  document.querySelectorAll('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      serviceSelect.value = a.dataset.service;
    });
  });

  /* --- Užklausos forma ---------------------------------------------------- */
  var form = document.getElementById('inquiry');
  var status = document.getElementById('form-status');
  var copyBtn = document.getElementById('copy-btn');

  function say(text, isError) {
    status.textContent = text;
    status.classList.toggle('error', !!isError);
  }

  function readForm() {
    var f = new FormData(form);
    var name = (f.get('name') || '').trim();
    var phone = (f.get('phone') || '').trim();
    if (phone) {
      var code = (f.get('code') || '').trim();
      // Jei lankytojas pats įrašė kodą su „+“, šalies kodo nebededam antrą kartą.
      if (code && phone.charAt(0) !== '+') phone = code + ' ' + phone;
    }
    var message = (f.get('message') || '').trim();
    var service = f.get('service') || '';

    if (!name || !message) {
      say(t('need'), true);
      (name ? form.elements.message : form.elements.name).focus();
      return null;
    }

    var body = T.greeting + '\n\n' + message + '\n\n' + T.regards + '\n' + name;
    if (phone) body += '\n' + T.tel + ' ' + phone;

    return { subject: T.subjectPrefix + service, body: body };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var mail = readForm();
    if (!mail) return;
    window.location.href = 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent(mail.subject) +
      '&body=' + encodeURIComponent(mail.body);
    say(t('opening'));
  });

  copyBtn.addEventListener('click', function () {
    var mail = readForm();
    if (!mail) return;
    var text = T.to + ': ' + EMAIL + '\n' + T.subject + ': ' + mail.subject + '\n\n' + mail.body;

    function done() { say(t('copied')); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      if (ok) done(); else say(t('copyFail'), true);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  });

  /* --- Temos perjungiklis -------------------------------------------------
     Pradinė tema nustatyta inline skriptu <head> dalyje. Čia tik perjungimas ir įsiminimas
     (localStorage, tik lankytojui paspaudus – griežtai būtina funkcija jo prašymu, ne slapukas). */
  var themeBtn = document.querySelector('.theme');
  var THEME_KEY = 'bvs-theme';
  var root = document.documentElement;

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { window.localStorage.setItem(THEME_KEY, next); } catch (err) { /* saugykla neprieinama – tema galios iki perkrovimo */ }
    });

    // Kol lankytojas pats nepasirinko, sekame sistemos nustatymo pokyčius
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        var saved = null;
        try { saved = window.localStorage.getItem(THEME_KEY); } catch (err) {}
        if (!saved) root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      });
    }
  }

  /* --- Metai poraštėje ---------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
