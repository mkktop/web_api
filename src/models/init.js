/**
 * @fileoverview 数据库初始化脚本
 * @description 创建数据库和所有必要的数据表
 * 
 * 使用方法：
 * npm run db:init
 * 
 * 或直接运行：
 * node src/models/init.js
 * 
 * 初始化流程：
 * 1. 连接 MySQL 服务器（不指定数据库）
 * 2. 创建数据库（如果不存在）
 * 3. 切换到目标数据库
 * 4. 创建所有数据表（按依赖顺序）
 * 
 * 表创建顺序（重要！）：
 * 1. user - 用户主表（被其他表引用）
 * 2. invite_code - 邀请码表（引用 user）
 * 3. user_profile - 用户资料表（引用 user）
 * 4. user_auth - 用户权限表（引用 user）
 */

// 引入 mysql2 模块
const mysql = require('mysql2/promise');

// 引入配置模块
const config = require('../config');

// 引入日志工具
const logger = require('../utils/logger');

// 引入数据模型
const User = require('./user.model');
const InviteCode = require('./invite_code.model');
const UserProfile = require('./user_profile.model');
const UserAuth = require('./user_auth.model');
const Category = require('./category.model');
const Post = require('./post.model');
const Comment = require('./comment.model');

/**
 * 创建数据库
 * @description 如果数据库不存在则创建
 * 
 * @param {Object} connection - MySQL 连接对象
 */
const createDatabase = async (connection) => {
  const dbName = config.database.name;
  
  // 创建数据库
  // CHARACTER SET utf8mb4: 使用 utf8mb4 字符集（支持 emoji）
  // COLLATE utf8mb4_unicode_ci: 使用 unicode 排序规则
  const sql = `
    CREATE DATABASE IF NOT EXISTS \`${dbName}\`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci
  `;
  
  await connection.query(sql);
  logger.info(`数据库 '${dbName}' 已就绪`);
  
  // 切换到目标数据库
  await connection.changeUser({ database: dbName });
  logger.info(`已切换到数据库 '${dbName}'`);
};

/**
 * 创建所有数据表
 * @description 按顺序创建所有数据表
 * 
 * 表创建顺序很重要！
 * 因为有外键关联，需要先创建被引用的表
 * 1. user - 用户主表（被其他表引用）
 * 2. invite_code - 邀请码表（引用 user）
 * 3. user_profile - 用户资料表（引用 user）
 * 4. user_auth - 用户权限表（引用 user）
 */
const createTables = async () => {
  logger.info('开始创建数据表...');
  
  // 1. 创建用户主表（必须最先创建，因为其他表引用它）
  logger.info('创建用户主表 (user)...');
  await User.createTable();
  logger.info('用户主表创建完成');
  
  // 2. 创建邀请码表
  logger.info('创建邀请码表 (invite_code)...');
  await InviteCode.createTable();
  logger.info('邀请码表创建完成');
  
  // 3. 创建用户资料表
  logger.info('创建用户资料表 (user_profile)...');
  await UserProfile.createTable();
  logger.info('用户资料表创建完成');
  
  // 4. 创建用户权限表
  logger.info('创建用户权限表 (user_auth)...');
  await UserAuth.createTable();
  logger.info('用户权限表创建完成');
  
  // 5. 创建版块分类表
  logger.info('创建版块分类表 (category)...');
  await Category.createTable();
  logger.info('版块分类表创建完成');
  
  // 6. 创建帖子表
  logger.info('创建帖子表 (post)...');
  await Post.createTable();
  logger.info('帖子表创建完成');
  
  // 7. 创建评论表
  logger.info('创建评论表 (comment)...');
  await Comment.createTable();
  logger.info('评论表创建完成');
  
  logger.info('所有数据表创建完成！');
};

/**
 * 创建默认管理员账号
 * @description 创建默认的管理员账号和初始邀请码
 */
const createDefaultData = async () => {
  logger.info('创建默认数据...');
  
  // 检查是否已存在管理员
  const adminExists = await User.existsByUsername('admin');
  
  if (!adminExists) {
    // 创建默认管理员
    const adminId = await User.create({
      username: 'admin',
      password: 'admin123',  // 默认密码，生产环境请修改
      email: 'admin@example.com',
      nickname: '管理员',
      role: 'admin'
    });
    logger.info('默认管理员账号创建成功');
    logger.info('  用户名: admin');
    logger.info('  密码: admin123');
    logger.info('  请登录后立即修改密码！');
    
    // 创建用户资料和权限记录
    await UserProfile.create(adminId);
    await UserAuth.create(adminId, { points: 1000, download_limit: 999 });
    logger.info('管理员资料和权限创建完成');
  } else {
    logger.info('管理员账号已存在，跳过创建');
  }
  
  // 创建初始邀请码
  const code = await InviteCode.create();
  logger.info(`初始邀请码创建成功: ${code.code}`);
  
  // 创建默认版块
  const categoriesExist = await Category.findByName('综合讨论');
  if (!categoriesExist) {
    await Category.create({ name: '综合讨论', description: '综合讨论区，可以讨论任何话题', sort_order: 1 });
    await Category.create({ name: '技术交流', description: '技术问题讨论与交流', sort_order: 2 });
    await Category.create({ name: '闲聊灌水', description: '轻松闲聊，分享生活', sort_order: 3 });
    logger.info('默认版块创建成功');
  } else {
    logger.info('版块已存在，跳过创建');
  }
};

/**
 * 主初始化函数
 * @description 执行完整的数据库初始化流程
 */
const initDatabase = async () => {
  let connection = null;
  
  try {
    logger.info('========================================');
    logger.info('开始初始化数据库...');
    logger.info('========================================');
    
    // 连接 MySQL 服务器（不指定数据库）
    // 因为我们要先创建数据库
    logger.info(`连接 MySQL 服务器 (${config.database.host}:${config.database.port})...`);
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password
    });
    logger.info('MySQL 服务器连接成功');
    
    // 创建数据库
    await createDatabase(connection);
    
    // 关闭当前连接
    await connection.end();
    connection = null;
    
    // 创建数据表（使用连接池）
    await createTables();
    
    // 创建默认数据
    await createDefaultData();
    
    logger.info('========================================');
    logger.info('数据库初始化完成！');
    logger.info('========================================');
    
    // 输出数据库信息
    logger.info('\n数据库配置信息:');
    logger.info(`  主机: ${config.database.host}`);
    logger.info(`  端口: ${config.database.port}`);
    logger.info(`  数据库名: ${config.database.name}`);
    logger.info(`  用户: ${config.database.user}`);
    
    logger.info('\n数据表列表:');
    logger.info('  - user (用户主表)');
    logger.info('  - invite_code (邀请码表)');
    logger.info('  - user_profile (用户资料表)');
    logger.info('  - user_auth (用户权限表)');
    logger.info('  - category (版块分类表)');
    
    process.exit(0);
  } catch (error) {
    logger.error('数据库初始化失败:', error.message);
    logger.error('\n请检查以下配置是否正确:');
    logger.error('  1. MySQL 服务是否已启动');
    logger.error('  2. 数据库连接信息是否正确（.env 文件）');
    logger.error('  3. 数据库用户是否有创建数据库的权限');
    logger.error('\n错误详情:', error);
    
    if (connection) {
      await connection.end();
    }
    
    process.exit(1);
  }
};

// 执行初始化
initDatabase();
