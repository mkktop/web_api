/**
 * @fileoverview AI服务模块
 * @description 调用OpenCode AI API进行自动评论，支持重试和自动切换模型
 */

const https = require('https');
const logger = require('../utils/logger');

// AI API配置
const AI_CONFIG = {
  hostname: 'api.edgefn.net',
  port: 443,
  basePath: '/v1',
  apiKey: 'sk-vpoecumURrtuOn4BD9742cFb10634b3dBa6973705cAeAd5f',
  botUserId: 4,
  maxRetries: 3,
  timeout: 30000,
  retryDelay: 5000
};

// 模型列表
let availableModels = [
  'DeepSeek-R1-0528-Qwen3-8B'
];

// 当前使用的模型索引
let currentModelIndex = 0;

/**
 * 获取可用的免费模型列表
 * @returns {Promise<string[]>} 模型列表
 */
const fetchAvailableModels = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: AI_CONFIG.hostname,
      port: AI_CONFIG.port,
      path: `${AI_CONFIG.basePath}/models`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.data && Array.isArray(response.data)) {
            const freeModels = response.data
              .filter(m => m.id && (m.id.includes('free') || m.id === 'big-pickle'))
              .map(m => m.id);
            
            if (freeModels.length > 0) {
              logger.info(`获取到 ${freeModels.length} 个免费模型: ${freeModels.join(', ')}`);
              availableModels = freeModels;
            }
          }
          resolve(availableModels);
        } catch (e) {
          logger.error('解析模型列表失败:', e.message);
          resolve(availableModels);
        }
      });
    });

    req.on('error', (e) => {
      logger.error('获取模型列表失败:', e.message);
      resolve(availableModels);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve(availableModels);
    });

    req.end();
  });
};

/**
 * 调用AI API生成内容
 * @param {string} prompt - 提示词
 * @param {string} context - 上下文（可选）
 * @returns {Promise<string>} AI生成的内容
 */
const callAI = (prompt, context = null) => {
  return new Promise((resolve) => {
    const model = availableModels[currentModelIndex];
    
    const messages = [];
    if (context) {
      messages.push({ role: 'system', content: context });
    }
    messages.push({ role: 'user', content: prompt });

    const data = JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 300,
      temperature: 0.7
    });

    const options = {
      hostname: AI_CONFIG.hostname,
      port: AI_CONFIG.port,
      path: `${AI_CONFIG.basePath}/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          
          if (response.error) {
            logger.error(`AI API错误 (模型: ${model}):`, response.error.message || response.error);
            resolve(null);
          } else {
            const content = response.choices[0].message.content.trim();
            logger.info(`AI生成成功 (模型: ${model}, tokens: ${response.usage.total_tokens})`);
            resolve(content);
          }
        } catch (e) {
          logger.error('解析AI响应失败:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      logger.error(`AI API请求失败 (模型: ${model}):`, e.message);
      resolve(null);
    });

    req.setTimeout(AI_CONFIG.timeout, () => {
      req.destroy();
      logger.error(`AI API请求超时 (模型: ${model})`);
      resolve(null);
    });

    req.write(data);
    req.end();
  });
};

/**
 * 带重试的AI调用
 * @param {string} prompt - 提示词
 * @param {string} context - 上下文（可选）
 * @returns {Promise<string>} AI生成的内容
 */
const callAIWithRetry = async (prompt, context = null) => {
  for (let attempt = 0; attempt < AI_CONFIG.maxRetries; attempt++) {
    const result = await callAI(prompt, context);
    
    if (result) {
      return result;
    }
    
    currentModelIndex = (currentModelIndex + 1) % availableModels.length;
    logger.info(`切换到模型: ${availableModels[currentModelIndex]}`);
    
    // 等待一段时间再重试
    if (attempt < AI_CONFIG.maxRetries - 1) {
      logger.info(`等待 ${AI_CONFIG.retryDelay / 1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, AI_CONFIG.retryDelay));
    }
    
    if (attempt === availableModels.length - 1) {
      await fetchAvailableModels();
    }
  }
  
  return null;
};

/**
 * 生成帖子评论
 * @param {string} postTitle - 帖子标题
 * @param {string} postContent - 帖子内容
 * @param {string} authorName - 发帖者昵称
 * @returns {Promise<string>} AI生成的评论内容
 */
const generatePostComment = async (postTitle, postContent, authorName) => {
  const context = `你是论坛的AI助手，你的名字叫"AI助手"，你的用户名是"AI_Bot"。
你是论坛的管理员之一，负责帮助用户、维护论坛氛围。
你的回复应该友好、有帮助、有建设性。
回复长度控制在50-150字之间。`;

  const prompt = `用户"${authorName}"发表了一篇帖子：

标题：${postTitle}

内容：${postContent.substring(0, 500)}${postContent.length > 500 ? '...' : ''}

请以AI助手的身份，对这篇帖子发表一条友好的评论：`;

  return await callAIWithRetry(prompt, context);
};

/**
 * 生成回复评论
 * @param {string} postTitle - 帖子标题
 * @param {string} postContent - 帖子内容
 * @param {string} commentContent - 用户评论内容
 * @param {string} commenterName - 评论者昵称
 * @param {Array} previousComments - 之前的评论（用于上下文）
 * @returns {Promise<string>} AI生成的回复内容
 */
const generateReplyComment = async (postTitle, postContent, commentContent, commenterName, previousComments = []) => {
  const context = `你是论坛的AI助手，你的名字叫"AI助手"，你的用户名是"AI_Bot"。
你是论坛的管理员之一，负责帮助用户、维护论坛氛围。
现在有用户回复了你的评论，你需要友好地回复他们。
回复长度控制在30-100字之间。`;

  let contextInfo = `帖子标题：${postTitle}\n帖子内容摘要：${postContent.substring(0, 200)}...`;

  if (previousComments.length > 0) {
    contextInfo += '\n\n之前的评论：';
    previousComments.slice(-5).forEach(c => {
      contextInfo += `\n${c.author_name}: ${c.content}`;
    });
  }

  const prompt = `${contextInfo}

用户"${commenterName}"评论说：${commentContent}

请以AI助手的身份，友好地回复这条评论：`;

  return await callAIWithRetry(prompt, context);
};

/**
 * 通用聊天接口
 * @description 支持多轮对话的通用聊天功能
 * @param {string} message - 用户消息
 * @param {Array} history - 历史对话记录 [{role: 'user'|'assistant', content: '...'}]
 * @returns {Promise<string>} AI回复内容
 */
const chat = async (message, history = []) => {
  const context = `你是论坛的AI助手，你的名字叫"AI助手"。
你是论坛的管理员之一，负责帮助用户、维护论坛氛围。
你的回复应该友好、有帮助、有建设性。
你可以回答各种问题，帮助用户解决困难。
回复长度控制在50-300字之间。`;

  return await callAIWithRetry(message, context);
};

/**
 * 获取机器人用户ID
 * @returns {number} 机器人用户ID
 */
const getBotUserId = () => {
  return AI_CONFIG.botUserId;
};

/**
 * 初始化AI服务
 */
const init = async () => {
  logger.info('初始化AI服务...');
  await fetchAvailableModels();
  logger.info(`当前使用模型: ${availableModels[currentModelIndex]}`);
};

module.exports = {
  generatePostComment,
  generateReplyComment,
  chat,
  getBotUserId,
  init
};
