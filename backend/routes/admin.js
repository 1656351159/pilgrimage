const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/user');
const Course = require('../models/course');
const Order = require('../models/order');
const Coupon = require('../models/coupon');

// 所有管理端路由需要认证 + 管理员角色
router.use(authenticate, authorize('admin'));

// ==================== 用户管理 ====================

/**
 * GET /api/admin/users
 * 获取用户列表（支持按角色、手机号、昵称筛选）
 */
router.get('/users', async (req, res, next) => {
  try {
    const filters = {
      role: req.query.role,
      phone: req.query.phone,
      nickname: req.query.nickname,
      page: req.query.page,
      pageSize: req.query.pageSize
    };
    const users = await User.findAll(filters);

    res.json({
      code: 0,
      message: 'success',
      data: users
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users/:id
 * 获取单个用户详情
 */
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.json({
      code: 0,
      message: 'success',
      data: user
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/users
 * 创建用户（管理员手动添加教师等角色）
 */
router.post('/users', async (req, res, next) => {
  try {
    const { openid, nickname, phone, role, avatar_url } = req.body;

    if (!openid) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：openid'
      });
    }

    // 检查 openid 是否已存在
    const existing = await User.findByOpenid(openid);
    if (existing) {
      return res.status(400).json({
        code: 400,
        message: '该 openid 用户已存在'
      });
    }

    const user = await User.create({
      openid,
      nickname: nickname || '',
      phone: phone || '',
      role: role || 'parent',
      avatar_url: avatar_url || ''
    });

    res.json({
      code: 0,
      message: 'success',
      data: user
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/users/:id
 * 更新用户信息（如修改角色、手机号等）
 */
router.put('/users/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { nickname, phone, role, avatar_url } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    await User.updateById(userId, updateData);

    res.json({
      code: 0,
      message: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
});

// ==================== 课程管理 ====================

/**
 * GET /api/admin/courses
 * 获取课程列表
 */
router.get('/courses', async (req, res, next) => {
  try {
    const filters = {
      name: req.query.name,
      type: req.query.type,
      status: req.query.status,
      teacher_id: req.query.teacher_id,
      page: req.query.page,
      pageSize: req.query.pageSize
    };
    const courses = await Course.findAll(filters);

    res.json({
      code: 0,
      message: 'success',
      data: courses
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/courses/:id
 * 获取单个课程详情
 */
router.get('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        code: 404,
        message: '课程不存在'
      });
    }

    res.json({
      code: 0,
      message: 'success',
      data: course
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/courses
 * 创建课程
 */
router.post('/courses', async (req, res, next) => {
  try {
    const { name, type, teacher_id, total_hours, price, description, status } = req.body;

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：课程名称'
      });
    }

    const course = await Course.create({
      name,
      type: type || '',
      teacher_id: teacher_id || null,
      total_hours: total_hours || 0,
      price: price || 0,
      description: description || '',
      status: status !== undefined ? status : 1
    });

    res.json({
      code: 0,
      message: 'success',
      data: course
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/courses/:id
 * 更新课程信息
 */
router.put('/courses/:id', async (req, res, next) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        code: 404,
        message: '课程不存在'
      });
    }

    const updateData = {};
    const allowedFields = ['name', 'type', 'teacher_id', 'total_hours', 'price', 'description', 'status'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    await Course.updateById(courseId, updateData);

    res.json({
      code: 0,
      message: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
});

// ==================== 订单管理 ====================

/**
 * GET /api/admin/orders
 * 获取订单列表
 */
router.get('/orders', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      order_no: req.query.order_no,
      page: req.query.page,
      pageSize: req.query.pageSize
    };
    const orders = await Order.findAll(filters);

    res.json({
      code: 0,
      message: 'success',
      data: orders
    });
  } catch (err) {
    next(err);
  }
});

// ==================== 优惠券管理 ====================

/**
 * GET /api/admin/coupons
 * 获取优惠券列表
 */
router.get('/coupons', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      page: req.query.page,
      pageSize: req.query.pageSize
    };
    const coupons = await Coupon.findAll(filters);

    res.json({
      code: 0,
      message: 'success',
      data: coupons
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/coupons/:id
 * 获取单个优惠券详情
 */
router.get('/coupons/:id', async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        code: 404,
        message: '优惠券不存在'
      });
    }

    res.json({
      code: 0,
      message: 'success',
      data: coupon
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/coupons
 * 创建优惠券
 */
router.post('/coupons', async (req, res, next) => {
  try {
    const { code, name, type, value, min_amount, start_date, expire_date, total_count, status } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：优惠码、名称'
      });
    }

    // 检查优惠码是否已存在
    const existing = await Coupon.findByCode(code);
    if (existing) {
      return res.status(400).json({
        code: 400,
        message: '该优惠码已存在'
      });
    }

    const coupon = await Coupon.create({
      code,
      name,
      type: type || 'fixed',
      value: value || 0,
      min_amount: min_amount || 0,
      start_date: start_date || null,
      expire_date: expire_date || null,
      total_count: total_count || 0,
      used_count: 0,
      status: status !== undefined ? status : 1
    });

    res.json({
      code: 0,
      message: 'success',
      data: coupon
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/coupons/:id
 * 更新优惠券信息
 */
router.put('/coupons/:id', async (req, res, next) => {
  try {
    const couponId = req.params.id;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        code: 404,
        message: '优惠券不存在'
      });
    }

    const updateData = {};
    const allowedFields = ['name', 'type', 'value', 'min_amount', 'start_date', 'expire_date', 'total_count', 'status'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    await Coupon.updateById(couponId, updateData);

    res.json({
      code: 0,
      message: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
