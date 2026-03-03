# API 接口文档

本文档描述了后端API的所有接口规范。

## 基础信息

- **基础URL**: `http://localhost:3000`
- **API前缀**: `/api`
- **数据格式**: JSON
- **字符编码**: UTF-8

## 统一响应格式

所有API接口都遵循统一的响应格式，便于前端统一处理。

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:45.000Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 成功标志，true表示成功 |
| message | string | 提示消息 |
| data | any | 返回的数据 |
| timestamp | string | 响应时间戳（ISO 8601格式） |

### 失败响应

```json
{
  "success": false,
  "message": "错误描述",
  "errors": ["详细错误1", "详细错误2"],
  "timestamp": "2024-01-15T10:30:45.000Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 成功标志，false表示失败 |
| message | string | 错误消息 |
| errors | array | 详细错误信息（可选） |
| timestamp | string | 响应时间戳 |

---

## 系统接口

### 1. 获取服务器时间

获取服务器的当前时间，提供多种时间格式。

**请求**

```
GET /api/system/time
```

**参数**

无

**响应示例**

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

**响应字段说明**

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
| dayOfWeek | number | 星期几（0=周日，1=周一...） | 1 |
| timezone | string | 时区 | UTC+8 |

**使用场景**

- 嵌入式设备时间同步
- 验证设备与服务器时间差
- 设备没有实时时钟时获取准确时间

**调用示例**

```bash
# curl
curl http://localhost:3000/api/system/time

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/system/time
```

---

### 2. 获取系统信息

获取服务器的基本信息，用于监控和调试。

**请求**

```
GET /api/system/info
```

**参数**

无

**响应示例**

```json
{
  "success": true,
  "message": "获取系统信息成功",
  "data": {
    "nodeVersion": "v22.19.0",
    "platform": "win32",
    "uptime": 3600.5,
    "memoryUsage": {
      "rss": 45678592,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576,
      "arrayBuffers": 98304
    },
    "env": "development"
  },
  "timestamp": "2024-01-15T10:30:45.000Z"
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| nodeVersion | string | Node.js版本号 |
| platform | string | 操作系统平台（win32/linux/darwin） |
| uptime | number | 进程运行时间（秒） |
| memoryUsage | object | 内存使用情况（字节） |
| env | string | 运行环境 |

**memoryUsage字段说明**

| 字段 | 说明 |
|------|------|
| rss | 常驻内存集大小（Resident Set Size） |
| heapTotal | V8分配的堆内存总量 |
| heapUsed | 已使用的堆内存 |
| external | 外部内存使用量（如Buffer） |
| arrayBuffers | ArrayBuffer内存使用量 |

**使用场景**

- 服务器健康检查
- 监控服务器状态
- 调试环境信息

**调用示例**

```bash
# curl
curl http://localhost:3000/api/system/info

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/system/info
```

---

## 错误码说明

| HTTP状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 待实现接口

以下接口将在后续开发中实现：

### 设备管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/device/register | 设备注册 |
| POST | /api/device/heartbeat | 设备心跳 |
| GET | /api/device/list | 设备列表 |
| GET | /api/device/:id | 设备详情 |

### OTA升级

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/ota/upload | 上传固件 |
| GET | /api/ota/check/:deviceId | 检查更新 |
| POST | /api/ota/report | 上报升级结果 |
