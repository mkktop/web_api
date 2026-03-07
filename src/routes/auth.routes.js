/**
 * @fileoverview 认证路由
 * @description 用户注册、登录、信息获取等路由
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth');

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
 * @param {string} avatar.body - 头像URL
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
 * @returns {object} 401 - 未登录或 Token 过期
 */
router.put('/user/password', authMiddleware, authController.changePassword);

/**
 * 获取用户公开信息
 * @route GET /users/:id
 * @group 用户 - 用户信息相关接口
 * @param {number} id.path.required - 用户ID
 * @returns {object} 200 - 用户公开信息
 * @returns {object} 404 - 用户不存在
 */
router.get('/users/:id', authController.getPublicInfo);

/**
 * 获取用户帖子列表
 * @route GET /users/:id/posts
 * @group 用户 - 用户信息相关接口
 * @param {number} id.path.required - 用户ID
 * @param {number} page.query - 页码
 * @param {number} pageSize.query - 每页数量
 * @returns {object} 200 - 帖子列表
 * @returns {object} 404 - 用户不存在
 */
router.get('/users/:id/posts', authController.getUserPosts);

module.exports = router;
