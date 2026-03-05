/**
 * @fileoverview 帖子表模型
 * @description 管理论坛帖子数据
 * 
 * 表结构说明：
 * - id: 自增主键
 * - title: 帖子标题
 * - content: 帖子内容
 * - user_id: 作者ID
 * - category_id: 版块ID
 * - views: 浏览量
 * - likes: 点赞数
 * - comments: 评论数
 * - is_pinned: 是否置顶
 * - is_highlighted: 是否加精
 * - status: 状态（1正常/0删除/2审核中）
 * - create_time: 创建时间
 * - update_time: 更新时间
 * 
 * 使用场景：
 * - 用户发布帖子
 * - 浏览帖子列表
 * - 查看帖子详情
 * - 帖子管理（置顶、加精、删除）
 */

// 引入数据库操作模块
const db = require('./database');

/**
 * 帖子模型对象
 * @description 封装所有帖子相关的数据库操作
 */
const Post = {
  /**
   * 创建帖子表
   * @description 如果表不存在则创建
   * 
   * @returns {Promise<void>}
   */
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS post (
        id INT NOT NULL AUTO_INCREMENT COMMENT '帖子ID（主键）',
        title VARCHAR(100) NOT NULL COMMENT '帖子标题',
        content TEXT NOT NULL COMMENT '帖子内容',
        user_id INT NOT NULL COMMENT '作者ID',
        category_id INT NOT NULL COMMENT '版块ID',
        views INT DEFAULT 0 COMMENT '浏览量',
        likes INT DEFAULT 0 COMMENT '点赞数',
        comments INT DEFAULT 0 COMMENT '评论数',
        is_pinned TINYINT DEFAULT 0 COMMENT '是否置顶：0否 1是',
        is_highlighted TINYINT DEFAULT 0 COMMENT '是否加精：0否 1是',
        status TINYINT DEFAULT 1 COMMENT '状态：1正常 0删除 2审核中',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY category_id (category_id),
        KEY status (status),
        KEY is_pinned (is_pinned),
        KEY create_time (create_time),
        CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        CONSTRAINT fk_post_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';
    `;
    await db.query(sql);
  },

  /**
   * 创建帖子
   * @description 用户发布新帖子
   * 
   * @param {Object} data - 帖子数据
   * @param {string} data.title - 帖子标题
   * @param {string} data.content - 帖子内容
   * @param {number} data.user_id - 作者ID
   * @param {number} data.category_id - 版块ID
   * @returns {Promise<number>} 新增帖子的ID
   * 
   * @example
   * const id = await Post.create({
   *   title: '我的第一篇帖子',
   *   content: '帖子内容...',
   *   user_id: 1,
   *   category_id: 1
   * });
   */
  create: async (data) => {
    const { title, content, user_id, category_id } = data;
    const sql = `
      INSERT INTO post (title, content, user_id, category_id)
      VALUES (?, ?, ?, ?)
    `;
    return await db.insert(sql, [title, content, user_id, category_id]);
  },

  /**
   * 根据ID查找帖子
   * @description 根据ID查询帖子信息（包含作者和版块信息）
   * 
   * @param {number} id - 帖子ID
   * @returns {Promise<Object|null>} 帖子信息
   */
  findById: async (id) => {
    const sql = `
      SELECT 
        p.*,
        u.username as author_name,
        u.nickname as author_nickname,
        u.avatar as author_avatar,
        c.name as category_name
      FROM post p
      LEFT JOIN user u ON p.user_id = u.id
      LEFT JOIN category c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    const rows = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * 增加浏览量
   * @description 帖子被查看时增加浏览量
   * 
   * @param {number} id - 帖子ID
   * @returns {Promise<void>}
   */
  incrementViews: async (id) => {
    const sql = 'UPDATE post SET views = views + 1 WHERE id = ?';
    await db.update(sql, [id]);
  },

  /**
   * 获取帖子列表
   * @description 获取帖子列表，支持筛选和分页
   * 
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.pageSize - 每页数量
   * @param {number} options.category_id - 按版块筛选
   * @param {number} options.user_id - 按作者筛选
   * @param {number} options.status - 按状态筛选
   * @param {string} options.keyword - 按标题模糊搜索
   * @param {string} options.orderBy - 排序方式（latest/popular/pinned）
   * @returns {Promise<Object>} 包含列表和分页信息的对象
   */
  findAll: async (options = {}) => {
    const { 
      page = 1, 
      pageSize = 20, 
      category_id, 
      user_id, 
      status,
      keyword,
      orderBy = 'latest'
    } = options;
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // 按版块筛选
    if (category_id) {
      whereClause += ' AND p.category_id = ?';
      params.push(parseInt(category_id));
    }
    
    // 按作者筛选
    if (user_id) {
      whereClause += ' AND p.user_id = ?';
      params.push(parseInt(user_id));
    }
    
    // 按状态筛选
    if (status !== undefined && status !== null && status !== '') {
      whereClause += ' AND p.status = ?';
      params.push(parseInt(status));
    } else {
      // 默认只显示正常状态的帖子
      whereClause += ' AND p.status = 1';
    }
    
    // 按标题模糊搜索
    if (keyword) {
      whereClause += ' AND p.title LIKE ?';
      params.push(`%${keyword}%`);
    }
    
    // 构建排序
    let orderClause = '';
    switch (orderBy) {
      case 'popular':
        orderClause = 'ORDER BY p.likes DESC, p.views DESC, p.create_time DESC';
        break;
      case 'pinned':
        orderClause = 'ORDER BY p.is_pinned DESC, p.create_time DESC';
        break;
      case 'latest':
      default:
        orderClause = 'ORDER BY p.is_pinned DESC, p.create_time DESC';
        break;
    }
    
    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total 
      FROM post p 
      ${whereClause}
    `;
    const countRows = await db.query(countSql, params);
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
        p.status,
        p.create_time,
        p.update_time,
        u.username as author_name,
        u.nickname as author_nickname,
        u.avatar as author_avatar,
        c.name as category_name
      FROM post p
      LEFT JOIN user u ON p.user_id = u.id
      LEFT JOIN category c ON p.category_id = c.id
      ${whereClause}
      ${orderClause}
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    const list = await db.query(listSql, params);
    
    // 截取内容摘要（前200字符）
    list.forEach(post => {
      if (post.content && post.content.length > 200) {
        post.summary = post.content.substring(0, 200) + '...';
      } else {
        post.summary = post.content;
      }
      delete post.content; // 列表不返回完整内容
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

  /**
   * 更新帖子
   * @description 更新帖子信息
   * 
   * @param {number} id - 帖子ID
   * @param {Object} data - 更新数据
   * @returns {Promise<number>} 影响的行数
   */
  update: async (id, data) => {
    const fields = [];
    const params = [];
    
    // 动态构建更新字段
    if (data.title !== undefined) {
      fields.push('title = ?');
      params.push(data.title);
    }
    if (data.content !== undefined) {
      fields.push('content = ?');
      params.push(data.content);
    }
    if (data.category_id !== undefined) {
      fields.push('category_id = ?');
      params.push(data.category_id);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }
    if (data.is_pinned !== undefined) {
      fields.push('is_pinned = ?');
      params.push(data.is_pinned);
    }
    if (data.is_highlighted !== undefined) {
      fields.push('is_highlighted = ?');
      params.push(data.is_highlighted);
    }
    
    if (fields.length === 0) {
      return 0;
    }
    
    params.push(id);
    const sql = `UPDATE post SET ${fields.join(', ')} WHERE id = ?`;
    return await db.update(sql, params);
  },

  /**
   * 删除帖子（软删除）
   * @description 将帖子状态设为已删除
   * 
   * @param {number} id - 帖子ID
   * @returns {Promise<number>} 影响的行数
   */
  delete: async (id) => {
    const sql = 'UPDATE post SET status = 0 WHERE id = ?';
    return await db.update(sql, [id]);
  },

  /**
   * 置顶/取消置顶帖子
   * @description 管理员操作
   * 
   * @param {number} id - 帖子ID
   * @param {number} isPinned - 是否置顶（1是/0否）
   * @returns {Promise<number>} 影响的行数
   */
  setPinned: async (id, isPinned) => {
    const sql = 'UPDATE post SET is_pinned = ? WHERE id = ?';
    return await db.update(sql, [isPinned, id]);
  },

  /**
   * 加精/取消加精帖子
   * @description 管理员操作
   * 
   * @param {number} id - 帖子ID
   * @param {number} isHighlighted - 是否加精（1是/0否）
   * @returns {Promise<number>} 影响的行数
   */
  setHighlighted: async (id, isHighlighted) => {
    const sql = 'UPDATE post SET is_highlighted = ? WHERE id = ?';
    return await db.update(sql, [isHighlighted, id]);
  },

  /**
   * 增加点赞数
   * @description 帖子被点赞时调用
   * 
   * @param {number} id - 帖子ID
   * @returns {Promise<void>}
   */
  incrementLikes: async (id) => {
    const sql = 'UPDATE post SET likes = likes + 1 WHERE id = ?';
    await db.update(sql, [id]);
  },

  /**
   * 减少点赞数
   * @description 取消点赞时调用
   * 
   * @param {number} id - 帖子ID
   * @returns {Promise<void>}
   */
  decrementLikes: async (id) => {
    const sql = 'UPDATE post SET likes = GREATEST(0, likes - 1) WHERE id = ?';
    await db.update(sql, [id]);
  },

  /**
   * 增加评论数
   * @description 帖子被评论时调用
   * 
   * @param {number} id - 帖子ID
   * @returns {Promise<void>}
   */
  incrementComments: async (id) => {
    const sql = 'UPDATE post SET comments = comments + 1 WHERE id = ?';
    await db.update(sql, [id]);
  },

  /**
   * 减少评论数
   * @description 评论被删除时调用
   * 
   * @param {number} id - 帖子ID
   * @returns {Promise<void>}
   */
  decrementComments: async (id) => {
    const sql = 'UPDATE post SET comments = GREATEST(0, comments - 1) WHERE id = ?';
    await db.update(sql, [id]);
  },

  /**
   * 统计帖子数量
   * @description 统计帖子的总数、正常数、删除数
   * 
   * @returns {Promise<Object>} 统计结果
   */
  count: async () => {
    const totalSql = 'SELECT COUNT(*) as count FROM post';
    const totalRows = await db.query(totalSql);
    
    const normalSql = 'SELECT COUNT(*) as count FROM post WHERE status = 1';
    const normalRows = await db.query(normalSql);
    
    const deletedSql = 'SELECT COUNT(*) as count FROM post WHERE status = 0';
    const deletedRows = await db.query(deletedSql);
    
    const pendingSql = 'SELECT COUNT(*) as count FROM post WHERE status = 2';
    const pendingRows = await db.query(pendingSql);
    
    return {
      total: totalRows[0].count,
      normal: normalRows[0].count,
      deleted: deletedRows[0].count,
      pending: pendingRows[0].count
    };
  },

  /**
   * 检查用户是否是帖子作者
   * @description 用于权限验证
   * 
   * @param {number} postId - 帖子ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否是作者
   */
  isAuthor: async (postId, userId) => {
    const sql = 'SELECT 1 FROM post WHERE id = ? AND user_id = ? LIMIT 1';
    const rows = await db.query(sql, [postId, userId]);
    return rows.length > 0;
  }
};

module.exports = Post;
