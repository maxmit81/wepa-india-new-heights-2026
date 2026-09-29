const MAX_BYTES = 1_500_000;
const MAX_PHOTOS = 500;
const MAX_TOTAL_BYTES = 250 * 1024 * 1024;
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

export default {
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
      if (path === '/api/photos' && request.method === 'GET') {
        const result = await env.DB.prepare("SELECT id, caption, uploader_name AS name FROM photos WHERE status = 'approved' ORDER BY created_at DESC LIMIT 60").all();
        return json({ photos: result.results }, 200, headers);
      }
      if (path === '/api/photos' && request.method === 'POST') {
        const form = await request.formData();
        const file = form.get('photo');
        if (!(file instanceof File) || !PHOTO_TYPES[file.type] || file.size < 100 || file.size > MAX_BYTES) {
          return json({ error: 'The photo could not be compressed enough. Please try a smaller image.' }, 400, headers);
        }
        const signature = new Uint8Array(await file.slice(0,16).arrayBuffer());
        if (!validImage(file.type, signature)) return json({ error: 'That file does not appear to be a valid photo.' }, 400, headers);
        const usage = await env.DB.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(bytes),0) AS bytes FROM photos WHERE status IN ('pending','approved')").first();
        if (usage.count >= MAX_PHOTOS || usage.bytes + file.size > MAX_TOTAL_BYTES) {
          return json({ error: 'The event photo space is full. Please contact the organiser.' }, 507, headers);
        }
        const id = crypto.randomUUID();
        const name = String(form.get('name') || '').trim().slice(0,60);
        const caption = String(form.get('caption') || '').trim().slice(0,140);
        const photoBytes = new Uint8Array(await file.arrayBuffer());
        await env.DB.prepare('INSERT INTO photos (id, original_name, mime_type, bytes, caption, uploader_name, image_data) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(id,file.name.slice(0,180),file.type,file.size,caption,name,photoBytes).run();
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
        const photo = await env.DB.prepare('SELECT image_data, mime_type, status FROM photos WHERE id = ?').bind(id).first();
        if (!photo || (!pendingMatch && photo.status !== 'approved')) return new Response('Not found', { status: 404, headers });
        if (!photo.image_data) return new Response('Not found', { status: 404, headers });
        return new Response(new Uint8Array(photo.image_data), { headers: {
          ...headers, 'Content-Type': photo.mime_type, 'Content-Disposition': 'inline',
          'X-Content-Type-Options': 'nosniff', 'Cache-Control': pendingMatch ? 'private, no-store' : 'public, max-age=300'
        } });
      }
      if (path === '/api/admin/submissions' && request.method === 'GET') {
        const [photos, feedback] = await Promise.all([
          env.DB.prepare("SELECT id, caption, uploader_name AS name, created_at AS createdAt FROM photos WHERE status='pending' ORDER BY created_at DESC LIMIT 100").all(),
          env.DB.prepare('SELECT * FROM feedback ORDER BY created_at DESC LIMIT 100').all()
        ]);
        return json({ pending: photos.results, feedback: feedback.results.map(row=>({ ...row, createdAt: row.created_at })) }, 200, headers);
      }
      const reviewMatch = path.match(/^\/api\/admin\/photos\/([a-f0-9-]{36})$/);
      if (reviewMatch && request.method === 'POST') {
        const input = await request.json();
        if (!['approve','reject'].includes(input.action)) return json({ error:'Invalid action' }, 400, headers);
        const status = input.action === 'approve' ? 'approved' : 'rejected';
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
