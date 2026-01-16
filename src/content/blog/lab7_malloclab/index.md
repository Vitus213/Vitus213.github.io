---
title: "CSAPP的lab7-malloclab"
description: "这是一场和计算机的邂逅."
date: "May 24 2024"
updated: "Jul 11 2024"
tags: ["学习笔记", "CSAPP"]
category: "CSAPP"
---


> 充满惰性，在一日又一日的刷视频，一日又一日的打游戏中虚度时间，时不时搞一些表面功夫来打发时间，将本该完成的工作一拖再拖，没有plan，也没有Execution ability，永远在编译，动态调整属于自己的ddl时间，这距离也就一天天拉远，反思！

# Lab前瞻 

在CSAPP的课本中第九章(虚拟内存）9.9.1开始提及malloc函数和free函数，虚拟内存还不甚了解。~~我都没怎么看这一章，是直接跳过来的emm~~，malloc不初始化它返回的内存

```c
void *malloc(size_t size);
```

在这里同时介绍了`sbrk`函数

```c
void *sbrk(intptr_t incr);
```

`sbrk` 函数通过将内核的 `brk` 指针增加`incr` 来扩展和收缩堆。如果成功，它就返回`brk` 的旧值，否则，它就返回 `-1`,并将 `errno` 设置为 `ENOMEM` 。如果 `incr` 为零，那么`sbrk` 就返回 `brk` 的当前值。用一个负的`incr`来调用`sbrk`是合法的，而且很巧妙，因为返回值 (`brk` 的旧值）指向距新堆顶向上 `abs(incr)` 字节处。如果`incr`是正值就往上涨不然就往下降，幅度是`abs(incr)`.

程序通过`free`函数来时想释放已分配的堆块.

```c
void free(void *ptr)
```

他不返回任何值且ptr必须指向已分配块的起始位置.不然就是未定义undefined.

malloc性能衡量指标:

- 最大化吞吐率

- 最大化利用率

  之所以会出现利用率这个点是因为你不知道什么时候会释放哪一个内存块,有可能总空闲空间足够但是空闲空间因为不合理的分配导致其分离无法被使用,即存在更加合理的分配方式使得内存被分配.

碎片:

Internal fragmentation:简单量化,其就是已分配块的大小和有效载荷大小之差的和

External fragmentation:难以被量化,因为其还要考虑未来的请求

需要解决问题:

- 空闲块组织free_list

- 放置:
  - first fit:在靠近链表起始处留下碎片
  - next fit:经过研究发现其比上不足比下也不足,所以一般情况下不用
  - best fit:需要耗费较多的时间,因为其要进行彻底的堆搜索,但是能做出更优秀的决策(在当前状态下)

- 分割

- 合并coalescing:即存在多个fragmentation靠在一起,可以合并成为一个大的块
  1. immediate coalescing

  每次都进行合并相邻块

  2. deferred coalescing

   分配失败的时候再选择合并,扫描整个堆

带边界标记进行合并:(boundary tag)

预处理:每个块的头部生成一个脚部,脚部为头部的副本,便于下面的子块往上快速的识别上面的块是否空闲.

**看不懂以下部分:空闲块,已分配,**

>幸运的是，有一种非常聪明的边界标记的优化方法，能够使得在已分配块中不再需要脚部 。回想一下，当我们试图在内存中合并当前块以及前面的块和后面的块时，只有在前面的块是空闲时，才会需要用到它的脚部。如果我们把前面块的已分配／空闲位存放在当前块中多出来的低位中，那么已分配的块就不需要脚部了，这样我们就可以将这个多出来的空间用作有效载荷了。不过请注意，空闲块仍然需要脚部 。

最小块大小可以在不同时刻被分配或者被释放,故最小块大小是max(最小分配块大小,最小空闲块大小)

# Lab预备

## **lab前置工作**

1. 对于M芯片的mac，在开始实验前需要修改`config.h`文件,修改这一行

```c
#define AVG_LIBC_THRUPUT      600E3  /* 600 Kops/sec */
```

将本来的600E3改成128E3,是由于mac上的运行环境和该实验的设定环境不一致，所以要进行一些调控否则实验分数不正常！**注意，这样子修改也只是勉强做做实验，知足！**

可以以三种方式组织malloclab 分别是数组结构，隐式空闲列表，显式空闲列表

2. 下载traces文件并且更改makefile的trace文件路径，[参考下文](https://blog.csdn.net/qq_42241839/article/details/123697377)

## lab结构

1. 数组结构：最低效，最直接emm

2. 隐式空闲链表（Implicit Free List）：把所有的块连接起来，而且是通过头部中的大小字段隐含地连接着的，每次都需要遍历所有块来找到合适的空闲块。

我们将基于隐式空闲链表，使用立即边界标记合并方式，从头至尾地讲述一个简单分配器的实现。最大的块大小为2^32^ =4GB。代码是 64 位干净的，即代码能不加修改地运行在 32 位 (gcc -m32) 或 64 位 (gcc -m64) 的进程中。

![](https://raw.githubusercontent.com/zhzvite/picgoroom/img/img/202406110118910.png)
一个块包含了头部，有效载荷，空闲块，和脚部（可能会有)，块大小即为整个块的大小，脚部是头部的副本，和头部一样，头部中分为块大小和填充位两个信息，

3. 显式空闲链表（Explicit Free Lists）：在空闲块中增加两个指针，分别指向链表中前一块和后一块，这样就不需要遍历所有块，只需要遍历空闲块。

## Lab解法

### 1.数组结构

以数组结构组织malloc，只用malloc 和 realloc函数，只需要开辟新空间，对于realloc，也只需要开辟新空间，简要判断size大小。

即不需要free空间，只需要使用malloc开辟新空间即可，对于内存调整大小，则直接开辟新空间然后复制数据即可，不用考虑新老空间大小的关系

**注意header存的size值表示的是包括header（footer），有效载荷，填充区块的总和，而ptr指向的是有效载荷的起始位置。**

数组结构代码：

这个代码是`mm.c`文件中给定的,仅作为加深对malloc的理解，明白工作流程而已。

```c
/*
 * mm-naive.c - The fastest, least memory-efficient malloc package.
 * 
 * In this naive approach, a block is allocated by simply incrementing
 * the brk pointer.  A block is pure payload. There are no headers or
 * footers.  Blocks are never coalesced or reused. Realloc is
 * implemented directly using mm_malloc and mm_free.
 *
 * NOTE TO STUDENTS: Replace this header comment with your own header
 * comment that gives a high level description of your solution.
 */
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <unistd.h>
#include <string.h>
#include "mm.h"
#include "memlib.h"

/*********************************************************
 * NOTE TO STUDENTS: Before you do anything else, please
 * provide your team information in the following struct.
 ********************************************************/
team_t team = {
    /* Team name */
    "Vite Fuck",
    /* First member's full name */
    "zhz_vite",
    /* First member's email address */
    "2811215248@qq.com",
    /* Second member's full name (leave blank if none) */
    "",
    /* Second member's email address (leave blank if none) */
    ""
};

/* single word (4) or double word (8) alignment */
#define ALIGNMENT 8

/* rounds up to the nearest multiple of ALIGNMENT */
#define ALIGN(size) (((size) + (ALIGNMENT-1)) & ~0x7)//会得到大于等于size的最小整数
//(size) + (ALIGNMENT-1)会得到最接近但不大于其alignment的倍数


#define SIZE_T_SIZE (ALIGN(sizeof(size_t)))

/* 
 * mm_init - initialize the malloc package.
 */
int mm_init(void)//数组结构不用初始化
{
    return 0;
}

/* 
 * mm_malloc - Allocate a block by incrementing the brk pointer.
 *     Always allocate a block whose size is a multiple of the alignment.
 */
void *mm_malloc(size_t size)
{
    int newsize = ALIGN(size + SIZE_T_SIZE);//首先将size进行字节对齐
    void *p = mem_sbrk(newsize);//开辟新空间
    if (p == (void *)-1)
	return NULL;
    else {
        *(size_t *)p = size;//填入数值
        return (void *)((char *)p + SIZE_T_SIZE);
    }
}

/*
 * mm_free - Freeing a block does nothing.
 */
void mm_free(void *ptr)
{  
}
/*
 * mm_realloc - Implemented simply in terms of mm_malloc and mm_free
 */
void *mm_realloc(void *ptr, size_t size)
{ 
  void *oldptr = ptr;
  void *newptr;
  size_t copySize;
// 使用 mm_malloc(size) 分配新的内存区域
newptr = mm_malloc(size);
if (newptr == NULL)
  return NULL;
// 从原始指针 oldptr 中获取复制的大小
copySize = *(size_t *)((char *)oldptr - SIZE_T_SIZE);
// 如果新分配的内存大小 size 小于复制大小 copySize，则选择较小的值
if (size < copySize)
  copySize = size;
// 使用 memcpy 函数将原始指针 oldptr 的数据复制到新分配的内存区域 newptr
memcpy(newptr, oldptr, copySize);
// 释放原始的内存区域 oldptr
mm_free(oldptr);
// 返回新分配的内存区域 newptr
return newptr;
}
```

### 2.1隐式空闲列表+First Fit

**基本函数定义**

在编程中为了避免出现多次对(void*)dp指针的强转和引用(void *)指针不能间接引用，所以为了减轻负担以及多次的简洁使用，故采取多个宏定义减轻后期编写函数会出现的各种各样的负担。

书上给的函数定义，之后的编程会为了方便补充宏定义

```c
/* $begin mallocmacros */
/* Basic constants and macros */
#define WSIZE       4       /* Word and header/footer size (bytes) */
#define DSIZE       8       /* Double word size (bytes) */
#define CHUNKSIZE  (1<<12)  /* Extend heap by this amount (bytes) */  
 
#define MAX(x, y) ((x) > (y)? (x) : (y))  
 
/* Pack a size and allocated bit into a word */
#define PACK(size, alloc)  ((size) | (alloc)) //打包头部的值，再用PUT（p,PACK(size,alloc)),之类的函数把他丢进header/footer
 
/* Read and write a word at address p */
#define GET(p)       (*(unsigned int *)(p)) 	//获得p指向的值           
#define PUT(p, val)  (*(unsigned int *)(p) = (val))    //写入val与p指向地址
 
/* Read the size and allocated fields from address p */
#define GET_SIZE(p)  (GET(p) & ~0x7)                   //由于双字对齐条件约束，故释放最低三位，即得到的unsigned int 值
#define GET_ALLOC(p) (GET(p) & 0x1)                    //有无分配
 
/* Given block ptr bp, compute address of its header and footer */
#define HDRP(bp)       ((char *)(bp) - WSIZE)                      //the address of the header
#define FTRP(bp)       ((char *)(bp) + GET_SIZE(HDRP(bp)) - DSIZE) //the address of the footer
 
/* Given block ptr bp, compute address of next and previous blocks */
#define NEXT_BLKP(bp)  ((char *)(bp) + GET_SIZE(((char *)(bp) - WSIZE))) //next blocks pointer
#define PREV_BLKP(bp)  ((char *)(bp) - GET_SIZE(((char *)(bp) - DSIZE))) //prev blocks pointer
 
```

**函数实现**

要实现的函数

1. int mm_init(void)extend_heap

初始化函数

```c
int mm_init(void)
{
    if  ((heap_listp = mem_sbrk(4*WSIZE)) == (void*)-1) 
    return -1;
    PUT(heap_listp,0);
   
    PUT(heap_listp+WSIZE,PACK(DSIZE,1));
    PUT(heap_listp+2*WSIZE,PACK(DSIZE,1));
    PUT(heap_listp+3*WSIZE,PACK(0,1));
    heap_listp+=2*WSIZE;//将heap_listp指针移到序言和结尾块之间

    if(extend_heap(CHUNKSIZE)==NULL)
    return -1;


    return 0;
}
```

2. void *mm_malloc(size_t size)

```c
void *mm_malloc(size_t size)
{
    void *bp=NULL;
    size_t extendsize;
    if(size==0)
    return NULL;
    if(size<=DSIZE){
        size=2*DSIZE;
    }
    else{
        size=ALIGN(size+DSIZE);
    }
    if(((bp=find_fit(size))!=NULL)){
        place((char* )bp,size);
        return bp;
    }
    extendsize = MAX(size,CHUNKSIZE); //扩展堆
    if ((bp = extend_heap (extendsize)) == NULL) 
    return NULL; 
    place(bp, size); 
    return bp;
}
```

3. void mm_free(void *ptr)

```c
void mm_free(void *ptr)
{
    size_t size =GET_SIZE(HDRP(ptr));
    PUT(HDRP(ptr),PACK(size,0));
    PUT(FTRP(ptr),PACK(size,0));
    coalesce(ptr);

}
```

3. void *mm_realloc(void *ptr, size_t size)

重新组织内存，分配空间，统一调用free和malloc

```c
void *mm_realloc(void *ptr, size_t size)
{
    void *oldptr=ptr;
    void *newptr;
    size_t new_size,old_size,extend_size;
    if(ptr==NULL)return mm_malloc(size);
    if(size==0){
        mm_free(ptr);
        return NULL;
    }
    new_size=ALIGN(size+DSIZE);
    old_size=GET_SIZE(HDRP(ptr));
if(old_size>=new_size){//只需要在原有空间上释放后面的一部分空间就可以了，其实可以直接用place语句替换ifelse
    if(old_size-new_size>=MINBLOCK)
    {
        place(oldptr,new_size);
    return oldptr;  
    }
    else {
        return oldptr;

    }
}
//太小了，只能释放内存，重新找一块新的
else {
    if((newptr=find_fit(new_size))==NULL){
        extend_size=MAX(new_size,CHUNKSIZE);
        if((newptr=extend_heap(extend_size))==NULL)
        return NULL;
    }
    place(newptr,new_size);
    memcpy(newptr,oldptr,old_size-2*WSIZE);
    mm_free(oldptr);
    return newptr;

}
}
```

5. static void *extend_heap(size_t words);

扩展堆函数

```c
static void *extend_heap(size_t words){//扩展堆函数,开一个新的空闲块
    void *bp;//
    size_t size;
    size=ALIGN(words);//填充
   if( (long)(bp=mem_sbrk(size))==-1)//注意这个（void*)
   return NULL;
    PUT(HDRP(bp),PACK(size,0));//
    PUT(FTRP(bp),PACK(size,0));
    PUT(HDRP(NEXT_BLKP(bp)),PACK(0,1));//创建一个新的结尾块
    return coalesce(bp);//开完后看能不能和前面的合并
}
```

6. static void *find_fit(size_t size);*

找空余空间

```c
static void* find_fit(size_t size){//在空闲块中看能否找到一个>=size的块，first fit
    void *ffbp;
    for(ffbp=heap_listp;GET_SIZE(HDRP(ffbp))>0;ffbp=NEXT_BLKP(ffbp)){
        if(GET_ALLOC(HDRP(ffbp))==0&&GET_SIZE(HDRP(ffbp))>=size)
        return ffbp;
    }
    return NULL;

}
```

7. *static void place(char*bp,size_t size);

分割函数

```c
static  void  place(char *bp,size_t size){
    size_t asize =GET_SIZE(HDRP(bp));
    size_t resize =asize-size;
    if(resize>=MINBLOCK){
        PUT(HDRP(bp),PACK(size,1));
        PUT(FTRP(bp),PACK(size,1));
        bp=NEXT_BLKP(bp);
        PUT(HDRP(bp),PACK(resize,0));//后部分置为空
        PUT(FTRP(bp),PACK(resize,0));    
    }
    else {
        PUT(HDRP(bp),PACK(asize,1));
        PUT(FTRP(bp),PACK(asize,1));
    }

}
```

8. static void *coalesce(void*bp);

合并空余空间函数

```c
static void *coalesce(void *bp){
    size_t prev_alloc=GET_ALLOC(FTRP(PREV_BLKP(bp)));
    size_t next_alloc=GET_ALLOC(HDRP(NEXT_BLKP(bp)));
    size_t size =GET_SIZE(HDRP(bp));
    if(prev_alloc && next_alloc)
    return bp;

    else if(prev_alloc ==1 &&next_alloc==0){//后面的块是空闲块，则指针不变，合并后面的块
        size+=GET_SIZE(HDRP(NEXT_BLKP(bp)));//
      
    }
    else if(next_alloc==1 && prev_alloc==0){//前面的块空闲
        size+=GET_SIZE(FTRP(PREV_BLKP(bp)));
        bp=PREV_BLKP(bp);

    }
    else{
        size+=GET_SIZE(FTRP(PREV_BLKP(bp)));
        size+=GET_SIZE(HDRP(NEXT_BLKP(bp)));
        bp=PREV_BLKP(bp);

    }
    PUT(HDRP(bp),PACK(size,0));
    PUT(FTRP(bp),PACK(size,0));
     return bp;
}
```



**完整代码：**

```c
/*
 * mm-naive.c - The fastest, least memory-efficient malloc package.
 * 
 * In this naive approach, a block is allocated by simply incrementing
 * the brk pointer.  A block is pure payload. There are no headers or
 * footers.  Blocks are never coalesced or reused. Realloc is
 * implemented directly using mm_malloc and mm_free.
 *
 * NOTE TO STUDENTS: Replace this header comment with your own header
 * comment that gives a high level description of your solution.
 */
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <unistd.h>
#include <string.h>

#include "mm.h"
#include "memlib.h"

/*********************************************************
 * NOTE TO STUDENTS: Before you do anything else, please
 * provide your team information in the following struct.
 ********************************************************/
team_t team = {
    /* Team name */
    "Vite Fuck",
    /* First member's full name */
    "zhz_vite",
    /* First member's email address */
    "2811215248@qq.com",
    /* Second member's full name (leave blank if none) */
    "",
    /* Second member's email address (leave blank if none) */
    ""
};

/* single word (4) or double word (8) alignment */
#define ALIGNMENT 8

/* rounds up to the nearest multiple of ALIGNMENT */
#define ALIGN(size) (((size) + (ALIGNMENT-1)) & ~0x7)//会得到大于等于size的最小整数
//(size) + (ALIGNMENT-1)会得到最接近但不大于其alignment的倍数


#define SIZE_T_SIZE (ALIGN(sizeof(size_t)))
/* $begin mallocmacros */
/* Basic constants and macros */
#define WSIZE       4       /* Word and header/footer size (bytes) */
#define DSIZE       8       /* Double word size (bytes) */
#define CHUNKSIZE  (1<<12)  /* Extend heap by this amount (bytes) */  
 
#define MAX(x, y) ((x) > (y)? (x) : (y))  
 
/* Pack a size and allocated bit into a word */
#define PACK(size, alloc)  ((size) | (alloc)) //打包头部的值，再用PUT（p,PACK(size,alloc)),之类的函数把他丢进header/footer
 
/* Read and write a word at address p */
#define GET(p)       (*(unsigned int *)(p)) 	//获得p指向的值           
#define PUT(p, val)  (*(unsigned int *)(p) = (val))    //写入val与p指向地址
 
/* Read the size and allocated fields from address p */
#define GET_SIZE(p)  (GET(p) & ~0x7)                   //由于双字对齐条件约束，故释放最低三位，即得到的unsigned int 值为多少倍的DSIZE
#define GET_ALLOC(p) (GET(p) & 0x1)                    //有无分配
 
/* Given block ptr bp, compute address of its header and footer */
#define HDRP(bp)       ((char *)(bp) - WSIZE)                      //the address of the header
#define FTRP(bp)       ((char *)(bp) + GET_SIZE(HDRP(bp)) - DSIZE) //the address of the footer
 
/* Given block ptr bp, compute address of next and previous blocks */
#define NEXT_BLKP(bp)  ((char *)(bp) + GET_SIZE(((char *)(bp) - WSIZE))) //next blocks pointer
#define PREV_BLKP(bp)  ((char *)(bp) - GET_SIZE(((char *)(bp) - DSIZE))) //prev blocks pointer
 
#define MINBLOCK (DSIZE+2*WSIZE)
 static void *heap_listp;

 static void *extend_heap(size_t words);
 static void *find_fit(size_t size);
 static void place(char*bp,size_t size);

 static void *coalesce(void*bp);

/* 
 * mm_init - initialize the malloc package.
 */
int mm_init(void)
{
    if  ((heap_listp = mem_sbrk(4*WSIZE)) == (void*)-1) 
    return -1;
    PUT(heap_listp,0);
   
    PUT(heap_listp+WSIZE,PACK(DSIZE,1));
    PUT(heap_listp+2*WSIZE,PACK(DSIZE,1));
    PUT(heap_listp+3*WSIZE,PACK(0,1));
    heap_listp+=2*WSIZE;//将heap_listp指针移到序言和结尾块之间

    if(extend_heap(CHUNKSIZE)==NULL)
    return -1;


    return 0;
}
static void *extend_heap(size_t words){//扩展堆函数,开一个新的空闲块
    void *bp;//
    size_t size;
    size=ALIGN(words);//填充
   if( (long)(bp=mem_sbrk(size))==-1)//注意这个（void*)
   return NULL;
    PUT(HDRP(bp),PACK(size,0));//
    PUT(FTRP(bp),PACK(size,0));
    PUT(HDRP(NEXT_BLKP(bp)),PACK(0,1));//创建一个新的结尾块
    return coalesce(bp);//开完后看能不能和前面的合并

}

static void* find_fit(size_t size){//在空闲块中看能否找到一个>=size的块，first fit
    void *ffbp;
    for(ffbp=heap_listp;GET_SIZE(HDRP(ffbp))>0;ffbp=NEXT_BLKP(ffbp)){
        if(GET_ALLOC(HDRP(ffbp))==0&&GET_SIZE(HDRP(ffbp))>=size)
        return ffbp;
    }
    return NULL;

}
static  void  place(char *bp,size_t size){
    size_t asize =GET_SIZE(HDRP(bp));
    size_t resize =asize-size;
    if(resize>=MINBLOCK){
        PUT(HDRP(bp),PACK(size,1));
        PUT(FTRP(bp),PACK(size,1));
        bp=NEXT_BLKP(bp);
        PUT(HDRP(bp),PACK(resize,0));//后部分置为空
        PUT(FTRP(bp),PACK(resize,0));    
    }
    else {
        PUT(HDRP(bp),PACK(asize,1));
        PUT(FTRP(bp),PACK(asize,1));
    }

}
/* 
 * mm_malloc - Allocate a block by incrementing the brk pointer.
 *     Always allocate a block whose size is a multiple of the alignment.
 */
void *mm_malloc(size_t size)
{
    void *bp=NULL;
    size_t extendsize;
    if(size==0)
    return NULL;
    if(size<=DSIZE){
        size=2*DSIZE;
    }
    else{
        size=ALIGN(size+DSIZE);
    }
    if(((bp=find_fit(size))!=NULL)){
        place((char* )bp,size);
        return bp;
    }
    extendsize = MAX(size,CHUNKSIZE); //扩展堆
    if ((bp = extend_heap (extendsize)) == NULL) 
    return NULL; 
    place(bp, size); 
    return bp;
}

/*
 * mm_free - Freeing a block does nothing.
 */

void mm_free(void *ptr)
{
    size_t size =GET_SIZE(HDRP(ptr));
    PUT(HDRP(ptr),PACK(size,0));
    PUT(FTRP(ptr),PACK(size,0));
    coalesce(ptr);

}
static void *coalesce(void *bp){
    size_t prev_alloc=GET_ALLOC(FTRP(PREV_BLKP(bp)));
    size_t next_alloc=GET_ALLOC(HDRP(NEXT_BLKP(bp)));
    size_t size =GET_SIZE(HDRP(bp));
    if(prev_alloc && next_alloc)
    return bp;

    else if(prev_alloc ==1 &&next_alloc==0){//后面的块是空闲块，则指针不变，合并后面的块
        size+=GET_SIZE(HDRP(NEXT_BLKP(bp)));//
        
    
    }
    else if(next_alloc==1 && prev_alloc==0){//前面的块空闲
        size+=GET_SIZE(FTRP(PREV_BLKP(bp)));
        bp=PREV_BLKP(bp);

    }
    else{
        size+=GET_SIZE(FTRP(PREV_BLKP(bp)));
        size+=GET_SIZE(HDRP(NEXT_BLKP(bp)));
        bp=PREV_BLKP(bp);

    }
    PUT(HDRP(bp),PACK(size,0));
    PUT(FTRP(bp),PACK(size,0));

     return bp;

}
/*
 * mm_realloc - Implemented simply in terms of mm_malloc and mm_free
 */
void *mm_realloc(void *ptr, size_t size)
{
    void *oldptr=ptr;
    void *newptr;
    size_t new_size,old_size,extend_size;
    if(ptr==NULL)return mm_malloc(size);
    if(size==0){
        mm_free(ptr);
        return NULL;
    }
    new_size=ALIGN(size+DSIZE);
    old_size=GET_SIZE(HDRP(ptr));
if(old_size>=new_size){//只需要在原有空间上释放后面的一部分空间就可以了，其实可以直接用place语句替换ifelse
    if(old_size-new_size>=MINBLOCK)
    {
        place(oldptr,new_size);
    return oldptr;  
    }
    else {
        return oldptr;

    }
}
//太小了，只能释放内存，重新找一块新的
else {
    if((newptr=find_fit(new_size))==NULL){
        extend_size=MAX(new_size,CHUNKSIZE);
        if((newptr=extend_heap(extend_size))==NULL)
        return NULL;
    }
    place(newptr,new_size);
    memcpy(newptr,oldptr,old_size-2*WSIZE);
    mm_free(oldptr);
    return newptr;

}
}

```

得分如下：

![image-20240711060851381](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202407110613115.png)

### 2.2优化next fit

首次适配：

优点：趋向于将大的空闲块保留在链表的后面
缺点：趋向于在靠近链表起始处留下小空闲块的“碎片”，增加了对较大块的搜索时间。
下一次适配：

优点：上一次在某个空闲块中发现匹配，下一次也有可能（倾向于）在这个剩余块中发现匹配。
缺点：研究表明，下一次适配的内存利用率要比首次适配低得多。
针对得到的两次分数，可以明显的看到下一次适配的吞吐率比首次适配高很多，这方面next fit优势明显，但内存利用率要低。

优化方向：

first--> next fit(即从上一次匹配的地方先寻找)

修改find_fit函数和colaesce函数即可

修改colaesce函数是为了防止出现下一次找上一次的指针不存在这种情况。所以会在`colaesce`函数中更新`next——fitp`.

```c
static void *next_fitp;//静态变量，在int中赋初值
static void * find_fit(size_t size){ 
char *lastp;
   next_fitp=NEXT_BLKP(next_fitp);
   lastp=next_fitp;
    for (;GET_SIZE(HDRP(next_fitp)) > 0; next_fitp = NEXT_BLKP(next_fitp)) {
        if (!GET_ALLOC(HDRP(next_fitp)) && (GET_SIZE(HDRP(next_fitp)) >= size)) {
            return next_fitp;
        }
    }
    next_fitp = NEXT_BLKP(heap_listp);
    for (;next_fitp != lastp; next_fitp = NEXT_BLKP(next_fitp)) {
        if (!GET_ALLOC(HDRP(next_fitp)) && (GET_SIZE(HDRP(next_fitp)) >= size)) {
            return next_fitp;
        }
    }
    return NULL;

}
static void *coalesce(void *bp){
    size_t prev_alloc=GET_ALLOC(FTRP(PREV_BLKP(bp)));
    size_t next_alloc=GET_ALLOC(HDRP(NEXT_BLKP(bp)));
    size_t size =GET_SIZE(HDRP(bp));
    if(prev_alloc && next_alloc)
    return bp;

    else if(prev_alloc ==1 &&next_alloc==0){//后面的块是空闲块，则指针不变，合并后面的块
        size+=GET_SIZE(HDRP(NEXT_BLKP(bp)));//
    }
    else if(next_alloc==1 && prev_alloc==0){//前面的块空闲
        size+=GET_SIZE(FTRP(PREV_BLKP(bp)));
        if(bp==next_fitp)
        next_fitp=PREV_BLKP(bp);
        bp=PREV_BLKP(bp);
    }
    else{
        size+=GET_SIZE(FTRP(PREV_BLKP(bp)));
        size+=GET_SIZE(HDRP(NEXT_BLKP(bp)));
         if(bp==next_fitp)
        next_fitp=PREV_BLKP(bp);
        bp=PREV_BLKP(bp);

    }
    PUT(HDRP(bp),PACK(size,0));
    PUT(FTRP(bp),PACK(size,0));

     return bp;

}
```



优化得分为：

![image-20240711033445368](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202407110613160.png)

### 3.1显式空闲列表+LIFO

一种方法是用后进先出 (LIFO) 的顺序维护链表， 将新释放的块放置在链表的开始处。 使用`LIFO`的顺序和首次适配的放置策略,分配器会最先检查最近使用过的块。在这种情况下，释放一个块可以在常数时间内完成。如果使用了边界标记，那么合并也可以在常数时间内完成。

另一种方法是按照地址顺序来维护链表，其中链表中每个块的地址都小于它后继的地址。在这种情况下，释放一个块需要线性时间的搜索来定位合适的前驱。 平衡点在于，按照地址排序的首次适配比 按 LIFO 排序的首次适配有更高的内存利用率，接近最佳适配的利用率。 一般而言，显式链表的缺点是空闲块必须足够大，以包含所有需要的指针，以及头部和可能的脚部。这就导致了更大的最小块大小,也潜在地提高了内部碎片的程度。

仅仅需要在隐式空闲列表的基础上添加一个freelist，即添加前驱和后驱，可以套用双向链表的知识模拟malloc。

```c
/*
 * mm-naive.c - The fastest, least memory-efficient malloc package.
 * 
 * In this naive approach, a block is allocated by simply incrementing
 * the brk pointer.  A block is pure payload. There are no headers or
 * footers.  Blocks are never coalesced or reused. Realloc is
 * implemented directly using mm_malloc and mm_free.
 *
 * NOTE TO STUDENTS: Replace this header comment with your own header
 * comment that gives a high level description of your solution.
 */
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <unistd.h>
#include <string.h>

#include "mm.h"
#include "memlib.h"

/*********************************************************
 * NOTE TO STUDENTS: Before you do anything else, please
 * provide your team information in the following struct.
 ********************************************************/
team_t team = {
    /* Team name */
    "Vite Fuck",
    /* First member's full name */
    "zhz_vite",
    /* First member's email address */
    "2811215248@qq.com",
    /* Second member's full name (leave blank if none) */
    "",
    /* Second member's email address (leave blank if none) */
    ""
};

/* single word (4) or double word (8) alignment */
#define ALIGNMENT 8
/* rounds up to the nearest multiple of ALIGNMENT */
#define ALIGN(size) (((size) + (ALIGNMENT-1)) & ~0x7)//会得到大于等于size的最小整数
//(size) + (ALIGNMENT-1)会得到最接近但不大于其alignment的倍数

#define SIZE_T_SIZE (ALIGN(sizeof(size_t)))
/* $begin mallocmacros */
/* Basic constants and macros */
#define WSIZE       4       /* Word and header/footer size (bytes) */
#define DSIZE       8       /* Double word size (bytes) */
#define CHUNKSIZE  (1<<12)  /* Extend heap by this amount (bytes) */  
 
#define MAX(x, y) ((x) > (y)? (x) : (y))  
 
/* Pack a size and allocated bit into a word */
#define PACK(size, alloc)  ((size) | (alloc)) //打包头部的值，再用PUT（p,PACK(size,alloc)),之类的函数把他丢进header/footer
 
/* Read and write a word at address p */
#define GET(p)       (*(unsigned int *)(p)) 	//获得p指向的值           
#define PUT(p, val)  (*(unsigned int *)(p) = (val))    //写入val与p指向地址

#define GETADDR(p)         (*(unsigned int **)(p))   //读地址p处的一个指针
#define PUTADDR(p,addr)   (*(unsigned int **)(p) = (unsigned int *)(addr))  //向地址p处写一个指针
/* Read the size and allocated fields from address p */
#define GET_SIZE(p)  (GET(p) & ~0x7)                   //由于双字对齐条件约束，故释放最低三位，即得到的unsigned int 值为多少倍的DSIZE
#define GET_ALLOC(p) (GET(p) & 0x1)                    //有无分配
 
/* Given block ptr bp, compute address of its header and footer */
#define HDRP(bp)       ((char *)(bp) - WSIZE)                      //the address of the header
#define FTRP(bp)       ((char *)(bp) + GET_SIZE(HDRP(bp)) - DSIZE) //the address of the footer
 
/* Given block ptr bp, compute address of next and previous blocks */
#define NEXT_BLKP(bp)  ((char *)(bp) + GET_SIZE(((char *)(bp) - WSIZE))) //next blocks pointer
#define PREV_BLKP(bp)  ((char *)(bp) - GET_SIZE(((char *)(bp) - DSIZE))) //prev blocks pointer

 #define PRED_POINT(bp)   (bp)
#define SUCC_POINT(bp)   ((char*)(bp)+WSIZE)
#define MINBLOCK (DSIZE+2*WSIZE+2*WSIZE)

static void *heap_listp;
static void *head_free;
static void *extend_heap(size_t words);
static void *find_fit(size_t size);
static void place(char*bp,size_t size);
static void *coalesce(void*bp);

static void insert_freelist(void *bp);
static void remove_freelist(void *bp);
static void place_freelist(void *bp);

/* 
 * mm_init - initialize the malloc package.
 */
int mm_init(void)
{
    if  ((heap_listp = mem_sbrk(4*WSIZE)) == (void*)-1) 
    return -1;
    PUTADDR(heap_listp,NULL);
   
    PUT(heap_listp+WSIZE,PACK(DSIZE,1));
    PUT(heap_listp+2*WSIZE,PACK(DSIZE,1));
    PUT(heap_listp+3*WSIZE,PACK(0,1));
    head_free=heap_listp;
    PUTADDR(head_free,NULL);//point to NULL
    heap_listp+=2*WSIZE;//将heap_listp指针移到序言和结尾块之间
    if(extend_heap(CHUNKSIZE)==NULL)
    return -1;


    return 0;
}

static void insert_freelist(void *bp){
    if(GETADDR(head_free)==NULL){
        PUTADDR(SUCC_POINT(bp),NULL);
        PUTADDR(PRED_POINT(bp), head_free);
        PUTADDR(head_free, bp);
    }
    else{
        void *tmp;
        tmp=GETADDR(head_free);
        PUTADDR(SUCC_POINT(bp),tmp);
        PUTADDR(PRED_POINT(bp),head_free);
        PUTADDR(head_free,bp);
        PUTADDR(PRED_POINT(tmp),bp);
        tmp=NULL;

    }
}

static void remove_freelist(void *bp) {
    void *pre_block, *post_block;
    pre_block = GETADDR(PRED_POINT(bp));
    post_block = GETADDR(SUCC_POINT(bp));
    //处理前序结点
    if (pre_block == head_free) {
        PUTADDR(head_free, post_block);
    } else {
        PUTADDR(SUCC_POINT(pre_block), post_block);
    }
    //处理后序结点
    if (post_block != NULL) {
        PUTADDR(PRED_POINT(post_block), pre_block);
    }
}
static void place_freelist(void *bp){//
    void *pre_block, *post_block, *next_bp;
    //存储前后结点地址
    pre_block = GETADDR(PRED_POINT(bp));
    post_block = GETADDR(SUCC_POINT(bp));
    next_bp = NEXT_BLKP(bp);
    //处理新的bp，进行前后连接
    PUTADDR(PRED_POINT(next_bp), pre_block);
    PUTADDR(SUCC_POINT(next_bp), post_block);
    //处理前序结点  针对head_free是前序结点的特殊处理
    if (pre_block == head_free) {
        PUTADDR(head_free, next_bp);
    } else {
        PUTADDR(SUCC_POINT(pre_block), next_bp);
    }
    //处理后序结点
    if (post_block != NULL) {
        PUTADDR(PRED_POINT(post_block), next_bp);
    }

}
static void *extend_heap(size_t words){//扩展堆函数,开一个新的空闲块
    void *bp;//
    size_t size;
    size=ALIGN(words);//填充
   if( (long)(bp=mem_sbrk(size))==-1)//注意这个（void*)
   return NULL;
    PUT(HDRP(bp),PACK(size,0));//
    PUT(FTRP(bp),PACK(size,0));
    PUT(HDRP(NEXT_BLKP(bp)),PACK(0,1));//创建一个新的结尾块
    return coalesce(bp);//开完后看能不能和前面的合并

}

static void* find_fit(size_t size){//在空闲块中看能否找到一个>=size的块，first fit
	void *ffbp;
    for(ffbp=GETADDR(head_free);ffbp!=NULL;ffbp=GETADDR(SUCC_POINT(ffbp))){
        if(GET_SIZE(HDRP(ffbp))>=size)
        return ffbp;
    }
    return NULL;
}
static  void  place(char *bp,size_t size){
    size_t totalsize =GET_SIZE(HDRP(bp));
    size_t resize =totalsize-size;
    if(resize>=MINBLOCK){
        PUT(HDRP(bp),PACK(size,1));
        PUT(FTRP(bp),PACK(size,1));
        void *next_bp = NEXT_BLKP(bp);
        PUT(HDRP(next_bp),PACK(resize,0));//后部分置为空
        PUT(FTRP(next_bp),PACK(resize,0));
        place_freelist(bp);

    }
    else {
        PUT(HDRP(bp),PACK(totalsize,1));
        PUT(FTRP(bp),PACK(totalsize,1));
        remove_freelist(bp);

    }

}
/* 
 * mm_malloc - Allocate a block by incrementing the brk pointer.
 *     Always allocate a block whose size is a multiple of the alignment.
 */
void *mm_malloc(size_t size)
{
    void *bp=NULL;
    size_t extendsize;
    if(size==0)
    return NULL;
    if(size<=DSIZE){
        size=2*DSIZE;
    }
    else{
        size=ALIGN(size+DSIZE);
    }
    if(((bp=find_fit(size))!=NULL)){
        place((char* )bp,size);
        return bp;
    }
    extendsize = MAX(size,CHUNKSIZE); //扩展堆
    if ((bp = extend_heap (extendsize)) == NULL) 
    return NULL; 
    place(bp, size); 
    return bp;
}

/*
 * mm_free - Freeing a block does nothing.
 */

void mm_free(void *ptr)
{
    size_t size =GET_SIZE(HDRP(ptr));
    PUT(HDRP(ptr),PACK(size,0));
    PUT(FTRP(ptr),PACK(size,0));
    coalesce(ptr);

}
static void *coalesce(void *bp){
    char *pre_block,*post_block;

    size_t prev_alloc=GET_ALLOC(FTRP(PREV_BLKP(bp)));
    size_t next_alloc=GET_ALLOC(HDRP(NEXT_BLKP(bp)));
    size_t size =GET_SIZE(HDRP(bp));
    if(prev_alloc && next_alloc)
    {
        insert_freelist(bp);
        return bp;
    }


    else if(prev_alloc ==1 &&next_alloc==0){//后面的块是空闲块，则指针不变，合并后面的块
        size+=GET_SIZE(HDRP(NEXT_BLKP(bp)));//
        post_block=NEXT_BLKP(bp);
        remove_freelist(post_block);
        insert_freelist(bp); 
    }
    else if(next_alloc==1 && prev_alloc==0){//前面的块空闲
        size+=GET_SIZE(FTRP(PREV_BLKP(bp)));
        bp=PREV_BLKP(bp);
    }
    else{
        size+=GET_SIZE(FTRP(PREV_BLKP(bp)));
        size+=GET_SIZE(HDRP(NEXT_BLKP(bp)));
       //  if(bp==next_fitp)
       // next_fitp=PREV_BLKP(bp);
        pre_block = PREV_BLKP(bp);
        post_block = NEXT_BLKP(bp);
        bp = PREV_BLKP(bp);
        remove_freelist(pre_block);
        remove_freelist(post_block);
        insert_freelist(bp);

    }
    PUT(HDRP(bp),PACK(size,0));
    PUT(FTRP(bp),PACK(size,0));

     return bp;

}
/*
 * mm_realloc - Implemented simply in terms of mm_malloc and mm_free
 */
void *mm_realloc(void *ptr, size_t size)
{
    void *oldptr=ptr;
    void *newptr;
    size_t new_size,old_size,extend_size;
    if(ptr==NULL)return mm_malloc(size);
    if(size==0){
        mm_free(ptr);
        return NULL;
    }
    new_size=ALIGN(size+DSIZE);
    old_size=GET_SIZE(HDRP(ptr));
if(old_size>=new_size){//只需要在原有空间上释放后面的一部分空间就可以了，其实可以直接用place语句替换ifelse
    if(old_size-new_size>=MINBLOCK)
    {
        place(oldptr,new_size);
    return oldptr;  
    }
    else {
        return oldptr;

    }
}
//太小了，只能释放内存，重新找一块新的
else {
    if((newptr=find_fit(new_size))==NULL){
        extend_size=MAX(new_size,CHUNKSIZE);
        if((newptr=extend_heap(extend_size))==NULL)
        return NULL;
    }
    place(newptr,new_size);
    memcpy(newptr,oldptr,old_size-2*WSIZE);
    mm_free(oldptr);
    return newptr;

}
}
```

评分如下

![image-20240711051622930](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202407110613195.png)

### 3.2优化地址维护freelist

优化代码：

只需要改动insert-freelist，使得插进去时以地址排列从小到的的方式插进去，便于寻找

```c
static void insert_freelist(void *bp){
    void *pre_block,*post_block,*tmp;
    tmp=head_free;
    for(post_block=GETADDR(head_free);post_block!=NULL;post_block=GETADDR(SUCC_POINT(post_block))){
        if(post_block>bp){
            pre_block=GETADDR(PRED_POINT(post_block));
            PUTADDR(PRED_POINT(bp),pre_block);
            PUTADDR(SUCC_POINT(bp),post_block);
            if(pre_block==head_free)
            {
                PUTADDR(head_free,bp);
            }
            else{
                PUTADDR(SUCC_POINT(pre_block),bp);
            }
            PUTADDR(PRED_POINT(post_block),bp);
            return ;
        }
        tmp=post_block;
    }
    pre_block=tmp;
    PUTADDR(PRED_POINT(bp),pre_block);
    PUTADDR(SUCC_POINT(bp),NULL);
     if(pre_block==head_free)
            {
                PUTADDR(head_free,bp);
            }
            else{
                PUTADDR(SUCC_POINT(pre_block),bp);
            }
}
```

得分如下：

![image-20240711061019718](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202407110613228.png)

## 后期优化

### 分配块舍弃脚部，能获得更大的空间利用率

### 分离链表

正如我们在前面所看到的，一个使用单向空闲块链表的分配器需要与空闲块数量呈线性关系的时间来分配块，为了近似达到最佳适配以及更快寻找适配块，可以根据不同的_大小类_来维护多个空闲链表。本代码采用的每个大小类都是2的幂。这样子就是log2级别的了,按理可以提速很多！

# 参考文章

[CSAPP(CMU 15-213)：Lab6 Malloclab详解_csapp malloc lab-CSDN博客](https://blog.csdn.net/qq_42241839/article/details/123697377)

[CSAPP Lab-7 Malloc Lab - hankeke303 - 博客园 (cnblogs.com)](https://www.cnblogs.com/hankeke303/p/18155103/csapp-malloclab)
