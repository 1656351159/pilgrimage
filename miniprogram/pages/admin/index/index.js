const adminService = require('../../../services/admin');
const authUtil = require('../../../utils/auth');

Page({
  data: {
    userInfo: {},
    stats: {
      userCount: 0,
      studentCount: 0,
      courseCount: 0,
      orderCount: 0
    },
    loadingStats: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    const userInfo = authUtil.getUserInfo();
    this.setData({ userInfo });
  },

  onShow() {
    this.loadStats();
  },

  /**
   * 加载统计数据
   */
  async loadStats() {
    this.setData({ loadingStats: true });
    try {
      const res = await adminService.getStats();
      this.setData({
        stats: res.data || {},
        loadingStats: false
      });
    } catch (err) {
      console.error('加载统计数据失败:', err);
      this.setData({ loadingStats: false });
    }
  },

  /**
   * 跳转到用户管理
   */
  goToUserManage() {
    wx.navigateTo({
      url: '/pages/admin/user-manage/user-manage'
    });
  },

  /**
   * 跳转到课程管理
   */
  goToCourseManage() {
    wx.navigateTo({
      url: '/pages/admin/course-manage/course-manage'
    });
  },

  /**
   * 跳转到订单管理
   */
  goToPaymentManage() {
    wx.navigateTo({
      url: '/pages/admin/payment-manage/payment-manage'
    });
  },

  /**
   * 跳转到优惠券管理
   */
  goToCouponManage() {
    wx.navigateTo({
      url: '/pages/admin/coupon-manage/coupon-manage'
    });
  }
});
