import type { RoomState } from "@rich/shared";

export interface SpecialHookResult {
  handled: boolean;
  message?: string;
}

export function checkTileSpecialHook(
  _roomId: string,
  _tileIndex: number,
  _playerCharacterId: string | null,
  _state: RoomState
): SpecialHookResult {
  // Reserved hook for future chance/jail/custom events.
  // Current phase keeps minimal behavior.
  return { handled: false };
}
