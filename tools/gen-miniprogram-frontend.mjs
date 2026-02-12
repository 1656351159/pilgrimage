import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const miniprogramRoot = path.join(repoRoot, 'miniprogram');

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const writeFileIfMissing = (filePath, content) => {
  if (fs.existsSync(filePath)) return false;
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
};

const toMoneyYuan = (fen) => {
  const n = Number(fen);
  if (Number.isNaN(n)) return '0.00';
  return (n / 100).toFixed(2);
};

const pages = [
  {
    name: 'pages/parent/index/index',
    title: '家长端',
    js: null,
    wxml: null,
    wxss: null,
    json: `{
  "navigationBarTitleText": "家长端",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/parent/class-record/class-record',
    title: '课时记录',
    js: `const parentService = require('../../../services/parent');
const authUtil = require('../../../utils/auth');
const { formatDate } = require('../../../utils/util');

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
    userInfo: {},
    children: [],
    childIndex: 0,
    records: [],
    loadingChildren: true,
    loadingList: true,
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    const userInfo = authUtil.getUserInfo();
    this.setData({ userInfo });
    this.loadChildren();
  },

  onPullDownRefresh() {
    this.reload().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadMore();
  },

  async reload() {
    await this.loadChildren();
  },

  async loadChildren() {
    this.setData({ loadingChildren: true });
    try {
      const res = await parentService.getChildren();
      const children = normalizeList(res.data);
      const childIndex = Math.min(this.data.childIndex, Math.max(children.length - 1, 0));
      this.setData({ children, childIndex, loadingChildren: false });
      if (children.length > 0) {
        await this.loadRecords({ reset: true });
      } else {
        this.setData({ records: [], loadingList: false, hasMore: false });
      }
    } catch (e) {
      this.setData({ loadingChildren: false, loadingList: false });
    }
  },

  async loadRecords({ reset } = { reset: false }) {
    const child = this.data.children[this.data.childIndex];
    if (!child) return;

    const page = reset ? 1 : this.data.page;
    this.setData({ loadingList: true });
    try {
      const res = await parentService.getClassRecords(child.id, { page, pageSize: this.data.pageSize });
      const list = normalizeList(res.data).map(item => ({
        ...item,
        dateText: formatDate(item.createdAt || item.date)
      }));
      const next = reset ? list : this.data.records.concat(list);
      const hasMore = list.length >= this.data.pageSize;
      this.setData({
        records: next,
        page: page + 1,
        hasMore,
        loadingList: false
      });
    } catch (e) {
      this.setData({ loadingList: false });
    }
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loadingList) return;
    this.loadRecords({ reset: false });
  },

  onChildPickerChange(e) {
    const childIndex = Number(e.detail.value) || 0;
    this.setData({ childIndex });
    this.loadRecords({ reset: true });
  }
});
`,
    wxml: `<view class="container">
  <card title="选择孩子" showTitleBar="{{true}}">
    <loading visible="{{loadingChildren}}" text="加载中..."></loading>
    <empty-state wx:if="{{!loadingChildren && children.length === 0}}" text="暂无绑定的孩子"></empty-state>
    <view wx:if="{{!loadingChildren && children.length > 0}}">
      <picker mode="selector" range="{{children}}" range-key="name" value="{{childIndex}}" bindchange="onChildPickerChange">
        <view class="picker">
          <text class="text-bold">{{children[childIndex].name}}</text>
          <text class="text-light ml-20">切换</text>
        </view>
      </picker>
    </view>
  </card>

  <card title="课时记录" showTitleBar="{{true}}">
    <loading visible="{{loadingList}}" text="加载中..."></loading>
    <empty-state wx:if="{{!loadingList && records.length === 0}}" text="暂无课时记录"></empty-state>
    <view wx:if="{{!loadingList && records.length > 0}}">
      <view class="list-item" wx:for="{{records}}" wx:key="id">
        <view class="flex-1">
          <view class="flex-between">
            <text class="text-bold">{{item.courseName || item.course_name || '课程'}}</text>
            <text class="text-error">-{{item.hours || item.consume_hours || 0}}课时</text>
          </view>
          <view class="mt-10">
            <text class="text-light text-small">{{item.dateText}}</text>
            <text wx:if="{{item.notes}}" class="text-secondary text-small ml-20">{{item.notes}}</text>
          </view>
        </view>
      </view>
      <view class="no-data" wx:if="{{!hasMore}}">
        <text>没有更多了</text>
      </view>
    </view>
  </card>
</view>
`,
    wxss: `.picker{padding:16rpx 0;}
`,
    json: `{
  "navigationBarTitleText": "课时记录",
  "enablePullDownRefresh": true,
  "onReachBottomDistance": 80
}
`
  },
  {
    name: 'pages/parent/growth-report/growth-report',
    title: '成长报告',
    js: `const parentService = require('../../../services/parent');
const authUtil = require('../../../utils/auth');
const { formatDate } = require('../../../utils/util');

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
    childId: null,
    childName: '',
    reports: [],
    loading: true
  },

  onLoad(options) {
    if (!authUtil.checkLogin()) return;
    const childId = options.childId ? String(options.childId) : null;
    const childName = options.childName ? decodeURIComponent(options.childName) : '';
    this.setData({ childId, childName });
    this.loadReports();
  },

  onPullDownRefresh() {
    this.loadReports().finally(() => wx.stopPullDownRefresh());
  },

  async loadReports() {
    if (!this.data.childId) {
      this.setData({ loading: false, reports: [] });
      return;
    }
    this.setData({ loading: true });
    try {
      const res = await parentService.getGrowthReports(this.data.childId, { page: 1, pageSize: 50 });
      const list = normalizeList(res.data).map(item => ({
        ...item,
        dateText: formatDate(item.createdAt || item.created_at || item.date)
      }));
      this.setData({ reports: list, loading: false });
      if (this.data.childName) {
        wx.setNavigationBarTitle({ title: this.data.childName + '的成长报告' });
      }
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async onTapReport(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    try {
      const res = await parentService.getGrowthReportDetail(id);
      const detail = res.data || {};
      const title = detail.title || detail.report_title || '成长报告';
      const content = String(detail.content || detail.report_content || '').trim();
      wx.showModal({
        title,
        content: content.length > 600 ? content.slice(0, 600) + '...' : content || '暂无内容',
        showCancel: false
      });
    } catch (e2) {
      wx.showToast({ title: '加载详情失败', icon: 'none' });
    }
  }
});
`,
    wxml: `<view class="container">
  <card title="{{childName ? childName + '的成长报告' : '成长报告'}}" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <empty-state wx:if="{{!loading && reports.length === 0}}" text="暂无成长报告"></empty-state>
    <view wx:if="{{!loading && reports.length > 0}}">
      <view class="list-item" wx:for="{{reports}}" wx:key="id" data-id="{{item.id}}" bindtap="onTapReport">
        <view class="flex-1">
          <view class="flex-between">
            <text class="text-bold">{{item.title || '成长报告'}}</text>
            <text class="text-light text-small">{{item.dateText}}</text>
          </view>
          <view class="mt-10">
            <text class="text-secondary text-small">{{item.summary || item.courseName || item.course_name || ''}}</text>
          </view>
        </view>
      </view>
    </view>
  </card>
</view>
`,
    wxss: ``,
    json: `{
  "navigationBarTitleText": "成长报告",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/parent/coupons/coupons',
    title: '我的优惠券',
    js: `const paymentService = require('../../../services/payment');
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
`,
    wxml: `<view class="container">
  <card title="我的优惠券" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <empty-state wx:if="{{!loading && coupons.length === 0}}" text="暂无可用优惠券"></empty-state>
    <view wx:if="{{!loading && coupons.length > 0}}">
      <view class="coupon-item" wx:for="{{coupons}}" wx:key="id">
        <view class="coupon-left">
          <text class="coupon-value">{{item.valueText}}</text>
          <text class="coupon-name">{{item.name || item.title || '优惠券'}}</text>
        </view>
        <view class="coupon-right">
          <text class="text-light text-small">有效期至 {{item.expireText || '—'}}</text>
          <text class="text-light text-small mt-10">优惠码 {{item.code || '—'}}</text>
        </view>
      </view>
    </view>
  </card>
</view>
`,
    wxss: `.coupon-item{display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:16rpx;padding:28rpx;margin-bottom:20rpx;box-shadow:var(--shadow);}
.coupon-left{display:flex;flex-direction:column;}
.coupon-value{font-size:44rpx;font-weight:700;color:var(--primary-color);}
.coupon-name{margin-top:10rpx;color:var(--text-secondary);}
.coupon-right{text-align:right;}
`,
    json: `{
  "navigationBarTitleText": "我的优惠券",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/parent/payment/payment',
    title: '课程购买',
    js: `const parentService = require('../../../services/parent');
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
    courses: [],
    courseIndex: 0,
    coupons: [],
    couponIndex: 0,
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
      this.setData({ children, courses, childIndex, courseIndex, loading: false });
      await this.loadCoupons();
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async loadCoupons() {
    const course = this.data.courses[this.data.courseIndex];
    if (!course) {
      this.setData({ coupons: [{ id: '', name: '不使用优惠券' }], couponIndex: 0 });
      return;
    }
    try {
      const res = await paymentService.getCoupons({ courseId: course.id });
      const list = normalizeList(res.data);
      const coupons = [{ id: '', name: '不使用优惠券' }].concat(list);
      this.setData({ coupons, couponIndex: 0 });
    } catch (e) {
      this.setData({ coupons: [{ id: '', name: '不使用优惠券' }], couponIndex: 0 });
    }
  },

  onChildChange(e) {
    this.setData({ childIndex: Number(e.detail.value) || 0 });
  },

  onCourseChange(e) {
    this.setData({ courseIndex: Number(e.detail.value) || 0 });
    this.loadCoupons();
  },

  onCouponChange(e) {
    this.setData({ couponIndex: Number(e.detail.value) || 0 });
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
`,
    wxml: `<view class="container">
  <card title="购买信息" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <view wx:if="{{!loading}}">
      <view class="form-group">
        <view class="form-label">孩子</view>
        <picker mode="selector" range="{{children}}" range-key="name" value="{{childIndex}}" bindchange="onChildChange">
          <view class="form-input flex-center">
            <text>{{children[childIndex].name || '请选择'}}</text>
          </view>
        </picker>
      </view>

      <view class="form-group">
        <view class="form-label">课程</view>
        <picker mode="selector" range="{{courses}}" range-key="name" value="{{courseIndex}}" bindchange="onCourseChange">
          <view class="form-input flex-center">
            <text>{{courses[courseIndex].name || '暂无课程'}}</text>
          </view>
        </picker>
        <view class="mt-10 text-light text-small" wx:if="{{courses[courseIndex]}}">
          <text>价格 {{courses[courseIndex].priceText}}</text>
          <text class="ml-20">总课时 {{courses[courseIndex].total_hours || courses[courseIndex].totalHours || 0}}</text>
        </view>
      </view>

      <view class="form-group">
        <view class="form-label">数量（课时）</view>
        <input class="form-input" type="number" value="{{quantity}}" bindinput="onQuantityInput" />
      </view>

      <view class="form-group">
        <view class="form-label">优惠券</view>
        <picker mode="selector" range="{{coupons}}" range-key="name" value="{{couponIndex}}" bindchange="onCouponChange">
          <view class="form-input flex-center">
            <text>{{coupons[couponIndex].name || '不使用优惠券'}}</text>
          </view>
        </picker>
      </view>

      <button class="btn-primary btn-block {{creating ? 'btn-disabled' : ''}}" bindtap="onSubmit">
        {{creating ? '处理中...' : '提交并支付'}}
      </button>
    </view>
  </card>
</view>
`,
    wxss: ``,
    json: `{
  "navigationBarTitleText": "课程购买",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/teacher/index/index',
    title: '教师端',
    js: `const teacherService = require('../../../services/teacher');
const authUtil = require('../../../utils/auth');
const { formatDate, formatTime } = require('../../../utils/util');

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
    userInfo: {},
    schedule: [],
    loading: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.setData({ userInfo: authUtil.getUserInfo() || {} });
  },

  onShow() {
    this.loadToday();
  },

  onPullDownRefresh() {
    this.loadToday().finally(() => wx.stopPullDownRefresh());
  },

  async loadToday() {
    this.setData({ loading: true });
    try {
      const res = await teacherService.getTodaySchedule();
      const list = normalizeList(res.data).map(item => ({
        ...item,
        dateText: formatDate(item.date || item.start_time || item.startTime),
        timeText: formatTime(item.start_time || item.startTime || item.date)
      }));
      this.setData({ schedule: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  goConsume() {
    wx.navigateTo({ url: '/pages/teacher/consume-class/consume-class' });
  },

  goReport() {
    wx.navigateTo({ url: '/pages/teacher/write-report/write-report' });
  },

  goCourse() {
    wx.navigateTo({ url: '/pages/teacher/course-manage/course-manage' });
  }
});
`,
    wxml: `<view class="container">
  <card title="教师信息" showTitleBar="{{true}}">
    <view class="flex-between">
      <view>
        <view class="text-bold">{{userInfo.name || userInfo.nickname || '教师'}}</view>
        <view class="text-light text-small mt-10">教师端</view>
      </view>
      <view class="avatar">
        <text class="text-primary text-bold">{{(userInfo.name || userInfo.nickname || '师')[0]}}</text>
      </view>
    </view>
  </card>

  <card title="快捷功能" showTitleBar="{{true}}">
    <view class="quick-links">
      <view class="quick-link-item" bindtap="goConsume">
        <view class="link-icon icon-class">课</view>
        <text>课时核销</text>
      </view>
      <view class="quick-link-item" bindtap="goReport">
        <view class="link-icon icon-report">报</view>
        <text>写报告</text>
      </view>
      <view class="quick-link-item" bindtap="goCourse">
        <view class="link-icon icon-payment">课</view>
        <text>课程管理</text>
      </view>
    </view>
  </card>

  <card title="今日安排" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <empty-state wx:if="{{!loading && schedule.length === 0}}" text="今日暂无课程安排"></empty-state>
    <view wx:if="{{!loading && schedule.length > 0}}">
      <view class="list-item" wx:for="{{schedule}}" wx:key="id">
        <view class="flex-1">
          <view class="flex-between">
            <text class="text-bold">{{item.courseName || item.course_name || '课程'}}</text>
            <text class="text-primary text-small">{{item.timeText}}</text>
          </view>
          <view class="mt-10">
            <text class="text-secondary text-small">{{item.studentName || item.student_name || ''}}</text>
            <text class="text-light text-small ml-20">{{item.dateText}}</text>
          </view>
        </view>
      </view>
    </view>
  </card>
</view>
`,
    wxss: `.quick-links{display:flex;justify-content:space-between;}
.quick-link-item{flex:1;display:flex;flex-direction:column;align-items:center;padding:24rpx 0;}
.link-icon{width:80rpx;height:80rpx;border-radius:40rpx;background:var(--primary-light);color:var(--primary-color);display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:12rpx;}
`,
    json: `{
  "navigationBarTitleText": "教师端",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/teacher/consume-class/consume-class',
    title: '课时核销',
    js: `const teacherService = require('../../../services/teacher');
const authUtil = require('../../../utils/auth');
const { showSuccess, showError, formatDate } = require('../../../utils/util');

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
    students: [],
    courses: [],
    studentIndex: 0,
    courseIndex: 0,
    hours: 1,
    date: '',
    notes: '',
    submitting: false,
    recent: [],
    loading: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.setData({ date: formatDate(Date.now()) });
    this.init();
  },

  onPullDownRefresh() {
    this.init().finally(() => wx.stopPullDownRefresh());
  },

  async init() {
    this.setData({ loading: true });
    try {
      const [studentsRes, coursesRes, recordsRes] = await Promise.all([
        teacherService.getStudents({ page: 1, pageSize: 100 }),
        teacherService.getCourses(),
        teacherService.getClassRecords({ page: 1, pageSize: 10 })
      ]);
      const students = normalizeList(studentsRes.data);
      const courses = normalizeList(coursesRes.data);
      const recent = normalizeList(recordsRes.data);
      this.setData({
        students,
        courses,
        recent,
        studentIndex: Math.min(this.data.studentIndex, Math.max(students.length - 1, 0)),
        courseIndex: Math.min(this.data.courseIndex, Math.max(courses.length - 1, 0)),
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  onStudentChange(e) {
    this.setData({ studentIndex: Number(e.detail.value) || 0 });
  },

  onCourseChange(e) {
    this.setData({ courseIndex: Number(e.detail.value) || 0 });
  },

  onHoursInput(e) {
    const v = Number(e.detail.value);
    this.setData({ hours: Number.isFinite(v) && v > 0 ? v : 1 });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onNotesInput(e) {
    this.setData({ notes: e.detail.value });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    const student = this.data.students[this.data.studentIndex];
    const course = this.data.courses[this.data.courseIndex];
    if (!student) return showError('请选择学生');
    if (!course) return showError('请选择课程');

    this.setData({ submitting: true });
    try {
      await teacherService.createClassRecord({
        studentId: student.id,
        courseId: course.id,
        hours: this.data.hours,
        date: this.data.date,
        notes: this.data.notes
      });
      showSuccess('提交成功');
      this.setData({ notes: '' });
      this.init();
    } catch (e) {
      showError(e.message || '提交失败');
    } finally {
      this.setData({ submitting: false });
    }
  }
});
`,
    wxml: `<view class="container">
  <card title="新增核销" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <view wx:if="{{!loading}}">
      <view class="form-group">
        <view class="form-label">学生</view>
        <picker mode="selector" range="{{students}}" range-key="name" value="{{studentIndex}}" bindchange="onStudentChange">
          <view class="form-input flex-center">
            <text>{{students[studentIndex].name || '请选择'}}</text>
          </view>
        </picker>
      </view>

      <view class="form-group">
        <view class="form-label">课程</view>
        <picker mode="selector" range="{{courses}}" range-key="name" value="{{courseIndex}}" bindchange="onCourseChange">
          <view class="form-input flex-center">
            <text>{{courses[courseIndex].name || '请选择'}}</text>
          </view>
        </picker>
      </view>

      <view class="form-group">
        <view class="form-label">消耗课时</view>
        <input class="form-input" type="number" value="{{hours}}" bindinput="onHoursInput" />
      </view>

      <view class="form-group">
        <view class="form-label">上课日期</view>
        <picker mode="date" value="{{date}}" bindchange="onDateChange">
          <view class="form-input flex-center"><text>{{date}}</text></view>
        </picker>
      </view>

      <view class="form-group">
        <view class="form-label">备注</view>
        <textarea class="form-textarea" value="{{notes}}" bindinput="onNotesInput" placeholder="选填"></textarea>
      </view>

      <button class="btn-primary btn-block {{submitting ? 'btn-disabled' : ''}}" bindtap="onSubmit">
        {{submitting ? '提交中...' : '提交'}}
      </button>
    </view>
  </card>

  <card title="最近核销记录" showTitleBar="{{true}}">
    <empty-state wx:if="{{!loading && recent.length === 0}}" text="暂无记录"></empty-state>
    <view wx:if="{{!loading && recent.length > 0}}">
      <view class="list-item" wx:for="{{recent}}" wx:key="id">
        <view class="flex-1">
          <view class="flex-between">
            <text class="text-bold">{{item.studentName || item.student_name || '学生'}}</text>
            <text class="text-error">-{{item.hours || 0}}课时</text>
          </view>
          <view class="mt-10">
            <text class="text-secondary text-small">{{item.courseName || item.course_name || '课程'}}</text>
            <text class="text-light text-small ml-20">{{item.date || item.createdAt || ''}}</text>
          </view>
        </view>
      </view>
    </view>
  </card>
</view>
`,
    wxss: ``,
    json: `{
  "navigationBarTitleText": "课时核销",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/teacher/write-report/write-report',
    title: '写成长报告',
    js: `const teacherService = require('../../../services/teacher');
const authUtil = require('../../../utils/auth');
const { showSuccess, showError, formatDate } = require('../../../utils/util');

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
    students: [],
    courses: [],
    studentIndex: 0,
    courseIndex: 0,
    title: '',
    content: '',
    images: [],
    submitting: false,
    recent: [],
    loading: true
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
      const [studentsRes, coursesRes, reportsRes] = await Promise.all([
        teacherService.getStudents({ page: 1, pageSize: 100 }),
        teacherService.getCourses(),
        teacherService.getGrowthReports({ page: 1, pageSize: 10 })
      ]);
      const students = normalizeList(studentsRes.data);
      const courses = normalizeList(coursesRes.data);
      const recent = normalizeList(reportsRes.data).map(r => ({
        ...r,
        dateText: formatDate(r.createdAt || r.created_at || r.date)
      }));
      this.setData({
        students,
        courses,
        recent,
        studentIndex: Math.min(this.data.studentIndex, Math.max(students.length - 1, 0)),
        courseIndex: Math.min(this.data.courseIndex, Math.max(courses.length - 1, 0)),
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  onStudentChange(e) {
    this.setData({ studentIndex: Number(e.detail.value) || 0 });
  },

  onCourseChange(e) {
    this.setData({ courseIndex: Number(e.detail.value) || 0 });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onChooseImages() {
    wx.chooseImage({
      count: 6,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const files = res.tempFilePaths || [];
        const next = this.data.images.concat(files).slice(0, 6);
        this.setData({ images: next });
      }
    });
  },

  onRemoveImage(e) {
    const idx = Number(e.currentTarget.dataset.index);
    const next = this.data.images.filter((_, i) => i !== idx);
    this.setData({ images: next });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    const student = this.data.students[this.data.studentIndex];
    const course = this.data.courses[this.data.courseIndex];
    if (!student) return showError('请选择学生');
    if (!course) return showError('请选择课程');
    if (!this.data.title.trim()) return showError('请输入标题');
    if (!this.data.content.trim()) return showError('请输入内容');

    this.setData({ submitting: true });
    try {
      await teacherService.createGrowthReport({
        studentId: student.id,
        courseId: course.id,
        title: this.data.title.trim(),
        content: this.data.content.trim(),
        images: this.data.images
      });
      showSuccess('提交成功');
      this.setData({ title: '', content: '', images: [] });
      this.init();
    } catch (e) {
      showError(e.message || '提交失败');
    } finally {
      this.setData({ submitting: false });
    }
  }
});
`,
    wxml: `<view class="container">
  <card title="写成长报告" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <view wx:if="{{!loading}}">
      <view class="form-group">
        <view class="form-label">学生</view>
        <picker mode="selector" range="{{students}}" range-key="name" value="{{studentIndex}}" bindchange="onStudentChange">
          <view class="form-input flex-center">
            <text>{{students[studentIndex].name || '请选择'}}</text>
          </view>
        </picker>
      </view>

      <view class="form-group">
        <view class="form-label">课程</view>
        <picker mode="selector" range="{{courses}}" range-key="name" value="{{courseIndex}}" bindchange="onCourseChange">
          <view class="form-input flex-center">
            <text>{{courses[courseIndex].name || '请选择'}}</text>
          </view>
        </picker>
      </view>

      <view class="form-group">
        <view class="form-label">标题</view>
        <input class="form-input" value="{{title}}" bindinput="onTitleInput" placeholder="请输入标题" />
      </view>

      <view class="form-group">
        <view class="form-label">内容</view>
        <textarea class="form-textarea" value="{{content}}" bindinput="onContentInput" placeholder="请输入内容"></textarea>
      </view>

      <view class="form-group">
        <view class="form-label">图片（选填）</view>
        <view class="img-grid">
          <view class="img-item" wx:for="{{images}}" wx:key="*this" data-index="{{index}}" bindtap="onRemoveImage">
            <image class="img" src="{{item}}" mode="aspectFill"></image>
          </view>
          <view class="img-add" wx:if="{{images.length < 6}}" bindtap="onChooseImages">
            <text class="text-primary text-bold">+</text>
          </view>
        </view>
        <view class="text-light text-small mt-10">点击图片可删除</view>
      </view>

      <button class="btn-primary btn-block {{submitting ? 'btn-disabled' : ''}}" bindtap="onSubmit">
        {{submitting ? '提交中...' : '提交'}}
      </button>
    </view>
  </card>

  <card title="最近报告" showTitleBar="{{true}}">
    <empty-state wx:if="{{!loading && recent.length === 0}}" text="暂无报告"></empty-state>
    <view wx:if="{{!loading && recent.length > 0}}">
      <view class="list-item" wx:for="{{recent}}" wx:key="id">
        <view class="flex-1">
          <view class="flex-between">
            <text class="text-bold">{{item.title || '成长报告'}}</text>
            <text class="text-light text-small">{{item.dateText}}</text>
          </view>
          <view class="mt-10">
            <text class="text-secondary text-small">{{item.studentName || item.student_name || ''}}</text>
            <text class="text-light text-small ml-20">{{item.courseName || item.course_name || ''}}</text>
          </view>
        </view>
      </view>
    </view>
  </card>
</view>
`,
    wxss: `.img-grid{display:flex;flex-wrap:wrap;gap:16rpx;}
.img-item{width:160rpx;height:160rpx;border-radius:16rpx;overflow:hidden;}
.img{width:100%;height:100%;}
.img-add{width:160rpx;height:160rpx;border-radius:16rpx;border:2rpx dashed var(--border-color);display:flex;align-items:center;justify-content:center;background:#fff;}
`,
    json: `{
  "navigationBarTitleText": "写成长报告",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/teacher/course-manage/course-manage',
    title: '课程管理',
    js: `const teacherService = require('../../../services/teacher');
const authUtil = require('../../../utils/auth');
const { formatMoney } = require('../../../utils/util');

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
    courses: [],
    loading: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.loadCourses();
  },

  onPullDownRefresh() {
    this.loadCourses().finally(() => wx.stopPullDownRefresh());
  },

  async loadCourses() {
    this.setData({ loading: true });
    try {
      const res = await teacherService.getCourses();
      const list = normalizeList(res.data).map(c => ({
        ...c,
        priceText: '¥' + formatMoney(c.price || 0)
      }));
      this.setData({ courses: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  }
});
`,
    wxml: `<view class="container">
  <card title="我负责的课程" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <empty-state wx:if="{{!loading && courses.length === 0}}" text="暂无课程"></empty-state>
    <view wx:if="{{!loading && courses.length > 0}}">
      <view class="course-item" wx:for="{{courses}}" wx:key="id">
        <view class="flex-between">
          <text class="text-bold">{{item.name}}</text>
          <text class="text-primary">{{item.priceText}}</text>
        </view>
        <view class="mt-10">
          <text class="badge badge-primary">{{item.type || '课程'}}</text>
          <text class="text-light text-small ml-20">总课时 {{item.total_hours || item.totalHours || 0}}</text>
          <text class="text-light text-small ml-20">{{(item.status === 0 || item.status === '0') ? '下架' : '上架'}}</text>
        </view>
        <view class="mt-10 text-secondary text-small">{{item.description || ''}}</view>
      </view>
    </view>
  </card>
</view>
`,
    wxss: `.course-item{background:#fff;border-radius:16rpx;padding:28rpx;margin-bottom:20rpx;box-shadow:var(--shadow);}
`,
    json: `{
  "navigationBarTitleText": "课程管理",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/admin/index/index',
    title: '管理端',
    js: `const adminService = require('../../../services/admin');
const authUtil = require('../../../utils/auth');

Page({
  data: {
    userInfo: {},
    stats: {},
    loading: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.setData({ userInfo: authUtil.getUserInfo() || {} });
    this.loadStats();
  },

  onPullDownRefresh() {
    this.loadStats().finally(() => wx.stopPullDownRefresh());
  },

  async loadStats() {
    this.setData({ loading: true });
    try {
      const res = await adminService.getStats();
      this.setData({ stats: res.data || {}, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  goUsers() {
    wx.navigateTo({ url: '/pages/admin/user-manage/user-manage' });
  },

  goCourses() {
    wx.navigateTo({ url: '/pages/admin/course-manage/course-manage' });
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/admin/payment-manage/payment-manage' });
  },

  goCoupons() {
    wx.navigateTo({ url: '/pages/admin/coupon-manage/coupon-manage' });
  }
});
`,
    wxml: `<view class="container">
  <card title="管理员" showTitleBar="{{true}}">
    <view class="flex-between">
      <view>
        <view class="text-bold">{{userInfo.name || userInfo.nickname || '管理员'}}</view>
        <view class="text-light text-small mt-10">管理端</view>
      </view>
      <view class="avatar">
        <text class="text-primary text-bold">{{(userInfo.name || userInfo.nickname || '管')[0]}}</text>
      </view>
    </view>
  </card>

  <card title="数据概览" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <view class="stats-grid" wx:if="{{!loading}}">
      <view class="stats-item">
        <text class="stats-num">{{stats.userCount || 0}}</text>
        <text class="stats-label">用户</text>
      </view>
      <view class="stats-item">
        <text class="stats-num">{{stats.courseCount || 0}}</text>
        <text class="stats-label">课程</text>
      </view>
      <view class="stats-item">
        <text class="stats-num">{{stats.orderCount || 0}}</text>
        <text class="stats-label">订单</text>
      </view>
      <view class="stats-item">
        <text class="stats-num">{{stats.couponCount || 0}}</text>
        <text class="stats-label">优惠券</text>
      </view>
    </view>
  </card>

  <card title="管理入口" showTitleBar="{{true}}">
    <view class="menu">
      <view class="list-item" bindtap="goUsers"><text>用户管理</text></view>
      <view class="list-item" bindtap="goCourses"><text>课程管理</text></view>
      <view class="list-item" bindtap="goOrders"><text>订单管理</text></view>
      <view class="list-item" bindtap="goCoupons"><text>优惠券管理</text></view>
    </view>
  </card>
</view>
`,
    wxss: `.stats-grid{display:flex;flex-wrap:wrap;gap:16rpx;}
.stats-item{flex:1;min-width:320rpx;background:#fff;border-radius:16rpx;padding:24rpx;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:flex-start;}
.stats-num{font-size:44rpx;font-weight:800;color:var(--primary-color);}
.stats-label{margin-top:8rpx;color:var(--text-light);}
`,
    json: `{
  "navigationBarTitleText": "管理端",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/admin/user-manage/user-manage',
    title: '用户管理',
    js: `const adminService = require('../../../services/admin');
const authUtil = require('../../../utils/auth');
const { showSuccess, showError } = require('../../../utils/util');

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
    keyword: '',
    roleOptions: [
      { label: '全部', value: '' },
      { label: '家长', value: 'parent' },
      { label: '教师', value: 'teacher' },
      { label: '管理员', value: 'admin' }
    ],
    roleIndex: 0,
    list: [],
    loading: true,
    form: {
      id: '',
      name: '',
      phone: '',
      password: '',
      role: 'parent'
    }
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onRoleChange(e) {
    this.setData({ roleIndex: Number(e.detail.value) || 0 });
    this.load();
  },

  async load() {
    this.setData({ loading: true });
    const role = this.data.roleOptions[this.data.roleIndex]?.value || '';
    try {
      const res = await adminService.getUsers({ page: 1, pageSize: 50, keyword: this.data.keyword, role });
      this.setData({ list: normalizeList(res.data), loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  resetForm() {
    this.setData({
      form: { id: '', name: '', phone: '', password: '', role: 'parent' }
    });
  },

  onFormName(e) {
    this.setData({ 'form.name': e.detail.value });
  },
  onFormPhone(e) {
    this.setData({ 'form.phone': e.detail.value });
  },
  onFormPassword(e) {
    this.setData({ 'form.password': e.detail.value });
  },
  onFormRole(e) {
    const v = e.detail.value;
    this.setData({ 'form.role': v });
  },

  onTapEdit(e) {
    const id = e.currentTarget.dataset.id;
    const u = this.data.list.find(x => String(x.id) === String(id));
    if (!u) return;
    this.setData({
      form: { id: u.id, name: u.nickname || u.name || '', phone: u.phone || '', password: '', role: u.role || 'parent' }
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  async onSubmit() {
    const f = this.data.form;
    if (!f.name.trim()) return showError('请输入姓名');
    if (!/^1\\d{10}$/.test(f.phone)) return showError('请输入正确手机号');
    if (!f.id && (!f.password || f.password.length < 6)) return showError('新建用户需设置至少6位密码');

    try {
      if (f.id) {
        const payload = { nickname: f.name.trim(), phone: f.phone, role: f.role };
        if (f.password) payload.password = f.password;
        await adminService.updateUser(f.id, payload);
        showSuccess('更新成功');
      } else {
        await adminService.createUser({ nickname: f.name.trim(), phone: f.phone, password: f.password, role: f.role });
        showSuccess('创建成功');
      }
      this.resetForm();
      this.load();
    } catch (e) {
      showError(e.message || '操作失败');
    }
  },

  onCancelEdit() {
    this.resetForm();
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，是否继续？',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await adminService.deleteUser(id);
          showSuccess('删除成功');
          this.load();
        } catch (err) {
          showError(err.message || '删除失败');
        }
      }
    });
  }
});
`,
    wxml: `<view class="container">
  <card title="{{form.id ? '编辑用户' : '创建用户'}}" showTitleBar="{{true}}">
    <view class="form-group">
      <view class="form-label">姓名</view>
      <input class="form-input" value="{{form.name}}" bindinput="onFormName" placeholder="如：张三" />
    </view>
    <view class="form-group">
      <view class="form-label">手机号</view>
      <input class="form-input" value="{{form.phone}}" bindinput="onFormPhone" placeholder="11位手机号" />
    </view>
    <view class="form-group">
      <view class="form-label">密码{{form.id ? '（留空不改）' : ''}}</view>
      <input class="form-input" password value="{{form.password}}" bindinput="onFormPassword" placeholder="{{form.id ? '留空不修改' : '至少6位'}}" />
    </view>
    <view class="form-group">
      <view class="form-label">角色</view>
      <radio-group bindchange="onFormRole">
        <label class="radio-item"><radio value="parent" checked="{{form.role === 'parent'}}" />家长</label>
        <label class="radio-item"><radio value="teacher" checked="{{form.role === 'teacher'}}" />教师</label>
        <label class="radio-item"><radio value="admin" checked="{{form.role === 'admin'}}" />管理员</label>
      </radio-group>
    </view>
    <view class="flex-between">
      <button class="btn-outline" wx:if="{{form.id}}" bindtap="onCancelEdit">取消</button>
      <button class="btn-primary flex-1 ml-20" bindtap="onSubmit">保存</button>
    </view>
  </card>

  <card title="用户列表" showTitleBar="{{true}}">
    <view class="search-bar">
      <input placeholder="搜索姓名/手机号" value="{{keyword}}" bindinput="onKeywordInput" confirm-type="search" />
      <text class="text-primary" bindtap="load">搜索</text>
    </view>
    <picker mode="selector" range="{{roleOptions}}" range-key="label" value="{{roleIndex}}" bindchange="onRoleChange">
      <view class="filter-pill">
        <text>筛选：{{roleOptions[roleIndex].label}}</text>
      </view>
    </picker>

    <loading visible="{{loading}}" text="加载中..."></loading>
    <empty-state wx:if="{{!loading && list.length === 0}}" text="暂无用户"></empty-state>
    <view wx:if="{{!loading && list.length > 0}}">
      <view class="user-row" wx:for="{{list}}" wx:key="id">
        <view class="flex-1">
          <view class="flex-between">
            <text class="text-bold">{{item.nickname || item.name || '用户'}}</text>
            <text class="badge badge-primary">{{item.role}}</text>
          </view>
          <view class="mt-10 text-light text-small">{{item.phone || ''}}</view>
        </view>
        <view class="row-actions">
          <text class="action" data-id="{{item.id}}" bindtap="onTapEdit">编辑</text>
          <text class="action text-error ml-20" data-id="{{item.id}}" bindtap="onDelete">删除</text>
        </view>
      </view>
    </view>
  </card>
</view>
`,
    wxss: `.radio-item{margin-right:24rpx;}
.filter-pill{background:#fff;border-radius:999rpx;padding:12rpx 24rpx;margin-bottom:24rpx;display:inline-block;box-shadow:var(--shadow);}
.user-row{display:flex;align-items:center;gap:16rpx;background:#fff;border-radius:16rpx;padding:24rpx;margin-bottom:16rpx;box-shadow:var(--shadow);}
.row-actions{display:flex;flex-direction:row;align-items:center;}
.action{color:var(--primary-color);}
`,
    json: `{
  "navigationBarTitleText": "用户管理",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/admin/course-manage/course-manage',
    title: '课程管理',
    js: `const adminService = require('../../../services/admin');
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
    list: [],
    loading: true,
    teachers: [],
    teacherIndex: 0,
    form: {
      id: '',
      name: '',
      type: '',
      teacher_id: '',
      total_hours: 0,
      price: 0,
      description: '',
      status: 1
    }
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.init();
  },

  onPullDownRefresh() {
    this.init().finally(() => wx.stopPullDownRefresh());
  },

  async init() {
    await Promise.all([this.loadTeachers(), this.load()]);
  },

  async loadTeachers() {
    try {
      const res = await adminService.getUsers({ page: 1, pageSize: 100, role: 'teacher' });
      const teachers = normalizeList(res.data);
      const teacherIndex = Math.min(this.data.teacherIndex, Math.max(teachers.length - 1, 0));
      this.setData({ teachers, teacherIndex });
      if (!this.data.form.teacher_id && teachers[teacherIndex]) {
        this.setData({ 'form.teacher_id': teachers[teacherIndex].id });
      }
    } catch (e) {}
  },

  async load() {
    this.setData({ loading: true });
    try {
      const res = await adminService.getCourses({ page: 1, pageSize: 50 });
      const list = normalizeList(res.data).map(c => ({
        ...c,
        priceText: '¥' + formatMoney(c.price || 0)
      }));
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  resetForm() {
    const teacher = this.data.teachers[this.data.teacherIndex];
    this.setData({
      form: {
        id: '',
        name: '',
        type: '',
        teacher_id: teacher ? teacher.id : '',
        total_hours: 0,
        price: 0,
        description: '',
        status: 1
      }
    });
  },

  onTeacherChange(e) {
    const teacherIndex = Number(e.detail.value) || 0;
    const teacher = this.data.teachers[teacherIndex];
    this.setData({ teacherIndex, 'form.teacher_id': teacher ? teacher.id : '' });
  },

  onName(e) { this.setData({ 'form.name': e.detail.value }); },
  onType(e) { this.setData({ 'form.type': e.detail.value }); },
  onTotalHours(e) { this.setData({ 'form.total_hours': Number(e.detail.value) || 0 }); },
  onPrice(e) { this.setData({ 'form.price': Number(e.detail.value) || 0 }); },
  onDesc(e) { this.setData({ 'form.description': e.detail.value }); },
  onStatus(e) { this.setData({ 'form.status': Number(e.detail.value) }); },

  onTapEdit(e) {
    const id = e.currentTarget.dataset.id;
    const c = this.data.list.find(x => String(x.id) === String(id));
    if (!c) return;
    const teacherIdx = this.data.teachers.findIndex(t => String(t.id) === String(c.teacher_id || c.teacherId));
    const teacherIndex = teacherIdx >= 0 ? teacherIdx : this.data.teacherIndex;
    this.setData({
      teacherIndex,
      form: {
        id: c.id,
        name: c.name || '',
        type: c.type || '',
        teacher_id: c.teacher_id || c.teacherId || '',
        total_hours: c.total_hours || c.totalHours || 0,
        price: c.price || 0,
        description: c.description || '',
        status: (c.status === 0 || c.status === '0') ? 0 : 1
      }
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  async onSubmit() {
    const f = this.data.form;
    if (!f.name.trim()) return showError('请输入课程名称');
    if (!f.teacher_id) return showError('请选择教师');
    const payload = {
      name: f.name.trim(),
      type: f.type,
      teacher_id: f.teacher_id,
      total_hours: Number(f.total_hours) || 0,
      price: Number(f.price) || 0,
      description: f.description,
      status: Number(f.status)
    };
    try {
      if (f.id) {
        await adminService.updateCourse(f.id, payload);
        showSuccess('更新成功');
      } else {
        await adminService.createCourse(payload);
        showSuccess('创建成功');
      }
      this.resetForm();
      this.load();
    } catch (e) {
      showError(e.message || '操作失败');
    }
  },

  onCancelEdit() {
    this.resetForm();
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，是否继续？',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await adminService.deleteCourse(id);
          showSuccess('删除成功');
          this.load();
        } catch (err) {
          showError(err.message || '删除失败');
        }
      }
    });
  }
});
`,
    wxml: `<view class="container">
  <card title="{{form.id ? '编辑课程' : '创建课程'}}" showTitleBar="{{true}}">
    <view class="form-group">
      <view class="form-label">课程名称</view>
      <input class="form-input" value="{{form.name}}" bindinput="onName" placeholder="如：数学启蒙" />
    </view>
    <view class="form-group">
      <view class="form-label">课程类型</view>
      <input class="form-input" value="{{form.type}}" bindinput="onType" placeholder="如：数学/英语" />
    </view>
    <view class="form-group">
      <view class="form-label">授课教师</view>
      <picker mode="selector" range="{{teachers}}" range-key="nickname" value="{{teacherIndex}}" bindchange="onTeacherChange">
        <view class="form-input flex-center">
          <text>{{teachers[teacherIndex].nickname || teachers[teacherIndex].name || '请选择'}}</text>
        </view>
      </picker>
    </view>
    <view class="form-group">
      <view class="form-label">总课时</view>
      <input class="form-input" type="number" value="{{form.total_hours}}" bindinput="onTotalHours" />
    </view>
    <view class="form-group">
      <view class="form-label">价格（分）</view>
      <input class="form-input" type="number" value="{{form.price}}" bindinput="onPrice" />
      <view class="text-light text-small mt-10">例如 19900 = ¥199.00</view>
    </view>
    <view class="form-group">
      <view class="form-label">描述</view>
      <textarea class="form-textarea" value="{{form.description}}" bindinput="onDesc" placeholder="选填"></textarea>
    </view>
    <view class="form-group">
      <view class="form-label">状态</view>
      <radio-group bindchange="onStatus">
        <label class="radio-item"><radio value="1" checked="{{form.status === 1}}" />上架</label>
        <label class="radio-item"><radio value="0" checked="{{form.status === 0}}" />下架</label>
      </radio-group>
    </view>
    <view class="flex-between">
      <button class="btn-outline" wx:if="{{form.id}}" bindtap="onCancelEdit">取消</button>
      <button class="btn-primary flex-1 ml-20" bindtap="onSubmit">保存</button>
    </view>
  </card>

  <card title="课程列表" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <empty-state wx:if="{{!loading && list.length === 0}}" text="暂无课程"></empty-state>
    <view wx:if="{{!loading && list.length > 0}}">
      <view class="course-row" wx:for="{{list}}" wx:key="id">
        <view class="flex-1">
          <view class="flex-between">
            <text class="text-bold">{{item.name}}</text>
            <text class="text-primary">{{item.priceText}}</text>
          </view>
          <view class="mt-10">
            <text class="badge badge-primary">{{item.type || '课程'}}</text>
            <text class="text-light text-small ml-20">总课时 {{item.total_hours || 0}}</text>
            <text class="text-light text-small ml-20">{{(item.status === 0 || item.status === '0') ? '下架' : '上架'}}</text>
          </view>
        </view>
        <view class="row-actions">
          <text class="action" data-id="{{item.id}}" bindtap="onTapEdit">编辑</text>
          <text class="action text-error ml-20" data-id="{{item.id}}" bindtap="onDelete">删除</text>
        </view>
      </view>
    </view>
  </card>
</view>
`,
    wxss: `.radio-item{margin-right:24rpx;}
.course-row{display:flex;align-items:center;gap:16rpx;background:#fff;border-radius:16rpx;padding:24rpx;margin-bottom:16rpx;box-shadow:var(--shadow);}
.row-actions{display:flex;flex-direction:row;align-items:center;}
.action{color:var(--primary-color);}
`,
    json: `{
  "navigationBarTitleText": "课程管理",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/admin/payment-manage/payment-manage',
    title: '订单管理',
    js: `const adminService = require('../../../services/admin');
const authUtil = require('../../../utils/auth');
const { formatDateTime, formatMoney } = require('../../../utils/util');

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
    list: [],
    loading: true
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    this.setData({ loading: true });
    try {
      const res = await adminService.getOrders({ page: 1, pageSize: 50 });
      const list = normalizeList(res.data).map(o => ({
        ...o,
        dateText: formatDateTime(o.createdAt || o.created_at),
        amountText: '¥' + formatMoney(o.amount || o.total_amount || 0)
      }));
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async onTapDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    try {
      const res = await adminService.getOrderDetail(id);
      const d = res.data || {};
      const content = [
        '订单号：' + (d.id || ''),
        '状态：' + (d.status || ''),
        '金额：¥' + formatMoney(d.amount || d.total_amount || 0),
        '创建：' + formatDateTime(d.createdAt || d.created_at)
      ].join('\\n');
      wx.showModal({ title: '订单详情', content, showCancel: false });
    } catch (e2) {
      wx.showToast({ title: '加载详情失败', icon: 'none' });
    }
  }
});
`,
    wxml: `<view class="container">
  <card title="订单列表" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <empty-state wx:if="{{!loading && list.length === 0}}" text="暂无订单"></empty-state>
    <view wx:if="{{!loading && list.length > 0}}">
      <view class="order-row" wx:for="{{list}}" wx:key="id" data-id="{{item.id}}" bindtap="onTapDetail">
        <view class="flex-1">
          <view class="flex-between">
            <text class="text-bold">订单 #{{item.id}}</text>
            <text class="text-primary">{{item.amountText}}</text>
          </view>
          <view class="mt-10">
            <text class="badge badge-primary">{{item.status || '—'}}</text>
            <text class="text-light text-small ml-20">{{item.dateText}}</text>
          </view>
        </view>
      </view>
    </view>
  </card>
</view>
`,
    wxss: `.order-row{display:flex;align-items:center;gap:16rpx;background:#fff;border-radius:16rpx;padding:24rpx;margin-bottom:16rpx;box-shadow:var(--shadow);}
`,
    json: `{
  "navigationBarTitleText": "订单管理",
  "enablePullDownRefresh": true
}
`
  },
  {
    name: 'pages/admin/coupon-manage/coupon-manage',
    title: '优惠券管理',
    js: `const adminService = require('../../../services/admin');
const authUtil = require('../../../utils/auth');
const { showSuccess, showError, formatDate, formatMoney } = require('../../../utils/util');

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (Array.isArray(data.list)) return data.list;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.records)) return data.records;
  return [];
};

const renderValue = (c) => {
  const type = c.type || 'fixed';
  if (type === 'percent') return String(Number(c.value || 0)) + '%';
  return '¥' + formatMoney(Number(c.value || 0));
};

Page({
  data: {
    list: [],
    loading: true,
    form: {
      id: '',
      code: '',
      name: '',
      type: 'fixed',
      value: 0,
      min_amount: 0,
      start_date: '',
      expire_date: '',
      total_count: 0,
      status: 1
    }
  },

  onLoad() {
    if (!authUtil.checkLogin()) return;
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    this.setData({ loading: true });
    try {
      const res = await adminService.getCoupons({ page: 1, pageSize: 50 });
      const list = normalizeList(res.data).map(c => ({
        ...c,
        valueText: renderValue(c),
        expireText: formatDate(c.expire_date || c.expireDate)
      }));
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  resetForm() {
    this.setData({
      form: {
        id: '',
        code: '',
        name: '',
        type: 'fixed',
        value: 0,
        min_amount: 0,
        start_date: '',
        expire_date: '',
        total_count: 0,
        status: 1
      }
    });
  },

  onCode(e) { this.setData({ 'form.code': e.detail.value }); },
  onName(e) { this.setData({ 'form.name': e.detail.value }); },
  onType(e) { this.setData({ 'form.type': e.detail.value }); },
  onValue(e) { this.setData({ 'form.value': Number(e.detail.value) || 0 }); },
  onMinAmount(e) { this.setData({ 'form.min_amount': Number(e.detail.value) || 0 }); },
  onStartDate(e) { this.setData({ 'form.start_date': e.detail.value }); },
  onExpireDate(e) { this.setData({ 'form.expire_date': e.detail.value }); },
  onTotalCount(e) { this.setData({ 'form.total_count': Number(e.detail.value) || 0 }); },
  onStatus(e) { this.setData({ 'form.status': Number(e.detail.value) }); },

  onTapEdit(e) {
    const id = e.currentTarget.dataset.id;
    const c = this.data.list.find(x => String(x.id) === String(id));
    if (!c) return;
    this.setData({
      form: {
        id: c.id,
        code: c.code || '',
        name: c.name || '',
        type: c.type || 'fixed',
        value: Number(c.value || 0),
        min_amount: Number(c.min_amount || 0),
        start_date: c.start_date || '',
        expire_date: c.expire_date || '',
        total_count: Number(c.total_count || 0),
        status: (c.status === 0 || c.status === '0') ? 0 : 1
      }
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  async onSubmit() {
    const f = this.data.form;
    if (!f.code.trim()) return showError('请输入优惠码');
    if (!f.name.trim()) return showError('请输入名称');
    const payload = {
      code: f.code.trim(),
      name: f.name.trim(),
      type: f.type,
      value: Number(f.value) || 0,
      min_amount: Number(f.min_amount) || 0,
      start_date: f.start_date || null,
      expire_date: f.expire_date || null,
      total_count: Number(f.total_count) || 0,
      status: Number(f.status)
    };
    try {
      if (f.id) {
        await adminService.updateCoupon(f.id, payload);
        showSuccess('更新成功');
      } else {
        await adminService.createCoupon(payload);
        showSuccess('创建成功');
      }
      this.resetForm();
      this.load();
    } catch (e) {
      showError(e.message || '操作失败');
    }
  },

  onCancelEdit() {
    this.resetForm();
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，是否继续？',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          await adminService.deleteCoupon(id);
          showSuccess('删除成功');
          this.load();
        } catch (err) {
          showError(err.message || '删除失败');
        }
      }
    });
  }
});
`,
    wxml: `<view class="container">
  <card title="{{form.id ? '编辑优惠券' : '创建优惠券'}}" showTitleBar="{{true}}">
    <view class="form-group">
      <view class="form-label">优惠码</view>
      <input class="form-input" value="{{form.code}}" bindinput="onCode" placeholder="如：NEW2026" />
    </view>
    <view class="form-group">
      <view class="form-label">名称</view>
      <input class="form-input" value="{{form.name}}" bindinput="onName" placeholder="如：新年优惠" />
    </view>
    <view class="form-group">
      <view class="form-label">类型</view>
      <radio-group bindchange="onType">
        <label class="radio-item"><radio value="fixed" checked="{{form.type === 'fixed'}}" />满减</label>
        <label class="radio-item"><radio value="percent" checked="{{form.type === 'percent'}}" />折扣</label>
      </radio-group>
    </view>
    <view class="form-group">
      <view class="form-label">面值（分或百分比）</view>
      <input class="form-input" type="number" value="{{form.value}}" bindinput="onValue" />
    </view>
    <view class="form-group">
      <view class="form-label">最低使用金额（分）</view>
      <input class="form-input" type="number" value="{{form.min_amount}}" bindinput="onMinAmount" />
    </view>
    <view class="form-group">
      <view class="form-label">开始日期</view>
      <picker mode="date" value="{{form.start_date}}" bindchange="onStartDate">
        <view class="form-input flex-center"><text>{{form.start_date || '不限制'}}</text></view>
      </picker>
    </view>
    <view class="form-group">
      <view class="form-label">过期日期</view>
      <picker mode="date" value="{{form.expire_date}}" bindchange="onExpireDate">
        <view class="form-input flex-center"><text>{{form.expire_date || '不限制'}}</text></view>
      </picker>
    </view>
    <view class="form-group">
      <view class="form-label">发行总量（0 不限）</view>
      <input class="form-input" type="number" value="{{form.total_count}}" bindinput="onTotalCount" />
    </view>
    <view class="form-group">
      <view class="form-label">状态</view>
      <radio-group bindchange="onStatus">
        <label class="radio-item"><radio value="1" checked="{{form.status === 1}}" />启用</label>
        <label class="radio-item"><radio value="0" checked="{{form.status === 0}}" />停用</label>
      </radio-group>
    </view>
    <view class="flex-between">
      <button class="btn-outline" wx:if="{{form.id}}" bindtap="onCancelEdit">取消</button>
      <button class="btn-primary flex-1 ml-20" bindtap="onSubmit">保存</button>
    </view>
  </card>

  <card title="优惠券列表" showTitleBar="{{true}}">
    <loading visible="{{loading}}" text="加载中..."></loading>
    <empty-state wx:if="{{!loading && list.length === 0}}" text="暂无优惠券"></empty-state>
    <view wx:if="{{!loading && list.length > 0}}">
      <view class="coupon-row" wx:for="{{list}}" wx:key="id">
        <view class="flex-1">
          <view class="flex-between">
            <text class="text-bold">{{item.name}}</text>
            <text class="text-primary">{{item.valueText}}</text>
          </view>
          <view class="mt-10">
            <text class="badge badge-primary">{{item.type}}</text>
            <text class="text-light text-small ml-20">码 {{item.code}}</text>
          </view>
          <view class="mt-10 text-light text-small">有效期至 {{item.expireText || '—'}}</view>
        </view>
        <view class="row-actions">
          <text class="action" data-id="{{item.id}}" bindtap="onTapEdit">编辑</text>
          <text class="action text-error ml-20" data-id="{{item.id}}" bindtap="onDelete">删除</text>
        </view>
      </view>
    </view>
  </card>
</view>
`,
    wxss: `.radio-item{margin-right:24rpx;}
.coupon-row{display:flex;align-items:center;gap:16rpx;background:#fff;border-radius:16rpx;padding:24rpx;margin-bottom:16rpx;box-shadow:var(--shadow);}
.row-actions{display:flex;flex-direction:row;align-items:center;}
.action{color:var(--primary-color);}
`,
    json: `{
  "navigationBarTitleText": "优惠券管理",
  "enablePullDownRefresh": true
}
`
  }
];

const created = [];
for (const p of pages) {
  const base = path.join(miniprogramRoot, p.name);
  if (p.json) {
    const file = `${base}.json`;
    if (writeFileIfMissing(file, p.json)) created.push(file);
  }
  if (p.js) {
    const file = `${base}.js`;
    if (writeFileIfMissing(file, p.js)) created.push(file);
  }
  if (p.wxml) {
    const file = `${base}.wxml`;
    if (writeFileIfMissing(file, p.wxml)) created.push(file);
  }
  if (p.wxss !== null && p.wxss !== undefined) {
    const file = `${base}.wxss`;
    if (writeFileIfMissing(file, p.wxss)) created.push(file);
  }
}

const png1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEWQH9d7tAnwAAAABJRU5ErkJggg==',
  'base64'
);

const images = [
  'tab-home.png',
  'tab-home-active.png',
  'tab-class.png',
  'tab-class-active.png',
  'tab-mine.png',
  'tab-mine-active.png'
];

for (const name of images) {
  const file = path.join(miniprogramRoot, 'images', name);
  if (!fs.existsSync(file)) {
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, png1x1);
    created.push(file);
  }
}

const missingPages = [];
const appJsonPath = path.join(miniprogramRoot, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
for (const pagePath of appJson.pages || []) {
  const base = path.join(miniprogramRoot, pagePath);
  const wxml = `${base}.wxml`;
  const js = `${base}.js`;
  if (!fs.existsSync(wxml) || !fs.existsSync(js)) missingPages.push(pagePath);
}

const out = {
  createdCount: created.length,
  created: created.map(p => path.relative(repoRoot, p)),
  missingPages
};

process.stdout.write(JSON.stringify(out, null, 2));
