const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Course = require('../models/course');
const ClassRecord = require('../models/class-record');
const GrowthReport = require('../models/growth-report');
const Enrollment = require('../models/enrollment');
const pool = require('../config/database');

// 所有教师端路由需要认证 + 教师角色
router.use(authenticate, authorize('teacher'));

/**
 * GET /api/teacher/students
 * 获取该教师所负责课程下的所有学生
 */
router.get('/students', async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // 查询教师所负责课程中报名的学生列表（去重）
    const [rows] = await pool.execute(
      `SELECT DISTINCT s.*, c.name AS course_name, e.remaining_hours
       FROM students s
       INNER JOIN enrollments e ON s.id = e.student_id
       INNER JOIN courses c ON e.course_id = c.id
       WHERE c.teacher_id = ?
       ORDER BY s.name`,
      [teacherId]
    );

    res.json({
      code: 0,
      message: 'success',
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/teacher/class-records
 * 创建消课记录（教师上课后记录消课）
 */
router.post('/class-records', async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { enrollment_id, hours, class_date, content, remark } = req.body;

    if (!enrollment_id || !class_date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：enrollment_id、class_date'
      });
    }

    // 校验报名记录是否存在
    const enrollment = await Enrollment.findById(enrollment_id);
    if (!enrollment) {
      return res.status(404).json({
        code: 404,
        message: '报名记录不存在'
      });
    }

    // 校验该报名记录对应的课程是否属于当前教师
    const course = await Course.findById(enrollment.course_id);
    if (!course || course.teacher_id !== parseInt(teacherId, 10)) {
      return res.status(403).json({
        code: 403,
        message: '无权为该课程消课'
      });
    }

    const consumeHours = hours || 1;

    // 检查剩余课时是否充足
    if (parseInt(enrollment.remaining_hours, 10) < consumeHours) {
      return res.status(400).json({
        code: 400,
        message: '剩余课时不足，无法消课'
      });
    }

    // 扣减课时
    const updated = await Enrollment.updateRemainingHours(enrollment_id, consumeHours);
    if (!updated) {
      return res.status(400).json({
        code: 400,
        message: '消课失败，剩余课时不足'
      });
    }

    // 创建消课记录
    const record = await ClassRecord.create({
      enrollment_id,
      teacher_id: teacherId,
      hours: consumeHours,
      class_date,
      content: content || '',
      remark: remark || ''
    });

    res.json({
      code: 0,
      message: 'success',
      data: record
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/teacher/class-records
 * 获取当前教师的所有消课记录
 */
router.get('/class-records', async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const records = await ClassRecord.findByTeacherId(teacherId);

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
 * POST /api/teacher/growth-reports
 * 创建成长报告
 */
router.post('/growth-reports', async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { student_id, course_id, report_date, content, evaluation, score, suggestions } = req.body;

    if (!student_id || !report_date) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数：student_id、report_date'
      });
    }

    // 如果指定了课程，校验课程是否属于当前教师
    if (course_id) {
      const course = await Course.findById(course_id);
      if (!course || course.teacher_id !== parseInt(teacherId, 10)) {
        return res.status(403).json({
          code: 403,
          message: '无权为该课程创建报告'
        });
      }
    }

    const report = await GrowthReport.create({
      student_id,
      teacher_id: teacherId,
      course_id: course_id || null,
      report_date,
      content: content || '',
      evaluation: evaluation || '',
      score: score || null,
      suggestions: suggestions || ''
    });

    res.json({
      code: 0,
      message: 'success',
      data: report
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/teacher/growth-reports
 * 获取当前教师创建的所有成长报告
 */
router.get('/growth-reports', async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const reports = await GrowthReport.findByTeacherId(teacherId);

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
 * GET /api/teacher/courses
 * 获取当前教师负责的课程列表
 */
router.get('/courses', async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const courses = await Course.findByTeacherId(teacherId);

    res.json({
      code: 0,
      message: 'success',
      data: courses
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
