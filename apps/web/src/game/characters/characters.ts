import defaultAvatar from "../../assets/default-avatar.svg";
import { CHARACTER_OPTIONS, getCharacterById } from "../../data/characters";
import { getCharacterColor } from "./characterPalette";

export interface CharacterVisual {
  id: string;
  name: string;
  displayName: string;
  avatarUrl: string;
  color: string;
}

export const CHARACTER_VISUALS: CharacterVisual[] = CHARACTER_OPTIONS.map((item) => ({
  id: item.id,
  name: item.name,
  displayName: item.displayName,
  avatarUrl: item.avatarPath,
  color: getCharacterColor(item.id)
}));

export function getCharacterVisual(characterId: string | null | undefined): CharacterVisual {
  const base = getCharacterById(characterId);
  if (!base) {
    return {
      id: "default",
      name: "未选角色",
      displayName: "未选择角色",
      avatarUrl: defaultAvatar,
      color: getCharacterColor(null)
    };
  }
  return {
    id: base.id,
    name: base.name,
    displayName: base.displayName,
    avatarUrl: base.avatarPath,
    color: getCharacterColor(base.id)
  };
}
