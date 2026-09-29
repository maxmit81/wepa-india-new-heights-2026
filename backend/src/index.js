const MAX_BYTES = 1_500_000;
const MAX_BULK = 500;
const MAX_TOTAL_BYTES = 2_000_000_000;
const PHOTO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function cors(request, env) {
  const origin = request.headers.get('Origin');
  return origin && origin === env.ALLOWED_ORIGIN ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  } : {};
}

function json(data, status, headers) {
  return Response.json(data, { status, headers: { ...headers, 'Cache-Control': 'no-store' } });
}

function validImage(mime, bytes) {
  if (mime === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === 'image/png') return [137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x);
  if (mime === 'image/webp') return String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
  return false;
}

async function adminAllowed(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ') || !env.ADMIN_TOKEN) return false;
  const encoder = new TextEncoder();
  const [given, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(header.slice(7))),
    crypto.subtle.digest('SHA-256', encoder.encode(env.ADMIN_TOKEN))
  ]);
  const a = new Uint8Array(given), b = new Uint8Array(expected);
  let different = 0;
  for (let i=0; i<a.length; i++) different |= a[i] ^ b[i];
  return different === 0;
}


const objectKey = id => 'photos/' + id;
function offsetFrom(url) {
  const value = Number(url.searchParams.get('offset') || 0);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
async function removePhotos(env, ids, pendingOnly = false) {
  const chunks = [];
  for (let i = 0; i < ids.length; i += 80) chunks.push(ids.slice(i, i + 80));
  // Hide first; leave failed deletions reserved and retryable until storage is removed.
  await env.DB.batch(chunks.map(chunk => env.DB.prepare(
    "UPDATE photos SET status='deleting' WHERE id IN (" + chunk.map(() => '?').join(',') + ") AND " +
    (pendingOnly ? "status='pending'" : "status IN ('pending','approved','rejected','deleting')")
  ).bind(...chunk)));
  const rows = await env.DB.batch(chunks.map(chunk => env.DB.prepare(
    "SELECT id FROM photos WHERE status='deleting' AND id IN (" + chunk.map(() => '?').join(',') + ')'
  ).bind(...chunk)));
  const removing = rows.flatMap(result => result.results.map(row => row.id));
  if (!removing.length) return 0;
  await env.PHOTOS.delete(removing.map(objectKey));
  const results = await env.DB.batch(chunks.map(chunk => env.DB.prepare(
    "DELETE FROM photos WHERE status='deleting' AND id IN (" + chunk.map(() => '?').join(',') + ')'
  ).bind(...chunk)));
  return results.reduce((sum, result) => sum + result.meta.changes, 0);
}
async function cleanupIncomplete(env) {
  // Upload handlers finish well before an hour; expired reservations are safe to reclaim.
  await env.DB.prepare("UPDATE photos SET status='deleting' WHERE status='uploading' AND created_at < datetime('now','-1 hour')").run();
  const rows = await env.DB.prepare("SELECT id FROM photos WHERE status='deleting' LIMIT 500").all();
  if (rows.results.length) await removePhotos(env, rows.results.map(row => row.id));
}

export default {
  async scheduled(event, env) { await cleanupIncomplete(env); },
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const headers = cors(request, env);
    if (request.method === 'OPTIONS') {
      return request.headers.get('Origin') === env.ALLOWED_ORIGIN
        ? new Response(null, { status: 204, headers })
        : new Response('Forbidden', { status: 403 });
    }
    const isAdmin = path.startsWith('/api/admin/');
    if (isAdmin && !(await adminAllowed(request, env))) return json({ error: 'Incorrect review key.' }, 401, headers);
    if (request.method === 'POST' && request.headers.get('Origin') !== env.ALLOWED_ORIGIN) {
      return json({ error: 'Open this form from the event website.' }, 403, headers);
    }
    try {
      if (path === '/api/health' && request.method === 'GET') {
        await env.DB.prepare('SELECT storage_key FROM photos LIMIT 1').first();
        await env.PHOTOS.head('health-check');
        return json({ ready: true, capacityBytes: MAX_TOTAL_BYTES }, 200, headers);
      }
      if (path === '/api/photos' && request.method === 'GET') {
        const offset = offsetFrom(url);
        const result = await env.DB.prepare("SELECT id, caption, uploader_name AS name FROM photos WHERE status = 'approved' ORDER BY created_at DESC, id DESC LIMIT 61 OFFSET ?").bind(offset).all();
        return json({photos:result.results.slice(0,60),nextOffset:result.results.length > 60 ? offset + 60 : null},200,headers);
      }
      if (path === '/api/photos' && request.method === 'POST') {
        const form = await request.formData();
        const file = form.get('photo');
        if (!(file instanceof File) || !PHOTO_TYPES[file.type] || file.size < 100 || file.size > MAX_BYTES) {
          return json({ error: 'The photo could not be compressed enough. Please try a smaller image.' }, 400, headers);
        }
        const signature = new Uint8Array(await file.slice(0,16).arrayBuffer());
        if (!validImage(file.type, signature)) return json({ error: 'That file does not appear to be a valid photo.' }, 400, headers);
        const id = crypto.randomUUID();
        const name = String(form.get('name') || '').trim().slice(0,60);
        const caption = String(form.get('caption') || '').trim().slice(0,140);
        const key = objectKey(id);
        // One SQL statement reserves space atomically, including concurrent uploads.
        const reservation = await env.DB.prepare(
          "INSERT INTO photos (id,original_name,mime_type,bytes,caption,uploader_name,storage_key,status) SELECT ?,?,?,?,?,?,?,'uploading' WHERE COALESCE((SELECT SUM(bytes) FROM photos WHERE status != 'rejected'),0) + ? <= ?"
        ).bind(id,file.name.slice(0,180),file.type,file.size,caption,name,key,file.size,MAX_TOTAL_BYTES).run();
        if (!reservation.meta.changes) return json({ error: 'The 2 GB photo space is full. Ask the organiser to delete unwanted photos.' }, 507, headers);
        try {
          await env.PHOTOS.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
          const saved = await env.DB.prepare("UPDATE photos SET status='pending' WHERE id=? AND status='uploading'").bind(id).run();
          if (!saved.meta.changes) throw new Error('Upload reservation expired');
        } catch (error) {
          // Keep the reservation if cleanup fails; scheduled cleanup retries it.
          await env.PHOTOS.delete(key);
          await env.DB.prepare("DELETE FROM photos WHERE id=? AND status='uploading'").bind(id).run();
          throw error;
        }
        return json({ id, status: 'pending' }, 201, headers);
      }
      if (path === '/api/feedback' && request.method === 'POST') {
        const input = await request.json();
        const ratings = ['learning','speaking','connection','venue'].map(key => Number(input[key]));
        const ideas = String(input.ideas || '').trim();
        const name = String(input.name || '').trim().slice(0,60);
        if (ratings.some(n=>!Number.isInteger(n)||n<1||n>5) || !ideas || ideas.length>1000) {
          return json({ error: 'Please answer all five questions.' }, 400, headers);
        }
        await env.DB.prepare('INSERT INTO feedback (id, learning, speaking, connection, venue, ideas, name) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(),...ratings,ideas,name).run();
        return json({ saved: true }, 201, headers);
      }
      const photoMatch = path.match(/^\/api\/photos\/([a-f0-9-]{36})\/image$/);
      const pendingMatch = path.match(/^\/api\/admin\/photos\/([a-f0-9-]{36})\/image$/);
      if (request.method === 'GET' && (photoMatch || pendingMatch)) {
        const id = (photoMatch || pendingMatch)[1];
        const photo = await env.DB.prepare('SELECT image_data, storage_key, mime_type, status FROM photos WHERE id = ?').bind(id).first();
        if (!photo || !['pending','approved'].includes(photo.status) || (!pendingMatch && photo.status !== 'approved')) return new Response('Not found', { status: 404, headers });
        const stored = photo.storage_key ? await env.PHOTOS.get(photo.storage_key) : null;
        const body = stored?.body || (photo.image_data ? new Uint8Array(photo.image_data) : null);
        if (!body) return new Response('Not found', { status: 404, headers });
        return new Response(body, { headers: {
          ...headers, 'Content-Type': photo.mime_type, 'Content-Disposition': 'inline',
          'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'
        } });
      }
      if (path === '/api/admin/submissions' && request.method === 'GET') {
        const offset = offsetFrom(url);
        const [photos, approved, feedback, usage] = await Promise.all([
          env.DB.prepare("SELECT id, caption, uploader_name AS name, created_at AS createdAt FROM photos WHERE status IN ('pending','deleting') ORDER BY created_at DESC, id DESC LIMIT 501 OFFSET ?").bind(offset).all(),
          env.DB.prepare("SELECT id, caption, uploader_name AS name, created_at AS createdAt FROM photos WHERE status='approved' ORDER BY created_at DESC, id DESC LIMIT 501 OFFSET ?").bind(offset).all(),
          env.DB.prepare('SELECT * FROM feedback ORDER BY created_at DESC LIMIT 100').all(),
          env.DB.prepare("SELECT COALESCE(SUM(bytes),0) AS usedBytes FROM photos WHERE status != 'rejected'").first()
        ]);
        return json({ pending: photos.results.slice(0,500), approved: approved.results.slice(0,500), nextOffset: photos.results.length > 500 || approved.results.length > 500 ? offset + 500 : null, storage: {usedBytes:usage.usedBytes, capacityBytes:MAX_TOTAL_BYTES}, feedback: feedback.results.map(row=>({ ...row, createdAt: row.created_at })) }, 200, headers);
      }
      if (path === '/api/admin/storage/migrate' && request.method === 'POST' && env.MIGRATION_ENABLED === 'true') {
        const rows = await env.DB.prepare("SELECT id,image_data,mime_type FROM photos WHERE storage_key IS NULL AND image_data IS NOT NULL AND status IN ('pending','approved') LIMIT 5").all();
        let migrated = 0;
        for (const photo of rows.results) {
          const key = objectKey(photo.id);
          const original = new Uint8Array(photo.image_data);
          await env.PHOTOS.put(key, original, {httpMetadata:{contentType:photo.mime_type}});
          const copy = await env.PHOTOS.get(key);
          if (!copy) throw new Error('Migration verification failed');
          const hashes = await Promise.all([crypto.subtle.digest('SHA-256', original), crypto.subtle.digest('SHA-256', await copy.arrayBuffer())]);
          if (!new Uint8Array(hashes[0]).every((value, i) => value === new Uint8Array(hashes[1])[i])) throw new Error('Migration checksum mismatch');
          const result = await env.DB.prepare("UPDATE photos SET storage_key=?,image_data=NULL WHERE id=? AND storage_key IS NULL AND status IN ('pending','approved')").bind(key,photo.id).run();
          if (result.meta.changes) migrated++;
          else await env.PHOTOS.delete(key);
        }
        return json({migrated},200,headers);
      }
      if (path === '/api/admin/photos/bulk' && request.method === 'POST') {
        const input = await request.json();
        if (!['approve', 'delete'].includes(input.action) || !Array.isArray(input.ids) ||
            input.ids.length < 1 || input.ids.length > MAX_BULK ||
            input.ids.some(id => typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id))) {
          return json({ error: 'Choose between 1 and 500 photos and a valid action.' }, 400, headers);
        }
        const ids = [...new Set(input.ids)];
        if (input.action === 'delete') return json({action:'delete',changed:await removePhotos(env, ids)},200,headers);
        const statements = [];
        for (let i = 0; i < ids.length; i += 80) {
          const chunk = ids.slice(i, i + 80);
          const placeholders = chunk.map(() => '?').join(',');
          statements.push(input.action === 'delete'
            ? env.DB.prepare('DELETE FROM photos WHERE id IN (' + placeholders + ')').bind(...chunk)
            : env.DB.prepare("UPDATE photos SET status='approved', reviewed_at=? WHERE status='pending' AND id IN (" + placeholders + ')').bind(new Date().toISOString(), ...chunk));
        }
        const results = await env.DB.batch(statements);
        return json({ action: input.action, changed: results.reduce((sum, result) => sum + result.meta.changes, 0) }, 200, headers);
      }
      const reviewMatch = path.match(/^\/api\/admin\/photos\/([a-f0-9-]{36})$/);
      if (reviewMatch && request.method === 'POST') {
        const input = await request.json();
        if (input.action === 'delete') {
          const changed = await removePhotos(env, [reviewMatch[1]]);
          if (!changed) return json({ error: 'Photo not found or already deleted.' }, 404, headers);
          return json({ deleted: true }, 200, headers);
        }
        if (!['approve','reject'].includes(input.action)) return json({ error:'Invalid action' }, 400, headers);
        if (input.action === 'reject') {
          const changed = await removePhotos(env, [reviewMatch[1]], true);
          return json(changed ? {status:'rejected'} : {error:'Photo no longer pending.'}, changed ? 200 : 404, headers);
        }
        const status = 'approved';
        const photo = await env.DB.prepare("SELECT id FROM photos WHERE id=? AND status='pending'").bind(reviewMatch[1]).first();
        if (!photo) return json({ error:'Photo no longer pending.' }, 404, headers);
        const result = await env.DB.prepare("UPDATE photos SET status=?, reviewed_at=?, image_data=CASE WHEN ?='rejected' THEN NULL ELSE image_data END WHERE id=? AND status='pending'")
          .bind(status,new Date().toISOString(),status,reviewMatch[1]).run();
        if (!result.meta.changes) return json({ error:'Photo no longer pending.' }, 404, headers);
        return json({ status }, 200, headers);
      }
      return json({ error: 'Not found' }, 404, headers);
    } catch (error) {
      console.error('Off-site API failed:', error);
      return json({ error: 'Service temporarily unavailable. Please try again later.' }, 503, headers);
    }
  }
};
