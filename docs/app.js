function updateCountdown(){
  const start = new Date('2026-12-07T14:00:00+05:30');
  let ms = start - new Date();
  if (ms <= 0){ document.getElementById('days').textContent='0'; document.getElementById('hours').textContent='0'; document.getElementById('mins').textContent='0'; return; }
  const days=Math.floor(ms/86400000); ms%=86400000;
  const hours=Math.floor(ms/3600000); ms%=3600000;
  const mins=Math.floor(ms/60000);
  document.getElementById('days').textContent=days;
  document.getElementById('hours').textContent=String(hours).padStart(2,'0');
  document.getElementById('mins').textContent=String(mins).padStart(2,'0');
}
updateCountdown(); setInterval(updateCountdown,60000);

const liveUrl = window.location.href.split('#')[0];
const qrTarget = document.getElementById('qrTarget');
if (qrTarget) qrTarget.textContent = location.host + location.pathname.replace(/index\.html$/, '');

document.getElementById('shareButton')?.addEventListener('click', async () => {
  const data={title:'WEPA India — New Heights | DEC Off-site 2026',text:'7–10 December 2026 • Athiva Resort & Spa, Khandala',url:liveUrl};
  try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(liveUrl); const button=document.getElementById('shareButton'); const label=button.textContent; button.textContent='Link copied'; setTimeout(()=>button.textContent=label,2200); } }
  catch(e){}
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav-links a')];
const sectionObserver = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach(link => {
    if (link.getAttribute('href') === `#${visible.target.id}`) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
}, {rootMargin:'-20% 0px -55% 0px', threshold:0});
sections.forEach(section => sectionObserver.observe(section));

// Weather is served by our Worker so the AccuWeather credential never reaches this page.
async function updateWeather(){
  const description=document.getElementById('weatherDescription');
  if(!description) return;
  try{
    const response=await fetch(window.WEPA_API_BASE+'/api/weather',{signal:AbortSignal.timeout(8000)});
    if(!response.ok) throw new Error('Weather unavailable');
    const data=await response.json();
    for(const [id,value] of [['weatherTemp',data.current],['weatherHigh',data.high],['weatherLow',data.low]]){
      if(!Number.isFinite(value)) throw new Error('Invalid weather');
      document.getElementById(id).textContent=Math.round(value)+'°';
    }
    document.getElementById('weatherRow').classList.remove('unavailable');
    document.querySelector('.weather-live').lastChild.textContent=' LIVE WEATHER';
    const icon=Number(data.icon);
    document.getElementById('weatherIcon').textContent=(icon>=12&&icon<=29)?'☂':(icon>=7&&icon<=11||icon>=30)?'☁':data.daytime?'☀':'☾';
    description.textContent=String(data.description||'Current conditions');
    const observed=new Date(data.observedAt);
    document.getElementById('weatherUpdated').textContent=Number.isNaN(observed.getTime())?'Today’s conditions':'Updated '+new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'}).format(observed)+' IST';
    if(data.link){const link=new URL(data.link);if(link.protocol==='https:'&&(link.hostname==='accuweather.com'||link.hostname.endsWith('.accuweather.com'))) document.getElementById('weatherCredit').href=link.href;}
  }catch(error){
    document.getElementById('weatherRow').classList.add('unavailable');
    description.textContent='Weather update unavailable';
    document.getElementById('weatherUpdated').textContent='Check the latest conditions';
    document.querySelector('.weather-live').textContent='CURRENT WEATHER';
  }
}
updateWeather();
setInterval(updateWeather,30*60*1000);
