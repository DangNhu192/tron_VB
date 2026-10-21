'use strict';

/**
 * Quản lý File System Access API & IndexedDB lưu trữ File Handle trên máy tính
 * Giúp lưu vị trí/quyền truy cập file trên máy tính mà không làm phình bộ nhớ tiện ích (chrome.storage.local)
 */

const DB_NAME = 'AutoDocLocalDB';
const DB_VERSION = 1;
const STORE_NAME = 'file_handles';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error("Trình duyệt không hỗ trợ IndexedDB."));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

/**
 * Mở hộp thoại chọn file Excel từ hệ điều hành qua File System Access API
 */
export async function pickLocalExcelFile() {
  if (typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function') {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Dữ liệu Bảng tính Excel / CSV / Word Table (.xlsx, .docx, .csv)',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
              'text/csv': ['.csv'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
            }
          }
        ],
        multiple: false
      });
      const file = await handle.getFile();
      return { handle, file };
    } catch (err) {
      if (err.name === 'AbortError') return null; // Người dùng bấm Hủy
      throw err;
    }
  }
  return undefined; // Unsupported; null means the user cancelled.
}

/**
 * Lưu FileHandle hoặc fallback File vào IndexedDB
 */
export async function saveFileHandle(id, handle, fallbackFile = null) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item = {
      id,
      handle: handle || null,
      fallbackFile: fallbackFile || null,
      updatedAt: new Date().toISOString()
    };
    const req = store.put(item);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Lấy File object từ handle trong IndexedDB (kèm kiểm tra và yêu cầu cấp quyền nếu cần)
 */
export async function getFileFromHandle(id) {
  const db = await getDB();
  const entry = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!entry) {
    throw new Error("Không tìm thấy thông tin vị trí file trong bộ nhớ máy tính.");
  }

  // Trường hợp có FileHandle từ File System Access API
  if (entry.handle) {
    const handle = entry.handle;
    let permission = 'granted';
    if (typeof handle.queryPermission === 'function') {
      permission = await handle.queryPermission({ mode: 'read' });
      if (permission !== 'granted' && typeof handle.requestPermission === 'function') {
        permission = await handle.requestPermission({ mode: 'read' });
      }
    }
    if (permission !== 'granted') {
      throw new Error("Cần cấp quyền truy cập file trên máy tính để đọc dữ liệu mới nhất.");
    }
    return await handle.getFile();
  }

  // Trường hợp fallback file blob
  if (entry.fallbackFile) {
    return entry.fallbackFile;
  }

  throw new Error("Không thể truy cập file trên máy tính.");
}

/**
 * Xóa FileHandle khỏi IndexedDB
 */
export async function deleteFileHandle(id) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Lỗi khi xóa file handle khỏi IndexedDB:', err);
    return false;
  }
}

/**
 * Ghi dữ liệu ngược lại vào file trên máy tính qua FileHandle hoặc cập nhật IndexedDB fallback
 */
export async function writeToFileHandle(idOrHandle, bufferOrBlob) {
  let handle = idOrHandle;
  let id = null;

  if (typeof idOrHandle === 'string') {
    id = idOrHandle;
    const db = await getDB();
    const entry = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(idOrHandle);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (!entry) {
      throw new Error("Không tìm thấy thông tin file trong bộ nhớ máy tính.");
    }

    if (!entry.handle) {
      const updatedBlob = bufferOrBlob instanceof Blob ? bufferOrBlob : new Blob([bufferOrBlob]);
      await saveFileHandle(idOrHandle, null, updatedBlob);
      return { success: true, mode: 'indexeddb_fallback' };
    }

    handle = entry.handle;
  }

  if (handle && typeof handle.createWritable === 'function') {
    let permission = 'granted';
    if (typeof handle.queryPermission === 'function') {
      permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted' && typeof handle.requestPermission === 'function') {
        permission = await handle.requestPermission({ mode: 'readwrite' });
      }
    }
    if (permission !== 'granted') {
      throw new Error("Cần cấp quyền ghi vào file trên máy tính để lưu ngược dữ liệu.");
    }

    const writable = await handle.createWritable();
    await writable.write(bufferOrBlob);
    await writable.close();
    return { success: true, mode: 'native_disk' };
  }

  if (id) {
    const updatedBlob = bufferOrBlob instanceof Blob ? bufferOrBlob : new Blob([bufferOrBlob]);
    await saveFileHandle(id, null, updatedBlob);
    return { success: true, mode: 'indexeddb_fallback' };
  }

  return { success: false, mode: 'unsupported' };
}

