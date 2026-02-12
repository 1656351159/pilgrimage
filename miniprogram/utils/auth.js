/**
 * 认证工具函数
 */

/**
 * 检查是否已登录
 * @returns {boolean}
 */
const isLoggedIn = () => {
  const token = wx.getStorageSync('token');
  const userInfo = wx.getStorageSync('userInfo');
  return !!(token && userInfo);
};

/**
 * 获取用户信息
 * @returns {object|null}
 */
const getUserInfo = () => {
  try {
    return wx.getStorageSync('userInfo') || null;
  } catch (e) {
    return null;
  }
};

/**
 * 获取用户角色
 * @returns {string} 'parent' | 'teacher' | 'admin' | ''
 */
const getUserRole = () => {
  const userInfo = getUserInfo();
  return (userInfo && userInfo.role) || '';
};

/**
 * 获取 token
 * @returns {string}
 */
const getToken = () => {
  try {
    return wx.getStorageSync('token') || '';
  } catch (e) {
    return '';
  }
};

/**
 * 保存登录信息
 * @param {string} token
 * @param {object} userInfo
 */
const saveLoginInfo = (token, userInfo) => {
  wx.setStorageSync('token', token);
  wx.setStorageSync('userInfo', userInfo);
  const app = getApp();
  if (app) {
    app.globalData.token = token;
    app.globalData.userInfo = userInfo;
  }
};

/**
 * 清除登录信息
 */
const clearLoginInfo = () => {
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
  const app = getApp();
  if (app) {
    app.globalData.token = null;
    app.globalData.userInfo = null;
  }
};

/**
 * 检查登录状态，未登录则跳转到角色选择页
 * @returns {boolean} 是否已登录
 */
const checkLogin = () => {
  if (!isLoggedIn()) {
    wx.reLaunch({ url: '/pages/role-select/index' });
    return false;
  }
  return true;
};

/**
 * 根据角色获取首页路径
 * @param {string} role
 * @returns {string}
 */
const getHomePageByRole = (role) => {
  const roleMap = {
    parent: '/pages/parent/index/index',
    teacher: '/pages/teacher/index/index',
    admin: '/pages/admin/index/index'
  };
  return roleMap[role] || '/pages/role-select/index';
};

/**
 * 跳转到首页（根据角色）
 */
const navigateToHome = () => {
  const role = getUserRole();
  const url = getHomePageByRole(role);
  wx.reLaunch({ url });
};

/**
 * 跳转到角色选择页（登录后统一入口）
 */
const navigateToRoleSelect = () => {
  wx.reLaunch({ url: '/pages/role-select/index' });
};

module.exports = {
  isLoggedIn,
  getUserInfo,
  getUserRole,
  getToken,
  saveLoginInfo,
  clearLoginInfo,
  checkLogin,
  getHomePageByRole,
  navigateToHome,
  navigateToRoleSelect
};
