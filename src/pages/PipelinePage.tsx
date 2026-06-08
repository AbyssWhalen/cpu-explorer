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
        setError('Please enter at least one instruction')
        setResult(null)
        return
      }
      if (instrs.length > 20) {
        setError('Maximum 20 instructions supported')
        setResult(null)
        return
      }
      const res = simulate(instrs, config)
      setResult(res)
      setError('')
    } catch (e: any) {
      setError(e.message || 'Simulation error')
      setResult(null)
    }
  }, [code, config])

  return (
    <div className="pipeline-page">
      <h2>Pipeline Simulator</h2>
      <p className="module-desc">五级流水线可视化：观察数据冒险、forwarding 和 stall</p>

      <div className="pipeline-controls">
        <div className="pipeline-input">
          <label>RISC-V Assembly (one instruction per line):</label>
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
            Data Forwarding
          </label>
          <label>
            Branch Handling:
            <select
              value={config.branchPrediction}
              onChange={e => setConfig({ ...config, branchPrediction: e.target.value as any })}
            >
              <option value="none">Stall (no prediction)</option>
              <option value="not-taken">Predict Not-Taken</option>
            </select>
          </label>
          <button onClick={run} className="btn-simulate">Simulate</button>
        </div>
      </div>

      {error && <div className="pipeline-error">{error}</div>}

      {result && (
        <div className="pipeline-result">
          <div className="pipeline-stats">
            <span>Total Cycles: <strong>{result.totalCycles}</strong></span>
            <span>Instructions: <strong>{result.instructions.length}</strong></span>
            <span>CPI: <strong>{(result.totalCycles / result.instructions.length).toFixed(2)}</strong></span>
            <span>Hazards: <strong>{result.hazards.length}</strong></span>
          </div>

          <div className="pipeline-timeline-wrapper">
            <table className="pipeline-timeline">
              <thead>
                <tr>
                  <th className="instr-header">Instruction</th>
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
              <h3>Detected Hazards</h3>
              <ul>
                {result.hazards.map((h, i) => (
                  <li key={i} className={`hazard-${h.resolved}`}>
                    <span className="hazard-type">{h.type}</span>
                    {' '}between I{h.fromInstr + 1} → I{h.toInstr + 1}
                    {h.register && <span className="hazard-reg"> ({h.register})</span>}
                    {' — '}
                    <span className="hazard-resolve">{h.resolved}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pipeline-legend">
            <span className="legend-item"><span className="cell-if">IF</span> Fetch</span>
            <span className="legend-item"><span className="cell-id">ID</span> Decode</span>
            <span className="legend-item"><span className="cell-ex">EX</span> Execute</span>
            <span className="legend-item"><span className="cell-mem">MEM</span> Memory</span>
            <span className="legend-item"><span className="cell-wb">WB</span> WriteBack</span>
            <span className="legend-item"><span className="cell-stall">stall</span> Bubble</span>
            <span className="legend-item"><span className="cell-flush">flush</span> Flush</span>
            <span className="legend-item"><span className="cell-fwd">FWD</span> Forwarding</span>
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
