'use strict';

import {
  TEMPLATES_KEY,
  DATA_SOURCES_KEY,
  EXPORT_HISTORY_KEY,
  CATEGORIES_KEY,
  MAX_TEMPLATES,
  MAX_DATA_SOURCES,
  MAX_STORAGE_BYTES,
  MAX_HISTORY_RECORDS,
  DEFAULT_CATEGORIES,
  formatBytes,
  bufferToBase64,
  base64ToBuffer
} from './constants.js';

export const safeStorage = {
  get(keys) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(keys, resolve);
      } else {
        const result = {};
        try {
          if (typeof localStorage !== 'undefined') {
            const keysArray = Array.isArray(keys) ? keys : [keys];
            keysArray.forEach(k => {
              const val = localStorage.getItem(k);
              if (val !== null) {
                try {
                  result[k] = JSON.parse(val);
                } catch(e) {
                  result[k] = val;
                }
              }
            });
          }
        } catch (storageErr) {
          console.warn('Storage read fallback warning:', storageErr);
        }
        resolve(result);
      }
    });
  },
  set(items) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(items, resolve);
      } else {
        try {
          if (typeof localStorage !== 'undefined') {
            for (const k in items) {
              const val = typeof items[k] === 'object' ? JSON.stringify(items[k]) : items[k];
              localStorage.setItem(k, val);
            }
          }
        } catch (storageErr) {
          console.warn('Storage write fallback warning:', storageErr);
        }
        resolve();
      }
    });
  }
};

export const DataManager = {
  async list() {
    const result = await safeStorage.get(DATA_SOURCES_KEY);
    return result[DATA_SOURCES_KEY] || {};
  },

  async save(nameOrId, payloadOrType, dataOrLink, sheetName = '') {
    const sources = await this.list();
    let id, name, type, data, link, customSheetName;

    if (typeof payloadOrType === 'object' && payloadOrType !== null) {
      id = nameOrId;
      name = payloadOrType.name;
      type = payloadOrType.type;
      data = payloadOrType.data || null;
      link = payloadOrType.link || null;
      customSheetName = payloadOrType.sheetName || '';
    } else {
      id = 'ds_' + Date.now();
      name = nameOrId;
      type = payloadOrType;
      data = type === 'local' ? dataOrLink : null;
      link = type === 'google_sheets' ? dataOrLink : null;
      customSheetName = sheetName;
    }

    if (Object.keys(sources).length >= MAX_DATA_SOURCES && !sources[id]) {
      throw new Error(`Đã đạt giới hạn ${MAX_DATA_SOURCES} nguồn dữ liệu. Xóa bớt nguồn cũ để tiếp tục.`);
    }

    sources[id] = {
      id,
      name,
      type,
      data,
      link,
      fileName: typeof payloadOrType === 'object' && payloadOrType !== null ? (payloadOrType.fileName || null) : null,
      sheetName: customSheetName,
      savedAt: new Date().toISOString()
    };

    await safeStorage.set({ [DATA_SOURCES_KEY]: sources });
    return sources[id];
  },

  async delete(id) {
    const sources = await this.list();
    delete sources[id];
    await safeStorage.set({ [DATA_SOURCES_KEY]: sources });
  }
};

export const HistoryManager = {
  async list() {
    const result = await safeStorage.get(EXPORT_HISTORY_KEY);
    return result[EXPORT_HISTORY_KEY] || [];
  },
  async save(record) {
    let history = await this.list();
    history.unshift(record);
    if (history.length > MAX_HISTORY_RECORDS) {
      history = history.slice(0, MAX_HISTORY_RECORDS);
    }
    await safeStorage.set({ [EXPORT_HISTORY_KEY]: history });
  },
  async delete(id) {
    let history = await this.list();
    history = history.filter(h => h.id !== id);
    await safeStorage.set({ [EXPORT_HISTORY_KEY]: history });
  }
};

export const CategoryManager = {
  async list() {
    const result = await safeStorage.get(CATEGORIES_KEY);
    let cats = result[CATEGORIES_KEY];
    if (!cats || !Array.isArray(cats) || cats.length === 0) {
      cats = DEFAULT_CATEGORIES;
      await safeStorage.set({ [CATEGORIES_KEY]: cats });
    }
    return cats;
  },

  async add(name) {
    if (!name || !name.trim()) throw new Error("Tên danh mục không được để trống.");
    const cats = await this.list();
    const cleanName = name.trim();
    if (cats.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Danh mục "${cleanName}" đã tồn tại.`);
    }
    const newCat = { id: 'cat_' + Date.now(), name: cleanName };
    cats.push(newCat);
    await safeStorage.set({ [CATEGORIES_KEY]: cats });
    return newCat;
  },

  async rename(id, newName) {
    if (!newName || !newName.trim()) throw new Error("Tên danh mục không được để trống.");
    const cats = await this.list();
    const cat = cats.find(c => c.id === id);
    if (!cat) throw new Error("Không tìm thấy danh mục.");
    cat.name = newName.trim();
    await safeStorage.set({ [CATEGORIES_KEY]: cats });
    return cat;
  },

  async delete(id) {
    if (id === 'khac') throw new Error("Không thể xóa danh mục mặc định 'Khác'.");
    let cats = await this.list();
    cats = cats.filter(c => c.id !== id);
    await safeStorage.set({ [CATEGORIES_KEY]: cats });

    const templates = await TemplateManager.list();
    let hasChanges = false;
    Object.values(templates).forEach(t => {
      if (t.category === id) {
        t.category = 'khac';
        hasChanges = true;
      }
    });
    if (hasChanges) {
      await safeStorage.set({ [TEMPLATES_KEY]: templates });
    }
  }
};

export const TemplateManager = {
  async list() {
    const result = await safeStorage.get(TEMPLATES_KEY);
    return result[TEMPLATES_KEY] || {};
  },

  async save(name, arrayBuffer, category = 'khac', source = {}) {
    const templates = await this.list();
    if (Object.keys(templates).length >= MAX_TEMPLATES && !templates[name]) {
      throw new Error(`Đã đạt giới hạn ${MAX_TEMPLATES} mẫu. Xóa một mẫu cũ để tiếp tục.`);
    }
    const base64 = bufferToBase64(arrayBuffer);
    templates[name] = { 
      name, 
      data: base64, 
      size: arrayBuffer.byteLength, 
      savedAt: new Date().toISOString(),
      category: category || 'khac',
      fileName: source.fileName || null,
      sourceUrl: source.sourceUrl || null,
      isFavorite: false
    };
    await safeStorage.set({ [TEMPLATES_KEY]: templates });
    return templates[name];
  },

  async toggleFavorite(name) {
    const templates = await this.list();
    if (templates[name]) {
      templates[name].isFavorite = !templates[name].isFavorite;
      await safeStorage.set({ [TEMPLATES_KEY]: templates });
      return templates[name].isFavorite;
    }
    return false;
  },

  async rename(oldName, newName) {
    const templates = await this.list();
    if (!templates[oldName]) throw new Error(`Không tìm thấy mẫu "${oldName}".`);
    
    if (!newName.toLowerCase().endsWith('.docx')) {
      newName += '.docx';
    }
    if (newName === oldName) return;
    if (templates[newName]) throw new Error(`Đã tồn tại mẫu có tên "${newName}".`);

    templates[newName] = templates[oldName];
    templates[newName].name = newName;
    delete templates[oldName];

    await safeStorage.set({ [TEMPLATES_KEY]: templates });
  },

  async getBuffer(name) {
    const templates = await this.list();
    if (!templates[name]) throw new Error(`Không tìm thấy mẫu "${name}" trong thư viện.`);
    return base64ToBuffer(templates[name].data);
  },

  async delete(name) {
    const templates = await this.list();
    delete templates[name];
    await safeStorage.set({ [TEMPLATES_KEY]: templates });
  },

  async totalSize() {
    const templates = await this.list();
    return Object.values(templates).reduce((sum, t) => sum + (t.size || 0), 0);
  }
};

export async function exportLibraryBackup() {
  const templates = await TemplateManager.list();
  const dataSources = await DataManager.list();
  const categories = await CategoryManager.list();
  const backupObj = {
    version: '2.2',
    exportedAt: new Date().toISOString(),
    templates,
    dataSources,
    categories
  };
  const jsonStr = JSON.stringify(backupObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AutoDoc_Backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importLibraryBackup(file) {
  const text = await file.text();
  const backupObj = JSON.parse(text);
  if (!backupObj || typeof backupObj !== 'object') {
    throw new Error("File sao lưu không hợp lệ.");
  }
  const { templates = {}, dataSources = {}, categories = [] } = backupObj;
  const toSave = {
    [TEMPLATES_KEY]: templates,
    [DATA_SOURCES_KEY]: dataSources
  };
  if (Array.isArray(categories) && categories.length > 0) {
    toSave[CATEGORIES_KEY] = categories;
  }
  await safeStorage.set(toSave);
}
