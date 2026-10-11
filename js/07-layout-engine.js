"use strict";
/* ---------- 6. Impaginazione e disegno del pentagramma ---------- */
const f1 = (n) => Math.round(n * 100) / 100;
const escXml = (s) =>
  // dentro al testo di un elemento SVG servono solo queste tre fughe (le virgolette non vanno
  // sfuggite qui: lo richiederebbe solo un valore di attributo, e romperebbero il testo nel PDF,
  // che riconosce come entità solo &amp; in svgShapes di 08-pdf-writer.js)
  String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const tf = (x, y, k) => `translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(4)})`;
function headSVG(cx, cy, v, S, color) {
  const c = `cx="${f1(cx)}" cy="${f1(cy)}"`,
    rot = `transform="rotate(-22 ${f1(cx)} ${f1(cy)})"`,
    col = color || "currentColor";
  if (v === "w")
    return `<ellipse ${c} rx="${f1(S * 0.78)}" ry="${f1(S * 0.46)}" fill="none" stroke="${col}" stroke-width="${f1(S * 0.2)}"/>`;
  if (v === "h")
    return `<ellipse ${c} rx="${f1(S * 0.6)}" ry="${f1(S * 0.42)}" fill="none" stroke="${col}" stroke-width="${f1(S * 0.15)}" ${rot}/>`;
  return `<ellipse ${c} rx="${f1(S * 0.62)}" ry="${f1(S * 0.44)}" fill="${col}" ${rot}/>`;
}
const FLAGS = { q: 0, h: 0, e: 1, s: 2, t: 3 };
const STEM_LEN = [3.5, 3.5, 3.9, 4.6];
function flagSVG(sx, tip, up, fl, S) {
  const g = GLYPHS["flag" + fl],
    k = S / 250,
    tx = sx - S * 0.05;
  return up
    ? `<path fill="currentColor" d="${g.d}" transform="translate(${f1(tx)} ${f1(tip + g.top * k)}) scale(${k.toFixed(4)})"/>`
    : `<path fill="currentColor" d="${g.d}" transform="translate(${f1(tx)} ${f1(tip - g.top * k)}) scale(${k.toFixed(4)} ${(-k).toFixed(4)})"/>`;
}
function noteShape(cx, cy, v, S, up, yMid) {
  // nota singola isolata: testa, gambo e codina (serve per le icone dei pulsanti)
  let m = headSVG(cx, cy, v, S);
  if (v === "w") return m;
  const fl = FLAGS[v],
    sx = up ? cx + S * 0.57 : cx - S * 0.57,
    len = S * STEM_LEN[fl];
  let tip = up ? cy - len : cy + len;
  if (up && tip > yMid) tip = yMid;
  if (!up && tip < yMid) tip = yMid;
  m += `<path d="M${f1(sx)} ${f1(cy)}V${f1(tip)}" stroke="currentColor" stroke-width="${f1(S * 0.1)}" fill="none"/>`;
  if (fl > 0) m += flagSVG(sx, tip, up, fl, S);
  return m;
}
function restShape(v, cx, S, yBot) {
  if (v === "w")
    return `<rect x="${f1(cx - S * 0.65)}" y="${f1(yBot - 3 * S)}" width="${f1(S * 1.3)}" height="${f1(S * 0.5)}" fill="currentColor"/>`;
  if (v === "h")
    return `<rect x="${f1(cx - S * 0.65)}" y="${f1(yBot - 2.5 * S)}" width="${f1(S * 1.3)}" height="${f1(S * 0.5)}" fill="currentColor"/>`;
  const g = GLYPHS[{ q: "rest4", e: "rest8", s: "rest16", t: "rest32" }[v]],
    k = (g.hu * S) / 25000;
  return `<path fill="currentColor" d="${g.d}" transform="${tf(cx - (g.w * k) / 2, yBot - (g.top * S) / 250, k)}"/>`;
}
function accAt(kind, x, cy, S) {
  // alterazione con il bordo sinistro in x e centrata (il bemolle un po' più in basso) su cy
  const g = GLYPHS[kind],
    k = (g.hu * S) / 25000,
    h = (g.hu * S) / 250,
    top = kind === "flat" ? cy + S * 0.5 - h : cy - h / 2;
  return {
    w: g.w * k,
    svg: `<path fill="currentColor" d="${g.d}" transform="${tf(x, top, k)}"/>`,
  };
}
function noteIcon(v) {
  // figura da mostrare sui pulsanti
  const S = 9,
    cx = 9,
    cy = v === "w" ? 22 : 32;
  return `<svg viewBox="-2 -14 24 52" width="24" height="52" fill="none" aria-hidden="true">${noteShape(cx, cy, v, S, true, 0)}</svg>`;
}
function glyphIcon(name, hpx) {
  const g = GLYPHS[name],
    k = hpx / 100,
    w = g.w * k;
  return `<svg viewBox="0 0 ${f1(w)} ${hpx}" width="${f1(w)}" height="${hpx}" aria-hidden="true"><path fill="currentColor" d="${g.d}" transform="scale(${k.toFixed(4)})"/></svg>`;
}

/* verso dei gambi e travature: i gruppi si fanno per battito, con crome e figure più brevi consecutive */
function stemInfo(events, an, bd, meter) {
  const beat = beatTicksOf(meter),
    up = new Array(events.length).fill(false),
    group = new Array(events.length).fill(-1),
    groups = [];
  const mid = (e) => {
    const p = e.n.map((n) => n.d - bd);
    return (p[0] + p[p.length - 1]) / 2;
  };
  events.forEach((e, i) => {
    if (!e.r) up[i] = mid(e) < 4;
  });
  let cur = [],
    curBeat = -1;
  const flush = () => {
    if (cur.length >= 2) {
      const u = cur.reduce((a, j) => a + mid(events[j]), 0) / cur.length < 4;
      cur.forEach((j) => {
        up[j] = u;
        group[j] = groups.length;
      });
      groups.push({ idx: cur.slice(), up: u });
    }
    cur = [];
  };
  events.forEach((e, i) => {
    if (e.r || e.v === "w" || e.v === "h" || e.v === "q") {
      flush();
      return;
    }
    const b = Math.floor(an.items[i].start / beat);
    if (cur.length && (curBeat !== b || cur[cur.length - 1] !== i - 1)) flush();
    if (!cur.length) curBeat = b;
    cur.push(i);
  });
  flush();
  return { up, group, groups };
}
function evGeo(e, bd, up, acc) {
  // posizione delle teste, teste spostate (seconde) e colonne delle alterazioni
  const k = e.n.length,
    pos = e.n.map((n) => n.d - bd),
    disp = new Array(k).fill(0);
  if (up) {
    for (let j = 1; j < k; j++)
      if (pos[j] - pos[j - 1] === 1 && !disp[j - 1]) disp[j] = 1;
  } else {
    for (let j = k - 2; j >= 0; j--)
      if (pos[j + 1] - pos[j] === 1 && !disp[j + 1]) disp[j] = -1;
  }
  const accCol = new Array(k).fill(-1),
    cols = [];
  for (let j = k - 1; j >= 0; j--) {
    if (!acc || acc[j] === null || acc[j] === undefined) continue;
    let c = 0;
    while (cols[c] && cols[c].some((q) => Math.abs(q - pos[j]) < 6)) c++;
    (cols[c] = cols[c] || []).push(pos[j]);
    accCol[j] = c;
  }
  return {
    pos,
    up,
    disp,
    accCol,
    accCols: cols.length,
    dispL: disp.includes(-1),
    dispR: disp.includes(1),
  };
}

function buildLayout(staves, o) {
  const S = o.S,
    H = S / 2,
    bt = barTicksOf(o.meter),
    nS = o.nS,
    key = o.key,
    { n: tn, d: td } = meterParts(o.meter),
    M = 8,
    R = o.width - M;
  const tsW = S * (Math.max(String(tn).length, String(td).length) * 2.1 + 1.1),
    ksW = Math.abs(key) * S * 0.95 + (key ? S * 0.6 : 0),
    lead = M + (nS > 1 ? S * 1.9 : 0);
  const X = [];
  for (let k = 0; k < nS; k++) {
    const ev = staves[k].events,
      bd = CLEFS[staves[k].clef].bottomD,
      an = analyze(ev, bt),
      acc = accidentalsToShow(ev, an, key),
      st = stemInfo(ev, an, bd, o.meter);
    X.push({
      ev,
      bd,
      an,
      acc,
      st,
      geo: ev.map((e, i) => (e.r ? null : evGeo(e, bd, st.up[i], acc[i]))),
    });
  }
  /* colonne: ogni istante in cui inizia una figura, su uno o due pentagrammi, ha la sua colonna (così le note si allineano) */
  const byM = X.map((x) => {
    const b = new Map();
    x.an.items.forEach((it, i) => {
      if (!b.has(it.m)) b.set(it.m, []);
      b.get(it.m).push(i);
    });
    return b;
  });
  const maxM = Math.max(
    -1,
    ...X.map((x) =>
      x.an.items.length ? x.an.items[x.an.items.length - 1].m : -1,
    ),
  );
  const cols = [];
  for (let m = 0; m <= maxM; m++) {
    const map = new Map();
    X.forEach((x, k) => {
      for (const i of byM[k].get(m) || []) {
        const rel = x.an.items[i].start - m * bt;
        let c = map.get(rel);
        if (!c) {
          c = { m, rel, ev: new Array(nS).fill(-1) };
          map.set(rel, c);
        }
        c.ev[k] = i;
      }
    });
    const list = [...map.values()].sort((a, b) => a.rel - b.rel);
    list.forEach((c, ci) => {
      const next = list[ci + 1];
      let dur = Infinity,
        accW = 0,
        right = 0;
      c.ev.forEach((i, k) => {
        if (i < 0) return;
        const e = X[k].ev[i],
          g = X[k].geo[i];
        dur = Math.min(dur, X[k].an.items[i].ticks);
        if (!e.r)
          accW = Math.max(accW, g.accCols * S * 1.2 + (g.dispL ? S * 1.1 : 0));
        right = Math.max(
          right,
          (e.dot ? S * 0.8 : 0) + (!e.r && g.dispR ? S * 1.1 : 0),
        );
      });
      if (next) dur = Math.min(dur, next.rel - c.rel);
      c.accW = accW;
      c.fixed = accW + S * 1.8 + right;
      c.sp = S * (0.6 + 1.9 * Math.pow(dur / 480, 0.7));
      cols.push(c);
    });
  }
  /* sistemi (le righe): si va a capo preferibilmente a fine battuta */
  const systems = [];
  let cur = null;
  const newSys = () => {
    const first = systems.length === 0;
    cur = {
      first,
      x0: lead + S * 3.9 + ksW + (first ? tsW : 0) + S * 0.9,
      items: [],
      nat: 0,
    };
    systems.push(cur);
  };
  newSys();
  let i = 0;
  while (i < cols.length) {
    const it = cols[i],
      last = cur.items[cur.items.length - 1];
    const bar = last && last.m !== it.m ? S * 1.2 : 0,
      need = bar + it.fixed + it.sp;
    if (last && cur.nat + need > R - cur.x0 - S * 0.8) {
      let k = -1;
      for (let j = cur.items.length - 1; j > 0; j--)
        if (cur.items[j].bar > 0) {
          k = j;
          break;
        }
      if (k > 0) {
        i = cols.indexOf(cur.items[k].src);
        cur.items.length = k;
      }
      newSys();
      continue;
    }
    cur.items.push({ ...it, bar, src: it });
    cur.nat += need;
    i++;
  }
  const evPos = X.map(() => []);
  let top = 8;
  const maxTotal = Math.max(0, ...X.map((x) => x.an.total)),
    complete = maxTotal > 0 && maxTotal % bt === 0;
  systems.forEach((sy, si) => {
    const lastSys = si === systems.length - 1;
    const fixedSum = sy.items.reduce((a, c) => a + c.fixed + c.bar, 0),
      spSum = sy.items.reduce((a, c) => a + c.sp, 0) || 1;
    const avail = R - sy.x0 - S * 0.8,
      f = lastSys
        ? 1
        : Math.max(0.6, Math.min(2.2, (avail - fixedSum) / spSum));
    let x = sy.x0;
    for (const c of sy.items) {
      if (c.bar) {
        c.barX = x + c.bar / 2;
        x += c.bar;
      }
      c.w = c.fixed + c.sp * f;
      c.x = x;
      c.cx = x + c.accW + S * 0.8;
      x += c.w;
    }
    sy.endX = x;
    const nx = systems[si + 1];
    sy.endBar = !!(
      nx &&
      nx.items.length &&
      sy.items.length &&
      nx.items[0].m !== sy.items[sy.items.length - 1].m
    );
    let y = top;
    sy.staff = [];
    for (let k = 0; k < nS; k++) {
      let mn = 0,
        mx = 8,
        hasDy = false,
        hasSl = false,
        hasLyr = false,
        hasChord = false;
      for (const c of sy.items) {
        const idx = c.ev[k];
        if (idx < 0) continue;
        evPos[k][idx] = { sys: si, col: c };
        const e = X[k].ev[idx];
        if (e.r) continue;
        if (e.dy) hasDy = true;
        if (e.sl || e.se) hasSl = true;
        if (e.lyr) hasLyr = true;
        if (e.chord) hasChord = true;
        const g = X[k].geo[idx];
        mn = Math.min(mn, g.pos[0]);
        mx = Math.max(mx, g.pos[g.pos.length - 1]);
      }
      const lowExt = -mn * H;
      let dynOff = Math.max(S * 3.9, lowExt + S * 2.6);
      if (hasSl) dynOff = Math.max(dynOff, lowExt + S * 3.7);
      const above =
        Math.max(
          k ? S * 4.4 : S * 5.2,
          (mx - 8) * H + S * 2.2,
          hasSl ? (mx - 8) * H + S * 3.9 : 0,
        ) + (hasChord ? S * 2.6 : 0);
      const below =
          Math.max(
            S * 3.8,
            lowExt + S * 2.4,
            hasSl ? lowExt + S * 3.9 : 0,
            hasDy ? dynOff + S * 1.5 : 0,
          ) + (hasLyr ? S * 2.6 : 0),
        yTop = y + above;
      sy.staff.push({
        yTop,
        yBot: yTop + 4 * S,
        dynY: yTop + 4 * S + dynOff,
        chordY: yTop - S * 2,
        lyrY: yTop + 4 * S + below - S * 0.8,
      });
      y = yTop + 4 * S + below;
    }
    sy.top = top;
    sy.h = y - top;
    top += sy.h + S * 0.4;
  });
  const as = o.as || 0,
    ax = X[as],
    an_ = ax.ev.length;
  let caret;
  if (!an_) caret = { sys: 0, x: systems[0].x0 + S * 0.4 };
  else if (o.cur >= an_) {
    const p = evPos[as][an_ - 1];
    caret = {
      sys: p.sys,
      x: p.col.x + p.col.w + (ax.an.total % bt === 0 ? S * 1.6 : S * 0.5),
    };
  } else {
    const p = evPos[as][Math.max(0, o.cur)];
    caret = { sys: p.sys, x: p.col.x - S * 0.35 };
  }
  return {
    width: o.width,
    height: top + 4,
    S,
    M,
    R,
    lead,
    tsW,
    ksW,
    key,
    nS,
    systems,
    caret,
    evPos,
    X,
    complete,
    bt,
    maxTotal,
  };
}

function keySigSVG(key, clef, x, sf, S) {
  if (!key) return "";
  const arr = key > 0 ? CLEFS[clef].ks.s : CLEFS[clef].ks.f;
  let o = "";
  for (let j = 0; j < Math.abs(key); j++) {
    const a = accAt(
      key > 0 ? "sharp" : "flat",
      x + j * S * 0.95,
      sf.yBot - (arr[j] * S) / 2,
      S,
    );
    o += a.svg;
  }
  return o;
}
function tieSVG(x1, x2, y, dir, S) {
  // legatura: una lente sottile che si apre dalla nota
  if (x2 < x1 + S * 0.9) x2 = x1 + S * 0.9;
  const w = x2 - x1,
    h = Math.min(S * 1.05, w * 0.16 + S * 0.35),
    t = S * 0.2,
    y0 = y + dir * S * 0.4,
    xm = (x1 + x2) / 2;
  return `<path fill="currentColor" d="M${f1(x1)} ${f1(y0)}Q${f1(xm)} ${f1(y0 + dir * 2 * h)} ${f1(x2)} ${f1(y0)}Q${f1(xm)} ${f1(y0 + dir * 2 * (h - t))} ${f1(x1)} ${f1(y0)}Z"/>`;
}
function beamSVG(rows, up, S) {
  const T = S * 0.5,
    gap = S * 0.22,
    maxLv = Math.max(...rows.map((r) => r.lv)),
    len = S * (3.3 + 0.8 * (maxLv - 1));
  const xs = rows.map((r) => r.sx),
    raw = rows.map((r) => (up ? r.far - len : r.far + len)),
    dx = xs[xs.length - 1] - xs[0];
  let dy = raw[raw.length - 1] - raw[0];
  dy = Math.max(-S * 1.4, Math.min(S * 1.4, dy));
  const slope = dx ? dy / dx : 0;
  let y0 = up ? Infinity : -Infinity;
  rows.forEach((r, j) => {
    const need = raw[j] - slope * (xs[j] - xs[0]);
    y0 = up ? Math.min(y0, need) : Math.max(y0, need);
  });
  const yAt = (x) => y0 + slope * (x - xs[0]);
  rows.forEach((r) => {
    r.tip = yAt(r.sx);
  });
  let m = "";
  const half = S * 0.05;
  for (let L = 0; L < maxLv; L++) {
    const off = (up ? 1 : -1) * L * (T + gap);
    let j = 0;
    while (j < rows.length) {
      if (rows[j].lv <= L) {
        j++;
        continue;
      }
      let k = j;
      while (k + 1 < rows.length && rows[k + 1].lv > L) k++;
      let xa, xb;
      if (k > j) {
        xa = xs[j] - half;
        xb = xs[k] + half;
      } else {
        const left = j === rows.length - 1;
        xa = left ? xs[j] - S * 0.9 : xs[j] - half;
        xb = left ? xs[j] + half : xs[j] + S * 0.9;
      }
      const ya = yAt(xa) + off,
        yb = yAt(xb) + off;
      m += up
        ? `<path fill="currentColor" d="M${f1(xa)} ${f1(ya)}L${f1(xb)} ${f1(yb)}V${f1(yb + T)}L${f1(xa)} ${f1(ya + T)}Z"/>`
        : `<path fill="currentColor" d="M${f1(xa)} ${f1(ya - T)}L${f1(xb)} ${f1(yb - T)}V${f1(yb)}L${f1(xa)} ${f1(ya)}Z"/>`;
      j = k + 1;
    }
  }
  return m;
}
function staffSVG(k, sy, si, L, st, pts) {
  const S = L.S,
    H = S / 2,
    X = L.X[k],
    sf = sy.staff[k],
    yMid = sf.yBot - 2 * S,
    rows = [];
  for (const c of sy.items) {
    const i = c.ev[k];
    if (i >= 0) rows.push({ i, c, e: X.ev[i], g: X.geo[i], acc: X.acc[i] });
  }
  for (const r of rows) {
    if (r.e.r) continue;
    const g = r.g,
      cx = r.c.cx,
      kk = g.pos.length;
    r.ys = g.pos.map((p) => sf.yBot - p * H);
    r.hx = g.disp.map((d) => cx + d * S * 1.1);
    r.sx = g.up ? cx + S * 0.57 : cx - S * 0.57;
    r.lv = { e: 1, s: 2, t: 3 }[r.e.v] || 0;
    r.base = g.up ? r.ys[0] : r.ys[kk - 1];
    r.far = g.up ? r.ys[kk - 1] : r.ys[0];
  }
  let beams = "";
  const byGroup = new Map();
  for (const r of rows) {
    const gi = X.st.group[r.i];
    if (gi >= 0 && !r.e.r) {
      if (!byGroup.has(gi)) byGroup.set(gi, []);
      byGroup.get(gi).push(r);
    }
  }
  for (const [gi, list] of byGroup) {
    const runs = [];
    let run = [list[0]];
    for (let j = 1; j < list.length; j++) {
      if (list[j].i === list[j - 1].i + 1) run.push(list[j]);
      else {
        runs.push(run);
        run = [list[j]];
      }
    }
    runs.push(run);
    for (const rr of runs)
      if (rr.length >= 2) beams += beamSVG(rr, X.st.groups[gi].up, S);
  }
  let o = "";
  for (const r of rows) {
    const e = r.e,
      c = r.c,
      rg =
        st.sel >= 0
          ? [
              Math.min(st.sel, st.selEnd >= 0 ? st.selEnd : st.sel),
              Math.max(st.sel, st.selEnd >= 0 ? st.selEnd : st.sel),
            ]
          : null,
      sel = st.as === k && !!rg && r.i >= rg[0] && r.i <= rg[1],
      single = !(st.selEnd >= 0);
    let g = `<g class="ev${sel ? " sel" : ""}" data-s="${k}" data-i="${r.i}"><rect class="hl" x="${f1(c.x - S * 0.15)}" y="${f1(sf.yTop - S * 2)}" width="${f1(c.w)}" height="${f1(S * 8)}" rx="${f1(S * 0.4)}"/>`;
    if (e.r) {
      g += restShape(e.v, c.cx, S, sf.yBot);
      if (e.dot)
        g += `<circle cx="${f1(c.cx + S * 0.9)}" cy="${f1(sf.yBot - 2.5 * S)}" r="${f1(S * 0.17)}" fill="currentColor"/>`;
    } else {
      const gg = r.g,
        kk = gg.pos.length,
        lo = gg.pos[0],
        hi = gg.pos[kk - 1];
      let lg = "";
      const x1 = f1(Math.min(...r.hx) - S * 1.05),
        x2 = f1(Math.max(...r.hx) + S * 1.05);
      if (lo <= -2)
        for (let p = -2; p >= lo; p -= 2)
          lg += `M${x1} ${f1(sf.yBot - p * H)}H${x2}`;
      if (hi >= 10)
        for (let p = 10; p <= hi; p += 2)
          lg += `M${x1} ${f1(sf.yBot - p * H)}H${x2}`;
      if (lg)
        g += `<path d="${lg}" stroke="currentColor" stroke-width="1.2" fill="none"/>`;
      e.n.forEach((n, j) => {
        const a = r.acc ? r.acc[j] : null;
        if (a !== null && a !== undefined) {
          const kind = a === 0 ? "natural" : a > 0 ? "sharp" : "flat",
            gl = GLYPHS[kind],
            w = (gl.w * gl.hu * S) / 25000;
          g += accAt(
            kind,
            r.hx[j] - S * 0.62 - S * 0.28 - gg.accCol[j] * S * 1.15 - w,
            r.ys[j],
            S,
          ).svg;
        }
        g += headSVG(
          r.hx[j],
          r.ys[j],
          e.v,
          S,
          st.noteColors
            ? NOTE_COLORS[n.d % 7]
            : st.staffColors
              ? STAFF_COLORS[k]
              : null,
        );
        if (st.noteNames) {
          const L = LETTERS.en,
            label = L[n.d % 7] + (n.a > 0 ? "♯" : n.a < 0 ? "♭" : "");
          g += `<text class="notename" x="${f1(r.hx[j])}" y="${f1(r.ys[j] + S * 1.9)}" font-size="${f1(S * 1.05)}" text-anchor="middle">${label}</text>`;
        }
        if (e.dot)
          g += `<circle cx="${f1(c.cx + S * 0.95 + (gg.dispR ? S * 1.1 : 0))}" cy="${f1(gg.pos[j] % 2 === 0 ? r.ys[j] - H : r.ys[j])}" r="${f1(S * 0.17)}" fill="currentColor"/>`;
        if (sel && single && st.selN === j && kk > 1)
          g += `<circle cx="${f1(r.hx[j])}" cy="${f1(r.ys[j])}" r="${f1(S * 0.9)}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 2"/>`;
      });
      if (e.st || e.ac) {
        // staccato e accento dal lato della testa, opposto al gambo
        const dn = gg.up ? 1 : -1;
        let pp = gg.up
            ? lo % 2 === 0
              ? lo - 1
              : lo - 2
            : hi % 2 === 0
              ? hi + 1
              : hi + 2,
          my = sf.yBot - pp * H;
        const mx = c.cx;
        if (e.st) {
          g += `<circle cx="${f1(mx)}" cy="${f1(my)}" r="${f1(S * 0.2)}" fill="currentColor"/>`;
          my += dn * S * 1.1;
        }
        if (e.ac)
          g += `<path d="M${f1(mx - S * 0.75)} ${f1(my - S * 0.38)}L${f1(mx + S * 0.75)} ${f1(my)}L${f1(mx - S * 0.75)} ${f1(my + S * 0.38)}" stroke="currentColor" stroke-width="${f1(S * 0.15)}" fill="none"/>`;
      }
      if (e.dy)
        g += `<text class="dyn" x="${f1(c.cx)}" y="${f1(sf.dynY)}" font-size="${f1(S * 1.6)}" text-anchor="middle">${e.dy}</text>`;
      if (e.lyr)
        g += `<text class="lyr" x="${f1(c.cx)}" y="${f1(sf.lyrY)}" font-size="${f1(S * 1.6)}" text-anchor="middle">${escXml(e.lyr)}</text>`;
      if (e.chord)
        g += `<text class="chordsym" x="${f1(c.cx)}" y="${f1(sf.chordY)}" font-size="${f1(S * 1.7)}" text-anchor="middle">${escXml(e.chord)}</text>`;
      if (e.v !== "w") {
        const fl = FLAGS[e.v];
        let tip;
        if (r.tip !== undefined) tip = r.tip;
        else {
          const len = S * STEM_LEN[fl];
          tip = gg.up ? r.far - len : r.far + len;
          if (gg.up && tip > yMid) tip = yMid;
          if (!gg.up && tip < yMid) tip = yMid;
        }
        g += `<path d="M${f1(r.sx)} ${f1(r.base)}V${f1(tip)}" stroke="currentColor" stroke-width="${f1(S * 0.1)}" fill="none"/>`;
        if (fl > 0 && r.tip === undefined)
          g += flagSVG(r.sx, tip, gg.up, fl, S);
      }
      pts[k][r.i] = { sys: si, ys: r.ys, hx: r.hx, up: gg.up, dot: !!e.dot };
    }
    o += g + "</g>";
  }
  return o + beams;
}
function slurSVG(x1, ya, x2, yb, ex, dir, S) {
  // legatura di frase: lente più ampia della legatura di valore
  if (x2 < x1 + S) x2 = x1 + S;
  const t = S * 0.2,
    y1 = ya + dir * S * 0.9,
    y2 = yb + dir * S * 0.9,
    w = x2 - x1;
  let peak = ex + dir * S * (1.1 + Math.min(1, w / (S * 30)) * 0.8);
  peak =
    dir === 1
      ? Math.max(peak, Math.max(y1, y2) + S * 0.7)
      : Math.min(peak, Math.min(y1, y2) - S * 0.7);
  const yc = 2 * peak - (y1 + y2) / 2,
    xm = (x1 + x2) / 2;
  return `<path fill="currentColor" d="M${f1(x1)} ${f1(y1)}Q${f1(xm)} ${f1(yc)} ${f1(x2)} ${f1(y2)}Q${f1(xm)} ${f1(yc - dir * 2 * t)} ${f1(x1)} ${f1(y1)}Z"/>`;
}
function renderSVG(staves, L, st) {
  const S = L.S,
    H = S / 2,
    nS = L.nS,
    { n: tn, d: td } = meterParts(st.meter),
    pts = [];
  for (let k = 0; k < nS; k++) pts.push({});
  const figs = staves.slice(0, nS).reduce((a, s) => a + s.events.length, 0);
  let o = `<svg class="score" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.width} ${f1(L.height)}" width="${L.width}" height="${f1(L.height)}" role="img" aria-label="${t("aria.scoreImg", { n: figs })}">`;
  L.systems.forEach((sy, si) => {
    for (let k = 0; k < nS; k++) {
      const sf = sy.staff[k],
        cl = staves[k].clef,
        cg = GLYPHS[CLEFS[cl].glyph];
      let rules = "";
      for (let j = 0; j < 5; j++)
        rules += `M${L.lead} ${f1(sf.yBot - j * S)}H${L.R}`;
      o += `<path class="rule" d="${rules}"/>`;
      if (nS === 1)
        o += `<path class="bl" d="M${L.lead} ${f1(sf.yTop)}V${f1(sf.yBot)}"/>`;
      else if (st.as === k)
        o += `<path class="actv" d="M${f1(L.lead + 1)} ${f1(sf.yTop)}V${f1(sf.yBot)}"/>`;
      o += `<path fill="currentColor" d="${cg.d}" transform="${tf(L.lead + S * 0.6, sf.yBot - (cg.top * S) / 250 - (CLEFS[cl].line - CLEFS[cl].design) * S, (cg.hu * S) / 25000)}"/>`;
      o += keySigSVG(L.key, cl, L.lead + S * 3.9, sf, S);
      if (sy.first) {
        const tx = f1(L.lead + S * 3.9 + L.ksW + L.tsW / 2);
        o += `<text class="ts" x="${tx}" y="${f1(sf.yTop + 2 * S)}" font-size="${f1(3 * S)}">${tn}</text><text class="ts" x="${tx}" y="${f1(sf.yTop + 4 * S)}" font-size="${f1(3 * S)}">${td}</text>`;
      }
    }
    if (nS > 1) {
      const yT = sy.staff[0].yTop,
        yB = sy.staff[nS - 1].yBot;
      o += `<path class="bl" d="M${L.lead} ${f1(yT)}V${f1(yB)}"/>`;
      if (GLYPHS.brace) {
        const g = GLYPHS.brace,
          kx = (S * 1.4) / g.w,
          ky = (yB - yT) / 100;
        o += `<path fill="currentColor" d="${g.d}" transform="translate(${f1(L.M)} ${f1(yT)}) scale(${kx.toFixed(4)} ${ky.toFixed(4)})"/>`;
      }
    }
    for (const c of sy.items)
      if (c.bar)
        for (let k = 0; k < nS; k++)
          o += `<path class="bl" d="M${f1(c.barX)} ${f1(sy.staff[k].yTop)}V${f1(sy.staff[k].yBot)}"/>`;
    if (st.measureNumEvery && sy.items.length) {
      const yN = f1(sy.staff[0].yTop - S * 1.1);
      if (sy.items[0].m % st.measureNumEvery === 0)
        o += `<text class="mnum" x="${f1(sy.x0)}" y="${yN}" font-size="${f1(1.6 * S)}">${sy.items[0].m + 1}</text>`;
      for (const c of sy.items)
        if (c.bar && c.m % st.measureNumEvery === 0)
          o += `<text class="mnum" x="${f1(c.x)}" y="${yN}" font-size="${f1(1.6 * S)}">${c.m + 1}</text>`;
    }
    for (let k = 0; k < nS; k++) o += staffSVG(k, sy, si, L, st, pts);
    if (sy.endBar)
      for (let k = 0; k < nS; k++)
        o += `<path class="bl" d="M${L.R} ${f1(sy.staff[k].yTop)}V${f1(sy.staff[k].yBot)}"/>`;
    if (si === L.systems.length - 1 && L.complete && sy.items.length)
      for (let k = 0; k < nS; k++) {
        const sf = sy.staff[k];
        o += `<path class="bl" d="M${f1(sy.endX + S * 0.1)} ${f1(sf.yTop)}V${f1(sf.yBot)}"/><path d="M${f1(sy.endX + S * 0.4)} ${f1(sf.yTop)}V${f1(sf.yBot)}" stroke="currentColor" stroke-width="${f1(S * 0.32)}" fill="none"/>`;
      }
  });
  /* legature: da una nota alla successiva, anche tra due righe */
  for (let k = 0; k < nS; k++) {
    const ev = staves[k].events;
    ev.forEach((e, i) => {
      const nx = ev[i + 1];
      if (e.r || !nx || nx.r || !e.n.some((n) => n.t)) return;
      const a = pts[k][i],
        b = pts[k][i + 1];
      if (!a || !b) return;
      e.n.forEach((n, j) => {
        if (!n.t) return;
        const j2 = nx.n.findIndex((q) => noteMidi(q) === noteMidi(n));
        if (j2 < 0) return;
        const y = a.ys[j],
          mid = (e.n.length - 1) / 2,
          dir =
            e.n.length === 1 || j === mid ? (a.up ? 1 : -1) : j < mid ? 1 : -1;
        const x1 = a.hx[j] + S * (a.dot ? 1.4 : 0.75),
          x2 = b.hx[j2] - S * 0.75;
        if (a.sys === b.sys) o += tieSVG(x1, x2, y, dir, S);
        else {
          o += tieSVG(x1, L.R - S * 0.3, y, dir, S);
          o += tieSVG(L.systems[b.sys].x0 - S * 0.4, x2, b.ys[j2], dir, S);
        }
      });
    });
  }
  for (let k = 0; k < nS; k++) {
    // legature di frase: da una figura con «sl» alla prima successiva con «se»
    const ev = staves[k].events;
    ev.forEach((e, i) => {
      if (e.r || !e.sl) return;
      let j = -1;
      for (let q = i + 1; q < ev.length; q++) {
        if (ev[q].se) {
          j = q;
          break;
        }
        if (ev[q].sl) break;
      }
      if (j < 0) return;
      const idx = [];
      for (let q = i; q <= j; q++) if (pts[k][q]) idx.push(q);
      if (idx.length < 2) return;
      const ups = idx.filter((q) => pts[k][q].up).length,
        dir = ups * 2 > idx.length ? 1 : -1;
      const ext = (q) => {
        const p = pts[k][q];
        return dir === 1 ? p.ys[0] : p.ys[p.ys.length - 1];
      };
      const groups = [];
      idx.forEach((q) => {
        const sy = pts[k][q].sys,
          g = groups[groups.length - 1];
        if (g && g.sys === sy) g.q.push(q);
        else groups.push({ sys: sy, q: [q] });
      });
      groups.forEach((g, gi) => {
        const a = pts[k][g.q[0]],
          b = pts[k][g.q[g.q.length - 1]];
        const x1 = gi === 0 ? a.hx[0] : L.systems[g.sys].x0 - S * 0.4,
          x2 = gi === groups.length - 1 ? b.hx[0] : L.R - S * 0.3;
        const ys = g.q.map(ext),
          ex = dir === 1 ? Math.max(...ys) : Math.min(...ys);
        o += slurSVG(x1, ext(g.q[0]), x2, ext(g.q[g.q.length - 1]), ex, dir, S);
      });
    });
  }
  for (let k = 0; k < nS; k++) {
    staves[k].events.forEach((e, i) => {
      if (!e.ferm && !e.trill && !e.mord) return;
      const p = pts[k][i];
      if (!p) return;
      const x = p.hx[0],
        yTop = Math.min(...p.ys) - S * 2.6;
      if (e.ferm)
        o += `<path d="M${f1(x - S * 0.65)} ${f1(yTop)} A${f1(S * 0.65)} ${f1(S * 0.65)} 0 0 1 ${f1(x + S * 0.65)} ${f1(yTop)}" stroke="currentColor" stroke-width="${f1(S * 0.14)}" fill="none"/><circle cx="${f1(x)}" cy="${f1(yTop - S * 0.65)}" r="${f1(S * 0.12)}" fill="currentColor"/>`;
      else if (e.trill)
        o += `<text class="orn" x="${f1(x)}" y="${f1(yTop)}" font-size="${f1(1.7 * S)}" text-anchor="middle">tr</text>`;
      else if (e.mord) {
        const w = S * 0.3;
        o += `<path d="M${f1(x - 2 * w)} ${f1(yTop)}L${f1(x - w)} ${f1(yTop - S * 0.6)}L${f1(x)} ${f1(yTop)}L${f1(x + w)} ${f1(yTop - S * 0.6)}L${f1(x + 2 * w)} ${f1(yTop)}" stroke="currentColor" stroke-width="${f1(S * 0.12)}" fill="none"/>`;
      }
    });
  }
  for (let k = 0; k < nS; k++) {
    const ev = staves[k].events;
    [
      ["cr", "crEnd"],
      ["dim", "dimEnd"],
    ].forEach(([startF, endF]) => {
      ev.forEach((e, i) => {
        if (e.r || !e[startF]) return;
        let j = -1;
        for (let q = i + 1; q < ev.length; q++) {
          if (ev[q][endF]) {
            j = q;
            break;
          }
          if (ev[q][startF]) break;
        }
        if (j < 0) return;
        const idx = [];
        for (let q = i; q <= j; q++) if (pts[k][q]) idx.push(q);
        if (idx.length < 2) return;
        const groups = [];
        idx.forEach((q) => {
          const sy = pts[k][q].sys,
            g = groups[groups.length - 1];
          if (g && g.sys === sy) g.q.push(q);
          else groups.push({ sys: sy, q: [q] });
        });
        groups.forEach((g, gi) => {
          const a = pts[k][g.q[0]],
            b = pts[k][g.q[g.q.length - 1]],
            sf = L.systems[g.sys].staff[k],
            yc = sf.yBot + S * 2,
            hw = S * 0.75;
          const x1 = gi === 0 ? a.hx[0] : L.systems[g.sys].x0 - S * 0.4,
            x2 = gi === groups.length - 1 ? b.hx[0] : L.R - S * 0.3;
          const open = startF === "cr";
          const y1a = yc - (open ? 0 : hw),
            y1b = yc + (open ? 0 : hw),
            y2a = yc - (open ? hw : 0),
            y2b = yc + (open ? hw : 0);
          o += `<path d="M${f1(x1)} ${f1(y1a)}L${f1(x2)} ${f1(y2a)}M${f1(x1)} ${f1(y1b)}L${f1(x2)} ${f1(y2b)}" stroke="currentColor" stroke-width="${f1(S * 0.12)}" fill="none"/>`;
        });
      });
    });
  }
  for (let k = 0; k < nS; k++) {
    staves[k].events.forEach((e, i) => {
      if (!e.pd && !e.pu) return;
      const p = pts[k][i];
      if (!p) return;
      const yL = L.systems[p.sys].staff[k].yBot + S * 2.4;
      if (e.pd)
        o += `<text class="ped" x="${f1(p.hx[0])}" y="${f1(yL)}" font-size="${f1(1.5 * S)}">Ped.</text>`;
      if (e.pu)
        o += `<text class="ped" x="${f1(p.hx[0])}" y="${f1(yL)}" font-size="${f1(1.8 * S)}">*</text>`;
    });
  }
  for (let k = 0; k < nS; k++) {
    staves[k].events.forEach((e, i) => {
      if (!e.mk) return;
      const p = pts[k][i];
      if (!p) return;
      const mk = String(e.mk).replace(/[^A-Za-z0-9]/g, "");
      if (!mk) return;
      const x = p.hx[0],
        y = Math.min(...p.ys) - S * 3.2;
      o += `<text class="rehearsal" x="${f1(x)}" y="${f1(y)}" font-size="${f1(3 * S)}">${mk}</text>`;
    });
  }
  if (st.showCaret !== false) {
    const cs = L.systems[L.caret.sys].staff[st.as || 0];
    o += `<path class="caret" d="M${f1(L.caret.x)} ${f1(cs.yTop - S * 1.2)}V${f1(cs.yBot + S * 1.2)}"/>`;
  }
  o += `<g id="ghost" class="ghost" style="display:none"><ellipse id="ghostHead" cx="0" cy="0" rx="${f1(S * 0.62)}" ry="${f1(S * 0.44)}" fill="currentColor" transform="rotate(-22)"/><path id="ghostLed" d="" stroke="currentColor" stroke-width="1.2" fill="none"/></g></svg>`;
  return o;
}
