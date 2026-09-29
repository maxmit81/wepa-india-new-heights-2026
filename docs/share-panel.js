(() => {
  const panel=document.getElementById('sharePanel'),floating=document.getElementById('shareFloat'),restore=document.getElementById('restoreShare'),qr=document.getElementById('shareQR'),feedback=document.getElementById('shareFeedback');
  const triggers=[...document.querySelectorAll('[data-share-open]')],mobile=matchMedia('(max-width:700px)');
  const url=new URL('./',location.href).href;
  let dismissed=false,lastTrigger;
  try{dismissed=sessionStorage.getItem('wepa-share-dismissed')==='1'}catch{}
  function sync(){floating.hidden=dismissed||panel.open;restore.hidden=!dismissed;triggers.forEach(b=>b.setAttribute('aria-expanded',String(panel.open)))}
  function open(event){lastTrigger=event?.currentTarget;feedback.textContent='';if(!panel.open)panel.showModal();sync()}
  triggers.forEach(b=>b.addEventListener('click',open));
  document.getElementById('shareClose').addEventListener('click',()=>panel.close());
  panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close()}});
  panel.addEventListener('close',()=>{sync();lastTrigger?.focus({preventScroll:true})});
  document.getElementById('shareDismiss').addEventListener('click',()=>{dismissed=true;try{sessionStorage.setItem('wepa-share-dismissed','1')}catch{}sync()});
  restore.addEventListener('click',()=>{dismissed=false;try{sessionStorage.removeItem('wepa-share-dismissed')}catch{}sync();feedback.textContent='Floating button restored. It will appear when you close this panel.'});
  async function copy(){try{await navigator.clipboard.writeText(url);feedback.textContent='Event link copied.'}catch{feedback.textContent='Could not copy automatically. Copy the event address from your browser.'}}
  document.getElementById('copyEvent').addEventListener('click',copy);
  document.getElementById('nativeShare').addEventListener('click',async()=>{if(!navigator.share){await copy();return}try{await navigator.share({title:'WEPA India — New Heights',text:'7–10 December 2026 · Khandala',url})}catch(e){if(e.name!=='AbortError')feedback.textContent='Sharing is unavailable. Try Copy link instead.'}});
  mobile.addEventListener('change',()=>{sync()});
  function keyboard(){floating.classList.toggle('keyboard-hidden',document.activeElement?.matches('input,textarea,[contenteditable=true]')||!!(visualViewport&&innerHeight-visualViewport.height>140))}
  document.addEventListener('focusin',keyboard);document.addEventListener('focusout',()=>setTimeout(keyboard,0));window.visualViewport?.addEventListener('resize',keyboard);
  if(location.hash==='#share')open();window.addEventListener('hashchange',()=>{if(location.hash==='#share')open()});sync();
})();
