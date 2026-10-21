/* Capricorn mini-sites — scheme switch, live version, screen gallery, lightbox. No dependencies. */
(() => {
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ } },
  };
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const effective = () => root.dataset.theme || (mq.matches ? 'dark' : 'light');

  /* ── colour scheme: Auto · Light · Dark ── */
  const schemeBtns = [...document.querySelectorAll('[data-scheme]')];
  const syncScheme = () => {
    const cur = root.dataset.theme || 'auto';
    schemeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scheme === cur)));
  };
  schemeBtns.forEach((b) => b.addEventListener('click', () => {
    const v = b.dataset.scheme;
    if (v === 'auto') { delete root.dataset.theme; store.set('cap-ms-theme', null); } else { root.dataset.theme = v; store.set('cap-ms-theme', v); }
    syncScheme();
    gallery && gallery.followScheme();
  }));
  syncScheme();

  /* ── live version from the app itself ── */
  const repo = document.body.dataset.repo;
  const verEls = document.querySelectorAll('[data-live-version]');
  if (repo && verEls.length && repo !== 'DeeFoodieApp') {
    fetch(`/${repo}/VERSION.json`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (j && /^\d+\.\d+/.test(j.version || '')) verEls.forEach((el) => { el.textContent = `v${j.version}`; el.title = 'Live version'; });
    }).catch(() => {});
  }

  /* ── gallery ── */
  const dataEl = document.getElementById('shots');
  const rail = document.getElementById('galRail');
  let gallery = null;
  if (dataEl && rail) {
    const shots = JSON.parse(dataEl.textContent);
    const schemes = (dataEl.dataset.schemes || 'light,dark').split(',');
    const pickTheme = () => (schemes.includes(effective()) ? effective() : schemes[0]);
    const state = { device: 'iphone', theme: pickTheme(), group: 'All', userTheme: false };
    const groupsEl = document.getElementById('galGroups');
    const segs = { device: document.querySelector('[data-gal="device"]'), theme: document.querySelector('[data-gal="theme"]') };
    let current = [];

    const groupNames = ['All', ...new Set(shots.map((s) => s.group))];
    groupsEl.innerHTML = groupNames.map((g) => `<button type="button" role="tab" data-g="${g}" aria-selected="${g === 'All'}">${g}</button>`).join('');
    if (groupNames.length <= 2) groupsEl.hidden = true;

    const pressed = (seg, v) => seg && [...seg.querySelectorAll('button')].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));

    function render() {
      current = shots.filter((s) => s.device === state.device && s.theme === state.theme && (state.group === 'All' || s.group === state.group));
      rail.dataset.device = state.device;
      rail.innerHTML = current.map((s, i) => `<li><button type="button" class="shot" data-i="${i}" aria-label="${s.screen} — open larger">
          <figure class="dev dev--${s.device}">${s.device === 'mac' ? '<span class="dev__bar" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}
          <img src="${s.src}" alt="${s.screen} screen in ${s.theme} mode" width="${s.w}" height="${s.h}" loading="lazy" decoding="async"></figure>
        </button><div class="shot__cap"><strong>${s.screen}</strong>${s.caption ? `<span>${s.caption}</span>` : ''}</div></li>`).join('');
      rail.scrollTo({ left: 0 });
      pressed(segs.device, state.device);
      pressed(segs.theme, state.theme);
      groupsEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.g === state.group)));
      updateArrows();
    }

    segs.device?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { state.device = b.dataset.v; render(); } });
    segs.theme?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { state.theme = b.dataset.v; state.userTheme = true; render(); } });
    groupsEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { state.group = b.dataset.g; render(); } });

    const prev = document.querySelector('[data-rail="-1"]');
    const next = document.querySelector('[data-rail="1"]');
    function updateArrows() {
      if (!prev || !next) return;
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
    }
    [prev, next].forEach((b) => b?.addEventListener('click', () => rail.scrollBy({ left: Number(b.dataset.rail) * rail.clientWidth * 0.85, behavior: 'smooth' })));
    rail.addEventListener('scroll', updateArrows, { passive: true });
    addEventListener('resize', updateArrows, { passive: true });
    rail.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const items = [...rail.querySelectorAll('.shot')];
      const i = items.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      items[Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)))].focus();
    });

    /* lightbox */
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lbImg');
    const lbCap = document.getElementById('lbCap');
    let at = 0;
    const show = (i) => {
      at = (i + current.length) % current.length;
      const s = current[at];
      lbImg.src = s.src;
      lbImg.alt = `${s.screen} screen`;
      lbCap.innerHTML = `<strong>${s.screen}</strong>${s.caption ? ` — ${s.caption}` : ''}`;
    };
    rail.addEventListener('click', (e) => {
      const b = e.target.closest('.shot');
      if (!b || !lb?.showModal) return;
      show(Number(b.dataset.i));
      lb.showModal();
    });
    lb?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lb]');
      if (b) { if (b.dataset.lb === 'close') lb.close(); else show(at + Number(b.dataset.lb)); return; }
      if (e.target === lb) lb.close();
    });
    lb?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(at + 1);
      if (e.key === 'ArrowLeft') show(at - 1);
    });
    let x0 = null;
    lb?.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb?.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    gallery = { followScheme() { if (!state.userTheme) { state.theme = pickTheme(); render(); } } };
    mq.addEventListener?.('change', () => gallery.followScheme());
    render();
  }

  /* ── story page lightbox ── */
  const storyDataEl = document.getElementById('story-shots');
  const storyLb = document.getElementById('lightbox');
  if (storyDataEl && storyLb?.showModal) {
    let shots = [];
    try { shots = JSON.parse(storyDataEl.textContent).filter((s) => s.src); } catch { shots = []; }
    const lbImg = document.getElementById('lbImg');
    const lbCap = document.getElementById('lbCap');
    let at = 0;
    const show = (i) => {
      if (!shots.length || !lbImg) return;
      at = ((i % shots.length) + shots.length) % shots.length;
      const s = shots[at];
      lbImg.src = s.src;
      lbImg.alt = s.alt || s.title || '';
      if (lbCap) lbCap.innerHTML = `<strong>${s.title || ''}</strong>`;
    };
    document.querySelectorAll('.story-shot[data-story-i]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.storyI);
        const thumb = btn.querySelector('img');
        /* Prefer the visible thumbnail URL so zoom never opens an empty frame */
        if (thumb && shots[i]) {
          shots[i] = { ...shots[i], src: thumb.currentSrc || thumb.getAttribute('src') || shots[i].src };
        }
        show(Number.isFinite(i) ? i : 0);
        storyLb.showModal();
      });
    });
    storyLb.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lb]');
      if (b) { if (b.dataset.lb === 'close') storyLb.close(); else show(at + Number(b.dataset.lb)); return; }
      if (e.target === storyLb) storyLb.close();
    });
    storyLb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(at + 1);
      if (e.key === 'ArrowLeft') show(at - 1);
    });
  }

  /* ── stories index filter + search ── */
  if (document.body.dataset.storiesIndex === '1') {
    const list = document.getElementById('storyList');
    const search = document.getElementById('storySearch');
    const empty = document.getElementById('storyEmpty');
    let need = 'all';
    let app = 'all';
    const items = list ? [...list.querySelectorAll('.story-index__item')] : [];
    const apply = () => {
      const q = (search?.value || '').trim().toLowerCase();
      let visible = 0;
      items.forEach((li) => {
        const okNeed = need === 'all' || (li.dataset.needs || '').split(/\s+/).includes(need);
        const okApp = app === 'all' || li.dataset.app === app;
        const okSearch = !q || (li.dataset.search || '').includes(q);
        const show = okNeed && okApp && okSearch;
        li.hidden = !show;
        if (show) visible += 1;
      });
      if (empty) empty.hidden = visible > 0;
      const countEl = document.getElementById('storyCount');
      if (countEl) {
        const noun = visible === 1 ? 'example' : 'examples';
        countEl.textContent = `${visible} ${noun} shown · filter by need or app`;
      }
    };
    document.querySelectorAll('.story-filter[data-filter-need]').forEach((b) => b.addEventListener('click', () => {
      need = b.dataset.filterNeed;
      document.querySelectorAll('[data-filter-need]').forEach((x) => x.classList.toggle('is-on', x.dataset.filterNeed === need));
      apply();
    }));
    document.querySelectorAll('.story-filter[data-filter-app]').forEach((b) => b.addEventListener('click', () => {
      app = b.dataset.filterApp;
      document.querySelectorAll('[data-filter-app]').forEach((x) => x.classList.toggle('is-on', x.dataset.filterApp === app));
      apply();
    }));
    search?.addEventListener('input', apply);
  }
})();
