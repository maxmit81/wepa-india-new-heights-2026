const photoForm = document.getElementById('photoUploadForm');
const photoStatus = document.getElementById('photoStatus');
const feedbackForm = document.getElementById('feedbackForm');
const feedbackStatus = document.getElementById('feedbackStatus');
const gallery = document.getElementById('photoGallery');
const apiBase = (window.WEPA_API_BASE || '').replace(/\/$/, '');
const apiUrl = (path) => `${apiBase}${path}`;
const MAX_UPLOAD_BYTES = 1_500_000;

if (!apiBase) {
  for (const form of [photoForm, feedbackForm]) {
    if (!form) continue;
    for (const input of form.querySelectorAll('input, select, textarea, button')) input.disabled = true;
  }
  showStatus(photoStatus, 'Photo sharing will open before the off-site. The event information and QR code are ready to use.');
  showStatus(feedbackStatus, 'Feedback will open during the off-site.');
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

async function loadGallery() {
  if (!gallery) return;
  try {
    if (!apiBase) throw new Error('API not configured');
    const response = await fetch(apiUrl('/api/photos'), { cache: 'no-store' });
    if (!response.ok) throw new Error('Gallery unavailable');
    const { photos } = await response.json();
    gallery.replaceChildren();
    if (!photos.length) {
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
    gallery.textContent = apiBase ? 'The gallery is temporarily unavailable. Please try again later.' : 'The photo wall will open before the off-site.';
  }
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
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Upload failed.');
    photoForm.reset();
    showStatus(photoStatus, 'Thank you! Your photo has been received and will appear after review.', 'success');
  } catch (error) {
    showStatus(photoStatus, error.message || 'Upload failed. Please try again.', 'error');
  } finally {
    button.disabled = false;
  }
});

feedbackForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = feedbackForm.querySelector('button[type=submit]');
  button.disabled = true;
  showStatus(feedbackStatus, 'Sending your feedback…');
  const form = new FormData(feedbackForm);
  const payload = Object.fromEntries(form.entries());
  try {
    if (!apiBase) throw new Error('Feedback is not ready yet.');
    const response = await fetch(apiUrl('/api/feedback'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not save feedback.');
    feedbackForm.reset();
    showStatus(feedbackStatus, 'Thank you—your feedback was saved.', 'success');
  } catch (error) {
    showStatus(feedbackStatus, error.message || 'Could not save feedback. Please try again.', 'error');
  } finally {
    button.disabled = false;
  }
});

loadGallery();
