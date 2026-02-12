/**
 * 统一请求封装
 */

const baseUrl = 'http://localhost:3000/api';

let requestCount = 0;

const resolveBaseUrl = () => {
  const app = getApp();
  // 优先使用 globalData，其次是文件顶部的默认 baseUrl
  // 移除 wx.getStorageSync('baseUrl') 以防止旧缓存干扰
  return (app && app.globalData && app.globalData.baseUrl) || baseUrl;
};

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
  if (requestCount <= 0) return;
  
  requestCount--;
  if (requestCount === 0) {
    wx.hideLoading().catch((err) => {
      // 忽略 hideLoading 可能的报错（如未 show 就 hide）
      console.warn('hideLoading error ignored:', err);
    });
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

  const headers = {
    'Content-Type': 'application/json',
    ...header
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${resolveBaseUrl()}${url}`,
      method,
      data,
      header: headers,
      timeout: 15000,
      success(res) {
        const resData = res.data || {};

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (resData.code === 0 || resData.code === 200) {
            resolve(resData);
          } else {
            wx.showToast({
              title: resData.message || '请求失败',
              icon: 'none'
            });
            reject(resData);
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
          const message =
            typeof resData === 'object' && resData && resData.message
              ? resData.message
              : `请求失败(${res.statusCode})`;
          wx.showToast({
            title: message,
            icon: 'none'
          });
          reject({ code: res.statusCode, message, data: resData });
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
