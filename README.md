# Web API 项目

嵌入式设备管理和论坛系统的后端API服务，用于对接嵌入式设备和个人网站，提供设备信息展示、OTA升级、用户管理、论坛等功能。

## 项目概述

本项目是一个基于 Node.js + Express 构建的后端API服务，主要功能包括：

- 用户注册与登录（邀请码机制）
- 版块分类管理
- 帖子发布与管理
- 评论回复功能
- 设备管理与监控
- OTA固件升级
- 系统信息查询

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | v22.19.0 | JavaScript运行环境 |
| Express | 4.x | Web框架 |
| MySQL | 8.x | 数据库 |
| Winston | 3.x | 日志管理 |
| bcryptjs | 2.x | 密码加密 |
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
│   │   ├── auth.controller.js   # 用户认证控制器
│   │   ├── system.controller.js # 系统控制器
│   │   ├── invite_code.controller.js # 邀请码控制器
│   │   ├── category.controller.js # 版块分类控制器
│   │   ├── post.controller.js   # 帖子控制器
│   │   └── README.md            # 模块文档
│   ├── middlewares/             # 中间件
│   │   ├── auth.js              # 认证中间件
│   │   ├── errorHandler.js      # 错误处理
│   │   └── README.md            # 模块文档
│   ├── models/                  # 数据模型层
│   │   ├── database.js          # 数据库连接
│   │   ├── user.model.js        # 用户模型
│   │   ├── invite_code.model.js # 邀请码模型
│   │   ├── user_profile.model.js# 用户资料模型
│   │   ├── user_auth.model.js   # 用户权限模型
│   │   ├── category.model.js    # 版块分类模型
│   │   ├── post.model.js        # 帖子模型
│   │   ├── init.js              # 数据库初始化
│   │   ├── index.js             # 模型入口
│   │   └── README.md            # 模块文档
│   ├── routes/                  # 路由层
│   │   ├── index.js             # 路由入口
│   │   ├── auth.routes.js       # 认证路由
│   │   ├── system.routes.js     # 系统路由
│   │   ├── invite_code.routes.js# 邀请码路由
│   │   ├── category.routes.js   # 版块分类路由
│   │   ├── post.routes.js       # 帖子路由
│   │   └── README.md            # 模块文档
│   ├── utils/                   # 工具函数
│   │   ├── logger.js            # 日志工具
│   │   ├── response.js          # 响应格式化
│   │   ├── jwt.js               # JWT工具
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

创建 `.env` 文件：

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

### 3. 初始化数据库

```bash
# 确保 MySQL 服务已启动，然后执行
npm run db:init
```

初始化完成后会自动创建：
- 默认管理员账号：`admin` / `admin123`
- 初始邀请码（用于注册新用户）
- 默认版块（综合讨论、技术交流、闲聊灌水）

### 4. 启动服务

```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm start

# 使用PM2启动（生产环境推荐）
npm run pm2:start
```

### 5. 测试接口

访问 http://localhost:3000 查看API列表

```bash
# 获取服务器时间
curl http://localhost:3000/api/system/time

# 获取系统信息
curl http://localhost:3000/api/system/info

# 获取版块列表
curl http://localhost:3000/api/categories/active

# 获取帖子列表
curl http://localhost:3000/api/posts
```

## 数据库设计

### 用户主表 (user)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 用户唯一ID（主键） |
| username | VARCHAR(50) | 登录用户名（唯一） |
| password | VARCHAR(100) | 加密密码（bcrypt） |
| email | VARCHAR(100) | 邮箱（唯一） |
| nickname | VARCHAR(50) | 昵称 |
| avatar | VARCHAR(255) | 头像URL |
| role | VARCHAR(20) | 角色（user/admin） |
| status | TINYINT | 状态：1正常 0禁用 |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

### 邀请码表 (invite_code)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 邀请码ID（主键） |
| code | VARCHAR(32) | 邀请码（唯一） |
| used | TINYINT | 状态：0未使用 1已使用 |
| user_id | INT | 绑定的用户ID |
| create_time | DATETIME | 创建时间 |
| use_time | DATETIME | 使用时间 |

### 用户资料表 (user_profile)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 资料ID（主键） |
| user_id | INT | 关联用户ID（唯一） |
| signature | VARCHAR(255) | 个性签名 |
| gender | VARCHAR(10) | 性别 |
| birthday | DATE | 生日 |

### 用户权限表 (user_auth)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 权限ID（主键） |
| user_id | INT | 关联用户ID（唯一） |
| points | INT | 用户积分 |
| download_limit | INT | 每日下载限制 |
| can_upload | TINYINT | 能否上传 |
| can_comment | TINYINT | 能否评论 |

### 版块分类表 (category)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 版块ID（主键） |
| name | VARCHAR(50) | 版块名称 |
| description | VARCHAR(255) | 版块描述 |
| icon | VARCHAR(255) | 版块图标 |
| sort_order | INT | 排序 |
| status | TINYINT | 状态：1启用 0禁用 |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

### 帖子表 (post)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 帖子ID（主键） |
| title | VARCHAR(100) | 帖子标题 |
| content | TEXT | 帖子内容 |
| user_id | INT | 作者ID |
| category_id | INT | 版块ID |
| views | INT | 浏览量 |
| likes | INT | 点赞数 |
| comments | INT | 评论数 |
| is_pinned | TINYINT | 是否置顶 |
| is_highlighted | TINYINT | 是否加精 |
| status | TINYINT | 状态：1正常 0删除 2审核中 |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

## API概览

### 已实现接口

| 模块 | 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|------|
| 系统 | GET | /api/system/time | 获取服务器时间 | 公开 |
| 系统 | GET | /api/system/info | 获取系统信息 | 公开 |
| 认证 | POST | /api/register | 用户注册 | 公开 |
| 认证 | POST | /api/login | 用户登录 | 公开 |
| 认证 | GET | /api/user/info | 获取用户信息 | 登录 |
| 认证 | PUT | /api/user/profile | 更新用户资料 | 登录 |
| 认证 | PUT | /api/user/password | 修改密码 | 登录 |
| 邀请码 | POST | /api/invite-codes | 批量生成邀请码 | admin |
| 邀请码 | GET | /api/invite-codes | 查询邀请码列表 | admin |
| 邀请码 | GET | /api/invite-codes/stats | 获取邀请码统计 | admin |
| 邀请码 | DELETE | /api/invite-codes/:id | 删除邀请码 | admin |
| 版块 | GET | /api/categories/active | 获取启用的版块列表 | 公开 |
| 版块 | GET | /api/categories/:id | 获取版块详情 | 公开 |
| 版块 | POST | /api/categories | 创建版块 | admin |
| 版块 | PUT | /api/categories/:id | 更新版块 | admin |
| 版块 | DELETE | /api/categories/:id | 删除版块 | admin |
| 帖子 | GET | /api/posts | 获取帖子列表 | 公开 |
| 帖子 | GET | /api/posts/:id | 获取帖子详情 | 公开 |
| 帖子 | GET | /api/posts/stats | 获取帖子统计 | 公开 |
| 帖子 | POST | /api/posts | 发布帖子 | 登录 |
| 帖子 | GET | /api/posts/my | 获取我的帖子 | 登录 |
| 帖子 | PUT | /api/posts/:id | 更新帖子 | 作者/管理员 |
| 帖子 | DELETE | /api/posts/:id | 删除帖子 | 作者/管理员 |
| 帖子 | PUT | /api/posts/:id/pin | 置顶帖子 | admin |
| 帖子 | PUT | /api/posts/:id/highlight | 加精帖子 | admin |

详细API文档请查看 [API文档](docs/API.md)

## 用户注册流程

```
1. 验证邀请码有效
   ↓
2. 插入 user 表（创建用户）
   ↓
3. 自动插入 user_profile（空值）
   ↓
4. 自动插入 user_auth（默认值）
   ↓
5. 标记邀请码为已使用
```

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

# 配置环境变量
nano .env

# 初始化数据库
npm run db:init

# 启动服务
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
请求 → 路由(Routes) → 控制器(Controller) → 数据模型(Model)
                     ↓
                   响应(Response)
```

**各层职责：**

- **路由层 (Routes)**：定义URL路径与处理函数的映射
- **控制器层 (Controllers)**：处理请求参数，调用业务逻辑，返回响应
- **模型层 (Models)**：定义数据结构和数据库操作
- **中间件 (Middlewares)**：处理跨域、认证、错误等
- **工具层 (Utils)**：提供日志、响应格式化等工具函数

## 开发指南

### 添加新接口

1. 在 `src/models/` 创建数据模型
2. 在 `src/controllers/` 创建控制器
3. 在 `src/routes/` 创建路由
4. 在 `src/routes/index.js` 中注册路由
5. 更新API文档

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
| DB_HOST | localhost | 数据库地址 |
| DB_PORT | 3306 | 数据库端口 |
| DB_USER | root | 数据库用户名 |
| DB_PASSWORD | - | 数据库密码 |
| DB_NAME | web_api | 数据库名称 |
| JWT_SECRET | - | JWT密钥 |
| JWT_EXPIRES_IN | 604800 | JWT过期时间（秒） |
| BCRYPT_SALT_ROUNDS | 10 | 密码加密轮数 |

## 常见问题

### Q: 数据库连接失败？

1. 检查 MySQL 服务是否启动
2. 检查 `.env` 中的数据库配置是否正确
3. 检查数据库用户是否有权限

### Q: 如何初始化数据库？

```bash
npm run db:init
```

### Q: 默认管理员账号？

- 用户名：`admin`
- 密码：`admin123`
- 请登录后立即修改密码！

### Q: 端口被占用怎么办？

修改 `.env` 文件中的 `PORT` 值。

## 文档目录

- [API接口文档](docs/API.md)
- [部署指南](docs/DEPLOY.md)
- [数据模型文档](src/models/README.md)
- [项目开发规范](.trae/rules/project_rules.md)

## 后续计划

- [x] 数据库集成
- [x] 用户表设计
- [x] 用户注册与登录API
- [x] JWT认证中间件
- [x] 邀请码管理
- [x] 版块分类管理
- [x] 帖子管理
- [ ] 评论回复功能
- [ ] 点赞收藏功能
- [ ] 设备注册与管理
- [ ] 设备心跳检测
- [ ] OTA固件升级
- [ ] WebSocket实时通信

## 许可证

MIT
