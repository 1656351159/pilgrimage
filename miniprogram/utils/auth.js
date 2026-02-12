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
  navigateToRoleSelect // 新增：统一跳到角色选择页
};