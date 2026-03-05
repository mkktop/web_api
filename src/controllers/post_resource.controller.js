/**
 * @fileoverview 帖子资源控制器
 * @description 处理资源下载和积分兑换操作
 * 
 * 功能说明：
 * - 发帖者可设置资源下载链接和价格
 * - 其他用户使用积分兑换下载链接
 * - 兑换积分的50%给发帖者
 */

const PostResource = require('../models/post_resource.model');
const Post = require('../models/post.model');
const UserAuth = require('../models/user_auth.model');

const response = require('../utils/response');
const logger = require('../utils/logger');
const HttpStatus = require('../config/constants');

// 默认兑换价格
const DEFAULT_PRICE = 50;
// 作者收益比例（50%）
const AUTHOR_EARNINGS_RATE = 0.5;

/**
 * 设置资源
 * @description 发帖者设置资源下载链接
 */
const setResource = async (req, res) => {
  try {
    const { postId } = req.params;
    const { download_link, price = DEFAULT_PRICE } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!download_link || download_link.trim() === '') {
      return response.error(res, '下载链接不能为空');
    }
    
    if (price < 0) {
      return response.error(res, '价格不能为负数');
    }
    
    const post = await Post.findById(postId);
    if (!post || post.status === 0) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    if (!isAdmin && post.user_id !== userId) {
      return response.error(res, '无权操作', HttpStatus.FORBIDDEN);
    }
    
    const existingResource = await PostResource.findByPostId(postId);
    
    if (existingResource) {
      await PostResource.update(postId, { download_link, price });
      logger.info(`更新资源: 帖子 ${postId}, 价格 ${price}`);
      return response.success(res, {}, '更新成功');
    } else {
      const resourceId = await PostResource.create({
        post_id: postId,
        download_link,
        price
      });
      logger.info(`创建资源: 帖子 ${postId}, 价格 ${price}`);
      return response.success(res, { id: resourceId }, '设置成功');
    }
    
  } catch (error) {
    logger.error('设置资源失败:', error.message);
    return response.error(res, '操作失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取资源信息
 * @description 获取帖子资源信息（不包含下载链接）
 */
const getResource = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;
    
    const resource = await PostResource.findByPostId(postId);
    if (!resource) {
      return response.error(res, '该帖子没有资源', HttpStatus.NOT_FOUND);
    }
    
    const hasPurchased = userId ? await PostResource.hasPurchased(resource.id, userId) : false;
    const isAuthor = userId ? (await Post.findById(postId))?.user_id === userId : false;
    
    const result = {
      id: resource.id,
      price: resource.price,
      download_count: resource.download_count,
      has_purchased: hasPurchased,
      is_author: isAuthor
    };
    
    if (hasPurchased || isAuthor) {
      result.download_link = resource.download_link;
    }
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取资源失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 兑换资源
 * @description 使用积分兑换资源下载链接
 */
const purchaseResource = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    
    const post = await Post.findById(postId);
    if (!post || post.status === 0) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    if (post.user_id === userId) {
      return response.error(res, '不能兑换自己的资源');
    }
    
    const resource = await PostResource.findByPostId(postId);
    if (!resource) {
      return response.error(res, '该帖子没有资源', HttpStatus.NOT_FOUND);
    }
    
    const hasPurchased = await PostResource.hasPurchased(resource.id, userId);
    if (hasPurchased) {
      return response.error(res, '已兑换过该资源');
    }
    
    const userAuth = await UserAuth.findByUserId(userId);
    if (!userAuth) {
      return response.error(res, '用户权限信息不存在');
    }
    
    if (userAuth.points < resource.price) {
      return response.error(res, `积分不足，需要${resource.price}积分，当前${userAuth.points}积分`);
    }
    
    const authorEarnings = Math.floor(resource.price * AUTHOR_EARNINGS_RATE);
    
    await UserAuth.deductPoints(userId, resource.price);
    await UserAuth.addPoints(post.user_id, authorEarnings);
    
    const purchaseId = await PostResource.purchase({
      resource_id: resource.id,
      user_id: userId,
      points_cost: resource.price,
      author_earnings: authorEarnings
    });
    
    await PostResource.incrementDownloadCount(resource.id);
    
    logger.info(`资源兑换: 用户 ${userId} 兑换帖子 ${postId}, 消耗 ${resource.price} 积分, 作者收益 ${authorEarnings}`);
    
    return response.success(res, {
      download_link: resource.download_link,
      points_cost: resource.price,
      author_earnings: authorEarnings
    }, '兑换成功');
    
  } catch (error) {
    logger.error('兑换资源失败:', error.message);
    return response.error(res, '兑换失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 删除资源
 * @description 发帖者或管理员删除资源
 */
const deleteResource = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    const post = await Post.findById(postId);
    if (!post) {
      return response.error(res, '帖子不存在', HttpStatus.NOT_FOUND);
    }
    
    if (!isAdmin && post.user_id !== userId) {
      return response.error(res, '无权操作', HttpStatus.FORBIDDEN);
    }
    
    await PostResource.delete(postId);
    
    logger.info(`删除资源: 帖子 ${postId}`);
    
    return response.success(res, {}, '删除成功');
    
  } catch (error) {
    logger.error('删除资源失败:', error.message);
    return response.error(res, '删除失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取我的兑换记录
 */
const getMyPurchases = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await PostResource.getUserPurchases(userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取兑换记录失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取我的资源收益
 */
const getMyEarnings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await PostResource.getAuthorEarnings(userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取收益记录失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取资源统计
 */
const getStats = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const stats = await PostResource.getStats(postId);
    if (!stats) {
      return response.error(res, '该帖子没有资源', HttpStatus.NOT_FOUND);
    }
    
    return response.success(res, stats, '获取成功');
    
  } catch (error) {
    logger.error('获取资源统计失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  setResource,
  getResource,
  purchaseResource,
  deleteResource,
  getMyPurchases,
  getMyEarnings,
  getStats
};
