// Cuộn băng thật (Băng số 1 ♥): ảnh, chú thích, bài hát và danh đề cuối phim. Anh Quang chỉ cần sửa file này.
//
// CÁCH 1 (dễ nhất, khuyên dùng): không cần dựng video.
//   1. Chép 30–40 ảnh (và vài video ngắn nếu muốn) vào thư mục assets/bang1/ (tên file không dấu càng tốt, vd anh-01.jpg).
//   2. Ghi lần lượt vào danh sách `shots` bên dưới, theo thứ tự muốn chiếu. Mỗi dòng một cảnh:
//        { img: 'anh-01.jpg', cap: 'Câu chú thích (có thể bỏ trống)' }
//        { imgs: ['anh-02.jpg', 'anh-03.jpg'], cap: '…' }          hai ảnh ghép đôi
//        { imgs: ['anh-04.jpg', 'anh-05.jpg', 'anh-06.jpg'] }       ba ảnh ghép ba
//        { img: 'anh-07.jpg', pola: 'chữ viết tay dưới polaroid' } ảnh polaroid rơi xuống
//        { video: 'clip-01.mp4', cap: '…' }                       video ngắn 3–5 giây (không tiếng)
//   3. Game tự chia ảnh theo các đoạn của bài hát (song.parts) và chuyển ảnh đúng nhịp. Bao nhiêu ảnh cũng vừa khít bài:
//      ít ảnh thì mỗi ảnh lâu hơn, nhiều ảnh thì nhanh hơn. Với khoảng 30 cảnh, phim chia đại khái như sau:
//        - 4 cảnh đầu: đoạn dạo nhạc (chậm, mỗi ảnh ~6 giây). Hợp ảnh mở đầu, ảnh tĩnh, phong cảnh.
//        - ~10 cảnh tiếp: lời 1 "Cứ như đôi hạt nắng vừa về sau mưa…" (~3 giây). Hợp ảnh kể chuyện, có chú thích.
//        - ~4 cảnh: "Vì anh em sẽ chiến thắng được thời gian…", nhạc dồn lên.
//        - ~12 cảnh cuối: điệp khúc "Anh sẽ tới đây cùng cơn mưa…", nhạc bùng (~3 giây). Để những ảnh đẹp nhất ở đây.
//      Chú thích dài nên để ở các cảnh đầu (cảnh ngắn ở điệp khúc hiện cả câu một lúc).
//   Hết ảnh thì hiện "Ngày thứ … bên nhau", TV tắt, danh đề cuộn lên như cuối phim trên điệp khúc cuối, tới hết bài.
//
// CÁCH 2: tự dựng bằng CapCut.
//   Xuất MP4 16:9, 1280×720, dưới 25 MB (giới hạn file của web), chép vào assets/bang1/bang1.mp4 rồi sửa
//   video: '../assets/bang1/bang1.mp4'. TV sẽ chiếu video đó (có tiếng của video), hết video thì vẫn chạy danh đề.
'use strict';
window.BANG1 = {
  video: null,
  // Thư mục ảnh. Ảnh mẫu hiện tại dùng 18 ảnh có sẵn trong assets/img/.
  dir: '../assets/img/',
  song: {
    // Bản phim của "Giữ Mãi Yêu Thương Gần Kề", cắt từ bài gốc bằng tools/trailer-music/bang1.mjs (bỏ điệp khúc 1 và
    // đoạn rap, ghép liền "…ta nắm tay là không sai" với "Vì anh em sẽ chiến thắng được thời gian…"). Dài 2:55.
    src: '../assets/sound/bang1.mp3',
    title: 'Giữ Mãi Yêu Thương Gần Kề',
    artist: 'Hayho',
    from: 0,
    bpm: 61.998, // nhịp bài hát
    bar0: 1.898, // giây của một phách đầu ô nhịp (để ảnh chuyển đúng nhịp)
    // Các đoạn của bài (giây trong bang1.mp3). Từ giây `at`, mỗi ảnh khoảng `beats` phách (1 phách ≈ 0,97 giây);
    // ảnh nhiều hơn nhịp chuẩn thì đoạn có `more` lớn nhận thêm nhiều hơn.
    parts: [
      { at: 9.64, beats: 8 }, // dạo nhạc: bass vào (trước đó là thẻ tựa trên tiếng piano)
      { at: 35.77, beats: 4, more: 0.5 }, // lời 1: "Cứ như đôi hạt nắng vừa về sau mưa…"
      { at: 67.71, beats: 4, more: 1.5 }, // dồn: "Vì anh em sẽ chiến thắng được thời gian…"
      { at: 80.56, beats: 4, more: 2, fx: 'flash' }, // bùng: trống vào ở điệp khúc "Anh sẽ tới đây cùng cơn mưa…"
    ],
    end: 115.13, // ban nhạc lặng xuống sau câu "Giữ mãi yêu thương gần kề": hiện "Ngày thứ … bên nhau"
    credits: 128.95, // trống vào lại ở điệp khúc cuối: TV đã tắt, danh đề cuộn lên tới hết bài
    vol: 1, // độ to của nhạc trong phim (0–1)
  },
  // Ngày bắt đầu, để đếm "Ngày thứ … bên nhau"
  since: '2026-08-06T23:38:58',
  title: 'Hồi ức',
  subtitle: 'Quang · Thủy · từ 06.08.2026',
  shots: [
    { img: 'Anh (1).jpg', cap: 'Cô giáo Văn tương lai.' },
    { img: 'Anh (2).jpg', cap: 'Nắng chiều đẹp. Người đứng trong nắng còn đẹp hơn.' },
    { imgs: ['Anh (5).jpg', 'Anh (4).jpg'], cap: 'Đi đâu, ăn gì, cũng phải chụp cho nhau xem.' },
    { img: 'Anh (3).jpg', pola: 'biển chiều', cap: 'Biển chiều, em chạy theo con sóng.' },
    { img: 'Anh (15).jpg', cap: 'Em chào biển. Biển chào em.' },
    { img: 'Anh (10).jpg', cap: 'Gương mặt này, anh thuộc lòng.' },
    { imgs: ['Anh (11).jpg', 'Anh (13).jpg'], cap: 'Một góc bếp. Một làn gió. Một người con gái.' },
    { img: 'Anh (14).jpg', cap: 'Trời mưa thì có ô. Có ô thì có em.' },
    { img: 'Anh (8).jpg', pola: 'ánh mắt', cap: 'Có những ánh mắt, nhìn một lần là nhớ mãi.' },
    { imgs: ['Anh (12).jpg', 'Anh (16).jpg', 'Anh (18).jpg'], cap: 'Đèn vàng, váy trắng. Tim anh lạc mất một nhịp.' },
    { img: 'Anh (17).jpg', cap: 'Ba khung hình, ba lần anh thương.' },
    { img: 'Anh (9).jpg', cap: 'Ngày nào cũng muốn được nhìn em thêm một chút.' },
    { img: 'Anh (6).jpg', cap: '' },
    { img: 'Anh (7).jpg', cap: '' },
  ],
  // Danh đề cuối phim (cuộn từ dưới lên). Mỗi dòng: { role: 'vai trò', name: 'tên' }, { line: 'một câu' }, { gap: true }.
  // Lời yêu thương: anh Quang tự viết vào `love` (để trống thì không hiện).
  love: '',
  credits: [
    { role: 'Một cuộn băng của', name: 'Lương Quang' },
    { role: 'Dành tặng', name: 'Lệ Thủy' },
    { gap: true },
    { role: 'Kịch bản · Lập trình', name: 'Lương Quang' },
    { role: 'Hình ảnh', name: 'Kỷ niệm của Quang & Thủy' },
    { music: true }, // dòng "Âm nhạc": tự lấy tên bài, ca sĩ ở `song`
    { role: 'Âm thanh căn nhà, tiếng đồ vật', name: 'Tự tạo bằng Web Audio' },
    { role: 'Nhạc trailer', name: 'Mountains · No Time for Caution\nHans Zimmer — Interstellar (2014)' },
    { love: true }, // chỗ đặt "Lời yêu thương" (lấy từ `love` ở trên)
    { gap: true },
    { line: 'Cảm ơn em đã xem đến cuối cuộn băng.' },
  ],
};
