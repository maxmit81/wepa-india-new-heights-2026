(() => {
  const button = document.getElementById('themeToggle');
  function apply(dark, save = false) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.getElementById('lightTheme').media = dark ? 'not all' : 'all';
    button.setAttribute('aria-pressed', String(dark));
    document.getElementById('themeIcon').textContent = dark ? '☀' : '☾';
    document.getElementById('themeLabel').textContent = dark ? 'Light mode' : 'Dark mode';
    if (save) { try { localStorage.setItem('wepa-theme', dark ? 'dark' : 'light'); } catch {} }
  }
  apply(document.documentElement.dataset.theme === 'dark');
  button.addEventListener('click', () => apply(document.documentElement.dataset.theme !== 'dark', true));
  window.addEventListener('storage', event => {
    if (event.key === 'wepa-theme') apply(event.newValue === 'dark');
  });
})();
(() => {
 const arrow=document.querySelector('.back-top');let queued=false;
 function update(){queued=false;arrow.classList.toggle('scroll-visible',window.scrollY>80);arrow.classList.toggle('keyboard-hidden',!!document.activeElement?.matches('input,textarea,[contenteditable=true]')||!!(window.visualViewport&&innerHeight-window.visualViewport.height>140))}
 window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});document.addEventListener('focusin',update);document.addEventListener('focusout',()=>setTimeout(update,0));window.visualViewport?.addEventListener('resize',update);update();
})();
