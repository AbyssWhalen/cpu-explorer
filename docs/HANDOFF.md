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
| Number Converter | ⬜ | — | — | |
| Instruction Codec | ⬜ | — | — | |
| Cache Simulator | ⬜ | — | — | |
| Pipeline Simulator | ⬜ | — | — | |
| Datapath Viewer | ⬜ | — | — | |
| 整体布局与路由 | ⬜ | — | — | |
| 响应式适配 | ⬜ | — | — | |
| 部署配置 | ⬜ | — | — | |

## 新增依赖记录

| 包名 | 用途 | 添加者 | 日期 |
|------|------|--------|------|
| react | UI 框架 | 初始搭建 | 2026-06-08 |
| zustand | 状态管理 | 初始搭建 | 2026-06-08 |
| framer-motion | 动画 | 初始搭建 | 2026-06-08 |
| react-router-dom | 路由 | 初始搭建 | 2026-06-08 |

## 已知问题 / 待讨论

（接力开发中遇到的问题记录在这里，方便下一个人看到）

- 暂无
