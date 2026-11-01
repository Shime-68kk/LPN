// Dựng phim Băng số 1 từ bảng dựng (bang-dung.json trong thư mục ảnh, clip): ảnh chuyển đúng nhịp nhạc, zoom chậm,
// mờ chuyển sang nhau, phụ đề hiện có chỗ nghỉ. Ra video 1440 × 990 (đúng khung màn TV trong game), không bóp méo hình.
//
// Cách dùng:
//   node tools/bang1-dung/dung.mjs                         dựng theo ~/Videos/bang1-dung/bang-dung.json
//   node tools/bang1-dung/dung.mjs duong/dan/bang-dung.json
// Video ra nằm ở <thư mục>/_dung/<ra>.mp4.
//
// Bảng dựng:
//   {
//     "ra": "nhap-1",                       tên file ra
//     "nhac": { "tu": 0 },                  bắt đầu từ giây nào của bang1.mp3 (nhạc phim đã duyệt, không đổi)
//     "chuyen": 0.6,                        thời gian mờ chuyển giữa hai cảnh (giây)
//     "mo": { "h": "Hồi ức", "p": "Quang · Thủy · từ 06.08.2026", "phach": 3 },
//                                           thẻ mở đầu như phim cũ (chữ viết tay vàng, dòng tên), dài tới phách thứ `phach`
//     "canh": [
//       { "file": "1.JPG", "phach": 4, "cap": "Phụ đề (bỏ trống thì không có; \n để tự ngắt dòng)", "capTre": 0.3 },
//       { "file": "17.mov", "phach": 4, "tu": 0, "am": 1 },   clip: bắt đầu từ giây `tu` của clip; `am`: giữ tiếng clip (1 là
//                                         mức chuẩn đã lọc ồn và cân độ to, 1.2 to hơn chút; 0 hoặc bỏ trống: tắt tiếng);
//                                         `nhac`: độ to nhạc nền lúc clip có tiếng (mặc định 0.5)
//       { "file": "16.PNG", "den": 80.56 },   kết thúc đúng giây này của bài (vd. ngay trước điệp khúc) thay cho `phach`
//       ...
//     ]
//   }
// Mỗi cảnh dài `phach` phách của bài (1 phách ≈ 0,97 giây); cảnh đầu bắt đầu từ giây 0 và cắt ở phách đầu ô nhịp.
// Phụ đề hiện từ đầu cảnh (+ capTre giây) tới gần cuối cảnh, mờ vào mờ ra; cảnh không có phụ đề là chỗ nghỉ.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { W, H, fitOf, fitFilter, probeVideo, SDR } from './quet.mjs';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const SONG = path.join(ROOT, 'assets/sound/bang1.mp3');
const BPM = 61.998, BAR0 = 1.898, SPB = 60 / BPM; // giống story/bang1.js (đã duyệt)
const FPS = 30, ZOOM = 0.045;
const FONTS = path.join(os.homedir(), '.local/share/fonts/lpn');
const FONT = path.join(FONTS, 'BeVietnamPro-SemiBold.ttf');
// Phụ đề: giữa, phía dưới, cùng phông chữ chú thích trong phim. Các dòng cách đều theo chân chữ (dấu tiếng Việt không
// chạm dòng trên); chân dòng cuối ở 94,5% chiều cao, trong dải trống dưới hình đặt giữa
const CAP = { size: 44, lh: 64, base: 0.945, wrap: 34 };

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
const ff = (args) => run('ffmpeg', ['-v', 'error', '-y', ...args]);

// Ngắt hai dòng cân nhau (không để một chữ lẻ loi ở dòng dưới); ngắt được ở dấu chấm, dấu phẩy thì ưu tiên
function wrap(t, n) {
  if (t.includes('\n')) return t.split('\n'); // tự ngắt dòng trong bảng dựng
  if (t.length <= n) return [t];
  const w = t.split(/\s+/);
  let best = null;
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(a.length, b.length) - (/[.,:;!?]$/.test(a) ? 6 : 0);
    if (!best || m < best.m || (m === best.m && /[.,:;!?]$/.test(a))) best = { m, l: [a, b] };
  }
  return best.l;
}

// Thẻ mở đầu giống phim trong game (.title): nền tím tối toả từ giữa, "Hồi ức" chữ viết tay vàng có quầng sáng, dòng
// tên bên dưới; chữ lớn hiện dần trước, dòng tên hiện sau
function titleCard(mo, dur, tmp) {
  const bg = path.join(tmp, 'mo-nen.png'), hh = path.join(tmp, 'mo-chu.png'), pp = path.join(tmp, 'mo-ten.png'), seg = path.join(tmp, '00.mp4');
  // Tên file phông có "[ ]" (phông biến thiên): ImageMagick hiểu nhầm là chọn khung hình rồi lặng lẽ dùng phông mặc định,
  // nên chép ra tên đơn giản trước
  const dancing = path.join(tmp, 'dancing.ttf'), fraunces = path.join(tmp, 'fraunces.ttf');
  fs.copyFileSync(path.join(FONTS, 'DancingScript%5Bwght%5D.ttf'), dancing);
  // Fraunces biến thiên mặc định rất đậm (900): dùng bản tách sẵn độ đậm 500 như trong game
  // (fonttools varLib.instancer … wght=500 opsz=14 SOFT=0 WONK=1 -o ~/.local/share/fonts/lpn/Fraunces-Medium.ttf)
  fs.copyFileSync(path.join(FONTS, fs.existsSync(path.join(FONTS, 'Fraunces-Medium.ttf')) ? 'Fraunces-Medium.ttf' : 'Fraunces%5BSOFT,WONK,opsz,wght%5D.ttf'), fraunces);
  run('magick', ['-size', `${W}x${H}`, '-define', `gradient:radii=${Math.round(W * 0.8)},${Math.round(H * 0.8)}`, 'radial-gradient:#241830-#08070B', bg]);
  run('magick', ['-size', `${W}x${H}`, 'xc:none', '-font', dancing, '-pointsize', '150', '-gravity', 'center',
    '-fill', '#E9C77B', '-annotate', '+0-38', mo.h || 'Hồi ức', '(', '+clone', '-channel', 'A', '-blur', '0x18', '-evaluate', 'multiply', '0.6', '+channel', ')', '+swap', '-composite', hh]);
  run('magick', ['-size', `${W}x${H}`, 'xc:none', '-font', fraunces, '-pointsize', '42', '-kerning', '4.2',
    '-gravity', 'center', '-fill', 'rgba(246,238,223,0.8)', '-annotate', '+0+92', mo.p || '', pp]);
  ff(['-loop', '1', '-i', bg, '-loop', '1', '-i', hh, '-loop', '1', '-i', pp, '-filter_complex',
    `[1:v]format=rgba,fade=t=in:st=0.2:d=1.6:alpha=1[h];[2:v]format=rgba,fade=t=in:st=0.8:d=1.6:alpha=1[p];[0:v][h]overlay[x];[x][p]overlay,fps=${FPS},format=yuv420p`,
    '-t', dur.toFixed(3), '-c:v', 'libx264', '-crf', '12', '-preset', 'veryfast', seg]);
  console.log('  00 thẻ mở đầu · ' + dur.toFixed(2) + 's');
  return seg;
}

const VID = new Set(['.mp4', '.mov', '.m4v', '.3gp', '.webm', '.mkv']);
// Tiếng clip: cắt ù trầm (gió, xe) và rè cao, khử ồn nền nhẹ; rồi kéo về ngang độ to của nhạc ngay tại chỗ đặt clip
// (đo LUFS cả hai: đoạn nhạc nhẹ thì clip nhỏ theo, giữa điệp khúc thì clip to theo), chặn đỉnh để tiếng cười to không
// vỡ. Nhạc nền hạ còn DUCK trong lúc đó: giọng nổi rõ hơn nhạc, mà cả đoạn vẫn to ngang phần nhạc xung quanh.
const CLEAN = 'highpass=f=90,lowpass=f=11000,afftdn=nr=12:nf=-38:tn=1';
const DUCK = 0.5;
const lufs = (src, tu, len, af) => {
  const log = spawnSync('ffmpeg', ['-hide_banner', '-ss', String(tu), '-t', len.toFixed(3), '-i', src, '-vn', '-af', (af ? af + ',' : '') + 'ebur128=framelog=quiet', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '';
  const m = /I:\s+(-?[\d.]+) LUFS/.exec(log);
  return m ? Number(m[1]) : null;
};

// Clip: xoay đúng chiều (ffmpeg tự xoay theo thông tin của clip), HDR chuyển màu thường, về 30 hình/giây, đặt vào khung
// như ảnh (không méo); clip ngắn hơn cảnh thì giữ khung cuối (phần lớn nằm trong lúc mờ chuyển)
function clipSeg(c, id, src, a, b, tmp, from) {
  const p = probeVideo(src), fit = fitOf(p.w, p.h), len = b - a, seg = path.join(tmp, id + '.mp4');
  const vf = `${p.hdr || p.dv ? SDR + ',' : ''}fps=${FPS},${fitFilter(p.w, p.h, fit.mode)},tpad=stop_mode=clone:stop_duration=${len.toFixed(3)},trim=duration=${len.toFixed(3)},setpts=PTS-STARTPTS,format=yuv420p`;
  ff(['-ss', String(c.tu || 0), '-i', src, '-filter_complex', vf, '-an', '-c:v', 'libx264', '-crf', '12', '-preset', 'veryfast', seg]);
  const am = c.am && p.audio ? c.am : 0;
  let gain = 0, target = null;
  if (am) {
    const L = Math.min(p.dur - (c.tu || 0), len), voice = lufs(src, c.tu || 0, L, CLEAN), music = lufs(SONG, from + a, L);
    target = music === null ? -17 : music - 1;
    gain = voice === null ? 0 : Math.max(-12, Math.min(18, target - voice));
  }
  console.log('  ' + id + ' ' + c.file + ' · clip ' + Math.min(p.dur - (c.tu || 0), len).toFixed(2) + '/' + len.toFixed(2) + 's · ' + (fit.mode === 'day' ? 'đầy khung' : 'đặt giữa') + (am ? ' · có tiếng' : ' · tắt tiếng') + (c.cap ? ' · phụ đề' : ''));
  if (am) console.log('     tiếng clip: lọc ồn, chỉnh ' + (gain >= 0 ? '+' : '') + gain.toFixed(1) + ' dB về ' + target.toFixed(1) + ' LUFS (ngang nhạc tại chỗ)');
  return { ...c, a, b, seg, src, am, gain, clipLen: Math.min(p.dur - (c.tu || 0), len) };
}

function build(planPath) {
  const dir = path.dirname(planPath), plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const out = path.join(dir, '_dung'), tmp = path.join(out, 'tam');
  fs.mkdirSync(tmp, { recursive: true });
  const X = plan.chuyen ?? 0.6, from = (plan.nhac && plan.nhac.tu) || 0;
  // Mốc cắt: cảnh đầu (thẻ mở đầu nếu có) từ 0 tới hết số phách của nó tính từ phách đầu ô nhịp; các cảnh sau nối
  // tiếp theo phách
  let t = BAR0;
  const list = plan.mo ? [{ mo: plan.mo, phach: plan.mo.phach || 3 }, ...plan.canh] : plan.canh;
  const shots = list.map((c, i) => { const s = i ? t : 0; t = c.den ?? t + (c.phach || 4) * SPB; return { ...c, i, start: s, end: t }; });
  const total = t;
  console.log(shots.length + ' cảnh · ' + total.toFixed(1) + ' giây');

  // Từng cảnh: xoay đúng chiều, đặt vào khung (gấp đôi cỡ để zoom chậm không rung), zoom vào/ra xen kẽ
  const segs = shots.map((c) => {
    if (c.mo) return { ...c, a: 0, b: c.end + X / 2, seg: titleCard(c.mo, c.end + X / 2, tmp) };
    const id = String(c.i + 1).padStart(2, '0'), src = path.join(dir, c.file);
    const a = c.i ? c.start - X / 2 : 0, b = c.i < shots.length - 1 ? c.end + X / 2 : c.end;
    if (VID.has(path.extname(c.file).toLowerCase())) return clipSeg(c, id, src, a, b, tmp, from);
    const img = path.join(tmp, id + '.jpg');
    run('magick', [src + '[0]', '-auto-orient', '-strip', '-quality', '95', img]);
    let [w, h] = run('magick', ['identify', '-format', '%w %h', img]).trim().split(' ').map(Number);
    // Ảnh chụp màn hình có viền đen lớn (vd. chụp lúc đang xem video trên điện thoại): cắt bỏ viền đen, giữ phần hình
    const dark = Number(run('magick', [img, '-format', '%[fx:p{0,0}.intensity]', 'info:']).trim()) < 0.06;
    if (dark) {
      const [bw, bh, bx, by] = run('magick', [img, '-fuzz', '6%', '-format', '%@', 'info:']).trim().match(/\d+/g).map(Number);
      if (bw * bh < w * h * 0.7) { run('magick', [img, '-crop', `${bw}x${bh}+${bx}+${by}`, '+repage', img]); w = bw; h = bh; console.log('  ' + id + ' cắt viền đen → ' + w + '×' + h); }
    }
    const fit = fitOf(w, h);
    const still = path.join(tmp, id + '-khung.png');
    // Ảnh đầy khung có phụ đề: thêm dải tối mềm ở đáy cho chữ dễ đọc (ảnh đặt giữa đã có dải trống tối phía dưới)
    const shade = c.cap && fit.mode === 'day' ? `,format=rgba[f];color=c=black:s=${W * 2}x${Math.round(H * 0.6)},format=rgba,geq=r=0:g=0:b=0:a='170*pow(Y/H,1.6)'[g];[f][g]overlay=0:H-h` : '';
    ff(['-i', img, '-frames:v', '1', '-filter_complex', fitFilter(w, h, fit.mode, W * 2, H * 2) + shade, still]);
    const n = Math.round((b - a) * FPS), zin = c.i % 2 === 0;
    const z = zin ? `1+${ZOOM}*on/${n}` : `1+${ZOOM}-${ZOOM}*on/${n}`;
    const seg = path.join(tmp, id + '.mp4');
    ff(['-loop', '1', '-i', still, '-vf', `zoompan=z='${z}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=${n}:s=${W}x${H}:fps=${FPS},format=yuv420p`,
      '-frames:v', String(n), '-c:v', 'libx264', '-crf', '12', '-preset', 'veryfast', seg]);
    console.log('  ' + id + ' ' + c.file + ' · ' + (fit.mode === 'day' ? 'đầy khung' : 'đặt giữa') + ' · ' + (b - a).toFixed(2) + 's' + (c.cap ? ' · phụ đề' : ''));
    return { ...c, a, b, seg };
  });

  // Ghép: mờ chuyển ở mỗi mốc cắt; mờ từ đen lúc đầu, tắt dần về đen lúc cuối; phụ đề; nhạc
  const fl = [];
  let last = '[0:v]';
  for (let k = 1; k < segs.length; k++) {
    const o = `[x${k}]`;
    fl.push(`${last}[${k}:v]xfade=transition=fade:duration=${X}:offset=${(segs[k].start - X / 2).toFixed(3)}${o}`);
    last = o;
  }
  // Bản cho game (mặc định): video chứa nguyên bài nhạc tới hết; hết hình thì giữ khung cuối (thẻ "Ngày thứ … bên nhau"
  // trong game mờ chồng lên như phim ảnh cũ), nhạc chạy tiếp cho thẻ kết và danh đề. "xemRieng": true thì cắt gọn ở cuối
  // hình, tắt dần về đen (để xem riêng video).
  const songLen = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SONG]).trim()) - from;
  const full = !plan.xemRieng, outLen = full ? songLen : total;
  let v = `${last}fade=t=in:st=0:d=1.2` + (full ? `,tpad=stop_mode=clone:stop_duration=${(songLen - total + 0.5).toFixed(3)}` : `,fade=t=out:st=${(total - 1.6).toFixed(3)}:d=1.6`);
  let li = 0;
  for (const c of segs) {
    if (!c.cap) continue;
    const s0 = (c.i || plan.mo ? c.start : BAR0 - 0.6) + (c.capTre ?? 0.35), s1 = c.end - 0.25, fade = 0.5;
    const lines = wrap(c.cap, CAP.wrap);
    lines.forEach((ln, j) => {
      const tf = path.join(tmp, 'cap-' + li++ + '.txt');
      fs.writeFileSync(tf, ln);
      const y = Math.round(H * CAP.base - (lines.length - 1 - j) * CAP.lh);
      const alpha = `if(lt(t,${s0}),0,if(lt(t,${s0 + fade}),(t-${s0})/${fade},if(lt(t,${s1 - fade}),1,if(lt(t,${s1}),(${s1}-t)/${fade},0))))`;
      v += `,drawtext=fontfile='${FONT}':textfile='${tf}':fontsize=${CAP.size}:fontcolor=0xFFFDF6:x=(w-text_w)/2:y=${y}:y_align=baseline` +
        `:shadowcolor=black@0.7:shadowx=0:shadowy=2:borderw=1:bordercolor=black@0.25:alpha='${alpha}':enable='between(t,${s0},${s1})'`;
    });
  }
  fl.push(v + ',format=yuv420p[v]');
  // Nhạc nền; clip có tiếng thì tiếng clip vào đúng chỗ, nhạc hạ xuống mềm (0,7 giây) trong lúc đó rồi lên lại
  const ai = segs.length, sounds = segs.filter((c) => c.am);
  const duck = sounds.map((c) => { const k = c.nhac ?? DUCK, s0 = c.a + 0.1, s1 = c.a + c.clipLen - 0.1; return `(1-${(1 - k).toFixed(2)}*min(max((t-${(s0 - 0.7).toFixed(3)})/0.7,0),1)*min(max((${(s1 + 0.7).toFixed(3)}-t)/0.7,0),1))`; });
  fl.push(`[${ai}:a]atrim=0:${outLen.toFixed(3)},asetpts=PTS-STARTPTS${duck.length ? `,volume='${duck.join('*')}':eval=frame` : ''}${full ? '' : `,afade=t=out:st=${(total - 2.2).toFixed(3)}:d=2.2`}[m]`);
  sounds.forEach((c, j) => {
    const L = c.clipLen;
    fl.push(`[${ai + 1 + j}:a]aresample=48000,${CLEAN},volume=${c.gain.toFixed(2)}dB,volume=${c.am},alimiter=limit=0.89:level=false,afade=t=in:d=0.25,afade=t=out:st=${Math.max(0, L - 0.4).toFixed(3)}:d=0.4,adelay=${Math.round(c.a * 1000)}:all=1[s${j}]`);
  });
  fl.push(sounds.length ? `[m]${sounds.map((_, j) => `[s${j}]`).join('')}amix=inputs=${sounds.length + 1}:normalize=0:duration=first[a]` : '[m]anull[a]');
  const script = path.join(tmp, 'ghep.txt');
  fs.writeFileSync(script, fl.join(';\n'));
  const dst = path.join(out, (plan.ra || 'nhap') + '.mp4');
  const args = [];
  for (const s of segs) args.push('-i', s.seg);
  args.push('-ss', String(from), '-i', SONG);
  for (const c of sounds) args.push('-ss', String(c.tu || 0), '-t', c.clipLen.toFixed(3), '-i', c.src);
  args.push('-/filter_complex', script, '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-crf', '19', '-preset', 'slow', '-profile:v', 'high', '-r', String(FPS), '-g', String(FPS * 2),
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', outLen.toFixed(3), dst);
  ff(args);
  const mb = fs.statSync(dst).size / 1e6;
  console.log('Xong: ' + dst + ' (' + mb.toFixed(1) + ' MB · hình ' + total.toFixed(2) + 's' + (full ? ', nhạc tới hết bài ' + outLen.toFixed(1) + 's' : '') + ')');
  return dst;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const plan = path.resolve(process.argv[2] || path.join(os.homedir(), 'Videos/bang1-dung/bang-dung.json'));
  if (!fs.existsSync(plan)) { console.error('Chưa có bảng dựng ' + plan); process.exit(1); }
  build(plan);
}
