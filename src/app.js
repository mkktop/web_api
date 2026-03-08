/**
 * @fileoverview 应用程序入口文件
 * @description 这是整个后端应用的启动文件，负责初始化Express应用、配置中间件、挂载路由
 * 
 * 应用启动流程：
 * 1. 引入依赖模块
 * 2. 创建Express应用实例
 * 3. 配置全局中间件
 * 4. 挂载路由
 * 5. 配置错误处理
 * 6. 启动HTTP服务器
 * 
 * 什么是Express？
 * - Express是Node.js最流行的Web框架
 * - 提供了路由、中间件等核心功能
 * - 让我们可以快速构建Web应用和API
 */

// ==================== 依赖引入 ====================

// Express框架，用于创建Web服务器
const express = require('express');

// CORS中间件，用于处理跨域请求
// CORS = Cross-Origin Resource Sharing（跨源资源共享）
// 允许前端应用从不同的域名访问后端API
const cors = require('cors');

// 应用配置，包含端口号、环境等配置项
const config = require('./config');

// 日志工具，用于记录应用运行日志
const logger = require('./utils/logger');

// 路由模块，定义了所有的API路由
const routes = require('./routes');

// 错误处理中间件
const { notFound, errorHandler } = require('./middlewares/errorHandler');

// AI服务
const AIService = require('./services/ai.service');

// 文件系统模块，用于操作文件和目录
const fs = require('fs');

// 路径处理模块，用于拼接和处理文件路径
const path = require('path');

// ==================== 创建应用 ====================

/**
 * 创建Express应用实例
 * app对象是Express应用的核心，它具有以下功能：
 * - 注册中间件：app.use()
 * - 注册路由：app.get(), app.post()等
 * - 启动服务器：app.listen()
 */
const app = express();

// ==================== 配置全局中间件 ====================

/**
 * 中间件的执行顺序很重要！
 * 先注册的中间件先执行，所以基础中间件要放在最前面
 */

// 启用CORS跨域支持
// 这允许前端应用（如网页、小程序）从不同域名访问我们的API
// 如果不配置，浏览器会阻止跨域请求
app.use(cors());

// 解析JSON格式的请求体
// 当客户端发送 Content-Type: application/json 的请求时
// Express会自动将请求体解析为JavaScript对象
// 解析后的数据可以通过 req.body 访问
app.use(express.json());

// 解析URL编码的请求体
// 当客户端发送表单数据（Content-Type: application/x-www-form-urlencoded）时
// Express会解析表单数据
// extended: true 表示使用qs库解析，支持嵌套对象
app.use(express.urlencoded({ extended: true }));

// ==================== 初始化目录 ====================

/**
 * 确保日志目录存在
 * 如果logs目录不存在，则创建它
 * recursive: true 表示递归创建，如果父目录不存在也会创建
 */
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ==================== 请求日志中间件 ====================

/**
 * 自定义请求日志中间件
 * 每个请求都会经过这个中间件，记录请求信息
 * 
 * 中间件函数的三个参数：
 * - req: 请求对象，包含请求信息
 * - res: 响应对象，用于发送响应
 * - next: 下一个中间件函数，必须调用才能继续执行后续中间件
 */
app.use((req, res, next) => {
  // 记录请求方法、URL和客户端IP
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  // 调用next()将控制权传递给下一个中间件
  // 如果不调用next()，请求会卡住，无法继续处理
  next();
});

// ==================== 根路由 ====================

/**
 * 根路由处理
 * 当访问 http://localhost:3000/ 时返回API基本信息
 * 这是一个简单的API文档入口，方便开发者了解可用的接口
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Web API',
    version: '1.0.0',
    description: '嵌入式设备管理后端API',
    endpoints: {
      system: {
        getTime: 'GET /api/system/time',
        getInfo: 'GET /api/system/info'
      }
    }
  });
});

// ==================== 挂载API路由 ====================

/**
 * 挂载API路由
 * 所有以 /api 开头的请求都会被路由到routes模块处理
 * 例如：/api/system/time 会由routes模块中的system路由处理
 */
app.use(config.apiPrefix, routes);

// ==================== 错误处理中间件 ====================

/**
 * 错误处理中间件必须放在所有路由之后！
 * 
 * 404处理中间件
 * 当请求没有匹配到任何路由时，会进入这个中间件
 */
app.use(notFound);

/**
 * 全局错误处理中间件
 * 捕获应用中所有未处理的错误
 * 注意：错误处理中间件有4个参数，Express通过参数数量识别
 */
app.use(errorHandler);

// ==================== 启动服务器 ====================

/**
 * 启动HTTP服务器
 * app.listen(端口, 回调函数)
 * 
 * 服务器启动后，会监听指定端口，等待客户端请求
 * 当有请求到达时，Express会依次执行中间件和路由处理函数
 */
// 启动服务器
const startServer = async () => {
  try {
    // 初始化AI服务
    await AIService.init();
    
    // 启动HTTP服务器
    app.listen(config.port, () => {
      // 服务器启动成功后记录日志
      logger.info(`服务器运行在 http://localhost:${config.port}`);
      logger.info(`环境: ${config.env}`);
    });
  } catch (error) {
    logger.error('启动失败:', error.message);
    process.exit(1);
  }
};

startServer();

// 导出app实例，便于测试
module.exports = app;
