# 工具模块 (utils)

本模块提供通用的工具函数，供其他模块调用。

## 文件说明

### logger.js - 日志工具

使用 Winston 库实现统一的日志记录功能。

**功能特性：**
- 控制台彩色输出，便于开发调试
- 文件存储，便于生产环境排查问题
- 支持多种日志级别

**日志级别：**

| 级别 | 用途 |
|------|------|
| debug | 调试信息，详细的程序运行信息 |
| info | 一般信息，如请求记录、状态变化 |
| warn | 警告信息，潜在问题但不影响运行 |
| error | 错误信息，程序出错但可以继续运行 |

**使用示例：**

```javascript
const logger = require('./utils/logger');

logger.info('服务器启动成功');
logger.warn('内存使用率较高');
logger.error('数据库连接失败');
logger.debug('请求参数：', { id: 1, name: 'test' });
```

**日志格式：**
```
[2024-01-15 10:30:45] INFO: 服务器启动成功
```

**日志文件：**
- `logs/error.log` - 只记录错误日志
- `logs/combined.log` - 记录所有日志

---

### response.js - 响应格式化工具

提供统一的 API 响应格式。

**统一响应格式：**

成功响应：
```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

失败响应：
```json
{
  "success": false,
  "message": "操作失败",
  "data": {}
}
```

**使用示例：**

```javascript
const response = require('./utils/response');

// 成功响应
response.success(res, { id: 1, name: '设备1' }, '获取成功');

// 失败响应
response.error(res, '设备不存在', 404);

// 分页响应
response.page(res, list, total, page, pageSize, '获取成功');
```

**API 参考：**

| 函数 | 参数 | 说明 |
|------|------|------|
| success | res, data?, message? | 返回成功响应 |
| error | res, message?, statusCode?, data? | 返回错误响应 |
| page | res, list, total, page, pageSize, message? | 返回分页响应 |

**参数说明：**
- `res`: Express 响应对象（必需）
- `data`: 返回的数据（可选，默认 {}）
- `message`: 提示消息（可选，有默认值）
- `statusCode`: HTTP状态码（可选，有默认值）

---

### jwt.js - JWT 工具

提供 JWT Token 的生成和验证功能。

**什么是 JWT？**
- JWT (JSON Web Token) 是一种开放标准，用于安全地传输信息
- 由三部分组成：Header、Payload、Signature
- 常用于身份验证

**使用示例：**

```javascript
const jwt = require('./utils/jwt');

// 生成 Token
const token = jwt.generateToken({
  id: 1,
  username: 'admin',
  role: 'admin'
});

// 验证 Token
const decoded = jwt.verifyToken(token);
if (decoded) {
  console.log('用户ID:', decoded.id);
  console.log('用户名:', decoded.username);
}

// 从请求头提取 Token
const token = jwt.extractToken(req.headers.authorization);
```

**API 参考：**

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| generateToken | payload | string | 生成 JWT Token |
| verifyToken | token | object/null | 验证 Token，返回解码数据 |
| extractToken | authHeader | string/null | 从 Authorization 头提取 Token |
| decodeToken | token | object/null | 解码 Token（不验证签名） |

**Token 有效期：**
- 默认 7 天
- 在 `.env` 中配置：`JWT_EXPIRES_IN=604800`（秒）

**安全说明：**
- JWT 密钥从环境变量读取，禁止硬编码
- 敏感信息不要放在 Token 中
- Token 有效期不宜过长
