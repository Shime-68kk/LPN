#!/usr/bin/env python3
"""Sinh beatmap cho game Sâu Tím từ các file mp3.

Cần: ffmpeg + numpy (không cần librosa).
Chạy:  python3 tools/make_beatmaps.py            # tất cả bài
       python3 tools/make_beatmaps.py anh-la-ai  # một bài

Kết quả: game/beatmaps/<id>.json và game/beatmaps/index.json.
Lời nhắn (message) và độ lệch (offset) trong index.json được giữ lại khi chạy lại,
nên có thể sửa tay ở đó.
"""
import json
import pathlib
import subprocess
import sys

import numpy as np

SR = 22050
HOP = 512
NFFT = 2048
FPS = SR / HOP
SECTION_LEN = 96.0   # độ dài một màn chơi (giây)
LEAD = 2.4           # khoảng trống trước nốt đầu tiên
PREVIEW_LEN = 15.0   # độ dài đoạn nghe thử ở menu

# Chỉnh tay điểm bắt đầu đoạn nghe thử (giây), thay cho đoạn tự tìm.
PREVIEW_AT = {"cho-chut": 44.0}

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "game" / "beatmaps"

SONGS = [
    ("ai-ngoai-anh", "Ai Ngoài Anh", "Ai Ngoài Anh.mp3", "Anh (1).jpg",
     "Ngoài anh ra, đừng để ai làm em buồn nha."),
    ("in-love", "In Love x Có Đôi Điều", "In Love x Có Đôi Điều.mp3", "Anh (2).jpg",
     "Có đôi điều anh chưa nói: anh thương em nhiều lắm."),
    ("noi-nay-co-anh", "Nơi Này Có Anh", "Track 06 x Nơi Này Có Anh.mp3", "Anh (3).jpg",
     "Dù em ở đâu, nơi này vẫn luôn có anh."),
    ("lo-say-bye", "Lỡ Say Bye Là Bye", "Lỡ Say Bye Là Bye.mp3", "Anh (4).jpg",
     "Mình sẽ không bao giờ say bye đâu nhé."),
    ("missing-you", "MISSING YOU", "MISSING YOU.mp3", "Anh (5).jpg",
     "Mỗi ngày không gặp là một ngày anh nhớ em."),
    ("anh-la-ai", "Anh Là Ai?", "Anh là ai.mp3", "Anh (6).jpg",
     "Anh là người sẽ thương em thật lâu."),
    ("cho-chut", "chờ chút...", "Chờ Chút.mp3", "Anh (7).jpg",
     "Chờ anh chút nữa thôi, rồi mình còn đi thật nhiều nơi."),
]
# Bài chơi cả bài (không cắt đoạn 96 giây) và bài gắn nhãn NEW, đứng đầu danh sách.
FULL_SONG = {"cho-chut"}
NEW_SONGS = ["cho-chut"]


def load_audio(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def stft_mag(y):
    frames = np.lib.stride_tricks.sliding_window_view(y, NFFT)[::HOP]
    win = np.hanning(NFFT).astype(np.float32)
    out = np.empty((len(frames), NFFT // 2 + 1), np.float32)
    for i in range(0, len(frames), 1024):
        out[i:i + 1024] = np.abs(np.fft.rfft(frames[i:i + 1024] * win, axis=1))
    return out


def moving_avg(x, n):
    n = max(1, int(n))
    return np.convolve(x, np.ones(n) / n, mode="same")


def frame_time(i):
    return (np.asarray(i) * HOP + NFFT / 2) / SR


def onset_envelope(mag):
    freqs = np.fft.rfftfreq(NFFT, 1 / SR)
    band = (freqs > 30) & (freqs < 8000)
    s = np.log1p(100 * mag[:, band])
    flux = np.maximum(0, np.diff(s, axis=0)).mean(axis=1)
    flux = np.concatenate([[0], flux])
    flux = np.maximum(0, flux - moving_avg(flux, 0.4 * FPS))
    return flux / (flux.std() + 1e-9)


def estimate_bpm(env):
    n = len(env)
    f = np.fft.rfft(env - env.mean(), 2 * n)
    ac = np.fft.irfft(f * np.conj(f))[:n]
    best_lag, best_score = 0, -1.0
    for lag in range(int(60 * FPS / 180), int(60 * FPS / 60) + 1):
        weight = np.exp(-0.5 * (np.log2(60 * FPS / lag / 100) / 0.8) ** 2)
        if ac[lag] * weight > best_score:
            best_lag, best_score = lag, ac[lag] * weight
    # Nội suy parabol quanh đỉnh để có tempo lẻ (độ phân giải gốc chỉ ~3-4 BPM).
    a, b, c = ac[best_lag - 1], ac[best_lag], ac[best_lag + 1]
    denom = a - 2 * b + c
    shift = 0.5 * (a - c) / denom if denom < 0 else 0.0
    return float(60 * FPS / (best_lag + np.clip(shift, -0.5, 0.5)))


def track_beats(env, bpm, tightness=100.0):
    period = 60 * FPS / bpm
    n = len(env)
    score = env.copy()
    back = -np.ones(n, int)
    lo_off, hi_off = int(round(2 * period)), int(round(period / 2))
    for t in range(n):
        hi = t - hi_off
        if hi <= 0:
            continue
        prev = np.arange(max(0, t - lo_off), hi)
        cand = score[prev] - tightness * np.log((t - prev) / period) ** 2
        j = int(np.argmax(cand))
        if cand[j] > 0:
            score[t] = env[t] + cand[j]
            back[t] = prev[j]
    tail = np.arange(max(0, n - int(2 * period)), n)
    t = int(tail[np.argmax(score[tail])])
    beats = []
    while t >= 0:
        beats.append(t)
        t = back[t]
    return np.array(beats[::-1])


def chroma(mag):
    freqs = np.fft.rfftfreq(NFFT, 1 / SR)
    band = (freqs > 130) & (freqs < 2000)
    pcs = (np.round(12 * np.log2(freqs[band] / 440.0)).astype(int) + 9) % 12
    onehot = np.zeros((band.sum(), 12), np.float32)
    onehot[np.arange(band.sum()), pcs] = 1
    return mag[:, band] @ onehot


def build(song):
    sid, title, fname, cover = song[:4]
    path = ROOT / "assets" / "sound" / fname
    y = load_audio(path)
    duration = len(y) / SR
    mag = stft_mag(y)
    env = onset_envelope(mag)
    rms = np.sqrt(np.mean(np.lib.stride_tricks.sliding_window_view(y, NFFT)[::HOP] ** 2, axis=1))
    rms_s = moving_avg(rms, FPS)
    chr_ = chroma(mag)
    key = int(np.argmax(chr_.mean(axis=0)))

    bpm = estimate_bpm(env)
    beat_frames = track_beats(env, bpm)
    loud = rms_s > 0.25 * np.percentile(rms_s, 90)
    beat_frames = beat_frames[loud[beat_frames]]
    beats = frame_time(beat_frames)
    beat_len = 60.0 / bpm

    # Đoạn nghe thử: 15 giây to/sôi động nhất, bắt đầu đúng một phách.
    preview, best_pv = 0.0, -1.0
    for b in beats:
        if b + PREVIEW_LEN > duration - 1:
            break
        val = rms_s[int(b * FPS):int((b + PREVIEW_LEN) * FPS)].mean()
        if val > best_pv:
            preview, best_pv = float(b), val

    # Chọn đoạn sôi động nhất (thường là điệp khúc) dài SECTION_LEN giây.
    length = min(SECTION_LEN, duration - 6)
    if sid in FULL_SONG:
        length = duration - max(0.0, beats[0] - LEAD) - 0.5
    best_i, best_val = 0, -1.0
    for i in range(0, len(beats), 4):
        s0 = beats[i] - LEAD
        if s0 < 0 or s0 + length > duration - 1:
            continue
        a, b = int(s0 * FPS), int((s0 + length) * FPS)
        val = rms_s[a:b].mean()
        if s0 < 0.12 * duration:
            val *= 0.85
        if val > best_val:
            best_i, best_val = i, val
    start = max(0.0, beats[best_i] - LEAD)
    if sid in FULL_SONG:
        start = max(0.0, beats[0] - LEAD)
    end = min(duration, start + length)
    last_note = end - 3.2

    sel = (beats >= start + LEAD - 0.05) & (beats <= last_note)
    sec_beats = beats[sel]
    sec_frames = beat_frames[sel]
    strength = env[sec_frames]
    med = np.median(strength) + 1e-9

    # Nốt phụ giữa hai phách (chỉ ở mức Vừa).
    peaks = [i for i in range(3, len(env) - 3)
             if env[i] == env[i - 3:i + 4].max() and env[i] > np.percentile(env, 80)]
    half_notes = []
    for a, b in zip(sec_beats[:-1], sec_beats[1:]):
        mid = (a + b) / 2
        near = [p for p in peaks if abs(frame_time(p) - mid) < 0.07]
        if near and env[near[0]] > 1.1 * med:
            half_notes.append(mid)

    # Nốt dài: chỗ phách sau yếu nhưng âm thanh vẫn ngân.
    notes = []
    holds_at = {}
    i = 0
    last_hold_block = -1
    while i < len(sec_beats):
        k = 0
        while (i + k + 1 < len(sec_beats) and k < 3
               and strength[i + k + 1] < 0.55 * med
               and rms_s[sec_frames[i + k + 1]] > 0.6 * rms_s[sec_frames[i]]):
            k += 1
        block = i // 8
        if k == 0 and i % 8 == 6 and block != last_hold_block and i + 2 < len(sec_beats):
            k = 2  # cuối câu nhạc: thêm một nốt ngân 2 phách
        if k >= 2:
            holds_at[i] = sec_beats[i + k] - sec_beats[i] - 0.12 * beat_len
            last_hold_block = block
            notes.append([float(sec_beats[i]), holds_at[i], 1])
            i += k + 1
            continue
        lvl = 1 if (bpm <= 125 or i % 2 == 0) else 2
        notes.append([float(sec_beats[i]), 0.0, lvl])
        i += 1

    hold_spans = [(n[0], n[0] + n[1]) for n in notes if n[1] > 0]
    for t in half_notes:
        if not any(a - 0.1 <= t <= b + 0.1 for a, b in hold_spans):
            notes.append([float(t), 0.0, 2])
    notes.sort(key=lambda n: n[0])

    # Vị trí ngang đi theo cao độ (chroma), giới hạn tốc độ để luôn chơi được.
    out = []
    prev_x, prev_end, still = 0.5, notes[0][0] - 1.0, 0
    for t, dur, lvl in notes:
        a = int(t * FPS)
        b = max(a + 1, int((t + 0.25) * FPS))
        pc = int(np.argmax(chr_[a:b].sum(axis=0)))
        target = 0.12 + 0.76 * (((pc - key) % 12) / 11.0)
        gap = max(0.05, t - prev_end)
        max_dx = min(0.55, 0.1 + 0.8 * gap)
        x = prev_x + float(np.clip(target - prev_x, -max_dx, max_dx))
        if abs(x - prev_x) < 0.05:
            still += 1
            if still >= 2:
                x = prev_x + (0.16 if prev_x < 0.5 else -0.16)
                still = 0
        else:
            still = 0
        x = float(np.clip(x, 0.1, 0.9))
        out.append([round(t, 3), round(x, 3), round(float(dur), 3), lvl])
        prev_x, prev_end = x, t + dur

    data = {
        "id": sid,
        "title": title,
        "bpm": round(bpm, 2),
        "key": key,
        "start": round(float(start), 3),
        "preview": round(max(0.0, preview - 0.15), 3),
        "end": round(float(end), 3),
        "beats": [round(float(b), 3) for b in beats[(beats >= start) & (beats <= end)]],
        "notes": out,
    }
    (OUT / f"{sid}.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    holds = sum(1 for n in out if n[2] > 0)
    print(f"{sid:16s} bpm={bpm:6.2f} đoạn={start:6.1f}-{end:6.1f}s nốt={len(out):3d} "
          f"(dễ={sum(1 for n in out if n[3] == 1)}, dài={holds})")
    return data


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    index_path = OUT / "index.json"
    old = {}
    if index_path.exists():
        old = {s["id"]: s for s in json.loads(index_path.read_text())["songs"]}
    only = set(sys.argv[1:])
    songs = []
    for song in SONGS:
        sid, title, fname, cover, message = song[:5]
        locked = len(song) > 5 and song[5]
        if not only or sid in only:
            data = build(song)
        else:
            data = json.loads((OUT / f"{sid}.json").read_text())
        prev = old.get(sid, {})
        entry = {
            "id": sid,
            "title": title,
            "src": f"../assets/sound/{fname}",
            "cover": f"../assets/thumbs/cover-{cover.strip('Anh ().jpg')}.webp",
            "map": f"beatmaps/{sid}.json",
            "bpm": data["bpm"],
            "preview": PREVIEW_AT.get(sid, data.get("preview", data["start"])),
            "message": prev.get("message", message),
            "offset": prev.get("offset", 0),
        }
        if locked:
            entry["locked"] = True
        if sid in NEW_SONGS:
            entry["isNew"] = True
        songs.append(entry)
    songs.sort(key=lambda e: 0 if e["id"] in NEW_SONGS else 1)
    index_path.write_text(json.dumps({"songs": songs}, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
