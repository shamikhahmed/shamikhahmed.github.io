(function () {
  const nav = document.getElementById('siteNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 24);
    }, { passive: true });
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && !reducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  window.initProductLayout = function () {
    if (typeof initProductRail === 'function') initProductRail();
  };

  /* Starfield is rendered by js/capricorn-hero.js (WebGL, pauses offscreen). */

  /* Count-up stats — animate [data-count-to] when revealed */
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length && !reducedMotion && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target;
        const to = parseFloat(el.dataset.countTo);
        const suffix = el.dataset.countSuffix || '';
        const dur = 1200;
        const t0 = performance.now();
        (function tick(now) {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(to * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  if (typeof PRODUCTS !== 'undefined') {
    const productHref = (p) => p.url || (p.slug + '.html');
    const carousel = document.getElementById('screenshotCarousel');
    if (carousel && typeof productScreenshot === 'function' && typeof deviceFrame === 'function') {
      carousel.innerHTML =
        PRODUCTS_LIST.map((p, i) =>
          `<a href="${productHref(p)}" class="carousel-card${i === 0 ? ' is-front' : ''}" data-index="${i}" style="--p-accent:${p.accent}">` +
            deviceFrame(p, productScreenshot(p, 0), (p.screenshotAlts && p.screenshotAlts[0]) || p.name, '') +
            `<span class="carousel-label">${p.name} · ${p.tagline}</span>` +
          `</a>`
        ).join('') +
        `<div class="carousel-dots" aria-hidden="true">` +
          PRODUCTS_LIST.map((_, i) =>
            `<button type="button" class="carousel-dot${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="Show product ${i + 1}"></button>`
          ).join('') +
        `</div>`;
      if (typeof initHomeCarousel === 'function') initHomeCarousel();
    }

    const grid = document.getElementById('productsGrid');
    if (grid) {
      grid.innerHTML = PRODUCTS_LIST.map((p) =>
        `<a href="${productHref(p)}" class="product-card${p.light ? ' product-card-light' : ''}${p.forSale ? ' product-card--sale' : ''}" style="--p-accent:${p.accent}">` +
          (typeof productCardThumb === 'function' ? productCardThumb(p) : '') +
          `<div class="product-card-body">` +
            `<div class="product-symbol">${p.symbol}</div>` +
            `<div class="cat">${p.category} · v${p.ver}${p.forSale ? ' · For sale' : ''}</div>` +
            `<h3>${p.name}${p.forSale ? ' <span class="sale-pill">For sale</span>' : ''}</h3>` +
            `<p>${p.tagline}</p>` +
            `<span class="link">${p.forSale ? 'View Cap →' : 'Open Cap →'}</span>` +
          `</div>` +
        `</a>`
      ).join('');
    }

    const footerNav = document.getElementById('productNavFooter');
    if (footerNav) {
      footerNav.innerHTML = PRODUCTS_LIST.map((p) =>
        `<a href="${productHref(p)}">${p.name}</a>`
      ).join('');
    }

    const spotlights = document.getElementById('spotlightList');
    if (spotlights) {
      spotlights.innerHTML = PRODUCTS_LIST.map((p, i) => {
        const flip = i % 2 === 1 ? ' flip' : '';
        const pills = (p.highlights || []).slice(0, 4).map(h =>
          `<span class="spotlight-pill">${h}</span>`
        ).join('');
        return `<article class="spotlight${flip}${p.light ? ' spotlight-light' : ''}" style="--p-accent:${p.accent}">` +
          `<div class="spotlight-card">` +
            `<div class="symbol">${p.symbol}</div>` +
            `<p class="eyebrow" style="margin-bottom:8px">${p.category}</p>` +
            `<h3>${p.name}</h3>` +
            `<p>${p.hook}</p>` +
            `<div class="spotlight-meta">${pills}</div>` +
            `<a href="${productHref(p)}" class="btn btn-ghost">Open ${p.name} →</a>` +
          `</div>` +
          `<div class="spotlight-visual spotlight-visual--shot">` +
            (typeof deviceFrame === 'function'
              ? deviceFrame(p, productScreenshot(p, 1), (p.screenshotAlts && p.screenshotAlts[1]) || `${p.name} dashboard`, '')
              : '') +
            `<div class="spotlight-visual-caption">` +
              `<strong>${p.name}</strong>` +
              `<span>${p.hook}</span>` +
            `</div>` +
          `</div>` +
        `</article>`;
      }).join('');
    }
  }

  const sov = document.getElementById('sovereigntyBlock');
  if (sov && typeof COMPANY !== 'undefined') {
    sov.innerHTML = COMPANY.sovereignty.points.map((pt) =>
      `<div class="sov-card"><span>${pt}</span></div>`
    ).join('');
  }

  const legacy = new URLSearchParams(location.search).get('a');
  if (legacy && typeof LEGACY_SLUG_MAP !== 'undefined' && LEGACY_SLUG_MAP[legacy]) {
    location.replace(LEGACY_SLUG_MAP[legacy] + '.html');
  }

  const legacyP = new URLSearchParams(location.search).get('p');
  if (legacyP && typeof PRODUCTS !== 'undefined' && PRODUCTS[legacyP]) {
    location.replace(legacyP + '.html');
  }

  const layoutSlug = document.body.dataset.layoutReady || document.body.dataset.product;
  if (layoutSlug) initProductLayout(layoutSlug);

  if (typeof initMobileNav === 'function') initMobileNav();
})();
