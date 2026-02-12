const paymentService = require('../../../services/payment');
const authUtil = require('../../../utils/auth');
const { formatDate, formatMoney } = require('../../../utils/util');

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (Array.isArray(data.list)) return data.list;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.records)) return data.records;
  return [];
};

const renderValue = (coupon) => {
  const type = coupon.type || coupon.coupon_type;
  const value = Number(coupon.value || coupon.amount || 0);
  if (type === 'percent') return String(value) + '%';
  return '¥' + formatMoney(value);
};

Page({
  data: {
    coupons: [],
    loading: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
  },

  onShow() {
    this.loadCoupons();
  },

  onPullDownRefresh() {
    this.loadCoupons().finally(() => wx.stopPullDownRefresh());
  },

  async loadCoupons() {
    this.setData({ loading: true });
    try {
      const res = await paymentService.getCoupons();
      const list = normalizeList(res.data).map(item => ({
        ...item,
        valueText: renderValue(item),
        expireText: formatDate(item.expire_date || item.expireDate || item.expire_at)
      }));
      this.setData({ coupons: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  }
});
