const adminService = require('../../../services/admin');
const authUtil = require('../../../utils/auth');

const getFirstChar = (value, fallback) => {
  const str = (value || '').toString();
  return str ? str.slice(0, 1) : fallback;
};

Page({
  data: {
    userInfo: {},
    stats: {},
    avatarText: '',
    loading: false
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    const userInfo = authUtil.getUserInfo() || {};
    this.setData({
      userInfo,
      avatarText: getFirstChar(userInfo.name || userInfo.nickname, '管')
    });
    this.loadStats();
  },

  onPullDownRefresh() {
    this.loadStats().finally(() => wx.stopPullDownRefresh());
  },

  async loadStats() {
    this.setData({ loading: true });
    try {
      const res = await adminService.getStats();
      this.setData({ stats: res.data || {}, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  goUsers() {
    wx.navigateTo({ url: '/pages/admin/user-manage/user-manage' });
  },

  goCourses() {
    wx.navigateTo({ url: '/pages/admin/course-manage/course-manage' });
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/admin/payment-manage/payment-manage' });
  },

  goCoupons() {
    wx.navigateTo({ url: '/pages/admin/coupon-manage/coupon-manage' });
  }
});
