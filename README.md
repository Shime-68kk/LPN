# Yêu Lệ Thủy (LPN)

Web app riêng tư (PWA, cài lên màn hình điện thoại) anh Quang làm tặng Lệ Thủy.
Bản đang chạy: https://lpn.luongquang060804.workers.dev

*Món quà nhỏ, ngọt ngào và duy nhất, dành riêng cho Lệ Thủy.* 💜

## Repo này có hai luồng

Web đã được làm lại toàn bộ. Code của bản đầu tiên vẫn được giữ, nhưng tách riêng vào `legacy/`.

|                | Web hiện tại                            | Web cũ (legacy)                                              |
| -------------- | --------------------------------------- | ------------------------------------------------------------ |
| Trạng thái     | đang dùng, đang phát triển              | đóng băng, chỉ giữ làm kỷ niệm                               |
| Thời gian      | từ 16/10/2026                           | 05/08/2026 đến 03/09/2026 (bản v40.0)                        |
| Thư mục        | `home/`, `game/`, `shop/`, `story/`, `assets/` | `legacy/`                                             |
| Địa chỉ        | `/` chuyển sang `/home/`                | `/legacy/` (link cũ có `?cu=1` cũng tới đây)                 |
| Lịch sử git    | từ commit `40419ef` trở đi              | từ `3734c95` đến `c68c131` (tag `legacy-v40.0`)              |
| Kiểu code      | nhiều trang nhỏ, mỗi trang một thư mục, JS thuần | một trang lớn `legacy/index.html` + `style/script.js` |

Khi đọc hoặc sửa repo:

- Mọi việc mới làm ở web hiện tại. Không sửa `legacy/`, không lấy nó làm mẫu.
- Commit trước ngày 16/10/2026 nói về web cũ: một trang tông tím với câu hỏi bí mật, góc nhạc, thư, album, hộp quà 8/3. Web hiện tại cũng có nhạc, thư, album, nhưng làm lại từ đầu bằng code khác hoàn toàn. Vì vậy đừng suy ra cách web hiện tại chạy từ các commit cũ.
- Web hiện tại chỉ còn một chỗ dẫn sang web cũ: thẻ "Bông hoa 8/3" ở Tiệm Sâu, mục Kỷ niệm. Thẻ này mở `legacy/style/gift/gift.html`.

## Cấu trúc thư mục

```
index.html          cổng vào, không có giao diện: chuyển sang home/ (hoặc legacy/ khi có ?cu=1)
manifest.json       PWA (start_url ./ → index.html → home/)
service-worker.js   service worker của web cũ; để nguyên ở gốc vì máy từng cài app cũ vẫn đăng ký nó
                    (web hiện tại không đăng ký service worker)
assets/             ảnh, nhạc, thư dùng chung
  img/              album Anh (1..18).jpg, ảnh màn khoá Anhnen.JPG, icon app, tham-tu.svg
  sound/            các bài hát .mp3 và ảnh bìa gốc Anh (1..6).jpg
  thumbs/           ảnh thu nhỏ WebP cho album và bìa nhạc (tạo bằng tools/make_thumbs.sh)
  letter.txt        thư tình
home/               trang chủ: màn khoá, trời theo thời tiết thật, nhạc, thư tình, album, nhật ký
  wallet.js         ví đốt cây dùng chung cho mọi trang (điểm game → đốt → mở chương, mua đồ)
  sync.js           sao lưu ví và tiến độ lên Firebase: lpn/players/{thuy|quang}
  widget.*          widget màn khoá (Scriptable): đếm thời gian yêu nhau
game/               Sâu Tím: game ăn lá theo nhạc (canvas + Web Audio); beatmaps/ là nốt nhạc từng bài
shop/               Tiệm Sâu: skin, hiệu ứng, cánh, nền, hộp quà, sự kiện
  skins.js          dữ liệu và hình vẽ mọi món, kỹ năng của skin độc quyền
story/              cốt truyện theo chương (chapters.json) và vụ án thám tử (case.*)
tools/              tạo beatmap từ file nhạc, tạo ảnh thu nhỏ
legacy/             web cũ, đóng băng (xem legacy/README.md)
```

## Các phần nối với nhau thế nào

- Chơi Sâu Tím được điểm. Điểm tự đổi ra đốt cây (`home/wallet.js`). Đốt dùng để mở chương truyện và mua đồ ở Tiệm Sâu.
- Đọc chương truyện có thể mở khoá bài hát mới trong game (`lpn:songs`).
- Mỗi máy chọn "máy của ai" một lần. Từ đó ví, đồ, tiến độ truyện, kỷ lục được sao lưu lên Firebase.
- Mọi trang có cùng một đoạn script ngày/đêm trong `<head>` để chuyển trang không bị chớp sáng.

## Chạy thử và triển khai

- Chạy trên máy: `python3 -m http.server 8080` ở thư mục gốc, rồi mở http://localhost:8080/
- Triển khai: push lên `main`. Cloudflare Workers Builds chạy `npm run build` để chép các thư mục vào `dist/`, rồi phục vụ `dist/` theo `wrangler.jsonc`.
- Sửa JS/CSS thì tăng số `?v=` ở thẻ `<script>` / `<link>` để điện thoại tải bản mới.
