/**
 * @fileoverview 用户认证控制器
 * @description 处理用户注册、登录、获取信息等认证相关的请求
 * 
 * 控制器的职责：
 * 1. 接收请求参数
 * 2. 调用模型进行数据操作
 * 3. 返回统一格式的响应
 * 
 * 安全要求：
 * - 所有密码必须 bcrypt 加密
 * - 禁止返回敏感信息（如密码）
 * - 所有数据库操作需加异常捕获
 */

// 引入数据模型
const { User, InviteCode, UserProfile, UserAuth, db } = require('../models');

// 引入 JWT 工具函数
const jwt = require('../utils/jwt');

// 引入响应工具函数
const response = require('../utils/response');

// 引入日志工具
const logger = require('../utils/logger');

// 引入 HTTP 状态码常量
const HttpStatus = require('../config/constants');

/**
 * 用户注册
 * @description 处理用户注册请求，包含完整的注册流程
 * 
 * 注册流程：
 * 1. 校验参数格式
 * 2. 校验邀请码有效性
 * 3. 校验用户名/邮箱唯一性
 * 4. 密码加密
 * 5. 插入 user 表
 * 6. 自动插入 user_profile 表
 * 7. 自动插入 user_auth 表
 * 8. 更新邀请码状态
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.username - 用户名
 * @param {string} req.body.password - 密码
 * @param {string} req.body.email - 邮箱
 * @param {string} req.body.inviteCode - 邀请码
 * @param {Object} res - Express 响应对象
 * 
 * @example
 * // POST /api/register
 * // 请求体：
 * {
 *   "username": "testuser",
 *   "password": "123456",
 *   "email": "test@example.com",
 *   "inviteCode": "abc123..."
 * }
 * 
 * // 成功响应：
 * {
 *   "success": true,
 *   "message": "注册成功",
 *   "data": {}
 * }
 */
const register = async (req, res) => {
  try {
    const { username, password, email, inviteCode } = req.body;
    
    // ==================== 参数校验 ====================
    
    // 检查必填字段
    if (!username || !password || !email || !inviteCode) {
      return response.error(res, '请填写完整的注册信息');
    }
    
    // 校验用户名格式（只允许字母、数字、下划线，3-20位）
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return response.error(res, '用户名格式不正确（3-20位字母、数字或下划线）');
    }
    
    // 校验密码长度
    if (password.length < 6) {
      return response.error(res, '密码长度不能少于6位');
    }
    
    // 校验邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return response.error(res, '邮箱格式不正确');
    }
    
    // ==================== 邀请码校验 ====================
    
    // 检查邀请码是否存在且未使用
    const isValidInviteCode = await InviteCode.isValid(inviteCode);
    if (!isValidInviteCode) {
      return response.error(res, '邀请码无效或已使用');
    }
    
    // ==================== 唯一性校验 ====================
    
    // 检查用户名是否已存在
    const usernameExists = await User.existsByUsername(username);
    if (usernameExists) {
      return response.error(res, '用户名已存在');
    }
    
    // 检查邮箱是否已存在
    const emailExists = await User.existsByEmail(email);
    if (emailExists) {
      return response.error(res, '邮箱已存在');
    }
    
    // ==================== 开始事务 ====================
    // 使用事务确保数据一致性
    // 如果任何一步失败，所有操作都会回滚
    
    const conn = await db.beginTransaction();
    
    try {
      // 1. 插入 user 表（密码会自动加密）
      const sql1 = `
        INSERT INTO user (username, password, email, nickname, role, status)
        VALUES (?, ?, ?, ?, 'user', 1)
      `;
      // 获取 bcrypt 加密后的密码
      const bcrypt = require('bcryptjs');
      const config = require('../config');
      const hashedPassword = await bcrypt.hash(password, config.bcryptSaltRounds);
      
      const [result1] = await conn.execute(sql1, [username, hashedPassword, email, username]);
      const userId = result1.insertId;
      
      // 2. 自动插入 user_profile 表（空值）
      const sql2 = `
        INSERT INTO user_profile (user_id, signature, gender, birthday)
        VALUES (?, NULL, 'unknown', NULL)
      `;
      await conn.execute(sql2, [userId]);
      
      // 3. 自动插入 user_auth 表（默认值）
      const sql3 = `
        INSERT INTO user_auth (user_id, points, download_limit, can_upload, can_comment)
        VALUES (?, 0, 50, 1, 1)
      `;
      await conn.execute(sql3, [userId]);
      
      // 4. 更新邀请码状态
      const sql4 = `
        UPDATE invite_code 
        SET used = 1, user_id = ?, use_time = NOW() 
        WHERE code = ?
      `;
      await conn.execute(sql4, [userId, inviteCode]);
      
      // 提交事务
      await db.commit(conn);
      
      // 记录日志
      logger.info(`用户注册成功: ${username} (ID: ${userId})`);
      
      // 返回成功响应
      return response.success(res, {}, '注册成功');
      
    } catch (error) {
      // 回滚事务
      await db.rollback(conn);
      throw error;
    }
    
  } catch (error) {
    // 记录错误日志
    logger.error('用户注册失败:', error.message);
    
    // 返回错误响应（不暴露具体错误信息）
    return response.error(res, '注册失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 用户登录
 * @description 验证用户名和密码，返回 JWT Token
 * 
 * 登录流程：
 * 1. 校验用户名是否存在
 * 2. bcrypt 比对密码
 * 3. 生成 JWT Token
 * 4. 返回 Token 和用户信息
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.username - 用户名
 * @param {string} req.body.password - 密码
 * @param {Object} res - Express 响应对象
 * 
 * @example
 * // POST /api/login
 * // 请求体：
 * {
 *   "username": "testuser",
 *   "password": "123456"
 * }
 * 
 * // 成功响应：
 * {
 *   "success": true,
 *   "message": "登录成功",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": {
 *       "id": 1,
 *       "username": "testuser",
 *       "nickname": "testuser",
 *       "role": "user"
 *     }
 *   }
 * }
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // ==================== 参数校验 ====================
    
    if (!username || !password) {
      return response.error(res, '请输入用户名和密码');
    }
    
    // ==================== 查找用户 ====================
    
    const user = await User.findByUsername(username);
    
    // 用户不存在
    if (!user) {
      return response.error(res, '用户不存在');
    }
    
    // 检查用户状态
    if (user.status !== 1) {
      return response.error(res, '账号已被禁用');
    }
    
    // ==================== 验证密码 ====================
    
    const isPasswordValid = await User.verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return response.error(res, '密码错误');
    }
    
    // ==================== 生成 Token ====================
    
    const token = jwt.generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });
    
    // ==================== 返回响应 ====================
    
    logger.info(`用户登录成功: ${username} (ID: ${user.id})`);
    
    return response.success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role
      }
    }, '登录成功');
    
  } catch (error) {
    logger.error('用户登录失败:', error.message);
    return response.error(res, '登录失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取当前用户信息
 * @description 获取当前登录用户的完整信息（需要 Token 验证）
 * 
 * 查询流程：
 * 1. 从 req.user 获取用户 ID（由 authMiddleware 注入）
 * 2. 关联查询 user + user_profile + user_auth 表
 * 3. 返回完整用户信息（不含密码）
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.user - 当前登录用户信息（由中间件注入）
 * @param {number} req.user.id - 用户ID
 * @param {Object} res - Express 响应对象
 * 
 * @example
 * // GET /api/user/info
 * // 请求头：Authorization: Bearer <token>
 * 
 * // 成功响应：
 * {
 *   "success": true,
 *   "message": "获取成功",
 *   "data": {
 *     "id": 1,
 *     "username": "testuser",
 *     "email": "test@example.com",
 *     "nickname": "testuser",
 *     "avatar": null,
 *     "role": "user",
 *     "status": 1,
 *     "signature": null,
 *     "gender": "unknown",
 *     "birthday": null,
 *     "points": 0,
 *     "download_limit": 50,
 *     "can_upload": 1,
 *     "can_comment": 1
 *   }
 * }
 */
const getUserInfo = async (req, res) => {
  try {
    // 从中间件注入的 req.user 获取用户 ID
    const userId = req.user.id;
    
    // 关联查询用户完整信息
    const sql = `
      SELECT 
        u.id, u.username, u.email, u.nickname, u.avatar, u.role, u.status,
        u.create_time, u.update_time,
        p.signature, p.gender, p.birthday,
        a.points, a.download_limit, a.can_upload, a.can_comment
      FROM user u
      LEFT JOIN user_profile p ON u.id = p.user_id
      LEFT JOIN user_auth a ON u.id = a.user_id
      WHERE u.id = ?
    `;
    
    const rows = await db.query(sql, [userId]);
    
    if (rows.length === 0) {
      return response.error(res, '用户不存在', HttpStatus.NOT_FOUND);
    }
    
    const userInfo = rows[0];
    
    return response.success(res, userInfo, '获取成功');
    
  } catch (error) {
    logger.error('获取用户信息失败:', error.message);
    return response.error(res, '获取用户信息失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 更新用户资料
 * @description 更新当前用户的资料信息
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.nickname - 昵称
 * @param {string} req.body.signature - 个性签名
 * @param {string} req.body.gender - 性别
 * @param {string} req.body.birthday - 生日
 * @param {Object} res - Express 响应对象
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nickname, signature, gender, birthday } = req.body;
    
    // 更新 user 表的昵称
    if (nickname !== undefined) {
      await User.update(userId, { nickname });
    }
    
    // 更新 user_profile 表
    const profileUpdates = {};
    if (signature !== undefined) profileUpdates.signature = signature;
    if (gender !== undefined) profileUpdates.gender = gender;
    if (birthday !== undefined) profileUpdates.birthday = birthday;
    
    if (Object.keys(profileUpdates).length > 0) {
      await UserProfile.update(userId, profileUpdates);
    }
    
    logger.info(`用户资料更新成功: ID ${userId}`);
    
    return response.success(res, {}, '更新成功');
    
  } catch (error) {
    logger.error('更新用户资料失败:', error.message);
    return response.error(res, '更新失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 修改密码
 * @description 修改当前用户的密码
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.oldPassword - 旧密码
 * @param {string} req.body.newPassword - 新密码
 * @param {Object} res - Express 响应对象
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    
    // 参数校验
    if (!oldPassword || !newPassword) {
      return response.error(res, '请输入旧密码和新密码');
    }
    
    if (newPassword.length < 6) {
      return response.error(res, '新密码长度不能少于6位');
    }
    
    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      return response.error(res, '用户不存在', HttpStatus.NOT_FOUND);
    }
    
    // 获取完整用户信息（含密码）
    const fullUser = await User.findByUsername(user.username);
    
    // 验证旧密码
    const isValid = await User.verifyPassword(oldPassword, fullUser.password);
    if (!isValid) {
      return response.error(res, '旧密码错误');
    }
    
    // 更新密码
    await User.updatePassword(userId, newPassword);
    
    logger.info(`用户密码修改成功: ID ${userId}`);
    
    return response.success(res, {}, '密码修改成功');
    
  } catch (error) {
    logger.error('修改密码失败:', error.message);
    return response.error(res, '修改密码失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取用户公开信息
 * @description 获取用户的公开信息（不需要登录）
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 用户ID
 * @param {Object} res - Express 响应对象
 */
const getPublicInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return response.error(res, '用户不存在', HttpStatus.NOT_FOUND);
    }
    
    const profile = await UserProfile.findByUserId(id);
    const auth = await UserAuth.findByUserId(id);
    
    const publicInfo = {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      avatar: user.avatar,
      role: user.role,
      create_time: user.create_time,
      signature: profile?.signature || null,
      gender: profile?.gender || null,
      birthday: profile?.birthday || null,
      points: auth?.points || 0
    };
    
    return response.success(res, publicInfo, '获取成功');
    
  } catch (error) {
    logger.error('获取用户公开信息失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * 获取用户帖子列表
 * @description 获取用户发布的帖子列表（不需要登录）
 * 
 * @param {Object} req - Express 请求对象
 * @param {Object} req.params - 路由参数
 * @param {number} req.params.id - 用户ID
 * @param {Object} req.query - 查询参数
 * @param {number} req.query.page - 页码
 * @param {number} req.query.pageSize - 每页数量
 * @param {Object} res - Express 响应对象
 */
const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    
    const user = await User.findById(id);
    if (!user) {
      return response.error(res, '用户不存在', HttpStatus.NOT_FOUND);
    }
    
    const Post = require('../models/post.model');
    
    const result = await Post.findAll({
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize) || 20, 50),
      user_id: id,
      status: 1
    });
    
    return response.success(res, result, '获取成功');
    
  } catch (error) {
    logger.error('获取用户帖子失败:', error.message);
    return response.error(res, '获取失败', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

// 导出控制器函数
module.exports = {
  register,
  login,
  getUserInfo,
  updateProfile,
  changePassword,
  getPublicInfo,
  getUserPosts
};
