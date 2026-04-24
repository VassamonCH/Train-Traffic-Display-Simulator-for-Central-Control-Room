import { CONFIG } from "./config.js";

export const BLOCK_STATUSES = [
  "FREE",
  "CLAIM",
  "OCCUPIED",
  "FLANK",
  "OVERLAP",
];

export let state = {
  isAuto: true,
  turnouts: Array(13).fill(false),
  reservedRoutes: new Set(),
  currentTime: 0,
  selectedStartPTI: null,
  selectedEndPTI: null,
  reservedTracks: new Set(),
  reservedTurnouts: new Set(),
  activeRoute: null,
  blocks: Array.from({ length: 36 }, (_, i) => ({
    id: i + 1,
    occupied: false,
    locked: false,
  })),
  tBlockView: Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [i + 1, "STRAIGHT"]),
  ),
  tBlockStatus: Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [i + 1, "FREE"]),
  ),
  tBlockStatusLastNonFlank: Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [i + 1, "FREE"]),
  ),
  fBlockStatus: Object.fromEntries(
    Array.from({ length: 34 }, (_, i) => [i + 1, "FREE"]),
  ),
  pliStatus: Object.fromEntries(
    Array.from({ length: 24 }, (_, i) => [i + 1, "STOP"]),
  ),
};

export function toggleAutoMode() {
  state.isAuto = !state.isAuto;
  if (!state.isAuto) state.reservedRoutes.clear();
  return state.isAuto;
}

export function toggleTBlockView(turnId) {
  const current = state.tBlockView[turnId] || "STRAIGHT";
  const next = current === "STRAIGHT" ? "DIAGONAL" : "STRAIGHT";
  state.tBlockView[turnId] = next;
  return next;
}

export function setTurnoutView(turnId, view) {
  state.tBlockView[turnId] = view === "DIAGONAL" ? "DIAGONAL" : "STRAIGHT";
  return state.tBlockView[turnId];
}

export function cycleTBlockStatus(turnId) {
  const current = state.tBlockStatus[turnId] || "FREE";
  const next =
    current === "FREE" ? "CLAIM" : current === "CLAIM" ? "OCCUPIED" : "FREE";
  state.tBlockStatus[turnId] = next;
  return next;
}

export function setTBlockStatus(turnId, status) {
  const normalized = status === "ROUTE" ? "CLAIM" : status;
  const value = BLOCK_STATUSES.includes(normalized) ? normalized : "FREE";
  state.tBlockStatus[turnId] = value;
  if (value !== "FLANK") {
    state.tBlockStatusLastNonFlank[turnId] = value;
  }
  if (value === "FLANK") {
    // Force flank-protected turnout to straight alignment.
    state.tBlockView[turnId] = "STRAIGHT";
  }
  return value;
}

export function setFBlockStatus(fid, status) {
  const normalized = status === "ROUTE" ? "CLAIM" : status;
  const value = BLOCK_STATUSES.includes(normalized) ? normalized : "FREE";
  state.fBlockStatus[fid] = value;
  return value;
}

export function togglePliStatus(pliId) {
  const current = state.pliStatus[pliId] || "STOP";
  const next = current === "STOP" ? "PROCEED" : "STOP";
  state.pliStatus[pliId] = next;
  return next;
}

export function setPliStatus(pliId, status) {
  const value = status === "PROCEED" ? "PROCEED" : "STOP";
  state.pliStatus[pliId] = value;
  return value;
}
