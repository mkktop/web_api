/**
 * @fileoverview 邀请码管理路由
 * @description 定义邀请码相关的API路由（RESTful风格）
 * 
 * 路由列表：
 * - POST   /api/invite-codes           - 创建邀请码（批量生成）
 * - GET    /api/invite-codes           - 查询邀请码列表
 * - GET    /api/invite-codes/stats     - 获取邀请码统计
 * - DELETE /api/invite-codes/:id       - 删除邀请码
 * - POST   /api/invite-codes/cleanup   - 清理过期邀请码
 * 
 * 权限说明：
 * - 所有接口仅限 admin 角色访问
 * - 需要携带有效的 JWT Token
 */

// 引入Express框架
const express = require('express');

// 创建路由器实例
const router = express.Router();

// 引入控制器
const inviteCodeController = require('../controllers/invite_code.controller');

// 引入认证中间件
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

/**
 * 所有邀请码路由都需要管理员权限
 * 使用中间件链：
 * 1. authMiddleware - 验证JWT Token，提取用户信息
 * 2. adminMiddleware - 验证用户是否为管理员
 */

// ==================== 路由定义 ====================

/**
 * 创建邀请码（批量生成）
 * @route POST /api/invite-codes
 * @permission admin
 * 
 * @description RESTful风格：POST 用于创建资源
 * 请求体参数：count（数量）、length（长度）
 */
router.post('/',
  authMiddleware,
  adminMiddleware,
  inviteCodeController.generate
);

/**
 * 查询邀请码列表
 * @route GET /api/invite-codes
 * @permission admin
 * 
 * @description RESTful风格：GET 用于获取资源列表
 * 查询参数：page、pageSize、code、used
 */
router.get('/',
  authMiddleware,
  adminMiddleware,
  inviteCodeController.list
);

/**
 * 获取邀请码统计信息
 * @route GET /api/invite-codes/stats
 * @permission admin
 * 
 * @description 特殊操作放在资源路径下
 */
router.get('/stats',
  authMiddleware,
  adminMiddleware,
  inviteCodeController.stats
);

/**
 * 清理过期邀请码
 * @route POST /api/invite-codes/cleanup
 * @permission admin
 * 
 * @description 清理是一种批量操作，使用 POST
 */
router.post('/cleanup',
  authMiddleware,
  adminMiddleware,
  inviteCodeController.cleanup
);

/**
 * 删除邀请码
 * @route DELETE /api/invite-codes/:id
 * @permission admin
 * 
 * @description RESTful风格：DELETE 用于删除资源
 */
router.delete('/:id',
  authMiddleware,
  adminMiddleware,
  inviteCodeController.remove
);

// 导出路由器
module.exports = router;
