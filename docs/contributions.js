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

photoForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = document.getElementById('photoFile').files[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) {
    showStatus(photoStatus, 'Please choose a photo smaller than 20 MB.', 'error');
    return;
  }
  const button = photoForm.querySelector('button[type=submit]');
  button.disabled = true;
  showStatus(photoStatus, 'Preparing your photo…');
  try {
    if (!apiBase) throw new Error('Photo uploads are not ready yet.');
    const upload = await preparePhoto(file);
    const payload = new FormData(photoForm);
    payload.set('photo', upload);
    showStatus(photoStatus, 'Uploading your photo…');
    const response = await fetch(apiUrl('/api/photos'), { method: 'POST', body: payload });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Upload failed. Please try again.');
    photoForm.reset();
    showStatus(photoStatus, 'Thank you! Your photo has been received and will appear after review.', 'success');
  } catch (error) {
    showStatus(photoStatus, error.message || 'Upload failed. Please try again.', 'error');
  } finally {
    button.disabled = false;
  }
});

checkPhotoService().then(ready => { if (ready) loadGallery(); });
