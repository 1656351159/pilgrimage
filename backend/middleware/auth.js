const jwt = require('jsonwebtoken');

/**
 * JWT 认证中间件
 * 从请求头 Authorization 中提取 Bearer Token 并验证
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

    // 提取 Bearer Token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌格式错误'
      });
    }

    const token = parts[1];

    // 验证 Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 将用户信息挂载到 req.user
    req.user = {
      id: decoded.id,
      openid: decoded.openid,
      role: decoded.role,
      nickname: decoded.nickname
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已过期'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的认证令牌'
      });
    }
    next(err);
  }
};

/**
 * 角色授权中间件
 * 检查用户是否具有指定角色之一
 * @param  {...string} roles - 允许的角色列表，如 'admin', 'teacher', 'parent'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // 必须先经过 authenticate 中间件
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    // 检查用户角色是否在允许列表中
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，无法访问该资源'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
