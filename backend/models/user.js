const pool = require('../config/database');

const User = {
  /**
   * 根据微信 openid 查找用户
   * @param {string} openid - 微信用户唯一标识
   */
  async findByOpenid(openid) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    );
    return rows[0] || null;
  },

  /**
   * 创建新用户
   * @param {object} userData - 用户数据
   * @param {string} userData.openid - 微信 openid
   * @param {string} userData.nickname - 昵称
   * @param {string} userData.avatar_url - 头像地址
   * @param {string} userData.phone - 手机号
   * @param {string} userData.role - 角色：parent/teacher/admin
   */
  async create(userData) {
    const { openid, nickname, avatar_url, phone, role } = userData;
    const [result] = await pool.execute(
      `INSERT INTO users (openid, nickname, avatar_url, phone, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [openid, nickname || '', avatar_url || '', phone || '', role || 'parent']
    );
    return { id: result.insertId, ...userData };
  },

  /**
   * 根据 ID 查找用户
   * @param {number} id - 用户 ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * 更新用户信息
   * @param {number} id - 用户 ID
   * @param {object} data - 需要更新的字段
   */
  async updateById(id, data) {
    const fields = [];
    const values = [];

    // 动态构建 SET 子句，仅更新传入的字段
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = NOW()');
    values.push(id);

    const [result] = await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * 查询所有用户（支持分页和筛选）
   * @param {object} filters - 筛选条件
   */
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      sql += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.phone) {
      sql += ' AND phone LIKE ?';
      params.push(`%${filters.phone}%`);
    }

    if (filters.nickname) {
      sql += ' AND nickname LIKE ?';
      params.push(`%${filters.nickname}%`);
    }

    // 分页
    const page = parseInt(filters.page, 10) || 1;
    const pageSize = parseInt(filters.pageSize, 10) || 20;
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const [rows] = await pool.execute(sql, params);
    return rows;
  }
};

module.exports = User;
