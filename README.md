# AutoDoc 2.0 — Tạo văn bản Word từ bảng dữ liệu

<img src="Logo.png" alt="Logo AutoDoc" width="88">

AutoDoc giúp tạo nhiều văn bản Word từ một mẫu `.docx` và các dòng trong bảng
dữ liệu. Tiện ích đọc Excel, CSV, bảng trong file Word và Google Sheets; bạn
kiểm tra từng dòng trong bảng xem trước rồi chọn những văn bản cần xuất.

**Phiên bản:** `2.0` · **Trình duyệt:** Chrome (Manifest V3) ·
**Văn bản xuất:** `.docx`

## Cài đặt nhanh

1. Trên GitHub, chọn nhánh `main`, bấm **Code → Download ZIP** rồi giải nén.
2. Mở `chrome://extensions` và bật **Chế độ dành cho nhà phát triển**.
3. Bấm **Tải tiện ích đã giải nén** rồi chọn thư mục chứa `manifest.json`.
4. Mở AutoDoc từ biểu tượng tiện ích hoặc cửa sổ cạnh bên của Chrome.

Sau khi cập nhật mã nguồn, bấm **Tải lại** tại `chrome://extensions` rồi mở lại
AutoDoc.

## Tạo văn bản đầu tiên

1. Tạo mẫu Word `.docx` với các biến như `{{HoTen}}` và `{{DiaChi}}`.
2. Chuẩn bị bảng có cột `HoTen`, `DiaChi`. Mỗi dòng chứa dữ liệu cho một văn bản.
3. Trong mục **Tạo văn bản**, chọn mẫu và nguồn dữ liệu.
4. Bấm **Xem trước dữ liệu**, kiểm tra nội dung và chọn dòng cần xuất.
5. Chọn cách xuất rồi bấm **Xuất các dòng đã chọn**.

Ví dụ, nếu mẫu ghi `Kính gửi: {{HoTen}}` và ô `HoTen` trong một dòng là
`Nguyễn Văn A`, văn bản của dòng đó sẽ ghi `Kính gửi: Nguyễn Văn A`.

## Các tính năng chính

### Chuẩn bị mẫu Word

- Tải mẫu `.docx` từ máy hoặc chọn mẫu đã lưu. AutoDoc tìm các biến `{{...}}`
  trong thân văn bản, đầu trang và chân trang.
- Kiểm tra cú pháp biến và đối chiếu tên biến với các cột dữ liệu. Trước khi
  xuất, tiện ích có thể cảnh báo cột thiếu, ô trống hoặc tên file bị trùng.
- Tạo bảng dữ liệu mẫu `.xlsx`, bảng `.docx` hoặc bộ cột để điền vào Google
  Sheets từ các biến trong mẫu. Bảng mẫu có thể kèm `STT` và `Check DL`.
- Có tùy chọn đặt font Times New Roman cho mẫu Word trước khi trộn.

### Đọc và quản lý dữ liệu

- Nhập file `.xlsx`, `.xls`, `.csv` hoặc bảng dữ liệu trong `.docx`. Khi file
  Excel có nhiều trang tính, bạn có thể chọn trang cần đọc.
- Lưu file máy tính, liên kết Excel/Word hoặc Google Sheets vào thư viện nguồn
  để dùng lại. Nguồn file trên máy được đọc lại nếu Chrome còn quyền truy cập.
- Giữ nguyên nội dung Unicode từ Excel khi nhập. AutoDoc không dựa vào tên font
  trong Excel để tự đổi bảng mã; chuỗi được chuẩn hóa Unicode NFC khi đưa vào
  Word.

### Làm việc với Google Sheets

- Thư viện lưu liên kết và tên trang tính. Mỗi lần mở bảng xem trước, AutoDoc
  đọc lại Sheet; nút **Cập nhật Google Sheets** cho phép đọc lại ngay lúc đang
  xem và hiển thị thời điểm cập nhật thành công. Dữ liệu không tự đồng bộ liên
  tục trong nền.
- Nếu Sheet có cột `Check`, bảng xem trước chỉ nhận dòng `True`. Nếu không có
  `Check` nhưng có `Check DL`, AutoDoc lọc theo `Check DL = True`. Khi hai cột
  cùng tồn tại, `Check` được ưu tiên. Dòng không có nội dung, kể cả dòng chỉ có
  `STT` hoặc dấu chọn, sẽ không xuất hiện.
- Sheet công khai và Sheet riêng tư có quyền truy cập trong phiên Chrome đều
  có cách đọc tương ứng. Với Sheet riêng tư, hãy mở Sheet bằng tài khoản có
  quyền trong cùng hồ sơ Chrome. Xem [hướng dẫn Google Sheets](docs/google-sheets.md).

### Kiểm tra dữ liệu trước khi xuất

- Tìm kiếm, sửa ô, thêm hoặc xóa dòng, dán nhiều ô từ Excel/Sheets và đánh dấu
  những dòng cần xuất. Bạn có thể xuất thử một dòng trước khi tạo hàng loạt.
- Tải bảng đã chỉnh sửa thành `.xlsx` hoặc bấm **Lưu bản sao dữ liệu** để giữ
  trong thư viện. Xuất Word không tự ghi đè file dữ liệu gốc.
- Với Google Sheets, nếu đã sửa dữ liệu xem trước, hãy lưu bản sao trước khi
  cập nhật. Nếu lần cập nhật thất bại, bảng đang xem vẫn được giữ nguyên.

### Xuất và lưu văn bản

- Gộp nhiều văn bản vào một file `.docx`, tải từng file `.docx` hoặc đóng gói
  các file trong `.zip`. Tiện ích hiển thị tiến độ khi tạo văn bản.
- Đặt tên file bằng dữ liệu của từng dòng, chẳng hạn `[SoVanBan]_[HoTen]`.
  Có thể thêm số thứ tự, bỏ dấu tiếng Việt trong tên file và chọn cách định dạng
  giá trị của từng trường trước khi trộn.

### Thư viện và giao diện

- Sắp xếp mẫu theo danh mục, tìm kiếm mẫu, quản lý nguồn dữ liệu và xem lịch sử
  xuất văn bản.
- Sao lưu hoặc phục hồi thư viện bằng file `.json` trong mục **Cài đặt**.
- Mở AutoDoc ở trang đầy đủ hoặc cửa sổ cạnh bên; giao diện có chế độ sáng/tối.

## Giới hạn và lưu ý

- AutoDoc 2.0 xuất Word `.docx`; nếu cần PDF, hãy chuyển file Word sau khi xuất.
- Tên cột dữ liệu cần khớp với tên biến trong mẫu. Giá trị `True` ở cột
  `Check`/`Check DL` của Google Sheets không phân biệt chữ hoa và chữ thường;
  các nguồn khác hiện lọc theo `Check DL`.
- File sao lưu `.json` có thể chứa mẫu, nguồn và dữ liệu trong thư viện. Hãy
  lưu file sao lưu ở nơi phù hợp với mức độ nhạy cảm của dữ liệu.

## Tài liệu

- [Hướng dẫn sử dụng](HUONG_DAN_SU_DUNG.md)
- [Kết nối Google Sheets](docs/google-sheets.md)
- [Thiết kế giao diện](DESIGN.md)

### Dành cho người phát triển

Cần Node.js để chạy bộ kiểm thử:

```powershell
node tools/run_all_tests.mjs
node tools/test_ui_workflow.mjs
```

Trên Windows đã cấu hình Git, chạy `deploy_github.bat` trong thư mục extension
để kiểm thử, commit và đẩy thay đổi lên nhánh `main`. Script kiểm tra version
`2.0` và không dùng `push --force`.
