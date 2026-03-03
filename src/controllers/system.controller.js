/**
 * @fileoverview 系统相关控制器
 * @description 处理系统相关的API请求，如获取时间、系统信息等
 * 
 * 什么是控制器？
 * - 控制器是MVC架构中的C（Controller）
 * - 负责处理具体的业务逻辑
 * - 接收请求，处理数据，返回响应
 * - 一个控制器通常对应一类相关的API接口
 * 
 * 控制器的职责：
 * 1. 接收路由传递过来的请求
 * 2. 调用服务层处理业务逻辑（本项目简化，直接在控制器处理）
 * 3. 返回处理结果给客户端
 */

// 引入响应工具函数，用于统一响应格式
const response = require('../utils/response');

/**
 * 获取当前服务器时间
 * @description 返回服务器的当前时间，提供多种时间格式供客户端选择使用
 * 
 * 为什么需要时间接口？
 * - 嵌入式设备可能没有实时时钟，需要从服务器获取准确时间
 * - 用于同步设备时间
 * - 用于验证设备与服务器的时间差
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Object} JSON响应，包含多种格式的时间数据
 * 
 * @example
 * // 请求: GET /api/system/time
 * // 响应:
 * {
 *   success: true,
 *   message: '获取时间成功',
 *   data: {
 *     timestamp: 1705315845348,    // Unix时间戳（毫秒）
 *     iso: '2024-01-15T10:30:45.348Z',  // ISO 8601格式
 *     utc: 'Mon, 15 Jan 2024 10:30:45 GMT',  // UTC格式
 *     local: '2024/1/15 18:30:45',  // 本地时间（北京时间）
 *     year: 2024,
 *     month: 1,
 *     day: 15,
 *     hour: 18,
 *     minute: 30,
 *     second: 45,
 *     dayOfWeek: 1,  // 星期几（0=周日，1=周一...）
 *     timezone: 'UTC+8'  // 时区
 *   },
 *   timestamp: '2024-01-15T10:30:45.358Z'
 * }
 */
const getTime = (req, res) => {
  // 创建Date对象，获取当前时间
  // Date对象是JavaScript内置的时间处理对象
  const now = new Date();
  
  // 构建返回的时间数据对象
  const timeData = {
    // Unix时间戳（毫秒）
    // 从1970年1月1日00:00:00 UTC到现在的毫秒数
    // 这是一个数字，方便计算时间差
    timestamp: now.getTime(),
    
    // ISO 8601格式的时间字符串
    // 格式：YYYY-MM-DDTHH:mm:ss.sssZ
    // 这是国际标准格式，被广泛支持
    iso: now.toISOString(),
    
    // UTC格式的字符串
    // 例如：Mon, 15 Jan 2024 10:30:45 GMT
    utc: now.toUTCString(),
    
    // 本地时间字符串（北京时间）
    // toLocaleString可以根据指定的地区格式化时间
    // 'zh-CN' 表示中文格式，timeZone指定时区
    local: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    
    // 年份（4位数）
    year: now.getFullYear(),
    
    // 月份（1-12）
    // getMonth()返回0-11，所以需要+1
    month: now.getMonth() + 1,
    
    // 日期（1-31）
    day: now.getDate(),
    
    // 小时（0-23）
    hour: now.getHours(),
    
    // 分钟（0-59）
    minute: now.getMinutes(),
    
    // 秒（0-59）
    second: now.getSeconds(),
    
    // 星期几（0-6，0表示周日）
    dayOfWeek: now.getDay(),
    
    // 时区标识
    timezone: 'UTC+8'
  };
  
  // 调用响应工具函数返回成功响应
  response.success(res, timeData, '获取时间成功');
};

/**
 * 获取系统信息
 * @description 返回服务器的基本信息，用于监控和调试
 * 
 * 用途：
 * - 监控服务器运行状态
 * - 调试时查看环境信息
 * - 健康检查
 * 
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Object} JSON响应，包含系统信息
 * 
 * @example
 * // 请求: GET /api/system/info
 * // 响应:
 * {
 *   success: true,
 *   message: '获取系统信息成功',
 *   data: {
 *     nodeVersion: 'v22.19.0',    // Node.js版本
 *     platform: 'win32',          // 操作系统平台
 *     uptime: 3600,               // 进程运行时间（秒）
 *     memoryUsage: { ... },       // 内存使用情况
 *     env: 'development'          // 运行环境
 *   },
 *   timestamp: '2024-01-15T10:30:45.000Z'
 * }
 */
const getSystemInfo = (req, res) => {
  // process是Node.js的全局对象，提供进程相关信息
  const info = {
    // Node.js版本号
    // 例如：v22.19.0
    nodeVersion: process.version,
    
    // 操作系统平台
    // 可能的值：'win32'(Windows), 'linux'(Linux), 'darwin'(macOS)
    platform: process.platform,
    
    // 进程运行时间（秒）
    // 从Node.js进程启动到现在的时间
    uptime: process.uptime(),
    
    // 内存使用情况（字节）
    // 返回一个对象，包含：
    // - rss: 常驻内存集大小
    // - heapTotal: 堆内存总量
    // - heapUsed: 已使用的堆内存
    // - external: 外部内存使用量
    memoryUsage: process.memoryUsage(),
    
    // 运行环境
    // 从环境变量获取，默认为'development'
    env: process.env.NODE_ENV || 'development'
  };
  
  // 返回成功响应
  response.success(res, info, '获取系统信息成功');
};

// 导出控制器函数，供路由使用
module.exports = {
  getTime,
  getSystemInfo
};
