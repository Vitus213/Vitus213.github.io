---
title: "CSAPP的lab8-proxylab"
description: "这是一场和计算机的邂逅."
date: "Mar 10 2024"
updated: "Aug 19 2024"
tags: ["学习笔记", "CSAPP"]
category: "CSAPP"
---


> 这三章基础特别薄弱，对着答案做的lab，需要认真研究，花费更多时间思考！

# ProxyLab



## 课本知识研读

### Chapter 10 System-Level I/O

- Unix I/O functions

- Standard I/O functions
- Rio_functions

![image-20240819162957109](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202408191629012.png)

Use the standard I/O functions whenever possible

Don't use `scanf` or `rio_readlineb` to read binary files.--- because many `0xa`bytes

Use the Rio functions for I/O on network sockets.---Application processes communicate with processes running on other computers on other computers by reading and writing socket descriptors.

**Hints!: Use the `sprintf` function to format a string in memory and then send it to the socker using `rio_writen` .If you need formatted input ,use `rio_readlineb` to read an entire text line ,and then use `sscanf` to extract different fields from the text line.**

Because of some incompatible restrictions on Standard I/O and network files,Unix i/o rather than standard I/O should be used for network applications

### Chapter 11 Network Programming

Some Important Functions:

> The Client and Sever overview

![image-20240819173003018](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202408191737045.png)

#### Tiny Sever测试

我们打开Lab文件内容，cd到`tiny`文件夹，随便试一个端口，例如`./tiny 1435`,由于我是在docker中做实验，所以我直接访问`localhost：1435`就能得到如下界面

![image-20240819173752780](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202408191737587.png)

输入以下网址能传入参数，调用`cgi-bin`中的文件`adder`执行加法并返回结果

```bash
http://localhost:1435/cgi-bin/adder?1243&342
```

![image-20240819174121202](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202408191741326.png)

如果访问不存在的文件就会触发：



![image-20240819174320549](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202408191743925.png)

注意：在文件中储存语言txt类型文件以`html`的格式存储，故会有大量的`html`符号。

然后可以用Telnet测试一下，之后再补充。

[参考链接](https://www.cnblogs.com/yfceshi/p/7401085.html)

#### Tiny源码分析

所以我们就要分析一下在课本中最后给类tiny sever的每一个function，在这里会进行部分的注解便于我和读者理解

输入:client->Sever

example: 

```
Host Port
GET /home.html HTTP/1.0
```

解析请求头：

```
method： GET

uri： /home.html

version: HTTP/1.0
```

main程序

control functions 

```c++
int main(int argc, char **argv) 
{
    int listenfd, connfd;
    char hostname[MAXLINE], port[MAXLINE];
    socklen_t clientlen;
    struct sockaddr_storage clientaddr;

    /* Check command line args */
    if (argc != 2) {
	fprintf(stderr, "usage: %s <port>\n", argv[0]);
	exit(1);
    }
    listenfd = Open_listenfd(argv[1]);
    while (1) {
	clientlen = sizeof(clientaddr);
	connfd = Accept(listenfd, (SA *)&clientaddr, &clientlen); //line:netp:tiny:accept
        Getnameinfo((SA *) &clientaddr, clientlen, hostname, MAXLINE, 
                    port, MAXLINE, 0);
        printf("Accepted connection from (%s, %s)\n", hostname, port);
	doit(connfd);                                             //line:netp:tiny:doit
	Close(connfd);                                            //line:netp:tiny:close
    }
}
```

doit 

handle one HTTP request/response transaction

连接成功后处理请求头，将请求分为method，uri，version,通过string函数寻找裁切存储。

同时通过是否有`cgi-bin`这个参数来判断其是否是动态的。

```c++
/*
 * doit - handle one HTTP request/response transaction
 */
/* $begin doit */
void doit(int fd) 
{
    int is_static;
    struct stat sbuf;
    char buf[MAXLINE], method[MAXLINE], uri[MAXLINE], version[MAXLINE];
    char filename[MAXLINE], cgiargs[MAXLINE];
    rio_t rio;

    /* Read request line and headers */
    Rio_readinitb(&rio, fd);
    if (!Rio_readlineb(&rio, buf, MAXLINE))  //line:netp:doit:readrequest
        return;
    printf("%s", buf);
    sscanf(buf, "%s %s %s", method, uri, version);       //line:netp:doit:parserequest
    if (strcasecmp(method, "GET")) {                     //line:netp:doit:beginrequesterr
        clienterror(fd, method, "501", "Not Implemented",
                    "Tiny does not implement this method");
        return;
    }                                                    //line:netp:doit:endrequesterr
    read_requesthdrs(&rio);                              //line:netp:doit:readrequesthdrs

    /* Parse URI from GET request */
    is_static = parse_uri(uri, filename, cgiargs);       //line:netp:doit:staticcheck
    if (stat(filename, &sbuf) < 0) {                     //line:netp:doit:beginnotfound
	clienterror(fd, filename, "404", "Not found",
		    "Tiny couldn't find this file");
	return;
    }                                                    //line:netp:doit:endnotfound

    if (is_static) { /* Serve static content */          
	if (!(S_ISREG(sbuf.st_mode)) || !(S_IRUSR & sbuf.st_mode)) { //line:netp:doit:readable
	    clienterror(fd, filename, "403", "Forbidden",
			"Tiny couldn't read the file");
	    return;
	}
	serve_static(fd, filename, sbuf.st_size);        //line:netp:doit:servestatic
    }
    else { /* Serve dynamic content */
	if (!(S_ISREG(sbuf.st_mode)) || !(S_IXUSR & sbuf.st_mode)) { //line:netp:doit:executable
	    clienterror(fd, filename, "403", "Forbidden",
			"Tiny couldn't run the CGI program");
	    return;
	}
	serve_dynamic(fd, filename, cgiargs);            //line:netp:doit:servedynamic
    }
}
```

read_requesthdrs：

read HTTP request headers

```c++
void read_requesthdrs(rio_t *rp) 
{
    char buf[MAXLINE];

    Rio_readlineb(rp, buf, MAXLINE);
    printf("%s", buf);
    while(strcmp(buf, "\r\n")) {          //line:netp:readhdrs:checkterm
	Rio_readlineb(rp, buf, MAXLINE);
	printf("%s", buf);
    }
    return;
}
```

parse_uri

分割uri到filename 和cgi信息即：cgi信息指的是?后面的参数例如前面举得adder函数的例子，`?`后面的两个参数，中间有`&`号,filename指`./home.html`

parse URI into filename and CGI args return 0 if dynamic content, 1 if static

```c++

int parse_uri(char *uri, char *filename, char *cgiargs) 
{
    char *ptr;
    if (!strstr(uri, "cgi-bin")) {  /* Static content */ //line:netp:parseuri:isstatic
	strcpy(cgiargs, "");                             //line:netp:parseuri:clearcgi
	strcpy(filename, ".");                           //line:netp:parseuri:beginconvert1
	strcat(filename, uri);                           //line:netp:parseuri:endconvert1
	if (uri[strlen(uri)-1] == '/')                   //line:netp:parseuri:slashcheck
	    strcat(filename, "home.html");               //line:netp:parseuri:appenddefault
	return 1;
    }
    else {  /* Dynamic content */                        //line:netp:parseuri:isdynamic
	ptr = index(uri, '?');                           //line:netp:parseuri:beginextract
	if (ptr) {
	    strcpy(cgiargs, ptr+1);
	    *ptr = '\0';
	}
	else 
	    strcpy(cgiargs, "");                         //line:netp:parseuri:endextract
	strcpy(filename, ".");                           //line:netp:parseuri:beginconvert2
	strcat(filename, uri);                           //line:netp:parseuri:endconvert2
	return 0;
    }
}
```

serve_static

静态内容直接访问输出即可

copy a file back to the client 

```c++
void serve_static(int fd, char *filename, int filesize)
{
    int srcfd;
    char *srcp, filetype[MAXLINE], buf[MAXBUF];

    /* Send response headers to client */
    get_filetype(filename, filetype);    //line:netp:servestatic:getfiletype
    sprintf(buf, "HTTP/1.0 200 OK\r\n"); //line:netp:servestatic:beginserve
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "Server: Tiny Web Server\r\n");
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "Content-length: %d\r\n", filesize);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "Content-type: %s\r\n\r\n", filetype);
    Rio_writen(fd, buf, strlen(buf));    //line:netp:servestatic:endserve

    /* Send response body to client */
    srcfd = Open(filename, O_RDONLY, 0); //line:netp:servestatic:open
    srcp = Mmap(0, filesize, PROT_READ, MAP_PRIVATE, srcfd, 0); //line:netp:servestatic:mmap
    Close(srcfd);                       //line:netp:servestatic:close
    Rio_writen(fd, srcp, filesize);     //line:netp:servestatic:write
    Munmap(srcp, filesize);             //line:netp:servestatic:munmap
}
```

get_filetype

确定文件内容，函数再chapter 10中有出现

derive file type from file name

```c++
void get_filetype(char *filename, char *filetype) 
{
    if (strstr(filename, ".html"))
	strcpy(filetype, "text/html");
    else if (strstr(filename, ".gif"))
	strcpy(filetype, "image/gif");
    else if (strstr(filename, ".png"))
	strcpy(filetype, "image/png");
    else if (strstr(filename, ".jpg"))
	strcpy(filetype, "image/jpeg");
    else
	strcpy(filetype, "text/plain");
}  
```

serve_dynamic

run a CGI program on behalf of the client

```c++
void serve_dynamic(int fd, char *filename, char *cgiargs) 
{
    char buf[MAXLINE], *emptylist[] = { NULL };

    /* Return first part of HTTP response */
    sprintf(buf, "HTTP/1.0 200 OK\r\n"); 
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "Server: Tiny Web Server\r\n");
    Rio_writen(fd, buf, strlen(buf));
  
    if (Fork() == 0) { /* Child */ //line:netp:servedynamic:fork
	/* Real server would set all CGI vars here */
	setenv("QUERY_STRING", cgiargs, 1); //line:netp:servedynamic:setenv
	Dup2(fd, STDOUT_FILENO);         /* Redirect stdout to client */ //line:netp:servedynamic:dup2
	Execve(filename, emptylist, environ); /* Run CGI program */ //line:netp:servedynamic:execve
    }
    Wait(NULL); /* Parent waits for and reaps child */ //line:netp:servedynamic:wait
}
```

clienterror

报错信息，负责输出html报错语言，输出记得要用Rio_Writen函数

returns an error message to the client

```c++
void clienterror(int fd, char *cause, char *errnum, 
		 char *shortmsg, char *longmsg) 
{
    char buf[MAXLINE];

    /* Print the HTTP response headers */
    sprintf(buf, "HTTP/1.0 %s %s\r\n", errnum, shortmsg);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "Content-type: text/html\r\n\r\n");
    Rio_writen(fd, buf, strlen(buf));

    /* Print the HTTP response body */
    sprintf(buf, "<html><title>Tiny Error</title>");
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<body bgcolor=""ffffff"">\r\n");
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "%s: %s\r\n", errnum, shortmsg);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<p>%s: %s\r\n", longmsg, cause);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<hr><em>The Tiny Web server</em>\r\n");
    Rio_writen(fd, buf, strlen(buf));
}
```



### Chapter 12 Concurrent Programming 

了解下锁和多线程，读者所，写者锁的内容即可。我还没读，只有浅显的了解。

## Lab

### 环境调试

1. Docker 中容器开启多个终端会话

[参考链接]([Docker :如何为一个正在运行的容器启动多个控制台/终端？-腾讯云开发者社区-腾讯云 (tencent.com)](https://cloud.tencent.com/developer/ask/sof/114053010))

```bash
docker ps -a
docker exec -it ID bash
```

2. Debug 工具

curl

ubuntu中需要提前安装： `sudo apt install curl`

> You can use curl to generate HTTP requests to any server, including your own proxy. It is an extremely useful debugging tool. For example, if your proxy and Tiny are both running on the local machine, Tiny is listening on port 15213, and proxy is listening on port 15214, then you can request a page from Tiny via your proxy using the following curl command: linux> curl-v--proxy http://localhost:15214 http://localhost:15213/home.html

Telnet:用法：

```bash
Telnet localhost port
GET /home.html HTTP 1.0
```

### 目标总览

>In this lab, you will write a simple HTTP proxy that caches web objects. For the first part of the lab, you will set up the proxy to accept incoming connections, read and parse requests, forward requests to web servers, read the servers’ responses, and forward those responses to the corresponding clients. This first part will involve learning about basic HTTP operation and how to use sockets to write programs that communicate over network connections. In the second part, you will upgrade your proxy to deal with multiple concurrent connections. This will introduce you to dealing with concurrency, a crucial systems concept. In the third and last part, you will add caching to your proxy using a simple main memory cache of recently accessed web content.、

这次要做的就是接受client的请求并分析转发后给sever，再把得到的数据转发个client。

### Part1

**Implementing a sequential web proxy**

这是在脚本中分别调用PROXY和TINY的命令。

![image-20240819181935660](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202408191819502.png)

实现顺序web代理

1、在main()里面创建一个监听描述符listenfd，然后在while的循环体里不断尝试与客户端进行连接connfd=Accept(listenfd)。连接成功后将connfd传入请求处理函数handleRequest()中。

2、进入handRequest()后，分别创建好两个I/O缓冲区rio_Proxy2Client和rio_Proxy2Server，Proxy可以利用这两个不同的缓冲区分别和Client与Server进行读写操作。

3、利用rio_Proxy2Client读入http-request，并把这个请求分割成writeup要求的几部分，即method、uri、version；其中url又可以分割为hostName、port和fielName。

4、处理完request的第一行后，开始处理后序的四个request header，少哪个header就自己补上哪个header。

```
Client-> Proxy 	
GET http://www.cmu.edu:8080/hub/index.html HTTP/1.1

Proxy Prase:
GET /hub/index.html HTTP1.1
Host: www.cmu.edu
port: 8080

User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:10.0.3) Gecko/20120305 Firefox/10.0.3

Connection: close

Proxy-Connection: close

Proxy->Tiny Sever

```

5、Proxy利用刚才得到的hostName和port，调用clientfd=Open_clientfd()冒充一个Client与Server建立连接。

6、Proxy利用clientfd和rio_Proxy2Server，先把从Client处得到的http-request发送给Server，然后不断读入Server回复的response。Proxy在读入response的同时，又利用connfd把它们发送给Client。

7、还得加上一个如果method不是“GET”的错误处理函数，直接照着书上的敲一遍或者把tiny.c的那个clientError()复制过来就行。

**Hints**

>• As discussed in Section 10.11 of your textbook, using standard I/O functions for socket input and output is a problem. Instead, we recommend that you use the Robust I/O (RIO) package, which is provided in the csapp.c file in the handout directory.
>• The error-handling functions provide in csapp.c are not appropriate for your proxy because once a server begins accepting connections, it is not supposed to terminate. You’ll need to modify them or write your own.
>• You are free to modify the files in the handout directory any way you like. For example, for the sake of good modularity, you might implement your cache functions as a library in files called cache.c and cache.h. Of course, adding new files will require you to update the provided Makefile.
>
>• As discussed in the Aside on page 964 of the CS:APP3e text, your proxy must ignore SIGPIPE signals and should deal gracefully with write operations that return EPIPE errors.
>• Sometimes, calling read to receive bytes from a socket that has been prematurely closed will cause read to return -1 with errno set to ECONNRESET. Your proxy should not terminate due to this error either.
>• Remember that not all content on the web is ASCII text. Much of the content on the web is binary data, such as images and video. Ensure that you account for binary data when selecting and using functions for network I/O.
>• Forward all requests as HTTP/1.0 even if the original request was HTTP/1.1.
>Good luck!

只用搞定HTTP/1.0 GET请求

将HTTP/1.1的version信息换成HTTP/1.0

>Note that all lines in an HTTP request end with a carriage return, ‘\r’, followed by a newline, ‘\n’. Also
>important is that every HTTP request is terminated by an empty line: "\r\n".

#### 1. `main`

**Purpose**: The entry point of the program. It initializes the server, listens for incoming connections, and handles each request.

**Implementation**:
- **Command-Line Argument Check**:
  
  ```c
  if(argc != 2) {
      fprintf(stderr, "usage: %s <port>\n", argv[0]);
      exit(1);
  }
  ```
  Ensures the user has provided exactly one argument (the port number). If not, it prints a usage message and exits the program.
  
- **Open Listening Socket**:
  ```c
  listenfd = Open_listenfd(argv[1]);
  ```
  Initializes a listening socket on the specified port.

- **Main Loop**:
  
  ```c
  while(1) {
      clientlen = sizeof(clientaddr);
      connfd = Accept(listenfd, (SA *)&clientaddr, &clientlen);
      Getnameinfo((SA *)&clientaddr, clientlen, hostname, MAXLINE, port, MAXLINE, 0);
      printf("Accepted connection from (%s, %s)\n", hostname, port);
      handleRequest(connfd);
      Close(connfd);
  }
  ```
  Continuously accepts connections from clients. For each accepted connection, it prints the client’s address, calls `handleRequest` to process the request, and then closes the connection.

#### 2. `handleRequest`

**Purpose**: Handles HTTP requests from clients, forwards them to the target server, and sends the response back to the client.

**Implementation**:
- **Initialize I/O**:
  ```c
  Rio_readinitb(&rio, fd);
  ```
  Initializes the `rio` structure for reading from the client connection.

- **Read Request Line**:
  ```c
  if (!Rio_readlineb(&rio, buf, MAXLINE)) {
      printf("empty request\n");
      return;
  }
  ```
  Reads the request line from the client into the `buf` buffer. If the request is empty, it prints a message and returns.

- **Replace HTTP Version**:
  ```c
  replaceHTTPVersion(buf);
  ```
  the function

  ```c
  char *pos = NULL;
  if ((pos = strstr(buf, "HTTP/1.1")) != NULL) {
      buf[pos - buf + strlen("HTTP/1.1") - 1] = '0';
  }
  ```
  
  Converts the HTTP version from 1.1 to 1.0.
  
- **Parse Request Line**:
  
  ```c
  parseLine(buf, host, port, method, uri, version, filename);
  ```
  Parses the request line to extract HTTP method, URI, version, host, port, and filename.
  
- **Check Method**:
  
  ```c
  if (strcasecmp(method, "GET")) {
      clientError(fd, method, "501", "Not Implemented", "Tiny does not implement this method");
      return;
  }
  ```
  Checks if the HTTP method is GET. If not, it sends a 501 Not Implemented error response and returns.
  
- **Build and Send Request**:
  
  ```c
  int rv = MakeClientRequest(&rio, clientRequest, host, port, method, uri, version, filename);
  if (rv == 0) return;
  ```
  Calls `MakeClientRequest` to format the request for the target server. If formatting fails, it returns.
  
- **Handle Server Response**:
  ```c
  int clientfd = Open_clientfd(hostName, port);
  Rio_readinitb(&riotiny, clientfd);
  Rio_writen(riotiny.rio_fd, clientRequest, strlen(clientRequest));
  
  char tinyResponse[MAXLINE];
  int n;
  while ((n = Rio_readnb(&riotiny, tinyResponse, MAXLINE)) != 0) {
      Rio_writen(fd, tinyResponse, n);
  }
  ```
  Opens a connection to the target server, sends the formatted request, and then reads the response from the server and writes it back to the client.

#### 3. `MakeClientRequest`

**Purpose**: Constructs the HTTP request to be sent to the target server based on the client’s request.

**Implementation**:
- **Initialize Request**:
  
- 注意换行符是`\r\n`
  
  ```c
  sprintf(clientRequest, "GET %s HTTP/1.0\r\n", fileName);
  ```
  Initializes the request with the method (GET), the file name, and HTTP version 1.0.
  
- **Read and Process Headers**:
  ```c
  n = Rio_readlineb(rio, buf, MAXLINE);
  while (strcmp("\r\n", buf) != 0 && n != 0) {
      strcat(clientRequest, buf);
      
      if ((findp = strstr(buf, "User-Agent:")) != NULL) UserAgent = 1;
      if ((findp = strstr(buf, "Proxy-Connection:")) != NULL) ProxyConnection = 1;
      if ((findp = strstr(buf, "Connection:")) != NULL) Connection = 1;
      if ((findp = strstr(buf, "Host:")) != NULL) HostInfo = 1;
      
      n = Rio_readlineb(rio, buf, MAXLINE);
  }
  ```
  Reads headers from the client request and appends them to `clientRequest`. It also checks for specific headers like `User-Agent`, `Proxy-Connection`, `Connection`, and `Host`.

- **Add Missing Headers**:
  ```c
  if (HostInfo == 0) {
      sprintf(buf, "Host: %s\r\n", Host);
      strcat(clientRequest, buf);
  }
  if (UserAgent == 0) strcat(clientRequest, user_agent_hdr);
  if (Connection == 0) sprintf(buf, "Connection: close\r\n"); strcat(clientRequest, buf);
  if (ProxyConnection == 0) sprintf(buf, "Proxy-Connection: close\r\n"); strcat(clientRequest, buf);
  ```
  Adds missing headers like `Host`, `User-Agent`, `Connection`, and `Proxy-Connection` if they were not provided by the client.
  
- **Terminate Request**:
  ```c
  strcat(clientRequest, "\r\n");
  ```
  Adds a terminator for the HTTP request to indicate the end of the request headers.

#### 4. `replaceHTTPVersion`

**Purpose**: Replaces HTTP version 1.1 with 1.0 in the request line.

**Implementation**:
- **Find and Replace**:
  ```c
  char *pos = NULL;
  if ((pos = strstr(buf, "HTTP/1.1")) != NULL) {
      buf[pos - buf + strlen("HTTP/1.1") - 1] = '0';
  }
  ```
  Searches for "HTTP/1.1" in the buffer and replaces it with "HTTP/1.0".

#### 5. `parseLine`

**Purpose**: Parses the request line to extract method, URI, version, host, port, and filename.

**Implementation**:
- **Parse Request Line**:
  ```c
  sscanf(buf, "%s %s %s", method, uri, version);
  ```
  Uses `sscanf` to extract the HTTP method, URI, and version from the request line.

- **Extract Host, Port, and Filename**:
  
- `WEB_PREFIX="http://"`
  
  ```c
  char *hostp = strstr(uri, WEB_PREFIX) + strlen(WEB_PREFIX);
  char *slash = strstr(hostp, "/");
  char *colon = strstr(hostp, ":");
  
  strncpy(host, hostp, slash - hostp);
  strncpy(port, colon + 1, slash - colon - 1);
  strcpy(filename, slash);
  ```
  Extracts the host, port, and file path from the URI. 
  
  the host include the port

#### 6. `clientError`

**Purpose**: Generates and sends an HTTP error response to the client.

**Implementation**:
- **Build and Send Response Headers**:
  ```c
  sprintf(buf, "HTTP/1.0 %s %s\r\n", errnum, shortmsg);
  Rio_writen(fd, buf, strlen(buf));
  sprintf(buf, "Content-type: text/html\r\n\r\n");
  Rio_writen(fd, buf, strlen(buf));
  ```
  Creates the HTTP status line and content type header, then sends them to the client.

- **Build and Send Response Body**:
  ```c
  sprintf(buf, "<html><title>Tiny Error</title>");
  Rio_writen(fd, buf, strlen(buf));
  sprintf(buf, "<body bgcolor=\"ffffff\">\r\n");
  Rio_writen(fd, buf, strlen(buf));
  sprintf(buf, "%s: %s\r\n", errnum, shortmsg);
  Rio_writen(fd, buf, strlen(buf));
  sprintf(buf, "<p>%s: %s\r\n", longmsg, cause);
  Rio_writen(fd, buf, strlen(buf));
  sprintf(buf, "<hr><em>The Tiny Web server</em>\r\n");
  Rio_writen(fd, buf, strlen(buf));
  ```
  Creates and sends the HTML content of the error page, including the error number, short message, and detailed message.

#### 完整代码：

```c++
#include "csapp.h"
/* Recommended max cache and object sizes */
#define MAX_CACHE_SIZE 1049000
#define MAX_OBJECT_SIZE 102400
#define WEB_PREFIX "http://"
/* You won't lose style points for including this long line in your code */
static const char *user_agent_hdr = "User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:10.0.3) Gecko/20120305 Firefox/10.0.3\r\n";
void handleRequest(int);
void clientError(int , char* , char* , char* , char* );
int MakeClientRequest(rio_t* , char* , char*, char* , char* , char* , char*, char*);
int checkGetMethod(char* , char* , char* );
void replaceHTTPVersion(char* );
void parseLine(char* , char*, char* , char* , char* , char*, char*);
int main(int argc,char **argv)
{
    int listenfd,connfd;
    char hostname[MAXLINE],port[MAXLINE];
    socklen_t clientlen;
    struct sockaddr_storage clientaddr;
    //判断是否是两个命令
    if(argc!=2){
        fprintf(stderr,"usage: Fuck ,can you input only two string ?\nsuch as%s <port>\n", argv[0]);
       // printf("Fuck ,input right message \n");
        exit(1);
    }

    listenfd =Open_listenfd(argv[1]);   //listen a port
    while(1){
        clientlen =sizeof (clientaddr);
        connfd = Accept(listenfd ,(SA *)&clientaddr, &clientlen);
        Getnameinfo((SA *)&clientaddr ,clientlen,hostname ,MAXLINE,port,MAXLINE,0);
        printf("Accepted connection from (%s , %s)\n", hostname ,port);// accept了

        //Connection Succeed
        handlerequest(connfd);
        Close(connfd);
    }
    return 0;
}
void handlerequest(int fd){
    int is_static;
    struct stat sbuf;
    char buf[MAXLINE],method[MAXLINE],uri[MAXLINE],version[MAXLINE];// buf 
    char filename[MAXLINE];
    //request header
    char host[MAXLINE],port[MAXLINE];
    char clientRequest[MAXLINE];
    // IO for proxy--client ,proxy--server
    rio_t rio,riotiny;
    // Read request line and headers

    // step1: read request from client
    Rio_readinitb(&rio,fd);

    if(!Rio_readlineb(&rio ,buf, MAXLINE))//把输入的命令给到buf缓冲区
    {
        printf("empty request \n");
        return ;// empty-> close
    }
    // # HTTP/1.1 --> HTTp/1.0
    replaceHTTPVersion(buf);
   parseLine(buf,host,port,method,uri,version,filename);
    if(strcasecmp(method, "GET")){
        clienterror(fd, method, "501", "Not Implemented",
                    "Tiny does not implement this method");
        return ;
    }
    // parse uri from GET request 

    int rv=MakeClientRequest(&rio, clientRequest,host,port,method,uri,version,filename);
    if(rv==0)return ;

    printf("========= we have formatted the reqeust into ---------\n");
    printf("%s",clientRequest);

    char hostName[100];
    char* colon = strstr(host, ":");
    strncpy(hostName, host, colon - host);
    printf("host is %s\n", hostName);
    printf("port is %s\n", port);
    //模拟一个clientfd
    int clientfd = Open_clientfd(hostName, port);

    Rio_readinitb(&riotiny, clientfd);
    Rio_writen(riotiny.rio_fd, clientRequest, strlen(clientRequest));

    /** step4: read the response from tiny and send it to the client */
    printf("---prepare to get the response---- \n");
    char tinyResponse[MAXLINE];

    int n;
    
    while( (n = Rio_readnb(&riotiny, tinyResponse, MAXLINE)) != 0){
        Rio_writen(fd, tinyResponse, n);
    }
    
}
int MakeClientRequest(rio_t* rio, char* clientRequest, char* Host, char* port,
                        char* method, char* uri, char* version, char* fileName){
    int UserAgent = 0, Connection = 0, ProxyConnection = 0, HostInfo = 0;
    char buf[MAXLINE / 2];
    int n;

    /* 1. add GET HOSTNAME HTTP/1.0 to header && Host Info */
    sprintf(clientRequest, "GET %s HTTP/1.0\r\n", fileName);

    n = Rio_readlineb(rio, buf, MAXLINE);// n是读取的字节数
    printf("receive buf %s\n", buf);
    printf("n == %d\n", n);
    char* findp;
    while(strcmp("\r\n", buf) != 0 && n != 0){
        strcat(clientRequest, buf);
        printf("receive buf %s\n", buf);

        if( (findp = strstr(buf, "User-Agent:")) != NULL){
            UserAgent = 1;
        }else if( (findp = strstr(buf, "Proxy-Connection:")) != NULL){
            ProxyConnection = 1;
        }else if( (findp = strstr(buf, "Connection:")) != NULL){
            Connection = 1;
        }else if( (findp = strstr(buf, "Host:")) != NULL){
            HostInfo = 1;
        }
        n = Rio_readlineb(rio, buf, MAXLINE);
    }

    if(n == 0){
        return 0;
    }

    if(HostInfo == 0){
        sprintf(buf, "Host: %s\r\n", Host);
        strcat(clientRequest, buf);
    }

    /** append User-Agent */
    if(UserAgent == 0){
        strcat(clientRequest, user_agent_hdr);
    }
    
    /** append Connection */
    if(Connection == 0){
        sprintf(buf, "Connection: close\r\n");
        strcat(clientRequest, buf);
    }
    
    /** append Proxy-Connection */
    if(ProxyConnection == 0){
        sprintf(buf, "Proxy-Connection: close\r\n");
        strcat(clientRequest, buf);
    }

    /* add terminator for request */
    strcat(clientRequest, "\r\n");
    return 1;
}
void replaceHTTPVersion(char *buf){
    char *pos =NULL;
    if((pos=strstr(buf,"HTTP/1.1"))!=NULL){
        buf[pos-buf+strlen("HTTP/1.1")-1]='0';
    }
}

void parseLine(char* buf, char* host, char* port, char* method, char* uri, char* version, char* filename){
    sscanf(buf, "%s %s %s",method,uri,version);
    //method = "GET", uri = "http://localhost:15213/home.html", version = "HTTP1.0"
    char* hostp = strstr(uri, WEB_PREFIX) + strlen(WEB_PREFIX);
    char* slash = strstr(hostp, "/");
    char* colon = strstr(hostp, ":");
    //get host name
    strncpy(host, hostp, slash - hostp);  
    //get port number
    strncpy(port, colon + 1, slash - colon - 1);
    //get file name
    strcpy(filename, slash);
    /*
    host : localhost:15214
    filename: /home.html
    */

}
// html headers and response body
void clienterror(int fd,char *cause,char *errnum, char *shortmsg, char *longmsg){
    char buf[MAXLINE];
    /* Print the HTTP response headers */
    sprintf(buf, "HTTP/1.0 %s %s\r\n", errnum, shortmsg);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "Content-type: text/html\r\n\r\n");
    Rio_writen(fd, buf, strlen(buf));

    /* Print the HTTP response body */
    sprintf(buf, "<html><title>Tiny Error</title>");
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<body bgcolor=""ffffff"">\r\n");
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "%s: %s\r\n", errnum, shortmsg);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<p>%s: %s\r\n", longmsg, cause);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<hr><em>The Tiny Web server</em>\r\n");
    Rio_writen(fd, buf, strlen(buf));
}
```

### PART II

#### 测试大坑：

Driver.sh的301行左右，要修正

![image-20240818044744099](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202408180454911.png)

要有python程序执行nop-sever.py的脚本，需要使用`python --version`命令看自己的python是什么版本

#### 代码大纲

**主函数 (`main`)**：

- 初始化读写锁 (`rwlock_init`)，用于控制对共享资源的访问。
- 监听指定端口的连接请求。
- 接受客户端连接，并为每个连接创建一个新的线程进行处理 (`thread` 函数)。

**读写锁 (`rwlock_init`)**：

- 初始化了读锁和写锁，用于同步读写操作。

**线程处理函数 (`thread`)**：

- 分离当前线程，并调用 `handlerequest` 处理客户端请求。

**请求处理函数 (`handlerequest`)**：

- 读取客户端请求，解析请求行和头部信息。
- 调用 `MakeClientRequest` 构建发送到目标服务器的请求。
- 将目标服务器的响应返回给客户端。

**请求构建函数 (`MakeClientRequest`)**：

- 读取客户端请求头，处理必要的字段（如 User-Agent、Connection、Proxy-Connection 和 Host）。
- 形成完整的请求并准备发送到目标服务器。

**替换 HTTP 版本函数 (`replaceHTTPVersion`)**：

- 将 HTTP/1.1 替换为 HTTP/1.0，以兼容目标服务器。

**解析请求行函数 (`parseLine`)**：

- 解析请求行，提取主机、端口、URI 和文件名等信息。

**错误处理函数 (`Clienterror`)**：

- 构建并发送一个标准的 HTTP 错误响应给客户端。

#### 完整代码:

```c++
#include "csapp.h"
/* Recommended max cache and object sizes */
#define MAX_CACHE_SIZE 1049000
#define MAX_OBJECT_SIZE 102400
#define WEB_PREFIX "http://"
/* You won't lose style points for including this long line in your code */
static const char *user_agent_hdr = "User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:10.0.3) Gecko/20120305 Firefox/10.0.3\r\n";
void handlerequest(int);
void Clienterror(int , char* , char* , char* , char* );
int MakeClientRequest(rio_t* , char* , char*, char* , char* , char* , char*, char*);
int checkGetMethod(char* , char* , char* );
void replaceHTTPVersion(char* );
void parseLine(char* , char*, char* , char* , char* , char*, char*);
void *thread(void *v);
void rwlock_init();
struct rwlock_t{
    sem_t lock;
    sem_t writelock;
    int readers;
};
int nowpointer;
struct Cache cache[MAXLINE];
struct rwlock_t *rw;
int main(int argc,char **argv)
{
    rw= Malloc(sizeof(struct rwlock_t));
    pthread_t tid;
    int listenfd,connfd;
    rwlock_init();
    char hostname[MAXLINE],port[MAXLINE];
    socklen_t clientlen;
    struct sockaddr_storage clientaddr;
    //判断是否是两个命令
    if(argc!=2){
        fprintf(stderr,"usage: Fuck ,can you input only two string ?\nsuch as%s <port>\n", argv[0]);
       // printf("Fuck ,input right message \n");
        exit(1);
    }

    listenfd =Open_listenfd(argv[1]);   //listen a port
    while(1){
        clientlen =sizeof (clientaddr);
        connfd = Accept(listenfd ,(SA *)&clientaddr, &clientlen);
        Getnameinfo((SA *)&clientaddr ,clientlen,hostname ,MAXLINE,port,MAXLINE,0);
        printf("Accepted connection from (%s , %s)\n", hostname ,port);// accept了
        //Connection Succeed
       Pthread_create(&tid,NULL,(void*) thread,(void*)&connfd);
    }
    return 0;
}
void rwlock_init(){
    rw->readers=0;
    sem_init(&rw->lock,0,1);
    /*
    sem_init 是一个用于初始化信号量的函数。这里初始化了 rw->lock 信号量。
    0 表示信号量用于线程间同步（而非进程间同步）。
    1 表示信号量的初始值为 1，即该信号量是一个二值信号量，用于互斥访问。
    */
    sem_init(&rw->writelock,0,1);
}
void *thread(void *v){
    int fd=*(int*)v;
    Pthread_detach(pthread_self());
    handlerequest(fd);
   // Free(v);
    Close(fd);
    return ;
}
void handlerequest(int fd){
    char buf[MAXLINE],method[MAXLINE],uri[MAXLINE],version[MAXLINE];// buf 
    char filename[MAXLINE];
    //request header
    char host[MAXLINE],port[MAXLINE];
    char clientRequest[MAXLINE];
    // IO for proxy--client ,proxy--server
    rio_t rio,riotiny;
    // Read request line and headers

    // step1: read request from client
    Rio_readinitb(&rio,fd);

    if(!Rio_readlineb(&rio ,buf, MAXLINE))//把输入的命令给到buf缓冲区
    {
        printf("empty request \n");
        return ;// empty-> close
    }
    // # HTTP/1.1 --> HTTp/1.0
    replaceHTTPVersion(buf);
   parseLine(buf,host,port,method,uri,version,filename);
    if(strcasecmp(method, "GET")){
        Clienterror(fd, method, "501", "Not Implemented",
                    "Tiny does not implement this method");
        return ;
    }
    // parse uri from GET request 

    int rv=MakeClientRequest(&rio, clientRequest,host,port,method,uri,version,filename);
    if(rv==0)return ;

    printf("========= we have formatted the reqeust into ---------\n");
    printf("%s",clientRequest);
    char hostName[100];
    char* colon = strstr(host, ":");
    strncpy(hostName, host, colon - host);
    printf("host is %s\n", hostName);
    printf("port is %s\n", port);
    //模拟一个clientfd
    int clientfd = Open_clientfd(hostName, port);

    Rio_readinitb(&riotiny, clientfd);
    Rio_writen(riotiny.rio_fd, clientRequest, strlen(clientRequest));

    /** step4: read the response from tiny and send it to the client */

    printf("---prepare to get the response---- \n");
    char tinyResponse[MAXLINE];
    int n; 
    while( (n = Rio_readlineb(&riotiny, tinyResponse, MAXLINE)) != 0){
        Rio_writen(fd, tinyResponse, n);
    }
    close(clientfd);
    return ;  
}

int MakeClientRequest(rio_t* rio, char* clientRequest, char* Host, char* port,
                        char* method, char* uri, char* version, char* fileName){
    int UserAgent = 0, Connection = 0, ProxyConnection = 0, HostInfo = 0;
    char buf[MAXLINE / 2];
    int n;
    /* 1. add GET HOSTNAME HTTP/1.0 to header && Host Info */
    sprintf(clientRequest, "GET %s HTTP/1.0\r\n", fileName);

    n = Rio_readlineb(rio, buf, MAXLINE);// n是读取的字节数
    printf("receive buf %s\n", buf);
    printf("n == %d\n", n);
    char* findp;
    while(strcmp("\r\n", buf) != 0 && n != 0){
        strcat(clientRequest, buf);
        printf("receive buf %s\n", buf);

        if( (findp = strstr(buf, "User-Agent:")) != NULL){
            UserAgent = 1;
        }else if( (findp = strstr(buf, "Proxy-Connection:")) != NULL){
            ProxyConnection = 1;
        }else if( (findp = strstr(buf, "Connection:")) != NULL){
            Connection = 1;
        }else if( (findp = strstr(buf, "Host:")) != NULL){
            HostInfo = 1;
        }

        n = Rio_readlineb(rio, buf, MAXLINE);
    }

    if(n == 0){
        return 0;
    }
    if(HostInfo == 0){
        sprintf(buf, "Host: %s\r\n", Host);
        strcat(clientRequest, buf);
    }
    /** append User-Agent */
    if(UserAgent == 0){
        strcat(clientRequest, user_agent_hdr);
    }    
    /** append Connection */
    if(Connection == 0){
        sprintf(buf, "Connection: close\r\n");
        strcat(clientRequest, buf);
    }    
    /** append Proxy-Connection */
    if(ProxyConnection == 0){
        sprintf(buf, "Proxy-Connection: close\r\n");
        strcat(clientRequest, buf);
    }
    /* add terminator for request */
    strcat(clientRequest, "\r\n");
    return 1;
}
void replaceHTTPVersion(char *buf){
    char *pos =NULL;
    if((pos=strstr(buf,"HTTP/1.1"))!=NULL){
        buf[pos-buf+strlen("HTTP/1.1")-1]='0';
    }
}
void parseLine(char* buf, char* host, char* port, char* method, char* uri, char* version, char* filename){
    sscanf(buf, "%s %s %s",method,uri,version);
    //method = "GET", uri = "http://localhost:15213/home.html", version = "HTTP1.0"
    char* hostp = strstr(uri, WEB_PREFIX) + strlen(WEB_PREFIX);
    char* slash = strstr(hostp, "/");
    char* colon = strstr(hostp, ":");
    //get host name
    strncpy(host, hostp, slash - hostp);  
    //get port number
    strncpy(port, colon + 1, slash - colon - 1);
    //get file name
    strcpy(filename, slash);
    /*
    host : localhost:15214
    filename: /home.html
    */
}
// html headers and response body
void Clienterror(int fd,char *cause,char *errnum, char *shortmsg, char *longmsg)
{
    char buf[MAXLINE];
    /* Print the HTTP response headers */
    sprintf(buf, "HTTP/1.0 %s %s\r\n", errnum, shortmsg);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "Content-type: text/html\r\n\r\n");
    Rio_writen(fd, buf, strlen(buf));

    /* Print the HTTP response body */
    sprintf(buf, "<html><title>Tiny Error</title>");
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<body bgcolor=""ffffff"">\r\n");
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "%s: %s\r\n", errnum, shortmsg);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<p>%s: %s\r\n", longmsg, cause);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<hr><em>The Tiny Web server</em>\r\n");
    Rio_writen(fd, buf, strlen(buf));
}
```

### Part III

添加了一些cache即可

#### 代码重点：

读写cache其实就是给cache建立了一个数组，但是多线程读取写入的时候每次要记得上锁解锁。

##### cache结构体

```c++
struct Cache{
    int used;
    char key[MAXLINE];
    char value[MAX_OBJECT_SIZE];
};
```

##### write_cache

```c++
void writecache(char * buf,char *key){
    sem_wait(&rw->writelock);
    int index;
    while(cache[nowpointer].used!=0){
        cache[nowpointer].used=0;
        nowpointer=(nowpointer+1)%MAX_CACHE;

    }
    index =nowpointer;
    cache[index].used=1;
    strcpy(cache[index].key,key);
    strcpy(cache[index].value,buf);
    sem_post(&rw->writelock);
    return;
}
```

##### read_cache

```c++
int readcache(int fd,char *uri){
    sem_wait(&rw->lock);
    if(rw->readers==0)sem_wait(&rw->writelock);
    rw->readers++;
    sem_post(&rw->lock);
    int i;
    int flag=0;
    for(i=0;i<MAX_CACHE;i++){
        if(strcmp(uri,cache[i].key)==0){
            Rio_writen(fd,cache[i].value,strlen(cache[i].value));
        //    printf("proxy send %d bytes to client\n", strlen(cache[i].value));
            cache[i].used=1;
            flag=1;
            break;

        }
    }
    sem_wait(&rw->lock);
    rw->readers--;
    if(rw->readers==0)
    sem_post(&rw->writelock);
    sem_post(&rw->lock);
    return flag;

}
```

#### 完整代码

```d
#include "csapp.h"
#define MAX_CACHE 10
/* Recommended max cache and object sizes */
#define MAX_CACHE_SIZE 1049000
#define MAX_OBJECT_SIZE 102400
#define WEB_PREFIX "http://"
/* You won't lose style points for including this long line in your code */
static const char *user_agent_hdr = "User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:10.0.3) Gecko/20120305 Firefox/10.0.3\r\n";

void handlerequest(int);
void Clienterror(int , char* , char* , char* , char* );
int MakeClientRequest(rio_t* , char* , char*, char* , char* , char* , char*, char*);
int checkGetMethod(char* , char* , char* );
void replaceHTTPVersion(char* );
void parseLine(char* , char*, char* , char* , char* , char*, char*);
void *thread(void *v);
void rwlock_init();
int readcache(int fd,char *key);
void writecache(char *buf,char *key);
struct rwlock_t{
    sem_t lock;
    sem_t writelock;
    int readers;
};

struct Cache{
    int used;
    char key[MAXLINE];
    char value[MAX_OBJECT_SIZE];
};

int nowpointer;
struct Cache cache[MAXLINE];
struct rwlock_t *rw;

int main(int argc,char **argv)
{
    rw= Malloc(sizeof(struct rwlock_t));
    pthread_t tid;
    int listenfd,connfd;
    rwlock_init();
    char hostname[MAXLINE],port[MAXLINE];
    socklen_t clientlen;
    struct sockaddr_storage clientaddr;
    //判断是否是两个命令
    if(argc!=2){
        fprintf(stderr,"usage: Fuck ,can you input only two string ?\nsuch as%s <port>\n", argv[0]);
       // printf("Fuck ,input right message \n");
        exit(1);
    }

    listenfd =Open_listenfd(argv[1]);   //listen a port
    while(1){
        clientlen =sizeof (clientaddr);
        connfd = Accept(listenfd ,(SA *)&clientaddr, &clientlen);
        Getnameinfo((SA *)&clientaddr ,clientlen,hostname ,MAXLINE,port,MAXLINE,0);
        printf("Accepted connection from (%s , %s)\n", hostname ,port);// accept了

        //Connection Succeed
       Pthread_create(&tid,NULL,(void*) thread,(void*)&connfd);
    }
    return 0;
}
void rwlock_init(){
    rw->readers=0;
    sem_init(&rw->lock,0,1);
    /*
    sem_init 是一个用于初始化信号量的函数。这里初始化了 rw->lock 信号量。
    0 表示信号量用于线程间同步（而非进程间同步）。
    1 表示信号量的初始值为 1，即该信号量是一个二值信号量，用于互斥访问。
    */
    sem_init(&rw->writelock,0,1);
}
void *thread(void *v){
    int fd=*(int*)v;
    Pthread_detach(pthread_self());
    handlerequest(fd);
   // Free(v);
    Close(fd);
    return ;
}
void handlerequest(int fd){
    char buf[MAXLINE],method[MAXLINE],uri[MAXLINE],version[MAXLINE];// buf 
    char filename[MAXLINE];
    //request header
    char host[MAXLINE],port[MAXLINE];
    char clientRequest[MAXLINE];
    // IO for proxy--client ,proxy--server
    rio_t rio,riotiny;
    // Read request line and headers

    // step1: read request from client
    Rio_readinitb(&rio,fd);

    if(!Rio_readlineb(&rio ,buf, MAXLINE))//把输入的命令给到buf缓冲区
    {
        printf("empty request \n");
        return ;// empty-> close
    }
    // # HTTP/1.1 --> HTTp/1.0
    replaceHTTPVersion(buf);
   parseLine(buf,host,port,method,uri,version,filename);
    if(strcasecmp(method, "GET")){
        Clienterror(fd, method, "501", "Not Implemented",
                    "Tiny does not implement this method");
        return ;
    }
    // parse uri from GET request 
    if (readcache(fd,uri)!=0)return ;

    int rv=MakeClientRequest(&rio, clientRequest,host,port,method,uri,version,filename);
    if(rv==0)return ;

    printf("========= we have formatted the reqeust into ---------\n");
    printf("%s",clientRequest);

    char hostName[100];
    char* colon = strstr(host, ":");
    strncpy(hostName, host, colon - host);
    printf("host is %s\n", hostName);
    printf("port is %s\n", port);
    //模拟一个clientfd
    int clientfd = Open_clientfd(hostName, port);

    Rio_readinitb(&riotiny, clientfd);
    Rio_writen(riotiny.rio_fd, clientRequest, strlen(clientRequest));

    /** step4: read the response from tiny and send it to the client */
    char cache[MAX_OBJECT_SIZE];
    int sum=0;

    printf("---prepare to get the response---- \n");
    char tinyResponse[MAXLINE];

    int n;
    
    while( (n = Rio_readlineb(&riotiny, tinyResponse, MAXLINE)) != 0){
        Rio_writen(fd, tinyResponse, n);
        sum+=n;
        strcat(cache,tinyResponse);

    }
    printf("proxy send %d bytes to client\n",sum);
    if(sum<MAX_OBJECT_SIZE)
     writecache(cache,uri);
    close(clientfd);
    return ;

    
}
void writecache(char * buf,char *key){
    sem_wait(&rw->writelock);
    int index;
    while(cache[nowpointer].used!=0){
        cache[nowpointer].used=0;
        nowpointer=(nowpointer+1)%MAX_CACHE;

    }
    index =nowpointer;
    cache[index].used=1;
    strcpy(cache[index].key,key);
    strcpy(cache[index].value,buf);
    sem_post(&rw->writelock);
    return;
}
int readcache(int fd,char *uri){
    sem_wait(&rw->lock);
    if(rw->readers==0)sem_wait(&rw->writelock);
    rw->readers++;
    sem_post(&rw->lock);
    int i;
    int flag=0;
    for(i=0;i<MAX_CACHE;i++){
        if(strcmp(uri,cache[i].key)==0){
            Rio_writen(fd,cache[i].value,strlen(cache[i].value));
        //    printf("proxy send %d bytes to client\n", strlen(cache[i].value));
            cache[i].used=1;
            flag=1;
            break;

        }
    }
    sem_wait(&rw->lock);
    rw->readers--;
    if(rw->readers==0)
    sem_post(&rw->writelock);
    sem_post(&rw->lock);
    return flag;

}
int MakeClientRequest(rio_t* rio, char* clientRequest, char* Host, char* port,
                        char* method, char* uri, char* version, char* fileName){
    int UserAgent = 0, Connection = 0, ProxyConnection = 0, HostInfo = 0;
    char buf[MAXLINE / 2];
    int n;

    /* 1. add GET HOSTNAME HTTP/1.0 to header && Host Info */
    sprintf(clientRequest, "GET %s HTTP/1.0\r\n", fileName);

    n = Rio_readlineb(rio, buf, MAXLINE);// n是读取的字节数
    printf("receive buf %s\n", buf);
    printf("n == %d\n", n);
    char* findp;
    while(strcmp("\r\n", buf) != 0 && n != 0){
        strcat(clientRequest, buf);
        printf("receive buf %s\n", buf);

        if( (findp = strstr(buf, "User-Agent:")) != NULL){
            UserAgent = 1;
        }else if( (findp = strstr(buf, "Proxy-Connection:")) != NULL){
            ProxyConnection = 1;
        }else if( (findp = strstr(buf, "Connection:")) != NULL){
            Connection = 1;
        }else if( (findp = strstr(buf, "Host:")) != NULL){
            HostInfo = 1;
        }

        n = Rio_readlineb(rio, buf, MAXLINE);
    }

    if(n == 0){
        return 0;
    }

    if(HostInfo == 0){
        sprintf(buf, "Host: %s\r\n", Host);
        strcat(clientRequest, buf);
    }

    /** append User-Agent */
    if(UserAgent == 0){
        strcat(clientRequest, user_agent_hdr);
    }
    
    /** append Connection */
    if(Connection == 0){
        sprintf(buf, "Connection: close\r\n");
        strcat(clientRequest, buf);
    }
    
    /** append Proxy-Connection */
    if(ProxyConnection == 0){
        sprintf(buf, "Proxy-Connection: close\r\n");
        strcat(clientRequest, buf);
    }

    /* add terminator for request */
    strcat(clientRequest, "\r\n");
    return 1;
}
void replaceHTTPVersion(char *buf){
    char *pos =NULL;
    if((pos=strstr(buf,"HTTP/1.1"))!=NULL){
        buf[pos-buf+strlen("HTTP/1.1")-1]='0';
    }
}

void parseLine(char* buf, char* host, char* port, char* method, char* uri, char* version, char* filename){
    sscanf(buf, "%s %s %s",method,uri,version);
    //method = "GET", uri = "http://localhost:15213/home.html", version = "HTTP1.0"
    char* hostp = strstr(uri, WEB_PREFIX) + strlen(WEB_PREFIX);
    char* slash = strstr(hostp, "/");
    char* colon = strstr(hostp, ":");
    //get host name
    strncpy(host, hostp, slash - hostp);  
    //get port number
    strncpy(port, colon + 1, slash - colon - 1);
    //get file name
    strcpy(filename, slash);
    /*
    host : localhost:15214
    filename: /home.html
    */

}
// html headers and response body
void Clienterror(int fd,char *cause,char *errnum, char *shortmsg, char *longmsg)
{
    char buf[MAXLINE];
    /* Print the HTTP response headers */
    sprintf(buf, "HTTP/1.0 %s %s\r\n", errnum, shortmsg);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "Content-type: text/html\r\n\r\n");
    Rio_writen(fd, buf, strlen(buf));

    /* Print the HTTP response body */
    sprintf(buf, "<html><title>Tiny Error</title>");
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<body bgcolor=""ffffff"">\r\n");
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "%s: %s\r\n", errnum, shortmsg);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<p>%s: %s\r\n", longmsg, cause);
    Rio_writen(fd, buf, strlen(buf));
    sprintf(buf, "<hr><em>The Tiny Web server</em>\r\n");
    Rio_writen(fd, buf, strlen(buf));
}


```



![image-20240818045547484](https://cdn.jsdelivr.net/gh/zhzvite/picgoroom@img/img/202408180455756.png)

# 总结

这是一场旷日持久的斗争！

但是我学到了很多！

感谢CMU 15-213 CSAPP!



