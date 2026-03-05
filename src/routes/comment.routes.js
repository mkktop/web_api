/**
 * @fileoverview 评论路由
 * @description 定义评论相关的API路由（RESTful风格）
 * 
 * 路由列表：
 * - GET    /api/posts/:postId/comments           - 获取帖子的评论列表
 * - GET    /api/comments/:commentId/replies      - 获取评论的回复列表
 * - POST   /api/posts/:postId/comments           - 发表评论
 * - DELETE /api/comments/:id                     - 删除评论
 * - GET    /api/user/comments                    - 获取我的评论
 * 
 * 权限说明：
 * - 获取评论列表：公开
 * - 发表评论/回复：登录用户
 * - 删除评论：评论作者或管理员
 */

// 引入Express框架
const express = require('express');

// 创建路由器实例
const router = express.Router();

// 引入控制器
const commentController = require('../controllers/comment.controller');

// 引入认证中间件
const { authMiddleware } = require('../middlewares/auth');

// ==================== 公开路由（无需认证） ====================

/**
 * 获取帖子的评论列表
 * @route GET /api/posts/:postId/comments
 * @description 获取指定帖子的所有顶级评论
 */
router.get('/posts/:postId/comments', commentController.list);

/**
 * 获取评论的回复列表
 * @route GET /api/comments/:commentId/replies
 * @description 获取指定评论的所有回复
 */
router.get('/comments/:commentId/replies', commentController.getReplies);

// ==================== 需要登录的路由 ====================

/**
 * 发表评论
 * @route POST /api/posts/:postId/comments
 * @permission user
 */
router.post('/posts/:postId/comments', authMiddleware, commentController.create);

/**
 * 删除评论
 * @route DELETE /api/comments/:id
 * @permission 作者或管理员
 */
router.delete('/comments/:id', authMiddleware, commentController.remove);

/**
 * 获取我的评论
 * @route GET /api/user/comments
 * @permission user
 */
router.get('/user/comments', authMiddleware, commentController.getMyComments);

// 导出路由器
module.exports = router;
