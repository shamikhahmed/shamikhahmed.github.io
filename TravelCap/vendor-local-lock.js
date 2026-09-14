/*! Capricorn local-lock — framework-free WebCrypto app lock (G-10).
 * Spec: docs/audit-2026-09-14/DECISIONS.md §G-10
 * - PBKDF2-SHA-256 ≥ 600_000 · 16-byte salt · AES-256-GCM data key
 * - Escalating delay after 10 wrong attempts (never auto-erase)
 * - Optional platform WebAuthn convenience unlock (same-origin)
 * UMD: window.CapLocalLock / module.exports / export
 */
(function (root, factory) {
  var api = factory();
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = api;
  } else if (typeof define === 'function' && define.amd) {
    define(function () { return api; });
  }
  if (root) root.CapLocalLock = api;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function () {
  'use strict';

  var PBKDF2_ITERS = 600000;
  var SALT_LEN = 16;
  var IV_LEN = 12;
  var KEY_BITS = 256;
  /* Index = failedAttempts after this failure. First 10 free; then escalate. */
  var DELAY_MS = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    30000, 60000, 300000, 900000, 1800000, 3600000
  ];
  var AUTO_LOCK_OPTIONS = [1, 5, 15, 0]; /* 0 = never */

  function te() { return new TextEncoder(); }
  function td() { return new TextDecoder(); }

  function bytesToB64(bytes) {
    var u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    var bin = '';
    var chunk = 0x8000;
    for (var i = 0; i < u8.length; i += chunk) {
      bin += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  function b64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function available() {
    return !!(typeof crypto !== 'undefined' && crypto.subtle && crypto.getRandomValues);
  }

  function delayForAttempt(failedAttempts) {
    var n = Math.max(0, failedAttempts | 0);
    if (n >= DELAY_MS.length) return DELAY_MS[DELAY_MS.length - 1];
    return DELAY_MS[n];
  }

  function remainingLockMs(meta, now) {
    var until = (meta && meta.lockUntil) || 0;
    var t = typeof now === 'number' ? now : Date.now();
    return Math.max(0, until - t);
  }

  async function deriveWrapKey(passcode, salt, iterations) {
    var material = await crypto.subtle.importKey(
      'raw', te().encode(String(passcode)), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: iterations || PBKDF2_ITERS, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: KEY_BITS },
      false,
      ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
    );
  }

  async function generateDataKey() {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: KEY_BITS },
      true,
      ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
  }

  async function wrapDataKey(wrapKey, dataKey) {
    var iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
    var wrapped = await crypto.subtle.wrapKey('raw', dataKey, wrapKey, { name: 'AES-GCM', iv: iv });
    return { iv: iv, wrapped: new Uint8Array(wrapped) };
  }

  async function unwrapDataKey(wrapKey, wrappedBytes, iv) {
    return crypto.subtle.unwrapKey(
      'raw',
      wrappedBytes,
      wrapKey,
      { name: 'AES-GCM', iv: iv },
      { name: 'AES-GCM', length: KEY_BITS },
      true,
      ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
  }

  async function encryptJson(dataKey, value) {
    var iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
    var pt = te().encode(JSON.stringify(value));
    var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, dataKey, pt);
    return { iv: bytesToB64(iv), ciphertext: bytesToB64(ct) };
  }

  async function decryptJson(dataKey, sealed) {
    var iv = b64ToBytes(sealed.iv);
    var ct = b64ToBytes(sealed.ciphertext);
    var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, dataKey, ct);
    return JSON.parse(td().decode(pt));
  }

  function blankMeta() {
    return {
      schema: 1,
      enabled: false,
      salt: null,
      wrapIv: null,
      wrappedKey: null,
      iterations: PBKDF2_ITERS,
      failedAttempts: 0,
      lockUntil: 0,
      autoLockMinutes: 5,
      webauthnCredentialId: null,
      bioWrapIv: null,
      bioWrappedKey: null
    };
  }

  function normalizeMeta(raw) {
    var m = Object.assign(blankMeta(), raw || {});
    m.enabled = !!m.enabled;
    m.iterations = Math.max(PBKDF2_ITERS, Number(m.iterations) || PBKDF2_ITERS);
    m.failedAttempts = Math.max(0, Math.floor(Number(m.failedAttempts) || 0));
    m.lockUntil = Math.max(0, Number(m.lockUntil) || 0);
    if (AUTO_LOCK_OPTIONS.indexOf(m.autoLockMinutes) === -1) m.autoLockMinutes = 5;
    return m;
  }

  function assertPasscode(passcode) {
    var s = String(passcode || '');
    if (!/^\d{6,}$/.test(s)) {
      var err = new Error('Passcode must be at least 6 digits');
      err.code = 'WEAK_PASSCODE';
      throw err;
    }
    return s;
  }

  /** Create a new lock: generate data key, wrap with passcode. */
  async function enable(passcode, opts) {
    if (!available()) {
      var e = new Error('WebCrypto unavailable');
      e.code = 'NO_CRYPTO';
      throw e;
    }
    var code = assertPasscode(passcode);
    var salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
    var dataKey = await generateDataKey();
    var wrapKey = await deriveWrapKey(code, salt, PBKDF2_ITERS);
    var wrapped = await wrapDataKey(wrapKey, dataKey);
    var meta = normalizeMeta({
      enabled: true,
      salt: bytesToB64(salt),
      wrapIv: bytesToB64(wrapped.iv),
      wrappedKey: bytesToB64(wrapped.wrapped),
      iterations: PBKDF2_ITERS,
      failedAttempts: 0,
      lockUntil: 0,
      autoLockMinutes: (opts && typeof opts.autoLockMinutes === 'number') ? opts.autoLockMinutes : 5
    });
    if (AUTO_LOCK_OPTIONS.indexOf(meta.autoLockMinutes) === -1) meta.autoLockMinutes = 5;
    return { meta: meta, dataKey: dataKey };
  }

  function recordFailure(meta, now) {
    var m = normalizeMeta(meta);
    m.failedAttempts = (m.failedAttempts | 0) + 1;
    var delay = delayForAttempt(m.failedAttempts);
    var t = typeof now === 'number' ? now : Date.now();
    m.lockUntil = delay > 0 ? t + delay : 0;
    return { meta: m, delayMs: delay };
  }

  function clearFailures(meta) {
    var m = normalizeMeta(meta);
    m.failedAttempts = 0;
    m.lockUntil = 0;
    return m;
  }

  /** Unlock with passcode. On failure updates meta (caller must persist). */
  async function unlock(meta, passcode, now) {
    var m = normalizeMeta(meta);
    if (!m.enabled || !m.salt || !m.wrappedKey || !m.wrapIv) {
      var e1 = new Error('Lock not enabled');
      e1.code = 'NOT_ENABLED';
      throw e1;
    }
    var wait = remainingLockMs(m, now);
    if (wait > 0) {
      var e2 = new Error('Too many attempts — wait before trying again');
      e2.code = 'LOCKED_OUT';
      e2.delayMs = wait;
      e2.meta = m;
      throw e2;
    }
    try {
      var code = assertPasscode(passcode);
      var salt = b64ToBytes(m.salt);
      var wrapKey = await deriveWrapKey(code, salt, m.iterations);
      var dataKey = await unwrapDataKey(wrapKey, b64ToBytes(m.wrappedKey), b64ToBytes(m.wrapIv));
      return { dataKey: dataKey, meta: clearFailures(m) };
    } catch (err) {
      if (err && err.code === 'WEAK_PASSCODE') throw err;
      if (err && err.code === 'LOCKED_OUT') throw err;
      var fail = recordFailure(m, now);
      var e3 = new Error('Wrong passcode');
      e3.code = 'WRONG_PASSCODE';
      e3.delayMs = fail.delayMs;
      e3.meta = fail.meta;
      throw e3;
    }
  }

  /** Change passcode while unlocked (re-wrap data key). */
  async function changePasscode(meta, dataKey, newPasscode) {
    var code = assertPasscode(newPasscode);
    var salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
    var wrapKey = await deriveWrapKey(code, salt, PBKDF2_ITERS);
    var wrapped = await wrapDataKey(wrapKey, dataKey);
    var m = normalizeMeta(meta);
    m.salt = bytesToB64(salt);
    m.wrapIv = bytesToB64(wrapped.iv);
    m.wrappedKey = bytesToB64(wrapped.wrapped);
    m.iterations = PBKDF2_ITERS;
    m.failedAttempts = 0;
    m.lockUntil = 0;
    return m;
  }

  async function disable() {
    return blankMeta();
  }

  /** Register platform WebAuthn + store a second wrap of the data key under a bio secret in IndexedDB. */
  async function enableWebAuthn(meta, dataKey, opts) {
    if (!window.PublicKeyCredential || !navigator.credentials || !navigator.credentials.create) {
      var e = new Error('WebAuthn unavailable');
      e.code = 'NO_WEBAUTHN';
      throw e;
    }
    var rpId = (opts && opts.rpId) || (typeof location !== 'undefined' ? location.hostname : 'localhost');
    var userId = crypto.getRandomValues(new Uint8Array(16));
    var challenge = crypto.getRandomValues(new Uint8Array(32));
    var cred = await navigator.credentials.create({
      publicKey: {
        rp: { id: rpId, name: (opts && opts.rpName) || 'Cap App Lock' },
        user: {
          id: userId,
          name: (opts && opts.userName) || 'local-user',
          displayName: (opts && opts.displayName) || 'App lock'
        },
        challenge: challenge,
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000
      }
    });
    if (!cred) {
      var e2 = new Error('WebAuthn cancelled');
      e2.code = 'WEBAUTHN_CANCELLED';
      throw e2;
    }
    var credentialId = bytesToB64(new Uint8Array(cred.rawId));
    var bioSecret = crypto.getRandomValues(new Uint8Array(32));
    var bioKey = await crypto.subtle.importKey(
      'raw', bioSecret, { name: 'AES-GCM' }, false, ['wrapKey', 'unwrapKey']
    );
    var wrapped = await wrapDataKey(bioKey, dataKey);
    var m = normalizeMeta(meta);
    m.webauthnCredentialId = credentialId;
    m.bioWrapIv = bytesToB64(wrapped.iv);
    m.bioWrappedKey = bytesToB64(wrapped.wrapped);
    var storageKey = (opts && opts.bioStorageKey) || 'cap_local_lock_bio';
    try {
      await idbSet(storageKey, { credentialId: credentialId, secret: bytesToB64(bioSecret) });
    } catch (idbErr) {
      var e3 = new Error('Could not store biometric unlock material');
      e3.code = 'BIO_STORE_FAILED';
      throw e3;
    }
    return m;
  }

  async function unlockWithWebAuthn(meta, opts) {
    var m = normalizeMeta(meta);
    if (!m.webauthnCredentialId || !m.bioWrappedKey || !m.bioWrapIv) {
      var e = new Error('WebAuthn not set up');
      e.code = 'NO_WEBAUTHN';
      throw e;
    }
    var wait = remainingLockMs(m);
    if (wait > 0) {
      var e2 = new Error('Too many attempts — wait before trying again');
      e2.code = 'LOCKED_OUT';
      e2.delayMs = wait;
      e2.meta = m;
      throw e2;
    }
    var challenge = crypto.getRandomValues(new Uint8Array(32));
    var assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        allowCredentials: [{
          type: 'public-key',
          id: b64ToBytes(m.webauthnCredentialId)
        }],
        userVerification: 'required',
        timeout: 60000
      }
    });
    if (!assertion) {
      var e3 = new Error('WebAuthn cancelled');
      e3.code = 'WEBAUTHN_CANCELLED';
      throw e3;
    }
    var storageKey = (opts && opts.bioStorageKey) || 'cap_local_lock_bio';
    var stored = await idbGet(storageKey);
    if (!stored || stored.credentialId !== m.webauthnCredentialId || !stored.secret) {
      var e4 = new Error('Biometric unlock material missing');
      e4.code = 'BIO_MISSING';
      throw e4;
    }
    var bioKey = await crypto.subtle.importKey(
      'raw', b64ToBytes(stored.secret), { name: 'AES-GCM' }, false, ['wrapKey', 'unwrapKey']
    );
    var dataKey = await unwrapDataKey(bioKey, b64ToBytes(m.bioWrappedKey), b64ToBytes(m.bioWrapIv));
    return { dataKey: dataKey, meta: clearFailures(m) };
  }

  function idbOpen() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open('cap-local-lock', 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbSet(key, value) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(value, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function idbGet(key) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('kv', 'readonly');
        var req = tx.objectStore('kv').get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function idbDel(key) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').delete(key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  async function clearWebAuthn(meta, opts) {
    var m = normalizeMeta(meta);
    m.webauthnCredentialId = null;
    m.bioWrapIv = null;
    m.bioWrappedKey = null;
    try {
      await idbDel((opts && opts.bioStorageKey) || 'cap_local_lock_bio');
    } catch (e) {}
    return m;
  }

  /** Pick sensitive fields from a state object into a sealed payload. */
  function pickSensitive(state, keys) {
    var out = {};
    (keys || []).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(state, k)) out[k] = state[k];
    });
    return out;
  }

  function stripSensitive(state, keys) {
    var out = Object.assign({}, state);
    (keys || []).forEach(function (k) { delete out[k]; });
    return out;
  }

  return {
    PBKDF2_ITERS: PBKDF2_ITERS,
    AUTO_LOCK_OPTIONS: AUTO_LOCK_OPTIONS.slice(),
    available: available,
    blankMeta: blankMeta,
    normalizeMeta: normalizeMeta,
    delayForAttempt: delayForAttempt,
    remainingLockMs: remainingLockMs,
    enable: enable,
    unlock: unlock,
    changePasscode: changePasscode,
    disable: disable,
    encryptJson: encryptJson,
    decryptJson: decryptJson,
    enableWebAuthn: enableWebAuthn,
    unlockWithWebAuthn: unlockWithWebAuthn,
    clearWebAuthn: clearWebAuthn,
    pickSensitive: pickSensitive,
    stripSensitive: stripSensitive,
    assertPasscode: assertPasscode,
    bytesToB64: bytesToB64,
    b64ToBytes: b64ToBytes
  };
});
