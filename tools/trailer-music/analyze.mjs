// Đo một bài nhạc để chọn đoạn cắt cho trailer: độ to theo thời gian, các phách mạnh, nhịp (BPM).
// Cách dùng: node tools/trailer-music/analyze.mjs "<file.mp3>" [từ giây] [đến giây]
// In ra từng nửa giây (đổi bằng STEP=giây): độ to (thanh ngang), dấu * ở phách mạnh. Cuối cùng là nhịp ước lượng và các cú dội lớn nhất.
import { execFileSync } from 'node:child_process';

const [file, from = 0, to = 1e9] = process.argv.slice(2);
const SR = 11025, HOP = 256, WIN = 1024;
const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
const x = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
const fps = SR / HOP;

// FFT nhỏ (radix-2) để đo "spectral flux": năng lượng mới xuất hiện ở từng dải tần, đỉnh của nó là phách / cú đánh.
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}
const hann = Float32Array.from({ length: WIN }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / WIN));
const frames = Math.floor((x.length - WIN) / HOP);
const rms = new Float32Array(frames), flux = new Float32Array(frames), low = new Float32Array(frames);
let prev = new Float32Array(WIN / 2);
for (let f = 0; f < frames; f++) {
  const re = new Float32Array(WIN), im = new Float32Array(WIN);
  let e = 0;
  for (let i = 0; i < WIN; i++) { const v = x[f * HOP + i]; e += v * v; re[i] = v * hann[i]; }
  rms[f] = Math.sqrt(e / WIN);
  fft(re, im);
  const mag = new Float32Array(WIN / 2);
  let fl = 0, lo = 0;
  for (let k = 1; k < WIN / 2; k++) { mag[k] = Math.log1p(100 * Math.hypot(re[k], im[k])); const d = mag[k] - prev[k]; if (d > 0) fl += d; if (k < 24) lo += mag[k]; }
  flux[f] = fl; low[f] = lo; prev = mag;
}
const db = (v) => 20 * Math.log10(v + 1e-9);

// Phách mạnh: đỉnh flux vượt hẳn trung bình quanh nó.
const onsets = [];
for (let f = 8; f < frames - 8; f++) {
  let m = 0; for (let k = -16; k <= 16; k++) m += flux[Math.max(0, Math.min(frames - 1, f + k))]; m /= 33;
  if (flux[f] > m * 1.6 && flux[f] >= flux[f - 1] && flux[f] >= flux[f + 1] && flux[f] > 8) onsets.push({ t: f / fps, s: flux[f] / m, db: db(rms[f]) });
}

// Nhịp: tự tương quan của đường flux, tìm trong khoảng 60–180 BPM.
function tempo(a, b) {
  const fa = Math.floor(a * fps), fb = Math.min(frames, Math.floor(b * fps));
  const seg = Array.from(flux.slice(fa, fb)); const mean = seg.reduce((p, v) => p + v, 0) / seg.length; const z = seg.map((v) => v - mean);
  let best = 0, bl = 0;
  for (let lag = Math.round(fps * 60 / 180); lag <= Math.round(fps * 60 / 60); lag++) { let s = 0; for (let i = 0; i + lag < z.length; i++) s += z[i] * z[i + lag]; if (s > best) { best = s; bl = lag; } }
  return bl ? 60 * fps / bl : 0;
}

const dur = x.length / SR;
console.log(file, '·', dur.toFixed(1) + 's', '· nhịp cả bài ≈', tempo(0, dur).toFixed(1), 'BPM');
const step = Math.round(fps * (+process.env.STEP || 0.5)); // STEP=3 để xem cả bài theo từng 3 giây
for (let f = Math.floor(from * fps); f < Math.min(frames, to * fps); f += step) {
  let r = 0; for (let k = 0; k < step && f + k < frames; k++) r = Math.max(r, rms[f + k]);
  const d = db(r), bar = '█'.repeat(Math.max(0, Math.round((d + 50) / 1.5)));
  const hits = onsets.filter((o) => o.t >= f / fps && o.t < (f + step) / fps && o.s > 2.2).length;
  const t = f / fps;
  console.log(`${String(Math.floor(t / 60))}:${(t % 60).toFixed(1).padStart(4, '0')}  ${d.toFixed(1).padStart(6)} dB ${bar}${hits ? ' ' + '*'.repeat(hits) : ''}`);
}
const big = onsets.filter((o) => o.t >= from && o.t <= to).sort((a, b) => b.s * Math.pow(10, b.db / 20) - a.s * Math.pow(10, a.db / 20)).slice(0, 15).sort((a, b) => a.t - b.t);
console.log('\nCú dội lớn nhất:', big.map((o) => `${Math.floor(o.t / 60)}:${(o.t % 60).toFixed(2).padStart(5, '0')} (${o.db.toFixed(0)}dB)`).join('  '));
