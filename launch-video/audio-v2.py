"""Original restrained editorial UI effects; no generated music.
Music license: Cipher, Kevin MacLeod (incompetech.com), CC BY 4.0.
Track catalog: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100844
License: https://creativecommons.org/licenses/by/4.0/
The music excerpt is trimmed by .36s to align its measured onset phase
with the 150 BPM / .4-second visual timeline, and faded at the ending.
"""
import math, wave, struct
from pathlib import Path
SR=48000
N=48*SR
mix=[0.0]*N
# Small clicks for filtering and opening a project; soft sweep at chapter edges.
for when,duration,freq,amp in [(2.4,.30,240,.07),(3.2,.25,350,.04),(4.8,.16,620,.055),(9.6,.08,1250,.09),(11.2,.10,980,.08),(12.8,.24,240,.05),(18.4,.24,240,.05),(24,.24,240,.05),(29.6,.16,620,.04),(35.2,.16,620,.04),(40,.24,240,.05),(43.2,.28,620,.06)]:
 for i in range(int(duration*SR)):
  t=i/SR; env=math.sin(math.pi*t/duration)**2*math.exp(-t*12)
  f=freq+(-180 if freq<500 else -350)*t/duration
  v=amp*env*math.sin(2*math.pi*f*t)
  k=round(when*SR)+i
  if k<N:mix[k]+=v
p=Path(__file__).parent/'assets'/'editorial-effects-v2.wav'
with wave.open(str(p),'wb') as w:
 w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
 w.writeframes(b''.join(struct.pack('<hh',int(max(-1,min(1,v))*32767),int(max(-1,min(1,v))*32767)) for v in mix))
print('Wrote 48-second original effects stem.')
