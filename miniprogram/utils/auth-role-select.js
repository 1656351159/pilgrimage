/**
 * 把角色选择页设为登录后的统一入口
 * 登录成功后直接跳到这里，让用户手动选端
 */
const navigateToRoleSelect = () => {
  wx.reLaunch({ url: '/pages/role-select/index' });
};

// 重新导出 auth.js 的完整实现，保持向后兼容
const authUtil = require('./auth');

module.exports = Object.assign({}, authUtil, {
  navigateToRoleSelect
});
