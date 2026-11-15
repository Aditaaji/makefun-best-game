// The wave director: builds each wave, trickles enemies in from the
// edges, and calls the next wave once the garden is clear.

import { CONFIG, waveComposition } from './config.js';
import { createEnemy } from './entities.js';

export class WaveDirector {
  constructor(game) {
    this.game = game;
    this.queue = [];
    this.spawnTimer = 0;
    this.breather = 0;
    this.banner = 0;
    this.bannerText = '';
  }

  startWave(n) {
    const game = this.game;
    game.wave = n;
    this.queue = waveComposition(n);
    // Shuffle the queue so the mix arrives in a varied order.
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(game.rng.next() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    this.spawnTimer = 0.5;
    this.banner = 2.2;
    this.bannerText = n === CONFIG.TOTAL_WAVES
      ? 'FINAL WAVE — THE THORNHEART PRIME'
      : `WAVE ${n}`;
    game.sound.waveStart();
    if (this.queue.includes('boss')) game.sound.bossAlarm();
  }

  get remaining() {
    return this.queue.length + this.game.enemies.length;
  }

  update(dt) {
    const game = this.game;
    if (game.state !== 'playing') return;
    if (this.banner > 0) this.banner -= dt;

    // Breather between waves: nothing spawns, the player catches a breath.
    if (this.breather > 0) {
      this.breather -= dt;
      if (this.breather <= 0) this.startWave(game.wave + 1);
      return;
    }

    // Trickle the queue in, faster as the wave goes on.
    if (this.queue.length > 0) {
      this.spawnTimer -= dt;
      const interval = Math.max(0.25, 0.9 - game.wave * 0.05);
      if (this.spawnTimer <= 0) {
        this.spawnTimer = interval;
        const type = this.queue.shift();
        const at = game.rng.edgePoint(50, CONFIG.W, CONFIG.H);
        const e = createEnemy(type, at.x, at.y, game.wave, game.rng);
        game.enemies.push(e);
        if (type === 'boss') {
          game.boss = e;
          game.floaters.push(createFloaterText(e.x, e.y - 70, 'THORNHEART', '#ff2e63'));
        }
      }
      return;
    }

    // Wave clear: the queue is empty and no enemy is left.
    if (game.enemies.length === 0 && game.player.alive) {
      const bonus = CONFIG.WAVES.clearBonus * game.wave;
      game.score += bonus;
      game.floaters.push({
        text: `WAVE ${game.wave} CLEAR  +${bonus}`,
        x: CONFIG.W / 2, y: CONFIG.H / 2 - 60,
        color: '#34d399', life: 2, maxLife: 2,
      });
      game.sound.victory();
      if (game.wave >= CONFIG.TOTAL_WAVES) {
        game.state = 'victory';
        game.stats.endTime = game.time;
        return;
      }
      this.breather = CONFIG.WAVES.breatherSeconds;
    }
  }
}

function createFloaterText(x, y, text, color) {
  return { text, x, y, color, life: 2, maxLife: 2 };
}
