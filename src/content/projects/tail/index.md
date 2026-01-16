---
title: "TaiL"
description: "专为 Hyprland/Wayland 设计的窗口使用时间追踪工具"
date: "Jan 16 2025"
repoURL: "https://github.com/vitus213/tail"
---

专为 Hyprland/Wayland 设计的窗口使用时间追踪工具，参考 Windows 下 Tai 软件和 ActivityWatch 的设计理念。

## 功能特性

- **自动窗口追踪** - 通过 Hyprland IPC 实时监听窗口活动
- **可视化统计** - 原生 GUI 界面展示使用数据
- **AFK 检测** - 自动检测空闲时间
- **目标限制** - 设置应用使用时长限制和提醒
- **多维度统计** - 按小时/天/周/月查看时间分布

## 技术栈

| 类别 | 技术 |
|------|------|
| 语言 | Rust 1.84+ |
| 运行时 | Tokio |
| 数据库 | SQLite |
| GUI | egui/eframe |

## 项目结构

- `tail-core` - 核心数据模型和数据库
- `tail-hyprland` - Hyprland IPC 客户端
- `tail-afk` - AFK 检测模块
- `tail-gui` - egui 界面
- `tail-service` - 后台服务
- `tail-app` - 应用入口
