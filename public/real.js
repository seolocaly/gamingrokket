/* Live data: Server-Sent Events when the host supports them (Rokket server), otherwise polling (Vercel). */
function liveSource(streamUrl,pollUrl,apply,ms){let polling=false;const poll=()=>{if(polling)return;polling=true;const go=async()=>{try{const r=await fetch(pollUrl,{cache:'no-store'});if(r.ok)apply(await r.json())}catch(e){}};setInterval(go,ms)};
 if(!window.EventSource){poll();return}let es;try{es=new EventSource(streamUrl)}catch(e){poll();return}let got=false;es.onmessage=ev=>{got=true;try{apply(JSON.parse(ev.data))}catch(e){}};es.onerror=()=>{if(!got||es.readyState===2){es.close();poll()}}}
/* ===================== Real sports: SportRadar snapshot + live feed server ===================== */
const REAL={events:[],mode:'snapshot',at:Date.parse(SNAP.at),sig:'',updated:0,books:0,quota:null};
const shortName=n=>{const p=n.split(' ');return p.length>2&&n.length>16?p.slice(-1)[0]:n};
const marg=p=>p>0.004?Math.max(1.01,Math.round(100/(p*1.055))/100):null;
const fmtPt=v=>(v>0?'+':'')+v;
function realMarkets(e,x){const mk={};const h=x.h2h;
 if(h){if(h.draw!=null)mk.ft={label:'Full time result',sels:[{id:'h',l:'1',odds:h.home},{id:'d',l:'X',odds:h.draw},{id:'a',l:'2',odds:h.away}]};else mk.ml={label:'Match winner',sels:[{id:'h',l:shortName(e.h),odds:h.home},{id:'a',l:shortName(e.a),odds:h.away}]}}
 if(x.totals&&x.totals.point!=null){const p=x.totals.point;mk.ou={label:`Total ${p}`,line:p,sels:[{id:'o',l:`Over ${p}`,odds:x.totals.over},{id:'u',l:`Under ${p}`,odds:x.totals.under}]}}
 if(x.spreads&&x.spreads.point!=null){const p=x.spreads.point;mk.hc={label:'Handicap',line:p,sels:[{id:'h',l:`${shortName(e.h)} ${fmtPt(p)}`,odds:x.spreads.home},{id:'a',l:`${shortName(e.a)} ${fmtPt(-p)}`,odds:x.spreads.away}]}}
 return mk}
function mergeMarkets(e,mk){const now=Date.now();for(const [k,m] of Object.entries(mk)){const old=e.mk[k];m.sels.forEach(s=>{const o=old&&old.sels.find(q=>q.id===s.id);if(o&&o.odds&&s.odds&&Math.abs(o.odds-s.odds)>.004){s.dir=s.odds>o.odds?'up':'dn';s.dirAt=now}else if(o){s.dir=now-(o.dirAt||0)<4000?o.dir:'';s.dirAt=o.dirAt}})}e.mk=mk}
function snapEvents(){return SNAP.events.map(x=>{const e={id:x.id,real:true,src:'snapshot',sport:x.sport,lg:x.league,h:x.home,a:x.away,start:Date.parse(x.start),status:x.status,score:x.score||null,clk:x.clock||'',setsTxt:x.sets||'',mk:{},susp:0,log:[]};
 if(x.p){const [ph,pd,pa]=x.p.map(v=>v==null?null:v/100);e.mk=realMarkets(e,{h2h:{home:marg(ph),draw:pd==null?null:marg(pd),away:marg(pa)}})}
 if(e.status==='live')e.note=`Score as of ${new Date(REAL.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}. Live score updates and in-play odds need the Rokket feed server.`;
 if(x.sport==='cricket')e.note='Odds for this match open when the live feed is connected.';return e})}
function lockSnap(){const now=Date.now();for(const e of REAL.events){if(e.src!=='snapshot')continue;if(e.status==='pre'&&now>=e.start){e.lock='Kicked off. In-play odds need the live feed.';}if(e.status==='live')e.lock='In-play odds need the live feed.'}}
function realClock(e){if(e.status==='pre'){const s=Math.max(0,Math.round((e.start-Date.now())/1000));if(s===0)return 'Started';if(s<3600)return `Starts in ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;const d=new Date(e.start),t=new Date();const same=d.toDateString()===t.toDateString();const tm=new Date(t.getTime()+864e5).toDateString()===d.toDateString();return `${same?'Today':tm?'Tomorrow':d.toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`}
 if(e.status==='ended')return 'Final';if(e.src==='snapshot')return e.clk||'Live';const m=Math.floor((Date.now()-e.start)/60000);return e.clk||(e.sport==='football'?`${m>45?Math.min(90,m-15):m}'`:'Live')}
function applyFeed(d){REAL.mode='live';REAL.updated=Date.now();REAL.books=d.books||0;REAL.quota=d.quota??null;const seen=new Set();
 for(const x of d.events||[]){seen.add(x.id);let e=REAL.events.find(q=>q.id===x.id);const fresh=!e;if(!e){e={id:x.id,real:true,mk:{},susp:0,log:[]};REAL.events.push(e)}
  const prevStatus=e.status,prevScore=e.score?e.score.join('-'):'';Object.assign(e,{src:'feed',sport:x.sport,lg:x.league,h:x.home,a:x.away,start:Date.parse(x.start),status:x.status,score:x.score||null,clk:x.clock||'',lock:null,note:x.status==='live'&&!x.h2h?'In-play odds are paused for this match by the feed.':null});
  mergeMarkets(e,realMarkets(e,x));
  if(!fresh&&e.score&&e.score.join('-')!==prevScore&&prevScore){e.susp=Date.now()+4000;e.log.unshift(`Score ${e.score.join('–')}`);for(const b of S.bets)if(b.status==='open'&&b.legs.some(l=>l.eid===e.id)){toast(`${e.h} ${e.score[0]}–${e.score[1]} ${e.a}`);break}}
  if(e.status==='ended'&&prevStatus!=='ended')settleEvent(e)}
 REAL.events=REAL.events.filter(e=>seen.has(e.id)||e.src==='snapshot'&&false);REAL.sig=REAL.events.map(e=>e.id+e.status).join(',');tickSports.sig='';
 if(['sports','live','lobby'].includes(ROUTE)){const w=$('#evwrap');if(w)w.innerHTML=evSections()}}
async function realInit(){REAL.events=snapEvents();lockSnap();REAL.sig='snap';
 try{const r=await fetch('/api/feed',{cache:'no-store'});const ct=r.headers.get('content-type')||'';if(r.ok&&ct.includes('json')){applyFeed(await r.json());
  liveSource('/api/stream','/api/feed',applyFeed,30000)}}catch(e){}
 if(REAL.mode!=='live'){setInterval(lockSnap,15000)}}
realInit();
function realSection(title,list,badge){return `<section><div class="sec-h"><h2>${title}</h2>${badge||''}</div><div class="evgrid">${list.map(evCard).join('')}</div></section>`}
function dayKey(t){const d=new Date(t),n=new Date();if(d.toDateString()===n.toDateString())return 'Today';if(new Date(n.getTime()+864e5).toDateString()===d.toDateString())return 'Tomorrow';return d.toLocaleDateString([],{weekday:'long',day:'numeric',month:'short'})}
function feedBanner(){if(REAL.mode==='live')return `<div class="card small" style="padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="badge win"><span class="dot" style="background:var(--win)"></span>Live feed</span><span class="muted">Real fixtures, scores and odds from ${REAL.books||'multiple'} bookmakers · Rokket margin applied · updated <b class="num" id="fdage">0</b>s ago</span></div>`;
 return `<div class="card small" style="padding:12px 14px;display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap"><span class="badge gold">Real fixtures</span><span class="muted" style="flex:1;min-width:220px">Teams, kick-off times, scores and win probabilities from SportRadar, captured ${new Date(REAL.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} today. Odds are Rokket prices built from those probabilities. Live scores and in-play odds switch on automatically when the app runs on the Rokket feed server.</span><button class="btn sm" onclick="feedHelp()">How live feed works</button></div>`}
setInterval(()=>{const a=$('#fdage');if(a)a.textContent=Math.round((Date.now()-REAL.updated)/1000)},1000);
function evSections(){const f=SPF;const fil=e=>f==='all'||f==='live'||e.sport===f;const rl=REAL.events.filter(e=>e.status==='live'&&fil(e));const rp=REAL.events.filter(e=>e.status==='pre'&&fil(e)).sort((a,b)=>a.start-b.start);
 let html=feedBanner();if(rl.length)html+=realSection('<span class="dot"></span>Live now',rl,`<span class="badge live">${rl.length} real</span>`);
 if(f!=='live'){const groups={};rp.slice(0,40).forEach(e=>{(groups[dayKey(e.start)]=groups[dayKey(e.start)]||[]).push(e)});for(const [d,l] of Object.entries(groups))html+=realSection(d,l,`<span class="badge">${l.length} fixtures</span>`);if(!rp.length&&!rl.length)html+=`<div class="card empty">No real fixtures in this sport right now.</div>`}
 if(['all','live','football','basketball','tennis','esports'].includes(f))html+=simSections();return html}
function feedHelp(){sheet(`<h2>Turning on the live feed</h2><p class="muted">The published demo can't call outside APIs from the browser, so it shows a real snapshot. The full app ships with a small Rokket feed server. When the app runs on that server, this sportsbook switches to live data by itself.</p>
 <div class="stack" style="gap:8px">${[['1','Get an odds API key','The Odds API: free tier to test, paid plans for production polling.'],['2','Run the Rokket server','node server.js on your VPS with ODDS_API_KEY set. No dependencies.'],['3','Open the app from your domain','Live scores, in-play odds, suspensions and automatic settlement start immediately.']].map(([n,a,b])=>`<div class="card" style="display:flex;gap:12px;padding:12px"><b class="num" style="color:var(--gold-text);font-size:18px">${n}</b><div><b>${a}</b><div class="small muted">${b}</div></div></div>`).join('')}</div>
 <p class="small faint">The server merges prices from many bookmakers, removes their margin, applies Rokket's own margin, pushes updates to every open browser and settles bets when results are final.</p><button class="btn" onclick="closeSheet()">Got it</button>`)}
