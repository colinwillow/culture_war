// City map definition: pure data + height queries. Shared by sim (pathing, placement) and render.
// Map is 120 x 200 m, Y up. Player 0 base at z=+80, player 1 at z=-80.
// Everything is defined for z > 0 and mirrored through the centre (x,z) -> (-x,-z),
// so both sides get identical chokepoints (rotational symmetry).
import { hash, smooth } from '../util/math.js?v=74';

export const MAP = { w: 120, h: 200, cell: 2 };
MAP.cols = MAP.w / MAP.cell;
MAP.rows = MAP.h / MAP.cell;

// Sunken freeway across the middle. Only crossable at the three overpasses.
export const TRENCH = { half: 6, depth: 3 };
export const OVERPASSES = [[-41, -31], [-5, 5], [31, 41]];
export const AVENUES = [-36, 0, 36]; // north-south streets, 10 m wide
export const CROSS_STREETS = [18, 40]; // east-west streets (mirrored), 8 m wide
export const BASES = [{ x: 0, z: 80 }, { x: 0, z: -80 }];
export const HOME_Z = 56; // home zone (open lawn for building) runs from here to the map edge

/** kind: 'bld' (solid buildings), 'park' (open, trees), 'lot' (open parking lot) */
export const BLOCKS = [];
export const NODES = []; // businesses workers can work at: [x, z]
export const TREES = []; // {x, z, r}
export const PARKED = []; // parked cars {x, z, rot, c}

function addBlock(x0, x1, z0, z1, kind) {
  BLOCKS.push({ x0, x1, z0, z1, kind });
  BLOCKS.push({ x0: -x1, x1: -x0, z0: -z1, z1: -z0, kind });
}
function addNode(x, z) { NODES.push([x, z]); NODES.push([-x, -z]); }
function addTree(x, z) { TREES.push({ x, z, r: 1 }); TREES.push({ x: -x, z: -z, r: 1 }); }
function addCar(x, z, rot, i) {
  const c = [0xd64545, 0x3d6fd6, 0xe8e0cc, 0x2a2a2a, 0xf2b632, 0x5a8a5a][i % 6];
  PARKED.push({ x, z, rot, c });
  PARKED.push({ x: -x, z: -z, rot: rot + Math.PI, c });
}

// Row A: freeway frontage
addBlock(-60, -41, 8, 14, 'bld');
addBlock(-31, -5, 8, 14, 'bld');
addBlock(5, 31, 8, 14, 'lot');
addBlock(41, 60, 8, 14, 'bld');
// Row B: mid city. Alley through x 16..20.
addBlock(-60, -41, 22, 36, 'bld');
addBlock(-31, -5, 22, 36, 'park');
addBlock(5, 16, 22, 36, 'bld');
addBlock(20, 31, 22, 36, 'bld');
addBlock(41, 60, 22, 36, 'park');
// Row C: base wall. Openings at avenue x=0 and x=-36; avenue x=+36 is a dead end.
addBlock(-60, -41, 44, HOME_Z, 'bld');
addBlock(-31, -5, 44, HOME_Z, 'bld');
addBlock(5, 31, 44, HOME_Z, 'bld');
addBlock(31, 60, 44, HOME_Z, 'bld');

// Businesses: 2 safe at home, 3 contested in the city.
addNode(-24, 72);
addNode(24, 72);
addNode(-18, 29);
addNode(50, 29);
addNode(18, 11);

// Park trees around the edges, keeping clear of businesses.
for (const b of BLOCKS) {
  if (b.kind !== 'park' || b.z0 < 0) continue;
  for (let x = b.x0 + 2.5; x <= b.x1 - 2.5; x += 4.5)
    for (let z = b.z0 + 2.5; z <= b.z1 - 2.5; z += 4.5) {
      const edge = x < b.x0 + 4 || x > b.x1 - 4 || z < b.z0 + 4 || z > b.z1 - 4;
      if (!edge || hash(x * 7, z * 3) < 0.35) continue;
      if (NODES.some(([nx, nz]) => Math.hypot(nx - x, nz - z) < 6)) continue;
      addTree(x + (hash(x, z) - 0.5), z + (hash(z, x) - 0.5));
    }
}
// Home zone edge trees.
for (let z = 62; z <= 96; z += 6) { addTree(-56.5, z); addTree(56.5, z + 3); }
for (let x = -50; x <= 50; x += 9) if (Math.abs(x) > 8) addTree(x, 97);

// Parked cars along curbs (block movement a little, give streets texture).
let ci = 0;
for (const x of [-55, -47, -26, -14, 12, 24, 47, 55]) { addCar(x, 15.4, Math.PI / 2, ci++); }
for (const x of [-52, -20, 27, 52]) { addCar(x, 20.6, -Math.PI / 2, ci++); }
for (const x of [-50, -18, 18, 50]) { addCar(x, 37.4, Math.PI / 2, ci++); }
for (const z of [24, 31]) { addCar(-3.8, z, 0, ci++); addCar(39.8, z, Math.PI, ci++); }

// ---- Height queries ----
export function onOverpass(x) {
  for (const [a, b] of OVERPASSES) if (x >= a && x <= b) return true;
  return false;
}
/** Visual ground: the trench is cut everywhere (overpasses are separate meshes). */
export function groundH(x, z) {
  const az = Math.abs(z);
  if (az >= TRENCH.half) return 0;
  return -TRENCH.depth * smooth(TRENCH.half, TRENCH.half - 1.2, az);
}
/** Walkable surface height: overpass decks count as ground. */
export function walkH(x, z) {
  if (Math.abs(z) < TRENCH.half + 0.5 && onOverpass(x)) return 0;
  return groundH(x, z);
}
export function inRect(x, z, r, pad = 0) {
  return x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad;
}
