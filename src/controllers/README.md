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

| 方法 | 路由 | 说明 |
|------|------|------|
| getTime | GET /api/system/time | 获取服务器时间 |
| getSystemInfo | GET /api/system/info | 获取系统信息 |

**使用示例：**

```javascript
const systemController = require('./controllers/system.controller');

// 在路由中使用
router.get('/system/time', systemController.getTime);
router.get('/system/info', systemController.getSystemInfo);
```

---

### auth.controller.js - 认证控制器

处理用户认证相关的 API 请求，包括注册、登录、获取用户信息等。

**包含的方法：**

| 方法 | 路由 | 说明 | 需要认证 |
|------|------|------|----------|
| register | POST /api/register | 用户注册 | 否 |
| login | POST /api/login | 用户登录 | 否 |
| getUserInfo | GET /api/user/info | 获取用户信息 | 是 |
| updateProfile | PUT /api/user/profile | 更新用户资料 | 是 |
| changePassword | PUT /api/user/password | 修改密码 | 是 |

#### register - 用户注册

**请求参数：**
```json
{
  "username": "testuser",
  "password": "123456",
  "email": "test@example.com",
  "inviteCode": "abc123..."
}
```

**注册流程：**
1. 校验参数格式（用户名/密码/邮箱）
2. 校验邀请码是否存在且未使用
3. 校验用户名/邮箱是否已存在
4. 密码 bcrypt 加密
5. 插入 user 表
6. 自动插入 user_profile（空值）
7. 自动插入 user_auth（默认值）
8. 更新邀请码状态

**成功响应：**
```json
{
  "code": 200,
  "msg": "注册成功",
  "data": {}
}
```

#### login - 用户登录

**请求参数：**
```json
{
  "username": "testuser",
  "password": "123456"
}
```

**登录流程：**
1. 校验用户名是否存在
2. bcrypt 比对密码
3. 生成 JWT Token
4. 返回 Token + 用户信息

**成功响应：**
```json
{
  "code": 200,
  "msg": "登录成功",
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

#### getUserInfo - 获取用户信息

**请求头：**
```
Authorization: Bearer {token}
```

**成功响应：**
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "nickname": "testuser",
    "role": "user",
    "status": 1,
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

---

### invite_code.controller.js - 邀请码管理控制器

处理邀请码管理相关的 API 请求，仅限管理员访问。

**包含的方法：**

| 方法 | 路由 | 说明 | 需要认证 | 需要管理员 |
|------|------|------|----------|------------|
| generate | POST /api/invite-codes | 创建邀请码（批量生成） | 是 | 是 |
| list | GET /api/invite-codes | 查询邀请码列表 | 是 | 是 |
| stats | GET /api/invite-codes/stats | 获取邀请码统计 | 是 | 是 |
| remove | DELETE /api/invite-codes/:id | 删除邀请码 | 是 | 是 |
| cleanup | POST /api/invite-codes/cleanup | 清理过期邀请码 | 是 | 是 |

#### generate - 创建邀请码（批量生成）

**请求参数：**
```json
{
  "count": 10,      // 生成数量（1-100）
  "length": 16      // 邀请码长度（8-32位）
}
```

**成功响应：**
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

#### list - 查询邀请码列表

**请求参数（Query）：**
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20）
- `code`: 按邀请码模糊搜索
- `used`: 按使用状态筛选（0未使用/1已使用）

**成功响应：**
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

## 控制器设计原则

1. **单一职责**：每个控制器只处理一类相关的请求
2. **统一响应**：使用统一的响应格式
3. **错误处理**：合理处理异常，返回友好的错误信息
4. **参数验证**：在处理前验证请求参数
5. **事务处理**：涉及多表操作时使用事务

## 控制器模板

```javascript
/**
 * @fileoverview XXX控制器
 * @description 处理XXX相关的API请求
 */

// 引入依赖
const db = require('../models');
const response = require('../utils/response');
const logger = require('../utils/logger');
const HttpStatus = require('../config/constants');

/**
 * 获取列表
 */
const getList = async (req, res) => {
  try {
    // 1. 获取参数
    const { page, pageSize } = req.query;
    
    // 2. 查询数据
    const list = await db.query('SELECT * FROM table LIMIT ? OFFSET ?', [pageSize, (page - 1) * pageSize]);
    
    // 3. 返回响应
    return response.success(res, list, '获取成功');
    
  } catch (error) {
    logger.error('获取列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  getList
};
```
