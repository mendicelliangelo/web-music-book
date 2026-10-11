"use strict";
/* ---------- 4. Archivio ZIP (un solo file, senza compressione) ---------- */
const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (b) => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function zipStore(name, data) {
  const nb = new TextEncoder().encode(name),
    crc = crc32(data),
    len = data.length;
  const lf = new DataView(new ArrayBuffer(30));
  lf.setUint32(0, 0x04034b50, true);
  lf.setUint16(4, 20, true);
  lf.setUint16(6, 0x0800, true);
  lf.setUint16(12, 0x21, true);
  lf.setUint32(14, crc, true);
  lf.setUint32(18, len, true);
  lf.setUint32(22, len, true);
  lf.setUint16(26, nb.length, true);
  const cd = new DataView(new ArrayBuffer(46));
  cd.setUint32(0, 0x02014b50, true);
  cd.setUint16(4, 20, true);
  cd.setUint16(6, 20, true);
  cd.setUint16(8, 0x0800, true);
  cd.setUint16(14, 0x21, true);
  cd.setUint32(16, crc, true);
  cd.setUint32(20, len, true);
  cd.setUint32(24, len, true);
  cd.setUint16(28, nb.length, true);
  const eo = new DataView(new ArrayBuffer(22));
  eo.setUint32(0, 0x06054b50, true);
  eo.setUint16(8, 1, true);
  eo.setUint16(10, 1, true);
  eo.setUint32(12, 46 + nb.length, true);
  eo.setUint32(16, 30 + nb.length + len, true);
  const parts = [
    new Uint8Array(lf.buffer),
    nb,
    data,
    new Uint8Array(cd.buffer),
    nb,
    new Uint8Array(eo.buffer),
  ];
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
function unzipStored(buf) {
  const dv = new DataView(buf),
    out = [];
  let o = 0;
  while (o + 30 <= buf.byteLength && dv.getUint32(o, true) === 0x04034b50) {
    const flags = dv.getUint16(o + 6, true),
      method = dv.getUint16(o + 8, true),
      cs = dv.getUint32(o + 18, true),
      nl = dv.getUint16(o + 26, true),
      xl = dv.getUint16(o + 28, true);
    if (method !== 0 || flags & 8) return null;
    out.push({
      name: new TextDecoder().decode(new Uint8Array(buf, o + 30, nl)),
      data: new Uint8Array(buf, o + 30 + nl + xl, cs),
    });
    o += 30 + nl + xl + cs;
  }
  return out;
}
