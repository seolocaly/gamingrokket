// Shared odds helpers for Vercel functions (files starting with _ are not routes).
const API='https://api.the-odds-api.com/v4';
const env=(k,d)=>process.env[k]??d;
const CFG={key:env('ODDS_API_KEY',''),regions:env('REGIONS','eu'),markets:env('MARKETS','h2h,totals,spreads'),margin:+env('MARGIN',0.05),
  sports:env('SPORTS','soccer_epl,soccer_spain_la_liga,soccer_italy_serie_a,soccer_germany_bundesliga,soccer_france_ligue_one,soccer_uefa_champs_league,basketball_nba,icehockey_nhl').split(',').filter(Boolean),
  tennis:env('TENNIS','1')!=='0',ttl:+env('FEED_TTL',90),mock:env('MOCK','')==='1'};
const SPORTMAP=k=>k.startsWith('soccer')?'football':k.startsWith('basketball')?'basketball':k.startsWith('icehockey')?'hockey':k.startsWith('tennis')?'tennis':k.startsWith('cricket')?'cricket':'other';
const median=a=>{const s=a.slice().sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
function price(outcomes){const med=outcomes.map(([n,ps])=>[n,median(ps)]);if(med.some(([,p])=>!(p>1)))return null;const inv=med.map(([n,p])=>[n,1/p]);const tot=inv.reduce((a,[,q])=>a+q,0);const out={};inv.forEach(([n,q])=>{out[n]=Math.max(1.01,Math.round(100/((q/tot)*(1+CFG.margin)))/100)});return out}
function normalize(ev,sk,title){const home=ev.home_team,away=ev.away_team,h2h={},tot={},spr={};const books=new Set();
  for(const b of ev.bookmakers||[]){books.add(b.key);for(const m of b.markets||[]){
    if(m.key==='h2h')for(const o of m.outcomes)(h2h[o.name]=h2h[o.name]||[]).push(o.price);
    if(m.key==='totals')for(const o of m.outcomes){(tot[o.point]=tot[o.point]||{Over:[],Under:[]})[o.name]?.push(o.price)}
    if(m.key==='spreads')for(const o of m.outcomes){if(o.name===home)(spr[o.point]=spr[o.point]||{h:[],a:[]}).h.push(o.price);else (spr[-o.point]=spr[-o.point]||{h:[],a:[]}).a.push(o.price)}}}
  const out={id:'r'+ev.id,sport:SPORTMAP(sk),league:title||sk,home,away,start:ev.commence_time,status:new Date(ev.commence_time)<=new Date()?'live':'pre',score:null,clock:'',books:[...books]};
  if(h2h[home]&&h2h[away]){const p=price([[home,h2h[home]],[away,h2h[away]],...(h2h.Draw?[['Draw',h2h.Draw]]:[])]);if(p)out.h2h={home:p[home],away:p[away],draw:h2h.Draw?p.Draw:null}}
  const tp=Object.keys(tot).filter(k=>tot[k].Over.length&&tot[k].Under.length);if(tp.length){const pt=tp.sort((a,b)=>tot[b].Over.length-tot[a].Over.length)[0];const p=price([['o',tot[pt].Over],['u',tot[pt].Under]]);if(p)out.totals={point:+pt,over:p.o,under:p.u}}
  const sp=Object.keys(spr).filter(k=>spr[k].h.length&&spr[k].a.length);if(sp.length){const pt=sp.sort((a,b)=>spr[b].h.length-spr[a].h.length)[0];const p=price([['h',spr[pt].h],['a',spr[pt].a]]);if(p)out.spreads={point:+pt,home:p.h,away:p.a}}
  return out}
let quota=null;
async function api(p,params){const u=new URL(API+p);u.searchParams.set('apiKey',CFG.key);for(const [k,v] of Object.entries(params||{}))u.searchParams.set(k,v);const r=await fetch(u);const rem=r.headers.get('x-requests-remaining');if(rem!=null)quota={remaining:+rem,used:+r.headers.get('x-requests-used')};if(!r.ok)throw new Error(`${p} ${r.status}`);return r.json()}
module.exports={CFG,api,normalize,SPORTMAP,getQuota:()=>quota};
