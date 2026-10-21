# AutoDoc — Extension trộn văn bản 2.0

Mã nguồn chính nằm trên nhánh **main**. Phiên bản extension giữ nguyên **2.0**.

## Cài đặt / cập nhật

1. Tải mã nguồn từ nhánh `main` và giải nén.
2. Mở `chrome://extensions`, bật Chế độ dành cho nhà phát triển.
3. Chọn **Tải tiện ích đã giải nén** và chọn thư mục chứa `manifest.json`.
4. Khi cập nhật mã nguồn, bấm **Tải lại** extension rồi đóng/mở lại giao diện.

## Đẩy bản cập nhật lên GitHub

Chạy **deploy_github.bat** ngay trong thư mục này. Script tự chuyển đến đúng
thư mục, kiểm tra phiên bản và chạy kiểm thử, commit mã nguồn rồi đẩy lên
`https://github.com/DangNhu192/tron_VB` trên nhánh **main**.

Yêu cầu Git và Node.js. Khi GitHub yêu cầu xác thực, đăng nhập bằng trình duyệt.
Script dừng nếu đang ở nhánh khác, remote sai, kiểm thử lỗi hoặc lịch sử phân kỳ;
không dùng force-push. `.gitignore` loại dữ liệu người dùng, gói nén cũ và file tạm.

Chạy tự động, không dừng ở `pause`:

```bat
deploy_github.bat /no-pause
```

Đây là Chrome extension; tải lên GitHub không tự cài đặt vào Chrome hoặc biến
toàn bộ chức năng extension thành website trên Vercel.

[Hướng dẫn Google Sheets trực tiếp](docs/google-sheets.md)
