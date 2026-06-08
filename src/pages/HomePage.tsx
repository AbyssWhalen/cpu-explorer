import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div>
      <h1>CPU Explorer</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
        交互式计算机组成原理学习平台
      </p>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <ModuleCard
          title="进制与编码"
          description="十进制/二进制/十六进制转换，补码、浮点数 IEEE 754 编码"
          path="/number"
          status="done"
        />
        <ModuleCard
          title="指令解码"
          description="RISC-V 指令格式拆解，汇编 ↔ 机器码双向转换"
          path="/instruction"
          status="done"
        />
        <ModuleCard
          title="数据通路"
          description="单周期 CPU 数据通路动画，控制信号可视化"
          path="/datapath"
          status="done"
        />
        <ModuleCard
          title="流水线"
          description="五级流水线模拟，冒险检测，forwarding 路径展示"
          path="/pipeline"
          status="done"
        />
        <ModuleCard
          title="Cache 模拟"
          description="直接映射/组相联/全相联，LRU/FIFO 替换策略动画"
          path="/cache"
          status="done"
        />
      </div>
    </div>
  )
}

function ModuleCard({ title, description, path, status }: { title: string; description: string; path: string; status: 'done' | 'wip' | 'todo' }) {
  const statusLabel = { done: '✅ 完成', wip: '🚧 开发中', todo: '📋 待开发' }
  return (
    <Link to={path} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '1.25rem',
        transition: 'border-color 0.2s, transform 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none' }}
      >
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{description}</p>
        <span style={{ fontSize: '0.8rem' }}>{statusLabel[status]}</span>
      </div>
    </Link>
  )
}
