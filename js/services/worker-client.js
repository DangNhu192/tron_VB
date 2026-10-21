'use strict';

/**
 * Khởi tạo Web Worker xử lý xuất văn bản ngầm
 */
export function createBatchWorker(callbacks = {}) {
  let worker;
  try {
    const workerUrl = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
      ? chrome.runtime.getURL('worker.js')
      : 'worker.js';
    worker = new Worker(workerUrl);
  } catch (err) {
    console.error('Lỗi khi khởi tạo Web Worker:', err);
    if (callbacks.onError) {
      callbacks.onError({ message: 'Không thể tạo Web Worker: ' + err.message });
    }
    return null;
  }

  worker.onmessage = (e) => {
    const data = e.data;
    if (!data || !data.type) return;

    switch (data.type) {
      case 'progress':
        if (callbacks.onProgress) callbacks.onProgress(data);
        break;
      case 'status':
        if (callbacks.onStatus) callbacks.onStatus(data);
        break;
      case 'done':
        if (callbacks.onDone) callbacks.onDone(data);
        break;
      case 'done_single':
        if (callbacks.onDoneSingle) callbacks.onDoneSingle(data);
        break;
      case 'done_merged':
        if (callbacks.onDoneMerged) callbacks.onDoneMerged(data);
        else if (callbacks.onDoneSingle) callbacks.onDoneSingle(data);
        break;
      case 'file_ready':
        if (callbacks.onFileReady) callbacks.onFileReady(data);
        break;
      case 'done_individual':
        if (callbacks.onDoneIndividual) callbacks.onDoneIndividual(data);
        break;
      case 'error':
        if (callbacks.onError) callbacks.onError(data);
        break;
      default:
        break;
    }
  };

  worker.onerror = (err) => {
    console.error('Lỗi trong Web Worker (onerror):', err);
    if (callbacks.onError) {
      const detail = err.message || (err.filename ? `Lỗi tại ${err.filename}:${err.lineno}` : 'Lỗi không xác định trong Web Worker');
      callbacks.onError({ message: detail });
    }
  };

  return worker;
}

/**
 * Gửi payload thực thi vào Worker
 */
export function executeBatchJob(worker, payload) {
  if (!worker) throw new Error("Worker chưa được khởi tạo.");
  worker.postMessage(payload);
}

/**
 * Hủy Worker
 */
export function terminateBatchWorker(worker) {
  if (worker) {
    worker.terminate();
  }
}
