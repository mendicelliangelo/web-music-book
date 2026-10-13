'use strict';
/* ---------- 9. Disegno e interfaccia ---------- */
let lay=null,svgEl=null,ghost=null;
function render(){
  const box=$('score'),W=Math.max(300,Math.floor(box.clientWidth||900)),S=(W<520?10:12)*(state.zoom||1);
  // ogni pentagramma trasporta secondo il PROPRIO strumento; la tonalità in chiave mostrata è quella
  // dello strumento trasponente se ce n'è uno solo in uso, altrimenti resta quella del concerto
  // (caso raro di più strumenti trasponenti diversi insieme: semplificazione consapevole)
  const trs=state.staves.map((s,k)=>instOf(k).transpose||0),
    distinct=[...new Set(trs.filter(x=>x))],
    dispKey=distinct.length===1?keyAfterTranspose(state.key,distinct[0]):state.key;
  const dispStaves=state.staves.map((s,k)=>{
    const tr=trs[k];if(!tr)return s;
    return {...s,events:transposeEventsInKey(s.events,tr,keyAfterTranspose(state.key,tr))||s.events};
  });
  lay=buildLayout(dispStaves,{width:W,S,meter:state.meter,key:dispKey,nS:state.nS,as:state.as,cur:state.cur});
  box.innerHTML=renderSVG(dispStaves,lay,{meter:state.meter,as:state.as,sel:state.sel,selEnd:state.selEnd,selN:state.selN,measureNumEvery:state.measureNumEvery,noteNames:state.noteNames,noteColors:state.noteColors,staffColors:state.staffColors});
  svgEl=box.firstElementChild;ghost=svgEl.querySelector('#ghost');
  $('instTrNote').textContent=distinct.length?t('settings.transposingNote',{key:keyNameFor(dispKey)}):'';
  applyPlayClass();applyExerciseClass();updateChrome();save();updatePop();
  if(document.body.classList.contains('mob')&&!play.on)ensureVisible(svgEl.querySelector('.ev.sel')||svgEl.querySelector('.caret'));
}
function problemsAll(){
  const out=[];
  lay.X.forEach((x,k)=>x.an.problems.forEach(p=>out.push({k,m:p.m})));
  return out;
}
function updateChrome(){
  const tot=maxTotal(),secs=tot*60/(state.bpm*PPQ),bt=btNow(),meas=tot?Math.ceil(tot/bt):0;
  const figs=visible().reduce((a,s)=>a+s.events.length,0);
  $('stats').textContent=tot?t('sheet.stats',{m:meas,measureWord:plural(meas,t('sheet.measure'),t('sheet.measures')),f:figs,figureWord:plural(figs,t('sheet.figure'),t('sheet.figures')),t:fmtTime(secs)}):t('sheet.emptyStats');
  const pr=problemsAll();
  if(pr.length){
    const p=pr[0],where=state.nS>1?`${t('sheet.warnStaff')} ${p.k+1}, ${t('sheet.warnBar').toLowerCase()}`:t('sheet.warnBar');
    $('warn').innerHTML=`<span>${t('sheet.warnMsg',{where,m:p.m+1,meter:state.meter})}</span><button class="btn" type="button" id="fixBars">${t('sheet.fixBars')}</button>`;
  }else $('warn').textContent='';
  const se=state.sel>=0?EV()[state.sel]:null,sn=se&&!se.r?se.n[Math.max(0,state.selN)]:null;
  const dur=se?se.v:state.tool.dur,dot=se?!!se.dot:state.tool.dot,acc=sn?sn.a:state.tool.acc;
  document.querySelectorAll('.dur').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===dur)));
  $('btnDot').setAttribute('aria-pressed',String(dot));
  $('btnSharp').setAttribute('aria-pressed',String(acc===1));
  $('btnFlat').setAttribute('aria-pressed',String(acc===-1));
  $('btnNat').setAttribute('aria-pressed',String(sn?(acc===0&&keyAlter(state.key,sn.d%7)!==0):acc===0));
  $('btnChordMode').setAttribute('aria-pressed',String(state.tool.chord));
  $('btnOver').setAttribute('aria-pressed',String(state.tool.over));
  const mk=markTargets(),m0=mk[0];
  document.querySelectorAll('.dynbtn').forEach(b=>b.setAttribute('aria-pressed',String(!!m0&&m0.dy===b.dataset.dy)));
  $('btnStac').setAttribute('aria-pressed',String(!!mk.length&&mk.every(e=>e.st)));
  $('btnAcc').setAttribute('aria-pressed',String(!!mk.length&&mk.every(e=>e.ac)));
  $('btnPaste').disabled=!state.clip;$('btnCopy').disabled=!selRange();$('btnCut').disabled=!selRange();
  $('btnRest').textContent=se?t('palette.restAfter'):t('palette.rest');
  if($('title').value!==state.title)$('title').value=state.title;
  $('key').value=String(state.key);$('meter').value=state.meter;$('inst').value=instOf(state.as).id;$('nS').value=String(state.nS);
  $('zoom').value=String(Math.round((state.zoom||1)*100));
  $('measureNumEvery').value=String(state.measureNumEvery||0);
  $('noteNames').checked=!!state.noteNames;$('noteColors').checked=!!state.noteColors;$('staffColors').checked=!!state.staffColors;
  $('handwritten').checked=!!state.handwritten;document.documentElement.classList.toggle('handwritten',!!state.handwritten);
  for(let k=0;k<state.nS;k++){
    $('clef'+k).value=state.staves[k].clef;
    const m=state.staveMix[k]||{mute:false,solo:false,vol:1};
    $('solo'+k).checked=!!m.solo;$('mute'+k).checked=!!m.mute;$('vol'+k).value=String(Math.round((m.vol??1)*100));
  }
  $('playbackRate').value=String(Math.round((state.playbackRate||1)*100));$('playbackRateLabel').textContent=Math.round((state.playbackRate||1)*100)+'%';
  $('loopSel').checked=!!state.loopSel;$('swing').checked=!!state.swing;
  $('stereoStaves').checked=!!state.stereoStaves;
  $('reverb').value=String(Math.round((state.reverb||0)*100));$('reverbLabel').textContent=Math.round((state.reverb||0)*100)+'%';
  $('bpm').value=state.bpm;$('bpmRange').value=state.bpm;$('term').textContent=tempoTerm(state.bpm);
  $('tmark').innerHTML=`<span>${tempoTerm(state.bpm)}</span>${noteIcon('q')}<b>= ${state.bpm}</b>`;
  $('octLabel').textContent=t('keys.octLabel',{a:state.kbOct,b:state.kbOct+1});
  $('undoBtn').disabled=!hist.length;$('redoBtn').disabled=!redoS.length;
  updateClock();
}
function buildStaffRowsUI(){
  // righe per chiave e mixer, una per pentagramma attivo (state.nS): generate invece che statiche in
  // HTML, per permettere più di due pentagrammi. Ricreate da capo ad ogni cambio di nS, quindi
  // vanno anche riagganciati gli ascoltatori.
  const n=state.nS,clefOpts=Object.keys(CLEFS).map(k=>`<option value="${k}">${clefNameFor(k)}</option>`).join('');
  $('clefRows').innerHTML=Array.from({length:n},(_,k)=>
    `<label class="field"><span>${t('settings.clefN',{n:k+1})}</span><select id="clef${k}">${clefOpts}</select></label>`,
  ).join('');
  $('mixRows').innerHTML=Array.from({length:n},(_,k)=>
    `<div class="field mixrow"><span>${t('settings.mixN',{n:k+1})}</span><div class="tools">`+
    `<label class="tpl-ctl"><input type="checkbox" id="solo${k}"><span>${t('settings.solo')}</span></label>`+
    `<label class="tpl-ctl"><input type="checkbox" id="mute${k}"><span>${t('settings.mute')}</span></label>`+
    `<input type="range" id="vol${k}" min="0" max="100" step="10" value="100" aria-label="${t('settings.mixN',{n:k+1})}"></div></div>`,
  ).join('');
  for(let k=0;k<n;k++){
    $('clef'+k).addEventListener('change',e=>onClefChange(k,e.target.value));
    $('solo'+k).addEventListener('change',e=>{state.staveMix[k]=state.staveMix[k]||{mute:false,solo:false,vol:1};state.staveMix[k].solo=e.target.checked});
    $('mute'+k).addEventListener('change',e=>{state.staveMix[k]=state.staveMix[k]||{mute:false,solo:false,vol:1};state.staveMix[k].mute=e.target.checked});
    $('vol'+k).addEventListener('input',e=>{state.staveMix[k]=state.staveMix[k]||{mute:false,solo:false,vol:1};state.staveMix[k].vol=Math.max(0,Math.min(1,(+e.target.value||0)/100))});
  }
}
function buildStatic(){
  $('key').innerHTML=[-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(k=>`<option value="${k}">${keyNameFor(k)}</option>`).join('');
  $('meter').innerHTML=METERS.map(m=>`<option value="${m}">${m}</option>`).join('');
  $('inst').innerHTML=INSTRUMENTS.map(i=>`<option value="${i.id}">${instNameFor(i.id)}</option>`).join('');
  buildStaffRowsUI();
  $('durs').innerHTML=DURS.map((d,k)=>`<button type="button" class="dur" data-v="${d.id}" aria-pressed="false" title="${durNameFor(d.id)} (${d.frac}) · ${t('dur.key',{n:k+1})}">${noteIcon(d.id)}<b>${durNameFor(d.id)}</b><small>${d.frac}</small></button>`).join('');
  $('btnSharp').innerHTML='';$('btnFlat').innerHTML='';$('btnNat').innerHTML='';
  $('btnSharp').insertAdjacentHTML('afterbegin',glyphIcon('sharp',26));
  $('btnFlat').insertAdjacentHTML('afterbegin',glyphIcon('flat',26));
  $('btnNat').insertAdjacentHTML('afterbegin',glyphIcon('natural',26));
  $('kbNames').innerHTML=`<option value="it">${t('keys.namesIt')}</option><option value="en">${t('keys.namesEn')}</option><option value="none">${t('keys.namesNone')}</option>`;
  $('pcLayout').innerHTML=`<option value="tracker">${t('keys.pcLayoutTracker')}</option><option value="center">${t('keys.pcLayoutCenter')}</option>`;
  $('qGrid').innerHTML=QUANT_GRID.map(g=>`<option value="${g.ticks}"${g.ticks===120?' selected':''}>${durNameFor(g.id)} (${g.frac})</option>`).join('');
  $('quant').innerHTML=QUANT_GRID.map(g=>`<option value="${g.ticks}"${g.ticks===120?' selected':''}>${durNameFor(g.id)} (${g.frac})</option>`).join('');
  const noteOpts=(()=>{const L=LETTERS[curLang]||LETTERS.it,out=[];for(let l=0;l<7;l++)for(const a of[0,1,-1])out.push(`<option value="${l},${a}">${L[l]}${accSym(a)}</option>`);return out.join('')})();
  $('xFromNote').innerHTML=noteOpts;$('xToNote').innerHTML=noteOpts;
  $('tplSel').innerHTML=TEMPLATES.map(tp=>`<option value="${tp.id}">${t('files.tpl.'+tp.id)}</option>`).join('');
  $('themeSel').innerHTML=`<option value="system">${t('app.themeSystem')}</option><option value="light">${t('app.themeLight')}</option><option value="dark">${t('app.themeDark')}</option>`;
  $('themeSel').value=(()=>{try{return localStorage.getItem('quaderno-musica-theme')||'system'}catch(_){return'system'}})();
  $('measureNumEvery').innerHTML=[0,1,2,4,8].map(n=>`<option value="${n}">${n===0?t('settings.measureNumOff'):n===1?t('settings.measureNumEach'):t('settings.measureNumN',{n})}</option>`).join('');
  buildEarAnswers();
  buildShortcutsUI();
  drawPlayBtn();
}
const SHORTCUT_LABEL_KEYS={rest:'palette.rest',over:'palette.over',staccato:'dyn.stac',slur:'dyn.slur',tie:'palette.tie',dot:'palette.dot',sharp:'palette.sharp',flat:'palette.flat',natural:'palette.natural',accent:'dyn.acc'};
const escHtmlLocal=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
function keyDisplay(k){return k===' '?t('settings.shortcutSpace'):k}
function buildShortcutsUI(){
  $('shortcutsBox').innerHTML=SHORTCUT_IDS.map(id=>
    `<div class="tools sc-row"><span>${t(SHORTCUT_LABEL_KEYS[id])}</span><button class="tool" type="button" data-sc="${id}">${escHtmlLocal(keyDisplay(state.keymap[id]))}</button></div>`
  ).join('');
}
const QUANT_GRID=DURS.map(d=>({id:d.id,ticks:d.ticks,frac:d.frac}));
/* ---------- menu laterale: compare accanto a ciò che è selezionato ---------- */
function popHTML(){
  const l=selList().map(i=>EV()[i]),notes=l.filter(e=>!e.r),one=l.length===1,e0=l[0],ch=one&&!e0.r&&e0.n.length>1&&state.selN>=0;
  const title=one?(e0.r?t('pop.rest',{dur:durLabel(e0.v,e0.dot)}):(ch?noteLabel(e0.n[state.selN]):e0.n.map(noteLabel).join(' + '))+' · '+durLabel(e0.v,e0.dot)):t('pop.selected',{n:l.length});
  const dur=DURS.map(d=>`<button type="button" class="pb" data-pa="dur:${d.id}" aria-pressed="${l.every(e=>e.v===d.id)}" title="${durNameFor(d.id)}">${noteIcon(d.id).replace('width="24" height="52"','width="14" height="30"')}</button>`).join('');
  const dyn=DYNS.map(d=>`<button type="button" class="pb dy" data-pa="dy:${d}" aria-pressed="${!!notes[0]&&notes[0].dy===d}">${d}</button>`).join('');
  const has=notes.length>0,tg=f=>`aria-pressed="${has&&notes.every(e=>e[f])}"`;
  return `<div class="pop-h"><div class="pop-t">${title}</div><div class="pop-r" style="flex:none;flex-wrap:nowrap"><button type="button" class="pb danger" data-pa="del">${ch?t('pop.deleteNote'):t('pop.delete')}</button><button type="button" class="pop-x" data-pa="close" aria-label="${t('pop.close')}">×</button></div></div>
  <span class="glabel">${t('pop.duration')}</span><div class="pop-r">${dur}<button type="button" class="pb" data-pa="dot" aria-pressed="${l.every(e=>e.dot)}">${t('pop.dotLabel')}</button></div>
  ${has?`<span class="glabel">${t('pop.pitch')}</span><div class="pop-r">
    <button type="button" class="pb" data-pa="up" title="${t('pop.up')}">↑</button><button type="button" class="pb" data-pa="down" title="${t('pop.down')}">↓</button>
    <button type="button" class="pb" data-pa="oup" title="${t('pop.octUp')}">8va ↑</button><button type="button" class="pb" data-pa="odown" title="${t('pop.octDown')}">8va ↓</button></div>
  <div class="pop-r"><button type="button" class="pb" data-pa="sharp">${glyphIcon('sharp',22)}</button><button type="button" class="pb" data-pa="flat">${glyphIcon('flat',22)}</button><button type="button" class="pb" data-pa="nat">${glyphIcon('natural',22)}</button></div>
  <span class="glabel">${t('pop.signs')}</span><div class="pop-r">
    <button type="button" class="pb" data-pa="tie" title="${t('pop.tieTitle')}">${t('palette.tie')}</button>
    <button type="button" class="pb" data-pa="stac" ${tg('st')}>${t('dyn.stac')}</button><button type="button" class="pb" data-pa="acc" ${tg('ac')}>${t('dyn.acc')}</button>
    ${l.length>1?`<button type="button" class="pb" data-pa="slur">${t('pop.frase')}</button>`:''}</div>
  <div class="pop-r">${dyn}</div>`:''}
  ${one&&!e0.r?`<div class="pop-r"><button type="button" class="pb" data-pa="addnote" title="${t('pop.addNoteTitle')}">${t('pop.addNote')}</button></div>`:''}
  <span class="glabel">${t('pop.actions')}</span><div class="pop-r">
    <button type="button" class="pb" data-pa="copy">${t('dyn.copy')}</button><button type="button" class="pb" data-pa="cut">${t('dyn.cut')}</button>
    <button type="button" class="pb" data-pa="restafter" title="${t('pop.restAfterTitle')}">${t('palette.restAfter')}</button></div>`;
}
let popKey='';
function updatePop(){
  const pop=$('pop'),el=state.sel>=0&&!recS.on?svgEl&&svgEl.querySelector('.ev.sel'):null;
  if(!el){pop.hidden=true;popKey='';return}
  const key=JSON.stringify([state.sel,state.selEnd,state.selN,state.as,EV()[state.sel]&&JSON.stringify(EV()[state.sel]),selList().length,curLang]);
  if(key!==popKey){pop.innerHTML=popHTML();popKey=key}
  pop.hidden=false;positionPop();
}
function positionPop(){
  const pop=$('pop');if(pop.hidden||!svgEl)return;
  if(window.innerWidth<=760){pop.style.left='';pop.style.top='';return}
  const els=svgEl.querySelectorAll('.ev.sel');if(!els.length)return;
  let r=els[0].getBoundingClientRect();
  const r2=els[els.length-1].getBoundingClientRect();
  const x1=Math.min(r.left,r2.left),x2=Math.max(r.right,r2.right),y1=Math.min(r.top,r2.top),y2=Math.max(r.bottom,r2.bottom);
  const w=pop.offsetWidth||322,h=pop.offsetHeight||300,vw=window.innerWidth,vh=window.innerHeight;
  let x=x2+10;if(x+w>vw-8)x=Math.max(8,x1-w-10);
  if(x+w>vw-8||x<8)x=Math.max(8,vw-w-8);
  let y=(y1+y2)/2-h/2;y=Math.max(8,Math.min(vh-h-8,y));
  pop.style.left=Math.round(x)+'px';pop.style.top=Math.round(y)+'px';
}
window.addEventListener('scroll',positionPop,{passive:true});window.addEventListener('resize',positionPop);
$('pop').addEventListener('click',e=>{
  const b=e.target.closest('[data-pa]');if(!b)return;
  const a=b.dataset.pa;
  if(a==='close')deselect();
  else if(a.startsWith('dur:'))setDur(a.slice(4));
  else if(a.startsWith('dy:'))setDyn(a.slice(3));
  else if(a==='dot')toggleDot();
  else if(a==='up')moveSel(1,false);else if(a==='down')moveSel(-1,false);
  else if(a==='oup')moveSel(1,true);else if(a==='odown')moveSel(-1,true);
  else if(a==='sharp')setAcc(1);else if(a==='flat')setAcc(-1);else if(a==='nat')setAcc(0);
  else if(a==='tie')toggleTie();
  else if(a==='stac')toggleMark('st');else if(a==='acc')toggleMark('ac');
  else if(a==='slur')toggleSlur();
  else if(a==='copy')copySel(false);else if(a==='cut')copySel(true);
  else if(a==='restafter')addRest();
  else if(a==='del')delBack();
  else if(a==='addnote'){state.tool.chord=true;updateChrome();toast(t('t.chordModeOn'))}
  if(e.detail)b.blur&&b.blur();
});
/* tasti del computer → pianoforte (disposizione «tracker»: file bassa Z–M, file alta Q–U; i neri sono S D G H J e 2 3 5 6 7) */
const PC_KEYS=[['KeyZ','Z',0],['KeyS','S',1],['KeyX','X',2],['KeyD','D',3],['KeyC','C',4],['KeyV','V',5],['KeyG','G',6],['KeyB','B',7],['KeyH','H',8],['KeyN','N',9],['KeyJ','J',10],['KeyM','M',11],
  ['KeyQ','Q',12],['Digit2','2',13],['KeyW','W',14],['Digit3','3',15],['KeyE','E',16],['KeyR','R',17],['Digit5','5',18],['KeyT','T',19],['Digit6','6',20],['KeyY','Y',21],['Digit7','7',22],['KeyU','U',23],['KeyI','I',24]];
/* seconda disposizione: il Do centrale è sulla H; le bianche sono la fila A S D F G H J K L ; ' e le nere la fila sopra (E R T · U I · P [) */
const PC_CENTER=[['KeyA','A',-8],['KeyS','S',-7],['KeyD','D',-5],['KeyF','F',-3],['KeyG','G',-1],['KeyH','H',0],['KeyJ','J',2],['KeyK','K',4],['KeyL','L',5],['Semicolon',';',7],['Quote',"'",9],
  ['KeyE','E',-6],['KeyR','R',-4],['KeyT','T',-2],['KeyU','U',1],['KeyI','I',3],['KeyP','P',6],['BracketLeft','[',8]];
const pcKeys=()=>state.tool.pcLayout==='center'?PC_CENTER:PC_KEYS;
const pcByCode=c=>pcKeys().find(k=>k[0]===c);
const pcCharOverride={};      // etichette reali dei tasti di punteggiatura, se il browser le dichiara
try{if(navigator.keyboard&&navigator.keyboard.getLayoutMap)navigator.keyboard.getLayoutMap().then(m=>{['Semicolon','Quote','BracketLeft'].forEach(c=>{const v=m.get(c);if(v)pcCharOverride[c]=v});buildKeys()}).catch(()=>{})}catch(_){}
function buildKeys(){
  const oct=state.kbOct,whites=[],ctr=state.tool.pcLayout==='center',from=ctr?oct*7-5:oct*7;       // nella disposizione «Do centrale su H» la tastiera parte dal Mi sotto
  for(let i=0;i<15;i++)whites.push(from+i);
  let h='';
  const base=12*(state.kbOct+1),pcLab=m=>{const k=pcKeys().find(x=>x[2]===m-base);return k?`<span class="kl">${pcCharOverride[k[0]]||k[1]}</span>`:''};
  const nm=$('kbNames')?$('kbNames').value:'it',LET=['C','D','E','F','G','A','B'];
  const lab=d=>nm==='none'?'':((nm==='en'?LET[d%7]:SOLFEGE[d%7])+(d%7===0?Math.floor(d/7):''));
  whites.forEach(d=>{h+=`<button type="button" class="wk" data-m="${noteMidi({d,a:0})}" aria-label="${SOLFEGE[d%7]}${Math.floor(d/7)}">${pcLab(noteMidi({d,a:0}))}${lab(d)}</button>`});
  whites.forEach((d,i)=>{
    if(i===whites.length-1||![0,1,3,4,5].includes(d%7))return;
    h+=`<button type="button" class="bk" data-m="${noteMidi({d,a:1})}" style="left:calc(100% / 15 * ${i+1} - 100% / 15 * .3)" aria-label="${SOLFEGE[d%7]} diesis / ${SOLFEGE[(d+1)%7]} bemolle ${Math.floor(d/7)}">${pcLab(noteMidi({d,a:1}))}</button>`;
  });
  $('piano').innerHTML=h;$('piano').classList.toggle('pc',!!state.tool.pc);
}
