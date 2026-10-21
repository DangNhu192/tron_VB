'use strict';

export const TEMPLATES_KEY = 'tpl_lib_v1';
export const DATA_SOURCES_KEY = 'autodoc_data_sources_v1';
export const EXPORT_HISTORY_KEY = 'autodoc_export_history_v1';
export const CATEGORIES_KEY = 'autodoc_categories_v1';
export const THEME_KEY = 'autodoc_theme';

export const MAX_TEMPLATES = 50;
export const MAX_DATA_SOURCES = 20;
export const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_HISTORY_RECORDS = 20;

export const DEFAULT_CATEGORIES = [
  { id: 'hop_dong', name: 'Hợp đồng' },
  { id: 'bao_cao', name: 'Báo cáo' },
  { id: 'giay_phep', name: 'Giấy phép' },
  { id: 'khac', name: 'Khác' }
];

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
