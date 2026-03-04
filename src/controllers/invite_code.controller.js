/**
 * @fileoverview 邀请码管理控制器
 * @description 处理邀请码的生成、查询、删除等管理操作
 * 
 * 控制器的职责：
 * 1. 接收请求参数
 * 2. 验证参数有效性
 * 3. 调用模型进行数据操作
 * 4. 返回统一格式的响应
 * 
 * 权限说明：
 * - 所有邀请码管理接口仅限 admin 角色访问
 * - 需要在路由中配置 authMiddleware 和 adminMiddleware
 */

// 引入邀请码模型
const InviteCode = require('../models/invite_code.model');

// 引入响应工具函数
const response = require('../utils/response');

// 引入日志工具
const logger = require('../utils/logger');

// 引入 HTTP 状态码常量
const HttpStatus = require('../config/constants');

/**
 * 批量生成邀请码
 * @description 管理员批量生成邀请码，支持指定长度和数量
 * 
 * 生成规则：
 * - 数量范围：1-100 个
 * - 长度范围：8-32 位
 * - 随机生成，保证唯一性
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {number} req.body.count - 生成数量（1-100）
 * @param {number} req.body.length - 邀请码长度（8-32）
 * @param {Object} res - Express 响应对象
 * 
 * @example
 * // POST /api/invite-code/generate
 * // 请求体：
 * {
 *   "count": 10,
 *   "length": 16
 * }
 * 
 * // 成功响应：
 * {
 *   "success": true,
 *   "message": "生成成功",
 *   "data": {
 *     "count": 10,
 *     "list": [
 *       { "id": 1, "code": "abc123def456..." },
 *       { "id": 2, "code": "xyz789..." }
 *     ]
 *   }
 * }
 */
const generate = async (req, res) => {
  try {
    const { count = 10, length = 32 } = req.body;
    
    // ==================== 参数校验 ====================
    
    // 校验数量范围
    if (count < 1 || count > 100) {
      return response.error(res, '生成数量必须在 1-100 之间');
    }
    
    // 校验长度范围
    if (length < 8 || length > 32) {
      return response.error(res, '邀请码长度必须在 8-32 位之间');
    }
    
    // ==================== 批量生成 ====================
    
    const codes = await InviteCode.createBatch({ count, length });
    
    // 记录日志
    logger.info(`管理员批量生成邀请码: ${count} 个，长度 ${length} 位`);
    
    // 返回成功响应
    return response.success(res, {
      count: codes.length,
      list: codes
    }, '生成成功');
    
  } catch (error) {
    logger.error('批量生成邀请码失败:', error.message);
    return response.error(res, '生成失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 查询邀请码列表
 * @description 管理员查询邀请码列表，支持筛选和分页
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {number} req.query.page - 页码（默认1）
 * @param {number} req.query.pageSize - 每页数量（默认20）
 * @param {string} req.query.code - 按邀请码模糊搜索
 * @param {number} req.query.used - 按使用状态筛选（0未使用/1已使用）
 * @param {Object} res - Express 响应对象
 * 
 * @example
 * // GET /api/invite-code/list?page=1&pageSize=10&used=0
 * 
 * // 成功响应：
 * {
 *   "success": true,
 *   "message": "获取成功",
 *   "data": {
 *     "list": [
 *       {
 *         "id": 1,
 *         "code": "abc123...",
 *         "used": 0,
 *         "create_time": "2024-01-15T10:30:45.000Z",
 *         "use_time": null,
 *         "user_id": null,
 *         "username": null
 *       }
 *     ],
 *     "pagination": {
 *       "total": 100,
 *       "page": 1,
 *       "pageSize": 10,
 *       "totalPages": 10
 *     }
 *   }
 * }
 */
const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, code, used } = req.query;
    
    // ==================== 参数校验 ====================
    
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = Math.min(parseInt(pageSize) || 20, 100); // 最大100条
    
    // ==================== 查询列表 ====================
    
    const result = await InviteCode.findAll({
      page: pageNum,
      pageSize: pageSizeNum,
      code,
      used
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('查询邀请码列表失败:', error.message);
    return response.error(res, '获取失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取邀请码统计信息
 * @description 获取邀请码的总数、已使用、未使用数量
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * 
 * @example
 * // GET /api/invite-code/stats
 * 
 * // 成功响应：
 * {
 *   "success": true,
 *   "message": "获取成功",
 *   "data": {
 *     "total": 100,
 *     "used": 30,
 *     "unused": 70
 *   }
 * }
 */
const stats = async (req, res) => {
  try {
    const result = await InviteCode.count();
    return response.success(res, result, '获取成功');
  } catch (error) {
    logger.error('获取邀请码统计失败:', error.message);
    return response.error(res, '获取失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 删除邀请码
 * @description 删除未使用的邀请码（已使用的不能删除）
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 邀请码ID
 * @param {Object} res - Express 响应对象
 * 
 * @example
 * // DELETE /api/invite-code/123
 * 
 * // 成功响应：
 * {
 *   "success": true,
 *   "message": "删除成功",
 *   "data": {}
 * }
 * 
 * // 失败响应（邀请码已使用）：
 * {
 *   "success": false,
 *   "message": "该邀请码已使用，无法删除",
 *   "data": {}
 * }
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 参数校验
    if (!id) {
      return response.error(res, '邀请码ID不能为空');
    }
    
    // 检查邀请码是否存在
    const inviteCode = await InviteCode.findById(id);
    if (!inviteCode) {
      return response.error(res, '邀请码不存在', HttpStatus.NOT_FOUND);
    }
    
    // 检查是否已使用
    if (inviteCode.used === 1) {
      return response.error(res, '该邀请码已使用，无法删除');
    }
    
    // 删除邀请码
    const affected = await InviteCode.delete(id);
    
    if (affected > 0) {
      logger.info(`管理员删除邀请码: ID ${id}`);
      return response.success(res, {}, '删除成功');
    } else {
      return response.error(res, '删除失败');
    }
    
  } catch (error) {
    logger.error('删除邀请码失败:', error.message);
    return response.error(res, '删除失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 清理过期邀请码
 * @description 删除超过指定天数未使用的邀请码
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {number} req.body.days - 过期天数（默认30天）
 * @param {Object} res - Express 响应对象
 * 
 * @example
 * // POST /api/invite-code/cleanup
 * // 请求体：
 * {
 *   "days": 30
 * }
 * 
 * // 成功响应：
 * {
 *   "success": true,
 *   "message": "清理完成",
 *   "data": {
 *     "deleted": 5
 *   }
 * }
 */
const cleanup = async (req, res) => {
  try {
    const { days = 30 } = req.body;
    
    // 参数校验
    if (days < 1 || days > 365) {
      return response.error(res, '天数必须在 1-365 之间');
    }
    
    // 删除过期邀请码
    const deleted = await InviteCode.deleteExpired(days);
    
    logger.info(`管理员清理过期邀请码: 删除 ${deleted} 条，超过 ${days} 天`);
    
    return response.success(res, { deleted }, '清理完成');
    
  } catch (error) {
    logger.error('清理过期邀请码失败:', error.message);
    return response.error(res, '清理失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// 导出控制器函数
module.exports = {
  generate,
  list,
  stats,
  remove,
  cleanup
};
