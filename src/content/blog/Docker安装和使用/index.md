---
title: "Docker安装和踩坑"
description: "在研究docker的路上开始研究ubuntu"
date: "Dec 6 2023"
updated: "May 27 2024"
tags: ["学习笔记"]
category: "EATPOOP"
---


# 前言

一直在折腾Mit6.s081的课程实验环境配置和csapp，在网上搜集了大量资料，整理出了以下教程，不得不说Docker真的是个超级无敌伟大的发明

> M系列芯片的macbook还是别考虑做实验了,反正我没折腾好。2024.5.26:折腾好了xv6的实验环境。

众所周知，Win11/10下有个子linux系统叫wsl，他比虚拟机更加方便快捷。docker在windows上是使用wsl中的kernel内核，所以一定要有wsl的存在。

# WSL2安装

> 在WIN10/11下的wsl2踩坑和安装[参考文章](https://juejin.cn/post/7099108145825316894#heading-0)

##  安装WSL2

打开终端，输入

```
wsl -l -v
```

若出现以下情况：

![image-20240619133933862](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202406191423190.png)

则输入命令安装wsl

```
wsl --install
```

`wsl install` 报错

```
WslRegisterDistribution failed with error: 0x80370102
```

出现这个问题是因为VMware16、Hyper-v、WSL2、Docker之间出现了兼容性的问题导致报错

官方解决方法：

## win11解决办法

具体也就是以下步骤,检查配置

1. 检查系统版本

对于 x64 系统：版本 1903 或更高版本，采用 内部版本 18362 或更高版本
对于 ARM64 系统：版本 2004 或更高版本，采用 内部版本 19041 或更高版本
低于 18362 的版本不支持 WSL 2。 使用 Windows Update 助手更新 Windows 版本

2. 检查是否开启VT虚拟化

在任务管理器->性能中查看

![image-20240619135711599](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202406191423217.png)

如果没有启用需要更改BIOS设置,具体设置方法可以百度。

3. 检查相关Windows功能是否开启

win+Q键搜索->启用或关闭windows功能

![image-20240619135748168](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202406191423245.png)

win11需要检查是用与Linux的Windows子系统选项是否开启

![image-20240619135840558](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202406191423268.png)

## win10解决办法

**1.安装/打开Hyper-V**

这是 Docker Desktop for Windows 所使用的虚拟机。 但是这个虚拟机一旦启用，QEMU、VirtualBox 或 VMWare Workstation 15 及以下版本将无法使用！（所以更新到VMWare Workstation 16就万事大吉了）

首先右键开始菜单，选择应用与功能
 ![1513668234-4363-20171206211136409-1609350099.png](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071315138.awebp)

然后点击程序与功能
 ![1513668234-4368-20171206211345066-1430601107.png](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071315168.awebp)

选择启用或关闭Windows功能
 ![1513668234-9748-20171206211435534-1499766232.png](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071315176.awebp)

这是第一种情况
 ![1513668234-6433-20171206211858191-1177002365.png](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071315190.awebp)

如果你的界面是这样的，且没有下列选项中的Hyper-V，则先选中打钩的下面三个，然后确定，再参考[win10没有Hyper-v的解决方法](https://link.juejin.cn?target=https%3A%2F%2Fblog.csdn.net%2Flanxingxing666666%2Farticle%2Fdetails%2F111354089)

![Snipaste_2022-05-18_00-26-50.png](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402071315198.awebp)

在管理员权限下打开powershell，执行以下命令后重启电脑

```c++
# 启用适用于 Linux 的 Windows 子系统

dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 启用虚拟机功能

dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 下载 Linux 内核更新包

https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi
```



## 2.将WSL版本升级为WSL2

首先看看版本号是否为2

```
wsl -l -v
```

### 没有发行版

输入以下命令：

```
wsl --install
```

### 已有发行版

若版本为1，使用命令 

```arduino
wsl --set-default-version 2
```

发现版本还没改过来

管理员权限打开终端，输入命令：

```bash
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

然后下载Linux的内核更新包并安装 x64：[wslstorestorage.blob.core.windows.net/wslblob/wsl…](https://link.juejin.cn?target=https%3A%2F%2Fwslstorestorage.blob.core.windows.net%2Fwslblob%2Fwsl_update_x64.msi)

仍然是管理员权限下打开终端，先查看更新前的WSL版本：

```
wsl -l -v
```

输入更新的命令：

```arduino
wsl.exe --set-version Ubuntu 2
```

更新命令有的用的：`wsl --set-version Ubuntu 2`，但是在我的电脑上报错：不存在具有提供的名称的分布。 解决方法就是把wsl改成wsl.exe.

### 版本号为2

这步完成，开始安装docker



# Docker安装

> 建议直接官网下载

[DOCKER FOR WINDOWS](https://docs.docker.com/desktop/install/windows-install/)

[DOCKER FOR LINUX](https://docs.docker.com/desktop/install/mac-install/)

[DOCKER FOR MAC](https://docs.docker.com/desktop/install/mac-install/)

**对于mac用户而言，直接去官网上下载docker，注意intel和apple版本**

一通安装，等它转完圈圈，就算是成功安装，可以开始环境配置了！

![image-20240423211431827](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202404232129489.png)

进入到这个界面就算是成功了。

下面是docker安装成功后cmd的界面：

![image-20240423211517826](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202404232128758.png)

# Docker基本命令

1. 拉取镜像

```bash
docker pull ubuntu:latest
```

2. 查看镜像

```
docker images
```

3. 根据镜像生成container

```
docker run -itd --name Mit_6.s081 ubuntu:20.04
```

4. 开始，附加，停止容器

```
docker start Mit_6.s081
docker attach Mit_6.s081
docker stop Mit_6.s081
```

5. 查看容器信息

```
docker ps -a
```

6. 退出container命令

```
ctrl+p   
ctrl+q
```



