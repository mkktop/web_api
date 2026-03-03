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
 * 成功：{ success: true, message: '...', data: {...}, timestamp: '...' }
 * 失败：{ success: false, message: '...', errors: [...], timestamp: '...' }
 */

// 引入HTTP状态码常量
const HttpStatus = require('../config/constants');

/**
 * 成功响应函数
 * @description 返回成功格式的JSON响应
 * 
 * @param {Object} res - Express响应对象，用于发送HTTP响应
 * @param {*} data - 要返回的数据，可以是对象、数组等
 * @param {string} message - 成功消息，默认为'Success'
 * @param {number} statusCode - HTTP状态码，默认为200
 * @returns {Object} Express响应对象
 * 
 * @example
 * // 基本用法
 * success(res, { id: 1, name: '设备1' });
 * // 返回: { success: true, message: 'Success', data: { id: 1, name: '设备1' }, timestamp: '...' }
 * 
 * @example
 * // 自定义消息
 * success(res, { time: Date.now() }, '获取时间成功');
 * // 返回: { success: true, message: '获取时间成功', data: { time: ... }, timestamp: '...' }
 */
const success = (res, data, message = 'Success', statusCode = HttpStatus.OK) => {
  // res.status() 设置HTTP状态码
  // .json() 发送JSON格式的响应体，并自动设置Content-Type头
  return res.status(statusCode).json({
    success: true,              // 成功标志，前端可以通过这个字段判断请求是否成功
    message,                    // 提示消息
    data,                       // 实际数据
    timestamp: new Date().toISOString()  // 响应时间戳，ISO 8601格式
  });
};

/**
 * 错误响应函数
 * @description 返回错误格式的JSON响应
 * 
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息，默认为'Error'
 * @param {number} statusCode - HTTP状态码，默认为500
 * @param {Array|null} errors - 详细错误信息数组，用于表单验证等场景
 * @returns {Object} Express响应对象
 * 
 * @example
 * // 基本用法
 * error(res, '设备不存在', HttpStatus.NOT_FOUND);
 * // 返回: { success: false, message: '设备不存在', timestamp: '...' }
 * 
 * @example
 * // 带详细错误信息
 * error(res, '参数错误', HttpStatus.BAD_REQUEST, ['用户名不能为空', '密码长度不足']);
 * // 返回: { success: false, message: '参数错误', errors: [...], timestamp: '...' }
 */
const error = (res, message = 'Error', statusCode = HttpStatus.INTERNAL_SERVER_ERROR, errors = null) => {
  // 构建响应对象
  const response = {
    success: false,             // 失败标志
    message,                    // 错误消息
    timestamp: new Date().toISOString()
  };
  
  // 如果有详细错误信息，添加到响应中
  // 例如表单验证时，可以返回所有字段的错误
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

// 导出两个函数，供其他模块使用
module.exports = { success, error };
