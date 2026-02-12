const teacherService = require('../../../services/teacher');
const authUtil = require('../../../utils/auth');

Page({
  data: {
    userInfo: {},
    stats: {
      studentCount: 0,
      todayClasses: 0,
      reportCount: 0
    },
    todaySchedule: [],
    loadingSchedule: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    const userInfo = authUtil.getUserInfo();
    this.setData({ userInfo });
  },

  onShow() {
    this.loadPageData();
  },

  /**
   * 加载页面数据
   */
  async loadPageData() {
    this.setData({ loadingSchedule: true });
    try {
      const res = await teacherService.getTodaySchedule();
      const schedule = res.data || [];
      this.setData({
        todaySchedule: schedule,
        loadingSchedule: false,
        'stats.todayClasses': schedule.length
      });
    } catch (err) {
      console.error('加载今日课程失败:', err);
      this.setData({ loadingSchedule: false });
    }
  },

  /**
   * 跳转到记录消课
   */
  goToConsumeClass() {
    wx.navigateTo({
      url: '/pages/teacher/consume-class/consume-class'
    });
  },

  /**
   * 跳转到写成长报告
   */
  goToWriteReport() {
    wx.navigateTo({
      url: '/pages/teacher/write-report/write-report'
    });
  },

  /**
   * 跳转到学生列表
   */
  goToStudents() {
    wx.navigateTo({
      url: '/pages/teacher/consume-class/consume-class'
    });
  },

  /**
   * 跳转到课程管理
   */
  goToCourseManage() {
    wx.navigateTo({
      url: '/pages/teacher/course-manage/course-manage'
    });
  }
});
