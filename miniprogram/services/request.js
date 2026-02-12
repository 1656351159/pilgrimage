/**
 * 统一请求封装
 */

const baseUrl = 'https://your-api-domain.com/api';

let requestCount = 0;

/**
 * 显示加载状态
 */
const showLoading = () => {
  if (requestCount === 0) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
  }
  requestCount++;
};

/**
 * 隐藏加载状态
 */
const hideLoading = () => {
  requestCount--;
  if (requestCount <= 0) {
    requestCount = 0;
    wx.hideLoading();
  }
};

/**
 * 发起请求
 * @param {object} options - 请求配置
 * @param {string} options.url - 请求路径（不含 baseUrl）
 * @param {string} options.method - 请求方法，默认 GET
 * @param {object} options.data - 请求数据
 * @param {boolean} options.loading - 是否显示加载提示，默认 true
 * @param {object} options.header - 额外请求头
 * @returns {Promise}
 */
const request = (options = {}) => {
  const {
    url,
    method = 'GET',
    data = {},
    loading = true,
    header = {}
  } = options;

  const app = getApp();
  const token = app.globalData.token || wx.getStorageSync('token');

  if (loading) {
    showLoading();
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.baseUrl || baseUrl}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...header
      },
      success(res) {
        if (res.statusCode === 200) {
          if (res.data.code === 0 || res.data.code === 200) {
            resolve(res.data);
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            });
            reject(res.data);
          }
        } else if (res.statusCode === 401) {
          // 未授权，清除登录状态并跳转到登录页
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          app.globalData.token = null;
          app.globalData.userInfo = null;
          wx.redirectTo({
            url: '/pages/login/login'
          });
          reject({ code: 401, message: '登录已过期，请重新登录' });
        } else {
          wx.showToast({
            title: `请求失败(${res.statusCode})`,
            icon: 'none'
          });
          reject({ code: res.statusCode, message: '请求失败' });
        }
      },
      fail(err) {
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        });
        reject({ code: -1, message: '网络连接失败', error: err });
      },
      complete() {
        if (loading) {
          hideLoading();
        }
      }
    });
  });
};

/**
 * GET 请求
 */
const get = (url, data, options = {}) => {
  return request({ url, method: 'GET', data, ...options });
};

/**
 * POST 请求
 */
const post = (url, data, options = {}) => {
  return request({ url, method: 'POST', data, ...options });
};

/**
 * PUT 请求
 */
const put = (url, data, options = {}) => {
  return request({ url, method: 'PUT', data, ...options });
};

/**
 * DELETE 请求
 */
const del = (url, data, options = {}) => {
  return request({ url, method: 'DELETE', data, ...options });
};

module.exports = {
  request,
  get,
  post,
  put,
  del
};
