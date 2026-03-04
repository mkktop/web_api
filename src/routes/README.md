# 路由模块 (routes)

路由模块负责定义API的URL路径和处理函数的映射关系。

## 什么是路由？

路由是Web服务器的核心概念，它定义了：
- **HTTP方法**：GET、POST、PUT、DELETE等
- **URL路径**：如 `/api/system/time`
- **处理函数**：当请求匹配时执行的函数

**路由工作流程：**
```
客户端请求 → Express路由匹配 → 执行处理函数 → 返回响应
```

## 文件说明

### index.js - 路由入口

统一管理所有API路由，为不同模块添加路径前缀。

**当前路由结构：**
```
/api
├── /system               # 系统相关
│   ├── GET /time         # 获取时间
│   └── GET /info         # 获取系统信息
├── /invite-codes         # 邀请码管理（仅管理员，RESTful风格）
│   ├── POST /            # 创建邀请码（批量生成）
│   ├── GET /             # 查询邀请码列表
│   ├── GET /stats        # 获取邀请码统计
│   ├── DELETE /:id       # 删除邀请码
│   └── POST /cleanup     # 清理过期邀请码
├── /categories           # 版块分类
│   ├── GET /active       # 获取启用的版块列表（公开）
│   ├── GET /:id          # 获取版块详情（公开）
│   ├── GET /             # 获取版块列表（管理员）
│   ├── GET /stats        # 获取版块统计（管理员）
│   ├── POST /            # 创建版块（管理员）
│   ├── PUT /:id          # 更新版块（管理员）
│   ├── PUT /:id/status   # 更新版块状态（管理员）
│   └── DELETE /:id       # 删除版块（管理员）
├── /device               # 设备相关（待实现）
└── /ota                  # OTA升级（待实现）
```

**使用示例：**
```javascript
// 在 app.js 中
const routes = require('./routes');
app.use('/api', routes);
```

---

### system.routes.js - 系统路由

定义系统相关的API路由。

**路由列表：**

| 方法 | 路径 | 处理函数 | 说明 |
|------|------|----------|------|
| GET | /time | systemController.getTime | 获取服务器时间 |
| GET | /info | systemController.getSystemInfo | 获取系统信息 |

**完整URL：**
- `GET /api/system/time`
- `GET /api/system/info`

### invite_code.routes.js - 邀请码管理路由

定义邀请码管理相关的API路由（RESTful风格），所有接口仅限管理员访问。

**路由列表：**

| 方法 | 路径 | 处理函数 | 说明 |
|------|------|----------|------|
| POST | / | inviteCodeController.generate | 创建邀请码（批量生成） |
| GET | / | inviteCodeController.list | 查询邀请码列表 |
| GET | /stats | inviteCodeController.stats | 获取邀请码统计 |
| DELETE | /:id | inviteCodeController.remove | 删除邀请码 |
| POST | /cleanup | inviteCodeController.cleanup | 清理过期邀请码 |

**完整URL：**
- `POST /api/invite-codes`
- `GET /api/invite-codes`
- `GET /api/invite-codes/stats`
- `DELETE /api/invite-codes/:id`
- `POST /api/invite-codes/cleanup`

**RESTful设计说明：**
- 资源命名使用复数形式 `invite-codes`
- POST 用于创建资源
- GET 用于获取资源
- DELETE 用于删除资源
- 特殊操作（stats、cleanup）作为子资源

---

### category.routes.js - 版块分类路由

定义版块分类相关的API路由（RESTful风格）。

**路由列表：**

| 方法 | 路径 | 处理函数 | 说明 | 权限 |
|------|------|----------|------|------|
| GET | /active | categoryController.getActiveList | 获取启用的版块列表 | 公开 |
| GET | /:id | categoryController.getById | 获取版块详情 | 公开 |
| GET | / | categoryController.list | 获取版块列表 | admin |
| GET | /stats | categoryController.stats | 获取版块统计 | admin |
| POST | / | categoryController.create | 创建版块 | admin |
| PUT | /:id | categoryController.update | 更新版块 | admin |
| PUT | /:id/status | categoryController.updateStatus | 更新版块状态 | admin |
| DELETE | /:id | categoryController.remove | 删除版块 | admin |

**完整URL：**
- `GET /api/categories/active` （公开）
- `GET /api/categories/:id` （公开）
- `GET /api/categories` （管理员）
- `GET /api/categories/stats` （管理员）
- `POST /api/categories` （管理员）
- `PUT /api/categories/:id` （管理员）
- `PUT /api/categories/:id/status` （管理员）
- `DELETE /api/categories/:id` （管理员）

**权限设计说明：**
- 公开接口：获取启用的版块列表、获取版块详情
- 管理员接口：创建、更新、删除版块

---

## 路由定义方式

### 基本路由

```javascript
// GET请求
router.get('/path', handler);

// POST请求
router.post('/path', handler);

// PUT请求
router.put('/path', handler);

// DELETE请求
router.delete('/path', handler);
```

### 带参数的路由

```javascript
// URL参数
router.get('/device/:id', (req, res) => {
  const deviceId = req.params.id;  // 获取URL参数
});

// 查询参数
// GET /device?id=123
router.get('/device', (req, res) => {
  const deviceId = req.query.id;  // 获取查询参数
});
```

### 带中间件的路由

```javascript
// 在处理函数前添加中间件
router.get('/protected', authMiddleware, handler);

// 多个中间件
router.post('/data', authMiddleware, validateMiddleware, handler);
```

## 路由组织原则

1. **按模块分离**：每个功能模块有独立的路由文件
2. **统一前缀**：相关路由使用统一的前缀
3. **RESTful风格**：遵循REST API设计规范
   - GET：获取资源
   - POST：创建资源
   - PUT：更新资源
   - DELETE：删除资源

## 扩展路由

添加新模块路由的步骤：

1. 创建路由文件 `src/routes/device.routes.js`
2. 在 `index.js` 中引入并挂载
3. 创建对应的控制器

```javascript
// index.js
const deviceRoutes = require('./device.routes');
router.use('/device', deviceRoutes);
```
