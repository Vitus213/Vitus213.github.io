---
title: "faas-rs"
description: "FaaS 平台多租户认证系统"
date: "Apr 25 2025"
repoURL: "https://github.com/faas-rs/faasd-in-rust"
---

为轻量级 FaaS 平台实现完整的多租户认证系统（2000+ 行 Rust），支持用户注册、登录和函数访问控制。

**核心特性：**

- **JWT 认证**：基于 Actix-web 中间件实现 JWT (HS256) Bearer Token 认证，拦截并验证受保护路由的请求

- **安全密码哈希**：使用 Argon2id（密码哈希竞赛冠军算法）加盐哈希存储密码，防止彩虹表和 GPU 暴力破解攻击

- **数据库层**：PostgreSQL + Diesel (diesel-async) + bb8 异步连接池设计 DAO 层，标准化 CRUD 和类型安全查询

- **错误处理**：使用 thiserror 实现错误类型体系，ResponseError trait 统一错误响应；编写单元和集成测试覆盖核心流程
