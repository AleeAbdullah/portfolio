// The window's sky, drawn for the current hour in Lahore.

// [hour, top colour, horizon colour], interpolated between neighbours.
const keys: [number, string, string][] = [
  [0, "#06070c", "#1a1220"],
  [5, "#0b0d18", "#3a1d12"],
  [6.5, "#3b4a6b", "#f0a050"],
  [8, "#6f9fcf", "#d8c8b0"],
  [16, "#6c9bcb", "#e6cfa8"],
  [18, "#3a3f63", "#f08a4b"],
  [19.5, "#10121f", "#3a1d12"],
  [24, "#06070c", "#1a1220"],
];

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [rgb(a), rgb(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
};

export function lahoreHour() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return get("hour") + get("minute") / 60;
}

// 1 at night, 0 in daylight, fading through dawn and dusk.
const nightness = (h: number) => (h < 5 || h > 19.5 ? 1 : h < 7 ? (7 - h) / 2 : h > 17.5 ? (h - 17.5) / 2 : 0);

export function drawSky(g: CanvasRenderingContext2D, w: number, h: number, hour: number) {
  const i = keys.findIndex(([k]) => k > hour);
  const [h0, top0, low0] = keys[i - 1], [h1, top1, low1] = keys[i];
  const t = (hour - h0) / (h1 - h0);
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, mix(top0, top1, t));
  grad.addColorStop(1, mix(low0, low1, t));
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // Same stars and skyline every time; only the light changes.
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const night = nightness(hour);
  for (let s = 0; s < 80; s++) {
    const x = rnd() * w, y = rnd() * h * 0.55, a = rnd() * 0.8 * night;
    g.fillStyle = `rgba(236,230,220,${a})`;
    g.fillRect(x, y, 1.5, 1.5);
  }
  if (hour > 6 && hour < 18.5) {
    const arc = (hour - 6) / 12.5;
    g.fillStyle = "#fff1d6";
    g.beginPath();
    g.arc(w * (0.1 + arc * 0.8), h * (0.62 - Math.sin(arc * Math.PI) * 0.45), 14, 0, Math.PI * 2);
    g.fill();
  } else {
    g.fillStyle = "#e8dcc4";
    g.beginPath();
    g.arc(w * 0.75, h * 0.2, 13, 0, Math.PI * 2);
    g.fill();
  }

  const building = mix("#3d3a36", "#0b0a09", night);
  let x = 0;
  while (x < w) {
    const bw = 18 + rnd() * 34, bh = 40 + rnd() * 90;
    g.fillStyle = building;
    g.fillRect(x, h - bh, bw, bh);
    for (let yy = h - bh + 8; yy < h - 6; yy += 9) {
      for (let xx = x + 4; xx < x + bw - 4; xx += 7) {
        const lit = rnd() < 0.22 * (0.25 + night * 0.75), warm = rnd() < 0.5;
        if (!lit) continue;
        g.fillStyle = night > 0.3 ? (warm ? "#f0a050" : "#e0763a") : "#5a564f";
        g.fillRect(xx, yy, 3, 4);
      }
    }
    x += bw + 2;
  }
}
