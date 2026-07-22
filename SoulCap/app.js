/* SoulCap — application logic
 * Local-first. Zero network calls. No account, no server, no LLM, no analytics.
 */
(function () {
  'use strict';

  /* ── Safety kernel ────────────────────────────────────────────────────────
   * Ported from backend SafetyGateService. Only place risk is assessed.
   * Tier 3 is terminal. Inflected forms listed explicitly (substring match:
   * "end my life" is NOT inside "ending my life").
   * Keep in sync with backend/src/ai/safety/safety-gate.service.ts. */
  var CRISIS_HARD = [
    'kill myself','killing myself','kill my self',
    'end my life','ending my life','end my own life','ending my own life',
    'take my own life','taking my own life','end it all','ending it all',
    'want to die','wanna die','want to be dead','suicide','suicidal',
    'hurt myself','hurting myself','harm myself','harming myself',
    'cut myself','cutting myself','overdose','overdosing',
    'not worth living','no reason to live','nothing to live for',
    "don't want to be here",'dont want to be here',
    'everyone would be better without me','better off without me','kms'
  ];
  var CRISIS_CONTEXTUAL = ['saying goodbye','giving away','farewell','final note','last message'];
  var DISTRESS_CONTEXT = ['pain','hopeless','desperate',"can't take",'exhausted','done','over',
    'anymore','nothing left','end it','tired of living','worthless'];
  var ELEVATED = ['think about dying','wish i was dead','fantasize about death',
    'nothing matters','completely hopeless','no way out','never gets better',
    "can't go on",'too much pain','done with everything',"don't want to wake up"];

  function assessRisk(text) {
    if (!text) return 0;
    var s = String(text).toLowerCase();
    for (var i = 0; i < CRISIS_HARD.length; i++) if (s.indexOf(CRISIS_HARD[i]) !== -1) return 3;
    var ctx = CRISIS_CONTEXTUAL.some(function (k) { return s.indexOf(k) !== -1; });
    var dis = DISTRESS_CONTEXT.some(function (k) { return s.indexOf(k) !== -1; });
    if (ctx && dis) return 3;
    for (var j = 0; j < ELEVATED.length; j++) if (s.indexOf(ELEVATED[j]) !== -1) return 2;
    return 0;
  }

  /* ── State ─────────────────────────────────────────────────────────────── */
  var KEY = 'soulcap_v1';
  var DEFAULT = {
    v: 8, onboarded: false, welcomed: false, ageOk: null, region: null, consent: false,
    profile: { name: '', age: '', pronouns: '' },
    history: {},
    concerns: [], checkins: [], skillRuns: [], people: [], links: [], inferences: [],
    safetyPlan: {}, episodes: [], favourites: [], journal: [],
    journalCover: { title: 'My Journal', subtitle: '', color: 0, sticker: '📔', photo: '' },
    theme: null, locale: 'en', rings: 3, ringNames: {}, pace: 1,
    voice: { on: false, name: null, rate: 0.85, pitch: 1 },
    haptics: true, showLinks: false, trackContact: false,
    patternPrefs: { enabled: true, decisions: {} },
    appearance: { text: 'standard', density: 'compact', accent: 'plum', contrast: 'standard', reduceTransparency: false },
    dailySupports: { selected: [], days: {} },
    drip: { answers: {}, skipped: {}, dayKey: '', askedToday: [] },
    userModel: {}
  };
  var VALID_THEMES = { light:1, dark:1, night:1, ocean:1, forest:1, rain:1, space:1, sunrise:1, minimal:1, amoled:1 };
  var DRIP_DAY_CAP = 4;
  var state = load();
  var sheetOpener = null;
  var panicSaveWarning = false;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT);
      var migration = migrateState(JSON.parse(raw));
      var p = Object.assign(clone(DEFAULT), migration.value);
      p.profile = Object.assign(clone(DEFAULT.profile), p.profile || {});
      p.voice = Object.assign(clone(DEFAULT.voice), p.voice || {});
      p.history = p.history || {};
      p.ringNames = p.ringNames || {};
      p.journalCover = Object.assign(clone(DEFAULT.journalCover), p.journalCover || {});
      p.patternPrefs = Object.assign(clone(DEFAULT.patternPrefs), p.patternPrefs || {});
      p.patternPrefs.enabled = typeof p.patternPrefs.enabled === 'boolean' ? p.patternPrefs.enabled : true;
      p.patternPrefs.decisions = p.patternPrefs.decisions && typeof p.patternPrefs.decisions === 'object' && !Array.isArray(p.patternPrefs.decisions) ? p.patternPrefs.decisions : {};
      p.appearance = Object.assign(clone(DEFAULT.appearance), p.appearance || {});
      if (['standard','large'].indexOf(p.appearance.text) === -1) p.appearance.text = DEFAULT.appearance.text;
      if (['compact','comfortable'].indexOf(p.appearance.density) === -1) p.appearance.density = DEFAULT.appearance.density;
      if (['plum','lilac','mulberry','indigo'].indexOf(p.appearance.accent) === -1) p.appearance.accent = DEFAULT.appearance.accent;
      if (['standard','high'].indexOf(p.appearance.contrast) === -1) p.appearance.contrast = DEFAULT.appearance.contrast;
      p.appearance.reduceTransparency = p.appearance.reduceTransparency === true;
      p.dailySupports = Object.assign(clone(DEFAULT.dailySupports), p.dailySupports || {});
      p.dailySupports.selected = Array.isArray(p.dailySupports.selected) ? p.dailySupports.selected : [];
      p.dailySupports.days = p.dailySupports.days && typeof p.dailySupports.days === 'object' && !Array.isArray(p.dailySupports.days) ? p.dailySupports.days : {};
      p.drip = Object.assign(clone(DEFAULT.drip), p.drip || {});
      p.drip.answers = p.drip.answers && typeof p.drip.answers === 'object' && !Array.isArray(p.drip.answers) ? p.drip.answers : {};
      p.drip.skipped = p.drip.skipped && typeof p.drip.skipped === 'object' && !Array.isArray(p.drip.skipped) ? p.drip.skipped : {};
      p.drip.askedToday = Array.isArray(p.drip.askedToday) ? p.drip.askedToday : [];
      p.userModel = p.userModel && typeof p.userModel === 'object' && !Array.isArray(p.userModel) ? p.userModel : {};
      if (p.locale !== 'en' && p.locale !== 'ur') p.locale = 'en';
      if (p.theme && !VALID_THEMES[p.theme]) p.theme = null;
      p.checkins = (Array.isArray(p.checkins) ? p.checkins : []).map(normalizeCheckin);
      if (migration.changed) {
        try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (migrationError) {}
      }
      return p;
    } catch (e) { return clone(DEFAULT); }
  }
  function migrateState(saved) {
    var p = clone(saved || {}), changed = false;
    var version = typeof p.v === 'number' ? p.v : 5;
    if (version < 6) {
      p.checkins = (Array.isArray(p.checkins) ? p.checkins : []).map(normalizeCheckin);
      p.patternPrefs = p.patternPrefs && typeof p.patternPrefs === 'object' ? p.patternPrefs : { enabled: true, decisions: {} };
      p.patternPrefs.decisions = p.patternPrefs.decisions || {};
      (Array.isArray(p.inferences) ? p.inferences : []).forEach(function (item) {
        if (item && item.id && typeof item.confirmed === 'boolean') {
          p.patternPrefs.decisions[item.id] = item.confirmed ? 'confirmed' : 'rejected';
        }
      });
      p.appearance = p.appearance && typeof p.appearance === 'object' ? p.appearance : clone(DEFAULT.appearance);
      p.v = 6; changed = true;
    }
    if (version < 7) {
      p.dailySupports = p.dailySupports && typeof p.dailySupports === 'object' ? p.dailySupports : clone(DEFAULT.dailySupports);
      p.dailySupports.selected = Array.isArray(p.dailySupports.selected) ? p.dailySupports.selected : [];
      p.dailySupports.days = p.dailySupports.days && typeof p.dailySupports.days === 'object' && !Array.isArray(p.dailySupports.days) ? p.dailySupports.days : {};
      p.v = 7; changed = true;
    }
    if (version < 8) {
      p.drip = p.drip && typeof p.drip === 'object' ? p.drip : clone(DEFAULT.drip);
      p.drip.answers = p.drip.answers && typeof p.drip.answers === 'object' && !Array.isArray(p.drip.answers) ? p.drip.answers : {};
      p.drip.skipped = p.drip.skipped && typeof p.drip.skipped === 'object' && !Array.isArray(p.drip.skipped) ? p.drip.skipped : {};
      p.drip.askedToday = Array.isArray(p.drip.askedToday) ? p.drip.askedToday : [];
      p.userModel = p.userModel && typeof p.userModel === 'object' && !Array.isArray(p.userModel) ? p.userModel : {};
      p.locale = p.locale === 'ur' ? 'ur' : 'en';
      if (p.theme && !VALID_THEMES[p.theme]) p.theme = null;
      p.v = 8; changed = true;
    }
    return { value: p, changed: changed };
  }
  function normalizeCheckin(c, i) {
    c = c || {};
    return Object.assign({}, c, {
      id: c.id || ('checkin-' + (c.t || 0) + '-' + (i || 0)),
      t: c.t || Date.now(),
      updatedAt: c.updatedAt || c.t || Date.now(),
      state: c.state || 'Not sure',
      dims: c.dims && typeof c.dims === 'object' && !Array.isArray(c.dims) ? c.dims : {},
      triggers: Array.isArray(c.triggers) ? c.triggers : [],
      need: c.need || '',
      feeling: c.feeling || ''
    });
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; } // quota / private mode
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function sameDay(a, b) { return new Date(a).toDateString() === new Date(b).toDateString(); }

  /* ── DOM ───────────────────────────────────────────────────────────────── */
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  /* ── Theme / haptics ───────────────────────────────────────────────────── */
  function applyTheme() {
    if (state.theme && VALID_THEMES[state.theme]) document.documentElement.setAttribute('data-theme', state.theme);
    else document.documentElement.removeAttribute('data-theme');
    var appearance = state.appearance || DEFAULT.appearance;
    document.documentElement.setAttribute('data-text', appearance.text);
    document.documentElement.setAttribute('data-density', appearance.density);
    document.documentElement.setAttribute('data-accent', appearance.accent);
    document.documentElement.setAttribute('data-contrast', appearance.contrast);
    document.documentElement.setAttribute('data-transparency', appearance.reduceTransparency ? 'reduced' : 'standard');
    applyLocale();
    try {
      if (state.theme && VALID_THEMES[state.theme]) localStorage.setItem('soulcap_theme', state.theme);
      else localStorage.removeItem('soulcap_theme');
      localStorage.setItem('soulcap_appearance', JSON.stringify(appearance));
      localStorage.setItem('soulcap_locale', state.locale === 'ur' ? 'ur' : 'en');
    } catch (e) {}
  }
  function t(path) {
    var pack = STRINGS[state.locale === 'ur' ? 'ur' : 'en'] || STRINGS.en;
    var parts = path.split('.');
    var cur = pack, i;
    for (i = 0; i < parts.length; i++) {
      if (!cur || typeof cur !== 'object') return path;
      cur = cur[parts[i]];
    }
    return typeof cur === 'string' ? cur : path;
  }
  function applyLocale() {
    var locale = state.locale === 'ur' ? 'ur' : 'en';
    var meta = LOCALE_OPTIONS.filter(function (o) { return o.k === locale; })[0] || LOCALE_OPTIONS[0];
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', meta.dir);
    var tabs = document.querySelectorAll('#tabs button[data-tab] span');
    Array.prototype.forEach.call(tabs, function (span) {
      var tab = span.parentNode.getAttribute('data-tab');
      if (STRINGS.en.tabs[tab]) span.textContent = t('tabs.' + tab);
    });
    var fab = document.getElementById('fab');
    if (fab) fab.setAttribute('aria-label', t('helpNow'));
  }
  function setLocale(next) {
    var before = state.locale;
    state.locale = next === 'ur' ? 'ur' : 'en';
    if (!save()) { state.locale = before; showPreferenceSaveFailed(); return; }
    applyTheme(); reRender();
  }
  function setTheme(next) {
    var before = state.theme;
    state.theme = next && VALID_THEMES[next] ? next : null;
    if (!save()) { state.theme = before; showPreferenceSaveFailed(); return; }
    applyTheme(); reRender();
  }
  function buzz(pattern) {
    if (!state.haptics) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  }

  /* ── Voice (device speech synthesis, local only) ───────────────────────── */
  // Device (offline) voices only — no network TTS. The big win is filtering out
  // the joke/novelty system voices (Bubbles, Zarvox, Bad News…) that made the
  // picker feel cartoonish, and labelling the good ones by accent.
  var NOVELTY = ['albert','bad news','bahh','bells','boing','bubbles','cellos','good news',
    'jester','organ','superstar','trinoids','whisper','wobble','zarvox','deranged',
    'hysterical','pipe organ','novelty','bells','grandma','grandpa','flo','rocko','sandy','shelley','eddy','reed'];
  var voices = [];
  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    voices = window.speechSynthesis.getVoices().filter(function (v) {
      if (!v.lang || v.lang.toLowerCase().indexOf('en') !== 0) return false;
      if (v.localService !== true) return false;
      var n = v.name.toLowerCase();
      return !NOVELTY.some(function (bad) { return n.indexOf(bad) !== -1; });
    });
    // Enhanced / premium / Siri voices first — they sound the most natural.
    voices.sort(function (a, b) { return voiceQuality(b) - voiceQuality(a); });
  }
  function voiceQuality(v) {
    var n = v.name.toLowerCase(), q = 0;
    if (/premium|enhanced|neural/.test(n)) q += 3;
    if (/siri|samantha|serena|daniel|karen|moira|tessa|aaron|nicky|rishi|veena/.test(n)) q += 2;
    if (v.localService) q += 1;
    return q;
  }
  function voiceAccent(v) {
    var l = (v.lang || '').toLowerCase();
    if (l.indexOf('en-gb') === 0) return 'British';
    if (l.indexOf('en-us') === 0) return 'American';
    if (l.indexOf('en-au') === 0) return 'Australian';
    if (l.indexOf('en-in') === 0) return 'Indian';
    if (l.indexOf('en-ie') === 0) return 'Irish';
    if (l.indexOf('en-za') === 0) return 'South African';
    if (l.indexOf('en-ca') === 0) return 'Canadian';
    return 'English';
  }
  function bestVoice() {
    if (!voices.length) return null;
    if (state.voice.name) {
      var picked = voices.filter(function (v) { return v.name === state.voice.name; })[0];
      if (picked) return picked;
    }
    return voices[0]; // already sorted best-first
  }
  // Per-session mute for guided speech. Defaults quiet when the user might be
  // around people; they can turn it on with the speaker toggle if they're alone.
  var sessionMute = false;
  function voiceActive() { return state.voice.on && !sessionMute; }
  function speak(text) {
    if (!voiceActive() || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = bestVoice(); if (!v) return;
      u.voice = v;
      u.rate = state.voice.rate; u.pitch = state.voice.pitch;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function hushVoice() { try { window.speechSynthesis.cancel(); } catch (e) {} }

  /* ── Reaching out ──────────────────────────────────────────────────────────
   * No phone numbers, no country-specific lines (owner decision — we can't
   * promise any line is reachable). Gentle, general guidance instead, plus a
   * one-tap way to message a person the user trusts. */
  function renderPanicHelp(container) {
    clear(container);
    container.appendChild(el('p', { class: 'panic-sub', style: 'margin:0',
      text: 'You don’t have to get through this alone. Reaching out to someone — a family member, a friend, anyone who steadies you — really can help.' }));
    container.appendChild(el('a', { href: 'sms:', class: 'btn', style: 'text-decoration:none', text: 'Message someone I trust' }));
    container.appendChild(el('p', { class: 'p-sm', style: 'margin:2px 0 0',
      text: 'If you feel unsafe or in danger, please contact your local emergency services or a crisis helpline in your area.' }));
    if (panicSaveWarning) container.appendChild(el('p', { class: 'p-sm', text: CHECKIN_UI.crisisSaveFailed }));
  }

  var pacerTimer = null, pacerPhase = 0;
  var PHASES = [
    { label: 'Breathe in, slowly.', scale: 1 }, { label: 'Hold.', scale: 1 },
    { label: 'Breathe out, slowly.', scale: 0.7 }, { label: 'Hold.', scale: 0.7 }
  ];
  function openPanic() {
    // Safest default: silent, so it never blares in a public place. If voice is
    // enabled, the speaker toggle lets someone alone turn it on in one tap.
    sessionMute = true;
    $('#panic').classList.add('on'); $('#panic').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderPanicHelp($('#panicLinks')); renderVoiceToggle($('#panicVoice'), 'panic');
    runPacer(); buzz(18); $('#panicExit').focus();
  }

  // A small speaker control shown on panic + runner. Only appears if the user has
  // spoken guidance switched on globally; otherwise there's nothing to toggle.
  function renderVoiceToggle(container, ctx) {
    if (!container) return;
    clear(container);
    if (!state.voice.on) return;
    var on = voiceActive();
    container.appendChild(el('button', { class: 'voice-toggle', 'aria-pressed': on ? 'true' : 'false',
      onclick: function () {
        sessionMute = !sessionMute; if (sessionMute) hushVoice(); buzz(10);
        renderVoiceToggle(container, ctx);
        if (ctx === 'runner' && !sessionMute && runState && runState.mode !== 'setup') { /* voice resumes on next step/phase */ }
      },
      html: (on
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 8a5 5 0 0 1 0 8"/></svg>Voice on'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>Voice off') }));
    if (state.voice.on) container.appendChild(el('span', { class: 'voice-hint', text: on ? 'On — tap to silence if you’re around people' : 'Silent — tap if you’re on your own' }));
  }
  function closePanic() {
    $('#panic').classList.remove('on'); $('#panic').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; stopPacer(); hushVoice(); panicSaveWarning = false;
  }
  function runPacer() {
    stopPacer(); pacerPhase = 0;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var circle = $('#pacer'), ring = $('#pacerRing'), count = $('#pacerCount'),
        label = $('#panicInstruction'), step = $('#panicStep');
    function tick() {
      var ph = PHASES[pacerPhase % 4];
      label.textContent = ph.label; step.textContent = 'Step ' + ((pacerPhase % 4) + 1) + ' of 4';
      if (!reduced) { circle.style.transform = 'scale(' + ph.scale + ')'; ring.style.transform = 'scale(' + (ph.scale + 0.12) + ')'; }
      if (pacerPhase % 2 === 0) buzz(ph.scale === 1 ? [12, 90, 12] : 12);
      speak(ph.label);
      var n = 4; count.textContent = n;
      var cd = setInterval(function () { n -= 1; if (n <= 0) { clearInterval(cd); return; } count.textContent = n; }, 1000);
      pacerPhase++;
    }
    tick(); pacerTimer = setInterval(tick, 4000);
  }
  function stopPacer() { if (pacerTimer) { clearInterval(pacerTimer); pacerTimer = null; } }

  /* ── Check-ins (deduped per day) ───────────────────────────────────────── */
  function recordCheckin(s) {
    var before = clone(state.checkins);
    var last = state.checkins[state.checkins.length - 1];
    // One check-in per day: tapping again the same day updates it rather than
    // stacking. A new day appends a fresh entry.
    if (last && sameDay(last.t, Date.now())) {
      last.state = s; last.updatedAt = Date.now();
    } else {
      state.checkins.push(normalizeCheckin({ id: uid(), t: Date.now(), updatedAt: Date.now(), state: s }, state.checkins.length));
    }
    if (!save()) { state.checkins = before; return false; }
    return true;
  }
  function latestCheckin() { return state.checkins.length ? state.checkins[state.checkins.length - 1] : null; }
  function todayCheckin() {
    var c = latestCheckin();
    return c && sameDay(c.t, Date.now()) ? c : null;
  }
  function showCheckinSaveFailed() {
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: CHECKIN_UI.saveFailedTitle }));
      p.appendChild(el('p', { class: 'p', text: CHECKIN_UI.saveFailedBody }));
      p.appendChild(el('button', { class: 'btn', text: CHECKIN_UI.ok, onclick: closeSheet }));
    });
  }
  function showPreferenceSaveFailed() {
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: PRESENTATION_UI.saveFailedTitle }));
      p.appendChild(el('p', { class: 'p', text: PRESENTATION_UI.saveFailedBody }));
      p.appendChild(el('button', { class: 'btn', text: CHECKIN_UI.ok, onclick: closeSheet }));
    });
  }
  function checkinDetailSheet() {
    var existing = todayCheckin();
    if (!existing) return;
    var draftCheckin = clone(existing);
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: CHECKIN_UI.detailTitle }));
      p.appendChild(el('p', { class: 'p-sm', text: CHECKIN_UI.detailHint }));
      p.appendChild(el('p', { class: 'eyebrow', style: 'margin-top:8px', text: CHECKIN_UI.dimensions }));
      p.appendChild(el('p', { class: 'p-sm', text: CHECKIN_UI.dimensionsHint }));
      CHECKIN_DIMENSIONS.forEach(function (cfg) {
        var current = draftCheckin.dims[cfg.key] || 0;
        var value = el('span', { class: 'meta', text: current ? (current + ' / 5') : 'Not set' });
        var range = el('input', { type: 'range', min: 0, max: 5, step: 1, value: current,
          'aria-label': cfg.label, 'aria-valuetext': current ? (current + ' of 5') : 'Not set' });
        range.addEventListener('input', function () {
          var n = parseInt(range.value, 10);
          if (n) draftCheckin.dims[cfg.key] = n; else delete draftCheckin.dims[cfg.key];
          value.textContent = n ? (n + ' / 5') : 'Not set';
          range.setAttribute('aria-valuetext', n ? (n + ' of 5') : 'Not set');
        });
        p.appendChild(el('div', { class: 'dimension' }, [
          el('div', { class: 'dimension-head' }, [el('span', { class: 'lab', text: cfg.label }), value]),
          range,
          el('div', { class: 'dimension-ends' }, [el('span', { text: cfg.low }), el('span', { text: cfg.high })])
        ]));
      });

      p.appendChild(el('p', { class: 'eyebrow', style: 'margin-top:8px', text: CHECKIN_UI.need }));
      var needWrap = el('div', { class: 'chips' });
      CHECKIN_DIRECT_NEEDS.forEach(function (item) {
        needWrap.appendChild(el('button', { class: 'chip', 'aria-pressed': draftCheckin.need === item.key ? 'true' : 'false', text: item.label,
          onclick: function () {
            draftCheckin.need = draftCheckin.need === item.key ? '' : item.key;
            Array.prototype.forEach.call(needWrap.children, function (b) {
              b.setAttribute('aria-pressed', b.textContent === item.label && draftCheckin.need === item.key ? 'true' : 'false');
            });
          } }));
      });
      p.appendChild(needWrap);

      p.appendChild(el('p', { class: 'eyebrow', style: 'margin-top:8px', text: CHECKIN_UI.triggers }));
      var triggerWrap = el('div', { class: 'chips' });
      CHECKIN_TRIGGERS.forEach(function (item) {
        triggerWrap.appendChild(el('button', { class: 'chip', 'aria-pressed': draftCheckin.triggers.indexOf(item.key) !== -1 ? 'true' : 'false', text: item.label,
          onclick: function () {
            var i = draftCheckin.triggers.indexOf(item.key);
            if (i === -1) draftCheckin.triggers.push(item.key); else draftCheckin.triggers.splice(i, 1);
            this.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
          } }));
      });
      p.appendChild(triggerWrap);

      p.appendChild(el('p', { class: 'eyebrow', style: 'margin-top:8px', text: CHECKIN_UI.feeling }));
      var feeling = el('input', { type: 'text', maxlength: 160, placeholder: CHECKIN_UI.feelingPlaceholder,
        'aria-label': CHECKIN_UI.feeling, value: draftCheckin.feeling || '' });
      p.appendChild(feeling);
      p.appendChild(el('p', { class: 'p-sm', text: CHECKIN_UI.localSafetyNote }));
      p.appendChild(el('button', { class: 'btn', text: CHECKIN_UI.save, onclick: function () {
        var before = clone(state.checkins);
        var risk = assessRisk(feeling.value);
        draftCheckin.feeling = feeling.value.trim().slice(0, 160);
        draftCheckin.updatedAt = Date.now();
        state.checkins = state.checkins.map(function (c) { return c.id === draftCheckin.id ? clone(draftCheckin) : c; });
        if (!save()) {
          state.checkins = before;
          if (risk === 3) { panicSaveWarning = true; closeSheet(); openPanic(); return; }
          showCheckinSaveFailed(); return;
        }
        closeSheet(); render();
        if (risk === 3) openPanic();
      } }));
      p.appendChild(el('button', { class: 'btn quiet', text: CHECKIN_UI.cancel, onclick: closeSheet }));
    });
  }
  function currentCheckin() {
    var c = latestCheckin();
    return c && (Date.now() - c.t) < 12 * 3600 * 1000 ? c : null;
  }
  function currentCapacity() {
    var c = currentCheckin();
    if (!c) return 'any';
    if (c.state === 'Wired' || c.state === 'Heavy') return 'low';
    if (c.state === 'Flat') return 'medium';
    return 'any';
  }
  function capRank(c) { return c === 'low' ? 0 : c === 'medium' ? 1 : 2; }
  function capacityFits(skillCapacity, capacity) {
    return skillCapacity === 'any' || capacity === 'any' || capRank(skillCapacity) <= capRank(capacity);
  }
  function helpfulScore(id) {
    var runs = state.skillRuns.filter(function (r) { return r.id === id; });
    return runs.length ? (runs.filter(function (r) { return r.helpful === true; }).length / runs.length) * 2 : 0;
  }

  // History the user chose to share becomes declared context the engine can act on.
  // Trauma is handled with care, not diagnosis: it gently steers toward grounding and
  // self-soothing and keeps potentially-activating techniques out of auto-suggestions.
  function traumaAware() { return !!((state.history.trauma || '').trim()); }
  function historyTags() {
    var tags = [];
    var st = (state.history.status || '');
    if (/single|separated|divorced|widow/i.test(st)) tags.push('alone');
    if ((state.history.breakups || '').trim()) tags.push('breakup');
    if (traumaAware()) tags.push('trauma');
    return tags;
  }

  function suggestSkill() {
    var cap = currentCapacity(), last = currentCheckin(), tags = historyTags();
    var recent = state.skillRuns.slice(-3).map(function (r) { return r.id; });
    var pool = SKILLS.filter(function (s) {
      if (!capacityFits(s.capacity, cap)) return false;
      // Trauma-informed: don't auto-surface potentially-activating techniques.
      // They stay fully browsable in the library, with a caution note.
      if (traumaAware() && s.traumaCaution) return false;
      return true;
    });
    if (!pool.length) pool = SKILLS.slice();
    var scored = pool.map(function (s) {
      var score = 0, why = [];
      var h = helpfulScore(s.id);
      if (h > 0) { score += h; why.push('it has helped you before'); }
      if (state.favourites.indexOf(s.id) !== -1) { score += 1.2; why.push('you saved it'); }
      if (last) {
        var profile = CHECKIN_PROFILES[last.state];
        var tagMatch = profile && profile.tags && s.indication.some(function (i) { return profile.tags.indexOf(i) !== -1; });
        var familyMatch = profile && profile.families && profile.families.indexOf(s.family) !== -1;
        if (tagMatch || familyMatch) {
          score += profile.weight; why.push(profile.reason);
        }
        if (last.need) {
          var direct = CHECKIN_DIRECT_NEEDS.filter(function (item) { return item.key === last.need; })[0];
          var directFamily = direct && direct.families && direct.families.indexOf(s.family) !== -1;
          var directDomain = direct && direct.domains && direct.domains.indexOf(s.domain) !== -1;
          if (directFamily || directDomain) { score += 4; why.push(direct.reason); }
        }
      }
      state.concerns.forEach(function (c) {
        var k = c.toLowerCase();
        if (k.indexOf('sleep') !== -1 && s.domain === 'rest') { score += 1; why.push('sleep is on your list'); }
        if (k.indexOf('lonel') !== -1 && s.domain === 'connect') { score += 1; why.push('you mentioned loneliness'); }
        if (k.indexOf('panic') !== -1 && s.family === 'autonomic') { score += 1; why.push('you mentioned panic'); }
        if (k.indexOf('low mood') !== -1 && s.domain === 'move') { score += 1; why.push('you mentioned low mood'); }
      });
      // History-driven adaptation.
      if (tags.indexOf('alone') !== -1 && s.domain === 'connect') { score += 1; why.push('you’re on your own right now'); }
      if (tags.indexOf('breakup') !== -1 && (s.domain === 'warmth' || s.family === 'soothing')) { score += 1; why.push('you’re working through a breakup'); }
      if (tags.indexOf('trauma') !== -1 && (s.family === 'orienting' || s.family === 'sensory' || s.family === 'soothing')) { score += 1.4; why.push('gentle grounding suits what you shared'); }
      var hour = new Date().getHours();
      if (hour >= 22 || hour <= 5) {
        if (s.domain === 'rest') { score += 1.5; why.push('it’s late'); }
        if (s.domain === 'reflect' || s.domain === 'move') score -= 2;
      }
      if (recent.indexOf(s.id) !== -1) score -= 2;
      return { skill: s, score: score, why: why };
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored[0];
  }
  function reasonText(pick) {
    if (!pick.why.length) return 'I don’t know you yet — this is a good place for most people to start.';
    var uniq = pick.why.filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 2);
    return 'Because ' + uniq.join(', and ') + '.';
  }
  function localDayKey(t) {
    var d = new Date(t);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function distinctDays(records) {
    var days = {};
    records.forEach(function (record) { days[localDayKey(record.t)] = true; });
    return Object.keys(days).length;
  }
  function triggerLabel(key) {
    var item = CHECKIN_TRIGGERS.filter(function (trigger) { return trigger.key === key; })[0];
    return item ? item.label : key;
  }
  function derivePatterns() {
    if (!state.patternPrefs.enabled) return [];
    var patterns = [], checkins = state.checkins || [];
    if (distinctDays(checkins) >= 5) {
      var late = checkins.filter(function (c) {
        var hour = new Date(c.t).getHours();
        return hour >= 22 || hour <= 4;
      });
      if (distinctDays(late) >= 3) {
        patterns.push({ id:'late-nights', title:PATTERN_UI.lateTitle, summary:PATTERN_UI.lateSummary,
          count:distinctDays(late), evidence:late.map(function (c) { return c.id; }),
          dates:late.map(function (c) { return c.t; }) });
      }

      var noiseRated = checkins.filter(function (c) { return typeof (c.dims || {}).noise === 'number'; });
      var highNoise = noiseRated.filter(function (c) { return c.dims.noise >= 4; });
      if (distinctDays(noiseRated) >= 5 && distinctDays(highNoise) >= 3) {
        patterns.push({ id:'high-noise', title:PATTERN_UI.noiseTitle, summary:PATTERN_UI.noiseSummary,
          count:distinctDays(highNoise), evidence:highNoise.map(function (c) { return c.id; }),
          dates:highNoise.map(function (c) { return c.t; }) });
      }

      var triggerDays = {};
      checkins.forEach(function (c) {
        (c.triggers || []).forEach(function (key) {
          triggerDays[key] = triggerDays[key] || {};
          triggerDays[key][localDayKey(c.t)] = c;
        });
      });
      Object.keys(triggerDays).forEach(function (key) {
        var records = Object.keys(triggerDays[key]).map(function (day) { return triggerDays[key][day]; });
        if (records.length < 3) return;
        patterns.push({ id:'trigger-' + key, title:triggerLabel(key) + ' ' + PATTERN_UI.triggerSuffix,
          summary:PATTERN_UI.triggerSummary + ': ' + triggerLabel(key).toLowerCase() + '.',
          count:records.length, evidence:records.map(function (c) { return c.id; }),
          dates:records.map(function (c) { return c.t; }) });
      });
    }
    return patterns.filter(function (pattern) {
      var decision = state.patternPrefs.decisions[pattern.id];
      return decision !== 'rejected' && decision !== 'hidden';
    });
  }
  function setPatternDecision(id, decision) {
    var before = clone(state.patternPrefs.decisions);
    state.patternPrefs.decisions[id] = decision;
    if (!save()) { state.patternPrefs.decisions = before; showPreferenceSaveFailed(); return; }
    render();
  }
  function patternSheet(pattern) {
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: pattern.title }));
      p.appendChild(el('p', { class: 'p', text: pattern.summary }));
      p.appendChild(el('p', { class: 'eyebrow', text: pattern.count + ' ' + PATTERN_UI.dayBasis }));
      var dates = {};
      pattern.dates.forEach(function (t) { dates[localDayKey(t)] = t; });
      Object.keys(dates).sort().reverse().forEach(function (key) {
        p.appendChild(el('p', { class: 'p-sm', text: new Date(dates[key]).toLocaleDateString(undefined, { weekday:'short', day:'numeric', month:'short', year:'numeric' }) }));
      });
      p.appendChild(el('p', { class: 'notice', text: PATTERN_UI.evidenceNote }));
      p.appendChild(el('button', { class: 'btn', text: PATTERN_UI.done, onclick: closeSheet }));
    });
  }
  function weeklySummary() {
    var since = Date.now() - 7 * 86400000;
    var recent = state.checkins.filter(function (c) { return c.t >= since; });
    if (distinctDays(recent) < 2) return null;
    var states = {}, dimensions = {};
    recent.forEach(function (c) {
      states[c.state] = (states[c.state] || 0) + 1;
      Object.keys(c.dims || {}).forEach(function (key) {
        dimensions[key] = dimensions[key] || [];
        dimensions[key].push(c.dims[key]);
      });
    });
    var common = Object.keys(states).sort(function (a, b) { return states[b] - states[a]; })[0];
    var detail = CHECKIN_DIMENSIONS.map(function (cfg) {
      var values = dimensions[cfg.key] || [];
      if (values.length < 2) return null;
      var avg = values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
      return cfg.label + ' ' + avg.toFixed(1) + '/5';
    }).filter(Boolean);
    return { days:distinctDays(recent), common:common, detail:detail };
  }

  function ensureDripDay() {
    var key = localDayKey(Date.now());
    if (state.drip.dayKey !== key) {
      state.drip.dayKey = key;
      state.drip.askedToday = [];
    }
  }
  function estimateValue(key) {
    var item = state.userModel[key];
    return item && typeof item.value === 'number' ? item.value : null;
  }
  function questionEligible(q) {
    if (state.drip.answers[q.id] || state.drip.skipped[q.id]) return false;
    if (!q.when) return true;
    return Object.keys(q.when).every(function (key) {
      var rule = q.when[key], value = estimateValue(key);
      if (value == null) return false;
      if (rule.min != null && value < rule.min) return false;
      if (rule.max != null && value > rule.max) return false;
      return true;
    });
  }
  function nextDripQuestion() {
    ensureDripDay();
    if ((state.drip.askedToday || []).length >= DRIP_DAY_CAP) return null;
    var i, q;
    for (i = 0; i < DRIP_QUESTIONS.length; i++) {
      q = DRIP_QUESTIONS[i];
      if (questionEligible(q) && state.drip.askedToday.indexOf(q.id) === -1) return q;
    }
    return null;
  }
  function showDripSaveFailed() {
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: DRIP_UI.saveFailedTitle }));
      p.appendChild(el('p', { class: 'p', text: DRIP_UI.saveFailedBody }));
      p.appendChild(el('button', { class: 'btn', text: CHECKIN_UI.ok, onclick: closeSheet }));
    });
  }
  function updateEstimate(key, raw, weight, source) {
    var value = Math.max(1, Math.min(5, raw));
    var prev = state.userModel[key];
    var conf = prev && typeof prev.confidence === 'number' ? prev.confidence : 0;
    var blended = prev && typeof prev.value === 'number'
      ? (prev.value * conf + value * weight) / (conf + weight)
      : value;
    var nextConf = Math.min(0.92, conf + weight * 0.18);
    state.userModel[key] = {
      value: Math.round(blended * 10) / 10,
      confidence: Math.round(nextConf * 100) / 100,
      source: source || 'declared',
      updatedAt: Date.now()
    };
  }
  function answerDrip(q, option) {
    var beforeDrip = clone(state.drip);
    var beforeModel = clone(state.userModel);
    ensureDripDay();
    state.drip.answers[q.id] = { v: option.v, t: Date.now() };
    if (state.drip.askedToday.indexOf(q.id) === -1) state.drip.askedToday.push(q.id);
    updateEstimate(q.key, q.invert ? (6 - option.v) : option.v, q.weight || 1, 'declared');
    if (!save()) {
      state.drip = beforeDrip;
      state.userModel = beforeModel;
      showDripSaveFailed();
      return false;
    }
    return true;
  }
  function skipDrip(q) {
    var beforeDrip = clone(state.drip);
    ensureDripDay();
    state.drip.skipped[q.id] = Date.now();
    if (state.drip.askedToday.indexOf(q.id) === -1) state.drip.askedToday.push(q.id);
    if (!save()) { state.drip = beforeDrip; showDripSaveFailed(); return false; }
    return true;
  }
  function correctEstimate(key, value) {
    var before = clone(state.userModel);
    updateEstimate(key, value, 1.2, 'corrected');
    state.userModel[key].confidence = Math.max(state.userModel[key].confidence, 0.7);
    if (!save()) { state.userModel = before; showDripSaveFailed(); return false; }
    return true;
  }
  function clearEstimate(key) {
    var before = clone(state.userModel);
    delete state.userModel[key];
    if (!save()) { state.userModel = before; showDripSaveFailed(); return false; }
    return true;
  }
  function confidenceLabel(c) {
    if (c < 0.35) return DRIP_UI.low;
    if (c < 0.65) return DRIP_UI.mid;
    return DRIP_UI.high;
  }
  function dripSheet() {
    openSheet(function (p) {
      function draw() {
        clear(p);
        p.appendChild(el('div', { class: 'grab' }));
        p.appendChild(el('h2', { class: 'h-sec', id: 'sheetTitle', text: DRIP_UI.title }));
        p.appendChild(el('p', { class: 'p', text: DRIP_UI.intro }));
        p.appendChild(el('div', { class: 'notice', text: DRIP_UI.notDiagnosis }));
        var q = nextDripQuestion();
        if (!q) {
          p.appendChild(el('p', { class: 'p-voice', text: (state.drip.askedToday || []).length >= DRIP_DAY_CAP ? DRIP_UI.doneToday : DRIP_UI.empty }));
          p.appendChild(el('button', { class: 'btn', text: DRIP_UI.close, onclick: function () { closeSheet(); render(); } }));
          return;
        }
        p.appendChild(el('p', { class: 'eyebrow', text: 'Question ' + ((state.drip.askedToday || []).length + 1) + ' of ' + DRIP_DAY_CAP + ' today' }));
        p.appendChild(el('p', { class: 'p-voice', text: q.text }));
        p.appendChild(el('div', { class: 'stack drip-options' }, q.options.map(function (option) {
          return el('button', { class: 'opt', text: option.l, onclick: function () {
            if (!answerDrip(q, option)) return;
            buzz(8); draw();
          } });
        })));
        p.appendChild(el('button', { class: 'btn quiet', text: DRIP_UI.skip, onclick: function () {
          if (!skipDrip(q)) return;
          draw();
        } }));
        p.appendChild(el('button', { class: 'btn quiet', text: DRIP_UI.close, onclick: function () { closeSheet(); render(); } }));
        var focus = p.querySelector('button, input, select, textarea, a');
        if (focus) focus.focus();
      }
      draw();
    });
  }
  function estimateSheet(key) {
    var meta = USER_MODEL_KEYS.filter(function (item) { return item.key === key; })[0];
    if (!meta) return;
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: meta.label }));
      p.appendChild(el('p', { class: 'p', text: DRIP_UI.estimateHint }));
      p.appendChild(el('div', { class: 'chips' }, [1, 2, 3, 4, 5].map(function (n) {
        return el('button', { class: 'chip', text: '' + n, onclick: function () {
          if (!correctEstimate(key, n)) return;
          closeSheet(); render();
        } });
      })));
      p.appendChild(el('p', { class: 'p-sm', text: meta.low + ' → ' + meta.high }));
      p.appendChild(el('button', { class: 'btn ghost', text: DRIP_UI.reset, onclick: function () {
        if (!clearEstimate(key)) return;
        closeSheet(); render();
      } }));
      p.appendChild(el('button', { class: 'btn quiet', text: DRIP_UI.close, onclick: closeSheet }));
    });
  }

  function paceMult() { return state.pace || 1; }
  function fmtTime(sec) {
    sec = Math.round(sec);
    var m = Math.floor(sec / 60), s = sec % 60;
    return m ? (m + ':' + (s < 10 ? '0' : '') + s + ' min') : (s + ' sec');
  }

  /* ══ RUNNER ═══════════════════════════════════════════════════════════════
   * Branches: paced breathing session (Apple-Watch style) for skills with a
   * `pattern`, or a guided step walk-through for everything else. Either way
   * it moves through the WHOLE exercise, spoken and paced. */
  var runState = null;

  function openRunnerShell() {
    $('#runner').classList.add('on'); $('#runner').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeRunner() {
    if (runState) { clearTimeout(runState.timer); clearInterval(runState.ticker); }
    $('#runner').classList.remove('on'); $('#runner').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; runState = null; hushVoice();
    // Setup mode may have replaced the orb markup, so guard before touching it.
    var o = $('#runOrb'), r = $('#runOrbRing');
    if (o) { o.classList.remove('paced'); o.style.transition = ''; o.style.transform = ''; }
    if (r) { r.classList.remove('paced'); r.style.transition = ''; r.style.transform = ''; }
  }
  function finishSkill(helpful) {
    state.skillRuns.push({ t: Date.now(), id: runState.skill.id, helpful: helpful });
    save(); closeRunner(); render();
  }
  function startSkill(id) {
    var s = SKILLS.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    // If the user told Calm they're around people, start silent. Otherwise follow
    // their global voice setting. The speaker toggle can flip it either way.
    sessionMute = (calm.seen === true);
    openRunnerShell();
    renderVoiceToggle($('#runVoice'), 'runner');
    if (s.pattern) breathSetup(s);
    else startSteps(s);
  }

  function runnerDone(s) {
    clearTimeout(runState && runState.timer); clearInterval(runState && runState.ticker);
    hushVoice();
    $('#runStep').textContent = s.name + ' · done';
    $('#runGuide').style.display = 'none';
    var prog = $('#runProgress'); clear(prog);
    $('#runOrb').classList.remove('paced'); $('#runOrb').style.transition = 'transform 1s var(--ease-soft)';
    $('#runOrb').style.transform = 'scale(.82)'; $('#runOrbRing').style.transform = 'scale(.82)';
    $('#runOrbCount').textContent = '';
    $('#runText').textContent = 'That’s it. Did that help at all?';
    $('#runMeta').textContent = ''; $('#runWhy').style.display = 'none';
    var actions = $('#runActions'); clear(actions);
    actions.appendChild(el('button', { class: 'btn', text: 'It helped', onclick: function () { finishSkill(true); } }));
    actions.appendChild(el('button', { class: 'btn ghost', text: 'Not really', onclick: function () { finishSkill(false); } }));
    actions.appendChild(el('button', { class: 'btn quiet', text: 'Skip', onclick: function () { finishSkill(null); } }));
  }

  /* ── Step walk-through ─────────────────────────────────────────────────── */
  function startSteps(s) {
    rebuildStage(); // setup mode may have replaced the stage; restore canonical orb
    runState = { skill: s, i: 0, guide: true, timer: null, ticker: null };
    $('#runOrb').classList.remove('paced'); $('#runOrb').style.transition = '';
    renderSteps();
  }
  // Generous, readable pacing — long enough for someone reading in a second
  // language, and never shorter than a comfortable minimum. Pace slider scales it.
  function stepDuration(text) { return Math.max(9000, text.split(/\s+/).length * 700) * paceMult(); }
  function renderSteps() {
    clearTimeout(runState.timer); clearInterval(runState.ticker);
    var s = runState.skill, done = runState.i >= s.steps.length;
    if (done) { runnerDone(s); return; }
    $('#runStep').textContent = s.name;
    var prog = $('#runProgress'); clear(prog);
    s.steps.forEach(function (_, i) { prog.appendChild(el('i', { class: i <= runState.i ? 'on' : '' })); });
    $('#runText').textContent = s.steps[runState.i];
    $('#runMeta').textContent = 'Step ' + (runState.i + 1) + ' of ' + s.steps.length;
    var why = $('#runWhy'); why.textContent = runState.i === 0 ? s.mechanism : '';
    why.style.display = runState.i === 0 ? '' : 'none';

    var g = $('#runGuide'); g.style.display = ''; g.setAttribute('aria-pressed', runState.guide ? 'true' : 'false');
    $('#runGuideLabel').textContent = runState.guide ? 'Guiding' : 'Guide me';
    $('#runGuideIcon').innerHTML = runState.guide ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';

    speak(s.steps[runState.i]); buzz(10);
    var orb = $('#runOrb'), count = $('#runOrbCount');
    if (runState.guide) {
      // Visible countdown so the user always knows how long they have on this step,
      // and a gentle orb swell across the whole step. No more silent fast-forward.
      var dur = stepDuration(s.steps[runState.i]), endAt = Date.now() + dur;
      orb.classList.add('paced'); orb.style.transition = 'transform ' + dur + 'ms var(--ease-soft)';
      orb.style.transform = 'scale(1.02)';
      count.textContent = Math.ceil(dur / 1000);
      runState.ticker = setInterval(function () {
        var left = Math.ceil((endAt - Date.now()) / 1000);
        count.textContent = left > 0 ? left : '';
      }, 200);
      runState.timer = setTimeout(function () { orb.style.transform = 'scale(.82)'; runState.i++; renderSteps(); }, dur);
    } else {
      count.textContent = ''; orb.classList.remove('paced'); orb.style.transition = ''; orb.style.transform = '';
    }

    var actions = $('#runActions'); clear(actions);
    actions.appendChild(el('button', { class: 'btn', text: runState.i === s.steps.length - 1 ? 'Finish' : 'Next',
      onclick: function () { clearTimeout(runState.timer); clearInterval(runState.ticker); runState.i++; renderSteps(); } }));
    actions.appendChild(el('button', { class: 'btn quiet',
      text: runState.guide ? 'Pause the timer' : 'Timer off — I’ll tap Next',
      onclick: function () { toggleGuide(); } }));
    actions.appendChild(el('button', { class: 'btn quiet', text: 'Stop — no problem', onclick: closeRunner }));
  }
  function toggleGuide() {
    if (!runState || runState.i >= runState.skill.steps.length) return;
    runState.guide = !runState.guide; buzz(12); renderSteps();
  }

  /* ── Paced breathing session (Apple-Watch style) ───────────────────────── */
  function cycleSecs(s) { return s.pattern.phases.reduce(function (a, p) { return a + p.secs; }, 0); }

  function breathSetup(s) {
    clearTimeout(runState && runState.timer);
    runState = { skill: s, mode: 'setup', breaths: s.pattern.defaultBreaths, timer: null, ticker: null };
    $('#runStep').textContent = s.name;
    $('#runGuide').style.display = 'none';
    var prog = $('#runProgress'); clear(prog);
    $('#runOrb').classList.remove('paced'); $('#runOrb').style.transition = ''; $('#runOrb').style.transform = '';
    $('#runOrbCount').textContent = '';
    $('#runText').textContent = ''; $('#runMeta').textContent = ''; $('#runWhy').style.display = 'none';

    var stage = $('.run-stage'); clear(stage);
    stage.appendChild(el('div', { class: 'run-orb-hold' }, [
      el('div', { class: 'run-orb-ring' }), el('div', { class: 'run-orb' })
    ]));
    stage.appendChild(el('p', { class: 'bs-title', text: 'Set your breaths' }));
    stage.appendChild(el('p', { class: 'bs-sub', text: 'In through the nose, out through the mouth. Pick how many rounds, and how slow.' }));

    var breathOpts = [Math.max(4, s.pattern.defaultBreaths - 3), s.pattern.defaultBreaths, s.pattern.defaultBreaths + 6];
    var est = el('p', { class: 'bs-est' });
    function refreshEst() {
      var total = runState.breaths * cycleSecs(s) * paceMult();
      est.textContent = 'About ' + fmtTime(total);
    }
    var breathRow = el('div', { class: 'bs-opts' }, breathOpts.map(function (n, i) {
      return el('button', { class: 'bs-opt', 'aria-pressed': n === runState.breaths ? 'true' : 'false',
        html: n + '<small>' + ['short', 'steady', 'long'][i] + '</small>',
        onclick: function () { runState.breaths = n; buzz(8); refreshEst(); markPressed(breathRow, this); } });
    }));
    var paceRow = el('div', { class: 'bs-opts' }, [
      { l: 'Slow', v: 1.25 }, { l: 'Steady', v: 1 }
    ].map(function (o) {
      return el('button', { class: 'bs-opt', 'aria-pressed': (state.pace || 1) === o.v ? 'true' : 'false',
        html: o.l, onclick: function () { state.pace = o.v; save(); buzz(8); refreshEst(); markPressed(paceRow, this); } });
    }));
    stage.appendChild(el('div', { class: 'bs-group' }, [el('p', { class: 'eyebrow', text: 'Breaths' }), breathRow]));
    stage.appendChild(el('div', { class: 'bs-group' }, [el('p', { class: 'eyebrow', text: 'Pace' }), paceRow]));
    stage.appendChild(est); refreshEst();

    var actions = $('#runActions'); clear(actions);
    actions.appendChild(el('button', { class: 'btn', text: 'Begin', onclick: function () { rebuildStage(); breathRun(s); } }));
    actions.appendChild(el('button', { class: 'btn quiet', text: 'Read the steps instead', onclick: function () { rebuildStage(); startSteps(s); } }));
    actions.appendChild(el('button', { class: 'btn quiet', text: 'Close', onclick: closeRunner }));
  }
  function markPressed(row, btn) {
    Array.prototype.forEach.call(row.children, function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
  }
  // Setup replaced the stage's inner nodes; rebuild the canonical orb markup.
  function rebuildStage() {
    var stage = $('.run-stage'); clear(stage);
    stage.appendChild(el('div', { class: 'run-orb-hold' }, [
      el('div', { class: 'run-orb-ring', id: 'runOrbRing' }),
      el('div', { class: 'run-orb', id: 'runOrb' }, [el('span', { class: 'run-orb-count', id: 'runOrbCount' })])
    ]));
    stage.appendChild(el('p', { class: 'run-text', id: 'runText' }));
    stage.appendChild(el('p', { class: 'run-meta', id: 'runMeta' }));
    stage.appendChild(el('p', { class: 'run-why', id: 'runWhy' }));
  }

  function breathRun(s) {
    var phases = s.pattern.phases;
    runState = Object.assign(runState, { mode: 'run', s: s, phases: phases, bi: 0, pi: 0, paused: false, timer: null, ticker: null, phaseEnd: 0 });
    var orb = $('#runOrb'), ring = $('#runOrbRing');
    orb.classList.add('paced'); ring.classList.add('paced');
    $('#runGuide').style.display = 'none';

    function totalRemaining() {
      var per = cycleSecs(s) * paceMult();
      var doneCycles = runState.bi;
      var doneInCycle = phases.slice(0, runState.pi).reduce(function (a, p) { return a + p.secs; }, 0) * paceMult();
      var elapsed = doneCycles * per + doneInCycle;
      return Math.max(0, runState.breaths * per - elapsed);
    }

    function runPhase() {
      var ph = phases[runState.pi];
      var dur = ph.secs * paceMult() * 1000;
      $('#runText').textContent = ph.label;
      $('#runMeta').textContent = 'Breath ' + (runState.bi + 1) + ' of ' + runState.breaths + ' · ' + fmtTime(totalRemaining()) + ' left';
      orb.style.transition = 'transform ' + dur + 'ms var(--ease-soft)';
      ring.style.transition = 'transform ' + dur + 'ms var(--ease-soft)';
      orb.style.transform = 'scale(' + ph.scale + ')';
      ring.style.transform = 'scale(' + (ph.scale + 0.12) + ')';
      speak(ph.label);
      buzz(ph.scale >= 0.9 ? [14, 60, 14] : 14);
      runState.phaseEnd = Date.now() + dur;
      clearInterval(runState.ticker);
      runState.ticker = setInterval(function () {
        var left = Math.ceil((runState.phaseEnd - Date.now()) / 1000);
        $('#runOrbCount').textContent = left > 0 ? left : '';
      }, 120);
      $('#runOrbCount').textContent = Math.ceil(dur / 1000);
      runState.timer = setTimeout(nextPhase, dur);
    }
    function nextPhase() {
      runState.pi++;
      if (runState.pi >= phases.length) { runState.pi = 0; runState.bi++; }
      if (runState.bi >= runState.breaths) { clearInterval(runState.ticker); runnerDone(s); return; }
      runPhase();
    }
    function pause() {
      runState.paused = true; clearTimeout(runState.timer); clearInterval(runState.ticker);
      runState.remaining = runState.phaseEnd - Date.now(); hushVoice();
      var c = getComputedStyle(orb).transform; orb.style.transition = 'none'; orb.style.transform = c;
      drawRunActions();
    }
    function resume() {
      runState.paused = false;
      var ph = phases[runState.pi], dur = Math.max(200, runState.remaining || 1);
      orb.style.transition = 'transform ' + dur + 'ms var(--ease-soft)'; orb.style.transform = 'scale(' + ph.scale + ')';
      ring.style.transition = 'transform ' + dur + 'ms var(--ease-soft)'; ring.style.transform = 'scale(' + (ph.scale + 0.12) + ')';
      runState.phaseEnd = Date.now() + dur;
      runState.ticker = setInterval(function () { var l = Math.ceil((runState.phaseEnd - Date.now()) / 1000); $('#runOrbCount').textContent = l > 0 ? l : ''; }, 120);
      runState.timer = setTimeout(nextPhase, dur);
      drawRunActions();
    }
    function drawRunActions() {
      var actions = $('#runActions'); clear(actions);
      actions.appendChild(el('button', { class: 'btn', text: runState.paused ? 'Resume' : 'Pause',
        onclick: function () { buzz(10); runState.paused ? resume() : pause(); } }));
      actions.appendChild(el('button', { class: 'btn quiet', text: 'End', onclick: closeRunner }));
    }
    var prog = $('#runProgress'); clear(prog);
    drawRunActions();
    runPhase();
  }

  /* ── Sheet ─────────────────────────────────────────────────────────────── */
  function setSheetBackgroundInert(on) {
    ['#app', '#fab', '#panic', '#runner', '#journalEditor'].forEach(function (selector) {
      var node = $(selector);
      if (!node) return;
      if (on) node.setAttribute('inert', '');
      else node.removeAttribute('inert');
    });
  }
  function trapSheetFocus(e) {
    var panel = $('#sheetPanel');
    var items = Array.prototype.filter.call(panel.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'), function (node) {
      return !node.disabled && node.getAttribute('aria-hidden') !== 'true';
    });
    if (!items.length) { e.preventDefault(); return; }
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openSheet(build) {
    if (!$('#sheet').classList.contains('on')) sheetOpener = document.activeElement;
    var panel = $('#sheetPanel'); clear(panel);
    panel.appendChild(el('div', { class: 'grab' }));
    build(panel);
    var heading = panel.querySelector('h1, h2, h3');
    if (heading) {
      heading.id = 'sheetTitle';
      $('#sheet').removeAttribute('aria-label');
      $('#sheet').setAttribute('aria-labelledby', 'sheetTitle');
    } else {
      $('#sheet').removeAttribute('aria-labelledby');
      $('#sheet').setAttribute('aria-label', 'Options');
    }
    $('#sheet').classList.add('on'); $('#sheet').setAttribute('aria-hidden', 'false');
    setSheetBackgroundInert(true);
    document.body.style.overflow = 'hidden';
    var f = panel.querySelector('button, input, select, textarea, a'); if (f) f.focus();
  }
  function closeSheet() {
    coverImageRequest++;
    $('#sheet').classList.remove('on'); $('#sheet').setAttribute('aria-hidden', 'true');
    setSheetBackgroundInert(false);
    document.body.style.overflow = '';
    if (sheetOpener && document.documentElement.contains(sheetOpener)) sheetOpener.focus();
    sheetOpener = null;
  }

  /* ── Technique detail + card ───────────────────────────────────────────── */
  function skillSheet(id) {
    var s = SKILLS.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    var dm = DOMAIN_META[s.domain], fm = FAMILY_META[s.family];
    openSheet(function (p) {
      p.appendChild(el('span', { class: 'domain', style: 'color:var(' + dm.cssVar + ')', text: dm.label }));
      p.appendChild(el('h2', { class: 'h-sec', text: s.name }));
      p.appendChild(el('p', { class: 'meta', text: s.mins + ' min · ' + fm.label + ' · ' + NEEDS_META[s.needs].label + (s.pattern ? ' · paced' : '') }));
      p.appendChild(el('hr', { class: 'sep' }));
      p.appendChild(el('p', { class: 'eyebrow', text: 'Why it works' }));
      p.appendChild(el('p', { class: 'p', text: s.mechanism }));
      if (s.contraindication.length) {
        p.appendChild(el('div', { class: 'notice', html:
          '<b>Not for everyone.</b> Skip this one if: ' + s.contraindication.join(', ') +
          '. If you are unsure, ask a professional rather than this app.' }));
      }
      if (s.traumaCaution && traumaAware()) {
        p.appendChild(el('div', { class: 'notice', html:
          '<b>Gentle note.</b> Exercises that turn attention inward can stir things up if your past has been hard. Stop any time, and keep something grounding nearby.' }));
      }
      p.appendChild(el('p', { class: 'p-sm', text: 'Source: ' + s.source }));
      p.appendChild(el('button', { class: 'btn', text: 'Begin', onclick: function () { closeSheet(); startSkill(s.id); } }));
      var fav = state.favourites.indexOf(s.id) !== -1;
      p.appendChild(el('button', { class: 'btn ghost', text: fav ? 'Saved — remove' : 'Save to my shortlist',
        onclick: function () {
          var i = state.favourites.indexOf(s.id);
          if (i === -1) state.favourites.push(s.id); else state.favourites.splice(i, 1);
          save(); closeSheet(); render();
        } }));
      p.appendChild(el('button', { class: 'btn quiet', text: 'Close', onclick: closeSheet }));
    });
  }
  function skillCard(s, showWhy) {
    var dm = DOMAIN_META[s.domain];
    return el('button', { class: 'card tap', onclick: function () { skillSheet(s.id); } }, [
      el('div', { class: 'card-head' }, [
        el('h3', { class: 'card-title', text: s.name }),
        el('span', { class: 'domain', style: 'color:var(' + dm.cssVar + ')', text: dm.label })
      ]),
      el('p', { class: 'meta', text: s.mins + ' min · ' + NEEDS_META[s.needs].label + (s.pattern ? ' · guided breathing' : '') }),
      showWhy ? el('p', { class: 'p-sm', text: s.blurb }) : null
    ]);
  }

  /* ── Calm — guided front door ──────────────────────────────────────────── */
  var calm = { need: null, seen: null, hand: ['none'], browse: false, section: 'guided' };
  var libraryQuery = '';

  function toggleCalmHand(key) {
    if (key === 'none') {
      calm.hand = ['none'];
      return;
    }
    calm.hand = calm.hand.filter(function (item) { return item !== 'none'; });
    var i = calm.hand.indexOf(key);
    if (i === -1) calm.hand.push(key); else calm.hand.splice(i, 1);
    if (!calm.hand.length) calm.hand = ['none'];
  }

  function articleSheet(id) {
    var article = ARTICLES.filter(function (item) { return item.id === id; })[0];
    if (!article) return;
    openSheet(function (p) {
      p.appendChild(el('p', { class: 'eyebrow', text: LIBRARY_UI.label }));
      p.appendChild(el('h2', { class: 'h-sec', text: article.title }));
      p.appendChild(el('button', { class: 'btn quiet article-close-top', text: LIBRARY_UI.close, onclick: closeSheet }));
      p.appendChild(el('p', { class: 'p-voice', text: article.summary }));
      p.appendChild(el('div', { class: 'notice', text: LIBRARY_UI.reviewNote }));
      article.sections.forEach(function (section) {
        p.appendChild(el('h3', { class: 'card-title article-heading', text: section.title }));
        p.appendChild(el('p', { class: 'p', text: section.body }));
      });
      p.appendChild(el('p', { class: 'eyebrow article-label', text: LIBRARY_UI.practical }));
      p.appendChild(el('ul', { class: 'article-list' }, article.practical.map(function (item) { return el('li', { text: item }); })));
      p.appendChild(el('p', { class: 'eyebrow article-label', text: LIBRARY_UI.reflect }));
      p.appendChild(el('ul', { class: 'article-list' }, article.reflection.map(function (item) { return el('li', { text: item }); })));
      p.appendChild(el('p', { class: 'eyebrow article-label', text: LIBRARY_UI.support }));
      p.appendChild(el('div', { class: 'notice', text: article.support }));
      p.appendChild(el('p', { class: 'eyebrow article-label', text: LIBRARY_UI.related }));
      article.skillIds.forEach(function (skillId) {
        var skill = SKILLS.filter(function (item) { return item.id === skillId; })[0];
        if (skill) p.appendChild(el('button', { class: 'btn ghost', text: skill.name, onclick: function () { skillSheet(skill.id); } }));
      });
      p.appendChild(el('p', { class: 'eyebrow article-label', text: LIBRARY_UI.references }));
      article.references.forEach(function (reference) { p.appendChild(el('p', { class: 'p-sm', text: reference })); });
      p.appendChild(el('button', { class: 'btn quiet', text: LIBRARY_UI.close, onclick: closeSheet }));
    });
  }
  function renderLibrary(v) {
    v.appendChild(el('button', { class: 'btn ghost', text: LIBRARY_UI.back, onclick: function () { calm.section = 'guided'; render(); } }));
    v.appendChild(el('p', { class: 'p', text: LIBRARY_UI.intro }));
    var search = el('input', { type:'search', value:libraryQuery, placeholder:LIBRARY_UI.searchPlaceholder, 'aria-label':LIBRARY_UI.searchLabel });
    var status = el('p', { class:'meta library-status', role:'status', 'aria-live':'polite', 'aria-atomic':'true' });
    var results = el('div', { class:'stack library-results' });
    function draw() {
      clear(results);
      var query = libraryQuery.trim().toLowerCase();
      var matches = ARTICLES.filter(function (article) {
        return !query || [article.title, article.summary].concat(article.tags).join(' ').toLowerCase().indexOf(query) !== -1;
      });
      status.textContent = !matches.length
        ? LIBRARY_UI.noMatches
        : (matches.length === 1 ? LIBRARY_UI.resultStatusOne : LIBRARY_UI.resultStatus.replace('{n}', '' + matches.length));
      if (!matches.length) results.appendChild(el('div', { class:'notice', text:LIBRARY_UI.noMatches }));
      matches.forEach(function (article) {
        results.appendChild(el('button', { class:'card tap article-card', onclick:function () { articleSheet(article.id); } }, [
          el('h2', { class:'card-title', text:article.title }),
          el('p', { class:'p-sm', text:article.summary }),
          el('p', { class:'meta', text:article.skillIds.length + ' related exercise' + (article.skillIds.length === 1 ? '' : 's') })
        ]));
      });
    }
    search.addEventListener('input', function () { libraryQuery = search.value; draw(); });
    v.appendChild(search); v.appendChild(status); v.appendChild(results); draw();
  }
  function supportDayKey() { return localDayKey(Date.now()); }
  function showSupportSaveFailed() {
    openSheet(function (p) {
      p.appendChild(el('h2', { class:'h-sec', text:SUPPORT_UI.saveFailedTitle }));
      p.appendChild(el('p', { class:'p', text:SUPPORT_UI.saveFailedBody }));
      p.appendChild(el('button', { class:'btn', text:CHECKIN_UI.ok, onclick:closeSheet }));
    });
  }
  function toggleDailySupport(id) {
    var before = clone(state.dailySupports);
    var i = state.dailySupports.selected.indexOf(id);
    if (i === -1) state.dailySupports.selected.push(id); else state.dailySupports.selected.splice(i, 1);
    if (!save()) { state.dailySupports = before; showSupportSaveFailed(); return; }
    reRender();
  }
  function toggleSupportDone(id) {
    var before = clone(state.dailySupports);
    var key = supportDayKey();
    var done = Array.isArray(state.dailySupports.days[key]) ? state.dailySupports.days[key].slice() : [];
    var i = done.indexOf(id);
    if (i === -1) done.push(id); else done.splice(i, 1);
    if (done.length) state.dailySupports.days[key] = done; else delete state.dailySupports.days[key];
    if (!save()) { state.dailySupports = before; showSupportSaveFailed(); return; }
    buzz(8); reRender();
  }
  function renderDailySupports(v) {
    v.appendChild(el('button', { class:'btn ghost', text:SUPPORT_UI.back, onclick:function () { calm.section = 'guided'; render(); } }));
    v.appendChild(el('p', { class:'p', text:SUPPORT_UI.intro }));
    v.appendChild(el('p', { class:'eyebrow', text:SUPPORT_UI.choose }));
    v.appendChild(el('div', { class:'chips', role:'group', 'aria-label':SUPPORT_UI.choose }, DAILY_SUPPORTS.map(function (support) {
      return el('button', { class:'chip', 'aria-pressed':state.dailySupports.selected.indexOf(support.id) !== -1 ? 'true' : 'false',
        text:support.title, onclick:function () { toggleDailySupport(support.id); } });
    })));
    var selected = DAILY_SUPPORTS.filter(function (support) { return state.dailySupports.selected.indexOf(support.id) !== -1; });
    if (!selected.length) { v.appendChild(el('div', { class:'notice', text:SUPPORT_UI.empty })); return; }
    v.appendChild(el('p', { class:'eyebrow support-today', text:SUPPORT_UI.today }));
    var storedDone = state.dailySupports.days[supportDayKey()];
    var done = Array.isArray(storedDone) ? storedDone : [];
    selected.forEach(function (support) {
      var complete = done.indexOf(support.id) !== -1;
      v.appendChild(el('div', { class:'card support-card' }, [
        el('h2', { class:'card-title', text:support.title }),
        el('p', { class:'p-sm', text:support.note }),
        el('button', { class:'btn ghost', 'aria-pressed':complete ? 'true' : 'false',
          text:complete ? SUPPORT_UI.done : SUPPORT_UI.notDone, onclick:function () { toggleSupportDone(support.id); } })
      ]));
    });
  }
  function renderCalm() {
    var v = $('#view-calm'); clear(v);
    var title = calm.browse ? 'Every technique.' : calm.section === 'library' ? LIBRARY_UI.title : calm.section === 'supports' ? SUPPORT_UI.title : 'What do you need\nright now?';
    v.appendChild(el('div', {}, [
      el('p', { class: 'eyebrow', text: 'Calm' }),
      el('h1', { class: 'h-voice', text: title })
    ]));
    v.appendChild(el('button', { class: 'help-btn', text: t('helpNow'), onclick: openPanic }));
    v.appendChild(el('div', { class:'notice', text:CALM_REVIEW_NOTE }));

    if (calm.section === 'library') { renderLibrary(v); return; }
    if (calm.section === 'supports') { renderDailySupports(v); return; }
    if (calm.browse) {
      v.appendChild(el('button', { class: 'btn ghost', text: '← Back to guided', onclick: function () { calm.browse = false; render(); } }));
      Object.keys(FAMILY_META).forEach(function (fam) {
        var items = SKILLS.filter(function (s) { return s.family === fam; });
        if (!items.length) return;
        v.appendChild(el('div', {}, [
          el('p', { class: 'domain', style: 'color:var(--ink-3);margin:12px 0 3px', text: FAMILY_META[fam].label }),
          el('p', { class: 'p-sm', style: 'margin-bottom:10px', text: FAMILY_META[fam].note })
        ]));
        items.forEach(function (s) { v.appendChild(skillCard(s, true)); });
      });
      return;
    }

    if (!calm.need) {
      v.appendChild(el('div', { class:'calm-tools' }, [
        el('button', { class:'card tap calm-tool', onclick:function () { calm.section = 'library'; calm.browse = false; render(); } }, [
          el('h2', { class:'card-title', text:LIBRARY_UI.title }),
          el('p', { class:'p-sm', text:LIBRARY_UI.homeHint })
        ]),
        el('button', { class:'card tap calm-tool', onclick:function () { calm.section = 'supports'; calm.browse = false; render(); } }, [
          el('h2', { class:'card-title', text:SUPPORT_UI.title }),
          el('p', { class:'p-sm', text:SUPPORT_UI.homeHint })
        ])
      ]));
    }

    // Q1 — what do you need
    v.appendChild(el('div', { class: 'stack' }, CALM_NEEDS.map(function (n) {
      return el('button', { class: 'opt', 'aria-pressed': calm.need === n.key ? 'true' : 'false',
        html: n.label + '<span class="os">' + n.sub + '</span>',
        onclick: function () { calm.need = calm.need === n.key ? null : n.key; buzz(8); render(); } });
    })));

    if (!calm.need) {
      v.appendChild(el('button', { class: 'btn quiet', text: 'Just show me everything', onclick: function () { calm.browse = true; render(); } }));
      return;
    }

    // Q2 — context (only once a need is chosen)
    v.appendChild(el('div', {}, [
      el('p', { class: 'p-voice', text: 'Where are you?' }),
      el('div', { style: 'height:10px' }),
      el('div', { class: 'chips' }, [
        el('button', { class: 'chip', 'aria-pressed': calm.seen === false ? 'true' : 'false', text: 'On my own',
          onclick: function () { calm.seen = calm.seen === false ? null : false; render(); } }),
        el('button', { class: 'chip', 'aria-pressed': calm.seen === true ? 'true' : 'false', text: 'Around people',
          onclick: function () { calm.seen = calm.seen === true ? null : true; render(); } })
      ])
    ]));
    v.appendChild(el('div', {}, [
      el('p', { class: 'p-voice', text: 'Got anything to hand?' }),
      el('div', { style: 'height:10px' }),
      el('div', { class: 'chips', role: 'group', 'aria-label': 'Things available' }, CALM_HAND_OPTIONS.map(function (o) {
        return el('button', { class: 'chip', 'aria-pressed': calm.hand.indexOf(o.key) !== -1 ? 'true' : 'false', text: o.label,
          onclick: function () { toggleCalmHand(o.key); render(); } });
      }))
    ]));

    // Results
    var need = CALM_NEEDS.filter(function (n) { return n.key === calm.need; })[0];
    var cap = currentCapacity();
    var list = SKILLS.filter(function (s) {
      if (need.families.indexOf(s.family) === -1) return false;
      if (!capacityFits(s.capacity, cap)) return false;
      if (calm.seen === true && !s.discreet) return false;
      if (['water', 'cold', 'sour', 'space'].indexOf(s.needs) !== -1 && calm.hand.indexOf(s.needs) === -1) return false;
      return true;
    });
    list.sort(function (a, b) { return helpfulScore(b.id) - helpfulScore(a.id); });

    v.appendChild(el('p', { class: 'eyebrow', style: 'margin-top:6px', text: list.length ? 'For "' + need.label.toLowerCase() + '"' : 'Nothing matches' }));
    if (!list.length) v.appendChild(el('div', { class: 'notice', text: 'Nothing fits that exact combination. Try clearing what you’ve got to hand, or browse everything below.' }));
    list.forEach(function (s) { v.appendChild(skillCard(s, true)); });
    v.appendChild(el('button', { class: 'btn quiet', text: 'Browse all techniques', onclick: function () { calm.browse = true; render(); } }));
  }

  /* ── Journal ───────────────────────────────────────────────────────────── */
  var JOURNAL_MOODS = ['😌', '🙂', '😐', '😔', '😣'];
  var draft = null;
  var journalQuery = '';
  var journalRecognition = null;
  var journalVoiceRequest = 0;
  var coverImageRequest = 0;

  function coverColors() { return COVER_COLORS[state.journalCover.color] || COVER_COLORS[0]; }
  function localImageSource(src) {
    return typeof src === 'string' && /^data:image\/(?:jpeg|png|webp);base64,/i.test(src) ? src : '';
  }
  function journalMonthKey(t) {
    var d = new Date(t);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
  }
  function journalMonthLabel(t) {
    return new Date(t).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  function showStorageFull(retry) {
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: JOURNAL_UI.storageFullTitle }));
      p.appendChild(el('p', { class: 'p', text: JOURNAL_UI.storageFullBody }));
      p.appendChild(el('button', { class: 'btn', text: 'OK', onclick: function () {
        closeSheet();
        if (retry) retry();
      } }));
    });
  }
  function renderJournal() {
    var v = $('#view-journal'); clear(v);
    var cov = state.journalCover, cc = coverColors(), coverPhoto = localImageSource(cov.photo);

    // The book cover — customisable, sets the mood of the whole tab.
    var cover = el('button', { class: 'book-cover',
      style: '--bc-a:' + cc[0] + ';--bc-b:' + cc[1], onclick: coverSheet }, [
      coverPhoto ? el('img', { class: 'bc-photo', src: coverPhoto, alt: '' }) : null,
      coverPhoto ? el('span', { class: 'bc-shade' }) : null,
      el('span', { class: 'bc-edit', text: 'Customise' }),
      cov.sticker ? el('span', { class: 'bc-sticker', text: cov.sticker }) : null,
      el('h1', { class: 'bc-title', text: cov.title || 'My Journal' }),
      el('p', { class: 'bc-sub', text: cov.subtitle || (state.journal.length + (state.journal.length === 1 ? ' entry' : ' entries')) })
    ]);
    v.appendChild(cover);
    v.appendChild(el('button', { class: 'btn', text: '＋  New entry', onclick: newEntrySheet }));

    if (!state.journal.length) {
      v.appendChild(el('div', { class: 'card' }, [
        el('p', { class: 'p-voice', text: 'A private place to put things down. No one else can read it — it lives on your phone.' }),
        el('p', { class: 'p-sm', text: 'Write freely, add a photo, drop in a sticker, tag how the day felt. Or don’t. It’s yours.' })
      ]));
    } else {
      v.appendChild(el('p', { class: 'eyebrow', style: 'margin-top:4px', text: 'Contents' }));
      var search = el('input', { class: 'journal-search', type: 'search', value: journalQuery,
        placeholder: JOURNAL_UI.searchPlaceholder, 'aria-label': JOURNAL_UI.searchLabel });
      var contents = el('div', { class: 'journal-contents' });
      search.addEventListener('input', function () {
        journalQuery = search.value;
        renderJournalContents(contents);
      });
      v.appendChild(search);

      var sorted = state.journal.slice().sort(function (a, b) { return b.t - a.t; });
      var seenMonths = {};
      var months = sorted.filter(function (e) {
        var key = journalMonthKey(e.t);
        if (seenMonths[key]) return false;
        seenMonths[key] = true;
        return true;
      });
      if (months.length > 1) {
        var jump = el('select', { class: 'journal-months', 'aria-label': 'Jump to month' },
          [el('option', { value: '', text: JOURNAL_UI.allMonths })].concat(months.map(function (e) {
            return el('option', { value: journalMonthKey(e.t), text: journalMonthLabel(e.t) });
          })));
        jump.addEventListener('change', function () {
          var target = jump.value && $('#jm-' + jump.value);
          if (target) target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
          jump.value = '';
        });
        v.appendChild(jump);
      }
      v.appendChild(contents);
      renderJournalContents(contents);
    }
    v.appendChild(el('button', { class: 'help-btn', text: t('helpNow'), onclick: openPanic }));
  }

  function renderJournalContents(wrap) {
    clear(wrap);
    var query = journalQuery.trim().toLowerCase();
    var sorted = state.journal.slice().sort(function (a, b) { return b.t - a.t; }).filter(function (e) {
      return !query || ((e.title || '') + ' ' + (e.body || '')).toLowerCase().indexOf(query) !== -1;
    });
    if (!sorted.length) {
      wrap.appendChild(el('div', { class: 'notice', text: JOURNAL_UI.noMatches }));
      return;
    }
    var lastMonth = '';
    sorted.forEach(function (e) {
      var key = journalMonthKey(e.t);
      if (key !== lastMonth) {
        wrap.appendChild(el('h2', { id: 'jm-' + key, class: 'journal-month-heading', text: journalMonthLabel(e.t) }));
        lastMonth = key;
      }
      var d = new Date(e.t);
      wrap.appendChild(el('button', { class: 'j-entry' + (e.decor ? ' decor-' + e.decor : ''), onclick: function () { openEditor(e.id); } }, [
        el('p', { class: 'jd', text: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + (e.mood ? '  ' + e.mood : '') }),
        e.title ? el('p', { class: 'jt', text: e.title }) : null,
        el('p', { class: 'jx', text: e.body || '…' }),
        (e.photos && e.photos.length) ? el('div', { class: 'jphotos' }, e.photos.slice(0, 4).map(function (src) {
          src = localImageSource(src);
          if (!src) return null;
          return el('img', { src: src, alt: '', loading: 'lazy' });
        })) : null
      ]));
    });
  }

  function newEntrySheet() {
    journalQuery = '';
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: JOURNAL_UI.chooseStart }));
      p.appendChild(el('p', { class: 'p-sm', text: JOURNAL_UI.chooseStartHint }));
      p.appendChild(el('div', { class: 'stack' }, JOURNAL_TEMPLATES.map(function (template) {
        return el('button', { class: 'opt', onclick: function () {
          closeSheet();
          openEditor(null, template.key);
        } }, [
          el('span', { text: template.title }),
          el('span', { class: 'os', text: template.prompt })
        ]);
      })));
      p.appendChild(el('button', { class: 'btn quiet', text: 'Cancel', onclick: closeSheet }));
    });
  }

  function coverSheet(working) {
    working = working || clone(state.journalCover);
    working.photo = localImageSource(working.photo);
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: 'Your book' }));
      p.appendChild(el('p', { class: 'p-sm', text: 'Make it yours. This is just for you.' }));
      var title = el('input', { type: 'text', placeholder: 'My Journal', 'aria-label': 'Book title', value: working.title });
      var sub = el('input', { type: 'text', placeholder: 'A subtitle, if you like', 'aria-label': 'Subtitle', value: working.subtitle });
      p.appendChild(el('p', { class: 'eyebrow', text: 'Title' })); p.appendChild(title);
      p.appendChild(el('p', { class: 'eyebrow', text: 'Subtitle' })); p.appendChild(sub);
      p.appendChild(el('p', { class: 'eyebrow', text: 'Cover photo' }));
      var photoInput = el('input', { type: 'file', accept: 'image/*', hidden: 'hidden' });
      var photoBtn = el('button', { class: 'btn ghost', text: JOURNAL_UI.coverPhoto, onclick: function () {
        working.title = title.value;
        working.subtitle = sub.value;
        photoInput.click();
      } });
      photoInput.addEventListener('change', function () {
        var file = photoInput.files && photoInput.files[0];
        var imageRequest = ++coverImageRequest;
        if (file) scaleImageFile(file, function (src) {
          if (imageRequest !== coverImageRequest || !$('#sheet').classList.contains('on')) return;
          working.photo = src;
          coverSheet(working);
        });
      });
      p.appendChild(photoBtn);
      p.appendChild(photoInput);
      if (working.photo) {
        p.appendChild(el('img', { class: 'cover-photo-preview', src: working.photo, alt: 'Current cover photo' }));
        p.appendChild(el('button', { class: 'btn quiet', text: JOURNAL_UI.removeCoverPhoto, onclick: function () {
          working.title = title.value;
          working.subtitle = sub.value;
          working.photo = '';
          coverSheet(working);
        } }));
      }
      p.appendChild(el('p', { class: 'eyebrow', text: 'Cover colour' }));
      var sw = el('div', { class: 'cover-swatches' }, COVER_COLORS.map(function (c, i) {
        return el('button', { class: 'cover-swatch', 'aria-label': 'Colour ' + (i + 1), 'aria-pressed': working.color === i ? 'true' : 'false',
          style: 'background:linear-gradient(150deg,' + c[0] + ',' + c[1] + ')',
          onclick: function () { working.color = i; Array.prototype.forEach.call(sw.children, function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); } });
      }));
      p.appendChild(sw);
      p.appendChild(el('p', { class: 'eyebrow', text: 'Sticker' }));
      var st = el('div', { class: 'sticker-row' }, [''].concat(JOURNAL_STICKERS).map(function (s) {
        return el('button', { text: s || '—', 'aria-label': s ? 'Sticker ' + s : 'No sticker', 'aria-pressed': working.sticker === s ? 'true' : 'false',
          onclick: function () { working.sticker = s; Array.prototype.forEach.call(st.children, function (b) { b.setAttribute('aria-pressed', b.textContent === (s || '—') ? 'true' : 'false'); }); } });
      }));
      p.appendChild(st);
      p.appendChild(el('button', { class: 'btn', text: 'Save', onclick: function () {
        var previous = clone(state.journalCover);
        working.title = title.value.trim().slice(0, 40) || 'My Journal';
        working.subtitle = sub.value.trim().slice(0, 60);
        state.journalCover = clone(working);
        if (!save()) {
          state.journalCover = previous;
          showStorageFull(function () { coverSheet(working); });
          return;
        }
        closeSheet(); render();
      } }));
      p.appendChild(el('button', { class: 'btn quiet', text: 'Cancel', onclick: closeSheet }));
    });
  }

  function openEditor(id, templateKey) {
    var existing = id ? state.journal.filter(function (e) { return e.id === id; })[0] : null;
    var template = JOURNAL_TEMPLATES.filter(function (item) { return item.key === templateKey; })[0];
    draft = existing ? clone(existing) : {
      id: uid(), t: Date.now(), title: template ? template.seedTitle : '',
      body: template ? template.seedBody : '', mood: '', photos: [], decor: ''
    };
    draft.photos = (draft.photos || []).filter(function (src) { return !!localImageSource(src); });
    draft.decor = draft.decor || '';
    var isNew = !existing;

    $('#jeDate').textContent = new Date(draft.t).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    $('#jeTitle').value = draft.title;
    $('#jeBody').value = draft.body;
    $('#jePrompt').classList.remove('on'); $('#jePrompt').textContent = '';
    $('#jeVoiceStatus').textContent = '';
    $('#jeMicBtn').setAttribute('aria-pressed', 'false');
    $('#jeDecorBtn').setAttribute('aria-pressed', draft.decor ? 'true' : 'false');

    var moodWrap = $('#jeMoodWrap'); clear(moodWrap);
    JOURNAL_MOODS.forEach(function (m) {
      moodWrap.appendChild(el('button', { text: m, 'aria-label': 'Mood ' + m, 'aria-pressed': draft.mood === m ? 'true' : 'false',
        onclick: function () { draft.mood = draft.mood === m ? '' : m; Array.prototype.forEach.call(moodWrap.children, function (b) { b.setAttribute('aria-pressed', b.textContent === draft.mood ? 'true' : 'false'); }); } }));
    });
    renderDraftPhotos();

    // Delete control only for existing entries.
    var oldDel = $('#jeDelete'); if (oldDel) oldDel.parentNode.removeChild(oldDel);
    if (existing) {
      var del = el('button', { id: 'jeDelete', class: 'je-tool', 'aria-label': 'Delete entry', onclick: deleteDraftEntry,
        html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/></svg>' });
      $('#jeMoodWrap').parentNode.insertBefore(del, $('#jeMoodWrap'));
    }

    $('#journalEditor').classList.add('on'); $('#journalEditor').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $('#jeBody').focus(); }, 60);

    $('#jeSave').onclick = function () { saveDraft(isNew); };
  }
  function renderDraftPhotos() {
    var wrap = $('#jePhotos'); clear(wrap);
    draft.photos.forEach(function (src, idx) {
      src = localImageSource(src);
      if (!src) return;
      wrap.appendChild(el('div', { class: 'ph' }, [
        el('img', { src: src, alt: '' }),
        el('button', { class: 'rm', 'aria-label': 'Remove photo', text: '×',
          onclick: function () { draft.photos.splice(idx, 1); renderDraftPhotos(); } })
      ]));
    });
  }
  function closeEditor() {
    stopJournalRecognition(false);
    $('#journalEditor').classList.remove('on'); $('#journalEditor').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; draft = null;
  }
  function saveDraft(isNew) {
    stopJournalRecognition(false);
    draft.title = $('#jeTitle').value.trim();
    draft.body = $('#jeBody').value.trim();
    if (!draft.title && !draft.body && !draft.photos.length) { closeEditor(); return; } // nothing to save
    var previous = null;
    var index = -1;
    if (isNew) state.journal.push(draft);
    else {
      for (var entryIndex = 0; entryIndex < state.journal.length; entryIndex++) {
        if (state.journal[entryIndex].id === draft.id) { index = entryIndex; break; }
      }
      if (index !== -1) {
        previous = state.journal[index];
        state.journal[index] = draft;
      }
    }
    if (!save()) {
      if (isNew) state.journal.pop();
      else if (index !== -1) state.journal[index] = previous;
      showStorageFull();
      return;
    }
    closeEditor(); render();
  }
  // Down-scale before storing — full-res photos would blow the ~5MB local limit fast.
  function scaleImageFile(file, done) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var max = 1000, w = img.width, h = img.height;
      if (w > max || h > max) { var r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r); }
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { done(c.toDataURL('image/jpeg', 0.72)); } catch (e) {}
    };
    img.onerror = function () { URL.revokeObjectURL(url); };
    img.src = url;
  }
  function addPhotoFromFile(file) {
    var targetDraft = draft;
    var targetId = targetDraft && targetDraft.id;
    if (!targetDraft) return;
    scaleImageFile(file, function (src) {
      if (draft === targetDraft && draft.id === targetId) {
        draft.photos.push(src);
        renderDraftPhotos();
      }
    });
  }
  function decorateDraftSheet() {
    if (!draft) return;
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: JOURNAL_UI.decorate }));
      p.appendChild(el('div', { class: 'stack' }, JOURNAL_DECORATIONS.map(function (decor) {
        return el('button', { class: 'opt', 'aria-pressed': draft.decor === decor.key ? 'true' : 'false',
          onclick: function () {
            draft.decor = decor.key;
            $('#jeDecorBtn').setAttribute('aria-pressed', draft.decor ? 'true' : 'false');
            closeSheet();
          } }, [
          el('span', { text: decor.title }),
          el('span', { class: 'os', text: decor.prompt })
        ]);
      })));
      p.appendChild(el('button', { class: 'btn quiet', text: 'Cancel', onclick: closeSheet }));
    });
  }
  function setJournalVoiceStatus(text, active) {
    $('#jeVoiceStatus').textContent = text;
    $('#jeMicBtn').setAttribute('aria-pressed', active ? 'true' : 'false');
  }
  function stopJournalRecognition(showStatus) {
    journalVoiceRequest++;
    var recognition = journalRecognition;
    journalRecognition = null;
    if (recognition) {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try { recognition.stop(); } catch (e) {}
    }
    setJournalVoiceStatus(showStatus ? JOURNAL_UI.localVoiceStopped : '', false);
  }
  function startJournalTranscription() {
    if (journalRecognition) {
      stopJournalRecognition(true);
      return;
    }
    var Recognition = window.SpeechRecognition;
    var language = navigator.language || 'en-US';
    var request = ++journalVoiceRequest;
    if (!Recognition || typeof Recognition.available !== 'function') {
      setJournalVoiceStatus(JOURNAL_UI.localVoiceUnavailable, false);
      return;
    }
    var recognition;
    try { recognition = new Recognition(); } catch (e) {
      setJournalVoiceStatus(JOURNAL_UI.localVoiceUnavailable, false);
      return;
    }
    if (!('processLocally' in recognition)) {
      setJournalVoiceStatus(JOURNAL_UI.localVoiceUnavailable, false);
      return;
    }
    // Store pending recognition too, so a second tap cancels before availability resolves.
    journalRecognition = recognition;
    Recognition.available({ langs: [language], processLocally: true }).then(function (availability) {
      if (request !== journalVoiceRequest || availability !== 'available' || !draft) {
        if (request !== journalVoiceRequest) return;
        journalRecognition = null;
        setJournalVoiceStatus(JOURNAL_UI.localVoiceUnavailable, false);
        return;
      }
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.processLocally = true;
      recognition.onresult = function (event) {
        var words = [];
        for (var i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal && event.results[i][0]) words.push(event.results[i][0].transcript);
        }
        if (words.length) {
          var body = $('#jeBody');
          var prefix = body.value && !/\s$/.test(body.value) ? ' ' : '';
          body.value += prefix + words.join(' ').trim();
        }
      };
      recognition.onerror = function () {
        journalRecognition = null;
        setJournalVoiceStatus(JOURNAL_UI.localVoiceError, false);
      };
      recognition.onend = function () {
        journalRecognition = null;
        setJournalVoiceStatus(JOURNAL_UI.localVoiceStopped, false);
      };
      journalRecognition = recognition;
      setJournalVoiceStatus(JOURNAL_UI.localVoiceReady, true);
      try { recognition.start(); } catch (e) {
        journalRecognition = null;
        setJournalVoiceStatus(JOURNAL_UI.localVoiceError, false);
      }
    }).catch(function () {
      if (request !== journalVoiceRequest) return;
      journalRecognition = null;
      setJournalVoiceStatus(JOURNAL_UI.localVoiceUnavailable, false);
    });
  }
  function deleteDraftEntry() {
    if (!draft) return;
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: 'Delete this entry?' }));
      p.appendChild(el('p', { class: 'p', text: 'It can’t be recovered.' }));
      p.appendChild(el('button', { class: 'btn danger', text: 'Delete', onclick: function () {
        state.journal = state.journal.filter(function (e) { return e.id !== draft.id; });
        save(); closeSheet(); closeEditor(); render();
      } }));
      p.appendChild(el('button', { class: 'btn quiet', text: 'Keep it', onclick: closeSheet }));
    });
  }

  /* ── Constellation ─────────────────────────────────────────────────────── */
  var RING_DEFAULTS = ['Close', 'Present', 'Distant', 'Further', 'Outer', 'Circle', 'Far'];
  function ringDefs() {
    var n = state.rings, out = [];
    var INNER = 52, OUTER = n <= 4 ? 144 : n <= 5 ? 152 : 160; // clears the sun; fits nodes + labels in the 400 box
    for (var i = 0; i < n; i++) {
      var key = 'r' + i;
      out.push({ key: key, label: (state.ringNames[key] || RING_DEFAULTS[i] || ('Ring ' + (i + 1))),
                 r: INNER + i * ((OUTER - INNER) / Math.max(n - 1, 1)) });
    }
    return out;
  }
  function nodeR() { var n = state.rings; return n <= 4 ? 15 : n <= 5 ? 13 : n <= 6 ? 12 : 11; }
  function typeMeta(code) { return RELATIONSHIP_TYPES.filter(function (t) { return t.code === code; })[0] || RELATIONSHIP_TYPES[5]; }
  function setRingCount(n) {
    n = Math.max(3, Math.min(7, n | 0));
    if (n === state.rings) return false;
    var before = state.rings;
    var beforePeople = clone(state.people);
    state.rings = n;
    var keep = {};
    var i;
    for (i = 0; i < n; i++) keep['r' + i] = 1;
    state.people.forEach(function (p) {
      if (!keep[p.ring]) p.ring = 'r' + (n - 1);
    });
    Object.keys(state.ringNames || {}).forEach(function (key) {
      if (!keep[key]) delete state.ringNames[key];
    });
    if (!save()) {
      state.rings = before;
      state.people = beforePeople;
      return false;
    }
    return true;
  }
  function contactScore(p) {
    if (!state.trackContact || !p) return 0;
    var cut = Date.now() - 30 * 86400000;
    var log = Array.isArray(p.spokeAt) ? p.spokeAt : [];
    var n = 0, i;
    for (i = 0; i < log.length; i++) if (log[i] >= cut) n++;
    if (!n && p.lastContact && p.lastContact >= cut) n = 1;
    return n;
  }
  function nodeRadiusFor(p, base, maxScore) {
    if (!state.trackContact || maxScore <= 0) return base;
    var s = contactScore(p) / maxScore;
    return Math.max(9, Math.round(base * (0.85 + s * 0.5)));
  }
  function logSpokeToday(p) {
    var before = clone(p);
    var now = Date.now();
    var cut = now - 90 * 86400000;
    p.lastContact = now;
    p.spokeAt = (Array.isArray(p.spokeAt) ? p.spokeAt : []).filter(function (t) { return t >= cut; });
    p.spokeAt.push(now);
    if (!save()) {
      p.lastContact = before.lastContact;
      p.spokeAt = before.spokeAt;
      return false;
    }
    return true;
  }

  // Rotation is driven in JS so labels can be kept upright. The previous CSS
  // group-spin + counter-spin flung labels off their transform origin — that was
  // the "names flying away, not rotating" bug.
  var mapState = null;
  function stopMap() { if (mapState && mapState.raf) cancelAnimationFrame(mapState.raf); mapState = null; }

  function drawMap() {
    stopMap();
    var svg = $('#map'); if (!svg) return;
    clear(svg);
    var NS = 'http://www.w3.org/2000/svg';
    function s(tag, a) { var n = document.createElementNS(NS, tag); Object.keys(a).forEach(function (k) { n.setAttribute(k, a[k]); }); return n; }
    var rings = ringDefs(), nr = nodeR();
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scores = state.people.map(contactScore);
    var maxScore = 0;
    scores.forEach(function (v) { if (v > maxScore) maxScore = v; });

    rings.forEach(function (ring) {
      var orbit = s('circle', { class: 'orbit', 'data-key': ring.key, cx: 200, cy: 200, r: ring.r });
      svg.appendChild(orbit);
      var lab = s('text', { class: 'orbit-lab', 'data-key': ring.key, x: 200, y: 200 - ring.r + 13, 'text-anchor': 'middle' });
      lab.textContent = ring.label.toUpperCase();
      svg.appendChild(lab);
      attachRingRename(lab, ring.key);
      attachRingRename(orbit, ring.key);
    });

    var edgeGroup = s('g', {}); svg.appendChild(edgeGroup);
    var nodes = [], edges = [];

    state.people.forEach(function (p) {
      var peers = state.people.filter(function (x) { return x.ring === p.ring; });
      var idx = peers.indexOf(p);
      var ring = rings.filter(function (r) { return r.key === p.ring; })[0] || rings[rings.length - 1];
      var ri = rings.indexOf(ring);
      var ang = -Math.PI / 2 + 0.4 + ri * 0.85 + (idx / Math.max(peers.length, 1)) * Math.PI * 2;
      var pr = nodeRadiusFor(p, nr, maxScore);
      var node = s('g', { class: 'node' + (p.hard ? ' hard' : ''), tabindex: '0', role: 'button',
        'aria-label': p.name + ', ' + typeMeta(p.type).label + (p.hard ? ', hard right now' : '') +
          (state.trackContact && maxScore ? ', spoke lately ' + contactScore(p) + ' times' : '') });
      var c = s('circle', { r: pr, fill: 'var(' + typeMeta(p.type).cssVar + ')',
        stroke: p.hard ? 'var(--ink-3)' : 'var(--surface)', 'stroke-width': p.hard ? 1.5 : 2 });
      if (p.hard) c.setAttribute('stroke-dasharray', '3 3');
      var t = s('text', { class: 'node-lab' }); t.textContent = p.name;
      node.appendChild(c); node.appendChild(t);
      var rec = { p: p, el: node, circle: c, label: t, ang: ang, r: ring.r, nr: pr, x: 200, y: 200 };
      nodes.push(rec);
      node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); personSheet(p.id); } });
      svg.appendChild(node);
    });

    if (state.showLinks) {
      state.links.forEach(function (lk) {
        var a = nodes.filter(function (n) { return n.p.id === lk.a; })[0], b = nodes.filter(function (n) { return n.p.id === lk.b; })[0];
        if (!a || !b) return;
        var line = s('line', { class: 'edge' }); edgeGroup.appendChild(line);
        edges.push({ a: a, b: b, line: line });
      });
    }

    // Sun on top so it never sits behind a passing node.
    svg.appendChild(s('circle', { class: 'sun', cx: 200, cy: 200, r: 31, fill: 'var(--accent)' }));
    var you = s('text', { class: 'sun-lab', x: 200, y: 205 }); you.textContent = 'You'; svg.appendChild(you);

    mapState = { svg: svg, nodes: nodes, edges: edges, raf: null, last: 0, dragging: false, reduced: reduced, nr: nr };
    nodes.forEach(function (rec) { attachNodeDrag(rec); });
    attachMapPinch(svg);
    positionAll();
    mapState.raf = requestAnimationFrame(frame);
  }

  function positionAll() {
    if (!mapState) return;
    mapState.nodes.forEach(function (n) {
      var nr = n.nr || mapState.nr;
      n.x = 200 + n.r * Math.cos(n.ang); n.y = 200 + n.r * Math.sin(n.ang);
      n.circle.setAttribute('cx', n.x); n.circle.setAttribute('cy', n.y);
      n.label.setAttribute('x', n.x);
      n.label.setAttribute('y', n.y + (n.y >= 200 ? nr + 15 : -(nr + 7)));
    });
    mapState.edges.forEach(function (e) {
      e.line.setAttribute('x1', e.a.x); e.line.setAttribute('y1', e.a.y);
      e.line.setAttribute('x2', e.b.x); e.line.setAttribute('y2', e.b.y);
    });
  }
  function frame(ts) {
    if (!mapState) return;
    if (!mapState.last) mapState.last = ts;
    var dt = (ts - mapState.last) / 1000; mapState.last = ts;
    if (!mapState.dragging && !mapState.reduced) {
      var d = dt * (2 * Math.PI / 150); // one revolution every 2.5 minutes
      mapState.nodes.forEach(function (n) { n.ang += d; });
    }
    positionAll();
    mapState.raf = requestAnimationFrame(frame);
  }

  function attachRingRename(elNode, key) {
    var timer = null, start = null;
    function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
    elNode.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY };
      clearTimer();
      timer = setTimeout(function () {
        timer = null; start = null; buzz(10); renameOneRing(key);
      }, 550);
    });
    elNode.addEventListener('pointermove', function (e) {
      if (!start) return;
      if (Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 8) { clearTimer(); start = null; }
    });
    elNode.addEventListener('pointerup', clearTimer);
    elNode.addEventListener('pointercancel', clearTimer);
  }
  function renameOneRing(key) {
    var rings = ringDefs();
    var ring = rings.filter(function (r) { return r.key === key; })[0];
    if (!ring) return;
    var idx = rings.indexOf(ring);
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: 'Rename ring' }));
      p.appendChild(el('p', { class: 'p-sm', text: 'Long-press any ring label to rename it. Leave blank for the default.' }));
      var inp = el('input', { type: 'text', maxlength: '20', placeholder: RING_DEFAULTS[idx] || ('Ring ' + (idx + 1)),
        'aria-label': 'Ring name', value: state.ringNames[key] || '' });
      p.appendChild(inp);
      p.appendChild(el('button', { class: 'btn', text: 'Save', onclick: function () {
        var val = inp.value.trim().slice(0, 20);
        if (val) state.ringNames[key] = val; else delete state.ringNames[key];
        save(); closeSheet(); render();
      } }));
      p.appendChild(el('button', { class: 'btn quiet', text: 'Cancel', onclick: closeSheet }));
      setTimeout(function () { inp.focus(); inp.select(); }, 40);
    });
  }
  function attachMapPinch(svg) {
    var pts = {}, startDist = 0, changed = false;
    function list() {
      return Object.keys(pts).map(function (id) { return pts[id]; });
    }
    function distance() {
      var a = list();
      if (a.length < 2) return 0;
      return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
    }
    svg.addEventListener('pointerdown', function (e) {
      var t = e.target, onNode = false;
      while (t && t !== svg) {
        if (t.getAttribute && ((t.getAttribute('class') || '').indexOf('node') !== -1)) { onNode = true; break; }
        t = t.parentNode;
      }
      if (onNode) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (list().length === 2) { startDist = distance(); changed = false; mapState.dragging = true; }
    });
    svg.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (list().length < 2 || !startDist || changed) return;
      var d = distance();
      if (d > startDist * 1.18) {
        changed = true;
        if (setRingCount(state.rings + 1)) { buzz(12); render(); }
      } else if (d < startDist * 0.82) {
        changed = true;
        if (setRingCount(state.rings - 1)) { buzz(12); render(); }
      }
    });
    function end(e) {
      delete pts[e.pointerId];
      if (list().length < 2) { startDist = 0; changed = false; if (mapState) mapState.dragging = false; }
    }
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
  }

  function attachNodeDrag(rec) {
    var svg = mapState.svg, node = rec.el, p = rec.p, drag = null;
    function toVB(cx, cy) { var r = svg.getBoundingClientRect(); return { x: (cx - r.left) / r.width * 400, y: (cy - r.top) / r.height * 400 }; }
    function nearest(vx, vy) { var d = Math.hypot(vx - 200, vy - 200), rings = ringDefs(), best = rings[0], bd = Infinity; rings.forEach(function (r) { var dd = Math.abs(r.r - d); if (dd < bd) { bd = dd; best = r; } }); return best; }
    function highlight(key) { Array.prototype.forEach.call(svg.querySelectorAll('.orbit'), function (o) { o.classList.toggle('drop', o.getAttribute('data-key') === key); }); }
    node.addEventListener('pointerdown', function (e) {
      e.preventDefault(); drag = { moved: false, x: e.clientX, y: e.clientY };
      node.classList.add('dragging'); mapState.dragging = true;
      try { node.setPointerCapture(e.pointerId); } catch (_) {}
    });
    node.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 5) drag.moved = true;
      var v = toVB(e.clientX, e.clientY);
      // Steer the node's polar position toward the finger; positionAll paints it.
      rec.r = Math.max(30, Math.min(180, Math.hypot(v.x - 200, v.y - 200)));
      rec.ang = Math.atan2(v.y - 200, v.x - 200);
      positionAll(); highlight(nearest(v.x, v.y).key);
    });
    function end(e) {
      if (!drag) return; var wasDrag = drag.moved;
      node.classList.remove('dragging'); mapState.dragging = false; highlight(null);
      if (wasDrag) {
        var v = toVB(e.clientX, e.clientY), ring = nearest(v.x, v.y);
        p.ring = ring.key; rec.r = ring.r; save(); buzz(12); positionAll();
      } else personSheet(p.id);
      drag = null;
    }
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', function () { if (drag) { node.classList.remove('dragging'); mapState.dragging = false; highlight(null); drag = null; } });
  }
  function suggestPerson() {
    var pool = state.people.filter(function (p) { return !p.hard && p.suggestible !== false && p.supportive >= 0.5 && p.drain <= 0.6; });
    if (!pool.length) return null;
    pool.sort(function (a, b) {
      var rank = function (x) { var ri = ringDefs().findIndex(function (r) { return r.key === x.ring; }); return x.supportive - x.drain + (ri === 0 ? 0.5 : ri === 1 ? 0.2 : 0); };
      return rank(b) - rank(a);
    });
    return pool[0];
  }
  function personSheet(id) {
    var p = state.people.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    openSheet(function (panel) {
      panel.appendChild(el('h2', { class: 'h-sec', text: p.name }));
      panel.appendChild(el('p', { class: 'eyebrow', text: typeMeta(p.type).label }));
      [['Feels supportive', 'supportive'], ['Costs me energy', 'drain']].forEach(function (pair) {
        panel.appendChild(el('div', {}, [el('div', { class: 'meta', text: pair[0] }), el('div', { class: 'bar' }, [el('i', { style: 'width:' + Math.round(p[pair[1]] * 100) + '%' })])]));
      });
      panel.appendChild(el('p', { class: 'eyebrow', style: 'margin-top:8px', text: 'How close' }));
      panel.appendChild(el('div', { class: 'chips' }, ringDefs().map(function (r) {
        return el('button', { class: 'chip', 'aria-pressed': p.ring === r.key ? 'true' : 'false', text: r.label.charAt(0) + r.label.slice(1).toLowerCase(),
          onclick: function () { p.ring = r.key; save(); closeSheet(); render(); } });
      })));
      if (state.trackContact) {
        panel.appendChild(el('hr', { class: 'sep' }));
        panel.appendChild(el('p', { class: 'meta', text: p.lastContact ? 'Last spoke: ' + Math.round((Date.now() - p.lastContact) / 86400000) + ' days ago' : 'No contact logged' }));
        panel.appendChild(el('button', { class: 'btn ghost', text: 'We spoke today', onclick: function () {
          if (!logSpokeToday(p)) return;
          closeSheet(); render();
        } }));
        panel.appendChild(el('p', { class: 'p-sm', text: 'Logged speaks shape node size on the map. Size means frequency you logged — never importance.' }));
      }
      panel.appendChild(el('hr', { class: 'sep' }));
      panel.appendChild(el('button', { class: 'btn ' + (p.hard ? '' : 'ghost'), text: p.hard ? 'This is hard right now — on' : 'Mark “hard right now”',
        onclick: function () { p.hard = !p.hard; save(); closeSheet(); render(); } }));
      panel.appendChild(el('p', { class: 'p-sm', text: p.hard ? 'While this is on, SoulCap will never suggest contacting them, and won’t mention how long it’s been.' : 'Turn this on and they’re excluded from every suggestion. No nudges to reconcile, ever.' }));
      panel.appendChild(el('button', { class: 'btn danger', text: 'Remove from Constellation', onclick: function () {
        state.people = state.people.filter(function (x) { return x.id !== id; });
        state.links = state.links.filter(function (l) { return l.a !== id && l.b !== id; });
        save(); closeSheet(); render();
      } }));
      panel.appendChild(el('button', { class: 'btn quiet', text: 'Close', onclick: closeSheet }));
    });
  }
  function addPersonSheet() {
    openSheet(function (panel) {
      panel.appendChild(el('h2', { class: 'h-sec', text: 'Add someone' }));
      panel.appendChild(el('p', { class: 'p-sm', text: 'A first name or nickname is plenty. This never leaves your device.' }));
      var name = el('input', { type: 'text', placeholder: 'Name or nickname', 'aria-label': 'Name' }); panel.appendChild(name);
      var typeSel = el('select', { 'aria-label': 'Relationship' }, RELATIONSHIP_TYPES.map(function (t) { return el('option', { value: t.code, text: t.label }); })); panel.appendChild(typeSel);
      var ringSel = el('select', { 'aria-label': 'How close' }, ringDefs().map(function (r) { return el('option', { value: r.key, text: r.label.charAt(0) + r.label.slice(1).toLowerCase() }); })); panel.appendChild(ringSel);
      panel.appendChild(el('div', { class: 'meta', text: 'When things are hard, do they help?' }));
      var sup = el('select', { 'aria-label': 'Supportive' }, [el('option', { value: '0.85', text: 'Usually helps' }), el('option', { value: '0.5', text: 'Sometimes helps' }), el('option', { value: '0.2', text: 'Not really' })]); panel.appendChild(sup);
      panel.appendChild(el('button', { class: 'btn', text: 'Add', onclick: function () {
        var n = name.value.trim(); if (!n) { name.focus(); return; }
        state.people.push({ id: uid(), name: n.slice(0, 24), type: typeSel.value, ring: ringSel.value, supportive: parseFloat(sup.value), drain: 1 - parseFloat(sup.value), hard: false, suggestible: true, lastContact: null, spokeAt: [] });
        save(); closeSheet(); render();
      } }));
      panel.appendChild(el('button', { class: 'btn quiet', text: 'Cancel', onclick: closeSheet }));
    });
  }
  function renderMap() {
    var v = $('#view-map'); clear(v);
    v.appendChild(el('div', {}, [el('p', { class: 'eyebrow', text: 'Constellation' }), el('h1', { class: 'h-voice', text: 'The people around you.' })]));
    if (!state.people.length) {
      v.appendChild(el('div', { class: 'card' }, [
        el('p', { class: 'p-voice', text: 'You at the centre. The people in your life placed by how close they actually feel — not how close they’re supposed to feel.' }),
        el('p', { class: 'p-sm', text: 'Nobody else ever sees this. It stays on your device.' }),
        el('button', { class: 'btn', text: 'Add the first person', onclick: addPersonSheet })
      ]));
    } else {
      var wrap = el('div', { class: 'map-wrap' });
      wrap.appendChild(el('div', { html: '<svg id="map" viewBox="0 0 400 400" role="img" aria-label="Your constellation"></svg>' }));
      var legend = el('div', { class: 'legend' });
      RELATIONSHIP_TYPES.forEach(function (t) { if (state.people.some(function (p) { return p.type === t.code; })) legend.appendChild(el('span', { html: '<i style="background:var(' + t.cssVar + ')"></i>' + t.label })); });
      if (state.people.some(function (p) { return p.hard; })) legend.appendChild(el('span', { html: '<i style="border:1.5px dashed var(--ink-3)"></i>Hard right now' }));
      wrap.appendChild(legend); v.appendChild(wrap);
      v.appendChild(el('button', { class: 'btn ghost', text: 'Add someone', onclick: addPersonSheet }));
      v.appendChild(el('div', {}, [el('p', { class: 'eyebrow', text: 'Rings' }), el('div', { class: 'chips' }, [3, 4, 5, 6, 7].map(function (n) {
        return el('button', { class: 'chip', 'aria-pressed': state.rings === n ? 'true' : 'false', text: '' + n, onclick: function () {
          if (!setRingCount(n)) return;
          buzz(8); render();
        } });
      }))]));
      v.appendChild(el('button', { class: 'btn ghost', text: 'Name the rings', onclick: ringNameSheet }));
      v.appendChild(el('p', { class: 'p-sm', text: 'Pinch the map to add or remove a ring (3–7). Long-press a ring label to rename. Drag anyone in or out. Tap a person to open them.' }));
      if (state.trackContact) {
        v.appendChild(el('p', { class: 'p-sm', text: 'Larger dots reflect how often you’ve logged speaking lately — not how important anyone is.' }));
      }
    }
    v.appendChild(el('button', { class: 'help-btn', text: t('helpNow'), onclick: openPanic }));
  }
  function ringNameSheet() {
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: 'Name your rings' }));
      p.appendChild(el('p', { class: 'p-sm', text: 'Call them whatever fits — closeness, or your own idea. Leave blank for the default.' }));
      ringDefs().forEach(function (r, i) {
        var inp = el('input', { type: 'text', placeholder: RING_DEFAULTS[i] || ('Ring ' + (i + 1)), 'aria-label': 'Ring ' + (i + 1), value: state.ringNames[r.key] || '' });
        inp.addEventListener('change', function () { var val = inp.value.trim().slice(0, 20); if (val) state.ringNames[r.key] = val; else delete state.ringNames[r.key]; save(); });
        p.appendChild(el('div', {}, [el('p', { class: 'eyebrow', style: 'margin-top:8px', text: 'Ring ' + (i + 1) + ' (from centre)' }), inp]));
      });
      p.appendChild(el('button', { class: 'btn', text: 'Done', onclick: function () { save(); closeSheet(); render(); } }));
    });
  }

  /* ── History taking (optional, never in onboarding) ────────────────────── */
  function historyFilled() { return HISTORY_SECTIONS.filter(function (s) { return (state.history[s.key] || '').trim().length > 0; }).length; }
  function historySheet() {
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: 'Your story' }));
      p.appendChild(el('p', { class: 'p-sm', text: 'All optional. The more you tell SoulCap, the more it can shape itself around you. Nothing here leaves your device, and none of it is ever shown as a diagnosis.' }));
      HISTORY_SECTIONS.forEach(function (sec) {
        p.appendChild(el('p', { class: 'eyebrow', style: 'margin-top:12px', text: sec.title + (sec.sensitive ? ' · sensitive' : '') }));
        p.appendChild(el('p', { class: 'p-sm', style: 'margin-bottom:8px', text: sec.hint }));
        if (sec.kind === 'choice') {
          var wrap = el('div', { class: 'chips' }, sec.options.map(function (o) {
            return el('button', { class: 'chip', 'aria-pressed': state.history[sec.key] === o ? 'true' : 'false', text: o,
              onclick: function () { state.history[sec.key] = state.history[sec.key] === o ? '' : o; save(); Array.prototype.forEach.call(wrap.children, function (b) { b.setAttribute('aria-pressed', b.textContent === state.history[sec.key] ? 'true' : 'false'); }); } });
          }));
          p.appendChild(wrap);
        } else {
          // Roomy field — write as much as you like, add as many things as you want.
          var ta = el('textarea', { placeholder: sec.placeholder, 'aria-label': sec.title, style: 'min-height:130px' });
          ta.value = state.history[sec.key] || '';
          var grow = function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight + 4, 460) + 'px'; };
          ta.addEventListener('input', grow);
          ta.addEventListener('change', function () { state.history[sec.key] = ta.value; save(); });
          p.appendChild(ta);
          if (['family', 'relatives', 'hobbies', 'habits'].indexOf(sec.key) !== -1)
            p.appendChild(el('p', { class: 'p-sm', text: 'Add as many as you like — one per line.' }));
          setTimeout(grow, 0);
        }
      });
      p.appendChild(el('div', { class: 'notice', html: '<b>How this changes things.</b> If you note that things are hard from your past, SoulCap keeps potentially-activating exercises out of its suggestions and leans toward gentle grounding. It never labels or diagnoses you.' }));
      p.appendChild(el('button', { class: 'btn', text: 'Done', onclick: function () { save(); closeSheet(); render(); } }));
    });
  }

  /* ── Now ───────────────────────────────────────────────────────────────── */
  function greeting() {
    var h = new Date().getHours(), name = (state.profile.name || '').trim();
    var g = h < 5 ? 'It’s late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    return name ? g + ', ' + name + '.' : g + '.';
  }
  function renderNow() {
    var v = $('#view-now'); clear(v);
    v.appendChild(el('div', {}, [
      el('p', { class: 'eyebrow', text: new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) }),
      el('h1', { class: 'h-voice', text: greeting() })
    ]));
    var states = ['Steady', 'Wired', 'Flat', 'Heavy', 'Not sure'];
    var rc = todayCheckin(), today = rc ? rc.state : null;
    v.appendChild(el('div', {}, [
      el('p', { class: 'p-voice', text: 'How are you arriving right now?' }),
      el('div', { style: 'height:11px' }),
      el('div', { class: 'chips' }, states.map(function (s) {
        return el('button', { class: 'chip', 'aria-pressed': today === s ? 'true' : 'false', text: s,
          onclick: function () {
            if (!recordCheckin(s)) { showCheckinSaveFailed(); return; }
            buzz(10); render();
          } });
      }))
    ]));
    if (rc) {
      var hasDetail = Object.keys(rc.dims || {}).length || (rc.triggers || []).length || rc.need || rc.feeling;
      v.appendChild(el('button', { class: 'btn ghost', text: hasDetail ? CHECKIN_UI.editDetail : CHECKIN_UI.addDetail, onclick: checkinDetailSheet }));
    }
    var dripQ = nextDripQuestion();
    v.appendChild(el('button', { class: 'card tap', onclick: dripSheet }, [
      el('h2', { class: 'card-title', text: DRIP_UI.cardTitle }),
      el('p', { class: 'p-sm', text: dripQ ? DRIP_UI.cardHint : DRIP_UI.doneToday })
    ]));
    var pick = suggestSkill(), dm = DOMAIN_META[pick.skill.domain];
    v.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('h2', { class: 'card-title', text: pick.skill.name }), el('span', { class: 'domain', style: 'color:var(' + dm.cssVar + ')', text: dm.label })]),
      el('p', { class: 'meta', text: pick.skill.mins + ' min · works offline' }),
      el('p', { class: 'reason', text: reasonText(pick) }),
      el('button', { class: 'btn', text: 'Begin', onclick: function () { startSkill(pick.skill.id); } }),
      el('button', { class: 'btn quiet', text: 'Something else', onclick: function () { calm.browse = false; selectTab('calm'); } })
    ]));
    var person = suggestPerson();
    if (person) {
      v.appendChild(el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('h2', { class: 'card-title', text: 'Message ' + person.name + '?' }), el('span', { class: 'domain', style: 'color:var(--connect)', text: 'Connect' })]),
        el('p', { class: 'reason', text: 'You said ' + person.name + ' usually helps when things are hard.' }),
        el('p', { class: 'p-sm', text: 'SoulCap never sends anything. This just opens your own messages.' }),
        el('a', { class: 'btn ghost', href: 'sms:', style: 'text-decoration:none', text: 'Open messages' })
      ]));
    }
    var recent = state.checkins.slice(-7);
    if (recent.length > 1) {
      var order = { Steady: 8, 'Not sure': 18, Flat: 26, Wired: 31, Heavy: 37 };
      var pts = recent.map(function (c, i) { return (6 + i * (268 / Math.max(recent.length - 1, 1))).toFixed(0) + ',' + (order[c.state] || 20); }).join(' ');
      v.appendChild(el('div', {}, [
        el('p', { class: 'eyebrow', text: 'Recent days · ' + recent.length }),
        el('div', { class: 'spark', html: '<svg viewBox="0 0 280 46" preserveAspectRatio="none" width="100%" height="46" aria-hidden="true"><polyline points="' + pts + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/></svg>' })
      ]));
    }
    v.appendChild(el('button', { class: 'help-btn', text: t('helpNow'), onclick: openPanic }));
  }

  /* ── Safety plan ───────────────────────────────────────────────────────── */
  function safetyPlanSheet() {
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: 'My plan' }));
      p.appendChild(el('p', { class: 'p-sm', text: 'Written now, while you have room to think. It’ll be here when you don’t.' }));
      SAFETY_PLAN_STEPS.forEach(function (step) {
        var ta = el('textarea', { placeholder: step.placeholder, 'aria-label': step.title }); ta.value = state.safetyPlan[step.key] || '';
        ta.addEventListener('change', function () { state.safetyPlan[step.key] = ta.value; save(); });
        p.appendChild(el('div', {}, [el('p', { class: 'eyebrow', style: 'margin-top:10px', text: step.title }), el('p', { class: 'p-sm', style: 'margin-bottom:8px', text: step.hint }), ta]));
        if (step.key === 'contacts') {
          var pool = state.people.filter(function (person) {
            return !person.hard && person.supportive >= 0.5 && person.suggestible !== false;
          });
          if (pool.length) {
            p.appendChild(el('p', { class: 'p-sm', text: 'From your Constellation — tap to add. You can still type anyone else.' }));
            p.appendChild(el('div', { class: 'chips', role: 'group', 'aria-label': 'People from Constellation' }, pool.map(function (person) {
              return el('button', { class: 'chip', text: person.name, onclick: function () {
                var cur = (state.safetyPlan.contacts || '').trim();
                if (cur.split(/,\s*/).indexOf(person.name) !== -1) return;
                state.safetyPlan.contacts = cur ? (cur + ', ' + person.name) : person.name;
                ta.value = state.safetyPlan.contacts;
                save(); buzz(8);
              } });
            })));
          }
        }
      });
      p.appendChild(el('button', { class: 'btn', text: 'Done', onclick: function () { save(); closeSheet(); render(); } }));
    });
  }
  function planFilled() { return SAFETY_PLAN_STEPS.filter(function (s) { return (state.safetyPlan[s.key] || '').trim().length > 0; }).length; }

  /* ── Profile ───────────────────────────────────────────────────────────── */
  function profileSheet() {
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: 'About you' }));
      p.appendChild(el('p', { class: 'p-sm', text: 'Only used to make this feel like yours. Stays on your device.' }));
      var name = el('input', { type: 'text', placeholder: 'What should we call you?', 'aria-label': 'Name', value: state.profile.name });
      var age = el('input', { type: 'text', inputmode: 'numeric', placeholder: 'Age (optional)', 'aria-label': 'Age', value: state.profile.age });
      var pron = el('input', { type: 'text', placeholder: 'Pronouns (optional)', 'aria-label': 'Pronouns', value: state.profile.pronouns });
      p.appendChild(el('p', { class: 'eyebrow', text: 'Name' })); p.appendChild(name);
      p.appendChild(el('p', { class: 'eyebrow', text: 'Age' })); p.appendChild(age);
      p.appendChild(el('p', { class: 'eyebrow', text: 'Pronouns' })); p.appendChild(pron);
      p.appendChild(el('button', { class: 'btn', text: 'Save', onclick: function () {
        state.profile.name = name.value.trim().slice(0, 40);
        state.profile.age = age.value.replace(/\D/g, '').slice(0, 3);
        state.profile.pronouns = pron.value.trim().slice(0, 24);
        save(); closeSheet(); render();
      } }));
      p.appendChild(el('button', { class: 'btn quiet', text: 'Cancel', onclick: closeSheet }));
    });
  }

  /* ── You ───────────────────────────────────────────────────────────────── */
  function renderMe() {
    var v = $('#view-me'); clear(v);
    var name = (state.profile.name || '').trim();
    v.appendChild(el('div', {}, [el('p', { class: 'eyebrow', text: 'You' }), el('h1', { class: 'h-voice', text: name || 'Your space.' })]));

    // Profile card
    v.appendChild(el('button', { class: 'card tap', onclick: profileSheet }, [
      el('div', { class: 'card-head' }, [el('h2', { class: 'card-title', text: name ? 'Profile' : 'Set up your profile' }), el('span', { class: 'pill', text: name ? 'Edit' : 'Add' })]),
      el('p', { class: 'p-sm', text: name
        ? [name, state.profile.age && state.profile.age + ' years', state.profile.pronouns].filter(Boolean).join(' · ')
        : 'Add your name so this feels like yours. Age and pronouns optional.' })
    ]));

    // History / your story
    var hf = historyFilled();
    v.appendChild(el('button', { class: 'card tap', onclick: historySheet }, [
      el('div', { class: 'card-head' }, [el('h2', { class: 'card-title', text: 'Your story' }), el('span', { class: 'pill', text: hf ? hf + ' / ' + HISTORY_SECTIONS.length : 'Optional' })]),
      el('p', { class: 'p-sm', text: hf
        ? 'Family, relationships, habits, hobbies, and the harder things — SoulCap adapts to what you’ve shared.'
        : 'Tell SoulCap about your life — family, relationships, habits, hobbies, anything from your past. All optional. The more it knows, the more it fits you.' })
    ]));

    // Safety plan
    var filled = planFilled();
    v.appendChild(el('button', { class: 'card tap', onclick: safetyPlanSheet }, [
      el('div', { class: 'card-head' }, [el('h2', { class: 'card-title', text: 'My plan' }), el('span', { class: 'pill', text: filled + '/' + SAFETY_PLAN_STEPS.length })]),
      el('p', { class: 'p-sm', text: filled ? 'Your warning signs, what helps, and who to tell. Tap to update.' : 'Write it while you’re steady, so it’s ready when you’re not.' })
    ]));

    // Journey
    var runs = state.skillRuns.length, helped = state.skillRuns.filter(function (r) { return r.helpful; }).length;
    if (runs || state.checkins.length) {
      var top = {}; state.skillRuns.forEach(function (r) { if (r.helpful) top[r.id] = (top[r.id] || 0) + 1; });
      var best = Object.keys(top).sort(function (a, b) { return top[b] - top[a]; })[0];
      var bestSkill = best ? SKILLS.filter(function (s) { return s.id === best; })[0] : null;
      v.appendChild(el('div', { class: 'card' }, [
        el('h2', { class: 'card-title', text: 'Your journey' }),
        el('p', { class: 'p', text: runs + ' exercise' + (runs === 1 ? '' : 's') + ' · ' + helped + ' helped · ' + state.checkins.length + ' day' + (state.checkins.length === 1 ? '' : 's') + ' checked in · ' + state.journal.length + ' journal' }),
        bestSkill ? el('p', { class: 'reason', text: bestSkill.name + ' seems to work best for you.' }) : null,
        el('p', { class: 'p-sm', text: 'No score, no rating. Just what’s happened.' })
      ]));
    }
    var week = weeklySummary();
    if (week) {
      v.appendChild(el('div', { class: 'card' }, [
        el('h2', { class: 'card-title', text: PATTERN_UI.weeklyTitle }),
        el('p', { class: 'p', text: week.days + ' ' + PATTERN_UI.weeklySummary + ' · ' + week.common + ' ' + PATTERN_UI.weeklyCommon + '.' }),
        week.detail.length ? el('p', { class: 'p-sm', text: week.detail.join(' · ') }) : null,
        el('p', { class: 'reason', text: PATTERN_UI.weeklyNote })
      ]));
    }

    // Trust tiers
    var rows = el('div', {}); var any = false;
    USER_MODEL_KEYS.forEach(function (meta) {
      var item = state.userModel[meta.key];
      if (!item || typeof item.value !== 'number') return;
      any = true;
      rows.appendChild(el('div', { class: 'row pattern-row' }, [
        el('div', {}, [
          el('div', { class: 'lab', text: meta.label + ' · ' + item.value.toFixed(1) + '/5' }),
          el('div', { class: 'sub', text: confidenceLabel(item.confidence) + ' ' + DRIP_UI.confidence + ' · ' + DRIP_UI.notDiagnosis }),
          el('div', { class: 'chips pattern-actions' }, [
            el('button', { class: 'chip', text: DRIP_UI.correct, onclick: function () { estimateSheet(meta.key); } })
          ])
        ]),
        el('span', { class: 'tier declared', text: item.source === 'corrected' ? 'Corrected' : 'You said' })
      ]));
    });
    state.concerns.forEach(function (c) { any = true; rows.appendChild(el('div', { class: 'row' }, [el('div', {}, [el('div', { class: 'lab', text: c }), el('div', { class: 'sub', text: 'You picked this when you started' })]), el('span', { class: 'tier declared', text: 'You said' })])); });
    var helpful = {}; state.skillRuns.forEach(function (r) { if (r.helpful === true) helpful[r.id] = (helpful[r.id] || 0) + 1; });
    Object.keys(helpful).forEach(function (id) { var s = SKILLS.filter(function (x) { return x.id === id; })[0]; if (!s) return; any = true; rows.appendChild(el('div', { class: 'row' }, [el('div', {}, [el('div', { class: 'lab', text: s.name + ' seems to help' }), el('div', { class: 'sub', text: 'You said it helped ' + helpful[id] + ' time' + (helpful[id] > 1 ? 's' : '') })]), el('span', { class: 'tier observed', text: 'Observed' })])); });
    derivePatterns().forEach(function (pattern) {
      any = true;
      var decision = state.patternPrefs.decisions[pattern.id];
      var actions = [
        el('button', { class: 'chip', text: PATTERN_UI.evidence, onclick: function () { patternSheet(pattern); } })
      ];
      if (decision !== 'confirmed') {
        actions.push(el('button', { class: 'chip', text: PATTERN_UI.confirm, onclick: function () { setPatternDecision(pattern.id, 'confirmed'); } }));
        actions.push(el('button', { class: 'chip', text: PATTERN_UI.reject, onclick: function () { setPatternDecision(pattern.id, 'rejected'); } }));
      }
      actions.push(el('button', { class: 'chip', text: PATTERN_UI.hide, onclick: function () { setPatternDecision(pattern.id, 'hidden'); } }));
      rows.appendChild(el('div', { class: 'row pattern-row' }, [
        el('div', {}, [
          el('div', { class: 'lab', text: pattern.title }),
          el('div', { class: 'sub', text: pattern.summary + ' Based on ' + pattern.count + ' ' + PATTERN_UI.dayBasis + '.' }),
          el('div', { class: 'chips pattern-actions' }, actions)
        ]),
        el('span', { class: decision === 'confirmed' ? 'tier declared' : 'tier guess', text: decision === 'confirmed' ? PATTERN_UI.confirmed : PATTERN_UI.guess })
      ]));
    });
    if (any) { v.appendChild(el('p', { class: 'eyebrow', style: 'margin-top:6px', text: 'What SoulCap knows' })); v.appendChild(rows); }

    // Settings — grouped
    v.appendChild(el('hr', { class: 'sep' }));
    settingsGroup(v, 'Appearance', [
      settingChips(THEME_OPTIONS,
        function (o) { return state.theme === o.k; }, function (o) { setTheme(o.k); }),
      el('p', { class: 'p-sm', text: 'Night is dimmer than dark. AMOLED is near-black. Mood themes keep contrast and reduced-motion intact.' }),
      el('p', { class: 'eyebrow', style: 'margin-top:8px', text: LOCALE_UI.language }),
      settingChips(LOCALE_OPTIONS,
        function (o) { return state.locale === o.k; }, function (o) { setLocale(o.k); }),
      el('p', { class: 'p-sm', text: state.locale === 'ur' ? LOCALE_UI.reviewPending : LOCALE_UI.previewNote }),
      el('p', { class: 'eyebrow', style: 'margin-top:8px', text: PRESENTATION_UI.accent }),
      settingChips(ACCENT_OPTIONS,
        function (o) { return state.appearance.accent === o.k; }, function (o) { setAppearance('accent', o.k); }),
      el('p', { class: 'eyebrow', style: 'margin-top:8px', text: PRESENTATION_UI.text }),
      settingChips(TEXT_OPTIONS,
        function (o) { return state.appearance.text === o.k; }, function (o) { setAppearance('text', o.k); }),
      el('p', { class: 'eyebrow', style: 'margin-top:8px', text: PRESENTATION_UI.density }),
      settingChips(DENSITY_OPTIONS,
        function (o) { return state.appearance.density === o.k; }, function (o) { setAppearance('density', o.k); }),
      el('div', { class: 'stack' }, [
        toggleBtn(PRESENTATION_UI.contrast, state.appearance.contrast === 'high', function () { setAppearance('contrast', state.appearance.contrast === 'high' ? 'standard' : 'high'); }),
        toggleBtn(PRESENTATION_UI.transparency, state.appearance.reduceTransparency, function () { setAppearance('reduceTransparency', !state.appearance.reduceTransparency); })
      ])
    ]);
    settingsGroup(v, 'Personalisation', [
      toggleBtn(PRESENTATION_UI.patternLearning, state.patternPrefs.enabled, function () {
        var before = state.patternPrefs.enabled;
        state.patternPrefs.enabled = !state.patternPrefs.enabled;
        if (!save()) { state.patternPrefs.enabled = before; showPreferenceSaveFailed(); return; }
        reRender();
      }),
      el('p', { class: 'p-sm', text: state.patternPrefs.enabled ? PRESENTATION_UI.patternHint : PATTERN_UI.disabled }),
      Object.keys(state.patternPrefs.decisions).length ? el('button', { class: 'btn ghost', text: PATTERN_UI.reset, onclick: function () {
        var before = clone(state.patternPrefs.decisions);
        state.patternPrefs.decisions = {};
        if (!save()) { state.patternPrefs.decisions = before; showPreferenceSaveFailed(); return; }
        reRender();
      } }) : null
    ]);
    settingsGroup(v, 'Guided exercises', [
      el('div', { class: 'stack' }, [
        toggleBtn('Spoken guidance', state.voice.on, function () {
          var before = state.voice.on; state.voice.on = !state.voice.on;
          if (!save()) { state.voice.on = before; showPreferenceSaveFailed(); return; }
          reRender();
        }),
        state.voice.on ? el('button', { class: 'btn ghost', text: 'Voice & accent', onclick: voiceSheet }) : null,
        toggleBtn('Vibration', state.haptics, function () {
          var before = state.haptics; state.haptics = !state.haptics;
          if (!save()) { state.haptics = before; showPreferenceSaveFailed(); return; }
          buzz(14); reRender();
        })
      ]),
      el('p', { class: 'eyebrow', style: 'margin-top:12px', text: 'Exercise pace' }),
      settingChips([{ v: 1.35, l: 'Slow' }, { v: 1, l: 'Steady' }, { v: 0.8, l: 'Brisk' }],
        function (o) { return (state.pace || 1) === o.v; }, function (o) {
          var before = state.pace; state.pace = o.v;
          if (!save()) { state.pace = before; showPreferenceSaveFailed(); return; }
          reRender();
        }),
      el('p', { class: 'p-sm', text: 'How long each step of a guided exercise stays on screen. Slow gives more time to read.' })
    ]);
    settingsGroup(v, 'Constellation extras', [
      el('div', { class: 'stack' }, [
        toggleBtn('Show links between people', state.showLinks, function () {
          var before = state.showLinks; state.showLinks = !state.showLinks;
          if (!save()) { state.showLinks = before; showPreferenceSaveFailed(); return; }
          reRender();
        }),
        toggleBtn('Track when we last spoke', state.trackContact, function () {
          var before = state.trackContact; state.trackContact = !state.trackContact;
          if (!save()) { state.trackContact = before; showPreferenceSaveFailed(); return; }
          reRender();
        })
      ]),
      el('p', { class: 'p-sm', text: 'Both off by default. Contact tracking only ever shows you the number — it will never tell you to reach out to anyone.' })
    ]);
    settingsGroup(v, 'Your data', [
      el('div', { class: 'stack' }, [
        el('button', { class: 'btn ghost', text: 'Export everything', onclick: exportData }),
        el('button', { class: 'btn danger', text: 'Delete everything, permanently', onclick: confirmDelete })
      ])
    ]);

    v.appendChild(el('div', { class: 'notice', html: '<b>SoulCap is not therapy</b>, not a doctor, and not a crisis service. Nothing you write leaves this device. There is no account and no server.' }));
    v.appendChild(el('p', { class: 'p-sm', style: 'text-align:center', text: 'SoulCap · v' + APP_VERSION }));
    v.appendChild(el('button', { class: 'help-btn', text: t('helpNow'), onclick: openPanic }));
  }
  var APP_VERSION = '1.2.1';
  function settingsGroup(v, title, kids) { v.appendChild(el('p', { class: 'eyebrow', style: 'margin-top:14px', text: title })); kids.forEach(function (k) { if (k) v.appendChild(k); }); }
  function toggleBtn(label, on, fn) { return el('button', { class: 'btn ghost', style: 'display:flex;justify-content:space-between', onclick: fn, html: '<span>' + label + '</span><span style="color:var(--accent);font-weight:600">' + (on ? 'On' : 'Off') + '</span>' }); }
  function settingChips(opts, isOn, fn) { return el('div', { class: 'chips' }, opts.map(function (o) { return el('button', { class: 'chip', 'aria-pressed': isOn(o) ? 'true' : 'false', text: o.l, onclick: function () { fn(o); } }); })); }
  function setAppearance(key, value) {
    var before = state.appearance[key];
    state.appearance[key] = value;
    if (!save()) { state.appearance[key] = before; applyTheme(); showPreferenceSaveFailed(); return; }
    applyTheme(); reRender();
  }

  var voiceFilter = 'All';
  function voiceSheet() {
    loadVoices();
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: 'Voice & accent' }));
      p.appendChild(el('p', { class: 'p-sm', text: 'These are your device’s built-in voices. They sound most natural on a phone — a laptop may sound flatter. The enhanced ones are listed first.' }));
      sessionMute = false; // let the previews be heard

      if (!voices.length) {
        p.appendChild(el('div', { class: 'notice', text: 'No voices available on this device yet. Try again in a moment, or on your phone.' }));
      } else {
        var accents = ['All'].concat(voices.map(voiceAccent).filter(function (a, i, arr) { return arr.indexOf(a) === i; }));
        var listWrap = el('div', { class: 'stack' });
        function renderList() {
          clear(listWrap);
          voices.filter(function (v) { return voiceFilter === 'All' || voiceAccent(v) === voiceFilter; }).forEach(function (v) {
            var enhanced = voiceQuality(v) >= 3;
            listWrap.appendChild(el('button', {
              class: 'opt', 'aria-pressed': state.voice.name === v.name ? 'true' : 'false',
              html: '<span>' + v.name.replace(/\s*\((enhanced|premium)\)/i, '') + (enhanced ? ' ✦' : '') + '</span><span class="os">' + voiceAccent(v) + '</span>',
              onclick: function () {
                state.voice.name = v.name; state.voice.on = true; save();
                Array.prototype.forEach.call(listWrap.children, function (b) { b.setAttribute('aria-pressed', 'false'); });
                this.setAttribute('aria-pressed', 'true');
                speak('Breathe in through your nose, and slowly out.');
              }
            }));
          });
        }
        if (accents.length > 2) {
          p.appendChild(el('p', { class: 'eyebrow', text: 'Accent' }));
          p.appendChild(el('div', { class: 'chips' }, accents.map(function (a) {
            return el('button', { class: 'chip', 'aria-pressed': voiceFilter === a ? 'true' : 'false', text: a,
              onclick: function () { voiceFilter = a; Array.prototype.forEach.call(this.parentNode.children, function (b) { b.setAttribute('aria-pressed', 'false'); }); this.setAttribute('aria-pressed', 'true'); renderList(); } });
          })));
        }
        p.appendChild(el('p', { class: 'eyebrow', text: 'Voice' }));
        p.appendChild(listWrap); renderList();
      }

      [['Speed', 'rate', 0.5, 1.2, 0.05], ['Pitch', 'pitch', 0.7, 1.3, 0.05]].forEach(function (cfg) {
        var r = el('input', { type: 'range', min: cfg[2], max: cfg[3], step: cfg[4], value: state.voice[cfg[1]], 'aria-label': cfg[0] });
        r.addEventListener('change', function () { state.voice[cfg[1]] = parseFloat(r.value); state.voice.on = true; save(); speak('Breathe out, slowly.'); });
        p.appendChild(el('div', {}, [el('p', { class: 'eyebrow', style: 'margin-top:8px', text: cfg[0] }), r]));
      });
      p.appendChild(el('button', { class: 'btn ghost', text: 'Hear a preview', onclick: function () { state.voice.on = true; speak('Breathe in through your nose. Hold. And slowly out through your mouth.'); } }));
      p.appendChild(el('button', { class: 'btn', text: 'Done', onclick: function () { hushVoice(); closeSheet(); render(); } }));
    });
  }
  function setInference(id, val) { state.inferences.push({ id: id, confirmed: val }); if (val) state.concerns.push('Nights are harder'); save(); render(); }
  function exportData() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'soulcap-export.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function confirmDelete() {
    openSheet(function (p) {
      p.appendChild(el('h2', { class: 'h-sec', text: 'Delete everything?' }));
      p.appendChild(el('p', { class: 'p', text: 'Check-ins, exercises, your Constellation, your journal, your plan. This cannot be undone, and there is no backup anywhere.' }));
      p.appendChild(el('button', { class: 'btn danger', text: 'Yes, delete it all', onclick: function () {
        try { localStorage.removeItem(KEY); localStorage.removeItem('soulcap_theme'); localStorage.removeItem('soulcap_appearance'); localStorage.removeItem('soulcap_locale'); } catch (e) {}
        state = clone(DEFAULT); closeSheet(); applyTheme(); render();
      } }));
      p.appendChild(el('button', { class: 'btn quiet', text: 'Keep my data', onclick: closeSheet }));
    });
  }

  /* ── Welcome & onboarding ──────────────────────────────────────────────── */
  function renderWelcome() {
    var v = $('#view-welcome'); clear(v);
    v.appendChild(el('div', { style: 'flex:1;display:flex;flex-direction:column;justify-content:center;gap:22px' }, [
      el('img', { src: 'icons/mark.svg', alt: '', width: '62', height: '62' }),
      el('h1', { class: 'h-voice', style: 'font-size:34px', text: 'A quiet place to steady yourself.' }),
      el('p', { class: 'p-voice', text: 'Techniques that work in a few minutes. A private journal. A map of the people around you. Everything stays on your phone.' }),
      el('p', { class: 'p-sm', text: 'Not therapy. Not a crisis service. Just something that helps.' })
    ]));
    v.appendChild(el('div', { class: 'stack' }, [
      el('button', { class: 'btn', text: 'Begin', onclick: function () { state.welcomed = true; save(); render(); } }),
      el('button', { class: 'help-btn', text: t('helpNow'), onclick: openPanic })
    ]));
  }
  var obStep = 0;
  function renderOnboarding() {
    var v = $('#view-onboarding'); clear(v);
    v.appendChild(el('div', { style: 'display:flex;gap:5px;margin-bottom:8px' }, [0, 1, 2, 3].map(function (i) {
      return el('i', { style: 'height:3px;flex:1;border-radius:2px;display:block;background:' + (i <= obStep ? 'var(--accent)' : 'var(--line-strong)') });
    })));
    if (obStep === 0) {
      v.appendChild(el('h1', { class: 'h-voice', text: 'First — how old are you?' }));
      v.appendChild(el('p', { class: 'p', text: 'SoulCap is built for adults. We ask because the right support for someone under 18 looks different, and we’d rather point you somewhere better than get it wrong.' }));
      v.appendChild(el('div', { class: 'stack' }, [
        el('button', { class: 'opt', html: '18 or older', onclick: function () { state.ageOk = true; save(); obStep = 1; render(); } }),
        el('button', { class: 'opt', html: 'Under 18<span class="os">This isn’t built for you yet — please talk to a trusted adult or a service for young people</span>', onclick: function () { state.ageOk = false; save(); render(); } })
      ]));
      if (state.ageOk === false) v.appendChild(el('div', { class: 'card' }, [el('p', { class: 'p-voice', text: 'SoulCap isn’t the right fit yet. Please reach out to a trusted adult, or a support service made for young people where you are.' })]));
    } else if (obStep === 1) {
      v.appendChild(el('h1', { class: 'h-voice', text: 'What should we call you?' }));
      v.appendChild(el('p', { class: 'p', text: 'So this feels like yours. Skip it if you’d rather not.' }));
      var name = el('input', { type: 'text', placeholder: 'Your name or a nickname', 'aria-label': 'Name', value: state.profile.name });
      v.appendChild(name);
      v.appendChild(el('button', { class: 'btn', text: 'Continue', onclick: function () { state.profile.name = name.value.trim().slice(0, 40); save(); obStep = 2; render(); } }));
      v.appendChild(el('button', { class: 'btn quiet', text: 'Skip', onclick: function () { obStep = 2; render(); } }));
    } else if (obStep === 2) {
      v.appendChild(el('h1', { class: 'h-voice', text: 'What this is, plainly.' }));
      v.appendChild(el('div', { class: 'notice', html: '<b>SoulCap is not therapy</b>, not a doctor, and not a crisis service. It teaches skills and helps you notice patterns.<ul style="margin:9px 0 0;padding-left:17px"><li>Everything stays on your phone. No account, no server.</li><li>We never sell your data or train on it.</li><li>You can export or delete all of it, any time.</li><li>If you ever feel unsafe, please reach out to someone you trust or your local emergency services.</li></ul>' }));
      v.appendChild(el('button', { class: 'btn', text: 'I understand', onclick: function () { state.consent = true; save(); obStep = 3; render(); } }));
    } else {
      v.appendChild(el('h1', { class: 'h-voice', text: 'What’s been hard lately?' }));
      v.appendChild(el('p', { class: 'p', text: 'Pick any, or none. You can change this whenever — skipping doesn’t break anything.' }));
      v.appendChild(el('div', { class: 'chips' }, CONCERNS.map(function (c) {
        return el('button', { class: 'chip', 'aria-pressed': state.concerns.indexOf(c) !== -1 ? 'true' : 'false', text: c, onclick: function () { var i = state.concerns.indexOf(c); if (i === -1) state.concerns.push(c); else state.concerns.splice(i, 1); save(); render(); } });
      })));
      v.appendChild(el('button', { class: 'btn', text: 'Start', onclick: finishOnboarding }));
      v.appendChild(el('button', { class: 'btn quiet', text: 'Skip — just let me in', onclick: finishOnboarding }));
    }
    v.appendChild(el('button', { class: 'help-btn', style: 'margin-top:auto', text: t('helpNow'), onclick: openPanic }));
  }
  function finishOnboarding() { state.onboarded = true; save(); render(); }

  /* ── Router ────────────────────────────────────────────────────────────── */
  var tab = 'now';
  function selectTab(t) { tab = t; render(); window.scrollTo(0, 0); }
  // Re-render in place without jumping to the top — for toggles/pickers inside a
  // scrolled view (theme, vibration, etc). Rebuilding the view otherwise resets
  // scroll to 0, which read as an unwanted auto-scroll.
  function reRender() { var y = window.scrollY; render(); window.scrollTo(0, y); }
  var VIEWS = ['welcome', 'onboarding', 'now', 'calm', 'journal', 'map', 'me'];
  function render() {
    applyTheme();
    stopMap(); // cancel any running orbit rAF; drawMap restarts it if we're on the map
    VIEWS.forEach(function (v) { $('#view-' + v).classList.remove('on'); });
    if (!state.welcomed) { $('#tabs').style.display = 'none'; $('#fab').classList.remove('on'); renderWelcome(); $('#view-welcome').classList.add('on'); return; }
    if (!state.onboarded) { $('#tabs').style.display = 'none'; $('#fab').classList.remove('on'); renderOnboarding(); $('#view-onboarding').classList.add('on'); return; }
    $('#tabs').style.display = 'flex'; $('#fab').classList.add('on');
    if (tab === 'now') renderNow();
    if (tab === 'calm') renderCalm();
    if (tab === 'journal') renderJournal();
    if (tab === 'map') renderMap();
    if (tab === 'me') renderMe();
    $('#view-' + tab).classList.add('on');
    Array.prototype.forEach.call($('#tabs').children, function (b) { b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false'); });
    if (tab === 'map' && state.people.length) drawMap();
  }

  /* ── Demo ──────────────────────────────────────────────────────────────── */
  function seedDemo() {
    state = clone(DEFAULT);
    state.welcomed = true; state.onboarded = true; state.ageOk = true;
    state.consent = true;
    state.profile = { name: 'Shamikh', age: '', pronouns: '' };
    state.history = { status: 'Single', household: 'with my family', hobbies: 'cricket, cooking, long drives' };
    state.concerns = ['Hard to switch off', 'Low mood'];
    var day = 86400000, now = Date.now();
    ['Wired', 'Flat', 'Steady', 'Heavy', 'Wired', 'Steady'].forEach(function (s, i) {
      var t = now - (6 - i) * day;
      state.checkins.push(normalizeCheckin({
        id:uid(), t:t, updatedAt:t, state:s,
        dims:{ energy:i % 2 ? 3 : 2, noise:i === 0 || i === 3 || i === 4 ? 4 : 2 },
        triggers:i === 0 || i === 2 || i === 4 ? ['work'] : [],
        need:i < 2 ? 'settle' : '', feeling:''
      }, i));
    });
    state.skillRuns.push({ t: now - 3 * day, id: 'box-breathing', helpful: true });
    state.skillRuns.push({ t: now - 2 * day, id: 'box-breathing', helpful: true });
    state.skillRuns.push({ t: now - day, id: 'grounding-54321', helpful: true });
    state.favourites = ['physiological-sigh'];
    state.journal = [
      { id: uid(), t: now - 2 * day, title: 'A better evening', body: 'Managed a walk before it got dark. Small thing but the flat felt less heavy after.', mood: '🙂', photos: [] },
      { id: uid(), t: now - 5 * day, title: '', body: 'Couldn’t switch off again. Tried the breathing. Helped more than I expected.', mood: '😐', photos: [] }
    ];
    state.people = [
      { id: uid(), name: 'Amina', type: 'FAMILY', ring: 'r0', supportive: .85, drain: .15, hard: false, suggestible: true, lastContact: now - 9 * day },
      { id: uid(), name: 'Bilal', type: 'FRIEND', ring: 'r0', supportive: .7, drain: .3, hard: false, suggestible: true, lastContact: null },
      { id: uid(), name: 'Mum', type: 'FAMILY', ring: 'r1', supportive: .6, drain: .4, hard: false, suggestible: true, lastContact: null },
      { id: uid(), name: 'Dr. Naveed', type: 'CARE', ring: 'r1', supportive: .8, drain: .2, hard: false, suggestible: false, lastContact: null },
      { id: uid(), name: 'Usman', type: 'COLLEAGUE', ring: 'r2', supportive: .3, drain: .6, hard: false, suggestible: true, lastContact: null },
      { id: uid(), name: 'Dad', type: 'FAMILY', ring: 'r2', supportive: .3, drain: .8, hard: true, suggestible: true, lastContact: null }
    ];
    save();
  }

  /* ── Boot ──────────────────────────────────────────────────────────────── */
  function queryValue(name) {
    var match = location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
    if (!match) return '';
    try { return decodeURIComponent(match[1].replace(/\+/g, ' ')); }
    catch (e) { return ''; }
  }
  function boot() {
    if (location.search.indexOf('demo=1') !== -1) seedDemo();
    var requestedTab = queryValue('tab');
    if (['now', 'calm', 'journal', 'map', 'me'].indexOf(requestedTab) !== -1) tab = requestedTab;

    $('#panicExit').addEventListener('click', closePanic);
    $('#runClose').addEventListener('click', closeRunner);
    $('#runGuide').addEventListener('click', toggleGuide);
    $('#sheetScrim').addEventListener('click', closeSheet);
    $('#fab').addEventListener('click', function () { buzz(14); openPanic(); });

    // Journal editor
    $('#jeCancel').addEventListener('click', closeEditor);
    $('#jePhotoBtn').addEventListener('click', function () { $('#jeFile').click(); });
    $('#jeFile').addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; if (f) addPhotoFromFile(f); e.target.value = ''; });
    $('#jeDecorBtn').addEventListener('click', decorateDraftSheet);
    $('#jeMicBtn').addEventListener('click', startJournalTranscription);
    $('#jeStickerBtn').addEventListener('click', function () {
      openSheet(function (p) {
        p.appendChild(el('h2', { class: 'h-sec', text: 'Add a sticker' }));
        p.appendChild(el('div', { class: 'sticker-row' }, JOURNAL_STICKERS.map(function (s) {
          return el('button', { text: s, 'aria-label': 'Sticker ' + s, onclick: function () {
            var ta = $('#jeBody'); ta.value = (ta.value + (ta.value && !/\s$/.test(ta.value) ? ' ' : '') + s + ' ');
            closeSheet(); ta.focus();
          } });
        })));
        p.appendChild(el('button', { class: 'btn quiet', text: 'Close', onclick: closeSheet }));
      });
    });
    $('#jePromptBtn').addEventListener('click', function () {
      var pr = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
      var pEl = $('#jePrompt'); pEl.textContent = pr; pEl.classList.add('on'); $('#jeBody').focus();
    });

    Array.prototype.forEach.call($('#tabs').children, function (b) { b.addEventListener('click', function () { buzz(8); selectTab(b.dataset.tab); }); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && $('#sheet').classList.contains('on')) {
        trapSheetFocus(e);
        return;
      }
      if (e.key !== 'Escape') return;
      if ($('#sheet').classList.contains('on')) closeSheet();
      else if ($('#journalEditor').classList.contains('on')) closeEditor();
      else if ($('#runner').classList.contains('on')) closeRunner();
      else if ($('#panic').classList.contains('on')) closePanic();
    });

    window.addEventListener('offline', function () { $('#offline').hidden = false; });
    window.addEventListener('online', function () { $('#offline').hidden = true; });
    if (!navigator.onLine) $('#offline').hidden = false;

    if ('speechSynthesis' in window) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }

    render();
    if (queryValue('panic') === '1') {
      $('#splash').classList.add('gone');
      openPanic();
    }

    var splash = $('#splash'), dismiss = function () { splash.classList.add('gone'); };
    setTimeout(dismiss, state.onboarded ? 1500 : 2300);
    splash.addEventListener('click', dismiss);

    if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  window.__soulcap = {
    assessRisk: assessRisk, suggestSkill: suggestSkill, suggestPerson: suggestPerson,
    getState: function () { return state; }, skillCount: SKILLS.length,
    skillIds: SKILLS.map(function (skill) { return skill.id; }), version: '1.2.1',
    nextDripQuestion: nextDripQuestion, estimateValue: estimateValue,
    answerDrip: answerDrip, skipDrip: skipDrip, correctEstimate: correctEstimate,
    clearEstimate: clearEstimate, setTheme: setTheme, setLocale: setLocale,
    setRingCount: setRingCount, contactScore: contactScore, logSpokeToday: logSpokeToday,
    startSkill: startSkill // test hook
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
