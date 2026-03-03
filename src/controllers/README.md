# 控制器模块 (controllers)

控制器负责处理具体的业务逻辑，接收请求并返回响应。

## 什么是控制器？

在 MVC 架构中，控制器（Controller）是连接模型（Model）和视图（View）的桥梁：
- 接收路由传递的请求
- 处理业务逻辑
- 调用模型获取/存储数据
- 返回响应给客户端

## 文件说明

### system.controller.js - 系统控制器

处理系统相关的 API 请求。

**包含的方法：**

#### getTime - 获取服务器时间

返回服务器的当前时间，提供多种时间格式。

**请求：**
```
GET /api/system/time
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取时间成功",
  "data": {
    "timestamp": 1705315845348,
    "iso": "2024-01-15T10:30:45.348Z",
    "utc": "Mon, 15 Jan 2024 10:30:45 GMT",
    "local": "2024/1/15 18:30:45",
    "year": 2024,
    "month": 1,
    "day": 15,
    "hour": 18,
    "minute": 30,
    "second": 45,
    "dayOfWeek": 1,
    "timezone": "UTC+8"
  },
  "timestamp": "2024-01-15T10:30:45.358Z"
}
```

**时间字段说明：**

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| timestamp | number | Unix时间戳（毫秒） | 1705315845348 |
| iso | string | ISO 8601格式 | 2024-01-15T10:30:45.348Z |
| utc | string | UTC格式 | Mon, 15 Jan 2024 10:30:45 GMT |
| local | string | 本地时间（北京时间） | 2024/1/15 18:30:45 |
| year | number | 年份 | 2024 |
| month | number | 月份（1-12） | 1 |
| day | number | 日期（1-31） | 15 |
| hour | number | 小时（0-23） | 18 |
| minute | number | 分钟（0-59） | 30 |
| second | number | 秒（0-59） | 45 |
| dayOfWeek | number | 星期几（0=周日） | 1 |
| timezone | string | 时区 | UTC+8 |

**使用场景：**
- 嵌入式设备时间同步
- 验证设备与服务器时间差
- 设备没有实时时钟时获取准确时间

---

#### getSystemInfo - 获取系统信息

返回服务器的基本信息。

**请求：**
```
GET /api/system/info
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取系统信息成功",
  "data": {
    "nodeVersion": "v22.19.0",
    "platform": "win32",
    "uptime": 3600,
    "memoryUsage": {
      "rss": 45678592,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576
    },
    "env": "development"
  },
  "timestamp": "2024-01-15T10:30:45.000Z"
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| nodeVersion | string | Node.js 版本号 |
| platform | string | 操作系统平台（win32/linux/darwin） |
| uptime | number | 进程运行时间（秒） |
| memoryUsage | object | 内存使用情况（字节） |
| env | string | 运行环境 |

**使用场景：**
- 服务器健康检查
- 监控服务器状态
- 调试环境信息

## 控制器设计原则

1. **单一职责**：每个控制器只处理一类相关的请求
2. **统一响应**：使用统一的响应格式
3. **错误处理**：合理处理异常，返回友好的错误信息
4. **代码复用**：公共逻辑抽取到服务层或工具函数
