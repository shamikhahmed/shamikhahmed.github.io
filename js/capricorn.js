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

  window.initProductLayout = function (slug) {
    if (slug === 'vaultcap') initVaultRail();
    if (slug === 'pulsecap') initPulseStrip();
  };

  function initVaultRail() {
    const links = document.querySelectorAll('.vault-rail-link');
    const sections = Array.from(links)
      .map((a) => document.getElementById(a.dataset.section))
      .filter(Boolean);
    if (!sections.length) return;

    const setActive = (id) => {
      links.forEach((a) => a.classList.toggle('is-active', a.dataset.section === id));
    };

    if (!reducedMotion) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
      sections.forEach((s) => io.observe(s));
    }

    links.forEach((a) => {
      a.addEventListener('click', (ev) => {
        const target = document.getElementById(a.dataset.section);
        if (!target) return;
        ev.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        setActive(a.dataset.section);
      });
    });

    if (sections[0]) setActive(sections[0].id);
  }

  function initPulseStrip() {
    const strip = document.querySelector('.feature-h-scroll');
    if (!strip) return;
    strip.setAttribute('tabindex', '0');
  }

  const canvas = document.getElementById('starfield');
  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: Math.min(120, Math.floor(canvas.width * canvas.height / 12000)) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.5 + 0.2,
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 240, 232, ${s.a})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    resize();
    draw();
    window.addEventListener('resize', resize, { passive: true });
  }

  if (typeof PRODUCTS !== 'undefined') {
    const grid = document.getElementById('productsGrid');
    if (grid) {
      grid.innerHTML = PRODUCTS_LIST.map((p) =>
        `<a href="${p.slug}.html" class="product-card${p.light ? ' product-card-light' : ''}" style="--p-accent:${p.accent}">` +
          (typeof productCardThumb === 'function' ? productCardThumb(p) : '') +
          `<div class="product-card-body">` +
            `<div class="product-symbol">${p.symbol}</div>` +
            `<div class="cat">${p.category} · v${p.ver}</div>` +
            `<h3>${p.name}</h3>` +
            `<p>${p.tagline}</p>` +
            `<span class="link">Full ${p.name} page →</span>` +
          `</div>` +
        `</a>`
      ).join('');
    }

    const carousel = document.getElementById('screenshotCarousel');
    if (carousel) {
      carousel.innerHTML = PRODUCTS_LIST.map((p, i) => {
        const src = typeof productScreenshot === 'function' ? productScreenshot(p, 0) : `assets/screenshots/${p.slug}.png`;
        const alt = (p.screenshotAlts && p.screenshotAlts[0]) || `${p.name} app screenshot`;
        return (
          `<a href="${p.slug}.html" class="carousel-card${i === 0 ? ' is-front' : ''}" style="--p-accent:${p.accent};--card-i:${i}">` +
            `<div class="device-shell device-shell--sm">` +
              `<div class="device-notch" aria-hidden="true"></div>` +
              `<div class="device-screen"><img src="${src}" alt="${alt}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async"></div>` +
            `</div>` +
            `<span class="carousel-label">${p.name}</span>` +
          `</a>`
        );
      }).join('');
    }

    const galleryGrid = document.getElementById('screenshotGalleryGrid');
    if (galleryGrid) {
      galleryGrid.innerHTML = PRODUCTS_LIST.map((p) => {
        const src = typeof productScreenshot === 'function' ? productScreenshot(p, 0) : `assets/screenshots/${p.slug}.png`;
        const alt = (p.screenshotAlts && p.screenshotAlts[0]) || `${p.name} screenshot`;
        return (
          `<a href="${p.slug}.html" class="gallery-tile" style="--p-accent:${p.accent}">` +
            `<div class="gallery-tile-frame">` +
              `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">` +
            `</div>` +
            `<div class="gallery-tile-meta"><strong>${p.name}</strong><span>${p.tagline}</span></div>` +
          `</a>`
        );
      }).join('');
    }

    const footerNav = document.getElementById('productNavFooter');
    if (footerNav) {
      footerNav.innerHTML = PRODUCTS_LIST.map((p) =>
        `<a href="${p.slug}.html">${p.name}</a>`
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
            `<p>${p.pitch}</p>` +
            `<div class="spotlight-meta">${pills}</div>` +
            `<a href="${p.slug}.html" class="btn btn-ghost">Read the ${p.name} page →</a>` +
          `</div>` +
          `<div class="spotlight-visual spotlight-visual--shot">` +
            (typeof deviceFrame === 'function'
              ? deviceFrame(p, typeof productScreenshot === 'function' ? productScreenshot(p, 0) : `assets/screenshots/${p.slug}.png`, (p.screenshotAlts && p.screenshotAlts[0]) || p.name, '')
              : `<p class="label">${p.name}</p>`) +
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

  if (typeof initScreenshotGalleries === 'function') initScreenshotGalleries();
  if (typeof initHomeCarousel === 'function') initHomeCarousel();
  if (typeof initMobileNav === 'function') initMobileNav();
})();
