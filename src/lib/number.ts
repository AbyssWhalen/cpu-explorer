export type BitWidth = 8 | 16 | 32

export interface RadixResult {
  decimal: string
  binary: string
  octal: string
  hex: string
  isValid: boolean
  error?: string
}

export interface ComplementResult {
  original: string   // 原码
  onesComp: string   // 反码
  twosComp: string   // 补码
  decimalValue: number
  bitWidth: BitWidth
  overflow: boolean
}

export interface IEEE754Result {
  sign: number
  exponent: number
  mantissa: bigint
  signBits: string
  exponentBits: string
  mantissaBits: string
  fullBits: string
  decimalValue: number
  special: 'normal' | 'denormalized' | 'zero' | 'infinity' | 'nan'
  precision: 'single' | 'double'
}

// --- Radix Conversion ---

export function parseInput(input: string): { value: bigint; radix: number } | null {
  const s = input.trim().toLowerCase()
  if (!s) return null

  if (s.startsWith('0b')) {
    const digits = s.slice(2)
    if (!/^[01]+$/.test(digits)) return null
    return { value: BigInt(`0b${digits}`), radix: 2 }
  }
  if (s.startsWith('0o')) {
    const digits = s.slice(2)
    if (!/^[0-7]+$/.test(digits)) return null
    return { value: BigInt(`0o${digits}`), radix: 8 }
  }
  if (s.startsWith('0x')) {
    const digits = s.slice(2)
    if (!/^[0-9a-f]+$/.test(digits)) return null
    return { value: BigInt(`0x${digits}`), radix: 16 }
  }
  if (/^-?[0-9]+$/.test(s)) {
    return { value: BigInt(s), radix: 10 }
  }
  if (/^[01]+$/.test(s) && s.length > 1 && s.includes('1')) {
    return { value: BigInt(`0b${s}`), radix: 2 }
  }
  return null
}

export function convertRadix(input: string): RadixResult {
  const parsed = parseInput(input)
  if (!parsed) {
    return { decimal: '', binary: '', octal: '', hex: '', isValid: false, error: '无法识别的输入格式' }
  }

  const { value } = parsed
  const isNeg = value < 0n
  const abs = isNeg ? -value : value

  return {
    decimal: value.toString(10),
    binary: (isNeg ? '-' : '') + '0b' + abs.toString(2),
    octal: (isNeg ? '-' : '') + '0o' + abs.toString(8),
    hex: (isNeg ? '-' : '') + '0x' + abs.toString(16).toUpperCase(),
    isValid: true,
  }
}

// --- Complement Code ---

export function toComplement(decimal: number, bitWidth: BitWidth): ComplementResult {
  const min = -(2 ** (bitWidth - 1))
  const max = 2 ** (bitWidth - 1) - 1
  const overflow = decimal < min || decimal > max

  const clampedValue = overflow ? (decimal < min ? min : max) : decimal

  let original: string
  let onesComp: string
  let twosComp: string

  if (clampedValue >= 0) {
    const bin = clampedValue.toString(2).padStart(bitWidth, '0')
    original = bin
    onesComp = bin
    twosComp = bin
  } else {
    const absBin = Math.abs(clampedValue).toString(2).padStart(bitWidth - 1, '0')
    original = '1' + absBin

    const flipped = absBin.split('').map(b => b === '0' ? '1' : '0').join('')
    onesComp = '1' + flipped

    let carry = 1
    const twosArr = ('1' + flipped).split('').reverse().map(b => {
      const sum = parseInt(b) + carry
      carry = sum > 1 ? 1 : 0
      return (sum % 2).toString()
    })
    twosComp = twosArr.reverse().join('')
  }

  return {
    original,
    onesComp,
    twosComp,
    decimalValue: clampedValue,
    bitWidth,
    overflow,
  }
}

export function fromTwosComplement(bits: string, bitWidth: BitWidth): number {
  if (bits.length !== bitWidth) return 0
  if (bits[0] === '0') {
    return parseInt(bits, 2)
  }
  const flipped = bits.split('').map(b => b === '0' ? '1' : '0').join('')
  return -(parseInt(flipped, 2) + 1)
}

// --- IEEE 754 ---

export function decimalToIEEE754(value: number, precision: 'single' | 'double'): IEEE754Result {
  const buffer = new ArrayBuffer(precision === 'single' ? 4 : 8)
  const view = new DataView(buffer)

  if (precision === 'single') {
    view.setFloat32(0, value)
  } else {
    view.setFloat64(0, value)
  }

  let fullBits: string
  if (precision === 'single') {
    fullBits = view.getUint32(0).toString(2).padStart(32, '0')
  } else {
    const high = view.getUint32(0)
    const low = view.getUint32(4)
    fullBits = high.toString(2).padStart(32, '0') + low.toString(2).padStart(32, '0')
  }

  const expBits = precision === 'single' ? 8 : 11

  const signBits = fullBits[0] as string
  const exponentBits = fullBits.slice(1, 1 + expBits)
  const mantissaBits = fullBits.slice(1 + expBits)

  const sign = parseInt(signBits, 2)
  const exponent = parseInt(exponentBits, 2)
  const mantissa = BigInt('0b' + mantissaBits)

  const maxExp = (1 << expBits) - 1
  let special: IEEE754Result['special'] = 'normal'
  if (exponent === 0 && mantissa === 0n) special = 'zero'
  else if (exponent === 0) special = 'denormalized'
  else if (exponent === maxExp && mantissa === 0n) special = 'infinity'
  else if (exponent === maxExp) special = 'nan'

  return {
    sign,
    exponent,
    mantissa,
    signBits,
    exponentBits,
    mantissaBits,
    fullBits,
    decimalValue: value,
    special,
    precision,
  }
}

export function ieee754BitsToDecimal(bits: string, precision: 'single' | 'double'): number {
  const expectedLen = precision === 'single' ? 32 : 64
  if (bits.length !== expectedLen) return NaN

  const buffer = new ArrayBuffer(precision === 'single' ? 4 : 8)
  const view = new DataView(buffer)

  if (precision === 'single') {
    view.setUint32(0, parseInt(bits, 2) >>> 0)
    return view.getFloat32(0)
  } else {
    const high = parseInt(bits.slice(0, 32), 2) >>> 0
    const low = parseInt(bits.slice(32), 2) >>> 0
    view.setUint32(0, high)
    view.setUint32(4, low)
    return view.getFloat64(0)
  }
}

export function formatBitsGrouped(bits: string, groupSize: number = 4): string {
  return bits.match(new RegExp(`.{1,${groupSize}}`, 'g'))?.join(' ') ?? bits
}
