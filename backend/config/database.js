const mysql = require('mysql2/promise');

// 创建 MySQL 连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pilgrimage_edu',
  // 连接池配置
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 启用对 BIGINT 等类型的字符串转换
  supportBigNumbers: true,
  bigNumberStrings: true,
  // 日期类型以字符串形式返回
  dateStrings: true
});

// 测试数据库连接
pool.getConnection()
  .then((connection) => {
    console.log('数据库连接成功');
    connection.release();
  })
  .catch((err) => {
    console.error('数据库连接失败:', err.message);
  });

module.exports = pool;
