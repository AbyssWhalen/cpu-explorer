import { useState, useCallback } from 'react'
import '../styles/cache.css'
import {
  CacheConfig, CacheState, AccessType, AccessResult,
  createCache, accessCache, getAddressBits,
  hitRate, generateRandomAddresses, generateStridePattern, generateLoopPattern,
} from '../lib/cache'

const DEFAULT_CONFIG: CacheConfig = {
  totalSize: 256,
  blockSize: 16,
  associativity: 2,
  replacementPolicy: 'LRU',
  writePolicy: 'write-back',
}

export function CachePage() {
  const [config, setConfig] = useState<CacheConfig>(DEFAULT_CONFIG)
  const [cacheState, setCacheState] = useState<CacheState>(createCache(DEFAULT_CONFIG))
  const [addressInput, setAddressInput] = useState('')
  const [accessType, setAccessType] = useState<AccessType>('read')
  const [lastResult, setLastResult] = useState<AccessResult | null>(null)
  const [autoAddresses, setAutoAddresses] = useState<number[]>([])
  const [autoIndex, setAutoIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  const resetCache = useCallback((newConfig?: CacheConfig) => {
    const c = newConfig || config
    setCacheState(createCache(c))
    setLastResult(null)
    setAutoAddresses([])
    setAutoIndex(0)
    setPlaying(false)
  }, [config])

  const updateConfig = (patch: Partial<CacheConfig>) => {
    const newConfig = { ...config, ...patch }
    setConfig(newConfig)
    resetCache(newConfig)
  }

  const doAccess = (address: number, type: AccessType) => {
    const newState = accessCache(cacheState, address, type)
    setCacheState(newState)
    setLastResult(newState.accessLog[newState.accessLog.length - 1])
  }

  const handleManualAccess = () => {
    const addr = parseInt(addressInput, 16)
    if (isNaN(addr) || addr < 0) return
    doAccess(addr, accessType)
    setAddressInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleManualAccess()
  }

  const loadPreset = (type: 'random' | 'stride' | 'loop') => {
    let addrs: number[]
    switch (type) {
      case 'random':
        addrs = generateRandomAddresses(20, config.totalSize * 4, 4)
        break
      case 'stride':
        addrs = generateStridePattern(0, config.blockSize, 20)
        break
      case 'loop':
        addrs = generateLoopPattern([0, 64, 128, 192], 5)
        break
    }
    setAutoAddresses(addrs)
    setAutoIndex(0)
    resetCache()
  }

  const stepNext = () => {
    if (autoIndex >= autoAddresses.length) return
    doAccess(autoAddresses[autoIndex], 'read')
    setAutoIndex(autoIndex + 1)
  }

  const playAll = async () => {
    setPlaying(true)
    let state = cacheState
    let idx = autoIndex
    const interval = setInterval(() => {
      if (idx >= autoAddresses.length) {
        clearInterval(interval)
        setPlaying(false)
        return
      }
      state = accessCache(state, autoAddresses[idx], 'read')
      setCacheState(state)
      setLastResult(state.accessLog[state.accessLog.length - 1])
      idx++
      setAutoIndex(idx)
    }, 500)
  }

  const numSets = config.totalSize / (config.blockSize * config.associativity)
  const { tagBits, indexBits, offsetBits } = getAddressBits(config)

  return (
    <div className="cache-page">
      <h2>Cache Simulator</h2>

      <div className="cache-layout">
        {/* Config Panel */}
        <div className="cache-config">
          <h3>Configuration</h3>
          <label>
            Total Size
            <select value={config.totalSize} onChange={e => updateConfig({ totalSize: +e.target.value })}>
              {[64, 128, 256, 512, 1024, 2048, 4096].map(v => (
                <option key={v} value={v}>{v}B</option>
              ))}
            </select>
          </label>
          <label>
            Block Size
            <select value={config.blockSize} onChange={e => updateConfig({ blockSize: +e.target.value })}>
              {[4, 8, 16, 32, 64].map(v => (
                <option key={v} value={v}>{v}B</option>
              ))}
            </select>
          </label>
          <label>
            Associativity
            <select value={config.associativity} onChange={e => updateConfig({ associativity: +e.target.value })}>
              {[1, 2, 4, 8].filter(a => a <= numSets || a === config.associativity).map(v => (
                <option key={v} value={v}>{v === 1 ? 'Direct Mapped' : `${v}-way`}</option>
              ))}
              <option value={numSets}>Fully Associative</option>
            </select>
          </label>
          <label>
            Replacement
            <select value={config.replacementPolicy} onChange={e => updateConfig({ replacementPolicy: e.target.value as any })}>
              <option value="LRU">LRU</option>
              <option value="FIFO">FIFO</option>
              <option value="Random">Random</option>
            </select>
          </label>
          <label>
            Write Policy
            <select value={config.writePolicy} onChange={e => updateConfig({ writePolicy: e.target.value as any })}>
              <option value="write-back">Write-back</option>
              <option value="write-through">Write-through</option>
            </select>
          </label>

          <div className="cache-info">
            <p>Sets: {numSets} | Ways: {config.associativity}</p>
            <p>Address: [{tagBits}t | {indexBits}i | {offsetBits}o] = 32 bits</p>
          </div>

          <button className="reset-btn" onClick={() => resetCache()}>Reset Cache</button>
        </div>

        {/* Access Panel */}
        <div className="cache-access">
          <h3>Memory Access</h3>
          <div className="manual-access">
            <input
              type="text"
              placeholder="Hex address (e.g. 0x1A4)"
              value={addressInput}
              onChange={e => setAddressInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <select value={accessType} onChange={e => setAccessType(e.target.value as AccessType)}>
              <option value="read">Read</option>
              <option value="write">Write</option>
            </select>
            <button onClick={handleManualAccess}>Access</button>
          </div>

          <div className="preset-section">
            <h4>Preset Sequences</h4>
            <div className="preset-buttons">
              <button onClick={() => loadPreset('random')}>Random</button>
              <button onClick={() => loadPreset('stride')}>Stride</button>
              <button onClick={() => loadPreset('loop')}>Loop</button>
            </div>
            {autoAddresses.length > 0 && (
              <div className="sequence-controls">
                <span>{autoIndex}/{autoAddresses.length}</span>
                <button onClick={stepNext} disabled={playing || autoIndex >= autoAddresses.length}>Step</button>
                <button onClick={playAll} disabled={playing || autoIndex >= autoAddresses.length}>Play</button>
              </div>
            )}
          </div>

          {/* Address Breakdown */}
          {lastResult && (
            <div className="address-breakdown">
              <h4>Address Breakdown: 0x{lastResult.address.toString(16).toUpperCase().padStart(8, '0')}</h4>
              <div className="addr-bits">
                <span className="tag-bits" title="Tag">
                  {lastResult.addressBreakdown.binary.slice(0, tagBits)}
                </span>
                <span className="index-bits" title="Index">
                  {lastResult.addressBreakdown.binary.slice(tagBits, tagBits + indexBits)}
                </span>
                <span className="offset-bits" title="Offset">
                  {lastResult.addressBreakdown.binary.slice(tagBits + indexBits)}
                </span>
              </div>
              <div className="addr-labels">
                <span className="tag-bits">Tag={lastResult.addressBreakdown.tag}</span>
                <span className="index-bits">Index={lastResult.addressBreakdown.index}</span>
                <span className="offset-bits">Offset={lastResult.addressBreakdown.offset}</span>
              </div>
              <div className={`access-result ${lastResult.hit ? 'hit' : 'miss'}`}>
                {lastResult.hit ? 'HIT' : 'MISS'} — Set {lastResult.setIndex}, Way {lastResult.wayIndex}
                {lastResult.evicted && ' (evicted)'}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="cache-stats">
            <span>Hits: {cacheState.hits}</span>
            <span>Misses: {cacheState.misses}</span>
            <span>Rate: {(hitRate(cacheState) * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Cache Table */}
        <div className="cache-table-container">
          <h3>Cache Contents</h3>
          <table className="cache-table">
            <thead>
              <tr>
                <th>Set</th>
                {Array.from({ length: config.associativity }, (_, i) => (
                  <th key={i} colSpan={3}>Way {i}</th>
                ))}
              </tr>
              <tr>
                <th></th>
                {Array.from({ length: config.associativity }, (_, i) => (
                  <Fragment key={i}>
                    <th>V</th>
                    <th>D</th>
                    <th>Tag</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {cacheState.sets.map((set, setIdx) => (
                <tr key={setIdx} className={lastResult?.setIndex === setIdx ? 'active-set' : ''}>
                  <td className="set-idx">{setIdx}</td>
                  {set.lines.map((line, wayIdx) => (
                    <Fragment key={wayIdx}>
                      <td className={line.valid ? 'valid' : ''}>{line.valid ? '1' : '0'}</td>
                      <td className={line.dirty ? 'dirty' : ''}>{line.dirty ? '1' : '0'}</td>
                      <td className={`tag-cell ${lastResult?.setIndex === setIdx && lastResult?.wayIndex === wayIdx ? (lastResult.hit ? 'cell-hit' : 'cell-miss') : ''}`}>
                        {line.valid ? '0x' + line.tag.toString(16).toUpperCase() : '-'}
                      </td>
                    </Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Log */}
      {cacheState.accessLog.length > 0 && (
        <div className="access-log">
          <h3>Access Log</h3>
          <div className="log-entries">
            {cacheState.accessLog.slice(-20).map((entry, i) => (
              <span key={i} className={`log-entry ${entry.hit ? 'log-hit' : 'log-miss'}`}>
                0x{entry.address.toString(16).toUpperCase()}:{entry.hit ? 'H' : 'M'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
