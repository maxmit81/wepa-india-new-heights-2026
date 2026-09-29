// One day at a time, with persistent mobile controls and native keyboard tabs.
(() => {
const links=[...document.querySelectorAll('.day-jump a')],panels=[...document.querySelectorAll('.day-card')],nav=document.querySelector('.day-jump');
const mobile=matchMedia('(max-width:700px)'),header=document.querySelector('.site-header');
const wrapper=document.createElement('div');wrapper.className='agenda-switcher';nav.before(wrapper);wrapper.append(nav);
const pager=document.createElement('div');pager.className='agenda-pager';pager.innerHTML='<button type="button" aria-label="Previous agenda day">← Previous</button><span role="status" aria-live="polite"></span><button type="button" aria-label="Next agenda day">Next →</button>';wrapper.append(pager);
const [prev,next]=pager.querySelectorAll('button');let selected=0;
nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Choose an agenda day');
function select(index,update=false,scroll=false){if(index<0||index>=panels.length)return;selected=index;links.forEach((link,i)=>{link.setAttribute('aria-selected',String(i===index));link.tabIndex=i===index?0:-1});panels.forEach((panel,i)=>panel.hidden=i!==index);prev.disabled=index===0;next.disabled=index===panels.length-1;pager.querySelector('span').textContent=`Day ${index+1} of 4`;if(update)history.replaceState(null,'','#'+panels[index].id);if(scroll&&mobile.matches){window.scrollTo({top:scrollY+panels[index].getBoundingClientRect().top-header.getBoundingClientRect().height-wrapper.getBoundingClientRect().height-14,behavior:'instant'})}}
links.forEach((link,i)=>{link.id='agenda-tab-'+i;link.dataset.date=`${7+i} Dec`;link.setAttribute('role','tab');link.setAttribute('aria-controls',panels[i].id);panels[i].setAttribute('role','tabpanel');panels[i].setAttribute('aria-labelledby',link.id);panels[i].tabIndex=0;link.addEventListener('click',event=>{event.preventDefault();select(i,true,true)});link.addEventListener('keydown',event=>{let n;if(event.key==='ArrowRight')n=(i+1)%4;if(event.key==='ArrowLeft')n=(i+3)%4;if(event.key==='Home')n=0;if(event.key==='End')n=3;if(n!==undefined){event.preventDefault();select(n,true,true);links[n].focus({preventScroll:true})}})});
prev.addEventListener('click',()=>select(selected-1,true,true));next.addEventListener('click',()=>select(selected+1,true,true));
function fromHash(){const i=panels.findIndex(p=>'#'+p.id===location.hash);if(i>=0)select(i)}
select(0);fromHash();window.addEventListener('hashchange',fromHash);
function measure(){document.documentElement.style.setProperty('--header-height',`${Math.ceil(header.getBoundingClientRect().height)}px`)}new ResizeObserver(measure).observe(header);measure();
})();
