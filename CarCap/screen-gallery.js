/**
 * Capricorn screen gallery v3 viewer
 * Reads gallery-manifest.json (schema v2). No network, no framework (G-9).
 */
(() => {
  "use strict";

  const MANIFEST_CANDIDATES = [
    "gallery-manifest.json",
    "docs/screenshots/gallery/gallery-manifest.json",
  ];

  const DEVICE_ALIASES = {
    iphone: ["iphone", "phone", "mobile", "iphone-se", "iphonese", "se"],
    ipad: ["ipad", "tablet", "ipad-portrait", "ipad-landscape", "ipadportrait", "ipadlandscape"],
    mac: ["mac", "desktop", "macbook", "wide", "laptop"],
  };

  /** @type {{ app?: string, version?: string, capturedAt?: string, generated?: string, shots: any[], accent?: string }} */
  let manifest = { shots: [] };
  /** @type {any[]} */
  let visibleShots = [];
  /** @type {HTMLElement[]} */
  let railEls = [];
  let activeRailIndex = 0;
  let lightboxIndex = 0;
  let galleryBase = "docs/screenshots/gallery/";

  const state = {
    theme: "both",
    device: "all",
    shotState: "all",
    search: "",
    chrome: "system",
  };

  const els = {
    title: document.getElementById("sg-title"),
    meta: document.getElementById("sg-meta"),
    rails: document.getElementById("sg-rails"),
    empty: document.getElementById("sg-empty"),
    stateSelect: document.getElementById("sg-state"),
    search: document.getElementById("sg-search"),
    lightbox: document.getElementById("sg-lightbox"),
    lbImg: document.getElementById("sg-lb-img"),
    lbStage: document.getElementById("sg-lb-stage"),
    lbCaption: document.getElementById("sg-lb-caption"),
    lbDetail: document.getElementById("sg-lb-detail"),
    lbPrev: document.getElementById("sg-lb-prev"),
    lbNext: document.getElementById("sg-lb-next"),
    lbClose: document.getElementById("sg-lb-close"),
  };

  function normalizeDevice(raw) {
    const d = String(raw || "").toLowerCase().replace(/[_\s]/g, "-");
    for (const [key, aliases] of Object.entries(DEVICE_ALIASES)) {
      if (aliases.includes(d) || d.startsWith(key)) return key;
    }
    if (d.includes("iphone") || d.includes("phone") || d.includes("mobile")) return "iphone";
    if (d.includes("ipad") || d.includes("tablet")) return "ipad";
    if (d.includes("mac") || d.includes("desk") || d.includes("laptop") || d.includes("wide")) return "mac";
    return d || "iphone";
  }

  function normalizeTheme(raw) {
    const t = String(raw || "").toLowerCase();
    if (t === "sepia") return "sepia";
    if (t === "dark") return "dark";
    return "light";
  }

  function normalizeShot(raw, index) {
    const theme = normalizeTheme(raw.theme || (String(raw.file || "").includes("/dark/") ? "dark" : "light"));
    const device = normalizeDevice(raw.device || raw.viewport || "iphone");
    const group = raw.group || "Screens";
    const screen = raw.screen || raw.label || raw.id || `Screen ${index + 1}`;
    const shotState = raw.state || "default";
    const id = raw.id || `${slug(group)}--${slug(screen)}--${slug(shotState)}`;
    const file = raw.file || "";
    return {
      ...raw,
      id,
      group,
      screen,
      state: shotState,
      theme,
      device,
      file,
      route: raw.route || "",
      caption: raw.caption || raw.label || screen,
      w: raw.w,
      h: raw.h,
    };
  }

  function slug(s) {
    return String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function shotSrc(shot) {
    const file = String(shot.file || "");
    if (/^https?:\/\//i.test(file) || file.startsWith("/") || file.startsWith("./") || file.startsWith("../")) {
      return file;
    }
    return galleryBase + file.replace(/^\.\//, "");
  }

  function parseUrl() {
    const params = new URLSearchParams(location.search);
    const theme = params.get("theme");
    const device = params.get("device");
    const shotState = params.get("state");
    const q = params.get("q");
    if (theme === "light" || theme === "dark" || theme === "both") state.theme = theme;
    if (device && ["iphone", "ipad", "mac", "all"].includes(device)) state.device = device;
    if (shotState) state.shotState = shotState;
    if (q) state.search = q;
  }

  function writeUrl(replaceHash) {
    const params = new URLSearchParams();
    if (state.theme !== "both") params.set("theme", state.theme);
    if (state.device !== "all") params.set("device", state.device);
    if (state.shotState !== "all") params.set("state", state.shotState);
    if (state.search) params.set("q", state.search);
    const qs = params.toString();
    const hash = replaceHash != null ? replaceHash : location.hash;
    const next = `${location.pathname}${qs ? `?${qs}` : ""}${hash || ""}`;
    history.replaceState(null, "", next);
  }

  function applyChrome() {
    if (state.chrome === "system") {
      document.documentElement.removeAttribute("data-chrome");
    } else {
      document.documentElement.setAttribute("data-chrome", state.chrome);
    }
    document.querySelectorAll("[data-chrome]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-chrome") === state.chrome));
    });
  }

  function applyAccent() {
    const accent = manifest.accent || new URLSearchParams(location.search).get("accent");
    if (accent && /^#[0-9a-fA-F]{3,8}$/.test(accent)) {
      document.documentElement.style.setProperty("--sg-accent", accent);
    }
  }

  function syncToolbar() {
    document.querySelectorAll("[data-theme]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-theme") === state.theme));
    });
    document.querySelectorAll("[data-device]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-device") === state.device));
    });
    if (els.stateSelect) els.stateSelect.value = state.shotState;
    if (els.search) els.search.value = state.search;
  }

  function populateStates() {
    const states = [...new Set(manifest.shots.map((s) => s.state))].sort();
    const select = els.stateSelect;
    if (!select) return;
    const current = state.shotState;
    select.innerHTML = `<option value="all">All states</option>`;
    for (const s of states) {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      select.appendChild(opt);
    }
    if ([...select.options].some((o) => o.value === current)) select.value = current;
  }

  function matchesFilters(shot) {
    if (state.theme !== "both" && shot.theme !== state.theme && shot.theme !== "sepia") return false;
    if (state.theme === "light" && shot.theme === "sepia") return false;
    if (state.device !== "all" && shot.device !== state.device) return false;
    if (state.shotState !== "all" && shot.state !== state.shotState) return false;
    if (state.search) {
      const q = state.search.toLowerCase();
      const hay = `${shot.screen} ${shot.group} ${shot.state} ${shot.route} ${shot.caption} ${shot.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function pairKey(shot) {
    return `${shot.group}::${shot.screen}::${shot.state}::${shot.device}`;
  }

  function buildVisible() {
    const filtered = manifest.shots.filter(matchesFilters);
    if (state.theme !== "both") {
      visibleShots = filtered;
      return;
    }
    const byKey = new Map();
    for (const shot of filtered) {
      const key = pairKey(shot);
      if (!byKey.has(key)) byKey.set(key, { light: null, dark: null, extras: [] });
      const bucket = byKey.get(key);
      if (shot.theme === "light") bucket.light = shot;
      else if (shot.theme === "dark") bucket.dark = shot;
      else bucket.extras.push(shot);
    }
    visibleShots = [];
    for (const bucket of byKey.values()) {
      if (bucket.light || bucket.dark) {
        visibleShots.push({
          _pair: true,
          light: bucket.light,
          dark: bucket.dark,
          id: (bucket.light || bucket.dark).id,
          group: (bucket.light || bucket.dark).group,
          screen: (bucket.light || bucket.dark).screen,
          state: (bucket.light || bucket.dark).state,
          device: (bucket.light || bucket.dark).device,
          route: (bucket.light || bucket.dark).route,
          caption: (bucket.light || bucket.dark).caption,
        });
      }
      visibleShots.push(...bucket.extras);
    }
  }

  function groupShots(shots) {
    const map = new Map();
    for (const shot of shots) {
      const g = shot.group || "Screens";
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(shot);
    }
    return [...map.entries()];
  }

  function frameClass(device) {
    const d = normalizeDevice(device);
    if (d === "ipad") return "sg-frame--ipad";
    if (d === "mac") return "sg-frame--mac";
    return "sg-frame--iphone";
  }

  function cardForShot(shot, paired) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sg-card" + (paired ? " both-pair" : "");
    btn.dataset.shotId = shot.id;
    btn.setAttribute("aria-label", `${shot.screen}, ${shot.state}, ${shot.device}${paired ? ", light and dark" : `, ${shot.theme || ""}`}`);

    const inner = document.createElement("div");
    inner.className = "sg-card-inner";

    if (paired) {
      const pair = document.createElement("div");
      pair.className = "sg-pair";
      for (const side of ["light", "dark"]) {
        const s = shot[side];
        const frame = document.createElement("div");
        frame.className = `sg-frame ${frameClass(shot.device)}`;
        if (s) {
          const img = document.createElement("img");
          img.src = shotSrc(s);
          img.alt = `${s.screen} (${side})`;
          img.loading = "lazy";
          img.decoding = "async";
          frame.appendChild(img);
        } else {
          frame.setAttribute("aria-hidden", "true");
          frame.style.minHeight = "120px";
        }
        pair.appendChild(frame);
      }
      inner.appendChild(pair);
    } else {
      const frame = document.createElement("div");
      frame.className = `sg-frame ${frameClass(shot.device)}`;
      const img = document.createElement("img");
      img.src = shotSrc(shot);
      img.alt = `${shot.screen} — ${shot.state}`;
      img.loading = "lazy";
      img.decoding = "async";
      frame.appendChild(img);
      inner.appendChild(frame);
    }

    const cap = document.createElement("figcaption");
    const title = document.createElement("p");
    title.className = "sg-card-title";
    title.textContent = shot.screen;
    const sub = document.createElement("p");
    sub.className = "sg-card-sub";
    sub.textContent = `${shot.state} · ${shot.device}${paired ? " · light + dark" : ` · ${shot.theme}`}`;
    cap.appendChild(title);
    cap.appendChild(sub);
    if (shot.route) {
      const route = document.createElement("p");
      route.className = "sg-card-route";
      route.textContent = shot.route;
      cap.appendChild(route);
    }
    if (shot.caption && shot.caption !== shot.screen) {
      const badge = document.createElement("span");
      badge.className = "sg-badge";
      badge.textContent = "caption";
      badge.title = shot.caption;
      cap.appendChild(badge);
    }
    inner.appendChild(cap);
    btn.appendChild(inner);

    btn.addEventListener("click", () => openLightbox(indexOfVisible(shot)));
    return btn;
  }

  function indexOfVisible(shot) {
    return visibleShots.findIndex((s) => s.id === shot.id && (!!s._pair === !!shot._pair));
  }

  function render() {
    buildVisible();
    els.rails.innerHTML = "";
    railEls = [];
    const groups = groupShots(visibleShots);
    els.empty.hidden = groups.length > 0;

    groups.forEach(([groupName, shots], groupIndex) => {
      const section = document.createElement("section");
      section.className = "sg-rail-section";
      section.id = `group-${slug(groupName)}`;
      section.dataset.railIndex = String(groupIndex);

      const head = document.createElement("div");
      head.className = "sg-rail-head";
      const h2 = document.createElement("h2");
      h2.className = "sg-rail-title";
      h2.id = `rail-title-${slug(groupName)}`;
      h2.textContent = groupName;
      const count = document.createElement("span");
      count.className = "sg-rail-count";
      count.textContent = `${shots.length} shot${shots.length === 1 ? "" : "s"}`;
      head.appendChild(h2);
      head.appendChild(count);

      const wrap = document.createElement("div");
      wrap.className = "sg-rail-wrap";

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "sg-rail-arrow";
      prev.dataset.dir = "prev";
      prev.setAttribute("aria-label", `Scroll ${groupName} rail left`);
      prev.textContent = "‹";

      const next = document.createElement("button");
      next.type = "button";
      next.className = "sg-rail-arrow";
      next.dataset.dir = "next";
      next.setAttribute("aria-label", `Scroll ${groupName} rail right`);
      next.textContent = "›";

      const list = document.createElement("ul");
      list.className = "sg-rail";
      list.setAttribute("role", "list");
      list.setAttribute("aria-labelledby", h2.id);
      list.tabIndex = 0;
      list.dataset.railIndex = String(groupIndex);

      for (const shot of shots) {
        const li = document.createElement("li");
        li.setAttribute("role", "listitem");
        li.appendChild(cardForShot(shot, !!shot._pair));
        // Peek: last card gets extra end padding via rail padding; snap already set.
        list.appendChild(li);
      }

      // Peek spacer so last card isn't flush
      const peek = document.createElement("li");
      peek.setAttribute("aria-hidden", "true");
      peek.style.flex = "0 0 48px";
      peek.style.scrollSnapAlign = "none";
      list.appendChild(peek);

      prev.addEventListener("click", () => scrollRail(list, -1));
      next.addEventListener("click", () => scrollRail(list, 1));
      list.addEventListener("focus", () => {
        activeRailIndex = groupIndex;
      });

      wrap.appendChild(prev);
      wrap.appendChild(list);
      wrap.appendChild(next);
      section.appendChild(head);
      section.appendChild(wrap);
      els.rails.appendChild(section);
      railEls.push(list);
    });

    const count = visibleShots.length;
    const app = manifest.app || "App";
    const ver = manifest.version || "";
    els.title.textContent = `${app} — Screen Gallery`;
    document.title = `${app} — Screen Gallery`;
    const when = manifest.capturedAt || manifest.generated || "";
    els.meta.textContent = [
      ver ? `v${ver}` : null,
      when ? `captured ${when}` : null,
      `${count} shown · ${manifest.shots.length} in manifest`,
    ]
      .filter(Boolean)
      .join(" · ");

    applyHashScroll();
  }

  function scrollRail(rail, dir) {
    const card = rail.querySelector(".sg-card");
    const step = card ? card.getBoundingClientRect().width + 16 : 240;
    rail.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  function applyHashScroll() {
    const hash = location.hash.replace(/^#/, "");
    if (!hash) return;
    const byId = document.getElementById(`group-${hash}`) || document.getElementById(hash);
    if (byId) {
      byId.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const card = els.rails.querySelector(`[data-shot-id="${CSS.escape(hash)}"]`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      card.focus();
    }
  }

  /* —— Lightbox —— */
  const pinch = { scale: 1, startDist: 0, startScale: 1, x: 0, y: 0, startX: 0, startY: 0, pointers: new Map() };

  function flatLightboxList() {
    const out = [];
    for (const shot of visibleShots) {
      if (shot._pair) {
        if (shot.light) out.push(shot.light);
        if (shot.dark) out.push(shot.dark);
      } else {
        out.push(shot);
      }
    }
    return out;
  }

  function focusableIn(root) {
    return [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
      (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
    );
  }

  function trapLightboxFocus(e) {
    if (!els.lightbox.open || e.key !== "Tab") return;
    const nodes = focusableIn(els.lightbox);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openLightbox(index) {
    const list = flatLightboxList();
    if (!list.length) return;
    lightboxIndex = Math.max(0, Math.min(index, list.length - 1));
    // If opened from a pair card, map to first of pair
    if (visibleShots[index]?._pair) {
      const id = visibleShots[index].light?.id || visibleShots[index].dark?.id;
      lightboxIndex = Math.max(0, list.findIndex((s) => s.id === id));
    }
    showLightboxShot();
    if (typeof els.lightbox.showModal === "function") {
      if (!els.lightbox.open) els.lightbox.showModal();
    } else {
      els.lightbox.setAttribute("open", "");
    }
    document.addEventListener("keydown", trapLightboxFocus, true);
    els.lbClose.focus();
    resetZoom();
  }

  function closeLightbox() {
    document.removeEventListener("keydown", trapLightboxFocus, true);
    if (els.lightbox.open) els.lightbox.close();
    else els.lightbox.removeAttribute("open");
    resetZoom();
  }

  function showLightboxShot() {
    const list = flatLightboxList();
    const shot = list[lightboxIndex];
    if (!shot) return;
    els.lbImg.src = shotSrc(shot);
    els.lbImg.alt = `${shot.screen} — ${shot.state}`;
    els.lbCaption.textContent = shot.caption || shot.screen;
    els.lbDetail.textContent = [
      shot.route || null,
      `${shot.theme} · ${shot.device} · ${shot.state}`,
      manifest.version ? `v${manifest.version}` : null,
      shot.w && shot.h ? `${shot.w}×${shot.h}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    writeUrl(`#${shot.id}`);
  }

  function stepLightbox(dir) {
    const list = flatLightboxList();
    if (!list.length) return;
    lightboxIndex = (lightboxIndex + dir + list.length) % list.length;
    resetZoom();
    showLightboxShot();
  }

  function resetZoom() {
    pinch.scale = 1;
    pinch.x = 0;
    pinch.y = 0;
    applyZoom();
  }

  function applyZoom() {
    els.lbImg.style.transform = `translate(${pinch.x}px, ${pinch.y}px) scale(${pinch.scale})`;
  }

  function pointerDist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function bindLightboxGestures() {
    const stage = els.lbStage;
    let swipeX = 0;
    let swipeActive = false;

    stage.addEventListener("pointerdown", (e) => {
      stage.setPointerCapture(e.pointerId);
      pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch.pointers.size === 1) {
        swipeActive = true;
        swipeX = e.clientX;
        pinch.startX = e.clientX - pinch.x;
        pinch.startY = e.clientY - pinch.y;
        stage.classList.add("dragging");
      } else if (pinch.pointers.size === 2) {
        swipeActive = false;
        const pts = [...pinch.pointers.values()];
        pinch.startDist = pointerDist(pts[0], pts[1]);
        pinch.startScale = pinch.scale;
      }
    });

    stage.addEventListener("pointermove", (e) => {
      if (!pinch.pointers.has(e.pointerId)) return;
      pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch.pointers.size === 2) {
        const pts = [...pinch.pointers.values()];
        const dist = pointerDist(pts[0], pts[1]);
        if (pinch.startDist > 0) {
          pinch.scale = Math.min(4, Math.max(1, pinch.startScale * (dist / pinch.startDist)));
          applyZoom();
        }
      } else if (pinch.pointers.size === 1 && pinch.scale > 1) {
        pinch.x = e.clientX - pinch.startX;
        pinch.y = e.clientY - pinch.startY;
        applyZoom();
      }
    });

    function endPointer(e) {
      if (swipeActive && pinch.pointers.size <= 1 && pinch.scale <= 1.05) {
        const dx = e.clientX - swipeX;
        if (Math.abs(dx) > 60) stepLightbox(dx < 0 ? 1 : -1);
      }
      pinch.pointers.delete(e.pointerId);
      if (pinch.pointers.size < 2) pinch.startDist = 0;
      if (pinch.pointers.size === 0) {
        swipeActive = false;
        stage.classList.remove("dragging");
      }
    }

    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", endPointer);
    stage.addEventListener("wheel", (e) => {
      if (!els.lightbox.open) return;
      e.preventDefault();
      const next = pinch.scale + (e.deltaY < 0 ? 0.12 : -0.12);
      pinch.scale = Math.min(4, Math.max(1, next));
      if (pinch.scale === 1) {
        pinch.x = 0;
        pinch.y = 0;
      }
      applyZoom();
    }, { passive: false });
  }

  /* —— Keyboard —— */
  function onKeyDown(e) {
    const inLightbox = els.lightbox.open;
    if (inLightbox) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepLightbox(-1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        stepLightbox(1);
        return;
      }
      return;
    }

    if (e.target === els.search || e.target === els.stateSelect) return;

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const rail = railEls[activeRailIndex];
      if (rail) scrollRail(rail, e.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      activeRailIndex = Math.max(
        0,
        Math.min(railEls.length - 1, activeRailIndex + (e.key === "ArrowDown" ? 1 : -1)),
      );
      const rail = railEls[activeRailIndex];
      if (rail) {
        rail.focus();
        rail.closest(".sg-rail-section")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }

  function bindToolbar() {
    document.querySelectorAll("[data-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.theme = btn.getAttribute("data-theme");
        syncToolbar();
        writeUrl(location.hash);
        render();
      });
    });
    document.querySelectorAll("[data-device]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.device = btn.getAttribute("data-device");
        syncToolbar();
        writeUrl(location.hash);
        render();
      });
    });
    document.querySelectorAll("[data-chrome]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.chrome = btn.getAttribute("data-chrome");
        applyChrome();
      });
    });
    els.stateSelect?.addEventListener("change", () => {
      state.shotState = els.stateSelect.value;
      writeUrl(location.hash);
      render();
    });
    let searchTimer = 0;
    els.search?.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = els.search.value.trim();
        writeUrl(location.hash);
        render();
      }, 120);
    });
    els.lbPrev?.addEventListener("click", () => stepLightbox(-1));
    els.lbNext?.addEventListener("click", () => stepLightbox(1));
    els.lbClose?.addEventListener("click", closeLightbox);
    els.lightbox?.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeLightbox();
    });
    document.addEventListener("keydown", onKeyDown);
  }

  async function loadManifest() {
    const tried = [];
    for (const rel of MANIFEST_CANDIDATES) {
      const url = new URL(rel, location.href);
      tried.push(url.href);
      try {
        const res = await fetch(url.href, { cache: "no-store" });
        if (!res.ok) continue;
        const data = await res.json();
        if (rel.includes("docs/screenshots/gallery/")) {
          galleryBase = "docs/screenshots/gallery/";
        } else {
          galleryBase = rel.includes("/") ? rel.replace(/[^/]+$/, "") : "./";
        }
        // Legacy flat manifests live under docs/screenshots/gallery/
        const sample = data.shots?.[0]?.file || "";
        if (sample && !sample.includes("/") && !/^light|^dark/.test(sample)) {
          galleryBase = "docs/screenshots/gallery/";
        }
        return data;
      } catch {
        /* try next */
      }
    }
    // Embedded mode: ?manifest= path
    const forced = new URLSearchParams(location.search).get("manifest");
    if (forced) {
      const res = await fetch(forced, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const baseParam = new URLSearchParams(location.search).get("base");
        galleryBase = baseParam || forced.replace(/[^/]+$/, "");
        return data;
      }
    }
    throw new Error(`Could not load gallery-manifest.json (tried: ${tried.join(", ")})`);
  }

  async function init() {
    parseUrl();
    bindToolbar();
    bindLightboxGestures();
    applyChrome();
    syncToolbar();

    try {
      const data = await loadManifest();
      const shots = Array.isArray(data.shots) ? data.shots.map(normalizeShot) : [];
      manifest = { ...data, shots };
      applyAccent();
      populateStates();
      syncToolbar();
      writeUrl(location.hash);
      render();

      // Deep-link: #shot-id after render
      if (location.hash) {
        requestAnimationFrame(() => {
          const id = location.hash.slice(1);
          const idx = flatLightboxList().findIndex((s) => s.id === id || slug(s.screen) === id);
          if (idx >= 0 && (id.includes("--") || flatLightboxList()[idx]?.id === id)) {
            // Only auto-open lightbox for shot ids, not group anchors
            if (id.includes("--")) openLightbox(idx);
          }
        });
      }
    } catch (err) {
      els.meta.textContent = String(err.message || err);
      els.empty.hidden = false;
      console.error(err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
