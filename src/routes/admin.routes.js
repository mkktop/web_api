/**
 * @fileoverview 管理员路由
 * @description 定义管理员相关的API路由
 * 
 * 路由列表：
 * - GET    /api/admin/dashboard      - 获取统计面板
 * - GET    /api/admin/users          - 获取用户列表
 * - GET    /api/admin/users/:id      - 获取用户详情
 * - PUT    /api/admin/users/:id/status - 更新用户状态
 * - PUT    /api/admin/users/:id/role   - 更新用户角色
 * - GET    /api/admin/posts          - 获取所有帖子
 * - PUT    /api/admin/posts/:id/status - 更新帖子状态
 * - GET    /api/admin/comments       - 获取所有评论
 * - DELETE /api/admin/comments/:id   - 删除评论
 * 
 * 权限说明：
 * - 所有操作仅限管理员
 */

// 引入Express框架
const express = require('express');

// 创建路由器实例
const router = express.Router();

// 引入控制器
const adminController = require('../controllers/admin.controller');

// 引入认证中间件
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// ==================== 统计面板 ====================

/**
 * 获取系统统计数据
 * @route GET /api/admin/dashboard
 * @permission admin
 */
router.get('/dashboard', authMiddleware, adminMiddleware, adminController.getDashboard);

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 * @route GET /api/admin/users
 * @permission admin
 */
router.get('/users', authMiddleware, adminMiddleware, adminController.getUsers);

/**
 * 获取用户详情
 * @route GET /api/admin/users/:id
 * @permission admin
 */
router.get('/users/:id', authMiddleware, adminMiddleware, adminController.getUserById);

/**
 * 更新用户状态
 * @route PUT /api/admin/users/:id/status
 * @permission admin
 */
router.put('/users/:id/status', authMiddleware, adminMiddleware, adminController.updateUserStatus);

/**
 * 更新用户角色
 * @route PUT /api/admin/users/:id/role
 * @permission admin
 */
router.put('/users/:id/role', authMiddleware, adminMiddleware, adminController.updateUserRole);

// ==================== 帖子管理 ====================

/**
 * 获取所有帖子
 * @route GET /api/admin/posts
 * @permission admin
 */
router.get('/posts', authMiddleware, adminMiddleware, adminController.getPosts);

/**
 * 更新帖子状态
 * @route PUT /api/admin/posts/:id/status
 * @permission admin
 */
router.put('/posts/:id/status', authMiddleware, adminMiddleware, adminController.updatePostStatus);

// ==================== 评论管理 ====================

/**
 * 获取所有评论
 * @route GET /api/admin/comments
 * @permission admin
 */
router.get('/comments', authMiddleware, adminMiddleware, adminController.getComments);

/**
 * 删除评论
 * @route DELETE /api/admin/comments/:id
 * @permission admin
 */
router.delete('/comments/:id', authMiddleware, adminMiddleware, adminController.deleteComment);

// 导出路由器
module.exports = router;
