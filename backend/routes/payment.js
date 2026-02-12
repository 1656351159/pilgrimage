const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const Order = require('../models/order');
const Course = require('../models/course');
const Coupon = require('../models/coupon');
const Enrollment = require('../models/enrollment');
const wxConfig = require('../config/wx');

/**
 * 生成唯一订单号
 * 格式：年月日时分秒 + 6位随机数
 */
function generateOrderNo() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return dateStr + random;
}

/**
 * 计算优惠后的实付金额
 * @param {number} amount - 原价（分）
 * @param {object} coupon - 优惠券对象
 * @returns {object} { discountAmount, payAmount }
 */
function calculateDiscount(amount, coupon) {
  let discountAmount = 0;

  if (!coupon) {
    return { discountAmount: 0, payAmount: amount };
  }

  if (coupon.type === 'fixed') {
    // 满减：直接减去面值
    discountAmount = coupon.value;
  } else if (coupon.type === 'percent') {
    // 折扣：按百分比计算（value 表示折扣，如 80 表示八折）
    discountAmount = Math.floor(amount * (100 - coupon.value) / 100);
  }

  // 优惠金额不能超过订单金额
  discountAmount = Math.min(discountAmount, amount);
  const payAmount = amount - discountAmount;

  return { discountAmount, payAmount };
}

/**
 * POST /api/payment/create-order
 * 创建订单（支持使用优惠券）
 */
router.post('/create-order', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { course_id, student_id, coupon_code } = req.body;

    if (!course_id) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：course_id'
      });
    }

    // 查询课程信息
    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({
        code: 404,
        message: '课程不存在'
      });
    }

    if (course.status !== 1 && course.status !== '1') {
      return res.status(400).json({
        code: 400,
        message: '该课程已下架'
      });
    }

    let coupon = null;
    let couponId = null;

    // 处理优惠券
    if (coupon_code) {
      coupon = await Coupon.findByCode(coupon_code);

      if (!coupon) {
        return res.status(400).json({
          code: 400,
          message: '优惠券不存在'
        });
      }

      // 检查优惠券状态
      if (coupon.status !== 1 && coupon.status !== '1') {
        return res.status(400).json({
          code: 400,
          message: '优惠券已停用'
        });
      }

      // 检查优惠券是否过期
      if (coupon.expire_date && new Date(coupon.expire_date) < new Date()) {
        return res.status(400).json({
          code: 400,
          message: '优惠券已过期'
        });
      }

      // 检查优惠券使用次数是否已达上限
      if (coupon.total_count > 0 && parseInt(coupon.used_count, 10) >= parseInt(coupon.total_count, 10)) {
        return res.status(400).json({
          code: 400,
          message: '优惠券已被领完'
        });
      }

      // 检查最低使用金额
      if (coupon.min_amount > 0 && course.price < coupon.min_amount) {
        return res.status(400).json({
          code: 400,
          message: `订单金额未满足优惠券最低使用金额（${coupon.min_amount / 100} 元）`
        });
      }

      // 检查该用户是否已使用过该优惠券
      const used = await Coupon.checkUsage(coupon.id, userId);
      if (used) {
        return res.status(400).json({
          code: 400,
          message: '您已使用过该优惠券'
        });
      }

      couponId = coupon.id;
    }

    // 计算优惠后金额
    const { discountAmount, payAmount } = calculateDiscount(course.price, coupon);

    // 生成订单号
    const orderNo = generateOrderNo();

    // 创建订单
    const order = await Order.create({
      order_no: orderNo,
      user_id: userId,
      student_id: student_id || null,
      course_id,
      amount: course.price,
      discount_amount: discountAmount,
      pay_amount: payAmount,
      coupon_id: couponId,
      status: 0 // 待支付
    });

    // 如果使用了优惠券，记录使用并增加已使用数量
    if (couponId) {
      await Coupon.recordUsage(couponId, userId, order.id);
      await Coupon.incrementUsedCount(couponId);
    }

    // TODO: 调用微信统一下单接口获取预支付参数
    // 此处返回订单信息，实际项目需要对接微信支付
    res.json({
      code: 0,
      message: 'success',
      data: {
        order_id: order.id,
        order_no: orderNo,
        amount: course.price,
        discount_amount: discountAmount,
        pay_amount: payAmount
        // payment_params: { ... } // 微信支付参数
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payment/wx-notify
 * 微信支付回调通知（无需认证）
 * 微信服务器在用户支付成功后会调用此接口通知支付结果
 */
router.post('/wx-notify', async (req, res, next) => {
  try {
    // 注意：实际项目中需要解析微信发送的 XML 数据
    // 这里使用简化的 JSON 格式作为示例
    const { out_trade_no, transaction_id, result_code } = req.body;

    if (result_code !== 'SUCCESS') {
      // 支付失败，返回成功以告知微信不要重复通知
      return res.json({
        code: 0,
        message: 'success'
      });
    }

    if (!out_trade_no) {
      return res.status(400).json({
        code: 400,
        message: '缺少订单号'
      });
    }

    // 根据订单号查找订单
    const order = await Order.findByOrderNo(out_trade_no);
    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    // 防止重复处理：如果订单已是已支付状态，直接返回成功
    if (order.status === 1 || order.status === '1') {
      return res.json({
        code: 0,
        message: 'success'
      });
    }

    // 更新订单支付状态
    await Order.updatePaymentStatus(order.id, 1, transaction_id || '');

    // 支付成功后，自动创建报名记录
    const course = await Course.findById(order.course_id);
    if (course && order.student_id) {
      await Enrollment.create({
        student_id: order.student_id,
        course_id: order.course_id,
        order_id: order.id,
        total_hours: course.total_hours || 0,
        remaining_hours: course.total_hours || 0
      });
    }

    // 返回成功，告知微信不再重复通知
    res.json({
      code: 0,
      message: 'success'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/payment/orders
 * 获取当前用户的订单列表
 */
router.get('/orders', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orders = await Order.findByUserId(userId);

    res.json({
      code: 0,
      message: 'success',
      data: orders
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
