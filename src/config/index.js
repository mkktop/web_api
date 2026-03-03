/**
 * @fileoverview 应用配置模块
 * @description 这个文件负责加载和管理应用程序的配置信息
 * 
 * 配置来源优先级：
 * 1. 环境变量 (.env 文件或系统环境变量)
 * 2. 默认值（代码中设置的默认值）
 * 
 * 为什么需要配置模块？
 * - 集中管理所有配置项，方便维护
 * - 支持不同环境（开发、测试、生产）使用不同配置
 * - 敏感信息（如密码、密钥）可以通过环境变量配置，不硬编码在代码中
 */

// 引入dotenv模块，用于读取.env文件中的环境变量
// dotenv会将.env文件中的键值对加载到process.env对象中
const dotenv = require('dotenv');

// 加载.env文件中的环境变量到process.env
// 这个方法只需要调用一次，通常在应用启动时调用
dotenv.config();

/**
 * 应用配置对象
 * @constant {Object}
 * @property {number} port - 服务器监听端口号，默认3000
 * @property {string} env - 运行环境：development(开发) / production(生产) / test(测试)
 * @property {string} logLevel - 日志级别：error/warn/info/debug
 * @property {string} apiPrefix - API路由前缀，所有API接口都会加上这个前缀
 */
module.exports = {
  // 服务器端口号
  // parseInt将字符串转换为数字，第二个参数10表示十进制
  // || 3000 表示如果环境变量没有设置，则使用默认值3000
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // 运行环境
  // 用于区分开发环境和生产环境，可以据此启用/禁用某些功能
  env: process.env.NODE_ENV || 'development',
  
  // 日志级别
  // error: 只记录错误
  // warn: 记录警告和错误
  // info: 记录一般信息、警告和错误（推荐）
  // debug: 记录所有详细信息（开发调试用）
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // API路由前缀
  // 例如：/api/system/time 中的 /api 就是前缀
  // 这样可以方便地区分API路由和静态资源路由
  apiPrefix: '/api'
};
