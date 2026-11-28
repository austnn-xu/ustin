#!/usr/bin/env python3
"""Generate the website's two procedural textures into site/img/.

  cloud-*.svg   Halftone clouds: a printer's dot screen whose dots grow toward the middle of the cloud, the way a
                newspaper prints a soft shape. Deterministic (seeded), so re-running gives the same clouds.
  topo.svg      A tileable topographic texture for the paper sections: contour lines of a periodic field, so the
                tile repeats without a seam.

Run: python3 site/tools/make-art.py
"""
import math, os, random

OUT = os.path.join(os.path.dirname(__file__), '..', 'img')

def cloud(name, w, h, blobs, seed, step=11.0, rmax=4.6):
    rnd = random.Random(seed)
    def field(x, y):
        return sum(a * math.exp(-(((x - cx) ** 2) / (2 * sx * sx) + ((y - cy) ** 2) / (2 * sy * sy))) for cx, cy, sx, sy, a in blobs)
    dots = []
    row = 0
    y = step / 2
    while y < h:
        x = (step / 2) + (step / 2 if row % 2 else 0)
        while x < w:
            f = field(x, y)
            r = min(rmax, max(0.0, (f - 0.18) * 7.5))
            r *= 0.92 + rnd.random() * 0.16  # a little ink spread, like a real screen
            if r > 0.55:
                dots.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}"/>')
            x += step
        y += step * 0.866
        row += 1
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><g fill="#fff">{"".join(dots)}</g></svg>'
    open(os.path.join(OUT, name), 'w').write(svg)
    return len(dots)

# Each blob: centre x, centre y, spread x, spread y, strength. Flat-bottomed, lumpy-topped cumulus.
print(cloud('cloud-a.svg', 520, 230, [(150, 150, 80, 55, 1.0), (260, 110, 95, 75, 1.15), (370, 145, 85, 55, 1.0), (215, 175, 140, 35, 0.8), (320, 175, 140, 35, 0.8)], 1))
print(cloud('cloud-b.svg', 380, 190, [(120, 120, 70, 48, 1.0), (210, 95, 75, 60, 1.1), (275, 130, 60, 42, 0.9), (190, 145, 120, 30, 0.8)], 2))
print(cloud('cloud-c.svg', 260, 140, [(95, 85, 52, 36, 1.0), (160, 75, 55, 44, 1.05), (130, 105, 90, 24, 0.8)], 3))

def topo(name, size=720, step=8, levels=(-1.1, -0.65, -0.2, 0.25, 0.7, 1.15)):
    T = size
    waves = [(1, 0, 0.0, 0.9), (0, 1, 1.3, 0.8), (1, 1, 2.1, 0.6), (2, -1, 0.7, 0.45), (-1, 2, 2.9, 0.4), (3, 1, 1.9, 0.25)]
    def f(x, y):
        return sum(a * math.sin(2 * math.pi * (k * x + l * y) / T + p) for k, l, p, a in waves)
    n = T // step
    g = [[f(i * step, j * step) for i in range(n + 1)] for j in range(n + 1)]
    segs = []
    for lv in levels:
        for j in range(n):
            for i in range(n):
                a, b, c, d = g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]
                pts = []
                def edge(v0, v1, x0, y0, x1, y1):
                    if (v0 < lv) != (v1 < lv):
                        t = (lv - v0) / (v1 - v0)
                        pts.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
                x, y = i * step, j * step
                edge(a, b, x, y, x + step, y)
                edge(b, c, x + step, y, x + step, y + step)
                edge(c, d, x + step, y + step, x, y + step)
                edge(d, a, x, y + step, x, y)
                for k in range(0, len(pts) - 1, 2):
                    (x0, y0), (x1, y1) = pts[k], pts[k + 1]
                    segs.append(f'M{x0:.0f} {y0:.0f}L{x1:.0f} {y1:.0f}')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {T} {T}" width="{T}" height="{T}">'
           f'<path d="{"".join(segs)}" fill="none" stroke="#000" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></svg>')
    open(os.path.join(OUT, name), 'w').write(svg)
    return len(segs)

print(topo('topo.svg'))
