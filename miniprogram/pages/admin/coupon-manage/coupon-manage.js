const adminService = require('../../../services/admin');
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
