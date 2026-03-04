/**
 * @fileoverview 认证中间件
 * @description 验证 JWT Token，保护需要登录才能访问的接口
 * 
 * 什么是中间件？
 * - 中间件是 Express 中处理请求的函数
 * - 可以在路由处理之前执行，用于验证、日志等
 * - 如果验证通过，调用 next() 继续执行后续处理
 * - 如果验证失败，直接返回错误响应
 * 
 * 使用场景：
 * - 保护需要登录才能访问的接口
 * - 获取当前登录用户信息
 */

// 引入响应工具函数
const response = require('../utils/response');

// 引入 JWT 工具函数
const jwt = require('../utils/jwt');

// 引入 HTTP 状态码常量
const HttpStatus = require('../config/constants');

/**
 * 认证中间件
 * @description 验证请求头中的 JWT Token，提取用户信息
 * 
 * 工作流程：
 * 1. 从请求头获取 Authorization 字段
 * 2. 提取 Bearer Token
 * 3. 验证 Token 是否有效
 * 4. 将用户信息附加到 req.user
 * 5. 调用 next() 继续执行
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.headers - 请求头
 * @param {string} req.headers.authorization - Authorization 头（格式：Bearer <token>）
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 * 
 * @example
 * // 在路由中使用
 * router.get('/profile', authMiddleware, (req, res) => {
 *   console.log(req.user.id);  // 当前登录用户的 ID
 * });
 */
const authMiddleware = (req, res, next) => {
  // 1. 从请求头获取 Authorization 字段
  const authHeader = req.headers.authorization;
  
  // 2. 提取 Token
  const token = jwt.extractToken(authHeader);
  
  // 3. 检查 Token 是否存在
  if (!token) {
    return response.error(res, '未登录或 Token 过期', HttpStatus.UNAUTHORIZED);
  }
  
  // 4. 验证 Token
  const decoded = jwt.verifyToken(token);
  
  // 5. 检查验证结果
  if (!decoded) {
    return response.error(res, '未登录或 Token 过期', HttpStatus.UNAUTHORIZED);
  }
  
  // 6. 将用户信息附加到请求对象
  // 后续的路由处理函数可以通过 req.user 访问用户信息
  req.user = {
    id: decoded.id,
    username: decoded.username,
    role: decoded.role
  };
  
  // 7. 调用 next() 继续执行后续中间件或路由处理
  next();
};

/**
 * 可选认证中间件
 * @description 如果有 Token 则验证，没有 Token 也允许继续
 * 用于一些既可以登录访问，也可以游客访问的接口
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = jwt.extractToken(authHeader);
  
  if (token) {
    const decoded = jwt.verifyToken(token);
    if (decoded) {
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };
    }
  }
  
  next();
};

/**
 * 管理员权限中间件
 * @description 验证用户是否为管理员
 * 必须先使用 authMiddleware，再使用此中间件
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件函数
 * 
 * @example
 * // 必须先验证登录，再验证管理员权限
 * router.delete('/user/:id', authMiddleware, adminMiddleware, deleteUser);
 */
const adminMiddleware = (req, res, next) => {
  // 检查是否已登录（req.user 是否存在）
  if (!req.user) {
    return response.error(res, '未登录', HttpStatus.UNAUTHORIZED);
  }
  
  // 检查是否为管理员
  if (req.user.role !== 'admin') {
    return response.error(res, '权限不足', HttpStatus.FORBIDDEN);
  }
  
  next();
};

// 导出中间件
module.exports = {
  authMiddleware,
  optionalAuth,
  adminMiddleware
};
