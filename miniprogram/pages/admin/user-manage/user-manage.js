const adminService = require('../../../services/admin');
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
    selectedRoleLabel: '全部',
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
    const roleIndex = Number(e.detail.value) || 0;
    const selectedRoleLabel = this.data.roleOptions[roleIndex]?.label || '全部';
    this.setData({ roleIndex, selectedRoleLabel });
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
    if (!/^1\d{10}$/.test(f.phone)) return showError('请输入正确手机号');
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
