(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ---------- colour helpers ---------- */
  const rgbCache = {};
  function rgb(hex) {
    return rgbCache[hex] || (rgbCache[hex] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);
  }
  function mix(a, b, t) {
    const A = rgb(a), B = rgb(b);
    return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
  }
  function seeded(seed) { // small repeatable random numbers, so the hydrangea never changes shape
    return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  /* ---------- palettes: deep (shadow), mid, tip (light edge) ---------- */
  const PAL = {
    red:    { deep: '#6b0a1c', mid: '#e5173f', tip: '#ff8a9c' },
    pink:   { deep: '#8a1456', mid: '#f0489f', tip: '#ffc2e2' },
    peach:  { deep: '#9a3a1a', mid: '#ff8f5a', tip: '#ffd2b0' },
    yellow: { deep: '#9a6a00', mid: '#ffc400', tip: '#fff1a0' },
    violet: { deep: '#3d1478', mid: '#9d4bf0', tip: '#dcb8ff' },
    white:  { deep: '#8d7a8c', mid: '#f4eaf4', tip: '#ffffff' },
    orange: { deep: '#8a2a00', mid: '#ff6a00', tip: '#ffc27a' },
    blue:   { deep: '#1c2a8a', mid: '#4f7dff', tip: '#b8ccff' }
  };

  /* ======================================================================
     The flowers. Each one is a drawing function, in its own local space:
     (0,0) is the middle of the flower, R is how far it reaches.
     ====================================================================== */
  let hctx = null;

  function rose(R, p, pal) {
    const s = 0.28 + 0.72 * p;
    const layers = [
      { n: 5, d: 0.46, rx: 0.56, ry: 0.50, off: 0.00, sh: 0.00 },
      { n: 5, d: 0.31, rx: 0.43, ry: 0.39, off: 0.63, sh: 0.30 },
      { n: 4, d: 0.17, rx: 0.31, ry: 0.28, off: 0.20, sh: 0.55 },
      { n: 3, d: 0.07, rx: 0.21, ry: 0.19, off: 1.00, sh: 0.80 }
    ];
    for (const L of layers) {
      for (let i = 0; i < L.n; i++) {
        const a = L.off + (i * TAU) / L.n;
        hctx.save();
        hctx.translate(Math.cos(a) * L.d * R * s, Math.sin(a) * L.d * R * s);
        hctx.rotate(a);
        const rx = R * L.rx * s, ry = R * L.ry * s;
        const g = hctx.createLinearGradient(-rx, 0, rx, 0);
        g.addColorStop(0, mix(pal.mid, pal.deep, L.sh * 0.9));
        g.addColorStop(1, mix(pal.tip, pal.mid, L.sh * 0.6));
        hctx.beginPath(); hctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
        hctx.fillStyle = g; hctx.fill();
        hctx.lineWidth = Math.max(1, R * 0.04); hctx.strokeStyle = pal.deep; hctx.globalAlpha = 0.85; hctx.stroke();
        hctx.globalAlpha = 0.8; hctx.strokeStyle = pal.tip; hctx.lineWidth = Math.max(1, R * 0.03);
        hctx.beginPath(); hctx.ellipse(0, 0, rx * 0.82, ry * 0.82, 0, -0.95, 0.95); hctx.stroke();
        hctx.globalAlpha = 1;
        hctx.restore();
      }
    }
    hctx.strokeStyle = pal.deep; hctx.lineWidth = Math.max(1, R * 0.035);
    for (let k = 0; k < 3; k++) { hctx.beginPath(); hctx.arc(0, 0, R * (0.05 + k * 0.05) * s, k * 2, k * 2 + 4.2); hctx.stroke(); }
  }

  function sunflower(R, p) {
    const s = 0.3 + 0.7 * p;
    const ring = (n, len, wid, off, c0, c1, edge) => {
      for (let i = 0; i < n; i++) {
        const a = off + (i * TAU) / n;
        hctx.save(); hctx.rotate(a);
        const r0 = R * 0.3 * s, r1 = R * len * s, w = R * wid * s;
        hctx.beginPath(); hctx.moveTo(r0, 0);
        hctx.bezierCurveTo(r0 + (r1 - r0) * 0.3, w, r0 + (r1 - r0) * 0.8, w * 0.8, r1, 0);
        hctx.bezierCurveTo(r0 + (r1 - r0) * 0.8, -w * 0.8, r0 + (r1 - r0) * 0.3, -w, r0, 0);
        const g = hctx.createLinearGradient(r0, 0, r1, 0); g.addColorStop(0, c0); g.addColorStop(1, c1);
        hctx.fillStyle = g; hctx.fill();
        hctx.strokeStyle = edge; hctx.lineWidth = Math.max(1, R * 0.025); hctx.stroke();
        hctx.restore();
      }
    };
    ring(18, 1.0, 0.13, 0, '#e08a00', '#ffd23a', '#a85a00');
    ring(18, 0.92, 0.12, TAU / 36, '#ffb000', '#fff07a', '#c47a00');
    const cr = R * 0.44 * s;
    const g = hctx.createRadialGradient(0, 0, 0, 0, 0, cr);
    g.addColorStop(0, '#2b1204'); g.addColorStop(0.7, '#5a3410'); g.addColorStop(1, '#a56a1c');
    hctx.beginPath(); hctx.arc(0, 0, cr, 0, TAU); hctx.fillStyle = g; hctx.fill();
    hctx.fillStyle = '#f0b64a';
    for (let i = 1; i < 70; i++) {
      const r = cr * 0.95 * Math.sqrt(i / 70), a = i * 2.39996;
      hctx.beginPath(); hctx.arc(Math.cos(a) * r, Math.sin(a) * r, Math.max(0.8, R * 0.022), 0, TAU); hctx.fill();
    }
  }

  function daisy(R, p, pal) {
    const s = 0.3 + 0.7 * p;
    for (let layer = 0; layer < 2; layer++) {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i * TAU) / n + layer * (TAU / 24);
        hctx.save(); hctx.rotate(a);
        const r0 = R * 0.2 * s, r1 = R * (layer ? 0.9 : 1.0) * s, w = R * 0.15 * s;
        hctx.beginPath(); hctx.moveTo(r0, 0);
        hctx.bezierCurveTo(r0 + (r1 - r0) * 0.2, w * 1.1, r1 * 0.97, w * 0.9, r1, 0);
        hctx.bezierCurveTo(r1 * 0.97, -w * 0.9, r0 + (r1 - r0) * 0.2, -w * 1.1, r0, 0);
        const g = hctx.createLinearGradient(r0, 0, r1, 0);
        g.addColorStop(0, layer ? mix(pal.mid, pal.deep, 0.5) : pal.mid); g.addColorStop(1, pal.tip);
        hctx.fillStyle = g; hctx.fill();
        hctx.strokeStyle = pal.deep; hctx.globalAlpha = 0.8; hctx.lineWidth = Math.max(1, R * 0.03); hctx.stroke();
        hctx.globalAlpha = 1;
        hctx.restore();
      }
    }
    const cr = R * 0.24 * s;
    const g = hctx.createRadialGradient(-cr * 0.3, -cr * 0.3, 0, 0, 0, cr);
    g.addColorStop(0, '#fff27a'); g.addColorStop(1, '#f0a000');
    hctx.beginPath(); hctx.arc(0, 0, cr, 0, TAU); hctx.fillStyle = g; hctx.fill();
    hctx.fillStyle = '#b86a00';
    for (let i = 1; i < 18; i++) { const r = cr * 0.85 * Math.sqrt(i / 18), a = i * 2.39996; hctx.beginPath(); hctx.arc(Math.cos(a) * r, Math.sin(a) * r, Math.max(0.7, R * 0.02), 0, TAU); hctx.fill(); }
  }

  function lily(R, p, pal) {
    const s = 0.3 + 0.7 * p;
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6 + 0.3;
      hctx.save(); hctx.rotate(a);
      const L = R * s, w = R * 0.27 * (0.6 + 0.4 * p);
      hctx.beginPath(); hctx.moveTo(0, 0);
      hctx.bezierCurveTo(L * 0.25, w, L * 0.75, w * 0.85, L, 0);
      hctx.bezierCurveTo(L * 0.75, -w * 0.85, L * 0.25, -w, 0, 0);
      const g = hctx.createLinearGradient(0, 0, L, 0);
      g.addColorStop(0, pal.deep); g.addColorStop(0.3, pal.mid); g.addColorStop(1, pal.tip);
      hctx.fillStyle = g; hctx.fill();
      hctx.strokeStyle = pal.deep; hctx.lineWidth = Math.max(1, R * 0.03); hctx.stroke();
      hctx.globalAlpha = 0.6; hctx.beginPath(); hctx.moveTo(L * 0.1, 0); hctx.lineTo(L * 0.85, 0); hctx.stroke();
      hctx.globalAlpha = 1; hctx.fillStyle = '#5a1a2a';
      for (let k = 0; k < 4; k++) { hctx.beginPath(); hctx.arc(L * (0.22 + k * 0.1), (k % 2 ? 1 : -1) * w * 0.28, Math.max(0.8, R * 0.025), 0, TAU); hctx.fill(); }
      hctx.restore();
    }
    if (p > 0.4) {
      hctx.globalAlpha = clamp((p - 0.4) / 0.4);
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * TAU + 0.1, sx = Math.cos(a) * R * 0.4, sy = Math.sin(a) * R * 0.4;
        hctx.strokeStyle = '#d98a2a'; hctx.lineWidth = Math.max(1, R * 0.03);
        hctx.beginPath(); hctx.moveTo(0, 0); hctx.lineTo(sx, sy); hctx.stroke();
        hctx.fillStyle = '#7a3a10'; hctx.beginPath(); hctx.ellipse(sx, sy, R * 0.07, R * 0.04, a, 0, TAU); hctx.fill();
      }
      hctx.globalAlpha = 1;
    }
  }

  // tulip is drawn standing up: (0,0) is where the flower meets the stem, it grows towards -y
  function tulip(R, p, pal) {
    const W = R * 1.0, Hh = R * 1.65 * (0.55 + 0.45 * p), spread = p * W * 0.34;
    const petal = (cx, tipX, tipY, wid, c0, c1, rot) => {
      hctx.save(); hctx.translate(cx, 0); hctx.rotate(rot);
      hctx.beginPath(); hctx.moveTo(0, 0);
      hctx.bezierCurveTo(-wid, -Hh * 0.1, -wid * 0.95 + tipX * 0.3, -Hh * 0.8, tipX, tipY);
      hctx.bezierCurveTo(wid * 0.95 + tipX * 0.3, -Hh * 0.8, wid, -Hh * 0.1, 0, 0);
      const g = hctx.createLinearGradient(0, 0, 0, tipY);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      hctx.fillStyle = g; hctx.fill();
      hctx.strokeStyle = pal.deep; hctx.lineWidth = Math.max(1, R * 0.045); hctx.stroke();
      hctx.restore();
    };
    petal(-W * 0.2, -spread * 0.5, -Hh * 0.97, W * 0.5, pal.deep, mix(pal.mid, pal.deep, 0.4), -0.18 * p);
    petal(W * 0.2, spread * 0.5, -Hh * 0.97, W * 0.5, pal.deep, mix(pal.mid, pal.deep, 0.4), 0.18 * p);
    petal(0, 0, -Hh, W * 0.56, pal.mid, pal.tip, 0);
    hctx.strokeStyle = pal.tip; hctx.globalAlpha = 0.65; hctx.lineWidth = Math.max(1, R * 0.04);
    hctx.beginPath(); hctx.moveTo(-W * 0.18, -Hh * 0.18); hctx.quadraticCurveTo(-W * 0.3, -Hh * 0.55, -W * 0.08, -Hh * 0.88); hctx.stroke();
    hctx.globalAlpha = 1;
  }

  const FLORETS = (() => {
    const rnd = seeded(7), list = [];
    for (let i = 0; i < 52; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * 0.86; list.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, t: rnd() }); }
    return list.sort((a, b) => a.y - b.y);
  })();
  function hydrangea(R, p, pal) {
    const s = 0.4 + 0.6 * p, fr = R * 0.19 * s;
    for (const f of FLORETS) {
      const x = f.x * R * s, y = f.y * R * s * 0.95;
      const col = mix(pal.mid, pal.tip, f.t * 0.8);
      hctx.fillStyle = col; hctx.strokeStyle = pal.deep; hctx.lineWidth = Math.max(0.8, R * 0.02);
      for (let k = 0; k < 4; k++) {
        const a = k * (TAU / 4) + f.t * 3;
        hctx.beginPath(); hctx.arc(x + Math.cos(a) * fr * 0.55, y + Math.sin(a) * fr * 0.55, fr * 0.62, 0, TAU); hctx.fill(); hctx.stroke();
      }
      hctx.fillStyle = '#fff6c8'; hctx.beginPath(); hctx.arc(x, y, Math.max(0.8, fr * 0.22), 0, TAU); hctx.fill();
    }
  }

  // x: -1..1 across the bouquet, y: 0..1 up from the base, r: reach as a fraction of bouquet width,
  // face: 'front' flowers look at you (squashed by tilt), 'stem' flowers follow their stem (tulips)
  const FLOWERS = [
    { type: 'sunflower', x:  0.00, y: 0.82, r: 0.215, tilt: 0.92, tr:  0.00, ph: 0.0 },
    { type: 'rose', pal: 'pink',   x: -0.58, y: 0.68, r: 0.180, tilt: 0.86, tr: -0.30, ph: 1.3 },
    { type: 'rose', pal: 'red',    x:  0.58, y: 0.70, r: 0.180, tilt: 0.86, tr:  0.35, ph: 2.1 },
    { type: 'tulip', pal: 'violet', x: -0.20, y: 0.55, r: 0.115, ph: 3.2 },
    { type: 'tulip', pal: 'yellow', x:  0.22, y: 0.53, r: 0.115, ph: 4.0 },
    { type: 'lily', pal: 'orange', x: -0.92, y: 0.46, r: 0.160, tilt: 0.72, tr: -0.5, ph: 5.1 },
    { type: 'hydrangea', pal: 'blue', x: 0.92, y: 0.48, r: 0.160, tilt: 0.95, tr: 0.0, ph: 0.7 },
    { type: 'daisy', pal: 'white', x: -0.50, y: 0.33, r: 0.140, tilt: 0.82, tr: 0.25, ph: 2.7 },
    { type: 'rose', pal: 'peach',  x:  0.50, y: 0.34, r: 0.140, tilt: 0.84, tr: -0.25, ph: 3.8 }
  ];

  const LEAVES = [
    { a: -2.80, len: 0.26 }, { a: -2.40, len: 0.31 }, { a: -2.05, len: 0.35 }, { a: -1.75, len: 0.31 },
    { a: -1.38, len: 0.31 }, { a: -1.10, len: 0.35 }, { a: -0.75, len: 0.31 }, { a: -0.34, len: 0.26 }
  ];

  /* ======================================================================
     The bouquet: draw the flowers on a hidden canvas, then replace every
     small block of the picture with a letter from "babyamira".
     ====================================================================== */
  const WORD = 'babyamira';

  function createBouquet(canvas) {
    const ctx = canvas.getContext('2d');
    const hid = document.createElement('canvas');
    hctx = hid.getContext('2d');
    hid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:screen;opacity:.85;pointer-events:none';
    canvas.parentNode.insertBefore(hid, canvas); // the flower drawing shows softly underneath the letters
    const small = document.createElement('canvas');
    const sctx = small.getContext('2d', { willReadFrequently: true });
    const SS = 4;
    let W = 0, H = 0, cols = 0, rows = 0, cw = 0, ch = 0, dpr = 1;
    let startAt = null, lastDraw = 0;
    const colorCache = new Map();
    const geo = { BW: 0 };

    function resize() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      cols = Math.max(48, Math.round(W / 4.6));
      cw = W / cols;
      rows = Math.max(30, Math.round(H / (cw * 1.9)));
      ch = H / rows;
      hid.width = cols * SS; hid.height = rows * SS;
      small.width = cols; small.height = rows;
    }

    function leaf(x0, y0, ang, len, grow) {
      if (grow <= 0) return;
      const l = len * grow, wid = len * 0.1 * (0.4 + 0.6 * grow);
      const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
      const sag = len * 0.1 * (dx >= 0 ? 1 : -1) * (dy > -0.5 ? 1 : 0.4);
      const mx = x0 + dx * l * 0.5 + px * sag, my = y0 + dy * l * 0.5 + py * sag;
      const tx = x0 + dx * l + px * sag * 1.8, ty = y0 + dy * l + py * sag * 1.8;
      hctx.beginPath(); hctx.moveTo(x0, y0);
      hctx.quadraticCurveTo(mx + px * wid * 2, my + py * wid * 2, tx, ty);
      hctx.quadraticCurveTo(mx - px * wid * 2, my - py * wid * 2, x0, y0);
      const g = hctx.createLinearGradient(x0, y0, tx, ty);
      g.addColorStop(0, '#1b8a3a'); g.addColorStop(1, '#6af08a');
      hctx.fillStyle = g; hctx.fill();
      hctx.strokeStyle = '#d2ffd8'; hctx.globalAlpha = 0.6; hctx.lineWidth = Math.max(1, len * 0.012);
      hctx.beginPath(); hctx.moveTo(x0, y0); hctx.quadraticCurveTo(mx, my, tx, ty); hctx.stroke();
      hctx.globalAlpha = 1;
    }

    function bow(x, y, bw, grow) {
      if (grow <= 0) return;
      hctx.globalAlpha = grow; hctx.fillStyle = '#ff5f86'; hctx.strokeStyle = '#7d1030'; hctx.lineWidth = 1.5;
      for (const s of [-1, 1]) { hctx.beginPath(); hctx.ellipse(x + s * bw * 0.55, y - bw * 0.1, bw * 0.55, bw * 0.28, s * -0.45, 0, TAU); hctx.fill(); hctx.stroke(); }
      hctx.beginPath(); hctx.ellipse(x, y - bw * 0.02, bw * 0.2, bw * 0.2, 0, 0, TAU); hctx.fill(); hctx.stroke();
      hctx.fillStyle = '#ff9fb9';
      for (const s of [-1, 1]) { hctx.beginPath(); hctx.moveTo(x + s * bw * 0.05, y + bw * 0.12); hctx.lineTo(x + s * bw * 0.55, y + bw * 0.78); hctx.lineTo(x + s * bw * 0.25, y + bw * 0.78); hctx.lineTo(x - s * bw * 0.05, y + bw * 0.12); hctx.fill(); }
      hctx.globalAlpha = 1;
    }

    function drawHead(it, time) {
      const f = it.f, BW = geo.BW, hs = clamp((it.g - 0.85) / 0.15);
      const R = f.r * BW * (0.3 + 0.7 * hs);
      if (R < 2) return;
      hctx.save();
      hctx.translate(it.hx, it.hy);
      // dark halo: keeps every flower's outline clear of its neighbours
      const hr = R * (f.type === 'tulip' ? 1.55 : 1.22);
      const halo = hctx.createRadialGradient(0, f.type === 'tulip' ? -R * 0.7 : 0, R * 0.3, 0, f.type === 'tulip' ? -R * 0.7 : 0, hr);
      halo.addColorStop(0, 'rgba(0,0,0,0.93)'); halo.addColorStop(1, 'rgba(0,0,0,0)');
      hctx.fillStyle = halo; hctx.beginPath(); hctx.arc(0, f.type === 'tulip' ? -R * 0.7 : 0, hr, 0, TAU); hctx.fill();
      const p = it.p, pal = PAL[f.pal];
      if (f.type === 'tulip') {
        hctx.rotate(Math.atan2(it.ux, -it.uy));
        tulip(R, p, pal);
      } else {
        hctx.rotate(f.tr + Math.sin(time * 0.6 + f.ph) * 0.05);
        hctx.scale(1, f.tilt);
        if (f.type === 'rose') rose(R, p, pal);
        else if (f.type === 'sunflower') sunflower(R, p);
        else if (f.type === 'daisy') daisy(R, p, pal);
        else if (f.type === 'lily') lily(R, p, pal);
        else hydrangea(R, p, pal);
      }
      hctx.restore();
    }

    function scene(T, time) {
      hctx.setTransform(hid.width / W, 0, 0, hid.height / H, 0, 0);
      hctx.fillStyle = '#000'; hctx.fillRect(0, 0, W, H);
      if (T < 0) return;
      hctx.lineJoin = 'round'; hctx.lineCap = 'round';
      const cx = W / 2, baseY = H * 0.985, BH = H * 0.86, BW = Math.min(W * 0.94, BH * 0.9);
      geo.BW = BW;
      const sway = clamp((T - 3) / 3);

      LEAVES.forEach((lv, i) => {
        const g = easeOut(clamp((T - 0.3 - i * 0.12) / 2.2));
        leaf(cx + (i - 3.5) * BW * 0.008, baseY - BH * 0.015, lv.a, lv.len * BH, g);
      });

      const items = FLOWERS.map((f, i) => {
        const g = easeInOut(clamp((T - 0.1 - i * 0.15) / 2.3));
        const p = easeInOut(clamp((T - (2.2 + i * 0.6)) / 3.4));
        const s = Math.sin(time * 0.9 + f.ph) * BW * 0.012 * sway;
        const sx = cx + f.x * BW * 0.05, sy = baseY;
        const hx = cx + f.x * BW * 0.5 + s, hy = baseY - f.y * BH + Math.cos(time * 0.7 + f.ph) * BH * 0.004 * sway;
        const qx = sx + (hx - sx) * 0.08, qy = hy + (sy - hy) * 0.5;
        let ux = hx - qx, uy = hy - qy; const m = Math.hypot(ux, uy) || 1; ux /= m; uy /= m;
        return { f, g, p, sx, sy, hx, hy, qx, qy, ux, uy };
      });

      hctx.strokeStyle = '#43dd68'; hctx.lineWidth = Math.max(3, BW * 0.018);
      for (const it of items) {
        if (it.g <= 0) continue;
        hctx.beginPath(); hctx.moveTo(it.sx, it.sy);
        for (let k = 1; k <= 16; k++) {
          const t = (k / 16) * it.g, u = 1 - t;
          hctx.lineTo(u * u * it.sx + 2 * u * t * it.qx + t * t * it.hx, u * u * it.sy + 2 * u * t * it.qy + t * t * it.hy);
        }
        hctx.stroke();
      }
      bow(cx, baseY - BH * 0.13, BW * 0.12, easeOut(clamp((T - 1.6) / 1.4)));

      items.sort((a, b) => a.hy - b.hy);
      for (const it of items) if (it.g > 0.85) drawHead(it, time);
    }

    // colour of a letter: keep the hue, make it vivid, and let brightness follow the picture
    function colorFor(r, g, b, lum) {
      const mx = Math.max(r, g, b) || 1, k = 255 / mx;
      let nr = r * k, ng = g * k, nb = b * k;
      const avg = (nr + ng + nb) / 3, sat = 1.25;
      nr = clamp(avg + (nr - avg) * sat, 0, 255); ng = clamp(avg + (ng - avg) * sat, 0, 255); nb = clamp(avg + (nb - avg) * sat, 0, 255);
      const br = 0.7 + 0.3 * Math.pow(lum, 0.8);
      nr += (255 - nr) * 0.18; ng += (255 - ng) * 0.18; nb += (255 - nb) * 0.18;
      const R = Math.round(nr * br) >> 4, G = Math.round(ng * br) >> 4, B = Math.round(nb * br) >> 4;
      const key = (R << 8) | (G << 4) | B;
      let c = colorCache.get(key);
      if (!c) { c = `rgb(${R * 17},${G * 17},${B * 17})`; colorCache.set(key, c); }
      return c;
    }

    function render(T, time) {
      scene(T, time);
      sctx.imageSmoothingEnabled = true; sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(hid, 0, 0, cols, rows);
      const d = sctx.getImageData(0, 0, cols, rows).data;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.font = `700 ${(cw * 1.95).toFixed(1)}px ui-monospace, Menlo, Consolas, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          if (Math.max(r, g, b) < 26 || lum < 0.06) continue;
          ctx.fillStyle = colorFor(r, g, b, lum);
          const ltr = WORD[(x + y * 4) % WORD.length];
          ctx.fillText(lum > 0.62 ? ltr.toUpperCase() : ltr, x * cw + cw / 2, y * ch + ch / 2);
        }
      }
    }

    function frame(now) {
      requestAnimationFrame(frame);
      if (now - lastDraw < 30) return;
      lastDraw = now;
      if (startAt == null) startAt = now + 500; // a short pause, then the bouquet starts to grow
      const T = (now - startAt) / 1000;
      render(T, now / 1000);
      if (T > 6.5) $('card').classList.add('show');
    }

    resize();
    window.addEventListener('resize', resize);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    requestAnimationFrame(frame);
  }

  /* ======================================================================
     Starry sky
     ====================================================================== */
  function createStars(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, stars = [];
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.3, ph: Math.random() * TAU, sp: 0.4 + Math.random() * 1.4 }));
    }
    size(); window.addEventListener('resize', size);
    (function loop(now) {
      requestAnimationFrame(loop);
      ctx.clearRect(0, 0, W, H);
      const t = now / 1000;
      for (const s of stars) {
        ctx.fillStyle = `rgba(255,244,230,${(0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))).toFixed(2)})`;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
    })(0);
  }

  /* ======================================================================
     Music: a soft music-box tune made live with the Web Audio API
     ====================================================================== */
  function createMusic() {
    let ac = null, master = null, filter = null, delay = null, timer = 0, step = 0, nextT = 0, playing = false;
    const CHORDS = [[220.00, 261.63, 329.63, 440.00], [174.61, 220.00, 261.63, 349.23], [261.63, 329.63, 392.00, 523.25], [196.00, 246.94, 293.66, 392.00]];
    const BASS = [110.00, 87.31, 130.81, 98.00], PATTERN = [0, 1, 2, 3, 2, 3, 1, 2], STEP = 0.46;
    function tone(freq, t, dur, vel) {
      const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
      o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = freq; o2.frequency.value = freq * 2; g2.gain.value = 0.22;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(filter);
      o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    }
    function build() {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.0001; master.connect(ac.destination);
      filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2600;
      delay = ac.createDelay(1); delay.delayTime.value = STEP * 0.75;
      const fb = ac.createGain(); fb.gain.value = 0.34;
      filter.connect(master); filter.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(master);
    }
    function pump() {
      while (nextT < ac.currentTime + 0.35) {
        const chord = Math.floor(step / 8) % 4, i = step % 8;
        if (i === 0) tone(BASS[chord], nextT, STEP * 7, 0.22);
        tone(CHORDS[chord][PATTERN[i]], nextT, STEP * 3.2, i % 2 ? 0.1 : 0.14);
        nextT += STEP; step++;
      }
    }
    return {
      get playing() { return playing; },
      start() {
        try {
          if (!ac) build();
          if (ac.state === 'suspended') ac.resume();
          if (!timer) { nextT = ac.currentTime + 0.1; timer = setInterval(pump, 120); }
          master.gain.cancelScheduledValues(ac.currentTime);
          master.gain.setTargetAtTime(0.8, ac.currentTime, 1.2);
          playing = true;
        } catch (e) { /* no audio here: the flowers still bloom */ }
      },
      stop() { if (ac) master.gain.setTargetAtTime(0.0001, ac.currentTime, 0.2); playing = false; },
      pause() { if (ac && playing) ac.suspend(); },
      resume() { if (ac && playing) ac.resume(); }
    };
  }

  /* ---------- go ---------- */
  createStars($('stars'));
  createBouquet($('stage'));

  const music = createMusic(), btn = $('music');
  let chosen = false; // true once she has pressed the button herself
  function setBtn() { btn.textContent = music.playing ? '♪ Music on' : '♪ Play music'; btn.setAttribute('aria-pressed', String(music.playing)); }
  btn.addEventListener('click', (e) => { e.stopPropagation(); chosen = true; if (music.playing) music.stop(); else music.start(); setBtn(); });
  // browsers only allow sound after a tap, so the first tap anywhere starts the music
  const first = () => { if (!chosen && !music.playing) { music.start(); setBtn(); } removeEventListener('pointerdown', first); };
  addEventListener('pointerdown', first);
  document.addEventListener('visibilitychange', () => (document.hidden ? music.pause() : music.resume()));
})();
