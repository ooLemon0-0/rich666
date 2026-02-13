<script setup lang="ts">
type Faction = "wei" | "shu" | "wu";

const props = defineProps<{
  nickname: string;
  avatar: string;
  faction: Faction;
}>();

const emit = defineEmits<{
  "update:nickname": [value: string];
  "update:avatar": [value: string];
  "update:faction": [value: Faction];
}>();

const avatarOptions = ["😀", "😎", "🦊", "🐯", "🐼", "🐲"];
const factionOptions: Array<{ label: string; value: Faction }> = [
  { label: "魏", value: "wei" },
  { label: "蜀", value: "shu" },
  { label: "吴", value: "wu" }
];
</script>

<template>
  <section class="identity-card">
    <h3>玩家身份</h3>

    <label class="field">
      名号
      <input
        :value="props.nickname"
        maxlength="20"
        placeholder="请输入你的名号"
        @input="emit('update:nickname', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <div class="field">
      头像
      <div class="avatar-list">
        <button
          v-for="item in avatarOptions"
          :key="item"
          type="button"
          class="avatar-btn"
          :class="{ active: props.avatar === item }"
          @click="emit('update:avatar', item)"
        >
          {{ item }}
        </button>
      </div>
    </div>

    <div class="field">
      阵营
      <div class="faction-list">
        <button
          v-for="item in factionOptions"
          :key="item.value"
          type="button"
          class="faction-btn"
          :class="[item.value, { active: props.faction === item.value }]"
          @click="emit('update:faction', item.value)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.identity-card {
  border-radius: 18px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 10px 22px rgba(124, 45, 18, 0.08);
}

h3 {
  margin: 0 0 12px;
  color: #78350f;
}

.field {
  display: block;
  margin-bottom: 12px;
  color: #6b4f35;
  font-size: 14px;
}

input {
  margin-top: 6px;
  width: 100%;
  border: 1px solid #e7d7bc;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 15px;
  background: rgba(255, 251, 240, 0.96);
}

.avatar-list,
.faction-list {
  margin-top: 6px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.avatar-btn,
.faction-btn {
  border: 1px solid #e5d4b0;
  border-radius: 999px;
  background: #fff;
  min-width: 40px;
  height: 40px;
  cursor: pointer;
}

.avatar-btn.active {
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.faction-btn {
  min-width: 62px;
  height: 36px;
  font-weight: 700;
}

.faction-btn.wei.active {
  color: #1d4ed8;
  border-color: #60a5fa;
  background: #eff6ff;
}

.faction-btn.shu.active {
  color: #166534;
  border-color: #4ade80;
  background: #f0fdf4;
}

.faction-btn.wu.active {
  color: #9a3412;
  border-color: #fdba74;
  background: #fff7ed;
}
</style>
