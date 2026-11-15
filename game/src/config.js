// VOIDBLOOM tuning: every number the game balances on lives here.
// The game runs on a fixed 1280x800 canvas, keyboard + mouse.

export const CONFIG = {
  W: 1280,
  H: 800,
  TOTAL_WAVES: 10,

  PLAYER: {
    radius: 14,
    accel: 1500,
    maxSpeed: 360,
    drag: 0.90,
    fireRate: 7,
    bulletSpeed: 660,
    bulletRadius: 5,
    bulletDamage: 1,
    lives: 3,
    invulnSeconds: 2.0,
    respawnSeconds: 1.2,
  },

  ENEMIES: {
    thorn:    { radius: 16, hp: 1, speed: 95,  score: 100, color: '#ff4d6d' },
    spitter:  { radius: 18, hp: 2, speed: 70,  score: 150, color: '#c77dff' },
    splitter: { radius: 24, hp: 3, speed: 55,  score: 200, color: '#ff9e00' },
    orbiter:  { radius: 13, hp: 1, speed: 165, score: 120, color: '#4cc9f0' },
    boss:     { radius: 52, hp: 46, speed: 42,  score: 2000, color: '#ff2e63' },
  },

  // Enemy bullets (spitters and the boss fire these).
  EBULLET: { radius: 6, speed: 210 },

  POWERUPS: {
    dropChance: 0.12,
    heartChance: 0.05,
    spreadSeconds: 12,
    rapidSeconds: 10,
    shieldSeconds: 15,
  },

  COMBO: {
    windowSeconds: 2.5,
    maxMultiplier: 8,
  },

  WAVES: {
    breatherSeconds: 3.0,
    clearBonus: 250,
  },

  COLORS: {
    background: '#070312',
    nebulaA: 'rgba(88, 28, 135, 0.55)',
    nebulaB: 'rgba(8, 145, 178, 0.40)',
    nebulaC: 'rgba(190, 24, 93, 0.35)',
    player: '#22d3ee',
    playerGlow: 'rgba(34, 211, 238, 0.55)',
    bullet: '#a5f3fc',
    petal: '#fbbf24',
    text: '#f1f5f9',
    dimText: '#94a3b8',
    danger: '#fb7185',
    ok: '#34d399',
  },

  // How the arena shooter is won and lost.
  WIN: { wavesToClear: 10 },
};

// Wave composition: which enemies appear in each wave.
// Boss waves (3, 6, 10) add one Thornheart; wave 10 is the final boss.
export function waveComposition(wave) {
  const comp = [];
  const thorns = 5 + wave * 2;
  const spitters = wave >= 2 ? 1 + Math.floor(wave / 2) : 0;
  const splitters = wave >= 3 ? Math.floor((wave - 1) / 2) : 0;
  const orbiters = wave >= 4 ? 2 + Math.floor(wave / 2) : 0;
  for (let i = 0; i < thorns; i++) comp.push('thorn');
  for (let i = 0; i < spitters; i++) comp.push('spitter');
  for (let i = 0; i < splitters; i++) comp.push('splitter');
  for (let i = 0; i < orbiters; i++) comp.push('orbiter');
  if (wave === 3 || wave === 6 || wave === 10) comp.push('boss');
  return comp;
}

// Enemy health grows slightly with the wave so later waves stay tense.
export function enemyHp(type, wave) {
  const base = CONFIG.ENEMIES[type].hp;
  if (type === 'boss') return base + (wave - 1) * 4;
  return base + Math.floor((wave - 1) / 4);
}
