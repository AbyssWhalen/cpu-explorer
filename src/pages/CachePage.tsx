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
      <h2>Cache 模拟器</h2>

      <div className="cache-layout">
        {/* Config Panel */}
        <div className="cache-config">
          <h3>配置</h3>
          <label>
            总容量
            <select value={config.totalSize} onChange={e => updateConfig({ totalSize: +e.target.value })}>
              {[64, 128, 256, 512, 1024, 2048, 4096].map(v => (
                <option key={v} value={v}>{v}B</option>
              ))}
            </select>
          </label>
          <label>
            块大小
            <select value={config.blockSize} onChange={e => updateConfig({ blockSize: +e.target.value })}>
              {[4, 8, 16, 32, 64].map(v => (
                <option key={v} value={v}>{v}B</option>
              ))}
            </select>
          </label>
          <label>
            相联度
            <select value={config.associativity} onChange={e => updateConfig({ associativity: +e.target.value })}>
              {[1, 2, 4, 8].filter(a => a <= numSets || a === config.associativity).map(v => (
                <option key={v} value={v}>{v === 1 ? '直接映射' : `${v} 路组相联`}</option>
              ))}
              <option value={numSets}>全相联</option>
            </select>
          </label>
          <label>
            替换策略
            <select value={config.replacementPolicy} onChange={e => updateConfig({ replacementPolicy: e.target.value as any })}>
              <option value="LRU">LRU（最近最少使用）</option>
              <option value="FIFO">FIFO（先进先出）</option>
              <option value="Random">Random（随机）</option>
            </select>
          </label>
          <label>
            写策略
            <select value={config.writePolicy} onChange={e => updateConfig({ writePolicy: e.target.value as any })}>
              <option value="write-back">写回（Write-back）</option>
              <option value="write-through">写直达（Write-through）</option>
            </select>
          </label>

          <div className="cache-info">
            <p>组数：{numSets} ｜ 路数：{config.associativity}</p>
            <p>地址：[{tagBits} 标记 | {indexBits} 索引 | {offsetBits} 偏移] = 32 位</p>
          </div>

          <button className="reset-btn" onClick={() => resetCache()}>重置 Cache</button>
        </div>

        {/* Access Panel */}
        <div className="cache-access">
          <h3>内存访问</h3>
          <div className="manual-access">
            <input
              type="text"
              placeholder="十六进制地址（如 0x1A4）"
              value={addressInput}
              onChange={e => setAddressInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <select value={accessType} onChange={e => setAccessType(e.target.value as AccessType)}>
              <option value="read">读</option>
              <option value="write">写</option>
            </select>
            <button onClick={handleManualAccess}>访问</button>
          </div>

          <div className="preset-section">
            <h4>预设访问序列</h4>
            <div className="preset-buttons">
              <button onClick={() => loadPreset('random')}>随机</button>
              <button onClick={() => loadPreset('stride')}>跨步</button>
              <button onClick={() => loadPreset('loop')}>循环</button>
            </div>
            {autoAddresses.length > 0 && (
              <div className="sequence-controls">
                <span>{autoIndex}/{autoAddresses.length}</span>
                <button onClick={stepNext} disabled={playing || autoIndex >= autoAddresses.length}>单步</button>
                <button onClick={playAll} disabled={playing || autoIndex >= autoAddresses.length}>播放</button>
              </div>
            )}
          </div>

          {/* Address Breakdown */}
          {lastResult && (
            <div className="address-breakdown">
              <h4>地址拆解：0x{lastResult.address.toString(16).toUpperCase().padStart(8, '0')}</h4>
              <div className="addr-bits">
                <span className="tag-bits" title="标记">
                  {lastResult.addressBreakdown.binary.slice(0, tagBits)}
                </span>
                <span className="index-bits" title="索引">
                  {lastResult.addressBreakdown.binary.slice(tagBits, tagBits + indexBits)}
                </span>
                <span className="offset-bits" title="偏移">
                  {lastResult.addressBreakdown.binary.slice(tagBits + indexBits)}
                </span>
              </div>
              <div className="addr-labels">
                <span className="tag-bits">标记={lastResult.addressBreakdown.tag}</span>
                <span className="index-bits">索引={lastResult.addressBreakdown.index}</span>
                <span className="offset-bits">偏移={lastResult.addressBreakdown.offset}</span>
              </div>
              <div className={`access-result ${lastResult.hit ? 'hit' : 'miss'}`}>
                {lastResult.hit ? '命中' : '缺失'} — 第 {lastResult.setIndex} 组，第 {lastResult.wayIndex} 路
                {lastResult.evicted && '（发生替换）'}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="cache-stats">
            <span>命中：{cacheState.hits}</span>
            <span>缺失：{cacheState.misses}</span>
            <span>命中率：{(hitRate(cacheState) * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Cache Table */}
        <div className="cache-table-container">
          <h3>Cache 内容</h3>
          <table className="cache-table">
            <thead>
              <tr>
                <th>组</th>
                {Array.from({ length: config.associativity }, (_, i) => (
                  <th key={i} colSpan={3}>第 {i} 路</th>
                ))}
              </tr>
              <tr>
                <th></th>
                {Array.from({ length: config.associativity }, (_, i) => (
                  <Fragment key={i}>
                    <th title="有效位 Valid">有效</th>
                    <th title="脏位 Dirty">脏</th>
                    <th title="标记 Tag">标记</th>
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
          <h3>访问日志</h3>
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
