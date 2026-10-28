// Cắt ghép nhạc trailer "Băng số 1" từ hai bài gốc của Hans Zimmer (Interstellar, 2014) thành assets/sound/trailer.mp3.
// Cách dùng: node tools/trailer-music/build.mjs   (bài gốc để ở tools/trailer-music/src/, không đưa lên GitHub)
//
// Mốc đo bằng analyze.mjs:
// - Mountains: tiếng tích‑tắc đều 1,2535 giây, tiếng đầu ở 0:00.37. Organ vào ở 0:10.4. Bùng nổ đúng tiếng tích thứ 97 (2:01.96).
//   Đoạn kết tắt dần tự nhiên từ tiếng tích thứ 163 (3:24.69) đến 3:39.
// - No Time for Caution: 60 BPM, phách rơi ở giây ,67. Dồn từ 2:23.67, vỡ oà ở 2:35.67, dội lại lần hai ở 2:38.66, lắng ở 2:40.
// Cột "at" là giây trong trailer. runTrailer trong story/hoi-uc-room.js dùng đúng các mốc này để hình ảnh rơi đúng phách.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const SRC = { M: path.join(dir, 'src/Mountains.mp3'), N: path.join(dir, 'src/No Time For Caution.mp3') };
const OUT = path.join(dir, '../../assets/sound/trailer.mp3');

const CUES = [
  // Mở màn: đồng hồ tích‑tắc theo nhạc, điểm 20:00 ở tiếng tích 4.13
  { src: 'M', from: 0.00, to: 4.75, at: 0.00, db: 6, fin: 0.6, fout: 0.2 },
  // Tua băng ngược: chính đoạn vừa nghe, chạy ngược và nhanh gấp 2,11 lần (rít cao lên), kim đồng hồ quay về 23:38
  { src: 'M', from: 0.00, to: 4.75, at: 4.75, db: 2, fin: 0.3, fout: 0.08, rev: true, speed: 2.11 },
  // Băng chạy lại từ tiếng tích 2.88 (rơi ở giây 7.89): từ đây mọi mốc lùi 5.01 giây so với Mountains.
  // Organ vào đúng lúc đèn bật (15.41), năm cuộn băng rơi theo nhịp, tới "Chỉ một cuộn là thật."
  { src: 'M', from: 2.70, to: 19.17, at: 7.71, db: 6, fin: 0.15, fout: 0.03 },
  // Ba căn phòng: organ dồn dập của No Time for Caution, "Một bí mật." rơi đúng cú vỡ oà 2:35.67 (giây 36.18),
  // chạy hết đợt sóng thứ hai (dội ở 39.17) rồi mới lắng
  { src: 'N', from: 143.67, to: 160.17, at: 24.18, db: 0, fin: 0.02, fout: 0.45 },
  // Rơi tụt về tiếng tích‑tắc lặng: TV nhiễu và lời hẹn, nhạc phồng nhẹ; cảnh báo quá tải (49.44), đếm 3, 2, 1 trên ba
  // tiếng tích 50.69, 51.92, 53.18; cắt đúng lúc TV nổ ở tiếng tích kế tiếp (54.43)
  { src: 'M', from: 41.63, to: 55.38, at: 40.68, db: 8, fin: 0.05, fout: 0.12 },
  // Im lặng. Biển BĂNG SỐ 1 hiện (57.53) trên nền nhạc đang dồn: neon nháy, hỏng tạm thời, rồi sáng trọn vẹn đúng tiếng
  // bùng 2:01.96 (giây 62.0).
  // Nhỏ hơn bản gốc 5 dB: đoạn kết không làm giật mình người đeo tai nghe.
  { src: 'M', from: 117.49, to: 128.23, at: 57.53, db: -5, fin: 0.5, fout: 1.2 },
  // Ngân dài: nối sang đoạn kết của Mountains, tắt dần tự nhiên
  { src: 'M', from: 203.49, to: 219.00, at: 67.06, db: -5, fin: 1.2, fout: 0.5 },
];

const args = ['-v', 'error', '-y'];
CUES.forEach((c) => args.push('-i', SRC[c.src]));
const parts = CUES.map((c, i) => {
  const len = c.to - c.from, ms = Math.round(c.at * 1000);
  // rev: chạy ngược; speed: tua nhanh (cao giọng lên như băng bị tua)
  const fx = (c.rev ? 'areverse,' : '') + (c.speed ? `asetrate=${Math.round(44100 * c.speed)},aresample=44100,` : '');
  const out = c.speed ? len / c.speed : len;
  return `[${i}:a]atrim=${c.from}:${c.to},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo,${fx}volume=${c.db}dB,`
    + `afade=t=in:d=${c.fin},afade=t=out:st=${(out - c.fout).toFixed(3)}:d=${c.fout},adelay=${ms}|${ms}[c${i}]`;
});
const graph = parts.join(';') + ';' + CUES.map((_, i) => `[c${i}]`).join('') + `amix=inputs=${CUES.length}:normalize=0:duration=longest,alimiter=limit=0.89:level=false[out]`;
args.push('-filter_complex', graph, '-map', '[out]', '-ac', '2', '-ar', '44100', '-b:a', '192k', OUT);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT], { encoding: 'utf8' }).trim();
console.log('Đã tạo', path.relative(process.cwd(), OUT), '·', (+dur).toFixed(2) + 's');
