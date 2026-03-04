/**
 * @fileoverview 路由入口文件
 * @description 统一管理所有API路由，将不同模块的路由组合在一起
 * 
 * 为什么需要路由入口？
 * - 集中管理所有路由模块
 * - 统一添加路由前缀
 * - 方便维护和扩展
 * 
 * 路由组织结构：
 * /api                    <- 主应用挂载点（在app.js中配置）
 *   ├── POST /register    <- 用户注册
 *   ├── POST /login       <- 用户登录
 *   ├── GET  /user/info   <- 获取用户信息
 *   ├── PUT  /user/profile<- 更新用户资料
 *   ├── PUT  /user/password<- 修改密码
 *   ├── /system           <- 系统相关路由
 *   │     ├── /time       <- 获取时间
 *   │     └── /info       <- 获取系统信息
 *   ├── /device           <- 设备相关路由（待实现）
 *   └── /ota              <- OTA升级路由（待实现）
 */

// 引入Express框架
const express = require('express');

// 创建路由器实例
const router = express.Router();

// 引入各个模块的路由
// 每个模块有自己的路由文件，便于管理和维护
const systemRoutes = require('./system.routes');
const authRoutes = require('./auth.routes');
const inviteCodeRoutes = require('./invite_code.routes');
const categoryRoutes = require('./category.routes');
// const deviceRoutes = require('./device.routes');  // 待实现
// const otaRoutes = require('./ota.routes');        // 待实现

/**
 * 挂载子路由
 * 
 * router.use(路径前缀, 子路由)
 * - 第一个参数：路径前缀，所有该子路由的URL都会加上这个前缀
 * - 第二个参数：子路由模块
 * 
 * 例如：
 * - systemRoutes中定义了 GET /time
 * - 挂载到 /system 后，完整路径变为 GET /api/system/time
 */

// 认证相关路由（注册、登录等）
// 这些路由直接挂载到根路径，不使用前缀
// POST /api/register
// POST /api/login
// GET  /api/user/info
router.use('/', authRoutes);

// 系统相关路由，前缀为 /system
router.use('/system', systemRoutes);

// 邀请码管理路由，前缀为 /invite-codes（RESTful风格，使用复数）
router.use('/invite-codes', inviteCodeRoutes);

// 版块分类路由，前缀为 /categories（RESTful风格，使用复数）
router.use('/categories', categoryRoutes);

// 设备相关路由（待实现）
// router.use('/device', deviceRoutes);

// OTA升级相关路由（待实现）
// router.use('/ota', otaRoutes);

// 导出路由器，供app.js使用
module.exports = router;
