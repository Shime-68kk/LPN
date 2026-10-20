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
  ];

  const BY_ID = {};
  for (const it of ITEMS) BY_ID[it.slot + ':' + it.id] = it;
  const DEFAULT = { skin: 'tim', fx: 'la', wing: 'canh-tim' };
  const get = (slot, id) => BY_ID[slot + ':' + id] || BY_ID[slot + ':' + DEFAULT[slot]];
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
    x.fillStyle = p.shine;
    x.beginPath(); x.ellipse(-r * 0.3, -r * 0.38, r * 0.42, r * 0.24, -0.4, 0, TAU); x.fill();
    if (variant === 2 && skin.mark !== 'none') drawMark(x, skin.mark || 'heart', 0, r * 0.05, r * 0.32, p.mark, S);
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
      const tx = side * r * 0.8 + (st.ant || 0), ty = -r * (bean ? 1.7 : 1.6) - bob;
      x.beginPath();
      x.moveTo(side * r * 0.4, -r * 0.75);
      x.quadraticCurveTo(side * r * 0.45, -r * 1.35, tx, ty);
      x.stroke();
      if (skin.glow) {
        x.fillStyle = skin.glow;
        x.globalAlpha = 0.35 + 0.25 * Math.abs(Math.sin(t * 3 + side));
        x.beginPath(); x.arc(tx, ty, 7 * S, 0, TAU); x.fill();
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
  function drawButterfly(x, wingItem, S, t) {
    const w = wingItem.wing;
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
      x.fillStyle = w.bottom;
      x.beginPath(); x.ellipse(15 * S, 13 * S, 14 * S, 11 * S, 0.5, 0, TAU); x.fill();
      drawMark(x, w.mark, 22 * S, -15 * S, 6 * S, w.markColor, S);
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
  // kind: 0 vụn lá, 1 tim, 4 cánh hoa, 5 mây, 6 sao, 7 nốt nhạc, 8 pháo giấy.
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
    }
    x.globalAlpha = 1;
  }

  // ================= Hình xem trước (thẻ món đồ) =================
  // Vẽ món đồ vào giữa khung w×h; t để có chuyển động nhẹ.
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

  window.Skins = { ITEMS, RARITY, DEFAULT, BASE, get, palette, drawSegment, drawHead, drawCocoon, drawButterfly, eatBurst, stepParticle, drawParticle, drawPreview, heartPath };
})();
