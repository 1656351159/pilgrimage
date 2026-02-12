/**
 * 认证服务
 */
const { post } = require('./request');

/**
 * 微信登录
 * @param {string} code - wx.login 获取的 code
 * @returns {Promise}
 */
const login = (code) => {
  return post('/auth/wx-login', { code });
};

/**
 * 手机号登录
 * @param {string} phone
 * @param {string} password
 * @returns {Promise}
 */
const loginByPhone = (phone, password) => {
  return post('/auth/login', { phone, password });
};

/**
 * 获取手机号
 * @param {string} code - getPhoneNumber 获取的 code
 * @returns {Promise}
 */
const getPhoneNumber = (code) => {
  return post('/auth/phone', { code });
};

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
const getUserProfile = () => {
  return require('./request').get('/auth/profile');
};

/**
 * 退出登录
 * @returns {Promise}
 */
const logout = () => {
  return post('/auth/logout');
};

module.exports = {
  login,
  loginByPhone,
  getPhoneNumber,
  getUserProfile,
  logout
};
