const canvas = document.getElementById('artboard');
const ctx = canvas.getContext('2d');

const DPR = Math.min(window.devicePixelRatio || 1, 2);
let vw = 0, vh = 0, rafId = 0, startTs = performance.now();

function resizeCanvas() {
  vw = canvas.clientWidth;
  vh = canvas.clientHeight;
  canvas.width = Math.floor(vw * DPR);
  canvas.height = Math.floor(vh * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Utility
const TAU = Math.PI * 2;
const rand = (a,b)=> a + Math.random()*(b-a);
const lerp = (a,b,t)=> a + (b-a)*t;

// Palette
const colors = {
  bgDeep: '#060a1a',
  bgTop: '#0e1b44',
  cyan: '#00d1ff',
  cyanSoft: '#5af3ff',
  blue: '#3a7bff',
  white: '#f4f8ff',
};

// Particles: flow field inspired without noise lib
const PARTICLE_COUNT = 800;
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  life: rand(0.2, 1),
  size: rand(0.6, 1.8),
  hue: rand(185, 200),
  speed: rand(0.15, 0.6),
}));

function fieldVector(x, y, t) {
  // Curated trigonometric field ? smooth, coherent
  const s = 0.0018;
  const a = Math.sin(x * s + t * 0.0005) + Math.cos(y * s * 1.2 - t * 0.0003);
  const b = Math.cos(y * s + t * 0.0007) - Math.sin(x * s * 0.8 - t * 0.0004);
  return { vx: a, vy: b };
}

function stepParticles(t) {
  for (const p of particles) {
    const { vx, vy } = fieldVector(p.x, p.y, t);
    p.x += vx * p.speed * 1.6;
    p.y += vy * p.speed * 1.6;
    if (p.x < -10) p.x = vw + 10; if (p.x > vw + 10) p.x = -10;
    if (p.y < -10) p.y = vh + 10; if (p.y > vh + 10) p.y = -10;
  }
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 28);
    g.addColorStop(0, `hsla(${p.hue}, 100%, 75%, 0.25)`);
    g.addColorStop(1, 'hsla(190, 100%, 60%, 0.0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14 * p.size, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawBackground(t) {
  const grad = ctx.createLinearGradient(0, 0, vw, vh);
  grad.addColorStop(0, colors.bgTop);
  grad.addColorStop(0.5, '#0a1024');
  grad.addColorStop(1, colors.bgDeep);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, vw, vh);

  // Subtle vignette
  const vg = ctx.createRadialGradient(vw * 0.5, vh * 0.52, 0, vw * 0.5, vh * 0.52, Math.max(vw, vh));
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, vw, vh);

  // Cinematic flares
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const flare = ctx.createLinearGradient(0, 0, vw * 0.8, 0);
  flare.addColorStop(0, 'rgba(0,209,255,0.06)');
  flare.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = flare;
  ctx.fillRect(0, vh * 0.2, vw, 8);
  ctx.fillRect(0, vh * 0.78, vw, 12);
  ctx.restore();
}

function drawDataWaves(t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const yBase = lerp(vh * 0.35, vh * 0.7, i / (layers - 1));
    const amp = lerp(18, 48, i / (layers - 1));
    const speed = 0.0006 + i * 0.00025;
    const hue = 185 + i * 6;

    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.33 - i * 0.06})`;
    ctx.lineWidth = 1.6 + i * 0.5;
    ctx.beginPath();
    for (let x = 0; x <= vw; x += 6) {
      const y = yBase + Math.sin((x + t * speed * 1200) * 0.012 + i) * amp * Math.sin(x * 0.003 + i) * 0.6;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawHUDRects() {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const boxes = [
    { x: vw * 0.08, y: vh * 0.16, w: 260, h: 54, a: 0.18 },
    { x: vw * 0.12, y: vh * 0.24, w: 320, h: 54, a: 0.12 },
    { x: vw * 0.18, y: vh * 0.32, w: 220, h: 44, a: 0.16 },
  ];
  for (const b of boxes) {
    const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
    g.addColorStop(0, `rgba(0,209,255,${b.a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  }
  ctx.restore();
}

function drawBranding(t) {
  ctx.save();
  // Title
  const title = 'Lumina Intelligence';
  ctx.font = `900 ${Math.max(42, vw * 0.07)}px Inter, system-ui, sans-serif`;
  const grad = ctx.createLinearGradient(0, 0, 0, Math.max(42, vw * 0.07));
  grad.addColorStop(0, '#e8f9ff');
  grad.addColorStop(0.4, '#5af3ff');
  grad.addColorStop(1, '#00d1ff');
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0,209,255,0.2)';
  ctx.shadowBlur = 24;
  ctx.fillText(title, vw * 0.08, vh * 0.24);

  // Subtitle
  ctx.font = `600 ${Math.max(12, vw * 0.018)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(166,179,208,0.95)';
  ctx.shadowBlur = 0;
  ctx.fillText('Global digital marketing. Human connection. Exponential growth.', vw * 0.08, vh * 0.24 + Math.max(42, vw * 0.07) * 0.42);

  // Pill
  const pillX = vw * 0.08, pillY = vh * 0.24 - Math.max(42, vw * 0.07) * 0.75;
  const pillW = 112, pillH = 28, r = 14;
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#dbe7f6';
  roundRect(ctx, pillX, pillY, pillW, pillH, r); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.stroke();
  ctx.fillStyle = '#0a1a26';
  ctx.font = '700 12px Inter, system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('AI-DRIVEN', pillX + 16, pillY + pillH / 2);
  ctx.restore();

  ctx.restore();
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

function drawRightHolo(t) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const cx = vw * 0.75, cy = vh * 0.5, R = Math.min(vw, vh) * 0.22;

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
  glow.addColorStop(0, 'rgba(90,243,255,0.65)');
  glow.addColorStop(0.5, 'rgba(0,194,255,0.2)');
  glow.addColorStop(1, 'rgba(0,194,255,0.0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

  // Orbits
  ctx.strokeStyle = 'rgba(155,232,255,0.85)';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * (1 - i * 0.12), R * (0.22 + i * 0.22), 0, 0, TAU);
    ctx.stroke();
  }

  // Data node
  const ang = (t * 0.001) % TAU;
  const nx = cx + Math.cos(ang) * R * 0.98;
  const ny = cy + Math.sin(ang) * R * 0.22;
  const nodeG = ctx.createRadialGradient(nx, ny, 0, nx, ny, 16);
  nodeG.addColorStop(0, 'rgba(232,249,255,0.9)');
  nodeG.addColorStop(1, 'rgba(232,249,255,0.0)');
  ctx.fillStyle = nodeG; ctx.beginPath(); ctx.arc(nx, ny, 6, 0, TAU); ctx.fill();

  // Beams
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(0,209,255,0.35)';
  for (let i = 0; i < 6; i++) {
    const a = ang + (i * TAU) / 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R * 0.96, cy + Math.sin(a) * R * 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

function frame(ts) {
  const t = ts - startTs;
  drawBackground(t);
  drawDataWaves(t);
  drawHUDRects();
  stepParticles(t);
  drawParticles();
  drawRightHolo(t);
  drawBranding(t);
  rafId = requestAnimationFrame(frame);
}
rafId = requestAnimationFrame(frame);

// Export functionality
async function exportPNG(width, height) {
  const off = document.createElement('canvas');
  const ratio = width / canvas.clientWidth;
  off.width = width; off.height = height;
  const c = off.getContext('2d');
  const scale = width / vw; // scale relative to live vw

  // Recreate scene at target resolution
  const temp = { ctx: ctx, vw: vw, vh: vh };
  const saved = { vw, vh };
  vw = width; vh = height;
  const tmpCtx = ctx;
  const localCtx = c;
  // hijack ctx used by draw functions
  // by rebinding ctx methods via proxy-like assignment
  const originalCtx = ctx;
  // Instead of proxying, copy functions to use local context
  function withLocal(fn){ const _ctx = ctx; ctx = localCtx; try{ fn(); } finally { ctx = _ctx; } }

  const t = performance.now() - startTs + 1600; // deterministic, slightly advanced for nicer positions
  withLocal(()=>{ drawBackground(t); });
  withLocal(()=>{ drawDataWaves(t); });
  // synthesize a denser particle snapshot
  const tempParticles = Array.from({ length: PARTICLE_COUNT * 1.5 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    life: 1,
    size: rand(0.6, 1.8),
    hue: rand(185, 200),
    speed: rand(0.15, 0.6),
  }));
  withLocal(()=>{
    localCtx.save();
    localCtx.globalCompositeOperation = 'lighter';
    for (const p of tempParticles) {
      const g = localCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 32);
      g.addColorStop(0, `hsla(${p.hue}, 100%, 75%, 0.28)`);
      g.addColorStop(1, 'hsla(190, 100%, 60%, 0.0)');
      localCtx.fillStyle = g;
      localCtx.beginPath();
      localCtx.arc(p.x, p.y, 16 * p.size, 0, TAU);
      localCtx.fill();
    }
    localCtx.restore();
  });
  withLocal(()=>{ drawRightHolo(t); });
  withLocal(()=>{ drawHUDRects(); });
  withLocal(()=>{ drawBranding(t); });

  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `lumina-ai-${width}x${height}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // restore size vars
      vw = saved.vw; vh = saved.vh;
      resolve();
    }, 'image/png');
  });
}

const export4kBtn = document.getElementById('export4k');
const export1080Btn = document.getElementById('export1080');
export4kBtn.addEventListener('click', ()=> exportPNG(3840, 2160));
export1080Btn.addEventListener('click', ()=> exportPNG(1920, 1080));
