# Hướng dẫn cho AI / coding agent

Đọc `README.md` trước. Tóm tắt:

- Repo có hai luồng. **Web hiện tại** gồm `home/`, `game/`, `shop/`, `story/`, `assets/`, và mọi thay đổi làm ở đây.
- `legacy/` là **web cũ đã đóng băng**: chỉ đọc để tham khảo, không sửa, không lấy làm mẫu.
- Commit trước 16/10/2026 (trước `40419ef`) là lịch sử của web cũ, không mô tả web hiện tại.
- Code là HTML/CSS/JS thuần, không có bước build ngoài việc chép file. Sửa JS/CSS thì tăng `?v=` ở thẻ `<script>` / `<link>`.
- Lời thoại trong `story/chapters.json` là kỷ niệm thật của hai người: không tự bịa hay sửa lời.
- **Đồ trong Tiệm Sâu sinh ra từ cốt truyện.** Skin, hiệu ứng, cánh, nền, bậc, kỹ năng mới đều phải bắt nguồn từ một chương đã viết (có `ch` và dòng `memory` lấy từ chương đó), không tạo theo ý thích ngoài truyện. Khoảng 90% đồ đến từ truyện. Sự kiện theo dịp (Sa Pa, Halloween, ngày lễ) được phép nhưng ít, và nên gắn với một kỷ niệm thật. Chưa có chương thì viết chương trước, rồi mới làm đồ cho chương đó.
