import { detectEdges, otsuThreshold } from './detectEdges';

import type { Point, Quad, Raster } from '../types';

const DOC_SIZE = 200;
const NEAR = 0.04;

function insidePolygon(point: Point, polygon: readonly Point[]): boolean {
  return polygon.every((from, index) => {
    const to = polygon[(index + 1) % polygon.length];
    return (to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x) >= 0;
  });
}

function photoOfPage(quad: Quad): Raster {
  const data = new Uint8ClampedArray(DOC_SIZE * DOC_SIZE * 4);
  const polygon = [quad.topLeft, quad.topRight, quad.bottomRight, quad.bottomLeft].map((p) => ({ x: p.x * DOC_SIZE, y: p.y * DOC_SIZE }));
  for (let y = 0; y < DOC_SIZE; y += 1) {
    for (let x = 0; x < DOC_SIZE; x += 1) {
      const level = insidePolygon({ x, y }, polygon) ? 230 : 40;
      data.set([level, level, level, 255], (y * DOC_SIZE + x) * 4);
    }
  }
  return { width: DOC_SIZE, height: DOC_SIZE, data };
}

describe('detectEdges', () => {
  it('with a light tilted page on a dark table, finds its four corners', () => {
    const page: Quad = {
      topLeft: { x: 0.2, y: 0.12 },
      topRight: { x: 0.82, y: 0.2 },
      bottomRight: { x: 0.76, y: 0.88 },
      bottomLeft: { x: 0.14, y: 0.8 },
    };

    const found = detectEdges(photoOfPage(page));

    expect(found).not.toBeNull();
    (['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const).forEach((corner) => {
      expect(Math.abs((found as Quad)[corner].x - page[corner].x)).toBeLessThan(NEAR);
      expect(Math.abs((found as Quad)[corner].y - page[corner].y)).toBeLessThan(NEAR);
    });
  });

  it('with a flat image, returns null', () => {
    const raster: Raster = { width: 50, height: 50, data: new Uint8ClampedArray(50 * 50 * 4).fill(120) };

    const found = detectEdges(raster);

    expect(found).toBeNull();
  });

  it('with only a small object, returns null rather than suggesting a tiny crop', () => {
    const tiny: Quad = { topLeft: { x: 0.4, y: 0.4 }, topRight: { x: 0.5, y: 0.4 }, bottomRight: { x: 0.5, y: 0.5 }, bottomLeft: { x: 0.4, y: 0.5 } };

    const found = detectEdges(photoOfPage(tiny));

    expect(found).toBeNull();
  });
});

describe('otsuThreshold', () => {
  it('with two clusters, splits between them', () => {
    const values = new Uint8ClampedArray([...Array<number>(50).fill(10), ...Array<number>(50).fill(200)]);

    const threshold = otsuThreshold(values);

    expect(threshold).toBeGreaterThanOrEqual(10);
    expect(threshold).toBeLessThan(200);
  });
});
