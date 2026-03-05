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

## 邀请码管理接口

> **权限说明**：所有邀请码管理接口仅限 admin 角色访问，需要携带有效的 JWT Token。

### 1. 创建邀请码（批量生成）

管理员批量生成邀请码，支持指定长度和数量。

**请求**

```
POST /api/invite-codes
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| count | number | 否 | 生成数量（1-100，默认10） |
| length | number | 否 | 邀请码长度（8-32位，默认32） |

**请求示例**

```json
{
  "count": 10,
  "length": 16
}
```

**成功响应**

```json
{
  "success": true,
  "message": "生成成功",
  "data": {
    "count": 10,
    "list": [
      { "id": 1, "code": "a1b2c3d4e5f6g7h8" },
      { "id": 2, "code": "i9j0k1l2m3n4o5p6" }
    ]
  }
}
```

**失败响应**

| success | message | 说明 |
|---------|---------|------|
| false | 生成数量必须在 1-100 之间 | 参数范围错误 |
| false | 邀请码长度必须在 8-32 位之间 | 参数范围错误 |
| false | 未登录或 Token 过期 | Token无效 |
| false | 权限不足 | 非管理员 |

**调用示例**

```bash
# curl
curl -X POST http://localhost:3000/api/invite-codes \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{"count":10,"length":16}'

# PowerShell
$headers = @{
  Authorization = "Bearer your_token_here"
}
$body = @{
  count = 10
  length = 16
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/invite-codes -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

---

### 2. 查询邀请码列表

管理员查询邀请码列表，支持筛选和分页。

**请求**

```
GET /api/invite-codes?page=1&pageSize=10&used=0
Authorization: Bearer {token}
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码（默认1） |
| pageSize | number | 否 | 每页数量（默认20，最大100） |
| code | string | 否 | 按邀请码模糊搜索 |
| used | number | 否 | 按使用状态筛选（0未使用/1已使用） |

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "code": "a1b2c3d4e5f6g7h8",
        "used": 0,
        "create_time": "2024-01-15T10:30:45.000Z",
        "use_time": null,
        "user_id": null,
        "username": null
      },
      {
        "id": 2,
        "code": "i9j0k1l2m3n4o5p6",
        "used": 1,
        "create_time": "2024-01-14T09:20:30.000Z",
        "use_time": "2024-01-15T08:00:00.000Z",
        "user_id": 5,
        "username": "testuser"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 10,
      "totalPages": 10
    }
  }
}
```

**调用示例**

```bash
# curl
curl "http://localhost:3000/api/invite-codes?page=1&pageSize=10&used=0" \
  -H "Authorization: Bearer your_token_here"

# PowerShell
$headers = @{
  Authorization = "Bearer your_token_here"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/invite-codes?page=1&pageSize=10&used=0" -Headers $headers
```

---

### 3. 获取邀请码统计

获取邀请码的总数、已使用、未使用数量。

**请求**

```
GET /api/invite-codes/stats
Authorization: Bearer {token}
```

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "total": 100,
    "used": 30,
    "unused": 70
  }
}
```

**调用示例**

```bash
# curl
curl http://localhost:3000/api/invite-codes/stats \
  -H "Authorization: Bearer your_token_here"

# PowerShell
$headers = @{
  Authorization = "Bearer your_token_here"
}

Invoke-RestMethod -Uri http://localhost:3000/api/invite-codes/stats -Headers $headers
```

---

### 4. 删除邀请码

删除未使用的邀请码（已使用的不能删除）。

**请求**

```
DELETE /api/invite-codes/{id}
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 邀请码ID |

**成功响应**

```json
{
  "success": true,
  "message": "删除成功",
  "data": {}
}
```

**失败响应**

| success | message | 说明 |
|---------|---------|------|
| false | 邀请码ID不能为空 | 参数缺失 |
| false | 邀请码不存在 | 邀请码不存在 |
| false | 该邀请码已使用，无法删除 | 邀请码已使用 |

**调用示例**

```bash
# curl
curl -X DELETE http://localhost:3000/api/invite-codes/123 \
  -H "Authorization: Bearer your_token_here"

# PowerShell
$headers = @{
  Authorization = "Bearer your_token_here"
}

Invoke-RestMethod -Uri http://localhost:3000/api/invite-codes/123 -Method DELETE -Headers $headers
```

---

### 5. 清理过期邀请码

删除超过指定天数未使用的邀请码。

**请求**

```
POST /api/invite-codes/cleanup
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | number | 否 | 过期天数（1-365，默认30） |

**请求示例**

```json
{
  "days": 30
}
```

**成功响应**

```json
{
  "success": true,
  "message": "清理完成",
  "data": {
    "deleted": 5
  }
}
```

**调用示例**

```bash
# curl
curl -X POST http://localhost:3000/api/invite-codes/cleanup \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{"days":30}'

# PowerShell
$headers = @{
  Authorization = "Bearer your_token_here"
}
$body = @{
  days = 30
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/invite-codes/cleanup -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

---

## 版块分类接口

### 1. 获取启用的版块列表

获取所有启用的版块，供前端展示用。

**请求**

```
GET /api/categories/active
```

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "综合讨论",
      "description": "综合讨论区，可以讨论任何话题",
      "icon": null
    },
    {
      "id": 2,
      "name": "技术交流",
      "description": "技术问题讨论与交流",
      "icon": null
    }
  ]
}
```

**调用示例**

```bash
# curl
curl http://localhost:3000/api/categories/active

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/categories/active
```

---

### 2. 获取版块详情

根据ID获取版块详细信息。

**请求**

```
GET /api/categories/{id}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 版块ID |

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "综合讨论",
    "description": "综合讨论区，可以讨论任何话题",
    "icon": null,
    "sort_order": 1,
    "status": 1,
    "create_time": "2024-01-15T10:30:45.000Z",
    "update_time": "2024-01-15T10:30:45.000Z"
  }
}
```

---

### 3. 获取版块列表（管理用）

> **权限说明**：仅限 admin 角色访问

管理员查询版块列表，支持筛选和分页。

**请求**

```
GET /api/categories?page=1&pageSize=10&status=1
Authorization: Bearer {token}
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码（默认1） |
| pageSize | number | 否 | 每页数量（默认20） |
| status | number | 否 | 按状态筛选（1启用/0禁用） |
| keyword | string | 否 | 按名称模糊搜索 |

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "综合讨论",
        "description": "综合讨论区，可以讨论任何话题",
        "icon": null,
        "sort_order": 1,
        "status": 1,
        "create_time": "2024-01-15T10:30:45.000Z",
        "update_time": "2024-01-15T10:30:45.000Z"
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "pageSize": 20,
      "totalPages": 1
    }
  }
}
```

---

### 4. 创建版块

> **权限说明**：仅限 admin 角色访问

管理员创建新版块。

**请求**

```
POST /api/categories
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 版块名称（最多50字符） |
| description | string | 否 | 版块描述 |
| icon | string | 否 | 版块图标URL |
| sort_order | number | 否 | 排序（默认0） |

**请求示例**

```json
{
  "name": "新手入门",
  "description": "新手入门指南和常见问题",
  "sort_order": 4
}
```

**成功响应**

```json
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": 4
  }
}
```

---

### 5. 更新版块

> **权限说明**：仅限 admin 角色访问

管理员更新版块信息。

**请求**

```
PUT /api/categories/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 版块ID |

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 版块名称 |
| description | string | 否 | 版块描述 |
| icon | string | 否 | 版块图标URL |
| sort_order | number | 否 | 排序 |
| status | number | 否 | 状态（1启用/0禁用） |

**成功响应**

```json
{
  "success": true,
  "message": "更新成功",
  "data": {}
}
```

---

### 6. 更新版块状态

> **权限说明**：仅限 admin 角色访问

管理员启用/禁用版块。

**请求**

```
PUT /api/categories/{id}/status
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | number | 是 | 状态（1启用/0禁用） |

**请求示例**

```json
{
  "status": 0
}
```

**成功响应**

```json
{
  "success": true,
  "message": "已禁用",
  "data": {}
}
```

---

### 7. 删除版块

> **权限说明**：仅限 admin 角色访问

管理员删除版块。

**请求**

```
DELETE /api/categories/{id}
Authorization: Bearer {token}
```

**成功响应**

```json
{
  "success": true,
  "message": "删除成功",
  "data": {}
}
```

**失败响应**

| success | message | 说明 |
|---------|---------|------|
| false | 版块不存在 | 版块ID无效 |

---

### 8. 获取版块统计

> **权限说明**：仅限 admin 角色访问

获取版块统计数据。

**请求**

```
GET /api/categories/stats
Authorization: Bearer {token}
```

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "total": 3,
    "active": 3,
    "inactive": 0
  }
}
```

---

## 帖子管理接口

### 1. 获取帖子列表

获取帖子列表，支持筛选和分页。

**请求**

```
GET /api/posts?page=1&pageSize=10&category_id=1&keyword=关键词&orderBy=latest
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码（默认1） |
| pageSize | number | 否 | 每页数量（默认20，最大50） |
| category_id | number | 否 | 按版块筛选 |
| keyword | string | 否 | 按标题搜索 |
| orderBy | string | 否 | 排序方式（latest/popular/pinned） |

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "我的第一篇帖子",
        "summary": "帖子内容摘要...",
        "user_id": 1,
        "category_id": 1,
        "views": 100,
        "likes": 10,
        "comments": 5,
        "is_pinned": 0,
        "is_highlighted": 0,
        "create_time": "2024-01-15T10:30:45.000Z",
        "author_name": "admin",
        "author_nickname": "管理员",
        "category_name": "综合讨论"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "totalPages": 5
    }
  }
}
```

---

### 2. 获取帖子详情

根据ID获取帖子详细信息，并增加浏览量。

**请求**

```
GET /api/posts/{id}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 帖子ID |

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "title": "我的第一篇帖子",
    "content": "帖子完整内容...",
    "user_id": 1,
    "category_id": 1,
    "views": 101,
    "likes": 10,
    "comments": 5,
    "is_pinned": 0,
    "is_highlighted": 0,
    "status": 1,
    "create_time": "2024-01-15T10:30:45.000Z",
    "update_time": "2024-01-15T10:30:45.000Z",
    "author_name": "admin",
    "author_nickname": "管理员",
    "author_avatar": null,
    "category_name": "综合讨论"
  }
}
```

---

### 3. 发布帖子

> **权限说明**：需要登录

用户发布新帖子。

**请求**

```
POST /api/posts
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 帖子标题（最多100字符） |
| content | string | 是 | 帖子内容 |
| category_id | number | 是 | 版块ID |

**请求示例**

```json
{
  "title": "我的第一篇帖子",
  "content": "这是帖子的内容...",
  "category_id": 1
}
```

**成功响应**

```json
{
  "success": true,
  "message": "发布成功",
  "data": {
    "id": 1
  }
}
```

---

### 4. 更新帖子

> **权限说明**：需要登录（帖子作者或管理员）

用户编辑自己的帖子。

**请求**

```
PUT /api/posts/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 帖子ID |

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 帖子标题 |
| content | string | 否 | 帖子内容 |
| category_id | number | 否 | 版块ID |

**成功响应**

```json
{
  "success": true,
  "message": "更新成功",
  "data": {}
}
```

---

### 5. 删除帖子

> **权限说明**：需要登录（帖子作者或管理员）

删除帖子（软删除）。

**请求**

```
DELETE /api/posts/{id}
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 帖子ID |

**成功响应**

```json
{
  "success": true,
  "message": "删除成功",
  "data": {}
}
```

---

### 6. 获取我的帖子

> **权限说明**：需要登录

获取当前用户发布的帖子列表。

**请求**

```
GET /api/posts/my
Authorization: Bearer {token}
```

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [...],
    "pagination": {...}
  }
}
```

---

### 7. 获取帖子统计

获取帖子统计数据。

**请求**

```
GET /api/posts/stats
```

**成功响应**

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "total": 100,
    "normal": 95,
    "deleted": 3,
    "pending": 2
  }
}
```

---

### 8. 置顶/取消置顶帖子

> **权限说明**：仅限 admin 角色访问

管理员置顶或取消置顶帖子。

**请求**

```
PUT /api/posts/{id}/pin
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| is_pinned | number | 是 | 是否置顶（1是/0否） |

**请求示例**

```json
{
  "is_pinned": 1
}
```

**成功响应**

```json
{
  "success": true,
  "message": "已置顶",
  "data": {}
}
```

---

### 9. 加精/取消加精帖子

> **权限说明**：仅限 admin 角色访问

管理员加精或取消加精帖子。

**请求**

```
PUT /api/posts/{id}/highlight
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| is_highlighted | number | 是 | 是否加精（1是/0否） |

**请求示例**

```json
{
  "is_highlighted": 1
}
```

**成功响应**

```json
{
  "success": true,
  "message": "已加精",
  "data": {}
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
