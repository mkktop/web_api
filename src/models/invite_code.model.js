/**
 * @fileoverview 邀请码表模型
 * @description 管理用户注册所需的邀请码
 * 
 * 表结构说明：
 * - id: 自增主键
 * - code: 邀请码（可配置长度，默认32位）
 * - used: 状态（0 未使用 / 1 已使用）
 * - user_id: 绑定的用户ID
 * - create_time: 创建时间
 * - use_time: 使用时间
 * 
 * 邀请码机制说明：
 * - 用户注册必须使用有效的邀请码
 * - 邀请码只能使用一次
 * - 使用后绑定到对应用户
 * - 管理员可批量生成邀请码
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
        id INT NOT NULL AUTO_INCREMENT COMMENT '邀请码ID（主键）',
        code VARCHAR(32) NOT NULL COMMENT '邀请码',
        used TINYINT DEFAULT 0 COMMENT '状态：0未使用 1已使用',
        user_id INT DEFAULT NULL COMMENT '绑定的用户ID',
        created_by INT DEFAULT NULL COMMENT '创建者ID（用户兑换时记录）',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        use_time DATETIME DEFAULT NULL COMMENT '使用时间',
        PRIMARY KEY (id),
        UNIQUE KEY code (code),
        KEY user_id (user_id),
        KEY created_by (created_by),
        KEY used (used)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邀请码表';
    `;
    await db.query(sql);
  },

  /**
   * 生成随机邀请码
   * @description 生成指定长度的随机字符串作为邀请码
   * 
   * @param {number} length - 邀请码长度（8-32位，默认32）
   * @returns {string} 随机邀请码
   * 
   * @example
   * const code = InviteCode.generateCode(16);
   * console.log(code);  // 例如：'a1b2c3d4e5f6g7h8'
   */
  generateCode: (length = 32) => {
    // 限制长度范围：最小8位，最大32位
    const len = Math.max(8, Math.min(32, length));
    // 计算需要的字节数（每个字节转2个十六进制字符）
    const bytes = Math.ceil(len / 2);
    // 生成随机字节并转换为十六进制字符串
    return crypto.randomBytes(bytes).toString('hex').substring(0, len);
  },

  /**
   * 创建单个邀请码
   * @description 生成并插入一条新的邀请码记录
   * 
   * @param {Object} options - 配置选项
   * @param {number} options.length - 邀请码长度（8-32位，默认32）
   * @param {string} options.code - 自定义邀请码（可选）
   * @returns {Promise<Object>} 包含 id 和 code 的对象
   * 
   * @example
   * // 自动生成32位邀请码
   * const result = await InviteCode.create();
   * 
   * // 生成16位邀请码
   * const result = await InviteCode.create({ length: 16 });
   */
  create: async (options = {}) => {
    const { length = 32, code: customCode, created_by = null } = options;
    const inviteCode = customCode || InviteCode.generateCode(length);
    
    const sql = 'INSERT INTO invite_code (code, created_by) VALUES (?, ?)';
    const id = await db.insert(sql, [inviteCode, created_by]);
    
    return { id, code: inviteCode };
  },

  /**
   * 批量创建邀请码
   * @description 一次性生成多个邀请码（管理员专用）
   * 
   * @param {Object} options - 配置选项
   * @param {number} options.count - 生成数量（1-100，默认10）
   * @param {number} options.length - 邀请码长度（8-32位，默认32）
   * @returns {Promise<Array>} 邀请码对象数组
   * 
   * @example
   * // 批量生成10个16位邀请码
   * const codes = await InviteCode.createBatch({ count: 10, length: 16 });
   * console.log(codes);
   * // [{ id: 1, code: 'abc123...' }, { id: 2, code: 'def456...' }, ...]
   */
  createBatch: async (options = {}) => {
    const { count = 10, length = 32 } = options;
    
    // 限制数量范围：最小1个，最大100个
    const actualCount = Math.max(1, Math.min(100, count));
    // 限制长度范围：最小8位，最大32位
    const actualLength = Math.max(8, Math.min(32, length));
    
    const codes = [];
    const results = [];
    
    // 逐个插入邀请码
    for (let i = 0; i < actualCount; i++) {
      const code = InviteCode.generateCode(actualLength);
      codes.push(code);
      
      const sql = 'INSERT INTO invite_code (code) VALUES (?)';
      const id = await db.insert(sql, [code]);
      results.push({ id, code });
    }
    
    return results;
  },

  /**
   * 根据邀请码查找
   * @description 根据邀请码字符串查询记录
   * 
   * @param {string} code - 邀请码
   * @returns {Promise<Object|null>} 邀请码记录，不存在则返回 null
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
   * 查询邀请码列表
   * @description 获取邀请码列表，支持筛选和分页（管理员专用）
   * 
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码（默认1）
   * @param {number} options.pageSize - 每页数量（默认20）
   * @param {string} options.code - 按邀请码模糊搜索
   * @param {number} options.used - 按使用状态筛选（0未使用/1已使用）
   * @returns {Promise<Object>} 包含列表和分页信息的对象
   */
  findAll: async (options = {}) => {
    const { page = 1, pageSize = 20, code, used } = options;
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // 按邀请码模糊搜索
    if (code) {
      whereClause += ' AND ic.code LIKE ?';
      params.push(`%${code}%`);
    }
    
    // 按使用状态筛选
    if (used !== undefined && used !== null && used !== '') {
      whereClause += ' AND ic.used = ?';
      params.push(parseInt(used));
    }
    
    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total 
      FROM invite_code ic 
      ${whereClause}
    `;
    const countRows = await db.query(countSql, params);
    const total = countRows[0].total;
    
    // 查询列表（LIMIT 和 OFFSET 直接拼接到 SQL 中，避免参数类型问题）
    const listSql = `
      SELECT 
        ic.id,
        ic.code,
        ic.used,
        ic.create_time,
        ic.use_time,
        u.id as user_id,
        u.username as username
      FROM invite_code ic 
      LEFT JOIN user u ON ic.user_id = u.id 
      ${whereClause}
      ORDER BY ic.create_time DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    const list = await db.query(listSql, params);
    
    return {
      list,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  },

  /**
   * 统计邀请码数量
   * @description 统计邀请码的总数、已使用、未使用数量
   * 
   * @returns {Promise<Object>} 统计结果
   */
  count: async () => {
    const totalSql = 'SELECT COUNT(*) as count FROM invite_code';
    const totalRows = await db.query(totalSql);
    
    const usedSql = 'SELECT COUNT(*) as count FROM invite_code WHERE used = 1';
    const usedRows = await db.query(usedSql);
    
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
   * @description 根据ID删除邀请码（仅限未使用的）
   * 
   * @param {number} id - 邀请码ID
   * @returns {Promise<number>} 影响的行数
   */
  delete: async (id) => {
    const sql = 'DELETE FROM invite_code WHERE id = ? AND used = 0';
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
  },

  /**
   * 获取用户兑换的邀请码列表
   * @description 查询用户通过积分兑换获得的邀请码
   * 
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 邀请码列表
   */
  getMyCodes: async (userId, options = {}) => {
    const { page = 1, pageSize = 20, used } = options;
    const offset = (page - 1) * pageSize;
    
    let whereClause = 'WHERE created_by = ?';
    const params = [userId];
    
    if (used !== undefined && used !== null && used !== '') {
      whereClause += ' AND used = ?';
      params.push(parseInt(used));
    }
    
    const countSql = `SELECT COUNT(*) as total FROM invite_code ${whereClause}`;
    const countRows = await db.query(countSql, params);
    const total = countRows[0].total;
    
    const listSql = `
      SELECT 
        id,
        code,
        used,
        create_time,
        use_time
      FROM invite_code 
      ${whereClause}
      ORDER BY create_time DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    const list = await db.query(listSql, params);
    
    return {
      list,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
};

module.exports = InviteCode;
