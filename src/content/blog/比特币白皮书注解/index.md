---
title: "比特币白皮书注解"
description: "区块链，去中心化的艺术！"
date: "Jul 11 2024"
tags: ["学习笔记", "区块链"]
category: "BLOCKCHAIN"
---


# 白皮书注解

## 资源下载

> 中本聪的比特币白皮书下载
>
> [英文原版](https://bitcoin.org/bitcoin.pdf)
>
> [中文翻译版](https://bitcoin.org/files/bitcoin-paper/bitcoin_zh_cn.pdf)



## 2.Transcation

>Each owner transfers the coin to the next by digitally signing a hash of the previous transaction and the public key of the next owner and adding these to the end of the coin. A payee can verify the signatures to verify the chain of ownership.

交易链条为：

o-->1-->2-->3

每个主体都有public key 和 private key，其中private key --》signature。

即付款人会根据前一次交易的哈希值和收款人的public key进行 signature，(使用自己的私钥对当前交易的哈希值和接收者的公钥进行数字签名。数字签名是一种使用私钥加密特定信息（如哈希值）的方式，只有签名者的公钥才能验证签名的真实性。)收款人会使用发送者的公钥验证数字签名的真实性。如果签名有效，这证明了签名确实是由发送者（即之前的所有者）生成的，且签名中的数据（即哈希值和接收者的公钥）在签名后未被篡改。

所以对于这幅图，我们应该这样子看：

只看中间的，将coin from 1 to 2 的过程，the 1's signature can be verified by 1's public key ,and the 1's private key generate the 1's signature with the previous transaction and the public key of the next owner(2).

~~在图一看了两天才终于看懂，服了~~

![image-20240711205946226](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202407112309728.png)

>we need a system for participants to agree on a single history of the order in which they were received. The payee needs proof that at the time of each transaction, the majority of nodes agreed it was the first received.

共识！

## 3.Timestamp Sever



## 4.Proof-of-Work

为了实现分布式时间戳服务器，所以要招募矿工来往上上传Block

>The average work required is exponential in the number of zero bits required and can be verified by executing a single hash.

即通过计算求得所满足条件的Hash值，而CPU性能越好的人猜出来的概率越大，这就是proof of work

> Once the CPU effort has been expended to make it satisfy the proof-of-work, the block cannot be changed without redoing the work. As later blocks are chained after it, the work to change the block would include redoing all the blocks after it.

满足了条件后不能修改这个块，所以不会出现这样一种情况：提前确定好块上传的权力，然后再往里面填写交易信息，这样子会产生double spending。

>To modify a past block, an attacker would have to redo the proof-of-work of the block and all blocks after it and then catch up with and surpass the work of the honest nodes.

Attacker想要改变其中的块不能直接更改，需要上传更改块和更改后的所有块，并且超过honest nodes ‘s chain，后续会通过泊松分布来证明当attacker的算力小于51%时，极难篡改交易信息。

## 5.Network

>1) New transactions are broadcast to all nodes.
>
>2) Each node collects new transactions into a block.
>
>3) Each node works on finding a difficult proof-of-work for its block.
>
>4) When a node finds a proof-of-work, it broadcasts the block to all nodes.
>
>5) Nodes accept the block only if all transactions in it are valid and not already spent.
>
>6) Nodes express their acceptance of the block by working on creating the next block in the chain, using the hash of the accepted block as the previous hash.

简洁高效的描绘一整个流程，广播交易，收集交易，打包成块，找到proog-of-work,满足成链条件，广播块，接受块，循环往复

>Nodes always consider the longest chain to be the correct one and will keep working on extending it.

即使存在两个node同时find 的情况，也仅仅这是会有一个毛刺，nodes随机确定chain，在下一次find后都将移到the longest chain 上工作！

> Block broadcasts are also tolerant of dropped messages. If a node does not receive a block, it will request it when it receives the next block and realizes it missed one.

容错！

## 6.Incentive

> By convention, the first transaction in a block is a special transaction that starts a new coin owned by the creator of the block. This adds an incentive for nodes to support the network, and provides a way to initially distribute coins into circulation, since there is no central authority to issue them. The steady addition of a constant of amount of new coins is analogous to gold miners expending resources to add gold to circulation. In our case, it is CPU time and electricity that is expended.

矿工名字的由来，消耗CPU的时间和算力来换取resources to circulation

Transaction fees

> Once a predetermined number of coins have entered circulation, the incentive can transition entirely to transaction fees and be completely inflation free.

在一定数量的coins进入市场后，可以取消incentive，将其全部转化为incentive，相当于大家想要让nodes帮他上传交易，就需要交一点服务费。

> He ought to find it more profitable to play by the rules, such rules that favour him with more new coins than everyone else combined, than to undermine the system and the validity of his own wealth.

同时the incentive 能让那些greedy放弃犯罪扰乱秩序，因为他使用超过honest nodes的算力拿来挖矿会更划算，增长自身财富同时维持市场稳定性。

不怕你算力大，就怕你硬钢市场，一损俱损！

## 7.Reclaiming Disk Space

>Once the latest transaction in a coin is buried under enough blocks, the spent transactions before it can be discarded to save disk space. To facilitate this without breaking the block's hash, transactions are hashed in a Merkle Tree , with only the root included in the block's hash. Old blocks can then be compacted by stubbing off branches of the tree. The interior hashes do not need to be stored.

![image-20240711222700867](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202407112309736.png)

只保留头部区块，极大地压缩空间

**但是我还不知道为什么一个block里面有这么多hash，是每一个交易都会根据前一个交易然后生成一个新的hash，然后一步一步套着最后只有一个hash，但是这种情况下如何溯源coin的交易呢，即谁谁谁到底有多少coins？**



## 8.Simplified Payment Verification

> obtain the Merkle branch linking the transaction to the block it's timestamped in. He can't check the transaction for himself, but by linking it to a place in the chain, he can see that a network node has accepted it, and blocks added after it further confirm the network has accepted it.

通过不完整的节点也能确认支付，只要他在最长chain的block的merkle的分支下(与时间戳对应）即可。

> One strategy to protect against this would be to accept alerts from network nodes when they detect an invalid block, prompting the user's software to download the full block and alerted transactions to confirm the inconsistency. 

减少attackers控制大多数算力情况的损失



## 9.Combining and Splitting Value

> where a transaction depends on several transactions, and those transactions depend on many more, is not a problem here. There is never the need to extract a complete standalone copy of a transaction's history.

为什么不需要展开之前的交易历史呢，不展开之前的怎么知道我现在够不够钱进行下一次交易呢？



## 10.Privacy

Traditional Privacy Model and New Privacy Model

![image-20240711224903616](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202407112309745.png)

只要保持自己的公钥是匿名的，那么就像股市交易一样，公众只知道交易信息，不知道交易双方

> a new key pair should be used for each transaction to keep them from being linked to a common owner.

可以每次交易用不同的马甲，但存在并行输入multi-input，所以可能被发现



## **11.Calculations**

> We consider the scenario of an attacker trying to generate an alternate chain faster than the honest chain. Even if this is accomplished, it does not throw the system open to arbitrary changes, such as creating value out of thin air or taking money that never belonged to the attacker. Nodes are not going to accept an invalid transaction as payment, and honest nodes will never accept a block containing them. An attacker can only try to change one of his own transactions to take back money he recently spent.

Attacker破坏链条后能做的破坏也是有限的。

[解读计算过程](https://happypeter.github.io/binfo/calculations)

本小节主要通过数学公式说明了攻击者的成功可能性非常低。

## 12. Conclusion

> Any needed rules and incentives can be enforced with this consensus mechanism.

一种美妙的机制！

