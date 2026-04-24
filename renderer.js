// renderer.js
import { CONFIG, turnoutMap } from "./config.js";
import { state } from "./state.js";

const canvas = document.getElementById("trackCanvas");
const ctx = canvas.getContext("2d");

const tHitAreas = [];
const pliHitAreas = [];

export const TOP_ROW = [
  "F1", "T1", "F3", "F5", "F7", "T3", "F9", "F11", "F13", "T5", "F15", "F17",
  "F19", "T7", "F21", "F23", "F25", "T9", "F27", "F29", "F31", "T11", "F33",
];

export const BOTTOM_ROW = [
  "F2", "F4", "T2", "F6", "T4", "F8", "F10", "F12", "F14", "F16", "T6", "F18",
  "T8", "F20", "F22", "F24", "F26", "F28", "T10", "F30", "T12", "F32", "F34",
];

const BLOCK_W = 58;
const BLOCK_H = 18;
const GAP = 4;
const PITCH = BLOCK_W + GAP;
function getRowStartX() {
  const trackLength = (TOP_ROW.length - 1) * PITCH;
  return (canvas.width - trackLength) / 2;
}
const TURNOUT_ANCHOR_OFFSET_Y = 22;
const BLOCK_FONT = 15;

function getStraightTurnoutX() {
  const map = new Map();
  const rowStartX = getRowStartX();

  TOP_ROW.forEach((label, idx) => {
    if (label.startsWith("T")) map.set(Number(label.slice(1)), rowStartX + idx * PITCH);
  });

  BOTTOM_ROW.forEach((label, idx) => {
    if (label.startsWith("T")) map.set(Number(label.slice(1)), rowStartX + idx * PITCH);
  });

  return map;
}

export function drawAll() {
  tHitAreas.length = 0;
  pliHitAreas.length = 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBallastBed();
  drawFBlocks();
  drawTurnoutBlocks();
  drawPliPoints();
  drawStations();
}

function drawBallastBed() {
  ctx.save();
  ctx.fillStyle = "#1e293b";

  const rowStartX = getRowStartX();
  const trackLeft = rowStartX - BLOCK_W / 2 - 20;
  const trackRight = rowStartX + (TOP_ROW.length - 1) * PITCH + BLOCK_W / 2 + 20;
  const width = trackRight - trackLeft;

  [CONFIG.upperY, CONFIG.lowerY].forEach((y) => {
    ctx.beginPath();
    ctx.roundRect(trackLeft, y - 18, width, 36, 8);
    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  ctx.restore();
}

function drawFBlocks() {
  TOP_ROW.forEach((label, idx) => {
    if (!label.startsWith("F")) return;
    const x = getRowStartX() + idx * PITCH;
    const fId = Number(label.slice(1));
    drawTrackBlock(label, x, CONFIG.upperY, state.fBlockStatus?.[fId] || "FREE");
  });

  BOTTOM_ROW.forEach((label, idx) => {
    if (!label.startsWith("F")) return;
    const x = getRowStartX() + idx * PITCH;
    const fId = Number(label.slice(1));
    drawTrackBlock(label, x, CONFIG.lowerY, state.fBlockStatus?.[fId] || "FREE");
  });
}

function drawTrackBlock(label, x, y, status = "FREE") {
  const bg = getBlockStatusColor(status);

  ctx.beginPath();
  ctx.fillStyle = bg;
  ctx.rect(x - BLOCK_W / 2, y - BLOCK_H / 2, BLOCK_W, BLOCK_H);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#0b1220";
  ctx.stroke();

  ctx.fillStyle = "#0026ff";
  ctx.font = `${BLOCK_FONT}px 'JetBrains Mono'`;
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 5);

  if (status === "OCCUPIED") {
    drawTrainIcon(x, y - 16);
  }
}

function drawTurnoutBlocks() {
  turnoutMap.forEach((group) => {
    drawTurnoutEndpointBlock(group, true);
    drawTurnoutEndpointBlock(group, false);
  });
}

function drawTurnoutEndpointBlock(group, isFrom) {
  const endpoint = getEndpointPoint(group, isFrom);
  const other = getEndpointPoint(group, !isFrom);
  const turnId = getTurnoutIdForEndpoint(group, isFrom);

  const view = state.tBlockView?.[turnId] || "STRAIGHT";
  const status = state.tBlockStatus?.[turnId] || "FREE";
  const activeColor =
    status === "FLANK"
      ? getBlockStatusColor(state.tBlockStatusLastNonFlank?.[turnId] || "FREE")
      : getBlockStatusColor(status);
  const inactiveColor = "#9ca3af";

  const straightCenter = { x: endpoint.x, y: endpoint.laneY };
  const diagCenter = lerpPoint(endpoint, other, 0.28);
  const angle = Math.atan2(other.y - endpoint.y, other.x - endpoint.x);

  drawTurnoutBlockRect(
    `T${turnId}`,
    straightCenter.x,
    straightCenter.y,
    0,
    view === "STRAIGHT" ? activeColor : inactiveColor,
    status,
    view === "STRAIGHT"
  );
  drawTurnoutBlockRect(
    `T${turnId}`,
    diagCenter.x,
    diagCenter.y,
    angle,
    view === "DIAGONAL" ? activeColor : inactiveColor,
    status,
    view === "DIAGONAL"
  );

  if (view === "DIAGONAL") {
    drawTurnoutSign(diagCenter.x, diagCenter.y, angle, "+");
  }

  if (view === "STRAIGHT") {
    tHitAreas.push({ id: turnId, x: straightCenter.x, y: straightCenter.y, w: BLOCK_W, h: BLOCK_H });
  } else {
    tHitAreas.push({ id: turnId, x: diagCenter.x, y: diagCenter.y, w: BLOCK_W, h: BLOCK_H });
  }
}

function getBlockStatusColor(status) {
  if (status === "OCCUPIED") return "#ef4444";
  if (status === "CLAIM") return "#22c55e";
  if (status === "FLANK") return "#ffffff";
  if (status === "OVERLAP") return "#ffffff";
  return "#ffff00";
}

function drawTurnoutBlockRect(label, x, y, angle, fill, status, isActive) {
  const w = BLOCK_W;
  const h = BLOCK_H;

  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);

  ctx.beginPath();
  ctx.fillStyle = fill;
  ctx.rect(-w / 2, -h / 2, w, h);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#0b1220";
  ctx.stroke();

  ctx.fillStyle = "#0026ff";
  ctx.font = `${BLOCK_FONT}px 'JetBrains Mono'`;
  ctx.textAlign = "center";
  ctx.fillText(label, 0, 5);

  if (status === "OCCUPIED" && isActive) {
    const lowerOnDiagonal = new Set(["T2", "T3", "T6", "T7", "T10", "T11"]);
    const shouldLower = lowerOnDiagonal.has(label) && state.tBlockView?.[Number(label.slice(1))] === "DIAGONAL";
    const offsetX = 0;
    const offsetY = shouldLower ? 16 : -16;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    drawTrainIconLocal();
    ctx.restore();
  }

  ctx.restore();
}

function drawTurnoutSign(x, y, angle, sign) {
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px 'JetBrains Mono'";
  ctx.textAlign = "left";
  ctx.fillText(sign, BLOCK_W / 2 + 6, 4);
  ctx.restore();
}

function drawTrainIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  drawTrainIconLocal();
  ctx.restore();
}

function drawTrainIconLocal() {
  // Long red train silhouette inspired by the provided reference
  const w = 44;
  const h = 14;

  // subtle shadow to help the train "float" above the block
  ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, h / 2 + 4, w / 2 - 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // body
  ctx.fillStyle = "#d32f2f";
  ctx.strokeStyle = "#0b1220";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 6);
  ctx.fill();
  ctx.stroke();

  // nose caps
  ctx.fillStyle = "#e11d48";
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 6, -h / 2 + 1, 10, h - 2, 6);
  ctx.roundRect(w / 2 - 4, -h / 2 + 1, 10, h - 2, 6);
  ctx.fill();
  ctx.stroke();

  // windows strip
  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 6, -h / 2 + 3, w - 12, h - 6, 4);
  ctx.fill();

  // window separators + tint
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 1;
  for (let i = -w / 2 + 10; i <= w / 2 - 10; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, -h / 2 + 4);
    ctx.lineTo(i, h / 2 - 4);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 7, -h / 2 + 4, w - 14, h - 8, 3);
  ctx.fill();

  // red stripe
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 2, h / 2 - 2);
  ctx.lineTo(w / 2 - 2, h / 2 - 2);
  ctx.stroke();

  // roof line
  ctx.strokeStyle = "#9f1239";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 4, -h / 2 + 2);
  ctx.lineTo(w / 2 - 4, -h / 2 + 2);
  ctx.stroke();

  // door hint
  ctx.strokeStyle = "#1f2937";
  ctx.beginPath();
  ctx.moveTo(-2, -h / 2 + 4);
  ctx.lineTo(-2, h / 2 - 4);
  ctx.stroke();

  // front headlight
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(w / 2 + 2, 1, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // wheels
  ctx.fillStyle = "#111827";
  [-14, -6, 6, 14].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, h / 2 + 1, 1.6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPliPoints() {
  turnoutMap.forEach((group) => {
    const from = getEndpointPoint(group, true);
    const to = getEndpointPoint(group, false);
    drawEndpointPliPair(from, group.pti[0]);
    drawEndpointPliPair(to, group.pti[1]);
  });
}

function drawEndpointPliPair(p, pair) {
  drawPliDot(p.x - 28, p.y, pair[0], "left");
  drawPliDot(p.x + 28, p.y, pair[1], "right");
}

function drawPliDot(x, y, pliId, side) {
  const offset = getPliOffset(pliId, side);
  const px = x + offset.dx;
  const py = y + offset.dy;
  const isProceed = state.pliStatus?.[pliId] === "PROCEED";
  const color = isProceed ? "#ffffff" : "#ff0000";

  pliHitAreas.push({ id: pliId, x: px, y: py, r: 8 });

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#0f172a";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "12px 'JetBrains Mono'";
  ctx.textAlign = side === "left" ? "right" : "left";
  ctx.fillText(`PLI-${pliId}`, side === "left" ? px - 6 : px + 6, py + 4);
}

function getPliOffset(pliId, side) {
  const spaced = new Set([4, 6, 12, 14, 20, 22]);
  if (!spaced.has(pliId)) return { dx: 0, dy: 0 };

  const dx = side === "left" ? 18 : -18;
  return { dx, dy: 0 };
}

// (no PLI-to-F override)

function drawStations() {
  for (let i = 0; i < turnoutMap.length; i += 2) {
    const left = turnoutMap[i];
    const right = turnoutMap[i + 1];
    if (!left || !right) continue;

  const x = (getEndpointPoint(left, false).x + getEndpointPoint(right, false).x) / 2;
    const n = i / 2 + 1;

    drawStationTag(x, CONFIG.upperY - 42, `ST${n}`);
    drawStationTag(x, CONFIG.lowerY + 42, `ST${n}`);
  }
}

function drawStationTag(x, y, text) {
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(x - 36, y - 16, 72, 32);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0a32ff";
  ctx.font = "20px 'JetBrains Mono'";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + 7);
}

function getEndpointPoint(group, isFrom) {
  const f = isFrom ? group.fromF : group.toF;
  const laneY = f % 2 !== 0 ? CONFIG.upperY : CONFIG.lowerY;
  const turnId = getTurnoutIdByLane(group.pair, laneY);
  const straightTurnoutX = getStraightTurnoutX();
  const x = straightTurnoutX.get(turnId) ?? CONFIG.startX;
  const y = laneY === CONFIG.upperY ? laneY + TURNOUT_ANCHOR_OFFSET_Y : laneY - TURNOUT_ANCHOR_OFFSET_Y;
  return { x, y, laneY };
}

function getTurnoutIdForEndpoint(group, isFrom) {
  const f = isFrom ? group.fromF : group.toF;
  const laneY = f % 2 !== 0 ? CONFIG.upperY : CONFIG.lowerY;
  return getTurnoutIdByLane(group.pair, laneY);
}

function getTurnoutIdByLane(pair, laneY) {
  const [a, b] = pair;
  const odd = a % 2 !== 0 ? a : b;
  const even = a % 2 === 0 ? a : b;
  return laneY === CONFIG.upperY ? odd : even;
}

function lerpPoint(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

// (intentionally left without train heading helpers)

export function hitTestTBlock(x, y) {
  for (const b of tHitAreas) {
    if (
      x >= b.x - b.w / 2 &&
      x <= b.x + b.w / 2 &&
      y >= b.y - b.h / 2 &&
      y <= b.y + b.h / 2
    ) {
      return b.id;
    }
  }
  return null;
}

export function hitTestPliPoint(x, y) {
  for (const p of pliHitAreas) {
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy <= p.r * p.r) return p.id;
  }
  return null;
}
