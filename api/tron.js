// GET /api/tron — latest TRON blocks plus TRX Hash draws for the 1, 3 and 5 minute games.
const crypto=require('crypto');
const RPC=process.env.TRON_RPC||'https://api.trongrid.io',KEY=process.env.TRONGRID_API_KEY||'',MOCK=process.env.MOCK==='1';
const MODES=[1,3,5],HIST=12;const draws=new Map();// warm-instance cache; draws never change once made
const digit=h=>{for(let i=h.length-1;i>=0;i--){const c=h[i];if(c>='0'&&c<='9')return +c}return 0};
function pid(start,m){const d=new Date(start);const day=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());const idx=Math.floor((start-day)/(m*60e3))+1;return `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}${m}${String(idx).padStart(4,'0')}`}
async function call(method,body){const r=await fetch(`${RPC}/wallet/${method}`,{method:'POST',headers:{'content-type':'application/json',...(KEY?{'TRON-PRO-API-KEY':KEY}:{})},body:JSON.stringify(body||{})});if(!r.ok)throw new Error(`${method} ${r.status}`);return r.json()}
const toB=b=>({n:b.block_header.raw_data.number,ts:b.block_header.raw_data.timestamp,h:b.blockID});
/* mock chain: deterministic 3s blocks so local tests behave like mainnet */
const mB=n=>({n,ts:(n-80000000)*3000+1792000000000,h:n.toString(16).padStart(16,'0')+crypto.createHash('sha256').update('mock'+n).digest('hex').slice(16)});
const mNow=()=>mB(80000000+Math.floor((Date.now()-1792000000000)/3000));
async function nowBlock(){return MOCK?mNow():toB(await call('getnowblock'))}
async function range(a,b){if(MOCK)return Array.from({length:b-a},(_,i)=>mB(a+i));const r=await call('getblockbylimitnext',{startNum:a,endNum:b});return (r.block||[]).map(toB).sort((x,y)=>x.n-y.n)}
async function drawFor(end,now){const est=now.n-Math.floor((now.ts-end)/3000);for(const w of [[-3,4],[-12,12]]){const bl=await range(est+w[0],est+w[1]);const i=bl.findIndex(b=>b.ts>=end);if(i>0&&bl[i-1].n===bl[i].n-1&&bl[i-1].ts<end)return bl[i]}return null}
async function pool(items,n,fn){const out=[];let k=0;await Promise.all(Array.from({length:n},async()=>{while(k<items.length){const i=k++;out[i]=await fn(items[i])}}));return out}
module.exports=async(req,res)=>{res.setHeader('content-type','application/json');res.setHeader('cache-control','public, s-maxage=2, stale-while-revalidate=4');
  try{const now=await nowBlock();const ends=new Set();for(const m of MODES){const L=m*60e3;const last=Math.floor(now.ts/L)*L;for(let i=0;i<HIST;i++)ends.add(last-i*L+'|'+m)}
    const need=[...ends].map(s=>{const [e,m]=s.split('|').map(Number);return {end:e,m,pid:pid(e-m*60e3,m)}}).filter(x=>!draws.has(x.pid)&&x.end<=now.ts);
    const byEnd=new Map();for(const x of need){if(!byEnd.has(x.end))byEnd.set(x.end,[]);byEnd.get(x.end).push(x)}
    await pool([...byEnd.keys()],5,async end=>{try{const b=await drawFor(end,now);if(b)for(const x of byEnd.get(end))draws.set(x.pid,{pid:x.pid,m:x.m,end,n:b.n,h:b.h,ts:b.ts,num:digit(b.h)})}catch(e){}});
    if(draws.size>2000){const keep=[...draws.values()].sort((a,b)=>b.end-a.end).slice(0,500);draws.clear();keep.forEach(d=>draws.set(d.pid,d))}
    const blocks=await range(now.n-11,now.n+1);
    res.end(JSON.stringify({updated:Date.now(),blocks,draws:[...draws.values()].sort((a,b)=>b.end-a.end).slice(0,MODES.length*HIST*2)}))}
  catch(e){res.statusCode=502;res.end(JSON.stringify({error:e.message}))}};
