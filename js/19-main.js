'use strict';
/* ---------- 15. Avvio ---------- */
applyStaticI18n();
$('lang').value=curLang;
$('lang').addEventListener('change',e=>{
  setLang(e.target.value);
  applyStaticI18n();
  buildStatic();buildKeys();popKey='';render();
  e.target.blur();
});
try{if(localStorage.getItem('quaderno-musica-pc')==='1')$('btnPc').setAttribute('aria-pressed','true')}catch(_){}
buildStatic();buildKeys();applyMobile();if(!lay)render();
/* queste due selezioni hanno le opzioni create da buildStatic(): il valore salvato va riapplicato solo dopo */
try{const v=localStorage.getItem('quaderno-musica-kbnames');if(v&&['it','en','none'].includes(v)){$('kbNames').value=v;buildKeys()}}catch(_){}
try{const v=localStorage.getItem('quaderno-musica-pclayout');if(v==='center'||v==='tracker'){state.tool.pcLayout=v;$('pcLayout').value=v;buildKeys()}}catch(_){}
if(typeof ResizeObserver!=='undefined'){
  new ResizeObserver(()=>{const w=Math.floor($('score').clientWidth);if(lay&&w&&Math.abs(w-lay.width)>1)render()}).observe($('score'));
}
