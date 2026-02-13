我要在当前 pnpm monorepo 仓库里新增一个可复用的「平台 UI 组件库」，供未来多个独立游戏前端复用（保持统一卡通精致风格）。

【项目现状】
- 当前仓库是 pnpm workspace（已能 pnpm -r build）
- apps/web 是一个 Vue3+Vite+TS 的游戏前端（大富翁）
- 我未来会新增更多游戏：每个游戏独立前端，但复用同一套 UI 风格

【目标】
在 packages/ui 新增一个 Vue 组件库（可打包成 library，被 apps/web 和未来 apps/xxx 引用）。
必须提供统一“卡通精致/玻璃拟态”风格的基础组件，并在 apps/web 里实际使用它（至少替换现有页面里的一些按钮/卡片/顶部栏）。

【硬性要求】
1) 新建 packages/ui，作为 workspace package，名字用 @rich/ui（或 @rich/ui-kit，二选一，你选一个并统一）
2) 组件库必须包含：
   - Button（primary/secondary/ghost + loading + disabled）
   - Card（默认玻璃拟态 card）
   - Chip/Tag（胶囊标签）
   - TopBar（平台栏：左侧返回大厅 / 中间标题 / 右侧插槽按钮）
   - Modal（弹窗）
   - Drawer（侧边抽屉，可用于房间列表/玩家列表）
   - ToastHost（简单通知系统：success/info/error）
3) 风格统一由 CSS Tokens 驱动：
   - packages/ui/src/styles/tokens.css 定义 CSS variables（圆角、阴影、渐变、字体、间距）
   - packages/ui/src/styles/base.css 提供通用动画/hover/active 的动效（上浮、缩放）
   - 组件内不要写死颜色（尽量用 var(--xxx)）
4) 打包方式：
   - 用 Vite library mode 或 tsup 均可（优先 Vite）
   - 导出 ESM
   - 支持在应用中：import { Button, Card } from "@rich/ui"
   - 支持引入样式：import "@rich/ui/style.css" 或者在 ui 包内通过入口自动注入（你选择更稳的方案）
5) 在 apps/web 中接入：
   - apps/web/package.json 增加对 @rich/ui 的 workspace 依赖
   - 在 apps/web 的某个页面或 App.vue 中实际使用 Button/Card/TopBar（至少 3 个组件）
   - 保证 pnpm -r build 通过
6) 给出使用说明文档：
   - packages/ui/README.md：如何在新游戏中引入、如何覆盖主题（只改 tokens 变量）

【交付要求】
- 列出新增/修改的文件清单
- 给我关键代码（tokens.css、Button.vue、TopBar.vue、index.ts、build config）
- 给我验证命令：
  - pnpm install
  - pnpm -r build
  - （可选）pnpm --filter @rich/ui dev / build

注意：不要改 nginx/部署；只在仓库内做 UI 组件库与接入。
