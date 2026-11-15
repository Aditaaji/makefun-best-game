// VOIDBLOOM: an original arena shooter. Pilot the seed-ship Bloom,
// harvest petals, chain combos, and clear all 10 waves to reignite the
// garden. Keyboard + mouse, no network, no assets: everything is drawn
// and synthesized in code.

import { CONFIG } from './config.js';
import { RNG } from './random.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import {
  createPlayer,
  updatePlayer,
  updateEnemy,
  updateBullets,
  updateParticles,
  updatePickups,
  resolveCollisions,
} from './entities.js';
import { WaveDirector } from './waves.js';
import {
  drawBackground,
  drawPickups,
  drawPlayer,
  drawEnemies,
  drawBullets,
  drawParticles,
} from './render.js';
import {
  drawHUD,
  drawTitle,
  drawPaused,
  drawGameOver,
  drawVictory,
  menuButtonAt,
} from './ui.js';
import { parseShotParams, applyShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = parseShotParams();
const rng = new RNG(params.seed || ((Date.now() % 2147483647) + 1));

function makeStars(count, color, alpha, speed, size) {
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push({
      x: rng.range(0, CONFIG.W),
      y: rng.range(0, CONFIG.H),
      size: rng.range(size * 0.6, size * 1.4),
      tw: rng.range(0.5, 2),
      ph: rng.range(0, Math.PI * 2),
    });
  }
  return { color, alpha, speed, points };
}

const game = {
  state: 'title',
  time: 0,
  wave: 0,
  score: 0,
  best: 0,
  combo: 0,
  comboTimer: 0,
  lives: CONFIG.PLAYER.lives,
  kills: 0,
  boss: null,
  player: createPlayer(CONFIG.W / 2, CONFIG.H / 2 + 80),
  bullets: [],
  enemies: [],
  ebullets: [],
  particles: [],
  pickups: [],
  floaters: [],
  powerups: { spread: 0, rapid: 0, shield: 0 },
  shake: 0,
  flash: 0,
  accuracy: 0,
  rng,
  rngSeed: params.seed || 1,
  input: new Input(canvas),
  sound: new SoundEngine(),
  director: null,
  stats: { shots: 0, hits: 0, bestCombo: 0, endTime: 0 },
  stars: [
    makeStars(90, '#e2e8f0', 0.5, 4, 1.6),
    makeStars(50, '#94a3b8', 0.8, 10, 2.4),
  ],
  titleButton: null,
  pauseButton: null,
  overButton: null,
  victoryButton: null,
};

game.director = new WaveDirector(game);

// One fixed step of the simulation. The frame loop calls it live;
// the screenshot scenes call it directly to fast-forward a fight.
game.step = function step(dt) {
  game.time += dt;
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 30);
  if (game.flash > 0) game.flash = Math.max(0, game.flash - dt * 1.4);
  if (game.comboTimer > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;
  }
  game.director.update(dt);
  updatePlayer(game, dt);
  for (const e of game.enemies) updateEnemy(game, e, dt);
  updateBullets(game, dt);
  updateParticles(game, dt);
  updatePickups(game, dt);
  resolveCollisions(game);
  game.stats.bestCombo = Math.max(game.stats.bestCombo, game.combo);
  game.accuracy = game.stats.shots > 0
    ? Math.round((game.stats.hits / game.stats.shots) * 100)
    : 0;
};

function resetRun() {
  game.player = createPlayer(CONFIG.W / 2, CONFIG.H / 2 + 80);
  game.bullets = [];
  game.enemies = [];
  game.ebullets = [];
  game.particles = [];
  game.pickups = [];
  game.floaters = [];
  game.powerups = { spread: 0, rapid: 0, shield: 0 };
  game.score = 0;
  game.combo = 0;
  game.comboTimer = 0;
  game.lives = CONFIG.PLAYER.lives;
  game.kills = 0;
  game.boss = null;
  game.wave = 0;
  game.shake = 0;
  game.flash = 0;
  game.stats = { shots: 0, hits: 0, bestCombo: 0, endTime: 0 };
  game.accuracy = 0;
  game.director = new WaveDirector(game);
}

function startGame() {
  resetRun();
  game.state = 'playing';
  game.sound.unlock();
  game.director.startWave(1);
}

function drawWorld() {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * game.shake,
      (Math.random() - 0.5) * game.shake,
    );
  }
  drawBackground(ctx, game);
  drawPickups(ctx, game);
  drawPlayer(ctx, game);
  drawEnemies(ctx, game);
  drawBullets(ctx, game);
  drawParticles(ctx, game);
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, CONFIG.W, CONFIG.H);
  if (game.state === 'title') {
    drawBackground(ctx, game);
    drawParticles(ctx, game);
    drawTitle(ctx, game);
  } else if (game.state === 'playing') {
    drawWorld();
    drawHUD(ctx, game);
  } else if (game.state === 'paused') {
    drawWorld();
    drawHUD(ctx, game);
    drawPaused(ctx, game);
  } else if (game.state === 'gameover') {
    drawWorld();
    drawGameOver(ctx, game);
  } else if (game.state === 'victory') {
    drawWorld();
    drawVictory(ctx, game);
  }
}

function handleMenuInput() {
  const input = game.input;
  if (input.wasPressed('KeyM')) game.sound.setMuted(!game.sound.muted);
  if (game.state === 'title') {
    if (input.wasPressed('Enter', 'NumpadEnter')) { startGame(); return; }
    if (input.mouseClicked && menuButtonAt(game) === 'titleButton') { startGame(); return; }
  } else if (game.state === 'playing') {
    if (input.wasPressed('KeyP', 'Escape')) { game.state = 'paused'; return; }
    if (input.wasPressed('KeyR')) { startGame(); return; }
  } else if (game.state === 'paused') {
    if (input.wasPressed('KeyP', 'Escape')) { game.state = 'playing'; return; }
    if (input.mouseClicked && menuButtonAt(game) === 'pauseButton') { game.state = 'playing'; return; }
  } else if (game.state === 'gameover') {
    if (input.wasPressed('Enter', 'NumpadEnter', 'KeyR')) { startGame(); return; }
    if (input.mouseClicked && menuButtonAt(game) === 'overButton') { startGame(); return; }
  } else if (game.state === 'victory') {
    if (input.wasPressed('Enter', 'NumpadEnter', 'KeyR')) { startGame(); return; }
    if (input.mouseClicked && menuButtonAt(game) === 'victoryButton') { startGame(); return; }
  }
  // Any click or key unlocks audio (browsers require a gesture).
  if (input.mouseClicked || input.pressed.size > 0) game.sound.unlock();
}

// Best score persists in the browser between runs.
try {
  game.best = parseInt(window.localStorage.getItem('voidbloom-best') || '0', 10) || 0;
} catch (e) {
  game.best = 0;
}

function saveBest() {
  if (game.score > game.best) {
    game.best = game.score;
    try {
      window.localStorage.setItem('voidbloom-best', String(game.best));
    } catch (e) {
      // Storage is a nicety, never a failure.
    }
  }
}

// Screenshot scenes run before the loop starts.
const shot = applyShotScene(game, params);
if (shot.freeze) {
  render();
} else {
  let last = performance.now();
  let prevState = game.state;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    handleMenuInput();
    if (game.state === 'playing') game.step(dt);
    if (game.state === 'title') {
      game.time += dt;
      updateParticles(game, dt);
    }
    // A run that just ended banks its best score.
    if ((prevState === 'playing' && game.state === 'gameover')
      || (prevState === 'playing' && game.state === 'victory')) {
      saveBest();
    }
    prevState = game.state;
    render();
    game.input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Auto-pause when the tab loses focus mid-run.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') game.state = 'paused';
});

// Exposed for automated play-testing only.
window.__game = game;
