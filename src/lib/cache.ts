// Cache Simulator Engine

export type ReplacementPolicy = 'LRU' | 'FIFO' | 'Random'
export type WritePolicy = 'write-through' | 'write-back'
export type AccessType = 'read' | 'write'

export interface CacheConfig {
  totalSize: number      // bytes (64 ~ 4096)
  blockSize: number      // bytes (4 ~ 64)
  associativity: number  // 1 = direct-mapped, 2/4/N = N-way, sets=1 → fully associative
  replacementPolicy: ReplacementPolicy
  writePolicy: WritePolicy
}

export interface CacheLine {
  valid: boolean
  dirty: boolean
  tag: number
  lastUsed: number   // for LRU: timestamp of last access
  insertOrder: number // for FIFO: order of insertion
}

export interface CacheSet {
  lines: CacheLine[]
}

export interface AddressBreakdown {
  address: number
  tag: number
  index: number
  offset: number
  tagBits: number
  indexBits: number
  offsetBits: number
  binary: string
}

export interface AccessResult {
  hit: boolean
  setIndex: number
  wayIndex: number
  evicted: CacheLine | null
  addressBreakdown: AddressBreakdown
  accessType: AccessType
  address: number
}

export interface CacheState {
  config: CacheConfig
  sets: CacheSet[]
  accessLog: AccessResult[]
  hits: number
  misses: number
  clock: number
}

export function createCache(config: CacheConfig): CacheState {
  const numSets = config.totalSize / (config.blockSize * config.associativity)
  const sets: CacheSet[] = Array.from({ length: numSets }, () => ({
    lines: Array.from({ length: config.associativity }, () => ({
      valid: false,
      dirty: false,
      tag: 0,
      lastUsed: 0,
      insertOrder: 0,
    })),
  }))

  return { config, sets, accessLog: [], hits: 0, misses: 0, clock: 0 }
}

export function getAddressBits(config: CacheConfig) {
  const numSets = config.totalSize / (config.blockSize * config.associativity)
  const offsetBits = Math.log2(config.blockSize)
  const indexBits = Math.log2(numSets)
  const tagBits = 32 - offsetBits - indexBits
  return { tagBits, indexBits, offsetBits }
}

export function breakdownAddress(address: number, config: CacheConfig): AddressBreakdown {
  const { tagBits, indexBits, offsetBits } = getAddressBits(config)
  const offset = address & ((1 << offsetBits) - 1)
  const index = (address >> offsetBits) & ((1 << indexBits) - 1)
  const tag = address >>> (offsetBits + indexBits)
  const binary = (address >>> 0).toString(2).padStart(32, '0')

  return { address, tag, index, offset, tagBits, indexBits, offsetBits, binary }
}

function findVictim(set: CacheSet, policy: ReplacementPolicy): number {
  // First check for invalid lines
  const invalidIdx = set.lines.findIndex(l => !l.valid)
  if (invalidIdx >= 0) return invalidIdx

  switch (policy) {
    case 'LRU':
      return set.lines.reduce((minIdx, line, idx, arr) =>
        line.lastUsed < arr[minIdx].lastUsed ? idx : minIdx, 0)
    case 'FIFO':
      return set.lines.reduce((minIdx, line, idx, arr) =>
        line.insertOrder < arr[minIdx].insertOrder ? idx : minIdx, 0)
    case 'Random':
      return Math.floor(Math.random() * set.lines.length)
  }
}

export function accessCache(state: CacheState, address: number, accessType: AccessType): CacheState {
  const newState = structuredClone(state)
  newState.clock += 1

  const breakdown = breakdownAddress(address, newState.config)
  const set = newState.sets[breakdown.index]

  // Search for hit
  const hitIdx = set.lines.findIndex(l => l.valid && l.tag === breakdown.tag)

  let result: AccessResult

  if (hitIdx >= 0) {
    // Cache hit
    set.lines[hitIdx].lastUsed = newState.clock
    if (accessType === 'write' && newState.config.writePolicy === 'write-back') {
      set.lines[hitIdx].dirty = true
    }
    newState.hits += 1
    result = {
      hit: true,
      setIndex: breakdown.index,
      wayIndex: hitIdx,
      evicted: null,
      addressBreakdown: breakdown,
      accessType,
      address,
    }
  } else {
    // Cache miss
    const victimIdx = findVictim(set, newState.config.replacementPolicy)
    const evicted = set.lines[victimIdx].valid ? { ...set.lines[victimIdx] } : null

    set.lines[victimIdx] = {
      valid: true,
      dirty: accessType === 'write' && newState.config.writePolicy === 'write-back',
      tag: breakdown.tag,
      lastUsed: newState.clock,
      insertOrder: newState.clock,
    }
    newState.misses += 1
    result = {
      hit: false,
      setIndex: breakdown.index,
      wayIndex: victimIdx,
      evicted,
      addressBreakdown: breakdown,
      accessType,
      address,
    }
  }

  newState.accessLog = [...state.accessLog, result]
  return newState
}

export function batchAccess(config: CacheConfig, addresses: { address: number; type: AccessType }[]): CacheState[] {
  const states: CacheState[] = [createCache(config)]
  for (const { address, type } of addresses) {
    states.push(accessCache(states[states.length - 1], address, type))
  }
  return states
}

export function generateRandomAddresses(count: number, maxAddr: number, alignment: number): number[] {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * (maxAddr / alignment)) * alignment
  )
}

export function generateStridePattern(start: number, stride: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => start + i * stride)
}

export function generateLoopPattern(addresses: number[], iterations: number): number[] {
  return Array.from({ length: iterations }, () => addresses).flat()
}

export function hitRate(state: CacheState): number {
  const total = state.hits + state.misses
  return total === 0 ? 0 : state.hits / total
}
