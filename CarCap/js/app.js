'use strict';

window.APP_VERSION = '1.0.1';

const TABS = ['today', 'garage', 'service', 'fuel', 'docs', 'settings'];
let currentTab = 'today';
let toastTimer = null;
const SW_CACHE = 'carcap-v8';
const CC = CCBrand;
const PHOTO_MAX_LABEL = '2 MB';

/* ── Utils ── */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtMoney(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Number(n).toFixed(2);
}

function fmtNum(n, digits) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toFixed(digits == null ? 0 : digits);
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d.getTime())) return esc(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isStandalonePwa() {
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    if (typeof navigator !== 'undefined' && navigator.standalone) return true;
  } catch (e) { /* ignore */ }
  return false;
}

function toast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 4000);
}

function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
}

function openModal(title, bodyHtml, onMount, opts) {
  const root = document.getElementById('modal-root');
  const dismissible = !(opts && opts.noDismiss);
  root.innerHTML =
    '<div class="modal-backdrop" id="modal-backdrop">' +
      '<div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<div class="modal-title" id="modal-title" tabindex="-1">' + esc(title) + '</div>' +
        bodyHtml +
      '</div>' +
    '</div>';
  const backdrop = document.getElementById('modal-backdrop');
  if (dismissible) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }
  const titleEl = document.getElementById('modal-title');
  if (titleEl) titleEl.focus();
  if (typeof onMount === 'function') onMount();
}

async function confirmAction(opts) {
  if (typeof window.CapConfirm !== 'function') {
    throw new Error('ConfirmDialog unavailable');
  }
  return CapConfirm(opts);
}

/* ── Header ── */
function updateHeader() {
  const v = S.activeVehicle();
  const sub = document.getElementById('header-sub');
  const pill = document.getElementById('header-pill');
  sub.textContent = v ? S.vehicleLabel(v) : 'Add a vehicle to start';
  if (S.isDemo()) {
    pill.hidden = false;
    pill.textContent = 'Sample data';
    pill.className = 'pill';
  } else {
    pill.hidden = true;
  }
}

/* ── Vehicle picker strip ── */
function vehiclePickerHtml(selectedId) {
  const list = S.vehicles();
  if (!list.length) return '';
  const active = selectedId || (S.activeVehicle() && S.activeVehicle().id);
  return (
    '<div style="margin-bottom:8px">' +
    list.map((v) =>
      '<button type="button" class="vehicle-chip' + (v.id === active ? ' active' : '') + '" data-set-vehicle="' + esc(v.id) + '">' +
        esc(S.vehicleLabel(v)) +
      '</button>'
    ).join('') +
    '</div>'
  );
}

function comingUpCards(items) {
  if (!items.length) {
    return '<div class="card"><div class="card-title">All clear</div><div class="card-meta">Nothing coming up in the next 30 days.</div></div>';
  }
  return items.map((r) =>
    '<div class="card' + (r.overdue ? ' card--alert' : '') + '">' +
      '<div class="card-row">' +
        '<div>' +
          '<div class="card-title">' + esc(r.title) + '</div>' +
          '<div class="card-meta">' + esc(r.meta) + ' · ' + fmtDate(r.date) + '</div>' +
        '</div>' +
        '<span class="pill ' + (r.overdue ? 'danger' : 'warn') + '">' +
          (r.overdue ? (r.kind === 'doc' ? 'Expired' : 'Overdue') : 'Coming up') +
        '</span>' +
      '</div>' +
    '</div>'
  ).join('');
}

/* ── Screens ── */
function renderToday() {
  const v = S.activeVehicle();
  if (!v) {
    return (
      '<div class="screen">' +
        '<h1 class="page-title">Today</h1>' +
        '<p class="page-sub">Service, fuel and documents for your cars.</p>' +
        '<div class="empty">' +
          '<strong>No vehicles yet</strong>' +
          'Add a car in Garage, or load sample data from Settings.' +
          '<div class="btn-row" style="justify-content:center">' +
            '<button type="button" class="btn btn-primary" data-go="garage">Open Garage</button>' +
            '<button type="button" class="btn" data-action="demo">Try sample</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  const odo = S.latestOdometer(v.id);
  const fuel = S.fuelStats(v.id);
  const coming = S.comingUp(30, v.id);
  const overdue = coming.filter((r) => r.overdue).length;
  const economyNote = fuel.count < 2
    ? '<div class="state-banner" role="status"><strong>Economy needs more fills</strong> Log at least two full-tank fill-ups with a rising odometer to see average L/100.</div>'
    : '';
  const overdueNote = overdue
    ? '<div class="state-banner state-banner--danger" role="status"><strong>' + overdue + ' overdue</strong> Check service or documents below.</div>'
    : '';

  const recentFuel = S.fuelFor(v.id).slice(0, 2);
  const recentSvc = S.servicesFor(v.id).slice(0, 2);

  return (
    '<div class="screen today-bay">' +
      '<div class="bay-keyfob" aria-hidden="true"></div>' +
      '<h1 class="page-title">Today</h1>' +
      '<p class="page-sub">' + esc(S.vehicleLabel(v)) + (v.plate ? ' · ' + esc(v.plate) : '') + '</p>' +
      vehiclePickerHtml(v.id) +
      overdueNote +
      economyNote +
      '<div class="today-bay-layout">' +
        '<div class="today-bay-main">' +
          '<div class="bay-slot">' +
            '<div class="bay-slot__label">Service bay</div>' +
            '<div class="stat-grid">' +
              '<div class="stat"><div class="stat-label">Odometer</div><div class="stat-value accent odo">' + (odo != null ? fmtNum(odo) + ' km' : '—') + '</div></div>' +
              '<div class="stat"><div class="stat-label">Overdue</div><div class="stat-value">' + overdue + '</div></div>' +
              '<div class="stat"><div class="stat-label">Fuel fills</div><div class="stat-value">' + fuel.count + '</div></div>' +
              '<div class="stat"><div class="stat-label">Avg L/100</div><div class="stat-value">' + (fuel.avgLPer100 != null ? fmtNum(fuel.avgLPer100, 1) : '—') + '</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="section-label">Coming up</div>' +
          comingUpCards(coming) +
          '<div class="btn-row">' +
            '<button type="button" class="btn btn-primary" data-go="fuel">Log fuel</button>' +
            '<button type="button" class="btn" data-go="service">Add service</button>' +
          '</div>' +
        '</div>' +
        '<aside class="today-bay-rail" aria-label="Recent activity">' +
          '<div class="section-label">Receipt rail</div>' +
          (recentSvc.length || recentFuel.length
            ? recentSvc.map((s) =>
                '<div class="card receipt-card"><div class="card-title">' + esc(s.type) + '</div><div class="card-meta">Service · ' + fmtDate(s.date) + (s.cost != null ? ' · ' + fmtMoney(s.cost) : '') + '</div></div>'
              ).join('') +
              recentFuel.map((f) =>
                '<div class="card receipt-card"><div class="card-title">Fuel ' + (f.liters != null ? fmtNum(f.liters, 1) + ' L' : '') + '</div><div class="card-meta">' + fmtDate(f.date) + (f.cost != null ? ' · ' + fmtMoney(f.cost) : '') + '</div></div>'
              ).join('')
            : '<div class="card receipt-card"><div class="card-meta">No recent activity yet.</div></div>') +
        '</aside>' +
      '</div>' +
    '</div>'
  );
}

function renderGarage() {
  const list = S.vehicles();
  const cards = list.length
    ? list.map((v) => {
        const active = S.d.activeVehicleId === v.id;
        const odo = S.latestOdometer(v.id);
        return (
          '<div class="card bay-card' + (active ? ' bay-card--active' : '') + '">' +
            '<div class="bay-card__door" aria-hidden="true"></div>' +
            '<div class="card-row">' +
              '<div>' +
                '<div class="card-title">' + esc(S.vehicleLabel(v)) + (active ? ' <span class="pill">Active</span>' : '') + '</div>' +
                '<div class="card-meta">' +
                  esc([v.year, v.make, v.model].filter(Boolean).join(' ')) +
                  (v.plate ? ' · ' + esc(v.plate) : '') +
                  (odo != null ? ' · ' + fmtNum(odo) + ' km' : '') +
                '</div>' +
              '</div>' +
              '<div class="list-actions">' +
                (!active ? '<button type="button" class="btn btn-sm" data-set-vehicle="' + esc(v.id) + '">Use</button>' : '') +
                '<button type="button" class="btn btn-sm" data-edit-vehicle="' + esc(v.id) + '">Edit</button>' +
                '<button type="button" class="btn btn-sm btn-danger" data-del-vehicle="' + esc(v.id) + '">Delete</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('')
    : '<div class="empty"><strong>Empty garage</strong>Add your first vehicle to track service, fuel, and docs.</div>';

  return (
    '<div class="screen">' +
      '<h1 class="page-title">Garage</h1>' +
      '<p class="page-sub">Make, model, year, plate.</p>' +
      cards +
      '<button type="button" class="btn btn-primary btn-block" data-action="add-vehicle">Add car</button>' +
    '</div>'
  );
}

function renderService() {
  const v = S.activeVehicle();
  if (!v) {
    return '<div class="screen"><h1 class="page-title">Service</h1><div class="empty"><strong>Pick a vehicle</strong><button type="button" class="btn btn-primary" data-go="garage" style="margin-top:12px">Garage</button></div></div>';
  }
  const list = S.servicesFor(v.id);
  const overdue = S.upcomingReminders(30).filter((r) => r.vehicleId === v.id && r.overdue);
  const overdueBanner = overdue.length
    ? '<div class="state-banner state-banner--danger" role="status"><strong>Overdue service</strong> ' +
      overdue.map((r) => esc(r.service.type) + ' was due ' + fmtDate(r.service.reminderDate)).join(' · ') +
      '</div>'
    : '';
  const cards = list.length
    ? list.map((s) =>
        '<div class="card">' +
          '<div class="card-row">' +
            '<div>' +
              '<div class="card-title">' + esc(s.type) + '</div>' +
              '<div class="card-meta">' +
                fmtDate(s.date) +
                (s.odometer != null ? ' · ' + fmtNum(s.odometer) + ' km' : '') +
                (s.cost != null ? ' · ' + fmtMoney(s.cost) : '') +
                (s.reminderDate ? ' · remind ' + fmtDate(s.reminderDate) : '') +
              '</div>' +
              (s.notes ? '<div class="card-notes">' + esc(s.notes) + '</div>' : '') +
            '</div>' +
            '<button type="button" class="btn btn-sm btn-danger" data-del-service="' + esc(s.id) + '">Delete</button>' +
          '</div>' +
        '</div>'
      ).join('')
    : '<div class="empty"><strong>No service logged</strong>Oil changes, tires, brakes — keep a history.</div>';

  return (
    '<div class="screen">' +
      '<h1 class="page-title">Service</h1>' +
      '<p class="page-sub">' + esc(S.vehicleLabel(v)) + '</p>' +
      vehiclePickerHtml(v.id) +
      overdueBanner +
      cards +
      '<button type="button" class="btn btn-primary btn-block" data-action="add-service">Log service</button>' +
    '</div>'
  );
}

function renderFuel() {
  const v = S.activeVehicle();
  if (!v) {
    return '<div class="screen"><h1 class="page-title">Fuel</h1><div class="empty"><strong>Pick a vehicle</strong><button type="button" class="btn btn-primary" data-go="garage" style="margin-top:12px">Garage</button></div></div>';
  }
  const stats = S.fuelStats(v.id);
  const list = S.fuelFor(v.id);
  const economyBanner = stats.count < 2
    ? '<div class="state-banner" role="status"><strong>Not enough fill-ups yet</strong> Average L/100 appears after two full-tank entries with a rising odometer.</div>'
    : '';
  const cards = list.length
    ? list.map((f) =>
        '<div class="card">' +
          '<div class="card-row">' +
            '<div>' +
              '<div class="card-title">' + (f.liters != null ? fmtNum(f.liters, 1) + ' L' : 'Fuel') + (f.fullTank ? ' · full' : '') + '</div>' +
              '<div class="card-meta">' +
                fmtDate(f.date) +
                (f.odometer != null ? ' · ' + fmtNum(f.odometer) + ' km' : '') +
                (f.cost != null ? ' · ' + fmtMoney(f.cost) : '') +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn btn-sm btn-danger" data-del-fuel="' + esc(f.id) + '">Delete</button>' +
          '</div>' +
        '</div>'
      ).join('')
    : '<div class="empty"><strong>No fuel entries</strong>Log fills with odometer. Avg L/100 needs at least two full-tank fills with rising odometer.</div>';

  return (
    '<div class="screen">' +
      '<h1 class="page-title">Fuel</h1>' +
      '<p class="page-sub">' + esc(S.vehicleLabel(v)) + '</p>' +
      vehiclePickerHtml(v.id) +
      economyBanner +
      '<div class="stat-grid">' +
        '<div class="stat"><div class="stat-label">Total cost</div><div class="stat-value">' + fmtMoney(stats.totalCost) + '</div></div>' +
        '<div class="stat"><div class="stat-label">Liters</div><div class="stat-value">' + fmtNum(stats.totalLiters, 1) + '</div></div>' +
        '<div class="stat"><div class="stat-label">Odometer</div><div class="stat-value accent odo">' + (stats.odometer != null ? fmtNum(stats.odometer) : '—') + '</div></div>' +
        '<div class="stat"><div class="stat-label">Avg L/100</div><div class="stat-value">' + (stats.avgLPer100 != null ? fmtNum(stats.avgLPer100, 1) : '—') + '</div></div>' +
      '</div>' +
      cards +
      '<button type="button" class="btn btn-primary btn-block" data-action="add-fuel">Log fuel</button>' +
    '</div>'
  );
}

function renderDocs() {
  const v = S.activeVehicle();
  if (!v) {
    return '<div class="screen"><h1 class="page-title">Docs</h1><div class="empty"><strong>Pick a vehicle</strong><button type="button" class="btn btn-primary" data-go="garage" style="margin-top:12px">Garage</button></div></div>';
  }
  const list = S.docsFor(v.id);
  const typeLabel = { title: 'Title', insurance: 'Insurance', registration: 'Registration', other: 'Other' };
  const expired = list.filter((d) => {
    if (!d.expiry) return false;
    const due = new Date(d.expiry + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  });
  const expiredBanner = expired.length
    ? '<div class="state-banner state-banner--danger" role="status"><strong>Expired document</strong> ' +
      expired.map((d) => esc(d.title) + ' expired ' + fmtDate(d.expiry)).join(' · ') +
      '</div>'
    : '';
  const cards = list.length
    ? list.map((d) => {
        const isExpired = expired.some((x) => x.id === d.id);
        return (
          '<div class="card' + (isExpired ? ' card--alert' : '') + '" data-doc-card="' + esc(d.id) + '">' +
            '<div class="card-row">' +
              '<div>' +
                '<div class="card-title">' + esc(d.title) +
                  (isExpired ? ' <span class="pill danger">Expired</span>' : '') +
                  (d.photoId ? ' <span class="pill">Photo</span>' : '') +
                '</div>' +
                '<div class="card-meta">' +
                  esc(typeLabel[d.type] || d.type) +
                  (d.expiry ? ' · expires ' + fmtDate(d.expiry) : '') +
                '</div>' +
                (d.notes ? '<div class="card-notes">' + esc(d.notes) + '</div>' : '') +
                '<div class="doc-photo-slot" data-photo-slot="' + esc(d.id) + '"></div>' +
              '</div>' +
              '<div class="list-actions">' +
                '<button type="button" class="btn btn-sm" data-view-doc="' + esc(d.id) + '">Open</button>' +
                '<button type="button" class="btn btn-sm btn-danger" data-del-doc="' + esc(d.id) + '">Delete</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('')
    : '<div class="empty"><strong>Docs wallet empty</strong>Add title, insurance or registration. Optional photos stay on this device (max ' + PHOTO_MAX_LABEL + ' each).</div>';

  return (
    '<div class="screen">' +
      '<h1 class="page-title">Docs</h1>' +
      '<p class="page-sub">' + esc(S.vehicleLabel(v)) + ' · notes and optional photos</p>' +
      vehiclePickerHtml(v.id) +
      expiredBanner +
      cards +
      '<button type="button" class="btn btn-primary btn-block" data-action="add-doc">Add document</button>' +
    '</div>'
  );
}

function renderSettings() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const notifyOn = !!(S.d.settings && S.d.settings.notifyReminders);
  return (
    '<div class="screen">' +
      '<h1 class="page-title">Settings</h1>' +
      '<p class="page-sub">Offline PWA · Capricorn Systems</p>' +
      '<div class="card">' +
        '<div class="card-title">Appearance</div>' +
        '<div class="card-meta">Light paper or dark ink.</div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn' + (theme === 'light' ? ' btn-primary' : '') + '" data-action="theme-light">Light</button>' +
          '<button type="button" class="btn' + (theme !== 'light' ? ' btn-primary' : '') + '" data-action="theme-dark">Dark</button>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">Reminders</div>' +
        '<div class="card-meta">Coming up on Today shows service due and insurance or registration expiry within 30 days.</div>' +
        '<div class="card-meta">Reminders work while CarCap is installed on your Home Screen. Your phone may delay them.</div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn' + (notifyOn ? ' btn-primary' : '') + '" data-action="notify-toggle" aria-pressed="' + (notifyOn ? 'true' : 'false') + '">' +
            (notifyOn ? 'Notifications on' : 'Enable notifications') +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">Sample data</div>' +
        '<div class="card-meta">Seeds one Toyota Corolla with sample service, fuel, and docs. Replaces current local data.</div>' +
        '<div class="btn-row">' +
          (S.isDemo()
            ? '<button type="button" class="btn btn-danger" data-action="clear-demo">Clear sample data</button>'
            : '<button type="button" class="btn btn-primary" data-action="demo">Load sample</button>') +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">Data</div>' +
        '<div class="card-meta">Vehicles, service, fuel and document notes stay in this browser. Photos stay in IndexedDB on this device. No account, no cloud.</div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="export">Export JSON</button>' +
          '<button type="button" class="btn" data-action="import-pick">Import JSON</button>' +
          '<button type="button" class="btn btn-danger" data-action="reset">Erase all data</button>' +
        '</div>' +
        '<input type="file" id="import-file" accept="application/json,.json" hidden>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">Install</div>' +
        '<div class="card-meta">On iPhone: Share → Add to Home Screen. On desktop: browser install icon.</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">About</div>' +
        '<div class="card-meta">CarCap v' + esc(window.APP_VERSION) + ' · SW ' + esc(SW_CACHE) + '</div>' +
        '<div class="card-meta">Service, fuel and documents for your cars.</div>' +
        '<div class="btn-row">' +
          '<a class="btn" href="privacy.html">Privacy</a>' +
          '<a class="btn" href="https://shamikhahmed.github.io/support.html" target="_blank" rel="noopener">Support</a>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

const SCREENS = {
  today: renderToday,
  garage: renderGarage,
  service: renderService,
  fuel: renderFuel,
  docs: renderDocs,
  settings: renderSettings
};

function tabQuery(tab) {
  const params = new URLSearchParams(location.search);
  params.set('tab', tab);
  return '?' + params.toString();
}

function go(tab) {
  if (TABS.indexOf(tab) < 0) tab = 'today';
  currentTab = tab;
  try {
    history.replaceState(null, '', tabQuery(tab));
  } catch (e) { /* ignore */ }
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const on = btn.getAttribute('data-tab') === tab;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  updateHeader();
  document.getElementById('content').innerHTML = SCREENS[tab]();
  window.scrollTo(0, 0);
  document.getElementById('content').scrollTop = 0;
  if (tab === 'docs') hydrateDocPhotos();
  maybeNotifyComingUp();
}

async function hydrateDocPhotos() {
  const slots = document.querySelectorAll('[data-photo-slot]');
  for (const slot of slots) {
    const id = slot.getAttribute('data-photo-slot');
    const doc = S.d.docs.find((d) => d.id === id);
    if (!doc || !doc.photoId) continue;
    try {
      const url = await Photos.objectUrl(doc.photoId);
      if (!url) continue;
      slot.innerHTML = '<img class="doc-photo-thumb" src="' + url + '" alt="Photo for ' + esc(doc.title) + '">';
    } catch (e) { /* ignore */ }
  }
}

function exportJson() {
  try {
    const blob = new Blob([JSON.stringify(S.exportBlob(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CarCap-backup-' + todayISO() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Backup exported');
  } catch (err) {
    toast('Couldn’t export backup. Try again.');
  }
}

function importJson(input) {
  const file = input && input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    let data;
    try {
      data = JSON.parse(String(reader.result || ''));
    } catch (err) {
      toast('Invalid backup JSON. Choose a CarCap export file.');
      input.value = '';
      return;
    }
    const ok = await confirmAction({
      title: 'Import this backup?',
      body: 'This replaces all CarCap data on this device and can’t be undone.',
      confirmLabel: 'Import backup',
      destructive: true
    });
    if (!ok) {
      input.value = '';
      return;
    }
    try {
      S.importBlob(data);
      toast('Backup imported');
      closeModal();
      go(currentTab);
    } catch (err) {
      toast(err && err.message ? err.message : 'Invalid backup JSON. Choose a CarCap export file.');
    }
    input.value = '';
  };
  reader.onerror = () => {
    toast('Couldn’t read that file. Try again.');
    input.value = '';
  };
  reader.readAsText(file);
}

/* ── Forms / modals ── */
function modalVehicle(existing) {
  const v = existing || {};
  openModal(existing ? 'Edit vehicle' : 'Add car',
    '<form id="veh-form">' +
      '<div class="form-group"><label class="form-label" for="v-nick">Nickname (optional)</label><input class="form-input" id="v-nick" value="' + esc(v.nickname || '') + '" placeholder="Daily Driver"></div>' +
      '<div class="form-grid-2">' +
        '<div class="form-group"><label class="form-label" for="v-make">Make</label><input class="form-input" id="v-make" required value="' + esc(v.make || '') + '" placeholder="Toyota"></div>' +
        '<div class="form-group"><label class="form-label" for="v-model">Model</label><input class="form-input" id="v-model" required value="' + esc(v.model || '') + '" placeholder="Corolla"></div>' +
      '</div>' +
      '<div class="form-grid-2">' +
        '<div class="form-group"><label class="form-label" for="v-year">Year</label><input class="form-input" id="v-year" type="number" min="1950" max="2100" value="' + esc(v.year || '') + '"></div>' +
        '<div class="form-group"><label class="form-label" for="v-plate">Plate</label><input class="form-input" id="v-plate" value="' + esc(v.plate || '') + '" placeholder="ABC-123"></div>' +
      '</div>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>' +
        '<button type="submit" class="btn btn-primary">' + (existing ? 'Save' : 'Add car') + '</button>' +
      '</div>' +
    '</form>',
    () => {
      document.getElementById('veh-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
          nickname: document.getElementById('v-nick').value,
          make: document.getElementById('v-make').value,
          model: document.getElementById('v-model').value,
          year: document.getElementById('v-year').value,
          plate: document.getElementById('v-plate').value
        };
        if (!data.make.trim() || !data.model.trim()) {
          toast('Make and model are required.');
          return;
        }
        if (existing) {
          S.updateVehicle(existing.id, data);
          toast('Vehicle updated');
        } else {
          const created = S.addVehicle(data);
          S.setActiveVehicle(created.id);
          toast('Vehicle added');
        }
        closeModal();
        go('garage');
      });
    }
  );
}

function modalService() {
  const v = S.activeVehicle();
  if (!v) return;
  openModal('Log service',
    '<form id="svc-form">' +
      '<div class="form-group"><label class="form-label" for="s-type">Type</label><input class="form-input" id="s-type" required placeholder="Oil change" list="svc-types">' +
        '<datalist id="svc-types"><option value="Oil change"><option value="Tire rotation"><option value="Brake service"><option value="Inspection"><option value="Battery"><option value="Other"></datalist></div>' +
      '<div class="form-grid-2">' +
        '<div class="form-group"><label class="form-label" for="s-date">Date</label><input class="form-input" id="s-date" type="date" required value="' + todayISO() + '"></div>' +
        '<div class="form-group"><label class="form-label" for="s-odo">Odometer</label><input class="form-input" id="s-odo" type="number" min="0" step="1" placeholder="km"></div>' +
      '</div>' +
      '<div class="form-grid-2">' +
        '<div class="form-group"><label class="form-label" for="s-cost">Cost</label><input class="form-input" id="s-cost" type="number" min="0" step="0.01" placeholder="0.00"></div>' +
        '<div class="form-group"><label class="form-label" for="s-remind">Remind on</label><input class="form-input" id="s-remind" type="date"></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label" for="s-notes">Notes</label><textarea class="form-textarea" id="s-notes" placeholder="Parts, shop, etc."></textarea></div>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Save visit</button>' +
      '</div>' +
    '</form>',
    () => {
      document.getElementById('svc-form').addEventListener('submit', (e) => {
        e.preventDefault();
        S.addService({
          vehicleId: v.id,
          type: document.getElementById('s-type').value,
          date: document.getElementById('s-date').value,
          odometer: document.getElementById('s-odo').value,
          cost: document.getElementById('s-cost').value,
          reminderDate: document.getElementById('s-remind').value || null,
          notes: document.getElementById('s-notes').value
        });
        closeModal();
        toast('Service logged');
        go('service');
      });
    }
  );
}

function modalFuel() {
  const v = S.activeVehicle();
  if (!v) return;
  const lastOdo = S.latestOdometer(v.id);
  openModal('Log fuel',
    '<form id="fuel-form">' +
      '<div class="form-grid-2">' +
        '<div class="form-group"><label class="form-label" for="f-date">Date</label><input class="form-input" id="f-date" type="date" required value="' + todayISO() + '"></div>' +
        '<div class="form-group"><label class="form-label" for="f-odo">Odometer</label><input class="form-input" id="f-odo" type="number" min="0" step="1" value="' + esc(lastOdo != null ? lastOdo : '') + '" placeholder="km"></div>' +
      '</div>' +
      '<div class="form-grid-2">' +
        '<div class="form-group"><label class="form-label" for="f-liters">Liters</label><input class="form-input" id="f-liters" type="number" min="0" step="0.01" required placeholder="40.0"></div>' +
        '<div class="form-group"><label class="form-label" for="f-cost">Cost</label><input class="form-input" id="f-cost" type="number" min="0" step="0.01" placeholder="0.00"></div>' +
      '</div>' +
      '<label class="check-row"><input type="checkbox" id="f-full" checked> Full tank (for L/100)</label>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Save</button>' +
      '</div>' +
    '</form>',
    () => {
      document.getElementById('fuel-form').addEventListener('submit', (e) => {
        e.preventDefault();
        S.addFuel({
          vehicleId: v.id,
          date: document.getElementById('f-date').value,
          odometer: document.getElementById('f-odo').value,
          liters: document.getElementById('f-liters').value,
          cost: document.getElementById('f-cost').value,
          fullTank: document.getElementById('f-full').checked
        });
        closeModal();
        toast('Fuel logged');
        go('fuel');
      });
    }
  );
}

function modalDoc(existing) {
  const v = S.activeVehicle();
  if (!v) return;
  const d = existing || {};
  openModal(existing ? 'Document' : 'Add document',
    '<form id="doc-form">' +
      '<div class="form-group"><label class="form-label" for="d-title">Title</label><input class="form-input" id="d-title" required placeholder="Insurance policy" value="' + esc(d.title || '') + '"></div>' +
      '<div class="form-grid-2">' +
        '<div class="form-group"><label class="form-label" for="d-type">Type</label>' +
          '<select class="form-select" id="d-type">' +
            ['title', 'insurance', 'registration', 'other'].map((t) =>
              '<option value="' + t + '"' + ((d.type || 'insurance') === t ? ' selected' : '') + '>' +
              ({ title: 'Title', insurance: 'Insurance', registration: 'Registration', other: 'Other' }[t]) +
              '</option>'
            ).join('') +
          '</select></div>' +
        '<div class="form-group"><label class="form-label" for="d-expiry">Expiry</label><input class="form-input" id="d-expiry" type="date" value="' + esc(d.expiry || '') + '"></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label" for="d-notes">Notes</label><textarea class="form-textarea" id="d-notes" placeholder="Policy number, insurer, etc.">' + esc(d.notes || '') + '</textarea></div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="d-photo">Photo (optional, max ' + PHOTO_MAX_LABEL + ')</label>' +
        '<input class="form-input" id="d-photo" type="file" accept="image/*">' +
        (d.photoId ? '<div class="card-meta" id="d-photo-status">A photo is saved on this device.</div>' : '<div class="card-meta" id="d-photo-status">Photos stay on this device only.</div>') +
      '</div>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>' +
        (d.photoId ? '<button type="button" class="btn" data-action="remove-photo" data-doc-id="' + esc(d.id) + '">Remove photo</button>' : '') +
        '<button type="submit" class="btn btn-primary">Save</button>' +
      '</div>' +
    '</form>',
    () => {
      document.getElementById('doc-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          vehicleId: v.id,
          title: document.getElementById('d-title').value,
          type: document.getElementById('d-type').value,
          expiry: document.getElementById('d-expiry').value || null,
          notes: document.getElementById('d-notes').value
        };
        const fileInput = document.getElementById('d-photo');
        const file = fileInput && fileInput.files && fileInput.files[0];
        try {
          let doc = existing;
          if (existing) {
            S.updateDoc(existing.id, payload);
            doc = S.d.docs.find((x) => x.id === existing.id);
          } else {
            doc = S.addDoc(payload);
          }
          if (file) {
            if (file.size > Photos.MAX_BYTES) {
              toast('Photo is too large. Choose an image under ' + PHOTO_MAX_LABEL + '.');
              return;
            }
            const photoId = doc.photoId || S.uid('photo');
            await Photos.put(photoId, file);
            S.updateDoc(doc.id, { photoId: photoId });
          }
          closeModal();
          toast('Document saved');
          go('docs');
        } catch (err) {
          toast(err && err.message ? err.message : 'Couldn’t save document photo.');
        }
      });
    }
  );
}

async function toggleNotifications() {
  const currently = !!(S.d.settings && S.d.settings.notifyReminders);
  if (currently) {
    S.d.settings.notifyReminders = false;
    S.save();
    toast('Notifications off');
    go('settings');
    return;
  }
  if (!('Notification' in window)) {
    toast('Notifications aren’t available in this browser.');
    return;
  }
  if (!isStandalonePwa()) {
    toast('Reminders work while CarCap is installed on your Home Screen. Your phone may delay them.');
  }
  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }
  if (perm !== 'granted') {
    toast('Notification permission wasn’t granted. Coming up still shows in Today.');
    return;
  }
  S.d.settings.notifyReminders = true;
  S.save();
  toast('Notifications on');
  go('settings');
  maybeNotifyComingUp(true);
}

function maybeNotifyComingUp(force) {
  if (!S.d.settings || !S.d.settings.notifyReminders) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!isStandalonePwa() && !force) return;
  const items = S.comingUp(30).filter((r) => r.overdue || true).slice(0, 3);
  if (!items.length) return;
  const key = 'carcap-notify-' + todayISO();
  if (!force) {
    try {
      if (localStorage.getItem(key) === '1') return;
    } catch (e) { /* ignore */ }
  }
  const overdue = items.filter((r) => r.overdue);
  const body = overdue.length
    ? overdue.map((r) => r.title + ' · overdue').join(', ')
    : items.map((r) => r.title + ' · ' + fmtDate(r.date)).join(', ');
  try {
    new Notification('CarCap · Coming up', { body: body, tag: 'carcap-coming-up' });
    try { localStorage.setItem(key, '1'); } catch (e) { /* ignore */ }
  } catch (e) { /* ignore */ }
}

/* ── Events ── */
function onClick(e) {
  const t = e.target.closest('[data-tab],[data-go],[data-action],[data-set-vehicle],[data-edit-vehicle],[data-del-vehicle],[data-del-service],[data-del-fuel],[data-del-doc],[data-view-doc],[data-close-modal]');
  if (!t) return;

  if (t.hasAttribute('data-close-modal')) {
    closeModal();
    return;
  }
  if (t.hasAttribute('data-tab')) {
    go(t.getAttribute('data-tab'));
    return;
  }
  if (t.hasAttribute('data-go')) {
    go(t.getAttribute('data-go'));
    return;
  }
  if (t.hasAttribute('data-set-vehicle')) {
    S.setActiveVehicle(t.getAttribute('data-set-vehicle'));
    go(currentTab);
    return;
  }
  if (t.hasAttribute('data-edit-vehicle')) {
    const v = S.d.vehicles.find((x) => x.id === t.getAttribute('data-edit-vehicle'));
    if (v) modalVehicle(v);
    return;
  }
  if (t.hasAttribute('data-view-doc')) {
    const doc = S.d.docs.find((x) => x.id === t.getAttribute('data-view-doc'));
    if (doc) modalDoc(doc);
    return;
  }
  if (t.hasAttribute('data-del-vehicle')) {
    confirmAction({
      title: 'Delete this vehicle?',
      body: 'This removes its service, fuel, and docs. This can’t be undone.',
      confirmLabel: 'Delete vehicle',
      destructive: true
    }).then((ok) => {
      if (!ok) return;
      S.deleteVehicle(t.getAttribute('data-del-vehicle'));
      toast('Vehicle deleted');
      go('garage');
    });
    return;
  }
  if (t.hasAttribute('data-del-service')) {
    S.deleteService(t.getAttribute('data-del-service'));
    toast('Service removed');
    go('service');
    return;
  }
  if (t.hasAttribute('data-del-fuel')) {
    S.deleteFuel(t.getAttribute('data-del-fuel'));
    toast('Fuel entry removed');
    go('fuel');
    return;
  }
  if (t.hasAttribute('data-del-doc')) {
    confirmAction({
      title: 'Delete this document?',
      body: 'Notes and any photo for this document will be removed. This can’t be undone.',
      confirmLabel: 'Delete document',
      destructive: true
    }).then((ok) => {
      if (!ok) return;
      S.deleteDoc(t.getAttribute('data-del-doc'));
      toast('Document removed');
      go('docs');
    });
    return;
  }

  const action = t.getAttribute('data-action');
  if (action === 'theme-light' || action === 'theme-dark') {
    const mode = action === 'theme-light' ? 'light' : 'dark';
    try { localStorage.setItem('carcap-theme', mode); } catch (err) {}
    document.documentElement.setAttribute('data-theme', mode);
    const meta = document.getElementById('themeColorMeta') || document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'light' ? CC.h_e8e8ea : CC.h_18181a);
    go('settings');
    return;
  }
  if (action === 'notify-toggle') {
    toggleNotifications();
    return;
  }
  if (action === 'remove-photo') {
    const docId = t.getAttribute('data-doc-id');
    const doc = S.d.docs.find((x) => x.id === docId);
    if (doc && doc.photoId) {
      const pid = doc.photoId;
      S.updateDoc(docId, { photoId: null });
      Photos.del(pid).catch(() => {});
      toast('Photo removed');
      closeModal();
      go('docs');
    }
    return;
  }
  if (action === 'add-vehicle') modalVehicle(null);
  else if (action === 'first-add') {
    closeModal();
    go('garage');
    modalVehicle(null);
  }
  else if (action === 'add-service') modalService();
  else if (action === 'add-fuel') modalFuel();
  else if (action === 'add-doc') modalDoc(null);
  else if (action === 'export') exportJson();
  else if (action === 'import-pick') {
    const input = document.getElementById('import-file');
    if (input) input.click();
  }
  else if (action === 'demo') {
    (async () => {
      if (S.vehicles().length && !S.isDemo()) {
        const ok = await confirmAction({
          title: 'Load sample data?',
          body: 'This replaces your current CarCap data on this device.',
          confirmLabel: 'Load sample',
          destructive: true
        });
        if (!ok) return;
      }
      S.loadDemo();
      closeModal();
      toast('Sample data loaded');
      go('today');
    })();
  } else if (action === 'clear-demo' || action === 'reset') {
    (async () => {
      const erase = action === 'reset';
      const ok = await confirmAction({
        title: erase ? 'Erase all data?' : 'Clear sample data?',
        body: erase
          ? 'This removes everything stored on this device and can’t be undone.'
          : 'This clears the sample garage from this device.',
        confirmLabel: erase ? 'Erase all data' : 'Clear sample',
        destructive: true
      });
      if (!ok) return;
      S.reset();
      toast('Data cleared');
      go('today');
      if (!S.d.meta.onboarded) showFirstRunSheet();
    })();
  }
}

function showFirstRunSheet() {
  openModal('Welcome to CarCap',
    '<p class="first-run-copy">Service, fuel and documents for your cars. Data stays on this device — no account.</p>' +
    '<div class="btn-row" style="margin-top:4px">' +
      '<button type="button" class="btn btn-primary" data-action="first-add">Add car</button>' +
      '<button type="button" class="btn" data-action="demo">Try sample</button>' +
    '</div>',
    null,
    { noDismiss: true }
  );
}

function syncOnline() {
  document.body.classList.toggle('is-offline', !navigator.onLine);
}

function onChange(e) {
  if (e.target && e.target.id === 'import-file') importJson(e.target);
}

function markAppReady() {
  try {
    window.__APP_READY__ = true;
    document.documentElement.dataset.appReady = 'true';
  } catch (_) { /* ignore */ }
}

function dismissSplash(immediate) {
  const splash = document.getElementById('car-splash');
  if (!splash) {
    markAppReady();
    return;
  }
  if (immediate) {
    splash.remove();
    markAppReady();
    return;
  }
  splash.classList.add('hide');
  setTimeout(() => {
    splash.remove();
    markAppReady();
  }, 350);
}

function boot() {
  S.init();

  const params = new URLSearchParams(location.search);
  const forceSplash = params.get('splash') === '1';
  const firstLaunch = !localStorage.getItem('carcap-splash-seen');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // First launch only, ≤600ms; skip under reduced motion / returning users (CAR-P0-01 / FLT-07).
  if (forceSplash || (firstLaunch && !reduceMotion)) {
    try { localStorage.setItem('carcap-splash-seen', '1'); } catch (_) { /* ignore */ }
    setTimeout(() => dismissSplash(false), 500);
  } else {
    dismissSplash(true);
  }

  if (params.get('demo') === '1') {
    S.loadDemo();
  }

  let tab = params.get('tab') || 'today';
  if (TABS.indexOf(tab) < 0) tab = 'today';

  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.querySelector('#modal-backdrop, #confirm-backdrop')) {
      const confirmBackdrop = document.getElementById('confirm-backdrop');
      if (confirmBackdrop) return;
      closeModal();
    }
  });
  window.addEventListener('online', syncOnline);
  window.addEventListener('offline', syncOnline);
  syncOnline();

  go(tab);

  if (!S.d.meta.onboarded && params.get('demo') !== '1') {
    showFirstRunSheet();
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=' + SW_CACHE).catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', boot);
