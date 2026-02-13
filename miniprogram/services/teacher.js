/**
 * 教师端服务
 */
const { get, post } = require('./request');

/**
 * 获取学生列表
 * @param {object} params - 查询参数
 * @returns {Promise}
 */
const getStudents = (params = {}) => {
  return get('/teacher/students', params);
};

/**
 * 创建课时消耗记录
 * @param {object} data
 * @param {string|number} data.studentId - 学生ID
 * @param {string|number} data.courseId - 课程ID
 * @param {number} data.hours - 消耗课时
 * @param {string} data.date - 上课日期
 * @param {string} data.notes - 备注
 * @returns {Promise}
 */
const createClassRecord = (data) => {
  return post('/teacher/class-records', data);
};

/**
 * 获取课时消耗记录列表
 * @param {object} params - 查询参数
 * @returns {Promise}
 */
const getClassRecords = (params = {}) => {
  return get('/teacher/class-records', params);
};

/**
 * 创建成长报告
 * @param {object} data
 * @param {string|number} data.studentId - 学生ID
 * @param {string|number} data.courseId - 课程ID
 * @param {string} data.title - 报告标题
 * @param {string} data.content - 报告内容
 * @param {string[]} data.images - 图片列表
 * @returns {Promise}
 */
const createGrowthReport = (data) => {
  return post('/teacher/growth-reports', data);
};

/**
 * 获取成长报告列表
 * @param {object} params - 查询参数
 * @returns {Promise}
 */
const getGrowthReports = (params = {}) => {
  return get('/teacher/growth-reports', params);
};

/**
 * 获取教师负责的课程列表
 * @returns {Promise}
 */
const getCourses = () => {
  return get('/teacher/courses');
};

/**
 * 获取今日课程安排
 * @returns {Promise}
 */
const getTodaySchedule = () => {
  return get('/teacher/schedule/today');
};

module.exports = {
  getStudents,
  createClassRecord,
  getClassRecords,
  createGrowthReport,
  getGrowthReports,
  getCourses,
  getTodaySchedule
};
