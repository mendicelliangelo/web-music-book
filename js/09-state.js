'use strict';
/* ---------- 7. Stato dell'applicazione ---------- */
const $=id=>document.getElementById(id);
const STORE='quaderno-musica-v2',STORE_OLD='quaderno-musica-v1';
const N=(d,v,dot=0,a=0)=>({r:false,v,dot,n:[{d,a}]});
const exampleEvents=()=>[
  N(30,'q'),N(30,'q'),N(31,'q'),N(32,'q'), N(32,'q'),N(31,'q'),N(30,'q'),N(29,'q'),
  N(28,'q'),N(28,'q'),N(29,'q'),N(30,'q'), N(30,'q',1),N(29,'e'),N(29,'h'),
  N(30,'q'),N(30,'q'),N(31,'q'),N(32,'q'), N(32,'q'),N(31,'q'),N(30,'q'),N(29,'q'),
  N(28,'q'),N(28,'q'),N(29,'q'),N(30,'q'), N(29,'q',1),N(28,'e'),N(28,'h')];
const state={title:t('sheet.exampleTitle'),meter:'4/4',bpm:108,inst:'piano',key:0,nS:1,
  staves:[{clef:'treble',events:exampleEvents()},{clef:'bass',events:[]}],
  as:0,cur:0,sel:-1,selEnd:-1,selN:-1,clip:null,tool:{dur:'q',dot:false,acc:null,chord:false,over:false,timed:false,pc:false,pcLayout:'tracker'},kbOct:4};
state.cur=state.staves[0].events.length;
const instOf=()=>INSTRUMENTS.find(i=>i.id===state.inst)||INSTRUMENTS[0];
const EV=()=>state.staves[state.as].events;
const visible=()=>state.staves.slice(0,state.nS);
const bdA=()=>CLEFS[state.staves[state.as].clef].bottomD;
const btNow=()=>barTicksOf(state.meter);
const toolTicks=()=>DUR_BY[state.tool.dur].ticks*(state.tool.dot?1.5:1);
const maxTotal=()=>Math.max(0,...visible().map(s=>totalTicks(s.events)));

function applySettings(o){
  if(typeof o.key==='number'&&o.key>=-7&&o.key<=7)state.key=Math.round(o.key);
  if(METERS.includes(o.meter))state.meter=o.meter;
  const b=Math.round(+o.bpm);if(b>=30&&b<=240)state.bpm=b;
  if(INSTRUMENTS.some(i=>i.id===o.inst))state.inst=o.inst;
  if(typeof o.title==='string')state.title=o.title.slice(0,60);
  if(o.nS===1||o.nS===2)state.nS=o.nS;
}
function applyStaves(arr){                         // arr: [{clef,events}] (formato nuovo) oppure un solo elenco vecchio
  const out=[];
  for(let k=0;k<2;k++){
    const s=arr[k];
    const ev=s?cleanEvents(s.events):null;
    out.push({clef:s&&CLEFS[s.clef]?s.clef:(k?'bass':'treble'),events:ev||[]});
  }
  state.staves=out;
}
function save(){
  try{localStorage.setItem(STORE,JSON.stringify({title:state.title,meter:state.meter,bpm:state.bpm,inst:state.inst,key:state.key,nS:state.nS,staves:state.staves,tool:{dur:state.tool.dur,dot:state.tool.dot}}))}catch(_){}
}
(function restore(){
  try{
    let raw=localStorage.getItem(STORE);
    if(raw){
      const o=JSON.parse(raw);if(!Array.isArray(o.staves))return;
      applySettings(o);applyStaves(o.staves);
      if(o.tool&&DUR_BY[o.tool.dur]){state.tool.dur=o.tool.dur;state.tool.dot=!!o.tool.dot}
    }else if((raw=localStorage.getItem(STORE_OLD))){
      const o=JSON.parse(raw);if(!Array.isArray(o.events))return;
      applySettings(o);applyStaves([{clef:o.clef,events:o.events}]);
    }else return;
    state.as=0;state.cur=state.staves[0].events.length;
  }catch(_){}
})();
state.kbOct=CLEFS[state.staves[state.as].clef].kbOct;

/* annulla / ripristina */
const hist=[],redoS=[];
const snap=()=>JSON.stringify({s:state.staves.map(s=>s.events),a:state.as,c:state.cur,t:state.title});
function rec(){hist.push(snap());if(hist.length>150)hist.shift();redoS.length=0}
function restoreSnap(s){const o=JSON.parse(s);o.s.forEach((e,k)=>{state.staves[k].events=e});state.as=o.a;state.cur=o.c;state.title=o.t;state.sel=-1;state.selEnd=-1;state.selN=-1}
function undo(){if(!hist.length)return;stopPlay();redoS.push(snap());restoreSnap(hist.pop());render()}
function redo(){if(!redoS.length)return;stopPlay();hist.push(snap());restoreSnap(redoS.pop());render()}
