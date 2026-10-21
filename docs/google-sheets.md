# Kết nối Google Sheets trực tiếp (AutoDoc 2.0)

Thư viện lưu link, tên trang tính và thông tin nguồn; không lưu một bản dữ liệu
cố định cho nguồn Google Sheets. Mỗi lần mở bảng xem trước sẽ đọc lại Google.
Trong bảng xem trước, nút **Cập nhật Google Sheets** đọc lại dữ liệu và hiển thị
thời điểm lấy dữ liệu thành công. Đây là cập nhật theo yêu cầu, không phải đăng ký
nhận thay đổi liên tục từ Google.

## Chọn nguồn

- Dùng link chỉnh sửa thông thường của Google Sheets để đọc nguồn đang làm việc.
- Nếu nhập tên Sheet, tên đó được ưu tiên. Nếu để trống, dùng `gid` trong link
  (kể cả phần `#gid=...`); không có gid thì dùng trang đầu tiên.
- Link công bố `/d/e/.../pubhtml` được hỗ trợ bằng xuất CSV, chọn trang bằng gid.
  Bản công bố có thể trễ theo cơ chế xuất bản của Google; dùng link chỉnh sửa
  nếu cần đọc trực tiếp nguồn thay vì bản công bố.

## Truy cập

Extension thử xuất CSV bằng phiên hiện tại và không kèm phiên đăng nhập, để
tránh một tài khoản không có quyền làm hỏng việc đọc link công khai. Nếu cần
phiên đăng nhập, extension chỉ tìm tab của chính Sheet được yêu cầu và đọc trong
ngữ cảnh tab đó. Khi chưa có tab phù hợp, extension có thể mở một tab nền tạm
thời và đóng riêng tab này sau khi đọc. Tab sẵn có của người dùng không bị đóng.

Không đọc cookie, mật khẩu hoặc token; không thay đổi quyền chia sẻ của file.
Nếu Google yêu cầu đăng nhập lại, hãy mở chính link Sheet bằng tài khoản có
quyền trong cùng hồ sơ Chrome rồi thử lại. Hạn chế tải xuống do chủ file hoặc
quản trị viên đặt vẫn được tôn trọng.

## Bảo toàn dữ liệu

Yêu cầu đọc bỏ cache phía trình duyệt. CSV được đọc như văn bản để giữ nguyên
Unicode, mã có số 0 đầu và giá trị hiển thị. Bộ lọc `Check DL = TRUE` vẫn áp dụng.
Cập nhật thất bại giữ nguyên bảng đang xem. Nếu bảng có chỉnh sửa cục bộ, cần
lưu bản sao trước khi tải lại; nếu chỉnh sửa xảy ra trong lúc tải, kết quả mới
không ghi đè các chỉnh sửa đó. Xuất sử dụng bản đã kiểm tra trong bảng xem trước.

## Kiểm thử

`node tools/test_google_sheets.mjs`: URL, nhiều tài khoản, quyền công khai/phiên
đăng nhập, cache, lỗi Google, dọn tab tạm, Unicode và dữ liệu thay đổi giữa lần đọc.

`node tools/test_ui_workflow.mjs`: lưu nguồn không lưu snapshot, mở lại lấy dữ
liệu mới, cập nhật trực tiếp, bảo vệ chỉnh sửa, lỗi kết nối và phiên tab cùng
origin với cookie giả lập. Không dùng tài khoản Google thực trong bộ kiểm thử.

Tham khảo: [Google Sheets data sources](https://developers.google.com/chart/interactive/docs/spreadsheets),
[Chrome scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting).
