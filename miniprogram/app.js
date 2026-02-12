App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:3000/api'
  },
  onLaunch() {
    // 强制清理可能残留的旧配置缓存
    try {
      wx.removeStorageSync('baseUrl');
    } catch (e) {
      console.error('清理缓存失败', e);
    }

    // 打印当前环境配置，确认代码已更新
    console.log('== 当前环境配置 ==');
    console.log('Base URL:', this.globalData.baseUrl);
    console.log('如果上方 Base URL 不是 localhost，请检查 app.js');
    console.log('如果请求报错“合法域名校验出错”，请在开发者工具详情-本地设置中勾选“不校验合法域名”');
    console.log('==================');

    // 检查登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  }
})
