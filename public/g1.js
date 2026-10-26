const GAMEVIEWS={};
const ST=(id='st3',extra='')=>`<div class="g-stage s3d" id="${id}" ${extra}><div class="g-hist"></div><div class="ov" id="ov"></div></div>`;
function mk3(el,o){if(!G3.ok()){el.insertAdjacentHTML('beforeend','<div class="nogl">3D needs WebGL. Results still work below.</div>');return null}try{return G3.make(el,o)}catch(e){console.warn(e);el.insertAdjacentHTML('beforeend','<div class="nogl">3D could not start on this device.</div>');return null}}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
/* ===================== ROKKET engine (hash chain, unchanged maths) ===================== */
const SALT='rokket-public-salt-000000000000000000000000000a1f3';
const CR={phase:'wait',t0:0,waitEnd:0,crash:1,chain:[],idx:0,hist:[],players:[],my:null,queued:null,m:1,round:0,hash:'',autoN:0,ev:[]};
(function(){let h=randHex(32);const arr=[h];for(let i=0;i<600;i++){h=hex(SHA.hash(enc(h)));arr.push(h)}CR.chain=arr.reverse();CR.terminal=CR.chain[0]})();
function crashFromHash(h){const r=parseInt(hex(SHA.hmac(enc(h),enc(SALT))).slice(0,13),16)/2**52;return Math.min(1e6,Math.max(1,Math.floor(99/(1-r))/100))}
const growth=t=>Math.exp(0.085*t);
for(let i=0;i<16;i++){CR.idx++;CR.hist.unshift(crashFromHash(CR.chain[CR.idx]))}
function genBots(){const n=14+rnd(18);return Array.from({length:n},()=>({name:pickr(NAMES),bet:+(Math.random()**3*600+1).toFixed(2),target:+(1.05+Math.random()**2.4*12).toFixed(2),cash:null})).sort((a,b)=>b.bet-a.bet)}
function crWait(){CR.phase='wait';CR.waitEnd=performance.now()+7000;CR.players=genBots();CR.m=1;CR.my=null;CR.ev.push('wait');
 if(CR.queued){const q=CR.queued;CR.queued=null;if(debit(q.bet)){CR.my={...q,cash:null};SND.bet()}}
 else if(CR.autoN>0||CR.autoN===-1){const bet=CR.autoBet;if(bet&&debit(bet)){CR.my={bet,auto:CR.autoCash,cash:null};if(CR.autoN>0)CR.autoN--}else CR.autoN=0}crUI()}
function crFly(){CR.idx++;CR.round++;CR.hash=CR.chain[CR.idx];CR.crash=crashFromHash(CR.hash);CR.phase='fly';CR.t0=performance.now();CR.ev.push('fly');if(ROUTE==='game/crash')SND.humStart();crUI()}
function crBurn(){CR.phase='crash';CR.burnAt=performance.now();CR.hist.unshift(CR.crash);CR.hist.length=30;SND.humStop();CR.ev.push('burn');if(ROUTE==='game/crash')SND.boom();
 if(CR.my&&!CR.my.cash){S.wager+=CR.my.bet;S.hist.unshift({game:'crash',bet:CR.my.bet,mult:0,pay:0,nonce:'#'+CR.round,t:Date.now()});pushFeed({name:S.user,game:'crash',bet:CR.my.bet,mult:0,pay:0,me:true});save()}
 for(const p of CR.players)if(Math.random()<.25)pushFeed({name:p.name,game:'crash',bet:p.bet,mult:p.cash||0,pay:p.cash?p.bet*p.cash:0});crUI();setTimeout(crWait,3600)}
function crCash(){if(CR.phase!=='fly'||!CR.my||CR.my.cash)return;const m=Math.floor(CR.m*100)/100;CR.my.cash=m;const pay=settle('crash',CR.my.bet,m,'#'+CR.round,{quiet:true});SND.cash();toast(`Cashed out at ${fx(m)} · +${fmt(pay)} USDT`,'w');CR.ev.push({tag:'You',m,me:1});if(m>=10)bigWin(pay,m,'crash');crUI()}
function crBet(){const bet=val('cr-amt'),ac=$('#cr-acon')?.checked?val('cr-auto'):0;const auto=ac>=1.01?ac:null;
 if(isAuto()){if(CR.autoN){CR.autoN=0;toast('Auto bet stopped');crUI();return}const n=val('a-rounds');CR.autoN=n>0?n:-1;CR.autoBet=bet;CR.autoCash=auto||2;toast(`Auto bet on${n>0?` for ${n} rounds`:''}`);if(CR.phase==='wait'&&!CR.my){if(debit(bet)){CR.my={bet,auto:CR.autoCash,cash:null};if(CR.autoN>0)CR.autoN--;SND.bet()}}crUI();return}
 if(CR.phase==='wait'){if(CR.my){S.bal+=CR.my.bet;CR.my=null;updBal();toast('Bet cancelled');crUI();return}if(debit(bet)){CR.my={bet,auto,cash:null};SND.bet();toast('Bet placed for this launch')}}
 else{if(CR.queued){CR.queued=null;toast('Queued bet cancelled')}else{if(!(bet>0)||bet>S.bal){toast('Not enough balance','e');return}CR.queued={bet,auto};SND.click();toast('Queued for the next launch')}}crUI()}
let lastTickSec=-1;
function crTick(now){
 if(CR.phase==='wait'&&now>=CR.waitEnd)crFly();
 if(CR.phase==='fly'){const t=(now-CR.t0)/1000;CR.m=growth(t);SND.humSet(CR.m);
  for(const p of CR.players)if(!p.cash&&p.target<=CR.m&&p.target<CR.crash){p.cash=p.target;if(p.bet>60||Math.random()<.35)CR.ev.push({tag:p.name,m:p.target})}
  if(CR.my&&!CR.my.cash&&CR.my.auto&&CR.m>=CR.my.auto&&CR.my.auto<CR.crash){CR.m=CR.my.auto;crCash()}
  if(CR.m>=CR.crash){CR.m=CR.crash;crBurn()}}
 if(CR.phase==='wait'&&ROUTE==='game/crash'){const s=Math.ceil((CR.waitEnd-now)/1000);if(s!==lastTickSec&&s<=3&&s>0)SND.tick(.6);lastTickSec=s}
 const hm=$('#hero-mult');if(hm){if(CR.phase==='wait'){hm.textContent='Next in '+Math.ceil(Math.max(0,CR.waitEnd-now)/1000)+'s';hm.style.fontSize='22px';hm.style.color='var(--ink-muted)'}else{hm.textContent=fx(CR.m);hm.style.fontSize='';hm.style.color=CR.phase==='crash'?'var(--loss)':'var(--ink)'}}
 drawHero();CR.frame&&CR.frame(now);
 if($('#cr-players')&&(!CR._pl||now-CR._pl>300)){CR._pl=now;crPlayers()}
 const b=$('#gbtn');if(b&&ROUTE==='game/crash'&&!isAuto()){if(CR.phase==='wait')b.innerHTML=CR.my?`Cancel bet <span class="num" style="opacity:.8">· ${Math.max(0,(CR.waitEnd-now)/1000).toFixed(1)}s</span>`:`Place bet <span class="num" style="opacity:.75">· ${Math.max(0,(CR.waitEnd-now)/1000).toFixed(1)}s</span>`;
  else if(CR.phase==='fly'&&CR.my&&!CR.my.cash)b.innerHTML=`Cash out <span class="num">${fmt(CR.my.bet*CR.m)}</span>`}
 requestAnimationFrame(crTick)}
function crUI(){const b=$('#gbtn');if(b&&ROUTE==='game/crash'){if(isAuto()){b.className='btn lg block '+(CR.autoN?'danger':'primary');b.textContent=CR.autoN?'Stop auto bet':'Start auto bet'}
 else if(CR.phase==='fly'&&CR.my&&!CR.my.cash){b.className='btn lg block cash'}else{b.className='btn lg block primary';if(CR.phase!=='wait')b.textContent=CR.queued?'Cancel queued bet':'Bet next launch'}}
 const h=$('.g-hist');if(h&&ROUTE==='game/crash')h.innerHTML=CR.hist.slice(0,20).map(m=>`<span class="${mc(m)}">${fx(m)}</span>`).join('');
 const rh=$('#cr-round');if(rh)rh.innerHTML=CR.phase==='wait'?`Next launch <b class="num">#${CR.round+1}</b>`:`Launch <b class="num">#${CR.round}</b> · hash <code>${CR.hash.slice(0,12)}…</code>`;crPlayers()}
function crPlayers(){const el=$('#cr-players');if(!el)return;const rows=[...(CR.my?[{name:S.user,bet:CR.my.bet,cash:CR.my.cash,me:1}]:[]),...CR.players];
 const tot=rows.reduce((a,p)=>a+p.bet,0),won=rows.reduce((a,p)=>a+(p.cash?p.bet*p.cash:0),0);const c=$('#cr-count');if(c)c.innerHTML=`<b class="num">${rows.length}</b> players · <b class="num">${fmt(tot)}</b> bet · <b class="num pos">${fmt(won)}</b> won`;
 el.innerHTML=rows.map(p=>`<div class="p ${p.me?'me':''} ${p.cash?'won':''}"><span class="pl">${avatar(p.name)}<span style="overflow:hidden;text-overflow:ellipsis">${esc(p.name)}${p.me?' (you)':''}</span></span><span class="num">${fmt(p.bet)}</span><span class="num ${p.cash?'pos':CR.phase==='crash'?'lossc':'faint'}" style="min-width:70px;text-align:right">${p.cash?fmt(p.bet*p.cash):CR.phase==='crash'?'—':'…'}</span></div>`).join('')}
function sizeCanvas(c){const dpr=Math.min(2,devicePixelRatio||1),w=c.clientWidth,h=c.clientHeight;if(!w||!h)return [null,0,0];if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr)}const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);return [x,w,h]}
function curveT(){return CR.phase==='fly'?(performance.now()-CR.t0)/1000:CR.phase==='crash'?Math.log(CR.crash)/0.085:0}
function drawHero(){const c=$('#hero-canvas');if(!c||CR.phase==='wait')return;const [x,w,h]=sizeCanvas(c);if(!x)return;x.clearRect(0,0,w,h);
 const t=curveT(),m=CR.m,maxT=Math.max(10,t*1.1),maxM=Math.max(2,m*1.25);const px=tt=>w*.42+(tt/maxT)*w*.54,py=mm=>h-16-((mm-1)/(maxM-1))*(h*.7);
 x.beginPath();x.moveTo(px(0),py(1));for(let i=1;i<=60;i++){const tt=t*i/60;x.lineTo(px(tt),py(growth(tt)))}x.strokeStyle=CR.phase==='crash'?'#FF5470':'#FFC23D';x.lineWidth=4;x.lineCap='round';x.shadowColor=x.strokeStyle;x.shadowBlur=14;x.stroke();x.shadowBlur=0}
function drawMini(){const c=$('#mini');if(!c)return;const [x,w,h]=sizeCanvas(c);if(!x)return;x.clearRect(0,0,w,h);if(CR.phase==='wait'){x.fillStyle='#A8A0D0';x.font='700 11px Manrope,sans-serif';x.fillText('Boarding…',10,20);return}
 const t=curveT(),m=CR.m,maxT=Math.max(8,t*1.1),maxM=Math.max(2,m*1.2);const px=tt=>8+(tt/maxT)*(w-16),py=mm=>h-8-((mm-1)/(maxM-1))*(h-18);
 x.beginPath();x.moveTo(px(0),py(1));for(let i=1;i<=40;i++){const tt=t*i/40;x.lineTo(px(tt),py(growth(tt)))}x.strokeStyle=CR.phase==='crash'?'#FF5470':'#FFC23D';x.lineWidth=2.5;x.stroke();x.fillStyle='rgba(168,160,208,.8)';x.font='600 10px "Chakra Petch",monospace';x.fillText(fx(maxM).replace('.00',''),w-40,14)}
/* ---------- Rokket 3D scene ---------- */
function crashScene(el){const ctx=mk3(el,{pos:[3.2,2.6,9],target:[0,2.4,0],bg:'#2A1E66',fov:50,shadowSize:8});if(!ctx)return null;const sc=ctx.scene;
 const skyA=new THREE.Color('#3B2B8A'),skyB=new THREE.Color('#05030C');
 const stars=G3.stars(2600,140,.32);stars.position.z=-20;sc.add(stars);const stars2=G3.stars(900,90,.5);stars2.position.z=-8;sc.add(stars2);
 const neb=G3.tex(256,256,(x)=>{const g=x.createRadialGradient(128,128,10,128,128,128);g.addColorStop(0,'rgba(138,107,255,.55)');g.addColorStop(.5,'rgba(255,84,112,.18)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,256,256)});
 const nebs=[];for(let i=0;i<4;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:neb,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.0}));s.scale.set(40,40,1);s.position.set((Math.random()-.5)*50,20+i*30,-40);sc.add(s);nebs.push(s)}
 const planetTex=(a,b)=>G3.tex(256,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,0,w,h);for(let i=0;i<40;i++){x.fillStyle=`rgba(255,255,255,${Math.random()*.15})`;x.fillRect(0,Math.random()*h,w,2+Math.random()*6)}});
 const planets=[];[[6,'#FF9A1F','#8A2A10',[-14,40,-30]],[3,'#5C9BFF','#1A2A6A',[12,70,-24]],[9,'#8A6BFF','#2A1A5A',[18,120,-50]]].forEach(([r,a,b,p],i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,40,24),new THREE.MeshStandardMaterial({map:planetTex(a,b),roughness:.8}));m.position.set(...p);sc.add(m);planets.push(m);if(i===0){const ring=new THREE.Mesh(new THREE.RingGeometry(r*1.4,r*2,64),new THREE.MeshBasicMaterial({color:G3.lin('#FFC23D'),transparent:true,opacity:.35,side:THREE.DoubleSide}));ring.rotation.x=1.2;m.add(ring)}});
 const world=new THREE.Group();sc.add(world);
 const ground=new THREE.Mesh(new THREE.CylinderGeometry(30,30,1,64),G3.std('#1B1440',{r:.95}));ground.position.y=-.5;ground.receiveShadow=true;world.add(ground);
 const pad=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.5,.35,40),G3.std('#3A3170',{r:.5,m:.4}));pad.position.y=.17;G3.cast(pad);world.add(pad);
 for(let i=0;i<12;i++){const l=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:G3.lin(i%2?'#FFC23D':'#FF5470')}));const a=i/12*Math.PI*2;l.position.set(Math.cos(a)*2.3,.37,Math.sin(a)*2.3);world.add(l)}
 const tower=new THREE.Group();for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.12,.55,.12),G3.std('#FF5470',{r:.5,m:.3}));b.position.set(-1.9,.5+i*.55,-.4);tower.add(b);const cr=new THREE.Mesh(new THREE.BoxGeometry(.7,.06,.06),G3.std('#C8B8FF',{r:.5,m:.4}));cr.position.set(-1.6,.5+i*.55,-.4);cr.rotation.z=i%2?.6:-.6;tower.add(cr)}G3.cast(tower);world.add(tower);
 const hills=new THREE.Group();for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const r=18+Math.random()*6;const m=new THREE.Mesh(new THREE.ConeGeometry(3+Math.random()*4,4+Math.random()*6,6),G3.std('#251B55',{r:1,flat:true}));m.position.set(Math.cos(a)*r,1,Math.sin(a)*r-6);hills.add(m)}world.add(hills);
 const R=G3.rocket();R.g.position.y=1.62;sc.add(R.g);
 const smokeTex=G3.dot();const smoke=[];const smokeMat=()=>new THREE.SpriteMaterial({map:smokeTex,color:G3.lin('#C8B8FF'),transparent:true,opacity:.5,depthWrite:false});
 const ov=$('#ov',el.parentElement)||$('#ov');let pY=1.62,vel=0,state='',burnT=0;
 const resetPad=()=>{R.g.visible=true;R.g.position.set(0,1.62,0);R.g.rotation.set(0,0,0);world.position.y=0;pY=1.62;state='wait'};
 const tag=(name,m,me)=>{const p=ctx.toScreen(R.g.position.clone().add(V3(.9,.3,0)));const d=document.createElement('div');d.className='tagfly';d.style.left=(p.x+(Math.random()-.5)*40)+'px';d.style.top=p.y+'px';d.style.color=me?'var(--win)':'var(--ink)';d.textContent=`${name} ${fx(m)}`;el.appendChild(d);setTimeout(()=>d.remove(),1700)};
 ctx.add((dt,t)=>{const now=performance.now();
  while(CR.ev.length){const e=CR.ev.shift();if(e==='wait')resetPad();else if(e==='fly'){state='fly'}else if(e==='burn'){state='burn';burnT=0;const p=R.g.position.clone();R.g.visible=false;G3.burst(ctx,p,{n:220,speed:9,life:1.6,g:2,size:.35,colors:['#FFC23D','#FF9A1F','#FF5470','#fff','#8A6BFF']});G3.burst(ctx,p,{n:60,speed:3,life:2.2,g:.5,size:.8,colors:['#4A3A80','#6A5AA0']});ctx.shake(.6);
   const fl=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),G3.glow('#FFC23D',.9));fl.position.copy(p);sc.add(fl);ctx.tween(.6,k=>{fl.scale.setScalar(1+k*5);fl.material.opacity=.9*(1-k)}).then(()=>{sc.remove(fl)})}else if(e.tag)tag(e.tag,e.m,e.me)}
  const m=CR.phase==='wait'?1:CR.m,lm=Math.log(m);
  if(CR.phase==='wait'){R.flame.scale.set(.25+Math.random()*.05,.2+Math.random()*.08,.25);R.light.intensity=.6;const s=Math.max(0,(CR.waitEnd-now)/1000);if(s<2.5&&Math.random()<.5){const sp=new THREE.Sprite(smokeMat());sp.position.set((Math.random()-.5)*1.5,.4,(Math.random()-.5)*1.5);sp.scale.setScalar(1);sc.add(sp);smoke.push({sp,v:V3((Math.random()-.5)*3,Math.random()*.6,(Math.random()-.5)*3),life:1.4})}}
  if(CR.phase==='fly'){const tt=(now-CR.t0)/1000;const up=Math.min(6,1.6+tt*.45);R.g.position.y=1.62+Math.min(2.4,tt*1.2);world.position.y-=dt*(1.5+lm*7);R.flame.scale.set(1+Math.random()*.15,1+lm*.25+Math.random()*.2,1+Math.random()*.15);R.light.intensity=2.2+Math.random();R.g.rotation.z=Math.sin(t*3)*.03*(1+lm);R.g.rotation.y+=dt*(.3+lm*.3);
   if(Math.random()<.9){const sp=new THREE.Sprite(smokeMat());sp.material.color=G3.lin(Math.random()<.5?'#FF9A1F':'#C8B8FF');sp.material.opacity=.45;sp.position.copy(R.g.position).add(V3((Math.random()-.5)*.3,-2,(Math.random()-.5)*.3));sp.scale.setScalar(.6);sc.add(sp);smoke.push({sp,v:V3((Math.random()-.5)*.8,-2.5-lm*2,(Math.random()-.5)*.8),life:1})}}
  const sp=CR.phase==='fly'?(.4+lm*3.2):CR.phase==='crash'?.3:.02;
  for(const S_ of [stars,stars2]){const P=S_.geometry.attributes.position.array;for(let i=1;i<P.length;i+=3){P[i]-=dt*sp*(S_===stars2?2.4:1)*6;if(P[i]<-70)P[i]+=140}S_.geometry.attributes.position.needsUpdate=true}
  planets.forEach((p,i)=>{p.position.y-=dt*sp*(1.5+i*.6);p.rotation.y+=dt*.05;if(p.position.y<-60)p.position.y=110+Math.random()*40});
  const alt=Math.min(1,CR.phase==='wait'?0:lm/2.2);sc.background=skyA.clone().lerp(skyB,CR.phase==='wait'?0:alt);nebs.forEach((n,i)=>{n.material.opacity=alt*.8;n.position.y-=dt*sp*2;if(n.position.y<-40)n.position.y=60+Math.random()*40});
  for(let i=smoke.length-1;i>=0;i--){const s=smoke[i];s.life-=dt;s.sp.position.addScaledVector(s.v,dt);s.sp.scale.multiplyScalar(1+dt*1.6);s.sp.material.opacity=Math.max(0,s.life*.4);if(s.life<=0){sc.remove(s.sp);s.sp.material.dispose();smoke.splice(i,1)}}
  const camY=R.g.visible?R.g.position.y:ctx.cam.position.y-1.2;ctx.cam.position.x=3.2+Math.sin(t*.25)*.6;ctx.cam.position.y+=(camY+1-ctx.cam.position.y)*Math.min(1,dt*3);ctx.cam.lookAt(0,camY+.6,0);
  // overlay
  if(ov){if(CR.phase==='wait'){const s=Math.max(0,(CR.waitEnd-now)/1000);ov.innerHTML=`<div class="sub" style="color:var(--ink-muted)">Boarding · launch in</div><div class="big">${s.toFixed(1)}s</div><div class="pill">${CR.players.length+(CR.my?1:0)} players on board${CR.my?' · you are in':''}</div>`}
   else{const lost=CR.phase==='crash';ov.innerHTML=`<div class="big" style="color:${lost?'var(--loss)':'var(--ink)'}">${fx(m)}</div>${lost?'<div class="sub" style="color:var(--loss)">Burned out</div>':CR.my&&!CR.my.cash?`<div class="pill" style="color:var(--gold-text)">Your bet · ${fmt(CR.my.bet*m)} USDT</div>`:''}${CR.my&&CR.my.cash?`<div class="pill" style="color:var(--win)">You cashed out at ${fx(CR.my.cash)}</div>`:''}`}}
  drawMini()});
 if(CR.phase!=='wait'){R.g.visible=CR.phase==='fly';state=CR.phase}return ctx}
GAMEVIEWS.crash=box=>{box.innerHTML=`<div class="game"><div class="g-panel">${panelHead()}
 <div class="betbox">${amtField('cr-amt',10)}<div class="field"><label class="label" for="cr-auto"><input type="checkbox" id="cr-acon" checked style="vertical-align:-2px;margin-right:6px;accent-color:#FFC23D">Auto cash out</label><div class="inp"><input id="cr-auto" type="number" step="0.01" min="1.01" value="2.00"><span class="suf">×</span><button type="button" onclick="$('#cr-auto').value=(Math.max(1.01,val('cr-auto')-.5)).toFixed(2)">−</button><button type="button" onclick="$('#cr-auto').value=(val('cr-auto')+.5).toFixed(2)">+</button></div></div>
 <div class="auto-only field"><label class="label" for="a-rounds">Rounds</label><div class="inp"><input id="a-rounds" type="number" min="0" value="10"><span class="suf">0 = ∞</span></div></div>
 <button class="btn lg block primary" id="gbtn">Place bet</button></div><div class="fair" id="cr-round"></div>
 <div class="card" style="padding:12px;background:var(--surface-sunken)"><div class="small muted" id="cr-count" style="margin-bottom:6px"></div><div class="cr-players" id="cr-players"></div></div></div>
 ${ST()}</div><div class="card small muted">Every launch comes from a SHA-256 hash chain committed before play started (<code class="num">${CR.terminal.slice(0,20)}…</code>). The crash point is HMAC-SHA256(launch hash, public salt) on a 99% RTP curve, fixed before anyone bets.</div>`;
 $('#st3').insertAdjacentHTML('beforeend','<canvas class="mini" id="mini" style="top:auto;bottom:12px;left:12px;right:auto"></canvas>');
 $('#gbtn').onclick=()=>crBet();wireMode(()=>crUI());CR.ev.length=0;const ctx=crashScene($('#st3'));crUI();if(CR.phase==='fly')SND.humStart();return ()=>{SND.humStop();ctx&&ctx.dispose()}};
/* ===================== LIMBO 3D: rocket launch past altitude gates ===================== */
GAMEVIEWS.limbo=box=>{let busy=false;
 box.innerHTML=`<div class="game"><div class="g-panel">${panelHead()}${amtField('l-amt',1)}
 <div class="grid2"><div class="field"><label class="label" for="l-t">Target multiplier</label><div class="inp"><input id="l-t" type="number" min="1.01" step="0.01" value="2.00"><span class="suf">×</span></div></div><div class="field"><label class="label" for="l-ch">Win chance</label><div class="inp"><input id="l-ch" readonly><span class="suf">%</span></div></div></div>
 <div class="row">${[1.5,2,5,10,100].map(v=>`<button class="chip" onclick="$('#l-t').value='${v.toFixed(2)}';$('#l-t').dispatchEvent(new Event('input'))">${v}×</button>`).join('')}</div>${autoFields()}
 <button class="btn lg block primary" id="gbtn">Launch</button><div class="auto-only profit"><span>Bets <b class="num" id="a-count">0</b></span><span>Profit <b class="num" id="a-profit">0.00</b></span></div></div>${ST()}</div>`;
 pushHist('limbo');const el=$('#st3'),ov=$('#ov');const ctx=mk3(el,{pos:[0,2.5,10],target:[0,2.5,0],bg:'#1A1240',fov:50,fit:[6.5,6]});
 const K=3.2,yOf=m=>Math.log(m)/Math.log(10)*K*2.2;let R,gates=[],tgtGate,rY=0;
 if(ctx){const sc=ctx.scene;sc.add(G3.stars(1200,120,.3));R=G3.rocket();R.g.scale.setScalar(.7);R.g.position.y=1;sc.add(R.g);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(2,2.3,.4,40),G3.std('#3A3170',{r:.5,m:.3}));base.position.y=-.4;base.receiveShadow=true;sc.add(base);
  [1.5,2,3,5,10,20,50,100,1000].forEach(m=>{const g=new THREE.Mesh(new THREE.TorusGeometry(1.7,.06,10,64),G3.std('#C8B8FF',{r:.3,m:.6,e:'#8A6BFF',ei:.3}));g.rotation.x=Math.PI/2;g.position.y=1+yOf(m);sc.add(g);const lb=G3.label(fx(m).replace('.00',''),{scale:.45,color:'#C8B8FF'});lb.position.set(2.6,1+yOf(m),0);sc.add(lb);gates.push({m,g,lb})});
  tgtGate=new THREE.Mesh(new THREE.TorusGeometry(1.9,.11,12,64),G3.std('#FFC23D',{r:.2,m:.8,e:'#FFC23D',ei:.6}));tgtGate.rotation.x=Math.PI/2;sc.add(tgtGate);const tl=G3.label('2.00×',{scale:.6,color:'#241500',bg:'#FFC23D',radius:30});tl.position.set(-2.8,0,0);tgtGate.add(tl);tgtGate.lbl=tl;
  ctx.add((dt,t)=>{R.flame.scale.set(.6+Math.random()*.1,(busy?1.2:.4)+Math.random()*.2,.6);R.g.rotation.y+=dt*.6;ctx.cam.position.y+=(R.g.position.y+1.5-ctx.cam.position.y)*Math.min(1,dt*4);ctx.cam.lookAt(0,R.g.position.y+.8,0);tgtGate.rotation.z+=dt*.5})}
 const ch=()=>{const t=Math.max(1.01,val('l-t'));$('#l-ch').value=(99/t).toFixed(4);if(tgtGate){tgtGate.position.y=1+yOf(t);tgtGate.lbl.set(fx(t))}ov.innerHTML=`<div class="big num" id="ln">1.00×</div><div class="pill">Target <b class="num">${fx(t)}</b></div>`};$('#l-t').oninput=ch;ch();
 const once=async(bet,fast)=>{const t=Math.max(1.01,val('l-t'));if(!debit(bet))return null;const {f,nonce}=draw(1);const r=limboRes(f[0]);const win=r>=t;const el=$('#ln');if(!el)return null;el.style.color='var(--ink)';SND.t(300,.35,{type:'sawtooth',vol:.05,slide:3});
  const dur=fast?.25:.8;const shown=Math.min(r,Math.max(t*1.6,3));if(ctx){R.g.position.y=1;await ctx.tween(dur,k=>{const v=1+(r-1)*k;el.textContent=fx(v);R.g.position.y=1+yOf(1+(shown-1)*k)})}else{el.textContent=fx(r);await sleep(200)}
  el.textContent=fx(r);el.style.color=win?'var(--win)':'var(--loss)';if(ctx&&!fast){if(win){G3.burst(ctx,tgtGate.position.clone(),{n:90,speed:5,g:3});tgtGate.material.emissive=G3.lin('#22E39A')}else{tgtGate.material.emissive=G3.lin('#FF5470');G3.burst(ctx,R.g.position.clone(),{n:30,speed:2,colors:['#6A5AA0','#8A7AB0'],size:.6,g:-1})}setTimeout(()=>tgtGate&&(tgtGate.material.emissive=G3.lin('#FFC23D')),700)}
  const pay=settle('limbo',bet,win?t:0,nonce,{fast});pushHist('limbo');$('#myg')&&($('#myg').innerHTML=myRows('limbo'));if(ctx)ctx.tween(fast?.15:.5,k=>{R.g.position.y=R.g.position.y+(1-R.g.position.y)*k});return pay};
 $('#gbtn').onclick=async()=>{if(isAuto())return runAuto($('#gbtn'),'l-amt',once);if(busy)return;busy=true;await once(val('l-amt'));busy=false};
 wireMode(m=>{$('#gbtn').textContent=m==='auto'?'Start autobet':'Launch'});return ()=>ctx&&ctx.dispose()};
/* ===================== DICE 3D ===================== */
const PIPS={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]};
const dieFace=(n,col='#FFFFFF',pip='#4B30D8')=>G3.tex(128,128,(x)=>{x.fillStyle=col;x.fillRect(0,0,128,128);x.fillStyle=pip;for(const [a,b] of PIPS[n]){x.beginPath();x.arc(64+a*32,64+b*32,13,0,7);x.fill()}});
function makeDie(col,pip){const order=[3,4,1,6,2,5];const g=new THREE.Mesh(G3.rbox(1,1,1,.16,4),order.map(n=>new THREE.MeshStandardMaterial({map:dieFace(n,col,pip),roughness:.25,metalness:0})));
 // remap UVs so each box face shows its texture: compute per-face groups by normal
 const geo=g.geometry,nrm=geo.attributes.normal,pos=geo.attributes.position,uv=geo.attributes.uv;geo.clearGroups();const idx=geo.index?geo.index.array:null;const tri=idx?idx.length/3:pos.count/3;const faces=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];const ord=[];
 const newIdx=[[],[],[],[],[],[]];for(let i=0;i<tri;i++){const a=idx?idx[i*3]:i*3;let n=V3(0,0,0);for(let k=0;k<3;k++){const vi=idx?idx[i*3+k]:i*3+k;n.add(V3(nrm.getX(vi),nrm.getY(vi),nrm.getZ(vi)))}n.normalize();let best=0,bd=-9;faces.forEach((f,fi)=>{const d=n.x*f[0]+n.y*f[1]+n.z*f[2];if(d>bd){bd=d;best=fi}});for(let k=0;k<3;k++)newIdx[best].push(idx?idx[i*3+k]:i*3+k)}
 const all=[];newIdx.forEach((l,fi)=>{geo.addGroup(all.length,l.length,fi);all.push(...l)});geo.setIndex(all);
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const ax=Math.abs(nrm.getX(i)),ay=Math.abs(nrm.getY(i));if(ax>=ay&&ax>=Math.abs(nrm.getZ(i)))uv.setXY(i,(z*Math.sign(-nrm.getX(i))+.5),y+.5);else if(ay>=Math.abs(nrm.getZ(i)))uv.setXY(i,x+.5,(-z*Math.sign(nrm.getY(i))+.5));else uv.setXY(i,(x*Math.sign(nrm.getZ(i))+.5),y+.5)}uv.needsUpdate=true;
 g.castShadow=true;g.receiveShadow=true;g.faceNormal={1:V3(0,1,0),6:V3(0,-1,0),3:V3(1,0,0),4:V3(-1,0,0),2:V3(0,0,1),5:V3(0,0,-1)};return g}
GAMEVIEWS.dice=box=>{let mode='over',target=50.5,busy=false;const calc=()=>{const ch=mode==='over'?100-target:target;return {ch,m:Math.floor(99/ch*10000)/10000}};
 box.innerHTML=`<div class="game"><div class="g-panel">${panelHead()}${amtField('d-amt',1)}
 <div class="statrow"><div class="field"><label class="label" for="d-m">Payout</label><div class="inp"><input id="d-m" type="number" step="0.0001"><span class="suf">×</span></div></div><div class="field"><label class="label" for="d-t">Roll <span id="d-ov">over</span></label><div class="inp"><input id="d-t" type="number" step="0.5"></div></div><div class="field"><label class="label" for="d-c">Chance</label><div class="inp"><input id="d-c" type="number" step="0.5"><span class="suf">%</span></div></div></div>
 <div class="seg"><button id="m-under">Roll under</button><button id="m-over" class="on">Roll over</button></div>
 <div class="field"><label class="label">Profit on win</label><div class="inp">${COIN}<input id="d-p" readonly></div></div>${autoFields()}
 <button class="btn lg block primary" id="gbtn">Roll dice</button><div class="auto-only profit"><span>Bets <b class="num" id="a-count">0</b></span><span>Profit <b class="num" id="a-profit">0.00</b></span></div></div>
 ${ST()}</div>`;
 $('#st3').insertAdjacentHTML('beforeend',`<div class="ov-bot"><div class="track" id="tr"><div class="res" id="dres" style="left:50%;opacity:0"></div><div class="knob" id="kn"></div><input id="dsl" type="range" min="2" max="98" step="0.5" value="50.5" aria-label="Target"></div><div class="ticks"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div></div>`);pushHist('dice');
 const ov=$('#ov');ov.innerHTML='<div class="big num" id="dn">50.00</div>';const ctx=mk3($('#st3'),{pos:[0,5.2,7.5],target:[0,.2,-.2],bg:'#1A1240',fov:40,fit:[4.6,6.2]});let D1,D2,score;
 if(ctx){const sc=ctx.scene;const felt=new THREE.Mesh(G3.rbox(11,.4,7,.2),G3.std('#2A1F66',{r:.9}));felt.position.y=-.2;felt.receiveShadow=true;sc.add(felt);const rim=new THREE.Mesh(G3.rbox(11.6,.6,7.6,.25),G3.std('#120C2E',{r:.4,m:.3}));rim.position.y=-.45;sc.add(rim);
  const wall=new THREE.Mesh(G3.rbox(11.6,1.2,.5,.2),G3.std('#3B2A92',{r:.5}));wall.position.set(0,.4,-3.6);G3.cast(wall);sc.add(wall);
  D1=makeDie('#FFFFFF','#4B30D8');D1.position.set(-.8,.5,0);sc.add(D1);D2=makeDie('#FFC23D','#241500');D2.position.set(.9,.5,.3);D2.rotation.y=.6;sc.add(D2)}
 const pips={};const setFace=(D,n)=>{const q=new THREE.Quaternion().setFromUnitVectors(D.faceNormal[n],V3(0,1,0));const yaw=new THREE.Quaternion().setFromAxisAngle(V3(0,1,0),Math.random()*Math.PI*2);return yaw.multiply(q)};
 const toss=async(D,n,x0,xEnd,dur)=>{const q0=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random()*7,Math.random()*7,Math.random()*7));const q1=setFace(D,n);const spin=new THREE.Quaternion();const ax=V3(Math.random(),Math.random(),Math.random()).normalize();
  await ctx.tween(dur,(k)=>{const bounce=Math.abs(Math.sin(k*Math.PI*2.5))*(1-k)*2.4;D.position.set(x0+(xEnd-x0)*k,.5+bounce,(1-k)*1.2);spin.setFromAxisAngle(ax,(1-k)*18);D.quaternion.copy(q0).slerp(q1,G3.ease.outCubic(k)).premultiply(spin)},G3.ease.lin);D.quaternion.copy(q1);D.position.y=.5};
 const paint=src=>{target=clamp(Math.round(target*2)/2,2,98);const {ch,m}=calc();const p=target+'%';$('#tr').style.background=mode==='over'?`linear-gradient(90deg,var(--loss) ${p},var(--win) ${p})`:`linear-gradient(90deg,var(--win) ${p},var(--loss) ${p})`;$('#kn').style.left=p;$('#dsl').value=target;
  if(src!=='t')$('#d-t').value=target.toFixed(2);if(src!=='c')$('#d-c').value=ch.toFixed(2);if(src!=='m')$('#d-m').value=m.toFixed(4);$('#d-ov').textContent=mode;$('#d-p').value=fmt(val('d-amt')*(m-1),4)};
 $('#dsl').oninput=e=>{target=+e.target.value;SND.tick(.8);paint()};$('#d-t').oninput=()=>{target=val('d-t');paint('t')};$('#d-c').oninput=()=>{const c=clamp(val('d-c'),2,98);target=mode==='over'?100-c:c;paint('c')};$('#d-m').oninput=()=>{const m=val('d-m');if(m>1.0102){const c=clamp(99/m,2,98);target=mode==='over'?100-c:c;paint('m')}};$('#d-amt').oninput=()=>paint();
 const setMode=md=>{if(md===mode)return;mode=md;target=100-target;$('#m-over').classList.toggle('on',md==='over');$('#m-under').classList.toggle('on',md==='under');SND.click();paint()};$('#m-over').onclick=()=>setMode('over');$('#m-under').onclick=()=>setMode('under');paint();
 const once=async(bet,fast)=>{if(!debit(bet))return null;const {f,nonce}=draw(1);const roll=diceRoll(f[0]);const {m}=calc();const win=mode==='over'?roll>target:roll<target;const dn=$('#dn');if(!dn)return null;dn.style.color='var(--ink)';SND.deal();
  const a=1+Math.floor(roll/10)%6,b=1+Math.floor(roll*7)%6;
  if(ctx){const p=Promise.all([toss(D1,a,3.5,-.8,fast?.35:.95),toss(D2,b,4.2,.9,fast?.35:1.05)]);let k=0;const iv=setInterval(()=>{if(dn)dn.textContent=(Math.random()*100).toFixed(2);if(++k%3===0)SND.tick(.4)},40);await p;clearInterval(iv)}else{await sleep(200)}
  dn.textContent=roll.toFixed(2);dn.style.color=win?'var(--win)':'var(--loss)';const r=$('#dres');r.style.opacity=1;r.style.left=roll+'%';r.textContent=roll.toFixed(2);r.style.background=win?'var(--win)':'var(--loss)';r.style.borderTopColor=win?'var(--win)':'var(--loss)';
  if(ctx&&win&&!fast)G3.burst(ctx,V3(0,1.2,0),{n:50,speed:4,g:6,colors:['#22E39A','#FFC23D','#fff']});
  const pay=settle('dice',bet,win?m:0,nonce,{fast});pushHist('dice');$('#myg')&&($('#myg').innerHTML=myRows('dice'));return pay};
 $('#gbtn').onclick=async()=>{if(isAuto())return runAuto($('#gbtn'),'d-amt',once);if(busy)return;busy=true;await once(val('d-amt'));busy=false};
 wireMode(m=>{$('#gbtn').textContent=m==='auto'?'Start autobet':'Roll dice'});return ()=>ctx&&ctx.dispose()};
/* ===================== MINES 3D ===================== */
const minesMult=(m,k)=>{let x=.99;for(let i=0;i<k;i++)x*=(25-i)/(25-m-i);return x};
function gemMesh(){const g=new THREE.Group();const m=new THREE.Mesh(new THREE.OctahedronGeometry(.32,0),G3.std('#22E39A',{r:.08,m:.2,e:'#0E8A5F',ei:.5,env:2.2,flat:true}));m.scale.y=1.25;g.add(m);const l=new THREE.PointLight(0x22E39A,0,3);l.position.y=.4;g.add(l);g.light=l;g.castShadow=true;return g}
function bombMesh(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.3,24,18),G3.std('#16102E',{r:.25,m:.6,env:1.5}));g.add(b);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.12,12),G3.std('#3A3170',{m:.6,r:.3}));cap.position.set(.12,.27,0);cap.rotation.z=-.45;g.add(cap);const fu=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,6,12,Math.PI),G3.std('#C8A070',{r:.8}));fu.position.set(.26,.36,0);g.add(fu);const sp=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),G3.glow('#FFC23D'));sp.position.set(.38,.38,0);g.add(sp);g.spark=sp;return g}
GAMEVIEWS.mines=box=>{let G=null;
 box.innerHTML=`<div class="game"><div class="g-panel">${amtField('m-amt',1)}
 <div class="field"><label class="label" for="m-n">Mines</label><div class="inp"><select id="m-n">${Array.from({length:24},(_,i)=>`<option ${i+1===3?'selected':''}>${i+1}</option>`).join('')}</select></div></div>
 <div class="statrow"><div class="stat"><small>Gems</small><b id="mk">0</b></div><div class="stat"><small>Multiplier</small><b id="mm">1.00×</b></div><div class="stat"><small>Next tile</small><b id="mn">—</b></div></div>
 <button class="btn lg block primary" id="gbtn">Start game</button><button class="btn block" id="mrand" disabled>Pick a random tile</button></div>${ST()}</div>`;pushHist('mines');
 const ctx=mk3($('#st3'),{pos:[0,7.4,6.2],target:[0,-.3,.4],bg:'#120C2E',fov:40,fit:[7.2,7.6]});const tiles=[];let hover=null;
 if(ctx){const sc=ctx.scene;const plat=new THREE.Mesh(G3.rbox(6.4,.4,6.4,.25),G3.std('#2A1F66',{r:.6,m:.2}));plat.position.y=-.3;plat.receiveShadow=true;sc.add(plat);const glowR=new THREE.Mesh(G3.rbox(6.8,.2,6.8,.1),G3.std('#8A6BFF',{e:'#8A6BFF',ei:.5}));glowR.position.y=-.55;sc.add(glowR);
  for(let i=0;i<25;i++){const r=Math.floor(i/5),c=i%5;const g=new THREE.Group();g.position.set((c-2)*1.18,0,(r-2)*1.18);const t=new THREE.Mesh(G3.rbox(1,.28,1,.12),[G3.std('#5A47B8',{r:.35,m:.25})]);t.material=G3.std('#5A47B8',{r:.35,m:.25});t.position.y=.14;t.castShadow=true;t.receiveShadow=true;t.userData.i=i;g.add(t);sc.add(g);tiles.push({g,t,i,base:0,lift:0})}
  const onMove=e=>{const h=ctx.pick(e,tiles.map(x=>x.t));hover=h&&G&&!G.over&&!G.open.has(h.object.userData.i)?h.object.userData.i:null;ctx.R.domElement.style.cursor=hover!=null?'pointer':'default'};
  ctx.R.domElement.addEventListener('pointermove',onMove);ctx.R.domElement.addEventListener('click',e=>{const h=ctx.pick(e,tiles.map(x=>x.t));if(h)pick(h.object.userData.i)});
  ctx.add((dt,t)=>{for(const T of tiles){const want=hover===T.i?.22:0;T.lift+=(want-T.lift)*Math.min(1,dt*10);T.t.position.y=.14+T.lift;if(T.content){T.content.rotation.y+=dt*1.5;if(T.content.spark)T.content.spark.scale.setScalar(.7+Math.random()*.6)}}
   if(G&&!G.over)tiles.forEach(T=>{if(!G.open.has(T.i))T.t.material.emissive=G3.lin('#2A1A80').multiplyScalar(.4+Math.sin(t*3+T.i*.4)*.2)})})}
 const resetTiles=()=>tiles.forEach(T=>{T.t.rotation.x=0;T.t.visible=true;T.t.material.emissive=G3.lin('#000000');T.t.material.color=G3.lin('#5A47B8');T.t.material.opacity=1;if(T.content){ctx.scene.remove(T.content);T.content=null}});
 const reveal=async(i,isM,dim)=>{const T=tiles[i];if(!ctx||T.content)return;const c=isM?bombMesh():gemMesh();c.position.copy(T.g.position);c.position.y=.45;c.scale.setScalar(dim?.65:.01);ctx.scene.add(c);T.content=c;
  ctx.tween(.35,k=>{T.t.rotation.x=k*Math.PI;T.t.position.y=.14+Math.sin(k*Math.PI)*.4});T.t.material.color=G3.lin(isM?'#5A1A30':'#14503E');
  if(!dim){await ctx.tween(.4,k=>{c.scale.setScalar(Math.max(.01,G3.ease.outBack(k)))});if(!isM){c.light.intensity=2.5;setTimeout(()=>c.light&&(c.light.intensity=.6),300)}}else{c.traverse(m=>{if(m.material){m.material=m.material.clone();m.material.transparent=true;m.material.opacity=.45}})}};
 const grid=()=>{};
 const stats=()=>{const k=G?G.open.size:0,m=G?G.m:+$('#m-n').value;$('#mk').textContent=k+' / '+(25-m);$('#mm').textContent=fx(minesMult(m,k));$('#mn').textContent=G&&!G.over?fx(minesMult(m,k+1)):fx(minesMult(m,1));
  const b=$('#gbtn');$('#mrand').disabled=!(G&&!G.over);$('#m-n').disabled=$('#m-amt').disabled=!!(G&&!G.over);if(G&&!G.over){b.className='btn lg block cash';b.disabled=!k;b.innerHTML=k?`Cash out <span class="num">${fmt(G.bet*minesMult(m,k))}</span>`:'Tap a tile'}else{b.className='btn lg block primary';b.disabled=false;b.textContent='Start game'}};
 const endReveal=()=>{for(let i=0;i<25;i++)if(!G.open.has(i)&&i!==G.hit)reveal(i,G.mines.has(i),true)};
 const pick=async i=>{if(!G||G.over||G.open.has(i))return;if(G.mines.has(i)){G.over=true;G.hit=i;SND.boom();await reveal(i,true,false);if(ctx){const p=tiles[i].g.position.clone();p.y=.6;G3.burst(ctx,p,{n:160,speed:7,life:1.3,size:.3});ctx.shake(.5);tiles[i].content&&(tiles[i].content.visible=false)}const st=$('.g-stage');st&&(st.classList.remove('shake'),void st.offsetWidth,st.classList.add('shake'));settle('mines',G.bet,0,G.nonce,{silentLoss:true});pushHist('mines');$('#myg').innerHTML=myRows('mines');endReveal()}
  else{G.open.add(i);SND.gem(G.open.size);reveal(i,false,false);if(G.open.size===25-G.m){cash();return}}stats()};
 const cash=()=>{const mult=minesMult(G.m,G.open.size);G.over=true;const pay=settle('mines',G.bet,mult,G.nonce);SND.cash();toast(`Cashed out ${fmt(pay)} USDT`,'w');pushHist('mines');$('#myg').innerHTML=myRows('mines');if(ctx)G3.burst(ctx,V3(0,1,0),{n:80,speed:6,colors:['#22E39A','#FFC23D','#fff']});endReveal();stats()};
 $('#gbtn').onclick=()=>{if(G&&!G.over){if(G.open.size)cash();return}const bet=val('m-amt'),m=+$('#m-n').value;if(!debit(bet))return;SND.bet();const {f,nonce}=draw(24);const order=shuffle(f,25);G={bet,m,nonce,mines:new Set(order.slice(0,m)),open:new Set(),over:false};if(ctx)resetTiles();stats()};
 $('#mrand').onclick=()=>{if(!G||G.over)return;const c=[...Array(25).keys()].filter(i=>!G.open.has(i));pick(pickr(c))};
 if(!ctx){$('#st3').insertAdjacentHTML('beforeend','<div class="mgrid" id="mg" style="position:relative;z-index:3"></div>');}
 $('#m-n').onchange=stats;stats();return ()=>{if(G&&!G.over){if(G.open.size)cash();else{S.bal+=G.bet;updBal()}}ctx&&ctx.dispose()}};
