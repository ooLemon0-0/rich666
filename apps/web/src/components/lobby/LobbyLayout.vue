<template>
  <section class="lobby-shell">
    <div class="texture" />
    <slot name="header" />
    <div class="lobby-grid">
      <aside class="lobby-aside">
        <slot name="left" />
      </aside>
      <main class="lobby-main">
        <slot name="right" />
      </main>
    </div>
  </section>
</template>

<style scoped>
.lobby-shell {
  position: relative;
  border-radius: 28px;
  padding: 24px;
  background: linear-gradient(140deg, #fff8e8 0%, #fdecc8 45%, #fdf4e7 100%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 24px 40px rgba(120, 53, 15, 0.15);
  overflow: hidden;
}

.texture {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.3;
  background-image: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.7), transparent 36%),
    radial-gradient(circle at 75% 8%, rgba(255, 255, 255, 0.66), transparent 30%),
    radial-gradient(circle at 88% 62%, rgba(255, 255, 255, 0.45), transparent 32%);
}

.lobby-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 18px;
}

.lobby-aside,
.lobby-main {
  position: relative;
  z-index: 1;
}

@media (max-width: 900px) {
  .lobby-grid {
    grid-template-columns: 1fr;
  }
}
</style>
