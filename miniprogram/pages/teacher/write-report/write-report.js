const teacherService = require('../../../services/teacher');
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
    selectedStudentName: '请选择',
    selectedCourseName: '请选择',
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
      const studentIndex = Math.min(this.data.studentIndex, Math.max(students.length - 1, 0));
      const courseIndex = Math.min(this.data.courseIndex, Math.max(courses.length - 1, 0));
      const selectedStudentName = students[studentIndex]?.name || '请选择';
      const selectedCourseName = courses[courseIndex]?.name || '请选择';
      this.setData({
        students,
        courses,
        recent,
        studentIndex,
        courseIndex,
        selectedStudentName,
        selectedCourseName,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  onStudentChange(e) {
    const studentIndex = Number(e.detail.value) || 0;
    const selectedStudentName = this.data.students[studentIndex]?.name || '请选择';
    this.setData({ studentIndex, selectedStudentName });
  },

  onCourseChange(e) {
    const courseIndex = Number(e.detail.value) || 0;
    const selectedCourseName = this.data.courses[courseIndex]?.name || '请选择';
    this.setData({ courseIndex, selectedCourseName });
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
