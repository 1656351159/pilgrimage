const parentService = require('../../../services/parent');
const authUtil = require('../../../utils/auth');
const { formatDate } = require('../../../utils/util');

Page({
  data: {
    userInfo: {},
    children: [],
    currentChildIndex: 0,
    recentRecords: [],
    loadingChildren: true,
    loadingRecords: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    const userInfo = authUtil.getUserInfo();
    this.setData({ userInfo });
  },

  onShow() {
    this.loadChildren();
  },

  onPullDownRefresh() {
    this.loadChildren().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载子女列表
   */
  async loadChildren() {
    this.setData({ loadingChildren: true });
    try {
      const res = await parentService.getChildren();
      const children = res.data || [];
      this.setData({
        children,
        loadingChildren: false
      });
      if (children.length > 0) {
        this.loadRecentRecords(children[this.data.currentChildIndex].id);
      } else {
        this.setData({ loadingRecords: false });
      }
    } catch (err) {
      console.error('加载子女列表失败:', err);
      this.setData({ loadingChildren: false, loadingRecords: false });
    }
  },

  /**
   * 加载最近课时记录
   */
  async loadRecentRecords(childId) {
    this.setData({ loadingRecords: true });
    try {
      const res = await parentService.getClassRecords(childId, { page: 1, pageSize: 5 });
      const records = (res.data || []).map(item => ({
        ...item,
        date: formatDate(item.createdAt || item.date)
      }));
      this.setData({
        recentRecords: records,
        loadingRecords: false
      });
    } catch (err) {
      console.error('加载课时记录失败:', err);
      this.setData({ loadingRecords: false });
    }
  },

  /**
   * 选择子女
   */
  onSelectChild(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentChildIndex: index });
    this.loadRecentRecords(this.data.children[index].id);
  },

  /**
   * 跳转到课时记录
   */
  goToClassRecord() {
    wx.switchTab({
      url: '/pages/parent/class-record/class-record'
    });
  },

  /**
   * 跳转到成长报告
   */
  goToGrowthReport() {
    const child = this.data.children[this.data.currentChildIndex];
    if (!child) {
      wx.showToast({ title: '请先添加孩子', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/parent/growth-report/growth-report?childId=${child.id}&childName=${child.name}`
    });
  },

  /**
   * 跳转到课程购买
   */
  goToPayment() {
    wx.navigateTo({
      url: '/pages/parent/payment/payment'
    });
  },

  /**
   * 跳转到优惠券
   */
  goToCoupons() {
    wx.switchTab({
      url: '/pages/parent/coupons/coupons'
    });
  }
})
