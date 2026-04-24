// main.js
import {
  BLOCK_STATUSES,
  setFBlockStatus,
  setPliStatus,
  setTBlockStatus,
  toggleTBlockView,
  setTurnoutView,
  state,
} from "./state.js";
import { updatePhysics } from "./engine.js";
import { CONFIG, ROUTE_DEFINITIONS, turnoutMap } from "./config.js";
import { drawAll, TOP_ROW, BOTTOM_ROW } from "./renderer.js";

let activeRouteDef = null;
let isTrainRunning = false;
let managedRouteState = {
  f: new Set(),
  tMain: new Set(),
  tFlank: new Set(),
  pli: new Set(),
};
const invertedTurnoutSigns = new Set(
  turnoutMap
    .filter((group) => group.pair?.[0] > group.pair?.[1])
    .flatMap((group) => group.pair),
);

function mapSignToView(turnId, sign) {
  const normalized = sign === "+" ? "+" : "-";
  const effective =
    invertedTurnoutSigns.has(turnId) ? (normalized === "+" ? "-" : "+") : normalized;
  return effective === "+" ? "DIAGONAL" : "STRAIGHT";
}

function fillNumberSelect(id, prefix, max) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = "";
  for (let i = 1; i <= max; i += 1) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `${prefix}${i}`;
    select.appendChild(option);
  }
}

function fillStatusSelect(id, statuses) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = "";
  for (const status of statuses) {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    select.appendChild(option);
  }
}

function updateSwitchViewLabel() {
  const switchIdSelect = document.getElementById("switchIdSelect");
  const switchViewLabel = document.getElementById("switchViewLabel");
  if (!switchIdSelect || !switchViewLabel) return;
  const tId = Number(switchIdSelect.value || 0);
  if (tId < 1 || tId > 12) return;
  const baseSign = state.tBlockView[tId] === "DIAGONAL" ? "+" : "-";
  const invertedIds = new Set([3, 4, 7, 8, 11, 12]);
  switchViewLabel.textContent = invertedIds.has(tId)
    ? baseSign === "+" ? "-" : "+"
    : baseSign;
}

function isRouteLocked(type, id) {
  if (type === "f") return managedRouteState.f.has(id);
  if (type === "t") return managedRouteState.tMain.has(id) || managedRouteState.tFlank.has(id);
  if (type === "pli") return managedRouteState.pli.has(id);
  return false;
}

window.applyFStatus = () => {
  const fId = Number(document.getElementById("fIdSelect")?.value || 0);
  const status = document.getElementById("fStatusSelect")?.value || "FREE";
  if (isRouteLocked("f", fId)) return;
  if (fId >= 1 && fId <= 34) setFBlockStatus(fId, status);
};

window.applyTStatus = () => {
  const tId = Number(document.getElementById("tIdSelect")?.value || 0);
  const status = document.getElementById("tStatusSelect")?.value || "FREE";
  if (isRouteLocked("t", tId)) return;
  if (tId >= 1 && tId <= 12) setTBlockStatus(tId, status);
};

window.applyTurnoutView = () => {
  const tId = Number(document.getElementById("switchIdSelect")?.value || 0);
  if (tId >= 1 && tId <= 12) {
    if (isRouteLocked("t", tId)) return;
    toggleTBlockView(tId);
    updateSwitchViewLabel();
  }
};

window.applyPliStatus = () => {
  const pliId = Number(document.getElementById("pliIdSelect")?.value || 0);
  const status = document.getElementById("pliStatusSelect")?.value || "STOP";
  if (isRouteLocked("pli", pliId)) return;
  if (pliId >= 1 && pliId <= 24) setPliStatus(pliId, status);
};

function setRouteMessage(message) {
  const el = document.getElementById("routeMatchLabel");
  if (el) el.textContent = message;
}

function clearManagedRouteStatuses() {
  for (const fId of managedRouteState.f) setFBlockStatus(fId, "FREE");
  for (const tId of managedRouteState.tMain) setTBlockStatus(tId, "FREE");
  for (const tId of managedRouteState.tFlank) setTBlockStatus(tId, "FREE");
  for (const pliId of managedRouteState.pli) setPliStatus(pliId, "STOP");
  managedRouteState = {
    f: new Set(),
    tMain: new Set(),
    tFlank: new Set(),
    pli: new Set(),
  };
}

function clearManagedRouteStatusesPreserveOccupied() {
  for (const fId of managedRouteState.f) {
    if (state.fBlockStatus[fId] !== "OCCUPIED") setFBlockStatus(fId, "FREE");
  }
  for (const tId of managedRouteState.tMain) {
    if (state.tBlockStatus[tId] !== "OCCUPIED") setTBlockStatus(tId, "FREE");
  }
  for (const tId of managedRouteState.tFlank) {
    if (state.tBlockStatus[tId] !== "OCCUPIED") setTBlockStatus(tId, "FREE");
  }
  for (const pliId of managedRouteState.pli) setPliStatus(pliId, "STOP");
  managedRouteState = {
    f: new Set(),
    tMain: new Set(),
    tFlank: new Set(),
    pli: new Set(),
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearOverlapStatuses() {
  for (let fId = 1; fId <= 34; fId += 1) {
    if (state.fBlockStatus[fId] === "OVERLAP") {
      setFBlockStatus(fId, "FREE");
      managedRouteState.f.delete(fId);
    }
  }
  for (let tId = 1; tId <= 12; tId += 1) {
    if (state.tBlockStatus[tId] === "OVERLAP") {
      setTBlockStatus(tId, "FREE");
      managedRouteState.tMain.delete(tId);
    }
  }
}

window.applyRouteFromPli = () => {
  if (isTrainRunning) return;
  const startPli = Number(document.getElementById("routeStartPliSelect")?.value || 0);
  const endPli = Number(document.getElementById("routeEndPliSelect")?.value || 0);
  const route = ROUTE_DEFINITIONS.find((r) => r.startPli === startPli && r.endPli === endPli);

  if (!route) {
    setRouteMessage("NOT FOUND");
    return;
  }

  const hasRedF = [...route.fRoute, ...route.fOverlap].some((id) => state.fBlockStatus[id] === "OCCUPIED");
  const hasRedT = [
    ...route.tRoute.map((t) => t.id),
    ...route.tOverlap,
    ...route.tFlank,
  ].some((id) => state.tBlockStatus[id] === "OCCUPIED");

  if (hasRedF || hasRedT) {
    setRouteMessage("RED BLOCKED");
    return;
  }

  const conflictF = [...route.fRoute, ...route.fOverlap].some((id) => managedRouteState.f.has(id));
  const conflictT = [
    ...route.tRoute.map((t) => t.id),
    ...route.tOverlap,
  ].some((id) => managedRouteState.tMain.has(id));
  const conflictPli = [route.startPli, route.endPli].some((id) => managedRouteState.pli.has(id));

  if (conflictF || conflictT || conflictPli) {
    setRouteMessage("CONFLICT");
    return;
  }

  for (const t of route.tRoute) {
    if (t.id < 1 || t.id > 12) continue;
    setTurnoutView(t.id, mapSignToView(t.id, t.sign));
    setTBlockStatus(t.id, "CLAIM");
    managedRouteState.tMain.add(t.id);
  }

  const lockedTurnouts = [...route.tFlank, ...route.tOverlap];
  for (const tId of lockedTurnouts) {
    if (tId < 1 || tId > 12) continue;
    if (route.tFlank.includes(tId)) {
      if (!managedRouteState.tMain.has(tId)) {
        setTBlockStatus(tId, "FLANK");
      }
      managedRouteState.tFlank.add(tId);
    } else {
      setTBlockStatus(tId, "OVERLAP");
      managedRouteState.tMain.add(tId);
    }
  }

  for (const fId of route.fRoute) {
    if (fId < 1 || fId > 34) continue;
    setFBlockStatus(fId, "CLAIM");
    managedRouteState.f.add(fId);
  }

  for (const fId of route.fOverlap) {
    if (fId < 1 || fId > 34) continue;
    setFBlockStatus(fId, "OVERLAP");
    managedRouteState.f.add(fId);
  }

  setPliStatus(route.startPli, "PROCEED");
  setPliStatus(route.endPli, "STOP");
  managedRouteState.pli.add(route.startPli);
  managedRouteState.pli.add(route.endPli);
  state.activeRoute = route.id;
  activeRouteDef = route;
  setRouteMessage(`${route.id} (${route.code})`);
};

window.clearRoute = () => {
  if (isTrainRunning) return;
  clearManagedRouteStatuses();
  state.activeRoute = null;
  activeRouteDef = null;
  setRouteMessage("CLEARED");
};

window.runTrain = async () => {
  if (isTrainRunning) return;

  const rows = [TOP_ROW, BOTTOM_ROW];
  const getLabelStatus = (label) => {
    const id = Number(label.slice(1));
    if (label.startsWith("F")) return state.fBlockStatus[id] || "FREE";
    if (label.startsWith("T")) return state.tBlockStatus[id] || "FREE";
    return "FREE";
  };

  const setLabelStatus = (label, status) => {
    const id = Number(label.slice(1));
    if (label.startsWith("F")) return setFBlockStatus(id, status);
    if (label.startsWith("T")) return setTBlockStatus(id, status);
    return null;
  };

  const labelSet = new Set([...TOP_ROW, ...BOTTOM_ROW]);
  const adjacency = new Map();

  const addEdge = (a, b) => {
    if (!labelSet.has(a) || !labelSet.has(b)) return;
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a).push(b);
    adjacency.get(b).push(a);
  };

  for (const row of rows) {
    for (let i = 0; i < row.length - 1; i += 1) {
      addEdge(row[i], row[i + 1]);
    }
  }

  for (const group of turnoutMap) {
    const [a, b] = group.pair;
    const aLabel = `T${a}`;
    const bLabel = `T${b}`;
    const aDiag = state.tBlockView?.[a] === "DIAGONAL";
    const bDiag = state.tBlockView?.[b] === "DIAGONAL";
    if (aDiag && bDiag) addEdge(aLabel, bLabel);
  }

  const starts = [];
  for (const label of labelSet) {
    if (getLabelStatus(label) !== "OCCUPIED") continue;
    const neighbors = adjacency.get(label) || [];
    if (neighbors.some((n) => getLabelStatus(n) === "CLAIM")) {
      starts.push(label);
    }
  }

  if (!starts.length) {
    setRouteMessage("SET RED NEXT TO GREEN");
    return;
  }

  const buildPathFromStart = (start) => {
    const queue = [start];
    const visited = new Set([start]);
    const prev = new Map();
    const distance = new Map([[start, 0]]);

    while (queue.length) {
      const current = queue.shift();
      const neighbors = adjacency.get(current) || [];
      for (const n of neighbors) {
        if (visited.has(n)) continue;
        if (n !== start && getLabelStatus(n) !== "CLAIM") continue;
        visited.add(n);
        prev.set(n, current);
        distance.set(n, (distance.get(current) || 0) + 1);
        queue.push(n);
      }
    }

    let farthest = null;
    let farthestDist = 0;
    for (const [node, dist] of distance.entries()) {
      if (node === start) continue;
      if (dist > farthestDist) {
        farthestDist = dist;
        farthest = node;
      }
    }

    if (!farthest) return null;

    const path = [];
    let cursor = farthest;
    while (cursor) {
      path.push(cursor);
      if (cursor === start) break;
      cursor = prev.get(cursor) || null;
    }
    path.reverse();
    return path;
  };

  const componentVisited = new Set();
  const paths = [];
  for (const start of starts) {
    if (componentVisited.has(start)) continue;
    const compQueue = [start];
    const comp = new Set([start]);
    componentVisited.add(start);

    while (compQueue.length) {
      const current = compQueue.shift();
      const neighbors = adjacency.get(current) || [];
      for (const n of neighbors) {
        if (comp.has(n)) continue;
        if (getLabelStatus(n) !== "CLAIM" && getLabelStatus(n) !== "OCCUPIED") continue;
        comp.add(n);
        componentVisited.add(n);
        compQueue.push(n);
      }
    }

    const path = buildPathFromStart(start);
    if (path && path.length > 1) paths.push(path);
  }

  if (!paths.length) {
    setRouteMessage("SET RED NEXT TO GREEN");
    return;
  }

  isTrainRunning = true;
  setRouteMessage(paths.length > 1 ? `RUN x${paths.length}` : "RUN");

  const movePath = async (path) => {
    let current = path[0];
    for (let i = 1; i < path.length; i += 1) {
      const next = path[i];
      const from = current;
      await delay(2000);
      setLabelStatus(next, "OCCUPIED");
      if (i === 1 && activeRouteDef?.startPli) {
        setPliStatus(activeRouteDef.startPli, "STOP");
        managedRouteState.pli.delete(activeRouteDef.startPli);
      }
      setTimeout(() => setLabelStatus(from, "FREE"), 1000);
      current = next;
    }
    return current;
  };

  const stopLabels = await Promise.all(paths.map((path) => movePath(path)));
  await delay(2000);

  isTrainRunning = false;
  clearOverlapStatuses();
  clearManagedRouteStatusesPreserveOccupied();
  state.activeRoute = null;
  activeRouteDef = null;
  setRouteMessage(`STOP @ ${stopLabels.join(", ")}`);
};

function init() {
  const canvas = document.getElementById("trackCanvas");
  canvas.width = CONFIG.canvasWidth;
  canvas.height = CONFIG.canvasHeight;
  fillNumberSelect("fIdSelect", "F", 34);
  fillStatusSelect("fStatusSelect", BLOCK_STATUSES.filter((s) => s !== "FLANK"));
  fillNumberSelect("tIdSelect", "T", 12);
  fillStatusSelect("tStatusSelect", BLOCK_STATUSES.filter((s) => s !== "FLANK"));
  fillNumberSelect("switchIdSelect", "T", 12);
  fillNumberSelect("pliIdSelect", "PLI-", 24);
  fillNumberSelect("routeStartPliSelect", "PLI-", 24);
  fillNumberSelect("routeEndPliSelect", "PLI-", 24);
  setRouteMessage("READY");

  const switchIdSelect = document.getElementById("switchIdSelect");
  if (switchIdSelect) {
    switchIdSelect.addEventListener("change", updateSwitchViewLabel);
    updateSwitchViewLabel();
  }

  setInterval(() => {
    const el = document.getElementById("digitalClock");
    if (el) el.innerText = new Date().toLocaleTimeString();
  }, 1000);

  function loop() {
    updatePhysics();
    drawAll();
    requestAnimationFrame(loop);
  }

  loop();
}

init();
