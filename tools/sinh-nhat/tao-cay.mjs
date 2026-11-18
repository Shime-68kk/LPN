// Vẽ bộ cây cho Chương 23 rồi lưu story/sinh-nhat/anh/cay.png (ảnh có nền trong suốt).
// Chạy: node tools/sinh-nhat/tao-cay.mjs   (cần playwright; xem _hop-bang-2/ban-giao/SINH-NHAT.md)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(new URL('../..', import.meta.url).pathname);
const b = await chromium.launch({ executablePath: path.join(process.env.HOME, '.cache/ms-playwright/chromium-1228/chrome-linux64/chrome') });
const p = await b.newPage();
await p.setContent('<html><body></body></html>');
await p.addScriptTag({ path: path.join(root, 'tools/sinh-nhat/cay.js') });
const t0 = Date.now();
const url = await p.evaluate(() => { const cv = document.createElement('canvas'); SN_CAY.ve(cv); return cv.toDataURL('image/png'); });
fs.writeFileSync(path.join(root, 'story/sinh-nhat/anh/cay.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('xong', Date.now() - t0, 'ms');
await b.close();
