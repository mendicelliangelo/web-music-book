'use strict';
/* ---------- 10. Azioni di scrittura ---------- */
const MAXEV=2000;
const ticksBefore=(ev,idx)=>{let t=0;for(let i=0;i<idx&&i<ev.length;i++)t+=evTicks(ev[i]);return t};
const spellPref=()=>state.tool.acc===1?'sharp':state.tool.acc===-1?'flat':undefined;
function clearSpan(ev,idx,ticks){                  // modalità sovrascrittura: toglie le figure che la nuova occuperebbe, il resto diventa pausa
  const start=ticksBefore(ev,idx);let rem=ticks,j=idx;
  while(j<ev.length&&rem>0){rem-=evTicks(ev[j]);j++}
  if(j===idx)return;
  ev.splice(idx,j-idx,...(rem<0?makeEvents(start+ticks,-rem,null,btNow()):[]));
}
const selRange=()=>{if(state.sel<0)return null;const e=state.selEnd>=0?state.selEnd:state.sel;return[Math.min(state.sel,e),Math.max(state.sel,e)]};
const selList=()=>{const r=selRange(),out=[];if(r)for(let i=r[0];i<=r[1];i++)if(EV()[i])out.push(i);return out};
const isRange=()=>{const r=selRange();return !!r&&r[1]>r[0]};
function insertNote(idx,d,a){                      // inserisce una nota (o la aggiunge a un accordo) nel pentagramma attivo
  const ev=EV();
  if(ev.length>=MAXEV){toast(t('t.tooLong'));return}
  stopPlay();
  if(state.tool.chord&&addToChord(d,a))return;
  rec();
  const made=makeEvents(ticksBefore(ev,idx),toolTicks(),[{d,a}],btNow());
  if(!made.length)return;
  if(state.tool.over)clearSpan(ev,idx,toolTicks());
  ev.splice(idx,0,...made);state.cur=idx+made.length;state.sel=-1;state.selN=-1;state.tool.acc=null;
  lastEntry={staff:state.as,idx:state.cur-1,ts:performance.now()};
  render();beep(noteMidi({d,a}));
  if(made.length>1)toast(t('t.splitTie'));
}
function addToChord(d,a){                          // aggiunge una nota alla figura selezionata, o a quella prima del cursore
  const ev=EV(),idx=state.sel>=0?state.sel:state.cur-1,e=ev[idx];
  if(!e||e.r)return false;
  if(e.n.some(n=>n.d===d&&n.a===a))return true;
  rec();
  const ns=e.n.filter(n=>n.d!==d);ns.push({d,a});e.n=sortNotes(ns);
  state.tool.acc=null;lastEntry={staff:state.as,idx,ts:performance.now()};
  render();beep(noteMidi({d,a}));return true;
}
function addRest(){
  const ev=EV();if(ev.length>=MAXEV)return;
  stopPlay();rec();
  const made=makeEvents(ticksBefore(ev,state.cur),toolTicks(),null,btNow());
  if(state.tool.over)clearSpan(ev,state.cur,toolTicks());
  ev.splice(state.cur,0,...made);state.cur+=made.length;state.sel=-1;state.selEnd=-1;state.selN=-1;render();
}
function select(i,nIdx,staff,extend){
  stopPlay();
  if(staff!==undefined&&staff!==state.as){state.as=staff;state.kbOct=CLEFS[state.staves[staff].clef].kbOct;buildKeys();extend=false}
  const e=EV()[i];if(!e)return;
  if(extend&&state.sel>=0){state.selEnd=i;state.selN=-1;state.cur=Math.max(state.sel,i)+1;render();return}
  state.sel=i;state.selEnd=-1;state.selN=!e.r&&e.n.length>1&&nIdx>=0?nIdx:-1;state.cur=i+1;state.tool.dur=e.v;state.tool.dot=!!e.dot;
  render();if(!e.r)beep(noteMidi(e.n[Math.max(0,state.selN)]));
}
function deselect(){state.sel=-1;state.selN=-1;render()}
function removeSel(){
  const ev=EV(),r=selRange(),e=ev[state.sel];
  if(!r)return;
  if(r[1]>r[0]){ev.splice(r[0],r[1]-r[0]+1);state.cur=r[0];state.sel=-1;state.selEnd=-1;state.selN=-1;return}
  if(e&&!e.r&&e.n.length>1&&state.selN>=0){e.n.splice(state.selN,1);state.selN=-1;return}
  ev.splice(state.sel,1);state.cur=state.sel;state.sel=-1;state.selN=-1;
}
function delBack(){
  const ev=EV();
  if(state.sel>=0){stopPlay();rec();removeSel();render();return}
  if(state.cur>0){stopPlay();rec();ev.splice(state.cur-1,1);state.cur--;render()}
}
function delFwd(){
  const ev=EV();
  if(state.sel>=0){delBack();return}
  if(state.cur<ev.length){stopPlay();rec();ev.splice(state.cur,1);render()}
}
function setDur(v){
  stopPlay();
  if(state.sel>=0){rec();selList().forEach(i=>{EV()[i].v=v})}
  state.tool.dur=v;render();
}
function toggleDot(){
  stopPlay();
  if(state.sel>=0){rec();const l=selList(),on=!EV()[l[0]].dot;l.forEach(i=>{EV()[i].dot=on?1:0});state.tool.dot=on}
  else state.tool.dot=!state.tool.dot;
  render();
}
function setAcc(a){                                // 1 diesis, -1 bemolle, 0 bequadro
  stopPlay();
  const list=selList().map(i=>EV()[i]).filter(e=>!e.r);
  if(list.length){
    rec();const one=!isRange()?state.selN:-1;
    list.forEach(e=>{
      (one>=0?[one]:e.n.map((_,j)=>j)).forEach(j=>{const n=e.n[j];n.a=n.a===a&&keyAlter(state.key,n.d%7)!==a?keyAlter(state.key,n.d%7):a});
    });
    render();beep(noteMidi(list[0].n[Math.max(0,one)]));
  }else{state.tool.acc=state.tool.acc===a?null:a;render()}
}
function moveSel(delta,shift){
  const list=selList().map(i=>EV()[i]).filter(e=>!e.r);if(!list.length)return;
  const step=delta*(shift?7:1),one=!isRange()?state.selN:-1;
  const sel=e=>one>=0?[one]:e.n.map((_,j)=>j);
  if(list.some(e=>sel(e).some(j=>e.n[j].d+step<7||e.n[j].d+step>60)))return;
  stopPlay();rec();
  list.forEach(e=>{sel(e).forEach(j=>{const n=e.n[j];n.d+=step;if(n.t)delete n.t});e.n=sortNotes(e.n)});
  state.selN=-1;render();beep(noteMidi(list[0].n[list[0].n.length-1]));
}
function lastNoteD(before){const ev=EV();for(let i=before-1;i>=0;i--)if(!ev[i].r)return ev[i].n[ev[i].n.length-1].d;return null}
function enterLetter(L,shift){
  const ev=EV(),se=state.sel>=0?ev[state.sel]:null,sn=se&&!se.r?se.n[Math.max(0,state.selN)]:null;
  const ref=sn?sn.d:(lastNoteD(state.cur)??(bdA()+4));
  let best=null;for(let o=1;o<=7;o++){const d=o*7+L;if(best===null||Math.abs(d-ref)<Math.abs(best-ref))best=d}
  const a=state.tool.acc!==null?state.tool.acc:keyAlter(state.key,L);
  if(sn&&!shift&&!state.tool.chord){stopPlay();rec();sn.d=best;sn.a=a;if(sn.t)delete sn.t;se.n=sortNotes(se.n);render();beep(noteMidi(sn));return}
  const was=state.tool.chord;if(shift)state.tool.chord=true;
  insertNote(state.cur,best,a);
  state.tool.chord=was;
}
function toggleTie(){                              // lega la figura selezionata (o quella prima del cursore) alla successiva; con più figure selezionate, tutte
  const ev=EV(),r=selRange(),pairs=isRange()?Array.from({length:r[1]-r[0]},(_,q)=>r[0]+q):[state.sel>=0?state.sel:state.cur-1];
  const cand=[];
  for(const i of pairs){
    const e=ev[i],nx=ev[i+1];if(!e||e.r||!nx||nx.r)continue;
    const idx=(!isRange()&&state.selN>=0?[state.selN]:e.n.map((_,j)=>j)).filter(j=>nx.n.some(q=>noteMidi(q)===noteMidi(e.n[j])));
    idx.forEach(j=>cand.push(e.n[j]));
  }
  if(!cand.length){toast(t('t.tieNeeds'));return}
  stopPlay();rec();
  const all=cand.every(n=>n.t);
  cand.forEach(n=>{if(all)delete n.t;else n.t=1});
  render();
}
/* dinamica, staccato, accento, legatura di frase: agiscono sulla selezione, o sulla figura prima del cursore */
function markTargets(){let l=selList();if(!l.length&&state.cur>0)l=[state.cur-1];return l.map(i=>EV()[i]).filter(e=>e&&!e.r)}
function setDyn(dy){
  const mk=markTargets();if(!mk.length){toast(t('t.writeOrSelectFirst'));return}
  stopPlay();rec();const f=mk[0];if(f.dy===dy)delete f.dy;else f.dy=dy;render();
}
function toggleMark(f){
  const mk=markTargets();if(!mk.length){toast(t('t.writeOrSelectFirst'));return}
  stopPlay();rec();const all=mk.every(e=>e[f]);mk.forEach(e=>{if(all)delete e[f];else e[f]=1});render();
}
function toggleSlur(){
  const r=selRange();if(!r||r[1]===r[0]){toast(t('t.selectMoreForSlur'));return}
  const ns=[];for(let i=r[0];i<=r[1];i++)if(!EV()[i].r)ns.push(EV()[i]);
  if(ns.length<2){toast(t('t.needTwoNotes'));return}
  stopPlay();rec();const a=ns[0],b=ns[ns.length-1];
  if(a.sl&&b.se){delete a.sl;delete b.se}else{a.sl=1;b.se=1}
  render();
}
function togglePedal(){
  const r=selRange();if(!r||r[1]===r[0]){toast(t('t.selectMoreForSlur'));return}
  const ns=[];for(let i=r[0];i<=r[1];i++)if(!EV()[i].r)ns.push(EV()[i]);
  if(ns.length<2){toast(t('t.needTwoNotes'));return}
  stopPlay();rec();const a=ns[0],b=ns[ns.length-1];
  if(a.pd&&b.pu){delete a.pd;delete b.pu}else{a.pd=1;b.pu=1}
  render();
}
function clearMarks(){
  const mk=markTargets();if(!mk.length)return;
  stopPlay();rec();mk.forEach(e=>{delete e.dy;delete e.st;delete e.ac;delete e.sl;delete e.se;delete e.pd;delete e.pu;delete e.lyr;delete e.chord;delete e.ferm;delete e.trill;delete e.mord;delete e.cr;delete e.crEnd;delete e.dim;delete e.dimEnd;delete e.rep});render();
}
function setRehearsalMark(letter){
  const mk=(letter||'').replace(/[^A-Za-z0-9]/g,'').slice(0,2);
  const mkTargets=markTargets();if(!mkTargets.length){toast(t('t.writeOrSelectFirst'));return}
  stopPlay();rec();const f=mkTargets[0];
  if(!mk||f.mk===mk)delete f.mk;else f.mk=mk;
  render();
}
function toggleFermata(){
  const targets=markTargets();if(!targets.length){toast(t('t.writeOrSelectFirst'));return}
  stopPlay();rec();const f=targets[0];
  if(f.ferm)delete f.ferm;else f.ferm=1;
  render();
}
function toggleTrill(){
  const targets=markTargets();if(!targets.length){toast(t('t.writeOrSelectFirst'));return}
  stopPlay();rec();const f=targets[0];
  if(f.trill)delete f.trill;else f.trill=1;
  render();
}
function toggleMordent(){
  const targets=markTargets();if(!targets.length){toast(t('t.writeOrSelectFirst'));return}
  stopPlay();rec();const f=targets[0];
  if(f.mord)delete f.mord;else f.mord=1;
  render();
}
function toggleRepeatMark(type){
  const targets=markTargets();if(!targets.length){toast(t('t.writeOrSelectFirst'));return}
  stopPlay();rec();const f=targets[0];
  if(f.rep===type)delete f.rep;else f.rep=type;
  render();
}
function toggleHairpin(dir){
  const startF=dir==='cr'?'cr':'dim',endF=dir==='cr'?'crEnd':'dimEnd';
  const r=selRange();if(!r||r[1]===r[0]){toast(t('t.selectMoreForSlur'));return}
  const ns=[];for(let i=r[0];i<=r[1];i++)if(!EV()[i].r)ns.push(EV()[i]);
  if(ns.length<2){toast(t('t.needTwoNotes'));return}
  stopPlay();rec();const a=ns[0],b=ns[ns.length-1];
  if(a[startF]&&b[endF]){delete a[startF];delete b[endF]}else{a[startF]=1;b[endF]=1}
  render();
}
function setLyric(text){
  const v=(text||'').trim().slice(0,20);
  const targets=markTargets();if(!targets.length){toast(t('t.writeOrSelectFirst'));return}
  stopPlay();rec();const f=targets[0];
  if(!v)delete f.lyr;else f.lyr=v;
  render();
}
function setChord(text){
  const v=(text||'').trim().slice(0,10);
  const targets=markTargets();if(!targets.length){toast(t('t.writeOrSelectFirst'));return}
  stopPlay();rec();const f=targets[0];
  if(!v)delete f.chord;else f.chord=v;
  render();
}
function selectAll(){const n=EV().length;if(!n)return;stopPlay();state.sel=0;state.selEnd=n-1;state.selN=-1;state.cur=n;render()}
const idxAtTick=(ev,tk)=>{let a=0,i=0;while(i<ev.length&&a<tk){a+=evTicks(ev[i]);i++}return i};
function copySel(cut){
  const r=selRange();if(!r){toast(t('t.selectFirst'));return}
  state.clip=JSON.parse(JSON.stringify(EV().slice(r[0],r[1]+1)));
  const n=state.clip.length;
  if(cut){stopPlay();rec();EV().splice(r[0],n);state.cur=r[0];state.sel=-1;state.selEnd=-1;state.selN=-1;render()}
  else updateChrome();
  toast(t('t.copiedCount',{action:cut?t('t.cut'):t('t.copied'),n,figWord:plural(n,t('sheet.figure'),t('sheet.figures'))}));
}
function pasteClip(){
  if(!state.clip||!state.clip.length){toast(t('t.nothingToPaste'));return}
  if(EV().length+state.clip.length>MAXEV){toast(t('t.tooLong'));return}
  stopPlay();rec();
  const copy=JSON.parse(JSON.stringify(state.clip)),idx=state.cur,ev=EV();
  if(state.tool.over)clearSpan(ev,idx,totalTicks(copy));
  ev.splice(idx,0,...copy);
  const endT=ticksBefore(ev,idx+copy.length);
  const rs=resplitEvents(ev,btNow());
  if(rs.changed){state.staves[state.as].events=rs.events;toast(t('t.pasteSplit'))}
  state.cur=idxAtTick(EV(),endT);state.sel=-1;state.selEnd=-1;state.selN=-1;render();
}
function toggleOver(){state.tool.over=!state.tool.over;updateChrome();toast(state.tool.over?t('t.overOn'):t('t.overOff'))}
function repeatMeasure(){
  // senza selezione: duplica l'ultima battuta del pentagramma attivo; con selezione: duplica quella
  const ev=EV(),r=isRange()?selRange():null;
  let from,to;
  if(r){[from,to]=r}
  else{
    if(!ev.length){toast(t('t.emptySheet'));return}
    const an=analyze(ev,btNow()),lastM=an.items[ev.length-1].m;
    from=an.items.findIndex(it=>it.m===lastM);to=ev.length-1;
  }
  const part=ev.slice(from,to+1);if(!part.length)return;
  if(ev.length+part.length>MAXEV){toast(t('t.tooLong'));return}
  stopPlay();rec();
  const copy=JSON.parse(JSON.stringify(part));
  ev.splice(to+1,0,...copy);
  state.cur=to+1+copy.length;state.sel=to+1;state.selEnd=state.cur-1;state.selN=-1;
  render();toast(t('t.repeated',{n:copy.length,figWord:plural(copy.length,t('sheet.figure'),t('sheet.figures'))}));
}
function fixBars(){
  let any=false;
  const before=snap();
  visible().forEach(s=>{const r=resplitEvents(s.events,btNow());if(r.changed){s.events=r.events;any=true}});
  if(!any)return;
  stopPlay();hist.push(before);redoS.length=0;
  state.cur=Math.min(state.cur,EV().length);state.sel=-1;state.selN=-1;render();
  toast(t('t.barsFixed'));
}
