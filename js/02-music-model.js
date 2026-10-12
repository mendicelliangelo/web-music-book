"use strict";
/* ---------- 1. Modello musicale ---------- */
const PPQ = 480; // pulsazioni (tick) per semiminima
const DURS = [
  // valori di durata, dal più lungo al più breve
  { id: "w", frac: "1/1", ticks: 1920 },
  { id: "h", frac: "1/2", ticks: 960 },
  { id: "q", frac: "1/4", ticks: 480 },
  { id: "e", frac: "1/8", ticks: 240 },
  { id: "s", frac: "1/16", ticks: 120 },
  { id: "t", frac: "1/32", ticks: 60 },
];
const DUR_BY = Object.fromEntries(DURS.map((d) => [d.id, d]));
const LETTER_SEMI = [0, 2, 4, 5, 7, 9, 11]; // Do Re Mi Fa Sol La Si in semitoni sopra il Do
const SOLFEGE = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
const NOTE_COLORS = [
  "#c73b3b",
  "#c7703b",
  "#b7a22a",
  "#3f9450",
  "#2f7fc1",
  "#5a5ec7",
  "#a241a8",
]; // Do..Si, usati quando l'utente attiva i colori per nota
const STAFF_COLORS = ["#2f7fc1", "#c7703b"]; // pentagramma 1 e 2, quando l'utente attiva i colori per pentagramma
const METERS = ["2/4", "3/4", "4/4", "2/2", "3/8", "6/8", "9/8", "12/8", "5/4"];
const DYNS = ["pp", "p", "mp", "mf", "f", "ff"],
  DYN_VEL = { pp: 33, p: 49, mp: 64, mf: 80, f: 96, ff: 112 }; // dinamica → velocità MIDI (senza segno: 90)
const CLEFS = {
  // bottomD = numero diatonico della riga più bassa (Mi4 = 4*7+2 = 30); line = riga su cui sta la chiave (1 = più bassa); ks = posizione di diesis e bemolli in armatura
  treble: {
    glyph: "gclef",
    design: 2,
    line: 2,
    bottomD: 30,
    kbOct: 4,
    ks: { s: [8, 5, 9, 6, 3, 7, 4], f: [4, 7, 3, 6, 2, 5, 1] },
  },
  soprano: {
    glyph: "cclef",
    design: 3,
    line: 1,
    bottomD: 28,
    kbOct: 4,
    ks: { s: [3, 0, 4, 1, 5, 2, 6], f: [6, 2, 5, 1, 4, 0, 3] },
  },
  mezzo: {
    glyph: "cclef",
    design: 3,
    line: 2,
    bottomD: 26,
    kbOct: 4,
    ks: { s: [5, 2, 6, 3, 0, 4, 1], f: [1, 4, 0, 3, 6, 2, 5] },
  },
  alto: {
    glyph: "cclef",
    design: 3,
    line: 3,
    bottomD: 24,
    kbOct: 3,
    ks: { s: [7, 4, 8, 5, 2, 6, 3], f: [3, 6, 2, 5, 1, 4, 0] },
  },
  tenor: {
    glyph: "cclef",
    design: 3,
    line: 4,
    bottomD: 22,
    kbOct: 3,
    ks: { s: [2, 6, 3, 7, 4, 8, 5], f: [5, 8, 4, 7, 3, 6, 2] },
  },
  baritone: {
    glyph: "fclef",
    design: 4,
    line: 3,
    bottomD: 20,
    kbOct: 2,
    ks: { s: [8, 5, 9, 6, 3, 7, 4], f: [4, 7, 3, 6, 2, 5, 1] },
  },
  bass: {
    glyph: "fclef",
    design: 4,
    line: 4,
    bottomD: 18,
    kbOct: 2,
    ks: { s: [6, 3, 7, 4, 1, 5, 2], f: [2, 5, 1, 4, 0, 3, 6] },
  },
};
const INSTRUMENTS = [
  // program = numero General MIDI (0-127); il resto descrive il suono sintetizzato nel browser
  {
    id: "piano",
    program: 0,
    harm: [1, 0.55, 0.32, 0.2, 0.12, 0.07, 0.04],
    a: 0.004,
    tau: 1.7,
    pd: 30,
    sus: 0,
    r: 0.12,
    br: 7,
    dk: 1.7,
    ft: 0.9,
    lv: 1,
  },
  {
    id: "epiano",
    program: 4,
    harm: [1, 0.2, 0.5, 0.05, 0.12],
    a: 0.004,
    tau: 1.3,
    pd: 40,
    sus: 0,
    r: 0.15,
    br: 4,
    dk: 2,
    ft: 1.2,
    lv: 1.1,
  },
  {
    id: "organ",
    program: 19,
    harm: [1, 0.7, 0.55, 0.4, 0.3, 0.2, 0.12],
    a: 0.02,
    d: 0.1,
    sus: 1,
    r: 0.06,
    br: 6,
    dk: 6,
    ft: 0.1,
    lv: 0.7,
  },
  {
    id: "violin",
    program: 40,
    harm: [1, 0.7, 0.55, 0.45, 0.35, 0.28, 0.2, 0.15, 0.1],
    a: 0.07,
    d: 0.2,
    sus: 0.85,
    r: 0.12,
    br: 6,
    dk: 4,
    ft: 0.3,
    lv: 0.8,
    vib: [5.4, 0.006],
  },
  {
    id: "clarinet",
    program: 71,
    harm: [1, 0, 0.5, 0, 0.28, 0, 0.14, 0, 0.06],
    a: 0.04,
    d: 0.1,
    sus: 0.9,
    r: 0.08,
    br: 5,
    dk: 4,
    ft: 0.2,
    lv: 0.9,
    transpose: 2, // clarinetto in Si♭: scritto un tono sopra il suono reale
  },
  {
    id: "guitar",
    program: 24,
    harm: [1, 0.65, 0.4, 0.25, 0.15, 0.08, 0.04],
    a: 0.003,
    tau: 1.3,
    pd: 25,
    sus: 0,
    r: 0.1,
    br: 8,
    dk: 2.5,
    ft: 0.25,
    lv: 0.95,
  },
  {
    id: "flute",
    program: 73,
    harm: [1, 0.25, 0.1, 0.04],
    a: 0.06,
    d: 0.1,
    sus: 0.9,
    r: 0.1,
    br: 4,
    dk: 3,
    ft: 0.3,
    lv: 1.1,
    vib: [5, 0.004],
  },
];

/* armatura di chiave: sf = numero di diesis (positivo) o di bemolli (negativo); i nomi tradotti sono in 00-i18n.js (keyNameFor) */
const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6],
  FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3]; // lettere (Do=0) nell'ordine in cui compaiono in chiave
const keyAlter = (key, L) =>
  key > 0
    ? SHARP_ORDER.indexOf(L) < key
      ? 1
      : 0
    : key < 0
      ? FLAT_ORDER.indexOf(L) < -key
        ? -1
        : 0
      : 0;

const tonicPC = (sf) => {
  const row = KEY_TABLE[sf] || KEY_TABLE[0];
  return (((LETTER_SEMI[row[0]] + row[1]) % 12) + 12) % 12;
};
function keyAfterTranspose(curKey, semi) {
  // armatura più vicina (meno alterazioni) la cui tonica maggiore cade sulla stessa classe di altezza dopo il trasporto
  const target = (((tonicPC(curKey) + semi) % 12) + 12) % 12;
  let best = curKey;
  for (let sf = -7; sf <= 7; sf++) {
    if (tonicPC(sf) !== target) continue;
    if (
      best === curKey ||
      Math.abs(sf) < Math.abs(best) ||
      (Math.abs(sf) === Math.abs(best) && Math.sign(sf) === Math.sign(curKey))
    )
      best = sf;
  }
  return best;
}
const meterParts = (m) => {
  const [n, d] = m.split("/").map(Number);
  return { n, d };
};
const barTicksOf = (m) => {
  const { n, d } = meterParts(m);
  return n * ((4 * PPQ) / d);
};
const beatTicksOf = (m) => (meterParts(m).d === 8 ? 720 : 480); // battito: semiminima, o semiminima puntata nei metri in 8
const evTicks = (e) => DUR_BY[e.v].ticks * (e.dot ? 1.5 : 1);
const noteMidi = (n) =>
  12 * (Math.floor(n.d / 7) + 1) + LETTER_SEMI[n.d % 7] + n.a;
const noteLabel = (n) =>
  SOLFEGE[n.d % 7] + (n.a > 0 ? "♯" : n.a < 0 ? "♭" : "") + Math.floor(n.d / 7);
const sortNotes = (ns) =>
  ns.sort((a, b) => noteMidi(a) - noteMidi(b) || a.d - b.d);
const tempoTerm = (b) =>
  b < 40
    ? "Grave"
    : b < 60
      ? "Largo"
      : b < 66
        ? "Larghetto"
        : b < 76
          ? "Adagio"
          : b < 108
            ? "Andante"
            : b < 120
              ? "Moderato"
              : b < 156
                ? "Allegro"
                : b < 176
                  ? "Vivace"
                  : b < 200
                    ? "Presto"
                    : "Prestissimo";
const fmtTime = (s) => {
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
};
const slugify = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const SPELL_L = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6],
  SPELL_A = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]; // scrittura con i diesis
const SPELL_LF = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6],
  SPELL_AF = [0, -1, 0, -1, 0, 0, -1, 0, -1, 0, -1, 0]; // scrittura con i bemolli
function spellMidi(m, key, pref) {
  // come scrivere un'altezza MIDI: i tasti neri seguono l'armatura, salvo preferenza
  const o = Math.floor(m / 12) - 1,
    pc = m % 12,
    flat = pref ? pref === "flat" : key < 0;
  return flat
    ? { d: o * 7 + SPELL_LF[pc], a: SPELL_AF[pc] }
    : { d: o * 7 + SPELL_L[pc], a: SPELL_A[pc] };
}

/* Posizione sul tempo e controllo delle battute: ogni figura appartiene alla battuta in cui inizia. */
function analyze(events, barTicks) {
  let t = 0;
  const items = [],
    problems = [];
  events.forEach((e, i) => {
    const tk = evTicks(e),
      m = Math.floor(t / barTicks),
      cross = (t % barTicks) + tk > barTicks;
    items.push({ start: t, ticks: tk, m, cross });
    if (cross) problems.push({ m, i });
    t += tk;
  });
  return {
    items,
    total: t,
    measures: t ? Math.ceil(t / barTicks) : 0,
    problems,
  };
}
/* Alterazioni da scrivere: valgono per tutta la battuta e rispettano l'armatura. Una nota legata non ripete il segno. */
function accidentalsToShow(events, an, key) {
  const out = events.map(() => null),
    mem = new Map();
  let cm = -1,
    prev = null;
  events.forEach((e, i) => {
    const m = an.items[i].m;
    if (m !== cm) {
      cm = m;
      mem.clear();
    }
    if (e.r) {
      prev = null;
      return;
    }
    out[i] = e.n.map((n) => {
      const was = mem.has(n.d) ? mem.get(n.d) : keyAlter(key, n.d % 7);
      let show = n.a !== was ? n.a : null;
      if (
        show !== null &&
        prev &&
        prev.n.some((p) => p.t && p.d === n.d && p.a === n.a)
      )
        show = null;
      return show;
    });
    e.n.forEach((n) => mem.set(n.d, n.a));
    prev = e;
  });
  return out;
}
