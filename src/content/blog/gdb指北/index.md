---
title: "gdb使用指北"
description: "通过学习bomblab而学习了一点gdb的用法"
date: "Jan 17 2024"
tags: ["gdb"]
category: "EATPOOP"
---


> 这里陈述的用法主要是为了反汇编和bomblab所服务(至少在目前是)

## gdb用法指北


GDB（GNU Debugger）是一个强大的调试工具，用于分析和调试程序。以下是一些GDB的基础命令：

**启动程序：**

```
gdb <executable>
```

启动GDB并加载要调试的可执行文件。

**设置断点：**

```
break <function_name>
```

在指定的函数内设置断点，使程序在该函数内停止执行。

```
break <line_number>
```

在指定行号上设置断点。

**运行程序：**

```
run
```

运行程序，直到遇到断点或程序结束。

**单步执行：**

```
stepi  
```

单步执行程序，进入函数内部。

```
next
```

单步执行程序，不进入函数内部，直到函数调用结束。

**完成当前函数**

```
finish
```

**查看变量的值：**

```
print <variable>
```

打印指定变量的值。

**查看堆栈帧：**

```
backtrace
```

打印当前调用堆栈的信息。

**切换到指定帧：**

```
frame <frame_number>
```

切换到指定的堆栈帧。

**继续执行程序：**

```
continue
```

从当前位置继续执行程序，直到遇到下一个断点或程序结束。

**查看符号表**

```
objdump -t bomb | less
```

**反编译炸弹**

```
objdump -d bomb > bomb.txt
```

**退出GDB：**

```
quit
```

退出GDB。

## 反汇编

1. **反汇编函数：**

   ```
   disassemble <function_name>
   ```

   显示指定函数的汇编代码。

2. **反汇编当前代码：**

   ```
   disassemble
   ```

   可以缩写为

   ```
   disas
   ```

   显示当前执行点附近的汇编代码。

3. **设置反汇编指令数目：**

   ```
   set disassembly-flavor <flavor>
   ```

   设置反汇编输出的指令数目。`<flavor>` 可以是 `att` 或 `intel`，表示使用AT&T或Intel语法。

4. **查看寄存器值：**

   ```
   info registers
   ```

   显示当前寄存器的值。

5. **在反汇编中设置断点：**

   ```
   break *<address>
   ```

   在指定地址处设置断点，可以是汇编指令的地址。

6. **查看内存内容：**

   ```
   x/<n>x <address>
   ```

   显示从指定地址开始的 `n` 个十六进制字节。例如，`x/4x $rsp` 显示栈顶部的四个字节。

7. **查看指令执行前后的内存变化：**

   ```
   display/i $pc
   ```

   每次程序停下来时，显示当前指令的反汇编，并在每步执行后继续显示。

8. **进入/离开汇编级别：**

   ```
   layout asm
   ```

   进入汇编级别的布局，显示源代码和汇编代码。可以使用 `Ctrl+X`，然后按 `2` 来切换到汇编级别。

9. **设置汇编级别布局显示选项：**

   ```
   set asm-options
   ```

   设置汇编级别布局的显示选项，例如，`set asm-options intel` 切换到Intel语法。