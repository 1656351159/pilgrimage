/**
 * 支付服务
 */
const { get, post } = require('./request');

/**
 * 创建订单
 * @param {object} data
 * @param {string|number} data.courseId - 课程ID
 * @param {string|number} data.childId - 子女ID
 * @param {string|number} [data.couponId] - 优惠券ID
 * @param {number} data.quantity - 购买数量（课时数）
 * @returns {Promise}
 */
const createOrder = (data) => {
  return post('/payment/orders', data);
};

/**
 * 获取订单列表
 * @param {object} params
 * @returns {Promise}
 */
const getOrders = (params = {}) => {
  return get('/payment/orders', params);
};

/**
 * 获取订单详情
 * @param {string|number} orderId
 * @returns {Promise}
 */
const getOrderDetail = (orderId) => {
  return get(`/payment/orders/${orderId}`);
};

/**
 * 获取可用优惠券列表
 * @param {object} params - { courseId }
 * @returns {Promise}
 */
const getCoupons = (params = {}) => {
  return get('/payment/coupons', params);
};

/**
 * 发起微信支付
 * @param {string|number} orderId
 * @returns {Promise}
 */
const wxPay = (orderId) => {
  return post(`/payment/orders/${orderId}/pay`);
};

/**
 * 调用微信支付
 * @param {object} payParams - 后端返回的支付参数
 * @returns {Promise}
 */
const invokeWxPay = (payParams) => {
  return new Promise((resolve, reject) => {
    wx.requestPayment({
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType || 'MD5',
      paySign: payParams.paySign,
      success(res) {
        resolve(res);
      },
      fail(err) {
        reject(err);
      }
    });
  });
};

module.exports = {
  createOrder,
  getOrders,
  getOrderDetail,
  getCoupons,
  wxPay,
  invokeWxPay
};
