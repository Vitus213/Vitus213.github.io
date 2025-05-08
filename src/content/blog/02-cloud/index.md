---
title: "☁️ 云服务"
description: "这个坑是为了 DragonOS 上云开的，会记录闲杂 tips"
date: "Nov 30 2024"
---

## Openstack

### Devstack 的疑难杂症

devstack `unstack.sh && clean.sh` 后，`ubuntu 22.04` 网络仍然无法正常拉起，
或许是 openswitch 的问题，或是 system-networkd 的问题。总之 `24-11-30` 
成功在本地的 `e5 2666v3` 机子上复现了先前 `unstack` 过的服务器，重启后无法正常
获取网络的问题。

另外那台服务器后来的解决方案是，把 `Ubuntu` 的网络后端从 `system-networkd` 改为
`NetworkManager`（后者是给 `Ubuntu Desktop` 使用的，不知道两者有啥区别）

### 本地可见的部署
https://docs.openstack.org/devstack/latest/networking.html

参考 devstack 部署，使用全新 ubuntu-server 24.04 lts。

~~为了能无缝接入内网，特购入一张网卡~~，`local.conf` 下添加如下信息
```ini
[[local|localrc]]
PUBLIC_INTERFACE=eth1
```

此处由给定网络设置：
> a floating ip range of 172.24.4.0/24 with the gateway of 172.24.4.1

譬如说原来用以给 `openstack` 管理的网卡 `eth1` 是在 `192.168.1.0/24` 子网下，
有IP地址 `192.168.1.3`，则直接在外层子网的网关处设置 `172.24.4.0/24` 到 
`192.168.1.3` 的静态路由即可。

完了之后，在外面这个子网下直接就能访问到实例了。

> 我不知道有没有人这么蠢，反正我部署的时候外面的路由开着clash，规则里没添加 `172.24.4.0/24` 
的例外，结果添加一条静态路由给路由表干废了。所以说运维须谨慎，网络设置记得多留个心眼。

### Cloud-init
> 更新于 24-12-11

常用的就是换个源，譬如清华源
```yaml
#cloud-config
apt:
    sources_list: |
      Types: deb
      URIs: http://mirrors.tuna.tsinghua.edu.cn/ubuntu
      Suites: $RELEASE $RELEASE-updates $RELEASE-backports
      Components: main restricted universe multiverse
      Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

      Types: deb
      URIs: http://mirrors.tuna.tsinghua.edu.cn/ubuntu
      Suites: $RELEASE-security
      Components: main restricted universe multiverse
      Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

安装 docker
```yaml
#cloud-config
apt:
    sources_list: |
      Types: deb
      URIs: http://mirrors.tuna.tsinghua.edu.cn/ubuntu
      Suites: $RELEASE $RELEASE-updates $RELEASE-backports
      Components: main restricted universe multiverse
      Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

      Types: deb
      URIs: http://mirrors.tuna.tsinghua.edu.cn/ubuntu
      Suites: $RELEASE-security
      Components: main restricted universe multiverse
      Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
runcmd:
  - sudo apt update
  - sudo apt install ca-certificates curl
  - sudo install -m 0755 -d /etc/apt/keyrings
  - sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  - sudo chmod a+r /etc/apt/keyrings/docker.asc
  - echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  - sudo apt update
  - sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```