<script setup lang="ts">
import { computed } from "vue";
import type { GameLandingResolvedPayload } from "@rich/shared";
import { getCharacterVisual } from "../../game/characters/characters";

const props = defineProps<{
  payload: GameLandingResolvedPayload | null;
  pending?: boolean;
  isSelfTurn: boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
  cancel: [];
}>();

const title = computed(() => {
  if (!props.payload) {
    return "";
  }
  if (props.payload.action === "BUY_OFFER") {
    return "购买地块";
  }
  if (props.payload.action === "PAY_RENT") {
    return "支付过路费";
  }
  if (props.payload.action === "UPGRADE_OFFER") {
    return "升级地块";
  }
  if (props.payload.action === "SPECIAL_TRIGGER") {
    return "触发事件";
  }
  return "本回合结算";
});

const description = computed(() => {
  const payload = props.payload;
  if (!payload) {
    return "";
  }
  const hero = getCharacterVisual(payload.heroId).displayName;
  if (payload.action === "BUY_OFFER") {
    return `${hero} 可购买当前地块，价格 ${payload.amount ?? 0} 金。`;
  }
  if (payload.action === "PAY_RENT") {
    const owner = getCharacterVisual(payload.ownerHeroId ?? null).displayName;
    return `${hero} 向 ${owner} 支付过路费 ${payload.amount ?? 0} 金。`;
  }
  if (payload.action === "UPGRADE_OFFER") {
    return `${hero} 抵达自己的地块，可选择升级（壳子）。`;
  }
  if (payload.action === "SPECIAL_TRIGGER") {
    return `${hero} 触发了特殊格事件（壳子）。`;
  }
  return `${hero} 本回合结算完成。`;
});

const showDecisionButtons = computed(
  () =>
    Boolean(props.payload) &&
    props.isSelfTurn &&
    (props.payload?.action === "BUY_OFFER" || props.payload?.action === "UPGRADE_OFFER")
);
</script>

<template>
  <div v-if="payload" class="mask" @click.self="emit('close')">
    <section class="panel">
      <header class="head">
        <h3>{{ title }}</h3>
        <button type="button" class="close" @click="emit('close')">×</button>
      </header>
      <p class="desc">{{ description }}</p>
      <footer class="foot">
        <template v-if="showDecisionButtons">
          <button type="button" class="btn ghost" :disabled="pending" @click="emit('cancel')">取消</button>
          <button type="button" class="btn primary" :disabled="pending" @click="emit('confirm')">确认</button>
        </template>
        <button v-else type="button" class="btn primary" @click="emit('close')">我知道了</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.24);
  backdrop-filter: blur(2px);
  z-index: 40;
}
.panel {
  width: min(90vw, 420px);
  border-radius: 16px;
  border: 2px solid rgba(253, 224, 71, 0.8);
  background: linear-gradient(175deg, rgba(255, 255, 255, 0.96), rgba(254, 249, 195, 0.9));
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.28);
  padding: 14px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.head h3 {
  margin: 0;
  font-size: 18px;
}
.close {
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}
.desc {
  margin: 10px 2px 14px;
  color: #334155;
  line-height: 1.5;
}
.foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.btn {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 700;
  cursor: pointer;
}
.btn.primary {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff;
}
.btn.ghost {
  background: rgba(148, 163, 184, 0.2);
  color: #334155;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
