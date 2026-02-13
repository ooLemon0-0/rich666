import manifest from "../assets/manifest.json";

export interface CharacterOption {
  id: string;
  name: string;
  displayName: string;
  avatarPath: string;
}

interface ManifestItem {
  index: number;
  name_zh?: string;
  name_en?: string;
  file: string;
}

interface CharacterManifest {
  items: ManifestItem[];
}

const typedManifest = manifest as CharacterManifest;

export const CHARACTER_OPTIONS: CharacterOption[] = typedManifest.items.map((item) => {
  const id = (item.name_en ?? `character_${item.index}`).toLowerCase();
  const displayName = item.name_zh || item.name_en || `角色${item.index}`;
  const avatarPath = new URL(`../assets/${item.file}`, import.meta.url).href;
  return {
    id,
    name: displayName,
    displayName,
    avatarPath
  };
});

export const CHARACTER_BY_ID = new Map(CHARACTER_OPTIONS.map((item) => [item.id, item]));

export function getCharacterById(characterId: string | null | undefined): CharacterOption | null {
  if (!characterId) {
    return null;
  }
  return CHARACTER_BY_ID.get(characterId) ?? null;
}
