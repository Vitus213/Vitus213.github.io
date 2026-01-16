---
title: "CSAPP的lab6-shlab"
description: "Exceptional Control Flow"
date: "Apr 25 2024"
updated: "May 11 2024"
tags: ["学习笔记", "CSAPP", "ECF"]
category: "CSAPP"
---


> **异常控制流(Exceptional Control Flow)**
>
> 网上的各种各样的辅助资料真的是太多太多太繁杂了，从学链接装载库的时候就感觉到了一点点，兴许也可能有我先看了一些书，然后又去看小土刀的解读，又去看别人的解读，又去看教授的讲解，很多不懂得还是不懂，懂得也开始变得不懂，而书本反倒没看，重心要进行调整，着重关注对书本的阅读，不去理会什么中文版英文版，那个看得懂就看哪一个，至于其他的资料，应该是要辅助书本的学习，书上不懂的再去查资料辅助学习，这样子才能系统学习。
>
> 4.26：这个课本是真的又长又臭，看了一天多才看了20多面，难死我脑袋了！
>
> 4.27:看完了一整章，做家庭作业的时候，前面的作业都很简单，部分的三星和所有的四星的比较困难，部分作业都看不懂题目，索性直接跳过，感觉难度曲线比较陡峭，这几天，五一前完成shlab。

家庭作业：难点题目，8.20，8.22，8.24，8.25,**8.26**，[作业答案](https://dreamanddead.github.io/CSAPP-3e-Solutions/)

会在复盘知识框架的过程中添加自己不懂得/认为重要的点，辅助深刻理解shlab的知识点。



# 知识框架

## 8.1Exception

Exception的分类

| 类别              | 原因            | 异步/同步 | 返回行为     |
| ----------------- | --------------- | --------- | ------------ |
| interrupt（中断） | 来自I/O设备信号 | 异步      | 下一条       |
| trap（陷阱）      | 有意的异常      | 同步      | 下一条       |
| fault（故障）     | 潜在可恢复错误  | 同步      | 可能返回当前 |
| abort（终止）     | 不可恢复        | 同步      | 不会返回     |

异步异常:由处理器外部的I/O设备中事件产生

中断处理（Interrupt）：

![image-20240425132916409](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202404261326743.png)

陷阱处理（Trap)：

![image-20240425144208070](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202404261358886.png)

故障处理（Fault）：![image-20240425144245925](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202404261358907.png)

所有的printf，exit（0),这些系统调用函数都可以使用syscall标准的调用进行实现



## 进程

![image-20240425150737672](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202404261358919.png)

## 8.3系统调用错误处理





## 8.4进程控制







## 8.5信号



习题8.8

猜测输出：

```c++
volatile long counter = 2;

void handler1(int sig)
{
    sigset_t mask, prev_mask;

    Sigfillset(&mask);
    Sigprocmask(SIG_BLOCK, &mask, &prev_mask);  /* Block sigs */
    Sio_putl(--counter);
    Sigprocmask(SIG_SETMASK, &prev_mask, NULL); /* Restore sigs */

    _exit(0);
}
int main()
{
    pid_t pid;
    sigset_t mask, prev_mask;

    printf("%ld", counter);
    fflush(stdout);

    signal(SIGUSR1, handler1);
    if ((pid = Fork()) == 0) {
        while(1) {};
    }
    Kill(pid, SIGUSR1);
    Waitpid(-1, NULL, 0);

    Sigfillset(&mask);
    Sigprocmask(SIG_BLOCK, &mask, &prev_mask);  /* Block sigs */
    printf("%ld", ++counter);
    Sigprocmask(SIG_SETMASK, &prev_mask, NULL); /* Restore sigs */

    exit(0);
}
```

并发错误避免

```c++
/*WARNING :This code is buggy !*/
void handler(int sig) 
{
     int olderrno = errno;
     sigset_ t mask_all, prev _all;
     pid_t pid;
     Sigfillset(&mask_all);//添加所有信号
     while ((pid = waitpid(-1, NULL, 0)) > 0) /*Reap a zombie child */
     {
         Sigprocmask(SIG_BLOCK, &mask_all, &prev_all);
         deletejob(pid);/*Delete the child from the job list */
         Sigprocmask(SIG_SETMASK, &prev _all, NULL);
    }
     if (errno != ECHILD) Sio_error("waitpid error");
     errno = olderrno;
    
}
int main(int argc, char **argv) 
{
    int pid;
    sigset_t mask_all, prev_all;
    Sigfillset(&mask_all);
    Signal(SIGCHLD, handler);
    initjobs();/*Initialize the job list */
     while (1)
    {
        if ((pid = Fork()) == 0) /*Child process*/
        {
            Execve("/bin/date", argv, NULL);
        }
         Sigprocmask(SIG_BLOCK, &mask_all, &prev_all);/*Parent process */ 
        addjob(pid);/*Add the child to the job list */
         Sigprocmask(SIG_SETMASK, &prev _all, NULL);
        
    }
     exit(0);    
}
```

在子进程中，程序执行 `Execve("/bin/date", argv, NULL);` 来替换当前进程的映像为 `/bin/date`，并执行 `date` 命令。如果 `Execve` 成功，子进程将不会返回执行 `while (1)` 循环，因为它已经被 `date` 命令替换了。

在父进程中，`Fork()` 返回子进程的PID，随后父进程会阻塞所有信号（通过 `Sigprocmask(SIG_BLOCK, &mask_all, &prev_all);`），将子进程PID添加到作业列表（通过调用 `addjob(pid);`），然后恢复之前的信号掩码（通过 `Sigprocmask(SIG_SETMASK, &prev_all, NULL);`）。



## 8.6 nonlocal jump

setjmp:调用一次，返回多次。

longjmp：调用一次，从不返回。（execve也是调用一次，从不返回，习题8.10）

能够从深层的函数嵌套中返回，不用一层一层的解开调用栈，所以他不是很安全，有点像goto类型语句





## 8.7 Some Tools

STRACE: 打印一个正在运行的程序和它的子进程调用的每个系统调用的轨迹。对于好奇的学生而言，这是一个令人着迷的工具。用 -static 编译你的程序，能得到一个更干净的、不带有大量与共享库相关的输出的轨迹。
PS: 列出当前系统中的进程（包括僵死进程）。
TOP: 打印出关千当前进程资源使用的信息。
PMAP: 显示进程的内存映射。

# 辅助资料

[Lecture 14 Exceptional Control Flow Exceptions and Processes](https://www.bilibili.com/video/BV1iW411d7hd)

[Lecture 15 Exceptional Control Flow Signals and Nonlocal Jumps](https://www.bilibili.com/video/BV1iW411d7hd)

[【读薄 CSAPP】伍 异常控制流](https://wdxtub.com/csapp/thin-csapp-5/2016/04/16/)

[第08章：异常控制流 | CSAPP重点解读 (gitbook.io)](https://fengmuzi2003.gitbook.io/csapp3e/di-08-zhang-yi-chang-kong-zhi-liu)

[shlab.dvi (cmu.edu)](http://csapp.cs.cmu.edu/3e/shlab.pdf)

# Lab前瞻

## Topic

>• eval: Main routine that parses and interprets the command line. [70 lines]
>
>• builtin cmd: Recognizes and interprets the built-in commands: quit, fg, bg, and jobs. [25 lines]
>
>• do bgfg: Implements the bg and fg built-in commands. [50 lines]
>
>• waitfg: Waits for a foreground job to complete. [20 lines]
>
>• sigchld handler: Catches SIGCHILD signals. 80 lines]
>
>• sigint handler: Catches SIGINT (ctrl-c) signals. [15 lines]
>
>• sigtstp handler: Catches SIGTSTP (ctrl-z) signals. [15 lines]

补全上面的函数，括号中的lines表示预计lines，补全完后make就行

## The tsh Speciﬁcation

>Your tsh shell should have the following features:
>
>• The prompt should be the string “tsh> ”.
>
>• The command line typed by the user should consist of a name and zero or more arguments, all separated by one or more spaces. If name is a built-in command, then tsh should handle it immediately and wait for the next command line. Otherwise, tsh should assume that name is the path of an executable ﬁle, which it loads and runs in the context of an initial child process (In this context, the term job refers to this initial child process).
>
>• tsh need not support pipes (|) or I/O redirection (< and >).
>
>• Typing ctrl-c (ctrl-z) should cause a SIGINT (SIGTSTP) signal to be sent to the current foreground job, as well as any descendents of that job (e.g., any child processes that it forked). If there is no foreground job, then the signal should have no effect.
>
>• If the command line ends with an ampersand &, then tsh should run the job in the background.
>
>Otherwise, it should run the job in the foreground.
>
>• Each job can be identiﬁed by either a process ID (PID) or a job ID (JID), which is a positive integer assigned by tsh. JIDs should be denoted on the command line by the preﬁx ’%’. For example, “%5” denotes JID 5, and “5” denotes PID 5. (We have provided you with all of the routines you need for manipulating the job list.)
>
>• tsh should support the following built-in commands:
>
>– The quit command terminates the shell.
>
>– The jobs command lists all background jobs.
>
>– The bg <job> command restarts <job> by sending it a SIGCONT signal, and then runs it in the background. The <job> argument can be either a PID or a JID.
>
>– The fg <job> command restarts <job> by sending it a SIGCONT signal, and then runs it in the foreground. The <job> argument can be either a PID or a JID.
>
>• tsh should reap all of its zombie children. If any job terminates because it receives a signal that it didn’t catch, then tsh should recognize this event and print a message with the job’s PID and a description of the offending signal.

用人话讲就是：

- 每次要以`tsh>`开始,这个prompt他会提前提供给你
- 每次命令行只有两种类别可能性，一种是内置命令要运行builtin_cmd函数处理quit，jobs，bg和fg命令，同时不用处理单独的`&`命令，一种是运行程序，使用exevc函数+参数
- 不需要管道和I/O
- ctrl-c和ctrl-z只对前台进程fg管用，分别是对前台进程进行终止和挂起，即为stoped和terminaled
- 如果命令以`&`结尾，则默认是后台进程
- 要有JID和PID的区分，jid为一个组的id，而pid则是每个进程的id
- 需要支持以下内置命令
  1. quit：关闭结束shell
  2. jobs：列出所有后台任务
  3. bg
  4. fg
- tsh 应该回收所有的僵尸进程，如果任何 job 因为接收了没有 catch 的信号而终止，tsh 应该识别出这个时间并且打印出 JID 和相关信号的信息

> 做这个lab的时候已经离读完本章过了七八天了，好像又忘得差不多了，真的很烦拉锯战。现在已经很多代码都看不懂了

# Lab摸索

我们归根结底是要对`tsh.c`这个文件进行修改，让他起到一个shell的作用，我们只用不全eval那几个函数，一开始我们运行下tsh，输入`./tsh`会进入死循环，每次键入没有反应，阅读代码得知`ctrl-d`能结束程序。而tshref便是模范程序，tshref.out便是模范输出，我们照着trace文件序号从小到大一个一个实现就可以了，开工！

## 错误处理包装函数

```c
pid_t Fork(void);
void Execve(const char *filename, char *const argv[], char *const environ[]);
void Kill(pid_t pid, int signum);
void Sigemptyset(sigset_t *set);
void Sigaddset(sigset_t *set, int signum);
void Sigfillset(sigset_t *set);
void Setpgid(pid_t pid, pid_t pgid);
void Sigprocmask(int how, sigset_t *set, sigset_t *oldset);
int Sigsuspend(const sigset_t *set);

pid_t Fork(void)
{
    pid_t pid;
    if((pid = fork()) < 0)
        unix_error("Fork error");
    
    return pid;
}
void Execve(const char *filename, char *const argv[], char *const environ[])
{
    if (execve(filename, argv, environ) < 0) 
    {
        printf("%s: Command not found.\n", argv[0]);
        exit(0);
    }
    return;
}
void Kill(pid_t pid, int signum)
{
    if(kill(pid, signum) < 0)
        unix_error("Kill error");
    
    return;
}
void Sigemptyset(sigset_t *set)
{
    if(sigemptyset(set) < 0)
        unix_error("Sigemptyset error");
    return;
}
void Sigaddset(sigset_t *set, int sign)
{
    if(sigaddset(set, sign) < 0)
        unix_error("Sigaddset error");
    return;
}
void Sigprocmask(int how, sigset_t *set, sigset_t *oldset)
{
    if(sigprocmask(how, set, oldset) < 0)
        unix_error("Sigprocmask error");
    return;
}
void Sigfillset(sigset_t *set)
{
    if(sigfillset(set) < 0)
        unix_error("Sigfillset error");
    return;
}
void Setpgid(pid_t pid, pid_t pgid) 
{
    if (setpgid(pid, pgid) < 0)
        unix_error("Setpgid error");
    return;
}
int Sigsuspend(const sigset_t *set)
{
    int rc = sigsuspend(set); /* always returns -1 */
    if (errno != EINTR)
        unix_error("Sigsuspend error");
    return rc;
}
```

## 信号处理

### SIGCHLD_handler

在这个函数里面我们要处理`SIGCHLD`这个信号

> sigchld_handler - 每当子作业终止（变成僵尸）或因收到 SIGSTOP 或 SIGTSTP 信号而停止时，内核都会向 shell 发送 SIGCHLD。处理程序会获取所有可用的僵尸子级，但不会等待任何其他当前正在运行的子级终止。

```c
void sigchld_handler(int sig) 
{
    int olderrno=errno;//负责保存错误信息，errno是全局变量
    sigset_t mask_all,prev_all;
    pid_t pid;
    int status;
    struct job_t *job;
    sigfillset(&mask_all);//阻塞所有信号
    while((pid=waitpid(-1,&status,WNOHANG|WUNTRACED))>0){//当有进程终止/停止的时候都会获得那个进程的pid
        sigprocmask(SIG_BLOCK,&mask_all,&prev_all);
      //分别通过三种状态来判断是正常结束还是terminated还是stopped
       if(WIFEXITED(status)){
        deletejob(jobs,pid);
       }
       else if(WIFSIGNALED(status)){
        printf ("Job [%d] (%d) terminated by signal %d\n", pid2jid(pid), pid, WTERMSIG(status));
        deletejob(jobs,pid);
       }
       else if(WIFSTOPPED(status)){
         printf ("Job [%d] (%d) stoped by signal %d\n", pid2jid(pid), pid, WSTOPSIG(status));
            job = getjobpid(jobs, pid);
            job->state = ST;
       }
       sigprocmask(SIG_SETMASK,&prev_all,NULL);//解除所有阻塞
       
    }
    errno=olderrno;
    return ;
}
```

### SIGINT_handler

当接收到这个信号时，需要对所有在前台运行的进程将其状态变为STOP，通过kill函数来实现,即通过fgpid函数得到当前jobs中在前台的job的pid，然后把这个进程组kill掉，write_up中告诉我们使用kill函数时要用`-pid`来kill掉一整个进程组

```c++
void sigint_handler(int sig) 
{
    int pid;

    int olderrno=errno;
    sigset_t mask_all,prev_all;
    sigfillset(&mask_all);
    sigprocmask(SIG_BLOCK,&mask_all,&prev_all);
    if((pid=(fgpid(jobs)))!=0){
        sigprocmask(SIG_SETMASK,&prev_all,NULL);
        kill(-pid,SIGINT);
    }
    errno=olderrno;
    return;
}
```

### SIGTSTP_handler

这个和接受到sigint信号的函数差别不大

```c++
void sigtstp_handler(int sig) 
{
    int pid;
    int olderrno=errno;
    sigset_t mask_all,prev_all;
    sigfillset(&mask_all);
    sigprocmask(SIG_BLOCK,&mask_all,&prev_all);
    if((pid=(fgpid(jobs)))>0){
        sigprocmask(SIG_SETMASK,&prev_all,NULL);
        kill(-pid,SIGTSTP);
    }
    errno=olderrno;
    return;
}
```

## waitfg

阻塞所有的进程，直到前台进程结束/被终止/停止

用`sigsuspend`函数，这个函数相当于如下代码：

```c
sigprocmask(SIG_SETMASK, &mask, &prev);
pause();
sigprocmask(SIG_SETMASK, &prev, NULL);
```

在调用`sigsuspend`之前阻塞 SIGCHLD 信号，调用时又通过`sigprocmask`函数，在执行`pause`函数之前解除对信号的阻塞，从而正常休眠。

```c++
void waitfg(pid_t pid)
{   
    sigset_t mask;
    sigemptyset(&mask);
    while(fgpid(jobs)!=0){
        sigsuspend(&mask);
    }
    return ;
}
```

## eval

总函数，贯穿对cmdline命令处理的调控，安排

```c++
void eval(char *cmdline) 
{
    //主线程，负责调控诸多函数
    char *argv[MAXARGS];
    char buf[MAXLINE];
    int bg ;
    pid_t pid;
    sigset_t mask_all,prev_all,mask_one;

    //阻塞信号
    sigfillset(&mask_all);
    sigemptyset(&mask_one);
    sigaddset(&mask_one,SIGCHLD);

   sigprocmask(SIG_BLOCK,&mask_all,&prev_all);//防止出现子进程比父进程先的情况
    //在课本里有

    strcpy(buf,cmdline);//cmdline复制过来
    bg=parseline(buf,argv);//负责根据空格把buf中的字符划分丢到argv的数组中
    //bg=1 则在后台执行
    
    if(argv[0]==NULL)return ;//没有命令，不处理
    if(!builtin_cmd(argv)) {//如果不是builtin_cmd，则创立新的子进程
    
        if((pid=fork())==0){
            sigprocmask(SIG_SETMASK,&prev_all,NULL);

            setpgid(0,0);//进程组
            if(execve(argv[0],argv,environ)<0)
            {
                printf("%s: Command not found.\n", argv[0]);
                exit(0);
            }
        }
        //注意子进程不继承父进程的局部变量，故下面的函数段在子进程中直接判定为假。
       //父进程
        if(!bg){//前台执行
            addjob(jobs,pid,FG,cmdline);
          sigprocmask(SIG_SETMASK,&mask_one,NULL);
            waitfg(pid);
        }
        else {//后台执行
            addjob(jobs,pid,BG,cmdline);
            sigprocmask(SIG_SETMASK,&mask_one,NULL);

            printf("[%d] (%d) %s",pid2jid(pid),pid,cmdline);
          
        }
        sigprocmask(SIG_SETMASK,&prev_all,NULL);
   return ;
    }  
}
```

## builtin_cmd

这个很简单，就判断是不是那四个内置命令，是的话就调用对应的函数

```c++
int builtin_cmd(char **argv) 
{
  if(!strcmp(argv[0],"quit"))
  exit(0);
   if(!strcmp(argv[0],"&"))
  return 1;
   if(!strcmp(argv[0],"bg")||!strcmp(argv[0],"fg"))
  {
    do_bgfg(argv);
  return 1;
  }
  if (!strcmp(argv[0],"jobs")){
    listjobs(jobs);
 return 1;
  }
  else 
     return 0;     /* not a builtin command */
}
```

## do_bgfg

- The bg <job> command restarts <job> by sending it a SIGCONT signal,
  and then runs it in the background. 
  The <job> argument can be either a PID or a JID.

- The fg <job> command restarts <job> by sending it a SIGCONT signal, 
  and then runs it in the foreground. 

- The <job> argument can be either a PID or a JID.

  这个函数主要是根据test14案例进行修改补充

```c++
void do_bgfg(char **argv) 
{
    //后台执行
    struct job_t *job=NULL;
    int state;
    int id;
    if(!strcmp(argv[0],"bg"))state=BG;
    else state =FG;

   if(argv[1]==NULL){
        printf("%s command requires PID or %%jobid argument\n",argv[0]);
        return ;
    }//判断是不是只有fg/bg这种命令
    if(argv[1][0]=='%'){//jid的情况
        if(sscanf(&argv[1][1],"%d",&id)>0){
            job=getjobjid(jobs,id);
            if(job==NULL){
                printf("%s: No such job\n",argv[1]);
                return ;
            }
        }
    } 
     else if(!isdigit(argv[1][0])) {  //其它符号，非法输入，不是数字的情况
        printf("%s: argument must be a PID or %%jobid\n", argv[0]);
        return;
    }
    else {//pid的情况，直接把字符串转化成数字床，通过atoi函数
        id=atoi(argv[1]);
        job=getjobpid(jobs,id);
        if(job==NULL){
            printf("(%d): No such process\n",id);
            return;
        }
        
    }
    kill(-(job->pid),SIGCONT);//统一把他们的状态都定义成SIGCONT
    job->state=state;
    if(state==BG)//根据状态的不同调整输出
        printf("[%d] (%d) %s",job->jid,job->pid,job->cmdline);
    else 
        waitfg(job->pid);
    
    return;
}
```

# 总结

这个shell lab没有具体的评分系统，每次都是通过以下两个命令

```c++
make test01
make rtest01
```

这种类似的命令来比对1-16个trace文件，而且这个shell是模拟一个shell，故不能通过对拍来判断程序是否正确，因为进程号都不一样，而且这个lab是我学习完课本后放了一个超级长的五一假期然后磨磨蹭蹭做完的，而且抄了大量的别人的代码，只能说这个lab做的有点失败，而且没有进行错误处理包装，错误处理函数是直接复制的，但是还是学到了很多东西。



# 参考链接

[CSAPP | Lab7-Shell Lab 深入解析 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/492645370)

[CSAPP shelllab解析 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/667470667)
