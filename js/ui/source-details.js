'use strict';

export function getSourceDetails(item, kind) {
  if (kind === 'template') {
    return {
      name: item.name,
      type: 'Mẫu Word',
      fileName: item.fileName || item.name,
      location: 'Bản sao lưu trong thư viện AutoDoc của trình duyệt (Chrome Storage).',
      url: item.sourceUrl || '',
      note: item.sourceUrl ? '' : 'Không có liên kết nguồn được lưu. Trình duyệt không cung cấp đường dẫn gốc của file đã tải lên.'
    };
  }
  if (item.type === 'google_sheets' || item.type === 'excel_link') {
    return {
      name: item.name,
      type: item.type === 'google_sheets' ? 'Google Sheets' : 'Liên kết Excel / Word',
      fileName: item.fileName || '',
      location: 'Nguồn trực tuyến; dữ liệu được đọc từ liên kết đã lưu.',
      url: item.link || '',
      sheetName: item.sheetName || '',
      note: item.link ? '' : 'Không tìm thấy liên kết đã lưu cho nguồn này.'
    };
  }
  if (item.type === 'local_file') {
    return {
      name: item.name,
      type: 'File trên máy tính',
      fileName: item.fileName || item.name,
      location: 'Quyền truy cập file hoặc bản sao dự phòng được lưu trong IndexedDB của trình duyệt.',
      url: '',
      sheetName: item.sheetName || '',
      note: 'Chrome chỉ cung cấp tên file, không cung cấp đường dẫn thư mục đầy đủ cho extension. Nếu file bị di chuyển hoặc mất quyền truy cập, hãy chọn lại file.'
    };
  }
  return {
    name: item.name,
    type: 'Dữ liệu đã lưu',
    fileName: item.fileName || '',
    location: 'Bản dữ liệu lưu trong thư viện AutoDoc của trình duyệt (Chrome Storage).',
    url: '',
    note: 'Nguồn cũ không lưu đường dẫn file gốc.'
  };
}

export function getSafeSourceUrl(raw) {
  try {
    const url = new URL(raw);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export function setupSourceDetails() {
  const modal = document.createElement('div');
  modal.id = 'sourceDetailsModal';
  modal.className = 'modal modal-overlay';
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Thông tin nguồn đã nạp</h3>
        <button type="button" class="close-modal" aria-label="Đóng thông tin nguồn">&times;</button>
      </div>
      <div class="modal-body source-details-body"></div>
      <div class="modal-footer"><button type="button" class="btn btn-secondary source-details-close">Đóng</button></div>
    </div>`;
  document.body.append(modal);
  modal.querySelectorAll('.close-modal, .source-details-close').forEach(button => {
    button.addEventListener('click', () => modal.classList.remove('is-open'));
  });
  return (item, kind) => {
    const details = getSourceDetails(item, kind);
    const body = modal.querySelector('.source-details-body');
    body.replaceChildren();
    const addField = (label, value) => {
      if (!value) return;
      const row = document.createElement('div');
      row.className = 'source-details-row';
      const heading = document.createElement('strong');
      heading.textContent = label;
      const content = document.createElement('span');
      content.textContent = value;
      row.append(heading, content);
      body.append(row);
    };
    addField('Tên trong thư viện', details.name);
    addField('Loại nguồn', details.type);
    addField('Tên file', details.fileName);
    addField('Sheet', details.sheetName);
    addField('Nơi lưu / cách truy cập', details.location);
    if (details.url) {
      const row = document.createElement('div');
      row.className = 'source-details-row';
      const heading = document.createElement('strong');
      heading.textContent = 'Liên kết nguồn';
      const url = getSafeSourceUrl(details.url);
      const value = document.createElement(url ? 'a' : 'span');
      value.textContent = details.url;
      if (url) {
        value.href = url;
        value.target = '_blank';
        value.rel = 'noopener noreferrer';
      }
      row.append(heading, value);
      body.append(row);
    }
    addField('Lưu ý', details.note);
    modal.classList.add('is-open');
  };
}
