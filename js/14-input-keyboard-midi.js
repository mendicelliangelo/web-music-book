'use strict';
/* ---------- 12. Ingresso dalla tastiera: tasti, MIDI, registrazione ---------- */
let lastEntry={staff:0,idx:-1,ts:0};
const recS={on:false,phase:'',t0:0,msPerTick:0,notes:[],open:new Map(),timer:0,clickAt:0,beatSec:0,bt:0,count:0,startTick:0,grid:120,perfOff:0};
const sane=ts=>typeof ts==='number'&&Math.abs(ts-performance.now())<10000?ts:performance.now();   // marca di tempo non coerente: usa l'ora attuale
function noteOn(m,ts){                             // chiamata da tasti a schermo e da tastiera MIDI
  ts=sane(ts);beepHeld(m);
  if(recS.on){
    if(recS.phase==='rec'||ts>=recS.t0-recS.msPerTick*PPQ*.25){if(!recS.open.has(m))recS.open.set(m,Math.max(0,(ts-recS.t0)/recS.msPerTick))}
    return;
  }
  if(state.tool.timed){holdDown(m,ts);return}
  const sp=spellMidi(m,state.key,spellPref());
  if(state.sel<0&&lastEntry.staff===state.as&&lastEntry.idx===state.cur-1&&ts-lastEntry.ts<70&&EV()[lastEntry.idx]&&!EV()[lastEntry.idx].r){
    const was=state.tool.chord;state.tool.chord=true;insertNote(state.cur,sp.d,sp.a);state.tool.chord=was;
  }else insertNote(state.cur,sp.d,sp.a);
  lastEntry.ts=ts;
}
/* durata dal tocco: i tasti premuti quasi insieme (70 ms) formano un accordo; la nota si scrive quando tutti sono rilasciati */
const holds={groups:[],voices:new Map(),timer:0};
function holdDown(m,ts){
  stopPlay();
  let g=holds.groups.find(x=>!x.done&&ts-x.t0<70);
  if(!g){g={t0:ts,keys:new Map(),done:false};holds.groups.push(g)}
  g.keys.set(m,{down:ts,up:null});
  const ac=synth.ac;
  if(ac){tone(m,ac.currentTime+.01,10,instOf());holds.voices.set(m,voices[voices.length-1])}
  if(!holds.timer)holds.timer=setInterval(holdTick,100);
  holdTick();
}
function holdTick(){
  const open=holds.groups.filter(g=>!g.done);
  if(!open.length){clearInterval(holds.timer);holds.timer=0;return}
  const now=performance.now(),g=open[open.length-1],ms=Math.max(...[...g.keys.values()].map(k=>(k.up??now)-k.down));
  const tk=holdTicks(ms,state.bpm,+$('quant').value||120);
  $('holdInfo').textContent=t('keys.holdCalc',{s:(ms/1000).toFixed(1),name:holdName(tk)});
}
function holdUp(m,ts){
  const v=holds.voices.get(m);holds.voices.delete(m);
  if(v&&synth.ac){const now=synth.ac.currentTime;try{v.g.gain.cancelScheduledValues(now);v.g.gain.setTargetAtTime(.0001,now,.08);v.o.stop(now+.6)}catch(_){}}
  const g=holds.groups.find(x=>!x.done&&x.keys.has(m)&&x.keys.get(m).up===null);
  if(!g)return false;
  g.keys.get(m).up=ts;
  if([...g.keys.values()].some(k=>k.up===null))return true;
  g.done=true;holds.groups=holds.groups.filter(x=>!x.done);
  const ks=[...g.keys.entries()],ms=ks.reduce((a,[,k])=>a+(k.up-k.down),0)/ks.length;
  commitHeld(ks.map(([mm])=>mm),ms);
  return true;
}
function commitHeld(midis,ms){
  const ev=EV();if(ev.length>=MAXEV){toast(t('t.tooLong'));return}
  const tk=holdTicks(ms,state.bpm,+$('quant').value||120),ns=midis.sort((a,b)=>a-b).map(x=>{const q=spellMidi(x,state.key,spellPref());return{d:q.d,a:q.a}});
  stopPlay();rec();
  const idx=state.cur,made=makeEvents(ticksBefore(ev,idx),tk,ns,btNow());
  if(!made.length)return;
  if(state.tool.over)clearSpan(ev,idx,tk);
  ev.splice(idx,0,...made);
  state.cur=idx+made.length;state.sel=-1;state.selEnd=-1;state.selN=-1;state.tool.acc=null;state.tool.dur=made[0].v;state.tool.dot=!!made[0].dot;
  render();$('holdInfo').textContent=t('keys.holdWritten',{name:holdName(tk)});
}
function noteOff(m,ts){
  ts=sane(ts);
  if(holds.voices.has(m)||holds.groups.some(g=>g.keys.has(m)&&g.keys.get(m).up===null)){if(holdUp(m,ts))return}
  if(!recS.open.has(m))return;
  const s=recS.open.get(m);recS.open.delete(m);
  recS.notes.push({s,e:Math.max(s,(ts-recS.t0)/recS.msPerTick),m});
}
function beepHeld(m){const ac=audio();if(ac)tone(m,ac.currentTime+.01,.6,instOf())}
function startRec(){
  const ac=audio();if(!ac){toast(t('t.noAudio'));return}
  stopPlay();
  const beatTicks=beatTicksOf(state.meter),bt=btNow(),beats=Math.max(1,Math.round(bt/beatTicks));
  const beatSec=60/state.bpm*beatTicks/PPQ,T0=ac.currentTime+.3,TS=T0+beats*beatSec;
  const perfNow=performance.now(),acNow=ac.currentTime;
  Object.assign(recS,{on:true,phase:'count',t0:perfNow+(TS-acNow)*1000,msPerTick:60000/(state.bpm*PPQ),notes:[],open:new Map(),clickAt:T0,beatSec,bt,count:0,beats,TS,
    startTick:ticksBefore(EV(),state.cur),grid:+$('quant').value||120});
  const pump=()=>{
    const ac2=synth.ac;
    while(recS.clickAt<ac2.currentTime+.4){click(recS.clickAt,recS.count%(recS.beats)===0);recS.count++;recS.clickAt+=recS.beatSec}
    if(recS.phase==='count'&&ac2.currentTime>=recS.TS-.02){recS.phase='rec';updateChrome()}
  };
  pump();recS.timer=setInterval(pump,60);
  $('btnRec').setAttribute('aria-pressed','true');$('recLabel').textContent=t('keys.recStop');
  updateClock();
}
function stopRec(){
  if(!recS.on)return;
  clearInterval(recS.timer);
  const now=performance.now();
  for(const m of [...recS.open.keys()])noteOff(m,now);
  recS.on=false;
  $('btnRec').setAttribute('aria-pressed','false');$('recLabel').textContent=t('keys.rec');
  const g=recS.grid,q=x=>Math.round(x/g)*g;
  const lim=(now-recS.t0)/recS.msPerTick+PPQ,ns=recS.notes.filter(n=>n.e>0&&n.s<=lim).map(n=>{const s=q(n.s);return{s,e:Math.max(q(n.e),s+g),m:n.m}});
  if(!ns.length){toast(t('t.noRecordedNotes'));updateChrome();return}
  const made=staffFromNotes(ns,{bt:recS.bt,key:state.key,start:recS.startTick});
  rec();EV().splice(state.cur,0,...made);state.cur+=made.length;state.sel=-1;state.selN=-1;
  render();toast(t('t.recorded',{n:ns.length}));
}
/* Riconoscimento di altezza dal microfono: autocorrelazione sul segnale nel tempo, nessuna libreria esterna.
   Le note rilevate passano per noteOn/noteOff, cioè la stessa pipeline di registrazione già usata da MIDI e tastiera. */
function detectPitch(buf,sampleRate){
  const n=buf.length;
  let rms=0;for(let i=0;i<n;i++)rms+=buf[i]*buf[i];
  rms=Math.sqrt(rms/n);
  if(rms<0.012)return null;
  let r1=0,r2=n-1;const thres=0.2;
  for(let i=0;i<n>>1;i++)if(Math.abs(buf[i])<thres){r1=i;break}
  for(let i=1;i<n>>1;i++)if(Math.abs(buf[n-i])<thres){r2=n-i;break}
  const n2=Math.max(1,r2-r1);
  const c=new Float64Array(n2);
  for(let lag=0;lag<n2;lag++){let s=0;for(let i=0;i<n2-lag;i++)s+=buf[r1+i]*buf[r1+i+lag];c[lag]=s}
  let d=0;while(d+1<n2&&c[d]>c[d+1])d++;
  let maxVal=-1,maxPos=-1;
  for(let i=d;i<n2;i++)if(c[i]>maxVal){maxVal=c[i];maxPos=i}
  if(maxPos<=0)return null;
  let T0=maxPos;
  const x1=c[T0-1]!==undefined?c[T0-1]:c[T0],x2=c[T0],x3=c[T0+1]!==undefined?c[T0+1]:c[T0];
  const a=(x1+x3-2*x2)/2,b=(x3-x1)/2;
  if(a)T0=T0-b/(2*a);
  if(T0<=0)return null;
  const freq=sampleRate/T0;
  return freq>60&&freq<1500?freq:null;
}
const mic={stream:null,analyser:null,timer:0,lastMidi:null};
function micLoop(){
  // setInterval invece di requestAnimationFrame: deve continuare a girare anche se la scheda perde il focus
  const buf=new Float32Array(mic.analyser.fftSize);
  mic.timer=setInterval(()=>{
    if(!mic.stream)return;
    if(!recS.on||recS.phase!=='rec'){mic.lastMidi=null;return}   // durante il conto alla rovescia non segna ancora nulla
    mic.analyser.getFloatTimeDomainData(buf);
    const freq=detectPitch(buf,synth.ac.sampleRate),now=performance.now();
    if(freq){
      const midi=Math.max(24,Math.min(115,Math.round(69+12*Math.log2(freq/440))));
      if(midi!==mic.lastMidi){
        if(mic.lastMidi!=null)noteOff(mic.lastMidi,now);
        noteOn(midi,now);mic.lastMidi=midi;
      }
    }else if(mic.lastMidi!=null){noteOff(mic.lastMidi,now);mic.lastMidi=null}
  },40);
}
function stopMic(){
  if(mic.timer)clearInterval(mic.timer);mic.timer=0;
  if(mic.lastMidi!=null){try{noteOff(mic.lastMidi,performance.now())}catch(_){}mic.lastMidi=null}
  if(mic.stream){mic.stream.getTracks().forEach(tr=>tr.stop());mic.stream=null}
  $('btnMicRec').setAttribute('aria-pressed','false');
  if(recS.on)stopRec();
}
async function toggleMicRec(){
  if(mic.stream){stopMic();return}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast(t('t.micUnsupported'));return}
  const ac=audio();if(!ac){toast(t('t.noAudio'));return}
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}})}
  catch(_){toast(t('t.micBlocked'));return}
  mic.stream=stream;
  const src=ac.createMediaStreamSource(stream);
  mic.analyser=ac.createAnalyser();mic.analyser.fftSize=2048;
  src.connect(mic.analyser);
  $('btnMicRec').setAttribute('aria-pressed','true');
  startRec();
  micLoop();
}
let midiAccess=null;
async function connectMidi(){
  if(!navigator.requestMIDIAccess){toast(t('t.noMidiSupport'));return}
  try{midiAccess=await navigator.requestMIDIAccess({sysex:false})}
  catch(err){toast(t('t.midiBlocked',{err:(err&&err.name)||'error'}));return}
  const attach=()=>{
    const names=[];midiAccess.inputs.forEach(inp=>{inp.onmidimessage=onMidi;names.push(inp.name)});
    $('midiState').textContent=names.length?t('t.midiConnected',{names:names.join(', ')}):t('t.midiNone');
  };
  midiAccess.onstatechange=attach;attach();
}
const midiPedal={down:false};
function onMidi(ev){
  const [st,a,b]=ev.data,hi=st&0xF0;
  if(hi===0x90&&b>0)noteOn(a,ev.timeStamp);
  else if(hi===0x80||(hi===0x90&&b===0))noteOff(a,ev.timeStamp);
  else if(hi===0xB0&&a===64){
    // pedale di sostegno (CC64) di una tastiera MIDI: avvia o ferma la registrazione
    const down=b>=64;
    if(down&&!midiPedal.down){midiPedal.down=true;recS.on?stopRec():startRec()}
    else if(!down)midiPedal.down=false;
  }
}
