import { Link } from 'react-router-dom'
import '../styles/home.css'

type Status = 'done' | 'wip' | 'todo'

const modules: { title: string; description: string; path: string; status: Status }[] = [
  {
    title: '进制与编码',
    description: '十进制/二进制/十六进制转换，补码、浮点数 IEEE 754 编码',
    path: '/number-system',
    status: 'done',
  },
  {
    title: '指令解码',
    description: 'RISC-V 指令格式拆解，汇编 ↔ 机器码双向转换',
    path: '/instruction-decoder',
    status: 'done',
  },
  {
    title: '数据通路',
    description: '单周期 CPU 数据通路动画，控制信号可视化',
    path: '/datapath',
    status: 'done',
  },
  {
    title: '流水线',
    description: '五级流水线模拟，冒险检测，forwarding 路径展示',
    path: '/pipeline',
    status: 'done',
  },
  {
    title: 'Cache 模拟',
    description: '直接映射/组相联/全相联，LRU/FIFO 替换策略动画',
    path: '/cache',
    status: 'done',
  },
]

const statusLabel: Record<Status, string> = {
  done: '✅ 完成',
  wip: '🚧 开发中',
  todo: '📋 待开发',
}

export function HomePage() {
  return (
    <div>
      <div className="home-hero">
        <h1>CPU Explorer</h1>
        <p>交互式计算机组成原理学习平台</p>
      </div>

      <div className="module-grid">
        {modules.map((m) => (
          <Link key={m.path} to={m.path} className="module-card">
            <h3>{m.title}</h3>
            <p>{m.description}</p>
            <span className="module-status">{statusLabel[m.status]}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
