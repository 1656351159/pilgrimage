# CLAUDE.md

## 项目概述

教育机构微信小程序管理系统 —— 为教育培训机构提供家长端、教师端和管理端功能的全栈应用。

**微信小程序 AppID:** `wxa0d969e0af7c8108`

## 当前仓库状态

仓库目前包含一个静态个人主页（HTML/CSS），作为项目初始框架。计划扩展为完整的微信小程序管理系统。

### 现有文件

```
├── index.html            # 个人主页（导航栏 + Hero区域 + 页脚）
├── index.css             # 主页样式（含响应式设计）
├── auth.css              # 登录/认证页面样式
├── 404.html              # 404 错误页
├── README.md             # 项目说明
└── 附件/                  # 静态资源（图片等）
```

## 目标项目结构

```
├── miniprogram/          # 微信小程序前端
│   ├── pages/            # 页面目录
│   │   ├── parent/       # 家长端页面
│   │   ├── teacher/      # 教师端页面
│   │   └── admin/        # 管理端页面
│   ├── components/       # 公共组件
│   ├── utils/            # 工具函数
│   ├── services/         # API 请求封装
│   ├── app.js            # 小程序入口
│   ├── app.json          # 小程序全局配置
│   └── app.wxss          # 全局样式
├── backend/              # 后端 API 服务
│   ├── routes/           # 路由定义
│   ├── controllers/      # 控制器
│   ├── models/           # 数据模型
│   ├── middleware/        # 中间件（认证、日志等）
│   ├── config/           # 配置文件
│   ├── package.json      # Node.js 依赖
│   └── app.js            # Express 入口
├── database/             # 数据库设计
│   ├── schema.sql        # 建表语句
│   └── migrations/       # 数据库迁移脚本
├── docs/                 # 项目文档
├── CLAUDE.md             # 本文件
└── README.md             # 项目说明
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生开发（WXML + WXSS + JS） |
| 后端 | Node.js + Express |
| 数据库 | MySQL |
| 支付 | 微信支付 API |
| 部署 | 阿里云 |

## 功能模块

### 家长端
- 实时查询孩子上课情况
- 查看课时消耗记录
- 查看教师编写的成长报告
- 在线支付学费（微信支付）
- 使用优惠券

### 教师端
- 记录学生消课情况
- 编写学生成长报告
- 课程管理

### 管理端
- 用户管理（家长、教师、学生）
- 课程管理
- 支付管理
- 优惠券管理

## 开发规范

### 通用规范
- 使用中文注释说明业务逻辑
- 文件和目录命名使用英文小写 + 连字符（kebab-case）
- 敏感信息（AppSecret、数据库密码、支付密钥等）**不得**提交到代码仓库，使用环境变量或配置文件（加入 .gitignore）
- **微信支付密钥等敏感凭证不得写入代码或文档中**

### 前端（微信小程序）
- 遵循微信小程序官方开发规范
- 页面文件结构：每个页面包含 `.wxml`、`.wxss`、`.js`、`.json` 四个文件
- 组件化开发，公共 UI 提取为 `components/`
- API 请求统一封装在 `services/` 目录
- 使用 `wx.request` 进行网络请求，统一处理错误和 loading 状态

### 后端（Node.js + Express）
- RESTful API 设计
- 路由按功能模块拆分（`/api/parent/`、`/api/teacher/`、`/api/admin/`）
- 使用中间件进行身份验证和权限控制
- 数据库操作使用参数化查询，防止 SQL 注入
- 统一的错误处理中间件
- 接口返回格式统一：`{ code: number, message: string, data: any }`

### 数据库（MySQL）
- 表名使用英文小写 + 下划线（snake_case）
- 所有表包含 `id`、`created_at`、`updated_at` 字段
- 外键约束保证数据完整性
- 重要操作使用事务

### CSS 约定（现有静态页面）
- 字体：`"PingFang SC", "Microsoft YaHei", sans-serif`
- 图标库：iconfont（阿里云 CDN）
- 响应式断点：768px（移动端适配）
- 使用 CSS 渐变和 `backdrop-filter` 实现视觉效果
- 动画使用 CSS `@keyframes`，避免 JavaScript 动画

## 构建与运行

### 静态页面（当前）
直接在浏览器中打开 `index.html` 即可预览，无需构建工具。

### 微信小程序（计划）
1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入 `miniprogram/` 目录
3. 填入 AppID：`wxa0d969e0af7c8108`

### 后端（计划）
```bash
cd backend
npm install
# 配置环境变量（数据库连接、微信支付参数等）
cp .env.example .env
npm start          # 启动服务
npm run dev        # 开发模式（热重载）
```

### 数据库（计划）
```bash
# 导入数据库结构
mysql -u root -p < database/schema.sql
```

## Git 工作流

- 主分支：`master`
- 功能分支命名：`feature/功能名称`
- 提交信息使用中文，简明描述变更内容
- 不要提交 `node_modules/`、`.env`、编译产物等文件

## 安全注意事项

- 微信支付密钥（如 `20dbc9ce42d8fc8c3c03bcc87b6a73aa`）必须存储在服务器端环境变量中，禁止写入前端代码或公开仓库
- 用户认证使用微信登录 + JWT Token
- 所有 API 接口需要身份验证（除登录接口外）
- 防止 XSS、CSRF、SQL 注入等常见安全漏洞
- HTTPS 传输加密

## 外部资源

- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信支付开发文档](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
- [Express 官方文档](https://expressjs.com/)
- GitHub：https://github.com/1656351159
