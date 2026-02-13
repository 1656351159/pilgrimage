const pool = require('../config/database');

const Enrollment = {
  /**
   * 根据学生 ID 查询其所有报名记录
   * @param {number} studentId - 学生 ID
   */
  async findByStudentId(studentId) {
    const [rows] = await pool.execute(
      `SELECT e.*, c.name AS course_name, c.type AS course_type, u.nickname AS teacher_name
       FROM enrollments e
       LEFT JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE e.student_id = ?
       ORDER BY e.created_at DESC`,
      [studentId]
    );
    return rows;
  },

  /**
   * 根据 ID 查找报名记录
   * @param {number} id - 报名记录 ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT e.*, c.name AS course_name, c.type AS course_type
       FROM enrollments e
       LEFT JOIN courses c ON e.course_id = c.id
       WHERE e.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * 创建报名记录
   * @param {object} data - 报名数据
   * @param {number} data.student_id - 学生 ID
   * @param {number} data.course_id - 课程 ID
   * @param {number} data.order_id - 关联订单 ID
   * @param {number} data.total_hours - 总课时
   * @param {number} data.remaining_hours - 剩余课时
   */
  async create(data) {
    const { student_id, course_id, order_id, total_hours, remaining_hours } = data;
    const [result] = await pool.execute(
      `INSERT INTO enrollments (student_id, course_id, order_id, total_hours, remaining_hours, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [student_id, course_id, order_id || null, total_hours || 0, remaining_hours || total_hours || 0]
    );
    return { id: result.insertId, ...data };
  },

  /**
   * 更新剩余课时（消课时使用）
   * @param {number} id - 报名记录 ID
   * @param {number} hours - 本次消耗的课时数
   */
  async updateRemainingHours(id, hours) {
    // 使用原子操作减少剩余课时，并确保不会减为负数
    const [result] = await pool.execute(
      `UPDATE enrollments
       SET remaining_hours = remaining_hours - ?, updated_at = NOW()
       WHERE id = ? AND remaining_hours >= ?`,
      [hours, id, hours]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Enrollment;
