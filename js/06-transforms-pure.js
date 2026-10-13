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
