import { CornerMode } from './CornerMode';
import { CornerName } from './CornerName';
import { insetQuad, isConvex, moveCorner, quadArea, rotateQuadClockwise } from './quad';

describe('moveCorner', () => {
  it('in rectangle mode, moving top left also moves the shared left and top edges', () => {
    const quad = insetQuad(0.1);

    const moved = moveCorner(quad, CornerName.TopLeft, { x: 0.2, y: 0.3 }, CornerMode.Rectangle);

    expect(moved.bottomLeft.x).toBe(0.2);
    expect(moved.topRight.y).toBe(0.3);
    expect(moved.bottomRight).toEqual(quad.bottomRight);
  });

  it('in rectangle mode, a corner dragged past its opposite stops at the minimum side', () => {
    const quad = insetQuad(0.1);

    const moved = moveCorner(quad, CornerName.TopLeft, { x: 0.95, y: 0.1 }, CornerMode.Rectangle);

    expect(moved.topLeft.x).toBeCloseTo(0.85);
  });

  it('in free mode, moves only the named corner', () => {
    const quad = insetQuad(0.1);

    const moved = moveCorner(quad, CornerName.TopRight, { x: 0.8, y: 0.05 }, CornerMode.Free);

    expect(moved.topRight).toEqual({ x: 0.8, y: 0.05 });
    expect(moved.topLeft).toEqual(quad.topLeft);
  });

  it('in free mode, a move that would fold the shape keeps the previous quad', () => {
    const quad = insetQuad(0.1);

    const moved = moveCorner(quad, CornerName.TopLeft, { x: 0.95, y: 0.95 }, CornerMode.Free);

    expect(moved).toBe(quad);
  });

  it('with a target outside the photo, clamps it to the photo edge', () => {
    const quad = insetQuad(0.1);

    const moved = moveCorner(quad, CornerName.BottomRight, { x: 1.4, y: 1.2 }, CornerMode.Free);

    expect(moved.bottomRight).toEqual({ x: 1, y: 1 });
  });
});

describe('rotateQuadClockwise', () => {
  it('with an off-centre rectangle, maps it to the same place on the turned photo', () => {
    const quad = moveCorner(insetQuad(0), CornerName.BottomRight, { x: 0.5, y: 1 }, CornerMode.Rectangle);

    const turned = rotateQuadClockwise(quad);

    expect(turned.topLeft).toEqual({ x: 0, y: 0 });
    expect(turned.bottomRight).toEqual({ x: 1, y: 0.5 });
  });
});

describe('quadArea', () => {
  it('with the half inset square, returns its area', () => {
    const quad = insetQuad(0.25);

    const area = quadArea(quad);

    expect(area).toBeCloseTo(0.25);
  });
});

describe('isConvex', () => {
  it('with a bow-tie shape, returns false', () => {
    const quad = { ...insetQuad(0.1), topLeft: { x: 0.9, y: 0.1 }, topRight: { x: 0.1, y: 0.1 } };

    const convex = isConvex(quad);

    expect(convex).toBe(false);
  });
});
