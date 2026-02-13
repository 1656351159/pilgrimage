/**
 * 认证工具函数
 */

/**
 * 判断是否已登录
 * @returns {boolean}
 */
const isLoggedIn = () => {
  try {
    const token = wx.getStorageSync('token');
    const app = getApp();
    return !!(token || (app && app.globalData && app.globalData.token));
  } catch (e) {
    return false;
  }
};

/**
 * 获取用户信息
 * @returns {object|null}
 */
const getUserInfo = () => {
  try {
    const app = getApp();
    if (app && app.globalData && app.globalData.userInfo) {
      return app.globalData.userInfo;
    }
    return wx.getStorageSync('userInfo') || null;
  } catch (e) {
    return null;
  }
};

/**
 * 获取用户角色
 * @returns {string|null}
 */
const getUserRole = () => {
  try {
    const app = getApp();
    if (app && app.globalData && app.globalData.role) {
      return app.globalData.role;
    }
    return wx.getStorageSync('role') || null;
  } catch (e) {
    return null;
  }
};

/**
 * 获取 Token
 * @returns {string|null}
 */
const getToken = () => {
  try {
    const app = getApp();
    if (app && app.globalData && app.globalData.token) {
      return app.globalData.token;
    }
    return wx.getStorageSync('token') || null;
  } catch (e) {
    return null;
  }
};

/**
 * 保存登录信息
 * @param {string} token
 * @param {object} userInfo
 * @param {string} [role]
 */
const saveLoginInfo = (token, userInfo, role) => {
  try {
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
    if (role) {
      wx.setStorageSync('role', role);
    }
    const app = getApp();
    if (app) {
      app.globalData.token = token;
      app.globalData.userInfo = userInfo;
      if (role) {
        app.globalData.role = role;
      }
    }
  } catch (e) {
    console.error('保存登录信息失败:', e);
  }
};

/**
 * 清除登录信息
 */
const clearLoginInfo = () => {
  try {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('role');
    const app = getApp();
    if (app) {
      app.globalData.token = null;
      app.globalData.userInfo = null;
      app.globalData.role = null;
    }
  } catch (e) {
    console.error('清除登录信息失败:', e);
  }
};

/**
 * 检查登录状态，未登录则跳转到登录页
 * @returns {boolean} 是否已登录
 */
const checkLogin = () => {
  if (!isLoggedIn()) {
    wx.reLaunch({ url: '/pages/login/login' });
    return false;
  }
  return true;
};

/**
 * 根据角色获取首页路径
 * @param {string} role - parent / teacher / admin
 * @returns {string}
 */
const getHomePageByRole = (role) => {
  const pages = {
    parent: '/pages/parent/index/index',
    teacher: '/pages/teacher/index/index',
    admin: '/pages/admin/index/index'
  };
  return pages[role] || '/pages/role-select/index';
};

/**
 * 跳转到对应角色首页
 * @param {string} role - parent / teacher / admin
 */
const navigateToHome = (role) => {
  const url = getHomePageByRole(role);
  if (role === 'parent') {
    // 家长端首页是 tabBar 页面，使用 switchTab
    wx.switchTab({ url });
  } else {
    wx.reLaunch({ url });
  }
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
