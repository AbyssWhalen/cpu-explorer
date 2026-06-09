import { useState, useCallback } from 'react'
import '../styles/pipeline.css'
import {
  PipelineConfig, PipelineResult, CycleCell,
  parseInstructions, simulate, EXAMPLE_CODE,
} from '../lib/pipeline'

export function PipelinePage() {
  const [code, setCode] = useState(EXAMPLE_CODE)
  const [config, setConfig] = useState<PipelineConfig>({
    forwarding: true,
    branchPrediction: 'not-taken',
  })
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [error, setError] = useState('')

  const run = useCallback(() => {
    try {
      const instrs = parseInstructions(code)
      if (instrs.length === 0) {
        setError('请至少输入一条指令')
        setResult(null)
        return
      }
      if (instrs.length > 20) {
        setError('最多支持 20 条指令')
        setResult(null)
        return
      }
      const res = simulate(instrs, config)
      setResult(res)
      setError('')
    } catch (e: any) {
      setError(e.message || '模拟出错')
      setResult(null)
    }
  }, [code, config])

  return (
    <div className="pipeline-page">
      <h2>流水线模拟器</h2>
      <p className="module-desc">五级流水线可视化：观察数据冒险、forwarding 和 stall</p>

      <div className="pipeline-controls">
        <div className="pipeline-input">
          <label>RISC-V 汇编代码（每行一条指令）：</label>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder="add x1, x2, x3&#10;sub x4, x1, x5"
          />
        </div>

        <div className="pipeline-config">
          <label>
            <input
              type="checkbox"
              checked={config.forwarding}
              onChange={e => setConfig({ ...config, forwarding: e.target.checked })}
            />
            数据前递（Forwarding）
          </label>
          <label>
            分支处理：
            <select
              value={config.branchPrediction}
              onChange={e => setConfig({ ...config, branchPrediction: e.target.value as any })}
            >
              <option value="none">阻塞（不预测）</option>
              <option value="not-taken">预测不跳转</option>
            </select>
          </label>
          <button onClick={run} className="btn-simulate">开始模拟</button>
        </div>
      </div>

      {error && <div className="pipeline-error">{error}</div>}

      {result && (
        <div className="pipeline-result">
          <div className="pipeline-stats">
            <span>总周期数：<strong>{result.totalCycles}</strong></span>
            <span>指令数：<strong>{result.instructions.length}</strong></span>
            <span>CPI：<strong>{(result.totalCycles / result.instructions.length).toFixed(2)}</strong></span>
            <span>冒险数：<strong>{result.hazards.length}</strong></span>
          </div>

          <div className="pipeline-timeline-wrapper">
            <table className="pipeline-timeline">
              <thead>
                <tr>
                  <th className="instr-header">指令</th>
                  {Array.from({ length: result.totalCycles }, (_, i) => (
                    <th key={i} className="cycle-header">CC{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.instructions.map((instr, i) => (
                  <tr key={i}>
                    <td className="instr-cell" title={instr.assembly}>
                      {instr.assembly}
                    </td>
                    {result.timeline[i].map((cell, c) => (
                      <td key={c} className={cellClass(cell)}>
                        {cellContent(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.hazards.length > 0 && (
            <div className="pipeline-hazards">
              <h3>检测到的冒险</h3>
              <ul>
                {result.hazards.map((h, i) => (
                  <li key={i} className={`hazard-${h.resolved}`}>
                    <span className="hazard-type">{hazardTypeLabel(h.type)}</span>
                    {' '}于 指令{h.fromInstr + 1} → 指令{h.toInstr + 1}
                    {h.register && <span className="hazard-reg"> （寄存器 {h.register}）</span>}
                    {' — '}
                    <span className="hazard-resolve">{hazardResolveLabel(h.resolved)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pipeline-legend">
            <span className="legend-item"><span className="cell-if">IF</span> 取指</span>
            <span className="legend-item"><span className="cell-id">ID</span> 译码</span>
            <span className="legend-item"><span className="cell-ex">EX</span> 执行</span>
            <span className="legend-item"><span className="cell-mem">MEM</span> 访存</span>
            <span className="legend-item"><span className="cell-wb">WB</span> 写回</span>
            <span className="legend-item"><span className="cell-stall">○</span> 停顿</span>
            <span className="legend-item"><span className="cell-flush">✕</span> 冲刷</span>
            <span className="legend-item"><span className="cell-fwd">FWD</span> 前递</span>
          </div>
        </div>
      )}
    </div>
  )
}

function cellClass(cell: CycleCell): string {
  if (cell.bubble === 'stall') return 'timeline-cell cell-stall'
  if (cell.bubble === 'flush') return 'timeline-cell cell-flush'
  if (cell.forwarding) return `timeline-cell cell-${cell.stage?.toLowerCase()} cell-fwd`
  if (cell.stage) return `timeline-cell cell-${cell.stage.toLowerCase()}`
  return 'timeline-cell cell-empty'
}

function cellContent(cell: CycleCell): string {
  if (cell.bubble === 'stall') return '○'
  if (cell.bubble === 'flush') return '✕'
  if (cell.forwarding) return `${cell.stage}↗`
  if (cell.stage) return cell.stage
  return ''
}

function hazardTypeLabel(type: 'RAW' | 'load-use' | 'control'): string {
  switch (type) {
    case 'RAW': return 'RAW 数据冒险'
    case 'load-use': return 'Load-Use 冒险'
    case 'control': return '控制冒险'
  }
}

function hazardResolveLabel(resolved: 'forwarding' | 'stall' | 'flush'): string {
  switch (resolved) {
    case 'forwarding': return '前递解决'
    case 'stall': return '插入停顿'
    case 'flush': return '冲刷流水线'
  }
}
