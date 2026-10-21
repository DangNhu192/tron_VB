'use strict';
import { showToast } from './toast.js';

const initialized = new WeakSet();

export function setupFileDropzones(root = document) {
  root.querySelectorAll('.file-drop').forEach(zone => {
    const input = zone.querySelector('input[type="file"]');
    if (!input || initialized.has(zone)) return;
    initialized.add(zone);
    zone.tabIndex = 0;
    zone.setAttribute('role', 'button');
    zone.setAttribute('aria-label', zone.querySelector('.fd-hint')?.textContent.trim() || 'Chọn file');
    input.tabIndex = -1;
    zone.addEventListener('click', event => {
      if (event.target !== input) input.click();
    });
    zone.addEventListener('keydown', event => {
      if (event.target === zone && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        input.click();
      }
    });
    zone.addEventListener('dragover', event => {
      event.preventDefault();
      zone.classList.add('is-dragging');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-dragging'));
    zone.addEventListener('drop', event => {
      event.preventDefault();
      zone.classList.remove('is-dragging');
      const files = event.dataTransfer?.files;
      if (!files?.length) return;
      if (!input.multiple && files.length > 1) {
        showToast('Vui lòng chọn một file cho mỗi nguồn dữ liệu.', 'warning');
        return;
      }
      input.files = files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}
