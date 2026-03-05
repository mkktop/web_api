/**
 * @fileoverview 管理员控制器
 * @description 处理管理员相关的操作，包括用户管理、帖子审核、评论管理、统计面板
 * 
 * 控制器的职责：
 * 1. 接收请求参数
 * 2. 验证参数有效性
 * 3. 调用模型进行数据操作
 * 4. 返回统一格式的响应
 * 
 * 权限说明：
 * - 所有操作仅限管理员
 * - ID为1的管理员是超级管理员，拥有最高权限
 * - 只有超级管理员可以任命/撤销管理员
 */

// 引入模型
const User = require('../models/user.model');
const UserProfile = require('../models/user_profile.model');
const UserAuth = require('../models/user_auth.model');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const Category = require('../models/category.model');
const InviteCode = require('../models/invite_code.model');
const PostInteraction = require('../models/post_interaction.model');

// 引入响应工具函数
const response = require('../utils/response');

// 引入日志工具
const logger = require('../utils/logger');

// 引入 HTTP 状态码常量
const HttpStatus = require('../config/constants');

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 * @description 管理员查询用户列表，支持筛选和分页
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, role, status, keyword } = req.query;
    
    const result = await User.findAll({
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 100),
      role,
      status,
      keyword
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取用户列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取用户详情
 * @description 管理员获取用户详细信息
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return response.error(res, '用户不存在', HttpStatus.NOT_FOUND);
    }
    
    const profile = await UserProfile.findByUserId(id);
    const auth = await UserAuth.findByUserId(id);
    
    const commentCount = await Comment.countByUserId(id);
    const postCount = await Post.count({ user_id: id, status: 1 });
    
    return response.success(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        create_time: user.create_time,
        update_time: user.update_time
      },
      profile,
      auth,
      stats: {
        post_count: postCount,
        comment_count: commentCount
      }
    }, '获取成功');
    
  } catch (error) {
    logger.error('获取用户详情失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 更新用户状态
 * @description 管理员启用/禁用用户
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const operatorId = req.user.id;
    
    if (status === undefined || ![0, 1].includes(parseInt(status))) {
      return response.error(res, '状态值无效');
    }
    
    const user = await User.findById(id);
    if (!user) {
      return response.error(res, '用户不存在', HttpStatus.NOT_FOUND);
    }
    
    // ID为1的是超级管理员，不能被操作
    if (parseInt(id) === 1) {
      return response.error(res, '超级管理员不能被操作');
    }
    
    // 不能操作其他管理员（除非自己是超级管理员）
    if (user.role === 'admin' && operatorId !== 1) {
      return response.error(res, '没有权限操作管理员账号');
    }
    
    await User.updateStatus(id, parseInt(status));
    
    logger.info(`管理员更新用户状态: 用户ID ${id}, 状态 ${status}`);
    
    return response.success(res, {}, status === 1 ? '已启用' : '已禁用');
    
  } catch (error) {
    logger.error('更新用户状态失败:', error.message);
    return response.error(res, '操作失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 更新用户角色
 * @description 管理员设置用户角色（仅超级管理员可任命管理员）
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const operatorId = req.user.id;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return response.error(res, '角色值无效');
    }
    
    // ID为1的是超级管理员，不能被操作
    if (parseInt(id) === 1) {
      return response.error(res, '超级管理员不能被操作');
    }
    
    const user = await User.findById(id);
    if (!user) {
      return response.error(res, '用户不存在', HttpStatus.NOT_FOUND);
    }
    
    // 只有超级管理员可以任命/撤销管理员
    if (operatorId !== 1) {
      return response.error(res, '只有超级管理员可以设置管理员角色');
    }
    
    const oldRole = user.role;
    
    await User.updateRole(id, role);
    
    // 晋升管理员时奖励10000积分
    if (oldRole !== 'admin' && role === 'admin') {
      await UserAuth.addPoints(id, 10000);
      logger.info(`超级管理员晋升用户为管理员: 用户ID ${id}, 奖励10000积分`);
    } else {
      logger.info(`超级管理员更新用户角色: 用户ID ${id}, 角色 ${role}`);
    }
    
    return response.success(res, { 
      role,
      points_bonus: (oldRole !== 'admin' && role === 'admin') ? 10000 : 0
    }, '角色更新成功');
    
  } catch (error) {
    logger.error('更新用户角色失败:', error.message);
    return response.error(res, '操作失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// ==================== 帖子管理 ====================

/**
 * 获取所有帖子（管理员）
 * @description 管理员查询所有帖子，包括已删除的
 */
const getPosts = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, category_id, user_id, status, keyword } = req.query;
    
    const result = await Post.findAll({
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 100),
      category_id,
      user_id,
      status: status !== undefined ? status : undefined,
      keyword
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取帖子列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 更新帖子状态
 * @description 管理员审核帖子
 */
const updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (status === undefined || ![0, 1, 2].includes(parseInt(status))) {
      return response.error(res, '状态值无效');
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    await Post.update(id, { status: parseInt(status) });
    
    const statusText = status === 0 ? '已删除' : status === 1 ? '已通过' : '审核中';
    logger.info(`管理员更新帖子状态: 帖子ID ${id}, 状态 ${statusText}`);
    
    return response.success(res, {}, statusText);
    
  } catch (error) {
    logger.error('更新帖子状态失败:', error.message);
    return response.error(res, '操作失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// ==================== 评论管理 ====================

/**
 * 获取所有评论（管理员）
 * @description 管理员查询所有评论
 */
const getComments = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, post_id, user_id, status } = req.query;
    
    const result = await Comment.findAll({
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 100),
      post_id,
      user_id,
      status: status !== undefined ? status : undefined
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取评论列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 删除评论（管理员）
 * @description 管理员删除评论
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await Comment.findById(id);
    if (!comment) {
      return response.error(res, '评论不存在', HttpStatus.NOT_FOUND);
    }
    
    await Comment.delete(id);
    await Post.decrementComments(comment.post_id);
    
    logger.info(`管理员删除评论: 评论ID ${id}`);
    
    return response.success(res, {}, '删除成功');
    
  } catch (error) {
    logger.error('删除评论失败:', error.message);
    return response.error(res, '删除失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// ==================== 统计面板 ====================

/**
 * 获取系统统计数据
 * @description 获取系统整体统计数据
 */
const getDashboard = async (req, res) => {
  try {
    const userStats = await User.getStats();
    const postStats = await Post.count();
    const categoryStats = await Category.count();
    const inviteCodeStats = await InviteCode.count();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newUsersToday = await User.countByDate(today);
    const newPostsToday = await Post.countByDate(today);
    const newCommentsToday = await Comment.countByDate(today);
    
    const hotPosts = await Post.findAll({
      pageSize: 5,
      orderBy: 'popular',
      status: 1
    });
    
    return response.success(res, {
      overview: {
        total_users: userStats.total,
        total_posts: postStats.total,
        total_comments: await Comment.countAll(),
        total_categories: categoryStats.total
      },
      today: {
        new_users: newUsersToday,
        new_posts: newPostsToday,
        new_comments: newCommentsToday
      },
      users: {
        total: userStats.total,
        active: userStats.active,
        disabled: userStats.disabled,
        admins: userStats.admins
      },
      posts: {
        total: postStats.total,
        normal: postStats.normal,
        deleted: postStats.deleted,
        pending: postStats.pending
      },
      invite_codes: {
        total: inviteCodeStats.total,
        used: inviteCodeStats.used,
        unused: inviteCodeStats.unused
      },
      hot_posts: hotPosts.list
    }, '获取成功');
    
  } catch (error) {
    logger.error('获取统计数据失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// 导出控制器函数
module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getPosts,
  updatePostStatus,
  getComments,
  deleteComment,
  getDashboard
};
