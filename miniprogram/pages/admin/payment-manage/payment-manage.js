const adminService = require('../../../services/admin');
const authUtil = require('../../../utils/auth');
const { formatDateTime, formatMoney } = require('../../../utils/util');

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (Array.isArray(data.list)) return data.list;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.records)) return data.records;
  return [];
};

Page({
  data: {
    list: [],
    loading: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    this.setData({ loading: true });
    try {
      const res = await adminService.getOrders({ page: 1, pageSize: 50 });
      const list = normalizeList(res.data).map(o => ({
        ...o,
        dateText: formatDateTime(o.createdAt || o.created_at),
        amountText: '¥' + formatMoney(o.amount || o.total_amount || 0)
      }));
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async onTapDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    try {
      const res = await adminService.getOrderDetail(id);
      const d = res.data || {};
      const content = [
        '订单号：' + (d.id || ''),
        '状态：' + (d.status || ''),
        '金额：¥' + formatMoney(d.amount || d.total_amount || 0),
        '创建：' + formatDateTime(d.createdAt || d.created_at)
      ].join('\n');
      wx.showModal({ title: '订单详情', content, showCancel: false });
    } catch (e2) {
      wx.showToast({ title: '加载详情失败', icon: 'none' });
    }
  }
});
