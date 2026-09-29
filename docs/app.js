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

const venueImage='https://assets.simplotel.com/simplotel/image/upload/w_5000%2Ch_3750/x_0%2Cy_0%2Cw_5000%2Ch_2810%2Cr_0%2Cc_crop/q_80%2Cw_1600%2Cdpr_1%2Cf_auto%2Cfl_progressive%2Cc_limit/athiva-hotels-resorts/facade';
const facilities=[
 ['Swimming pool','Open-to-sky pool surrounded by greenery.','https://assets.simplotel.com/simplotel/image/upload/w_5000%2Ch_3208/x_-7%2Cy_199%2Cw_5008%2Ch_2818%2Cr_0%2Cc_crop/q_80%2Cw_1600%2Cdpr_1%2Cf_auto%2Cfl_progressive%2Cc_limit/athiva-resort-spa-khandala/CD_Dukes_Retreat_Interior_390_964e93ee.jpg'],
 ['Fitness centre','Indoor gym with cardio equipment and views.','https://assets.simplotel.com/simplotel/image/upload/w_3333%2Ch_5000/x_0%2Cy_838%2Cw_3333%2Ch_3338%2Cr_0%2Cc_crop/q_80%2Cw_1600%2Cdpr_1%2Cf_auto%2Cfl_progressive%2Cc_limit/athiva-resort-spa-khandala/couple-exercising-gym'],
 ['Spa & wellness','Wellness experiences, including spa treatments.','https://assets.simplotel.com/simplotel/image/upload/w_3333%2Ch_5000/x_0%2Cy_1562%2Cw_3333%2Ch_1876%2Cr_0%2Cc_crop/q_80%2Cw_1600%2Cdpr_1%2Cf_auto%2Cfl_progressive%2Cc_limit/athiva-resort-spa-khandala/woman-facial-massage'],
 ['Indoor games','Arcade-style indoor gaming area.','https://assets.simplotel.com/simplotel/image/upload/w_5000%2Ch_3333/x_834%2Cy_0%2Cw_3333%2Ch_3333%2Cr_0%2Cc_crop/q_80%2Cw_1600%2Cdpr_1%2Cf_auto%2Cfl_progressive%2Cc_limit/athiva-resort-spa-khandala/indoor-gaming-arcade-room'],
 ['Meeting spaces','Conference and event rooms for focused sessions.','https://assets.simplotel.com/simplotel/image/upload/w_5000%2Ch_3775/x_0%2Cy_962%2Cw_4994%2Ch_2813%2Cr_0%2Cc_crop/q_80%2Cw_1600%2Cdpr_1%2Cf_auto%2Cfl_progressive%2Cc_limit/athiva-resort-spa-khandala/conference-meeting-room'],
 ['Outdoor terraces','Hill-facing spaces for a breather and conversation.','https://assets.simplotel.com/simplotel/image/upload/w_5000%2Ch_3279/x_0%2Cy_470%2Cw_4994%2Ch_2810%2Cr_0%2Cc_crop/q_80%2Cw_1600%2Cdpr_1%2Cf_auto%2Cfl_progressive%2Cc_limit/athiva-resort-spa-khandala/terrace-dining']
];
const people=[['Cedric','Tuesday · 18:30','Closing impulse','C'],['Public speaking facilitator','Tuesday & Wednesday','Name to be confirmed','02'],['DEC Pulse','Wednesday · 12:30','Speaker to be confirmed','03'],['Workshop follow-up','Wednesday · 14:30','Facilitator to be confirmed','04']];
const categories=[['overview','Overview','⌂'],['travel','Travel','🚌'],['agenda','Agenda','▤'],['people','People','♧'],['recognition','Recognition','★'],['venue','Venue','⌖'],['facilities','Facilities','◫'],['photos','Photos','▧'],['share','QR & share','↗']];
const apiBase=(window.WEPA_API_BASE||'').replace(/\/$/,'');
const apiUrl=path=>apiBase+path;
let slides=[],current=0,menuOpen=false;
const maps='https://www.google.com/maps/search/?api=1&query=Athiva%20Resort%20%26%20Spa%20Khandala';
const section=(category,id,title,subtitle,body,extra='')=>slides.push({category,id,title,subtitle,body,extra});
const button=(label,id,secondary=false)=>`<button class="action${secondary?' secondary':''}" type="button" data-go="${id}">${label}</button>`;
function buildSlides(){
 slides=[];
 section('overview','top','','',`<div class="content two-col hero-layout"><div><div class="eyebrow">WEPA INDIA · DEC OFF-SITE 2026</div><h1>Achieving<br><em>New Heights</em></h1><p class="hero-lead">Learn. Connect. Grow. Together.</p><p class="hero-detail">Four days in Khandala for learning, public speaking, collaboration, recognition and time together.</p>${button('Explore agenda','agenda-monday-1')}${button('All sections','menu',true)}</div><aside class="hero-panel"><div class="dates">07 <small>DEC</small> → 10 <small>DEC</small></div><h2>Athiva Resort & Spa</h2><p>Khandala, Maharashtra</p><div class="bus">🚌 Group bus from the WEPA.digital India office and back</div></aside></div>`,'hero-screen');
 section('travel','travel','We travel together.','Group bus both ways · Mumbai ↔ Khandala',`<div class="content route"><div class="card"><span class="tag">01 · Monday, 7 Dec</span><strong>WEPA.digital India office</strong><small>Departure time will be shared by the organisers.</small></div><div class="card"><span class="tag">02 · Destination</span><strong>Athiva Resort & Spa</strong><small>Khandala · target arrival 14:00 · lunch/snack on arrival</small></div><div class="card"><span class="tag">03 · Thursday, 10 Dec</span><strong>Back to the office</strong><small>Group bus departs the resort at 12:00.</small></div></div>`);
 const chunkSize=innerHeight<520?2:innerHeight<700?3:4;
 for(const [day,data] of Object.entries(agenda)){
   for(let start=0,part=1;start<data.items.length;start+=chunkSize,part++){
     const days=Object.keys(agenda);
     const tabs=days.map(d=>`<button type="button" class="day-button ${d===day?'active':''}" data-go="agenda-${d}-1">${agenda[d].title.split(',')[0]}</button>`).join('');
     const rows=data.items.slice(start,start+chunkSize).map(([time,title,note])=>`<div class="agenda-item"><time>${time}</time><div><strong>${title}</strong>${note?`<small>${note}</small>`:''}</div></div>`).join('');
     section('agenda',`agenda-${day}-${part}`,data.title,data.subtitle,`<div class="content agenda-content"><aside class="card agenda-summary"><span class="tag">${data.tag}</span><h3>${data.title}</h3><p>${data.subtitle}</p><div class="day-nav">${tabs}</div><div class="agenda-part">Part ${part} of ${Math.ceil(data.items.length/chunkSize)} · use Next for more</div></aside><div class="agenda-list">${rows}</div></div>`);
   }
 }
 people.forEach(([name,slot,role,initial],i)=>section('people',`people-${i+1}`,'Voices for the journey.',`${i+1} of ${people.length} · session hosts and facilitators`,`<div class="content two-col"><div class="image-frame speaker-initial" aria-hidden="true">${initial}</div><div class="card feature-card"><span class="tag">${slot}</span><h3>${name}</h3><p>${role}</p><p class="optional">Portraits and remaining names will be added when confirmed.</p></div></div>`));
 section('recognition','recognition','Celebrate the climb.','Recognition and appreciation',`<div class="content two-col"><div class="card feature-card"><span class="tag">Recognition</span><h3>Our moments together</h3><p>Monday 17:00 · Rewards & Recognition</p><p>Wednesday 20:00 · Hour of Appreciation</p></div><div class="image-frame"><img src="assets/images/trophy-star.jpg" alt="WEPA New Heights trophy concept"></div></div>`);
 section('recognition','recognition-trophies','A shared achievement.','WEPA New Heights recognition concepts',`<div class="content two-col"><div class="image-frame"><img src="assets/images/trophy-grid.jpg" alt="Recognition trophy concepts"></div><div class="card feature-card"><span class="tag">Together for a better life</span><h3>Recognising the team</h3><p>We celebrate contributions and the next stage of the Mumbai DEC.</p></div></div>`);
 section('recognition','recognition-theme','Same team. Higher horizons.','The Achieving New Heights event identity',`<div class="content two-col"><div class="card feature-card"><span class="tag">Event identity</span><h3>Learn. Connect. Grow.</h3><p>Four days to take stock, learn together and look ahead.</p></div><div class="image-frame"><img src="assets/images/theme-sample.jpg" alt="New Heights event signage concept"></div></div>`);
 section('venue','venue','Athiva Resort & Spa','Old Pune–Mumbai Highway (NH 48), Khandala · Maharashtra 410301',`<div class="content two-col"><div class="image-frame"><img src="${venueImage}" alt="Athiva Resort & Spa exterior"></div><div class="card feature-card"><span class="tag">The venue</span><h3>Mountain setting. Team focus.</h3><p>Rooms, meeting spaces, dining and leisure facilities in Khandala.</p><div><a class="action" href="${maps}" target="_blank" rel="noreferrer">Open Google Maps ↗</a><a class="action secondary" href="https://www.athiva.com/athiva-khandala/" target="_blank" rel="noreferrer">Venue website ↗</a></div></div></div>`);
 facilities.forEach(([name,description,image],i)=>section('facilities',`facilities-${i+1}`,'Between sessions',`${i+1} of ${facilities.length} · availability depends on the venue schedule`,`<div class="content two-col"><div class="image-frame"><img src="${image}" alt="${name} at Athiva Resort" loading="lazy"></div><div class="card feature-card"><span class="tag">Facility ${String(i+1).padStart(2,'0')}</span><h3>${name}</h3><p>${description}</p></div></div>`));
 const active=!!apiBase;
 section('photos','photos','Share the moments.','Scan the code to open this section on your phone.',`<div class="content two-col"><div class="qr-box"><img class="qr-image" src="assets/images/photo-upload-qr.png" alt="QR code linking to the photo upload section"></div><div class="card feature-card"><form id="photoUploadForm" class="photo-form"><div class="file-group"><label for="photoFile">Choose a photo · JPEG, PNG or WebP</label><input id="photoFile" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required ${active?'':'disabled'}></div><div><label for="photoCaption">Caption (optional)</label><input id="photoCaption" name="caption" maxlength="140" placeholder="What was happening?" ${active?'':'disabled'}></div><div><label for="photoName">Your name (optional)</label><input id="photoName" name="name" maxlength="60" placeholder="Photo credit" ${active?'':'disabled'}></div><button class="action" type="submit" ${active?'':'disabled'}>Upload photo ↗</button><div id="photoStatus" class="photo-status" role="status">${active?'Photos appear after review.':'Photo uploads need storage connected before they can open.'}</div></form></div></div>`);
 section('photos','photo-wall','Moments we made together','Approved team photos will appear here.',`<div id="photoGallery" class="content gallery"><div class="empty-gallery">${active?'No photos yet. Share the first moment during the off-site.':'The photo wall will open when uploads are connected.'}</div></div>`);
 section('share','share','Scan. Save. Go.','Keep the agenda, travel details and directions on your phone.',`<div class="content two-col"><div class="card feature-card"><span class="tag">WEPA India · New Heights</span><h3>7–10 December 2026</h3><p>Athiva Resort & Spa, Khandala</p><div><button class="action" type="button" id="shareButton">Share page ↗</button><button class="action secondary" type="button" id="calendarButton">Add to calendar</button><a class="action secondary" href="assets/images/event-qr.png" download="WEPA-New-Heights-QR.png">Download QR</a></div></div><div class="qr-box"><img class="qr-image" src="assets/images/event-qr.png" alt="QR code for this off-site website"></div></div>`);
}
function render(){
 const oldId=slides[current]?.id||location.hash.slice(1)||'top';buildSlides();
 document.getElementById('deck').innerHTML=slides.map((s,i)=>`<section class="screen ${s.extra}" id="${s.id}" data-category="${s.category}" aria-label="${s.title||'Overview'}" ${i?'hidden':''}><div class="screen-shell">${s.title?`<div><span class="eyebrow">${categories.find(c=>c[0]===s.category)[1]}</span><h2 class="screen-title">${s.title}</h2>${s.subtitle?`<p class="screen-subtitle">${s.subtitle}</p>`:''}</div>`:''}${s.body}</div></section>`).join('');
 document.getElementById('categoryMenu').innerHTML=categories.map(([key,label,icon],i)=>`<button type="button" data-go="${key}"><span>${icon} &nbsp;${label}</span><span class="number">${String(i+1).padStart(2,'0')}</span></button>`).join('');
 current=Math.max(0,slides.findIndex(s=>s.id===oldId||s.category===oldId));show(current,false);wirePhoto();loadGallery();
}
function show(index,updateHash=true){
 current=Math.max(0,Math.min(index,slides.length-1));
 document.querySelectorAll('.screen').forEach((el,i)=>{el.hidden=i!==current;el.setAttribute('aria-hidden',String(i!==current))});
 const s=slides[current];document.getElementById('previousButton').disabled=current===0;document.getElementById('nextButton').disabled=current===slides.length-1;
 document.getElementById('sectionName').textContent=categories.find(c=>c[0]===s.category)[1];document.getElementById('screenCounter').textContent=`${current+1} / ${slides.length}`;document.getElementById('progressFill').style.width=`${(current+1)/slides.length*100}%`;
 closeMenu();if(updateHash)history.replaceState(null,'',`#${s.id}`);
}
function go(id){if(id==='menu'){openMenu();return}const i=slides.findIndex(s=>s.id===id);const j=i>=0?i:slides.findIndex(s=>s.category===id);if(j>=0)show(j)}
function openMenu(){menuOpen=true;document.getElementById('categoryMenu').hidden=false;document.getElementById('menuButton').setAttribute('aria-expanded','true')}
function closeMenu(){menuOpen=false;document.getElementById('categoryMenu').hidden=true;document.getElementById('menuButton').setAttribute('aria-expanded','false')}
render();
document.getElementById('menuButton').addEventListener('click',()=>menuOpen?closeMenu():openMenu());
document.getElementById('previousButton').addEventListener('click',()=>show(current-1));document.getElementById('nextButton').addEventListener('click',()=>show(current+1));
document.addEventListener('click',e=>{const jump=e.target.closest('[data-go]');if(jump){e.preventDefault();go(jump.dataset.go)}const anchor=e.target.closest('a[href^="#"]');if(anchor){e.preventDefault();go(anchor.getAttribute('href').slice(1))}});
addEventListener('hashchange',()=>go(location.hash.slice(1)||'top'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();return}if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();show(current+1)}if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();show(current-1)}if(e.key==='Home'){e.preventDefault();show(0)}});
let touchX=0,touchY=0;document.getElementById('deck').addEventListener('touchstart',e=>{touchX=e.changedTouches[0].screenX;touchY=e.changedTouches[0].screenY},{passive:true});document.getElementById('deck').addEventListener('touchend',e=>{if(e.target.closest('input,button,a'))return;const dx=e.changedTouches[0].screenX-touchX,dy=e.changedTouches[0].screenY-touchY;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)show(current+(dx<0?1:-1))},{passive:true});
let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{const target=slides[current]?.id;render();go(target)},180)});
function status(message,type=''){const el=document.getElementById('photoStatus');if(el){el.textContent=message;el.className=`photo-status ${type}`}}
async function preparePhoto(file){if(file.size<=1500000)return file;const bitmap=await createImageBitmap(file);try{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('Could not prepare photo.');for(const edge of [1800,1500,1200,950]){const scale=Math.min(1,edge/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);for(const q of [.8,.68,.55]){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',q));if(blob?.size<=1500000)return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'})}}throw Error('Please choose a smaller photo.')}finally{bitmap.close()}}
function wirePhoto(){document.getElementById('photoUploadForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,file=form.querySelector('#photoFile').files[0],button=form.querySelector('button[type=submit]');if(!file)return;if(file.size>20*1024*1024){status('Choose a photo smaller than 20 MB.','error');return}button.disabled=true;status('Preparing and uploading your photo…');try{const data=new FormData(form);data.set('photo',await preparePhoto(file));const response=await fetch(apiUrl('/api/photos'),{method:'POST',body:data});const result=await response.json();if(!response.ok)throw Error(result.error||'Upload failed.');form.reset();status('Thank you. Your photo will appear after review.','success')}catch(error){status(error.message||'Upload failed. Try again.','error')}finally{button.disabled=false}})}
async function loadGallery(){const el=document.getElementById('photoGallery');if(!el||!apiBase)return;try{const response=await fetch(apiUrl('/api/photos'),{cache:'no-store'});if(!response.ok)throw Error();const {photos}=await response.json();if(photos.length)el.innerHTML=photos.slice(0,6).map(p=>`<figure class="gallery-item"><img src="${apiUrl('/api/photos/'+encodeURIComponent(p.id)+'/image')}" alt="Off-site photo"><span></span></figure>`).join('');el.querySelectorAll('.gallery-item span').forEach((node,i)=>node.textContent=photos[i].caption||'A New Heights moment')}catch{el.innerHTML='<div class="empty-gallery">The photo wall is temporarily unavailable.</div>'}}
const liveUrl=location.href.split('#')[0];document.addEventListener('click',async e=>{if(e.target.id==='shareButton'){try{if(navigator.share)await navigator.share({title:document.title,url:liveUrl});else{await navigator.clipboard.writeText(liveUrl);e.target.textContent='Link copied ✓'}}catch{}}if(e.target.id==='calendarButton'){const ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:wepa-new-heights-2026@wepa-india\r\nDTSTART;VALUE=DATE:20261207\r\nDTEND;VALUE=DATE:20261211\r\nSUMMARY:WEPA India — New Heights DEC Off-site\r\nLOCATION:Athiva Resort & Spa, Khandala\r\nEND:VEVENT\r\nEND:VCALENDAR';const u=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));const a=document.createElement('a');a.href=u;a.download='WEPA-New-Heights-2026.ics';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}});
