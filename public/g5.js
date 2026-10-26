/* ===================== TRX HASH: TRON block-hash number game ===================== */
/* Result = last decimal digit found when reading the draw block's hash from the end.
   Draw block = first TRON block whose timestamp is at or after the period end. */
const TRX={mode:'demo',modes:[1,3,5],sel:1,blocks:[],draws:{},seed:randHex(16),demoBase:0,lockSec:5,fee:.02,listeners:new Set(),last:0};
const trxDigit=h=>{for(let i=h.length-1;i>=0;i--){const c=h[i];if(c>='0'&&c<='9')return {d:+c,i}}return {d:0,i:h.length-1}};
const trxCol=n=>n===0?['red','violet']:n===5?['green','violet']:n%2?['green']:['red'];
const TRXC={green:'#22C55E',red:'#EF4444',violet:'#A855F7'};
const trxBig=n=>n>=5?'Big':'Small';
function trxPid(start,m){const d=new Date(start);const day=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());const idx=Math.floor((start-day)/(m*60e3))+1;return `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}${m}${String(idx).padStart(4,'0')}`}
function trxPeriod(m,t=Date.now()){const L=m*60e3,start=Math.floor(t/L)*L;return {m,start,end:start+L,pid:trxPid(start,m)}}
/* demo chain: deterministic 3-second blocks for this session */
TRX.demoBase=88000000-Math.floor(Date.UTC(2026,9,1)/3000);
const demoBlock=n=>({n,ts:(n-TRX.demoBase)*3000,h:n.toString(16).padStart(16,'0')+hex(SHA.hmac(enc(TRX.seed),enc('blk'+n))).slice(16)});
function demoDraw(end){const n=TRX.demoBase+Math.ceil(end/3000);const b=demoBlock(n);if(b.ts>Date.now())return null;return b}
function trxDraw(per){if(TRX.mode==='live'){return TRX.draws[per.pid]||null}const b=demoDraw(per.end);if(!b)return null;const {d}=trxDigit(b.h);return {pid:per.pid,n:b.n,h:b.h,ts:b.ts,num:d}}
function trxRecentBlocks(k=7){if(TRX.mode==='live')return TRX.blocks.slice(-k);const n=TRX.demoBase+Math.floor(Date.now()/3000);return Array.from({length:k},(_,i)=>demoBlock(n-k+1+i))}
function trxHistory(m,k=12){const out=[];let per=trxPeriod(m);for(let i=0;i<k+1&&out.length<k;i++){per=trxPeriod(m,per.start-1);const d=trxDraw(per);if(d)out.push({...d,pid:per.pid,end:per.end})}return out}
/* bets */
S.trx=S.trx||[];
const trxMult=(sel,n)=>{if(sel[0]==='n')return +sel.slice(1)===n?9:0;if(sel==='big')return n>=5?2:0;if(sel==='small')return n<=4?2:0;if(sel==='violet')return (n===0||n===5)?4.5:0;if(sel==='green')return n===5?1.5:[1,3,7,9].includes(n)?2:0;if(sel==='red')return n===0?1.5:[2,4,6,8].includes(n)?2:0;return 0};
const trxSelName=s=>s[0]==='n'?`Number ${s.slice(1)}`:s[0].toUpperCase()+s.slice(1);
for(const b of S.trx)if(b.status==='open'&&b.src==='demo'&&b.seed!==TRX.seed){b.status='void';S.bal+=b.amt}
function trxPlace(sel,amt){const per=trxPeriod(TRX.sel);const left=(per.end-Date.now())/1000;if(left<=TRX.lockSec){toast('Betting is closed for this period','e');return}
 if(!debit(amt))return;S.trx.unshift({id:Date.now()+Math.random(),m:TRX.sel,pid:per.pid,end:per.end,sel,amt,status:'open',src:TRX.mode,seed:TRX.seed,t:Date.now()});S.trx.length=Math.min(S.trx.length,120);save();SND.chip();toast(`${trxSelName(sel)} · ${fmt(amt)} USDT on period ${per.pid.slice(-5)}`,'w');TRX.listeners.forEach(f=>f('bet'))}
function trxSettle(){let changed=false;for(const b of S.trx){if(b.status!=='open')continue;if(Date.now()<b.end)continue;const d=trxDraw({pid:b.pid,end:b.end,m:b.m});if(!d){if(Date.now()-b.end>10*60e3&&TRX.mode==='demo'){b.status='void';S.bal+=b.amt;changed=true}continue}
  const mult=trxMult(b.sel,d.num);const pay=+(b.amt*(1-TRX.fee)*mult).toFixed(4);b.status=pay>0?'won':'lost';b.num=d.num;b.pay=pay;b.block=d.n;changed=true;
  S.bal+=pay;S.wager+=b.amt;if(pay>b.amt)S.won+=pay-b.amt;S.hist.unshift({game:'trx',bet:b.amt,mult:pay/b.amt,pay,nonce:'#'+d.n,t:Date.now()});pushFeed({name:S.user,game:'trx',bet:b.amt,mult:pay/b.amt,pay,me:true});
  if(pay>0){updBal(true);toast(`TRX ${b.m}m · ${d.num} · ${trxSelName(b.sel)} won ${fmt(pay)} USDT`,'w');if(ROUTE==='game/trx')SND.win()}else updBal()}
 if(changed){save();TRX.listeners.forEach(f=>f('settle'))}}
setInterval(trxSettle,1000);
/* live TRON blocks from the Rokket server (SSE event "tron") */
function trxApply(d){if(!d||!d.blocks)return;TRX.mode='live';TRX.blocks=d.blocks;for(const x of d.draws||[])TRX.draws[x.pid]=x;TRX.last=Date.now();TRX.listeners.forEach(f=>f('block'))}
async function trxInit(){try{const r=await fetch('/api/tron',{cache:'no-store'});if(r.ok&&(r.headers.get('content-type')||'').includes('json')){trxApply(await r.json());liveSource('/api/tron/stream','/api/tron',trxApply,3000)}}catch(e){}}
trxInit();
/* fake crowd for the lobby feel */
const TRXCROWD={};function crowdFor(pid){if(!TRXCROWD[pid]){const n=30+rnd(60);TRXCROWD[pid]=Array.from({length:n},()=>({name:pickr(NAMES),sel:pickr(['green','red','violet','big','small','n'+rnd(10)]),amt:+(Math.random()**2*200+1).toFixed(0)}))}return TRXCROWD[pid]}
/* ---------- UI ---------- */
function trxBall(n,size=30){const c=trxCol(n);const bg=c.length>1?`linear-gradient(135deg,${TRXC[c[0]]} 50%,${TRXC[c[1]]} 50%)`:TRXC[c[0]];return `<span class="tball" style="width:${size}px;height:${size}px;background:${bg};font-size:${size*.48}px">${n}</span>`}
function hashHTML(h,full){const {i}=trxDigit(h);const s=full?h:h.slice(-14);const off=full?0:h.length-14;return `<span class="num">${full?'':'…'}${esc(s.slice(0,i-off))}<b style="color:var(--gold-text);background:rgba(255,194,61,.15);border-radius:3px;padding:0 2px">${h[i]}</b>${esc(s.slice(i-off+1))}</span>`}
GAMEVIEWS.trx=box=>{let tab='hist',lastPid='',lastRevealPid='';
 box.innerHTML=`<div class="trxtabs" id="trxtabs">${TRX.modes.map(m=>`<button data-m="${m}" class="${m===TRX.sel?'on':''}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg><b>TRX ${m} min</b></button>`).join('')}</div>
 <div class="game"><div class="g-panel">
  <div class="trxhead"><div><span class="label">Period</span><b class="num" id="tpid"></b><span class="small muted" id="tsrc"></span></div><div style="text-align:right"><span class="label">Time left</span><div class="tclock num" id="tclk">00:00</div></div></div>
  ${amtField('trx-amt',10,'Amount per bet')}
  <div class="row" id="tmul">${[1,5,10,20,50,100].map(x=>`<button class="chip ${x===1?'on':''}" data-x="${x}">×${x}</button>`).join('')}</div>
  <div class="tcolors"><button class="tc g" data-s="green"><b>Green</b><small>2× · 1.5× on 5</small></button><button class="tc v" data-s="violet"><b>Violet</b><small>4.5×</small></button><button class="tc r" data-s="red"><b>Red</b><small>2× · 1.5× on 0</small></button></div>
  <div class="tnums" id="tnums">${[0,1,2,3,4,5,6,7,8,9].map(n=>`<button data-s="n${n}" aria-label="Number ${n}">${trxBall(n,40)}<small>9×</small></button>`).join('')}</div>
  <div class="tbs"><button class="big" data-s="big"><b>Big</b><small>5–9 · 2×</small></button><button class="small" data-s="small"><b>Small</b><small>0–4 · 2×</small></button></div>
  <div class="tlock" id="tlock" hidden><span class="num" id="tlockn">5</span><small>Betting closed · drawing</small></div>
  <div class="card" style="background:var(--surface-sunken);padding:12px"><div class="profit" style="margin-bottom:6px"><b style="color:var(--ink)">Your bets this period</b><span id="tmine-tot" class="num"></span></div><div id="tmine" class="small"></div></div>
 </div>
 ${ST('st3','style="min-height:clamp(320px,50vh,520px)"')}</div>
 <div class="card"><div class="seg" id="ttab" style="max-width:420px;margin-bottom:12px"><button data-t="hist" class="on">Game history</button><button data-t="chart">Chart</button><button data-t="mine">My history</button><button data-t="rules">Rules</button></div><div id="tbody"></div></div>`;
 const ov=$('#ov'),st=$('#st3');ov.style.paddingTop='48px';
 /* 3D: chain of TRON blocks */
 const ctx=mk3(st,{pos:[0,3.2,12],target:[0,.6,0],bg:'#1A0A14',fov:40,fit:[10.5,6.4],keyPos:[4,10,8]});let cubes=new Map(),ball=null,ring;
 const blockTex=(b,hl)=>G3.tex(256,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,hl?'#3A2A08':'#3A0E1C');g.addColorStop(1,hl?'#1E1404':'#1A060E');x.fillStyle=g;x.fillRect(0,0,w,h);x.strokeStyle=hl?'#FFC23D':'#FF3B5C';x.lineWidth=10;x.strokeRect(5,5,w-10,h-10);
  x.fillStyle=hl?'#FFC23D':'#FF8FA3';x.font='800 22px Manrope,sans-serif';x.textAlign='center';x.fillText('TRON BLOCK',w/2,50);x.fillStyle='#fff';x.font='700 34px "Chakra Petch",monospace';x.fillText('#'+b.n.toLocaleString('en-US'),w/2,100);
  x.font='600 20px "Chakra Petch",monospace';x.fillStyle='#C8B8FF';const s=b.h.slice(-16);x.fillText(s.slice(0,8),w/2,150);const {i,d}=trxDigit(b.h);x.fillText(s.slice(8),w/2,178);x.fillStyle='#FFC23D';x.font='800 46px "Chakra Petch",monospace';x.fillText(String(d),w/2,232)});
 if(ctx){const sc=ctx.scene;sc.add(G3.stars(800,90,.25));const rail=new THREE.Mesh(new THREE.BoxGeometry(30,.08,.08),G3.glow('#FF3B5C',.6));rail.position.y=-.2;sc.add(rail);const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,30),G3.std('#120610',{r:.35,m:.4,env:.6}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.4;floor.receiveShadow=true;sc.add(floor);
  ring=new THREE.Mesh(new THREE.TorusGeometry(1.25,.06,10,64),G3.glow('#FFC23D',.0));sc.add(ring);
  ctx.add((dt,t)=>{for(const [n,c] of cubes){c.position.x+=(c.userData.tx-c.position.x)*Math.min(1,dt*4);c.position.y+=(c.userData.ty-c.position.y)*Math.min(1,dt*4);c.rotation.y=Math.sin(t*.6+n)*.12;if(c.userData.dead){c.scale.multiplyScalar(1-dt*3);if(c.scale.x<.05){sc.remove(c);c.material.forEach(m=>{m.map&&m.map.dispose();m.dispose()});c.geometry.dispose();cubes.delete(n)}}}
   if(ball){ball.rotation.y+=dt*1.2;ball.position.y=2.9+Math.sin(t*2)*.08}ring.rotation.z+=dt;ring.material.opacity*=Math.pow(.4,dt)})}
 const drawSel=()=>{const per=trxPeriod(TRX.sel);const bl=trxRecentBlocks(7);if(ctx){const keep=new Set(bl.map(b=>b.n));for(const [n,c] of cubes)if(!keep.has(n))c.userData.dead=true;
   const drawN=TRX.mode==='demo'?TRX.demoBase+Math.ceil(per.start/3000):null;
   bl.forEach((b,i)=>{let c=cubes.get(b.n);const hl=TRX.mode==='live'?Object.values(TRX.draws).some(d=>d.n===b.n):b.n===drawN;if(!c){const mt=new THREE.MeshStandardMaterial({map:blockTex(b,hl),roughness:.4,metalness:.2});const side=G3.std(hl?'#FFC23D':'#C81E3C',{r:.35,m:.5,e:hl?'#5A3A00':'#3A0010',ei:.6});c=new THREE.Mesh(new THREE.BoxGeometry(1.25,1.25,1.25),[side,side,side,side,mt,side]);c.castShadow=true;c.position.set(9,.5,0);ctx.scene.add(c);cubes.set(b.n,c);if(i===bl.length-1&&TRX.started)SND.tick(.4)}
    c.userData.tx=(i-(bl.length-1))*1.5+4.5;c.userData.ty=.5})}TRX.started=true};
 const reveal=(d)=>{if(!ctx)return;if(ball){ctx.scene.remove(ball);ball.material.map&&ball.material.map.dispose()}const c=trxCol(d.num);const tx=G3.tex(256,128,(x,w,h)=>{if(c.length>1){x.fillStyle=TRXC[c[0]];x.fillRect(0,0,w/2,h);x.fillStyle=TRXC[c[1]];x.fillRect(w/2,0,w/2,h)}else{x.fillStyle=TRXC[c[0]];x.fillRect(0,0,w,h)}x.fillStyle='rgba(255,255,255,.92)';x.beginPath();x.ellipse(64,64,30,40,0,0,7);x.fill();x.beginPath();x.ellipse(192,64,30,40,0,0,7);x.fill();x.fillStyle='#111';x.font='900 52px "Chakra Petch",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(d.num,64,68);x.fillText(d.num,192,68)});
  ball=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),new THREE.MeshStandardMaterial({map:tx,roughness:.2,metalness:.1}));ball.position.set(-3.6,2.9,1.2);ball.scale.setScalar(.01);ball.castShadow=true;ctx.scene.add(ball);ring.position.copy(ball.position);ring.material.opacity=1;
  ctx.tween(.6,k=>ball.scale.setScalar(Math.max(.01,G3.ease.outBack(k))));G3.burst(ctx,ball.position.clone(),{n:90,speed:5,g:3,colors:c.map(x=>TRXC[x]).concat(['#fff','#FFC23D'])})};
 const mineHTML=()=>{const per=trxPeriod(TRX.sel);const mine=S.trx.filter(b=>b.pid===per.pid&&b.m===TRX.sel);$('#tmine-tot').textContent=mine.length?fmt(mine.reduce((a,b)=>a+b.amt,0))+' USDT':'';return mine.length?mine.map(b=>`<div class="kv" style="padding:6px 0"><span>${trxSelName(b.sel)}</span><span class="num">${fmt(b.amt)}</span></div>`).join(''):'<span class="muted">No bets yet. Pick a colour, number or size.</span>'};
 const bodyHTML=()=>{if(tab==='hist'){const h=trxHistory(TRX.sel,12);return `${TRX.mode==='demo'?'<p class="small" style="color:var(--warn);margin:0 0 10px">Demo chain: simulated TRON-style blocks for this preview. On the Rokket server these are real TRON mainnet blocks with Tronscan links.</p>':''}<div class="tblwrap"><table class="tbl"><thead><tr><th>Period</th><th>Block</th><th>Block hash</th><th class="r">Result</th><th class="r">Size</th><th class="r">Colour</th></tr></thead><tbody>${h.map(d=>`<tr><td class="num">${d.pid}</td><td class="num">${TRX.mode==='live'?`<a href="https://tronscan.org/#/block/${d.n}" target="_blank" rel="noopener" style="color:var(--gold-text)">${d.n.toLocaleString('en-US')}</a>`:d.n.toLocaleString('en-US')}</td><td>${hashHTML(d.h)}</td><td class="r">${trxBall(d.num,26)}</td><td class="r">${trxBig(d.num)}</td><td class="r">${trxCol(d.num).map(c=>`<span class="tdot" style="background:${TRXC[c]}"></span>`).join('')}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">Waiting for the first draw</td></tr>'}</tbody></table></div>`}
  if(tab==='chart'){const h=trxHistory(TRX.sel,20);const cnt=Array(10).fill(0);h.forEach(d=>cnt[d.num]++);return `<div class="tchart">${h.map(d=>`<div class="tcrow"><span class="num faint">${d.pid.slice(-4)}</span>${[0,1,2,3,4,5,6,7,8,9].map(n=>n===d.num?trxBall(n,22):`<span class="tcell">${n}</span>`).join('')}<span class="small" style="width:44px;text-align:right">${trxBig(d.num)}</span></div>`).join('')}<div class="tcrow" style="border-top:1px solid var(--line);padding-top:8px"><span class="label">Hits</span>${cnt.map(c=>`<span class="tcell num" style="color:var(--ink)">${c}</span>`).join('')}<span></span></div></div>`}
  if(tab==='mine'){const l=S.trx.slice(0,30);return l.length?`<div class="tblwrap"><table class="tbl"><thead><tr><th>Period</th><th>Bet</th><th class="r">Amount</th><th class="r">Result</th><th class="r">Payout</th></tr></thead><tbody>${l.map(b=>`<tr><td class="num">${b.pid} <span class="faint">${b.m}m</span></td><td>${trxSelName(b.sel)}</td><td class="r num">${fmt(b.amt)}</td><td class="r">${b.num!=null?trxBall(b.num,24):`<span class="st-${b.status==='void'?'lost':'open'}">${b.status}</span>`}</td><td class="r num ${b.status==='won'?'pos':'neg'}">${b.status==='won'?'+'+fmt(b.pay):b.status==='lost'?'0.00':'—'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No TRX bets yet</div>'}
  return `<div class="stack small" style="max-width:72ch;line-height:1.6"><p><b>How a result is made.</b> Each period ends on the clock. The first TRON block produced at or after that moment is the draw block. Read its block hash from the right; the first digit (0–9) you meet is the result. Nobody can know a block hash before the TRON network produces it, and anyone can look the block up on Tronscan.</p>
   <div class="tblwrap"><table class="tbl"><thead><tr><th>Bet</th><th>Wins on</th><th class="r">Pays</th></tr></thead><tbody>${[['Green','1, 3, 7, 9 · and 5','2× · 1.5× on 5'],['Red','2, 4, 6, 8 · and 0','2× · 1.5× on 0'],['Violet','0, 5','4.5×'],['Number','that number','9×'],['Big','5–9','2×'],['Small','0–4','2×']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="r num">${r[2]}</td></tr>`).join('')}</tbody></table></div>
   <p class="muted">A ${TRX.fee*100}% service fee is taken from each stake before payout, so a 100 USDT bet plays as ${100*(1-TRX.fee)} USDT. Betting closes ${TRX.lockSec} seconds before each period ends. Return to player: Big/Small 98%, Green/Red 93.1%, Violet and Number 88.2%.</p></div>`};
 const renderBody=()=>{const b=$('#tbody');if(b)b.innerHTML=bodyHTML()};
 let mult=1;$$('#tmul .chip').forEach(c=>c.onclick=()=>{mult=+c.dataset.x;SND.click();$$('#tmul .chip').forEach(x=>x.classList.toggle('on',x===c))});
 $$('[data-s]',box).forEach(b=>b.onclick=()=>{trxPlace(b.dataset.s,+(val('trx-amt')*mult).toFixed(2));$('#tmine').innerHTML=mineHTML()});
 $$('#trxtabs button').forEach(b=>b.onclick=()=>{TRX.sel=+b.dataset.m;SND.click();$$('#trxtabs button').forEach(x=>x.classList.toggle('on',x===b));lastPid='';lastRevealPid='';tick();renderBody()});
 $$('#ttab button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;$$('#ttab button').forEach(x=>x.classList.toggle('on',x===b));renderBody()});
 const tick=()=>{const per=trxPeriod(TRX.sel);const left=Math.max(0,Math.ceil((per.end-Date.now())/1000));const mm=String(Math.floor(left/60)).padStart(2,'0'),ss=String(left%60).padStart(2,'0');const c=$('#tclk');if(!c)return;c.textContent=`${mm}:${ss}`;
  $('#tpid').textContent=per.pid;$('#tsrc').innerHTML=TRX.mode==='live'?' · <span style="color:var(--win)">TRON mainnet</span>':' · demo chain';
  const locked=left<=TRX.lockSec;$('#tlock').hidden=!locked;$('.g-panel').classList.toggle('trxlocked',locked);if(locked){$('#tlockn').textContent=left;if(left>0&&left!==tick.ls){SND.tick(.8);tick.ls=left}}
  if(per.pid!==lastPid){lastPid=per.pid;$('#tmine').innerHTML=mineHTML();renderBody()}
  const prev=trxPeriod(TRX.sel,per.start-1);const d=trxDraw(prev);
  const crowd=crowdFor(per.pid);const pot=crowd.reduce((a,x)=>a+x.amt,0);
  const top=`<div class="pill" style="margin-bottom:8px;font-size:14px;${locked?'color:#FF8FA3;border-color:rgba(255,59,92,.5)':''}">Period ${per.pid.slice(-5)} · <b class="num">${mm}:${ss}</b> ${locked?'· closed':'left'}</div>`;
  ov.innerHTML=top+(d?`<div class="sub" style="color:var(--ink-muted)">Last draw ${prev.pid.slice(-5)} · block #${d.n.toLocaleString('en-US')}</div><div class="pill" style="margin-top:8px">${hashHTML(d.h)}</div><div class="pill" style="margin-top:6px">${d.num} · ${trxBig(d.num)} · ${trxCol(d.num).join(' + ')}</div>`:`<div class="sub" style="color:var(--ink-muted)">Drawing period ${prev.pid.slice(-5)}</div><div class="pill">Waiting for the next TRON block…</div>`);
  ov.insertAdjacentHTML('beforeend',`<div class="pill" style="margin-top:auto;margin-bottom:14px">${crowd.length} players · ${fmt(pot,0)} USDT this period</div>`);ov.style.height='100%';
  if(d&&d.pid!==lastRevealPid){const first=!lastRevealPid;lastRevealPid=d.pid;reveal(d);if(!first){SND.ping(d.num);renderBody()}}
  drawSel()};
 const listener=()=>{tick();$('#tmine').innerHTML=mineHTML();renderBody()};TRX.listeners.add(listener);
 tick();renderBody();const iv=setInterval(tick,500);return ()=>{clearInterval(iv);TRX.listeners.delete(listener);ctx&&ctx.dispose()}};
