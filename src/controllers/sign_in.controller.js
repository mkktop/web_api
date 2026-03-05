/**
 * @fileoverview 签到控制器
 * @description 处理用户签到和积分兑换操作
 * 
 * 功能说明：
 * - 每日签到获得20积分
 * - 连续签到有额外奖励
 * - 50积分可兑换邀请码
 */

const SignIn = require('../models/sign_in.model');
const UserAuth = require('../models/user_auth.model');
const InviteCode = require('../models/invite_code.model');

const response = require('../utils/response');
const logger = require('../utils/logger');
const HttpStatus = require('../config/constants');

// 签到积分配置
const SIGN_IN_POINTS = 20;
// 连续签到额外奖励
const CONTINUOUS_BONUS = {
  7: 10,   // 连续7天额外10积分
  14: 20,  // 连续14天额外20积分
  30: 50   // 连续30天额外50积分
};
// 兑换邀请码所需积分
const EXCHANGE_POINTS = 50;

/**
 * 签到
 * @description 用户每日签到，获得积分
 */
const signIn = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 检查今日是否已签到
    const hasSigned = await SignIn.hasSignedToday(userId);
    if (hasSigned) {
      return response.error(res, '今日已签到');
    }
    
    // 计算连续签到天数
    const lastRecord = await SignIn.getLastSignIn(userId);
    let continuousDays = 1;
    
    if (lastRecord) {
      const today = new Date();
      const lastDate = new Date(lastRecord.sign_date);
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        continuousDays = lastRecord.continuous_days + 1;
      }
    }
    
    // 计算获得积分
    let points = SIGN_IN_POINTS;
    if (CONTINUOUS_BONUS[continuousDays]) {
      points += CONTINUOUS_BONUS[continuousDays];
    }
    
    // 签到
    const recordId = await SignIn.signIn(userId, points, continuousDays);
    
    // 增加用户积分
    await UserAuth.addPoints(userId, points);
    
    logger.info(`用户签到: 用户ID ${userId}, 连续${continuousDays}天, 获得${points}积分`);
    
    return response.success(res, {
      points_earned: points,
      continuous_days: continuousDays,
      bonus: points > SIGN_IN_POINTS ? points - SIGN_IN_POINTS : 0
    }, '签到成功');
    
  } catch (error) {
    logger.error('签到失败:', error.message);
    return response.error(res, '签到失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取签到状态
 * @description 获取用户今日签到状态
 */
const getStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const hasSigned = await SignIn.hasSignedToday(userId);
    const stats = await SignIn.getStats(userId);
    const monthlyDates = await SignIn.getMonthlyDates(userId);
    
    return response.success(res, {
      has_signed_today: hasSigned,
      ...stats,
      monthly_dates: monthlyDates
    }, '获取成功');
    
  } catch (error) {
    logger.error('获取签到状态失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取签到记录
 * @description 获取用户签到记录列表
 */
const getRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 30 } = req.query;
    
    const result = await SignIn.getRecords(userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取签到记录失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 兑换邀请码
 * @description 使用50积分兑换邀请码
 */
const exchangeInviteCode = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取用户积分
    const userAuth = await UserAuth.findByUserId(userId);
    if (!userAuth) {
      return response.error(res, '用户权限信息不存在');
    }
    
    // 检查积分是否足够
    if (userAuth.points < EXCHANGE_POINTS) {
      return response.error(res, `积分不足，需要${EXCHANGE_POINTS}积分，当前${userAuth.points}积分`);
    }
    
    // 扣除积分
    await UserAuth.deductPoints(userId, EXCHANGE_POINTS);
    
    // 生成邀请码
    const code = await InviteCode.create();
    
    logger.info(`用户兑换邀请码: 用户ID ${userId}, 消耗${EXCHANGE_POINTS}积分`);
    
    return response.success(res, {
      code: code.code,
      points_cost: EXCHANGE_POINTS,
      remaining_points: userAuth.points - EXCHANGE_POINTS
    }, '兑换成功');
    
  } catch (error) {
    logger.error('兑换邀请码失败:', error.message);
    return response.error(res, '兑换失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取积分信息
 * @description 获取用户当前积分信息
 */
const getPointsInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userAuth = await UserAuth.findByUserId(userId);
    if (!userAuth) {
      return response.error(res, '用户权限信息不存在');
    }
    
    return response.success(res, {
      points: userAuth.points,
      can_exchange: userAuth.points >= EXCHANGE_POINTS,
      exchange_cost: EXCHANGE_POINTS
    }, '获取成功');
    
  } catch (error) {
    logger.error('获取积分信息失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  signIn,
  getStatus,
  getRecords,
  exchangeInviteCode,
  getPointsInfo
};
