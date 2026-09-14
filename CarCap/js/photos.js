'use strict';
/**
 * Document photos — IndexedDB blobs (CAR-P1-06).
 * G-6: meta lives on docs in localStorage; binary stays here.
 */
const Photos = {
  DB_NAME: 'carcap_photos',
  STORE: 'blobs',
  VERSION: 1,
  MAX_BYTES: 2 * 1024 * 1024,

  _db: null,

  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.STORE)) {
          db.createObjectStore(this.STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        this._db = req.result;
        resolve(this._db);
      };
      req.onerror = () => reject(req.error || new Error('Could not open photo storage'));
    });
  },

  async put(id, blob) {
    if (!id || !blob) throw new Error('Missing photo data');
    if (blob.size > this.MAX_BYTES) {
      throw new Error('Photo is too large. Choose an image under 2 MB.');
    }
    const db = await this.open();
    const record = {
      id: String(id),
      mime: blob.type || 'image/jpeg',
      size: blob.size,
      blob: blob,
      updated: new Date().toISOString()
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => reject(tx.error || new Error('Could not save photo'));
    });
  },

  async get(id) {
    if (!id) return null;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).get(String(id));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async del(id) {
    if (!id) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).delete(String(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async objectUrl(id) {
    const rec = await this.get(id);
    if (!rec || !rec.blob) return null;
    return URL.createObjectURL(rec.blob);
  },

  async clearAll() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};

window.Photos = Photos;
