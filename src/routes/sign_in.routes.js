/**
 * @fileoverview 签到路由
 * @description 定义签到和积分兑换相关的API路由
 * 
 * 路由列表：
 * - POST /api/sign-in         - 签到
 * - GET  /api/sign-in/status  - 获取签到状态
 * - GET  /api/sign-in/records - 获取签到记录
 * - GET  /api/points          - 获取积分信息
 * - POST /api/points/exchange - 兑换邀请码
 */

const express = require('express');
const router = express.Router();

const signInController = require('../controllers/sign_in.controller');
const { authMiddleware } = require('../middlewares/auth');

/**
 * 签到
 * @route POST /api/sign-in
 * @permission user
 */
router.post('/', authMiddleware, signInController.signIn);

/**
 * 获取签到状态
 * @route GET /api/sign-in/status
 * @permission user
 */
router.get('/status', authMiddleware, signInController.getStatus);

/**
 * 获取签到记录
 * @route GET /api/sign-in/records
 * @permission user
 */
router.get('/records', authMiddleware, signInController.getRecords);

/**
 * 获取积分信息
 * @route GET /api/points
 * @permission user
 */
router.get('/points', authMiddleware, signInController.getPointsInfo);

/**
 * 兑换邀请码
 * @route POST /api/points/exchange
 * @permission user
 */
router.post('/points/exchange', authMiddleware, signInController.exchangeInviteCode);

module.exports = router;
