-- ============================================================
-- WeChat Miniprogram Education Management System
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS `pilgrimage_edu`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `pilgrimage_edu`;

-- ============================================================
-- 1. users - 用户表
-- ============================================================
CREATE TABLE `users` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid`     VARCHAR(128)    NOT NULL                COMMENT '微信openid',
  `role`       ENUM('parent','teacher','admin') NOT NULL DEFAULT 'parent' COMMENT '角色：家长/教师/管理员',
  `nickname`   VARCHAR(64)     DEFAULT NULL             COMMENT '昵称',
  `avatar_url` VARCHAR(512)    DEFAULT NULL             COMMENT '头像URL',
  `phone`      VARCHAR(20)     DEFAULT NULL             COMMENT '手机号',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  INDEX `idx_role` (`role`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 2. students - 学生表
-- ============================================================
CREATE TABLE `students` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '学生ID',
  `name`       VARCHAR(64)     NOT NULL                COMMENT '学生姓名',
  `parent_id`  BIGINT UNSIGNED NOT NULL                COMMENT '家长用户ID',
  `age`        TINYINT UNSIGNED DEFAULT NULL            COMMENT '年龄',
  `gender`     TINYINT UNSIGNED DEFAULT NULL            COMMENT '性别：0-未知 1-男 2-女',
  `grade`      VARCHAR(32)     DEFAULT NULL             COMMENT '年级',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_name` (`name`),
  CONSTRAINT `fk_students_parent` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生表';

-- ============================================================
-- 3. teachers - 教师表
-- ============================================================
CREATE TABLE `teachers` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '教师ID',
  `user_id`    BIGINT UNSIGNED NOT NULL                COMMENT '关联用户ID',
  `name`       VARCHAR(64)     NOT NULL                COMMENT '教师姓名',
  `subject`    VARCHAR(64)     DEFAULT NULL             COMMENT '教授科目',
  `bio`        VARCHAR(512)    DEFAULT NULL             COMMENT '教师简介',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  INDEX `idx_subject` (`subject`),
  CONSTRAINT `fk_teachers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师表';

-- ============================================================
-- 4. courses - 课程表
-- ============================================================
CREATE TABLE `courses` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '课程ID',
  `name`        VARCHAR(128)    NOT NULL                COMMENT '课程名称',
  `teacher_id`  BIGINT UNSIGNED NOT NULL                COMMENT '授课教师ID',
  `description` VARCHAR(1024)   DEFAULT NULL             COMMENT '课程描述',
  `total_hours` INT UNSIGNED    NOT NULL DEFAULT 0       COMMENT '总课时数',
  `price`       DECIMAL(10,2)   NOT NULL DEFAULT 0.00    COMMENT '课程价格',
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active' COMMENT '状态：启用/停用',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_teacher_id` (`teacher_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_name` (`name`),
  CONSTRAINT `fk_courses_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- ============================================================
-- 5. enrollments - 报名/选课表
-- ============================================================
CREATE TABLE `enrollments` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '报名记录ID',
  `student_id`      BIGINT UNSIGNED NOT NULL                COMMENT '学生ID',
  `course_id`       BIGINT UNSIGNED NOT NULL                COMMENT '课程ID',
  `remaining_hours` DECIMAL(10,2)   NOT NULL DEFAULT 0.00   COMMENT '剩余课时',
  `status`          ENUM('active','completed','suspended') NOT NULL DEFAULT 'active' COMMENT '状态：进行中/已完成/已暂停',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_course` (`student_id`, `course_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_enrollments_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_enrollments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报名/选课表';

-- ============================================================
-- 6. class_records - 上课消课记录表
-- ============================================================
CREATE TABLE `class_records` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消课记录ID',
  `enrollment_id`  BIGINT UNSIGNED NOT NULL                COMMENT '报名记录ID',
  `teacher_id`     BIGINT UNSIGNED NOT NULL                COMMENT '授课教师ID',
  `hours_consumed` DECIMAL(10,2)   NOT NULL DEFAULT 0.00   COMMENT '消耗课时数',
  `class_date`     DATE            NOT NULL                COMMENT '上课日期',
  `notes`          VARCHAR(512)    DEFAULT NULL             COMMENT '上课备注',
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_enrollment_id` (`enrollment_id`),
  INDEX `idx_teacher_id` (`teacher_id`),
  INDEX `idx_class_date` (`class_date`),
  CONSTRAINT `fk_class_records_enrollment` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_class_records_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='上课消课记录表';

-- ============================================================
-- 7. growth_reports - 成长报告表
-- ============================================================
CREATE TABLE `growth_reports` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '报告ID',
  `student_id` BIGINT UNSIGNED NOT NULL                COMMENT '学生ID',
  `teacher_id` BIGINT UNSIGNED NOT NULL                COMMENT '教师ID',
  `course_id`  BIGINT UNSIGNED NOT NULL                COMMENT '课程ID',
  `title`      VARCHAR(256)    NOT NULL                COMMENT '报告标题',
  `content`    TEXT            NOT NULL                COMMENT '报告内容',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_teacher_id` (`teacher_id`),
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_growth_reports_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_growth_reports_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_growth_reports_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成长报告表';

-- ============================================================
-- 8. orders - 支付订单表
-- ============================================================
CREATE TABLE `orders` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `user_id`        BIGINT UNSIGNED NOT NULL                COMMENT '下单用户ID',
  `course_id`      BIGINT UNSIGNED NOT NULL                COMMENT '课程ID',
  `student_id`     BIGINT UNSIGNED NOT NULL                COMMENT '学生ID',
  `amount`         DECIMAL(10,2)   NOT NULL DEFAULT 0.00   COMMENT '订单金额',
  `payment_status` ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending' COMMENT '支付状态：待支付/已支付/已退款',
  `transaction_id` VARCHAR(128)    DEFAULT NULL             COMMENT '第三方交易流水号',
  `payment_method` VARCHAR(32)     DEFAULT NULL             COMMENT '支付方式',
  `paid_at`        DATETIME        DEFAULT NULL             COMMENT '支付时间',
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_transaction_id` (`transaction_id`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付订单表';

-- ============================================================
-- 9. coupons - 优惠券表
-- ============================================================
CREATE TABLE `coupons` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '优惠券ID',
  `code`        VARCHAR(64)     NOT NULL                COMMENT '优惠券码',
  `name`        VARCHAR(128)    NOT NULL                COMMENT '优惠券名称',
  `type`        ENUM('fixed','percentage') NOT NULL     COMMENT '类型：固定金额/百分比',
  `value`       DECIMAL(10,2)   NOT NULL DEFAULT 0.00   COMMENT '优惠值（金额或百分比）',
  `min_amount`  DECIMAL(10,2)   NOT NULL DEFAULT 0.00   COMMENT '最低使用金额',
  `start_date`  DATETIME        NOT NULL                COMMENT '生效开始时间',
  `end_date`    DATETIME        NOT NULL                COMMENT '生效结束时间',
  `usage_limit` INT UNSIGNED    NOT NULL DEFAULT 0       COMMENT '使用次数上限（0表示不限）',
  `used_count`  INT UNSIGNED    NOT NULL DEFAULT 0       COMMENT '已使用次数',
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active' COMMENT '状态：启用/停用',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  INDEX `idx_status` (`status`),
  INDEX `idx_date_range` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠券表';

-- ============================================================
-- 10. coupon_usage - 优惠券使用记录表
-- ============================================================
CREATE TABLE `coupon_usage` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '使用记录ID',
  `coupon_id`  BIGINT UNSIGNED NOT NULL                COMMENT '优惠券ID',
  `user_id`    BIGINT UNSIGNED NOT NULL                COMMENT '使用用户ID',
  `order_id`   BIGINT UNSIGNED NOT NULL                COMMENT '关联订单ID',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '使用时间',
  PRIMARY KEY (`id`),
  INDEX `idx_coupon_id` (`coupon_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_order_id` (`order_id`),
  UNIQUE KEY `uk_coupon_order` (`coupon_id`, `order_id`),
  CONSTRAINT `fk_coupon_usage_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_coupon_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_coupon_usage_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠券使用记录表';
