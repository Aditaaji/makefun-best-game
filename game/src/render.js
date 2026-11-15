// World drawing: the void garden, the ship, the enemies, bullets,
// particles and pickups. Screens and the HUD live in ui.js.

import { CONFIG } from './config.js';

// Pre-rendered nebula blobs, painted once and reused every frame.
let nebulaCanvas = null;

function getNebula() {
  if (nebulaCanvas) return nebulaCanvas;
  nebulaCanvas = document.createElement('canvas');
  nebulaCanvas.width = CONFIG.W;
  nebulaCanvas.height = CONFIG.H;
  const c = nebulaCanvas.getContext('2d');
  const blobs = [
    { x: 220, y: 180, r: 340, color: CONFIG.COLORS.nebulaA },
    { x: 1050, y: 620, r: 380, color: CONFIG.COLORS.nebulaB },
    { x: 980, y: 140, r: 260, color: CONFIG.COLORS.nebulaC },
    { x: 180, y: 680, r: 240, color: CONFIG.COLORS.nebulaB },
  ];
  for (const b of blobs) {
    const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, b.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
  }
  return nebulaCanvas;
}

export function drawBackground(ctx, game) {
  ctx.fillStyle = CONFIG.COLORS.background;
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  ctx.drawImage(getNebula(), 0, 0);
  // Parallax starfield: two layers drifting at different speeds.
  for (const layer of game.stars) {
    ctx.fillStyle = layer.color;
    for (const s of layer.points) {
      const x = (s.x - game.time * layer.speed) % CONFIG.W;
      const px = x < 0 ? x + CONFIG.W : x;
      const tw = 0.55 + 0.45 * Math.sin(game.time * s.tw + s.ph);
      ctx.globalAlpha = tw * layer.alpha;
      ctx.fillRect(px, s.y, s.size, s.size);
    }
  }
  ctx.globalAlpha = 1;
  // Faint arena border.
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, CONFIG.W - 12, CONFIG.H - 12);
}

export function drawPickups(ctx, game) {
  for (const pk of game.pickups) {
    const bobY = Math.sin(pk.bob) * 3;
    const pulse = 1 + 0.12 * Math.sin(pk.bob * 2);
    const blink = pk.life < 3 ? (Math.sin(pk.life * 12) > 0 ? 1 : 0.25) : 1;
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.translate(pk.x, pk.y + bobY);
    ctx.scale(pulse, pulse);
    const look = pickupLook(pk.kind);
    ctx.fillStyle = look.glow;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = look.color;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#070312';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(look.glyph, 0, 1);
    ctx.restore();
  }
}

function pickupLook(kind) {
  if (kind === 'petal') return { color: '#fbbf24', glow: 'rgba(251,191,36,0.25)', glyph: '✦' };
  if (kind === 'heart') return { color: '#34d399', glow: 'rgba(52,211,153,0.25)', glyph: '♥' };
  if (kind === 'spread') return { color: '#c77dff', glow: 'rgba(199,125,255,0.25)', glyph: '✱' };
  if (kind === 'rapid') return { color: '#4cc9f0', glow: 'rgba(76,201,240,0.25)', glyph: '≫' };
  if (kind === 'shield') return { color: '#34d399', glow: 'rgba(52,211,153,0.25)', glyph: '◈' };
  return { color: '#fb7185', glow: 'rgba(251,113,133,0.3)', glyph: '✺' };
}

export function drawPlayer(ctx, game) {
  const p = game.player;
  if (!p.alive) return;
  // Blinking while invulnerable.
  if (p.invuln > 0 && Math.floor(game.time * 14) % 2 === 0) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // Shield ring.
  if (game.powerups.shield > 0) {
    ctx.strokeStyle = 'rgba(52,211,153,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Glow.
  ctx.fillStyle = CONFIG.COLORS.playerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius + 7, 0, Math.PI * 2);
  ctx.fill();
  // Hull: a dart with swept wings.
  ctx.fillStyle = CONFIG.COLORS.player;
  ctx.beginPath();
  ctx.moveTo(p.radius + 6, 0);
  ctx.lineTo(-p.radius * 0.7, p.radius * 0.8);
  ctx.lineTo(-p.radius * 0.35, 0);
  ctx.lineTo(-p.radius * 0.7, -p.radius * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f0f9ff';
  ctx.beginPath();
  ctx.arc(2, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawEnemies(ctx, game) {
  for (const e of game.enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    const flash = e.hitFlash > 0;
    if (e.type === 'thorn') {
      drawThorn(ctx, e, flash);
    } else if (e.type === 'spitter') {
      drawSpitter(ctx, e, flash);
    } else if (e.type === 'splitter') {
      drawSplitter(ctx, e, flash);
    } else if (e.type === 'orbiter') {
      drawOrbiter(ctx, e, flash);
    } else if (e.type === 'stinger') {
      drawStinger(ctx, e, game, flash);
    } else if (e.type === 'boss') {
      drawBoss(ctx, e, game, flash);
    }
    ctx.restore();
  }
}

function body(ctx, e, flash) {
  ctx.fillStyle = flash ? '#ffffff' : e.color;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawThorn(ctx, e, flash) {
  // A spiked disc: eight thorns around a dark core.
  ctx.rotate(e.seed + e.x * 0.002);
  ctx.fillStyle = flash ? '#ffffff' : e.color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r1 = e.radius + 7;
    const r2 = e.radius * 0.55;
    ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a + Math.PI / 8) * r2, Math.sin(a + Math.PI / 8) * r2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a0510';
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpitter(ctx, e, flash) {
  body(ctx, e, flash);
  ctx.strokeStyle = '#2a0a2e';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * (0.35 + i * 0.22), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#f5f3ff';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawSplitter(ctx, e, flash) {
  ctx.rotate(e.angle);
  ctx.fillStyle = flash ? '#ffffff' : e.color;
  const r = e.radius;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(0, r * 0.85);
  ctx.lineTo(-r, 0);
  ctx.lineTo(0, -r * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a0e02';
  ctx.beginPath();
  ctx.moveTo(r * 0.5, 0);
  ctx.lineTo(0, r * 0.4);
  ctx.lineTo(-r * 0.5, 0);
  ctx.lineTo(0, -r * 0.4);
  ctx.closePath();
  ctx.fill();
}

function drawOrbiter(ctx, e, flash) {
  ctx.rotate(e.orbitAngle * 2);
  ctx.fillStyle = flash ? '#ffffff' : e.color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(Math.cos(a) * e.radius, Math.sin(a) * e.radius);
    ctx.lineTo(Math.cos(a2) * e.radius * 0.45, Math.sin(a2) * e.radius * 0.45);
  }
  ctx.closePath();
  ctx.fill();
}

function drawStinger(ctx, e, game, flash) {
  // A slim dart. While telegraphing it flashes white with a warning
  // ring, so the lunge is always readable before it fires.
  if (e.dashState === 'tele') {
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 12 + Math.sin(game.time * 20) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.rotate(Math.atan2(e.vy, e.vx));
  ctx.fillStyle = flash ? '#ffffff' : e.color;
  ctx.beginPath();
  ctx.moveTo(e.radius + 8, 0);
  ctx.lineTo(-e.radius * 0.7, e.radius * 0.75);
  ctx.lineTo(-e.radius * 0.3, 0);
  ctx.lineTo(-e.radius * 0.7, -e.radius * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b0213';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawBoss(ctx, e, game, flash) {
  // A huge thornheart with a pulsing core and a health ring.
  const pulse = 1 + 0.05 * Math.sin(game.time * 4);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = flash ? '#ffffff' : e.color;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + e.angle;
    const r1 = e.radius + 12;
    const r2 = e.radius * 0.6;
    ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a + Math.PI / 12) * r2, Math.sin(a + Math.PI / 12) * r2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b0213';
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fda4af';
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * 0.28, 0, Math.PI * 2);
  ctx.fill();
  // Health ring.
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius + 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#fb7185';
  ctx.beginPath();
  ctx.arc(0, 0, e.radius + 18, -Math.PI / 2, -Math.PI / 2 + (e.hp / e.maxHp) * Math.PI * 2);
  ctx.stroke();
}

export function drawBullets(ctx, game) {
  for (const b of game.bullets) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.atan2(b.vy, b.vx));
    ctx.fillStyle = 'rgba(165,243,252,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CONFIG.COLORS.bullet;
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const b of game.ebullets) {
    ctx.fillStyle = 'rgba(255,46,99,0.35)';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff2e63';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawParticles(ctx, game) {
  for (const pt of game.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Floating score text.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of game.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
