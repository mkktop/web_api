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
  "success": false,
  "message": "路由 /api/unknown 不存在",
  "timestamp": "2024-01-15T10:30:45.000Z"
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
  "success": false,
  "message": "服务器内部错误",
  "timestamp": "2024-01-15T10:30:45.000Z"
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

## 自定义中间件示例

```javascript
// 请求日志中间件
const requestLogger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();  // 必须调用next()，否则请求会卡住
};

// 认证中间件
const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: '未授权' });
  }
  // 验证token...
  next();
};
```
