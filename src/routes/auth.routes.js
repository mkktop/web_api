/**
 * @fileoverview 认证相关路由
 * @description 定义用户注册、登录、获取信息等认证相关的路由
 * 
 * 路由列表：
 * - POST /register     - 用户注册
 * - POST /login        - 用户登录
 * - GET  /user/info    - 获取当前用户信息（需要认证）
 * - PUT  /user/profile - 更新用户资料（需要认证）
 * - PUT  /user/password - 修改密码（需要认证）
 */

// 引入 Express 框架
const express = require('express');

// 创建路由器实例
const router = express.Router();

// 引入控制器
const authController = require('../controllers/auth.controller');

// 引入认证中间件
const { authMiddleware } = require('../middlewares/auth');

/**
 * 用户注册
 * @route POST /register
 * @group 认证 - 用户认证相关接口
 * @param {string} username.body.required - 用户名（3-20位字母、数字或下划线）
 * @param {string} password.body.required - 密码（至少6位）
 * @param {string} email.body.required - 邮箱
 * @param {string} inviteCode.body.required - 邀请码
 * @returns {object} 200 - 注册成功
 * @returns {object} 400 - 参数错误或邀请码无效
 */
router.post('/register', authController.register);

/**
 * 用户登录
 * @route POST /login
 * @group 认证 - 用户认证相关接口
 * @param {string} username.body.required - 用户名
 * @param {string} password.body.required - 密码
 * @returns {object} 200 - 登录成功，返回 Token 和用户信息
 * @returns {object} 400 - 用户名或密码错误
 */
router.post('/login', authController.login);

/**
 * 获取当前用户信息
 * @route GET /user/info
 * @group 用户 - 用户信息相关接口
 * @security JWT
 * @returns {object} 200 - 用户完整信息
 * @returns {object} 401 - 未登录或 Token 过期
 */
router.get('/user/info', authMiddleware, authController.getUserInfo);

/**
 * 更新用户资料
 * @route PUT /user/profile
 * @group 用户 - 用户信息相关接口
 * @security JWT
 * @param {string} nickname.body - 昵称
 * @param {string} signature.body - 个性签名
 * @param {string} gender.body - 性别
 * @param {string} birthday.body - 生日
 * @returns {object} 200 - 更新成功
 * @returns {object} 401 - 未登录或 Token 过期
 */
router.put('/user/profile', authMiddleware, authController.updateProfile);

/**
 * 修改密码
 * @route PUT /user/password
 * @group 用户 - 用户信息相关接口
 * @security JWT
 * @param {string} oldPassword.body.required - 旧密码
 * @param {string} newPassword.body.required - 新密码（至少6位）
 * @returns {object} 200 - 密码修改成功
 * @returns {object} 400 - 旧密码错误或参数错误
 * @returns {object} 401 - 未登录或 Token 过期
 */
router.put('/user/password', authMiddleware, authController.changePassword);

// 导出路由器
module.exports = router;
