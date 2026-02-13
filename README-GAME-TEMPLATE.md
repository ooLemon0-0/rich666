# Game Template Guide

本项目的 `apps/web` 已改造成可复制的子游戏模板，适用于部署到 `/games/<slug>/`。

## 目标结构

- 主页（站点外层）：`/`
- 子游戏 A：`/games/game-a/`
- 子游戏 B：`/games/zombie/`
- 子游戏 C：`/games/tetris/`

每个子游戏可以独立构建并部署，后端可共享同一套 Socket/API。

## 模板化变量

在 `apps/web/.env`（或 CI 环境变量）配置：

```bash
VITE_GAME_SLUG=my-game
VITE_GAME_TITLE=联机大富翁
# 可选，不填默认 /games/${VITE_GAME_SLUG}/
# VITE_BASE_PATH=/games/my-game/
# 可选，不填默认同域
# VITE_SOCKET_URL=http://8.145.43.252
# 可选，不填默认 /
# VITE_SOCKET_NAMESPACE=/
```

## 新建一个游戏（最小流程）

1. 复制当前仓库（或从模板分支创建新目录）
2. 修改 `apps/web/.env` 中：
   - `VITE_GAME_SLUG=<new-slug>`
   - `VITE_GAME_TITLE=<new-title>`
   - 如需自定义子路径，设置 `VITE_BASE_PATH=/games/<new-slug>/`
3. 构建前端：

```bash
pnpm install
pnpm -C apps/web build
```

4. 构建产物：

- `apps/web/dist`

5. 将产物复制到服务器目录：

```bash
rsync -av --delete apps/web/dist/ user@server:/var/www/<site-root>/games/<new-slug>/
```

6. Nginx 为 `/games/<new-slug>/` 放行静态目录（你当前线上已做白名单路由，通常只需新增映射）。

## 为什么该模板可复用

- 资源路径由 Vite `base` 控制，默认 `/games/<slug>/`
- 运行时使用 `import.meta.env.BASE_URL` 和环境变量，不依赖根路径 `/`
- Socket 默认同域，不写死 `localhost`
- 可通过 `VITE_SOCKET_URL` / `VITE_SOCKET_NAMESPACE` 覆盖

## 推荐发布命令（服务器）

```bash
cd /opt/<project-dir>
git pull origin main
pnpm install
pnpm -C apps/web build
sudo rsync -av --delete apps/web/dist/ /var/www/<site-root>/games/<slug>/
```
