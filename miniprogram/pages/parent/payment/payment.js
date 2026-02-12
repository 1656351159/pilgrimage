const parentService = require('../../../services/parent');
const paymentService = require('../../../services/payment');
const authUtil = require('../../../utils/auth');
const { showSuccess, showError, formatMoney } = require('../../../utils/util');

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
    children: [],
    childIndex: 0,
    selectedChild: {},
    courses: [],
    courseIndex: 0,
    selectedCourse: {},
    coupons: [],
    couponIndex: 0,
    selectedCoupon: {},
    quantity: 1,
    loading: true,
    creating: false
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.init();
  },

  onPullDownRefresh() {
    this.init().finally(() => wx.stopPullDownRefresh());
  },

  async init() {
    this.setData({ loading: true });
    try {
      const [childrenRes, coursesRes] = await Promise.all([
        parentService.getChildren(),
        parentService.getAvailableCourses()
      ]);
      const children = normalizeList(childrenRes.data);
      const courses = normalizeList(coursesRes.data).map(c => ({
        ...c,
        priceText: '¥' + formatMoney(c.price || 0)
      }));
      const childIndex = Math.min(this.data.childIndex, Math.max(children.length - 1, 0));
      const courseIndex = Math.min(this.data.courseIndex, Math.max(courses.length - 1, 0));
      const selectedChild = children[childIndex] || {};
      const selectedCourse = courses[courseIndex] || {};
      this.setData({
        children,
        courses,
        childIndex,
        courseIndex,
        selectedChild,
        selectedCourse,
        loading: false
      });
      await this.loadCoupons();
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async loadCoupons() {
    const course = this.data.courses[this.data.courseIndex];
    if (!course) {
      const coupons = [{ id: '', name: '不使用优惠券' }];
      this.setData({ coupons, couponIndex: 0, selectedCoupon: coupons[0] });
      return;
    }
    try {
      const res = await paymentService.getCoupons({ courseId: course.id });
      const list = normalizeList(res.data);
      const coupons = [{ id: '', name: '不使用优惠券' }].concat(list);
      this.setData({ coupons, couponIndex: 0, selectedCoupon: coupons[0] });
    } catch (e) {
      const coupons = [{ id: '', name: '不使用优惠券' }];
      this.setData({ coupons, couponIndex: 0, selectedCoupon: coupons[0] });
    }
  },

  onChildChange(e) {
    const childIndex = Number(e.detail.value) || 0;
    const selectedChild = this.data.children[childIndex] || {};
    this.setData({ childIndex, selectedChild });
  },

  onCourseChange(e) {
    const courseIndex = Number(e.detail.value) || 0;
    const selectedCourse = this.data.courses[courseIndex] || {};
    this.setData({ courseIndex, selectedCourse });
    this.loadCoupons();
  },

  onCouponChange(e) {
    const couponIndex = Number(e.detail.value) || 0;
    const selectedCoupon = this.data.coupons[couponIndex] || {};
    this.setData({ couponIndex, selectedCoupon });
  },

  onQuantityInput(e) {
    const v = Number(e.detail.value);
    this.setData({ quantity: Number.isFinite(v) && v > 0 ? v : 1 });
  },

  async onSubmit() {
    if (this.data.creating) return;
    const child = this.data.children[this.data.childIndex];
    const course = this.data.courses[this.data.courseIndex];
    if (!child) return showError('请先选择孩子');
    if (!course) return showError('暂无可购买课程');

    const coupon = this.data.coupons[this.data.couponIndex];
    const data = {
      courseId: course.id,
      childId: child.id,
      quantity: this.data.quantity
    };
    if (coupon && coupon.id) data.couponId = coupon.id;

    this.setData({ creating: true });
    try {
      const orderRes = await paymentService.createOrder(data);
      const order = orderRes.data || {};
      const orderId = order.id || order.orderId || order.order_id;
      if (!orderId) throw new Error('创建订单失败');

      const payRes = await paymentService.wxPay(orderId);
      const payParams = payRes.data || payRes;
      await paymentService.invokeWxPay(payParams);
      showSuccess('支付成功');
      setTimeout(() => wx.navigateBack(), 400);
    } catch (e) {
      showError(e.message || '支付失败');
    } finally {
      this.setData({ creating: false });
    }
  }
});
