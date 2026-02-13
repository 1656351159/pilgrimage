const pool = require('../config/database');

const GrowthReport = {
  /**
   * 根据学生 ID 查询成长报告
   * @param {number} studentId - 学生 ID
   */
  async findByStudentId(studentId) {
    const [rows] = await pool.execute(
      `SELECT gr.*, u.nickname AS teacher_name, c.name AS course_name
       FROM growth_reports gr
       LEFT JOIN users u ON gr.teacher_id = u.id
       LEFT JOIN courses c ON gr.course_id = c.id
       WHERE gr.student_id = ?
       ORDER BY gr.report_date DESC`,
      [studentId]
    );
    return rows;
  },

  /**
   * 根据 ID 查找成长报告
   * @param {number} id - 报告 ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT gr.*, u.nickname AS teacher_name, c.name AS course_name
       FROM growth_reports gr
       LEFT JOIN users u ON gr.teacher_id = u.id
       LEFT JOIN courses c ON gr.course_id = c.id
       WHERE gr.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * 创建成长报告（教师填写）
   * @param {object} data - 报告数据
   * @param {number} data.student_id - 学生 ID
   * @param {number} data.teacher_id - 教师 ID
   * @param {number} data.course_id - 课程 ID
   * @param {string} data.report_date - 报告日期
   * @param {string} data.content - 报告内容
   * @param {string} data.evaluation - 综合评价
   * @param {number} data.score - 评分
   * @param {string} data.suggestions - 改进建议
   */
  async create(data) {
    const { student_id, teacher_id, course_id, report_date, content, evaluation, score, suggestions } = data;
    const [result] = await pool.execute(
      `INSERT INTO growth_reports (student_id, teacher_id, course_id, report_date, content, evaluation, score, suggestions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [student_id, teacher_id, course_id || null, report_date, content || '', evaluation || '', score || null, suggestions || '']
    );
    return { id: result.insertId, ...data };
  },

  /**
   * 更新成长报告
   * @param {number} id - 报告 ID
   * @param {object} data - 需要更新的字段
   */
  async updateById(id, data) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = NOW()');
    values.push(id);

    const [result] = await pool.execute(
      `UPDATE growth_reports SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * 根据教师 ID 查询其创建的所有成长报告
   * @param {number} teacherId - 教师用户 ID
   */
  async findByTeacherId(teacherId) {
    const [rows] = await pool.execute(
      `SELECT gr.*, s.name AS student_name, c.name AS course_name
       FROM growth_reports gr
       LEFT JOIN students s ON gr.student_id = s.id
       LEFT JOIN courses c ON gr.course_id = c.id
       WHERE gr.teacher_id = ?
       ORDER BY gr.report_date DESC`,
      [teacherId]
    );
    return rows;
  }
};

module.exports = GrowthReport;
