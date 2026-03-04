# 配置模块 (config)

本模块负责管理应用程序的所有配置信息。

## 文件说明

### index.js - 主配置文件

负责加载环境变量并导出配置对象。

**服务器配置：**

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| port | number | 3000 | 服务器监听端口 |
| env | string | 'development' | 运行环境 |
| logLevel | string | 'info' | 日志级别 |
| apiPrefix | string | '/api' | API路由前缀 |

**数据库配置：**

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| database.host | string | 'localhost' | 数据库服务器地址 |
| database.port | number | 3306 | 数据库端口 |
| database.user | string | 'root' | 数据库用户名 |
| database.password | string | '' | 数据库密码 |
| database.name | string | 'web_api' | 数据库名称 |
| database.pool.max | number | 10 | 连接池最大连接数 |
| database.pool.min | number | 2 | 连接池最小连接数 |

**安全配置：**

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| jwtSecret | string | - | JWT 密钥 |
| jwtExpiresIn | number | 604800 | JWT 过期时间（秒） |
| bcryptSaltRounds | number | 10 | 密码加密盐值轮数 |

**使用示例：**

```javascript
const config = require('./config');

console.log(config.port);           // 3000
console.log(config.env);            // 'development'
console.log(config.database.host);  // 'localhost'
console.log(config.database.name);  // 'web_api'
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
# ==================== 服务器配置 ====================
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# ==================== MySQL 数据库配置 ====================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=web_api

# ==================== 安全配置 ====================
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=604800
BCRYPT_SALT_ROUNDS=10
```

## 运行环境

- `development`: 开发环境，启用详细日志和调试功能
- `production`: 生产环境，优化性能，减少日志输出
- `test`: 测试环境，用于单元测试和集成测试

## 安全提示

1. **不要提交 .env 文件** - 已在 .gitignore 中配置
2. **生产环境使用强密码** - 数据库密码应足够复杂
3. **修改 JWT 密钥** - 生产环境必须修改为复杂的随机字符串
4. **使用专用数据库用户** - 生产环境不要使用 root
