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
    // Trên Huyền thoại: chỉ có ở sự kiện độc quyền, không bao giờ ra từ Hộp quà thường.
    dinhmenh: { name: 'Định mệnh', color: '#E0408A', weight: 0, exclusive: true },
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

    // ---------- Phần thưởng vụ án (không bán, không có trong hộp quà) ----------
    { id: 'tham-tu', slot: 'skin', name: 'Sâu Thám Tử', rarity: 'huyenthoai', price: 0, reward: 'vlts', ch: 13,
      memory: 'Thám tử Thủy phá vụ án đầu tiên: vạch lá, tìm ra Sâu Tím, mở hộp quà bằng đúng giờ em nhận lời.',
      pal: { body: '#D2B07F', body2: '#C49F6C', head: '#B79CF0', feet: '#6E4426', ant: '#6B4FA0', antTip: '#FF8FA3', mark: '#6E4426', cocoon: '#E6D2AE', cocoonLine: '#C49F6C' },
      acc: 'detective', pattern: 'coat', mark: 'ques', antLen: 2.05 },
    // Bộ Thám Tử: có Sâu Thám Tử là tự có cả bộ (wallet.js tự thêm, kể cả máy đã phá án từ trước).
    { id: 'manh-moi', slot: 'fx', name: 'Manh Mối', rarity: 'suthi', price: 0, reward: 'vlts', ch: 13,
      memory: 'Lá nào vạch ra cũng có manh mối: dấu chân bé xíu, dấu hỏi to đùng, và chiếc kính lúp soi tới tận Sâu Tím.',
      fx: { kind: 'clue', colors: ['#7A5CC8', '#B47D4A', '#FF6F8E'] } },
    { id: 'canh-tham-tu', slot: 'wing', name: 'Cánh Thám Tử', rarity: 'huyenthoai', price: 0, reward: 'vlts', ch: 13,
      memory: 'Hoá bướm rồi vẫn đội mũ thám tử: đôi cánh vải dạ kẻ ô, khuy hồng, kính lúp giắt bên cánh. Vụ án khép lại, chuyện mình thì mở ra.',
      wing: { top: '#C08A55', bottom: '#94603A', pattern: 'tweed', mark: 'lens', markColor: '#E2B04A', spot: '#FF8FA3', body: '#4A2E1C', hat: 'detective' } },
    { id: 'nen-vach-la', slot: 'bg', name: 'Nền Vạch Lá', rarity: 'suthi', price: 0, reward: 'vlts', ch: 13,
      memory: 'Đồi chè Thái Nguyên lúc nửa đêm. Kính lúp lia tới đâu, lá sáng tới đó. Kiên nhẫn chút, thế nào cũng thấy Sâu Tím trốn trong lá.',
      bg: { kind: 'case', theme: { night: true, cloud: '#2A2352', mote: null, stars: false, rain: false } } },

    // ---------- Định Mệnh (độc quyền, mở hộp): bộ của em (Sư phạm Văn) và bộ của anh (Điện tử Viễn thông) ----------
    // who: bộ này "là" của ai; mỗi máy được tặng skin của chính mình, còn lại phải mở Hộp Định Mệnh.
    { id: 'nang-tho', slot: 'skin', name: 'Sâu Nàng Thơ', rarity: 'dinhmenh', price: 0, ev: 'dinh-menh', who: 'thuy',
      memory: 'Cô giáo Văn tương lai: tà áo dài trắng thêu hoa đào, nón lá nghiêng, cây bút lông ngỗng giắt bên vành. Thương em, thương cả những trang thơ.',
      pal: { body: '#FFFBF4', body2: '#F9EFE4', head: '#FFE8EE', feet: '#C9A46A', ant: '#8C6A4A', antTip: '#FF8FA3', blush: 'rgba(255,111,142,0.62)', mark: '#B88A4A', mouth: '#C2456A', cocoon: '#FFF4E6', cocoonLine: '#E8D2B4', shine: 'rgba(255,255,255,0.7)' },
      acc: 'nonla', pattern: 'aodai', mark: 'book', eyes: 'lash', antHide: true, idle: 'poet', persona: 'tho' },
    { id: 'trang-tho', slot: 'fx', name: 'Trang Thơ', rarity: 'suthi', price: 0, ev: 'dinh-menh', who: 'thuy',
      memory: 'Lá vỡ ra thành những trang giấy nhỏ, chữ bay lả tả như câu thơ em chưa kịp viết xong.',
      fx: { kind: 'page', colors: ['#C23A5C', '#D9A441', '#7A5CC8'] } },
    { id: 'canh-trang-sach', slot: 'wing', name: 'Cánh Trang Sách', rarity: 'huyenthoai', price: 0, ev: 'dinh-menh', who: 'thuy',
      memory: 'Hoá bướm từ những trang sách đã đọc cùng nhau. Dải lụa đỏ đánh dấu trang đang đọc dở.',
      wing: { shape: 'book', paper: '#FFFBF2', paper2: '#F6E8CF', ink: '#5A4A6E', edge: '#D9B26A', ribbon: '#D6455E', body: '#4A3D63', glow: true } },
    { id: 'vi-mach', slot: 'skin', name: 'Sâu Vi Mạch', rarity: 'dinhmenh', price: 0, ev: 'dinh-menh', who: 'quang',
      memory: 'Kỹ sư Điện tử Viễn thông: thân là bảng mạch, râu là ăng-ten, tai nghe luôn bật. Sóng phát đi chỉ có một tần số: Lệ Thủy.',
      pal: { body: '#12594B', body2: '#0F4F43', head: '#B79CF0', feet: '#C9A24A', ant: '#C9CED6', antTip: '#38E8C6', mark: '#F2C14E', cocoon: '#1E6E5E', cocoonLine: '#F2C14E', blush: 'rgba(255,111,142,0.5)', shine: 'rgba(255,255,255,0.3)' },
      acc: 'headset', pattern: 'pcb', mark: 'chip', glow: '#38E8C6', antLen: 1.95, idle: 'signal', persona: 'mach' },
    { id: 'song-tin-hieu', slot: 'fx', name: 'Sóng Tín Hiệu', rarity: 'suthi', price: 0, ev: 'dinh-menh', who: 'quang',
      memory: 'Mỗi miếng lá là một gói tin: tia điện, số 0, số 1, và một vòng sóng gửi về Thái Nguyên.',
      fx: { kind: 'signal', colors: ['#14B89A', '#E8A93B', '#4FA3FF'] } },
    { id: 'canh-vi-mach', slot: 'wing', name: 'Cánh Vi Mạch', rarity: 'huyenthoai', price: 0, ev: 'dinh-menh', who: 'quang',
      memory: 'Đôi cánh bảng mạch, dòng điện chạy dọc từng đường đồng, sáng lên theo nhịp tim.',
      wing: { shape: 'circuit', top: '#10564A', bottom: '#0C4A3E', trace: '#E8B84A', pulse: '#5FFFE0', body: '#0B3A31', spot: '#5FFFE0', glow: true } },
    // Quà trọn bộ: đủ cả sáu món của hai bộ thì tự nhận.
    { id: 'nen-hai-tan-so', slot: 'bg', name: 'Nền Hai Tần Số', rarity: 'dinhmenh', price: 0, ev: 'dinh-menh', bonus: true,
      memory: 'Một ăng-ten ở Hà Nội, một khung cửa sổ có sách ở Thái Nguyên. Sóng đi bao xa cũng tìm về đúng một người.',
      bg: { kind: 'twofreq', theme: { night: true, cloud: '#2B2560', mote: null, stars: false, rain: false } } },
  ];

  // ================= Kỹ năng trong game =================
  // Chỉ skin độc quyền (Định mệnh) có kỹ năng: ăn lá để nạp, đầy thì chạm đúp màn hình
  // (hoặc phím cách, hoặc nút tròn) để dùng. Chưa nâng tối đa thì dùng thoải mái để làm thử thách;
  // nâng tối đa rồi thì mỗi tuần mỗi bé chỉ dùng được WEEK_USES ván, đầu ván game hỏi có dùng không.
  // Kỹ năng của các skin khác vẫn để trong bảng dưới nhưng đã tắt (anh Quang muốn game tập trung vào truyện).
  const SKILL_TIER = {
    thuong: { need: 30, time: 5 },
    hiem: { need: 26, time: 6 },
    suthi: { need: 23, time: 7 },
    huyenthoai: { need: 20, time: 7 },
    dinhmenh: { need: 18, time: 8 },
  };
  // Mỗi skin một cơ chế riêng để chọn skin là chọn lối chơi. fx:
  //   wide (miệng đớp rộng ×), magnet (hút lá gần trượt vào miệng), wind (gió thổi lá dạt về giữa),
  //   slow (lá rơi chậm lại ×), surf (bé lướt nhanh ×), clone (bé phân thân đứng đối xứng đớp giúp),
  //   star (ăn một lá thì sao băng đớp giùm lá kế), net (lưới giăng ngang đỡ N lá hụt), lotus (sen đỡ N lá hụt),
  //   shield (hụt không mất tim), candy (lá hụt hoá kẹo +điểm), guard (hụt không mất combo), combo2 (mỗi lá 2 combo),
  //   heal (+tim, 3 = đầy), healEvery (cứ N lá thêm 1 tim), overheal (cứ N lá thêm 1 tim, tới 5),
  //   score (điểm ×), ramp (càng ăn điểm càng tăng, tới ×2), harvest (mỗi lá thêm đốt cây),
  //   foresight (dấu chân chỉ lá sắp rơi), auto (tự lướt tới lá), perfect (lá nào cũng tối đa),
  //   vacuum (quyển sách hút mọi lá), rand (mỗi lần một phép). look: hình riêng (lens, waves).
  // burst: loại hạt bung ra khi dùng (xem drawParticle).
  const SKILLS = {
    'tim': { name: 'Măm Măm', color: '#9F7FE8', burst: 0, fx: { wide: 1.3 }, line: 'Há miệng thật to, lá lệch một chút vẫn đớp trúng.', lv: [{ wide: 1.42 }] },
    'bac-ha': { name: 'Mát Lạnh', color: '#3FBF95', burst: 4, fx: { combo2: true, guard: true }, line: 'Bình tĩnh như bạc hà, combo cứ thế tăng vù vù.', lv: [{ score: 1.2 }] },
    'dao': { name: 'Má Đào', color: '#F2788F', burst: 1, fx: { healEvery: 4 }, line: 'Ăn ngoan là má hồng, má hồng là khoẻ.', lv: [{ healEvery: 3 }] },
    'chanh': { name: 'Chua Lè', color: '#D9B81E', burst: 6, fx: { score: 1.6 }, line: 'Chua chua mà điểm lại ngọt.', lv: [{ score: 1.85 }] },
    'bien': { name: 'Lướt Sóng', color: '#3AA8D8', burst: 2, fx: { surf: 1.8 }, line: 'Cưỡi sóng mà đi, nhanh như cá.', lv: [{ surf: 2.1 }] },
    'cacao': { name: 'Ngọt Dần', color: '#A86B3C', burst: 12, fx: { ramp: 0.12 }, line: 'Miếng sau ngọt hơn miếng trước.', lv: [{ ramp: 0.17 }] },
    'lim-dim': { name: 'Ngủ Gật', color: '#7F8CDB', burst: 5, fx: { shield: true }, line: 'Ngủ gật mà vẫn bình an.', lv: [{ guard: true }] },
    'mi-tom': { name: 'Húp Sụp', color: '#E8A21E', burst: 10, fx: { magnet: 2.6 }, line: 'Húp một hơi là sạch bát, sợi nào cũng trôi tuột vào miệng.', lv: [{ magnet: 3.2 }] },
    'at-do-hoi': { name: 'Tưng Tửng', color: '#F27A2E', burst: 8, fx: { rand: true }, line: 'Không ai biết lần này bé sẽ làm gì.', lv: [{}, { score: 1.3 }] },
    'ngay-mua': { name: 'Mưa Chậm', color: '#5F8FE0', burst: 2, fx: { slow: 0.5 }, line: 'Ngày mưa, mọi thứ chậm lại một nhịp.', lv: [{ slow: 0.42 }, { slow: 0.35, guard: true }] },
    'sinh-nhat': { name: 'Thổi Nến', color: '#F06A8A', burst: 8, fx: { heal: 3, score: 1.3 }, line: 'Thổi nến, ước một điều thật to.', lv: [{ score: 1.5 }, { score: 1.8 }] },
    'lua-chin': { name: 'Được Mùa', color: '#D99A1E', burst: 10, fx: { harvest: 1 }, line: 'Lúa chín vàng đồng, mùa này bội thu.', lv: [{}, { harvest: 2 }] },
    'phu-thuy': { name: 'Phân Thân', color: '#9B62F0', burst: 6, fx: { clone: true }, line: 'Một câu thần chú, hai bé cùng đớp.', lv: [{}, { guard: true }] },
    'sen-hong': { name: 'Sen Đỡ', color: '#EE6FA3', burst: 4, fx: { lotus: 3, guard: true }, line: 'Sen nở giữa đầm, thơm cả một vùng.', lv: [{ lotus: 4 }, { lotus: 5 }, { lotus: 6, shield: true }] },
    'sa-pa': { name: 'Gió Núi', color: '#6E9BE0', burst: 5, fx: { wind: 0.65 }, line: 'Gió núi Sa Pa lồng lộng, mây trôi lưng chừng trời.', lv: [{ wind: 0.75 }, { wind: 0.85 }, { wind: 0.92, guard: true }] },
    'dem-sao': { name: 'Sao Băng', color: '#E8B830', burst: 6, fx: { star: true }, line: 'Ước một điều khi sao băng bay qua.', lv: [{}, { score: 1.3 }, { star2: true, score: 1.5 }] },
    'be-hong': { name: 'Cưng Chiều', color: '#F0507A', burst: 1, fx: { overheal: 2 }, line: 'Được cưng chiều thì chẳng sợ gì.', lv: [{}, { heal: 1 }, { overheal: 1 }] },
    'tho-cam': { name: 'Lưới Thổ Cẩm', color: '#D62F45', burst: 9, fx: { net: 14 }, line: 'Từng sợi chỉ đỏ, sợi chỉ vàng dệt nên tấm lưới.', lv: [{ net: 18 }, { net: 22 }, { net: 28, guard: true }] },
    'bi-ngo': { name: 'Ghẹo Ma', color: '#F08A2A', burst: 11, fx: { candy: 150, score: 1.5 }, line: 'Không cho kẹo là bị ghẹo!', lv: [{ candy: 250 }, { score: 1.8 }, { candy: 400, score: 2 }] },
    'tham-tu': { name: 'Kính Lúp', color: '#D9A034', burst: 17, look: 'lens', fx: { wide: 1.45, foresight: true, guard: true }, line: 'Thám tử soi đâu trúng đó.', lv: [{ wide: 1.55 }, { wide: 1.65 }, { wide: 1.75, shield: true }] },
    'nang-tho': { name: 'Gió Thơ', color: '#F06A8A', burst: 14, fx: { vacuum: true, score: 1.5 }, line: 'Quyển sách mở ra giữa trời, gió thơ nổi lên.', lv: [{ score: 1.7 }, { score: 1.9 }, { score: 2.2 }, { score: 3, overheal: 6 }] },
    'vi-mach': { name: 'Khoá Sóng', color: '#1FC8A6', burst: 16, look: 'waves', fx: { auto: true, perfect: true, shield: true, guard: true, score: 1.5 }, line: 'Phát sóng dò tìm, khoá đúng tần số, bắt sóng là trúng.', lv: [{ score: 1.65 }, { score: 1.85 }, { score: 2.2 }, { score: 3, domain: true }] },
  };
  // ----- Nâng cấp kỹ năng (Tiệm Sâu): skin càng xịn càng nâng được nhiều bậc, phí không rẻ -----
  // Mỗi bậc: nạp ít lá hơn (UP_NEED), dùng lâu thêm 1 giây, và phần lv[bậc-1] của skin (chỉ số riêng mạnh lên).
  // Định mệnh có bậc 4 là Đột phá: nâng xong 3 bậc mới mở thử thách, xong thử thách mới đột phá được.
  const UP_COST = {
    thuong: [300],
    hiem: [500, 1000],
    suthi: [900, 1800, 3000],
    huyenthoai: [1200, 2500, 4000],
    dinhmenh: [1500, 3000, 5000, 6000],
  };
  const UP_NEED = [1, 0.88, 0.78, 0.7, 0.6];
  // Thử thách đột phá: chỉ tính khi đang mặc đúng skin đó và kỹ năng đã ở bậc 3.
  const BREAK_GOALS = [
    { id: 'uses', need: 40, text: 'Dùng kỹ năng 40 lần' },
    { id: 'combo', need: 150, text: 'Đạt combo 150 trong một ván' },
    { id: 'hard', need: 3, text: 'Đủ 3 sao ở 3 bài khác nhau, mức Vừa, không hồi sinh' },
  ];
  const BREAK = {
    'nang-tho': { name: 'Thơ Tràn Trang', quest: 'Tuyển Tập Thơ', line: 'Trang sách đầy thơ đến tràn ra: mỗi 6 chiếc lá vào sách thêm một nhịp tim, tim vượt lên được tới 5.' },
    'vi-mach': { name: 'Lãnh Địa Vi Mạch', quest: 'Phủ Sóng Toàn Quốc', super: true, line: 'Đột phá siêu cấp: nạp đủ 60 lá rồi chạm đúp, mở ra một thế giới bảng mạch riêng. Né laze của chiếc lá chip khổng lồ, húc vào nó rồi chạm liên tục cho nổ tung, thu về tới 300 lá, 300.000 điểm và 300 đốt (có món ×2 điểm, ×2 đốt). Trúng laze mất 60 đốt.' },
  };

  // Tưng Tửng: mỗi lần dùng bốc một phép của skin khác (name để báo cho người chơi biết).
  const SKILL_RAND = [
    { name: 'Húp Sụp', fx: { magnet: 3 } }, { name: 'Mưa Chậm', fx: { slow: 0.45 } }, { name: 'Phân Thân', fx: { clone: true } },
    { name: 'Sao Băng', fx: { star: true } }, { name: 'Chua Lè', fx: { score: 2.5 } }, { name: 'Ngủ Gật', fx: { shield: true, guard: true } },
  ];
  // Biểu tượng nét của từng kỹ năng (viewBox 24). D: tô nhạt màu kỹ năng, P: tô đặc.
  const SKILL_ICONS = {
    'tim': '<path D d="M4 20C4 11 10 5 20 4c0 3.2-.8 6-2.2 8.2a1.8 1.8 0 0 1-2.3 2.4 1.8 1.8 0 0 1-2 2.6C10.6 19.4 7.6 20.2 4 20z"/><path d="M4 20l8.5-8.5"/>',
    'bac-ha': '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.6 4.6L12 7l2.4-2.4M9.6 19.4L12 17l2.4 2.4"/><circle D cx="12" cy="12" r="2.4"/>',
    'dao': '<path D d="M12 20c-4.4 0-7-3-7-6.6C5 9.8 8 7.5 12 9c4-1.5 7 .8 7 4.4 0 3.6-2.6 6.6-7 6.6z"/><path d="M12 9c-.9 3.4-.9 7.4 0 11M12 9c0-2.6 1.6-4.6 4.6-5.1 0 2.7-1.8 4.6-4.6 5.1z"/>',
    'chanh': '<circle cx="12" cy="12" r="8.5"/><circle D cx="12" cy="12" r="6"/><path d="M12 6v12M6.8 9l10.4 6M6.8 15l10.4-6"/>',
    'bien': '<path D d="M4 14c0-5.5 4-9.5 9-9.5 3 0 5.3 1.5 6 3.5-2-.8-4.4-.3-5.6 1.6-1.2 2-.6 4.4 1.2 5.4H4z"/><path d="M3 18.5c2.5 0 3-1.8 5.5-1.8s3 1.8 5.5 1.8 3-1.8 5.5-1.8"/>',
    'cacao': '<rect D x="5" y="3.5" width="14" height="17" rx="2"/><path d="M5 9.2h14M5 14.8h14M12 3.5v17"/>',
    'lim-dim': '<path D d="M14 4.6A7.6 7.6 0 1 0 19.4 15 6.2 6.2 0 0 1 14 4.6z"/><path d="M16.5 3H20l-3.5 3.5H20"/>',
    'mi-tom': '<path D d="M3.5 12h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 20.5h6M8 12c0-2 1.6-2.2 1.6-4.2S8 5.6 8 3.8M12 12c0-2 1.6-2.2 1.6-4.2S12 5.6 12 3.8M15 9.5l6.5-5M16 11.5l6-3.2"/>',
    'at-do-hoi': '<rect D x="4" y="4" width="16" height="16" rx="4"/><circle P cx="8.5" cy="8.5" r="1.4"/><circle P cx="15.5" cy="8.5" r="1.4"/><circle P cx="12" cy="12" r="1.4"/><circle P cx="8.5" cy="15.5" r="1.4"/><circle P cx="15.5" cy="15.5" r="1.4"/>',
    'ngay-mua': '<path D d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v6.5a2 2 0 0 0 4 0M6 15.5V18M19 15v2.2"/>',
    'sinh-nhat': '<path D d="M4.5 12h15v8.5h-15z"/><path d="M4.5 15.5c1.5 1 2.5 1 3.75 0s2.5-1 3.75 0 2.5 1 3.75 0 2.25-1 3.75 0M12 12V8.5"/><path P d="M12 3.5c1.3 1.4 1.3 2.8 0 3.6-1.3-.8-1.3-2.2 0-3.6z"/>',
    'lua-chin': '<path d="M7 21c1.6-5.4 3.8-11.4 10.6-17.5"/><path D d="M10.4 14.2c-2.3-.3-3.6-2-3.6-4.1 2.3.2 3.7 1.9 3.6 4.1zM13.2 10.2c-2.3-.3-3.6-2-3.6-4.1 2.3.2 3.7 1.9 3.6 4.1zM11.6 15.4c.7-2.2 2.6-3.3 4.6-3-.4 2.2-2.4 3.4-4.6 3zM14.3 11.4c.7-2.2 2.6-3.3 4.6-3-.4 2.2-2.4 3.4-4.6 3z"/>',
    'phu-thuy': '<circle D cx="7" cy="15.5" r="3.8"/><path d="M3.2 11.5h7.6M5.2 11.5L7 5l1.8 6.5"/><circle cx="17" cy="15.5" r="3.8" stroke-dasharray="2.2 2"/><path d="M13.2 11.5h7.6M15.2 11.5L17 5l1.8 6.5" stroke-dasharray="2 2"/><path d="M12 3.5v17" stroke-dasharray="1 2.6"/>',
    'sen-hong': '<path D d="M12 18.5c-3-2-4-6-2.5-10 1 1.2 2 2.4 2.5 4 .5-1.6 1.5-2.8 2.5-4 1.5 4 .5 8-2.5 10z"/><path d="M12 18.5c-4.2 0-7.6-2.6-8.5-6.6 2.6-.3 5 .9 6.6 3.1M12 18.5c4.2 0 7.6-2.6 8.5-6.6-2.6-.3-5 .9-6.6 3.1M5 21.5h14"/>',
    'sa-pa': '<path D d="M2 20l6-9 4 5 3-4 7 8z"/><path d="M4 6.5h8.5a2 2 0 1 0-2-2M6 9.5h11a2 2 0 1 1-2 2"/>',
    'dem-sao': '<path D d="M16 3.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.7 1.4.5-3-2.2-2.1 3-.4z"/><path d="M11.5 11.5l-7.5 7.5M13.5 14l-5 5M9 9.5l-4.5 4.5"/>',
    'be-hong': '<path D d="M11 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 18 10c0 5.6-7 10-7 10z"/><path d="M19 2.5v5M16.5 5h5"/>',
    'tho-cam': '<path D d="M12 4l8 8-8 8-8-8z"/><path d="M8 8l8 8M16 8l-8 8M2 12h2M20 12h2"/><circle P cx="12" cy="12" r="1.5"/>',
    'bi-ngo': '<path D d="M12 7.5c4.4 0 8 2.6 8 6.3S16.4 20 12 20s-8-2.5-8-6.2 3.6-6.3 8-6.3z"/><path d="M12 7.5c0-2 .9-3.2 2.6-3.7M8.3 16l1.2.9 1.2-.9 1.3.9 1.2-.9 1.3.9 1.2-.9"/><path P d="M7.8 13l1.6-2.2L11 13zM13 13l1.6-2.2 1.6 2.2z"/>',
    'tham-tu': '<circle D cx="10" cy="10" r="6"/><path d="M14.5 14.5l6 6M7.3 8.6a3 3 0 0 1 2.4-2.1"/>',
    'nang-tho': '<path D d="M12 6.5C10 5 7 4.5 3 5v13.5c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5z"/><path d="M12 6.5V20M5.5 9h3.5M5.5 12h3.5M15 9h3.5M15 12h3.5"/>',
    'vi-mach': '<path d="M12 11.5V21M8.5 21h7M12 11.5L9.2 21M12 11.5l2.8 9.5M8.6 6.2a4.8 4.8 0 0 1 6.8 0M6 3.6a8.5 8.5 0 0 1 12 0"/><circle P cx="12" cy="9.6" r="1.7"/>',
  };
  // tier 0: biểu tượng nét thường; 1: đã nâng tối đa (Sử thi trở lên): khung đá quý lục giác ánh vàng, lấp lánh;
  // 2: đột phá siêu cấp (Định mệnh bậc 4): đá quý tím trên vầng tia sáng xoay (xem .sk-rays trong CSS).
  function skillIcon(id, size, tier) {
    const body = SKILL_ICONS[id];
    if (!body) return '';
    const n = size || 24;
    const paint = (b) => b.replace(/ D /g, ' fill="currentColor" fill-opacity=".24" ').replace(/ P /g, ' fill="currentColor" stroke="none" ');
    const svg = (vb, cls, inner) => '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="' + vb + '" width="' + n + '" height="' + n + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
    if (!tier) return svg('0 0 24 24', '', paint(body));
    const c = (SKILLS[id] || {}).color || '#E2B04A';
    // màu đậm hơn của chính màu kỹ năng (để đá quý không bị đục khi pha với màu khác)
    const deep = '#' + [1, 3, 5].map((i) => Math.round(parseInt(c.slice(i, i + 2), 16) * 0.62).toString(16).padStart(2, '0')).join('');
    const gid = 'skg-' + id + '-' + tier;
    const defs = '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c + '"/><stop offset="1" stop-color="' + (tier === 2 ? '#5B26D8' : deep) + '"/></linearGradient>'
      + (tier === 2 ? '<linearGradient id="' + gid + 'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset="1" stop-color="#FF6FB5"/></linearGradient>' : '') + '</defs>';
    let rays = '';
    if (tier === 2) {
      let d = '';
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12) * Math.PI * 2, a1 = a0 + Math.PI / 12, a2 = a0 + Math.PI / 6;
        d += (i ? 'L' : 'M') + (12 + Math.cos(a0) * 13.4).toFixed(2) + ' ' + (12 + Math.sin(a0) * 13.4).toFixed(2)
          + 'L' + (12 + Math.cos(a1) * 9.6).toFixed(2) + ' ' + (12 + Math.sin(a1) * 9.6).toFixed(2)
          + 'L' + (12 + Math.cos(a2) * 13.4).toFixed(2) + ' ' + (12 + Math.sin(a2) * 13.4).toFixed(2);
      }
      rays = '<g class="sk-rays"><path d="' + d + 'Z" fill="url(#' + gid + 'r)" stroke="none"/></g>';
    }
    const gem = '<path d="M12 1.2l9.4 5.4v10.8L12 22.8l-9.4-5.4V6.6z" fill="url(#' + gid + ')" stroke="' + (tier === 2 ? '#FFF1C9' : '#FFE7A0') + '" stroke-width="1.1"/>'
      + '<path d="M12 1.2l9.4 5.4L12 12 2.6 6.6z" fill="#FFFFFF" fill-opacity=".2" stroke="none"/>';
    const inner = '<g transform="translate(12 12) scale(' + (tier === 2 ? 0.52 : 0.58) + ') translate(-12 -12)" color="#FFFFFF" stroke="#FFFFFF" stroke-width="2.3">' + paint(body) + '</g>';
    const spark = '<path class="sk-spark" d="M20.2 .4l.65 1.6 1.6.65-1.6.65-.65 1.6-.65-1.6-1.6-.65 1.6-.65z" fill="#FFF6C8" stroke="#E8A21E" stroke-width=".5"/>'
      + (tier === 2 ? '<path class="sk-spark" d="M3.4 18.6l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" fill="#FFF6C8" stroke="#E8A21E" stroke-width=".5"/>' : '');
    return svg(tier === 2 ? '-2.2 -2.2 28.4 28.4' : '-0.6 -0.6 25.2 25.2', 'sk-tier' + tier, defs + rays + gem + inner + spark);
  }
  function skillEffects(fx) {
    const out = [];
    const pct = (m) => Math.round((m - 1) * 100) + '%';
    if (fx.vacuum) out.push('quyển sách hút mọi chiếc lá, cả cành lá dài, bé chỉ việc đứng yên');
    if (fx.auto) out.push('bé tự lướt tới từng chiếc lá');
    if (fx.magnet) out.push('lá rơi trong vùng rộng gấp ' + String(fx.magnet).replace('.', ',') + ' lần miệng bị hút trượt vào miệng');
    if (fx.wind) out.push('gió thổi lá dạt ' + Math.round(fx.wind * 100) + '% về giữa màn');
    if (fx.slow) out.push('lá rơi chậm lại ' + Math.round((1 - fx.slow) * 100) + '%, nhìn rõ dễ đớp');
    if (fx.surf) out.push('bé lướt nhanh hơn ' + pct(fx.surf));
    if (fx.clone) out.push('hiện thêm một bé phân thân đứng đối xứng, đớp giúp');
    if (fx.star) out.push(fx.star2 ? 'ăn một lá là hai ngôi sao băng bay đi đớp giùm hai lá kế tiếp' : 'ăn một lá là sao băng bay đi đớp giùm lá kế tiếp');
    if (fx.wide) out.push('miệng đớp rộng hơn ' + pct(fx.wide));
    if (fx.foresight) out.push('dấu chân chỉ chỗ 3 lá sắp rơi');
    if (fx.net) out.push('lưới thổ cẩm giăng ngang đỡ ' + fx.net + ' lá rơi trượt');
    if (fx.lotus) out.push('đoá sen đỡ ' + fx.lotus + ' lá rơi trượt, vẫn tính là ăn');
    if (fx.perfect) out.push('lá nào đớp được cũng tính điểm tối đa');
    if (fx.shield) out.push('hụt lá không mất tim');
    if (fx.candy) out.push('lá hụt hoá kẹo: không mất tim mà còn +' + fx.candy + ' điểm');
    if (fx.guard) out.push('hụt lá không mất combo');
    if (fx.combo2) out.push('mỗi lá tính 2 combo');
    if (fx.heal) out.push(fx.heal >= 3 ? 'hồi đầy tim' : 'được thêm ' + fx.heal + ' tim');
    if (fx.healEvery) out.push('cứ ' + fx.healEvery + ' lá ăn được thêm 1 tim');
    if (fx.overheal) out.push((fx.overheal === 1 ? 'mỗi lá' : 'cứ ' + fx.overheal + ' lá') + ' ăn được thêm 1 tim, tim vượt lên được tới 5');
    if (fx.score) out.push('điểm ×' + String(fx.score).replace('.', ','));
    if (fx.ramp) out.push('càng ăn điểm càng tăng (mỗi lá thêm ' + Math.round(fx.ramp * 100) + '%), tới ×2');
    if (fx.harvest) out.push('mỗi lá ăn được tặng thêm ' + fx.harvest + ' đốt cây');
    if (fx.rand) out.push('mỗi lần dùng ra phép của một skin khác, có khi siêu mạnh');
    if (fx.refill) out.push('dùng xong tự nạp lại sẵn ' + Math.round(fx.refill * 100) + '%');
    if (fx.domain) out.push('nạp đủ 60 lá mở Lãnh Địa Vi Mạch: né laze, húc nát lá chip khổng lồ, thu về tới 300 lá, 300.000 điểm và 300 đốt');
    return out;
  }
  const WEEK_USES = 3;
  const hasSkill = (item) => !!(item && item.rarity === 'dinhmenh' && SKILLS[item.id]);
  // Số bậc nâng cấp tối đa của skin (theo độ hiếm).
  const skillMax = (item) => (hasSkill(item) ? (UP_COST[item.rarity] || []).length : 0);
  // Kỹ năng của một skin, đủ số lá cần nạp và số giây theo độ hiếm.
  // level: bậc nâng cấp (0 = chưa nâng). Gộp các phần lv của từng bậc vào fx gốc.
  function skillOf(item, level) {
    if (!hasSkill(item)) return null;
    const base = SKILLS[item.id];
    const tier = SKILL_TIER[item.rarity] || SKILL_TIER.thuong;
    const max = skillMax(item);
    const lvl = Math.max(0, Math.min(max, Math.floor(level || 0)));
    let fx = Object.assign({}, base.fx);
    for (let i = 0; i < lvl; i++) fx = Object.assign(fx, (base.lv || [])[i] || {});
    const sk = Object.assign({ id: item.id, rarity: item.rarity }, base, {
      fx, level: lvl, max,
      need: Math.max(6, Math.round(tier.need * UP_NEED[lvl])),
      time: tier.time + lvl,
      breakthrough: lvl >= 4 && BREAK[item.id] ? BREAK[item.id].name : '',
      weekly: lvl >= max,
    });
    // Biểu tượng: đủ 3 bậc thì đổi khung đá quý; đột phá thì siêu cấp.
    sk.iconTier = sk.breakthrough ? 2 : lvl >= 3 ? 1 : 0;
    sk.effects = skillEffects(sk.fx);
    sk.how = 'Ăn đủ ' + sk.need + ' lá để nạp đầy, rồi chạm đúp màn hình (máy tính bấm phím cách). Kỹ năng kéo dài ' + sk.time + ' giây.'
      + (sk.weekly ? ' Đã max: dùng ' + WEEK_USES + ' ván mỗi tuần.' : '');
    sk.text = sk.line + ' Trong ' + sk.time + ' giây: ' + sk.effects.join(', ') + '. ' + sk.how;
    return sk;
  }

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
    {
      // Sự kiện độc quyền mở hộp (không phải vòng quay), mở mãi tới khi sưu tập đủ.
      // Mỗi máy được tặng skin của chính mình (gift), skin của người kia và các món còn lại phải mở hộp.
      id: 'dinh-menh',
      kind: 'box',
      name: 'Định Mệnh · Văn & Sóng',
      short: 'Định Mệnh',
      tagline: 'Hộp Định Mệnh độc quyền: một bộ của Văn, một bộ của Sóng.',
      start: Date.parse('2026-10-23T00:00:00+07:00'),
      end: Date.parse('2100-01-01T00:00:00+07:00'),
      forever: true,
      style: 'destiny',
      price: 200,     // đốt mỗi hộp (độc quyền nên đắt hơn hộp thường)
      pity: 40,       // tối đa 40 hộp là có skin Định mệnh của người kia
      gift: { thuy: 'skin:nang-tho', quang: 'skin:vi-mach' },
      bonus: 'bg:nen-hai-tan-so',
      sets: [
        { id: 'nang-tho', name: 'Bộ Nàng Thơ', who: 'thuy', sub: 'Sư phạm Văn', items: ['skin:nang-tho', 'fx:trang-tho', 'wing:canh-trang-sach'] },
        { id: 'vi-mach', name: 'Bộ Vi Mạch', who: 'quang', sub: 'Điện tử Viễn thông', items: ['skin:vi-mach', 'fx:song-tin-hieu', 'wing:canh-vi-mach'] },
      ],
      // Tỉ lệ mỗi hộp (phần trăm) theo vai: món nào có rồi thì bỏ ra, phần còn lại chia lại.
      odds: { partnerSkin: 3, wing: 7, fx: 12, dot: [{ dot: 40, w: 34 }, { dot: 100, w: 25 }] },
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
    } else if (kind === 'book') {
      // quyển sách mở, hai trang có dòng chữ
      x.beginPath();
      x.moveTo(cx, cy - s * 0.3);
      x.quadraticCurveTo(cx - s * 0.5, cy - s * 0.62, cx - s * 1.05, cy - s * 0.42);
      x.lineTo(cx - s * 1.05, cy + s * 0.52);
      x.quadraticCurveTo(cx - s * 0.5, cy + s * 0.32, cx, cy + s * 0.6);
      x.quadraticCurveTo(cx + s * 0.5, cy + s * 0.32, cx + s * 1.05, cy + s * 0.52);
      x.lineTo(cx + s * 1.05, cy - s * 0.42);
      x.quadraticCurveTo(cx + s * 0.5, cy - s * 0.62, cx, cy - s * 0.3);
      x.fill();
      x.strokeStyle = 'rgba(255,251,242,0.95)';
      x.lineWidth = Math.max(0.6, s * 0.11);
      x.lineCap = 'round';
      x.beginPath();
      for (const k of [-0.08, 0.2]) {
        x.moveTo(cx - s * 0.82, cy + k * s - s * 0.06); x.quadraticCurveTo(cx - s * 0.45, cy + k * s - s * 0.2, cx - s * 0.18, cy + k * s);
        x.moveTo(cx + s * 0.82, cy + k * s - s * 0.06); x.quadraticCurveTo(cx + s * 0.45, cy + k * s - s * 0.2, cx + s * 0.18, cy + k * s);
      }
      x.stroke();
    } else if (kind === 'chip') {
      // vi mạch nhỏ: chân vàng bốn phía, giữa có trái tim
      const h = s * 0.62;
      x.fillStyle = color;
      for (let i = -1; i <= 1; i++) {
        const o = i * h * 0.55;
        x.fillRect(cx + o - h * 0.12, cy - h * 1.32, h * 0.24, h * 0.4);
        x.fillRect(cx + o - h * 0.12, cy + h * 0.92, h * 0.24, h * 0.4);
        x.fillRect(cx - h * 1.32, cy + o - h * 0.12, h * 0.4, h * 0.24);
        x.fillRect(cx + h * 0.92, cy + o - h * 0.12, h * 0.4, h * 0.24);
      }
      x.fillStyle = '#1B2430';
      x.beginPath();
      x.moveTo(cx - h + h * 0.25, cy - h); x.lineTo(cx + h - h * 0.25, cy - h); x.quadraticCurveTo(cx + h, cy - h, cx + h, cy - h + h * 0.25);
      x.lineTo(cx + h, cy + h - h * 0.25); x.quadraticCurveTo(cx + h, cy + h, cx + h - h * 0.25, cy + h);
      x.lineTo(cx - h + h * 0.25, cy + h); x.quadraticCurveTo(cx - h, cy + h, cx - h, cy + h - h * 0.25);
      x.lineTo(cx - h, cy - h + h * 0.25); x.quadraticCurveTo(cx - h, cy - h, cx - h + h * 0.25, cy - h);
      x.fill();
      x.fillStyle = '#FF6F8E';
      heartPath(x, cx, cy + h * 0.05, h * 0.5);
      x.fill();
    } else if (kind === 'ques') {
      // dấu chấm hỏi của thám tử
      x.lineWidth = s * 0.3;
      x.lineCap = 'round';
      x.beginPath();
      x.arc(cx, cy - s * 0.36, s * 0.38, Math.PI * 1.1, Math.PI * 2.28);
      x.quadraticCurveTo(cx, cy - s * 0.02, cx, cy + s * 0.26);
      x.stroke();
      x.beginPath(); x.arc(cx, cy + s * 0.7, s * 0.17, 0, TAU); x.fill();
    } else if (kind === 'lens') {
      // kính lúp: vành vàng, mặt kính xanh nhạt có vệt sáng và trái tim nhỏ, cán gỗ chéo xuống
      x.strokeStyle = '#5A3A22';
      x.lineWidth = s * 0.36;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(cx + s * 0.5, cy + s * 0.5); x.lineTo(cx + s * 1.15, cy + s * 1.15); x.stroke();
      x.fillStyle = 'rgba(214,238,255,0.88)';
      x.beginPath(); x.arc(cx, cy, s * 0.68, 0, TAU); x.fill();
      x.strokeStyle = color;
      x.lineWidth = s * 0.22;
      x.beginPath(); x.arc(cx, cy, s * 0.68, 0, TAU); x.stroke();
      x.fillStyle = '#FF6F8E';
      heartPath(x, cx + s * 0.06, cy + s * 0.08, s * 0.28); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.95)';
      x.lineWidth = s * 0.12;
      x.beginPath(); x.arc(cx, cy, s * 0.44, Math.PI * 1.1, Math.PI * 1.48); x.stroke();
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

  // Áo măng tô thám tử: thắt lưng nâu khoá vàng, hàng cúc đôi (đốt mang dấu thì không cúc).
  function coatBelt(x, r, bean, variant) {
    x.save();
    clipBody(x, r, bean);
    x.fillStyle = '#7A5230';
    x.fillRect(-r, r * 0.4, r * 2, r * 0.22);
    x.strokeStyle = '#E2A93B';
    x.lineWidth = r * 0.07;
    x.strokeRect(-r * 0.13, r * 0.38, r * 0.26, r * 0.26);
    if (variant !== 2) {
      x.fillStyle = '#7A5230';
      for (const bx of [-0.3, 0.3]) for (const by of [-0.42, -0.02]) { x.beginPath(); x.arc(bx * r, by * r, r * 0.075, 0, TAU); x.fill(); }
    }
    x.restore();
  }

  // Tà áo dài trắng thêu: cành chỉ vàng, hai bông đào hồng, lá xanh nhạt (đốt mang dấu thì để trống cho quyển sách).
  function aodaiFloral(x, r, bean, variant) {
    x.save();
    clipBody(x, r, bean);
    // bóng nhẹ quanh mép để tà áo trắng không chìm vào nền sáng
    x.strokeStyle = 'rgba(214,180,150,0.45)';
    x.lineWidth = r * 0.22;
    x.beginPath();
    if (bean) x.ellipse(0, 0, r, r * 0.92, 0, 0, TAU); else x.arc(0, 0, r, 0, TAU);
    x.stroke();
    if (variant === 2) { x.restore(); return; }
    if (variant === 1) x.scale(-1, 1);
    x.strokeStyle = '#D9B26A';
    x.lineWidth = r * 0.06;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(-r * 0.85, r * 0.72);
    x.quadraticCurveTo(-r * 0.15, r * 0.4, r * 0.38, -r * 0.4);
    x.moveTo(-r * 0.18, r * 0.38);
    x.quadraticCurveTo(-r * 0.05, r * 0.1, -r * 0.3, -r * 0.05);
    x.stroke();
    x.fillStyle = '#A9D3AE';
    for (const [lx, ly, a] of [[-r * 0.42, r * 0.5, -0.7], [r * 0.08, r * 0.1, -1.1], [-r * 0.32, r * 0.12, 0.6]]) {
      x.beginPath(); x.ellipse(lx, ly, r * 0.15, r * 0.06, a, 0, TAU); x.fill();
    }
    for (const [fx, fy, fs] of [[r * 0.4, -r * 0.42, r * 0.17], [-r * 0.3, -r * 0.06, r * 0.12]]) {
      x.fillStyle = '#FFB7C9';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU - Math.PI / 2;
        x.beginPath(); x.ellipse(fx + Math.cos(a) * fs * 0.62, fy + Math.sin(a) * fs * 0.62, fs * 0.5, fs * 0.38, a, 0, TAU); x.fill();
      }
      x.fillStyle = '#E8A93B';
      x.beginPath(); x.arc(fx, fy, fs * 0.28, 0, TAU); x.fill();
    }
    x.restore();
  }
  // Bảng mạch: đường đồng vàng gấp khúc, chân hàn tròn, một đèn LED nhỏ (xanh hoặc đỏ).
  function pcbTraces(x, r, bean, variant) {
    x.save();
    clipBody(x, r, bean);
    if (variant === 1) x.scale(-1, 1);
    x.strokeStyle = 'rgba(232,184,74,0.95)';
    x.lineWidth = r * 0.075;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.beginPath();
    x.moveTo(-r, -r * 0.25); x.lineTo(-r * 0.42, -r * 0.25); x.lineTo(-r * 0.16, -r * 0.52); x.lineTo(r * 0.52, -r * 0.52);
    x.moveTo(-r, r * 0.36); x.lineTo(-r * 0.22, r * 0.36); x.lineTo(r * 0.1, r * 0.06); x.lineTo(r, r * 0.06);
    x.moveTo(r * 0.3, r); x.lineTo(r * 0.3, r * 0.48); x.lineTo(r * 0.62, r * 0.48);
    x.stroke();
    for (const [px, py] of [[r * 0.52, -r * 0.52], [-r * 0.42, -r * 0.25], [r * 0.62, r * 0.48], [-r * 0.22, r * 0.36]]) {
      x.fillStyle = '#F2C14E';
      x.beginPath(); x.arc(px, py, r * 0.1, 0, TAU); x.fill();
      x.fillStyle = '#0B3A31';
      x.beginPath(); x.arc(px, py, r * 0.04, 0, TAU); x.fill();
    }
    if (variant !== 2) {
      const c = variant ? '#FF4F7B' : '#5FFFE0';
      x.fillStyle = c;
      x.globalAlpha = 0.35;
      x.beginPath(); x.arc(-r * 0.46, r * 0.66, r * 0.2, 0, TAU); x.fill();
      x.globalAlpha = 1;
      x.beginPath(); x.arc(-r * 0.46, r * 0.66, r * 0.09, 0, TAU); x.fill();
    }
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
    else if (skin.pattern === 'coat') coatBelt(x, r, skin.shape === 'bean', variant);
    else if (skin.pattern === 'aodai') aodaiFloral(x, r, skin.shape === 'bean', variant);
    else if (skin.pattern === 'pcb') pcbTraces(x, r, skin.shape === 'bean', variant);
    x.fillStyle = p.shine;
    x.beginPath(); x.ellipse(-r * 0.3, -r * 0.38, r * 0.42, r * 0.24, -0.4, 0, TAU); x.fill();
    if (variant === 2 && skin.mark !== 'none') drawMark(x, skin.mark || 'heart', 0, skin.pattern ? 0 : r * 0.05, skin.mark === 'jack' ? r * 0.62 : r * 0.32, p.mark, S);
  }

  // ================= Phụ kiện trên đầu =================
  // Vẽ trong toạ độ của đầu (tâm đầu ở gốc). back = phần nằm sau đầu (vẽ trước đầu).
  function drawAccessory(x, acc, r, S, t, back, st) {
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
    } else if (acc === 'nonla') {
      // Nón lá nghiêng, dải lụa hồng quanh vành, bút lông ngỗng giắt bên phải, quai lụa thắt nơ dưới cằm.
      if (back) return;
      x.save();
      x.translate(r * 0.04, -r * 0.5);
      x.rotate(-0.16);
      x.fillStyle = 'rgba(120,80,40,0.16)';
      x.beginPath(); x.ellipse(0, r * 0.14, r * 1.02, r * 0.2, 0, 0, TAU); x.fill();
      const gr = x.createLinearGradient(-r * 1.35, 0, r * 1.35, 0);
      gr.addColorStop(0, '#E3CA92'); gr.addColorStop(0.45, '#FBF0D2'); gr.addColorStop(1, '#D8BC80');
      x.fillStyle = gr;
      x.beginPath();
      x.moveTo(0, -r * 1.3);
      x.quadraticCurveTo(r * 0.72, -r * 0.58, r * 1.38, -r * 0.02);
      x.quadraticCurveTo(0, r * 0.2, -r * 1.38, -r * 0.02);
      x.quadraticCurveTo(-r * 0.72, -r * 0.58, 0, -r * 1.3);
      x.closePath();
      x.fill();
      x.strokeStyle = 'rgba(160,118,60,0.42)';
      x.lineWidth = 0.9 * S;
      x.beginPath();
      for (const k of [-0.8, -0.45, -0.12, 0.2, 0.52, 0.84]) { x.moveTo(0, -r * 1.27); x.lineTo(k * r * 1.32, k * k * r * 0.02 + r * 0.05); }
      for (const f of [0.38, 0.68]) {
        x.moveTo(-r * 1.38 * f, -r * 1.3 * (1 - f) - r * 0.02);
        x.quadraticCurveTo(0, -r * 1.3 * (1 - f) + r * 0.22 * f, r * 1.38 * f, -r * 1.3 * (1 - f) - r * 0.02);
      }
      x.stroke();
      x.strokeStyle = '#FF8FA3';
      x.lineWidth = r * 0.13;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(-r * 1.02, -r * 0.2); x.quadraticCurveTo(0, -r * 0.0, r * 1.02, -r * 0.2); x.stroke();
      // bút lông ngỗng: bản lông trắng mềm, cuống vàng, nghiêng ra sau vành nón
      x.save();
      x.translate(r * 0.72, -r * 0.22);
      x.rotate(0.95 + Math.sin(t * 1.6) * 0.05);
      x.fillStyle = '#F3ECFF';
      x.strokeStyle = 'rgba(140,120,190,0.75)';
      x.lineWidth = 0.9 * S;
      x.beginPath();
      x.moveTo(0, -r * 0.08);
      x.bezierCurveTo(-r * 0.3, -r * 0.4, -r * 0.26, -r * 1.05, 0, -r * 1.32);
      x.bezierCurveTo(r * 0.16, -r * 1.0, r * 0.22, -r * 0.42, 0, -r * 0.08);
      x.fill();
      x.stroke();
      x.strokeStyle = 'rgba(190,176,214,0.7)';
      x.lineWidth = 0.7 * S;
      x.beginPath();
      for (let i = 1; i <= 5; i++) {
        const y = -r * (0.18 + i * 0.19);
        x.moveTo(0, y); x.quadraticCurveTo(-r * 0.1, y - r * 0.05, -r * 0.2 + i * r * 0.012, y - r * 0.15);
        x.moveTo(0, y); x.quadraticCurveTo(r * 0.06, y - r * 0.04, r * 0.13, y - r * 0.13);
      }
      x.stroke();
      x.strokeStyle = '#D9B26A';
      x.lineWidth = 1.1 * S;
      x.beginPath(); x.moveTo(0, r * 0.12); x.quadraticCurveTo(-r * 0.02, -r * 0.7, 0, -r * 1.28); x.stroke();
      x.restore();
      x.restore();
    } else if (acc === 'headset') {
      // Tai nghe kỹ sư: vòng đầu than chì, hai chụp tai viền đèn xanh ngọc, micro cong tới sát miệng.
      if (back) return;
      x.lineCap = 'round';
      x.strokeStyle = '#2E3440';
      x.lineWidth = r * 0.17;
      x.beginPath(); x.arc(0, -r * 0.04, r * 1.04, Math.PI * 1.07, Math.PI * 1.93); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.22)';
      x.lineWidth = r * 0.05;
      x.beginPath(); x.arc(0, -r * 0.04, r * 0.99, Math.PI * 1.2, Math.PI * 1.5); x.stroke();
      const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t * 2.2));
      for (const side of [-1, 1]) {
        x.fillStyle = '#2E3440';
        x.beginPath(); x.ellipse(side * r * 0.98, r * 0.02, r * 0.25, r * 0.34, 0, 0, TAU); x.fill();
        x.strokeStyle = '#38E8C6';
        x.globalAlpha = pulse;
        x.lineWidth = r * 0.06;
        x.beginPath(); x.ellipse(side * r * 0.98, r * 0.02, r * 0.16, r * 0.24, 0, 0, TAU); x.stroke();
        x.globalAlpha = 1;
      }
      x.strokeStyle = '#2E3440';
      x.lineWidth = r * 0.08;
      x.beginPath(); x.moveTo(-r * 0.95, r * 0.24); x.quadraticCurveTo(-r * 0.78, r * 0.7, -r * 0.3, r * 0.6); x.stroke();
      x.fillStyle = '#38E8C6';
      x.globalAlpha = 0.35 * pulse;
      x.beginPath(); x.arc(-r * 0.26, r * 0.6, r * 0.17, 0, TAU); x.fill();
      x.globalAlpha = 1;
      x.beginPath(); x.arc(-r * 0.26, r * 0.6, r * 0.09, 0, TAU); x.fill();
    } else if (acc === 'detective') {
      // Mũ thám tử kẻ ô (vạt tai buộc nơ trên đỉnh) và kính lúp trước mắt phải; mắt sau kính to ra.
      if (back) return;
      const crown = () => {
        x.beginPath();
        x.moveTo(-r * 1.07, -r * 0.46);
        x.bezierCurveTo(-r * 1.07, -r * 1.42, r * 1.07, -r * 1.42, r * 1.07, -r * 0.46);
        x.closePath();
      };
      x.fillStyle = '#B47D4A';
      crown(); x.fill();
      x.save();
      crown(); x.clip();
      x.strokeStyle = 'rgba(110,68,38,0.5)';
      x.lineWidth = 1.6 * S;
      x.beginPath();
      for (const yy of [-0.74, -1.02]) { x.moveTo(-r * 1.2, yy * r); x.lineTo(r * 1.2, yy * r); }
      for (const xx of [-0.66, 0, 0.66]) { x.moveTo(xx * r, -r * 1.5); x.lineTo(xx * r, -r * 0.4); }
      x.stroke();
      x.strokeStyle = 'rgba(226,176,122,0.7)';
      x.lineWidth = 1 * S;
      x.beginPath();
      for (const yy of [-0.63, -0.91]) { x.moveTo(-r * 1.2, yy * r); x.lineTo(r * 1.2, yy * r); }
      for (const xx of [-0.5, 0.16, 0.82]) { x.moveTo(xx * r, -r * 1.5); x.lineTo(xx * r, -r * 0.4); }
      x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.3)';
      x.lineWidth = r * 0.1;
      x.beginPath(); x.arc(0, -r * 0.46, r * 0.72, Math.PI * 1.22, Math.PI * 1.48); x.stroke();
      x.restore();
      x.strokeStyle = '#6E4426';
      x.lineWidth = 1.2 * S;
      crown(); x.stroke();
      x.fillStyle = '#A06A3A';
      for (const side of [-1, 1]) {
        x.beginPath(); x.ellipse(side * r * 1.06, -r * 0.5, r * 0.16, r * 0.3, side * 0.3, 0, TAU); x.fill(); x.stroke();
      }
      x.fillStyle = '#6E4426';
      x.fillRect(-r * 1.07, -r * 0.56, r * 2.14, r * 0.17);
      x.fillStyle = '#C98B52';
      for (const side of [-1, 1]) {
        x.beginPath(); x.ellipse(side * r * 0.2, -r * 1.33, r * 0.2, r * 0.1, side * -0.25, 0, TAU); x.fill(); x.stroke();
      }
      x.fillStyle = '#6E4426';
      x.beginPath(); x.arc(0, -r * 1.33, r * 0.08, 0, TAU); x.fill();
      // kính lúp: cán nâu, mặt kính tím nhạt, mắt phải sau kính phóng to theo đúng biểu cảm
      const lx = r * 0.36, ly = -r * 0.08, lr = r * 0.46;
      const s2 = st || {};
      x.strokeStyle = '#6E4426';
      x.lineWidth = r * 0.24;
      x.beginPath(); x.moveTo(lx + lr * 0.7, ly + lr * 0.7); x.lineTo(lx + r * 1.02, ly + r * 1.02); x.stroke();
      x.fillStyle = '#ECE2FF';
      x.beginPath(); x.arc(lx, ly, lr, 0, TAU); x.fill();
      x.fillStyle = '#2A1E3D';
      x.strokeStyle = '#2A1E3D';
      x.lineWidth = r * 0.09;
      if (s2.happy > 0) {
        x.beginPath(); x.moveTo(lx - r * 0.22, ly + r * 0.06); x.quadraticCurveTo(lx, ly - r * 0.24, lx + r * 0.22, ly + r * 0.06); x.stroke();
      } else if (s2.blink > 0) {
        x.beginPath(); x.moveTo(lx - r * 0.22, ly); x.quadraticCurveTo(lx, ly + r * 0.16, lx + r * 0.22, ly); x.stroke();
      } else {
        const er = s2.sad > 0 ? r * 0.17 : r * 0.23;
        x.beginPath(); x.arc(lx - r * 0.02, ly + r * 0.01, er, 0, TAU); x.fill();
        x.fillStyle = '#FFFFFF';
        x.beginPath(); x.arc(lx + er * 0.3, ly - er * 0.36, er * 0.38, 0, TAU); x.fill();
        x.beginPath(); x.arc(lx - er * 0.4, ly + er * 0.42, er * 0.16, 0, TAU); x.fill();
      }
      x.fillStyle = 'rgba(221,240,255,0.22)';
      x.beginPath(); x.arc(lx, ly, lr, 0, TAU); x.fill();
      x.strokeStyle = '#E2A93B';
      x.lineWidth = r * 0.15;
      x.beginPath(); x.arc(lx, ly, lr, 0, TAU); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.9)';
      x.lineWidth = r * 0.08;
      x.beginPath(); x.arc(lx, ly, lr * 0.68, Math.PI * 1.05, Math.PI * 1.4); x.stroke();
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

  // ================= Nét mặt theo tâm trạng (khi được chạm, vuốt) =================
  // mood: smile | happy | wink | blush | squish | pout | shy | dreamy | focus | grumpy | kid | heart | teary | surprised
  // look: liếc sang trái (-1) hay phải (1).
  function moodFace(x, r, p, skin, st, S, t) {
    const mood = st.mood, lk = (st.look || 0) * r * 0.13;
    const ey = -r * 0.1, my = r * 0.36, mx = lk * 0.7;
    const L = -r * 0.32 + lk, R = r * 0.32 + lk;
    const open = [];
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.strokeStyle = p.eye;
    x.lineWidth = 2 * S;
    const dot = (ex, yy, er, hl) => {
      x.fillStyle = p.eye;
      x.beginPath(); x.arc(ex, yy, er, 0, TAU); x.fill();
      x.fillStyle = p.eye === BASE.eye ? '#FFFFFF' : '#2A1E3D';
      x.beginPath(); x.arc(ex + er * 0.35, yy - er * 0.35, er * 0.36, 0, TAU); x.fill();
      if (hl > 1) { x.beginPath(); x.arc(ex - er * 0.32, yy + er * 0.32, er * 0.18, 0, TAU); x.fill(); }
      open.push([ex, yy]);
    };
    const arcUp = (ex, w) => { x.beginPath(); x.moveTo(ex - w, ey + w * 0.35); x.quadraticCurveTo(ex, ey - w * 1.15, ex + w, ey + w * 0.35); x.stroke(); };
    const arcDown = (ex, w) => { x.beginPath(); x.moveTo(ex - w, ey - w * 0.2); x.quadraticCurveTo(ex, ey + w * 0.85, ex + w, ey - w * 0.2); x.stroke(); };
    const blush = (k, lines) => {
      x.fillStyle = 'rgba(255,90,130,' + Math.min(0.75, 0.32 * k) + ')';
      for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(sd * r * 0.56, r * 0.25, r * 0.22, r * 0.14, 0, 0, TAU); x.fill(); }
      if (lines) {
        x.save();
        x.strokeStyle = 'rgba(214,60,100,0.7)';
        x.lineWidth = 1.1 * S;
        for (const sd of [-1, 1]) for (let i = -1; i <= 1; i++) {
          x.beginPath(); x.moveTo(sd * r * 0.56 + i * r * 0.08 - r * 0.03, r * 0.3); x.lineTo(sd * r * 0.56 + i * r * 0.08 + r * 0.03, r * 0.19); x.stroke();
        }
        x.restore();
      }
    };
    const smile = (w) => { x.strokeStyle = p.mouth; x.beginPath(); x.moveTo(mx - r * w, my - r * 0.03); x.quadraticCurveTo(mx, my + r * (w * 0.8), mx + r * w, my - r * 0.03); x.stroke(); };
    const openMouth = (w, h) => {
      x.fillStyle = p.mouth === BASE.mouth ? '#4A2B4F' : p.mouth;
      x.beginPath(); x.moveTo(mx - r * w, my - r * 0.05); x.quadraticCurveTo(mx, my + r * h, mx + r * w, my - r * 0.05); x.closePath(); x.fill();
      x.fillStyle = p.tongue;
      x.beginPath(); x.ellipse(mx, my + r * h * 0.42, r * w * 0.5, r * 0.05, 0, 0, TAU); x.fill();
    };
    switch (mood) {
      case 'happy':
        arcUp(L, r * 0.12); arcUp(R, r * 0.12); openMouth(0.16, 0.26); blush(1.1);
        break;
      case 'wink':
        dot(L, ey, r * 0.115, 1); arcUp(R, r * 0.12); smile(0.15);
        x.fillStyle = p.tongue; x.beginPath(); x.ellipse(mx + r * 0.07, my + r * 0.08, r * 0.055, r * 0.045, 0, 0, TAU); x.fill();
        break;
      case 'blush':
        dot(L, ey + r * 0.02, r * 0.1, 1); dot(R, ey + r * 0.02, r * 0.1, 1); blush(1.5, true); smile(0.09);
        break;
      case 'squish':
        x.beginPath();
        x.moveTo(L - r * 0.1, ey - r * 0.09); x.lineTo(L + r * 0.07, ey); x.lineTo(L - r * 0.1, ey + r * 0.09);
        x.moveTo(R + r * 0.1, ey - r * 0.09); x.lineTo(R - r * 0.07, ey); x.lineTo(R + r * 0.1, ey + r * 0.09);
        x.stroke();
        blush(1.6);
        x.strokeStyle = p.mouth;
        x.beginPath(); x.arc(mx - r * 0.06, my, r * 0.06, 0.1, Math.PI - 0.1); x.arc(mx + r * 0.06, my, r * 0.06, 0.1, Math.PI - 0.1); x.stroke();
        break;
      case 'pout': {
        // dỗi: mí mắt sụp, liếc đi chỗ khác, má phồng một bên, môi chu ra
        const sd = (st.look || 0) < 0 ? 1 : -1;
        x.fillStyle = p.head;
        x.beginPath(); x.arc(sd * r * 0.84, r * 0.26, r * 0.24, 0, TAU); x.fill();
        x.fillStyle = 'rgba(255,90,130,0.5)';
        x.beginPath(); x.ellipse(sd * r * 0.7, r * 0.27, r * 0.2, r * 0.13, 0, 0, TAU); x.fill();
        for (const e of [L, R]) {
          dot(e + lk * 0.4, ey + r * 0.03, r * 0.1, 1);
          x.fillStyle = p.head;
          x.fillRect(e - r * 0.16, ey - r * 0.2, r * 0.32, r * 0.17);
          x.beginPath(); x.moveTo(e - r * 0.14, ey - r * 0.03 + (e < 0 ? -1 : 1) * r * 0.025); x.lineTo(e + r * 0.14, ey - r * 0.03 - (e < 0 ? -1 : 1) * r * 0.025); x.stroke();
        }
        x.strokeStyle = p.mouth;
        x.lineWidth = 1.8 * S;
        x.beginPath(); x.arc(mx + sd * r * 0.06, my + r * 0.02, r * 0.055, 0, TAU); x.stroke();
        x.lineWidth = 2 * S;
        break;
      }
      case 'shy':
        dot(L, ey + r * 0.07, r * 0.09, 1); dot(R, ey + r * 0.07, r * 0.09, 1); blush(1.9, true);
        x.strokeStyle = p.mouth;
        x.beginPath(); x.moveTo(mx - r * 0.08, my + r * 0.01); x.quadraticCurveTo(mx - r * 0.04, my - r * 0.04, mx, my + r * 0.01); x.quadraticCurveTo(mx + r * 0.04, my + r * 0.06, mx + r * 0.08, my + r * 0.01); x.stroke();
        x.fillStyle = 'rgba(150,200,255,0.9)';
        x.beginPath(); x.moveTo(r * 0.74, -r * 0.62); x.quadraticCurveTo(r * 0.86, -r * 0.4, r * 0.74, -r * 0.34); x.quadraticCurveTo(r * 0.62, -r * 0.4, r * 0.74, -r * 0.62); x.fill();
        break;
      case 'dreamy':
        arcDown(L, r * 0.11); arcDown(R, r * 0.11); blush(1.1); smile(0.1);
        break;
      case 'focus':
        x.fillStyle = p.eye;
        for (const e of [L, R]) { x.beginPath(); x.ellipse(e, ey + r * 0.03, r * 0.11, r * 0.055, 0, 0, TAU); x.fill(); }
        x.beginPath();
        x.moveTo(L - r * 0.15, ey - r * 0.2); x.lineTo(L + r * 0.12, ey - r * 0.15);
        x.moveTo(R + r * 0.15, ey - r * 0.2); x.lineTo(R - r * 0.12, ey - r * 0.15);
        x.stroke();
        x.strokeStyle = p.mouth;
        x.beginPath(); x.moveTo(mx - r * 0.1, my + r * 0.01); x.lineTo(mx + r * 0.1, my); x.stroke();
        break;
      case 'grumpy':
        dot(L, ey + r * 0.04, r * 0.085, 1); dot(R, ey + r * 0.04, r * 0.085, 1);
        x.lineWidth = 2.6 * S;
        x.beginPath();
        x.moveTo(L - r * 0.15, ey - r * 0.28); x.lineTo(L + r * 0.13, ey - r * 0.13);
        x.moveTo(R + r * 0.15, ey - r * 0.28); x.lineTo(R - r * 0.13, ey - r * 0.13);
        x.stroke();
        x.lineWidth = 2 * S;
        x.strokeStyle = p.mouth;
        x.beginPath(); x.moveTo(mx - r * 0.14, my + r * 0.06); x.lineTo(mx - r * 0.05, my - r * 0.01); x.lineTo(mx + r * 0.03, my + r * 0.06); x.lineTo(mx + r * 0.13, my - r * 0.01); x.stroke();
        break;
      case 'kid':
        dot(L, ey, r * 0.155, 2); dot(R, ey, r * 0.155, 2); blush(1.3); openMouth(0.19, 0.32);
        break;
      case 'heart':
        x.fillStyle = '#FF4F7B';
        for (const e of [L, R]) { heartPath(x, e, ey + r * 0.02, r * 0.17 * (1 + 0.12 * Math.sin(t * 14))); x.fill(); }
        blush(1.2); openMouth(0.15, 0.24);
        break;
      case 'teary': {
        dot(L, ey, r * 0.15, 2); dot(R, ey, r * 0.15, 2);
        x.strokeStyle = 'rgba(150,200,255,0.95)';
        x.lineWidth = 1.6 * S;
        for (const e of [L, R]) { x.beginPath(); x.arc(e, ey, r * 0.17, 0.35, Math.PI - 0.35); x.stroke(); }
        const q = (t * 1.3) % 1;
        x.fillStyle = 'rgba(150,200,255,' + (1 - q * 0.6) + ')';
        const tx = R + r * 0.1, ty = ey + r * 0.18 + q * r * 0.5;
        x.beginPath(); x.moveTo(tx, ty - r * 0.08); x.quadraticCurveTo(tx + r * 0.06, ty, tx, ty + r * 0.04); x.quadraticCurveTo(tx - r * 0.06, ty, tx, ty - r * 0.08); x.fill();
        blush(1.1);
        x.strokeStyle = p.mouth;
        x.lineWidth = 2 * S;
        x.beginPath(); x.moveTo(mx - r * 0.13, my + r * 0.07); x.quadraticCurveTo(mx - r * 0.06, my - r * 0.04, mx, my + r * 0.03); x.quadraticCurveTo(mx + r * 0.06, my - r * 0.04, mx + r * 0.13, my + r * 0.07); x.stroke();
        break;
      }
      case 'surprised':
        dot(L, ey, r * 0.12, 1); dot(R, ey, r * 0.12, 1);
        x.fillStyle = p.mouth === BASE.mouth ? '#4A2B4F' : p.mouth;
        x.beginPath(); x.ellipse(mx, my + r * 0.04, r * 0.07, r * 0.09, 0, 0, TAU); x.fill();
        break;
      default:
        dot(L, ey, r * 0.115, 1); dot(R, ey, r * 0.115, 1); smile(0.15);
    }
    // lông mi cho mắt đang mở (Nàng Thơ); lúc ngại nhìn xuống thì thôi kẻo trông như cau mày
    if (skin.eyes === 'lash' && mood !== 'shy') {
      x.strokeStyle = p.eye;
      x.lineWidth = 1.5 * S;
      for (const [ex, yy] of open) {
        const sd = ex < lk ? -1 : 1;
        for (let i = 0; i < 2; i++) {
          const a = -Math.PI / 2 + sd * (0.75 + i * 0.4);
          x.beginPath(); x.moveTo(ex + Math.cos(a) * r * 0.12, yy + Math.sin(a) * r * 0.12); x.lineTo(ex + Math.cos(a) * r * 0.22, yy + Math.sin(a) * r * 0.22); x.stroke();
        }
      }
      x.lineWidth = 2 * S;
    }
  }
  // Hiệu ứng nhỏ theo tâm trạng, vẽ sau phụ kiện: nốt nhạc ngân nga, khói bốc khi cáu, lấp lánh khi vui.
  function moodExtras(x, r, st, S, t) {
    const mood = st.mood;
    if (mood === 'dreamy') {
      x.font = '700 ' + Math.round(r * 0.55) + 'px system-ui, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      for (let k = 0; k < 2; k++) {
        const q = (t * 0.45 + k * 0.5) % 1;
        x.globalAlpha = Math.sin(q * Math.PI);
        x.fillStyle = k ? '#C27AE0' : '#FF8FA3';
        x.fillText(k ? '♫' : '♪', -r * (1.05 + Math.sin(t * 2 + k) * 0.15), -r * (0.5 + q * 1.3));
      }
      x.globalAlpha = 1;
    } else if (mood === 'grumpy') {
      for (let k = 0; k < 3; k++) {
        const q = (t * 1.4 + k / 3) % 1;
        x.globalAlpha = (1 - q) * 0.75;
        x.fillStyle = '#E8ECF2';
        x.beginPath(); x.arc(r * (0.7 + q * 0.35 + Math.sin(q * 6 + k) * 0.08), -r * (1.0 + q * 1.1), r * (0.12 + q * 0.2), 0, TAU); x.fill();
      }
      x.globalAlpha = 1;
      // dấu giận đỏ trên trán
      x.strokeStyle = '#FF4F5E';
      x.lineWidth = 2 * S;
      const ax = -r * 0.62, ay = -r * 0.62, a = r * 0.13;
      x.beginPath();
      x.moveTo(ax - a, ay - a * 0.3); x.quadraticCurveTo(ax - a * 0.3, ay - a * 0.3, ax - a * 0.3, ay - a);
      x.moveTo(ax + a, ay - a * 0.3); x.quadraticCurveTo(ax + a * 0.3, ay - a * 0.3, ax + a * 0.3, ay - a);
      x.moveTo(ax - a, ay + a * 0.3); x.quadraticCurveTo(ax - a * 0.3, ay + a * 0.3, ax - a * 0.3, ay + a);
      x.moveTo(ax + a, ay + a * 0.3); x.quadraticCurveTo(ax + a * 0.3, ay + a * 0.3, ax + a * 0.3, ay + a);
      x.stroke();
    } else if (mood === 'kid' || mood === 'heart' || mood === 'happy') {
      x.fillStyle = '#FFE27A';
      for (const sd of [-1, 1]) {
        x.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 6 + sd));
        starPath(x, sd * r * 1.1, -r * 0.55, r * 0.14, r * 0.05);
        x.fill();
      }
      x.globalAlpha = 1;
    }
  }

  // ================= Đầu =================
  // st: { ant, bob, happy, blink, sad, chew, mouthOpen, t, mood, look }
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
    // Ăng-ten của Sâu Vi Mạch: đèn đầu râu nháy xanh / đỏ so le, cứ vài giây phát hai vòng sóng.
    const signal = skin.idle === 'signal';
    for (const side of skin.antHide ? [] : [-1, 1]) {
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
      if (signal) {
        if (st.mood === 'grumpy' || Math.floor(t * 2.5 + (side > 0 ? 1 : 0)) % 2) x.fillStyle = '#FF4F7B';
        const ph = (t % 2.4) / 2.4;
        if (ph < 0.62 && st.mood !== 'grumpy') {
          x.save();
          x.strokeStyle = '#38E8C6';
          x.lineWidth = 1.4 * S;
          for (let k = 0; k < 2; k++) {
            const q = ph / 0.62 - k * 0.32;
            if (q <= 0 || q >= 1) continue;
            x.globalAlpha = 1 - q;
            const rr = (4 + q * 11) * S;
            x.beginPath(); x.arc(tx, ty, rr, side > 0 ? -1.15 : Math.PI + 0.15, side > 0 ? -0.15 : Math.PI + 1.15); x.stroke();
          }
          x.restore();
          x.strokeStyle = p.ant;
          x.lineWidth = 2.2 * S;
        }
      }
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
    // Nàng Thơ thỉnh thoảng nhắm mắt mơ màng (như đang ngâm thơ); Vi Mạch thỉnh thoảng "bắt được sóng" mắt hoá tim.
    const dream = !st.mood && skin.idle === 'poet' && t % 7 > 5.7 && !(st.sad > 0);
    const heartEye = !st.mood && skin.idle === 'signal' && t % 8.5 > 7.3 && !(st.happy > 0) && !(st.sad > 0) && !(st.blink > 0);
    if (st.mood) moodFace(x, r, p, skin, st, S, t);
    else {
    for (const side of [-1, 1]) {
      const ex = side * r * 0.32, ey = -r * 0.1;
      if (heartEye) {
        x.fillStyle = '#FF4F7B';
        heartPath(x, ex, ey + r * 0.02, r * 0.14 * (1 + 0.12 * Math.sin(t * 14)));
        x.fill();
        x.fillStyle = p.eye;
      } else if (st.happy > 0 || dream) {
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
    }
    drawAccessory(x, skin.acc, r, S, t, false, st);
    if (st.mood) moodExtras(x, r, st, S, t);
    if (dream) {
      // một trái tim nhỏ bay lên bên vành nón lúc mơ màng
      const k = (t % 7 - 5.7) / 1.3;
      x.globalAlpha = Math.sin(Math.min(1, k) * Math.PI);
      x.fillStyle = '#FF8FA3';
      heartPath(x, r * 1.05, -r * 1.25 - k * r * 0.9, r * 0.17);
      x.fill();
      x.globalAlpha = 1;
    }
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
    } else if (kind === 'tweed') {
      // vải dạ kẻ ô của áo thám tử: sọc nâu đậm, chỉ vàng mảnh, một sợi hồng, mép khâu chỉ
      const step = R * (top ? 0.42 : 0.5);
      x.fillStyle = 'rgba(90,54,30,0.3)';
      for (let k = -6; k <= 6; k++) {
        x.fillRect(k * step - step * 0.18, -H * 1.3, step * 0.36, H * 2.6);
        x.fillRect(-R * 1.3, k * step - step * 0.18, R * 2.6, step * 0.36);
      }
      x.strokeStyle = 'rgba(255,226,170,0.45)';
      x.lineWidth = 0.7 * S;
      x.beginPath();
      for (let k = -6; k <= 6; k++) {
        x.moveTo(k * step + step * 0.5, -H * 1.3); x.lineTo(k * step + step * 0.5, H * 1.3);
        x.moveTo(-R * 1.3, k * step + step * 0.5); x.lineTo(R * 1.3, k * step + step * 0.5);
      }
      x.stroke();
      x.strokeStyle = 'rgba(255,143,163,0.6)';
      x.lineWidth = 0.9 * S;
      x.beginPath(); x.moveTo(-step * 1.5, -H * 1.3); x.lineTo(-step * 1.5, H * 1.3); x.moveTo(-R * 1.3, step * 1.5); x.lineTo(R * 1.3, step * 1.5); x.stroke();
      x.setLineDash([1.6 * S, 1.4 * S]);
      x.strokeStyle = 'rgba(255,236,200,0.8)';
      x.lineWidth = 0.8 * S;
      x.beginPath(); x.ellipse(0, 0, R * 0.84, H * 0.8, 0, 0, TAU); x.stroke();
      x.setLineDash([]);
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
  // Thân bướm chung cho các kiểu cánh riêng: thân, đầu, râu, mắt.
  function butterflyBody(x, body, tip, S) {
    x.fillStyle = body;
    x.beginPath(); x.ellipse(0, 2 * S, 5 * S, 19 * S, 0, 0, TAU); x.fill();
    x.beginPath(); x.arc(0, -20 * S, 7 * S, 0, TAU); x.fill();
    x.strokeStyle = body;
    x.lineWidth = 2 * S;
    x.lineCap = 'round';
    for (const side of [-1, 1]) {
      x.beginPath(); x.moveTo(side * 2 * S, -26 * S); x.quadraticCurveTo(side * 6 * S, -38 * S, side * 12 * S, -40 * S); x.stroke();
      x.fillStyle = tip;
      x.beginPath(); x.arc(side * 12 * S, -40 * S, 3 * S, 0, TAU); x.fill();
    }
    x.fillStyle = '#FFFFFF';
    x.beginPath(); x.arc(-2.6 * S, -21 * S, 1.6 * S, 0, TAU); x.arc(2.6 * S, -21 * S, 1.6 * S, 0, TAU); x.fill();
  }
  // Một trang sách: giấy ngà, viền mạ vàng, dòng kẻ và vài dòng chữ nghiêng; L dài, H cao (đã nhân S).
  function bookPage(x, L, H, w, S, lines) {
    const g = x.createLinearGradient(0, 0, L, 0);
    g.addColorStop(0, w.paper2); g.addColorStop(0.35, w.paper); g.addColorStop(1, w.paper);
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, -H * 0.5);
    x.quadraticCurveTo(L * 0.5, -H * 0.62, L, -H * 0.5);
    x.lineTo(L, H * 0.5);
    x.quadraticCurveTo(L * 0.5, H * 0.38, 0, H * 0.5);
    x.closePath();
    x.fill();
    x.strokeStyle = w.edge;
    x.lineWidth = 1.4 * S;
    x.stroke();
    x.strokeStyle = w.ink;
    x.globalAlpha = 0.55;
    x.lineWidth = 0.9 * S;
    x.beginPath();
    for (let i = 0; i < lines; i++) {
      const y = -H * 0.32 + (i * H * 0.64) / Math.max(1, lines - 1);
      const end = L * (i === lines - 1 ? 0.55 : 0.84);
      x.moveTo(L * 0.14, y);
      for (let k = L * 0.14; k < end; k += 3.2 * S) x.lineTo(k + 1.6 * S, y + (k % (6.4 * S) < 3.2 * S ? -0.7 : 0.7) * S);
    }
    x.stroke();
    x.globalAlpha = 1;
  }
  // Cánh trang sách: mỗi bên một trang lớn, một trang nhỏ, vỗ chậm như lật sách; dải lụa đỏ đung đưa.
  function drawBookWing(x, w, S, t) {
    const flap = 0.4 + 0.6 * Math.abs(Math.sin(t * 5));
    if (w.glow) {
      x.fillStyle = '#FFF1C9';
      x.globalAlpha = 0.2 + 0.12 * Math.abs(Math.sin(t * 2));
      x.beginPath(); x.arc(0, -4 * S, 44 * S, 0, TAU); x.fill();
      x.globalAlpha = 1;
    }
    for (const side of [-1, 1]) {
      x.save();
      x.scale(side * flap, 1);
      x.save(); x.translate(3 * S, -4 * S); x.rotate(-0.62); bookPage(x, 40 * S, 27 * S, w, S, 5); x.restore();
      x.save(); x.translate(3 * S, 7 * S); x.rotate(0.5); bookPage(x, 26 * S, 18 * S, w, S, 3); x.restore();
      x.restore();
    }
    // dải lụa đánh dấu trang
    const sw = Math.sin(t * 2.4) * 3 * S;
    x.strokeStyle = w.ribbon;
    x.lineWidth = 3 * S;
    x.lineCap = 'butt';
    x.beginPath(); x.moveTo(3 * S, -8 * S); x.quadraticCurveTo(8 * S + sw, 10 * S, 6 * S + sw * 1.4, 26 * S); x.stroke();
    x.fillStyle = w.ribbon;
    x.beginPath();
    x.moveTo(4.4 * S + sw * 1.4, 25 * S); x.lineTo(7.6 * S + sw * 1.4, 25 * S); x.lineTo(7.8 * S + sw * 1.4, 31 * S); x.lineTo(6 * S + sw * 1.4, 29 * S); x.lineTo(4.2 * S + sw * 1.4, 31 * S);
    x.closePath(); x.fill();
    butterflyBody(x, w.body, w.edge, S);
  }
  // Đường mạch trên cánh (đơn vị S, theo khung của cánh trên / dưới).
  const TRACE_TOP = [
    [[3, -6], [14, -6], [22, -14], [36, -14]],
    [[5, -15], [11, -21], [25, -21], [31, -28]],
    [[9, -1], [21, -1], [28, -7], [40, -7]],
  ];
  const TRACE_BOT = [[[4, 6], [12, 10], [24, 10]], [[6, 15], [13, 20], [24, 20]]];
  function along(pts, f) {
    let total = 0;
    const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    let rem = f * total;
    for (let i = 0; i < seg.length; i++) {
      if (rem <= seg[i]) { const k = rem / seg[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; }
      rem -= seg[i];
    }
    return pts[pts.length - 1];
  }
  // Cánh vi mạch: bảng mạch xanh, đường đồng vàng, xung điện xanh ngọc chạy dọc theo đường mạch.
  function drawCircuitWing(x, w, S, t) {
    const flap = 0.3 + 0.7 * Math.abs(Math.sin(t * 7));
    if (w.glow) {
      x.fillStyle = w.pulse;
      x.globalAlpha = 0.12 + 0.1 * Math.abs(Math.sin(t * 2));
      x.beginPath(); x.arc(0, -4 * S, 44 * S, 0, TAU); x.fill();
      x.globalAlpha = 1;
    }
    const part = (cx, cy, rx, ry, rot, fill, traces, off) => {
      x.save();
      x.fillStyle = fill;
      x.beginPath(); x.ellipse(cx * S, cy * S, rx * S, ry * S, rot, 0, TAU); x.fill();
      x.clip();
      x.strokeStyle = w.trace;
      x.lineWidth = 1.3 * S;
      x.lineJoin = 'round';
      x.lineCap = 'round';
      x.beginPath();
      for (const pts of traces) pts.forEach(([px, py], i) => (i ? x.lineTo(px * S, py * S) : x.moveTo(px * S, py * S)));
      x.stroke();
      x.fillStyle = w.trace;
      for (const pts of traces) { const [px, py] = pts[pts.length - 1]; x.beginPath(); x.arc(px * S, py * S, 1.6 * S, 0, TAU); x.fill(); }
      traces.forEach((pts, i) => {
        const [px, py] = along(pts, (t * 0.7 + off + i * 0.37) % 1);
        x.fillStyle = w.pulse;
        x.globalAlpha = 0.35;
        x.beginPath(); x.arc(px * S, py * S, 3.4 * S, 0, TAU); x.fill();
        x.globalAlpha = 1;
        x.beginPath(); x.arc(px * S, py * S, 1.5 * S, 0, TAU); x.fill();
      });
      x.restore();
      x.strokeStyle = 'rgba(232,184,74,0.7)';
      x.lineWidth = 1 * S;
      x.beginPath(); x.ellipse(cx * S, cy * S, rx * S, ry * S, rot, 0, TAU); x.stroke();
    };
    for (const side of [-1, 1]) {
      x.save();
      x.scale(side * flap, 1);
      part(20, -14, 22, 17, -0.5, w.top, TRACE_TOP, side > 0 ? 0 : 0.5);
      part(15, 13, 14, 11, 0.5, w.bottom, TRACE_BOT, side > 0 ? 0.25 : 0.75);
      x.fillStyle = w.spot;
      x.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 3 + side));
      x.beginPath(); x.arc(16 * S, 14 * S, 2.6 * S, 0, TAU); x.fill();
      x.globalAlpha = 1;
      x.restore();
    }
    butterflyBody(x, w.body, w.pulse, S);
  }
  // Mũ thám tử tí hon (kẻ ô, vành nâu, nơ trên đỉnh) đội trên đầu bướm; râu chui ra từ mũ.
  function butterflyHat(x, S) {
    const r = 8 * S;
    x.save();
    x.translate(0, -21 * S);
    const crown = () => {
      x.beginPath();
      x.moveTo(-r * 1.1, -r * 0.3);
      x.bezierCurveTo(-r * 1.1, -r * 1.55, r * 1.1, -r * 1.55, r * 1.1, -r * 0.3);
      x.closePath();
    };
    x.fillStyle = '#B47D4A';
    crown(); x.fill();
    x.save();
    crown(); x.clip();
    x.strokeStyle = 'rgba(110,68,38,0.55)';
    x.lineWidth = 0.9 * S;
    x.beginPath();
    for (const yy of [-0.66, -1.0]) { x.moveTo(-r * 1.2, yy * r); x.lineTo(r * 1.2, yy * r); }
    for (const xx of [-0.55, 0, 0.55]) { x.moveTo(xx * r, -r * 1.6); x.lineTo(xx * r, -r * 0.3); }
    x.stroke();
    x.restore();
    x.strokeStyle = '#6E4426';
    x.lineWidth = 0.8 * S;
    crown(); x.stroke();
    x.fillStyle = '#A06A3A';
    for (const side of [-1, 1]) {
      x.beginPath(); x.ellipse(side * r * 1.08, -r * 0.3, r * 0.18, r * 0.34, side * 0.3, 0, TAU); x.fill(); x.stroke();
    }
    x.fillStyle = '#6E4426';
    x.fillRect(-r * 1.16, -r * 0.44, r * 2.32, r * 0.22);
    x.fillStyle = '#8A5A33';
    for (const side of [-1, 1]) {
      x.beginPath(); x.ellipse(side * r * 0.24, -r * 1.24, r * 0.26, r * 0.15, side * 0.4, 0, TAU); x.fill();
    }
    x.restore();
  }
  function drawButterfly(x, wingItem, S, t) {
    const w = wingItem.wing;
    if (w.shape === 'bat') { drawBat(x, w, S, t); return; }
    if (w.shape === 'book') { drawBookWing(x, w, S, t); return; }
    if (w.shape === 'circuit') { drawCircuitWing(x, w, S, t); return; }
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
    if (w.hat === 'detective') butterflyHat(x, S);
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
  // kind: 0 vụn lá, 1 tim, 4 cánh hoa, 5 mây, 6 sao, 7 nốt nhạc, 8 pháo giấy, 9 hoa văn trám, 10 hạt lúa,
  // 11 dơi, 12 kẹo, 13 trang giấy, 14 chữ, 15 tia điện, 16 số 0 / 1, 17 kính lúp, 18 dấu chân, 19 dấu hỏi
  // (3 là vòng sáng loang ra).
  const VAN_GLYPHS = ['ơ', 'thơ', 'ư', 'ê', 'yêu', 'ô', 'ă', '♡', 'đ', 'em'];
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
      else if (fx.kind === 'page') {
        if (i % 3 === 0) out.push({ kind: 13, vx: Math.cos(a) * sp * 0.6, vy: Math.sin(a) * sp * 0.6, life: 0.8 + Math.random() * 0.4, size: (3.4 + Math.random() * 1.6) * S, color: '#FFFBF2' });
        else out.push({ kind: 14, vx: (Math.random() - 0.5) * 90 * S, vy: -(55 + Math.random() * 85) * S, life: 0.75 + Math.random() * 0.35, size: (10 + Math.random() * 5) * S, color: c });
      } else if (fx.kind === 'signal') {
        if (i === 0) out.push({ kind: 3, vx: 0, vy: 0, life: 0.5, size: 5 * S, color: '#38E8C6' });
        else if (i % 2) out.push({ kind: 15, vx: Math.cos(a) * sp * 0.95, vy: Math.sin(a) * sp * 0.95, life: 0.32 + Math.random() * 0.22, size: (4.5 + Math.random() * 3) * S, color: i % 4 === 1 ? '#FFE27A' : '#5FFFE0' });
        else out.push({ kind: 16, vx: (Math.random() - 0.5) * 70 * S, vy: -(70 + Math.random() * 80) * S, life: 0.6 + Math.random() * 0.3, size: (9 + Math.random() * 4) * S, color: c });
      }
      else if (fx.kind === 'clue') {
        // manh mối: dấu hỏi bay lên, dấu chân in xuống rồi mờ, thỉnh thoảng một chiếc kính lúp xoay xoay
        if (i % 4 === 0) out.push({ kind: 17, vx: Math.cos(a) * sp * 0.55, vy: Math.sin(a) * sp * 0.55, life: 0.8 + Math.random() * 0.3, size: (4.4 + Math.random() * 1.4) * S, color: '#E2B04A' });
        else if (i % 2) out.push({ kind: 19, vx: (Math.random() - 0.5) * 80 * S, vy: -(60 + Math.random() * 80) * S, life: 0.75 + Math.random() * 0.35, size: (11 + Math.random() * 5) * S, color: c });
        else out.push({ kind: 18, vx: Math.cos(a) * sp * 0.7, vy: Math.sin(a) * sp * 0.7, life: 0.7 + Math.random() * 0.3, size: (2.6 + Math.random() * 1.2) * S, color: '#8A5A33' });
      }
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
    else if (p.kind === 13) { p.vy += 220 * S * dt; p.vx = p.vx * (1 - 1.6 * dt) + Math.sin(p.life * 7) * 40 * S * dt; p.rot += p.vr * dt * 0.7; }
    else if (p.kind === 14) { p.vx = p.vx * (1 - 1.2 * dt) + Math.sin(p.life * 5) * 18 * S * dt; p.vy *= 1 - 0.8 * dt; }
    else if (p.kind === 15) { p.vx *= 1 - 3 * dt; p.vy *= 1 - 3 * dt; }
    else if (p.kind === 16) { p.vx = Math.sin(p.life * 6) * 20 * S; }
    else if (p.kind === 17) { p.vx *= 1 - 2.2 * dt; p.vy = p.vy * (1 - 2.2 * dt) + 90 * S * dt; p.rot += p.vr * dt * 0.8; }
    else if (p.kind === 18) { p.vx *= 1 - 5 * dt; p.vy *= 1 - 5 * dt; }
    else if (p.kind === 19) { p.vx = Math.sin(p.life * 5) * 26 * S; }
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
    } else if (p.kind === 13) {
      // trang giấy nhỏ có hai dòng chữ, lật lật khi rơi
      const s = p.size;
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(p.life * 9)));
      x.fillRect(-s * 1.1, -s * 0.8, s * 2.2, s * 1.6);
      x.fillStyle = 'rgba(90,74,110,0.6)';
      x.fillRect(-s * 0.8, -s * 0.35, s * 1.5, s * 0.16);
      x.fillRect(-s * 0.8, s * 0.12, s * 1.0, s * 0.16);
      x.restore();
    } else if (p.kind === 14 || p.kind === 16) {
      const G = p.kind === 14 ? VAN_GLYPHS : ['0', '1'];
      const gi = p.g !== undefined ? p.g : Math.floor(p.max * 997);
      x.font = p.kind === 14 ? 'italic 600 ' + Math.round(p.size) + 'px Fraunces, Georgia, serif' : '700 ' + Math.round(p.size) + 'px ui-monospace, Menlo, Consolas, monospace';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(G[gi % G.length], p.x, p.y);
    } else if (p.kind === 15) {
      // tia điện gấp khúc
      const s = p.size;
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
      x.strokeStyle = p.color;
      x.lineWidth = Math.max(1, s * 0.32);
      x.lineJoin = 'round';
      x.beginPath(); x.moveTo(-s, -s * 0.5); x.lineTo(-s * 0.1, -s * 0.15); x.lineTo(-s * 0.35, s * 0.25); x.lineTo(s, s * 0.6); x.stroke();
      x.restore();
    } else if (p.kind === 17) {
      // kính lúp nhỏ: mặt kính xanh nhạt, vành vàng, cán gỗ, có vệt sáng
      const s = p.size;
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
      x.strokeStyle = '#5A3A22';
      x.lineWidth = s * 0.42;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(s * 0.62, s * 0.62); x.lineTo(s * 1.45, s * 1.45); x.stroke();
      x.fillStyle = 'rgba(200,232,255,0.7)';
      x.beginPath(); x.arc(0, 0, s * 0.82, 0, TAU); x.fill();
      x.strokeStyle = p.color;
      x.lineWidth = s * 0.26;
      x.beginPath(); x.arc(0, 0, s * 0.82, 0, TAU); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.9)';
      x.lineWidth = s * 0.16;
      x.beginPath(); x.arc(0, 0, s * 0.5, Math.PI * 1.1, Math.PI * 1.45); x.stroke();
      x.restore();
    } else if (p.kind === 18) {
      // một cặp dấu chân bé xíu (in xuống rồi mờ dần)
      const s = p.size;
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
      for (const [ox, oy] of [[-s * 0.75, s * 0.5], [s * 0.75, -s * 0.5]]) {
        x.beginPath(); x.ellipse(ox, oy, s * 0.42, s * 0.7, 0, 0, TAU); x.fill();
        x.beginPath(); x.arc(ox, oy - s * 1.05, s * 0.26, 0, TAU); x.fill();
      }
      x.restore();
    } else if (p.kind === 19) {
      x.save(); x.translate(p.x, p.y); x.rotate(Math.sin((p.max - p.life) * 7 + (p.g || 0)) * 0.22);
      x.font = 'italic 700 ' + Math.round(p.size) + 'px Fraunces, Georgia, serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      const gi = p.g !== undefined ? p.g : Math.floor(p.max * 997);
      x.fillText(gi % 5 === 4 ? '!' : '?', 0, 0);
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

  // ================= Chạm & vuốt: skin có tính cách (độc quyền) =================
  // Mỗi phản ứng: mood (nét mặt), say (câu nói, có thể chỉ hiện trên máy của một người), dur (giây),
  // bounce (nhún), squish (bẹp má khi được vuốt), look (liếc), lean (nghiêng), hearts/notes, then (phản ứng kế tiếp).
  // Nàng Thơ (Lệ Thủy): nhẹ nhàng, đôi lúc cá tính, thích tự do, hay nũng nịu.
  // Vi Mạch (anh Quang): thương em, hơi cáu khi đang làm việc, nhưng trước mặt em thì như trẻ con.
  // Tạm tắt cho đến khi lời thoại được sửa xong; bật lại bằng PET_ON = true.
  const PET_ON = false;
  const PERSONA = {
    tho: {
      bubble: { bg: '#FFF8F0', ink: '#7A3B52', line: '#FFB7C9' },
      idle: [
        { mood: 'dreamy', dur: 3.2, look: -0.2, say: ['La la la~', 'Gió mát ghê…', null, null] },
        { mood: 'smile', dur: 2.6, look: 0.8, say: ['Muốn đi chơi quá…', 'Hôm nay đi đâu ta?', 'Mây trôi đẹp ghê…', null] },
        { mood: 'wink', dur: 1.4, say: [null, 'Hihi'] },
      ],
      tap: [
        { mood: 'smile', dur: 1.6, bounce: 0.6, say: ['Hihi', 'Em đây nè', 'Đang làm thơ nè', { t: 'Gì đó anh~', who: 'quang' }] },
        { mood: 'wink', dur: 1.5, bounce: 0.5, say: ['Hì~', 'Nhẹ thôi nha', { t: 'Anh nhớ em hả?', who: 'quang' }] },
        { mood: 'blush', dur: 1.7, say: ['Ơ…', 'Ngượng ghê', { t: 'Nhìn gì đó anh', who: 'quang' }] },
      ],
      pet: { mood: 'squish', dur: 1.4, squish: 1, hearts: 2, say: ['Ưm~ thêm nữa', 'Nũng xíu nha', 'Dễ chịu ghê~', { t: 'Thương em hông?', who: 'quang' }] },
      spam: {
        mood: 'pout', dur: 2.2, look: -0.9, lean: -0.16,
        say: ['Hứ!', 'Dỗi rồi đó!', 'Đừng chọc nữa mà', { t: 'Anh chọc em hoài!', who: 'quang' }],
        then: { after: 2.1, mood: 'wink', dur: 1.6, look: 0.2, bounce: 0.6, say: ['Đùa thôi~', 'Hì, hết dỗi rồi'] },
      },
      hold: { mood: 'shy', dur: 2.2, say: ['Ngại quá à…', 'Ơ… nhìn gì vậy', 'Hihi ngại ghê'], then: { after: 2.2, mood: 'happy', dur: 1.4, bounce: 0.7, hearts: 3, say: ['Hì hì'] } },
    },
    mach: {
      bubble: { bg: '#0B2A2A', ink: '#9FF5E4', line: '#2FD4B4' },
      work: 'focus', // để yên một lúc là quay lại làm việc, mặt nghiêm
      idle: [
        { mood: 'grumpy', dur: 2.4, say: ['Bug ở đâu ra vậy!', 'Cáu ghê á…', 'Sao chạy không được!'] },
        { mood: 'focus', dur: 3, say: ['Đang code…', 'Sắp xong rồi…', 'Chút nữa thôi…', null] },
      ],
      idleWithHer: [
        { mood: 'kid', dur: 1.6, bounce: 0.6, say: [null, 'Hì hì', { t: 'Chơi với anh đi', who: 'thuy' }] },
        { mood: 'heart', dur: 1.6, hearts: 2, say: [null, { t: 'Nhớ em ghê', who: 'thuy' }] },
      ],
      // đang làm việc mà bị chạm: cáu một giây rồi nhận ra là em, tan chảy thành trẻ con
      tapWork: {
        mood: 'grumpy', dur: 0.8, say: ['Ai đấy!', 'Đang bận mà…'],
        then: { after: 0.8, mood: 'kid', dur: 1.9, bounce: 1, hearts: 3, say: [{ t: 'A, em à! 🥺', who: 'thuy' }, { t: 'Hì, nghỉ tay chút', who: 'quang' }] },
      },
      tap: [
        { mood: 'kid', dur: 1.4, bounce: 0.8, say: ['Hì hì', 'Anh ngoan mà', { t: 'Em chơi với anh đi', who: 'thuy' }] },
        { mood: 'heart', dur: 1.4, bounce: 0.5, hearts: 2, say: ['Hehe', { t: 'Thương em', who: 'thuy' }] },
        { mood: 'surprised', dur: 1, bounce: 0.4, say: ['Ơ!', 'Gì vậy gì vậy'] },
      ],
      pet: { mood: 'heart', dur: 1.4, squish: 1, hearts: 2, say: ['Nữa đi mà~', 'Hì hì sướng ghê', { t: 'Thương em nhất', who: 'thuy' }] },
      spam: {
        mood: 'teary', dur: 2, say: ['Đừng chọc anh mà~', 'Anh mách mẹ đó!', 'Huhu…'],
        then: { after: 2, mood: 'kid', dur: 1.4, bounce: 0.8, say: ['Hì, đùa đó!', 'Hết khóc rồi'] },
      },
      hold: { mood: 'heart', dur: 2.4, bounce: 1.2, hearts: 4, say: [{ t: 'Thương em nhất trên đời', who: 'thuy' }, 'Hì hì hì', { t: 'Ôm cái nữa', who: 'thuy' }] },
    },
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // Bộ điều khiển một bé sâu có tính cách. Trang gọi pointer(...) với toạ độ so với tâm đầu,
  // update(dt) mỗi khung hình, face() để lấy nét mặt, apply(x, r) trước khi vẽ đầu, drawFx(x, r, S) sau đó.
  function makePet(item, who) {
    const P = PET_ON && item && PERSONA[item.persona];
    if (!P) return null;
    who = who || WHO;
    const line = (list) => {
      const ok = (list || []).filter((l) => l === null || typeof l === 'string' || l.who === who);
      const l = ok.length ? pick(ok) : null;
      return l && typeof l === 'object' ? l.t : l;
    };
    const pet = {
      item, P, clock: 0,
      mood: null, moodT: 0, next: null, nextT: 0,
      look: 0, lookTo: 0, lean: 0, leanTo: 0, bounce: 0, bv: 0, squish: 0,
      bubble: null, bubbleT: 0, bubbleK: 0,
      idleT: 0, idleNext: 3 + Math.random() * 3, withHer: 0,
      taps: [], g: null, parts: [], events: [],
      busy() { return !!this.g || this.idleT < 1.6; },
      react(r) {
        if (!r) return;
        this.mood = r.mood || null;
        this.moodT = r.dur || 1.5;
        this.lookTo = r.look !== undefined ? r.look : 0;
        this.leanTo = r.lean || 0;
        if (r.bounce) this.bv = -r.bounce * 9;
        if (r.squish) this.squish = 1;
        if (r.hearts) for (let i = 0; i < r.hearts; i++) this.spawn('heart');
        const text = line(r.say);
        if (text) { this.bubble = text; this.bubbleT = 1.3 + [...text].length * 0.06; this.bubbleK = 0; }
        this.next = r.then || null;
        this.nextT = r.then ? r.then.after : 0;
        this.events.push(r.mood || 'tap');
      },
      spawn(kind) {
        if (this.parts.length >= 7) return;
        const sd = Math.random() < 0.5 ? -1 : 1;
        this.parts.push({ kind, x: sd * (0.75 + Math.random() * 0.45), y: -0.2 - Math.random() * 0.5, vx: sd * (0.35 + Math.random() * 0.5), vy: -(0.8 + Math.random() * 0.5), life: 1.1, max: 1.1, s: 0.75 + Math.random() * 0.45 });
      },
      // type: down | move | up | cancel; px, py so với tâm đầu; r: bán kính đầu. Trả về true nếu chạm vào bé.
      pointer(type, px, py, r) {
        if (type === 'down') {
          if (Math.hypot(px, py + r * 0.35) > r * 1.9) return false;
          this.g = { t0: this.clock, x: px, y: py, dist: 0, acc: 0, strokes: 0, held: false, r };
          this.idleT = 0;
          return true;
        }
        const g = this.g;
        if (!g) return false;
        if (type === 'move') {
          const d = Math.hypot(px - g.x, py - g.y);
          g.dist += d; g.acc += d; g.x = px; g.y = py;
          if (g.acc > r * 1.3) { g.acc = 0; g.strokes++; this.stroke(); }
          this.idleT = 0;
          return true;
        }
        if (!g.held && !g.strokes && this.clock - g.t0 < 0.4 && g.dist < r * 0.6) this.tap();
        this.g = null;
        this.idleT = 0;
        return true;
      },
      tap() {
        const now = this.clock;
        // đang dỗi mà còn chọc: dỗi thêm chút nữa, chưa chịu làm lành
        if (this.mood === P.spam.mood && this.moodT > 0) {
          this.moodT = Math.max(this.moodT, 1.6);
          if (this.next) this.nextT = Math.max(this.nextT, 1.6);
          this.bv = -4;
          if (this.bubbleT < 0.6) { const t = line(P.spam.say); if (t) { this.bubble = t; this.bubbleT = 1.4; this.bubbleK = 0; } }
          this.events.push(P.spam.mood);
          return;
        }
        this.taps = this.taps.filter((x0) => now - x0 < 1.6);
        this.taps.push(now);
        if (this.taps.length >= 4) { this.taps = []; this.react(P.spam); if (P.work) this.withHer = 14; return; }
        if (P.work && this.withHer <= 0) { this.react(P.tapWork); this.withHer = 14; return; }
        this.react(pick(P.tap));
        if (P.work) this.withHer = 14;
      },
      stroke() {
        // vuốt liên tục: giữ nguyên nét mặt được cưng, thêm tim, thỉnh thoảng nói thêm
        if (this.mood === P.pet.mood && this.moodT > 0) {
          this.moodT = Math.max(this.moodT, 1.2);
          this.squish = 1;
          this.spawn('heart');
          if (this.bubbleT <= 0.3 && Math.random() < 0.4) { const t = line(P.pet.say); if (t) { this.bubble = t; this.bubbleT = 1.6; this.bubbleK = 0; } }
          this.events.push('pet');
        } else this.react(P.pet);
        if (P.work) this.withHer = 14;
      },
      update(dt) {
        this.clock += dt;
        this.idleT += dt;
        if (this.withHer > 0) this.withHer -= dt;
        const g = this.g;
        if (g && !g.held && !g.strokes && this.clock - g.t0 > 0.65 && g.dist < g.r * 0.5) { g.held = true; this.react(P.hold); if (P.work) this.withHer = 14; }
        if (this.next) { this.nextT -= dt; if (this.nextT <= 0) { const n = this.next; this.next = null; this.react(n); } }
        if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0 && !this.next) { this.mood = null; this.lookTo = 0; this.leanTo = 0; } }
        // để yên: tự làm việc riêng theo tính cách
        if (!g && !this.next && this.moodT <= 0 && this.idleT > 2.5) {
          this.idleNext -= dt;
          if (this.idleNext <= 0) {
            this.idleNext = 5 + Math.random() * 4;
            this.react(pick(P.work && this.withHer > 0 ? P.idleWithHer : P.idle));
            this.events.pop();
          }
        }
        this.look += (this.lookTo - this.look) * Math.min(1, dt * 6);
        this.lean += (this.leanTo - this.lean) * Math.min(1, dt * 6);
        this.bv += (-this.bounce * 160 - this.bv * 9) * dt;
        this.bounce += this.bv * dt;
        this.squish = Math.max(0, this.squish - dt * 1.6);
        if (this.bubbleT > 0) { this.bubbleT -= dt; this.bubbleK = Math.min(1, this.bubbleK + dt * 6); }
        for (let i = this.parts.length - 1; i >= 0; i--) {
          const q = this.parts[i];
          q.life -= dt;
          if (q.life <= 0) { this.parts.splice(i, 1); continue; }
          q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - dt;
        }
      },
      // nét mặt hiện tại (Vi Mạch để yên thì về mặt làm việc)
      face() {
        const mood = this.mood || (P.work && this.withHer <= 0 ? P.work : null);
        return mood ? { mood, look: this.look } : {};
      },
      apply(x, r) {
        x.translate(0, Math.min(0, this.bounce) * r * 0.08);
        x.rotate(this.lean);
        const k = this.squish * this.squish;
        x.scale(1 + k * 0.1, 1 - k * 0.09);
      },
      takeEvents() { const e = this.events; this.events = []; return e; },
      drawFx(x, r, S) {
        for (const q of this.parts) {
          const k = q.life / q.max;
          x.globalAlpha = Math.min(1, k * 2);
          x.fillStyle = '#FF6F8E';
          heartPath(x, q.x * r, q.y * r - (1 - k) * r * 0.6, r * 0.2 * q.s);
          x.fill();
        }
        x.globalAlpha = 1;
        if (this.bubbleT > 0 && this.bubble) drawBubble(x, this.bubble, 0, -r * (this.item.acc === 'nonla' ? 2.25 : 2.45), Math.max(12, r * 0.55), P.bubble, Math.min(1, this.bubbleT * 3) * easeOutBack(this.bubbleK));
      },
    };
    return pet;
  }
  const easeOutBack = (k) => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  // Bong bóng lời nói phía trên đầu bé sâu (cx, by: điểm đuôi bong bóng chỉ xuống).
  function drawBubble(x, text, cx, by, fs, col, k) {
    if (k <= 0) return;
    x.save();
    x.font = '700 ' + Math.round(fs) + 'px "Be Vietnam Pro", system-ui, sans-serif';
    const w = x.measureText(text).width + fs * 1.3, h = fs * 2;
    x.translate(cx, by);
    x.scale(k, k);
    const L = -w / 2, T = -h - fs * 0.5, rr = h / 2;
    x.fillStyle = col.bg;
    x.strokeStyle = col.line;
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(L + rr, T); x.lineTo(L + w - rr, T); x.arc(L + w - rr, T + rr, rr, -Math.PI / 2, Math.PI / 2);
    x.lineTo(fs * 0.4, T + h); x.lineTo(0, 0); x.lineTo(-fs * 0.35, T + h);
    x.lineTo(L + rr, T + h); x.arc(L + rr, T + rr, rr, Math.PI / 2, Math.PI * 1.5);
    x.closePath();
    x.fill();
    x.stroke();
    x.fillStyle = col.ink;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(text, 0, T + h / 2 + fs * 0.05);
    x.restore();
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

  // ----- Nền Hai Tần Số: ăng-ten Hà Nội gửi sóng tới khung cửa sổ có sách trên đồi chè Thái Nguyên -----
  // Mặt đất liền một dải: phố Hà Nội bằng phẳng bên trái, lên dần thành đồi chè bên phải; xn = x / W.
  function twoGround(W, H, xn) {
    const k = Math.min(1, Math.max(0, (xn - 0.4) / 0.42));
    const rise = k * k * (3 - 2 * k);
    return H * (0.84 - 0.12 * rise - 0.014 * Math.sin(xn * 11 + 0.6) * rise);
  }
  function twoGeom(W, H) {
    const u = Math.min(W, H) / 100;
    const tx = W * 0.17, base = twoGround(W, H, 0.17), top = base - H * 0.3, mast = top - 9 * u;
    // chân nhà đặt đúng trên mặt đồi
    const hx = W * 0.8, hy = twoGround(W, H, 0.8) + 0.6 * u;
    return { u, base, tx, top, mast, hx, hy, win: { x: hx - 3.4 * u, y: hy - 7.8 * u, w: 5.2 * u, h: 4.4 * u } };
  }
  function paintTwoFreq(x, W, H) {
    const G = twoGeom(W, H), u = G.u;
    const sky = x.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0B0C2A'); sky.addColorStop(0.55, '#221B50'); sky.addColorStop(1, '#3B2A66');
    x.fillStyle = sky;
    x.fillRect(0, 0, W, H);
    const haze = x.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.75);
    haze.addColorStop(0, 'rgba(160,140,255,0.14)'); haze.addColorStop(1, 'rgba(160,140,255,0)');
    x.fillStyle = haze;
    x.fillRect(0, 0, W, H);
    for (let i = 0; i < 80; i++) {
      x.fillStyle = 'rgba(255,244,214,' + (0.25 + rnd(i + 400) * 0.6) + ')';
      x.beginPath(); x.arc(rnd(i + 200) * W, rnd(i + 300) * H * 0.6, (0.25 + rnd(i + 500) * 0.55) * u * 0.5, 0, TAU); x.fill();
    }
    // trăng khuyết
    const mx = W * 0.8, my = H * 0.12, mr = 4.6 * u;
    const mg = x.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3);
    mg.addColorStop(0, 'rgba(255,241,201,0.3)'); mg.addColorStop(1, 'rgba(255,241,201,0)');
    x.fillStyle = mg;
    x.beginPath(); x.arc(mx, my, mr * 3, 0, TAU); x.fill();
    x.fillStyle = '#FFF1C9';
    x.beginPath(); x.arc(mx, my, mr, 0, TAU); x.fill();
    x.fillStyle = '#0F0F33';
    x.beginPath(); x.arc(mx + mr * 0.45, my - mr * 0.3, mr * 0.85, 0, TAU); x.fill();
    // dãy núi xa nối liền hai bên (phía Thái Nguyên cao hơn, như núi Tam Đảo)
    const far = (col, y0, amp, ph) => {
      x.fillStyle = col;
      x.beginPath();
      x.moveTo(0, H);
      for (let i = 0; i <= 60; i++) {
        const xn = i / 60;
        x.lineTo(xn * W, H * (y0 - amp * (0.4 + 0.6 * xn) * (0.6 + 0.4 * Math.sin(xn * 7 + ph)) - 0.02 * Math.sin(xn * 17 + ph)));
      }
      x.lineTo(W, H);
      x.closePath();
      x.fill();
    };
    far('#1C1946', 0.72, 0.12, 0.4);
    far('#211D52', 0.77, 0.07, 2.1);
    // phố Hà Nội: nhà cao thấp đứng trên mặt đất, cửa sổ lấm tấm đèn
    for (let i = 0; i < 15; i++) {
      const bw = (3.6 + rnd(i + 600) * 4.6) * u, bx = i * W * 0.029 - u, bh = H * (0.035 + rnd(i + 700) * 0.1);
      const gy = twoGround(W, H, Math.min(0.42, (bx + bw / 2) / W)) + u;
      x.fillStyle = i % 3 ? '#17143A' : '#1B1844';
      x.fillRect(bx, gy - bh, bw, bh + u);
      for (let k = 0; k < 6; k++) {
        if (rnd(i * 13 + k) < 0.55) continue;
        const wy = gy - bh + (1.5 + k * 2.4) * u;
        if (wy > gy - 1.5 * u) continue;
        x.fillStyle = 'rgba(255,210,122,' + (0.35 + rnd(i * 7 + k) * 0.5) + ')';
        x.fillRect(bx + (0.8 + rnd(i * 5 + k) * Math.max(0.2, bw / u - 2.2)) * u, wy, 0.9 * u, 1.3 * u);
      }
    }
    // tháp ăng-ten (dàn thép) đứng trên mặt đất
    x.strokeStyle = '#3A3578';
    x.lineWidth = 0.9 * u;
    x.lineCap = 'round';
    const L0 = G.tx - 5 * u, R0 = G.tx + 5 * u, L1 = G.tx - 0.9 * u, R1 = G.tx + 0.9 * u;
    x.beginPath();
    x.moveTo(L0, G.base); x.lineTo(L1, G.top);
    x.moveTo(R0, G.base); x.lineTo(R1, G.top);
    const N = 9;
    for (let i = 0; i < N; i++) {
      const a = i / N, b = (i + 1) / N;
      const ya = G.base + (G.top - G.base) * a, yb = G.base + (G.top - G.base) * b;
      const la = L0 + (L1 - L0) * a, ra = R0 + (R1 - R0) * a, lb = L0 + (L1 - L0) * b, rb = R0 + (R1 - R0) * b;
      x.moveTo(la, ya); x.lineTo(rb, yb);
      x.moveTo(ra, ya); x.lineTo(lb, yb);
      x.moveTo(la, ya); x.lineTo(ra, ya);
    }
    x.moveTo(G.tx, G.top); x.lineTo(G.tx, G.mast);
    x.stroke();
    x.fillStyle = '#3A3578';
    x.fillRect(G.tx - 2.4 * u, G.top - 0.8 * u, 4.8 * u, 1.4 * u);
    // mặt đất liền: phố tím thẫm chuyển dần sang đồi chè xanh
    const gg = x.createLinearGradient(0, 0, W, 0);
    gg.addColorStop(0, '#16133A'); gg.addColorStop(0.42, '#181A3C'); gg.addColorStop(0.62, '#1B3634'); gg.addColorStop(1, '#1F4A3B');
    x.fillStyle = gg;
    x.beginPath();
    x.moveTo(0, H);
    for (let i = 0; i <= 80; i++) x.lineTo((i / 80) * W, twoGround(W, H, i / 80));
    x.lineTo(W, H);
    x.closePath();
    x.fill();
    // luống chè chạy theo sườn đồi
    x.strokeStyle = 'rgba(140,210,160,0.16)';
    x.lineWidth = 0.8 * u;
    for (let j = 1; j <= 8; j++) {
      x.beginPath();
      for (let i = 0; i <= 40; i++) {
        const xn = 0.5 + (0.5 * i) / 40;
        const y = twoGround(W, H, xn) + j * H * 0.019;
        if (i) x.lineTo(xn * W, y); else x.moveTo(xn * W, y);
      }
      x.stroke();
    }
    // con đường từ phố lên tận cửa nhà, có hai cột đèn
    const road = (xn) => twoGround(W, H, xn) + H * 0.028 * Math.sin(Math.min(1, (xn - 0.3) / 0.5) * Math.PI);
    x.strokeStyle = 'rgba(255,214,150,0.32)';
    x.lineWidth = 1.6 * u;
    x.beginPath();
    for (let i = 0; i <= 40; i++) {
      const xn = 0.3 + (0.5 * i) / 40;
      const y = i === 40 ? G.hy : road(xn);
      if (i) x.lineTo(xn * W, y); else x.moveTo(xn * W, y);
    }
    x.stroke();
    for (const xn of [0.48, 0.64]) {
      const lx = xn * W, ly = road(xn);
      x.strokeStyle = '#3A3578';
      x.lineWidth = 0.6 * u;
      x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx, ly - 6 * u); x.stroke();
      const lg = x.createRadialGradient(lx, ly - 6.4 * u, 0, lx, ly - 6.4 * u, 4 * u);
      lg.addColorStop(0, 'rgba(255,214,120,0.55)'); lg.addColorStop(1, 'rgba(255,214,120,0)');
      x.fillStyle = lg;
      x.beginPath(); x.arc(lx, ly - 6.4 * u, 4 * u, 0, TAU); x.fill();
      x.fillStyle = '#FFD27A';
      x.beginPath(); x.arc(lx, ly - 6.4 * u, 0.8 * u, 0, TAU); x.fill();
    }
    // cây bên nhà
    x.fillStyle = '#14352B';
    x.fillRect(G.hx - 11.6 * u, G.hy - 6 * u, 1.2 * u, 6.5 * u);
    x.beginPath(); x.arc(G.hx - 11 * u, G.hy - 8 * u, 4 * u, 0, TAU); x.arc(G.hx - 13.4 * u, G.hy - 6 * u, 2.8 * u, 0, TAU); x.fill();
    // căn nhà nhỏ đứng trên đồi, cửa đi và khung cửa sổ sáng đèn
    x.fillStyle = '#2B2347';
    x.fillRect(G.hx - 7 * u, G.hy - 10 * u, 14 * u, 10.6 * u);
    x.fillStyle = '#3A2E5C';
    x.beginPath(); x.moveTo(G.hx - 8.6 * u, G.hy - 9.6 * u); x.lineTo(G.hx, G.hy - 16 * u); x.lineTo(G.hx + 8.6 * u, G.hy - 9.6 * u); x.closePath(); x.fill();
    x.fillStyle = '#1C1733';
    x.fillRect(G.hx + 2.4 * u, G.hy - 5.6 * u, 3 * u, 5.8 * u);
    x.fillStyle = 'rgba(255,200,107,0.6)';
    x.beginPath(); x.arc(G.hx + 4.8 * u, G.hy - 2.6 * u, 0.35 * u, 0, TAU); x.fill();
    const wn = G.win;
    x.fillStyle = '#FFC96B';
    x.fillRect(wn.x, wn.y, wn.w, wn.h);
    // trong cửa sổ: đèn bàn và chồng sách
    x.fillStyle = '#B5733A';
    x.fillRect(wn.x + wn.w * 0.1, wn.y + wn.h * 0.72, wn.w * 0.5, wn.h * 0.14);
    x.fillRect(wn.x + wn.w * 0.14, wn.y + wn.h * 0.58, wn.w * 0.42, wn.h * 0.14);
    x.fillStyle = '#8C4A5E';
    x.beginPath(); x.moveTo(wn.x + wn.w * 0.62, wn.y + wn.h * 0.26); x.lineTo(wn.x + wn.w * 0.92, wn.y + wn.h * 0.26); x.lineTo(wn.x + wn.w * 0.84, wn.y + wn.h * 0.06); x.lineTo(wn.x + wn.w * 0.7, wn.y + wn.h * 0.06); x.closePath(); x.fill();
    x.fillRect(wn.x + wn.w * 0.75, wn.y + wn.h * 0.26, wn.w * 0.04, wn.h * 0.6);
    x.strokeStyle = '#2B2347';
    x.lineWidth = 0.6 * u;
    x.strokeRect(wn.x, wn.y, wn.w, wn.h);
    x.beginPath(); x.moveTo(wn.x + wn.w / 2, wn.y); x.lineTo(wn.x + wn.w / 2, wn.y + wn.h * 0.5); x.stroke();
  }
  function liveTwoFreq(x, o, st) {
    const { W, H, t } = o;
    const G = twoGeom(W, H), u = G.u;
    // sao lấp lánh
    for (let i = 0; i < 10; i++) {
      x.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.8 + rnd(i + 900)) + i * 1.7));
      x.fillStyle = '#FFF4D6';
      starPath(x, rnd(i + 910) * W, rnd(i + 920) * H * 0.55, 1.3 * u, 0.5 * u);
      x.fill();
    }
    x.globalAlpha = 1;
    // đèn đỏ đỉnh tháp
    const blink = Math.sin(t * 3) > 0.2;
    x.fillStyle = blink ? '#FF4F7B' : '#7A2A44';
    x.beginPath(); x.arc(G.tx, G.mast, 1.1 * u, 0, TAU); x.fill();
    if (blink) { x.fillStyle = 'rgba(255,79,123,0.25)'; x.beginPath(); x.arc(G.tx, G.mast, 3 * u, 0, TAU); x.fill(); }
    // sóng phát ra về phía cửa sổ
    x.strokeStyle = '#5FFFE0';
    x.lineWidth = 0.8 * u;
    const ang = Math.atan2(G.win.y - G.mast, G.hx - G.tx);
    for (let k = 0; k < 3; k++) {
      const q = ((t / 1.8) + k / 3) % 1;
      x.globalAlpha = (1 - q) * 0.7;
      x.beginPath(); x.arc(G.tx, G.mast, (3 + q * 22) * u, ang - 0.55, ang + 0.55); x.stroke();
    }
    x.globalAlpha = 1;
    // tim bay theo đường cong từ đỉnh tháp tới khung cửa sổ
    const P0 = [G.tx, G.mast], P2 = [G.hx, G.win.y + G.win.h / 2], P1 = [(G.tx + G.hx) / 2, Math.min(G.mast, P2[1]) - H * 0.16];
    let arrive = 0;
    for (let i = 0; i < 3; i++) {
      const q = (t * 0.15 + i / 3) % 1;
      const a = 1 - q;
      const hxp = a * a * P0[0] + 2 * a * q * P1[0] + q * q * P2[0];
      const hyp = a * a * P0[1] + 2 * a * q * P1[1] + q * q * P2[1];
      if (q > 0.9) arrive = Math.max(arrive, (q - 0.9) / 0.1);
      const fade = Math.min(1, q * 8, (1 - q) * 10);
      x.globalAlpha = fade * 0.35;
      x.fillStyle = '#FF8FA3';
      x.beginPath(); x.arc(hxp, hyp, 3.4 * u, 0, TAU); x.fill();
      x.globalAlpha = fade;
      x.fillStyle = '#FF6F8E';
      heartPath(x, hxp, hyp, 1.7 * u * (1 + 0.15 * Math.sin(t * 8 + i)));
      x.fill();
    }
    x.globalAlpha = 1;
    // cửa sổ sáng hơn khi tim tới nơi
    const wn = G.win;
    const glow = 0.25 + 0.12 * Math.sin(t * 1.3) + arrive * 0.45;
    const gg = x.createRadialGradient(G.hx, wn.y + wn.h / 2, 0, G.hx, wn.y + wn.h / 2, 14 * u);
    gg.addColorStop(0, 'rgba(255,214,120,' + glow + ')');
    gg.addColorStop(1, 'rgba(255,214,120,0)');
    x.fillStyle = gg;
    x.beginPath(); x.arc(G.hx, wn.y + wn.h / 2, 14 * u, 0, TAU); x.fill();
  }

  // ----- Vạch Lá: đồi chè Thái Nguyên lúc nửa đêm, kính lúp lia tới đâu lá sáng tới đó -----
  // Vẽ sẵn hai bản cùng một cảnh: bản tối và bản được soi sáng (có dấu chân, dấu hỏi và Sâu Tím trốn trong lá);
  // mỗi khung hình chỉ cắt bản sáng theo mặt kính lúp.
  const CASE = {
    dark: { sky: ['#120D2E', '#2B2058', '#4A3473'], far: '#241C4C', hill: ['#1A302E', '#1D3933', '#21433A'], row: ['#213D38', '#26493F', '#2C5646'], leaf: '#14282A', vein: 'rgba(0,0,0,0)', mist: 'rgba(150,140,230,0.12)' },
    lit: { sky: ['#2E2A6A', '#5A4A9A', '#8A6FB0'], far: '#4A3F86', hill: ['#3E7854', '#478A58', '#529C5E'], row: ['#5A9C60', '#68AF68', '#7DC470'], leaf: '#3F8C50', vein: 'rgba(200,240,170,0.75)', mist: 'rgba(255,240,200,0.16)' },
  };
  function caseGeom(W, H) {
    const u = Math.min(W, H) / 100;
    const fA = (xn) => H * (0.585 - 0.06 * Math.sin(xn * 3.1 + 0.8) - 0.025 * Math.sin(xn * 7.3 + 2));
    const fB = (xn) => H * (0.68 - 0.05 * Math.sin(xn * 2.6 + 2.4) - 0.018 * Math.sin(xn * 9.1));
    const fC = (xn) => H * (0.8 - 0.04 * Math.sin(xn * 3.4 + 4.1));
    return { u, fA, fB, fC, worm: { x: W * 0.66, y: fC(0.66) + 3 * u }, lamp: { x: W * 0.28, y: fB(0.28) - 9 * u } };
  }
  // Đường kính lúp đi (lúc t nhỏ thì đang soi đúng chỗ Sâu Tím, để ảnh thu nhỏ trong tiệm thấy luôn).
  const caseLens = (W, H, t) => [W * (0.5 + 0.33 * Math.sin(t * 0.21 + 0.44)), H * (0.72 + 0.08 * Math.sin(t * 0.34 + 1.47))];
  function caseHill(x, W, H, f, col, rowCol, gap, lit, u) {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, H);
    for (let i = 0; i <= 60; i++) x.lineTo((i / 60) * W, f(i / 60));
    x.lineTo(W, H);
    x.closePath();
    x.fill();
    // luống chè chạy song song theo sườn đồi, xa thì mảnh, gần thì dày
    const rows = Math.ceil((H * 0.5) / gap);
    x.strokeStyle = rowCol;
    x.lineWidth = gap * 0.56;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    for (let k = 1; k <= rows; k++) {
      x.beginPath();
      for (let i = 0; i <= 60; i++) {
        const xn = i / 60, y = f(xn) + k * gap * (0.9 + 0.25 * xn);
        if (i) x.lineTo(xn * W, y); else x.moveTo(xn * W, y);
      }
      x.stroke();
    }
    // bản sáng: thấy rõ từng bụi chè lô nhô trên luống
    if (!lit) return;
    x.fillStyle = 'rgba(190,235,150,0.35)';
    for (let k = 1; k <= rows; k++) {
      for (let px = (k % 2) * u * 1.5; px < W; px += u * 3) {
        const xn = px / W, y = f(xn) + k * gap * (0.9 + 0.25 * xn) - gap * 0.2;
        x.beginPath(); x.arc(px, y, gap * 0.2, Math.PI, TAU); x.fill();
      }
    }
  }
  // Lá chè to ở tiền cảnh (gân lá chỉ thấy ở bản sáng).
  function caseLeaf(x, cx, cy, len, ang, col, vein) {
    x.save();
    x.translate(cx, cy);
    x.rotate(ang);
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, 0);
    x.quadraticCurveTo(len * 0.5, -len * 0.34, len, 0);
    x.quadraticCurveTo(len * 0.5, len * 0.34, 0, 0);
    x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.18)';
    x.lineWidth = Math.max(1, len * 0.02);
    x.stroke();
    x.strokeStyle = vein;
    x.lineWidth = Math.max(1, len * 0.03);
    x.beginPath();
    x.moveTo(len * 0.04, 0); x.lineTo(len * 0.94, 0);
    for (let i = 1; i <= 4; i++) {
      const vx = len * i * 0.19;
      x.moveTo(vx, 0); x.lineTo(vx + len * 0.1, -len * 0.12);
      x.moveTo(vx, 0); x.lineTo(vx + len * 0.1, len * 0.12);
    }
    x.stroke();
    x.restore();
  }
  // Sâu Tím trốn trong lá: ba đốt tím, đầu ló ra, má hồng; lá chè che bớt thân.
  function caseWorm(x, wx, wy, u) {
    const r = 2.8 * u;
    x.fillStyle = '#9677DE';
    for (let k = 3; k >= 1; k--) { x.beginPath(); x.arc(wx - k * r * 1.25, wy + k * r * 0.22, r * (1 - k * 0.08), 0, TAU); x.fill(); }
    x.strokeStyle = '#6B4FA0';
    x.lineWidth = 0.5 * u;
    x.lineCap = 'round';
    for (const side of [-1, 1]) {
      x.beginPath(); x.moveTo(wx + side * r * 0.4, wy - r * 0.9); x.quadraticCurveTo(wx + side * r * 0.7, wy - r * 1.8, wx + side * r * 1.1, wy - r * 1.9); x.stroke();
      x.fillStyle = '#FF8FA3';
      x.beginPath(); x.arc(wx + side * r * 1.1, wy - r * 1.9, 0.6 * u, 0, TAU); x.fill();
    }
    x.fillStyle = '#B79CF0';
    x.beginPath(); x.arc(wx, wy, r * 1.15, 0, TAU); x.fill();
    x.fillStyle = '#2A1F3D';
    x.beginPath(); x.arc(wx - r * 0.42, wy - r * 0.1, r * 0.2, 0, TAU); x.arc(wx + r * 0.42, wy - r * 0.1, r * 0.2, 0, TAU); x.fill();
    x.fillStyle = '#FFFFFF';
    x.beginPath(); x.arc(wx - r * 0.36, wy - r * 0.18, r * 0.07, 0, TAU); x.arc(wx + r * 0.48, wy - r * 0.18, r * 0.07, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,111,142,0.6)';
    x.beginPath(); x.arc(wx - r * 0.72, wy + r * 0.3, r * 0.22, 0, TAU); x.arc(wx + r * 0.72, wy + r * 0.3, r * 0.22, 0, TAU); x.fill();
    caseLeaf(x, wx - r * 3.4, wy + r * 1.7, r * 4.4, -0.3, '#2F7D45', 'rgba(170,225,140,0.55)');
  }
  function paintCase(x, W, H, lit) {
    const C = lit ? CASE.lit : CASE.dark;
    const G = caseGeom(W, H), u = G.u;
    const sky = x.createLinearGradient(0, 0, 0, H * 0.8);
    sky.addColorStop(0, C.sky[0]); sky.addColorStop(0.6, C.sky[1]); sky.addColorStop(1, C.sky[2]);
    x.fillStyle = sky;
    x.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      x.fillStyle = 'rgba(255,244,214,' + (0.25 + rnd(i + 600) * 0.6) + ')';
      x.beginPath(); x.arc(rnd(i + 610) * W, rnd(i + 620) * H * 0.5, (0.25 + rnd(i + 630) * 0.5) * u * 0.5, 0, TAU); x.fill();
    }
    // trăng rằm
    const mx = W * 0.2, my = H * 0.14, mr = 5 * u;
    const mg = x.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3.2);
    mg.addColorStop(0, 'rgba(255,241,201,0.32)'); mg.addColorStop(1, 'rgba(255,241,201,0)');
    x.fillStyle = mg;
    x.beginPath(); x.arc(mx, my, mr * 3.2, 0, TAU); x.fill();
    x.fillStyle = '#FFF1C9';
    x.beginPath(); x.arc(mx, my, mr, 0, TAU); x.fill();
    x.fillStyle = 'rgba(220,200,160,0.35)';
    x.beginPath(); x.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.22, 0, TAU); x.arc(mx + mr * 0.35, my + mr * 0.25, mr * 0.16, 0, TAU); x.fill();
    // núi xa, rồi ba lớp đồi chè
    x.fillStyle = C.far;
    x.beginPath();
    x.moveTo(0, H);
    for (let i = 0; i <= 60; i++) { const xn = i / 60; x.lineTo(xn * W, H * (0.5 - 0.07 * Math.sin(xn * 4.2 + 1.1) - 0.03 * Math.sin(xn * 11))); }
    x.lineTo(W, H);
    x.closePath();
    x.fill();
    mist(x, W, H * 0.55, H * 0.05, C.mist);
    caseHill(x, W, H, G.fA, C.hill[0], C.row[0], 2.4 * u, lit, u);
    mist(x, W, H * 0.66, H * 0.04, C.mist);
    caseHill(x, W, H, G.fB, C.hill[1], C.row[1], 3.1 * u, lit, u);
    // cột đèn lồng bên luống chè
    x.strokeStyle = lit ? '#6E4426' : '#1A1530';
    x.lineWidth = 0.7 * u;
    x.beginPath(); x.moveTo(G.lamp.x, G.fB(0.28) + u); x.lineTo(G.lamp.x, G.lamp.y); x.lineTo(G.lamp.x + 2.4 * u, G.lamp.y); x.stroke();
    x.fillStyle = '#FFD27A';
    x.fillRect(G.lamp.x + 1.6 * u, G.lamp.y + 0.4 * u, 1.8 * u, 2.4 * u);
    caseHill(x, W, H, G.fC, C.hill[2], C.row[2], 4 * u, lit, u);
    if (lit) {
      // dấu chân dẫn tới chỗ Sâu Tím trốn
      x.fillStyle = 'rgba(96,60,34,0.7)';
      for (let i = 0; i < 9; i++) {
        const q = i / 9;
        const px = W * (0.12 + 0.5 * q), py = H * 0.97 - (H * 0.97 - G.worm.y - 2 * u) * Math.pow(q, 0.8) + (i % 2 ? 1.1 : -1.1) * u;
        x.beginPath(); x.ellipse(px, py, 0.7 * u, 1.1 * u, -0.9, 0, TAU); x.fill();
        x.beginPath(); x.arc(px + 0.9 * u, py - 0.8 * u, 0.4 * u, 0, TAU); x.fill();
      }
      x.fillStyle = 'rgba(255,248,220,0.55)';
      x.font = 'italic 700 ' + Math.round(6 * u) + 'px Fraunces, Georgia, serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('?', W * 0.34, G.fB(0.34) + 6 * u);
      x.fillText('?', W * 0.88, G.fC(0.88) + 7 * u);
      x.fillStyle = '#FF6F8E';
      heartPath(x, G.worm.x + 4.6 * u, G.worm.y - 4.4 * u, 1.3 * u); x.fill();
      caseWorm(x, G.worm.x, G.worm.y, u);
    } else {
      // trong bóng tối chỉ thấy hai đốm mắt lấp lánh
      x.fillStyle = 'rgba(255,255,255,0.55)';
      x.beginPath(); x.arc(G.worm.x - u, G.worm.y - 0.2 * u, 0.45 * u, 0, TAU); x.arc(G.worm.x + u, G.worm.y - 0.2 * u, 0.45 * u, 0, TAU); x.fill();
    }
    // lá chè to ở hai góc dưới
    const L = Math.max(W, H) * 0.16;
    caseLeaf(x, -L * 0.1, H * 0.96, L, -0.55, C.leaf, C.vein);
    caseLeaf(x, -L * 0.15, H * 1.02, L * 0.8, -0.15, C.leaf, C.vein);
    caseLeaf(x, W + L * 0.1, H * 0.95, L, Math.PI + 0.6, C.leaf, C.vein);
    caseLeaf(x, W + L * 0.12, H * 1.03, L * 0.85, Math.PI + 0.2, C.leaf, C.vein);
  }
  function liveCase(x, o, st) {
    const { W, H, t } = o;
    const G = caseGeom(W, H), u = G.u;
    // sao lấp lánh
    for (let i = 0; i < 8; i++) {
      x.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.7 + rnd(i + 640)) + i * 2.1));
      x.fillStyle = '#FFF4D6';
      starPath(x, rnd(i + 650) * W, rnd(i + 660) * H * 0.45, 1.2 * u, 0.45 * u);
      x.fill();
    }
    x.globalAlpha = 1;
    // đèn lồng lập loè
    const fl = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 3.7);
    const lg = x.createRadialGradient(G.lamp.x + 2.5 * u, G.lamp.y + 1.6 * u, 0, G.lamp.x + 2.5 * u, G.lamp.y + 1.6 * u, 9 * u);
    lg.addColorStop(0, 'rgba(255,200,110,' + 0.45 * fl + ')'); lg.addColorStop(1, 'rgba(255,200,110,0)');
    x.fillStyle = lg;
    x.beginPath(); x.arc(G.lamp.x + 2.5 * u, G.lamp.y + 1.6 * u, 9 * u, 0, TAU); x.fill();
    // đom đóm
    for (let i = 0; i < 9; i++) {
      const fx = (rnd(i + 700) * W + Math.sin(t * (0.3 + rnd(i + 710) * 0.4) + i) * 8 * u + W) % W;
      const fy = H * (0.55 + rnd(i + 720) * 0.35) + Math.sin(t * (0.5 + rnd(i + 730)) + i * 2) * 3 * u;
      const a = Math.max(0, Math.sin(t * (1.2 + rnd(i + 740)) + i * 1.7));
      x.globalAlpha = a * 0.35;
      x.fillStyle = '#E8FF8A';
      x.beginPath(); x.arc(fx, fy, 1.6 * u, 0, TAU); x.fill();
      x.globalAlpha = a;
      x.beginPath(); x.arc(fx, fy, 0.5 * u, 0, TAU); x.fill();
    }
    x.globalAlpha = 1;
    // kính lúp: trong mặt kính là bản sáng của cảnh (game đang bật kính lúp kỹ năng thì cái này mờ đi)
    const qa = 1 - Math.min(1, o.quiet || 0);
    if (qa < 0.02) return;
    x.save();
    x.globalAlpha = qa;
    const R = 14 * u;
    const [lx, ly] = caseLens(W, H, t);
    if (st.lit) {
      x.save();
      x.beginPath(); x.arc(lx, ly, R, 0, TAU); x.clip();
      x.drawImage(st.lit, 0, 0, W, H);
      const wg = x.createRadialGradient(lx - R * 0.3, ly - R * 0.3, 0, lx, ly, R);
      wg.addColorStop(0, 'rgba(255,240,200,0.22)'); wg.addColorStop(1, 'rgba(255,240,200,0)');
      x.fillStyle = wg;
      x.fillRect(lx - R, ly - R, R * 2, R * 2);
      x.restore();
    }
    const ha = Math.PI / 4;
    const h0 = [lx + Math.cos(ha) * R * 1.02, ly + Math.sin(ha) * R * 1.02], h1 = [lx + Math.cos(ha) * R * 1.9, ly + Math.sin(ha) * R * 1.9];
    x.lineCap = 'round';
    x.strokeStyle = '#3A2414';
    x.lineWidth = 3.6 * u;
    x.beginPath(); x.moveTo(h0[0], h0[1]); x.lineTo(h1[0], h1[1]); x.stroke();
    x.strokeStyle = '#7A4E2C';
    x.lineWidth = 2.4 * u;
    x.beginPath(); x.moveTo(h0[0], h0[1]); x.lineTo(h1[0], h1[1]); x.stroke();
    x.strokeStyle = 'rgba(0,0,0,0.28)';
    x.lineWidth = 1.2 * u;
    x.beginPath(); x.arc(lx, ly, R + 1.4 * u, 0, TAU); x.stroke();
    x.strokeStyle = '#D9A441';
    x.lineWidth = 1.7 * u;
    x.beginPath(); x.arc(lx, ly, R + 0.5 * u, 0, TAU); x.stroke();
    x.strokeStyle = '#FFE39A';
    x.lineWidth = 0.4 * u;
    x.beginPath(); x.arc(lx, ly, R + 0.9 * u, Math.PI * 1.05, Math.PI * 1.6); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.55)';
    x.lineWidth = 0.9 * u;
    x.beginPath(); x.arc(lx, ly, R * 0.72, Math.PI * 1.08, Math.PI * 1.42); x.stroke();
    // soi trúng Sâu Tím: dấu chấm than bật lên
    const d = Math.hypot(lx - G.worm.x, ly - G.worm.y), near = 1 - d / (R * 0.8);
    if (near > 0) {
      const k = Math.min(1, near * 2.2), bob = Math.sin(t * 6) * 0.5 * u;
      const bx = G.worm.x + 0.6 * u, by = G.worm.y - 7.2 * u + bob;
      x.globalAlpha = k * qa;
      x.fillStyle = '#FFFFFF';
      x.beginPath(); x.arc(bx, by, 2.6 * u * (0.6 + 0.4 * k), 0, TAU); x.fill();
      x.fillStyle = '#E0408A';
      x.font = '700 ' + Math.round(3.6 * u * (0.6 + 0.4 * k)) + 'px Fraunces, Georgia, serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('!', bx, by + 0.2 * u);
    }
    x.restore();
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
      if (kind === 'sapa') paintSapa(cx, o.W, o.H, night);
      else if (kind === 'twofreq') paintTwoFreq(cx, o.W, o.H);
      else if (kind === 'case') paintCase(cx, o.W, o.H, false);
      else paintCastle(cx, o.W, o.H);
      st.lit = null;
      if (kind === 'case') {
        const c2 = document.createElement('canvas');
        c2.width = c.width;
        c2.height = c.height;
        const lx = c2.getContext('2d');
        lx.scale(o.dpr, o.dpr);
        paintCase(lx, o.W, o.H, true);
        st.lit = c2;
      }
      st.key = key;
      st.cache = c;
      st.clouds = null;
      st.bats = null;
    }
    x.drawImage(st.cache, 0, 0, o.W, o.H);
    const live = { W: o.W, H: o.H, t: o.t || 0, dt: o.dt || 0, speed: o.speed || 0, night, quiet: o.quiet || 0 };
    if (kind === 'sapa') liveSapa(x, live, st);
    else if (kind === 'twofreq') liveTwoFreq(x, live, st);
    else if (kind === 'case') liveCase(x, live, st);
    else liveCastle(x, live, st);
    return true;
  }
  // Màu trời trên cùng của nền (để tô phần ngoài khung hình cho liền).
  function backdropTop(item, night) {
    const kind = item.bg && item.bg.kind;
    if (kind === 'sapa') return night ? SAPA.night.sky[0] : SAPA.day.sky[0];
    if (kind === 'castle') return '#120A26';
    if (kind === 'twofreq') return '#0B0C2A';
    if (kind === 'case') return '#120D2E';
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
        p.max = 1; p.life = 1; p.rot = a + t; p.g = i; p.size *= p.kind === 7 ? 1.3 : 1.25;
        if (p.kind === 3) { p.life = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.5)); p.x = 0; p.y = 0; }
        drawParticle(x, p, S);
      });
    }
    x.restore();
  }

  window.Skins = {
    ITEMS, RARITY, DEFAULT, BASE, EVENTS, get, byKey, palette, eventById, activeEvent, visibleEvents, itemState, startOf, isPreview, makePet,
    drawSegment, drawHead, drawCocoon, drawButterfly, eatBurst, stepParticle, drawParticle, drawPreview, heartPath,
    drawBackdrop, backdropTop, SKILLS, SKILL_RAND, skillOf, skillIcon, skillEffects, skillMax, UP_COST, BREAK, BREAK_GOALS, WEEK_USES,
  };
})();
