/* ===================== Rokket 3D engine (three.js r128) ===================== */
const G3={ease:{outCubic:k=>1-Math.pow(1-k,3),inOut:k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,outBack:k=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2)},lin:k=>k,outBounce:k=>{const n=7.5625,d=2.75;if(k<1/d)return n*k*k;if(k<2/d)return n*(k-=1.5/d)*k+.75;if(k<2.5/d)return n*(k-=2.25/d)*k+.9375;return n*(k-=2.625/d)*k+.984375}}};
G3.ok=()=>{if(!window.THREE)return false;try{const c=document.createElement('canvas');return !!(c.getContext('webgl')||c.getContext('experimental-webgl'))}catch(e){return false}};
G3.envScene=()=>{const s=new THREE.Scene();const c=document.createElement('canvas');c.width=8;c.height=256;const x=c.getContext('2d');const gr=x.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#5A4CA0');gr.addColorStop(.45,'#1E1648');gr.addColorStop(1,'#05030C');x.fillStyle=gr;x.fillRect(0,0,8,256);
 s.add(new THREE.Mesh(new THREE.SphereGeometry(50,24,12),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.BackSide})));
 const panel=(col,p,w,h)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide}));m.position.set(...p);m.lookAt(0,0,0);s.add(m)};
 panel(0xA8A2B8,[0,35,0],26,26);panel(0xC9A070,[28,10,18],12,20);panel(0x7E6CC0,[-28,8,-12],12,20);panel(0x8A8698,[0,6,-30],24,6);return s};
G3.make=(el,o={})=>{const R=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 R.setPixelRatio(Math.min(devicePixelRatio||1,o.dpr||1.75));R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=o.exposure||1.05;
 if(o.shadows!==false){R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap}
 R.domElement.className='full';R.domElement.style.touchAction='manipulation';el.appendChild(R.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(o.bg||'#140E30');if(o.fog)scene.fog=new THREE.Fog(o.fog[0],o.fog[1],o.fog[2]);
 const cam=new THREE.PerspectiveCamera(o.fov||45,1,.1,o.far||600);cam.position.set(...(o.pos||[0,6,12]));const tgt=new THREE.Vector3(...(o.target||[0,0,0]));cam.lookAt(tgt);
 const pm=new THREE.PMREMGenerator(R);const envRT=pm.fromScene(G3.envScene(),.04);scene.environment=envRT.texture;pm.dispose();
 scene.add(new THREE.HemisphereLight(0xC8B8FF,0x1A1030,o.hemi??.35));
 const key=new THREE.DirectionalLight(0xFFF1DD,o.key??1.25);key.position.set(...(o.keyPos||[5,12,8]));if(o.shadows!==false){key.castShadow=true;key.shadow.mapSize.set(1024,1024);const sc=key.shadow.camera;const S=o.shadowSize||12;sc.left=-S;sc.right=S;sc.top=S;sc.bottom=-S;sc.near=1;sc.far=60;key.shadow.bias=-.0006;key.shadow.normalBias=.02}scene.add(key);scene.add(key.target);
 const rim=new THREE.PointLight(0x8A6BFF,o.rim??1.1,50);rim.position.set(-8,6,-6);scene.add(rim);
 const warm=new THREE.PointLight(0xFFB347,o.warm??.7,40);warm.position.set(8,4,6);scene.add(warm);
 const ctx={R,scene,cam,tgt,key,rim,warm,el,upd:new Set(),t:0,alive:true,raf:0,camBase:null};
 ctx.dir=cam.position.clone().sub(tgt).normalize();ctx.fit=o.fit||null;
 const refit=()=>{if(!ctx.fit)return;const f=Math.tan(cam.fov*Math.PI/360);const d=Math.max((ctx.fit[1]/2)/f,(ctx.fit[0]/2)/(f*cam.aspect))+(ctx.fit[2]||0);cam.position.copy(tgt).addScaledVector(ctx.dir,d);cam.lookAt(tgt)};ctx.refit=refit;
 const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();refit();o.onResize&&o.onResize(w,h,ctx)};ctx.resize=resize;
 const ro=new ResizeObserver(resize);ro.observe(el);resize();
 let last=performance.now(),shake=0;
 const loop=now=>{if(!ctx.alive)return;const dt=Math.min(.1,(now-last)/1000);last=now;ctx.t+=dt;for(const f of [...ctx.upd])f(dt,ctx.t,now);
  if(shake>0){shake=Math.max(0,shake-dt*1.6);const p=cam.position.clone();cam.position.x+=(Math.random()-.5)*shake;cam.position.y+=(Math.random()-.5)*shake;R.render(scene,cam);cam.position.copy(p)}else R.render(scene,cam);ctx.raf=requestAnimationFrame(loop)};
 ctx.raf=requestAnimationFrame(loop);
 ctx.add=f=>{ctx.upd.add(f);return ()=>ctx.upd.delete(f)};
 ctx.shake=a=>{shake=Math.max(shake,a||.35)};
 ctx.tween=(dur,fn,ease=G3.ease.outCubic)=>new Promise(res=>{if(!ctx.alive)return res();let t=0;const off=ctx.add(dt=>{t+=dt;const k=Math.min(1,t/dur);fn(ease(k),k);if(k>=1){off();res()}})});
 ctx.wait=s=>new Promise(res=>{let t=0;const off=ctx.add(dt=>{t+=dt;if(t>=s){off();res()}});if(!ctx.alive)res()});
 ctx.pick=(e,objs)=>{const r=R.domElement.getBoundingClientRect();const m=new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);const rc=new THREE.Raycaster();rc.setFromCamera(m,cam);return rc.intersectObjects(objs,true)[0]||null};
 ctx.toScreen=v=>{const p=v.clone().project(cam);const r=R.domElement.getBoundingClientRect();return {x:(p.x+1)/2*r.width,y:(1-p.y)/2*r.height}};
 ctx.dispose=()=>{ctx.alive=false;cancelAnimationFrame(ctx.raf);ro.disconnect();scene.traverse(ob=>{if(ob.geometry)ob.geometry.dispose();if(ob.material)(Array.isArray(ob.material)?ob.material:[ob.material]).forEach(m=>{for(const k in m){const v=m[k];if(v&&v.isTexture&&!(v.userData&&v.userData.keep))v.dispose()}m.dispose()})});envRT.dispose();R.dispose();try{R.forceContextLoss()}catch(e){}R.domElement.remove()};
 return ctx};
/* ---------- materials, textures, shapes ---------- */
G3.lin=c=>new THREE.Color(c).convertSRGBToLinear();
G3.std=(color,o={})=>{const m=G3._std(color,o);m.color.convertSRGBToLinear();m.emissive&&m.emissive.convertSRGBToLinear();return m};
G3._std=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:o.r??.45,metalness:o.m??0,emissive:o.e??0,emissiveIntensity:o.ei??1,transparent:o.op!=null,opacity:o.op??1,map:o.map||null,envMapIntensity:o.env??.7,side:o.side||THREE.FrontSide,flatShading:!!o.flat});
G3.glow=(color,op=1)=>new THREE.MeshBasicMaterial({color:G3.lin(color),transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false});
G3.tex=(w,h,draw,keep)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;t.userData=t.userData||{};if(keep)t.userData.keep=true;t.canvas=c;return t};
G3.rrect=(w,h,r)=>{const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s};
G3.rbox=(w,h,d,r=.08,seg=3)=>{r=Math.min(r,w/2.2,h/2.2,d/2.2);const g=new THREE.ExtrudeGeometry(G3.rrect(w-2*r,h-2*r,Math.max(.0001,r*.6)),{depth:Math.max(.0001,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:seg,curveSegments:seg*2});g.center();g.computeVertexNormals();return g};
G3.rr=(x,_x,X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()};
G3.label=(text,o={})=>{const W=o.w||256,H=o.h||96;let cur=null;const t=G3.tex(W,H,()=>{});const paint=s=>{if(s===cur)return;cur=s;const x=t.canvas.getContext('2d');x.clearRect(0,0,W,H);if(o.bg){x.fillStyle=o.bg;G3.rr(x,x,4,4,W-8,H-8,o.radius??24);x.fill();if(o.border){x.lineWidth=4;x.strokeStyle=o.border;x.stroke()}}x.fillStyle=o.color||'#F4F1FF';x.font=`${o.weight||700} ${o.size||48}px ${o.font||'"Chakra Petch",monospace'}`;x.textAlign='center';x.textBaseline='middle';x.fillText(s,W/2,H/2+2);t.needsUpdate=true};paint(text);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,depthTest:o.depthTest??true}));const sc=o.scale||1;sp.scale.set(sc*W/H,sc,1);sp.set=paint;sp.renderOrder=o.order||0;return sp};
G3.ground=(ctx,o={})=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(o.size||80,o.size||80),new THREE.ShadowMaterial({opacity:o.op??.35}));m.rotation.x=-Math.PI/2;m.position.y=o.y||0;m.receiveShadow=true;ctx.scene.add(m);return m};
G3.cast=(o,c=true,r=true)=>{o.traverse(m=>{if(m.isMesh){m.castShadow=c;m.receiveShadow=r}});return o};
/* ---------- particles ---------- */
G3.burst=(ctx,pos,o={})=>{const n=o.n||80,cols=(o.colors||['#FFC23D','#FF9A1F','#FF5470','#ffffff']).map(c=>new THREE.Color(c));const geo=new THREE.BufferGeometry(),P=new Float32Array(n*3),C=new Float32Array(n*3),V=[];
 for(let i=0;i<n;i++){P[i*3]=pos.x;P[i*3+1]=pos.y;P[i*3+2]=pos.z;const c=cols[i%cols.length];C[i*3]=c.r;C[i*3+1]=c.g;C[i*3+2]=c.b;const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),s=(o.speed||5)*(.4+Math.random()*.8);V.push(new THREE.Vector3(Math.sin(ph)*Math.cos(th)*s,Math.abs(Math.cos(ph))*s*(o.up??1)+(o.lift||0),Math.sin(ph)*Math.sin(th)*s))}
 geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('color',new THREE.BufferAttribute(C,3));
 const mat=new THREE.PointsMaterial({map:G3.dot(),alphaTest:.01,size:o.size||.18,vertexColors:true,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true});const pts=new THREE.Points(geo,mat);ctx.scene.add(pts);let life=o.life||1.4,t=0;
 const off=ctx.add(dt=>{t+=dt;for(let i=0;i<n;i++){V[i].y-=(o.g??9)*dt;V[i].multiplyScalar(1-dt*(o.drag??.8));P[i*3]+=V[i].x*dt;P[i*3+1]+=V[i].y*dt;P[i*3+2]+=V[i].z*dt;if(o.floor!=null&&P[i*3+1]<o.floor){P[i*3+1]=o.floor;V[i].y*=-.4}}geo.attributes.position.needsUpdate=true;mat.opacity=Math.max(0,1-t/life);if(t>=life){off();ctx.scene.remove(pts);geo.dispose();mat.dispose()}});return pts};
G3.dot=()=>G3._dot||(G3._dot=G3.tex(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.4,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)},true));
G3.stars=(n,spread,size=.2)=>{const g=new THREE.BufferGeometry(),P=new Float32Array(n*3),C=new Float32Array(n*3);for(let i=0;i<n;i++){P[i*3]=(Math.random()-.5)*spread;P[i*3+1]=(Math.random()-.5)*spread;P[i*3+2]=-Math.random()*spread*.6-5;const c=new THREE.Color().setHSL(.68+Math.random()*.15,.5,.75+Math.random()*.25);C[i*3]=c.r;C[i*3+1]=c.g;C[i*3+2]=c.b}g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));return new THREE.Points(g,new THREE.PointsMaterial({map:G3.dot(),size,vertexColors:true,transparent:true,opacity:.95,depthWrite:false}))};
/* ---------- characters ---------- */
G3.person=(ctx,o={})=>{const g=new THREE.Group();const skin=G3.std(o.skin||0xD9A47E,{r:.65}),shirt=G3.std(0xF2EFFA,{r:.75}),vest=G3.std(o.vest||0x3B2A92,{r:.5,m:.1}),hairM=G3.std(o.hair||0x1B1222,{r:.85}),gold=G3.std(0xFFC23D,{r:.25,m:.9}),dark=G3.std(0x0B0818,{r:.25}),white=G3.std(0xffffff,{r:.3});
 const torso=new THREE.Group();g.add(torso);
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.6,.5,1.45,28),shirt);body.position.y=.72;torso.add(body);
 const sh=new THREE.Mesh(new THREE.SphereGeometry(.6,28,14,0,Math.PI*2,0,Math.PI/2),shirt);sh.position.y=1.44;sh.scale.y=.42;torso.add(sh);
 const v=new THREE.Mesh(new THREE.CylinderGeometry(.625,.52,1.3,28,1,true,.42,Math.PI*2-.84),vest);v.position.y=.7;torso.add(v);
 const vs=new THREE.Mesh(new THREE.SphereGeometry(.625,28,14,.42,Math.PI*2-.84,0,Math.PI/2),vest);vs.position.y=1.35;vs.scale.y=.42;torso.add(vs);
 for(const s of [-1,1]){const lap=new THREE.Mesh(new THREE.BoxGeometry(.06,.9,.04),vest);lap.position.set(.2*s,.95,.52);lap.rotation.z=-.25*s;torso.add(lap)}
 for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),gold);b.position.set(0,.35+i*.22,.52);torso.add(b)}
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,.25,16),skin);neck.position.y=1.62;torso.add(neck);
 const bow=new THREE.Group();for(const s of [-1,1]){const c=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),o.tie?G3.std(o.tie,{r:.3}):gold);c.rotation.z=s*Math.PI/2;c.position.x=s*.09;bow.add(c)}bow.add(new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),o.tie?G3.std(o.tie):gold));bow.position.set(0,1.53,.27);torso.add(bow);
 const head=new THREE.Group();head.position.y=2.08;torso.add(head);
 const skull=new THREE.Mesh(new THREE.SphereGeometry(.44,32,24),skin);skull.scale.set(1,1.08,1);head.add(skull);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.465,32,16,0,Math.PI*2,0,Math.PI*.52),hairM);hair.rotation.x=-.32;hair.position.set(0,.06,-.03);head.add(hair);
 if(o.bun){const bn=new THREE.Mesh(new THREE.SphereGeometry(.2,16,12),hairM);bn.position.set(0,.32,-.32);head.add(bn)}
 if(o.long){const lh=new THREE.Mesh(new THREE.CylinderGeometry(.42,.5,.7,24,1,true,Math.PI*.62,Math.PI*.76),hairM);lh.position.set(0,-.2,-.04);head.add(lh)}
 const eyes=[];for(const s of [-1,1]){const e=new THREE.Group();const w=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),white);const p=new THREE.Mesh(new THREE.SphereGeometry(.045,12,10),dark);p.position.z=.045;e.add(w);e.add(p);e.position.set(.15*s,.05,.38);head.add(e);eyes.push(e);
  const br=new THREE.Mesh(new THREE.BoxGeometry(.14,.025,.03),hairM);br.position.set(.15*s,.17,.4);br.rotation.z=-.12*s;head.add(br);
  const ear=new THREE.Mesh(new THREE.SphereGeometry(.09,12,10),skin);ear.position.set(.44*s,0,0);ear.scale.set(.6,1,.8);head.add(ear)}
 const nose=new THREE.Mesh(new THREE.SphereGeometry(.06,12,10),skin);nose.position.set(0,-.04,.44);head.add(nose);
 const mouth=new THREE.Mesh(new THREE.TorusGeometry(.1,.022,8,20,Math.PI),G3.std(0x7A2A3A,{r:.6}));mouth.position.set(0,-.17,.39);mouth.rotation.z=Math.PI;head.add(mouth);
 const arm=s=>{const sh=new THREE.Group();sh.position.set(.68*s,1.38,0);torso.add(sh);const up=new THREE.Mesh(new THREE.CylinderGeometry(.13,.11,.72,14),shirt);up.position.y=-.36;sh.add(up);const cuffV=new THREE.Mesh(new THREE.SphereGeometry(.15,14,10),vest);sh.add(cuffV);
  const el=new THREE.Group();el.position.y=-.72;sh.add(el);const lo=new THREE.Mesh(new THREE.CylinderGeometry(.11,.09,.66,14),shirt);lo.position.y=-.33;el.add(lo);const hand=new THREE.Mesh(new THREE.SphereGeometry(.12,14,12),skin);hand.position.y=-.72;hand.scale.set(1,1.2,.8);el.add(hand);
  sh.rotation.set(-.55,0,.12*s);el.rotation.x=-1.05;return {sh,el,hand}};
 const L=arm(-1),Rt=arm(1);G3.cast(g);
 const P={g,torso,head,eyes,mouth,L,R:Rt,look:new THREE.Vector3(0,2,8),busy:false};
 let blinkT=2+Math.random()*3;
 P.off=ctx.add((dt,t)=>{torso.scale.y=1+Math.sin(t*2.1)*.008;head.rotation.y+=((Math.atan2(P.look.x-g.position.x,P.look.z-g.position.z)-g.rotation.y)*.35-head.rotation.y)*dt*3;head.rotation.x=Math.sin(t*.9)*.03;
  blinkT-=dt;if(blinkT<0){eyes.forEach(e=>e.scale.y=.1);if(blinkT<-.12){eyes.forEach(e=>e.scale.y=1);blinkT=2+Math.random()*4}}
  if(!P.busy){L.sh.rotation.x+=(-.55+Math.sin(t*1.3)*.03-L.sh.rotation.x)*dt*4;Rt.sh.rotation.x+=(-.55+Math.sin(t*1.3+1)*.03-Rt.sh.rotation.x)*dt*4;L.el.rotation.x+=(-1.05-L.el.rotation.x)*dt*4;Rt.el.rotation.x+=(-1.05-Rt.el.rotation.x)*dt*4;L.sh.rotation.z+=(-.12-L.sh.rotation.z)*dt*4;Rt.sh.rotation.z+=(.12-Rt.sh.rotation.z)*dt*4}});
 P.gesture=async(kind)=>{P.busy=true;const a=Rt,b=L;try{
  if(kind==='deal'){await ctx.tween(.18,k=>{a.sh.rotation.x=-.55-k*.6;a.el.rotation.x=-1.05+k*.5;a.sh.rotation.z=.12-k*.35});await ctx.tween(.2,k=>{a.sh.rotation.x=-1.15+k*.6;a.el.rotation.x=-.55-k*.5;a.sh.rotation.z=-.23+k*.35})}
  else if(kind==='spin'){await ctx.tween(.35,k=>{a.sh.rotation.x=-.55-k*1.6;a.el.rotation.x=-1.05+k*.9;a.sh.rotation.z=.12+k*.3});await ctx.tween(.45,k=>{a.sh.rotation.x=-2.15+k*1.6;a.el.rotation.x=-.15-k*.9;a.sh.rotation.z=.42-k*.3},G3.ease.inOut)}
  else if(kind==='cheer'){await ctx.tween(.3,k=>{a.sh.rotation.x=-.55-k*2.2;b.sh.rotation.x=-.55-k*2.2;a.el.rotation.x=-1.05+k*.85;b.el.rotation.x=-1.05+k*.85;a.sh.rotation.z=.12+k*.4;b.sh.rotation.z=-.12-k*.4;P.mouth.scale.set(1+k*.4,1+k*.6,1)});await ctx.wait(.6);await ctx.tween(.4,k=>{a.sh.rotation.x=-2.75+k*2.2;b.sh.rotation.x=-2.75+k*2.2;a.el.rotation.x=-.2-k*.85;b.el.rotation.x=-.2-k*.85;a.sh.rotation.z=.52-k*.4;b.sh.rotation.z=-.52+k*.4;P.mouth.scale.set(1.4-k*.4,1.6-k*.6,1)})}
  else if(kind==='sad'){await ctx.tween(.3,k=>{P.head.rotation.z=k*.15;P.mouth.rotation.z=Math.PI-k*Math.PI});await ctx.wait(.6);await ctx.tween(.3,k=>{P.head.rotation.z=.15-k*.15;P.mouth.rotation.z=k*Math.PI})}
  else if(kind==='wave'){await ctx.tween(.3,k=>{a.sh.rotation.x=-.55-k*1.9;a.el.rotation.x=-1.05+k*.4;a.sh.rotation.z=.12+k*.6});for(let i=0;i<3;i++){await ctx.tween(.16,k=>{a.el.rotation.z=k*.5});await ctx.tween(.16,k=>{a.el.rotation.z=.5-k*.5})}await ctx.tween(.3,k=>{a.sh.rotation.x=-2.45+k*1.9;a.el.rotation.x=-.65-k*.4;a.sh.rotation.z=.72-k*.6})}
  else if(kind==='point'){await ctx.tween(.25,k=>{a.sh.rotation.x=-.55-k*.9;a.el.rotation.x=-1.05+k*1;a.sh.rotation.z=.12-k*.5});await ctx.wait(.5)}
 }finally{P.busy=false}};
 return P};
/* astronaut / mascot for Ascend */
G3.astro=(ctx)=>{const g=new THREE.Group();const suit=G3.std(0xF4F1FF,{r:.5}),vis=G3.std(0x1A1240,{r:.05,m:.6,env:2}),gold=G3.std(0xFFC23D,{r:.3,m:.8}),vio=G3.std(0x8A6BFF,{r:.4});
 const body=new THREE.Mesh(G3.rbox(.7,.75,.5,.18),suit);body.position.y=.65;g.add(body);const pack=new THREE.Mesh(G3.rbox(.55,.6,.25,.08),vio);pack.position.set(0,.7,-.35);g.add(pack);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.38,28,20),suit);head.position.y=1.3;g.add(head);const visor=new THREE.Mesh(new THREE.SphereGeometry(.3,28,18,-.9,1.8,.7,1.2),vis);visor.position.set(0,1.3,.12);g.add(visor);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.32,.04,8,24),gold);ring.position.y=1.02;ring.rotation.x=Math.PI/2;g.add(ring);
 const legs=[],arms=[];for(const s of [-1,1]){const l=new THREE.Mesh(G3.rbox(.24,.42,.26,.1),suit);l.position.set(.18*s,.2,0);g.add(l);legs.push(l);const a=new THREE.Mesh(G3.rbox(.18,.5,.2,.08),suit);a.position.set(.45*s,.7,0);a.rotation.z=.15*s;g.add(a);arms.push(a)}
 const ant=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.25),gold);ant.position.set(.2,1.72,0);g.add(ant);const tip=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),G3.std(0xFF5470,{e:0xFF5470,ei:.8}));tip.position.set(.2,1.86,0);g.add(tip);
 G3.cast(g);const A={g,arms,legs};A.off=ctx.add((dt,t)=>{arms[0].rotation.z=-.15-Math.sin(t*3)*.08;arms[1].rotation.z=.15+Math.sin(t*3)*.08;tip.material.emissiveIntensity=.5+Math.sin(t*6)*.5});return A};
/* voxel frog for Hop */
G3.frog=(ctx)=>{const g=new THREE.Group();const green=G3.std(0x6FDB5E,{r:.55}),dg=G3.std(0x3E9A35,{r:.6}),white=G3.std(0xffffff,{r:.3}),black=G3.std(0x0B0818,{r:.2}),pink=G3.std(0xFF8FA3,{r:.6});
 const body=new THREE.Mesh(G3.rbox(.9,.6,.95,.18),green);body.position.y=.38;g.add(body);const belly=new THREE.Mesh(G3.rbox(.7,.3,.5,.12),G3.std(0xC8F5A8,{r:.6}));belly.position.set(0,.3,.3);g.add(belly);
 for(const s of [-1,1]){const eye=new THREE.Mesh(G3.rbox(.3,.3,.3,.1),green);eye.position.set(.25*s,.8,.25);g.add(eye);const w=new THREE.Mesh(new THREE.SphereGeometry(.12,14,10),white);w.position.set(.25*s,.84,.39);g.add(w);const p=new THREE.Mesh(new THREE.SphereGeometry(.065,12,10),black);p.position.set(.25*s,.85,.49);g.add(p);
  const leg=new THREE.Mesh(G3.rbox(.25,.22,.42,.08),dg);leg.position.set(.48*s,.15,-.15);g.add(leg);const cheek=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),pink);cheek.position.set(.36*s,.5,.43);g.add(cheek)}
 const mouth=new THREE.Mesh(new THREE.TorusGeometry(.18,.025,6,16,Math.PI),dg);mouth.position.set(0,.5,.46);mouth.rotation.z=Math.PI;g.add(mouth);G3.cast(g);return {g,body}};
/* ---------- props ---------- */
G3.rocket=()=>{const g=new THREE.Group();const white=G3.std(0xF4F1FF,{r:.25,m:.1}),red=G3.std(0xFF5470,{r:.3}),vio=G3.std(0x6A4FE0,{r:.35}),gold=G3.std(0xFFC23D,{r:.2,m:.9}),dark=G3.std(0x2A2350,{r:.4,m:.5});
 const prof=[[0,-1.25],[.36,-1.25],[.5,-.8],[.54,-.1],[.52,.5],[.44,.95],[0.001,.95]].map(p=>new THREE.Vector2(p[0],p[1]));const body=new THREE.Mesh(new THREE.LatheGeometry(prof,40),white);g.add(body);
 const nose=new THREE.Mesh(new THREE.LatheGeometry([[.44,.95],[.36,1.3],[.2,1.6],[0,1.78]].map(p=>new THREE.Vector2(p[0],p[1])),40),red);g.add(nose);
 const band=new THREE.Mesh(new THREE.TorusGeometry(.535,.035,10,40),gold);band.rotation.x=Math.PI/2;band.position.y=-.55;g.add(band);
 const win=new THREE.Mesh(new THREE.SphereGeometry(.2,24,16),G3.std(0x5C9BFF,{r:.05,m:.3,e:0x2A4FA0,ei:.6,env:2}));win.position.set(0,.4,.44);win.scale.z=.5;g.add(win);const wr=new THREE.Mesh(new THREE.TorusGeometry(.21,.035,10,24),gold);wr.position.set(0,.4,.47);g.add(wr);
 const fin=new THREE.Shape();fin.moveTo(0,0);fin.lineTo(.5,-.35);fin.lineTo(.5,-.75);fin.lineTo(0,-.45);for(let i=0;i<3;i++){const f=new THREE.Mesh(new THREE.ExtrudeGeometry(fin,{depth:.06,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2}),i===0?vio:red);f.position.y=-.5;const a=i*Math.PI*2/3+Math.PI;f.rotation.y=a;f.position.x=Math.sin(a)*.45;f.position.z=Math.cos(a)*.45;f.translateZ(-.03);g.add(f)}
 const noz=new THREE.Mesh(new THREE.CylinderGeometry(.28,.36,.25,24,1,true),dark);noz.position.y=-1.36;g.add(noz);
 const flame=new THREE.Group();flame.position.y=-1.5;const f1=new THREE.Mesh(new THREE.ConeGeometry(.3,1.4,20,1,true),G3.glow(0xFF9A1F,.85));f1.rotation.x=Math.PI;f1.position.y=-.7;flame.add(f1);const f2=new THREE.Mesh(new THREE.ConeGeometry(.16,.9,16,1,true),G3.glow(0xFFF3B0,.95));f2.rotation.x=Math.PI;f2.position.y=-.45;flame.add(f2);const f3=new THREE.Mesh(new THREE.ConeGeometry(.42,2.2,20,1,true),G3.glow(0xFF5470,.35));f3.rotation.x=Math.PI;f3.position.y=-1.1;flame.add(f3);g.add(flame);
 const light=new THREE.PointLight(0xFF9A1F,2.2,8);light.position.y=-1.8;g.add(light);G3.cast(g,true,false);flame.traverse(m=>{if(m.isMesh){m.castShadow=false}});return {g,flame,light}};
const CARD_TEX={};
G3.cardTex=(r,s)=>{const k=r+'_'+s;if(CARD_TEX[k])return CARD_TEX[k];const R=['A','2','3','4','5','6','7','8','9','10','J','Q','K'][r],S=['♠','♥','♦','♣'][s],red=s===1||s===2;
 return CARD_TEX[k]=G3.tex(256,360,(x,w,h)=>{x.fillStyle='#FFFFFF';G3.rr(x,x,0,0,w,h,26);x.fill();x.fillStyle=red?'#D21E45':'#16102E';x.font='700 58px "Chakra Petch",monospace';x.textAlign='center';x.fillText(R,40,64);x.font='48px serif';x.fillText(S,40,112);
  x.save();x.translate(w-40,h-64);x.rotate(Math.PI);x.font='700 58px "Chakra Petch",monospace';x.fillText(R,0,0);x.font='48px serif';x.fillText(S,0,48);x.restore();
  if(r>=10){x.fillStyle=red?'rgba(210,30,69,.12)':'rgba(22,16,46,.1)';G3.rr(x,x,64,70,128,220,14);x.fill();x.fillStyle=red?'#D21E45':'#16102E';x.font='800 110px "Bricolage Grotesque",sans-serif';x.fillText(R,w/2,h/2+38)}else{x.font='140px serif';x.fillText(S,w/2,h/2+50)}},true)};
G3.cardBack=()=>CARD_TEX.back||(CARD_TEX.back=G3.tex(256,360,(x,w,h)=>{x.fillStyle='#FFFFFF';G3.rr(x,x,0,0,w,h,26);x.fill();x.fillStyle='#4A30C4';G3.rr(x,x,14,14,w-28,h-28,18);x.fill();x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=6;for(let i=-h;i<w+h;i+=22){x.beginPath();x.moveTo(i,14);x.lineTo(i+h,h);x.stroke()}x.fillStyle='#FFC23D';x.beginPath();x.arc(w/2,h/2,46,0,7);x.fill();x.strokeStyle='#241500';x.lineWidth=10;x.lineCap='round';x.beginPath();x.moveTo(w/2-24,h/2+22);x.quadraticCurveTo(w/2+6,h/2+18,w/2+20,h/2-20);x.stroke()},true));
G3.card=(r,s,faceUp=true)=>{const W=.72,H=1.0;const geo=new THREE.BoxGeometry(W,.012,H);const edge=G3.std(0xEDEAF5,{r:.6});const face=new THREE.MeshStandardMaterial({map:G3.cardTex(r,s),roughness:.35,transparent:true,alphaTest:.5});const back=new THREE.MeshStandardMaterial({map:G3.cardBack(),roughness:.35,transparent:true,alphaTest:.5});
 const m=new THREE.Mesh(geo,[edge,edge,face,back,edge,edge]);m.castShadow=true;m.receiveShadow=true;m.rotation.x=faceUp?0:Math.PI;return m};
G3.setCardFace=(m,r,s)=>{m.material[2].map=G3.cardTex(r,s);m.material[2].needsUpdate=true};
const CHIPC={0.1:'#5C9BFF',1:'#22A37A',5:'#C8233F',10:'#8A6BFF',25:'#FF9A1F',50:'#FF9A1F',100:'#16102E',500:'#FFC23D'};
G3.chip=(v)=>{const c=CHIPC[v]||'#22A37A';const top=G3.tex(128,128,(x,w,h)=>{x.fillStyle=c;x.beginPath();x.arc(64,64,64,0,7);x.fill();x.fillStyle='#fff';for(let i=0;i<8;i++){x.save();x.translate(64,64);x.rotate(i*Math.PI/4);x.fillRect(-7,-64,14,18);x.restore()}x.fillStyle='rgba(255,255,255,.92)';x.beginPath();x.arc(64,64,36,0,7);x.fill();x.fillStyle=c;x.font='700 30px "Chakra Petch",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(v<1?'.1':v,64,66)});
 const side=G3.std(c,{r:.4});const m=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.06,32),[side,new THREE.MeshStandardMaterial({map:top,roughness:.4}),new THREE.MeshStandardMaterial({map:top,roughness:.4})]);m.castShadow=true;m.receiveShadow=true;return m};
G3.table=(ctx,o={})=>{const g=new THREE.Group();const felt=G3.tex(1024,512,(x,w,h)=>{const gr=x.createRadialGradient(w/2,h*.15,40,w/2,h*.4,w*.6);gr.addColorStop(0,o.felt2||'#1C7A5C');gr.addColorStop(1,o.felt||'#0B3B2D');x.fillStyle=gr;x.fillRect(0,0,w,h);
  for(let i=0;i<3500;i++){x.fillStyle=`rgba(255,255,255,${Math.random()*.03})`;x.fillRect(Math.random()*w,Math.random()*h,2,2)}o.paint&&o.paint(x,w,h)});
 const top=new THREE.Mesh(new THREE.CylinderGeometry(7,7,.2,64,1,false,-Math.PI/2,Math.PI),new THREE.MeshStandardMaterial({map:felt,roughness:.95}));top.position.set(0,-.1,-1.4);top.receiveShadow=true;
 const tex=top.geometry.attributes.uv;const pos=top.geometry.attributes.position;for(let i=0;i<pos.count;i++){tex.setXY(i,(pos.getX(i)+7)/14,1-pos.getZ(i)/7)}tex.needsUpdate=true;g.add(top);
 const rail=new THREE.Mesh(new THREE.TorusGeometry(7,.32,16,64,Math.PI),G3.std(0x2A1A0E,{r:.35,m:.1}));rail.rotation.x=-Math.PI/2;rail.rotation.z=Math.PI;rail.position.set(0,.05,-1.4);rail.castShadow=true;g.add(rail);
 const pad=new THREE.Mesh(new THREE.TorusGeometry(7.05,.18,12,64,Math.PI),G3.std(0x1A1238,{r:.7}));pad.rotation.x=-Math.PI/2;pad.rotation.z=Math.PI;pad.position.set(0,.22,-1.4);g.add(pad);
 const back=new THREE.Mesh(new THREE.BoxGeometry(14,.2,1.2),G3.std(0x2A1A0E,{r:.4}));back.position.set(0,-.1,-2);g.add(back);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),G3.std(0x07050F,{r:1,env:.1}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.2;floor.receiveShadow=true;g.add(floor);
 ctx.scene.add(g);return {g,felt}};
G3.slab=(w,d,col)=>{const m=new THREE.Mesh(G3.rbox(w,.18,d,.06),G3.std(col,{r:.5}));m.receiveShadow=true;m.castShadow=true;return m};
