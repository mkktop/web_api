/**
 * @fileoverview 邀请码表模型
 * @description 管理用户注册所需的邀请码
 * 
 * 表结构说明：
 * - id: 自增主键
 * - code: 邀请码（32位随机字符串）
 * - used: 状态（0 未使用 / 1 已使用）
 * - user_id: 绑定的用户ID
 * - create_time: 创建时间
 * - use_time: 使用时间
 * 
 * 邀请码机制说明：
 * - 用户注册必须使用有效的邀请码
 * - 邀请码只能使用一次
 * - 使用后绑定到对应用户
 * 
 * 使用场景：
 * - 控制用户注册
 * - 追踪用户来源
 * - 防止恶意注册
 */

// 引入数据库操作模块
const db = require('./database');

// 引入加密模块（用于生成随机邀请码）
const crypto = require('crypto');

/**
 * 邀请码模型对象
 * @description 封装所有邀请码相关的数据库操作
 */
const InviteCode = {
  /**
   * 创建邀请码表
   * @description 如果表不存在则创建
   * 
   * @returns {Promise<void>}
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS invite_code (
        -- 邀请码 ID（主键）
        id INT NOT NULL AUTO_INCREMENT COMMENT '邀请码ID（主键）',
        
        -- 邀请码（32位随机字符串）
        code VARCHAR(32) NOT NULL COMMENT '邀请码（32位随机字符串）',
        
        -- 状态：0 未使用 1 已使用
        used TINYINT DEFAULT 0 COMMENT '状态：0未使用 1已使用',
        
        -- 绑定的用户 ID
        user_id INT DEFAULT NULL COMMENT '绑定的用户ID',
        
        -- 创建时间
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        
        -- 使用时间
        use_time DATETIME DEFAULT NULL COMMENT '使用时间',
        
        -- 主键
        PRIMARY KEY (id),
        
        -- 唯一索引：邀请码唯一
        UNIQUE KEY code (code),
        
        -- 索引：用户ID
        KEY user_id (user_id)
        
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邀请码表';
    `;
    await db.query(sql);
  },

  /**
   * 生成随机邀请码
   * @description 生成一个32位的随机字符串作为邀请码
   * 
   * @returns {string} 32位随机邀请码
   * 
   * @example
   * const code = InviteCode.generateCode();
   * console.log(code);  // 例如：'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
   */
  generateCode: () => {
    // 使用 crypto.randomBytes 生成安全的随机字节
    // 16 字节 = 32 个十六进制字符
    return crypto.randomBytes(16).toString('hex');
  },

  /**
   * 创建新邀请码
   * @description 生成并插入一条新的邀请码记录
   * 
   * @param {string} code - 自定义邀请码（可选，不传则自动生成）
   * @returns {Promise<Object>} 包含 id 和 code 的对象
   * 
   * @example
   * // 自动生成邀请码
   * const result = await InviteCode.create();
   * console.log(result.code);  // 邀请码字符串
   * 
   * // 使用自定义邀请码
   * const result = await InviteCode.create('CUSTOM_CODE_123');
   */
  create: async (code = null) => {
    // 如果没有传入邀请码，则自动生成
    const inviteCode = code || InviteCode.generateCode();
    
    const sql = 'INSERT INTO invite_code (code) VALUES (?)';
    const id = await db.insert(sql, [inviteCode]);
    
    return { id, code: inviteCode };
  },

  /**
   * 批量创建邀请码
   * @description 一次性生成多个邀请码
   * 
   * @param {number} count - 要生成的数量
   * @returns {Promise<Array>} 邀请码数组
   * 
   * @example
   * const codes = await InviteCode.createBatch(10);
   * console.log(codes);  // ['code1', 'code2', ...]
   */
  createBatch: async (count) => {
    const codes = [];
    const sql = 'INSERT INTO invite_code (code) VALUES ?';
    const values = [];
    
    for (let i = 0; i < count; i++) {
      const code = InviteCode.generateCode();
      codes.push(code);
      values.push([code]);
    }
    
    await db.query(sql, [values]);
    return codes;
  },

  /**
   * 根据邀请码查找
   * @description 根据邀请码字符串查询记录
   * 
   * @param {string} code - 邀请码
   * @returns {Promise<Object|null>} 邀请码记录，不存在则返回 null
   * 
   * @example
   * const invite = await InviteCode.findByCode('abc123...');
   */
  findByCode: async (code) => {
    const sql = 'SELECT * FROM invite_code WHERE code = ?';
    const rows = await db.query(sql, [code]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 根据 ID 查找
   * @description 根据ID查询邀请码记录
   * 
   * @param {number} id - 邀请码ID
   * @returns {Promise<Object|null>} 邀请码记录
   */
  findById: async (id) => {
    const sql = 'SELECT * FROM invite_code WHERE id = ?';
    const rows = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 验证邀请码是否有效
   * @description 检查邀请码是否存在且未被使用
   * 
   * @param {string} code - 邀请码
   * @returns {Promise<boolean>} 是否有效
   * 
   * @example
   * const isValid = await InviteCode.isValid('abc123...');
   * if (isValid) {
   *   // 允许注册
   * }
   */
  isValid: async (code) => {
    const sql = 'SELECT 1 FROM invite_code WHERE code = ? AND used = 0 LIMIT 1';
    const rows = await db.query(sql, [code]);
    return rows.length > 0;
  },

  /**
   * 使用邀请码
   * @description 标记邀请码为已使用，并绑定到用户
   * 
   * @param {string} code - 邀请码
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 影响的行数
   * 
   * @example
   * const affected = await InviteCode.use('abc123...', 1);
   * if (affected > 0) {
   *   console.log('邀请码使用成功');
   * }
   */
  use: async (code, userId) => {
    const sql = `
      UPDATE invite_code 
      SET used = 1, 
          user_id = ?, 
          use_time = NOW() 
      WHERE code = ? AND used = 0
    `;
    return await db.update(sql, [userId, code]);
  },

  /**
   * 查找所有邀请码
   * @description 获取邀请码列表（分页）
   * 
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 返回数量限制
   * @param {number} options.offset - 偏移量
   * @param {number} options.used - 按使用状态筛选
   * @returns {Promise<Array>} 邀请码数组
   */
  findAll: async (options = {}) => {
    let sql = `
      SELECT ic.*, u.username 
      FROM invite_code ic 
      LEFT JOIN user u ON ic.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    // 按使用状态筛选
    if (options.used !== undefined) {
      sql += ' AND ic.used = ?';
      params.push(options.used);
    }

    // 排序：按创建时间倒序
    sql += ' ORDER BY ic.create_time DESC';

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
   * 统计邀请码数量
   * @description 统计符合条件的邀请码数量
   * 
   * @param {Object} options - 筛选选项
   * @returns {Promise<Object>} 包含总数、已使用、未使用的统计
   */
  count: async (options = {}) => {
    // 获取总数
    const totalSql = 'SELECT COUNT(*) as count FROM invite_code';
    const totalRows = await db.query(totalSql);
    
    // 获取已使用数量
    const usedSql = 'SELECT COUNT(*) as count FROM invite_code WHERE used = 1';
    const usedRows = await db.query(usedSql);
    
    // 获取未使用数量
    const unusedSql = 'SELECT COUNT(*) as count FROM invite_code WHERE used = 0';
    const unusedRows = await db.query(unusedSql);
    
    return {
      total: totalRows[0].count,
      used: usedRows[0].count,
      unused: unusedRows[0].count
    };
  },

  /**
   * 删除邀请码
   * @description 根据ID删除邀请码
   * 
   * @param {number} id - 邀请码ID
   * @returns {Promise<number>} 影响的行数
   */
  delete: async (id) => {
    const sql = 'DELETE FROM invite_code WHERE id = ?';
    return await db.update(sql, [id]);
  },

  /**
   * 删除未使用的过期邀请码
   * @description 删除超过指定天数未使用的邀请码
   * 
   * @param {number} days - 天数
   * @returns {Promise<number>} 删除的数量
   */
  deleteExpired: async (days = 30) => {
    const sql = `
      DELETE FROM invite_code 
      WHERE used = 0 
      AND create_time < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    return await db.update(sql, [days]);
  },

  /**
   * 根据用户ID查找邀请码
   * @description 查找用户使用的邀请码记录
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 邀请码记录
   */
  findByUserId: async (userId) => {
    const sql = 'SELECT * FROM invite_code WHERE user_id = ? LIMIT 1';
    const rows = await db.query(sql, [userId]);
    return rows.length > 0 ? rows[0] : null;
  }
};

// 导出邀请码模型
module.exports = InviteCode;
