/**
 * @fileoverview 帖子路由
 * @description 定义帖子相关的API路由（RESTful风格）
 * 
 * 路由列表：
 * - GET    /api/posts              - 获取帖子列表
 * - GET    /api/posts/stats        - 获取帖子统计
 * - GET    /api/posts/my           - 获取我的帖子
 * - GET    /api/posts/:id          - 获取帖子详情
 * - POST   /api/posts              - 发布帖子
 * - PUT    /api/posts/:id          - 更新帖子
 * - DELETE /api/posts/:id          - 删除帖子
 * - PUT    /api/posts/:id/pin      - 置顶/取消置顶（管理员）
 * - PUT    /api/posts/:id/highlight - 加精/取消加精（管理员）
 * 
 * 权限说明：
 * - 获取列表/详情：所有用户
 * - 发布帖子：登录用户
 * - 编辑/删除：帖子作者或管理员
 * - 置顶/加精：仅管理员
 * 
 * 注意：路由顺序很重要！
 * - 静态路由（如 /stats, /my）必须放在动态路由（如 /:id）之前
 */

// 引入Express框架
const express = require('express');

// 创建路由器实例
const router = express.Router();

// 引入控制器
const postController = require('../controllers/post.controller');

// 引入认证中间件
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// ==================== 公开路由（无需认证） ====================

/**
 * 获取帖子列表
 * @route GET /api/posts
 * @description 支持筛选和分页
 */
router.get('/', postController.list);

/**
 * 获取帖子统计
 * @route GET /api/posts/stats
 * @description 必须放在 /:id 之前
 */
router.get('/stats', postController.stats);

// ==================== 需要登录的路由 ====================

/**
 * 获取我的帖子
 * @route GET /api/posts/my
 * @permission user
 * @description 必须放在 /:id 之前
 */
router.get('/my', authMiddleware, postController.getMyPosts);

/**
 * 获取帖子详情
 * @route GET /api/posts/:id
 * @description 动态路由要放在静态路由之后
 */
router.get('/:id', postController.getById);

/**
 * 发布帖子
 * @route POST /api/posts
 * @permission user
 */
router.post('/', authMiddleware, postController.create);

/**
 * 更新帖子
 * @route PUT /api/posts/:id
 * @permission 作者或管理员
 */
router.put('/:id', authMiddleware, postController.update);

/**
 * 删除帖子
 * @route DELETE /api/posts/:id
 * @permission 作者或管理员
 */
router.delete('/:id', authMiddleware, postController.remove);

// ==================== 管理员路由 ====================

/**
 * 置顶/取消置顶帖子
 * @route PUT /api/posts/:id/pin
 * @permission admin
 */
router.put('/:id/pin', authMiddleware, adminMiddleware, postController.setPinned);

/**
 * 加精/取消加精帖子
 * @route PUT /api/posts/:id/highlight
 * @permission admin
 */
router.put('/:id/highlight', authMiddleware, adminMiddleware, postController.setHighlighted);

// 导出路由器
module.exports = router;
