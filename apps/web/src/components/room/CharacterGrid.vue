<script setup lang="ts">
import type { CharacterOption } from "../../data/characters";
import CharacterCard from "./CharacterCard.vue";

defineProps<{
  items: CharacterOption[];
  selectedId: string | null;
  takenByOthers: string[];
}>();

const emit = defineEmits<{
  select: [id: string];
  blocked: [];
}>();
</script>

<template>
  <div class="character-grid">
    <CharacterCard
      v-for="item in items"
      :key="item.id"
      :name="item.name"
      :avatar-path="item.avatarPath"
      :selected="item.id === selectedId"
      :locked="takenByOthers.includes(item.id)"
      @select="takenByOthers.includes(item.id) ? emit('blocked') : emit('select', item.id)"
    />
  </div>
</template>

<style scoped>
.character-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 720px) {
  .character-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .character-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
