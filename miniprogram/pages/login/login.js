const authService = require('../../services/auth');
const authUtil = require('../../utils/auth');
const { showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    phone: '',
    password: '',
    canSubmit: false,
    loading: false
  },

  onLoad() {
    // 如果已登录，直接跳转到首页
    if (authUtil.isLoggedIn()) {
      const role = authUtil.getUserRole();
      authUtil.navigateToHome(role);
    }
  },

  /**
   * 手机号输入
   */
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value,
      canSubmit: e.detail.value.length === 11 && this.data.password.length >= 6
    });
  },

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value,
      canSubmit: this.data.phone.length === 11 && e.detail.value.length >= 6
    });
  },

  /**
   * 微信一键登录
   */
  async onWxLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      // 获取微信登录 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      // 调用后端登录接口
      const res = await authService.login(loginRes.code);
      const { token, userInfo } = res.data;

      // 保存登录信息
      authUtil.saveLoginInfo(token, userInfo);
      showSuccess('登录成功');

      // 跳转到对应角色首页
      setTimeout(() => {
        authUtil.navigateToHome(userInfo.role);
      }, 500);
    } catch (err) {
      console.error('微信登录失败:', err);
      showError('登录失败，请重试');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 手机号密码登录
   */
  async onPhoneLogin() {
    if (!this.data.canSubmit || this.data.loading) return;

    const { phone, password } = this.data;

    // 简单校验
    if (!/^1\d{10}$/.test(phone)) {
      showError('请输入正确的手机号');
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await authService.loginByPhone(phone, password);
      const { token, userInfo } = res.data;

      // 保存登录信息
      authUtil.saveLoginInfo(token, userInfo);
      showSuccess('登录成功');

      // 跳转到对应角色首页
      setTimeout(() => {
        authUtil.navigateToHome(userInfo.role);
      }, 500);
    } catch (err) {
      console.error('手机号登录失败:', err);
      showError(err.message || '登录失败，请重试');
    } finally {
      this.setData({ loading: false });
    }
  }
})
