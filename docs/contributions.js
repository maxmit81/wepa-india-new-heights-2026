const photoForm = document.getElementById('photoUploadForm');
const photoStatus = document.getElementById('photoStatus');
const gallery = document.getElementById('photoGallery');
const apiBase = (window.WEPA_API_BASE || '').replace(/\/$/, '');
const apiUrl = (path) => `${apiBase}${path}`;
const MAX_UPLOAD_BYTES = 1_500_000;

// An upload button is enabled only after the deployed storage service responds.
function setPhotoEnabled(enabled) {
  if (!photoForm) return;
  for (const input of photoForm.querySelectorAll('input, button')) input.disabled = !enabled;
}
setPhotoEnabled(false);
async function checkPhotoService() {
  if (!apiBase) {
    showStatus(photoStatus, 'Photo sharing is not open yet. Please check back before the off-site.');
    return false;
  }
  try {
    const response = await fetch(apiUrl('/api/health'), { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.ready) throw new Error('Unavailable');
    setPhotoEnabled(true);
    showStatus(photoStatus, 'Ready to upload. Photos are reviewed before appearing below.');
    return true;
  } catch {
    setPhotoEnabled(false);
    showStatus(photoStatus, 'Photo sharing is temporarily unavailable. Please try again later.', 'error');
    return false;
  }
}

async function preparePhoto(file) {
  if (file.size <= MAX_UPLOAD_BYTES) return file;
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not prepare the photo.');
    for (const edge of [1800, 1600, 1400, 1200, 1000]) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.72, 0.6]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= MAX_UPLOAD_BYTES) {
          const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          return new File([blob], name, { type: 'image/jpeg' });
        }
      }
    }
    throw new Error('Please choose a smaller photo.');
  } finally { bitmap.close(); }
}

function showStatus(target, message, type = '') {
  target.textContent = message;
  target.className = `form-status ${type}`;
}

let nextGalleryOffset = 0;
const morePhotos = document.createElement('button');
morePhotos.type = 'button'; morePhotos.className = 'btn btn-primary'; morePhotos.textContent = 'Load more photos'; morePhotos.hidden = true;
gallery?.after(morePhotos);
morePhotos.addEventListener('click', () => loadGallery(true));
async function loadGallery(append = false) {
  if (!gallery) return;
  try {
    if (!apiBase) throw new Error('API not configured');
    morePhotos.disabled = true;
    const response = await fetch(apiUrl('/api/photos?offset=' + (append ? nextGalleryOffset : 0)), { cache: 'no-store' });
    if (!response.ok) throw new Error('Gallery unavailable');
    const { photos, nextOffset } = await response.json();
    nextGalleryOffset = nextOffset; morePhotos.hidden = nextOffset == null;
    if (!append) gallery.replaceChildren();
    if (!photos.length && !append) {
      const empty = document.createElement('p');
      empty.className = 'gallery-empty';
      empty.textContent = 'No photos yet. Be the first to share one during the off-site.';
      gallery.append(empty);
      return;
    }
    for (const photo of photos) {
      const figure = document.createElement('figure');
      figure.className = 'photo-card';
      const img = document.createElement('img');
      img.src = apiUrl(`/api/photos/${encodeURIComponent(photo.id)}/image`);
      img.alt = photo.caption || 'DEC off-site moment';
      img.loading = 'lazy';
      const caption = document.createElement('figcaption');
      caption.textContent = photo.caption || 'A moment from New Heights';
      if (photo.name) {
        const credit = document.createElement('small');
        credit.textContent = `Shared by ${photo.name}`;
        caption.append(credit);
      }
      figure.append(img, caption);
      gallery.append(figure);
    }
  } catch {
    if (append) { morePhotos.textContent = 'Could not load more. Tap to retry'; return; }
    gallery.textContent = apiBase ? 'The gallery is temporarily unavailable. Please try again later.' : 'The photo wall will open before the off-site.';
  } finally { morePhotos.disabled = false; }
}


const photoInput = document.getElementById('photoFile');
const nameInput = document.getElementById('photoName');
const resultsList = document.createElement('ul');
resultsList.className = 'upload-results';
resultsList.setAttribute('aria-label', 'Photo upload results');
photoStatus.after(resultsList);
let uploading = false;
photoInput.addEventListener('change', () => {
  const count = photoInput.files.length;
  photoInput.setCustomValidity(count > 15 ? 'Please select no more than 15 photos at a time.' : '');
  showStatus(photoStatus, count > 15 ? 'Too many photos. Please choose up to 15 at a time.' : count ? count + ' photo' + (count === 1 ? '' : 's') + ' selected. Ready to upload.' : 'Choose up to 15 photos.', count > 15 ? 'error' : '');
  resultsList.replaceChildren();
});
nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
photoForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (uploading) return;
  const files = Array.from(photoInput.files);
  const name = nameInput.value.trim();
  if (!name) { nameInput.setCustomValidity('Please enter your name.'); nameInput.reportValidity(); return; }
  if (!files.length || files.length > 15) {
    showStatus(photoStatus, 'Please select between 1 and 15 photos.', 'error'); return;
  }
  uploading = true;
  setPhotoEnabled(false);
  resultsList.replaceChildren();
  let completed = 0;
  for (const [index, file] of files.entries()) {
    const row = document.createElement('li');
    row.textContent = file.name + ' — preparing…';
    resultsList.append(row);
    showStatus(photoStatus, 'Uploading ' + (index + 1) + ' of ' + files.length + '… Please keep this page open.');
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP image.');
      if (file.size > 20 * 1024 * 1024) throw new Error('Larger than 20 MB. Choose a smaller photo.');
      const upload = await preparePhoto(file);
      const payload = new FormData();
      payload.set('name', name);
      payload.set('photo', upload);
      row.textContent = file.name + ' — uploading…';
      const response = await fetch(apiUrl('/api/photos'), { method: 'POST', body: payload });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Upload failed. Please select this photo again to retry.');
      completed++;
      row.textContent = file.name + ' — received, awaiting review';
      row.className = 'upload-success';
    } catch (error) {
      row.textContent = file.name + ' — ' + (error.message || 'Upload failed. Please try again.');
      row.className = 'upload-error';
    }
  }
  photoInput.value = '';
  const failed = files.length - completed;
  showStatus(photoStatus, completed + ' of ' + files.length + ' photos received and awaiting review.' + (failed ? ' ' + failed + ' failed. Select only the failed photos to try again.' : ' Thank you!'), failed ? 'error' : 'success');
  uploading = false;
  setPhotoEnabled(true);
});
window.addEventListener('beforeunload', (event) => { if (uploading) { event.preventDefault(); event.returnValue = ''; } });
checkPhotoService().then(ready => { if (ready) loadGallery(); });
