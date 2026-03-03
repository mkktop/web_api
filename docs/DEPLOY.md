# 自动部署指南

本文档介绍如何配置 GitHub Actions 自动部署到服务器。

## 部署流程概览

```
本地代码 → Git Push → GitHub → GitHub Actions → SSH连接服务器 → 拉取代码 → 重启服务
```

## 服务器环境安装

### 第一步：安装 Node.js

根据你的服务器系统选择对应的安装方式：

#### Ubuntu/Debian

```bash
# 更新包管理器
sudo apt update

# 安装 Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v    # 应显示 v22.x.x
npm -v     # 应显示 npm 版本
```

#### CentOS/RHEL

```bash
# 安装 Node.js 22.x
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

#### 使用 nvm 安装（推荐，可管理多版本）

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载配置
source ~/.bashrc

# 安装 Node.js 22
nvm install 22

# 设置默认版本
nvm use 22
nvm alias default 22

# 验证安装
node -v
npm -v
```

### 第二步：安装 Git

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y git

# 验证安装
git --version
```

#### CentOS/RHEL

```bash
sudo yum install -y git

# 验证安装
git --version
```

### 第三步：安装 PM2

```bash
# 全局安装 PM2
npm install -g pm2

# 验证安装
pm2 -v

# 设置开机自启（安装后会显示一条命令，复制执行即可）
pm2 startup
```

### 第四步：配置 Git（可选但推荐）

```bash
# 配置 Git 用户信息
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 保存 Git 凭据（避免每次拉取都输入密码）
git config --global credential.helper store
```

---

## 配置 GitHub Actions 自动部署

### 第一步：服务器准备

1. **在服务器上克隆项目**

```bash
# 进入你的项目目录（修改为你的实际路径）
cd /home/your-user

# 克隆项目
git clone https://github.com/你的用户名/web_api.git

# 进入项目目录
cd web_api

# 安装依赖
npm install --production

# 创建日志目录
mkdir -p logs
```

2. **配置环境变量**

```bash
# 创建 .env 文件
nano .env
```

写入以下内容（根据实际情况修改）：

```env
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### 第二步：配置 SSH 密钥

1. **生成 SSH 密钥对**（在本地电脑执行）

```bash
# 生成密钥（一路回车使用默认设置）
ssh-keygen -t rsa -b 4096 -C "github-actions" -f github-actions-key

# 会生成两个文件：
# github-actions-key      - 私钥（保密！）
# github-actions-key.pub  - 公钥
```

2. **将公钥添加到服务器**

```bash
# 查看公钥内容
cat github-actions-key.pub

# SSH 登录服务器，将公钥添加到 authorized_keys
ssh your-user@your-server-ip

# 编辑 authorized_keys
nano ~/.ssh/authorized_keys

# 将公钥内容粘贴到文件末尾，保存退出
```

3. **测试 SSH 连接**

```bash
# 在本地测试连接
ssh -i github-actions-key your-user@your-server-ip
```

### 第三步：配置 GitHub Secrets

在 GitHub 仓库中添加以下 Secrets：

1. 进入仓库页面 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret" 添加以下配置：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `SERVER_HOST` | 服务器 IP 地址 | `192.168.1.100` |
| `SERVER_USER` | 服务器用户名 | `root` 或 `ubuntu` |
| `SSH_PRIVATE_KEY` | SSH 私钥内容 | 打开 `github-actions-key` 文件，复制全部内容 |
| `SERVER_PORT` | SSH 端口（可选） | `22` |
| `PROJECT_PATH` | 项目在服务器上的路径 | `/home/ubuntu/web_api` |

**添加 SSH_PRIVATE_KEY 的步骤：**

```bash
# 查看私钥内容
cat github-actions-key

# 复制输出的全部内容（包括 -----BEGIN 和 -----END 行）
```

### 第四步：首次部署

1. **在服务器上首次启动应用**

```bash
# SSH 登录服务器
ssh your-user@your-server-ip

# 进入项目目录
cd /path/to/web_api

# 使用 PM2 启动应用
npm run pm2:start

# 或者直接使用
pm2 start ecosystem.config.js --env production

# 保存 PM2 进程列表
pm2 save
```

2. **验证应用运行**

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs web-api

# 测试接口
curl http://localhost:3000/api/system/time
```

### 第五步：触发自动部署

现在当你推送代码到 `main` 分支时，GitHub Actions 会自动部署：

```bash
# 本地修改代码后
git add .
git commit -m "更新功能"
git push origin main

# GitHub Actions 会自动执行部署
```

---

## 手动触发部署

在 GitHub 仓库页面：
1. 点击 "Actions" 标签
2. 选择 "Deploy to Server" 工作流
3. 点击 "Run workflow" 按钮

---

## 常用命令速查

### PM2 命令

```bash
pm2 status              # 查看应用状态
pm2 logs web-api        # 查看日志
pm2 monit               # 实时监控
pm2 restart web-api     # 重启应用
pm2 stop web-api        # 停止应用
pm2 delete web-api      # 删除应用
pm2 show web-api        # 查看应用详情
pm2 save                # 保存进程列表
pm2 startup             # 设置开机自启
```

### 服务管理命令

```bash
# 查看端口占用
lsof -i :3000

# 杀掉占用进程
kill -9 <PID>

# 查看防火墙状态
sudo ufw status

# 开放端口
sudo ufw allow 3000
sudo ufw allow 22
```

---

## 故障排查

### 1. npm/node 命令找不到

```bash
# 检查 Node.js 是否安装
node -v
npm -v

# 如果没安装，参考上面的安装步骤
```

### 2. SSH 连接失败

```bash
# 检查 SSH 服务是否运行
sudo systemctl status sshd

# 检查防火墙
sudo ufw status
sudo ufw allow 22
```

### 3. GitHub Actions 失败

- 检查 Secrets 是否正确配置
- 查看 Actions 日志了解具体错误
- 确认服务器上的项目路径正确

### 4. 应用启动失败

```bash
# 查看 PM2 日志
pm2 logs web-api --lines 100

# 查看 PM2 描述信息
pm2 show web-api

# 手动启动测试
node src/app.js
```

### 5. 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 杀掉占用进程
kill -9 <PID>
```

---

## 安全建议

1. **使用非 root 用户运行应用**
2. **配置防火墙，只开放必要端口**
3. **定期更新服务器软件**
4. **使用 HTTPS（配置 Nginx 反向代理）**

---

## Nginx 反向代理配置（可选）

如果需要使用域名访问，可以配置 Nginx：

```bash
# 安装 Nginx
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/web-api
```

写入以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/web-api /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `.github/workflows/deploy.yml` | GitHub Actions 工作流配置 |
| `ecosystem.config.js` | PM2 进程管理配置 |
