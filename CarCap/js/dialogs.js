'use strict';
/* ConfirmDialog — replaces native confirm dialogs (CAR-P1-02). */
(function () {
  function mountConfirm(opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const root = document.getElementById('modal-root');
      const title = opts.title || 'Confirm';
      const body = opts.body || '';
      const confirmLabel = opts.confirmLabel || 'Confirm';
      const cancelLabel = opts.cancelLabel || 'Cancel';
      const destructive = !!opts.destructive;

      root.innerHTML =
        '<div class="modal-backdrop" id="confirm-backdrop" role="presentation">' +
          '<div class="modal-sheet confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body">' +
            '<h2 class="modal-title" id="confirm-title" tabindex="-1">' + escapeHtml(title) + '</h2>' +
            (body ? '<p class="confirm-body" id="confirm-body">' + escapeHtml(body) + '</p>' : '<p class="confirm-body" id="confirm-body" hidden></p>') +
            '<div class="btn-row confirm-actions">' +
              '<button type="button" class="btn btn-ghost" data-confirm="no">' + escapeHtml(cancelLabel) + '</button>' +
              '<button type="button" class="btn ' + (destructive ? 'btn-danger' : 'btn-primary') + '" data-confirm="yes">' + escapeHtml(confirmLabel) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      const backdrop = document.getElementById('confirm-backdrop');
      const titleEl = document.getElementById('confirm-title');
      const cancelBtn = root.querySelector('[data-confirm="no"]');

      const finish = (val) => {
        window.removeEventListener('keydown', onKey, true);
        root.innerHTML = '';
        resolve(val);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          finish(false);
        }
      };
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) finish(false);
      });
      root.querySelector('[data-confirm="no"]').addEventListener('click', () => finish(false));
      root.querySelector('[data-confirm="yes"]').addEventListener('click', () => finish(true));
      window.addEventListener('keydown', onKey, true);
      (destructive ? cancelBtn : titleEl).focus();
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.CapConfirm = function CapConfirm(opts) {
    return mountConfirm(opts);
  };
})();
