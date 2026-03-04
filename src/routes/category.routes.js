/**
 * @fileoverview 版块分类路由
 * @description 定义版块分类相关的API路由（RESTful风格）
 * 
 * 路由列表：
 * - GET    /api/categories           - 获取版块列表（管理用）
 * - GET    /api/categories/active    - 获取启用的版块列表
 * - GET    /api/categories/stats     - 获取版块统计
 * - GET    /api/categories/:id       - 获取版块详情
 * - POST   /api/categories           - 创建版块（管理员）
 * - PUT    /api/categories/:id       - 更新版块（管理员）
 * - PUT    /api/categories/:id/status - 更新版块状态（管理员）
 * - DELETE /api/categories/:id       - 删除版块（管理员）
 * 
 * 权限说明：
 * - 获取列表/详情：所有用户
 * - 创建/编辑/删除：仅管理员
 * 
 * 注意：路由顺序很重要！
 * - 静态路由（如 /active, /stats）必须放在动态路由（如 /:id）之前
 * - 否则 Express 会把 /stats 当作 :id 参数处理
 */

// 引入Express框架
const express = require('express');

// 创建路由器实例
const router = express.Router();

// 引入控制器
const categoryController = require('../controllers/category.controller');

// 引入认证中间件
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// ==================== 公开路由（无需认证） ====================

/**
 * 获取启用的版块列表
 * @route GET /api/categories/active
 * @description 供前端展示用，只返回启用的版块
 */
router.get('/active', categoryController.getActiveList);

// ==================== 需要认证的路由 ====================

/**
 * 获取版块列表（管理用）
 * @route GET /api/categories
 * @permission admin
 * @description 支持筛选和分页
 */
router.get('/',
  authMiddleware,
  adminMiddleware,
  categoryController.list
);

/**
 * 获取版块统计
 * @route GET /api/categories/stats
 * @permission admin
 * @description 必须放在 /:id 之前，否则会被当作 id 参数
 */
router.get('/stats',
  authMiddleware,
  adminMiddleware,
  categoryController.stats
);

/**
 * 获取版块详情
 * @route GET /api/categories/:id
 * @description 获取单个版块信息
 * @note 动态路由要放在静态路由之后
 */
router.get('/:id', categoryController.getById);

/**
 * 创建版块
 * @route POST /api/categories
 * @permission admin
 */
router.post('/',
  authMiddleware,
  adminMiddleware,
  categoryController.create
);

/**
 * 更新版块状态
 * @route PUT /api/categories/:id/status
 * @permission admin
 * @note 必须放在 /:id 之前
 */
router.put('/:id/status',
  authMiddleware,
  adminMiddleware,
  categoryController.updateStatus
);

/**
 * 更新版块
 * @route PUT /api/categories/:id
 * @permission admin
 */
router.put('/:id',
  authMiddleware,
  adminMiddleware,
  categoryController.update
);

/**
 * 删除版块
 * @route DELETE /api/categories/:id
 * @permission admin
 */
router.delete('/:id',
  authMiddleware,
  adminMiddleware,
  categoryController.remove
);

// 导出路由器
module.exports = router;
