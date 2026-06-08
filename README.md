# CPU Explorer

交互式计算机组成原理学习平台。通过可视化动画帮助理解 CPU 内部工作原理。

## 模块

| 模块 | 说明 | 状态 |
|------|------|------|
| 进制与编码 | 进制转换、补码、IEEE 754 浮点数 | 📋 待开发 |
| 指令解码 | RISC-V 指令格式拆解，汇编 ↔ 机器码 | 📋 待开发 |
| 数据通路 | 单周期 CPU 数据通路动画 | 📋 待开发 |
| 流水线 | 五级流水线模拟，冒险检测 | 📋 待开发 |
| Cache 模拟 | 多种映射/替换策略可视化 | 📋 待开发 |

## 技术栈

- React 18 + TypeScript
- Vite
- React Router
- Framer Motion（动画）
- Zustand（状态管理）

## 开发

```bash
npm install
npm run dev
```

访问 http://localhost:5173

## 构建

```bash
npm run build
```

## 项目结构

```
src/
├── components/     # 通用 UI 组件
├── pages/          # 各模块页面
├── simulators/     # 模拟器核心逻辑（纯函数，无 UI 依赖）
├── styles/         # 全局样式
└── utils/          # 工具函数
```

## 协作开发

本项目设计为多人/多 AI 接力开发，详见：

- `CLAUDE.md` — AI 开发规范与约定
- `docs/HANDOFF.md` — 接力开发指南
- `docs/MODULE_SPEC.md` — 各模块详细需求
- `docs/ARCHITECTURE.md` — 架构设计文档

## License

MIT
