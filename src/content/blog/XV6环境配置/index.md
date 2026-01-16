---
title: "ubuntu配置xv6环境"
description: "分别用ubuntu虚拟机和docker两种方式配置XV6环境"
date: "Dec 6 2023"
updated: "May 27 2024"
tags: ["学习笔记", "XV6"]
category: "XV6"
---


# Docker安装XV6环境

## Windows/Ubuntu

1. 打开Docker，打开CMD（windows）或者终端（mac），刷入以下命令拉取镜像。这个 images （400多MB）开箱即用,环境已经配置好了。

```
#下载镜像
docker pull linxi177229/mit6.s081:latest
# 查看
docker images
# 启动容器（里面有配置好的环境 和 PDF 资料）
docker run --name xv6 -itd linxi177229/mit6.s081:latest
```

2. 打开VScode，在扩展市场安装Docker插件，然后进入，右键对应容器，选择**附加VisualStudioCode**，然后vscode会自动挂载容器，会弹出一个新的窗口。
3. 开始愉快的实验吧！
4. 测试环境

```
cd xv6-labs-2020
# 开启一个 shell 手动运行那些 usr/ 下的程序来测试
make qemu 

 #看目录下的各级目录
 ls
 
# 自动化测试：make grade 可以获得得分情况
make grade

# 或者可以使用 进行单个测试
./grade-具体lab名字 part名字
```

5. 退出方式

```bash
# 在另一个新开的终端执行 
pkill -f qemu  
```

6. 调试方法 GDB

```bash
# 第一个 terminal
cd xv6-labs-2020
# 第一次执行 gdb 需要 执行 下面条语句 
echo "add-auto-load-safe-path $(pwd)/.gdbinit " >> ~/.gdbinit 
# 第一次执行
make CPUS=1 qemu-gdb

# 第二个 terminal
cd xv6-labs-2020
gdb-multiarch

# 接下来就和使用 平常的 gdb 一样了， layout split 是一个很棒的用法
# 在 gdb 中输入 kill 即可 退出
# 或者 在第三个 teminal 中输入 pkill -f qemu 也可以退出
```

[![](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071315207.jpg)](https://pic.imgdb.cn/item/65a3b3dd871b83018aa931bf.jpg)

## Apple Chip

>自己ubuntu容器中也可以这样子一键下载。

在docker中先拉取ubuntu 20.04的镜像，即如下命令，输入：

```bash
docker pull ubuntu:20.04
```

在联网状态下，docker会拉取ubuntu：20。04image,可以输入`docker images`查看images

![image-20240527135756188](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202405271417052.png)

接下来，我们就开始创建容器并且让这个ubuntu跑起来，这个ubuntu images只是最基本的镜像，损失了很多功能，但是之后可以自己往上面安装软件包，输入以下命令：

```bash
docker run -itd --name MIT_6.s081 ubuntu:20.04
```

就会创建一个名为`MIT_6.s081`的container，然后我们要在里面安装基本的软件

```
apt update
apt install sudo
```

装了sudo的权限后（其实也可以不装），打开xv6的官网，复制以下链接，在docker的MIT_6.s081中安装必要依赖：

```bash
sudo apt-get install git build-essential gdb-multiarch qemu-system-misc gcc-riscv64-linux-gnu binutils-riscv64-linux-gnu
```

安装完后，在root里面找个地方，clone下实验文件(2020版本的就行)

```bash
git clone git://g.csail.mit.edu/xv6-labs-2020
```

在之后便是测试test

```
# cd xv6-labs-2020
git checkout util
make qemu
```

![image-20240527141209510](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202405271417061.png)

![image-20240527141221053](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202405271417070.png)

若是以上则可以认为是test成功了！

## 如何退出xv6kernel

回到 monitor 界面：**ctrl + a**，然后按 **c** ，即可退出 xv6 的 shell 界面，进入 QEMU 的 monitor 界面，输入 **q** 按回车即可退出 QEMU。

终止 QEMU 进程：**ctrl + a**，然后按 **x**，即可终止 QEMU 进程，回到 Shell 界面。

![image-20240527141731298](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202405271417078.png)

# Ubuntu安装XV6环境

## 虚拟机安装

按照上一个说明的流程，安装一个新的虚拟机并记住它的名字。记住**账户名在下文统一用username指代账户名**，下面要更新下载源。

1. 备份源列表

Ubuntu配置的默认源并不是国内的服务器，下载更新软件都比较慢。首先备份源列表文件**sources.list**：

```text
# 首先备份源列表
sudo cp /etc/apt/sources.list /etc/apt/sources.list_backup
```

2. 打开sources.list文件修改

选择合适的源，替换原文件的内容，保存编辑好的文件, 以阿里云更新服务器为例（可以分别测试阿里云、清华、中科大、163源的速度，选择最快的）：

```text
# 打开sources.list文件
sudo gedit /etc/apt/sources.list
```

编辑**/etc/apt/sources.list**文件, 在文件最前面添加阿里云镜像源：

```text
#  阿里源
deb http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
```

3. 刷新列表

```text
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install build-essential
```

下载速度瞬间就起飞了。

## 配置riscv+qemu+clone


    //下载必要组件并解压
    sudo apt install git build-essential gdb-multiarch qemu-system-misc gcc-riscv64-linux-gnu binutils-riscv64-linux-gnu libglib2.0-dev libpixman-1-dev gcc-riscv64-unknown-elf
    
    wget https://download.qemu.org/qemu-5.1.0.tar.xz
    
    tar xvf qemu-5.1.0.tar.xz
    
    cd qemu-5.1.0

接下来运行这条命令

```
./configure --disable-kvm --disable-werror --prefix=/usr/local --target-list="riscv64-softmmu"
```

如果报这个错误:

```text
ERROR: glib-2.48 gthread-2.0 is required to compile QEMU
```

解决方法为`sudo apt install libglib2.0-dev`

还可能报这个错误：

```text
ERROR: pixman >= 0.21.8 not present.
       Please install the pixman devel package.
```

解决方法为`sudo apt install libpixman-1-dev`

之后编译,克隆源代码并初始运行

```
make
sudo make install
cd ~
git clone git://g.csail.mit.edu/xv6-labs-2020
cd xv6-labs-2020
git checkout util
make qemu
```

## vscode远程调试

在vscode上安装remote ssh一系列扩展.

在虚拟机终端输入ifconfig(如果报错就按它的指示去做)并获得地址名得到**inet值**

在vscode中的ssh配置文件中加入以下东西：（或者修改）

```
    Host	 #造一个名字(随便取)
    HostName 	# 输入你得到的地址
    User 用户名字	#(ubuntu的账户名字即为username)
```

在你的windows终端中跑一遍ssh检验是否能够连接虚拟机

打开cmd,输入以下命令

```
ssh username@<inet的地址>
```

若报以下错误

```
ssh: connect to host XX.XX.XX.XX port 22: Connection refused
```

需要开启ssh服务,重启ssh服务(这个报错还挺平凡的,重启下ssh服务一般就能解决)

```
sudo /etc/init.d/ssh start
sudo /etc/init.d/ssh stop
sudo /etc/init.d/ssh start
```

在vscode中远程连接虚拟机并输入两次密码(在vscode里面远程连接至主机)

用vscode打开xv6-labs-2020文件目录并在目录下创建一个.vscode文件夹

手动新建一个**launch.json**文件,并把以下内容修改username后粘贴

```json
{
"version": "0.2.0",
"configurations": [
    {
        "name": "(gdb) 启动",
        "type": "cppdbg",
        "request": "launch",
        "program": "/home/genesis/xv6-labs-2020/kernel/kernel",//你的kernel所在的目录
        "args": [],//可以后续传参
        "stopAtEntry": true,//支持断点调试
        "cwd": "${fileDirname}",
        "miDebuggerServerAddress": "localhost:26000",//这是默认端口
        "miDebuggerPath": "/usr/bin/gdb-multiarch",//x86环境支持组件
        "environment": [],
        "externalConsole": false,
        "MIMode": "gdb",
        "setupCommands": [
            {
                "description": "为 gdb 启用整齐打印",
                "text": "-enable-pretty-printing",
                "ignoreFailures": true
            }
        ],
        "logging":{
            "engineLogging":true,
            "programOutput": true,
        }
    }
    ]   
}
```
修改gdbinit.teml.riscv:(最后一句支持更广泛的断点调试)(**但目前断点调试好像不成功2023.12.8**)

```
set confirm off
set architecture riscv:rv64
target remote 127.0.0.1:1234
symbol-file kernel/kernel
set disassemble-next-line auto
set riscv use-compressed-breakpoints yes
```

在vscode终端启动qemu:

```
make qemu-gdb
```

注释gdbinit文件(每次启动qemu都要修改，可以尝试优化)：

```
set confirm off
set architecture riscv:rv64
#target remote 127.0.0.1:26000
symbol-file kernel/kernel
set disassemble-next-line auto
set riscv use-compressed-breakpoints yes
```

按下两次f5并祈祷

> 参考教程：
>
> 1. [MIT 6S081 环境搭建指南 保姆级教学](https://www.bilibili.com/video/BV11K4y127Qk/?spm_id_from=333.337.search-card.all.click&vd_source=48b7f9b11252cb5ee80182ee9f3745e2)
>
> 2. [mit6s081 通过vscode来debug kernel](https://www.bilibili.com/video/BV1Lv411g7EV/?spm_id_from=333.788&vd_source=48b7f9b11252cb5ee80182ee9f3745e2)

# Grade

如果make grade失败并报错‘

```
'python': No such file or directory，
```

可以进行如下操作

    //查看已安装的python版本
    python3 --version
    
    //查找python3的位置
    whereis python3
    
    //为其创建连接符号(注意观察路径,自己调整)
    sudo ln -s /usr/bin/python3 /usr/bin/python

## 参考学习资料

1. [一起来学MIT6.S081呀～ - 飞书云文档 (feishu.cn)](https://tarplkpqsm.feishu.cn/docs/doccnBFsXFMsAr1oXEVsaT9E3Jg)
2. [MIT 6.S081 Operating System  - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/624091268)
3. [6.S081 / Fall 2020 (mit.edu)](https://pdos.csail.mit.edu/6.S081/2020/tools.html)
