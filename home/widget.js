// Ngày bên nhau · widget cho app Scriptable (iPhone)
// Dùng được ở: màn hình khoá (ô chữ nhật, ô tròn, dòng chữ trên đồng hồ) và màn hình chính (ô nhỏ).
// Cách cài xem ở trang: Trang chủ > chạm "Ngày thứ … bên nhau".

const START = new Date('2026-08-06T23:38:58+07:00');
const MILESTONES = [100, 200, 300, 365, 500, 600, 700, 730, 800, 900, 1000, 1095, 1200, 1461, 1500, 1826, 2000, 2500, 3000, 3650];
const YEARS = { 365: '1 năm', 730: '2 năm', 1095: '3 năm', 1461: '4 năm', 1826: '5 năm', 3650: '10 năm' };
const DAY = 864e5;

const now = new Date();
// Đếm đúng thời gian đã yêu: đủ bao nhiêu ngày, cộng giờ:phút:giây tính từ 23:38:58 gần nhất.
const days = Math.max(0, Math.floor((now - START) / DAY));
const dayStart = new Date(START.getTime() + days * DAY);
const next = MILESTONES.find((m) => m > days) || (Math.floor(days / 1000) + 1) * 1000;
const prev = [...MILESTONES].reverse().find((m) => m <= days) || 0;
const left = next - days;
const progress = Math.max(0, Math.min(1, (days - prev) / (next - prev)));
const label = (m) => YEARS[m] || m + ' ngày';
const note = days === prev && prev ? 'Hôm nay tròn ' + label(prev) + ' ♥' : 'Còn ' + left + ' ngày tới ' + label(next);
// Tim đỏ. Lưu ý: trên màn hình khoá iPhone tự tô cả ô một màu cho hợp hình nền,
// nên tim chỉ đỏ ở ô màn hình chính và chế độ chờ (StandBy).
const RED = new Color('#FF2D55');

// Giờ:phút:giây do chính iPhone đếm từng giây (kiểu đồng hồ bấm giờ), script không phải chạy lại
// nên không tốn pin. Script chỉ chạy lại mỗi ngày một lần, đúng 23:38:58, để tăng số ngày.
function clock(stack, size, weight) {
  const t = stack.addDate(dayStart);
  t.applyTimerStyle();
  t.font = weight === 'bold' ? Font.boldRoundedSystemFont(size) : Font.mediumRoundedSystemFont(size);
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.6;
  return t;
}

// Thanh tiến độ bo tròn, giống thanh pin trên màn hình khoá.
function bar(w, h, p, bg, fg) {
  const dc = new DrawContext();
  dc.size = new Size(w, h);
  dc.opaque = false;
  dc.respectScreenScale = true;
  let path = new Path();
  path.addRoundedRect(new Rect(0, 0, w, h), h / 2, h / 2);
  dc.addPath(path);
  dc.setFillColor(bg);
  dc.fillPath();
  if (p > 0) {
    path = new Path();
    path.addRoundedRect(new Rect(0, 0, Math.max(h, w * p), h), h / 2, h / 2);
    dc.addPath(path);
    dc.setFillColor(fg);
    dc.fillPath();
  }
  return dc.getImage();
}

// Vòng tròn tiến độ cho ô tròn trên màn hình khoá.
function ring(size, p) {
  const dc = new DrawContext();
  dc.size = new Size(size, size);
  dc.opaque = false;
  dc.respectScreenScale = true;
  const c = size / 2, r = size / 2 - 4, line = 5;
  const arc = (from, to) => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = from + (to - from) * (i / 64);
      pts.push(new Point(c + Math.cos(a) * r, c + Math.sin(a) * r));
    }
    const path = new Path();
    path.addLines(pts);
    return path;
  };
  dc.setLineWidth(line);
  dc.setStrokeColor(new Color('#FFFFFF', 0.3));
  dc.addPath(arc(0, Math.PI * 2));
  dc.strokePath();
  if (p > 0) {
    dc.setStrokeColor(Color.white());
    dc.addPath(arc(-Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p));
    dc.strokePath();
  }
  return dc.getImage();
}

function heart(stack, size, color) {
  const img = stack.addImage(SFSymbol.named('heart.fill').image);
  img.imageSize = new Size(size, size);
  if (color) img.tintColor = color;
  return img;
}

const family = config.widgetFamily || 'accessoryRectangular';
const w = new ListWidget();

if (family === 'accessoryRectangular') {
  // ♥ 77 ngày 10:21:05
  const top = w.addStack();
  top.centerAlignContent();
  heart(top, 14, RED);
  top.addSpacer(5);
  const d = top.addText(days + ' ngày');
  d.font = Font.boldRoundedSystemFont(18);
  d.lineLimit = 1;
  d.minimumScaleFactor = 0.7;
  top.addSpacer(6);
  clock(top, 18).leftAlignText();
  w.addSpacer(1);
  const s = w.addText(note);
  s.font = Font.mediumSystemFont(12);
  s.minimumScaleFactor = 0.7;
  s.lineLimit = 1;
  w.addSpacer(4);
  const b = w.addImage(bar(150, 6, progress, new Color('#FFFFFF', 0.3), Color.white()));
  b.imageSize = new Size(150, 6);
} else if (family === 'accessoryInline') {
  w.addText('♥ ' + days + ' ngày yêu nhau');
} else if (family === 'accessoryCircular') {
  w.backgroundImage = ring(64, progress);
  w.addSpacer();
  const d = w.addText(String(days));
  d.font = Font.boldRoundedSystemFont(days > 999 ? 15 : 19);
  d.centerAlignText();
  const s = w.addText('ngày');
  s.font = Font.mediumSystemFont(10);
  s.centerAlignText();
  w.addSpacer();
} else {
  // Màn hình chính: nền tím hồng như app
  const gr = new LinearGradient();
  gr.colors = [new Color('#B79CF0'), new Color('#FFB0C0')];
  gr.locations = [0, 1];
  gr.startPoint = new Point(0, 0);
  gr.endPoint = new Point(1, 1);
  w.backgroundGradient = gr;
  w.setPadding(14, 14, 14, 14);
  heart(w, 20, RED);
  w.addSpacer();
  const d = w.addText(String(days));
  d.font = Font.boldRoundedSystemFont(40);
  d.textColor = Color.white();
  d.minimumScaleFactor = 0.6;
  const row = w.addStack();
  row.centerAlignContent();
  const s = row.addText('ngày ');
  s.font = Font.semiboldSystemFont(14);
  s.textColor = Color.white();
  const c = clock(row, 14);
  c.textColor = Color.white();
  c.leftAlignText();
  w.addSpacer(6);
  const n = w.addText(note);
  n.font = Font.mediumSystemFont(11);
  n.textColor = new Color('#FFFFFF', 0.85);
  n.lineLimit = 1;
  n.minimumScaleFactor = 0.7;
  w.addSpacer(4);
  const b = w.addImage(bar(120, 5, progress, new Color('#FFFFFF', 0.35), Color.white()));
  b.imageSize = new Size(120, 5);
}

// Sang ngày mới (23:38:58) thì vẽ lại để tăng số ngày và đồng hồ quay về 0:00:00.
w.refreshAfterDate = new Date(dayStart.getTime() + DAY + 2000);

if (config.runsInWidget) Script.setWidget(w);
else if (typeof w.presentAccessoryRectangular === 'function') await w.presentAccessoryRectangular();
else await w.presentSmall();
Script.complete();
