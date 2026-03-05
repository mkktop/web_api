# 论坛系统前后端对接文档

## 项目概述

本项目是一个论坛系统，包含用户管理、帖子管理、评论回复、积分系统、资源下载等功能。

---

## 一、基础信息

### 1.1 服务器信息

| 项目 | 值 |
|------|------|
| 接口地址 | http://localhost:3000/api |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

### 1.2 认证方式

- 使用 JWT Token 认证
- 登录成功后返回 Token
- 后续请求在 Header 中携带：`Authorization: Bearer {token}`
- Token 有效期：7天

### 1.3 统一响应格式

**成功响应：**
```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

**失败响应：**
```json
{
  "success": false,
  "message": "错误信息",
  "data": {}
}
```

### 1.4 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误（success: false） |
| 401 | 未登录或 Token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 二、用户角色说明

| 角色 | 说明 | 权限 |
|------|------|------|
| admin | 管理员 | 所有权限 + 管理后台 |
| user | 普通用户 | 基础功能 |

---

## 三、积分规则

| 操作 | 积分变化 |
|------|----------|
| 每日签到 | +20 积分 |
| 连续签到7天 | 额外 +10 积分 |
| 连续签到14天 | 额外 +20 积分 |
| 连续签到30天 | 额外 +50 积分 |
| 兑换邀请码 | -50 积分 |
| 兑换资源下载 | -资源价格（作者获得50%） |

---

## 四、状态码说明

### 帖子状态
| 值 | 说明 |
|------|------|
| 0 | 已删除 |
| 1 | 正常 |
| 2 | 审核中 |

### 用户状态
| 值 | 说明 |
|------|------|
| 0 | 禁用 |
| 1 | 正常 |

### 版块状态
| 值 | 说明 |
|------|------|
| 0 | 禁用 |
| 1 | 启用 |

---

## 五、接口列表

### 5.1 系统接口（公开）

#### 获取服务器时间
```
GET /api/system/time
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "timestamp": 1704067200000,
    "datetime": "2024-01-01 00:00:00"
  }
}
```

#### 获取系统信息
```
GET /api/system/info
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "name": "Web API",
    "version": "1.0.0",
    "node_version": "v22.19.0"
  }
}
```

---

### 5.2 认证接口

#### 用户注册
```
POST /api/register
Content-Type: application/json
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名（4-20字符） |
| password | string | 是 | 密码（6-20字符） |
| email | string | 是 | 邮箱 |
| invite_code | string | 是 | 邀请码 |

**请求示例：**
```json
{
  "username": "testuser",
  "password": "123456",
  "email": "test@example.com",
  "invite_code": "abc123def456"
}
```

**响应：**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": 2,
    "username": "testuser",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 用户登录
```
POST /api/login
Content-Type: application/json
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 获取用户信息
```
GET /api/user/info
Authorization: Bearer {token}
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "管理员",
    "avatar": null,
    "role": "admin",
    "status": 1,
    "create_time": "2024-01-01T00:00:00.000Z",
    "profile": {
      "signature": null,
      "gender": null,
      "birthday": null
    },
    "auth": {
      "points": 1000,
      "download_limit": 999,
      "can_upload": 1,
      "can_comment": 1
    }
  }
}
```

#### 更新用户资料
```
PUT /api/user/profile
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 昵称 |
| avatar | string | 否 | 头像URL |
| signature | string | 否 | 个性签名 |
| gender | string | 否 | 性别（male/female/other） |
| birthday | string | 否 | 生日（YYYY-MM-DD） |

#### 修改密码
```
PUT /api/user/password
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| old_password | string | 是 | 原密码 |
| new_password | string | 是 | 新密码 |

---

### 5.3 版块接口

#### 获取启用的版块列表（公开）
```
GET /api/categories/active
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "综合讨论",
      "description": "综合讨论区",
      "icon": null,
      "sort_order": 1
    }
  ]
}
```

#### 获取版块详情（公开）
```
GET /api/categories/{id}
```

---

### 5.4 帖子接口

#### 获取帖子列表（公开）
```
GET /api/posts?page=1&pageSize=20&category_id=1&keyword=关键词&orderBy=latest
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码（默认1） |
| pageSize | number | 否 | 每页数量（默认20，最大50） |
| category_id | number | 否 | 按版块筛选 |
| keyword | string | 否 | 按标题搜索 |
| orderBy | string | 否 | 排序（latest/popular/pinned） |

**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "帖子标题",
        "summary": "内容摘要...",
        "user_id": 1,
        "category_id": 1,
        "views": 100,
        "likes": 10,
        "comments": 5,
        "is_pinned": 0,
        "is_highlighted": 0,
        "create_time": "2024-01-01T00:00:00.000Z",
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

#### 获取帖子详情（公开）
```
GET /api/posts/{id}
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "title": "帖子标题",
    "content": "帖子完整内容...",
    "user_id": 1,
    "category_id": 1,
    "views": 101,
    "likes": 10,
    "comments": 5,
    "is_pinned": 0,
    "is_highlighted": 0,
    "status": 1,
    "create_time": "2024-01-01T00:00:00.000Z",
    "author_name": "admin",
    "author_nickname": "管理员",
    "author_avatar": null,
    "category_name": "综合讨论"
  }
}
```

#### 发布帖子（登录）
```
POST /api/posts
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题（最多100字符） |
| content | string | 是 | 内容 |
| category_id | number | 是 | 版块ID |

#### 更新帖子（作者或管理员）
```
PUT /api/posts/{id}
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 标题 |
| content | string | 否 | 内容 |
| category_id | number | 否 | 版块ID |

#### 删除帖子（作者或管理员）
```
DELETE /api/posts/{id}
Authorization: Bearer {token}
```

#### 获取我的帖子（登录）
```
GET /api/posts/my
Authorization: Bearer {token}
```

#### 获取帖子统计（公开）
```
GET /api/posts/stats
```
**响应：**
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

### 5.5 评论接口

#### 获取帖子评论（公开）
```
GET /api/posts/{postId}/comments?page=1&pageSize=20
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "post_id": 1,
        "user_id": 1,
        "content": "评论内容",
        "parent_id": null,
        "reply_to_user_id": null,
        "status": 1,
        "create_time": "2024-01-01T00:00:00.000Z",
        "author_name": "admin",
        "author_nickname": "管理员",
        "author_avatar": null,
        "reply_count": 2
      }
    ],
    "pagination": {...}
  }
}
```

#### 获取评论回复（公开）
```
GET /api/comments/{commentId}/replies
```

#### 发表评论（登录）
```
POST /api/posts/{postId}/comments
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 评论内容（最多1000字符） |
| parent_id | number | 否 | 父评论ID（回复时使用） |
| reply_to_user_id | number | 否 | 回复的用户ID |

#### 删除评论（作者或管理员）
```
DELETE /api/comments/{id}
Authorization: Bearer {token}
```

#### 获取我的评论（登录）
```
GET /api/user/comments
Authorization: Bearer {token}
```

---

### 5.6 点赞收藏接口

#### 点赞帖子（登录）
```
POST /api/posts/{id}/like
Authorization: Bearer {token}
```

#### 取消点赞（登录）
```
DELETE /api/posts/{id}/like
Authorization: Bearer {token}
```

#### 收藏帖子（登录）
```
POST /api/posts/{id}/favorite
Authorization: Bearer {token}
```

#### 取消收藏（登录）
```
DELETE /api/posts/{id}/favorite
Authorization: Bearer {token}
```

#### 获取点赞收藏状态（登录）
```
GET /api/posts/{id}/status
Authorization: Bearer {token}
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "liked": true,
    "favorited": false
  }
}
```

#### 获取我点赞的帖子（登录）
```
GET /api/user/likes
Authorization: Bearer {token}
```

#### 获取我收藏的帖子（登录）
```
GET /api/user/favorites
Authorization: Bearer {token}
```

---

### 5.7 签到积分接口

#### 签到（登录）
```
POST /api/sign-in
Authorization: Bearer {token}
```
**响应：**
```json
{
  "success": true,
  "message": "签到成功",
  "data": {
    "points_earned": 20,
    "continuous_days": 3,
    "bonus": 0
  }
}
```

#### 获取签到状态（登录）
```
GET /api/sign-in/status
Authorization: Bearer {token}
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "has_signed_today": true,
    "total_days": 10,
    "total_points": 200,
    "max_continuous_days": 5,
    "current_continuous_days": 3,
    "monthly_dates": ["2024-01-01", "2024-01-02"]
  }
}
```

#### 获取签到记录（登录）
```
GET /api/sign-in/records
Authorization: Bearer {token}
```

#### 获取积分信息（登录）
```
GET /api/sign-in/points
Authorization: Bearer {token}
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "points": 150,
    "can_exchange": true,
    "exchange_cost": 50
  }
}
```

#### 兑换邀请码（登录）
```
POST /api/sign-in/points/exchange
Authorization: Bearer {token}
```
**响应：**
```json
{
  "success": true,
  "message": "兑换成功",
  "data": {
    "code": "abc123def456",
    "points_cost": 50,
    "remaining_points": 100
  }
}
```

#### 获取我兑换的邀请码列表（登录）
```
GET /api/sign-in/points/codes?page=1&pageSize=20&used=0
Authorization: Bearer {token}
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| used | number | 否 | 按使用状态筛选（0未使用/1已使用） |

**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "code": "abc123def456",
        "used": 0,
        "create_time": "2024-01-01T00:00:00.000Z",
        "use_time": null
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "pageSize": 20,
      "totalPages": 1
    }
  }
}
```

---

### 5.8 资源下载接口

#### 设置资源（作者或管理员）
```
POST /api/posts/{postId}/resource
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| download_link | string | 是 | 下载链接 |
| price | number | 否 | 价格（默认50积分） |

#### 获取资源信息（登录）
```
GET /api/posts/{postId}/resource
Authorization: Bearer {token}
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "price": 50,
    "download_count": 10,
    "has_purchased": false,
    "is_author": false
    // download_link 仅在已购买或作者时返回
  }
}
```

#### 兑换资源（登录）
```
POST /api/posts/{postId}/resource/purchase
Authorization: Bearer {token}
```
**响应：**
```json
{
  "success": true,
  "message": "兑换成功",
  "data": {
    "download_link": "https://example.com/file.zip",
    "points_cost": 50,
    "author_earnings": 25
  }
}
```

#### 删除资源（作者或管理员）
```
DELETE /api/posts/{postId}/resource
Authorization: Bearer {token}
```

#### 获取资源统计（公开）
```
GET /api/posts/{postId}/resource/stats
```

#### 获取我的兑换记录（登录）
```
GET /api/user/purchases
Authorization: Bearer {token}
```

#### 获取我的资源收益（登录）
```
GET /api/user/earnings
Authorization: Bearer {token}
```

---

### 5.9 管理员接口

> 所有管理员接口需要 admin 角色

#### 获取统计面板
```
GET /api/admin/dashboard
Authorization: Bearer {token}
```
**响应：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "overview": {
      "total_users": 100,
      "total_posts": 500,
      "total_comments": 2000,
      "total_categories": 5
    },
    "today": {
      "new_users": 5,
      "new_posts": 20,
      "new_comments": 100
    },
    "users": { "total": 100, "active": 95, "disabled": 5, "admins": 2 },
    "posts": { "total": 500, "normal": 480, "deleted": 10, "pending": 10 },
    "invite_codes": { "total": 50, "used": 30, "unused": 20 },
    "hot_posts": [...]
  }
}
```

#### 获取用户列表
```
GET /api/admin/users?page=1&pageSize=20&role=user&status=1&keyword=xxx
Authorization: Bearer {token}
```

#### 获取用户详情
```
GET /api/admin/users/{id}
Authorization: Bearer {token}
```

#### 更新用户状态
```
PUT /api/admin/users/{id}/status
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
```json
{ "status": 0 }
```

#### 更新用户角色
```
PUT /api/admin/users/{id}/role
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
```json
{ "role": "admin" }
```

#### 获取所有帖子（含已删除）
```
GET /api/admin/posts?status=0
Authorization: Bearer {token}
```

#### 更新帖子状态
```
PUT /api/admin/posts/{id}/status
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
```json
{ "status": 1 }
```

#### 获取所有评论
```
GET /api/admin/comments
Authorization: Bearer {token}
```

#### 删除评论
```
DELETE /api/admin/comments/{id}
Authorization: Bearer {token}
```

#### 置顶帖子
```
PUT /api/posts/{id}/pin
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
```json
{ "is_pinned": 1 }
```

#### 加精帖子
```
PUT /api/posts/{id}/highlight
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
```json
{ "is_highlighted": 1 }
```

#### 批量生成邀请码
```
POST /api/invite-codes
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
```json
{ "count": 10 }
```

#### 获取邀请码列表
```
GET /api/invite-codes?page=1&pageSize=20&used=0
Authorization: Bearer {token}
```

#### 删除邀请码
```
DELETE /api/invite-codes/{id}
Authorization: Bearer {token}
```

#### 创建版块
```
POST /api/categories
Authorization: Bearer {token}
Content-Type: application/json
```
**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 版块名称 |
| description | string | 否 | 版块描述 |
| icon | string | 否 | 图标URL |
| sort_order | number | 否 | 排序 |

#### 更新版块
```
PUT /api/categories/{id}
Authorization: Bearer {token}
```

#### 删除版块
```
DELETE /api/categories/{id}
Authorization: Bearer {token}
```

---

## 六、前端页面需求

### 6.1 用户端页面

#### 首页 (/)
**功能：**
- 帖子列表展示（支持分页）
- 版块筛选
- 关键词搜索
- 排序切换（最新/最热/置顶）
- 帖子卡片显示：标题、摘要、作者、浏览量、点赞数、评论数、时间

**接口：**
- GET /api/categories/active
- GET /api/posts

#### 帖子详情页 (/post/:id)
**功能：**
- 帖子内容展示
- 浏览量自动增加
- 点赞/取消点赞
- 收藏/取消收藏
- 评论列表（分页加载）
- 发表评论
- 回复评论
- 资源下载（如有）
- 作者信息展示

**接口：**
- GET /api/posts/:id
- GET /api/posts/:id/status
- POST /api/posts/:id/like
- POST /api/posts/:id/favorite
- DELETE /api/posts/:id/like
- DELETE /api/posts/:id/favorite
- GET /api/posts/:postId/comments
- POST /api/posts/:postId/comments
- GET /api/comments/:commentId/replies
- GET /api/posts/:postId/resource
- POST /api/posts/:postId/resource/purchase

#### 发布帖子页 (/post/create)
**功能：**
- 标题输入
- 内容编辑（支持富文本）
- 版块选择
- 资源设置（可选）

**接口：**
- GET /api/categories/active
- POST /api/posts
- POST /api/posts/:postId/resource

#### 登录/注册页 (/login)
**功能：**
- 登录表单
- 注册表单
- 邀请码输入
- 表单验证

**接口：**
- POST /api/login
- POST /api/register

#### 个人中心 (/user)
**功能：**
- 用户信息展示
- 修改资料
- 修改密码
- 我的帖子
- 我的评论
- 我的收藏
- 我的点赞
- 我的兑换记录
- 我的资源收益

**接口：**
- GET /api/user/info
- PUT /api/user/profile
- PUT /api/user/password
- GET /api/posts/my
- GET /api/user/comments
- GET /api/user/favorites
- GET /api/user/likes
- GET /api/user/purchases
- GET /api/user/earnings

#### 签到页 (/signin)
**功能：**
- 签到按钮
- 签到状态展示
- 连续签到天数
- 本月签到日历
- 积分信息
- 兑换邀请码

**接口：**
- POST /api/sign-in
- GET /api/sign-in/status
- GET /api/sign-in/records
- GET /api/sign-in/points
- POST /api/sign-in/points/exchange

---

### 6.2 管理端页面

#### 数据面板 (/admin)
**功能：**
- 总览数据卡片
- 今日数据
- 用户统计
- 帖子统计
- 热门帖子

**接口：**
- GET /api/admin/dashboard

#### 用户管理 (/admin/users)
**功能：**
- 用户列表
- 搜索筛选
- 查看详情
- 禁用/启用
- 设置角色

**接口：**
- GET /api/admin/users
- GET /api/admin/users/:id
- PUT /api/admin/users/:id/status
- PUT /api/admin/users/:id/role

#### 帖子管理 (/admin/posts)
**功能：**
- 帖子列表（含已删除）
- 搜索筛选
- 审核帖子
- 删除帖子
- 置顶/加精

**接口：**
- GET /api/admin/posts
- PUT /api/admin/posts/:id/status
- PUT /api/posts/:id/pin
- PUT /api/posts/:id/highlight
- DELETE /api/posts/:id

#### 评论管理 (/admin/comments)
**功能：**
- 评论列表
- 删除评论

**接口：**
- GET /api/admin/comments
- DELETE /api/admin/comments/:id

#### 版块管理 (/admin/categories)
**功能：**
- 版块列表
- 创建版块
- 编辑版块
- 删除版块
- 启用/禁用

**接口：**
- GET /api/categories
- POST /api/categories
- PUT /api/categories/:id
- DELETE /api/categories/:id
- PUT /api/categories/:id/status

#### 邀请码管理 (/admin/invites)
**功能：**
- 邀请码列表
- 批量生成
- 删除邀请码
- 统计信息

**接口：**
- GET /api/invite-codes
- POST /api/invite-codes
- DELETE /api/invite-codes/:id
- GET /api/invite-codes/stats

---

## 七、前端开发建议

### 7.1 技术栈
- Vue 3 + Vite
- Element Plus（UI组件库）
- Vue Router（路由）
- Pinia（状态管理）
- Axios（HTTP请求）

### 7.2 项目结构
```
src/
├── api/           # API接口封装
├── components/    # 公共组件
├── views/         # 页面组件
├── router/        # 路由配置
├── store/         # 状态管理
├── utils/         # 工具函数
└── assets/        # 静态资源
```

### 7.3 API 封装示例
```javascript
// api/request.js
import axios from 'axios'

const request = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
request.interceptors.response.use(
  response => {
    if (response.data.success) {
      return response.data
    }
    return Promise.reject(response.data.message)
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request
```

### 7.4 路由权限控制
```javascript
// router/index.js
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.requiresAdmin && userRole !== 'admin') {
    next('/')
  } else {
    next()
  }
})
```

---

## 八、注意事项

1. **Token 存储**：登录成功后将 token 存储在 localStorage
2. **Token 携带**：所有需要认证的接口都要在 Header 中携带 Token
3. **错误处理**：统一处理 401 错误，跳转登录页
4. **分页处理**：列表接口统一使用 page 和 pageSize 参数
5. **权限控制**：前端根据用户角色显示/隐藏功能
6. **防重复提交**：签到、点赞、收藏等操作需要防止重复

---

## 九、联系方式

如有接口问题，请联系后端开发人员。
