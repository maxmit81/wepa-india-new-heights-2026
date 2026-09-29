// Progressive enhancement: all four complete schedules remain available without JS.
const dayLinks=[...document.querySelectorAll('.day-jump a')];
const dayPanels=[...document.querySelectorAll('.day-card')];
const dayNav=document.querySelector('.day-jump');
dayNav.setAttribute('role','tablist');
dayNav.setAttribute('aria-label','Choose an agenda day');
function selectDay(id,updateHash=false){
  if(!dayPanels.some(p=>p.id===id))return;
  dayLinks.forEach(link=>{const selected=link.hash==='#'+id;link.setAttribute('aria-selected',String(selected));link.tabIndex=selected?0:-1});
  dayPanels.forEach(panel=>panel.hidden=panel.id!==id);
  if(updateHash)history.replaceState(null,'','#'+id);
}
dayLinks.forEach((link,i)=>{
  link.id='agenda-tab-'+i;link.setAttribute('role','tab');link.setAttribute('aria-controls',dayPanels[i].id);
  dayPanels[i].setAttribute('role','tabpanel');dayPanels[i].setAttribute('aria-labelledby',link.id);dayPanels[i].tabIndex=0;
  link.addEventListener('click',event=>{event.preventDefault();selectDay(link.hash.slice(1),true)});
  link.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%4;if(event.key==='ArrowLeft')next=(i+3)%4;if(event.key==='Home')next=0;if(event.key==='End')next=3;if(next!==undefined){event.preventDefault();dayLinks[next].focus();selectDay(dayPanels[next].id,true)}});
});
selectDay(dayPanels.some(p=>'#'+p.id===location.hash)?location.hash.slice(1):dayPanels[0].id);
window.addEventListener('hashchange',()=>selectDay(location.hash.slice(1)));
