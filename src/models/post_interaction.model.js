/**
 * @fileoverview 点赞收藏模型
 * @description 管理帖子点赞和收藏数据
 * 
 * 表结构说明：
 * 
 * post_like (点赞表):
 * - id: 自增主键
 * - post_id: 帖子ID
 * - user_id: 用户ID
 * - create_time: 创建时间
 * 
 * post_favorite (收藏表):
 * - id: 自增主键
 * - post_id: 帖子ID
 * - user_id: 用户ID
 * - create_time: 创建时间
 * 
 * 使用场景：
 * - 用户点赞帖子
 * - 用户收藏帖子
 * - 查询用户点赞/收藏的帖子列表
 */

// 引入数据库操作模块
const db = require('./database');

/**
 * 点赞收藏模型对象
 * @description 封装所有点赞收藏相关的数据库操作
 */
const PostInteraction = {
  /**
   * 创建点赞表和收藏表
   * @description 如果表不存在则创建
   * 
   * @returns {Promise<void>}
   */
  createTables: async () => {
    // 创建点赞表
    const likeSql = `
      CREATE TABLE IF NOT EXISTS post_like (
        id INT NOT NULL AUTO_INCREMENT COMMENT '点赞ID（主键）',
        post_id INT NOT NULL COMMENT '帖子ID',
        user_id INT NOT NULL COMMENT '用户ID',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
        PRIMARY KEY (id),
        UNIQUE KEY uk_post_user (post_id, user_id),
        KEY user_id (user_id),
        KEY create_time (create_time),
        CONSTRAINT fk_like_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
        CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子点赞表';
    `;
    await db.query(likeSql);
    
    // 创建收藏表
    const favoriteSql = `
      CREATE TABLE IF NOT EXISTS post_favorite (
        id INT NOT NULL AUTO_INCREMENT COMMENT '收藏ID（主键）',
        post_id INT NOT NULL COMMENT '帖子ID',
        user_id INT NOT NULL COMMENT '用户ID',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
        PRIMARY KEY (id),
        UNIQUE KEY uk_post_user (post_id, user_id),
        KEY user_id (user_id),
        KEY create_time (create_time),
        CONSTRAINT fk_favorite_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
        CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子收藏表';
    `;
    await db.query(favoriteSql);
  },

  // ==================== 点赞相关方法 ====================

  /**
   * 点赞帖子
   * @description 用户点赞帖子
   * 
   * @param {number} postId - 帖子ID
   * @param {number} userId - 用户ID
   * @returns {Promise<number|null>} 新增记录的ID，如果已点赞则返回null
   */
  addLike: async (postId, userId) => {
    try {
      const sql = `
        INSERT INTO post_like (post_id, user_id)
        VALUES (?, ?)
      `;
      return await db.insert(sql, [postId, userId]);
    } catch (error) {
      // 唯一键冲突，表示已点赞
      if (error.code === 'ER_DUP_ENTRY') {
        return null;
      }
      throw error;
    }
  },

  /**
   * 取消点赞
   * @description 用户取消点赞
   * 
   * @param {number} postId - 帖子ID
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 影响的行数
   */
  removeLike: async (postId, userId) => {
    const sql = 'DELETE FROM post_like WHERE post_id = ? AND user_id = ?';
    return await db.update(sql, [postId, userId]);
  },

  /**
   * 检查用户是否已点赞
   * @description 检查用户是否已点赞指定帖子
   * 
   * @param {number} postId - 帖子ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否已点赞
   */
  hasLiked: async (postId, userId) => {
    const sql = 'SELECT 1 FROM post_like WHERE post_id = ? AND user_id = ? LIMIT 1';
    const rows = await db.query(sql, [postId, userId]);
    return rows.length > 0;
  },

  /**
   * 获取用户点赞的帖子列表
   * @description 获取用户点赞的所有帖子
   * 
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 包含列表和分页信息的对象
   */
  getUserLikes: async (userId, options = {}) => {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;
    
    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total 
      FROM post_like pl
      INNER JOIN post p ON pl.post_id = p.id
      WHERE pl.user_id = ? AND p.status = 1
    `;
    const countRows = await db.query(countSql, [userId]);
    const total = countRows[0].total;
    
    // 查询列表
    const listSql = `
      SELECT 
        p.id,
        p.title,
        p.content,
        p.user_id,
        p.category_id,
        p.views,
        p.likes,
        p.comments,
        p.is_pinned,
        p.is_highlighted,
        p.create_time,
        u.username as author_name,
        u.nickname as author_nickname,
        c.name as category_name,
        pl.create_time as liked_time
      FROM post_like pl
      INNER JOIN post p ON pl.post_id = p.id
      LEFT JOIN user u ON p.user_id = u.id
      LEFT JOIN category c ON p.category_id = c.id
      WHERE pl.user_id = ? AND p.status = 1
      ORDER BY pl.create_time DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    const list = await db.query(listSql, [userId]);
    
    // 添加摘要
    list.forEach(post => {
      if (post.content && post.content.length > 200) {
        post.summary = post.content.substring(0, 200) + '...';
      } else {
        post.summary = post.content;
      }
      delete post.content;
    });
    
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

  // ==================== 收藏相关方法 ====================

  /**
   * 收藏帖子
   * @description 用户收藏帖子
   * 
   * @param {number} postId - 帖子ID
   * @param {number} userId - 用户ID
   * @returns {Promise<number|null>} 新增记录的ID，如果已收藏则返回null
   */
  addFavorite: async (postId, userId) => {
    try {
      const sql = `
        INSERT INTO post_favorite (post_id, user_id)
        VALUES (?, ?)
      `;
      return await db.insert(sql, [postId, userId]);
    } catch (error) {
      // 唯一键冲突，表示已收藏
      if (error.code === 'ER_DUP_ENTRY') {
        return null;
      }
      throw error;
    }
  },

  /**
   * 取消收藏
   * @description 用户取消收藏
   * 
   * @param {number} postId - 帖子ID
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 影响的行数
   */
  removeFavorite: async (postId, userId) => {
    const sql = 'DELETE FROM post_favorite WHERE post_id = ? AND user_id = ?';
    return await db.update(sql, [postId, userId]);
  },

  /**
   * 检查用户是否已收藏
   * @description 检查用户是否已收藏指定帖子
   * 
   * @param {number} postId - 帖子ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否已收藏
   */
  hasFavorited: async (postId, userId) => {
    const sql = 'SELECT 1 FROM post_favorite WHERE post_id = ? AND user_id = ? LIMIT 1';
    const rows = await db.query(sql, [postId, userId]);
    return rows.length > 0;
  },

  /**
   * 获取用户收藏的帖子列表
   * @description 获取用户收藏的所有帖子
   * 
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 包含列表和分页信息的对象
   */
  getUserFavorites: async (userId, options = {}) => {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;
    
    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total 
      FROM post_favorite pf
      INNER JOIN post p ON pf.post_id = p.id
      WHERE pf.user_id = ? AND p.status = 1
    `;
    const countRows = await db.query(countSql, [userId]);
    const total = countRows[0].total;
    
    // 查询列表
    const listSql = `
      SELECT 
        p.id,
        p.title,
        p.content,
        p.user_id,
        p.category_id,
        p.views,
        p.likes,
        p.comments,
        p.is_pinned,
        p.is_highlighted,
        p.create_time,
        u.username as author_name,
        u.nickname as author_nickname,
        c.name as category_name,
        pf.create_time as favorited_time
      FROM post_favorite pf
      INNER JOIN post p ON pf.post_id = p.id
      LEFT JOIN user u ON p.user_id = u.id
      LEFT JOIN category c ON p.category_id = c.id
      WHERE pf.user_id = ? AND p.status = 1
      ORDER BY pf.create_time DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    const list = await db.query(listSql, [userId]);
    
    // 添加摘要
    list.forEach(post => {
      if (post.content && post.content.length > 200) {
        post.summary = post.content.substring(0, 200) + '...';
      } else {
        post.summary = post.content;
      }
      delete post.content;
    });
    
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

  // ==================== 统计方法 ====================

  /**
   * 统计帖子点赞数
   * @description 统计指定帖子的点赞总数
   * 
   * @param {number} postId - 帖子ID
   * @returns {Promise<number>} 点赞数
   */
  countLikes: async (postId) => {
    const sql = 'SELECT COUNT(*) as count FROM post_like WHERE post_id = ?';
    const rows = await db.query(sql, [postId]);
    return rows[0].count;
  },

  /**
   * 统计帖子收藏数
   * @description 统计指定帖子的收藏总数
   * 
   * @param {number} postId - 帖子ID
   * @returns {Promise<number>} 收藏数
   */
  countFavorites: async (postId) => {
    const sql = 'SELECT COUNT(*) as count FROM post_favorite WHERE post_id = ?';
    const rows = await db.query(sql, [postId]);
    return rows[0].count;
  },

  /**
   * 批量获取帖子的点赞状态
   * @description 批量检查用户对多个帖子的点赞状态
   * 
   * @param {Array<number>} postIds - 帖子ID数组
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 帖子ID -> 是否点赞的映射
   */
  batchCheckLiked: async (postIds, userId) => {
    if (!postIds || postIds.length === 0) return {};
    
    const placeholders = postIds.map(() => '?').join(',');
    const sql = `
      SELECT post_id 
      FROM post_like 
      WHERE user_id = ? AND post_id IN (${placeholders})
    `;
    const rows = await db.query(sql, [userId, ...postIds]);
    
    const result = {};
    postIds.forEach(id => {
      result[id] = false;
    });
    rows.forEach(row => {
      result[row.post_id] = true;
    });
    
    return result;
  },

  /**
   * 批量获取帖子的收藏状态
   * @description 批量检查用户对多个帖子的收藏状态
   * 
   * @param {Array<number>} postIds - 帖子ID数组
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 帖子ID -> 是否收藏的映射
   */
  batchCheckFavorited: async (postIds, userId) => {
    if (!postIds || postIds.length === 0) return {};
    
    const placeholders = postIds.map(() => '?').join(',');
    const sql = `
      SELECT post_id 
      FROM post_favorite 
      WHERE user_id = ? AND post_id IN (${placeholders})
    `;
    const rows = await db.query(sql, [userId, ...postIds]);
    
    const result = {};
    postIds.forEach(id => {
      result[id] = false;
    });
    rows.forEach(row => {
      result[row.post_id] = true;
    });
    
    return result;
  }
};

module.exports = PostInteraction;
