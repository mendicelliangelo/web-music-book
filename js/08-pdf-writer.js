"use strict";
/* ---------- 7. PDF dello spartito: le forme del disegno vengono ritradotte in comandi PDF vettoriali ---------- */
const mulM = (A, B) => [
  A[0] * B[0] + A[2] * B[1],
  A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3],
  A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4],
  A[1] * B[4] + A[3] * B[5] + A[5],
];
function parseTransform(str) {
  let M = [1, 0, 0, 1, 0, 0];
  const re = /(\w+)\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(str))) {
    const a = m[2]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    let T;
    if (m[1] === "translate") T = [1, 0, 0, 1, a[0], a[1] || 0];
    else if (m[1] === "scale")
      T = [a[0], 0, 0, a.length > 1 ? a[1] : a[0], 0, 0];
    else if (m[1] === "rotate") {
      const r = (a[0] * Math.PI) / 180,
        c = Math.cos(r),
        s = Math.sin(r);
      T = [c, s, -s, c, 0, 0];
      if (a.length > 2)
        T = mulM(mulM([1, 0, 0, 1, a[1], a[2]], T), [1, 0, 0, 1, -a[1], -a[2]]);
    } else continue;
    M = mulM(M, T);
  }
  return M;
}
const attrsOf = (s) => {
  const o = {},
    re = /([\w-]+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(s))) o[m[1]] = m[2];
  return o;
};
function pathCmds(d) {
  // solo comandi assoluti (M L H V Q C Z), come li producono il font e il disegno
  const tk = d.match(/[MLHVQCZ]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) || [],
    out = [];
  let i = 0,
    cx = 0,
    cy = 0,
    sx = 0,
    sy = 0,
    cmd = "";
  const num = () => +tk[i++];
  while (i < tk.length) {
    if (/[A-Z]/.test(tk[i])) cmd = tk[i++];
    if (cmd === "Z") {
      out.push(["Z"]);
      cx = sx;
      cy = sy;
      continue;
    }
    if (cmd === "M") {
      cx = num();
      cy = num();
      sx = cx;
      sy = cy;
      out.push(["M", cx, cy]);
      cmd = "L";
    } else if (cmd === "L") {
      cx = num();
      cy = num();
      out.push(["L", cx, cy]);
    } else if (cmd === "H") {
      cx = num();
      out.push(["L", cx, cy]);
    } else if (cmd === "V") {
      cy = num();
      out.push(["L", cx, cy]);
    } else if (cmd === "Q") {
      const x1 = num(),
        y1 = num(),
        x = num(),
        y = num();
      out.push([
        "C",
        cx + (2 / 3) * (x1 - cx),
        cy + (2 / 3) * (y1 - cy),
        x + (2 / 3) * (x1 - x),
        y + (2 / 3) * (y1 - y),
        x,
        y,
      ]);
      cx = x;
      cy = y;
    } else if (cmd === "C") {
      const a = [num(), num(), num(), num(), num(), num()];
      out.push(["C", ...a]);
      cx = a[4];
      cy = a[5];
    } else break;
  }
  return out;
}
function ellipseCmds(cx, cy, rx, ry) {
  const k = 0.5523,
    x0 = cx - rx,
    x1 = cx + rx,
    y0 = cy - ry,
    y1 = cy + ry;
  return [
    ["M", x1, cy],
    ["C", x1, cy + k * ry, cx + k * rx, y1, cx, y1],
    ["C", cx - k * rx, y1, x0, cy + k * ry, x0, cy],
    ["C", x0, cy - k * ry, cx - k * rx, y0, cx, y0],
    ["C", cx + k * rx, y0, x1, cy - k * ry, x1, cy],
    ["Z"],
  ];
}
function svgShapes(svg) {
  const shapes = [],
    re =
      /<(path|ellipse|circle|rect)\b([^>]*?)\/>|<text\b([^>]*)>([^<]*)<\/text>/g;
  let m;
  while ((m = re.exec(svg))) {
    const at = attrsOf(m[1] ? m[2] : m[3]),
      cls = at.class || "";
    if (/\b(hl|caret|actv)\b/.test(cls)) continue;
    const M = at.transform ? parseTransform(at.transform) : [1, 0, 0, 1, 0, 0];
    if (!m[1]) {
      shapes.push({
        t: "text",
        x: +at.x,
        y: +at.y,
        fs: +at["font-size"],
        txt: m[4].replace(/&amp;/g, "&"),
        font: /\bdyn\b/.test(cls) ? 2 : 1,
        M,
      });
      continue;
    }
    let cmds;
    if (m[1] === "path") cmds = pathCmds(at.d || "");
    else if (m[1] === "ellipse")
      cmds = ellipseCmds(+at.cx, +at.cy, +at.rx, +at.ry);
    else if (m[1] === "circle")
      cmds = ellipseCmds(+at.cx, +at.cy, +at.r, +at.r);
    else {
      const x = +at.x,
        y = +at.y,
        w = +at.width,
        h = +at.height;
      cmds = [
        ["M", x, y],
        ["L", x + w, y],
        ["L", x + w, y + h],
        ["L", x, y + h],
        ["Z"],
      ];
    }
    const ap = (x, y) => [
      M[0] * x + M[2] * y + M[4],
      M[1] * x + M[3] * y + M[5],
    ];
    const tc = cmds.map((c) => {
      const r = [c[0]];
      for (let q = 1; q < c.length; q += 2) {
        const p = ap(c[q], c[q + 1]);
        r.push(p[0], p[1]);
      }
      return r;
    });
    let y0 = Infinity,
      y1 = -Infinity;
    tc.forEach((c) => {
      for (let q = 2; q < c.length; q += 2) {
        y0 = Math.min(y0, c[q]);
        y1 = Math.max(y1, c[q]);
      }
    });
    let fill = at.fill === "currentColor",
      stroke = null;
    if (/\brule\b/.test(cls)) stroke = { w: 1, g: 0.35 };
    else if (/\bbl\b/.test(cls)) stroke = { w: 1.3, g: 0 };
    else if (at.stroke === "currentColor")
      stroke = { w: +at["stroke-width"] || 1, g: 0 };
    shapes.push({ t: "shape", cmds: tc, fill, stroke, cy: (y0 + y1) / 2 });
  }
  return shapes;
}
const n2 = (v) => v.toFixed(2);
function emitShape(sh, map, ks) {
  let o = "";
  for (const c of sh.cmds) {
    if (c[0] === "Z") o += "h\n";
    else {
      const pts = [];
      for (let q = 1; q < c.length; q += 2) {
        const p = map(c[q], c[q + 1]);
        pts.push(n2(p[0]), n2(p[1]));
      }
      o +=
        pts.join(" ") +
        " " +
        (c[0] === "M" ? "m" : c[0] === "L" ? "l" : "c") +
        "\n";
    }
  }
  if (sh.stroke)
    o =
      "q " +
      n2(sh.stroke.w * ks) +
      " w " +
      n2(sh.stroke.g) +
      " G\n" +
      o +
      (sh.fill ? "B" : "S") +
      "\nQ\n";
  else o += (sh.fill ? "f" : "n") + "\n";
  return o;
}
const WIN = {
  "–": "\x96",
  "—": "\x97",
  "’": "\x92",
  "‘": "\x91",
  "“": "\x93",
  "”": "\x94",
  "…": "\x85",
  "€": "\x80",
};
const pdfText = (s) =>
  String(s)
    .normalize("NFC")
    .replace(/[–—‘’“”…€]/g, (c) => WIN[c])
    .replace(/[^\x20-\xff]/g, "?")
    .replace(/([\\()])/g, "\\$1");
const TXT_W = {
  1: { f: 0.33, p: 0.56, m: 0.83 },
  2: { f: 0.39, p: 0.5, m: 0.78 },
  3: {},
  4: {},
};
const textWidth = (font, s, fs) => {
  let w = 0;
  for (const ch of s) w += (TXT_W[font][ch] || 0.5) * fs;
  return w;
};
function pdfFile(pages, PW, PH) {
  const objs = [],
    add = (x) => {
      objs.push(x);
      return objs.length;
    };
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("");
  ["Times-Bold", "Times-BoldItalic", "Times-Roman", "Times-Italic"].forEach(
    (n) =>
      add(
        `<< /Type /Font /Subtype /Type1 /BaseFont /${n} /Encoding /WinAnsiEncoding >>`,
      ),
  );
  const kids = [];
  for (const c of pages) {
    const cid = add(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`);
    kids.push(
      add(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n2(PW)} ${n2(PH)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${cid} 0 R >>`,
      ) + " 0 R",
    );
  }
  objs[1] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${kids.length} >>`;
  let out = "%PDF-1.4\n";
  const offs = [];
  objs.forEach((o, i) => {
    offs.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const x = out.length;
  out +=
    `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` +
    offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("") +
    `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  const u = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) u[i] = out.charCodeAt(i) & 255;
  return u;
}
function buildPdf(staves, o) {
  // A4 verticale: titolo e tempo in prima pagina, sistemi che vanno a capo tra le pagine, numero di pagina
  const W = 800,
    S = 11,
    PW = 595.28,
    PH = 841.89,
    ML = 40,
    MT = 50,
    MB = 46,
    HEAD = 44,
    MINI_HEAD = 20,
    k = (PW - 2 * ML) / W;
  const L = buildLayout(staves, {
    width: W,
    S,
    meter: o.meter,
    key: o.key,
    nS: o.nS,
    as: 0,
    cur: 0,
  });
  const svg = renderSVG(staves, L, {
    meter: o.meter,
    as: -1,
    sel: -1,
    selEnd: -1,
    selN: -1,
    showCaret: false,
  }).replace(/<g id="ghost"[\s\S]*$/, "</svg>");
  const shapes = svgShapes(svg),
    pages = [];
  let cur = null;
  L.systems.forEach((sy, si) => {
    const h = (sy.h + S * 0.4) * k;
    if (!cur || cur.used + h > cur.avail) {
      cur = {
        sys: [],
        used: 0,
        avail: PH - MT - MB - (pages.length ? MINI_HEAD : HEAD),
        first: !pages.length,
      };
      pages.push(cur);
    }
    cur.sys.push(si);
    cur.used += h;
  });
  const pageOfSys = [];
  pages.forEach((p, pi) =>
    p.sys.forEach((si) => {
      pageOfSys[si] = pi;
    }),
  );
  const sysOf = (y) => {
    for (let i = 0; i < L.systems.length; i++)
      if (y < L.systems[i].top + L.systems[i].h + S * 0.4) return i;
    return L.systems.length - 1;
  };
  const bodies = pages.map(() => []);
  for (const sh of shapes) {
    if (sh.t === "text") {
      const si = sysOf(sh.y);
      bodies[pageOfSys[si]].push({ sh, si });
      continue;
    }
    bodies[pageOfSys[sysOf(sh.cy)]].push({ sh, si: sysOf(sh.cy) });
  }
  const out = pages.map((pg, pi) => {
    const y0 = L.systems[pg.sys[0]].top,
      top = MT + (pg.first ? HEAD : MINI_HEAD);
    const map = (x, y) => [ML + x * k, PH - (top + (y - y0) * k)];
    let c = "0 g 0 G\n";
    if (pg.first) {
      const titleTxt = o.title || t("sheet.untitled"),
        title = pdfText(titleTxt);
      c += `BT /F1 20 Tf ${n2(PW / 2 - textWidth(1, titleTxt, 20) / 2)} ${n2(PH - MT + 6)} Td (${title}) Tj ET\n`;
      const term = tempoTerm(o.bpm);
      c += `BT /F4 11 Tf ${n2(ML)} ${n2(PH - MT - 14)} Td (${pdfText(term)}) Tj ET\n`;
      const nx = ML + textWidth(4, term, 11) + 12;
      const ns = svgShapes(
        "<svg>" + noteShape(0, 0, "q", 4, true, 1e9) + "</svg>",
      );
      for (const sh of ns)
        c += emitShape(sh, (x, y) => [nx + x, PH - MT - 14 - y], 1);
      c += `BT /F3 11 Tf ${n2(nx + 9)} ${n2(PH - MT - 14)} Td (= ${o.bpm}) Tj ET\n`;
    } else {
      const titleTxt = o.title || t("sheet.untitled");
      c += `BT /F3 10 Tf ${n2(ML)} ${n2(PH - MT + 2)} Td (${pdfText(titleTxt)}) Tj ET\n`;
    }
    for (const { sh } of bodies[pi]) {
      if (sh.t === "text") {
        const fs = sh.fs * k,
          p = map(sh.x, sh.y),
          w = textWidth(sh.font, sh.txt, fs);
        c += `BT /F${sh.font} ${n2(fs)} Tf ${n2(p[0] - w / 2)} ${n2(p[1])} Td (${pdfText(sh.txt)}) Tj ET\n`;
      } else c += emitShape(sh, map, k);
    }
    pg.sys.forEach((si) => {
      // numero della prima battuta di ogni riga (tranne la prima)
      const sy = L.systems[si];
      if (si === 0 || !sy.items.length) return;
      const p = map(L.lead, sy.staff[0].yTop - S * 1.5);
      c += `BT /F4 8 Tf ${n2(p[0])} ${n2(p[1])} Td (${sy.items[0].m + 1}) Tj ET\n`;
    });
    const foot = `${pi + 1} / ${pages.length}`;
    c += `BT /F3 8 Tf ${n2(PW / 2 - textWidth(3, foot, 8) / 2)} ${n2(MB - 16)} Td (${foot}) Tj ET\n`;
    return c;
  });
  return pdfFile(out, PW, PH);
}
/* Modalità «durata dal tocco»: da quanto resta premuto un tasto si ricava la figura. */
const holdTicks = (ms, bpm, grid) =>
  Math.max(grid, Math.round((ms * bpm * PPQ) / 60000 / grid) * grid);
function holdName(ticks) {
  const d = decompose(ticks)[0];
  if (!d) return "—";
  const name = durLabel(d[0], d[1]);
  return decompose(ticks).length > 1 ? name + " + " + t("dur.tied") : name;
}
/* Quantizza: ogni figura comincia e finisce sulla griglia g (in tick); la lunghezza totale non cambia.
   Le note che diventerebbero più brevi della griglia sono eliminate, le pause vicine si uniscono. */
function quantizeEvents(events, g, bt, start) {
  const n = events.length,
    starts = [];
  let t = start;
  events.forEach((e) => {
    starts.push(t);
    t += evTicks(e);
  });
  const endT = t,
    snap = (x) => Math.round(x / g) * g,
    q = (i) => (i === 0 ? start : snap(starts[i])),
    en = (i) => (i === n - 1 ? endT : snap(starts[i + 1]));
  const out = [];
  let dropped = 0,
    pr = 0,
    ps = 0;
  const flush = () => {
    if (pr > 0) {
      out.push(...makeEvents(ps, pr, null, bt));
      pr = 0;
    }
  };
  events.forEach((e, i) => {
    const a = q(i),
      dur = en(i) - a;
    if (dur < 60) {
      if (!e.r) dropped++;
      return;
    }
    if (e.r) {
      if (!pr) ps = a;
      pr += dur;
      return;
    }
    flush();
    const made = makeEvents(
      a,
      dur,
      e.n.map((x) => ({ d: x.d, a: x.a })),
      bt,
    );
    if (!made.length) {
      dropped++;
      return;
    }
    ["dy", "st", "ac", "sl"].forEach((f) => {
      if (e[f]) made[0][f] = e[f];
    });
    const last = made[made.length - 1];
    if (e.se) last.se = 1;
    last.n.forEach((x, j) => {
      if (e.n[j] && e.n[j].t) x.t = 1;
    });
    out.push(...made);
  });
  flush();
  return {
    events: out,
    dropped,
    changed: JSON.stringify(out) !== JSON.stringify(events),
  };
}
