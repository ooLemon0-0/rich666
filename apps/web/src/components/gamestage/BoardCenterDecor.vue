<template>
  <div class="center-decor" aria-hidden="true">
    <div class="paper"></div>
  </div>
</template>

<style scoped>
.center-decor {
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(58%, 640px);
  height: min(48%, 420px);
  transform: translate(-50%, -50%);
  border-radius: 28px;
  pointer-events: none;
  z-index: 0;
}
.paper {
  width: 100%;
  height: 100%;
  border-radius: 28px;
  border: 2px solid rgba(250, 204, 21, 0.3);
  background:
    radial-gradient(circle at 24% 26%, rgba(250, 204, 21, 0.22), transparent 40%),
    radial-gradient(circle at 72% 70%, rgba(251, 191, 36, 0.16), transparent 42%),
    linear-gradient(165deg, rgba(255, 255, 255, 0.58), rgba(254, 240, 138, 0.18));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    0 16px 28px rgba(15, 23, 42, 0.12);
}
</style>
