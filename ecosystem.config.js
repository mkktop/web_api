/**
 * @fileoverview PM2 进程管理配置文件
 * @description PM2 是一个 Node.js 进程管理工具，用于保持应用持续运行
 * 
 * 为什么需要 PM2？
 * - 自动重启：应用崩溃时自动重启
 * - 后台运行：关闭终端后应用继续运行
 * - 日志管理：自动收集和轮转日志
 * - 负载均衡：可以启动多个实例
 * - 开机自启：服务器重启后自动启动应用
 * 
 * 常用 PM2 命令：
 * - pm2 start ecosystem.config.js  启动应用
 * - pm2 restart web-api             重启应用
 * - pm2 stop web-api                停止应用
 * - pm2 logs web-api                查看日志
 * - pm2 monit                       监控面板
 * - pm2 save                        保存当前进程列表
 * - pm2 startup                     设置开机自启
 */

module.exports = {
  // 应用配置数组（可以配置多个应用）
  apps: [
    {
      // 应用名称，用于标识和管理
      name: 'web-api',
      
      // 入口文件
      script: 'src/app.js',
      
      // 实例数量
      // 1: 单实例
      // 'max': 根据 CPU 核心数启动多个实例（集群模式）
      instances: 1,
      
      // 运行模式
      // fork: 单进程模式，适合简单应用
      // cluster: 集群模式，适合高并发应用
      exec_mode: 'fork',
      
      // 自动重启配置
      // 当内存超过这个值时自动重启（防止内存泄漏）
      max_memory_restart: '500M',
      
      // 环境变量 - 开发环境
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      
      // 环境变量 - 生产环境
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // 日志配置
      // 标准输出日志文件
      output: './logs/pm2-out.log',
      // 错误日志文件
      error: './logs/pm2-error.log',
      // 日志时间格式
      time: true,
      
      // 自动重启策略
      // 当应用在指定时间内频繁重启，停止重启防止无限循环
      watch: false,  // 生产环境不建议开启文件监听
      ignore_watch: ['node_modules', 'logs'],
      
      // 合并日志（同一应用的多个实例日志合并到一个文件）
      merge_logs: true,
      
      // 启动延迟（毫秒）
      listen_timeout: 3000,
      
      // 应用崩溃后等待多久重启（毫秒）
      restart_delay: 1000
    }
  ]
};
