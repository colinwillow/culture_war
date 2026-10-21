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
      pike: { name: 'Pitchfork Farmers', n: 5, hp: 65, dmg: 9, range: 1.2, speed: 3.2, cost: 100, build: 10, cp: 5 },
      melee: { name: 'Bar Brawlers', n: 5, hp: 90, dmg: 10, range: 1.2, speed: 3.2, cost: 120, build: 12, cp: 5 },
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
      pike: { name: 'Sign Wavers', n: 8, hp: 30, dmg: 4, range: 1.2, speed: 4, cost: 90, build: 8, cp: 5 },
      melee: { name: 'Picket Line', n: 8, hp: 35, dmg: 5, range: 1.2, speed: 4, cost: 100, build: 9, cp: 5 },
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
    traits: { buildMul: 2, bldHp: 1.3, selfRepair: 4 }, // selfRepair: hp/s on finished buildings with no enemy close
    bldNames: { hq: 'Site Office', depot: 'Tool Shed', barracks: 'Union Hall', tower: 'Crane Tower' },
    units: {
      worker: { name: 'Apprentice', n: 1, hp: 55, dmg: 3, range: 1, speed: 4.5, cost: 55, build: 7, cp: 1 },
      pike: { name: 'Nail-Gunners', n: 5, hp: 55, dmg: 7, range: 1.2, speed: 3, cost: 95, build: 9, cp: 5 },
      melee: { name: 'Wrecking Crew', n: 5, hp: 85, dmg: 9, range: 1.2, speed: 3, cost: 112, build: 10, cp: 5 },
      ranged: { name: 'Surveyors', n: 5, hp: 40, dmg: 11, range: 8, speed: 3, cost: 122, build: 12, cp: 5 },
      cav: { name: 'Forklift', n: 1, hp: 450, dmg: 28, range: 1.4, speed: 6, cost: 280, build: 20, cp: 10, area: true, vehicle: true },
      siege: { name: 'Excavator', n: 1, hp: 260, dmg: 55, range: 3, speed: 2, cost: 330, build: 25, cp: 10, area: true, vehicle: true },
      hero: { name: 'The Foreman', n: 1, hp: 650, dmg: 20, range: 1.4, speed: 5, cost: 750, build: 40, cp: 15 },
    },
    powers: [
      { id: 'cones', name: 'Road Closed', cost: 40, target: true, icon: 'cone' },
      { id: 'wreck', name: 'Wrecking Ball', cost: 100, target: true, icon: 'ball' },
    ],
  },
  // Old Money (Elite): tiny squads of 3, expensive, each member worth two of anyone else's.
  om: {
    name: 'Old Money',
    traits: { cash: 1.2, inc: 1.4 }, // trust fund: starts with 20% more cash and 40% more passive income
    bldNames: { hq: 'The Mansion', depot: 'Bank Vault', barracks: 'Country Club', tower: 'Guard Booth' },
    units: {
      worker: { name: 'Butler', n: 1, hp: 70, dmg: 3, range: 1, speed: 4.5, cost: 70, build: 8, cp: 1 },
      pike: { name: 'Polo Team', n: 3, hp: 145, dmg: 16, range: 1.4, speed: 3.2, cost: 180, build: 13, cp: 3 },
      melee: { name: 'Security Detail', n: 3, hp: 180, dmg: 18, range: 1.2, speed: 3.2, cost: 200, build: 14, cp: 3 },
      ranged: { name: 'Skeet Shooters', n: 3, hp: 100, dmg: 24, range: 9, speed: 3.2, cost: 210, build: 15, cp: 3 },
      cav: { name: 'Golf Cart', n: 1, hp: 420, dmg: 26, range: 1.4, speed: 7.5, cost: 320, build: 22, cp: 10, area: true, vehicle: true },
      siege: { name: 'Armoured Limo', n: 1, hp: 550, dmg: 50, range: 2.5, speed: 2.4, cost: 380, build: 28, cp: 10, area: true, vehicle: true },
      hero: { name: 'The Tycoon', n: 1, hp: 520, dmg: 22, range: 1.4, speed: 5, cost: 850, build: 45, cp: 15 },
    },
    powers: [
      { id: 'takeover', name: 'Hostile Takeover', cost: 70, target: true, icon: 'coin' },
      { id: 'jet', name: 'Private Jet', cost: 110, target: true, icon: 'plane' },
    ],
  },
  // Street Crew (Rush): cheap, fast, fragile. Hype - their power meter fills 25% faster.
  sc: {
    name: 'Street Crew',
    traits: { hype: 1.25 },
    bldNames: { hq: 'Record Shop', depot: 'Sneaker Store', barracks: 'Rec Centre', tower: 'Speaker Stack' },
    units: {
      worker: { name: 'Hustler', n: 1, hp: 50, dmg: 2, range: 1, speed: 5.5, cost: 55, build: 7, cp: 1 },
      pike: { name: 'Sneakerheads', n: 6, hp: 48, dmg: 6, range: 1.2, speed: 4.6, cost: 90, build: 8, cp: 5 },
      melee: { name: 'Breakdancers', n: 6, hp: 52, dmg: 7, range: 1.2, speed: 4.6, cost: 100, build: 9, cp: 5 },
      ranged: { name: 'Boombox Crew', n: 4, hp: 40, dmg: 9, range: 8, speed: 4.4, cost: 120, build: 10, cp: 5 },
      cav: { name: 'Lowrider', n: 1, hp: 420, dmg: 24, range: 1.4, speed: 8.5, cost: 260, build: 18, cp: 10, area: true, vehicle: true },
      siege: { name: 'Graffiti Tagger', n: 1, hp: 180, dmg: 45, range: 6, speed: 4, cost: 280, build: 22, cp: 10 },
      hero: { name: 'The DJ', n: 1, hp: 480, dmg: 16, range: 6, speed: 5.5, cost: 700, build: 38, cp: 15 },
    },
    powers: [
      { id: 'blockparty', name: 'Block Party', cost: 50, target: false, icon: 'music' },
      { id: 'mixtape', name: 'Mixtape Drop', cost: 90, target: true, icon: 'disc' },
    ],
  },
  // Nerds (Tech): fragile up close, deadly at range; their towers are souped-up (+30% tower damage and range).
  nd: {
    name: 'Nerds',
    traits: { towerMul: 1.3 },
    bldNames: { hq: 'Game Shop', depot: 'Server Rack', barracks: 'LAN Cafe', tower: 'Antenna Tower' },
    units: {
      worker: { name: 'Tech Support', n: 1, hp: 50, dmg: 2, range: 1, speed: 4.8, cost: 60, build: 7, cp: 1 },
      pike: { name: 'LARPers', n: 5, hp: 68, dmg: 7, range: 1.4, speed: 3.6, cost: 95, build: 9, cp: 5 },
      melee: { name: 'Cosplay Knights', n: 5, hp: 88, dmg: 9, range: 1.2, speed: 3.4, cost: 115, build: 10, cp: 5 },
      ranged: { name: 'Drone Pilots', n: 4, hp: 42, dmg: 13, range: 10, speed: 3.6, cost: 130, build: 12, cp: 5 },
      cav: { name: 'Segway Patrol', n: 1, hp: 420, dmg: 22, range: 1.4, speed: 8, cost: 260, build: 18, cp: 10, area: true, vehicle: true },
      siege: { name: 'Mech Suit', n: 1, hp: 500, dmg: 50, range: 2.5, speed: 2.6, cost: 340, build: 26, cp: 10, area: true, vehicle: true },
      hero: { name: 'The Streamer', n: 1, hp: 500, dmg: 18, range: 7, speed: 5, cost: 720, build: 40, cp: 15 },
    },
    powers: [
      { id: 'wifi', name: 'Wi-Fi Outage', cost: 60, target: true, icon: 'wifi' },
      { id: 'patch', name: 'Patch Notes', cost: 90, target: false, icon: 'patch' },
    ],
  },
};
