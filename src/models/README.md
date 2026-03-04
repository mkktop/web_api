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

管理用户注册所需的邀请码，支持批量生成、查询、统计等功能。

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

// ==================== 生成邀请码 ====================

// 创建单个邀请码（默认32位）
const result = await InviteCode.create();

// 创建指定长度的邀请码
const result = await InviteCode.create({ length: 16 });

// 批量生成邀请码（管理员专用）
const codes = await InviteCode.createBatch({ count: 10, length: 16 });
// 返回: [{ id: 1, code: 'abc...' }, { id: 2, code: 'def...' }, ...]

// ==================== 验证邀请码 ====================

// 验证邀请码是否有效（存在且未使用）
const isValid = await InviteCode.isValid('abc123...');

// 使用邀请码（标记为已使用，绑定用户）
await InviteCode.use('abc123...', userId);

// ==================== 查询邀请码 ====================

// 查询邀请码列表（支持筛选和分页）
const result = await InviteCode.findAll({
  page: 1,
  pageSize: 20,
  code: 'abc',        // 按邀请码模糊搜索
  used: 0             // 0未使用/1已使用
});
// 返回: { list: [...], pagination: { total, page, pageSize, totalPages } }

// 统计邀请码数量
const stats = await InviteCode.count();
// 返回: { total: 100, used: 50, unused: 50 }

// ==================== 删除邀请码 ====================

// 删除未使用的邀请码
await InviteCode.delete(id);

// 清理过期邀请码（删除超过30天未使用的）
await InviteCode.deleteExpired(30);
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

### category.model.js - 版块分类表模型

管理论坛版块分类。

**表结构 (category)：**

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NOT NULL, AUTO_INCREMENT | - | 版块ID（主键） |
| name | VARCHAR(50) | NOT NULL | - | 版块名称 |
| description | VARCHAR(255) | DEFAULT NULL | NULL | 版块描述 |
| icon | VARCHAR(255) | DEFAULT NULL | NULL | 版块图标URL |
| sort_order | INT | DEFAULT NULL | 0 | 排序（数字越小越靠前） |
| status | TINYINT | DEFAULT NULL | 1 | 状态：1启用 0禁用 |
| create_time | DATETIME | DEFAULT NULL | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | DEFAULT NULL | CURRENT_TIMESTAMP | 更新时间 |

**主要方法：**

```javascript
const Category = require('./models/category.model');

// ==================== 创建版块 ====================

const id = await Category.create({
  name: '技术交流',
  description: '技术问题讨论与交流',
  sort_order: 1
});

// ==================== 查询版块 ====================

// 根据ID查找
const category = await Category.findById(1);

// 根据名称查找
const category = await Category.findByName('技术交流');

// 检查名称是否存在（编辑时排除自身）
const exists = await Category.existsByName('技术交流', excludeId);

// 获取所有版块（支持筛选和分页）
const result = await Category.findAll({
  page: 1,
  pageSize: 20,
  status: 1,        // 按状态筛选
  keyword: '技术'   // 按名称模糊搜索
});
// 返回: { list: [...], pagination: { total, page, pageSize, totalPages } }

// 获取启用的版块列表（前端展示用）
const list = await Category.findActive();

// ==================== 更新版块 ====================

await Category.update(1, {
  name: '新名称',
  description: '新描述',
  sort_order: 2
});

// 更新状态
await Category.updateStatus(1, 0);  // 禁用
await Category.updateStatus(1, 1);  // 启用

// ==================== 删除版块 ====================

await Category.delete(1);

// ==================== 统计 ====================

const stats = await Category.count();
// 返回: { total: 3, active: 3, inactive: 0 }
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
7. 创建版块分类表 (category)
8. 创建默认管理员账号
9. 创建初始邀请码
10. 创建默认版块

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
