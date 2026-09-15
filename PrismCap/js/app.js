
'use strict';
// ═══ STATE ═══════════════════════════════════════════════════════════
var S={cur:'home',game:null,passCb:null,feat:null,cfg:{sfx:true,haptic:true,bg:false,save:true,theme:'',music:false,lowPower:true,perfMode:'eco',largeTap:false,colorBlind:false},prof:{name:'Player',av:'👤',xp:0,lvl:1,games:0,wins:0,losses:0,streak:0,best:0,bluff:0,betrayals:0,reflex:null,time:0,hist:[],style:''},ach:[]};
var BOT_BOARD_GAMES=['chess','draughts','ttt','c4','blitz','ludo','snl'];
var BOT_FILL_GAMES=['shadow','spy','hot','split','sv','chaos','impfreq','trust','word','meld','deadrop','heist','chain','bgrid','lsig','dungeon'];
var Save={k:'po5',save:function(){try{localStorage.setItem(this.k,JSON.stringify({p:S.prof,c:S.cfg,a:S.ach}));}catch(e){}},load:function(){try{var d=JSON.parse(localStorage.getItem(this.k)||'null');if(d){if(d.p)Object.assign(S.prof,d.p);if(d.c)Object.assign(S.cfg,d.c);if(d.a)S.ach=d.a;}this.migrateTitles();}catch(e){}},
migrateTitles:function(){
  /* PRSM-P0-01 / G-6 — map old display titles in history; keep game ids */
  var map={'Connect Four':'Four in a Row','Connect 4':'Four in a Row','Codenames':'Clue Grid','Taboo':'Word Dodge','Word Assassin':'Word Dodge','Dead Drop':'Clue Grid','Mind Meld':'Think Alike'};
  var changed=false;
  if(S.prof&&Array.isArray(S.prof.hist)){
    S.prof.hist.forEach(function(h){if(h&&h.g&&map[h.g]){h.g=map[h.g];changed=true;}});
  }
  try{
    var lb=JSON.parse(localStorage.getItem('po5_lb')||'{}');
    Object.keys(lb).forEach(function(id){if(lb[id]&&lb[id].title&&map[lb[id].title]){lb[id].title=map[lb[id].title];changed=true;}});
    if(changed)localStorage.setItem('po5_lb',JSON.stringify(lb));
  }catch(e){}
  if(changed)this.save();
},
reset:function(){localStorage.clear();location.reload();}};

// ═══ EVENT BUS ═══════════════════════════════════════════════════════
var Bus={_l:{},on:function(e,f){(this._l[e]||(this._l[e]=[])).push(f);},emit:function(e,d){(this._l[e]||[]).forEach(function(f){try{f(d);}catch(err){}});}};

// ═══ AUDIO ═══════════════════════════════════════════════════════════
var Snd=(function(){var ctx=null,mg=null;
function init(){try{ctx=new(window.AudioContext||window.webkitAudioContext)();mg=ctx.createGain();mg.gain.value=0.2;mg.connect(ctx.destination);}catch(e){}}
function wake(){if(ctx&&ctx.state==='suspended')ctx.resume();}
function tone(f,tp,dur,g,dl){if(!ctx||!S.cfg.sfx)return;wake();try{var o=ctx.createOscillator(),gn=ctx.createGain(),now=ctx.currentTime+(dl||0);o.type=tp||'sine';o.frequency.setValueAtTime(f,now);gn.gain.setValueAtTime(0,now);gn.gain.linearRampToValueAtTime(g||0.2,now+0.015);gn.gain.exponentialRampToValueAtTime(0.001,now+(dur||0.13));o.connect(gn);gn.connect(mg);o.start(now);o.stop(now+(dur||0.13)+0.04);}catch(e){}}
return{init:init,wake:wake,
click:function(){tone(860,'sine',0.05,0.08);},
ok:function(){tone(440,'sine',0.08,0.17);tone(554,'sine',0.08,0.17,0.08);tone(660,'sine',0.12,0.17,0.17);},
err:function(){tone(150,'sawtooth',0.12,0.17);tone(110,'sawtooth',0.16,0.17,0.08);},
danger:function(){tone(85,'square',0.08,0.25);tone(85,'square',0.08,0.25,0.12);},
reveal:function(){[0,.05,.1,.15,.2].forEach(function(d,i){tone(300+i*80,'sine',0.17,0.2,d);});},
betray:function(){tone(360,'sawtooth',0.04,0.35);tone(170,'sawtooth',0.25,0.35,0.08);},
vote:function(){tone(490,'sine',0.07,0.11);},
blast:function(){tone(75,'sawtooth',0.04,0.42);tone(45,'square',0.32,0.24,0.16);},
pass:function(){tone(580,'sine',0.07,0.16);tone(780,'sine',0.1,0.16,0.08);},
lvlup:function(){[262,294,330,370,392,523].forEach(function(f,i){tone(f,'sine',0.16,0.24,i*0.08);});},
reflex:function(ms){tone(Math.max(150,790-ms*2),'sine',0.05,0.24);},
tick:function(n){tone(n===0?870:410,'sine',0.11,0.24);}
};})();

// ═══ HAPTICS (V1 + V2 combined) ══════════════════════════════════════
var Hap={
l:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate(8);},
m:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate(25);},
h:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([42,15,42]);},
err:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([15,8,15,8,62]);},
ok:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([15,15,48]);},
blast:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([75,24,75,24,160]);},
heartbeat:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([38,55,38,200,38,55,38]);},
panic:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([18,8,18,8,18,8,55,8,18,8,18]);},
heavy:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([75,38,75,38,190]);},
roleReveal:function(isShadow){if(!S.cfg.haptic||!navigator.vibrate)return;if(isShadow)navigator.vibrate([28,18,28,18,95,18,28]);else navigator.vibrate([55,18,190]);},
betray:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([140,28,48,28,140]);}
};

// ═══ BACKGROUND CANVAS (lazy, perf-aware) ════════════════════════════
var BG=(function(){var c,x,pts=[],W=0,H=0,running=false,rafId=0;
function _particleCount(){return(S.cfg.lowPower||S.cfg.perfMode==='eco')?8:22;}
function init(){c=document.getElementById('bg');if(!c)return;x=c.getContext('2d');resize();window.addEventListener('resize',resize,{passive:true});_seed();if(S.cfg.bg&&!S.cfg.lowPower){c.style.display='';start();}else{c.style.display='none';}}
function _seed(){var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a];pts=[];for(var i=0;i<_particleCount();i++)pts.push({x:Math.random(),y:Math.random(),s:Math.random()*1.2+0.3,vx:(Math.random()-.5)*.00022,vy:(Math.random()-.5)*.00022,c:cols[i%cols.length],p:Math.random()*Math.PI*2});}
function resize(){if(!c)return;W=c.width=window.innerWidth;H=c.height=window.innerHeight;}
function start(){if(running||!x||!S.cfg.bg||S.cfg.lowPower)return;if(c)c.style.display='';running=true;loop();}
function stop(){running=false;if(rafId){cancelAnimationFrame(rafId);rafId=0;}if(c)c.style.display='none';}
function loop(){if(!running||!x)return;x.clearRect(0,0,W,H);if(S.cfg.bg&&!S.cfg.lowPower){var eco=S.cfg.perfMode==='eco';if(!eco){x.strokeStyle='rgba(255,255,255,0.008)';x.lineWidth=1;var gs=72;for(var i=0;i<=W;i+=gs){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke();}for(var j=0;j<=H;j+=gs){x.beginPath();x.moveTo(0,j);x.lineTo(W,j);x.stroke();}}var spd=eco?0.008:0.012;pts.forEach(function(p){p.p+=spd;p.x=(p.x+p.vx+1)%1;p.y=(p.y+p.vy+1)%1;x.globalAlpha=Math.sin(p.p)*.08+.08;x.fillStyle=p.c;x.beginPath();x.arc(p.x*W,p.y*H,p.s,0,Math.PI*2);x.fill();});x.globalAlpha=1;}rafId=requestAnimationFrame(loop);}
return{init:init,start:start,stop:stop,_seed:_seed};})();
var PrismPerf={isDebug:function(){return/[?&]debug=1(?:&|$)/.test(location.search);},apply:function(){if(!S||!S.cfg)return;var eco=!!S.cfg.lowPower||S.cfg.perfMode==='eco';document.body.classList.toggle('eco-mode',eco);document.body.classList.toggle('low-power',!!S.cfg.lowPower);document.body.classList.toggle('large-tap',!!S.cfg.largeTap);document.body.classList.toggle('color-blind',!!S.cfg.colorBlind);if(S.cfg.bg&&!S.cfg.lowPower){if(window.BG&&BG.start)BG.start();}else{if(window.BG&&BG.stop)BG.stop();}}};

// ═══ PLAY TRACKER (local most-played insights) ═══════════════════════
var PlayTracker={_k:'po5_plays',
record:function(id){if(!id)return;try{var d=JSON.parse(localStorage.getItem(this._k)||'{}');d[id]=(d[id]||0)+1;localStorage.setItem(this._k,JSON.stringify(d));}catch(e){}},
top:function(n){try{var d=JSON.parse(localStorage.getItem(this._k)||'{}');return Object.keys(d).sort(function(a,b){return d[b]-d[a];}).slice(0,n||3).map(function(id){return{id:id,count:d[id]};});}catch(e){return[];}},
html:function(){var rows=this.top(3);if(!rows.length)return'';return'<div style="margin:0 15px 10px;padding:13px 15px;background:rgba(191,90,242,.07);border:1.5px solid rgba(191,90,242,.2);border-radius:15px"><div style="font-size:.58rem;opacity:.35;text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px">🔥 Most Played</div>'+rows.map(function(r,i){var g=typeof Reg!=='undefined'?Reg.get(r.id):null;if(!g)return'';return'<div style="display:flex;align-items:center;gap:10px;padding:7px 0'+(i<rows.length-1?';border-bottom:1px solid rgba(255,255,255,.06)':'')+'" onclick="GL.launch(\''+r.id+'\')"><div style="width:28px;text-align:center;font-size:1.1rem">'+g.icon+'</div><div style="flex:1"><div style="font-weight:700;font-size:.84rem">'+g.title+'</div><div style="font-size:.65rem;opacity:.38">'+r.count+' launch'+(r.count===1?'':'es')+'</div></div><div style="opacity:.25;font-size:.72rem">▶</div></div>';}).join('')+'</div>';}};

// ═══ TOAST ═══════════════════════════════════════════════════════════
var _tt=null;
function toast(msg,dur,dir){var el=document.getElementById('toast');el.textContent=msg;el.className='show'+(dir?' dir':'');if(_tt)clearTimeout(_tt);_tt=setTimeout(function(){el.className='';},dur||2400);}

// ═══ MODAL ═══════════════════════════════════════════════════════════
var Modal={_cb:null,open:function(html,cb){var ov=document.getElementById('ov'),m=document.getElementById('modal');document.getElementById('mc').innerHTML=html;ov.className='open';setTimeout(function(){m.classList.add('open');},10);this._cb=cb;ov.onclick=function(e){if(e.target===ov)Modal.close();};Snd.click();},close:function(){var ov=document.getElementById('ov'),m=document.getElementById('modal');m.classList.remove('open');setTimeout(function(){ov.className='';if(Modal._cb)Modal._cb();},300);}};

// ═══ NAVIGATION ══════════════════════════════════════════════════════
var Nav={go:function(scr){var prev=S.cur;if(prev===scr&&scr!=='game')return;document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('on');});var el=document.getElementById(scr+'-screen');if(el)el.classList.add('active');var ni=document.querySelector('.ni[data-s="'+scr+'"]');if(ni)ni.classList.add('on');S.cur=scr;document.title=(scr.charAt(0).toUpperCase()+scr.slice(1).replace(/-/g," "))+" — PrismCap";var nav=document.getElementById('nav');if(nav)nav.className=scr==='game'?'hide':'';if(scr==='dashboard'){UI.dash();}if(scr==='profile'){UI.prof();}if(scr==='home'){UI.home();}if(scr==='arcade'){Arcade.build();}if(scr==='game'&&S.game){var gr=document.getElementById('gright');if(gr)gr.innerHTML='<div style="display:flex;gap:6px;align-items:center"><button type="button" onclick="QRSync.showTransfer(S.game)" style="font-size:.68rem;opacity:.38;cursor:pointer;background:none;border:none;color:'+PCBrand.h_fff+';padding:3px" title="Transfer">📡</button><button type="button" onclick="if(S.game){Suspend.save(S.game,S.game.gs,{});GL.exitGame();}" style="font-size:.68rem;opacity:.38;cursor:pointer;background:none;border:none;color:'+PCBrand.h_fff+';padding:3px" title="Suspend">💾</button><span style="opacity:.32;font-size:.73rem">'+(S.game.mp?'👥 '+S.game.players.length:'🎮')+'</span></div>';}Snd.click();Hap.l();}};
window.Nav = Nav;

// ═══ PASS & PLAY ═════════════════════════════════════════════════════
/* PRSM-P1-04 — pass interstitial + aria-live turn announcements */
var GameShell={
  announceTurn:function(playerName){
    var live=document.getElementById('turn-live');
    if(!live){
      live=document.createElement('div');
      live.id='turn-live';
      live.className='sr-only';
      live.setAttribute('aria-live','polite');
      live.setAttribute('aria-atomic','true');
      document.body.appendChild(live);
    }
    live.textContent='Pass to '+(playerName||'next player');
  },
  passTo:function(player,role,secret,cb){
    var name=player&&player.name?player.name:'Player';
    var av=player&&player.av?player.av:'🎮';
    this.announceTurn(name);
    PP.show(name,av,role||('Pass to '+name),secret,cb);
  }
};
var PP={show:function(name,av,role,secret,cb){var ps=document.getElementById('pass');document.getElementById('pav').textContent=av;document.getElementById('pnm').textContent=name;document.getElementById('prl').textContent=role||('Pass to '+name);document.getElementById('pass-c').style.display='flex';document.getElementById('pass-rv').style.display='none';var btn=document.querySelector('#pass-c button');if(btn)btn.style.display='block';ps.className='on';S.passCb={secret:secret,cb:cb};if(typeof GameShell!=='undefined')GameShell.announceTurn(name);Snd.pass();Hap.m();},
reveal:function(){var cb=S.passCb;if(!cb)return;document.getElementById('pass-c').style.display='none';var rv=document.getElementById('pass-rv');rv.style.display='block';rv.innerHTML=cb.secret;Snd.reveal();Hap.h();setTimeout(function(){rv.innerHTML+='<button type="button" class="btn bw bf" style="margin-top:18px;max-width:250px;display:block;margin-left:auto;margin-right:auto" onclick="PP.done()">✓ Got it — Continue</button>';},400);},
done:function(){var cb=S.passCb;document.getElementById('pass').className='';S.passCb=null;if(cb&&cb.cb)cb.cb();}};

// ═══ XP & RANKS ══════════════════════════════════════════════════════
var XP={ranks:['Rookie','Operative','Agent','Specialist','Veteran','Elite','Phantom','Shadow','Ghost','Legend'],tbl:[0,100,250,450,700,1000,1400,1900,2500,3200],
add:function(n,mult){var m=mult||1;var total=Math.round(n*m);var prev=S.prof.lvl;S.prof.xp+=total;S.prof.lvl=this.lvl(S.prof.xp);if(S.prof.lvl>prev){Snd.lvlup();Hap.ok();toast('⬆️ Level Up! '+this.rank(S.prof.lvl));}Save.save();},
lvl:function(xp){for(var i=this.tbl.length-1;i>=0;i--){if(xp>=this.tbl[i])return i+1;}return 1;},
rank:function(l){return this.ranks[Math.min(l-1,this.ranks.length-1)];},
pct:function(xp){var l=this.lvl(xp),i=l-1,c=this.tbl[i]||0,n=this.tbl[i+1]||c+1000;return((xp-c)/(n-c))*100;},
nxt:function(xp){var l=this.lvl(xp),i=l-1;return(this.tbl[i+1]||99999)-xp;}};

// ═══ ACHIEVEMENTS ════════════════════════════════════════════════════
var Ach={all:[{id:'g1',i:'🎮',n:'First Launch',d:'Play your first game',xp:50},{id:'w1',i:'🏆',n:'Winner',d:'Win your first game',xp:100},{id:'w10',i:'👑',n:'Champion',d:'Win 10 games',xp:250},{id:'bet',i:'🗡️',n:'Betrayer',d:'First betrayal',xp:75},{id:'s3',i:'🔥',n:'On Fire',d:'3-game win streak',xp:150},{id:'s5',i:'💥',n:'Unstoppable',d:'5-game win streak',xp:300},{id:'blf',i:'🃏',n:'Master Bluffer',d:'Fool 5 players',xp:200},{id:'r200',i:'⚡',n:'Lightning',d:'Sub 200ms reflex',xp:200},{id:'r150',i:'🌩️',n:'Thunder',d:'Sub 150ms reflex',xp:400},{id:'m10',i:'🧠',n:'Sharp Mind',d:'Memory level 10',xp:200},{id:'p25',i:'🎯',n:'Devoted',d:'Play 25 games',xp:300},{id:'p50',i:'🌟',n:'Veteran',d:'Play 50 games',xp:500},{id:'all',i:'🎰',n:'Explorer',d:'Try every game',xp:750},{id:'owl',i:'🌙',n:'Night Owl',d:'Play after midnight',xp:100},{id:'daily5',i:'📅',n:'Daily Grinder',d:'Complete 5 daily challenges',xp:350},{id:'surv10',i:'🛡️',n:'Survivor',d:'Survive 10 rounds in any survival game',xp:180}],
unlock:function(id){if(S.ach.includes(id))return;var a=this.all.find(function(x){return x.id===id;});if(!a)return;S.ach.push(id);toast('🏆 '+a.n+'! +'+a.xp+'XP');XP.add(a.xp);Save.save();},
check:function(){var p=S.prof;if(p.games>=1)this.unlock('g1');if(p.wins>=1)this.unlock('w1');if(p.wins>=10)this.unlock('w10');if(p.betrayals>=1)this.unlock('bet');if(p.best>=3)this.unlock('s3');if(p.best>=5)this.unlock('s5');if(p.games>=25)this.unlock('p25');if(p.games>=50)this.unlock('p50');if(new Date().getHours()<5)this.unlock('owl');}};

// ═══ DRAMA ENGINE (now fully wired) ══════════════════════════════════
var Drama={
state:{tension:0,trust:{},paranoia:{},momentum:'neutral'},
reset:function(players){var self=this;this.state.tension=0;this.state.trust={};this.state.paranoia={};players.forEach(function(p){self.state.trust[p.id]=50;self.state.paranoia[p.id]=20;});this.state.momentum='neutral';},
tick:function(ev){if(ev==='betray'){this.state.tension=Math.min(100,this.state.tension+22);}else if(ev==='vote'){this.state.tension=Math.min(100,this.state.tension+7);}else if(ev==='win'){this.state.tension=Math.max(0,this.state.tension-12);}else{this.state.tension=Math.min(100,this.state.tension+3);}this.state.momentum=this.state.tension>85?'critical':this.state.tension>65?'escalating':'neutral';Bus.emit('drama:tick',this.state);this._updateBanner();},
_updateBanner:function(){var b=this.getBanner();var el=document.getElementById('tension-bar');if(!el)return;if(b&&S.cur==='game'){el.style.display='flex';el.style.background=b.col+'22';el.style.color=b.col;el.style.borderBottom='1px solid '+b.col+'44';el.textContent=b.text;}else{el.style.display='none';}},
getEvent:function(){var t=this.state.tension;var e={low:['A strange silence falls.','Someone is watching carefully.'],mid:['Trust levels dropping.','Paranoia spreads through the ranks.','An alliance may be forming — or breaking.'],high:['⚠️ Multiple deception patterns detected.','Trust has collapsed. Betrayal imminent.'],peak:['🚨 CHAOS THRESHOLD REACHED.','No one trusts anyone anymore.']};var pool=t<30?e.low:t<60?e.mid:t<85?e.high:e.peak;return pool[Math.floor(Math.random()*pool.length)];},
getBanner:function(){var t=this.state.tension;if(t>85)return{text:'🚨 CRITICAL TENSION',col:PCBrand.h_ff2d55};if(t>60)return{text:'⚠️ ESCALATING',col:PCBrand.h_ff6b00};if(t>35)return{text:'👁 MONITORING',col:PCBrand.h_ffd60a};return null;}};

// ═══ DIRECTOR ENGINE ═════════════════════════════════════════════════
var Director={
state:{intensity:0.3,phase:'buildup',round:0},
curve:[0.2,0.3,0.5,0.65,0.8,0.9,0.75,0.95,1.0,0.85],
init:function(pc){this.state.intensity=0.3;this.state.phase='buildup';this.state.round=0;},
next:function(){this.state.round++;var idx=Math.min(this.state.round,this.curve.length-1);this.state.intensity=this.curve[idx];this.state.phase=this.state.round<=2?'buildup':this.state.round<=5?'rising':this.state.round<=7?'peak':'climax';Announcer.phaseChange();return this.state;},
chaos:function(){return Math.random()<this.state.intensity*0.38;},
announce:function(){var m={buildup:['Phase: INFILTRATION','Agents deployed. Trust wisely.'],rising:['Phase: ESCALATION','Tensions rising. Betrayals imminent.'],peak:['Phase: CRITICAL MASS','⚠️ All safeguards off.'],climax:['ENDGAME PROTOCOL','🚨 Final phase. No mercy.']};var p=m[this.state.phase]||m.buildup;return p[Math.floor(Math.random()*p.length)];}};

// ═══ ANNOUNCER ═══════════════════════════════════════════════════════
var Announcer={_q:[],_t:null,
say:function(msg,dur){this._q.push({msg:msg,dur:dur||2600});this._flush();},
_flush:function(){if(this._t||!this._q.length)return;var item=this._q.shift();toast('[DIRECTOR] '+item.msg,item.dur,true);var self=this;this._t=setTimeout(function(){self._t=null;self._flush();},item.dur+280);},
betray:function(name){this.say(name+' just made a move.',2800);},
tension:function(){this.say(Drama.getEvent(),3000);},
gameStart:function(title,n){this.say('▶ '+title+' — '+n+' operatives.',2600);},
win:function(name){this.say('🏆 '+name+' dominates. Session complete.',2800);},
phaseChange:function(){this.say(Director.announce(),2800);}};

// ═══ SESSION MEMORY (properly wired) ════════════════════════════════
var Memory={_k:'po5_mem',data:{rivalries:{},session:{betrayals:0},history:[]},
load:function(){try{var d=JSON.parse(localStorage.getItem(this._k)||'null');if(d)Object.assign(this.data,d);}catch(e){}},
save:function(){try{localStorage.setItem(this._k,JSON.stringify(this.data));}catch(e){}},
recordBetrayal:function(fromName,toName){var k=fromName+'->'+toName;if(!this.data.rivalries[k])this.data.rivalries[k]={from:fromName,to:toName,count:0};this.data.rivalries[k].count++;this.data.session.betrayals++;this.save();Announcer.betray(fromName);Drama.tick('betray');},
getInsight:function(name){var msgs=[];Object.values(this.data.rivalries).forEach(function(r){if(r.from===name&&r.count>0)msgs.push('You\'ve betrayed '+r.to+' '+r.count+'× before');if(r.to===name&&r.count>0)msgs.push(r.from+' has betrayed you '+r.count+'× in past sessions');});return msgs.length?msgs[0]:null;}};

// ═══ SUSPEND SYSTEM ══════════════════════════════════════════════════
var Suspend={_k:'po5_sus',
save:function(game,gs,meta){if(!game)return;var snap={id:game.id,title:game.title,icon:game.icon,col:game.col,gs:JSON.parse(JSON.stringify(gs)),players:JSON.parse(JSON.stringify(game.players)),ts:Date.now(),meta:meta||{}};try{localStorage.setItem(this._k,JSON.stringify(snap));}catch(e){}toast('💾 Saved — resume anytime');},
load:function(){try{return JSON.parse(localStorage.getItem(this._k)||'null');}catch(e){return null;}},
clear:function(){localStorage.removeItem(this._k);},
has:function(){return!!localStorage.getItem(this._k);},
resume:function(){var snap=this.load();if(!snap)return false;var game=Reg.get(snap.id);if(!game)return false;game.players=snap.players;game.gs=snap.gs;game.t0=Date.now();S.game=game;Nav.go('game');document.getElementById('gtitle').textContent=game.title;document.getElementById('gbody').style.setProperty('--acc',game.col);game.render();toast('▶ Resuming '+game.title);return true;}};

// ═══ DAILY CHALLENGE ════════════════════════════════════════════════
var Daily={
all:[{id:'reflex_200',title:'Lightning Hands',desc:'Get sub-200ms reflex',game:'reflex',xp:150,icon:'⚡',check:function(){return S.prof.reflex&&S.prof.reflex<200;}},{id:'memory_8',title:'Matrix Mind',desc:'Reach level 8 in Memory Matrix',game:'mem',xp:200,icon:'🧠',check:function(){return false;}},{id:'survive_12',title:'AI Survivor',desc:'Survive 12 turns in AI Survival',game:'aisurv',xp:175,icon:'🤖',check:function(){return false;}},{id:'chaos_card',title:'Chaos Master',desc:'Play a full Chaos Cards game',game:'chaos',xp:160,icon:'🃏',check:function(){return false;}},{id:'spy_win',title:'Spy Hunter',desc:'Win a game of Spy Hunt',game:'spy',xp:140,icon:'👁️',check:function(){return false;}},{id:'tap_80',title:'Tap God',desc:'Get 80+ taps in Quick Tap',game:'qtap',xp:165,icon:'👆',check:function(){return false;}},{id:'decode_5',title:'Code Breaker',desc:'Decode 5 signals in one session',game:'decode',xp:190,icon:'🔐',check:function(){return false;}},{id:'maze_3',title:'Maze Runner',desc:'Complete 3 maze levels',game:'maze',xp:130,icon:'🌀',check:function(){return false;}},{id:'rhythm_10',title:'Beat Master',desc:'Reach x10 combo in Rhythm Pulse',game:'rhythm',xp:155,icon:'🎵',check:function(){return false;}},{id:'reflex_150',title:'Thunder Strike',desc:'Get sub-150ms reflex',game:'reflex',xp:220,icon:'🌩️',check:function(){return S.prof.reflex&&S.prof.reflex<150;}}],
getToday:function(){var d=new Date();var seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();return this.all[seed%this.all.length];},
isDone:function(){return!!localStorage.getItem('po5_d_'+new Date().toDateString());},
complete:function(){var ch=this.getToday();var k='po5_d_'+new Date().toDateString();if(localStorage.getItem(k))return;localStorage.setItem(k,'1');XP.add(ch.xp);var dc=(parseInt(localStorage.getItem('po5_dc')||'0'))+1;localStorage.setItem('po5_dc',dc);if(dc>=5)Ach.unlock('daily5');toast('🎯 Daily Complete! +'+ch.xp+' XP');Announcer.say('Daily mission complete. Outstanding.',2800);},
completeForGame:function(gameId){var ch=this.getToday();if(this.isDone())return;if(ch.game===gameId)this.complete();},
checkComplete:function(gameId){var ch=this.getToday();if(this.isDone())return;if(ch.game===gameId&&(ch.check&&ch.check()||false))this.complete();}};

// ═══ MUTATOR SYSTEM (now with game reads) ════════════════════════════
var Mutators={
all:[{id:'speed',name:'Speed Round',icon:'⏱️',desc:'Timers halved',col:PCBrand.h_ff6b00},{id:'silent',name:'Silent Mode',icon:'🤫',desc:'No talking',col:PCBrand.h_888},{id:'chaos',name:'Double Chaos',icon:'🌀',desc:'2× chaos events',col:PCBrand.h_bf5af2},{id:'sudden',name:'Sudden Death',icon:'💀',desc:'One miss = eliminated',col:PCBrand.h_ff2d55},{id:'blind',name:'Blind',icon:'🙈',desc:'Scores hidden',col:PCBrand.h_64d2ff},{id:'elite',name:'Elite Mode',icon:'🔥',desc:'Triple XP',col:PCBrand.h_ffd60a},{id:'corrupt',name:'Corrupted',icon:'👾',desc:'UI glitches',col:PCBrand.h_8888ff}],
active:[],
presets:[],
_presKey:'po5_presets',
loadPresets:function(){try{this.presets=JSON.parse(localStorage.getItem(this._presKey)||'[]');}catch(e){this.presets=[];}},
savePresets:function(){try{localStorage.setItem(this._presKey,JSON.stringify(this.presets));}catch(e){}},
// Read helpers - called by games
speed:function(base){return this.has('speed')?Math.round(base/2):base;},
hasBlind:function(){return this.has('blind');},
hasSudden:function(){return this.has('sudden');},
xpMult:function(){return this.has('elite')?3:1;},
hasChaos:function(){return this.has('chaos');},
has:function(id){return this.active.some(function(m){return m.id===id;});},
apply:function(){if(this.has('silent'))toast('🤫 SILENT MODE — No talking!');if(this.has('corrupt')){setInterval(function(){if(Math.random()<0.1){var el=document.getElementById('gbody');if(el){el.style.filter='hue-rotate(25deg)';setTimeout(function(){el.style.filter='';},80);}}},2000);}},
showPicker:function(cb){var self=this;var sel=this.active.map(function(m){return m.id;});Modal.open('<div><div style="font-size:1.05rem;font-weight:800;margin-bottom:3px">⚙️ Mutators</div><div style="font-size:.76rem;opacity:.38;margin-bottom:14px">Choose up to 3 game modifiers</div><div style="display:flex;flex-direction:column;gap:7px">'+this.all.map(function(m){var on=sel.includes(m.id);return'<div class="pchip" style="cursor:pointer;background:'+(on?m.col+'22':'rgba(255,255,255,.04)')+';border-color:'+(on?m.col+'55':'var(--border)')+'" onclick="window._mut(\''+m.id+'\')"><div style="font-size:1.3rem">'+m.icon+'</div><div style="flex:1"><div style="font-weight:700;font-size:.84rem">'+m.name+'</div><div style="font-size:.68rem;opacity:.38">'+m.desc+'</div></div>'+(on?'<div style="color:'+m.col+';font-weight:800;font-size:.8rem">ON</div>':'<div style="opacity:.25;font-size:.8rem">off</div>')+'</div>';}).join('')+'</div><div style="margin-top:12px"><div style="font-size:.68rem;opacity:.35;margin-bottom:7px;text-transform:uppercase;letter-spacing:.1em">Saved Presets</div>'+
(this.presets.length?this.presets.map(function(pr,i){return'<div style="display:flex;align-items:center;gap:8px;padding:9px 11px;background:rgba(255,255,255,.04);border-radius:10px;margin-bottom:6px;cursor:pointer" onclick="window._loadpreset('+i+')"><div style="flex:1"><div style="font-size:.82rem;font-weight:700">'+pr.name+'</div><div style="font-size:.68rem;opacity:.35">'+pr.ids.join(', ')+'</div></div><div style="font-size:.72rem;opacity:.4">Load</div></div>';}).join(''):'<div style="opacity:.28;font-size:.78rem;text-align:center;padding:8px">No saved presets</div>')+
'</div><div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="btn bg" style="flex:1" onclick="window._savepreset()">💾 Save Preset</button><button type="button" class="btn bw" style="flex:1" onclick="window._mutdone()">Apply →</button></div></div>');
window._mut=function(id){var idx=sel.indexOf(id);if(idx>-1)sel.splice(idx,1);else{if(sel.length>=3){toast('Max 3 mutators');return;}sel.push(id);}self.active=self.all.filter(function(m){return sel.includes(m.id);});Modal.close();setTimeout(function(){self.showPicker(cb);},260);Snd.click();};
window._mutdone=function(){Modal.close();setTimeout(cb,260);};
window._savepreset=function(){
  if(typeof CapPrompt!=='function')return;
  CapPrompt({title:'Name this preset',placeholder:'Preset name',confirmLabel:'Save'}).then(function(nm){
    if(!nm)return;
    self.presets.push({name:nm,ids:sel});
    self.savePresets();
    toast('Preset saved!');
  });
};
window._loadpreset=function(i){sel=self.presets[i].ids.slice();self.active=self.all.filter(function(m){return sel.includes(m.id);});Modal.close();setTimeout(function(){self.showPicker(cb);},260);};}};

// ═══ META PROGRESSION ════════════════════════════════════════════════
var Meta={_k:'po5_meta',data:{unlocked:[]},
unlockables:[{id:'theme_cyber',type:'theme',name:'Cyberpunk',req:{xp:500},icon:'🟢',rare:false},{id:'theme_horror',type:'theme',name:'Horror',req:{xp:800},icon:'🔴',rare:false},{id:'theme_gold',type:'theme',name:'Gold',req:{wins:20},icon:'🟡',rare:false},{id:'theme_synth',type:'theme',name:'Synthwave',req:{xp:1200},icon:'🩷',rare:true},{id:'theme_glitch',type:'theme',name:'⚡ GLITCH',req:{xp:2500},icon:'👾',rare:true,legendary:true},{id:'title_shadow',type:'title',name:'Shadow Operative',req:{xp:600},icon:'👻',rare:false},{id:'title_ghost',type:'title',name:'Ghost Protocol',req:{xp:2000},icon:'☠️',rare:true,legendary:true},{id:'daily_5',type:'badge',name:'Daily Grinder',req:{xp:0,dailyDone:5},icon:'📅',rare:false}],
load:function(){try{var d=JSON.parse(localStorage.getItem(this._k)||'null');if(d)Object.assign(this.data,d);}catch(e){}},
save:function(){try{localStorage.setItem(this._k,JSON.stringify(this.data));}catch(e){}},
isUnlocked:function(id){return this.data.unlocked.includes(id);},
check:function(prof){var self=this,news=[];this.unlockables.forEach(function(u){if(self.data.unlocked.includes(u.id))return;var r=u.req,ok=true;if(r.xp&&(prof.xp||0)<r.xp)ok=false;if(r.wins&&(prof.wins||0)<r.wins)ok=false;if(r.games&&(prof.games||0)<r.games)ok=false;if(ok){self.data.unlocked.push(u.id);news.push(u);self.save();}});news.forEach(function(u,i){setTimeout(function(){toast((u.legendary?'🌟 LEGENDARY: ':'✨ Unlocked: ')+u.name);if(u.legendary){Snd.lvlup();Hap.heavy();}else{Snd.ok();}},i*1300);});},
getProgress:function(id){var u=this.unlockables.find(function(x){return x.id===id;});if(!u||!u.req)return 100;var p=S.prof,r=u.req;if(r.xp&&r.xp>0)return Math.min(100,Math.round((p.xp||0)/r.xp*100));if(r.wins&&r.wins>0)return Math.min(100,Math.round((p.wins||0)/r.wins*100));return 0;}};

// ═══ AI ENGINE ═══════════════════════════════════════════════════════
var AI={
evt:function(t){var e={shadow:['Hidden comms detected. Send one anonymous message.','Emergency vote! Fastest wins.','Double agent activated.','Blackout — all roles hidden.','New mission objective.','Loyalty called into question.','False intel distributed.'],chaos:['SILENCE: 30 seconds, no talking.','REVERSAL: Loser gains a bonus.','SPEED: All actions in 10s.','BETRAYAL WINDOW: 20s to switch sides.'],dungeon:['Secret vault in corridor.','Trap activates — floor shakes.','Merchant appears with rare gear.','Enemy reinforcements.','Hidden passage found.','Healing fountain — one drink.']};var pool=e[t]||e.chaos;return pool[Math.floor(Math.random()*pool.length)];},
roles:function(n){var base=[{name:'Field Agent',icon:'🕵️',team:'res',power:'Vote manipulation once',col:PCBrand.h_00d4ff},{name:'Corrupted Agent',icon:'🦹',team:'shadow',power:'Sabotage one vote silently',col:PCBrand.h_ff2d55},{name:'Analyst',icon:'🔍',team:'res',power:'Peek at one alignment',col:PCBrand.h_30d158},{name:'Sleeper',icon:'😴',team:'shadow',power:'Hidden until Round 3',col:PCBrand.h_bf5af2},{name:'Medic',icon:'💊',team:'res',power:'Block one elimination',col:PCBrand.h_64d2ff},{name:'Handler',icon:'📟',team:'shadow',power:'Frame another player',col:PCBrand.h_ff6b00},{name:'Ghost',icon:'👻',team:'res',power:'Skip one vote unseen',col:PCBrand.h_888},{name:'Double Agent',icon:'🎭',team:'wild',power:'Switch sides once',col:PCBrand.h_ffd60a}];var sh=[].concat(base).sort(function(){return Math.random()-.5;});var max=Math.max(1,Math.floor(n*.25)),roles=[],sw=0;for(var i=0;i<n;i++){var r=sh[i%sh.length];if(r.team==='shadow'&&sw<max){roles.push(Object.assign({},r));sw++;}else if(r.team!=='shadow'){roles.push(Object.assign({},r));}else{roles.push(Object.assign({},base[0]));}}return roles.sort(function(){return Math.random()-.5;});},
bluffs:[{t:'The average person walks 100,000 miles in a lifetime',l:'The average person walks 50,000 miles'},{t:'Honey never expires — 3000-year-old honey found edible',l:'Honey expires after 2 years'},{t:'Octopuses have three hearts',l:'Octopuses have two hearts'},{t:'A day on Venus is longer than a year on Venus',l:'A year on Venus is longer than a day'},{t:'Hot water can freeze faster than cold water (Mpemba)',l:'Cold water always freezes faster'},{t:'Crows recognize faces and hold grudges',l:'Crows have very poor individual memory'},{t:'Bananas are berries but strawberries are not',l:'Strawberries are berries but bananas are not'},{t:'Oxford University is older than the Aztec Empire',l:'The Aztec Empire is older than Oxford'},{t:'Nintendo was founded in 1889',l:'Nintendo was founded in 1985'},{t:'Cleopatra lived closer to the Moon landing than to the pyramids',l:'Cleopatra lived closer to the pyramids than the Moon landing'},{t:'You cannot hum with your nose pinched closed',l:'You can hum with your nose pinched'},{t:'It rains diamonds on Neptune',l:'It rains sulfuric acid on Neptune'},{t:'The shortest war lasted 38-45 minutes',l:'The shortest war lasted 6 hours'}],
chaos:[{tp:'challenge',i:'⚡',txt:'Everyone does 5 push-ups or loses a point.',c:PCBrand.h_ff6b00},{tp:'sabotage',i:'💣',txt:'Choose a player. They skip their next turn.',c:PCBrand.h_ff2d55},{tp:'alliance',i:'🤝',txt:'Form a secret alliance with the player to your left.',c:PCBrand.h_30d158},{tp:'bluff',i:'🎭',txt:'Lie about your score. Others must guess the real one.',c:PCBrand.h_bf5af2},{tp:'memory',i:'🧠',txt:'Remember: 847291. You will be tested later.',c:PCBrand.h_64d2ff},{tp:'strategy',i:'♟️',txt:'Take 3 points from any one player.',c:PCBrand.h_00d4ff},{tp:'betrayal',i:'🗡️',txt:'Secretly vote to eliminate a player this round.',c:PCBrand.h_ff2d55},{tp:'chaos',i:'🌀',txt:'All players swap scores with the person to their left.',c:PCBrand.h_ff6b00},{tp:'truth',i:'🔮',txt:'Ask any player a yes/no question. They must answer truthfully.',c:PCBrand.h_30d158},{tp:'speed',i:'⏱️',txt:'Name 5 countries in 10 seconds or lose 2 points.',c:PCBrand.h_ff6b00},{tp:'deal',i:'💰',txt:'Offer any player a deal. Refuse = both lose 1 point.',c:PCBrand.h_ffd60a},{tp:'mystery',i:'❓',txt:'Draw 2 chaos cards. Choose which one applies.',c:PCBrand.h_bf5af2},{tp:'reverse',i:'🔄',txt:'Highest scorer gives 2 points to the lowest.',c:PCBrand.h_00d4ff},{tp:'bonus',i:'⭐',txt:'Impression of another player. Everyone laughs = +3 pts.',c:PCBrand.h_ffd60a},{tp:'silence',i:'🤫',txt:'No talking for 60 seconds. Hand signals only.',c:PCBrand.h_888},{tp:'double',i:'✌️',txt:'Everything scores double this round.',c:PCBrand.h_30d158},{tp:'wildcard',i:'🃏',txt:'You create the rule. Everyone follows.',c:PCBrand.h_ff6b00}],
room:function(){var r=[{n:'Armory',i:'⚔️',dan:.2},{n:'Dark Vault',i:'🔒',dan:.3},{n:'Healing Chamber',i:'💊',dan:0},{n:'Trap Room',i:'💀',dan:.8},{n:'Market',i:'🛒',dan:.1},{n:'Boss Chamber',i:'👹',dan:.9},{n:'Shrine',i:'🛕',dan:.4},{n:'Library',i:'📚',dan:0}];return r[Math.floor(Math.random()*r.length)];},
sevts:[{i:'🔋',t:'Power surge! +15 energy.'},{i:'⚠️',t:'Hostile approaching sector 4.'},{i:'💡',t:'Abandoned cache. Risk it?'},{i:'🌪️',t:'Malfunction! -10 resources.'},{i:'⭐',t:'Efficiency exceeded. Bonus!'},{i:'🕳️',t:'Sensor anomaly. Something is wrong.'},{i:'📡',t:'Unknown signal. Another survivor?'},{i:'🚨',t:'CRITICAL: Life support at 15%.'}],
mission:function(){var m=['Identify corrupted agents before extraction.','Protect the data core for 5 rounds.','Collect 3 intelligence fragments.','Survive until reinforcements — trust no one.','Find the agent with the detonator.','Complete objective under comms blackout.'];return m[Math.floor(Math.random()*m.length)];}};

// ═══ THEME ENGINE (now with glitch theme) ════════════════════════════
var Theme={list:[{id:'',nm:'Minimal',i:'⬛',bg:[PCBrand.h_000,PCBrand.h_111]},{id:'t-cyber',nm:'Cyberpunk',i:'🟢',bg:[PCBrand.h_001a0e,PCBrand.h_003320],req:'theme_cyber'},{id:'t-neon',nm:'Neon',i:'🟣',bg:[PCBrand.h_0d001a,PCBrand.h_1a0033]},{id:'t-term',nm:'Terminal',i:'💻',bg:[PCBrand.h_000500,PCBrand.h_001400]},{id:'t-horror',nm:'Horror',i:'🔴',bg:[PCBrand.h_050000,PCBrand.h_200000],req:'theme_horror'},{id:'t-space',nm:'Deep Space',i:'🔵',bg:[PCBrand.h_00000d,PCBrand.h_00001a]},{id:'t-gold',nm:'Gold',i:'🟡',bg:[PCBrand.h_0a0800,PCBrand.h_1a1400],req:'theme_gold'},{id:'t-synth',nm:'Synthwave',i:'🩷',bg:[PCBrand.h_0d0010,PCBrand.h_1a0020],req:'theme_synth'},{id:'t-mid',nm:'Midnight',i:'🔮',bg:[PCBrand.h_05050f,PCBrand.h_0a0a1e]},{id:'t-red',nm:'Red Alert',i:'🚨',bg:[PCBrand.h_0f0000,PCBrand.h_1f0000]},{id:'t-glitch',nm:'GLITCH',i:'👾',bg:[PCBrand.h_000,PCBrand.h_001a1a],req:'theme_glitch',legendary:true}],
apply:function(id){document.body.className='';if(id)document.body.classList.add(id);S.cfg.theme=id;Save.save();},
build:function(el){if(!el)return;el.innerHTML='';var self=this;this.list.forEach(function(th){var locked=th.req&&!Meta.isUnlocked(th.req);var d=document.createElement('div');d.className='ttile'+(S.cfg.theme===th.id?' act':'')+(locked?' locked-tile':'');d.style.background='linear-gradient(135deg,'+th.bg[0]+','+th.bg[1]+')';d.style.opacity=locked?'0.38':'1';d.innerHTML='<div style="height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:9px"><div style="font-size:1.2rem">'+(locked?'🔒':th.i)+'</div><div style="font-size:.58rem;font-weight:700">'+(th.legendary?'★ ':'')+th.nm+'</div></div>';d.onclick=function(){if(locked){toast('🔒 Unlock required');return;}self.apply(th.id);el.querySelectorAll('.ttile').forEach(function(x){x.classList.remove('act');});d.classList.add('act');Hap.m();toast('Theme: '+th.nm);};el.appendChild(d);});}};

// ═══ PERSONA ENGINE ══════════════════════════════════════════════════
var Persona={types:{aggressive:{label:'Aggressor',icon:'⚔️',traits:['Votes fast','Targets strong players']},deceptive:{label:'Shadow',icon:'🎭',traits:['Lies often','Builds false alliances']},strategic:{label:'Architect',icon:'♟️',traits:['Plans ahead','Votes tactically']},chaotic:{label:'Chaos Agent',icon:'🌀',traits:['Unpredictable','Random actions']},survivor:{label:'Survivor',icon:'🛡️',traits:['Defensive','Hides intentions']}},
analyze:function(p){var w=p.wins||0,b=p.betrayals||0,g=Math.max(1,p.games||1),bl=p.bluff||0,wr=w/g;if(b/g>0.3)return this.types.deceptive;if(wr>0.6&&b<3)return this.types.strategic;if(bl>5)return this.types.deceptive;if(wr<0.3)return this.types.chaotic;if(wr>0.5)return this.types.aggressive;return this.types.survivor;},
getTitle:function(p){var l=XP.lvl(p.xp||0),w=p.wins||0,b=p.betrayals||0;if(l>=10&&w>50)return'👻 Ghost Operative';if(b>20)return'🗡️ Master Betrayer';if(w>30)return'👑 Elite Strategist';if(l>=7)return'🔥 Phantom Agent';if(l>=5)return'⚡ Veteran';if(p.bluff>10)return'🎭 Shadow Bluffer';if(w>10)return'🏆 Rising Champion';return'🔰 Field Operative';}};

// ═══ GAME REGISTRY & BASE ════════════════════════════════════════════
var Reg={list:[],add:function(g){this.list.push(g);},get:function(id){return this.list.find(function(g){return g.id===id;});},mp:function(){return this.list.filter(function(g){return g.mp;});},solo:function(){return this.list.filter(function(g){return!g.mp;});},byCat:function(c){if(c==='all')return this.list;if(c==='multiplayer')return this.mp();if(c==='solo')return this.solo();return this.list.filter(function(g){return g.cat===c||g.type===c;});},board:function(){var ids=['chess','draughts','ttt','c4','ludo','snl'];return this.list.filter(function(g){return g.type==='board'||ids.indexOf(g.id)>-1;});}};
function Game(cfg){Object.assign(this,cfg);this.players=[];this.gs={};this.t0=null;}
Game.prototype.setup=function(pl){this.players=pl;this.t0=Date.now();};
Game.prototype.shuf=function(a){return[].concat(a).sort(function(){return Math.random()-.5;});};
Game.prototype.timerMs=function(base){return Mutators.speed(base);};// mutator-aware timer
var Leaderboard={k:'po5_lb',all:function(){try{return JSON.parse(localStorage.getItem(this.k)||'{}');}catch(e){return {};}},best:function(id){var e=this.all()[id];return e&&e.best?e.best:0;},record:function(id,title,score){if(typeof score!=='number'||!isFinite(score))return this.best(id);var lb=this.all();var prev=(lb[id]&&lb[id].best)||0;if(score>prev){lb[id]={best:score,title:title||id,ts:Date.now()};try{localStorage.setItem(this.k,JSON.stringify(lb));}catch(e){}return score;}return prev;}};
Game.prototype.done=function(winner){
  var dur=Math.floor((Date.now()-(this.t0||Date.now()))/60000);
  S.prof.games++;S.prof.time+=dur;
  var tried=JSON.parse(localStorage.getItem('po5t')||'[]');
  tried.push(this.id);tried=[...new Set(tried)];
  localStorage.setItem('po5t',JSON.stringify(tried));
  if(tried.length>=Reg.list.length)Ach.unlock('all');
  S.prof.hist.unshift({g:this.title,i:this.icon,w:winner,d:dur,dt:new Date().toLocaleDateString(),c:this.col});
  if(S.prof.hist.length>30)S.prof.hist=S.prof.hist.slice(0,30);
  var lp=this.players.find(function(p){return p.local;});
  if(lp&&lp.name===winner){S.prof.wins++;S.prof.streak++;if(S.prof.streak>S.prof.best)S.prof.best=S.prof.streak;XP.add(150,Mutators.xpMult());}
  else{S.prof.losses=(S.prof.losses||0)+1;S.prof.streak=0;XP.add(50,Mutators.xpMult());}
  var soloScore=(this.gs&&typeof this.gs.sc==='number')?this.gs.sc:null;
  if(soloScore!=null)Leaderboard.record(this.id,this.title,soloScore);
  Ach.check();Meta.check(S.prof);
  Daily.checkComplete(this.id);
  if (typeof Prog !== 'undefined') {
    Prog.markPlayed(this.id);
    Prog.addXP(12, 'Round complete');
  }
  Drama.tick('win');Announcer.win(winner||'Nobody');
  Save.save();
};
function prismBindTap(el,fn){if(!el||typeof fn!=='function')return;var lock=false;var wrap=function(e){if(lock)return;lock=true;try{fn(e);}finally{setTimeout(function(){lock=false;},280);}};el.addEventListener('click',wrap);el.addEventListener('touchend',function(e){e.preventDefault();wrap(e);},{passive:false});}
Game.prototype.showWin=function(winner,scores,extra){var c=this.col;var sc=(scores||[]).slice(0,5).map(function(s,i){return'<div class="rcard"><div class="rbadge" style="background:'+(i===0?c:'rgba(255,255,255,.08)')+'">'+(i===0?'👑':i+1)+'</div><div><div style="font-weight:700">'+s.n+'</div><div style="font-size:.73rem;opacity:.43">'+s.s+' pts</div></div></div>';}).join('');var cur=(this.gs&&typeof this.gs.sc==='number')?this.gs.sc:0;var best=Leaderboard.best(this.id);var lbExtra='';if(best>0||cur>0){var isNew=cur>0&&cur>=best;lbExtra='<div style="padding:10px 13px;background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.18);border-radius:13px;margin:12px 0;display:flex;align-items:center;justify-content:center;gap:10px"><span style="font-size:1.1rem">🏆</span><div><div style="font-size:.68rem;opacity:.38">Local best</div><div style="font-weight:800;font-size:.92rem;color:var(--amber)">'+best+' pts'+(isNew&&cur===best?' · New best!':'')+'</div></div></div>';}document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px 0 30px"><div style="font-size:3.4rem;margin-bottom:5px">🏆</div><div style="font-size:2rem;font-weight:800;letter-spacing:-.03em;color:'+c+'">'+winner+'</div><div style="opacity:.38;margin-top:6px;font-size:.84rem">Wins this round!</div>'+(Mutators.active.length?'<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;justify-content:center">'+Mutators.active.map(function(m){return'<div style="background:'+m.col+'22;border-radius:100px;padding:2px 8px;font-size:.62rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('')+'</div>':'')+lbExtra+(extra||'')+sc+'<div style="margin-top:20px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button type="button" class="btn ba" style="--acc:'+c+';--glow:'+c+'3a" onclick="GL.launch(\''+this.id+'\')">Play Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div></div>';Snd.ok();Hap.ok();};

// ═══ CINEMATIC INTRO ═════════════════════════════════════════════════
var Cinematic={show:function(game,players,cb){var ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:999;background:'+PCBrand.h_000+';display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:26px;transition:opacity .6s ease';ov.innerHTML='<div style="font-size:.58rem;letter-spacing:.2em;text-transform:uppercase;opacity:.28;margin-bottom:18px">PRISMCAP · MATCH</div><div style="font-size:3.4rem;margin-bottom:12px">'+game.icon+'</div><div style="font-size:1.55rem;font-weight:800;letter-spacing:-.03em;color:'+game.col+';margin-bottom:5px">'+game.title+'</div><div style="opacity:.38;font-size:.8rem;margin-bottom:22px">'+game.desc+'</div>'+(Mutators.active.length?'<div style="margin-bottom:14px;display:flex;flex-wrap:wrap;gap:5px;justify-content:center">'+Mutators.active.map(function(m){return'<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:3px 10px;font-size:.68rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('')+'</div>':'')+'<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:24px">'+players.map(function(p){return'<div style="background:'+p.col+'1e;border:1px solid '+p.col+'44;border-radius:100px;padding:5px 12px;font-size:.76rem;font-weight:700">'+p.av+' '+p.name+'</div>';}).join('')+'</div><div id="_cs" style="font-size:.63rem;opacity:.3;letter-spacing:.1em;font-family:monospace;min-height:14px"></div>';document.body.appendChild(ov);var msgs=['Scanning operators...','Loading betrayal protocols...','⚡ MATCH STARTING'];var i=0;var iv=setInterval(function(){var el=document.getElementById('_cs');if(el)el.textContent=msgs[i]||'';i++;if(i>=msgs.length){clearInterval(iv);setTimeout(function(){ov.style.opacity='0';setTimeout(function(){if(ov.parentNode)ov.parentNode.removeChild(ov);if(cb)cb();},600);},450);}},420);Announcer.gameStart(game.title,players.length);}};

// ═══ QR SYNC ═════════════════════════════════════════════════════════
var QRSync={encode:function(d){try{return btoa(JSON.stringify(d)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');}catch(e){return null;}},decode:function(s){try{var p=s.replace(/-/g,'+').replace(/_/g,'/');while(p.length%4)p+='=';return JSON.parse(atob(p));}catch(e){return null;}},
showTransfer:function(game){if(!game)return;var pkt=this.encode({v:3,id:game.id,gs:game.gs,players:game.players,ts:Date.now()});if(!pkt)return;Modal.open('<div style="text-align:center"><div style="font-size:1rem;font-weight:800;margin-bottom:3px">📡 Transfer State</div><div style="font-size:.75rem;opacity:.38;margin-bottom:14px">Share code with another device</div><div style="background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.18);border-radius:12px;padding:13px;margin-bottom:12px;font-family:monospace;font-size:.63rem;word-break:break-all;color:var(--cyan)">'+pkt.slice(0,100)+'...</div><button type="button" class="btn bw bf" onclick="window._cpPkt()">📋 Copy Full Code</button></div>');window._fullPkt=pkt;},
showReceiver:function(){Modal.open('<div><div style="font-size:1rem;font-weight:800;margin-bottom:3px">📡 Receive State</div><div style="font-size:.75rem;opacity:.38;margin-bottom:12px">Paste code from host device</div><textarea id="_qrin" style="width:100%;height:80px;padding:10px;border-radius:11px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);font-size:.7rem;color:'+PCBrand.h_fff+';font-family:monospace;resize:none" placeholder="Paste code here..."></textarea><button type="button" class="btn bw bf" style="margin-top:9px" onclick="QRSync._recv()">▶ Load State</button></div>');},
_recv:function(){var code=(document.getElementById('_qrin')||{}).value||'';var d=this.decode(code.trim());if(!d||!d.id){toast('❌ Invalid code');return;}var game=Reg.get(d.id);if(!game){toast('Game not found');return;}game.players=d.players;game.gs=d.gs;Modal.close();setTimeout(function(){S.game=game;Nav.go('game');document.getElementById('gtitle').textContent=game.title;document.getElementById('gbody').style.setProperty('--acc',game.col);game.render();toast('✅ State loaded!');},280);}};
window.QRSync=QRSync;
// ═══ MULTIPLAYER GAMES (Drama/Director/Haptics fully wired) ══════════

var ShadowProtocol=new Game({id:'shadow',title:'Shadow Protocol',icon:'🕵️',type:'deduction',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:3,max:10,desc:'Hidden roles. Social deduction. Betrayal.'});
ShadowProtocol.setup=function(pl){Game.prototype.setup.call(this,pl);var roles=AI.roles(pl.length);Drama.reset(pl);Director.init(pl.length);this.gs={phase:'reveal',round:1,maxR:4,players:pl.map(function(x,i){return Object.assign({},x,{role:roles[i],alive:true,votes:0,sus:0,elim:false});}),pidx:0,ridx:0,mission:AI.mission(),sw:0,rw:0};};
ShadowProtocol.render=function(){var gs=this.gs;if(gs.phase==='reveal')this._reveal();else if(gs.phase==='vote')this._vote();else this._result();};
ShadowProtocol._reveal=function(){var gs=this.gs,self=this;var p=gs.players[gs.ridx];if(!p){gs.phase='vote';Nav.go('game');this._vote();return;}document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase;margin-bottom:5px">Round '+gs.round+'/'+gs.maxR+' · '+gs.mission+'</div><button type="button" class="btn bg bf" style="max-width:250px;margin:0 auto" id="_nb">Pass to '+p.name+' →</button></div>';document.getElementById('_nb').onclick=function(){var isShadow=p.role.team==='shadow';Hap.roleReveal(isShadow);PP.show(p.name,p.av,'Your role','<div style="text-align:center"><div style="font-size:2.7rem;margin-bottom:7px">'+p.role.icon+'</div><div style="font-size:1.45rem;font-weight:800;color:'+p.role.col+';margin-bottom:4px">'+p.role.name+'</div><div style="opacity:.52;margin-bottom:11px;font-size:.84rem">'+p.role.power+'</div><div style="padding:9px;background:'+p.role.col+'22;border-radius:10px;font-size:.82rem"><strong style="color:'+p.role.col+'">'+(p.role.team==='shadow'?'⚠️ SHADOW':p.role.team==='wild'?'🎲 WILD':'✅ RESISTANCE')+'</strong></div></div>',function(){gs.ridx++;if(gs.ridx>=gs.players.length){gs.phase='vote';gs.ridx=0;}Nav.go('game');self.render();});};};
ShadowProtocol._vote=function(){var gs=this.gs,self=this;var dir=Director.next();Drama.tick('vote');var alive=gs.players.filter(function(p){return!p.elim;});var extraEvt=Director.chaos()?'<div style="padding:10px;background:rgba(255,45,85,.08);border:1px solid rgba(255,45,85,.16);border-radius:12px;font-size:.78rem;margin-bottom:11px">🎲 '+AI.evt('shadow')+'</div>':'';document.getElementById('gbody').innerHTML='<div style="margin-bottom:11px"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase;letter-spacing:.1em">Round '+gs.round+' · Vote</div><div style="font-size:.97rem;font-weight:700;margin-top:3px">Who do you suspect?</div></div>'+extraEvt+'<div id="vl">'+alive.map(function(p){return'<div class="vopt" onclick="_sv(this,\''+p.id+'\')"><div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.15rem">'+p.av+'</div><div><div style="font-weight:700">'+p.name+'</div><div style="font-size:.68rem;opacity:.32">Sus: '+p.sus+'%</div></div></div>';}).join('')+'</div><button type="button" class="btn br bf" id="_svb" style="margin-top:11px;display:none" onclick="_svs()">Submit Vote</button>';window._sel=null;window._sv=function(el,pid){document.querySelectorAll('.vopt').forEach(function(v){v.classList.remove('sel');});el.classList.add('sel');window._sel=pid;document.getElementById('_svb').style.display='block';Snd.vote();Hap.l();};window._svs=function(){if(!window._sel)return;var t=gs.players.find(function(p){return p.id===window._sel;});if(t){t.votes=(t.votes||0)+1;t.sus=Math.min(100,(t.sus||0)+20);}Drama.tick('vote');gs.pidx++;if(gs.pidx>=alive.length){gs.phase='result';Nav.go('game');self._result();}else{window._sel=null;Nav.go('game');self._vote();toast('Pass to '+alive[gs.pidx].name);}Snd.vote();};};
ShadowProtocol._result=function(){var gs=this.gs,self=this;var alive=gs.players.filter(function(p){return!p.elim;});var maxV=Math.max.apply(null,alive.map(function(p){return p.votes||0;}));var cands=alive.filter(function(p){return(p.votes||0)===maxV;});var tgt=cands[Math.floor(Math.random()*cands.length)];if(!tgt)return;tgt.elim=true;var wasSh=tgt.role.team==='shadow';if(wasSh){gs.rw++;Snd.ok();Drama.tick('win');}else{gs.sw++;Snd.betray();Drama.tick('betray');Hap.betray();Memory.recordBetrayal('Shadow',tgt.name);}document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><div style="font-size:2.9rem">'+tgt.av+'</div><div style="font-size:1.45rem;font-weight:800;margin:5px 0">'+tgt.name+'</div><div style="opacity:.38;margin-bottom:11px">eliminated</div><div style="padding:11px;border-radius:12px;background:'+tgt.role.col+'1e;border:1px solid '+tgt.role.col+'42;margin-bottom:11px"><div style="font-size:1.3rem">'+tgt.role.icon+'</div><div style="font-size:.97rem;font-weight:800;color:'+tgt.role.col+';margin-top:4px">'+tgt.role.name+' · '+tgt.role.team.toUpperCase()+'</div></div><div style="font-size:.9rem;font-weight:700;margin-bottom:15px;color:'+(wasSh?PCBrand.h_30d158:PCBrand.h_ff2d55)+'">'+(wasSh?'✅ Resistance wins!':'⚠️ Shadow gains advantage!')+'</div>'+(gs.round<gs.maxR&&alive.filter(function(p){return!p.elim;}).length>=2?'<button type="button" class="btn bw" onclick="_snx()">Next Round →</button>':'<button type="button" class="btn bw" onclick="_sfi()">Final Results</button>')+'</div>';Hap.h();window._snx=function(){gs.round++;gs.phase='vote';gs.pidx=0;gs.players.forEach(function(p){p.votes=0;});if(gs.round%2===0&&Drama.state.tension>50)Announcer.tension();Nav.go('game');self._vote();};window._sfi=function(){var w=gs.rw>gs.sw?'Resistance':'Shadow Network';self.done(w);S.prof.betrayals+=gs.sw;self.showWin(w,[],'\x3cdiv style="opacity:.38;margin:5px 0">'+gs.rw+' — '+gs.sw+'\x3c/div>');};};

var HotDevice=new Game({id:'hot',title:'Hot Device',icon:'💣',type:'reflex',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:10,desc:'Pass before it explodes! Hidden timers.'});
HotDevice.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,pidx:0,lives:pl.reduce(function(o,p){o[p.id]=3;return o;},{}),elim:[]};};
HotDevice._fuse=function(){return this.timerMs(Math.floor(Math.random()*12000)+5000);};
HotDevice.render=function(){var gs=this.gs,self=this;var alive=this.players.filter(function(p){return!gs.elim.includes(p.id);});var cur=alive[gs.pidx%Math.max(1,alive.length)];if(!cur||alive.length<1){this._end();return;}var chaos=['','','','EYES CLOSED','ONE HAND ONLY','SILENCE','SPIN FIRST','FAKE OUT x3'][Math.floor(Math.random()*8)];document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:6px 0"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px">Round '+gs.round+'</div><div style="position:relative;display:inline-block;margin:4px auto 18px"><div id="hdev" style="width:112px;height:178px;border-radius:22px;background:linear-gradient(145deg,'+PCBrand.h_1a1a1a+','+PCBrand.h_0a0a0a+');border:2.5px solid var(--orange);box-shadow:0 0 32px rgba(255,107,0,.4);margin:0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px"><div style="font-size:2.2rem">💣</div><div style="font-size:.55rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--orange)">LIVE</div></div></div><div style="font-size:1.45rem;font-weight:800;margin-bottom:3px">'+cur.av+' '+cur.name+'</div><div style="opacity:.38;font-size:.78rem;margin-bottom:13px">HOLDING</div>'+(chaos?'<div style="margin:0 0 11px;padding:9px;background:rgba(255,107,0,.08);border:1px solid rgba(255,107,0,.16);border-radius:11px;font-size:.78rem">⚠️ '+chaos+'</div>':'')+'<div style="display:flex;justify-content:center;gap:9px;flex-wrap:wrap;margin-bottom:15px">'+alive.map(function(p){return'<div style="text-align:center;opacity:'+(gs.elim.includes(p.id)?.15:1)+'"><div>'+p.av+'</div><div style="font-size:.52rem;margin-top:1px">'+'❤️'.repeat(Math.max(0,gs.lives[p.id]||0))+'</div></div>';}).join('')+'</div><button type="button" class="btn br blg bf" style="max-width:250px;margin:0 auto" onclick="window._hp()">💨 PASS</button></div>';// heartbeat haptic as fuse runs
var fuseTime=this._fuse();var hbStart=Date.now();var hbInt=setInterval(function(){var elapsed=Date.now()-hbStart;var ratio=elapsed/fuseTime;if(ratio>0.7)Hap.heartbeat();if(elapsed>=fuseTime)clearInterval(hbInt);},900);clearInterval(hbInt);hbInt=setInterval(function(){var elapsed=Date.now()-hbStart;if(elapsed>=fuseTime){clearInterval(hbInt);return;}if((fuseTime-elapsed)<4000)Hap.heartbeat();},900);clearTimeout(this._ft);this._ft=setTimeout(function(){clearInterval(hbInt);if(S.cur!=='game')return;var d=document.getElementById('hdev');if(d){d.style.background='linear-gradient(145deg,'+PCBrand.h_3d0000+','+PCBrand.h_2d0000+')';d.style.borderColor=PCBrand.h_f00;d.style.boxShadow='0 0 62px rgba(255,0,0,.7)';d.innerHTML='<div style="font-size:2.8rem">💥</div>';}Snd.blast();Hap.blast();Drama.tick('betray');gs.lives[cur.id]=(gs.lives[cur.id]||3)-1;if(gs.lives[cur.id]<=0){gs.elim.push(cur.id);toast('💥 '+cur.name+' eliminated!');Announcer.betray(cur.name);}setTimeout(function(){var rem=self.players.filter(function(p){return!gs.elim.includes(p.id);});if(rem.length<=1){self._end(rem[0]);}else{gs.pidx=(gs.pidx+1)%rem.length;gs.round++;Nav.go('game');self.render();}},1300);},fuseTime);window._hp=function(){clearTimeout(self._ft);clearInterval(hbInt);Snd.pass();Hap.m();var al=self.players.filter(function(p){return!gs.elim.includes(p.id);});gs.pidx=(gs.pidx+1)%al.length;gs.round++;Drama.tick('vote');Nav.go('game');self.render();};};
HotDevice._end=function(w){if(w){this.done(w.name);this.showWin(w.name);}else{this.done('Draw');this.showWin('Nobody',[],'\x3cdiv style="opacity:.38">Everyone exploded!\x3c/div>');}};

var SplitTruth=new Game({id:'split',title:'Split Truth',icon:'🎭',type:'bluffing',cat:'multiplayer',col:PCBrand.h_bf5af2,mp:true,min:2,max:10,desc:'Mix truth with lies. Detect the bluffs.'});
SplitTruth.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:0,maxR:Math.min(pl.length*2,12),sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),pIdx:0,phase:'present',prompts:this.shuf(AI.bluffs),used:0,gIdx:0};};
SplitTruth.render=function(){var gs=this.gs;if(gs.round>=gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}if(gs.phase==='present')this._present();else this._guess();};
SplitTruth._present=function(){var gs=this.gs,self=this;var pi=gs.pIdx%this.players.length;var pr=this.players[pi];var prompt=gs.prompts[gs.used%gs.prompts.length];gs.curP=prompt;gs.presI=pi;document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase;margin-bottom:9px">Round '+(gs.round+1)+'/'+gs.maxR+'</div><button type="button" class="btn bg bf" style="max-width:250px;margin:0 auto" onclick="window._stp()">Pass to '+pr.av+' '+pr.name+'</button></div>';window._stp=function(){PP.show(pr.name,pr.av,'Presenter','<div style="text-align:center"><div style="opacity:.38;font-size:.73rem;margin-bottom:7px">Read ONE aloud</div><div style="background:rgba(191,90,242,.12);border:1px solid rgba(191,90,242,.24);border-radius:11px;padding:13px;margin-bottom:7px;font-size:.88rem;font-weight:600;line-height:1.45">"'+prompt.t+'"</div><div style="background:rgba(255,45,85,.12);border:1px solid rgba(255,45,85,.24);border-radius:11px;padding:13px;margin-bottom:15px;font-size:.88rem;font-weight:600;line-height:1.45">"'+prompt.l+'"</div><div style="display:flex;gap:8px"><button type="button" class="btn bg" style="flex:1" onclick="window._stc(\'t\')">Read TOP</button><button type="button" class="btn bg" style="flex:1" onclick="window._stc(\'l\')">Read BOTTOM</button></div></div>',function(){Nav.go('game');self.render();});window._stc=function(ch){gs.curStmt=ch==='t'?prompt.t:prompt.l;gs.isLie=ch==='l';gs.phase='guess';gs.gIdx=0;PP.done();Nav.go('game');self._guess();};};};
SplitTruth._guess=function(){var gs=this.gs,self=this;var guessers=this.players.filter(function(_,i){return i!==gs.presI;});if(gs.gIdx>=guessers.length){gs.round++;gs.pIdx++;gs.used++;gs.gIdx=0;gs.phase='present';Drama.tick('vote');Director.next();Nav.go('game');this.render();return;}var gsr=guessers[gs.gIdx];var pres=this.players[gs.presI];document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;margin-bottom:14px"><div style="font-size:.62rem;opacity:.32;margin-bottom:5px">'+pres.av+' '+pres.name+' says:</div><div style="font-size:.9rem;font-weight:600;line-height:1.5">"'+gs.curStmt+'"</div></div><div style="text-align:center;margin-bottom:12px"><div style="font-size:.97rem;font-weight:700">'+gsr.av+' '+gsr.name+'</div><div style="opacity:.38;margin-top:2px">Truth or Lie?</div></div><div style="display:flex;gap:9px"><button type="button" class="btn" style="flex:1;background:rgba(48,209,88,.12);border:1px solid var(--green);font-size:.9rem;padding:16px" onclick="window._stg(\'t\')">✅ TRUTH</button><button type="button" class="btn" style="flex:1;background:rgba(255,45,85,.12);border:1px solid var(--red);font-size:.9rem;padding:16px" onclick="window._stg(\'l\')">❌ LIE</button></div></div>';window._stg=function(g){var ok=(g==='t'&&!gs.isLie)||(g==='l'&&gs.isLie);if(ok){gs.sc[gsr.id]=(gs.sc[gsr.id]||0)+10;toast('✅ +10');Snd.ok();}else{gs.sc[pres.id]=(gs.sc[pres.id]||0)+10;toast('🎭 Fooled! +10');Snd.betray();S.prof.bluff++;Drama.tick('betray');if(S.prof.bluff>=5)Ach.unlock('blf');}Hap.m();gs.gIdx++;Nav.go('game');self._guess();};};

var SilentVote=new Game({id:'sv',title:'Silent Vote',icon:'🗳️',type:'strategy',cat:'multiplayer',col:PCBrand.h_00d4ff,mp:true,min:3,max:10,desc:'Secret voting. Hidden agendas.'});
SilentVote.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,maxR:5,sc:pl.reduce(function(o,p){o[p.id]=100;return o;},{}),votes:{},phase:'vote',pidx:0,elim:[]};};
SilentVote.render=function(){var gs=this.gs;if(gs.phase==='vote')this._vote();else this._reveal();};
SilentVote._vote=function(){var gs=this.gs,self=this;var alive=this.players.filter(function(p){return!gs.elim.includes(p.id);});var voter=alive[gs.pidx%Math.max(1,alive.length)];if(!voter){gs.phase='reveal';Nav.go('game');this._reveal();return;}Drama.tick('vote');var sec='<div style="text-align:center"><div style="font-weight:600;margin-bottom:3px">Round '+gs.round+' Secret Vote</div><div style="opacity:.38;font-size:.73rem;margin-bottom:12px">Anonymous</div>'+alive.filter(function(p){return p.id!==voter.id;}).map(function(p){return'<div class="vopt" onclick="window._svv(this,\''+p.id+'\')"><div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem">'+p.av+'</div><div style="font-weight:700">'+p.name+'</div>'+(Mutators.hasBlind()?'':'<div style="margin-left:auto;font-size:.73rem;color:var(--cyan)">'+(gs.sc[p.id]||0)+'</div>')+'</div>';}).join('')+'<button type="button" class="btn bg bf" style="margin-top:12px;display:none" id="_svvb" onclick="window._svvs()">Submit →</button></div>';PP.show(voter.name,voter.av,'Cast your vote',sec,function(){Nav.go('game');self.render();});window._svvs2=null;window._svv=function(el,pid){document.querySelectorAll('.vopt').forEach(function(v){v.classList.remove('sel');});el.classList.add('sel');window._svvs2=pid;document.getElementById('_svvb').style.display='block';Snd.vote();};window._svvs=function(){if(!window._svvs2)return;gs.votes[voter.id]=window._svvs2;gs.pidx++;PP.done();Nav.go('game');self.render();};};
SilentVote._reveal=function(){var gs=this.gs,self=this;var tally={};Object.values(gs.votes).forEach(function(v){tally[v]=(tally[v]||0)+1;});var maxV=Math.max.apply(null,Object.values(tally).concat([0]));var targets=Object.keys(tally).filter(function(k){return tally[k]===maxV;});var elId=targets[Math.floor(Math.random()*targets.length)];var elP=this.players.find(function(p){return p.id===elId;});if(elP&&!gs.elim.includes(elId)){gs.elim.push(elId);gs.sc[elId]=0;Drama.tick('betray');}Object.entries(gs.votes).forEach(function(e){if(e[1]===elId)gs.sc[e[0]]=(gs.sc[e[0]]||100)+15;else gs.sc[e[0]]=Math.max(0,(gs.sc[e[0]]||100)-5);});Director.next();document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:5px 0"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase;margin-bottom:12px">Round '+gs.round+' Results</div>'+(elP?'<div style="font-size:2.8rem">'+elP.av+'</div><div style="font-size:1.45rem;font-weight:800;margin:5px 0">'+elP.name+'</div><div style="opacity:.38;margin-bottom:12px">voted out — '+(tally[elId]||0)+' votes</div>':'<div style="opacity:.38;margin-bottom:12px">No consensus</div>')+'<div style="margin-bottom:15px">'+this.players.map(function(p){return'<div style="display:flex;align-items:center;gap:9px;padding:8px;border-bottom:1px solid rgba(255,255,255,.05)"><div>'+p.av+'</div><div style="flex:1;font-weight:600;'+(gs.elim.includes(p.id)?'opacity:.22;text-decoration:line-through':'')+'">' +p.name+'</div>'+(Mutators.hasBlind()?'':'<div style="color:var(--cyan);font-weight:700">'+(gs.sc[p.id]||0)+'</div>')+'</div>';}).join('')+'</div>'+(this.players.filter(function(p){return!gs.elim.includes(p.id);}).length<=1||gs.round>=gs.maxR?'<button type="button" class="btn bw" onclick="window._svend()">Final Results</button>':'<button type="button" class="btn bw" onclick="window._svnx()">Next Round →</button>')+'</div>';Snd.reveal();Hap.h();window._svnx=function(){gs.round++;gs.phase='vote';gs.votes={};gs.pidx=0;Nav.go('game');self.render();};window._svend=function(){var sc=self.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});self.done(sc[0].n);self.showWin(sc[0].n,sc);};};

var ChaosCards=new Game({id:'chaos',title:'Chaos Cards',icon:'🃏',type:'party',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:10,desc:'Infinite procedural party card challenges.'});
ChaosCards.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,maxR:Mutators.hasChaos()?30:20,sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),deck:this.shuf(AI.chaos.concat(AI.chaos)),didx:0,pidx:0};};
var TruthBomb=new Game({id:'truthbomb',title:'Truth Bomb',icon:'💣',type:'party',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:2,max:10,desc:'Answer truth or face the bomb — party confessions.'});
TruthBomb._qs=['What is your most embarrassing moment?','Who here would you trust with a secret?','What habit do you hide from friends?','What is the boldest thing you have done?','What would you do with a million dollars?','Who was your first crush?','What app do you waste the most time on?','What is a skill you pretend to have?'];
TruthBomb.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,maxR:Math.min(15,pl.length*3),sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),pidx:0,qidx:0,bombs:0};};
TruthBomb.render=function(){var gs=this.gs,self=this;if(gs.round>gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}var player=this.players[gs.pidx%this.players.length];var q=this._qs[gs.qidx%this._qs.length];Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0;text-align:center"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase;margin-bottom:8px">Round '+gs.round+'/'+gs.maxR+'</div><button type="button" class="btn bw bf" onclick="window._tbgo()">Pass to '+player.av+' '+player.name+'</button></div>';window._tbgo=function(){var sec='<div style="text-align:center"><div style="font-size:2.4rem;margin-bottom:8px">💣</div><div style="font-size:.9rem;font-weight:700;line-height:1.5;margin-bottom:14px">'+q+'</div><div style="display:flex;flex-direction:column;gap:8px"><button type="button" class="btn bg bf" onclick="window._tbans(1)">✅ Answer Truth (+10)</button><button type="button" class="btn br bf" onclick="window._tbans(0)">💥 Take the Bomb (-5)</button></div></div>';PP.show(player.name,player.av,'Truth Bomb',sec,function(){gs.round++;gs.pidx++;gs.qidx++;Nav.go('game');self.render();});};window._tbans=function(ok){if(ok){gs.sc[player.id]=(gs.sc[player.id]||0)+10;Snd.ok();Hap.ok();toast('Truth told! +10');}else{gs.sc[player.id]=Math.max(0,(gs.sc[player.id]||0)-5);gs.bombs++;Snd.danger();Hap.err();toast('💥 Bomb! -5');Drama.tick('betray');}PP.done();gs.round++;gs.pidx++;gs.qidx++;Nav.go('game');self.render();};};

ChaosCards.render=function(){var gs=this.gs,self=this;if(gs.round>gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);Daily.completeForGame('chaos');return;}var player=this.players[gs.pidx%this.players.length];var card=gs.deck[gs.didx%gs.deck.length];Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:12px"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase">Card '+gs.round+'/'+gs.maxR+'</div><div style="font-size:.97rem;font-weight:700;margin-top:3px">'+player.av+' '+player.name+'</div></div><div id="_cc" style="border-radius:19px;padding:24px 18px;text-align:center;margin:0 0 14px;background:'+card.c+'1c;border:2px solid '+card.c+'52;min-height:182px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer" onclick="window._cf()"><div style="font-size:.56rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:'+card.c+';margin-bottom:9px">'+card.tp+'</div><div style="font-size:2.7rem;margin-bottom:12px">'+card.i+'</div><div id="_ct" style="font-size:.9rem;font-weight:600;line-height:1.5;opacity:0">'+card.txt+'</div><div id="_ch" style="font-size:.72rem;opacity:.32;margin-top:5px">TAP TO REVEAL</div></div><div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:12px">'+this.players.map(function(p){return'<div style="text-align:center;padding:5px 9px;background:rgba(255,255,255,.04);border-radius:9px"><div>'+p.av+'</div>'+(Mutators.hasBlind()?'':'<div style="font-size:.68rem;font-weight:700;color:var(--orange)">'+(gs.sc[p.id]||0)+'</div>')+'</div>';}).join('')+'</div><div style="display:flex;gap:7px"><button type="button" class="btn bg" style="flex:1" onclick="window._cs(-5)">👎 Fail</button><button type="button" class="btn" style="flex:1;background:'+card.c+';color:'+PCBrand.h_000+'" onclick="window._cs(10)">✅ Done!</button></div></div>';var rev=false;window._cf=function(){if(rev)return;rev=true;document.getElementById('_ct').style.opacity='1';document.getElementById('_ch').style.display='none';Snd.reveal();Hap.m();};window._cs=function(pts){gs.sc[player.id]=Math.max(0,(gs.sc[player.id]||0)+pts);if(pts>0){Snd.ok();Hap.ok();}else{Snd.err();Drama.tick('betray');}gs.round++;gs.pidx++;gs.didx++;Nav.go('game');self.render();};};

var Dungeon=new Game({id:'dungeon',title:'One Device Dungeon',icon:'⚔️',type:'strategy',cat:'multiplayer',col:PCBrand.h_ffd60a,mp:true,min:2,max:6,desc:'Pass-and-play roguelike. Alliances & betrayals.'});
Dungeon.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={floor:1,maxF:8,players:pl.map(function(x){return Object.assign({},x,{hp:30,gold:10,alive:true});}),turn:0};};
Dungeon.render=function(){var gs=this.gs,self=this;var alive=gs.players.filter(function(p){return p.alive;});if(!alive.length||gs.floor>gs.maxF){var sc=gs.players.map(function(p){return{n:p.name,s:p.gold+p.hp};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}var player=alive[gs.turn%alive.length];var room=AI.room();Drama.tick('vote');Director.next();document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:9px 12px;background:rgba(255,214,10,.07);border:1px solid rgba(255,214,10,.15);border-radius:12px"><div><div style="opacity:.38;font-size:.56rem;text-transform:uppercase">Floor</div><div style="font-size:1.25rem;font-weight:800;color:var(--amber)">'+gs.floor+'</div></div><div style="font-size:1.75rem">'+room.i+'</div><div style="text-align:right"><div style="opacity:.38;font-size:.56rem;text-transform:uppercase">Room</div><div style="font-size:.84rem;font-weight:700">'+room.n+'</div></div></div><div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:12px" class="noscroll">'+gs.players.map(function(p){return'<div style="min-width:70px;text-align:center;padding:7px 5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:11px;opacity:'+(p.alive?1:.22)+'"><div>'+p.av+'</div><div style="font-size:.58rem;font-weight:700;margin-top:1px">'+p.name.slice(0,6)+'</div><div style="font-size:.62rem;color:var(--red)">❤️'+p.hp+'</div><div style="font-size:.62rem;color:var(--amber)">💰'+p.gold+'</div></div>';}).join('')+'</div><div style="text-align:center;margin-bottom:5px;font-size:.73rem;font-weight:700">Pass to '+player.av+' '+player.name+'</div><button type="button" class="btn bw bf" onclick="window._da()">Enter '+room.n+'</button></div>';window._da=function(){var isDan=Math.random()<room.dan;var dmg=isDan?Math.floor(Math.random()*10)+5:0;var gold=isDan?0:Math.floor(Math.random()*15)+5;var bets=gs.players.filter(function(p){return p.alive&&p.id!==player.id;});if(isDan){player.hp=Math.max(0,player.hp-dmg);if(player.hp<=0){player.alive=false;}}else{player.gold+=gold;}var sec='<div style="text-align:center"><div style="font-size:2.6rem;margin-bottom:6px">'+room.i+'</div><div style="font-size:1.15rem;font-weight:800;margin-bottom:3px">'+room.n+'</div><div style="opacity:.38;font-size:.78rem;margin-bottom:12px">'+AI.evt('dungeon')+'</div>'+(isDan?'<div style="padding:11px;background:rgba(255,45,85,.12);border:1px solid rgba(255,45,85,.24);border-radius:11px;margin-bottom:12px"><div style="font-size:1rem">⚠️</div><div style="font-weight:700;margin-top:3px">-'+dmg+' HP · '+player.hp+' remaining</div></div>':'<div style="padding:11px;background:rgba(255,214,10,.12);border:1px solid rgba(255,214,10,.24);border-radius:11px;margin-bottom:12px"><div style="font-size:1rem">💰</div><div style="font-weight:700;margin-top:3px">+'+gold+' Gold · Total: '+player.gold+'</div></div>')+(bets.length?'<div style="padding:9px;background:rgba(255,45,85,.07);border:1px solid rgba(255,45,85,.12);border-radius:9px;text-align:left;margin-bottom:9px"><div style="font-size:.65rem;opacity:.38;margin-bottom:5px">Secret sabotage?</div>'+bets.map(function(t){return'<button type="button" onclick="window._db(\''+t.id+'\',\''+t.name+'\')" class="btn bg bsm" style="margin:2px">🗡️ '+t.name+'</button>';}).join('')+'</div>':'')+'</div>';PP.show(player.name,player.av,'Floor '+gs.floor,sec,function(){gs.floor++;gs.turn++;Nav.go('game');self.render();});window._db=function(tid,tname){var t=gs.players.find(function(p){return p.id===tid;});if(t){t.hp=Math.max(0,t.hp-8);S.prof.betrayals++;Memory.recordBetrayal(player.name,tname);Ach.check();toast('🗡️ Sabotaged!');Snd.betray();Hap.betray();}};};};

var SpyHunt=new Game({id:'spy',title:'Spy Hunt',icon:'👁️',type:'deduction',cat:'multiplayer',col:PCBrand.h_30d158,mp:true,min:3,max:10,desc:'Find the spy before they complete their mission.'});
SpyHunt.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);Director.init(pl.length);var sc=Math.max(1,Math.floor(pl.length*.2));var spyIds=this.shuf([...pl.keys()]).slice(0,sc).map(function(i){return pl[i].id;});var locs=['Embassy','Casino','Hotel','Airport','Museum','Submarine','Space Station','Arctic Base'];var missions=['Steal the documents','Identify the Director','Plant the device','Send the signal','Eliminate the target'];this.gs={phase:'reveal',spyIds:spyIds,loc:locs[Math.floor(Math.random()*locs.length)],mission:missions[Math.floor(Math.random()*missions.length)],ridx:0,sus:{},ts:null};};
SpyHunt.render=function(){var gs=this.gs;if(gs.phase==='reveal')this._reveal();else if(gs.phase==='int')this._int();else this._vote();};
SpyHunt._reveal=function(){var gs=this.gs,self=this;var p=this.players[gs.ridx];if(!p){gs.phase='int';Nav.go('game');this._int();return;}var isSpy=gs.spyIds.includes(p.id);Hap.roleReveal(isSpy);var sec='<div style="text-align:center"><div style="font-size:2.7rem;margin-bottom:9px">'+(isSpy?'🕵️':'📍')+'</div><div style="font-size:1.3rem;font-weight:800;color:'+(isSpy?PCBrand.h_ff2d55:PCBrand.h_30d158)+';margin-bottom:9px">'+(isSpy?'YOU ARE THE SPY':'You Are Safe')+'</div>'+(isSpy?'<div style="padding:11px;background:rgba(255,45,85,.08);border:1px solid rgba(255,45,85,.16);border-radius:11px;margin-bottom:9px"><div style="opacity:.38;font-size:.73rem">MISSION</div><div style="font-weight:700;margin-top:3px">'+gs.mission+'</div></div>':'<div style="padding:11px;background:rgba(48,209,88,.08);border:1px solid rgba(48,209,88,.16);border-radius:11px;margin-bottom:9px"><div style="opacity:.38;font-size:.73rem">LOCATION</div><div style="font-weight:700;margin-top:3px">'+gs.loc+'</div></div>')+'</div>';document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><button type="button" class="btn bg bf" style="max-width:250px;margin:0 auto" onclick="window._spy1()">Pass to '+p.av+' '+p.name+'</button></div>';window._spy1=function(){PP.show(p.name,p.av,'Your identity',sec,function(){gs.ridx++;Nav.go('game');self.render();});};};
SpyHunt._int=function(){var gs=this.gs,self=this;if(!gs.ts)gs.ts=Date.now();Drama.tick('vote');var rem=Math.max(0,300-Math.floor((Date.now()-gs.ts)/1000));var mm=Math.floor(rem/60),ss=rem%60;document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:12px"><div id="_spt" style="font-size:2.7rem;font-weight:800;color:var(--green)">'+mm+':'+(ss<10?'0':'')+ss+'</div><div style="opacity:.38;margin-top:3px">Ask questions. Find the spy.</div></div><div style="padding:11px;background:rgba(48,209,88,.07);border:1px solid rgba(48,209,88,.11);border-radius:11px;margin-bottom:12px"><div style="opacity:.38;font-size:.65rem;text-transform:uppercase;margin-bottom:3px">Location (non-spies know)</div><div style="font-size:.97rem;font-weight:700">'+gs.loc+'</div></div><div style="margin-bottom:12px">'+this.players.map(function(p){return'<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:10px"><div>'+p.av+'</div><div style="flex:1;font-size:.78rem;font-weight:600">'+p.name+'</div><button type="button" onclick="window._spsu(\''+p.id+'\')" style="padding:2px 7px;background:rgba(255,107,0,.15);border:1px solid rgba(255,107,0,.24);border-radius:6px;font-size:.6rem;cursor:pointer">+Sus</button><div id="sus-'+p.id+'" style="font-size:.72rem;color:var(--orange)">'+(gs.sus[p.id]||0)+'🔍</div></div>';}).join('')+'</div><div style="display:flex;gap:7px"><button type="button" class="btn bg" style="flex:1" onclick="window._spvt()">🗳️ Vote</button><button type="button" class="btn br" style="flex:1" onclick="window._spvt()">⚡ Emergency</button></div></div>';this._si=setInterval(function(){var r=Math.max(0,300-Math.floor((Date.now()-gs.ts)/1000));var el=document.getElementById('_spt');if(el)el.textContent=Math.floor(r/60)+':'+(r%60<10?'0':'')+(r%60);if(r<=30&&r%10===0){Drama.tick('vote');if(r<=30)Hap.m();}if(r<=0){clearInterval(self._si);gs.phase='vote';Nav.go('game');self._vote();}},1000);window._spsu=function(pid){gs.sus[pid]=(gs.sus[pid]||0)+1;var el=document.getElementById('sus-'+pid);if(el)el.textContent=gs.sus[pid]+'🔍';Snd.click();Drama.tick('vote');};window._spvt=function(){clearInterval(self._si);gs.phase='vote';Nav.go('game');self._vote();};};
SpyHunt._vote=function(){var gs=this.gs,self=this;Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:12px"><div style="font-size:.97rem;font-weight:700">Who Is The Spy?</div></div>'+this.players.map(function(p){return'<div class="vopt" onclick="window._spfv(this,\''+p.id+'\')"><div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem">'+p.av+'</div><div><div style="font-weight:700">'+p.name+'</div><div style="font-size:.68rem;color:var(--orange)">'+(gs.sus[p.id]||0)+' sus</div></div></div>';}).join('')+'<button type="button" class="btn br bf" style="margin-top:12px;display:none" id="_sprvb" onclick="window._sprvl()">Reveal!</button></div>';var voted=null;window._spfv=function(el,pid){document.querySelectorAll('.vopt').forEach(function(v){v.classList.remove('sel');});el.classList.add('sel');voted=pid;document.getElementById('_sprvb').style.display='block';Snd.vote();};window._sprvl=function(){if(!voted)return;var isSpy=gs.spyIds.includes(voted);var accused=self.players.find(function(p){return p.id===voted;});var spies=gs.spyIds.map(function(id){return self.players.find(function(p){return p.id===id;});});if(isSpy){Daily.completeForGame('spy');}document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><div style="font-size:3.4rem;margin-bottom:5px">'+(isSpy?'✅':'❌')+'</div><div style="font-size:1.45rem;font-weight:800;margin-bottom:5px">'+(isSpy?'SPY CAUGHT!':'WRONG TARGET!')+'</div><div style="font-size:2.7rem;margin:9px 0">'+accused.av+'</div><div style="font-size:1.05rem;font-weight:700">'+accused.name+'</div><div style="opacity:.38;margin-bottom:12px">'+(isSpy?'was the spy':'was innocent')+'</div><div style="padding:11px;background:rgba(255,45,85,.08);border:1px solid rgba(255,45,85,.16);border-radius:11px;margin-bottom:15px">'+spies.map(function(sp){return'<div style="font-weight:700;font-size:.97rem;margin:3px 0">'+sp.av+' '+sp.name+'</div>';}).join('')+'</div><div style="display:flex;gap:7px;justify-content:center"><button type="button" class="btn ba" style="--acc:var(--green);--glow:rgba(48,209,88,.28)" onclick="GL.launch(\'spy\')">Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div></div>';self.done(isSpy?'Resistance':spies[0].name);isSpy?(Snd.ok(),Hap.ok()):(Snd.betray(),Hap.err());};};

var LastSignal=new Game({id:'lsig',title:'Last Signal',icon:'📡',type:'survival',cat:'multiplayer',col:PCBrand.h_ffd60a,mp:true,min:2,max:8,desc:'Cooperate to survive. But someone has a hidden agenda.'});
LastSignal.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:0,maxR:6,res:{power:60,food:60,comms:60,oxygen:60},players:pl.map(function(x){return Object.assign({},x,{alive:true,agenda:Math.random()<.25});}),pidx:0,acts:{}};};
LastSignal.render=function(){var gs=this.gs,self=this;if(gs.round>=gs.maxR){var surv=Object.values(gs.res).every(function(v){return v>0;});var sc=gs.players.map(function(p){return{n:p.name,s:Object.values(gs.res).reduce(function(a,b){return a+b;},0)};}).sort(function(a,b){return b.s-a.s;});this.done(surv?sc[0].n:'Nobody');this.showWin(surv?sc[0].n+' leads!':'Station Lost',sc,'<div style="opacity:.38;margin:5px 0">'+(surv?'Survived!':'Station fell.')+'</div>');return;}var ev=AI.sevts[gs.round%AI.sevts.length];Drama.tick('vote');Director.next();var rbars=Object.entries(gs.res).map(function(e){return'<div style="margin-bottom:7px"><div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:.73rem"><span>'+e[0]+'</span><span style="font-weight:700;color:'+(e[1]>30?'var(--green)':'var(--red)')+'">'+e[1]+'%</span></div><div class="btrack"><div class="bfill" style="width:'+Math.min(100,e[1])+'%;background:'+(e[1]>30?'var(--green)':'var(--red)')+'"></div></div></div>';}).join('');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:12px"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase">Crisis '+(gs.round+1)+'/'+gs.maxR+'</div><div style="font-size:1.75rem;margin:5px 0">'+ev.i+'</div><div style="font-size:.9rem;font-weight:700;margin-bottom:3px">'+ev.t+'</div></div><div class="glass" style="padding:12px;margin-bottom:12px">'+rbars+'</div><button type="button" class="btn bw bf" onclick="window._lss()">Begin Actions</button></div>';window._lss=function(){gs.pidx=0;gs.acts={};self._action();};};
LastSignal._action=function(){var gs=this,self=this;gs=this.gs;var alive=this.gs.players.filter(function(p){return p.alive;});if(this.gs.pidx>=alive.length){Object.entries(this.gs.acts).forEach(function(e){if(e[1]==='fix'){var mk=Object.keys(this.gs.res).reduce(function(a,b){return this.gs.res[a]<this.gs.res[b]?a:b;}.bind(self));self.gs.res[mk]=Math.min(100,self.gs.res[mk]+15);}else if(e[1]==='gather'){Object.keys(self.gs.res).forEach(function(k){self.gs.res[k]=Math.min(100,self.gs.res[k]+20);});}else if(e[1]==='sab'){self.gs.res.power=Math.max(0,self.gs.res.power-20);Drama.tick('betray');}}.bind(self));Object.keys(self.gs.res).forEach(function(k){self.gs.res[k]=Math.max(0,self.gs.res[k]-15);});self.gs.round++;Nav.go('game');self.render();return;}var player=alive[this.gs.pidx];var sec='<div><div style="font-size:.84rem;font-weight:700;text-align:center;margin-bottom:9px">Round '+(this.gs.round+1)+' — Choose Action</div>'+(player.agenda?'<div style="padding:6px;background:rgba(255,45,85,.08);border-radius:8px;font-size:.73rem;color:var(--red);text-align:center;margin-bottom:9px">⚠️ Hidden Agenda</div>':'')+'<div style="display:flex;flex-direction:column;gap:7px"><button type="button" class="btn bg bf" onclick="window._lsa(\'fix\')">🔧 Fix (+15 lowest)</button><button type="button" class="btn bg bf" onclick="window._lsa(\'gather\')">📦 Gather (+20 all)</button><button type="button" class="btn bg bf" onclick="window._lsa(\'rest\')">💤 Conserve</button>'+(player.agenda?'<button type="button" class="btn" style="background:rgba(255,45,85,.16);border:1px solid rgba(255,45,85,.28)" onclick="window._lsa(\'sab\')">🗡️ SABOTAGE (-20 power)</button>':'')+'</div></div>';PP.show(player.name,player.av,'Crisis Response',sec,function(){Nav.go('game');self.gs.pidx++;self._action();});window._lsa=function(a){if(a==='sab'){Memory.recordBetrayal(player.name,'Station');Hap.betray();}self.gs.acts[player.id]=a;PP.done();Nav.go('game');self.gs.pidx++;self._action();};};

var ChainReaction=new Game({id:'chain',title:'Chain Reaction',icon:'⚡',type:'reflex',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:10,desc:'React to chain events. Combos & escalating chaos.'});
ChainReaction.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,maxR:pl.length*3,sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),pidx:0,combo:0};};
ChainReaction.render=function(){var gs=this.gs,self=this;if(gs.round>gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}var len=Math.min(3+gs.round+(Mutators.hasChaos()?2:0),8);var icons=['⚡','🔥','💥','🌊','🌪️','✨','⭐','💫'];var seq=Array.from({length:len},function(){return icons[Math.floor(Math.random()*icons.length)];});var player=this.players[gs.pidx%this.players.length];Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:12px"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase">Round '+gs.round+' · '+player.av+' '+player.name+'</div></div><div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;min-height:68px;align-items:center;padding:12px;background:rgba(255,255,255,.03);border-radius:12px;margin-bottom:12px">'+seq.map(function(s,i){return'<div id="_cn'+i+'" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-size:1.3rem;opacity:.16;transition:all .25s">'+s+'</div>';}).join('')+'</div><div style="text-align:center;margin-bottom:12px;opacity:.38">Combo: <span style="color:var(--orange);font-weight:700;opacity:1">x'+gs.combo+'</span></div><button type="button" class="btn bw bf" id="_cst" onclick="window._cst()">Watch Sequence →</button><div id="_ci" style="display:none;margin-top:12px"><div style="text-align:center;margin-bottom:9px;font-weight:700">Recreate it!</div><div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap">'+icons.map(function(ic){return'<div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:1.25rem;cursor:pointer" onclick="window._ct(\''+ic+'\',this)">'+ic+'</div>';}).join('')+'</div></div></div>';var inp=[];var speed=this.timerMs(560);window._cst=function(){document.getElementById('_cst').style.display='none';var i=0;var iv=setInterval(function(){if(i>0){var p=document.getElementById('_cn'+(i-1));if(p){p.style.opacity='.16';p.style.background='rgba(255,255,255,.05)';p.style.boxShadow='none';}}if(i<seq.length){var el=document.getElementById('_cn'+i);if(el){el.style.opacity='1';el.style.background='rgba(255,107,0,.34)';el.style.boxShadow='0 0 14px rgba(255,107,0,.5)';Snd.reflex(i*26);}i++;}else{clearInterval(iv);if(i>0){var last=document.getElementById('_cn'+(i-1));if(last){last.style.opacity='.16';last.style.background='rgba(255,255,255,.05)';last.style.boxShadow='none';}}setTimeout(function(){document.getElementById('_ci').style.display='block';},320);}},speed);};window._ct=function(icon,el){inp.push(icon);el.style.background='rgba(255,107,0,.24)';setTimeout(function(){el.style.background='rgba(255,255,255,.07)';},160);Snd.reflex(inp.length);Hap.l();if(inp.length===seq.length){var ok=inp.every(function(v,j){return v===seq[j];});if(ok){gs.combo++;var pts=10*Math.max(1,gs.combo);gs.sc[player.id]=(gs.sc[player.id]||0)+pts;toast('✅ Combo x'+gs.combo+'! +'+pts);Snd.ok();Hap.ok();Drama.tick('vote');}else{gs.combo=0;toast('❌ Wrong!');Snd.err();Hap.err();}gs.round++;gs.pidx++;setTimeout(function(){Nav.go('game');self.render();},700);}};};

var BetrayalGrid=new Game({id:'bgrid',title:'Betrayal Grid',icon:'♟️',type:'strategy',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:2,max:8,desc:'Control zones. Sabotage opponents secretly.'});
BetrayalGrid.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);var sz=5;this.gs={round:1,maxR:8,grid:Array(sz*sz).fill(null).map(function(){return{own:null};}),sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),sz:sz,pidx:0,sabs:pl.reduce(function(o,p){o[p.id]=2;return o;},{})};};
BetrayalGrid.render=function(){var gs=this.gs,self=this;if(gs.round>gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}var player=this.players[gs.pidx%this.players.length];Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:9px"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase">Round '+gs.round+'/'+gs.maxR+'</div></div><div style="display:grid;grid-template-columns:repeat('+gs.sz+',1fr);gap:4px;margin-bottom:12px">'+gs.grid.map(function(cell){var op=cell.own?self.players.find(function(p){return p.id===cell.own;}):null;return'<div style="height:44px;border-radius:7px;background:'+(op?op.col+'1c':'rgba(255,255,255,.03)')+';border:1px solid '+(op?op.col+'42':'rgba(255,255,255,.06)')+';display:flex;align-items:center;justify-content:center;font-size:.95rem">'+(op?op.av:'')+'</div>';}).join('')+'</div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:12px">'+this.players.map(function(p){return'<div style="text-align:center;padding:6px 9px;background:rgba(255,255,255,.04);border-radius:9px"><div>'+p.av+'</div>'+(Mutators.hasBlind()?'':'<div style="font-size:.68rem;font-weight:700;color:'+p.col+'">'+(gs.sc[p.id]||0)+'</div>')+'</div>';}).join('')+'</div><button type="button" class="btn bw bf" onclick="window._bgt()">Pass to '+player.av+' '+player.name+'</button></div>';window._bgt=function(){var sec='<div><div style="font-size:.84rem;font-weight:700;text-align:center;margin-bottom:5px">Claim or Sabotage</div><div style="opacity:.38;font-size:.68rem;text-align:center;margin-bottom:9px">Tap to claim · Tap enemy to sabotage ('+(gs.sabs[player.id]||0)+' left)</div><div style="display:grid;grid-template-columns:repeat('+gs.sz+',1fr);gap:4px">'+gs.grid.map(function(cell,i){var op=cell.own?self.players.find(function(p){return p.id===cell.own;}):null;return'<div class="bgcell" style="height:44px;background:'+(op?op.col+'1c':'rgba(255,255,255,.04)')+';border-color:'+(op?op.col+'42':'rgba(255,255,255,.08)')+'" onclick="window._bgc('+i+',this)">'+(op?op.av:'')+'</div>';}).join('')+'</div></div>';PP.show(player.name,player.av,'Your move',sec,function(){self.players.forEach(function(p){gs.sc[p.id]=gs.grid.filter(function(c){return c.own===p.id;}).length*5;});gs.round++;gs.pidx++;Director.next();Nav.go('game');self.render();});window._bgc=function(idx,el){var cell=gs.grid[idx];if(!cell.own||cell.own===player.id){cell.own=player.id;el.style.background=player.col+'1c';el.style.borderColor=player.col+'62';el.textContent=player.av;Snd.click();Hap.l();}else if((gs.sabs[player.id]||0)>0){cell.own=null;gs.sabs[player.id]--;el.style.background='rgba(255,45,85,.12)';el.textContent='💥';setTimeout(function(){el.style.background='rgba(255,255,255,.04)';el.textContent='';el.style.borderColor='rgba(255,255,255,.08)';},500);toast('🗡️ Sabotaged!');Memory.recordBetrayal(player.name,'Grid');Snd.betray();Hap.betray();Drama.tick('betray');S.prof.betrayals++;Ach.check();}};};};
// ═══ SOLO GAMES (11-20, mutators wired) ═════════════════════════════

var NeonReflex=new Game({id:'reflex',title:'Neon Reflex',icon:'⚡',type:'reflex',cat:'solo',col:PCBrand.h_64d2ff,mp:false,min:1,max:1,desc:'Ultra-fast reflex training. Set your record.'});
NeonReflex.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={sc:0,lives:3,lvl:1,spd:950,active:false,rt:null,hist:[],combo:0,phase:'ready'};};
NeonReflex.render=function(){var gs=this.gs,self=this;document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:14px;padding:0 2px"><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--ice)">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--orange)">'+(gs.combo>0?'x'+gs.combo:'—')+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Combo</div></div><div style="text-align:center"><div style="font-size:1.25rem">'+'❤️'.repeat(gs.lives)+'🖤'.repeat(Math.max(0,3-gs.lives))+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Lives</div></div><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--green)">'+gs.lvl+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Level</div></div></div><div id="rxarena" style="height:280px;border-radius:16px;background:rgba(100,210,255,.04);border:1px solid rgba(100,210,255,.11);position:relative;overflow:hidden;margin-bottom:12px"><div id="rxov" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px">'+(gs.phase==='ready'?'<div style="opacity:.38">Ready?</div><button type="button" class="btn bw" onclick="window._rxs()">▶ START</button>':gs.phase==='over'?'<div style="font-size:2.2rem;font-weight:800;color:var(--ice)">'+gs.sc+'</div><div style="opacity:.38;font-size:.8rem">Final Score</div>'+(gs.rt?'<div style="font-size:.78rem;color:var(--cyan)">Best: '+gs.rt+'ms</div>':'')+'<button type="button" class="btn bw" onclick="window._rxr()">Play Again</button>':'')+'</div><div id="rxtc" style="position:absolute;inset:0"></div></div><div style="display:flex;gap:4px;flex-wrap:wrap">'+gs.hist.slice(-8).map(function(t){return'<div style="padding:2px 8px;border-radius:6px;font-size:.68rem;font-weight:700;background:'+(t<200?'rgba(48,209,88,.17)':t<350?'rgba(100,210,255,.17)':'rgba(255,45,85,.17)')+';color:'+(t<200?'var(--green)':t<350?'var(--ice)':'var(--red)')+'">'+t+'ms</div>';}).join('')+'</div></div>';window._rxs=function(){gs.phase='playing';gs.active=true;document.getElementById('rxov').innerHTML='';self._spawn();};window._rxr=function(){clearTimeout(self._rt2);gs.sc=0;gs.lives=3;gs.lvl=1;gs.spd=Mutators.speed(950);gs.combo=0;gs.hist=[];gs.phase='ready';gs.active=false;Nav.go('game');self.render();};};
NeonReflex._spawn=function(){var gs=this.gs,self=this;if(!gs.active||gs.lives<=0)return;var arena=document.getElementById('rxtc');if(!arena)return;var sz=Math.max(44,73-gs.lvl*2.5);var ax=arena.clientWidth,ay=arena.clientHeight;var x=Math.random()*(ax-sz),y=Math.random()*(ay-sz);var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a];var c=cols[Math.floor(Math.random()*cols.length)];arena.innerHTML='';var t=document.createElement('div');t.className='rtgt';t.style.cssText='left:'+x+'px;top:'+y+'px;width:'+sz+'px;height:'+sz+'px;background:'+c+'1c;border:2.5px solid '+c+';box-shadow:0 0 14px '+c+'52;font-size:'+(sz*.34)+'px;color:'+c+';cursor:pointer';t.textContent='◉';var t0=Date.now(),hit=false;t.addEventListener('touchstart',function(e){e.preventDefault();if(hit)return;hit=true;var rt=Date.now()-t0;gs.hist.push(rt);if(!gs.rt||rt<gs.rt){gs.rt=rt;if(rt<S.prof.reflex||!S.prof.reflex){S.prof.reflex=rt;Daily.checkComplete('reflex');}}clearTimeout(self._rt2);gs.sc+=Math.max(5,Math.floor(100/(rt/100)));gs.combo++;gs.lvl=Math.floor(gs.sc/50)+1;gs.spd=Mutators.speed(Math.max(370,950-gs.lvl*44));if(rt<150){Ach.unlock('r150');Daily.checkComplete('reflex');}if(rt<200){Ach.unlock('r200');Daily.checkComplete('reflex');}if(Mutators.hasSudden()&&rt>400){gs.lives=0;}t.style.transform='scale(0)';Snd.reflex(rt);Hap.l();toast((rt<200?'⚡':rt<350?'✅':'🐢')+' '+rt+'ms');setTimeout(function(){self._spawn();},170);Nav.go('game');self.render();var ov=document.getElementById('rxov');if(ov)ov.innerHTML='';self._spawn();},{passive:false});arena.appendChild(t);self._rt2=setTimeout(function(){if(hit)return;arena.innerHTML='';gs.lives--;gs.combo=0;Snd.err();Hap.err();if(gs.lives<=3-gs.lives<2)Hap.panic();toast('Miss! -1 Life');if(gs.lives<=0){gs.active=false;gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();}else{setTimeout(function(){self._spawn();},440);Nav.go('game');self.render();var ov=document.getElementById('rxov');if(ov)ov.innerHTML='';self._spawn();}},Mutators.speed(gs.spd));};

var MemoryMatrix=new Game({id:'mem',title:'Memory Matrix',icon:'🧠',type:'memory',cat:'solo',col:PCBrand.h_30d158,mp:false,min:1,max:1,desc:'Remember complex patterns under pressure.'});
MemoryMatrix.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={lvl:1,sz:3,seq:[],pSeq:[],phase:'ready',sc:0,lives:3,showing:false};};
MemoryMatrix._gen=function(len,tot){return Array.from({length:len},function(){return Math.floor(Math.random()*tot);});};
MemoryMatrix.render=function(){var gs=this.gs,self=this;var sz=gs.sz,tot=sz*sz;document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-around;margin-bottom:12px"><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--green)">'+gs.lvl+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Level</div></div><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.25rem">'+'❤️'.repeat(gs.lives)+'</div></div></div><div id="mst" style="text-align:center;margin-bottom:9px;font-size:.84rem;opacity:.48;height:16px">'+(gs.phase==='show'?'Watch...':gs.phase==='input'?'Tap in order!':'')+'</div><div style="display:grid;grid-template-columns:repeat('+sz+',1fr);gap:5px;margin-bottom:12px" id="mgrid">'+Array.from({length:tot},function(_,i){return'<div class="mcell" id="mc'+i+'" onclick="window._mt('+i+')">'+'🟦🟩🟥🟨🟪🟧'[i%6]+'</div>';}).join('')+'</div><div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;margin-bottom:12px"><div id="mprog" style="height:100%;background:var(--green);border-radius:2px;transition:width .25s;width:'+(gs.seq.length?(gs.pSeq.length/gs.seq.length)*100:0)+'%"></div></div>'+(gs.phase==='ready'?'<button type="button" class="btn bw bf" onclick="window._ms()">▶ Level '+gs.lvl+'</button>':gs.phase==='over'?'<div style="text-align:center"><div style="font-size:1.75rem;font-weight:800;color:var(--green)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:12px">Level '+gs.lvl+'</div><button type="button" class="btn bw" onclick="window._mr()">Play Again</button></div>':'')+'</div>';if(gs.phase==='show'&&gs.seq.length&&!gs.showing){gs.showing=true;var spd=this.timerMs(550);var i=0;var iv=setInterval(function(){if(i>0){var p=document.getElementById('mc'+(gs.seq[i-1]));if(p)p.classList.remove('lit');}if(i<gs.seq.length){var el=document.getElementById('mc'+gs.seq[i]);if(el){el.classList.add('lit');Snd.reflex(i*16);}i++;}else{clearInterval(iv);var last=document.getElementById('mc'+gs.seq[i-1]);if(last)last.classList.remove('lit');gs.phase='input';gs.showing=false;var st=document.getElementById('mst');if(st)st.textContent='Tap in order!';}},spd);}window._ms=function(){gs.seq=self._gen(gs.lvl+2,tot);gs.pSeq=[];gs.phase='show';gs.showing=false;Nav.go('game');self.render();};window._mt=function(idx){if(gs.phase!=='input')return;var exp=gs.seq[gs.pSeq.length];gs.pSeq.push(idx);Snd.reflex(idx*8);Hap.l();var cell=document.getElementById('mc'+idx);if(idx===exp){if(cell){cell.classList.add('lit');setTimeout(function(){var c=document.getElementById('mc'+idx);if(c)c.classList.remove('lit');},250);}var prog=document.getElementById('mprog');if(prog)prog.style.width=((gs.pSeq.length/gs.seq.length)*100)+'%';if(gs.pSeq.length===gs.seq.length){gs.sc+=gs.lvl*10*(Mutators.xpMult());gs.lvl++;gs.sz=Math.min(5,3+Math.floor(gs.lvl/4));if(gs.lvl>=8)Daily.completeForGame('mem');if(gs.lvl>=10)Ach.unlock('m10');Snd.ok();Hap.ok();toast('Level '+(gs.lvl-1)+' done!');gs.phase='ready';gs.showing=false;setTimeout(function(){Nav.go('game');self.render();},500);}}else{if(cell){cell.style.background='rgba(255,45,85,.34)';setTimeout(function(){var c=document.getElementById('mc'+idx);if(c)c.style.background='';},450);}if(Mutators.hasSudden()){gs.lives=0;}else{gs.lives--;}Snd.err();Hap.err();toast('Wrong!');if(gs.lives<=0){gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();}else{gs.pSeq=[];gs.phase='show';gs.showing=false;setTimeout(function(){Nav.go('game');self.render();},700);}}};window._mr=function(){gs.lvl=1;gs.sz=3;gs.seq=[];gs.pSeq=[];gs.sc=0;gs.lives=3;gs.phase='ready';gs.showing=false;Nav.go('game');self.render();};};

var SignalDecode=new Game({id:'decode',title:'Signal Decode',icon:'🔐',type:'puzzle',cat:'solo',col:PCBrand.h_00d4ff,mp:false,min:1,max:1,desc:'Decode transmissions under pressure.'});
SignalDecode.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={lvl:1,sc:0,tl:60,phase:'ready',solved:0};};
SignalDecode._puz=function(lvl){var c=function(){var ws=['SIGNAL','DECODE','BREACH','CIPHER','NEXUS','GHOST','AGENT','PRISM','OMEGA','DELTA'];var w=ws[Math.floor(Math.random()*ws.length)];var sh=Math.floor(Math.random()*5)+1;return{type:'CAESAR',q:'DECODE: '+w.split('').map(function(x){return String.fromCharCode(((x.charCodeAt(0)-65+sh)%26)+65);}).join(''),a:w,h:'Shift back '+sh};};var m=function(){var s=Array.from({length:4},function(){return Math.floor(Math.random()*9)+1;});return{type:'MATH',q:'SUM: '+s.join(' + ')+' = ?',a:String(s.reduce(function(a,b){return a+b;},0)),h:'Add all'};};var pats=[{q:'2, 4, 8, 16, ?',a:'32',h:'Doubles'},{q:'1, 3, 6, 10, ?',a:'15',h:'Add 2,3,4,5'},{q:'1, 1, 2, 3, 5, ?',a:'8',h:'Fibonacci'},{q:'2, 3, 5, 7, 11, ?',a:'13',h:'Primes'},{q:'100, 91, 82, 73, ?',a:'64',h:'Minus 9'}];var pt=function(){var p=pats[Math.floor(Math.random()*pats.length)];return{type:'PATTERN',q:p.q,a:p.a,h:p.h};};var fns=[c,m,pt];return fns[Math.min(Math.floor(Math.random()*Math.min(fns.length,1+Math.floor(lvl/2))),fns.length-1)]();};
SignalDecode.render=function(){var gs=this.gs,self=this;var body=document.getElementById('gbody');if(gs.phase==='ready'){body.innerHTML='<div style="text-align:center;padding:30px 14px"><div style="font-size:3.4rem;margin-bottom:12px">🔐</div><div style="font-size:1.25rem;font-weight:800;margin-bottom:5px">Signal Decode</div><div style="opacity:.38;margin-bottom:24px">Break ciphers before time runs out</div><button type="button" class="btn bw blg bf" onclick="window._dstart()">▶ Begin</button></div>';window._dstart=function(){gs.phase='playing';gs.puz=self._puz(gs.lvl);gs.tl=Mutators.speed(Math.max(20,60-gs.lvl*5));Nav.go('game');self.render();self._timer();};return;}if(gs.phase==='over'){body.innerHTML='<div style="text-align:center;padding:30px 14px"><div style="font-size:2.7rem;margin-bottom:5px">🔐</div><div style="font-size:1.75rem;font-weight:800;color:var(--cyan)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:5px">'+gs.solved+' decoded</div><button type="button" class="btn bw" onclick="window._drst()">Again</button></div>';window._drst=function(){gs.lvl=1;gs.sc=0;gs.phase='ready';gs.solved=0;Nav.go('game');self.render();};return;}var pz=gs.puz;body.innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:var(--cyan)">'+gs.lvl+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Level</div></div><div style="text-align:center"><div id="_dtmr" style="font-size:1.45rem;font-weight:800;color:'+(gs.tl<=10?'var(--red)':'var(--green)')+'">'+gs.tl+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Sec</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div></div><div style="padding:18px;background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.15);border-radius:15px;text-align:center;margin-bottom:15px"><div style="font-size:.56rem;opacity:.32;letter-spacing:.15em;text-transform:uppercase;margin-bottom:5px">'+pz.type+'</div><div style="font-size:1.25rem;font-weight:800;font-family:monospace;color:var(--cyan)">'+pz.q+'</div><div style="opacity:.24;margin-top:9px;font-size:.68rem">Hint: '+pz.h+'</div></div><div style="display:flex;gap:7px;margin-bottom:9px"><input id="_dinp" type="text" placeholder="Answer..." autocomplete="off" autocorrect="off" autocapitalize="characters" style="flex:1;padding:11px 14px;border-radius:11px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);font-size:.9rem;font-weight:600;color:'+PCBrand.h_fff+';text-transform:uppercase" oninput="this.value=this.value.toUpperCase()" onkeydown="if(event.key===\'Enter\')window._dsub()"><button type="button" class="btn ba" style="padding:11px 15px;flex-shrink:0" onclick="window._dsub()">→</button></div></div>';window._dsub=function(){var val=(document.getElementById('_dinp').value||'').trim().toUpperCase();if(val===pz.a.toUpperCase()){clearInterval(self._dt);gs.solved++;if(gs.solved>=5)Daily.completeForGame('decode');gs.sc+=gs.lvl*20+Math.floor(gs.tl*2);gs.lvl++;gs.puz=self._puz(gs.lvl);gs.tl=Mutators.speed(Math.max(20,60-gs.lvl*5));Snd.ok();Hap.ok();toast('✅ +'+gs.lvl*20+' pts');Nav.go('game');self.render();self._timer();}else{Snd.err();Hap.err();var inp=document.getElementById('_dinp');if(inp){inp.style.borderColor='var(--red)';setTimeout(function(){var i=document.getElementById('_dinp');if(i)i.style.borderColor='';},440);}}};};
SignalDecode._timer=function(){var gs=this.gs,self=this;clearInterval(this._dt);this._dt=setInterval(function(){gs.tl--;var el=document.getElementById('_dtmr');if(el){el.textContent=gs.tl;el.style.color=gs.tl<=10?'var(--red)':'var(--green)';}if(gs.tl<=10)Snd.tick(gs.tl);if(gs.tl<=5)Hap.m();if(gs.tl<=0){clearInterval(self._dt);gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();}},1000);};

var QuickTap=new Game({id:'qtap',title:'Quick Tap',icon:'👆',type:'reflex',cat:'solo',col:PCBrand.h_ff6b00,mp:false,min:1,max:1,desc:'Maximum tap speed. Beat your record.'});
QuickTap.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={taps:0,tl:Mutators.speed(10),active:false,phase:'ready',best:0};};
QuickTap.render=function(){var gs=this.gs,self=this;document.getElementById('gbody').innerHTML='<div style="padding:5px 0;text-align:center"><div style="display:flex;justify-content:space-around;margin-bottom:18px"><div><div id="_qtt" style="font-size:2.1rem;font-weight:800;color:var(--orange)">'+gs.taps+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Taps</div></div><div><div id="_qtm" style="font-size:2.1rem;font-weight:800">'+gs.tl+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Seconds</div></div><div><div style="font-size:2.1rem;font-weight:800;color:var(--amber)">'+gs.best+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Best</div></div></div><div id="_tz" class="tapz" style="margin:0 auto 18px;--acc:var(--orange);--glow:rgba(255,107,0,.26)">'+(gs.phase==='ready'?'▶':gs.phase==='over'?'🏆':'👆')+'</div>'+(gs.phase==='ready'?'<div style="opacity:.38;font-size:.84rem">Tap to start!</div>':'')+(gs.phase==='over'?'<div style="margin-top:5px"><div style="opacity:.38;margin-bottom:12px">'+(gs.taps>=gs.best?'🎉 NEW RECORD!':'Best: '+gs.best)+'</div>'+(gs.taps>=80?'<div style="color:var(--amber);font-size:.8rem;margin-bottom:10px">🎯 Daily Challenge met!</div>':'')+'<button type="button" class="btn bw" onclick="window._qtr()">Try Again</button></div>':'')+'</div>';var tz=document.getElementById('_tz');tz.addEventListener('touchstart',function(e){e.preventDefault();if(gs.phase==='ready'){gs.phase='playing';gs.taps=0;gs.active=true;clearInterval(self._qi);self._qi=setInterval(function(){gs.tl--;var el=document.getElementById('_qtm');if(el)el.textContent=gs.tl;if(gs.tl<=3){Snd.tick(gs.tl);Hap.m();}if(gs.tl<=0){clearInterval(self._qi);if(gs.taps>gs.best)gs.best=gs.taps;gs.phase='over';gs.active=false;Snd.ok();Hap.ok();XP.add(gs.taps*2,Mutators.xpMult());if(gs.taps>=80)Daily.completeForGame('qtap');self.done(null);Nav.go('game');self.render();}},1000);}if(gs.phase!=='playing')return;gs.taps++;var el=document.getElementById('_qtt');if(el)el.textContent=gs.taps;Snd.reflex(gs.taps%5);Hap.l();tz.style.transform='scale(0.89)';setTimeout(function(){tz.style.transform='';},70);},{passive:false});window._qtr=function(){clearInterval(self._qi);gs.taps=0;gs.tl=Mutators.speed(10);gs.active=false;gs.phase='ready';Nav.go('game');self.render();};};

var PatternShift=new Game({id:'pat',title:'Pattern Shift',icon:'🔷',type:'puzzle',cat:'solo',col:PCBrand.h_bf5af2,mp:false,min:1,max:1,desc:'Patterns mutate. Adapt before time runs out.'});
PatternShift.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={lvl:1,sc:0,lives:3,phase:'new',target:[],cur:[],sz:3,tl:15};};
PatternShift._gen=function(sz){var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a];return Array.from({length:sz*sz},function(){return cols[Math.floor(Math.random()*cols.length)];});};
PatternShift.render=function(){var gs=this.gs,self=this;var sz=gs.sz;if(!gs.target.length||gs.phase==='new'){gs.target=this._gen(sz);gs.cur=[].concat(gs.target);gs.phase='show';gs.tl=Mutators.speed(Math.max(8,15-gs.lvl));}var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a];var h=Math.floor(272/sz);document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-around;margin-bottom:12px"><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:var(--violet)">'+gs.lvl+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Level</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.25rem">'+'❤️'.repeat(gs.lives)+'</div></div></div>'+(gs.phase==='show'?'<div style="text-align:center;margin-bottom:7px;opacity:.48;font-size:.84rem">Memorize!</div><div style="display:grid;grid-template-columns:repeat('+sz+',1fr);gap:5px;margin-bottom:12px">'+gs.target.map(function(c){return'<div class="pcell" style="background:'+c+';height:'+h+'px;border-radius:'+(11-sz)+'px"></div>';}).join('')+'</div><button type="button" class="btn bw bf" onclick="window._prd()">Got It!</button>':gs.phase==='input'?'<div style="text-align:center;margin-bottom:7px;opacity:.48;font-size:.84rem">Recreate! <span style="color:var(--violet);font-weight:700" id="_ptmr">'+gs.tl+'s</span></div><div style="display:grid;grid-template-columns:repeat('+sz+',1fr);gap:5px;margin-bottom:12px">'+gs.cur.map(function(c,i){return'<div class="pcell" id="_pc'+i+'" style="background:'+c+';height:'+h+'px;border-radius:'+(11-sz)+'px" onclick="window._ptap('+i+')"></div>';}).join('')+'</div><button type="button" class="btn bw bf" onclick="window._pchk()">Submit</button>':gs.phase==='over'?'<div style="text-align:center;padding:30px 0"><div style="font-size:2.1rem;font-weight:800;color:var(--violet)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:20px">Level '+gs.lvl+'</div><button type="button" class="btn bw" onclick="window._prst()">Play Again</button></div>':'')+'</div>';window._prd=function(){gs.phase='input';gs.cur=self._gen(sz);Nav.go('game');self.render();clearInterval(self._pti);self._pti=setInterval(function(){gs.tl--;var el=document.getElementById('_ptmr');if(el)el.textContent=gs.tl+'s';if(gs.tl<=0){clearInterval(self._pti);window._pchk();}},1000);};window._ptap=function(idx){var ci=cols.indexOf(gs.cur[idx]);gs.cur[idx]=cols[(ci+1)%cols.length];var el=document.getElementById('_pc'+idx);if(el)el.style.background=gs.cur[idx];Snd.click();Hap.l();};window._pchk=function(){clearInterval(self._pti);var ok=gs.target.every(function(c,i){return c===gs.cur[i];});if(ok){gs.sc+=gs.lvl*20*Mutators.xpMult();gs.lvl++;gs.sz=Math.min(5,3+Math.floor(gs.lvl/5));Snd.ok();Hap.ok();toast('✅ Level '+gs.lvl);gs.phase='new';gs.target=[];setTimeout(function(){Nav.go('game');self.render();},420);}else{if(Mutators.hasSudden())gs.lives=0;else gs.lives--;Snd.err();Hap.err();if(gs.lives<=0){gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);}else{gs.phase='show';toast('Not quite!');}Nav.go('game');self.render();}};window._prst=function(){gs.lvl=1;gs.sc=0;gs.lives=3;gs.sz=3;gs.target=[];gs.phase='new';Nav.go('game');self.render();};};

var GhostMode=new Game({id:'ghost',title:'Ghost Mode',icon:'👻',type:'survival',cat:'solo',col:PCBrand.h_8888ff,mp:false,min:1,max:1,desc:'Something invisible adapts to your behavior.'});
GhostMode.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={round:1,maxR:10,hp:100,sc:0,phase:'choose',safe:null,last:null,hist:[],aggr:0.3};};
GhostMode.render=function(){var gs=this.gs,self=this;var grid=4,tot=grid*grid;if(gs.phase==='new'||gs.phase==='choose'){var avoid=gs.hist.slice(-3);var safe;do{safe=Math.floor(Math.random()*tot);}while(avoid.includes(safe)||safe===gs.last);gs.safe=safe;gs.last=safe;gs.phase='choose';}if(gs.phase==='over'){document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:3.4rem;margin-bottom:5px">👻</div><div style="font-size:1.75rem;font-weight:800;color:'+PCBrand.h_8888ff+'">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:5px">Survived '+(gs.round-1)+' rounds</div><button type="button" class="btn bw" onclick="window._grst()">Try Again</button></div>';window._grst=function(){gs.round=1;gs.hp=100;gs.sc=0;gs.phase='choose';gs.hist=[];gs.aggr=0.3;gs.safe=null;gs.last=null;Nav.go('game');self.render();};return;}if(gs.hp<=20)Hap.panic();document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:'+PCBrand.h_8888ff+'">'+gs.round+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Round</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:'+(gs.hp>30?'var(--green)':'var(--red)')+(gs.hp<=30?' ;animation:heartbeat 1s ease infinite':'')+'">'+gs.hp+'%</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">HP</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div></div><div style="padding:9px;background:rgba(136,136,255,.07);border:1px solid rgba(136,136,255,.15);border-radius:11px;margin-bottom:12px;text-align:center;opacity:.58;font-size:.78rem">👻 Find the safe cell.</div><div style="display:grid;grid-template-columns:repeat('+grid+',1fr);gap:5px;margin-bottom:12px">'+Array.from({length:tot},function(_,i){return'<div class="ghcell" id="_gc'+i+'" style="height:62px;background:rgba(136,136,255,.05);border:1px solid rgba(136,136,255,.08)" onclick="window._gt('+i+')">?</div>';}).join('')+'</div><div style="opacity:.28;text-align:center;font-size:.68rem">Aggression: '+'🔴'.repeat(Math.floor(gs.aggr*5))+'</div></div>';window._gt=function(idx){gs.hist.push(idx);var isSafe=idx===gs.safe;for(var i=0;i<tot;i++){var c=document.getElementById('_gc'+i);if(c){if(i===gs.safe){c.textContent='✅';c.style.background='rgba(48,209,88,.15)';c.style.borderColor='var(--green)';}else{c.textContent='👻';c.style.background='rgba(136,136,255,.08)';}}}if(isSafe){gs.sc+=10*gs.round;Snd.ok();Hap.ok();toast('✅ Safe! +'+(10*gs.round));}else{var dmg=Math.floor(gs.aggr*(Mutators.hasSudden()?100:24));gs.hp=Math.max(0,gs.hp-dmg);Snd.danger();Hap.err();toast('👻 Caught! -'+dmg+' HP');}gs.round++;gs.aggr=Math.min(0.9,gs.aggr+0.05);if(gs.hp<=0||gs.round>gs.maxR){setTimeout(function(){gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();},900);}else{gs.phase='new';setTimeout(function(){Nav.go('game');self.render();},900);}};};

var AISurvival=new Game({id:'aisurv',title:'AI Survival',icon:'🤖',type:'survival',cat:'solo',col:PCBrand.h_ffd60a,mp:false,min:1,max:1,desc:'Procedural AI director generates survival scenarios.'});
AISurvival.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={turn:0,maxT:Mutators.hasSudden()?8:15,hp:100,en:80,food:70,ammo:5,sc:0};};
AISurvival.render=function(){var gs=this.gs,self=this;if(gs.turn>=gs.maxT||gs.hp<=0){XP.add(gs.sc,Mutators.xpMult());if(gs.turn>=12)Daily.completeForGame('aisurv');self.done(null);document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:3.4rem;margin-bottom:5px">🤖</div><div style="font-size:1.75rem;font-weight:800;color:var(--amber)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:5px">'+gs.turn+' turns survived</div><div style="opacity:.28;font-size:.78rem;margin-bottom:20px">'+(gs.hp>0?'Mission Complete!':'HP depleted.')+'</div><div style="display:flex;gap:7px;justify-content:center"><button type="button" class="btn ba" style="--acc:var(--amber);--glow:rgba(255,214,10,.28)" onclick="GL.launch(\'aisurv\')">Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div></div>';Snd.ok();return;}if(gs.hp<=20)Hap.panic();var ev=AI.sevts[Math.floor(Math.random()*AI.sevts.length)];document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="opacity:.32;font-size:.6rem;text-transform:uppercase">Turn '+(gs.turn+1)+'/'+gs.maxT+'</div><div style="font-size:.78rem;font-weight:700;color:var(--amber)">'+gs.sc+' pts</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px">'+[['❤️','HP',gs.hp,'var(--red)'],['⚡','Energy',gs.en,'var(--amber)'],['🍖','Food',gs.food,'var(--green)'],['🔫','Ammo',gs.ammo*10,'var(--cyan)']].map(function(row){return'<div style="padding:9px;background:rgba(255,255,255,.04);border-radius:11px;border:1px solid rgba(255,255,255,.07)"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:.68rem">'+row[0]+' '+row[1]+'</span><span style="font-size:.68rem;font-weight:700;color:'+row[3]+'">'+(row[1]==='Ammo'?gs.ammo:row[2])+'</span></div><div class="btrack"><div class="bfill" style="width:'+Math.min(100,row[2])+'%;background:'+row[3]+'"></div></div></div>';}).join('')+'</div><div style="padding:14px;background:rgba(255,214,10,.06);border:1px solid rgba(255,214,10,.15);border-radius:14px;margin-bottom:12px;text-align:center"><div style="font-size:2.1rem;margin-bottom:5px">'+ev.i+'</div><div style="opacity:.38;font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">AI DIRECTOR</div><div style="font-size:.88rem;font-weight:600;line-height:1.5">'+ev.t+'</div></div><div style="display:flex;flex-direction:column;gap:6px"><button type="button" class="btn bg bf" onclick="window._aia(\'fight\')">⚔️ Fight (costs 1 ammo)</button><button type="button" class="btn bg bf" onclick="window._aia(\'hide\')">🫥 Hide (risky)</button><button type="button" class="btn bg bf" onclick="window._aia(\'scav\')">🔍 Scavenge (risky)</button><button type="button" class="btn bg bf" onclick="window._aia(\'rest\')">💤 Rest (+20 HP)</button></div></div>';window._aia=function(a){var r=Math.random(),msg='';if(a==='fight'){if(gs.ammo>0){gs.ammo--;gs.sc+=15;var dmg=r<.3?Math.floor(Math.random()*12)+4:0;gs.hp=Math.max(0,gs.hp-dmg);msg=dmg?'⚔️ -'+dmg+' HP':'⚔️ Victory!';Snd.ok();}else{gs.hp=Math.max(0,gs.hp-20);msg='❌ No ammo!';Snd.err();}}else if(a==='hide'){gs.en=Math.max(0,gs.en-10);if(r<.25){gs.hp=Math.max(0,gs.hp-12);msg='🫥 Found! -12 HP';Snd.danger();}else{gs.sc+=5;msg='🫥 Hidden';Snd.click();}}else if(a==='scav'){if(r<.38){gs.hp=Math.max(0,gs.hp-16);msg='🕳️ Trap!';Snd.err();}else{gs.food=Math.min(100,gs.food+16);gs.ammo++;gs.sc+=10;msg='🔍 Supplies!';Snd.ok();}}else{gs.hp=Math.min(100,gs.hp+20);msg='💤 +20 HP';Snd.click();}gs.food=Math.max(0,gs.food-10);gs.en=Math.max(0,gs.en-5);if(gs.food<=0){gs.hp=Math.max(0,gs.hp-8);msg+=' Starving!';}if(Mutators.hasSudden()&&gs.hp<50){gs.hp=0;}gs.turn++;toast(msg);Hap.m();Nav.go('game');self.render();};};

var CyberTiles=new Game({id:'cyber',title:'Cyber Tiles',icon:'🔲',type:'puzzle',cat:'solo',col:PCBrand.h_30d158,mp:false,min:1,max:1,desc:'Tile-merge tactics. Chain reactions.'});
CyberTiles.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));var vs=[2,2,4,4,8,8,0,0,0,0,0,0,0,0,0,0];this.gs={grid:vs.slice().sort(function(){return Math.random()-.5;}).map(function(v){return{v:v};}),sz:4,sc:0,moves:0,combos:0,sel:null};};
CyberTiles._cm={'0':'rgba(255,255,255,.04)','2':'rgba(48,209,88,.12)','4':'rgba(0,212,255,.12)','8':'rgba(255,107,0,.12)','16':'rgba(191,90,242,.12)','32':'rgba(255,45,85,.12)','64':'rgba(255,214,10,.12)','128':'rgba(100,210,255,.2)','256':'rgba(48,209,88,.28)'};
CyberTiles._tc={'0':'transparent','2':PCBrand.h_30d158,'4':PCBrand.h_00d4ff,'8':PCBrand.h_ff6b00,'16':PCBrand.h_bf5af2,'32':PCBrand.h_ff2d55,'64':PCBrand.h_ffd60a,'128':PCBrand.h_64d2ff,'256':PCBrand.h_30d158};
CyberTiles.render=function(){var gs=this.gs,self=this;var sz=gs.sz;document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:var(--green)">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800">'+gs.moves+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Moves</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:var(--amber)">'+gs.combos+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Combos</div></div></div><div style="display:grid;grid-template-columns:repeat('+sz+',1fr);gap:5px;margin-bottom:12px">'+gs.grid.map(function(cell,i){return'<div class="tile" id="_t'+i+'" style="height:64px;background:'+(self._cm[cell.v]||self._cm[0])+';color:'+(self._tc[cell.v]||'transparent')+';font-size:'+(cell.v>=128?'.82rem':'1rem')+'" onclick="window._ctap('+i+')">'+(cell.v||'')+'</div>';}).join('')+'</div><div style="opacity:.32;text-align:center;font-size:.72rem;margin-bottom:9px">Tap adjacent matching tiles to merge</div><button type="button" class="btn bg bf" onclick="window._csh()">🔀 Shuffle (+5 moves)</button></div>';gs.sel=null;window._ctap=function(idx){if(gs.sel===null){if(!gs.grid[idx].v)return;gs.sel=idx;var el=document.getElementById('_t'+idx);if(el){el.style.borderColor='var(--green)';el.style.borderWidth='2px';}Snd.click();return;}var a=gs.sel,b=idx;gs.sel=null;document.querySelectorAll('.tile').forEach(function(t){t.style.borderColor='';t.style.borderWidth='';});if(a===b)return;var ra=Math.floor(a/sz),ca=a%sz,rb=Math.floor(b/sz),cb=b%sz;if(Math.abs(ra-rb)+Math.abs(ca-cb)!==1){Snd.err();toast('Not adjacent!');return;}if(gs.grid[a].v===gs.grid[b].v&&gs.grid[a].v>0){gs.grid[b].v*=2;gs.grid[a].v=0;gs.sc+=gs.grid[b].v*Mutators.xpMult();gs.combos++;gs.moves++;Snd.ok();Hap.m();toast('✅ +'+gs.grid[b].v);var empty=gs.grid.map(function(c,i){return c.v===0?i:null;}).filter(function(i){return i!==null;});if(empty.length>0)gs.grid[empty[Math.floor(Math.random()*empty.length)]].v=Math.random()<.7?2:4;}else{var tmp=gs.grid[a].v;gs.grid[a].v=gs.grid[b].v;gs.grid[b].v=tmp;gs.moves++;Snd.click();}Nav.go('game');self.render();};window._csh=function(){var vs=gs.grid.map(function(c){return c.v;}).sort(function(){return Math.random()-.5;});gs.grid=vs.map(function(v){return{v:v};});gs.moves+=5;Snd.reveal();Nav.go('game');self.render();};};

var RhythmPulse=new Game({id:'rhythm',title:'Rhythm Pulse',icon:'🎵',type:'reflex',cat:'solo',col:PCBrand.h_ff375f,mp:false,min:1,max:1,desc:'Tap to the beat. Dynamic rhythm patterns.'});
RhythmPulse.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={sc:0,combo:0,lives:3,phase:'ready',lvl:1,perfect:0,good:0,miss:0};};
RhythmPulse.render=function(){var gs=this.gs,self=this;var lc=[PCBrand.h_ff2d55,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158],li=['❤️','⭐','💎','🔥'];document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:9px"><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:var(--orange)">'+(gs.combo>0?'x'+gs.combo:'—')+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Combo</div></div><div style="text-align:center"><div style="font-size:1.2rem">'+'❤️'.repeat(gs.lives)+'</div></div></div><div id="_rf" style="height:228px;background:'+PCBrand.h_111+';border:1px solid rgba(255,255,255,.06);border-radius:12px;position:relative;overflow:hidden;margin-bottom:9px;display:flex">'+lc.map(function(c,i){return'<div style="flex:1;border-right:1px solid rgba(255,255,255,.04);position:relative;display:flex;align-items:flex-end;justify-content:center;padding-bottom:9px"><div style="width:38px;height:38px;border-radius:50%;border:2px solid '+c+'3e;display:flex;align-items:center;justify-content:center;font-size:.88rem">'+li[i]+'</div></div>';}).join('')+'<div id="_nc" style="position:absolute;inset:0;pointer-events:none"></div></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:9px">'+lc.map(function(c,i){return'<button type="button" style="height:50px;border-radius:11px;background:'+c+'1c;border:2px solid '+c+'52;font-size:1.15rem;cursor:pointer;transition:all .07s" id="_hb'+i+'" ontouchstart="window._rh('+i+',this);event.preventDefault()" onclick="window._rh('+i+',this)">'+li[i]+'</button>';}).join('')+'</div>'+(gs.phase==='ready'?'<button type="button" class="btn bw bf" onclick="window._rst()">▶ Start</button>':gs.phase==='over'?'<div style="text-align:center"><div style="display:flex;justify-content:center;gap:12px;margin-bottom:12px;font-size:.73rem"><span style="color:var(--cyan)">💎 '+gs.perfect+'</span><span style="color:var(--green)">✅ '+gs.good+'</span><span style="color:var(--red)">❌ '+gs.miss+'</span></div><button type="button" class="btn bw" onclick="window._rr()">Play Again</button></div>':'')+'</div>';window._rst=function(){gs.phase='playing';clearInterval(self._rl);var intv=Mutators.speed(Math.max(270,630-gs.lvl*18));self._rl=setInterval(function(){if(gs.phase!=='playing'){clearInterval(self._rl);return;}var nc=document.getElementById('_nc');if(!nc){clearInterval(self._rl);return;}var lane=Math.floor(Math.random()*4);var lw=nc.offsetWidth/4;var note=document.createElement('div');note.setAttribute('data-l',lane);note.style.cssText='position:absolute;width:38px;height:38px;border-radius:50%;background:'+lc[lane]+';box-shadow:0 0 10px '+lc[lane]+';left:'+(lane*lw+lw/2-19)+'px;top:-38px;transition:top '+intv+'ms linear;display:flex;align-items:center;justify-content:center;font-size:.82rem;font-weight:800;color:'+PCBrand.h_000+'';nc.appendChild(note);setTimeout(function(){note.style.top='238px';},7);setTimeout(function(){if(note.parentNode){note.remove();gs.miss++;gs.combo=0;gs.lives--;Snd.err();if(gs.lives<=3-gs.lives<2)Hap.panic();if(gs.lives<=0){clearInterval(self._rl);gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();}}},intv+150);gs.lvl=Math.min(18,1+Math.floor(gs.sc/80));},intv);Nav.go('game');self.render();};window._rh=function(lane,btn){if(gs.phase!=='playing')return;btn.style.transform='scale(0.85)';setTimeout(function(){btn.style.transform='';},80);var nc=document.getElementById('_nc');if(!nc)return;var notes=nc.querySelectorAll('[data-l="'+lane+'"]');var hit=false;notes.forEach(function(n){var ny=parseInt(n.style.top);if(ny>=182&&ny<=246&&!hit){var diff=Math.abs(ny-214);var pts,tp;if(diff<12){pts=20;tp='💎 PERFECT';gs.perfect++;}else{pts=10;tp='✅ GOOD';gs.good++;}gs.combo++;gs.sc+=pts*Math.max(1,Math.floor(gs.combo/5))*Mutators.xpMult();n.remove();hit=true;Snd.reflex(lane*44);Hap.l();toast(tp+' +'+pts);if(gs.combo>=10)Daily.completeForGame('rhythm');}});if(!hit){gs.combo=0;Snd.err();}};window._rr=function(){clearInterval(self._rl);gs.sc=0;gs.combo=0;gs.lives=3;gs.phase='ready';gs.perfect=0;gs.good=0;gs.miss=0;gs.lvl=1;Nav.go('game');self.render();};};

var InfiniteMaze=new Game({id:'maze',title:'Infinite Maze',icon:'🌀',type:'survival',cat:'solo',col:PCBrand.h_00d4ff,mp:false,min:1,max:1,desc:'Endlessly generated mazes. Hidden dangers.'});
InfiniteMaze.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));var sz=7;this.gs={lvl:1,sc:0,lives:3,phase:'play',maze:this._gen(sz),pos:0,exit:sz*sz-1,sz:sz,mazeCount:0};};
InfiniteMaze._gen=function(sz){var cells=Array.from({length:sz*sz},function(){return{wall:Math.random()<.22,trap:Math.random()<.08,bonus:Math.random()<.05};});cells[0].wall=false;cells[sz*sz-1].wall=false;var p=0;while(p<sz*sz-1){cells[p].wall=false;var r=p+1,d=p+sz;if(Math.random()<.5&&r<sz*sz&&Math.floor(r/sz)===Math.floor(p/sz))p=r;else if(d<sz*sz)p=d;else p++;}return cells;};
InfiniteMaze.render=function(){var gs=this.gs,self=this;var sz=gs.sz;if(gs.phase==='over'){document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:2.7rem;margin-bottom:5px">🌀</div><div style="font-size:1.75rem;font-weight:800;color:var(--cyan)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:5px">Level '+gs.lvl+'</div>'+(gs.mazeCount>=3?'<div style="color:var(--amber);font-size:.8rem;margin-bottom:10px">🎯 Daily Challenge met!</div>':'')+'<button type="button" class="btn bw" onclick="GL.launch(\'maze\')">Play Again</button></div>';return;}var h=Math.floor(236/sz);document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:9px"><div style="text-align:center"><div style="font-size:1.25rem;font-weight:800;color:var(--cyan)">'+gs.lvl+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Level</div></div><div style="text-align:center"><div style="font-size:1.25rem;font-weight:800">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.15rem">'+'❤️'.repeat(gs.lives)+'</div></div></div><div style="display:grid;grid-template-columns:repeat('+sz+',1fr);gap:2px;margin-bottom:12px;padding:5px;background:rgba(0,212,255,.04);border-radius:12px;border:1px solid rgba(0,212,255,.11)">'+gs.maze.map(function(cell,i){var ip=i===gs.pos,ie=i===gs.exit;var bg=cell.wall?'rgba(255,255,255,.12)':ip?'rgba(0,212,255,.34)':ie?'rgba(48,209,88,.34)':'rgba(255,255,255,.02)';return'<div style="height:'+h+'px;border-radius:2px;background:'+bg+';display:flex;align-items:center;justify-content:center;font-size:.6rem">'+(ip?'🔵':ie?'🟢':cell.trap?'':'')+'</div>';}).join('')+'</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;max-width:172px;margin:0 auto"><div></div><button type="button" class="btn bg" style="padding:11px" onclick="window._mv(\'u\')">↑</button><div></div><button type="button" class="btn bg" style="padding:11px" onclick="window._mv(\'l\')">←</button><button type="button" class="btn bg" style="padding:11px;background:rgba(0,212,255,.07)" onclick="window._mv(\'d\')">↓</button><button type="button" class="btn bg" style="padding:11px" onclick="window._mv(\'r\')">→</button></div></div>';window._mv=function(dir){var pos=gs.pos,r=Math.floor(pos/sz),c=pos%sz,np=pos;if(dir==='u'&&r>0)np=pos-sz;else if(dir==='d'&&r<sz-1)np=pos+sz;else if(dir==='l'&&c>0)np=pos-1;else if(dir==='r'&&c<sz-1)np=pos+1;if(np===pos||gs.maze[np].wall){Snd.err();return;}gs.pos=np;gs.sc++;Snd.click();Hap.l();if(gs.maze[np].trap){if(Mutators.hasSudden())gs.lives=0;else gs.lives--;gs.maze[np].trap=false;toast('💀 Trap! -1 Life');Snd.danger();Hap.err();}if(gs.maze[np].bonus){gs.sc+=10;gs.maze[np].bonus=false;toast('⭐ +10 pts');Snd.ok();}if(np===gs.exit){gs.mazeCount++;gs.lvl++;gs.sc+=gs.lvl*20;gs.sz=Math.min(11,7+Math.floor(gs.lvl/3));gs.maze=self._gen(gs.sz);gs.pos=0;gs.exit=gs.sz*gs.sz-1;toast('🎉 Level '+gs.lvl+'!');Snd.ok();Hap.ok();if(gs.mazeCount>=3)Daily.completeForGame('maze');}if(gs.lives<=0){gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);}Nav.go('game');self.render();};};
// ═══ 4 NEW GAMES ════════════════════════════════════════════════════

// 21. IMPOSTER FREQUENCY (MP)
var ImposterFreq=new Game({id:'impfreq',title:'Imposter Frequency',icon:'📻',type:'deduction',cat:'multiplayer',col:PCBrand.h_bf5af2,mp:true,min:3,max:10,desc:'Everyone gets the same topic — except the imposters.'});
ImposterFreq.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);Director.init(pl.length);var topics=[{real:'Things on a beach',fake:'Things at a pool'},{real:'Parts of a car',fake:'Parts of a truck'},{real:'Things in a kitchen',fake:'Things in a restaurant'},{real:'Olympic sports',fake:'Sports in general'},{real:'Things at a wedding',fake:'Things at a birthday party'},{real:'Actions in a spy movie',fake:'Actions in an action movie'},{real:'Things you carry in a bag',fake:'Things in a backpack'},{real:'Words describing weather',fake:'Words describing temperature'},{real:'Things on a smartphone',fake:'Things on a computer'},{real:'Ingredients in pizza',fake:'Ingredients in a sandwich'}];var topic=topics[Math.floor(Math.random()*topics.length)];var sc=Math.max(1,Math.floor(pl.length*.2));var imposterIdxs=this.shuf([...pl.keys()]).slice(0,sc);var imposterIds=imposterIdxs.map(function(i){return pl[i].id;});this.gs={phase:'reveal',topic:topic,imposterIds:imposterIds,ridx:0,sus:{},votes:{},pidx:0,sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),round:1,chatLog:[]};};
ImposterFreq.render=function(){var gs=this.gs;if(gs.phase==='reveal')this._reveal();else if(gs.phase==='discuss')this._discuss();else this._vote();};
ImposterFreq._reveal=function(){var gs=this.gs,self=this;var p=this.players[gs.ridx];if(!p){gs.phase='discuss';Nav.go('game');this._discuss();return;}var isImp=gs.imposterIds.includes(p.id);Hap.roleReveal(isImp);var sec='<div style="text-align:center"><div style="font-size:2.7rem;margin-bottom:9px">'+(isImp?'👾':'📻')+'</div><div style="font-size:1.3rem;font-weight:800;color:'+(isImp?'var(--violet)':'var(--cyan)')+';margin-bottom:9px">'+(isImp?'YOU ARE THE IMPOSTER':'Your Topic')+'</div><div style="padding:14px;background:'+(isImp?'rgba(191,90,242,.12)':'rgba(0,212,255,.12)')+';border:1px solid '+(isImp?'rgba(191,90,242,.28)':'rgba(0,212,255,.28)')+';border-radius:14px;margin-bottom:9px"><div style="font-weight:800;font-size:1rem">'+(isImp?gs.topic.fake:gs.topic.real)+'</div></div><div style="opacity:.38;font-size:.8rem">'+(isImp?'Your topic is SLIGHTLY different. Blend in.':'Discuss naturally. Find who doesn\'t fit.')+'</div></div>';document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><button type="button" class="btn bg bf" style="max-width:250px;margin:0 auto" onclick="window._ifp()">Pass to '+p.av+' '+p.name+'</button></div>';window._ifp=function(){PP.show(p.name,p.av,'Your role',sec,function(){gs.ridx++;Nav.go('game');self.render();});};};
ImposterFreq._discuss=function(){var gs=this.gs,self=this;Drama.tick('vote');Director.next();var timer=Mutators.speed(120);if(!gs.discStart)gs.discStart=Date.now();document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:14px"><div id="_ift" style="font-size:2.5rem;font-weight:800;color:var(--violet)">'+timer+'</div><div style="opacity:.38;margin-top:3px;font-size:.8rem">Discuss freely. Be natural.</div></div><div style="padding:13px;background:rgba(191,90,242,.07);border:1px solid rgba(191,90,242,.15);border-radius:13px;margin-bottom:14px"><div style="opacity:.38;font-size:.65rem;text-transform:uppercase;margin-bottom:4px">Everyone knows their topic</div><div style="font-size:.97rem;font-weight:700">Talk about it — but the imposter\'s topic is slightly different!</div></div><div style="margin-bottom:12px"><div style="font-size:.68rem;opacity:.38;margin-bottom:8px;text-transform:uppercase;letter-spacing:.1em">Discussion tips</div>'+['Ask "What\'s your favourite part?"','Say one specific fact','React to what others say','Watch for hesitation'].map(function(t){return'<div style="padding:7px 10px;background:rgba(255,255,255,.04);border-radius:8px;margin-bottom:4px;font-size:.78rem">→ '+t+'</div>';}).join('')+'</div><button type="button" class="btn ba" style="--acc:var(--violet);--glow:rgba(191,90,242,.28)" onclick="clearInterval(self._ifi);gs.phase=\'vote\';Nav.go(\'game\');self._vote()">🗳️ Start Voting</button></div>';var tl=timer;this._ifi=setInterval(function(){tl--;var el=document.getElementById('_ift');if(el){el.textContent=tl;el.style.color=tl<=20?'var(--red)':'var(--violet)';}if(tl<=10)Hap.m();if(tl<=0){clearInterval(self._ifi);gs.phase='vote';Nav.go('game');self._vote();}},1000);};
ImposterFreq._vote=function(){var gs=this.gs,self=this;Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:14px"><div style="font-size:.97rem;font-weight:700">Vote for the Imposter</div><div style="opacity:.38;font-size:.78rem;margin-top:3px">Who seemed to be talking about something different?</div></div>'+this.players.map(function(p){return'<div class="vopt" onclick="window._ifv(this,\''+p.id+'\')"><div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem">'+p.av+'</div><div style="font-weight:700">'+p.name+'</div></div>';}).join('')+'<button type="button" class="btn br bf" style="margin-top:12px;display:none" id="_ifvb" onclick="window._ifrvl()">Reveal!</button></div>';var voted=null;window._ifv=function(el,pid){document.querySelectorAll('.vopt').forEach(function(v){v.classList.remove('sel');});el.classList.add('sel');voted=pid;document.getElementById('_ifvb').style.display='block';Snd.vote();};window._ifrvl=function(){if(!voted)return;var isImp=gs.imposterIds.includes(voted);var accused=self.players.find(function(p){return p.id===voted;});var imposters=gs.imposterIds.map(function(id){return self.players.find(function(p){return p.id===id;});});document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><div style="font-size:3.4rem;margin-bottom:5px">'+(isImp?'✅':'❌')+'</div><div style="font-size:1.45rem;font-weight:800;margin-bottom:5px">'+(isImp?'IMPOSTER FOUND!':'WRONG!')+'</div><div style="font-size:2.7rem;margin:9px 0">'+accused.av+'</div><div style="font-size:1rem;font-weight:700">'+accused.name+'</div><div style="opacity:.38;margin-bottom:12px">'+(isImp?'was the imposter':'was innocent')+'</div><div class="glass" style="padding:13px;margin-bottom:14px"><div style="opacity:.38;font-size:.65rem;text-transform:uppercase;margin-bottom:5px">The real topics</div><div style="font-size:.9rem"><span style="color:var(--cyan)">Real: '+gs.topic.real+'</span><br><span style="color:var(--violet);margin-top:4px;display:block">Fake: '+gs.topic.fake+'</span></div></div><div style="display:flex;gap:7px;justify-content:center"><button type="button" class="btn ba" style="--acc:var(--violet);--glow:rgba(191,90,242,.28)" onclick="GL.launch(\'impfreq\')">Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div></div>';self.done(isImp?'Resistance':imposters[0].name);isImp?(Snd.ok(),Hap.ok()):(Snd.betray(),Hap.err());Drama.tick(isImp?'win':'betray');};};

// 22. TRUST FALL (MP) — prisoner's dilemma
var TrustFall=new Game({id:'trust',title:'Trust Fall',icon:'🤝',type:'strategy',cat:'multiplayer',col:PCBrand.h_30d158,mp:true,min:2,max:8,desc:'Cooperate or defect? Prisoner\'s dilemma at scale.'});
TrustFall.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,maxR:6,sc:pl.reduce(function(o,p){o[p.id]=10;return o;},{}),choices:{},pidx:0,history:[],phase:'choose'};};
TrustFall.render=function(){var gs=this.gs,self=this;if(gs.round>gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}if(gs.phase==='choose')this._choose();else this._reveal();};
TrustFall._choose=function(){var gs=this.gs,self=this;var player=this.players[gs.pidx%this.players.length];if(gs.pidx>=this.players.length){gs.phase='reveal';Nav.go('game');this._reveal();return;}Drama.tick('vote');var insight=Memory.getInsight(player.name);var sec='<div style="text-align:center"><div style="font-size:2rem;margin-bottom:12px">🤝</div><div style="font-weight:700;font-size:1rem;margin-bottom:4px">Round '+gs.round+'/'+gs.maxR+'</div><div style="opacity:.38;font-size:.78rem;margin-bottom:16px">Your choice is secret until all players decide</div>'+(insight?'<div style="padding:8px 12px;background:rgba(255,255,255,.05);border-radius:10px;font-size:.72rem;opacity:.55;margin-bottom:14px;font-style:italic">💬 '+insight+'</div>':'')+'\x3cdiv style="display:flex;gap:10px">\x3cbutton class="btn" style="flex:1;background:rgba(48,209,88,.15);border:1px solid var(--green);padding:18px;font-size:.9rem;flex-direction:column;gap:4px" onclick="window._tf(\'coop\')">\x3cdiv style="font-size:1.5rem">🤝\x3c/div>\x3cdiv style="font-weight:700">COOPERATE\x3c/div>\x3cdiv style="font-size:.68rem;opacity:.55">Both gain if mutual\x3c/div>\x3c/button>\x3cbutton class="btn" style="flex:1;background:rgba(255,45,85,.15);border:1px solid var(--red);padding:18px;font-size:.9rem;flex-direction:column;gap:4px" onclick="window._tf(\'def\')">\x3cdiv style="font-size:1.5rem">🗡️\x3c/div>\x3cdiv style="font-weight:700">DEFECT\x3c/div>\x3cdiv style="font-size:.68rem;opacity:.55">Steal from cooperators\x3c/div>\x3c/button>\x3c/div>\x3c/div>';PP.show(player.name,player.av,'Round '+gs.round,sec,function(){Nav.go('game');self.render();});window._tf=function(choice){gs.choices[player.id]=choice;gs.pidx++;PP.done();Nav.go('game');self.render();};};
TrustFall._reveal=function(){var gs=this.gs,self=this;var coops=Object.entries(gs.choices).filter(function(e){return e[1]==='coop';}).map(function(e){return e[0];});var defs=Object.entries(gs.choices).filter(function(e){return e[1]==='def';}).map(function(e){return e[0];});var pts={};this.players.forEach(function(p){pts[p.id]=0;if(coops.includes(p.id)&&defs.length===0){pts[p.id]+=3;}else if(coops.includes(p.id)&&defs.length>0){pts[p.id]-=defs.length;}else if(defs.includes(p.id)){pts[p.id]+=coops.length*2;}gs.sc[p.id]=Math.max(0,(gs.sc[p.id]||10)+pts[p.id]);if(defs.includes(p.id)&&coops.length>0){Drama.tick('betray');Memory.recordBetrayal(p.name,'Group');S.prof.betrayals++;Ach.check();}});gs.history.push({round:gs.round,coops:coops.length,defs:defs.length});document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:14px"><div style="font-size:1rem;font-weight:700">Round '+gs.round+' Results</div></div><div style="display:flex;gap:9px;justify-content:center;margin-bottom:16px"><div style="text-align:center;padding:14px 20px;background:rgba(48,209,88,.1);border:1px solid rgba(48,209,88,.25);border-radius:13px"><div style="font-size:2rem">🤝</div><div style="font-size:1.25rem;font-weight:800;color:var(--green)">'+coops.length+'</div><div style="font-size:.7rem;opacity:.45">Cooperated</div></div><div style="text-align:center;padding:14px 20px;background:rgba(255,45,85,.1);border:1px solid rgba(255,45,85,.25);border-radius:13px"><div style="font-size:2rem">🗡️</div><div style="font-size:1.25rem;font-weight:800;color:var(--red)">'+defs.length+'</div><div style="font-size:.7rem;opacity:.45">Defected</div></div></div>'+this.players.map(function(p){var choice=gs.choices[p.id];var chg=pts[p.id];return'<div style="display:flex;align-items:center;gap:9px;padding:9px;border-bottom:1px solid rgba(255,255,255,.05)"><div>'+p.av+'</div><div style="font-size:1.2rem">'+(choice==='coop'?'🤝':'🗡️')+'</div><div style="flex:1;font-weight:700">'+p.name+'</div><div style="font-weight:800;color:'+(chg>0?'var(--green)':chg<0?'var(--red)':'var(--dim)')+'">'+(chg>0?'+':'')+chg+'</div><div style="opacity:.45;font-size:.8rem">= '+(gs.sc[p.id]||0)+'</div></div>';}).join('')+'<button type="button" class="btn bw bf" style="margin-top:14px" onclick="window._tfnx()">'+(gs.round>=gs.maxR?'Final Results':'Next Round →')+'</button></div>';Snd.reveal();Hap.h();window._tfnx=function(){if(gs.round>=gs.maxR){var sc=self.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});self.done(sc[0].n);self.showWin(sc[0].n,sc);return;}gs.round++;gs.choices={};gs.pidx=0;gs.phase='choose';Director.next();Nav.go('game');self.render();};};

// 23. REFLEX LADDER (Solo — ghost replay)
var ReflexLadder=new Game({id:'rxlad',title:'Reflex Ladder',icon:'🪜',type:'reflex',cat:'solo',col:PCBrand.h_ff375f,mp:false,min:1,max:1,desc:'Climb endless reflex tiers. Ghost of your best run.'});
ReflexLadder.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));var best=JSON.parse(localStorage.getItem('po5_rxlad')||'null');this.gs={tier:1,lives:5,sc:0,phase:'ready',history:[],ghost:best,targetMs:600,streak:0};};
ReflexLadder.render=function(){var gs=this.gs,self=this;if(gs.phase==='over'){var prev=JSON.parse(localStorage.getItem('po5_rxlad')||'null');var isNewBest=!prev||gs.sc>prev.sc;if(isNewBest)localStorage.setItem('po5_rxlad',JSON.stringify({sc:gs.sc,tier:gs.tier,hist:gs.history.slice(-20)}));document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:3.4rem;margin-bottom:5px">🪜</div><div style="font-size:1.75rem;font-weight:800;color:var(--pink)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:5px">Tier '+gs.tier+'</div>'+(isNewBest?'<div style="color:var(--amber);font-size:.9rem;margin-bottom:12px">⭐ NEW BEST!</div>':'')+'<button type="button" class="btn bw" onclick="GL.launch(\'rxlad\')">Play Again</button></div>';XP.add(gs.sc,Mutators.xpMult());self.done(null);return;}var tierTarget=Math.max(100,600-gs.tier*30);gs.targetMs=tierTarget;document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:14px"><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--pink)">'+gs.tier+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Tier</div></div><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--cyan)">'+tierTarget+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Target ms</div></div><div style="text-align:center"><div style="font-size:1.25rem">'+'❤️'.repeat(gs.lives)+'</div></div></div>'+(gs.ghost?'<div style="padding:8px 12px;background:rgba(255,55,95,.08);border:1px solid rgba(255,55,95,.18);border-radius:10px;margin-bottom:12px;font-size:.72rem;display:flex;justify-content:space-between"><span style="opacity:.55">👻 Ghost Best</span><span style="color:var(--pink);font-weight:700">'+gs.ghost.sc+' pts</span></div>':'')+'<div id="rxarena" style="height:265px;border-radius:16px;background:rgba(255,55,95,.04);border:1px solid rgba(255,55,95,.11);position:relative;overflow:hidden;margin-bottom:12px"><div id="rxov" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px">'+(gs.phase==='ready'?'<div style="opacity:.38;font-size:.84rem">React faster than '+tierTarget+'ms</div><button type="button" class="btn bw" onclick="window._rxls()">▶ START</button>':'')+'</div><div id="rxtc" style="position:absolute;inset:0"></div></div><div style="display:flex;gap:3px;flex-wrap:wrap">'+gs.history.slice(-10).map(function(t){return'<div style="padding:2px 7px;border-radius:5px;font-size:.65rem;font-weight:700;background:'+(t<=tierTarget?'rgba(48,209,88,.17)':'rgba(255,45,85,.17)')+';color:'+(t<=tierTarget?'var(--green)':'var(--red)')+'">'+t+'</div>';}).join('')+'</div></div>';window._rxls=function(){gs.phase='playing';document.getElementById('rxov').innerHTML='';self._lspawn();};};
ReflexLadder._lspawn=function(){var gs=this.gs,self=this;var arena=document.getElementById('rxtc');if(!arena)return;var sz=62;var ax=arena.clientWidth,ay=arena.clientHeight;var x=Math.random()*(ax-sz),y=Math.random()*(ay-sz);arena.innerHTML='';var t=document.createElement('div');t.className='rtgt';t.style.cssText='left:'+x+'px;top:'+y+'px;width:'+sz+'px;height:'+sz+'px;background:rgba(255,55,95,.2);border:3px solid #FF375F;box-shadow:0 0 22px #FF375F55;font-size:1.4rem;color:'+PCBrand.h_ff375f+';cursor:pointer';t.textContent='◉';var t0=Date.now(),hit=false;t.addEventListener('touchstart',function(e){e.preventDefault();if(hit)return;hit=true;var rt=Date.now()-t0;gs.history.push(rt);clearTimeout(self._rt2);var beat=rt<=gs.targetMs;if(beat){gs.sc+=Math.max(10,Math.floor(gs.targetMs/rt*10));gs.streak++;if(gs.streak>=3){gs.tier++;gs.streak=0;toast('🔥 Tier '+gs.tier+'! Target: '+Math.max(100,600-gs.tier*30)+'ms');Snd.lvlup();}else{toast('✅ '+rt+'ms'+(rt<200?' ⚡':''));Snd.ok();}Hap.l();}else{gs.lives--;gs.streak=0;toast('❌ '+rt+'ms (need <'+gs.targetMs+'ms)');Snd.err();Hap.err();}if(gs.lives<=0){gs.phase='over';Nav.go('game');self.render();}else{setTimeout(function(){self._lspawn();},250);Nav.go('game');self.render();var ov=document.getElementById('rxov');if(ov)ov.innerHTML='';self._lspawn();}},{passive:false});arena.appendChild(t);self._rt2=setTimeout(function(){if(hit)return;arena.innerHTML='';gs.lives--;gs.streak=0;Snd.err();Hap.err();toast('Timeout! -1 Life');if(gs.lives<=0){gs.phase='over';Nav.go('game');self.render();}else{setTimeout(function(){self._lspawn();},440);Nav.go('game');self.render();var ov=document.getElementById('rxov');if(ov)ov.innerHTML='';self._lspawn();}},gs.targetMs+400);};

// 24. NEON SNAKE (Solo)
var NeonSnake=new Game({id:'snake',title:'Neon Snake',icon:'🐍',type:'reflex',cat:'solo',col:PCBrand.h_30d158,mp:false,min:1,max:1,desc:'Classic snake. Neon aesthetic. Personal best.'});
NeonSnake.setup=function(pl){
  Game.prototype.setup.call(this,pl.slice(0,1));
  var best=parseInt(localStorage.getItem('po5_snake')||'0');
  this.gs={phase:'ready',sc:0,best:best,snake:[{x:10,y:10},{x:9,y:10},{x:8,y:10}],dir:{x:1,y:0},ndir:{x:1,y:0},food:{x:15,y:10},sz:20,speed:Mutators.speed(180),dead:false};
};
NeonSnake.render=function(){
  var gs=this.gs,self=this;
  var cw=Math.min(window.innerWidth-32,360);
  var cs=Math.floor(cw/gs.sz);
  var w=cs*gs.sz,h=cs*gs.sz;
  document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:var(--green)">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:var(--amber)">'+gs.best+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Best</div></div></div><canvas id="snakecan" width="'+w+'" height="'+h+'" style="display:block;margin:0 auto;border-radius:12px;border:1px solid rgba(48,209,88,.18);background:'+PCBrand.h_0a0a0a+';touch-action:none"></canvas>'+(gs.phase==='ready'?'<div style="text-align:center;margin-top:13px"><button type="button" class="btn bw" onclick="window._snkstart()">▶ Start</button></div>':gs.phase==='over'?'<div style="text-align:center;margin-top:11px"><div style="opacity:.38;margin-bottom:9px">'+(gs.sc>=gs.best&&gs.sc>0?'🎉 NEW BEST!':'Score: '+gs.sc)+'</div><button type="button" class="btn bw" onclick="GL.launch(\'snake\')">Play Again</button></div>':'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;max-width:155px;margin:11px auto 0"><div></div><button type="button" class="btn bg" style="padding:10px;font-size:.9rem" ontouchstart="gs.ndir={x:0,y:-1};event.preventDefault()">↑</button><div></div><button type="button" class="btn bg" style="padding:10px;font-size:.9rem" ontouchstart="gs.ndir={x:-1,y:0};event.preventDefault()">←</button><button type="button" class="btn bg" style="padding:10px;font-size:.9rem;background:rgba(48,209,88,.08)" ontouchstart="gs.ndir={x:0,y:1};event.preventDefault()">↓</button><button type="button" class="btn bg" style="padding:10px;font-size:.9rem" ontouchstart="gs.ndir={x:1,y:0};event.preventDefault()">→</button></div>')+'</div>';
  this._draw();
  if(gs.phase==='ready'||gs.phase==='over'){return;}
  var can=document.getElementById('snakecan');
  if(!can)return;
  var ts={x:0,y:0};
  can.addEventListener('touchstart',function(e){e.preventDefault();ts.x=e.touches[0].clientX;ts.y=e.touches[0].clientY;},{passive:false,once:false});
  can.addEventListener('touchend',function(e){
    e.preventDefault();
    var dx=e.changedTouches[0].clientX-ts.x,dy=e.changedTouches[0].clientY-ts.y;
    if(Math.abs(dx)>Math.abs(dy)){if(dx>15&&gs.dir.x!==-1)gs.ndir={x:1,y:0};else if(dx<-15&&gs.dir.x!==1)gs.ndir={x:-1,y:0};}
    else{if(dy>15&&gs.dir.y!==-1)gs.ndir={x:0,y:1};else if(dy<-15&&gs.dir.y!==1)gs.ndir={x:0,y:-1};}
  },{passive:false});
  window._snkstart=function(){
    gs.phase='playing';gs.snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    gs.dir={x:1,y:0};gs.ndir={x:1,y:0};gs.sc=0;
    self._loop();Nav.go('game');self.render();
  };
};
NeonSnake._draw=function(){
  var gs=this.gs;
  var can=document.getElementById('snakecan');if(!can)return;
  var ctx=can.getContext('2d'),W=can.width,H=can.height,sz=gs.sz,cs=Math.floor(W/sz);
  ctx.fillStyle=PCBrand.h_0a0a0a;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.03)';
  for(var i=0;i<sz;i++)for(var j=0;j<sz;j++){ctx.fillRect(i*cs+cs/2-1,j*cs+cs/2-1,2,2);}
  gs.snake.forEach(function(seg,i){
    var isH=i===0;
    ctx.fillStyle=isH?PCBrand.h_30d158:'rgba(48,209,88,'+(Math.max(0.1,0.85-i*0.04))+')';
    ctx.shadowColor=PCBrand.h_30d158;ctx.shadowBlur=isH?10:0;
    ctx.fillRect(seg.x*cs+1,seg.y*cs+1,cs-2,cs-2);
    ctx.shadowBlur=0;
  });
  ctx.fillStyle=PCBrand.h_ff2d55;ctx.shadowColor=PCBrand.h_ff2d55;ctx.shadowBlur=14;
  ctx.beginPath();ctx.arc(gs.food.x*cs+cs/2,gs.food.y*cs+cs/2,cs/2-2,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
};
NeonSnake._loop=function(){
  var gs=this.gs,self=this;
  clearInterval(this._snki);
  this._snki=setInterval(function(){
    if(gs.phase!=='playing'){clearInterval(self._snki);return;}
    if(!(gs.ndir.x===-gs.dir.x&&gs.ndir.y===-gs.dir.y))gs.dir=gs.ndir;
    var head={x:(gs.snake[0].x+gs.dir.x+gs.sz)%gs.sz,y:(gs.snake[0].y+gs.dir.y+gs.sz)%gs.sz};
    if(gs.snake.some(function(s){return s.x===head.x&&s.y===head.y;})){
      clearInterval(self._snki);
      if(gs.sc>gs.best){gs.best=gs.sc;localStorage.setItem('po5_snake',String(gs.best));}
      gs.phase='over';Snd.err();Hap.err();XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();return;
    }
    gs.snake.unshift(head);
    if(head.x===gs.food.x&&head.y===gs.food.y){
      gs.sc++;Snd.reflex(50);Hap.l();
      do{gs.food={x:Math.floor(Math.random()*gs.sz),y:Math.floor(Math.random()*gs.sz)};}
      while(gs.snake.some(function(s){return s.x===gs.food.x&&s.y===gs.food.y;}));
      if(gs.sc%5===0)gs.speed=Mutators.speed(Math.max(80,180-gs.sc*6));
    }else{gs.snake.pop();}
    self._draw();
  },gs.speed);
};



// ═══ BONUS GAMES 25-26 ════════════════════════════════════════════════

// 25. THE HEIST (MP co-op with mole)
var TheHeist=new Game({id:'heist',title:'The Heist',icon:'🏦',type:'strategy',cat:'multiplayer',col:PCBrand.h_ffd60a,mp:true,min:3,max:8,desc:'Co-op vault crack. But one player is the mole.'});
TheHeist.setup=function(pl){
  Game.prototype.setup.call(this,pl);Drama.reset(pl);Director.init(pl.length);
  var moleIdx=Math.floor(Math.random()*pl.length);
  var roles_h=['Hacker','Safecracker','Lookout','Driver','Explosives','Muscle'];
  this.gs={phase:'reveal',moleId:pl[moleIdx].id,ridx:0,round:0,maxR:5,
    players:pl.map(function(x,i){return Object.assign({},x,{role:roles_h[i%roles_h.length],heat:0});}),
    vault:{locks:4,cracked:0},alarms:0,acts:{}};
};
TheHeist.render=function(){var gs=this.gs;if(gs.phase==='reveal')this._reveal();else if(gs.phase==='plan')this._plan();else this._result();};
TheHeist._reveal=function(){var gs=this.gs,self=this;var p=gs.players[gs.ridx];
  if(!p){gs.phase='plan';Nav.go('game');this._plan();return;}
  var isMole=p.id===gs.moleId;Hap.roleReveal(isMole);
  var sec='<div style="text-align:center"><div style="font-size:2.7rem;margin-bottom:9px">'+(isMole?'🐀':'🦸')+'</div><div style="font-size:1.3rem;font-weight:800;color:'+(isMole?'var(--red)':'var(--amber)')+';margin-bottom:9px">'+(isMole?'YOU ARE THE MOLE':'Your Role: '+p.role)+'</div><div style="padding:11px;background:'+(isMole?'rgba(255,45,85,.1)':'rgba(255,214,10,.1)')+';border:1px solid '+(isMole?'rgba(255,45,85,.25)':'rgba(255,214,10,.25)')+';border-radius:12px"><div style="font-size:.84rem;font-weight:600">'+(isMole?'Slow down the heist without getting caught.':'Crack '+gs.vault.locks+' locks. Work together.')+'</div></div></div>';
  document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><button type="button" class="btn bg bf" style="max-width:250px;margin:0 auto" onclick="window._hrv()">Pass to '+p.av+' '+p.name+'</button></div>';
  window._hrv=function(){PP.show(p.name,p.av,'Your role',sec,function(){gs.ridx++;Nav.go('game');self.render();});};
};
TheHeist._plan=function(){var gs=this.gs,self=this;Drama.tick('vote');Director.next();
  var player=gs.players[gs.round%gs.players.length];
  var isMole=player.id===gs.moleId;
  var sec='<div><div style="font-size:.88rem;font-weight:700;text-align:center;margin-bottom:11px">Round '+(gs.round+1)+'/'+gs.maxR+' — '+player.role+'</div><div style="display:flex;gap:8px;margin-bottom:9px"><div style="flex:1;text-align:center;padding:10px;background:rgba(48,209,88,.1);border-radius:11px"><div style="font-size:1.1rem">🔓</div><div style="font-size:.75rem;font-weight:700;color:var(--green)">'+gs.vault.cracked+'/'+gs.vault.locks+'</div><div style="font-size:.6rem;opacity:.4">Cracked</div></div><div style="flex:1;text-align:center;padding:10px;background:rgba(255,45,85,.1);border-radius:11px"><div style="font-size:1.1rem">🚨</div><div style="font-size:.75rem;font-weight:700;color:var(--red)">'+gs.alarms+'</div><div style="font-size:.6rem;opacity:.4">Alarms</div></div></div><div style="display:flex;flex-direction:column;gap:7px"><button type="button" class="btn bg bf" onclick="window._ha(0)">🔧 Crack a lock (+1 cracked)</button><button type="button" class="btn bg bf" onclick="window._ha(1)">👁 Watch for guards</button><button type="button" class="btn bg bf" onclick="window._ha(2)">💻 Hack cameras (+2 cracked)</button>'+(isMole?'<button type="button" class="btn" style="background:rgba(255,45,85,.16);border:1px solid rgba(255,45,85,.28)" onclick="window._ha(3)">🚨 Trip the alarm</button>':'')+'</div></div>';
  PP.show(player.name,player.av,'Your action',sec,function(){Nav.go('game');self.render();});
  window._ha=function(action){
    if(action===0){gs.vault.cracked++;toast('🔧 Lock cracked!');}
    else if(action===1){gs.alarms=Math.max(0,gs.alarms-1);toast('👁 Area secured.');}
    else if(action===2){gs.vault.cracked+=2;gs.alarms++;toast('💻 Hacked! +2 locks');}
    else if(action===3){gs.alarms+=2;Memory.recordBetrayal(player.name,'Crew');Drama.tick('betray');toast('🚨 ALARM TRIGGERED!');Hap.betray();}
    gs.round++;
    if(gs.alarms>=4){PP.done();gs.phase='caught';Nav.go('game');self._gameover(false);}
    else if(gs.vault.cracked>=gs.vault.locks){PP.done();Nav.go('game');self._gameover(true);}
    else{PP.done();Nav.go('game');self._plan();}
  };
};
TheHeist._gameover=function(success){
  var gs=this.gs,self=this;
  var mole=gs.players.find(function(p){return p.id===gs.moleId;});
  var div=document.getElementById('gbody');
  div.innerHTML='<div style="text-align:center;padding:14px"><div style="font-size:3.4rem;margin-bottom:5px">'+(success?'\U0001f4b0':'\U0001f6a8')+'</div><div style="font-size:1.45rem;font-weight:800;margin-bottom:5px">'+(success?'VAULT CRACKED!':'CAUGHT!')+'</div><div style="opacity:.38;margin-bottom:14px">'+(success?'The crew pulled it off!':'Too many alarms.')+'</div><div style="padding:12px;background:rgba(255,45,85,.1);border:1px solid rgba(255,45,85,.2);border-radius:12px;margin-bottom:15px"><div style="opacity:.38;font-size:.68rem;text-transform:uppercase;margin-bottom:4px">The Mole Was...</div><div style="font-size:1.1rem;font-weight:800">'+mole.av+' '+mole.name+'</div></div><div style="display:flex;gap:7px;justify-content:center"><button type="button" class="btn ba" style="--acc:var(--amber);--glow:rgba(255,214,10,.28)" id="_hag">Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div></div>';
  document.getElementById('_hag').onclick=function(){GL.launch('heist');};
  self.done(success?'Crew':'Mole');Snd.ok();Hap.ok();
};
// 26. PRESSURE COOKER (Solo - escalating stress game)
var PressureCooker=new Game({id:'pressure',title:'Pressure Cooker',icon:'💢',type:'reflex',cat:'solo',col:PCBrand.h_ff2d55,mp:false,min:1,max:1,desc:'Tap the right button before pressure explodes.'});
PressureCooker.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={sc:0,lives:3,lvl:1,phase:'ready',pressure:0,maxP:100,round:0};};
PressureCooker.render=function(){var gs=this.gs,self=this;
  if(gs.phase==='over'){
    document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:3.4rem;margin-bottom:5px">💢</div><div style="font-size:1.75rem;font-weight:800;color:var(--red)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:20px">Level '+gs.lvl+'</div><button type="button" class="btn bw" id="_pcbtn">Try Again</button></div>';
    var b2=document.getElementById('_pcbtn');if(b2)b2.onclick=function(){GL.launch('pressure');};
    XP.add(gs.sc,Mutators.xpMult());self.done(null);return;
  }
  if(gs.phase==='ready'){
    document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:3.4rem;margin-bottom:14px">💢</div><div style="font-size:1.25rem;font-weight:800;margin-bottom:7px">Pressure Cooker</div><div style="opacity:.38;margin-bottom:26px">Tap the highlighted button before pressure hits 100!</div><button type="button" class="btn bw blg bf" onclick="window._pcstart()">▶ Start</button></div>';
    window._pcstart=function(){gs.phase='playing';Nav.go('game');self._loop();};
    return;
  }
  var pct=gs.pressure;
  var col=pct<50?'var(--green)':pct<80?'var(--amber)':'var(--red)';
  var btns=['🔴','🟡','🟢','🔵'];var target=Math.floor(Math.random()*4);gs._target=target;
  document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:14px"><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:var(--red)">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:'+col+'">'+Math.round(pct)+'%</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Pressure</div></div><div style="text-align:center"><div style="font-size:1.25rem">'+'❤️'.repeat(gs.lives)+'</div></div></div><div style="height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;margin-bottom:20px"><div id="_pcbar" style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+(pct<50?'var(--green),var(--green)':pct<80?'var(--amber),var(--orange)':'var(--red),'+PCBrand.h_ff0000+'')+');border-radius:4px;transition:width .1s"></div></div><div style="text-align:center;margin-bottom:18px;font-size:.84rem;opacity:.48">Tap: <span style="font-size:1.8rem">'+btns[target]+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:11px">'+btns.map(function(b,i){return'<button type="button" style="height:80px;border-radius:16px;font-size:2.2rem;background:'+(i===target?'rgba(255,255,255,.12)':'rgba(255,255,255,.04)')+';border:2px solid '+(i===target?'rgba(255,255,255,.4)':'rgba(255,255,255,.08)')+';transition:all .1s;cursor:pointer" onclick="window._pct('+i+')" ontouchstart="window._pct('+i+')">'+b+'</button>';}).join('')+'</div></div>';
  window._pct=function(idx){
    clearTimeout(self._pct);
    if(idx===gs._target){gs.sc+=10+gs.lvl;gs.pressure=Math.max(0,gs.pressure-20);Snd.ok();Hap.l();toast('✅ +'+( 10+gs.lvl));}
    else{gs.pressure=Math.min(100,gs.pressure+25);gs.lives--;Snd.err();Hap.err();if(gs.pressure>=100||gs.lives<=0){gs.phase='over';Nav.go('game');self.render();return;}}
    gs.round++;if(gs.round%8===0)gs.lvl++;Nav.go('game');self.render();
  };
};
PressureCooker._loop=function(){var gs=this.gs,self=this;
  clearInterval(this._pci);
  var spd=Mutators.speed(Math.max(300,1200-gs.lvl*80));
  this._pci=setInterval(function(){
    if(gs.phase!=='playing'){clearInterval(self._pci);return;}
    gs.pressure=Math.min(100,gs.pressure+2+gs.lvl*.5);
    var bar=document.getElementById('_pcbar');
    if(bar)bar.style.width=gs.pressure+'%';
    if(gs.pressure>=100){clearInterval(self._pci);gs.lives--;if(gs.lives<=0){gs.phase='over';Nav.go('game');self.render();}else{gs.pressure=50;Nav.go('game');self.render();}}
  },spd);
};


// ═══ UI BUILDERS ════════════════════════════════════════════════════

var UI={
home:function(){
  var p=S.prof,lvl=XP.lvl(p.xp);
  function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  var h=new Date().getHours();
  set('home-greeting',h<5?'Good night, '+p.name:h<12?'Good morning, '+p.name:h<17?'Good afternoon, '+p.name:'Good evening, '+p.name);
  set('hlvl','LV'+lvl);
  var xb=document.getElementById('hxp');if(xb)xb.style.width=XP.pct(p.xp)+'%';
  set('hav',p.av);set('sg',p.games);set('sw',p.wins);set('ss',p.best);
  // Widgets area
  var wa=document.getElementById('hw-area');
  if(wa){
    var html='';
    // Resume banner
    if(Suspend.has()){var snap=Suspend.load();if(snap){html+='<div style="margin:0 15px 10px;padding:13px 15px;background:rgba(0,212,255,.08);border:1.5px solid rgba(0,212,255,.25);border-radius:15px;cursor:pointer;display:flex;align-items:center;gap:12px" onclick="Suspend.resume()"><div style="font-size:1.75rem">'+snap.icon+'</div><div style="flex:1"><div style="font-weight:800;font-size:.9rem">▶ Resume '+snap.title+'</div><div style="font-size:.7rem;opacity:.4;margin-top:1px">'+Math.round((Date.now()-snap.ts)/60000)+'m ago</div></div><div style="font-size:.7rem;color:var(--cyan);font-weight:700">RESUME →</div></div>';}}
    // Daily challenge
    var daily=Daily.getToday(),done=Daily.isDone();
    html+='<div style="margin:0 15px 10px;padding:13px 15px;background:'+(done?'rgba(48,209,88,.07)':'rgba(255,214,10,.07)')+';border:1.5px solid '+(done?'rgba(48,209,88,.22)':'rgba(255,214,10,.22)')+';border-radius:15px;cursor:pointer" onclick="GL.launch(\''+daily.game+'\')"><div style="display:flex;align-items:center;gap:10px"><div style="font-size:1.6rem">'+daily.icon+'</div><div style="flex:1"><div style="font-size:.58rem;opacity:.35;text-transform:uppercase;letter-spacing:.09em;margin-bottom:2px">Today\'s Challenge'+(done?' ✓':'')+'</div><div style="font-weight:700;font-size:.86rem">'+daily.title+'</div><div style="font-size:.68rem;opacity:.42;margin-top:1px">'+daily.desc+'</div></div><div style="font-size:.73rem;color:var(--amber);font-weight:700">+'+daily.xp+'XP</div></div></div>';
    if(typeof PlayTracker!=='undefined')html+=PlayTracker.html();
    wa.innerHTML=html;
  }
  // Recent
  var rc=document.getElementById('recent');
  if(rc){
    if(!p.hist.length)rc.innerHTML='<div style="text-align:center;padding:18px 12px"><div style="font-size:1.6rem;margin-bottom:8px">🎮</div><div style="font-size:.84rem;opacity:.45;margin-bottom:12px;line-height:1.45">No games yet — pick your first adventure!</div><button type="button" class="btn bw bf" style="max-width:220px;margin:0 auto" onclick="Nav.go(\'library\')">Browse games →</button></div>';
    else rc.innerHTML=p.hist.slice(0,3).map(function(h){var g=Reg.list.find(function(gm){return gm.title===h.g;});return'<div style="display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer" onclick="GL.launch(\''+(g?g.id:'')+'\')"><div style="width:30px;height:30px;border-radius:8px;background:'+h.c+'1c;display:flex;align-items:center;justify-content:center;font-size:1rem">'+h.i+'</div><div style="flex:1"><div style="font-weight:700;font-size:.84rem">'+h.g+'</div><div style="font-size:.68rem;opacity:.3">'+h.dt+(h.w?' · '+h.w:' · no winner')+'</div></div><div style="opacity:.25;font-size:.72rem">▶</div></div>';}).join('');
  }
},
dash:function(){
  var p=S.prof,lvl=XP.lvl(p.xp);
  function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  set('drank',XP.rank(lvl));set('dlvl',lvl);set('dxp',p.xp);
  var xb=document.getElementById('dxpb');if(xb)xb.style.width=XP.pct(p.xp)+'%';
  set('dlc',lvl);set('dnxt',XP.nxt(p.xp)+' XP to next');
  set('dtg',p.games);set('dtw',p.wins);set('dts',p.best);
  set('dtt',p.time>=60?Math.floor(p.time/60)+'h':p.time+'m');
  set('dtr',p.reflex?p.reflex+'ms':'—');set('dtb',p.betrayals);
  var mp=document.getElementById('most-played-dash');
  if(mp&&typeof PlayTracker!=='undefined')mp.innerHTML=PlayTracker.html()||'<div style="text-align:center;padding:16px"><div style="font-size:1.4rem;margin-bottom:6px">📊</div><div style="font-size:.8rem;opacity:.45;margin-bottom:10px">Launch games to see your top picks</div><button type="button" class="btn bg bf" style="max-width:200px;margin:0 auto" onclick="Nav.go(\'library\')">Pick a game →</button></div>';
  // Win trend chart
  setTimeout(function(){
    var c=document.getElementById('wchart');if(!c)return;
    var ctx=c.getContext('2d'),W=c.width,H=c.height;
    ctx.clearRect(0,0,W,H);
    var hist=(p.hist||[]).slice(-12).reverse();
    if(!hist.length){ctx.fillStyle='rgba(255,255,255,.15)';ctx.font='11px system-ui';ctx.fillText('Play some games first!',10,H/2);return;}
    var wins=0;
    hist.forEach(function(h,i){var isW=h.w===p.name;if(isW)wins++;var x=(i/(Math.max(hist.length-1,1)))*(W-20)+10;var y=isW?H*0.22:H*0.75;if(i>0){var px=((i-1)/(Math.max(hist.length-1,1)))*(W-20)+10;var ph=(hist[i-1].w===p.name)?H*0.22:H*0.75;ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px,ph);ctx.lineTo(x,y);ctx.stroke();}ctx.fillStyle=isW?PCBrand.h_30d158:PCBrand.h_ff2d55;ctx.shadowColor=isW?PCBrand.h_30d158:PCBrand.h_ff2d55;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});
    ctx.fillStyle='rgba(255,255,255,.28)';ctx.font='10px system-ui';ctx.fillText(hist.length>0?Math.round(wins/hist.length*100)+'% win rate':'',5,H-5);
  },60);
  // Radar chart
  setTimeout(function(){
    var c=document.getElementById('radar');if(!c)return;
    var ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2,r=W*.38;
    ctx.clearRect(0,0,W,H);
    var labels=['Wins','Speed','Bluff','Betrayal','Survival'];
    var vals=[Math.min(1,(p.wins||0)/20),Math.min(1,p.reflex?Math.max(0,(500-p.reflex)/400):0),Math.min(1,(p.bluff||0)/10),Math.min(1,(p.betrayals||0)/10),Math.min(1,(p.time||0)/120)];
    // Grid
    for(var ring=1;ring<=3;ring++){ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;ctx.beginPath();labels.forEach(function(_,i){var a=i/labels.length*Math.PI*2-Math.PI/2;var rx=cx+Math.cos(a)*r*(ring/3);var ry=cy+Math.sin(a)*r*(ring/3);if(i===0)ctx.moveTo(rx,ry);else ctx.lineTo(rx,ry);});ctx.closePath();ctx.stroke();}
    // Axes
    labels.forEach(function(_,i){var a=i/labels.length*Math.PI*2-Math.PI/2;ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();});
    // Data
    var grd=ctx.createLinearGradient(0,0,W,H);grd.addColorStop(0,'rgba(191,90,242,.6)');grd.addColorStop(1,'rgba(0,212,255,.6)');
    ctx.fillStyle=grd;ctx.strokeStyle='rgba(0,212,255,.8)';ctx.lineWidth=2;ctx.beginPath();
    labels.forEach(function(_,i){var a=i/labels.length*Math.PI*2-Math.PI/2;var rv=vals[i];var px=cx+Math.cos(a)*r*rv;var py=cy+Math.sin(a)*r*rv;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});
    ctx.closePath();ctx.fill();ctx.stroke();
    // Persona block
    var pb=document.getElementById('persona-block');
    if(pb){var prs=Persona.analyze(p),title=Persona.getTitle(p);pb.innerHTML='<div style="font-size:.56rem;opacity:.32;text-transform:uppercase;margin-bottom:5px">Playstyle</div><div style="font-size:1.1rem">'+prs.icon+'</div><div style="font-weight:700;font-size:.86rem;margin-top:3px">'+prs.label+'</div><div style="font-size:.68rem;opacity:.35;margin-top:2px">'+title+'</div><div style="margin-top:7px;display:flex;flex-direction:column;gap:2px">'+prs.traits.map(function(t){return'<div style="font-size:.63rem;opacity:.42">• '+t+'</div>';}).join('')+'</div>';}
  },60);
  // Achievements
  var al=document.getElementById('achl');
  if(al)al.innerHTML=Ach.all.map(function(a){return'<div class="ach'+(S.ach.includes(a.id)?' got':'')+'"><div style="font-size:1.6rem;opacity:'+(S.ach.includes(a.id)?1:.22)+'">'+a.i+'</div><div style="flex:1"><div style="font-weight:700;font-size:.84rem;'+(S.ach.includes(a.id)?'':' opacity:.32')+'">'+a.n+'</div><div style="font-size:.68rem;opacity:.38">'+a.d+'</div></div><div style="font-size:.68rem;color:var(--amber);font-weight:700">+'+a.xp+'</div></div>';}).join('');
  // History
  var hl=document.getElementById('hlist');
  if(hl){if(!p.hist.length)hl.innerHTML='<div style="text-align:center;padding:18px;opacity:.22;font-size:.84rem">No games yet</div>';else hl.innerHTML=p.hist.slice(0,12).map(function(h){return'<div style="display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)"><div style="font-size:1.25rem">'+h.i+'</div><div style="flex:1"><div style="font-weight:700;font-size:.84rem">'+h.g+'</div><div style="font-size:.68rem;opacity:.32">'+(h.w||'N/A')+' · '+h.dt+'</div></div><div style="font-size:.68rem;opacity:.3">'+h.d+'m</div></div>';}).join('');}
  // Unlock progress
  var ul=document.getElementById('unlock-list');
  if(ul)ul.innerHTML=Meta.unlockables.map(function(u){var pct=Meta.getProgress(u.id),unlocked=Meta.isUnlocked(u.id);return'<div style="margin-bottom:8px;padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid '+(unlocked?'rgba(255,214,10,.28)':'var(--border)')+';border-radius:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:'+(unlocked?'0':'5px')+'"><div style="display:flex;align-items:center;gap:7px"><span style="font-size:1rem;opacity:'+(unlocked?1:.45)+'">'+u.icon+'</span><span style="font-size:.8rem;font-weight:700;opacity:'+(unlocked?.95:.55)+'">'+u.name+'</span>'+(u.legendary?'<span style="font-size:.55rem;background:rgba(255,214,10,.18);color:var(--amber);border-radius:100px;padding:1px 5px;font-weight:700">★</span>':'')+'</div><span style="font-size:.68rem;color:'+(unlocked?'var(--green)':'var(--dim)')+';font-weight:700">'+(unlocked?'✓':pct+'%')+'</span></div>'+(unlocked?'':'<div class="btrack"><div class="bfill" style="width:'+pct+'%;background:'+(u.legendary?'var(--amber)':'var(--cyan)')+'"></div></div>')+'</div>';}).join('');
},
prof:function(){
  var p=S.prof,lvl=XP.lvl(p.xp);
  function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  var wr=p.games>0?Math.floor((p.wins/p.games)*100):0;
  set('pav2',p.av);set('pnm2',p.name);set('prk2',XP.rank(lvl)+' · Level '+lvl);
  set('pwr',wr+'%');set('pbl',p.bluff||0);
  function setB(id,w){var el=document.getElementById(id);if(el)el.style.width=w+'%';}
  setB('pwrb',wr);setB('pblb',Math.min(100,(p.bluff||0)*5));
  if(p.reflex){set('prf',p.reflex+'ms');setB('prfb',Math.max(0,100-p.reflex/10));}
  // Avatar glow for high level
  var av2=document.getElementById('pav2');
  if(av2)av2.style.boxShadow=lvl>=7?'0 0 22px rgba(255,214,10,.32)':'';
  // Badges
  var pb=document.getElementById('pbadges');
  if(pb){var prs=Persona.analyze(p),title=Persona.getTitle(p);var badges=[{l:prs.label,i:prs.icon,c:'rgba(255,255,255,.1)'},{l:title,c:'rgba(255,214,10,.13)'}];if((p.betrayals||0)>10)badges.push({l:'Betrayer',i:'🗡️',c:'rgba(255,45,85,.13)'});if((p.bluff||0)>5)badges.push({l:'Bluffer',i:'🎭',c:'rgba(191,90,242,.13)'});pb.innerHTML=badges.map(function(b){return'<div style="background:'+b.c+';border-radius:100px;padding:4px 11px;font-size:.65rem;font-weight:700;white-space:nowrap">'+(b.i?b.i+' ':'')+b.l+'</div>';}).join('');}
  // Themes
  Theme.build(document.getElementById('tgrid'));
  // Settings toggles
  ['sfx','haptic','bg','save','largeTap','colorBlind'].forEach(function(k){var id={sfx:'tsfx',haptic:'thap',bg:'tbg',save:'tsv',largeTap:'tlargetap',colorBlind:'tcb'}[k];var el=document.getElementById(id);if(el)el.className='tog'+(S.cfg[k]?' on':'');});
  if(typeof PrismPerf!=='undefined')PrismPerf.apply();
}};

// ═══ ARCADE SCREEN ═══════════════════════════════════════════════════
var Arcade={build:function(){this._daily();this._tourney();this._custom();this._vault();},$:function(id){return document.getElementById(id);},
_daily:function(){var dw=this.$('daily-widget');if(!dw)return;var ch=Daily.getToday(),done=Daily.isDone();dw.innerHTML='<div style="display:flex;align-items:center;gap:11px;cursor:pointer" onclick="GL.launch(\''+ch.game+'\')"><div style="font-size:2rem">'+ch.icon+'</div><div style="flex:1"><div style="font-weight:800;font-size:.95rem">'+ch.title+'</div><div style="font-size:.73rem;opacity:.42;margin-top:2px">'+ch.desc+'</div></div><div style="text-align:right"><div style="font-size:.73rem;color:var(--amber);font-weight:700">+'+ch.xp+' XP</div><div style="font-size:.65rem;margin-top:3px;color:'+(done?'var(--green)':'var(--dim)')+'">'+( done?'✅ Done':'In Progress')+'</div></div></div>';},
_tourney:function(){var tw=this.$('tourney-widget');if(!tw)return;try{var ts=JSON.parse(localStorage.getItem('po5_tourney')||'null');}catch(e){var ts=null;}if(ts&&!ts.done){tw.innerHTML='<div class="glass" style="padding:13px;margin-bottom:8px"><div style="font-size:.86rem;font-weight:700;margin-bottom:8px">'+ts.gameIcon+' '+ts.gameTitle+' · Round '+ts.round+'</div>'+ts.bracket.map(function(m){return'<div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,.03);border-radius:9px;margin-bottom:5px"><div style="flex:1;text-align:center"><div>'+m.a.av+'</div><div style="font-size:.65rem">'+m.a.name+'</div></div><div style="font-size:.72rem;opacity:.35">vs</div><div style="flex:1;text-align:center">'+(m.b?'<div>'+m.b.av+'</div><div style="font-size:.65rem">'+m.b.name+'</div>':'<div style="opacity:.3;font-size:.7rem">BYE</div>')+'</div>'+(m.winner?'<div style="font-size:.65rem;color:var(--green)">✓ '+m.winner.name+'</div>':'<button type="button" class="btn bg bsm" style="font-size:.6rem;padding:4px 8px" onclick="window._twinn(\''+m.a.id+'\',\''+m.b?.id+'\')">Enter winner</button>')+'</div>';}).join('')+'</div><button type="button" class="btn bg bf" onclick="window._tnew()">New Tournament</button>';}else if(ts&&ts.done){tw.innerHTML='<div class="glass" style="padding:13px;text-align:center;margin-bottom:8px"><div style="font-size:1.8rem">🏆</div><div style="font-weight:800;color:var(--amber);margin-top:5px">'+(ts.champion?ts.champion.av+' '+ts.champion.name:'Champion')+'</div><div style="opacity:.38;font-size:.78rem;margin-top:3px">Tournament Complete</div></div><button type="button" class="btn bg bf" onclick="window._tnew()">New Tournament</button>';}else{tw.innerHTML='<button type="button" class="btn bg bf" onclick="window._tnew()">🏆 Create Tournament</button>';}window._twinn=function(aid,bid){try{var s=JSON.parse(localStorage.getItem('po5_tourney'));var m=s.bracket.find(function(m){return!m.winner&&(m.a.id===aid||(m.b&&m.b.id===aid));});if(m){m.winner=m.a.id===aid?m.a:m.b;if(s.bracket.every(function(m){return m.winner;})){var winners=s.bracket.map(function(m){return m.winner;});if(winners.length<=1){s.done=true;s.champion=winners[0];}else{s.round++;s.players=winners;// rebuild bracket
var ps=winners.sort(function(){return Math.random()-.5;});s.bracket=[];for(var i=0;i<ps.length;i+=2){if(ps[i+1])s.bracket.push({a:ps[i],b:ps[i+1],winner:null});else s.bracket.push({a:ps[i],b:null,winner:ps[i]});}}}}localStorage.setItem('po5_tourney',JSON.stringify(s));}catch(e){}Arcade.build();};window._tnew=function(){var avs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾'];Modal.open('<div><div style="font-size:1rem;font-weight:800;margin-bottom:3px">🏆 New Tournament</div><div style="font-size:.75rem;opacity:.38;margin-bottom:12px">Create bracket for 4 players</div>'+Array.from({length:4},function(_,i){return'<div class="pchip" style="margin-bottom:6px"><div style="font-size:1.1rem">'+avs[i]+'</div><input class="pinp" id="_tnp'+i+'" placeholder="Player '+(i+1)+'" value="Player '+(i+1)+'"></div>';}).join('')+'<div style="font-size:.7rem;opacity:.35;margin-bottom:7px;margin-top:4px">Game:</div><select id="_tng" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:'+PCBrand.h_fff+';font-size:.84rem;margin-bottom:12px">'+Reg.mp().map(function(g){return'<option value="'+g.id+'">'+g.icon+' '+g.title+'</option>';}).join('')+'</select><button type="button" class="btn bw bf" onclick="window._tstart()">Start</button></div>');window._tstart=function(){var players=Array.from({length:4},function(_,i){var nm=(document.getElementById('_tnp'+i)||{}).value||'Player '+(i+1);return{id:'t'+i,name:nm,av:avs[i],col:PCBrand.h_00d4ff};});var gId=(document.getElementById('_tng')||{}).value||'shadow';var g=Reg.get(gId);var ps=players.sort(function(){return Math.random()-.5;});var bracket=[];for(var i=0;i<ps.length;i+=2){if(ps[i+1])bracket.push({a:ps[i],b:ps[i+1],winner:null});else bracket.push({a:ps[i],b:null,winner:ps[i]});}var state={game:gId,gameTitle:g?g.title:'',gameIcon:g?g.icon:'🎮',players:players,bracket:bracket,round:1,done:false};localStorage.setItem('po5_tourney',JSON.stringify(state));Modal.close();setTimeout(function(){Arcade.build();},280);};};},
_custom:function(){var cc=this.$('custom-creator');if(!cc)return;Mutators.loadPresets();cc.innerHTML='<div style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;gap:8px"><select id="_cgg" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:'+PCBrand.h_fff+';font-size:.82rem">'+Reg.list.map(function(g){return'<option value="'+g.id+'">'+g.icon+' '+g.title+'</option>';}).join('')+'</select></div>'+(Mutators.active.length?'<div style="display:flex;flex-wrap:wrap;gap:5px;margin:-2px 0">'+Mutators.active.map(function(m){return'<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:2px 9px;font-size:.63rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('')+'</div>':'')+'<div style="display:flex;gap:7px"><button type="button" class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="Mutators.showPicker(function(){Arcade.build();})">⚙️ Mutators</button><button type="button" class="btn bw" style="flex:1" onclick="window._cgstart()">▶ Play Now</button></div>'+(Mutators.presets.length?'<div style="font-size:.63rem;opacity:.32;text-transform:uppercase;letter-spacing:.09em;margin-top:3px">Saved presets</div>'+Mutators.presets.map(function(pr,i){return'<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,.04);border-radius:9px"><div style="flex:1"><div style="font-size:.82rem;font-weight:700">'+pr.name+'</div><div style="font-size:.65rem;opacity:.35">'+pr.ids.join(', ')+'</div></div><button type="button" class="btn bg bsm" style="font-size:.62rem;padding:4px 8px" onclick="window._cgpreset('+i+')">Load</button></div>';}).join(''):'')+'</div>';window._cgstart=function(){var gId=(document.getElementById('_cgg')||{}).value||'shadow';var g=Reg.get(gId);if(!g)return;Mutators.apply();GL.launch(gId);};window._cgpreset=function(i){Mutators.active=Mutators.all.filter(function(m){return Mutators.presets[i].ids.includes(m.id);});Arcade.build();toast('Preset loaded: '+Mutators.presets[i].name);};},
_vault:function(){var vl=this.$('vault-list');if(!vl)return;vl.innerHTML=Meta.unlockables.map(function(u){var pct=Meta.getProgress(u.id),unl=Meta.isUnlocked(u.id);return'<div style="margin-bottom:8px;padding:11px 13px;background:rgba(255,255,255,.04);border:1px solid '+(unl?'rgba(255,214,10,.28)':'var(--border)')+';border-radius:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:'+(unl?'0':'5px')+'"><div style="display:flex;align-items:center;gap:7px"><span style="font-size:.97rem;opacity:'+(unl?1:.4)+'">'+u.icon+'</span><div><div style="font-size:.82rem;font-weight:700;opacity:'+(unl?.95:.5)+'">'+u.name+'</div><div style="font-size:.62rem;opacity:.35">'+u.type+(u.legendary?' · Legendary':'')+'</div></div></div><span style="font-size:.68rem;font-weight:700;color:'+(unl?'var(--green)':'var(--dim)')+'">'+(unl?'✓ OWNED':pct+'%')+'</span></div>'+(unl?'':'<div class="btrack"><div class="bfill" style="width:'+pct+'%;background:'+(u.legendary?'var(--amber)':'var(--cyan)')+'"></div></div>')+'</div>';}).join('');}};

// ═══ GAME LAUNCHER ════════════════════════════════════════════════════
var GL={
launch:function(id){var game=Reg.get(id);if(!game){toast('Game not found');return;}if(typeof PlayTracker!=='undefined')PlayTracker.record(id);Snd.click();Hap.m();if(game.mp)this._setup(game);else{var players=[{id:'p1',name:S.prof.name||'Player',av:S.prof.av||'🎮',col:PCBrand.h_64d2ff,local:true}];Cinematic.show(game,players,function(){GL._start(game,players);});}},
launchFeat:function(){if(S.feat)this.launch(S.feat.id);},
_setup:function(game){var avs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀','🎭','🔥'],cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a,PCBrand.h_64d2ff,PCBrand.h_ff375f],self=this;var pc=Math.max(game.min,2);var players=Array.from({length:pc},function(_,i){return{id:'p'+(i+1),name:'Player '+(i+1),av:avs[i%avs.length],col:cols[i%cols.length],local:i===0};});var render=function(){Modal.open('<div><div style="font-size:1.05rem;font-weight:800;margin-bottom:2px">'+game.icon+' '+game.title+'</div><div style="font-size:.76rem;opacity:.38;margin-bottom:13px">'+game.desc+'</div><div style="font-size:.6rem;opacity:.32;letter-spacing:.09em;text-transform:uppercase;margin-bottom:7px">Players ('+pc+'/'+game.max+')</div><div id="_pl">'+players.map(function(p,i){return'<div class="pchip"><div style="width:30px;height:30px;border-radius:50%;background:'+p.col+'1c;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">'+p.av+'</div><input class="pinp" placeholder="Player '+(i+1)+'" value="'+p.name+'" onchange="window._pn('+i+',this.value)" oninput="window._pn('+i+',this.value)">'+(i>0?'<div onclick="window._rp('+i+')" style="opacity:.22;cursor:pointer;padding:4px">✕</div>':'')+'</div>';}).join('')+'</div>'+(pc<game.max?'<button type="button" class="btn bg bf" style="margin-bottom:9px;margin-top:5px" onclick="window._ap()">+ Add Player</button>':'')+( Mutators.active.length?'<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px">'+Mutators.active.map(function(m){return'<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:2px 8px;font-size:.62rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('')+'</div>':'')+'\x3cdiv style="display:flex;gap:7px">\x3cbutton class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="window._smut()">⚙️\x3c/button>\x3cbutton class="btn bw" style="flex:1" onclick="window._sg()">▶ Start Game\x3c/button>\x3c/div>\x3c/div>');window._pn=function(i,v){players[i].name=v||'Player '+(i+1);};window._ap=function(){if(pc>=game.max)return;pc++;players.push({id:'p'+pc,name:'Player '+pc,av:avs[(pc-1)%avs.length],col:cols[(pc-1)%cols.length]});render();};window._rp=function(i){if(pc<=game.min){toast('Min '+game.min+' players');return;}players.splice(i,1);pc--;players.forEach(function(p,j){p.id='p'+(j+1);});render();};window._sg=function(){Modal.close();setTimeout(function(){Cinematic.show(game,players,function(){self._start(game,players);});},270);};window._smut=function(){Modal.close();setTimeout(function(){Mutators.showPicker(function(){render();});},270);};};render();},
_start:function(game,players){S.game=game;game.setup(players);Mutators.apply();Nav.go('game');document.getElementById('gtitle').textContent=game.title;document.getElementById('gbody').style.setProperty('--acc',game.col);document.getElementById('gbody').style.setProperty('--glow',game.col+'3a');game.render();Snd.reveal();// Auto-checkpoint after 3s (not immediately)
clearTimeout(this._ck);this._ck=setTimeout(function(){if(S.game&&S.game.gs&&Object.keys(S.game.gs).length>2)Suspend.save(S.game,S.game.gs,{});},3000);},
exitGame:function(){if(S.game){['_ft','_rt2','_dt','_qi','_rl','_si','_pti','_snki','_ifi','_ck','_wt'].forEach(function(k){clearInterval(S.game[k]);clearTimeout(S.game[k]);});S.game=null;}Drama.state.tension=0;Drama._updateBanner();Mutators.active=[];Nav.go('home');},
requestLeave:function(){
  var self=this;
  if(!S.game){self.exitGame();return Promise.resolve(true);}
  if(typeof CapConfirm!=='function'){self.exitGame();return Promise.resolve(true);}
  return CapConfirm({
    title:'Leave this game?',
    body:'Progress for this round will end. You can start again from Games.',
    confirmLabel:'Leave game',
    cancelLabel:'Keep playing',
    destructive:true
  }).then(function(ok){if(ok)self.exitGame();return ok;});
},
filter:function(cat){document.querySelectorAll('.pill').forEach(function(p){p.classList.remove('on');});var el=document.querySelector('.pill[data-c="'+cat+'"]');if(el)el.classList.add('on');this._buildLib(cat);},
_buildFeat:function(){var gs=Reg.list;var f=gs[Math.floor(Math.random()*gs.length)];S.feat=f;var bg=document.getElementById('feat-bg');if(bg)bg.style.background='linear-gradient(135deg,'+f.col+'36,'+f.col+'07)';function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}set('feat-title',f.title);set('feat-type',f.type);set('feat-desc',f.desc);set('feat-icon',f.icon);var badge=document.getElementById('feat-badge');if(badge){badge.textContent=f.mp?'👥 Multiplayer':'🎮 Solo';badge.style.background=f.col+'2a';}},
_buildScrollRow:function(id,games){var row=document.getElementById(id);if(!row)return;var mk=function(g){var d=document.createElement('div');d.className='mcard';d.setAttribute('role','button');d.setAttribute('tabindex','0');d.setAttribute('aria-label',(g.title||'Game')+' — '+(g.type||''));d.style.cssText='background:'+g.col+'15;border:1px solid '+g.col+'2e;flex-shrink:0';d.innerHTML='<div style="padding:11px;height:100%;display:flex;flex-direction:column;justify-content:space-between"><div style="font-size:1.65rem" aria-hidden="true">'+g.icon+'</div><div><div style="font-size:.78rem;font-weight:800;line-height:1.2">'+g.title+'</div><div style="font-size:.55rem;opacity:.38;margin-top:1px;text-transform:uppercase;letter-spacing:.07em">'+g.type+'</div></div></div>';d.onclick=function(){GL.launch(g.id);};d.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();GL.launch(g.id);}};return d;};row.innerHTML='';(games||[]).forEach(function(g){row.appendChild(mk(g));});},
_buildScrolls:function(){this._buildScrollRow('mp-row',Reg.mp());this._buildScrollRow('solo-row',Reg.solo());this._buildScrollRow('board-row',Reg.board());},
_buildLib:function(filter){var grid=document.getElementById('lib');if(!grid)return;var games=filter==='all'?Reg.list:filter==='multiplayer'?Reg.mp():filter==='solo'?Reg.solo():Reg.byCat(filter);var lc=document.getElementById('lib-count');if(lc)lc.textContent=games.length+' games · Fully offline';grid.innerHTML=games.map(function(g){return'<div class="lcard" style="background:'+g.col+'12;border:1px solid '+g.col+'28" onclick="GL.launch(\''+g.id+'\')"><div><div style="font-size:1.8rem;margin-bottom:5px">'+g.icon+'</div><div style="font-size:.88rem;font-weight:800;line-height:1.2">'+g.title+'</div><div style="font-size:.56rem;opacity:.4;margin-top:2px;text-transform:uppercase;letter-spacing:.07em">'+g.type+'</div></div><div><div style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.07);border-radius:100px;padding:3px 8px;font-size:.58rem;font-weight:700;margin-top:5px">'+(g.mp?'👥 '+g.min+'-'+g.max+'p':'🎮 Solo')+'</div></div></div>';}).join('');},
editProfile:function(){var p=S.prof;var avs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀','🎭','🔥','🌟','⚡','🎯'];Modal.open('<div><div style="font-size:1rem;font-weight:800;margin-bottom:12px">Edit Profile</div><input id="_ename" value="'+p.name+'" placeholder="Name" autocorrect="off" style="width:100%;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.06);font-size:.9rem;color:'+PCBrand.h_fff+';margin-bottom:12px"><div style="font-size:.6rem;opacity:.32;margin-bottom:5px;text-transform:uppercase;letter-spacing:.09em">Avatar</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">'+avs.map(function(a){return'<div onclick="window._pav(\''+a+'\',this)" style="width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,.06);border:2px solid '+(p.av===a?PCBrand.h_fff:'transparent')+';display:flex;align-items:center;justify-content:center;font-size:1.25rem;cursor:pointer" id="_av-'+a+'">'+a+'</div>';}).join('')+'</div><button type="button" class="btn bw bf" onclick="window._savep()">Save</button></div>');var sel=p.av;window._pav=function(a,el){sel=a;document.querySelectorAll('[id^="_av-"]').forEach(function(e){e.style.borderColor='transparent';});el.style.borderColor=PCBrand.h_fff;Snd.click();};window._savep=function(){var nm=document.getElementById('_ename').value.trim();if(nm)S.prof.name=nm;S.prof.av=sel;Save.save();Modal.close();UI.prof();UI.home();toast('Profile saved!');};},
togSet:function(key,el){S.cfg[key]=!S.cfg[key];el.className='tog'+(S.cfg[key]?' on':'');Save.save();Snd.click();if(key==='bg'||key==='lowPower'||key==='colorBlind'){if(typeof PrismPerf!=='undefined')PrismPerf.apply();}},
loadDemoSeed:function(opts){var silent=opts&&opts.silent;var run=function(){var nGames=(typeof Reg!=='undefined'&&Reg.list&&Reg.list.length)?Reg.list.length:39;var seedIds=['spy','ttt','reflex','chaos','chess'];var hist=[];seedIds.forEach(function(id){var g=Reg.get&&Reg.get(id);if(!g)return;hist.push({g:g.title,i:g.icon,w:'Demo Operative',d:12,dt:new Date().toLocaleDateString(),c:g.col});});S.prof={name:'Demo Operative',av:'🎭',xp:2850,lvl:XP.lvl(2850),games:nGames,wins:28,losses:14,streak:4,best:7,bluff:12,betrayals:6,reflex:187,time:3600,hist:hist,style:'chaos'};S.ach=['g1','w1','w10','p25','s3'];localStorage.setItem('po5s','1');Save.save();if(window.Prog&&Prog.data){Prog.data.xp=S.prof.xp;Prog.data.rank=XP.rank(S.prof.lvl);Prog.data.streak=4;Prog.data.gamesById=Prog.data.gamesById||{};seedIds.forEach(function(id){Prog.data.gamesById[id]=(Prog.data.gamesById[id]||0)+3;});if(Prog.save)Prog.save();}if(window.Rec){Rec.recent=[];seedIds.forEach(function(id){var g=Reg.get&&Reg.get(id);if(g)Rec.addRecent(g);});}if(GL._buildScrolls)GL._buildScrolls();UI.prof();UI.home();UI.dash();if(window.Rec&&Rec.render)Rec.render();toast('Demo profile loaded — Level '+S.prof.lvl+' · '+S.prof.games+' games');};if(silent){run();return;}if(typeof CapConfirm!=='function'){run();return;}CapConfirm({title:'Load demo profile?',body:'Adds XP, games played, wins, and achievements for demos.',confirmLabel:'Load demo',cancelLabel:'Cancel'}).then(function(ok){if(ok)run();});},
resetData:function(){Modal.open('<div style="text-align:center"><div style="font-size:1.75rem;margin-bottom:5px">⚠️</div><div style="font-size:.97rem;font-weight:700;margin-bottom:4px">Reset All Data?</div><div style="font-size:.78rem;opacity:.38;margin-bottom:14px">All progress deleted.</div><div style="display:flex;gap:7px"><button type="button" class="btn bg" style="flex:1" onclick="Modal.close()">Cancel</button><button type="button" class="btn br" style="flex:1" onclick="Save.reset()">Reset</button></div></div>');}};

// ═══ WELCOME (multi-step) ════════════════════════════════════════════
var W={_step:1,_av:'😎',_style:'',
init:function(){var avs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀'];var c=document.getElementById('wavs');if(!c)return;c.innerHTML=avs.map(function(a){return'<div onclick="W._selAv(\''+a+'\',this)" style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.07);border:2px solid '+(a===this._av?PCBrand.h_fff:'transparent')+';display:flex;align-items:center;justify-content:center;font-size:1.25rem;cursor:pointer">'+a+'</div>';},this).join('');},
_selAv:function(a,el){this._av=a;document.querySelectorAll('#wavs div').forEach(function(e){e.style.borderColor='transparent';});el.style.borderColor=PCBrand.h_fff;Hap.l();},
setStyle:function(s,el){this._style=s;document.querySelectorAll('#wstyles .pchip').forEach(function(e){e.classList.remove('on');});if(el)el.classList.add('on');S.prof.style=s;Hap.l();},
_goStep:function(n){document.querySelectorAll('.wstep').forEach(function(s){s.classList.remove('active');});var el=document.getElementById('ws'+n);if(el)el.classList.add('active');this._step=n;var dots=document.querySelectorAll('.wprogdot');dots.forEach(function(d,i){d.className='wprogdot'+(i<n?' on':'');});Snd.click();},
next:function(){if(this._step===1){var nm=(document.getElementById('wname').value||'').trim();if(!nm){toast('Enter your name!');return;}S.prof.name=nm;}if(this._step===4)return;if(this._step===3){this._scan();return;}this._goStep(this._step+1);},
_scan:function(){var self=this;this._goStep(4);var msgs=['Analyzing playstyle...','Building operator profile...','Calibrating betrayal index...','Computing trust matrix...','⚡ Profile ready!'];var bar=document.getElementById('wscan-bar');var msg=document.getElementById('wscan-msg');var icon=document.getElementById('wscan-icon');var result=document.getElementById('wscan-result');var prs=Persona.types[{deception:'deceptive',strategy:'strategic',reflex:'aggressive',chaos:'chaotic'}[self._style||'chaos']||'survivor'];var i=0;var iv=setInterval(function(){if(msg)msg.textContent=msgs[i]||'';if(bar)bar.style.width=((i+1)/msgs.length*100)+'%';i++;if(i>=msgs.length){clearInterval(iv);if(icon)icon.textContent=prs?prs.icon:'🔰';if(result){result.style.opacity='1';result.innerHTML='<div style="font-size:1.25rem;font-weight:800;margin-bottom:4px">'+(prs?prs.label:'Operative')+'</div><div style="opacity:.42;font-size:.78rem;margin-bottom:16px">Starting rank: Rookie</div><button type="button" class="btn bw bf" style="max-width:240px" onclick="W.finish()">Enter PrismCap →</button>';}Hap.ok();}},450);},
finish:function(){S.prof.av=this._av;localStorage.setItem('po5s','1');Save.save();var w=document.getElementById('welcome');if(w){w.style.opacity='0';w.style.transition='opacity .45s ease';setTimeout(function(){w.classList.add('out');},450);}UI.home();UI.prof();Snd.ok();Hap.ok();toast('Welcome, '+S.prof.name+'!');setTimeout(function(){if(!S.prof.games){var ch=Daily.getToday();Modal.open('<div style="text-align:center;padding:4px 0"><div style="font-size:2.2rem;margin-bottom:10px">'+ch.icon+'</div><div style="font-weight:800;font-size:1.02rem;margin-bottom:6px">Your first mission</div><div style="font-size:.8rem;opacity:.45;margin-bottom:18px;line-height:1.55">'+ch.title+' — '+ch.desc+'<br><span style="color:var(--amber);font-weight:700">+'+ch.xp+' XP</span> when you complete it</div><button type="button" class="btn bw bf" onclick="Modal.close();GL.launch(\''+ch.game+'\')">▶ Play now</button><button type="button" class="btn bg bf" style="margin-top:8px" onclick="Modal.close();Nav.go(\'library\')">Browse all games</button></div>');}else if(typeof Prog!=='undefined'&&!Prog.data.dailyClaimed){toast('🎁 Daily reward waiting on Home');}},1100);}};

// ═══ LOGO ANIMATION ══════════════════════════════════════════════════
function animLogo(id){var c=document.getElementById(id);if(!c)return;var x=c.getContext('2d'),a=0,W=c.width,H=c.height;var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a];(function draw(){x.clearRect(0,0,W,H);x.save();x.translate(W/2,H/2);x.rotate(a);for(var i=0;i<6;i++){x.save();x.rotate(Math.PI*2/6*i);x.fillStyle=cols[i];x.globalAlpha=0.85;x.beginPath();x.moveTo(0,0);x.lineTo(W*.38,-W*.12);x.lineTo(W*.38,W*.12);x.closePath();x.fill();x.restore();}x.fillStyle=PCBrand.h_fff;x.globalAlpha=1;x.beginPath();x.arc(0,0,W*.095,0,Math.PI*2);x.fill();x.restore();a+=0.026;requestAnimationFrame(draw);})();}

// ═══ SINGLE BOOT (no duplicates) ═════════════════════════════════════
// [boot moved to v4_boot_patch]
;

// ═══ FEATURE PATCHES & ADDITIONS ════════════════════════════════════

// ── QUICK LAUNCH: Shake to suggest a game ────────────────────────────
document.addEventListener('prism:shake', function(e){
  if(S.cur==='home'&&e.detail&&e.detail.intensity>40){
    var g=Reg.list[Math.floor(Math.random()*Reg.list.length)];
    if(g){toast('🎲 Try: '+g.title);Hap.m();}
  }
});

// ── WAKE LOCK: Keep screen on during games ───────────────────────────
var _wl=null;
function requestWakeLock(){
  if('wakeLock' in navigator){
    navigator.wakeLock.request('screen').then(function(wl){_wl=wl;}).catch(function(){});
  }
}
function releaseWakeLock(){if(_wl){_wl.release().catch(function(){});_wl=null;}}
Bus.on('game:start',function(){requestWakeLock();});
Bus.on('game:end',function(){releaseWakeLock();});
// Hook into GL
var _origGLstart=GL._start.bind(GL);
GL._start=function(game,players){
  requestWakeLock();
  Bus.emit('game:start',{game:game});
  _origGLstart(game,players);
};
var _origGLLeaveFn=GL.exitGame.bind(GL);
GL.exitGame=function(){releaseWakeLock();Bus.emit('game:end',{});_origGLLeaveFn();};

// ── INSTALL PROMPT (PWA) ─────────────────────────────────────────────
var _deferredInstall=null;
window.addEventListener('beforeinstallprompt',function(e){
  e.preventDefault();_deferredInstall=e;
  // Show install button in profile
  var btn=document.createElement('button');
  btn.className='btn bg bf';btn.style.marginBottom='10px';
  btn.textContent='📱 Install PrismCap';
  btn.onclick=function(){if(_deferredInstall){_deferredInstall.prompt();_deferredInstall.userChoice.then(function(r){if(r.outcome==='accepted')toast('✅ PrismCap installed!');_deferredInstall=null;});}};
  var prof=document.getElementById('profile-screen');
  if(prof){var last=prof.querySelector('[onclick="GL.resetData()"]');if(last&&last.parentNode)last.parentNode.insertBefore(btn,last);}
});

// ── LONG PRESS to suspend game ───────────────────────────────────────
var _lpt=null,_lph=false;
document.addEventListener('touchstart',function(e){
  if(S.cur!=='game'||!S.game)return;
  _lph=false;
  _lpt=setTimeout(function(){
    _lph=true;
    // Long press on header = suspend
    if(e.target.closest('.ghdr')){
      Hap.heavy();
      Modal.open('<div style="text-align:center"><div style="font-size:1.6rem;margin-bottom:7px">💾</div><div style="font-weight:700;margin-bottom:4px">Suspend Game?</div><div style="font-size:.78rem;opacity:.38;margin-bottom:14px">Resume anytime</div><div style="display:flex;gap:8px"><button type="button" class="btn bg" style="flex:1" onclick="Modal.close()">Keep Playing</button><button type="button" class="btn bw" style="flex:1" onclick="if(S.game){Suspend.save(S.game,S.game.gs,{});GL.exitGame();}Modal.close();">Suspend</button></div></div>');
    }
  },600);
},{passive:true});
document.addEventListener('touchend',function(){clearTimeout(_lpt);},{passive:true});

// Swipe navigation: permanently removed

// ── PLAYER COUNT SMART RECOMMENDER on Home ───────────────────────────
function buildRecommended(){
  var area=document.getElementById('hw-area');
  if(!area||S.prof.games<3)return;
  var tried=JSON.parse(localStorage.getItem('po5t')||'[]');
  var daily=(typeof Daily!=='undefined'&&Daily.getToday)?Daily.getToday():null;
  var recentIds={};if(window.Rec&&Rec.recent)Rec.recent.forEach(function(x){if(x&&x.id)recentIds[x.id]=1;});
  var untried=Reg.list.filter(function(g){
    if(tried.indexOf(g.id)>-1)return false;
    if(daily&&g.id===daily.game)return false;
    if(recentIds[g.id])return false;
    return true;
  });
  if(!untried.length)return;
  if(area.querySelector('[data-try-new]'))return;
  var pick=untried[Math.floor(Math.random()*Math.min(untried.length,5))];
  var div=document.createElement('div');
  div.setAttribute('data-try-new','1');
  div.style.cssText='margin:0 15px 10px;padding:12px 15px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:14px;cursor:pointer;display:flex;align-items:center;gap:10px';
  div.setAttribute('role','button');div.setAttribute('tabindex','0');div.setAttribute('aria-label','Try something new: '+pick.title);
  div.innerHTML='<div style="font-size:1.55rem" aria-hidden="true">'+pick.icon+'</div><div style="flex:1"><div style="font-size:.58rem;opacity:.3;text-transform:uppercase;letter-spacing:.09em;margin-bottom:2px">Try something new</div><div style="font-weight:700;font-size:.86rem">'+pick.title+'</div></div><div style="font-size:.72rem;color:var(--dim)">→</div>';
  div.onclick=function(){GL.launch(pick.id);};
  div.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();GL.launch(pick.id);}};
  if(area.children.length<3)area.appendChild(div);
}

// ── SCORE SHARING (copy to clipboard) ────────────────────────────────
function shareScore(game,score,extra){
  var txt='PrismCap | '+game+': '+score+(extra?' | '+extra:'')+' | Rank: '+XP.rank(XP.lvl(S.prof.xp))+' (Lv'+XP.lvl(S.prof.xp)+')';
  if(navigator.clipboard){navigator.clipboard.writeText(txt).then(function(){toast('📋 Score copied!');});}
  else{toast(txt,4000);}
}
window.shareScore=shareScore;

// ── STREAK ANIMATION on Win ──────────────────────────────────────────
Bus.on('drama:tick',function(state){
  // Pulse home stats on high tension
  if(state.tension>80&&S.cur==='home'){
    var el=document.getElementById('sg');
    if(el)el.style.animation='heartbeat .5s ease 3';
    setTimeout(function(){if(el)el.style.animation='';},1600);
  }
});

// ── KEYBOARD SUPPORT (iPad with keyboard) ────────────────────────────
document.addEventListener('keydown',function(e){
  if(S.cur==='game'&&S.game){
    var k=e.key;
    // Arrow keys for maze
    if(S.game.id==='maze'&&window._mv){
      if(k==='ArrowUp')window._mv('u');
      else if(k==='ArrowDown')window._mv('d');
      else if(k==='ArrowLeft')window._mv('l');
      else if(k==='ArrowRight')window._mv('r');
      e.preventDefault();
    }
    // Arrow keys for snake
    if(S.game.id==='snake'&&S.game.gs){
      var gs=S.game.gs;
      if(k==='ArrowUp'&&gs.dir.y!==1)gs.ndir={x:0,y:-1};
      else if(k==='ArrowDown'&&gs.dir.y!==-1)gs.ndir={x:0,y:1};
      else if(k==='ArrowLeft'&&gs.dir.x!==1)gs.ndir={x:-1,y:0};
      else if(k==='ArrowRight'&&gs.dir.x!==-1)gs.ndir={x:1,y:0};
    }
    // Escape = exit
    if(k==='Escape')GL.exitGame();
  }
  // Tab = switch screens
  if(k==='Tab'&&S.cur!=='game'){
    var tabs=['home','library','arcade','dashboard','profile'];
    var ci=tabs.indexOf(S.cur);
    Nav.go(tabs[(ci+1)%tabs.length]);
    e.preventDefault();
  }
});

// ── SMART GREETINGS + HOME REFRESH ───────────────────────────────────
// UI.home enhanced below

// ── GAME COUNT DISPLAY UPDATE ─────────────────────────────────────────
setTimeout(function(){
  var lc=document.getElementById('lib-count');
  if(lc)lc.textContent=Reg.list.length+' games · Fully offline';
},500);

// ── ORIENT LOCK attempt (portrait preferred) ─────────────────────────
if(screen.orientation&&screen.orientation.lock){
  screen.orientation.lock('portrait').catch(function(){});
}



// ═══════════════════════════════════════════════════════════════════
// PRISM OS v4 — PROFESSIONAL SYSTEMS
// ═══════════════════════════════════════════════════════════════════

// ── DEVICE SELECTION ─────────────────────────────────────────────
var DevSel = {
  _k: 'po5_dev',
  device: 'iphone', // iphone | ipad | mac
  init: function() {
    var saved = localStorage.getItem(this._k);
    if (saved) { this.device = saved; this._hide(); return; }
    // Auto-detect
    var w = window.innerWidth;
    if (w >= 1024) this.device = 'mac';
    else if (w >= 768) this.device = 'ipad';
    else this.device = 'iphone';
    // Show screen (let user confirm)
    var sel = document.getElementById('device-sel');
    if (sel) sel.style.display = 'flex';
    animLogo('dcan');
  },
  pick: function(dev) {
    this.device = dev;
    localStorage.setItem(this._k, dev);
    this._applyLayout(dev);
    this._hide();
    Hap.ok(); Snd.ok();
    toast('Layout: ' + dev.charAt(0).toUpperCase() + dev.slice(1));
  },
  _hide: function() {
    var sel = document.getElementById('device-sel');
    if (!sel) return;
    sel.style.transition = 'opacity .5s ease';
    sel.style.opacity = '0';
    setTimeout(function() { sel.style.display = 'none'; }, 520);
    this._applyLayout(this.device);
  },
  _applyLayout: function(dev) {
    document.body.setAttribute('data-device', dev);
    // CSS custom properties per device
    if (dev === 'mac') {
      document.documentElement.style.setProperty('--font-scale', '1.05');
      document.documentElement.style.setProperty('--card-radius', '20px');
    } else if (dev === 'ipad') {
      document.documentElement.style.setProperty('--font-scale', '1.02');
      document.documentElement.style.setProperty('--card-radius', '18px');
    } else {
      document.documentElement.style.setProperty('--font-scale', '1');
      document.documentElement.style.setProperty('--card-radius', '16px');
    }
  }
};

// ── HINT SYSTEM ───────────────────────────────────────────────────
var Hints = {
  _db: {
    // Per game hints
    shadow: [
      'Watch who votes quickly — fast voters often know more than they should.',
      'Shadows win if they avoid 2+ eliminations. Protect your allies.',
      'The Analyst can peek at alignments — find them and ally early.',
      'Resistance: focus votes on players with rising suspicion scores.',
      'Shadows: coordinate silently. If one is exposed, deny everything.'
    ],
    hot: [
      'Pass the device quickly when you hear it heating up in your hands.',
      'The fuse timer is completely random — never feel safe.',
      'Chaos cards change the passing rules. Read them fast.',
      'When few players remain, fuse timers get shorter.',
      'You lose a life when caught with the device, not when you pass it.'
    ],
    split: ['The presenter chooses which statement to read — top or bottom.', 'Bluffing successfully earns you 10 points per fooled guesser.', 'Watch facial expressions when the presenter reads — they reveal everything.', 'Lie detectors: look for hesitation, eye contact, and over-explanation.'],
    reflex: ['Tap the instant you see it appear, not when you recognize it.', 'Your best reaction time improves with practice — aim for sub-200ms.', 'Combo multiplier stacks — chain hits for massive scores.', 'The target size shrinks each level — use your thumb pad, not fingertip.'],
    mem: ['Say the sequence out loud quietly while watching.', 'Visualize the pattern as a path, not individual positions.', 'At higher levels, chunk the sequence into groups of 3.', 'Red cells are always top-left — use color as a spatial anchor.'],
    decode: ['Caesar ciphers: count backwards through the alphabet.', 'Pattern sequences: find the rule in the differences between numbers.', 'Math sums: estimate first, then verify. Speed beats precision.', 'BONUS hint: type and immediately submit — every second counts.'],
    chess: ['Control the center with pawns and knights in the opening.', 'Develop all pieces before launching an attack.', 'Castle early to protect your king.', 'Knights attack in an L-shape — use them to fork two pieces at once.', 'Rooks belong on open files — push pawns to open them.'],
    draughts: ['Control the center — pieces there have maximum mobility.', 'Force your opponent to the edge where their pieces have fewer moves.', 'Kings (crowned pieces) move in all 4 diagonal directions.', 'Plan 2-3 jumps ahead — chain captures win games.'],
    heist: ['The mole benefits from tripping 2 alarms in one action.', 'If someone consistently picks "watch for guards" with no result, suspect them.', 'Hackers crack 2 locks at once but raise alarms — use sparingly.', 'Discuss who does what before choosing — the mole will hesitate.'],
    trust: ['If everyone cooperates every round, everyone wins together.', 'One defector ruins mutual cooperation — punish defectors next round.', 'In small groups, defecting hurts you as much as others.', 'The safest strategy: cooperate until someone defects, then punish once.'],
    impfreq: ['Listen for words that are almost right — slightly wrong vocabulary is the tell.', 'Ask specific follow-up questions: imposters give vague answers.', 'Ask everyone the same question and compare answers for inconsistencies.'],
    spy: ['Spies: give accurate-sounding but vague answers. Never say the location directly.', 'Investigators: ask about specific aspects of the location only insiders would know.', 'Vote early if someone gives an answer that fits too many locations.'],
    snake: ['Avoid boxing yourself into corners — always leave an escape route.', 'Follow the walls early, then spiral inward as the snake grows.', 'Slow down near the food — a clean approach beats a risky one.'],
    maze: ['Try all directions before backtracking — dead ends are rare.', 'Stars give bonus points — small detours are worth it.', 'Traps are usually placed near the exit — approach carefully.'],
    pressure: ['Focus on the TARGET indicator, not the buttons themselves.', 'Tap the moment your eye lands on the correct button — hesitation costs.', 'At high pressure, your eyes widen — use peripheral vision.'],
    default: ['Take your time reading the rules before your first move.', 'The AI announcer gives clues about what\'s happening — listen!', 'You can suspend any game and resume it later with the 💾 button.', 'Earn XP to unlock themes and titles in your profile.']
  },
  get: function(gameId) {
    var pool = this._db[gameId] || this._db.default;
    return pool[Math.floor(Math.random() * pool.length)];
  },
  show: function(gameId) {
    var hint = this.get(gameId);
    Modal.open('<div style="text-align:center"><div style="font-size:2rem;margin-bottom:11px">💡</div><div style="font-size:.75rem;opacity:.38;text-transform:uppercase;letter-spacing:.1em;margin-bottom:9px">Hint</div><div style="font-size:.97rem;font-weight:600;line-height:1.55;margin-bottom:18px">' + hint + '</div><div style="display:flex;gap:8px"><button type="button" class="btn bg" style="flex:1" onclick="Hints.show(\'' + gameId + '\');Modal.close()">Next Hint</button><button type="button" class="btn bw" style="flex:1" onclick="Modal.close()">Got It</button></div></div>');
    Snd.click();
  }
};

// ── TUTORIAL SYSTEM ───────────────────────────────────────────────
var Tutorial = {
  _seen: {},
  _load: function() {
    try { this._seen = JSON.parse(localStorage.getItem('po5_tut') || '{}'); } catch(e) {}
  },
  _save: function() {
    try { localStorage.setItem('po5_tut', JSON.stringify(this._seen)); } catch(e) {}
  },
  hasSeen: function(id) { return !!this._seen[id]; },
  markSeen: function(id) { this._seen[id] = 1; this._save(); },
  show: function(game, cb) {
    if (this.hasSeen(game.id)) { if (cb) cb(); return; }
    var steps = this._getSteps(game);
    if (!steps.length) { if (cb) cb(); return; }
    this._showStep(steps, 0, game.id, cb);
  },
  _showStep: function(steps, i, id, cb) {
    var self = this;
    if (i >= steps.length) { self.markSeen(id); if (cb) cb(); return; }
    var s = steps[i], total = steps.length;
    var isLast = i === total - 1;
    Modal.open(
      '<div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<div style="font-size:.62rem;opacity:.35;text-transform:uppercase;letter-spacing:.1em">How to Play · ' + (i+1) + '/' + total + '</div>' +
        '<div style="display:flex;gap:4px">' + steps.map(function(_,j){return '<div style="width:6px;height:6px;border-radius:50%;background:'+(j<=i?PCBrand.h_fff:'rgba(255,255,255,.2)') +'"></div>';}).join('') + '</div>' +
      '</div>' +
      '<div style="font-size:2.5rem;text-align:center;margin-bottom:12px">' + s.icon + '</div>' +
      '<div style="font-size:1rem;font-weight:800;text-align:center;margin-bottom:8px">' + s.title + '</div>' +
      '<div style="font-size:.86rem;opacity:.6;line-height:1.6;text-align:center;margin-bottom:20px">' + s.body + '</div>' +
      '<div style="display:flex;gap:8px">' +
        (i > 0 ? '<button type="button" class="btn bg" style="flex:0 0 auto;padding:12px 16px" onclick="Modal.close();setTimeout(function(){Tutorial._showStep(steps,' + (i-1) + ',id,cb);},280)">←</button>' : '') +
        '<button type="button" class="btn bw" style="flex:1" onclick="Modal.close();setTimeout(function(){Tutorial._showStep(steps,' + (i+1) + ',id,cb);},280)">' + (isLast ? 'Start Game →' : 'Next →') + '</button>' +
      '</div></div>',
      function() { if (isLast) { self.markSeen(id); if (cb) cb(); } }
    );
    // Make refs available inside onclick strings
    window._tutSteps = steps; window._tutId = id; window._tutCb = cb;
  },
  _getSteps: function(game) {
    var db = {
      shadow: [
        {icon:'🕵️',title:'Hidden Roles',body:'Each player gets a secret role — Resistance or Shadow. You must deduce who is who through discussion and voting.'},
        {icon:'🗳️',title:'Voting Rounds',body:'Each round, all players vote on who to eliminate. Highest votes gets removed. Their role is then revealed.'},
        {icon:'⚠️',title:'Win Conditions',body:'Resistance wins by eliminating all Shadow agents. Shadows win by surviving until the last round or gaining the majority.'},
        {icon:'💡',title:'Pro Tip',body:'Trust is everything. Shadow agents must blend in and cast doubt. Resistance must observe voting patterns carefully.'}
      ],
      chess: [
        {icon:'♟️',title:'Chess: The Basics',body:'Each piece moves differently. The goal is to checkmate the opponent\'s King — trap it with no escape.'},
        {icon:'♛',title:'How Pieces Move',body:'Pawns move forward 1 (or 2 on first move). Knights jump in an L. Bishops move diagonally. Rooks move in lines. Queens move anywhere. King moves 1 square.'},
        {icon:'🏰',title:'Special Moves',body:'Castling: King + Rook swap sides for safety. En passant: capture a pawn that just moved 2 squares. Promotion: pawn reaching the back row becomes a Queen.'},
        {icon:'⚔️',title:'Strategy',body:'Control the center, develop pieces early, protect your King. Never give up pieces for free — always look for captures.'}
      ],
      draughts: [
        {icon:'⚫',title:'Draughts Basics',body:'Move your pieces diagonally forward. Jump over an opponent\'s piece to capture it. Multiple jumps in one turn are allowed and mandatory.'},
        {icon:'👑',title:'Becoming a King',body:'Reach the opponent\'s back row to become a King. Kings move diagonally in ALL four directions.'},
        {icon:'🎯',title:'Winning',body:'Capture all opponent\'s pieces or block them so they cannot move. Forced captures are mandatory — you must jump if you can.'}
      ],
      hot: [
        {icon:'💣',title:'Hot Device',body:'The device is a ticking bomb! Pass it before the hidden timer explodes. You never know how long you have.'},
        {icon:'💥',title:'Losing a Life',body:'If the timer runs out while you\'re holding it, you lose a life (❤️). Lose all 3 and you\'re eliminated.'},
        {icon:'⚠️',title:'Chaos Modifiers',body:'Sometimes you\'ll get a chaos rule — pass with eyes closed, spin first, or use one hand. Everyone must follow the rule!'}
      ],
      reflex: [
        {icon:'⚡',title:'Neon Reflex',body:'A target appears on screen. Tap it as fast as you can. Your reaction time in milliseconds is shown after each tap.'},
        {icon:'🎯',title:'Scoring',body:'Faster taps = more points. Maintain a combo by hitting every target. Miss one and your combo resets.'},
        {icon:'❤️',title:'Lives',body:'Miss a target (let it time out) and lose a life. Lose all 3 and the game ends. Sub-200ms earns special achievements!'}
      ]
    };
    return db[game.id] || [];
  }
};

// ── DIFFICULTY SYSTEM ─────────────────────────────────────────────
var Difficulty = {
  current: 'normal', // easy | normal | hard | chaos
  levels: {
    easy:   {label:'Easy',    icon:'🟢', desc:'More lives, slower timers, extra hints',      mult:0.7,  lives:5,  timeScale:1.4},
    normal: {label:'Normal',  icon:'🟡', desc:'Balanced experience for all players',          mult:1.0,  lives:3,  timeScale:1.0},
    hard:   {label:'Hard',    icon:'🔴', desc:'Fewer lives, faster timers, no hints',         mult:1.5,  lives:2,  timeScale:0.7},
    chaos:  {label:'Chaos',   icon:'🌀', desc:'Maximum chaos — unpredictable everything',     mult:2.0,  lives:1,  timeScale:0.5}
  },
  get: function() { return this.levels[this.current]; },
  lives: function(base) { return Math.max(1, Math.round((base||3) * this.get().lives/3)); },
  timer: function(base) { return Math.round(base * this.get().timeScale); },
  xpMult: function() { return this.get().mult * Mutators.xpMult(); },
  pick: function(cb) {
    var self = this;
    Modal.open(
      '<div><div style="font-size:1.05rem;font-weight:800;margin-bottom:4px">⚙️ Difficulty</div>' +
      '<div style="font-size:.76rem;opacity:.38;margin-bottom:14px">Affects timers, lives and XP rewards</div>' +
      Object.entries(this.levels).map(function(e) {
        var id = e[0], lv = e[1];
        var active = self.current === id;
        return '<div onclick="window._dpick(\'' + id + '\')" style="padding:13px 14px;border-radius:13px;border:2px solid ' + (active?'rgba(255,255,255,.4)':'var(--border)') + ';background:' + (active?'rgba(255,255,255,.07)':'rgba(255,255,255,.03)') + ';margin-bottom:8px;cursor:pointer;display:flex;align-items:center;gap:12px"><div style="font-size:1.5rem">' + lv.icon + '</div><div style="flex:1"><div style="font-weight:700">' + lv.label + '</div><div style="font-size:.72rem;opacity:.42;margin-top:1px">' + lv.desc + '</div></div><div style="font-size:.72rem;color:var(--amber);font-weight:700">×' + lv.mult.toFixed(1) + ' XP</div></div>';
      }).join('') +
      '</div>'
    );
    window._dpick = function(id) {
      self.current = id;
      Modal.close();
      toast('Difficulty: ' + self.levels[id].label);
      Hap.m(); Snd.click();
      if (cb) setTimeout(cb, 280);
    };
  }
};

// ── LOCAL MULTI-DEVICE SYNC (QR + code transfer) ──────────────────
var LocalSync = {
  // Encode game state to a short transfer code (base62)
  _chars: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  encode: function(obj) {
    try {
      var json = JSON.stringify(obj);
      var b64 = btoa(unescape(encodeURIComponent(json)));
      return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    } catch(e) { return null; }
  },
  decode: function(str) {
    try {
      var b64 = str.replace(/-/g,'+').replace(/_/g,'/');
      while (b64.length % 4) b64 += '=';
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch(e) { return null; }
  },
  generateCode: function(game) {
    if (!game) return null;
    var payload = {
      v: 4, id: game.id, title: game.title,
      gs: game.gs, players: game.players,
      diff: Difficulty.current, ts: Date.now()
    };
    return this.encode(payload);
  },
  showSend: function(game) {
    var code = this.generateCode(game);
    if (!code) { toast('Cannot sync this game state'); return; }
    // Split into 4-char groups for readability
    var display = code.slice(0, 32).match(/.{1,4}/g).join('-');
    Modal.open(
      '<div style="text-align:center">' +
      '<div style="font-size:1.05rem;font-weight:800;margin-bottom:3px">📡 Sync to Device</div>' +
      '<div style="font-size:.75rem;opacity:.38;margin-bottom:16px">Other player enters this code on their device</div>' +
      '<div style="background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.2);border-radius:14px;padding:16px;margin-bottom:12px">' +
        '<div style="font-size:1.1rem;font-weight:800;font-family:monospace;letter-spacing:.12em;color:var(--cyan);word-break:break-all">' + display + '</div>' +
      '</div>' +
      '<div style="font-size:.68rem;opacity:.28;margin-bottom:14px">Full code: ' + code.length + ' chars · State snapshot at ' + new Date().toLocaleTimeString() + '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<button type="button" class="btn bg" style="flex:1" onclick="LocalSync._copy(\'' + code + '\')">📋 Copy Code</button>' +
        '<button type="button" class="btn bg" style="flex:1" onclick="Modal.close()">Close</button>' +
      '</div></div>'
    );
  },
  showReceive: function() {
    Modal.open(
      '<div><div style="font-size:1.05rem;font-weight:800;margin-bottom:3px">📡 Receive Game</div>' +
      '<div style="font-size:.75rem;opacity:.38;margin-bottom:12px">Enter the sync code from the host device</div>' +
      '<input id="_syncin" placeholder="Paste or type code..." autocorrect="off" autocapitalize="off" style="width:100%;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);font-size:.88rem;color:'+PCBrand.h_fff+';font-family:monospace;margin-bottom:12px">' +
      '<button type="button" class="btn bw bf" onclick="LocalSync._recv()">▶ Load & Continue</button></div>'
    );
  },
  _copy: function(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(function() { toast('📋 Code copied!'); });
    } else { toast('Select and copy the code manually'); }
  },
  _recv: function() {
    var code = (document.getElementById('_syncin') || {}).value || '';
    code = code.replace(/-/g, '').trim();
    var data = this.decode(code);
    if (!data || !data.id) { toast('❌ Invalid sync code'); return; }
    var game = Reg.get(data.id);
    if (!game) { toast('Game not found on this device'); return; }
    game.players = data.players;
    game.gs = data.gs;
    if (data.diff) Difficulty.current = data.diff;
    Modal.close();
    setTimeout(function() {
      S.game = game;
      Nav.go('game');
      document.getElementById('gtitle').textContent = game.title;
      document.getElementById('gbody').style.setProperty('--acc', game.col);
      game.render();
      toast('✅ Synced! Continuing ' + game.title);
    }, 280);
  }
};

// ── GAME SETTINGS PANEL (in-game) ─────────────────────────────────
GL.showGameSettings = function() {
  var game = S.game;
  if (!game) return;
  Modal.open(
    '<div><div style="font-size:1.05rem;font-weight:800;margin-bottom:14px">⚙️ ' + (game.title || 'Game') + '</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px">' +
    '<button type="button" class="btn bg bf" onclick="Modal.close();setTimeout(function(){Hints.show(\'' + game.id + '\');},280)">💡 Show Hint</button>' +
    '<button type="button" class="btn bg bf" onclick="Modal.close();setTimeout(function(){Tutorial.show(S.game,function(){});},280)">📖 How to Play</button>' +
    '<button type="button" class="btn bg bf" onclick="Modal.close();setTimeout(function(){LocalSync.showSend(S.game);},280)">📡 Sync to Device</button>' +
    '<button type="button" class="btn bg bf" onclick="Modal.close();setTimeout(function(){LocalSync.showReceive();},280)">📡 Receive Sync</button>' +
    '<button type="button" class="btn bg bf" onclick="if(S.game){Suspend.save(S.game,S.game.gs,{});toast(\'Game saved!\');}Modal.close()">💾 Save & Suspend</button>' +
    '<div style="height:1px;background:rgba(255,255,255,.08);margin:4px 0"></div>' +
    '<div class="srow" style="padding:0;border:none"><span style="font-size:.84rem;font-weight:600">Sound</span><div class="tog ' + (S.cfg.sfx?'on':'') + '" onclick="GL.togSet(\'sfx\',this)"></div></div>' +
    '<div class="srow" style="padding:0;border:none"><span style="font-size:.84rem;font-weight:600">Haptics</span><div class="tog ' + (S.cfg.haptic?'on':'') + '" onclick="GL.togSet(\'haptic\',this)"></div></div>' +
    '<div style="height:1px;background:rgba(255,255,255,.08);margin:4px 0"></div>' +
    '<button type="button" class="btn br bf" onclick="Modal.close();GL.exitGame()">← Exit Game</button>' +
    '</div></div>'
  );
};

// ── SHOW HINT (public) ────────────────────────────────────────────
GL.showHint = function() {
  if (S.game) Hints.show(S.game.id);
};

// ── ENHANCE GAME LAUNCHER to include Tutorial + Difficulty ─────────
var _origSetupV4 = GL._setup.bind(GL);
GL._setup = function(game) {
  var self = this;
  var avs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀','🎭','🔥'];
  var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a,PCBrand.h_64d2ff,PCBrand.h_ff375f];
  var pc = Math.max(game.min, 2);
  var players = Array.from({length:pc}, function(_,i){ return {id:'p'+(i+1),name:'Player '+(i+1),av:avs[i%avs.length],col:cols[i%cols.length],local:i===0}; });

  var render = function() {
    Modal.open(
      '<div>' +
      '<div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">' +
        '<div style="font-size:2rem">' + game.icon + '</div>' +
        '<div><div style="font-size:1rem;font-weight:800">' + game.title + '</div><div style="font-size:.73rem;opacity:.38">' + game.desc + '</div></div>' +
      '</div>' +
      // Difficulty strip
      '<div onclick="Difficulty.pick(function(){Modal.close();setTimeout(render,280);})" style="padding:10px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;margin-bottom:12px;display:flex;align-items:center;gap:9px;cursor:pointer">' +
        '<span style="font-size:1.2rem">' + Difficulty.get().icon + '</span>' +
        '<div style="flex:1"><div style="font-size:.8rem;font-weight:700">' + Difficulty.get().label + '</div><div style="font-size:.65rem;opacity:.38">' + Difficulty.get().desc + '</div></div>' +
        '<div style="font-size:.68rem;opacity:.4">Change ›</div>' +
      '</div>' +
      '<div style="font-size:.6rem;opacity:.32;letter-spacing:.09em;text-transform:uppercase;margin-bottom:7px">Players (' + pc + '/' + game.max + ')</div>' +
      '<div id="_pl">' + players.map(function(p,i){
        return '<div class="pchip"><div style="width:30px;height:30px;border-radius:50%;background:'+p.col+'1c;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">'+p.av+'</div><input class="pinp" placeholder="Player '+(i+1)+'" value="'+p.name+'" onchange="window._pn('+i+',this.value)" oninput="window._pn('+i+',this.value)">'+(i>0?'<div onclick="window._rp('+i+')" style="opacity:.22;cursor:pointer;padding:4px">✕</div>':'')+'</div>';
      }).join('') + '</div>' +
      (pc < game.max ? '<button type="button" class="btn bg bf" style="margin-bottom:9px;margin-top:5px" onclick="window._ap()">+ Add Player</button>' : '') +
      (Mutators.active.length ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px">' + Mutators.active.map(function(m){return '<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:2px 8px;font-size:.62rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('') + '</div>' : '') +
      '<div style="display:flex;gap:7px">' +
        '<button type="button" class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="window._smut()">⚙️</button>' +
        '<button type="button" class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="Modal.close();setTimeout(function(){Tutorial.show(game,function(){Modal.open(\'\');render();});},280)">📖</button>' +
        '<button type="button" class="btn bw" style="flex:1" onclick="window._sg()">▶ Start</button>' +
      '</div></div>'
    );
    window._pn = function(i,v){ players[i].name=v||'Player '+(i+1); };
    window._ap = function(){ if(pc>=game.max)return;pc++;players.push({id:'p'+pc,name:'Player '+pc,av:avs[(pc-1)%avs.length],col:cols[(pc-1)%cols.length]});render(); };
    window._rp = function(i){ if(pc<=game.min){toast('Min '+game.min+' players');return;}players.splice(i,1);pc--;players.forEach(function(p,j){p.id='p'+(j+1);});render(); };
    window._sg = function(){ Modal.close(); setTimeout(function(){ Tutorial.show(game, function(){ Cinematic.show(game, players, function(){ self._start(game, players); }); }); }, 270); };
    window._smut = function(){ Modal.close(); setTimeout(function(){ Mutators.showPicker(function(){ render(); }); }, 270); };
  };
  render();
};

// Also enhance solo launch with tutorial + difficulty
var _origLaunchV4 = GL.launch.bind(GL);
GL.launch = function(id) {
  var game = Reg.get(id);
  if (!game) { toast('Game not found'); return; }
  Snd.click(); Hap.m();
  if (game.mp) {
    this._setup(game);
  } else {
    // Solo: show difficulty picker first if not played before
    var self = this;
    var players = [{id:'p1',name:S.prof.name||'Player',av:S.prof.av||'🎮',col:PCBrand.h_64d2ff,local:true}];
    // Show solo options
    Modal.open(
      '<div>' +
      '<div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">' +
        '<div style="font-size:2rem">' + game.icon + '</div>' +
        '<div><div style="font-size:1rem;font-weight:800">' + game.title + '</div><div style="font-size:.73rem;opacity:.38">' + game.desc + '</div></div>' +
      '</div>' +
      '<div onclick="Difficulty.pick(function(){Modal.close();GL.launch(\''+id+'\');})" style="padding:10px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;margin-bottom:12px;display:flex;align-items:center;gap:9px;cursor:pointer">' +
        '<span style="font-size:1.2rem">' + Difficulty.get().icon + '</span>' +
        '<div style="flex:1"><div style="font-size:.8rem;font-weight:700">' + Difficulty.get().label + '</div><div style="font-size:.65rem;opacity:.38">' + Difficulty.get().desc + '</div></div>' +
        '<div style="font-size:.68rem;opacity:.4">Change ›</div>' +
      '</div>' +
      '<div style="display:flex;gap:7px">' +
        '<button type="button" class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="Modal.close();setTimeout(function(){Tutorial.show(game,function(){GL.launch(\''+id+'\');});},280)">📖 How to Play</button>' +
        '<button type="button" class="btn bw" style="flex:1" onclick="window._ssg()">▶ Play</button>' +
      '</div></div>'
    );
    window._ssg = function() {
      Modal.close();
      setTimeout(function() {
        Tutorial.show(game, function() {
          Cinematic.show(game, players, function() {
            self._start(game, players);
          });
        });
      }, 270);
    };
    // Enable hint button for this game
    var hb = document.getElementById('ghint-btn');
    if (hb) hb.style.display = 'flex';
  }
};

// ── ENABLE HINT BUTTON WHEN IN-GAME ──────────────────────────────
var _origStartV4 = GL._start.bind(GL);
GL._start = function(game, players) {
  requestWakeLock();
  Bus.emit('game:start', {game:game});
  _origStartV4(game, players);
  // Show hint button if hints exist for this game
  var hb = document.getElementById('ghint-btn');
  if (hb) {
    var hasHints = Hints._db[game.id] && Hints._db[game.id].length > 0;
    hb.style.display = hasHints ? 'flex' : 'none';
  }
  // Auto checkpoint after 4s
  // Auto-suspend disabled - user controls save
};



// ═══════════════════════════════════════════════════════════════════
// BOARD GAMES — Chess, Draughts, Tic-Tac-Toe (pass-and-play)
// ═══════════════════════════════════════════════════════════════════

// ── CHESS ─────────────────────────────────────────────────────────
var ChessGame = new Game({id:'chess',title:'Chess',icon:'♟️',type:'strategy',cat:'multiplayer',col:PCBrand.h_64d2ff,mp:true,min:2,max:2,desc:'Classic chess. Pass-and-play on one device.'});
ChessGame.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,2));
  this.gs = {
    board: this._initBoard(),
    turn: 0, // 0=white, 1=black
    sel: null,
    moves: [],
    history: [],
    check: false,
    mate: false,
    captured: {w:[], b:[]},
    players: pl.slice(0,2)
  };
};
ChessGame._pieces = {
  wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',
  bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'
};
ChessGame._initBoard = function() {
  var b = Array(8).fill(null).map(function(){ return Array(8).fill(null); });
  var order = ['R','N','B','Q','K','B','N','R'];
  for (var i=0;i<8;i++) {
    b[0][i] = 'b'+order[i]; b[1][i] = 'bP';
    b[6][i] = 'wP'; b[7][i] = 'w'+order[i];
  }
  return b;
};
ChessGame._color = function(piece) { return piece ? piece[0] : null; };
ChessGame._type  = function(piece) { return piece ? piece[1] : null; };
ChessGame._validMoves = function(board, r, c) {
  var piece = board[r][c]; if (!piece) return [];
  var col = piece[0], type = piece[1], moves = [];
  var self = this;
  var add = function(nr, nc) {
    if (nr<0||nr>7||nc<0||nc>7) return false;
    if (self._color(board[nr][nc])===col) return false;
    moves.push([nr,nc]);
    return !board[nr][nc]; // can continue sliding if empty
  };
  var slide = function(dr, dc) {
    for (var i=1;i<8;i++) { if (!add(r+dr*i, c+dc*i)) break; }
  };
  if (type==='P') {
    var dir = col==='w'?-1:1, start = col==='w'?6:1;
    if (!board[r+dir]||!board[r+dir][c]) {
      add(r+dir, c);
      if (r===start && (!board[r+dir*2]||!board[r+dir*2][c])) add(r+dir*2, c);
    }
    [[r+dir,c-1],[r+dir,c+1]].forEach(function(p){ if (self._color(board[p[0]]&&board[p[0]][p[1]])!==col && board[p[0]]&&board[p[0]][p[1]]) add(p[0],p[1]); });
  }
  if (type==='N') { [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(function(d){add(r+d[0],c+d[1]);}); }
  if (type==='B'||type==='Q') { [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(function(d){slide(d[0],d[1]);}); }
  if (type==='R'||type==='Q') { [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d){slide(d[0],d[1]);}); }
  if (type==='K') { [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(function(d){add(r+d[0],c+d[1]);}); }
  return moves;
};
ChessGame.render = function() {
  var gs = this.gs, self = this;
  var curCol = gs.turn===0?'w':'b';
  var curPlayer = gs.players[gs.turn];
  var cellSz = Math.min(44, Math.floor((Math.min(window.innerWidth, 480)-32)/8));
  var bSz = cellSz * 8;

  var boardHTML = '<div style="display:inline-grid;grid-template-columns:repeat(8,'+cellSz+'px);border:2px solid rgba(255,255,255,.15);border-radius:8px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.6)">';
  for (var r=0;r<8;r++) {
    for (var c=0;c<8;c++) {
      var piece = gs.board[r][c];
      var isLight = (r+c)%2===0;
      var isSel = gs.sel && gs.sel[0]===r && gs.sel[1]===c;
      var isMove = gs.moves.some(function(m){return m[0]===r&&m[1]===c;});
      var isCapture = isMove && !!piece;
      var bg = isSel ? PCBrand.h_4a7c59 : isMove ? (isLight?'rgba(100,210,255,.5)':'rgba(100,210,255,.35)') : isLight ? PCBrand.h_f0d9b5 : PCBrand.h_b58863;
      var pieceSymbol = piece ? this._pieces[piece] || '' : '';
      var pieceCol = piece && piece[0]==='w' ? PCBrand.h_fff : PCBrand.h_111;
      boardHTML += '<div onclick="window._cc('+r+','+c+')" style="width:'+cellSz+'px;height:'+cellSz+'px;background:'+bg+';display:flex;align-items:center;justify-content:center;font-size:'+(cellSz*.58)+'px;cursor:pointer;position:relative;user-select:none;-webkit-user-select:none">';
      if (isCapture) boardHTML += '<div style="position:absolute;inset:3px;border-radius:50%;background:rgba(255,45,85,.4);border:2px solid rgba(255,45,85,.7)"></div>';
      if (isMove && !piece) boardHTML += '<div style="width:'+(cellSz*.32)+'px;height:'+(cellSz*.32)+'px;border-radius:50%;background:rgba(100,210,255,.55)"></div>';
      if (piece) boardHTML += '<span style="color:'+pieceCol+';text-shadow:'+( piece[0]==='w'?'0 1px 2px rgba(0,0,0,.6)':'0 1px 2px rgba(255,255,255,.2)')+';position:relative;z-index:1">'+pieceSymbol+'</span>';
      boardHTML += '</div>';
    }
  }
  boardHTML += '</div>';

  document.getElementById('gbody').innerHTML =
    '<div style="padding:4px 0">' +
    // Status bar
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:8px 11px;background:rgba(255,255,255,.05);border-radius:11px">' +
      '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:1.1rem">' + curPlayer.av + '</span><div><div style="font-weight:700;font-size:.86rem">' + curPlayer.name + '</div><div style="font-size:.65rem;opacity:.38">' + (curCol==='w'?'White':'Black') + ' to move</div></div></div>' +
      '<div style="font-size:.75rem;color:'+(gs.check?'var(--red)':'var(--dim)')+'font-weight:700">' + (gs.check?'⚠️ CHECK':'') + '</div>' +
      '<div style="font-size:.72rem;opacity:.38">Move ' + (gs.history.length+1) + '</div>' +
    '</div>' +
    // Captured pieces
    '<div style="font-size:.88rem;margin-bottom:8px;min-height:20px">' + gs.captured.b.join('') + '</div>' +
    // Board
    '<div style="display:flex;justify-content:center;margin-bottom:8px">' + boardHTML + '</div>' +
    '<div style="font-size:.88rem;margin-bottom:10px;min-height:20px">' + gs.captured.w.join('') + '</div>' +
    // Coordinates hint
    '<div style="display:flex;justify-content:center;gap:0;margin-top:-4px;opacity:.3;font-size:.55rem;font-family:monospace">' +
      ['a','b','c','d','e','f','g','h'].map(function(l){return '<div style="width:'+cellSz+'px;text-align:center">'+l+'</div>';}).join('') +
    '</div>' +
    // Pass prompt when no selection
    (!gs.sel ? '<div style="text-align:center;margin-top:8px;font-size:.78rem;opacity:.4">Tap a ' + (curCol==='w'?'white':'black') + ' piece to select</div>' : '') +
    '</div>';

  window._cc = function(r, c) {
    var piece = gs.board[r][c];
    // If a piece is selected and this is a valid move
    if (gs.sel) {
      var validMove = gs.moves.some(function(m){return m[0]===r&&m[1]===c;});
      if (validMove) {
        // Execute move
        var from = gs.sel;
        var captured = gs.board[r][c];
        if (captured) {
          if (captured[0]==='w') gs.captured.w.push(self._pieces[captured]);
          else gs.captured.b.push(self._pieces[captured]);
        }
        gs.board[r][c] = gs.board[from[0]][from[1]];
        gs.board[from[0]][from[1]] = null;
        // Pawn promotion
        if (gs.board[r][c]==='wP' && r===0) gs.board[r][c]='wQ';
        if (gs.board[r][c]==='bP' && r===7) gs.board[r][c]='bQ';
        gs.history.push({from:from,to:[r,c],piece:gs.board[r][c],cap:captured});
        gs.sel = null; gs.moves = [];
        gs.turn = 1 - gs.turn;
        Snd.click(); Hap.l();
        // Check for game end (simplified - king capture)
        var nextCol = gs.turn===0?'w':'b';
        var kings = []; for(var rr=0;rr<8;rr++) for(var cc2=0;cc2<8;cc2++) if(gs.board[rr][cc2]===nextCol+'K') kings.push(1);
        if (!kings.length) {
          self.done(curPlayer.name);
          self.showWin(curPlayer.name, [{n:curPlayer.name,s:'Checkmate!'},{n:gs.players[gs.turn].name,s:'Defeated'}]);
          return;
        }
        // Pass to next player
        Nav.go('game'); self.render();
        return;
      }
      // Deselect
      gs.sel = null; gs.moves = [];
    }
    // Select piece if it's the current player's color
    if (piece && piece[0]===curCol) {
      gs.sel = [r, c];
      gs.moves = self._validMoves(gs.board, r, c);
      Snd.click(); Hap.l();
    } else {
      gs.sel = null; gs.moves = [];
    }
    Nav.go('game'); self.render();
  };
};

// ── DRAUGHTS / CHECKERS ───────────────────────────────────────────
var Draughts = new Game({id:'draughts',title:'Draughts',icon:'⚫',type:'strategy',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:2,desc:'Classic checkers. Jump, capture, crown your pieces.'});
Draughts.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,2));
  var b = Array(8).fill(null).map(function(){return Array(8).fill(null);});
  for (var r=0;r<8;r++) for (var c=0;c<8;c++) {
    if ((r+c)%2!==0) {
      if (r<3) b[r][c]={col:'b',king:false};
      if (r>4) b[r][c]={col:'w',king:false};
    }
  }
  this.gs = {board:b,turn:0,sel:null,moves:[],jumps:[],history:[],captured:{w:0,b:0},players:pl.slice(0,2)};
};
Draughts._getMoves = function(board, r, c) {
  var p = board[r][c]; if (!p) return {moves:[],jumps:[]};
  var dirs = p.col==='w'?[[-1,-1],[-1,1]]:[[ 1,-1],[ 1,1]];
  if (p.king) dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  var moves=[], jumps=[];
  dirs.forEach(function(d) {
    var nr=r+d[0],nc=c+d[1];
    if (nr<0||nr>7||nc<0||nc>7) return;
    if (!board[nr][nc]) moves.push([nr,nc]);
    else if (board[nr][nc].col!==p.col) {
      var jr=r+d[0]*2,jc=c+d[1]*2;
      if (jr>=0&&jr<=7&&jc>=0&&jc<=7&&!board[jr][jc]) jumps.push([jr,jc,nr,nc]);
    }
  });
  return {moves:jumps.length?[]:moves, jumps:jumps};
};
Draughts.render = function() {
  var gs = this.gs, self = this;
  var curCol = gs.turn===0?'w':'b';
  var curPlayer = gs.players[gs.turn];
  var cellSz = Math.min(44, Math.floor((Math.min(window.innerWidth,480)-32)/8));

  var boardHTML = '<div style="display:inline-grid;grid-template-columns:repeat(8,'+cellSz+'px);border:2px solid rgba(255,255,255,.15);border-radius:8px;overflow:hidden">';
  for (var r=0;r<8;r++) {
    for (var c=0;c<8;c++) {
      var p = gs.board[r][c];
      var isLight = (r+c)%2===0;
      var isSel = gs.sel && gs.sel[0]===r && gs.sel[1]===c;
      var isMove = gs.moves.some(function(m){return m[0]===r&&m[1]===c;});
      var isJump = gs.jumps.some(function(j){return j[0]===r&&j[1]===c;});
      var bg = isSel?PCBrand.h_4a7c59:isLight?PCBrand.h_f0d9b5:PCBrand.h_b58863;
      boardHTML += '<div onclick="window._dc('+r+','+c+')" style="width:'+cellSz+'px;height:'+cellSz+'px;background:'+bg+';display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative">';
      if ((isMove||isJump) && !p) boardHTML += '<div style="width:'+(cellSz*.4)+'px;height:'+(cellSz*.4)+'px;border-radius:50%;background:'+(isJump?'rgba(255,107,0,.7)':'rgba(100,210,255,.5)')+'"></div>';
      if (p) {
        var pc = p.col==='w'?PCBrand.h_e8d5b0:PCBrand.h_333;
        var border = p.col==='w'?'rgba(0,0,0,.3)':'rgba(255,255,255,.3)';
        boardHTML += '<div style="width:'+(cellSz*.72)+'px;height:'+(cellSz*.72)+'px;border-radius:50%;background:'+pc+';border:2px solid '+border+';display:flex;align-items:center;justify-content:center;font-size:'+(cellSz*.3)+'px;box-shadow:0 2px 6px rgba(0,0,0,.4)">' + (p.king?'♔':'') + '</div>';
      }
      boardHTML += '</div>';
    }
  }
  boardHTML += '</div>';

  document.getElementById('gbody').innerHTML =
    '<div style="padding:4px 0">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:8px 11px;background:rgba(255,255,255,.05);border-radius:11px">' +
      '<div style="display:flex;align-items:center;gap:8px"><span>'+curPlayer.av+'</span><div><div style="font-weight:700;font-size:.86rem">'+curPlayer.name+'</div><div style="font-size:.65rem;opacity:.38">'+(curCol==='w'?'Light':'Dark')+' pieces</div></div></div>' +
      '<div style="font-size:.8rem;opacity:.38">W:'+gs.captured.w+' B:'+gs.captured.b+'</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:center;margin-bottom:10px">'+boardHTML+'</div>' +
    '<div style="text-align:center;font-size:.75rem;opacity:.38">'+(!gs.sel?'Tap your piece to select':'Tap highlighted square to move or jump')+'</div>' +
    '</div>';

  window._dc = function(r,c) {
    var p = gs.board[r][c];
    if (gs.sel) {
      var mv = gs.moves.find(function(m){return m[0]===r&&m[1]===c;});
      var jp = gs.jumps.find(function(j){return j[0]===r&&j[1]===c;});
      if (mv || jp) {
        var from = gs.sel;
        gs.board[r][c] = gs.board[from[0]][from[1]];
        gs.board[from[0]][from[1]] = null;
        if (jp) { gs.board[jp[2]][jp[3]]=null; gs.captured[curCol==='w'?'b':'w']++; }
        // Crown
        if ((curCol==='w'&&r===0)||(curCol==='b'&&r===7)) gs.board[r][c].king=true;
        gs.sel=null;gs.moves=[];gs.jumps=[];
        gs.turn=1-gs.turn;
        Snd.click();Hap.l();
        // Check win
        var opp=gs.turn===0?'w':'b';
        var oppPieces=0;for(var rr=0;rr<8;rr++)for(var cc2=0;cc2<8;cc2++)if(gs.board[rr][cc2]&&gs.board[rr][cc2].col===opp)oppPieces++;
        if(!oppPieces){self.done(curPlayer.name);self.showWin(curPlayer.name,[{n:curPlayer.name,s:'All pieces captured!'},{n:gs.players[gs.turn].name,s:'Defeated'}]);return;}
        Nav.go('game');self.render();return;
      }
      gs.sel=null;gs.moves=[];gs.jumps=[];
    }
    if (p && p.col===curCol) {
      gs.sel=[r,c];
      var m=self._getMoves(gs.board,r,c);
      gs.moves=m.moves;gs.jumps=m.jumps;
      Snd.click();Hap.l();
    } else {gs.sel=null;gs.moves=[];gs.jumps=[];}
    Nav.go('game');self.render();
  };
};

// ── CONNECT FOUR ──────────────────────────────────────────────────
/* PRSM-P0-01 / D-06 — Four in a Row (was Connect Four); neutral discs + original board */
var ConnectFour = new Game({id:'c4',title:'Four in a Row',icon:'⬡',type:'strategy',cat:'multiplayer',col:PCBrand.h_00d4ff,mp:true,min:2,max:2,desc:'Drop discs. First to line up four wins.'});
ConnectFour.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,2));
  this.gs = {board:Array(6).fill(null).map(function(){return Array(7).fill(null);}),turn:0,players:pl.slice(0,2)};
};
ConnectFour._drop = function(board, col, mark) {
  for (var r=5;r>=0;r--) { if (!board[r][col]) { board[r][col]=mark; return r; } }
  return -1;
};
ConnectFour._check = function(board,r,c) {
  var mark=board[r][c]; if(!mark) return false;
  var dirs=[[0,1],[1,0],[1,1],[1,-1]];
  return dirs.some(function(d){
    var count=1;
    for(var i=1;i<4;i++){var nr=r+d[0]*i,nc=c+d[1]*i;if(nr<0||nr>5||nc<0||nc>6||board[nr][nc]!==mark)break;count++;}
    for(var i=1;i<4;i++){var nr=r-d[0]*i,nc=c-d[1]*i;if(nr<0||nr>5||nc<0||nc>6||board[nr][nc]!==mark)break;count++;}
    return count>=4;
  });
};
ConnectFour.render = function() {
  var gs = this.gs, self = this;
  var marks=['A','B'], colors={A:PCBrand.h_5ac8fa,B:PCBrand.h_bf5af2}, curMark=marks[gs.turn], curPlayer=gs.players[gs.turn];
  var cellSz = Math.min(42, Math.floor((Math.min(window.innerWidth,480)-32)/7));
  GameShell.announceTurn(curPlayer.name);

  var colBtns = Array(7).fill(0).map(function(_,c){
    return '<button type="button" onclick="window._c4d('+c+')" aria-label="Drop in column '+(c+1)+'" style="width:'+cellSz+'px;text-align:center;cursor:pointer;font-size:'+(cellSz*.45)+'px;padding-bottom:4px;opacity:.7;background:none;border:none;color:var(--cyan)">▼</button>';
  }).join('');

  var boardHTML = '<div style="background:linear-gradient(160deg,'+PCBrand.h_1a2438+','+PCBrand.h_0d1524+');border:2px solid rgba(90,200,250,.35);border-radius:14px;padding:8px;display:inline-block;box-shadow:0 8px 28px rgba(0,0,0,.45)">';
  for (var r=0;r<6;r++) {
    boardHTML += '<div style="display:flex;gap:4px;margin-bottom:4px">';
    for (var c=0;c<7;c++) {
      var cell = gs.board[r][c];
      var bg = cell ? colors[cell] : 'rgba(255,255,255,.06)';
      boardHTML += '<div style="width:'+cellSz+'px;height:'+cellSz+'px;border-radius:50%;background:'+bg+';border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 2px 4px rgba(0,0,0,.35)"></div>';
    }
    boardHTML += '</div>';
  }
  boardHTML += '</div>';

  document.getElementById('gbody').innerHTML =
    '<div style="padding:4px 0">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:8px 11px;background:rgba(255,255,255,.05);border-radius:11px">' +
      '<div style="font-size:1.1rem">'+curPlayer.av+'</div>' +
      '<div style="font-weight:700;font-size:.88rem">'+curPlayer.name+' · <span style="color:'+colors[curMark]+'">●</span></div>' +
      '<div style="font-size:.72rem;opacity:.55">'+gs.players.map(function(p,i){return p.name;}).join(' vs ')+'</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:center">' +
      '<div>' +
        '<div style="display:flex;gap:4px;padding:0 6px;margin-bottom:2px">'+colBtns+'</div>' +
        boardHTML +
      '</div>' +
    '</div>' +
    '</div>';

  window._c4d = function(col) {
    var row = self._drop(gs.board, col, curMark);
    if (row < 0) { toast('Column full!'); return; }
    Snd.click(); Hap.l();
    if (self._check(gs.board, row, col)) {
      self.done(curPlayer.name);
      Nav.go('game');
      self.showWin(curPlayer.name, [{n:curPlayer.name,s:'Four in a row!'},{n:gs.players[1-gs.turn].name,s:'Defeated'}]);
      return;
    }
    if (gs.board.every(function(row2){return row2.every(function(c2){return !!c2;});})) {
      self.done(null);
      document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:40px 0"><div style="font-size:1.3rem;font-weight:700;margin:10px 0">Draw!</div><button type="button" class="btn bw" onclick="GL.launch(\'c4\')">Play Again</button></div>';
      return;
    }
    gs.turn = 1-gs.turn;
    Nav.go('game'); self.render();
  };
};



// ═══ V4 BOOT PATCH ════════════════════════════════════════════════
// Single DOMContentLoaded — replaces previous boot
document.addEventListener('DOMContentLoaded', function() {
  Save.load(); Memory.load(); Meta.load();
  Mutators.loadPresets(); Tutorial._load();

  // Modular games (js/games/*.js) register via PRISM_GAME_FACTORIES
  (window.PRISM_GAME_FACTORIES || []).forEach(function(factory) {
    try { var g = factory(); if (g) Reg.add(g); } catch (e) { console.warn('Game factory failed', e); }
  });
  if (typeof window._patchTTTBot === 'function') window._patchTTTBot();
  // Register core multiplayer + solo games (38 total with v5 + board)
  [ShadowProtocol,HotDevice,SplitTruth,SilentVote,ChaosCards,TruthBomb,Dungeon,
   SpyHunt,LastSignal,ChainReaction,BetrayalGrid,NeonReflex,MemoryMatrix,
   SignalDecode,QuickTap,PatternShift,GhostMode,AISurvival,CyberTiles,
   RhythmPulse,InfiniteMaze,ImposterFreq,TrustFall,ReflexLadder,NeonSnake,
   TheHeist,PressureCooker,ChessGame,Draughts,ConnectFour
  ].forEach(function(g){ Reg.add(g); });

  // Demo AFTER Reg is full — games count + Smart Hub need real list
  if (new URLSearchParams(location.search).get('demo') === '1' && window.GL && GL.loadDemoSeed) {
    GL.loadDemoSeed({ silent: true });
  }

  Snd.init(); BG.init(); Theme.apply(S.cfg.theme||'');
  if (typeof PrismPerf !== 'undefined') PrismPerf.apply();

  document.addEventListener('touchstart', function(){Snd.wake();}, {once:true,passive:true});
  document.addEventListener('click', function(){Snd.wake();}, {once:true,passive:true});

  // Keyboard: Escape = back from game
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && S.cur === 'game') { GL.requestLeave(); e.preventDefault(); }
    if (e.key === 'Escape' && S.cur !== 'game') {
      var ov = document.getElementById('ov');
      if (ov && ov.className === 'open') { Modal.close(); e.preventDefault(); }
    }
    // Tab cycling (Alt+Arrow — do not hijack Tab; breaks keyboard focus)
    if (e.altKey && e.key === 'ArrowRight' && S.cur !== 'game') {
      var tabs=['home','library','arcade','dashboard','profile'];
      var ci = tabs.indexOf(S.cur);
      Nav.go(tabs[(ci+1)%tabs.length]);
      e.preventDefault();
    }
    // Arrow keys for maze
    if (S.cur==='game' && S.game && S.game.id==='maze' && window._mv) {
      var dir = {ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'}[e.key];
      if (dir) { window._mv(dir); e.preventDefault(); }
    }
    // Arrow keys for snake
    if (S.cur==='game' && S.game && S.game.id==='snake' && S.game.gs) {
      var gs=S.game.gs;
      if(e.key==='ArrowUp'&&gs.dir.y!==1)gs.ndir={x:0,y:-1};
      else if(e.key==='ArrowDown'&&gs.dir.y!==-1)gs.ndir={x:0,y:1};
      else if(e.key==='ArrowLeft'&&gs.dir.x!==1)gs.ndir={x:-1,y:0};
      else if(e.key==='ArrowRight'&&gs.dir.x!==-1)gs.ndir={x:1,y:0};
    }
  });

  animLogo('lcan');

  // Arcade boot ritual (~2s)
  var scanMsgs=['▶ INSERT COIN','Cartridge detected · PRISM','39 games loaded','CREDIT OK · PLAY'];
  var i=0, scan=document.getElementById('lscan');
  var biv=setInterval(function(){if(scan)scan.textContent=scanMsgs[i]||'';i++;if(i>=scanMsgs.length)clearInterval(biv);},480);

  setTimeout(function() {
    GL._buildFeat(); GL._buildScrolls(); GL._buildLib('all');
    UI.home(); UI.dash(); UI.prof();
    Meta.check(S.prof);

    if (Suspend.has()) {
      setTimeout(function() {
        var snap = Suspend.load();
        if (snap) toast('💾 ' + snap.title + ' suspended — tap Resume on Home', 4000);
      }, 2200);
    }

    Bus.on('drama:tick', function(state) {
      if (state.tension > 72 && Math.random() < 0.11) Announcer.tension();
    });

    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      window._installEvt = e;
    });

    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('portrait').catch(function(){});
    }

    var lc = document.getElementById('lib-count');
    if (lc) lc.textContent = Reg.list.length + ' games · Fully offline';

    DevSel.init();
  }, 1600);

  // ~2s cabinet ritual before revealing shell
  setTimeout(function() {
    var seen = localStorage.getItem('po5s');
    var loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('out');
      setTimeout(function(){loader.style.display='none';}, 600);
    }

    if (!seen) {
      animLogo('wcan'); W.init();
    } else {
      var w = document.getElementById('welcome');
      if (w) { w.classList.add('out'); w.classList.remove('ready'); }
    }
    try { window.__APP_READY__ = true; document.documentElement.dataset.appReady = 'true'; } catch (e) {}
  }, 2000);
});




// ─── V5 NEW GAMES ───
// ═══════════════════════════════════════════════════════════════════
// NEW GAMES v5 — Inspired by big studio game design
// Rockstar (open world feel), EA (sports/simulation depth),
// Sega (arcade energy), Nintendo (pick-up-play polish)
// ═══════════════════════════════════════════════════════════════════

// ── WORD DODGE (D-06 · was Taboo-like Word Assassin) ───────
var WordAssassin = new Game({id:'word',title:'Word Dodge',icon:'🔤',type:'party',cat:'multiplayer',col:PCBrand.h_30d158,mp:true,min:2,max:10,desc:'Describe the word without using blocked words. One slip ends your turn.'});
WordAssassin.setup = function(pl) {
  Game.prototype.setup.call(this, pl);
  Drama.reset(pl);
  var wordSets = [
    {word:'BEACH',forbidden:['sand','ocean','swim','wave','sun']},
    {word:'PIZZA',forbidden:['cheese','tomato','dough','italy','slice']},
    {word:'HOSPITAL',forbidden:['doctor','nurse','sick','medicine','bed']},
    {word:'MOUNTAIN',forbidden:['climb','snow','peak','hill','hiking']},
    {word:'BIRTHDAY',forbidden:['cake','candle','party','gift','age']},
    {word:'COFFEE',forbidden:['caffeine','hot','cup','morning','beans']},
    {word:'AIRPORT',forbidden:['plane','fly','travel','gate','passport']},
    {word:'LIBRARY',forbidden:['book','read','quiet','study','shelf']},
    {word:'CONCERT',forbidden:['music','stage','band','crowd','ticket']},
    {word:'WEDDING',forbidden:['ring','love','bride','groom','ceremony']},
    {word:'FOOTBALL',forbidden:['kick','goal','team','pitch','score']},
    {word:'PRISON',forbidden:['jail','crime','bars','guard','lock']},
    {word:'VOLCANO',forbidden:['lava','erupt','fire','magma','hot']},
    {word:'SPACESHIP',forbidden:['rocket','space','astronaut','star','launch']},
    {word:'SUBMARINE',forbidden:['ocean','water','deep','sea','dive']}
  ];
  this.gs = {
    round:1,maxR:pl.length*2,
    sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),
    giver:0,guesserIdx:0,
    words:this.shuf(wordSets),wordIdx:0,
    phase:'give',timeLeft:Difficulty.timer(45),
    forbidden:[],currentWord:'',guessed:0,failed:0
  };
};
WordAssassin.render = function() {
  var gs = this.gs, self = this;
  if (gs.round > gs.maxR) {
    var sc = this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});
    this.done(sc[0].n); this.showWin(sc[0].n, sc); return;
  }
  var giver = this.players[gs.giver % this.players.length];
  var currentWord = gs.words[gs.wordIdx % gs.words.length];
  if (gs.phase === 'reveal') {
    // Show giver their word via pass-and-play
    PP.show(giver.name, giver.av, 'Pass to ' + giver.name,
      '<div style="text-align:center">' +
      '<div style="font-size:2.4rem;font-weight:900;letter-spacing:-.02em;color:var(--green);margin-bottom:16px">' + currentWord.word + '</div>' +
      '<div style="font-size:.72rem;opacity:.55;margin-bottom:9px">Blocked words — do not say these:</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:7px;justify-content:center">' +
        currentWord.forbidden.map(function(w){return '<div style="background:rgba(255,45,85,.15);border:1px solid rgba(255,45,85,.3);border-radius:10px;padding:5px 13px;font-size:.82rem;font-weight:700;color:var(--red)">'+w+'</div>';}).join('') +
      '</div>' +
      '<div style="margin-top:16px;font-size:.75rem;opacity:.55">Describe it with any other words. Team guesses.</div>' +
      '</div>',
      function() {
        gs.phase = 'play';
        gs.timeLeft = Difficulty.timer(45);
        Nav.go('game'); self.render(); self._startTimer();
      }
    );
    return;
  }
  if (gs.phase === 'play') {
    var pct = (gs.timeLeft / Difficulty.timer(45)) * 100;
    document.getElementById('gbody').innerHTML =
      '<div style="padding:5px 0">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:var(--green)">' + gs.guessed + '</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Guessed</div></div>' +
        '<div style="text-align:center"><div id="_wt" style="font-size:2rem;font-weight:800;color:' + (gs.timeLeft<=10?'var(--red)':'var(--amber)') + '">' + gs.timeLeft + '</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Seconds</div></div>' +
        '<div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:var(--red)">' + gs.failed + '</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Skipped</div></div>' +
      '</div>' +
      '<div style="margin-bottom:16px">' +
        '<div style="font-size:.72rem;opacity:.55;margin-bottom:4px;text-align:center">Clue giver: ' + giver.av + ' ' + giver.name + '</div>' +
        '<div style="font-size:.72rem;opacity:.55;margin-bottom:5px;text-align:center">Blocked words:</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">' +
          currentWord.forbidden.map(function(w){return '<div style="background:rgba(255,45,85,.13);border:1px solid rgba(255,45,85,.25);border-radius:10px;padding:4px 11px;font-size:.78rem;font-weight:700;color:var(--red)">'+w+'</div>';}).join('') +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:9px"><button type="button" class="btn br" style="flex:1;font-size:.85rem" onclick="window._wskip()">Skip / Said blocked</button><button type="button" class="btn bw" style="flex:1;font-size:.85rem" onclick="window._wgot()">Guessed!</button></div>' +
      '<div style="margin-top:9px;text-align:center;font-size:.72rem;opacity:.35">Round ' + gs.round + '/' + gs.maxR + '</div>' +
      '</div>';

    window._wgot = function() {
      gs.guessed++; gs.sc[giver.id] = (gs.sc[giver.id]||0) + 10;
      gs.wordIdx++; Snd.ok(); Hap.ok(); toast('✅ +10');
      Drama.tick('win'); self._nextWord();
    };
    window._wskip = function() {
      gs.failed++; gs.wordIdx++; Snd.err(); Hap.err();
      Drama.tick('betray'); self._nextWord();
    };
    return;
  }
};
WordAssassin._nextWord = function() {
  var gs = this.gs, self = this;
  clearInterval(this._wt);
  // Next round after showing result briefly
  gs.round++; gs.giver++; gs.guessed = 0; gs.failed = 0; gs.phase = 'reveal';
  if (gs.round > gs.maxR) { Nav.go('game'); this.render(); return; }
  toast('Round ' + gs.round + ' — pass to ' + this.players[gs.giver % this.players.length].name);
  setTimeout(function() { Nav.go('game'); self.render(); }, 400);
};
WordAssassin._startTimer = function() {
  var gs = this.gs, self = this;
  clearInterval(this._wt);
  this._wt = setInterval(function() {
    gs.timeLeft--;
    var el = document.getElementById('_wt');
    if (el) { el.textContent = gs.timeLeft; el.style.color = gs.timeLeft<=10?'var(--red)':'var(--amber)'; }
    if (gs.timeLeft <= 5) { Snd.tick(gs.timeLeft); Hap.m(); }
    if (gs.timeLeft <= 0) { clearInterval(self._wt); toast('⏱️ Time up!'); self._nextWord(); }
  }, 1000);
};

// ── CLUE GRID (D-06 · was Codenames-like; 4×5, Clue giver / Guessers) ───
var DeadDrop = new Game({id:'deadrop',title:'Clue Grid',icon:'▦',type:'party',cat:'multiplayer',col:PCBrand.h_bf5af2,mp:true,min:3,max:8,desc:'4×5 word grid. Clue giver hints; guessers tap words. Avoid the trap.'});
DeadDrop._WORDS = ['ORBIT','MIRROR','LANTERN','RIVER','COPPER','SILK','ANCHOR','PULSE','MEADOW','CIPHER','QUARTZ','EMBER','GLIDER','BREEZE','NEEDLE','CASCADE','HORIZON','PETAL','VOLTAGE','MARBLE','DRIFT','SIGNAL','CRYSTAL','FATHOM','SPARROW','COMPASS','RIPPLE','FORGE','TWILIGHT','CANYON','PRISM','ECHO'];
DeadDrop.setup = function(pl) {
  Game.prototype.setup.call(this, pl);
  Drama.reset(pl); Director.init(pl.length);
  var words = this.shuf(DeadDrop._WORDS.slice()).slice(0, 20);
  var roles = [];
  for (var i = 0; i < 7; i++) roles.push('team');
  for (var j = 0; j < 10; j++) roles.push('neutral');
  roles.push('trap');
  roles.push('trap');
  roles = this.shuf(roles);
  var cells = words.map(function(w, idx) {
    return { word: w, role: roles[idx], revealed: false };
  });
  var giverIdx = Math.floor(Math.random() * pl.length);
  this.gs = {
    phase: 'brief',
    cells: cells,
    giverId: pl[giverIdx].id,
    ridx: 0,
    remaining: 7,
    trapsHit: 0,
    sc: pl.reduce(function(o, p) { o[p.id] = 0; return o; }, {}),
    clueText: '',
    clueN: 1
  };
};
DeadDrop.render = function() {
  var gs = this.gs;
  if (gs.phase === 'brief') this._brief();
  else if (gs.phase === 'clue') this._clue();
  else if (gs.phase === 'guess') this._guess();
  else this._result();
};
DeadDrop._gridHtml = function(revealRoles) {
  var gs = this.gs;
  return '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0">' +
    gs.cells.map(function(c, i) {
      var bg = 'rgba(255,255,255,.06)';
      var border = 'rgba(255,255,255,.14)';
      var color = PCBrand.h_fff;
      if (c.revealed || revealRoles) {
        if (c.role === 'team') { bg = 'rgba(48,209,88,.22)'; border = 'rgba(48,209,88,.45)'; color = 'var(--green)'; }
        else if (c.role === 'trap') { bg = 'rgba(255,45,85,.2)'; border = 'rgba(255,45,85,.45)'; color = 'var(--red)'; }
        else { bg = 'rgba(255,255,255,.08)'; border = 'rgba(255,255,255,.2)'; color = 'rgba(255,255,255,.55)'; }
      }
      var click = (!revealRoles && !c.revealed && gs.phase === 'guess')
        ? 'onclick="window._cgPick(' + i + ')"'
        : '';
      return '<button type="button" ' + click + ' style="min-height:44px;padding:8px 4px;border-radius:10px;border:1px solid ' + border + ';background:' + bg + ';color:' + color + ';font-size:.72rem;font-weight:700;cursor:' + (click ? 'pointer' : 'default') + '">' + c.word + '</button>';
    }).join('') +
    '</div>';
};
DeadDrop._brief = function() {
  var gs = this.gs, self = this;
  var p = this.players[gs.ridx];
  if (!p) { gs.phase = 'clue'; Nav.go('game'); this._clue(); return; }
  var isGiver = p.id === gs.giverId;
  Hap.roleReveal(isGiver);
  PP.show(p.name, p.av, 'Pass to ' + p.name,
    '<div style="text-align:center">' +
    '<div style="font-size:1.15rem;font-weight:800;color:' + (isGiver ? 'var(--violet)' : 'var(--cyan)') + ';margin-bottom:10px">' +
      (isGiver ? 'You are the Clue giver' : 'You are a Guesser') +
    '</div>' +
    (isGiver
      ? '<div style="font-size:.75rem;opacity:.55;margin-bottom:8px">Green = your team · Red = trap · Gray = neutral</div>' + self._gridHtml(true) +
        '<div style="font-size:.72rem;opacity:.55;margin-top:6px">Give one-word clues. Guessers tap words.</div>'
      : '<div style="font-size:.78rem;opacity:.55;line-height:1.45">Listen to the Clue giver. Tap words you think match. Avoid the traps.</div>') +
    '</div>',
    function() { gs.ridx++; Nav.go('game'); self.render(); }
  );
};
DeadDrop._clue = function() {
  var gs = this.gs, self = this;
  var giver = this.players.find(function(p) { return p.id === gs.giverId; });
  GameShell.announceTurn(giver.name);
  document.getElementById('gbody').innerHTML =
    '<div style="padding:6px 0;text-align:center">' +
    '<div style="opacity:.55;font-size:.75rem;margin-bottom:8px">Clue giver: ' + giver.av + ' ' + giver.name + '</div>' +
    '<div style="font-weight:700;margin-bottom:10px">Remaining team words: ' + gs.remaining + '</div>' +
    self._gridHtml(false) +
    '<button type="button" class="btn bw bf" onclick="window._cgClueReady()">Clue given — guessers play</button>' +
    '</div>';
  window._cgClueReady = function() {
    gs.phase = 'guess';
    Nav.go('game');
    self._guess();
  };
};
DeadDrop._guess = function() {
  var gs = this.gs, self = this;
  var guessers = this.players.filter(function(p) { return p.id !== gs.giverId; });
  GameShell.announceTurn(guessers[0] ? guessers[0].name : 'Guessers');
  document.getElementById('gbody').innerHTML =
    '<div style="padding:6px 0;text-align:center">' +
    '<div style="font-weight:700;margin-bottom:6px">Guessers — tap a word</div>' +
    '<div style="opacity:.55;font-size:.75rem;margin-bottom:8px">Team left: ' + gs.remaining + ' · Traps hit: ' + gs.trapsHit + '</div>' +
    self._gridHtml(false) +
    '<button type="button" class="btn bg bf" style="margin-top:8px" onclick="window._cgEndTurn()">End turn</button>' +
    '</div>';
  window._cgPick = function(i) {
    var cell = gs.cells[i];
    if (!cell || cell.revealed) return;
    cell.revealed = true;
    Snd.click(); Hap.l();
    if (cell.role === 'team') {
      gs.remaining--;
      toast('Team word!');
      if (gs.remaining <= 0) { gs.phase = 'result'; gs.won = true; Nav.go('game'); self._result(); return; }
    } else if (cell.role === 'trap') {
      gs.trapsHit++;
      toast('Trap!');
      Snd.err();
      if (gs.trapsHit >= 2) { gs.phase = 'result'; gs.won = false; Nav.go('game'); self._result(); return; }
    } else {
      toast('Neutral');
    }
    Nav.go('game');
    self._guess();
  };
  window._cgEndTurn = function() {
    gs.phase = 'clue';
    Nav.go('game');
    self._clue();
  };
};
DeadDrop._result = function() {
  var gs = this.gs, self = this;
  var giver = this.players.find(function(p) { return p.id === gs.giverId; });
  var winner = gs.won ? 'Guessers' : 'Trap wins';
  document.getElementById('gbody').innerHTML =
    '<div style="text-align:center;padding:18px 8px">' +
    '<div style="font-size:1.5rem;font-weight:800;margin-bottom:8px">' + (gs.won ? 'Grid cleared!' : 'Traps sprung') + '</div>' +
    '<div style="opacity:.55;margin-bottom:14px">Clue giver was ' + giver.av + ' ' + giver.name + '</div>' +
    self._gridHtml(true) +
    '<div style="display:flex;gap:8px;justify-content:center;margin-top:14px">' +
      '<button type="button" class="btn bw" onclick="GL.launch(\'deadrop\')">Play Again</button>' +
      '<button type="button" class="btn bg" onclick="GL.requestLeave()">Exit</button>' +
    '</div></div>';
  self.done(winner);
  if (gs.won) { Snd.ok(); Hap.ok(); } else { Snd.betray(); Hap.err(); }
};

// ── BLITZ DUEL (1v1 reaction) ─────
var BlitzDuel = new Game({id:'blitz',title:'Blitz Duel',icon:'⚡',type:'reflex',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:2,max:2,desc:'1v1 reaction battles. Best of 5 rounds. Speed wins.'});
BlitzDuel.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,2));
  this.gs = {round:1,maxR:5,wins:[0,0],phase:'ready',players:pl.slice(0,2),reactionTimes:[null,null],countdown:3};
};
BlitzDuel.render = function() {
  var gs = this.gs, self = this;
  if (gs.wins[0] >= 3 || gs.wins[1] >= 3) {
    var winnerIdx = gs.wins[0] >= 3 ? 0 : 1;
    this.done(gs.players[winnerIdx].name);
    this.showWin(gs.players[winnerIdx].name, [{n:gs.players[winnerIdx].name,s:gs.wins[winnerIdx]+' wins'},{n:gs.players[1-winnerIdx].name,s:gs.wins[1-winnerIdx]+' wins'}]);
    return;
  }
  document.getElementById('gbody').innerHTML =
    '<div style="text-align:center;padding:8px 0">' +
    '<div style="display:flex;justify-content:space-around;margin-bottom:20px">' +
      gs.players.map(function(p,i){return '<div style="text-align:center"><div style="font-size:2rem">'+p.av+'</div><div style="font-size:.82rem;font-weight:700;margin-top:4px">'+p.name+'</div><div style="font-size:1.4rem;color:var(--red);font-weight:800;margin-top:2px">' + '⚡'.repeat(gs.wins[i]) + '○'.repeat(3-gs.wins[i]) + '</div></div>';}).join('<div style="font-size:1.2rem;opacity:.3;align-self:center">VS</div>') +
    '</div>' +
    '<div style="margin-bottom:20px;font-size:.75rem;opacity:.38">Round ' + gs.round + ' / ' + gs.maxR + '</div>' +
    '<div id="_bd-arena" style="height:200px;background:rgba(255,45,85,.05);border:1px solid rgba(255,45,85,.12);border-radius:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;font-weight:700;opacity:.38">GET READY</div>' +
    '<div style="margin-top:14px;font-size:.75rem;opacity:.35">Both players tap the arena at the same time when it turns green</div>' +
    '<button type="button" class="btn bw" style="margin-top:14px" onclick="window._bdstart()">▶ Start Round ' + gs.round + '</button>' +
    '</div>';

  window._bdstart = function() {
    var arena = document.getElementById('_bd-arena');
    if (!arena) return;
    gs.reactionTimes = [null, null];
    arena.textContent = '...';
    arena.style.background = 'rgba(255,45,85,.08)';
    // Random delay 1.5-4s
    var delay = 1500 + Math.random() * 2500;
    var go = false;
    var t0;
    setTimeout(function() {
      go = true; t0 = Date.now();
      arena.style.background = 'rgba(48,209,88,.3)';
      arena.style.borderColor = 'rgba(48,209,88,.6)';
      arena.style.boxShadow = '0 0 30px rgba(48,209,88,.4)';
      arena.textContent = 'TAP NOW!';
      arena.style.color = 'var(--green)';
      arena.style.fontSize = '1.4rem';
      arena.style.opacity = '1';
      Snd.ok(); Hap.heavy();
      // Timeout if nobody taps
      setTimeout(function() {
        if (gs.reactionTimes[0]===null && gs.reactionTimes[1]===null) {
          toast('Nobody tapped! Redoing...');
          Nav.go('game'); self.render();
        }
      }, 3000);
    }, delay);

    var tapCount = 0;
    arena.addEventListener('touchstart', function(e) {
      e.preventDefault();
      if (!go) { arena.textContent = '⚡ Too early!'; arena.style.color='var(--red)'; return; }
      if (tapCount >= 2) return;
      var rt = Date.now() - t0;
      gs.reactionTimes[tapCount] = rt;
      tapCount++;
      arena.textContent = tapCount === 1 ? 'Player 2 — TAP!' : '...';
      if (tapCount === 2) {
        // Both tapped — determine winner
        var winner = gs.reactionTimes[0] < gs.reactionTimes[1] ? 0 : 1;
        gs.wins[winner]++;
        gs.round++;
        arena.textContent = gs.players[winner].name + ' wins! (' + gs.reactionTimes[winner] + 'ms vs ' + gs.reactionTimes[1-winner] + 'ms)';
        arena.style.background = 'rgba(255,214,10,.15)';
        arena.style.color = 'var(--amber)';
        Snd.ok(); Hap.ok();
        setTimeout(function() { Nav.go('game'); self.render(); }, 2200);
      }
    }, {passive:false});
  };
};

// ── PIXEL PAINTER (creative solo — Nintendo Mario Paint vibe) ────────
var PixelPainter = new Game({id:'pixel',title:'Pixel Painter',icon:'🎨',type:'puzzle',cat:'solo',col:PCBrand.h_ff6b00,mp:false,min:1,max:1,desc:'Draw pixel art. Solve color challenges. Create masterpieces.'});
PixelPainter.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,1));
  var sz = 12;
  this.gs = {
    sz:sz,
    grid:Array(sz*sz).fill(PCBrand.h_111),
    color:PCBrand.h_ff2d55,
    palette:[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_ffd60a,PCBrand.h_30d158,PCBrand.h_00d4ff,PCBrand.h_bf5af2,PCBrand.h_fff,PCBrand.h_000,PCBrand.h_333,PCBrand.h_64d2ff,PCBrand.h_ff375f,PCBrand.h_888],
    challenge:null,score:0,mode:'free',strokes:0
  };
};
PixelPainter.render = function() {
  var gs = this.gs, self = this;
  var sz = gs.sz, cellSz = Math.min(26, Math.floor((Math.min(window.innerWidth,480)-32)/sz));
  var gridHTML = '<div style="display:grid;grid-template-columns:repeat('+sz+','+cellSz+'px);gap:0;border:1px solid rgba(255,255,255,.12);border-radius:6px;overflow:hidden;touch-action:none" id="_pg">';
  for (var i=0;i<sz*sz;i++) {
    gridHTML += '<div data-i="'+i+'" style="width:'+cellSz+'px;height:'+cellSz+'px;background:'+gs.grid[i]+';cursor:crosshair" ontouchstart="window._pp('+i+')" ontouchmove="window._ppm(event)"></div>';
  }
  gridHTML += '</div>';

  document.getElementById('gbody').innerHTML =
    '<div style="padding:5px 0">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<div style="font-size:.75rem;opacity:.38">Strokes: '+gs.strokes+'</div>' +
      '<div style="font-size:.75rem;font-weight:700">🎨 Pixel Painter</div>' +
      '<div style="display:flex;gap:6px"><button type="button" onclick="window._pclear()" style="padding:5px 10px;background:rgba(255,255,255,.07);border:1px solid var(--border);border-radius:8px;font-size:.7rem;cursor:pointer">Clear</button><button type="button" onclick="window._psave()" style="padding:5px 10px;background:rgba(0,212,255,.15);border:1px solid rgba(0,212,255,.3);border-radius:8px;font-size:.7rem;cursor:pointer">Save</button></div>' +
    '</div>' +
    '<div style="display:flex;justify-content:center;margin-bottom:12px">' + gridHTML + '</div>' +
    '<div style="margin-bottom:10px">' +
      '<div style="font-size:.6rem;opacity:.35;text-transform:uppercase;margin-bottom:6px">Color palette</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px">' +
        gs.palette.map(function(c){return '<div onclick="window._pcolor(\''+c+'\',this)" style="width:32px;height:32px;border-radius:8px;background:'+c+';cursor:pointer;border:3px solid '+(gs.color===c?PCBrand.h_fff:'transparent')+';transition:border-color .15s"></div>';}).join('') +
        '<div style="width:32px;height:32px;border-radius:8px;cursor:pointer;border:2px dashed rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:1rem" onclick="window._perase()">⬜</div>' +
      '</div>' +
    '</div>' +
    '<div style="font-size:.65rem;opacity:.3;text-align:center">Tap or drag to paint · Tap color to select</div>' +
    '</div>';

  var painting = false;
  window._pp = function(i) {
    gs.grid[i] = gs.color; gs.strokes++;
    var cell = document.querySelector('[data-i="'+i+'"]');
    if (cell) cell.style.background = gs.color;
    Hap.l();
  };
  window._ppm = function(e) {
    e.preventDefault();
    var touch = e.touches[0];
    var el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.getAttribute('data-i') !== null) {
      var i = parseInt(el.getAttribute('data-i'));
      gs.grid[i] = gs.color;
      el.style.background = gs.color;
    }
  };
  window._pcolor = function(c, el) {
    gs.color = c; Snd.click();
    document.querySelectorAll('[data-i]').forEach(function(){});
    Nav.go('game'); self.render();
  };
  window._perase = function() { gs.color = PCBrand.h_111; Snd.click(); Nav.go('game'); self.render(); };
  window._pclear = function() { gs.grid = Array(sz*sz).fill(PCBrand.h_111); gs.strokes = 0; Nav.go('game'); self.render(); toast('Canvas cleared'); };
  window._psave = function() {
    // Save to localStorage as small compressed string
    try {
      localStorage.setItem('po5_art', JSON.stringify({grid:gs.grid,ts:Date.now()}));
      toast('🎨 Artwork saved!'); Snd.ok(); Hap.ok();
      XP.add(Math.min(50, gs.strokes), Difficulty.xpMult());
    } catch(e) { toast('Could not save'); }
  };
};

// ── SURVIVAL ARENA (Roguelike solo — Sega/EA dungeon crawler vibe) ───
var SurvivalArena = new Game({id:'arena',title:'Survival Arena',icon:'🏟️',type:'survival',cat:'solo',col:PCBrand.h_ff2d55,mp:false,min:1,max:1,desc:'Wave-based survival. Choose upgrades. Push as far as you can.'});
SurvivalArena.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,1));
  this.gs = {
    wave:1,hp:Difficulty.lives(100),maxHp:Difficulty.lives(100),
    atk:10,def:5,gold:0,xpg:0,
    sc:0,phase:'wave',
    upgrades:[],
    enemies:[],log:[],streak:0
  };
  this._genWave();
};
SurvivalArena._genWave = function() {
  var gs = this.gs, w = gs.wave;
  var types = [
    {name:'Scout',icon:'👤',hp:10+w*3,atk:3+w,reward:5+w,xp:5},
    {name:'Soldier',icon:'💂',hp:20+w*5,atk:6+w*2,reward:10+w*2,xp:10},
    {name:'Brute',icon:'👹',hp:40+w*8,atk:12+w*3,reward:20+w*3,xp:20},
    {name:'Boss',icon:'💀',hp:100+w*20,atk:20+w*5,reward:50+w*5,xp:50}
  ];
  var count = Math.min(3, 1+Math.floor(w/3));
  gs.enemies = Array.from({length:count}, function(_,i) {
    var t = i===count-1&&w%5===0 ? types[3] : types[Math.min(Math.floor(w/2),2)];
    return Object.assign({},t,{curHp:t.hp,id:i});
  });
};
SurvivalArena.render = function() {
  var gs = this.gs, self = this;
  if (gs.hp <= 0) {
    XP.add(gs.sc, Difficulty.xpMult()); self.done(null);
    document.getElementById('gbody').innerHTML =
      '<div style="text-align:center;padding:30px 0">' +
      '<div style="font-size:3.4rem;margin-bottom:5px">🏟️</div>' +
      '<div style="font-size:1.7rem;font-weight:800;color:var(--red)">Wave ' + (gs.wave-1) + '</div>' +
      '<div style="font-size:1.3rem;font-weight:800;margin-top:4px">' + gs.sc + ' pts</div>' +
      '<div style="opacity:.38;margin-bottom:20px">Survived ' + (gs.wave-1) + ' waves</div>' +
      '<div style="display:flex;gap:8px;justify-content:center"><button type="button" class="btn ba" style="--acc:var(--red);--glow:rgba(255,45,85,.28)" id="_arag">Play Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div>' +
      '</div>';
    document.getElementById('_arag').onclick = function(){GL.launch('arena');};
    Snd.err(); return;
  }
  if (gs.phase === 'upgrade') { this._showUpgrade(); return; }

  var hpPct = (gs.hp/gs.maxHp)*100;
  var enemyHTML = gs.enemies.filter(function(e){return e.curHp>0;}).map(function(e) {
    var ePct = (e.curHp/e.hp)*100;
    return '<div style="padding:10px;background:rgba(255,45,85,.08);border:1px solid rgba(255,45,85,.18);border-radius:12px;margin-bottom:7px">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:.82rem;font-weight:700">'+e.icon+' '+e.name+'</span><span style="font-size:.72rem;color:var(--red)">ATK '+e.atk+'</span></div>' +
      '<div style="height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+ePct+'%;background:var(--red);border-radius:3px;transition:width .3s"></div></div>' +
      '<div style="font-size:.62rem;opacity:.38;margin-top:3px">'+e.curHp+'/'+e.hp+' HP</div>' +
    '</div>';
  }).join('');

  document.getElementById('gbody').innerHTML =
    '<div style="padding:5px 0">' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:12px">' +
      '<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--amber)">'+gs.wave+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Wave</div></div>' +
      '<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800">'+gs.sc+'</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Score</div></div>' +
      '<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--amber)">'+gs.gold+'💰</div><div style="font-size:.55rem;opacity:.32;text-transform:uppercase">Gold</div></div>' +
    '</div>' +
    '<div style="margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:.72rem"><span>❤️ HP</span><span style="font-weight:700;color:'+(hpPct>50?'var(--green)':'var(--red)')+'">'+gs.hp+'/'+gs.maxHp+'</span></div>' +
      '<div style="height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+hpPct+'%;background:'+(hpPct>50?'var(--green)':'var(--red)')+';border-radius:4px;transition:width .3s"></div></div>' +
    '</div>' +
    '<div style="font-size:.65rem;opacity:.35;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Wave '+gs.wave+' Enemies</div>' +
    enemyHTML +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<button type="button" class="btn bg" style="flex:1" onclick="window._ardef()">🛡️ Defend<br><span style="font-size:.65rem;opacity:.55">Take ½ dmg</span></button>' +
      '<button type="button" class="btn ba" style="flex:1;--acc:var(--red);--glow:rgba(255,45,85,.28)" onclick="window._aratt()">⚔️ Attack<br><span style="font-size:.65rem;opacity:.55">ATK '+gs.atk+'</span></button>' +
      '<button type="button" class="btn bg" style="flex:1" onclick="window._arspec()">✨ Special<br><span style="font-size:.65rem;opacity:.55">AOE burst</span></button>' +
    '</div>' +
    (gs.log.length?'<div style="margin-top:10px;font-size:.7rem;opacity:.4">'+gs.log[gs.log.length-1]+'</div>':'') +
    '</div>';

  window._aratt = function() { self._combat(gs.atk, false); };
  window._ardef = function() { self._combat(Math.floor(gs.atk*0.5), true); };
  window._arspec = function() { self._combat(gs.atk * 2, false, true); };
};
SurvivalArena._combat = function(dmg, defending, aoe) {
  var gs = this.gs, self = this;
  var living = gs.enemies.filter(function(e){return e.curHp>0;});
  if (!living.length) { this._nextWave(); return; }
  // Deal damage
  if (aoe) {
    living.forEach(function(e){e.curHp=Math.max(0,e.curHp-Math.floor(dmg*0.6));});
    gs.log.push('✨ AOE! Hit all enemies for '+Math.floor(dmg*0.6)+' each');
  } else {
    var target = living[0];
    target.curHp = Math.max(0, target.curHp - dmg);
    if (target.curHp <= 0) {
      gs.sc += target.reward; gs.gold += target.reward;
      gs.xpg += target.xp;
      gs.log.push('⚔️ Defeated '+target.icon+' '+target.name+'! +'+target.reward+' gold');
      Snd.ok(); Hap.ok();
    } else {
      gs.log.push('⚔️ Hit '+target.name+' for '+dmg+' ('+target.curHp+' HP left)');
    }
  }
  // Enemy attacks back
  living.filter(function(e){return e.curHp>0;}).forEach(function(e) {
    var eDmg = defending ? Math.floor(e.atk*0.5) : e.atk;
    eDmg = Math.max(1, eDmg - gs.def);
    gs.hp = Math.max(0, gs.hp - eDmg);
  });
  Snd.reflex(50); Hap.m();
  // Check wave clear
  if (gs.enemies.every(function(e){return e.curHp<=0;})) {
    gs.sc += gs.wave * 10;
    gs.log.push('🏆 Wave '+gs.wave+' cleared! +'+gs.wave*10+' bonus');
    Snd.lvlup(); Hap.ok();
    gs.phase = 'upgrade'; gs.wave++;
  }
  Nav.go('game'); this.render();
};
SurvivalArena._showUpgrade = function() {
  var gs = this.gs, self = this;
  var upgrades = [
    {id:'hp',name:'Heal +25 HP',icon:'❤️',cost:15,fn:function(){gs.hp=Math.min(gs.maxHp,gs.hp+25);}},
    {id:'atk',name:'Attack +5',icon:'⚔️',cost:20,fn:function(){gs.atk+=5;}},
    {id:'def',name:'Defense +3',icon:'🛡️',cost:15,fn:function(){gs.def+=3;}},
    {id:'maxhp',name:'Max HP +30',icon:'💪',cost:25,fn:function(){gs.maxHp+=30;gs.hp+=30;}},
    {id:'gold',name:'Skip (keep gold)',icon:'💰',cost:0,fn:function(){}}
  ];
  document.getElementById('gbody').innerHTML =
    '<div style="padding:5px 0">' +
    '<div style="text-align:center;margin-bottom:14px">' +
      '<div style="font-size:1.6rem;font-weight:800;color:var(--amber)">Wave ' + (gs.wave-1) + ' Complete!</div>' +
      '<div style="opacity:.38;font-size:.78rem;margin-top:4px">'+gs.gold+'💰 gold · Choose an upgrade</div>' +
    '</div>' +
    upgrades.map(function(u){
      var canAfford = gs.gold >= u.cost;
      return '<div onclick="'+(canAfford?'window._arUpg(\''+u.id+'\')':'')+'\" style="padding:13px 14px;border-radius:13px;border:1px solid '+(canAfford?'rgba(255,255,255,.15)':'rgba(255,255,255,.06)')+';background:rgba(255,255,255,'+(canAfford?'.06':'.02')+');margin-bottom:7px;cursor:'+(canAfford?'pointer':'default')+';opacity:'+(canAfford?'1':'.4')+';display:flex;align-items:center;gap:11px"><div style="font-size:1.5rem">'+u.icon+'</div><div style="flex:1"><div style="font-weight:700;font-size:.88rem">'+u.name+'</div></div><div style="font-size:.75rem;color:var(--amber);font-weight:700">'+(u.cost>0?u.cost+'💰':'Free')+'</div></div>';
    }).join('') +
    '</div>';
  var upMap = {};
  upgrades.forEach(function(u){upMap[u.id]=u;});
  window._arUpg = function(id) {
    var u = upMap[id];
    if (!u || gs.gold < u.cost) return;
    gs.gold -= u.cost; u.fn();
    gs.upgrades.push(id);
    gs.phase = 'wave'; self._genWave();
    Nav.go('game'); self.render();
    toast(u.icon+' '+u.name);
  };
};
SurvivalArena._nextWave = function() {
  this.gs.phase = 'upgrade';
  this.gs.wave++;
  Nav.go('game'); this.render();
};

// ── MIND MELD (Telepathy party game — Nintendo party vibe) ──────────
var MindMeld = new Game({id:'meld',title:'Think Alike',icon:'🧠',type:'party',cat:'multiplayer',col:PCBrand.h_00d4ff,mp:true,min:2,max:10,desc:'Think the same thought. The more players agree, the more you score.'});
MindMeld.setup = function(pl) {
  Game.prototype.setup.call(this, pl);
  Drama.reset(pl);
  var prompts = [
    'A color','An animal','A country','A sport','A fruit','A number 1-10',
    'A movie','A superpower','A food','A type of weather','A planet','A car brand',
    'A body part','A school subject','A type of music','An occupation','A season',
    'A famous person (living)','A TV show','A Pokemon type'
  ];
  this.gs = {
    round:1,maxR:pl.length*2,
    sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),
    prompt:prompts[Math.floor(Math.random()*prompts.length)],
    prompts:this.shuf(prompts),promptIdx:0,
    answers:{},pidx:0,phase:'answer'
  };
};
MindMeld.render = function() {
  var gs = this.gs, self = this;
  if (gs.round > gs.maxR) {
    var sc = this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});
    this.done(sc[0].n); this.showWin(sc[0].n, sc); return;
  }
  if (gs.phase === 'answer') this._answer();
  else this._reveal();
};
MindMeld._answer = function() {
  var gs = this.gs, self = this;
  var player = this.players[gs.pidx % this.players.length];
  if (gs.pidx >= this.players.length) { gs.phase = 'reveal'; Nav.go('game'); this._reveal(); return; }
  var sec = '<div style="text-align:center">' +
    '<div style="font-size:2rem;margin-bottom:12px">🧠</div>' +
    '<div style="font-size:.65rem;opacity:.35;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Round '+gs.round+'/'+gs.maxR+'</div>' +
    '<div style="font-size:1.2rem;font-weight:800;margin-bottom:5px">' + gs.prompt + '</div>' +
    '<div style="opacity:.38;font-size:.75rem;margin-bottom:16px">Think of the first thing that comes to mind</div>' +
    '<input id="_mma" autocorrect="off" placeholder="Your answer..." style="width:100%;padding:13px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);font-size:1rem;font-weight:700;color:'+PCBrand.h_fff+';text-align:center;margin-bottom:13px" onkeydown="if(event.key===\'Enter\')window._mmsubmit()">' +
    '<button type="button" class="btn bw bf" onclick="window._mmsubmit()">Submit →</button>' +
    '</div>';
  PP.show(player.name, player.av, 'Mind Meld', sec, function() { Nav.go('game'); self.render(); });
  window._mmsubmit = function() {
    var val = (document.getElementById('_mma')||{}).value || '';
    if (!val.trim()) return;
    gs.answers[player.id] = val.trim().toLowerCase();
    gs.pidx++; PP.done(); Nav.go('game'); self.render();
  };
};
MindMeld._reveal = function() {
  var gs = this.gs, self = this;
  // Count matching answers
  var counts = {};
  Object.values(gs.answers).forEach(function(a){counts[a]=(counts[a]||0)+1;});
  var maxMatch = Math.max.apply(null, Object.values(counts));
  var winners = Object.keys(counts).filter(function(a){return counts[a]===maxMatch;});
  // Award points
  this.players.forEach(function(p) {
    var ans = gs.answers[p.id];
    if (ans && winners.includes(ans)) {
      var pts = counts[ans] * 10;
      gs.sc[p.id] = (gs.sc[p.id]||0) + pts;
    }
  });
  Drama.tick(maxMatch > 1 ? 'win' : 'betray');

  document.getElementById('gbody').innerHTML =
    '<div style="padding:5px 0">' +
    '<div style="text-align:center;margin-bottom:14px">' +
      '<div style="font-size:.65rem;opacity:.35;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">The prompt was</div>' +
      '<div style="font-size:1.2rem;font-weight:800">' + gs.prompt + '</div>' +
    '</div>' +
    '<div style="margin-bottom:14px">' +
      this.players.map(function(p){
        var ans = gs.answers[p.id] || '(no answer)';
        var matches = counts[ans] || 0;
        var isWinner = matches === maxMatch;
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:11px;background:'+(isWinner?'rgba(0,212,255,.08)':'rgba(255,255,255,.03)')+';border:1px solid '+(isWinner?'rgba(0,212,255,.25)':'var(--border)')+';margin-bottom:6px"><div>'+p.av+'</div><div style="flex:1"><div style="font-weight:700;font-size:.86rem">'+p.name+'</div><div style="font-size:1rem;font-weight:800;margin-top:2px;color:'+(isWinner?'var(--cyan)':'var(--dim)')+'">'+ans+'</div></div>'+(isWinner?'<div style="font-size:.75rem;color:var(--cyan);font-weight:700">+'+( matches*10)+'</div>':'')+'</div>';
      }).join('') +
    '</div>' +
    (maxMatch>1?'<div style="text-align:center;padding:10px;background:rgba(0,212,255,.08);border-radius:11px;margin-bottom:12px;font-size:.86rem;color:var(--cyan);font-weight:700">🧠 '+maxMatch+' players thought the same!</div>':'<div style="text-align:center;opacity:.38;margin-bottom:12px;font-size:.82rem">No matches this round...</div>') +
    '<button type="button" class="btn bw bf" onclick="window._mmnext()">Next Round →</button>' +
    '</div>';

  window._mmnext = function() {
    gs.round++; gs.answers={}; gs.pidx=0; gs.phase='answer';
    gs.prompt = gs.prompts[gs.promptIdx++ % gs.prompts.length];
    Nav.go('game'); self.render();
  };
};


// ─── V5 SYSTEMS ───
// ═══════════════════════════════════════════════════════════════════
// V5 SYSTEMS: Orientation, Progress Bar, Polish, UX
// ═══════════════════════════════════════════════════════════════════

// ── ORIENTATION MANAGER ──────────────────────────────────────────
var OrientMgr = {
  current: 'portrait',
  init: function() {
    var self = this;
    // Show orientation button on iPad
    var isIPad = (DevSel&&DevSel.device==='ipad') || window.innerWidth >= 768;
    var btn = document.getElementById('orient-btn');
    if (btn && isIPad) btn.classList.add('show');
    window.addEventListener('orientationchange', function() {
      setTimeout(function() { self._update(); }, 300);
    });
    window.addEventListener('resize', function() { self._update(); });
    this._update();
  },
  _update: function() {
    var isLandscape = window.innerWidth > window.innerHeight;
    this.current = isLandscape ? 'landscape' : 'portrait';
    var btn = document.getElementById('orient-btn');
    if (btn) btn.textContent = isLandscape ? '⟳' : '⟲';
    document.body.setAttribute('data-orient', this.current);
    // Update nav for landscape iPad
    if (DevSel && DevSel.device === 'ipad') {
      var nav = document.getElementById('nav');
      if (nav) nav.setAttribute('data-landscape', isLandscape ? '1' : '0');
    }
  },
  toggle: function() {
    if (screen.orientation && screen.orientation.lock) {
      var target = this.current === 'portrait' ? 'landscape' : 'portrait';
      screen.orientation.lock(target).catch(function() {
        toast('Rotate your device manually');
      });
    } else {
      toast('Rotate your device to change orientation');
    }
    Snd.click(); Hap.l();
  }
};

// ── GAME PROGRESS BAR ─────────────────────────────────────────────
var ProgressBar = {
  set: function(pct, col) {
    var fill = document.getElementById('game-progress-fill');
    if (!fill) return;
    fill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    fill.style.background = col || 'var(--acc)';
  },
  clear: function() { this.set(0); }
};

// ── ACHIEVEMENT POPUP (better than toast) ─────────────────────────
var AchPopup = {
  _t: null,
  show: function(icon, title, xp) {
    var el = document.getElementById('ach-popup');
    if (!el) return;
    el.innerHTML =
      '<div style="font-size:2rem">' + icon + '</div>' +
      '<div style="flex:1"><div style="font-weight:800;font-size:.9rem">' + title + '</div>' +
        '<div style="font-size:.7rem;opacity:.5;margin-top:1px">Achievement unlocked</div></div>' +
      '<div style="color:var(--amber);font-weight:700;font-size:.82rem">+' + xp + ' XP</div>';
    el.classList.add('show');
    clearTimeout(this._t);
    Snd.lvlup(); Hap.ok();
    this._t = setTimeout(function() {
      var e2 = document.getElementById('ach-popup');
      if (e2) e2.classList.remove('show');
    }, 3200);
  }
};

// Override Ach.unlock to use popup
// Ach.unlock handled in final patch

// ── HAPTIC BOUNCE on all card taps ────────────────────────────────
document.addEventListener('touchstart', function(e) {
  var target = e.target.closest('.mcard,.lcard,.btn,.vopt,.pchip');
  if (target && !target.classList.contains('tapped')) {
    target.classList.add('tapped');
    setTimeout(function() { target.classList.remove('tapped'); }, 250);
  }
}, {passive: true});

// Nav.go enhanced inline in v5_full_js

// ── GAME COUNT BADGE ──────────────────────────────────────────────
function updateGameCountBadge() {
  var tried = JSON.parse(localStorage.getItem('po5t') || '[]');
  var total = Reg.list.length;
  var pct = Math.round(tried.length / total * 100);
  var lc = document.getElementById('lib-count');
  if (lc) lc.textContent = total + ' games · ' + tried.length + ' played · ' + pct + '% explored';
}

// ── SMART WELCOME BACK MESSAGE ────────────────────────────────────
function getWelcomeBack() {
  var hour = new Date().getHours();
  var name = S.prof.name || 'Operative';
  var greetings = {
    morning: ['Good morning, ' + name + '.', 'Rise and game, ' + name + '.', 'Early session, ' + name + '?'],
    afternoon: ['Afternoon, ' + name + '.', 'Good afternoon, ' + name + '.', 'Back for more, ' + name + '?'],
    evening: ['Good evening, ' + name + '.', 'Evening session incoming.', 'Night mode engaged, ' + name + '.'],
    night: ['Late night gaming, ' + name + '.', 'Burning the midnight oil.', 'The night owls are here.']
  };
  var timeKey = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  var pool = greetings[timeKey];
  return pool[Math.floor(Math.random() * pool.length)];
}

// UI.home enhanced in v5_full_js

// ── FIX: exitGame also clears word game timer ─────────────────────
var _origExitV5 = GL.exitGame.bind(GL);
GL.exitGame = function() {
  if (S.game) {
    // Clear all possible timers
    var g = S.game;
    ['_ft','_rt2','_dt','_qi','_rl','_si','_pti','_snki','_ifi','_ck','_wt','_pci','_snki'].forEach(function(k){
      if (g[k]) { clearInterval(g[k]); clearTimeout(g[k]); g[k] = null; }
    });
  }
  Drama.state.tension = 0;
  Drama._updateBanner();
  Mutators.active = [];
  ProgressBar.clear();
  releaseWakeLock();
  Bus.emit('game:end', {});
  // Restore nav
  var nav = document.getElementById('nav');
  if (nav) nav.className = '';
  // Clear game screen
  S.game = null;
  Nav.go('home');
};

// ── FIX: Register new V5 games ───────────────────────────────────
// (added to boot below via override)
var _v5Games = [WordAssassin, DeadDrop, BlitzDuel, PixelPainter, SurvivalArena, MindMeld];

// ── V5 BOOT (runs after main boot) ───────────────────────────────
// Wait for Reg to be populated, then add v5 games
window.addEventListener('load', function() {
  setTimeout(function() {
    // Add v5 games if not already registered
    _v5Games.forEach(function(g) {
      if (!Reg.get(g.id)) {
        Reg.add(g);
      }
    });
    // Refresh library
    GL._buildLib('all');
    GL._buildScrolls();
    updateGameCountBadge();
    // Init orientation
    OrientMgr.init();
    // Update lib count
    var lc = document.getElementById('lib-count');
    if (lc) lc.textContent = Reg.list.length + ' games · Fully offline';
  }, 2000);
});

// ── BACK BUTTON / ESCAPE IMPROVEMENTS ────────────────────────────
// Override browser back button
window.addEventListener('popstate', function(e) {
  if (S.cur === 'game') {
    GL.exitGame();
  } else if (document.getElementById('ov').className === 'open') {
    Modal.close();
  }
});
// Push a state so back button works
if (window.history && window.history.pushState) {
  window.history.pushState({page:'prism'}, 'PrismCap', '');
}

// ── CSP META for cleaner browser behavior ─────────────────────────
// (Already added via HTML patch)

// ── BETTER ERROR BOUNDARY ─────────────────────────────────────────
window.addEventListener('error', function(e) {
  // Only show if it's our code, not browser extensions
  if (e.filename && e.filename.includes('PrismCap')) {
    console.error('PrismCap Error:', e.message, 'at line', e.lineno);
    // Graceful recovery - go home
    if (S && S.cur === 'game') {
      toast('⚠️ Something went wrong — returning home');
      setTimeout(function() { if(GL) GL.exitGame(); }, 1500);
    }
  }
});

// ── INSTALL PROMPT in Profile ─────────────────────────────────────
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  window._installEvt = e;
  // Add install button to profile screen
  var prof = document.getElementById('profile-screen');
  if (prof && !document.getElementById('_install-btn')) {
    var btn = document.createElement('div');
    btn.id = '_install-btn';
    btn.style.cssText = 'margin:0 15px 12px;padding:12px 15px;background:rgba(100,210,255,.08);border:1px solid rgba(100,210,255,.2);border-radius:14px;cursor:pointer;display:flex;align-items:center;gap:10px';
    btn.innerHTML = '<span style="font-size:1.5rem">📱</span><div style="flex:1"><div style="font-weight:700;font-size:.86rem">Install PrismCap</div><div style="font-size:.7rem;opacity:.4;margin-top:1px">Add to home screen for best experience</div></div><div style="font-size:.72rem;color:var(--cyan);font-weight:700">Install</div>';
    btn.onclick = function() {
      if (window._installEvt) {
        window._installEvt.prompt();
        window._installEvt.userChoice.then(function(r) {
          if (r.outcome === 'accepted') { toast('✅ PrismCap installed!'); btn.remove(); }
        });
      }
    };
    // Insert before first child after header
    var header = prof.querySelector('[style*="flex-direction:column"]');
    if (header && header.parentNode) header.parentNode.insertBefore(btn, header.nextSibling);
  }
});



// ─── V5 FULL JS ───
// ═══════════════════════════════════════════════════════════════════
// PRISM OS v5 — FULL JS EXPANSION
// All new systems, games, fixes, bots, themes, gender, search
// ═══════════════════════════════════════════════════════════════════

// ── DEVICE MODEL SYSTEM ──────────────────────────────────────────
var DeviceModels = {
  configs: {
    ip16pro: {family:'iphone',sat:59,sab:34,w:393,cssClass:'iphone-di',label:'iPhone 16 Pro'},
    ip15:    {family:'iphone',sat:59,sab:34,w:390,cssClass:'iphone-di',label:'iPhone 15'},
    ip13:    {family:'iphone',sat:47,sab:34,w:390,cssClass:'iphone-notch',label:'iPhone 13'},
    ipse:    {family:'iphone',sat:20,sab:0, w:375,cssClass:'iphone-se',label:'iPhone SE'},
    ipadpro: {family:'ipad', sat:24,sab:20,w:834,cssClass:'ipad-pro',label:'iPad Pro'},
    ipadair: {family:'ipad', sat:20,sab:20,w:820,cssClass:'ipad-air',label:'iPad Air'},
    mac:     {family:'mac',  sat:0, sab:0, w:1440,cssClass:'mac',label:'Mac'}
  },
  apply: function(model) {
    var cfg = this.configs[model];
    if (!cfg) return;
    // Set CSS vars for this exact device
    document.documentElement.style.setProperty('--sat', cfg.sat + 'px');
    document.documentElement.style.setProperty('--sab', cfg.sab + 'px');
    document.body.setAttribute('data-device-model', model);
    document.body.setAttribute('data-device', cfg.family);
    document.body.classList.remove('iphone-di','iphone-notch','iphone-se','ipad-pro','ipad-air','mac');
    document.body.classList.add(cfg.cssClass);
    // Show orientation button on iPad
    var ob = document.getElementById('orient-btn');
    if (ob) ob.className = cfg.family === 'ipad' ? 'show' : '';
  }
};

// Patch DevSel to use DeviceModels
var _origDevSelPick = DevSel.pick.bind(DevSel);
DevSel.pick = function(dev) {
  this.device = dev;
  // Map model to family for backward compat
  var models = DeviceModels.configs;
  var cfg = models[dev] || models.ip15;
  var family = cfg ? cfg.family : dev;
  this.device = family; // store family for layout
  localStorage.setItem(this._k, dev); // store model
  DeviceModels.apply(dev);
  this._applyLayout(family);
  this._hide();
  Hap.ok(); Snd.ok();
  var label = cfg ? cfg.label : dev;
  toast('✅ Optimized for ' + label);
};
// On init, restore saved model
var _origDevSelInit = DevSel.init.bind(DevSel);
DevSel.init = function() {
  var saved = localStorage.getItem(this._k);
  if (saved && DeviceModels.configs[saved]) {
    this.device = DeviceModels.configs[saved].family;
    DeviceModels.apply(saved);
    this._applyLayout(this.device);
    this._hide();
    return;
  }
  // Auto-detect from UA
  var ua = navigator.userAgent;
  var w = window.innerWidth;
  if (/iPad/.test(ua) || (w >= 768 && /Macintosh/.test(ua) && 'ontouchend' in document)) {
    this.device = 'ipad';
    var el = document.getElementById('device-sel');
    if (el) el.style.display = 'flex';
    animLogo('dcan');
  } else if (/iPhone/.test(ua)) {
    this.device = 'iphone';
    var el2 = document.getElementById('device-sel');
    if (el2) el2.style.display = 'flex';
    animLogo('dcan');
  } else {
    DeviceModels.apply('mac');
    this._applyLayout('mac');
    this._hide();
  }
};

// ── ORIENTATION MANAGER ──────────────────────────────────────────
var OrientMgr = {
  current: 'portrait',
  init: function() {
    var self = this;
    window.addEventListener('orientationchange', function() {
      setTimeout(function() { self._update(); }, 300);
    });
    window.addEventListener('resize', function() { self._update(); }, {passive:true});
    this._update();
  },
  _update: function() {
    var isL = window.innerWidth > window.innerHeight;
    this.current = isL ? 'landscape' : 'portrait';
    document.body.setAttribute('data-orient', this.current);
    var btn = document.getElementById('orient-btn');
    if (btn) btn.textContent = isL ? '⟲' : '⟳';
  },
  toggle: function() {
    if (screen.orientation && screen.orientation.lock) {
      var t = this.current === 'portrait' ? 'landscape' : 'portrait';
      screen.orientation.lock(t).catch(function() { toast('Rotate your device to switch'); });
    } else {
      toast('Rotate your device to switch');
    }
    Snd.click(); Hap.l();
  }
};

// ── AI BOT SYSTEM ────────────────────────────────────────────────
var Bot = {
  names: ['🤖 ARIA','🔥 BLAZE','🌊 WAVE','⚡ ZEUS','🎭 ECHO','👾 GLITCH','🌙 LUNA','🐺 WOLF'],
  difficulties: {easy:0.3, normal:0.6, hard:0.9},
  
  createPlayer: function(name, diff) {
    var n = name || this.names[Math.floor(Math.random()*this.names.length)];
    return {
      id: 'bot_' + Date.now(),
      name: n,
      av: n.split(' ')[0],
      col: PCBrand.h_888,
      local: false,
      isBot: true,
      difficulty: diff || 'normal',
      skill: this.difficulties[diff || 'normal']
    };
  },
  
  supports: function(gameId) {
    return BOT_BOARD_GAMES.indexOf(gameId) > -1 || BOT_FILL_GAMES.indexOf(gameId) > -1;
  },
  fillTo: function(target, diff) {
    var out = [];
    for (var i = 0; i < target; i++) {
      if (i === 0) {
        out.push({id:'p1',name:S.prof.name||'Player 1',av:S.prof.av||'😎',col:PCBrand.h_64d2ff,local:true});
      } else {
        var b = this.createPlayer(null, diff || (typeof Difficulty !== 'undefined' ? Difficulty.current : 'normal'));
        b.id = 'p' + (i + 1);
        out.push(b);
      }
    }
    return out;
  },
  vote: function(players, suspect) {
    var pool = players.filter(function(p){return !p.elim && p.id;});
    if (!pool.length) pool = players.slice();
    if (suspect && Math.random() < 0.55) {
      var sus = pool.filter(function(p){return (p.sus||0) > 0;});
      if (sus.length) return sus.sort(function(a,b){return (b.sus||0)-(a.sus||0);})[0];
    }
    var humans = pool.filter(function(p){return !p.isBot;});
    var pickFrom = humans.length ? humans : pool;
    return pickFrom[Math.floor(Math.random()*pickFrom.length)];
  },
  pickRandom: function(items) {
    if (!items || !items.length) return null;
    return items[Math.floor(Math.random()*items.length)];
  },
  autoAct: function(game, player, choices, cb) {
    if (!player || !player.isBot) return;
    var delay = 500 + Math.floor(Math.random()*700);
    setTimeout(function() {
      if (!S.game || S.game.id !== game.id) return;
      var pick = Bot.pickRandom(choices);
      if (pick && cb) cb(pick);
    }, delay);
  },
  
  // Bot chess move (random legal move)
  chessMove: function(board, color) {
    var moves = [];
    for (var r=0;r<8;r++) {
      for (var c=0;c<8;c++) {
        if (board[r][c] && board[r][c][0]===color) {
          var vm = ChessGame._validMoves(board,r,c);
          vm.forEach(function(m){moves.push({from:[r,c],to:m});});
        }
      }
    }
    if (!moves.length) return null;
    return moves[Math.floor(Math.random()*moves.length)];
  },
  
  // Bot draughts move
  draughtsMove: function(board, color) {
    var moves = [];
    for (var r=0;r<8;r++) {
      for (var c=0;c<8;c++) {
        if (board[r][c] && board[r][c].col===color) {
          var m = Draughts._getMoves(board,r,c);
          var all = m.jumps.concat(m.moves);
          all.forEach(function(mv){moves.push({r:r,c:c,move:mv});});
        }
      }
    }
    if (!moves.length) return null;
    return moves[Math.floor(Math.random()*moves.length)];
  },
  
  // Bot connect four - tries to block/win
  c4Move: function(board, myMark, oppMark) {
    // Try to win first
    for (var c=0;c<7;c++) {
      var testBoard = board.map(function(r){return r.slice();});
      var row = ConnectFour._drop(testBoard, c, myMark);
      if (row >= 0 && ConnectFour._check(testBoard, row, c)) return c;
    }
    // Block opponent
    for (var c2=0;c2<7;c2++) {
      var testBoard2 = board.map(function(r){return r.slice();});
      var row2 = ConnectFour._drop(testBoard2, c2, oppMark);
      if (row2 >= 0 && ConnectFour._check(testBoard2, row2, c2)) return c2;
    }
    // Random
    var valid = [];
    for (var c3=0;c3<7;c3++) { if (board[0][c3]===null) valid.push(c3); }
    return valid[Math.floor(Math.random()*valid.length)];
  },
  
  // Bot tic-tac-toe
  tttMove: function(board, myMark, oppMark) {
    var lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    // Win
    for (var i=0;i<lines.length;i++) {
      var l=lines[i], vals=l.map(function(x){return board[x];});
      if (vals.filter(function(v){return v===myMark;}).length===2&&vals.includes(null))
        return l[vals.indexOf(null)];
    }
    // Block
    for (var i2=0;i2<lines.length;i2++) {
      var l2=lines[i2], vals2=l2.map(function(x){return board[x];});
      if (vals2.filter(function(v){return v===oppMark;}).length===2&&vals2.includes(null))
        return l2[vals2.indexOf(null)];
    }
    // Center, then corners, then random
    if (!board[4]) return 4;
    var corners=[0,2,6,8];
    for (var ci=0;ci<corners.length;ci++) { if (!board[corners[ci]]) return corners[ci]; }
    var empty=[]; board.forEach(function(v,i){if(!v)empty.push(i);});
    return empty[Math.floor(Math.random()*empty.length)];
  }
};

// Enhance TicTacToe with bot support (game lives in js/games/example-game.js)
window._patchTTTBot = function() {
  var TicTacToe = Reg.get('ttt');
  if (!TicTacToe || TicTacToe._botPatched) return;
  TicTacToe._botPatched = true;
  TicTacToe._botTurn = function() {
    var gs = this.gs, self = this;
    var marks = ['X','O'];
    var curMark = marks[gs.turn];
    var oppMark = marks[1-gs.turn];
    var curPlayer = gs.players[gs.turn];
    if (!curPlayer.isBot) return;
    setTimeout(function() {
      if (self._check(gs.board)) return;
      var move = Bot.tttMove(gs.board, curMark, oppMark);
      if (move === undefined || move === null) return;
      gs.board[move] = curMark;
      Snd.click(); Hap.l();
      var result = self._check(gs.board);
      if (result) {
        if (!result.draw) { self.done(curPlayer.name); Snd.ok(); Hap.ok(); }
        else { self.done(null); }
      } else { gs.turn = 1-gs.turn; }
      Nav.go('game'); self.render();
    }, 600);
  };
  var _origTTTRender = TicTacToe.render.bind(TicTacToe);
  TicTacToe.render = function() {
    _origTTTRender();
    var gs = this.gs;
    if (gs && !this._check(gs.board) && gs.players && gs.players[gs.turn] && gs.players[gs.turn].isBot) {
      this._botTurn();
    }
  };
};

// Enhance ConnectFour with bot
ConnectFour._botTurn = function() {
  var gs = this.gs, self = this;
  var marks=['A','B'];
  var curMark=marks[gs.turn], oppMark=marks[1-gs.turn];
  if (!gs.players[gs.turn] || !gs.players[gs.turn].isBot) return;
  setTimeout(function() {
    var col = Bot.c4Move(gs.board, curMark, oppMark);
    if (col === null || col === undefined) return;
    var row = ConnectFour._drop(gs.board, col, curMark);
    if (row < 0) return;
    Snd.click(); Hap.l();
    if (ConnectFour._check(gs.board, row, col)) {
      self.done(gs.players[gs.turn].name);
      Nav.go('game');
      self.showWin(gs.players[gs.turn].name, [{n:gs.players[gs.turn].name,s:'4 in a row!'},{n:gs.players[1-gs.turn].name,s:'Defeated'}]);
      return;
    }
    gs.turn = 1-gs.turn;
    Nav.go('game'); self.render();
  }, 700);
};
var _origC4Render = ConnectFour.render.bind(ConnectFour);
ConnectFour.render = function() {
  _origC4Render();
  var gs = this.gs;
  if (gs && gs.players && gs.players[gs.turn] && gs.players[gs.turn].isBot) {
    this._botTurn();
  }
};

// Enhance Chess with bot
ChessGame._botTurn = function() {
  var gs = this.gs, self = this;
  var curCol = gs.turn===0?'w':'b';
  if (!gs.players[gs.turn] || !gs.players[gs.turn].isBot) return;
  setTimeout(function() {
    var move = Bot.chessMove(gs.board, curCol);
    if (!move) { self.done(gs.players[1-gs.turn].name); self.showWin(gs.players[1-gs.turn].name); return; }
    var from=move.from, to=move.to;
    var captured=gs.board[to[0]][to[1]];
    if(captured){if(captured[0]==='w')gs.captured.w.push(ChessGame._pieces[captured]);else gs.captured.b.push(ChessGame._pieces[captured]);}
    gs.board[to[0]][to[1]]=gs.board[from[0]][from[1]];
    gs.board[from[0]][from[1]]=null;
    if(gs.board[to[0]][to[1]]==='wP'&&to[0]===0)gs.board[to[0]][to[1]]='wQ';
    if(gs.board[to[0]][to[1]]==='bP'&&to[0]===7)gs.board[to[0]][to[1]]='bQ';
    gs.turn=1-gs.turn;
    Snd.click(); Hap.l();
    Nav.go('game'); self.render();
  }, 800);
};
var _origChessRender = ChessGame.render.bind(ChessGame);
ChessGame.render = function() {
  _origChessRender();
  if (this.gs && this.gs.players && this.gs.players[this.gs.turn] && this.gs.players[this.gs.turn].isBot) {
    this._botTurn();
  }
};

// ── EXPANDED THEME SYSTEM with Girly + Colorful themes ───────────
Theme.list = [
  {id:'',        nm:'Minimal',       i:'⬛', bg:[PCBrand.h_000,PCBrand.h_111], acc:PCBrand.h_fff},
  {id:'t-pink',  nm:'Cotton Candy',  i:'🩷', bg:[PCBrand.h_1a0012,PCBrand.h_2d0020], acc:PCBrand.h_ff69b4, girl:true},
  {id:'t-purple',nm:'Lavender',      i:'💜', bg:[PCBrand.h_0d0018,PCBrand.h_1a002e], acc:PCBrand.h_bf5af2, girl:true},
  {id:'t-rose',  nm:'Rose Gold',     i:'🌹', bg:[PCBrand.h_1a0808,PCBrand.h_2d1515], acc:PCBrand.h_ffb6c1, girl:true},
  {id:'t-uni',   nm:'Unicorn',       i:'🦄', bg:[PCBrand.h_0d0020,PCBrand.h_001a0d], acc:PCBrand.h_ff85d3, girl:true},
  {id:'t-cyber', nm:'Cyberpunk',     i:'🟢', bg:[PCBrand.h_001a0e,PCBrand.h_003320], acc:PCBrand.h_00ff88, req:'theme_cyber'},
  {id:'t-neon',  nm:'Neon',          i:'🟣', bg:[PCBrand.h_0d001a,PCBrand.h_1a0033], acc:PCBrand.h_ff00ff},
  {id:'t-term',  nm:'Terminal',      i:'💻', bg:[PCBrand.h_000500,PCBrand.h_001400], acc:PCBrand.h_00ff00},
  {id:'t-horror',nm:'Horror',        i:'🔴', bg:[PCBrand.h_050000,PCBrand.h_200000], acc:PCBrand.h_ff0000, req:'theme_horror'},
  {id:'t-space', nm:'Deep Space',    i:'🔵', bg:[PCBrand.h_00000d,PCBrand.h_00001a], acc:PCBrand.h_4488ff},
  {id:'t-gold',  nm:'Gold',          i:'🟡', bg:[PCBrand.h_0a0800,PCBrand.h_1a1400], acc:PCBrand.h_ffd700, req:'theme_gold'},
  {id:'t-synth', nm:'Synthwave',     i:'🩷', bg:[PCBrand.h_0d0010,PCBrand.h_1a0020], acc:PCBrand.h_ff6ec7, req:'theme_synth'},
  {id:'t-mid',   nm:'Midnight',      i:'🔮', bg:[PCBrand.h_05050f,PCBrand.h_0a0a1e], acc:PCBrand.h_8888ff},
  {id:'t-red',   nm:'Red Alert',     i:'🚨', bg:[PCBrand.h_0f0000,PCBrand.h_1f0000], acc:PCBrand.h_ff2d55},
  {id:'t-galaxy',nm:'Galaxy',        i:'🌌', bg:[PCBrand.h_000010,PCBrand.h_00002a], acc:PCBrand.h_7b68ee},
  {id:'t-sunset',nm:'Sunset',        i:'🌅', bg:[PCBrand.h_1a0800,PCBrand.h_2a1000], acc:PCBrand.h_ff8c00, girl:true},
  {id:'t-mint',  nm:'Mint',          i:'🌿', bg:[PCBrand.h_001a10,PCBrand.h_002a18], acc:PCBrand.h_98ff98, girl:true},
  {id:'t-glitch',nm:'GLITCH',        i:'👾', bg:[PCBrand.h_000,PCBrand.h_001a1a], acc:PCBrand.h_00ffff, req:'theme_glitch', legendary:true}
];

// Add theme CSS for new themes
var newThemeCSS = `
body.t-pink{--acc:'+PCBrand.h_ff69b4+';--glow:rgba(255,105,180,.28)}
body.t-purple{--acc:'+PCBrand.h_bf5af2+';--glow:rgba(191,90,242,.28)}
body.t-rose{--acc:'+PCBrand.h_ffb6c1+';--glow:rgba(255,182,193,.28)}
body.t-uni{--acc:'+PCBrand.h_ff85d3+';--glow:rgba(255,133,211,.28)}
body.t-galaxy{--acc:'+PCBrand.h_7b68ee+';--glow:rgba(123,104,238,.28)}
body.t-sunset{--acc:'+PCBrand.h_ff8c00+';--glow:rgba(255,140,0,.28)}
body.t-mint{--acc:'+PCBrand.h_98ff98+';--glow:rgba(152,255,152,.28)}
body.t-pink #bg,body.t-rose #bg,body.t-uni #bg{filter:hue-rotate(300deg)}
body.t-galaxy #bg{filter:hue-rotate(200deg)}
`;
var styleTag = document.createElement('style');
styleTag.textContent = newThemeCSS;
document.head.appendChild(styleTag);

// Theme build override to show girl-recommended themes
var _origThemeBuild = Theme.build.bind(Theme);
Theme.build = function(el) {
  if (!el) return;
  el.innerHTML = '';
  var self = this;
  var gender = S.prof.gender || 'skip';
  this.list.forEach(function(th) {
    var locked = th.req && !Meta.isUnlocked(th.req);
    var d = document.createElement('div');
    d.className = 'ttile' + (S.cfg.theme===th.id?' act':'') + (locked?' locked-tile':'');
    d.style.background = 'linear-gradient(135deg,' + th.bg[0] + ',' + th.bg[1] + ')';
    d.style.opacity = locked ? '0.38' : '1';
    var isRecommended = (gender==='girl'||gender==='other') && th.girl;
    d.innerHTML = '<div style="height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:8px 9px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px">' +
        '<div class="ttile-icon">' + (locked?'🔒':th.i) + '</div>' +
        (isRecommended?'<div style="font-size:.48rem;background:rgba(255,182,193,.3);border-radius:4px;padding:1px 5px;color:'+PCBrand.h_ffb6c1+';font-weight:700;white-space:nowrap">✨</div>':'') +
      '</div>' +
      '<div class="ttile-name">' + (th.legendary?'★ ':'') + th.nm + '</div>' +
      '</div>';
    d.onclick = function() {
      if (locked) { toast('🔒 Unlock via XP'); return; }
      self.apply(th.id);
      el.querySelectorAll('.ttile').forEach(function(x){x.classList.remove('act');});
      d.classList.add('act');
      Hap.m(); toast('Theme: ' + th.nm);
    };
    el.appendChild(d);
  });
};

// ── GENDER-AWARE WELCOME COMPLETION ──────────────────────────────
W.setGender = function(g, el) {
  S.prof.gender = g;
  document.querySelectorAll('#ws2 .pchip').forEach(function(e){ e.classList.remove('on'); });
  if (el) el.classList.add('on');
  Hap.l();
};

// Patch W.next to handle new steps
var _origWNext = W.next.bind(W);
W.next = function() {
  if (this._step===1) {
    var nm=(document.getElementById('wname').value||'').trim();
    if(!nm){toast('Enter your name! ✨');return;}
    S.prof.name=nm;
  }
  var maxStep = 4;
  if (this._step>=maxStep) { this._scan(); return; }
  // Handle renamed step IDs
  var nextStep = this._step + 1;
  // Step 4 is ws4r (renamed from ws4 to avoid conflict with scan)
  document.querySelectorAll('.wstep').forEach(function(s){s.classList.remove('active');});
  var el = document.getElementById('ws'+nextStep) || document.getElementById('ws'+nextStep+'r');
  if (el) el.classList.add('active');
  this._step = nextStep;
  var dots=document.querySelectorAll('.wprogdot');
  dots.forEach(function(d,i){d.className='wprogdot'+(i<nextStep?' on':'');});
  Snd.click();
};

// Override W._goStep for new step count
W._goStep = function(n) {
  document.querySelectorAll('.wstep').forEach(function(s){s.classList.remove('active');});
  var el = document.getElementById('ws'+n) || document.getElementById('ws'+n+'r');
  if (el) el.classList.add('active');
  this._step = n;
  var dots=document.querySelectorAll('.wprogdot');
  dots.forEach(function(d,i){d.className='wprogdot'+(i<n?' on':'');});
  Snd.click();
};

// Update scan step to use ws5
W._scan = function() {
  var self=this;
  this._goStep(5);
  var msgs=['Analyzing playstyle...','Building operator profile...','Calibrating betrayal index...','Selecting themes for you...','⚡ Profile ready!'];
  var bar=document.getElementById('wscan-bar');
  var msg=document.getElementById('wscan-msg');
  var icon=document.getElementById('wscan-icon');
  var result=document.getElementById('wscan-result');
  var gender=S.prof.gender||'skip';
  var prs=Persona.types[{deception:'deceptive',strategy:'strategic',reflex:'aggressive',chaos:'chaotic',party:'survivor',creative:'survivor'}[self._style||'chaos']||'survivor'];
  // Suggest theme based on gender
  var suggestedTheme = gender==='girl'||gender==='other' ? 't-pink' : '';
  var i=0;
  var iv=setInterval(function(){
    if(msg)msg.textContent=msgs[i]||'';
    if(bar)bar.style.width=((i+1)/msgs.length*100)+'%';
    i++;
    if(i>=msgs.length){
      clearInterval(iv);
      if(icon)icon.textContent=prs?prs.icon:'🔰';
      if(result){
        result.style.opacity='1';
        result.innerHTML='<div style="font-size:1.2rem;font-weight:800;margin-bottom:4px">'+(prs?prs.label:'Operative')+'</div>' +
          (suggestedTheme?'<div style="font-size:.78rem;color:'+PCBrand.h_ffb6c1+';margin-bottom:10px">✨ Pink theme pre-selected for you!</div>':'') +
          '<div style="opacity:.38;font-size:.75rem;margin-bottom:16px">Starting rank: Rookie</div>' +
          '<button type="button" class="btn bw bf" style="max-width:240px" onclick="W.showGamePicker()">Pick your first game →</button>';
      }
      // Pre-apply suggested theme
      if(suggestedTheme){Theme.apply(suggestedTheme);}
      Hap.ok();
    }
  },400);
};

W.suggestGames = function() {
  var style = S.prof.style || this._style || 'chaos';
  var typeMap = {
    deception: ['deduction', 'bluffing'],
    strategy: ['strategy'],
    reflex: ['reflex'],
    chaos: ['party', 'survival'],
    party: ['party'],
    creative: ['puzzle', 'memory']
  };
  var types = typeMap[style] || ['party'];
  var picks = Reg.list.filter(function(g) { return types.indexOf(g.type) >= 0; });
  if (picks.length < 3) {
    var seen = {};
    picks.forEach(function(g) { seen[g.id] = 1; });
    Reg.list.forEach(function(g) {
      if (!seen[g.id] && picks.length < 6) { picks.push(g); seen[g.id] = 1; }
    });
  }
  return picks.slice(0, 6);
};

W.renderGamePicker = function() {
  var grid = document.getElementById('wgame-grid');
  if (!grid) return;
  var games = this.suggestGames();
  grid.innerHTML = games.map(function(g) {
    return '<div class="lcard" style="background:' + g.col + '12;border:1px solid ' + g.col + '28;cursor:pointer;padding:10px" onclick="W.pickFirstGame(\'' + g.id + '\')">' +
      '<div style="font-size:1.5rem;margin-bottom:4px">' + g.icon + '</div>' +
      '<div style="font-size:.78rem;font-weight:800;line-height:1.2">' + g.title + '</div>' +
      '<div style="font-size:.5rem;opacity:.4;margin-top:2px;text-transform:uppercase;letter-spacing:.06em">' + g.type + '</div></div>';
  }).join('');
};

W.showGamePicker = function() {
  this.renderGamePicker();
  this._goStep(6);
};

W.pickFirstGame = function(id) {
  this.finish();
  setTimeout(function() { if (typeof GL !== 'undefined' && GL.launch) GL.launch(id); }, 480);
};

W.skipGamePicker = function() {
  this.finish();
  setTimeout(function() { Nav.go('library'); }, 300);
};

// ── GAME SEARCH ──────────────────────────────────────────────────
GL.search = function(query) {
  var q = query.toLowerCase().trim();
  if (!q) { this._buildLib('all'); return; }
  var results = Reg.list.filter(function(g) {
    return g.title.toLowerCase().includes(q) ||
           g.type.toLowerCase().includes(q) ||
           g.desc.toLowerCase().includes(q) ||
           (g.cat&&g.cat.toLowerCase().includes(q));
  });
  var grid = document.getElementById('lib');
  if (!grid) return;
  var lc = document.getElementById('lib-count');
  if (lc) lc.textContent = results.length + ' results';
  if (!results.length) {
    grid.innerHTML = '<div style="text-align:center;padding:30px;opacity:.3;font-size:.9rem;grid-column:1/-1">No games found for "' + query + '"</div>';
    return;
  }
  grid.innerHTML = results.map(function(g){
    return '<div class="lcard" style="background:'+g.col+'12;border:1px solid '+g.col+'28" onclick="GL.launch(\''+g.id+'\')"><div><div style="font-size:1.8rem;margin-bottom:5px">'+g.icon+'</div><div style="font-size:.88rem;font-weight:800;line-height:1.2">'+g.title+'</div><div style="font-size:.56rem;opacity:.4;margin-top:2px;text-transform:uppercase;letter-spacing:.07em">'+g.type+'</div></div><div><div style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.07);border-radius:100px;padding:3px 8px;font-size:.58rem;font-weight:700;margin-top:5px">'+(g.mp?'👥 '+g.min+'-'+g.max+'p':'🎮 Solo')+'</div></div></div>';
  }).join('');
};

// ── HIGH SCORES / RECORDS SYSTEM ─────────────────────────────────
var Records = {
  _k: 'po5_records',
  data: {},
  load: function() {
    try { this.data = JSON.parse(localStorage.getItem(this._k)||'{}'); } catch(e) {}
  },
  save: function() {
    try { localStorage.setItem(this._k, JSON.stringify(this.data)); } catch(e) {}
  },
  update: function(gameId, score, meta) {
    if (!this.data[gameId] || score > this.data[gameId].score) {
      var isNew = !!this.data[gameId];
      this.data[gameId] = {score:score, ts:Date.now(), meta:meta||{}};
      this.save();
      if (isNew) { toast('🏆 NEW RECORD! ' + score + ' pts'); Snd.lvlup(); Hap.ok(); }
      return true;
    }
    return false;
  },
  get: function(gameId) { return this.data[gameId] || null; },
  getAll: function() { return this.data; },
  buildTable: function(el) {
    if (!el) return;
    var entries = Object.entries(this.data);
    if (!entries.length) { el.innerHTML='<div style="opacity:.25;text-align:center;padding:20px;font-size:.84rem">No records yet! Play some games 🎮</div>'; return; }
    el.innerHTML = entries.sort(function(a,b){return b[1].score-a[1].score;}).slice(0,15).map(function(e,i){
      var g = Reg.get(e[0]);
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">' +
        '<div style="width:22px;text-align:center;font-size:.75rem;font-weight:800;color:' + (i===0?'var(--amber)':i===1?'var(--dim)':i===2?PCBrand.h_cd7f32:'var(--dim)') + '">' + (i<3?['🥇','🥈','🥉'][i]:i+1) + '</div>' +
        '<div style="font-size:1.2rem">' + (g?g.icon:'🎮') + '</div>' +
        '<div style="flex:1"><div style="font-weight:700;font-size:.82rem">' + (g?g.title:e[0]) + '</div></div>' +
        '<div style="font-size:1rem;font-weight:800;color:var(--amber)">' + e[1].score + '</div>' +
      '</div>';
    }).join('');
  }
};

// Hook Records into game done
var _origGameDone = Game.prototype.done;
Game.prototype.done = function(winner) {
  _origGameDone.call(this, winner);
  // Record high scores for solo games
  if (!this.mp && this.gs) {
    var sc = this.gs.sc || this.gs.score || 0;
    if (sc > 0) Records.update(this.id, sc, {lvl:this.gs.lvl||1});
  }
};

// ── HIGH SCORES IN DASHBOARD ──────────────────────────────────────
var _origUIDash = UI.dash.bind(UI);
UI.dash = function() {
  _origUIDash();
  // Build records table
  var rl = document.getElementById('records-list');
  if (rl) Records.buildTable(rl);
};

// ── PROGRESS BAR SYSTEM ───────────────────────────────────────────
var ProgressBar = {
  set: function(pct, col) {
    var fill = document.getElementById('game-progress-fill');
    if (!fill) return;
    fill.style.width = Math.min(100,Math.max(0,pct))+'%';
    fill.style.background = col||'var(--acc)';
    fill.style.boxShadow = '0 0 8px '+(col||'var(--acc)');
  },
  clear: function() { var f=document.getElementById('game-progress-fill');if(f){f.style.width='0%';} }
};

// ── ACHIEVEMENT POPUP ─────────────────────────────────────────────
var AchPopup = {
  _t: null,
  show: function(icon, title, xp) {
    var el = document.getElementById('ach-popup');
    if (!el) { toast('🏆 '+title+'! +'+xp+' XP'); return; }
    el.innerHTML = '<div style="font-size:1.8rem">'+icon+'</div><div style="flex:1"><div style="font-weight:800;font-size:.88rem">'+title+'</div><div style="font-size:.68rem;opacity:.5;margin-top:1px">Achievement unlocked! 🎉</div></div><div style="color:var(--amber);font-weight:800;font-size:.85rem">+'+xp+'</div>';
    el.classList.add('show');
    clearTimeout(this._t);
    Snd.lvlup(); Hap.ok();
    this._t = setTimeout(function(){var e2=document.getElementById('ach-popup');if(e2)e2.classList.remove('show');},3200);
  }
};
// Ach.unlock patched below

// ── BOT SETUP IN GAME LAUNCHER (solo → large groups) ───────────────
var _origGLsetup = GL._setup.bind(GL);
GL._setup = function(game) {
  var self = this;
  var avs = ['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀','🎭','🔥'];
  var cols = [PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a,PCBrand.h_64d2ff,PCBrand.h_ff375f];
  var pc = game.min;
  var players = Array.from({length: pc}, function(_, i) {
    return {id:'p'+(i+1), name:i===0?(S.prof.name||'Player 1'):'Player '+(i+1), av:avs[i%avs.length], col:cols[i%cols.length], local:i===0};
  });
  var supportsBots = Bot.supports(game.id);

  function syncPlayers() {
    while (players.length < pc) {
      var n = players.length + 1;
      players.push({id:'p'+n, name:'Player '+n, av:avs[(n-1)%avs.length], col:cols[(n-1)%cols.length], local:false});
    }
    if (players.length > pc) players.length = pc;
    players.forEach(function(p, j) { p.id = 'p' + (j + 1); });
  }

  var render = function() {
    syncPlayers();
    var presets = [
      {n:1, label:'Solo', show: game.min <= 1},
      {n:2, label:'Duo', show: game.min <= 2 && game.max >= 2},
      {n:4, label:'Party 4', show: game.max >= 4},
      {n:6, label:'Party 6', show: game.max >= 6},
      {n:10, label:'Full 10', show: game.max >= 10},
      {n:game.max, label:'Max '+game.max, show: game.max > 2}
    ].filter(function(p, i, arr) {
      return p.show && p.n >= game.min && p.n <= game.max && arr.findIndex(function(x){return x.n===p.n;}) === i;
    });

    Modal.open(
      '<div>' +
      '<div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">' +
        '<div style="font-size:2rem">'+game.icon+'</div>' +
        '<div><div style="font-size:1rem;font-weight:800">'+game.title+'</div><div style="font-size:.73rem;opacity:.38">'+game.desc+'</div></div>' +
      '</div>' +
      (supportsBots ?
        '<div onclick="Difficulty.pick(function(){Modal.close();setTimeout(render,280);})" style="padding:10px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;margin-bottom:12px;display:flex;align-items:center;gap:9px;cursor:pointer">' +
          '<span style="font-size:1.2rem">'+Difficulty.get().icon+'</span>' +
          '<div style="flex:1"><div style="font-size:.8rem;font-weight:700">'+Difficulty.get().label+'</div><div style="font-size:.65rem;opacity:.38">'+Difficulty.get().desc+'</div></div>' +
          '<div style="font-size:.68rem;opacity:.4">Change ›</div>' +
        '</div>' : '') +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<div style="font-size:.6rem;opacity:.32;letter-spacing:.09em;text-transform:uppercase">Players</div>' +
        '<div style="font-size:.62rem;opacity:.35">'+game.min+'–'+game.max+' allowed</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px">' +
        '<button type="button" class="btn bg bsm" style="width:36px;padding:8px 0" onclick="window._dec()"'+(pc<=game.min?' disabled style="opacity:.35"':'')+'>−</button>' +
        '<div style="flex:1;text-align:center"><div style="font-size:1.4rem;font-weight:800">'+pc+'</div><div style="font-size:.58rem;opacity:.35">of '+game.max+'</div></div>' +
        '<button type="button" class="btn bg bsm" style="width:36px;padding:8px 0" onclick="window._inc()"'+(pc>=game.max?' disabled style="opacity:.35"':'')+'>+</button>' +
      '</div>' +
      (presets.length ?
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+presets.map(function(p){
          return '<button type="button" class="btn bg bsm" style="padding:6px 10px;font-size:.72rem'+(pc===p.n?';border-color:var(--cyan)':'')+'" onclick="window._preset('+p.n+')">'+p.label+'</button>';
        }).join('')+'</div>' : '') +
      '<div id="_pl">'+players.map(function(p,i){
        return '<div class="pchip" style="align-items:center"><div style="width:30px;height:30px;border-radius:50%;background:'+p.col+'1c;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">'+(p.isBot?'🤖':p.av)+'</div>' +
          (p.isBot ?
            '<div style="flex:1;font-size:.84rem;font-weight:600;opacity:.7">'+p.name+'</div><div onclick="window._rp('+i+')" style="opacity:.4;cursor:pointer;padding:4px">✕</div>' :
            '<input class="pinp" placeholder="Player '+(i+1)+'" value="'+p.name+'" onchange="window._pn('+i+',this.value)" oninput="window._pn('+i+',this.value)">'+(i>0?'<div onclick="window._rp('+i+')" style="opacity:.22;cursor:pointer;padding:4px">✕</div>':'')+''
          )+'</div>';
      }).join('')+'</div>' +
      '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:6px">' +
        (pc<game.max?'<button type="button" class="btn bg" style="flex:1;font-size:.8rem;padding:10px" onclick="window._ap()">+ Human</button>':'') +
        (supportsBots&&pc<game.max?'<button type="button" class="btn bg" style="flex:1;font-size:.8rem;padding:10px" onclick="window._ab()">🤖 Add Bot</button>':'') +
        (supportsBots&&pc<game.max?'<button type="button" class="btn bg" style="flex:1;font-size:.8rem;padding:10px" onclick="window._fill()">🤖 Fill Bots</button>':'') +
      '</div>' +
      (Mutators.active.length?'<div style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0">'+Mutators.active.map(function(m){return'<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:2px 8px;font-size:.62rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('')+'</div>':'') +
      '<div style="display:flex;gap:7px;margin-top:10px">' +
        '<button type="button" class="btn bg" style="padding:11px 14px" onclick="window._smut()">⚙️</button>' +
        '<button type="button" class="btn bg" style="padding:11px 14px" onclick="Modal.close();setTimeout(function(){Tutorial.show(game,function(){Modal.close();setTimeout(render,280);});},280)">📖</button>' +
        '<button type="button" class="btn bw" style="flex:1" onclick="window._sg()">▶ Start ('+pc+'p)</button>' +
      '</div></div>'
    );
    window._pn = function(i,v){players[i].name=v||'Player '+(i+1);};
    window._inc = function(){if(pc>=game.max)return;pc++;render();};
    window._dec = function(){if(pc<=game.min)return;pc--;render();};
    window._preset = function(n){pc=Math.max(game.min,Math.min(game.max,n));render();};
    window._ap = function(){if(pc>=game.max)return;pc++;render();};
    window._ab = function(){if(pc>=game.max)return;pc++;var b=Bot.createPlayer(null,Difficulty.current);b.id='p'+pc;players[pc-1]=b;render();};
    window._fill = function(){
      var diff = typeof Difficulty !== 'undefined' ? Difficulty.current : 'normal';
      players = Bot.fillTo(pc, diff);
      render();
    };
    window._rp = function(i){if(pc<=game.min){toast('Min '+game.min+' players');return;}players.splice(i,1);pc--;render();};
    window._sg = function(){Modal.close();setTimeout(function(){Tutorial.show(game,function(){Cinematic.show(game,players,function(){self._start(game,players);});});},270);};
    window._smut = function(){Modal.close();setTimeout(function(){Mutators.showPicker(function(){render();});},270);};
  };
  render();
};

// ── SOLO GAME LAUNCHER with difficulty + bot context ─────────────
var _origGLlaunch = GL.launch.bind(GL);
GL.launch = function(id) {
  var game=Reg.get(id);
  if(!game){toast('Game not found');return;}
  Snd.click();Hap.m();
  if(game.mp){this._setup(game);return;}
  var self=this;
  var players=[{id:'p1',name:S.prof.name||'Player',av:S.prof.av||'🎮',col:PCBrand.h_64d2ff,local:true}];
  var rec=Records.get(id);
  Modal.open(
    '<div>' +
    '<div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">' +
      '<div style="font-size:2.2rem">'+game.icon+'</div>' +
      '<div><div style="font-size:1rem;font-weight:800">'+game.title+'</div><div style="font-size:.73rem;opacity:.38">'+game.desc+'</div></div>' +
    '</div>' +
    (rec?'<div style="padding:10px 12px;background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.2);border-radius:11px;margin-bottom:12px;display:flex;align-items:center;gap:9px"><div style="font-size:1.2rem">🏆</div><div><div style="font-size:.72rem;opacity:.38">Your best</div><div style="font-weight:800;font-size:.88rem;color:var(--amber)">'+rec.score+' pts</div></div></div>':'') +
    '<div onclick="Difficulty.pick(function(){Modal.close();GL.launch(\''+id+'\');})" style="padding:10px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;margin-bottom:12px;display:flex;align-items:center;gap:9px;cursor:pointer">' +
      '<span style="font-size:1.2rem">'+Difficulty.get().icon+'</span>' +
      '<div style="flex:1"><div style="font-size:.8rem;font-weight:700">'+Difficulty.get().label+'</div><div style="font-size:.65rem;opacity:.38">'+Difficulty.get().desc+'</div></div>' +
      '<div style="font-size:.68rem;opacity:.4">Change ›</div>' +
    '</div>' +
    '<div style="display:flex;gap:7px">' +
      '<button type="button" class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="Modal.close();setTimeout(function(){Tutorial.show(game,function(){GL.launch(\''+id+'\');});},280)">📖</button>' +
      '<button type="button" class="btn bw" style="flex:1" onclick="window._ssg()">▶ Play Now!</button>' +
    '</div></div>'
  );
  window._ssg=function(){Modal.close();setTimeout(function(){Tutorial.show(game,function(){Cinematic.show(game,players,function(){self._start(game,players);});});},270);};
};

// ── EXIT GAME CLEANUP (comprehensive) ────────────────────────────
GL.exitGame = function() {
  if(S.game){
    var g=S.game;
    ['_ft','_rt2','_dt','_qi','_rl','_si','_pti','_snki','_ifi','_ck','_wt','_pci','_bd','_bdInt'].forEach(function(k){
      try{clearInterval(g[k]);clearTimeout(g[k]);g[k]=null;}catch(e){}
    });
  }
  Drama.state.tension=0;Drama._updateBanner();
  Mutators.active=[];
  ProgressBar.clear();
  if(typeof releaseWakeLock==='function')releaseWakeLock();
  Bus.emit('game:end',{});
  var nav=document.getElementById('nav');if(nav)nav.className='';
  S.game=null;
  Nav.go('home');
};

// ── HIGH SCORES SECTION IN DASHBOARD ─────────────────────────────
// Inject records section into dashboard HTML after achievements
var dashObserver = new MutationObserver(function() {
  var achl = document.getElementById('achl');
  if (achl && !document.getElementById('records-list')) {
    var recDiv = document.createElement('div');
    recDiv.style.cssText = 'padding:0 15px;margin-top:14px';
    recDiv.innerHTML = '<div class="sec" style="margin-bottom:9px">🏆 High Scores</div><div id="records-list"></div>';
    achl.parentNode.parentNode.appendChild(recDiv);
    dashObserver.disconnect();
  }
});

// UI.home consolidated below

// ── NEW GAMES REGISTRATION ────────────────────────────────────────
// Register v5 games when they exist
function registerV5Games() {
  var v5list = [
    typeof WordAssassin!=='undefined'?WordAssassin:null,
    typeof DeadDrop!=='undefined'?DeadDrop:null,
    typeof BlitzDuel!=='undefined'?BlitzDuel:null,
    typeof PixelPainter!=='undefined'?PixelPainter:null,
    typeof SurvivalArena!=='undefined'?SurvivalArena:null,
    typeof MindMeld!=='undefined'?MindMeld:null
  ].filter(Boolean);
  v5list.forEach(function(g){if(!Reg.get(g.id))Reg.add(g);});
  GL._buildLib('all');
  GL._buildScrolls();
  var lc=document.getElementById('lib-count');
  if(lc)lc.textContent=Reg.list.length+' games · Fully offline';
}

// ── SINGLE INIT (on load) ─────────────────────────────────────────
window.addEventListener('load', function() {
  Records.load();
  OrientMgr.init();
  // Register records in dashboard section
  setTimeout(function(){
    dashObserver.observe(document.body,{childList:true,subtree:true});
    registerV5Games();
    // Apply saved theme
    if(S.cfg.theme)Theme.apply(S.cfg.theme);
    // Gender-aware avatar suggestions
    var gender=S.prof.gender||'skip';
    if(W.init){
      var girlAvs=['🌸','💖','🌺','🦋','🌟','✨','🎀','🩷','🌈','🦄','🌙','💅'];
      var boyAvs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀','🎭','🔥'];
      var allAvs=['😎','🦊','🐺','🦁','🌸','💖','🌺','🦋','🌟','✨','🎀','🩷','🌈','🦄','🤖','💀'];
      W._avList = gender==='girl'?girlAvs:gender==='boy'?boyAvs:allAvs;
    }
  }, 500);

  // Back button via history API
  if(window.history&&window.history.pushState){
    window.history.pushState({page:'prism'},'PrismCap','');
    window.addEventListener('popstate',function(){
      if(S.cur==='game')GL.exitGame();
      else if(document.getElementById('ov')&&document.getElementById('ov').className==='open')Modal.close();
    });
  }

  // Wake lock
  function requestWakeLock(){if('wakeLock' in navigator){navigator.wakeLock.request('screen').then(function(wl){window._wl=wl;}).catch(function(){});}}
  window.requestWakeLock=requestWakeLock;
  window.releaseWakeLock=function(){if(window._wl){window._wl.release().catch(function(){});window._wl=null;}};
});

// ── W.init OVERRIDE for gender-aware avatars ──────────────────────
var _origWInit=W.init.bind(W);
W.init=function(){
  var avs=this._avList||['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🌸','💖','🌺','🦋','🌟','✨','🎀','🩷','🌈','🦄','🤖','💀'];
  var c=document.getElementById('wavs');if(!c)return;
  var self=this;
  c.innerHTML=avs.map(function(a){return'<div onclick="W._selAv(\''+a+'\',this)" style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.07);border:2px solid '+(a===self._av?PCBrand.h_fff:'transparent')+';display:flex;align-items:center;justify-content:center;font-size:1.25rem;cursor:pointer">'+a+'</div>';}).join('');
};




// ═══════════════════════════════════════════════════════════════════
// CLEAN V5 ENHANCEMENTS (single, non-recursive)
// ═══════════════════════════════════════════════════════════════════

// ── CLEAN Nav.go ENHANCEMENT ─────────────────────────────────────
// Patches Nav.go ONCE with progress bar + scroll to top
// Nav.go clean override is in v6 section;

// ── CLEAN UI.home ENHANCEMENT ────────────────────────────────────
// Patches UI.home ONCE with greeting + recommended + badge
(function() {
  var _baseHome = UI.home.bind(UI);
  UI.home = function() {
    _baseHome();
    if (typeof GL !== 'undefined' && GL._buildScrolls) GL._buildScrolls();
    // Greeting
    var h = new Date().getHours();
    var n = S.prof.name || 'Player';
    var g = [
      h<6  ? '🌙 Night owl mode, '+n+'!' :
      h<12 ? '☀️ Morning, '+n+'! Ready to play?' :
      h<18 ? '👋 Hey '+n+'! Back for more?' :
             '🎮 Game night, '+n+'! Let us play!'
    ][0];
    var gr = document.getElementById('home-greeting');
    if (gr) gr.textContent = g;
    // Game count badge
    if (typeof Reg !== 'undefined') {
      var lc = document.getElementById('lib-count');
      if (lc) lc.textContent = Reg.list.length + ' games · Fully offline';
    }
    // Recommended game
    if (typeof buildRecommended === 'function') setTimeout(buildRecommended, 200);
    // Records update
    if (typeof Records !== 'undefined' && typeof Records.load === 'function') Records.load();
    if (window.Rec && typeof Rec.render === 'function') Rec.render();
  };
})();

// ── CLEAN GL.exitGame ─────────────────────────────────────────────
GL.exitGame = function() {
  if (S.game) {
    var g = S.game;
    ['_ft','_rt2','_dt','_qi','_rl','_si','_pti','_snki','_ifi','_ck','_wt','_pci','_bdInt'].forEach(function(k) {
      try { clearInterval(g[k]); clearTimeout(g[k]); g[k] = null; } catch(e) {}
    });
  }
  if (typeof Drama !== 'undefined') { Drama.state.tension = 0; Drama._updateBanner(); }
  if (typeof Mutators !== 'undefined') Mutators.active = [];
  if (typeof ProgressBar !== 'undefined') ProgressBar.clear();
  if (typeof releaseWakeLock === 'function') releaseWakeLock();
  Bus.emit('game:end', {});
  var nav = document.getElementById('nav');
  if (nav) nav.className = '';
  var tb = document.getElementById('tension-bar');
  if (tb) tb.style.display = 'none';
  S.game = null;
  Nav.go('home');
};

// ── CLEAN HIGH SCORES IN DASHBOARD ───────────────────────────────
var _baseUIDash = UI.dash.bind(UI);
UI.dash = function() {
  _baseUIDash();
  var rl = document.getElementById('records-list');
  if (rl && typeof Records !== 'undefined') Records.buildTable(rl);
};

// ── CLEAN GAME START (no auto-suspend) ───────────────────────────
GL._start = function(game, players) {
  S.game = game;
  game.setup(players);
  if (typeof Mutators !== 'undefined') Mutators.apply();
  Nav.go('game');
  var gt = document.getElementById('gtitle');
  if (gt) gt.textContent = game.title;
  var gb = document.getElementById('gbody');
  if (gb) {
    gb.style.setProperty('--acc', game.col);
    gb.style.setProperty('--glow', game.col + '3a');
  }
  // Enable hint button
  var hb = document.getElementById('ghint-btn');
  if (hb) {
    var hasHints = typeof Hints !== 'undefined' && Hints._db && Hints._db[game.id] && Hints._db[game.id].length > 0;
    hb.style.display = hasHints ? 'flex' : 'none';
  }
  game.render();
  Snd.reveal();
  if (typeof requestWakeLock === 'function') requestWakeLock();
  Bus.emit('game:start', {game: game});
  // NO auto-suspend here - removed, it caused game interruptions
};



// ─── V5 FINAL PATCH ───
// ═══════════════════════════════════════════════════════════════════
// V5 FINAL PATCH - Device Models, Clean DevSel, All fixes
// ═══════════════════════════════════════════════════════════════════

// ── COMPREHENSIVE DEVICE MODEL DATABASE ──────────────────────────
var DeviceModels = {
  models: {
    iphone: [
      // iPhone 16 series
      {id:'ip16pm', label:'iPhone 16 Pro Max',   note:'Dynamic Island · 430×932',  sat:59, sab:34, w:430, di:true},
      {id:'ip16p',  label:'iPhone 16 Pro',        note:'Dynamic Island · 393×852',  sat:59, sab:34, w:393, di:true},
      {id:'ip16pm2',label:'iPhone 16 Plus',       note:'Dynamic Island · 430×932',  sat:59, sab:34, w:430, di:true},
      {id:'ip16',   label:'iPhone 16',            note:'Dynamic Island · 390×844',  sat:59, sab:34, w:390, di:true},
      // iPhone 15 series
      {id:'ip15pm', label:'iPhone 15 Pro Max',    note:'Dynamic Island · 430×932',  sat:59, sab:34, w:430, di:true},
      {id:'ip15p',  label:'iPhone 15 Pro',        note:'Dynamic Island · 393×852',  sat:59, sab:34, w:393, di:true},
      {id:'ip15pl', label:'iPhone 15 Plus',       note:'Dynamic Island · 430×932',  sat:59, sab:34, w:430, di:true},
      {id:'ip15',   label:'iPhone 15',            note:'Dynamic Island · 390×844',  sat:59, sab:34, w:390, di:true},
      // iPhone 14 series
      {id:'ip14pm', label:'iPhone 14 Pro Max',    note:'Dynamic Island · 430×932',  sat:59, sab:34, w:430, di:true},
      {id:'ip14p',  label:'iPhone 14 Pro',        note:'Dynamic Island · 393×852',  sat:59, sab:34, w:393, di:true},
      {id:'ip14pl', label:'iPhone 14 Plus',       note:'Notch · 428×926',           sat:47, sab:34, w:428, di:false},
      {id:'ip14',   label:'iPhone 14',            note:'Notch · 390×844',           sat:47, sab:34, w:390, di:false},
      // iPhone 13 series
      {id:'ip13pm', label:'iPhone 13 Pro Max',    note:'Notch · 428×926',           sat:47, sab:34, w:428, di:false},
      {id:'ip13p',  label:'iPhone 13 Pro',        note:'Notch · 390×844',           sat:47, sab:34, w:390, di:false},
      {id:'ip13',   label:'iPhone 13 / mini',     note:'Notch · 390×844',           sat:47, sab:34, w:390, di:false},
      // iPhone 12 series
      {id:'ip12pm', label:'iPhone 12 Pro Max',    note:'Notch · 428×926',           sat:47, sab:34, w:428, di:false},
      {id:'ip12p',  label:'iPhone 12 Pro',        note:'Notch · 390×844',           sat:47, sab:34, w:390, di:false},
      {id:'ip12',   label:'iPhone 12 / mini',     note:'Notch · 390×844',           sat:47, sab:34, w:390, di:false},
      // iPhone 11 / X series
      {id:'ip11pm', label:'iPhone 11 Pro Max',    note:'Notch · 414×896',           sat:44, sab:34, w:414, di:false},
      {id:'ip11p',  label:'iPhone 11 Pro / XS',   note:'Notch · 375×812',           sat:44, sab:34, w:375, di:false},
      {id:'ip11',   label:'iPhone 11 / XR',       note:'Notch · 414×896',           sat:44, sab:34, w:414, di:false},
      {id:'ipxsm',  label:'iPhone XS Max',        note:'Notch · 414×896',           sat:44, sab:34, w:414, di:false},
      {id:'ipxs',   label:'iPhone XS / X',        note:'Notch · 375×812',           sat:44, sab:34, w:375, di:false},
      // Older
      {id:'ipse3',  label:'iPhone SE (3rd/2nd gen)', note:'No notch · 375×667',    sat:20, sab:0,  w:375, di:false},
      {id:'ip8',    label:'iPhone 8 / 7 / 6',     note:'No notch · 375×667',       sat:20, sab:0,  w:375, di:false},
    ],
    ipad: [
      {id:'ipadp13',label:'iPad Pro 13"',         note:'M4 · Face ID · No home btn', sat:24, sab:20, w:1032},
      {id:'ipadp11',label:'iPad Pro 11"',         note:'M4 · Face ID · No home btn', sat:24, sab:20, w:834},
      {id:'ipada5', label:'iPad Air 13" / 11"',   note:'M2 · Touch ID top button',   sat:24, sab:20, w:834},
      {id:'ipadm',  label:'iPad mini 7',          note:'Touch ID · 744×1133',         sat:20, sab:20, w:744},
      {id:'ipad',   label:'iPad (10th gen)',       note:'USB-C · 820×1180',            sat:20, sab:20, w:820},
      {id:'ipad9',  label:'iPad (9th gen)',        note:'Home button · 810×1080',      sat:20, sab:0,  w:810},
    ],
    mac: [
      {id:'macbook',label:'MacBook / Mac',         note:'Full browser experience',     sat:0,  sab:0,  w:1440},
    ]
  },

  apply: function(modelId) {
    var all = this.models.iphone.concat(this.models.ipad).concat(this.models.mac);
    var m = all.find(function(x){return x.id===modelId;});
    if (!m) {
      // Try to find by family prefix
      if (modelId === 'iphone') m = this.models.iphone[0];
      else if (modelId === 'ipad') m = this.models.ipad[0];
      else m = this.models.mac[0];
    }
    if (!m) return;
    // Apply safe areas
    document.documentElement.style.setProperty('--sat', m.sat + 'px');
    document.documentElement.style.setProperty('--sab', m.sab + 'px');
    // Device class
    document.body.removeAttribute('data-device-model');
    document.body.setAttribute('data-device-model', modelId);
    var family = m.w >= 768 ? (m.w >= 1000 ? 'mac' : 'ipad') : 'iphone';
    document.body.setAttribute('data-device', family);
    // Orientation button
    var ob = document.getElementById('orient-btn');
    if (ob) ob.className = family === 'ipad' ? 'show' : '';
    // Dynamic Island class
    if (m.di) {
      document.body.classList.add('has-di');
    } else {
      document.body.classList.remove('has-di');
    }
    return m;
  }
};

// ── DEVICE SELECTION LOGIC ────────────────────────────────────────
// Override DevSel completely
DevSel._models = DeviceModels.models;
DevSel._showModels = function(family) {
  document.getElementById('ds-step1').style.display = 'none';
  document.getElementById('ds-step2').style.display = 'block';
  var titleEl = document.getElementById('ds-model-title');
  if (titleEl) titleEl.textContent = family.charAt(0).toUpperCase() + family.slice(1) + ' Models';
  var modelsEl = document.getElementById('ds-models');
  if (!modelsEl) return;
  var list = this._models[family] || [];
  modelsEl.innerHTML = list.map(function(m) {
    return '<button type="button" onclick="DevSel.pickModel(\'' + m.id + '\')" class="_dbtn" style="padding:12px 14px">' +
      '<div style="flex:1">' +
        '<div style="font-weight:700;font-size:.88rem">' + m.label + '</div>' +
        '<div style="font-size:.65rem;opacity:.4;margin-top:1px">' + m.note + '</div>' +
      '</div>' +
      (m.di ? '<div style="font-size:.55rem;background:rgba(0,212,255,.15);color:var(--cyan);border-radius:100px;padding:2px 7px;font-weight:700;white-space:nowrap">Dynamic Island</div>' : '') +
    '</button>';
  }).join('');
};

DevSel._backToFamily = function() {
  document.getElementById('ds-step2').style.display = 'none';
  document.getElementById('ds-step1').style.display = 'block';
};

DevSel.pickModel = function(modelId) {
  var m = DeviceModels.apply(modelId);
  localStorage.setItem(this._k, modelId);
  var family = document.body.getAttribute('data-device');
  this.device = family;
  this._applyLayout(family);
  this._hide();
  Hap.ok(); Snd.ok();
  toast('✅ Optimized for ' + (m ? m.label : modelId));
};

// Init DevSel properly
var _baseDevSelInit = DevSel.init.bind(DevSel);
DevSel.init = function() {
  var saved = localStorage.getItem(this._k);
  if (saved) {
    DeviceModels.apply(saved);
    var family = document.body.getAttribute('data-device') || 'iphone';
    this.device = family;
    this._applyLayout(family);
    this._hide();
    return;
  }
  // Show picker - try to auto-select family
  var ua = navigator.userAgent;
  if (/iPad/.test(ua) || (window.innerWidth >= 768 && /Macintosh/.test(ua) && 'ontouchend' in document)) {
    // Pre-show iPad models
    setTimeout(function() { DevSel._showModels('ipad'); }, 300);
  } else if (/iPhone/.test(ua)) {
    setTimeout(function() { DevSel._showModels('iphone'); }, 300);
  }
  var el = document.getElementById('device-sel');
  if (el) el.style.display = 'flex';
  animLogo('dcan');
};

// Add "Change Device" to settings
var _origGLtogSet = GL.togSet.bind(GL);
GL.togSet = function(key, el) {
  if (key === 'device') {
    toast('Layout follows your screen size automatically');
    return;
  }
  _origGLtogSet(key, el);
};

// ── PROFILE SCREEN: Add device change button ──────────────────────
setTimeout(function() {
  var settingsDiv = document.querySelector('.glass[style*="border-radius:15px"]');
  if (settingsDiv && !document.getElementById('_devchange')) {
    var row = document.createElement('div');
    row.className = 'srow';
    row.style.borderBottom = '1px solid rgba(255,255,255,.05)';
    row.innerHTML = '<span style="font-size:.84rem;font-weight:600">📱 Change Device Model</span><button type="button" onclick="GL.togSet(\'device\',this)" style="padding:5px 12px;background:rgba(255,255,255,.07);border:1px solid var(--border);border-radius:8px;font-size:.72rem;cursor:pointer">Change</button>';
    settingsDiv.insertBefore(row, settingsDiv.firstChild);
  }
}, 1800);

// ── ORIENTATION MANAGER (clean, no duplicate) ─────────────────────
if (typeof OrientMgr === 'undefined') {
  var OrientMgr = {
    current: 'portrait',
    init: function() {
      var self = this;
      window.addEventListener('orientationchange', function(){setTimeout(function(){self._update();},300);});
      window.addEventListener('resize', function(){self._update();}, {passive:true});
      this._update();
    },
    _update: function() {
      var isL = window.innerWidth > window.innerHeight;
      this.current = isL ? 'landscape' : 'portrait';
      document.body.setAttribute('data-orient', this.current);
      var btn = document.getElementById('orient-btn');
      if (btn) btn.textContent = isL ? '⟲' : '⟳';
    },
    toggle: function() {
      if (screen.orientation && screen.orientation.lock) {
        var t = this.current === 'portrait' ? 'landscape' : 'portrait';
        screen.orientation.lock(t).catch(function(){ toast('Rotate your device to switch'); });
      } else { toast('Rotate your device to switch'); }
      Snd.click(); Hap.l();
    }
  };
}

// ── PROGRESS BAR (clean, no duplicate) ───────────────────────────
if (typeof ProgressBar === 'undefined') {
  var ProgressBar = {
    set: function(pct, col) {
      var f = document.getElementById('game-progress-fill');
      if (!f) return;
      f.style.width = Math.min(100,Math.max(0,pct))+'%';
      f.style.background = col||'var(--acc)';
    },
    clear: function() { var f=document.getElementById('game-progress-fill');if(f)f.style.width='0%'; }
  };
}

// ── ACHIEVEMENT POPUP (clean, no duplicate) ───────────────────────
if (typeof AchPopup === 'undefined') {
  var AchPopup = {_t:null,show:function(icon,title,xp){var el=document.getElementById('ach-popup');if(!el){toast('🏆 '+title+'! +'+xp+' XP');return;}el.innerHTML='<div style="font-size:1.8rem">'+icon+'</div><div style="flex:1"><div style="font-weight:800;font-size:.88rem">'+title+'</div><div style="font-size:.68rem;opacity:.5;margin-top:1px">Achievement! 🎉</div></div><div style="color:var(--amber);font-weight:800">+'+xp+'</div>';el.classList.add('show');clearTimeout(this._t);Snd.lvlup();Hap.ok();this._t=setTimeout(function(){var e=document.getElementById('ach-popup');if(e)e.classList.remove('show');},3200);}};
}
// Override Ach.unlock once  
if (!Ach._v5patched) {
  var _baseAchUnlock=Ach.unlock.bind(Ach);
  Ach.unlock=function(id){if(S.ach.includes(id))return;var a=this.all.find(function(x){return x.id===id;});if(!a)return;S.ach.push(id);AchPopup.show(a.i,a.n,a.xp);XP.add(a.xp);Save.save();};
  Ach._v5patched=true;
}

// ── RECORDS SYSTEM (clean, no duplicate) ─────────────────────────
if (typeof Records === 'undefined') {
  var Records = {
    _k:'po5_records', data:{},
    load:function(){try{this.data=JSON.parse(localStorage.getItem(this._k)||'{}');}catch(e){}},
    save:function(){try{localStorage.setItem(this._k,JSON.stringify(this.data));}catch(e){}},
    update:function(gameId,score,meta){if(!this.data[gameId]||score>this.data[gameId].score){var isNew=!!this.data[gameId];this.data[gameId]={score:score,ts:Date.now(),meta:meta||{}};this.save();if(isNew){toast('🏆 NEW RECORD! '+score+' pts');Snd.lvlup();Hap.ok();}return true;}return false;},
    get:function(id){return this.data[id]||null;},
    buildTable:function(el){if(!el)return;var entries=Object.entries(this.data);if(!entries.length){el.innerHTML='<div style="opacity:.25;text-align:center;padding:18px;font-size:.82rem">No records yet! Play some solo games 🎮</div>';return;}el.innerHTML=entries.sort(function(a,b){return b[1].score-a[1].score;}).slice(0,12).map(function(e,i){var g=Reg.get(e[0]);return'<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)"><div style="width:22px;text-align:center;font-size:.75rem;font-weight:800;color:'+(i===0?'var(--amber)':i===1?PCBrand.h_c0c0c0:i===2?PCBrand.h_cd7f32:'var(--dim)')+'">'+(i<3?['🥇','🥈','🥉'][i]:i+1)+'</div><div style="font-size:1.2rem">'+(g?g.icon:'🎮')+'</div><div style="flex:1"><div style="font-weight:700;font-size:.82rem">'+(g?g.title:e[0])+'</div></div><div style="font-size:1rem;font-weight:800;color:var(--amber)">'+e[1].score+'</div></div>';}).join('');}
  };
  Records.load();
}

// ── V5 GAMES REGISTRATION ─────────────────────────────────────────
setTimeout(function() {
  var v5games = [
    typeof WordAssassin!=='undefined'?WordAssassin:null,
    typeof DeadDrop!=='undefined'?DeadDrop:null,
    typeof BlitzDuel!=='undefined'?BlitzDuel:null,
    typeof PixelPainter!=='undefined'?PixelPainter:null,
    typeof SurvivalArena!=='undefined'?SurvivalArena:null,
    typeof MindMeld!=='undefined'?MindMeld:null
  ].filter(Boolean);
  v5games.forEach(function(g){if(Reg&&!Reg.get(g.id))Reg.add(g);});
  if(typeof GL!=='undefined'){GL._buildLib('all');GL._buildScrolls();}
  if(typeof OrientMgr!=='undefined')OrientMgr.init();
  var lc=document.getElementById('lib-count');
  if(lc&&typeof Reg!=='undefined')lc.textContent=Reg.list.length+' games · Fully offline';
  // Build records in dash
  var rl=document.getElementById('records-list');
  if(rl&&typeof Records!=='undefined')Records.buildTable(rl);
}, 600);

// ── BOOT: Wake lock + history API + keyboard ──────────────────────
window.addEventListener('load', function() {
  // Wake lock
  function reqWL(){if('wakeLock' in navigator){navigator.wakeLock.request('screen').then(function(wl){window._wl=wl;}).catch(function(){});}}
  window.requestWakeLock=reqWL;
  window.releaseWakeLock=function(){if(window._wl){window._wl.release().catch(function(){});window._wl=null;}};

  // Keyboard: Escape exits game
  document.addEventListener('keydown', function(e) {
    if (e.key==='Escape') {
      if (S.cur==='game') { GL.exitGame(); e.preventDefault(); }
      else if (document.getElementById('ov')&&document.getElementById('ov').className==='open') { Modal.close(); e.preventDefault(); }
    }
    if (S.cur==='game'&&S.game) {
      // Maze arrows
      if (S.game.id==='maze'&&window._mv){var d={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'}[e.key];if(d){window._mv(d);e.preventDefault();}}
      // Snake arrows
      if (S.game.id==='snake'&&S.game.gs){var gs=S.game.gs;if(e.key==='ArrowUp'&&gs.dir.y!==1)gs.ndir={x:0,y:-1};else if(e.key==='ArrowDown'&&gs.dir.y!==-1)gs.ndir={x:0,y:1};else if(e.key==='ArrowLeft'&&gs.dir.x!==1)gs.ndir={x:-1,y:0};else if(e.key==='ArrowRight'&&gs.dir.x!==-1)gs.ndir={x:1,y:0};}
    }
  });

  // History API for browser back button
  if(window.history&&window.history.pushState){
    window.history.pushState({p:'prism'},'PrismCap','');
    window.addEventListener('popstate',function(){
      if(S.cur==='game')GL.exitGame();
      else if(document.getElementById('ov')&&document.getElementById('ov').className==='open')Modal.close();
    });
  }
});



// ─── V6 FIXES ───
// ═══════════════════════════════════════════════════════════════════
// V6 JS FIXES - Notifications toggle, solo bots, DI, clean UX
// ═══════════════════════════════════════════════════════════════════

// ── 1. NOTIFICATION SETTINGS ─────────────────────────────────────
// Add notif toggle to S.cfg
if (typeof S.cfg.notif === 'undefined') S.cfg.notif = true;

// ── 2. NOTIFICATION TOGGLE IN SETTINGS HTML ──────────────────────
// (toast + settings rows patched once below — see §14)

// ── 3. SOLO + BOT LAUNCH for all games ───────────────────────────
// Override GL.launch to give 3 options: Solo, vs Bot, Multiplayer
var _v6Launch = function(id) {
  var game = Reg.get(id);
  if (!game) { toast('Game not found'); return; }
  Snd.click(); Hap.m();

  // Pure solo games - go straight to difficulty picker
  if (!game.mp) {
    _v6SoloLaunch(game);
    return;
  }

  // Board/strategy games that support bots - show 3-way choice
  var supportsBots = Bot.supports(game.id);

  if (supportsBots) {
    _v6ModeSelect(game);
    return;
  }

  // Pure MP games - show multiplayer setup
  GL._setup(game);
};

function _v6SoloLaunch(game) {
  var self = GL;
  var players = [{id:'p1', name: S.prof.name||'Player', av: S.prof.av||'🎮', col:PCBrand.h_c77dff, local:true}];
  var rec = typeof Records !== 'undefined' ? Records.get(game.id) : null;

  Modal.open(
    '<div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
      '<div style="font-size:2.5rem">' + game.icon + '</div>' +
      '<div><div style="font-size:1.05rem;font-weight:800">' + game.title + '</div>' +
      '<div style="font-size:.73rem;opacity:.38;margin-top:2px">' + game.desc + '</div></div>' +
    '</div>' +
    (rec ? '<div style="padding:10px 13px;background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.18);border-radius:13px;margin-bottom:12px;display:flex;align-items:center;gap:9px"><div style="font-size:1.3rem">🏆</div><div><div style="font-size:.68rem;opacity:.38">Your best score</div><div style="font-weight:800;font-size:.92rem;color:var(--amber)">' + rec.score + ' pts</div></div></div>' : '') +
    '<div onclick="typeof Difficulty!==\'undefined\'&&Difficulty.pick(function(){Modal.close();_v6Launch(\'' + game.id + '\');})" style="padding:11px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:13px;margin-bottom:14px;display:flex;align-items:center;gap:10px;cursor:pointer">' +
      '<span style="font-size:1.3rem">' + (typeof Difficulty!=='undefined'?Difficulty.get().icon:'🟡') + '</span>' +
      '<div style="flex:1"><div style="font-size:.82rem;font-weight:700">' + (typeof Difficulty!=='undefined'?Difficulty.get().label:'Normal') + '</div><div style="font-size:.65rem;opacity:.38">Tap to change</div></div>' +
      '<span style="opacity:.3;font-size:.82rem">›</span>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
      '<button type="button" class="btn bg" style="flex:0 0 auto;padding:12px 15px" onclick="Modal.close();setTimeout(function(){typeof Tutorial!==\'undefined\'&&Tutorial.show(game,function(){_v6Launch(\'' + game.id + '\');});},280)">📖</button>' +
      '<button type="button" class="btn bw" style="flex:1;font-size:.95rem;padding:14px" onclick="window.__soloGo()">▶ Play Now!</button>' +
    '</div></div>'
  );
  window.__soloGo = function() {
    Modal.close();
    setTimeout(function() {
      typeof Tutorial !== 'undefined'
        ? Tutorial.show(game, function() { Cinematic.show(game, players, function() { GL._start(game, players); }); })
        : GL._start(game, players);
    }, 270);
  };
}

function _v6ModeSelect(game) {
  var self = GL;
  Modal.open(
    '<div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">' +
      '<div style="font-size:2.5rem">' + game.icon + '</div>' +
      '<div><div style="font-size:1.05rem;font-weight:800">' + game.title + '</div>' +
      '<div style="font-size:.73rem;opacity:.38;margin-top:2px">' + game.desc + '</div></div>' +
    '</div>' +
    '<div style="font-size:.6rem;opacity:.3;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">How do you want to play?</div>' +
    '<div style="display:flex;flex-direction:column;gap:9px">' +
      '<button type="button" onclick="window.__playMode(\'solo\')" style="padding:16px;border-radius:17px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:'+PCBrand.h_fff+';font:700 .92rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:13px;transition:all .18s">' +
        '<div style="width:42px;height:42px;border-radius:50%;background:rgba(0,229,255,.15);border:1px solid rgba(0,229,255,.3);display:flex;align-items:center;justify-content:center;font-size:1.3rem">🎮</div>' +
        '<div style="text-align:left"><div style="font-weight:800">Play Solo</div><div style="font-size:.72rem;opacity:.45;margin-top:2px">Just you, no time pressure</div></div>' +
      '</button>' +
      '<button type="button" onclick="window.__playMode(\'bot\')" style="padding:16px;border-radius:17px;border:1px solid rgba(199,125,255,.25);background:rgba(199,125,255,.08);color:'+PCBrand.h_fff+';font:700 .92rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:13px;transition:all .18s">' +
        '<div style="width:42px;height:42px;border-radius:50%;background:rgba(199,125,255,.2);border:1px solid rgba(199,125,255,.4);display:flex;align-items:center;justify-content:center;font-size:1.3rem">🤖</div>' +
        '<div style="text-align:left"><div style="font-weight:800">vs Bot</div><div style="font-size:.72rem;opacity:.45;margin-top:2px">Challenge the AI · Solo device</div></div>' +
      '</button>' +
      '<button type="button" onclick="window.__playMode(\'multi\')" style="padding:16px;border-radius:17px;border:1px solid rgba(255,45,120,.25);background:rgba(255,45,120,.08);color:'+PCBrand.h_fff+';font:700 .92rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:13px;transition:all .18s">' +
        '<div style="width:42px;height:42px;border-radius:50%;background:rgba(255,45,120,.2);border:1px solid rgba(255,45,120,.4);display:flex;align-items:center;justify-content:center;font-size:1.3rem">👥</div>' +
        '<div style="text-align:left"><div style="font-weight:800">Pass & Play</div><div style="font-size:.72rem;opacity:.45;margin-top:2px">'+game.min+'–'+game.max+' players · Pass the device</div></div>' +
      '</button>' +
    '</div></div>'
  );

  window.__playMode = function(mode) {
    Modal.close();
    setTimeout(function() {
      if (mode === 'solo') {
        // Single player, one person
        var players = [{id:'p1',name:S.prof.name||'Player',av:S.prof.av||'🎮',col:PCBrand.h_c77dff,local:true}];
        Cinematic.show(game, players, function() { GL._start(game, players); });
      } else if (mode === 'bot') {
        var players = [
          {id:'p1',name:S.prof.name||'Player',av:S.prof.av||'😎',col:PCBrand.h_c77dff,local:true},
          {id:'bot1',name:'🤖 AI',av:'🤖',col:PCBrand.h_ff2d78,local:false,isBot:true,difficulty:typeof Difficulty!=='undefined'?Difficulty.current:'normal'}
        ];
        Cinematic.show(game, players, function() { GL._start(game, players); });
      } else {
        GL._setup(game);
      }
    }, 280);
  };
}

// Override GL.launch with v6 version
GL.launch = _v6Launch;

// ── 4. CLEAN CINEMATIC (no slow scan messages) ────────────────────
Cinematic.show = function(game, players, cb) {
  if (/[?&]e2e=1(?:&|$)/.test(location.search)) { if (cb) cb(); return; }
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:999;background:'+PCBrand.h_000+';display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:26px;transition:opacity .45s ease';
  var mutStr = typeof Mutators !== 'undefined' && Mutators.active.length ?
    '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:14px">' +
    Mutators.active.map(function(m){return '<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:3px 10px;font-size:.68rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('') +
    '</div>' : '';
  ov.innerHTML =
    '<div style="font-size:3.5rem;margin-bottom:10px;animation:bounceIn .5s ease">' + game.icon + '</div>' +
    '<div style="font-size:1.6rem;font-weight:900;letter-spacing:-.03em;color:' + game.col + ';margin-bottom:5px">' + game.title + '</div>' +
    '<div style="opacity:.38;font-size:.82rem;margin-bottom:18px">' + game.desc + '</div>' +
    mutStr +
    '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px">' +
    players.map(function(p){return '<div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:100px;padding:5px 13px;font-size:.78rem;font-weight:700">' + p.av + ' ' + p.name + (p.isBot?' 🤖':'') + '</div>';}).join('') +
    '</div>';
  document.body.appendChild(ov);
  if (typeof Announcer !== 'undefined') Announcer.gameStart(game.title, players.length);
  // Fast: 1.2s then go
  setTimeout(function() {
    ov.style.opacity = '0';
    setTimeout(function() {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      if (cb) cb();
    }, 450);
  }, 1200);
};

// ── 5. DYNAMIC ISLAND: Detect and handle properly ────────────────
(function() {
  // Get the real safe area at runtime
  var testEl = document.createElement('div');
  testEl.style.cssText = 'position:fixed;top:env(safe-area-inset-top,0px);width:1px;height:1px;pointer-events:none;opacity:0';
  document.body.appendChild(testEl);
  setTimeout(function() {
    var realTop = parseInt(window.getComputedStyle(testEl).top) || 59;
    document.body.removeChild(testEl);
    // iPhone 16 Pro Max DI = 59px, set it
    var sat = Math.max(realTop, 59);
    document.documentElement.style.setProperty('--sat', sat + 'px');
    // If DI detected (59px+), add class for extra padding
    if (sat >= 59) document.body.classList.add('has-di');
  }, 100);
})();

// ── 6. BACKGROUND PARTICLE COLORS (more vibrant) ─────────────────
// Override BG init to use more colors and faster particles
var _origBGinit = BG.init.bind(BG);
if (!BG._v6patched) {
  BG._v6patched = true;
  // The particles already exist - update their colors
  setTimeout(function() {
    // Inject more vibrant particle colors via CSS animation override
    var s = document.createElement('style');
    s.textContent = '@keyframes bgPulse{0%,100%{opacity:.14}50%{opacity:.28}}';
    document.head.appendChild(s);
  }, 500);
}

// ── 7. HOME SCREEN: Colorful section headers ──────────────────────
setTimeout(function() {
  // Make MP and Solo headers pop
  document.querySelectorAll('.shdr .sec').forEach(function(el, i) {
    var colors = [PCBrand.h_ff2d78,PCBrand.h_c77dff,PCBrand.h_00e5ff,PCBrand.h_00e676,PCBrand.h_ffd60a];
    el.style.background = 'linear-gradient(90deg,' + colors[i%colors.length] + ',' + colors[(i+1)%colors.length] + ')';
    el.style.webkitBackgroundClip = 'text';
    el.style.webkitTextFillColor = 'transparent';
    el.style.backgroundClip = 'text';
  });
}, 2500);

// ── 8. GAME CARDS: Color-coded per type ──────────────────────────
var _origBuildLib = GL._buildLib.bind(GL);
GL._buildLib = function(filter) {
  _origBuildLib(filter);
  // After build, ensure cards pop
  setTimeout(function() {
    document.querySelectorAll('.lcard').forEach(function(card) {
      card.style.boxShadow = '0 4px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.1)';
    });
  }, 50);
};

// ── 9. MINI CELEBRATIONS on win ──────────────────────────────────
function celebrate() {
  if (!S.cfg.notif || S.cfg.lowPower || S.cfg.perfMode === 'eco') return;
  var colors = [PCBrand.h_ff2d78,PCBrand.h_ffd60a,PCBrand.h_00e676,PCBrand.h_c77dff,PCBrand.h_00e5ff];
  var count = S.cfg.bg ? 12 : 8;
  for (var i = 0; i < count; i++) {
    (function(idx) {
      setTimeout(function() {
        var dot = document.createElement('div');
        var c = colors[Math.floor(Math.random()*colors.length)];
        var x = 20 + Math.random() * 60;
        dot.style.cssText = 'position:fixed;left:' + x + 'vw;top:70%;width:8px;height:8px;border-radius:50%;background:' + c + ';pointer-events:none;z-index:9999;transition:all 1.2s ease;box-shadow:0 0 6px ' + c;
        document.body.appendChild(dot);
        setTimeout(function() {
          dot.style.transform = 'translateY(-' + (100+Math.random()*200) + 'px)';
          dot.style.opacity = '0';
        }, 20);
        setTimeout(function() { if (dot.parentNode) dot.parentNode.removeChild(dot); }, 1300);
      }, idx * 60);
    })(i);
  }
}
window.celebrate = celebrate;

// Hook win to celebration
var _origShowWin = Game.prototype.showWin;
Game.prototype.showWin = function(winner, scores, extra) {
  _origShowWin.call(this, winner, scores, extra);
  setTimeout(celebrate, 300);
};

// ── 10. FIX: NavBar active glow updates live ──────────────────────
// Nav.go enhanced in v7 patch below

// ── 11. HOME SCREEN: Better featured card ───────────────────────
var _origBuildFeat = GL._buildFeat.bind(GL);
GL._buildFeat = function() {
  var gs = Reg.list;
  if (!gs.length) return;
  var f = gs[Math.floor(Math.random()*Math.min(gs.length, 10))];
  S.feat = f;
  var featBg = document.getElementById('feat-bg');
  if (featBg) {
    featBg.style.background = 'linear-gradient(135deg,' + f.col + '44,' + f.col + '14,transparent)';
    featBg.style.backdropFilter = 'blur(2px)';
  }
  function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  set('feat-title', f.title);
  set('feat-type', f.type.toUpperCase());
  set('feat-desc', f.desc);
  set('feat-icon', f.icon);
  var badge = document.getElementById('feat-badge');
  if (badge) {
    badge.textContent = f.mp ? '👥 Multiplayer' : '🎮 Solo';
    badge.style.background = f.col + '33';
    badge.style.color = f.col;
    badge.style.border = '1px solid ' + f.col + '55';
  }
};

// ── 12. NOTIF SETTING: save/load ────────────────────────────────
var _baseTogSet = GL.togSet.bind(GL);
GL.togSet = function(key, el) {
  S.cfg[key] = !S.cfg[key];
  if (el) el.className = 'tog' + (S.cfg[key] ? ' on' : '');
  Save.save();
  Snd.click();
  if (key === 'notif') {
    toast(S.cfg.notif ? '🔔 Notifications ON' : '🔕 Notifications OFF');
  }
  if (key === 'largeTap' && typeof PrismPerf !== 'undefined') {
    PrismPerf.apply();
    toast(S.cfg.largeTap ? '👆 Larger tap targets ON' : '👆 Larger tap targets OFF');
  }
};



// ═══ V7 PATCH ═══
// ═══════════════════════════════════════════════════════════════════
// PRISM OS v7 PATCH — Ludo, Snakes & Ladders, Music, Friends,
// Device picker, Bots for all board games, Visual polish
// Injected ONCE into v6 base. No duplicates.
// ═══════════════════════════════════════════════════════════════════

// ── 1. SUSPEND AUTO-SAVE FIX (no toast interruption) ────────────
// Already fixed in v6, guard here too
if (GL._ck) { clearTimeout(GL._ck); GL._ck = null; }

// ── 2. DEVICE MODEL SYSTEM (full 31 iPhone models) ──────────────
var DeviceDB = {
  iphone: [
    {id:'ip16pm',l:'iPhone 16 Pro Max',    n:'Dynamic Island · 6.9"',sat:62,sab:34,di:true},
    {id:'ip16p', l:'iPhone 16 Pro',         n:'Dynamic Island · 6.3"',sat:62,sab:34,di:true},
    {id:'ip16pl',l:'iPhone 16 Plus',        n:'Dynamic Island · 6.7"',sat:59,sab:34,di:true},
    {id:'ip16',  l:'iPhone 16',             n:'Dynamic Island · 6.1"',sat:59,sab:34,di:true},
    {id:'ip15pm',l:'iPhone 15 Pro Max',     n:'Dynamic Island · 6.7"',sat:59,sab:34,di:true},
    {id:'ip15p', l:'iPhone 15 Pro',         n:'Dynamic Island · 6.1"',sat:59,sab:34,di:true},
    {id:'ip15pl',l:'iPhone 15 Plus',        n:'Dynamic Island · 6.7"',sat:59,sab:34,di:true},
    {id:'ip15',  l:'iPhone 15',             n:'Dynamic Island · 6.1"',sat:59,sab:34,di:true},
    {id:'ip14pm',l:'iPhone 14 Pro Max',     n:'Dynamic Island · 6.7"',sat:59,sab:34,di:true},
    {id:'ip14p', l:'iPhone 14 Pro',         n:'Dynamic Island · 6.1"',sat:59,sab:34,di:true},
    {id:'ip14pl',l:'iPhone 14 Plus',        n:'Notch · 6.7"',          sat:47,sab:34,di:false},
    {id:'ip14',  l:'iPhone 14',             n:'Notch · 6.1"',          sat:47,sab:34,di:false},
    {id:'ip13pm',l:'iPhone 13 Pro Max',     n:'Notch · 6.7"',          sat:47,sab:34,di:false},
    {id:'ip13p', l:'iPhone 13 Pro',         n:'Notch · 6.1"',          sat:47,sab:34,di:false},
    {id:'ip13',  l:'iPhone 13',             n:'Notch · 6.1"',          sat:47,sab:34,di:false},
    {id:'ip13m', l:'iPhone 13 mini',        n:'Notch · 5.4"',          sat:50,sab:34,di:false},
    {id:'ip12pm',l:'iPhone 12 Pro Max',     n:'Notch · 6.7"',          sat:47,sab:34,di:false},
    {id:'ip12p', l:'iPhone 12 Pro',         n:'Notch · 6.1"',          sat:47,sab:34,di:false},
    {id:'ip12',  l:'iPhone 12',             n:'Notch · 6.1"',          sat:47,sab:34,di:false},
    {id:'ip12m', l:'iPhone 12 mini',        n:'Notch · 5.4"',          sat:50,sab:34,di:false},
    {id:'ip11pm',l:'iPhone 11 Pro Max',     n:'Notch · 6.5"',          sat:44,sab:34,di:false},
    {id:'ip11p', l:'iPhone 11 Pro',         n:'Notch · 5.8"',          sat:44,sab:34,di:false},
    {id:'ip11',  l:'iPhone 11',             n:'Notch · 6.1"',          sat:44,sab:34,di:false},
    {id:'ipxsm', l:'iPhone XS Max',         n:'Notch · 6.5"',          sat:44,sab:34,di:false},
    {id:'ipxs',  l:'iPhone XS',             n:'Notch · 5.8"',          sat:44,sab:34,di:false},
    {id:'ipx',   l:'iPhone X',              n:'Notch · 5.8"',          sat:44,sab:34,di:false},
    {id:'ipxr',  l:'iPhone XR',             n:'Notch · 6.1"',          sat:44,sab:34,di:false},
    {id:'ipse3', l:'iPhone SE (3rd gen)',    n:'No notch · 4.7"',       sat:20,sab:0, di:false},
    {id:'ipse2', l:'iPhone SE (2nd gen)',    n:'No notch · 4.7"',       sat:20,sab:0, di:false},
    {id:'ip8p',  l:'iPhone 8 Plus',         n:'No notch · 5.5"',       sat:20,sab:0, di:false},
    {id:'ip8',   l:'iPhone 8 / 7 / 6s',    n:'No notch · 4.7"',       sat:20,sab:0, di:false}
  ],
  ipad: [
    {id:'ipadp13',l:'iPad Pro 13"',n:'Face ID · M4',          sat:24,sab:20},
    {id:'ipadp11',l:'iPad Pro 11"',n:'Face ID · M4',          sat:24,sab:20},
    {id:'ipada13',l:'iPad Air 13"',n:'Touch ID top · M2',    sat:24,sab:20},
    {id:'ipada11',l:'iPad Air 11"',n:'Touch ID top · M2',    sat:24,sab:20},
    {id:'ipadm',  l:'iPad mini 7', n:'Touch ID top',         sat:20,sab:20},
    {id:'ipad10', l:'iPad (10th)', n:'USB-C · 820pt wide',   sat:20,sab:20},
    {id:'ipad9',  l:'iPad (9th)',  n:'Home button',           sat:20,sab:0}
  ],
  mac: [
    {id:'mac',l:'Mac / Browser',n:'Desktop experience',sat:0,sab:0}
  ]
};

// Patch DevSel with full 2-step model picker
DevSel._db = DeviceDB;
DevSel._showModels = function(family) {
  document.getElementById('ds-step1').style.display = 'none';
  var s2 = document.getElementById('ds-step2');
  s2.style.display = 'block';
  var title = document.getElementById('ds-model-title');
  if (title) title.textContent = {iphone:'iPhone',ipad:'iPad',mac:'Mac / Browser'}[family] || family;
  var list = document.getElementById('ds-models');
  if (!list) return;
  var models = this._db[family] || [];
  list.innerHTML = models.map(function(m) {
    return '<button type="button" onclick="DevSel.pickModel(\'' + m.id + '\')" style="width:100%;padding:13px 15px;border-radius:14px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);color:'+PCBrand.h_fff+';font:600 .86rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:11px;text-align:left;margin-bottom:7px;-webkit-tap-highlight-color:transparent">' +
      (m.di ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--p5);box-shadow:0 0 5px var(--p5);flex-shrink:0"></div>' : '<div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.15);flex-shrink:0"></div>') +
      '<div style="flex:1"><div style="font-weight:700">' + m.l + '</div><div style="font-size:.64rem;opacity:.38;margin-top:1px">' + m.n + '</div></div>' +
      (m.di ? '<span style="font-size:.55rem;background:rgba(0,229,255,.15);color:var(--p5);border-radius:100px;padding:2px 7px;font-weight:700;white-space:nowrap">DI</span>' : '') +
      '</button>';
  }).join('');
};

DevSel._backToFamily = function() {
  document.getElementById('ds-step2').style.display = 'none';
  document.getElementById('ds-step1').style.display = 'flex';
};

DevSel._familyFor = function(modelId) {
  if (modelId === 'mac' || modelId === 'macbook') return 'mac';
  if (DeviceDB.ipad.some(function(x) { return x.id === modelId; })) return 'ipad';
  return 'iphone';
};

DevSel._normalizeSaved = function(saved) {
  if (!saved) return null;
  if (saved === 'macbook') return 'mac';
  if (saved === 'mac' || saved === 'iphone' || saved === 'ipad') return saved;
  var all = DeviceDB.iphone.concat(DeviceDB.ipad).concat(DeviceDB.mac);
  if (all.some(function(m) { return m.id === saved; })) return saved;
  return null;
};

DevSel._revealWelcome = function() {
  if (localStorage.getItem('po5s')) return;
  var w = document.getElementById('welcome');
  if (!w) return;
  w.classList.remove('out');
  w.classList.add('ready');
  w.style.display = 'flex';
  w.style.opacity = '1';
  w.style.pointerEvents = 'auto';
};

DevSel.pickModel = function(modelId, silent) {
  if (modelId === 'macbook') modelId = 'mac';
  var all = DeviceDB.iphone.concat(DeviceDB.ipad).concat(DeviceDB.mac);
  var m = all.find(function(x) { return x.id === modelId; });
  if (!m) {
    if (modelId === 'iphone') m = DeviceDB.iphone[0];
    else if (modelId === 'ipad') m = DeviceDB.ipad[0];
    else if (modelId === 'mac') m = DeviceDB.mac[0];
    if (!m) return;
    modelId = m.id;
  }
  document.documentElement.style.setProperty('--sat', m.sat + 'px');
  document.documentElement.style.setProperty('--sab', m.sab + 'px');
  document.body.setAttribute('data-model', modelId);
  var family = DevSel._familyFor(modelId);
  document.body.setAttribute('data-device', family);
  DevSel.device = family;
  DevSel._applyLayout(family);
  if (m.di) document.body.classList.add('has-di');
  else document.body.classList.remove('has-di');
  var ob = document.getElementById('orient-btn');
  if (ob) ob.className = family === 'ipad' ? 'show' : '';
  localStorage.setItem(DevSel._k, modelId);
  S.cfg.device = modelId;
  Save.save();
  if (!silent) {
    DevSel._hide();
    Hap.ok(); Snd.ok();
    toast('✅ Optimized for ' + m.l);
  } else {
    var el = document.getElementById('device-sel');
    if (el) el.style.display = 'none';
  }
  DevSel._revealWelcome();
};

DevSel.init = function() {
  // PRSM-P1-01 / P-PRSM-1 — skip device gate; auto layout by width; ignore stored preference
  var w = window.innerWidth || 390;
  var family = w >= 1024 ? 'mac' : (w >= 768 ? 'ipad' : 'iphone');
  var el = document.getElementById('device-sel');
  if (el) { el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); }
  this.device = family;
  document.body.setAttribute('data-device', family);
  if (typeof this._applyLayout === 'function') this._applyLayout(family);
  // Keep stored preference untouched (unused)
  this._revealWelcome();
};

// ── 3. BACKGROUND MUSIC (Web Audio, no files) ────────────────────
var Music = (function() {
  var ctx = null, playing = false, track = '', _ivs = [];
  var TRACKS = {
    menu:  { tempo:82,  scale:[261,294,330,392,440,392],    bass:[130,146,165,130] },
    tense: { tempo:128, scale:[220,233,247,262,247,233],    bass:[110,117,123,110] },
    party: { tempo:120, scale:[392,440,494,523,494,440],    bass:[196,220,246,220] },
    epic:  { tempo:96,  scale:[329,370,415,466,415,370],    bass:[164,185,207,185] },
    board: { tempo:88,  scale:[349,392,440,392,330,392],    bass:[174,196,220,196] }
  };

  function initCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function stopAll() {
    _ivs.forEach(function(iv) { clearInterval(iv); });
    _ivs = [];
    playing = false; track = '';
    var ind = document.getElementById('music-ind');
    if (ind) { ind.textContent = '🔇'; ind.className = ''; }
  }

  function play(name) {
    if (!S.cfg.music) { stopAll(); return; }
    if (track === name && playing) return;
    stopAll();
    initCtx();
    if (!ctx) return;
    var t = TRACKS[name] || TRACKS.menu;
    var beatMs = Math.round(60000 / t.tempo);
    var noteIdx = 0, bassIdx = 0;

    var noteIv = setInterval(function() {
      if (!S.cfg.music) { stopAll(); return; }
      try {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = t.scale[noteIdx % t.scale.length];
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beatMs / 1100);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + beatMs / 1000);
        noteIdx++;
      } catch(e) {}
    }, beatMs);

    var bassIv = setInterval(function() {
      if (!S.cfg.music) return;
      try {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = t.bass[bassIdx % t.bass.length];
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.038, ctx.currentTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beatMs * 2 / 1000);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + beatMs * 2 / 1000);
        bassIdx++;
      } catch(e) {}
    }, beatMs * 2);

    _ivs = [noteIv, bassIv];
    playing = true; track = name;
    var ind = document.getElementById('music-ind');
    if (ind) { ind.textContent = '🎵'; ind.className = 'playing'; }
  }

  function toggle() {
    S.cfg.music = !S.cfg.music;
    var tog = document.getElementById('tmus');
    if (tog) tog.className = 'tog' + (S.cfg.music ? ' on' : '');
    Save.save();
    if (S.cfg.music) play(track || 'menu');
    else stopAll();
    toast(S.cfg.music ? '🎵 Music ON' : '🔇 Music OFF');
  }

  return { play: play, stop: stopAll, toggle: toggle };
})();

// Music indicator click
(function() {
  var mi = document.getElementById('music-ind');
  if (mi) mi.onclick = function() { Music.toggle(); };
})();

// ── 4. CONFETTI (physics-based) ───────────────────────────────────
function confetti() {
  var container = document.getElementById('confetti-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'confetti-container';
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
    document.body.appendChild(container);
  }
  var cols = [PCBrand.h_ff2d78,PCBrand.h_ffd60a,PCBrand.h_00e676,PCBrand.h_c77dff,PCBrand.h_00e5ff,PCBrand.h_ff6b00,PCBrand.h_ff85c2,PCBrand.h_aeea00];
  for (var i = 0; i < 40; i++) {
    (function(idx) {
      setTimeout(function() {
        var d = document.createElement('div');
        var col = cols[Math.floor(Math.random() * cols.length)];
        var sz = 6 + Math.random() * 8;
        var xStart = 10 + Math.random() * 80;
        d.style.cssText = 'position:absolute;bottom:20%;left:' + xStart + '%;width:' + sz + 'px;height:' + sz + 'px;background:' + col + ';border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';box-shadow:0 0 4px ' + col + ';pointer-events:none';
        container.appendChild(d);
        var startTime = Date.now();
        var vx = (Math.random() - 0.5) * 6;
        var vy = -(8 + Math.random() * 10);
        var gravity = 0.3;
        var rot = Math.random() * 360;
        var rotV = (Math.random() - 0.5) * 12;
        function step() {
          var elapsed = (Date.now() - startTime) / 16;
          vy += gravity;
          var x = parseFloat(d.style.left) + vx * 0.06;
          var y = parseFloat(d.style.bottom || 20) - vy * 0.15;
          rot += rotV;
          d.style.left = x + '%';
          d.style.bottom = y + '%';
          d.style.transform = 'rotate(' + rot + 'deg)';
          d.style.opacity = String(Math.max(0, 1 - elapsed / 60));
          if (elapsed < 60 && y > -10) requestAnimationFrame(step);
          else if (d.parentNode) d.parentNode.removeChild(d);
        }
        requestAnimationFrame(step);
      }, idx * 45);
    })(i);
  }
}
window.confetti = confetti;

// Float XP label
function floatXP(amount, x, y) {
  if (!amount) return;
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:' + (x || window.innerWidth / 2) + 'px;top:' + (y || window.innerHeight * 0.4) + 'px;font-size:1.1rem;font-weight:900;color:'+PCBrand.h_ffd60a+';pointer-events:none;z-index:9999;text-shadow:0 0 12px rgba(255,214,10,.7);transform:translate(-50%,-50%)';
  d.textContent = '+' + amount + ' XP';
  document.body.appendChild(d);
  var start = null;
  requestAnimationFrame(function step(ts) {
    if (!start) start = ts;
    var p = (ts - start) / 900;
    d.style.transform = 'translate(-50%,' + (p * -80 - 50) + '%)';
    d.style.opacity = String(Math.max(0, 1 - p));
    if (p < 1) requestAnimationFrame(step);
    else if (d.parentNode) d.parentNode.removeChild(d);
  });
}
window.floatXP = floatXP;

// Patch XP.add to show float
var _baseXPadd = XP.add.bind(XP);
XP.add = function(n, mult) {
  var total = Math.round(n * (mult || 1));
  _baseXPadd(n, mult);
  if (total > 0) floatXP(total);
};

// ── 5. FRIENDS SYSTEM ─────────────────────────────────────────────
var Friends = {
  _k: 'po7_friends',
  list: [],
  load: function() { try { this.list = JSON.parse(localStorage.getItem(this._k) || '[]'); } catch(e) { this.list = []; } },
  save: function() { try { localStorage.setItem(this._k, JSON.stringify(this.list)); } catch(e) {} },
  add: function() {
    var self = this;
    var avs = ['😎','🦊','🐺','🦁','🐯','🌸','💖','🦋','🌟','✨','🎀','🩷','🌈','🦄','🤖','💀','🔥','⚡'];
    var selAv = avs[0];
    Modal.open(
      '<div><div style="font-size:1rem;font-weight:800;margin-bottom:3px">👥 Add Friend</div>' +
      '<div style="font-size:.74rem;opacity:.35;margin-bottom:12px">Track games, wins & rivalries</div>' +
      '<input id="_fn" placeholder="Friend\'s name..." autocorrect="off" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);font-size:.9rem;font-weight:600;color:'+PCBrand.h_fff+';margin-bottom:11px">' +
      '<div style="font-size:.6rem;opacity:.28;text-transform:uppercase;letter-spacing:.1em;margin-bottom:7px">Avatar</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:13px">' +
      avs.map(function(a) { return '<div onclick="window._fav(\'' + a + '\',this)" style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.07);border:2px solid transparent;display:flex;align-items:center;justify-content:center;font-size:1.2rem;cursor:pointer">' + a + '</div>'; }).join('') +
      '</div>' +
      '<button type="button" class="btn bw bf" onclick="window._fadd()">Add ✓</button></div>'
    );
    window._fav = function(a, el) {
      selAv = a;
      document.querySelectorAll('[onclick^="window._fav"]').forEach(function(e) { e.style.borderColor = 'transparent'; });
      el.style.borderColor = 'var(--acc)';
    };
    window._fadd = function() {
      var nm = ((document.getElementById('_fn') || {}).value || '').trim();
      if (!nm) { toast('Enter a name!'); return; }
      self.list.push({ id: 'f' + Date.now(), name: nm, av: selAv, games: 0, wins: 0, betrayals: 0, hist: [] });
      self.save(); Modal.close();
      toast('👥 ' + nm + ' added!'); Snd.ok(); Hap.ok();
    };
  },
  record: function(friendName, iWon, gameTitle) {
    var f = this.list.find(function(x) { return x.name === friendName; });
    if (!f) return;
    f.games++; if (iWon) f.wins++;
    f.hist.unshift({ g: gameTitle, w: iWon, dt: new Date().toLocaleDateString() });
    if (f.hist.length > 20) f.hist = f.hist.slice(0, 20);
    this.save();
  },
  buildList: function(el) {
    if (!el) return;
    if (!this.list.length) {
      el.innerHTML = '<div style="text-align:center;padding:18px;opacity:.22;font-size:.82rem">No friends added yet.<br>Add friends to track rivalries! 👥</div>';
      return;
    }
    el.innerHTML = this.list.map(function(f) {
      var wr = f.games > 0 ? Math.round(f.wins / f.games * 100) : 0;
      return '<div style="display:flex;align-items:center;gap:10px;padding:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;margin-bottom:7px">' +
        '<div style="font-size:1.75rem">' + f.av + '</div>' +
        '<div style="flex:1"><div style="font-weight:800;font-size:.88rem">' + f.name + '</div>' +
        '<div style="font-size:.64rem;opacity:.38;margin-top:1px">' + f.games + ' games · ' + wr + '% wins' + (f.betrayals ? ' · ' + f.betrayals + '× betrayed 🗡️' : '') + '</div></div>' +
        '<div style="text-align:right"><div style="font-size:1.25rem;font-weight:900;color:var(--p3)">' + wr + '%</div><div style="font-size:.52rem;opacity:.28">win rate</div></div>' +
        '</div>';
    }).join('');
  }
};
Friends.load();

// Add Friends list to dashboard and Add Friend button to profile settings
(function patchDashAndProfile() {
  // Friends in dashboard
  var dash = document.getElementById('dashboard-screen');
  if (dash) {
    var fl = document.createElement('div');
    fl.style.cssText = 'padding:0 15px;margin-top:13px';
    fl.innerHTML = '<div class="sec" style="margin-bottom:9px">👥 Friends</div><div id="friends-list"></div>';
    // Insert before achievements
    var achlDiv = dash.querySelector('[id="achl"]');
    if (achlDiv && achlDiv.parentNode) {
      dash.appendChild(fl);
    }
  }
  // High scores in dashboard
  if (dash && !document.getElementById('records-list')) {
    var rl = document.createElement('div');
    rl.style.cssText = 'padding:0 15px;margin-top:13px;margin-bottom:8px';
    rl.innerHTML = '<div class="sec" style="margin-bottom:9px">🏆 High Scores</div><div id="records-list"></div>';
    dash.appendChild(rl);
  }
})();

// ── 6. RECORDS SYSTEM ─────────────────────────────────────────────
var Records = {
  _k: 'po7_rec', data: {},
  load: function() { try { this.data = JSON.parse(localStorage.getItem(this._k) || '{}'); } catch(e) {} },
  save: function() { try { localStorage.setItem(this._k, JSON.stringify(this.data)); } catch(e) {} },
  update: function(gameId, score) {
    if (!score) return false;
    var isNew = !!this.data[gameId];
    if (!this.data[gameId] || score > this.data[gameId].score) {
      this.data[gameId] = { score: score, ts: Date.now() };
      this.save();
      if (isNew) { toast('🏆 NEW RECORD! ' + score); Snd.lvlup(); Hap.blast(); }
      return true;
    }
    return false;
  },
  get: function(id) { return this.data[id] || null; },
  buildTable: function(el) {
    if (!el) return;
    var entries = Object.entries(this.data);
    if (!entries.length) {
      el.innerHTML = '<div style="text-align:center;padding:16px;opacity:.22;font-size:.82rem">No records yet — play some solo games! 🎮</div>';
      return;
    }
    el.innerHTML = entries.sort(function(a,b){return b[1].score-a[1].score;}).slice(0,12).map(function(e,i){
      var g = Reg.get(e[0]);
      return '<div style="display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">' +
        '<div style="width:24px;text-align:center;font-weight:800;font-size:.8rem;color:' + (i===0?PCBrand.h_ffd60a:i===1?PCBrand.h_c0c0c0:i===2?PCBrand.h_cd7f32:'rgba(255,255,255,.28)') + '">' + (i<3?['🥇','🥈','🥉'][i]:i+1) + '</div>' +
        '<div style="font-size:1.2rem">' + (g?g.icon:'🎮') + '</div>' +
        '<div style="flex:1;font-weight:700;font-size:.82rem">' + (g?g.title:e[0]) + '</div>' +
        '<div style="font-size:1rem;font-weight:900;color:'+PCBrand.h_ffd60a+'">' + e[1].score + '</div>' +
        '</div>';
    }).join('');
  }
};
Records.load();

// Patch Game.done to update records for solo games
var _baseDone = Game.prototype.done;
Game.prototype.done = function(winner) {
  _baseDone.call(this, winner);
  if (!this.mp && this.gs) {
    var sc = this.gs.sc || this.gs.score || 0;
    if (sc > 0) Records.update(this.id, sc);
  }
};

// ── 7. PATCH UI.dash to include friends + records ─────────────────
var _baseDash = UI.dash.bind(UI);
UI.dash = function() {
  _baseDash();
  var fl = document.getElementById('friends-list');
  if (fl) Friends.buildList(fl);
  var rl = document.getElementById('records-list');
  if (rl) Records.buildTable(rl);
};

// ── 8. MUSIC in Nav.go ────────────────────────────────────────────
var _baseNavGo = Nav.go.bind(Nav);
Nav.go = function(scr) {
  _baseNavGo(scr);
  // Scroll to top
  var el = document.getElementById(scr + '-screen');
  if (el) el.scrollTop = 0;
  // Music
  if (S.cfg.music) {
    var trk = 'menu';
    if (scr === 'game' && S.game) {
      trk = S.game.cat === 'board' ? 'board' : (S.game.mp ? 'tense' : 'party');
    }
    Music.play(trk);
  }
  // Progress bar
  var fill = document.getElementById('game-progress-fill');
  if (fill) {
    if (scr === 'game' && S.game && S.game.gs) {
      var g = S.game.gs, pct = 0;
      if (g.round && g.maxR) pct = (g.round / g.maxR) * 100;
      else if (g.lvl) pct = Math.min(88, (g.lvl / 20) * 100);
      fill.style.width = pct + '%';
      fill.style.background = (S.game && S.game.col) || 'var(--acc)';
    } else { fill.style.width = '0%'; }
  }
  // Dashboard updates
  if (scr === 'dashboard') { var rl = document.getElementById('records-list'); if (rl) Records.buildTable(rl); }
};

// ── 9. PATCH GL.launch for 3-way mode picker (ALL board games) ────
var _baseGLlaunch = GL.launch.bind(GL);
GL.launch = function(id) {
  var game = Reg.get(id);
  if (!game) { toast('Game not found'); return; }
  Snd.click(); Hap.m();
  var self = this;
  if (BOT_BOARD_GAMES.indexOf(game.id) > -1) {
    this._v7ModePicker(game); return;
  }
  if (!game.mp) { this._v7SoloLaunch(game); return; }
  this._setup(game);
};

GL._v7ModePicker = function(game) {
  var self = this;
  var rec = Records.get(game.id);
  Modal.open(
    '<div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
      '<div style="font-size:2.3rem">' + game.icon + '</div>' +
      '<div><div style="font-size:1rem;font-weight:800">' + game.title + '</div>' +
      '<div style="font-size:.72rem;opacity:.35;margin-top:2px">' + game.desc + '</div></div>' +
    '</div>' +
    (rec ? '<div style="padding:9px 12px;background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.18);border-radius:12px;margin-bottom:12px;display:flex;align-items:center;gap:8px"><span style="font-size:1.1rem">🏆</span><div><div style="font-size:.64rem;opacity:.35">Your best</div><div style="font-weight:800;font-size:.86rem;color:'+PCBrand.h_ffd60a+'">' + rec.score + ' pts</div></div></div>' : '') +
    '<div style="font-size:.6rem;opacity:.28;text-transform:uppercase;letter-spacing:.1em;margin-bottom:9px">How to play?</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px">' +
      '<button type="button" onclick="window.__v7pm(\'solo\')" style="padding:15px;border-radius:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:'+PCBrand.h_fff+';font:700 .9rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:12px;text-align:left;-webkit-tap-highlight-color:transparent">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:rgba(0,229,255,.15);border:1px solid rgba(0,229,255,.28);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">🎮</div>' +
        '<div><div style="font-weight:800">Play Solo</div><div style="font-size:.7rem;opacity:.4;margin-top:1px">Just you, no opponent</div></div></button>' +
      '<button type="button" onclick="window.__v7pm(\'bot\')" style="padding:15px;border-radius:16px;border:1px solid rgba(199,125,255,.22);background:rgba(199,125,255,.07);color:'+PCBrand.h_fff+';font:700 .9rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:12px;text-align:left;-webkit-tap-highlight-color:transparent">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:rgba(199,125,255,.18);border:1px solid rgba(199,125,255,.35);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">🤖</div>' +
        '<div><div style="font-weight:800">vs Bot / AI</div><div style="font-size:.7rem;opacity:.4;margin-top:1px">Challenge the AI on one device</div></div></button>' +
      '<button type="button" onclick="window.__v7pm(\'multi\')" style="padding:15px;border-radius:16px;border:1px solid rgba(255,45,120,.22);background:rgba(255,45,120,.07);color:'+PCBrand.h_fff+';font:700 .9rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:12px;text-align:left;-webkit-tap-highlight-color:transparent">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,45,120,.18);border:1px solid rgba(255,45,120,.35);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">👥</div>' +
        '<div><div style="font-weight:800">Pass & Play</div><div style="font-size:.7rem;opacity:.4;margin-top:1px">'+game.min+'–'+game.max+' players, pass the device</div></div></button>' +
    '</div></div>'
  );
  window.__v7pm = function(mode) {
    Modal.close();
    setTimeout(function() {
      var pl;
      if (mode === 'solo') {
        pl = [{ id:'p1', name:S.prof.name||'Player', av:S.prof.av||'😎', col:PCBrand.h_c77dff, local:true }];
        Cinematic.show(game, pl, function() { self._start(game, pl); });
      } else if (mode === 'bot') {
        pl = [
          { id:'p1', name:S.prof.name||'Player', av:S.prof.av||'😎', col:PCBrand.h_c77dff, local:true },
          Bot.createPlayer(null, typeof Difficulty !== 'undefined' ? Difficulty.current : 'normal')
        ];
        Cinematic.show(game, pl, function() { self._start(game, pl); });
      } else {
        self._setup(game);
      }
    }, 280);
  };
};

GL._v7SoloLaunch = function(game) {
  var self = this;
  var players = [{ id:'p1', name:S.prof.name||'Player', av:S.prof.av||'🎮', col:PCBrand.h_c77dff, local:true }];
  var rec = Records.get(game.id);
  Modal.open(
    '<div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
      '<div style="font-size:2.3rem">' + game.icon + '</div>' +
      '<div><div style="font-size:1rem;font-weight:800">' + game.title + '</div>' +
      '<div style="font-size:.72rem;opacity:.35;margin-top:2px">' + game.desc + '</div></div>' +
    '</div>' +
    (rec ? '<div style="padding:9px 12px;background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.18);border-radius:12px;margin-bottom:12px;display:flex;align-items:center;gap:8px"><span style="font-size:1.1rem">🏆</span><div><div style="font-size:.64rem;opacity:.35">Your best</div><div style="font-weight:800;font-size:.86rem;color:'+PCBrand.h_ffd60a+'">' + rec.score + ' pts</div></div></div>' : '') +
    '<div onclick="typeof Difficulty!==\'undefined\'&&Difficulty.pick(function(){Modal.close();GL._v7SoloLaunch(game);})" style="padding:10px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;margin-bottom:12px;display:flex;align-items:center;gap:9px;cursor:pointer">' +
      '<span style="font-size:1.2rem">' + (typeof Difficulty !== 'undefined' ? Difficulty.get().icon : '🟡') + '</span>' +
      '<div style="flex:1"><div style="font-size:.82rem;font-weight:700">' + (typeof Difficulty !== 'undefined' ? Difficulty.get().label : 'Normal') + '</div><div style="font-size:.65rem;opacity:.35">Tap to change</div></div>' +
      '<span style="opacity:.28;font-size:.82rem">›</span>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
      '<button type="button" class="btn bg" style="flex:0 0 auto;padding:12px 14px" onclick="Modal.close();setTimeout(function(){typeof Tutorial!==\'undefined\'&&Tutorial.show(game,function(){GL._v7SoloLaunch(game);});},280)">📖</button>' +
      '<button type="button" class="btn bw" style="flex:1;font-size:.95rem" onclick="window.__sgo()">▶ Play Now!</button>' +
    '</div></div>'
  );
  window.__sgo = function() {
    Modal.close();
    setTimeout(function() {
      Cinematic.show(game, players, function() { self._start(game, players); });
    }, 270);
  };
};

// Win screen override for confetti
var _baseShowWin = Game.prototype.showWin;
Game.prototype.showWin = function(winner, scores, extra) {
  _baseShowWin.call(this, winner, scores, extra);
  setTimeout(confetti, 200);
};

// ── 10. LUDO GAME ─────────────────────────────────────────────────
var Ludo = new Game({
  id:'ludo',title:'Ludo',icon:'🎲',type:'board',cat:'multiplayer',
  col:PCBrand.h_ffd60a,mp:true,min:1,max:6,
  desc:'Classic Ludo! Tap to roll, race to home. 1-6 players + bots.'
});

Ludo._COLS = [PCBrand.h_ff2d78,PCBrand.h_00e676,PCBrand.h_ffd60a,PCBrand.h_00e5ff,PCBrand.h_c77dff,PCBrand.h_ff6b00];
Ludo._NAMES = ['Red','Green','Yellow','Blue','Purple','Orange'];
Ludo._EMOJIS = ['🔴','🟢','🟡','🔵','🟣','🟠'];

Ludo.setup = function(pl) {
  Game.prototype.setup.call(this, pl);
  var self = this;
  this.gs = {
    players: pl.map(function(p, i) {
      return {
        id: p.id, name: p.name, av: p.av,
        col: Ludo._COLS[i % 6], emoji: Ludo._EMOJIS[i % 6],
        colorName: Ludo._NAMES[i % 6],
        pieces: [{ pos:-1, home:false }, { pos:-1, home:false }, { pos:-1, home:false }, { pos:-1, home:false }],
        isBot: p.isBot || false
      };
    }),
    turn: 0, dice: 0, phase: 'roll', movable: [], winner: null, log: [], sixStreak: 0
  };
};

Ludo.render = function() {
  var gs = this.gs, self = this;
  if (gs.winner) {
    this.done(gs.winner.name);
    this.showWin(gs.winner.name, gs.players.map(function(p) {
      return { n:p.name, s:p.pieces.filter(function(pc){return pc.home;}).length+'/4 home' };
    }));
    return;
  }
  var cur = gs.players[gs.turn % gs.players.length];
  var boardSz = Math.min(window.innerWidth - 28, 360);
  var cell = Math.floor(boardSz / 15);
  boardSz = cell * 15;

  document.getElementById('gbody').innerHTML =
    '<div style="padding:4px 0">' +
    '<div style="display:flex;gap:5px;overflow-x:auto;margin-bottom:10px;touch-action:pan-x">' +
    gs.players.map(function(p, i) {
      var active = i === gs.turn % gs.players.length;
      var inHome = p.pieces.filter(function(pc) { return pc.home; }).length;
      return '<div style="flex-shrink:0;text-align:center;padding:7px 10px;border-radius:13px;background:' + (active ? p.col + '28' : 'rgba(255,255,255,.04)') + ';border:2px solid ' + (active ? p.col : 'transparent') + '">' +
        '<div style="font-size:.95rem">' + p.emoji + '</div>' +
        '<div style="font-size:.56rem;font-weight:700;margin-top:2px">' + p.colorName + '</div>' +
        '<div style="font-size:.54rem;opacity:.45">' + inHome + '/4</div>' +
        (p.isBot ? '<div style="font-size:.46rem;color:var(--p5);font-weight:700">BOT</div>' : '') +
      '</div>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;justify-content:center;margin-bottom:11px">' +
      '<div style="position:relative;width:' + boardSz + 'px;height:' + boardSz + 'px">' +
      self._renderSVG(boardSz, cell) +
      '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
      '<div style="flex:1">' +
        '<div style="font-weight:800;font-size:.9rem">' + cur.emoji + ' ' + cur.name + '</div>' +
        '<div style="font-size:.7rem;opacity:.38;margin-top:1px">' + cur.colorName + (gs.phase === 'roll' ? ' · Tap dice to roll' : ' · Tap a piece') + '</div>' +
        (gs.log.length ? '<div style="font-size:.62rem;opacity:.32;margin-top:3px">' + gs.log[gs.log.length-1] + '</div>' : '') +
      '</div>' +
      '<div class="dice" id="ldice" onclick="window._lroll()" style="opacity:' + (gs.phase === 'roll' && !cur.isBot ? '1' : '0.5') + '">' +
        (gs.dice ? ['','⚀','⚁','⚂','⚃','⚄','⚅'][gs.dice] : '🎲') +
      '</div>' +
    '</div></div>';

  window._lroll = function() { if (gs.phase === 'roll' && !cur.isBot) self._roll(); };
  window._lmove = function(playerIdx, pieceIdx) { self._movePiece(playerIdx, pieceIdx); };
  if (cur.isBot && gs.phase === 'roll') {
    setTimeout(function() { if (S.game === self && gs.phase === 'roll') self._roll(); }, 900);
  }
};

Ludo._renderSVG = function(sz, cell) {
  var gs = this.gs, self = this;
  var html = '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 ' + sz + ' ' + sz + '" style="border-radius:12px;overflow:hidden;cursor:pointer">';
  // Background
  html += '<rect width="' + sz + '" height="' + sz + '" fill=PCBrand.h_1a1a2e/>';
  // Quadrant colors: TL=Red, TR=Green, BL=Yellow, BR=Blue
  var qcols = [PCBrand.h_ff2d78,PCBrand.h_00e676,PCBrand.h_ffd60a,PCBrand.h_00e5ff];
  var qpos = [{x:0,y:0},{x:cell*9,y:0},{x:0,y:cell*9},{x:cell*9,y:cell*9}];
  qpos.forEach(function(q, i) {
    html += '<rect x="' + q.x + '" y="' + q.y + '" width="' + (cell*6) + '" height="' + (cell*6) + '" fill="' + qcols[i] + '" opacity=".2" rx="6"/>';
    var cx = q.x + cell * 3, cy = q.y + cell * 3;
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (cell*2) + '" fill="' + qcols[i] + '" opacity=".3"/>';
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (cell*1.4) + '" fill="rgba(0,0,0,.4)"/>';
  });
  // Grid lines
  for (var i = 0; i <= 15; i++) {
    html += '<line x1="' + (i*cell) + '" y1="0" x2="' + (i*cell) + '" y2="' + sz + '" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
    html += '<line x1="0" y1="' + (i*cell) + '" x2="' + sz + '" y2="' + (i*cell) + '" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
  }
  // Center home
  var mid = sz / 2;
  html += '<polygon points="' + mid + ',' + mid + ' ' + (mid-cell*2.5) + ',' + (mid-cell*3) + ' ' + (mid+cell*2.5) + ',' + (mid-cell*3) + '" fill=PCBrand.h_ff2d78 opacity=".5"/>';
  html += '<polygon points="' + mid + ',' + mid + ' ' + (mid+cell*3) + ',' + (mid-cell*2.5) + ' ' + (mid+cell*3) + ',' + (mid+cell*2.5) + '" fill=PCBrand.h_00e676 opacity=".5"/>';
  html += '<polygon points="' + mid + ',' + mid + ' ' + (mid-cell*2.5) + ',' + (mid+cell*3) + ' ' + (mid+cell*2.5) + ',' + (mid+cell*3) + '" fill=PCBrand.h_ffd60a opacity=".5"/>';
  html += '<polygon points="' + mid + ',' + mid + ' ' + (mid-cell*3) + ',' + (mid-cell*2.5) + ' ' + (mid-cell*3) + ',' + (mid+cell*2.5) + '" fill=PCBrand.h_00e5ff opacity=".5"/>';
  // Safe cell markers (star)
  var safeGrids = [{x:2,y:6},{x:6,y:2},{x:8,y:12},{x:12,y:8}];
  safeGrids.forEach(function(p) {
    html += '<text x="' + (p.x*cell+cell/2) + '" y="' + (p.y*cell+cell/2+4) + '" text-anchor="middle" font-size="' + Math.round(cell*.65) + '">⭐</text>';
  });
  // Draw pieces
  gs.players.forEach(function(p, pi) {
    p.pieces.forEach(function(pc, pci) {
      if (pc.home) return;
      var pos;
      if (pc.pos === -1) {
        // In home base
        var bases = [{x:1,y:1},{x:9,y:1},{x:1,y:9},{x:9,y:9}];
        var b = bases[Math.min(pi, 3)];
        var ox = pci % 2, oy = Math.floor(pci / 2);
        pos = { x:(b.x+ox)*cell+cell/2, y:(b.y+oy)*cell+cell/2 };
      } else {
        pos = self._trackXY(pc.pos, pi, cell);
      }
      var r = Math.round(cell * .34);
      var isMovable = gs.movable.indexOf(pci) > -1 && pi === gs.turn % gs.players.length;
      // Glow for movable
      if (isMovable) {
        html += '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + (r+4) + '" fill="' + p.col + '" opacity=".35"><animate attributeName="r" values="' + (r+4) + ';' + (r+8) + ';' + (r+4) + '" dur="0.8s" repeatCount="indefinite"/></circle>';
      }
      html += '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + r + '" fill="' + p.col + '" stroke="rgba(0,0,0,.35)" stroke-width="2"/>';
      html += '<text x="' + pos.x + '" y="' + (pos.y+4) + '" text-anchor="middle" font-size="' + Math.round(r*.9) + '">' + p.emoji + '</text>';
      if (isMovable) {
        html += '<rect x="' + (pos.x-r-6) + '" y="' + (pos.y-r-6) + '" width="' + (r*2+12) + '" height="' + (r*2+12) + '" fill="transparent" onclick="window._lmove(' + pi + ',' + pci + ')" style="cursor:pointer"/>';
      }
    });
  });
  html += '</svg>';
  return html;
};

// 52-step outer track positions (grid coords)
Ludo._TRACK = [
  {x:6,y:13},{x:6,y:12},{x:6,y:11},{x:6,y:10},{x:6,y:9},{x:5,y:8},
  {x:4,y:8},{x:3,y:8},{x:2,y:8},{x:1,y:8},{x:0,y:8},{x:0,y:7},
  {x:0,y:6},{x:1,y:6},{x:2,y:6},{x:3,y:6},{x:4,y:6},{x:5,y:6},
  {x:6,y:5},{x:6,y:4},{x:6,y:3},{x:6,y:2},{x:6,y:1},{x:6,y:0},
  {x:7,y:0},{x:8,y:0},{x:8,y:1},{x:8,y:2},{x:8,y:3},{x:8,y:4},
  {x:8,y:5},{x:9,y:6},{x:10,y:6},{x:11,y:6},{x:12,y:6},{x:13,y:6},
  {x:14,y:6},{x:14,y:7},{x:14,y:8},{x:13,y:8},{x:12,y:8},{x:11,y:8},
  {x:10,y:8},{x:9,y:8},{x:8,y:9},{x:8,y:10},{x:8,y:11},{x:8,y:12},
  {x:8,y:13},{x:8,y:14},{x:7,y:14},{x:6,y:14}
];
Ludo._STARTS = [0, 13, 26, 39]; // track entry per color
Ludo._SAFE   = [0, 8, 13, 21, 26, 34, 39, 47];

Ludo._trackXY = function(step, colorIdx, cell) {
  var offset = Ludo._STARTS[Math.min(colorIdx, 3)] || 0;
  var idx = (step + offset) % 52;
  var t = Ludo._TRACK[idx] || {x:7, y:7};
  return { x: t.x * cell + cell / 2, y: t.y * cell + cell / 2 };
};

Ludo._roll = function() {
  var gs = this.gs, self = this;
  if (gs.phase !== 'roll') return;
  var d = document.getElementById('ldice');
  if (d) d.classList.add('rolling');
  Snd.dice(); Hap.dice();
  setTimeout(function() {
    gs.dice = Math.floor(Math.random() * 6) + 1;
    if (d) { d.classList.remove('rolling'); d.textContent = ['','⚀','⚁','⚂','⚃','⚄','⚅'][gs.dice]; }
    var cur = gs.players[gs.turn % gs.players.length];
    gs.movable = [];
    cur.pieces.forEach(function(pc, i) {
      if (pc.home) return;
      if (pc.pos === -1 && gs.dice === 6) gs.movable.push(i);
      if (pc.pos >= 0) gs.movable.push(i);
    });
    if (!gs.movable.length) {
      gs.log.push(cur.colorName + ' rolled ' + gs.dice + ' — no moves');
      setTimeout(function() { self._next(); }, 1100);
    } else if (gs.movable.length === 1) {
      gs.phase = 'move';
      setTimeout(function() { self._movePiece(gs.turn % gs.players.length, gs.movable[0]); }, 400);
    } else {
      gs.phase = 'move';
      if (cur.isBot) {
        setTimeout(function() {
          var pick = gs.movable[Math.floor(Math.random() * gs.movable.length)];
          self._movePiece(gs.turn % gs.players.length, pick);
        }, 700);
      } else {
        toast(cur.colorName + ' rolled ' + gs.dice + '! Tap a piece');
        Nav.go('game'); self.render();
      }
    }
    if (gs.dice === 6) gs.sixStreak++;
    else gs.sixStreak = 0;
  }, 520);
};

Ludo._movePiece = function(playerIdx, pieceIdx) {
  var gs = this.gs, self = this;
  var p = gs.players[playerIdx], pc = p.pieces[pieceIdx];
  if (pc.pos === -1 && gs.dice === 6) {
    pc.pos = 0;
    gs.log.push(p.colorName + ' enters the board!');
    Snd.coin(); Hap.ok();
  } else if (pc.pos >= 0) {
    pc.pos += gs.dice;
    if (pc.pos >= 56) {
      pc.pos = 56; pc.home = true;
      gs.log.push(p.colorName + ' reached HOME! 🏠');
      Snd.win(); Hap.blast();
      var homeCount = p.pieces.filter(function(x) { return x.home; }).length;
      toast(p.emoji + ' ' + homeCount + '/4 home!');
    } else {
      // Check knock
      var myXY = self._trackXY(pc.pos, playerIdx, 1);
      gs.players.forEach(function(op, oi) {
        if (oi === playerIdx) return;
        op.pieces.forEach(function(opc) {
          if (opc.home || opc.pos < 0) return;
          var opXY = self._trackXY(opc.pos, oi, 1);
          if (Math.abs(opXY.x - myXY.x) < 0.1 && Math.abs(opXY.y - myXY.y) < 0.1) {
            var isSafe = Ludo._SAFE.indexOf(opc.pos) > -1;
            if (!isSafe) {
              opc.pos = -1;
              gs.log.push(p.colorName + ' knocked ' + op.colorName + ' back!');
              toast('💥 ' + p.emoji + ' knocked ' + op.emoji + ' back!');
              Snd.blast(); Hap.blast();
            }
          }
        });
      });
    }
  }
  // Check win
  if (p.pieces.every(function(pc) { return pc.home; })) {
    gs.winner = p;
    Ach.unlock('ludo1');
    Nav.go('game'); self.render(); return;
  }
  // Six = another turn (max 3)
  if (gs.dice === 6 && gs.sixStreak < 3) {
    gs.phase = 'roll';
    if (!p.isBot) toast('🎲 Six! Roll again!');
    Nav.go('game'); self.render();
    if (p.isBot) setTimeout(function() { self._roll(); }, 800);
  } else {
    gs.sixStreak = 0;
    self._next();
  }
};

Ludo._next = function() {
  var gs = this.gs;
  gs.turn++; gs.phase = 'roll'; gs.movable = []; gs.dice = 0;
  Nav.go('game'); this.render();
};

// Expose handlers
window._lroll = function() { if (S.game && S.game.id === 'ludo') S.game._roll(); };
window._lmove = function(pi, pci) { if (S.game && S.game.id === 'ludo') S.game._movePiece(pi, pci); };

// ── 11. SNAKES & LADDERS ─────────────────────────────────────────
var SnakesLadders = new Game({
  id:'snl',title:'Snakes & Ladders',icon:'🐍',type:'board',cat:'multiplayer',
  col:PCBrand.h_00e676,mp:true,min:1,max:6,
  desc:'Classic board game! Climb ladders, dodge snakes. 1-6 players + bots.'
});

SnakesLadders._SNAKES  = {16:6, 47:26, 49:11, 56:53, 62:19, 64:60, 87:24, 93:73, 95:75, 99:78};
SnakesLadders._LADDERS = {4:14, 9:31, 20:38, 28:84, 40:59, 51:67, 63:81, 71:91};
SnakesLadders._COLS    = [PCBrand.h_ff2d78,PCBrand.h_00e676,PCBrand.h_ffd60a,PCBrand.h_00e5ff,PCBrand.h_c77dff,PCBrand.h_ff6b00];
SnakesLadders._EMOJIS  = ['🔴','🟢','🟡','🔵','🟣','🟠'];

SnakesLadders.setup = function(pl) {
  Game.prototype.setup.call(this, pl);
  this.gs = {
    players: pl.map(function(p, i) {
      return { id:p.id, name:p.name, av:p.av, col:SnakesLadders._COLS[i%6], emoji:SnakesLadders._EMOJIS[i%6], pos:0, isBot:p.isBot||false };
    }),
    turn:0, dice:0, phase:'roll', winner:null, log:[]
  };
};

SnakesLadders._cellPos = function(n, cell) {
  var row = Math.floor((n-1) / 10);
  var col = (n-1) % 10;
  if (row % 2 === 1) col = 9 - col;
  return { x: col * cell, y: (9 - row) * cell };
};

SnakesLadders.render = function() {
  var gs = this.gs, self = this;
  if (gs.winner) {
    this.done(gs.winner.name);
    this.showWin(gs.winner.name, gs.players.map(function(p) { return { n:p.name, s:'pos '+p.pos }; }));
    Ach.unlock('snl1');
    return;
  }
  var cur = gs.players[gs.turn % gs.players.length];
  var sz = Math.min(window.innerWidth - 28, 340);
  var cell = Math.floor(sz / 10); sz = cell * 10;

  document.getElementById('gbody').innerHTML =
    '<div style="padding:4px 0">' +
    '<div style="display:flex;gap:5px;overflow-x:auto;margin-bottom:10px;touch-action:pan-x">' +
    gs.players.map(function(p, i) {
      var active = i === gs.turn % gs.players.length;
      return '<div style="flex-shrink:0;text-align:center;padding:7px 10px;border-radius:13px;background:' + (active?p.col+'28':'rgba(255,255,255,.04)') + ';border:2px solid ' + (active?p.col:'transparent') + '">' +
        '<div style="font-size:.95rem">' + p.emoji + '</div>' +
        '<div style="font-size:.56rem;font-weight:700;margin-top:2px">' + p.name.slice(0,6) + '</div>' +
        '<div style="font-size:.54rem;opacity:.45">' + p.pos + '</div>' +
        (p.isBot ? '<div style="font-size:.46rem;color:var(--p5);font-weight:700">BOT</div>' : '') +
      '</div>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;justify-content:center;margin-bottom:11px">' +
    '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 ' + sz + ' ' + sz + '" style="border-radius:12px">' +
    self._buildSVG(sz, cell, gs) +
    '</svg></div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between">' +
      '<div style="flex:1">' +
        '<div style="font-weight:800;font-size:.9rem">' + cur.emoji + ' ' + cur.name + '</div>' +
        '<div style="font-size:.7rem;opacity:.38">' + (gs.phase==='roll'?'Tap the dice to roll':'') + '</div>' +
        (gs.log.length ? '<div style="font-size:.62rem;opacity:.32;margin-top:3px">' + gs.log[gs.log.length-1] + '</div>' : '') +
      '</div>' +
      '<div class="dice" id="snldice" onclick="window._snlroll()" style="opacity:' + (gs.phase==='roll'&&!cur.isBot?'1':'0.5') + '">' +
        (gs.dice ? ['','⚀','⚁','⚂','⚃','⚄','⚅'][gs.dice] : '🎲') +
      '</div>' +
    '</div></div>';

  window._snlroll = function() { if (gs.phase === 'roll' && !cur.isBot) self._roll(); };
  if (cur.isBot && gs.phase === 'roll') {
    setTimeout(function() { if (S.game === self) self._roll(); }, 850);
  }
};

SnakesLadders._buildSVG = function(sz, cell, gs) {
  var self = this;
  var html = '<rect width="' + sz + '" height="' + sz + '" fill=PCBrand.h_1a1a2e/>';
  for (var n = 1; n <= 100; n++) {
    var p = this._cellPos(n, cell);
    var isSnake = this._SNAKES[n], isLadder = this._LADDERS[n];
    var bg = isSnake ? 'rgba(255,45,85,.22)' : isLadder ? 'rgba(0,230,118,.22)' : ((n % 2 === 0) ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)');
    html += '<rect x="' + (p.x+.5) + '" y="' + (p.y+.5) + '" width="' + (cell-1) + '" height="' + (cell-1) + '" fill="' + bg + '" rx="2"/>';
    html += '<text x="' + (p.x+3) + '" y="' + (p.y+10) + '" font-size="' + Math.round(cell*.26) + '" fill="rgba(255,255,255,.28)" font-family="system-ui">' + n + '</text>';
    if (isSnake) html += '<text x="' + (p.x+cell/2) + '" y="' + (p.y+cell/2+5) + '" text-anchor="middle" font-size="' + Math.round(cell*.48) + '">🐍</text>';
    if (isLadder) html += '<text x="' + (p.x+cell/2) + '" y="' + (p.y+cell/2+5) + '" text-anchor="middle" font-size="' + Math.round(cell*.48) + '">🪜</text>';
  }
  // Snake lines
  Object.entries(this._SNAKES).forEach(function(e) {
    var f = self._cellPos(parseInt(e[0]), cell), t = self._cellPos(parseInt(e[1]), cell);
    html += '<line x1="' + (f.x+cell/2) + '" y1="' + (f.y+cell/2) + '" x2="' + (t.x+cell/2) + '" y2="' + (t.y+cell/2) + '" stroke=PCBrand.h_ff2d55 stroke-width="1.5" opacity=".35" stroke-dasharray="3"/>';
  });
  // Ladder lines
  Object.entries(this._LADDERS).forEach(function(e) {
    var f = self._cellPos(parseInt(e[0]), cell), t = self._cellPos(parseInt(e[1]), cell);
    html += '<line x1="' + (f.x+cell/2) + '" y1="' + (f.y+cell/2) + '" x2="' + (t.x+cell/2) + '" y2="' + (t.y+cell/2) + '" stroke=PCBrand.h_00e676 stroke-width="1.5" opacity=".35"/>';
  });
  // Pieces
  gs.players.forEach(function(p, pi) {
    if (p.pos === 0) return;
    var pos = self._cellPos(p.pos, cell);
    var ox = (pi % 2) * (cell * 0.28), oy = Math.floor(pi / 2) * (cell * 0.28);
    var cx = pos.x + cell/2 + ox - cell*0.14, cy = pos.y + cell/2 + oy - cell*0.14;
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + Math.round(cell*.26) + '" fill="' + p.col + '" stroke="rgba(0,0,0,.35)" stroke-width="2"/>';
    html += '<text x="' + cx + '" y="' + (cy+4) + '" text-anchor="middle" font-size="' + Math.round(cell*.24) + '">' + p.emoji + '</text>';
  });
  return html;
};

SnakesLadders._roll = function() {
  var gs = this.gs, self = this;
  if (gs.phase !== 'roll') return;
  var d = document.getElementById('snldice');
  if (d) d.classList.add('rolling');
  Snd.dice(); Hap.dice();
  setTimeout(function() {
    var roll = Math.floor(Math.random() * 6) + 1;
    gs.dice = roll;
    if (d) { d.classList.remove('rolling'); d.textContent = ['','⚀','⚁','⚂','⚃','⚄','⚅'][roll]; }
    var cur = gs.players[gs.turn % gs.players.length];
    var newPos = cur.pos + roll;
    if (newPos > 100) {
      gs.log.push(cur.name + ' needs exact — rolled ' + roll);
      setTimeout(function() { self._next(); }, 900);
      Nav.go('game'); self.render(); return;
    }
    cur.pos = newPos;
    var landed = false;
    // Snake
    if (self._SNAKES[newPos]) {
      var to = self._SNAKES[newPos];
      setTimeout(function() {
        cur.pos = to;
        gs.log.push('🐍 ' + cur.name + ' bitten! ' + newPos + '→' + to);
        toast('🐍 Snake! ' + cur.emoji + ' back to ' + to);
        Snd.err(); Hap.err();
        setTimeout(function() { self._next(); }, 700);
        Nav.go('game'); self.render();
      }, 400);
      landed = true;
    }
    // Ladder
    if (!landed && self._LADDERS[newPos]) {
      var to2 = self._LADDERS[newPos];
      setTimeout(function() {
        cur.pos = to2;
        gs.log.push('🪜 ' + cur.name + ' climbed! ' + newPos + '→' + to2);
        toast('🪜 Ladder! ' + cur.emoji + ' up to ' + to2);
        Snd.coin(); Hap.ok();
        if (to2 >= 100) { gs.winner = cur; Nav.go('game'); self.render(); return; }
        setTimeout(function() { self._next(); }, 700);
        Nav.go('game'); self.render();
      }, 400);
      landed = true;
    }
    if (!landed) {
      gs.log.push(cur.name + ' rolled ' + roll + ' → ' + newPos);
      if (newPos === 100) { gs.winner = cur; confetti(); Snd.win(); Nav.go('game'); self.render(); return; }
      if (roll === 6) {
        gs.phase = 'roll'; gs.dice = 0;
        Nav.go('game'); self.render();
        if (!cur.isBot) toast('🎲 Six! Roll again!');
        else setTimeout(function() { self._roll(); }, 700);
      } else {
        setTimeout(function() { self._next(); }, 500);
        Nav.go('game'); self.render();
      }
    }
  }, 520);
};

SnakesLadders._next = function() {
  var gs = this.gs;
  gs.turn++; gs.phase = 'roll'; gs.dice = 0;
  Nav.go('game'); this.render();
};

window._snlroll = function() { if (S.game && S.game.id === 'snl') S.game._roll(); };

// ── 12. BOT FOR CHESS (already in v6, patch Draughts too) ─────────
if (typeof Draughts !== 'undefined' && !Draughts._botPatched) {
  Draughts._botPatched = true;
  var _origDraughtsRender = Draughts.render.bind(Draughts);
  Draughts.render = function() {
    _origDraughtsRender();
    var gs = this.gs;
    if (gs && gs.players && gs.players[gs.turn] && gs.players[gs.turn].isBot) {
      var self = this;
      setTimeout(function() {
        if (!S.game || S.game.id !== 'draughts') return;
        var curCol = gs.turn === 0 ? 'w' : 'b';
        var moves = [];
        for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
          if (gs.board[r][c] && gs.board[r][c].col === curCol) {
            var m = Draughts._getMoves(gs.board, r, c);
            m.jumps.concat(m.moves).forEach(function(mv) { moves.push({r:r,c:c,move:mv}); });
          }
        }
        if (!moves.length) return;
        var pick = moves[Math.floor(Math.random() * moves.length)];
        if (window._dc) window._dc(pick.r, pick.c);
        setTimeout(function() {
          var pm = pick.move;
          if (window._dc) window._dc(pm[0], pm[1]);
        }, 400);
      }, 800);
    }
  };
}

// ── 13. REGISTER NEW GAMES ────────────────────────────────────────
setTimeout(function() {
  if (typeof Reg !== 'undefined') {
    [Ludo, SnakesLadders].forEach(function(g) {
      if (!Reg.get(g.id)) Reg.add(g);
    });
    // Rebuild UI
    if (typeof GL !== 'undefined') {
      GL._buildScrolls ? GL._buildScrolls() : null;
      GL._buildLib ? GL._buildLib('all') : null;
      GL._buildFeat ? GL._buildFeat() : null;
    }
    // Keep demo/stats games count = live registry
    if (S.prof && (S.prof.games !== Reg.list.length) && (S.prof.name === 'Demo Operative' || /[?&]demo=1(?:&|$)/.test(location.search))) {
      S.prof.games = Reg.list.length;
      Save.save();
    }
    // Update count
    var lc = document.getElementById('lib-count');
    if (lc) lc.textContent = Reg.list.length + ' games · Fully offline';
    // Add board row to home
    var br = document.getElementById('board-row');
    if (br && GL._buildScrollRow) {
      GL._buildScrollRow('board-row', Reg.board ? Reg.board() : []);
    }
    if (typeof UI !== 'undefined' && UI.home) UI.home();
  }
}, 800);

// ── 14. NOTIFICATION TOGGLE IN SETTINGS ──────────────────────────
setTimeout(function() {
  var settingsGlass = _profileSettingsGlass();
  if (settingsGlass && !document.getElementById('_nrow')) {
    var row = document.createElement('div');
    row.className = 'srow'; row.id = '_nrow';
    row.innerHTML = '<span style="font-size:.84rem;font-weight:600">🔔 Notifications</span><div class="tog ' + (S.cfg.notif ? 'on' : '') + '" id="tnotif" onclick="GL.togSet(\'notif\',this)"></div>';
    var rows = settingsGlass.querySelectorAll('.srow');
    if (rows.length) settingsGlass.insertBefore(row, rows[rows.length-1]);
    // Add music toggle
    var mrow = document.createElement('div');
    mrow.className = 'srow'; mrow.id = '_mrow';
    mrow.innerHTML = '<span style="font-size:.84rem;font-weight:600">🎵 Background Music</span><div class="tog ' + (S.cfg.music ? 'on' : '') + '" id="tmus" onclick="GL.togSet(\'music\',this)"></div>';
    settingsGlass.insertBefore(mrow, rows[rows.length-1]);
    var erow = document.createElement('div');
    erow.className = 'srow'; erow.id = '_erow';
    erow.innerHTML = '<span style="font-size:.84rem;font-weight:600">⚡ Eco / Low Power</span><div class="tog ' + (S.cfg.lowPower ? 'on' : '') + '" id="teco" onclick="window.__togEco(this)"></div>';
    settingsGlass.insertBefore(erow, mrow);
    var brow = document.createElement('div');
    brow.className = 'srow'; brow.id = '_brow';
    brow.innerHTML = '<span style="font-size:.84rem;font-weight:600">✨ Background Effects</span><div class="tog ' + (S.cfg.bg ? 'on' : '') + '" id="tbg2" onclick="GL.togSet(\'bg\',this)"></div>';
    settingsGlass.insertBefore(brow, erow);
    // Add friends button
    var frow = document.createElement('div');
    frow.className = 'srow'; frow.style.borderBottom = 'none';
    frow.innerHTML = '<span style="font-size:.84rem;font-weight:600">👥 Add Friend</span><button type="button" onclick="Friends.add()" style="padding:5px 12px;background:rgba(199,125,255,.15);border:1px solid rgba(199,125,255,.28);border-radius:9px;font-size:.72rem;cursor:pointer;color:var(--p6)">+ Add</button>';
    settingsGlass.appendChild(frow);
    // Device gate removed (P-PRSM-1) — no Change Device row
  }
}, 2500);

// DevSel.show — no-op (device gate removed)
DevSel.show = function() {
  toast('Layout follows your screen size automatically');
};

window.__togEco = function(el) {
  S.cfg.lowPower = !S.cfg.lowPower;
  S.cfg.perfMode = S.cfg.lowPower ? 'eco' : 'balanced';
  if (S.cfg.lowPower) S.cfg.bg = false;
  if (el) el.className = 'tog' + (S.cfg.lowPower ? ' on' : '');
  var bg2 = document.getElementById('tbg2'), bg0 = document.getElementById('tbg');
  if (bg2) bg2.className = 'tog' + (S.cfg.bg ? ' on' : '');
  if (bg0) bg0.className = 'tog' + (S.cfg.bg ? ' on' : '');
  if (typeof PrismPerf !== 'undefined') PrismPerf.apply();
  Save.save(); Snd.click();
  toast(S.cfg.lowPower ? '⚡ Eco mode ON' : '⚡ Eco mode OFF');
};

// ── 15. GL.togSet for music ───────────────────────────────────────
var _baseTogSet = GL.togSet.bind(GL);
GL.togSet = function(key, el) {
  if (key === 'music') { Music.toggle(); return; }
  if (key === 'notif') {
    S.cfg.notif = !S.cfg.notif;
    if (el) el.className = 'tog' + (S.cfg.notif ? ' on' : '');
    Save.save(); Snd.click();
    toast(S.cfg.notif ? '🔔 Notifications ON' : '🔕 Notifications OFF');
    return;
  }
  _baseTogSet(key, el);
};

// Override toast to respect notif setting (closure — never reuse global _baseToast)
(function () {
  var baseToast = window.toast;
  window.toast = function (msg, dur, dir) {
    var isCritical = msg && (String(msg).includes('❌') || String(msg).includes('Error') || String(msg).includes('Win'));
    if (!S.cfg.notif && !isCritical && !dir) return;
    baseToast(msg, dur, dir);
  };
})();

function _profileSettingsGlass() {
  var panels = document.querySelectorAll('#profile-screen .glass');
  for (var i = 0; i < panels.length; i++) {
    if (panels[i].querySelector('.srow')) return panels[i];
  }
  return null;
}

// ── 16. ADDITIONAL CSS TWEAKS (css/app-runtime.css) ──


// ── 17. BOARD ROW IN HOME SCREEN ─────────────────────────────────
setTimeout(function() {
  // Add board games row to home if not there
  var homeScreen = document.getElementById('home-screen');
  if (homeScreen && !document.getElementById('board-row')) {
    var shdr = document.createElement('div');
    shdr.className = 'shdr';
    shdr.style.marginTop = '5px';
    shdr.innerHTML = '<div class="sec">🎲 Board Games</div><div style="font-size:.72rem;opacity:.25;cursor:pointer" onclick="GL.filter(\'board\',null)">See All</div>';
    var row = document.createElement('div');
    row.id = 'board-row';
    row.className = 'hscroll';
    homeScreen.appendChild(shdr);
    homeScreen.appendChild(row);
  }
}, 1200);

// ── 18. ORIENT MANAGER ────────────────────────────────────────────
if (typeof OrientMgr === 'undefined') {
  var OrientMgr = {
    current: 'portrait',
    init: function() {
      var self = this;
      window.addEventListener('orientationchange', function() { setTimeout(function() { self._update(); }, 300); });
      this._update();
    },
    _update: function() {
      var isL = window.innerWidth > window.innerHeight;
      this.current = isL ? 'landscape' : 'portrait';
      document.body.setAttribute('data-orient', this.current);
      var btn = document.getElementById('orient-btn');
      if (btn) btn.textContent = isL ? '⟲' : '⟳';
    },
    toggle: function() {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock(this.current === 'portrait' ? 'landscape' : 'portrait').catch(function() { toast('Rotate your device to switch'); });
      } else { toast('Rotate your device to switch'); }
      Snd.click(); Hap.l();
    }
  };
}

// Run orient init
OrientMgr.init();

// ── 19. CORE STABILITY + PWA + PROGRESSION LAYER (single-file safe) ──
(function(){
  if (window.__prismCorePatched) return;
  window.__prismCorePatched = true;

  var K = {
    main: 'po5',
    backup: 'po5_backup',
    prog: 'po5_prog_v1',
    recents: 'po5_recent_v1',
    favs: 'po5_favs_v1'
  };

  function jget(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){
      return fallback;
    }
  }
  function jset(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
  }

  // Save hardening to mitigate storage corruption.
  if (window.Save && typeof Save.save === 'function' && typeof Save.load === 'function') {
    var _save0 = Save.save.bind(Save);
    var _load0 = Save.load.bind(Save);
    Save.save = function(){
      _save0();
      try{
        var raw = localStorage.getItem(K.main);
        if (raw) localStorage.setItem(K.backup, raw);
      }catch(e){}
    };
    Save.load = function(){
      _load0();
      try{
        var mainRaw = localStorage.getItem(K.main);
        var parsed = mainRaw ? JSON.parse(mainRaw) : null;
        if (!parsed || typeof parsed !== 'object') throw new Error('bad save');
      }catch(e){
        try{
          var bk = localStorage.getItem(K.backup);
          if (bk) {
            localStorage.setItem(K.main, bk);
            _load0();
            toast('Recovered save from backup');
          }
        }catch(_e){}
      }
      if (S && S.cfg) {
        if (typeof S.cfg.lowPower !== 'boolean') S.cfg.lowPower = true;
        if (!S.cfg.perfMode) S.cfg.perfMode = 'eco';
        if (typeof S.cfg.music !== 'boolean') S.cfg.music = false;
        if (typeof S.cfg.bg !== 'boolean') S.cfg.bg = false;
        if (typeof PrismPerf !== 'undefined') PrismPerf.apply();
      }
    };
  }

  // Progressive profile systems (XP streaks, daily rewards, trophies, stats).
  var Prog = {
    data: {
      xp: 0,
      rank: 'Rookie',
      streak: 0,
      lastDaily: '',
      lastClaimDate: '',
      dailyClaimed: false,
      sessions: 0,
      playTimeMs: 0,
      gamesById: {},
      trophies: [],
      badges: []
    },
    ranks: [
      { name:'Rookie', min:0 },
      { name:'Bronze', min:300 },
      { name:'Silver', min:900 },
      { name:'Gold', min:1800 },
      { name:'Platinum', min:3200 },
      { name:'Neon Elite', min:5200 }
    ],
    load: function(){
      var d = jget(K.prog, null);
      if (d && typeof d === 'object') Object.assign(this.data, d);
      this._rollDay();
      this._syncRank();
    },
    save: function(){ jset(K.prog, this.data); },
    _today: function(){ return new Date().toISOString().slice(0,10); },
    _rollDay: function(){
      var t = this._today();
      if (this.data.lastDaily === t) return;
      var prev = this.data.lastDaily;
      if (prev) {
        if (!this.data.dailyClaimed) this.data.streak = 0;
        else {
          var prevD = new Date(prev + 'T12:00:00');
          var todayD = new Date(t + 'T12:00:00');
          var gap = Math.round((todayD - prevD) / 86400000);
          if (gap > 1) this.data.streak = 0;
        }
      }
      this.data.lastDaily = t;
      this.data.dailyClaimed = false;
    },
    _syncRank: function(){
      var r = this.ranks[0].name;
      for (var i=0;i<this.ranks.length;i++){
        if (this.data.xp >= this.ranks[i].min) r = this.ranks[i].name;
      }
      this.data.rank = r;
    },
    addXP: function(n, reason){
      n = Math.max(0, n|0);
      if (!n) return;
      this.data.xp += n;
      this._syncRank();
      this.unlockByProgress();
      this.save();
      if (window.toast) toast('+'+n+' XP' + (reason ? ' · '+reason : ''));
    },
    markPlayed: function(gameId){
      if (!gameId) return;
      this.data.gamesById[gameId] = (this.data.gamesById[gameId] || 0) + 1;
      this.save();
    },
    unlockByProgress: function(){
      if (this.data.xp >= 1000 && this.data.trophies.indexOf('xp1000') === -1) {
        this.data.trophies.push('xp1000');
        if (window.toast) toast('🏆 Trophy Unlocked: XP Surge');
      }
      if (this.data.streak >= 7 && this.data.badges.indexOf('streak7') === -1) {
        this.data.badges.push('streak7');
        if (window.toast) toast('🎖️ Badge Unlocked: 7-Day Streak');
      }
    },
    claimDaily: function(){
      this._rollDay();
      var t = this._today();
      if (this.data.dailyClaimed) { toast('Daily reward already claimed'); return; }
      var y = new Date();
      y.setDate(y.getDate() - 1);
      var yStr = y.toISOString().slice(0,10);
      if (this.data.lastClaimDate === yStr) this.data.streak = (this.data.streak || 0) + 1;
      else if (this.data.lastClaimDate !== t) this.data.streak = Math.max(1, this.data.streak || 1);
      this.data.dailyClaimed = true;
      this.data.lastClaimDate = t;
      var reward = 40 + Math.min(120, Math.max(0, this.data.streak - 1) * 5);
      this.addXP(reward, 'Daily Reward');
      this.save();
      if (window.Snd && Snd.ok) Snd.ok();
      if (window.Hap && Hap.ok) Hap.ok();
    }
  };
  Prog.load();

  // Recently played + favorites + recommendations.
  var Rec = {
    recent: jget(K.recents, []),
    favs: jget(K.favs, []),
    addRecent: function(game){
      if (!game || !game.id) return;
      this.recent = this.recent.filter(function(x){ return x.id !== game.id; });
      this.recent.unshift({ id:game.id, title:game.title, icon:game.icon, col:game.col, ts:Date.now() });
      if (this.recent.length > 10) this.recent.length = 10;
      jset(K.recents, this.recent);
    },
    toggleFav: function(game){
      if (!game || !game.id) return;
      var i = this.favs.indexOf(game.id);
      if (i === -1) this.favs.push(game.id);
      else this.favs.splice(i,1);
      jset(K.favs, this.favs);
      toast(i === -1 ? 'Added to favorites' : 'Removed from favorites');
      this.render();
    },
    isFav: function(id){ return this.favs.indexOf(id) > -1; },
    topRecs: function(){
      var gb = Prog.data.gamesById || {};
      var keys = Object.keys(gb).sort(function(a,b){ return gb[b]-gb[a]; }).slice(0,3);
      var out = [];
      keys.forEach(function(id){
        if (window.Reg && Reg.get) {
          var g = Reg.get(id);
          if (g) out.push(g);
        }
      });
      if (!out.length && window.Reg && Reg.list && Reg.list.length) out = Reg.list.slice(0,3);
      return out;
    },
    ensureHost: function(){
      var home = document.getElementById('home-screen');
      if (!home) return null;
      var host = document.getElementById('smart-hub');
      if (!host) {
        host = document.createElement('div');
        host.id = 'smart-hub';
        host.className = 'glass';
        host.style.cssText = 'margin:10px 15px 12px;padding:12px;border-radius:16px';
        home.insertBefore(host, home.children[2] || null);
      }
      return host;
    },
    render: function(){
      var host = this.ensureHost();
      if (!host) return;
      var recents = this.recent.slice(0,4);
      var recentIds = {}; recents.forEach(function(x){ recentIds[x.id]=1; });
      var recs = this.topRecs().filter(function(g){ return g && !recentIds[g.id]; });
      if (!recs.length) recs = this.topRecs().filter(function(g){ return g && !recentIds[g.id]; }).slice(0,2);
      if (!recs.length) recs = (window.Reg && Reg.list ? Reg.list : []).filter(function(g){ return g && !recentIds[g.id]; }).slice(0,2);
      var lvl = (typeof XP !== 'undefined') ? XP.lvl((S.prof && S.prof.xp) || 0) : ((S.prof && S.prof.lvl) || 1);
      var rank = (typeof XP !== 'undefined' && XP.rank) ? XP.rank(lvl) : (Prog.data.rank || 'Rookie');
      var xpShow = (S.prof && typeof S.prof.xp === 'number') ? S.prof.xp : (Prog.data.xp || 0);
      host.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<div class="sec">Smart Hub</div>' +
          '<button type="button" class="btn bg bsm" style="padding:6px 10px;'+(Prog.data.dailyClaimed?'opacity:.45':'')+'" onclick="window.__claimDaily()">'+(Prog.data.dailyClaimed?'✓ Daily':'🎁 Daily')+'</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">' +
          '<div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)">' +
            '<div style="font-size:.58rem;opacity:.45;text-transform:uppercase;letter-spacing:.08em">Rank</div>' +
            '<div style="font-weight:800;margin-top:4px">' + rank + '</div>' +
            '<div style="font-size:.7rem;opacity:.45;margin-top:2px">LV' + lvl + ' · ' + xpShow + ' XP</div>' +
          '</div>' +
          '<div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)">' +
            '<div style="font-size:.58rem;opacity:.45;text-transform:uppercase;letter-spacing:.08em">Streak</div>' +
            '<div style="font-weight:800;margin-top:4px">' + Prog.data.streak + ' days</div>' +
            '<div style="font-size:.7rem;opacity:.45;margin-top:2px">' + (Prog.data.dailyClaimed ? 'Claimed today' : 'Reward ready') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:.62rem;opacity:.45;margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em">Recently Played</div>' +
        '<div style="display:flex;gap:7px;overflow-x:auto;margin-bottom:8px">' +
          (recents.length ? recents.map(function(x){
            return '<button type="button" class="btn bg bsm" style="padding:8px 10px;white-space:nowrap" onclick="GL.launch(\''+x.id+'\')">'+x.icon+' '+x.title+'</button>';
          }).join('') : '<div style="font-size:.75rem;opacity:.35">No recent games yet.</div>') +
        '</div>' +
        '<div style="font-size:.62rem;opacity:.45;margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em">Recommended</div>' +
        (function(){
          var next = (Meta.unlockables || []).find(function(u){ return !Meta.isUnlocked(u.id); });
          var hint = next ? '<div style="font-size:.72rem;opacity:.38;margin-bottom:8px;line-height:1.45">Next unlock: <strong style="opacity:.85">'+next.icon+' '+next.name+'</strong> · '+Meta.getProgress(next.id)+'%</div>' : '';
          return hint;
        })() +
        '<div style="display:flex;gap:7px;overflow-x:auto">' +
          (recs.length ? recs.map(function(g){
            var star = Rec.isFav(g.id) ? '★' : '☆';
            return '<div style="display:flex;gap:4px;align-items:center">' +
              '<button type="button" class="btn bg bsm" style="padding:8px 10px;white-space:nowrap" onclick="GL.launch(\''+g.id+'\')">'+g.icon+' '+g.title+'</button>' +
              '<button type="button" class="btn bg bsm" style="padding:8px 8px" aria-label="Favorite '+g.title+'" onclick="window.__fav(\''+g.id+'\')">'+star+'</button>' +
            '</div>';
          }).join('') : '<div style="font-size:.75rem;opacity:.35">Play a few games for picks.</div>') +
        '</div>';
    }
  };
  window.__fav = function(id){ if (window.Reg && Reg.get) Rec.toggleFav(Reg.get(id)); };
  window.__claimDaily = function(){ Prog.claimDaily(); Rec.render(); };

  // Launch tracking hook.
  if (window.GL && typeof GL.launch === 'function') {
    var _launch = GL.launch.bind(GL);
    GL.launch = function(id){
      var g = (window.Reg && Reg.get) ? Reg.get(id) : null;
      if (g) {
        Rec.addRecent(g);
        Prog.markPlayed(g.id);
        Prog.addXP(5, 'Game Launch');
      }
      _launch(id);
      setTimeout(function(){ Rec.render(); }, 50);
    };
  }

  // Lightweight FPS monitor + auto low-power fallback.
  var Perf = {
    frames: 0,
    last: performance.now(),
    fps: 60,
    lowFPSStreak: 0,
    tick: function(ts){
      this.frames++;
      var dt = ts - this.last;
      if (dt >= 1000) {
        this.fps = Math.round((this.frames * 1000) / dt);
        this.frames = 0;
        this.last = ts;
        var hud = document.getElementById('perf-hud');
        if (hud) hud.textContent = this.fps + ' FPS · ' + (S.cfg.perfMode || 'balanced');
        if (this.fps < 45) this.lowFPSStreak++; else this.lowFPSStreak = 0;
        if (this.lowFPSStreak >= 5 && !S.cfg.lowPower) {
          S.cfg.lowPower = true;
          S.cfg.bg = false;
          S.cfg.perfMode = 'eco';
          if (window.PrismPerf) PrismPerf.apply();
          if (window.toast) toast('Auto switched to Eco mode');
          if (window.Save && Save.save) Save.save();
        }
      }
      requestAnimationFrame(this.tick.bind(this));
    },
    init: function(){
      if (window.PrismPerf && PrismPerf.isDebug() && !document.getElementById('perf-hud')) {
        var el = document.createElement('div');
        el.id = 'perf-hud';
        el.style.cssText = 'position:fixed;left:10px;top:calc(var(--sat) + 8px);z-index:260;font:700 .62rem/1.2 ui-monospace,Menlo,monospace;padding:6px 8px;border-radius:10px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.14);opacity:.78;backdrop-filter:blur(14px)';
        el.textContent = '60 FPS · ' + (S.cfg.perfMode || 'eco');
        document.body.appendChild(el);
      }
      if (!this._started) { this._started = true; requestAnimationFrame(this.tick.bind(this)); }
    }
  };

  // PWA manifest + install + service worker bootstrap (single-file compatible).
  var PWA = {
    deferred: null,
    addManifest: function(){
      try{
        var m = {
          name: 'PrismCap',
          short_name: 'PrismCap',
          start_url: './',
          display: 'standalone',
          background_color: PCBrand.h_000000,
          theme_color: PCBrand.h_000000,
          orientation: 'any',
          icons: [
            { src: this._svgIcon(PCBrand.h_0a0a0f,PCBrand.h_c77dff), sizes:'192x192', type:'image/svg+xml', purpose:'any maskable' },
            { src: this._svgIcon(PCBrand.h_000000,PCBrand.h_00e5ff), sizes:'512x512', type:'image/svg+xml', purpose:'any maskable' }
          ]
        };
        var blob = new Blob([JSON.stringify(m)], {type:'application/manifest+json'});
        var url = URL.createObjectURL(blob);
        var l = document.createElement('link');
        l.rel = 'manifest';
        l.href = url;
        document.head.appendChild(l);
      }catch(e){}
    },
    _svgIcon: function(bg, fg){
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="'+bg+'"/><circle cx="256" cy="256" r="146" fill="none" stroke="'+fg+'" stroke-width="28"/><circle cx="256" cy="256" r="46" fill="'+fg+'"/></svg>';
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    },
    bindInstall: function(){
      var self = this;
      window.addEventListener('beforeinstallprompt', function(e){
        e.preventDefault();
        self.deferred = e;
        self.showInstallUI(true);
      }, { passive:false });
      window.addEventListener('appinstalled', function(){
        self.showInstallUI(false);
        toast('PrismCap installed');
      });
    },
    showInstallUI: function(show){
      var b = document.getElementById('install-btn');
      if (!b && show) {
        b = document.createElement('button');
        b.id = 'install-btn';
        b.className = 'btn bg bsm';
        b.style.cssText = 'position:fixed;right:10px;top:calc(var(--sat) + 8px);z-index:260;padding:8px 10px';
        b.textContent = 'Install';
        b.onclick = this.install.bind(this);
        document.body.appendChild(b);
      }
      if (b) b.style.display = show ? 'inline-flex' : 'none';
    },
    install: async function(){
      if (!this.deferred) return toast('Install not available yet');
      try{
        await this.deferred.prompt();
        this.deferred = null;
        this.showInstallUI(false);
      }catch(e){}
    },
    registerSW: function(){
      if (!('serviceWorker' in navigator)) return;
      navigator.serviceWorker.register('./sw.js?v=453').catch(function(){});
    }
  };

  // App lifecycle tuning to reduce battery drain.
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) {
      if (window.releaseWakeLock) try{ window.releaseWakeLock(); }catch(e){}
    } else if (S && S.cur === 'game') {
      if (window.requestWakeLock) try{ window.requestWakeLock(); }catch(e){}
    }
  }, {passive:true});

  // Keyboard usability.
  window.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && window.GL && GL.requestLeave && S && S.cur === 'game') GL.requestLeave();
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('ni')) {
      document.activeElement.click();
    }
  });

  // Boot
  window.Prog = Prog;
  window.Rec = Rec;
  PWA.bindInstall();
  PWA.registerSW();
  Perf.init();
  Prog.data.sessions = (Prog.data.sessions || 0) + 1;
  Prog.save();
  // Defer hub paint until Save/demo ran (DOMContentLoaded) + scrolls exist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(function(){ Rec.render(); }, 50); });
  } else {
    setTimeout(function(){ Rec.render(); }, 50);
  }
})();


