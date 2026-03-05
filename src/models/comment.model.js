/**
 * @fileoverview 评论表模型
 * @description 管理论坛评论和回复数据
 * 
 * 表结构说明：
 * - id: 自增主键
 * - post_id: 关联帖子ID
 * - user_id: 评论者ID
 * - content: 评论内容
 * - parent_id: 父评论ID（支持嵌套回复）
 * - reply_to_user_id: 回复的用户ID
 * - status: 状态（1正常/0删除）
 * - create_time: 创建时间
 * - update_time: 更新时间
 * 
 * 使用场景：
 * - 用户发表评论
 * - 用户回复评论
 * - 帖子详情页展示评论列表
 */

// 引入数据库操作模块
const db = require('./database');

/**
 * 评论模型对象
 * @description 封装所有评论相关的数据库操作
 */
const Comment = {
  /**
   * 创建评论表
   * @description 如果表不存在则创建
   * 
   * @returns {Promise<void>}
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS comment (
        id INT NOT NULL AUTO_INCREMENT COMMENT '评论ID（主键）',
        post_id INT NOT NULL COMMENT '帖子ID',
        user_id INT NOT NULL COMMENT '评论者ID',
        content TEXT NOT NULL COMMENT '评论内容',
        parent_id INT DEFAULT NULL COMMENT '父评论ID（回复时使用）',
        reply_to_user_id INT DEFAULT NULL COMMENT '回复的用户ID',
        status TINYINT DEFAULT 1 COMMENT '状态：1正常 0删除',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY post_id (post_id),
        KEY user_id (user_id),
        KEY parent_id (parent_id),
        KEY status (status),
        KEY create_time (create_time),
        CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
        CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comment(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';
    `;
    await db.query(sql);
  },

  /**
   * 创建评论
   * @description 用户发表评论或回复
   * 
   * @param {Object} data - 评论数据
   * @param {number} data.post_id - 帖子ID
   * @param {number} data.user_id - 评论者ID
   * @param {string} data.content - 评论内容
   * @param {number} data.parent_id - 父评论ID（回复时使用）
   * @param {number} data.reply_to_user_id - 回复的用户ID
   * @returns {Promise<number>} 新增评论的ID
   */
  create: async (data) => {
    const { post_id, user_id, content, parent_id, reply_to_user_id } = data;
    const sql = `
      INSERT INTO comment (post_id, user_id, content, parent_id, reply_to_user_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    return await db.insert(sql, [
      post_id,
      user_id,
      content,
      parent_id || null,
      reply_to_user_id || null
    ]);
  },

  /**
   * 根据ID查找评论
   * @description 根据ID查询评论信息
   * 
   * @param {number} id - 评论ID
   * @returns {Promise<Object|null>} 评论信息
   */
  findById: async (id) => {
    const sql = `
      SELECT 
        c.*,
        u.username as author_name,
        u.nickname as author_nickname,
        u.avatar as author_avatar
      FROM comment c
      LEFT JOIN user u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    const rows = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 获取帖子的评论列表
   * @description 获取指定帖子的所有评论，支持分页
   * 
   * @param {number} postId - 帖子ID
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.pageSize - 每页数量
   * @returns {Promise<Object>} 包含列表和分页信息的对象
   */
  findByPostId: async (postId, options = {}) => {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;
    
    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total 
      FROM comment 
      WHERE post_id = ? AND status = 1
    `;
    const countRows = await db.query(countSql, [postId]);
    const total = countRows[0].total;
    
    // 查询评论列表（只查询顶级评论，parent_id 为 null）
    const listSql = `
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_id,
        c.reply_to_user_id,
        c.status,
        c.create_time,
        u.username as author_name,
        u.nickname as author_nickname,
        u.avatar as author_avatar,
        (SELECT COUNT(*) FROM comment r WHERE r.parent_id = c.id AND r.status = 1) as reply_count
      FROM comment c
      LEFT JOIN user u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.parent_id IS NULL AND c.status = 1
      ORDER BY c.create_time ASC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    const list = await db.query(listSql, [postId]);
    
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
   * 获取评论的回复列表
   * @description 获取指定评论的所有回复
   * 
   * @param {number} parentId - 父评论ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 回复列表
   */
  findReplies: async (parentId, options = {}) => {
    const { page = 1, pageSize = 50 } = options;
    const offset = (page - 1) * pageSize;
    
    const sql = `
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_id,
        c.reply_to_user_id,
        c.status,
        c.create_time,
        u.username as author_name,
        u.nickname as author_nickname,
        u.avatar as author_avatar,
        ru.username as reply_to_name,
        ru.nickname as reply_to_nickname
      FROM comment c
      LEFT JOIN user u ON c.user_id = u.id
      LEFT JOIN user ru ON c.reply_to_user_id = ru.id
      WHERE c.parent_id = ? AND c.status = 1
      ORDER BY c.create_time ASC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    return await db.query(sql, [parentId]);
  },

  /**
   * 删除评论（软删除）
   * @description 将评论状态设为已删除
   * 
   * @param {number} id - 评论ID
   * @returns {Promise<number>} 影响的行数
   */
  delete: async (id) => {
    const sql = 'UPDATE comment SET status = 0 WHERE id = ?';
    return await db.update(sql, [id]);
  },

  /**
   * 统计帖子评论数
   * @description 统计指定帖子的评论总数
   * 
   * @param {number} postId - 帖子ID
   * @returns {Promise<number>} 评论数
   */
  countByPostId: async (postId) => {
    const sql = 'SELECT COUNT(*) as count FROM comment WHERE post_id = ? AND status = 1';
    const rows = await db.query(sql, [postId]);
    return rows[0].count;
  },

  /**
   * 统计用户评论数
   * @description 统计指定用户的评论总数
   * 
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 评论数
   */
  countByUserId: async (userId) => {
    const sql = 'SELECT COUNT(*) as count FROM comment WHERE user_id = ? AND status = 1';
    const rows = await db.query(sql, [userId]);
    return rows[0].count;
  },

  /**
   * 获取用户的评论列表
   * @description 获取指定用户发表的所有评论
   * 
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 包含列表和分页信息的对象
   */
  findByUserId: async (userId, options = {}) => {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;
    
    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total 
      FROM comment 
      WHERE user_id = ? AND status = 1
    `;
    const countRows = await db.query(countSql, [userId]);
    const total = countRows[0].total;
    
    // 查询评论列表
    const listSql = `
      SELECT 
        c.id,
        c.post_id,
        c.content,
        c.create_time,
        p.title as post_title
      FROM comment c
      LEFT JOIN post p ON c.post_id = p.id
      WHERE c.user_id = ? AND c.status = 1
      ORDER BY c.create_time DESC
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
   * 检查用户是否是评论作者
   * @description 用于权限验证
   * 
   * @param {number} commentId - 评论ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否是作者
   */
  isAuthor: async (commentId, userId) => {
    const sql = 'SELECT 1 FROM comment WHERE id = ? AND user_id = ? LIMIT 1';
    const rows = await db.query(sql, [commentId, userId]);
    return rows.length > 0;
  },

  /**
   * 批量删除帖子的所有评论
   * @description 帖子删除时级联删除评论
   * 
   * @param {number} postId - 帖子ID
   * @returns {Promise<number>} 影响的行数
   */
  deleteByPostId: async (postId) => {
    const sql = 'UPDATE comment SET status = 0 WHERE post_id = ?';
    return await db.update(sql, [postId]);
  },

  /**
   * 获取所有评论（管理员）
   * @description 管理员查询所有评论，支持筛选和分页
   * 
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 包含列表和分页信息的对象
   */
  findAll: async (options = {}) => {
    const { page = 1, pageSize = 20, post_id, user_id, status } = options;
    const offset = (page - 1) * pageSize;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (post_id) {
      whereClause += ' AND c.post_id = ?';
      params.push(parseInt(post_id));
    }
    
    if (user_id) {
      whereClause += ' AND c.user_id = ?';
      params.push(parseInt(user_id));
    }
    
    if (status !== undefined && status !== null && status !== '') {
      whereClause += ' AND c.status = ?';
      params.push(parseInt(status));
    }
    
    const countSql = `SELECT COUNT(*) as total FROM comment c ${whereClause}`;
    const countRows = await db.query(countSql, params);
    const total = countRows[0].total;
    
    const listSql = `
      SELECT 
        c.*,
        u.username as author_name,
        u.nickname as author_nickname,
        p.title as post_title
      FROM comment c
      LEFT JOIN user u ON c.user_id = u.id
      LEFT JOIN post p ON c.post_id = p.id
      ${whereClause}
      ORDER BY c.create_time DESC
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
   * 统计所有评论数
   * @description 统计所有正常状态的评论总数
   * 
   * @returns {Promise<number>} 评论总数
   */
  countAll: async () => {
    const sql = 'SELECT COUNT(*) as count FROM comment WHERE status = 1';
    const rows = await db.query(sql);
    return rows[0].count;
  },

  /**
   * 按日期统计新评论数
   * @description 统计指定日期之后的新评论数
   * 
   * @param {Date} date - 起始日期
   * @returns {Promise<number>} 新评论数
   */
  countByDate: async (date) => {
    const sql = 'SELECT COUNT(*) as count FROM comment WHERE create_time >= ? AND status = 1';
    const rows = await db.query(sql, [date]);
    return rows[0].count;
  }
};

module.exports = Comment;
