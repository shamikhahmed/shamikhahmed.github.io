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
  document.body.classList.add('layout-' + p.slug, 'layout-product');

  const accent = `style="--p-accent:${p.accent}"`;

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
            `<a href="#pitch" class="btn btn-ghost">Investor pitch</a>` +
            `<a href="${p.privacyUrl}" class="btn btn-ghost" target="_blank" rel="noopener">Privacy</a>` +
          `</div>` +
        `</div>` +
      `</section>`,

    nameStory: () =>
      p.nameStory ? (
        `<section class="section section-alt" id="name" ${accent}>` +
          `<div class="wrap reveal">` +
            `<p class="eyebrow">Why this name</p>` +
            `<h2>Why ${p.name}?</h2>` +
            `<p class="lead name-story">${p.nameStory}</p>` +
          `</div>` +
        `</section>`
      ) : '',

    pitch: () =>
      `<section class="section section-alt" id="pitch" ${accent}>` +
        `<div class="wrap reveal">` +
          `<p class="eyebrow">Investor pitch</p>` +
          `<h2>The ${p.name} deck</h2>` +
          `<p class="lead" style="margin-top:12px">Scroll the investor presentation inline — pitch deck for quick reads, full presentation for boardroom walkthrough.</p>` +
          `<div class="pitch-tabs" role="tablist" aria-label="Deck format">` +
            `<button type="button" class="pitch-tab is-active" role="tab" aria-selected="true" data-pitch-tab="pitch">Pitch Deck</button>` +
            `<button type="button" class="pitch-tab" role="tab" aria-selected="false" data-pitch-tab="presentation">Full Presentation</button>` +
          `</div>` +
          `<div class="pitch-embed" data-pitch-panel="pitch">` +
            `<iframe src="${p.pitchUrl}" title="${p.name} investor pitch deck" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` +
          `</div>` +
          `<div class="pitch-embed hidden" data-pitch-panel="presentation" hidden>` +
            `<iframe data-src="${p.presentationUrl}" title="${p.name} full presentation" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` +
          `</div>` +
          `<p class="pitch-embed-actions">` +
            `<a href="${p.pitchUrl}" class="btn btn-ghost" target="_blank" rel="noopener">Open pitch fullscreen →</a>` +
            `<a href="${p.presentationUrl}" class="btn btn-ghost" target="_blank" rel="noopener">Open presentation fullscreen →</a>` +
          `</p>` +
        `</div>` +
      `</section>`,

    mock: () =>
      `<section class="section product-strip" id="preview" ${accent}>` +
        `<div class="wrap reveal">` +
          `<p class="eyebrow" style="text-align:center">In the app</p>` +
          `<h2 style="text-align:center;margin-bottom:8px">See ${p.name} in action</h2>` +
          `<p class="lead" style="margin:0 auto 24px;text-align:center;max-width:560px">Eight distinct screens from the live PWA — no duplicates.</p>` +
          (typeof deviceShowcase === 'function' ? deviceShowcase(p) : '') +
          screenshotGallery(p) +
        `</div>` +
      `</section>`,

    experience: () => uxTimeline(p),

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
      `</div></section>`,

    featuresGrid: () =>
      `<section class="section" id="features"><div class="wrap reveal">` +
        `<p class="eyebrow">Features</p>` +
        `<h2>Built to tempt install.</h2>` +
        `<p class="lead" style="margin-top:12px">Every capability runs on your device. No account wall. No sync tax.</p>` +
        `<div class="feature-grid">${features}</div>` +
      `</div></section>`,

    featuresTable: () =>
      `<section class="section ledger-features" id="features"><div class="wrap reveal">` +
        `<p class="eyebrow">Features</p>` +
        `<h2>Built to tempt install.</h2>` +
        `<p class="lead" style="margin-top:12px">Every capability runs on your device. No account wall. No sync tax.</p>` +
        `<div class="ledger-table-wrap">` +
          `<table class="feature-table"><thead><tr><th>Capability</th><th>Detail</th></tr></thead><tbody>` +
            p.features.map(f => `<tr><td>${f.t}</td><td>${f.d}</td></tr>`).join('') +
          `</tbody></table>` +
        `</div>` +
      `</div></section>`,

    vs: () =>
      `<section class="section section-alt" id="compare"><div class="wrap reveal">` +
        `<p class="eyebrow">Differentiation</p>` +
        `<h2>Not another template app.</h2>` +
        `<div class="table-wrap">` +
          `<table class="vs-table"><thead><tr><th>Alternative</th><th>Why ${p.name}</th></tr></thead><tbody>${vs}</tbody></table>` +
        `</div>` +
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
    { id: 'name', label: 'The name' },
    { id: 'pitch', label: 'Pitch' },
    { id: 'preview', label: 'Screenshots' },
    { id: 'experience', label: 'Experience' },
    { id: 'problem', label: 'Problem' },
    { id: 'promise', label: 'Promise' },
    { id: 'features', label: 'Features' },
    { id: 'compare', label: 'Compare' },
    { id: 'audience', label: 'Audience' },
    { id: 'faq', label: 'FAQ' },
    { id: 'related', label: 'Related' },
    { id: 'install', label: 'Install' },
  ].filter((r) => r.id !== 'name' || p.nameStory);

  function shell(mainHtml) {
    return `<div class="product-shell">` +
      `<aside class="product-rail" aria-label="Page sections">` +
        `<nav class="product-rail-nav">` +
          RAIL.map(r => `<a href="#${r.id}" class="product-rail-link" data-section="${r.id}">${r.label}</a>`).join('') +
        `</nav>` +
      `</aside>` +
      `<div class="product-main">${mainHtml}</div>` +
    `</div>`;
  }

  const standard = () =>
    F.hero() + F.nameStory() + F.pitch() + F.mock() + F.experience() + F.problems() + F.promise() +
    F.featuresGrid() + F.vs() + F.audience() + F.faq() + F.related() + F.cta();

  const ledger = () =>
    F.hero() + F.nameStory() + F.pitch() + F.ticker() + F.mock() + F.experience() + F.problems() + F.promise() +
    F.featuresTable() + F.vsDense() + F.audience() + F.faq() + F.related() + F.cta();

  root.innerHTML = shell(
    p.slug === 'ledgercap' ? ledger() : standard()
  );

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

  if (typeof initScreenshotGalleries === 'function') initScreenshotGalleries();

  document.querySelectorAll('.reveal').forEach(el => {
    requestAnimationFrame(() => el.classList.add('visible'));
  });

  initProductRail();
  initPitchTabs();
})();

function initPitchTabs() {
  const tabs = document.querySelectorAll('[data-pitch-tab]');
  const panels = document.querySelectorAll('[data-pitch-panel]');
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.pitchTab;
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        const on = panel.dataset.pitchPanel === target;
        panel.classList.toggle('hidden', !on);
        panel.hidden = !on;
        if (on) {
          const iframe = panel.querySelector('iframe[data-src]');
          if (iframe && !iframe.src) iframe.src = iframe.dataset.src;
        }
      });
    });
  });
}

function initProductRail() {
  const links = document.querySelectorAll('.product-rail-link');
  const sections = Array.from(links)
    .map((a) => document.getElementById(a.dataset.section))
    .filter(Boolean);
  if (!sections.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setActive = (id) => {
    links.forEach((a) => a.classList.toggle('is-active', a.dataset.section === id));
  };

  if (!reducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { rootMargin: '-28% 0px -58% 0px', threshold: 0 });
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
