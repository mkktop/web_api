/**
 * @fileoverview 帖子资源路由
 * @description 定义资源下载和积分兑换相关的API路由
 * 
 * 路由列表：
 * - POST   /api/posts/:postId/resource        - 设置资源
 * - GET    /api/posts/:postId/resource        - 获取资源信息
 * - POST   /api/posts/:postId/resource/purchase - 兑换资源
 * - DELETE /api/posts/:postId/resource        - 删除资源
 * - GET    /api/posts/:postId/resource/stats  - 获取资源统计
 * - GET    /api/user/purchases                - 获取我的兑换记录
 * - GET    /api/user/earnings                 - 获取我的资源收益
 */

const express = require('express');
const router = express.Router();

const resourceController = require('../controllers/post_resource.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

/**
 * 设置资源
 * @route POST /api/posts/:postId/resource
 * @permission 作者或管理员
 */
router.post('/posts/:postId/resource', authMiddleware, resourceController.setResource);

/**
 * 获取资源信息
 * @route GET /api/posts/:postId/resource
 * @permission 公开（已兑换或作者可见下载链接）
 */
router.get('/posts/:postId/resource', authMiddleware, resourceController.getResource);

/**
 * 兑换资源
 * @route POST /api/posts/:postId/resource/purchase
 * @permission 登录用户
 */
router.post('/posts/:postId/resource/purchase', authMiddleware, resourceController.purchaseResource);

/**
 * 删除资源
 * @route DELETE /api/posts/:postId/resource
 * @permission 作者或管理员
 */
router.delete('/posts/:postId/resource', authMiddleware, resourceController.deleteResource);

/**
 * 获取资源统计
 * @route GET /api/posts/:postId/resource/stats
 * @permission 公开
 */
router.get('/posts/:postId/resource/stats', resourceController.getStats);

/**
 * 获取我的兑换记录
 * @route GET /api/user/purchases
 * @permission 登录用户
 */
router.get('/user/purchases', authMiddleware, resourceController.getMyPurchases);

/**
 * 获取我的资源收益
 * @route GET /api/user/earnings
 * @permission 登录用户
 */
router.get('/user/earnings', authMiddleware, resourceController.getMyEarnings);

module.exports = router;
