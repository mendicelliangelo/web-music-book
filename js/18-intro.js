'use strict';
/* ---------- Schermata d'avvio: resta 2 secondi, poi scompare e lascia vedere l'editor ---------- */
(function intro(){
  const el=document.getElementById('splash');
  if(!el)return;
  setTimeout(()=>{
    el.classList.add('out');
    setTimeout(()=>{el.hidden=true},480);
  },2000);
})();
