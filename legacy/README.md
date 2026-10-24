# Web cũ (legacy), đã đóng băng

Đây là bản đầu tiên của "Yêu Lệ Thủy", làm từ 05/08/2026 đến 03/09/2026 (bản v40.0).
Từ 16/10/2026 nó được thay bằng web hiện tại (`home/`, `game/`, `shop/`, `story/` ở thư mục gốc).

Thư mục này chỉ giữ làm kỷ niệm: vẫn mở được ở `/legacy/`, nhưng không sửa, không phát triển tiếp, và không dùng làm mẫu cho code mới.

## Web cũ có gì

Một trang duy nhất, tông tím chủ đạo:

- 🎵 Góc âm nhạc riêng tư
- ✉️ Bức thư tình
- 📸 Album ảnh kỷ niệm
- 🎁 Hộp quà bất ngờ (Bông hoa 8/3)
- 🔓 Câu hỏi bí mật, cột mốc mở khoá tình yêu
- Nhật ký trên Firebase, gửi thông báo qua Discord / EmailJS

## Cấu trúc

```
index.html          cả trang web cũ
nhenlove.jpeg       ảnh ở màn "đồng ý"
style/style.css     toàn bộ giao diện
style/script.js     toàn bộ logic (một phần đã bị nén, tên biến dạng _0x…)
style/pop.mp3       tiếng "pop"
style/gift/         trang hộp quà Bông hoa 8/3. Web hiện tại vẫn mở trang này từ Tiệm Sâu > Kỷ niệm.
style/img/asset/    icon riêng của web cũ
```

Ảnh, nhạc và thư tình dùng chung với web hiện tại nằm ở `../assets/`. `service-worker.js` ở thư mục gốc cũng là của web cũ: các máy từng cài app cũ vẫn đăng ký nó nên phải để nguyên ở đó.

## Lịch sử

Commit `3734c95` (05/08/2026) đến `c68c131` (03/09/2026), có gắn tag `legacy-v40.0`. Khi dời vào thư mục này, chỉ đường dẫn tới ảnh, nhạc, thư dùng chung được đổi sang `../assets/`. Đoạn tự chuyển sang `home/` ở đầu trang cũng được bỏ.

*Gửi tới Lệ Thủy với tất cả tình yêu thương của anh.* 💖
