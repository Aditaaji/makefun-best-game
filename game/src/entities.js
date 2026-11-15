// Entities: the player ship, bullets, five enemy kinds, particles,
// pickups and floating score text. Each update takes the game object,
// which carries the arrays, the score and the spawn helpers.

import { CONFIG, enemyHp } from './config.js';

export function createPlayer(x, y) {
  return {
    x, y, vx: 0, vy: 0,
    radius: CONFIG.PLAYER.radius,
    angle: -Math.PI / 2,
    fireTimer: 0,
    invuln: 0,
    alive: true,
    thrust: 0,
  };
}

export function createBullet(x, y, angle, speed, damage) {
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: CONFIG.PLAYER.bulletRadius,
    damage,
    life: 1.4,
  };
}

export function createEnemyBullet(x, y, angle) {
  const s = CONFIG.EBULLET.speed;
  return {
    x, y,
    vx: Math.cos(angle) * s,
    vy: Math.sin(angle) * s,
    radius: CONFIG.EBULLET.radius,
    life: 6,
  };
}

export function createEnemy(type, x, y, wave, rng) {
  const def = CONFIG.ENEMIES[type];
  const e = {
    type,
    x, y, vx: 0, vy: 0,
    radius: def.radius,
    hp: enemyHp(type, wave),
    maxHp: enemyHp(type, wave),
    speed: def.speed * rng.range(0.9, 1.1),
    score: def.score,
    color: def.color,
    angle: rng.angle(),
    fireTimer: rng.range(1.2, 2.4),
    spawnTimer: rng.range(4, 6),
    burstTimer: 2.5,
    hitFlash: 0,
    orbitDir: rng.chance(0.5) ? 1 : -1,
    orbitAngle: rng.angle(),
    seed: rng.range(0, Math.PI * 2),
  };
  return e;
}

export function createParticle(x, y, color, speed, life, size) {
  const a = Math.random() * Math.PI * 2;
  const s = speed * (0.3 + Math.random() * 0.7);
  return {
    x, y,
    vx: Math.cos(a) * s,
    vy: Math.sin(a) * s,
    color,
    life,
    maxLife: life,
    size: size * (0.6 + Math.random() * 0.8),
  };
}

export function createPickup(kind, x, y) {
  return { kind, x, y, vx: 0, vy: 0, life: 12, bob: Math.random() * Math.PI * 2 };
}

export function createFloater(text, x, y, color) {
  return { text, x, y, color, life: 1.1, maxLife: 1.1 };
}

// --- Player ---

export function updatePlayer(game, dt) {
  const p = game.player;
  if (!p.alive) return;
  const input = game.input;
  const mv = input.moveVector;
  p.vx += mv.x * CONFIG.PLAYER.accel * dt;
  p.vy += mv.y * CONFIG.PLAYER.accel * dt;
  const drag = Math.pow(CONFIG.PLAYER.drag, dt * 60);
  p.vx *= drag;
  p.vy *= drag;
  const sp = Math.hypot(p.vx, p.vy);
  const max = CONFIG.PLAYER.maxSpeed;
  if (sp > max) {
    p.vx = (p.vx / sp) * max;
    p.vy = (p.vy / sp) * max;
  }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  // Soft walls: bounce back inside the arena.
  if (p.x < p.radius) { p.x = p.radius; p.vx = Math.abs(p.vx) * 0.5; }
  if (p.x > CONFIG.W - p.radius) { p.x = CONFIG.W - p.radius; p.vx = -Math.abs(p.vx) * 0.5; }
  if (p.y < p.radius) { p.y = p.radius; p.vy = Math.abs(p.vy) * 0.5; }
  if (p.y > CONFIG.H - p.radius) { p.y = CONFIG.H - p.radius; p.vy = -Math.abs(p.vy) * 0.5; }

  p.angle = Math.atan2(input.mouse.y - p.y, input.mouse.x - p.x);
  p.thrust = Math.hypot(mv.x, mv.y) > 0 ? 1 : 0;
  if (p.invuln > 0) p.invuln -= dt;

  // Firing: hold mouse or Space. Spread and Rapid power-ups change the shot.
  p.fireTimer -= dt;
  const rate = game.powerups.rapid > 0 ? CONFIG.PLAYER.fireRate * 2 : CONFIG.PLAYER.fireRate;
  if (input.firing && p.fireTimer <= 0) {
    p.fireTimer = 1 / rate;
    const spread = game.powerups.spread > 0;
    const angles = spread ? [-0.16, 0, 0.16] : [0];
    for (const off of angles) {
      const bx = p.x + Math.cos(p.angle) * (p.radius + 6);
      const by = p.y + Math.sin(p.angle) * (p.radius + 6);
      game.bullets.push(createBullet(bx, by, p.angle + off, CONFIG.PLAYER.bulletSpeed, CONFIG.PLAYER.bulletDamage));
    }
    game.sound.shoot();
    game.stats.shots += angles.length;
    // Muzzle sparks.
    for (let i = 0; i < 2; i++) {
      game.particles.push(createParticle(
        p.x + Math.cos(p.angle) * (p.radius + 4),
        p.y + Math.sin(p.angle) * (p.radius + 4),
        '#a5f3fc', 120, 0.18, 2,
      ));
    }
  }

  // Power-up timers tick down.
  for (const key of ['spread', 'rapid', 'shield']) {
    if (game.powerups[key] > 0) game.powerups[key] -= dt;
  }

  // Engine trail while thrusting.
  if (p.thrust > 0 && Math.random() < 0.6) {
    const back = p.angle + Math.PI;
    game.particles.push(createParticle(
      p.x + Math.cos(back) * p.radius * 0.9 + (Math.random() - 0.5) * 6,
      p.y + Math.sin(back) * p.radius * 0.9 + (Math.random() - 0.5) * 6,
      Math.random() < 0.5 ? '#22d3ee' : '#f59e0b',
      60, 0.35, 2.5,
    ));
  }
}

// --- Enemies ---

export function updateEnemy(game, e, dt) {
  const p = game.player;
  const dx = p.x - e.x;
  const dy = p.y - e.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  if (e.hitFlash > 0) e.hitFlash -= dt;

  if (e.type === 'thorn') {
    e.vx += nx * e.speed * 2.2 * dt;
    e.vy += ny * e.speed * 2.2 * dt;
    clampSpeed(e, e.speed * 1.4);
  } else if (e.type === 'spitter') {
    // Keep its distance and spit orbs at the player.
    const want = 280;
    const toward = dist > want + 40 ? 1 : dist < want - 40 ? -1 : 0;
    e.vx += nx * toward * e.speed * 1.6 * dt;
    e.vy += ny * toward * e.speed * 1.6 * dt;
    e.vx += -ny * Math.sin(e.seed + game.time) * 30 * dt;
    e.vy += nx * Math.sin(e.seed + game.time) * 30 * dt;
    clampSpeed(e, e.speed);
    e.fireTimer -= dt;
    if (e.fireTimer <= 0 && p.alive && dist < 560) {
      e.fireTimer = 2.2;
      game.ebullets.push(createEnemyBullet(e.x, e.y, Math.atan2(dy, dx)));
      game.sound.tone(180, 0.12, 'square', 0.06, 120);
    }
  } else if (e.type === 'splitter') {
    e.vx += nx * e.speed * 1.8 * dt;
    e.vy += ny * e.speed * 1.8 * dt;
    clampSpeed(e, e.speed);
    e.angle += dt * 1.5;
  } else if (e.type === 'orbiter') {
    e.orbitAngle += e.orbitDir * 1.6 * dt;
    const r = 210;
    const tx = p.x + Math.cos(e.orbitAngle) * r;
    const ty = p.y + Math.sin(e.orbitAngle) * r;
    e.vx += (tx - e.x) * 1.8 * dt;
    e.vy += (ty - e.y) * 1.8 * dt;
    clampSpeed(e, e.speed * 1.5);
  } else if (e.type === 'boss') {
    const enraged = e.hp < e.maxHp * 0.3;
    const sp = enraged ? e.speed * 1.7 : e.speed;
    e.vx += nx * sp * 1.6 * dt;
    e.vy += ny * sp * 1.6 * dt;
    clampSpeed(e, sp);
    e.angle += dt * 0.8;
    // Radial burst.
    e.burstTimer -= dt;
    if (e.burstTimer <= 0 && p.alive) {
      e.burstTimer = enraged ? 2.0 : 2.8;
      const n = enraged ? 12 : 9;
      for (let i = 0; i < n; i++) {
        game.ebullets.push(createEnemyBullet(e.x, e.y, (i / n) * Math.PI * 2 + e.seed));
      }
      game.sound.bossAlarm();
      game.shake = Math.max(game.shake, 6);
    }
    // Spawn thorn escorts.
    e.spawnTimer -= dt;
    if (e.spawnTimer <= 0) {
      e.spawnTimer = 6;
      for (let i = 0; i < 2; i++) {
        const a = game.rng.angle();
        game.enemies.push(createEnemy(
          'thorn',
          e.x + Math.cos(a) * (e.radius + 20),
          e.y + Math.sin(a) * (e.radius + 20),
          game.wave, game.rng,
        ));
      }
    }
  }

  e.x += e.vx * dt;
  e.y += e.vy * dt;
  // Enemies stay inside the arena.
  if (e.x < e.radius) { e.x = e.radius; e.vx = Math.abs(e.vx); }
  if (e.x > CONFIG.W - e.radius) { e.x = CONFIG.W - e.radius; e.vx = -Math.abs(e.vx); }
  if (e.y < e.radius) { e.y = e.radius; e.vy = Math.abs(e.vy); }
  if (e.y > CONFIG.H - e.radius) { e.y = CONFIG.H - e.radius; e.vy = -Math.abs(e.vy); }
}

function clampSpeed(e, max) {
  const sp = Math.hypot(e.vx, e.vy);
  if (sp > max) {
    e.vx = (e.vx / sp) * max;
    e.vy = (e.vy / sp) * max;
  }
}

// --- Projectiles, particles, pickups ---

export function updateBullets(game, dt) {
  for (const b of game.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  game.bullets = game.bullets.filter(
    (b) => b.life > 0 && b.x > -20 && b.x < CONFIG.W + 20 && b.y > -20 && b.y < CONFIG.H + 20,
  );
  for (const b of game.ebullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  game.ebullets = game.ebullets.filter(
    (b) => b.life > 0 && b.x > -20 && b.x < CONFIG.W + 20 && b.y > -20 && b.y < CONFIG.H + 20,
  );
}

export function updateParticles(game, dt) {
  for (const pt of game.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= Math.pow(0.92, dt * 60);
    pt.vy *= Math.pow(0.92, dt * 60);
    pt.life -= dt;
  }
  game.particles = game.particles.filter((pt) => pt.life > 0);
  if (game.particles.length > 500) game.particles.splice(0, game.particles.length - 500);
  for (const f of game.floaters) {
    f.y -= 42 * dt;
    f.life -= dt;
  }
  game.floaters = game.floaters.filter((f) => f.life > 0);
}

export function updatePickups(game, dt) {
  for (const pk of game.pickups) {
    pk.bob += dt * 3;
    pk.life -= dt;
    // Gentle drift toward the player when close: harvesting feels good.
    const p = game.player;
    if (p.alive) {
      const dx = p.x - pk.x;
      const dy = p.y - pk.y;
      const d = Math.hypot(dx, dy);
      if (d < 130 && d > 1) {
        pk.x += (dx / d) * 90 * dt;
        pk.y += (dy / d) * 90 * dt;
      }
    }
  }
  game.pickups = game.pickups.filter((pk) => pk.life > 0);
}

// --- Collisions ---

export function resolveCollisions(game) {
  const p = game.player;

  // Player bullets vs enemies.
  for (const b of game.bullets) {
    for (const e of game.enemies) {
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const rr = b.radius + e.radius;
      if (dx * dx + dy * dy < rr * rr) {
        b.life = 0;
        e.hp -= b.damage;
        e.hitFlash = 0.12;
        game.stats.hits += 1;
        burst(game, b.x, b.y, e.color, 3, 90);
        if (e.hp <= 0) killEnemy(game, e);
        break;
      }
    }
  }
  game.enemies = game.enemies.filter((e) => e.hp > 0);

  // Enemies vs player.
  if (p.alive && p.invuln <= 0) {
    for (const e of game.enemies) {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const rr = p.radius + e.radius - 3;
      if (dx * dx + dy * dy < rr * rr) {
        e.hp -= 2;
        if (e.hp <= 0) killEnemy(game, e);
        hurtPlayer(game, e.x, e.y);
        break;
      }
    }
  }
  game.enemies = game.enemies.filter((e) => e.hp > 0);

  // Enemy bullets vs player.
  if (p.alive && p.invuln <= 0) {
    for (const b of game.ebullets) {
      const dx = p.x - b.x;
      const dy = p.y - b.y;
      const rr = p.radius + b.radius - 2;
      if (dx * dx + dy * dy < rr * rr) {
        b.life = 0;
        hurtPlayer(game, b.x, b.y);
        break;
      }
    }
  }

  // Pickups vs player.
  if (p.alive) {
    for (const pk of game.pickups) {
      const dx = p.x - pk.x;
      const dy = p.y - pk.y;
      const rr = p.radius + 14;
      if (dx * dx + dy * dy < rr * rr) {
        pk.life = 0;
        applyPickup(game, pk);
      }
    }
    game.pickups = game.pickups.filter((pk) => pk.life > 0);
  }
}

export function killEnemy(game, e) {
  game.kills += 1;
  game.combo = Math.min(game.combo + 1, CONFIG.COMBO.maxMultiplier);
  game.comboTimer = CONFIG.COMBO.windowSeconds;
  const gained = e.score * game.combo;
  game.score += gained;
  game.floaters.push(createFloater(
    `+${gained}${game.combo > 1 ? ' x' + game.combo : ''}`,
    e.x, e.y, '#fbbf24',
  ));
  burst(game, e.x, e.y, e.color, e.type === 'boss' ? 60 : 16, e.type === 'boss' ? 320 : 220);
  game.sound.enemyDie(e.type === 'boss' || e.type === 'splitter');
  game.shake = Math.max(game.shake, e.type === 'boss' ? 14 : 3);
  if (e.type === 'splitter') {
    // A splitter blooms into two thorns.
    for (let i = 0; i < 2; i++) {
      const a = game.rng.angle();
      game.enemies.push(createEnemy(
        'thorn',
        e.x + Math.cos(a) * 26,
        e.y + Math.sin(a) * 26,
        game.wave, game.rng,
      ));
    }
  }
  // Drops: petals and power-ups.
  const roll = game.rng.next();
  if (roll < CONFIG.POWERUPS.dropChance) {
    const kinds = ['spread', 'rapid', 'shield', 'bomb'];
    const kind = game.rng.chance(CONFIG.POWERUPS.heartChance / CONFIG.POWERUPS.dropChance)
      ? 'heart'
      : game.rng.pick(kinds);
    game.pickups.push(createPickup(kind, e.x, e.y));
  } else if (roll < CONFIG.POWERUPS.dropChance + 0.45) {
    game.pickups.push(createPickup('petal', e.x, e.y));
  }
  if (e.type === 'boss') {
    game.boss = null;
    game.pickups.push(createPickup('heart', e.x - 30, e.y));
    game.pickups.push(createPickup('spread', e.x + 30, e.y));
  }
}

export function hurtPlayer(game, fromX, fromY) {
  const p = game.player;
  if (game.powerups.shield > 0) {
    game.powerups.shield = 0;
    p.invuln = 1.2;
    game.floaters.push(createFloater('SHIELD!', p.x, p.y - 30, '#34d399'));
    game.sound.powerup();
    burst(game, p.x, p.y, '#34d399', 18, 200);
    return;
  }
  game.lives -= 1;
  game.combo = 0;
  game.comboTimer = 0;
  p.invuln = CONFIG.PLAYER.invulnSeconds;
  game.shake = 14;
  game.flash = 0.5;
  game.sound.playerHit();
  burst(game, p.x, p.y, '#22d3ee', 26, 260);
  // Knock the ship away from what hit it.
  const dx = p.x - fromX;
  const dy = p.y - fromY;
  const d = Math.hypot(dx, dy) || 1;
  p.vx = (dx / d) * 320;
  p.vy = (dy / d) * 320;
  if (game.lives <= 0) {
    p.alive = false;
    burst(game, p.x, p.y, '#22d3ee', 60, 340);
    burst(game, p.x, p.y, '#f59e0b', 30, 220);
    game.sound.gameOver();
    game.state = 'gameover';
    game.stats.endTime = game.time;
  }
}

export function applyPickup(game, pk) {
  const p = game.player;
  if (pk.kind === 'petal') {
    const gained = 25 * Math.max(1, game.combo);
    game.score += gained;
    game.floaters.push(createFloater(`+${gained}`, pk.x, pk.y, '#fbbf24'));
    game.sound.pickup(game.combo);
  } else if (pk.kind === 'heart') {
    if (game.lives < CONFIG.PLAYER.lives) {
      game.lives += 1;
      game.floaters.push(createFloater('+1 SHIP', pk.x, pk.y, '#34d399'));
    } else {
      game.score += 500;
      game.floaters.push(createFloater('+500', pk.x, pk.y, '#34d399'));
    }
    game.sound.powerup();
  } else if (pk.kind === 'spread') {
    game.powerups.spread = CONFIG.POWERUPS.spreadSeconds;
    game.floaters.push(createFloater('SPREAD SHOT!', pk.x, pk.y, '#c77dff'));
    game.sound.powerup();
  } else if (pk.kind === 'rapid') {
    game.powerups.rapid = CONFIG.POWERUPS.rapidSeconds;
    game.floaters.push(createFloater('RAPID FIRE!', pk.x, pk.y, '#4cc9f0'));
    game.sound.powerup();
  } else if (pk.kind === 'shield') {
    game.powerups.shield = CONFIG.POWERUPS.shieldSeconds;
    game.floaters.push(createFloater('SHIELD!', pk.x, pk.y, '#34d399'));
    game.sound.powerup();
  } else if (pk.kind === 'bomb') {
    game.floaters.push(createFloater('NOVA BLAST!', pk.x, pk.y, '#fb7185'));
    game.sound.bomb();
    game.shake = 12;
    // The nova wounds every enemy on screen and clears their bullets.
    for (const e of game.enemies) {
      e.hp -= 3;
      e.hitFlash = 0.2;
      if (e.hp <= 0) killEnemy(game, e);
    }
    game.enemies = game.enemies.filter((e) => e.hp > 0);
    game.ebullets = [];
    burst(game, p.x, p.y, '#fb7185', 40, 420);
  }
  burst(game, pk.x, pk.y, '#fbbf24', 8, 140);
}

export function burst(game, x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    game.particles.push(createParticle(x, y, color, speed, 0.5 + Math.random() * 0.5, 3));
  }
}
