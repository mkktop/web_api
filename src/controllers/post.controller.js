/**
 * @fileoverview 帖子控制器
 * @description 处理帖子的发布、查询、更新、删除等操作
 * 
 * 控制器的职责：
 * 1. 接收请求参数
 * 2. 验证参数有效性
 * 3. 调用模型进行数据操作
 * 4. 返回统一格式的响应
 * 
 * 权限说明：
 * - 获取帖子列表/详情：所有用户
 * - 发布帖子：登录用户
 * - 编辑/删除帖子：帖子作者或管理员
 * - 置顶/加精：仅管理员
 */

// 引入帖子模型
const Post = require('../models/post.model');

// 引入版块模型
const Category = require('../models/category.model');

// 引入用户模型
const User = require('../models/user.model');

// 引入评论模型
const Comment = require('../models/comment.model');

// 引入AI服务
const AIService = require('../services/ai.service');

// 引入响应工具函数
const response = require('../utils/response');

// 引入日志工具
const logger = require('../utils/logger');

// 引入 HTTP 状态码常量
const HttpStatus = require('../config/constants');

/**
 * 获取帖子列表
 * @description 获取帖子列表，支持筛选和分页
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {number} req.query.page - 页码
 * @param {number} req.query.pageSize - 每页数量
 * @param {number} req.query.category_id - 按版块筛选
 * @param {string} req.query.keyword - 按标题搜索
 * @param {string} req.query.orderBy - 排序方式
 * @param {Object} res - Express 响应对象
 */
const list = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category_id, 
      keyword, 
      orderBy = 'latest' 
    } = req.query;
    
    const result = await Post.findAll({
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 50),
      category_id,
      keyword,
      orderBy,
      status: 1  // 只显示正常状态的帖子
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取帖子列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取帖子详情
 * @description 根据ID获取帖子详细信息，并增加浏览量
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 帖子ID
 * @param {Object} res - Express 响应对象
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id);
    
    if (!post) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    // 检查帖子状态
    if (post.status === 0) {
      return response.error(res, '帖子已被删除', HttpStatus.NOT_FOUND);
    }
    
    // 增加浏览量
    await Post.incrementViews(id);
    post.views += 1;
    
    return response.success(res, post, '获取成功');
    
  } catch (error) {
    logger.error('获取帖子详情失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 发布帖子
 * @description 用户发布新帖子
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.title - 帖子标题
 * @param {string} req.body.content - 帖子内容
 * @param {number} req.body.category_id - 版块ID
 * @param {Object} req.user - 当前登录用户
 * @param {Object} res - Express 响应对象
 */
const create = async (req, res) => {
  try {
    const { title, content, category_id } = req.body;
    const userId = req.user.id;
    
    // ==================== 参数校验 ====================
    
    if (!title || title.trim() === '') {
      return response.error(res, '帖子标题不能为空');
    }
    
    if (title.length > 100) {
      return response.error(res, '帖子标题不能超过100个字符');
    }
    
    if (!content || content.trim() === '') {
      return response.error(res, '帖子内容不能为空');
    }
    
    if (!category_id) {
      return response.error(res, '请选择版块');
    }
    
    // ==================== 版块校验 ====================
    
    const category = await Category.findById(category_id);
    if (!category) {
      return response.error(res, '版块不存在');
    }
    
    if (category.status !== 1) {
      return response.error(res, '该版块已禁用');
    }
    
    // ==================== 创建帖子 ====================
    
    const postId = await Post.create({
      title: title.trim(),
      content: content.trim(),
      user_id: userId,
      category_id
    });
    
    logger.info(`用户发布帖子: ${title} (ID: ${postId}, 作者: ${userId})`);
    
    // ==================== 触发AI自动评论 ====================
    setImmediate(async () => {
      try {
        logger.info('开始AI自动评论流程...');
        const botUserId = AIService.getBotUserId();
        logger.info(`机器人ID: ${botUserId}, 发帖者ID: ${userId}`);
        
        if (userId === botUserId) {
          logger.info('机器人发帖，跳过AI评论');
          return;
        }
        
        const author = await User.findById(userId);
        const authorName = author ? (author.nickname || author.username) : '用户';
        logger.info(`发帖者: ${authorName}`);
        
        logger.info('调用AI生成评论...');
        const aiComment = await AIService.generatePostComment(title, content, authorName);
        logger.info(`AI返回评论: ${aiComment ? '有内容' : '无内容'}`);
        
        if (aiComment) {
          logger.info('创建评论...');
          await Comment.create({
            post_id: postId,
            user_id: botUserId,
            content: aiComment
          });
          
          logger.info('更新评论数...');
          await Post.incrementComments(postId);
          logger.info(`AI自动评论成功: 帖子ID ${postId}`);
        } else {
          logger.info('AI未生成评论');
        }
      } catch (error) {
        logger.error('AI自动评论失败:', error.message);
        logger.error('错误堆栈:', error.stack);
      }
    });
    
    return response.success(res, { id: postId }, '发布成功');
    
  } catch (error) {
    logger.error('发布帖子失败:', error.message);
    return response.error(res, '发布失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 更新帖子
 * @description 用户编辑自己的帖子
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 帖子ID
 * @param {Object} req.body - 请求体
 * @param {Object} res - Express 响应对象
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category_id } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // ==================== 参数校验 ====================
    
    if (title !== undefined) {
      if (!title || title.trim() === '') {
        return response.error(res, '帖子标题不能为空');
      }
      if (title.length > 100) {
        return response.error(res, '帖子标题不能超过100个字符');
      }
    }
    
    if (content !== undefined && content.trim() === '') {
      return response.error(res, '帖子内容不能为空');
    }
    
    // ==================== 帖子校验 ====================
    
    const post = await Post.findById(id);
    if (!post) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    // 检查权限（只有作者或管理员可以编辑）
    if (!isAdmin && post.user_id !== userId) {
      return response.error(res, '无权编辑此帖子', HttpStatus.FORBIDDEN);
    }
    
    // 检查版块
    if (category_id) {
      const category = await Category.findById(category_id);
      if (!category || category.status !== 1) {
        return response.error(res, '版块不存在或已禁用');
      }
    }
    
    // ==================== 更新帖子 ====================
    
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (category_id !== undefined) updateData.category_id = category_id;
    
    await Post.update(id, updateData);
    
    logger.info(`帖子更新成功: ID ${id}`);
    
    return response.success(res, {}, '更新成功');
    
  } catch (error) {
    logger.error('更新帖子失败:', error.message);
    return response.error(res, '更新失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 删除帖子
 * @description 删除帖子（软删除）
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 帖子ID
 * @param {Object} res - Express 响应对象
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // 检查帖子是否存在
    const post = await Post.findById(id);
    if (!post) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    // 检查权限（只有作者或管理员可以删除）
    if (!isAdmin && post.user_id !== userId) {
      return response.error(res, '无权删除此帖子', HttpStatus.FORBIDDEN);
    }
    
    // 软删除
    await Post.delete(id);
    
    logger.info(`帖子删除成功: ID ${id}`);
    
    return response.success(res, {}, '删除成功');
    
  } catch (error) {
    logger.error('删除帖子失败:', error.message);
    return response.error(res, '删除失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 置顶/取消置顶帖子
 * @description 管理员操作
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 帖子ID
 * @param {Object} req.body - 请求体
 * @param {number} req.body.is_pinned - 是否置顶
 * @param {Object} res - Express 响应对象
 */
const setPinned = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_pinned } = req.body;
    
    // 参数校验
    if (is_pinned === undefined || ![0, 1].includes(parseInt(is_pinned))) {
      return response.error(res, '参数无效');
    }
    
    // 检查帖子是否存在
    const post = await Post.findById(id);
    if (!post) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    // 更新置顶状态
    await Post.setPinned(id, parseInt(is_pinned));
    
    logger.info(`帖子${is_pinned ? '置顶' : '取消置顶'}: ID ${id}`);
    
    return response.success(res, {}, is_pinned ? '已置顶' : '已取消置顶');
    
  } catch (error) {
    logger.error('设置帖子置顶失败:', error.message);
    return response.error(res, '操作失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 加精/取消加精帖子
 * @description 管理员操作
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 帖子ID
 * @param {Object} req.body - 请求体
 * @param {number} req.body.is_highlighted - 是否加精
 * @param {Object} res - Express 响应对象
 */
const setHighlighted = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_highlighted } = req.body;
    
    // 参数校验
    if (is_highlighted === undefined || ![0, 1].includes(parseInt(is_highlighted))) {
      return response.error(res, '参数无效');
    }
    
    // 检查帖子是否存在
    const post = await Post.findById(id);
    if (!post) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    // 更新加精状态
    await Post.setHighlighted(id, parseInt(is_highlighted));
    
    logger.info(`帖子${is_highlighted ? '加精' : '取消加精'}: ID ${id}`);
    
    return response.success(res, {}, is_highlighted ? '已加精' : '已取消加精');
    
  } catch (error) {
    logger.error('设置帖子加精失败:', error.message);
    return response.error(res, '操作失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取帖子统计
 * @description 获取帖子统计数据
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const stats = async (req, res) => {
  try {
    const result = await Post.count();
    return response.success(res, result, '获取成功');
  } catch (error) {
    logger.error('获取帖子统计失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 按版块获取帖子列表
 * @description 获取指定版块的帖子列表
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.categoryId - 版块ID
 * @param {Object} req.query - 查询参数
 * @param {number} req.query.page - 页码
 * @param {number} req.query.pageSize - 每页数量
 * @param {Object} res - Express 响应对象
 */
const getByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await Post.findAll({
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 50),
      category_id: categoryId,
      status: 1
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('按版块获取帖子失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取用户的帖子列表
 * @description 获取当前用户发布的帖子
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await Post.findAll({
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 50),
      user_id: userId,
      orderBy: 'latest'
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取用户帖子失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 管理员获取帖子列表
 * @description 管理员查询帖子列表，支持按状态筛选
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const adminList = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category_id, 
      keyword, 
      status,
      orderBy = 'latest' 
    } = req.query;
    
    const result = await Post.findAll({
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 100),
      category_id,
      keyword,
      orderBy,
      status  // 管理员可以查看所有状态的帖子
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('管理员获取帖子列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// 导出控制器函数
module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  setPinned,
  setHighlighted,
  stats,
  getByCategory,
  getMyPosts,
  adminList
};
