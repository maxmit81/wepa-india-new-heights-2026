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

document.getElementById('calendarButton')?.addEventListener('click', () => {
  const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WEPA India//New Heights 2026//EN\r\nBEGIN:VEVENT\r\nUID:wepa-new-heights-2026@wepa-india\r\nDTSTAMP:20260928T062334Z\r\nDTSTART;VALUE=DATE:20261207\r\nDTEND;VALUE=DATE:20261211\r\nSUMMARY:WEPA India — New Heights | DEC Off-site 2026\r\nLOCATION:Athiva Resort & Spa, Khandala, Maharashtra\r\nDESCRIPTION:WEPA India DEC Off-site 2026. Group bus from the WEPA.digital India office to Khandala and back.\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='WEPA-New-Heights-Offsite-2026.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
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
