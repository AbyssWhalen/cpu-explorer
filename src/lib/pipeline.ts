// Five-Stage Pipeline Simulator (IF/ID/EX/MEM/WB)

export type Stage = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB'
export type HazardType = 'none' | 'data' | 'control'
export type BubbleReason = 'stall' | 'flush'

export interface PipelineInstruction {
  index: number
  assembly: string
  rd: string | null
  rs1: string | null
  rs2: string | null
  isBranch: boolean
  isLoad: boolean
}

export interface CycleCell {
  stage: Stage | null
  bubble: BubbleReason | null
  forwarding?: { from: number; fromStage: Stage }
}

export interface PipelineConfig {
  forwarding: boolean
  branchPrediction: 'none' | 'not-taken'
}

export interface PipelineResult {
  instructions: PipelineInstruction[]
  timeline: CycleCell[][]  // [instrIndex][cycle]
  totalCycles: number
  hazards: HazardInfo[]
}

export interface HazardInfo {
  type: 'RAW' | 'load-use' | 'control'
  fromInstr: number
  toInstr: number
  register: string
  resolved: 'forwarding' | 'stall' | 'flush'
}

const STAGES: Stage[] = ['IF', 'ID', 'EX', 'MEM', 'WB']

export function parseInstructions(code: string): PipelineInstruction[] {
  const lines = code.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  return lines.map((line, index) => {
    const asm = line.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ')
    const parts = asm.split(' ')
    const mnemonic = parts[0]

    const branches = ['beq', 'bne', 'blt', 'bge', 'bltu', 'bgeu', 'jal', 'jalr']
    const loads = ['lw', 'lh', 'lb', 'lhu', 'lbu']
    const stores = ['sw', 'sh', 'sb']

    let rd: string | null = null
    let rs1: string | null = null
    let rs2: string | null = null

    if (branches.includes(mnemonic)) {
      if (mnemonic === 'jal') {
        rd = parts[1] || null
      } else if (mnemonic === 'jalr') {
        rd = parts[1] || null
        rs1 = parts[2] || null
      } else {
        rs1 = parts[1] || null
        rs2 = parts[2] || null
      }
    } else if (loads.includes(mnemonic)) {
      rd = parts[1] || null
      const match = parts.slice(2).join('').match(/\((\w+)\)/)
      rs1 = match ? match[1] : null
    } else if (stores.includes(mnemonic)) {
      rs2 = parts[1] || null
      const match = parts.slice(2).join('').match(/\((\w+)\)/)
      rs1 = match ? match[1] : null
    } else {
      // R-type or I-type arithmetic
      rd = parts[1] || null
      rs1 = parts[2] || null
      if (parts.length > 3 && !parts[3].match(/^-?\d/)) {
        rs2 = parts[3]
      }
    }

    // Normalize register names
    const norm = (r: string | null) => {
      if (!r) return null
      r = r.trim()
      if (r === 'x0' || r === 'zero') return null // x0 is always 0, no hazards
      return r
    }

    return {
      index,
      assembly: line,
      rd: norm(rd),
      rs1: norm(rs1),
      rs2: norm(rs2),
      isBranch: branches.includes(mnemonic),
      isLoad: loads.includes(mnemonic),
    }
  })
}

export function simulate(instructions: PipelineInstruction[], config: PipelineConfig): PipelineResult {
  if (instructions.length === 0) {
    return { instructions, timeline: [], totalCycles: 0, hazards: [] }
  }

  const n = instructions.length
  const hazards: HazardInfo[] = []

  // Track when each instruction enters each stage (cycle number)
  // -1 means not yet assigned
  const stageEntry: number[][] = Array.from({ length: n }, () => Array(5).fill(-1))

  // First instruction starts IF at cycle 0
  stageEntry[0][0] = 0

  for (let i = 1; i < n; i++) {
    // Default: next instruction enters IF one cycle after previous
    let ifCycle = stageEntry[i - 1][0] + 1

    // Check for hazards with all previous in-flight instructions
    for (let j = Math.max(0, i - 3); j < i; j++) {
      const prev = instructions[j]
      const curr = instructions[i]

      if (!prev.rd) continue

      const dependsOnRd = (curr.rs1 && curr.rs1 === prev.rd) || (curr.rs2 && curr.rs2 === prev.rd)
      if (!dependsOnRd) continue

      if (prev.isLoad) {
        // Load-use hazard: even with forwarding, need 1 stall

        if (config.forwarding) {
          // With forwarding: 1 stall for load-use
          const minIF = stageEntry[j][0] + 2 // load needs 2 cycles head start
          if (ifCycle < minIF) {
            ifCycle = minIF
            hazards.push({
              type: 'load-use',
              fromInstr: j,
              toInstr: i,
              register: prev.rd,
              resolved: 'stall',
            })
          }
        } else {
          // Without forwarding: 2 stalls for load
          const minIF = stageEntry[j][0] + 3
          if (ifCycle < minIF) {
            ifCycle = minIF
            hazards.push({
              type: 'RAW',
              fromInstr: j,
              toInstr: i,
              register: prev.rd,
              resolved: 'stall',
            })
          }
        }
      } else {
        // RAW hazard on ALU instruction
        if (config.forwarding) {
          // Forwarding resolves it, no stall needed
          hazards.push({
            type: 'RAW',
            fromInstr: j,
            toInstr: i,
            register: prev.rd,
            resolved: 'forwarding',
          })
        } else {
          // Without forwarding: need to wait until WB completes
          // Result written in WB (stageEntry[j][4]), read in ID (stageEntry[i][1])
          const minIF = stageEntry[j][0] + 3 // 2 stalls
          if (ifCycle < minIF) {
            ifCycle = minIF
            hazards.push({
              type: 'RAW',
              fromInstr: j,
              toInstr: i,
              register: prev.rd,
              resolved: 'stall',
            })
          }
        }
      }
    }

    // Control hazard: previous instruction is a branch
    if (i > 0 && instructions[i - 1].isBranch) {
      if (config.branchPrediction === 'none') {
        // Flush: assume branch resolved in EX, 2 cycle penalty
        const minIF = stageEntry[i - 1][0] + 3
        if (ifCycle < minIF) {
          ifCycle = minIF
          hazards.push({
            type: 'control',
            fromInstr: i - 1,
            toInstr: i,
            register: '',
            resolved: 'flush',
          })
        }
      }
      // not-taken prediction: no penalty (optimistic, assume correct)
    }

    stageEntry[i][0] = ifCycle
    // Fill remaining stages sequentially
    for (let s = 1; s < 5; s++) {
      stageEntry[i][s] = stageEntry[i][s - 1] + 1
    }
  }

  // Also fill stage entries for first instruction and fix sequential
  for (let i = 0; i < n; i++) {
    if (stageEntry[i][0] === -1) stageEntry[i][0] = i
    for (let s = 1; s < 5; s++) {
      if (stageEntry[i][s] === -1) {
        stageEntry[i][s] = stageEntry[i][s - 1] + 1
      }
    }
  }

  // Compute total cycles
  const totalCycles = stageEntry[n - 1][4] + 1

  // Build timeline grid
  const timeline: CycleCell[][] = Array.from({ length: n }, () =>
    Array.from({ length: totalCycles }, (): CycleCell => ({ stage: null, bubble: null }))
  )

  for (let i = 0; i < n; i++) {
    for (let s = 0; s < 5; s++) {
      const cycle = stageEntry[i][s]
      if (cycle >= 0 && cycle < totalCycles) {
        timeline[i][cycle] = { stage: STAGES[s], bubble: null }
      }
    }

    // Mark bubbles (stall cycles between IF of prev and IF of current)
    if (i > 0) {
      const prevIF = stageEntry[i - 1][0]
      const currIF = stageEntry[i][0]
      const gap = currIF - prevIF - 1
      if (gap > 0) {
        // Determine if stall or flush
        const isFlush = hazards.some(h => h.toInstr === i && h.resolved === 'flush')
        for (let c = prevIF + 1; c < currIF; c++) {
          // Put bubble in the timeline for instruction i
          if (c < totalCycles) {
            timeline[i][c] = { stage: null, bubble: isFlush ? 'flush' : 'stall' }
          }
        }
      }
    }
  }

  // Mark forwarding paths
  for (const h of hazards) {
    if (h.resolved === 'forwarding') {
      const fromStage: Stage = instructions[h.fromInstr].isLoad ? 'MEM' : 'EX'
      const toCycle = stageEntry[h.toInstr][2] // EX stage of consumer
      if (toCycle >= 0 && toCycle < totalCycles) {
        timeline[h.toInstr][toCycle] = {
          stage: 'EX',
          bubble: null,
          forwarding: { from: h.fromInstr, fromStage },
        }
      }
    }
  }

  return { instructions, timeline, totalCycles, hazards }
}

export const EXAMPLE_CODE = `add x1, x2, x3
sub x4, x1, x5
and x6, x1, x7
or x8, x6, x9
lw x10, 0(x1)
add x11, x10, x2`
