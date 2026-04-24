// config.js
export const CONFIG = {
    startX: 60,
    spacing: 42,
    upperY: 80,
    lowerY: 260,
    canvasWidth: 1600,
    canvasHeight: 400,
    colors: {
        track: "#1e293b",
        occupied: "#f97316",
        cyan: "#00f2ff",
        stop: "#ef4444",
        go: "#22c55e",
        signalYellow: "#fbff00"
    }
};

export const stations = [
  { name: "Central Station", x: 400, y: CONFIG.upperY, stopTime: 5000 },
  { name: "North Plaza", x: 1200, y: CONFIG.lowerY, stopTime: 5000 }
];


export const turnoutMap = [
    { pair: [1, 2], fromF: 3, toF: 6, pti: [[1, 3], [2, 4]], label: "T1-T2" },
    { pair: [4, 3], fromF: 8, toF: 9, pti: [[6, 8], [5, 7]], label: "T4-T3" },
    { pair: [5, 6], fromF: 13, toF: 16, pti: [[9, 11], [10, 12]], label: "T5-T6" },
    { pair: [8, 7], fromF: 20, toF: 21, pti: [[14, 16], [13, 15]], label: "T8-T7" },
    { pair: [9, 10], fromF: 25, toF: 28, pti: [[17, 19], [18, 20]], label: "T9-T10" },
    { pair: [12, 11], fromF: 30, toF: 31, pti: [[22, 24], [21, 23]], label: "T12-T11" }
];

export const ROUTE_DEFINITIONS = [
  { id: "R1", code: "NNF1", startPli: 1, endPli: 5, tRoute: [{ id: 1, sign: "-" }], tFlank: [2], tOverlap: [3], fRoute: [3, 5, 7], fOverlap: [9] },
  { id: "R2", code: "NNF2", startPli: 5, endPli: 9, tRoute: [{ id: 3, sign: "+" }], tFlank: [4], tOverlap: [5], fRoute: [9, 11, 13], fOverlap: [15] },
  { id: "R3", code: "NNF3", startPli: 9, endPli: 13, tRoute: [{ id: 5, sign: "-" }], tFlank: [6], tOverlap: [7], fRoute: [15, 17, 19], fOverlap: [21] },
  { id: "R4", code: "NNF4", startPli: 13, endPli: 17, tRoute: [{ id: 7, sign: "+" }], tFlank: [8], tOverlap: [9], fRoute: [21, 23, 25], fOverlap: [27] },
  { id: "R5", code: "NNF5", startPli: 17, endPli: 21, tRoute: [{ id: 9, sign: "-" }], tFlank: [10], tOverlap: [11], fRoute: [27, 29, 31], fOverlap: [33] },
  { id: "R6", code: "NNB1", startPli: 23, endPli: 19, tRoute: [{ id: 11, sign: "+" }], tFlank: [12], tOverlap: [9], fRoute: [31, 29, 27], fOverlap: [25] },
  { id: "R7", code: "NNB2", startPli: 19, endPli: 15, tRoute: [{ id: 9, sign: "-" }], tFlank: [10], tOverlap: [7], fRoute: [25, 23, 21], fOverlap: [19] },
  { id: "R8", code: "NNB3", startPli: 15, endPli: 11, tRoute: [{ id: 7, sign: "+" }], tFlank: [8], tOverlap: [5], fRoute: [19, 17, 15], fOverlap: [13] },
  { id: "R9", code: "NNB4", startPli: 11, endPli: 7, tRoute: [{ id: 5, sign: "-" }], tFlank: [6], tOverlap: [3], fRoute: [13, 11, 9], fOverlap: [7] },
  { id: "R10", code: "NNB5", startPli: 7, endPli: 3, tRoute: [{ id: 3, sign: "+" }], tFlank: [4], tOverlap: [1], fRoute: [7, 5, 3], fOverlap: [1] },
  { id: "R11", code: "SSF1", startPli: 2, endPli: 6, tRoute: [{ id: 2, sign: "-" }], tFlank: [1], tOverlap: [4], fRoute: [6], fOverlap: [8] },
  { id: "R12", code: "SSF2", startPli: 6, endPli: 10, tRoute: [{ id: 4, sign: "+" }], tFlank: [3], tOverlap: [6], fRoute: [8, 10, 12, 14, 16], fOverlap: [18] },
  { id: "R13", code: "SSF3", startPli: 10, endPli: 14, tRoute: [{ id: 6, sign: "-" }], tFlank: [5], tOverlap: [8], fRoute: [18], fOverlap: [20] },
  { id: "R14", code: "SSF4", startPli: 14, endPli: 18, tRoute: [{ id: 8, sign: "+" }], tFlank: [7], tOverlap: [10], fRoute: [20, 22, 24, 26, 28], fOverlap: [30] },
  { id: "R15", code: "SSF5", startPli: 18, endPli: 22, tRoute: [{ id: 10, sign: "-" }], tFlank: [9], tOverlap: [12], fRoute: [30], fOverlap: [32] },
  { id: "R16", code: "SSB1", startPli: 24, endPli: 20, tRoute: [{ id: 12, sign: "+" }], tFlank: [11], tOverlap: [10], fRoute: [30], fOverlap: [28] },
  { id: "R17", code: "SSB2", startPli: 20, endPli: 16, tRoute: [{ id: 10, sign: "-" }], tFlank: [9], tOverlap: [8], fRoute: [28, 26, 24, 22, 20], fOverlap: [18] },
  { id: "R18", code: "SSB3", startPli: 16, endPli: 12, tRoute: [{ id: 8, sign: "+" }], tFlank: [7], tOverlap: [6], fRoute: [18], fOverlap: [16] },
  { id: "R19", code: "SSB4", startPli: 12, endPli: 8, tRoute: [{ id: 6, sign: "-" }], tFlank: [5], tOverlap: [4], fRoute: [16, 14, 12, 10, 8], fOverlap: [6] },
  { id: "R20", code: "SSB5", startPli: 8, endPli: 4, tRoute: [{ id: 4, sign: "+" }], tFlank: [3], tOverlap: [2], fRoute: [6], fOverlap: [4] },
  { id: "R21", code: "NSF1", startPli: 1, endPli: 6, tRoute: [{ id: 1, sign: "+" }, { id: 2, sign: "+" }], tFlank: [], tOverlap: [4], fRoute: [6], fOverlap: [8] },
  { id: "R22", code: "NSF2", startPli: 9, endPli: 14, tRoute: [{ id: 5, sign: "+" }, { id: 6, sign: "+" }], tFlank: [], tOverlap: [8], fRoute: [18], fOverlap: [20] },
  { id: "R23", code: "NSF3", startPli: 17, endPli: 22, tRoute: [{ id: 9, sign: "+" }, { id: 10, sign: "+" }], tFlank: [], tOverlap: [12], fRoute: [30], fOverlap: [32] },
  { id: "R24", code: "NSB1", startPli: 23, endPli: 20, tRoute: [{ id: 11, sign: "-" }, { id: 12, sign: "-" }], tFlank: [], tOverlap: [10], fRoute: [30], fOverlap: [28] },
  { id: "R25", code: "NSB2", startPli: 15, endPli: 12, tRoute: [{ id: 7, sign: "-" }, { id: 8, sign: "-" }], tFlank: [], tOverlap: [6], fRoute: [18], fOverlap: [16] },
  { id: "R26", code: "NSB3", startPli: 7, endPli: 4, tRoute: [{ id: 3, sign: "-" }, { id: 4, sign: "-" }], tFlank: [], tOverlap: [2], fRoute: [6], fOverlap: [4] },
  { id: "R27", code: "SNF1", startPli: 6, endPli: 9, tRoute: [{ id: 4, sign: "-" }, { id: 3, sign: "-" }], tFlank: [], tOverlap: [5], fRoute: [9, 11, 13], fOverlap: [15] },
  { id: "R28", code: "SNF2", startPli: 14, endPli: 17, tRoute: [{ id: 8, sign: "-" }, { id: 7, sign: "-" }], tFlank: [], tOverlap: [9], fRoute: [21, 23, 25], fOverlap: [27] },
  { id: "R29", code: "SNB1", startPli: 20, endPli: 15, tRoute: [{ id: 10, sign: "+" }, { id: 9, sign: "+" }], tFlank: [], tOverlap: [7], fRoute: [25, 23, 21], fOverlap: [19] },
  { id: "R30", code: "SNB2", startPli: 12, endPli: 7, tRoute: [{ id: 6, sign: "+" }, { id: 5, sign: "+" }], tFlank: [], tOverlap: [3], fRoute: [13, 11, 9], fOverlap: [7] }
];
