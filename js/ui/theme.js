'use strict';

import { safeStorage } from '../core/storage.js';
import { THEME_KEY } from '../core/constants.js';

export function applyTheme(theme) {
  const sunIcon = document.getElementById('themeIconSun');
  const moonIcon = document.getElementById('themeIconMoon');
  const label = document.getElementById('themeLabel');

  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (sunIcon) sunIcon.style.display = 'inline';
    if (moonIcon) moonIcon.style.display = 'none';
    if (label) label.textContent = 'Sáng';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (sunIcon) sunIcon.style.display = 'none';
    if (moonIcon) moonIcon.style.display = 'inline';
    if (label) label.textContent = 'Tối';
  }
}

export async function initTheme() {
  const result = await safeStorage.get(THEME_KEY);
  const theme = result[THEME_KEY] || 'light';
  applyTheme(theme);
}

export async function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  await safeStorage.set({ [THEME_KEY]: newTheme });
  return newTheme;
}
