/**
 * @fileoverview 用户权限积分表模型
 * @description 存储用户的权限和积分信息（资源/论坛权限控制）
 * 
 * 表结构说明：
 * - id: 自增主键
 * - user_id: 关联用户ID（唯一）
 * - points: 用户积分
 * - download_limit: 每日下载限制
 * - can_upload: 能否上传（1 可以 / 0 禁止）
 * - can_comment: 能否评论（1 可以 / 0 禁止）
 * 
 * 设计说明：
 * - 与 user 表一对一关系
 * - 用于控制用户的各种权限
 * - 用户注册时自动创建默认值记录
 */

// 引入数据库操作模块
const db = require('./database');

/**
 * 用户权限模型对象
 * @description 封装所有用户权限相关的数据库操作
 */
const UserAuth = {
  /**
   * 创建用户权限表
   * @description 如果表不存在则创建
   * 
   * @returns {Promise<void>}
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS user_auth (
        -- 权限 ID（主键）
        id INT NOT NULL AUTO_INCREMENT COMMENT '权限ID（主键）',
        
        -- 关联用户 ID（唯一）
        user_id INT NOT NULL COMMENT '关联用户ID',
        
        -- 用户积分
        points INT DEFAULT 0 COMMENT '用户积分',
        
        -- 每日下载限制
        download_limit INT DEFAULT 50 COMMENT '每日下载限制',
        
        -- 能否上传：1 可以 0 禁止
        can_upload TINYINT DEFAULT 1 COMMENT '能否上传：1可以 0禁止',
        
        -- 能否评论：1 可以 0 禁止
        can_comment TINYINT DEFAULT 1 COMMENT '能否评论：1可以 0禁止',
        
        -- 主键
        PRIMARY KEY (id),
        
        -- 唯一索引：用户ID唯一
        UNIQUE KEY user_id (user_id),
        
        -- 外键：关联用户表
        CONSTRAINT fk_user_auth_user FOREIGN KEY (user_id) 
          REFERENCES user(id) ON DELETE CASCADE
          
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户权限积分表';
    `;
    await db.query(sql);
  },

  /**
   * 创建用户权限记录
   * @description 为新用户创建权限记录（通常在注册时自动调用）
   * 
   * @param {number} userId - 用户ID
   * @param {Object} authData - 权限信息（可选）
   * @returns {Promise<number>} 新记录的 ID
   * 
   * @example
   * // 创建默认权限
   * const id = await UserAuth.create(1);
   * 
   * // 创建自定义权限
   * const id = await UserAuth.create(1, {
   *   points: 100,
   *   download_limit: 100,
   *   can_upload: 1,
   *   can_comment: 1
   * });
   */
  create: async (userId, authData = {}) => {
    const sql = `
      INSERT INTO user_auth (user_id, points, download_limit, can_upload, can_comment)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      userId,
      authData.points || 0,
      authData.download_limit || 50,
      authData.can_upload !== undefined ? authData.can_upload : 1,
      authData.can_comment !== undefined ? authData.can_comment : 1
    ];
    return await db.insert(sql, params);
  },

  /**
   * 根据用户ID查找权限
   * @description 获取用户的权限信息
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 权限对象，不存在则返回 null
   * 
   * @example
   * const auth = await UserAuth.findByUserId(1);
   * console.log(auth.points);
   */
  findByUserId: async (userId) => {
    const sql = 'SELECT * FROM user_auth WHERE user_id = ?';
    const rows = await db.query(sql, [userId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 根据 ID 查找权限
   * @description 根据权限ID查询
   * 
   * @param {number} id - 权限ID
   * @returns {Promise<Object|null>} 权限对象
   */
  findById: async (id) => {
    const sql = 'SELECT * FROM user_auth WHERE id = ?';
    const rows = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 更新用户权限
   * @description 更新指定用户的权限信息
   * 
   * @param {number} userId - 用户ID
   * @param {Object} updates - 要更新的字段
   * @returns {Promise<number>} 影响的行数
   * 
   * @example
   * await UserAuth.update(1, {
   *   points: 200,
   *   download_limit: 100
   * });
   */
  update: async (userId, updates) => {
    const fields = [];
    const params = [];

    // 动态构建 SET 子句
    if (updates.points !== undefined) {
      fields.push('points = ?');
      params.push(updates.points);
    }
    if (updates.download_limit !== undefined) {
      fields.push('download_limit = ?');
      params.push(updates.download_limit);
    }
    if (updates.can_upload !== undefined) {
      fields.push('can_upload = ?');
      params.push(updates.can_upload);
    }
    if (updates.can_comment !== undefined) {
      fields.push('can_comment = ?');
      params.push(updates.can_comment);
    }

    if (fields.length === 0) {
      return 0;
    }

    params.push(userId);
    const sql = `UPDATE user_auth SET ${fields.join(', ')} WHERE user_id = ?`;
    return await db.update(sql, params);
  },

  /**
   * 增加积分
   * @description 为用户增加积分
   * 
   * @param {number} userId - 用户ID
   * @param {number} amount - 积分数量（正数增加，负数减少）
   * @returns {Promise<number>} 影响的行数
   * 
   * @example
   * // 增加 10 积分
   * await UserAuth.addPoints(1, 10);
   * 
   * // 减少 5 积分
   * await UserAuth.addPoints(1, -5);
   */
  addPoints: async (userId, amount) => {
    const sql = 'UPDATE user_auth SET points = points + ? WHERE user_id = ?';
    return await db.update(sql, [amount, userId]);
  },

  /**
   * 扣除积分
   * @description 扣除用户积分（确保不会变成负数）
   * 
   * @param {number} userId - 用户ID
   * @param {number} amount - 扣除的积分数量
   * @returns {Promise<number>} 影响的行数
   */
  deductPoints: async (userId, amount) => {
    const sql = 'UPDATE user_auth SET points = GREATEST(0, points - ?) WHERE user_id = ?';
    return await db.update(sql, [amount, userId]);
  },

  /**
   * 设置积分
   * @description 直接设置用户的积分值
   * 
   * @param {number} userId - 用户ID
   * @param {number} points - 积分值
   * @returns {Promise<number>} 影响的行数
   */
  setPoints: async (userId, points) => {
    const sql = 'UPDATE user_auth SET points = ? WHERE user_id = ?';
    return await db.update(sql, [points, userId]);
  },

  /**
   * 检查用户是否有足够积分
   * @description 检查用户积分是否足够扣除
   * 
   * @param {number} userId - 用户ID
   * @param {number} requiredPoints - 所需积分
   * @returns {Promise<boolean>} 是否足够
   * 
   * @example
   * const canAfford = await UserAuth.hasEnoughPoints(1, 100);
   * if (canAfford) {
   *   // 扣除积分
   *   await UserAuth.addPoints(1, -100);
   * }
   */
  hasEnoughPoints: async (userId, requiredPoints) => {
    const sql = 'SELECT points FROM user_auth WHERE user_id = ?';
    const rows = await db.query(sql, [userId]);
    if (rows.length === 0) {
      return false;
    }
    return rows[0].points >= requiredPoints;
  },

  /**
   * 检查用户是否有某项权限
   * @description 检查用户是否具有特定权限
   * 
   * @param {number} userId - 用户ID
   * @param {string} permission - 权限名称（upload/comment）
   * @returns {Promise<boolean>} 是否有权限
   * 
   * @example
   * const canUpload = await UserAuth.hasPermission(1, 'upload');
   */
  hasPermission: async (userId, permission) => {
    const permissionMap = {
      'upload': 'can_upload',
      'comment': 'can_comment'
    };
    
    const field = permissionMap[permission];
    if (!field) {
      return false;
    }
    
    const sql = `SELECT ${field} FROM user_auth WHERE user_id = ?`;
    const rows = await db.query(sql, [userId]);
    
    if (rows.length === 0) {
      return false;
    }
    
    return rows[0][field] === 1;
  },

  /**
   * 设置用户权限状态
   * @description 启用或禁用用户的某项权限
   * 
   * @param {number} userId - 用户ID
   * @param {string} permission - 权限名称（upload/comment）
   * @param {boolean} enabled - 是否启用
   * @returns {Promise<number>} 影响的行数
   * 
   * @example
   * // 禁止用户上传
   * await UserAuth.setPermission(1, 'upload', false);
   */
  setPermission: async (userId, permission, enabled) => {
    const permissionMap = {
      'upload': 'can_upload',
      'comment': 'can_comment'
    };
    
    const field = permissionMap[permission];
    if (!field) {
      return 0;
    }
    
    const sql = `UPDATE user_auth SET ${field} = ? WHERE user_id = ?`;
    return await db.update(sql, [enabled ? 1 : 0, userId]);
  },

  /**
   * 删除用户权限记录
   * @description 删除指定用户的权限记录（通常在删除用户时级联删除）
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 影响的行数
   */
  delete: async (userId) => {
    const sql = 'DELETE FROM user_auth WHERE user_id = ?';
    return await db.update(sql, [userId]);
  },

  /**
   * 检查用户权限记录是否存在
   * @description 检查指定用户是否有权限记录
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否存在
   */
  exists: async (userId) => {
    const sql = 'SELECT 1 FROM user_auth WHERE user_id = ? LIMIT 1';
    const rows = await db.query(sql, [userId]);
    return rows.length > 0;
  },

  /**
   * 获取积分排行榜
   * @description 获取积分最高的用户列表
   * 
   * @param {number} limit - 返回数量
   * @returns {Promise<Array>} 用户积分排行数组
   * 
   * @example
   * const topUsers = await UserAuth.getTopUsers(10);
   */
  getTopUsers: async (limit = 10) => {
    const sql = `
      SELECT a.user_id, a.points, u.username, u.nickname, u.avatar
      FROM user_auth a
      LEFT JOIN user u ON a.user_id = u.id
      WHERE u.status = 1
      ORDER BY a.points DESC
      LIMIT ?
    `;
    return await db.query(sql, [limit]);
  },

  /**
   * 批量获取用户权限
   * @description 根据用户ID列表批量获取权限
   * 
   * @param {Array<number>} userIds - 用户ID数组
   * @returns {Promise<Array>} 权限数组
   */
  findByUserIds: async (userIds) => {
    if (!userIds || userIds.length === 0) {
      return [];
    }
    
    const placeholders = userIds.map(() => '?').join(',');
    const sql = `SELECT * FROM user_auth WHERE user_id IN (${placeholders})`;
    return await db.query(sql, userIds);
  }
};

// 导出用户权限模型
module.exports = UserAuth;
