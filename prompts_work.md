你是一个资深 Vue3 + Vite + TypeScript + Monorepo 工程师。
你要在一个已经能 `pnpm -r build` 的 pnpm workspace 仓库中新增一个可复用「平台 UI 组件库」，供多个独立游戏前端复用统一“卡通精致/玻璃拟态”风格。

在开始写代码前：
- 先阅读当前仓库结构（packages/shared、apps/web、apps/server 等）
- 明确这是 pnpm monorepo：新包必须在 workspace 中可被引用与构建
- 本任务不涉及 nginx/部署，只改仓库代码与构建链

====================================================
目标
====================================================
新增 packages/ui 作为 workspace package，包名统一使用：@rich/ui
- 组件库用 Vue SFC + TS
- 打包用 Vite library mode
- 导出 ESM
- 支持应用侧：import { Button, Card, TopBar } from "@rich/ui"
- 支持应用侧：import "@rich/ui/style.css" 引入样式（这是最稳的方式，必须实现）
- 风格统一必须由 CSS Tokens 驱动，不允许组件写死颜色

并在 apps/web 中接入：
- apps/web/package.json 增加依赖："@rich/ui": "workspace:*"
- 在 apps/web 的 App.vue 或某个页面实际替换使用至少 3 个组件（必须包含 TopBar + Button + Card）
- 不能破坏现有 socket / 游戏逻辑
- 最终确保：pnpm -r build 全部通过

====================================================
硬性组件清单（必须全部实现）
====================================================
在 packages/ui 中提供这些组件，并 export：

1) Button
- variants: primary / secondary / ghost
- props: variant, size(sm/md/lg), loading, disabled
- 支持 <slot/>
- loading 时显示一个小 spinner

2) Card
- 玻璃拟态默认卡片（半透明 + blur + 边框高光 + 阴影）
- 支持 header/body/footer slot（或最少默认 slot）

3) Chip/Tag
- 胶囊标签，支持 variant（info/success/warn/error/neutral）
- 不写死颜色，用 tokens

4) TopBar
- 平台栏：左侧“返回大厅”按钮（默认文本，可通过 props 替换）
- 中间标题 title
- 右侧 actions slot（比如按钮/头像）
- 组件本身只负责 UI，不做路由跳转逻辑；对外 emit "back"

5) Modal
- 支持 v-model:open
- 支持 title、默认 slot
- 支持 close 按钮、点击遮罩关闭（可配置）
- ESC 关闭
- 简单过渡动画

6) Drawer
- 支持 v-model:open
- 支持 placement: left/right
- 遮罩、ESC 关闭
- 可用于房间列表/玩家列表
- 动画：滑入滑出

7) ToastHost
- 一个简单通知系统：success/info/error
- 提供 composable: useToast() 或 export toast API（你选更稳的）
- ToastHost 组件挂在 App 根部一次即可
- Toast 自动消失、可手动关闭
- 不依赖外部库

====================================================
样式体系（必须严格执行）
====================================================
在 packages/ui/src/styles/ 下建立：
- tokens.css：定义所有 CSS variables（圆角、阴影、渐变、字体、间距、按钮高度、玻璃背景等）
- base.css：提供通用的 hover/active 动效（上浮、缩放、阴影变化）、focus ring、transition easing
要求：
- 组件内部不写死颜色：尽量 var(--xxx)
- tokens 是“主题入口”：未来新游戏只改 tokens 变量就能换主题

输出：
- 在打包后生成 packages/ui/dist/style.css
- 在 package.json exports 中暴露：
  - import "@rich/ui/style.css"

====================================================
打包要求（Vite library mode）
====================================================
packages/ui 需要：
- vite.config.ts 用 build.lib 打包
- entry: src/index.ts
- output format: es
- external: vue
- 生成 types：用 vue-tsc 或 vite-plugin-dts（二选一，选你认为最稳的一套）
- package.json 配置：
  - name: "@rich/ui"
  - type: "module"
  - main/module/exports 正确指向 dist
  - files 包含 dist
- 确保 pnpm -r build 会构建 ui 包

====================================================
apps/web 接入要求
====================================================
在 apps/web 中：
1) package.json 增加依赖 "@rich/ui": "workspace:*"
2) main.ts 引入样式：import "@rich/ui/style.css"
3) 在 App.vue 或某个页面中用至少 3 个组件：
   - 必须用 TopBar（title=联机大富翁 / 或 props 可配置）
   - 用 Card 包住一个区域（例如 “房间信息/按钮区”）
   - 用 Button 替换原生按钮（例如 创建房间/加入房间）
4) 额外加 ToastHost：
   - 在 App 根部挂 ToastHost
   - 在点击按钮时演示触发 toast（不影响原逻辑，轻量演示即可）

====================================================
文档要求
====================================================
新增 packages/ui/README.md，必须包含：
- 安装/引用方式（workspace）
- 在新游戏中如何引入组件与样式
- 如何换主题：只覆盖 tokens（给一个例子：在应用里新增 CSS 覆盖变量）
- 推荐的使用模式（TopBar + ToastHost 在 App 根部）

====================================================
交付要求（你最终输出）
====================================================
1) 列出新增/修改文件清单（path 列表）
2) 给出关键代码（必须贴出完整内容）：
   - packages/ui/src/styles/tokens.css
   - packages/ui/src/components/Button.vue
   - packages/ui/src/components/TopBar.vue
   - packages/ui/src/index.ts
   - packages/ui/vite.config.ts
   - packages/ui/package.json（至少 exports / scripts）
3) 给出验证命令：
   - pnpm install
   - pnpm -r build
   - pnpm --filter @rich/ui build

注意：
- 不要改 nginx/部署
- 不要引入大型 UI 框架（比如 ElementPlus）
- 不要破坏现有 apps/web 游戏逻辑
- 组件要“卡通精致/玻璃拟态”，动效要克制但高级
先实现最小可用版本，保证构建通过，再考虑细节 polish。
