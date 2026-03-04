/**
 * @fileoverview 统一响应格式工具模块
 * @description 提供统一的API响应格式，让前端能够以一致的方式处理响应
 * 
 * 为什么需要统一响应格式？
 * - 前端可以用同样的方式处理所有接口的响应
 * - 便于错误处理和调试
 * - 响应格式规范，易于理解
 * 
 * 统一响应格式：
 * 成功：{ success: true, message: '...', data: {...} }
 * 失败：{ success: false, message: '...', data: {} }
 */

// 引入HTTP状态码常量
const HttpStatus = require('../config/constants');

/**
 * 成功响应函数
 * @description 返回成功格式的JSON响应
 * 
 * @param {Object} res - Express响应对象，用于发送HTTP响应
 * @param {*} data - 要返回的数据，可以是对象、数组等
 * @param {string} message - 成功消息，默认为'操作成功'
 * @returns {Object} Express响应对象
 * 
 * @example
 * // 基本用法
 * success(res, { id: 1, name: '设备1' });
 * // 返回: { success: true, message: '操作成功', data: { id: 1, name: '设备1' } }
 * 
 * @example
 * // 自定义消息
 * success(res, { time: Date.now() }, '获取时间成功');
 * // 返回: { success: true, message: '获取时间成功', data: { time: ... } }
 */
const success = (res, data = {}, message = '操作成功') => {
  return res.status(HttpStatus.OK).json({
    success: true,              // 成功标志
    message,                    // 提示消息
    data                        // 实际数据
  });
};

/**
 * 错误响应函数
 * @description 返回错误格式的JSON响应
 * 
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息，默认为'操作失败'
 * @param {number} statusCode - HTTP状态码，默认为400
 * @param {*} data - 附加数据，默认为空对象
 * @returns {Object} Express响应对象
 * 
 * @example
 * // 基本用法
 * error(res, '设备不存在', HttpStatus.NOT_FOUND);
 * // 返回: { success: false, message: '设备不存在', data: {} }
 * 
 * @example
 * // 参数错误
 * error(res, '用户名已存在');
 * // 返回: { success: false, message: '用户名已存在', data: {} }
 */
const error = (res, message = '操作失败', statusCode = HttpStatus.BAD_REQUEST, data = {}) => {
  return res.status(statusCode).json({
    success: false,             // 失败标志
    message,                    // 错误消息
    data                        // 附加数据（通常为空对象）
  });
};

/**
 * 分页响应函数
 * @description 返回带分页信息的成功响应
 * 
 * @param {Object} res - Express响应对象
 * @param {Array} list - 数据列表
 * @param {number} total - 总数量
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页数量
 * @param {string} message - 成功消息
 * @returns {Object} Express响应对象
 */
const page = (res, list, total, page, pageSize, message = '获取成功') => {
  return res.status(HttpStatus.OK).json({
    success: true,
    message,
    data: {
      list,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  });
};

// 导出函数，供其他模块使用
module.exports = { success, error, page };
