<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { CHARACTER_OPTIONS } from "../../data/characters";
import CharacterGrid from "./CharacterGrid.vue";

const props = defineProps<{
  visible: boolean;
  selectedId: string | null;
  takenByOthers: string[];
  submitError?: string;
  connectionStatus?: "connected" | "connecting" | "disconnected";
}>();

const emit = defineEmits<{
  confirm: [id: string];
  close: [];
}>();

const blockedHint = ref("");
const pendingSelectedId = ref<string | null>(null);
const modalTitle = computed(() => (props.selectedId ? "修改角色" : "选择角色"));
const modalDesc = computed(() =>
  props.selectedId ? "可重新选择武将，修改后会同步到全房间" : "请选择一名武将后再点击准备"
);

watch(
  () => [props.visible, props.selectedId],
  () => {
    pendingSelectedId.value = props.selectedId;
    blockedHint.value = "";
  },
  { immediate: true }
);

function showBlockedHint(): void {
  blockedHint.value = "该角色已被其他玩家选择";
  window.setTimeout(() => {
    blockedHint.value = "";
  }, 1200);
}

function handleConfirm(): void {
  if (props.connectionStatus && props.connectionStatus !== "connected") {
    blockedHint.value = "连接未就绪，请稍后重试";
    return;
  }
  if (!pendingSelectedId.value) {
    blockedHint.value = "请先选择角色";
    return;
  }
  if (props.takenByOthers.includes(pendingSelectedId.value)) {
    blockedHint.value = "该角色刚刚被其他玩家选择，请选择其它角色";
    return;
  }
  emit("confirm", pendingSelectedId.value);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="mask" @click.self="emit('close')">
      <section class="modal">
        <header class="head">
          <div>
            <h3>{{ modalTitle }}</h3>
            <p>{{ modalDesc }}</p>
          </div>
          <button class="close-btn" type="button" @click="emit('close')">×</button>
        </header>
        <div class="body">
          <CharacterGrid
            :items="CHARACTER_OPTIONS"
            :selected-id="pendingSelectedId"
            :taken-by-others="takenByOthers"
            @select="pendingSelectedId = $event"
            @blocked="showBlockedHint"
          />
        </div>
        <footer class="foot">
          <p class="tip">{{ blockedHint || props.submitError || (pendingSelectedId ? "已选择角色，可确认" : "请先选择角色") }}</p>
          <p v-if="connectionStatus" class="conn-line">连接状态：{{ connectionStatus }}</p>
          <button type="button" :disabled="!pendingSelectedId" @click="handleConfirm">确认选择</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  padding: 18px;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
}

.modal {
  width: min(92vw, 720px);
  max-height: min(80vh, 720px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff, #eef2ff);
  border: 3px solid #818cf8;
  box-shadow: 0 24px 40px rgba(30, 41, 59, 0.3);
  overflow: hidden;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px;
}

.head h3 {
  margin: 0;
  color: #312e81;
}

.head p {
  margin: 6px 0 0;
  color: #4338ca;
}

.close-btn {
  border: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 20px;
  line-height: 34px;
  cursor: pointer;
}

.body {
  overflow-y: auto;
  padding: 0 16px 12px;
}

.foot {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px 14px;
  border-top: 1px solid #c7d2fe;
  background: linear-gradient(180deg, rgba(238, 242, 255, 0.9), #e0e7ff);
}

.tip {
  margin: 0;
  margin-right: auto;
  color: #4338ca;
  font-weight: 600;
}

.conn-line {
  margin: 0 10px 0 0;
  color: #64748b;
  font-size: 12px;
}

button {
  border: 0;
  border-radius: 12px;
  background: linear-gradient(180deg, #818cf8, #4f46e5);
  color: #fff;
  padding: 10px 14px;
  min-width: 120px;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  background: #a5b4fc;
  cursor: not-allowed;
}
</style>
