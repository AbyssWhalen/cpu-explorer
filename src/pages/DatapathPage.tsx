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
            spellCheck={false}
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
        {state.type && <span className="dp-type-badge">{state.type}-型</span>}
        <span>{state.description}</span>
      </div>

      {/* SVG Datapath Diagram */}
      <div className="dp-diagram-container">
        <svg viewBox="0 0 940 500" className="dp-svg">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>

          {/* ============ WIRES (drawn first, under components) ============ */}
          {/* Main left-to-right datapath (mid band y~250-290) */}

          {/* PC → 指令存储器 */}
          <line className={pathClass('pc-to-imem')} x1="82" y1="259" x2="130" y2="259" markerEnd="url(#arrow)" />

          {/* 指令存储器 → 寄存器堆 (指令字段) */}
          <line className={pathClass('imem-to-reg')} x1="226" y1="259" x2="288" y2="259" markerEnd="url(#arrow)" />

          {/* 指令存储器 → 控制器 (opcode) */}
          <line className={pathClass('imem-to-ctrl')} x1="178" y1="222" x2="178" y2="143" />
          <line className={pathClass('imem-to-ctrl')} x1="178" y1="143" x2="288" y2="143" markerEnd="url(#arrow)" />

          {/* 指令存储器 → 立即数生成 */}
          <line className={pathClass('imem-to-immgen')} x1="178" y1="296" x2="178" y2="383" />
          <line className={pathClass('imem-to-immgen')} x1="178" y1="383" x2="288" y2="383" markerEnd="url(#arrow)" />

          {/* 寄存器堆 rs1 → ALU 输入1 */}
          <line className={pathClass('reg-rs1-to-alu')} x1="392" y1="250" x2="512" y2="250" markerEnd="url(#arrow)" />

          {/* 寄存器堆 rs2 → ALU 多路选择器 (上输入) */}
          <line className={pathClass('reg-rs2-to-mux-alu')} x1="392" y1="270" x2="445" y2="270" markerEnd="url(#arrow)" />

          {/* 立即数生成 → ALU 多路选择器 (下输入) */}
          <line className={pathClass('immgen-to-mux-alu')} x1="392" y1="383" x2="424" y2="383" />
          <line className={pathClass('immgen-to-mux-alu')} x1="424" y1="383" x2="424" y2="298" />
          <line className={pathClass('immgen-to-mux-alu')} x1="424" y1="298" x2="445" y2="298" markerEnd="url(#arrow)" />

          {/* ALU 多路选择器 → ALU 输入2 */}
          <line className={pathClass('mux-alu-to-alu')} x1="472" y1="284" x2="512" y2="284" markerEnd="url(#arrow)" />

          {/* ALU → 数据存储器 (地址) */}
          <line className={pathClass('alu-to-dmem')} x1="592" y1="262" x2="658" y2="262" markerEnd="url(#arrow)" />

          {/* 寄存器堆 rs2 → 数据存储器 (写数据, store) — 底部通道 y460 */}
          <line className={pathClass('reg-rs2-to-dmem')} x1="392" y1="288" x2="408" y2="288" />
          <line className={pathClass('reg-rs2-to-dmem')} x1="408" y1="288" x2="408" y2="460" />
          <line className={pathClass('reg-rs2-to-dmem')} x1="408" y1="460" x2="706" y2="460" />
          <line className={pathClass('reg-rs2-to-dmem')} x1="706" y1="460" x2="706" y2="302" markerEnd="url(#arrow)" />

          {/* 数据存储器 → 写回多路选择器 (上输入) */}
          <line className={pathClass('dmem-to-mux-wb')} x1="754" y1="262" x2="820" y2="262" markerEnd="url(#arrow)" />

          {/* ALU 结果 → 写回多路选择器 (旁路) — 轨道 y196, 竖管 x794 */}
          <line className={pathClass('alu-to-mux-wb')} x1="592" y1="250" x2="600" y2="250" />
          <line className={pathClass('alu-to-mux-wb')} x1="600" y1="250" x2="600" y2="196" />
          <line className={pathClass('alu-to-mux-wb')} x1="600" y1="196" x2="794" y2="196" />
          <line className={pathClass('alu-to-mux-wb')} x1="794" y1="196" x2="794" y2="276" />
          <line className={pathClass('alu-to-mux-wb')} x1="794" y1="276" x2="820" y2="276" markerEnd="url(#arrow)" />

          {/* 写回多路选择器 → 寄存器堆 (写回) — 最底部回流 y478, 竖管 x885 */}
          <line className={pathClass('mux-wb-to-reg')} x1="847" y1="283" x2="885" y2="283" />
          <line className={pathClass('mux-wb-to-reg')} x1="885" y1="283" x2="885" y2="478" />
          <line className={pathClass('mux-wb-to-reg')} x1="885" y1="478" x2="340" y2="478" />
          <line className={pathClass('mux-wb-to-reg')} x1="340" y1="478" x2="340" y2="314" markerEnd="url(#arrow)" />

          {/* ===== 顶部 PC 更新带 (互不重叠的水平轨道) ===== */}

          {/* PC → 分支加法器 (输入1) — 轨道 y52, 竖管 x66 */}
          <line className={pathClass('pc-to-adder')} x1="66" y1="225" x2="66" y2="52" />
          <line className={pathClass('pc-to-adder')} x1="66" y1="52" x2="442" y2="52" markerEnd="url(#arrow)" />

          {/* 立即数生成 → 分支加法器 (偏移量) — 竖管 x430 */}
          <line className={pathClass('immgen-to-adder')} x1="392" y1="372" x2="430" y2="372" />
          <line className={pathClass('immgen-to-adder')} x1="430" y1="372" x2="430" y2="76" />
          <line className={pathClass('immgen-to-adder')} x1="430" y1="76" x2="442" y2="76" markerEnd="url(#arrow)" />

          {/* ALU zero → 与门 — 竖管 x550 */}
          <line className={pathClass('alu-zero-to-and')} x1="550" y1="226" x2="550" y2="64" />
          <line className={pathClass('alu-zero-to-and')} x1="550" y1="64" x2="598" y2="64" markerEnd="url(#arrow)" />

          {/* 分支加法器 → PC 多路选择器 — 最顶轨道 y12, 竖管 x528 */}
          <line className={pathClass('adder-to-mux-pc')} x1="520" y1="64" x2="528" y2="64" />
          <line className={pathClass('adder-to-mux-pc')} x1="528" y1="64" x2="528" y2="12" />
          <line className={pathClass('adder-to-mux-pc')} x1="528" y1="12" x2="47" y2="12" />
          <line className={pathClass('adder-to-mux-pc')} x1="47" y1="12" x2="47" y2="40" markerEnd="url(#arrow)" />

          {/* PC 多路选择器 → PC */}
          <line className={pathClass('mux-pc-to-pc')} x1="47" y1="106" x2="47" y2="225" markerEnd="url(#arrow)" />

          {/* PC+4 → 写回多路选择器 (jal 链接地址) — 轨道 y180, 竖管 x806 */}
          <line className={pathClass('pc-plus4-to-mux-wb')} x1="76" y1="225" x2="76" y2="180" />
          <line className={pathClass('pc-plus4-to-mux-wb')} x1="76" y1="180" x2="806" y2="180" />
          <line className={pathClass('pc-plus4-to-mux-wb')} x1="806" y1="180" x2="806" y2="290" />
          <line className={pathClass('pc-plus4-to-mux-wb')} x1="806" y1="290" x2="820" y2="290" markerEnd="url(#arrow)" />

          {/* ALU 结果 → PC 多路选择器 (jalr 跳转目标) — 轨道 y26, 竖管 x612 */}
          <line className={pathClass('alu-to-mux-pc')} x1="592" y1="274" x2="612" y2="274" />
          <line className={pathClass('alu-to-mux-pc')} x1="612" y1="274" x2="612" y2="26" />
          <line className={pathClass('alu-to-mux-pc')} x1="612" y1="26" x2="60" y2="26" />
          <line className={pathClass('alu-to-mux-pc')} x1="60" y1="26" x2="60" y2="40" markerEnd="url(#arrow)" />

          {/* 分支加法器 → 写回多路选择器 (auipc 结果) — 轨道 y104, 竖管 x782 */}
          <line className={pathClass('adder-to-mux-wb')} x1="520" y1="76" x2="536" y2="76" />
          <line className={pathClass('adder-to-mux-wb')} x1="536" y1="76" x2="536" y2="104" />
          <line className={pathClass('adder-to-mux-wb')} x1="536" y1="104" x2="782" y2="104" />
          <line className={pathClass('adder-to-mux-wb')} x1="782" y1="104" x2="782" y2="304" />
          <line className={pathClass('adder-to-mux-wb')} x1="782" y1="304" x2="820" y2="304" markerEnd="url(#arrow)" />

          {/* ============ COMPONENTS (drawn on top of wires) ============ */}

          {/* PC 多路选择器 */}
          <g className={componentClass('mux-pc')}>
            <rect x="24" y="40" width="46" height="66" rx="4" />
            <text x="47" y="77" textAnchor="middle" fontSize="9">MUX</text>
          </g>

          {/* PC */}
          <g className={componentClass('pc')}>
            <rect x="24" y="225" width="58" height="68" rx="4" />
            <text x="53" y="263" textAnchor="middle">PC</text>
          </g>

          {/* 指令存储器 */}
          <g className={componentClass('imem')}>
            <rect x="130" y="222" width="96" height="74" rx="4" />
            <text x="178" y="256" textAnchor="middle">指令存储器</text>
            <text x="178" y="272" textAnchor="middle" className="dp-sub">IMEM</text>
          </g>

          {/* 控制器 */}
          <g className={componentClass('control')}>
            <rect x="288" y="120" width="120" height="46" rx="4" />
            <text x="348" y="140" textAnchor="middle">控制器</text>
            <text x="348" y="156" textAnchor="middle" className="dp-sub">Control</text>
          </g>

          {/* 寄存器堆 */}
          <g className={componentClass('registers')}>
            <rect x="288" y="222" width="104" height="92" rx="4" />
            <text x="340" y="266" textAnchor="middle">寄存器堆</text>
            <text x="340" y="282" textAnchor="middle" className="dp-sub">Registers</text>
          </g>

          {/* 立即数生成 */}
          <g className={componentClass('imm-gen')}>
            <rect x="288" y="360" width="104" height="46" rx="4" />
            <text x="340" y="380" textAnchor="middle">立即数生成</text>
            <text x="340" y="396" textAnchor="middle" className="dp-sub">ImmGen</text>
          </g>

          {/* ALU 多路选择器 */}
          <g className={componentClass('mux-alu-src')}>
            <polygon points="445,256 472,268 472,300 445,312" />
            <text x="456" y="288" textAnchor="middle" fontSize="9">MUX</text>
          </g>

          {/* ALU */}
          <g className={componentClass('alu')}>
            <polygon points="512,226 512,262 528,274 512,286 512,322 592,300 592,248" />
            <text x="548" y="278" textAnchor="middle">ALU</text>
          </g>

          {/* 数据存储器 */}
          <g className={componentClass('dmem')}>
            <rect x="658" y="222" width="96" height="80" rx="4" />
            <text x="706" y="258" textAnchor="middle">数据存储器</text>
            <text x="706" y="274" textAnchor="middle" className="dp-sub">DMEM</text>
          </g>

          {/* 写回多路选择器 */}
          <g className={componentClass('mux-wb')}>
            <polygon points="820,250 847,262 847,304 820,316" />
            <text x="832" y="287" textAnchor="middle" fontSize="9">MUX</text>
          </g>

          {/* 分支加法器 */}
          <g className={componentClass('branch-adder')}>
            <rect x="442" y="38" width="78" height="52" rx="4" />
            <text x="481" y="60" textAnchor="middle">加法器</text>
            <text x="481" y="76" textAnchor="middle" className="dp-sub">Add</text>
          </g>

          {/* 与门 */}
          <g className={componentClass('and-gate')}>
            <rect x="598" y="44" width="54" height="40" rx="4" />
            <text x="625" y="62" textAnchor="middle">与门</text>
            <text x="625" y="77" textAnchor="middle" className="dp-sub">AND</text>
          </g>
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
