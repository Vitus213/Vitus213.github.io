---
title: "DragonOS寒训营lab1"
description: "引导性lab，滞后的报告"
date: "Jan 19 2025"
tags: ["学习笔记", "Rust"]
category: "DragonOS"
---


# Week1 Report

>[Week1发布地址](https://bbs.dragonos.org.cn/t/topic/438/3)

> 这个lab在刚发布那天就搞定了，但是这几日有些忙，现在在家里写这个lab交差，吐槽下下远程连虚拟机好像确实有点卡，可能是网络质量不太好

## Lab1

### lab1-1，2

简单使用`actix-web`，写一个用get请求会返回Hello的程序，这里本人直接打开了`actix-web`的介绍官网，然后抄了给的`hello-world`的源码改了改了事。

```rust
use actix_web::{get, web, App, HttpResponse, HttpServer, Responder,http::header};
#[get("/hello")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!\n")
}

#[get("/echo/your_name")]
async fn echo() -> impl Responder {
    HttpResponse::Ok().body("Hello your_name!\n")
}

async fn manual_hello() -> impl Responder {
    HttpResponse::Ok().body("Hey")
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(hello)
            .service(echo)
            .route("/hey", web::get().to(manual_hello))
    })
    .bind(("127.0.0.1", 8888))?
    .run()
    .await
}
```

模拟运行结果如图：

![image-20250119190225438](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202501192104409.png)

### lab1-3

添加个`CORS`主要目的是了解`CORS`的功能和概念，为后面使用`SwaggerUi`做铺垫.

修改版代码

```rust
use actix_web::{get, web, App, HttpResponse, HttpServer, Responder,http::header};
use actix_cors::Cors;

#[get("/hello")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!\n")
}

#[get("/echo/your_name")]
async fn echo() -> impl Responder {
    HttpResponse::Ok().body("Hello your_name!\n")
}

async fn manual_hello() -> impl Responder {
    HttpResponse::Ok().body("Hey")
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        let cors = Cors::permissive();
        App::new()
            .wrap(cors)
            .service(hello)
            .service(echo)
            .route("/hey", web::get().to(manual_hello))
    })
    //.bind(("192.168.199.248", 8888))?
    .bind(("127.0.0.1",8888))?
    .run()
    .await
}
```



### lab1-4

用`Docker`部署一个`SwaggerEditor`

```
docker pull swaggerapi/swagger-editor
docker run -d -p 8080:8080 swaggerapi/swagger-editor
```

编辑`Api`文档，并将主机设置为服务器的ip地址，其模拟的是用Api接口对正在运行的web程序进行调用，测试结果如下

![image-20250119201512645](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202501192104464.png)

> ps:犯蠢在`SweaggerEditor`的里面的ip地址填了实验室机子在局域网下的ip地址，导致一直连不上，虽然现在也是对一堆ip地址和相互之间的调用晕头转向，计网些许复杂

## Lab2

### Lab2-1

封装Rust程序进入Docker镜像

按照给定的Hints构建Docker镜像，然后ip地址使用内网ip，运行后访问得如下

```
docker buildx build -t actix-example:v0.1 .
docker run -p 8888:8888 actix-example:v0.1
```



![image-20250119205031802](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202501192104489.png)

同时程序的监控ip地址记得要改成内网ip。

### Lab2-2

`-d`参数是转为后台运行.

> 知识补充：
>
> 为了避免每次run都重新让镜像生成容器，可以在生成第一个容器后用start和stop命令来控制容器的开启和停止，用ps命令来观察容器的状态和数量，而且每次start是默认在后台start，就不用添加-d参数。（这个是docker的老本了）

## 小结

认为这个Week1的lab很轻松，给了大量的提示和教导，可以说是宝宝级别的开拓眼见指导。感谢DLC。

这几天学了很多`Rust`相关知识，但是学到现在感觉自己要回头重新补课了，学到生命周期和迭代器已经彻底的昏头转向。