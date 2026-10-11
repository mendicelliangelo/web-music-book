'use strict';
/* ---------- 8. Suono (sintesi nel browser) ---------- */
const synth={ac:null,master:null,waves:{}};
function audio(){
  if(!synth.ac){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
    const ac=new C(),m=ac.createGain(),comp=ac.createDynamicsCompressor();
    m.gain.value=.9;m.connect(comp);comp.connect(ac.destination);synth.ac=ac;synth.master=m;
  }
  if(synth.ac.state==='suspended')synth.ac.resume();
  return synth.ac;
}
function waveOf(inst){
  if(!synth.waves[inst.id]){
    const re=new Float32Array(inst.harm.length+1),im=new Float32Array(inst.harm.length+1);
    inst.harm.forEach((a,k)=>{im[k+1]=a});
    synth.waves[inst.id]=synth.ac.createPeriodicWave(re,im);
  }
  return synth.waves[inst.id];
}
const voices=[];
function tone(midi,t,dur,inst,vel){
  const ac=synth.ac,f=440*Math.pow(2,(midi-69)/12);
  const o=ac.createOscillator();o.setPeriodicWave(waveOf(inst));o.frequency.value=f;
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.Q.value=.7;
  lp.frequency.setValueAtTime(Math.min(f*inst.br,14000),t);lp.frequency.setTargetAtTime(Math.min(f*inst.dk,14000),t,inst.ft);
  const g=ac.createGain(),peak=.2*inst.lv*Math.min(1.4,(vel||90)/90),end=Math.max(t+dur,t+inst.a+.02);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+inst.a);
  if(inst.sus>0)g.gain.setTargetAtTime(peak*inst.sus,t+inst.a,inst.d);
  else g.gain.setTargetAtTime(.0001,t+inst.a,inst.tau*Math.pow(2,-(midi-60)/inst.pd));
  g.gain.setTargetAtTime(.0001,end,inst.r);
  o.connect(lp);lp.connect(g);g.connect(synth.master);
  const stopAt=end+inst.r*8+.05;
  if(inst.vib){
    const lfo=ac.createOscillator(),lg=ac.createGain();
    lfo.frequency.value=inst.vib[0];lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*inst.vib[1],t+.35);
    lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(stopAt);
  }
  o.start(t);o.stop(stopAt);
  voices.push({g,o});if(voices.length>400)voices.splice(0,voices.length-400);
}
function click(t,accent){                          // colpo di metronomo
  const ac=synth.ac,o=ac.createOscillator(),g=ac.createGain();
  o.frequency.value=accent?1500:1000;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(accent?.35:.22,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+.06);
  o.connect(g);g.connect(synth.master);o.start(t);o.stop(t+.08);
}
function beep(midi){const ac=audio();if(ac)tone(midi,ac.currentTime+.02,.5,instOf())}

const play={on:false,t0:0,spt:0,notes:[],idx:0,starts:[],cur:[],timer:0,raf:0,total:0};
function stopPlay(){
  if(!play.on)return;
  play.on=false;clearInterval(play.timer);cancelAnimationFrame(play.raf);
  if(synth.ac){const now=synth.ac.currentTime;for(const v of voices){try{v.g.gain.cancelScheduledValues(now);v.g.gain.setTargetAtTime(.0001,now,.03);v.o.stop(now+.25)}catch(_){}}voices.length=0}
  play.cur=[];applyPlayClass();drawPlayBtn();updateClock();
}
function startPlay(){
  const ac=audio();
  if(!ac){toast(t('t.noAudio'));return}
  if(!visible().some(s=>s.events.length)){toast(t('t.writeFirst'));return}
  stopPlay();if(recS.on)stopRec();
  const spt=60/(state.bpm*PPQ),notes=[];
  play.starts=visible().map(s=>{let t=0;return s.events.map(e=>{const x=t;t+=evTicks(e);return x})});
  visible().forEach(s=>flattenNotes(s.events).forEach(n=>notes.push(n)));
  notes.sort((a,b)=>a.s-b.s);
  Object.assign(play,{on:true,t0:ac.currentTime+.15,spt,notes,idx:0,cur:visible().map(()=>-1),total:maxTotal()});
  const inst=instOf();
  const pump=()=>{
    while(play.idx<play.notes.length&&play.t0+play.notes[play.idx].s*spt<ac.currentTime+1.5){
      const n=play.notes[play.idx];tone(n.m,play.t0+n.s*spt,n.l*spt*.97,inst,n.v);play.idx++;
    }
  };
  pump();play.timer=setInterval(pump,100);
  const frame=()=>{
    if(!play.on)return;
    const nowT=(ac.currentTime-play.t0)/spt;
    if(nowT>=play.total+PPQ){stopPlay();return}
    let changed=false;
    play.starts.forEach((st,k)=>{
      let j=-1;if(nowT<play.total)for(let q=0;q<st.length;q++){if(st[q]<=nowT)j=q;else break}
      if(j!==play.cur[k]){play.cur[k]=j;changed=true}
    });
    if(changed)applyPlayClass(true);
    updateClock(nowT);
    play.raf=requestAnimationFrame(frame);
  };
  play.raf=requestAnimationFrame(frame);
  drawPlayBtn();
}
function togglePlay(){play.on?stopPlay():startPlay()}
function applyPlayClass(scroll){
  const root=$('score');
  root.querySelectorAll('.ev.play').forEach(n=>n.classList.remove('play'));
  if(!play.on)return;
  let first=null;
  play.cur.forEach((j,k)=>{
    if(j<0)return;
    const el=root.querySelector(`.ev[data-s="${k}"][data-i="${j}"]`);
    if(el){el.classList.add('play');if(!first)first=el}
  });
  if(scroll&&first&&document.body.classList.contains('mob')){ensureVisible(first);return}
  if(scroll&&first){const r=first.getBoundingClientRect();if(r.top<80||r.bottom>window.innerHeight-120)first.scrollIntoView({block:'center',behavior:'smooth'})}
}
function drawPlayBtn(){
  $('play').innerHTML=play.on
    ?`<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor"/></svg><span class="lbl"> ${t('dock.stop')}</span>`
    :`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg><span class="lbl"> ${t('dock.play')}</span>`;
  $('play').setAttribute('aria-label',play.on?t('dock.stop'):t('dock.play'));
}
function updateClock(nowT){
  const bt=btNow(),tot=maxTotal(),secs=tot*60/(state.bpm*PPQ);
  if(recS.on){$('clock').textContent=recS.phase==='count'?t('clock.countdown'):t('clock.recording');return}
  if(play.on&&nowT!=null&&nowT>=0){
    const tt=Math.min(nowT,tot);
    $('clock').textContent=t('clock.measureTime',{m:Math.min(Math.max(1,Math.ceil(tot/bt)),Math.floor(tt/bt)+1),t:fmtTime(tt*60/(state.bpm*PPQ)),total:fmtTime(secs)});
  }else $('clock').textContent=tot?t('clock.duration',{t:fmtTime(secs)}):t('clock.empty');
}
