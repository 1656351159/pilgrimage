/**
 * 全局错误处理中间件
 * 捕获所有未处理的错误，返回统一的错误响应格式
 */
const errorHandler = (err, req, res, _next) => {
  // 记录错误日志
  console.error('请求错误:', {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: err.stack
  });

  // 根据错误类型确定状态码
  const statusCode = err.statusCode || 500;
  const code = err.code || statusCode;

  // 生产环境下隐藏具体错误堆栈
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : err.message || '服务器内部错误';

  res.status(statusCode).json({
    code,
    message
  });
};

module.exports = errorHandler;
