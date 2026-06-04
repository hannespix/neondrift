/* NEONDRIFT – Spiellogik. Siehe CLAUDE.md fuer Architektur. */
(() => {
  "use strict";
  const canvas=document.getElementById('c'), ctx=canvas.getContext('2d');
  const S={MENU:0,PLAY:1,UPGRADE:2,OVER:3,PAUSE:4};
  let state=S.MENU, mode='normal';
  let DPR=Math.min(window.devicePixelRatio||1,2), W=0, H=0, lastT=0;

  let player, obstacles, orbs, powerups, particles, floaters, lasers, stars;
  let score, displayScore, combo, multiplier, best=loadScores();
  function loadScores(){ try{ const r=JSON.parse(localStorage.getItem('neondrift_best')); if(r&&typeof r==='object') return {normal:r.normal||0,hardcore:r.hardcore||0,zen:r.zen||0,daily:r.daily||0,dailyDate:r.dailyDate||''}; }catch(e){} return {normal:0,hardcore:0,zen:0,daily:0,dailyDate:''}; }
  function saveScores(){ try{ localStorage.setItem('neondrift_best',JSON.stringify(best)); }catch(e){} }
  let elapsed, spawnT, orbT, powerupT, difficulty, shake, flash, flashColor, nearGlow, nearCount;
  let level, levelTimer, levelDuration, unlocked, nextUpgradeAt, upStep;
  let bossActive, bossTimer, bossPhaseT, bossNumber, laserSpawnT;
  let banner, effects, shields, invuln, mods, upgradeCounts, lives, commentT, egg67done, egg67T;
  let comboTime=0, comboTimeMax=3.4;                 // Combo-Decay-Timer
  let beatIdx=0, beatPulse=0, spawnQueued=false, orbQueued=false; // Beat-Sync
  let daily=false;                                    // Daily-Challenge aktiv?

  // ---------- Audio ----------
  let actx=null, muted=false, masterGain=null, musicGain=null;
  function ensureCtx(){
    if(actx) return true;
    try{ actx=new (window.AudioContext||window.webkitAudioContext)();
      masterGain=actx.createGain(); masterGain.gain.value=0.9; masterGain.connect(actx.destination);
      musicGain=actx.createGain(); musicGain.gain.value=0.42; musicGain.connect(masterGain);
      return true;
    }catch(e){ actx=null; return false; }
  }
  function unlockAudio(){
    if(!ensureCtx()) return;
    try{ if(actx.state==='suspended') actx.resume();
      const b=actx.createBuffer(1,1,22050), s=actx.createBufferSource(); s.buffer=b; s.connect(actx.destination); s.start(0);
    }catch(e){}
    if(!muted) startMusic();
  }
  ['pointerdown','touchstart','mousedown','keydown','click'].forEach(ev=>window.addEventListener(ev,unlockAudio,{passive:true}));

  function beep(freq,dur,type='sine',vol=0.4,slide=0){
    if(!actx||muted) return;
    try{ const o=actx.createOscillator(), g=actx.createGain();
      o.type=type; o.frequency.setValueAtTime(Math.max(20,freq),actx.currentTime);
      if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),actx.currentTime+dur);
      g.gain.setValueAtTime(vol,actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+dur);
      o.connect(g); g.connect(masterGain); o.start(); o.stop(actx.currentTime+dur);
    }catch(e){}
  }
  const sfxOrb=c=>beep(440+Math.min(c,20)*40,0.12,'triangle',0.32);
  const sfxNear=()=>beep(900,0.07,'sine',0.18,400);
  const sfxStart=()=>{beep(523,0.09,'square',0.3);setTimeout(()=>beep(784,0.12,'square',0.3),90);};
  function sfxCrash(){beep(180,0.5,'sawtooth',0.5,-140);beep(90,0.6,'square',0.4,-50);}
  function duckMusic(dur){ if(!musicGain||!actx) return; const t=actx.currentTime;
    musicGain.gain.cancelScheduledValues(t); musicGain.gain.setValueAtTime(musicGain.gain.value,t);
    musicGain.gain.linearRampToValueAtTime(0.06,t+0.08); musicGain.gain.linearRampToValueAtTime(0.42,t+dur); }
  function sfxGameOver(){ if(!actx||muted) return;
    beep(160,0.45,'sawtooth',0.5,-90);                 // Crash-Boom
    beep(70,0.55,'square',0.4,-25);
    const notes=[[466,160],[415,440],[392,720],[294,1040]]; // absteigend: "wah wah wah waaah"
    notes.forEach(([f,delay],i)=>{ const last=i===notes.length-1;
      setTimeout(()=>{ beep(f,last?0.7:0.34,'sawtooth',0.42,-22); beep(f*0.5,last?0.7:0.34,'square',0.16,-12); }, delay); });
    setTimeout(()=>{ beep(98,0.7,'square',0.4,-40); beep(196,0.7,'triangle',0.18,-30); },1340); // tiefer Schluss-Thud
  }
  function sfxBoss(){beep(140,0.25,'square',0.4,120);beep(70,0.4,'sawtooth',0.35,40);}
  function sfxWin(){beep(523,0.12,'triangle',0.4);setTimeout(()=>beep(784,0.18,'triangle',0.4),110);}
  const sfxWarn=()=>beep(760,0.05,'square',0.12);
  const sfxFire=()=>beep(120,0.35,'sawtooth',0.4,-50);
  const sfxPow=()=>{beep(660,0.08,'square',0.3);setTimeout(()=>beep(990,0.12,'square',0.3),70);};
  const sfxLevel=()=>{beep(523,0.08,'square',0.3);setTimeout(()=>beep(659,0.08,'square',0.3),80);setTimeout(()=>beep(880,0.14,'square',0.3),160);};
  const sfxShieldBreak=()=>beep(300,0.25,'sawtooth',0.35,-150);
  const sfxUpgrade=()=>{beep(440,0.1,'triangle',0.3);setTimeout(()=>beep(660,0.1,'triangle',0.3),90);setTimeout(()=>beep(880,0.16,'triangle',0.35),180);};

  // ---------- Chiptune-Engine (Original-Komposition, loopt in Variationen) ----------
  const BPM=142;
  let musicOn=false, schedTimer=null, step16=0, nextStepTime=0, loopCount=0, secPerStep=60/(BPM*4);
  const midiF=n=>440*Math.pow(2,(n-69)/12);
  // Lead A (C-Dur, heroisch)
  const LEAD1=[
    {s:0,n:72,d:2},{s:2,n:76,d:2},{s:4,n:79,d:3},{s:7,n:77,d:1},{s:8,n:76,d:2},{s:10,n:72,d:2},{s:12,n:74,d:4},
    {s:16,n:74,d:2},{s:18,n:77,d:2},{s:20,n:81,d:3},{s:23,n:79,d:1},{s:24,n:77,d:2},{s:26,n:76,d:2},{s:28,n:72,d:4},
    {s:32,n:72,d:2},{s:34,n:76,d:2},{s:36,n:79,d:2},{s:38,n:84,d:2},{s:40,n:83,d:2},{s:42,n:79,d:2},{s:44,n:76,d:4},
    {s:48,n:74,d:1},{s:49,n:76,d:1},{s:50,n:77,d:2},{s:52,n:79,d:4},{s:56,n:71,d:2},{s:58,n:74,d:2},{s:60,n:72,d:4}
  ];
  const LEAD2=[
    {s:0,n:76,d:1},{s:1,n:79,d:1},{s:2,n:84,d:2},{s:4,n:83,d:2},{s:6,n:79,d:2},{s:8,n:81,d:4},{s:13,n:79,d:1},{s:14,n:77,d:2},
    {s:16,n:77,d:2},{s:18,n:74,d:2},{s:20,n:72,d:2},{s:22,n:74,d:2},{s:24,n:76,d:4},{s:28,n:72,d:4},
    {s:32,n:72,d:2},{s:34,n:79,d:2},{s:36,n:84,d:2},{s:38,n:88,d:2},{s:40,n:86,d:4},{s:44,n:83,d:4},
    {s:48,n:81,d:2},{s:50,n:79,d:2},{s:52,n:77,d:2},{s:54,n:76,d:2},{s:56,n:74,d:2},{s:58,n:72,d:6}
  ];
  // Lead B – NACHTFAHRT (d-Moll, tief, gezogen/dunkel)
  const LEADB1=[
    {s:0,n:62,d:4},{s:4,n:65,d:2},{s:6,n:64,d:2},{s:8,n:62,d:4},{s:12,n:60,d:4},
    {s:16,n:58,d:4},{s:20,n:62,d:2},{s:22,n:65,d:2},{s:24,n:69,d:4},{s:28,n:67,d:4},
    {s:32,n:65,d:2},{s:34,n:67,d:2},{s:36,n:69,d:2},{s:38,n:70,d:2},{s:40,n:69,d:4},{s:44,n:65,d:4},
    {s:48,n:62,d:2},{s:50,n:65,d:2},{s:52,n:69,d:2},{s:54,n:74,d:2},{s:56,n:72,d:4},{s:60,n:69,d:4}
  ];
  const LEADB2=[
    {s:0,n:69,d:2},{s:2,n:70,d:2},{s:4,n:69,d:2},{s:6,n:67,d:2},{s:8,n:65,d:4},{s:12,n:62,d:4},
    {s:16,n:65,d:2},{s:18,n:69,d:2},{s:20,n:74,d:4},{s:24,n:72,d:2},{s:26,n:70,d:2},{s:28,n:69,d:4},
    {s:32,n:74,d:2},{s:34,n:72,d:2},{s:36,n:70,d:2},{s:38,n:69,d:2},{s:40,n:67,d:2},{s:42,n:65,d:2},{s:44,n:62,d:4},
    {s:48,n:64,d:2},{s:50,n:65,d:2},{s:52,n:67,d:2},{s:54,n:69,d:2},{s:56,n:62,d:6}
  ];
  // Lead C – ÜBERTAKTET (A-Dur, hoch, hektisch 16tel)
  const LEADC1=[
    {s:0,n:81,d:1},{s:1,n:78,d:1},{s:2,n:76,d:1},{s:3,n:73,d:1},{s:4,n:76,d:1},{s:5,n:78,d:1},{s:6,n:81,d:2},{s:8,n:83,d:1},{s:9,n:81,d:1},{s:10,n:78,d:2},{s:12,n:76,d:2},{s:14,n:73,d:2},
    {s:16,n:71,d:1},{s:17,n:73,d:1},{s:18,n:76,d:1},{s:19,n:78,d:1},{s:20,n:81,d:2},{s:22,n:78,d:2},{s:24,n:76,d:1},{s:25,n:73,d:1},{s:26,n:71,d:2},{s:28,n:69,d:4},
    {s:32,n:76,d:1},{s:33,n:78,d:1},{s:34,n:81,d:1},{s:35,n:83,d:1},{s:36,n:85,d:2},{s:38,n:83,d:2},{s:40,n:81,d:1},{s:41,n:78,d:1},{s:42,n:76,d:2},{s:44,n:73,d:4},
    {s:48,n:81,d:1},{s:49,n:83,d:1},{s:50,n:81,d:1},{s:51,n:78,d:1},{s:52,n:76,d:2},{s:54,n:73,d:2},{s:56,n:69,d:1},{s:57,n:73,d:1},{s:58,n:76,d:2},{s:60,n:81,d:4}
  ];
  const LEADC2=[
    {s:0,n:76,d:1},{s:1,n:78,d:1},{s:2,n:81,d:2},{s:4,n:78,d:1},{s:5,n:76,d:1},{s:6,n:73,d:2},{s:8,n:76,d:1},{s:9,n:78,d:1},{s:10,n:81,d:1},{s:11,n:83,d:1},{s:12,n:85,d:4},
    {s:16,n:83,d:1},{s:17,n:81,d:1},{s:18,n:78,d:2},{s:20,n:76,d:1},{s:21,n:78,d:1},{s:22,n:81,d:2},{s:24,n:78,d:2},{s:26,n:76,d:2},{s:28,n:73,d:4},
    {s:32,n:81,d:1},{s:33,n:83,d:1},{s:34,n:85,d:2},{s:36,n:88,d:2},{s:38,n:85,d:2},{s:40,n:83,d:1},{s:41,n:81,d:1},{s:42,n:78,d:2},{s:44,n:76,d:4},
    {s:48,n:73,d:1},{s:49,n:76,d:1},{s:50,n:78,d:1},{s:51,n:81,d:1},{s:52,n:83,d:2},{s:54,n:81,d:2},{s:56,n:76,d:4},{s:60,n:69,d:4}
  ];
  const SONGS=[
    {name:'PROLOG',     lead1:LEAD1,  lead2:LEAD2,  bass:[36,45,41,43], chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]], lt:'square',   leadVol:0.16, bassEighths:false, fourFloor:false, hatEvery:2},
    {name:'NACHTFAHRT', lead1:LEADB1, lead2:LEADB2, bass:[38,34,36,33], chords:[[62,65,69],[58,62,65],[60,64,67],[57,60,64]], lt:'sawtooth', leadVol:0.11, bassEighths:true,  fourFloor:false, hatEvery:4},
    {name:'ÜBERTAKTET', lead1:LEADC1, lead2:LEADC2, bass:[45,40,42,38], chords:[[57,61,64],[52,56,59],[54,57,61],[50,54,57]], lt:'square',   leadVol:0.14, bassEighths:false, fourFloor:true,  hatEvery:1}
  ];
  let curSong=0;
  function mVoice(time,freq,dur,type,vol,atk=0.005){
    const o=actx.createOscillator(), g=actx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,time);
    g.gain.setValueAtTime(0.0001,time); g.gain.linearRampToValueAtTime(vol,time+atk);
    g.gain.exponentialRampToValueAtTime(0.0001,time+dur);
    o.connect(g); g.connect(musicGain); o.start(time); o.stop(time+dur+0.02);
  }
  function mNoise(time,dur,vol,hp){
    const len=Math.max(1,Math.floor(actx.sampleRate*dur));
    const buf=actx.createBuffer(1,len,actx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    const src=actx.createBufferSource(); src.buffer=buf;
    const f=actx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp||4000;
    const g=actx.createGain(); g.gain.setValueAtTime(vol,time); g.gain.exponentialRampToValueAtTime(0.001,time+dur);
    src.connect(f); f.connect(g); g.connect(musicGain); src.start(time); src.stop(time+dur);
  }
  function mKick(time){
    const o=actx.createOscillator(), g=actx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(150,time); o.frequency.exponentialRampToValueAtTime(45,time+0.12);
    g.gain.setValueAtTime(0.55,time); g.gain.exponentialRampToValueAtTime(0.001,time+0.16);
    o.connect(g); g.connect(musicGain); o.start(time); o.stop(time+0.18);
  }
  function sfxRiser(){ if(!actx||muted) return; try{
    const o=actx.createOscillator(), g=actx.createGain(); o.type='sawtooth';
    o.frequency.setValueAtTime(180,actx.currentTime); o.frequency.exponentialRampToValueAtTime(1900,actx.currentTime+0.7);
    g.gain.setValueAtTime(0.0001,actx.currentTime); g.gain.linearRampToValueAtTime(0.22,actx.currentTime+0.55); g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+0.82);
    o.connect(g); g.connect(masterGain); o.start(); o.stop(actx.currentTime+0.85);
  }catch(e){} }
  function scheduleStep(step,time){
    const song=SONGS[curSong]||SONGS[0];
    const lead=(loopCount%2===1)?song.lead2:song.lead1;
    const lv=song.leadVol||0.16;
    for(const e of lead) if(e.s===step) mVoice(time,midiF(e.n),e.d*secPerStep*0.92,song.lt,lv);
    const block=Math.floor(step/16), ls=step%16, root=song.bass[block];
    if(song.bassEighths){ if(ls%2===0) mVoice(time,midiF(root),secPerStep*1.5,'triangle',0.27,0.004); } // treibender Achtel-Bass
    else { if(ls%4===0) mVoice(time,midiF(root),secPerStep*2,'triangle',0.30,0.004); else if(ls%4===2) mVoice(time,midiF(root+7),secPerStep*1.4,'triangle',0.16); }
    if(step%2===0){ const ch=song.chords[block]; mVoice(time,midiF(ch[(step/2)%ch.length]+12),secPerStep*0.8,'square',0.06,0.002); }
    if(song.fourFloor){ if(ls%4===0) mKick(time); } else { if(ls===0||ls===8) mKick(time); }
    if(ls===4||ls===12) mNoise(time,0.12,0.16,1800);
    if(state===S.PLAY && ls%(song.hatEvery||2)===0) mNoise(time,0.025,0.05,8000);
    if(loopCount%2===1 && step>=60) mNoise(time,0.04,0.12,5000);
  }
  function scheduler(){
    if(!actx) return;
    if(nextStepTime < actx.currentTime) nextStepTime = actx.currentTime + 0.05; // Resync nach Tab-Wechsel
    while(nextStepTime < actx.currentTime+0.1){
      scheduleStep(step16,nextStepTime);
      nextStepTime+=secPerStep; step16++;
      if(step16>=64){ step16=0; loopCount++; }
    }
  }
  function startMusic(){ if(!actx||musicOn) return; musicOn=true; step16=0; loopCount=0; nextStepTime=actx.currentTime+0.08; schedTimer=setInterval(scheduler,25); }

  // ---------- Haptik ----------
  function vibe(p){ if(navigator.vibrate){ try{ navigator.vibrate(p); }catch(e){} } }

  // ---------- Resize / Input ----------
  function resize(){ DPR=Math.min(window.devicePixelRatio||1,2);
    // An die tatsächliche #wrap-Größe (100dvh) koppeln, nicht an innerHeight –
    // sonst bleibt auf Mobil-Browsern unten ein heller Streifen in der Safe Area.
    const wrap=document.getElementById('wrap');
    W=wrap.clientWidth||window.innerWidth; H=wrap.clientHeight||window.innerHeight;
    canvas.width=W*DPR; canvas.height=H*DPR; canvas.style.width=W+'px'; canvas.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); }
  window.addEventListener('resize',resize); resize();
  const tgt={x:W/2,y:H*0.72};
  function setT(x,y){tgt.x=x;tgt.y=y;}
  function onMove(e){ const r=canvas.getBoundingClientRect();
    if(e.touches&&e.touches[0]) setT(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top); else setT(e.clientX-r.left,e.clientY-r.top); }
  canvas.addEventListener('mousemove',onMove);
  canvas.addEventListener('touchstart',e=>{onMove(e);e.preventDefault();},{passive:false});
  canvas.addEventListener('touchmove',e=>{onMove(e);e.preventDefault();},{passive:false});

  function makeStars(){ stars=[]; for(let i=0;i<70;i++) stars.push({x:Math.random()*W,y:Math.random()*H,z:Math.random()*0.7+0.3,r:Math.random()*1.6+0.4}); }
  makeStars();
  const rand=(a,b)=>a+Math.random()*(b-a);
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  // ---------- Seeded RNG (Daily-Runs: deterministische Hindernis-DNA) ----------
  let useSeed=false, seedState=0;
  function mulberry32(){ seedState=(seedState+0x6D2B79F5)|0; let t=seedState;
    t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }
  const grnd=()=> useSeed?mulberry32():Math.random();   // nur für layout-relevante Zufälle
  const grand=(a,b)=>a+grnd()*(b-a);
  const gpick=a=>a[Math.floor(grnd()*a.length)];
  function dailySeed(){ const d=new Date(); return ((d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate())>>>0)||1; }
  function dailyLabel(){ const d=new Date(), p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
  function spawnParticles(x,y,color,n,spd){ for(let i=0;i<n;i++){const a=Math.random()*6.28,s=rand(spd*0.3,spd);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:rand(0.012,0.03),color,size:rand(2,5)});} }
  function floatText(x,y,text,color,size){ floaters.push({x,y,text,color:color||'#fff',size:size||16,life:1,vy:-42}); }
  function hexA(h,a){ const n=parseInt(h.slice(1),16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }

  // ---------- Hintergrund-Themes (pro Level, weicher Crossfade) ----------
  const THEMES=[
    {top:[16,2,31],  mid:[26,5,51],  bot:[8,1,15],   grid:[255,46,136], sun:[255,46,136]}, // Synthwave
    {top:[44,10,22], mid:[92,24,30], bot:[16,3,10],  grid:[255,120,60], sun:[255,90,40]},  // Sonnenuntergang
    {top:[2,22,30],  mid:[6,52,58],  bot:[2,10,18],  grid:[40,255,180], sun:[40,255,200]}, // Aurora
    {top:[4,8,42],   mid:[12,22,74], bot:[2,4,18],   grid:[60,150,255], sun:[80,170,255]}, // Tiefsee
    {top:[30,5,44],  mid:[64,16,86], bot:[12,2,22],  grid:[200,70,255], sun:[255,90,225]}, // Vaporwave
    {top:[42,5,5],   mid:[88,18,6],  bot:[20,2,2],   grid:[255,90,30],  sun:[255,130,20]}  // Inferno
  ];
  const BOSS_THEME={top:[35,2,26],mid:[46,6,38],bot:[8,1,15],grid:[255,120,0],sun:[255,120,0]};
  const cloneTheme=t=>({top:t.top.slice(),mid:t.mid.slice(),bot:t.bot.slice(),grid:t.grid.slice(),sun:t.sun.slice()});
  let curBg=cloneTheme(THEMES[0]);
  const rgbS=a=>`rgb(${Math.round(a[0])},${Math.round(a[1])},${Math.round(a[2])})`;
  function lerpBg(target){ const k=0.07; for(const key of ['top','mid','bot','grid','sun']) for(let i=0;i<3;i++) curBg[key][i]+=(target[key][i]-curBg[key][i])*k; }

  // ---------- Upgrades ----------
  const UPGRADES=[
    {id:'radar',ico:'📡',name:'Radar',desc:'Near-Miss-Radius +45%',max:3,apply:()=>{mods.nearRadius*=1.45;}},
    {id:'shieldgen',ico:'🛡️',name:'Schildgenerator',desc:'+1 Schild jetzt & +1 nach jedem Boss',max:3,apply:()=>{shields=Math.min(shields+1,6);mods.shieldPerBoss++;}},
    {id:'glass',ico:'💎',name:'Glaskanone',desc:'+30% Punkte, aber +15% Hitbox',max:2,apply:()=>{mods.scoreMult*=1.3;mods.playerR*=1.15;player.r=mods.playerR;}},
    {id:'nimble',ico:'⚡',name:'Flink',desc:'Reaktion deutlich schneller',max:3,apply:()=>{mods.follow+=6;}},
    {id:'small',ico:'🔻',name:'Kompakt',desc:'Hitbox −18%',max:2,apply:()=>{mods.playerR*=0.82;player.r=mods.playerR;}},
    {id:'orbval',ico:'🔷',name:'Orb-Veredelung',desc:'Orbs geben +60% Punkte',max:3,apply:()=>{mods.orbValueMult*=1.6;}},
    {id:'magnet',ico:'🧲',name:'Magnetfeld',desc:'Dauerhafter Orb-Sog',max:3,apply:()=>{mods.magnetPassive+=130;}},
    {id:'loot',ico:'🎁',name:'Glücksbringer',desc:'Power-Ups erscheinen 50% öfter',max:2,apply:()=>{mods.powerupRate*=1.5;}},
    {id:'combo',ico:'🔗',name:'Combo-Anker',desc:'Jeder Near-Miss gibt +1 Combo extra',max:2,apply:()=>{mods.comboBonus+=1;}},
    {id:'reflex',ico:'🕙',name:'Reflex-Kern',desc:'Slow-Mo hält 50% länger',max:2,apply:()=>{mods.slowmoMult*=1.5;}},
    {id:'heart',ico:'💗',name:'Extra-Herz',desc:'+1 Leben (max 6)',max:3,apply:()=>{lives=Math.min(lives+1,6);}}
  ];

  function reset(){
    mods={nearRadius:30,scoreMult:1,playerR:13,follow:14,orbValueMult:1,magnetPassive:0,powerupRate:1,comboBonus:0,shieldPerBoss:0,slowmoMult:1};
    player={x:W/2,y:H*0.72,r:mods.playerR,trail:[]};
    tgt.x=W/2; tgt.y=H*0.72;
    obstacles=[]; orbs=[]; powerups=[]; particles=[]; floaters=[]; lasers=[];
    score=0; displayScore=0; combo=0; multiplier=1;
    elapsed=0; spawnT=0; orbT=0; powerupT=rand(5,9); difficulty=1;
    shake=0; flash=0; flashColor='#19f0ff'; nearGlow=0; nearCount=0;
    level=1; levelDuration=(mode==='hardcore')?12:16; levelTimer=levelDuration; unlocked=['straight'];
    upStep=450; nextUpgradeAt=450;
    bossActive=false; bossNumber=1; bossTimer=(mode==='hardcore')?16:22; bossPhaseT=0; laserSpawnT=0;
    banner=null; effects={slowmo:0,magnet:0,double:0}; shields=0; invuln=0; upgradeCounts={}; lives=3;
    curSong=0; curBg=cloneTheme(THEMES[0]); commentT=rand(12,20); egg67done=false; egg67T=0;
    comboTime=0; comboTimeMax=3.4; beatIdx=0; beatPulse=0; spawnQueued=false; orbQueued=false;
  }
  // Aktueller Bestwert-Schlüssel (Daily hat eigenen Rekord pro Tag)
  function curBest(){ return daily?(best.daily||0):(best[mode]||0); }
  function setBest(v){ if(daily) best.daily=v; else best[mode]=v; }
  function refillCombo(){ comboTimeMax=Math.max(1.7,(mode==='zen'?4.4:3.4)-multiplier*0.12); comboTime=comboTimeMax; }
  function startGame(m){
    if(m==='daily'){ daily=true; mode='normal'; }
    else if(m){ daily=false; mode=m; }       // m leer (NOCHMAL) → vorigen Typ beibehalten
    useSeed=daily;
    if(daily){ seedState=dailySeed()|0;
      if(best.dailyDate!==dailyLabel()){ best.daily=0; best.dailyDate=dailyLabel(); saveScores(); } }
    unlockAudio(); reset(); state=S.PLAY;
    document.getElementById('start').classList.add('hidden');
    document.getElementById('over').classList.add('hidden');
    document.getElementById('upgrade').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    modeNameEl.textContent=daily?('TÄGLICH '+dailyLabel()):mode.toUpperCase(); bestHud.textContent='BEST '+curBest();
    if(daily) banner={text:'🗓 DAILY',sub:dailyLabel(),t:2.6,color:'#ffe600'};
    zenExitBtn.style.display='block';
    sfxStart(); vibe(20); lastT=performance.now();
  }
  function toMenu(){ if((state===S.PLAY||state===S.UPGRADE||state===S.PAUSE)&&score>curBest()){ setBest(score); saveScores(); }
    state=S.MENU; document.getElementById('hud').classList.add('hidden');
    document.getElementById('over').classList.add('hidden'); document.getElementById('upgrade').classList.add('hidden');
    document.getElementById('pause').classList.add('hidden');
    document.getElementById('start').classList.remove('hidden');
  }
  function pauseGame(){ if(state!==S.PLAY) return; state=S.PAUSE;
    pauseSub.textContent=mode.toUpperCase()+' · '+Math.round(score)+' Punkte';
    document.getElementById('pause').classList.remove('hidden'); beep(440,0.08,'square',0.2); }
  function resumeGame(){ if(state!==S.PAUSE) return; state=S.PLAY; invuln=Math.max(invuln,0.9);
    document.getElementById('pause').classList.add('hidden'); lastT=performance.now(); beep(660,0.08,'square',0.2); }

  function addScore(n){ score+=Math.round(n*mods.scoreMult*(effects.double>0?2:1)); }
  function setMult(){ const m=1+Math.floor(combo/4); if(m>multiplier){ multiplier=m; onComboUp(m); } else multiplier=m; }
  function onComboUp(m){ floatText(player.x,player.y-30,'x'+m,'#ff2e88',20);
    const w={3:'W COMBO',5:'GOATED 🐐',8:'SIGMA 🗿',12:'+1000 AURA',16:'GÖTTLICH fr',20:'NO CAP 🔥',24:'CYBER-GOD'}[m];
    if(w){ banner={text:w,sub:'',t:1.4,color:'#ffe600'}; vibe([15,25,15]); } }
  function bumpCombo(){ comboEl.classList.remove('bump'); void comboEl.offsetWidth; comboEl.classList.add('bump'); }

  // ---------- Easteregg: CODE 67 ----------
  function sfx67(){ if(!actx||muted) return; [[392,0],[523,150],[392,360],[523,510]].forEach(([f,d])=>setTimeout(()=>beep(f,0.16,'square',0.32),d)); }
  function trigger67(){ if(state!==S.PLAY||egg67T>0) return; egg67T=8;
    banner={text:'6️⃣ 7️⃣',sub:'CODE 67 — six seveeen',t:2.8,color:'#ffe600'};
    sfx67(); vibe([67,67,67]); addScore(67); shields=Math.min(shields+1,6); flash=0.55; flashColor='#ffe600';
    for(let i=0;i<18;i++) floatText(rand(40,W-40),rand(H*0.2,H*0.8),'6 7',pick(['#ffe600','#19f0ff','#ff2e88']),rand(16,30));
    spawnParticles(player.x,player.y,'#ffe600',26,300);
  }

  // ---------- Spawning ----------
  function pickPattern(){ if(unlocked.length===1) return 'straight';
    if(grnd()<0.4) return 'straight'; return gpick(unlocked.slice(1)); }
  function spawnObstacle(){
    const key=pickPattern();
    const hc=mode==='hardcore'?1.5:1, zc=mode==='zen'?0.75:1;
    const sp=(120+level*16+Math.min(elapsed*6,220))*hc*zc;
    const o={pattern:key,near:false,scored:false,trail:[],rot:0,vr:grand(-3,3)};
    if(key==='straight'){ const sh=gpick(['rect','long','diamond']); o.shape=sh; o.color='#ff2e88';
      if(sh==='long'){o.w=grand(90,170);o.h=grand(20,28);} else if(sh==='diamond'){o.w=grand(34,52);o.h=o.w;} else {o.w=grand(30,58);o.h=grand(30,58);}
      o.cx=grand(o.w/2,W-o.w/2); o.cy=-o.h; o.vx=sh==='long'?0:grand(-30,30); o.vy=sp+grand(0,50);
    } else if(key==='sine'){ o.shape='capsule'; o.color='#ff5ea8'; o.w=grand(42,66); o.h=grand(22,30);
      o.baseX=grand(W*0.2,W*0.8); o.amp=grand(70,130); o.freq=grand(0.012,0.02); o.phase=grnd()*6.28; o.cx=o.baseX; o.cy=-o.h; o.vy=sp*0.95;
    } else if(key==='drift'){ o.shape='tri'; o.color='#ff7a2e'; o.w=grand(36,54); o.h=grand(40,58);
      o.cx=grand(W*0.2,W*0.8); o.cy=-o.h; o.vx=grand(-40,40); o.ax=grand(-70,70); o.vy=sp*0.9;
    } else if(key==='orbit'){ o.shape='hex'; o.color='#ff2e6e'; o.w=grand(34,48); o.h=o.w;
      o.radius=grand(50,95); o.baseX=grand(o.radius+24,W-o.radius-24); o.centerY=-o.radius; o.ang=grnd()*6.28; o.angVel=grand(1.6,2.6)*(grnd()<.5?1:-1); o.vy=sp*0.7; o.cx=o.baseX; o.cy=o.centerY;
    } else if(key==='zigzag'){ o.shape='star'; o.color='#ff3b3b'; o.w=grand(32,46); o.h=o.w;
      o.cx=grand(o.w,W-o.w); o.cy=-o.h; o.vx=grand(150,230)*(grnd()<.5?1:-1); o.vy=sp*0.85;
    } else if(key==='pendulum'){ o.shape='ring'; o.color='#ff2eaa'; o.w=grand(36,52); o.h=o.w;
      o.baseX=grand(W*0.3,W*0.7); o.swing=grand(90,150); o.ang=grnd()*6.28; o.angVel=grand(2,3.2); o.vy=sp*0.8; o.cx=o.baseX; o.cy=-o.h;
    }
    obstacles.push(o);
  }
  function spawnOrb(){ orbs.push({x:grand(30,W-30),y:-20,r:9,vy:90+difficulty*30,pulse:Math.random()*6.28}); }
  const PUP=['shield','slow','magnet','bomb','double'];
  const PUPINFO={shield:{c:'#2effc0',g:'🛡'},slow:{c:'#5b9bff',g:'⏱'},magnet:{c:'#c45bff',g:'🧲'},bomb:{c:'#ff9a2e',g:'💣'},double:{c:'#ffe600',g:'✕2'}};
  function spawnPowerup(){ const t=gpick(PUP); powerups.push({x:grand(40,W-40),y:-24,r:16,vy:80+difficulty*18,type:t,pulse:Math.random()*6.28}); }

  // ---------- Boss ----------
  function startBoss(){ bossActive=true; bossPhaseT=(mode==='hardcore')?10:8.5; laserSpawnT=0.6;
    banner={text:'⚠ BOSS-WELLE '+bossNumber,sub:'',t:2.2,color:'#ffe600'}; shake=10; sfxBoss(); vibe([60,40,60]); }
  function endBoss(){ bossActive=false; bossTimer=(mode==='hardcore')?24:30;
    const bonus=100*multiplier*bossNumber; addScore(bonus);
    banner={text:'ÜBERLEBT!',sub:'+'+bonus,t:2.2,color:'#2effc0'}; spawnParticles(W/2,H*0.4,'#ffe600',36,300);
    flash=0.5; flashColor='#ffe600'; sfxWin(); vibe([20,30,40]);
    for(let i=0;i<mods.shieldPerBoss;i++) shields=Math.min(shields+1,6);
    bossNumber++; }
  function spawnLaserWave(){ const mixed=bossNumber>=3, vert=(bossNumber%2===1);
    const count=Math.min(4,1+Math.floor(bossNumber/2));
    for(let i=0;i<count;i++){ const orient=mixed?(Math.random()<0.5?'v':'h'):(vert?'v':'h');
      const pos=orient==='v'?rand(W*0.1,W*0.9):rand(H*0.15,H*0.9);
      lasers.push({orient,pos,thick:rand(42,64),state:'warn',t:0,warnDur:Math.max(0.55,1-bossNumber*0.05),fireDur:0.45}); }
    sfxWarn(); }

  // ---------- Level / Upgrade flow ----------
  const UNLOCK={2:{key:'sine',name:'Wellenflug'},3:{key:'drift',name:'Gleiter'},4:{key:'orbit',name:'Kreisel'},5:{key:'zigzag',name:'Irrläufer'},6:{key:'pendulum',name:'Pendler'}};
  function levelUp(){ level++; levelTimer=levelDuration;
    const u=UNLOCK[level]; let sub='Schneller & dichter!';
    if(u){ unlocked.push(u.key); sub='Neue Form: '+u.name; }
    const ns=(level-1)%SONGS.length; if(ns!==curSong){ curSong=ns; sfxRiser(); floatText(W/2,H*0.44,'♪ '+SONGS[ns].name,'#ffe600',20); }
    banner={text:'LEVEL '+level,sub,t:2.6,color:'#19f0ff'}; sfxLevel(); vibe([20,25,20]);
    flash=0.4; flashColor='#19f0ff';
  }
  function openUpgrade(){ state=S.UPGRADE; sfxUpgrade(); vibe([30,20,30]);
    upgradeSub.textContent='Level '+level+' · Punkte '+Math.round(score);
    const avail=UPGRADES.filter(u=>(upgradeCounts[u.id]||0)<u.max);
    const poolArr=(avail.length?avail:UPGRADES).slice(); const chosen=[];
    while(chosen.length<3&&poolArr.length) chosen.push(poolArr.splice(Math.floor(Math.random()*poolArr.length),1)[0]);
    while(chosen.length<3) chosen.push(pick(UPGRADES));
    upgradeCards.innerHTML='';
    chosen.forEach(u=>{ const lvl=(upgradeCounts[u.id]||0);
      const card=document.createElement('div'); card.className='ucard';
      card.innerHTML=`<div class="ico">${u.ico}</div><h4>${u.name}</h4><p>${u.desc}</p><div class="stack">${lvl>0?('Stufe '+lvl+'/'+u.max):('0/'+u.max)}</div>`;
      card.addEventListener('click',()=>chooseUpgrade(u));
      upgradeCards.appendChild(card);
    });
    document.getElementById('upgrade').classList.remove('hidden');
  }
  function chooseUpgrade(u){ u.apply(); upgradeCounts[u.id]=(upgradeCounts[u.id]||0)+1;
    document.getElementById('upgrade').classList.add('hidden'); state=S.PLAY; invuln=Math.max(invuln,1.0);
    upStep=Math.round(upStep*1.6); nextUpgradeAt=score+upStep; sfxPow(); vibe(15);
    banner={text:u.name.toUpperCase(),sub:'aktiviert',t:1.6,color:'#ffe600'}; lastT=performance.now(); }

  // ---------- Hit ----------
  function hitPlayer(color){
    if(invuln>0) return false;
    if(shields>0){ shields--; invuln=1.1; flash=0.5; flashColor='#2effc0'; shake=14;
      spawnParticles(player.x,player.y,'#2effc0',22,260); sfxShieldBreak(); vibe([30,40,30]);
      floatText(player.x,player.y-26,'SCHILD WEG!','#2effc0',18); return false; }
    if(mode==='zen'){ combo=0; multiplier=1; invuln=0.8; flash=0.5; flashColor='#ff2e88'; shake=12;
      spawnParticles(player.x,player.y,'#ff2e88',16,220); beep(200,0.18,'square',0.3,-80); vibe(40);
      floatText(player.x,player.y-24,'COMBO WEG','#ff2e88',16); return false; }
    lives--;
    if(lives>0){ invuln=1.25; flash=0.6; flashColor='#ff2e88'; shake=16; combo=0; multiplier=1;
      spawnParticles(player.x,player.y,'#ff4d6d',26,300); sfxShieldBreak(); beep(220,0.3,'sawtooth',0.4,-120); vibe([70,40,70]);
      floatText(player.x,player.y-28,'−1 ♥','#ff4d6d',20); banner={text:lives+' ♥ ÜBRIG',sub:'',t:1.3,color:'#ff4d6d'}; return false; }
    gameOver(); return true;
  }

  // ---------- Update ----------
  function update(dt){
    elapsed+=dt; const dGrow=mode==='hardcore'?0.07:0.05; difficulty=1+Math.min(elapsed,120)*dGrow;
    const ts=effects.slowmo>0?0.42:1;
    if(invuln>0) invuln-=dt;
    for(const k in effects) if(effects[k]>0) effects[k]-=dt;

    // Beat-Clock (rhythmische Spawns + Puls auf dem Backbeat)
    const step8=Math.floor(elapsed/(secPerStep*2)), onStep=step8>beatIdx;
    if(onStep){ beatIdx=step8; if(step8%2===0){ const beat=(step8/2)%4; if(beat===1||beat===3) beatPulse=1; } }
    beatPulse=Math.max(0,beatPulse-dt*3.2);

    // Combo-Decay: Streak verfällt, wenn man zu lange nichts riskiert
    if(combo>0){ comboTime-=dt; if(comboTime<=0){ combo=0; multiplier=1; comboTime=0;
      floatText(player.x,player.y-30,'COMBO AUS','#9a86c9',16); beep(330,0.12,'sine',0.14,-120); } }

    player.r+= (mods.playerR-player.r)*0.2;
    player.x+=(tgt.x-player.x)*Math.min(1,dt*mods.follow);
    player.y+=(tgt.y-player.y)*Math.min(1,dt*mods.follow);
    player.x=Math.max(player.r,Math.min(W-player.r,player.x));
    player.y=Math.max(player.r,Math.min(H-player.r,player.y));
    player.trail.push({x:player.x,y:player.y}); if(player.trail.length>18) player.trail.shift();
    for(const s of stars){ s.y+=(20+s.z*40)*dt; if(s.y>H){s.y=-2;s.x=Math.random()*W;} }

    // Level timing
    if(!bossActive){ levelTimer-=dt; if(levelTimer<=0) levelUp(); }
    // Upgrade trigger
    if(!bossActive && score>=nextUpgradeAt){ openUpgrade(); return; }

    // Boss timing
    if(mode!=='zen'){
      if(!bossActive){ bossTimer-=dt; if(bossTimer<=0) startBoss(); }
      else { bossPhaseT-=dt;
        if(bossPhaseT>1.6){ laserSpawnT-=dt; if(laserSpawnT<=0){ spawnLaserWave(); laserSpawnT=Math.max(0.7,1.5-bossNumber*0.08); } }
        if(bossPhaseT<=0 && lasers.length===0) endBoss();
      }
    }
    // Spawns – auf das nächste Achtel quantisiert (alles passiert „auf dem Beat")
    if(!bossActive){ spawnT-=dt; if(spawnT<=0) spawnQueued=true;
      if(spawnQueued && onStep){ spawnObstacle(); spawnQueued=false; spawnT=Math.max(0.36,0.95-difficulty*0.05-level*0.015); } }
    if(mode!=='hardcore'){ orbT-=dt; if(orbT<=0) orbQueued=true;
      if(orbQueued && onStep && step8%2===1){ spawnOrb(); orbQueued=false; orbT=rand(0.9,1.8); } }
    powerupT-=dt; if(powerupT<=0){ spawnPowerup(); powerupT=rand(10,16)/mods.powerupRate; }
    if(egg67T>0) egg67T-=dt;
    if(!egg67done && score>=67){ egg67done=true; floatText(player.x,player.y-52,'6 7 !!','#ffe600',26); sfx67(); vibe([30,30]); }
    commentT-=dt; if(commentT<=0 && !bossActive){ floatText(W/2+rand(-30,30),H*0.2,pick(DUMB),'#9be7ff',16); commentT=rand(15,26); }

    // Lasers
    for(let i=lasers.length-1;i>=0;i--){ const L=lasers[i]; L.t+=dt*ts;
      if(L.state==='warn'&&L.t>=L.warnDur){ L.state='fire'; L.t=0; sfxFire(); shake=Math.max(shake,6); vibe(20); }
      if(L.state==='fire'){ const hit=L.orient==='v'?Math.abs(player.x-L.pos)<L.thick/2+player.r:Math.abs(player.y-L.pos)<L.thick/2+player.r;
        if(hit){ if(hitPlayer('#ff2e88')) return; } if(L.t>=L.fireDur) lasers.splice(i,1); } }

    // Obstacles
    for(let i=obstacles.length-1;i>=0;i--){ const o=obstacles[i];
      if(o.pattern!=='straight'){ o.trail.push({x:o.cx,y:o.cy}); if(o.trail.length>9) o.trail.shift(); }
      if(o.pattern==='straight'){ o.cy+=o.vy*dt*ts; o.cx+=o.vx*dt*ts; if(o.shape==='diamond')o.rot+=o.vr*dt*ts; if(o.cx<o.w/2||o.cx>W-o.w/2)o.vx*=-1; }
      else if(o.pattern==='sine'){ o.cy+=o.vy*dt*ts; o.cx=o.baseX+o.amp*Math.sin(o.cy*o.freq+o.phase); }
      else if(o.pattern==='drift'){ o.vx+=o.ax*dt*ts; o.cx+=o.vx*dt*ts; o.cy+=o.vy*dt*ts; o.rot+=o.vr*dt*ts*0.3; }
      else if(o.pattern==='orbit'){ o.centerY+=o.vy*dt*ts; o.ang+=o.angVel*dt*ts; o.cx=o.baseX+o.radius*Math.cos(o.ang); o.cy=o.centerY+o.radius*Math.sin(o.ang); }
      else if(o.pattern==='zigzag'){ o.cy+=o.vy*dt*ts; o.cx+=o.vx*dt*ts; if(o.cx<o.w/2){o.cx=o.w/2;o.vx*=-1;} if(o.cx>W-o.w/2){o.cx=W-o.w/2;o.vx*=-1;} o.rot+=8*dt*ts; }
      else if(o.pattern==='pendulum'){ o.cy+=o.vy*dt*ts; o.ang+=o.angVel*dt*ts; o.cx=o.baseX+o.swing*Math.sin(o.ang); }

      const hw=o.w/2,hh=o.h/2;
      const nx=Math.max(o.cx-hw,Math.min(player.x,o.cx+hw)), ny=Math.max(o.cy-hh,Math.min(player.y,o.cy+hh));
      const dx=player.x-nx, dy=player.y-ny, d2=dx*dx+dy*dy;
      if(invuln<=0 && d2<player.r*player.r){ spawnParticles(player.x,player.y,o.color,10,180); obstacles.splice(i,1); if(hitPlayer(o.color)) return; continue; }
      const nr=player.r+mods.nearRadius;
      if(!o.near && invuln<=0 && d2<nr*nr && d2>player.r*player.r){ o.near=true; doNear(o); }
      if(o.cy-hh>H+40){ if(!o.scored){addScore(1);o.scored=true;} obstacles.splice(i,1); }
    }

    // Orbs
    for(let i=orbs.length-1;i>=0;i--){ const orb=orbs[i]; orb.y+=orb.vy*dt*ts; orb.pulse+=dt*6;
      const pull=effects.magnet>0?440:mods.magnetPassive;
      if(pull>0){ const dd=Math.hypot(player.x-orb.x,player.y-orb.y), rng=effects.magnet>0?9999:170;
        if(dd<rng&&dd>1){ const a=Math.atan2(player.y-orb.y,player.x-orb.x); orb.x+=Math.cos(a)*pull*dt; orb.y+=Math.sin(a)*pull*dt; } }
      const dx=player.x-orb.x,dy=player.y-orb.y,rr=player.r+orb.r+4;
      if(dx*dx+dy*dy<rr*rr){ combo++; setMult(); refillCombo(); const g=Math.round(10*multiplier*mods.orbValueMult); addScore(g);
        spawnParticles(orb.x,orb.y,'#19f0ff',14,220); sfxOrb(combo); bumpCombo(); vibe(8); floatText(orb.x,orb.y-14,'+'+g,'#19f0ff',15);
        flash=Math.min(0.5,flash+0.18); flashColor='#19f0ff'; orbs.splice(i,1); continue; }
      if(orb.y>H+20) orbs.splice(i,1);
    }

    // Power-ups
    for(let i=powerups.length-1;i>=0;i--){ const p=powerups[i]; p.y+=p.vy*dt*ts; p.pulse+=dt*5;
      const dx=player.x-p.x,dy=player.y-p.y,rr=player.r+p.r+4;
      if(dx*dx+dy*dy<rr*rr){ collectPup(p); powerups.splice(i,1); continue; }
      if(p.y>H+30) powerups.splice(i,1);
    }

    // Particles & floaters
    for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.94;p.vy*=0.94;p.life-=p.decay; if(p.life<=0)particles.splice(i,1); }
    for(let i=floaters.length-1;i>=0;i--){ const f=floaters[i]; f.y+=f.vy*dt; f.vy*=0.96; f.life-=dt*0.9; if(f.life<=0)floaters.splice(i,1); }

    if(banner){ banner.t-=dt; if(banner.t<=0) banner=null; }
    displayScore+=(score-displayScore)*Math.min(1,dt*10);
    shake=Math.max(0,shake-dt*60); flash=Math.max(0,flash-dt*1.5); nearGlow=Math.max(0,nearGlow-dt*2);
    scoreEl.textContent=Math.round(displayScore); comboEl.textContent='x'+multiplier;
    const cf=(combo>0&&comboTimeMax>0)?Math.max(0,Math.min(1,comboTime/comboTimeMax)):0;
    comboFillEl.style.transform='scaleX('+cf+')'; comboBarEl.classList.toggle('on',combo>0);
  }

  function doNear(o){ combo+=1+mods.comboBonus; setMult(); refillCombo(); const g=5*multiplier; addScore(g);
    spawnParticles(player.x,player.y,'#ffe600',6,160); sfxNear(); bumpCombo(); vibe(8);
    floatText(player.x+rand(-10,10),player.y-20,'+'+g,'#ffe600',14); nearGlow=Math.min(1,nearGlow+0.5); nearCount++;
    if(nearCount%5===0){ floatText(player.x,player.y-46,pick(['KNAPP!','lowkey close','W ausweichen','ZACK!','fr fr','skill 🔥','HUI!']),'#19f0ff',22); shake=Math.max(shake,7); vibe([10,15]); } }

  function collectPup(p){ sfxPow(); vibe([15,15,15]); spawnParticles(p.x,p.y,PUPINFO[p.type].c,18,240); flash=0.4; flashColor=PUPINFO[p.type].c;
    if(p.type==='shield'){ shields=Math.min(shields+1,6); floatText(p.x,p.y-18,'SCHILD','#2effc0',16); }
    else if(p.type==='slow'){ effects.slowmo=5*mods.slowmoMult; floatText(p.x,p.y-18,'SLOW-MO','#5b9bff',16); }
    else if(p.type==='magnet'){ effects.magnet=6; floatText(p.x,p.y-18,'MAGNET','#c45bff',16); }
    else if(p.type==='double'){ effects.double=7; floatText(p.x,p.y-18,'PUNKTE ✕2','#ffe600',16); }
    else if(p.type==='bomb'){ let n=0; for(const o of obstacles){ spawnParticles(o.cx,o.cy,o.color,8,200); n++; addScore(3*multiplier); }
      obstacles=[]; lasers=[]; shake=18; flash=0.6; flashColor='#ff9a2e'; vibe([50,30,50]); banner={text:'BOOM!',sub:n+' pulverisiert',t:1.6,color:'#ff9a2e'}; floatText(p.x,p.y-18,'BOMBE','#ff9a2e',16); }
  }

  // ---------- Shapes ----------
  function rr(x,y,w,h,r){ ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath(); }
  function shapePath(sh,w,h){ const hw=w/2,hh=h/2; ctx.beginPath();
    if(sh==='rect'||sh==='long') rr(-hw,-hh,w,h,6);
    else if(sh==='capsule') rr(-hw,-hh,w,h,hh);
    else if(sh==='diamond'){ ctx.moveTo(0,-hh);ctx.lineTo(hw,0);ctx.lineTo(0,hh);ctx.lineTo(-hw,0);ctx.closePath(); }
    else if(sh==='tri'){ ctx.moveTo(0,hh);ctx.lineTo(hw,-hh);ctx.lineTo(-hw,-hh);ctx.closePath(); }
    else if(sh==='hex'){ for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6,x=Math.cos(a)*hw,y=Math.sin(a)*hh; i?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.closePath(); }
    else if(sh==='star'){ for(let i=0;i<8;i++){const a=Math.PI/4*i,r=i%2?hw*0.45:hw,x=Math.cos(a)*r,y=Math.sin(a)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.closePath(); }
  }

  // ---------- Draw ----------
  function draw(){
    ctx.save(); if(shake>0) ctx.translate(rand(-shake,shake),rand(-shake,shake));
    lerpBg(bossActive?BOSS_THEME:THEMES[((level||1)-1)%THEMES.length]);
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,rgbS(curBg.top)); g.addColorStop(.55,rgbS(curBg.mid)); g.addColorStop(1,rgbS(curBg.bot));
    ctx.fillStyle=g; ctx.fillRect(-40,-40,W+80,H+80);
    drawGrid();
    for(const s of stars){ ctx.globalAlpha=s.z; ctx.fillStyle='#bda4ff'; ctx.fillRect(s.x,s.y,s.r,s.r); } ctx.globalAlpha=1;

    if(state===S.PLAY||state===S.OVER||state===S.UPGRADE||state===S.PAUSE){
      // lasers
      for(const L of lasers){ ctx.save();
        if(L.state==='warn'){ const a=0.25+0.35*Math.abs(Math.sin(L.t*16)); ctx.strokeStyle=`rgba(255,230,0,${a})`; ctx.setLineDash([10,10]); ctx.lineWidth=3; ctx.shadowBlur=12; ctx.shadowColor='#ffe600'; ctx.beginPath();
          if(L.orient==='v'){ctx.moveTo(L.pos,0);ctx.lineTo(L.pos,H);}else{ctx.moveTo(0,L.pos);ctx.lineTo(W,L.pos);} ctx.stroke(); }
        else { const fd=1-L.t/L.fireDur; ctx.shadowBlur=30; ctx.shadowColor='#ff2e88';
          const grd=L.orient==='v'?ctx.createLinearGradient(L.pos-L.thick/2,0,L.pos+L.thick/2,0):ctx.createLinearGradient(0,L.pos-L.thick/2,0,L.pos+L.thick/2);
          grd.addColorStop(0,'rgba(255,46,136,0)');grd.addColorStop(.5,`rgba(255,255,255,${0.9*fd})`);grd.addColorStop(1,'rgba(255,46,136,0)'); ctx.fillStyle=grd;
          if(L.orient==='v')ctx.fillRect(L.pos-L.thick/2,0,L.thick,H); else ctx.fillRect(0,L.pos-L.thick/2,W,L.thick); }
        ctx.restore(); }

      // orbs
      for(const orb of orbs){ const pr=orb.r+Math.sin(orb.pulse)*2; ctx.save(); ctx.shadowBlur=24; ctx.shadowColor='#19f0ff'; ctx.fillStyle='#19f0ff';
        ctx.beginPath();ctx.arc(orb.x,orb.y,pr,0,6.28);ctx.fill(); ctx.fillStyle='#caffff';ctx.beginPath();ctx.arc(orb.x,orb.y,pr*0.45,0,6.28);ctx.fill(); ctx.restore(); }

      // power-ups
      for(const p of powerups){ const inf=PUPINFO[p.type], pr=p.r+Math.sin(p.pulse)*2; ctx.save(); ctx.shadowBlur=22; ctx.shadowColor=inf.c;
        ctx.fillStyle=hexA(inf.c,0.22); ctx.strokeStyle=inf.c; ctx.lineWidth=2.5; ctx.beginPath();ctx.arc(p.x,p.y,pr,0,6.28);ctx.fill();ctx.stroke();
        ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.font='15px Space Mono, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(inf.g,p.x,p.y+1); ctx.restore(); }

      // obstacles
      for(const o of obstacles){
        if(o.pattern!=='straight'&&o.trail.length){ for(let i=0;i<o.trail.length;i++){ const t=o.trail[i],a=i/o.trail.length;
          ctx.globalAlpha=a*0.28; ctx.fillStyle=o.color; ctx.beginPath(); ctx.arc(t.x,t.y,o.w*0.18*a,0,6.28); ctx.fill(); } ctx.globalAlpha=1; }
        ctx.save(); ctx.translate(o.cx,o.cy); ctx.rotate(o.rot||0); ctx.shadowBlur=16; ctx.shadowColor=o.color;
        if(o.shape==='ring'){ ctx.strokeStyle=o.color; ctx.lineWidth=o.w*0.26; ctx.beginPath(); ctx.arc(0,0,o.w*0.4,0,6.28); ctx.stroke(); }
        else { ctx.strokeStyle=o.color; ctx.lineWidth=3; ctx.fillStyle=hexA(o.color,0.16); shapePath(o.shape,o.w,o.h); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      }

      // player trail
      for(let i=0;i<player.trail.length;i++){ const t=player.trail[i],a=i/player.trail.length; ctx.globalAlpha=a*0.5; ctx.fillStyle='#19f0ff'; ctx.beginPath(); ctx.arc(t.x,t.y,player.r*a*0.8,0,6.28); ctx.fill(); } ctx.globalAlpha=1;

      // player
      if(state===S.PLAY||state===S.UPGRADE||state===S.PAUSE){ const blink=invuln>0&&Math.floor(invuln*16)%2===0;
        if(!blink){ ctx.save(); ctx.shadowBlur=26; ctx.shadowColor='#19f0ff';
          const grd=ctx.createRadialGradient(player.x,player.y,2,player.x,player.y,player.r); grd.addColorStop(0,'#fff'); grd.addColorStop(1,'#19f0ff'); ctx.fillStyle=grd;
          ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,6.28);ctx.fill(); ctx.restore(); }
        // shield rings
        for(let s=0;s<shields;s++){ ctx.save(); ctx.strokeStyle=hexA('#2effc0',0.8-s*0.12); ctx.lineWidth=2; ctx.shadowBlur=12; ctx.shadowColor='#2effc0';
          ctx.beginPath(); ctx.arc(player.x,player.y,player.r+6+s*5,0,6.28); ctx.stroke(); ctx.restore(); }
      }

      // particles
      for(const p of particles){ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color; ctx.shadowBlur=10; ctx.shadowColor=p.color; ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size); } ctx.globalAlpha=1; ctx.shadowBlur=0;

      // floaters
      ctx.textAlign='center'; ctx.textBaseline='middle';
      for(const f of floaters){ ctx.globalAlpha=Math.max(0,f.life); ctx.fillStyle=f.color; ctx.shadowBlur=10; ctx.shadowColor=f.color;
        ctx.font='700 '+f.size+'px Orbitron, sans-serif'; ctx.fillText(f.text,f.x,f.y); } ctx.globalAlpha=1; ctx.shadowBlur=0;

      // effect HUD (top center)
      drawEffectHud();
      if((state===S.PLAY||state===S.UPGRADE||state===S.PAUSE)&&mode!=='zen') drawHearts();

      // banner
      if(banner){ const a=Math.min(1,banner.t*1.2); ctx.save(); ctx.globalAlpha=a; ctx.textAlign='center';
        ctx.font='900 clamp(22px,6vw,40px) Orbitron, sans-serif'; ctx.shadowBlur=24; ctx.shadowColor=banner.color; ctx.fillStyle='#fff'; ctx.fillText(banner.text,W/2,H*0.32);
        if(banner.sub){ ctx.font='700 clamp(13px,3vw,18px) Orbitron, sans-serif'; ctx.fillStyle=banner.color; ctx.fillText(banner.sub,W/2,H*0.32+34); } ctx.restore(); }
    }

    // vignette (action / combo / near)
    const vig=0.32+Math.min(0.3,(multiplier||1)*0.02)+(nearGlow||0)*0.25;
    const rg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.72);
    rg.addColorStop(0,'rgba(0,0,0,0)'); rg.addColorStop(1,`rgba(${bossActive?'40,5,5':'10,0,20'},${vig})`); ctx.fillStyle=rg; ctx.fillRect(-40,-40,W+80,H+80);
    if(effects&&effects.slowmo>0){ ctx.fillStyle='rgba(40,80,160,0.10)'; ctx.fillRect(-40,-40,W+80,H+80); }
    if(flash>0){ const m=flashColor.startsWith('#')?hexA(flashColor,flash*0.2):flashColor; ctx.fillStyle=m; ctx.fillRect(-40,-40,W+80,H+80); }
    ctx.restore();
  }

  function drawHearts(){
    const n=lives; if(!n||n<=0) return;
    const gap=30, y=26; let x=W/2-(n-1)*gap/2;
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='22px Space Mono, monospace';
    ctx.shadowBlur=14; ctx.shadowColor='#ff2e88'; ctx.fillStyle='#ff3b6b';
    for(let i=0;i<n;i++){ ctx.fillText('♥',x,y); x+=gap; }
    ctx.restore();
  }

  function drawEffectHud(){
    const items=[]; if(effects.slowmo>0)items.push(['⏱',effects.slowmo,'#5b9bff',5*mods.slowmoMult]);
    if(effects.magnet>0)items.push(['🧲',effects.magnet,'#c45bff',6]); if(effects.double>0)items.push(['✕2',effects.double,'#ffe600',7]);
    let x=W/2-(items.length*40)/2+20; const y=H-46;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const it of items){ ctx.save(); ctx.font='14px Space Mono'; ctx.fillStyle='#fff'; ctx.shadowBlur=8; ctx.shadowColor=it[2]; ctx.fillText(it[0],x,y-8);
      ctx.shadowBlur=0; ctx.fillStyle=hexA(it[2],0.3); ctx.fillRect(x-16,y+6,32,4); ctx.fillStyle=it[2]; ctx.fillRect(x-16,y+6,32*Math.max(0,it[1]/it[3]),4); ctx.restore(); x+=40; }
  }

  function drawGrid(){ const hz=H*0.42,vx=W/2, bp=1+(beatPulse||0)*0.55; // bp = Beat-Puls
    const gc=curBg.grid, sc=curBg.sun;
    ctx.strokeStyle=`rgba(${gc[0]|0},${gc[1]|0},${gc[2]|0},${Math.min(0.6,0.24*bp)})`; ctx.lineWidth=1;
    for(let i=-10;i<=10;i++){ctx.beginPath();ctx.moveTo(vx+i*40,hz);ctx.lineTo(vx+i*220,H);ctx.stroke();}
    const t=(elapsed||0)*0.5%1;
    for(let i=0;i<14;i++){const f=(i+t)/14,y=hz+Math.pow(f,2.2)*(H-hz); ctx.globalAlpha=Math.min(0.7,(0.1+f*0.25)*bp); ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();} ctx.globalAlpha=1;
    const sg=ctx.createRadialGradient(W/2,hz,4,W/2,hz,180); sg.addColorStop(0,`rgba(${sc[0]|0},${sc[1]|0},${sc[2]|0},${Math.min(0.7,0.4*bp)})`); sg.addColorStop(1,`rgba(${sc[0]|0},${sc[1]|0},${sc[2]|0},0)`); ctx.fillStyle=sg; ctx.fillRect(W/2-180,hz-180,360,360);
  }

  // ---------- Game Over ----------
  const QUIPS=[
    "Dein Pixel-Ich ist jetzt Teil des Bodenbelags.","Organspende war gestern. Heute: Pixelspende.",
    "Tod durch Quadrat. Wie würdevoll.","Die gute Nachricht: Es tat nur einen Frame lang weh.",
    "Du wirst nicht vermisst. Dein Highscore schon.","R.I.P. – Rendered In Pieces.",
    "Kein Respawn, kein Jenseits, nur dieser Bildschirm.","Selbst das Tutorial weint gerade.",
    "Der Block kam aus dem Nichts. Dein Talent auch.","Reflexe wie ein Faultier im Winterschlaf.",
    "Glückwunsch! Du hast den Boden gefunden.","Game Over. Aber immerhin stilvoll explodiert.",
    "Die Synthwave-Götter schütteln den Kopf.","Du hattest EINE Aufgabe.",
    "Knapp am Sieg vorbei ist auch daneben.","Statistisch gesehen: peinlich."
  ];
  const CRAZY_TAGS=["weiche aus · sammle · überlebe","probier nicht zu sterben (du wirst)","100% chiptune, 0% gnade","heute schon explodiert?","reflexe verkauft? hier zurückholen","no cap, das wird mid","6 7 enjoyer welcome"];
  const INSULTS=["Schwach. Richtig schwach.","Loser-Alarm. 🚨","Das war erbärmlich, ehrlich.","Meine Oma weicht besser aus.","Git gud, sagt man da.","Talentfrei – aber niedlich.","Selbst die Bots lachen.","Setzen. Sechs.","Pixel-Versager Deluxe.","War das Absicht? Bitte sag ja.","Skill: nicht gefunden.","Eine Schande für Synthwave.","L + ratio + bozo.","skill issue tbh.","−1000 Aura, digga.","mid. einfach mid.","das war goofy ngl.","sit down, bro.","NPC-Tod erkannt.","0 rizz, 0 skill.","ratio. L. cope.","delulu warst du eh."];
  const DUMB=["bro hat einfach... ja.","skibidi 🚽","das ist lowkey mid","real ones wissen Bescheid","+50 Aura für nix","kein Cap fr fr","gönn dir, digga","sigma move 🗿","Ohio-Level erreicht","goofy ahh ausweichen","valid. einfach valid.","NPC-Verhalten erkannt","slay 💅","krass Bruder","delulu ist die solulu","W oder L?","based ngl","gyatt 😳","mach mal kein L","ist das Aura oder Lag?","6 7 😶‍🌫️","kein Plan was hier abgeht","Hä? auch egal.","das ribbelt im Hirn"];
  function gameOver(){ state=S.OVER; sfxGameOver(); duckMusic(2.4); shake=24; vibe([120,50,200]);
    spawnParticles(player.x,player.y,'#ff2e88',46,380); spawnParticles(player.x,player.y,'#19f0ff',26,260);
    const rec=score>curBest(); if(rec){ setBest(score); saveScores(); }
    document.getElementById('hud').classList.add('hidden');
    finalScore.textContent=Math.round(score); finalBest.textContent=curBest(); overModeEl.textContent=daily?('TÄGLICH · '+dailyLabel()):mode.toUpperCase();
    quipEl.textContent=pick(QUIPS); insultEl.textContent=pick(INSULTS); newrecEl.style.display=rec?'block':'none';
    setTimeout(()=>document.getElementById('over').classList.remove('hidden'),560);
  }

  // ---------- Teilen: Score-Karte als PNG ----------
  function buildShareCanvas(){
    const c=document.createElement('canvas'); c.width=1080; c.height=1080; const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,1080); g.addColorStop(0,'#180230'); g.addColorStop(.55,'#1a0a3a'); g.addColorStop(1,'#08010f');
    x.fillStyle=g; x.fillRect(0,0,1080,1080);
    // Perspektiv-Grid unten
    x.strokeStyle='rgba(255,46,136,0.35)'; x.lineWidth=2;
    for(let i=-10;i<=10;i++){ x.beginPath(); x.moveTo(540+i*44,660); x.lineTo(540+i*260,1080); x.stroke(); }
    for(let i=0;i<12;i++){ const f=i/12, y=660+Math.pow(f,2.2)*420; x.globalAlpha=0.12+f*0.3; x.beginPath(); x.moveTo(0,y); x.lineTo(1080,y); x.stroke(); }
    x.globalAlpha=1; x.textAlign='center';
    x.fillStyle='#fff'; x.shadowColor='#ff2e88'; x.shadowBlur=42; x.font='900 116px Orbitron, sans-serif';
    x.fillText('NEONDRIFT',540,250);
    x.shadowBlur=0; x.fillStyle='#9a86c9'; x.font='700 34px Orbitron, sans-serif';
    x.fillText(daily?('TÄGLICH · '+dailyLabel()):mode.toUpperCase(),540,322);
    x.fillStyle='#19f0ff'; x.shadowColor='#19f0ff'; x.shadowBlur=46; x.font='900 230px Orbitron, sans-serif';
    x.fillText(String(Math.round(score)),540,600);
    x.shadowBlur=0; x.fillStyle='#ffe600'; x.font='700 40px Orbitron, sans-serif'; x.fillText('PUNKTE',540,672);
    x.fillStyle='#c9b9ef'; x.font='400 36px "Space Mono", monospace'; x.fillText('Rekord '+curBest(),540,840);
    x.fillStyle='#ff2e88'; x.shadowColor='#ff2e88'; x.shadowBlur=20; x.font='900 52px Orbitron, sans-serif'; x.fillText('SCHLAG MICH. 🔥',540,930);
    x.shadowBlur=0; x.fillStyle='#5b4a85'; x.font='400 30px "Space Mono", monospace'; x.fillText('hannespix.github.io/neondrift',540,1020);
    return c;
  }
  function shareScore(){
    let blobUrl=null;
    try{
      const c=buildShareCanvas();
      const text='NEONDRIFT'+(daily?(' · Daily '+dailyLabel()):(' · '+mode.toUpperCase()))+': '+Math.round(score)+' Punkte! Schlag mich 🔥 https://hannespix.github.io/neondrift/';
      c.toBlob(blob=>{ if(!blob) return;
        const file=new File([blob],'neondrift-'+Math.round(score)+'.png',{type:'image/png'});
        if(navigator.canShare && navigator.canShare({files:[file]})){
          navigator.share({files:[file],text,title:'NEONDRIFT'}).catch(()=>{});
        } else {
          blobUrl=URL.createObjectURL(blob);
          const a=document.createElement('a'); a.href=blobUrl; a.download=file.name; document.body.appendChild(a); a.click(); a.remove();
          try{ if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text); }catch(e){}
          setTimeout(()=>{ try{ URL.revokeObjectURL(blobUrl); }catch(e){} },5000);
        }
      },'image/png');
    }catch(e){}
  }

  // ---------- Loop ----------
  function loop(now){ let dt=(now-lastT)/1000; lastT=now; if(dt>0.05)dt=0.05;
    if(state===S.PLAY) update(dt);
    else { elapsed=(elapsed||0)+dt; for(const s of stars){s.y+=(20+s.z*40)*dt;if(s.y>H){s.y=-2;s.x=Math.random()*W;}}
      if(particles)for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.94;p.vy*=0.94;p.life-=p.decay;if(p.life<=0)particles.splice(i,1);}
      shake=Math.max(0,(shake||0)-dt*60); }
    draw(); requestAnimationFrame(loop);
  }

  // ---------- DOM ----------
  const scoreEl=document.getElementById('score'),comboEl=document.getElementById('combo'),bestHud=document.getElementById('best-hud'),
        finalScore=document.getElementById('finalScore'),finalBest=document.getElementById('finalBest'),quipEl=document.getElementById('quip'),
        newrecEl=document.getElementById('newrec'),modeNameEl=document.getElementById('modeName'),overModeEl=document.getElementById('overMode'),
        zenExitBtn=document.getElementById('zenExit'),upgradeCards=document.getElementById('upgradeCards'),upgradeSub=document.getElementById('upgradeSub'),
        titleTag=document.getElementById('titleTag'),insultEl=document.getElementById('insult'),
        pauseSub=document.getElementById('pauseSub'),
        comboBarEl=document.getElementById('comboBar'),comboFillEl=comboBarEl.querySelector('i');
  document.querySelectorAll('.mode').forEach(c=>c.addEventListener('click',()=>startGame(c.dataset.mode)));
  document.getElementById('dailyBtn').addEventListener('click',()=>startGame('daily'));
  document.getElementById('againBtn').addEventListener('click',()=>startGame());
  document.getElementById('menuBtn').addEventListener('click',toMenu);
  document.getElementById('shareBtn').addEventListener('click',shareScore);
  zenExitBtn.addEventListener('click',pauseGame);
  document.getElementById('resumeBtn').addEventListener('click',resumeGame);
  document.getElementById('pauseMenuBtn').addEventListener('click',toMenu);
  const muteBtn=document.getElementById('mute');
  muteBtn.addEventListener('click',()=>{ muted=!muted; muteBtn.textContent=muted?'🔇':'🔊';
    if(masterGain) masterGain.gain.value=muted?0:0.9; if(!muted){ unlockAudio(); } });
  let lastKey='';
  window.addEventListener('keydown',e=>{ if(e.code==='Escape'){ if(state===S.PLAY) pauseGame(); else if(state===S.PAUSE) resumeGame(); else if(state!==S.MENU) toMenu(); }
    else if((e.code==='Space'||e.code==='Enter')&&state===S.OVER){e.preventDefault();startGame();}
    if(e.key==='7'&&lastKey==='6') trigger67(); lastKey=e.key; });
  document.addEventListener('visibilitychange',()=>{ lastT=performance.now();
    if(document.hidden){
      if(state===S.PLAY) pauseGame();           // im Hintergrund nicht unbemerkt sterben
      if(actx && actx.state==='running'){ try{ actx.suspend(); }catch(e){} } // Musik & SFX anhalten (auch im Browser)
    } else {
      if(actx && actx.state==='suspended' && !muted){ try{ actx.resume(); }catch(e){} }
    }
  });
  setInterval(()=>{ if(state===S.MENU) titleTag.textContent=pick(CRAZY_TAGS); },3200);
  setInterval(()=>{ if(state===S.MENU && musicOn){ curSong=(curSong+1)%SONGS.length; sfxRiser(); titleTag.textContent='♪ jetzt: '+SONGS[curSong].name; } },12000);

  particles=[]; floaters=[]; obstacles=[]; orbs=[]; powerups=[]; lasers=[];
  multiplier=1; combo=0; nearGlow=0; flash=0; shake=0; bossActive=false; elapsed=0;
  effects={slowmo:0,magnet:0,double:0}; shields=0; invuln=0;
  requestAnimationFrame(loop);
})();
