'use strict';
/* ---------- 14. File: esporta, salva, carica ---------- */
let toastT=0;
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),msg.length>90?9000:5200)}
/* Gli errori del lettore MIDI/ZIP arrivano come codici ERR_...: qui si traducono nel messaggio mostrato. */
const ERR_T={ERR_NOT_MIDI:'t.notMidiFile',ERR_MIDI_TIMING:'t.midiTimingUnsupported',ERR_ZIP_NO_MIDI:'t.zipNoMidi',ERR_MIDI_NO_NOTES:'t.midiNoNotes',ERR_NOT_MIDI_OR_PROJECT:'t.notMidiOrProject'};
const errMsg=code=>t(ERR_T[code]||'t.fileUnreadable');

const dlReady=(()=>{try{return window.claude&&window.claude.use?Promise.resolve(window.claude.use('downloads')).catch(()=>null):Promise.resolve(null)}catch(_){return Promise.resolve(null)}})();
function anchorSave(filename,data){                // ultima possibilità: download del browser (può essere bloccato dalla vista)
  try{
    const blob=new Blob([data],{type:/\.pdf$/.test(filename)?'application/pdf':/\.json$/.test(filename)?'application/json':/\.png$/.test(filename)?'image/png':/\.svg$/.test(filename)?'image/svg+xml':'application/zip'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);return true;
  }catch(_){return false}
}
async function saveFile(filename,data){
  const dl=await Promise.race([dlReady,new Promise(r=>setTimeout(()=>r(null),4000))]);
  if(!dl){
    if(anchorSave(filename,data)){toast(t('t.downloadTried',{filename}));return}
    toast(t('t.downloadUnavailable'));return;
  }
  toast(t('t.confirmSaving'));
  try{await dl.save({filename,data});toast(t('t.savedReady',{filename}))}
  catch(err){
    const c=err&&err.code;
    toast(c==='declined'?t('t.saveCancelled'):c==='rate_limited'?t('t.saveRateLimited'):t('t.saveFailed',{code:(c||'error')+(err&&err.message?': '+err.message:'')}));
  }
}
$('btnExport').addEventListener('click',async()=>{
  stopPlay();if(recS.on)stopRec();
  if(!visible().some(s=>s.events.some(e=>!e.r))){toast(t('t.writeNoteBeforeMidi'));return}
  const slug=slugify(state.title)||'brano';
  const midi=buildMidi({staves:visible().map(s=>s.events),bpm:state.bpm,meter:state.meter,key:state.key,program:instOf().program,title:state.title});
  await saveFile(slug+'-midi.zip',zipStore(slug+'.mid',midi));
});
$('btnPdf').addEventListener('click',async()=>{
  stopPlay();if(recS.on)stopRec();
  if(!visible().some(s=>s.events.length)){toast(t('t.emptySheet'));return}
  const pdf=buildPdf(visible(),{meter:state.meter,key:state.key,nS:state.nS,bpm:state.bpm,title:state.title});
  await saveFile((slugify(state.title)||'brano')+'.pdf',pdf);
});
$('btnExportImg').addEventListener('click',async()=>{
  stopPlay();if(recS.on)stopRec();
  if(!svgEl||!visible().some(s=>s.events.length)){toast(t('t.emptySheet'));return}
  const svgNS='http://www.w3.org/2000/svg';
  const totalW=parseFloat(svgEl.getAttribute('width'))||0,totalH=parseFloat(svgEl.getAttribute('height'))||0;
  const selEls=[...svgEl.querySelectorAll('.ev.sel')];
  let vb=[0,0,totalW,totalH];
  if(selEls.length){
    const boxes=selEls.map(el=>el.getBBox());
    const minX=Math.min(...boxes.map(b=>b.x)),minY=Math.min(...boxes.map(b=>b.y));
    const maxX=Math.max(...boxes.map(b=>b.x+b.width)),maxY=Math.max(...boxes.map(b=>b.y+b.height));
    const pad=10;
    vb=[Math.max(0,minX-pad),Math.max(0,minY-pad),Math.min(totalW,maxX-minX+pad*2),Math.min(totalH,maxY-minY+pad*2)];
  }
  const clone=svgEl.cloneNode(true);
  clone.querySelectorAll('.caret,#ghost').forEach(el=>el.remove());
  clone.setAttribute('viewBox',vb.join(' '));
  clone.setAttribute('width',String(Math.round(vb[2])));
  clone.setAttribute('height',String(Math.round(vb[3])));
  const bg=document.createElementNS(svgNS,'rect');
  bg.setAttribute('x',String(vb[0]));bg.setAttribute('y',String(vb[1]));bg.setAttribute('width',String(vb[2]));bg.setAttribute('height',String(vb[3]));bg.setAttribute('fill','#fff');
  clone.insertBefore(bg,clone.firstChild);
  const svgStr=new XMLSerializer().serializeToString(clone);
  const url=URL.createObjectURL(new Blob([svgStr],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const img=new Image();
    await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url});
    const scale=2,canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(vb[2]*scale));canvas.height=Math.max(1,Math.round(vb[3]*scale));
    const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.drawImage(img,0,0,vb[2],vb[3]);
    const pngBlob=await new Promise(res=>canvas.toBlob(res,'image/png'));
    const slug=slugify(state.title)||'brano';
    await saveFile(slug+(selEls.length?'-selezione':'')+'.png',pngBlob);
  }catch(_){toast(t('t.fileUnreadable'))}
  finally{URL.revokeObjectURL(url)}
});
$('btnSaveJson').addEventListener('click',async()=>{
  const slug=slugify(state.title)||'brano';
  const o={app:'quaderno-di-musica',versione:2,title:state.title,meter:state.meter,bpm:state.bpm,inst:state.inst,key:state.key,nS:state.nS,staves:state.staves};
  await saveFile(slug+'-progetto.json',JSON.stringify(o));
});
$('btnLoad').addEventListener('click',()=>$('fileIn').click());
async function openFile(f){
  try{
    const buf=await f.arrayBuffer(),u=new Uint8Array(buf),sig=String.fromCharCode(u[0],u[1],u[2],u[3]);
    if(sig==='MThd')importMidi(buf,f.name);
    else if(sig==='PK\x03\x04'){
      const ents=unzipStored(buf),m=ents&&ents.find(x=>/\.midi?$/i.test(x.name));
      if(!m)throw new Error('ERR_ZIP_NO_MIDI');
      importMidi(m.data.slice().buffer,m.name);
    }else importJson(new TextDecoder().decode(u));
  }catch(err){toast(err&&err.message?errMsg(err.message):t('t.fileUnreadable'))}
}
$('fileIn').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(f)openFile(f)});
const sheetEl=document.querySelector('.sheet');
sheetEl.addEventListener('dragover',e=>{e.preventDefault();sheetEl.classList.add('drop')});
sheetEl.addEventListener('dragleave',()=>sheetEl.classList.remove('drop'));
sheetEl.addEventListener('drop',e=>{
  e.preventDefault();sheetEl.classList.remove('drop');
  const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f)openFile(f);
});
function resetHistory(){hist.length=0;redoS.length=0;state.sel=-1;state.selN=-1}
function importMidi(buf,name){
  const res=parseMidi(buf);
  if(!res.notes.length)throw new Error('ERR_MIDI_NO_NOTES');
  stopPlay();resetHistory();
  if(res.ts&&METERS.includes(res.ts[0]+'/'+res.ts[1]))state.meter=res.ts[0]+'/'+res.ts[1];
  if(res.tempo)state.bpm=Math.max(30,Math.min(240,Math.round(60000000/res.tempo)));
  state.key=res.key!=null&&res.key>=-7&&res.key<=7?res.key:0;
  const ins=INSTRUMENTS.find(i=>i.program===res.prog);state.inst=ins?ins.id:'piano';
  const r=importToStaves(res,btNow(),state.key);
  state.nS=r.n;
  state.staves=[r.staves[0],r.staves[1]||{clef:'bass',events:[]}];
  state.as=0;state.cur=state.staves[0].events.length;
  state.title=name.replace(/\.[^.]+$/,'').slice(0,60)||t('t.loadedTitleFallback');
  state.kbOct=CLEFS[state.staves[0].clef].kbOct;
  buildKeys();render();
  toast(t('t.loaded',{staves:r.n===2?t('t.loadedTwoStaves'):t('t.loadedOneStaff'),n:r.staves.reduce((a,s)=>a+s.events.length,0)}));
}
function importJson(text){
  let o;try{o=JSON.parse(text)}catch(_){throw new Error('ERR_NOT_MIDI_OR_PROJECT')}
  const arr=o&&Array.isArray(o.staves)?o.staves:(o&&Array.isArray(o.events)?[{clef:o.clef,events:o.events}]:null);
  if(!arr||!arr.some(s=>s&&cleanEvents(s.events)))throw new Error('ERR_NOT_MIDI_OR_PROJECT');
  stopPlay();resetHistory();applySettings(o);applyStaves(arr);
  if(!o.nS)state.nS=1;
  state.as=0;state.cur=state.staves[0].events.length;state.kbOct=CLEFS[state.staves[0].clef].kbOct;
  buildKeys();render();toast(t('t.projectLoaded'));
}
$('btnNew').addEventListener('click',()=>{
  stopPlay();if(recS.on)stopRec();rec();
  state.staves.forEach(s=>{s.events=[]});state.cur=0;state.sel=-1;state.selN=-1;state.as=0;state.title=t('sheet.untitled');render();
  toast(t('t.emptySheetUndo'));
});
const TEMPLATES=[
  {id:'piano',nS:2,clef0:'treble',clef1:'bass',inst:'piano'},
  {id:'voice',nS:2,clef0:'treble',clef1:'bass',inst:'piano'},
  {id:'solo',nS:1,clef0:'treble',clef1:'bass',inst:'violin'},
];
function newFromTemplate(id){
  const tpl=TEMPLATES.find(x=>x.id===id);if(!tpl)return;
  stopPlay();if(recS.on)stopRec();resetHistory();
  state.staves=[{clef:tpl.clef0,events:[]},{clef:tpl.clef1,events:[]}];
  state.nS=tpl.nS;state.inst=tpl.inst;state.key=0;state.meter='4/4';state.bpm=108;
  state.as=0;state.cur=0;state.sel=-1;state.selEnd=-1;state.selN=-1;state.title=t('sheet.untitled');
  state.kbOct=CLEFS[state.staves[0].clef].kbOct;buildKeys();render();
  toast(t('t.templateLoaded',{name:t('files.tpl.'+id)}));
}
$('btnTemplate').addEventListener('click',()=>newFromTemplate($('tplSel').value));
const escHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const VER_STORE='quaderno-musica-versions';
function loadVersions(){try{const a=JSON.parse(localStorage.getItem(VER_STORE)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}}
function saveVersionsList(list){try{localStorage.setItem(VER_STORE,JSON.stringify(list))}catch(_){}}
function refreshVersionsUI(){
  const list=loadVersions();
  $('verSel').innerHTML=list.length?list.map((v,i)=>`<option value="${i}">${escHtml(v.title||t('sheet.untitled'))} · ${escHtml(new Date(v.ts).toLocaleString())}</option>`).join(''):`<option value="">${t('files.noVersions')}</option>`;
  $('btnRestoreVersion').disabled=!list.length;$('btnDeleteVersion').disabled=!list.length;
}
function saveVersion(){
  const list=loadVersions();
  list.push({ts:Date.now(),title:state.title,data:{title:state.title,meter:state.meter,bpm:state.bpm,inst:state.inst,key:state.key,nS:state.nS,zoom:state.zoom,staves:state.staves}});
  if(list.length>20)list.splice(0,list.length-20);
  saveVersionsList(list);refreshVersionsUI();$('verSel').value=String(list.length-1);
  toast(t('t.versionSaved'));
}
function restoreVersion(){
  const list=loadVersions(),v=list[+$('verSel').value];if(!v)return;
  stopPlay();if(recS.on)stopRec();resetHistory();
  applySettings(v.data);applyStaves(v.data.staves);
  state.as=0;state.cur=state.staves[0].events.length;state.sel=-1;state.selEnd=-1;state.selN=-1;
  state.kbOct=CLEFS[state.staves[0].clef].kbOct;buildKeys();render();
  toast(t('t.versionRestored',{name:v.title||t('sheet.untitled')}));
}
function deleteVersion(){
  const list=loadVersions(),i=+$('verSel').value;if(!list[i])return;
  list.splice(i,1);saveVersionsList(list);refreshVersionsUI();
}
$('btnSaveVersion').addEventListener('click',saveVersion);
$('btnRestoreVersion').addEventListener('click',restoreVersion);
$('btnDeleteVersion').addEventListener('click',deleteVersion);
refreshVersionsUI();
