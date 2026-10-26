shell();setSide(innerWidth>=1024?'chat':'chat');
crWait();CR.waitEnd=performance.now()+3000;requestAnimationFrame(crTick);
refreshBets();
const H=(location.hash||'').slice(1);go(GAMES[H]&&H!=='sports'?'game/'+H:PAGES[H]?H:'lobby');
setInterval(()=>save(),5000);
