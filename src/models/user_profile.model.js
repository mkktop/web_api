/**
 * @fileoverview 用户资料表模型
 * @description 存储用户的扩展资料信息（论坛/个人主页等）
 * 
 * 表结构说明：
 * - id: 自增主键
 * - user_id: 关联用户ID（唯一）
 * - signature: 个性签名
 * - gender: 性别
 * - birthday: 生日
 * 
 * 设计说明：
 * - 与 user 表一对一关系
 * - 非核心字段，允许为空
 * - 用户注册时自动创建空记录
 */

// 引入数据库操作模块
const db = require('./database');

/**
 * 用户资料模型对象
 * @description 封装所有用户资料相关的数据库操作
 */
const UserProfile = {
  /**
   * 创建用户资料表
   * @description 如果表不存在则创建
   * 
   * @returns {Promise<void>}
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS user_profile (
        -- 资料 ID（主键）
        id INT NOT NULL AUTO_INCREMENT COMMENT '资料ID（主键）',
        
        -- 关联用户 ID（唯一）
        user_id INT NOT NULL COMMENT '关联用户ID',
        
        -- 个性签名
        signature VARCHAR(255) DEFAULT NULL COMMENT '个性签名',
        
        -- 性别
        gender VARCHAR(10) DEFAULT 'unknown' COMMENT '性别',
        
        -- 生日
        birthday DATE DEFAULT NULL COMMENT '生日',
        
        -- 主键
        PRIMARY KEY (id),
        
        -- 唯一索引：用户ID唯一
        UNIQUE KEY user_id (user_id),
        
        -- 外键：关联用户表
        CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) 
          REFERENCES user(id) ON DELETE CASCADE
          
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户资料表';
    `;
    await db.query(sql);
  },

  /**
   * 创建用户资料记录
   * @description 为新用户创建资料记录（通常在注册时自动调用）
   * 
   * @param {number} userId - 用户ID
   * @param {Object} profileData - 资料信息（可选）
   * @returns {Promise<number>} 新记录的 ID
   * 
   * @example
   * // 创建空资料
   * const id = await UserProfile.create(1);
   * 
   * // 创建带初始值的资料
   * const id = await UserProfile.create(1, {
   *   signature: '这是我的签名',
   *   gender: 'male',
   *   birthday: '1990-01-01'
   * });
   */
  create: async (userId, profileData = {}) => {
    const sql = `
      INSERT INTO user_profile (user_id, signature, gender, birthday)
      VALUES (?, ?, ?, ?)
    `;
    const params = [
      userId,
      profileData.signature || null,
      profileData.gender || 'unknown',
      profileData.birthday || null
    ];
    return await db.insert(sql, params);
  },

  /**
   * 根据用户ID查找资料
   * @description 获取用户的扩展资料
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 资料对象，不存在则返回 null
   * 
   * @example
   * const profile = await UserProfile.findByUserId(1);
   * console.log(profile.signature);
   */
  findByUserId: async (userId) => {
    const sql = 'SELECT * FROM user_profile WHERE user_id = ?';
    const rows = await db.query(sql, [userId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 根据 ID 查找资料
   * @description 根据资料ID查询
   * 
   * @param {number} id - 资料ID
   * @returns {Promise<Object|null>} 资料对象
   */
  findById: async (id) => {
    const sql = 'SELECT * FROM user_profile WHERE id = ?';
    const rows = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 更新用户资料
   * @description 更新指定用户的资料信息
   * 
   * @param {number} userId - 用户ID
   * @param {Object} updates - 要更新的字段
   * @returns {Promise<number>} 影响的行数
   * 
   * @example
   * await UserProfile.update(1, {
   *   signature: '新的签名',
   *   gender: 'female',
   *   birthday: '1995-05-15'
   * });
   */
  update: async (userId, updates) => {
    const fields = [];
    const params = [];

    // 动态构建 SET 子句
    if (updates.signature !== undefined) {
      fields.push('signature = ?');
      params.push(updates.signature);
    }
    if (updates.gender !== undefined) {
      fields.push('gender = ?');
      params.push(updates.gender);
    }
    if (updates.birthday !== undefined) {
      fields.push('birthday = ?');
      params.push(updates.birthday);
    }

    if (fields.length === 0) {
      return 0;
    }

    params.push(userId);
    const sql = `UPDATE user_profile SET ${fields.join(', ')} WHERE user_id = ?`;
    return await db.update(sql, params);
  },

  /**
   * 删除用户资料
   * @description 删除指定用户的资料（通常在删除用户时级联删除）
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 影响的行数
   */
  delete: async (userId) => {
    const sql = 'DELETE FROM user_profile WHERE user_id = ?';
    return await db.update(sql, [userId]);
  },

  /**
   * 获取用户完整信息
   * @description 联表查询用户基本信息和资料信息
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 用户完整信息
   * 
   * @example
   * const userInfo = await UserProfile.getFullInfo(1);
   * // 返回包含 user 和 profile 的完整信息
   */
  getFullInfo: async (userId) => {
    const sql = `
      SELECT 
        u.id, u.username, u.email, u.nickname, u.avatar, u.role, u.status,
        u.create_time, u.update_time,
        p.signature, p.gender, p.birthday
      FROM user u
      LEFT JOIN user_profile p ON u.id = p.user_id
      WHERE u.id = ?
    `;
    const rows = await db.query(sql, [userId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 检查用户资料是否存在
   * @description 检查指定用户是否有资料记录
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否存在
   */
  exists: async (userId) => {
    const sql = 'SELECT 1 FROM user_profile WHERE user_id = ? LIMIT 1';
    const rows = await db.query(sql, [userId]);
    return rows.length > 0;
  },

  /**
   * 批量获取用户资料
   * @description 根据用户ID列表批量获取资料
   * 
   * @param {Array<number>} userIds - 用户ID数组
   * @returns {Promise<Array>} 资料数组
   */
  findByUserIds: async (userIds) => {
    if (!userIds || userIds.length === 0) {
      return [];
    }
    
    const placeholders = userIds.map(() => '?').join(',');
    const sql = `SELECT * FROM user_profile WHERE user_id IN (${placeholders})`;
    return await db.query(sql, userIds);
  }
};

// 导出用户资料模型
module.exports = UserProfile;
