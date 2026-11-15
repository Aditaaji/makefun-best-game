// Seeded randomness: the same seed replays the same garden.
// Used for wave spawns and for the deterministic screenshot scenes.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  constructor(seed) {
    this.next = mulberry32(seed);
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }

  chance(p) {
    return this.next() < p;
  }

  angle() {
    return this.next() * Math.PI * 2;
  }

  // A point just outside the arena, for spawning enemies off screen.
  edgePoint(margin, w, h) {
    const side = this.int(0, 3);
    if (side === 0) return { x: this.range(0, w), y: -margin };
    if (side === 1) return { x: w + margin, y: this.range(0, h) };
    if (side === 2) return { x: this.range(0, w), y: h + margin };
    return { x: -margin, y: this.range(0, h) };
  }
}
