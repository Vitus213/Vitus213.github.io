---
company: "DragonOS"
role: "Loop Device Driver Developer"
dateStart: "06/01/2025"
dateEnd: "09/30/2025"
---

为 DragonOS 内核实现 Linux 兼容的 Loop 块设备驱动（3000+ 行 Rust），将文件封装为块设备支持镜像挂载。

**核心工作：**

- **架构设计**：采用控制平面/数据平面分离架构，loop-control 字符设备管理生命周期，loopX 块设备处理数据 I/O

- **状态机**：设计五状态有限状态机（Unbound→Bound→Rundown→Draining→Deleting），实现并发 I/O 安全删除

- **抽象层**：实现 BlockDevice/Device/KObject/IndexNode 四层 trait 抽象，与内核设备模型和 VFS 深度集成

- **并发安全**：使用 AtomicU32 + RAII IoGuard 跟踪活跃 I/O，SpinLock 保护状态，Arc/Weak 避免循环引用
