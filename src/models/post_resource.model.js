/**
 * @fileoverview 帖子资源模型
 * @description 管理帖子资源下载和积分兑换
 * 
 * 表结构说明：
 * 
 * post_resource (帖子资源表):
 * - id: 自增主键
 * - post_id: 帖子ID
 * - download_link: 下载链接
 * - price: 兑换价格（积分）
 * - download_count: 下载次数
 * 
 * resource_purchase (兑换记录表):
 * - id: 自增主键
 * - resource_id: 资源ID
 * - user_id: 购买者ID
 * - points_cost: 消耗积分
 * - author_earnings: 作者收益
 */

const db = require('./database');

const PostResource = {
  /**
   * 创建资源表和兑换记录表
   */
  createTables: async () => {
    const resourceSql = `
      CREATE TABLE IF NOT EXISTS post_resource (
        id INT NOT NULL AUTO_INCREMENT COMMENT '资源ID（主键）',
        post_id INT NOT NULL COMMENT '帖子ID',
        download_link VARCHAR(500) NOT NULL COMMENT '下载链接',
        price INT DEFAULT 50 COMMENT '兑换价格（积分）',
        download_count INT DEFAULT 0 COMMENT '下载次数',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (id),
        UNIQUE KEY uk_post (post_id),
        KEY price (price),
        CONSTRAINT fk_resource_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子资源表';
    `;
    await db.query(resourceSql);
    
    const purchaseSql = `
      CREATE TABLE IF NOT EXISTS resource_purchase (
        id INT NOT NULL AUTO_INCREMENT COMMENT '兑换ID（主键）',
        resource_id INT NOT NULL COMMENT '资源ID',
        user_id INT NOT NULL COMMENT '购买者ID',
        points_cost INT NOT NULL COMMENT '消耗积分',
        author_earnings INT NOT NULL COMMENT '作者收益',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '兑换时间',
        PRIMARY KEY (id),
        UNIQUE KEY uk_resource_user (resource_id, user_id),
        KEY user_id (user_id),
        KEY create_time (create_time),
        CONSTRAINT fk_purchase_resource FOREIGN KEY (resource_id) REFERENCES post_resource(id) ON DELETE CASCADE,
        CONSTRAINT fk_purchase_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源兑换记录表';
    `;
    await db.query(purchaseSql);
  },

  // ==================== 资源管理 ====================

  /**
   * 创建资源
   */
  create: async (data) => {
    const { post_id, download_link, price = 50 } = data;
    const sql = `
      INSERT INTO post_resource (post_id, download_link, price)
      VALUES (?, ?, ?)
    `;
    return await db.insert(sql, [post_id, download_link, price]);
  },

  /**
   * 根据帖子ID获取资源
   */
  findByPostId: async (postId) => {
    const sql = 'SELECT * FROM post_resource WHERE post_id = ?';
    const rows = await db.query(sql, [postId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 根据ID获取资源
   */
  findById: async (id) => {
    const sql = `
      SELECT r.*, p.user_id as author_id, p.title as post_title
      FROM post_resource r
      LEFT JOIN post p ON r.post_id = p.id
      WHERE r.id = ?
    `;
    const rows = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 更新资源
   */
  update: async (postId, data) => {
    const { download_link, price } = data;
    const sql = `
      UPDATE post_resource 
      SET download_link = ?, price = ?
      WHERE post_id = ?
    `;
    return await db.update(sql, [download_link, price, postId]);
  },

  /**
   * 删除资源
   */
  delete: async (postId) => {
    const sql = 'DELETE FROM post_resource WHERE post_id = ?';
    return await db.update(sql, [postId]);
  },

  /**
   * 增加下载次数
   */
  incrementDownloadCount: async (resourceId) => {
    const sql = 'UPDATE post_resource SET download_count = download_count + 1 WHERE id = ?';
    await db.update(sql, [resourceId]);
  },

  // ==================== 兑换管理 ====================

  /**
   * 兑换资源
   */
  purchase: async (data) => {
    const { resource_id, user_id, points_cost, author_earnings } = data;
    try {
      const sql = `
        INSERT INTO resource_purchase (resource_id, user_id, points_cost, author_earnings)
        VALUES (?, ?, ?, ?)
      `;
      return await db.insert(sql, [resource_id, user_id, points_cost, author_earnings]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return null;
      }
      throw error;
    }
  },

  /**
   * 检查用户是否已兑换
   */
  hasPurchased: async (resourceId, userId) => {
    const sql = 'SELECT 1 FROM resource_purchase WHERE resource_id = ? AND user_id = ? LIMIT 1';
    const rows = await db.query(sql, [resourceId, userId]);
    return rows.length > 0;
  },

  /**
   * 获取用户的兑换记录
   */
  getUserPurchases: async (userId, options = {}) => {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM resource_purchase rp
      INNER JOIN post_resource pr ON rp.resource_id = pr.id
      INNER JOIN post p ON pr.post_id = p.id
      WHERE rp.user_id = ? AND p.status = 1
    `;
    const countRows = await db.query(countSql, [userId]);
    const total = countRows[0].total;
    
    const listSql = `
      SELECT 
        rp.id,
        rp.points_cost,
        rp.create_time,
        pr.id as resource_id,
        pr.download_link,
        p.id as post_id,
        p.title as post_title,
        u.username as author_name
      FROM resource_purchase rp
      INNER JOIN post_resource pr ON rp.resource_id = pr.id
      INNER JOIN post p ON pr.post_id = p.id
      LEFT JOIN user u ON p.user_id = u.id
      WHERE rp.user_id = ? AND p.status = 1
      ORDER BY rp.create_time DESC
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
   * 获取作者的资源收益记录
   */
  getAuthorEarnings: async (authorId, options = {}) => {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM resource_purchase rp
      INNER JOIN post_resource pr ON rp.resource_id = pr.id
      INNER JOIN post p ON pr.post_id = p.id
      WHERE p.user_id = ?
    `;
    const countRows = await db.query(countSql, [authorId]);
    const total = countRows[0].total;
    
    const sumSql = `
      SELECT COALESCE(SUM(author_earnings), 0) as total_earnings
      FROM resource_purchase rp
      INNER JOIN post_resource pr ON rp.resource_id = pr.id
      INNER JOIN post p ON pr.post_id = p.id
      WHERE p.user_id = ?
    `;
    const sumRows = await db.query(sumSql, [authorId]);
    
    const listSql = `
      SELECT 
        rp.id,
        rp.author_earnings,
        rp.create_time,
        p.id as post_id,
        p.title as post_title,
        u.username as buyer_name
      FROM resource_purchase rp
      INNER JOIN post_resource pr ON rp.resource_id = pr.id
      INNER JOIN post p ON pr.post_id = p.id
      LEFT JOIN user u ON rp.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY rp.create_time DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    const list = await db.query(listSql, [authorId]);
    
    return {
      list,
      total_earnings: sumRows[0].total_earnings,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  },

  /**
   * 统计资源数据
   */
  getStats: async (postId) => {
    const resource = await PostResource.findByPostId(postId);
    if (!resource) return null;
    
    const purchaseSql = 'SELECT COUNT(*) as count FROM resource_purchase WHERE resource_id = ?';
    const purchaseRows = await db.query(purchaseSql, [resource.id]);
    
    const earningsSql = `
      SELECT COALESCE(SUM(author_earnings), 0) as total
      FROM resource_purchase 
      WHERE resource_id = ?
    `;
    const earningsRows = await db.query(earningsSql, [resource.id]);
    
    return {
      price: resource.price,
      download_count: resource.download_count,
      purchase_count: purchaseRows[0].count,
      total_earnings: earningsRows[0].total
    };
  },

  /**
   * 获取用户的兑换记录
   */
  getUserPurchases: async (userId, options = {}) => {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM resource_purchase rp
      INNER JOIN post_resource pr ON rp.resource_id = pr.id
      INNER JOIN post p ON pr.post_id = p.id
      WHERE rp.user_id = ? AND p.status = 1
    `;
    const countRows = await db.query(countSql, [userId]);
    const total = countRows[0].total;
    
    const listSql = `
      SELECT 
        rp.id,
        rp.points_cost,
        rp.create_time,
        pr.id as resource_id,
        pr.download_link,
        p.id as post_id,
        p.title as post_title,
        u.username as author_name
      FROM resource_purchase rp
      INNER JOIN post_resource pr ON rp.resource_id = pr.id
      INNER JOIN post p ON pr.post_id = p.id
      LEFT JOIN user u ON p.user_id = u.id
      WHERE rp.user_id = ? AND p.status = 1
      ORDER BY rp.create_time DESC
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
  }
};

module.exports = PostResource;
