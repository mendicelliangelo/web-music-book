'use strict';
/* ---------- 14b. Versione per telefono: i due menu diventano pannelli che scorrono da destra e da sinistra ---------- */
function setNav(side,on){
  document.body.classList.toggle('nav-'+side+'-open',!!on);
  const btn=$(side==='left'?'navLeftBtn':'navRightBtn');if(btn)btn.setAttribute('aria-expanded',String(!!on));
}
function closeNavs(){setNav('left',false);setNav('right',false)}
function toggleNav(side){setNav(side,!document.body.classList.contains('nav-'+side+'-open'))}
$('navLeftBtn').addEventListener('click',()=>toggleNav('left'));
$('navRightBtn').addEventListener('click',()=>toggleNav('right'));
$('scrim').addEventListener('click',closeNavs);
document.querySelectorAll('[data-nav-close]').forEach(b=>b.addEventListener('click',closeNavs));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&(document.body.classList.contains('nav-left-open')||document.body.classList.contains('nav-right-open')))closeNavs();
},true);

const mq=window.matchMedia?window.matchMedia('(max-width:760px)'):null;
function applyMobile(){
  const m=!!(mq&&mq.matches);document.body.classList.toggle('mob',m);
  if(!m)closeNavs();
  if(lay)render();
}
if(mq){(mq.addEventListener?mq.addEventListener('change',applyMobile):mq.addListener(applyMobile))}
function ensureVisible(el){                       // sul telefono la carta scorre dentro il suo riquadro: porta l'elemento al centro
  const box=document.querySelector('.sheet');if(!el||!box||!document.body.classList.contains('mob'))return;
  const r=el.getBoundingClientRect(),b=box.getBoundingClientRect();
  if(r.top<b.top+20||r.bottom>b.bottom-20)box.scrollTop+=(r.top-b.top)-box.clientHeight/2+r.height/2;
}
