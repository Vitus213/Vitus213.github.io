---
title: "CSAPP的lab1-datalab"
description: "这是一场和计算机的邂逅."
date: "Dec 11 2023"
tags: ["学习笔记", "CSAPP"]
category: "CSAPP"
---


### 前置知识

- 位运算(对!,^,&,~,|,这些符号的准确理解)
- float的规格化,非规格化
- 熟练使用二进制分析
- 充分清楚逻辑右移和算术右移的区别,以及知道计算机的默认移动

### 做题策略

- 十分建议自己充分思考,画图举例子,建议从四个bits的位开始举例子
- 真的不行就看看视频讲解吧,在这里推荐一个b站up的csapp讲解(主要是由于本人不喜欢看文字)

> [【深入理解计算机系统 实验1 CSAPP】datalab + 环境搭建 data lab_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV183411k7VM/?spm_id_from=333.337.search-card.all.click&vd_source=48b7f9b11252cb5ee80182ee9f3745e2)

- 建议把书本认真的看完第一章,我是看到一半到浮点数的规格化就没耐心了,直接做题,导致有较大阻碍

### 代码分享和讲解

以下是写好的代码,里面有大量的注释便于理解(是在官方给的bit.c中补充函数的功能)

```c
 /*
 * CS:APP Data Lab
 *
 * <Please put your name and userid here>
 * zhzvite 2811215248@qq.com
 * bits.c - Source file with your solutions to the Lab.
 *          This is the file you will hand in to your instructor.
 *
 * WARNING: Do not include the <stdio.h> header; it confuses the dlc
 * compiler. You can still use printf for debugging without including
 * <stdio.h>, although you might get a compiler warning. In general,
 * it's not good practice to ignore compiler warnings, but in this
 * case it's OK.
 */

#if 0//lab的规则(类似与游戏规则)
/*
 * Instructions to Students:
 *
 * STEP 1: Read the following instructions carefully.
 */

You will provide your solution to the Data Lab by
editing the collection of functions in this source file.

INTEGER CODING RULES:
 
  Replace the "return" statement in each function with one
  or more lines of C code that implements the function. Your code 
  must conform to the following style:
 
  int Funct(arg1, arg2, ...) {
      /* brief description of how your implementation works */
      int var1 = Expr1;
      ...
      int varM = ExprM;

      varJ = ExprJ;
      ...
      varN = ExprN;
      return ExprR;
  }

  Each "Expr" is an expression using ONLY the following:
  1. Integer constants 0 through 255 (0xFF), inclusive. You are
      not allowed to use big constants such as 0xffffffff.
  2. Function arguments and local variables (no global variables).
  3. Unary integer operations ! ~
  4. Binary integer operations & ^ | + << >>
    
  Some of the problems restrict the set of allowed operators even further.
  Each "Expr" may consist of multiple operators. You are not restricted to
  one operator per line.

  You are expressly forbidden to:
  1. Use any control constructs such as if, do, while, for, switch, etc.
  2. Define or use any macros.
  3. Define any additional functions in this file.
  4. Call any functions.
  5. Use any other operations, such as &&, ||, -, or ?:
  6. Use any form of casting.
  7. Use any data type other than int.  This implies that you
     cannot use arrays, structs, or unions.

 
  You may assume that your machine:
  1. Uses 2s complement, 32-bit representations of integers.
  2. Performs right shifts arithmetically.
  3. Has unpredictable behavior when shifting if the shift amount
     is less than 0 or greater than 31.


EXAMPLES OF ACCEPTABLE CODING STYLE:
  /*
   * pow2plus1 - returns 2^x + 1, where 0 <= x <= 31
   */
  int pow2plus1(int x) {
     /* exploit ability of shifts to compute powers of 2 */
     return (1 << x) + 1;
  }

  /*
   * pow2plus4 - returns 2^x + 4, where 0 <= x <= 31
   */
  int pow2plus4(int x) {
     /* exploit ability of shifts to compute powers of 2 */
     int result = (1 << x);
     result += 4;
     return result;
  }

FLOATING POINT CODING RULES

For the problems that require you to implement floating-point operations,
the coding rules are less strict.  You are allowed to use looping and
conditional control.  You are allowed to use both ints and unsigneds.
You can use arbitrary integer and unsigned constants. You can use any arithmetic,
logical, or comparison operations on int or unsigned data.

You are expressly forbidden to:
  1. Define or use any macros.
  2. Define any additional functions in this file.
  3. Call any functions.
  4. Use any form of casting.
  5. Use any data type other than int or unsigned.  This means that you
     cannot use arrays, structs, or unions.
  6. Use any floating point data types, operations, or constants.


NOTES:
  1. Use the dlc (data lab checker) compiler (described in the handout) to 
     check the legality of your solutions.
  2. Each function has a maximum number of operations (integer, logical,
     or comparison) that you are allowed to use for your implementation
     of the function.  The max operator count is checked by dlc.
     Note that assignment ('=') is not counted; you may use as many of
     these as you want without penalty.penalty:罚款
  3. Use the btest test harness(马具,挽具) to check your functions for correctness.
  4. Use the BDD checker to formally verify your functions
  5. The maximum number of ops for each function is given in the
     header comment for each function. If there are any inconsistencies 
     between the maximum ops in the writeup and in this file, consider
     this file the authoritative source.

/*
 * STEP 2: Modify the following functions according the coding rules.
 * 
 *   IMPORTANT. TO AVOID GRADING SURPRISES:
 *   1. Use the dlc compiler to check that your solutions conform
 *      to the coding rules.
 *   2. Use the BDD checker to formally verify that your solutions produce 
 *      the correct answers.
 */

#endif//有一些生词,但是不影响阅读
// 1
/*
 * bitXor - x^y using only ~ and &
 *   Example: bitXor(4, 5) = 1
 *   Legal ops: ~ &
 *   Max ops: 14
 *   Rating: 1
 */
int bitXor(int x, int y)
{
  return (~(~x & ~y) & ~(x & y));
  /*
  讲解:~(~x&~y)把x,y中都为0的位置标记为0,其余都为1
  ~(x&y)则是把x,y中对应两个都为1的位置标记成0,其余都为1
  故两个相&就是异或的功能
  */
}
/*
 * tmin - return minimum two's complement integer
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 4
 *   Rating: 1
 */
int tmin(void)
{

  return (1 << 31);
  // 最小的二进制补码的整数,那就是最高位为1,其余位置全为0,int为4个字节,即为32个bit
}
/*
 * isTmax - returns 1 if x is the maximum, two's complement number,
 *     and 0 otherwise
 *   Legal ops: ! ~ & ^ | +
 *   Max ops: 10
 *   Rating: 1
 */
int isTmax(int x)
{
  return (!((~(x + 1)) ^ x)) & !!(x + 1);
  /*
   特判x=-1的情况,用两次!!,把他变为0或者1
   (~(x+1))^x)来验证x是否为最大值
   需要注意,判断a==b,在位运算下这样操作
   !(a^b),为1则相同,为0则不同
  */
}
/*
 * allOddBits - return 1 if all odd-numbered bits in word set to 1
 *   where bits are numbered from 0 (least significant) to 31 (most significant)
 *   Examples allOddBits(0xFFFFFFFD) = 0, allOddBits(0xAAAAAAAA) = 1
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 12
 *   Rating: 2
 */
int allOddBits(int x)
{ // 首先注意,0xAAAAAAAA这样的串都是从第0位开始,别搞错了
  // 本题思路是让x|0xAAAAAAAA再和x判断相不相等
  // 故a,b,c是为了通过移位造出0xAAAAAAAA,可以用这种办法继续造10个A,12个A,以此类推
  int a = 0xAA << 8;
  int b = a | 0xAA;
  int c = b << 16 | b;
  return !((x | c) ^ x);
}
/*
 * negate - return -x
 *   Example: negate(1) = -1.
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 5
 *   Rating: 2
 */
int negate(int x)
{
  return (~x) + 1; // 这里我是以四个bits为例子,随便列举了几个,就试出来了
}
// 3
/*
 * isAsciiDigit - return 1 if 0x30 <= x <= 0x39 (ASCII codes for characters '0' to '9')
 *   Example: isAsciiDigit(0x35) = 1.
 *            isAsciiDigit(0x3a) = 0.
 *            isAsciiDigit(0x05) = 0.
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 15
 *   Rating: 3
 */
int isAsciiDigit(int x)
{
  int cond1 = !((x >> 4) ^ 0x3);    // 检查除去前四位是不是满足条件,满足则为1
  int b = x & 0xf;              // 这样就是只保留后四位
  int cond2 = (b + ~0xA + 1) >> 31; // 要让b为0~9之间,则我们知道b-10<0,并且我们知道-x=~x+1,0xA=10,所以用b+~0xA+1再右移31位,判断负号
  return cond1 & cond2;//要满足(除去后四位其他位一样)和(后四位符合(0~9)-10<0)两种情况
}
/*
 * conditional - same as x ? y : z
 *   Example: conditional(2,4,5) = 4
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 16
 *   Rating: 3
 */
int conditional(int x, int y, int z)
{
  
  x = !!x;                   // 将x转化为bool类型,注意0取反全是0,1取反全是1,妙!
  x = ~x + 1;                //-(1)的补码全是1,-(0)的补码全是0,要巧妙运用这个性质,因为max ops限制在6
  return (x & y) | (~x & z); // 通过取反,来达成分支的效果,因为他们的取反是可以互相转化的,反正我是没想到
}
/*
 * isLessOrEqual - if x <= y  then return 1, else return 0
 *   Example: isLessOrEqual(4,5) = 1.
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 24
 *   Rating: 3
 */
int isLessOrEqual(int x, int y)
{
  int cond1 = !(x ^ y);      // 判断x和y相等
  int signx = (x >> 31) & 1; // 拿到x,y的符号,分别位signx和signy
  int signy = (y >> 31) & 1;
  // 接下来判断异号
  // x+y-
  int cond2 = !(!signx & signy); // signx=0,signy=1,cond2=0
  // x-y+
  int cond3 = (signx & !signy); // cond3=1
  // 接下来是同号的情况,同号相减不会溢出
  int res = ((x + (~y) + 1) >> 31) & 1; // res为1则x-y小于0

  return cond1 | (cond2 & (cond3 | res)); // cond2为1还要进行cond3或res的验证故用&
}
// 4
/*
 * logicalNeg - implement the ! operator, using all of
 *              the legal operators except !
 *   Examples: logicalNeg(3) = 0, logicalNeg(0) = 1
 *   Legal ops: ~ & ^ | + << >>
 *   Max ops: 12
 *   Rating: 4
 */
int logicalNeg(int x)
{
  int negx = ~x + 1;
  int a = (x | negx) >> 31;
  return a + 1;
  /*
   int a=~x+1;
   int b=(x^a)>>31;//这种不行是没考虑到溢出的情况.比如四位的数1000,他的取反加一还是1000
   return a+1;
   */
}
/* howManyBits - return the minimum number of bits required to represent x in
 *             two's complement
 *  Examples: howManyBits(12) = 5
 *            howManyBits(298) = 10
 *            howManyBits(-5) = 4
 *            howManyBits(0)  = 1
 *            howManyBits(-1) = 1
 *            howManyBits(0x80000000) = 32
 *  Legal ops: ! ~ & ^ | + << >>
 *  Max ops: 90
 *  Rating: 4
 */
int howManyBits(int x)
{
  // 思路高位有值的话就不能去掉,要找到最高位
  int iszero = !x;    // 判断是否为0,其实不用判断照样可以,因为按照后面的分法,如果是0则所有的bit都是0
  int flag = x >> 31; // 取出符号位
  int mask = ((!!x) << 31) >> 31;
  x = (flag & (~x)) | ((~flag) & x); // x>0时不变,x<0时把0都变成1
  int bit_16, bit_8, bit_4, bit_2, bit_1, bit_0;
  bit_16 = !((!!(x >> 16)) ^ 0x1) << 4; // 先把x规格化,判断每一个部分有没有值
  x >>= bit_16;
  bit_8 = !((!!(x >> 8)) ^ 0x1) << 3; // 先把x规格化,判断每一个部分有没有值
  x >>= bit_8;
  bit_4 = !((!!(x >> 4)) ^ 0x1) << 2; // 先把x规格化,判断每一个部分有没有值
  x >>= bit_4;
  bit_2 = !((!!(x >> 2)) ^ 0x1) << 1; // 先把x规格化,判断每一个部分有没有值
  x >>= bit_2;
  bit_1 = !((!!(x >> 1)) ^ 0x1); // 先把x规格化,判断每一个部分有没有值
  x >>= bit_1;
  bit_0 = x; // 最后的x只能是1或者0
  int res = bit_16 + bit_8 + bit_4 + bit_2 + bit_1 + bit_0 + 1;
  // return iszero|(mask&res);
  return res;
}
// float
/*
 * floatScale2 - Return bit-level equivalent of expression 2*f for
 *   floating point argument f.
 *   Both the argument and result are passed as unsigned int's, but
 *   they are to be interpreted as the bit-level representation of
 *   single-precision floating point values.
 *   When argument is NaN, return argument
 *   Legal ops: Any integer/unsigned operations incl. ||, &&. also if, while
 *   Max ops: 30
 *   Rating: 4
 */
unsigned floatScale2(unsigned uf)
{
  // 做到这道题,你就要去看看规格化和非规格化了,在我的笔记里面有
  // expr,s,frac
  unsigned s = (uf >> 31) & (0x1);     // 把s,expr,frac全部取出来
  unsigned expr = (uf >> 23) & (0xFF); // 把s,expr,frac全部取出来
  unsigned frac = (uf & 0x7FFFFF);     // 把s,expr,frac全部取出来
  if (expr == 0 && frac == 0)
    return uf; // 就是0,直接返回uf
  // 无穷大
  if (expr == 0xFF)
    return uf;
  // 非规格化
  if (expr == 0)
  {
    frac <<= 1; //*2
    return (s << 31) | frac;
  }
  // 规格化
  expr++;                                 // 规格化了,乘以2,毕竟隐藏的尾数是1
  return (s << 31) | (expr << 23) | frac; // 拼凑出厂
}
/*
 * floatFloat2Int - Return bit-level equivalent of expression (int) f
 *   for floating point argument f.
 *   Argument is passed as unsigned int, but
 *   it is to be interpreted as the bit-level representation of a
 *   single-precision floating point value.
 *   Anything out of range (including NaN and infinity) should return
 *   0x80000000u.
 *   Legal ops: Any integer/unsigned operations incl. ||, &&. also if, while
 *   Max ops: 30
 *   Rating: 4
 */
int floatFloat2Int(unsigned uf)
{//因为是将其转化为int型的整数,所以可以舍弃掉一些
  unsigned s = (uf >> 31) & 0x1;
  unsigned expr = (uf >> 23) & (0xFF);
  unsigned frac = (uf & 0x7FFFFF); // 取到每个位
  // 讨论无穷大
  if (expr == 0)
    return 0; // 当expr=0的时候,隐式位置位0,量级太小了,乘以2的-127次方更小
  if (expr == 0xff)
    return 1 << 31; // 无穷大,按照题目要求输出0x80000000u.
  // 考虑规格化的情况
  int E = expr - 127;      // E是阶码
  frac = frac | (1 << 23); // 有一个隐式的一,要给他加上

  if (E > 31)
    return 1 << 31; // 太大了,转成int就爆了

  else if (E < 0)
    return 0; // 太小了,frac移动完后转成int直接被舍掉了

  if (E >= 23)
    frac <<= (E - 23); // 移位,因为M就是二进制的表示方式,所以直接移动小数点
  else
    frac >>= (23 - E);

  if (!s)
    return frac;
  else
    return ~frac + 1; // 其中已经把E乘进去了
}
/*
 * floatPower2 - Return bit-level equivalent of the expression 2.0^x
 *   (2.0 raised to the power x) for any 32-bit integer x.
 *
 *   The unsigned value that is returned should have the identical bit
 *   representation as the single-precision floating-point number 2.0^x.
 *   If the result is too small to be represented as a denorm, return
 *   0. If too large, return +INF.
 *
 *   Legal ops: Any integer/unsigned operations incl. ||, &&. Also if, while
 *   Max ops: 30
 *   Rating: 4
 */
unsigned floatPower2(int x)
{
  // 分析规格化和非规格化
  if (x < -149)
    return 0; // expr最小也要是1,故得到的E最小为-126

  else if (x < -126)
  { // 多余的尾数,E只能提供2^(-126),剩下的靠尾数,尾数还能提供23位
    int a = x + 126;
    a = 23 + a;    // 计算出偏移的位数
    return 1 << a; // 以上两种情况是非规格化的情况,能表示的数字更小
  }
  else if (x <= 127)
  { // E的最大值是127,不能全为1
    // x=expr-bias;,一般bias是127
    int expr = x + 127;
    return expr << 23;
  }
  else
    return (0xFF) << 23;//即为+INF
}

```

