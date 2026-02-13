<template>
  <section class="lobby-hero">
    <p class="kicker">三国大富翁</p>
    <h1>Lobby 大厅</h1>
    <p class="desc">呼朋引伴，先入局再争天下。创建房间可直接进入等待区，加入房间通过游戏内弹窗输入房间号。</p>
  </section>
</template>

<style scoped>
.lobby-hero {
  text-align: center;
  color: #fff;
  padding: 22px 18px 18px;
}

.kicker {
  margin: 0 0 6px;
  font-size: 13px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #fde68a;
}

h1 {
  margin: 0;
  font-size: clamp(30px, 5vw, 44px);
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.desc {
  margin: 10px auto 0;
  max-width: 620px;
  color: #e0f2fe;
  line-height: 1.6;
}
</style>
