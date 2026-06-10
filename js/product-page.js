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
  if (p.accent2) document.documentElement.style.setProperty('--p-accent2', p.accent2);
  if (p.light) {
    document.body.classList.add('theme-light', 'theme-' + p.slug);
    document.documentElement.style.setProperty('--text', p.text || '#4a1942');
    document.documentElement.style.setProperty('--dim', p.textDim || '#831843');
  }
  document.body.classList.add('layout-' + p.slug);

  const accent = `style="--p-accent:${p.accent}"`;

  const features = p.features.map(f =>
    `<div class="feature-card"><h4>${f.t}</h4><p>${f.d}</p></div>`
  ).join('');

  const featuresH = p.features.map((f, i) =>
    `<article class="feature-card feature-h-card" style="--card-i:${i}"><h4>${f.t}</h4><p>${f.d}</p></article>`
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

  const tickerItems = (p.highlights || []).concat(p.highlights || []);
  const ticker = tickerItems.map(h => `<span class="ticker-item">${h}</span>`).join('');

  const F = {
    hero: () =>
      `<section class="product-hero" id="overview" ${accent}>` +
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
      `</section>`,

    mock: () =>
      `<section class="section product-strip" id="preview" ${accent}>` +
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
      `</section>`,

    problems: () =>
      `<section class="section" id="problem"><div class="wrap prose reveal">` +
        `<p class="eyebrow">The problem</p>` +
        `<h2>Why ${p.name} exists</h2>` +
        p.problems.map(x => `<p>• ${x}</p>`).join('') +
      `</div></section>`,

    promise: () =>
      `<section class="section section-alt" id="promise"><div class="wrap reveal">` +
        `<p class="eyebrow">The promise</p>` +
        `<h2>What changes after install</h2>` +
        `<p class="lead">${p.promise}</p>` +
        `<p class="lead" style="margin-top:16px">${p.pitch}</p>` +
      `</div></section>`,

    featuresGrid: () =>
      `<section class="section" id="features"><div class="wrap reveal">` +
        `<p class="eyebrow">Features</p>` +
        `<h2>Built to tempt install.</h2>` +
        `<p class="lead" style="margin-top:12px">Every capability runs on your device. No account wall. No sync tax.</p>` +
        `<div class="feature-grid">${features}</div>` +
      `</div></section>`,

    featuresH: () =>
      `<section class="section pulse-features" id="features" ${accent}>` +
        `<div class="wrap reveal">` +
          `<p class="eyebrow">Features</p>` +
          `<h2>Built to tempt install.</h2>` +
          `<p class="lead" style="margin-top:12px">Swipe the strip — every capability runs on your device.</p>` +
        `</div>` +
        `<div class="feature-h-scroll" role="region" aria-label="Feature carousel">` +
          `<div class="feature-h-track">${featuresH}</div>` +
        `</div>` +
      `</section>`,

    vs: () =>
      `<section class="section section-alt" id="compare"><div class="wrap reveal">` +
        `<p class="eyebrow">Differentiation</p>` +
        `<h2>Not another template app.</h2>` +
        `<table class="vs-table"><thead><tr><th>Alternative</th><th>Why ${p.name}</th></tr></thead><tbody>${vs}</tbody></table>` +
      `</div></section>`,

    vsDense: () =>
      `<section class="section section-alt ledger-tables" id="compare"><div class="wrap reveal">` +
        `<p class="eyebrow">Differentiation</p>` +
        `<h2>Not another template app.</h2>` +
        `<div class="ledger-table-wrap">` +
          `<table class="vs-table vs-table-dense"><thead><tr><th>Alternative</th><th>Why ${p.name}</th></tr></thead><tbody>${vs}</tbody></table>` +
        `</div>` +
      `</div></section>`,

    audience: () =>
      `<section class="section" id="audience"><div class="wrap reveal">` +
        `<p class="eyebrow">Audience</p>` +
        `<h2>Who it's for</h2>` +
        `<div class="personas">${personas}</div>` +
      `</div></section>`,

    faq: () =>
      `<section class="section section-alt" id="faq"><div class="wrap reveal faq">` +
        `<p class="eyebrow">FAQ</p>` +
        `<h2>Before you install</h2>` +
        faq +
      `</div></section>`,

    related: () =>
      `<section class="section" id="related"><div class="wrap reveal">` +
        `<p class="eyebrow">Also in the constellation</p>` +
        `<h2>Explore more Capricorn products</h2>` +
        `<div class="related-grid">${related}</div>` +
      `</div></section>`,

    cta: () =>
      `<section class="section cta-section" id="install" ${accent}><div class="wrap reveal" style="text-align:center">` +
        `<h2>Ready to install ${p.name}?</h2>` +
        `<p class="lead" style="margin:16px auto 28px">Open the app, add it to your home screen, and own your data.</p>` +
        `<a href="${p.url}" class="btn btn-product">Launch ${p.name} →</a>` +
        `<p style="margin-top:20px;font-size:13px;color:var(--dim)">` +
          `<a href="${p.privacyUrl}" target="_blank" rel="noopener">Privacy</a> · ` +
          `<a href="${p.github}" target="_blank" rel="noopener">Source</a> · ` +
          `<a href="index.html#products">All products</a>` +
        `</p>` +
      `</div></section>`,

    ticker: () =>
      `<div class="ledger-ticker" aria-hidden="true"><div class="ticker-track">${ticker}</div></div>`,
  };

  const RAIL = [
    { id: 'overview', label: 'Overview' },
    { id: 'preview', label: 'Preview' },
    { id: 'problem', label: 'Problem' },
    { id: 'promise', label: 'Promise' },
    { id: 'features', label: 'Features' },
    { id: 'compare', label: 'Compare' },
    { id: 'audience', label: 'Audience' },
    { id: 'faq', label: 'FAQ' },
    { id: 'related', label: 'Related' },
    { id: 'install', label: 'Install' },
  ];

  const LAYOUTS = {
    vaultcap: () =>
      `<div class="vault-shell">` +
        `<aside class="vault-rail" aria-label="Page sections">` +
          `<nav class="vault-rail-nav">` +
            RAIL.map(r => `<a href="#${r.id}" class="vault-rail-link" data-section="${r.id}">${r.label}</a>`).join('') +
          `</nav>` +
        `</aside>` +
        `<div class="vault-main">` +
          F.hero() + F.mock() + F.problems() + F.promise() + F.featuresGrid() + F.vs() + F.audience() + F.faq() + F.related() + F.cta() +
        `</div>` +
      `</div>`,

    pulsecap: () =>
      F.hero() + F.mock() +
      `<div class="pulse-diagonal" aria-hidden="true"></div>` +
      F.problems() + F.promise() + F.featuresH() +
      `<div class="pulse-diagonal pulse-diagonal--flip" aria-hidden="true"></div>` +
      F.vs() + F.audience() + F.faq() + F.related() + F.cta(),

    prismcap: () =>
      `<div class="prism-scroll">` +
        `<div class="prism-panel">${F.hero()}</div>` +
        `<div class="prism-panel">${F.mock()}</div>` +
        `<div class="prism-panel">${F.problems()}</div>` +
        `<div class="prism-panel prism-panel--alt">${F.promise()}</div>` +
        `<div class="prism-panel">${F.featuresGrid()}</div>` +
        `<div class="prism-panel prism-panel--alt">${F.vs()}</div>` +
        `<div class="prism-panel">${F.audience()}</div>` +
        `<div class="prism-panel prism-panel--alt">${F.faq()}</div>` +
        `<div class="prism-panel">${F.related()}</div>` +
        `<div class="prism-panel prism-panel--cta">${F.cta()}</div>` +
      `</div>`,

    steadycap: () =>
      `<div class="steady-flow">` +
        F.hero() + F.mock() + F.problems() + F.promise() + F.featuresGrid() + F.vs() + F.audience() + F.faq() + F.related() + F.cta() +
      `</div>`,

    ledgercap: () =>
      F.ticker() +
      F.hero() + F.mock() + F.problems() + F.promise() +
      `<section class="section ledger-features" id="features"><div class="wrap reveal">` +
        `<p class="eyebrow">Features</p>` +
        `<h2>Built to tempt install.</h2>` +
        `<p class="lead" style="margin-top:12px">Every capability runs on your device. No account wall. No sync tax.</p>` +
        `<table class="feature-table"><thead><tr><th>Capability</th><th>Detail</th></tr></thead><tbody>` +
          p.features.map(f => `<tr><td>${f.t}</td><td>${f.d}</td></tr>`).join('') +
        `</tbody></table>` +
      `</div></section>` +
      F.vsDense() + F.audience() + F.faq() + F.related() + F.cta(),

    deeponycap: () => {
      const bubbleFeatures = p.features.map((f, i) =>
        `<div class="feature-card" style="--card-i:${i}"><h4>${f.t}</h4><p>${f.d}</p></div>`
      ).join('');
      return `<div class="deepony-flow">` +
        F.hero() + F.mock() + F.problems() + F.promise() +
        `<section class="section deepony-gradient-a" id="features"><div class="wrap reveal">` +
          `<p class="eyebrow">Features</p>` +
          `<h2>Built to tempt install.</h2>` +
          `<p class="lead" style="margin-top:12px">Every capability runs on your device. No account wall. No sync tax.</p>` +
          `<div class="feature-grid deepony-bubbles">${bubbleFeatures}</div>` +
        `</div></section>` +
        F.vs() +
        `<section class="section deepony-gradient-b" id="audience"><div class="wrap reveal">` +
          `<p class="eyebrow">Audience</p>` +
          `<h2>Who it's for</h2>` +
          `<div class="personas deepony-personas">${personas}</div>` +
        `</div></section>` +
        F.faq() + F.related() + F.cta() +
      `</div>`;
    },
  };

  const render = LAYOUTS[p.slug] || (() =>
    F.hero() + F.mock() + F.problems() + F.promise() + F.featuresGrid() + F.vs() + F.audience() + F.faq() + F.related() + F.cta()
  );

  root.innerHTML = render();

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

  document.body.dataset.layoutReady = p.slug;
})();
