---
title: "win美化fluent terminal总结"
description: "win美化fluent terminal总结"
date: "Jan 18 2024"
updated: "Feb 25 2024"
tags: ["fluent", "shell"]
category: "EATPOOP"
---



> 用命令行安装了无数次oh-my-posh,我无奈大喊holy-shit!

## 一、安装

> 官方文档：https://ohmyposh.dev/

安装oh-my-posh和fluent terminal。在微软商店安装，多试几次就成功了！

现在的oh-my-posh可以直接从Microsoft Store下载exe文件安装了，别去折腾命令行的命令了，速度太慢了。
安装完成后，如果是windows系统，推荐Windows Terminal（没有的话在Microsoft Store里安装）下启动powershell,推荐在商店中下载安装`fluent terminal`。

![image-20240225214958894](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402252205681.png)

## 二、配置

配置oh-my-posh过程中比较复杂的点就是Nerd Font和Themes这两点：

### 1.Nerd Font

去下面的网站下载一个名字里面带NF的字体，windows下直接安装，其他系统参照网站说明。

> 下载地址：https://www.nerdfonts.com/

或者[点击下载](https://link.zhihu.com/?target=https%3A//github.com/ryanoasis/nerd-fonts/releases/download/v2.1.0/Meslo.zip)然后解压全选安装

### 2.Themes

#### step1：设置字体

用管理员身份打开Fluent Terminal，在界面中按下 ctrl+ shift+，后，会打开一个界面

![image-20240225215041822](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img//202402252205681.png)

选择终端,更改字体

![image-20240225215109949](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402252205721.png)





记得保存，新开一个窗口,看字体改变.

#### step2:更改主题

1. 启动oh-my-posh

输入如下命令，下面的命令会先检查配置文件存不存在，如果不存在才创建：

```powershell
if (-not (Test-Path $PROFILE)) {
    New-Item -Path $PROFILE -Type File -Force
}
```

接下来，打开配置文件（以下示例展示的是使用记事本进行操作）。

```powershell
notepad $PROFILE
```

先试着输入以下命令：

记得将用户名替换为自己的用户名。

```
oh-my-posh init pwsh --config C:\Users\用户名\AppData\Local\Programs\oh-my-posh\themes\catppuccin.omp.json |Invoke-Expression
```



新开一个窗口,看脚本有无运行.

> 若出现以下错误:
>
> ```cpp
> 无法加载文件C:\Users\xxx\Documents\WindowsPowerShell\profile.ps1，因为在此系统上禁止运行脚本
> ```
>
> 解决方案：
>
> win+x（或右键任务栏的Windows图标），选择以管理员身份运行powershell（Windows终端)/Fluent Terminal，输入以下命令，重新打开终端即可成功执行
>
> ```sql
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned
> ```

2. 更换主题

输入以下命令查看主题,会看到噼里啪啦一大堆主题样式都会蹦出来，选一个喜欢的

```sql
Get-PoshThemes
```

最后会得到所有主题的路径

![image-20240225215638983](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202402252205758.png)

复制路径,在这里比如我想使用`catppuccin`的主题,那么我就输入

```bash
notepad $profile
```

然后更改命令为如下路径

![image-20240225215821096](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img//202402252205792.png)

新开一个窗口,观察主题有无发生改变,在这个过程中很可能会出现一些图标不显示，显示一半，或者各种方框乱码，那都是字体的问题，多重启windows Terminal几次，总会成功的。

### 3.方向键补全+tab

用管理员身份打开终端输入

```cpp
Install-Module PSReadLine  
```

若出现如下提示：

![image-20240421230608222](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202404212306425.png)

则输入以下命令：

```bash
Install-Module PSReadLine -f 
```

依据提示进行安装,安装完后配置文件

```cpp
notepad $profile
```

输入以下命令保存

```cpp
# Shows navigable menu of all options when hitting Tab
Set-PSReadlineKeyHandler -Key Tab -Function MenuComplete

# Autocompletion for arrow keys
Set-PSReadlineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadlineKeyHandler -Key DownArrow -Function HistorySearchForward

# auto suggestions
Import-Module PSReadLine
Set-PSReadLineOption -PredictionSource History
```

保存后退出,再开一个窗口输入字母,看有无历史记录.

## Good Luck

少折腾,好看,能用就行