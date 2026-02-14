import { reactive } from "vue";

export interface DebugStoreState {
  stageRect: { width: number; height: number };
  boardScale: number;
  tileCount: number;
  rendered: boolean;
  hasNaN: boolean;
  tilesConfigLoaded: boolean;
  usingFallbackTiles: boolean;
  tilesToRenderCount: number;
  lastResource404Url: string;
  lastFetchError: string;
  runtimeError: string;
}

const state = reactive<DebugStoreState>({
  stageRect: { width: 0, height: 0 },
  boardScale: 1,
  tileCount: 0,
  rendered: false,
  hasNaN: false,
  tilesConfigLoaded: false,
  usingFallbackTiles: true,
  tilesToRenderCount: 0,
  lastResource404Url: "",
  lastFetchError: "",
  runtimeError: ""
});

export function useDebugStore(): DebugStoreState {
  return state;
}

export function updateDebugStageRect(width: number, height: number): void {
  state.stageRect = { width, height };
}

export function updateDebugLayout(payload: {
  boardScale: number;
  tileCount: number;
  rendered: boolean;
  hasNaN: boolean;
  runtimeError?: string;
}): void {
  state.boardScale = payload.boardScale;
  state.tileCount = payload.tileCount;
  state.rendered = payload.rendered;
  state.hasNaN = payload.hasNaN;
  if (payload.runtimeError) {
    state.runtimeError = payload.runtimeError;
  }
}

export function updateDebugTiles(payload: {
  loaded: boolean;
  usingFallback: boolean;
  count: number;
}): void {
  state.tilesConfigLoaded = payload.loaded;
  state.usingFallbackTiles = payload.usingFallback;
  state.tilesToRenderCount = payload.count;
}

export function setLastResource404(url: string): void {
  state.lastResource404Url = url;
}

export function setLastFetchError(message: string): void {
  state.lastFetchError = message;
}

export function setRuntimeError(message: string): void {
  state.runtimeError = message;
}
