你现在要参与一个已经上线的「多游戏网站平台」开发。

在开始写任何代码之前，你必须完整理解当前系统结构，然后在这个架构内设计一个“全新的独立游戏前端”。

---

# 一、线上平台真实结构（必须先理解）

线上真实 URL 结构：

- /                      → 网站主页（纯 HTML 静态页，部署在服务器 /var/www/rich666/root，不是 Vite 项目）
- /games/<slug>/         → 每一个独立游戏前端（各自独立的 Vue3 + Vite 构建产物）
- /socket.io/            → 共享 Node.js 实时服务（Socket.IO）
- /api/                  → 共享 Node.js HTTP API
- 其它任意 URL           → nginx 302 跳回主页

重点：
✔ 每个游戏是完全独立的前端应用（互不影响）
✔ 所有游戏共享同一个 Node.js 后端（本次不允许修改后端）
✔ 游戏必须部署在子路径：/games/<slug>/

---

# 二、本仓库定位（非常重要）

这个仓库是「某一个游戏的源码模板」：
- 当前已有一个游戏（示例：rich666）
- 未来会复制它生成更多游戏
- 你现在要做的是：在这个模板体系下新建一个真正独立的新游戏前端（apps/<newgame>）

---

# 三、技术栈与部署约束（必须遵守）

前端：
- Vue 3 + Vite + TypeScript
- 必须支持子路径部署（/games/<slug>/）
- 运行时路径只能依赖 import.meta.env.BASE_URL
- 代码里绝对不能写死：
  - /games/xxx
  - localhost
  - :3000

重要：本仓库的 Vite 配置支持通过环境变量控制子路径：
- VITE_GAME_SLUG（默认值是 "game"，如果不设置会导致构建产物路径变成 /games/game/）
- VITE_BASE_PATH（可选，默认 /games/${VITE_GAME_SLUG}/）

所以：新游戏必须提供 apps/<newgame>/.env.production，至少包含：
VITE_GAME_SLUG=<slug>

否则上线会出错（资源路径会指向 /games/game/）。

后端：
- Node.js + socket.io（已运行）
- 本次不允许修改后端

Socket.IO 连接规则（必须遵守）：
- 必须自动适配当前域名（不要写 localhost）
- 必须使用 path: "/socket.io"
- 推荐：io(window.location.origin, { path: "/socket.io" })

构建与上线：
- pnpm build（或 pnpm --filter <pkg> build）
- dist 复制到服务器目录：
  /var/www/rich666/games/<slug>/

nginx：
- 当前已为 /games/rich666/ 配置 alias
- 本次不允许你修改 nginx 配置文件
- 但你需要在交付说明里写清楚：如果要上线新 slug，需要我手动新增一段 location alias（你给我一段可复制的 nginx 片段作为“说明”，但不直接改文件）

---

# 四、本次任务：新增新游戏

新游戏 slug：<在这里写，比如 zombie>
新游戏显示名：<在这里写，比如 Zombie Survival>

要求：
1) 新游戏是完全独立前端，不影响已有 rich666
2) 必须支持任意子路径部署（只用 BASE_URL，不写死路径）
3) WebSocket 必须自动适配域名（origin + /socket.io）
4) 构建后可以直接上线：build -> dist -> copy -> 访问 /games/<slug>/

---

# 五、在写代码前，你必须先做三件事（只输出文字，不写代码）

1) 用自己的话复述平台架构与子路径部署机制（包括 VITE_GAME_SLUG / BASE_URL 的关键点）
2) 给出新游戏的前端结构设计：
   - 页面结构
   - 状态管理
   - socket 通信方式
   - 未来扩展点
3) 给出分阶段开发计划（每一步产出明确）

输出要求：先只输出上述三项，不要写任何代码。等我确认后再进入编码阶段。
