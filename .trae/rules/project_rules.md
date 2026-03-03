# 项目开发规范

本文档记录了项目的开发要求和规范，请在每次开发新功能前阅读并遵循。

---

## 代码注释规范

### 必须添加注释的内容

1. **每个文件开头**：使用 `@fileoverview` 说明文件用途
2. **每个函数**：添加函数说明、参数说明、返回值说明、使用示例
3. **关键代码行**：解释代码的作用和原理
4. **复杂逻辑**：解释为什么这样实现

### 注释风格

```javascript
/**
 * @fileoverview 文件说明
 * @description 详细描述
 */

/**
 * 函数说明
 * @description 详细描述
 * @param {Type} paramName - 参数说明
 * @returns {Type} 返回值说明
 * @example
 * // 使用示例
 * functionName(param);
 */
const functionName = (param) => {
  // 行内注释解释关键代码
};
```

### 注释语言

- 所有注释使用**中文**
- 便于初学者理解

---

## 文档同步规范

### 每次开发新功能时必须更新

1. **模块 README.md**：对应模块的文档
   - `src/config/README.md`
   - `src/utils/README.md`
   - `src/middlewares/README.md`
   - `src/controllers/README.md`
   - `src/routes/README.md`

2. **API 文档**：`docs/API.md`
   - 添加新接口说明
   - 更新接口参数和响应示例

3. **项目 README.md**：根目录的 README.md
   - 更新项目结构
   - 更新 API 概览
   - 更新后续计划

### 文档内容要求

- 清晰的功能说明
- 完整的参数说明
- 实际的请求/响应示例
- 使用场景说明

---

## 项目结构规范

### 目录结构

```
web_api/
├── .github/            # GitHub配置
│   └── workflows/      # GitHub Actions工作流
├── docs/               # 文档目录
├── logs/               # 日志目录
├── src/                # 源代码
│   ├── config/         # 配置
│   ├── controllers/    # 控制器
│   ├── middlewares/    # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   ├── services/       # 业务逻辑
│   └── utils/          # 工具函数
├── uploads/            # 上传文件
├── .env                # 环境变量
├── ecosystem.config.js # PM2配置
└── package.json
```

### 添加新功能模块的步骤

1. 创建控制器 `src/controllers/xxx.controller.js`
2. 创建路由 `src/routes/xxx.routes.js`
3. 在 `src/routes/index.js` 注册路由
4. 创建服务层 `src/services/xxx.service.js`（如需要）
5. 创建模型 `src/models/xxx.js`（如需要）
6. 添加代码注释
7. 更新模块 README.md
8. 更新 API 文档
9. 更新项目 README.md

---

## 代码风格规范

### 统一响应格式

成功响应：
```javascript
response.success(res, data, '操作成功');
```

失败响应：
```javascript
response.error(res, '错误信息', HttpStatus.BAD_REQUEST);
```

### 错误处理

- 使用统一的错误处理中间件
- 抛出有意义的错误信息
- 记录错误日志

### 日志使用

```javascript
const logger = require('./utils/logger');

logger.info('一般信息');
logger.warn('警告信息');
logger.error('错误信息');
logger.debug('调试信息');
```

---

## 部署规范

### PM2 进程管理

生产环境使用 PM2 管理进程：

```bash
# 启动应用
npm run pm2:start

# 重启应用
npm run pm2:restart

# 停止应用
npm run pm2:stop

# 查看日志
npm run pm2:logs

# 监控面板
npm run pm2:monit
```

### GitHub Actions 自动部署

- 工作流配置：`.github/workflows/deploy.yml`
- 推送到 main 分支自动触发部署
- 需要配置 GitHub Secrets（详见 `docs/DEPLOY.md`）

### 环境变量

生产环境需要配置：

```env
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

---

## 技术栈

- Node.js v22.19.0
- Express 4.x
- Winston（日志）
- dotenv（环境变量）
- PM2（进程管理）

---

## 项目目标

这是一个用于对接嵌入式设备和个人网站的后端API服务，主要功能：

- 设备管理与监控
- OTA 固件升级
- 设备时间同步
- 系统信息查询

---

## 注意事项

1. 用户是初学者，代码和文档要详细易懂
2. 每个模块都要有对应的 README.md
3. API 接口要有完整的文档
4. 保持代码风格一致
5. 敏感信息不要硬编码，使用环境变量
6. 生产环境使用 PM2 管理进程
