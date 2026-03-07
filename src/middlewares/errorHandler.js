/**
 * @fileoverview 错误处理中间件模块
 * @description 提供统一的错误处理和404处理中间件
 * 
 * 什么是中间件？
 * - 中间件是Express中的一个核心概念
 * - 中间件是一个函数，可以访问请求对象(req)、响应对象(res)和下一个中间件(next)
 * - 中间件可以执行任何代码、修改请求/响应对象、结束请求周期
 * - 如果中间件没有结束请求，必须调用next()将控制权传递给下一个中间件
 * 
 * 中间件执行顺序：
 * 请求 -> 中间件1 -> 中间件2 -> ... -> 路由处理器 -> 响应
 * 
 * 错误处理中间件的特点：
 * - 有4个参数 (err, req, res, next)
 * - Express会自动识别这是错误处理中间件
 * - 通常放在所有中间件的最后
 */

// 引入响应工具函数
const response = require('../utils/response');

// 引入HTTP状态码常量
const HttpStatus = require('../config/constants');

// 引入 winston logger
const logger = require('../utils/logger');

/**
 * 404处理中间件
 * @description 当请求没有匹配到任何路由时，这个中间件会被调用
 * 
 * 为什么需要404中间件？
 * - 当用户访问不存在的API时，返回友好的错误信息
 * - 而不是返回默认的HTML错误页面
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} req.originalUrl - 请求的原始URL路径
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数（这里不需要调用，因为已经结束请求了）
 * 
 * @example
 * // 访问不存在的路由 /api/unknown
 * // 返回: { success: false, message: '路由 /api/unknown 不存在', timestamp: '...' }
 */
const notFound = (req, res, next) => {
  // req.originalUrl 获取用户请求的完整URL路径
  // 返回404错误，告诉用户这个路由不存在
  response.error(res, `路由 ${req.originalUrl} 不存在`, HttpStatus.NOT_FOUND);
};

/**
 * 全局错误处理中间件
 * @description 捕获应用中所有未处理的错误，返回统一的错误响应
 * 
 * 为什么需要错误处理中间件？
 * - 防止错误导致服务器崩溃
 * - 给用户返回友好的错误信息
 * - 记录错误日志，方便排查问题
 * 
 * 错误处理中间件必须有4个参数，Express通过参数数量来识别它是错误处理中间件
 * 
 * @param {Error} err - 错误对象，包含错误信息
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 * 
 * @example
 * // 在其他中间件或路由中抛出错误
 * throw new Error('数据库连接失败');
 * // 这个中间件会捕获错误并返回:
 * // { success: false, message: '数据库连接失败', timestamp: '...' }
 */
const errorHandler = (err, req, res, next) => {
  // 使用 winston logger 记录错误，会同时输出到控制台和文件
  // 记录错误堆栈和请求上下文信息
  logger.error(`${err.message}\n${err.stack}`, {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
  
  // 返回错误响应
  // err.message 是错误的消息内容
  // 如果没有错误消息，则使用默认消息'服务器内部错误'
  response.error(res, err.message || '服务器内部错误', HttpStatus.INTERNAL_SERVER_ERROR);
};

// 导出两个中间件函数
module.exports = { notFound, errorHandler };
