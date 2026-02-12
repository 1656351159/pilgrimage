const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Student = require('../models/student');
const ClassRecord = require('../models/class-record');
const GrowthReport = require('../models/growth-report');
const Enrollment = require('../models/enrollment');

// 所有家长端路由需要认证 + 家长角色
router.use(authenticate, authorize('parent'));

/**
 * GET /api/parent/children
 * 获取当前家长的所有孩子列表
 */
router.get('/children', async (req, res, next) => {
  try {
    const parentId = req.user.id;
    const children = await Student.findByParentId(parentId);

    res.json({
      code: 0,
      message: 'success',
      data: children
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/parent/children/:id/class-records
 * 获取指定孩子的消课记录
 */
router.get('/children/:id/class-records', async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const parentId = req.user.id;

    // 校验该学生是否属于当前家长
    const student = await Student.findById(studentId);
    if (!student || student.parent_id !== parseInt(parentId, 10)) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该学生信息'
      });
    }

    const records = await ClassRecord.findByStudentId(studentId);

    res.json({
      code: 0,
      message: 'success',
      data: records
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/parent/children/:id/growth-reports
 * 获取指定孩子的成长报告列表
 */
router.get('/children/:id/growth-reports', async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const parentId = req.user.id;

    // 校验该学生是否属于当前家长
    const student = await Student.findById(studentId);
    if (!student || student.parent_id !== parseInt(parentId, 10)) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该学生信息'
      });
    }

    const reports = await GrowthReport.findByStudentId(studentId);

    res.json({
      code: 0,
      message: 'success',
      data: reports
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/parent/children/:id/enrollments
 * 获取指定孩子的报名记录与剩余课时
 */
router.get('/children/:id/enrollments', async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const parentId = req.user.id;

    // 校验该学生是否属于当前家长
    const student = await Student.findById(studentId);
    if (!student || student.parent_id !== parseInt(parentId, 10)) {
      return res.status(403).json({
        code: 403,
        message: '无权查看该学生信息'
      });
    }

    const enrollments = await Enrollment.findByStudentId(studentId);

    res.json({
      code: 0,
      message: 'success',
      data: enrollments
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
