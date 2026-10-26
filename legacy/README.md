# Web cũ

Bản đầu tiên của Yêu Lệ Thủy, làm từ 05/08 đến 03/09/2026 (v40.0). Từ 16/10/2026 nó được thay bằng web hiện tại ở thư mục gốc.

Giữ lại làm kỷ niệm. Trong app, vào được qua dòng chữ nhỏ "hồi ức" ở cuối trang chủ. Không sửa, không phát triển tiếp, không lấy làm mẫu cho code mới.

## Nội dung

Một trang duy nhất, tông tím: màn khoá, câu hỏi bí mật, góc âm nhạc, thư tình, album ảnh, hộp quà Bông hoa 8/3, nhật ký trên Firebase.

```
index.html          cả trang
nhenlove.jpeg       ảnh ở màn "đồng ý"
style/style.css     giao diện
style/script.js     logic (một phần đã bị nén, tên biến dạng _0x…)
style/pop.mp3       tiếng pop
style/gift/         trang hộp quà Bông hoa 8/3
style/img/asset/    icon riêng
```

Ảnh, nhạc và thư dùng chung nằm ở `../assets/`. `service-worker.js` ở thư mục gốc cũng là của trang này.

## Đã đổi gì khi đưa vào đây

- Đường dẫn tới ảnh, nhạc, thư dùng chung đổi sang `../assets/`.
- Bỏ đoạn tự chuyển sang `home/` ở đầu trang.
- Thêm nút "Về nhà" ở góc trên, vì app cài trên điện thoại không có nút quay lại.

Lịch sử: commit `3734c95` đến `c68c131`, tag `legacy-v40.0`.
