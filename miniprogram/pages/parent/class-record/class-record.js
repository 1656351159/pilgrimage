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
    userInfo: {},
    children: [],
    childIndex: 0,
    selectedChild: {},
    records: [],
    loadingChildren: true,
    loadingList: true,
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    const userInfo = authUtil.getUserInfo();
    this.setData({ userInfo });
    this.loadChildren();
  },

  onPullDownRefresh() {
    this.reload().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadMore();
  },

  async reload() {
    await this.loadChildren();
  },

  async loadChildren() {
    this.setData({ loadingChildren: true });
    try {
      const res = await parentService.getChildren();
      const children = normalizeList(res.data);
      const childIndex = Math.min(this.data.childIndex, Math.max(children.length - 1, 0));
      const selectedChild = children[childIndex] || {};
      this.setData({ children, childIndex, selectedChild, loadingChildren: false });
      if (children.length > 0) {
        await this.loadRecords({ reset: true });
      } else {
        this.setData({ records: [], loadingList: false, hasMore: false });
      }
    } catch (e) {
      this.setData({ loadingChildren: false, loadingList: false });
    }
  },

  async loadRecords({ reset } = { reset: false }) {
    const child = this.data.children[this.data.childIndex];
    if (!child) return;

    const page = reset ? 1 : this.data.page;
    this.setData({ loadingList: true });
    try {
      const res = await parentService.getClassRecords(child.id, { page, pageSize: this.data.pageSize });
      const list = normalizeList(res.data).map(item => ({
        ...item,
        dateText: formatDate(item.createdAt || item.date)
      }));
      const next = reset ? list : this.data.records.concat(list);
      const hasMore = list.length >= this.data.pageSize;
      this.setData({
        records: next,
        page: page + 1,
        hasMore,
        loadingList: false
      });
    } catch (e) {
      this.setData({ loadingList: false });
    }
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loadingList) return;
    this.loadRecords({ reset: false });
  },

  onChildPickerChange(e) {
    const childIndex = Number(e.detail.value) || 0;
    const selectedChild = this.data.children[childIndex] || {};
    this.setData({ childIndex, selectedChild });
    this.loadRecords({ reset: true });
  }
});
