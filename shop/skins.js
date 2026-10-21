// Tiệm Sâu: danh sách món đồ (skin, hiệu ứng ăn lá, cánh bướm) và cách vẽ chúng.
// Dùng chung cho trò chơi Sâu Tím và trang Tiệm Sâu, nên mọi hàm vẽ nhận sẵn context và tỉ lệ S.
// Skin chỉ để đẹp, không thay đổi cách chơi hay điểm số.
'use strict';
(() => {
  const TAU = Math.PI * 2;

  // ================= Độ hiếm =================
  const RARITY = {
    thuong: { name: 'Thường', color: '#6FA982', weight: 58 },
    hiem: { name: 'Hiếm', color: '#4C8DE0', weight: 28 },
    suthi: { name: 'Sử thi', color: '#9B5DE5', weight: 11 },
    huyenthoai: { name: 'Huyền thoại', color: '#E8962A', weight: 3 },
  };

  // Màu gốc của bé Sâu Tím; mỗi skin chỉ ghi đè vài màu.
  const BASE = {
    body: '#B79CF0', body2: '#A88BE8', head: '#B79CF0', feet: '#6B4FA0', ant: '#6B4FA0', antTip: '#FF8FA3',
    blush: 'rgba(255,111,142,0.55)', mark: '#FF8FA3', eye: '#2A1E3D', mouth: '#4A2B4F', tongue: '#FF8FA3',
    shine: 'rgba(255,255,255,0.35)', cocoon: '#CDB8F0', cocoonLine: '#A88BE8',
  };

  // ch: chương truyện gắn với món đồ; memory: câu nhắc lại kỷ niệm (hiện trong Tiệm và bộ sưu tập).
  const ITEMS = [
    // ---------- Skin ----------
    { id: 'tim', slot: 'skin', name: 'Sâu Tím', rarity: 'thuong', price: 0, free: true,
      memory: 'Bé sâu đầu tiên, màu tím em thích.', pal: {}, mark: 'heart' },
    { id: 'bac-ha', slot: 'skin', name: 'Sâu Bạc Hà', rarity: 'thuong', price: 80,
      memory: 'Mát lạnh như sáng sớm đầu thu.',
      pal: { body: '#9EE0C4', body2: '#86D4B3', head: '#9EE0C4', feet: '#3F8C6E', ant: '#3F8C6E', cocoon: '#C9EEDD', cocoonLine: '#86D4B3' }, mark: 'dot' },
    { id: 'dao', slot: 'skin', name: 'Sâu Đào', rarity: 'thuong', price: 80,
      memory: 'Màu má em lúc được khen xinh.',
      pal: { body: '#FFC2A8', body2: '#FFB08F', head: '#FFC2A8', feet: '#C9694A', ant: '#C9694A', antTip: '#FF6F8E', cocoon: '#FFE0D2', cocoonLine: '#FFB08F' }, mark: 'heart' },
    { id: 'chanh', slot: 'skin', name: 'Sâu Chanh', rarity: 'thuong', price: 80,
      memory: 'Chua chua ngọt ngọt, như mấy câu em trêu anh.',
      pal: { body: '#F4E27A', body2: '#EBD45C', head: '#F4E27A', feet: '#9C8A1E', ant: '#9C8A1E', antTip: '#7CC46E', cocoon: '#FBF1BE', cocoonLine: '#EBD45C' }, mark: 'dot' },
    { id: 'bien', slot: 'skin', name: 'Sâu Biển', rarity: 'thuong', price: 80,
      memory: 'Biển chiều, em chạy theo con sóng.',
      pal: { body: '#8EC5FF', body2: '#76B3F5', head: '#8EC5FF', feet: '#2F6DB5', ant: '#2F6DB5', antTip: '#FFFFFF', cocoon: '#CFE5FF', cocoonLine: '#76B3F5' }, mark: 'star' },
    { id: 'cacao', slot: 'skin', name: 'Sâu Cacao', rarity: 'thuong', price: 80,
      memory: 'Một cốc cacao nóng cho ngày em mệt.',
      pal: { body: '#C79A7A', body2: '#B88763', head: '#C79A7A', feet: '#6E4630', ant: '#6E4630', antTip: '#FFD9A8', cocoon: '#E6CDBA', cocoonLine: '#B88763' }, mark: 'heart' },
    { id: 'lim-dim', slot: 'skin', name: 'Sâu Lim Dim', rarity: 'thuong', price: 100, ch: 3,
      memory: '“Ôi em ngủ trông cute thế, lim dim thế này ngủ đến trưa.”',
      pal: { body: '#C9B8F5', body2: '#BBA6EE', head: '#C9B8F5' }, acc: 'nightcap', eyes: 'sleepy', mark: 'moon' },
    { id: 'mi-tom', slot: 'skin', name: 'Sâu Mì Tôm', rarity: 'thuong', price: 100, ch: 6,
      memory: 'Đêm đó, em ăn mì tôm. Anh chỉ dám nhắc nhẹ.',
      pal: { body: '#FFD98A', body2: '#F7CB6E', head: '#FFD98A', feet: '#B07A1E', ant: '#B07A1E', antTip: '#FF7A5C', cocoon: '#FFEBC2', cocoonLine: '#F7CB6E' }, acc: 'noodle', mark: 'dot' },
    { id: 'at-do-hoi', slot: 'skin', name: 'Sâu Ất Dở Hơi', rarity: 'hiem', price: 250, ch: 5,
      memory: '“Anh nói chuyện y như thằng ất dở hơi ấy.”',
      pal: { body: '#A9B8D6', body2: '#98A9CB', head: '#A9B8D6', feet: '#4A5A80', ant: '#4A5A80', antTip: '#FFC24B', cocoon: '#D5DDEE', cocoonLine: '#98A9CB' }, acc: 'nerd', mark: 'dot' },
    { id: 'ngay-mua', slot: 'skin', name: 'Sâu Ngày Mưa', rarity: 'hiem', price: 250, ch: 1,
      memory: 'Như cơn mưa ngoài kia, lặng lẽ rơi mà chẳng có ai che cho.',
      pal: { body: '#FFD34E', body2: '#F5C431', head: '#B79CF0', feet: '#B08A12', ant: '#6B4FA0', cocoon: '#FFEB9E', cocoonLine: '#F5C431' }, acc: 'rainhat', mark: 'drop' },
    { id: 'sinh-nhat', slot: 'skin', name: 'Sâu Sinh Nhật', rarity: 'hiem', price: 250, ch: 8,
      memory: 'Anh quên mất sinh nhật mình. Nhưng em thì không.',
      pal: { body: '#B79CF0', body2: '#FFB0C0', head: '#B79CF0' }, acc: 'partyhat', mark: 'star' },
    { id: 'sen-hong', slot: 'skin', name: 'Sâu Sen Hồng', rarity: 'suthi', price: 600, ch: 8,
      memory: 'Ở chợ Thái, còn đúng 15 bông sen hồng cuối cùng.',
      pal: { body: '#FFC1D2', body2: '#FFAEC4', head: '#FFC1D2', feet: '#3F8C5A', ant: '#3F8C5A', antTip: '#FFE27A', mark: '#FFFFFF', cocoon: '#FFE0EA', cocoonLine: '#FFAEC4' }, acc: 'lotus', mark: 'lotus' },
    { id: 'sa-pa', slot: 'skin', name: 'Sâu Sa Pa', rarity: 'suthi', price: 600, ch: 12,
      memory: 'Sa Pa đón hai đứa bằng mây và gió lạnh.',
      pal: { body: '#E8EEF8', body2: '#D6E0F0', head: '#E8EEF8', feet: '#5A6B8C', ant: '#5A6B8C', antTip: '#FF6F8E', mark: '#C23A5C', cocoon: '#F4F7FC', cocoonLine: '#D6E0F0' }, acc: 'beanie', mark: 'snow' },
    { id: 'dem-sao', slot: 'skin', name: 'Sâu Đêm Sao', rarity: 'suthi', price: 600, ch: 9,
      memory: 'Câu chuyện của hai đứa, vẫn còn đang viết tiếp…',
      pal: { body: '#3D3670', body2: '#4A4285', head: '#3D3670', feet: '#1E1A3A', ant: '#8C7FD6', antTip: '#FFE27A', mark: '#FFE27A', eye: '#FFF4D6', mouth: '#FFF4D6', shine: 'rgba(255,255,255,0.18)', cocoon: '#5A5294', cocoonLine: '#8C7FD6' }, acc: 'moon', mark: 'star', glow: '#FFE27A' },
    { id: 'be-hong', slot: 'skin', name: 'Bé Hồng', rarity: 'huyenthoai', price: 1500, ch: 8,
      memory: 'Từ mép bên kia màn hình, từng câu nói một, rồi đứng sát bên bé tím.',
      pal: { body: '#FFB0C0', body2: '#FF9DB2', head: '#FFB0C0', feet: '#D9577A', ant: '#D9577A', antTip: '#FF4F7B', blush: 'rgba(255,90,130,0.6)', mark: '#FFFFFF', cocoon: '#FFD6E0', cocoonLine: '#FF9DB2' }, acc: 'bow', eyes: 'lash', shape: 'bean', mark: 'heart', glow: '#FFFFFF' },

    // ---------- Hiệu ứng khi ăn lá ----------
    { id: 'la', slot: 'fx', name: 'Vụn lá', rarity: 'thuong', price: 0, free: true, memory: 'Măm măm, lá xanh giòn tan.', fx: { kind: 'leaf' } },
    { id: 'tim-bay', slot: 'fx', name: 'Tim bay', rarity: 'thuong', price: 80, ch: 5, memory: 'Từ điển tiếng em ❤️', fx: { kind: 'heart', colors: ['#FF8FA3', '#FF6F8E', '#FFC1D2'] } },
    { id: 'not-nhac', slot: 'fx', name: 'Nốt nhạc', rarity: 'hiem', price: 250, ch: 12, memory: 'Có những bài hát, nghe một lần là nhớ cả một ngày.', fx: { kind: 'note', colors: ['#9B5DE5', '#FF6F8E', '#4C8DE0'] } },
    { id: 'sao-vang', slot: 'fx', name: 'Sao vàng', rarity: 'hiem', price: 250, memory: 'Ba ngôi sao, rồi chuỗi 8, chuỗi 80, chuỗi 800.', fx: { kind: 'star', colors: ['#FFC24B', '#FFE27A', '#FFFFFF'] } },
    { id: 'phao-giay', slot: 'fx', name: 'Pháo giấy', rarity: 'hiem', price: 250, ch: 8, memory: 'Chúc mừng sinh nhật anh!', fx: { kind: 'confetti', colors: ['#FF6F8E', '#FFC24B', '#4C8DE0', '#62BC7C', '#B79CF0'] } },
    { id: 'canh-sen', slot: 'fx', name: 'Cánh sen', rarity: 'suthi', price: 600, ch: 8, memory: 'Người ta mua sen để cắm bình. Còn cậu, ôm về để tặng em.', fx: { kind: 'petal', colors: ['#FFB0C0', '#FF8FA3', '#FFE0EA'] } },
    { id: 'may-sa-pa', slot: 'fx', name: 'Mây Sa Pa', rarity: 'suthi', price: 600, ch: 12, memory: 'Mây trôi ngang tầm mắt. Còn cậu, chỉ mải nhìn mỗi em.', fx: { kind: 'cloud', colors: ['#FFFFFF', '#DCE7F7'] } },

    // ---------- Cánh bướm ----------
    { id: 'canh-tim', slot: 'wing', name: 'Cánh Tím Hồng', rarity: 'thuong', price: 0, free: true, memory: 'Ăn đủ lá thì hoá bướm.',
      wing: { top: '#B79CF0', bottom: '#FFB0C0', mark: 'heart', markColor: '#FF6F8E', spot: '#FFF1C9', body: '#5B3E8F' } },
    { id: 'canh-hoang-hon', slot: 'wing', name: 'Cánh Hoàng Hôn', rarity: 'thuong', price: 100, ch: 4, memory: 'Phần đầu là hoàng hôn, không có ai, chỉ có chữ thương.',
      wing: { top: '#FF9F7A', bottom: '#FFD27A', mark: 'dot', markColor: '#FFF4D6', spot: '#FF6F8E', body: '#7A3B2E' } },
    { id: 'canh-bau-troi', slot: 'wing', name: 'Cánh Bầu Trời', rarity: 'hiem', price: 250, memory: 'Trời trong veo, hợp đi uống trà sữa đó.',
      wing: { top: '#8EC5FF', bottom: '#FFFFFF', mark: 'dot', markColor: '#FFFFFF', spot: '#4C8DE0', body: '#2F4E7A' } },
    { id: 'canh-sen', slot: 'wing', name: 'Cánh Sen', rarity: 'suthi', price: 600, ch: 8, memory: 'Mười lăm bông sen, gói mất trọn một buổi chiều.',
      wing: { top: '#FFB0C0', bottom: '#FFE0EA', mark: 'lotus', markColor: '#FFFFFF', spot: '#FFE27A', body: '#3F8C5A' } },
    { id: 'canh-dem-sao', slot: 'wing', name: 'Cánh Đêm Sao', rarity: 'suthi', price: 600, ch: 2, memory: '“Rồi đến một ngày.” Một giọng nói quen thuộc vang lên.',
      wing: { top: '#3D3670', bottom: '#5A5294', mark: 'star', markColor: '#FFE27A', spot: '#FFE27A', body: '#1E1A3A', glow: true } },
    { id: 'canh-cau-vong', slot: 'wing', name: 'Cánh Cầu Vồng', rarity: 'huyenthoai', price: 1200, ch: 9, memory: 'Không phải Thái Nguyên đẹp. Mà là Thái Nguyên có em.',
      wing: { top: 'rainbow', bottom: '#FFF1C9', mark: 'heart', markColor: '#FFFFFF', spot: '#FF6F8E', body: '#5B3E8F', glow: true } },

    // ---------- Sự kiện Sa Pa · Mùa Mây (ev): trong thời gian sự kiện chỉ ra từ Vòng quay ----------
    { id: 'tho-cam', slot: 'skin', name: 'Sâu Thổ Cẩm', rarity: 'huyenthoai', price: 1500, ch: 12, ev: 'sapa',
      memory: 'Chợ Sa Pa đầy thổ cẩm sặc sỡ. Thứ anh muốn mang về nhất vẫn là em.',
      pal: { body: '#2F3B85', body2: '#2F3B85', head: '#B79CF0', feet: '#1E2660', ant: '#1E2660', antTip: '#FFC93C', mark: '#FFC93C', cocoon: '#4A55A0', cocoonLine: '#D62F45' },
      acc: 'khan', pattern: 'brocade', mark: 'diamond', glow: '#FFE9A0', antLen: 2 },
    { id: 'canh-tho-cam', slot: 'wing', name: 'Cánh Thổ Cẩm', rarity: 'suthi', price: 600, ch: 12, ev: 'sapa',
      memory: 'Sợi chỉ đỏ, sợi chỉ vàng đan vào nhau, như hai đứa mình.',
      wing: { top: '#2F3B85', bottom: '#D62F45', pattern: 'brocade', mark: 'diamond', markColor: '#FFC93C', spot: '#FFC93C', body: '#1E2660' } },
    { id: 'hoa-van', slot: 'fx', name: 'Hoa Văn Thổ Cẩm', rarity: 'suthi', price: 600, ch: 12, ev: 'sapa',
      memory: 'Hoa văn thêu tay, chẳng tấm nào giống tấm nào. Em cũng vậy, chỉ có một.',
      fx: { kind: 'diamond', colors: ['#D62F45', '#FFC93C', '#2F3B85', '#2FA36B'] } },
    { id: 'lua-chin', slot: 'skin', name: 'Sâu Lúa Chín', rarity: 'hiem', price: 250, ch: 12, ev: 'sapa',
      memory: 'Tháng mười, lúa trên ruộng bậc thang chín vàng tới chân mây.',
      pal: { body: '#EDB547', body2: '#E3A63A', head: '#EDB547', feet: '#8A5E12', ant: '#8A5E12', antTip: '#7CB342', mark: '#FFF1C9', cocoon: '#F7DB98', cocoonLine: '#E3A63A' },
      acc: 'rice', mark: 'grain' },
    { id: 'canh-ruong', slot: 'wing', name: 'Cánh Ruộng Bậc Thang', rarity: 'hiem', price: 250, ch: 12, ev: 'sapa',
      memory: 'Từng bậc ruộng nối nhau lên tận trời, như mình từng bước lại gần nhau.',
      wing: { top: '#F2C14E', bottom: '#9CC856', pattern: 'terrace', mark: 'none', markColor: '#FFF1C9', spot: '#FFF1C9', body: '#6B4A1E' } },
    { id: 'hat-lua', slot: 'fx', name: 'Hạt Lúa Vàng', rarity: 'thuong', price: 80, ch: 12, ev: 'sapa',
      memory: 'Gió núi thổi qua, cả thung lũng thơm mùi lúa mới.',
      fx: { kind: 'grain', colors: ['#F2C14E', '#E3A63A', '#FFE08A'] } },

    // ---------- Nền: khung cảnh phía sau khi chơi Sâu Tím ----------
    // theme: màu lá, cành và trời của trò chơi khi dùng nền này (night: giao diện tối).
    { id: 'troi', slot: 'bg', name: 'Trời hôm nay', rarity: 'thuong', price: 0, free: true,
      memory: 'Nắng, mưa hay đêm sao, giống đúng bầu trời ngoài kia.', bg: { kind: 'weather' } },
    { id: 'nen-sapa', slot: 'bg', name: 'Nền Sa Pa', rarity: 'suthi', price: 600, ch: 12, ev: 'sapa',
      memory: 'Núi nối núi, mây vắt ngang lưng trời. Sa Pa đẹp nhất là lúc có em ở đó.', bg: { kind: 'sapa' } },

    // ---------- Sự kiện Halloween ----------
    { id: 'bi-ngo', slot: 'skin', name: 'Sâu Bí Ngô', rarity: 'huyenthoai', price: 1500, ev: 'halloween',
      memory: 'Không cho kẹo là bị ghẹo đó nha!',
      pal: { body: '#FF9A3C', body2: '#F98B2A', head: '#FF9A3C', feet: '#8A4A16', ant: '#4E7A2A', antTip: '#7CB342', blush: 'rgba(232,70,60,0.5)', mark: '#FFD34E', shine: 'rgba(255,255,255,0.3)', cocoon: '#FFB45E', cocoonLine: '#E07A1F' },
      acc: 'stem', pattern: 'pumpkin', mark: 'jack', glow: '#FFE0A0', antLen: 1.9 },
    { id: 'phu-thuy', slot: 'skin', name: 'Sâu Phù Thủy', rarity: 'hiem', price: 250, ev: 'halloween',
      memory: 'Phù thủy nhỏ tên Thủy, chỉ biết đúng một câu thần chú.',
      pal: { body: '#A88BE8', body2: '#A88BE8', head: '#B79CF0', feet: '#3E2A66', ant: '#3E2A66', antTip: '#FF8A1F', mark: '#FFC24B', cocoon: '#7E5BC2', cocoonLine: '#3E2A66' },
      acc: 'witch', pattern: 'stripe', mark: 'star' },
    { id: 'canh-doi', slot: 'wing', name: 'Cánh Dơi', rarity: 'suthi', price: 600, ev: 'halloween',
      memory: 'Nửa đêm hoá dơi, bay sang Thái Nguyên một vòng rồi về.',
      wing: { shape: 'bat', top: '#3A2A5C', bottom: '#3A2A5C', bone: '#7E5BC2', mark: 'none', markColor: '#FF8A1F', spot: '#FF8A1F', body: '#1E1430', eye: '#FFB347' } },
    { id: 'doi-bay', slot: 'fx', name: 'Dơi Con', rarity: 'hiem', price: 250, ev: 'halloween',
      memory: 'Mỗi miếng lá là một chú dơi con vỗ cánh bay ra.',
      fx: { kind: 'bat', colors: ['#5C4585', '#7E5BC2', '#3A2A5C'] } },
    { id: 'keo-ma', slot: 'fx', name: 'Kẹo Ma', rarity: 'thuong', price: 80, ev: 'halloween',
      memory: 'Lá ăn vào hoá thành kẹo. Phần em hết đó.',
      fx: { kind: 'candy', colors: ['#FF8A1F', '#9B5DE5', '#7CC46E', '#FF6F8E'] } },
    { id: 'nen-lau-dai', slot: 'bg', name: 'Nền Lâu Đài', rarity: 'suthi', price: 600, ev: 'halloween',
      memory: 'Lâu đài trên đồi, đèn bí ngô sáng cả đêm, chờ người cùng đi chơi Halloween.',
      bg: { kind: 'castle', theme: { night: true, sky: '#140A2A', cloud: '#3D2A5C', mote: null, stars: false, rain: false, leaf: '#FF9A3C', leafLight: '#FFC07A', leafDark: '#B8561A', stem: '#6B4A8C' } } },
  ];

  // ================= Sự kiện =================
  // Trong thời gian sự kiện, món có ev chỉ ra từ Vòng quay; chưa tới ngày thì ẩn hẳn;
  // hết sự kiện thì thành món thường (mua được, có trong Hộp quà).
  const EVENTS = [
    {
      id: 'sapa',
      name: 'Sa Pa · Mùa Mây',
      short: 'Sa Pa',
      tagline: 'Vòng quay đã ra mắt!',
      start: Date.parse('2026-10-21T00:00:00+07:00'),
      end: Date.parse('2026-11-21T00:00:00+07:00'),
      price: 100,     // đốt mỗi lượt quay
      pity: 25,       // tối đa 25 lượt là có món Huyền thoại của sự kiện
      refund: 50,     // trúng món đã có thì hoàn lại
      sets: [
        { id: 'tho-cam', name: 'Bộ Thổ Cẩm', items: ['skin:tho-cam', 'wing:canh-tho-cam', 'fx:hoa-van'] },
        { id: 'lua-chin', name: 'Bộ Lúa Chín', items: ['skin:lua-chin', 'wing:canh-ruong', 'fx:hat-lua', 'bg:nen-sapa'] },
      ],
      // Thứ tự ô trên vòng quay (theo chiều kim đồng hồ từ đỉnh); w là tỉ lệ phần trăm.
      wheel: [
        { item: 'skin:tho-cam', w: 4 },
        { item: 'fx:hat-lua', w: 14 },
        { item: 'wing:canh-tho-cam', w: 8 },
        { dot: 40, w: 20 },
        { item: 'skin:lua-chin', w: 12 },
        { item: 'fx:hoa-van', w: 8 },
        { item: 'wing:canh-ruong', w: 12 },
        { item: 'bg:nen-sapa', w: 8 },
        { dot: 100, w: 14 },
      ],
    },
    {
      id: 'halloween',
      name: 'Lâu Đài Bí Ngô',
      short: 'Halloween',
      tagline: 'Halloween: vòng quay ma quái đã mở!',
      teaser: 'Halloween tới rồi, cổng lâu đài sắp mở…',
      soon: Date.parse('2026-10-21T00:00:00+07:00'),  // từ hôm nay hiện bảng đếm ngược
      start: Date.parse('2026-10-26T00:00:00+07:00'),
      // Máy của anh Quang được chơi thử trước từ hôm nay; máy của Thủy vẫn chờ tới ngày mở.
      early: { quang: Date.parse('2026-10-21T00:00:00+07:00') },
      end: Date.parse('2026-11-10T00:00:00+07:00'),
      style: 'spooky',
      price: 100,
      pity: 25,
      refund: 50,
      sets: [
        { id: 'bi-ngo', name: 'Bộ Bí Ngô', items: ['skin:bi-ngo', 'wing:canh-doi', 'fx:keo-ma'] },
        { id: 'lau-dai', name: 'Bộ Lâu Đài', items: ['skin:phu-thuy', 'fx:doi-bay', 'bg:nen-lau-dai'] },
      ],
      wheel: [
        { item: 'skin:bi-ngo', w: 4 },
        { item: 'fx:keo-ma', w: 14 },
        { item: 'wing:canh-doi', w: 8 },
        { dot: 40, w: 28 },
        { item: 'skin:phu-thuy', w: 12 },
        { item: 'bg:nen-lau-dai', w: 8 },
        { item: 'fx:doi-bay', w: 12 },
        { dot: 100, w: 14 },
      ],
    },
  ];
  const eventById = (id) => EVENTS.find((e) => e.id === id) || null;
  // Ngày mở thật của sự kiện trên máy này (máy được thử trước thì mở sớm hơn).
  const WHO = (() => { try { return localStorage.getItem('lpn:who'); } catch (e) { return null; } })();
  const startOf = (e) => (e.early && e.early[WHO] ? Math.min(e.start, e.early[WHO]) : e.start);
  const isPreview = (e, now) => { now = now || Date.now(); return now >= startOf(e) && now < e.start; };
  const activeEvent = (now) => {
    now = now || Date.now();
    return EVENTS.find((e) => now >= startOf(e) && now < e.end) || null;
  };
  // Sự kiện hiện trong Tiệm: đang diễn ra, hoặc sắp diễn ra (đã tới ngày đếm ngược).
  const visibleEvents = (now) => {
    now = now || Date.now();
    return EVENTS.filter((e) => now >= Math.min(e.soon || e.start, startOf(e)) && now < e.end);
  };
  // 'normal' | 'event' (chỉ có ở vòng quay) | 'hidden' (sự kiện chưa bắt đầu)
  function itemState(item, now) {
    if (!item.ev) return 'normal';
    const e = eventById(item.ev);
    now = now || Date.now();
    if (!e) return 'normal';
    if (now < startOf(e)) return 'hidden';
    return now < e.end ? 'event' : 'normal';
  }

  const BY_ID = {};
  for (const it of ITEMS) BY_ID[it.slot + ':' + it.id] = it;
  const DEFAULT = { skin: 'tim', fx: 'la', wing: 'canh-tim', bg: 'troi' };
  const get = (slot, id) => BY_ID[slot + ':' + id] || BY_ID[slot + ':' + DEFAULT[slot]];
  const byKey = (key) => BY_ID[key] || null;
  const palette = (skin) => Object.assign({}, BASE, skin.pal || {});

  // ================= Hình cơ bản =================
  function heartPath(x, cx, cy, s) {
    x.beginPath();
    x.moveTo(cx, cy + s * 0.9);
    x.bezierCurveTo(cx - s * 1.4, cy, cx - s * 0.8, cy - s * 1.1, cx, cy - s * 0.35);
    x.bezierCurveTo(cx + s * 0.8, cy - s * 1.1, cx + s * 1.4, cy, cx, cy + s * 0.9);
    x.closePath();
  }
  function starPath(x, cx, cy, ro, ri, n) {
    x.beginPath();
    for (let i = 0; i < (n || 5) * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / (n || 5);
      const rr = i % 2 ? ri : ro;
      x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    x.closePath();
  }
  function lotusPath(x, cx, cy, s) {
    // Bông sen nhỏ: năm cánh xoè lên như cái quạt.
    for (const a of [-1.1, -0.55, 0, 0.55, 1.1]) {
      x.save();
      x.translate(cx, cy + s * 0.55);
      x.rotate(a);
      x.beginPath();
      x.moveTo(0, 0);
      x.quadraticCurveTo(s * 0.42, -s * 0.6, 0, -s * (a === 0 ? 1.25 : 1.05));
      x.quadraticCurveTo(-s * 0.42, -s * 0.6, 0, 0);
      x.fill();
      x.restore();
    }
  }
  function dropPath(x, cx, cy, s) {
    x.beginPath();
    x.moveTo(cx, cy - s);
    x.bezierCurveTo(cx + s * 0.9, cy, cx + s * 0.6, cy + s * 0.9, cx, cy + s * 0.9);
    x.bezierCurveTo(cx - s * 0.6, cy + s * 0.9, cx - s * 0.9, cy, cx, cy - s);
    x.closePath();
  }
  function moonPath(x, cx, cy, s) {
    x.beginPath();
    x.arc(cx, cy, s, Math.PI * 0.35, Math.PI * 1.65);
    x.arc(cx + s * 0.45, cy - s * 0.1, s * 0.8, Math.PI * 1.55, Math.PI * 0.45, true);
    x.closePath();
  }
  function diamondPath(x, cx, cy, s) {
    x.beginPath();
    x.moveTo(cx, cy - s);
    x.lineTo(cx + s * 0.72, cy);
    x.lineTo(cx, cy + s);
    x.lineTo(cx - s * 0.72, cy);
    x.closePath();
  }
  function snowPath(x, cx, cy, s, lw) {
    x.lineWidth = lw;
    x.lineCap = 'round';
    x.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      x.moveTo(cx - Math.cos(a) * s, cy - Math.sin(a) * s);
      x.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
    }
    x.stroke();
  }

  // Dấu nhỏ trên đốt thân (mỗi 5 đốt có một đốt mang dấu).
  function drawMark(x, kind, cx, cy, s, color, S) {
    x.fillStyle = color;
    x.strokeStyle = color;
    if (kind === 'heart') { heartPath(x, cx, cy, s); x.fill(); }
    else if (kind === 'dot') { x.beginPath(); x.arc(cx, cy, s * 0.55, 0, TAU); x.fill(); }
    else if (kind === 'star') { starPath(x, cx, cy, s * 0.95, s * 0.42); x.fill(); }
    else if (kind === 'lotus') { lotusPath(x, cx, cy, s * 0.9); }
    else if (kind === 'snow') { snowPath(x, cx, cy, s * 0.85, 1.6 * S); }
    else if (kind === 'drop') { dropPath(x, cx, cy, s * 0.8); x.fill(); }
    else if (kind === 'moon') { moonPath(x, cx, cy, s * 0.75); x.fill(); }
    else if (kind === 'diamond') {
      // hoa văn quả trám của thổ cẩm: trám vàng, lõi đỏ
      diamondPath(x, cx, cy, s); x.fill();
      x.fillStyle = '#D62F45';
      diamondPath(x, cx, cy, s * 0.45); x.fill();
    } else if (kind === 'grain') {
      // hai hạt lúa chụm lại
      for (const a of [-0.5, 0.5]) { x.beginPath(); x.ellipse(cx + a * s * 0.62, cy, s * 0.3, s * 0.62, a, 0, TAU); x.fill(); }
    } else if (kind === 'jack') {
      // mặt đèn bí ngô: hai mắt tam giác, miệng răng cưa, sáng vàng từ bên trong
      x.beginPath();
      for (const side of [-1, 1]) {
        x.moveTo(cx + side * s * 0.66, cy - s * 0.02);
        x.lineTo(cx + side * s * 0.18, cy - s * 0.02);
        x.lineTo(cx + side * s * 0.44, cy - s * 0.5);
        x.closePath();
      }
      x.fill();
      x.beginPath();
      x.moveTo(cx - s * 0.72, cy + s * 0.22);
      x.lineTo(cx - s * 0.4, cy + s * 0.36);
      x.lineTo(cx - s * 0.22, cy + s * 0.22);
      x.lineTo(cx, cy + s * 0.38);
      x.lineTo(cx + s * 0.22, cy + s * 0.22);
      x.lineTo(cx + s * 0.4, cy + s * 0.36);
      x.lineTo(cx + s * 0.72, cy + s * 0.22);
      x.quadraticCurveTo(cx, cy + s * 1.0, cx - s * 0.72, cy + s * 0.22);
      x.fill();
    }
  }

  // ================= Vân bí ngô, sọc tất phù thủy =================
  function clipBody(x, r, bean) {
    x.beginPath();
    if (bean) x.ellipse(0, 0, r, r * 0.92, 0, 0, TAU); else x.arc(0, 0, r, 0, TAU);
    x.clip();
  }
  function pumpkinRibs(x, r, bean) {
    x.save();
    clipBody(x, r, bean);
    x.fillStyle = 'rgba(190, 80, 0, 0.18)';
    x.beginPath(); x.ellipse(0, r * 0.6, r * 1.1, r * 0.6, 0, 0, TAU); x.fill();
    x.strokeStyle = '#D96A12';
    x.lineWidth = r * 0.09;
    x.globalAlpha = 0.6;
    for (const k of [0.36, 0.74]) { x.beginPath(); x.ellipse(0, 0, r * k, r * 1.02, 0, 0, TAU); x.stroke(); }
    x.globalAlpha = 1;
    x.restore();
  }
  function stockingStripes(x, r, bean, color) {
    x.save();
    clipBody(x, r, bean);
    x.fillStyle = color;
    for (const y of [-0.66, -0.1, 0.46]) x.fillRect(-r, y * r, r * 2, r * 0.26);
    x.restore();
  }

  // ================= Hoa văn thổ cẩm =================
  const BRO = { red: '#D62F45', pink: '#E0457B', gold: '#FFC93C', green: '#2FA36B', cream: '#FFF6E6' };
  // Một hàng răng cưa (tam giác) chạy ngang từ x0 đến x1, cao h quanh trục y.
  function zigzag(x, x0, x1, y, h, n) {
    const w = (x1 - x0) / n;
    x.beginPath();
    for (let i = 0; i < n; i++) {
      x.moveTo(x0 + i * w, y + h / 2);
      x.lineTo(x0 + i * w + w / 2, y - h / 2);
      x.lineTo(x0 + (i + 1) * w, y + h / 2);
      x.closePath();
    }
    x.fill();
  }
  // Dải thổ cẩm ngang thân đốt: viền xanh, giữa đỏ (hoặc hồng) có răng cưa vàng, chấm chỉ trắng.
  function brocadeBand(x, r, variant, bean) {
    x.save();
    x.beginPath();
    if (bean) x.ellipse(0, 0, r, r * 0.92, 0, 0, TAU); else x.arc(0, 0, r, 0, TAU);
    x.clip();
    const h = r * 0.36;
    x.fillStyle = BRO.green;
    x.fillRect(-r, -h - r * 0.1, r * 2, r * 0.1);
    x.fillRect(-r, h, r * 2, r * 0.1);
    x.fillStyle = variant === 1 ? BRO.pink : BRO.red;
    x.fillRect(-r, -h, r * 2, h * 2);
    if (variant !== 2) { x.fillStyle = BRO.gold; zigzag(x, -r, r, 0, h * 1.1, 5); }
    x.fillStyle = BRO.cream;
    x.beginPath();
    for (let i = 0; i <= 8; i++) {
      const px = -r + (i * r) / 4;
      x.moveTo(px + r * 0.05, -h - r * 0.24); x.arc(px, -h - r * 0.24, r * 0.05, 0, TAU);
      x.moveTo(px + r * 0.05, h + r * 0.24); x.arc(px, h + r * 0.24, r * 0.05, 0, TAU);
    }
    x.fill();
    x.restore();
  }

  // ================= Đốt thân =================
  // Vẽ một đốt tâm (0,0) bán kính r. variant: 0 màu chính, 1 màu phụ, 2 có dấu.
  function drawSegment(x, r, skin, variant, S) {
    const p = palette(skin);
    x.fillStyle = p.feet;
    x.beginPath(); x.ellipse(-r * 0.92, r * 0.35, r * 0.24, r * 0.17, 0.3, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(r * 0.92, r * 0.35, r * 0.24, r * 0.17, -0.3, 0, TAU); x.fill();
    x.fillStyle = variant === 1 ? p.body2 : p.body;
    x.beginPath();
    if (skin.shape === 'bean') x.ellipse(0, 0, r, r * 0.92, 0, 0, TAU);
    else x.arc(0, 0, r, 0, TAU);
    x.fill();
    if (skin.pattern === 'brocade') brocadeBand(x, r, variant, skin.shape === 'bean');
    else if (skin.pattern === 'pumpkin') pumpkinRibs(x, r, skin.shape === 'bean');
    else if (skin.pattern === 'stripe') stockingStripes(x, r, skin.shape === 'bean', p.feet);
    x.fillStyle = p.shine;
    x.beginPath(); x.ellipse(-r * 0.3, -r * 0.38, r * 0.42, r * 0.24, -0.4, 0, TAU); x.fill();
    if (variant === 2 && skin.mark !== 'none') drawMark(x, skin.mark || 'heart', 0, skin.pattern ? 0 : r * 0.05, skin.mark === 'jack' ? r * 0.62 : r * 0.32, p.mark, S);
  }

  // ================= Phụ kiện trên đầu =================
  // Vẽ trong toạ độ của đầu (tâm đầu ở gốc). back = phần nằm sau đầu (vẽ trước đầu).
  function drawAccessory(x, acc, r, S, t, back) {
    if (!acc) return;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    if (acc === 'nightcap') {
      if (back) return;
      x.fillStyle = '#7FA7E8';
      x.beginPath();
      x.moveTo(-r * 0.95, -r * 0.45);
      x.quadraticCurveTo(-r * 0.6, -r * 1.55, r * 0.2, -r * 1.45);
      x.quadraticCurveTo(r * 1.2, -r * 1.35, r * 1.35, -r * 0.55);
      x.quadraticCurveTo(r * 0.9, -r * 0.95, r * 0.95, -r * 0.45);
      x.quadraticCurveTo(0, -r * 0.85, -r * 0.95, -r * 0.45);
      x.fill();
      x.strokeStyle = '#FFFFFF';
      x.lineWidth = 2 * S;
      x.globalAlpha = 0.7;
      x.beginPath(); x.moveTo(-r * 0.55, -r * 1.05); x.quadraticCurveTo(0, -r * 1.25, r * 0.55, -r * 1.2); x.stroke();
      x.globalAlpha = 1;
      x.fillStyle = '#FFFFFF';
      x.beginPath(); x.arc(r * 1.35, -r * 0.5, r * 0.2, 0, TAU); x.fill();
      x.fillStyle = '#5E86C9';
      x.beginPath(); x.ellipse(0, -r * 0.62, r * 0.98, r * 0.18, 0, 0, TAU); x.fill();
    } else if (acc === 'noodle') {
      if (back) return;
      const y = -r * 0.95;
      // đũa
      x.strokeStyle = '#C98A4A';
      x.lineWidth = 2.2 * S;
      x.beginPath(); x.moveTo(r * 0.15, y - r * 0.1); x.lineTo(r * 0.95, y - r * 0.85); x.stroke();
      x.beginPath(); x.moveTo(r * 0.3, y - r * 0.05); x.lineTo(r * 1.1, y - r * 0.7); x.stroke();
      // sợi mì
      x.strokeStyle = '#FFE08A';
      x.lineWidth = 2 * S;
      for (let i = -2; i <= 2; i++) {
        x.beginPath();
        x.moveTo(i * r * 0.14, y - r * 0.05);
        x.quadraticCurveTo(i * r * 0.14 + r * 0.08, y - r * 0.32, i * r * 0.14, y - r * 0.42 - Math.abs(i) * r * 0.02);
        x.stroke();
      }
      // bát
      x.fillStyle = '#FFFFFF';
      x.beginPath();
      x.moveTo(-r * 0.7, y);
      x.lineTo(r * 0.7, y);
      x.quadraticCurveTo(r * 0.62, y + r * 0.5, 0, y + r * 0.52);
      x.quadraticCurveTo(-r * 0.62, y + r * 0.5, -r * 0.7, y);
      x.fill();
      x.fillStyle = '#E8554E';
      x.fillRect(-r * 0.62, y + r * 0.1, r * 1.24, r * 0.09);
      x.fillStyle = '#F4C542';
      x.beginPath(); x.ellipse(0, y, r * 0.7, r * 0.12, 0, 0, TAU); x.fill();
    } else if (acc === 'nerd') {
      if (back) {
        // cà vạt dưới cằm
        x.fillStyle = '#E8554E';
        x.beginPath();
        x.moveTo(-r * 0.14, r * 0.88); x.lineTo(r * 0.14, r * 0.88); x.lineTo(r * 0.08, r * 1.02);
        x.lineTo(r * 0.2, r * 1.55); x.lineTo(0, r * 1.75); x.lineTo(-r * 0.2, r * 1.55); x.lineTo(-r * 0.08, r * 1.02);
        x.closePath(); x.fill();
        return;
      }
      x.strokeStyle = '#2A1E3D';
      x.lineWidth = 2.2 * S;
      x.fillStyle = 'rgba(255,255,255,0.25)';
      for (const side of [-1, 1]) {
        x.beginPath(); x.arc(side * r * 0.33, -r * 0.1, r * 0.25, 0, TAU); x.fill(); x.stroke();
      }
      x.beginPath(); x.moveTo(-r * 0.08, -r * 0.12); x.quadraticCurveTo(0, -r * 0.2, r * 0.08, -r * 0.12); x.stroke();
      x.beginPath(); x.moveTo(-r * 0.58, -r * 0.14); x.lineTo(-r * 0.9, -r * 0.24); x.stroke();
      x.beginPath(); x.moveTo(r * 0.58, -r * 0.14); x.lineTo(r * 0.9, -r * 0.24); x.stroke();
    } else if (acc === 'rainhat') {
      if (back) return;
      x.fillStyle = '#FFC21F';
      x.beginPath(); x.ellipse(0, -r * 0.62, r * 1.3, r * 0.26, -0.08, 0, TAU); x.fill();
      x.beginPath();
      x.moveTo(-r * 0.75, -r * 0.62);
      x.quadraticCurveTo(-r * 0.7, -r * 1.35, 0, -r * 1.38);
      x.quadraticCurveTo(r * 0.7, -r * 1.35, r * 0.75, -r * 0.62);
      x.fill();
      x.strokeStyle = '#E0A400';
      x.lineWidth = 1.6 * S;
      x.beginPath(); x.moveTo(-r * 0.7, -r * 0.8); x.quadraticCurveTo(0, -r * 0.95, r * 0.7, -r * 0.8); x.stroke();
    } else if (acc === 'partyhat') {
      if (back) return;
      x.save();
      x.translate(r * 0.25, -r * 0.7);
      x.rotate(0.25);
      x.fillStyle = '#FF8FA3';
      x.beginPath(); x.moveTo(-r * 0.5, 0); x.lineTo(0, -r * 1.25); x.lineTo(r * 0.5, 0); x.closePath(); x.fill();
      x.fillStyle = '#FFE27A';
      for (let i = 0; i < 3; i++) {
        x.beginPath(); x.arc(-r * 0.15 + i * r * 0.15, -r * 0.25 - i * r * 0.3, r * 0.08, 0, TAU); x.fill();
      }
      x.fillStyle = '#FFFFFF';
      x.beginPath(); x.arc(0, -r * 1.3, r * 0.16, 0, TAU); x.fill();
      x.strokeStyle = '#FFFFFF';
      x.lineWidth = 2 * S;
      x.beginPath(); x.moveTo(-r * 0.5, 0); x.lineTo(r * 0.5, 0); x.stroke();
      x.restore();
    } else if (acc === 'lotus') {
      if (back) return;
      const y = -r * 0.85;
      const petals = [[-0.62, 0.55], [-0.32, 0.25], [0, 0], [0.32, -0.25], [0.62, -0.55]];
      for (const [px, a] of petals) {
        x.fillStyle = Math.abs(px) > 0.5 ? '#FF8FA3' : '#FFB0C0';
        x.beginPath(); x.ellipse(px * r, y + Math.abs(px) * r * 0.2, r * 0.18, r * 0.42, a, 0, TAU); x.fill();
      }
      x.fillStyle = '#FFE27A';
      x.beginPath(); x.arc(0, y + r * 0.22, r * 0.12, 0, TAU); x.fill();
      x.fillStyle = '#62BC7C';
      x.beginPath(); x.ellipse(0, y + r * 0.34, r * 0.7, r * 0.1, 0, 0, TAU); x.fill();
    } else if (acc === 'beanie') {
      if (back) {
        // khăn len quấn cổ, đuôi khăn bay theo nhịp
        x.fillStyle = '#E8554E';
        x.beginPath(); x.ellipse(0, r * 0.88, r * 0.85, r * 0.22, 0, 0, TAU); x.fill();
        x.save();
        x.translate(r * 0.45, r * 0.95);
        x.rotate(0.35 + Math.sin(t * 4) * 0.12);
        x.fillRect(-r * 0.13, 0, r * 0.26, r * 0.7);
        x.fillStyle = '#FFFFFF';
        x.fillRect(-r * 0.13, r * 0.18, r * 0.26, r * 0.07);
        x.fillRect(-r * 0.13, r * 0.4, r * 0.26, r * 0.07);
        x.restore();
        return;
      }
      x.fillStyle = '#E8554E';
      x.beginPath();
      x.moveTo(-r * 0.92, -r * 0.42);
      x.quadraticCurveTo(-r * 0.95, -r * 1.3, 0, -r * 1.32);
      x.quadraticCurveTo(r * 0.95, -r * 1.3, r * 0.92, -r * 0.42);
      x.closePath();
      x.fill();
      x.fillStyle = '#FFFFFF';
      x.beginPath(); x.ellipse(0, -r * 0.47, r * 0.98, r * 0.2, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.55)';
      x.lineWidth = 1.6 * S;
      for (let i = -2; i <= 2; i++) {
        x.beginPath(); x.moveTo(i * r * 0.3, -r * 0.62); x.lineTo(i * r * 0.26, -r * 1.15); x.stroke();
      }
      x.fillStyle = '#FFFFFF';
      x.beginPath(); x.arc(0, -r * 1.36, r * 0.22, 0, TAU); x.fill();
    } else if (acc === 'moon') {
      if (back) return;
      x.fillStyle = '#FFE27A';
      x.save();
      x.translate(r * 0.55, -r * 0.95);
      x.rotate(-0.4);
      moonPath(x, 0, 0, r * 0.32);
      x.fill();
      x.restore();
      x.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(t * 3));
      starPath(x, -r * 0.55, -r * 1.05, r * 0.14, r * 0.06);
      x.fill();
      x.globalAlpha = 1;
    } else if (acc === 'bow') {
      if (back) return;
      x.save();
      x.translate(r * 0.52, -r * 0.82);
      x.rotate(0.3);
      x.fillStyle = '#FF6F8E';
      x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-r * 0.6, -r * 0.55, -r * 0.62, 0); x.quadraticCurveTo(-r * 0.6, r * 0.5, 0, 0); x.fill();
      x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(r * 0.6, -r * 0.55, r * 0.62, 0); x.quadraticCurveTo(r * 0.6, r * 0.5, 0, 0); x.fill();
      x.fillStyle = '#FFFFFF';
      x.globalAlpha = 0.45;
      x.beginPath(); x.ellipse(-r * 0.32, -r * 0.12, r * 0.12, r * 0.06, -0.5, 0, TAU); x.fill();
      x.beginPath(); x.ellipse(r * 0.32, -r * 0.12, r * 0.12, r * 0.06, 0.5, 0, TAU); x.fill();
      x.globalAlpha = 1;
      x.fillStyle = '#E8456E';
      x.beginPath(); x.arc(0, 0, r * 0.15, 0, TAU); x.fill();
      x.restore();
    } else if (acc === 'khan') {
      // Khăn thổ cẩm quấn đầu, chùm quả bông đỏ vàng đung đưa bên phải.
      if (back) return;
      const B = (u) => { const v = 1 - u; return [(-0.97 * v * v + 0.97 * u * u) * r, (-0.38 * v * v - 0.62 * 2 * u * v - 0.38 * u * u) * r]; };
      const T = (u) => { const v = 1 - u; return [(-0.9 * v * v + 0.9 * u * u) * r, (-0.72 * v * v - 0.98 * 2 * u * v - 0.72 * u * u) * r]; };
      // đỉnh khăn đỏ
      x.fillStyle = BRO.red;
      x.beginPath();
      x.moveTo(-r * 0.95, -r * 0.5);
      x.quadraticCurveTo(-r * 0.92, -r * 1.42, 0, -r * 1.4);
      x.quadraticCurveTo(r * 0.92, -r * 1.42, r * 0.95, -r * 0.5);
      x.closePath();
      x.fill();
      x.strokeStyle = BRO.gold;
      x.lineWidth = 1.5 * S;
      x.globalAlpha = 0.8;
      x.beginPath(); x.moveTo(-r * 0.62, -r * 1.12); x.quadraticCurveTo(0, -r * 1.34, r * 0.62, -r * 1.12); x.stroke();
      x.globalAlpha = 1;
      // vành khăn chàm có răng cưa vàng
      x.fillStyle = '#2F3B85';
      x.beginPath();
      x.moveTo(-r * 0.97, -r * 0.38);
      x.quadraticCurveTo(0, -r * 0.62, r * 0.97, -r * 0.38);
      x.lineTo(r * 0.9, -r * 0.72);
      x.quadraticCurveTo(0, -r * 0.98, -r * 0.9, -r * 0.72);
      x.closePath();
      x.fill();
      x.strokeStyle = BRO.gold;
      x.lineWidth = 1.8 * S;
      x.beginPath();
      for (let i = 0; i <= 12; i++) {
        const u = 0.04 + (i / 12) * 0.92;
        const b = B(u), tt = T(u), k = i % 2 ? 0.28 : 0.72;
        const px = b[0] + (tt[0] - b[0]) * k, py = b[1] + (tt[1] - b[1]) * k;
        if (i) x.lineTo(px, py); else x.moveTo(px, py);
      }
      x.stroke();
      // chùm quả bông
      const sw = Math.sin(t * 3) * r * 0.06;
      const balls = [[1.06, -0.02, '#FF4F6A'], [1.26, -0.18, '#FFC93C'], [1.2, 0.2, '#FF8FC8']];
      x.strokeStyle = BRO.gold;
      x.lineWidth = 1.2 * S;
      for (const [bx, by] of balls) {
        x.beginPath(); x.moveTo(r * 0.86, -r * 0.5); x.lineTo(bx * r + sw, by * r); x.stroke();
      }
      for (const [bx, by, c] of balls) {
        x.fillStyle = c;
        x.beginPath(); x.arc(bx * r + sw, by * r, r * 0.13, 0, TAU); x.fill();
      }
    } else if (acc === 'stem') {
      // Cuống bí ngô, một sợi tua cuốn và chiếc lá.
      if (back) return;
      x.save();
      x.translate(r * 0.04, -r * 0.9);
      x.rotate(0.16);
      x.fillStyle = '#5E7A2A';
      x.beginPath();
      x.moveTo(-r * 0.14, r * 0.1);
      x.lineTo(-r * 0.11, -r * 0.4);
      x.quadraticCurveTo(0, -r * 0.52, r * 0.13, -r * 0.42);
      x.lineTo(r * 0.15, r * 0.1);
      x.closePath();
      x.fill();
      x.restore();
      x.strokeStyle = '#7CB342';
      x.lineWidth = 1.7 * S;
      x.beginPath();
      x.moveTo(r * 0.16, -r * 1.08);
      x.bezierCurveTo(r * 0.5, -r * 1.35, r * 0.8, -r * 1.0, r * 0.58, -r * 0.86);
      x.bezierCurveTo(r * 0.44, -r * 0.8, r * 0.44, -r * 1.02, r * 0.62, -r * 1.0);
      x.stroke();
      x.fillStyle = '#7CB342';
      x.beginPath(); x.ellipse(-r * 0.38, -r * 1.12, r * 0.3, r * 0.13, -0.5, 0, TAU); x.fill();
      x.strokeStyle = '#4E7A2A';
      x.lineWidth = 1.1 * S;
      x.beginPath(); x.moveTo(-r * 0.12, -r * 0.98); x.lineTo(-r * 0.6, -r * 1.24); x.stroke();
    } else if (acc === 'witch') {
      // Mũ phù thủy chóp cong, dải cam, khoá vàng, một ngôi sao nhỏ.
      if (back) return;
      x.save();
      x.translate(r * 0.08, -r * 0.62);
      x.rotate(0.12);
      x.fillStyle = '#2A1B3D';
      x.beginPath(); x.ellipse(0, 0, r * 1.25, r * 0.24, 0, 0, TAU); x.fill();
      x.beginPath();
      x.moveTo(-r * 0.62, -r * 0.05);
      x.quadraticCurveTo(-r * 0.4, -r * 0.9, -r * 0.05, -r * 1.25);
      x.quadraticCurveTo(r * 0.25, -r * 1.55, r * 0.78, -r * 1.42);
      x.quadraticCurveTo(r * 0.3, -r * 1.2, r * 0.45, -r * 0.6);
      x.quadraticCurveTo(r * 0.55, -r * 0.3, r * 0.62, -r * 0.05);
      x.closePath();
      x.fill();
      x.fillStyle = '#FF8A1F';
      x.beginPath();
      x.moveTo(-r * 0.6, -r * 0.12);
      x.quadraticCurveTo(0, -r * 0.28, r * 0.6, -r * 0.12);
      x.lineTo(r * 0.56, -r * 0.34);
      x.quadraticCurveTo(0, -r * 0.48, -r * 0.54, -r * 0.34);
      x.closePath();
      x.fill();
      x.strokeStyle = '#FFE27A';
      x.lineWidth = 1.6 * S;
      x.strokeRect(-r * 0.11, -r * 0.38, r * 0.22, r * 0.2);
      x.fillStyle = '#FFE27A';
      x.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(t * 2.5));
      starPath(x, -r * 0.2, -r * 0.82, r * 0.13, r * 0.055);
      x.fill();
      x.globalAlpha = 1;
      x.restore();
    } else if (acc === 'rice') {
      // Một bông lúa cắm trên đầu, trĩu hạt cong xuống, đung đưa theo gió.
      if (back) return;
      x.save();
      x.translate(-r * 0.12, -r * 0.92);
      x.rotate(-0.12 + Math.sin(t * 2) * 0.07);
      const P = (u) => { const v = 1 - u; return [2 * u * v * r * 0.1 + u * u * r * 0.78, 2 * u * v * -r * 0.95 + u * u * -r * 0.72]; };
      x.fillStyle = '#7CB342';
      x.beginPath(); x.ellipse(-r * 0.28, -r * 0.3, r * 0.1, r * 0.36, -0.5, 0, TAU); x.fill();
      x.strokeStyle = '#A08A2A';
      x.lineWidth = 1.8 * S;
      x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(r * 0.1, -r * 0.95, r * 0.78, -r * 0.72); x.stroke();
      for (let i = 0; i < 7; i++) {
        const u = 0.42 + i * 0.09;
        const [px, py] = P(u), [qx, qy] = P(u + 0.01);
        const a = Math.atan2(qy - py, qx - px);
        for (const side of [-1, 1]) {
          x.fillStyle = side < 0 ? '#F2C14E' : '#E3A63A';
          x.beginPath();
          x.ellipse(px + Math.cos(a + side * 1.2) * r * 0.1, py + Math.sin(a + side * 1.2) * r * 0.1, r * 0.06, r * 0.12, a + side * 0.6 + Math.PI / 2, 0, TAU);
          x.fill();
        }
      }
      x.restore();
    }
  }

  // ================= Đầu =================
  // st: { ant, bob, happy, blink, sad, chew, mouthOpen, t }
  function drawHead(x, r, skin, st, S) {
    const p = palette(skin);
    const t = st.t || 0;
    const bean = skin.shape === 'bean';
    drawAccessory(x, skin.acc, r, S, t, true);
    // Râu
    x.strokeStyle = p.ant;
    x.lineWidth = 2.2 * S;
    x.lineCap = 'round';
    const bob = (st.bob || 0) * 3 * S;
    for (const side of [-1, 1]) {
      // antLen: râu dài hơn cho skin đội khăn cao, để râu vẫn nhô hẳn lên khỏi khăn
      const tx = side * r * 0.8 + (st.ant || 0), ty = -r * (skin.antLen || (bean ? 1.7 : 1.6)) - bob;
      x.beginPath();
      x.moveTo(side * r * 0.4, -r * 0.75);
      x.quadraticCurveTo(side * r * 0.45, -r * 1.35, tx, ty);
      x.stroke();
      if (skin.glow) {
        x.fillStyle = skin.glow;
        x.globalAlpha = 0.35 + 0.25 * Math.abs(Math.sin(t * 3 + side));
        x.beginPath(); x.arc(tx, ty, (skin.antLen ? 5.5 : 7) * S, 0, TAU); x.fill();
        x.globalAlpha = 1;
      }
      x.fillStyle = p.antTip;
      if (skin.id === 'be-hong') { heartPath(x, tx, ty, 3.6 * S); x.fill(); }
      else { x.beginPath(); x.arc(tx, ty, 3.8 * S, 0, TAU); x.fill(); }
    }
    // Đầu
    x.fillStyle = p.head;
    x.beginPath();
    if (bean) x.ellipse(0, -r * 0.06, r * 1.02, r * 1.12, 0, 0, TAU);
    else x.arc(0, 0, r, 0, TAU);
    x.fill();
    if (skin.pattern === 'pumpkin') pumpkinRibs(x, r, false);
    x.fillStyle = p.shine;
    x.beginPath(); x.ellipse(-r * 0.34, -r * 0.42, r * 0.36, r * 0.2, -0.5, 0, TAU); x.fill();
    x.fillStyle = p.blush;
    x.beginPath(); x.ellipse(-r * 0.56, r * 0.24, r * 0.17, r * 0.11, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(r * 0.56, r * 0.24, r * 0.17, r * 0.11, 0, 0, TAU); x.fill();
    // Mắt
    x.fillStyle = p.eye;
    x.strokeStyle = p.eye;
    x.lineWidth = 2 * S;
    const sleepy = skin.eyes === 'sleepy';
    for (const side of [-1, 1]) {
      const ex = side * r * 0.32, ey = -r * 0.1;
      if (st.happy > 0) {
        x.beginPath(); x.moveTo(ex - r * 0.12, ey + r * 0.04); x.quadraticCurveTo(ex, ey - r * 0.14, ex + r * 0.12, ey + r * 0.04); x.stroke();
      } else if (st.blink > 0 || (sleepy && !(st.sad > 0))) {
        // Lim dim: mắt cong xuống như đang ngủ gật
        x.beginPath(); x.moveTo(ex - r * 0.12, ey - r * 0.02); x.quadraticCurveTo(ex, ey + r * 0.1, ex + r * 0.12, ey - r * 0.02); x.stroke();
      } else {
        const er = st.sad > 0 ? r * 0.09 : r * 0.115;
        x.beginPath(); x.arc(ex, ey, er, 0, TAU); x.fill();
        x.fillStyle = '#FFFFFF';
        if (p.eye !== BASE.eye) x.fillStyle = '#2A1E3D';
        x.beginPath(); x.arc(ex + er * 0.35, ey - er * 0.35, er * 0.38, 0, TAU); x.fill();
        x.fillStyle = p.eye;
        if (st.sad > 0) {
          x.beginPath(); x.moveTo(ex - side * r * 0.16, ey - r * 0.3); x.lineTo(ex + side * r * 0.05, ey - r * 0.22); x.stroke();
        }
      }
      if (skin.eyes === 'lash' && !(st.happy > 0)) {
        // Lông mi cong ra phía ngoài cho Bé Hồng
        x.lineWidth = 1.5 * S;
        for (let i = 0; i < 2; i++) {
          const a = -Math.PI / 2 + side * (0.75 + i * 0.4);
          x.beginPath();
          x.moveTo(ex + Math.cos(a) * r * 0.12, ey + Math.sin(a) * r * 0.12);
          x.lineTo(ex + Math.cos(a) * r * 0.22, ey + Math.sin(a) * r * 0.22);
          x.stroke();
        }
        x.lineWidth = 2 * S;
      }
    }
    // Miệng
    const my = r * 0.36;
    x.strokeStyle = p.mouth;
    if (st.sad > 0) {
      x.beginPath(); x.moveTo(-r * 0.12, my + r * 0.06); x.quadraticCurveTo(0, my - r * 0.06, r * 0.12, my + r * 0.06); x.stroke();
    } else if (st.chew > 0 || st.mouthOpen > 0.05) {
      const open = st.chew > 0 ? 0.35 + 0.35 * Math.abs(Math.sin(st.chew * 38)) : st.mouthOpen;
      x.fillStyle = p.mouth === BASE.mouth ? '#4A2B4F' : p.mouth;
      x.beginPath(); x.ellipse(0, my, r * 0.17, r * (0.05 + 0.15 * open), 0, 0, TAU); x.fill();
      if (open > 0.4) {
        x.fillStyle = p.tongue;
        x.beginPath(); x.ellipse(0, my + r * 0.08 * open, r * 0.09, r * 0.05, 0, 0, TAU); x.fill();
      }
    } else {
      x.beginPath(); x.moveTo(-r * 0.12, my - r * 0.02); x.quadraticCurveTo(0, my + r * 0.1, r * 0.12, my - r * 0.02); x.stroke();
    }
    drawAccessory(x, skin.acc, r, S, t, false);
  }

  // ================= Kén =================
  function drawCocoon(x, skin, S, glow, night) {
    const p = palette(skin);
    if (glow > 0) {
      x.fillStyle = night ? '#8C6BC8' : '#FFF1C9';
      x.globalAlpha = 0.35 * glow;
      x.beginPath(); x.ellipse(0, 0, 44 * S, 56 * S, 0, 0, TAU); x.fill();
      x.globalAlpha = 1;
    }
    x.fillStyle = p.cocoon;
    x.beginPath(); x.ellipse(0, 0, 26 * S, 38 * S, 0, 0, TAU); x.fill();
    x.strokeStyle = p.cocoonLine;
    x.lineWidth = 2.4 * S;
    x.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      x.beginPath(); x.moveTo(-22 * S, i * 12 * S - 4 * S); x.quadraticCurveTo(0, i * 12 * S + 4 * S, 22 * S, i * 12 * S - 4 * S); x.stroke();
    }
    x.fillStyle = 'rgba(255,255,255,0.4)';
    x.beginPath(); x.ellipse(-9 * S, -16 * S, 7 * S, 13 * S, -0.3, 0, TAU); x.fill();
  }

  // ================= Bướm =================
  const RAINBOW = ['#FF6F8E', '#FFB86B', '#FFE27A', '#7FD48A', '#6FB6FF', '#B79CF0'];
  // Vẽ hoa văn bên trong một cánh (đã cắt theo hình cánh). g: [cx, cy, rx, ry, góc] theo đơn vị S.
  const WING_TOP = [20, -14, 22, 17, -0.5], WING_BOTTOM = [15, 13, 14, 11, 0.5];
  function wingPattern(x, kind, g, top, S) {
    x.save();
    x.translate(g[0] * S, g[1] * S);
    x.rotate(g[4]);
    const R = g[2] * S, H = g[3] * S;
    x.beginPath(); x.ellipse(0, 0, R, H, 0, 0, TAU); x.clip();
    if (kind === 'brocade') {
      if (top) {
        x.fillStyle = BRO.green;
        x.fillRect(-R, -H * 0.44, R * 2, H * 0.1);
        x.fillRect(-R, H * 0.34, R * 2, H * 0.1);
        x.fillStyle = BRO.red;
        x.fillRect(-R, -H * 0.3, R * 2, H * 0.6);
        x.fillStyle = BRO.gold;
        zigzag(x, -R, R, 0, H * 0.4, 6);
        x.fillStyle = BRO.cream;
        x.beginPath();
        for (let i = 0; i <= 9; i++) {
          const px = -R + (i * R) / 4.5;
          x.moveTo(px + 1.2 * S, -H * 0.62); x.arc(px, -H * 0.62, 1.2 * S, 0, TAU);
          x.moveTo(px + 1.2 * S, H * 0.62); x.arc(px, H * 0.62, 1.2 * S, 0, TAU);
        }
        x.fill();
      } else {
        x.fillStyle = '#2F3B85';
        x.fillRect(-R, -H * 0.22, R * 2, H * 0.44);
        x.fillStyle = BRO.gold;
        zigzag(x, -R, R, 0, H * 0.3, 4);
      }
    } else if (kind === 'terrace') {
      // ruộng bậc thang: các dải cong vàng xanh nối nhau, viền bờ ruộng sẫm
      const cols = top ? ['#F7D774', '#F2C14E', '#E3A63A', '#B5C94A', '#F2C14E', '#9CC856'] : ['#B5C94A', '#9CC856', '#7FB342', '#B5C94A'];
      const n = cols.length, step = (H * 2.4) / n;
      for (let i = 0; i < n; i++) {
        const y0 = -H * 1.2 + i * step;
        x.fillStyle = cols[i];
        x.beginPath();
        x.moveTo(-R * 1.1, y0 + H * 0.3);
        x.quadraticCurveTo(0, y0 - H * 0.3, R * 1.1, y0 + H * 0.3);
        x.lineTo(R * 1.1, y0 + H * 0.3 + step + 1);
        x.quadraticCurveTo(0, y0 - H * 0.3 + step + 1, -R * 1.1, y0 + H * 0.3 + step + 1);
        x.closePath();
        x.fill();
        x.strokeStyle = 'rgba(110, 74, 20, 0.35)';
        x.lineWidth = 0.9 * S;
        x.beginPath(); x.moveTo(-R * 1.1, y0 + H * 0.3); x.quadraticCurveTo(0, y0 - H * 0.3, R * 1.1, y0 + H * 0.3); x.stroke();
      }
    }
    x.restore();
  }
  // Hình con dơi (dùng cho hạt hiệu ứng, đàn dơi trên nền và cánh dơi). f: độ vỗ cánh -1..1.
  function batPath(x, s, f) {
    x.beginPath();
    for (const side of [-1, 1]) {
      x.moveTo(side * s * 0.3, -s * 0.1);
      x.quadraticCurveTo(side * s * 1.0, -s * (0.2 + 0.9 * f), side * s * 1.9, -s * 0.55 * f);
      x.quadraticCurveTo(side * s * 1.45, s * 0.05, side * s * 1.25, s * 0.38);
      x.quadraticCurveTo(side * s * 1.0, s * 0.12, side * s * 0.75, s * 0.42);
      x.quadraticCurveTo(side * s * 0.55, s * 0.15, side * s * 0.3, s * 0.4);
      x.closePath();
    }
    x.moveTo(s * 0.42, 0);
    x.ellipse(0, 0.05 * s, s * 0.42, s * 0.55, 0, 0, TAU);
    x.moveTo(-s * 0.32, -s * 0.38); x.lineTo(-s * 0.22, -s * 0.78); x.lineTo(-s * 0.06, -s * 0.45);
    x.moveTo(s * 0.32, -s * 0.38); x.lineTo(s * 0.22, -s * 0.78); x.lineTo(s * 0.06, -s * 0.45);
  }
  // Cánh dơi: bé sâu hoá thành dơi nhỏ, mắt cam, hai răng nanh.
  function drawBat(x, w, S, t) {
    const flap = 0.35 + 0.65 * Math.abs(Math.sin(t * 7));
    if (w.glow) {
      x.fillStyle = '#FF8A1F';
      x.globalAlpha = 0.16 + 0.1 * Math.abs(Math.sin(t * 2));
      x.beginPath(); x.arc(0, -4 * S, 40 * S, 0, TAU); x.fill();
      x.globalAlpha = 1;
    }
    for (const side of [-1, 1]) {
      x.save();
      x.scale(side * flap, 1);
      x.fillStyle = w.top;
      x.beginPath();
      x.moveTo(3 * S, -12 * S);
      x.quadraticCurveTo(20 * S, -32 * S, 47 * S, -22 * S);
      x.quadraticCurveTo(42 * S, -10 * S, 45 * S, 3 * S);
      x.quadraticCurveTo(37 * S, -3 * S, 33 * S, 7 * S);
      x.quadraticCurveTo(25 * S, 0, 19 * S, 11 * S);
      x.quadraticCurveTo(12 * S, 4 * S, 4 * S, 10 * S);
      x.closePath();
      x.fill();
      x.strokeStyle = w.bone;
      x.lineWidth = 1.4 * S;
      x.lineCap = 'round';
      for (const [ex, ey] of [[45, 3], [33, 7], [19, 11]]) {
        x.beginPath(); x.moveTo(6 * S, -12 * S); x.quadraticCurveTo(ex * 0.6 * S, -14 * S, ex * S, ey * S); x.stroke();
      }
      x.restore();
    }
    x.fillStyle = w.body;
    x.beginPath(); x.ellipse(0, 1 * S, 6.5 * S, 13 * S, 0, 0, TAU); x.fill();
    x.beginPath(); x.arc(0, -14 * S, 7.5 * S, 0, TAU); x.fill();
    x.beginPath();
    x.moveTo(-6.5 * S, -16 * S); x.lineTo(-5 * S, -27 * S); x.lineTo(-1 * S, -19 * S);
    x.moveTo(6.5 * S, -16 * S); x.lineTo(5 * S, -27 * S); x.lineTo(1 * S, -19 * S);
    x.fill();
    x.fillStyle = w.eye;
    x.beginPath(); x.arc(-2.8 * S, -15 * S, 1.9 * S, 0, TAU); x.arc(2.8 * S, -15 * S, 1.9 * S, 0, TAU); x.fill();
    x.fillStyle = '#FFFFFF';
    x.beginPath();
    x.moveTo(-2.2 * S, -9.6 * S); x.lineTo(-1.2 * S, -7.4 * S); x.lineTo(-0.4 * S, -9.6 * S);
    x.moveTo(2.2 * S, -9.6 * S); x.lineTo(1.2 * S, -7.4 * S); x.lineTo(0.4 * S, -9.6 * S);
    x.fill();
  }
  function drawButterfly(x, wingItem, S, t) {
    const w = wingItem.wing;
    if (w.shape === 'bat') { drawBat(x, w, S, t); return; }
    const flap = 0.3 + 0.7 * Math.abs(Math.sin(t * 7));
    if (w.glow) {
      x.fillStyle = w.top === 'rainbow' ? '#FFF1C9' : w.spot;
      x.globalAlpha = 0.18 + 0.12 * Math.abs(Math.sin(t * 2));
      x.beginPath(); x.arc(0, -4 * S, 42 * S, 0, TAU); x.fill();
      x.globalAlpha = 1;
    }
    for (const side of [-1, 1]) {
      x.save();
      x.scale(side * flap, 1);
      if (w.top === 'rainbow') {
        const gr = x.createLinearGradient(0, -34 * S, 40 * S, 4 * S);
        RAINBOW.forEach((c, i) => gr.addColorStop(i / (RAINBOW.length - 1), c));
        x.fillStyle = gr;
      } else x.fillStyle = w.top;
      x.beginPath(); x.ellipse(20 * S, -14 * S, 22 * S, 17 * S, -0.5, 0, TAU); x.fill();
      if (w.pattern) wingPattern(x, w.pattern, WING_TOP, true, S);
      x.fillStyle = w.bottom;
      x.beginPath(); x.ellipse(15 * S, 13 * S, 14 * S, 11 * S, 0.5, 0, TAU); x.fill();
      if (w.pattern) wingPattern(x, w.pattern, WING_BOTTOM, false, S);
      if (w.mark !== 'none') drawMark(x, w.mark, 22 * S, -15 * S, 6 * S, w.markColor, S);
      if (w.mark === 'star') {
        x.fillStyle = w.markColor;
        x.globalAlpha = 0.7;
        x.beginPath(); x.arc(30 * S, -24 * S, 1.6 * S, 0, TAU); x.arc(12 * S, -6 * S, 1.3 * S, 0, TAU); x.fill();
        x.globalAlpha = 1;
      }
      x.fillStyle = w.spot;
      x.beginPath(); x.arc(16 * S, 14 * S, 4 * S, 0, TAU); x.fill();
      x.restore();
    }
    x.fillStyle = w.body;
    x.beginPath(); x.ellipse(0, 2 * S, 5 * S, 19 * S, 0, 0, TAU); x.fill();
    x.beginPath(); x.arc(0, -20 * S, 7 * S, 0, TAU); x.fill();
    x.strokeStyle = w.body;
    x.lineWidth = 2 * S;
    x.lineCap = 'round';
    for (const side of [-1, 1]) {
      x.beginPath(); x.moveTo(side * 2 * S, -26 * S); x.quadraticCurveTo(side * 6 * S, -38 * S, side * 12 * S, -40 * S); x.stroke();
      x.fillStyle = '#FF8FA3';
      x.beginPath(); x.arc(side * 12 * S, -40 * S, 3 * S, 0, TAU); x.fill();
    }
    x.fillStyle = '#FFFFFF';
    x.beginPath(); x.arc(-2.6 * S, -21 * S, 1.6 * S, 0, TAU); x.arc(2.6 * S, -21 * S, 1.6 * S, 0, TAU); x.fill();
  }

  // ================= Hạt hiệu ứng khi ăn lá =================
  // Trả về danh sách hạt {kind, vx, vy, life, size, color}; game và tiệm tự nhân với S và vị trí.
  // kind: 0 vụn lá, 1 tim, 4 cánh hoa, 5 mây, 6 sao, 7 nốt nhạc, 8 pháo giấy, 9 hoa văn trám, 10 hạt lúa.
  function eatBurst(fxItem, n, S, leafColors) {
    const fx = fxItem.fx;
    const out = [];
    const cols = fx.colors || leafColors;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const sp = (90 + Math.random() * 170) * S;
      const c = cols[i % cols.length];
      if (fx.kind === 'leaf') out.push({ kind: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.45 + Math.random() * 0.3, size: (2.5 + Math.random() * 2.5) * S, color: c });
      else if (fx.kind === 'heart') out.push({ kind: 1, vx: (Math.random() - 0.5) * 70 * S, vy: -(70 + Math.random() * 90) * S, life: 0.6 + Math.random() * 0.35, size: (3.2 + Math.random() * 2) * S, color: c });
      else if (fx.kind === 'petal') out.push({ kind: 4, vx: Math.cos(a) * sp * 0.7, vy: Math.sin(a) * sp * 0.7, life: 0.7 + Math.random() * 0.4, size: (3.5 + Math.random() * 2.5) * S, color: c });
      else if (fx.kind === 'cloud') out.push({ kind: 5, vx: Math.cos(a) * sp * 0.45, vy: Math.sin(a) * sp * 0.45, life: 0.6 + Math.random() * 0.3, size: (4 + Math.random() * 4) * S, color: c });
      else if (fx.kind === 'star') out.push({ kind: 6, vx: Math.cos(a) * sp * 0.8, vy: Math.sin(a) * sp * 0.8, life: 0.5 + Math.random() * 0.35, size: (3.5 + Math.random() * 2.5) * S, color: c });
      else if (fx.kind === 'note') out.push({ kind: 7, vx: (Math.random() - 0.5) * 80 * S, vy: -(80 + Math.random() * 80) * S, life: 0.7 + Math.random() * 0.3, size: (9 + Math.random() * 5) * S, color: c });
      else if (fx.kind === 'diamond') out.push({ kind: 9, vx: Math.cos(a) * sp * 0.85, vy: Math.sin(a) * sp * 0.85, life: 0.6 + Math.random() * 0.35, size: (3.8 + Math.random() * 2.4) * S, color: c });
      else if (fx.kind === 'grain') out.push({ kind: 10, vx: Math.cos(a) * sp * 0.75, vy: Math.sin(a) * sp * 0.75, life: 0.6 + Math.random() * 0.35, size: (3.4 + Math.random() * 1.8) * S, color: c });
      else if (fx.kind === 'bat') out.push({ kind: 11, vx: Math.cos(a) * sp * 0.6, vy: -(60 + Math.random() * 90) * S, life: 0.8 + Math.random() * 0.4, size: (4.5 + Math.random() * 2.5) * S, color: c });
      else if (fx.kind === 'candy') out.push({ kind: 12, vx: Math.cos(a) * sp * 0.85, vy: Math.sin(a) * sp * 0.85, life: 0.65 + Math.random() * 0.35, size: (3.4 + Math.random() * 1.6) * S, color: c });
      else out.push({ kind: 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.55 + Math.random() * 0.35, size: (2.4 + Math.random() * 2) * S, color: c });
    }
    return out;
  }
  // Chuyển động riêng của từng loại hạt (gọi mỗi khung hình).
  function stepParticle(p, dt, S) {
    if (p.kind === 0 || p.kind === 8) { p.vy += 900 * S * dt; p.rot += p.vr * dt; }
    else if (p.kind === 1) { p.vx = Math.sin(p.life * 6) * 25 * S; }
    else if (p.kind === 2) { p.vx *= 1 - 3 * dt; p.vy *= 1 - 3 * dt; }
    else if (p.kind === 4) { p.vy += 260 * S * dt; p.vx *= 1 - 1.5 * dt; p.rot += p.vr * dt * 0.6; }
    else if (p.kind === 5) { p.vx *= 1 - 2.5 * dt; p.vy *= 1 - 2.5 * dt; p.size *= 1 + 0.9 * dt; }
    else if (p.kind === 6) { p.vx *= 1 - 2 * dt; p.vy = p.vy * (1 - 2 * dt) + 120 * S * dt; p.rot += p.vr * dt; }
    else if (p.kind === 7) { p.vx = Math.sin(p.life * 5) * 30 * S; }
    else if (p.kind === 9) { p.vx *= 1 - 2 * dt; p.vy = p.vy * (1 - 2 * dt) + 140 * S * dt; p.rot += p.vr * dt * 0.5; }
    else if (p.kind === 10) { p.vy += 520 * S * dt; p.vx *= 1 - 1.2 * dt; p.rot += p.vr * dt * 0.5; }
    else if (p.kind === 11) { p.vx = p.vx * (1 - 1.5 * dt) + Math.sin(p.life * 9) * 60 * S * dt; }
    else if (p.kind === 12) { p.vy += 700 * S * dt; p.rot += p.vr * dt; }
  }
  function drawParticle(x, p, S) {
    const k = p.life / p.max;
    x.globalAlpha = Math.min(1, k * 1.6);
    x.fillStyle = p.color;
    if (p.kind === 0 || p.kind === 8) {
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
      if (p.kind === 8) x.fillRect(-p.size * 0.6, -p.size * 1.1, p.size * 1.2, p.size * 2.2);
      else x.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2);
      x.restore();
    } else if (p.kind === 1) {
      heartPath(x, p.x, p.y, p.size); x.fill();
    } else if (p.kind === 2) {
      x.beginPath(); x.arc(p.x, p.y, p.size * (0.4 + 0.6 * k), 0, TAU); x.fill();
    } else if (p.kind === 3) {
      x.strokeStyle = p.color;
      x.lineWidth = 2 * S * k;
      x.beginPath(); x.arc(p.x, p.y, p.size + (1 - k) * 34 * S, 0, TAU); x.stroke();
    } else if (p.kind === 4) {
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
      x.beginPath(); x.ellipse(0, 0, p.size, p.size * 0.48, 0, 0, TAU); x.fill();
      x.restore();
    } else if (p.kind === 5) {
      x.globalAlpha *= 0.85;
      x.beginPath();
      x.arc(p.x, p.y, p.size, 0, TAU);
      x.arc(p.x + p.size * 0.9, p.y + p.size * 0.15, p.size * 0.7, 0, TAU);
      x.arc(p.x - p.size * 0.9, p.y + p.size * 0.2, p.size * 0.6, 0, TAU);
      x.fill();
    } else if (p.kind === 6) {
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
      starPath(x, 0, 0, p.size, p.size * 0.45); x.fill();
      x.restore();
    } else if (p.kind === 7) {
      x.font = '700 ' + Math.round(p.size) + 'px system-ui, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(p.size > 11 * S ? '♫' : '♪', p.x, p.y);
    } else if (p.kind === 9) {
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
      diamondPath(x, 0, 0, p.size); x.fill();
      x.fillStyle = BRO.cream;
      diamondPath(x, 0, 0, p.size * 0.42); x.fill();
      x.restore();
    } else if (p.kind === 10) {
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
      x.beginPath(); x.ellipse(0, 0, p.size * 0.42, p.size, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.5)';
      x.beginPath(); x.ellipse(-p.size * 0.12, -p.size * 0.25, p.size * 0.12, p.size * 0.42, 0, 0, TAU); x.fill();
      x.restore();
    } else if (p.kind === 11) {
      x.save(); x.translate(p.x, p.y);
      batPath(x, p.size, Math.sin(p.life * 28)); x.fill();
      x.fillStyle = '#FFB347';
      x.beginPath(); x.arc(-p.size * 0.16, -p.size * 0.05, p.size * 0.1, 0, TAU); x.arc(p.size * 0.16, -p.size * 0.05, p.size * 0.1, 0, TAU); x.fill();
      x.restore();
    } else if (p.kind === 12) {
      // viên kẹo gói giấy xoắn hai đầu
      const s = p.size;
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
      x.beginPath();
      x.moveTo(-s * 0.8, 0); x.lineTo(-s * 1.6, -s * 0.6); x.lineTo(-s * 1.6, s * 0.6); x.closePath();
      x.moveTo(s * 0.8, 0); x.lineTo(s * 1.6, -s * 0.6); x.lineTo(s * 1.6, s * 0.6); x.closePath();
      x.fill();
      x.beginPath(); x.ellipse(0, 0, s, s * 0.8, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.8)';
      x.lineWidth = s * 0.25;
      x.beginPath(); x.moveTo(-s * 0.45, -s * 0.5); x.lineTo(s * 0.15, s * 0.6); x.stroke();
      x.restore();
    }
    x.globalAlpha = 1;
  }

  // ================= Nền: khung cảnh phía sau khi chơi =================
  // Phần đứng yên (trời, núi, lâu đài) vẽ sẵn vào một canvas theo cỡ màn hình;
  // mỗi khung hình chỉ vẽ thêm phần chuyển động (mây, sương, dơi, đèn).
  // o: { W, H, t, dt, speed (tốc độ leo, để mây trôi xuống), dpr, night, st (đối tượng giữ trạng thái) }
  const rnd = (i) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  // Dãy núi: peaks = [[vị trí 0..1, độ cao theo H, độ rộng 0..1]], jag: độ lởm chởm.
  // hs: thước đo độ cao (mặc định H); màn hình dọc dùng thước nhỏ hơn để núi không bị kéo nhọn.
  function ridge(x, W, H, base, peaks, color, jag, seed, hs) {
    hs = hs || H;
    x.fillStyle = color;
    x.beginPath();
    x.moveTo(0, H);
    const N = 72;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      let h = 0;
      for (const [px, ph, pw] of peaks) {
        const d = Math.abs(u - px) / pw;
        if (d < 1) h = Math.max(h, ph * Math.pow(1 - d, 1.25));
      }
      h += (rnd(i + (seed || 0)) - 0.5) * (jag || 0) * 0.012;
      x.lineTo(u * W, base - h * hs);
    }
    x.lineTo(W, H);
    x.closePath();
    x.fill();
  }
  function mist(x, W, y, h, color) {
    const g = x.createLinearGradient(0, y - h, 0, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, y - h, W, h * 2);
  }
  function stars(x, W, H, n, maxY) {
    x.fillStyle = '#FFF4D6';
    for (let i = 0; i < n; i++) {
      x.globalAlpha = 0.35 + rnd(i + 7) * 0.65;
      const r = 0.6 + rnd(i + 3) * 1.1;
      x.fillRect(rnd(i) * W, rnd(i + 99) * H * maxY, r, r);
    }
    x.globalAlpha = 1;
  }
  // Dải biển mây: một hàng mây bông nối nhau, trôi ngang theo off.
  function cloudBand(x, W, y, off, r, color) {
    const step = r * 1.25;
    x.fillStyle = color;
    x.beginPath();
    const first = Math.floor(-off / step) - 1;
    for (let k = first; k * step + off < W + step; k++) {
      const cx = k * step + off;
      const rr = r * (0.7 + rnd(k * 13 + 5) * 0.6);
      x.moveTo(cx + rr, y);
      x.arc(cx, y - rr * 0.15, rr, 0, TAU);
    }
    x.rect(0, y, W, r * 0.9);
    x.fill();
  }
  function puff(x, cx, cy, r) {
    x.beginPath();
    x.arc(cx - r * 0.9, cy + r * 0.15, r * 0.65, 0, TAU);
    x.arc(cx, cy - r * 0.15, r, 0, TAU);
    x.arc(cx + r * 0.95, cy + r * 0.2, r * 0.6, 0, TAU);
    x.rect(cx - r * 0.9, cy + r * 0.15, r * 1.85, r * 0.6);
    x.fill();
  }

  // ----- Sa Pa: đỉnh Fansipan, biển mây, ruộng bậc thang -----
  const SAPA = {
    day: { sky: ['#86BCEB', '#CFE4F6', '#FBE6D6'], far: '#A7B9E0', mid: '#7F97C9', near: '#5F8F86', mist: 'rgba(255,255,255,0.6)', terr: ['#9CC856', '#E3A63A', '#B5C94A', '#F2C14E'], edge: 'rgba(110,74,20,0.3)' },
    night: { sky: ['#121738', '#283066', '#4A4A86'], far: '#3A4282', mid: '#2D3470', near: '#22404F', mist: 'rgba(170,175,230,0.25)', terr: ['#3E5A3A', '#6B5A2E', '#4A5E36', '#7A6A34'], edge: 'rgba(0,0,0,0.25)' },
  };
  function paintSapa(x, W, H, night) {
    const C = night ? SAPA.night : SAPA.day;
    const g = x.createLinearGradient(0, 0, 0, H * 0.75);
    g.addColorStop(0, C.sky[0]); g.addColorStop(0.6, C.sky[1]); g.addColorStop(1, C.sky[2]);
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    const sx = W * 0.76, sy = H * 0.16, sr = Math.min(W, H) * 0.065;
    if (night) {
      stars(x, W, H, 60, 0.55);
      const h = x.createRadialGradient(sx, sy, sr * 0.8, sx, sy, sr * 3);
      h.addColorStop(0, 'rgba(255,241,201,0.35)'); h.addColorStop(1, 'rgba(255,241,201,0)');
      x.fillStyle = h;
      x.beginPath(); x.arc(sx, sy, sr * 3, 0, TAU); x.fill();
      x.fillStyle = '#FFF1C9';
      x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.fill();
    } else {
      const h = x.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3.4);
      h.addColorStop(0, 'rgba(255,248,220,0.9)'); h.addColorStop(1, 'rgba(255,248,220,0)');
      x.fillStyle = h;
      x.beginPath(); x.arc(sx, sy, sr * 3.4, 0, TAU); x.fill();
      x.fillStyle = '#FFF6D8';
      x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.fill();
    }
    // dãy núi xa, đỉnh cao nhất là Fansipan
    const HS = Math.min(H, W * 1.1);
    const farBase = H * 0.66;
    ridge(x, W, H, farBase, [[0.08, 0.13, 0.2], [0.3, 0.17, 0.22], [0.6, 0.3, 0.2], [0.86, 0.18, 0.2]], C.far, 1, 3, HS);
    // chóp Fansipan: tháp nhỏ và lá cờ đỏ
    const fx = W * 0.6, fy = farBase - HS * 0.3, u = Math.min(W, H) / 100;
    x.fillStyle = C.mid;
    x.beginPath(); x.moveTo(fx - u * 1.1, fy + u * 0.4); x.lineTo(fx, fy - u * 1.6); x.lineTo(fx + u * 1.1, fy + u * 0.4); x.closePath(); x.fill();
    x.strokeStyle = C.mid;
    x.lineWidth = Math.max(0.6, u * 0.18);
    x.beginPath(); x.moveTo(fx, fy - u * 1.5); x.lineTo(fx, fy - u * 3.2); x.stroke();
    x.fillStyle = '#E8454E';
    x.beginPath(); x.moveTo(fx, fy - u * 3.2); x.lineTo(fx + u * 1.5, fy - u * 2.75); x.lineTo(fx, fy - u * 2.3); x.closePath(); x.fill();
    mist(x, W, H * 0.64, H * 0.05, C.mist);
    ridge(x, W, H, H * 0.77, [[0.0, 0.14, 0.22], [0.24, 0.1, 0.2], [0.5, 0.15, 0.22], [0.78, 0.12, 0.24], [1.0, 0.16, 0.2]], C.mid, 1, 11, HS);
    mist(x, W, H * 0.75, H * 0.045, C.mist);
    ridge(x, W, H, H * 0.87, [[0.12, 0.09, 0.25], [0.45, 0.06, 0.25], [0.7, 0.1, 0.22], [0.95, 0.07, 0.2]], C.near, 0.6, 23, HS);
    // ruộng bậc thang dưới cùng
    const n = 6;
    for (let i = 0; i < n; i++) {
      const y0 = H * (0.865 + i * 0.024), amp = H * 0.012;
      x.fillStyle = C.terr[i % C.terr.length];
      x.beginPath();
      x.moveTo(0, y0 + amp);
      x.quadraticCurveTo(W * 0.5, y0 - amp, W, y0 + amp);
      x.lineTo(W, H);
      x.lineTo(0, H);
      x.closePath();
      x.fill();
      x.strokeStyle = C.edge;
      x.lineWidth = Math.max(0.6, u * 0.2);
      x.beginPath(); x.moveTo(0, y0 + amp); x.quadraticCurveTo(W * 0.5, y0 - amp, W, y0 + amp); x.stroke();
    }
  }
  function liveSapa(x, o, st) {
    const { W, H, t, dt, night } = o;
    const r = Math.min(W, H) * 0.06;
    cloudBand(x, W, H * 0.69, (t * 9) % (r * 1.25 * 40), r, night ? 'rgba(200,205,240,0.32)' : 'rgba(255,255,255,0.82)');
    cloudBand(x, W, H * 0.8, -(t * 6) % (r * 1.25 * 40), r * 0.85, night ? 'rgba(190,195,235,0.26)' : 'rgba(255,255,255,0.7)');
    if (!st.clouds) {
      st.clouds = [];
      for (let i = 0; i < 4; i++) st.clouds.push({ x: rnd(i + 40) * W, y: H * (0.06 + rnd(i + 50) * 0.36), s: 0.6 + rnd(i + 60) * 0.6 });
    }
    x.fillStyle = night ? 'rgba(200,205,240,0.18)' : 'rgba(255,255,255,0.85)';
    for (const c of st.clouds) {
      c.x += 7 * c.s * dt;
      c.y += (o.speed || 0) * 0.03 * dt;
      if (c.x > W + r * 3) c.x = -r * 3;
      if (c.y > H * 0.58) { c.y = -r * 2; c.x = Math.random() * W; }
      puff(x, c.x, c.y, r * 0.7 * c.s);
    }
  }

  // ----- Lâu đài bí ngô: trăng cam, lâu đài trên đồi, dơi, bé ma, đèn bí ngô -----
  function castleGeom(W, H) {
    const u = Math.min(W, H * 0.7) / 100;
    return { u, cx: W * 0.4, by: H * 0.76 };
  }
  const WINDOWS = [[-23.5, -32], [-23.5, -20], [0, -40], [0, -31], [22, -26], [-9, -14], [9, -14]];
  function paintCastle(x, W, H) {
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#120A26'); g.addColorStop(0.5, '#2B1850'); g.addColorStop(0.78, '#5A2D6B'); g.addColorStop(1, '#7A3B5E');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    stars(x, W, H, 50, 0.6);
    const { u, cx, by } = castleGeom(W, H);
    // trăng cam thật to
    const mx = W * 0.7, my = H * 0.2, mr = Math.min(W, H * 0.6) * 0.16;
    const glow = x.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 2.8);
    glow.addColorStop(0, 'rgba(255,159,67,0.4)'); glow.addColorStop(1, 'rgba(255,159,67,0)');
    x.fillStyle = glow;
    x.beginPath(); x.arc(mx, my, mr * 2.8, 0, TAU); x.fill();
    const disc = x.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
    disc.addColorStop(0, '#FFE9B8'); disc.addColorStop(1, '#FFB347');
    x.fillStyle = disc;
    x.beginPath(); x.arc(mx, my, mr, 0, TAU); x.fill();
    x.fillStyle = 'rgba(200,110,30,0.18)';
    for (const [dx, dy, rr] of [[-0.3, -0.2, 0.18], [0.25, 0.1, 0.14], [-0.05, 0.4, 0.1]]) {
      x.beginPath(); x.arc(mx + dx * mr, my + dy * mr, rr * mr, 0, TAU); x.fill();
    }
    // đồi xa
    ridge(x, W, H, H * 0.8, [[0.1, 0.06, 0.4], [0.55, 0.05, 0.4], [0.95, 0.07, 0.35]], '#2A1640', 0.3, 5);
    // lâu đài
    const C = '#150B24';
    x.fillStyle = C;
    x.beginPath(); x.ellipse(cx, by + 4 * u, 38 * u, 10 * u, 0, 0, TAU); x.fill();
    const rect = (l, t, w, h) => x.fillRect(cx + l * u, by + t * u, w * u, h * u);
    const roof = (l, r, top, base) => { x.beginPath(); x.moveTo(cx + l * u, by + base * u); x.lineTo(cx + ((l + r) / 2) * u, by + top * u); x.lineTo(cx + r * u, by + base * u); x.closePath(); x.fill(); };
    rect(-16, -24, 32, 24);
    for (let i = 0; i < 5; i++) rect(-16 + i * 7, -27.5, 3.8, 3.6);
    rect(-28, -40, 9, 40); roof(-30.5, -16.5, -57, -40);
    rect(18, -34, 8, 34); roof(16, 28, -49, -34);
    rect(-5, -48, 10, 24); roof(-7.5, 7.5, -66, -48);
    x.strokeStyle = C;
    x.lineWidth = Math.max(0.6, u * 0.5);
    x.beginPath(); x.moveTo(cx, by - 66 * u); x.lineTo(cx, by - 73 * u); x.stroke();
    x.fillStyle = '#FF8A1F';
    x.beginPath(); x.moveTo(cx, by - 73 * u); x.lineTo(cx + 5 * u, by - 71.4 * u); x.lineTo(cx, by - 69.8 * u); x.closePath(); x.fill();
    // cây khô cong queo bên phải
    x.strokeStyle = C;
    x.lineCap = 'round';
    const tx = W * 0.9, ty = H * 0.88;
    const branch = (x0, y0, x1, y1, w) => { x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo((x0 + x1) / 2 + u * 2, (y0 + y1) / 2, x1, y1); x.stroke(); };
    branch(tx, ty, tx - 3 * u, ty - 26 * u, 3 * u);
    branch(tx - 2 * u, ty - 16 * u, tx - 12 * u, ty - 24 * u, 1.6 * u);
    branch(tx - 3 * u, ty - 22 * u, tx + 6 * u, ty - 32 * u, 1.4 * u);
    branch(tx - 3 * u, ty - 26 * u, tx - 8 * u, ty - 36 * u, 1.2 * u);
    // mặt đất và vài bia đá nhỏ
    ridge(x, W, H, H * 0.91, [[0.2, 0.025, 0.5], [0.75, 0.03, 0.5]], '#1C0F2E', 0.2, 9);
    x.fillStyle = '#2E1F45';
    for (const [gx, gs] of [[0.56, 1], [0.64, 0.8], [0.04, 0.9]]) {
      const w = 5 * u * gs, h = 6.5 * u * gs, x0 = W * gx, y0 = H * 0.93;
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0, y0 - h + w / 2); x.arc(x0 + w / 2, y0 - h + w / 2, w / 2, Math.PI, 0); x.lineTo(x0 + w, y0); x.closePath(); x.fill();
    }
  }
  function drawPumpkin(x, px, py, r, glow) {
    const halo = x.createRadialGradient(px, py, r * 0.4, px, py, r * 2.4);
    halo.addColorStop(0, 'rgba(255,160,60,' + 0.35 * glow + ')'); halo.addColorStop(1, 'rgba(255,160,60,0)');
    x.fillStyle = halo;
    x.beginPath(); x.arc(px, py, r * 2.4, 0, TAU); x.fill();
    x.fillStyle = '#E8761A';
    x.beginPath(); x.ellipse(px - r * 0.45, py, r * 0.6, r * 0.82, 0, 0, TAU); x.ellipse(px + r * 0.45, py, r * 0.6, r * 0.82, 0, 0, TAU); x.fill();
    x.fillStyle = '#FF8A1F';
    x.beginPath(); x.ellipse(px, py, r * 0.62, r * 0.88, 0, 0, TAU); x.fill();
    x.fillStyle = '#4E7A2A';
    x.fillRect(px - r * 0.1, py - r * 1.1, r * 0.2, r * 0.32);
    x.globalAlpha = 0.6 + 0.4 * glow;
    drawMark(x, 'jack', px, py - r * 0.12, r * 0.8, '#FFD34E', 1);
    x.globalAlpha = 1;
  }
  function liveCastle(x, o, st) {
    const { W, H, t, dt } = o;
    const { u, cx, by } = castleGeom(W, H);
    // cửa sổ lâu đài lập loè
    for (let i = 0; i < WINDOWS.length; i++) {
      const [wx, wy] = WINDOWS[i];
      x.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(t * (1.3 + i * 0.37) + i));
      x.fillStyle = '#FFC24B';
      const w = 2.6 * u, h = 4 * u, x0 = cx + wx * u - w / 2, y0 = by + wy * u;
      x.beginPath(); x.moveTo(x0, y0 + h); x.lineTo(x0, y0 + w / 2); x.arc(x0 + w / 2, y0 + w / 2, w / 2, Math.PI, 0); x.lineTo(x0 + w, y0 + h); x.closePath(); x.fill();
    }
    x.globalAlpha = 1;
    // bé ma lơ lửng cạnh lâu đài
    const gx = cx + (34 + Math.sin(t * 0.6) * 8) * u, gy = by - (50 + Math.sin(t * 1.8) * 3) * u, gr = 5.5 * u;
    x.fillStyle = 'rgba(255,255,255,0.88)';
    x.beginPath();
    x.arc(gx, gy, gr, Math.PI, 0);
    x.lineTo(gx + gr, gy + gr * 1.3);
    for (let i = 0; i < 4; i++) {
      const x1 = gx + gr - (i + 0.5) * (gr / 2), x2 = gx + gr - (i + 1) * (gr / 2);
      x.quadraticCurveTo(x1, gy + gr * (1.3 + (i % 2 ? -0.25 : 0.3) + Math.sin(t * 6 + i) * 0.08), x2, gy + gr * 1.3);
    }
    x.closePath();
    x.fill();
    x.fillStyle = '#2A1B3D';
    x.beginPath(); x.ellipse(gx - gr * 0.35, gy - gr * 0.05, gr * 0.14, gr * 0.22, 0, 0, TAU); x.ellipse(gx + gr * 0.35, gy - gr * 0.05, gr * 0.14, gr * 0.22, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,111,142,0.6)';
    x.beginPath(); x.arc(gx - gr * 0.6, gy + gr * 0.3, gr * 0.15, 0, TAU); x.arc(gx + gr * 0.6, gy + gr * 0.3, gr * 0.15, 0, TAU); x.fill();
    // sương tím trôi ngang chân đồi
    const r = Math.min(W, H) * 0.055;
    cloudBand(x, W, H * 0.82, (t * 7) % (r * 1.25 * 40), r, 'rgba(190,160,230,0.14)');
    cloudBand(x, W, H * 0.92, -(t * 5) % (r * 1.25 * 40), r * 0.8, 'rgba(190,160,230,0.12)');
    // đàn dơi bay ngang trời
    if (!st.bats) {
      st.bats = [];
      for (let i = 0; i < 5; i++) st.bats.push({ x: rnd(i + 70) * W, y: H * (0.08 + rnd(i + 80) * 0.42), v: 18 + rnd(i + 90) * 26, ph: rnd(i + 30) * 6, s: 0.7 + rnd(i + 20) * 0.6 });
    }
    x.fillStyle = '#0E0718';
    for (const b of st.bats) {
      b.x += b.v * dt;
      b.y += (o.speed || 0) * 0.02 * dt;
      if (b.x > W + 30 || b.y > H * 0.7) { b.x = -30; b.y = H * (0.08 + Math.random() * 0.4); }
      x.save();
      x.translate(b.x, b.y + Math.sin(t * 2 + b.ph) * 6 * u * 0.4);
      batPath(x, 2.4 * u * b.s, Math.sin(t * 14 + b.ph));
      x.fill();
      x.restore();
    }
    // đèn bí ngô dưới đất
    for (const [px, py, k] of [[0.14, 0.955, 1], [0.27, 0.975, 0.72], [0.8, 0.96, 0.9]]) {
      drawPumpkin(x, W * px, H * py, 5 * u * k, 0.7 + 0.3 * Math.sin(t * 5 + px * 20));
    }
  }

  function drawBackdrop(x, item, o) {
    const kind = item.bg && item.bg.kind;
    if (!kind || kind === 'weather') return false;
    const st = o.st || {};
    const night = kind === 'sapa' && !!o.night;
    const key = kind + '|' + Math.round(o.W) + 'x' + Math.round(o.H) + '|' + night + '|' + o.dpr;
    if (st.key !== key) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(o.W * o.dpr));
      c.height = Math.max(1, Math.round(o.H * o.dpr));
      const cx = c.getContext('2d');
      cx.scale(o.dpr, o.dpr);
      if (kind === 'sapa') paintSapa(cx, o.W, o.H, night); else paintCastle(cx, o.W, o.H);
      st.key = key;
      st.cache = c;
      st.clouds = null;
      st.bats = null;
    }
    x.drawImage(st.cache, 0, 0, o.W, o.H);
    const live = { W: o.W, H: o.H, t: o.t || 0, dt: o.dt || 0, speed: o.speed || 0, night };
    if (kind === 'sapa') liveSapa(x, live, st); else liveCastle(x, live, st);
    return true;
  }
  // Màu trời trên cùng của nền (để tô phần ngoài khung hình cho liền).
  function backdropTop(item, night) {
    const kind = item.bg && item.bg.kind;
    if (kind === 'sapa') return night ? SAPA.night.sky[0] : SAPA.day.sky[0];
    if (kind === 'castle') return '#120A26';
    return null;
  }

  // ================= Hình xem trước (thẻ món đồ) =================
  // Vẽ món đồ vào giữa khung w×h; t để có chuyển động nhẹ.
  const PREVIEW_BG = {}; // nền thu nhỏ đã vẽ sẵn, theo món và cỡ khung
  function drawPreview(x, item, w, h, t) {
    x.save();
    x.translate(w / 2, h / 2);
    const S = Math.min(w, h) / 90;
    if (item.slot === 'skin') {
      const r = 21 * S * 0.95, sr = 16.5 * S * 0.95;
      x.save();
      x.translate(-r * 0.15, r * 0.95);
      for (let k = 2; k >= 1; k--) {
        x.save();
        x.translate(k * sr * 0.95, k * sr * 0.7);
        drawSegment(x, sr, item, k === 2 ? 2 : 1, S);
        x.restore();
      }
      x.restore();
      x.translate(-r * 0.15, -r * 0.05);
      drawHead(x, r, item, { t, ant: Math.sin(t * 2) * 2 * S, bob: 0, happy: 0, blink: 0, sad: 0, chew: 0, mouthOpen: 0 }, S);
    } else if (item.slot === 'bg') {
      // Khung cảnh thu nhỏ bo góc; "Trời hôm nay" vẽ nửa ngày nửa đêm.
      const bw = w * 0.92, bh = h * 0.84, rr = Math.min(bw, bh) * 0.14;
      x.translate(-bw / 2, -bh / 2);
      x.beginPath();
      x.moveTo(rr, 0); x.arcTo(bw, 0, bw, bh, rr); x.arcTo(bw, bh, 0, bh, rr); x.arcTo(0, bh, 0, 0, rr); x.arcTo(0, 0, bw, 0, rr);
      x.closePath();
      x.clip();
      if (item.bg.kind === 'weather') {
        const g = x.createLinearGradient(0, 0, 0, bh);
        g.addColorStop(0, '#BFE4FF'); g.addColorStop(1, '#EAF5FF');
        x.fillStyle = g;
        x.fillRect(0, 0, bw, bh);
        x.fillStyle = '#FFE48A';
        x.beginPath(); x.arc(bw * 0.28, bh * 0.32, bh * 0.14, 0, TAU); x.fill();
        x.fillStyle = '#FFFFFF';
        puff(x, bw * 0.3, bh * 0.68, bh * 0.11);
        x.fillStyle = '#29224E';
        x.beginPath(); x.moveTo(bw, 0); x.lineTo(bw, bh); x.lineTo(bw * 0.25, bh); x.closePath(); x.fill();
        x.fillStyle = '#FFF1C9';
        x.beginPath(); x.arc(bw * 0.78, bh * 0.62, bh * 0.11, 0, TAU); x.fill();
        x.fillStyle = '#29224E';
        x.beginPath(); x.arc(bw * 0.83, bh * 0.57, bh * 0.1, 0, TAU); x.fill();
        x.fillStyle = '#FFF4D6';
        for (let i = 0; i < 6; i++) x.fillRect(bw * (0.62 + rnd(i) * 0.33), bh * (0.75 + rnd(i + 9) * 0.2), 1.6, 1.6);
      } else {
        const key = item.id + '|' + Math.round(bw) + 'x' + Math.round(bh);
        const st = PREVIEW_BG[key] || (PREVIEW_BG[key] = {});
        drawBackdrop(x, item, { W: bw, H: bh, t, dt: 0, speed: 0, dpr: 2, night: false, st });
      }
    } else if (item.slot === 'wing') {
      x.translate(0, 4 * S);
      x.scale(0.85, 0.85);
      drawButterfly(x, item, S, t * 0.4 + 0.25);
    } else {
      if (item.fx.kind === 'cloud') {
        // Mây trắng cần một khoảng trời xanh nhạt mới thấy rõ
        x.fillStyle = '#CFE5FF';
        x.beginPath(); x.ellipse(0, 0, 40 * S, 30 * S, 0, 0, TAU); x.fill();
      }
      const seed = item.id.length;
      const parts = eatBurst(item, 7, S, ['#62BC7C', '#8FD6A0']);
      parts.forEach((p, i) => {
        const a = (i / parts.length) * TAU + seed;
        const rr = (14 + (i % 3) * 8) * S;
        p.x = Math.cos(a) * rr;
        p.y = Math.sin(a) * rr * 0.8 + Math.sin(t * 2 + i) * 2 * S;
        p.max = 1; p.life = 1; p.rot = a + t; p.size *= p.kind === 7 ? 1.3 : 1.25;
        drawParticle(x, p, S);
      });
    }
    x.restore();
  }

  window.Skins = {
    ITEMS, RARITY, DEFAULT, BASE, EVENTS, get, byKey, palette, eventById, activeEvent, visibleEvents, itemState, startOf, isPreview,
    drawSegment, drawHead, drawCocoon, drawButterfly, eatBurst, stepParticle, drawParticle, drawPreview, heartPath,
    drawBackdrop, backdropTop,
  };
})();
