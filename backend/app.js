// 加载环境变量（必须在最前面）
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const errorHandler = require('./middleware/error-handler');

const app = express();

// ==================== 中间件配置 ====================

// 跨域配置
app.use(cors());

// 请求日志
app.use(morgan('dev'));

// 解析 JSON 请求体
app.use(bodyParser.json());

// 解析 URL 编码的请求体
app.use(bodyParser.urlencoded({ extended: true }));

// ==================== 路由挂载 ====================

// 认证相关路由（微信登录等）
app.use('/api/auth', require('./routes/auth'));

// 家长端路由
app.use('/api/parent', require('./routes/parent'));

// 教师端路由
app.use('/api/teacher', require('./routes/teacher'));

// 管理端路由
app.use('/api/admin', require('./routes/admin'));

// 支付相关路由
app.use('/api/payment', require('./routes/payment'));

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'success', data: { status: 'ok' } });
});

// ==================== 全局错误处理 ====================
app.use(errorHandler);

// ==================== 启动服务 ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务已启动，监听端口: ${PORT}`);
});

module.exports = app;
