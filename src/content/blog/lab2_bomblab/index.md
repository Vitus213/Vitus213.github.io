---
title: "CSAPP的lab2-bomblab"
description: "这是一场和计算机的邂逅."
date: "Jan 21 2024"
tags: ["学习笔记", "CSAPP"]
category: "CSAPP"
---


> 这个lab2真的做了很久,做的久,解析写的也久,还抽了部分打题的时间写的,这个lab是真的有意思

## 前置知识:

- [gdb使用指北](https://zhzvite.github.io/EATPOOP/gdb_use/2024/01/17/)
- 汇编语言的基本语法
- 链表
- 递归函数
- 耐得住诱惑

## phase_1

```assembly
   0x0000000000400ee0 <+0>:     sub    $0x8,%rsp
   0x0000000000400ee4 <+4>:     mov    $0x402400,%esi
   0x0000000000400ee9 <+9>:     callq  0x401338 <strings_not_equal>
   0x0000000000400eee <+14>:    test   %eax,%eax
   0x0000000000400ef0 <+16>:    je     0x400ef7 <phase_1+23>
   0x0000000000400ef2 <+18>:    callq  0x40143a <explode_bomb>
   0x0000000000400ef7 <+23>:    add    $0x8,%rsp
   0x0000000000400efb <+27>:    retq
```

phase_1算是热身的一关，主要就是要发现到**0x402400**这个特殊的内存地址，毕竟默认下第一个参数是%rdi，那么第二个参数就是%rsi,有充分的理由怀疑，是在<strings_not_equal>这个函数里面对%rdi和%rsi里面的内存的函数值进行了比较,然后去这个函数里面看一看,可以猜出来时相等的话返回值是0,(test %eax,%eax),所以直接连string函数都不用看了,直接把0x402400里面的值找出来就是答案

```assembly
p(char*)0x402400
```

当热身了.

<string_not_equal>

```assembly
40135c:	0f b6 03             	movzbl (%rbx),%eax    ; 将 %rbx 指向的字节加载到 %eax 中，并进行零扩展为32位
40135f:	84 c0                	test   %al,%al       ; 测试 %al 中的值是否为零
401361:	74 25                	je     401388 <strings_not_equal+0x50>  ; 如果为零（字符串结束），跳转到 401388

401363:	3a 45 00             	cmp    0x0(%rbp),%al   ; 比较地址为 (%rbp) 的字节与 %al 中的值
401366:	74 0a                	je     401372 <strings_not_equal+0x3a>  ; 如果相等，跳转到 401372

401368:	eb 25                	jmp    40138f <strings_not_equal+0x57>  ; 比较不匹配，跳转到 40138f

40136a:	3a 45 00             	cmp    0x0(%rbp),%al   ; 比较地址为 (%rbp) 的字节与 %al 中的值
40136d:	0f 1f 00             	nopl   (%rax)         ; No operation，占位符，可忽略
401370:	75 24                	jne    401396 <strings_not_equal+0x5e>  ; 如果不相等，跳转到 401396

401372:	48 83 c3 01          	add    $0x1,%rbx       ; 将 %rbx 增加 1（移动到第一个字符串的下一个字符）
401376:	48 83 c5 01          	add    $0x1,%rbp       ; 将 %rbp 增加 1（移动到第二个字符串的下一个字符）

40137a:	0f b6 03             	movzbl (%rbx),%eax    ; 将 %rbx 指向的字节加载到 %eax 中，并进行零扩展为32位
40137d:	84 c0                	test   %al,%al       ; 测试 %al 中的值是否为零
40137f:	75 e9                	jne    40136a <strings_not_equal+0x32>  ; 如果不为零，继续比较

401381:	ba 00 00 00 00       	mov    $0x0,%edx      ; 将 0 移动到 %edx（表示字符串相等）
401386:	eb 13                	jmp    40139b <strings_not_equal+0x63>  ; 跳转到 40139b（函数结束）

401388:	ba 00 00 00 00       	mov    $0x0,%edx      ; 将 0 移动到 %edx（表示字符串相等）
40138d:	eb 0c                	jmp    40139b <strings_not_equal+0x63>  ; 跳转到 40139b（函数结束）

40138f:	ba 01 00 00 00       	mov    $0x1,%edx      ; 将 1 移动到 %edx（表示字符串不相等）
401394:	eb 05                	jmp    40139b <strings_not_equal+0x63>  ; 跳转到 40139b（函数结束）

401396:	ba 01 00 00 00       	mov    $0x1,%edx      ; 将 1 移动到 %edx（表示字符串不相等）
40139b:	89 d0                	mov    %edx,%eax      ; 将 %edx 的值移动到 %eax（结果）
40139d:	5b                   	pop    %rbx           ; 从堆栈中弹出 %rbx
40139e:	5d                   	pop    %rbp           ; 从堆栈中弹出 %rbp
40139f:	41 5c                	pop    %r12           ; 从堆栈中弹出 %r12
4013a1:	c3                   	retq                  ; 从函数中返回

```

## phase_2

```assembly
0x0000000000400efc <+0>:     push   %rbp             ; 将 %rbp 寄存器的值推送到栈上
0x0000000000400efd <+1>:     push   %rbx             ; 将 %rbx 寄存器的值推送到栈上
0x0000000000400efe <+2>:     sub    $0x28,%rsp       ; 在栈上分配 0x28（40）字节的空间
0x0000000000400f02 <+6>:     mov    %rsp,%rsi         ; 将栈顶地址（%rsp）的值传递给 %rsi 寄存器
0x0000000000400f05 <+9>:     callq  0x40145c <read_six_numbers>  ; 调用 read_six_numbers 函数
0x0000000000400f0a <+14>:    cmpl   $0x1,(%rsp)      ; 比较栈上第一个元素的值与 1 是否相等
0x0000000000400f0e <+18>:    je     0x400f30 <phase_2+52>  ; 如果相等，跳转到 0x400f30 处
0x0000000000400f10 <+20>:    callq  0x40143a <explode_bomb>  ; 否则调用 explode_bomb 函数
0x0000000000400f15 <+25>:    jmp    0x400f30 <phase_2+52>  ; 跳转到 0x400f30 处

0x0000000000400f17 <+27>:    mov    -0x4(%rbx),%eax   ; 将 %rbx 寄存器指向的地址减 4的值 加载到 %eax,第二个参数,发现是加一倍
0x0000000000400f1a <+30>:    add    %eax,%eax         ; 将 %eax 寄存器的值加倍
0x0000000000400f1c <+32>:    cmp    %eax,(%rbx)      ; 比较 %eax 和 %rbx 寄存器指向的地址处的值
0x0000000000400f1e <+34>:    je     0x400f25 <phase_2+41>  ; 如果相等，跳转到 0x400f25 处
0x0000000000400f20 <+36>:    callq  0x40143a <explode_bomb>  ; 否则调用 explode_bomb 函数
0x0000000000400f25 <+41>:    add    $0x4,%rbx        ; 将 %rbx 寄存器的值增加 4
0x0000000000400f29 <+45>:    cmp    %rbp,%rbx        ; 比较 %rbp 和 %rbx 寄存器的值,比较是否是第六个数
0x0000000000400f2c <+48>:    jne    0x400f17 <phase_2+27>  ; 如果不相等，跳转到 0x400f17 处
0x0000000000400f2e <+50>:    jmp    0x400f3c <phase_2+64>  ; 否则跳转到 0x400f3c 处,

0x0000000000400f30 <+52>:    lea    0x4(%rsp),%rbx  ; 计算栈上地址 %rsp + 4，并将结果存储到 %rbx 寄存器
0x0000000000400f35 <+57>:    lea    0x18(%rsp),%rbp ; 计算栈上地址 %rsp + 0x18（24），并将结果存储到 %rbp 寄存器
0x0000000000400f3a <+62>:    jmp    0x400f17 <phase_2+27>  ; 跳转到 0x400f17 处
0x0000000000400f3c <+64>:    add    $0x28,%rsp       ; 在栈上释放 0x28（40）字节的空间
0x0000000000400f40 <+68>:    pop    %rbx             ; 弹出栈顶的 %rbx 寄存器的值
0x0000000000400f41 <+69>:    pop    %rbp             ; 弹出栈顶的 %rbp 寄存器的值
0x0000000000400f42 <+70>:    retq                    ; 从函数中返回

```

这是一个简单的倍增循环,需要知道stack的概念.

一开始能够简单的确定stack上的第一个元素与1是相等的

然后把第二个元素的地址加载到rbx上,因为里面存的是int,int是4个bit,所以每次加四,然后把前一个值加倍看他是否与当前值相等.

故六次循环后我们会发现每次循环能不断推断出第一个,第二个,直到第六个元素,为倍增关系

故答案: 1 2 4 8 16 32

代码混淆解释

```assembly
rbx=rsp+4  //lea 0x4(%rsp),%rbx
rbx=*(rsp+4) //mov 0x4(%rsp),%rbx
```

## phase_3

人工打了跳转标记

```assembly
0000000000400f43 <phase_3>:
  400f43:	48 83 ec 18          	sub    $0x18,%rsp
  400f47:	48 8d 4c 24 0c       	lea    0xc(%rsp),%rcx
  400f4c:	48 8d 54 24 08       	lea    0x8(%rsp),%rdx
  400f51:	be cf 25 40 00       	mov    $0x4025cf,%esi
  400f56:	b8 00 00 00 00       	mov    $0x0,%eax
  400f5b:	e8 90 fc ff ff       	callq  400bf0 <__isoc99_sscanf@plt>
  400f60:	83 f8 01             	cmp    $0x1,%eax
  400f63:	7f 05                	jg     .L1
  400f65:	e8 d0 04 00 00       	callq  40143a <explode_bomb>
  .L1
  400f6a:	83 7c 24 08 07       	cmpl   $0x7,0x8(%rsp)
  400f6f:	77 3c                	ja     .L2
  400f71:	8b 44 24 08          	mov    0x8(%rsp),%eax
  400f75:	ff 24 c5 70 24 40 00 	jmpq   *0x402470(,%rax,8)
  400f7c:	b8 cf 00 00 00       	mov    $0xcf,%eax
  400f81:	eb 3b                	jmp    .L3
  400f83:	b8 c3 02 00 00       	mov    $0x2c3,%eax
  400f88:	eb 34                	jmp    .L3
  400f8a:	b8 00 01 00 00       	mov    $0x100,%eax
  400f8f:	eb 2d                	jmp    .L3
  400f91:	b8 85 01 00 00       	mov    $0x185,%eax
  400f96:	eb 26                	jmp    .L3
  400f98:	b8 ce 00 00 00       	mov    $0xce,%eax
  400f9d:	eb 1f                	jmp    .L3
  400f9f:	b8 aa 02 00 00       	mov    $0x2aa,%eax
  400fa4:	eb 18                	jmp    .L3
  400fa6:	b8 47 01 00 00       	mov    $0x147,%eax
  400fab:	eb 11                	jmp    .L3
  .L2 
  400fad:	e8 88 04 00 00       	callq  40143a <explode_bomb>
  400fb2:	b8 00 00 00 00       	mov    $0x0,%eax
  400fb7:	eb 05                	jmp    .L3
  400fb9:	b8 37 01 00 00       	mov    $0x137,%eax
  .L3
  400fbe:	3b 44 24 0c          	cmp    0xc(%rsp),%eax
  400fc2:	74 05                	je    .L4
  400fc4:	e8 71 04 00 00       	callq  40143a <explode_bomb>
  .L4
  400fc9:	48 83 c4 18          	add    $0x18,%rsp
  400fcd:	c3                   	retq   

```

gpt解读

```assembly
0000000000400f43 <phase_3>:
  400f43:	48 83 ec 18          	sub    $0x18,%rsp          ; 为局部变量分配空间
  400f47:	48 8d 4c 24 0c       	lea    0xc(%rsp),%rcx     ; 将局部变量地址加载到寄存器 rcx 中
  400f4c:	48 8d 54 24 08       	lea    0x8(%rsp),%rdx     ; 将局部变量地址加载到寄存器 rdx 中
  400f51:	be cf 25 40 00       	mov    $0x4025cf,%esi      ; 将常量地址加载到寄存器 esi 中
  400f56:	b8 00 00 00 00       	mov    $0x0,%eax          ; 清零寄存器 eax
  400f5b:	e8 90 fc ff ff       	callq  400bf0 <__isoc99_sscanf@plt>  ; 调用 sscanf 函数，将输入解析为整数,
  400f60:	83 f8 01             	cmp    $0x1,%eax          ; 比较返回值与1
  400f63:	7f 05                	jg     .L1                ; 如果大于1，跳转到.L1
  400f65:	e8 d0 04 00 00       	callq  40143a <explode_bomb>  ; 否则，调用 explode_bomb 函数
  .L1
  400f6a:	83 7c 24 08 07       	cmpl   $0x7,0x8(%rsp)    ; 比较第二个局部变量和7,0x8(%rsp)要小于7(无符号类型)
  400f6f:	77 3c                	ja     .L2                ; 如果大于7，跳转到.L2
  400f71:	8b 44 24 08          	mov    0x8(%rsp),%eax    ; 将第二个局部变量加载到寄存器 eax 中
  400f75:	ff 24 c5 70 24 40 00 	jmpq   *0x402470(,%rax,8)  ; 通过跳转表间接调用不同的分支(%rax*8+*402470)
  400f7c:	b8 cf 00 00 00       	mov    $0xcf,%eax        ; 第一种分支1:
  400f81:	eb 3b                	jmp    .L3                ; 跳转到.L3
  400f83:	b8 c3 02 00 00       	mov    $0x2c3,%eax       ; 第二种分支:2
  400f88:	eb 34                	jmp    .L3                ; 跳转到.L3
  400f8a:	b8 00 01 00 00       	mov    $0x100,%eax       ; 第三种分支.输入为3
  400f8f:	eb 2d                	jmp    .L3                ; 跳转到.L3
  400f91:	b8 85 01 00 00       	mov    $0x185,%eax       ; 第四种分支:4
  400f96:	eb 26                	jmp    .L3                ; 跳转到.L3
  400f98:	b8 ce 00 00 00       	mov    $0xce,%eax        ; 第五种分支
  400f9d:	eb 1f                	jmp    .L3                ; 跳转到.L3
  400f9f:	b8 aa 02 00 00       	mov    $0x2aa,%eax       ; 第六种分支
  400fa4:	eb 18                	jmp    .L3                ; 跳转到.L3
  400fa6:	b8 47 01 00 00       	mov    $0x147,%eax       ; 第七种分支
  400fab:	eb 11                	jmp    .L3                ; 跳转到.L3
  .L2 
  400fad:	e8 88 04 00 00       	callq  40143a <explode_bomb>  ; 如果第二个局部变量大于7，调用 explode_bomb 函数
  400fb2:	b8 00 00 00 00       	mov    $0x0,%eax          ; 将返回值清零
  400fb7:	eb 05                	jmp    .L3                ; 跳转到.L3
  400fb9:	b8 37 01 00 00       	mov    $0x137,%eax       ; 第八种分支
  .L3
  400fbe:	3b 44 24 0c          	cmp    0xc(%rsp),%eax    ; 比较第三个局部变量和返回值 
  400fc2:	74 05                	je    .L4                ; 如果相等，跳转到.L4
  400fc4:	e8 71 04 00 00       	callq  40143a <explode_bomb>  ; 否则，调用 explode_bomb 函数
  .L4
  400fc9:	48 83 c4 18          	add    $0x18,%rsp         ; 函数结束，恢复栈空间
  400fcd:	c3                   	retq                      ; 返回

```

_isoc99_sscanf

```assembly
其转换了含有几个整数的字符串则返回值是几
```



- `0x0(%rsp)` 是栈顶位置，通常是函数的返回地址。
- `0x4(%rsp)` 是栈顶位置向下偏移4字节的位置，可能是一个局部变量或参数。

在这么多条分支里面找到一条能成立的就可以了

```assembly
jmpq   *0x402470(,%rax,8) 
```

这个函数是重点,这是跳转表间接实现switch操作,先确定输入的第一个变量在[0,7]之间,首先用gdb指令确定*0x402470的值,假定其会跳转到第一个分支,即令第一个变量等于0,刚好能跳转到第一个分支,那想要炸弹不爆炸只能%eax=207,所以其中一种答案就算出来了

答案 0 207



## phase_4

```assembly
   ;设第一个数字为a,第二个数字为b
   0x000000000040100c <+0>:     sub    $0x18,%rsp
   0x0000000000401010 <+4>:     lea    0xc(%rsp),%rcx
   0x0000000000401015 <+9>:     lea    0x8(%rsp),%rdx
   0x000000000040101a <+14>:    mov    $0x4025cf,%esi
   0x000000000040101f <+19>:    mov    $0x0,%eax
   0x0000000000401024 <+24>:    callq  0x400bf0 <__isoc99_sscanf@plt>;读入
   0x0000000000401029 <+29>:    cmp    $0x2,%eax;个数为2
   0x000000000040102c <+32>:    jne    0x401035 <phase_4+41>
   0x000000000040102e <+34>:    cmpl   $0xe,0x8(%rsp);比较a和0xe,a<=0xe=14
   0x0000000000401033 <+39>:    jbe    .L1
   0x0000000000401035 <+41>:    callq  0x40143a <explode_bomb>
 .L1
  0x000000000040103a <+46>:    mov    $0xe,%edx;往里面塞两个值edx,esi更新;
   0x000000000040103f <+51>:    mov    $0x0,%esi
   0x0000000000401044 <+56>:    mov    0x8(%rsp),%edi;edi=a
   0x0000000000401048 <+60>:    callq  0x400fce <func4>;调用func4
   0x000000000040104d <+65>:    test   %eax,%eax;还要看eax是否为0,即返回值是否为0,结合后文,返回值要0
   0x000000000040104f <+67>:    jne    .L2
   0x0000000000401051 <+69>:    cmpl   $0x0,0xc(%rsp);故b=0
   0x0000000000401056 <+74>:    je     0x40105d <phase_4+81>
   .L2
   0x0000000000401058 <+76>:    callq  0x40143a <explode_bomb>
   0x000000000040105d <+81>:    add    $0x18,%rsp
   0x0000000000401061 <+85>:    retq
```

现在我们要确定数字a,b,已知b=0,故要确定a的值

补充资料

```assembly
rdi：第一个参数
rsi：第二个参数
rdx：第三个参数
rcx：第四个参数
r8：第五个参数
r9：第六个参数
```

<func4>#目标是让rax即返回值是0

```assembly
;rdi=a;edx=e;esi=0
  .L3
  0x0000000000400fce <+0>:     sub    $0x8,%rsp
  # retval=rdx
   0x0000000000400fd2 <+4>:     mov    %edx,%eax  
   #retval-=rsi
   0x0000000000400fd4 <+6>:     sub    %esi,%eax
   0x0000000000400fd6 <+8>:     mov    %eax,%ecx
   0x0000000000400fd8 <+10>:    shr    $0x1f,%ecx#右移31位==>取符号位
   0x0000000000400fdb <+13>:    add    %ecx,%eax

   ---
   0x0000000000400fdd <+15>:    sar    %eax ;eax/=2;ret=ret>>1
   0x0000000000400fdf <+17>:    lea    (%rax,%rsi,1),%ecx;ecx=rax+rsi
   
   0x0000000000400fe2 <+20>:    cmp    %edi,%ecx;<=
   #if(ecx==edi)return 0
   #if(ecx<edi)func()
   0x0000000000400fe4 <+22>:    jle    .L1
   0x0000000000400fe6 <+24>:    lea    -0x1(%rcx),%edx
   0x0000000000400fe9 <+27>:    callq  0x400fce <func4>
   
   0x0000000000400fee <+32>:    add    %eax,%eax#倍增
   0x0000000000400ff0 <+34>:    jmp    .L2
  .L1
  0x0000000000400ff2 <+36>:    mov    $0x0,%eax;
  
   0x0000000000400ff7 <+41>:    cmp    %edi,%ecx
   0x0000000000400ff9 <+43>:    jge    .L2
   #esi=rcx+1
   0x0000000000400ffb <+45>:    lea    0x1(%rcx),%esi
   0x0000000000400ffe <+48>:    .L3;调回到开头,即为一次递归调用,观察其改变什么值就可以了
   ;即返回值ret后要再倍增+1
   0x0000000000401003 <+53>:    lea    0x1(%rax,%rax,1),%eax;2*%rax+1
   .L2
   0x0000000000401007 <+57>:    add    $0x8,%rsp
   0x000000000040100b <+61>:    retq
```

观察如何让rax=0;

把它按行翻译为c++代码,然后跑一遍就好了

```cpp
//int rdi=x,edx=a1,esi=a2,rcx=tmp
void func(int a1,int a2,int x)
//ret=a1
//ret-=a2
//int tmp=ret
//tmp>>31
tmp=(a1-a2)>>31;
ret=(a1-a2+tmp)>>1
tmp=ret+a2
if(tmp==x)return 0;
if(tmp<x){
ret=func(a1,tmp+1,x)
return 2*ret+1
}
if(tmp>x){
 ret=func(a1-1,a2,x)
 return 2*ret;
}
```



测试代码

```cpp
#include<iostream>
using namespace std;
//int rdi=x,edx=a1,esi=a2,rcx=tmp
//rdi=x;edx=e;esi=0
int  func(int a1,int a2,int x){
//ret=a1
//ret-=a2
//int tmp=ret
//tmp>>31
int tmp=(a1-a2)>>31;
int ret=(a1-a2+tmp)>>1;
tmp=ret+a2;
if(tmp==x)return 0;
if(tmp<x){
ret=func(a1,tmp+1,x);
return 2*ret+1;
}
if(tmp>x){
 ret=func(a1-1,a2,x);
 return 2*ret;
}
}
int main(){
    for(int i=1;i<=100;i++){
        cout<<func(14,0,i)<<endl;
    }
}
```

然后我们就能够很清楚的知道四个数字:0 1 3 7

所以答案有四种: 

- 0 0
- 1 0
- 3 0:
- 7 0





## phase_5

```assembly
0000000000401062 <phase_5>:  !# %fs:0x28 -> 3678849592732380416 这是一个保护堆栈的值
  401062:   53                      push   %rbx
  401063:   48 83 ec 20             sub    $0x20,%rsp   !# 开了32字节
  401067:   48 89 fb                mov    %rdi,%rbx    !# rbx 也是string 
  40106a:   64 48 8b 04 25 28 00    mov    %fs:0x28,%rax
  401071:   00 00 
  401073:   48 89 44 24 18          mov    %rax,0x18(%rsp) !# fs:0x28
  401078:   31 c0                   xor    %eax,%eax
  40107a:   e8 9c 02 00 00          callq  40131b <string_length> ;返回值是rax
  40107f:   83 f8 06                cmp    $0x6,%eax       !# string_length 为6就去 4010d2 执行，否则爆炸
  401082:   74 4e                   je     4010d2 <phase_5+0x70>
  401084:   e8 b1 03 00 00          callq  40143a <explode_bomb>
  401089:   eb 47                   jmp    4010d2 <phase_5+0x70>
                                            !# 最初rax=0, 循环6次， 每次处理第 rax个字符
  40108b:   0f b6 0c 03             movzbl (%rbx,%rax,1),%ecx  !# ecx = *rbx + *rax = *rdi + *rax 即第rax个字符
  40108f:   88 0c 24                mov    %cl,(%rsp)          !# 栈顶 = cl                     即第rax个字符
  401092:   48 8b 14 24             mov    (%rsp),%rdx         !# rdx = rsp = cl                即第rax个字符
  401096:   83 e2 0f                and    $0xf,%edx           !# edx &= 0xf, edx = cl 的低4位  即第rax个字符的低四位
  401099:   0f b6 92 b0 24 40 00    movzbl 0x4024b0(%rdx),%edx !# 0x4024b0[*rdx] -> edx
  4010a0:   88 54 04 10             mov    %dl,0x10(%rsp,%rax,1) !dl -> 0x10 + *rsp + *rax
  4010a4:   48 83 c0 01             add    $0x1,%rax             !# *rax ++
  4010a8:   48 83 f8 06             cmp    $0x6,%rax             !# rax != 0x6  即循环六次
  4010ac:   75 dd                   jne    40108b <phase_5+0x29>

  4010ae:   c6 44 24 16 00          movb   $0x0,0x16(%rsp)
  4010b3:   be 5e 24 40 00          mov    $0x40245e,%esi      !# "flyers"
  4010b8:   48 8d 7c 24 10          lea    0x10(%rsp),%rdi     !# 0x10(%rsp) ~ 0x15(%rsp)  和 "flyers"相等就跳转即成功了 否则爆炸
  4010bd:   e8 76 02 00 00          callq  401338 <strings_not_equal>
  4010c2:   85 c0                   test   %eax,%eax
  4010c4:   74 13                   je     4010d9 <phase_5+0x77>
  4010c6:   e8 6f 03 00 00          callq  40143a <explode_bomb>
  4010cb:   0f 1f 44 00 00          nopl   0x0(%rax,%rax,1)
  4010d0:   eb 07                   jmp    4010d9 <phase_5+0x77>
  
  4010d2:   b8 00 00 00 00          mov    $0x0,%eax
  4010d7:   eb b2                   jmp    40108b <phase_5+0x29>;跳回40108b

  4010d9:   48 8b 44 24 18          mov    0x18(%rsp),%rax
  4010de:   64 48 33 04 25 28 00    xor    %fs:0x28,%rax  !# 如果相等就跳转则说明没有溢出
  4010e5:   00 00 
  4010e7:   74 05                   je     4010ee <phase_5+0x8c>
  4010e9:   e8 42 fa ff ff          callq  400b30 <__stack_chk_fail@plt>
  4010ee:   48 83 c4 20             add    $0x20,%rsp
  4010f2:   5b                      pop    %rbx
  4010f3:   c3                      retq
```

啥逼玩意能通过偏移量达到flyers,取末尾四位,在来一遍这个地址

把这两个地址的所含字符串输出出来

```assembly
   mov    $0x40245e,%esi 
    movzbl 0x4024b0(%rdx),%edx
```

能找到这两个字符串

问题串:adui**ers**n**f**otvby**l**So you think you can stop the bomb with ctrl-c, do you?

转换后的串:flyers

```assembly
40108b:   0f b6 0c 03             movzbl (%rbx,%rax,1),%ecx  !# ecx = *rbx + *rax = *rdi + *rax 即第rax个字符
  40108f:   88 0c 24                mov    %cl,(%rsp)          !# 栈顶 = cl                     即第rax个字符
  401092:   48 8b 14 24             mov    (%rsp),%rdx         !# rdx = rsp = cl                即第rax个字符
  401096:   83 e2 0f                and    $0xf,%edx           !# edx &= 0xf, edx = cl 的低4位  即第rax个字符的低四位
```

即每次取输入字符串的一个字符,取其低四位,以此为索引,在问题串中找对应偏移量的字符,存入stack中,循环六次后,和转换后的串一比较,相等即通过

偏移公式:

```assembly
 movzbl 0x4024b0(%rdx),%edx;0x4024b0是问题串的首位置
  mov    %dl,0x10(%rsp,%rax,1);把它存起来,rax会递增,所以每个字符会一个一个存起来
```

然后对着ascII码表算一算

1. 9>>Y
2. 15>>o
3. 14>>n
4. 5>>e
5. 6>>f
6. 7>>g

答案Yonefg(其中一种)

## phase_6

设数串为a,b,c,d,e,f

```assembly
   0x00000000004010fc <+8>:     sub    $0x50,%rsp
   0x0000000000401100 <+12>:    mov    %rsp,%r13
   0x0000000000401103 <+15>:    mov    %rsp,%rsi
   0x0000000000401106 <+18>:    callq  0x40145c <read_six_numbers>
   0x000000000040110b <+23>:    mov    %rsp,%r14
   0x000000000040110e <+26>:    mov    $0x0,%r12d
   ;模块:即这六个数字,每个数只出现一遍且都出现
   0x0000000000401114 <+32>:    mov    %r13,%rbp;r13的地址对应的值是第一个数字
   0x0000000000401117 <+35>:    mov    0x0(%r13),%eax
   0x000000000040111b <+39>:    sub    $0x1,%eax
   0x000000000040111e <+42>:    cmp    $0x5,%eax;eax>=0x5,故a<=5
   0x0000000000401121 <+45>:    jbe    .L1;<=就不炸
   .L1;上面的一些代码保证了每一个数字都是在[1,6]之间的
   0x0000000000401128 <+52>:    add    $0x1,%r12d;r12d++
   0x000000000040112c <+56>:    cmp    $0x6,%r12d;跑六次循环
   0x0000000000401130 <+60>:    je     .L2
   0x0000000000401132 <+62>:    mov    %r12d,%ebx;ebx=r12d
   0x0000000000401135 <+65>:    movslq %ebx,%rax
   0x0000000000401138 <+68>:    mov    (%rsp,%rax,4),%eax,;rax作为变量,会依次取出每一个元素,应为rsp对着的就是6,那么+1*4就是5(测试样例为6,5,4,3,2,1),每次的循环内层循环的辞书是下降的
   0x000000000040113b <+71>:    cmp    %eax,0x0(%rbp)  ;0x0(%rbp)!=%eax,保证六个数字每个只出现一次
   0x000000000040113e <+74>:    jne    0x401145 <phase_6+81>
   0x0000000000401140 <+76>:    callq  0x40143a <explode_bomb>
   0x0000000000401145 <+81>:    add    $0x1,%ebx;ebx每次会加一,然后把值给到rax,故每次的eax是一个一个的从栈中取出元素
   0x0000000000401148 <+84>:    cmp    $0x5,%ebx;会循环六次;这是内层循环
   0x000000000040114b <+87>:    jle    0x401135 <phase_6+65>
   0x000000000040114d <+89>:    add    $0x4,%r13;r13类似于一个栈的指针,每次会往下指一个元素然后重头遍历一遍
   0x0000000000401151 <+93>:    jmp    0x401114 <phase_6+32>;这是外层循环
  .L2
  ;下一个模块:将每一个元素都变成7-int
  0x0000000000401153 <+95>:    lea    0x18(%rsp),%rsi;0,4,8,12,16,20,24
   0x0000000000401158 <+100>:   mov    %r14,%rax
   0x000000000040115b <+103>:   mov    $0x7,%ecx
   0x0000000000401160 <+108>:   mov    %ecx,%edx
   0x0000000000401162 <+110>:   sub    (%rax),%edx
   0x0000000000401164 <+112>:   mov    %edx,(%rax)
   0x0000000000401166 <+114>:   add    $0x4,%rax
   0x000000000040116a <+118>:   cmp    %rsi,%rax;一共会循环六次
   0x000000000040116d <+121>:   jne    0x401160 <phase_6+108>
   
   0x000000000040116f <+123>:   mov    $0x0,%esi
   0x0000000000401174 <+128>:   jmp    0x401197 <phase_6+163>
   ;这一段实现了把给定链表的数值倒序,根据权重把节点做一个移动
   0x0000000000401176 <+130>:   mov    0x8(%rdx),%rdx
   0x000000000040117a <+134>:   add    $0x1,%eax
   0x000000000040117d <+137>:   cmp    %ecx,%eax
   0x000000000040117f <+139>:   jne    0x401176 <phase_6+130>
   0x0000000000401181 <+141>:   jmp    0x401188 <phase_6+148>
   0x0000000000401183 <+143>:   mov    $0x6032d0,%edx;这个0x6032d0一看就很奇怪,咋突然冒出来,肯定是条件,然后发现她是链表头指针直接x/24 0x6032d0就列出所有链表了
   0x0000000000401188 <+148>:   mov    %rdx,0x20(%rsp,%rsi,2)搬运节点到另一个位置
   0x000000000040118d <+153>:   add    $0x4,%rsi
   0x0000000000401191 <+157>:   cmp    $0x18,%rsi
   0x0000000000401195 <+161>:   je     0x4011ab <phase_6+183>
   0x0000000000401197 <+163>:   mov    (%rsp,%rsi,1),%ecx;
   0x000000000040119a <+166>:   cmp    $0x1,%ecx
   0x000000000040119d <+169>:   jle    0x401183 <phase_6+143>
   0x000000000040119f <+171>:   mov    $0x1,%eax
   0x00000000004011a4 <+176>:   mov    $0x6032d0,%edx
   0x00000000004011a9 <+181>:   jmp    0x401176 <phase_6+130>
   ;对节点保存顺序的要求
   0x00000000004011ab <+183>:   mov    0x20(%rsp),%rbx
   0x00000000004011b0 <+188>:   lea    0x28(%rsp),%rax
   0x00000000004011b5 <+193>:   lea    0x50(%rsp),%rsi
   0x00000000004011ba <+198>:   mov    %rbx,%rcx
   0x00000000004011bd <+201>:   mov    (%rax),%rdx
   0x00000000004011c0 <+204>:   mov    %rdx,0x8(%rcx);rcx是下面的节点,rdx是上面的节点,rcx+8就是下面的节点的next地址,就是反转链表,其实不是反转,只是把链表根据权重搬迁过去后,把next重排序
 ;;  他妈的卧槽反转链表,妈的,有理由推断出要进行遍历
   ;struct node{
 ;  int val  //4
  ; int steps  //4
   ;node*next  //8
  ; }
   0x00000000004011c4 <+208>:   add    $0x8,%rax
   0x00000000004011c8 <+212>:   cmp    %rsi,%rax
   0x00000000004011cb <+215>:   je     0x4011d2 <phase_6+222>
   0x00000000004011cd <+217>:   mov    %rdx,%rcx
   0x00000000004011d0 <+220>:   jmp    0x4011bd <phase_6+201>
   ;实现了一个链表结构
   0x00000000004011d2 <+222>:   movq   $0x0,0x8(%rdx)
   0x00000000004011da <+230>:   mov    $0x5,%ebp
   0x00000000004011df <+235>:   mov    0x8(%rbx),%rax;rbx+8的值给到rax
   0x00000000004011e3 <+239>:   mov    (%rax),%eax
   0x00000000004011e5 <+241>:   cmp    %eax,(%rbx);所以是上面的数要小一点
   0x00000000004011e7 <+243>:   jge    0x4011ee <phase_6+250>;要大于等于,不然爆炸
   0x00000000004011e9 <+245>:   callq  0x40143a <explode_bomb>
   0x00000000004011ee <+250>:   mov    0x8(%rbx),%rbx;再往上找下一个数字
   0x00000000004011f2 <+254>:   sub    $0x1,%ebp
   0x00000000004011f5 <+257>:   jne    0x4011df <phase_6+235>
   0x00000000004011f7 <+259>:   add    $0x50,%rsp
```

找出了题目给的的数组(结构体的值)

```
(gdb) p 0x0000014c
$7 = 332   2
(gdb) p  0x000000a8
$8 = 168   1
(gdb) p  0x0000039c
$9 = 924   6
(gdb) p 0x000002b3
$10 = 691      5
(gdb) p 0x000001dd
$11 = 477   4
(gdb) p  0x000001bb
$12 = 443   3
(gdb)
```

小于等于:降序

得到数据: 3 4 5 6 1 2

然后再把它恢复到7-int之前则是 4 3 2 1 6 5

![](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071305646.jpg)

注意这个链表,发现他有三个值,一个是val,一个是order,一个是指向下一个的指针,例如node1.next==>node2

```cpp
struct node{
    int val;
    int order;
    int *next;
}
```



所以捋顺一遍思路

1. 通过双层循环,判断6个数是[1,6]中的,并且各不相同
2. 对六个数字取7的补,得到a1,b1,c1,d1,e1,f1
3. 再根据取补后的数字,搬迁链表,把他按一个新的顺序排列
4. 之后程序会对新的链表旅顺,让他能够遍历
5. 判断下面的数都大于上面的数

第3点是第五点的关键,我们知道链表一开始的排列,要把它安排成从上往下增大的形式,所以我们第一个要把924对应的node3丢过去,有规律可知,当a1=3时会找到node3,把他搬迁过去,以此类推知道了a1-f1的顺序分别是3 4 5 6 1 2

再取补就可得到原数组 4 3 2 1 6 5

## secret_phase

在网上看了看发现了,这是phase_defused的反汇编函数,然后看他有一个secret_phase的调用

```assembly
00000000004015c4 <phase_defused>:
  4015c4:	48 83 ec 78          	sub    $0x78,%rsp
  4015c8:	64 48 8b 04 25 28 00 	mov    %fs:0x28,%rax
  4015cf:	00 00 
  4015d1:	48 89 44 24 68       	mov    %rax,0x68(%rsp)
  4015d6:	31 c0                	xor    %eax,%eax
  4015d8:	83 3d 81 21 20 00 06 	cmpl   $0x6,0x202181(%rip)        # 603760 <num_input_strings>
  4015df:	75 5e                	jne    40163f <phase_defused+0x7b>
  4015e1:	4c 8d 44 24 10       	lea    0x10(%rsp),%r8
  4015e6:	48 8d 4c 24 0c       	lea    0xc(%rsp),%rcx
  4015eb:	48 8d 54 24 08       	lea    0x8(%rsp),%rdx
  4015f0:	be 19 26 40 00       	mov    $0x402619,%esi; "%d %d %s"
  4015f5:	bf 70 38 60 00       	mov    $0x603870,%edi;经过尝试发现和phase_4的寄存器地址时一样的
  4015fa:	e8 f1 f5 ff ff       	callq  400bf0 <__isoc99_sscanf@plt>
  4015ff:	83 f8 03             	cmp    $0x3,%eax
  401602:	75 31                	jne    401635 <phase_defused+0x71>
  #char *0x402622="DrEvil"
  401604:	be 22 26 40 00       	mov    $0x402622,%esi
  401609:	48 8d 7c 24 10       	lea    0x10(%rsp),%rdi
  40160e:	e8 25 fd ff ff       	callq  401338 <strings_not_equal>
  401613:	85 c0                	test   %eax,%eax
  401615:	75 1e                	jne    401635 <phase_defused+0x71>
  #Curses, you've found the secret phase!
  401617:	bf f8 24 40 00       	mov    $0x4024f8,%edi
  40161c:	e8 ef f4 ff ff       	callq  400b10 <puts@plt>
  #But finding it and solving it are quite different...
  401621:	bf 20 25 40 00       	mov    $0x402520,%edi
  401626:	e8 e5 f4 ff ff       	callq  400b10 <puts@plt>
  40162b:	b8 00 00 00 00       	mov    $0x0,%eax
  401630:	e8 0d fc ff ff       	callq  401242 <secret_phase>
  401635:	bf 58 25 40 00       	mov    $0x402558,%edi
  40163a:	e8 d1 f4 ff ff       	callq  400b10 <puts@plt>
  40163f:	48 8b 44 24 68       	mov    0x68(%rsp),%rax
  401644:	64 48 33 04 25 28 00 	xor    %fs:0x28,%rax
  40164b:	00 00 
  40164d:	74 05                	je     401654 <phase_defused+0x90>
  40164f:	e8 dc f4 ff ff       	callq  400b30 <__stack_chk_fail@plt>
  401654:	48 83 c4 78          	add    $0x78,%rsp
  401658:	c3                   	retq   
```

我们通过defuse_phase知道了secret的调用并且猜到了其中一个s密码,现在要找剩下的两个%d,然后发现他调用的寄存器时phase_4的,所以他们用的是同一个输入,我们直接在答案7 0 后面加一个 DrEvil ,这样就成功的进入这个secret_phase了  

secret_phase

```assembly
0000000000401242 <secret_phase>:
  401242:	53                   	push   %rbx
  401243:	e8 56 02 00 00       	callq  40149e <read_line>;调用函数
  401248:	ba 0a 00 00 00       	mov    $0xa,%edx
  40124d:	be 00 00 00 00       	mov    $0x0,%esi
  401252:	48 89 c7             	mov    %rax,%rdi
  401255:	e8 76 f9 ff ff       	callq  400bd0 <strtol@plt>
  ;
  40125a:	48 89 c3             	mov    %rax,%rbx
  40125d:	8d 40 ff             	lea    -0x1(%rax),%eax;eax--
  401260:	3d e8 03 00 00       	cmp    $0x3e8,%eax//eax的值 ; [1,1001]
  401265:	76 05                	jbe    40126c <secret_phase+0x2a>
  401267:	e8 ce 01 00 00       	callq  40143a <explode_bomb>
  
  40126c:	89 de                	mov    %ebx,%esi;esi中存了
  40126e:	bf f0 30 60 00       	mov    $0x6030f0,%edi;传一个值36进去
  401273:	e8 8c ff ff ff       	callq  401204 <fun7>
  401278:	83 f8 02             	cmp    $0x2,%eax
  40127b:	74 05                	je     401282 <secret_phase+0x40>
  40127d:	e8 b8 01 00 00       	callq  40143a <explode_bomb>
  401282:	bf 38 24 40 00       	mov    $0x402438,%edi
  401287:	e8 84 f8 ff ff       	callq  400b10 <puts@plt>
  40128c:	e8 33 03 00 00       	callq  4015c4 <phase_defused>
  401291:	5b                   	pop    %rbx
  401292:	c3                   	retq   
```

这里面strtol的函数原型是

```cpp
long int strtol(const char *str,char **endptr,int base)//分别是rdi,rsi,rdx
```

这里面edx=10,所以strtol会对一串字符串读取其中的前面一段连续数字,然后转化成十进制

在根据10,11行可得知eax内的值<=1000

分析可知,fun_7的返回值必须得是2才能通过

fun_7

```assembly
0000000000401204 <fun7>:
;esi=999     *(edi)=36
  401204:	48 83 ec 08          	sub    $0x8,%rsp
  #if(ptr==NULL)return -1
  401208:	48 85 ff             	test   %rdi,%rdi;所以rdi的值为0就结束了,不能为0
  40120b:	74 2b                	je     401238 <fun7+0x34>//不能跳转,跳转就爆了
  #int val =*ptr;
  # if(val-num<=0)goto fun7_28
  40120d:	8b 17                	mov    (%rdi),%edx
  40120f:	39 f2                	cmp    %esi,%edx
  401211:	7e 0d                	jle    401220 <fun7+0x1c>;递归调用
 # ptr=*(ptr+8)
  401213:	48 8b 7f 08          	mov    0x8(%rdi),%rdi
  # int retval=2*fun7(ptr,num)
  401217:	e8 e8 ff ff ff       	callq  401204 <fun7>
  40121c:	01 c0                	add    %eax,%eax
  # goto fun7_57   return retval
  40121e:	eb 1d                	jmp    40123d <fun7+0x39>
  ---
  fun7_28
  #retval =0
  401220:	b8 00 00 00 00       	mov    $0x0,%eax
  #if(val==num)goto fun7_57  return 0
  401225:	39 f2                	cmp    %esi,%edx
  401227:	74 14                	je     40123d <fun7+0x39>;相等就跳转
  # ptr=*(ptr+0x10);//ptr2
  401229:	48 8b 7f 10          	mov    0x10(%rdi),%rdi;
  # retval=2*fun7_(ptr,num)+1
  40122d:	e8 d2 ff ff ff       	callq  401204 <fun7>;递归调用
  401232:	8d 44 00 01          	lea    0x1(%rax,%rax,1),%eax
  #goto fun7_57
  401236:	eb 05                	jmp    40123d <fun7+0x39>
  401238:	b8 ff ff ff ff       	mov    $0xffffffff,%eax
  #fun7_57
  40123d:	48 83 c4 08          	add    $0x8,%rsp
  401241:	c3                   	retq   
  ;

```

我直接挑一个地方让esi的值等于edi的值不就好了,应为fun7函数里面esi的值不变,涉及到esi的只有比较,所以我找个地方,把rax整成2,然后找到那个时候的edi的值就行了



输入命令,发现是一个链表

```assembly
0x6030f0 <n1>:  0x0000000000000024      0x0000000000603110
0x603100 <n1+16>:       0x0000000000603130      0x0000000000000000
0x603110 <n21>: 0x0000000000000008      0x0000000000603190
0x603120 <n21+16>:      0x0000000000603150      0x0000000000000000
0x603130 <n22>: 0x0000000000000032      0x0000000000603170
0x603140 <n22+16>:      0x00000000006031b0      0x0000000000000000
0x603150 <n32>: 0x0000000000000016      0x0000000000603270
0x603160 <n32+16>:      0x0000000000603230      0x0000000000000000
0x603170 <n33>: 0x000000000000002d      0x00000000006031d0
0x603180 <n33+16>:      0x0000000000603290      0x0000000000000000
0x603190 <n31>: 0x0000000000000006      0x00000000006031f0
0x6031a0 <n31+16>:      0x0000000000603250      0x0000000000000000
0x6031b0 <n34>: 0x000000000000006b      0x0000000000603210
0x6031c0 <n34+16>:      0x00000000006032b0      0x0000000000000000
0x6031d0 <n45>: 0x0000000000000028      0x0000000000000000
0x6031e0 <n45+16>:      0x0000000000000000      0x0000000000000000
0x6031f0 <n41>: 0x0000000000000001      0x0000000000000000
0x603200 <n41+16>:      0x0000000000000000      0x0000000000000000
0x603210 <n47>: 0x0000000000000063      0x0000000000000000
0x603220 <n47+16>:      0x0000000000000000      0x0000000000000000
0x603230 <n44>: 0x0000000000000023      0x0000000000000000
0x603240 <n44+16>:      0x0000000000000000      0x0000000000000000
0x603250 <n42>: 0x0000000000000007      0x0000000000000000
0x603260 <n42+16>:      0x0000000000000000      0x0000000000000000
0x603270 <n43>: 0x0000000000000014      0x0000000000000000
0x603280 <n43+16>:      0x0000000000000000      0x0000000000000000
0x603290 <n46>: 0x000000000000002f      0x0000000000000000
0x6032a0 <n46+16>:      0x0000000000000000      0x0000000000000000
0x6032b0 <n48>: 0x00000000000003e9      0x0000000000000000
0x6032c0 <n48+16>:      0x0000000000000000      0x0000000000000000
```



大家通过代码的翻译,能梳理出以下几点

目的:这个递归是对链表的递归,每一个节点都有两个指针,所以每个节点都对应着另外两个节点,我们把这个节点根据指针的顺序画出一颗树,把指针1放左边,指针二放右边,得到如下一张图.

![](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071305660.jpg)

注:左下是指针一的节点,右边=下是指针2的节点

然后梳理一遍代码规则(val为节点的值,num为输入的数字)

1. 若val<num ,走右边的节点,return 时的返回值要*2+1
2. 若val>num,走左边的节点,return 时的返回值要*2
3. 若val=num,return 0

然后我们一步一步的令num=every val,把return的值算出来,确定是2的情况就好了

答案:0x14 和 0x16

## Success

![](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071308029.jpg)



