---
title: "CSAPP环境配置"
description: "分别用ubuntu虚拟机和docker两种方式配置csapp环境"
date: "Jan 14 2024"
updated: "Jun 2 2024"
tags: ["docker", "CSAPP"]
category: "CSAPP"
---


# Docker安装Csapp环境

>注意：arm64架构的cpu使用docker会安装arm 64 架构的ubuntu，而有论文表明arm64架构的ubuntu不支持gcc -m32的参数编译，建议使用m系列芯片的macbook放弃配置csapp环境或者使用Vmware box安装虚拟机尝试配置!
>

1. 打开Docker，打开CMD（windows）或者终端（mac），刷入以下命令拉取镜像。

```bash
# 下载镜像
docker pull linxi177229/csapp:latest
# 查看
docker images
# 启动容器（里面有配置好的环境 和 PDF 资料）
docker run --name csapp -itd linxi177229/csapp
```

2. 打开VsCode，在扩展市场安装Docker插件，然后进入，右键对应容器，选择**附加VisualStudioCode**，然后vscode会自动挂载容器，会弹出一个新的窗口。

3. 开始愉快的实验吧！

4. 测试环境

   ```
   # 接下来就和使用 平常的 Ubuntu：20.04 一样了
   # 进入 lab1 进行一个简单的测试
   cd ~
   ls
   cd csapplab
   cd datalab/datalab-handout
   make clean && make && ./btest
   ```
   
5. GDB安装（bomblab需要使用）

在这个doker中默认是没有安装gdb的,所以为了在bomblab中进行gdb的使用,我们需要在doker中安装gdb,该doker镜像是基于ubuntu20.04的,故我们直接在终端使用命令

```
apt-get update
apt-get install  gdb
```

安装好后,cd到bomb的文件夹内,输入

```
gdb bomb
```

然后开始实验吧!~~这个点废了我一个晚上才弄明白~~

# Ubuntu安装CSAPP环境

1. 虚拟机 安装 Ubuntu20.04，这个比较简单，找一篇博客就行，**不过记得用 VMware pro 16，很方便 ssh，

2. CSAPP 环境配置，首先如果你用的是 Ubuntu20.04 及以下，那么你可以直接运行下面的脚本，就可以安装好 操作都很简单，就几行命令而已，Docker 方法适用性更加广，目前大多数操作系统都支持。

这个脚本是 20.04 及以下都可以完全配置好的，并且有附带的 PDF，如果是 Ubuntu 21及 以上需要在 lab4 的时候降低 gcc 版本。

选择自己想要做项目的文件夹,cd到文件夹中

```bash
# 下载脚本
wget https://gitee.com/lin-xi-269/csapplab/raw/origin/installAll.sh 
# 运行脚本
bash installAll.sh 
```

3. 运行完 这个脚本之后，**会在 当前目录下创建一个 csapp 文件夹，里面包含 8个 lab 按照 PDF 开始做即可以开始做了。**

然后可以用vscode远程链接ubuntu,通过ssh,然后测试环境

```
# 接下来就和使用 平常的 Ubuntu：20.04 一样了
# 进入 lab1 进行一个简单的测试
cd ~
ls
cd csapplab
cd datalab/datalab-handout
make clean && make && ./btest
```

# Mac Chip 安装CSAPP环境

## 拉取Ubuntu18.04

```
docker pull ubuntu:18.04
```

## 创建Ubuntu(x86)容器
Docker默认创建的是arm架构的Ubuntu，如果没有指定为amd64，将无法安装gcc -m32

```
docker run  -it --platform linux/amd64 --name=csapp ubuntu:18.04
```

1. `-v` 或 `--volume` 参数用于挂载宿主机上的目录或文件到容器内。但是，在您的命令中，`-v` 后面没有直接跟任何值，这是不正确的。您应该指定要挂载的宿主机路径和容器内路径，例如 `-v /host/path:/container/path`。
2. **`--platform linux/amd64`**：
   这个参数指定了容器运行的平台架构。如果您的 Docker 主机支持多平台，并且您想确保在 AMD64 架构上运行容器，这个参数是正确的。但是，如果 Docker 主机本身就是 AMD64 架构，这个参数通常是可选的，因为 Docker 默认会在与主机相同的架构上运行容器。
3. **命令的其余部分**：
   `-it` 用于以交互模式运行容器，并分配一个伪终端。`--name csapp` 指定了容器的名称。`ubuntu:18.04` 是您要运行的镜像名称。

我用VSC进行附加，所以就不挂载本地容器了。

## 安装环境

1. 更新apt软件源

```
apt-get update
```

2. 安装sudo

```
apt-get install sudo
```

3. 安装c/c++编译环境

```
sudo apt-get install build-essential
```

4. 补充gcc的完整环境(gcc-multilib)

```
sudo apt-get install gcc-multilib
```

5. 安装gdb

```
sudo apt-get install gdb
```

---

据说GDB还使用不了，但我这十天是在家里面使用mac完成任务，所以会尽力克服问题，速通malloclab然后转战区块链！

### 参考链接

[MacOS(M1)下创建Docker Ubuntu容器搭建CSAPP实验环境并运行_docker配置csapp环境-CSDN博客](https://blog.csdn.net/weixin_52693116/article/details/133149517)

[Mac M1配置Docker CentOS（x86）的CSAPP实验环境 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/502375486?utm_id=0)

# 环境安装时的截图

下面的截图是包括了用docker配置xv6环境

## CMD截图

[![](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071315215.jpg)](https://pic.imgdb.cn/item/65a3b395871b83018aa824cd.jpg)

## Docker截图

[![](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071315227.jpg)](https://pic.imgdb.cn/item/65a3b5d3871b83018aafffff.jpg)

## Vscode截图

[![](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071315236.jpg)](https://pic.imgdb.cn/item/65a3b64c871b83018ab1ab98.jpg)

> 配置环境主打一个能用就好，不要过多的纠结。

# Good Luck

菜就多练，输不起就别玩
