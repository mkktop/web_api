# 中间件模块 (middlewares)

本模块包含应用程序使用的各种中间件。

## 什么是中间件？

中间件是 Express 的核心概念，它是一个函数，可以：
- 访问请求对象 (req) 和响应对象 (res)
- 修改请求和响应对象
- 结束请求-响应周期
- 调用下一个中间件 (next)

**中间件执行流程：**
```
请求 → 中间件1 → 中间件2 → 路由处理器 → 响应
```

## 文件说明

### auth.js - 认证中间件

提供 JWT Token 验证和用户认证功能。

**包含的中间件：**

#### authMiddleware - 认证中间件

验证请求头中的 JWT Token，提取用户信息。

**使用示例：**
```javascript
const { authMiddleware } = require('../middlewares/auth');

// 保护需要登录的路由
router.get('/user/info', authMiddleware, (req, res) => {
  console.log(req.user.id);  // 当前登录用户的 ID
});
```

**工作原理：**
1. 从请求头获取 Authorization 字段
2. 提取 Bearer Token
3. 验证 Token 是否有效
4. 将用户信息附加到 req.user
5. 调用 next() 继续执行

**请求头格式：**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**失败响应：**
```json
{
  "code": 401,
  "msg": "未登录或 Token 过期",
  "data": {}
}
```

#### optionalAuth - 可选认证中间件

如果有 Token 则验证，没有 Token 也允许继续。

```javascript
const { optionalAuth } = require('../middlewares/auth');

// 可登录访问，也可游客访问
router.get('/posts', optionalAuth, getPosts);
```

#### adminMiddleware - 管理员权限中间件

验证用户是否为管理员（必须先使用 authMiddleware）。

```javascript
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// 只有管理员可以访问
router.delete('/user/:id', authMiddleware, adminMiddleware, deleteUser);
```

---

### errorHandler.js - 错误处理中间件

提供统一的错误处理机制。

**包含的中间件：**

#### notFound - 404处理中间件

当请求没有匹配到任何路由时调用。

**使用示例：**
```javascript
// 放在所有路由之后
app.use(notFound);
```

**响应示例：**
```json
{
  "code": 404,
  "msg": "路由 /api/unknown 不存在",
  "data": {}
}
```

#### errorHandler - 全局错误处理中间件

捕获应用中所有未处理的错误。

**使用示例：**
```javascript
// 放在所有中间件的最后
app.use(errorHandler);
```

**工作原理：**
1. 捕获路由或中间件中抛出的错误
2. 记录错误堆栈到控制台
3. 返回统一的错误响应格式

**错误响应示例：**
```json
{
  "code": 500,
  "msg": "服务器内部错误",
  "data": {}
}
```

## 中间件注册顺序

在 Express 中，中间件的注册顺序非常重要：

```javascript
// 1. 首先注册基础中间件
app.use(express.json());
app.use(cors());

// 2. 然后注册路由
app.use('/api', routes);

// 3. 最后注册错误处理中间件
app.use(notFound);      // 处理404
app.use(errorHandler);  // 处理其他错误
```

## 在路由中使用认证中间件

```javascript
const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// 公开路由（无需登录）
router.post('/login', login);
router.post('/register', register);

// 需要登录的路由
router.get('/user/info', authMiddleware, getUserInfo);
router.put('/user/profile', authMiddleware, updateProfile);

// 需要管理员权限的路由
router.get('/admin/users', authMiddleware, adminMiddleware, listUsers);
router.delete('/admin/user/:id', authMiddleware, adminMiddleware, deleteUser);

module.exports = router;
```

## 自定义中间件示例

```javascript
// 请求日志中间件
const requestLogger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();  // 必须调用next()，否则请求会卡住
};

// 角色权限中间件
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, msg: '未登录', data: {} });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, msg: '权限不足', data: {} });
    }
    next();
  };
};
```
