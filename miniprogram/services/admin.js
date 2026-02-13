/**
 * 管理员端服务
 */
const { get, post, put, del } = require('./request');

// ====== 用户管理 ======

/**
 * 获取用户列表
 * @param {object} params - 查询参数 { page, pageSize, keyword, role }
 * @returns {Promise}
 */
const getUsers = (params = {}) => {
  return get('/admin/users', params);
};

/**
 * 创建用户
 * @param {object} data
 * @returns {Promise}
 */
const createUser = (data) => {
  return post('/admin/users', data);
};

/**
 * 更新用户
 * @param {string|number} id
 * @param {object} data
 * @returns {Promise}
 */
const updateUser = (id, data) => {
  return put(`/admin/users/${id}`, data);
};

/**
 * 删除用户
 * @param {string|number} id
 * @returns {Promise}
 */
const deleteUser = (id) => {
  return del(`/admin/users/${id}`);
};

// ====== 课程管理 ======

/**
 * 获取课程列表
 * @param {object} params
 * @returns {Promise}
 */
const getCourses = (params = {}) => {
  return get('/admin/courses', params);
};

/**
 * 创建课程
 * @param {object} data
 * @returns {Promise}
 */
const createCourse = (data) => {
  return post('/admin/courses', data);
};

/**
 * 更新课程
 * @param {string|number} id
 * @param {object} data
 * @returns {Promise}
 */
const updateCourse = (id, data) => {
  return put(`/admin/courses/${id}`, data);
};

/**
 * 删除课程
 * @param {string|number} id
 * @returns {Promise}
 */
const deleteCourse = (id) => {
  return del(`/admin/courses/${id}`);
};

// ====== 订单管理 ======

/**
 * 获取订单列表
 * @param {object} params - { page, pageSize, status, keyword }
 * @returns {Promise}
 */
const getOrders = (params = {}) => {
  return get('/admin/orders', params);
};

/**
 * 获取订单详情
 * @param {string|number} id
 * @returns {Promise}
 */
const getOrderDetail = (id) => {
  return get(`/admin/orders/${id}`);
};

// ====== 优惠券管理 ======

/**
 * 获取优惠券列表
 * @param {object} params
 * @returns {Promise}
 */
const getCoupons = (params = {}) => {
  return get('/admin/coupons', params);
};

/**
 * 创建优惠券
 * @param {object} data
 * @returns {Promise}
 */
const createCoupon = (data) => {
  return post('/admin/coupons', data);
};

/**
 * 更新优惠券
 * @param {string|number} id
 * @param {object} data
 * @returns {Promise}
 */
const updateCoupon = (id, data) => {
  return put(`/admin/coupons/${id}`, data);
};

/**
 * 删除优惠券
 * @param {string|number} id
 * @returns {Promise}
 */
const deleteCoupon = (id) => {
  return del(`/admin/coupons/${id}`);
};

// ====== 统计数据 ======

/**
 * 获取统计概览
 * @returns {Promise}
 */
const getStats = () => {
  return get('/admin/stats');
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getOrders,
  getOrderDetail,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getStats
};
