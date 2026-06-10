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
  if (shots.length <= 1) {
    return deviceFrame(p, shots[0], alts[0] || `${p.name} app screenshot`, p.tagline);
  }
  const slides = shots.map((src, i) =>
    `<div class="gallery-slide${i === 0 ? ' is-active' : ''}" data-index="${i}">` +
      deviceFrame(p, src, alts[i] || `${p.name} screenshot ${i + 1}`, i === 0 ? p.tagline : (p.screenshotAlts && p.screenshotAlts[i]) || '') +
    `</div>`
  ).join('');
  const dots = shots.map((_, i) =>
    `<button type="button" class="gallery-dot${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="Screenshot ${i + 1}"></button>`
  ).join('');
  return (
    `<div class="screenshot-gallery" data-slides="${shots.length}">` +
      `<div class="gallery-track">${slides}</div>` +
      `<div class="gallery-controls">` +
        `<button type="button" class="gallery-btn gallery-prev" aria-label="Previous screenshot">←</button>` +
        `<div class="gallery-dots">${dots}</div>` +
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
    let idx = 0;
    const show = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    };
    gallery.querySelector('.gallery-prev')?.addEventListener('click', () => show(idx - 1));
    gallery.querySelector('.gallery-next')?.addEventListener('click', () => show(idx + 1));
    dots.forEach((d) => d.addEventListener('click', () => show(Number(d.dataset.index))));
  });
}

function initHomeCarousel() {
  const track = document.getElementById('screenshotCarousel');
  if (!track || typeof PRODUCTS_LIST === 'undefined') return;
  const cards = track.querySelectorAll('.carousel-card');
  if (cards.length < 2) return;
  let i = 0;
  const rotate = () => {
    cards.forEach((c, j) => c.classList.toggle('is-front', j === i));
    i = (i + 1) % cards.length;
  };
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(rotate, 4500);
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
