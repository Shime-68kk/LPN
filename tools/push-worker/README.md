# lpn-push

Worker nhỏ gửi thông báo lên điện thoại khi nhật ký có bài mới hoặc bình luận mới. Nó chạy riêng ở `https://lpn-push.luongquang060804.workers.dev`, không đi theo bản deploy của trang chính.

Trang nhật ký (`home/diary.js`) gọi `POST /diary` sau khi lưu. Worker đọc lại bài đó trên Firebase rồi tự soạn nội dung, nên không ai gửi được chữ tuỳ ý. Mỗi bài hay bình luận chỉ được báo một lần, đánh dấu ở `lpn/notified`. Người nhận là người còn lại, gửi tới các máy lưu ở `lpn/players/{ai}/push`.

Cài lần đầu (cần đăng nhập Cloudflare):

```
cd tools/push-worker
npx wrangler login
npx wrangler deploy
node -e "process.stdout.write(JSON.stringify(require(require('os').homedir()+'/.config/lpn-push/vapid.json').privateJwk))" | npx wrangler secret put VAPID_JWK
```

Khoá bí mật chỉ nằm trong secret `VAPID_JWK` trên Cloudflare và trong `~/.config/lpn-push/vapid.json`. Không đưa nó lên GitHub.
