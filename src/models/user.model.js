/**
 * @fileoverview 用户主表模型
 * @description 用户核心信息表，存储登录凭证和基本账户信息
 * 
 * 表结构说明：
 * - id: 自增主键，用户唯一标识
 * - username: 登录用户名，唯一不可重复
 * - password: 加密密码（使用 bcrypt）
 * - email: 邮箱，用于找回密码，唯一
 * - nickname: 昵称，显示名称
 * - avatar: 头像 URL
 * - role: 角色（user/admin）
 * - status: 状态（1 正常 / 0 禁用）
 * - create_time: 创建时间
 * - update_time: 更新时间
 * 
 * 安全说明：
 * - 密码必须使用 bcrypt 加密存储
 * - 不能存储明文密码
 */

// 引入数据库操作模块
const db = require('./database');

// 引入 bcrypt 用于密码加密
const bcrypt = require('bcryptjs');

// 引入配置
const config = require('../config');

/**
 * 用户模型对象
 * @description 封装所有用户相关的数据库操作
 */
const User = {
  /**
   * 创建用户表
   * @description 如果表不存在则创建
   * 
   * @returns {Promise<void>}
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS user (
        -- 用户唯一 ID（主键）
        id INT NOT NULL AUTO_INCREMENT COMMENT '用户唯一ID（主键）',
        
        -- 登录用户名（不可重复）
        username VARCHAR(50) NOT NULL COMMENT '登录用户名（不可重复）',
        
        -- 加密密码（bcrypt）
        password VARCHAR(100) NOT NULL COMMENT '加密密码（bcrypt）',
        
        -- 邮箱（找回密码）
        email VARCHAR(100) DEFAULT NULL COMMENT '邮箱（找回密码）',
        
        -- 昵称（显示用）
        nickname VARCHAR(50) DEFAULT NULL COMMENT '昵称（显示用）',
        
        -- 头像 URL
        avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
        
        -- 角色（user/admin）
        role VARCHAR(20) DEFAULT 'user' COMMENT '角色（user/admin）',
        
        -- 状态：1 正常 0 禁用
        status TINYINT DEFAULT 1 COMMENT '状态：1正常 0禁用',
        
        -- 创建时间
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        
        -- 更新时间
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        
        -- 主键
        PRIMARY KEY (id),
        
        -- 唯一索引：用户名唯一
        UNIQUE KEY username (username),
        
        -- 唯一索引：邮箱唯一
        UNIQUE KEY email (email)
        
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户主表';
    `;
    await db.query(sql);
  },

  /**
   * 创建新用户
   * @description 插入一条新的用户记录
   * 
   * @param {Object} userData - 用户信息对象
   * @param {string} userData.username - 用户名
   * @param {string} userData.password - 密码（明文，会自动加密）
   * @param {string} userData.email - 邮箱（可选）
   * @param {string} userData.nickname - 昵称（可选）
   * @returns {Promise<number>} 新用户的 ID
   * 
   * @example
   * const userId = await User.create({
   *   username: 'admin',
   *   password: '123456',
   *   email: 'admin@example.com',
   *   nickname: '管理员'
   * });
   */
  create: async (userData) => {
    // 对密码进行 bcrypt 加密
    // config.bcryptSaltRounds 是加密轮数，越大越安全但越慢
    const hashedPassword = await bcrypt.hash(userData.password, config.bcryptSaltRounds);
    
    const sql = `
      INSERT INTO user (username, password, email, nickname, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      userData.username,
      hashedPassword,
      userData.email || null,
      userData.nickname || userData.username,  // 默认昵称为用户名
      userData.role || 'user',
      userData.status !== undefined ? userData.status : 1
    ];
    return await db.insert(sql, params);
  },

  /**
   * 根据 ID 查找用户
   * @description 根据用户ID查询用户详情
   * 
   * @param {number} id - 用户ID
   * @returns {Promise<Object|null>} 用户对象（不含密码），不存在则返回 null
   * 
   * @example
   * const user = await User.findById(1);
   * if (user) {
   *   console.log('用户名:', user.username);
   * }
   */
  findById: async (id) => {
    // 不返回密码字段，保护用户安全
    const sql = 'SELECT id, username, email, nickname, avatar, role, status, create_time, update_time FROM user WHERE id = ?';
    const rows = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 根据用户名查找用户
   * @description 根据用户名查询用户（用于登录验证）
   * 
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户对象（含密码，用于验证），不存在则返回 null
   * 
   * @example
   * const user = await User.findByUsername('admin');
   */
  findByUsername: async (username) => {
    // 登录验证时需要密码字段
    const sql = 'SELECT * FROM user WHERE username = ?';
    const rows = await db.query(sql, [username]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 根据邮箱查找用户
   * @description 根据邮箱查询用户（用于找回密码）
   * 
   * @param {string} email - 邮箱
   * @returns {Promise<Object|null>} 用户对象，不存在则返回 null
   */
  findByEmail: async (email) => {
    const sql = 'SELECT id, username, email, nickname FROM user WHERE email = ?';
    const rows = await db.query(sql, [email]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 查找所有用户
   * @description 获取用户列表（分页）
   * 
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 返回数量限制
   * @param {number} options.offset - 偏移量（用于分页）
   * @param {number} options.status - 按状态筛选
   * @param {string} options.role - 按角色筛选
   * @returns {Promise<Array>} 用户数组
   * 
   * @example
   * // 获取所有正常用户
   * const users = await User.findAll({ status: 1 });
   */
  findAll: async (options = {}) => {
    let sql = 'SELECT id, username, email, nickname, avatar, role, status, create_time, update_time FROM user WHERE 1=1';
    const params = [];

    // 按状态筛选
    if (options.status !== undefined) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    // 按角色筛选
    if (options.role) {
      sql += ' AND role = ?';
      params.push(options.role);
    }

    // 排序：按创建时间倒序
    sql += ' ORDER BY create_time DESC';

    // 分页
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return await db.query(sql, params);
  },

  /**
   * 统计用户数量
   * @description 统计符合条件的用户数量
   * 
   * @param {Object} options - 筛选选项
   * @returns {Promise<number>} 用户数量
   */
  count: async (options = {}) => {
    let sql = 'SELECT COUNT(*) as count FROM user WHERE 1=1';
    const params = [];

    if (options.status !== undefined) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    if (options.role) {
      sql += ' AND role = ?';
      params.push(options.role);
    }

    const rows = await db.query(sql, params);
    return rows[0].count;
  },

  /**
   * 获取用户统计数据
   * @description 获取用户相关的统计数据（用于管理后台）
   * 
   * @returns {Promise<Object>} 用户统计数据
   */
  getStats: async () => {
    // 总用户数
    const totalSql = 'SELECT COUNT(*) as count FROM user';
    const totalRows = await db.query(totalSql);
    
    // 活跃用户数
    const activeSql = 'SELECT COUNT(*) as count FROM user WHERE status = 1';
    const activeRows = await db.query(activeSql);
    
    // 禁用用户数
    const disabledSql = 'SELECT COUNT(*) as count FROM user WHERE status = 0';
    const disabledRows = await db.query(disabledSql);
    
    // 管理员数量
    const adminsSql = 'SELECT COUNT(*) as count FROM user WHERE role = "admin"';
    const adminsRows = await db.query(adminsSql);
    
    return {
      total: totalRows[0].count,
      active: activeRows[0].count,
      disabled: disabledRows[0].count,
      admins: adminsRows[0].count
    };
  },

  /**
   * 更新用户信息
   * @description 更新指定用户的信息
   * 
   * @param {number} id - 用户ID
   * @param {Object} updates - 要更新的字段
   * @returns {Promise<number>} 影响的行数
   * 
   * @example
   * await User.update(1, {
   *   nickname: '新昵称',
   *   avatar: 'http://example.com/avatar.jpg'
   * });
   */
  update: async (id, updates) => {
    const fields = [];
    const params = [];

    // 动态构建 SET 子句
    if (updates.nickname !== undefined) {
      fields.push('nickname = ?');
      params.push(updates.nickname);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      params.push(updates.email);
    }
    if (updates.avatar !== undefined) {
      fields.push('avatar = ?');
      params.push(updates.avatar);
    }
    if (updates.role !== undefined) {
      fields.push('role = ?');
      params.push(updates.role);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }

    if (fields.length === 0) {
      return 0;
    }

    params.push(id);
    const sql = `UPDATE user SET ${fields.join(', ')} WHERE id = ?`;
    return await db.update(sql, params);
  },

  /**
   * 更新密码
   * @description 更新用户密码
   * 
   * @param {number} id - 用户ID
   * @param {string} newPassword - 新密码（明文，会自动加密）
   * @returns {Promise<number>} 影响的行数
   */
  updatePassword: async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSaltRounds);
    const sql = 'UPDATE user SET password = ? WHERE id = ?';
    return await db.update(sql, [hashedPassword, id]);
  },

  /**
   * 验证密码
   * @description 验证用户密码是否正确
   * 
   * @param {string} plainPassword - 明文密码
   * @param {string} hashedPassword - 加密后的密码
   * @returns {Promise<boolean>} 密码是否正确
   * 
   * @example
   * const user = await User.findByUsername('admin');
   * const isValid = await User.verifyPassword('123456', user.password);
   */
  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * 删除用户
   * @description 根据ID删除用户（软删除：设置 status = 0）
   * 
   * @param {number} id - 用户ID
   * @returns {Promise<number>} 影响的行数
   */
  delete: async (id) => {
    // 软删除：只修改状态，不真正删除数据
    const sql = 'UPDATE user SET status = 0 WHERE id = ?';
    return await db.update(sql, [id]);
  },

  /**
   * 检查用户名是否存在
   * @description 检查用户名是否已被使用
   * 
   * @param {string} username - 用户名
   * @returns {Promise<boolean>} 是否存在
   */
  existsByUsername: async (username) => {
    const sql = 'SELECT 1 FROM user WHERE username = ? LIMIT 1';
    const rows = await db.query(sql, [username]);
    return rows.length > 0;
  },

  /**
   * 检查邮箱是否存在
   * @description 检查邮箱是否已被使用
   * 
   * @param {string} email - 邮箱
   * @returns {Promise<boolean>} 是否存在
   */
  existsByEmail: async (email) => {
    const sql = 'SELECT 1 FROM user WHERE email = ? LIMIT 1';
    const rows = await db.query(sql, [email]);
    return rows.length > 0;
  },

  /**
   * 更新用户状态
   * @description 管理员启用/禁用用户
   * 
   * @param {number} id - 用户ID
   * @param {number} status - 状态（1启用/0禁用）
   * @returns {Promise<number>} 影响的行数
   */
  updateStatus: async (id, status) => {
    const sql = 'UPDATE user SET status = ? WHERE id = ?';
    return await db.update(sql, [status, id]);
  },

  /**
   * 更新用户角色
   * @description 管理员设置用户角色
   * 
   * @param {number} id - 用户ID
   * @param {string} role - 角色（user/admin）
   * @returns {Promise<number>} 影响的行数
   */
  updateRole: async (id, role) => {
    const sql = 'UPDATE user SET role = ? WHERE id = ?';
    return await db.update(sql, [role, id]);
  },

  /**
   * 按日期统计新用户数
   * @description 统计指定日期之后的新用户数
   * 
   * @param {Date} date - 起始日期
   * @returns {Promise<number>} 新用户数
   */
  countByDate: async (date) => {
    const sql = 'SELECT COUNT(*) as count FROM user WHERE create_time >= ?';
    const rows = await db.query(sql, [date]);
    return rows[0].count;
  }
};

// 导出用户模型
module.exports = User;
