'use strict';

window.APP_VERSION = '0.2.0';

const TABS = ['today', 'garage', 'service', 'fuel', 'docs', 'settings'];
let currentTab = 'today';
let toastTimer = null;
const SW_CACHE = 'carcap-v3';

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

function toast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2200);
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
      '<div class="modal-sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
        '<div class="modal-title">' + esc(title) + '</div>' +
        bodyHtml +
      '</div>' +
    '</div>';
  const backdrop = document.getElementById('modal-backdrop');
  if (dismissible) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }
  if (typeof onMount === 'function') onMount();
}

/* ── Header ── */
function updateHeader() {
  const v = S.activeVehicle();
  const sub = document.getElementById('header-sub');
  const pill = document.getElementById('header-pill');
  sub.textContent = v ? S.vehicleLabel(v) : 'Add a vehicle to start';
  if (S.isDemo()) {
    pill.hidden = false;
    pill.textContent = 'Demo';
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

/* ── Screens ── */
function renderToday() {
  const v = S.activeVehicle();
  if (!v) {
    return (
      '<div class="screen">' +
        '<h1 class="page-title">Today</h1>' +
        '<p class="page-sub">Your car command center.</p>' +
        '<div class="empty">' +
          '<strong>No vehicles yet</strong>' +
          'Add a car in Garage, or load demo data from Settings.' +
          '<div class="btn-row" style="justify-content:center">' +
            '<button type="button" class="btn btn-primary" data-go="garage">Open Garage</button>' +
            '<button type="button" class="btn" data-action="demo">Try demo</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  const odo = S.latestOdometer(v.id);
  const fuel = S.fuelStats(v.id);
  const reminders = S.upcomingReminders(60).filter((r) => r.service.vehicleId === v.id);
  const docs = S.expiringDocs(60).filter((r) => r.doc.vehicleId === v.id);
  const overdue = reminders.filter((r) => r.overdue).length + docs.filter((r) => r.overdue).length;

  let alerts = '';
  if (!reminders.length && !docs.length) {
    alerts = '<div class="card"><div class="card-title">All clear</div><div class="card-meta">No reminders in the next 60 days.</div></div>';
  } else {
    alerts = reminders.map((r) =>
      '<div class="card">' +
        '<div class="card-row">' +
          '<div>' +
            '<div class="card-title">' + esc(r.service.type) + '</div>' +
            '<div class="card-meta">Service reminder · ' + fmtDate(r.service.reminderDate) + '</div>' +
          '</div>' +
          '<span class="pill ' + (r.overdue ? 'danger' : 'warn') + '">' + (r.overdue ? 'Overdue' : 'Due') + '</span>' +
        '</div>' +
      '</div>'
    ).join('') + docs.map((r) =>
      '<div class="card">' +
        '<div class="card-row">' +
          '<div>' +
            '<div class="card-title">' + esc(r.doc.title) + '</div>' +
            '<div class="card-meta">Doc expiry · ' + fmtDate(r.doc.expiry) + '</div>' +
          '</div>' +
          '<span class="pill ' + (r.overdue ? 'danger' : 'warn') + '">' + (r.overdue ? 'Expired' : 'Expiring') + '</span>' +
        '</div>' +
      '</div>'
    ).join('');
  }

  const recentFuel = S.fuelFor(v.id).slice(0, 2);
  const recentSvc = S.servicesFor(v.id).slice(0, 2);

  return (
    '<div class="screen">' +
      '<h1 class="page-title">Today</h1>' +
      '<p class="page-sub">' + esc(S.vehicleLabel(v)) + (v.plate ? ' · ' + esc(v.plate) : '') + '</p>' +
      vehiclePickerHtml(v.id) +
      '<div class="stat-grid">' +
        '<div class="stat"><div class="stat-label">Odometer</div><div class="stat-value accent">' + (odo != null ? fmtNum(odo) + ' km' : '—') + '</div></div>' +
        '<div class="stat"><div class="stat-label">Alerts</div><div class="stat-value">' + overdue + '</div></div>' +
        '<div class="stat"><div class="stat-label">Fuel fills</div><div class="stat-value">' + fuel.count + '</div></div>' +
        '<div class="stat"><div class="stat-label">Avg L/100</div><div class="stat-value">' + (fuel.avgLPer100 != null ? fmtNum(fuel.avgLPer100, 1) : '—') + '</div></div>' +
      '</div>' +
      '<div class="section-label">Reminders</div>' +
      alerts +
      '<div class="section-label">Recent</div>' +
      (recentSvc.length || recentFuel.length
        ? recentSvc.map((s) =>
            '<div class="card"><div class="card-title">' + esc(s.type) + '</div><div class="card-meta">Service · ' + fmtDate(s.date) + (s.cost != null ? ' · ' + fmtMoney(s.cost) : '') + '</div></div>'
          ).join('') +
          recentFuel.map((f) =>
            '<div class="card"><div class="card-title">Fuel ' + (f.liters != null ? fmtNum(f.liters, 1) + ' L' : '') + '</div><div class="card-meta">' + fmtDate(f.date) + (f.cost != null ? ' · ' + fmtMoney(f.cost) : '') + '</div></div>'
          ).join('')
        : '<div class="card"><div class="card-meta">No recent activity yet.</div></div>') +
      '<div class="btn-row">' +
        '<button type="button" class="btn btn-primary" data-go="fuel">Log fuel</button>' +
        '<button type="button" class="btn" data-go="service">Add service</button>' +
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
          '<div class="card">' +
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
                '<button type="button" class="btn btn-sm btn-danger" data-del-vehicle="' + esc(v.id) + '">Del</button>' +
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
      '<button type="button" class="btn btn-primary btn-block" data-action="add-vehicle">Add vehicle</button>' +
    '</div>'
  );
}

function renderService() {
  const v = S.activeVehicle();
  if (!v) {
    return '<div class="screen"><h1 class="page-title">Service</h1><div class="empty"><strong>Pick a vehicle</strong><button type="button" class="btn btn-primary" data-go="garage" style="margin-top:12px">Garage</button></div></div>';
  }
  const list = S.servicesFor(v.id);
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
            '<button type="button" class="btn btn-sm btn-danger" data-del-service="' + esc(s.id) + '">Del</button>' +
          '</div>' +
        '</div>'
      ).join('')
    : '<div class="empty"><strong>No service logged</strong>Oil changes, tires, brakes — keep a history.</div>';

  return (
    '<div class="screen">' +
      '<h1 class="page-title">Service</h1>' +
      '<p class="page-sub">' + esc(S.vehicleLabel(v)) + '</p>' +
      vehiclePickerHtml(v.id) +
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
            '<button type="button" class="btn btn-sm btn-danger" data-del-fuel="' + esc(f.id) + '">Del</button>' +
          '</div>' +
        '</div>'
      ).join('')
    : '<div class="empty"><strong>No fuel entries</strong>Log fills with odometer. Avg L/100 needs at least two full-tank fills with rising odometer.</div>';

  return (
    '<div class="screen">' +
      '<h1 class="page-title">Fuel</h1>' +
      '<p class="page-sub">' + esc(S.vehicleLabel(v)) + '</p>' +
      vehiclePickerHtml(v.id) +
      '<div class="stat-grid">' +
        '<div class="stat"><div class="stat-label">Total cost</div><div class="stat-value">' + fmtMoney(stats.totalCost) + '</div></div>' +
        '<div class="stat"><div class="stat-label">Liters</div><div class="stat-value">' + fmtNum(stats.totalLiters, 1) + '</div></div>' +
        '<div class="stat"><div class="stat-label">Odometer</div><div class="stat-value accent">' + (stats.odometer != null ? fmtNum(stats.odometer) : '—') + '</div></div>' +
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
  const cards = list.length
    ? list.map((d) =>
        '<div class="card">' +
          '<div class="card-row">' +
            '<div>' +
              '<div class="card-title">' + esc(d.title) + '</div>' +
              '<div class="card-meta">' +
                esc(typeLabel[d.type] || d.type) +
                (d.expiry ? ' · expires ' + fmtDate(d.expiry) : '') +
              '</div>' +
              (d.notes ? '<div class="card-notes">' + esc(d.notes) + '</div>' : '') +
            '</div>' +
            '<button type="button" class="btn btn-sm btn-danger" data-del-doc="' + esc(d.id) + '">Del</button>' +
          '</div>' +
        '</div>'
      ).join('')
    : '<div class="empty"><strong>Docs wallet empty</strong>Text &amp; expiry meta only — no photo uploads yet. Title, insurance, registration notes stay on this device.</div>';

  return (
    '<div class="screen">' +
      '<h1 class="page-title">Docs</h1>' +
      '<p class="page-sub">' + esc(S.vehicleLabel(v)) + ' · text wallet (no photos yet)</p>' +
      vehiclePickerHtml(v.id) +
      cards +
      '<button type="button" class="btn btn-primary btn-block" data-action="add-doc">Add document</button>' +
    '</div>'
  );
}

function renderSettings() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  return (
    '<div class="screen">' +
      '<h1 class="page-title">Settings</h1>' +
      '<p class="page-sub">CarCap v' + esc(window.APP_VERSION) + ' · offline PWA</p>' +
      '<div class="card">' +
        '<div class="card-title">Appearance</div>' +
        '<div class="card-meta">Service booklet — light paper or dark ink.</div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn' + (theme === 'light' ? ' btn-primary' : '') + '" data-action="theme-light">Light</button>' +
          '<button type="button" class="btn' + (theme !== 'light' ? ' btn-primary' : '') + '" data-action="theme-dark">Dark</button>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">Demo mode</div>' +
        '<div class="card-meta">Seeds one Toyota Corolla with sample service, fuel, and docs. Replaces current local data.</div>' +
        '<div class="btn-row">' +
          (S.isDemo()
            ? '<button type="button" class="btn btn-danger" data-action="clear-demo">Clear demo data</button>'
            : '<button type="button" class="btn btn-primary" data-action="demo">Load demo</button>') +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">Data</div>' +
        '<div class="card-meta">Everything stays in this browser (localStorage key <code>carcap_v1</code>). No account, no cloud.</div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="export">Export JSON</button>' +
          '<button type="button" class="btn" data-action="import-pick">Import JSON</button>' +
          '<button type="button" class="btn btn-danger" data-action="reset">Reset all data</button>' +
        '</div>' +
        '<input type="file" id="import-file" accept="application/json,.json" hidden>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">Install</div>' +
        '<div class="card-meta">On iPhone: Share → Add to Home Screen. On desktop: browser install icon.</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">About</div>' +
        '<div class="card-meta">CarCap by Capricorn Systems · Cap family · SW ' + esc(SW_CACHE) + '</div>' +
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
}

function showFirstRunSheet() {
  openModal('Welcome to CarCap',
    '<p class="first-run-copy">Offline garage for service, fuel, and docs. Data stays on this device — no account.</p>' +
    '<div class="btn-row" style="margin-top:4px">' +
      '<button type="button" class="btn btn-primary" data-action="first-add">Add car</button>' +
      '<button type="button" class="btn" data-action="demo">Try demo</button>' +
    '</div>',
    null,
    { noDismiss: true }
  );
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
    toast('Export failed');
  }
}

function importJson(input) {
  const file = input && input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || ''));
      if (!confirm('Import this backup? It replaces all CarCap data on this device.')) {
        input.value = '';
        return;
      }
      S.importBlob(data);
      toast('Backup imported');
      closeModal();
      go(currentTab);
    } catch (err) {
      toast(err && err.message ? err.message : 'Invalid backup file');
    }
    input.value = '';
  };
  reader.onerror = () => {
    toast('Could not read file');
    input.value = '';
  };
  reader.readAsText(file);
}

/* ── Forms / modals ── */
function modalVehicle(existing) {
  const v = existing || {};
  openModal(existing ? 'Edit vehicle' : 'Add vehicle',
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
        '<button type="submit" class="btn btn-primary">' + (existing ? 'Save' : 'Add') + '</button>' +
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
          toast('Make and model required');
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
        '<button type="submit" class="btn btn-primary">Save</button>' +
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

function modalDoc() {
  const v = S.activeVehicle();
  if (!v) return;
  openModal('Add document',
    '<form id="doc-form">' +
      '<div class="form-group"><label class="form-label" for="d-title">Title</label><input class="form-input" id="d-title" required placeholder="Insurance policy"></div>' +
      '<div class="form-grid-2">' +
        '<div class="form-group"><label class="form-label" for="d-type">Type</label>' +
          '<select class="form-select" id="d-type">' +
            '<option value="title">Title</option>' +
            '<option value="insurance" selected>Insurance</option>' +
            '<option value="registration">Registration</option>' +
            '<option value="other">Other</option>' +
          '</select></div>' +
        '<div class="form-group"><label class="form-label" for="d-expiry">Expiry</label><input class="form-input" id="d-expiry" type="date"></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label" for="d-notes">Notes</label><textarea class="form-textarea" id="d-notes" placeholder="Policy number, insurer, etc."></textarea></div>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Save</button>' +
      '</div>' +
    '</form>',
    () => {
      document.getElementById('doc-form').addEventListener('submit', (e) => {
        e.preventDefault();
        S.addDoc({
          vehicleId: v.id,
          title: document.getElementById('d-title').value,
          type: document.getElementById('d-type').value,
          expiry: document.getElementById('d-expiry').value || null,
          notes: document.getElementById('d-notes').value
        });
        closeModal();
        toast('Document saved');
        go('docs');
      });
    }
  );
}

/* ── Events ── */
function onClick(e) {
  const t = e.target.closest('[data-tab],[data-go],[data-action],[data-set-vehicle],[data-edit-vehicle],[data-del-vehicle],[data-del-service],[data-del-fuel],[data-del-doc],[data-close-modal]');
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
  if (t.hasAttribute('data-del-vehicle')) {
    if (confirm('Delete this vehicle and its service, fuel, and docs?')) {
      S.deleteVehicle(t.getAttribute('data-del-vehicle'));
      toast('Vehicle deleted');
      go('garage');
    }
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
    S.deleteDoc(t.getAttribute('data-del-doc'));
    toast('Document removed');
    go('docs');
    return;
  }

  const action = t.getAttribute('data-action');
  if (action === 'theme-light' || action === 'theme-dark') {
    const mode = action === 'theme-light' ? 'light' : 'dark';
    try { localStorage.setItem('carcap-theme', mode); } catch (e) {}
    document.documentElement.setAttribute('data-theme', mode);
    const meta = document.getElementById('themeColorMeta') || document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'light' ? '#f4f0e8' : '#0c0b09');
    go('settings');
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
  else if (action === 'add-doc') modalDoc();
  else if (action === 'export') exportJson();
  else if (action === 'import-pick') {
    const input = document.getElementById('import-file');
    if (input) input.click();
  }
  else if (action === 'demo') {
    if (S.vehicles().length && !S.isDemo()) {
      if (!confirm('Load demo? This replaces your current CarCap data on this device.')) return;
    }
    S.loadDemo();
    closeModal();
    toast('Demo loaded');
    go('today');
  } else if (action === 'clear-demo' || action === 'reset') {
    const msg = action === 'clear-demo' ? 'Clear demo data?' : 'Reset all CarCap data on this device?';
    if (!confirm(msg)) return;
    S.reset();
    toast('Data cleared');
    go('today');
    if (!S.d.meta.onboarded) showFirstRunSheet();
  }
}

function syncOnline() {
  document.body.classList.toggle('is-offline', !navigator.onLine);
}

function onChange(e) {
  if (e.target && e.target.id === 'import-file') importJson(e.target);
}

function boot() {
  S.init();
  setTimeout(() => {
    const splash = document.getElementById('car-splash');
    if (splash) {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 500);
    }
  }, 1200);

  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') {
    S.loadDemo();
  }

  let tab = params.get('tab') || 'today';
  if (TABS.indexOf(tab) < 0) tab = 'today';

  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
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
