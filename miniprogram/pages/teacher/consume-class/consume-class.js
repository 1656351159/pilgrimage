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
