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
