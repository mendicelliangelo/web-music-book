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
    const blob=new Blob([data],{type:/\.pdf$/.test(filename)?'application/pdf':/\.json$/.test(filename)?'application/json':/\.png$/.test(filename)?'image/png':/\.svg$/.test(filename)?'image/svg+xml':/\.wav$/.test(filename)?'audio/wav':'application/zip'});
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
  const instTr=instOf().transpose||0,pdfKey=instTr?keyAfterTranspose(state.key,instTr):state.key;
  const pdfStaves=instTr?visible().map(s=>({...s,events:transposeEventsInKey(s.events,instTr,pdfKey)||s.events})):visible();
  const pdf=buildPdf(pdfStaves,{meter:state.meter,key:pdfKey,nS:state.nS,bpm:state.bpm,title:state.title});
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
function audioBufferToWav(buffer){
  const numCh=buffer.numberOfChannels,len=buffer.length,sampleRate=buffer.sampleRate;
  const blockAlign=numCh*2,dataSize=len*blockAlign;
  const buf=new ArrayBuffer(44+dataSize),view=new DataView(buf);
  const writeStr=(o,s)=>{for(let i=0;i<s.length;i++)view.setUint8(o+i,s.charCodeAt(i))};
  writeStr(0,'RIFF');view.setUint32(4,36+dataSize,true);writeStr(8,'WAVE');
  writeStr(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);
  view.setUint16(22,numCh,true);view.setUint32(24,sampleRate,true);
  view.setUint32(28,sampleRate*blockAlign,true);view.setUint16(32,blockAlign,true);view.setUint16(34,16,true);
  writeStr(36,'data');view.setUint32(40,dataSize,true);
  const chans=[];for(let c=0;c<numCh;c++)chans.push(buffer.getChannelData(c));
  let off=44;
  for(let i=0;i<len;i++)for(let c=0;c<numCh;c++){
    const s=Math.max(-1,Math.min(1,chans[c][i]));
    view.setInt16(off,s<0?s*0x8000:s*0x7fff,true);off+=2;
  }
  return new Blob([buf],{type:'audio/wav'});
}
$('btnExportWav').addEventListener('click',async()=>{
  stopPlay();if(recS.on)stopRec();
  if(!visible().some(s=>s.events.length)){toast(t('t.writeFirst'));return}
  const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!OAC){toast(t('t.noAudio'));return}
  const spt=60/(state.bpm*PPQ)/(state.playbackRate||1),durSec=maxTotal()*spt+3;
  const oac=new OAC(2,Math.max(1,Math.ceil(durSec*44100)),44100);
  const master=oac.createGain();master.gain.value=.9;
  const comp=oac.createDynamicsCompressor();
  const conv=oac.createConvolver();conv.buffer=impulseResponse(oac,2.2,3);
  const wet=oac.createGain();wet.gain.value=state.reverb||0;
  master.connect(comp);master.connect(wet);wet.connect(conv);conv.connect(comp);comp.connect(oac.destination);
  const waves={};
  const waveFor=(inst)=>{
    if(!waves[inst.id]){
      const re=new Float32Array(inst.harm.length+1),im=new Float32Array(inst.harm.length+1);
      inst.harm.forEach((a,k)=>{im[k+1]=a});
      waves[inst.id]=oac.createPeriodicWave(re,im);
    }
    return waves[inst.id];
  };
  const toneOff=(midi,t,dur,inst,vel,pan)=>{
    // rispecchia tone() in 10-audio.js, ma su OfflineAudioContext (le PeriodicWave non si condividono tra contesti)
    const f=440*Math.pow(2,(midi-69)/12);
    const o=oac.createOscillator();o.setPeriodicWave(waveFor(inst));o.frequency.value=f;
    const lp=oac.createBiquadFilter();lp.type='lowpass';lp.Q.value=.7;
    lp.frequency.setValueAtTime(Math.min(f*inst.br,14000),t);lp.frequency.setTargetAtTime(Math.min(f*inst.dk,14000),t,inst.ft);
    const g=oac.createGain(),peak=.2*inst.lv*Math.min(1.4,(vel||90)/90),end=Math.max(t+dur,t+inst.a+.02);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+inst.a);
    if(inst.sus>0)g.gain.setTargetAtTime(peak*inst.sus,t+inst.a,inst.d);
    else g.gain.setTargetAtTime(.0001,t+inst.a,inst.tau*Math.pow(2,-(midi-60)/inst.pd));
    g.gain.setTargetAtTime(.0001,end,inst.r);
    o.connect(lp);lp.connect(g);
    if(pan&&oac.createStereoPanner){const p=oac.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);p.connect(master)}
    else g.connect(master);
    const stopAt=end+inst.r*8+.05;
    if(inst.vib){
      const lfo=oac.createOscillator(),lg=oac.createGain();
      lfo.frequency.value=inst.vib[0];lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*inst.vib[1],t+.35);
      lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(stopAt);
    }
    o.start(t);o.stop(stopAt);
  };
  let notes=[];
  const mix=state.staveMix||[],anySolo=mix.some(m=>m&&m.solo);
  visible().forEach((s,k)=>{
    const m=mix[k]||{mute:false,solo:false,vol:1};
    if(m.mute||(anySolo&&!m.solo))return;
    const vol=m.vol==null?1:m.vol;
    let staffNotes=applyPedal(flattenNotes(s.events),pedalSpans(s.events));
    staffNotes=applyFermata(staffNotes,fermataTicks(s.events));
    staffNotes=applyHairpins(staffNotes,hairpinSpans(s.events));
    if(state.swing)staffNotes=applySwing(staffNotes,beatTicksOf(state.meter));
    staffNotes.forEach(n=>notes.push({...n,v:Math.max(0,Math.min(127,Math.round(n.v*vol))),k}));
  });
  const inst=instOf(),nS=state.nS;
  notes.forEach(n=>{
    const pan=state.stereoStaves&&nS>1?(n.k===0?-.5:.5):0;
    toneOff(n.m,0.1+n.s*spt,n.l*spt*.97,inst,n.v,pan);
  });
  toast(t('t.renderingAudio'));
  try{
    const buf=await oac.startRendering();
    const wavBlob=audioBufferToWav(buf);
    await saveFile((slugify(state.title)||'brano')+'.wav',wavBlob);
  }catch(_){toast(t('t.fileUnreadable'))}
});
function bytesToBase64Url(bytes){
  let bin='';bytes.forEach(b=>{bin+=String.fromCharCode(b)});
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64UrlToBytes(s){
  s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';
  const bin=atob(s),out=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);
  return out;
}
async function compressToBase64(str){
  const bytes=new TextEncoder().encode(str);
  if(window.CompressionStream){
    const cs=new CompressionStream('gzip'),writer=cs.writable.getWriter();
    writer.write(bytes);writer.close();
    const buf=await new Response(cs.readable).arrayBuffer();
    return 'gz:'+bytesToBase64Url(new Uint8Array(buf));
  }
  return 'raw:'+bytesToBase64Url(bytes);
}
async function decompressFromBase64(s){
  const i=s.indexOf(':'),tag=s.slice(0,i),bytes=base64UrlToBytes(s.slice(i+1));
  if(tag==='gz'&&window.DecompressionStream){
    const ds=new DecompressionStream('gzip'),writer=ds.writable.getWriter();
    writer.write(bytes);writer.close();
    const buf=await new Response(ds.readable).arrayBuffer();
    return new TextDecoder().decode(buf);
  }
  return new TextDecoder().decode(bytes);
}
$('btnShareLink').addEventListener('click',async()=>{
  try{
    const o={app:'quaderno-di-musica',versione:2,title:state.title,meter:state.meter,bpm:state.bpm,inst:state.inst,key:state.key,nS:state.nS,staves:state.staves};
    const enc=await compressToBase64(JSON.stringify(o));
    const url=location.origin+location.pathname+'#share='+enc;
    if(url.length>8000)toast(t('t.shareLinkLong'));
    try{await navigator.clipboard.writeText(url);toast(url.length>8000?t('t.shareLinkLong'):t('t.shareLinkCopied'))}
    catch(_){window.prompt(t('t.shareLinkPrompt'),url)}
  }catch(_){toast(t('t.fileUnreadable'))}
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
    }else{
      const text=new TextDecoder().decode(u);
      if(/^\s*<\?xml|<score-partwise/i.test(text))importMusicXml(text,f.name);
      else importJson(text);
    }
  }catch(err){toast(err&&err.message?errMsg(err.message):t('t.fileUnreadable'))}
}
function importMusicXml(text,name){
  const res=parseMusicXml(text);
  stopPlay();resetHistory();
  if(res.ts&&METERS.includes(res.ts[0]+'/'+res.ts[1]))state.meter=res.ts[0]+'/'+res.ts[1];
  if(res.tempo)state.bpm=Math.max(30,Math.min(240,Math.round(60000000/res.tempo)));
  state.key=res.key!=null&&res.key>=-7&&res.key<=7?res.key:0;
  state.inst='piano';
  const r=importToStaves(res,btNow(),state.key);
  state.nS=r.n;
  state.staves=[r.staves[0],r.staves[1]||{clef:'bass',events:[]}];
  state.as=0;state.cur=state.staves[0].events.length;
  state.title=name.replace(/\.[^.]+$/,'').slice(0,60)||t('t.loadedTitleFallback');
  state.kbOct=CLEFS[state.staves[0].clef].kbOct;
  buildKeys();render();
  toast(t('t.loaded',{staves:r.n===2?t('t.loadedTwoStaves'):t('t.loadedOneStaff'),n:r.staves.reduce((a,s)=>a+s.events.length,0)}));
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
