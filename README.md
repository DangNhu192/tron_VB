# AutoDoc 2.0 — Trộn văn bản Word từ bảng dữ liệu

<img src="Logo.png" alt="Logo AutoDoc" width="88">

AutoDoc là tiện ích mở rộng cho Chrome giúp tạo nhiều văn bản Word từ một mẫu
`.docx` và dữ liệu Excel, CSV, bảng Word hoặc Google Sheets. Bạn có thể kiểm tra,
chỉnh sửa và chọn dòng trong bảng xem trước trước khi xuất.

**Phiên bản extension:** `2.0` · **Nền tảng:** Chrome Extension Manifest V3 ·
**Định dạng văn bản xuất:** `.docx`

## Cài đặt nhanh

1. Tải mã nguồn từ nhánh `main` bằng **Code → Download ZIP** trên GitHub và giải nén.
2. Mở `chrome://extensions`, bật **Chế độ dành cho nhà phát triển**.
3. Bấm **Tải tiện ích đã giải nén**, chọn thư mục có `manifest.json`.
4. Mở AutoDoc từ biểu tượng extension hoặc cửa sổ cạnh bên Chrome.

Khi cập nhật mã nguồn, bấm **Tải lại** tại `chrome://extensions` và mở lại AutoDoc.

## Bắt đầu trong vài bước

1. Chuẩn bị mẫu Word `.docx` với biến dạng `{{HoTen}}`, `{{DiaChi}}`.
2. Chuẩn bị bảng có các cột tên chính xác là `HoTen`, `DiaChi`; mỗi dòng là một
   văn bản cần tạo.
3. Trong **Tạo văn bản**, chọn mẫu từ thư viện hoặc tải lên, rồi chọn file dữ
   liệu hoặc nguồn đã lưu.
4. Bấm **Xem trước dữ liệu** để kiểm tra giá trị, sửa ô, chọn dòng cần xuất.
5. Chọn kiểu xuất và bấm **Xuất các dòng đã chọn**.

Ví dụ: mẫu ghi `Kính gửi: {{HoTen}}` và một dòng dữ liệu có `HoTen = Nguyễn Văn A`
sẽ tạo văn bản ghi `Kính gửi: Nguyễn Văn A`.

## Tính năng

### Mẫu Word và dữ liệu trộn

- Nhận mẫu `.docx` từ máy hoặc thư viện; quét biến `{{...}}` trong phần thân,
  đầu trang và chân trang để lập danh sách trường cần điền.
- Kiểm tra cú pháp biến và so sánh trường trong mẫu với cột dữ liệu trước khi
  xuất; cho phép xem cảnh báo về cột thiếu, ô trống hoặc tên file trùng.
- Từ mẫu Word, tạo bảng dữ liệu mẫu `.xlsx`, mẫu bảng `.docx` hoặc bộ cột để
  điền vào Google Sheets. Có thể thêm cột `STT` và `Check DL` cho bảng mẫu.
- Tùy chọn chuẩn hóa font trong mẫu Word về Times New Roman. Dữ liệu tiếng Việt
  Unicode của Excel được giữ nguyên khi nhập; trước khi ghi vào Word, chuỗi được
  chuẩn hóa Unicode NFC.

### Nguồn dữ liệu

- Đọc file `.xlsx`, `.xls`, `.csv` và bảng trong `.docx` từ máy; với bảng tính
  nhiều trang, có thể chọn trang cần dùng.
- Lưu nguồn dữ liệu để dùng lại: file máy tính, liên kết Excel/Word và Google
  Sheets. File máy tính được đọc lại khi dùng nguồn đã lưu nếu trình duyệt còn
  quyền truy cập file.
- Google Sheets lưu liên kết và tên trang tính, rồi đọc dữ liệu mới mỗi lần mở
  bảng xem trước. Nút **Cập nhật Google Sheets** đọc lại theo yêu cầu và hiển
  thị thời điểm đọc thành công. Đây là cập nhật khi thao tác, không phải đồng bộ
  liên tục trong nền.
- Với Google Sheets, dòng trống bị bỏ qua. Nếu có cột `Check`, chỉ lấy dòng
  `True`; nếu không có `Check` nhưng có `Check DL`, chỉ lấy dòng `Check DL = True`.
  Nếu cả hai cùng có, `Check` được ưu tiên. Dòng chỉ có `STT` hoặc dấu chọn
  mà không có nội dung cũng bị bỏ qua.
- Link Sheet công khai và Sheet riêng tư có quyền truy cập trên phiên Chrome
  hiện tại đều có đường đọc hỗ trợ. Với Sheet riêng tư, hãy mở đúng Sheet bằng
  tài khoản có quyền trong cùng hồ sơ Chrome. Xem [hướng dẫn Google Sheets](docs/google-sheets.md).

### Bảng xem trước và xuất văn bản

- Tìm kiếm, sửa ô, thêm/xóa dòng, dán vùng ô từ Excel/Sheets và chọn những dòng
  sẽ xuất. Có thể xuất thử riêng một dòng.
- Xuất dữ liệu đang xem thành `.xlsx` hoặc **Lưu bản sao dữ liệu** vào thư viện.
  Việc xuất Word không tự ghi đè file dữ liệu gốc.
- Nếu đã sửa bảng xem trước của Google Sheets, cần lưu bản sao trước khi bấm
  cập nhật; cập nhật thất bại sẽ giữ nguyên bảng đang xem.
- Tạo một file Word gộp nhiều văn bản, tải từng file Word hoặc đóng gói các file
  trong `.zip`. Quá trình tạo chạy trong Web Worker và có trạng thái tiến độ.
- Đặt tên file bằng tên cột, ví dụ `[SoVanBan]_[HoTen]`; tùy chọn thêm số thứ tự
  và bỏ dấu tiếng Việt trong tên file. Có thể đặt cách biến đổi giá trị theo
  trường trước khi trộn.

### Thư viện và giao diện

- Quản lý mẫu theo danh mục, tìm kiếm mẫu, quản lý nguồn dữ liệu và lịch sử xuất.
- Sao lưu/phục hồi thư viện bằng file `.json` trong phần **Cài đặt**.
- Dùng trong trang ứng dụng đầy đủ hoặc Side Panel; giao diện hỗ trợ chế độ
  sáng/tối và kích thước cửa sổ hẹp.

## Những điều cần biết

- AutoDoc hiện **chỉ xuất văn bản Word `.docx`**. Nếu cần PDF, hãy chuyển file
  Word bằng ứng dụng hỗ trợ PDF sau khi xuất.
- Tên cột dữ liệu nên khớp chính xác với tên biến trong mẫu. Với Google Sheets,
  cột `Check` hoặc `Check DL` chọn dòng bằng giá trị `True` (không phân biệt
  hoa/thường); các nguồn khác hiện có bộ lọc `Check DL`.
- Tùy chọn Times New Roman tác động lên mẫu Word. Tên font trong Excel không
  được dùng để tự đoán hoặc tự đổi bảng mã dữ liệu đã là Unicode.
- Sao lưu `.json` có thể chứa mẫu, nguồn và dữ liệu đã lưu trong thư viện; hãy
  quản lý file sao lưu phù hợp với mức độ nhạy cảm của dữ liệu.

## Tài liệu và kiểm thử

- [Hướng dẫn sử dụng](HUONG_DAN_SU_DUNG.md)
- [Kết nối Google Sheets](docs/google-sheets.md)
- [Thiết kế giao diện](DESIGN.md)

Máy phát triển cần Node.js để chạy bộ kiểm thử:

```powershell
node tools/run_all_tests.mjs
node tools/test_ui_workflow.mjs
```

Trên máy Windows đã cấu hình Git, chạy `deploy_github.bat` từ thư mục extension
để kiểm thử, commit và đẩy nhánh `main` lên repository này. Script kiểm tra
version `2.0` và không dùng `push --force`.
