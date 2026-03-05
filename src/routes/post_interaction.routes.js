/**
 * @fileoverview 点赞收藏路由
 * @description 定义帖子点赞和收藏相关的API路由（RESTful风格）
 * 
 * 路由列表：
 * - POST   /api/posts/:id/like      - 点赞帖子
 * - DELETE /api/posts/:id/like      - 取消点赞
 * - POST   /api/posts/:id/favorite  - 收藏帖子
 * - DELETE /api/posts/:id/favorite  - 取消收藏
 * - GET    /api/posts/:id/status    - 获取点赞收藏状态
 * - GET    /api/user/likes          - 获取我点赞的帖子
 * - GET    /api/user/favorites      - 获取我收藏的帖子
 * 
 * 权限说明：
 * - 所有操作需要登录
 */

// 引入Express框架
const express = require('express');

// 创建路由器实例
const router = express.Router();

// 引入控制器
const interactionController = require('../controllers/post_interaction.controller');

// 引入认证中间件
const { authMiddleware } = require('../middlewares/auth');

// ==================== 帖子互动路由 ====================

/**
 * 点赞帖子
 * @route POST /api/posts/:id/like
 * @permission user
 */
router.post('/posts/:id/like', authMiddleware, interactionController.likePost);

/**
 * 取消点赞
 * @route DELETE /api/posts/:id/like
 * @permission user
 */
router.delete('/posts/:id/like', authMiddleware, interactionController.unlikePost);

/**
 * 收藏帖子
 * @route POST /api/posts/:id/favorite
 * @permission user
 */
router.post('/posts/:id/favorite', authMiddleware, interactionController.favoritePost);

/**
 * 取消收藏
 * @route DELETE /api/posts/:id/favorite
 * @permission user
 */
router.delete('/posts/:id/favorite', authMiddleware, interactionController.unfavoritePost);

/**
 * 获取帖子点赞收藏状态
 * @route GET /api/posts/:id/status
 * @permission user
 */
router.get('/posts/:id/status', authMiddleware, interactionController.checkStatus);

// ==================== 用户互动记录路由 ====================

/**
 * 获取我点赞的帖子
 * @route GET /api/user/likes
 * @permission user
 */
router.get('/user/likes', authMiddleware, interactionController.getMyLikes);

/**
 * 获取我收藏的帖子
 * @route GET /api/user/favorites
 * @permission user
 */
router.get('/user/favorites', authMiddleware, interactionController.getMyFavorites);

// 导出路由器
module.exports = router;
