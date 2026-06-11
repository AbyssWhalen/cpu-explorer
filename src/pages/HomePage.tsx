import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import '../styles/home.css'

type Status = 'done' | 'wip' | 'todo'

type Module = {
  title: string
  subtitle: string
  description: string
  path: string
  status: Status
  icon: ReactNode
}

// 极简线性图标，currentColor 跟随主题
const icons = {
  number: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4 3 6m2-2v16M9 7h6m-6 5h6m-6 5h6" />
      <path d="M19 4l2 2m-2-2v16" />
    </svg>
  ),
  instruction: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 13h5m-5 3h8" />
    </svg>
  ),
  datapath: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="9" width="6" height="6" rx="1" />
      <rect x="16" y="9" width="6" height="6" rx="1" />
      <path d="M8 12h8m-3-3 3 3-3 3" />
    </svg>
  ),
  pipeline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="4" height="4" rx="1" />
      <rect x="8" y="9" width="4" height="4" rx="1" />
      <rect x="13" y="13" width="4" height="4" rx="1" />
      <rect x="18" y="17" width="3" height="3" rx="1" />
    </svg>
  ),
  cache: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  ),
}

const modules: Module[] = [
  {
    title: '进制与编码',
    subtitle: 'Number & Encoding',
    description: '十进制 / 二进制 / 十六进制互转，原反补码与 IEEE 754 浮点编码',
    path: '/number-system',
    status: 'done',
    icon: icons.number,
  },
  {
    title: '指令解码',
    subtitle: 'Instruction Codec',
    description: 'RISC-V RV32I 指令格式拆解，汇编 ↔ 机器码双向转换',
    path: '/instruction-decoder',
    status: 'done',
    icon: icons.instruction,
  },
  {
    title: '数据通路',
    subtitle: 'Datapath',
    description: '单周期 CPU 数据通路图，逐指令高亮控制信号与数据流向',
    path: '/datapath',
    status: 'done',
    icon: icons.datapath,
  },
  {
    title: '流水线',
    subtitle: 'Pipeline',
    description: '五级流水线时空图，数据 / 控制冒险检测与 forwarding 路径展示',
    path: '/pipeline',
    status: 'done',
    icon: icons.pipeline,
  },
  {
    title: 'Cache 模拟',
    subtitle: 'Cache Simulator',
    description: '直接映射 / 组相联 / 全相联，LRU / FIFO 替换策略逐步可视化',
    path: '/cache',
    status: 'done',
    icon: icons.cache,
  },
]

const statusLabel: Record<Status, string> = {
  done: '已完成',
  wip: '开发中',
  todo: '待开发',
}

export function HomePage() {
  return (
    <div className="home">
      <header className="home-hero">
        <span className="home-eyebrow">交互式学习平台</span>
        <h1>CPU Explorer</h1>
        <p>把计算机组成原理的抽象概念变成可以动手拨弄的可视化模块，看得见每一个 bit 的流向。</p>
      </header>

      <section className="module-grid">
        {modules.map((m, i) => (
          <Link key={m.path} to={m.path} className="module-card">
            <div className="module-card-top">
              <span className="module-icon" aria-hidden>{m.icon}</span>
              <span className="module-index">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3>{m.title}</h3>
            <span className="module-subtitle">{m.subtitle}</span>
            <p>{m.description}</p>
            <div className="module-card-foot">
              <span className={`module-status status-${m.status}`}>{statusLabel[m.status]}</span>
              <span className="module-arrow" aria-hidden>→</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
