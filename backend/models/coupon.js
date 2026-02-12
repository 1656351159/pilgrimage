const pool = require('../config/database');

const Coupon = {
  /**
   * 查询所有优惠券（支持筛选和分页）
   * @param {object} filters - 筛选条件
   */
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM coupons WHERE 1=1';
    const params = [];

    // 按状态筛选（启用/停用）
    if (filters.status !== undefined) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    // 按类型筛选
    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    // 仅查询未过期的
    if (filters.valid) {
      sql += ' AND expire_date >= CURDATE()';
    }

    const page = parseInt(filters.page, 10) || 1;
    const pageSize = parseInt(filters.pageSize, 10) || 20;
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /**
   * 根据优惠码查找优惠券
   * @param {string} code - 优惠码
   */
  async findByCode(code) {
    const [rows] = await pool.execute(
      'SELECT * FROM coupons WHERE code = ?',
      [code]
    );
    return rows[0] || null;
  },

  /**
   * 根据 ID 查找优惠券
   * @param {number} id - 优惠券 ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM coupons WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * 创建优惠券
   * @param {object} data - 优惠券数据
   * @param {string} data.code - 优惠码
   * @param {string} data.name - 优惠券名称
   * @param {string} data.type - 类型：fixed（满减）、percent（折扣）
   * @param {number} data.value - 面值（分或折扣百分比）
   * @param {number} data.min_amount - 最低使用金额（分）
   * @param {string} data.start_date - 开始日期
   * @param {string} data.expire_date - 过期日期
   * @param {number} data.total_count - 发行总量
   * @param {number} data.used_count - 已使用数量
   * @param {number} data.status - 状态：1 启用，0 停用
   */
  async create(data) {
    const {
      code, name, type, value, min_amount,
      start_date, expire_date, total_count, used_count, status
    } = data;
    const [result] = await pool.execute(
      `INSERT INTO coupons (code, name, type, value, min_amount, start_date, expire_date, total_count, used_count, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        code, name, type || 'fixed', value || 0, min_amount || 0,
        start_date || null, expire_date || null,
        total_count || 0, used_count || 0, status !== undefined ? status : 1
      ]
    );
    return { id: result.insertId, ...data };
  },

  /**
   * 更新优惠券信息
   * @param {number} id - 优惠券 ID
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
      `UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * 增加优惠券已使用数量（原子操作）
   * @param {number} id - 优惠券 ID
   */
  async incrementUsedCount(id) {
    const [result] = await pool.execute(
      `UPDATE coupons SET used_count = used_count + 1, updated_at = NOW()
       WHERE id = ? AND (total_count = 0 OR used_count < total_count)`,
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * 检查用户是否已使用过该优惠券
   * @param {number} couponId - 优惠券 ID
   * @param {number} userId - 用户 ID
   */
  async checkUsage(couponId, userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
      [couponId, userId]
    );
    return rows[0].count > 0;
  },

  /**
   * 记录优惠券使用
   * @param {number} couponId - 优惠券 ID
   * @param {number} userId - 用户 ID
   * @param {number} orderId - 订单 ID
   */
  async recordUsage(couponId, userId, orderId) {
    const [result] = await pool.execute(
      `INSERT INTO coupon_usage (coupon_id, user_id, order_id, used_at)
       VALUES (?, ?, ?, NOW())`,
      [couponId, userId, orderId]
    );
    return { id: result.insertId };
  }
};

module.exports = Coupon;
