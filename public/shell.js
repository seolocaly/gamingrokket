/* ===================== shell, router, side panel, chat ===================== */
const NI={
 lobby:'<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
 casino:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v3.3M12 17.2v3.3M3.5 12h3.3M17.2 12h3.3"/>',
 originals:'<path d="M5 19c5-.5 9-4 11.5-11"/><path d="M18 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
 table:'<rect x="4" y="5" width="10" height="14" rx="2" transform="rotate(-8 9 12)"/><rect x="10" y="5" width="10" height="14" rx="2" transform="rotate(8 15 12)"/>',
 sports:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5z"/><path d="M12 3.5v4M16 10.5l4-1.5M14.5 15l2.5 3.5M9.5 15L7 18.5M8 10.5L4 9"/>',
 live:'<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
 mybets:'<path d="M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 9h6M9 13h4"/>',
 promos:'<path d="M4 10h16v10H4zM12 10v10M3 7h18v3H3zM12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0"/>',
 vip:'<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
 fairness:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
 wallet:'<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M16 12.5h2M3 10h18"/>',
 profile:'<circle cx="12" cy="8.5" r="4"/><path d="M4 20c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 sound:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
 mute:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
 lottery:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M8.5 9.5h5a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h5"/>',
 search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'};
const ico=(k,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${NI[k]}</svg>`;
let _mk=0;const markSVG=()=>{const id='mkg'+(_mk++);return '<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="'+id+'" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FF9A1F"/><stop offset="1" stop-color="#FFC23D"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="#1C1638"/><path d="M13 50C27 49 38 41 45.5 22" stroke="url(#'+id+')" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M48 5.5l2.6 7.4 7.4 2.6-7.4 2.6L48 25.5l-2.6-7.4-7.4-2.6 7.4-2.6z" fill="#FFC23D"/><circle cx="13" cy="50" r="4.6" fill="#8A6BFF"/></svg>'};
Object.defineProperty(window,'MARK',{get:markSVG});
const WORD='<svg class="word" viewBox="0 0 226 60" aria-label="Rokket"><g fill="none" stroke="#F4F1FF" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 50V10h15a10 10 0 0 1 0 20H5M19 30l10 20"/><ellipse cx="56" cy="30" rx="14" ry="20" stroke="#FFC23D"/><path d="M88 10v40M112 10L90.5 31.5 113 50"/><path d="M126 10v40M150 10l-21.5 21.5L151 50"/><path d="M181 10h-17v40h17M164 30h14"/><path d="M192 10h28M206 10v40"/></g></svg>';
const RAIL=[['Casino',[['lobby','Lobby'],['lottery','TRX Hash'],['originals','Originals'],['table','Tables and slots'],['casino','All casino']]],['Sports',[['sports','Sportsbook'],['live','In-play'],['mybets','My bets']]],['Rewards',[['promos','Promotions'],['vip','VIP club']]],['Account',[['wallet','Wallet'],['fairness','Fairness'],['profile','Profile & limits']]]];
let ROUTE='lobby',SIDE='chat',unmount=null;
function shell(){document.body.insertAdjacentHTML('afterbegin',`<div class="shell" id="shell">
 <aside class="rail"><button class="brand" onclick="go('lobby')">${MARK}${WORD}</button>${RAIL.map(([g,items])=>`<div class="grp">${g}</div>`+items.map(([k,l])=>`<button class="nav" data-nav="${k}" onclick="go('${k}')">${ico(k==='originals'?'originals':k)}${l}${k==='live'?'<span class="tag" id="livecnt"></span>':''}</button>`).join('')).join('')}
 <div class="spacer"></div><div class="card" style="padding:12px;margin-top:14px"><span class="label">Demo mode</span><p class="small muted" style="margin-top:4px">Play money only. Real deposits open after licensing.</p></div></aside>
 <div style="min-width:0;display:flex;flex-direction:column">
 <header class="hdr"><button class="brand" onclick="go('lobby')" aria-label="Rokket home">${MARK}</button><span class="demo">DEMO</span><button class="icobtn hide-sm" onclick="searchSheet()" aria-label="Search games">${ico('search')}</button><span class="spacer"></span>
  <div class="bal"><div class="v">${COIN}<span id="balv">0.00</span></div><button class="dep" onclick="go('wallet')" aria-label="Deposit">+<span>Deposit</span></button></div>
  <button class="icobtn hide-sm" onclick="chatSheet()" aria-label="Live chat">${ico('chat')}</button><button class="icobtn hide-sm" id="sndbtn" onclick="toggleSound()" aria-label="Sound">${ico(S.sound?'sound':'mute')}</button>
  <button class="icobtn" id="avbtn" onclick="S.wallet?go('profile'):connectSheet()" aria-label="Account">${ico('wallet')}</button></header>
 <main class="view" id="view"></main></div>
 <aside class="side" id="side"><div class="side-tabs"><button data-s="slip" onclick="setSide('slip')">Bet slip <span id="slipcnt"></span></button><button data-s="chat" onclick="setSide('chat')">Chat</button></div><div class="side-body" id="sideBody"></div><div class="side-foot" id="sideFoot"></div></aside>
 </div>
 <nav class="tabs" id="tabs">${[['lobby','Lobby'],['casino','Casino'],['sports','Sports'],['mybets','Bets'],['menu','Menu']].map(([k,l])=>`<button data-tab="${k}" onclick="${k==='menu'?'menuSheet()':`go('${k}')`}">${ico(k)}${l}${k==='mybets'?'<span class="cnt" id="opencnt" hidden></span>':''}</button>`).join('')}</nav>
 <div id="toasts" aria-live="polite"></div><canvas id="fx"></canvas><div id="modal"></div>`);
 if(S.wallet)$('#avbtn').classList.add('on');updBal()}
function toggleSound(){S.sound=!S.sound;if(!S.sound)SND.humStop();else SND.init();save();const b=$('#sndbtn');if(b)b.innerHTML=ico(S.sound?'sound':'mute');toast(S.sound?'Sound on':'Sound off')}
function go(r){if(AUTO)AUTO.stop=true;if(unmount){try{unmount()}catch(e){}unmount=null}SND.humStop();ROUTE=r;const v=$('#view');
 const top=r==='game/trx'?'lottery':r.startsWith('game/')?(GAMES[r.slice(5)]?.cat==='originals'?'originals':'table'):r.startsWith('event/')?'sports':r;
 $$('[data-nav]').forEach(b=>b.classList.toggle('on',b.dataset.nav===top));
 const tab=r.startsWith('game/')||['originals','table'].includes(r)?'casino':['live'].includes(r)||r.startsWith('event/')?'sports':r;$$('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
 if(r.startsWith('game/')){const g=r.slice(5);v.innerHTML=gameHead(g)+'<div id="gamebox"></div>'+gameInfo(g);unmount=GAMEVIEWS[g]($('#gamebox'))||null}
 else if(r.startsWith('event/')){v.innerHTML=PAGES.event(r.slice(6))}
 else{v.innerHTML=(PAGES[r]||PAGES.lobby)();PAGES['after_'+r]&&(unmount=PAGES['after_'+r]()||null)}
 const sportsy=['sports','live','mybets'].includes(r)||r.startsWith('event/');if(sportsy&&SIDE!=='slip')setSide('slip');
 $('#shell').classList.toggle('with-side',sportsy||(innerWidth>=1500&&!r.startsWith('game/')));renderSlipBtn();window.scrollTo(0,0)}
function gameHead(g){return `<div class="ghead"><button class="back" onclick="go('${g==='trx'?'lottery':GAMES[g].cat==='originals'?'originals':'table'}')" aria-label="Back">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 5l-7 7 7 7"/></svg>'}</button><span class="gi" style="background:linear-gradient(140deg,${GAMES[g].c[0]},${GAMES[g].c[1]})">${IC[g]}</span><div style="min-width:0"><h1>${GAMES[g].name}</h1><span class="small muted"><b class="num" data-pl="${g}">${fmt(PLAYERS[g],0)}</b> playing · ${GAMES[g].rtp} RTP</span></div><span class="spacer"></span><button class="icobtn" onclick="toggleSound()" aria-label="Sound">${ico(S.sound?'sound':'mute')}</button></div>`}
function gameInfo(g){return `<div class="ginfo"><div class="card stack"><div class="sec-h" style="margin:0"><h3>About ${GAMES[g].name}</h3><span class="badge">${GAMES[g].rtp} RTP</span></div><p class="muted small">${GAMES[g].desc} ${g==='trx'?'Results come from TRON block hashes, not from your seed pair; check any draw in Fairness or on Tronscan.':'Every result is generated from your seed pair and can be checked in Fairness. Press <kbd class="num">Space</kbd> to bet on a keyboard.'}</p>${g==='trx'?'':fairLine()}</div>
 <div class="card"><div class="sec-h"><h3>Your recent ${GAMES[g].name} bets</h3></div><div class="tblwrap"><table class="tbl"><thead><tr><th>Time</th><th class="r">Bet</th><th class="r">Multiplier</th><th class="r">Payout</th></tr></thead><tbody id="myg">${myRows(g)}</tbody></table></div></div></div>`}
function myRows(g){const h=S.hist.filter(x=>x.game===g).slice(0,8);return h.length?h.map(x=>`<tr><td class="muted">${new Date(x.t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</td><td class="r num">${fmt(x.bet)}</td><td class="r num ${mc(x.mult)}">${fx(x.mult)}</td><td class="r num ${x.pay>x.bet?'pos':'neg'}">${fmt(x.pay)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">No bets yet</td></tr>'}
/* key: space to bet */
addEventListener('keydown',e=>{if(e.code!=='Space'||!ROUTE.startsWith('game/'))return;const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='SELECT'||t.tagName==='TEXTAREA'||t.tagName==='BUTTON'))return;const b=$('#gbtn');if(b&&!b.disabled){e.preventDefault();b.click()}});
/* ---------- side panel ---------- */
function setSide(s){SIDE=s;$$('[data-s]').forEach(b=>b.classList.toggle('on',b.dataset.s===s));renderSide()}
function renderSide(){const b=$('#sideBody'),f=$('#sideFoot');if(!b)return;if(SIDE==='chat'){b.innerHTML=S_chat();f.innerHTML=chatInput();b.scrollTop=b.scrollHeight;wireChat()}else{b.innerHTML=slipBody();f.innerHTML=slipFoot();wireSlip()}
 $('#slipcnt').textContent=S.slip.length?`(${S.slip.length})`:''}
/* ---------- chat ---------- */
const CHAT=[];const CHATLINES=['gm everyone','who caught that 40× on Rokket','cashed at 2.1× again, safe and boring','mines on 3 is the move','anyone watching the Lakers game','vip gold finally','drop on 16 rows high risk is wild','rakeback hit, thanks Rokket','that burn at 1.00× hurt','hop on hard just paid 9×','keno 7 picks, 5 hits, nice','roulette black six times in a row','race leaderboard is tight this week','verified my last 50 dice rolls, all clean','withdrawal landed in under a minute','first time on blackjack here','gl all','Arsenal holding on','what auto cash out do you use','limbo 100× target, pray for me'];
function chatMsg(n,t,lvl){CHAT.push({n,t,lvl,id:Math.random()});if(CHAT.length>60)CHAT.shift();if(SIDE==='chat'&&$('#sideBody')){const b=$('#sideBody');const near=b.scrollHeight-b.scrollTop-b.clientHeight<80;b.insertAdjacentHTML('beforeend',msgHTML(CHAT[CHAT.length-1]));if(b.children.length>60)b.firstElementChild.remove();if(near)b.scrollTop=b.scrollHeight}const m=$('#mchat');if(m){m.insertAdjacentHTML('beforeend',msgHTML(CHAT[CHAT.length-1]));m.scrollTop=m.scrollHeight}}
const msgHTML=m=>`<div class="msg">${avatar(m.n)}<div><span class="lvl">${m.lvl}</span><b style="${m.me?'color:var(--gold-text)':''}">${esc(m.n)}</b> <span class="muted">${esc(m.t)}</span></div></div>`;
const S_chat=()=>`<div class="badge" style="align-self:flex-start"><span class="dot"></span>${fmt(2100+rnd(400),0)} online · English</div>`+CHAT.map(msgHTML).join('');
const chatInput=()=>`<form class="chatin" onsubmit="event.preventDefault();sendChat(this)"><input id="chatI" maxlength="160" placeholder="Say something" autocomplete="off"><button class="btn primary sm" type="submit">Send</button></form><span class="small faint">Be kind. No promotion or sharing of personal details.</span>`;
function sendChat(f){const i=f.querySelector('input');const t=i.value.trim();if(!t)return;CHAT.push({n:S.user,t,lvl:vipTier().n.toUpperCase(),me:1});i.value='';renderSide();const m=$('#mchat');if(m){m.innerHTML=CHAT.map(msgHTML).join('');m.scrollTop=m.scrollHeight}}
function wireChat(){}
for(let i=0;i<14;i++)CHAT.push({n:pickr(NAMES),t:pickr(CHATLINES),lvl:pickr(['BRONZE','SILVER','GOLD','PLAT'])});
(function chatLoop(){chatMsg(pickr(NAMES),pickr(CHATLINES),pickr(['BRONZE','SILVER','GOLD','PLAT','DIAMOND']));setTimeout(chatLoop,2500+rnd(5000))})();
/* ---------- sheets ---------- */
function menuSheet(){sheet(`<h2>Menu</h2><div class="stack" style="gap:6px">${RAIL.map(([g,items])=>`<span class="label" style="margin-top:6px">${g}</span>`+items.map(([k,l])=>`<button class="wopt" onclick="closeSheet();go('${k}')">${ico(k==='originals'?'originals':k)}${l}</button>`).join('')).join('')}
 <span class="label" style="margin-top:6px">Community</span><button class="wopt" onclick="chatSheet()">${ico('chat')}Live chat</button><button class="wopt" onclick="searchSheet()">${ico('search')}Search games</button><button class="wopt" onclick="toggleSound();closeSheet()">${ico(S.sound?'sound':'mute')}Sound: ${S.sound?'on':'off'}</button></div>`)}
function chatSheet(){sheet(`<h2>Live chat</h2><div id="mchat" style="display:flex;flex-direction:column;gap:10px;max-height:50vh;overflow:auto">${CHAT.map(msgHTML).join('')}</div>${chatInput()}`);const m=$('#mchat');m.scrollTop=m.scrollHeight}
function searchSheet(){sheet(`<h2>Search games</h2><label class="search">${ico('search')}<input id="sq" placeholder="Rokket, mines, blackjack…" autocomplete="off"></label><div class="gtiles" id="sres" style="grid-template-columns:repeat(3,1fr)">${Object.keys(GAMES).filter(k=>k!=='sports').map(gameTile).join('')}</div>`);
 const i=$('#sq');i.focus();i.oninput=()=>{const q=i.value.toLowerCase();$('#sres').innerHTML=Object.keys(GAMES).filter(k=>k!=='sports'&&(GAMES[k].name+' '+GAMES[k].tag).toLowerCase().includes(q)).map(gameTile).join('')||'<p class="muted">No games match.</p>';$$('#sres .gt').forEach(b=>b.addEventListener('click',closeSheet))};$$('#sres .gt').forEach(b=>b.addEventListener('click',closeSheet))}
function connectSheet(){sheet(`<h2>Connect a wallet</h2><p class="muted">Sign in with your wallet. No email, no password, and we never hold your keys.</p>
 <div class="stack" style="gap:8px">${[['MetaMask','#F6851B','M','EVM'],['WalletConnect','#3B99FC','W','EVM · 300+ wallets'],['Trust Wallet','#3375BB','T','EVM'],['TON Connect','#0098EA','T','Telegram'],['Phantom','#AB9FF2','P','Solana']].map(([n,c,l,s])=>`<button class="wopt" onclick="doConnect('${n}')"><i style="background:${c}">${l}</i>${n}<span class="spacer"></span><span class="small muted">${s}</span></button>`).join('')}</div>
 <p class="small faint">Demo: the connection is simulated. Production signs in with SIWE (EIP-4361) and TON Connect proofs.</p>`)}
function doConnect(n){sheet(`<div class="stack" style="text-align:center;padding:10px 0"><h2>Waiting for ${n}</h2><p class="muted">Approve the sign-in message in your wallet</p><div class="addr" style="text-align:left;font-size:11.5px">rokket.app wants you to sign in with your account.<br><br>URI: https://rokket.app<br>Version: 1 · Chain ID: 56<br>Nonce: ${randHex(8)}<br>Issued at: ${new Date().toISOString()}</div></div>`);
 setTimeout(()=>{S.wallet={name:n,addr:(n==='TON Connect'?'UQ':n==='Phantom'?'7x':'0x')+randHex(20)};$('#avbtn').classList.add('on');save();closeSheet();toast(`Connected ${n}`,'w');SND.cash();if(['profile','wallet'].includes(ROUTE))go(ROUTE)},1500)}
const short=a=>a.slice(0,6)+'…'+a.slice(-4);
function shareSheet(g,m,pay){$$('.bigwin').forEach(e=>e.remove());sheet(`<div class="share"><span class="badge gold" style="align-self:flex-start">Big win</span><div class="x">${fx(m)}</div><b style="font-size:20px;font-family:var(--font-display)">${GAMES[g]?.name||g} · +${fmt(pay)} USDT</b><span style="color:#D8D0F6;font-size:13px">${esc(S.user)} on Rokket · provably fair</span><div style="display:flex;justify-content:space-between;align-items:end;margin-top:16px;gap:12px"><span class="small" style="color:#D8D0F6">Use code <b style="color:var(--ink)">${esc(S.user.toUpperCase())}</b> for a 100% first-deposit match</span>${MARK.replace('class="mark"','style="width:40px;height:40px;flex:0 0 auto"')}</div></div>
 <div class="grid2"><button class="btn" onclick="copyText('https://rokket.app/w/${randHex(4)}?r=${esc(S.user)}')">Copy link</button><button class="btn primary" onclick="copyText('https://t.me/share/url?url=https://rokket.app/r/${esc(S.user)}')">Share to Telegram</button></div><button class="btn" onclick="closeSheet()">Keep playing</button>`)}
