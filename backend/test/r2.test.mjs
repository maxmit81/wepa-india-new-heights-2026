import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../src/index.js';
function setup(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../migrations/0001_init.sql',import.meta.url),'utf8'));sql.exec(readFileSync(new URL('../migrations/0002_r2_photos.sql',import.meta.url),'utf8'));
 class Statement{constructor(q,p=[]){this.q=q;this.p=p}bind(...p){return new Statement(this.q,p)}async first(){return sql.prepare(this.q).get(...this.p)||null}async all(){return {results:sql.prepare(this.q).all(...this.p),meta:{changes:0}}}async run(){return {meta:{changes:Number(sql.prepare(this.q).run(...this.p).changes)}}}}
 const objects=new Map();let failPut=false,failDelete=false;
 const env={ADMIN_TOKEN:'test-key',ALLOWED_ORIGIN:'https://example.test',MIGRATION_ENABLED:'true',DB:{prepare:q=>new Statement(q),batch:async list=>{sql.exec('BEGIN');try{const results=[];for(const s of list)results.push(await (/^SELECT/i.test(s.q)?s.all():s.run()));sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}}},PHOTOS:{head:async k=>objects.has(k)?{}:null,put:async(k,v)=>{if(failPut)throw Error('injected put failure');objects.set(k,new Uint8Array(await new Response(v).arrayBuffer()));return{}},get:async k=>objects.has(k)?{body:new Blob([objects.get(k)]).stream(),arrayBuffer:async()=>objects.get(k).slice().buffer}:null,delete:async keys=>{if(failDelete)throw Error('injected delete failure');for(const k of Array.isArray(keys)?keys:[keys])objects.delete(k)}}};
 const bytes=new Uint8Array(120);bytes.set([255,216,255]);
 const call=(path,body,auth=true)=>worker.fetch(new Request('https://worker.test'+path,{method:body?'POST':'GET',headers:{Origin:env.ALLOWED_ORIGIN,...(auth?{Authorization:'Bearer test-key'}:{}),...(body && !(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined}),env);
 const upload=()=>{const f=new FormData();f.set('photo',new File([bytes],'test.jpg',{type:'image/jpeg'}));return call('/api/photos',f,false)};
 const seed=(id,status='pending',size=120,blob=null)=>sql.prepare('INSERT INTO photos(id,original_name,mime_type,bytes,status,image_data) VALUES(?,?,?,?,?,?)').run(id,'seed.jpg','image/jpeg',size,status,blob);
 return {sql,objects,env,call,upload,seed,bytes,failPut:v=>failPut=v,failDelete:v=>failDelete=v};
}
test('R2 upload, moderation privacy, bulk approval/deletion, authorization',async()=>{
 const t=setup();const u=await t.upload();assert.equal(u.status,201);const {id}=await u.json();assert(t.objects.has('photos/'+id));assert.equal((await t.call('/api/photos/'+id+'/image',null,false)).status,404);
 assert.equal((await t.call('/api/admin/photos/bulk',{action:'delete',ids:[id]},false)).status,401);
 assert.equal((await t.call('/api/admin/photos/bulk',{action:'approve',ids:[id,id]})).status,200);
 const image=await t.call('/api/photos/'+id+'/image',null,false);assert.equal(image.status,200);assert.deepEqual(new Uint8Array(await image.arrayBuffer()),t.bytes);
 assert.equal((await (await t.call('/api/admin/photos/bulk',{action:'delete',ids:[id]})).json()).changed,1);assert.equal(t.objects.size,0);assert.equal((await t.call('/api/photos/'+id+'/image')).status,404);
});
test('2 GB reservation is atomic for concurrent uploads and no 500-photo cap',async()=>{
 const t=setup();t.seed(crypto.randomUUID(),'approved',2_000_000_000-120);
 const results=await Promise.all([t.upload(),t.upload()]);assert.deepEqual(results.map(r=>r.status).sort(),[201,507]);assert.equal(t.sql.prepare("SELECT SUM(bytes) AS n FROM photos").get().n,2_000_000_000);
 const s=setup();for(let i=0;i<501;i++)s.seed(crypto.randomUUID());assert.equal((await s.upload()).status,201);
 const page=await (await s.call('/api/admin/submissions')).json();assert.equal(page.pending.length,500);assert.equal(page.nextOffset,500);assert.equal((await (await s.call('/api/admin/submissions?offset=500')).json()).pending.length,2);
});
test('legacy migration verifies bytes and remains accessible; rejection removes storage',async()=>{
 const t=setup();const id=crypto.randomUUID();t.seed(id,'approved',120,t.bytes);assert.equal((await t.call('/api/photos/'+id+'/image')).status,200);
 assert.equal((await (await t.call('/api/admin/storage/migrate',{})).json()).migrated,1);assert.equal(t.sql.prepare('SELECT image_data FROM photos WHERE id=?').get(id).image_data,null);assert.deepEqual(new Uint8Array(await (await t.call('/api/photos/'+id+'/image')).arrayBuffer()),t.bytes);
 const p=await (await t.upload()).json();assert.equal((await t.call('/api/admin/photos/'+p.id,{action:'reject'})).status,200);assert(!t.objects.has('photos/'+p.id));
});
test('failed writes release space; failed deletion hides images and is retried',async()=>{
 const t=setup();t.failPut(true);assert.equal((await t.upload()).status,503);assert.equal(t.sql.prepare('SELECT COUNT(*) AS n FROM photos').get().n,0);t.failPut(false);
 const {id}=await (await t.upload()).json();await t.call('/api/admin/photos/'+id,{action:'approve'});t.failDelete(true);assert.equal((await t.call('/api/admin/photos/'+id,{action:'delete'})).status,503);assert.equal((await t.call('/api/photos/'+id+'/image')).status,404);assert.equal(t.sql.prepare('SELECT bytes FROM photos WHERE id=?').get(id).bytes,120);
 t.failDelete(false);await worker.scheduled({},t.env);assert.equal(t.objects.size,0);assert.equal(t.sql.prepare('SELECT COUNT(*) AS n FROM photos').get().n,0);
});
test('public gallery pagination exposes older approved photos',async()=>{
 const t=setup();for(let i=0;i<61;i++)t.seed(crypto.randomUUID(),'approved');const p=await (await t.call('/api/photos')).json();assert.equal(p.photos.length,60);assert.equal(p.nextOffset,60);const q=await (await t.call('/api/photos?offset=60')).json();assert.equal(q.photos.length,1);assert.equal(q.nextOffset,null);
});
