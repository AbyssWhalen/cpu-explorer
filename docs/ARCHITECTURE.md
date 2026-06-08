# 架构设计

## 整体结构

```
┌─────────────────────────────────────────────────┐
│                   App Shell                      │
│  ┌─────────────────────────────────────────┐    │
│  │            Navigation Bar               │    │
│  ├─────────────────────────────────────────┤    │
│  │                                         │    │
│  │         Module Content Area             │    │
│  │                                         │    │
│  │  ┌───────────┐  ┌──────────────────┐   │    │
│  │  │  Control  │  │  Visualization   │   │    │
│  │  │   Panel   │  │     Area         │   │    │
│  │  │           │  │                  │   │    │
│  │  └───────────┘  └──────────────────┘   │    │
│  │                                         │    │
│  │  ┌──────────────────────────────────┐   │    │
│  │  │        Info / Explanation        │   │    │
│  │  └──────────────────────────────────┘   │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

每个模块遵循统一布局：左侧控制面板 + 右侧可视化区域 + 底部说明区域。

## 数据流

```
User Input → Control Panel → Zustand Store → Simulation Engine (lib/)
                                                      ↓
                                              State Update
                                                      ↓
Visualization ← React Component ← Zustand Store (subscribe)
```

关键设计：模拟引擎是纯函数，接收当前状态 + 输入，返回新状态。组件订阅 store 变化做渲染。

## 模块间关系

模块之间完全独立，不共享状态。共享的只有：
- `src/components/common/` — 通用 UI 组件（按钮、输入框、提示框等）
- `src/types/common.ts` — 通用类型
- `src/hooks/` — 通用 hooks（如动画步进控制）

## 路由设计

使用 React Router，每个模块一个路由：

```
/                    → 首页（模块导航卡片）
/number-converter    → 进制转换器
/instruction-codec   → 指令编解码
/datapath            → 数据通路
/pipeline            → 流水线模拟
/cache               → Cache 模拟
```

## 动画策略

- **流水线**: 每个时钟周期为一帧，用户可单步/自动播放/调速
- **Cache**: 每次内存访问为一帧，高亮命中/缺失路径
- **数据通路**: 指令执行过程中数据流经的路径高亮动画

统一使用 `useSimulation` hook 管理播放状态：
```typescript
interface SimulationControl {
  currentStep: number
  totalSteps: number
  isPlaying: boolean
  speed: number // ms per step
  play(): void
  pause(): void
  step(): void
  reset(): void
  setSpeed(ms: number): void
}
```

## 响应式策略

- 桌面优先（主要使用场景是对着电脑学习）
- 平板可用（控制面板折叠到顶部）
- 手机只保证信息可读，不保证交互体验完美
