// Gửi thông báo đẩy khi nhật ký có bài mới hay bình luận mới (home/diary.js gọi sau khi lưu lên Firebase).
// Chạy riêng trên Cloudflare (worker "lpn-push"), tách khỏi trang chính vì cần giữ khoá bí mật VAPID.
//   POST /diary  { from: "quang" | "thuy", id: "<mã trang nhật ký>", cid?: "<mã bình luận>" }
// Worker tự đọc lại trang đó trên Firebase để soạn nội dung, nên không ai gửi được chữ tuỳ ý:
// chỉ báo khi bài / bình luận đúng là của người gửi, vừa viết trong 15 phút, và mỗi cái một lần.
// Khoá bí mật: secret VAPID_JWK (privateJwk trong ~/.config/lpn-push/vapid.json). Cách cài: README.md cùng thư mục.

const DB = 'https://yeult-diary-default-rtdb.asia-southeast1.firebasedatabase.app/';
const PUBLIC_KEY = 'BIL-ajE7FIJEbzbnMxi92I9Ov_kbwBCJFrmapYuaQc-rWIKgZOUBr5Zj1ZJNTP29KFtFjrCVNKTRII6C8KOGumU';
const SUBJECT = 'https://lpn.luongquang060804.workers.dev';
const WHO = { thuy: 'Lệ Thủy', quang: 'Anh Quang' };
const FRESH = 15 * 60 * 1000;
const ORIGINS = [SUBJECT, /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/];

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of parts) { out.set(p, i); i += p.length; }
  return out;
};
async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

// Chữ ký VAPID (JWT ES256) cho dịch vụ đẩy của máy nhận (Apple, Google, Mozilla).
async function vapidHeader(endpoint, jwk) {
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SUBJECT })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body));
  return 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + PUBLIC_KEY;
}

// Mã hoá nội dung theo RFC 8291 (aes128gcm), giống tools/push.mjs nhưng dùng WebCrypto.
export async function encrypt(sub, text) {
  const uaPublic = unb64u(sub.keys.p256dh);
  const auth = unb64u(sub.keys.auth);
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, pair.privateKey, 256));
  const ikm = await hmac(await hmac(auth, shared), concat(enc.encode('WebPush: info\0'), uaPublic, asPublic, [1]));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, enc.encode('Content-Encoding: aes128gcm\0\x01'))).slice(0, 16);
  const nonce = (await hmac(prk, enc.encode('Content-Encoding: nonce\0\x01'))).slice(0, 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(enc.encode(text), [2])));
  return concat(salt, [0, 0, 16, 0], [asPublic.length], asPublic, body);
}

async function db(path, method, body) {
  const res = await fetch(DB + path + '.json', {
    method: method || 'GET',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('Firebase ' + res.status);
  return res.json();
}

const snippet = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

// Soạn thông báo từ dữ liệu thật trên Firebase; trả null nếu không có gì để báo.
async function compose({ from, id, cid }) {
  if (!WHO[from] || typeof id !== 'string' || !/^[\w-]{1,64}$/.test(id)) return null;
  if (cid !== undefined && (typeof cid !== 'string' || !/^[\w-]{1,64}$/.test(cid))) return null;
  const entry = await db('diary/' + id);
  if (!entry) return null;
  const name = WHO[from];
  if (cid) {
    const list = Array.isArray(entry.comments) ? entry.comments : Object.values(entry.comments || {});
    const c = list.find((x) => x && x.id === cid);
    if (!c || c.by !== from || !(Date.now() - c.timestamp < FRESH)) return null;
    return { key: id + '_' + cid, title: name + ' vừa bình luận!', body: '“' + snippet(String(c.text || ''), 120) + '”' };
  }
  if (entry.author !== from || !(Date.now() - entry.timestamp < FRESH)) return null;
  const text = String(entry.text || '').trim();
  return {
    key: id,
    title: name + ' vừa viết nhật ký!',
    body: text ? snippet(text, 140) : 'Có một tấm ảnh mới, chạm để xem nha 📷',
  };
}

async function notify(req, env) {
  const msg = await compose(req);
  if (!msg) return { sent: 0, skip: 'nothing' };
  // Mỗi bài / bình luận chỉ báo một lần.
  if (await db('lpn/notified/' + msg.key)) return { sent: 0, skip: 'done' };
  await db('lpn/notified/' + msg.key, 'PUT', Date.now());
  const to = req.from === 'quang' ? 'thuy' : 'quang';
  const subs = (await db('lpn/players/' + to + '/push')) || {};
  const jwk = JSON.parse(env.VAPID_JWK);
  const payload = JSON.stringify({ title: msg.title, body: msg.body, url: 'home/?mo=nhat-ky', tag: 'nhat-ky-' + msg.key });
  let sent = 0;
  for (const [sid, sub] of Object.entries(subs)) {
    try {
      const res = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          Authorization: await vapidHeader(sub.endpoint, jwk),
          'Content-Encoding': 'aes128gcm',
          'Content-Type': 'application/octet-stream',
          TTL: String(3 * 24 * 3600),
          Urgency: 'high',
        },
        body: await encrypt(sub, payload),
      });
      if (res.ok) sent++;
      // Máy đã tắt thông báo hay gỡ app: địa chỉ nhận hết hạn, xoá khỏi Firebase.
      if (res.status === 404 || res.status === 410) await db('lpn/players/' + to + '/push/' + sid, 'DELETE');
    } catch (e) { /* máy này lỗi thì thử máy khác */ }
  }
  return { sent };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ORIGINS.some((o) => (typeof o === 'string' ? o === origin : o.test(origin)));
    const cors = allowed ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' } : {};
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const path = new URL(request.url).pathname;
    if (request.method !== 'POST' || path !== '/diary' || !allowed) return new Response('Không có gì ở đây.', { status: 404 });
    let req;
    try { req = await request.json(); } catch (e) { return new Response('Sai định dạng.', { status: 400, headers: cors }); }
    try {
      return Response.json(await notify(req, env), { headers: cors });
    } catch (e) {
      return Response.json({ sent: 0, error: e.message }, { status: 502, headers: cors });
    }
  },
};
