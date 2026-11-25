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

// Prefer AccuWeather through the private Worker; use Open-Meteo for this
// non-commercial team event while the AccuWeather deployment is unavailable.
async function getWeather(){
  try{
    const response=await fetch(window.WEPA_API_BASE+'/api/weather',{signal:AbortSignal.timeout(5000)});
    if(response.ok) return {...await response.json(),source:'AccuWeather'};
  }catch(error){ /* The photo Worker may be offline; try the public forecast. */ }
  const url='https://api.open-meteo.com/v1/forecast?latitude=18.7616&longitude=73.3696&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata&forecast_days=1';
  const response=await fetch(url,{signal:AbortSignal.timeout(8000)});
  if(!response.ok) throw new Error('Forecast unavailable');
  const data=await response.json();
  const code=data.current?.weather_code;
  const description=code===0?'Clear sky':code<=3?'Partly cloudy':code<=48?'Cloudy or misty':code<=67?'Rain showers':code<=77?'Snow':code<=82?'Showers':code<=86?'Snow showers':'Thunderstorms';
  return {
    current:data.current?.temperature_2m,
    high:data.daily?.temperature_2m_max?.[0],
    low:data.daily?.temperature_2m_min?.[0],
    description, icon:code, daytime:!!data.current?.is_day,
    observedAt:data.current?.time?data.current.time+'+05:30':null,
    source:'Open-Meteo', link:'https://open-meteo.com/'
  };
}
async function updateWeather(){
  const row=document.getElementById('weatherRow');
  if(!row) return;
  try{
    const data=await getWeather();
    if(![data.current,data.high,data.low].every(Number.isFinite)) throw new Error('Incomplete weather');
    document.getElementById('weatherTemp').textContent=Math.round(data.current)+'°C';
    document.getElementById('weatherHigh').textContent=Math.round(data.high)+'°';
    document.getElementById('weatherLow').textContent=Math.round(data.low)+'°';
    const code=Number(data.icon);
    document.getElementById('weatherIcon').textContent=data.source==='Open-Meteo'
      ?(code>=51?'☂':code>=2?'☁':data.daytime?'☀':'☾')
      :(code>=12&&code<=29?'☂':code>=7&&code<=11||code>=30?'☁':data.daytime?'☀':'☾');
    document.getElementById('weatherDescription').textContent=String(data.description||'Current weather');
    const observed=new Date(data.observedAt);
    document.getElementById('weatherUpdated').textContent=Number.isNaN(observed.getTime())?'Current conditions':'Updated '+new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'}).format(observed)+' IST';
    const credit=document.getElementById('weatherCredit');
    credit.textContent=data.source+' ↗';
    const link=new URL(data.link||'https://www.accuweather.com/');
    if(link.protocol==='https:'&&['accuweather.com','open-meteo.com'].some(domain=>link.hostname===domain||link.hostname.endsWith('.'+domain))) credit.href=link.href;
    row.classList.remove('unavailable');
    row.querySelector('.weather-live').textContent='CURRENT WEATHER';
  }catch(error){
    row.classList.add('unavailable');
    document.getElementById('weatherDescription').textContent='Weather update unavailable';
    document.getElementById('weatherUpdated').textContent='Check the latest conditions';
    row.querySelector('.weather-live').textContent='CURRENT WEATHER';
  }
}
updateWeather();
setInterval(updateWeather,30*60*1000);
