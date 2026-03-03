# 配置模块 (config)

本模块负责管理应用程序的所有配置信息。

## 文件说明

### index.js - 主配置文件

负责加载环境变量并导出配置对象。

**配置项说明：**

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| port | number | 3000 | 服务器监听端口 |
| env | string | 'development' | 运行环境 |
| logLevel | string | 'info' | 日志级别 |
| apiPrefix | string | '/api' | API路由前缀 |

**使用示例：**

```javascript
const config = require('./config');

console.log(config.port);     // 3000
console.log(config.env);      // 'development'
```

### constants.js - 常量定义

定义HTTP状态码等常量，便于统一管理和使用。

**状态码说明：**

| 常量名 | 值 | 说明 |
|--------|-----|------|
| OK | 200 | 请求成功 |
| CREATED | 201 | 资源创建成功 |
| BAD_REQUEST | 400 | 请求参数错误 |
| UNAUTHORIZED | 401 | 未授权/未登录 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| INTERNAL_SERVER_ERROR | 500 | 服务器内部错误 |

**使用示例：**

```javascript
const HttpStatus = require('./config/constants');

res.status(HttpStatus.OK).json({ message: '成功' });
res.status(HttpStatus.NOT_FOUND).json({ message: '未找到' });
```

## 环境变量

通过 `.env` 文件配置环境变量：

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

## 运行环境

- `development`: 开发环境，启用详细日志和调试功能
- `production`: 生产环境，优化性能，减少日志输出
- `test`: 测试环境，用于单元测试和集成测试
