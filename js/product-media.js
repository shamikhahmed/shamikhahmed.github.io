/** Shared screenshot + device frame helpers for Capricorn marketing site */
function productScreenshot(p, index) {
  const shots = p.screenshots || (p.screenshot ? [p.screenshot] : []);
  return shots[index] || shots[0] || `assets/screenshots/${p.slug}.png`;
}

function deviceFrame(p, src, alt, caption) {
  const cap = caption ? `<figcaption class="device-caption">${caption}</figcaption>` : '';
  return (
    `<figure class="device-frame" style="--p-accent:${p.accent}">` +
      `<div class="device-shell">` +
        `<div class="device-notch" aria-hidden="true"></div>` +
        `<div class="device-screen">` +
          `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" width="390" height="844">` +
        `</div>` +
      `</div>` +
      cap +
    `</figure>`
  );
}

function screenshotGallery(p) {
  const shots = p.screenshots || [productScreenshot(p, 0)];
  const alts = p.screenshotAlts || [];
  const count = shots.length;

  if (count <= 1) {
    return deviceFrame(p, shots[0], alts[0] || `${p.name} app screenshot`, p.tagline);
  }

  const slides = shots.map((src, i) =>
    `<div class="gallery-slide${i === 0 ? ' is-active' : ''}" data-index="${i}">` +
      deviceFrame(
        p,
        src,
        alts[i] || `${p.name} screenshot ${i + 1}`,
        alts[i] || (i === 0 ? p.tagline : '')
      ) +
    `</div>`
  ).join('');

  const dots = shots.map((_, i) =>
    `<button type="button" class="gallery-dot${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="Screenshot ${i + 1} of ${count}"></button>`
  ).join('');

  return (
    `<div class="screenshot-gallery screenshot-gallery--large" data-slides="${count}">` +
      `<div class="gallery-track">${slides}</div>` +
      `<div class="gallery-controls">` +
        `<button type="button" class="gallery-btn gallery-prev" aria-label="Previous screenshot">←</button>` +
        `<div class="gallery-meta">` +
          `<span class="gallery-counter"><span class="gallery-current">1</span> / ${count}</span>` +
          `<div class="gallery-dots">${dots}</div>` +
        `</div>` +
        `<button type="button" class="gallery-btn gallery-next" aria-label="Next screenshot">→</button>` +
      `</div>` +
    `</div>`
  );
}

function uxTimeline(p) {
  const steps = p.ux || [];
  if (!steps.length) return '';
  return (
    `<section class="section section-alt" id="experience">` +
      `<div class="wrap reveal">` +
        `<p class="eyebrow">User experience</p>` +
        `<h2>From first tap to daily habit</h2>` +
        `<p class="lead" style="margin-top:12px">No account signup. No cloud onboarding. Just open, install, and own it.</p>` +
        `<ol class="ux-timeline">` +
          steps.map((s, i) =>
            `<li class="ux-step" style="--step-i:${i}">` +
              `<div class="ux-step-marker"><span class="ux-icon">${s.icon || '◆'}</span><span class="ux-num">${s.step || String(i + 1).padStart(2, '0')}</span></div>` +
              `<div class="ux-step-body"><h3>${s.title}</h3><p>${s.desc}</p></div>` +
            `</li>`
          ).join('') +
        `</ol>` +
      `</div>` +
    `</section>`
  );
}

function productCardThumb(p) {
  const src = productScreenshot(p, 0);
  const alt = (p.screenshotAlts && p.screenshotAlts[0]) || `${p.name} preview`;
  return (
    `<div class="product-card-thumb">` +
      `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" width="390" height="844">` +
    `</div>`
  );
}

function initScreenshotGalleries() {
  document.querySelectorAll('.screenshot-gallery').forEach((gallery) => {
    const slides = gallery.querySelectorAll('.gallery-slide');
    const dots = gallery.querySelectorAll('.gallery-dot');
    const counter = gallery.querySelector('.gallery-current');
    let idx = 0;

    const show = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
      if (counter) counter.textContent = String(idx + 1);
    };

    gallery.querySelector('.gallery-prev')?.addEventListener('click', () => show(idx - 1));
    gallery.querySelector('.gallery-next')?.addEventListener('click', () => show(idx + 1));
    dots.forEach((d) => d.addEventListener('click', () => show(Number(d.dataset.index))));

    let touchX = 0;
    gallery.addEventListener('touchstart', (e) => {
      touchX = e.changedTouches[0].screenX;
    }, { passive: true });
    gallery.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - touchX;
      if (Math.abs(dx) > 48) show(dx < 0 ? idx + 1 : idx - 1);
    }, { passive: true });

    if (slides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let timer = setInterval(() => show(idx + 1), 5500);
      gallery.addEventListener('mouseenter', () => clearInterval(timer));
      gallery.addEventListener('mouseleave', () => {
        timer = setInterval(() => show(idx + 1), 5500);
      });
      gallery.addEventListener('touchstart', () => clearInterval(timer), { passive: true });
    }
  });
}

function initHomeCarousel() {
  const track = document.getElementById('screenshotCarousel');
  if (!track || typeof PRODUCTS_LIST === 'undefined') return;
  const cards = track.querySelectorAll('.carousel-card');
  const dots = track.querySelectorAll('.carousel-dot');
  if (cards.length < 1) return;

  let i = 0;
  let timer = null;

  const show = (n) => {
    i = (n + cards.length) % cards.length;
    cards.forEach((c, j) => c.classList.toggle('is-front', j === i));
    dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
  };

  dots.forEach((d) => {
    d.addEventListener('click', (e) => {
      e.stopPropagation();
      show(Number(d.dataset.index));
      if (timer) clearInterval(timer);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timer = setInterval(() => show(i + 1), 5000);
      }
    });
  });

  show(0);

  if (cards.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    timer = setInterval(() => show(i + 1), 5000);
    track.addEventListener('mouseenter', () => { if (timer) clearInterval(timer); });
    track.addEventListener('mouseleave', () => {
      timer = setInterval(() => show(i + 1), 5000);
    });
  }
}

function initMobileNav() {
  const btn = document.getElementById('navToggle');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? '✕' : '☰';
  });
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      links.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '☰';
    });
  });
}
