/**
 * @fileoverview JWT 工具函数
 * @description 提供 JWT Token 的生成和验证功能
 * 
 * 什么是 JWT？
 * - JWT (JSON Web Token) 是一种开放标准，用于在各方之间安全地传输信息
 * - JWT 由三部分组成：Header（头部）、Payload（载荷）、Signature（签名）
 * - JWT 常用于身份验证和信息交换
 * 
 * JWT 工作流程：
 * 1. 用户登录成功后，服务器生成 JWT Token
 * 2. 服务器将 Token 返回给客户端
 * 3. 客户端存储 Token（通常在 localStorage 或 Cookie）
 * 4. 后续请求在 Header 中携带 Token
 * 5. 服务器验证 Token 的有效性
 * 
 * 安全说明：
 * - JWT 密钥必须从环境变量读取，禁止硬编码
 * - Token 有效期不宜过长，一般 7 天左右
 * - 敏感信息不要放在 Token 中
 */

// 引入 jsonwebtoken 库
const jwt = require('jsonwebtoken');

// 引入配置模块
const config = require('../config');

/**
 * 生成 JWT Token
 * @description 根据用户信息生成 JWT Token
 * 
 * @param {Object} payload - 要编码的数据
 * @param {number} payload.id - 用户ID
 * @param {string} payload.username - 用户名
 * @param {string} payload.role - 用户角色
 * @returns {string} 生成的 JWT Token
 * 
 * @example
 * const token = generateToken({
 *   id: 1,
 *   username: 'admin',
 *   role: 'admin'
 * });
 * // 返回类似：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
const generateToken = (payload) => {
  // jwt.sign(载荷, 密钥, 选项)
  // expiresIn: Token 有效期（秒）
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

/**
 * 验证 JWT Token
 * @description 验证 Token 是否有效，返回解码后的数据
 * 
 * @param {string} token - 要验证的 JWT Token
 * @returns {Object|null} 解码后的数据，验证失败返回 null
 * 
 * @example
 * const decoded = verifyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * if (decoded) {
 *   console.log('用户ID:', decoded.id);
 *   console.log('用户名:', decoded.username);
 * }
 */
const verifyToken = (token) => {
  try {
    // jwt.verify(令牌, 密钥)
    // 如果验证成功，返回解码后的数据
    // 如果验证失败，抛出异常
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    // Token 无效或已过期
    return null;
  }
};

/**
 * 从请求头中提取 Token
 * @description 从 Authorization 头中提取 Bearer Token
 * 
 * @param {string} authHeader - Authorization 头的值
 * @returns {string|null} 提取的 Token，格式错误返回 null
 * 
 * @example
 * // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * const token = extractToken('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * console.log(token);  // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
const extractToken = (authHeader) => {
  // 检查 Header 是否存在
  if (!authHeader) {
    return null;
  }
  
  // 检查格式是否正确：Bearer <token>
  // 以 'Bearer ' 开头（注意有空格）
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // 提取 Token（去掉 'Bearer ' 前缀）
  return authHeader.slice(7);
};

/**
 * 解码 Token（不验证签名）
 * @description 仅解码 Token，不验证签名是否有效
 * 用于调试或获取 Token 中的信息而不关心是否过期
 * 
 * @param {string} token - JWT Token
 * @returns {Object|null} 解码后的数据
 */
const decodeToken = (token) => {
  try {
    // jwt.decode 只解码，不验证签名
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// 导出工具函数
module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  decodeToken
};
