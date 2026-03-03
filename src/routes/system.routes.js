/**
 * @fileoverview 系统相关路由
 * @description 定义系统相关的API路由，将URL路径映射到对应的控制器方法
 * 
 * 什么是路由？
 * - 路由是Web服务器中URL路径到处理函数的映射
 * - 当客户端发起请求时，Express根据路由配置找到对应的处理函数
 * - 路由定义了：什么HTTP方法 + 什么路径 = 执行什么函数
 * 
 * 路由的三要素：
 * 1. HTTP方法：GET、POST、PUT、DELETE等
 * 2. URL路径：如 '/time'、'/info'
 * 3. 处理函数：控制器中的方法
 * 
 * 本文件定义的路由：
 * - GET /time  -> systemController.getTime
 * - GET /info  -> systemController.getSystemInfo
 */

// 引入Express框架
const express = require('express');

// 创建路由器实例
// Router是Express提供的迷你应用，可以定义路由和中间件
// 它就像一个小型的app，可以挂载到主应用的某个路径上
const router = express.Router();

// 引入系统控制器，包含具体的业务处理逻辑
const systemController = require('../controllers/system.controller');

/**
 * 定义路由规则
 * 
 * router.get(路径, 处理函数)
 * - 第一个参数：URL路径（相对路径）
 * - 第二个参数：处理请求的函数
 * 
 * 当客户端发送 GET 请求到 /time 时，会调用 systemController.getTime 函数
 */

// GET /time - 获取服务器时间
// 完整路径：/api/system/time（因为在index.js中挂载到了/system）
router.get('/time', systemController.getTime);

// GET /info - 获取系统信息
// 完整路径：/api/system/info
router.get('/info', systemController.getSystemInfo);

// 导出路由器，供其他模块使用
module.exports = router;
