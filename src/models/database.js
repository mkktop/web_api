/**
 * @fileoverview MySQL 数据库连接模块
 * @description 使用 mysql2 创建和管理数据库连接池，提供统一的数据库操作接口
 * 
 * 为什么使用连接池？
 * - 复用连接：避免频繁创建和销毁连接，提高性能
 * - 控制并发：限制最大连接数，防止数据库过载
 * - 自动管理：自动处理连接的获取、释放和错误
 * 
 * mysql2 vs mysql：
 * - mysql2 是 mysql 的改进版，性能更好
 * - 支持 Promise，可以使用 async/await
 * - 支持预处理语句，防止 SQL 注入
 */

// 引入 mysql2 模块
// mysql2/promise 提供 Promise API，支持 async/await
const mysql = require('mysql2/promise');

// 引入配置模块
const config = require('../config');

// 引入日志工具
const logger = require('../utils/logger');

/**
 * 创建数据库连接池
 * @description 连接池会预先创建多个连接，需要时直接获取，用完后归还
 * 
 * 连接池工作原理：
 * 1. 应用启动时创建 min 个连接
 * 2. 需要时从池中获取空闲连接
 * 3. 使用完毕后归还连接（不是关闭）
 * 4. 空闲连接超过 idle 时间后会被关闭
 * 5. 最大连接数不超过 max
 */
const pool = mysql.createPool({
  // 数据库服务器地址
  host: config.database.host,
  // 数据库端口
  port: config.database.port,
  // 数据库用户名
  user: config.database.user,
  // 数据库密码
  password: config.database.password,
  // 数据库名称
  database: config.database.name,
  
  // 连接池配置
  // waitForConnections: 当没有可用连接时，是否等待（true）还是直接报错（false）
  waitForConnections: true,
  // connectionLimit: 连接池最大连接数
  connectionLimit: config.database.pool.max,
  // queueLimit: 等待队列最大长度，0 表示无限制
  queueLimit: 0,
  
  // 时区设置（北京时间）
  timezone: '+08:00',
  
  // 字符集设置（支持 emoji 和特殊字符）
  charset: 'utf8mb4'
});

/**
 * 执行 SQL 查询
 * @description 执行 SQL 语句并返回结果
 * 
 * @param {string} sql - SQL 语句，可以使用 ? 作为占位符
 * @param {Array} params - 参数数组，会替换 SQL 中的 ?
 * @returns {Promise<Array>} 查询结果数组
 * 
 * @example
 * // 查询所有用户
 * const users = await query('SELECT * FROM user');
 * 
 * @example
 * // 带参数查询（防止 SQL 注入）
 * const user = await query('SELECT * FROM user WHERE id = ?', [1]);
 * 
 * @example
 * // 插入数据
 * const result = await query(
 *   'INSERT INTO user (username, password) VALUES (?, ?)',
 *   ['admin', 'hashed_password']
 * );
 */
const query = async (sql, params = []) => {
  // 获取连接并执行查询
  // pool.execute 会自动处理连接的获取和释放
  // 同时使用预处理语句，防止 SQL 注入
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * 执行插入操作并返回插入的 ID
 * @description 执行 INSERT 语句并返回自增 ID
 * 
 * @param {string} sql - INSERT 语句
 * @param {Array} params - 参数数组
 * @returns {Promise<number>} 插入记录的自增 ID
 * 
 * @example
 * const id = await insert(
 *   'INSERT INTO user (username, password) VALUES (?, ?)',
 *   ['admin', 'hashed_password']
 * );
 * console.log('新增用户 ID:', id);
 */
const insert = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  // result.insertId 是插入记录的自增 ID
  return result.insertId;
};

/**
 * 执行更新操作并返回影响的行数
 * @description 执行 UPDATE/DELETE 语句并返回影响的行数
 * 
 * @param {string} sql - UPDATE 或 DELETE 语句
 * @param {Array} params - 参数数组
 * @returns {Promise<number>} 影响的行数
 * 
 * @example
 * const affectedRows = await update(
 *   'UPDATE user SET status = ? WHERE id = ?',
 *   [0, 1]
 * );
 * if (affectedRows > 0) {
 *   console.log('更新成功');
 * }
 */
const update = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  // result.affectedRows 是影响的行数
  return result.affectedRows;
};

/**
 * 开始事务
 * @description 获取一个连接并开始事务
 * 
 * 什么是事务？
 * - 事务是一组操作，要么全部成功，要么全部失败
 * - 例如：用户注册时，需要同时插入 user、user_profile、user_auth 三张表
 * - 如果任何一步失败，所有操作都要回滚
 * 
 * @returns {Promise<Object>} 连接对象，用于后续的事务操作
 * 
 * @example
 * const conn = await beginTransaction();
 * try {
 *   await conn.execute('INSERT INTO user ...');
 *   await conn.execute('INSERT INTO user_profile ...');
 *   await conn.execute('INSERT INTO user_auth ...');
 *   await commit(conn);
 * } catch (error) {
 *   await rollback(conn);
 * }
 */
const beginTransaction = async () => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  return conn;
};

/**
 * 提交事务
 * @description 提交事务，使所有操作永久生效
 * 
 * @param {Object} conn - 连接对象
 */
const commit = async (conn) => {
  await conn.commit();
  conn.release();  // 释放连接回连接池
};

/**
 * 回滚事务
 * @description 回滚事务，撤销所有操作
 * 
 * @param {Object} conn - 连接对象
 */
const rollback = async (conn) => {
  await conn.rollback();
  conn.release();  // 释放连接回连接池
};

/**
 * 测试数据库连接
 * @description 测试数据库连接是否正常
 * 
 * @returns {Promise<boolean>} 连接是否成功
 */
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    logger.info('数据库连接成功');
    return true;
  } catch (error) {
    logger.error('数据库连接失败:', error.message);
    return false;
  }
};

/**
 * 关闭连接池
 * @description 关闭所有连接，通常在应用关闭时调用
 */
const closePool = async () => {
  await pool.end();
  logger.info('数据库连接池已关闭');
};

// 导出数据库操作函数
module.exports = {
  pool,
  query,
  insert,
  update,
  beginTransaction,
  commit,
  rollback,
  testConnection,
  closePool
};
