/* ════════════════════════════════════════════════════════
   TTNB Liga Deportiva – Ruleta 1-100
   roulette.js  |  sin dependencias externas
════════════════════════════════════════════════════════ */
'use strict';

/* ── Colores TTNB del logo ─────────────────────────────
   Orden de bandas: celeste → rosa → amarillo → azul → negro
   Se repiten cada 5 segmentos.                         */
const SEG_COLORS = [
  { bg: '#5BBCD6', txt: '#000000' }, // celeste  → texto negro
  { bg: '#F4A7B9', txt: '#000000' }, // rosa     → texto negro
  { bg: '#F5C800', txt: '#000000' }, // amarillo → texto negro
  { bg: '#1A3A8F', txt: '#FFFFFF' }, // azul     → texto blanco
  { bg: '#111111', txt: '#FFFFFF' }, // negro    → texto blanco
];

const TOTAL  = 100;
const TWO_PI = Math.PI * 2;
const SLICE  = TWO_PI / TOTAL;

/* ── Canvas interno: alta resolución ─────────────────── */
const canvas = document.getElementById('wc');
const ctx    = canvas.getContext('2d');
const INT    = 800;   // píxeles internos (alto DPI)
canvas.width  = INT;
canvas.height = INT;
const CX = INT / 2;  // 400
const CY = INT / 2;  // 400
const R  = CX - 8;   // 392  radio de los segmentos

/* Tamaño de fuente calculado para que el número quepa
   en el arco: arco = R_text * SLICE ≈ 314 * 0.0628 ≈ 19.7 px
   Usamos 10px bold → perfecto sin pisarse              */
const R_TEXT  = R * 0.79;   // ~310  radio donde se dibuja el texto
const FONT_SZ = 11;         // px internos  (se ve grande en alta res)

/* ── Estado ─────────────────────────────────────────── */
let angle    = 0;
let spinning = false;
let raf      = null;
let spins    = 0;
let history  = [];
let maxN     = null;
let minN     = null;
let lastSeg  = -1;


const OWNERS = {
  1:   "Nombre 1",
  2:   "Nombre 2",
  3:   "Nombre 3",
  4:   "Nombre 4",
  5:   "Nombre 5",
  6:   "Nombre 6",
  7:   "Nombre 7",
  8:   "Nombre 8",
  9:   "Nombre 9",
  10:  "Nombre 10",
  11:  "Nombre 11",
  12:  "Nombre 12",
  13:  "Nombre 13",
  14:  "Nombre 14",
  15:  "Nombre 15",
  16:  "Nombre 16",
  17:  "Nombre 17",
  18:  "Nombre 18",
  19:  "Nombre 19",
  20:  "Nombre 20",
  21:  "Nombre 21",
  22:  "Nombre 22",
  23:  "Nombre 23",
  24:  "Nombre 24",
  25:  "Nombre 25",
  26:  "Nombre 26",
  27:  "Nombre 27",
  28:  "Nombre 28",
  29:  "Nombre 29",
  30:  "Nombre 30",
  31:  "Nombre 31",
  32:  "Nombre 32",
  33:  "Nombre 33",
  34:  "Nombre 34",
  35:  "Nombre 35",
  36:  "Nombre 36",
  37:  "Nombre 37",
  38:  "Nombre 38",
  39:  "Nombre 39",
  40:  "Nombre 40",
  41:  "Nombre 41",
  42:  "Nombre 42",
  43:  "Nombre 43",
  44:  "Nombre 44",
  45:  "Nombre 45",
  46:  "Nombre 46",
  47:  "Nombre 47",
  48:  "Nombre 48",
  49:  "Nombre 49",
  50:  "Nombre 50",
  51:  "Nombre 51",
  52:  "Nombre 52",
  53:  "Nombre 53",
  54:  "Nombre 54",
  55:  "Nombre 55",
  56:  "Nombre 56",
  57:  "Nombre 57",
  58:  "Nombre 58",
  59:  "Nombre 59",
  60:  "Nombre 60",
  61:  "Nombre 61",
  62:  "Nombre 62",
  63:  "Nombre 63",
  64:  "Nombre 64",
  65:  "Nombre 65",
  66:  "Nombre 66",
  67:  "Nombre 67",
  68:  "Nombre 68",
  69:  "Nombre 69",
  70:  "Nombre 70",
  71:  "Nombre 71",
  72:  "Nombre 72",
  73:  "Nombre 73",
  74:  "Nombre 74",
  75:  "Nombre 75",
  76:  "Nombre 76",
  77:  "Nombre 77",
  78:  "Nombre 78",
  79:  "Nombre 79",
  80:  "Nombre 80",
  81:  "Nombre 81",
  82:  "Nombre 82",
  83:  "Nombre 83",
  84:  "Nombre 84",
  85:  "Nombre 85",
  86:  "Nombre 86",
  87:  "Nombre 87",
  88:  "Nombre 88",
  89:  "Nombre 89",
  90:  "Nombre 90",
  91:  "Nombre 91",
  92:  "Nombre 92",
  93:  "Nombre 93",
  94:  "Nombre 94",
  95:  "Nombre 95",
  96:  "Nombre 96",
  97:  "Nombre 97",
  98:  "Nombre 98",
  99:  "Nombre 99",
  100: "Nombre 100",

};

/* Bolsa de números disponibles: se vacía de a uno, sin repetir */
let available = [];
function refillBag() {
  available = Array.from({ length: TOTAL }, (_, i) => i + 1); // [1..100]
  shuffleBag();
}
function shuffleBag() {
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
}
refillBag();

/* ═══════════════════════════════════════════════════════
   LAYOUT  –  ajusta tamaño visual del canvas y elementos
═══════════════════════════════════════════════════════ */
function layout() {
  const wrap = document.getElementById('wheelWrap');
  const W    = wrap.clientWidth;
  const H    = wrap.clientHeight;
  const size = Math.min(W * 1, H * 1, 1000);

  // Escala CSS del canvas (interno siempre 800×800)
  canvas.style.width  = size + 'px';
  canvas.style.height = size + 'px';

  // Botón central
  const btn  = document.getElementById('spinBtn');
  const bSz  = Math.round(size * 0.175);
  btn.style.width  = bSz + 'px';
  btn.style.height = bSz + 'px';
  const lbl  = btn.querySelector('.spin-lbl');
  lbl.style.fontSize = Math.round(bSz * 0.19) + 'px';

  // Ticker: a la izquierda del canvas, centrado verticalmente
  const ticker   = document.getElementById('ticker');
  const wrapRect = wrap.getBoundingClientRect();
  // left = margen izquierdo del canvas dentro del wrap
  const canvasLeft = (W - size) / 2;
  ticker.style.left = Math.max(0, canvasLeft - 56) + 'px';
}

window.addEventListener('resize', layout);
layout();

/* ═══════════════════════════════════════════════════════
   DIBUJAR LA RUEDA
═══════════════════════════════════════════════════════ */
function drawWheel(rot) {
  ctx.clearRect(0, 0, INT, INT);

  /* Fondo negro bajo la rueda */
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(CX, CY, R + 14, 0, TWO_PI);
  ctx.fill();

  /* ── 100 segmentos ── */
  for (let i = 0; i < TOTAL; i++) {
    const sa = rot + i * SLICE;
    const ea = sa + SLICE;
    const ci = i % SEG_COLORS.length;
    const { bg, txt } = SEG_COLORS[ci];

    /* Relleno del segmento */
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, sa, ea);
    ctx.closePath();
    ctx.fillStyle = bg;
    ctx.fill();

    /* Línea divisoria oscura */
    ctx.strokeStyle = 'rgba(0,0,0,.7)';
    ctx.lineWidth   = 0.7;
    ctx.stroke();

    /* ── Número: usando clip para que no se salga del segmento ── */
    ctx.save();

    // Clip exacto al segmento
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R - 1, sa, ea);
    ctx.closePath();
    ctx.clip();

    // Posición radial del texto
    const mid = sa + SLICE / 2;
    const tx  = CX + R_TEXT * Math.cos(mid);
    const ty  = CY + R_TEXT * Math.sin(mid);

    ctx.translate(tx, ty);
    // Rotar para que el número apunte hacia afuera (radial)
    ctx.rotate(mid + Math.PI / 2);

    ctx.font         = `900 ${FONT_SZ}px Arial, "Arial Black", sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Sombra de contraste para legibilidad máxima
    ctx.shadowColor  = txt === '#FFFFFF' ? 'rgba(0,0,0,.95)' : 'rgba(255,255,255,.5)';
    ctx.shadowBlur   = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = txt;
    ctx.fillText(String(i + 1), 0, 0);

    ctx.restore();
  }

  /* ── Aros exteriores (de afuera hacia adentro) ── */
  // 1) Negro grueso (borde exterior)
  strokeRing(R,      14, '#000000');
  // 2) Celeste
  strokeRing(R - 7,   5, '#5BBCD6');
  // 3) Rosa
  strokeRing(R - 11,  3, '#F4A7B9');
  // 4) Amarillo fino
  strokeRing(R - 14,  2, '#F5C800');
  // 5) Azul
  strokeRing(R - 16,  2, '#1A3A8F');

  /* ── Centro negro (tapa el vértice de los triángulos) ── */
  const cr = R * 0.112; // radio del botón central en px internos
  ctx.beginPath();
  ctx.arc(CX, CY, cr, 0, TWO_PI);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.strokeStyle = '#F5C800';
  ctx.lineWidth   = 3;
  ctx.stroke();
}

function strokeRing(radius, lineWidth, color) {
  ctx.beginPath();
  ctx.arc(CX, CY, radius, 0, TWO_PI);
  ctx.strokeStyle = color;
  ctx.lineWidth   = lineWidth;
  ctx.stroke();
}

/* ── Primer render ── */
drawWheel(angle);

/* ═══════════════════════════════════════════════════════
   NÚMERO BAJO LA FLECHA
   La flecha está a la IZQUIERDA → apunta al ángulo π
═══════════════════════════════════════════════════════ */
function getNum(rot) {
  const pointer = Math.PI; // izquierda del canvas
  let r = ((rot % TWO_PI) + TWO_PI) % TWO_PI;
  // Índice del segmento cuyo centro coincide con `pointer`
  let raw = (pointer - r - SLICE / 2) / SLICE;
  let idx = Math.round(raw);
  idx = ((idx % TOTAL) + TOTAL) % TOTAL;
  return idx + 1; // 1-based
}

/* ═══════════════════════════════════════════════════════
   TICKER – rebota al pasar cada número
═══════════════════════════════════════════════════════ */
function tickCheck(rot) {
  const s = getNum(rot);
  if (s !== lastSeg) {
    lastSeg = s;
    const el = document.getElementById('ticker');
    el.classList.remove('bounce');
    void el.offsetWidth; // reflow
    el.classList.add('bounce');
    setTimeout(() => el.classList.remove('bounce'), 130);
  }
}

/* ═══════════════════════════════════════════════════════
   ÁNGULO EXACTO PARA CAER EN UN NÚMERO DADO
   La flecha apunta a π (izquierda). Para que el segmento
   del número `num` (1-based) quede bajo la flecha:
     ángulo_segmento_mid = (num-1)*SLICE + SLICE/2
     rot + ángulo_segmento_mid = π  →  rot = π - ángulo_segmento_mid
═══════════════════════════════════════════════════════ */
function angleForNum(num) {
  const segMid = (num - 1) * SLICE + SLICE / 2;
  return Math.PI - segMid;
}

/* ═══════════════════════════════════════════════════════
   GIRAR – el destino siempre es un número no usado
═══════════════════════════════════════════════════════ */
function spin() {
  if (spinning) return;

  // Si se usaron todos los 100, reiniciar la bolsa
  if (available.length === 0) refillBag();

  spinning = true;
  document.getElementById('spinBtn').disabled = true;

  // Ocultar overlay anterior
  document.getElementById('overlay').classList.remove('active');

  // Sacar el próximo número de la bolsa
  const nextNum = available.pop();

  // Ángulo base donde debe quedar la rueda
  const baseTarget = angleForNum(nextNum);

  // Normalizar el ángulo actual
  const curNorm = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
  // Diferencia para llegar al ángulo destino (siempre en sentido horario)
  let diff = ((baseTarget - curNorm) % TWO_PI + TWO_PI) % TWO_PI;
  if (diff < SLICE) diff += TWO_PI; // al menos una vuelta completa extra

  // Agregar vueltas completas aleatorias (mínimo 5, máximo 12)
  const extraTurns = (5 + Math.floor(Math.random() * 8)) * TWO_PI;
  const totalRad   = diff + extraTurns;

  const target = angle + totalRad;
  const dur    = 4200 + Math.random() * 2800; // 4.2-7 s
  const t0     = performance.now();
  const a0     = angle;

  lastSeg = getNum(angle);

  function frame(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 5); // ease-out quíntico
    angle = a0 + totalRad * e;
    drawWheel(angle);
    tickCheck(angle);

    if (p < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      angle = target;
      drawWheel(angle);
      spinning = false;
      document.getElementById('spinBtn').disabled = false;
      finishSpin(nextNum); // pasamos el número garantizado
    }
  }

  raf = requestAnimationFrame(frame);
}

/* ═══════════════════════════════════════════════════════
   FIN DEL GIRO
═══════════════════════════════════════════════════════ */
function finishSpin(num) {
  // `num` viene garantizado desde spin() – no se repite

  document.getElementById('currNum').textContent = num;

  spins++;
  document.getElementById('sGiros').textContent = spins;

  if (maxN === null || num > maxN) { maxN = num; document.getElementById('sMax').textContent = maxN; }
  if (minN === null || num < minN) { minN = num; document.getElementById('sMin').textContent = minN; }

  history.unshift(num);
  renderHistory();
  showOverlay(num);
  confetti();
}

/* ═══════════════════════════════════════════════════════
   HISTORIAL
═══════════════════════════════════════════════════════ */
function renderHistory() {
  const ul = document.getElementById('histList');
  ul.innerHTML = '';
  history.slice(0, 16).forEach((n, i) => {
    const li = document.createElement('li');
    li.textContent = n;
    if (i === 0) li.classList.add('new');
    ul.appendChild(li);
  });
}

/* ═══════════════════════════════════════════════════════
   OVERLAY NÚMERO GRANDE
═══════════════════════════════════════════════════════ */
function showOverlay(num) {
  const ov  = document.getElementById('overlay');
  const sp  = document.getElementById('overlayNum');
  sp.innerHTML = `<div style="font-size:1em">${num}</div><div style="font-size:0.25em; letter-spacing:1px;">${OWNERS[num] || 'Sin asignar'}</div>`;
  // Reinicia la animación
  sp.style.animation = 'none';
  void sp.offsetWidth;
  sp.style.animation = '';
  ov.classList.add('active');
  setTimeout(() => ov.classList.remove('active'), 2500);
}

/* ═══════════════════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════════════════ */
function confetti() {
  const cols = ['#F5C800', '#5BBCD6', '#F4A7B9', '#1A3A8F', '#FFFFFF'];
  const cx   = window.innerWidth  / 2;
  const cy   = window.innerHeight / 2;
  for (let i = 0; i < 55; i++) {
    const d   = document.createElement('div');
    d.className = 'pt';
    const ang = Math.random() * 360;
    const r   = 100 + Math.random() * 320;
    const dx  = Math.cos(ang * Math.PI / 180) * r;
    const dy  = Math.sin(ang * Math.PI / 180) * r;
    const sz  = 6 + Math.random() * 10;
    const del = Math.random() * 0.3;
    const br  = Math.random() > 0.5 ? '50%' : '3px';
    d.style.cssText = `
      left:${cx}px; top:${cy}px;
      width:${sz}px; height:${sz}px;
      background:${cols[i % cols.length]};
      --dx:${dx}px; --dy:${dy}px;
      animation-delay:${del}s;
      border-radius:${br};
    `;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1400 + del * 1000);
  }
}

/* ═══════════════════════════════════════════════════════
   REINICIAR
═══════════════════════════════════════════════════════ */
function resetGame() {
  if (spinning) {
    cancelAnimationFrame(raf);
    spinning = false;
    document.getElementById('spinBtn').disabled = false;
  }
  spins = 0; maxN = null; minN = null;
  history = []; angle = 0; lastSeg = -1;

  document.getElementById('sGiros').textContent = '0';
  document.getElementById('sMax').textContent   = '–';
  document.getElementById('sMin').textContent   = '–';
  document.getElementById('currNum').textContent = '–';
  document.getElementById('histList').innerHTML  = '';
  document.getElementById('overlay').classList.remove('active');

  refillBag();   // resetear la bolsa de 100 números
  drawWheel(angle);
}
