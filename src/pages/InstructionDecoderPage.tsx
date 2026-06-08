import { useState } from 'react'
import { encode, decode, getFormatInfo, getInstructionList, type DecodedInstruction, type InstrType } from '../lib/riscv'
import '../styles/instruction-decoder.css'

type InputMode = 'assembly' | 'machine'

const FORMAT_TYPES: InstrType[] = ['R', 'I', 'S', 'B', 'U', 'J']

export function InstructionDecoderPage() {
  const [mode, setMode] = useState<InputMode>('assembly')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<DecodedInstruction | null>(null)

  function handleConvert() {
    if (!input.trim()) return
    if (mode === 'assembly') {
      setResult(encode(input))
    } else {
      setResult(decode(input))
    }
  }

  function handleInputChange(val: string) {
    setInput(val)
    if (!val.trim()) {
      setResult(null)
      return
    }
    if (mode === 'assembly') {
      setResult(encode(val))
    } else {
      setResult(decode(val))
    }
  }

  function handleExampleClick(example: string) {
    setInput(example)
    if (mode === 'assembly') {
      setResult(encode(example))
    } else {
      setResult(decode(example))
    }
  }

  const examples = mode === 'assembly'
    ? ['add x1, x2, x3', 'addi x5, x0, 42', 'lw x10, 0(x2)', 'beq x1, x2, 8', 'lui x3, 0x12345', 'jal x1, 100']
    : ['0x003100b3', '0x02a00293', '0x00012503', '0x00208463', '0x123451b7', '0x064000ef']

  return (
    <div className="instr-decoder">
      <h2>RISC-V 指令编解码器</h2>
      <p className="subtitle">RV32I 基础指令集 — 汇编 ↔ 机器码双向转换</p>

      <div className="mode-switch">
        <button className={mode === 'assembly' ? 'active' : ''} onClick={() => { setMode('assembly'); setInput(''); setResult(null) }}>
          汇编 → 机器码
        </button>
        <button className={mode === 'machine' ? 'active' : ''} onClick={() => { setMode('machine'); setInput(''); setResult(null) }}>
          机器码 → 汇编
        </button>
      </div>

      <div className="input-section">
        <label>{mode === 'assembly' ? '输入 RISC-V 汇编指令' : '输入 32 位机器码（二进制或十六进制）'}</label>
        <div className="input-row">
          <input
            type="text"
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConvert()}
            placeholder={mode === 'assembly' ? 'add x1, x2, x3' : '0x003100b3 或 00000000001100010000000010110011'}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="examples">
        <span>示例：</span>
        {examples.map(ex => (
          <button key={ex} onClick={() => handleExampleClick(ex)}>{ex}</button>
        ))}
      </div>

      {result && (
        <div className="result-section">
          {result.error ? (
            <div className="error-box">{result.error}</div>
          ) : (
            <>
              <div className="result-summary">
                <div className="result-row">
                  <span className="label">汇编：</span>
                  <code>{result.assembly}</code>
                </div>
                <div className="result-row">
                  <span className="label">二进制：</span>
                  <code>{result.binary}</code>
                </div>
                <div className="result-row">
                  <span className="label">十六进制：</span>
                  <code>{result.hex}</code>
                </div>
                <div className="result-row">
                  <span className="label">指令类型：</span>
                  <span className="type-badge">{result.type}-type</span>
                </div>
              </div>

              <div className="bit-field-display">
                <h3>字段分解（32 位）</h3>
                <div className="bit-fields">
                  {result.fields.map((field, i) => (
                    <div
                      key={i}
                      className="field-block"
                      style={{ backgroundColor: field.color + '22', borderColor: field.color }}
                      title={`${field.name} = ${field.value} (bits ${field.start}:${field.end})`}
                    >
                      <div className="field-name" style={{ color: field.color }}>{field.name}</div>
                      <div className="field-bits">{field.bits}</div>
                      <div className="field-value">{field.value}</div>
                    </div>
                  ))}
                </div>
                <div className="bit-ruler">
                  {Array.from({ length: 32 }, (_, i) => (
                    <span key={i} className="bit-num">{31 - i}</span>
                  ))}
                </div>
              </div>

              <FormatReference currentType={result.type} />
            </>
          )}
        </div>
      )}

      {!result && <FormatReference currentType={null} />}

      <div className="supported-instructions">
        <h3>支持的指令</h3>
        <div className="instr-list">
          {getInstructionList().map(name => (
            <span key={name} className="instr-chip" onClick={() => { setMode('assembly'); handleExampleClick(`${name} x1, x2, x3`) }}>{name}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function FormatReference({ currentType }: { currentType: InstrType | null }) {
  return (
    <div className="format-reference">
      <h3>RISC-V 指令格式参考</h3>
      <div className="format-table">
        {FORMAT_TYPES.map(type => {
          const info = getFormatInfo(type)
          return (
            <div key={type} className={`format-row ${currentType === type ? 'highlight' : ''}`}>
              <span className="format-type">{type}-type</span>
              <span className="format-layout">{info.layout}</span>
              <span className="format-desc">{info.description}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
