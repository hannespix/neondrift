/* NEONDRIFT – PWA-Integration (Service Worker, Install-Prompt, Wake Lock). */
/* ---------- PWA-Integration ---------- */
(function(){
  // Service Worker registrieren (nur über http/https, nicht file://)
  if('serviceWorker' in navigator && location.protocol.startsWith('http')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').then(reg=>{
      if(reg) setInterval(()=>reg.update().catch(()=>{}), 60000); // regelmäßig auf Update prüfen
    }).catch(()=>{}));
    // Auto-Reload, sobald ein neuer Service Worker übernimmt (kein „hart neu laden" mehr nötig)
    let reloaded=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(reloaded) return; reloaded=true; location.reload(); });
  }
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const installBtn = document.getElementById('installBtn');
  const iosHint = document.getElementById('iosHint');

  // Android/Chrome: echtes Installations-Prompt
  let deferred=null;
  window.addEventListener('beforeinstallprompt',(e)=>{ e.preventDefault(); deferred=e; if(installBtn&&!isStandalone) installBtn.style.display='inline-block'; });
  if(installBtn) installBtn.addEventListener('click', async ()=>{ if(!deferred) return; deferred.prompt(); await deferred.userChoice; deferred=null; installBtn.style.display='none'; });
  window.addEventListener('appinstalled',()=>{ if(installBtn) installBtn.style.display='none'; });

  // iOS: kein Prompt möglich → Hinweis einblenden (nur in Safari, nicht wenn schon installiert)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  if(isIOS && !isStandalone && iosHint) iosHint.style.display='block';

  // Bildschirm wach halten während des Spiels
  let wakeLock=null;
  async function keepAwake(){ try{ if('wakeLock' in navigator) wakeLock=await navigator.wakeLock.request('screen'); }catch(e){} }
  document.addEventListener('pointerdown', keepAwake, {once:true});
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') keepAwake(); });

  // Android Hardware-Zurück: nicht sofort App schließen
  history.pushState({n:1},'');
  window.addEventListener('popstate',()=>{ history.pushState({n:1},''); /* bleibt in der App; ESC/Menü-Buttons steuern die Navigation */ });
})();
