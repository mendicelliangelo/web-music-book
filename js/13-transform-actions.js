'use strict';
/* ---------- 11. Trasforma ---------- */
function transposeBy(semi){
  const r=isRange()?selRange():null;
  if(r){
    const part=EV().slice(r[0],r[1]+1);
    if(!part.some(e=>!e.r)){toast(t('t.noNotesInSelection'));return}
    const tr=transposeEvents(part,semi);if(!tr){toast(t('t.outOfRange'));return}
    stopPlay();rec();EV().splice(r[0],part.length,...tr);render();
    toast(t('t.transposedSel',{n:Math.abs(semi),semitoneWord:plural(Math.abs(semi),t('t.semitone'),t('t.semitones')),dir:semi>0?t('t.selDirUp'):t('t.selDirDown')}));
    const f=tr.find(e=>!e.r);if(f)beep(noteMidi(f.n[0]));return;
  }
  if(!visible().some(s=>s.events.some(e=>!e.r))){toast(t('t.noNotesToTranspose'));return}
  const newKey=keyAfterTranspose(state.key,semi);
  const rs=visible().map(s=>transposeEventsInKey(s.events,semi,newKey));
  if(rs.some(r2=>!r2)){toast(t('t.outOfRange'));return}
  stopPlay();rec();rs.forEach((r2,k)=>{state.staves[k].events=r2});state.key=newKey;state.sel=-1;state.selEnd=-1;state.selN=-1;render();
  const n=Math.abs(semi),qty=n===12?t('t.qtyOctave'):n===2?t('t.qtyTone'):n===1?t('t.qtySemitone'):t('t.qtyN',{n});
  toast(t('t.transposedAllKey',{qty,dir:semi>0?t('t.allDirUp'):t('t.allDirDown'),key:keyNameFor(newKey)}));
  const first=rs[0].find(e=>!e.r);if(first)beep(noteMidi(first.n[0]));
}
function quantizeAll(){
  const g=+$('qGrid').value||120,r=isRange()?selRange():null,names={1920:'1/1',960:'1/2',480:'1/4',240:'1/8',120:'1/16',60:'1/32'};
  const jobs=[];
  if(r)jobs.push({k:state.as,from:r[0],to:r[1]+1});
  else visible().forEach((s,k)=>{if(s.events.length)jobs.push({k,from:0,to:s.events.length})});
  if(!jobs.length){toast(t('t.emptySheet'));return}
  const res=jobs.map(j=>{const ev=state.staves[j.k].events,part=ev.slice(j.from,j.to);return{j,ev,part,q:quantizeEvents(part,g,btNow(),ticksBefore(ev,j.from))}});
  if(!res.some(x=>x.q.changed)){toast(t('t.alreadyOnGrid',{grid:names[g]}));return}
  stopPlay();rec();
  let dropped=0,cnt=0;
  res.forEach(x=>{state.staves[x.j.k].events.splice(x.j.from,x.part.length,...x.q.events);dropped+=x.q.dropped;cnt+=x.part.length});
  state.sel=-1;state.selEnd=-1;state.selN=-1;state.cur=Math.min(state.cur,EV().length);render();
  const droppedTxt=dropped?t(dropped===1?'t.droppedOne':'t.droppedMany',{n:dropped}):'';
  toast(t('t.quantized',{n:cnt,grid:names[g],dropped:droppedTxt}));
}
$('xQuant').addEventListener('click',e=>{quantizeAll();blurIfMouse(e)});
function rescaleDur(dir){
  const r=isRange()?selRange():null;
  if(r){
    const part=EV().slice(r[0],r[1]+1),tr=scaleDurations(part,dir);
    if(!tr){toast(dir>0?t('t.alreadyWhole'):t('t.alreadyThirtySecond'));return}
    stopPlay();rec();EV().splice(r[0],part.length,...tr);render();toast(dir>0?t('t.doubledSel'):t('t.halvedSel'));return;
  }
  if(!visible().some(s=>s.events.length)){toast(t('t.emptySheet'));return}
  const rs=visible().map(s=>scaleDurations(s.events,dir));
  if(rs.some(r2=>!r2)){toast(dir>0?t('t.alreadyWhole'):t('t.alreadyThirtySecond'));return}
  stopPlay();rec();rs.forEach((r2,k)=>{state.staves[k].events=r2});state.sel=-1;state.selEnd=-1;state.selN=-1;render();
  toast(dir>0?t('t.doubledAll'):t('t.halvedAll'));
}
function replaceAll(fromL,fromA,toL,toA){
  const r=isRange()?selRange():null;
  if(r){
    const part=EV().slice(r[0],r[1]+1),res=replaceNotes(part,fromL,fromA,toL,toA);
    if(!res.count){toast(t('t.replaceNone'));return}
    stopPlay();rec();EV().splice(r[0],part.length,...res.events);render();
    toast(t('t.replaced',{n:res.count}));return;
  }
  if(!visible().some(s=>s.events.some(e=>!e.r))){toast(t('t.noNotesToTranspose'));return}
  const rs=visible().map(s=>replaceNotes(s.events,fromL,fromA,toL,toA)),total=rs.reduce((a,r2)=>a+r2.count,0);
  if(!total){toast(t('t.replaceNone'));return}
  stopPlay();rec();rs.forEach((r2,k)=>{state.staves[k].events=r2.events});render();
  toast(t('t.replaced',{n:total}));
}
function insertPattern(kind,mode){
  const row=KEY_TABLE[state.key]||KEY_TABLE[0],letterIdx=mode==='minor'?row[2]:row[0];
  const ref=lastNoteD(state.cur)??(bdA()+4);
  let tonicD=null;
  for(let o=1;o<=7;o++){const dd=o*7+letterIdx;if(tonicD===null||Math.abs(dd-ref)<Math.abs(tonicD-ref))tonicD=dd}
  const notes=generatePattern(kind,state.key,tonicD);
  if(!notes.length)return;
  const ev=EV();
  if(ev.length+notes.length>MAXEV){toast(t('t.tooLong'));return}
  stopPlay();rec();
  const made=notes.map(n=>({r:false,v:state.tool.dur,dot:state.tool.dot?1:0,n:[{d:n.d,a:n.a}]}));
  const idx=state.cur;
  if(state.tool.over)clearSpan(ev,idx,made.reduce((a,e)=>a+evTicks(e),0));
  ev.splice(idx,0,...made);
  const endT=ticksBefore(ev,idx+made.length);
  const rs=resplitEvents(ev,btNow());
  if(rs.changed)state.staves[state.as].events=rs.events;
  state.cur=idxAtTick(EV(),endT);state.sel=-1;state.selEnd=-1;state.selN=-1;
  render();
  toast(t('t.patternInserted',{n:made.length}));
}
$('btnPattern').addEventListener('click',e=>{insertPattern($('patKind').value,$('patMode').value);blurIfMouse(e)});
function insertTuplet(n,d){
  const durId=state.tool.dur,base=DUR_BY[durId].ticks,total=base*d,bt=btNow();
  const posInBar=ticksBefore(EV(),state.cur)%bt;
  if(posInBar+total>bt){toast(t('t.tupletDoesntFit'));return}
  const ev=EV();
  if(ev.length+n>MAXEV){toast(t('t.tooLong'));return}
  stopPlay();rec();
  const pitchD=lastNoteD(state.cur)??(bdA()+4),alt=keyAlter(state.key,((pitchD%7)+7)%7);
  const made=[];
  for(let i=0;i<n;i++)made.push({r:false,v:durId,dot:0,n:[{d:pitchD,a:alt}],tuplet:{n,d,i}});
  const idx=state.cur;
  if(state.tool.over)clearSpan(ev,idx,total);
  ev.splice(idx,0,...made);
  state.cur=idx+made.length;state.sel=-1;state.selEnd=-1;state.selN=-1;
  render();
  toast(t('t.tupletInserted',{n}));
}
$('btnTuplet').addEventListener('click',e=>{
  const[n,d]=$('tupletKind').value.split(',').map(Number);
  insertTuplet(n,d);blurIfMouse(e);
});
function analyzeChords(){
  const r=isRange()?selRange():null,ev=EV();
  if(!ev.length){toast(t('t.emptySheet'));return}
  const an=analyze(ev,btNow()),byM=new Map();
  ev.forEach((e,i)=>{
    if(e.r||(r&&(i<r[0]||i>r[1])))return;
    const m=an.items[i].m;
    if(!byM.has(m))byM.set(m,{firstIdx:i,pcs:new Map()});
    const g=byM.get(m);
    e.n.forEach(n=>{const pc=((noteMidi(n)%12)+12)%12;g.pcs.set(pc,(g.pcs.get(pc)||0)+1)});
  });
  if(!byM.size){toast(t('t.noNotesInSelection'));return}
  stopPlay();rec();
  let count=0;
  byM.forEach(g=>{
    const best=bestDiatonicChord(g.pcs,state.key);
    if(!best)return;
    ev[g.firstIdx].chord=chordSymbolFor(best.rootPC,best.quality,best.has7,state.key);count++;
  });
  render();
  toast(count?t('t.chordsAnalyzed',{n:count}):t('t.noNotesInSelection'));
}
$('btnAnalyzeChords').addEventListener('click',e=>{analyzeChords();blurIfMouse(e)});
function generateAccompaniment(kind){
  if(state.nS<2){toast(t('t.needSecondStaff'));return}
  const bt=btNow();
  let out=buildAccompaniment(state.staves[0].events,bt,state.key,kind);
  if(!out){toast(t('t.noChordsForAccompaniment'));return}
  if(out.length>MAXEV){toast(t('t.tooLong'));return}
  const rs=resplitEvents(out,bt);if(rs.changed)out=rs.events;
  stopPlay();rec();
  state.staves[1].events=out;
  state.sel=-1;state.selEnd=-1;state.selN=-1;
  if(state.as===1)state.cur=Math.min(state.cur,out.length);
  render();
  toast(t('t.accompanimentGenerated'));
}
$('btnAccompaniment').addEventListener('click',e=>{generateAccompaniment($('accompKind').value);blurIfMouse(e)});
function harmonize(kind){
  if(state.nS<2){toast(t('t.needSecondStaff'));return}
  const melody=state.staves[0].events;
  if(!melody.length){toast(t('t.emptySheet'));return}
  const bt=btNow(),an=analyze(melody,bt),byM=new Map();
  melody.forEach((e,i)=>{
    if(e.r)return;
    const m=an.items[i].m;
    if(!byM.has(m))byM.set(m,{firstIdx:i,pcs:new Map(),hasChord:false});
    const g=byM.get(m);
    if(e.chord)g.hasChord=true;
    e.n.forEach(n=>{const pc=((noteMidi(n)%12)+12)%12;g.pcs.set(pc,(g.pcs.get(pc)||0)+1)});
  });
  if(!byM.size){toast(t('t.emptySheet'));return}
  stopPlay();rec();
  let count=0;
  byM.forEach(g=>{
    if(g.hasChord)return; // non sovrascrive le sigle già scritte a mano
    const best=bestDiatonicChord(g.pcs,state.key);
    if(!best)return;
    melody[g.firstIdx].chord=chordSymbolFor(best.rootPC,best.quality,best.has7,state.key);count++;
  });
  let out=buildAccompaniment(melody,bt,state.key,kind);
  if(!out){toast(t('t.noChordsForAccompaniment'));return}
  if(out.length>MAXEV){toast(t('t.tooLong'));return}
  const rs=resplitEvents(out,bt);if(rs.changed)out=rs.events;
  state.staves[1].events=out;
  state.sel=-1;state.selEnd=-1;state.selN=-1;
  if(state.as===1)state.cur=Math.min(state.cur,out.length);
  render();
  toast(t('t.harmonized',{n:count}));
}
$('btnHarmonize').addEventListener('click',e=>{harmonize($('harmonizeKind').value);blurIfMouse(e)});
function applyVariation(kind){
  const r=isRange()?selRange():null;
  const targets=r?[{k:state.as,from:r[0],to:r[1]+1}]:visible().map((s,k)=>({k,from:0,to:s.events.length}));
  const anyNotes=targets.some(tg=>state.staves[tg.k].events.slice(tg.from,tg.to).some(e=>!e.r));
  if(!anyNotes){toast(t('t.noNotesInSelection'));return}
  stopPlay();rec();
  targets.forEach(tg=>{
    const ev=state.staves[tg.k].events,part=ev.slice(tg.from,tg.to);
    if(!part.length)return;
    let out;
    if(kind==='mirror'){
      const firstNote=part.find(e=>!e.r);
      out=invertPitches(part,firstNote?noteMidi(firstNote.n[0]):60,state.key);
    }else if(kind==='minor')out=toParallelMinor(part,state.key);
    else out=retrogradeEvents(part);
    ev.splice(tg.from,part.length,...out);
    const rs=resplitEvents(ev,btNow());
    if(rs.changed)state.staves[tg.k].events=rs.events;
  });
  state.sel=-1;state.selEnd=-1;state.selN=-1;state.cur=Math.min(state.cur,EV().length);
  render();
  toast(t('t.variationApplied'));
}
$('btnVariation').addEventListener('click',e=>{applyVariation($('variationKind').value);blurIfMouse(e)});
$('xReplace').addEventListener('click',e=>{
  const[fl,fa]=$('xFromNote').value.split(',').map(Number),[tl,ta]=$('xToNote').value.split(',').map(Number);
  replaceAll(fl,fa,tl,ta);blurIfMouse(e);
});
