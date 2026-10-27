# Chinese Pocket
PWA học câu giao tiếp tiếng Trung, offline, không máy chủ. Dữ liệu cá nhân lưu trong IndexedDB trên thiết bị.
## Chạy thử
`python3 -m http.server 8000` rồi mở http://localhost:8000 (Service Worker cần http://localhost hoặc HTTPS).
## Triển khai GitHub Pages
Đẩy thư mục lên repo → Settings → Pages → Deploy from branch (`main`, `/root`). Mở link HTTPS, chờ tải xong rồi dùng offline / "Thêm vào màn hình chính".
## Nạp dữ liệu 3.000 câu
**Cách chính:** app tải trực tiếp từ Google Sheet của bạn (nút ⚙ → Cập nhật ngay). Sheet phải để chia sẻ "Bất kỳ ai có đường liên kết đều xem được"; sheet cần có cột STT, Tiếng Trung, Âm Hán Việt, Pinyin, Tiếng Việt ở dòng đầu. Đổi link nguồn mặc định bằng hằng số `DEF_URL` trong app.js. Bạn sửa sheet → người dùng bấm Cập nhật là thống nhất dữ liệu (tiến độ cá nhân giữ nguyên theo ID).
**Cách phụ:** Trong app: Sao lưu/Dữ liệu → **Thêm file câu** → chọn .xlsx/.csv/.json (cột STT, Tiếng Trung, Âm Hán Việt, Pinyin, Tiếng Việt). Dữ liệu lưu trên thiết bị và dùng offline. Nhập lại file đã sửa: cập nhật theo ID, giữ tiến độ. Muốn đóng gói sẵn cho mọi người dùng: `python tools/xlsx_to_json.py file.xlsx` rồi đưa data/sentences.json lên repo (đổi `V` trong sw.js).
## Cấu trúc
index.html · style.css · app.js (dữ liệu, IndexedDB, màn hình) · sw.js · manifest.webmanifest · data/sentences.json · tools/xlsx_to_json.py
## Giả định / chưa làm
Phát âm chưa có (chưa có âm thanh, nên không hiện nút giả). Không tự đồng bộ giữa thiết bị, chỉ xuất/nhập thủ công.
