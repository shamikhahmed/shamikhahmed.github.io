(function () {
  const root = document.getElementById('productPage');
  if (!root || typeof PRODUCTS === 'undefined') return;

  const slug = (document.body.dataset.product || '').toLowerCase()
    || (new URLSearchParams(location.search).get('p') || '').toLowerCase()
    || 'vaultcap';

  const resolved = LEGACY_SLUG_MAP[slug] || slug;
  const p = PRODUCTS[resolved];

  if (!p) {
    root.innerHTML = '<div class="wrap" style="padding:120px 24px;text-align:center"><h1>Product not found</h1><a href="index.html">← Home</a></div>';
    return;
  }

  document.title = p.name + ' — Capricorn Systems';
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.content = p.bg;
  document.documentElement.style.setProperty('--p-accent', p.accent);
  if (p.light) document.body.style.background = '#f8f6f3';

  const features = p.features.map(f =>
    `<div class="feature-card"><h4>${f.t}</h4><p>${f.d}</p></div>`
  ).join('');

  const vs = p.vs.map(v =>
    `<tr><td>${v.name}</td><td>${v.note}</td></tr>`
  ).join('');

  const faq = p.faqs.map(f =>
    `<details><summary>${f.q}</summary><p>${f.a}</p></details>`
  ).join('');

  const personas = p.personas.map(x => `<span class="persona">${x}</span>`).join('');
  const highlights = (p.highlights || []).map(h => `<span class="highlight-pill">${h}</span>`).join('');

  const related = PRODUCTS_LIST
    .filter(x => x.slug !== p.slug)
    .slice(0, 3)
    .map(x =>
      `<a href="${x.slug}.html" class="related-card" style="--p-accent:${x.accent}">` +
        `<span class="product-symbol">${x.symbol}</span>` +
        `<strong>${x.name}</strong>` +
        `<span>${x.tagline}</span>` +
      `</a>`
    ).join('');

  root.innerHTML =
    `<section class="product-hero" style="--p-accent:${p.accent}">` +
      `<div class="wrap">` +
        `<p class="eyebrow">${p.category} · v${p.ver}</p>` +
        `<div class="symbol">${p.symbol}</div>` +
        `<h1>${p.name}</h1>` +
        `<p class="hook">${p.hook}</p>` +
        `<div class="highlight-row">${highlights}</div>` +
        `<div class="actions">` +
          `<a href="${p.url}" class="btn btn-product">Launch ${p.name} →</a>` +
          `<a href="${p.pitchUrl}" class="btn btn-ghost" target="_blank" rel="noopener">Investor deck</a>` +
          `<a href="${p.privacyUrl}" class="btn btn-ghost" target="_blank" rel="noopener">Privacy</a>` +
        `</div>` +
      `</div>` +
    `</section>` +

    `<section class="section product-strip" style="--p-accent:${p.accent}">` +
      `<div class="wrap reveal">` +
        `<div class="product-mock">` +
          `<div class="mock-bar"><span></span><span></span><span></span></div>` +
          `<div class="mock-body">` +
            `<p class="mock-label">${p.name}</p>` +
            `<p class="mock-tagline">${p.tagline}</p>` +
            `<div class="mock-blocks">` +
              (p.highlights || []).slice(0, 4).map(h => `<div class="mock-block">${h}</div>`).join('') +
            `</div>` +
          `</div>` +
        `</div>` +
      `</div>` +
    `</section>` +

    `<section class="section"><div class="wrap prose reveal">` +
      `<p class="eyebrow">The problem</p>` +
      `<h2>Why ${p.name} exists</h2>` +
      p.problems.map(x => `<p>• ${x}</p>`).join('') +
    `</div></section>` +

    `<section class="section section-alt"><div class="wrap reveal">` +
      `<p class="eyebrow">The promise</p>` +
      `<h2>What changes after install</h2>` +
      `<p class="lead">${p.promise}</p>` +
      `<p class="lead" style="margin-top:16px">${p.pitch}</p>` +
    `</div></section>` +

    `<section class="section"><div class="wrap reveal">` +
      `<p class="eyebrow">Features</p>` +
      `<h2>Built to tempt install.</h2>` +
      `<p class="lead" style="margin-top:12px">Every capability runs on your device. No account wall. No sync tax.</p>` +
      `<div class="feature-grid">${features}</div>` +
    `</div></section>` +

    `<section class="section section-alt"><div class="wrap reveal">` +
      `<p class="eyebrow">Differentiation</p>` +
      `<h2>Not another template app.</h2>` +
      `<table class="vs-table"><thead><tr><th>Alternative</th><th>Why ${p.name}</th></tr></thead><tbody>${vs}</tbody></table>` +
    `</div></section>` +

    `<section class="section"><div class="wrap reveal">` +
      `<p class="eyebrow">Audience</p>` +
      `<h2>Who it's for</h2>` +
      `<div class="personas">${personas}</div>` +
    `</div></section>` +

    `<section class="section section-alt"><div class="wrap reveal faq">` +
      `<p class="eyebrow">FAQ</p>` +
      `<h2>Before you install</h2>` +
      faq +
    `</div></section>` +

    `<section class="section"><div class="wrap reveal">` +
      `<p class="eyebrow">Also in the constellation</p>` +
      `<h2>Explore more Capricorn products</h2>` +
      `<div class="related-grid">${related}</div>` +
    `</div></section>` +

    `<section class="section cta-section" style="--p-accent:${p.accent}"><div class="wrap reveal" style="text-align:center">` +
      `<h2>Ready to install ${p.name}?</h2>` +
      `<p class="lead" style="margin:16px auto 28px">Open the app, add it to your home screen, and own your data.</p>` +
      `<a href="${p.url}" class="btn btn-product">Launch ${p.name} →</a>` +
      `<p style="margin-top:20px;font-size:13px;color:var(--dim)">` +
        `<a href="${p.privacyUrl}" target="_blank" rel="noopener">Privacy</a> · ` +
        `<a href="${p.github}" target="_blank" rel="noopener">Source</a> · ` +
        `<a href="index.html#products">All products</a>` +
      `</p>` +
    `</div></section>`;

  const bar = document.getElementById('installBar');
  if (bar) {
    const launch = document.getElementById('installLaunch');
    const title = document.getElementById('installTitle');
    if (title) title.textContent = 'Install ' + p.name;
    if (launch) {
      launch.href = p.url;
      launch.textContent = 'Launch ' + p.name + ' →';
    }
    bar.hidden = false;
  }

  document.querySelectorAll('.reveal').forEach(el => {
    requestAnimationFrame(() => el.classList.add('visible'));
  });
})();
