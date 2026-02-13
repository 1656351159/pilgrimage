// 一键把当前账号改为管理员
// 用法：node upgrade-to-admin.js
// 会自动读取 .env 里的数据库配置，无需手动输入密码

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pilgrimage_edu'
  });

  try {
    // 1. 查看最近一条用户（即你自己）
    const [users] = await connection.execute(
      'SELECT id, nickname, role, openid FROM users ORDER BY id DESC LIMIT 1'
    );

    if (users.length === 0) {
      console.log('⚠️  数据库里还没有任何用户，请先登录一次小程序生成账号，再运行本脚本。');
      process.exit(0);
    }

    const user = users[0];
    console.log('当前最新用户：');
    console.log('  id      :', user.id);
    console.log('  nickname:', user.nickname);
    console.log('  role    :', user.role);
    console.log('  openid  :', user.openid);

    if (user.role === 'admin') {
      console.log('✅ 该用户已经是管理员，无需再次升级。');
      process.exit(0);
    }

    // 2. 升级为 admin
    await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      ['admin', user.id]
    );

    console.log('🎉 角色已升级为 admin！');
    console.log('下一步：');
    console.log('  1. 回到微信开发者工具');
    console.log('  2. 点“编译”或直接重新进入小程序');
    console.log('  3. 再次登录，即可进入管理员端');

  } catch (err) {
    console.error('❌ 数据库操作失败:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();