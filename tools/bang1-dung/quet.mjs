// Quét thư mục ảnh, clip cho phim Băng số 1 trước khi dựng: xem mỗi cảnh sẽ hiện trong TV thế nào, báo chỗ cần để ý.
//
// Cách dùng:
//   node tools/bang1-dung/quet.mjs                       quét ~/Videos/bang1-dung
//   node tools/bang1-dung/quet.mjs duong/dan/thu-muc     quét thư mục khác
// Kết quả nằm trong <thư mục>/_quet/: bao-cao.html (mở bằng trình duyệt), danh-sach.json (cho bước dựng phim),
// xem-truoc/ (khung hình dựng thử đúng như trong TV), goc/ (ảnh đã xoay đúng chiều).
//
// Màn TV trong game có tỉ lệ 1,454 : 1 (đo trong game ở mọi cỡ màn hình), nên phim dựng 1440 × 990.
// Không bao giờ bóp méo hình. Mỗi cảnh chọn một trong hai cách:
//   - "đầy khung": hình gần đúng tỉ lệ TV (xén tối đa 10% ở mép) thì phủ kín màn.
//   - "đặt giữa": hình dọc, vuông hay quá rộng thì giữ nguyên vẹn, đặt giữa màn như một tấm ảnh, phía sau là chính
//     hình đó phóng to, làm mờ, tối đi (không viền đen, không méo).
// Ảnh điện thoại xoay đúng chiều theo EXIF; clip quay dọc xoay theo thông tin xoay của clip.
// Clip HDR của iPhone (HLG, Dolby Vision) chuyển màu về thường, không bị bạc.
// Cần ffmpeg, ffprobe, ImageMagick (magick).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const W = 1440, H = 990, T = W / H;
export const MAX_CROP = 0.1; // xén quá 10% thì chuyển sang đặt giữa
const IMG = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);
const VID = new Set(['.mp4', '.mov', '.m4v', '.3gp', '.webm', '.mkv']);

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });

// Cách đặt hình vào khung TV và bộ lọc ffmpeg tương ứng (dùng chung cho xem trước và bước dựng phim)
export function fitOf(w, h) {
  const r = w / h, crop = r > T ? 1 - T / r : 1 - r / T;
  return { mode: crop <= MAX_CROP ? 'day' : 'giua', crop };
}
// ow, oh: cỡ khung ra (mặc định 1440 × 990; bước dựng phim làm gấp đôi để zoom chậm không rung)
export function fitFilter(w, h, mode, ow = W, oh = H) {
  const cover = `scale=${ow}:${oh}:force_original_aspect_ratio=increase,crop=${ow}:${oh}`;
  if (mode === 'day') return `${cover},setsar=1`;
  // Đặt giữa: hình vừa trong khung chừa lề, bóng mềm phía dưới, nền là chính hình đó mờ, tối. Hình nhích lên trên một
  // chút (giữa hình ở 43% chiều cao), chừa dải dưới cho phụ đề: chữ không đè lên hình
  const r = w / h, k = ow / W, bw = Math.round(ow * 0.9), bh = Math.round(oh * 0.78);
  let fw = bw, fh = Math.round(bw / r);
  if (fh > bh) { fh = bh; fw = Math.round(bh * r); }
  fw -= fw % 2; fh -= fh % 2;
  const x = (ow - fw) / 2, y = Math.round(oh * 0.43 - fh / 2);
  return `split[a][b];[a]${cover},gblur=sigma=${Math.round(34 * k)},eq=brightness=-0.16:saturation=0.8,` +
    `drawbox=x=${x + Math.round(4 * k)}:y=${y + Math.round(12 * k)}:w=${fw}:h=${fh}:color=black@0.55:t=fill,gblur=sigma=${Math.round(16 * k)}[bg];` +
    `[b]scale=${fw}:${fh},setsar=1[fg];[bg][fg]overlay=${x}:${y},setsar=1`;
}
// Clip HDR (iPhone): chuyển về màu thường trước khi đặt vào khung
export const SDR = 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p';
const isHdr = (tr) => tr === 'arib-std-b67' || tr === 'smpte2084';

export function probeVideo(f) {
  const j = JSON.parse(run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', f]));
  const v = j.streams.find((s) => s.codec_type === 'video');
  if (!v) throw new Error('không có hình');
  let rot = 0;
  for (const sd of v.side_data_list || []) if (sd.rotation !== undefined) rot = Number(sd.rotation);
  if (!rot && v.tags && v.tags.rotate) rot = Number(v.tags.rotate);
  const turned = Math.abs(rot) % 180 === 90;
  const [n, d] = (v.avg_frame_rate || '0/1').split('/').map(Number);
  return {
    w: turned ? v.height : v.width, h: turned ? v.width : v.height, rot,
    dur: Number(j.format.duration || v.duration || 0), fps: d ? n / d : 0,
    codec: v.codec_name, hdr: isHdr(v.color_transfer), dv: (v.side_data_list || []).some((s) => /DOVI/i.test(s.side_data_type || '')),
    audio: j.streams.some((s) => s.codec_type === 'audio'),
    mbps: j.format.bit_rate ? Number(j.format.bit_rate) / 1e6 : 0,
  };
}

function scan(dir) {
  const out = path.join(dir, '_quet'), goc = path.join(out, 'goc'), prev = path.join(out, 'xem-truoc');
  for (const d of [out, goc, prev]) fs.mkdirSync(d, { recursive: true });
  const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.') && !f.startsWith('_')).filter((f) => IMG.has(path.extname(f).toLowerCase()) || VID.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
  const list = [];
  files.forEach((name, i) => {
    const src = path.join(dir, name), ext = path.extname(name).toLowerCase(), id = String(i + 1).padStart(2, '0');
    const it = { id, name, kind: IMG.has(ext) ? 'anh' : 'clip', warn: [] };
    process.stdout.write(id + ' ' + name + ' … ');
    try {
      let frameSrc = src, ss = null, pre = '';
      if (it.kind === 'anh') {
        // Xoay đúng chiều theo EXIF rồi lưu một bản gốc (bước dựng dùng bản này)
        const o = path.join(goc, id + '.jpg');
        run('magick', [src, '-auto-orient', '-strip', '-quality', '94', o]);
        const [w, h] = run('magick', ['identify', '-format', '%w %h', o]).trim().split(' ').map(Number);
        const model = (() => { try { return run('magick', ['identify', '-format', '%[EXIF:Model]', src]).trim(); } catch (e) { return ''; } })();
        Object.assign(it, { w, h, file: path.relative(dir, o) });
        if (!model && [960, 1280, 2048, 2560].includes(Math.max(w, h))) it.warn.push('Có vẻ ảnh đã qua Messenger/Zalo (bị nén). Có bản gốc thì thay vào sẽ nét hơn.');
        frameSrc = o;
      } else {
        const p = probeVideo(src);
        Object.assign(it, p, { file: name });
        ss = Math.min(Math.max(0, p.dur * 0.4), Math.max(0, p.dur - 0.2));
        if (p.hdr || p.dv) { it.warn.push('Clip HDR của iPhone: khi dựng sẽ chuyển màu về thường để không bị bạc màu.'); pre = SDR + ','; }
        if (p.fps > 31) it.warn.push('Quay ' + Math.round(p.fps) + ' hình/giây: khi dựng chuyển về 30 cho nhẹ máy (vẫn mượt).');
        if (p.dur > 20) it.warn.push('Dài ' + Math.round(p.dur) + ' giây: nhớ ghi đoạn dùng (từ giây nào tới giây nào).');
        if (p.audio) it.note = 'Có tiếng: nếu có câu thoại muốn nghe rõ thì ghi chú lại.';
      }
      const short = Math.min(it.w, it.h);
      const fit = fitOf(it.w, it.h);
      Object.assign(it, fit);
      // Hình nhỏ hơn chỗ nó chiếm trên màn TV thì sẽ mờ
      const need = fit.mode === 'day' ? H : Math.round(H * 0.78);
      const used = it.w / it.h > T ? (fit.mode === 'day' ? it.h : it.w / (W * 0.9) * H) : it.h;
      if (used < need * 0.7 || short < 600) it.warn.push('Độ phân giải thấp (' + it.w + '×' + it.h + '): lên TV có thể hơi mờ.');
      const pv = path.join(prev, id + '.jpg');
      const args = ['-v', 'error', '-y'];
      if (ss !== null) args.push('-ss', ss.toFixed(2));
      args.push('-i', frameSrc, '-frames:v', '1', '-filter_complex', pre + fitFilter(it.w, it.h, fit.mode), '-q:v', '3', pv);
      run('ffmpeg', args);
      run('ffmpeg', ['-v', 'error', '-y', ...(ss !== null ? ['-ss', ss.toFixed(2)] : []), '-i', frameSrc, '-frames:v', '1', '-vf', (pre ? SDR + ',' : '') + 'scale=360:-2', '-q:v', '4', path.join(prev, id + '-goc.jpg')]);
      it.preview = 'xem-truoc/' + id + '.jpg';
      it.thumb = 'xem-truoc/' + id + '-goc.jpg';
      console.log(fit.mode === 'day' ? 'đầy khung' : 'đặt giữa', it.warn.length ? '(' + it.warn.length + ' lưu ý)' : '');
    } catch (e) {
      it.error = String(e.message || e).split('\n')[0];
      console.log('lỗi: ' + it.error);
    }
    list.push(it);
  });
  fs.writeFileSync(path.join(out, 'danh-sach.json'), JSON.stringify({ w: W, h: H, items: list }, null, 2));
  fs.writeFileSync(path.join(out, 'bao-cao.html'), report(dir, list));
  return out;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function report(dir, list) {
  const clips = list.filter((x) => x.kind === 'clip' && !x.error);
  const sec = clips.reduce((a, x) => a + (x.dur || 0), 0);
  const cards = list.map((x) => {
    const tags = x.error ? '<b class="bad">Không đọc được: ' + esc(x.error) + '</b>' : [
      '<span>' + (x.kind === 'anh' ? 'Ảnh' : 'Clip ' + x.dur.toFixed(1) + 's' + (x.audio ? ' · có tiếng' : ' · không tiếng')) + '</span>',
      '<span>' + x.w + '×' + x.h + (x.rot ? ' · xoay ' + x.rot + '°' : '') + '</span>',
      '<span class="' + x.mode + '">' + (x.mode === 'day' ? 'Đầy khung' + (x.crop > 0.005 ? ' · xén ' + Math.round(x.crop * 100) + '% mép' : '') : 'Đặt giữa · giữ nguyên, không xén') + '</span>',
    ].join('');
    const warn = (x.warn || []).map((w) => '<li>' + esc(w) + '</li>').join('') + (x.note ? '<li class="ok">' + esc(x.note) + '</li>' : '');
    return '<article><div class="tv"><div class="scr">' + (x.preview ? '<img src="' + x.preview + '" alt="" loading="lazy">' : '') + '<i></i></div><div class="knobs"><b></b><b></b><s></s></div></div>' +
      '<div class="meta"><h2><em>' + x.id + '</em>' + esc(x.name) + '</h2>' + (x.thumb ? '<img class="orig" src="' + x.thumb + '" alt="Bản gốc">' : '') + '<p class="tags">' + tags + '</p>' + (warn ? '<ul>' + warn + '</ul>' : '') + '</div></article>';
  }).join('\n');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Quét cảnh Băng số 1</title>
<style>
:root { color-scheme: dark; }
body { margin: 0; padding: 20px 16px 40px; background: #120E0B; color: #EFE4D2; font: 14px/1.5 system-ui, sans-serif; }
header { max-width: 1100px; margin: 0 auto 18px; }
h1 { margin: 0 0 4px; font-size: 22px; }
header p { margin: 0; color: #B8A88F; }
main { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 500px), 1fr)); gap: 18px; max-width: 1100px; margin: 0 auto; }
article { display: grid; grid-template-columns: 1fr; gap: 10px; padding: 14px; border-radius: 14px; background: #1D1712; }
/* TV cổ giống trong game: vỏ gỗ, màn bo góc 9% / 12% đúng tỉ lệ 1440 × 990 */
.tv { display: grid; grid-template-columns: 1fr 13%; gap: 3%; padding: 4% 3.5% 4% 4%; border-radius: 18px; background: linear-gradient(180deg, #7A5133, #5A3920 55%, #46301C); box-shadow: inset 0 2px 0 rgba(255, 220, 170, .18), inset 0 -6px 14px rgba(0, 0, 0, .45); }
.scr { position: relative; aspect-ratio: ${W} / ${H}; overflow: hidden; border-radius: 9% / 12%; background: #070908; box-shadow: 0 0 0 5px #24180F, 0 0 0 7px #120B06; }
.scr img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.scr i { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(0, 0, 0, .1) 0 1px, transparent 1px 4px), radial-gradient(130% 110% at 50% 50%, transparent 66%, rgba(0, 0, 0, .38)); }
.knobs { display: flex; flex-direction: column; align-items: center; gap: 14%; padding-top: 10%; }
.knobs b { width: 70%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #D9C49A, #8A7448); }
.knobs s { width: 80%; height: 30%; border-radius: 4px; background: repeating-linear-gradient(0deg, #2B1C12 0 2px, #4A3420 2px 4px); }
.meta h2 { margin: 0 0 6px; font-size: 15px; word-break: break-all; }
.meta h2 em { margin-right: 8px; padding: 1px 7px; border-radius: 6px; background: #3A2C20; font-style: normal; }
.orig { float: right; max-width: 90px; max-height: 90px; margin: 0 0 6px 10px; border-radius: 4px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; }
.tags span { padding: 2px 8px; border-radius: 99px; background: #2D241C; font-size: 12.5px; }
.tags .day { background: #24402A; } .tags .giua { background: #2A3550; }
ul { margin: 8px 0 0; padding-left: 18px; color: #F2C48D; font-size: 13px; } li.ok { color: #A9D6A0; }
.bad { color: #FF9C8A; }
</style></head><body>
<header><h1>Quét cảnh · Băng số 1</h1><p>${list.length} mục · ${list.filter((x) => x.kind === 'anh').length} ảnh · ${clips.length} clip (${Math.round(sec)} giây). Mỗi khung là cảnh đó trên màn TV trong game (1440 × 990), không bóp méo. Ảnh nhỏ bên phải là bản gốc để so.</p></header>
<main>
${cards}
</main></body></html>
`;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const dir = path.resolve(process.argv[2] || path.join(os.homedir(), 'Videos/bang1-dung'));
  if (!fs.existsSync(dir)) { console.error('Chưa có thư mục ' + dir + '. Tạo thư mục, chép ảnh và clip vào rồi chạy lại.'); process.exit(1); }
  const out = scan(dir);
  console.log('\nXong. Mở ' + path.join(out, 'bao-cao.html'));
}
