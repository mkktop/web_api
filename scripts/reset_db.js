/**
 * @fileoverview 数据库清理脚本
 * @description 重置数据库到初始状态
 * 
 * 清理内容：
 * 1. 删除所有邀请码
 * 2. 删除所有帖子及相关数据
 * 3. 删除除管理员外的所有用户
 */

const mysql = require('mysql2/promise');
const config = require('../src/config');
const logger = require('../src/utils/logger');

const resetDatabase = async () => {
  let connection = null;
  
  try {
    logger.info('========================================');
    logger.info('开始清理数据库...');
    logger.info('========================================');
    
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name
    });
    
    logger.info('数据库连接成功');
    
    // 关闭外键检查（避免删除顺序问题）
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 1. 清理资源兑换记录
    logger.info('清理资源兑换记录...');
    await connection.query('DELETE FROM resource_purchase');
    
    // 2. 清理帖子资源
    logger.info('清理帖子资源...');
    await connection.query('DELETE FROM post_resource');
    
    // 3. 清理点赞收藏
    logger.info('清理点赞收藏...');
    await connection.query('DELETE FROM post_like');
    await connection.query('DELETE FROM post_favorite');
    
    // 4. 清理评论
    logger.info('清理评论...');
    await connection.query('DELETE FROM comment');
    
    // 5. 清理帖子
    logger.info('清理帖子...');
    await connection.query('DELETE FROM post');
    
    // 6. 清理签到记录
    logger.info('清理签到记录...');
    await connection.query('DELETE FROM sign_in');
    
    // 7. 清理邀请码
    logger.info('清理邀请码...');
    await connection.query('DELETE FROM invite_code');
    
    // 8. 清理用户资料和权限（非管理员）
    logger.info('清理用户资料和权限...');
    await connection.query('DELETE FROM user_profile WHERE user_id > 1');
    await connection.query('DELETE FROM user_auth WHERE user_id > 1');
    
    // 9. 清理用户（保留管理员）
    logger.info('清理用户（保留管理员）...');
    await connection.query('DELETE FROM user WHERE role != "admin"');
    
    // 重置管理员积分
    logger.info('重置管理员积分...');
    await connection.query('UPDATE user_auth SET points = 100000 WHERE user_id = 1');
    
    // 重置自增ID
    logger.info('重置自增ID...');
    await connection.query('ALTER TABLE invite_code AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE post AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE comment AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE post_like AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE post_favorite AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE sign_in AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE post_resource AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE resource_purchase AUTO_INCREMENT = 1');
    
    // 开启外键检查
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    logger.info('========================================');
    logger.info('数据库清理完成！');
    logger.info('========================================');
    logger.info('');
    logger.info('保留数据：');
    logger.info('  - 管理员账号 (admin / admin123)');
    logger.info('  - 管理员积分已重置为 1000');
    logger.info('  - 版块分类');
    logger.info('');
    logger.info('已清理：');
    logger.info('  - 所有邀请码');
    logger.info('  - 所有帖子');
    logger.info('  - 所有评论');
    logger.info('  - 所有签到记录');
    logger.info('  - 所有非管理员用户');
    
  } catch (error) {
    logger.error('数据库清理失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 执行清理
resetDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
