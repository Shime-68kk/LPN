#!/usr/bin/env bash
# Tạo ảnh thu nhỏ WebP cho album và ảnh bìa nhạc (cần ffmpeg có libwebp).
# Chạy từ thư mục gốc dự án:  bash tools/make_thumbs.sh
set -euo pipefail
out=style/thumbs
mkdir -p "$out"

for f in style/img/Anh\ \(*\).jpg; do
  n=$(basename "$f" .jpg | tr -dc '0-9')
  ffmpeg -v error -y -i "$f" \
    -vf "scale=360:360:force_original_aspect_ratio=increase,crop=360:360" \
    -c:v libwebp -quality 72 "$out/anh-$n.webp"
done

for f in style/sound/Anh\ \(*\).jpg; do
  n=$(basename "$f" .jpg | tr -dc '0-9')
  ffmpeg -v error -y -i "$f" \
    -vf "scale=160:160:force_original_aspect_ratio=increase,crop=160:160" \
    -c:v libwebp -quality 75 "$out/cover-$n.webp"
done

echo "Xong: $(ls "$out" | wc -l) ảnh trong $out"
