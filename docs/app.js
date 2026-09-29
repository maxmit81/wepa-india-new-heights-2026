const agenda = {
  monday: {
    title: 'Monday, 7 December', subtitle: 'Arrival • Welcome • Recognition', tag: 'Day 1',
    items: [
      ['—','Travel to accommodation','Group bus from WEPA.digital India office to Khandala','travel'],
      ['14:00','Arrival & Lunch (Snack)','Welcome to Athiva Resort & Spa','meal'],
      ['14:30','Opening Session','','session'],
      ['15:00','Meet the Lead','','session'],
      ['16:00','Bio Break & Check-In','','social'],
      ['17:00','Rewards & Recognition','','session'],
      ['18:00','Formal agenda ends','','social'],
      ['20:00','Dinner','','meal'],
      ['21:00','Socializing','Voluntary','social'],
    ]
  },
  tuesday: {
    title: 'Tuesday, 8 December', subtitle: 'Public speaking • Practice • Impulse', tag: 'Day 2',
    items: [
      ['09:00','Breakfast','','meal'],
      ['10:00','Public Speaking Pt. 1','Includes breaks','session'],
      ['13:30','Lunch','','meal'],
      ['14:30','Public Speaking Pt. 2','Includes breaks','session'],
      ['18:30','Closing Impulse Cedric','','session'],
      ['19:00','Formal agenda ends','','social'],
      ['20:00','Dinner','','meal'],
      ['21:00','Socializing','Voluntary','social'],
    ]
  },
  wednesday: {
    title: 'Wednesday, 9 December', subtitle: 'Speaking • DEC Pulse • Workshop • Team activity', tag: 'Day 3',
    items: [
      ['09:00','Breakfast','','meal'],
      ['10:00','Public Speaking Pt. 3','','session'],
      ['12:00','Bio Break','','social'],
      ['12:30','DEC Pulse','','session'],
      ['13:30','Lunch','','meal'],
      ['14:30','Workshop Follow-Up','Engagement Survey','session'],
      ['16:30','Bio Break','','social'],
      ['17:00','Team Activity','90–120 min.','session'],
      ['20:00','Hour of Appreciation','','session'],
      ['21:00','Dinner','','meal'],
      ['22:00','Socializing','Voluntary','social'],
    ]
  },
  thursday: {
    title: 'Thursday, 10 December', subtitle: 'Check-out • Close • Travel home', tag: 'Day 4',
    items: [
      ['10:00','Breakfast & Check-out','','meal'],
      ['11:00','Closing Session','','session'],
      ['12:00','Travel back','Group bus from Athiva Resort & Spa to the WEPA.digital India office','travel'],
    ]
  }
};

function renderAgenda(day='monday') {
  const data = agenda[day];
  const panel = document.getElementById('agendaPanel');
  if (!panel) return;
  const labels = {travel:'Travel',meal:'Food & time together',session:'Session',social:'Break & social time'};
  panel.innerHTML = `
    <div class="agenda-layout">
      <aside class="day-overview">
        <span class="day-index">${data.tag} <span>—</span> 07–10 DECEMBER</span>
        <h3>${data.title}</h3>
        <p>${data.subtitle}</p>
        <div class="day-overview-rule"></div>
        <div class="day-overview-foot"><span class="overview-icon" aria-hidden="true">↗</span><span>One day at a time.<br><strong>Higher horizons together.</strong></span></div>
      </aside>
      <div class="timeline" aria-label="${data.title} schedule">
        ${data.items.map(([time,title,note,type]) => `<div class="timeline-row ${type}">
          <div class="timeline-time">${time}</div>
          <div class="timeline-track"><span class="timeline-dot"></span></div>
          <div class="timeline-copy"><div class="timeline-category">${labels[type]}</div><div class="timeline-title">${title}</div>${note?`<div class="timeline-note">${note}</div>`:''}</div>
          <span class="timeline-arrow" aria-hidden="true">↗</span>
        </div>`).join('')}
      </div>
    </div>`;
}

renderAgenda();
document.querySelectorAll('.agenda-tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.agenda-tab').forEach(b => {b.classList.remove('active');b.setAttribute('aria-selected','false');b.tabIndex=-1});
  btn.classList.add('active');
  btn.setAttribute('aria-selected','true');
  btn.tabIndex=0;
  document.getElementById('agendaPanel').setAttribute('aria-labelledby',btn.id);
  renderAgenda(btn.dataset.day);
}));
document.querySelector('.agenda-tabs')?.addEventListener('keydown',e=>{
  if (!['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
  e.preventDefault();
  const tabs=[...document.querySelectorAll('.agenda-tab')];
  const i=tabs.indexOf(document.activeElement);
  const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  tabs[next].focus();tabs[next].click();
});

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
menuToggle?.addEventListener('click',()=>{
  nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', nav.classList.contains('open'));
});
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuToggle?.setAttribute('aria-expanded','false')}));

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
  try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(liveUrl); alert('Event page link copied.'); } }
  catch(e){}
});

document.getElementById('calendarButton')?.addEventListener('click', () => {
  const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WEPA India//New Heights 2026//EN\r\nBEGIN:VEVENT\r\nUID:wepa-new-heights-2026@wepa-india\r\nDTSTAMP:20260928T062334Z\r\nDTSTART;VALUE=DATE:20261207\r\nDTEND;VALUE=DATE:20261211\r\nSUMMARY:WEPA India — New Heights | DEC Off-site 2026\r\nLOCATION:Athiva Resort & Spa, Khandala, Maharashtra\r\nDESCRIPTION:WEPA India DEC Off-site 2026. Group bus from the WEPA.digital India office to Khandala and back.\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='WEPA-New-Heights-Offsite-2026.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
});

const observer = new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
