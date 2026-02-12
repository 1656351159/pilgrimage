App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'https://your-api-domain.com/api'
  },
  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  }
})
