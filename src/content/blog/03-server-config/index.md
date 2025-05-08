---
title: "Series configurations on Self-hosted bare-metal Server"
description: "Try NixOS and found it wonderful."
date: "Mar 28 2025"
---

## ZFS as k8s storage class on NixOS
Here we have 6 * 1TB HDD in our server. `/dev/sdd*` is the boot disk.

It's possible to use [Disko](https://nixos.wiki/wiki/Disko) to manage our disks, but not nessesary.

```shell
[dragonos@nixos:~]$ ls /dev/sd*
/dev/sda /dev/sdb /dev/sdc /dev/sdd  /dev/sdd1  /dev/sdd2 /dev/sde /dev/sdf /dev/sdg
```

### ZFS on NixOS

To create a ZFS pool on an existing NixOS, first [enable ZFS on NixOS](https://openzfs.github.io/openzfs-docs/Getting%20Started/NixOS/index.html)

And we create a raidz1 pool (to get detailed disk name, `ls /dev/disk/by-id`:
```shell
sudo zpool create -f -o ashift=12 tank raidz1 \
ata-HGST_HTS721010A9E630_JR1004BDGMHDRM \
ata-HGST_HTS721010A9E630_JR1004BDGMHE1M \
ata-HGST_HTS721010A9E630_JR1004BDGMHSJM \
ata-HGST_HTS721010A9E630_JR1004BDGMJEWM \
ata-HGST_HTS721010A9E630_JR1004BDGMJK6M \
ata-HGST_HTS721010A9E630_JR1004BDGMPAZM
```

Create service for pool:
```shell
sudo zfs create tank/k8s -o mountpoint=/var/lib/k8s-storage
```

Check pool status:
```shell
$ zpool status tank
  pool: tank
 state: ONLINE
config:

	NAME                                         STATE     READ WRITE CKSUM
	tank                                         ONLINE       0     0     0
	  raidz1-0                                   ONLINE       0     0     0
	    ata-HGST_HTS721010A9E630_JR1004BDGMHDRM  ONLINE       0     0     0
	    ata-HGST_HTS721010A9E630_JR1004BDGMHE1M  ONLINE       0     0     0
	    ata-HGST_HTS721010A9E630_JR1004BDGMHSJM  ONLINE       0     0     0
	    ata-HGST_HTS721010A9E630_JR1004BDGMJEWM  ONLINE       0     0     0
	    ata-HGST_HTS721010A9E630_JR1004BDGMJK6M  ONLINE       0     0     0
	    ata-HGST_HTS721010A9E630_JR1004BDGMPAZM  ONLINE       0     0     0

errors: No known data errors
```

### ZFS CSI Driver

Install the driver provided by OpenEBS, using helm.

Following [this](https://openebs.github.io/openebs/)

### Create a ZFS Storage Class

As description in [this](https://openebs.io/docs/user-guides/local-storage-user-guide/local-pv-zfs/configuration/zfs-create-storageclass),

It appears that `allowVolumeExpansion` could be set as `true`