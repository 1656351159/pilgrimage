/**
 * 家长端服务
 */
const { get } = require('./request');

/**
 * 获取子女列表
 * @returns {Promise}
 */
const getChildren = () => {
  return get('/parent/children');
};

/**
 * 获取子女课时消耗记录
 * @param {string|number} childId - 子女ID
 * @param {object} params - 查询参数
 * @returns {Promise}
 */
const getClassRecords = (childId, params = {}) => {
  return get(`/parent/children/${childId}/class-records`, params);
};

/**
 * 获取子女成长报告
 * @param {string|number} childId - 子女ID
 * @param {object} params - 查询参数
 * @returns {Promise}
 */
const getGrowthReports = (childId, params = {}) => {
  return get(`/parent/children/${childId}/growth-reports`, params);
};

/**
 * 获取成长报告详情
 * @param {string|number} reportId - 报告ID
 * @returns {Promise}
 */
const getGrowthReportDetail = (reportId) => {
  return get(`/parent/growth-reports/${reportId}`);
};

/**
 * 获取子女课程报名信息
 * @param {string|number} childId - 子女ID
 * @returns {Promise}
 */
const getEnrollments = (childId) => {
  return get(`/parent/children/${childId}/enrollments`);
};

/**
 * 获取可报名的课程列表
 * @returns {Promise}
 */
const getAvailableCourses = () => {
  return get('/parent/courses');
};

/**
 * 获取订单列表
 * @returns {Promise}
 */
const getOrders = () => {
  return get('/parent/orders');
};

module.exports = {
  getChildren,
  getClassRecords,
  getGrowthReports,
  getGrowthReportDetail,
  getEnrollments,
  getAvailableCourses,
  getOrders
};
