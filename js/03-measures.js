"use strict";
/* ---------- 2. Figure, battute e legature ---------- */
const STD = [2880, 1920, 1440, 960, 720, 480, 360, 240, 180, 120, 90, 60];
const STD_INFO = {
  2880: ["w", 1],
  1920: ["w", 0],
  1440: ["h", 1],
  960: ["h", 0],
  720: ["q", 1],
  480: ["q", 0],
  360: ["e", 1],
  240: ["e", 0],
  180: ["s", 1],
  120: ["s", 0],
  90: ["t", 1],
  60: ["t", 0],
};
function decompose(ticks) {
  // scompone una durata in figure (anche puntate); sotto i 60 tick non resta nulla da scrivere
  const out = [];
  let tail = null;
  if (ticks % 60 === 30) {
    if (ticks >= 90) {
      tail = STD_INFO[90];
      ticks -= 90;
    } else ticks = 0;
  }
  while (ticks >= 60) {
    const s = STD.find((x) => x <= ticks);
    out.push(STD_INFO[s]);
    ticks -= s;
  }
  if (tail) out.push(tail);
  return out;
}
/* Figure per una durata che parte da `start`: se supera la barra di battuta si divide e le note vengono legate. */
function makeEvents(start, ticks, notes, bt) {
  const pieces = [];
  let s = start,
    left = ticks;
  while (left > 0) {
    const room = bt - (s % bt),
      take = Math.min(left, room);
    pieces.push(take);
    s += take;
    left -= take;
  }
  const durs = [];
  pieces.forEach((p) => decompose(p).forEach((d) => durs.push(d)));
  return durs.map(([v, dot], i) =>
    notes
      ? {
          r: false,
          v,
          dot,
          n: notes.map((n) =>
            i < durs.length - 1 ? { d: n.d, a: n.a, t: 1 } : { d: n.d, a: n.a },
          ),
        }
      : { r: true, v, dot },
  );
}
function resplitEvents(events, bt) {
  // divide con legature le figure che attraversano una barra di battuta
  const out = [];
  let t = 0,
    changed = false;
  for (const e of events) {
    const tk = evTicks(e);
    if ((t % bt) + tk > bt) {
      const pcs = makeEvents(t, tk, e.r ? null : e.n, bt);
      if (pcs.length > 1) {
        changed = true;
        if (!e.r) {
          const last = pcs[pcs.length - 1];
          last.n.forEach((n, j) => {
            if (e.n[j] && e.n[j].t) n.t = 1;
          });
          ["dy", "st", "ac", "sl"].forEach((f) => {
            if (e[f]) pcs[0][f] = e[f];
          });
          if (e.se) last.se = 1;
        }
        out.push(...pcs);
      } else out.push(e);
    } else out.push(e);
    t += tk;
  }
  return { events: out, changed };
}
function flattenNotes(events) {
  // note singole con inizio, durata e velocità: le note legate diventano una sola
  const out = [];
  let t = 0,
    open = new Map(),
    vel = 90;
  for (const e of events) {
    const tk = evTicks(e);
    if (e.r) {
      open = new Map();
      t += tk;
      continue;
    }
    if (e.dy) vel = DYN_VEL[e.dy];
    const next = new Map();
    for (const n of e.n) {
      const m = noteMidi(n);
      let idx = open.get(m);
      if (idx !== undefined) out[idx].l += tk;
      else {
        idx = out.length;
        out.push({
          s: t,
          l: tk,
          m,
          v: Math.min(127, vel + (e.ac ? 18 : 0)),
          stac: !!e.st && !n.t,
        });
      }
      if (n.t) next.set(m, idx);
    }
    open = next;
    t += tk;
  }
  out.forEach((x) => {
    if (x.stac) x.l = Math.max(60, Math.round(x.l / 2));
    delete x.stac;
  });
  return out;
}
const totalTicks = (events) => events.reduce((a, e) => a + evTicks(e), 0);
function cleanEvents(a) {
  // legge anche i progetti della versione precedente (una nota per figura)
  if (!Array.isArray(a)) return null;
  const out = [];
  for (const e of a.slice(0, 2000)) {
    if (!e || !DUR_BY[e.v]) continue;
    const dot = e.dot ? 1 : 0;
    if (e.r) {
      out.push({ r: true, v: e.v, dot });
      continue;
    }
    const raw = Array.isArray(e.n)
        ? e.n
        : e.d !== undefined
          ? [{ d: e.d, a: e.a, t: e.t }]
          : [],
      seen = new Set(),
      ns = [];
    for (const n of raw) {
      const d = Math.round(+n.d),
        a = Math.max(-1, Math.min(1, Math.round(+n.a || 0)));
      if (!Number.isFinite(d) || d < 7 || d > 60 || seen.has(d)) continue;
      seen.add(d);
      ns.push(n.t ? { d, a, t: 1 } : { d, a });
    }
    if (ns.length) {
      const x = { r: false, v: e.v, dot, n: sortNotes(ns) };
      if (DYNS.includes(e.dy)) x.dy = e.dy;
      if (e.st) x.st = 1;
      if (e.ac) x.ac = 1;
      if (e.sl) x.sl = 1;
      if (e.se) x.se = 1;
      out.push(x);
    }
  }
  return out;
}
