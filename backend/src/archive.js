const encoder = new TextEncoder();
const u16 = n => [n & 255, (n >>> 8) & 255];
const u32 = n => [...u16(n), ...u16(n >>> 16)];
const bytes = parts => new Uint8Array(parts.flat());
const stamp = new Date();
const dosTime = (stamp.getHours() << 11) | (stamp.getMinutes() << 5) | (stamp.getSeconds() >> 1);
const dosDate = ((stamp.getFullYear() - 1980) << 9) | ((stamp.getMonth() + 1) << 5) | stamp.getDate();

let table;
function crc32(data, previous = 0) {
  if (!table) table = Uint32Array.from({length: 256}, (_, i) => {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  let crc = (previous ^ 0xffffffff) >>> 0;
  for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function csvCell(value) {
  return '"' + String(value ?? '').replace(/"/g, '""') + '"';
}

// Store entries without recompression: uploaded photos are already compressed.
// Data descriptors allow a constant-memory ZIP stream while the Worker reads R2.
export function photoArchive(rows, readPhoto) {
  async function* generate() {
    const directory = [];
    const manifest = ['file,status,uploader,caption,uploaded_at'];
    let offset = 0;
    async function* entry(name, source) {
      const filename = encoder.encode(name);
      if (filename.length > 65535) throw new Error('Archive filename too long');
      const localOffset = offset;
      const header = bytes([u32(0x04034b50), u16(20), u16(0x808), u16(0), u16(dosTime), u16(dosDate),
        u32(0), u32(0), u32(0), u16(filename.length), u16(0)]);
      offset += header.length + filename.length;
      yield header; yield filename;
      let size = 0, crc = 0;
      for await (const chunk of source) {
        const data = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
        size += data.length;
        if (size > 0xffffffff) throw new Error('ZIP entry too large');
        crc = crc32(data, crc);
        offset += data.length;
        yield data;
      }
      const descriptor = bytes([u32(0x08074b50), u32(crc), u32(size), u32(size)]);
      offset += descriptor.length;
      yield descriptor;
      directory.push({filename, crc, size, localOffset});
    }
    for await (const photo of rows) {
      if (directory.length >= 65534) throw new Error('Too many photos for one ZIP');
      const extension = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[photo.mime_type];
      if (!extension) throw new Error('Unsupported photo type in archive');
      const name = photo.status + '/' + photo.id + '.' + extension;
      const object = await readPhoto(photo);
      if (!object) throw new Error('Photo missing from storage: ' + photo.id);
      yield* entry(name, object);
      manifest.push([name, photo.status, photo.uploader_name, photo.caption, photo.created_at].map(csvCell).join(','));
    }
    yield* entry('photos.csv', [encoder.encode(manifest.join('\r\n') + '\r\n')]);
    const directoryOffset = offset;
    for (const file of directory) {
      const header = bytes([u32(0x02014b50), u16(20), u16(20), u16(0x808), u16(0), u16(dosTime), u16(dosDate),
        u32(file.crc), u32(file.size), u32(file.size), u16(file.filename.length), u16(0), u16(0),
        u16(0), u16(0), u32(0), u32(file.localOffset)]);
      offset += header.length + file.filename.length;
      yield header; yield file.filename;
    }
    yield bytes([u32(0x06054b50), u16(0), u16(0), u16(directory.length), u16(directory.length),
      u32(offset - directoryOffset), u32(directoryOffset), u16(0)]);
  }
  const iterator = generate();
  return new ReadableStream({
    async pull(controller) {
      try {
        const {value, done} = await iterator.next();
        if (done) controller.close();
        else controller.enqueue(value);
      } catch (error) { controller.error(error); }
    },
    async cancel() { await iterator.return?.(); }
  });
}
