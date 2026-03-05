/**
 * @fileoverview 数据模型索引文件
 * @description 统一导出所有数据模型，方便其他模块引用
 * 
 * 使用示例：
 * const { User, InviteCode, UserProfile, UserAuth } = require('./models');
 */

// 导出数据库连接模块
const db = require('./database');

// 导出用户相关模型
const User = require('./user.model');
const InviteCode = require('./invite_code.model');
const UserProfile = require('./user_profile.model');
const UserAuth = require('./user_auth.model');
const Category = require('./category.model');
const Post = require('./post.model');
const Comment = require('./comment.model');
const PostInteraction = require('./post_interaction.model');
const SignIn = require('./sign_in.model');
const PostResource = require('./post_resource.model');

module.exports = {
  // 数据库操作
  db,
  
  // 用户模型
  User,
  
  // 邀请码模型
  InviteCode,
  
  // 用户资料模型
  UserProfile,
  
  // 用户权限模型
  UserAuth,
  
  // 版块分类模型
  Category,
  
  // 帖子模型
  Post,
  
  // 评论模型
  Comment,
  
  // 点赞收藏模型
  PostInteraction,
  
  // 签到模型
  SignIn,
  
  // 资源兑换模型
  PostResource
};
