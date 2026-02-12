# 联机大富翁 MVP（Vue + Node.js）

## 目录

- `apps/web`: Vue3 + Vite + TS + Pinia 前端
- `apps/server`: Fastify + Socket.IO 实时后端
- `packages/shared`: 前后端共享 types 与协议事件常量

## 快速开始

```bash
npm install
```

启动后端（终端 1）：

```bash
npm run dev:server
```

启动前端（终端 2）：

```bash
npm run dev:web
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3000`
