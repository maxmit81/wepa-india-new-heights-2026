const apiBase = (window.WEPA_API_BASE || '').replace(/\/$/, '');
const api = (path) => `${apiBase}${path}`;
let reviewKey = '';
let previewUrls = [];
const form = document.getElementById('adminLogin');
const message = document.getElementById('adminMessage');
const grid = document.getElementById('adminGrid');

async function authorizedFetch(path, options = {}) {
  return fetch(api(path), { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${reviewKey}` }, cache: 'no-store' });
}

function messageText(value, bad = false) {
  message.textContent = value;
  message.className = `form-status ${bad ? 'error' : 'success'}`;
}

async function loadSubmissions() {
  const response = await authorizedFetch('/api/admin/submissions');
  if (!response.ok) throw new Error(response.status === 401 ? 'Incorrect review key.' : 'Could not load submissions.');
  const data = await response.json();
  previewUrls.forEach(URL.revokeObjectURL);
  previewUrls = [];
  grid.hidden = false;
  document.getElementById('photoCount').textContent = String(data.pending.length);
  document.getElementById('approvedCount').textContent = String((data.approved || []).length);
  document.getElementById('feedbackCount').textContent = String(data.feedback.length);
  const pending = document.getElementById('pendingPhotos');
  const feedback = document.getElementById('feedbackList');
  const approved = document.getElementById('approvedPhotos');
  approved.replaceChildren();
  if (!(data.approved || []).length) approved.textContent = 'No published photos yet.';
  pending.replaceChildren();
  feedback.replaceChildren();
  if (!data.pending.length) pending.textContent = 'No photos are awaiting review.';
  if (!data.feedback.length) feedback.textContent = 'No feedback has been submitted yet.';
  for (const photo of [...data.pending.map(p => ({...p, status:'pending'})), ...(data.approved || []).map(p => ({...p, status:'approved'}))]) {
    const article = document.createElement('article');
    article.className = 'admin-photo';
    const img = document.createElement('img');
    img.alt = photo.caption || 'Submitted event photo';
    const imageResponse = await authorizedFetch(`/api/admin/photos/${encodeURIComponent(photo.id)}/image`);
    if (imageResponse.ok) {
      const url = URL.createObjectURL(await imageResponse.blob());
      previewUrls.push(url); img.src = url;
    }
    const body = document.createElement('div'); body.className = 'admin-photo-body';
    const caption = document.createElement('strong'); caption.textContent = photo.caption || 'No caption';
    const meta = document.createElement('p'); meta.textContent = `${photo.name || 'Anonymous'} · ${photo.createdAt}`;
    const controls = document.createElement('div'); controls.className = 'admin-buttons';
    for (const action of (photo.status === 'pending' ? ['approve','reject','delete'] : ['delete'])) {
      const button = document.createElement('button');
      button.className = action === 'delete' ? 'reject' : action; button.textContent = {approve:'Approve',reject:'Reject',delete:'Delete photo'}[action];
      button.type = 'button';
      button.addEventListener('click', async () => {
        if (action === 'delete' && !window.confirm('Delete this photo permanently? It will be removed from the gallery and cannot be restored here.')) return;
        button.disabled = true;
        try {
          const result = await authorizedFetch(`/api/admin/photos/${encodeURIComponent(photo.id)}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action}) });
          if (!result.ok) throw new Error('Could not update this photo.');
          await loadSubmissions();
          messageText({approve:'Photo added to the gallery.',reject:'Photo rejected.',delete:'Photo deleted.'}[action]);
        } catch (error) { messageText(error.message, true); button.disabled = false; }
      });
      controls.append(button);
    }
    body.append(caption, meta, controls); article.append(img, body); (photo.status === 'approved' ? approved : pending).append(article);
  }
  for (const item of data.feedback) {
    const article = document.createElement('article'); article.className = 'admin-feedback';
    const title = document.createElement('strong'); title.textContent = item.name || 'Anonymous';
    const date = document.createElement('small'); date.textContent = ` · ${item.createdAt}`;
    const ratings = document.createElement('p'); ratings.textContent = `Sessions ${item.learning}/5 · Speaking ${item.speaking}/5 · Connection ${item.connection}/5 · Venue ${item.venue}/5`;
    const ideas = document.createElement('p'); ideas.textContent = item.ideas;
    article.append(title, date, ratings, ideas); feedback.append(article);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!apiBase) return messageText('The submissions service is not configured yet.', true);
  reviewKey = document.getElementById('adminKey').value;
  document.getElementById('adminKey').value = '';
  messageText('Loading…');
  try { await loadSubmissions(); form.hidden = true; messageText('Review desk ready.'); }
  catch (error) { reviewKey = ''; messageText(error.message, true); }
});
