// RISC-V RV32I Instruction Encoder/Decoder

export type InstrType = 'R' | 'I' | 'S' | 'B' | 'U' | 'J'

export interface InstrField {
  name: string
  bits: string
  start: number
  end: number
  value: number
  color: string
}

export interface DecodedInstruction {
  assembly: string
  binary: string
  hex: string
  type: InstrType
  fields: InstrField[]
  error?: string
}

const FIELD_COLORS: Record<string, string> = {
  opcode: '#6366f1',
  rd: '#22c55e',
  funct3: '#f59e0b',
  rs1: '#3b82f6',
  rs2: '#ec4899',
  funct7: '#8b5cf6',
  imm: '#ef4444',
}

interface InstrDef {
  name: string
  type: InstrType
  opcode: number
  funct3?: number
  funct7?: number
}

const INSTRUCTIONS: InstrDef[] = [
  // R-type
  { name: 'add', type: 'R', opcode: 0b0110011, funct3: 0b000, funct7: 0b0000000 },
  { name: 'sub', type: 'R', opcode: 0b0110011, funct3: 0b000, funct7: 0b0100000 },
  { name: 'and', type: 'R', opcode: 0b0110011, funct3: 0b111, funct7: 0b0000000 },
  { name: 'or', type: 'R', opcode: 0b0110011, funct3: 0b110, funct7: 0b0000000 },
  { name: 'xor', type: 'R', opcode: 0b0110011, funct3: 0b100, funct7: 0b0000000 },
  { name: 'sll', type: 'R', opcode: 0b0110011, funct3: 0b001, funct7: 0b0000000 },
  { name: 'srl', type: 'R', opcode: 0b0110011, funct3: 0b101, funct7: 0b0000000 },
  { name: 'sra', type: 'R', opcode: 0b0110011, funct3: 0b101, funct7: 0b0100000 },
  { name: 'slt', type: 'R', opcode: 0b0110011, funct3: 0b010, funct7: 0b0000000 },
  { name: 'sltu', type: 'R', opcode: 0b0110011, funct3: 0b011, funct7: 0b0000000 },
  // I-type arithmetic
  { name: 'addi', type: 'I', opcode: 0b0010011, funct3: 0b000 },
  { name: 'andi', type: 'I', opcode: 0b0010011, funct3: 0b111 },
  { name: 'ori', type: 'I', opcode: 0b0010011, funct3: 0b110 },
  { name: 'xori', type: 'I', opcode: 0b0010011, funct3: 0b100 },
  { name: 'slti', type: 'I', opcode: 0b0010011, funct3: 0b010 },
  { name: 'sltiu', type: 'I', opcode: 0b0010011, funct3: 0b011 },
  { name: 'slli', type: 'I', opcode: 0b0010011, funct3: 0b001, funct7: 0b0000000 },
  { name: 'srli', type: 'I', opcode: 0b0010011, funct3: 0b101, funct7: 0b0000000 },
  { name: 'srai', type: 'I', opcode: 0b0010011, funct3: 0b101, funct7: 0b0100000 },
  // I-type load
  { name: 'lw', type: 'I', opcode: 0b0000011, funct3: 0b010 },
  { name: 'lh', type: 'I', opcode: 0b0000011, funct3: 0b001 },
  { name: 'lb', type: 'I', opcode: 0b0000011, funct3: 0b000 },
  { name: 'lhu', type: 'I', opcode: 0b0000011, funct3: 0b101 },
  { name: 'lbu', type: 'I', opcode: 0b0000011, funct3: 0b100 },
  // I-type jalr
  { name: 'jalr', type: 'I', opcode: 0b1100111, funct3: 0b000 },
  // S-type
  { name: 'sw', type: 'S', opcode: 0b0100011, funct3: 0b010 },
  { name: 'sh', type: 'S', opcode: 0b0100011, funct3: 0b001 },
  { name: 'sb', type: 'S', opcode: 0b0100011, funct3: 0b000 },
  // B-type
  { name: 'beq', type: 'B', opcode: 0b1100011, funct3: 0b000 },
  { name: 'bne', type: 'B', opcode: 0b1100011, funct3: 0b001 },
  { name: 'blt', type: 'B', opcode: 0b1100011, funct3: 0b100 },
  { name: 'bge', type: 'B', opcode: 0b1100011, funct3: 0b101 },
  { name: 'bltu', type: 'B', opcode: 0b1100011, funct3: 0b110 },
  { name: 'bgeu', type: 'B', opcode: 0b1100011, funct3: 0b111 },
  // U-type
  { name: 'lui', type: 'U', opcode: 0b0110111 },
  { name: 'auipc', type: 'U', opcode: 0b0010111 },
  // J-type
  { name: 'jal', type: 'J', opcode: 0b1101111 },
]

const REG_NAMES = [
  'zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2',
  's0', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5',
  'a6', 'a7', 's2', 's3', 's4', 's5', 's6', 's7',
  's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6',
]

function parseRegister(reg: string | undefined): number {
  if (!reg) return -1
  reg = reg.trim().toLowerCase()
  if (reg.startsWith('x')) {
    const n = parseInt(reg.slice(1))
    if (n >= 0 && n <= 31) return n
    return -1
  }
  const idx = REG_NAMES.indexOf(reg)
  if (idx >= 0) return idx
  // fp alias for s0
  if (reg === 'fp') return 8
  return -1
}

function toBin(val: number, width: number): string {
  return (val >>> 0).toString(2).padStart(width, '0').slice(-width)
}

function signExtend(val: number, bits: number): number {
  const shift = 32 - bits
  return (val << shift) >> shift
}

function makeField(name: string, bits: string, start: number, end: number, value: number): InstrField {
  return { name, bits, start, end, value, color: FIELD_COLORS[name] || '#94a3b8' }
}

// Encode assembly to machine code
export function encode(assembly: string): DecodedInstruction {
  const asm = assembly.trim().toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ')
  const parts = asm.split(' ')
  const mnemonic = parts[0]

  const def = INSTRUCTIONS.find(i => i.name === mnemonic)
  if (!def) {
    return { assembly, binary: '', hex: '', type: 'R', fields: [], error: `Unknown instruction: ${mnemonic}` }
  }

  try {
    let binary = ''
    let fields: InstrField[] = []

    switch (def.type) {
      case 'R': {
        const rd = parseRegister(parts[1])
        const rs1 = parseRegister(parts[2])
        const rs2 = parseRegister(parts[3])
        if (rd < 0 || rs1! < 0 || rs2 < 0) throw new Error('Invalid register')
        binary = toBin(def.funct7!, 7) + toBin(rs2, 5) + toBin(rs1, 5) + toBin(def.funct3!, 3) + toBin(rd, 5) + toBin(def.opcode, 7)
        fields = [
          makeField('funct7', binary.slice(0, 7), 31, 25, def.funct7!),
          makeField('rs2', binary.slice(7, 12), 24, 20, rs2),
          makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
          makeField('funct3', binary.slice(17, 20), 14, 12, def.funct3!),
          makeField('rd', binary.slice(20, 25), 11, 7, rd),
          makeField('opcode', binary.slice(25, 32), 6, 0, def.opcode),
        ]
        break
      }
      case 'I': {
        let rd: number, rs1: number, imm: number
        // Load instructions: lw rd, offset(rs1)
        if (['lw', 'lh', 'lb', 'lhu', 'lbu'].includes(mnemonic)) {
          rd = parseRegister(parts[1])
          const match = parts.slice(2).join(' ').match(/(-?\d+)\((\w+)\)/)
          if (!match) throw new Error('Invalid load syntax, use: lw rd, offset(rs1)')
          imm = parseInt(match[1])
          rs1 = parseRegister(match[2])
        } else if (mnemonic === 'jalr') {
          rd = parseRegister(parts[1])
          if (parts.length === 4) {
            rs1 = parseRegister(parts[2])
            imm = parseInt(parts[3])
          } else {
            const match = parts.slice(2).join(' ').match(/(-?\d+)\((\w+)\)/)
            if (!match) throw new Error('Invalid jalr syntax')
            imm = parseInt(match[1])
            rs1 = parseRegister(match[2])
          }
        } else {
          rd = parseRegister(parts[1])
          rs1 = parseRegister(parts[2])
          imm = parseInt(parts[3])
        }
        if (rd < 0 || rs1 < 0) throw new Error('Invalid register')
        if (imm < -2048 || imm > 2047) throw new Error('Immediate out of range [-2048, 2047]')

        // Shift instructions encode shamt in lower 5 bits with funct7 in upper 7
        let immBits: string
        if (['slli', 'srli', 'srai'].includes(mnemonic)) {
          if (imm < 0 || imm > 31) throw new Error('Shift amount out of range [0, 31]')
          immBits = toBin(def.funct7!, 7) + toBin(imm, 5)
        } else {
          immBits = toBin(imm & 0xFFF, 12)
        }

        binary = immBits + toBin(rs1, 5) + toBin(def.funct3!, 3) + toBin(rd, 5) + toBin(def.opcode, 7)
        fields = [
          makeField('imm', binary.slice(0, 12), 31, 20, signExtend(parseInt(binary.slice(0, 12), 2), 12)),
          makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
          makeField('funct3', binary.slice(17, 20), 14, 12, def.funct3!),
          makeField('rd', binary.slice(20, 25), 11, 7, rd),
          makeField('opcode', binary.slice(25, 32), 6, 0, def.opcode),
        ]
        break
      }
      case 'S': {
        // sw rs2, offset(rs1)
        const rs2 = parseRegister(parts[1])
        const match = parts.slice(2).join(' ').match(/(-?\d+)\((\w+)\)/)
        if (!match) throw new Error('Invalid store syntax, use: sw rs2, offset(rs1)')
        const imm = parseInt(match[1])
        const rs1 = parseRegister(match[2])
        if (rs1 < 0 || rs2 < 0) throw new Error('Invalid register')
        if (imm < -2048 || imm > 2047) throw new Error('Immediate out of range [-2048, 2047]')
        const immVal = imm & 0xFFF
        const imm11_5 = (immVal >> 5) & 0x7F
        const imm4_0 = immVal & 0x1F
        binary = toBin(imm11_5, 7) + toBin(rs2, 5) + toBin(rs1, 5) + toBin(def.funct3!, 3) + toBin(imm4_0, 5) + toBin(def.opcode, 7)
        fields = [
          makeField('imm[11:5]', binary.slice(0, 7), 31, 25, imm11_5),
          makeField('rs2', binary.slice(7, 12), 24, 20, rs2),
          makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
          makeField('funct3', binary.slice(17, 20), 14, 12, def.funct3!),
          makeField('imm[4:0]', binary.slice(20, 25), 11, 7, imm4_0),
          makeField('opcode', binary.slice(25, 32), 6, 0, def.opcode),
        ]
        break
      }
      case 'B': {
        // beq rs1, rs2, offset
        const rs1 = parseRegister(parts[1])
        const rs2 = parseRegister(parts[2])
        let imm = parseInt(parts[3])
        if (rs1 < 0 || rs2 < 0) throw new Error('Invalid register')
        if (imm % 2 !== 0) throw new Error('Branch offset must be even')
        if (imm < -4096 || imm > 4094) throw new Error('Branch offset out of range [-4096, 4094]')
        // B-type imm encoding: imm[12|10:5|4:1|11]
        const bit12 = (imm >> 12) & 1
        const bit11 = (imm >> 11) & 1
        const bits10_5 = (imm >> 5) & 0x3F
        const bits4_1 = (imm >> 1) & 0xF
        binary = toBin(bit12, 1) + toBin(bits10_5, 6) + toBin(rs2, 5) + toBin(rs1, 5) + toBin(def.funct3!, 3) + toBin(bits4_1, 4) + toBin(bit11, 1) + toBin(def.opcode, 7)
        fields = [
          makeField('imm[12]', binary.slice(0, 1), 31, 31, bit12),
          makeField('imm[10:5]', binary.slice(1, 7), 30, 25, bits10_5),
          makeField('rs2', binary.slice(7, 12), 24, 20, rs2),
          makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
          makeField('funct3', binary.slice(17, 20), 14, 12, def.funct3!),
          makeField('imm[4:1]', binary.slice(20, 24), 11, 8, bits4_1),
          makeField('imm[11]', binary.slice(24, 25), 7, 7, bit11),
          makeField('opcode', binary.slice(25, 32), 6, 0, def.opcode),
        ]
        break
      }
      case 'U': {
        // lui rd, imm
        const rd = parseRegister(parts[1])
        let imm = parseInt(parts[2])
        if (rd < 0) throw new Error('Invalid register')
        if (imm < 0 || imm > 0xFFFFF) throw new Error('U-type immediate out of range [0, 0xFFFFF]')
        binary = toBin(imm, 20) + toBin(rd, 5) + toBin(def.opcode, 7)
        fields = [
          makeField('imm[31:12]', binary.slice(0, 20), 31, 12, imm),
          makeField('rd', binary.slice(20, 25), 11, 7, rd),
          makeField('opcode', binary.slice(25, 32), 6, 0, def.opcode),
        ]
        break
      }
      case 'J': {
        // jal rd, offset
        const rd = parseRegister(parts[1])
        let imm = parseInt(parts[2])
        if (rd < 0) throw new Error('Invalid register')
        if (imm % 2 !== 0) throw new Error('JAL offset must be even')
        if (imm < -1048576 || imm > 1048574) throw new Error('JAL offset out of range')
        // J-type imm encoding: imm[20|10:1|11|19:12]
        const bit20 = (imm >> 20) & 1
        const bits10_1 = (imm >> 1) & 0x3FF
        const bit11 = (imm >> 11) & 1
        const bits19_12 = (imm >> 12) & 0xFF
        binary = toBin(bit20, 1) + toBin(bits10_1, 10) + toBin(bit11, 1) + toBin(bits19_12, 8) + toBin(rd, 5) + toBin(def.opcode, 7)
        fields = [
          makeField('imm[20]', binary.slice(0, 1), 31, 31, bit20),
          makeField('imm[10:1]', binary.slice(1, 11), 30, 21, bits10_1),
          makeField('imm[11]', binary.slice(11, 12), 20, 20, bit11),
          makeField('imm[19:12]', binary.slice(12, 20), 19, 12, bits19_12),
          makeField('rd', binary.slice(20, 25), 11, 7, rd),
          makeField('opcode', binary.slice(25, 32), 6, 0, def.opcode),
        ]
        break
      }
    }

    const hex = '0x' + parseInt(binary, 2).toString(16).padStart(8, '0')
    return { assembly, binary, hex, type: def.type, fields }
  } catch (e) {
    return { assembly, binary: '', hex: '', type: def.type, fields: [], error: (e as Error).message }
  }
}

// Decode machine code to assembly
export function decode(input: string): DecodedInstruction {
  let binary: string
  const trimmed = input.trim()

  if (/^0[xX][0-9a-fA-F]+$/.test(trimmed)) {
    binary = parseInt(trimmed, 16).toString(2).padStart(32, '0')
  } else if (/^[01]+$/.test(trimmed)) {
    binary = trimmed.padStart(32, '0')
  } else {
    return { assembly: '', binary: '', hex: '', type: 'R', fields: [], error: 'Invalid input: use binary or hex (0x...)' }
  }

  if (binary.length !== 32) {
    return { assembly: '', binary, hex: '', type: 'R', fields: [], error: 'Instruction must be 32 bits' }
  }

  const opcode = parseInt(binary.slice(25, 32), 2)
  const hex = '0x' + parseInt(binary, 2).toString(16).padStart(8, '0')

  const funct3 = parseInt(binary.slice(17, 20), 2)
  const funct7 = parseInt(binary.slice(0, 7), 2)
  const rd = parseInt(binary.slice(20, 25), 2)
  const rs1 = parseInt(binary.slice(12, 17), 2)
  const rs2 = parseInt(binary.slice(7, 12), 2)

  const regName = (n: number) => `x${n}`

  // Match instruction by opcode + funct3 + funct7
  let def: InstrDef | undefined

  if (opcode === 0b0110011) {
    // R-type
    def = INSTRUCTIONS.find(i => i.opcode === opcode && i.funct3 === funct3 && i.funct7 === funct7)
    if (!def) return { assembly: '', binary, hex, type: 'R', fields: [], error: 'Unknown R-type instruction' }
    const fields = [
      makeField('funct7', binary.slice(0, 7), 31, 25, funct7),
      makeField('rs2', binary.slice(7, 12), 24, 20, rs2),
      makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
      makeField('funct3', binary.slice(17, 20), 14, 12, funct3),
      makeField('rd', binary.slice(20, 25), 11, 7, rd),
      makeField('opcode', binary.slice(25, 32), 6, 0, opcode),
    ]
    return { assembly: `${def.name} ${regName(rd)}, ${regName(rs1)}, ${regName(rs2)}`, binary, hex, type: 'R', fields }
  }

  if (opcode === 0b0010011) {
    // I-type arithmetic
    if (funct3 === 0b001 || funct3 === 0b101) {
      // shift: check funct7
      def = INSTRUCTIONS.find(i => i.opcode === opcode && i.funct3 === funct3 && i.funct7 === funct7)
      if (!def) return { assembly: '', binary, hex, type: 'I', fields: [], error: 'Unknown shift instruction' }
      const shamt = rs2
      const fields = [
        makeField('imm', binary.slice(0, 12), 31, 20, signExtend(parseInt(binary.slice(0, 12), 2), 12)),
        makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
        makeField('funct3', binary.slice(17, 20), 14, 12, funct3),
        makeField('rd', binary.slice(20, 25), 11, 7, rd),
        makeField('opcode', binary.slice(25, 32), 6, 0, opcode),
      ]
      return { assembly: `${def.name} ${regName(rd)}, ${regName(rs1)}, ${shamt}`, binary, hex, type: 'I', fields }
    }
    def = INSTRUCTIONS.find(i => i.opcode === opcode && i.funct3 === funct3 && i.type === 'I')
    if (!def) return { assembly: '', binary, hex, type: 'I', fields: [], error: 'Unknown I-type instruction' }
    const imm = signExtend(parseInt(binary.slice(0, 12), 2), 12)
    const fields = [
      makeField('imm', binary.slice(0, 12), 31, 20, imm),
      makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
      makeField('funct3', binary.slice(17, 20), 14, 12, funct3),
      makeField('rd', binary.slice(20, 25), 11, 7, rd),
      makeField('opcode', binary.slice(25, 32), 6, 0, opcode),
    ]
    return { assembly: `${def.name} ${regName(rd)}, ${regName(rs1)}, ${imm}`, binary, hex, type: 'I', fields }
  }

  if (opcode === 0b0000011) {
    // Load
    def = INSTRUCTIONS.find(i => i.opcode === opcode && i.funct3 === funct3)
    if (!def) return { assembly: '', binary, hex, type: 'I', fields: [], error: 'Unknown load instruction' }
    const imm = signExtend(parseInt(binary.slice(0, 12), 2), 12)
    const fields = [
      makeField('imm', binary.slice(0, 12), 31, 20, imm),
      makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
      makeField('funct3', binary.slice(17, 20), 14, 12, funct3),
      makeField('rd', binary.slice(20, 25), 11, 7, rd),
      makeField('opcode', binary.slice(25, 32), 6, 0, opcode),
    ]
    return { assembly: `${def.name} ${regName(rd)}, ${imm}(${regName(rs1)})`, binary, hex, type: 'I', fields }
  }

  if (opcode === 0b1100111) {
    // jalr
    def = INSTRUCTIONS.find(i => i.opcode === opcode)!
    const imm = signExtend(parseInt(binary.slice(0, 12), 2), 12)
    const fields = [
      makeField('imm', binary.slice(0, 12), 31, 20, imm),
      makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
      makeField('funct3', binary.slice(17, 20), 14, 12, funct3),
      makeField('rd', binary.slice(20, 25), 11, 7, rd),
      makeField('opcode', binary.slice(25, 32), 6, 0, opcode),
    ]
    return { assembly: `jalr ${regName(rd)}, ${regName(rs1)}, ${imm}`, binary, hex, type: 'I', fields }
  }

  if (opcode === 0b0100011) {
    // S-type
    def = INSTRUCTIONS.find(i => i.opcode === opcode && i.funct3 === funct3)
    if (!def) return { assembly: '', binary, hex, type: 'S', fields: [], error: 'Unknown store instruction' }
    const imm11_5 = parseInt(binary.slice(0, 7), 2)
    const imm4_0 = parseInt(binary.slice(20, 25), 2)
    const imm = signExtend((imm11_5 << 5) | imm4_0, 12)
    const fields = [
      makeField('imm[11:5]', binary.slice(0, 7), 31, 25, imm11_5),
      makeField('rs2', binary.slice(7, 12), 24, 20, rs2),
      makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
      makeField('funct3', binary.slice(17, 20), 14, 12, funct3),
      makeField('imm[4:0]', binary.slice(20, 25), 11, 7, imm4_0),
      makeField('opcode', binary.slice(25, 32), 6, 0, opcode),
    ]
    return { assembly: `${def.name} ${regName(rs2)}, ${imm}(${regName(rs1)})`, binary, hex, type: 'S', fields }
  }

  if (opcode === 0b1100011) {
    // B-type
    def = INSTRUCTIONS.find(i => i.opcode === opcode && i.funct3 === funct3)
    if (!def) return { assembly: '', binary, hex, type: 'B', fields: [], error: 'Unknown branch instruction' }
    const bit12 = parseInt(binary[0], 2)
    const bits10_5 = parseInt(binary.slice(1, 7), 2)
    const bits4_1 = parseInt(binary.slice(20, 24), 2)
    const bit11 = parseInt(binary[24], 2)
    const imm = signExtend((bit12 << 12) | (bit11 << 11) | (bits10_5 << 5) | (bits4_1 << 1), 13)
    const fields = [
      makeField('imm[12]', binary.slice(0, 1), 31, 31, bit12),
      makeField('imm[10:5]', binary.slice(1, 7), 30, 25, bits10_5),
      makeField('rs2', binary.slice(7, 12), 24, 20, rs2),
      makeField('rs1', binary.slice(12, 17), 19, 15, rs1),
      makeField('funct3', binary.slice(17, 20), 14, 12, funct3),
      makeField('imm[4:1]', binary.slice(20, 24), 11, 8, bits4_1),
      makeField('imm[11]', binary.slice(24, 25), 7, 7, bit11),
      makeField('opcode', binary.slice(25, 32), 6, 0, opcode),
    ]
    return { assembly: `${def.name} ${regName(rs1)}, ${regName(rs2)}, ${imm}`, binary, hex, type: 'B', fields }
  }

  if (opcode === 0b0110111 || opcode === 0b0010111) {
    // U-type
    def = INSTRUCTIONS.find(i => i.opcode === opcode)!
    const imm = parseInt(binary.slice(0, 20), 2)
    const fields = [
      makeField('imm[31:12]', binary.slice(0, 20), 31, 12, imm),
      makeField('rd', binary.slice(20, 25), 11, 7, rd),
      makeField('opcode', binary.slice(25, 32), 6, 0, opcode),
    ]
    return { assembly: `${def.name} ${regName(rd)}, ${imm}`, binary, hex, type: 'U', fields }
  }

  if (opcode === 0b1101111) {
    // J-type
    def = INSTRUCTIONS.find(i => i.opcode === opcode)!
    const bit20 = parseInt(binary[0], 2)
    const bits10_1 = parseInt(binary.slice(1, 11), 2)
    const bit11 = parseInt(binary[11], 2)
    const bits19_12 = parseInt(binary.slice(12, 20), 2)
    const imm = signExtend((bit20 << 20) | (bits19_12 << 12) | (bit11 << 11) | (bits10_1 << 1), 21)
    const fields = [
      makeField('imm[20]', binary.slice(0, 1), 31, 31, bit20),
      makeField('imm[10:1]', binary.slice(1, 11), 30, 21, bits10_1),
      makeField('imm[11]', binary.slice(11, 12), 20, 20, bit11),
      makeField('imm[19:12]', binary.slice(12, 20), 19, 12, bits19_12),
      makeField('rd', binary.slice(20, 25), 11, 7, rd),
      makeField('opcode', binary.slice(25, 32), 6, 0, opcode),
    ]
    return { assembly: `jal ${regName(rd)}, ${imm}`, binary, hex, type: 'J', fields }
  }

  return { assembly: '', binary, hex, type: 'R', fields: [], error: `Unknown opcode: 0b${toBin(opcode, 7)}` }
}

export function getInstructionList(): string[] {
  return INSTRUCTIONS.map(i => i.name)
}

export function getRegisterNames(): string[] {
  return REG_NAMES
}

export function getFormatInfo(type: InstrType): { layout: string; description: string } {
  const formats: Record<InstrType, { layout: string; description: string }> = {
    R: { layout: 'funct7[31:25] | rs2[24:20] | rs1[19:15] | funct3[14:12] | rd[11:7] | opcode[6:0]', description: '寄存器-寄存器运算' },
    I: { layout: 'imm[31:20] | rs1[19:15] | funct3[14:12] | rd[11:7] | opcode[6:0]', description: '立即数运算 / 加载 / jalr' },
    S: { layout: 'imm[11:5] | rs2[24:20] | rs1[19:15] | funct3[14:12] | imm[4:0] | opcode[6:0]', description: '存储指令' },
    B: { layout: 'imm[12|10:5] | rs2[24:20] | rs1[19:15] | funct3[14:12] | imm[4:1|11] | opcode[6:0]', description: '条件分支' },
    U: { layout: 'imm[31:12] | rd[11:7] | opcode[6:0]', description: '高位立即数 (lui/auipc)' },
    J: { layout: 'imm[20|10:1|11|19:12] | rd[11:7] | opcode[6:0]', description: '无条件跳转 (jal)' },
  }
  return formats[type]
}
