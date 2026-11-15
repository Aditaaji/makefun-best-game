// Screens and the HUD: title, pause, game over, victory, and the
// in-game readouts. All text is drawn on the canvas so the screenshots
// show the whole game.

import { CONFIG } from './config.js';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(7, 3, 18, 0.82)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function centerText(ctx, text, x, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function button(ctx, x, y, w, h, label, game) {
  const hover = game.input.mouse.x >= x && game.input.mouse.x <= x + w
    && game.input.mouse.y >= y && game.input.mouse.y <= y + h;
  ctx.fillStyle = hover ? '#0891b2' : '#0e7490';
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  centerText(ctx, label, x + w / 2, y + h / 2 + 1, 'bold 20px system-ui, sans-serif', '#f0f9ff');
  return { x, y, w, h, hover };
}

export function drawHUD(ctx, game) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  // Score block.
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillStyle = CONFIG.COLORS.text;
  ctx.fillText(`SCORE ${game.score.toLocaleString('en-US')}`, 22, 16);
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillStyle = game.combo > 1 ? '#fbbf24' : CONFIG.COLORS.dimText;
  ctx.fillText(game.combo > 1 ? `COMBO x${game.combo}` : 'COMBO x1', 22, 52);
  // Wave block, right side.
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = CONFIG.COLORS.text;
  ctx.fillText(`WAVE ${game.wave} / ${CONFIG.TOTAL_WAVES}`, CONFIG.W - 22, 18);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = CONFIG.COLORS.dimText;
  ctx.fillText(`LEFT ${game.director.remaining}`, CONFIG.W - 22, 48);
  // Lives: little ships, bottom left.
  for (let i = 0; i < game.lives; i++) {
    const x = 34 + i * 30;
    const y = CONFIG.H - 30;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = CONFIG.COLORS.player;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, 9);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, -9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Active power-ups, bottom right.
  const act = [];
  if (game.powerups.spread > 0) act.push(`SPREAD ${Math.ceil(game.powerups.spread)}s`);
  if (game.powerups.rapid > 0) act.push(`RAPID ${Math.ceil(game.powerups.rapid)}s`);
  if (game.powerups.shield > 0) act.push(`SHIELD ${Math.ceil(game.powerups.shield)}s`);
  if (act.length > 0) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#c77dff';
    ctx.fillText(act.join('   '), CONFIG.W - 22, CONFIG.H - 34);
  }
  // Stored nova charge, bottom right above the power-ups.
  if (game.nova > 0) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = '#fb7185';
    ctx.fillText('✺ NOVA READY — press B', CONFIG.W - 22, CONFIG.H - 58);
  }
  // Wave banner.
  if (game.director.banner > 0) {
    ctx.globalAlpha = Math.min(1, game.director.banner);
    centerText(ctx, game.director.bannerText, CONFIG.W / 2, 150, 'bold 44px system-ui, sans-serif', '#f0f9ff');
    ctx.globalAlpha = 1;
  }
  // Breather countdown.
  if (game.director.breather > 0) {
    centerText(ctx, `Next wave in ${Math.ceil(game.director.breather)}…`, CONFIG.W / 2, 190, '20px system-ui, sans-serif', CONFIG.COLORS.dimText);
  }
  // Boss health bar.
  if (game.boss) {
    const w = 420;
    const x = (CONFIG.W - w) / 2;
    const y = 76;
    ctx.fillStyle = 'rgba(7,3,18,0.7)';
    ctx.fillRect(x - 6, y - 6, w + 12, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = '#ff2e63';
    ctx.fillRect(x, y, w * (game.boss.hp / game.boss.maxHp), 14);
    centerText(ctx, 'THORNHEART', CONFIG.W / 2, y + 30, 'bold 13px system-ui, sans-serif', '#fda4af');
  }
  // Damage flash.
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255, 46, 99, ${game.flash * 0.45})`;
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  }
}

export function drawTitle(ctx, game) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  centerText(ctx, 'VOIDBLOOM', CONFIG.W / 2, 210, 'bold 84px system-ui, sans-serif', '#22d3ee');
  centerText(ctx, 'Reignite the garden. Survive all 10 waves.', CONFIG.W / 2, 272, '22px system-ui, sans-serif', CONFIG.COLORS.text);
  panel(ctx, CONFIG.W / 2 - 330, 320, 660, 210);
  centerText(ctx, 'MOVE  —  WASD or Arrow keys', CONFIG.W / 2, 350, '18px system-ui, sans-serif', CONFIG.COLORS.text);
  centerText(ctx, 'AIM + FIRE  —  Mouse, hold click or Space', CONFIG.W / 2, 382, '18px system-ui, sans-serif', CONFIG.COLORS.text);
  centerText(ctx, 'PAUSE  —  P      MUTE  —  M      RESTART  —  R', CONFIG.W / 2, 414, '18px system-ui, sans-serif', CONFIG.COLORS.text);
  centerText(ctx, 'Chain kills for combos. Grab petals, spread shot, rapid fire, shields.', CONFIG.W / 2, 446, '16px system-ui, sans-serif', CONFIG.COLORS.dimText);
  centerText(ctx, 'Beware the Thornheart on waves 3, 6 and 10.', CONFIG.W / 2, 476, '16px system-ui, sans-serif', '#fb7185');
  centerText(ctx, 'Grab the ✺ nova and press B to detonate it when the swarm closes in.', CONFIG.W / 2, 506, '16px system-ui, sans-serif', '#fb7185');
  const b = button(ctx, CONFIG.W / 2 - 130, 560, 260, 56, '▶  START', game);
  game.titleButton = b;
  if (game.best > 0) {
    centerText(ctx, `BEST  ${game.best.toLocaleString('en-US')}`, CONFIG.W / 2, 650, '18px system-ui, sans-serif', '#fbbf24');
  }
}

export function drawPaused(ctx, game) {
  ctx.fillStyle = 'rgba(7, 3, 18, 0.6)';
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  centerText(ctx, 'PAUSED', CONFIG.W / 2, 330, 'bold 56px system-ui, sans-serif', CONFIG.COLORS.text);
  centerText(ctx, 'Press P or click Resume to keep playing', CONFIG.W / 2, 396, '18px system-ui, sans-serif', CONFIG.COLORS.dimText);
  const b = button(ctx, CONFIG.W / 2 - 130, 440, 260, 56, 'RESUME', game);
  game.pauseButton = b;
}

export function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(7, 3, 18, 0.72)';
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  centerText(ctx, 'THE GARDEN FADES', CONFIG.W / 2, 250, 'bold 60px system-ui, sans-serif', '#fb7185');
  centerText(ctx, `You fell on wave ${game.wave} of ${CONFIG.TOTAL_WAVES}`, CONFIG.W / 2, 316, '22px system-ui, sans-serif', CONFIG.COLORS.text);
  panel(ctx, CONFIG.W / 2 - 260, 360, 520, 130);
  centerText(ctx, `SCORE  ${game.score.toLocaleString('en-US')}`, CONFIG.W / 2, 392, 'bold 30px system-ui, sans-serif', '#fbbf24');
  centerText(ctx, `${game.kills} thorns destroyed  ·  best combo x${game.stats.bestCombo}`, CONFIG.W / 2, 436, '17px system-ui, sans-serif', CONFIG.COLORS.dimText);
  if (game.score >= game.best && game.score > 0) {
    centerText(ctx, '★ NEW BEST ★', CONFIG.W / 2, 466, 'bold 18px system-ui, sans-serif', '#fbbf24');
  }
  const b = button(ctx, CONFIG.W / 2 - 130, 540, 260, 56, '↻  TRY AGAIN', game);
  game.overButton = b;
}

export function drawVictory(ctx, game) {
  ctx.fillStyle = 'rgba(7, 3, 18, 0.55)';
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  centerText(ctx, 'THE GARDEN BLOOMS AGAIN', CONFIG.W / 2, 230, 'bold 52px system-ui, sans-serif', '#34d399');
  centerText(ctx, 'All 10 waves cleared — the Thornheart Prime is stardust.', CONFIG.W / 2, 292, '21px system-ui, sans-serif', CONFIG.COLORS.text);
  panel(ctx, CONFIG.W / 2 - 280, 340, 560, 150);
  centerText(ctx, `SCORE  ${game.score.toLocaleString('en-US')}`, CONFIG.W / 2, 376, 'bold 32px system-ui, sans-serif', '#fbbf24');
  const mins = Math.floor(game.stats.endTime / 60);
  const secs = Math.floor(game.stats.endTime % 60).toString().padStart(2, '0');
  centerText(ctx, `${game.kills} thorns destroyed  ·  ${mins}:${secs}  ·  accuracy ${game.accuracy}%`, CONFIG.W / 2, 424, '18px system-ui, sans-serif', CONFIG.COLORS.dimText);
  if (game.score >= game.best && game.score > 0) {
    centerText(ctx, '★ NEW BEST ★', CONFIG.W / 2, 462, 'bold 18px system-ui, sans-serif', '#fbbf24');
  }
  const b = button(ctx, CONFIG.W / 2 - 130, 540, 260, 56, '↻  PLAY AGAIN', game);
  game.victoryButton = b;
}

// Which menu button, if any, sits under the mouse right now.
export function menuButtonAt(game) {
  const m = game.input.mouse;
  for (const key of ['titleButton', 'pauseButton', 'overButton', 'victoryButton']) {
    const b = game[key];
    if (b && m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h) return key;
  }
  return null;
}
