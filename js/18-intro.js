'use strict';
/* ---------- Schermata d'avvio: resta 2 secondi, poi scompare e lascia vedere l'editor ---------- */
(function intro(){
  const el=document.getElementById('splash');
  if(!el)return;
  const embed=document.documentElement.classList.contains('embed');
  setTimeout(()=>{
    el.classList.add('out');
    setTimeout(()=>{el.hidden=true},embed?0:480);
  },embed?0:2000);
})();
