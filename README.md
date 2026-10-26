# Yêu Lệ Thủy

Một web app nhỏ, riêng tư, anh Quang làm tặng Lệ Thủy. Cài lên màn hình điện thoại như một ứng dụng (PWA).

Bản đang chạy: https://lpn.luongquang060804.workers.dev

Trung tâm của app là **cốt truyện**: chuyện tình có thật của hai người, kể theo từng chương. Mọi phần khác đều xoay quanh truyện. Game Sâu Tím để kiếm đốt cây mở chương mới. Tiệm Sâu bán đồ sinh ra từ các kỷ niệm trong truyện. Trang chủ giữ thư, ảnh, nhạc và nhật ký.

## Gồm những gì

| Phần | Thư mục | Nội dung |
| --- | --- | --- |
| Trang chủ | `home/` | Màn khoá, bầu trời theo thời tiết thật ở Thái Nguyên và Hà Nội, đếm ngày bên nhau, nhạc, thư tình, album, nhật ký chung |
| Cốt truyện | `story/` | Truyện theo chương (`chapters.json`), mở bằng đốt cây; vụ án thám tử ở chương ngoại truyện (`case.*`) |
| Sâu Tím | `game/` | Game ăn lá theo nhạc (canvas + Web Audio). Ăn lá được điểm, điểm đổi ra đốt cây |
| Tiệm Sâu | `shop/` | Skin, hiệu ứng, cánh, nền cho bé sâu, hộp quà, sự kiện. `skins.js` chứa dữ liệu và hình vẽ |
| Dùng chung | `assets/` | Ảnh, bài hát, ảnh thu nhỏ, thư tình |

Vài nguyên tắc giữ cho các phần gắn với nhau:

- Đồ trong Tiệm Sâu sinh ra từ cốt truyện. Mỗi món ghi rõ kỷ niệm ở chương nào. Sự kiện theo dịp có, nhưng ít.
- Lời thoại trong truyện là lời thật của hai người, không bịa thêm.
- Chỉ hai skin độc quyền (Nàng Thơ, Vi Mạch) có kỹ năng trong game. Game phục vụ truyện, không phải ngược lại.

## Hai luồng code

Web đã được làm lại từ đầu, nên repo có hai phần tách biệt.

**Web hiện tại** (từ 16/10/2026) gồm `home/`, `game/`, `shop/`, `story/`, `assets/`. Mọi thay đổi mới đều làm ở đây.

**Web cũ** (05/08 – 03/09/2026) nằm trong `legacy/`. Đây là bản đầu tiên, một trang duy nhất tông tím. Giữ lại làm kỷ niệm, không phát triển tiếp. Trong app, nó được giấu sau dòng chữ nhỏ "hồi ức" ở cuối trang chủ.

Với lịch sử git:

- Từ `3734c95` đến `c68c131` là web cũ. Commit cuối của nó có gắn tag `legacy-v40.0`.
- Từ `40419ef` trở đi là web hiện tại.

Commit cũ mô tả những thứ không còn trong web hiện tại, nên đừng dựa vào chúng để hiểu code bây giờ.

## Cấu trúc

```
index.html          cổng vào, chỉ chuyển sang home/
manifest.json       cấu hình PWA
service-worker.js   của web cũ; để ở gốc vì máy từng cài app cũ vẫn dùng nó
home/               trang chủ; wallet.js (ví đốt cây), sync.js (sao lưu Firebase)
story/              cốt truyện
game/               Sâu Tím; beatmaps/ là nốt nhạc của từng bài
shop/               Tiệm Sâu
assets/             ảnh, nhạc, thư dùng chung
tools/              tạo beatmap, ảnh thu nhỏ
legacy/             web cũ
```

## Dữ liệu

Mỗi máy chọn một lần đây là máy của ai. Sau đó ví đốt cây, đồ đã có, tiến độ truyện và kỷ lục game được sao lưu lên Firebase Realtime Database ở `lpn/players/{thuy|quang}`. Quà tặng đốt đi qua nhánh `grants`, không sửa thẳng ví.

## Chạy và triển khai

HTML, CSS, JavaScript thuần, không framework, không bước build thật sự.

```
python3 -m http.server 8080      # chạy thử, mở http://localhost:8080/
```

Push lên `main` thì Cloudflare Workers Builds chạy `npm run build`. Lệnh này chép các thư mục vào `dist/` rồi phục vụ thư mục đó. Khi sửa JS hoặc CSS, tăng số `?v=` trong thẻ `<script>` / `<link>` để điện thoại tải bản mới.

Hướng dẫn ngắn cho AI và coding agent nằm ở `AGENTS.md`.
