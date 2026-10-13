'use strict';
/* ---------- 14b. Pannelli laterali: sul telefono scorrono da destra e da sinistra come un cassetto;
   da tablet in su restano nel layout a colonne ma si possono chiudere per allargare lo spartito ---------- */
function isMobileNav(){return document.body.classList.contains('mob')}

function setMobileDrawer(side,on){document.body.classList.toggle('nav-'+side+'-open',!!on)}
function setPanelHidden(side,hidden){const app=document.querySelector('.app');if(app)app.classList.toggle('hide-'+side,!!hidden)}
function isPanelHidden(side){const app=document.querySelector('.app');return !!(app&&app.classList.contains('hide-'+side))}

function syncNavButton(side){
  const btn=$(side==='left'?'navLeftBtn':'navRightBtn');if(!btn)return;
  const open=isMobileNav()?document.body.classList.contains('nav-'+side+'-open'):!isPanelHidden(side);
  btn.setAttribute('aria-expanded',String(open));
}
function closeSide(side){
  if(isMobileNav())setMobileDrawer(side,false);else setPanelHidden(side,true);
  syncNavButton(side);
}
function closeMobileDrawers(){
  setMobileDrawer('left',false);setMobileDrawer('right',false);
  syncNavButton('left');syncNavButton('right');
}
function toggleNav(side){
  if(isMobileNav())setMobileDrawer(side,!document.body.classList.contains('nav-'+side+'-open'));
  else setPanelHidden(side,!isPanelHidden(side));
  syncNavButton(side);
}
$('navLeftBtn').addEventListener('click',()=>toggleNav('left'));
$('navRightBtn').addEventListener('click',()=>toggleNav('right'));
$('scrim').addEventListener('click',closeMobileDrawers);
document.querySelectorAll('[data-nav-close]').forEach(b=>b.addEventListener('click',()=>closeSide(b.dataset.navClose)));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&(document.body.classList.contains('nav-left-open')||document.body.classList.contains('nav-right-open')))closeMobileDrawers();
},true);

const mq=window.matchMedia?window.matchMedia('(max-width:760px)'):null;
function applyMobile(){
  const m=!!(mq&&mq.matches);document.body.classList.toggle('mob',m);
  if(!m)closeMobileDrawers();
  syncNavButton('left');syncNavButton('right');
  if(lay)render();
}
if(mq){(mq.addEventListener?mq.addEventListener('change',applyMobile):mq.addListener(applyMobile))}
function ensureVisible(el){                       // sul telefono la carta scorre dentro il suo riquadro: porta l'elemento al centro
  const box=document.querySelector('.sheet');if(!el||!box||!document.body.classList.contains('mob'))return;
  const r=el.getBoundingClientRect(),b=box.getBoundingClientRect();
  if(r.top<b.top+20||r.bottom>b.bottom-20)box.scrollTop+=(r.top-b.top)-box.clientHeight/2+r.height/2;
}
