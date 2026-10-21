// Walkability grid + A* pathfinding. Hand-written, no physics/path library (project convention).
import { MAP, BLOCKS, TREES, PARKED, walkH } from './layout.js?v=88';

export const blocked = new Uint8Array(MAP.cols * MAP.rows); // >0 = blocked (counts, so buildings can add/remove)

export const cellOf = (x, z) => [Math.floor((x + MAP.w / 2) / MAP.cell), Math.floor((z + MAP.h / 2) / MAP.cell)];
export const cellCenter = (c, r) => [c * MAP.cell - MAP.w / 2 + MAP.cell / 2, r * MAP.cell - MAP.h / 2 + MAP.cell / 2];
export const inGrid = (c, r) => c >= 0 && r >= 0 && c < MAP.cols && r < MAP.rows;

export function isBlocked(x, z) {
  const [c, r] = cellOf(x, z);
  return !inGrid(c, r) || blocked[c + r * MAP.cols] > 0;
}
export function markCircle(x, z, r, v) {
  const [c0, r0] = cellOf(x - r, z - r), [c1, r1] = cellOf(x + r, z + r);
  for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) {
    if (!inGrid(c, rr)) continue;
    const [cx, cz] = cellCenter(c, rr);
    if (Math.hypot(cx - x, cz - z) < r + 0.6) blocked[c + rr * MAP.cols] = Math.max(0, blocked[c + rr * MAP.cols] + v);
  }
}
function markRect(b, pad, v) {
  const [c0, r0] = cellOf(b.x0 - pad, b.z0 - pad), [c1, r1] = cellOf(b.x1 + pad, b.z1 + pad);
  for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) {
    if (!inGrid(c, rr)) continue;
    const [cx, cz] = cellCenter(c, rr);
    if (cx > b.x0 - pad && cx < b.x1 + pad && cz > b.z0 - pad && cz < b.z1 + pad) blocked[c + rr * MAP.cols] += v;
  }
}

(function buildGrid() {
  for (let r = 0; r < MAP.rows; r++) for (let c = 0; c < MAP.cols; c++) {
    const [x, z] = cellCenter(c, r);
    if (walkH(x, z) < -0.5 || c === 0 || r === 0 || c === MAP.cols - 1 || r === MAP.rows - 1) blocked[c + r * MAP.cols] = 1;
  }
  for (const b of BLOCKS) if (b.kind === 'bld') markRect(b, -0.4, 1);
  for (const t of TREES) markCircle(t.x, t.z, 0.7, 1);
  for (const p of PARKED) markCircle(p.x, p.z, 0.9, 1);
})();

export function lineClear(ax, az, bx, bz) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.8);
  for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; if (isBlocked(ax + (bx - ax) * t, az + (bz - az) * t)) return false; }
  return true;
}
export function nearestFree(x, z) {
  if (!isBlocked(x, z)) return [x, z];
  const [c0, r0] = cellOf(x, z);
  for (let rad = 1; rad < 14; rad++)
    for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
      if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue;
      const c = c0 + dc, r = r0 + dr;
      if (inGrid(c, r) && !blocked[c + r * MAP.cols]) return cellCenter(c, r);
    }
  return [x, z];
}

const NB = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
const gScore = new Float32Array(MAP.cols * MAP.rows), cameFrom = new Int32Array(MAP.cols * MAP.rows), closed = new Uint8Array(MAP.cols * MAP.rows);

/** Returns a list of [x,z] waypoints from (x0,z0) to (x1,z1), string-pulled. */
export function findPath(x0, z0, x1, z1) {
  [x0, z0] = nearestFree(x0, z0);
  [x1, z1] = nearestFree(x1, z1);
  if (lineClear(x0, z0, x1, z1)) return [[x1, z1]];
  const [sc, sr] = cellOf(x0, z0), [gc, gr] = cellOf(x1, z1), start = sc + sr * MAP.cols, goal = gc + gr * MAP.cols;
  gScore.fill(1e9); closed.fill(0); cameFrom.fill(-1);
  const heap = [];
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const h = (i) => Math.hypot((i % MAP.cols) - gc, ((i / MAP.cols) | 0) - gr);
  gScore[start] = 0; push(h(start), start);
  let found = false, expanded = 0;
  while (heap.length && expanded < 9000) {
    const [, cur] = pop();
    if (closed[cur]) continue;
    closed[cur] = 1; expanded++;
    if (cur === goal) { found = true; break; }
    const c = cur % MAP.cols, r = (cur / MAP.cols) | 0;
    for (const [dc, dr, w] of NB) {
      const nc = c + dc, nr = r + dr;
      if (!inGrid(nc, nr)) continue;
      const ni = nc + nr * MAP.cols;
      if (blocked[ni] || closed[ni]) continue;
      if (dc && dr && (blocked[c + dc + r * MAP.cols] || blocked[c + (r + dr) * MAP.cols])) continue;
      const g = gScore[cur] + w;
      if (g < gScore[ni]) { gScore[ni] = g; cameFrom[ni] = cur; push(g + h(ni), ni); }
    }
  }
  if (!found) return [[x1, z1]];
  const cells = [];
  for (let i = goal; i !== -1 && i !== start; i = cameFrom[i]) cells.push(i);
  cells.reverse();
  const pts = cells.map((i) => cellCenter(i % MAP.cols, (i / MAP.cols) | 0));
  pts[pts.length - 1] = [x1, z1];
  const out = [];
  let ax = x0, az = z0, i = 0;
  while (i < pts.length) {
    let j = i;
    for (let k = pts.length - 1; k > i; k--) if (lineClear(ax, az, pts[k][0], pts[k][1])) { j = k; break; }
    out.push(pts[j]); ax = pts[j][0]; az = pts[j][1]; i = j + 1;
  }
  return out;
}
