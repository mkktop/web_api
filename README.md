# Web API 项目

嵌入式设备管理后端API服务，用于对接嵌入式设备和个人网站，提供设备信息展示、OTA升级等功能。

## 项目概述

本项目是一个基于 Node.js + Express 构建的后端API服务，主要功能包括：

- 设备管理与监控
- OTA固件升级
- 系统信息查询
- 设备时间同步

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | v22.19.0 | JavaScript运行环境 |
| Express | 4.x | Web框架 |
| Winston | 3.x | 日志管理 |
| dotenv | 16.x | 环境变量管理 |
| CORS | 2.x | 跨域支持 |
| PM2 | - | 进程管理（生产环境） |

## 项目结构

```
web_api/
├── .github/                     # GitHub配置
│   └── workflows/               # GitHub Actions工作流
│       └── deploy.yml           # 自动部署配置
├── docs/                        # 文档目录
│   ├── API.md                   # API接口文档
│   └── DEPLOY.md                # 部署指南
├── logs/                        # 日志目录（自动生成）
│   ├── error.log                # 错误日志
│   └── combined.log             # 综合日志
├── src/                         # 源代码目录
│   ├── config/                  # 配置模块
│   │   ├── index.js             # 配置入口
│   │   ├── constants.js         # 常量定义
│   │   └── README.md            # 模块文档
│   ├── controllers/             # 控制器层
│   │   ├── system.controller.js # 系统控制器
│   │   └── README.md            # 模块文档
│   ├── middlewares/             # 中间件
│   │   ├── errorHandler.js      # 错误处理
│   │   └── README.md            # 模块文档
│   ├── routes/                  # 路由层
│   │   ├── index.js             # 路由入口
│   │   ├── system.routes.js     # 系统路由
│   │   └── README.md            # 模块文档
│   ├── utils/                   # 工具函数
│   │   ├── logger.js            # 日志工具
│   │   ├── response.js          # 响应格式化
│   │   └── README.md            # 模块文档
│   └── app.js                   # 应用入口
├── uploads/                     # 上传文件目录（OTA固件）
├── .env                         # 环境变量配置
├── .gitignore                   # Git忽略配置
├── ecosystem.config.js          # PM2配置文件
├── package.json                 # 项目配置
└── README.md                    # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（已提供默认配置）：

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### 3. 启动服务

```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm start

# 使用PM2启动（生产环境推荐）
npm run pm2:start
```

### 4. 测试接口

访问 http://localhost:3000 查看API列表

```bash
# 获取服务器时间
curl http://localhost:3000/api/system/time

# 获取系统信息
curl http://localhost:3000/api/system/info
```

## API概览

### 已实现接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | / | API列表 |
| GET | /api/system/time | 获取服务器时间 |
| GET | /api/system/info | 获取系统信息 |

### 待实现接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/device/register | 设备注册 |
| POST | /api/device/heartbeat | 设备心跳 |
| GET | /api/device/list | 设备列表 |
| POST | /api/ota/upload | 上传固件 |
| GET | /api/ota/check/:deviceId | 检查更新 |

详细API文档请查看 [API文档](docs/API.md)

## 部署

### 自动部署（推荐）

本项目配置了 GitHub Actions 自动部署，推送到 main 分支会自动部署到服务器。

详细配置步骤请查看 [部署指南](docs/DEPLOY.md)

### 手动部署

```bash
# 在服务器上
git clone https://github.com/你的用户名/web_api.git
cd web_api
npm install --production
npm run pm2:start
```

### PM2 常用命令

```bash
npm run pm2:start    # 启动应用
npm run pm2:stop     # 停止应用
npm run pm2:restart  # 重启应用
npm run pm2:logs     # 查看日志
npm run pm2:monit    # 监控面板
```

## 架构说明

### 分层架构

```
请求 → 路由(Routes) → 控制器(Controller) → 服务(Service) → 数据模型(Model)
                     ↓
                   响应(Response)
```

**各层职责：**

- **路由层 (Routes)**：定义URL路径与处理函数的映射
- **控制器层 (Controllers)**：处理请求参数，调用业务逻辑，返回响应
- **服务层 (Services)**：封装业务逻辑（待实现）
- **模型层 (Models)**：定义数据结构（待实现）
- **中间件 (Middlewares)**：处理跨域、认证、错误等
- **工具层 (Utils)**：提供日志、响应格式化等工具函数

### 请求处理流程

```
1. 客户端发起HTTP请求
2. Express接收请求
3. 经过中间件处理（CORS、JSON解析、日志记录）
4. 路由匹配找到对应的处理函数
5. 控制器处理业务逻辑
6. 返回统一格式的响应
7. 错误处理中间件捕获异常
```

## 开发指南

### 添加新接口

1. 在 `src/controllers/` 创建控制器
2. 在 `src/routes/` 创建路由
3. 在 `src/routes/index.js` 中注册路由
4. 更新API文档

### 代码规范

- 使用详细的注释说明代码功能
- 遵循统一的响应格式
- 错误信息要友好、明确
- 每个模块都要有对应的README文档

### 日志使用

```javascript
const logger = require('./utils/logger');

logger.info('一般信息');
logger.warn('警告信息');
logger.error('错误信息');
logger.debug('调试信息');
```

## 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 3000 | 服务器端口 |
| NODE_ENV | development | 运行环境 |
| LOG_LEVEL | info | 日志级别 |

## 常见问题

### Q: 端口被占用怎么办？

修改 `.env` 文件中的 `PORT` 值。

### Q: 如何查看日志？

日志文件位于 `logs/` 目录：
- `error.log` - 只记录错误
- `combined.log` - 记录所有日志

### Q: 如何添加新的API模块？

参考现有的 `system` 模块结构，创建对应的控制器和路由文件。

## 文档目录

- [API接口文档](docs/API.md)
- [部署指南](docs/DEPLOY.md)
- [项目开发规范](.trae/rules/project_rules.md)

## 后续计划

- [ ] 设备注册与管理
- [ ] 设备心跳检测
- [ ] OTA固件升级
- [ ] 数据库集成
- [ ] JWT认证
- [ ] WebSocket实时通信

## 许可证

MIT
