/**
 * 认证工具
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
 * 获取当前用户信息
 * @returns {object|null}
 */
const getUserInfo = () => {
  return wx.getStorageSync('userInfo') || null;
};

/**
 * 获取当前用户角色
 * @returns {string|null} 'parent' | 'teacher' | 'admin' | null
 */
const getUserRole = () => {
  const userInfo = getUserInfo();
  return userInfo ? userInfo.role : null;
};

/**
 * 获取token
 * @returns {string|null}
 */
const getToken = () => {
  return wx.getStorageSync('token') || null;
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
  app.globalData.token = token;
  app.globalData.userInfo = userInfo;
};

/**
 * 清除登录信息
 */
const clearLoginInfo = () => {
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
  const app = getApp();
  app.globalData.token = null;
  app.globalData.userInfo = null;
};

/**
 * 检查登录状态，未登录则跳转到登录页
 * @returns {boolean}
 */
const checkLogin = () => {
  if (!isLoggedIn()) {
    wx.redirectTo({
      url: '/pages/login/login'
    });
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
  const pages = {
    parent: '/pages/parent/index/index',
    teacher: '/pages/teacher/index/index',
    admin: '/pages/admin/index/index'
  };
  return pages[role] || '/pages/login/login';
};

/**
 * 跳转到角色对应的首页
 * @param {string} role
 */
const navigateToHome = (role) => {
  const url = getHomePageByRole(role);
  if (role === 'parent') {
    wx.switchTab({ url });
  } else {
    wx.reLaunch({ url });
  }
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
  navigateToHome
};
