const apiBase = (window.WEPA_API_BASE || '').replace(/\/$/, '');
const api = (path) => `${apiBase}${path}`;
let reviewKey = '';
let previewUrls = [];
let busy = false;
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
  document.querySelectorAll('.select-all').forEach(box => { box.checked = false; box.indeterminate = false; });
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
    const selectLabel = document.createElement('label'); selectLabel.className = 'photo-select';
    const select = document.createElement('input'); select.type = 'checkbox'; select.value = photo.id;
    select.className = 'photo-checkbox'; select.dataset.group = photo.status;
    select.setAttribute('aria-label', 'Select photo: ' + (photo.caption || photo.name || photo.id));
    select.addEventListener('change', updateSelection);
    selectLabel.append(select, document.createTextNode(' Select photo')); body.append(selectLabel);
    const caption = document.createElement('strong'); caption.textContent = photo.caption || 'No caption';
    const meta = document.createElement('p'); meta.textContent = `${photo.name || 'Anonymous'} · ${photo.createdAt}`;
    const controls = document.createElement('div'); controls.className = 'admin-buttons';
    for (const action of (photo.status === 'pending' ? ['approve','reject','delete'] : ['delete'])) {
      const button = document.createElement('button');
      button.className = action === 'delete' ? 'reject' : action; button.textContent = {approve:'Approve',reject:'Reject',delete:'Delete photo'}[action];
      button.type = 'button';
      button.addEventListener('click', async () => {
        if (busy) return;
        if (action === 'delete' && !window.confirm('Delete this photo permanently? It will be removed from the gallery and cannot be restored here.')) return;
        setBusy(true);
        try {
          const result = await authorizedFetch(`/api/admin/photos/${encodeURIComponent(photo.id)}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action}) });
          if (!result.ok) throw new Error('Could not update this photo.');
          await loadSubmissions();
          messageText({approve:'Photo added to the gallery.',reject:'Photo rejected.',delete:'Photo deleted.'}[action]);
        } catch (error) { messageText(error.message, true); }
        finally { setBusy(false); }
      });
      controls.append(button);
    }
    body.append(caption, meta, controls); article.append(img, body); (photo.status === 'approved' ? approved : pending).append(article);
  }
  updateSelection();
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

function updateSelection() {
  for (const group of ['pending', 'approved']) {
    const boxes = [...document.querySelectorAll('.photo-checkbox[data-group="' + group + '"]')];
    const selected = boxes.filter(box => box.checked).length;
    document.getElementById(group + 'SelectedCount').textContent = selected + ' selected';
    const all = document.querySelector('.select-all[data-group="' + group + '"]');
    all.checked = boxes.length > 0 && selected === boxes.length;
    all.indeterminate = selected > 0 && selected < boxes.length;
    all.disabled = busy || !boxes.length;
    document.querySelectorAll('.bulk-action[data-group="' + group + '"]').forEach(button => { button.disabled = busy || !selected; });
  }
}
function setBusy(value) {
  busy = value;
  grid.querySelectorAll('button, input').forEach(control => { control.disabled = value; });
  updateSelection();
}
for (const all of document.querySelectorAll('.select-all')) {
  all.addEventListener('change', () => {
    document.querySelectorAll('.photo-checkbox[data-group="' + all.dataset.group + '"]').forEach(box => { box.checked = all.checked; });
    updateSelection();
  });
}
for (const button of document.querySelectorAll('.bulk-action')) {
  button.addEventListener('click', async () => {
    if (busy) return;
    const ids = [...document.querySelectorAll('.photo-checkbox[data-group="' + button.dataset.group + '"]:checked')].map(box => box.value);
    if (!ids.length) return;
    const action = button.dataset.action;
    if (action === 'delete' && !window.confirm('Permanently delete ' + ids.length + ' selected photos? They will be removed from the gallery and cannot be restored here.')) return;
    setBusy(true); messageText(action === 'approve' ? 'Approving selected photos…' : 'Deleting selected photos…');
    try {
      const response = await authorizedFetch('/api/admin/photos/bulk', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action,ids})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update selected photos.');
      await loadSubmissions();
      messageText(result.changed + (action === 'approve' ? ' photos approved.' : ' photos deleted.'));
    } catch (error) { messageText(error.message, true); }
    finally { setBusy(false); }
  });
}
