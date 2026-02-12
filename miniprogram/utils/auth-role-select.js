/**
 * 把角色选择页设为登录后的统一入口
 * 登录成功后直接跳到这里，让用户手动选端
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
  navigateToRoleSelect // 新增
};