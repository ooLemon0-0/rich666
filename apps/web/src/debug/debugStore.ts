import { reactive } from "vue";

interface DebugState {
  enabled: boolean;
  stageWidth: number;
  stageHeight: number;
  boardScale: number;
  tileCount: number;
  rendered: boolean;
  hasNaN: boolean;
  tilesConfigLoaded: boolean;
  usingFallbackTiles: boolean;
  lastLayoutError: string;
  lastRuntimeError: string;
  lastResource404Url: string;
  lastFetchError: string;
}

export const debugState = reactive<DebugState>({
  enabled: typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"),
  stageWidth: 0,
  stageHeight: 0,
  boardScale: 1,
  tileCount: 0,
  rendered: false,
  hasNaN: false,
  tilesConfigLoaded: false,
  usingFallbackTiles: false,
  lastLayoutError: "",
  lastRuntimeError: "",
  lastResource404Url: "",
  lastFetchError: ""
});

export function setStageDebug(width: number, height: number): void {
  debugState.stageWidth = Number.isFinite(width) ? width : 0;
  debugState.stageHeight = Number.isFinite(height) ? height : 0;
}

export function setLayoutDebug(payload: {
  rendered: boolean;
  tileCount: number;
  scale: number;
  hasNaN: boolean;
  lastError: string;
}): void {
  debugState.rendered = payload.rendered;
  debugState.tileCount = payload.tileCount;
  debugState.boardScale = payload.scale;
  debugState.hasNaN = payload.hasNaN;
  debugState.lastLayoutError = payload.lastError;
}

export function setTilesDebug(payload: { loaded: boolean; usingFallback: boolean; count: number }): void {
  debugState.tilesConfigLoaded = payload.loaded;
  debugState.usingFallbackTiles = payload.usingFallback;
  debugState.tileCount = payload.count;
}

export function setResource404(url: string): void {
  debugState.lastResource404Url = url;
}

export function setFetchError(message: string): void {
  debugState.lastFetchError = message;
}

export function setRuntimeError(message: string): void {
  debugState.lastRuntimeError = message;
}
