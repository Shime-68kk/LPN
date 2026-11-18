# Nhạc Chương 23 (sinh nhật): "Day One" (Hans Zimmer) dâng 0:00-3:01.7, cắt đúng phách (hết câu Sol, bậc V) sang "Detach" 5:02.37 (vào Đô, bậc I),
# Detach tự tụt (3:05.2) rồi BÙNG (3:31.7 = 00:00:00), tường âm dứt thì phần kết Day One (từ 3:04) ngân tới hết. Dài 4:19.8.
# Nguồn: FLAC 24-bit ở src/ (archive.org, album Interstellar). Chạy: ~/.cache/lpn-tach/bin/python tools/trailer-music/sinh-nhat.py
# Ra out/sinh-nhat-nhac.f32 (float32 stereo 44100) rồi tự nén ra out/sinh-nhat-nhac.flac và .mp3 (đỉnh -1 dB).
import subprocess, os, numpy as np
D0=os.path.dirname(os.path.abspath(__file__)); os.chdir(os.path.join(D0,'src')); os.makedirs(os.path.join(D0,'out'),exist_ok=True)
sr=44100
def load(f): return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','2','-f','f32le','-'],capture_output=True).stdout,np.float32).reshape(-1,2).astype(np.float64)
A=load('Day One (FLAC).flac'); D=load('Detach (FLAC).flac')
rms=lambda x,a,b: np.sqrt(np.mean(x[int(a*sr):int(b*sr)]**2))
A=A*(rms(D,298,303)/rms(A,172,180))
def fade(n,up): t=np.linspace(0,1,n); return (np.sin(t*np.pi/2) if up else np.cos(t*np.pi/2))[:,None]
o,i=181.71,302.37   # Day One hết câu Sol (V) -> Detach vào phách Đô (I)
X=0.5; n=int(X*sr)
a=A[:int((o+X/2)*sr)]; b=D[int((i-X/2)*sr):int(365.66*sr)]
out=np.concatenate([a[:-n], a[-n:]*fade(n,0)+b[:n]*fade(n,1), b[n:]])
c=A[int(184.0*sr):]; j=out.shape[0]-int(0.6*sr)
fin=np.zeros((j+c.shape[0],2)); fin[:out.shape[0]]=out; fin[j:out.shape[0]]*=fade(out.shape[0]-j,0); fin[j:]+=c
out=fin*(0.89/np.abs(fin).max())   # đỉnh -1 dB, chừa chỗ khi nén mp3
out.astype(np.float32).tofile(os.path.join(D0,'out','sinh-nhat-nhac.f32'))
T=lambda t: f"{int(t//60)}:{t%60:04.1f}"; s=o-i
print('dai',T(out.shape[0]/sr),'| noi',T(o),'| TUT',T(305.86+s),'| BUNG 00:00',T(332.36+s),'| Day One ket',T(j/sr))
f=os.path.join(D0,'out','sinh-nhat-nhac')
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','44100','-ac','2','-i',f+'.f32','-c:a','flac','-sample_fmt','s32',f+'.flac'],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',f+'.flac','-c:a','libmp3lame','-b:a','320k',f+'.mp3'],check=True); os.remove(f+'.f32')
