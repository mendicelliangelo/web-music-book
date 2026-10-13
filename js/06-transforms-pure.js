"use strict";
/* ---------- 5. Trasformazioni: trasporto e scala delle durate ---------- */
function transposeEvents(events, semi) {
  // nuovo elenco, oppure null se una nota esce dall'estensione (MIDI 24–115)
  const out = [];
  for (const e of events) {
    if (e.r) {
      out.push({ ...e });
      continue;
    }
    const ns = [];
    for (const n of e.n) {
      const m = noteMidi(n) + semi;
      if (m < 24 || m > 115) return null;
      const sp =
        semi % 12 === 0
          ? { d: n.d + (semi / 12) * 7, a: n.a }
          : spellMidi(m, 0, semi < 0 ? "flat" : "sharp");
      ns.push(n.t ? { d: sp.d, a: sp.a, t: 1 } : { d: sp.d, a: sp.a });
    }
    out.push({ ...e, n: sortNotes(ns) });
  }
  return out;
}
function transposeEventsInKey(events, semi, newKey) {
  // come transposeEvents, ma compita le note secondo l'armatura d'arrivo (newKey) invece che a diesis/bemolli fissi
  const out = [];
  for (const e of events) {
    if (e.r) {
      out.push({ ...e });
      continue;
    }
    const ns = [];
    for (const n of e.n) {
      const m = noteMidi(n) + semi;
      if (m < 24 || m > 115) return null;
      const sp = spellMidi(m, newKey);
      ns.push(n.t ? { d: sp.d, a: sp.a, t: 1 } : { d: sp.d, a: sp.a });
    }
    out.push({ ...e, n: sortNotes(ns) });
  }
  return out;
}
function replaceNotes(events, fromL, fromA, toL, toA) {
  // sostituisce ogni nota lettera+alterazione (fromL/fromA) con toL/toA, mantenendo l'ottava; conta le note toccate
  let count = 0;
  const out = events.map((e) => {
    if (e.r) return e;
    let eChanged = false;
    const ns = e.n.map((n) => {
      if (n.d % 7 === fromL && n.a === fromA) {
        eChanged = true;
        count++;
        const oct = Math.floor(n.d / 7);
        return n.t ? { d: oct * 7 + toL, a: toA, t: 1 } : { d: oct * 7 + toL, a: toA };
      }
      return n;
    });
    return eChanged ? { ...e, n: sortNotes(ns) } : e;
  });
  return { events: out, count };
}
const MAJOR_DEGREE_OFFSETS = [0, 2, 4, 5, 7, 9, 11],
  MAJOR_DEGREE_QUALITY = ["maj", "m", "m", "maj", "maj", "m", "dim"];
function chordTones(rootPC, quality) {
  const third = quality === "maj" ? 4 : 3,
    fifth = quality === "dim" ? 6 : 7;
  return [rootPC, (rootPC + third) % 12, (rootPC + fifth) % 12];
}
function bestDiatonicChord(pcCounts, key) {
  // il miglior accordo tra le sette triadi diatoniche dell'armatura: punteggio pesato su quante volte
  // ogni classe di altezza compare (non solo se compare), con un bonus alla radice
  const tonic = tonicPC(key);
  let best = null,
    bestScore = -1;
  for (let deg = 0; deg < 7; deg++) {
    const rootPC = (tonic + MAJOR_DEGREE_OFFSETS[deg]) % 12,
      quality = MAJOR_DEGREE_QUALITY[deg],
      tones = chordTones(rootPC, quality);
    let score = 0;
    tones.forEach((pc, j) => {
      score += (pcCounts.get(pc) || 0) * (j === 0 ? 1.5 : 1);
    });
    if (score > bestScore) {
      bestScore = score;
      best = { deg, rootPC, quality };
    }
  }
  if (!best || bestScore === 0) return null;
  const seventhPC = (best.rootPC + (best.quality === "dim" ? 9 : 10)) % 12;
  return { ...best, has7: (pcCounts.get(seventhPC) || 0) > 0 };
}
function chordSymbolFor(rootPC, quality, has7, key) {
  const sp = spellMidi(60 + rootPC, key),
    L = LETTERS[curLang] || LETTERS.it;
  let s = L[((sp.d % 7) + 7) % 7] + accSym(sp.a);
  if (quality === "m") s += "m";
  else if (quality === "dim") s += "dim";
  if (has7) s += "7";
  return s;
}
function invertPitches(events, pivotMidi, key) {
  // a specchio: inverte gli intervalli attorno a un perno (di norma la prima nota)
  return events.map((e) => {
    if (e.r) return { ...e };
    const ns = e.n.map((n) => {
      const m = 2 * pivotMidi - noteMidi(n);
      if (m < 24 || m > 115) return n;
      const sp = spellMidi(m, key);
      return n.t ? { d: sp.d, a: sp.a, t: 1 } : { d: sp.d, a: sp.a };
    });
    return { ...e, n: sortNotes(ns) };
  });
}
function toParallelMinor(events, key) {
  // modo minore parallelo: abbassa di un semitono le note sul III, VI e VII grado della tonalità maggiore corrente
  const tonic = tonicPC(key);
  return events.map((e) => {
    if (e.r) return { ...e };
    const ns = e.n.map((n) => {
      const pc = (((noteMidi(n) - tonic) % 12) + 12) % 12,
        degreeIdx = MAJOR_DEGREE_OFFSETS.indexOf(pc);
      if (degreeIdx === 2 || degreeIdx === 5 || degreeIdx === 6) {
        const sp = spellMidi(noteMidi(n) - 1, key, "flat");
        return n.t ? { d: sp.d, a: sp.a, t: 1 } : { d: sp.d, a: sp.a };
      }
      return n;
    });
    return { ...e, n: ns };
  });
}
function retrogradeEvents(events) {
  // al rovescio: inverte l'ordine delle figure; le legature di valore non sono più coerenti e vengono tolte
  return events
    .slice()
    .reverse()
    .map((e) => {
      if (e.r) return { ...e };
      const ns = e.n.map((n) => {
        const { t, ...rest } = n;
        return rest;
      });
      return { ...e, n: ns };
    });
}
function fretFor(midi) {
  // tasto più basso, su qualunque corda, che raggiunge l'altezza data (entro il 15° tasto)
  let best = null;
  GUITAR_TUNING.forEach((openMidi) => {
    const fret = midi - openMidi;
    if (fret >= 0 && fret <= 15 && (!best || fret < best)) best = fret;
  });
  return best;
}
function tabForEvent(e) {
  // tastatura semplificata: assegna ad ogni nota dell'evento una corda diversa (vuoto a disposizione),
  // scegliendo sempre il tasto più basso libero; null se una nota non è raggiungibile su nessuna corda libera
  if (e.r || !e.n.length) return null;
  const notes = e.n.map((n) => noteMidi(n)).sort((a, b) => a - b);
  const used = new Set(),
    out = [];
  for (const m of notes) {
    let best = null;
    GUITAR_TUNING.forEach((openMidi, str) => {
      if (used.has(str)) return;
      const fret = m - openMidi;
      if (fret >= 0 && fret <= 15 && (!best || fret < best.fret)) best = { str, fret };
    });
    if (!best) return null;
    used.add(best.str);
    out.push(best);
  }
  return out.sort((a, b) => a.str - b.str);
}
const CHORD_LETTER_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
function parseChordSymbol(str) {
  // interpreta una sigla come "Sol7", "Am", "F#dim", "Bbmaj7": riconosce sia le lettere latine
  // (C D E F G A B) sia il solfeggio di it/fr/es/pl e le lettere tedesche (H=Si), indipendentemente
  // dalla lingua dell'interfaccia in cui è stata scritta. Ritorna {rootPC,minor} o null se non capita.
  if (!str) return null;
  const s = str.trim();
  const candidates = [];
  CHORD_LETTER_NAMES.forEach((L, i) => candidates.push({ name: L, i }));
  LETTERS.it.forEach((L, i) => candidates.push({ name: L, i }));
  LETTERS.fr.forEach((L, i) => candidates.push({ name: L, i }));
  LETTERS.de.forEach((L, i) => candidates.push({ name: L, i }));
  candidates.sort((a, b) => b.name.length - a.name.length);
  for (const c of candidates) {
    if (s.toLowerCase().startsWith(c.name.toLowerCase())) {
      let rest = s.slice(c.name.length),
        alt = 0;
      if (rest[0] === "#" || rest[0] === "♯") {
        alt = 1;
        rest = rest.slice(1);
      } else if (rest[0] === "b" || rest[0] === "♭") {
        alt = -1;
        rest = rest.slice(1);
      }
      const rootPC = ((LETTER_SEMI[c.i] + alt) % 12 + 12) % 12;
      const minor = /^m(?!aj)/i.test(rest);
      return { rootPC, minor };
    }
  }
  return null;
}
const CHORD_SHAPES = {
  // forme aperte note: tasto per corda dalla 6ª (Mi grave) alla 1ª (Mi acuto); -1 = corda non suonata
  maj: { 0: [-1, 3, 2, 0, 1, 0], 2: [-1, -1, 0, 2, 3, 2], 4: [0, 2, 2, 1, 0, 0], 5: [1, 3, 3, 2, 1, 1], 7: [3, 2, 0, 0, 0, 3], 9: [-1, 0, 2, 2, 2, 0] },
  min: { 2: [-1, -1, 0, 2, 3, 1], 4: [0, 2, 2, 0, 0, 0], 5: [1, 3, 3, 1, 1, 1], 9: [-1, 0, 2, 2, 1, 0] },
};
function chordDiagram(rootPC, minor) {
  // diagramma per chitarra: forma aperta nota se c'è, altrimenti barré mobile (forma di Mi/Mi minore)
  const tab = CHORD_SHAPES[minor ? "min" : "maj"][rootPC];
  if (tab) return { frets: tab, barreFret: null };
  const fret = ((rootPC - 4) % 12 + 12) % 12,
    shape = minor ? [0, 2, 2, 0, 0, 0] : [0, 2, 2, 1, 0, 0];
  return { frets: shape.map((f) => f + fret), barreFret: fret };
}
function accompanimentChordTones(rootPC, minor) {
  const root = 48 + rootPC, // ottava 3, registro basso-medio ragionevole per la mano sinistra
    third = root + (minor ? 3 : 4),
    fifth = root + 7;
  return [root, third, fifth];
}
function buildAccompaniment(melodyEvents, bt, key, pattern) {
  // legge le sigle accordo sulla melodia (prodotte da "Testo e accordi" o da "Analizza accordi") e scrive
  // un accompagnamento della stessa durata totale: accordi in blocco, basso+accordo, o arpeggio.
  // Accordi non riconosciuti (parseChordSymbol fallisce) vengono semplicemente saltati: la regione
  // precedente continua fino alla prossima sigla valida.
  const regions = [];
  let t = 0;
  melodyEvents.forEach((e) => {
    if (!e.r && e.chord) {
      const parsed = parseChordSymbol(e.chord);
      if (parsed) regions.push({ start: t, parsed });
    }
    t += evTicks(e);
  });
  if (!regions.length) return null;
  const total = totalTicks(melodyEvents);
  regions.forEach((r, i) => {
    r.end = i + 1 < regions.length ? regions[i + 1].start : total;
  });
  const out = [],
    spell = (m) => spellMidi(m, key);
  if (regions[0].start > 0) out.push(...makeEvents(0, regions[0].start, null, bt));
  regions.forEach((r) => {
    const span = r.end - r.start;
    if (span <= 0) return;
    const [root, third, fifth] = accompanimentChordTones(r.parsed.rootPC, r.parsed.minor);
    if (pattern === "block") {
      out.push(...makeEvents(r.start, span, [root, third, fifth].map(spell), bt));
    } else if (pattern === "bassChord") {
      const bassLen = Math.min(480, span);
      out.push(...makeEvents(r.start, bassLen, [spell(root)], bt));
      if (span > bassLen) out.push(...makeEvents(r.start + bassLen, span - bassLen, [third, fifth].map(spell), bt));
    } else {
      const step = 240,
        notes = [root, third, fifth, third];
      let tt = r.start,
        i = 0;
      while (tt < r.end) {
        const len = Math.min(step, r.end - tt);
        out.push(...makeEvents(tt, len, [spell(notes[i % 4])], bt));
        tt += len;
        i++;
      }
    }
  });
  return out;
}
function generatePattern(kind, key, tonicD) {
  // scala (8 note, un'ottava), arpeggio (4 note: radice-terza-quinta-ottava), basso albertino (radice-quinta-terza-quinta ripetuto)
  const ka = (d) => keyAlter(key, ((d % 7) + 7) % 7),
    out = [];
  const push = (d) => out.push({ d, a: ka(d) });
  if (kind === "scale") {
    for (let i = 0; i <= 7; i++) push(tonicD + i);
  } else if (kind === "arpeggio") {
    [0, 2, 4, 7].forEach((off) => push(tonicD + off));
  } else if (kind === "alberti") {
    const cyc = [0, 4, 2, 4],
      beats = Math.max(1, Math.round(btNow() / toolTicks()));
    for (let i = 0; i < beats; i++) push(tonicD + cyc[i % 4]);
  }
  return out;
}
function scaleDurations(events, dir) {
  // dir +1 raddoppia (minima→semibreve), -1 dimezza; null se una figura non può cambiare
  const ids = DURS.map((d) => d.id),
    out = [];
  for (const e of events) {
    const k = ids.indexOf(e.v) - dir;
    if (k < 0 || k >= ids.length) return null;
    out.push({ ...e, v: ids[k] });
  }
  return out;
}
