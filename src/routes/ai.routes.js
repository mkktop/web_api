/**
 * @fileoverview AI聊天路由
 * @description 处理AI聊天相关的API路由
 * 
 * 路由列表：
 * - POST /api/ai/chat - 与AI助手对话（需要登录）
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authMiddleware } = require('../middlewares/auth');

/**
 * @route POST /api/ai/chat
 * @description 与AI助手进行对话
 * @access 需要登录
 * 
 * @requestBody {Object}
 *   - message {string} - 用户消息（必填，最长1000字符）
 *   - history {Array} - 历史对话记录（可选）
 * 
 * @response {Object}
 *   - success {boolean} - 是否成功
 *   - message {string} - 提示信息
 *   - data {Object}
 *     - reply {string} - AI回复内容
 * 
 * @example
 * // 请求
 * {
 *   "message": "你好，请介绍一下自己"
 * }
 * 
 * // 响应
 * {
 *   "success": true,
 *   "message": "成功",
 *   "data": {
 *     "reply": "你好！我是AI助手..."
 *   }
 * }
 */
router.post('/chat', authMiddleware, aiController.chat);

module.exports = router;
