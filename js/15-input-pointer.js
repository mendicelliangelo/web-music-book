'use strict';
/* ---------- 13. Tocco, mouse e tastiera ---------- */
function locate(cx,cy){
  const r=svgEl.getBoundingClientRect(),k=lay.width/(r.width||lay.width),x=(cx-r.left)*k,y=(cy-r.top)*k,S=lay.S,H=S/2;
  let si=lay.systems.findIndex(s=>y<s.top+s.h+S*.2);if(si<0)si=lay.systems.length-1;
  const sy=lay.systems[si];
  let kS=0;if(lay.nS>1&&y>(sy.staff[0].yBot+sy.staff[1].yTop)/2)kS=1;
  const sf=sy.staff[kS],clef=state.staves[kS].clef,bd=CLEFS[clef].bottomD,pos=Math.max(-6,Math.min(14,Math.round((sf.yBot-y)/H)));
  const X=lay.X[kS];let hit=-1,hitN=-1;
  for(const c of sy.items){
    const i=c.ev[kS];if(i<0)continue;
    const e=X.ev[i],g=X.geo[i];
    if(e.r){if(Math.abs(x-c.cx)<=S*.85&&Math.abs(y-(sf.yBot-2*S))<=S*1.5){hit=i;break}continue}
    for(let j=0;j<g.pos.length;j++){
      if(Math.abs(x-(c.cx+g.disp[j]*S*1.1))<=S*.85&&Math.abs(y-(sf.yBot-g.pos[j]*H))<=S*.8){hit=i;hitN=j;break}
    }
    if(hit>=0)break;
  }
  let ins=X.ev.length;
  for(let i=0;i<X.ev.length;i++){const p=lay.evPos[kS][i];if(p&&(p.sys>si||(p.sys===si&&p.col.cx>x))){ins=i;break}}
  return{x,y,pos,hit,hitN,ins,d:bd+pos,sy,sf,kS};
}
$('score').addEventListener('click',ev=>{
  if(!svgEl)return;
  const h=locate(ev.clientX,ev.clientY);
  if(h.hit>=0){select(h.hit,h.hitN,h.kS,ev.shiftKey);return}
  if(h.kS!==state.as){state.as=h.kS;state.kbOct=CLEFS[state.staves[h.kS].clef].kbOct;buildKeys()}
  const was=state.tool.chord;if(ev.shiftKey)state.tool.chord=true;
  const a=state.tool.acc!==null?state.tool.acc:keyAlter(state.key,h.d%7);
  insertNote(h.ins,h.d,a);
  state.tool.chord=was;
  updateChrome();
});
$('score').addEventListener('pointermove',ev=>{
  if(ev.pointerType!=='mouse'||!svgEl||!ghost)return;
  const h=locate(ev.clientX,ev.clientY),S=lay.S,H=S/2;
  if(h.hit>=0){ghost.style.display='none';$('readout').textContent=t('sheet.readoutSel');return}
  const y=h.sf.yBot-h.pos*H;
  ghost.style.display='';ghost.setAttribute('transform',`translate(${f1(h.x)} ${f1(y)})`);
  let lg='';
  if(h.pos<=-2)for(let p=-2;p>=h.pos;p-=2)lg+=`M${f1(-S*1.05)} ${f1((h.pos-p)*H)}H${f1(S*1.05)}`;
  if(h.pos>=10)for(let p=10;p<=h.pos;p+=2)lg+=`M${f1(-S*1.05)} ${f1((h.pos-p)*H)}H${f1(S*1.05)}`;
  $('ghostLed').setAttribute('d',lg);
  const a=state.tool.acc!==null?state.tool.acc:keyAlter(state.key,h.d%7);
  $('readout').textContent=`${state.nS>1?t('sheet.readoutStaff')+' '+(h.kS+1)+' · ':''}${noteLabel({d:h.d,a})} · ${durLabel(state.tool.dur,state.tool.dot)}`;
});
$('score').addEventListener('pointerleave',()=>{if(ghost)ghost.style.display='none';$('readout').textContent=''});
$('warn').addEventListener('click',e=>{if(e.target.closest('#fixBars'))fixBars()});

const blurIfMouse=e=>{if(e.detail)e.currentTarget.blur()};
$('durs').addEventListener('click',e=>{const b=e.target.closest('.dur');if(!b)return;setDur(b.dataset.v);if(e.detail)b.blur()});
$('btnDot').addEventListener('click',e=>{toggleDot();blurIfMouse(e)});
$('btnSharp').addEventListener('click',e=>{setAcc(1);blurIfMouse(e)});
$('btnFlat').addEventListener('click',e=>{setAcc(-1);blurIfMouse(e)});
$('btnNat').addEventListener('click',e=>{setAcc(0);blurIfMouse(e)});
$('btnChord').addEventListener('click',e=>{state.tool.chord=!state.tool.chord;updateChrome();blurIfMouse(e)});
$('btnTie').addEventListener('click',e=>{toggleTie();blurIfMouse(e)});
$('btnRest').addEventListener('click',e=>{addRest();blurIfMouse(e)});
$('btnDel').addEventListener('click',e=>{delBack();blurIfMouse(e)});
$('kbDel').addEventListener('click',e=>{delBack();blurIfMouse(e)});
$('play').addEventListener('click',e=>{togglePlay();blurIfMouse(e)});
$('undoBtn').addEventListener('click',e=>{undo();blurIfMouse(e)});
$('redoBtn').addEventListener('click',e=>{redo();blurIfMouse(e)});
Object.entries({xOctDn:-12,xToneDn:-2,xSemiDn:-1,xSemiUp:1,xToneUp:2,xOctUp:12}).forEach(([id,s])=>
  $(id).addEventListener('click',e=>{transposeBy(s);blurIfMouse(e)}));
$('xDouble').addEventListener('click',e=>{rescaleDur(1);blurIfMouse(e)});
$('xHalf').addEventListener('click',e=>{rescaleDur(-1);blurIfMouse(e)});
document.querySelectorAll('.dynbtn').forEach(b=>b.addEventListener('click',e=>{setDyn(b.dataset.dy);blurIfMouse(e)}));
$('btnStac').addEventListener('click',e=>{toggleMark('st');blurIfMouse(e)});
$('btnAcc').addEventListener('click',e=>{toggleMark('ac');blurIfMouse(e)});
$('btnSlur').addEventListener('click',e=>{toggleSlur();blurIfMouse(e)});
$('btnClearMk').addEventListener('click',e=>{clearMarks();blurIfMouse(e)});
$('btnSelAll').addEventListener('click',e=>{selectAll();blurIfMouse(e)});
$('btnCopy').addEventListener('click',e=>{copySel(false);blurIfMouse(e)});
$('btnCut').addEventListener('click',e=>{copySel(true);blurIfMouse(e)});
$('btnPaste').addEventListener('click',e=>{pasteClip();blurIfMouse(e)});
$('btnRepeatBar').addEventListener('click',e=>{repeatMeasure();blurIfMouse(e)});
$('btnPedal').addEventListener('click',e=>{togglePedal();blurIfMouse(e)});
$('btnFermata').addEventListener('click',e=>{toggleFermata();blurIfMouse(e)});
$('btnTrill').addEventListener('click',e=>{toggleTrill();blurIfMouse(e)});
$('btnMordent').addEventListener('click',e=>{toggleMordent();blurIfMouse(e)});
$('btnCresc').addEventListener('click',e=>{toggleHairpin('cr');blurIfMouse(e)});
$('btnDim').addEventListener('click',e=>{toggleHairpin('dim');blurIfMouse(e)});
$('btnLyric').addEventListener('click',e=>{setLyric($('lyrText').value);$('lyrText').value='';blurIfMouse(e)});
$('btnChord').addEventListener('click',e=>{setChord($('chordText').value);$('chordText').value='';blurIfMouse(e)});
$('btnOver').addEventListener('click',e=>{toggleOver();blurIfMouse(e)});

/* tasti del pianoforte: pressione e rilascio servono alla registrazione; da tastiera del computer basta un clic */
const uiDown=new Map();
$('piano').addEventListener('pointerdown',e=>{
  const b=e.target.closest('button');if(!b)return;
  const m=+b.dataset.m;uiDown.set(e.pointerId,{m,b});b.classList.add('dn');noteOn(m,e.timeStamp);
});
const release=e=>{const d=uiDown.get(e.pointerId);if(!d)return;uiDown.delete(e.pointerId);d.b.classList.remove('dn');noteOff(d.m,e.timeStamp)};
document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);
$('piano').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||e.detail!==0)return;
  const m=+b.dataset.m;noteOn(m,performance.now());noteOff(m,performance.now()+120);
});
function togglePc(){
  state.tool.pc=!state.tool.pc;$('btnPc').setAttribute('aria-pressed',String(state.tool.pc));$('piano').classList.toggle('pc',state.tool.pc);
  try{localStorage.setItem('quaderno-musica-pc',state.tool.pc?'1':'0')}catch(_){}
  if(state.tool.pc)toast(t('t.pcOn'));
}
$('btnPc').addEventListener('click',e=>{togglePc();blurIfMouse(e)});
try{if(localStorage.getItem('quaderno-musica-pc')==='1'){state.tool.pc=true;$('btnPc').setAttribute('aria-pressed','true')}}catch(_){}
$('pcLayout').addEventListener('change',e=>{
  state.tool.pcLayout=e.target.value;try{localStorage.setItem('quaderno-musica-pclayout',e.target.value)}catch(_){}
  buildKeys();e.target.blur();
  if(state.tool.pc)toast(state.tool.pcLayout==='center'?t('t.pcLayoutCenterToast'):t('t.pcLayoutTrackerToast'));
});
function toggleTimed(){
  state.tool.timed=!state.tool.timed;$('btnTimed').setAttribute('aria-pressed',String(state.tool.timed));
  $('holdInfo').textContent='';
  if(state.tool.timed)toast(t('t.timedOn'));
}
const metro={on:false,timer:0,next:0,n:0,bpm:108};
function pulseDot(delayMs,accent){
  setTimeout(()=>{
    const d=$('metroDot');if(!d)return;
    d.classList.remove('pulse','accent');void d.offsetWidth;d.classList.add('pulse');if(accent)d.classList.add('accent');
  },Math.max(0,delayMs));
}
function toggleMetro(){
  if(metro.on){metro.on=false;clearInterval(metro.timer);$('btnMetro').setAttribute('aria-pressed','false');return}
  const ac=audio();if(!ac){toast(t('t.noAudio'));return}
  metro.on=true;metro.n=0;metro.next=ac.currentTime+.1;metro.bpm=state.bpm;$('btnMetro').setAttribute('aria-pressed','true');
  metro.timer=setInterval(()=>{
    const ac2=synth.ac,per=Math.max(1,Math.round(btNow()/beatTicksOf(state.meter)));
    while(metro.next<ac2.currentTime+.4){
      const accent=metro.n%per===0;
      if(metro.n>0&&accent&&$('metroGrow').checked)metro.bpm=Math.min(240,metro.bpm+2);
      click(metro.next,accent);
      pulseDot((metro.next-ac2.currentTime)*1000,accent);
      metro.n++;metro.next+=60/metro.bpm*(beatTicksOf(state.meter)/PPQ);
    }
  },60);
}
$('btnTimed').addEventListener('click',e=>{toggleTimed();blurIfMouse(e)});
$('btnMetro').addEventListener('click',e=>{toggleMetro();blurIfMouse(e)});
$('kbNames').addEventListener('change',e=>{try{localStorage.setItem('quaderno-musica-kbnames',e.target.value)}catch(_){}buildKeys();e.target.blur()});
function setOct(o){state.kbOct=Math.max(1,Math.min(6,o));buildKeys();updateChrome()}
$('octDown').addEventListener('click',()=>setOct(state.kbOct-1));
$('octUp').addEventListener('click',()=>setOct(state.kbOct+1));
$('btnRec').addEventListener('click',e=>{recS.on?stopRec():startRec();blurIfMouse(e)});
$('btnMidi').addEventListener('click',e=>{connectMidi();blurIfMouse(e)});
$('btnMicRec').addEventListener('click',e=>{toggleMicRec();blurIfMouse(e)});
$('earMode').addEventListener('change',()=>{buildEarAnswers();$('earFeedback').textContent=''});
$('earNewBtn').addEventListener('click',e=>{earNew();blurIfMouse(e)});
$('earReplayBtn').addEventListener('click',e=>{earPlayPrompt();blurIfMouse(e)});
$('earAnswers').addEventListener('click',e=>{
  const b=e.target.closest('button[data-v]');if(!b)return;
  earCheck(b.getAttribute('data-v'));blurIfMouse(e);
});

function onClefChange(k,v){stopPlay();state.staves[k].clef=v;if(k===state.as){state.kbOct=CLEFS[v].kbOct;buildKeys()}render()}
$('clef0').addEventListener('change',e=>onClefChange(0,e.target.value));
$('clef1').addEventListener('change',e=>onClefChange(1,e.target.value));
$('key').addEventListener('change',e=>{stopPlay();state.key=+e.target.value;render()});
$('meter').addEventListener('change',e=>{stopPlay();state.meter=e.target.value;render()});
$('nS').addEventListener('change',e=>{stopPlay();state.nS=+e.target.value;if(state.as>=state.nS){state.as=0;state.cur=EV().length;state.sel=-1;state.selN=-1}render()});
$('inst').addEventListener('change',e=>{stopPlay();state.inst=e.target.value;render();beep(noteMidi({d:bdA()+2,a:0}))});
function setBpm(v){const b=Math.round(+v);if(!(b>=30&&b<=240))return;stopPlay();state.bpm=b;render()}
$('bpmRange').addEventListener('input',e=>setBpm(e.target.value));
$('bpm').addEventListener('change',e=>{const b=Math.max(30,Math.min(240,Math.round(+e.target.value)||state.bpm));setBpm(b);$('bpm').value=state.bpm});
$('title').addEventListener('input',e=>{state.title=e.target.value;save()});
$('zoom').addEventListener('input',e=>{state.zoom=Math.max(.7,Math.min(2,(+e.target.value||100)/100));render()});
$('measureNumEvery').addEventListener('change',e=>{state.measureNumEvery=+e.target.value||0;render()});
$('noteNames').addEventListener('change',e=>{state.noteNames=e.target.checked;render()});
$('noteColors').addEventListener('change',e=>{state.noteColors=e.target.checked;render()});
$('staffColors').addEventListener('change',e=>{state.staffColors=e.target.checked;render()});
$('handwritten').addEventListener('change',e=>{state.handwritten=e.target.checked;document.documentElement.classList.toggle('handwritten',e.target.checked);save()});
$('playbackRate').addEventListener('input',e=>{state.playbackRate=Math.max(.5,Math.min(1,(+e.target.value||100)/100));$('playbackRateLabel').textContent=Math.round(state.playbackRate*100)+'%';save()});
$('loopSel').addEventListener('change',e=>{state.loopSel=e.target.checked;save()});
$('swing').addEventListener('change',e=>{state.swing=e.target.checked;save()});
$('stereoStaves').addEventListener('change',e=>{state.stereoStaves=e.target.checked;save()});
$('reverb').addEventListener('input',e=>{
  state.reverb=Math.max(0,Math.min(1,(+e.target.value||0)/100));$('reverbLabel').textContent=Math.round(state.reverb*100)+'%';
  if(synth.reverbWet)synth.reverbWet.gain.value=state.reverb;
  save();
});
[0,1].forEach(k=>{
  $('solo'+k).addEventListener('change',e=>{state.staveMix[k].solo=e.target.checked});
  $('mute'+k).addEventListener('change',e=>{state.staveMix[k].mute=e.target.checked});
  $('vol'+k).addEventListener('input',e=>{state.staveMix[k].vol=Math.max(0,Math.min(1,(+e.target.value||0)/100))});
});
$('btnRehearsal').addEventListener('click',e=>{setRehearsalMark($('rehLetter').value);$('rehLetter').value='';blurIfMouse(e)});
$('themeSel').addEventListener('change',e=>{
  const v=e.target.value;
  if(v==='light'||v==='dark')document.documentElement.setAttribute('data-theme',v);
  else document.documentElement.removeAttribute('data-theme');
  try{localStorage.setItem('quaderno-musica-theme',v)}catch(_){}
});

function switchStaff(dir){
  if(state.nS<2)return;
  const n=Math.max(0,Math.min(state.nS-1,state.as+dir));if(n===state.as)return;
  state.as=n;state.cur=EV().length;state.sel=-1;state.selN=-1;state.kbOct=CLEFS[state.staves[n].clef].kbOct;buildKeys();render();
}
const keyHeld=new Map(),pcHeld=new Map();
document.addEventListener('keyup',e=>{
  if(pcHeld.has(e.code)){
    const m=pcHeld.get(e.code);pcHeld.delete(e.code);
    const el=$('piano').querySelector(`[data-m="${m}"]`);if(el)el.classList.remove('dn');
    noteOff(m,performance.now());
  }
});
document.addEventListener('keyup',e=>{
  const L=e.key&&e.key.length===1?'cdefgab'.indexOf(e.key.toLowerCase()):-1;
  if(L>=0&&keyHeld.has(L)){const m=keyHeld.get(L);keyHeld.delete(L);noteOff(m,performance.now())}
});
document.addEventListener('keydown',e=>{
  const t2=e.target,tag=t2&&t2.tagName;
  if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA'||(t2&&t2.isContentEditable))return;
  if(e.metaKey||e.ctrlKey){
    const k=e.key.toLowerCase();
    if(k==='z'){e.preventDefault();e.shiftKey?redo():undo()}
    else if(k==='y'){e.preventDefault();redo()}
    else if(k==='c'){e.preventDefault();copySel(false)}
    else if(k==='x'){e.preventDefault();copySel(true)}
    else if(k==='v'){e.preventDefault();pasteClip()}
    else if(k==='a'){e.preventDefault();selectAll()}
    return;
  }
  if(e.altKey)return;
  if(state.tool.pc&&pcByCode(e.code)&&tag!=='SELECT'){
    e.preventDefault();if(e.repeat||pcHeld.has(e.code))return;
    const m=12*(state.kbOct+1)+pcByCode(e.code)[2];pcHeld.set(e.code,m);
    const el=$('piano').querySelector(`[data-m="${m}"]`);if(el)el.classList.add('dn');
    noteOn(m,performance.now());return;
  }
  const k=e.key;
  if(k===' '){if(tag==='BUTTON'&&t2.id!=='play')return;e.preventDefault();togglePlay();return}
  if(tag==='BUTTON'&&k==='Enter')return;
  const L=k.length===1?'cdefgab'.indexOf(k.toLowerCase()):-1;
  if(L>=0&&state.tool.timed&&!recS.on){
    e.preventDefault();if(e.repeat||keyHeld.has(L))return;
    const ev=EV(),ref=lastNoteD(state.cur)??(bdA()+4);let best=null;
    for(let o=1;o<=7;o++){const d=o*7+L;if(best===null||Math.abs(d-ref)<Math.abs(best-ref))best=d}
    const a=state.tool.acc!==null?state.tool.acc:keyAlter(state.key,L),m=noteMidi({d:best,a});
    keyHeld.set(L,m);noteOn(m,performance.now());return;
  }
  if(L>=0){e.preventDefault();enterLetter(L,e.shiftKey);return}
  if(k>='1'&&k<='6'){setDur(DURS[+k-1].id);return}
  if(matchesShortcut(k,'dot')){toggleDot();return}
  if(matchesShortcut(k,'sharp')||k==='#'){setAcc(1);return}
  if(matchesShortcut(k,'flat')||k==='_'){setAcc(-1);return}
  if(matchesShortcut(k,'natural')){setAcc(0);return}
  if(matchesShortcut(k,'rest')){addRest();return}
  if(matchesShortcut(k,'over')){toggleOver();return}
  if(matchesShortcut(k,'staccato')){toggleMark('st');return}
  if(matchesShortcut(k,'accent')){toggleMark('ac');return}
  if(matchesShortcut(k,'slur')){toggleSlur();return}
  if(matchesShortcut(k,'tie')){toggleTie();return}
  if(k==='Backspace'){e.preventDefault();delBack();return}
  if(k==='Delete'){e.preventDefault();delFwd();return}
  if(k==='Escape'){if(state.sel>=0)deselect();return}
  if(k==='ArrowLeft'||k==='ArrowRight'){
    e.preventDefault();const dlt=k==='ArrowLeft'?-1:1;
    if(e.shiftKey&&state.sel>=0){const n=Math.max(0,Math.min(EV().length-1,(state.selEnd>=0?state.selEnd:state.sel)+dlt));state.selEnd=n;state.selN=-1;state.cur=Math.max(state.sel,n)+1;render()}
    else if(state.sel>=0){const n=(isRange()?(dlt<0?selRange()[0]:selRange()[1]):state.sel)+dlt;if(n>=0&&n<EV().length)select(n,-1)}
    else{state.cur=Math.max(0,Math.min(EV().length,state.cur+dlt));render()}
    return;
  }
  if(k==='ArrowUp'||k==='ArrowDown'){
    if(state.sel>=0){e.preventDefault();moveSel(k==='ArrowUp'?1:-1,e.shiftKey)}
    else if(state.nS>1){e.preventDefault();switchStaff(k==='ArrowUp'?-1:1)}
    return;
  }
  if(k==='Home'){state.cur=0;state.sel=-1;state.selN=-1;render();return}
  if(k==='End'){state.cur=EV().length;state.sel=-1;state.selN=-1;render()}
});
/* Scorciatoie personalizzabili: clic su un tasto nel pannello, poi premi il nuovo tasto da assegnare. */
let scListening=null;
$('shortcutsBox').addEventListener('click',e=>{
  const b=e.target.closest('button[data-sc]');if(!b)return;
  scListening=b.getAttribute('data-sc');
  document.querySelectorAll('#shortcutsBox button.listening').forEach(x=>x.classList.remove('listening'));
  b.classList.add('listening');b.textContent=t('settings.shortcutListening');
});
document.addEventListener('keydown',e=>{
  if(!scListening)return;
  e.preventDefault();e.stopPropagation();
  const id=scListening,k=e.key;
  if(k==='Escape'){scListening=null;buildShortcutsUI();return}
  const lower=k.length===1?k.toLowerCase():k;
  const clash='cdefgab'.includes(lower)||SHORTCUT_IDS.some(other=>other!==id&&matchesShortcut(k,other));
  if(clash){toast(t('t.shortcutTaken'));scListening=null;buildShortcutsUI();return}
  state.keymap[id]=k;saveKeymap();scListening=null;buildShortcutsUI();
  toast(t('t.shortcutSet'));
},true);
$('btnShortcutsReset').addEventListener('click',e=>{
  SHORTCUT_IDS.forEach(id=>{state.keymap[id]={rest:'r',over:'o',staccato:'s',slur:'l',tie:'t',dot:'.',sharp:'+',flat:'-',natural:'=',accent:'>'}[id]});
  saveKeymap();buildShortcutsUI();blurIfMouse(e);
});
