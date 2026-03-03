/**
 * @fileoverview HTTP状态码常量定义
 * @description 这个文件定义了HTTP响应中常用的状态码，方便在整个项目中统一使用
 * 
 * HTTP状态码分类：
 * - 2xx: 成功 - 请求已成功被服务器接收、理解并处理
 * - 4xx: 客户端错误 - 请求包含语法错误或无法被服务器理解
 * - 5xx: 服务器错误 - 服务器无法完成明显有效的请求
 */

/**
 * HTTP状态码常量对象
 * @constant {Object}
 * @property {number} OK - 200 成功，请求已成功处理
 * @property {number} CREATED - 201 已创建，成功创建了新资源
 * @property {number} BAD_REQUEST - 400 错误请求，服务器无法理解请求格式
 * @property {number} UNAUTHORIZED - 401 未授权，需要身份验证
 * @property {number} FORBIDDEN - 403 禁止访问，服务器拒绝请求
 * @property {number} NOT_FOUND - 404 未找到，请求的资源不存在
 * @property {number} INTERNAL_SERVER_ERROR - 500 服务器内部错误
 */
const HttpStatus = {
  // 成功响应 (2xx)
  OK: 200,                    // 请求成功，是最常见的状态码
  CREATED: 201,               // 已创建，通常用于POST请求成功创建资源后返回

  // 客户端错误 (4xx)
  BAD_REQUEST: 400,           // 错误请求，客户端发送的请求有语法错误
  UNAUTHORIZED: 401,          // 未授权，需要登录或提供有效凭证
  FORBIDDEN: 403,             // 禁止访问，服务器理解请求但拒绝执行
  NOT_FOUND: 404,             // 未找到，请求的资源不存在

  // 服务器错误 (5xx)
  INTERNAL_SERVER_ERROR: 500  // 服务器内部错误，通常是代码bug导致的
};

// 导出状态码对象，供其他模块使用
module.exports = HttpStatus;
