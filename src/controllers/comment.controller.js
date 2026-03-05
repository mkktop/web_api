/**
 * @fileoverview 评论控制器
 * @description 处理评论的发布、查询、删除等操作
 * 
 * 控制器的职责：
 * 1. 接收请求参数
 * 2. 验证参数有效性
 * 3. 调用模型进行数据操作
 * 4. 返回统一格式的响应
 * 
 * 权限说明：
 * - 获取评论列表：公开
 * - 发表评论/回复：登录用户
 * - 删除评论：评论作者或管理员
 */

// 引入评论模型
const Comment = require('../models/comment.model');

// 引入帖子模型
const Post = require('../models/post.model');

// 引入响应工具函数
const response = require('../utils/response');

// 引入日志工具
const logger = require('../utils/logger');

// 引入 HTTP 状态码常量
const HttpStatus = require('../config/constants');

/**
 * 获取帖子的评论列表
 * @description 获取指定帖子的所有顶级评论
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.postId - 帖子ID
 * @param {Object} req.query - 查询参数
 * @param {Object} res - Express 响应对象
 */
const list = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    
    // 检查帖子是否存在
    const post = await Post.findById(postId);
    if (!post || post.status === 0) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    const result = await Comment.findByPostId(postId, {
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 50)
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取评论列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取评论的回复列表
 * @description 获取指定评论的所有回复
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.commentId - 评论ID
 * @param {Object} res - Express 响应对象
 */
const getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;
    
    // 检查评论是否存在
    const comment = await Comment.findById(commentId);
    if (!comment || comment.status === 0) {
      return response.error(res, '评论不存在', HttpStatus.NOT_FOUND);
    }
    
    const replies = await Comment.findReplies(commentId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    
    return response.success(res, replies, '获取成功');
    
  } catch (error) {
    logger.error('获取回复列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 发表评论
 * @description 用户发表评论或回复
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.postId - 帖子ID
 * @param {Object} req.body - 请求体
 * @param {string} req.body.content - 评论内容
 * @param {number} req.body.parent_id - 父评论ID（回复时使用）
 * @param {number} req.body.reply_to_user_id - 回复的用户ID
 * @param {Object} req.user - 当前登录用户
 * @param {Object} res - Express 响应对象
 */
const create = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parent_id, reply_to_user_id } = req.body;
    const userId = req.user.id;
    
    // ==================== 参数校验 ====================
    
    if (!content || content.trim() === '') {
      return response.error(res, '评论内容不能为空');
    }
    
    if (content.length > 1000) {
      return response.error(res, '评论内容不能超过1000个字符');
    }
    
    // ==================== 帖子校验 ====================
    
    const post = await Post.findById(postId);
    if (!post || post.status === 0) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    // ==================== 父评论校验（回复时） ====================
    
    if (parent_id) {
      const parentComment = await Comment.findById(parent_id);
      if (!parentComment || parentComment.status === 0) {
        return response.error(res, '回复的评论不存在');
      }
      
      // 确保父评论属于同一帖子
      if (parentComment.post_id !== parseInt(postId)) {
        return response.error(res, '评论不属于该帖子');
      }
    }
    
    // ==================== 创建评论 ====================
    
    const commentId = await Comment.create({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
      parent_id: parent_id || null,
      reply_to_user_id: reply_to_user_id || null
    });
    
    // 更新帖子评论数
    await Post.incrementComments(postId);
    
    logger.info(`用户发表评论: 帖子 ${postId}, 评论ID ${commentId}`);
    
    return response.success(res, { id: commentId }, '评论成功');
    
  } catch (error) {
    logger.error('发表评论失败:', error.message);
    return response.error(res, '评论失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 删除评论
 * @description 删除评论（软删除）
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 评论ID
 * @param {Object} res - Express 响应对象
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // 检查评论是否存在
    const comment = await Comment.findById(id);
    if (!comment) {
      return response.error(res, '评论不存在', HttpStatus.NOT_FOUND);
    }
    
    // 检查权限（只有作者或管理员可以删除）
    if (!isAdmin && comment.user_id !== userId) {
      return response.error(res, '无权删除此评论', HttpStatus.FORBIDDEN);
    }
    
    // 软删除
    await Comment.delete(id);
    
    // 更新帖子评论数
    await Post.decrementComments(comment.post_id);
    
    logger.info(`评论删除成功: ID ${id}`);
    
    return response.success(res, {}, '删除成功');
    
  } catch (error) {
    logger.error('删除评论失败:', error.message);
    return response.error(res, '删除失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取用户的评论列表
 * @description 获取当前用户发表的所有评论
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const getMyComments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await Comment.findByUserId(userId, {
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 50)
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取用户评论失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// 导出控制器函数
module.exports = {
  list,
  getReplies,
  create,
  remove,
  getMyComments
};
