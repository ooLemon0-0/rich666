<template>
  <section class="dock">
    <h3>道具区</h3>
    <p>道具槽位预留（后续接入卡牌/技能）</p>
    <div class="slots">
      <span v-for="n in 6" :key="n" class="slot">{{ n }}</span>
    </div>
  </section>
</template>

<style scoped>
.dock {
  border-radius: 14px;
  padding: 12px;
  border: 2px solid rgba(186, 230, 253, 0.8);
  background: rgba(255, 255, 255, 0.86);
}
h3 {
  margin: 0 0 6px;
  color: #0c4a6e;
}
p {
  margin: 0 0 10px;
  color: #475569;
  font-size: 13px;
}
.slots {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.slot {
  display: grid;
  place-items: center;
  height: 44px;
  border-radius: 10px;
  border: 1px dashed #7dd3fc;
  color: #0284c7;
  font-weight: 700;
}
</style>
