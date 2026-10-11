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
  const rs=visible().map(s=>transposeEvents(s.events,semi));
  if(rs.some(r2=>!r2)){toast(t('t.outOfRange'));return}
  stopPlay();rec();rs.forEach((r2,k)=>{state.staves[k].events=r2});state.sel=-1;state.selEnd=-1;state.selN=-1;render();
  const n=Math.abs(semi),qty=n===12?t('t.qtyOctave'):n===2?t('t.qtyTone'):n===1?t('t.qtySemitone'):t('t.qtyN',{n});
  toast(t('t.transposedAll',{qty,dir:semi>0?t('t.allDirUp'):t('t.allDirDown')}));
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
