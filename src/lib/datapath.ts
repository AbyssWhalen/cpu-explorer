// Single-cycle RISC-V Datapath Control Signals

export interface ControlSignals {
  regWrite: boolean
  memRead: boolean
  memWrite: boolean
  memToReg: boolean    // false=ALU result, true=memory data
  aluSrc: boolean      // false=register, true=immediate
  branch: boolean
  jump: boolean
  aluOp: string        // operation description
}

export interface DatapathState {
  instruction: string
  type: 'R' | 'I' | 'S' | 'B' | 'U' | 'J' | null
  signals: ControlSignals
  activePaths: string[]  // IDs of active SVG paths
  activeComponents: string[]  // IDs of active components
  description: string
}

const DEFAULT_SIGNALS: ControlSignals = {
  regWrite: false,
  memRead: false,
  memWrite: false,
  memToReg: false,
  aluSrc: false,
  branch: false,
  jump: false,
  aluOp: 'none',
}

interface InstrPattern {
  match: (instr: string) => boolean
  type: 'R' | 'I' | 'S' | 'B' | 'U' | 'J'
  signals: Partial<ControlSignals>
  paths: string[]
  components: string[]
  description: string
}

const R_TYPE_INSTRS = ['add', 'sub', 'and', 'or', 'xor', 'sll', 'srl', 'sra', 'slt', 'sltu']
const I_ALU_INSTRS = ['addi', 'andi', 'ori', 'xori', 'slti', 'sltiu', 'slli', 'srli', 'srai']
const LOAD_INSTRS = ['lw', 'lh', 'lb', 'lhu', 'lbu']
const STORE_INSTRS = ['sw', 'sh', 'sb']
const BRANCH_INSTRS = ['beq', 'bne', 'blt', 'bge', 'bltu', 'bgeu']

const PATTERNS: InstrPattern[] = [
  {
    match: (instr) => R_TYPE_INSTRS.some(i => instr.startsWith(i + ' ') || instr === i),
    type: 'R',
    signals: { regWrite: true, aluSrc: false, aluOp: 'R-type (funct7+funct3)' },
    paths: ['pc-to-imem', 'imem-to-ctrl', 'imem-to-reg', 'reg-rs1-to-alu', 'reg-rs2-to-mux-alu', 'mux-alu-to-alu', 'alu-to-mux-wb', 'mux-wb-to-reg'],
    components: ['pc', 'imem', 'control', 'registers', 'alu', 'mux-alu-src', 'mux-wb'],
    description: '寄存器-寄存器运算：从寄存器堆读两个源操作数，经 ALU 运算后写回目标寄存器',
  },
  {
    match: (instr) => I_ALU_INSTRS.some(i => instr.startsWith(i + ' ') || instr === i),
    type: 'I',
    signals: { regWrite: true, aluSrc: true, aluOp: 'I-type ALU (funct3)' },
    paths: ['pc-to-imem', 'imem-to-ctrl', 'imem-to-reg', 'imem-to-immgen', 'reg-rs1-to-alu', 'immgen-to-mux-alu', 'mux-alu-to-alu', 'alu-to-mux-wb', 'mux-wb-to-reg'],
    components: ['pc', 'imem', 'control', 'registers', 'imm-gen', 'alu', 'mux-alu-src', 'mux-wb'],
    description: '立即数运算：从寄存器读 rs1，与符号扩展后的立即数经 ALU 运算，结果写回 rd',
  },
  {
    match: (instr) => LOAD_INSTRS.some(i => instr.startsWith(i + ' ') || instr === i),
    type: 'I',
    signals: { regWrite: true, memRead: true, memToReg: true, aluSrc: true, aluOp: 'add (base+offset)' },
    paths: ['pc-to-imem', 'imem-to-ctrl', 'imem-to-reg', 'imem-to-immgen', 'reg-rs1-to-alu', 'immgen-to-mux-alu', 'mux-alu-to-alu', 'alu-to-dmem', 'dmem-to-mux-wb', 'mux-wb-to-reg'],
    components: ['pc', 'imem', 'control', 'registers', 'imm-gen', 'alu', 'mux-alu-src', 'dmem', 'mux-wb'],
    description: 'Load：rs1 + 偏移量计算内存地址，从数据存储器读出数据写回 rd',
  },
  {
    match: (instr) => STORE_INSTRS.some(i => instr.startsWith(i + ' ') || instr === i),
    type: 'S',
    signals: { memWrite: true, aluSrc: true, aluOp: 'add (base+offset)' },
    paths: ['pc-to-imem', 'imem-to-ctrl', 'imem-to-reg', 'imem-to-immgen', 'reg-rs1-to-alu', 'immgen-to-mux-alu', 'mux-alu-to-alu', 'alu-to-dmem', 'reg-rs2-to-dmem'],
    components: ['pc', 'imem', 'control', 'registers', 'imm-gen', 'alu', 'mux-alu-src', 'dmem'],
    description: 'Store：rs1 + 偏移量计算内存地址，将 rs2 的值写入数据存储器',
  },
  {
    match: (instr) => BRANCH_INSTRS.some(i => instr.startsWith(i + ' ') || instr === i),
    type: 'B',
    signals: { branch: true, aluSrc: false, aluOp: 'subtract (compare)' },
    paths: ['pc-to-imem', 'imem-to-ctrl', 'imem-to-reg', 'imem-to-immgen', 'reg-rs1-to-alu', 'reg-rs2-to-mux-alu', 'mux-alu-to-alu', 'alu-zero-to-and', 'immgen-to-adder', 'pc-to-adder', 'adder-to-mux-pc', 'mux-pc-to-pc'],
    components: ['pc', 'imem', 'control', 'registers', 'alu', 'mux-alu-src', 'imm-gen', 'branch-adder', 'mux-pc', 'and-gate'],
    description: '条件分支：比较两个寄存器的值，若条件满足则 PC 跳转到 PC+偏移量',
  },
  {
    match: (instr) => instr.startsWith('lui ') || instr === 'lui',
    type: 'U',
    signals: { regWrite: true, aluSrc: true, aluOp: 'pass upper imm' },
    paths: ['pc-to-imem', 'imem-to-ctrl', 'imem-to-reg', 'imem-to-immgen', 'immgen-to-mux-alu', 'mux-alu-to-alu', 'alu-to-mux-wb', 'mux-wb-to-reg'],
    components: ['pc', 'imem', 'control', 'registers', 'imm-gen', 'alu', 'mux-alu-src', 'mux-wb'],
    description: 'LUI：将 20 位立即数放入目标寄存器的高 20 位，低 12 位清零',
  },
  {
    match: (instr) => instr.startsWith('auipc ') || instr === 'auipc',
    type: 'U',
    signals: { regWrite: true, aluSrc: true, aluOp: 'PC + upper imm' },
    paths: ['pc-to-imem', 'imem-to-ctrl', 'imem-to-reg', 'imem-to-immgen', 'pc-to-adder', 'immgen-to-adder', 'adder-to-mux-wb', 'mux-wb-to-reg'],
    components: ['pc', 'imem', 'control', 'registers', 'imm-gen', 'branch-adder', 'mux-wb'],
    description: 'AUIPC：PC + (立即数 << 12)，结果写回 rd，用于构造地址',
  },
  {
    match: (instr) => instr.startsWith('jal ') || instr === 'jal',
    type: 'J',
    signals: { regWrite: true, jump: true, aluOp: 'PC+4 (link)' },
    paths: ['pc-to-imem', 'imem-to-ctrl', 'imem-to-reg', 'imem-to-immgen', 'pc-to-adder', 'immgen-to-adder', 'adder-to-mux-pc', 'mux-pc-to-pc', 'pc-plus4-to-mux-wb', 'mux-wb-to-reg'],
    components: ['pc', 'imem', 'control', 'registers', 'imm-gen', 'branch-adder', 'mux-pc', 'mux-wb'],
    description: 'JAL：PC+4 写入 rd（返回地址），PC 跳转到 PC+偏移量',
  },
  {
    match: (instr) => instr.startsWith('jalr ') || instr === 'jalr',
    type: 'I',
    signals: { regWrite: true, jump: true, aluSrc: true, aluOp: 'rs1 + imm (target)' },
    paths: ['pc-to-imem', 'imem-to-ctrl', 'imem-to-reg', 'imem-to-immgen', 'reg-rs1-to-alu', 'immgen-to-mux-alu', 'mux-alu-to-alu', 'alu-to-mux-pc', 'mux-pc-to-pc', 'pc-plus4-to-mux-wb', 'mux-wb-to-reg'],
    components: ['pc', 'imem', 'control', 'registers', 'imm-gen', 'alu', 'mux-alu-src', 'mux-pc', 'mux-wb'],
    description: 'JALR：PC+4 写入 rd，PC 跳转到 (rs1+imm) & ~1，常用于函数返回',
  },
]

export function analyzeInstruction(assembly: string): DatapathState {
  const instr = assembly.trim().toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ')

  if (!instr) {
    return {
      instruction: '',
      type: null,
      signals: DEFAULT_SIGNALS,
      activePaths: [],
      activeComponents: [],
      description: '输入一条 RISC-V 指令，观察数据通路的激活情况',
    }
  }

  for (const pattern of PATTERNS) {
    if (pattern.match(instr)) {
      return {
        instruction: instr,
        type: pattern.type,
        signals: { ...DEFAULT_SIGNALS, ...pattern.signals },
        activePaths: pattern.paths,
        activeComponents: pattern.components,
        description: pattern.description,
      }
    }
  }

  return {
    instruction: instr,
    type: null,
    signals: DEFAULT_SIGNALS,
    activePaths: [],
    activeComponents: [],
    description: '无法识别的指令',
  }
}

export const SIGNAL_DESCRIPTIONS: Record<keyof ControlSignals, string> = {
  regWrite: '寄存器写使能：是否将结果写回寄存器堆',
  memRead: '存储器读使能：是否从数据存储器读取',
  memWrite: '存储器写使能：是否向数据存储器写入',
  memToReg: '写回数据选择：0=ALU 结果，1=存储器数据',
  aluSrc: 'ALU 第二操作数选择：0=寄存器 rs2，1=立即数',
  branch: '分支控制：是否为条件分支指令',
  jump: '跳转控制：是否为无条件跳转',
  aluOp: 'ALU 操作类型',
}
