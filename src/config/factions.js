// All tunable game numbers live here. Balance changes should only touch this file.
// Units: metres, seconds, cash. Source of truth for the design is docs/design.md.

export const TICK = 0.05; // fixed sim step (20 Hz)
export const START_CASH = 600;
export const BUILD_RADIUS = 26; // new buildings must be this close to one you own
export const MAX_WORKERS = 8;
export const NODE_AMOUNT = 1500; // cash in each business before it closes
export const GATHER_T = 3; // seconds a worker works a shift
export const CARRY = 30; // cash carried per trip
export const BASE_INCOME = 10; // HQ trickle every 10 s
export const DEPOT_INCOME = 20; // extra trickle per depot every 10 s

// Counter loop: key beats value (2x damage).
export const COUNTER = { pike: 'cav', cav: 'ranged', ranged: 'melee', melee: 'pike' };
export const REQ = { pike: 1, melee: 1, ranged: 2, cav: 2, siege: 3 }; // barracks level needed
export const TRAIN_SLOTS = ['pike', 'melee', 'ranged', 'cav', 'siege'];
export const UPG = [0, 400, 800]; // barracks upgrade cost to reach level index+1
export const UPT = [0, 15, 20]; // upgrade time

export const BLD = {
  hq: { hp: 3000, r: 3.4 },
  depot: { hp: 600, r: 1.8, cost: 200, build: 10, max: 5 },
  barracks: { hp: 1200, r: 2.4, cost: 300, build: 15, max: 2 },
  tower: { hp: 800, r: 1.3, cost: 250, build: 12, max: 6, range: 11, dmg: 25 },
};
export const BUILD_KINDS = ['depot', 'barracks', 'tower'];

export const FACTIONS = {
  bw: {
    name: 'Backwoods',
    bldNames: { hq: 'Homestead', depot: 'Bait Shop', barracks: 'Barracks', tower: 'Deer Stand' },
    units: {
      worker: { name: 'Odd-Jobber', n: 1, hp: 60, dmg: 3, range: 1, speed: 4.5, cost: 60, build: 8, cp: 1 },
      pike: { name: 'Pitchfork Farmers', n: 5, hp: 60, dmg: 8, range: 1.2, speed: 3.2, cost: 100, build: 10, cp: 5 },
      melee: { name: 'Bar Brawlers', n: 5, hp: 80, dmg: 10, range: 1.2, speed: 3.2, cost: 120, build: 12, cp: 5 },
      ranged: { name: 'Shotgun Hunters', n: 5, hp: 45, dmg: 12, range: 8, speed: 3.2, cost: 140, build: 14, cp: 5 },
      cav: { name: 'Monster Truck', n: 1, hp: 500, dmg: 30, range: 1.4, speed: 7, cost: 300, build: 25, cp: 10, area: true, vehicle: true },
      siege: { name: 'Fireworks Launcher', n: 1, hp: 200, dmg: 60, range: 14, speed: 2.2, cost: 350, build: 30, cp: 10, area: true, vehicle: true },
      hero: { name: 'Bald Eagle', n: 1, hp: 600, dmg: 25, range: 1.4, speed: 8, cost: 800, build: 45, cp: 15, flies: true },
    },
    powers: [
      { id: 'mud', name: 'Mud Bog', cost: 40, target: true, icon: 'mud' },
      { id: 'fireworks', name: 'Fourth of July', cost: 100, target: true, icon: 'fireworks' },
    ],
  },
  ac: {
    name: 'Activists',
    bldNames: { hq: 'Community Center', depot: 'Crowdfund Booth', barracks: 'Organizing Hall', tower: 'Banner Tower' },
    units: {
      worker: { name: 'Gig Worker', n: 1, hp: 45, dmg: 2, range: 1, speed: 5, cost: 50, build: 7, cp: 1 },
      pike: { name: 'Sign Wavers', n: 8, hp: 30, dmg: 4, range: 1.2, speed: 4, cost: 80, build: 8, cp: 5 },
      melee: { name: 'Picket Line', n: 8, hp: 35, dmg: 5, range: 1.2, speed: 4, cost: 90, build: 9, cp: 5 },
      ranged: { name: 'Megaphone Crew', n: 5, hp: 25, dmg: 6, range: 9, speed: 4, cost: 120, build: 12, cp: 5 },
      cav: { name: 'Bike Collective', n: 6, hp: 40, dmg: 7, range: 1.2, speed: 8, cost: 180, build: 15, cp: 5 },
      siege: { name: 'Parade Puppet', n: 1, hp: 250, dmg: 40, range: 2, speed: 2.2, cost: 300, build: 28, cp: 10 },
      hero: { name: 'March Leader', n: 1, hp: 450, dmg: 12, range: 1.4, speed: 5, cost: 700, build: 40, cp: 15 },
    },
    powers: [
      { id: 'parade', name: 'Parade', cost: 40, target: false, icon: 'flag' },
      { id: 'pie', name: 'Pie in the Face', cost: 60, target: false, icon: 'pie' },
    ],
  },
  // Hard Hats (Turtle / builder): sturdy, a bit slow, builds twice as fast and its buildings are 30% tougher.
  hh: {
    name: 'Hard Hats',
    traits: { buildMul: 2, bldHp: 1.3 },
    bldNames: { hq: 'Site Office', depot: 'Tool Shed', barracks: 'Union Hall', tower: 'Crane Tower' },
    units: {
      worker: { name: 'Apprentice', n: 1, hp: 55, dmg: 3, range: 1, speed: 4.5, cost: 55, build: 7, cp: 1 },
      pike: { name: 'Nail-Gunners', n: 5, hp: 55, dmg: 7, range: 1.2, speed: 3, cost: 100, build: 9, cp: 5 },
      melee: { name: 'Wrecking Crew', n: 5, hp: 85, dmg: 9, range: 1.2, speed: 3, cost: 120, build: 10, cp: 5 },
      ranged: { name: 'Surveyors', n: 5, hp: 40, dmg: 11, range: 8, speed: 3, cost: 130, build: 12, cp: 5 },
      cav: { name: 'Forklift', n: 1, hp: 450, dmg: 28, range: 1.4, speed: 6, cost: 280, build: 20, cp: 10, area: true, vehicle: true },
      siege: { name: 'Excavator', n: 1, hp: 260, dmg: 55, range: 3, speed: 2, cost: 330, build: 25, cp: 10, area: true, vehicle: true },
      hero: { name: 'The Foreman', n: 1, hp: 650, dmg: 20, range: 1.4, speed: 5, cost: 750, build: 40, cp: 15 },
    },
    powers: [
      { id: 'cones', name: 'Road Closed', cost: 40, target: true, icon: 'shield' },
      { id: 'wreck', name: 'Wrecking Ball', cost: 100, target: true, icon: 'skull' },
    ],
  },
};
