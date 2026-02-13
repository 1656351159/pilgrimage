const pool = require('../config/database');

const Student = {
  /**
   * 根据家长用户 ID 查找其所有孩子
   * @param {number} parentId - 家长用户 ID
   */
  async findByParentId(parentId) {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE parent_id = ? ORDER BY created_at DESC',
      [parentId]
    );
    return rows;
  },

  /**
   * 根据 ID 查找学生
   * @param {number} id - 学生 ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * 创建学生记录
   * @param {object} data - 学生数据
   * @param {number} data.parent_id - 家长用户 ID
   * @param {string} data.name - 学生姓名
   * @param {string} data.gender - 性别
   * @param {string} data.birthday - 出生日期
   * @param {string} data.school - 学校
   * @param {string} data.grade - 年级
   */
  async create(data) {
    const { parent_id, name, gender, birthday, school, grade } = data;
    const [result] = await pool.execute(
      `INSERT INTO students (parent_id, name, gender, birthday, school, grade, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [parent_id, name, gender || '', birthday || null, school || '', grade || '']
    );
    return { id: result.insertId, ...data };
  },

  /**
   * 更新学生信息
   * @param {number} id - 学生 ID
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
      `UPDATE students SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }
};

module.exports = Student;
