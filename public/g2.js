/* ===================== DROP 3D (peg board) ===================== */
const PL={8:{low:[5.6,2.1,1.1,1,.5,1,1.1,2.1,5.6],medium:[13,3,1.3,.7,.4,.7,1.3,3,13],high:[29,4,1.5,.3,.2,.3,1.5,4,29]},
 12:{low:[10,3,1.6,1.4,1.1,1,.5,1,1.1,1.4,1.6,3,10],medium:[33,11,4,2,1.1,.6,.3,.6,1.1,2,4,11,33],high:[170,24,8.1,2,.7,.2,.2,.2,.7,2,8.1,24,170]},
 16:{low:[16,9,2,1.4,1.4,1.2,1.1,1,.5,1,1.1,1.2,1.4,1.4,2,9,16],medium:[110,41,10,5,3,1.5,1,.5,.3,.5,1,1.5,3,5,10,41,110],high:[1000,130,26,9,4,2,.2,.2,.2,.2,.2,2,4,9,26,130,1000]}};
const bucketCol=(k,R)=>{const hot=Math.abs(k-R/2)/(R/2);return new THREE.Color().setHSL((48-hot*50)/360,.95,.5+hot*.04)};
GAMEVIEWS.drop=box=>{let risk='medium',R=12,pending=0;
 box.innerHTML=`<div class="game"><div class="g-panel">${panelHead()}${amtField('p-amt',1)}
 <div class="field"><label class="label">Risk</label><div class="seg" id="pr"><button data-r="low">Low</button><button data-r="medium" class="on">Medium</button><button data-r="high">High</button></div></div>
 <div class="field"><label class="label">Rows</label><div class="seg" id="prow"><button data-n="8">8</button><button data-n="12" class="on">12</button><button data-n="16">16</button></div></div>${autoFields()}
 <button class="btn lg block primary" id="gbtn">Drop ball</button><div class="auto-only profit"><span>Bets <b class="num" id="a-count">0</b></span><span>Profit <b class="num" id="a-profit">0.00</b></span></div></div>${ST()}</div>`;pushHist('drop');
 const ctx=mk3($('#st3'),{pos:[0,5.5,17],target:[0,5.2,0],bg:'#1A0F33',fov:38,fit:[14,13.5,1]});let board=null,pegs=[],buckets=[];
 const G=()=>({gap:1,rowH:.82,top:R*.82+.6});
 const build=()=>{if(!ctx)return;if(board){ctx.scene.remove(board);board.traverse(o=>{o.geometry&&o.geometry.dispose()})}board=new THREE.Group();ctx.scene.add(board);pegs=[];buckets=[];const {gap,rowH,top}=G();
  const W=(R+3)*gap,H=top+2.4;const back=new THREE.Mesh(G3.rbox(W+1,H,.4,.3),G3.std('#2A1A5E',{r:.6,m:.1}));back.position.set(0,H/2-1.6,-.5);back.receiveShadow=true;board.add(back);
  const frame=new THREE.Mesh(G3.rbox(W+1.6,H+.6,.3,.25),G3.std('#FFC23D',{r:.25,m:.85}));frame.position.set(0,H/2-1.6,-.75);board.add(frame);
  const pg=new THREE.CylinderGeometry(.09,.09,.5,14);pg.rotateX(Math.PI/2);
  for(let r=0;r<R;r++)for(let i=0;i<r+3;i++){const m=new THREE.Mesh(pg,G3.std('#E6DFFF',{r:.2,m:.7,env:1.6}));m.position.set((i-(r+2)/2)*gap,top-r*rowH,-.05);m.castShadow=true;board.add(m);pegs.push({m,r,i,h:0})}
  const mults=PL[R][risk];mults.forEach((mu,k)=>{const col=bucketCol(k,R);const b=new THREE.Group();const bx=new THREE.Mesh(G3.rbox(gap*.9,.7,.7,.12),G3.std('#'+col.getHexString(),{r:.35,m:.2,e:'#'+col.getHexString(),ei:.15}));b.add(bx);
   const lb=G3.tex(128,64,(x)=>{x.fillStyle='#1E0F00';x.font=`800 ${String(mu).length>3?30:38}px "Chakra Petch",monospace`;x.textAlign='center';x.textBaseline='middle';x.fillText(mu,64,34)});const pl=new THREE.Mesh(new THREE.PlaneGeometry(gap*.86,.43),new THREE.MeshBasicMaterial({map:lb,transparent:true}));pl.position.z=.36;b.add(pl);
   b.position.set((k-R/2)*gap,top-R*rowH-.35,0);board.add(b);buckets.push({b,bx,y:b.position.y,h:0})});G3.cast(board)};
 if(ctx){build();ctx.add((dt)=>{for(const p of pegs){if(p.h>0){p.h-=dt*3;p.m.material.emissive.setRGB(p.h*1,p.h*.75,0);p.m.scale.setScalar(1+p.h*.3)}}for(const b of buckets){if(b.h>0){b.h-=dt*2.2;b.b.position.y=b.y-Math.sin(b.h*Math.PI)*.25;b.bx.material.emissiveIntensity=.15+b.h*1.2}}})}
 const segs=(id,key,fn)=>$(id).querySelectorAll('button').forEach(b=>b.onclick=()=>{if(pending){toast('Wait for balls to land');return}SND.click();$(id).querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset[key]);build()});
 segs('#pr','r',v=>risk=v);segs('#prow','n',v=>{R=+v;if(ctx){ctx.fit=[R+3,R*.82+3.6,1];ctx.tgt.set(0,(R*.82+.6)/2-.4,0);ctx.refit()}});
 if(ctx){ctx.fit=[R+3,R*.82+3.6,1];ctx.tgt.set(0,(R*.82+.6)/2-.4,0);ctx.refit()}
 const ballGeo=new THREE.SphereGeometry(.2,24,16);
 const once=(bet,fast)=>{if(!debit(bet))return Promise.resolve(null);const {f,nonce}=draw(R);const path=f.map(v=>v<.5?0:1);const k=path.reduce((a,b)=>a+b,0);const m=PL[R][risk][k];SND.click();pending++;
  const fin=()=>{pending--;const pay=settle('drop',bet,m,nonce,{fast,silentLoss:true});if(m<1&&!fast)SND.t(330,.1,{type:'triangle',vol:.06});pushHist('drop');$('#myg')&&($('#myg').innerHTML=myRows('drop'));return pay};
  if(!ctx)return sleep(150).then(fin);const {gap,rowH,top}=G();const ball=new THREE.Mesh(ballGeo,G3.std('#FF5470',{r:.15,m:.3,e:'#FF2A50',ei:.25,env:1.5}));ball.castShadow=true;ball.position.set((Math.random()-.5)*.3,top+1,.2);ctx.scene.add(ball);
  const stepT=fast?.07:.13;let t=0,rows=R;return new Promise(res=>{let lastR=-1;const off=ctx.add(dt=>{t+=dt;const e=t/stepT;const r=Math.min(rows,Math.floor(e)),fr=Math.min(1,e-r);let rights=0;for(let i=0;i<r;i++)rights+=path[i];
   if(r<rows&&r!==lastR){lastR=r;if(r>0){const p=pegs.find(q=>q.r===r-1&&q.i===rights+(path[r-1]?0:1));if(p)p.h=1;if(!fast||Math.random()<.3)SND.ping(r)}}
   const x0=(rights-r/2)*gap,x1=r<rows?(rights+path[r]-(r+1)/2)*gap:x0;const y0=top-(r-1)*rowH+.28,y1=top-r*rowH+.28;
   if(r<rows){const ez=fr<.5?2*fr*fr:1-Math.pow(-2*fr+2,2)/2;ball.position.x=x0+(x1-x0)*ez;ball.position.y=r===0?top+1-fr*.72:y0+(y1-y0)*fr+Math.sin(fr*Math.PI)*rowH*.4}else{ball.position.x=x0;ball.position.y=Math.max(top-rows*rowH-.1,top-(rows-1)*rowH+.28-(e-rows)*rowH*1.8)}
   ball.rotation.z-=dt*8;
   if(e>=rows+.6){off();ctx.scene.remove(ball);ball.material.dispose();const bk=buckets[k];if(bk)bk.h=1;if(m>=10&&!fast)G3.burst(ctx,bk.b.position.clone().add(V3(0,.5,.4)),{n:60,speed:4,g:5});res(fin())}})})};
 $('#gbtn').onclick=()=>{if(isAuto())return runAuto($('#gbtn'),'p-amt',(b,f)=>once(b,f));once(val('p-amt'),false)};
 wireMode(m=>{$('#gbtn').textContent=m==='auto'?'Start autobet':'Drop ball'});
 return ()=>{ctx&&ctx.dispose()}};
/* ===================== ASCEND 3D (astronaut climbs floating platforms) ===================== */
const TW={easy:{n:4,b:1},medium:{n:3,b:1},hard:{n:2,b:1},expert:{n:3,b:2}};
GAMEVIEWS.ascend=box=>{let mode='medium',G=null,moving=false;const F=9,FH=1.7;const mul=k=>{const t=TW[mode];return .99*Math.pow(t.n/(t.n-t.b),k)};
 box.innerHTML=`<div class="game"><div class="g-panel">${amtField('t-amt',1)}
 <div class="field"><label class="label">Difficulty</label><div class="seg" id="tm">${Object.keys(TW).map(k=>`<button data-m="${k}" class="${k===mode?'on':''}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div></div>
 <div class="statrow"><div class="stat"><small>Floor</small><b id="tf">0 / ${F}</b></div><div class="stat"><small>Multiplier</small><b id="tmu">1.00×</b></div><div class="stat"><small>Next</small><b id="tnx">—</b></div></div>
 <button class="btn lg block primary" id="gbtn">Start climb</button><button class="btn block" id="trand" disabled>Jump to a random platform</button></div>${ST()}</div>`;pushHist('ascend');
 const ctx=mk3($('#st3'),{pos:[0,3,11],target:[0,1.8,0],bg:'#140C34',fov:45,fit:[8.5,8.2]});let floors=[],A,tgtY=1.8;
 const build=()=>{if(!ctx)return;floors.forEach(f=>{ctx.scene.remove(f.g)});floors=[];const t=TW[mode];
  for(let r=0;r<F;r++){const g=new THREE.Group();g.position.y=(r+1)*FH;const tiles=[];for(let i=0;i<t.n;i++){const m=new THREE.Mesh(G3.rbox(1.35,.32,1.35,.12),G3.std('#5A47B8',{r:.35,m:.3}));m.position.x=(i-(t.n-1)/2)*1.75;m.castShadow=true;m.receiveShadow=true;m.userData={r,i};g.add(m);const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.03,6,32),G3.glow('#8A6BFF',.0));ring.rotation.x=Math.PI/2;ring.position.set(m.position.x,.2,0);g.add(ring);tiles.push({m,ring})}
   const lb=G3.label(fx(mul(r+1)),{scale:.5,color:'#C8B8FF'});lb.position.set(-(t.n/2)*1.75-.9,.1,0);g.add(lb);ctx.scene.add(g);floors.push({g,tiles,lb})}};
 if(ctx){const sc=ctx.scene;sc.add(G3.stars(1500,120,.35));const base=new THREE.Mesh(new THREE.CylinderGeometry(2.6,3,.5,48),G3.std('#3A3170',{r:.5,m:.3}));base.position.y=-.25;base.receiveShadow=true;sc.add(base);
  A=G3.astro(ctx);A.g.scale.setScalar(.75);sc.add(A.g);build();
  ctx.R.domElement.addEventListener('click',e=>{if(!G||G.over||moving)return;const cur=floors[G.floor];if(!cur)return;const h=ctx.pick(e,cur.tiles.map(t=>t.m));if(h)step(h.object.userData.i)});
  ctx.add((dt,t)=>{tgtY=G&&!G.over?G.floor*FH+1.8:(G?Math.max(1.8,G.floor*FH+1.2):1.8);ctx.tgt.y+=(tgtY-ctx.tgt.y)*Math.min(1,dt*3);ctx.refit();
   if(G&&!G.over&&floors[G.floor])floors[G.floor].tiles.forEach((T,i)=>{T.ring.material.opacity=.5+Math.sin(t*4+i)*.3;T.m.position.y=Math.sin(t*2+i)*.06});floors.forEach((f,r)=>{if(!G||G.over||r!==G.floor)f.tiles.forEach(T=>T.ring.material.opacity*=.9)})})}
 const paint=()=>{const k=G?G.floor:0;$('#tf').textContent=k+' / '+F;$('#tmu').textContent=fx(k?mul(k):1);$('#tnx').textContent=G&&!G.over?fx(mul(k+1)):fx(mul(1));
  const b=$('#gbtn');$('#trand').disabled=!(G&&!G.over);if(G&&!G.over){b.className='btn lg block cash';b.disabled=!k;b.innerHTML=k?`Cash out <span class="num">${fmt(G.bet*mul(k))}</span>`:'Tap a platform'}else{b.className='btn lg block primary';b.disabled=false;b.textContent='Start climb'}};
 const jumpTo=async(x,y)=>{if(!ctx)return;const sx=A.g.position.x,sy=A.g.position.y;await ctx.tween(.45,k=>{A.g.position.x=sx+(x-sx)*k;A.g.position.y=sy+(y-sy)*k+Math.sin(k*Math.PI)*1.3;A.g.rotation.y=Math.sin(k*Math.PI)*.6},G3.ease.inOut)};
 const step=async i=>{if(!G||G.over||moving)return;moving=true;const r=G.floor;const bad=G.bombs[r].includes(i);const T=floors[r]?.tiles[i];
  if(ctx){await jumpTo(T.m.position.x,(r+1)*FH+.16)}
  if(bad){G.over=true;SND.boom();if(ctx){T.m.material.color=G3.lin('#FF5470');G3.burst(ctx,V3(T.m.position.x,(r+1)*FH+.3,0),{n:150,speed:7});ctx.shake(.5);T.m.visible=false;const sy=A.g.position.y;ctx.tween(1.1,k=>{A.g.position.y=sy-k*k*12;A.g.rotation.z=k*6},G3.ease.lin);
    floors.forEach((f,rr)=>{if(rr>=r)f.tiles.forEach((TT,ii)=>{if(rr===r&&ii===i)return;TT.m.material.color=G3.lin(G.bombs[rr].includes(ii)?'#8A2240':'#1E7A5E');TT.m.material.transparent=true;TT.m.material.opacity=.55})})}
   settle('ascend',G.bet,0,G.nonce,{silentLoss:true});pushHist('ascend');$('#myg').innerHTML=myRows('ascend')}
  else{if(ctx){T.m.material.color=G3.lin('#22E39A');T.m.material.emissive=G3.lin('#0E8A5F');G3.burst(ctx,V3(T.m.position.x,(r+1)*FH+.4,0),{n:40,speed:3,g:4,colors:['#22E39A','#fff','#FFC23D']})}G.floor++;G.pick[r]=i;SND.gem(G.floor);if(G.floor===F){paint();moving=false;cash();return}}
  moving=false;paint()};
 const cash=()=>{const m=mul(G.floor);G.over=true;const pay=settle('ascend',G.bet,m,G.nonce);SND.cash();toast(`Cashed out ${fmt(pay)} USDT`,'w');pushHist('ascend');$('#myg').innerHTML=myRows('ascend');if(ctx){const y=A.g.position.y;ctx.tween(.5,k=>{A.g.position.y=y+Math.sin(k*Math.PI)*1.2;A.g.rotation.y=k*Math.PI*2});G3.burst(ctx,A.g.position.clone().add(V3(0,1,0)),{n:90,speed:6})}paint()};
 const reset=()=>{if(!ctx)return;build();A.g.position.set(0,0,0);A.g.rotation.set(0,0,0)};
 $('#tm').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(G&&!G.over)return;SND.click();mode=b.dataset.m;G=null;$('#tm').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));reset();paint()});
 $('#gbtn').onclick=()=>{if(G&&!G.over){if(G.floor)cash();return}const bet=val('t-amt');if(!debit(bet))return;SND.bet();const t=TW[mode];const {f,nonce}=draw(F*3);
  const bombs=Array.from({length:F},(_,r)=>{const idx=shuffle(f.slice(r*3,r*3+3).concat([.5,.5,.5]).slice(0,t.n-1),t.n);return idx.slice(0,t.b)});G={bet,nonce,bombs,pick:{},floor:0,over:false};reset();paint()};
 $('#trand').onclick=()=>step(rnd(TW[mode].n));paint();return ()=>{if(G&&!G.over){if(G.floor)cash();else{S.bal+=G.bet;updBal()}}ctx&&ctx.dispose()}};
/* ===================== HOP 3D (frog crosses traffic) ===================== */
const HP={easy:1/25,medium:3/25,hard:5/25,expert:10/25};
function carMesh(col){const g=new THREE.Group();const body=new THREE.Mesh(G3.rbox(1.2,.55,2.1,.18),G3.std(col,{r:.3,m:.35}));body.position.y=.45;g.add(body);const cab=new THREE.Mesh(G3.rbox(1,.45,1.1,.15),G3.std('#16102E',{r:.1,m:.6,env:1.6}));cab.position.set(0,.88,-.1);g.add(cab);
 for(const sx of [-1,1])for(const sz of [-1,1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.18,14),G3.std('#0B0818',{r:.6}));w.rotation.z=Math.PI/2;w.position.set(.58*sx,.22,.65*sz);g.add(w)}
 for(const sx of [-1,1]){const h=new THREE.Mesh(new THREE.BoxGeometry(.22,.12,.05),G3.glow('#FFF3B0'));h.position.set(.38*sx,.5,1.06);g.add(h);const t=new THREE.Mesh(new THREE.BoxGeometry(.22,.12,.05),G3.glow('#FF5470'));t.position.set(.38*sx,.5,-1.06);g.add(t)}G3.cast(g);return g}
GAMEVIEWS.hop=box=>{let mode='medium',G=null,moving=false;const L=12,LW=2.2;const mul=k=>.99/Math.pow(1-HP[mode],k);
 box.innerHTML=`<div class="game"><div class="g-panel">${amtField('h-amt',1)}
 <div class="field"><label class="label">Difficulty</label><div class="seg" id="hm">${Object.keys(HP).map(k=>`<button data-m="${k}" class="${k===mode?'on':''}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div></div>
 <div class="statrow"><div class="stat"><small>Lane</small><b id="hl">0 / ${L}</b></div><div class="stat"><small>Multiplier</small><b id="hmu">1.00×</b></div><div class="stat"><small>Hit chance</small><b id="hch"></b></div></div>
 <button class="btn lg block primary" id="gbtn">Start</button><button class="btn lg block cash" id="hcash" disabled>Cash out</button></div>${ST()}</div>`;pushHist('hop');
 const ctx=mk3($('#st3'),{pos:[-5.5,9,9],target:[2.2,0,0],bg:'#1E3A30',fov:42,shadowSize:14,keyPos:[4,14,6]});let frog,lanes=[],labels=[];
 if(ctx){const sc=ctx.scene;sc.fog=new THREE.Fog(G3.lin('#1E3A30'),26,46);
  const grass=new THREE.Mesh(new THREE.BoxGeometry(LW*2,.4,30),G3.std('#3E8A4A',{r:.95}));grass.position.set(-LW/2,-.2,0);grass.receiveShadow=true;sc.add(grass);
  for(let i=0;i<L;i++){const x=(i+1)*LW;const road=new THREE.Mesh(new THREE.BoxGeometry(LW,.4,30),G3.std(i%2?'#2E2850':'#2A2448',{r:.9}));road.position.set(x,-.2,0);road.receiveShadow=true;sc.add(road);
   for(let z=-14;z<14;z+=2.2){const d=new THREE.Mesh(new THREE.BoxGeometry(.1,.02,1.1),G3.std('#E6DFFF',{r:.8}));d.position.set(x+LW/2,.01,z);sc.add(d)}
   const lb=G3.label(fx(mul(i+1)),{scale:.55,bg:'rgba(7,5,15,.75)',color:'#F4F1FF',radius:30});lb.position.set(x,.9,2.6);sc.add(lb);labels.push(lb);
   const cars=[];const n=1+(i%2);const dir=i%2?1:-1;for(let c=0;c<n;c++){const car=carMesh(['#FF5470','#5C9BFF','#FFC23D','#C8B8FF','#22E39A','#FF9A1F'][(i+c*3)%6]);car.position.set(x,0,(c/n)*28-14);car.rotation.y=dir>0?0:Math.PI;sc.add(car);cars.push(car)}
   const bar=new THREE.Group();for(const z of [-1.6,1.6]){const p=new THREE.Mesh(new THREE.BoxGeometry(.18,.9,.18),G3.std('#FFC23D'));p.position.set(0,.45,z);bar.add(p)}const bb=new THREE.Mesh(new THREE.BoxGeometry(.12,.28,3.4),G3.tex?new THREE.MeshStandardMaterial({map:G3.tex(128,16,(x,w,h)=>{for(let k=0;k<8;k++){x.fillStyle=k%2?'#241500':'#FFC23D';x.fillRect(k*16,0,16,16)}}),roughness:.6}):null);bb.position.y=.8;bar.add(bb);bar.position.set(x,0,0);bar.visible=false;sc.add(bar);
   lanes.push({x,cars,dir,speed:5+((i*37)%17)/3,bar,stop:false})}
  const goal=new THREE.Mesh(new THREE.BoxGeometry(LW*2,.4,30),G3.std('#C8A040',{r:.8}));goal.position.set((L+1)*LW+LW/2,-.2,0);goal.receiveShadow=true;sc.add(goal);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.8),G3.std('#FFC23D',{side:THREE.DoubleSide}));flag.position.set((L+1)*LW+.5,2,-1);sc.add(flag);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.6),G3.std('#E6DFFF'));pole.position.set((L+1)*LW-.1,1.3,-1);sc.add(pole);
  for(let i=0;i<14;i++){const tr=new THREE.Group();const tk=new THREE.Mesh(new THREE.BoxGeometry(.3,.8,.3),G3.std('#6A4A2A'));tk.position.y=.4;tr.add(tk);const lf=new THREE.Mesh(G3.rbox(1.1,1.1,1.1,.2),G3.std('#2E7A3A',{r:.9}));lf.position.y=1.3;tr.add(lf);G3.cast(tr);tr.position.set(-LW*1.2+Math.random()*1.2,0,(i<7?-1:1)*(4+Math.random()*9));sc.add(tr)}
  frog=G3.frog(ctx);frog.g.rotation.y=Math.PI/2;sc.add(frog.g);
  ctx.add((dt,t)=>{lanes.forEach((ln,i)=>{ln.cars.forEach(c=>{if(ln.stop&&Math.abs(c.position.z)<6&&!c.zoom)return;const sp=(c.zoom?28:ln.speed)*ln.dir;c.position.z+=sp*dt;if(c.position.z>15){c.position.z=-15;c.zoom=0}if(c.position.z<-15){c.position.z=15;c.zoom=0}})});
   const fx_=frog.g.position.x;ctx.tgt.x+=(fx_+2.2-ctx.tgt.x)*Math.min(1,dt*3);ctx.cam.position.set(ctx.tgt.x-7.7,9,9);ctx.cam.lookAt(ctx.tgt);if(!moving&&!(G&&G.over&&G.hit!=null))frog.g.scale.y=1+Math.sin(t*4)*.04})}
 const paint=()=>{const pos=G?G.pos:0;$('#hl').textContent=pos+' / '+L;$('#hmu').textContent=fx(pos?mul(pos):1);$('#hch').textContent=(HP[mode]*100).toFixed(0)+'%';labels.forEach((l,i)=>l.set(fx(mul(i+1))));
  const b=$('#gbtn'),c=$('#hcash');if(G&&!G.over){b.innerHTML=`Hop <span class="num">→ ${fx(mul(pos+1))}</span>`;c.disabled=!pos;c.innerHTML=pos?`Cash out <span class="num">${fmt(G.bet*mul(pos))}</span>`:'Cash out'}else{b.textContent='Start';c.disabled=true;c.textContent='Cash out'}};
 const reset=()=>{if(!ctx)return;frog.g.position.set(0,0,0);frog.g.scale.set(1,1,1);frog.g.rotation.set(0,Math.PI/2,0);lanes.forEach(l=>{l.stop=false;l.bar.visible=false})};
 const cash=()=>{const m=mul(G.pos);G.over=true;const pay=settle('hop',G.bet,m,G.nonce);SND.cash();toast(`Cashed out ${fmt(pay)} USDT`,'w');pushHist('hop');$('#myg').innerHTML=myRows('hop');if(ctx){G3.burst(ctx,frog.g.position.clone().add(V3(0,1,0)),{n:80,speed:5});const y=0;ctx.tween(.5,k=>{frog.g.position.y=Math.sin(k*Math.PI)*1.5;frog.g.rotation.y=Math.PI/2+k*Math.PI*2})}paint()};
 $('#hm').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(G&&!G.over)return;SND.click();mode=b.dataset.m;G=null;$('#hm').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));reset();paint()});
 $('#gbtn').onclick=async()=>{if(moving)return;if(!G||G.over){const bet=val('h-amt');if(!debit(bet))return;SND.bet();const {f,nonce}=draw(L);G={bet,nonce,lanes:f.map(v=>v<HP[mode]),pos:0,over:false,hit:null};reset();paint();return}
  moving=true;const i=G.pos;const hit=G.lanes[i];SND.t(520,.12,{type:'triangle',vol:.1,slide:1.6});
  if(ctx){const ln=lanes[i];if(!hit){ln.cars.forEach(c=>{if(Math.abs(c.position.z)<5)c.zoom=1})}else{const c=ln.cars[0];c.position.z=-ln.dir*9;c.zoom=0}
   const x0=frog.g.position.x,x1=(i+1)*LW;await ctx.tween(.36,k=>{frog.g.position.x=x0+(x1-x0)*k;frog.g.position.y=Math.sin(k*Math.PI)*1.1;frog.g.scale.set(1,1+Math.sin(k*Math.PI)*.25,1)},G3.ease.inOut);frog.g.scale.set(1.15,.8,1.15);ctx.tween(.15,k=>frog.g.scale.set(1.15-k*.15,.8+k*.2,1.15-k*.15));
   if(hit){const c=ln.cars[0];c.zoom=1;c.position.z=-ln.dir*4.5;await ctx.tween(.16,k=>{c.position.z=-ln.dir*4.5*(1-k)});frog.g.scale.set(1.5,.12,1.5);SND.boom();ctx.shake(.5);G3.burst(ctx,frog.g.position.clone().add(V3(0,.3,0)),{n:90,speed:5,colors:['#6FDB5E','#3E9A35','#FF5470','#fff']})}
   else{ln.stop=true;ln.bar.visible=true;ln.bar.position.z=0}}
  if(hit){G.hit=i;G.over=true;settle('hop',G.bet,0,G.nonce,{silentLoss:true});pushHist('hop');$('#myg').innerHTML=myRows('hop')}else{G.pos++;SND.gem(G.pos);if(G.pos===L){moving=false;paint();cash();return}}
  moving=false;paint()};
 $('#hcash').onclick=()=>{if(G&&!G.over&&G.pos)cash()};paint();return ()=>{if(G&&!G.over){if(G.pos)cash();else{S.bal+=G.bet;updBal()}}ctx&&ctx.dispose()}};
/* ===================== SPIN 3D: game-show wheel with host ===================== */
function spread(spec){const pool=spec.map(([m,c])=>({m,c}));const out=[];while(out.length<30){for(const p of pool)if(p.c>0){out.push(p.m);p.c--}}return out}
const WH={low:spread([[0,7],[1.2,17],[1.5,6]]),medium:spread([[0,17],[1.5,6],[2,3],[3,3],[5.7,1]]),high:spread([[0,29],[29.7,1]])};
const WCOL={0:'#2A2350',1.2:'#5C9BFF',1.5:'#8A6BFF',2:'#22E39A',3:'#FFC23D',5.7:'#FF9A1F',29.7:'#FF5470'};
GAMEVIEWS.spin=box=>{let risk='medium',spinning=false,rot=0,last=-1;const A=Math.PI*2/30;
 box.innerHTML=`<div class="game"><div class="g-panel">${panelHead()}${amtField('w-amt',1)}
 <div class="field"><label class="label">Risk</label><div class="seg" id="wr"><button data-r="low">Low</button><button data-r="medium" class="on">Medium</button><button data-r="high">High</button></div></div>
 <div class="row" id="wleg"></div>${autoFields()}
 <button class="btn lg block primary" id="gbtn">Spin</button><div class="auto-only profit"><span>Bets <b class="num" id="a-count">0</b></span><span>Profit <b class="num" id="a-profit">0.00</b></span></div></div>${ST()}</div>`;pushHist('spin');
 const ov=$('#ov');const ctx=mk3($('#st3'),{pos:[1.4,3.4,12],target:[1.4,3.2,0],bg:'#1A0E2E',fov:40,fit:[12.5,10.6]});let wheel,face,flap,host,bulbs=[];
 const faceTex=()=>G3.tex(1024,1024,(x,w,h)=>{const c=w/2,R=w/2-6;WH[risk].forEach((m,i)=>{const a0=-Math.PI/2+i*A,a1=a0+A;x.beginPath();x.moveTo(c,c);x.arc(c,c,R,a0,a1);x.closePath();x.fillStyle=WCOL[m];x.fill();x.strokeStyle='#0B0818';x.lineWidth=5;x.stroke();
  x.save();x.translate(c,c);x.rotate(a0+A/2+Math.PI/2);x.fillStyle=m?(m===3||m===2?'#0B0818':'#fff'):'#8178AE';x.font=`800 ${m>=10?40:44}px "Chakra Petch",monospace`;x.textAlign='center';x.fillText(m?m+'×':'0',0,-R+70);x.restore()});
  const g=x.createRadialGradient(c,c,R*.55,c,c,R);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.25)');x.fillStyle=g;x.beginPath();x.arc(c,c,R,0,7);x.fill()});
 if(ctx){const sc=ctx.scene;const floor=new THREE.Mesh(new THREE.CircleGeometry(14,48),G3.std('#120A26',{r:.4,m:.4,env:.6}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.2;floor.receiveShadow=true;sc.add(floor);
  const stage=new THREE.Mesh(new THREE.CylinderGeometry(6,6.4,.4,64),G3.std('#3B2A92',{r:.4,m:.2}));stage.position.y=-1;stage.receiveShadow=true;sc.add(stage);const trim=new THREE.Mesh(new THREE.TorusGeometry(6.2,.06,8,64),G3.glow('#FFC23D'));trim.rotation.x=Math.PI/2;trim.position.y=-.8;sc.add(trim);
  wheel=new THREE.Group();wheel.position.set(0,3.6,0);sc.add(wheel);const R=3.2;
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(R+.25,R+.25,.35,72),G3.std('#FFC23D',{r:.25,m:.85}));disc.rotation.x=Math.PI/2;wheel.add(disc);
  face=new THREE.Mesh(new THREE.CircleGeometry(R,72),new THREE.MeshStandardMaterial({map:faceTex(),roughness:.5}));face.position.z=.18;wheel.add(face);
  for(let i=0;i<30;i++){const a=i*A;const p=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.3,10),G3.std('#F4F1FF',{r:.2,m:.8}));p.rotation.x=Math.PI/2;p.position.set(Math.sin(a)*(R-.12),Math.cos(a)*(R-.12),.32);wheel.add(p)}
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.7,.8,.5,40),G3.std('#16102E',{r:.2,m:.6}));hub.rotation.x=Math.PI/2;hub.position.z=.3;wheel.add(hub);const logo=new THREE.Mesh(new THREE.CircleGeometry(.6,32),new THREE.MeshBasicMaterial({map:G3.tex(128,128,(x)=>{x.fillStyle='#16102E';x.fillRect(0,0,128,128);x.strokeStyle='#FFC23D';x.lineWidth=12;x.lineCap='round';x.beginPath();x.moveTo(30,98);x.quadraticCurveTo(80,92,96,34);x.stroke();x.fillStyle='#8A6BFF';x.beginPath();x.arc(30,98,9,0,7);x.fill()})}));logo.position.z=.56;wheel.add(logo);
  const ring=new THREE.Group();ring.position.copy(wheel.position);sc.add(ring);for(let i=0;i<36;i++){const a=i/36*Math.PI*2;const b=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),new THREE.MeshBasicMaterial({color:G3.lin('#FFC23D')}));b.position.set(Math.sin(a)*(R+.55),Math.cos(a)*(R+.55),.05);ring.add(b);bulbs.push(b)}
  const rr=new THREE.Mesh(new THREE.TorusGeometry(R+.55,.16,12,80),G3.std('#3B2A92',{r:.3,m:.5}));ring.add(rr);
  for(const s of [-1,1]){const leg=new THREE.Mesh(G3.rbox(.4,4.6,.4,.12),G3.std('#3B2A92',{r:.4,m:.3}));leg.position.set(s*1.4,1.2,-.5);leg.rotation.z=-s*.28;leg.castShadow=true;sc.add(leg)}
  flap=new THREE.Group();flap.position.set(0,3.6+R+.5,.35);const fm=new THREE.Mesh(new THREE.ConeGeometry(.28,.8,4),G3.std('#F4F1FF',{r:.2,m:.5}));fm.rotation.z=Math.PI;fm.position.y=-.3;flap.add(fm);sc.add(flap);G3.cast(sc);
  host=G3.person(ctx,{vest:'#B4245A',hair:'#2A1810',skin:'#C8906A',tie:'#FFC23D',long:true});host.g.position.set(4.9,-1.05,1);host.g.scale.setScalar(1.05);host.g.rotation.y=-.5;host.look.set(0,3,8);sc.add(host.g);
  ctx.add((dt,t)=>{wheel.rotation.z=rot;bulbs.forEach((b,i)=>{const on=spinning?((Math.floor(t*14)+i)%3===0):((Math.floor(t*3)+i)%2===0);b.material.color=G3.lin(on?'#FFF3B0':'#7A5A10')});
   const seg=Math.floor(((rot%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/A);if(seg!==last&&spinning){SND.tick(1.2);last=seg;flap.rotation.z=.45}flap.rotation.z*=Math.pow(.02,dt)})}
 const leg=()=>{const segs=WH[risk];const u=[...new Set(segs)].sort((a,b)=>a-b);$('#wleg').innerHTML=u.map(m=>`<span class="chip" style="color:${m?WCOL[m]:'var(--ink-faint)'}"><span style="width:8px;height:8px;border-radius:2px;background:${WCOL[m]}"></span>${fx(m)} · ${segs.filter(x=>x===m).length}/30</span>`).join('');if(face){face.material.map.dispose();face.material.map=faceTex();face.material.needsUpdate=true}};
 $('#wr').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(spinning||AUTO)return;SND.click();risk=b.dataset.r;$('#wr').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));leg()});leg();
 const once=(bet,fast)=>new Promise(async resolve=>{if(spinning||!debit(bet))return resolve(null);spinning=true;const {f,nonce}=draw(1);const k=Math.floor(f[0]*30);ov.innerHTML='';
  const TAU=Math.PI*2,target=(k+.5)*A+(Math.random()-.5)*A*.6;const delta=((target-rot)%TAU+TAU)%TAU;const from=rot,to=rot+TAU*(fast?2:5)+delta;
  if(host&&!fast)host.gesture('spin');if(ctx)await ctx.tween(fast?.9:4.2,e=>{rot=from+(to-from)*e},k=>1-Math.pow(1-k,4));else await sleep(300);rot=to%TAU;spinning=false;
  const m=WH[risk][k];ov.innerHTML=`<div class="big" style="color:${m?'var(--win)':'var(--loss)'}">${fx(m)}</div>`;if(host&&!fast)host.gesture(m>=2?'cheer':m?'point':'sad');if(ctx&&m>=3&&!fast)G3.burst(ctx,V3(0,7.4,1),{n:120,speed:6});
  const pay=settle('spin',bet,m,nonce,{fast});pushHist('spin');$('#myg')&&($('#myg').innerHTML=myRows('spin'));resolve(pay)});
 $('#gbtn').onclick=()=>{if(isAuto())return runAuto($('#gbtn'),'w-amt',once);once(val('w-amt'),false)};
 wireMode(m=>{$('#gbtn').textContent=m==='auto'?'Start autobet':'Spin'});return ()=>ctx&&ctx.dispose()};
/* ===================== KENO 3D: ball machine + board ===================== */
const KP={1:[0,3.96],2:[0,1.48,7.31],3:[0,0,5.18,23.2],4:[0,0,2.27,10.2,45.5],5:[0,0,0,7.27,36,178],6:[0,0,0,3.43,16.2,76.2,359],7:[0,0,0,1.86,8.33,37.3,167,750],8:[0,0,0,0,6.31,26.9,115,489,2083],9:[0,0,0,0,3.41,14.5,62,264,1127,4803],10:[0,0,0,0,2.08,8.44,34.2,139,563,2283,9259]};
const ballTex={};const kBallTex=n=>ballTex[n]||(ballTex[n]=G3.tex(128,64,(x)=>{const c=['#FF5470','#FFC23D','#22E39A','#5C9BFF','#8A6BFF'][n%5];x.fillStyle=c;x.fillRect(0,0,128,64);x.fillStyle='#fff';x.beginPath();x.ellipse(64,32,22,26,0,0,7);x.fill();x.fillStyle='#16102E';x.font='800 26px "Chakra Petch",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(n,64,34)},true));
GAMEVIEWS.keno=box=>{let picks=new Set(),busy=false,drawn=[];
 box.innerHTML=`<div class="game"><div class="g-panel">${panelHead()}${amtField('k-amt',1)}
 <div class="grid2"><button class="btn" id="kauto">Auto pick</button><button class="btn" id="kclr">Clear</button></div>
 <div class="statrow" style="grid-template-columns:1fr 1fr"><div class="stat"><small>Picked</small><b id="kpc">0 / 10</b></div><div class="stat"><small>Top payout</small><b id="ktop">—</b></div></div>${autoFields()}
 <button class="btn lg block primary" id="gbtn">Draw</button><div class="auto-only profit"><span>Bets <b class="num" id="a-count">0</b></span><span>Profit <b class="num" id="a-profit">0.00</b></span></div></div>
 <div class="g-stage" style="display:flex;flex-direction:column"><div class="g-hist"></div><div id="st3" style="position:relative;height:240px;flex:0 0 auto"></div><div class="keno" id="kg" style="padding-top:8px"></div><div class="paytbl" id="kpay"></div></div></div>`;pushHist('keno');
 const ctx=mk3($('#st3'),{pos:[0,1.6,9.5],target:[0,1.25,0],bg:'#0E2F3A',fov:36,fit:[10.5,5.8]});let balls=[],rack=[],glass;
 if(ctx){const sc=ctx.scene;sc.background=new THREE.Color('#0E2F3A');const base=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.8,.9,40),G3.std('#FFC23D',{r:.3,m:.8}));base.position.set(-3,-.9,0);sc.add(base);
  glass=new THREE.Mesh(new THREE.SphereGeometry(1.7,40,30),G3.std('#BFF4FA',{r:.05,m:0,op:.18,env:2}));glass.position.set(-3,1.2,0);sc.add(glass);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.72,.06,10,48),G3.std('#FFC23D',{r:.25,m:.85}));ring.position.copy(glass.position);ring.rotation.x=Math.PI/2;sc.add(ring);
  const tube=new THREE.Mesh(new THREE.TorusGeometry(1.6,.18,12,40,Math.PI*.5),G3.std('#BFF4FA',{op:.25,r:.05}));tube.position.set(-1.4,2.9,0);tube.rotation.z=Math.PI;sc.add(tube);
  const tray=new THREE.Mesh(G3.rbox(7.4,.25,.8,.1),G3.std('#16404A',{r:.5,m:.3}));tray.position.set(1.4,2.5,0);tray.castShadow=true;sc.add(tray);
  for(let i=1;i<=40;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.2,20,14),new THREE.MeshStandardMaterial({map:kBallTex(i),roughness:.25}));const d=V3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(Math.random()*1.2);b.position.copy(glass.position).add(d);b.v=V3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(3);b.n=i;sc.add(b);balls.push(b)}
  G3.cast(sc);ctx.add((dt,t)=>{const c=glass.position;const blow=busy?9:3;for(const b of balls){if(b.out)continue;b.v.y+=(-6+blow*(b.position.y<c.y?1.4:.2))*dt;b.v.x+=(Math.random()-.5)*blow*dt*4;b.v.z+=(Math.random()-.5)*blow*dt*4;b.position.addScaledVector(b.v,dt);const d=b.position.clone().sub(c);if(d.length()>1.45){d.normalize();b.position.copy(c).addScaledVector(d,1.45);const vn=d.multiplyScalar(b.v.dot(d));b.v.sub(vn.multiplyScalar(1.8))}b.rotation.x+=b.v.y*dt;b.rotation.y+=b.v.x*dt}})}
 const resetBalls=()=>{if(!ctx)return;rack=[];for(const b of balls){if(b.out){b.out=false;b.scale.setScalar(1);b.position.copy(glass.position)}}};
 const shoot=async(n,i,fast)=>{if(!ctx)return;const b=balls[n-1];b.out=true;const p0=b.position.clone(),p1=V3(-1.4,4.6,0),p2=V3(-2+i*.72,2.85,0);const dur=fast?.12:.4;await ctx.tween(dur,k=>{b.position.lerpVectors(p0,p1,k)});await ctx.tween(dur,k=>{b.position.lerpVectors(p1,p2,k);b.position.y+=Math.sin(k*Math.PI)*.3},G3.ease.outBounce);b.scale.setScalar(1.25)};
 const grid=()=>{$('#kg').innerHTML=Array.from({length:40},(_,i)=>{const n=i+1,p=picks.has(n),d=drawn.includes(n);return `<button class="kn ${p&&d?'hit':p?(drawn.length===10?'pick miss':'pick'):d?'drawn':''}" data-n="${n}">${n}</button>`}).join('');$$('#kg .kn').forEach(b=>b.onclick=()=>toggle(+b.dataset.n))};
 const pay=hits=>{const n=picks.size;$('#kpc').textContent=n+' / 10';$('#ktop').textContent=n?fx(KP[n][n]):'—';$('#kpay').innerHTML=n?KP[n].map((m,k)=>`<div class="${hits===k?'on':''}"><small>${k} hits</small>${m?fx(m):'0×'}</div>`).join(''):'<span class="small muted">Pick 1 to 10 numbers to see the paytable</span>'};
 const toggle=n=>{if(busy||AUTO)return;if(drawn.length){drawn=[];resetBalls()}if(picks.has(n))picks.delete(n);else{if(picks.size>=10){toast('Pick up to 10 numbers');return}picks.add(n)}SND.click();grid();pay()};
 $('#kclr').onclick=()=>{if(busy||AUTO)return;picks.clear();drawn=[];resetBalls();grid();pay()};
 $('#kauto').onclick=()=>{if(busy||AUTO)return;picks.clear();drawn=[];resetBalls();const all=[...Array(40).keys()].map(i=>i+1);while(picks.size<10)picks.add(all.splice(rnd(all.length),1)[0]);SND.chip();grid();pay()};
 const once=async(bet,fast)=>{if(!picks.size){toast('Pick at least one number','e');return null}if(!debit(bet))return null;busy=true;const {f,nonce}=draw(39);const order=shuffle(f,40).slice(0,10).map(i=>i+1);drawn=[];resetBalls();grid();
  for(let i=0;i<order.length;i++){const n=order[i];drawn.push(n);if(ctx)await shoot(n,i,fast);else await sleep(fast?25:140);const el=$(`#kg [data-n="${n}"]`);if(!el)break;if(picks.has(n)){el.className='kn hit';SND.gem(drawn.filter(x=>picks.has(x)).length)}else{el.className='kn drawn';SND.tick(.5)}}
  const hits=order.filter(n=>picks.has(n)).length;grid();pay(hits);busy=false;const m=KP[picks.size][hits];const p=settle('keno',bet,m,nonce,{fast});pushHist('keno');$('#myg')&&($('#myg').innerHTML=myRows('keno'));return p};
 $('#gbtn').onclick=async()=>{if(isAuto())return runAuto($('#gbtn'),'k-amt',once);if(busy)return;await once(val('k-amt'))};
 wireMode(m=>{$('#gbtn').textContent=m==='auto'?'Start autobet':'Draw'});[3,9,14,22,27,31,38].forEach(n=>picks.add(n));grid();pay();return ()=>ctx&&ctx.dispose()};
