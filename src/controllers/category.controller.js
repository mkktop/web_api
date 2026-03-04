/**
 * @fileoverview 版块分类控制器
 * @description 处理版块分类的管理操作
 * 
 * 控制器的职责：
 * 1. 接收请求参数
 * 2. 验证参数有效性
 * 3. 调用模型进行数据操作
 * 4. 返回统一格式的响应
 * 
 * 权限说明：
 * - 获取版块列表：所有用户
 * - 创建/编辑/删除版块：仅管理员
 */

// 引入版块分类模型
const Category = require('../models/category.model');

// 引入响应工具函数
const response = require('../utils/response');

// 引入日志工具
const logger = require('../utils/logger');

// 引入 HTTP 状态码常量
const HttpStatus = require('../config/constants');

/**
 * 获取启用的版块列表
 * @description 获取所有启用的版块，供前端展示用
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * 
 * @example
 * // GET /api/categories/active
 * 
 * // 成功响应：
 * {
 *   "success": true,
 *   "message": "获取成功",
 *   "data": [
 *     { "id": 1, "name": "技术交流", "description": "...", "icon": "..." },
 *     { "id": 2, "name": "闲聊灌水", "description": "...", "icon": "..." }
 *   ]
 * }
 */
const getActiveList = async (req, res) => {
  try {
    const list = await Category.findActive();
    return response.success(res, list, '获取成功');
  } catch (error) {
    logger.error('获取版块列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取版块列表（管理用）
 * @description 管理员查询版块列表，支持筛选和分页
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {number} req.query.page - 页码
 * @param {number} req.query.pageSize - 每页数量
 * @param {number} req.query.status - 按状态筛选
 * @param {string} req.query.keyword - 按名称模糊搜索
 * @param {Object} res - Express 响应对象
 */
const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;
    
    const result = await Category.findAll({
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 100),
      status,
      keyword
    });
    
    return response.success(res, result, '获取成功');
  } catch (error) {
    logger.error('获取版块列表失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取版块详情
 * @description 根据ID获取版块详细信息
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 版块ID
 * @param {Object} res - Express 响应对象
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      return response.error(res, '版块不存在', HttpStatus.NOT_FOUND);
    }
    
    return response.success(res, category, '获取成功');
  } catch (error) {
    logger.error('获取版块详情失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 创建版块
 * @description 管理员创建新版块
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.name - 版块名称
 * @param {string} req.body.description - 版块描述
 * @param {string} req.body.icon - 版块图标
 * @param {number} req.body.sort_order - 排序
 * @param {Object} res - Express 响应对象
 */
const create = async (req, res) => {
  try {
    const { name, description, icon, sort_order } = req.body;
    
    // ==================== 参数校验 ====================
    
    if (!name || name.trim() === '') {
      return response.error(res, '版块名称不能为空');
    }
    
    if (name.length > 50) {
      return response.error(res, '版块名称不能超过50个字符');
    }
    
    // ==================== 唯一性校验 ====================
    
    const exists = await Category.existsByName(name.trim());
    if (exists) {
      return response.error(res, '版块名称已存在');
    }
    
    // ==================== 创建版块 ====================
    
    const id = await Category.create({
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon?.trim() || null,
      sort_order: sort_order || 0
    });
    
    logger.info(`创建版块成功: ${name} (ID: ${id})`);
    
    return response.success(res, { id }, '创建成功');
    
  } catch (error) {
    logger.error('创建版块失败:', error.message);
    return response.error(res, '创建失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 更新版块
 * @description 管理员更新版块信息
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 版块ID
 * @param {Object} req.body - 请求体
 * @param {Object} res - Express 响应对象
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, sort_order, status } = req.body;
    
    // ==================== 参数校验 ====================
    
    // 检查版块是否存在
    const category = await Category.findById(id);
    if (!category) {
      return response.error(res, '版块不存在', HttpStatus.NOT_FOUND);
    }
    
    // 校验名称
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return response.error(res, '版块名称不能为空');
      }
      if (name.length > 50) {
        return response.error(res, '版块名称不能超过50个字符');
      }
      
      // 检查名称是否重复
      const exists = await Category.existsByName(name.trim(), id);
      if (exists) {
        return response.error(res, '版块名称已存在');
      }
    }
    
    // ==================== 更新版块 ====================
    
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon !== undefined) updateData.icon = icon?.trim() || null;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (status !== undefined) updateData.status = status;
    
    await Category.update(id, updateData);
    
    logger.info(`更新版块成功: ID ${id}`);
    
    return response.success(res, {}, '更新成功');
    
  } catch (error) {
    logger.error('更新版块失败:', error.message);
    return response.error(res, '更新失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 更新版块状态
 * @description 管理员启用/禁用版块
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 版块ID
 * @param {Object} req.body - 请求体
 * @param {number} req.body.status - 状态（1启用/0禁用）
 * @param {Object} res - Express 响应对象
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 参数校验
    if (status === undefined || ![0, 1].includes(parseInt(status))) {
      return response.error(res, '状态值无效');
    }
    
    // 检查版块是否存在
    const category = await Category.findById(id);
    if (!category) {
      return response.error(res, '版块不存在', HttpStatus.NOT_FOUND);
    }
    
    // 更新状态
    await Category.updateStatus(id, parseInt(status));
    
    logger.info(`更新版块状态: ID ${id}, 状态 ${status}`);
    
    return response.success(res, {}, status === 1 ? '已启用' : '已禁用');
    
  } catch (error) {
    logger.error('更新版块状态失败:', error.message);
    return response.error(res, '操作失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 删除版块
 * @description 管理员删除版块
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 版块ID
 * @param {Object} res - Express 响应对象
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查版块是否存在
    const category = await Category.findById(id);
    if (!category) {
      return response.error(res, '版块不存在', HttpStatus.NOT_FOUND);
    }
    
    // TODO: 检查版块下是否有帖子（待帖子模块实现后添加）
    
    // 删除版块
    await Category.delete(id);
    
    logger.info(`删除版块成功: ID ${id}, 名称 ${category.name}`);
    
    return response.success(res, {}, '删除成功');
    
  } catch (error) {
    logger.error('删除版块失败:', error.message);
    return response.error(res, '删除失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取版块统计
 * @description 获取版块统计数据
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const stats = async (req, res) => {
  try {
    const result = await Category.count();
    return response.success(res, result, '获取成功');
  } catch (error) {
    logger.error('获取版块统计失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// 导出控制器函数
module.exports = {
  getActiveList,
  list,
  getById,
  create,
  update,
  updateStatus,
  remove,
  stats
};
