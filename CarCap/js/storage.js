'use strict';

/**
 * CarCap storage — simple localStorage helper.
 * Key: carcap_v1
 */
const S = {
  _key: 'carcap_v1',
  d: null,

  _blank() {
    return {
      vehicles: [],
      activeVehicleId: null,
      services: [],
      fuel: [],
      docs: [],
      settings: { demo: false, units: 'metric' },
      meta: { onboarded: false, created: new Date().toISOString() }
    };
  },

  init() {
    try {
      const raw = localStorage.getItem(this._key);
      this.d = raw ? JSON.parse(raw) : this._blank();
    } catch (e) {
      this.d = this._blank();
    }
    if (!this.d.vehicles) this.d.vehicles = [];
    if (!this.d.services) this.d.services = [];
    if (!this.d.fuel) this.d.fuel = [];
    if (!this.d.docs) this.d.docs = [];
    if (!this.d.settings) this.d.settings = { demo: false, units: 'metric' };
    if (!this.d.meta) this.d.meta = { onboarded: false, created: new Date().toISOString() };
    return this.d;
  },

  save() {
    localStorage.setItem(this._key, JSON.stringify(this.d));
  },

  reset() {
    this.d = this._blank();
    this.save();
  },

  uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  /* ── Vehicles ── */
  vehicles() {
    return this.d.vehicles.slice().sort((a, b) => (b.created || '').localeCompare(a.created || ''));
  },

  activeVehicle() {
    const id = this.d.activeVehicleId;
    return this.d.vehicles.find((v) => v.id === id) || this.d.vehicles[0] || null;
  },

  setActiveVehicle(id) {
    this.d.activeVehicleId = id;
    this.save();
  },

  addVehicle(data) {
    const v = {
      id: this.uid('veh'),
      make: (data.make || '').trim(),
      model: (data.model || '').trim(),
      year: Number(data.year) || null,
      plate: (data.plate || '').trim().toUpperCase(),
      nickname: (data.nickname || '').trim(),
      created: new Date().toISOString()
    };
    this.d.vehicles.push(v);
    if (!this.d.activeVehicleId) this.d.activeVehicleId = v.id;
    this.d.meta.onboarded = true;
    this.save();
    return v;
  },

  updateVehicle(id, data) {
    const v = this.d.vehicles.find((x) => x.id === id);
    if (!v) return null;
    if (data.make != null) v.make = String(data.make).trim();
    if (data.model != null) v.model = String(data.model).trim();
    if (data.year != null) v.year = Number(data.year) || null;
    if (data.plate != null) v.plate = String(data.plate).trim().toUpperCase();
    if (data.nickname != null) v.nickname = String(data.nickname).trim();
    this.save();
    return v;
  },

  deleteVehicle(id) {
    this.d.vehicles = this.d.vehicles.filter((v) => v.id !== id);
    this.d.services = this.d.services.filter((s) => s.vehicleId !== id);
    this.d.fuel = this.d.fuel.filter((f) => f.vehicleId !== id);
    this.d.docs = this.d.docs.filter((d) => d.vehicleId !== id);
    if (this.d.activeVehicleId === id) {
      this.d.activeVehicleId = this.d.vehicles[0] ? this.d.vehicles[0].id : null;
    }
    this.save();
  },

  vehicleLabel(v) {
    if (!v) return 'No vehicle';
    if (v.nickname) return v.nickname;
    return [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle';
  },

  /* ── Service ── */
  servicesFor(vehicleId) {
    return this.d.services
      .filter((s) => !vehicleId || s.vehicleId === vehicleId)
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  upcomingReminders(daysAhead) {
    const ahead = daysAhead == null ? 60 : daysAhead;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + ahead);
    return this.d.services
      .filter((s) => s.reminderDate)
      .map((s) => {
        const d = new Date(s.reminderDate + 'T00:00:00');
        return { service: s, due: d, overdue: d < today };
      })
      .filter((x) => x.due <= end)
      .sort((a, b) => a.due - b.due);
  },

  addService(data) {
    const s = {
      id: this.uid('svc'),
      vehicleId: data.vehicleId,
      type: (data.type || 'Service').trim(),
      date: data.date || new Date().toISOString().slice(0, 10),
      odometer: data.odometer != null && data.odometer !== '' ? Number(data.odometer) : null,
      cost: data.cost != null && data.cost !== '' ? Number(data.cost) : null,
      notes: (data.notes || '').trim(),
      reminderDate: data.reminderDate || null,
      created: new Date().toISOString()
    };
    this.d.services.push(s);
    this.save();
    return s;
  },

  deleteService(id) {
    this.d.services = this.d.services.filter((s) => s.id !== id);
    this.save();
  },

  /* ── Fuel ── */
  fuelFor(vehicleId) {
    return this.d.fuel
      .filter((f) => !vehicleId || f.vehicleId === vehicleId)
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created || '').localeCompare(a.created || ''));
  },

  addFuel(data) {
    const f = {
      id: this.uid('fuel'),
      vehicleId: data.vehicleId,
      date: data.date || new Date().toISOString().slice(0, 10),
      odometer: data.odometer != null && data.odometer !== '' ? Number(data.odometer) : null,
      liters: data.liters != null && data.liters !== '' ? Number(data.liters) : null,
      cost: data.cost != null && data.cost !== '' ? Number(data.cost) : null,
      fullTank: !!data.fullTank,
      created: new Date().toISOString()
    };
    this.d.fuel.push(f);
    this.save();
    return f;
  },

  deleteFuel(id) {
    this.d.fuel = this.d.fuel.filter((f) => f.id !== id);
    this.save();
  },

  latestOdometer(vehicleId) {
    const fuels = this.fuelFor(vehicleId).filter((f) => f.odometer != null);
    const svcs = this.servicesFor(vehicleId).filter((s) => s.odometer != null);
    const vals = fuels.concat(svcs).map((x) => x.odometer);
    return vals.length ? Math.max.apply(null, vals) : null;
  },

  fuelStats(vehicleId) {
    const entries = this.fuelFor(vehicleId).filter((f) => f.liters != null && f.liters > 0);
    const totalLiters = entries.reduce((n, f) => n + (f.liters || 0), 0);
    const totalCost = entries.reduce((n, f) => n + (f.cost || 0), 0);
    const withOdo = this.fuelFor(vehicleId)
      .filter((f) => f.odometer != null && f.fullTank && f.liters > 0)
      .slice()
      .sort((a, b) => a.odometer - b.odometer);
    let avgLPer100 = null;
    if (withOdo.length >= 2) {
      let dist = 0;
      let liters = 0;
      for (let i = 1; i < withOdo.length; i++) {
        const d = withOdo[i].odometer - withOdo[i - 1].odometer;
        if (d > 0) {
          dist += d;
          liters += withOdo[i].liters;
        }
      }
      if (dist > 0) avgLPer100 = (liters / dist) * 100;
    }
    return { totalLiters, totalCost, count: entries.length, avgLPer100, odometer: this.latestOdometer(vehicleId) };
  },

  /* ── Docs ── */
  docsFor(vehicleId) {
    return this.d.docs
      .filter((d) => !vehicleId || d.vehicleId === vehicleId)
      .slice()
      .sort((a, b) => (b.created || '').localeCompare(a.created || ''));
  },

  addDoc(data) {
    const doc = {
      id: this.uid('doc'),
      vehicleId: data.vehicleId,
      title: (data.title || 'Document').trim(),
      type: (data.type || 'other').trim(),
      notes: (data.notes || '').trim(),
      expiry: data.expiry || null,
      created: new Date().toISOString()
    };
    this.d.docs.push(doc);
    this.save();
    return doc;
  },

  deleteDoc(id) {
    this.d.docs = this.d.docs.filter((d) => d.id !== id);
    this.save();
  },

  expiringDocs(daysAhead) {
    const ahead = daysAhead == null ? 60 : daysAhead;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + ahead);
    return this.d.docs
      .filter((d) => d.expiry)
      .map((d) => {
        const due = new Date(d.expiry + 'T00:00:00');
        return { doc: d, due, overdue: due < today };
      })
      .filter((x) => x.due <= end)
      .sort((a, b) => a.due - b.due);
  },

  /* ── Demo ── */
  isDemo() {
    return !!(this.d.settings && this.d.settings.demo);
  },

  loadDemo() {
    const today = new Date();
    const iso = (offsetDays) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().slice(0, 10);
    };
    this.d = this._blank();
    this.d.settings.demo = true;
    this.d.meta.onboarded = true;
    const veh = {
      id: 'veh_demo',
      make: 'Toyota',
      model: 'Corolla',
      year: 2019,
      plate: 'ABC-123',
      nickname: 'Daily Driver',
      created: new Date().toISOString()
    };
    this.d.vehicles = [veh];
    this.d.activeVehicleId = veh.id;
    this.d.services = [
      {
        id: 'svc_demo_1',
        vehicleId: veh.id,
        type: 'Oil change',
        date: iso(-45),
        odometer: 48200,
        cost: 85,
        notes: 'Synthetic 5W-30, cabin filter replaced',
        reminderDate: iso(45),
        created: new Date().toISOString()
      },
      {
        id: 'svc_demo_2',
        vehicleId: veh.id,
        type: 'Tire rotation',
        date: iso(-120),
        odometer: 45100,
        cost: 40,
        notes: '',
        reminderDate: iso(-5),
        created: new Date().toISOString()
      }
    ];
    this.d.fuel = [
      {
        id: 'fuel_demo_1',
        vehicleId: veh.id,
        date: iso(-3),
        odometer: 49120,
        liters: 42.5,
        cost: 68.4,
        fullTank: true,
        created: new Date().toISOString()
      },
      {
        id: 'fuel_demo_2',
        vehicleId: veh.id,
        date: iso(-18),
        odometer: 48610,
        liters: 40.1,
        cost: 62.1,
        fullTank: true,
        created: new Date().toISOString()
      },
      {
        id: 'fuel_demo_3',
        vehicleId: veh.id,
        date: iso(-32),
        odometer: 48100,
        liters: 38.8,
        cost: 59.5,
        fullTank: true,
        created: new Date().toISOString()
      }
    ];
    this.d.docs = [
      {
        id: 'doc_demo_1',
        vehicleId: veh.id,
        title: 'Insurance policy',
        type: 'insurance',
        notes: 'Policy #INS-77821 · Full coverage',
        expiry: iso(90),
        created: new Date().toISOString()
      },
      {
        id: 'doc_demo_2',
        vehicleId: veh.id,
        title: 'Vehicle title',
        type: 'title',
        notes: 'Clean title · Lien free',
        expiry: null,
        created: new Date().toISOString()
      },
      {
        id: 'doc_demo_3',
        vehicleId: veh.id,
        title: 'Registration',
        type: 'registration',
        notes: 'Annual renew',
        expiry: iso(25),
        created: new Date().toISOString()
      }
    ];
    this.save();
  },

  clearDemo() {
    this.reset();
  },

  /* ── Backup ── */
  exportBlob() {
    return JSON.parse(JSON.stringify(this.d));
  },

  importBlob(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid backup file');
    if (!Array.isArray(data.vehicles) || !Array.isArray(data.services) ||
        !Array.isArray(data.fuel) || !Array.isArray(data.docs)) {
      throw new Error('Not a CarCap backup');
    }
    this.d = {
      vehicles: data.vehicles,
      activeVehicleId: data.activeVehicleId || (data.vehicles[0] && data.vehicles[0].id) || null,
      services: data.services,
      fuel: data.fuel,
      docs: data.docs,
      settings: Object.assign({ demo: false, units: 'metric' }, data.settings || {}),
      meta: Object.assign({ onboarded: false, created: new Date().toISOString() }, data.meta || {})
    };
    if (this.d.vehicles.length) this.d.meta.onboarded = true;
    this.save();
  }
};

window.S = S;
