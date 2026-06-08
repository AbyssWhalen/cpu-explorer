# CPU Explorer — 计算机组成原理交互式学习平台

## 项目概述

面向 CS 学生的 Web App，通过交互式可视化帮助理解计组核心概念。覆盖五大模块：

1. **进制/补码/浮点数转换器** (Number Converter)
2. **指令编码解码器** (Instruction Codec) — RISC-V 为主
3. **数据通路动画** (Datapath Viewer)
4. **流水线模拟器** (Pipeline Simulator)
5. **Cache 模拟器** (Cache Simulator)

## 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS 4
- **动画**: Framer Motion（数据通路/流水线动画）
- **状态管理**: Zustand（轻量，模块间状态隔离）
- **可视化**: 自绘 SVG + Canvas（不引入 D3 等重型库）
- **测试**: Vitest + React Testing Library
- **部署**: 纯静态，GitHub Pages / Vercel 均可

## 目录结构

```
cpu-explorer/
├── CLAUDE.md              # 本文件，AI 接力开发必读
├── README.md              # 用户面向的项目说明
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── public/
├── docs/
│   ├── ARCHITECTURE.md    # 架构设计与模块关系
│   ├── MODULE_SPEC.md     # 各模块详细规格
│   └── HANDOFF.md         # 接力开发检查清单
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   ├── instruction.ts # RISC-V 指令类型定义
    │   ├── cache.ts       # Cache 配置与状态类型
    │   ├── pipeline.ts    # 流水线阶段与冒险类型
    │   └── common.ts      # 通用类型
    ├── lib/
    │   ├── number.ts      # 进制/补码/浮点转换逻辑
    │   ├── riscv.ts       # RISC-V 编解码核心
    │   ├── pipeline.ts    # 流水线模拟引擎
    │   └── cache.ts       # Cache 模拟引擎
    ├── hooks/
    │   └── useSimulation.ts
    └── components/
        ├── common/        # 共享 UI 组件
        ├── number-converter/
        ├── instruction-codec/
        ├── datapath/
        ├── pipeline/
        └── cache/
```

## 开发规范

### 命名
- 组件: PascalCase（`PipelineStage.tsx`）
- 工具函数/hooks: camelCase（`useSimulation.ts`）
- 类型文件: camelCase（`instruction.ts`）
- CSS class: Tailwind utility，不写自定义 class 除非动画需要

### 模块开发顺序（推荐）
1. Number Converter — 最简单，用来搭建整体布局和路由
2. Instruction Codec — 纯逻辑，测试好写
3. Cache Simulator — 交互状态多，适合练 Zustand
4. Pipeline Simulator — 动画复杂度高
5. Datapath Viewer — SVG 绘制量最大，最后做

### 验证命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建检查
npm run lint         # ESLint 检查
npm run typecheck    # TypeScript 类型检查
npm run test         # 运行测试
```

### 代码原则
- 逻辑层（`src/lib/`）与视图层（`src/components/`）严格分离
- `lib/` 下的函数必须是纯函数，不依赖 React，方便单独测试
- 每个模块的 store 独立，不搞全局大 store
- 动画用 Framer Motion `variants` 模式，不手写 CSS keyframes
- 所有用户可配置参数（cache 大小、流水线深度等）用 Zustand store 管理

### 接力开发须知
- 拿到项目先跑 `npm run typecheck && npm run test` 确认现有代码健康
- 新增模块前先读 `docs/MODULE_SPEC.md` 了解该模块的设计意图
- 完成一个模块后更新 `docs/HANDOFF.md` 的检查清单
- Commit message 格式: `feat(module): 描述` / `fix(module): 描述`
- 不要动其他模块的代码，除非修 bug 或调整共享组件

## 当前进度

- [x] 项目骨架搭建
- [ ] Number Converter 模块
- [ ] Instruction Codec 模块
- [ ] Cache Simulator 模块
- [ ] Pipeline Simulator 模块
- [ ] Datapath Viewer 模块
- [ ] 整体布局与路由
- [ ] 响应式适配
- [ ] 部署配置
