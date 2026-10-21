// Ngày bên nhau · widget cho app Scriptable (iPhone)
// Dùng được ở: màn hình khoá (ô chữ nhật, ô tròn, dòng chữ trên đồng hồ) và màn hình chính (ô nhỏ).
// Cách cài xem ở trang: Trang chủ > chạm "Ngày thứ … bên nhau".

const START = new Date('2026-08-06T23:38:58+07:00');
const MILESTONES = [100, 200, 300, 365, 500, 600, 700, 730, 800, 900, 1000, 1095, 1200, 1461, 1500, 1826, 2000, 2500, 3000, 3650];
const YEARS = { 365: '1 năm', 730: '2 năm', 1095: '3 năm', 1461: '4 năm', 1826: '5 năm', 3650: '10 năm' };

const now = new Date();
// Cùng cách đếm với app: ngày đầu tiên là ngày 1, sang ngày mới đúng giờ 23:38:58.
const days = Math.max(1, Math.floor((now - START) / 864e5) + 1);
const next = MILESTONES.find((m) => m > days) || (Math.floor(days / 1000) + 1) * 1000;
const prev = [...MILESTONES].reverse().find((m) => m <= days) || 0;
const left = next - days;
const progress = Math.max(0, Math.min(1, (days - prev) / (next - prev)));
const label = (m) => YEARS[m] || String(m);
// Tim đỏ. Lưu ý: trên màn hình khoá iPhone tự tô cả ô một màu cho hợp hình nền,
// nên tim chỉ đỏ ở ô màn hình chính và chế độ chờ (StandBy).
const RED = new Color('#FF2D55');

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

function heart(size, color) {
  const img = w.addImage(SFSymbol.named('heart.fill').image);
  img.imageSize = new Size(size, size);
  if (color) img.tintColor = color;
  return img;
}

const family = config.widgetFamily || 'accessoryRectangular';
const w = new ListWidget();

if (family === 'accessoryRectangular') {
  const top = w.addStack();
  top.centerAlignContent();
  const h = top.addImage(SFSymbol.named('heart.fill').image);
  h.imageSize = new Size(15, 15);
  h.tintColor = RED;
  top.addSpacer(5);
  const d = top.addText(days + ' ngày');
  d.font = Font.boldRoundedSystemFont(19);
  d.minimumScaleFactor = 0.7;
  w.addSpacer(1);
  const s = w.addText('Còn ' + left + ' ngày tới ' + label(next));
  s.font = Font.mediumSystemFont(12);
  s.minimumScaleFactor = 0.7;
  s.lineLimit = 1;
  w.addSpacer(4);
  const b = w.addImage(bar(150, 6, progress, new Color('#FFFFFF', 0.3), Color.white()));
  b.imageSize = new Size(150, 6);
} else if (family === 'accessoryInline') {
  w.addText('♥ Ngày thứ ' + days + ' bên nhau');
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
  heart(20, RED);
  w.addSpacer();
  const d = w.addText(String(days));
  d.font = Font.boldRoundedSystemFont(44);
  d.textColor = Color.white();
  d.minimumScaleFactor = 0.6;
  const s = w.addText('ngày bên nhau');
  s.font = Font.semiboldSystemFont(14);
  s.textColor = Color.white();
  w.addSpacer(6);
  const n = w.addText('Còn ' + left + ' ngày tới ' + label(next));
  n.font = Font.mediumSystemFont(11);
  n.textColor = new Color('#FFFFFF', 0.85);
  n.lineLimit = 1;
  n.minimumScaleFactor = 0.7;
  w.addSpacer(4);
  const b = w.addImage(bar(120, 5, progress, new Color('#FFFFFF', 0.35), Color.white()));
  b.imageSize = new Size(120, 5);
}

// Đổi số đúng lúc sang ngày mới.
w.refreshAfterDate = new Date(START.getTime() + days * 864e5 + 5000);

if (config.runsInWidget) Script.setWidget(w);
else if (typeof w.presentAccessoryRectangular === 'function') await w.presentAccessoryRectangular();
else await w.presentSmall();
Script.complete();
