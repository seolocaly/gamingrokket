/* ===================== shared 3D card table ===================== */
const SUITS=['♠','♥','♦','♣'],RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const cardOf=f=>{const i=Math.floor(f*52);return {r:i%13,s:Math.floor(i/13)}};
function cardTable(el,o={}){const ctx=mk3(el,{pos:[0,6.6,7.4],target:[0,.2,-.2],bg:'#0E0A20',fov:42,fit:o.fit||[9.6,6.6],shadowSize:9,keyPos:[2,12,6]});if(!ctx)return null;
 const T=G3.table(ctx,{felt:o.felt||'#0A3528',felt2:o.felt2||'#18704F',paint:(x,w,h)=>{x.textAlign='center';x.fillStyle='rgba(255,255,255,.22)';x.font='800 30px "Bricolage Grotesque",sans-serif';(o.lines||[]).forEach((l,i)=>x.fillText(l,w/2,h*(.42+i*.08)));x.strokeStyle='rgba(255,194,61,.45)';x.lineWidth=4;(o.spots||[]).forEach(([cx,cy,r])=>{x.beginPath();x.arc(cx*w,cy*h,r,0,7);x.stroke()});o.paint&&o.paint(x,w,h)}});
 const D=G3.person(ctx,o.dealer||{});D.g.position.set(0,-.25,-3.15);D.look.set(0,1,6);ctx.scene.add(D.g);
 const shoe=new THREE.Group();const sb=new THREE.Mesh(G3.rbox(1,.55,1.4,.1),G3.std('#16102E',{r:.3,m:.4}));sb.position.y=.27;shoe.add(sb);const st=new THREE.Mesh(G3.rbox(.82,.06,1.2,.03),G3.std('#FFC23D',{m:.8,r:.3}));st.position.y=.57;shoe.add(st);for(let i=0;i<6;i++){const c=G3.card(0,0,false);c.position.set(0,.38+i*.025,.1);c.rotation.x=Math.PI-.3;shoe.add(c)}shoe.position.set(3.3,0,-1.2);shoe.rotation.y=-.4;G3.cast(shoe);ctx.scene.add(shoe);
 const rack=new THREE.Group();[['#C8233F',5],['#22A37A',1],['#8A6BFF',10],['#16102E',100],['#FF9A1F',25]].forEach(([c,v],i)=>{for(let k=0;k<6;k++){const ch=G3.chip(v);ch.position.set(-1.4+i*.5,.04+k*.06,-2);rack.add(ch)}});ctx.scene.add(rack);
 const cards=[];const from=V3(3.1,.75,-1.1);
 const deal=async(c,pos,faceUp=true,yaw=0)=>{const m=G3.card(c.r,c.s,false);m.scale.setScalar(o.cardScale||1.3);m.position.copy(from);m.rotation.set(Math.PI,-.4,0);ctx.scene.add(m);cards.push(m);D.gesture('deal');SND.deal();
  await ctx.tween(.38,k=>{m.position.lerpVectors(from,pos,k);m.position.y=from.y+(pos.y-from.y)*k+Math.sin(k*Math.PI)*.8;m.rotation.x=faceUp?Math.PI*(1-k):Math.PI;m.rotation.y=-.4+(yaw+.4)*k},G3.ease.inOut);return m};
 const flip=async m=>{SND.deal();const y=m.position.y;await ctx.tween(.35,k=>{m.rotation.x=Math.PI*(1-k);m.position.y=y+Math.sin(k*Math.PI)*.4})};
 const clear=async()=>{if(!cards.length)return;const cs=cards.splice(0);await ctx.tween(.3,k=>{cs.forEach(m=>{m.position.x+=(3.2-m.position.x)*k*.25;m.position.z+=(-2.5-m.position.z)*k*.25;m.position.y+=k*.05})});cs.forEach(m=>{ctx.scene.remove(m);m.geometry.dispose()})};
 const chips=[];const betChips=(amt,pos)=>{const vals=[100,25,10,5,1,.1];let a=amt,i=0;const st=[];while(a>=.1&&st.length<12){const v=vals.find(x=>x<=a+1e-9)||.1;a=+(a-v).toFixed(2);const ch=G3.chip(v);ch.position.set(pos.x+(Math.random()-.5)*.04,.04+st.length*.065,pos.z+(Math.random()-.5)*.04);ctx.scene.add(ch);st.push(ch);chips.push(ch)}SND.chip();return st};
 const sweep=async(win)=>{const cs=chips.splice(0);if(!cs.length)return;const tgt=win?V3(0,.05,5.5):V3(0,.05,-2);await ctx.tween(.45,k=>cs.forEach(c=>{c.position.lerp(tgt,k*.3)}));cs.forEach(c=>ctx.scene.remove(c))};
 const lbl=(p)=>{const l=G3.label('',{scale:.42,bg:'rgba(7,5,15,.78)',radius:40,w:300,h:90});l.position.copy(p);ctx.scene.add(l);return l};
 return {ctx,D,deal,flip,clear,betChips,sweep,lbl,cards}}
/* ===================== BLACKJACK 3D ===================== */
const cval=c=>c.r===0?11:Math.min(10,c.r+1);
function handVal(cs){let t=0,a=0;for(const c of cs){if(!c)continue;t+=cval(c);if(c.r===0)a++}while(t>21&&a){t-=10;a--}return {t,soft:a>0}}
const isBJ=cs=>cs.length===2&&handVal(cs).t===21;
const hvTxt=cs=>{const v=handVal(cs);return isBJ(cs)?'Blackjack':v.t>21?`Bust ${v.t}`:v.t+(v.soft&&v.t<21?' / '+(v.t-10):'')};
GAMEVIEWS.blackjack=box=>{let G=null,dealing=false;
 box.innerHTML=`<div class="game"><div class="g-panel">${amtField('bj-amt',5)}
 <div class="bjact"><button class="btn" id="bj-hit" disabled>Hit</button><button class="btn" id="bj-stand" disabled>Stand</button><button class="btn" id="bj-dbl" disabled>Double</button><button class="btn" id="bj-split" disabled>Split</button></div>
 <button class="btn lg block primary" id="gbtn">Deal</button>
 <div class="card small muted" style="background:var(--surface-sunken);padding:12px">Blackjack pays 3:2. Dealer stands on all 17s and peeks for blackjack. Double on any first two cards, split once.</div></div>${ST()}</div>`;pushHist('blackjack');
 const ov=$('#ov');ov.style.paddingTop='46px';const TB=cardTable($('#st3'),{lines:['BLACKJACK PAYS 3 TO 2','DEALER MUST STAND ON ALL 17s'],spots:[[.5,.82,46]]});const ctx=TB&&TB.ctx;let dl,pl=[];
 if(TB){dl=TB.lbl(V3(0,1.2,-.6));dl.visible=false}
 const handPos=(hi,n,ci)=>{const bx=n>1?(hi?1.7:-1.7):0;return V3(bx+ci*.55-.4,.02+ci*.012,2.0-ci*.03)};
 const next=()=>cardOf(G.f[G.cur++]);
 const labels=()=>{if(!TB){ov.innerHTML=`<div class="pill">Dealer ${G?hvTxt(G.done?G.dealer:[G.dealer[0]]):''}</div><div class="pill">You ${G?G.hands.map(h=>hvTxt(h.cards)).join(' · '):''}</div>`;return}
  dl.visible=!!(G&&G.dealer.length);if(G&&G.dealer.length)dl.set(G.done?hvTxt(G.dealer):hvTxt([G.dealer[0]]));
  while(pl.length<(G?G.hands.length:0)){pl.push(TB.lbl(V3(0,1,3.2)))}pl.forEach((l,i)=>{const h=G&&G.hands[i];l.visible=!!(h&&h.cards.length);if(!h)return;l.position.set(G.hands.length>1?(i?1.5:-1.5):0,1.05,3.3);l.set((h.res==='win'?'Win · ':h.res==='bj'?'':h.res==='push'?'Push · ':h.res==='lose'?'':'')+hvTxt(h.cards))})};
 const btns=()=>{const live=G&&!G.done&&!dealing;const h=live?G.hands[G.hi]:null;$('#bj-hit').disabled=!live;$('#bj-stand').disabled=!live;$('#bj-dbl').disabled=!(live&&h.cards.length===2&&S.bal>=h.bet);$('#bj-split').disabled=!(live&&G.hands.length===1&&h.cards.length===2&&cval(h.cards[0])===cval(h.cards[1])&&S.bal>=h.bet);
  const b=$('#gbtn');b.disabled=!!(G&&!G.done)||dealing;b.textContent=G&&G.done?'Deal again':'Deal';$('#bj-amt').disabled=!!(G&&!G.done)};
 const dealTo=async(hi,faceUp=true)=>{const c=next();const h=G.hands[hi];h.cards.push(c);if(TB){const m=await TB.deal(c,handPos(hi,G.hands.length,h.cards.length-1),faceUp,(Math.random()-.5)*.1);h.meshes.push(m)}else await sleep(120);labels();return c};
 const dealD=async(faceUp=true)=>{const c=next();G.dealer.push(c);if(TB){const i=G.dealer.length-1;const m=await TB.deal(c,V3(i*.55-.5,.02+i*.012,-.5),faceUp);G.dm.push(m)}else await sleep(120);labels();return c};
 const settleBJ=(tot,bet)=>{const mult=tot/bet;S.bal+=tot;S.wager+=bet;if(tot>bet)S.won+=tot-bet;S.hist.unshift({game:'blackjack',bet,mult,pay:tot,nonce:G.nonce,t:Date.now()});updBal(tot>0);pushFeed({name:S.user,game:'blackjack',bet,mult,pay:tot,me:true});
  if(tot>bet){SND.win();toast(`Won ${fmt(tot)} USDT`,'w');TB&&TB.D.gesture('point');if(TB)G3.burst(ctx,V3(0,1,2.4),{n:70,speed:4,g:5})}else if(tot===bet)toast('Push · stake returned');else{SND.lose();TB&&TB.D.gesture('sad')}TB&&TB.sweep(tot>0);pushHist('blackjack');$('#myg').innerHTML=myRows('blackjack')};
 const finish=async()=>{dealing=true;btns();G.done=true;if(TB&&G.dm[1])await TB.flip(G.dm[1]);labels();const allBust=G.hands.every(h=>handVal(h.cards).t>21);if(!allBust){while(handVal(G.dealer).t<17){await dealD(true)}}
  const dvt=handVal(G.dealer).t;let tot=0,bet=0;for(const h of G.hands){bet+=h.bet;const v=handVal(h.cards).t;h.res=v>21?'lose':(dvt>21||v>dvt)?'win':v===dvt?'push':'lose';tot+=h.res==='win'?h.bet*2:h.res==='push'?h.bet:0}labels();settleBJ(tot,bet);dealing=false;btns()};
 const advance=async()=>{if(G.hi<G.hands.length-1){G.hi++;if(G.hands[G.hi].cards.length<2)await dealTo(G.hi);labels();btns()}else finish()};
 $('#gbtn').onclick=async()=>{if(dealing||(G&&!G.done))return;const bet=val('bj-amt');if(!debit(bet))return;if(TB){await TB.clear();pl.forEach(l=>l.visible=false)}const {f,nonce}=draw(40);G={f,nonce,cur:0,dealer:[],dm:[],hands:[{cards:[],meshes:[],bet}],hi:0,done:false};dealing=true;btns();
  if(TB)TB.betChips(bet,V3(0,0,3.6));await dealTo(0);await dealD(true);await dealTo(0);await dealD(false);dealing=false;
  const pBJ=isBJ(G.hands[0].cards),dBJ=isBJ(G.dealer);if(pBJ||dBJ){G.done=true;if(TB&&G.dm[1])await TB.flip(G.dm[1]);const h=G.hands[0];h.res=pBJ&&dBJ?'push':pBJ?'bj':'lose';labels();if(pBJ&&!dBJ&&TB)TB.D.gesture('cheer');settleBJ(h.res==='bj'?bet*2.5:h.res==='push'?bet:0,bet);btns();return}
  if(handVal(G.hands[0].cards).t===21){finish();return}btns()};
 $('#bj-hit').onclick=async()=>{if(dealing)return;dealing=true;btns();await dealTo(G.hi);dealing=false;const v=handVal(G.hands[G.hi].cards).t;if(v>=21)advance();else btns()};
 $('#bj-stand').onclick=()=>{SND.click();advance()};
 $('#bj-dbl').onclick=async()=>{const h=G.hands[G.hi];if(!debit(h.bet))return;if(TB)TB.betChips(h.bet,V3(G.hands.length>1?(G.hi?1.5:-1.5):.5,0,3.6));h.bet*=2;dealing=true;btns();await dealTo(G.hi);dealing=false;advance()};
 $('#bj-split').onclick=async()=>{const h=G.hands[0];if(!debit(h.bet))return;dealing=true;btns();const ace=h.cards[0].r===0;G.hands=[{cards:[h.cards[0]],meshes:[h.meshes[0]],bet:h.bet},{cards:[h.cards[1]],meshes:[h.meshes[1]],bet:h.bet}];
  if(TB){await ctx.tween(.3,k=>{h.meshes[0].position.x=-.3+(-1.5+.3)*k;h.meshes[1].position.x=.12+(1.2-.12)*k;h.meshes[1].position.z=2.07+(2.1-2.07)*k});TB.betChips(h.bet,V3(1.5,0,3.6))}
  await dealTo(0);if(ace){await dealTo(1);dealing=false;finish();return}dealing=false;labels();btns()};
 btns();return ()=>{if(G&&!G.done){let tot=0;for(const h of G.hands)tot+=h.bet;S.bal+=tot;updBal();toast('Hand cancelled, stake returned')}ctx&&ctx.dispose()}};
/* ===================== ROULETTE 3D ===================== */
const RW=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const rcol=n=>n===0?'#0E8A5F':REDS.has(n)?'#C8233F':'#1D1838';
const RPAY={n:36,col:3,doz:3,low:2,high:2,even:2,odd:2,red:2,black:2};
function rWins(key,n){if(key[0]==='n')return +key.slice(1)===n;if(n===0)return false;if(key.startsWith('col'))return n%3===(+key[3])%3;if(key.startsWith('doz'))return Math.ceil(n/12)===+key[3];return {low:n<=18,high:n>=19,even:n%2===0,odd:n%2===1,red:REDS.has(n),black:!REDS.has(n)}[key]}
const CHIPV=[[.1,'#5C9BFF'],[1,'#22A37A'],[5,'#C8233F'],[10,'#8A6BFF'],[50,'#FF9A1F'],[100,'#16102E']];
GAMEVIEWS.roulette=box=>{let bets={},stack=[],chip=1,spinning=false,lastBets={},wr=0,ball={a:0,r:2.35,y:.42},res=null;const A=Math.PI*2/37;
 const cells=[];cells.push(`<button class="bc z" data-k="n0" style="grid-column:1">0</button>`);
 for(let c=0;c<12;c++)for(let r=0;r<3;r++){const n=c*3+(3-r);cells.push(`<button class="bc ${REDS.has(n)?'r':'k'}" data-k="n${n}" style="grid-column:${c+2};grid-row:${r+1}">${n}</button>`)}
 for(let r=0;r<3;r++)cells.push(`<button class="bc o" data-k="col${3-r}" style="grid-column:14;grid-row:${r+1}">2:1</button>`);
 for(let d=0;d<3;d++)cells.push(`<button class="bc o" data-k="doz${d+1}" style="grid-column:${2+d*4}/span 4;grid-row:4">${['1st','2nd','3rd'][d]} 12</button>`);
 [['low','1–18'],['even','Even'],['red','Red'],['black','Black'],['odd','Odd'],['high','19–36']].forEach(([k,l],i)=>cells.push(`<button class="bc o" data-k="${k}" style="grid-column:${2+i*2}/span 2;grid-row:5;${k==='red'?'background:#C8233F':k==='black'?'background:#1D1838':''}">${l}</button>`));
 box.innerHTML=`<div class="game"><div class="g-panel"><div class="field"><span class="label">Chip value</span><div class="chips" id="chips">${CHIPV.map(([v,c])=>`<button data-v="${v}" style="background:${c}" class="${v===chip?'on':''}">${v}</button>`).join('')}</div></div>
 <div class="statrow" style="grid-template-columns:1fr 1fr"><div class="stat"><small>Total bet</small><b id="rtot">0.00</b></div><div class="stat"><small>Last result</small><b id="rlast">—</b></div></div>
 <div class="grid2"><button class="btn" id="rundo">Undo</button><button class="btn" id="rclear">Clear</button><button class="btn" id="rdbl">Double bets</button><button class="btn" id="rre">Rebet</button></div>
 <button class="btn lg block primary" id="gbtn">Spin</button></div>
 <div class="g-stage" style="display:flex;flex-direction:column"><div class="g-hist" id="rhist"></div><div id="st3" style="position:relative;height:clamp(280px,40vh,380px);flex:0 0 auto"><div class="ov" id="ov"></div></div><div class="boardwrap" style="padding:10px 12px 14px"><div class="board" id="board">${cells.join('')}</div></div></div></div>`;
 const ctx=mk3($('#st3'),{pos:[0,7.2,5.2],target:[0,0,.2],bg:'#140A1E',fov:38,fit:[7.4,6.4],keyPos:[3,12,4]});let rotor,ballM;
 const ringTex=()=>G3.tex(1024,1024,(x,w,h)=>{const c=w/2;const Ro=c-4,Ri=c*.62;RW.forEach((n,i)=>{const mid=Math.PI/2-i*A;x.beginPath();x.arc(c,c,Ro,mid-A/2,mid+A/2);x.arc(c,c,Ri,mid+A/2,mid-A/2,true);x.closePath();x.fillStyle=rcol(n);x.fill();x.strokeStyle='#D9B060';x.lineWidth=3;x.stroke();
  x.save();x.translate(c+Math.cos(mid)*(Ro-46),c+Math.sin(mid)*(Ro-46));x.rotate(mid+Math.PI/2);x.fillStyle='#fff';x.font='700 38px "Chakra Petch",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(n,0,0);x.restore()})});
 if(ctx){const sc=ctx.scene;const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),G3.std('#0E3A2C',{r:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-.6;floor.receiveShadow=true;sc.add(floor);
  const bowl=new THREE.Mesh(new THREE.LatheGeometry([[3.6,-.6],[3.7,.35],[3.55,.55],[3.2,.55],[2.7,.4],[2.45,.32]].map(p=>new THREE.Vector2(p[0],p[1])),96),G3.std('#5A3416',{r:.35,m:.15,side:THREE.DoubleSide}));bowl.receiveShadow=true;sc.add(bowl);
  const track=new THREE.Mesh(new THREE.TorusGeometry(2.6,.06,8,96),G3.std('#D9B060',{m:.85,r:.25}));track.rotation.x=Math.PI/2;track.position.y=.4;sc.add(track);
  rotor=new THREE.Group();sc.add(rotor);const ring=new THREE.Mesh(new THREE.RingGeometry(1.35,2.35,111,1),new THREE.MeshStandardMaterial({map:ringTex(),roughness:.45,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.22;rotor.add(ring);
  const cone=new THREE.Mesh(new THREE.ConeGeometry(1.4,.35,64,1,true),G3.std('#6A4420',{r:.4,m:.2}));cone.position.y=.4;rotor.add(cone);
  for(let i=0;i<37;i++){const a=i*A+A/2;const sep=new THREE.Mesh(new THREE.BoxGeometry(.04,.12,.5),G3.std('#D9B060',{m:.9,r:.25}));sep.position.set(Math.sin(a)*1.95,.28,Math.cos(a)*1.95);sep.rotation.y=a;rotor.add(sep)}
  const tur=new THREE.Mesh(new THREE.LatheGeometry([[.5,0],[.42,.25],[.12,.5],[.08,1],[.18,1.15],[0,1.25]].map(p=>new THREE.Vector2(p[0],p[1])),40),G3.std('#E8C268',{m:.9,r:.2}));tur.position.y=.5;rotor.add(tur);
  for(let i=0;i<4;i++){const arm=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.9,10),G3.std('#E8C268',{m:.9,r:.2}));arm.rotation.z=Math.PI/2;arm.position.y=1.35;arm.rotation.y=i*Math.PI/2;arm.position.x=Math.cos(i*Math.PI/2)*.45;arm.position.z=-Math.sin(i*Math.PI/2)*.45;arm.lookAt(0,1.35,0);arm.rotateX(Math.PI/2);rotor.add(arm);const kn=new THREE.Mesh(new THREE.SphereGeometry(.08,12,10),G3.std('#E8C268',{m:.9,r:.2}));kn.position.set(Math.cos(i*Math.PI/2)*.9,1.35,-Math.sin(i*Math.PI/2)*.9);rotor.add(kn)}
  ballM=new THREE.Mesh(new THREE.SphereGeometry(.1,20,14),G3.std('#FFFFFF',{r:.12,m:.1,env:1.4}));ballM.castShadow=true;sc.add(ballM);G3.cast(rotor);
  const D=G3.person(ctx,{vest:'#0E5A44',hair:'#3A2414',skin:'#E0B48E',bun:true});D.g.position.set(2.3,-.6,-4.6);D.g.scale.setScalar(1.2);D.g.rotation.y=-.35;D.look.set(0,0,0);sc.add(D.g);ctx.dealer=D;
  ctx.add((dt)=>{if(!spinning){wr+=dt*.25;if(res!=null){const idx=RW.indexOf(res);ball.a=idx*A+A/2+wr;ball.r=1.75;ball.y=.32}else{ball.a-=dt*.0}}rotor.rotation.y=wr;ballM.position.set(Math.sin(ball.a)*ball.r,ball.y,Math.cos(ball.a)*ball.r)})}
 const chipsOn=()=>{$$('#board .chipon').forEach(e=>e.remove());let tot=0;for(const [k,v] of Object.entries(bets)){tot+=v;const el=$(`#board [data-k="${k}"]`);if(!el)continue;const c=[...CHIPV].reverse().find(([cv])=>v>=cv)||CHIPV[0];el.insertAdjacentHTML('beforeend',`<span class="chipon" style="background:${c[1]}">${v>=1000?fmt(v/1000,1)+'k':+v.toFixed(2)}</span>`)}$('#rtot').textContent=fmt(tot);return tot};
 const histR=()=>{$('#rhist').innerHTML=S.hist.filter(h=>h.game==='roulette'&&h.n!=null).slice(0,18).map(h=>`<span style="background:${rcol(h.n)};color:#fff">${h.n}</span>`).join('')};
 $$('#chips button').forEach(b=>b.onclick=()=>{chip=+b.dataset.v;SND.chip();$$('#chips button').forEach(x=>x.classList.toggle('on',x===b))});
 $$('#board .bc').forEach(b=>b.onclick=()=>{if(spinning)return;const k=b.dataset.k;bets[k]=+((bets[k]||0)+chip).toFixed(2);stack.push([k,chip]);SND.chip();chipsOn()});
 $('#rundo').onclick=()=>{const l=stack.pop();if(!l)return;bets[l[0]]=+(bets[l[0]]-l[1]).toFixed(2);if(bets[l[0]]<=0)delete bets[l[0]];chipsOn()};
 $('#rclear').onclick=()=>{if(spinning)return;bets={};stack=[];chipsOn()};$('#rdbl').onclick=()=>{if(spinning)return;for(const k in bets){stack.push([k,bets[k]]);bets[k]*=2}SND.chip();chipsOn()};$('#rre').onclick=()=>{if(spinning)return;bets={...lastBets};stack=Object.entries(bets);chipsOn()};
 $('#gbtn').onclick=async()=>{if(spinning)return;const tot=Object.values(bets).reduce((a,b)=>a+b,0);if(!tot){toast('Tap the board to place chips','e');return}if(!debit(tot))return;spinning=true;$('#gbtn').disabled=true;lastBets={...bets};$$('#board .bc').forEach(e=>e.classList.remove('hl'));$('#ov').innerHTML='';res=null;
  const {f,nonce}=draw(1);const n=Math.floor(f[0]*37);const idx=RW.indexOf(n);SND.n(5,{f:900,vol:.08,decay:.8});ctx&&ctx.dealer&&ctx.dealer.gesture('spin');
  if(ctx){const w0=wr,wEnd=w0+Math.PI*2*1.6;const b0=ball.a;const bEnd=(idx*A+A/2+wEnd)-Math.PI*2*7;const T=6;let landed=false;
   await ctx.tween(T,(e,k)=>{wr=w0+(wEnd-w0)*(1-Math.pow(1-k,2.4));const free=b0+(bEnd-b0)*(1-Math.pow(1-k,1.8));const pocket=idx*A+A/2+wr;const blend=clamp((k-.72)/.2,0,1);ball.a=free*(1-blend)+((free+((pocket-free)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI))*blend;
    const drop=clamp((k-.62)/.22,0,1);ball.r=2.45-drop*.7;ball.y=.42-drop*.1+Math.abs(Math.sin(drop*Math.PI*3))*(1-drop)*.25;if(k>.62&&k<.9&&Math.random()<.12)SND.tick(.7);if(k>.92&&!landed){landed=true}},G3.ease.lin)}else await sleep(400);
  spinning=false;res=n;$('#gbtn').disabled=false;let pay=0;for(const [k,v] of Object.entries(bets))if(rWins(k,n))pay+=v*RPAY[k.replace(/\d+$/,'')];
  const mult=pay/tot;S.bal+=pay;S.wager+=tot;if(pay>tot)S.won+=pay-tot;S.hist.unshift({game:'roulette',bet:tot,mult,pay,nonce,n,t:Date.now()});updBal(pay>0);pushFeed({name:S.user,game:'roulette',bet:tot,mult,pay,me:true});
  $(`#board [data-k="n${n}"]`)?.classList.add('hl');const cn=n===0?'green':REDS.has(n)?'red':'black';$('#rlast').innerHTML=`<span style="color:${n===0?'var(--win)':REDS.has(n)?'var(--loss)':'var(--ink)'}">${n} ${cn}</span>`;
  $('#ov').innerHTML=`<div class="pill" style="font-size:16px;background:${rcol(n)};color:#fff;border:0">${n} ${cn}</div>${pay>0?`<div class="pill" style="color:var(--win)">+${fmt(pay)} USDT</div>`:''}`;
  if(pay>tot){SND.win();toast(`${n} · won ${fmt(pay)} USDT`,'w');ctx&&ctx.dealer&&ctx.dealer.gesture('point');if(mult>=10)bigWin(pay,mult,'roulette');else if(ctx)G3.burst(ctx,V3(0,1,0),{n:70,speed:5})}else{SND.lose();toast(`${n} ${cn} · no win`)}
  histR();$('#myg').innerHTML=myRows('roulette');bets={};stack=[];chipsOn()};
 chipsOn();histR();return ()=>ctx&&ctx.dispose()};
/* ===================== BACCARAT 3D ===================== */
const bacV=c=>c.r>=9?0:c.r+1;const bacT=cs=>cs.reduce((a,c)=>a+bacV(c),0)%10;
GAMEVIEWS.baccarat=box=>{let side='b',busy=false;
 box.innerHTML=`<div class="game"><div class="g-panel">${amtField('bc-amt',5)}<div class="field"><span class="label">Bet on</span><div class="bacbets" id="bside"><button class="p" data-s="p"><span>Player</span><small>pays 1:1</small></button><button class="b on" data-s="b" style="outline:2px solid var(--gold)"><span>Banker</span><small>pays 0.95:1</small></button><button class="t" data-s="t"><span>Tie</span><small>pays 8:1</small></button></div></div>
 <button class="btn lg block primary" id="gbtn">Deal</button><div class="card small muted" style="background:var(--surface-sunken);padding:12px">Punto Banco rules. Naturals on 8 or 9; third cards follow the standard drawing table. Player and Banker bets push on a tie.</div></div>${ST()}</div>`;pushHist('baccarat');
 const ov=$('#ov');const TB=cardTable($('#st3'),{felt:'#3A0A16',felt2:'#7A1A30',dealer:{vest:'#16102E',hair:'#0B0818',skin:'#B07A56',tie:'#C8233F'},lines:['BANKER PAYS 0.95 TO 1 · TIE PAYS 8 TO 1'],spots:[[.3,.72,60],[.7,.72,60]],paint:(x,w,h)=>{x.font='800 34px "Bricolage Grotesque",sans-serif';x.fillStyle='rgba(92,155,255,.6)';x.fillText('PLAYER',w*.3,h*.9);x.fillStyle='rgba(255,84,112,.6)';x.fillText('BANKER',w*.7,h*.9)}});const ctx=TB&&TB.ctx;let lp,lb;
 if(TB){lp=TB.lbl(V3(-1.8,1.1,2.8));lb=TB.lbl(V3(1.8,1.1,2.8));lp.visible=lb.visible=false}
 $$('#bside button').forEach(b=>b.onclick=()=>{if(busy)return;side=b.dataset.s;SND.click();$$('#bside button').forEach(x=>{x.classList.toggle('on',x===b);x.style.outline=x===b?'2px solid var(--gold)':''})});
 $('#gbtn').onclick=async()=>{if(busy)return;const bet=val('bc-amt');if(!debit(bet))return;busy=true;$('#gbtn').disabled=true;ov.innerHTML='';const {f,nonce}=draw(6);let fi=0;const nx=()=>cardOf(f[fi++]);
  if(TB){await TB.clear();lp.visible=lb.visible=false;TB.betChips(bet,V3(side==='p'?-1.8:side==='b'?1.8:0,0,3.7))}
  const P=[],B=[];const dP=async()=>{const c=nx();P.push(c);if(TB)await TB.deal(c,V3(-2.2+(P.length-1)*.5,.02+P.length*.01,2.1),true);if(TB){lp.visible=true;lp.set('Player '+bacT(P))}};const dB=async()=>{const c=nx();B.push(c);if(TB)await TB.deal(c,V3(1.4+(B.length-1)*.5,.02+B.length*.01,2.1),true);if(TB){lb.visible=true;lb.set('Banker '+bacT(B))}};
  await dP();await dB();await dP();await dB();let p=bacT(P),b=bacT(B);
  if(p<8&&b<8){let p3=null;if(p<=5){await dP();p3=bacV(P[2])}
   const bd=b<=2||(b===3&&p3!==8)||(b===4&&p3!=null&&p3>=2&&p3<=7)||(b===5&&p3!=null&&p3>=4&&p3<=7)||(b===6&&p3!=null&&(p3===6||p3===7))||(p3===null&&b<=5);if(bd)await dB()}
  p=bacT(P);b=bacT(B);const out=p>b?'p':b>p?'b':'t';let pay=0;if(out==='t')pay=side==='t'?bet*9:bet;else if(out===side)pay=side==='b'?bet*1.95:bet*2;
  const mult=pay/bet;const name={p:'Player',b:'Banker',t:'Tie'}[out];ov.innerHTML=`<div class="pill" style="font-size:16px;color:${out==='p'?'#5C9BFF':out==='b'?'var(--loss)':'var(--win)'}">${name} wins · ${p} – ${b}</div>${pay>bet?`<div class="pill" style="color:var(--win)">+${fmt(pay)} USDT</div>`:pay===bet?'<div class="pill">Push</div>':''}`;
  S.bal+=pay;S.wager+=bet;if(pay>bet)S.won+=pay-bet;S.hist.unshift({game:'baccarat',bet,mult,pay,nonce,t:Date.now()});updBal(pay>0);pushFeed({name:S.user,game:'baccarat',bet,mult,pay,me:true});
  if(pay>bet){SND.win();TB&&TB.D.gesture(mult>=9?'cheer':'point');if(TB)G3.burst(ctx,V3(0,1,2.4),{n:60,speed:4,g:5})}else if(pay<bet){SND.lose()}TB&&TB.sweep(pay>0);pushHist('baccarat');$('#myg').innerHTML=myRows('baccarat');busy=false;$('#gbtn').disabled=false};
 return ()=>ctx&&ctx.dispose()};
/* ===================== VIDEO POKER 3D (Jacks or Better 9/6) ===================== */
const VP=[['Royal flush',800],['Straight flush',50],['Four of a kind',25],['Full house',9],['Flush',6],['Straight',4],['Three of a kind',3],['Two pair',2],['Jacks or better',1]];
function vpEval(cs){const r=cs.map(c=>c.r),s=cs.map(c=>c.s);const cnt={};r.forEach(x=>cnt[x]=(cnt[x]||0)+1);const v=Object.values(cnt).sort((a,b)=>b-a);const fl=s.every(x=>x===s[0]);const u=[...new Set(r)].sort((a,b)=>a-b);
 const st=u.length===5&&(u[4]-u[0]===4||(u[0]===0&&u[1]===9&&u[4]===12));const royal=st&&fl&&u[0]===0&&u[1]===9;
 if(royal)return 0;if(st&&fl)return 1;if(v[0]===4)return 2;if(v[0]===3&&v[1]===2)return 3;if(fl)return 4;if(st)return 5;if(v[0]===3)return 6;if(v[0]===2&&v[1]===2)return 7;if(v[0]===2){const pr=+Object.keys(cnt).find(k=>cnt[k]===2);if(pr===0||pr>=10)return 8}return -1}
GAMEVIEWS.poker=box=>{let G=null,busy=false;
 box.innerHTML=`<div class="game"><div class="g-panel">${amtField('vp-amt',1)}<div class="card" style="background:var(--surface-sunken);padding:12px"><div class="paytab" id="vpt">${VP.map(([n,m],i)=>`<span data-h="${i}">${n}</span><span data-h="${i}">${m}×</span>`).join('')}</div></div>
 <div class="holdrow" id="holds">${[0,1,2,3,4].map(i=>`<button data-i="${i}" disabled>Hold</button>`).join('')}</div><button class="btn lg block primary" id="gbtn">Deal</button><p class="small faint">Tap cards on the table or the Hold buttons, then draw. 9/6 Jacks or Better returns 99.54% with optimal holds.</p></div>${ST()}</div>`;pushHist('poker');
 const ov=$('#ov');const TB=cardTable($('#st3'),{felt:'#0E1A4A',felt2:'#24419A',dealer:{vest:'#FFC23D',tie:'#16102E',hair:'#5A3A1A',skin:'#F0C49E'},lines:['JACKS OR BETTER','ROYAL FLUSH PAYS 800'],fit:[8.6,6.2],cardScale:1.35});const ctx=TB&&TB.ctx;let meshes=[],held=[];
 const pos=i=>V3(-2.2+i*1.1,.02,2.0);
 const setHold=i=>{if(!G||G.stage!=='hold')return;G.hold[i]=!G.hold[i];SND.click();paintH()};
 const paintH=()=>{$$('#holds button').forEach((b,i)=>{b.disabled=!(G&&G.stage==='hold');b.classList.toggle('on',!!(G&&G.hold[i]));b.textContent=G&&G.hold[i]?'Held':'Hold'});if(TB)meshes.forEach((m,i)=>{const h=G&&G.hold[i];m.position.z=h?1.7:2.0;if(held[i])held[i].visible=!!h})};
 $$('#holds button').forEach(b=>b.onclick=()=>setHold(+b.dataset.i));
 if(TB){ctx.R.domElement.addEventListener('click',e=>{const h=ctx.pick(e,meshes);if(h)setHold(meshes.indexOf(h.object))});for(let i=0;i<5;i++){const l=G3.label('HELD',{scale:.3,bg:'#FFC23D',color:'#241500',w:200,h:70,radius:30});l.position.set(pos(i).x,.5,1.05);l.visible=false;ctx.scene.add(l);held.push(l)}}
 const hl=k=>$$('#vpt [data-h]').forEach(e=>e.classList.toggle('hit',+e.dataset.h===k));
 $('#gbtn').onclick=async()=>{if(busy)return;busy=true;$('#gbtn').disabled=true;
  if(!G||G.stage==='done'){const bet=val('vp-amt');if(!debit(bet)){busy=false;$('#gbtn').disabled=false;return}const {f,nonce}=draw(51);const deck=shuffle(f,52).map(i=>({r:i%13,s:Math.floor(i/13)}));G={bet,nonce,deck,hand:deck.slice(0,5),hold:[0,0,0,0,0],stage:'hold',next:5};ov.innerHTML='';hl(-2);
   if(TB){await TB.clear();meshes=[];for(let i=0;i<5;i++){meshes.push(await TB.deal(G.hand[i],pos(i),true))}}
   const pre=vpEval(G.hand);hl(pre);if(pre>=0)ov.innerHTML=`<div class="pill" style="color:var(--gold-text)">${VP[pre][0]}</div>`;$('#gbtn').textContent='Draw';paintH()}
  else{for(let i=0;i<5;i++)if(!G.hold[i]){G.hand[i]=G.deck[G.next++];if(TB){const m=meshes[i];await ctx.tween(.18,k=>{m.rotation.x=Math.PI*k;m.position.y=.02+k*.3});G3.setCardFace(m,G.hand[i].r,G.hand[i].s);SND.deal();await ctx.tween(.18,k=>{m.rotation.x=Math.PI*(1-k);m.position.y=.32-k*.3})}}
   G.stage='done';const k=vpEval(G.hand);hl(k);const mult=k>=0?VP[k][1]:0;ov.innerHTML=k>=0?`<div class="big" style="color:var(--win);font-size:clamp(30px,5vw,46px)">${VP[k][0]}</div><div class="pill" style="color:var(--win)">+${fmt(G.bet*mult)} USDT</div>`:'<div class="pill">No win</div>';
   settle('poker',G.bet,mult,G.nonce,{});if(TB&&k>=0){TB.D.gesture(mult>=9?'cheer':'point');G3.burst(ctx,V3(0,1,2),{n:60+mult,speed:5,g:5})}pushHist('poker');$('#myg').innerHTML=myRows('poker');$('#gbtn').textContent='Deal again';paintH()}
  busy=false;$('#gbtn').disabled=false};
 paintH();return ()=>{if(G&&G.stage==='hold'){S.bal+=G.bet;updBal();toast('Hand cancelled, stake returned')}ctx&&ctx.dispose()}};
