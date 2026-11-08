import { CornerMode } from './CornerMode';
import { CornerName } from './CornerName';

import type { Point, Quad } from '../types';

const MIN_SIDE = 0.05;
const CORNER_COUNT = 4;

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function insetQuad(inset: number): Quad {
  const far = 1 - inset;
  return {
    topLeft: { x: inset, y: inset },
    topRight: { x: far, y: inset },
    bottomRight: { x: far, y: far },
    bottomLeft: { x: inset, y: far },
  };
}

export function isConvex(quad: Quad): boolean {
  const points = [quad.topLeft, quad.topRight, quad.bottomRight, quad.bottomLeft];
  const signs = points.map((point, index) => {
    const next = points[(index + 1) % CORNER_COUNT] as Point;
    const after = points[(index + 2) % CORNER_COUNT] as Point;
    return Math.sign((next.x - point.x) * (after.y - next.y) - (next.y - point.y) * (after.x - next.x));
  });
  return signs.every((sign) => sign > 0) || signs.every((sign) => sign < 0);
}

export function quadArea(quad: Quad): number {
  const points = [quad.topLeft, quad.topRight, quad.bottomRight, quad.bottomLeft];
  const doubled = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % CORNER_COUNT] as Point;
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  return Math.abs(doubled) / 2;
}

function movedRectangle(quad: Quad, corner: CornerName, target: Point): Quad {
  const onLeft = corner === CornerName.TopLeft || corner === CornerName.BottomLeft;
  const onTop = corner === CornerName.TopLeft || corner === CornerName.TopRight;
  const rightEdge = Math.max(quad.topRight.x, quad.bottomRight.x);
  const leftEdge = Math.min(quad.topLeft.x, quad.bottomLeft.x);
  const bottomEdge = Math.max(quad.bottomLeft.y, quad.bottomRight.y);
  const topEdge = Math.min(quad.topLeft.y, quad.topRight.y);
  const left = onLeft ? Math.min(target.x, rightEdge - MIN_SIDE) : leftEdge;
  const right = onLeft ? rightEdge : Math.max(target.x, leftEdge + MIN_SIDE);
  const top = onTop ? Math.min(target.y, bottomEdge - MIN_SIDE) : topEdge;
  const bottom = onTop ? bottomEdge : Math.max(target.y, topEdge + MIN_SIDE);
  return {
    topLeft: { x: left, y: top },
    topRight: { x: right, y: top },
    bottomRight: { x: right, y: bottom },
    bottomLeft: { x: left, y: bottom },
  };
}

export function moveCorner(quad: Quad, corner: CornerName, target: Point, mode: CornerMode): Quad {
  const bounded = { x: clampUnit(target.x), y: clampUnit(target.y) };
  if (mode === CornerMode.Rectangle) return movedRectangle(quad, corner, bounded);
  const moved: Quad = { ...quad, [corner]: bounded };
  return isConvex(moved) ? moved : quad;
}

export function rotateQuadClockwise(quad: Quad): Quad {
  const turned = (point: Point): Point => ({ x: 1 - point.y, y: point.x });
  return {
    topLeft: turned(quad.bottomLeft),
    topRight: turned(quad.topLeft),
    bottomRight: turned(quad.topRight),
    bottomLeft: turned(quad.bottomRight),
  };
}
