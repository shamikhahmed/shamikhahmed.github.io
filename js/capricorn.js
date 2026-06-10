(function () {
  const nav = document.getElementById('siteNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 24);
    }, { passive: true });
  }

  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
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

  const grid = document.getElementById('productsGrid');
  if (grid && typeof PRODUCTS !== 'undefined') {
    grid.innerHTML = PRODUCTS_LIST.map((p) =>
      `<a href="product.html?p=${p.slug}" class="product-card" style="--p-accent:${p.accent}">` +
        `<div class="product-symbol">${p.symbol}</div>` +
        `<div class="cat">${p.category}</div>` +
        `<h3>${p.name}</h3>` +
        `<p>${p.tagline}</p>` +
        `<span class="link">Explore ${p.name} →</span>` +
      `</a>`
    ).join('');
  }

  const sov = document.getElementById('sovereigntyBlock');
  if (sov && typeof COMPANY !== 'undefined') {
    sov.innerHTML = COMPANY.sovereignty.points.map((pt) =>
      `<div class="sov-card"><span>${pt}</span></div>`
    ).join('');
  }

  const legacy = new URLSearchParams(location.search).get('a');
  if (legacy && typeof LEGACY_SLUG_MAP !== 'undefined' && LEGACY_SLUG_MAP[legacy]) {
    location.replace('product.html?p=' + LEGACY_SLUG_MAP[legacy]);
  }
})();
