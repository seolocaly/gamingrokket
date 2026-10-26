const SHA=(()=>{const K=[],H0=[];let n=2,c=0;const isP=x=>{for(let i=2;i*i<=x;i++)if(x%i===0)return false;return true};
while(c<64){if(isP(n)){if(c<8)H0[c]=(Math.pow(n,1/2)%1)*4294967296|0;K[c]=(Math.pow(n,1/3)%1)*4294967296|0;c++}n++}
const ror=(x,k)=>(x>>>k)|(x<<(32-k));
function hash(msg){const l=msg.length,bl=((l+9+63)>>6)<<6;const m=new Uint8Array(bl);m.set(msg);m[l]=0x80;const dv=new DataView(m.buffer);const bits=l*8;dv.setUint32(bl-4,bits>>>0);dv.setUint32(bl-8,Math.floor(bits/4294967296));
let h=H0.slice();const w=new Int32Array(64);
for(let o=0;o<bl;o+=64){for(let i=0;i<16;i++)w[i]=dv.getInt32(o+i*4);
for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(ror(a,7)^ror(a,18)^(a>>>3))+w[i-7]+(ror(b,17)^ror(b,19)^(b>>>10)))|0}
let [a,b,cc,d,e,f,g,hh]=h;
for(let i=0;i<64;i++){const t1=(hh+(ror(e,6)^ror(e,11)^ror(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0;const t2=((ror(a,2)^ror(a,13)^ror(a,22))+((a&b)^(a&cc)^(b&cc)))|0;hh=g;g=f;f=e;e=(d+t1)|0;d=cc;cc=b;b=a;a=(t1+t2)|0}
h=[h[0]+a|0,h[1]+b|0,h[2]+cc|0,h[3]+d|0,h[4]+e|0,h[5]+f|0,h[6]+g|0,h[7]+hh|0]}
const out=new Uint8Array(32);const ov=new DataView(out.buffer);h.forEach((v,i)=>ov.setInt32(i*4,v));return out}
function hmac(key,msg){if(key.length>64)key=hash(key);const k=new Uint8Array(64);k.set(key);const ip=new Uint8Array(64+msg.length),op=new Uint8Array(96);for(let i=0;i<64;i++){ip[i]=k[i]^0x36;op[i]=k[i]^0x5c}ip.set(msg,64);op.set(hash(ip),64);return hash(op)}
return {hash,hmac}})();
const enc=s=>new TextEncoder().encode(s);
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
/* ===================== utils ===================== */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const fx=m=>(m>=1000?fmt(m,0):(+m).toFixed(2))+'×';
const mc=m=>m<=0?'neg':m<2?'m-lo':m<10?'m-mid':'m-hi';
const rnd=n=>Math.floor(Math.random()*n);
const pickr=a=>a[rnd(a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const randHex=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return hex(a)};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COIN='<svg class="coin" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#26A17B"/><path d="M11.1 8.6V7.3h3V5.4H5.9v1.9h3v1.3c-2.5.1-4.3.6-4.3 1.2s1.8 1.1 4.3 1.2v4.2h2.2v-4.2c2.4-.1 4.2-.6 4.2-1.2s-1.8-1.1-4.2-1.2zm0 2c-.1 0-.5 0-1.1 0-.5 0-.9 0-1.1 0-2.1-.1-3.6-.4-3.6-.8s1.5-.7 3.6-.8v1.4h2.2V9c2.1.1 3.6.4 3.6.8s-1.5.7-3.6.8z" fill="#fff"/></svg>';
/* ===================== state ===================== */
const S={bal:1000,hist:[],tx:[],slip:[],bets:[],wallet:null,wager:0,rbClaimed:0,seed:null,revealed:[],limits:{dep:'None',loss:'None',reminder:'60 min'},user:'pilot_'+randHex(2),sound:true,slipMode:'single',acceptOdds:true,chat:[],won:0};
function newSeed(){const server=randHex(32);return {server,hash:hex(SHA.hash(enc(server))),client:randHex(6),nonce:0}}
try{const d=JSON.parse(localStorage.getItem('rokket2')||'null');if(d)Object.assign(S,d,{slip:[]})}catch(e){}
if(!S.seed)S.seed=newSeed();
let _sv;function save(){clearTimeout(_sv);_sv=setTimeout(()=>{try{localStorage.setItem('rokket2',JSON.stringify({...S,hist:S.hist.slice(0,80),chat:[]}))}catch(e){}},200)}
/* ===================== provably fair ===================== */
function floats(server,client,nonce,count){const out=[];let cur=0;while(out.length<count){const h=SHA.hmac(enc(server),enc(client+':'+nonce+':'+cur));for(let i=0;i<32&&out.length<count;i+=4)out.push(h[i]/256+h[i+1]/65536+h[i+2]/16777216+h[i+3]/4294967296);cur++}return out}
function draw(n){const s=S.seed;const nonce=s.nonce++;save();const el=$('#nonce');if(el)el.textContent=s.nonce;return {f:floats(s.server,s.client,nonce,n),nonce}}
const limboRes=f=>Math.min(1e6,Math.max(1,Math.floor(99/(1-f))/100));
const diceRoll=f=>Math.floor(f*10001)/100;
function shuffle(fs,n){const a=[...Array(n).keys()];for(let i=n-1;i>0;i--){const j=Math.floor(fs[n-1-i]*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* ===================== sound (synthesised, no files) ===================== */
const SND={ctx:null,master:null,
 init(){if(this.ctx)return;try{const C=window.AudioContext||window.webkitAudioContext;this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=.5;this.master.connect(this.ctx.destination)}catch(e){}},
 ok(){if(!S.sound)return false;this.init();if(!this.ctx)return false;if(this.ctx.state==='suspended')this.ctx.resume();return true},
 t(f,d,o={}){if(!this.ok())return;const c=this.ctx,t0=c.currentTime+(o.delay||0),os=c.createOscillator(),g=c.createGain();os.type=o.type||'sine';os.frequency.setValueAtTime(f,t0);if(o.slide)os.frequency.exponentialRampToValueAtTime(Math.max(30,f*o.slide),t0+d);g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(o.vol??.18,t0+.008);g.gain.exponentialRampToValueAtTime(.0008,t0+d);os.connect(g);g.connect(this.master);os.start(t0);os.stop(t0+d+.02)},
 n(d,o={}){if(!this.ok())return;const c=this.ctx,t0=c.currentTime+(o.delay||0),len=Math.floor(c.sampleRate*d),b=c.createBuffer(1,len,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<len;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/len,o.decay||2);const s=c.createBufferSource();s.buffer=b;const fl=c.createBiquadFilter();fl.type=o.ft||'lowpass';fl.frequency.value=o.f||1200;const g=c.createGain();g.gain.value=o.vol??.3;s.connect(fl);fl.connect(g);g.connect(this.master);s.start(t0)},
 click(){this.t(660,.05,{type:'triangle',vol:.08})},
 bet(){this.t(420,.07,{type:'triangle',vol:.12});this.t(640,.08,{type:'triangle',vol:.1,delay:.05})},
 tick(p=1){this.t(1800*p,.025,{type:'square',vol:.03})},
 ping(i=0){this.t(700+i*55,.12,{type:'sine',vol:.09})},
 gem(k=0){this.t(880*Math.pow(1.06,k),.14,{type:'triangle',vol:.12});this.t(1320*Math.pow(1.06,k),.18,{type:'sine',vol:.07,delay:.04})},
 win(){[523,659,784].forEach((f,i)=>this.t(f,.16,{type:'triangle',vol:.13,delay:i*.07}))},
 big(){[523,659,784,1047,1319].forEach((f,i)=>this.t(f,.28,{type:'triangle',vol:.14,delay:i*.08}));this.n(.6,{ft:'highpass',f:5000,vol:.06,delay:.3})},
 lose(){this.t(220,.28,{type:'sawtooth',vol:.06,slide:.5})},
 cash(){this.t(988,.09,{type:'square',vol:.06});this.t(1319,.22,{type:'triangle',vol:.12,delay:.07})},
 boom(){this.n(.9,{f:600,vol:.5,decay:3});this.t(90,.6,{type:'sine',vol:.35,slide:.4})},
 deal(){this.n(.12,{ft:'highpass',f:2500,vol:.12,decay:4})},
 chip(){this.t(2400,.04,{type:'square',vol:.04});this.t(1800,.05,{type:'triangle',vol:.05,delay:.03})},
 hum:null,
 humStart(){if(!this.ok()||this.hum)return;const c=this.ctx,o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();o.type='sawtooth';o2.type='sine';o.frequency.value=70;o2.frequency.value=140;f.type='lowpass';f.frequency.value=500;g.gain.value=0;g.gain.linearRampToValueAtTime(.06,c.currentTime+.3);o.connect(f);o2.connect(f);f.connect(g);g.connect(this.master);o.start();o2.start();this.hum={o,o2,g,f}},
 humSet(m){if(!this.hum)return;const v=70+Math.log(m)*60;this.hum.o.frequency.value=v;this.hum.o2.frequency.value=v*2;this.hum.f.frequency.value=500+Math.log(m)*500},
 humStop(){if(!this.hum)return;const h=this.hum;this.hum=null;try{h.g.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.15);h.o.stop(this.ctx.currentTime+.2);h.o2.stop(this.ctx.currentTime+.2)}catch(e){}}};
addEventListener('pointerdown',()=>{if(S.sound)SND.init()},{once:true});
/* ===================== visual fx: confetti + big win ===================== */
const FX={parts:[],run:false,
 burst(x,y,n=90,cols=['#FFC23D','#FF9A1F','#22E39A','#8A6BFF','#F4F1FF']){const c=$('#fx');if(!c)return;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=4+Math.random()*9;this.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-6,r:3+Math.random()*4,c:pickr(cols),life:1,rot:Math.random()*6,vr:(Math.random()-.5)*.4,sq:Math.random()<.5})}if(!this.run){this.run=true;requestAnimationFrame(t=>this.loop(t))}},
 loop(){const c=$('#fx');const dpr=Math.min(2,devicePixelRatio||1);if(c.width!==innerWidth*dpr){c.width=innerWidth*dpr;c.height=innerHeight*dpr}const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,innerWidth,innerHeight);
  this.parts=this.parts.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.32;p.vx*=.985;p.rot+=p.vr;p.life-=.011;x.globalAlpha=Math.max(0,p.life);x.fillStyle=p.c;x.save();x.translate(p.x,p.y);x.rotate(p.rot);if(p.sq)x.fillRect(-p.r,-p.r/2,p.r*2,p.r);else{x.beginPath();x.arc(0,0,p.r*.7,0,7);x.fill()}x.restore();return p.life>0&&p.y<innerHeight+30});x.globalAlpha=1;
  if(this.parts.length)requestAnimationFrame(t=>this.loop(t));else{this.run=false;x.clearRect(0,0,innerWidth,innerHeight)}}};
let _bw;function bigWin(pay,mult,game){if(matchMedia('(prefers-reduced-motion: reduce)').matches){toast(`Big win · ${fmt(pay)} USDT`,'w');return}
 const el=document.createElement('div');el.className='bigwin';el.innerHTML=`<div class="in"><div class="lbl">${mult>=50?'MEGA WIN':'BIG WIN'}</div><div class="amt num" id="bwamt">+0.00</div><div class="mx">${GAMES[game]?.name||''} · ${fx(mult)}</div><button class="btn sm" style="margin-top:14px" onclick="shareSheet('${game}',${mult},${pay})">Share this win</button></div>`;
 document.body.appendChild(el);SND.big();FX.burst(innerWidth/2,innerHeight/2,140);setTimeout(()=>FX.burst(innerWidth*.25,innerHeight*.4,60),250);setTimeout(()=>FX.burst(innerWidth*.75,innerHeight*.4,60),450);
 countUp($('#bwamt',el),0,pay,1100,v=>'+'+fmt(v));clearTimeout(_bw);_bw=setTimeout(()=>el.remove(),3200);el.onclick=()=>el.remove()}
function countUp(el,a,b,dur,f){const t0=performance.now();(function s(n){const k=Math.min(1,(n-t0)/dur);const v=a+(b-a)*(1-Math.pow(1-k,3));el.textContent=f(v);if(k<1)requestAnimationFrame(s)})(t0)}
/* ===================== ui helpers ===================== */
function toast(t,cls=''){const el=document.createElement('div');el.className='toast '+cls;el.textContent=t;$('#toasts').appendChild(el);setTimeout(()=>el.remove(),2800);while($('#toasts').children.length>3)$('#toasts').firstChild.remove()}
function sheet(html){$('#modal').innerHTML=`<div class="scrim" onclick="if(event.target===this)closeSheet()"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`}
function closeSheet(){$('#modal').innerHTML=''}
function updBal(bump){const v=$('#balv');if(v)v.textContent=fmt(S.bal);if(bump){const b=$('.bal');b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump')}save()}
function debit(a){a=+a;if(!(a>0)){toast('Enter a bet amount','e');return false}if(a>S.bal+1e-9){toast('Not enough balance. Add demo funds in Wallet','e');return false}S.bal-=a;updBal();return true}
function copyText(t){try{navigator.clipboard.writeText(t).then(()=>toast('Copied to clipboard'),()=>toast(t))}catch(e){toast(t)}}
function avatar(name){let h=0;for(const c of name)h=(h*31+c.charCodeAt(0))%360;return `<span class="av" style="background:hsl(${h} 55% 42%)">${esc(name.replace(/^0x/,'')[0]||'?').toUpperCase()}</span>`}
const NAMES=['nightowl','0x9f…c21','satoshi_jr','lunarbet','mr.degen','kiraX','hodl.queen','alpha_wolf','0x3b…77e','tako_san','zkmaxi','moonbag','vexx','rekt_no_more','gm.anon','bigblind','ramen_ape','solsurfer','0xa1…9d0','lagos_lion','manila.mike','bruno_br','istanbul_ace','kazbek','nairobi_k','santiago.eth','hanoi_hi','cairo.coin','lima_lucky','jakarta_j'];
/* ===================== settle / history / feed ===================== */
const FEED=[];
function pushFeed(r){FEED.unshift({...r,id:Math.random()});FEED.length=Math.min(FEED.length,12);if(typeof renderFeed==='function')renderFeed(r)}
function settle(game,bet,mult,nonce,opt={}){const pay=+(bet*mult).toFixed(8);S.bal+=pay;S.wager+=bet;if(pay>bet)S.won+=pay-bet;
 S.hist.unshift({game,bet,mult,pay,nonce,t:Date.now()});S.hist.length=Math.min(S.hist.length,200);updBal(pay>0);
 pushFeed({name:S.user,game,bet,mult,pay,me:true});
 if(!opt.quiet){if(mult>=10&&pay>=bet*10&&!opt.fast)bigWin(pay,mult,game);else if(pay>bet){SND.win();if(mult>=3&&!opt.fast){const st=$('.g-stage');if(st){const r=st.getBoundingClientRect();FX.burst(r.left+r.width/2,r.top+r.height/2,50)}}}else if(!opt.silentLoss)SND.lose()}
 return pay}
/* ===================== autobet + bet panel ===================== */
function amtField(id,def=1,label='Bet amount'){return `<div class="field"><label class="label" for="${id}">${label}</label><div class="inp">${COIN}<input id="${id}" type="number" min="0" step="0.01" value="${def}" inputmode="decimal"><button type="button" onclick="amt('${id}',.5)">½</button><button type="button" onclick="amt('${id}',2)">2×</button><button type="button" onclick="amt('${id}',0)">Max</button></div></div>`}
function amt(id,k){const i=document.getElementById(id);if(!i||i.disabled)return;SND.click();i.value=k===0?Math.floor(S.bal*100)/100:Math.max(.1,Math.round(+i.value*k*100)/100);i.dispatchEvent(new Event('input'))}
const val=id=>+(document.getElementById(id)?.value||0);
function panelHead(auto=true){return auto?`<div class="seg" id="gmode"><button class="on" data-m="manual">Manual</button><button data-m="auto">Auto</button></div>`:''}
function autoFields(){return `<div class="auto-only stack" style="gap:10px"><div class="grid2"><div class="field"><label class="label" for="a-n">Number of bets</label><div class="inp"><input id="a-n" type="number" min="0" value="20"><span class="suf">0 = ∞</span></div></div><div class="field"><label class="label" for="a-speed">Speed</label><div class="inp"><select id="a-speed"><option value="1">Normal</option><option value="2">Fast</option></select></div></div></div>
 <div class="grid2"><div class="field"><label class="label" for="a-win">On win</label><div class="inp"><select id="a-wm" style="flex:0 0 92px"><option value="reset">Reset</option><option value="inc">Increase</option></select><input id="a-win" type="number" value="0"><span class="suf">%</span></div></div><div class="field"><label class="label" for="a-loss">On loss</label><div class="inp"><select id="a-lm" style="flex:0 0 92px"><option value="reset">Reset</option><option value="inc">Increase</option></select><input id="a-loss" type="number" value="0"><span class="suf">%</span></div></div></div>
 <div class="grid2"><div class="field"><label class="label" for="a-sp">Stop on profit</label><div class="inp"><input id="a-sp" type="number" value="0"></div></div><div class="field"><label class="label" for="a-sl">Stop on loss</label><div class="inp"><input id="a-sl" type="number" value="0"></div></div></div></div>`}
let AUTO=null;
function wireMode(onChange){const seg=$('#gmode');if(!seg)return;seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(AUTO)return;SND.click();seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));$('.g-panel').classList.toggle('auto',b.dataset.m==='auto');onChange&&onChange(b.dataset.m)})}
const isAuto=()=>$('.g-panel')?.classList.contains('auto');
async function runAuto(btn,amtId,once){if(AUTO){AUTO.stop=true;return}const base=val(amtId);if(!(base>0)){toast('Enter a bet amount','e');return}
 const n=val('a-n'),wm=$('#a-wm').value,lm=$('#a-lm').value,wp=val('a-win'),lp=val('a-loss'),sp=val('a-sp'),sl=val('a-sl'),fast=$('#a-speed').value==='2';
 AUTO={stop:false};const me=AUTO;let bet=base,profit=0,i=0;btn.textContent='Stop autobet';btn.classList.remove('primary');btn.classList.add('danger');$('#gmode')?.classList.add('busy');$(`#${amtId}`).disabled=true;
 try{while(!me.stop&&(n<=0||i<n)){if(bet>S.bal){toast('Autobet stopped: not enough balance','e');break}
  const pay=await once(bet,fast);if(pay==null)break;i++;profit+=pay-bet;const pe=$('#a-profit');if(pe){pe.textContent=(profit>=0?'+':'')+fmt(profit);pe.className='num '+(profit>=0?'pos':'lossc')}const ce=$('#a-count');if(ce)ce.textContent=i;
  if(pay>bet)bet=wm==='inc'?+(bet*(1+wp/100)).toFixed(2):base;else bet=lm==='inc'?+(bet*(1+lp/100)).toFixed(2):base;
  if(sp>0&&profit>=sp){toast('Autobet stopped: profit target reached','w');break}if(sl>0&&-profit>=sl){toast('Autobet stopped: loss limit reached','e');break}
  if(!document.body.contains(btn))break;await sleep(fast?60:350)}}
 finally{if(AUTO===me)AUTO=null;if(document.body.contains(btn)){btn.textContent='Start autobet';btn.classList.add('primary');btn.classList.remove('danger');const a=$(`#${amtId}`);if(a)a.disabled=false}}}
function fairLine(){return `<div class="fair"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>Provably fair · seed <code>${S.seed.hash.slice(0,10)}…</code> · nonce <code id="nonce">${S.seed.nonce}</code><a class="btn ghost sm" onclick="go('fairness')">Verify</a></div>`}
function histChips(g,n=16){return S.hist.filter(x=>x.game===g).slice(0,n).map(x=>`<span class="${mc(x.mult)}">${fx(x.mult)}</span>`).join('')}
function pushHist(g){const h=$('.g-hist');if(h)h.innerHTML=histChips(g)}
