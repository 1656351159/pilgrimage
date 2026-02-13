const pool = require('../config/database');

const Course = {
  /**
   * 查询所有课程（支持筛选和分页）
   * @param {object} filters - 筛选条件
   */
  async findAll(filters = {}) {
    let sql = 'SELECT c.*, u.nickname AS teacher_name FROM courses c LEFT JOIN users u ON c.teacher_id = u.id WHERE 1=1';
    const params = [];

    // 按课程名称模糊搜索
    if (filters.name) {
      sql += ' AND c.name LIKE ?';
      params.push(`%${filters.name}%`);
    }

    // 按课程类型筛选
    if (filters.type) {
      sql += ' AND c.type = ?';
      params.push(filters.type);
    }

    // 按状态筛选（上架/下架）
    if (filters.status !== undefined) {
      sql += ' AND c.status = ?';
      params.push(filters.status);
    }

    // 按教师筛选
    if (filters.teacher_id) {
      sql += ' AND c.teacher_id = ?';
      params.push(filters.teacher_id);
    }

    // 分页
    const page = parseInt(filters.page, 10) || 1;
    const pageSize = parseInt(filters.pageSize, 10) || 20;
    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /**
   * 根据 ID 查找课程
   * @param {number} id - 课程 ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT c.*, u.nickname AS teacher_name
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * 创建课程
   * @param {object} data - 课程数据
   * @param {string} data.name - 课程名称
   * @param {string} data.type - 课程类型
   * @param {number} data.teacher_id - 授课教师 ID
   * @param {number} data.total_hours - 总课时
   * @param {number} data.price - 课程价格（分）
   * @param {string} data.description - 课程描述
   * @param {number} data.status - 状态：1 上架，0 下架
   */
  async create(data) {
    const { name, type, teacher_id, total_hours, price, description, status } = data;
    const [result] = await pool.execute(
      `INSERT INTO courses (name, type, teacher_id, total_hours, price, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, type || '', teacher_id || null, total_hours || 0, price || 0, description || '', status !== undefined ? status : 1]
    );
    return { id: result.insertId, ...data };
  },

  /**
   * 更新课程信息
   * @param {number} id - 课程 ID
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
      `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * 根据教师 ID 查询其负责的课程
   * @param {number} teacherId - 教师用户 ID
   */
  async findByTeacherId(teacherId) {
    const [rows] = await pool.execute(
      'SELECT * FROM courses WHERE teacher_id = ? ORDER BY created_at DESC',
      [teacherId]
    );
    return rows;
  }
};

module.exports = Course;
