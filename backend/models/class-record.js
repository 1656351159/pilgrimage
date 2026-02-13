const pool = require('../config/database');

const ClassRecord = {
  /**
   * 根据报名记录 ID 查询消课记录
   * @param {number} enrollmentId - 报名记录 ID
   */
  async findByEnrollmentId(enrollmentId) {
    const [rows] = await pool.execute(
      `SELECT cr.*, u.nickname AS teacher_name
       FROM class_records cr
       LEFT JOIN users u ON cr.teacher_id = u.id
       WHERE cr.enrollment_id = ?
       ORDER BY cr.class_date DESC`,
      [enrollmentId]
    );
    return rows;
  },

  /**
   * 创建消课记录（老师上课后记录消课）
   * @param {object} data - 消课数据
   * @param {number} data.enrollment_id - 报名记录 ID
   * @param {number} data.teacher_id - 教师 ID
   * @param {number} data.hours - 消耗课时数
   * @param {string} data.class_date - 上课日期
   * @param {string} data.content - 上课内容
   * @param {string} data.remark - 备注
   */
  async create(data) {
    const { enrollment_id, teacher_id, hours, class_date, content, remark } = data;
    const [result] = await pool.execute(
      `INSERT INTO class_records (enrollment_id, teacher_id, hours, class_date, content, remark, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [enrollment_id, teacher_id, hours || 1, class_date, content || '', remark || '']
    );
    return { id: result.insertId, ...data };
  },

  /**
   * 根据教师 ID 查询其所有消课记录
   * @param {number} teacherId - 教师用户 ID
   */
  async findByTeacherId(teacherId) {
    const [rows] = await pool.execute(
      `SELECT cr.*, e.student_id, s.name AS student_name, c.name AS course_name
       FROM class_records cr
       LEFT JOIN enrollments e ON cr.enrollment_id = e.id
       LEFT JOIN students s ON e.student_id = s.id
       LEFT JOIN courses c ON e.course_id = c.id
       WHERE cr.teacher_id = ?
       ORDER BY cr.class_date DESC`,
      [teacherId]
    );
    return rows;
  },

  /**
   * 根据学生 ID 查询消课记录（关联报名表）
   * @param {number} studentId - 学生 ID
   */
  async findByStudentId(studentId) {
    const [rows] = await pool.execute(
      `SELECT cr.*, c.name AS course_name, u.nickname AS teacher_name
       FROM class_records cr
       INNER JOIN enrollments e ON cr.enrollment_id = e.id
       LEFT JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON cr.teacher_id = u.id
       WHERE e.student_id = ?
       ORDER BY cr.class_date DESC`,
      [studentId]
    );
    return rows;
  }
};

module.exports = ClassRecord;
