// ===== THI ĐẤU XẾP HẠNG (nạp sau problems.js) =====
// Dán URL Firebase Realtime Database vào NET.fb để ghép trận thật giữa các máy. Để trống = chế độ thử (tab khác cùng trình duyệt hoặc đấu với máy).
const NET = {
    fb: 'https://sloivn-default-rtdb.asia-southeast1.firebasedatabase.app/',
    ms: 1500
};
(function(){
const RN=['🥉 Đồng','🥈 Bạc','🥇 Vàng','💠 Bạch Kim','💎 Kim Cương','🔥 Cao Thủ','👑 Đại Cao Thủ','🐉 Huyền Thoại'];
const WIN_PTS=100,STEP=200; // thắng +100; rank r cần STEP*(r+1) điểm để lên rank r+1
const DIS=['Hiện tên bài + chuyên đề','Hiện tên bài + chuyên đề','Ẩn tên bài và chuyên đề','Ẩn tên bài và chuyên đề','Ẩn tên bài và chuyên đề','Ẩn tên + chỉ 1 test mẫu','Ẩn tên + chỉ 1 test mẫu','Ẩn tên + chỉ 1 test mẫu'];
const UID='u'+Math.random().toString(36).slice(2,8),TPL='#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    \n    return 0;\n}\n';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'),fmt=ms=>{const s=Math.max(0,Math.floor(ms/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const tex=s=>esc(s||'').replace(/\$([^$]+)\$/g,'$1').replace(/\\+(?:leq?)\b/g,'≤').replace(/\\+(?:geq?)\b/g,'≥').replace(/\\+times/g,'×').replace(/\\+cdot/g,'·').replace(/\\+ne\b/g,'≠').replace(/\\+(?:ldots|dots)/g,'…').replace(/\^\{([^}]*)\}/g,'^$1').replace(/_\{([^}]*)\}/g,'_$1').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\n/g,'<br>');
const nz=s=>String(s||'').split(/\s+/).filter(Boolean).join(' ');
const name=()=>{try{return localStorage.getItem('sloi_ol_name')||JSON.parse(localStorage.getItem('learningvn_cplusplus_state')).userName||'Học viên'}catch(e){return 'Học viên'}};
let OL={mm:null,m:null},root,R=h=>{root.innerHTML='<div class="olw">'+h+'</div>'};

// ---- lưu trữ: LS (thử) / FB (Firebase REST) / MEM (đấu với máy) ----
const lk=k=>'sloi_net_'+k;
const LS={async get(k){try{return JSON.parse(localStorage.getItem(lk(k)))}catch(e){return null}},async set(k,v){localStorage.setItem(lk(k),JSON.stringify(v))},async del(k){localStorage.removeItem(lk(k))},
async list(p){const o={},pf=lk(p+'/');for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(pf)&&k.indexOf('/',pf.length)<0)o[k.slice(pf.length)]=JSON.parse(localStorage.getItem(k))}return o},
async claim(k,v){if(await this.get(k)!=null)return false;await this.set(k,v);return true}};
const FB={u:k=>NET.fb.replace(/\/$/,'')+'/'+k+'.json',async get(k){return (await fetch(this.u(k))).json()},async set(k,v){await fetch(this.u(k),{method:'PUT',body:JSON.stringify(v)})},async del(k){await fetch(this.u(k),{method:'DELETE'})},async list(p){return (await (await fetch(this.u(p))).json())||{}},
async claim(k,v){const r=await fetch(this.u(k),{headers:{'X-Firebase-ETag':'true'}}),e=r.headers.get('ETag');if(await r.json()!=null)return false;return (await fetch(this.u(k),{method:'PUT',headers:{'if-match':e},body:JSON.stringify(v)})).ok}};
const MEM={d:{},async get(k){return this.d[k]??null},async set(k,v){this.d[k]=v},async del(k){delete this.d[k]},async claim(k,v){if(this.d[k]!=null)return false;this.d[k]=v;return true}};

// ---- rank ----
const rk=()=>{try{return Object.assign({r:0,p:0,w:0,l:0},JSON.parse(localStorage.getItem('sloi_rk_'+name())||'{}'))}catch(e){return {r:0,p:0,w:0,l:0}}};
function rkAdd(win){const k=rk();if(win===true){k.w++;k.p+=WIN_PTS;while(k.r<7&&k.p>=STEP*(k.r+1)){k.p-=STEP*(k.r+1);k.r++}}else if(win===false)k.l++;try{localStorage.setItem('sloi_rk_'+name(),JSON.stringify(k))}catch(e){}return k}

// ---- chọn 5 bài: rank cao thì bài khó hơn, cùng seed = cùng đề ----
function pickP(id,r){
  let s=0;for(const c of id)s=(s*31+c.charCodeAt(0))>>>0;
  const rnd=()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296};
  const by=d=>OLP.filter(p=>p.difficulty==d),sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const nNC=r<5?0:r-4,rest=5-nNC,base=sh(by(r<2?'Cơ bản':'Trung bình')),out=[...base.slice(0,rest),...sh(by('Nâng cao')).slice(0,nNC)];
  const L={'Cơ bản':0,'Trung bình':1,'Nâng cao':2};return out.sort((a,b)=>L[a.difficulty]-L[b.difficulty]);
}

// ---- Judge0 ----
const b64=s=>btoa(unescape(encodeURIComponent(s))),ub=s=>{try{return decodeURIComponent(escape(atob((s||'').replace(/\s/g,''))))}catch(e){return ''}};
async function judge(code,ts,res){
  const J='https://ce.judge0.com',H={'Content-Type':'application/json'};
  try{let r=await fetch(J+'/submissions/batch?base64_encoded=true',{method:'POST',headers:H,body:JSON.stringify({submissions:ts.map(t=>({source_code:b64(code),language_id:54,stdin:b64(t.input),compiler_options:'-O2 -std=c++17',cpu_time_limit:2,memory_limit:262144}))})});
    if(!r.ok)throw new Error('HTTP '+r.status);const tok=(await r.json()).map(x=>x.token).join(',');
    for(let n=0;n<40;n++){await new Promise(z=>setTimeout(z,1000));r=await fetch(J+'/submissions/batch?base64_encoded=true&fields=status,stdout,compile_output&tokens='+tok,{headers:H});if(!r.ok)throw new Error('HTTP '+r.status);const s=(await r.json()).submissions;if(s.every(x=>x.status.id>2))return s}
    throw new Error('máy chấm phản hồi quá lâu');
  }catch(e){res.innerHTML='<p class="olb">⚠️ Không gọi được máy chấm ('+esc(e.message)+'). Thử lại sau ít phút.</p>';return null}
}

// ---- màn hình chính ----
function home(){
  const k=rk(),need=k.r<7?STEP*(k.r+1):0;
  R(`<div class="olc"><div class="olr"><h2>⚔️ Thi đấu xếp hạng</h2><button class="ols" id="olX">✕ Đóng</button></div>
  <p class="olm">Mỗi trận có 5 vòng, mỗi vòng một bài lập trình khác nhau. Ai làm đúng hết test trước thì thắng vòng. Thắng nhiều vòng hơn thì thắng trận: +${WIN_PTS} điểm. Rank càng cao, đề càng khó và càng ít gợi ý về thuật toán.</p>
  <p>Tên thi đấu: <input id="olN" value="${esc(name())}" maxlength="20" class="olin"></p>
  <div class="olr"><h3>${RN[k.r]}</h3><span class="olm">${k.w} thắng · ${k.l} thua</span></div>
  ${need?`<div class="olbar"><div style="width:${Math.min(100,k.p/need*100)}%"></div></div><p class="olm">${k.p}/${need} điểm để lên ${RN[k.r+1]}</p>`:'<p class="olg">Bạn đã đạt rank cao nhất!</p>'}
  <button id="olQ">⚔️ Ghép trận</button>${NET.fb?'':'<p class="olm">Chế độ thử: chưa cấu hình máy chủ, chỉ ghép được với tab khác của trình duyệt này, hoặc đấu với máy sau 30 giây.</p>'}</div>
  <div class="olc"><h3>Bảng rank</h3><table><tr><th>Rank</th><th>Điểm để lên rank kế</th><th>Đề</th></tr>${RN.map((n,i)=>`<tr><td>${n}</td><td>${i<7?STEP*(i+1):'-'}</td><td>${DIS[i]}</td></tr>`).join('')}</table></div>`);
  document.getElementById('olX').onclick=close;document.getElementById('olQ').onclick=queue;
  document.getElementById('olN').onchange=e=>{const v=e.target.value.trim();if(v)try{localStorage.setItem('sloi_ol_name',v)}catch(x){}home()};
}
function open(){root.style.display='block';document.body.style.overflow='hidden';home()}
function close(){stop();root.style.display='none';document.body.style.overflow=''}

// ---- ghép trận ----
function queue(){
  stop();const S=NET.fb?FB:LS,now=Date.now();OL.mm={S,t0:now,me:{n:name(),r:rk().r,t:now}};
  R(`<div class="olc" style="text-align:center"><h2>🔎 Đang ghép trận...</h2><div class="olt" id="mmT">00:00</div><p class="olm" id="mmI">Đang chờ đối thủ cùng rank (${RN[rk().r]}).</p><p><button id="mmBot" class="ols" style="display:none">🤖 Đấu với máy</button> <button class="ols" id="mmC">Hủy</button></p></div>`);
  document.getElementById('mmC').onclick=()=>{stop();home()};document.getElementById('mmBot').onclick=bot;
  OL.mm.iv=setInterval(mmTick,NET.ms);OL.mm.ti=setInterval(()=>{const e=document.getElementById('mmT');if(!e)return;const d=Date.now()-OL.mm.t0;e.textContent=fmt(d);if(d>30000)document.getElementById('mmBot').style.display=''},500);mmTick();
}
async function mmTick(){
  const q=OL.mm;if(!q||q.tk)return;q.tk=1;
  try{const S=q.S,me=UID,now=Date.now(),w=(now-q.t0)/1000;
    await S.set('q/'+me,Object.assign({h:now},q.me));
    const mid=await S.get('k/'+me);if(mid)return start(S,mid);
    const L=await S.list('q');
    const c=Object.entries(L).filter(([u,v])=>u!=me&&v&&now-v.h<15000&&(v.t>q.me.t||(v.t==q.me.t&&u>me))&&Math.abs(v.r-q.me.r)<=1+Math.floor(w/10)).sort((a,b)=>a[1].t-b[1].t)[0];
    if(c){const id=me+'_'+c[0]+'_'+now;await S.set('m/'+id,{r:Math.floor((q.me.r+c[1].r)/2),a:me,an:q.me.n,b:c[0],bn:c[1].n});
      if(await S.claim('k/'+c[0],id)){if(await S.claim('k/'+me,id))return start(S,id);await S.del('k/'+c[0])}}
  }catch(e){const i=document.getElementById('mmI');if(i)i.innerHTML='<span class="olb">⚠️ Không kết nối được máy chủ ghép trận ('+esc(e.message)+'). Đang thử lại...</span>'}
  finally{q.tk=0}
}
function clearMM(){if(OL.mm){clearInterval(OL.mm.iv);clearInterval(OL.mm.ti);try{OL.mm.S.del('q/'+UID);OL.mm.S.del('k/'+UID)}catch(e){}OL.mm=null}}
async function start(S,id){const M0=await S.get('m/'+id);clearMM();if(!M0)return home();init(S,id,M0.r,M0.a==UID?M0.bn:M0.an,0)}
function bot(){clearMM();MEM.d={};init(MEM,'bot'+Date.now(),rk().r,'Bot SLOI',1)}
function init(S,id,r,opp,bt){OL.m={s:S,id,r,opp,bot:bt,probs:pickP(id,r),j:0,me:0,op:0,RT:300+r*90,dis:r<2?0:r<5?1:2};round()}

// ---- một vòng đấu ----
function round(){
  const M=OL.m,p=M.probs[M.j],vis=M.dis>=2?1:2;M.over=false;M.busy=false;M.rt0=Date.now();
  R(`<div class="olc"><div class="olr"><b>⚔️ Vòng ${M.j+1}/5 · ${esc(name())} ${M.me} - ${M.op} ${esc(M.opp)}</b><span class="olt" id="olT">${fmt(M.RT*1000)}</span></div>
  <h3>${M.dis==0?esc(p.name)+' <span class="olm">· '+esc(p.category)+'</span>':'Bài '+(M.j+1)}</h3>
  <p>${tex(p.description)}</p><p><b>Input:</b> ${tex(p.inputFormat)}</p><p><b>Output:</b> ${tex(p.outputFormat)}</p>
  ${(p.constraints||[]).length?'<p><b>Ràng buộc:</b> '+p.constraints.map(tex).join('; ')+'</p>':''}
  ${(p.samples||[]).slice(0,vis).map((s,i)=>`<p><b>Ví dụ ${i+1}</b></p><pre>${esc(s.input)}</pre><pre>${esc(s.output)}</pre>`).join('')}
  ${vis<(p.samples||[]).length?'<p class="olm">Còn các test ẩn, code được chấm trên tất cả test.</p>':''}
  <textarea id="olCode" spellcheck="false"></textarea><p><button id="olSub">▶ Chạy &amp; Nộp bài</button> <button class="ols" id="olQuit">Bỏ trận</button></p><div id="olRes"></div></div>`);
  const ta=document.getElementById('olCode');ta.value=TPL;ta.onkeydown=k=>{if(k.key=='Tab'){k.preventDefault();ta.setRangeText('    ',ta.selectionStart,ta.selectionEnd,'end')}};
  document.getElementById('olSub').onclick=submit;document.getElementById('olQuit').onclick=()=>{if(confirm('Bỏ trận sẽ bị xử thua. Bạn chắc chứ?')){stop();home()}};
  clearInterval(M.iv);M.iv=setInterval(tick,1000);
  if(M.bot){clearTimeout(M.bt);const j=M.j;M.bt=setTimeout(async()=>{if(OL.m===M&&M.j==j&&!M.over)await M.s.claim('m/'+M.id+'/w'+j,'bot')},(Math.max(60,240-M.r*20)+Math.random()*70+M.j*20)*1000)}
}
async function tick(){
  const M=OL.m;if(!M||M.over||M.tk)return;M.tk=1;
  try{const left=M.RT-(Date.now()-M.rt0)/1000,e=document.getElementById('olT');if(e)e.textContent=fmt(left*1000);
    const f=await M.s.get('m/'+M.id+'/f');if(f&&f!=UID)return finish(true);
    const k='m/'+M.id+'/w'+M.j;let w=await M.s.get(k);
    if(w==null&&left<=0){await M.s.claim(k,'none');w=await M.s.get(k)}
    if(w!=null)roundEnd(w);
  }catch(e){}finally{M.tk=0}
}
async function submit(){
  const M=OL.m;if(!M||M.busy||M.over)return;const j=M.j,p=M.probs[j],res=document.getElementById('olRes'),b=document.getElementById('olSub'),code=document.getElementById('olCode').value;
  M.busy=true;b.disabled=true;res.innerHTML='<p class="olm">⏳ Đang chấm...</p>';
  const S=await judge(code,p.testCases,res);M.busy=false;if(OL.m!==M||M.j!=j||M.over)return;b.disabled=false;if(!S)return;
  const ok=S.map((x,i)=>x.status.id==3&&nz(ub(x.stdout))===nz(p.testCases[i].expected)),n=ok.filter(Boolean).length;
  if(n<ok.length){const ce=S.find(x=>x.status.id==6);res.innerHTML=`<p class="olb">❌ Đúng ${n}/${ok.length} test. Sửa code và nộp lại.</p>`+(ce?'<pre>'+esc(ub(ce.compile_output)).slice(0,800)+'</pre>':'');return}
  if(await M.s.claim('m/'+M.id+'/w'+j,UID))roundEnd(UID);else roundEnd(await M.s.get('m/'+M.id+'/w'+j));
}
function roundEnd(w){
  const M=OL.m;if(!M||M.over)return;M.over=true;clearInterval(M.iv);clearTimeout(M.bt);
  const mine=w==UID;if(mine){M.me++;fx()}else if(w!='none')M.op++;
  const msg=mine?'🎉 Bạn thắng vòng này!':w=='none'?'⌛ Hết giờ, không ai thắng vòng này.':'😓 '+esc(M.opp)+' đã giải xong trước.';
  const r=document.getElementById('olRes');if(r)r.innerHTML=`<p class="${mine?'olg':'olb'}">${msg} Tỉ số ${M.me} - ${M.op}.</p>`;
  const b=document.getElementById('olSub');if(b)b.disabled=true;
  setTimeout(()=>{if(OL.m!==M)return;if(++M.j<5)round();else finish(false)},3500);
}
function finish(forfeit){
  const M=OL.m;if(!M||M.done)return;M.done=true;clearInterval(M.iv);clearTimeout(M.bt);
  const res=forfeit||M.me>M.op?true:M.me<M.op?false:null,before=rk().r,k=rkAdd(res);
  R(`<div class="olc" style="text-align:center"><h2>${res===true?'🏆 Bạn thắng trận!':res===false?'😢 Bạn thua trận':'🤝 Hòa'}</h2><p>${esc(name())} ${M.me} - ${M.op} ${esc(M.opp)}${forfeit?' (đối thủ đã rời trận)':''}</p>
  <p class="${res===true?'olg':'olm'}">+${res===true?WIN_PTS:0} điểm</p>${k.r>before?`<h3 class="olg">🎊 Lên rank ${RN[k.r]}!</h3>`:''}<p>${RN[k.r]}${k.r<7?` · ${k.p}/${STEP*(k.r+1)} điểm`:''}</p>
  <button id="olAg">⚔️ Trận mới</button> <button class="ols" id="olHm">Về trang xếp hạng</button></div>`);
  document.getElementById('olAg').onclick=queue;document.getElementById('olHm').onclick=home;if(res===true)fx();OL.m=null;
}
function stop(){clearMM();const M=OL.m;if(M){clearInterval(M.iv);clearTimeout(M.bt);if(!M.done){try{M.s.set('m/'+M.id+'/f',UID)}catch(e){}rkAdd(false)}OL.m=null}}
function fx(){const E=['🎉','🎊','⭐','✨','🏆','🥳'];for(let i=0;i<30;i++){const s=document.createElement('span');s.textContent=E[i%6];s.style.cssText='position:fixed;top:-40px;z-index:100000;font-size:28px;pointer-events:none;left:'+Math.random()*95+'vw;animation:olfall 1.8s ease-in '+Math.random()*.6+'s forwards';document.body.appendChild(s);setTimeout(()=>s.remove(),2600)}}
window.addEventListener('beforeunload',()=>{if(OL.mm)try{OL.mm.S.del('q/'+UID)}catch(e){}});

// ---- giao diện: nút nổi + lớp phủ toàn màn hình (không đụng vào ứng dụng React) ----
function boot(){
  const st=document.createElement('style');st.textContent=`@keyframes olfall{to{transform:translateY(115vh) rotate(400deg);opacity:.3}}
#olBtn{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9998;border:0;border-radius:999px;padding:12px 18px;background:#7c5cff;color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 20px #0008}
#olRoot{display:none;position:fixed;inset:0;z-index:9999;background:#0b0b0d;color:#e4e4e7;overflow:auto;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
.olw{max-width:820px;margin:0 auto;padding:max(14px,env(safe-area-inset-top,0px)) 14px 60px}.olc{background:#18181b;border:1px solid #26262b;border-radius:16px;padding:16px 18px;margin:14px 0}
#olRoot h2,#olRoot h3{margin:.2em 0 .4em}.olr{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.olm{color:#a1a1aa;font-size:.9rem}.olg{color:#22c55e;font-weight:700}.olb{color:#ef4444;word-break:break-word}
#olRoot button{font:inherit;cursor:pointer;border:0;border-radius:10px;padding:9px 16px;background:#7c5cff;color:#fff;font-weight:600}#olRoot button:disabled{opacity:.5}#olRoot button.ols{background:#26262b;color:#e4e4e7}
#olRoot pre{background:#0a0a0c;color:#d6deff;padding:10px;border-radius:10px;overflow-x:auto;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace}#olRoot code{background:#26262b;padding:1px 5px;border-radius:5px}
#olRoot textarea{width:100%;min-height:280px;background:#0a0a0c;color:#d6deff;border:1px solid #3f3f46;border-radius:10px;padding:12px;font:14px/1.5 ui-monospace,Menlo,Consolas,monospace;resize:vertical;box-sizing:border-box}
.olin{background:#0a0a0c;color:#e4e4e7;border:1px solid #3f3f46;border-radius:8px;padding:6px 10px;font:inherit}.olt{font:700 1.6rem ui-monospace,monospace;color:#a78bfa}.olbar{background:#26262b;border-radius:8px;height:14px;overflow:hidden}.olbar div{height:100%;background:#7c5cff}
#olRoot table{width:100%;border-collapse:collapse}#olRoot td,#olRoot th{padding:6px 8px;border-bottom:1px solid #26262b;text-align:left}`;document.head.appendChild(st);
  root=document.createElement('div');root.id='olRoot';document.body.appendChild(root);
  const b=document.createElement('button');b.id='olBtn';b.textContent='⚔️ Thi đấu';b.onclick=open;document.body.appendChild(b);
}
if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot);
})();