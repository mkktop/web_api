/**
 * @fileoverview 签到表模型
 * @description 管理用户签到记录
 * 
 * 表结构说明：
 * - id: 自增主键
 * - user_id: 用户ID
 * - sign_date: 签到日期
 * - points_earned: 获得的积分
 * - continuous_days: 连续签到天数
 * - create_time: 创建时间
 * 
 * 使用场景：
 * - 用户每日签到
 * - 签到记录查询
 * - 连续签到统计
 */

// 引入数据库操作模块
const db = require('./database');

/**
 * 签到模型对象
 * @description 封装所有签到相关的数据库操作
 */
const SignIn = {
  /**
   * 创建签到表
   * @description 如果表不存在则创建
   * 
   * @returns {Promise<void>}
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS sign_in (
        id INT NOT NULL AUTO_INCREMENT COMMENT '签到ID（主键）',
        user_id INT NOT NULL COMMENT '用户ID',
        sign_date DATE NOT NULL COMMENT '签到日期',
        points_earned INT DEFAULT 20 COMMENT '获得的积分',
        continuous_days INT DEFAULT 1 COMMENT '连续签到天数',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY uk_user_date (user_id, sign_date),
        KEY user_id (user_id),
        KEY sign_date (sign_date),
        CONSTRAINT fk_signin_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签到记录表';
    `;
    await db.query(sql);
  },

  /**
   * 签到
   * @description 用户签到，获得积分
   * 
   * @param {number} userId - 用户ID
   * @param {number} points - 获得的积分
   * @param {number} continuousDays - 连续签到天数
   * @returns {Promise<number|null>} 新增记录的ID，如果已签到则返回null
   */
  signIn: async (userId, points, continuousDays) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sql = `
        INSERT INTO sign_in (user_id, sign_date, points_earned, continuous_days)
        VALUES (?, ?, ?, ?)
      `;
      return await db.insert(sql, [userId, today, points, continuousDays]);
    } catch (error) {
      // 唯一键冲突，表示今日已签到
      if (error.code === 'ER_DUP_ENTRY') {
        return null;
      }
      throw error;
    }
  },

  /**
   * 检查今日是否已签到
   * @description 检查用户今日是否已签到
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否已签到
   */
  hasSignedToday: async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const sql = 'SELECT 1 FROM sign_in WHERE user_id = ? AND sign_date = ? LIMIT 1';
    const rows = await db.query(sql, [userId, today]);
    return rows.length > 0;
  },

  /**
   * 获取用户今日签到记录
   * @description 获取用户今日的签到记录
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 签到记录
   */
  getTodayRecord: async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const sql = 'SELECT * FROM sign_in WHERE user_id = ? AND sign_date = ? LIMIT 1';
    const rows = await db.query(sql, [userId, today]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 获取用户最近一次签到记录
   * @description 获取用户最近一次签到记录（用于计算连续签到）
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 签到记录
   */
  getLastSignIn: async (userId) => {
    const sql = `
      SELECT * FROM sign_in 
      WHERE user_id = ? 
      ORDER BY sign_date DESC 
      LIMIT 1
    `;
    const rows = await db.query(sql, [userId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 获取用户签到记录列表
   * @description 获取用户签到记录，支持分页
   * 
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 包含列表和分页信息的对象
   */
  getRecords: async (userId, options = {}) => {
    const { page = 1, pageSize = 30 } = options;
    const offset = (page - 1) * pageSize;
    
    // 查询总数
    const countSql = 'SELECT COUNT(*) as total FROM sign_in WHERE user_id = ?';
    const countRows = await db.query(countSql, [userId]);
    const total = countRows[0].total;
    
    // 查询列表
    const listSql = `
      SELECT * FROM sign_in 
      WHERE user_id = ? 
      ORDER BY sign_date DESC 
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    const list = await db.query(listSql, [userId]);
    
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
   * 获取用户签到统计
   * @description 获取用户签到统计数据
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 统计数据
   */
  getStats: async (userId) => {
    // 总签到天数
    const totalSql = 'SELECT COUNT(*) as count FROM sign_in WHERE user_id = ?';
    const totalRows = await db.query(totalSql, [userId]);
    
    // 总获得积分
    const pointsSql = 'SELECT COALESCE(SUM(points_earned), 0) as total FROM sign_in WHERE user_id = ?';
    const pointsRows = await db.query(pointsSql, [userId]);
    
    // 最长连续签到天数
    const maxContinuousSql = 'SELECT COALESCE(MAX(continuous_days), 0) as max FROM sign_in WHERE user_id = ?';
    const maxRows = await db.query(maxContinuousSql, [userId]);
    
    // 当前连续签到天数
    const lastRecord = await SignIn.getLastSignIn(userId);
    let currentContinuous = 0;
    
    if (lastRecord) {
      const today = new Date();
      const lastDate = new Date(lastRecord.sign_date);
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0 || diffDays === 1) {
        currentContinuous = lastRecord.continuous_days;
      }
    }
    
    return {
      total_days: totalRows[0].count,
      total_points: pointsRows[0].total,
      max_continuous_days: maxRows[0].max,
      current_continuous_days: currentContinuous
    };
  },

  /**
   * 获取本月签到日期
   * @description 获取用户本月的签到日期列表
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 签到日期数组
   */
  getMonthlyDates: async (userId) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;
    
    const sql = `
      SELECT sign_date 
      FROM sign_in 
      WHERE user_id = ? AND sign_date >= ? AND sign_date <= ?
      ORDER BY sign_date ASC
    `;
    const rows = await db.query(sql, [userId, startDate, endDate]);
    return rows.map(row => row.sign_date.toISOString().split('T')[0]);
  }
};

module.exports = SignIn;
