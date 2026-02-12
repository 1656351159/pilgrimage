const teacherService = require('../../../services/teacher');
const authUtil = require('../../../utils/auth');
const { formatDate, formatTime } = require('../../../utils/util');

const getFirstChar = (value, fallback) => {
  const str = (value || '').toString();
  return str ? str.slice(0, 1) : fallback;
};

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
    avatarText: '',
    schedule: [],
    loading: false
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    const userInfo = authUtil.getUserInfo() || {};
    this.setData({
      userInfo,
      avatarText: getFirstChar(userInfo.name || userInfo.nickname, '师')
    });
  },

  onShow() {
    this.loadToday();
  },

  onPullDownRefresh() {
    this.loadToday().finally(() => wx.stopPullDownRefresh());
  },

  async loadToday() {
    this.setData({ loading: true });
    try {
      const res = await teacherService.getTodaySchedule();
      const list = normalizeList(res.data).map(item => ({
        ...item,
        dateText: formatDate(item.date || item.start_time || item.startTime),
        timeText: formatTime(item.start_time || item.startTime || item.date)
      }));
      this.setData({ schedule: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  goConsume() {
    wx.navigateTo({ url: '/pages/teacher/consume-class/consume-class' });
  },

  goReport() {
    wx.navigateTo({ url: '/pages/teacher/write-report/write-report' });
  },

  goCourse() {
    wx.navigateTo({ url: '/pages/teacher/course-manage/course-manage' });
  }
});
