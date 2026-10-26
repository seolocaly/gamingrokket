/* ===================== In-play sportsbook engine (demo feed) ===================== */
const TEAMS={
 'Arena League':['Nova FC','Orbit United','Comet City','Nebula Rovers','Pulsar Athletic','Quasar Town','Meteor Wanderers','Eclipse FC','Galaxy Rangers','Zenith Albion'],
 'Arena Cup':['Solaris SC','Astra Dynamo','Vega Sporting','Lyra Athletic','Polaris FC','Sirius United'],
 'Arena Hoops':['Comets','Satellites','Voyagers','Titans','Meteors','Pulsars','Novas','Orbiters','Rangers','Gravity'],
 'Arena Tour':['A. Voss','M. Korin','L. Santi','D. Okafor','R. Ilic','J. Moreau','K. Tanaka','S. Mendes','T. Varga','E. Lind'],
 'Arena CS2 Cup':['Team Vortex','Hyperion','Black Nova','Ion Five','Redshift','Gravity GG','Apex Orbit','Lunar Squad']};
const SPORTS={football:{name:'Football',lgs:['Arena League','Arena Cup']},basketball:{name:'Basketball',lgs:['Arena Hoops']},tennis:{name:'Tennis',lgs:['Arena Tour']},esports:{name:'Esports',lgs:['Arena CS2 Cup']},hockey:{name:'Ice hockey',lgs:[]},cricket:{name:'Cricket',lgs:[]}};
const SICON={hockey:'<path d="M5 4l5 13h6"/><path d="M19 4l-5 13"/><ellipse cx="12" cy="19.5" rx="3" ry="1.3"/>',cricket:'<path d="M14 3l4 4-9 9-4-4z"/><path d="M5 16l-2 2 3 3 2-2"/><circle cx="18" cy="17" r="2.5"/>',football:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5z"/>',basketball:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5v17M6 6c3 3 3 9 0 12M18 6c-3 3-3 9 0 12"/>',tennis:'<circle cx="12" cy="12" r="8.5"/><path d="M5 6c4 3 4 9 0 12M19 6c-4 3-4 9 0 12"/>',esports:'<rect x="3" y="8" width="18" height="10" rx="4"/><path d="M8 11v4M6 13h4M15.5 12h.01M17.5 14h.01"/>'};
const sico=s=>`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${SICON[s]}</svg>`;
const MARGIN=1.06;
const toOdds=p=>p<0.004?null:Math.min(101,Math.max(1.01,Math.round(100/(p*MARGIN))/100));
function pois(l,k){let p=Math.exp(-l);for(let i=1;i<=k;i++)p*=l/i;return p}
function normCdf(z){const t=1/(1+.2316419*Math.abs(z)),d=.3989423*Math.exp(-z*z/2);let p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-p:p}
let EVID=1;const EVENTS=[];
function newEvent(sport,startIn,liveAt){const lg=pickr(SPORTS[sport].lgs);const pool=[...TEAMS[lg]];const h=pool.splice(rnd(pool.length),1)[0],a=pool.splice(rnd(pool.length),1)[0];
 const e={id:'s'+(EVID++),sport,lg,h,a,status:'pre',start:Date.now()+startIn,clock:0,score:[0,0],susp:0,flash:0,mk:{},stats:{sh:[0,0],co:[0,0],pos:50},log:[]};
 if(sport==='football'){const s=.7+Math.random()*.9;e.lh=+(1.35*s).toFixed(2);e.la=+(1.35/s*.92).toFixed(2);e.added=60*(1+rnd(5))}
 if(sport==='basketball'){const base=.039;const d=(Math.random()-.5)*.006;e.rh=base+d/2;e.ra=base-d/2;e.q=[[0,0]];e.len=2880}
 if(sport==='tennis'){const d=(Math.random()-.5)*.14;e.ph=.64+d;e.pa=.64-d;e.sets=[[0,0]];e.pts=[0,0];e.srv=rnd(2)}
 if(sport==='esports'){e.pr=.5+(Math.random()-.5)*.24;e.score=[0,0]}
 if(liveAt!=null){e.status='live';e.start=Date.now()-1000;e.log.unshift(sport==='football'?'Kick-off':'Started');fastForward(e,liveAt)}
 price(e,true);EVENTS.push(e);return e}
function fastForward(e,frac){const steps=Math.floor(frac*({football:1080,basketball:e.len/3,tennis:110,esports:16}[e.sport]));for(let i=0;i<steps;i++)step(e,true)}
/* --- one simulation step (football: 5 game sec, basketball: 3 game sec, tennis: one point, esports: one round) --- */
function step(e,silent){if(e.status!=='live')return;
 if(e.sport==='football'){e.clock+=5;const r=5/5400;const ev=[];if(Math.random()<e.lh*r)ev.push(0);if(Math.random()<e.la*r)ev.push(1);
  for(const t of ev){e.score[t]++;e.stats.sh[t]++;goal(e,t,silent)}if(Math.random()<.012)e.stats.sh[Math.random()<e.lh/(e.lh+e.la)?0:1]++;if(Math.random()<.006)e.stats.co[rnd(2)]++;e.stats.pos=clamp(e.stats.pos+(Math.random()-.5)*1.6+(e.lh>e.la?.05:-.05),30,70);
  if(e.clock>=5400+e.added){end(e,silent)}}
 else if(e.sport==='basketball'){e.clock+=3;for(const t of [0,1]){if(Math.random()<(t?e.ra:e.rh)*3/2.36){const p=Math.random()<.36?3:2;e.score[t]+=p;e.q[e.q.length-1][t]+=p}}
  const ql=e.len/4;if(e.clock%ql<3&&e.clock>=ql&&e.q.length<4)e.q.push([0,0]);if(e.clock>=e.len){if(e.score[0]===e.score[1]){e.len+=300}else end(e,silent)}}
 else if(e.sport==='tennis'){tennisPoint(e,silent)}
 else if(e.sport==='esports'){const w=Math.random()<e.pr?0:1;e.score[w]++;e.flash=Date.now();if(!silent)e.log.unshift(`Round ${e.score[0]+e.score[1]} to ${w?e.a:e.h}`);if(e.score[0]>=13||e.score[1]>=13)end(e,silent)}
 if(!silent)price(e)}
function goal(e,t,silent){e.flash=Date.now();e._force=1;e.log.unshift(`${Math.floor(e.clock/60)+1}' Goal ${t?e.a:e.h}`);if(silent)return;e.susp=Date.now()+4500;
 if(ROUTE.startsWith('sports')||ROUTE==='live'||ROUTE==='event/'+e.id)SND.t(880,.2,{type:'triangle',vol:.08});
 for(const b of S.bets)if(b.status==='open'&&b.legs.some(l=>l.eid===e.id)){toast(`Goal · ${t?e.a:e.h} · ${e.h} ${e.score[0]}–${e.score[1]} ${e.a}`);break}
 for(const b of S.bets)for(const l of b.legs)if(l.eid===e.id&&l.mk==='ng'&&l.st==='open'&&l.base===e.score[0]+e.score[1]-1){l.st=(l.sid===(t?'a':'h'))?'won':'lost';checkBet(b)}}
function tennisPoint(e,silent){const s=e.srv,pw=s===0?e.ph:e.pa;const w=Math.random()<pw?s:1-s;e.pts[w]++;const [a,b]=e.pts;const set=e.sets[e.sets.length-1];const tb=set[0]===6&&set[1]===6;
 const gameWon=tb?(e.pts[w]>=7&&e.pts[w]-e.pts[1-w]>=2):(e.pts[w]>=4&&e.pts[w]-e.pts[1-w]>=2);
 if(gameWon){set[w]++;e.pts=[0,0];e.srv=1-e.srv;e.flash=Date.now();const sw=(set[w]>=6&&set[w]-set[1-w]>=2)||set[w]===7;
  if(sw){if(!silent)e.log.unshift(`Set ${e.sets.length} to ${w?e.a:e.h} ${set[0]}–${set[1]}`);for(const bt of S.bets)for(const l of bt.legs)if(l.eid===e.id&&l.mk==='set'&&l.st==='open'&&l.set===e.sets.length){l.st=(l.sid===(w?'a':'h'))?'won':'lost';checkBet(bt)}
   const won=e.sets.filter(x=>x[0]>x[1]&&(x[0]>=6)).length,lost=e.sets.filter(x=>x[1]>x[0]&&(x[1]>=6)).length;if(won===2||lost===2){end(e,silent);return}e.sets.push([0,0])}}}
function setsWon(e,t){return e.sets.filter(x=>(x[t]>=6&&x[t]-x[1-t]>=2)||x[t]===7).length}
function end(e,silent){e.status='ended';e.endAt=Date.now();if(!silent){SND.t(660,.3,{type:'triangle',vol:.06})}settleEvent(e)}
/* --- pricing --- */
function sel(e,mk,label,list){const old=e.mk[mk];const sels=list.map(([id,l,p])=>{let o=toOdds(p);const prev=old?.sels.find(s=>s.id===id);if(prev&&prev.odds&&o&&!e._force&&Math.abs(o-prev.odds)<Math.max(.02,prev.odds*.02))o=prev.odds;let dir=prev&&prev.odds&&o?(o>prev.odds+.004?'up':o<prev.odds-.004?'dn':prev.dir):'';const dirAt=prev&&prev.odds!==o?Date.now():prev?.dirAt||0;if(Date.now()-dirAt>3500)dir='';return {id,l,p,odds:o,dir,dirAt}});e.mk[mk]={label,sels,line:old?.line}}
function price(e,init){
 if(e.sport==='football'){const r=Math.max(0,(5400-e.clock))/5400,lh=e.lh*r,la=e.la*r;let pH=0,pD=0,pA=0;const ph=[],pa=[];for(let k=0;k<=10;k++){ph.push(pois(lh,k));pa.push(pois(la,k))}
  for(let i=0;i<=10;i++)for(let j=0;j<=10;j++){const p=ph[i]*pa[j],d=e.score[0]+i-(e.score[1]+j);if(d>0)pH+=p;else if(d<0)pA+=p;else pD+=p}
  sel(e,'ft','Full time result',[['h','1',pH],['d','X',pD],['a','2',pA]]);
  const tot=e.score[0]+e.score[1],L=Math.max(2.5,tot+.5);const lam=lh+la;let pu=0;for(let k=0;k<=L-tot-.5;k++)pu+=pois(lam,k);sel(e,'ou',`Total goals ${L}`,[['o',`Over ${L}`,1-pu],['u',`Under ${L}`,pu]]);e.mk.ou.line=L;
  const none=Math.exp(-lam);sel(e,'ng',`Goal ${tot+1}`,[['h',e.h,(1-none)*lh/(lam||1)],['n','None',none],['a',e.a,(1-none)*la/(lam||1)]]);e.mk.ng.base=tot}
 e._force=0;
 if(e.sport==='basketball'){const rem=Math.max(0,e.len-e.clock),diff=e.score[0]-e.score[1],mu=diff+(e.rh-e.ra)*rem,sd=Math.sqrt((e.rh+e.ra)*rem*2.46)+.6;const pH=normCdf(mu/sd);
  sel(e,'ml','Money line',[['h',e.h,pH],['a',e.a,1-pH]]);
  const proj=e.score[0]+e.score[1]+(e.rh+e.ra)*rem;const L=Math.floor(proj)+.5;const pO=1-normCdf((L-proj)/(sd*.9));sel(e,'tp',`Total points ${L}`,[['o',`Over ${L}`,pO],['u',`Under ${L}`,1-pO]]);e.mk.tp.line=L;
  const hc=-Math.round(mu*2)/2+(Math.round(mu*2)%2===0?-.5:0);const pc=normCdf((mu+hc)/sd);sel(e,'hc',`Handicap ${e.h} ${hc>0?'+':''}${hc}`,[['h',`${e.h} ${hc>0?'+':''}${hc}`,pc],['a',`${e.a} ${-hc>0?'+':''}${-hc}`,1-pc]]);e.mk.hc.line=hc}
 if(e.sport==='tennis'){if(init||!e._mc||Date.now()-e._mc>1500){e._mc=Date.now();let w=0,sw=0;const N=260;for(let i=0;i<N;i++){const r=mcTennis(e);w+=r[0];sw+=r[1]}e._pm=w/N;e._ps=sw/N}
  sel(e,'mw','Match winner',[['h',e.h,e._pm],['a',e.a,1-e._pm]]);sel(e,'set',`Set ${e.sets.length} winner`,[['h',e.h,e._ps],['a',e.a,1-e._ps]]);e.mk.set.set=e.sets.length}
 if(e.sport==='esports'){const memo={};const pw=(a,b)=>{if(a>=13)return 1;if(b>=13)return 0;const k=a+'_'+b;if(k in memo)return memo[k];return memo[k]=e.pr*pw(a+1,b)+(1-e.pr)*pw(a,b+1)};const pH=pw(e.score[0],e.score[1]);
  let pO=0,N=400;for(let i=0;i<N;i++){let a=e.score[0],b=e.score[1];while(a<13&&b<13){if(Math.random()<e.pr)a++;else b++}if(a+b>21.5)pO++}pO/=N;
  sel(e,'mw','Match winner',[['h',e.h,pH],['a',e.a,1-pH]]);sel(e,'tr','Total rounds 21.5',[['o','Over 21.5',clamp(pO,.03,.97)],['u','Under 21.5',clamp(1-pO,.03,.97)]]);e.mk.tr.line=21.5}}
function mcTennis(e){const sets=e.sets.map(s=>s.slice());let pts=e.pts.slice(),srv=e.srv,cur=sets.length-1;let setWin=null;
 for(let guard=0;guard<2000;guard++){const set=sets[sets.length-1];const tb=set[0]===6&&set[1]===6;const pw=srv===0?e.ph:e.pa;const w=Math.random()<pw?srv:1-srv;pts[w]++;
  if(tb?(pts[w]>=7&&pts[w]-pts[1-w]>=2):(pts[w]>=4&&pts[w]-pts[1-w]>=2)){set[w]++;pts=[0,0];srv=1-srv;if((set[w]>=6&&set[w]-set[1-w]>=2)||set[w]===7){if(sets.length-1===cur&&setWin===null)setWin=w===0?1:0;
   const won=sets.filter(x=>(x[0]>=6&&x[0]-x[1]>=2)||x[0]===7).length,lost=sets.filter(x=>(x[1]>=6&&x[1]-x[0]>=2)||x[1]===7).length;if(won===2)return [1,setWin];if(lost===2)return [0,setWin];sets.push([0,0])}}}return [.5,.5]}
/* --- settlement --- */
function legResult(l,e){const [h,a]=e.score;if(l.mk==='ft')return ({h:h>a,d:h===a,a:a>h})[l.sid];if(l.mk==='ou'||l.mk==='tp'||l.mk==='tr'){const t=e.sport==='esports'?h+a:h+a;return l.sid==='o'?t>l.line:t<l.line}
 if(l.mk==='ml'||l.mk==='mw'){if(e.sport==='tennis'&&Array.isArray(e.sets)){const w=setsWon(e,0)>setsWon(e,1);return l.sid==='h'?w:!w}return l.sid==='h'?h>a:a>h}
 if(l.mk==='hc'){const m=h+l.line-a;return l.sid==='h'?m>0:m<0}if(l.mk==='ng')return l.sid==='n';if(l.mk==='set')return null;return false}
function settleEvent(e){for(const b of S.bets){if(b.status!=='open')continue;let touched=false;for(const l of b.legs){if(l.eid!==e.id||l.st!=='open')continue;const r=legResult(l,e);if(r===null)continue;l.st=r?'won':'lost';touched=true}if(touched)checkBet(b)}save()}
function checkBet(b){if(b.status!=='open')return;if(b.legs.some(l=>l.st==='lost')){b.status='lost';b.payout=0;S.wager+=b.stake;save();refreshBets();return}
 if(b.legs.every(l=>l.st==='won')){b.status='won';b.payout=b.stake*b.odds;S.bal+=b.payout;S.wager+=b.stake;S.won+=b.payout-b.stake;updBal(true);SND.win();toast(`Bet won · +${fmt(b.payout)} USDT`,'w');pushFeed({name:S.user,game:'sports',bet:b.stake,mult:b.odds,pay:b.payout,me:true});if(b.odds>=10)bigWin(b.payout,b.odds,'sports');save()}refreshBets()}
/* void bets whose events no longer exist (page reloaded) */
for(const b of S.bets)if(b.status==='open'&&b.legs.some(l=>String(l.eid)[0]!=='r')){b.status='void';b.payout=b.stake;S.bal+=b.stake}
/* --- schedule: keep live and upcoming events flowing --- */
function seed(){[['football',.25],['football',.55],['football',.8],['basketball',.4],['basketball',.7],['tennis',.35],['tennis',.6],['esports',.5],['football',.05]].forEach(([s,f])=>newEvent(s,0,f));
 [['football',90e3],['basketball',150e3],['tennis',200e3],['football',260e3],['esports',320e3],['football',420e3],['basketball',540e3],['tennis',660e3],['football',780e3],['esports',900e3]].forEach(([s,t])=>newEvent(s,t))}
seed();
GAMES.sports={name:'Sportsbook',c:['#2F7BF0','#0F2A66'],cat:'sports'};IC.sports='<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#fff"/><path d="M20 12l7 5-3 8h-8l-3-8z" fill="#16102E"/></svg>';
let lastRender=0;
setInterval(()=>{const now=Date.now();for(const e of EVENTS){if(e.status==='pre'&&now>=e.start){e.status='live';e.log.unshift(e.sport==='football'?'Kick-off':'Started')}
  if(e.status==='live'){const per={football:1,basketball:1,tennis:Math.random()<.3?1:0,esports:Math.random()<.11?1:0}[e.sport];for(let i=0;i<per;i++)step(e)}}
 for(let i=EVENTS.length-1;i>=0;i--)if(EVENTS[i].status==='ended'&&now-EVENTS[i].endAt>90e3){const s=EVENTS[i].sport;EVENTS.splice(i,1);newEvent(s,240e3+rnd(300e3))}
 if(EVENTS.filter(e=>e.status!=='ended').length<14)newEvent(pickr(['football','football','basketball','tennis','esports']),180e3+rnd(400e3));
 tickSports()},250);
/* ===================== bet slip ===================== */
const evById=id=>EVENTS.find(e=>e.id==id)||(typeof REAL!=='undefined'?REAL.events.find(e=>e.id==id):null);
function getSel(eid,mk,sid){const e=evById(eid);return e&&e.mk[mk]?{e,m:e.mk[mk],s:e.mk[mk].sels.find(x=>x.id===sid)}:null}
function addSel(eid,mk,sid){const g=getSel(eid,mk,sid);if(!g||!g.s.odds||g.e.status==='ended')return;const ex=S.slip.findIndex(x=>x.eid===eid&&x.mk===mk&&x.sid===sid);
 if(ex>=0)S.slip.splice(ex,1);else{if(S.slipMode==='combo')S.slip=S.slip.filter(x=>x.eid!==eid);S.slip.push({eid,mk,sid,odds:g.s.odds,stake:5})}SND.chip();
 $$(`[data-o="${eid}|${mk}|${sid}"]`).forEach(b=>b.classList.toggle('on',ex<0));if(innerWidth>=1024)setSide('slip');renderSlipBtn();if(SIDE==='slip')renderSide()}
function slipData(){return S.slip.map(x=>{const g=getSel(x.eid,x.mk,x.sid);const cur=g&&g.s.odds;const live=g&&g.e.status!=='ended';const sus=!g||!cur||Date.now()<g.e.susp||!live;return {...x,g,cur,sus,changed:cur&&Math.abs(cur-x.odds)>.004}})}
function slipBody(){if(!S.slip.length)return `<div class="empty"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--ink-faint)">${NI.mybets}</svg><p style="margin-top:10px">Your bet slip is empty</p><p class="small faint" style="margin-top:4px">Tap any odds to add a selection</p></div>`;
 const D=slipData();return `<div class="seg"><button class="${S.slipMode==='single'?'on':''}" onclick="S.slipMode='single';renderSide();renderSlipSheet()">Singles</button><button class="${S.slipMode==='combo'?'on':''}" onclick="setCombo()">Combo</button></div>`+D.map((x,i)=>{const e=x.g?.e;return `<div class="slipitem ${x.changed?'changed':''}"><div class="t"><div style="min-width:0"><b>${esc(x.g?.s.l||'—')}</b><div class="small muted">${esc(x.g?.m.label||'')}</div><div class="small faint" style="margin-top:2px">${e?`${esc(e.h)} v ${esc(e.a)}${e.status==='live'?' · <span style="color:var(--live)">LIVE</span>':''}`:'Event ended'}</div></div><div style="text-align:right"><b class="num" style="font-size:16px;color:${x.changed?'var(--warn)':'var(--gold-text)'}">${x.sus?'—':(x.cur||x.odds).toFixed(2)}</b><button class="x" onclick="S.slip.splice(${i},1);renderSide();renderSlipSheet();renderSlipBtn();syncOddsSel()" aria-label="Remove">✕</button></div></div>
  ${x.sus?'<div class="susp">Suspended</div>':x.changed?`<div class="small" style="color:var(--warn)">Odds changed from ${x.odds.toFixed(2)}</div>`:''}
  ${S.slipMode==='single'?`<div class="inp" style="min-height:40px">${COIN}<input type="number" min="0" step="0.5" value="${x.stake}" oninput="S.slip[${i}].stake=+this.value;updSlipTotals()"><span class="suf num">Win ${fmt(x.stake*(x.cur||x.odds))}</span></div>`:''}</div>`}).join('')}
function setCombo(){const seen=new Set();S.slip=S.slip.filter(x=>{if(seen.has(x.eid))return false;seen.add(x.eid);return true});S.slipMode='combo';renderSide();renderSlipSheet();syncOddsSel()}
function slipFoot(){if(!S.slip.length)return '';const D=slipData();const anySus=D.some(x=>x.sus),anyCh=D.some(x=>x.changed);
 const tot=S.slipMode==='combo'?D.reduce((a,x)=>a*(x.cur||x.odds),1):0;
 return `${S.slipMode==='combo'?`<div class="kv"><span>Total odds</span><b class="num">${tot.toFixed(2)}</b></div><div class="inp">${COIN}<input id="cstake" type="number" min="0" step="0.5" value="${S.comboStake||10}" oninput="S.comboStake=+this.value;updSlipTotals()"></div>`:''}
 <div class="row" style="gap:6px">${[5,10,25,50,100].map(v=>`<button class="chip" onclick="quickStake(${v})">${v}</button>`).join('')}</div>
 <div class="kv"><span>Potential win</span><b class="num pos" id="potw">0.00 USDT</b></div>
 <label class="small muted" style="display:flex;gap:8px;align-items:center"><input type="checkbox" ${S.acceptOdds?'checked':''} onchange="S.acceptOdds=this.checked;save()" style="accent-color:#FFC23D">Accept any odds changes</label>
 <button class="btn lg block primary" ${anySus?'disabled':''} onclick="placeSlip()">${anySus?'Selection suspended':anyCh&&!S.acceptOdds?'Accept changes and bet':'Place bet'}</button><button class="btn ghost sm" onclick="S.slip=[];renderSide();renderSlipSheet();renderSlipBtn();syncOddsSel()">Clear slip</button>`}
function quickStake(v){if(S.slipMode==='combo'){S.comboStake=v;const i=$('#cstake');if(i)i.value=v}else S.slip.forEach(x=>x.stake=v);renderSide();renderSlipSheet()}
function updSlipTotals(){const D=slipData();let w=0;if(S.slipMode==='combo')w=(S.comboStake||10)*D.reduce((a,x)=>a*(x.cur||x.odds),1);else w=D.reduce((a,x)=>a+x.stake*(x.cur||x.odds),0);$$('#potw').forEach(e=>e.textContent=fmt(w)+' USDT')}
function wireSlip(){updSlipTotals()}
function placeSlip(){const D=slipData();if(D.some(x=>x.sus)){toast('A selection is suspended','e');return}
 if(D.some(x=>x.changed)&&!S.acceptOdds){S.slip.forEach(x=>{const g=getSel(x.eid,x.mk,x.sid);if(g&&g.s.odds)x.odds=g.s.odds});renderSide();renderSlipSheet();toast('Odds updated. Review and place again');return}
 const leg=x=>({eid:x.eid,mk:x.mk,sid:x.sid,label:x.g.s.l,mkt:x.g.m.label,ev:`${x.g.e.h} v ${x.g.e.a}`,sport:x.g.e.sport,odds:x.cur,st:'open',line:x.g.m.line,base:x.g.m.base,set:x.g.m.set});
 if(S.slipMode==='combo'){if(D.length<2){toast('A combo needs at least two selections','e');return}const st=S.comboStake||10;if(!debit(st))return;const odds=+D.reduce((a,x)=>a*x.cur,1).toFixed(2);S.bets.unshift({id:Date.now(),type:'combo',legs:D.map(leg),stake:st,odds,status:'open',t:Date.now()})}
 else{const total=D.reduce((a,x)=>a+x.stake,0);if(D.some(x=>!(x.stake>0))){toast('Enter a stake for every selection','e');return}if(!debit(total))return;D.forEach((x,i)=>S.bets.unshift({id:Date.now()+i,type:'single',legs:[leg(x)],stake:x.stake,odds:x.cur,status:'open',t:Date.now()}))}
 S.slip=[];save();SND.bet();toast('Bet placed. Follow it in My bets','w');closeSheet();renderSide();renderSlipBtn();syncOddsSel();refreshBets()}
function renderSlipBtn(){$('.slipbtn')?.remove();if(!S.slip.length||!['sports','live','mybets'].concat(ROUTE.startsWith('event/')?[ROUTE]:[]).includes(ROUTE))return;const b=document.createElement('button');b.className='slipbtn';const o=S.slipMode==='combo'?S.slip.reduce((a,x)=>a*x.odds,1):null;b.innerHTML=`Bet slip · ${S.slip.length}${o?` <span class="num">@ ${o.toFixed(2)}</span>`:''}`;b.onclick=slipSheet;document.body.appendChild(b)}
let slipOpen=false;function slipSheet(){slipOpen=true;sheet(`<h2>Bet slip</h2><div id="sheetSlip" class="stack">${slipBody()}</div><div id="sheetFoot" class="stack">${slipFoot()}</div>`);updSlipTotals()}
function renderSlipSheet(){const b=$('#sheetSlip');if(!b)return;if(!S.slip.length){closeSheet();return}b.innerHTML=slipBody();$('#sheetFoot').innerHTML=slipFoot();updSlipTotals()}
function syncOddsSel(){$$('[data-o]').forEach(b=>{const [e,m,s]=b.dataset.o.split('|');b.classList.toggle('on',S.slip.some(x=>x.eid==e&&x.mk===m&&x.sid===s))})}
/* ===================== cash out ===================== */
function cashValue(b){if(b.status!=='open')return null;let f=1;for(const l of b.legs){if(l.st==='won')continue;if(l.st==='lost')return null;const g=getSel(l.eid,l.mk,l.sid);if(!g||!g.s.odds||Date.now()<g.e.susp)return null;
  if(['ou','tp','tr','hc'].includes(l.mk)&&g.m.line!==l.line){const p=lineProb(g.e,l);if(p==null)return null;f*=Math.min(100,l.odds*p)}else f*=l.odds/g.s.odds}return Math.max(0,b.stake*f*.95)}
function lineProb(e,l){const tot=e.score[0]+e.score[1];if(e.sport==='football'){const r=Math.max(0,5400-e.clock)/5400,lam=(e.lh+e.la)*r;let pu=0;for(let k=0;k<=l.line-tot-.5;k++)pu+=pois(lam,k);return l.sid==='o'?1-pu:pu}
 if(e.sport==='basketball'){const rem=Math.max(0,e.len-e.clock),proj=tot+(e.rh+e.ra)*rem,sd=Math.sqrt((e.rh+e.ra)*rem*2.46)+.6;if(l.mk==='hc'){const mu=e.score[0]-e.score[1]+(e.rh-e.ra)*rem;const p=normCdf((mu+l.line)/sd);return l.sid==='h'?p:1-p}const p=1-normCdf((l.line-proj)/(sd*.9));return l.sid==='o'?p:1-p}return null}
function cashOut(id){const b=S.bets.find(x=>x.id===id);const v=cashValue(b);if(v==null){toast('Cash out is unavailable right now','e');return}b.status='cashed';b.payout=v;S.bal+=v;S.wager+=b.stake;updBal(true);SND.cash();toast(`Cashed out ${fmt(v)} USDT`,'w');save();refreshBets()}
function refreshBets(){const c=S.bets.filter(b=>b.status==='open').length;const el=$('#opencnt');if(el){el.hidden=!c;el.textContent=c}if(ROUTE==='mybets'&&!document.activeElement?.closest?.('#view'))$('#view').innerHTML=PAGES.mybets()}
/* ===================== sports UI ===================== */
let SPF='all',BETTAB='open';
function clockTxt(e){if(e.real)return realClock(e);if(e.status==='pre'){const s=Math.max(0,Math.round((e.start-Date.now())/1000));return s<3600?`Starts in ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`:new Date(e.start).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
 if(e.status==='ended')return 'Ended';
 if(e.sport==='football'){const m=Math.floor(e.clock/60);return m>=90?`90+${m-89}'`:m>=45&&m<46?"HT":`${m+1}'`}
 if(e.sport==='basketball'){const ql=e.len/4,q=Math.min(4,Math.floor(e.clock/ql)+1),r=Math.max(0,Math.round(ql*q-e.clock)),ot=e.clock>=e.len;return ot?'OT':`Q${q} ${Math.floor(r/60)}:${String(r%60).padStart(2,'0')}`}
 if(e.sport==='tennis')return `Set ${e.sets.length}`;if(e.sport==='esports')return `Round ${e.score[0]+e.score[1]+1}`}
function scoreTxt(e,t){if(e.real)return e.score&&e.status!=='pre'?`<b class="num">${e.score[t]}</b>`:'';if(e.status==='pre')return '';if(e.sport==='tennis'){const P=['0','15','30','40','AD'];const set=e.sets[e.sets.length-1];const tb=set[0]===6&&set[1]===6;let pt=tb?e.pts[t]:(e.pts[0]>=3&&e.pts[1]>=3?(e.pts[t]>e.pts[1-t]?'AD':'40'):P[Math.min(3,e.pts[t])]);return `<span class="faint" style="font-size:12px;margin-right:8px">${e.sets.map(s=>s[t]).join(' ')}</span><b class="num">${pt}</b>${e.srv===t&&e.status==='live'?' <span style="color:var(--gold)">•</span>':''}`}return `<b class="num">${e.score[t]}</b>`}
function oddBtn(e,mk,s){const on=S.slip.some(x=>x.eid==e.id&&x.mk===mk&&x.sid===s.id);const sus=!s.odds||Date.now()<e.susp||e.status==='ended'||!!e.lock;return `<button class="odd ${on?'on':''} ${s.dir==='up'?'up':s.dir==='dn'?'dn':''} ${sus?'sus':''}" data-o="${e.id}|${mk}|${s.id}" onclick="addSel('${e.id}','${mk}','${s.id}')"><small>${esc(s.l)}</small><b>${s.odds?s.odds.toFixed(2):'—'}</b></button>`}
function mainMk(e){return e.mk.ft?'ft':e.mk.ml?'ml':e.mk.mw?'mw':Object.keys(e.mk)[0]}
function evCard(e){const mk=mainMk(e),m=mk?e.mk[mk]:null;const live=e.status==='live';const sus=Date.now()<e.susp;
 return `<div class="ev" data-ev="${e.id}"><div class="meta"><span class="lg">${sico(e.sport)}${e.lg}</span>${live?`<span class="badge live"><span class="dot"></span><span data-ck="${e.id}">${clockTxt(e)}</span></span>`:`<span data-ck="${e.id}">${clockTxt(e)}</span>`}</div>
 <button class="teams" style="text-align:left" onclick="go('event/${e.id}')"><div><span>${esc(e.h)}</span><span data-sh="${e.id}">${scoreTxt(e,0)}</span></div><div><span>${esc(e.a)}</span><span data-sa="${e.id}">${scoreTxt(e,1)}</span></div></button>
 ${e.sport==='football'&&live&&!e.real?`<div class="pbar"><i data-pb="${e.id}" style="width:${Math.min(100,e.clock/54)}%"></i></div>`:''}
 ${m?`<div class="mkts"><div class="mkt-h" style="display:flex;justify-content:space-between"><span>${m.label}</span>${Object.keys(e.mk).length>1?`<button class="btn ghost sm" style="padding:0" onclick="go('event/${e.id}')">+${Object.keys(e.mk).length-1} markets</button>`:''}</div><div class="susp" data-sp="${e.id}" ${sus?'':'hidden'}>${e.sport==='football'?'Goal · market suspended':'Suspended'}</div>${e.lock?`<div class="small faint">${e.lock}</div>`:''}<div class="odds" style="grid-template-columns:repeat(${m.sels.length},1fr)">${m.sels.map(s=>oddBtn(e,mk,s)).join('')}</div></div>`:`<div class="small faint">${e.note||'Odds open when the live feed is connected'}</div>`}</div>`}
function sortedEvents(f){return EVENTS.filter(e=>e.status!=='ended'&&(f==='all'||f==='live'?true:e.sport===f)).sort((a,b)=>a.start-b.start)}
function tickSports(){const now=Date.now();
 if(['sports','live'].includes(ROUTE)||ROUTE==='lobby'||ROUTE.startsWith('event/')){const sig=EVENTS.map(e=>e.id+e.status).join(',')+(typeof REAL!=='undefined'?REAL.sig:'');if(sig!==tickSports.sig){tickSports.sig=sig;if(ROUTE==='sports'||ROUTE==='live')$('#evwrap')&&($('#evwrap').innerHTML=evSections())}
  for(const e of EVENTS.concat(typeof REAL!=='undefined'?REAL.events:[])){$$(`[data-ck="${e.id}"]`).forEach(x=>x.textContent=clockTxt(e));$$(`[data-sh="${e.id}"]`).forEach(x=>{const h=scoreTxt(e,0);if(x.innerHTML!==h){x.innerHTML=h;x.classList.add('flash');setTimeout(()=>x.classList.remove('flash'),2500)}});$$(`[data-sa="${e.id}"]`).forEach(x=>{const h=scoreTxt(e,1);if(x.innerHTML!==h){x.innerHTML=h;x.classList.add('flash');setTimeout(()=>x.classList.remove('flash'),2500)}});
   $$(`[data-pb="${e.id}"]`).forEach(x=>x.style.width=Math.min(100,e.clock/54)+'%');$$(`[data-sp="${e.id}"]`).forEach(x=>x.hidden=!(now<e.susp));
   for(const [mk,m] of Object.entries(e.mk))for(const s of m.sels){const els=$$(`[data-o="${e.id}|${mk}|${s.id}"]`);if(!els.length)continue;const sus=!s.odds||now<e.susp||e.status==='ended'||!!e.lock;els.forEach(b=>{b.querySelector('b').textContent=s.odds?s.odds.toFixed(2):'—';b.querySelector('small').textContent=s.l;b.classList.toggle('sus',sus);b.classList.toggle('up',s.dir==='up');b.classList.toggle('dn',s.dir==='dn')})}}
  if(ROUTE.startsWith('event/')){const e=evById(ROUTE.slice(6));if(e){const lg=$('#evlog');if(lg)lg.innerHTML=evLog(e);const st=$('#evstats');if(st)st.innerHTML=evStats(e);const ml=$('#mklabels');if(ml)Object.entries(e.mk).forEach(([k,m])=>{const el=$(`[data-ml="${k}"]`);if(el)el.textContent=m.label})}}}
 if(SIDE==='slip'&&S.slip.length&&$('#sideBody')&&!$('#sideBody').contains(document.activeElement)&&(!tickSports.ls||now-tickSports.ls>1000)){tickSports.ls=now;renderSide()}
 if($('#sheetSlip')&&!$('#sheetSlip').contains(document.activeElement)&&(!tickSports.ss||now-tickSports.ss>1000)){tickSports.ss=now;renderSlipSheet()}
 if(ROUTE==='mybets'&&(!tickSports.mb||now-tickSports.mb>1000)){tickSports.mb=now;$$('[data-cv]').forEach(x=>{const b=S.bets.find(y=>y.id==x.dataset.cv);const v=b&&cashValue(b);x.disabled=v==null;x.innerHTML=v==null?'Cash out suspended':`Cash out <span class="num">${fmt(v)}</span>`});$$('[data-bl]').forEach(x=>{const e=evById(x.dataset.bl);if(e)x.textContent=e.status==='live'?`${e.score[0]}–${e.score[1]} · ${clockTxt(e)}`:clockTxt(e)})}
 const lc=$('#livecnt');if(lc)lc.textContent=EVENTS.filter(e=>e.status==='live').length+' live'}
function simSections(){const live=sortedEvents(SPF==='live'?'all':SPF).filter(e=>e.status==='live'),pre=sortedEvents(SPF==='live'?'all':SPF).filter(e=>e.status==='pre');
 return `<section><div class="sec-h"><h2><span class="dot"></span>Rokket Arena</h2><span class="badge">Simulated · ${live.length} live</span></div><p class="small muted" style="margin:-6px 0 12px">Always-on simulated matches with fictional teams, so in-play betting can be shown at any hour.</p><div class="evgrid">${live.map(evCard).join('')||'<div class="card empty">No live events in this sport right now</div>'}</div></section>
 ${SPF==='live'?'':`<section><div class="sec-h"><h2>Arena · starting soon</h2></div><div class="evgrid">${pre.slice(0,10).map(evCard).join('')||'<div class="card empty">Nothing scheduled</div>'}</div></section>`}`}
function evLog(e){return e.log.slice(0,8).map(l=>`<div class="kv"><span>${esc(l)}</span></div>`).join('')||'<p class="small muted">Waiting for kick-off</p>'}
function evStats(e){if(e.sport==='football')return [['Shots',e.stats.sh],['Corners',e.stats.co],['Possession',[Math.round(e.stats.pos),100-Math.round(e.stats.pos)]]].map(([l,[a,b]])=>`<div><div class="profit" style="margin-bottom:5px"><b class="num" style="color:var(--ink)">${a}${l==='Possession'?'%':''}</b><span>${l}</span><b class="num" style="color:var(--ink)">${b}${l==='Possession'?'%':''}</b></div><div style="display:flex;gap:4px;height:6px"><i style="flex:${a||.1};background:var(--gold);border-radius:3px"></i><i style="flex:${b||.1};background:var(--violet);border-radius:3px"></i></div></div>`).join('');
 if(e.sport==='basketball')return `<table class="tbl"><thead><tr><th></th>${e.q.map((_,i)=>`<th class="r">Q${i+1}</th>`).join('')}<th class="r">T</th></tr></thead><tbody>${[0,1].map(t=>`<tr><td>${esc(t?e.a:e.h)}</td>${e.q.map(q=>`<td class="r num">${q[t]}</td>`).join('')}<td class="r num"><b>${e.score[t]}</b></td></tr>`).join('')}</tbody></table>`;
 if(e.sport==='tennis')return `<table class="tbl"><thead><tr><th></th>${e.sets.map((_,i)=>`<th class="r">Set ${i+1}</th>`).join('')}</tr></thead><tbody>${[0,1].map(t=>`<tr><td>${esc(t?e.a:e.h)}${e.srv===t?' <span style="color:var(--gold)">•</span>':''}</td>${e.sets.map(s=>`<td class="r num">${s[t]}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 return `<div class="profit"><span>First to 13 rounds</span><b class="num" style="color:var(--ink)">${e.score[0]} – ${e.score[1]}</b></div>`}
