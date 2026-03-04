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
  "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 成功标志，true表示成功 |
| message | string | 提示消息 |
| data | any | 返回的数据 |

### 失败响应

```json
{
  "success": false,
  "message": "错误描述",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 成功标志，false表示失败 |
| message | string | 错误消息 |
| data | object | 附加数据（通常为空对象） |

---

## 认证接口

### 1. 用户注册

用户注册接口，需要有效的邀请码。

**请求**

```
POST /api/register
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名（3-20位字母、数字或下划线） |
| password | string | 是 | 密码（至少6位） |
| email | string | 是 | 邮箱 |
| inviteCode | string | 是 | 邀请码 |

**请求示例**

```json
{
  "username": "testuser",
  "password": "123456",
  "email": "test@example.com",
  "inviteCode": "abc123def456..."
}
```

**成功响应**

```json
{
  "success": true,
  "message": "注册成功",
  "data": {}
}
```

**失败响应**

| success | message | 说明 |
|---------|---------|------|
| false | 请填写完整的注册信息 | 参数缺失 |
| false | 用户名格式不正确（3-20位字母、数字或下划线） | 用户名格式错误 |
| false | 密码长度不能少于6位 | 密码太短 |
| false | 邮箱格式不正确 | 邮箱格式错误 |
| false | 邀请码无效或已使用 | 邀请码无效 |
| false | 用户名已存在 | 用户名重复 |
| false | 邮箱已存在 | 邮箱重复 |

**调用示例**

```bash
# curl
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456","email":"test@example.com","inviteCode":"your_invite_code"}'

# PowerShell
$body = @{
  username = "testuser"
  password = "123456"
  email = "test@example.com"
  inviteCode = "your_invite_code"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/register -Method POST -Body $body -ContentType "application/json"
```

---

### 2. 用户登录

用户登录接口，返回JWT Token。

**请求**

```
POST /api/login
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例**

```json
{
  "username": "testuser",
  "password": "123456"
}
```

**成功响应**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "nickname": "testuser",
      "role": "user"
    }
  }
}
```

**失败响应**

| success | message | 说明 |
|---------|---------|------|
| false | 请输入用户名和密码 | 参数缺失 |
| false | 用户不存在 | 用户名错误 |
| false | 密码错误 | 密码错误 |
| false | 账号已被禁用 | 账号被禁用 |

**调用示例**

```bash
# curl
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'

# PowerShell
$body = @{
  username = "testuser"
  password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/login -Method POST -Body $body -ContentType "application/json"
```

---

### 3. 获取当前用户信息

获取当前登录用户的完整信息，需要JWT认证。

**请求**

```
GET /api/user/info
Authorization: Bearer {token}
```

**请求头**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Authorization | string | 是 | Bearer Token（格式：Bearer {token}） |

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "nickname": "testuser",
    "avatar": null,
    "role": "user",
    "status": 1,
    "create_time": "2024-01-15T10:30:45.000Z",
    "update_time": "2024-01-15T10:30:45.000Z",
    "signature": null,
    "gender": "unknown",
    "birthday": null,
    "points": 0,
    "download_limit": 50,
    "can_upload": 1,
    "can_comment": 1
  }
}
```

**失败响应**

| success | message | 说明 |
|---------|---------|------|
| false | 未登录或 Token 过期 | Token无效或过期 |

**调用示例**

```bash
# curl
curl http://localhost:3000/api/user/info \
  -H "Authorization: Bearer your_token_here"

# PowerShell
$headers = @{
  Authorization = "Bearer your_token_here"
}

Invoke-RestMethod -Uri http://localhost:3000/api/user/info -Headers $headers
```

---

### 4. 更新用户资料

更新当前用户的资料信息，需要JWT认证。

**请求**

```
PUT /api/user/profile
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 昵称 |
| signature | string | 否 | 个性签名 |
| gender | string | 否 | 性别（male/female/unknown） |
| birthday | string | 否 | 生日（格式：YYYY-MM-DD） |

**请求示例**

```json
{
  "nickname": "新昵称",
  "signature": "这是我的个性签名",
  "gender": "male",
  "birthday": "1990-01-01"
}
```

**成功响应**

```json
{
  "success": true,
  "message": "更新成功",
  "data": {}
}
```

---

### 5. 修改密码

修改当前用户的密码，需要JWT认证。

**请求**

```
PUT /api/user/password
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码（至少6位） |

**请求示例**

```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

**成功响应**

```json
{
  "success": true,
  "message": "密码修改成功",
  "data": {}
}
```

**失败响应**

| success | message | 说明 |
|---------|---------|------|
| false | 请输入旧密码和新密码 | 参数缺失 |
| false | 新密码长度不能少于6位 | 密码太短 |
| false | 旧密码错误 | 旧密码不正确 |

---

## 系统接口

### 1. 获取服务器时间

获取服务器的当前时间，提供多种时间格式。

**请求**

```
GET /api/system/time
```

**成功响应**

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
  }
}
```

---

### 2. 获取系统信息

获取服务器的基本信息，用于监控和调试。

**请求**

```
GET /api/system/info
```

**成功响应**

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
      "external": 1048576
    },
    "env": "development"
  }
}
```

---

## 错误码说明

| HTTP状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## JWT Token 说明

### Token 格式

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token 有效期

- 默认有效期：7天
- 配置项：`JWT_EXPIRES_IN`（单位：秒）

### Token 使用方式

1. 用户登录成功后，服务器返回 Token
2. 客户端存储 Token（建议存储在 localStorage）
3. 后续请求在 Header 中携带 Token
4. 服务器验证 Token 的有效性

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
