/**
 * @fileoverview 版块分类表模型
 * @description 管理论坛版块分类
 * 
 * 表结构说明：
 * - id: 自增主键
 * - name: 版块名称
 * - description: 版块描述
 * - icon: 版块图标URL
 * - sort_order: 排序（数字越小越靠前）
 * - status: 状态（1启用/0禁用）
 * - create_time: 创建时间
 * - update_time: 更新时间
 * 
 * 使用场景：
 * - 帖子发布时选择版块
 * - 版块列表展示
 * - 版块管理
 */

// 引入数据库操作模块
const db = require('./database');

/**
 * 版块分类模型对象
 * @description 封装所有版块分类相关的数据库操作
 */
const Category = {
  /**
   * 创建版块分类表
   * @description 如果表不存在则创建
   * 
   * @returns {Promise<void>}
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS category (
        id INT NOT NULL AUTO_INCREMENT COMMENT '版块ID（主键）',
        name VARCHAR(50) NOT NULL COMMENT '版块名称',
        description VARCHAR(255) DEFAULT NULL COMMENT '版块描述',
        icon VARCHAR(255) DEFAULT NULL COMMENT '版块图标URL',
        sort_order INT DEFAULT 0 COMMENT '排序（数字越小越靠前）',
        status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY sort_order (sort_order),
        KEY status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='版块分类表';
    `;
    await db.query(sql);
  },

  /**
   * 创建版块
   * @description 新增一个版块分类
   * 
   * @param {Object} data - 版块数据
   * @param {string} data.name - 版块名称
   * @param {string} data.description - 版块描述
   * @param {string} data.icon - 版块图标
   * @param {number} data.sort_order - 排序
   * @returns {Promise<number>} 新增版块的ID
   * 
   * @example
   * const id = await Category.create({
   *   name: '技术交流',
   *   description: '讨论技术问题',
   *   sort_order: 1
   * });
   */
  create: async (data) => {
    const { name, description, icon, sort_order = 0 } = data;
    const sql = `
      INSERT INTO category (name, description, icon, sort_order)
      VALUES (?, ?, ?, ?)
    `;
    return await db.insert(sql, [
      name,
      description || null,
      icon || null,
      sort_order
    ]);
  },

  /**
   * 根据ID查找版块
   * @description 根据ID查询版块信息
   * 
   * @param {number} id - 版块ID
   * @returns {Promise<Object|null>} 版块信息
   */
  findById: async (id) => {
    const sql = 'SELECT * FROM category WHERE id = ?';
    const rows = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 根据名称查找版块
   * @description 根据名称查询版块（检查重名）
   * 
   * @param {string} name - 版块名称
   * @returns {Promise<Object|null>} 版块信息
   */
  findByName: async (name) => {
    const sql = 'SELECT * FROM category WHERE name = ?';
    const rows = await db.query(sql, [name]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 检查版块名称是否存在
   * @description 检查版块名称是否已被使用（排除指定ID）
   * 
   * @param {string} name - 版块名称
   * @param {number} excludeId - 排除的ID（编辑时使用）
   * @returns {Promise<boolean>} 是否存在
   */
  existsByName: async (name, excludeId = null) => {
    let sql = 'SELECT 1 FROM category WHERE name = ?';
    const params = [name];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const rows = await db.query(sql, params);
    return rows.length > 0;
  },

  /**
   * 获取所有版块列表
   * @description 获取所有版块，支持筛选和分页
   * 
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.pageSize - 每页数量
   * @param {number} options.status - 按状态筛选
   * @param {string} options.keyword - 按名称模糊搜索
   * @returns {Promise<Object>} 包含列表和分页信息的对象
   */
  findAll: async (options = {}) => {
    const { page = 1, pageSize = 20, status, keyword } = options;
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // 按状态筛选
    if (status !== undefined && status !== null && status !== '') {
      whereClause += ' AND status = ?';
      params.push(parseInt(status));
    }
    
    // 按名称模糊搜索
    if (keyword) {
      whereClause += ' AND name LIKE ?';
      params.push(`%${keyword}%`);
    }
    
    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM category ${whereClause}`;
    const countRows = await db.query(countSql, params);
    const total = countRows[0].total;
    
    // 查询列表（按排序字段和创建时间排序）
    const listSql = `
      SELECT * FROM category 
      ${whereClause}
      ORDER BY sort_order ASC, create_time ASC
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
   * 获取启用的版块列表
   * @description 获取所有启用的版块（供前端展示用）
   * 
   * @returns {Promise<Array>} 版块列表
   */
  findActive: async () => {
    const sql = `
      SELECT id, name, description, icon 
      FROM category 
      WHERE status = 1 
      ORDER BY sort_order ASC, create_time ASC
    `;
    return await db.query(sql);
  },

  /**
   * 更新版块
   * @description 更新版块信息
   * 
   * @param {number} id - 版块ID
   * @param {Object} data - 更新数据
   * @returns {Promise<number>} 影响的行数
   */
  update: async (id, data) => {
    const fields = [];
    const params = [];
    
    // 动态构建更新字段
    if (data.name !== undefined) {
      fields.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      params.push(data.description);
    }
    if (data.icon !== undefined) {
      fields.push('icon = ?');
      params.push(data.icon);
    }
    if (data.sort_order !== undefined) {
      fields.push('sort_order = ?');
      params.push(data.sort_order);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }
    
    if (fields.length === 0) {
      return 0;
    }
    
    params.push(id);
    const sql = `UPDATE category SET ${fields.join(', ')} WHERE id = ?`;
    return await db.update(sql, params);
  },

  /**
   * 更新版块状态
   * @description 启用/禁用版块
   * 
   * @param {number} id - 版块ID
   * @param {number} status - 状态（1启用/0禁用）
   * @returns {Promise<number>} 影响的行数
   */
  updateStatus: async (id, status) => {
    const sql = 'UPDATE category SET status = ? WHERE id = ?';
    return await db.update(sql, [status, id]);
  },

  /**
   * 删除版块
   * @description 删除版块（需确保版块下无帖子）
   * 
   * @param {number} id - 版块ID
   * @returns {Promise<number>} 影响的行数
   */
  delete: async (id) => {
    const sql = 'DELETE FROM category WHERE id = ?';
    return await db.update(sql, [id]);
  },

  /**
   * 统计版块数量
   * @description 统计版块总数、启用数、禁用数
   * 
   * @returns {Promise<Object>} 统计结果
   */
  count: async () => {
    const totalSql = 'SELECT COUNT(*) as count FROM category';
    const totalRows = await db.query(totalSql);
    
    const activeSql = 'SELECT COUNT(*) as count FROM category WHERE status = 1';
    const activeRows = await db.query(activeSql);
    
    const inactiveSql = 'SELECT COUNT(*) as count FROM category WHERE status = 0';
    const inactiveRows = await db.query(inactiveSql);
    
    return {
      total: totalRows[0].count,
      active: activeRows[0].count,
      inactive: inactiveRows[0].count
    };
  }
};

module.exports = Category;
