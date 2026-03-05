/**
 * @fileoverview 点赞收藏控制器
 * @description 处理帖子点赞和收藏的操作
 * 
 * 控制器的职责：
 * 1. 接收请求参数
 * 2. 验证参数有效性
 * 3. 调用模型进行数据操作
 * 4. 返回统一格式的响应
 * 
 * 权限说明：
 * - 所有操作需要登录
 */

// 引入点赞收藏模型
const PostInteraction = require('../models/post_interaction.model');

// 引入帖子模型
const Post = require('../models/post.model');

// 引入响应工具函数
const response = require('../utils/response');

// 引入日志工具
const logger = require('../utils/logger');

// 引入 HTTP 状态码常量
const HttpStatus = require('../config/constants');

// ==================== 点赞相关控制器 ====================

/**
 * 点赞帖子
 * @description 用户点赞帖子
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 帖子ID
 * @param {Object} req.user - 当前登录用户
 * @param {Object} res - Express 响应对象
 */
const likePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;
    
    // 检查帖子是否存在
    const post = await Post.findById(postId);
    if (!post || post.status === 0) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    // 检查是否已点赞
    const hasLiked = await PostInteraction.hasLiked(postId, userId);
    if (hasLiked) {
      return response.error(res, '已点赞过该帖子');
    }
    
    // 点赞
    const likeId = await PostInteraction.addLike(postId, userId);
    
    // 更新帖子点赞数
    await Post.incrementLikes(postId);
    
    logger.info(`用户点赞帖子: 帖子 ${postId}, 用户 ${userId}`);
    
    return response.success(res, { id: likeId }, '点赞成功');
    
  } catch (error) {
    logger.error('点赞失败:', error.message);
    return response.error(res, '点赞失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 取消点赞
 * @description 用户取消点赞
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 帖子ID
 * @param {Object} req.user - 当前登录用户
 * @param {Object} res - Express 响应对象
 */
const unlikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;
    
    // 检查是否已点赞
    const hasLiked = await PostInteraction.hasLiked(postId, userId);
    if (!hasLiked) {
      return response.error(res, '未点赞过该帖子');
    }
    
    // 取消点赞
    await PostInteraction.removeLike(postId, userId);
    
    // 更新帖子点赞数
    await Post.decrementLikes(postId);
    
    logger.info(`用户取消点赞: 帖子 ${postId}, 用户 ${userId}`);
    
    return response.success(res, {}, '取消点赞成功');
    
  } catch (error) {
    logger.error('取消点赞失败:', error.message);
    return response.error(res, '取消点赞失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取用户点赞的帖子列表
 * @description 获取当前用户点赞的所有帖子
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const getMyLikes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await PostInteraction.getUserLikes(userId, {
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 50)
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取点赞列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// ==================== 收藏相关控制器 ====================

/**
 * 收藏帖子
 * @description 用户收藏帖子
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 帖子ID
 * @param {Object} req.user - 当前登录用户
 * @param {Object} res - Express 响应对象
 */
const favoritePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;
    
    // 检查帖子是否存在
    const post = await Post.findById(postId);
    if (!post || post.status === 0) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    // 检查是否已收藏
    const hasFavorited = await PostInteraction.hasFavorited(postId, userId);
    if (hasFavorited) {
      return response.error(res, '已收藏过该帖子');
    }
    
    // 收藏
    const favoriteId = await PostInteraction.addFavorite(postId, userId);
    
    logger.info(`用户收藏帖子: 帖子 ${postId}, 用户 ${userId}`);
    
    return response.success(res, { id: favoriteId }, '收藏成功');
    
  } catch (error) {
    logger.error('收藏失败:', error.message);
    return response.error(res, '收藏失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 取消收藏
 * @description 用户取消收藏
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 帖子ID
 * @param {Object} req.user - 当前登录用户
 * @param {Object} res - Express 响应对象
 */
const unfavoritePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;
    
    // 检查是否已收藏
    const hasFavorited = await PostInteraction.hasFavorited(postId, userId);
    if (!hasFavorited) {
      return response.error(res, '未收藏过该帖子');
    }
    
    // 取消收藏
    await PostInteraction.removeFavorite(postId, userId);
    
    logger.info(`用户取消收藏: 帖子 ${postId}, 用户 ${userId}`);
    
    return response.success(res, {}, '取消收藏成功');
    
  } catch (error) {
    logger.error('取消收藏失败:', error.message);
    return response.error(res, '取消收藏失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取用户收藏的帖子列表
 * @description 获取当前用户收藏的所有帖子
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await PostInteraction.getUserFavorites(userId, {
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 50)
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取收藏列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 检查帖子点赞收藏状态
 * @description 检查当前用户对指定帖子的点赞和收藏状态
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const checkStatus = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;
    
    const hasLiked = await PostInteraction.hasLiked(postId, userId);
    const hasFavorited = await PostInteraction.hasFavorited(postId, userId);
    
    return response.success(res, {
      liked: hasLiked,
      favorited: hasFavorited
    }, '获取成功');
    
  } catch (error) {
    logger.error('获取状态失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// 导出控制器函数
module.exports = {
  likePost,
  unlikePost,
  getMyLikes,
  favoritePost,
  unfavoritePost,
  getMyFavorites,
  checkStatus
};
