// Fixed late-afternoon and night skies over Lahore.

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
// With `time` (seconds), a few lit windows flicker: a TV in one, a lamp dimming in others.
export function drawSky(g: CanvasRenderingContext2D, w: number, h: number, theme: "light" | "dark", time?: number) {
  const night = theme === "dark" ? 1 : 0;
  const low = night ? "#1a1220" : "#edc48c";
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, night ? "#06070c" : "#91a9b6");
  grad.addColorStop(1, low);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // Same stars and skyline every time; only the light changes.
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let s = 0; s < 80; s++) {
    const x = rnd() * w, y = rnd() * h * 0.55, a = rnd() * 0.8 * night;
    g.fillStyle = `rgba(236,230,220,${a})`;
    g.fillRect(x, y, 1.5, 1.5);
  }
  if (!night) {
    const arc = 0.96;
    g.fillStyle = "#edb55e"; g.shadowColor = "#f5bb63"; g.shadowBlur = 28;
    g.beginPath();
    g.arc(w * (0.1 + arc * 0.8), h * (0.62 - Math.sin(arc * Math.PI) * 0.45), 14, 0, Math.PI * 2);
    g.fill(); g.shadowBlur = 0;
  } else {
    g.fillStyle = "#e8dcc4";
    g.beginPath();
    g.arc(w * 0.75, h * 0.2, 13, 0, Math.PI * 2);
    g.fill();
  }

  // Lahore in three layers, hazier with distance: Minar-e-Pakistan and a mosque far off, then blocks,
  // then the flat roofs next door with their water tanks and antennas. Only the bottom ~18% sits below the sill.
  const lerp = (a: number[], b: number[], k: number) => a.map((v, c) => v + (b[c] - v) * k);
  const horizon = rgb(low), dark = lerp(rgb("#3d3a36"), rgb("#0b0a09"), night);
  const tone = (k: number) => `rgb(${lerp(horizon, dark, k).map(Math.round).join(",")})`;
  // The landmarks are floodlit after dark, so the far layer warms instead of vanishing.
  const far = `rgb(${lerp(lerp(horizon, dark, 0.45), rgb("#6e5642"), night * 0.5).map(Math.round).join(",")})`, mid = tone(0.72), near = tone(1);
  // City glow low in the sky after dark.
  const glow = g.createLinearGradient(0, h * 0.55, 0, h);
  glow.addColorStop(0, "rgba(240,140,80,0)");
  glow.addColorStop(1, `rgba(240,140,80,${0.2 * night})`);
  g.fillStyle = glow;
  g.fillRect(0, h * 0.55, w, h * 0.45);

  const dome = (x: number, y: number, r: number) => {
    g.beginPath(); g.moveTo(x - r, y); g.bezierCurveTo(x - r, y - r * 1.25, x - r * 0.2, y - r * 1.3, x, y - r * 1.75); g.bezierCurveTo(x + r * 0.2, y - r * 1.3, x + r, y - r * 1.25, x + r, y); g.fill();
  };
  g.fillStyle = far;
  // Minar-e-Pakistan: stepped platform, tapering shaft, gallery, small dome and spire.
  // Its base opens like petals, so the shaft flares out where it meets the platform.
  const mx = w * 0.38, base = h * 0.72, neck = h * 0.5;
  g.fillRect(mx - 34, base - 4, 68, 4); g.fillRect(mx - 26, base - 8, 52, 4);
  g.beginPath(); g.moveTo(mx - 22, base - 8); g.quadraticCurveTo(mx - 7, base - 14, mx - 5.5, base - 34); g.lineTo(mx - 3, neck); g.lineTo(mx + 3, neck);
  g.lineTo(mx + 5.5, base - 34); g.quadraticCurveTo(mx + 7, base - 14, mx + 22, base - 8); g.fill();
  g.fillRect(mx - 6, neck + 8, 12, 2.5); g.fillRect(mx - 5.5, neck - 3, 11, 3);
  dome(mx, neck - 3, 5.5);
  g.fillRect(mx - 0.5, neck - 17, 1, 6);
  // A mosque: prayer hall with three domes and a minaret at each corner.
  const qx = w * 0.7, qy = h * 0.7;
  g.fillRect(qx - 46, qy - 18, 92, 22);
  dome(qx, qy - 18, 15); dome(qx - 28, qy - 18, 9); dome(qx + 28, qy - 18, 9);
  for (const dx of [-54, -46, 46, 54]) {
    const top = qy - (Math.abs(dx) > 50 ? 62 : 48);
    g.fillRect(qx + dx - 2.5, top, 5, qy - top + 4); g.fillRect(qx + dx - 3.5, top + 10, 7, 2);
    dome(qx + dx, top, 3.5);
  }

  let n = 0;
  const windows = (x: number, top: number, bw: number, bottom: number, size: number) => {
    for (let yy = top + 6; yy < bottom - 4; yy += size * 2.2) {
      for (let xx = x + 4; xx < x + bw - 4; xx += size * 1.8) {
        const lit = rnd() < 0.22 * (0.25 + night * 0.75), warm = rnd() < 0.5;
        if (!lit) continue;
        n += 1;
        const tv = n % 12 === 1, flickers = n % 6 === 1;
        g.fillStyle = night > 0.3 ? (tv ? "#a9b8d6" : warm ? "#f0a050" : "#e0763a") : "#5a564f";
        // Chosen by index, not by rnd(), so the skyline stays the same on every redraw.
        if (time !== undefined && night > 0.5 && flickers) g.globalAlpha = tv ? 0.75 + 0.25 * Math.sin(time * 7.3 + n) * Math.sin(time * 2.9 + n * 1.7) : 0.88 + 0.12 * Math.sin(time * 0.8 + n);
        g.fillRect(xx, yy, size, size * 1.25);
        g.globalAlpha = 1;
      }
    }
  };
  // Middle distance: plain blocks, some with a stair tower.
  for (let x = -10; x < w; ) {
    const bw = 22 + rnd() * 30, top = h * 0.63 + rnd() * h * 0.1;
    g.fillStyle = mid;
    g.fillRect(x, top, bw, h - top);
    if (rnd() < 0.35) g.fillRect(x + bw * 0.6, top - 7, 9, 7);
    windows(x, top, bw, h, 2.4);
    x += bw + 1 + rnd() * 6;
  }
  // Next door: low flat roofs with parapets, water tanks on legs, antennas.
  for (let x = -6; x < w; ) {
    const bw = 34 + rnd() * 40, top = h * 0.73 + rnd() * h * 0.06;
    g.fillStyle = near;
    g.fillRect(x, top, bw, h - top);
    g.fillRect(x - 1, top - 2, bw + 2, 2);
    const kit = rnd();
    if (kit < 0.45) { const tx = x + 6 + rnd() * (bw - 20); g.fillRect(tx, top - 13, 12, 8); g.fillRect(tx + 1, top - 5, 1.5, 5); g.fillRect(tx + 9.5, top - 5, 1.5, 5); }
    if (kit > 0.3) {
      const ax = x + 4 + rnd() * (bw - 8), ah = 10 + rnd() * 12;
      g.fillRect(ax, top - ah, 1, ah); g.fillRect(ax - 4, top - ah + 3, 9, 1); g.fillRect(ax - 2.5, top - ah + 6, 6, 1);
    }
    windows(x, top + 4, bw, h, 3);
    x += bw + 2;
  }
}
