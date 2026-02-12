const parentService = require('../../../services/parent');
const authUtil = require('../../../utils/auth');
const { formatDate } = require('../../../utils/util');

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
    childId: null,
    childName: '',
    reports: [],
    loading: true
  },

  onLoad(options) {
    if (!authUtil.checkLogin()) return;
    const childId = options.childId ? String(options.childId) : null;
    const childName = options.childName ? decodeURIComponent(options.childName) : '';
    this.setData({ childId, childName });
    this.loadReports();
  },

  onPullDownRefresh() {
    this.loadReports().finally(() => wx.stopPullDownRefresh());
  },

  async loadReports() {
    if (!this.data.childId) {
      this.setData({ loading: false, reports: [] });
      return;
    }
    this.setData({ loading: true });
    try {
      const res = await parentService.getGrowthReports(this.data.childId, { page: 1, pageSize: 50 });
      const list = normalizeList(res.data).map(item => ({
        ...item,
        dateText: formatDate(item.createdAt || item.created_at || item.date)
      }));
      this.setData({ reports: list, loading: false });
      if (this.data.childName) {
        wx.setNavigationBarTitle({ title: this.data.childName + '的成长报告' });
      }
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async onTapReport(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    try {
      const res = await parentService.getGrowthReportDetail(id);
      const detail = res.data || {};
      const title = detail.title || detail.report_title || '成长报告';
      const content = String(detail.content || detail.report_content || '').trim();
      wx.showModal({
        title,
        content: content.length > 600 ? content.slice(0, 600) + '...' : content || '暂无内容',
        showCancel: false
      });
    } catch (e2) {
      wx.showToast({ title: '加载详情失败', icon: 'none' });
    }
  }
});
