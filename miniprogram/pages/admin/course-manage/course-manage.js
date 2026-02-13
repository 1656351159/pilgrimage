const adminService = require('../../../services/admin');
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
    selectedTeacher: {},
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
      const selectedTeacher = teachers[teacherIndex] || {};
      this.setData({ teachers, teacherIndex, selectedTeacher });
      if (!this.data.form.teacher_id && selectedTeacher.id) {
        this.setData({ 'form.teacher_id': selectedTeacher.id });
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
    const teacher = this.data.selectedTeacher;
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
    this.setData({
      teacherIndex,
      selectedTeacher: teacher || {},
      'form.teacher_id': teacher ? teacher.id : ''
    });
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
    const selectedTeacher = this.data.teachers[teacherIndex] || {};
    this.setData({
      teacherIndex,
      selectedTeacher,
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
