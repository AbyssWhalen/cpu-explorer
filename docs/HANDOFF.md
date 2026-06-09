# 接力开发检查清单

每次有新的 AI 或开发者接手时，按此清单操作。

## 接手前

- [ ] 读完 `CLAUDE.md`（项目总览 + 规范）
- [ ] 读完 `docs/ARCHITECTURE.md`（架构设计）
- [ ] 读完 `docs/MODULE_SPEC.md`（你要做的模块的规格）
- [ ] 跑通 `npm install && npm run dev` 确认项目能启动
- [ ] 跑通 `npm run typecheck && npm run test` 确认现有代码无错误

## 开发中

- [ ] 新代码放在正确的目录下（逻辑放 lib/，组件放 components/模块名/）
- [ ] lib/ 下的函数写单元测试（`*.test.ts`）
- [ ] 组件用 TypeScript，props 定义类型
- [ ] 不改动其他模块的代码（除非修共享组件的 bug）
- [ ] Commit message 遵循 `feat(module): 描述` 格式

## 交付后

- [ ] `npm run typecheck` 无错误
- [ ] `npm run test` 全部通过
- [ ] `npm run build` 能成功构建
- [ ] 更新 `CLAUDE.md` 的进度清单（打勾完成的模块）
- [ ] 如果新增了依赖，在下方记录原因

---

## 模块完成状态

| 模块 | 状态 | 完成者 | 日期 | 备注 |
|------|------|--------|------|------|
| 项目骨架 | ✅ | Claude Opus 4.6 | 2026-06-08 | 初始搭建 |
| Number Converter | ✅ | Claude Opus 4.6 | 2026-06-08 | 进制转换 + 补码 + IEEE 754 |
| Instruction Codec | ✅ | Claude Opus 4.6 | 2026-06-08 | RV32I 全部六种格式编解码 |
| Cache Simulator | ✅ | Claude Opus 4.6 | 2026-06-08 | 直接映射/组相联/全相联，LRU/FIFO/Random |
| Pipeline Simulator | ✅ | Claude Opus 4.6 | 2026-06-08 | 五级流水线，数据/控制冒险，forwarding |
| Datapath Viewer | ✅ | Claude Opus 4.6 | 2026-06-08 | SVG 数据通路图 + 控制信号 |
| 整体布局与路由 | ✅ | Claude Opus 4.6 | 2026-06-08 | React Router 导航 |
| UI 美化 + 主题切换 | ✅ | Claude Opus 4.8 | 2026-06-08 | 统一靛蓝设计语言，CSS token 双主题，亮/暗切换 |
| 界面汉化 (Pipeline/Cache) | ✅ | Claude Opus 4.8 | 2026-06-09 | Pipeline、Cache 页全部 UI 文案中文化 |
| 数据通路 SVG 重画 | ✅ | Claude Opus 4.8 | 2026-06-09 | 分带正交布局，中文标签+英文小字，补全 auipc 缺失连线 |
| 响应式适配 | ⬜ | — | — | 需要移动端适配 |
| 部署配置 | ⬜ | — | — | GitHub Pages / Vercel |

## 新增依赖记录

| 包名 | 用途 | 添加者 | 日期 |
|------|------|--------|------|
| react | UI 框架 | 初始搭建 | 2026-06-08 |
| zustand | 状态管理 | 初始搭建 | 2026-06-08 |
| framer-motion | 动画 | 初始搭建 | 2026-06-08 |
| react-router-dom | 路由 | 初始搭建 | 2026-06-08 |

## 已知问题 / 待讨论

（接力开发中遇到的问题记录在这里，方便下一个人看到）

- **[已修] HomePage 卡片路由错位**：卡片链接写的是 `/number`、`/instruction`，实际路由是 `/number-system`、`/instruction-decoder`，点击会 404。已在美化 HomePage 时一并修正。
- **[已修] datapath.css 与 TSX 类名整体错位**：`datapath.css` 是旧版本组件的样式，类名（`.datapath-controls`、`.dp-wire`、`.control-signals-panel` 等）与当前 `DatapathPage.tsx`（`.dp-input-section`、`.dp-path`、`.dp-signals-section` 等）几乎全对不上，导致该页除 SVG 方块外大面积裸奔、连线不显示。已按当前 TSX 类名重写整个 `datapath.css`。
- **[已修] Pipeline / Cache 页面英文**：两页 UI 文案（标题、控件、统计、表头、图例、错误信息）原为英文，已全部汉化为中文。计组标准缩写（IF/ID/EX/MEM/WB、V/D/Tag）保留缩写并加中文说明 / title 提示。
- **[已修] 数据通路接线混乱 + 英文标签**：原 SVG 几何布局存在多条横贯全图的长线、斜折线交叉、写回线绕底回折等问题。已按经典单周期布局重画——主数据流横向一条直线（PC→指令存储器→寄存器堆→ALU多选器→ALU→数据存储器→写回多选器），顶部独立 PC 更新带，反馈线分配独立轨道（不同 y）和竖管（不同 x）避免平行贴合。组件标签改为「中文 + 英文缩写小字」。**逻辑层 `datapath.ts` 引用的 12 个组件 ID + 21 条连线 ID 全部保留未改**，重画只动几何坐标。
- **[已修] auipc 缺失连线**：`datapath.ts` 第 102 行引用 `adder-to-mux-wb`，但旧 SVG 从未绘制该线，导致 auipc 指令的这条通路高亮无效。重画时已补上。
- **[参考] 数据通路自验证方法**：本机可用无头 Edge 截图验证 SVG 渲染效果，无需装依赖：`& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --screenshot=out.png --window-size=W,H --virtual-time-budget=3000 http://localhost:<port>/datapath`。验证亮色主题时临时改 `index.html` boot 脚本默认值，**截完务必还原**。
- **[已修] 死依赖**：`package.json` 曾装 `zustand`、`framer-motion`，但全代码库零引用，且与 CLAUDE.md「不引入外部状态库 / 自绘 SVG」的约定冲突。已确认后移除（`npm install` 连同 3 个传递依赖共清理 5 个包），`npm run build` 验证 bundle 体积无变化（印证为纯死依赖），并已同步下方「新增依赖记录」表。
