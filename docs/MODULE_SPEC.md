# 模块规格说明

## 1. Number Converter — 进制/补码/浮点数转换器

### 功能
- 十进制、二进制、八进制、十六进制互转
- 原码、反码、补码转换（支持 8/16/32 位宽）
- IEEE 754 单精度/双精度浮点数解析
  - 输入十进制 → 显示 sign/exponent/mantissa 各字段
  - 输入二进制位串 → 还原为十进制
- 溢出检测与提示

### 交互设计
- 输入框输入任意格式数字，其他格式实时联动更新
- 浮点数模式下，位字段用颜色区分（符号位红、阶码蓝、尾数绿）
- 点击某个 bit 可以 toggle，观察值变化

### 技术要点
- `src/lib/number.ts` 实现所有转换逻辑，纯函数
- 注意 JavaScript 大数精度问题，64 位用 BigInt
- 浮点数特殊值处理：NaN、Infinity、denormalized

---

## 2. Instruction Codec — RISC-V 指令编解码器

### 功能
- 汇编 → 机器码：输入 `add x1, x2, x3`，输出 32 位二进制 + 十六进制
- 机器码 → 汇编：输入 32 位二进制/十六进制，解码为汇编
- 字段高亮：opcode / rd / funct3 / rs1 / rs2 / funct7 / imm 各字段着色
- 支持指令类型：R / I / S / B / U / J 全部六种格式

### 支持的指令子集（RV32I 基础指令集）
```
R-type: add, sub, and, or, xor, sll, srl, sra, slt, sltu
I-type: addi, andi, ori, xori, slti, sltiu, slli, srli, srai, lw, lh, lb, lhu, lbu, jalr
S-type: sw, sh, sb
B-type: beq, bne, blt, bge, bltu, bgeu
U-type: lui, auipc
J-type: jal
```

### 交互设计
- 双向实时转换（输入汇编自动出机器码，反之亦然）
- 32 位机器码每个字段用不同颜色标注
- 悬停字段显示该字段含义和值
- 指令格式参考图始终可见（当前指令类型高亮）

### 技术要点
- `src/lib/riscv.ts` 实现编解码
- 立即数的符号扩展、位重排（B-type/J-type 的 imm 字段排布）
- 错误处理：非法指令、寄存器号越界、立即数溢出

---

## 3. Cache Simulator — Cache 模拟器

### 功能
- 配置参数：
  - Cache 总大小（64B ~ 4KB）
  - 块大小（4B ~ 64B）
  - 关联度（直接映射 / 2路 / 4路 / 全相联）
  - 替换策略（LRU / FIFO / Random）
  - 写策略（Write-through / Write-back）
- 地址序列输入：手动输入 / 随机生成 / 预设场景（循环访问、stride 等）
- 逐步模拟：每次内存访问展示完整查找过程
- 统计：命中率、miss 次数、各 set 的使用情况

### 交互设计
- Cache 表格可视化：显示每个 set 的每个 way（tag / valid / dirty / data）
- 当前访问的地址拆解为 tag / index / offset 并着色
- 命中时绿色闪烁目标行，缺失时红色标记 + 替换动画
- 支持单步 / 自动播放 / 速度调节

### 技术要点
- `src/lib/cache.ts` 实现模拟引擎
- 状态必须是 immutable 的（每步返回新状态，支持回退）
- LRU 用计数器或栈实现
- 地址位数假设为 32 位

---

## 4. Pipeline Simulator — 流水线模拟器

### 功能
- 输入一段 RISC-V 汇编（5~20 条指令）
- 展示五级流水线执行时序图（IF / ID / EX / MEM / WB）
- 冒险检测与处理：
  - 数据冒险（RAW）：显示 forwarding 路径或 stall
  - 控制冒险（分支）：显示 flush 或预测
  - 结构冒险（可选）
- 可切换模式：无 forwarding / 有 forwarding / 分支预测

### 交互设计
- 时序图：横轴是时钟周期，纵轴是指令，每格填 IF/ID/EX/MEM/WB
- stall 用灰色气泡表示，flush 用红色叉表示
- forwarding 路径用箭头连线（从哪条指令的哪个阶段 → 到哪条指令的哪个阶段）
- 点击某个周期，下方显示该周期各阶段寄存器的值

### 技术要点
- `src/lib/pipeline.ts` 实现模拟引擎
- 先做依赖分析，再逐周期模拟
- forwarding 检测条件：EX/MEM hazard + MEM/WB hazard
- 分支预测只做最简单的 always-not-taken

---

## 5. Datapath Viewer — 数据通路动画

### 功能
- 展示单周期 RISC-V 数据通路图
- 输入一条指令，高亮数据流经的路径
- 显示各控制信号的值（ALUSrc, MemtoReg, RegWrite 等）
- 可选：展示多周期/流水线数据通路（进阶）

### 交互设计
- SVG 绘制完整数据通路（PC, Instruction Memory, Register File, ALU, Data Memory, Mux 等）
- 数据流动方向用动画箭头表示
- 激活的组件高亮，未使用的灰显
- 控制信号表格实时更新
- 可缩放 / 平移

### 技术要点
- 数据通路图是静态 SVG，动画通过改变 class/style 实现
- 控制信号由指令类型决定，维护一张真值表
- SVG 元素需要合理分组（每个组件一个 `<g>`），方便动画控制
- 这个模块工作量最大，SVG 设计建议参考教材（Patterson & Hennessy）的数据通路图

---

## 模块间不共享状态

每个模块有独立的 Zustand store，路由切换时旧模块状态保留（用户切回来能继续）。唯一共享的是通用 UI 组件和 hooks。
