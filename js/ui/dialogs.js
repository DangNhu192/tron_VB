'use strict';

export function setupDialogAccessibility(root = document) {
  const modals = Array.from(root.querySelectorAll('.modal, .modal-overlay'));
  const previousFocus = new WeakMap();
  let lastOutsideFocus = document.activeElement;
  root.addEventListener('focusin', event => {
    if (!event.target.closest('.modal, .modal-overlay')) lastOutsideFocus = event.target;
  });
  const openDialogs = () => modals.filter(modal => modal.classList.contains('is-open'));
  const focusable = modal => Array.from(modal.querySelectorAll(
    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'
  )).filter(el => el.getClientRects().length > 0 && el.tabIndex >= 0);
  modals.forEach((modal, index) => {
    const dialog = modal.querySelector('.modal-dialog') || modal;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.tabIndex = -1;
    const title = dialog.querySelector('.modal-title');
    if (title) {
      if (!title.id) title.id = `dialog-title-${index}`;
      dialog.setAttribute('aria-labelledby', title.id);
    }
    let wasOpen = false;
    new MutationObserver(() => {
      const isOpen = modal.classList.contains('is-open');
      if (isOpen === wasOpen) return;
      wasOpen = isOpen;
      if (isOpen) {
        const active = document.activeElement;
        previousFocus.set(modal, active === document.body ? lastOutsideFocus : active);
        (focusable(modal)[0] || dialog).focus({ preventScroll: true });
      } else {
        const previous = previousFocus.get(modal);
        const target = previous?.isConnected && !previous.disabled
          ? previous : root.querySelector('#mainNavTabs .nav-tab.active');
        target?.focus({ preventScroll: true });
      }
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  });
  root.addEventListener('keydown', event => {
    const modal = openDialogs().at(-1);
    if (!modal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      const close = modal.querySelector('.close-modal');
      if (close) close.click();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable(modal);
    if (!items.length) { event.preventDefault(); return; }
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  });
}
