// Run from repository root: node launch-video/render-v2.cjs [--proof] [--format=landscape|portrait]
const fs=require('fs'),path=require('path'),http=require('http'),{spawn,spawnSync}=require('child_process'),{once}=require('events');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/Users/alee/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'output');
const proof=process.argv.includes('--proof');
const one=process.argv.find(x=>x.startsWith('--format='))?.split('=')[1];
const formats=one?[one]:['landscape','portrait'];
if(formats.some(f=>!['landscape','portrait'].includes(f)))throw Error('Unknown format');
function run(command,args){const r=spawnSync(command,args,{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.stdout||command+' failed')}
const mixFile=path.join(__dirname,'assets','final-mix-v2.wav');
if(!fs.existsSync(mixFile)){
 run('python3',[path.join(__dirname,'audio-v2.py')]);
 run('ffmpeg',['-hide_banner','-loglevel','error','-ss','0.36','-i',path.join(__dirname,'assets','cipher-kevin-macleod.mp3'),'-i',path.join(__dirname,'assets','editorial-effects-v2.wav'),'-filter_complex','[0:a]atrim=duration=48,asetpts=PTS-STARTPTS,afade=t=in:d=0.35,afade=t=out:st=44.8:d=3.2,volume=0.65[m];[m][1:a]amix=inputs=2:normalize=0,loudnorm=I=-18:TP=-1.5:LRA=9[a]','-map','[a]','-t','48','-ar','48000','-ac','2','-c:a','pcm_s16le',mixFile]);
}
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end()};fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);return res.end()};res.setHeader('Content-Type',({'.html':'text/html','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'})[path.extname(p)]||'application/octet-stream');res.end(data)})});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{for(const format of formats){const page=await browser.newPage({viewport:{width:format==='portrait'?1080:1920,height:format==='portrait'?1920:1080}});await page.goto(`http://127.0.0.1:${port}/launch-video/film-v2.html?format=${format}&proof=${proof?1:0}`);await page.evaluate(()=>window.ready);
const file=path.join(out,`ali-abdullah-launch-v2-${format}${proof?'-proof':''}.mp4`);if(fs.existsSync(file)){fs.renameSync(file,file.replace('.mp4',`-backup-${Date.now()}.mp4`))}
const args=['-hide_banner','-loglevel','error','-f','image2pipe','-framerate','30','-vcodec','mjpeg','-i','pipe:0','-i',mixFile,'-map','0:v','-map','1:a',...(proof?['-af','afade=t=out:st=15:d=1']:[]),'-c:a','aac','-b:a','192k','-t',proof?'16':'48','-c:v','libx264','-threads','4','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-y',file];
const ff=spawn('ffmpeg',args);let error='';ff.stderr.on('data',s=>error+=s);ff.stdin.on('error',()=>{});const finished=once(ff,'close');let frames=Array.from({length:proof?480:1440},(_,i)=>i);
for(let i=0;i<frames.length;i++){const data=await page.evaluate(f=>window.renderFrame(f),frames[i]);if(!ff.stdin.write(Buffer.from(data,'base64')))await once(ff.stdin,'drain');if(i%300===0)console.log(`${format}: ${i}/${frames.length} frames`)}ff.stdin.end();const [code]=await finished;if(code!==0)throw Error(error);console.log(`Encoded ${path.basename(file)}`);
// Settled frames and transition endpoints are inspection assets, kept in /tmp.
for(const t of [.7,1.8,2.8,3.8,6.4,8.8,10.8,11.8,14.4,20.8,26.4,32,37.6,41.6,46]){await page.evaluate(f=>window.renderFrame(f),Math.round(t*30));await page.screenshot({path:`/tmp/portfolio-film-v2-${format}-${t}.png`})}
await page.close();}}
finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
