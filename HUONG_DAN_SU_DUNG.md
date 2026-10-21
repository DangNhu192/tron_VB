# 📝 HƯỚNG DẪN SỬ DỤNG AUTODOC PRO (v2.3)

Hệ thống **AutoDoc Pro v2.3** là tiện ích mở rộng cao cấp (Chrome Extension) chuyên dụng để tạo lập văn bản hàng loạt từ biểu mẫu Word (`.docx`) và bảng dữ liệu (Excel, CSV, Word, Google Sheets). Phiên bản v2.3 nâng cấp toàn diện theo chuẩn **Manifest V3** hiện đại nhất:
- **Kiến trúc ES6 Modules:** Mã nguồn phân lớp rõ ràng (`core/`, `services/`, `ui/`), tối ưu bộ nhớ, loại bỏ phụ thuộc toàn cục.
- **Hỗ trợ Chrome SidePanel:** Mở cửa sổ thao tác trực tiếp ở cạnh bên màn hình, vừa đối chiếu Google Sheets / Drive vừa tạo văn bản mượt mà.
- **Xử lý đa luồng ngầm bằng Web Worker:** Không làm đơ trình duyệt khi xuất hàng trăm file.
- **Chuẩn hóa font chữ Times New Roman** theo **Nghị định 30/2020/NĐ-CP**.
- **Quét biến toàn diện** (Body, Header, Footer), dán dữ liệu TSV nhiều ô từ Excel và kiểm tra tính thống nhất dữ liệu 100% offline.

---

## 1. Hướng dẫn Cài đặt Extension (Lần đầu)

1. **Mở trang quản lý Tiện ích:** Mở trình duyệt Google Chrome (hoặc Edge, Cốc Cốc, Brave...), truy cập đường dẫn: `chrome://extensions/`.
2. **Bật Chế độ Nhà phát triển:** Ở góc trên cùng bên phải, gạt công tắc bật **"Chế độ dành cho nhà phát triển" (Developer mode)**.
3. **Tải tiện ích:** Bấm vào nút **"Tải tiện ích đã giải nén" (Load unpacked)** ở góc trên bên trái, sau đó chọn thư mục `VB hàng loạt 2.0`.
4. **Ghim Tiện ích:** Click vào biểu tượng mảnh ghép 🧩 trên thanh công cụ trình duyệt và bấm ghim AutoDoc Pro để sử dụng.

---

## 2. Các Tính Năng Nổi Bật v2.3 Pro

### 📱 Hỗ Trợ Chrome SidePanel (Cửa Sổ Cạnh Bên)
- **Mở cạnh bên tab đang làm việc:** Nhấp chuột phải vào biểu tượng Extension hoặc bất kỳ đâu trên trang web, chọn **"Mở AutoDoc Pro (Cửa sổ cạnh bên - Side Panel)"**.
- **Tiện lợi tối đa:** Bạn có thể vừa xem bảng tính Google Sheets, duyệt file trên Google Drive ở nửa màn hình chính, vừa nhập liệu và xuất văn bản trên thanh Side Panel bên cạnh.
- **Chuyển đổi 1 chạm:** Tại góc trên của Side Panel có nút **"Tab lớn"** để mở rộng ra màn hình lớn bất cứ lúc nào.

### ⚡ Xử Lý Đa Luồng với Web Worker (Không lo đơ trình duyệt)
- Toàn bộ quá trình render và nén file ZIP được thực hiện ngầm trong Web Worker độc lập.
- Giao diện luôn mượt mà, thanh tiến trình hiển thị tỷ lệ % và số lượng file hoàn thành theo thời gian thực (kể cả khi xử lý hàng trăm văn bản cùng lúc).

### 🔤 Chuẩn Hóa Font Times New Roman & Chuyển Mã Tự Động
- **Chuẩn hóa Font chữ XML:** Tự động gán font `Times New Roman` cho toàn bộ nội dung văn bản (`word/document.xml`, `word/styles.xml`, `word/header*.xml`, `word/footer*.xml`) tuân thủ nghiêm ngặt thể thức văn bản hành chính theo **Nghị định 30/2020/NĐ-CP**.
- **Chuyển đổi bảng mã cũ:** Tự động phát hiện và chuyển đổi chữ tiếng Việt từ bảng mã **VNI-Windows** hoặc **TCVN3 (ABC)** sang **Unicode** chuẩn dựng sẵn (NFC), xóa tan nỗi lo lỗi font hoặc vỡ dấu tiếng Việt.
- Có thể bật/tắt trong phần Cài đặt & Tùy biến.

### 🔍 Quét Biến Toàn Diện (Full-Scope Variable Scanner)
- Quét sạch mọi biến số `{{Ten_Bien}}` nằm ở phần thân (Body), tiêu đề đầu trang (Header) và chân trang (Footer).
- Đảm bảo các thông tin như số văn bản ở Header hay ngày tháng ở Footer đều được nhận diện chính xác 100%.

### 📥 Tải File Excel Mẫu (.xlsx) từ Biến Word
- Chỉ cần chọn mẫu Word, bấm nút **"Tải File Excel Mẫu (.xlsx) từ Biến Word"**.
- Hệ thống sẽ tự động tạo ngay một file Excel chứa đầy đủ các cột tương ứng với các biến có trong mẫu. Bạn chỉ việc mở ra và điền dữ liệu.

### 📋 Dán Dữ Liệu Nhiều Ô / Nhiều Dòng từ Excel (Clipboard TSV)
- Trong bảng Xem trước dữ liệu, bạn có thể chọn một vùng dữ liệu trên Excel hoặc Google Sheets (ví dụ 10 dòng x 5 cột), nhấn `Ctrl+C`, sau đó click vào ô bắt đầu trên bảng và bấm `Ctrl+V`.
- Hệ thống tự động phân tách cột và dòng, tự động thêm hàng mới nếu dữ liệu dán vượt quá số hàng hiện có.

### 💾 Xuất Bảng Dữ Liệu Xem Trước Ra Excel (.xlsx)
- Sau khi chỉnh sửa, bổ sung dòng hoặc dán dữ liệu trong bảng xem trước, bạn có thể nhấn nút **"Xuất Excel (.xlsx)"** trên thanh công cụ để tải bảng dữ liệu về máy lưu trữ và dùng lại.

### 📂 Quản Lý Thư Viện Biểu Mẫu & Tải File Mẫu (.docx)
- Lưu trữ tối đa **50 biểu mẫu Word** trực tiếp trong bộ nhớ Extension.
- Cho phép phân loại theo danh mục (Hợp đồng, Báo cáo, Giấy phép, Quyết định...), đánh dấu sao Yêu thích, tìm kiếm nhanh.
- **Tải file mẫu về máy:** Bấm vào biểu tượng Tải về 📥 bên cạnh tên mẫu trong thư viện để lấy lại file `.docx` gốc khi cần chỉnh sửa.

### 📊 Nguồn Dữ Liệu Đa Dạng (Google Sheets & Local)
- Hỗ trợ nạp dữ liệu từ file máy tính (`.xlsx`, `.xls`, `.csv`, `.docx`).
- Hỗ trợ lưu trữ và đồng bộ dữ liệu trực tiếp từ liên kết **Google Sheets** trực tuyến.

### ⚙️ Tùy Biến Tên File Xuất Linh Hoạt
- Định dạng theo mẫu `[Tên_Cột]` (ví dụ: `[So_GPMT]_[Ten_Doanh_Nghiep]`).
- Tùy chọn **Đánh số thứ tự đầu file (1_, 2_, ...)**: Bật/Tắt linh hoạt.
- Tùy chọn **Bỏ dấu tiếng Việt trong tên file**: Bật để chống lỗi hệ điều hành, hoặc tắt để giữ nguyên tên file tiếng Việt có dấu chuẩn.

### 📄 Xuất Thử File Đơn (Single Test Export)
- Tại mỗi dòng trong bảng xem trước có nút icon Tải xuống 📥 để xuất thử riêng 1 văn bản đó, giúp kiểm tra nhanh định dạng trang in trước khi xuất hàng loạt cả gói ZIP.

---

## 3. Hệ Thống Kiểm Tra Tính Thống Nhất Dữ Liệu

Tự động rà soát trước khi xuất để bảo vệ tính toàn vẹn của hồ sơ:

| Loại Cảnh Báo | Chi Tiết |
| :--- | :--- |
| ❌ **Mất thống nhất cấu trúc** | Biểu mẫu có biến `{{Bien}}` nhưng bảng dữ liệu bị thiếu cột tương ứng. |
| ⚠️ **Lệch chữ hoa/thường** | Phát hiện biến bị gõ lệch chữ hoa/thường (ví dụ: `{{HoTen}}` và `{{Hoten}}`). |
| ⚠️ **Ô dữ liệu bị bỏ trống** | Liệt kê chi tiết dòng và cột có dữ liệu bị bỏ trống. |
| ❌ **Trùng lặp tên file** | Cấu hình tên file làm cho nhiều dòng dữ liệu sinh ra tên file trùng nhau. |
| ⚠️ **Lỗi cú pháp ngoặc nhọn** | Phát hiện thiếu dấu ngoặc `{` hoặc `}` trong biểu mẫu Word. |

---

## 4. Giao Diện Làm Việc Hiện Đại v2.3 (Tab Navigation)

Giao diện được tái thiết kế tinh gọn, chia thành 4 phân hệ làm việc chuyên biệt:
1. 📑 **Tạo Văn Bản (Workspace):**
   - **Bước 1:** Chọn Mẫu Word (Thư viện hoặc tải lên trực tiếp).
   - **Bước 2:** Chọn Nguồn Dữ Liệu (Bảng tính Excel/CSV hoặc chọn nguồn đã lưu).
   - **Thanh Hành Động Trung Tâm:** Đặt tên file, chọn định dạng xuất và bấm **"BẮT ĐẦU TẠO VĂN BẢN"**.
2. 📁 **Thư Viện Mẫu (Templates):** Quản lý biểu mẫu Word, phân loại danh mục, tìm kiếm và tải về file gốc.
3. 📊 **Nguồn Dữ Liệu (Data Sources):** Quản lý các liên kết Google Sheets hoặc file dữ liệu cố định dùng thường xuyên.
4. ⚙️ **Cài Đặt (Settings):** Tùy chỉnh chuẩn hóa font Times New Roman, kiểm tra dữ liệu, sao lưu & phục hồi thư viện với công tắc gạt Toggle Switch hiện đại.

---

## 5. Xử Lý Sự Cố Nhanh

1. **Biến số không nhận:** Đảm bảo biến được viết đúng dạng `{{Ten_Bien}}` (hai ngoặc nhọn mỗi bên, không có khoảng trắng thừa).
2. **File Excel nhiều Sheet:** Khi chọn file Excel có nhiều trang tính, chọn đúng Sheet ở mục *"Chọn Trang tính (Sheet)"*.
3. **Mở file ZIP tiếng Việt:** Bật tùy chọn *"Bỏ dấu tiếng Việt trong tên file"* nếu ứng dụng giải nén trên máy bạn không hỗ trợ tên file có dấu tiếng Việt.
