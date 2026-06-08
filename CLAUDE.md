# CPU Explorer — 计算机组成原理交互式学习平台

## 项目概述

面向 CS 学生的 Web App，通过交互式可视化帮助理解计组核心概念。覆盖五大模块：

1. **进制/补码/浮点数转换器** (Number Converter)
2. **指令编码解码器** (Instruction Codec) — RISC-V RV32I
3. **数据通路动画** (Datapath Viewer)
4. **流水线模拟器** (Pipeline Simulator)
5. **Cache 模拟器** (Cache Simulator)

## 技术栈

- **框架**: React 19 + TypeScript (strict mode)
- **构建**: Vite 6
- **路由**: React Router 7
- **样式**: 自定义 CSS（每模块独立样式文件）
- **可视化**: 自绘 SVG（数据通路图）
- **测试**: Vitest + React Testing Library（待添加）
- **部署**: 纯静态，GitHub Pages / Vercel 均可

## 目录结构

```
cpu-explorer/
├── CLAUDE.md              # 本文件，AI 接力开发必读
├── README.md              # 用户面向的项目说明
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── docs/
│   ├── ARCHITECTURE.md    # 架构设计与模块关系
│   ├── MODULE_SPEC.md     # 各模块详细规格
│   └── HANDOFF.md         # 接力开发检查清单
└── src/
    ├── main.tsx           # 入口
    ├── App.tsx            # 路由配置
    ├── components/
    │   └── Layout.tsx     # 导航栏 + 页面容器
    ├── pages/
    │   ├── HomePage.tsx
    │   ├── NumberSystemPage.tsx
    │   ├── InstructionDecoderPage.tsx
    │   ├── DatapathPage.tsx
    │   ├── PipelinePage.tsx
    │   └── CachePage.tsx
    ├── lib/
    │   ├── number.ts      # 进制/补码/浮点转换（纯函数）
    │   ├── riscv.ts       # RISC-V RV32I 编解码
    │   ├── pipeline.ts    # 流水线模拟引擎
    │   ├── cache.ts       # Cache 模拟引擎
    │   └── datapath.ts    # 数据通路控制信号分析
    └── styles/
        ├── global.css
        ├── number-system.css
        ├── instruction-decoder.css
        ├── cache.css
        ├── pipeline.css
        └── datapath.css
```

## 开发规范

### 命名
- 页面组件: PascalCase（`PipelinePage.tsx`）
- 工具函数: camelCase
- CSS 文件: kebab-case（`number-system.css`）

### 验证命令
```bash
npm run dev          # 启动开发服务器 (localhost:5173)
npm run build        # TypeScript 检查 + Vite 生产构建
npm run typecheck    # 仅 TypeScript 类型检查
```

### 代码原则
- 逻辑层（`src/lib/`）与视图层（`src/pages/`）严格分离
- `lib/` 下的函数是纯函数，不依赖 React，方便单独测试
- 每个模块用 React 组件内 useState 管理状态，不引入外部状态库
- 数据通路图用内联 SVG，通过 className 控制高亮
- 各模块独立，不共享运行时状态

### 接力开发须知
- 拿到项目先跑 `npm run build` 确认现有代码健康
- 改动前读 `docs/MODULE_SPEC.md` 了解该模块的设计意图
- Commit message 格式: `feat(module): 描述` / `fix(module): 描述`
- 不要动其他模块的代码，除非修 bug 或调整共享组件

## 当前进度

- [x] 项目骨架搭建（路由、布局、导航）
- [x] Number Converter 模块（进制互转、补码、IEEE 754）
- [x] Instruction Codec 模块（RV32I 全部 6 种格式编解码）
- [x] Cache Simulator 模块（直接映射/组相联/全相联，LRU/FIFO/Random）
- [x] Pipeline Simulator 模块（五级流水线、冒险检测、forwarding）
- [x] Datapath Viewer 模块（SVG 数据通路图、控制信号可视化）

## 待优化方向（接力开发可选）

- [ ] 添加单元测试（Vitest）覆盖 lib/ 下的核心逻辑
- [ ] 响应式布局适配移动端
- [ ] 深色/浅色主题切换
- [ ] 数据通路动画效果（路径流动动画）
- [ ] 流水线模拟器增加分支预测模式
- [ ] i18n 国际化（中英文切换）
- [ ] 部署配置（GitHub Pages / Vercel）
- [ ] 添加使用教程/帮助面板
- [ ] Cache 模块增加写策略可视化（write-back dirty bit 动画）
- [ ] 性能优化：大地址序列时 Cache 模拟的渲染性能
