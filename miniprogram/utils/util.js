/**
 * 工具函数
 */

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期对象、时间戳或日期字符串
 * @param {string} format - 格式模板，默认 'YYYY-MM-DD'
 * @returns {string}
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  const seconds = padZero(date.getSeconds());

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 格式化时间为 HH:mm
 * @param {Date|string|number} date
 * @returns {string}
 */
const formatTime = (date) => {
  return formatDate(date, 'HH:mm');
};

/**
 * 格式化日期时间
 * @param {Date|string|number} date
 * @returns {string}
 */
const formatDateTime = (date) => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
};

/**
 * 补零
 * @param {number} num
 * @returns {string}
 */
const padZero = (num) => {
  return String(num).padStart(2, '0');
};

/**
 * 获取相对时间描述
 * @param {Date|string|number} date
 * @returns {string}
 */
const getRelativeTime = (date) => {
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date);
  }
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(date);
};

/**
 * 格式化金额
 * @param {number} amount - 金额（分）
 * @returns {string}
 */
const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return (amount / 100).toFixed(2);
};

/**
 * 防抖函数
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
const debounce = (fn, delay = 300) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

/**
 * 节流函数
 * @param {Function} fn
 * @param {number} interval
 * @returns {Function}
 */
const throttle = (fn, interval = 300) => {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
};

/**
 * 显示成功提示
 * @param {string} title
 */
const showSuccess = (title) => {
  wx.showToast({ title, icon: 'success' });
};

/**
 * 显示错误提示
 * @param {string} title
 */
const showError = (title) => {
  wx.showToast({ title, icon: 'none' });
};

module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
  padZero,
  getRelativeTime,
  formatMoney,
  debounce,
  throttle,
  showSuccess,
  showError
};
