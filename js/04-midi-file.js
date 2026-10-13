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
  const noteTrack = (events, ch, program) => {
    const list = [];
    for (const x of flattenNotes(events)) {
      list.push({ t: x.s, on: 1, m: x.m, v: x.v });
      list.push({ t: x.s + x.l, on: 0, m: x.m });
    }
    list.sort((a, b) => a.t * 2 + a.on - (b.t * 2 + b.on) || a.m - b.m);
    const t = [0, 0xc0 | ch, program];
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
    const t = noteTrack(o.staves[0], 0, o.programs[0]);
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
    const t = noteTrack(ev, k, o.programs[k]);
    parts.push(...chunk([...t.bytes, ...vlq(end - t.prev), 0xff, 0x2f, 0]));
  });
  return Uint8Array.from(parts);
}
const MUSICXML_STEPS = ["C", "D", "E", "F", "G", "A", "B"];
const MUSICXML_TYPE = { w: "whole", h: "half", q: "quarter", e: "eighth", s: "16th", t: "32nd" };
const MUSICXML_CLEF_SIGN = { gclef: "G", cclef: "C", fclef: "F" };
function buildMusicXml(o) {
  // esporta lo stesso modello letto da parseMusicXml/importToStaves: un <part> per pentagramma,
  // una <measure> per battuta (gli eventi sono già tagliati sulle barre da resplitEvents, quindi
  // nessuna figura attraversa mai una battuta). Sigle accordo e testo diventano semplici
  // annotazioni <words>/<lyric>, non <harmony> strutturata, per non dipendere dalla lingua dell'interfaccia.
  const bt = barTicksOf(o.meter),
    { n: tn, d: td } = meterParts(o.meter),
    esc = (s) => escXml(s);
  const partIds = o.staves.map((_, i) => "P" + (i + 1));
  const scoreParts = partIds
    .map((id, i) => `<score-part id="${id}"><part-name>${esc((o.instNames && o.instNames[i]) || "Strumento")}</part-name></score-part>`)
    .join("");
  const parts = o.staves.map((st, si) => {
    const clef = CLEFS[st.clef] || CLEFS.treble,
      sign = MUSICXML_CLEF_SIGN[clef.glyph] || "G";
    let measures = "",
      t = 0,
      measNum = 1,
      curBar = [];
    const flush = () => {
      measures += `<measure number="${measNum}">${curBar.join("")}</measure>`;
      curBar = [];
      measNum++;
    };
    curBar.push(
      `<attributes><divisions>${PPQ}</divisions><key><fifths>${o.key || 0}</fifths></key><time><beats>${tn}</beats><beat-type>${td}</beat-type></time><clef><sign>${sign}</sign><line>${clef.line}</line></clef></attributes>`,
    );
    if (si === 0)
      curBar.push(
        `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${o.bpm}</per-minute></metronome></direction-type><sound tempo="${o.bpm}"/></direction>`,
      );
    st.events.forEach((e, i) => {
      const tk = evTicks(e);
      if (e.r) {
        curBar.push(`<note><rest/><duration>${tk}</duration><type>${MUSICXML_TYPE[e.v]}</type>${e.dot ? "<dot/>" : ""}</note>`);
      } else {
        if (e.rep === "rs") curBar.push('<barline location="left"><bar-style>heavy-light</bar-style><repeat direction="forward"/></barline>');
        if (e.rep === "segno") curBar.push("<direction placement=\"above\"><direction-type><segno/></direction-type></direction>");
        if (e.chord) curBar.push(`<direction placement="above"><direction-type><words>${esc(e.chord)}</words></direction-type></direction>`);
        if (e.cr) curBar.push(`<direction placement="below"><direction-type><wedge type="crescendo" number="1"/></direction-type></direction>`);
        if (e.dim) curBar.push(`<direction placement="below"><direction-type><wedge type="diminuendo" number="1"/></direction-type></direction>`);
        const next = st.events[i + 1];
        e.n.forEach((n, j) => {
          const step = MUSICXML_STEPS[((n.d % 7) + 7) % 7],
            octave = Math.floor(n.d / 7),
            tieStart = !!next && !next.r && next.n.some((nn) => nn.t && nn.d === n.d && nn.a === n.a),
            tieXml = (n.t ? '<tie type="stop"/>' : "") + (tieStart ? '<tie type="start"/>' : "");
          let articulations = "",
            ornaments = "",
            ties = (n.t ? '<tied type="stop"/>' : "") + (tieStart ? '<tied type="start"/>' : "");
          if (e.st) articulations += "<staccato/>";
          if (e.ac) articulations += "<accent/>";
          if (e.trill) ornaments += "<trill-mark/>";
          if (e.mord) ornaments += "<mordent/>";
          const slurs = (e.sl ? '<slur type="start" number="1"/>' : "") + (e.se ? '<slur type="stop" number="1"/>' : ""),
            fermata = e.ferm ? "<fermata/>" : "",
            tuplet = e.tuplet
              ? e.tuplet.i === 0
                ? '<tuplet type="start" number="1"/>'
                : e.tuplet.i === e.tuplet.n - 1
                  ? '<tuplet type="stop" number="1"/>'
                  : ""
              : "",
            inner = articulations && `<articulations>${articulations}</articulations>` || "",
            innerOrn = ornaments && `<ornaments>${ornaments}</ornaments>` || "",
            notationsBody = inner + innerOrn + ties + slurs + fermata + tuplet,
            notationsXml = notationsBody ? `<notations>${notationsBody}</notations>` : "",
            lyricXml = j === 0 && e.lyr ? `<lyric><syllable>single</syllable><text>${esc(e.lyr)}</text></lyric>` : "",
            timeModXml = e.tuplet
              ? `<time-modification><actual-notes>${e.tuplet.n}</actual-notes><normal-notes>${e.tuplet.d}</normal-notes></time-modification>`
              : "";
          curBar.push(
            `<note>${j > 0 ? "<chord/>" : ""}<pitch><step>${step}</step>${n.a ? `<alter>${n.a}</alter>` : ""}<octave>${octave}</octave></pitch><duration>${tk}</duration>${tieXml}<type>${MUSICXML_TYPE[e.v]}</type>${e.dot ? "<dot/>" : ""}${timeModXml}${notationsXml}${lyricXml}</note>`,
          );
        });
        if (e.crEnd) curBar.push('<direction><direction-type><wedge type="stop" number="1"/></direction-type></direction>');
        if (e.dimEnd) curBar.push('<direction><direction-type><wedge type="stop" number="1"/></direction-type></direction>');
        if (e.rep === "re") curBar.push('<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>');
        if (e.rep === "dc") curBar.push('<direction><direction-type><words>D.C. al Fine</words></direction-type><sound dacapo="yes"/></direction>');
        if (e.rep === "ds") curBar.push('<direction><direction-type><words>D.S. al Fine</words></direction-type><sound dalsegno="segno"/></direction>');
        if (e.rep === "fine") curBar.push('<direction><direction-type><words>Fine</words></direction-type><sound fine="yes"/></direction>');
      }
      t += tk;
      if (t % bt === 0) flush();
    });
    if (curBar.length) flush();
    return `<part id="${partIds[si]}">${measures}</part>`;
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n' +
    `<score-partwise version="3.1"><work><work-title>${esc(o.title || "Brano")}</work-title></work><part-list>${scoreParts}</part-list>${parts.join("")}</score-partwise>`
  );
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
const MUSICXML_STEP_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function parseMusicXml(text) {
  // legge un file MusicXML non compresso (<score-partwise>): produce lo stesso formato di parseMidi,
  // così può passare per importToStaves. Non gestisce .mxl compresso, né più di due parti/voci.
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("ERR_NOT_MIDI_OR_PROJECT");
  const scoreEl = doc.querySelector("score-partwise");
  if (!scoreEl) throw new Error("ERR_NOT_MIDI_OR_PROJECT");
  const partIds = [...doc.querySelectorAll("part-list score-part")].map((p) =>
    p.getAttribute("id"),
  );
  const partEls = partIds
    .map((id) => doc.querySelector(`part[id="${CSS.escape(id)}"]`))
    .filter(Boolean)
    .slice(0, 2);
  const notes = [];
  let div = 1,
    ts = null,
    key = null,
    tempo = null;
  partEls.forEach((partEl, tr) => {
    let t = 0,
      lastStart = 0;
    for (const meas of partEl.querySelectorAll("measure")) {
      for (const el of meas.children) {
        const tag = el.tagName;
        if (tag === "attributes") {
          const d = el.querySelector("divisions");
          if (d) div = +d.textContent || div;
          const fifths = el.querySelector("key fifths");
          if (fifths && key == null)
            key = Math.max(-7, Math.min(7, Math.round(+fifths.textContent)));
          const beats = el.querySelector("time beats"),
            beatType = el.querySelector("time beat-type");
          if (beats && beatType && !ts) ts = [+beats.textContent, +beatType.textContent];
        } else if (tag === "sound") {
          const bpm = el.getAttribute("tempo");
          if (bpm && !tempo) tempo = 60000000 / +bpm;
        } else if (tag === "direction") {
          const mm = el.querySelector("sound[tempo]");
          if (mm && !tempo) tempo = 60000000 / +mm.getAttribute("tempo");
        } else if (tag === "backup") {
          const d = el.querySelector("duration");
          t -= d ? +d.textContent || 0 : 0;
        } else if (tag === "forward") {
          const d = el.querySelector("duration");
          t += d ? +d.textContent || 0 : 0;
        } else if (tag === "note") {
          const isChord = !!el.querySelector("chord"),
            isRest = !!el.querySelector("rest"),
            durEl = el.querySelector("duration"),
            dur = durEl ? +durEl.textContent || 0 : 0;
          const pitch = el.querySelector("pitch");
          if (isRest || !pitch) {
            if (!isChord) t += dur;
            continue;
          }
          const step = pitch.querySelector("step").textContent,
            alterEl = pitch.querySelector("alter"),
            alter = alterEl ? Math.max(-1, Math.min(1, Math.round(+alterEl.textContent))) : 0,
            oct = +pitch.querySelector("octave").textContent;
          const m = (oct + 1) * 12 + MUSICXML_STEP_SEMI[step] + alter;
          const start = isChord ? lastStart : t;
          notes.push({ s: start, e: start + Math.max(1, dur), m, tr });
          if (!isChord) {
            lastStart = t;
            t += dur;
          }
        }
      }
    }
  });
  if (!notes.length) throw new Error("ERR_MIDI_NO_NOTES");
  return { notes, div, ts, tempo, key, prog: 0 };
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
