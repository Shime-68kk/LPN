// Nhạc cho cuộn băng thật "Băng số 1": cắt bài "Giữ Mãi Yêu Thương Gần Kề" (Hayho) còn khoảng 2:56 thành
// assets/sound/bang1.mp3. Cách dùng: node tools/trailer-music/bang1.mjs   (bài gốc để ở tools/trailer-music/src/)
//
// Mốc đo bằng analyze.mjs trên bài gốc (62 BPM, giọng Si trưởng; đầu ô nhịp ở 1.898 + n × 3.8711 giây):
// - 0:00 dạo nhạc: piano, 0:09.6 bass vào, 0:16.4 cả ban nhạc, 0:32.9 ngắt; 0:35.8 lời 1 "Cứ như đôi hạt nắng…"
// - 1:05.8 ngắt sau "…ta nắm tay là không sai", lặng tới 1:08.36; 1:08.4 điệp khúc 1 "Anh sẽ tới đây cùng cơn mưa"
// - 1:38.7 rap lời 2 "Chẳng có lời hứa nào bằng…"; 1:53.96 "Vì anh em sẽ chiến thắng được thời gian…" (vào sớm
//   0,2 giây trước phách 1:54.16)
// - 2:05.77 điệp khúc lớn; 2:38.7 hết câu "Giữ mãi yêu thương gần kề"; 2:44.5 điệp khúc cuối mở nhỏ;
//   2:52.2 cả ban nhạc vào lại; 3:15.5 đoạn kết, tắt dần tới 3:41.6
// Bản phim bỏ điệp khúc 1 và đoạn rap, đúng 12 ô nhịp (46.453 giây): hết "…không sai" là vào ngay "Vì anh em…".
// Hai đầu vết ghép đều là khoảng lặng, cùng vào hợp âm Cmaj7, lưới phách giữ nguyên.
// Mốc trong bản phim (story/bang1.js dùng): lời 1 ở 35.77, "Vì anh em" ở 67.51, điệp khúc lớn ở 79.32,
// hết câu cuối ở 112.22, điệp khúc cuối mở nhỏ ở 118.03, cả ban nhạc ở 125.77, đoạn kết ở 149.0, hết nhạc ở 175.1.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(dir, 'src/Giữ Mãi Yêu Thương Gần Kề.mp3');
const OUT = path.join(dir, '../../assets/sound/bang1.mp3');

const SKIP = 48 * 60 / 61.998; // 12 ô nhịp
const SEAM = 67.375, XF = 0.05; // giây ghép (trong khoảng lặng sau "…không sai") và độ dài đoạn chồng
const END = 222.0; // giây kết trong bài gốc (sau đó chỉ còn im lặng)

const b0 = SEAM + SKIP; // cùng chỗ đó ở đoạn sau: ngay trước chữ "Vì"
const graph = [
  `[0:a]atrim=0:${(SEAM + XF).toFixed(3)},asetpts=PTS-STARTPTS,afade=t=out:st=${SEAM.toFixed(3)}:d=${XF}[a]`,
  `[1:a]atrim=${b0.toFixed(3)}:${END},asetpts=PTS-STARTPTS,afade=t=in:d=${XF},afade=t=out:st=${(END - b0 - 0.4).toFixed(3)}:d=0.4,adelay=${Math.round(SEAM * 1000)}|${Math.round(SEAM * 1000)}[b]`,
  // To hơn bài gốc 1 dB; bộ giới hạn giữ đỉnh dưới -0,5 dB để nén lại MP3 không bị rè
  `[a][b]amix=inputs=2:normalize=0:duration=longest,volume=1dB,alimiter=limit=0.944:attack=2:release=60:level=false[out]`,
].join(';');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', SRC, '-i', SRC, '-filter_complex', graph, '-map', '[out]', '-ac', '2', '-ar', '44100', '-b:a', '192k', OUT], { stdio: 'inherit' });
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT], { encoding: 'utf8' }).trim();
console.log('Đã tạo', path.relative(process.cwd(), OUT), '·', (+dur).toFixed(2) + 's', '· bỏ', SKIP.toFixed(3) + 's ở giây', SEAM);
