/* Modul3D — сайт продукта. Общий скрипт для всех страниц.
   Без сборщика и зависимостей — как и сама программа. */
(function () {
  'use strict';

  var THEME_KEY = 'modul3d-site-theme';

  /* Сервер приложения (аккаунты/отзывы) — задеплоен на Railway
     (см. Modul3D_mvp/server/README.md, раздел «Деплой на Railway»). */
  var REVIEWS_API_BASE = 'https://modul3dmvp-production.up.railway.app';

  /* ---------- тема: ручной выбор побеждает системную, хранится в localStorage --- */
  function applyStoredTheme() {
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  }
  applyStoredTheme();

  function initThemeToggle() {
    var btns = document.querySelectorAll('[data-theme-toggle]');
    if (!btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        if (!current) {
          var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          current = prefersDark ? 'dark' : 'light';
        }
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      });
    });
  }

  /* ---------- мобильное меню -------------------------------------------------- */
  function initMobileNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var panel = document.querySelector('[data-mobile-nav]');
    if (!toggle || !panel) return;
    var closeBtn = panel.querySelector('[data-nav-close]');

    function open() {
      panel.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    panel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
  }

  /* ---------- шапка: фон появляется после начала прокрутки (без scroll-листенера) */
  function initHeaderScrollState() {
    var header = document.querySelector('[data-site-header]');
    if (!header) return;
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;height:1px;width:1px;';
    document.body.prepend(sentinel);

    if (!('IntersectionObserver' in window)) {
      header.classList.add('is-scrolled');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        header.classList.toggle('is-scrolled', !entry.isIntersecting);
      });
    }, { threshold: 0, rootMargin: '-1px 0px 0px 0px' });
    io.observe(sentinel);
  }

  /* ---------- аккордеон (FAQ) -------------------------------------------------- */
  function initAccordions() {
    document.querySelectorAll('[data-accordion]').forEach(function (group) {
      group.querySelectorAll('.accordion-item').forEach(function (item) {
        var trigger = item.querySelector('.accordion-trigger');
        if (!trigger) return;
        trigger.addEventListener('click', function () {
          var isOpen = item.getAttribute('data-open') === 'true';
          item.setAttribute('data-open', isOpen ? 'false' : 'true');
          trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        });
      });
    });
  }

  /* ---------- появление секций при скролле --------------------------------------
     Контент по умолчанию виден (CSS: .reveal{opacity:1}) — так страница остаётся
     читаемой, даже если этот скрипт не выполнится (ошибка, блокировщик, медленная
     сеть). Класс html.js-reveal, включающий анимацию через CSS, добавляется только
     здесь же, атомарно вместе с самим IntersectionObserver — не зависит от того,
     успешно ли отработали другие initX() выше по файлу. */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: .15, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- живой iframe запускается только по клику --------------------------
     Настоящее приложение перехватывает фокус (у него свой диалог «Восстановить
     проект?» из автосохранения) и без явного клика пользователя утаскивает
     скролл страницы вниз, к себе — это сбивает с толку при первом заходе на
     сайт. Поэтому iframe не рендерится в разметке заранее — только после
     клика по кнопке «Запустить», атрибут src подставляется в этот момент. */
  function initLiveEmbeds() {
    document.querySelectorAll('[data-live-embed]').forEach(function (wrap) {
      var launchBtn = wrap.querySelector('[data-live-launch]');
      if (!launchBtn) return;
      launchBtn.addEventListener('click', function () {
        var src = wrap.getAttribute('data-live-embed');
        var placeholder = wrap.querySelector('.live-frame-placeholder');
        var iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = 'Modul3D — живая демонстрация конструктора';
        iframe.referrerPolicy = 'no-referrer';
        iframe.style.cssText = 'width:100%;border:0;display:block;height:' +
          (placeholder ? placeholder.offsetHeight : 600) + 'px';
        if (placeholder) placeholder.replaceWith(iframe);
      });
    });
  }

  /* ---------- активный пункт в докс-навигации по видимому разделу -------------- */
  function initDocsNavSpy() {
    var nav = document.querySelector('[data-docs-nav]');
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- отзывы (docs/reviews.html) ---------------------------------------
     GET /reviews/public на сервере Modul3D (см. Modul3D_mvp/server/src/routes/
     reviews.js) — только одобренные модератором отзывы, без email автора.
     Три состояния помимо самой сетки карточек: загрузка / пусто / ошибка сети —
     сервер сейчас локальный, поэтому у обычного посетителя сайта ошибка сети
     ожидаема, страница не должна выглядеть сломанной. */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function formatReviewDate(value) {
    try {
      return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function renderReviewCard(review) {
    var nickname = review.nickname || 'Пользователь Modul3D';
    var initial = nickname.trim().charAt(0).toUpperCase() || 'M';
    var avatarUrl = review.avatarUrl;
    var avatarStyle = avatarUrl ? ' style="background-image:url(\'' + REVIEWS_API_BASE + avatarUrl + '\')"' : '';

    var card = document.createElement('article');
    card.className = 'review-card';
    card.innerHTML =
      '<div class="review-head">' +
        '<div class="review-avatar"' + avatarStyle + '>' + (avatarUrl ? '' : escapeHtml(initial)) + '</div>' +
        '<div>' +
          '<div class="review-name">' + escapeHtml(nickname) + '</div>' +
          '<div class="review-date">' + escapeHtml(formatReviewDate(review.createdAt)) + '</div>' +
        '</div>' +
      '</div>' +
      '<p class="review-body"></p>';
    card.querySelector('.review-body').textContent = review.body || '';
    return card;
  }

  function initReviews() {
    var grid = document.querySelector('[data-reviews]');
    if (!grid) return;
    var loadingEl = document.getElementById('reviewsLoading');
    var emptyEl = document.getElementById('reviewsEmpty');
    var errorEl = document.getElementById('reviewsError');

    function showState(el) {
      [loadingEl, emptyEl, errorEl].forEach(function (node) {
        if (node) node.hidden = node !== el;
      });
    }

    fetch(REVIEWS_API_BASE + '/reviews/public')
      .then(function (res) {
        if (!res.ok) throw new Error('Не удалось загрузить отзывы.');
        return res.json();
      })
      .then(function (reviews) {
        if (!Array.isArray(reviews) || reviews.length === 0) {
          showState(emptyEl);
          return;
        }
        reviews.forEach(function (review) { grid.appendChild(renderReviewCard(review)); });
        showState(null);
      })
      .catch(function () {
        showState(errorEl);
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initThemeToggle();
    initMobileNav();
    initHeaderScrollState();
    initAccordions();
    initReveal();
    initLiveEmbeds();
    initDocsNavSpy();
    initReviews();
  });
})();
