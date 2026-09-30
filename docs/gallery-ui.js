(() => {
 const folder=document.getElementById('galleryFolder'),grid=document.getElementById('photoGallery'),count=document.getElementById('galleryCount'),dialog=document.getElementById('photoViewer');
 const image=dialog.querySelector('img'),stage=dialog.querySelector('.viewer-stage'),caption=dialog.querySelector('.viewer-caption'),position=dialog.querySelector('.viewer-position'),zoomText=dialog.querySelector('.viewer-zoom');
 let current=0,zoom=1,trigger,loading=false;
 const items=()=>[...grid.querySelectorAll('.photo-card img')];
 function sync(){const photos=items();count.textContent=photos.length?`${photos.length} photo${photos.length===1?'':'s'} loaded`:'Your memories live here';grid.querySelectorAll('.photo-card').forEach(card=>{if(card.querySelector('button'))return;const img=card.querySelector('img');if(!img)return;const button=document.createElement('button');button.type='button';button.className='photo-open';button.setAttribute('aria-label',`Enlarge ${img.alt}`);img.before(button);button.append(img);button.addEventListener('click',()=>{trigger=button;current=items().indexOf(img);show();dialog.showModal()})})}
 function setZoom(value){const oldZoom=zoom,cx=stage.scrollLeft+stage.clientWidth/2,cy=stage.scrollTop+stage.clientHeight/2;zoom=Math.max(1,Math.min(4,value));image.style.width=`${zoom*100}%`;image.style.height=`${zoom*100}%`;zoomText.textContent=`${Math.round(zoom*100)}%`;dialog.querySelector('[data-viewer="out"]').disabled=zoom===1;dialog.querySelector('[data-viewer="in"]').disabled=zoom===4;stage.style.cursor=zoom>1?'grab':'default';if(zoom===1){stage.scrollTop=0;stage.scrollLeft=0}else{stage.scrollLeft=cx*zoom/oldZoom-stage.clientWidth/2;stage.scrollTop=cy*zoom/oldZoom-stage.clientHeight/2}}
 function show(){const photos=items();if(!photos.length)return;current=Math.max(0,Math.min(current,photos.length-1));const source=photos[current];image.src=source.src;image.alt=source.alt;caption.textContent=source.closest('figure').querySelector('figcaption')?.textContent||source.alt;position.textContent=`${current+1} / ${photos.length}`;dialog.querySelector('[data-viewer="prev"]').disabled=current===0;dialog.querySelector('[data-viewer="next"]').disabled=current===photos.length-1&&nextGalleryOffset==null;setZoom(1)}
 async function move(direction){if(loading)return;if(direction>0&&current===items().length-1&&nextGalleryOffset!=null){loading=true;position.textContent='Loading more…';await loadGallery(true);loading=false;}const n=current+direction;if(n>=0&&n<items().length){current=n;show()}else show()}
 dialog.addEventListener('click',event=>{const action=event.target.closest('[data-viewer]')?.dataset.viewer;if(action==='close')dialog.close();if(action==='prev')move(-1);if(action==='next')move(1);if(action==='in')setZoom(zoom+.5);if(action==='out')setZoom(zoom-.5);if(action==='reset')setZoom(1)});
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();move(1)}if(event.key==='ArrowLeft'){event.preventDefault();move(-1)}if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(zoom+.5)}if(event.key==='-'){event.preventDefault();setZoom(zoom-.5)}});
 dialog.addEventListener('close',()=>{image.removeAttribute('src');trigger?.focus({preventScroll:true})});
 image.addEventListener('dblclick',()=>setZoom(zoom===1?2:1));
 // Capture gestures inside the photo only; toolbar controls retain normal behaviour.
 image.draggable=false;
 const pointers=new Map();let drag=null,pinch=null,swipe=null;
 const distance=()=>{const [a,b]=[...pointers.values()];return Math.hypot(a.x-b.x,a.y-b.y)};
 function clearGesture(){pointers.clear();drag=pinch=swipe=null;}
 stage.addEventListener('wheel',event=>{event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?stage.clientHeight:1);setZoom(zoom*Math.exp(-Math.max(-200,Math.min(200,delta))*.002));},{passive:false});
 stage.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'&&event.button!==0)return;
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});stage.setPointerCapture(event.pointerId);
  if(pointers.size===2){pinch={distance:distance(),zoom};drag=swipe=null;}
  else if(pointers.size===1){drag={x:event.clientX,y:event.clientY,left:stage.scrollLeft,top:stage.scrollTop};swipe=zoom===1&&event.pointerType!=='mouse'?{x:event.clientX,y:event.clientY}:null;}
 });
 stage.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(pointers.size===2&&pinch){if(pinch.distance>0)setZoom(pinch.zoom*distance()/pinch.distance);}
  else if(pointers.size===1&&drag&&zoom>1){stage.scrollLeft=drag.left+drag.x-event.clientX;stage.scrollTop=drag.top+drag.y-event.clientY;}
 });
 function endPointer(event){
  if(!pointers.has(event.pointerId))return;
  if(event.type==='pointerup'&&pointers.size===1&&swipe&&zoom===1){const dx=event.clientX-swipe.x,dy=event.clientY-swipe.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);}
  pointers.delete(event.pointerId);pinch=swipe=drag=null;
  if(pointers.size===1){const point=[...pointers.values()][0];drag={x:point.x,y:point.y,left:stage.scrollLeft,top:stage.scrollTop};}
 }
 stage.addEventListener('pointerup',endPointer);stage.addEventListener('pointercancel',endPointer);stage.addEventListener('lostpointercapture',endPointer);
 dialog.addEventListener('close',clearGesture);
 new MutationObserver(sync).observe(grid,{childList:true});sync();
 const refresh=document.getElementById('refreshGallery');refresh.addEventListener('click',async()=>{refresh.disabled=true;await loadGallery();refresh.disabled=false});
 // Newly approved photos appear while the folder is open; never interrupt a viewer.
 setInterval(()=>{if(folder.open&&!dialog.open&&!document.hidden&&nextGalleryOffset==null)loadGallery()},60000);
})();
