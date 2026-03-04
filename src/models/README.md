# 数据模型模块 (models)

本模块负责数据库连接和数据模型的定义。

## 文件说明

### database.js - 数据库连接模块

创建和管理 MySQL 连接池，提供统一的数据库操作接口。

**主要功能：**

| 函数 | 说明 | 示例 |
|------|------|------|
| query | 执行查询 | `await db.query('SELECT * FROM user')` |
| insert | 执行插入 | `await db.insert(sql, params)` |
| update | 执行更新 | `await db.update(sql, params)` |
| beginTransaction | 开始事务 | `const conn = await db.beginTransaction()` |
| commit | 提交事务 | `await db.commit(conn)` |
| rollback | 回滚事务 | `await db.rollback(conn)` |
| testConnection | 测试连接 | `await db.testConnection()` |
| closePool | 关闭连接池 | `await db.closePool()` |

---

### user.model.js - 用户主表模型

存储用户核心信息，包括登录凭证和基本账户信息。

**表结构 (user)：**

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NOT NULL, AUTO_INCREMENT | - | 用户唯一ID（主键） |
| username | VARCHAR(50) | NOT NULL, UNIQUE | - | 登录用户名 |
| password | VARCHAR(100) | NOT NULL | - | 加密密码（bcrypt） |
| email | VARCHAR(100) | DEFAULT NULL, UNIQUE | NULL | 邮箱 |
| nickname | VARCHAR(50) | DEFAULT NULL | NULL | 昵称 |
| avatar | VARCHAR(255) | DEFAULT NULL | NULL | 头像URL |
| role | VARCHAR(20) | DEFAULT NULL | 'user' | 角色（user/admin） |
| status | TINYINT | DEFAULT NULL | 1 | 状态：1正常 0禁用 |
| create_time | DATETIME | DEFAULT NULL | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | DEFAULT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**主要方法：**

```javascript
const User = require('./models/user.model');

// 创建用户（密码自动加密）
const userId = await User.create({
  username: 'test',
  password: '123456',
  email: 'test@example.com'
});

// 查找用户
const user = await User.findById(1);
const user = await User.findByUsername('test');

// 验证密码
const isValid = await User.verifyPassword('123456', user.password);

// 更新用户
await User.update(1, { nickname: '新昵称' });

// 更新密码
await User.updatePassword(1, 'new_password');

// 检查用户名是否存在
const exists = await User.existsByUsername('test');
```

---

### invite_code.model.js - 邀请码表模型

管理用户注册所需的邀请码。

**表结构 (invite_code)：**

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NOT NULL, AUTO_INCREMENT | - | 邀请码ID（主键） |
| code | VARCHAR(32) | NOT NULL, UNIQUE | - | 邀请码 |
| used | TINYINT | DEFAULT NULL | 0 | 状态：0未使用 1已使用 |
| user_id | INT | DEFAULT NULL | NULL | 绑定的用户ID |
| create_time | DATETIME | DEFAULT NULL | CURRENT_TIMESTAMP | 创建时间 |
| use_time | DATETIME | DEFAULT NULL | NULL | 使用时间 |

**主要方法：**

```javascript
const InviteCode = require('./models/invite_code.model');

// 创建邀请码（自动生成32位随机码）
const result = await InviteCode.create();
console.log(result.code);  // 邀请码字符串

// 批量创建
const codes = await InviteCode.createBatch(10);

// 验证邀请码
const isValid = await InviteCode.isValid('abc123...');

// 使用邀请码
await InviteCode.use('abc123...', userId);

// 查询统计
const stats = await InviteCode.count();
// { total: 100, used: 50, unused: 50 }
```

---

### user_profile.model.js - 用户资料表模型

存储用户的扩展资料信息。

**表结构 (user_profile)：**

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NOT NULL, AUTO_INCREMENT | - | 资料ID（主键） |
| user_id | INT | NOT NULL, UNIQUE | - | 关联用户ID |
| signature | VARCHAR(255) | DEFAULT NULL | NULL | 个性签名 |
| gender | VARCHAR(10) | DEFAULT NULL | 'unknown' | 性别 |
| birthday | DATE | DEFAULT NULL | NULL | 生日 |

**主要方法：**

```javascript
const UserProfile = require('./models/user_profile.model');

// 创建资料（注册时自动调用）
await UserProfile.create(userId);

// 查找资料
const profile = await UserProfile.findByUserId(1);

// 更新资料
await UserProfile.update(1, {
  signature: '这是我的签名',
  gender: 'male',
  birthday: '1990-01-01'
});

// 获取用户完整信息（联表查询）
const fullInfo = await UserProfile.getFullInfo(1);
```

---

### user_auth.model.js - 用户权限积分表模型

存储用户的权限和积分信息。

**表结构 (user_auth)：**

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NOT NULL, AUTO_INCREMENT | - | 权限ID（主键） |
| user_id | INT | NOT NULL, UNIQUE | - | 关联用户ID |
| points | INT | DEFAULT NULL | 0 | 用户积分 |
| download_limit | INT | DEFAULT NULL | 50 | 每日下载限制 |
| can_upload | TINYINT | DEFAULT NULL | 1 | 能否上传 |
| can_comment | TINYINT | DEFAULT NULL | 1 | 能否评论 |

**主要方法：**

```javascript
const UserAuth = require('./models/user_auth.model');

// 创建权限记录（注册时自动调用）
await UserAuth.create(userId);

// 查找权限
const auth = await UserAuth.findByUserId(1);

// 更新权限
await UserAuth.update(1, { points: 100, download_limit: 100 });

// 积分操作
await UserAuth.addPoints(1, 10);   // 增加10积分
await UserAuth.addPoints(1, -5);   // 减少5积分

// 检查权限
const canUpload = await UserAuth.hasPermission(1, 'upload');
const hasEnough = await UserAuth.hasEnoughPoints(1, 100);

// 积分排行榜
const topUsers = await UserAuth.getTopUsers(10);
```

---

### init.js - 数据库初始化脚本

初始化数据库和创建数据表。

**使用方法：**

```bash
npm run db:init
```

**初始化流程：**

1. 连接 MySQL 服务器
2. 创建数据库（如果不存在）
3. 创建用户表 (user)
4. 创建邀请码表 (invite_code)
5. 创建用户资料表 (user_profile)
6. 创建用户权限表 (user_auth)
7. 创建默认管理员账号
8. 创建初始邀请码

**默认管理员：**
- 用户名：admin
- 密码：admin123
- 请登录后立即修改密码！

---

## 数据库配置

在 `.env` 文件中配置：

```env
# MySQL 配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=web_api

# 安全配置
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=604800
BCRYPT_SALT_ROUNDS=10
```

## 表关系图

```
┌─────────────────┐
│     user        │ 主表
├─────────────────┤
│ id (PK)         │◄─────────────┐
│ username        │              │
│ password        │              │
│ email           │              │
│ ...             │              │
└─────────────────┘              │
        │                        │
        │ 1:1                    │ 1:N
        ▼                        │
┌─────────────────┐    ┌─────────────────┐
│  user_profile   │    │  invite_code    │
├─────────────────┤    ├─────────────────┤
│ user_id (FK)    │    │ user_id (FK)    │
│ signature       │    │ code            │
│ gender          │    │ used            │
│ birthday        │    │ ...             │
└─────────────────┘    └─────────────────┘
        │
        │ 1:1
        ▼
┌─────────────────┐
│   user_auth     │
├─────────────────┤
│ user_id (FK)    │
│ points          │
│ download_limit  │
│ can_upload      │
│ can_comment     │
└─────────────────┘
```

## 用户注册流程

```
1. 验证邀请码有效
   ↓
2. 插入 user 表（创建用户）
   ↓
3. 自动插入 user_profile（空值）
   ↓
4. 自动插入 user_auth（默认值）
   ↓
5. 标记邀请码为已使用
```

## 事务使用示例

```javascript
const db = require('./models/database');

// 用户注册（使用事务确保数据一致性）
const registerUser = async (userData, inviteCode) => {
  const conn = await db.beginTransaction();
  try {
    // 1. 创建用户
    const [result] = await conn.execute(
      'INSERT INTO user (username, password) VALUES (?, ?)',
      [userData.username, userData.password]
    );
    const userId = result.insertId;
    
    // 2. 创建用户资料
    await conn.execute(
      'INSERT INTO user_profile (user_id) VALUES (?)',
      [userId]
    );
    
    // 3. 创建用户权限
    await conn.execute(
      'INSERT INTO user_auth (user_id) VALUES (?)',
      [userId]
    );
    
    // 4. 标记邀请码已使用
    await conn.execute(
      'UPDATE invite_code SET used = 1, user_id = ?, use_time = NOW() WHERE code = ?',
      [userId, inviteCode]
    );
    
    // 提交事务
    await db.commit(conn);
    return userId;
  } catch (error) {
    // 回滚事务
    await db.rollback(conn);
    throw error;
  }
};
```
