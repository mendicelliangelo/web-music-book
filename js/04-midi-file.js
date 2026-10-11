"use strict";
/* ---------- 3. File MIDI ---------- */
/* Gli errori usano codici (ERR_...) invece di testo: il messaggio tradotto si decide in 16-files-io.js. */
const vlq = (n) => {
  const b = [n & 127];
  while ((n >>= 7)) b.unshift((n & 127) | 128);
  return b;
};
function buildMidi(o) {
  // una sola traccia se c'è un pentagramma, altrimenti formato 1 con una traccia per mano
  const { n, d } = meterParts(o.meter),
    bytes = (s) =>
      Array.from(
        new TextEncoder().encode(s.replace(/[^\x20-\x7e]/g, "?").slice(0, 60)),
      );
  const cc = d === 8 ? (n > 3 && n % 3 === 0 ? 36 : 12) : d === 2 ? 48 : 24,
    mpq = Math.round(60000000 / o.bpm),
    nm = bytes(o.title || "Brano");
  const conductor = [
    0,
    0xff,
    0x03,
    nm.length,
    ...nm,
    0,
    0xff,
    0x58,
    4,
    n,
    Math.log2(d),
    cc,
    8,
    0,
    0xff,
    0x59,
    2,
    (o.key || 0) & 255,
    0,
    0,
    0xff,
    0x51,
    3,
    (mpq >> 16) & 255,
    (mpq >> 8) & 255,
    mpq & 255,
  ];
  const end = Math.max(...o.staves.map((s) => totalTicks(s)));
  const noteTrack = (events, ch) => {
    const list = [];
    for (const x of flattenNotes(events)) {
      list.push({ t: x.s, on: 1, m: x.m, v: x.v });
      list.push({ t: x.s + x.l, on: 0, m: x.m });
    }
    list.sort((a, b) => a.t * 2 + a.on - (b.t * 2 + b.on) || a.m - b.m);
    const t = [0, 0xc0 | ch, o.program];
    let prev = 0;
    for (const x of list) {
      t.push(
        ...vlq(x.t - prev),
        (x.on ? 0x90 : 0x80) | ch,
        x.m,
        x.on ? x.v || 90 : 0,
      );
      prev = x.t;
    }
    return { bytes: t, prev };
  };
  const chunk = (b) => {
    const L = b.length;
    return [
      0x4d,
      0x54,
      0x72,
      0x6b,
      (L >>> 24) & 255,
      (L >>> 16) & 255,
      (L >>> 8) & 255,
      L & 255,
      ...b,
    ];
  };
  const head = (fmt, nt) => [
    0x4d,
    0x54,
    0x68,
    0x64,
    0,
    0,
    0,
    6,
    0,
    fmt,
    0,
    nt,
    PPQ >> 8,
    PPQ & 255,
  ];
  if (o.staves.length === 1) {
    const t = noteTrack(o.staves[0], 0);
    return Uint8Array.from([
      ...head(0, 1),
      ...chunk([...conductor, ...t.bytes, ...vlq(end - t.prev), 0xff, 0x2f, 0]),
    ]);
  }
  const parts = [
    ...head(1, 1 + o.staves.length),
    ...chunk([...conductor, 0, 0xff, 0x2f, 0]),
  ];
  o.staves.forEach((ev, k) => {
    const t = noteTrack(ev, k);
    parts.push(...chunk([...t.bytes, ...vlq(end - t.prev), 0xff, 0x2f, 0]));
  });
  return Uint8Array.from(parts);
}
function parseMidi(buf) {
  const u = new Uint8Array(buf);
  let p = 0;
  const r32 = () => {
    const v =
      ((u[p] << 24) | (u[p + 1] << 16) | (u[p + 2] << 8) | u[p + 3]) >>> 0;
    p += 4;
    return v;
  };
  const r16 = () => {
    const v = (u[p] << 8) | u[p + 1];
    p += 2;
    return v;
  };
  if (r32() !== 0x4d546864) throw new Error("ERR_NOT_MIDI");
  const hl = r32();
  r16();
  const ntr = r16(),
    div = r16();
  p = 8 + hl;
  if (div & 0x8000 || !div) throw new Error("ERR_MIDI_TIMING");
  const notes = [];
  let tempo = null,
    ts = null,
    prog = null,
    key = null;
  for (let tr = 0; tr < ntr && p + 8 <= u.length; tr++) {
    const id = r32(),
      len = r32(),
      end = Math.min(p + len, u.length);
    if (id !== 0x4d54726b) {
      p = end;
      continue;
    }
    let tick = 0,
      run = 0;
    const open = new Map();
    while (p < end) {
      let dt = 0,
        b;
      do {
        b = u[p++];
        dt = dt * 128 + (b & 127);
      } while (b & 128 && p < end);
      tick += dt;
      let st = u[p];
      if (st >= 128) {
        p++;
        run = st < 0xf0 ? st : 0;
      } else st = run;
      if (st === 0xff) {
        const type = u[p++];
        let l = 0;
        do {
          b = u[p++];
          l = l * 128 + (b & 127);
        } while (b & 128 && p < end);
        if (type === 0x51 && l === 3 && tempo == null)
          tempo = (u[p] << 16) | (u[p + 1] << 8) | u[p + 2];
        if (type === 0x58 && l >= 2 && ts == null) ts = [u[p], 1 << u[p + 1]];
        if (type === 0x59 && l >= 2 && key == null) key = (u[p] << 24) >> 24;
        p += l;
        if (type === 0x2f) break;
      } else if (st === 0xf0 || st === 0xf7) {
        let l = 0;
        do {
          b = u[p++];
          l = l * 128 + (b & 127);
        } while (b & 128 && p < end);
        p += l;
      } else if (st >= 128) {
        const hi = st & 0xf0,
          ch = st & 15,
          a = u[p++],
          v = hi === 0xc0 || hi === 0xd0 ? 0 : u[p++],
          k = ch * 128 + a;
        if (hi === 0x90 && v > 0) {
          if (!open.has(k)) open.set(k, tick);
        } else if (hi === 0x80 || (hi === 0x90 && v === 0)) {
          if (open.has(k)) {
            if (ch !== 9) notes.push({ s: open.get(k), e: tick, m: a, tr });
            open.delete(k);
          }
        } else if (hi === 0xc0 && prog == null && ch !== 9) prog = a;
      } else break;
    }
    p = end;
  }
  return { notes, tempo, ts, prog, key, div };
}
/* Da note (inizio, fine, altezza in tick già quantizzati) a figure di un pentagramma: le note che partono insieme diventano un accordo. */
function staffFromNotes(ns, o) {
  const sorted = ns.slice().sort((a, b) => a.s - b.s || a.m - b.m),
    groups = [];
  for (const n of sorted) {
    const g = groups[groups.length - 1];
    if (g && g.s === n.s) {
      if (!g.ms.includes(n.m)) {
        g.ms.push(n.m);
        g.e = Math.max(g.e, n.e);
      }
    } else groups.push({ s: n.s, e: n.e, ms: [n.m] });
  }
  const ev = [];
  let cur = 0;
  groups.forEach((g, i) => {
    const s = Math.max(g.s, cur),
      nextS = i + 1 < groups.length ? groups[i + 1].s : Infinity;
    let e = Math.min(g.e, nextS);
    if (e - s < 60) e = s + 60;
    if (s > cur) {
      const r = makeEvents(o.start + cur, s - cur, null, o.bt);
      ev.push(...r);
    }
    const made = makeEvents(
      o.start + s,
      e - s,
      g.ms.sort((a, b) => a - b).map((m) => spellMidi(m, o.key)),
      o.bt,
    );
    ev.push(...made);
    cur = s + made.reduce((a, x) => a + evTicks(x), 0);
  });
  return ev;
}
function importToStaves(res, bt, key) {
  // un MIDI diventa uno o due pentagrammi
  const sc = PPQ / res.div,
    g = 30,
    q = (x) => Math.round((x * sc) / g) * g;
  const all = res.notes.map((n) => {
    const s = q(n.s);
    return { s, e: Math.max(q(n.e), s + 60), m: n.m, tr: n.tr };
  });
  const avg = (l) => l.reduce((a, n) => a + n.m, 0) / (l.length || 1);
  const trs = [...new Set(all.map((n) => n.tr))];
  let parts;
  if (trs.length >= 2) {
    const byTr = trs
      .map((t) => all.filter((n) => n.tr === t))
      .sort((a, b) => avg(b) - avg(a));
    parts = [byTr[0].slice(), byTr[1].slice()];
    for (const extra of byTr.slice(2)) {
      const near =
        Math.abs(avg(extra) - avg(parts[0])) <
        Math.abs(avg(extra) - avg(parts[1]))
          ? 0
          : 1;
      parts[near].push(...extra);
    }
  } else {
    const lo = all.filter((n) => n.m < 60),
      hi = all.filter((n) => n.m >= 60);
    parts =
      Math.min(lo.length, hi.length) / all.length >= 0.2 ? [hi, lo] : [all];
  }
  const clefs =
    parts.length === 2
      ? ["treble", "bass"]
      : [avg(all) < 57 ? "bass" : "treble"];
  return {
    staves: parts.map((p, i) => ({
      clef: clefs[i],
      events: staffFromNotes(p, { bt, key, start: 0 }).slice(0, 2000),
    })),
    n: parts.length,
  };
}
