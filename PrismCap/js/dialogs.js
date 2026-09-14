'use strict';/* ConfirmDialog / PromptDialog — PRSM-P1-05 */
(function () {
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureRoot() {
    var root = document.getElementById('cap-dialog-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'cap-dialog-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function mountConfirm(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var root = ensureRoot();
      var title = opts.title || 'Confirm';
      var body = opts.body || '';
      var confirmLabel = opts.confirmLabel || 'Confirm';
      var cancelLabel = opts.cancelLabel || 'Cancel';
      var destructive = !!opts.destructive;
      root.innerHTML =
        '<div class="cap-dialog-backdrop" id="cap-confirm-backdrop" role="presentation">' +
          '<div class="cap-dialog-sheet" role="alertdialog" aria-modal="true" aria-labelledby="cap-confirm-title" aria-describedby="cap-confirm-body">' +
            '<h2 class="cap-dialog-title" id="cap-confirm-title" tabindex="-1">' + escapeHtml(title) + '</h2>' +
            (body
              ? '<p class="cap-dialog-body" id="cap-confirm-body">' + escapeHtml(body) + '</p>'
              : '<p class="cap-dialog-body" id="cap-confirm-body" hidden></p>') +
            '<div class="cap-dialog-actions">' +
              '<button type="button" class="btn bg" data-confirm="no">' + escapeHtml(cancelLabel) + '</button>' +
              '<button type="button" class="btn ' + (destructive ? 'br' : 'bw') + '" data-confirm="yes">' + escapeHtml(confirmLabel) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      var backdrop = document.getElementById('cap-confirm-backdrop');
      var titleEl = document.getElementById('cap-confirm-title');
      var cancelBtn = root.querySelector('[data-confirm="no"]');
      var finish = function (val) {
        window.removeEventListener('keydown', onKey, true);
        root.innerHTML = '';
        resolve(val);
      };
      var onKey = function (e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          finish(false);
        }
      };
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) finish(false);
      });
      root.querySelector('[data-confirm="no"]').addEventListener('click', function () { finish(false); });
      root.querySelector('[data-confirm="yes"]').addEventListener('click', function () { finish(true); });
      window.addEventListener('keydown', onKey, true);
      (destructive ? cancelBtn : titleEl).focus();
    });
  }

  function mountPrompt(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var root = ensureRoot();
      var title = opts.title || 'Enter a value';
      var body = opts.body || '';
      var placeholder = opts.placeholder || '';
      var confirmLabel = opts.confirmLabel || 'Save';
      var cancelLabel = opts.cancelLabel || 'Cancel';
      var defaultValue = opts.defaultValue || '';
      root.innerHTML =
        '<div class="cap-dialog-backdrop" id="cap-prompt-backdrop" role="presentation">' +
          '<div class="cap-dialog-sheet" role="dialog" aria-modal="true" aria-labelledby="cap-prompt-title">' +
            '<h2 class="cap-dialog-title" id="cap-prompt-title">' + escapeHtml(title) + '</h2>' +
            (body ? '<p class="cap-dialog-body">' + escapeHtml(body) + '</p>' : '') +
            '<input id="cap-prompt-input" class="cap-dialog-input" type="text" placeholder="' + escapeHtml(placeholder) + '" value="' + escapeHtml(defaultValue) + '" autocomplete="off" autocorrect="off">' +
            '<div class="cap-dialog-actions">' +
              '<button type="button" class="btn bg" data-prompt="no">' + escapeHtml(cancelLabel) + '</button>' +
              '<button type="button" class="btn bw" data-prompt="yes">' + escapeHtml(confirmLabel) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      var input = document.getElementById('cap-prompt-input');
      var backdrop = document.getElementById('cap-prompt-backdrop');
      var finish = function (val) {
        window.removeEventListener('keydown', onKey, true);
        root.innerHTML = '';
        resolve(val);
      };
      var onKey = function (e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          finish(null);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          finish((input.value || '').trim() || null);
        }
      };
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) finish(null);
      });
      root.querySelector('[data-prompt="no"]').addEventListener('click', function () { finish(null); });
      root.querySelector('[data-prompt="yes"]').addEventListener('click', function () {
        finish((input.value || '').trim() || null);
      });
      window.addEventListener('keydown', onKey, true);
      setTimeout(function () { input.focus(); input.select(); }, 30);
    });
  }

  window.CapConfirm = function CapConfirm(opts) {
    return mountConfirm(opts);
  };
  window.CapPrompt = function CapPrompt(opts) {
    return mountPrompt(opts);
  };
})();
