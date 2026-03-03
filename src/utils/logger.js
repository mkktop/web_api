/**
 * @fileoverview 日志工具模块
 * @description 使用winston库创建统一的日志记录器，支持控制台输出和文件存储
 * 
 * 为什么需要日志？
 * - 记录程序运行状态，方便排查问题
 * - 记录用户操作，用于审计和分析
 * - 记录错误信息，帮助定位bug
 * 
 * 日志级别（从低到高）：
 * - debug: 调试信息，详细的程序运行信息
 * - info: 一般信息，如请求记录、状态变化
 * - warn: 警告信息，潜在问题但不影响运行
 * - error: 错误信息，程序出错但可以继续运行
 */

// winston是Node.js最流行的日志库
// 提供了多种传输方式（控制台、文件、数据库等）
const winston = require('winston');

// 引入配置模块，获取日志级别等配置
const config = require('../config');

// path模块用于处理文件路径
const path = require('path');

/**
 * 自定义日志格式
 * @description 定义日志的输出格式
 * 
 * 格式示例：[2024-01-15 10:30:45] INFO: 服务器启动成功
 */
const logFormat = winston.format.combine(
  // 添加时间戳，格式为：YYYY-MM-DD HH:mm:ss
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  
  // 自定义输出格式
  // info对象包含：timestamp(时间戳)、level(日志级别)、message(日志内容)
  winston.format.printf(({ timestamp, level, message }) => {
    // level.toUpperCase() 将日志级别转为大写，如：info -> INFO
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

/**
 * 创建日志记录器
 * @description 配置日志的输出目标和格式
 * 
 * transports（传输方式）说明：
 * - Console: 输出到控制台，方便开发调试
 * - File: 输出到文件，方便生产环境排查问题
 */
const logger = winston.createLogger({
  // 日志级别，低于此级别的日志不会被记录
  // 例如：level为'info'时，debug级别的日志不会显示
  level: config.logLevel,
  
  // 日志格式
  format: logFormat,
  
  // 日志输出目标（可以同时配置多个）
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        // colorize() 给不同级别的日志添加颜色，便于区分
        winston.format.colorize(),
        logFormat
      )
    }),
    
    // 错误日志文件（只记录error级别）
    // 所有错误都会记录到这个文件，方便快速定位问题
    new winston.transports.File({
      // __dirname是当前文件所在目录
      // path.join用于拼接路径，兼容不同操作系统
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    }),
    
    // 综合日志文件（记录所有级别的日志）
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log')
    })
  ]
});

// 导出日志记录器，供其他模块使用
module.exports = logger;
