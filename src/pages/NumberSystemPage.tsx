import { useState } from 'react'
import {
  convertRadix,
  toComplement,
  fromTwosComplement,
  decimalToIEEE754,
  ieee754BitsToDecimal,
  formatBitsGrouped,
  type BitWidth,
  type IEEE754Result,
} from '../lib/number'
import '../styles/number-system.css'

type Tab = 'radix' | 'complement' | 'ieee754'

export function NumberSystemPage() {
  const [tab, setTab] = useState<Tab>('radix')

  return (
    <div className="module-container">
      <div className="module-head">
        <h2>进制与编码</h2>
        <p className="module-intro">进制互转、原码/反码/补码、IEEE 754 浮点编码 — 输入即时换算</p>
      </div>
      <div className="tab-bar">
        <button className={tab === 'radix' ? 'active' : ''} onClick={() => setTab('radix')}>
          进制转换
        </button>
        <button className={tab === 'complement' ? 'active' : ''} onClick={() => setTab('complement')}>
          补码运算
        </button>
        <button className={tab === 'ieee754' ? 'active' : ''} onClick={() => setTab('ieee754')}>
          IEEE 754
        </button>
      </div>

      {tab === 'radix' && <RadixPanel />}
      {tab === 'complement' && <ComplementPanel />}
      {tab === 'ieee754' && <IEEE754Panel />}
    </div>
  )
}

// --- Radix Conversion Panel ---

function RadixPanel() {
  const [input, setInput] = useState('')
  const result = input ? convertRadix(input) : null

  return (
    <div className="panel">
      <div className="input-group">
        <label>输入数值（支持 0b/0o/0x 前缀或纯十进制）</label>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="如：255, 0xFF, 0b11111111, 0o377"
          className="text-input"
        />
      </div>

      {result && !result.isValid && (
        <div className="error-msg">{result.error}</div>
      )}

      {result && result.isValid && (
        <div className="result-grid">
          <ResultRow label="十进制" value={result.decimal} />
          <ResultRow label="二进制" value={result.binary} />
          <ResultRow label="八进制" value={result.octal} />
          <ResultRow label="十六进制" value={result.hex} />
        </div>
      )}

      <div className="hint">
        <p>前缀说明：0b = 二进制，0o = 八进制，0x = 十六进制，无前缀 = 十进制</p>
        <p>支持负数（如 -42）和大数（使用 BigInt 精确计算）</p>
      </div>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="result-row">
      <span className="result-label">{label}</span>
      <code className="result-value">{value}</code>
    </div>
  )
}

// --- Complement Panel ---

function ComplementPanel() {
  const [decimal, setDecimal] = useState('')
  const [bitWidth, setBitWidth] = useState<BitWidth>(8)
  const [bitsInput, setBitsInput] = useState('')

  const numValue = decimal !== '' ? parseInt(decimal, 10) : null
  const compResult = numValue !== null && !isNaN(numValue) ? toComplement(numValue, bitWidth) : null

  const reversedValue = bitsInput.length === bitWidth ? fromTwosComplement(bitsInput, bitWidth) : null

  return (
    <div className="panel">
      <div className="bit-width-selector">
        <span>位宽：</span>
        {([8, 16, 32] as BitWidth[]).map(w => (
          <button
            key={w}
            className={bitWidth === w ? 'active' : ''}
            onClick={() => setBitWidth(w)}
          >
            {w} bit
          </button>
        ))}
      </div>

      <div className="two-col">
        <div className="col">
          <h4>十进制 → 原码/反码/补码</h4>
          <div className="input-group">
            <input
              type="number"
              value={decimal}
              onChange={e => setDecimal(e.target.value)}
              placeholder={`范围: ${-(2 ** (bitWidth - 1))} ~ ${2 ** (bitWidth - 1) - 1}`}
              className="text-input"
            />
          </div>

          {compResult && (
            <div className="result-grid">
              {compResult.overflow && (
                <div className="error-msg">溢出！已截断至 {bitWidth} 位范围</div>
              )}
              <ResultRow label="真值" value={compResult.decimalValue.toString()} />
              <BitDisplay label="原码" bits={compResult.original} />
              <BitDisplay label="反码" bits={compResult.onesComp} />
              <BitDisplay label="补码" bits={compResult.twosComp} />
            </div>
          )}
        </div>

        <div className="col">
          <h4>补码 → 十进制</h4>
          <div className="input-group">
            <input
              type="text"
              value={bitsInput}
              onChange={e => {
                const v = e.target.value.replace(/[^01]/g, '').slice(0, bitWidth)
                setBitsInput(v)
              }}
              placeholder={`输入 ${bitWidth} 位二进制补码`}
              className="text-input"
              maxLength={bitWidth}
            />
            <span className="bit-count">{bitsInput.length}/{bitWidth}</span>
          </div>

          {reversedValue !== null && (
            <div className="result-grid">
              <ResultRow label="十进制" value={reversedValue.toString()} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BitDisplay({ label, bits }: { label: string; bits: string }) {
  return (
    <div className="result-row">
      <span className="result-label">{label}</span>
      <code className="bit-string">
        <span className="sign-bit">{bits[0]}</span>
        <span className="data-bits">{formatBitsGrouped(bits.slice(1))}</span>
      </code>
    </div>
  )
}

// --- IEEE 754 Panel ---

function IEEE754Panel() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [precision, setPrecision] = useState<'single' | 'double'>('single')
  const [decInput, setDecInput] = useState('')
  const [bitsInput, setBitsInput] = useState('')

  const totalBits = precision === 'single' ? 32 : 64

  let result: IEEE754Result | null = null
  if (mode === 'encode' && decInput !== '') {
    const num = parseFloat(decInput)
    if (!isNaN(num)) {
      result = decimalToIEEE754(num, precision)
    }
  } else if (mode === 'decode' && bitsInput.length === totalBits) {
    const val = ieee754BitsToDecimal(bitsInput, precision)
    result = decimalToIEEE754(val, precision)
  }

  return (
    <div className="panel">
      <div className="control-row">
        <div className="mode-selector">
          <button className={mode === 'encode' ? 'active' : ''} onClick={() => setMode('encode')}>
            十进制 → 位串
          </button>
          <button className={mode === 'decode' ? 'active' : ''} onClick={() => setMode('decode')}>
            位串 → 十进制
          </button>
        </div>
        <div className="precision-selector">
          <button className={precision === 'single' ? 'active' : ''} onClick={() => { setPrecision('single'); setBitsInput('') }}>
            单精度 (32-bit)
          </button>
          <button className={precision === 'double' ? 'active' : ''} onClick={() => { setPrecision('double'); setBitsInput('') }}>
            双精度 (64-bit)
          </button>
        </div>
      </div>

      {mode === 'encode' ? (
        <div className="input-group">
          <label>输入十进制数</label>
          <input
            type="text"
            value={decInput}
            onChange={e => setDecInput(e.target.value)}
            placeholder="如：3.14, -0.1, Infinity, NaN"
            className="text-input"
          />
        </div>
      ) : (
        <div className="input-group">
          <label>输入 {totalBits} 位二进制串</label>
          <input
            type="text"
            value={bitsInput}
            onChange={e => {
              const v = e.target.value.replace(/[^01]/g, '').slice(0, totalBits)
              setBitsInput(v)
            }}
            placeholder={`输入 ${totalBits} 个 0/1`}
            className="text-input"
            maxLength={totalBits}
          />
          <span className="bit-count">{bitsInput.length}/{totalBits}</span>
        </div>
      )}

      {result && (
        <div className="ieee-result">
          <div className="ieee-bits-visual">
            <div className="ieee-field sign-field">
              <div className="field-label">符号位</div>
              <div className="field-bits">{result.signBits}</div>
              <div className="field-value">{result.sign === 0 ? '+' : '-'}</div>
            </div>
            <div className="ieee-field exponent-field">
              <div className="field-label">阶码</div>
              <div className="field-bits">{formatBitsGrouped(result.exponentBits)}</div>
              <div className="field-value">
                E={result.exponent}
                {result.special === 'normal' && (
                  <span> (bias: {result.exponent - (precision === 'single' ? 127 : 1023)})</span>
                )}
              </div>
            </div>
            <div className="ieee-field mantissa-field">
              <div className="field-label">尾数</div>
              <div className="field-bits">{formatBitsGrouped(result.mantissaBits)}</div>
              <div className="field-value">
                {result.special === 'normal' && '1.'}
                {result.special === 'denormalized' && '0.'}
                {result.mantissa.toString(2).padStart(precision === 'single' ? 23 : 52, '0').slice(0, 8)}...
              </div>
            </div>
          </div>

          <div className="result-grid">
            <ResultRow label="十进制值" value={specialValueStr(result)} />
            <ResultRow label="类别" value={specialLabel(result.special)} />
            <ResultRow label="完整位串" value={formatBitsGrouped(result.fullBits, 8)} />
            <ResultRow label="十六进制" value={'0x' + BigInt('0b' + result.fullBits).toString(16).toUpperCase()} />
          </div>
        </div>
      )}

      <div className="hint">
        <p>IEEE 754 标准：符号位(1) + 阶码({precision === 'single' ? 8 : 11}) + 尾数({precision === 'single' ? 23 : 52})</p>
        <p>特殊值：阶码全 0 = 非规格化/零，阶码全 1 = 无穷/NaN</p>
      </div>
    </div>
  )
}

function specialValueStr(r: IEEE754Result): string {
  if (r.special === 'nan') return 'NaN'
  if (r.special === 'infinity') return r.sign === 0 ? '+Infinity' : '-Infinity'
  if (r.special === 'zero') return r.sign === 0 ? '+0' : '-0'
  return r.decimalValue.toString()
}

function specialLabel(s: IEEE754Result['special']): string {
  const map = { normal: '规格化数', denormalized: '非规格化数', zero: '零', infinity: '无穷', nan: 'NaN' }
  return map[s]
}
