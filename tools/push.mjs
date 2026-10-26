// Gửi thông báo đẩy tới máy của Thủy / anh Quang (chương mới, skin mới, sự kiện mới).
//   node tools/push.mjs <thuy|quang|ca-hai> "Tiêu đề" "Nội dung" [đường dẫn mở khi chạm, mặc định home/]
//   vd: node tools/push.mjs thuy "Có chương mới cho em" "Chương 14 · ..." "story/?play=c14"
// Địa chỉ nhận do app lưu ở Firebase lpn/players/{ai}/push (home/push.js).
// Khoá bí mật VAPID nằm ngoài repo: ~/.config/lpn-push/vapid.json (đừng đưa lên GitHub).
// Thử với một địa chỉ nhận lưu trong file: thêm --sub file.json thay cho tên người.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DB = 'https://yeult-diary-default-rtdb.asia-southeast1.firebasedatabase.app/';
const SUBJECT = 'https://lpn.luongquang060804.workers.dev';
const vapid = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/lpn-push/vapid.json'), 'utf8'));
const vapidKey = crypto.createPrivateKey({ key: vapid.privateJwk, format: 'jwk' });

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();

// Chữ ký VAPID (JWT ES256) cho dịch vụ đẩy của máy nhận (Apple, Google, Mozilla).
function vapidHeader(endpoint) {
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SUBJECT }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key: vapidKey, dsaEncoding: 'ieee-p1363' });
  return 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + vapid.publicKey;
}

// Mã hoá nội dung theo RFC 8291 (aes128gcm), chỉ máy nhận giải được.
function encrypt(sub, text) {
  const uaPublic = Buffer.from(sub.keys.p256dh, 'base64url');
  const auth = Buffer.from(sub.keys.auth, 'base64url');
  const ecdh = crypto.createECDH('prime256v1');
  const asPublic = ecdh.generateKeys();
  const shared = ecdh.computeSecret(uaPublic);
  const ikm = hmac(hmac(auth, shared), Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic, Buffer.from([1])]));
  const salt = crypto.randomBytes(16);
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(text), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, body]);
}

async function send(sub, payload) {
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapidHeader(sub.endpoint),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(3 * 24 * 3600),
      Urgency: 'high',
    },
    body: encrypt(sub, JSON.stringify(payload)),
  });
  return res;
}

const args = process.argv.slice(2);
let targets;
if (args[0] === '--sub') {
  targets = [['thử', 'file', JSON.parse(fs.readFileSync(args[1], 'utf8'))]];
  args.splice(0, 2);
} else {
  const who = args.shift();
  const people = who === 'ca-hai' ? ['thuy', 'quang'] : [who];
  if (!people.every((p) => p === 'thuy' || p === 'quang')) {
    console.error('Người nhận: thuy, quang hoặc ca-hai');
    process.exit(1);
  }
  targets = [];
  for (const p of people) {
    const list = (await (await fetch(DB + 'lpn/players/' + p + '/push.json')).json()) || {};
    for (const [id, sub] of Object.entries(list)) targets.push([p, id, sub]);
  }
}
const [title, body, url] = args;
if (!title) {
  console.error('Thiếu tiêu đề. Xem cách dùng ở đầu file.');
  process.exit(1);
}
if (!targets.length) console.log('Chưa có máy nào bật thông báo.');
for (const [who, id, sub] of targets) {
  const res = await send(sub, { title, body: body || '', url: url || 'home/', tag: url || 'lpn' });
  console.log(who, id, res.status, res.ok ? 'đã gửi' : await res.text());
  // Máy đã tắt thông báo hay gỡ app: địa chỉ nhận hết hạn, xoá khỏi Firebase.
  if ((res.status === 404 || res.status === 410) && id !== 'file') {
    await fetch(DB + 'lpn/players/' + who + '/push/' + id + '.json', { method: 'DELETE' });
    console.log('  đã xoá địa chỉ nhận hết hạn');
  }
}
