import { useState, useEffect } from 'react'
import '../styles/datapath.css'
import { analyzeInstruction, DatapathState, SIGNAL_DESCRIPTIONS, ControlSignals } from '../lib/datapath'

const EXAMPLES = [
  'add x1, x2, x3',
  'addi x5, x0, 10',
  'lw x6, 0(x7)',
  'sw x8, 4(x9)',
  'beq x1, x2, 16',
  'lui x10, 0x12345',
  'jal x1, 100',
  'jalr x0, x1, 0',
]

export function DatapathPage() {
  const [input, setInput] = useState('add x1, x2, x3')
  const [state, setState] = useState<DatapathState>(() => analyzeInstruction('add x1, x2, x3'))

  useEffect(() => {
    setState(analyzeInstruction(input))
  }, [input])

  const isComponentActive = (id: string) => state.activeComponents.includes(id)
  const isPathActive = (id: string) => state.activePaths.includes(id)

  const componentClass = (id: string) =>
    `dp-component ${isComponentActive(id) ? 'active' : 'inactive'}`
  const pathClass = (id: string) =>
    `dp-path ${isPathActive(id) ? 'active' : 'inactive'}`

  return (
    <div className="datapath-page">
      <h2>数据通路</h2>
      <p className="module-desc">输入一条 RISC-V 指令，观察数据在单周期数据通路中的流动路径和控制信号</p>

      <div className="dp-input-section">
        <div className="dp-input-row">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入 RISC-V 汇编指令，如 add x1, x2, x3"
            className="dp-input"
          />
        </div>
        <div className="dp-examples">
          <span>示例：</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              className="dp-example-btn"
              onClick={() => setInput(ex)}
            >{ex}</button>
          ))}
        </div>
      </div>

      <div className="dp-description">
        {state.type && <span className="dp-type-badge">{state.type}-type</span>}
        <span>{state.description}</span>
      </div>

      {/* SVG Datapath Diagram */}
      <div className="dp-diagram-container">
        <svg viewBox="0 0 900 500" className="dp-svg">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>

          {/* PC */}
          <g className={componentClass('pc')}>
            <rect x="30" y="200" width="60" height="80" rx="4" />
            <text x="60" y="245" textAnchor="middle">PC</text>
          </g>

          {/* PC → Instruction Memory */}
          <line className={pathClass('pc-to-imem')} x1="90" y1="240" x2="140" y2="240" markerEnd="url(#arrow)" />

          {/* Instruction Memory */}
          <g className={componentClass('imem')}>
            <rect x="140" y="190" width="100" height="100" rx="4" />
            <text x="190" y="235" textAnchor="middle">Instruction</text>
            <text x="190" y="255" textAnchor="middle">Memory</text>
          </g>

          {/* IMEM → Control */}
          <line className={pathClass('imem-to-ctrl')} x1="190" y1="190" x2="190" y2="90" />
          <line className={pathClass('imem-to-ctrl')} x1="190" y1="90" x2="250" y2="90" markerEnd="url(#arrow)" />

          {/* Control Unit */}
          <g className={componentClass('control')}>
            <rect x="250" y="60" width="120" height="60" rx="4" />
            <text x="310" y="95" textAnchor="middle">Control</text>
          </g>

          {/* IMEM → Register File */}
          <line className={pathClass('imem-to-reg')} x1="240" y1="240" x2="310" y2="240" markerEnd="url(#arrow)" />

          {/* IMEM → Imm Gen */}
          <line className={pathClass('imem-to-immgen')} x1="190" y1="290" x2="190" y2="345" />
          <line className={pathClass('imem-to-immgen')} x1="190" y1="345" x2="290" y2="345" markerEnd="url(#arrow)" />

          {/* Imm Gen */}
          <g className={componentClass('imm-gen')}>
            <rect x="290" y="320" width="80" height="50" rx="4" />
            <text x="330" y="350" textAnchor="middle">Imm Gen</text>
          </g>

          {/* Register File */}
          <g className={componentClass('registers')}>
            <rect x="310" y="190" width="100" height="100" rx="4" />
            <text x="360" y="235" textAnchor="middle">Register</text>
            <text x="360" y="255" textAnchor="middle">File</text>
          </g>

          {/* Register rs1 → ALU */}
          <line className={pathClass('reg-rs1-to-alu')} x1="410" y1="220" x2="470" y2="220" markerEnd="url(#arrow)" />

          {/* Register rs2 → MUX ALU */}
          <line className={pathClass('reg-rs2-to-mux-alu')} x1="410" y1="260" x2="470" y2="260" markerEnd="url(#arrow)" />

          {/* Imm Gen → MUX ALU */}
          <line className={pathClass('immgen-to-mux-alu')} x1="370" y1="345" x2="480" y2="345" />
          <line className={pathClass('immgen-to-mux-alu')} x1="480" y1="345" x2="480" y2="280" markerEnd="url(#arrow)" />

          {/* MUX ALUSrc */}
          <g className={componentClass('mux-alu-src')}>
            <polygon points="470,210 470,280 500,270 500,220" />
            <text x="480" y="250" fontSize="9" textAnchor="middle">M</text>
          </g>

          {/* MUX → ALU */}
          <line className={pathClass('mux-alu-to-alu')} x1="500" y1="240" x2="540" y2="240" markerEnd="url(#arrow)" />

          {/* ALU */}
          <g className={componentClass('alu')}>
            <polygon points="540,200 540,280 600,260 600,220" />
            <text x="565" y="245" textAnchor="middle">ALU</text>
          </g>

          {/* ALU → Data Memory */}
          <line className={pathClass('alu-to-dmem')} x1="600" y1="240" x2="660" y2="240" markerEnd="url(#arrow)" />

          {/* Data Memory */}
          <g className={componentClass('dmem')}>
            <rect x="660" y="190" width="100" height="100" rx="4" />
            <text x="710" y="235" textAnchor="middle">Data</text>
            <text x="710" y="255" textAnchor="middle">Memory</text>
          </g>

          {/* Register rs2 → Data Memory (Store) */}
          <line className={pathClass('reg-rs2-to-dmem')} x1="410" y1="270" x2="440" y2="380" />
          <line className={pathClass('reg-rs2-to-dmem')} x1="440" y1="380" x2="710" y2="380" />
          <line className={pathClass('reg-rs2-to-dmem')} x1="710" y1="380" x2="710" y2="290" markerEnd="url(#arrow)" />

          {/* Data Memory → MUX WB */}
          <line className={pathClass('dmem-to-mux-wb')} x1="760" y1="240" x2="800" y2="240" markerEnd="url(#arrow)" />

          {/* ALU result → MUX WB bypass */}
          <line className={pathClass('alu-to-mux-wb')} x1="600" y1="225" x2="630" y2="170" />
          <line className={pathClass('alu-to-mux-wb')} x1="630" y1="170" x2="810" y2="170" />
          <line className={pathClass('alu-to-mux-wb')} x1="810" y1="170" x2="810" y2="220" markerEnd="url(#arrow)" />

          {/* MUX WB (MemtoReg) */}
          <g className={componentClass('mux-wb')}>
            <polygon points="800,220 800,270 830,260 830,230" />
            <text x="810" y="250" fontSize="9" textAnchor="middle">M</text>
          </g>

          {/* MUX WB → Register File (writeback) */}
          <line className={pathClass('mux-wb-to-reg')} x1="830" y1="245" x2="860" y2="245" />
          <line className={pathClass('mux-wb-to-reg')} x1="860" y1="245" x2="860" y2="430" />
          <line className={pathClass('mux-wb-to-reg')} x1="860" y1="430" x2="360" y2="430" />
          <line className={pathClass('mux-wb-to-reg')} x1="360" y1="430" x2="360" y2="290" markerEnd="url(#arrow)" />

          {/* Branch Adder */}
          <g className={componentClass('branch-adder')}>
            <rect x="400" y="60" width="70" height="40" rx="4" />
            <text x="435" y="85" textAnchor="middle" fontSize="10">Add</text>
          </g>

          {/* PC → Branch Adder */}
          <line className={pathClass('pc-to-adder')} x1="60" y1="200" x2="60" y2="80" />
          <line className={pathClass('pc-to-adder')} x1="60" y1="80" x2="400" y2="80" markerEnd="url(#arrow)" />

          {/* Imm Gen → Branch Adder */}
          <line className={pathClass('immgen-to-adder')} x1="330" y1="320" x2="330" y2="70" />
          <line className={pathClass('immgen-to-adder')} x1="330" y1="70" x2="400" y2="70" markerEnd="url(#arrow)" />

          {/* AND gate */}
          <g className={componentClass('and-gate')}>
            <rect x="540" y="60" width="50" height="40" rx="4" />
            <text x="565" y="85" textAnchor="middle" fontSize="10">AND</text>
          </g>

          {/* ALU Zero → AND */}
          <line className={pathClass('alu-zero-to-and')} x1="580" y1="200" x2="580" y2="100" markerEnd="url(#arrow)" />

          {/* Branch Adder → MUX PC */}
          <line className={pathClass('adder-to-mux-pc')} x1="470" y1="80" x2="540" y2="80" />

          {/* MUX PC */}
          <g className={componentClass('mux-pc')}>
            <rect x="620" y="15" width="50" height="30" rx="4" />
            <text x="645" y="35" textAnchor="middle" fontSize="9">MUX</text>
          </g>

          {/* AND/Adder → MUX PC → PC */}
          <line className={pathClass('adder-to-mux-pc')} x1="590" y1="60" x2="620" y2="30" markerEnd="url(#arrow)" />
          <line className={pathClass('mux-pc-to-pc')} x1="620" y1="30" x2="30" y2="30" />
          <line className={pathClass('mux-pc-to-pc')} x1="30" y1="30" x2="30" y2="200" markerEnd="url(#arrow)" />

          {/* PC+4 → MUX WB (for JAL/JALR) */}
          <line className={pathClass('pc-plus4-to-mux-wb')} x1="90" y1="220" x2="120" y2="150" />
          <line className={pathClass('pc-plus4-to-mux-wb')} x1="120" y1="150" x2="800" y2="150" />
          <line className={pathClass('pc-plus4-to-mux-wb')} x1="800" y1="150" x2="800" y2="220" markerEnd="url(#arrow)" />

          {/* ALU → MUX PC (for JALR) */}
          <line className={pathClass('alu-to-mux-pc')} x1="600" y1="210" x2="630" y2="45" markerEnd="url(#arrow)" />
        </svg>
      </div>

      {/* Control Signals Table */}
      <div className="dp-signals-section">
        <h3>控制信号</h3>
        <div className="dp-signals-grid">
          {(Object.keys(SIGNAL_DESCRIPTIONS) as (keyof ControlSignals)[]).map(key => {
            const value = state.signals[key]
            const display = typeof value === 'boolean' ? (value ? '1' : '0') : String(value)
            const isHigh = typeof value === 'boolean' ? value : false
            return (
              <div key={key} className="dp-signal-item">
                <span className="dp-signal-label" title={SIGNAL_DESCRIPTIONS[key]}>{key}</span>
                <span className={`dp-signal-value ${isHigh ? 'high' : typeof value === 'string' ? 'text' : 'low'}`}>
                  {display}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
