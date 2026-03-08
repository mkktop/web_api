/**
 * @fileoverview AI聊天控制器
 * @description 处理AI聊天相关请求
 */

const AIService = require('../services/ai.service');
const response = require('../utils/response');
const logger = require('../utils/logger');
const HttpStatus = require('../config/constants');

/**
 * AI聊天接口
 * @description 与AI助手进行对话
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.message - 用户消息
 * @param {Array} req.body.history - 历史对话记录（可选）
 * @param {Object} res - Express 响应对象
 */
const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const userId = req.user ? req.user.id : null;
    
    if (!message || message.trim() === '') {
      return response.error(res, '消息不能为空');
    }
    
    if (message.length > 1000) {
      return response.error(res, '消息长度不能超过1000个字符');
    }
    
    logger.info(`AI聊天请求 - 用户ID: ${userId}, 消息: ${message.substring(0, 50)}...`);
    
    const reply = await AIService.chat(message.trim(), history);
    
    if (!reply) {
      return response.error(res, 'AI服务暂时不可用，请稍后再试', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    logger.info(`AI聊天成功 - 用户ID: ${userId}`);
    
    return response.success(res, { reply }, '成功');
    
  } catch (error) {
    logger.error('AI聊天失败:', error.message);
    return response.error(res, 'AI服务出错', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  chat
};
