// Screenshot scenes: ?shot=start|play|end&seed=N builds a deterministic
// frame of the real game so the screenshots show the loop at its best.
// Normal play (no query) is untouched.

import { CONFIG } from './config.js';
import { createEnemy, createPickup, createParticle } from './entities.js';

export function parseShotParams() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  const seed = parseInt(q.get('seed') || '1', 10) || 1;
  const freeze = q.get('freeze') === '1';
  return { shot, seed, freeze };
}

// Runs the autopilot: the ship circles the arena and fires at the
// nearest enemy, so a play screenshot holds a genuine mid-fight frame.
function autopilot(game) {
  const p = game.player;
  const t = game.time;
  // Circle the center.
  const cx = CONFIG.W / 2 + Math.cos(t * 0.55) * 260;
  const cy = CONFIG.H / 2 + Math.sin(t * 0.55) * 190;
  const dx = cx - p.x;
  const dy = cy - p.y;
  const d = Math.hypot(dx, dy) || 1;
  p.vx += (dx / d) * CONFIG.PLAYER.accel * 0.016;
  p.vy += (dy / d) * CONFIG.PLAYER.accel * 0.016;
  // Aim at the nearest enemy.
  let best = null;
  let bestD = Infinity;
  for (const e of game.enemies) {
    const dd = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
    if (dd < bestD) { bestD = dd; best = e; }
  }
  if (best) {
    game.input.mouse.x = best.x;
    game.input.mouse.y = best.y;
    game.input.mouse.down = true;
  }
}

export function applyShotScene(game, params) {
  const { shot, seed, freeze } = params;
  game.rngSeed = seed;
  if (!shot) return { freeze: false };

  if (shot === 'start') {
    game.state = 'title';
    // A few drifting petals behind the title, for life.
    for (let i = 0; i < 8; i++) {
      const a = game.rng.angle();
      game.pickups.push(createPickup('petal', 200 + i * 110, 620 + Math.sin(a) * 30));
    }
    return { freeze };
  }

  if (shot === 'play') {
    game.state = 'playing';
    game.director.startWave(4);
    game.score = 5200;
    game.combo = 5;
    game.comboTimer = 2.0;
    game.kills = 34;
    // Spread + rapid already running and a nova charged, so the frame
    // shows the full kit: three bullet streams and the NOVA READY tag.
    game.powerups.spread = 12;
    game.powerups.rapid = 10;
    game.nova = 1;
    // Pre-seed a dense, varied fight, then let the autopilot run it
    // forward just long enough to fill the frame — not long enough to
    // clear it. Twelve enemies across six kinds, wave 4's queue still
    // trickling in behind them.
    const rng = game.rng;
    const kinds = ['thorn', 'thorn', 'spitter', 'splitter', 'orbiter', 'stinger'];
    for (let i = 0; i < 12; i++) {
      const at = rng.edgePoint(60, CONFIG.W, CONFIG.H);
      game.enemies.push(createEnemy(kinds[i % kinds.length], at.x, at.y, 4, rng));
    }
    game.pickups.push(createPickup('spread', 760, 300));
    game.pickups.push(createPickup('petal', 420, 520));
    game.pickups.push(createPickup('petal', 880, 560));
    const steps = 60 * 2.5;
    for (let i = 0; i < steps; i++) {
      autopilot(game);
      game.step(1 / 60);
    }
    game.input.mouse.down = false;
    return { freeze };
  }

  if (shot === 'boss') {
    // The peak moment: the Thornheart on wave 6, escorts around it,
    // its radial burst in flight, the boss bar on the HUD.
    game.state = 'playing';
    game.wave = 6;
    game.score = 9800;
    game.combo = 6;
    game.comboTimer = 2.0;
    game.kills = 58;
    game.lives = 2;
    game.powerups.spread = 12;
    game.nova = 1;
    const rng = game.rng;
    const boss = createEnemy('boss', 860, 300, 6, rng);
    boss.hp = Math.floor(boss.maxHp * 0.85);
    boss.burstTimer = 0.05;
    game.enemies.push(boss);
    game.boss = boss;
    const escorts = [
      ['thorn', 640, 180], ['thorn', 700, 470], ['thorn', 1020, 480],
      ['spitter', 1120, 220], ['stinger', 980, 620],
    ];
    for (const [type, x, y] of escorts) {
      game.enemies.push(createEnemy(type, x, y, 6, rng));
    }
    game.pickups.push(createPickup('heart', 420, 560));
    // A short autopilot run: the boss fires its radial burst, the ship
    // answers with a spread stream, orbs fill the air.
    const steps = 60 * 1.5;
    for (let i = 0; i < steps; i++) {
      autopilot(game);
      game.step(1 / 60);
    }
    game.input.mouse.down = false;
    return { freeze };
  }

  if (shot === 'end') {
    game.state = 'victory';
    game.wave = CONFIG.TOTAL_WAVES;
    game.score = 18450;
    game.kills = 132;
    game.stats.bestCombo = 8;
    game.stats.shots = 1240;
    game.stats.hits = 862;
    game.stats.endTime = 384;
    game.accuracy = Math.round((game.stats.hits / game.stats.shots) * 100); // 70%
    game.best = 18450;
    for (let i = 0; i < 40; i++) {
      game.particles.push(createParticle(
        CONFIG.W / 2 + (game.rng.next() - 0.5) * 700,
        CONFIG.H / 2 + (game.rng.next() - 0.5) * 420,
        ['#fbbf24', '#34d399', '#22d3ee', '#ff4d6d'][i % 4],
        40, 1.6, 3,
      ));
    }
    return { freeze };
  }

  return { freeze: false };
}
