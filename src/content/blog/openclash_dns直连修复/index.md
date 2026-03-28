---
title: 游戏直连规则无效？真正原因在 DNS
slug: openclash-game-dns-fix
summary: OpenClash 游戏平台直连规则无效的真正原因不是配置错误，而是 DNS 解析被代理接管。配置 DNS Policy 强制使用国内 DNS，一键修复暴雪战网、Steam 等 9 大平台连接问题。
description: OpenClash 配置了游戏平台直连规则仍然连不上？不是规则写错了，是 DNS 解析出了问题。本文详解问题根源和解决方案，涵盖暴雪战网、Steam、EA、Epic、Riot 等主流游戏平台，通过 DNS Policy 配置强制使用国内 DNS，彻底解决游戏平台连接异常。
tags:
  - OpenWrt
  - OpenClash
  - DNS
Date: 2026-03-28
---

# 游戏直连规则无效？真正原因在 DNS

## 一、问题表现

### 暴雪战网
- 战网客户端无法正常登录或登录后显示"无网络连接"
- 游戏服务器列表显示为空或无法连接到国服
- 明明配置了游戏平台直连规则，但流量仍被代理

### Steam 平台
- Steam 登录缓慢或失败
- 商店页面加载缓慢
- 游戏下载/更新速度异常
- 好友列表无法显示

### 其他游戏平台
- Epic Games 启动器无法登录
- Origin/Apex Legends 连接服务器超时
- Riot Games (LOL/瓦罗兰特) 服务器连接异常

---

## 二、环境信息

### 网络环境
- **路由器**: OpenWrt（IP: 192.168.111.1）
- **代理工具**: OpenClash（luci-app-openclash - 0.47.028）
- **系统**: Linux ImmortalWrt 6.6.110
- **配置文件**: `/etc/openclash/config/赔钱分流.yaml`

### OpenClash 配置
- **DNS 模式**: Fake-IP
- **代理模式**: Rule（规则模式）
- **游戏平台分流**: 配置为直连（DIRECT）

---

## 三、问题分析

### 根本原因

虽然配置文件中游戏平台被设置为"直连"，但 **DNS 解析层面存在问题**：

1. **DNS 被代理接管** — OpenClash 会拦截所有 DNS 请求
2. **DNS 服务器选择** — 默认使用代理或远程 DNS 服务器解析域名
3. **解析结果异常**:
   - 暴雪战网域名被解析到海外节点 IP
   - Steam 域名被解析到非国服节点
   - 客户端根据错误的 IP 尝试连接，导致失败

### 问题流程图

```
游戏客户端发起请求
    ↓
DNS 查询 (battle.net / steampowered.com 等)
    ↓
OpenClash 拦截 DNS 请求
    ↓
使用代理 DNS 或远程 DNS 解析
    ↓
返回海外/非国服 IP 地址  ← 问题所在
    ↓
客户端连接到错误的服务器 → 连接失败
```

> **为什么直连规则无效？**

> 直连规则只处理流量路由，不影响 DNS 解析。当 DNS 已经返回错误的 IP 后，直连规则只是让客户端"直接"连接到错误的 IP。**必须从 DNS 源头修复**，确保域名解析到正确的服务器。

---

## 四、解决办法

### 方案概述

通过配置 OpenClash 的 **DNS Policy（域名策略）**，强制游戏平台域名使用国内 DNS 服务器解析，确保返回国服/亚洲节点 IP。

### 实施步骤

#### 步骤 1: SSH 连接到路由器

```bash
ssh root@192.168.111.1
# 输入密码
```

#### 步骤 2: 编辑 DNS 策略文件

```bash
vi /etc/openclash/custom/openclash_custom_domain_dns_policy.list
```

#### 步骤 3: 添加游戏平台 DNS 规则

在文件末尾添加以下内容：

```bash
#暴雪战网国服 DNS - 强制使用国内 DNS
battle.net:114.114.114.114
battlenet.com.cn:114.114.114.114
blizzard.com:114.114.114.114
blzstatic.cn:114.114.114.114
blzddisk1.cn:114.114.114.114
blzddisk2.cn:114.114.114.114
blzddisk3.cn:114.114.114.114

#Steam 国服 DNS - 强制使用国内 DNS
steampowered.com:114.114.114.114
steamstatic.com:114.114.114.114
steamcommunity.com:114.114.114.114
steamchina.com:114.114.114.114
steamcontent.com:114.114.114.114
steamserver.net:114.114.114.114
steamcdn-a.akamaihd.net:114.114.114.114
clientconfig.akamai.net:114.114.114.114

#EA/Origin (Apex Legends)
ea.com:114.114.114.114
origin.com:114.114.114.114
ea.com.akadns.net:114.114.114.114

#Epic Games
epicgames.com:114.114.114.114
epicgames.dev:114.114.114.114
unrealengine.com:114.114.114.114
fortnite.com:114.114.114.114
helpshift.com:114.114.114.114

#Riot Games (LOL/瓦罗兰特)
riotgames.com:114.114.114.114
leagueoflegends.com:114.114.114.114
riot.com:114.114.114.114

#Ubisoft (uplay)
ubisoft.com:114.114.114.114
uplay.com:114.114.114.114

#Rockstar Games
rockstargames.com:114.114.114.114

#Microsoft Xbox
xbox.com:114.114.114.114
xboxlive.com:114.114.114.114
gamepass.com:114.114.114.114

#Sony PlayStation
playstation.com:114.114.114.114

#Nintendo
nintendo.com:114.114.114.114
nintendonetwork.net:114.114.114.114

#Minecraft
minecraft.net:114.114.114.114
mojang.com:114.114.114.114
```

#### 步骤 4: 重启 OpenClash

```bash
/etc/init.d/openclash restart
```

或通过 Web 界面：OpenClash → 覆盖设置 → 重启插件

#### 步骤 5: 验证配置

```bash
# 检查 DNS 策略是否生效
cat /etc/openclash/custom/openclash_custom_domain_dns_policy.list | grep -E "battle|steam"

# 检查 OpenClash 运行状态
ps | grep clash
```

---

## 五、修复后的效果

### 预期结果

| 平台 | 修复效果 |
|------|----------|
| **暴雪战网** | 正常登录国服，游戏服务器列表正常显示 |
| **Steam** | 登录快速，商店/社区正常访问，下载速度正常 |
| **EA/Origin** | Apex Legends 等游戏正常连接亚洲服务器 |
| **Epic Games** | 启动器正常登录，游戏库正常加载 |
| **Riot Games** | LOL/瓦罗兰特正常连接国服/亚服 |
| **其他平台** | 各平台均能正常连接对应地区服务器 |

### 验证方法

1. **暴雪战网**: 打开战网客户端，应该能直接看到国服服务器
2. **Steam**: 查看右下角服务器显示，应为「CN: 中国大陆」或「Asia: 亚洲」
3. **游戏内延迟**: 游戏内 ping 值应在正常范围（通常 < 100ms）

---

## 六、常见问题

### Q1: 添加规则后仍然无法连接？

请检查以下几点：
1. 确认 OpenClash 已重启且规则生效
2. 清空游戏客户端缓存后重启
3. 尝试刷新 DNS: `ipconfig /flushdns` (Windows)

### Q2: 想要连接国际服怎么办？

将对应域名的 DNS 服务器注释掉或删除即可：

```bash
#steampowered.com:114.114.114.114  # 注释后使用代理 DNS，可访问国际服
```

### Q3: 还有其他游戏域名需要添加？

可以通过游戏客户端的网络日志查看实际访问的域名，然后按相同格式添加到 DNS 策略文件中。

---

## 七、附录

### 当前配置文件路径

| 文件 | 路径 |
|------|------|
| DNS 策略 | `/etc/openclash/custom/openclash_custom_domain_dns_policy.list` |
| 主配置 | `/etc/openclash/config/赔钱分流.yaml` |
| 配置备份 | `/etc/openclash/backup/` |

### 国内 DNS 服务器选项

| DNS | 地址 | 说明 |
|-----|------|------|
| 114 DNS | 114.114.114.114 | 国内通用 DNS |
| 阿里 DNS | 223.5.5.5 | 阿里提供的 DNS |
| 腾讯 DNS | 119.29.29.29 | 腾讯提供的 DNS |
| DNSPod DoH | https://doh.pub/dns-query | 支持 DoH |

### 参考链接

- [OpenClash 官方文档](https://github.com/vernesong/OpenClash)
- [Clash DNS 配置](https://lancellc.gitbook.io/clash/clash-config-file/dns)
