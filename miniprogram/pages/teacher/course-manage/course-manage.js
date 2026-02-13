const teacherService = require('../../../services/teacher');
const authUtil = require('../../../utils/auth');
const { formatMoney } = require('../../../utils/util');

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
    courses: [],
    loading: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.loadCourses();
  },

  onPullDownRefresh() {
    this.loadCourses().finally(() => wx.stopPullDownRefresh());
  },

  async loadCourses() {
    this.setData({ loading: true });
    try {
      const res = await teacherService.getCourses();
      const list = normalizeList(res.data).map(c => ({
        ...c,
        priceText: '¥' + formatMoney(c.price || 0)
      }));
      this.setData({ courses: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  }
});
