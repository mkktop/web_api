/**
 * @fileoverview AI服务模块
 * @description 调用OpenCode AI API进行自动评论
 */

const https = require('https');
const config = require('../config');
const logger = require('../utils/logger');

// AI API配置
const AI_CONFIG = {
  hostname: 'opencode.ai',
  port: 443,
  path: '/zen/v1/chat/completions',
  apiKey: config.ai?.apiKey || 'sk-2VkbLll2uyWhcBduqKmTx0nq0uxttxoYUBelndI4HZ6duET8CPF7M0pR8wy5xfdn',
  model: 'minimax-m2.5-free',
  botUserId: 4  // AI_Bot的用户ID
};

/**
 * 调用AI API生成评论
 * @param {string} postTitle - 帖子标题
 * @param {string} postContent - 帖子内容
 * @returns {Promise<string>} AI生成的评论内容
 */
const generateComment = (postTitle, postContent) => {
  return new Promise((resolve, reject) => {
    const prompt = `你是一个友好的论坛用户，请对以下帖子发表一条简短、有建设性的评论（50-150字）：

标题：${postTitle}

内容：${postContent.substring(0, 500)}${postContent.length > 500 ? '...' : ''}

请直接输出评论内容，不要加任何前缀：`;

    const data = JSON.stringify({
      model: AI_CONFIG.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const options = {
      hostname: AI_CONFIG.hostname,
      port: AI_CONFIG.port,
      path: AI_CONFIG.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          
          if (response.error) {
            logger.error('AI API错误:', response.error.message || response.error);
            resolve(null);
          } else {
            const comment = response.choices[0].message.content.trim();
            logger.info(`AI生成评论成功，使用${response.usage.total_tokens} tokens`);
            resolve(comment);
          }
        } catch (e) {
          logger.error('解析AI响应失败:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      logger.error('AI API请求失败:', e.message);
      resolve(null);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      logger.error('AI API请求超时');
      resolve(null);
    });

    req.write(data);
    req.end();
  });
};

/**
 * 获取机器人用户ID
 * @returns {number} 机器人用户ID
 */
const getBotUserId = () => {
  return AI_CONFIG.botUserId;
};

module.exports = {
  generateComment,
  getBotUserId
};
