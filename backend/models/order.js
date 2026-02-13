const pool = require('../config/database');

const Order = {
  /**
   * 创建订单
   * @param {object} data - 订单数据
   * @param {string} data.order_no - 订单号
   * @param {number} data.user_id - 用户 ID
   * @param {number} data.student_id - 学生 ID
   * @param {number} data.course_id - 课程 ID
   * @param {number} data.amount - 订单金额（分）
   * @param {number} data.discount_amount - 优惠金额（分）
   * @param {number} data.pay_amount - 实付金额（分）
   * @param {number} data.coupon_id - 优惠券 ID
   * @param {number} data.status - 订单状态：0 待支付，1 已支付，2 已取消，3 已退款
   */
  async create(data) {
    const {
      order_no, user_id, student_id, course_id,
      amount, discount_amount, pay_amount, coupon_id, status
    } = data;
    const [result] = await pool.execute(
      `INSERT INTO orders (order_no, user_id, student_id, course_id, amount, discount_amount, pay_amount, coupon_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        order_no, user_id, student_id || null, course_id,
        amount || 0, discount_amount || 0, pay_amount || 0,
        coupon_id || null, status || 0
      ]
    );
    return { id: result.insertId, ...data };
  },

  /**
   * 根据 ID 查找订单
   * @param {number} id - 订单 ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT o.*, c.name AS course_name, s.name AS student_name
       FROM orders o
       LEFT JOIN courses c ON o.course_id = c.id
       LEFT JOIN students s ON o.student_id = s.id
       WHERE o.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * 根据订单号查找订单
   * @param {string} orderNo - 订单号
   */
  async findByOrderNo(orderNo) {
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE order_no = ?',
      [orderNo]
    );
    return rows[0] || null;
  },

  /**
   * 根据用户 ID 查询订单列表
   * @param {number} userId - 用户 ID
   */
  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT o.*, c.name AS course_name, s.name AS student_name
       FROM orders o
       LEFT JOIN courses c ON o.course_id = c.id
       LEFT JOIN students s ON o.student_id = s.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return rows;
  },

  /**
   * 更新支付状态（支付回调时使用）
   * @param {number} id - 订单 ID
   * @param {number} status - 新状态
   * @param {string} transactionId - 微信支付交易号
   */
  async updatePaymentStatus(id, status, transactionId) {
    const [result] = await pool.execute(
      `UPDATE orders SET status = ?, transaction_id = ?, pay_time = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [status, transactionId || '', id]
    );
    return result.affectedRows > 0;
  },

  /**
   * 查询所有订单（管理端，支持分页）
   * @param {object} filters - 筛选条件
   */
  async findAll(filters = {}) {
    let sql = `SELECT o.*, c.name AS course_name, s.name AS student_name, u.nickname AS user_nickname
               FROM orders o
               LEFT JOIN courses c ON o.course_id = c.id
               LEFT JOIN students s ON o.student_id = s.id
               LEFT JOIN users u ON o.user_id = u.id
               WHERE 1=1`;
    const params = [];

    if (filters.status !== undefined) {
      sql += ' AND o.status = ?';
      params.push(filters.status);
    }

    if (filters.order_no) {
      sql += ' AND o.order_no = ?';
      params.push(filters.order_no);
    }

    const page = parseInt(filters.page, 10) || 1;
    const pageSize = parseInt(filters.pageSize, 10) || 20;
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const [rows] = await pool.execute(sql, params);
    return rows;
  }
};

module.exports = Order;
