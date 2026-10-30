# Lấy chữ ký anh Quang ký bằng bút XP-Pen trên MathBoard Studio (~/pen-app), cắt sát, xuất SVG nền trong suốt
# cho lá thư trong Băng số 1 (assets/img/chu-ky.svg).
#
# Cách dùng (chạy bằng Python của MathBoard, vì cần chính code vẽ nét của app):
#   ~/pen-app/.venv/bin/python tools/chu-ky.py                 đọc bản tự lưu (~/.cache/mathboard/autosave.mbk, 45 giây/lần)
#   ~/pen-app/.venv/bin/python tools/chu-ky.py vo.mbk --trang 2 đọc file đã lưu, trang 2 (mặc định: trang đang mở)
#   thêm --mau '#8C3B3B' để đổi màu mực, --ra duong/dan.svg để đổi chỗ lưu, --png để xuất thêm ảnh PNG xem thử.
#
# Nét được dựng lại y như trên bảng: StrokeItem làm mượt điểm, ink_outline dựng đường bao có độ dày theo lực nhấn.
# Chỉ lấy nét bút (bỏ bút dạ quang, hình học, chữ gõ), mỗi nét là một <path>, màu mực đồng nhất.
import argparse
import os
import sys
from pathlib import Path

PEN_APP = Path.home() / 'pen-app'
sys.path.insert(0, str(PEN_APP))
os.environ.setdefault('QT_QPA_PLATFORM', 'offscreen')

from PyQt6.QtGui import QColor, QGuiApplication, QImage, QPainter, QPainterPath  # noqa: E402
from PyQt6.QtCore import QRectF, Qt  # noqa: E402

from core.ink_outline import outline_path  # noqa: E402
from core.project_manager import ProjectManager  # noqa: E402
from core.stroke_item import StrokeItem  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument('file', nargs='?', default=str(Path.home() / '.cache/mathboard/autosave.mbk'))
ap.add_argument('--trang', type=int, help='số thứ tự trang (1, 2, …); mặc định trang đang mở lúc lưu')
ap.add_argument('--mau', default='#8C3B3B', help='màu mực trong thư')
ap.add_argument('--ra', default=str(ROOT / 'assets/img/chu-ky.svg'))
ap.add_argument('--png', action='store_true', help='xuất thêm PNG cạnh file SVG để xem thử')
a = ap.parse_args()

app = QGuiApplication(sys.argv)
if not Path(a.file).exists():
    sys.exit('Chưa có file ' + a.file + ' (ký xong đợi khoảng 1 phút cho MathBoard tự lưu, hoặc bấm Lưu).')
doc = ProjectManager.read_document(a.file)
pages = doc.get('pages') or []
if not pages:
    sys.exit('File không có trang nào: ' + a.file)
idx = (a.trang - 1) if a.trang else int(doc.get('current_index', len(pages) - 1))
idx = max(0, min(idx, len(pages) - 1))
page = pages[idx]

paths = []
for it in page.get('items', []):
    if it.get('type') != 'stroke' or it.get('is_highlighter') or it.get('shape_type') or not it.get('points'):
        continue
    s = StrokeItem(QColor(it.get('color', '#000')), float(it.get('base_width', 2.5)))
    s.restore_saved(it['points'])
    p = outline_path(s.outline_points())
    p.translate(*it.get('pos', [0, 0]))
    paths.append(p)
if not paths:
    sys.exit('Trang %d (%s) chưa có nét bút nào.' % (idx + 1, page.get('title', '')))

box = QRectF(paths[0].boundingRect())
for p in paths[1:]:
    box = box.united(p.boundingRect())
pad = 6.0
box.adjust(-pad, -pad, pad, pad)


def svg_d(p: QPainterPath) -> str:
    out, i, n = [], 0, p.elementCount()
    while i < n:
        e = p.elementAt(i)
        x, y = e.x - box.left(), e.y - box.top()
        if e.isMoveTo():
            out.append('M%.2f %.2f' % (x, y))
        elif e.isLineTo():
            out.append('L%.2f %.2f' % (x, y))
        else:  # curveTo: 3 điểm liền nhau (2 điểm điều khiển + điểm cuối)
            c2, c3 = p.elementAt(i + 1), p.elementAt(i + 2)
            out.append('C%.2f %.2f %.2f %.2f %.2f %.2f' % (x, y, c2.x - box.left(), c2.y - box.top(), c3.x - box.left(), c3.y - box.top()))
            i += 2
        i += 1
    return ''.join(out) + 'Z'


w, h = box.width(), box.height()
svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.1f %.1f" width="%.0f" height="%.0f">'
       '<g fill="%s" fill-rule="nonzero">%s</g></svg>\n') % (w, h, w, h, a.mau, ''.join('<path d="%s"/>' % svg_d(p) for p in paths))
out = Path(a.ra)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(svg, encoding='utf-8')
print('Trang %d · %d nét · %.0f×%.0f px → %s (%.1f KB)' % (idx + 1, len(paths), w, h, out, len(svg) / 1024))

if a.png:
    k = min(4.0, 2400 / max(w, h))  # nét mịn mà file không quá nặng
    img = QImage(int(w * k), int(h * k), QImage.Format.Format_ARGB32_Premultiplied)
    img.fill(Qt.GlobalColor.transparent)
    pa = QPainter(img)
    pa.setRenderHint(QPainter.RenderHint.Antialiasing)
    pa.scale(k, k)
    pa.translate(-box.left(), -box.top())
    pa.setPen(Qt.PenStyle.NoPen)
    pa.setBrush(QColor(a.mau))
    for p in paths:
        p.setFillRule(Qt.FillRule.WindingFill)
        pa.drawPath(p)
    pa.end()
    png = out.with_suffix('.png')
    img.save(str(png))
    print('Ảnh xem thử:', png)
