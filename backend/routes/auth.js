const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const wxConfig = require('../config/wx');
const User = require('../models/user');

/**
 * POST /api/auth/login
 * 微信小程序登录
 * 接收前端传来的 code，调用微信接口获取 openid，查找或创建用户，返回 JWT
 */
router.post('/login', async (req, res, next) => {
  try {
    const { code, nickname, avatar_url } = req.body;

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: '缺少登录凭证 code'
      });
    }

    // 调用微信 jscode2session 接口，用 code 换取 openid 和 session_key
    const wxRes = await axios.get(wxConfig.loginUrl, {
      params: {
        appid: wxConfig.appid,
        secret: wxConfig.secret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, session_key, errcode, errmsg } = wxRes.data;

    // 微信接口返回错误
    if (errcode) {
      return res.status(400).json({
        code: errcode,
        message: `微信登录失败: ${errmsg}`
      });
    }

    if (!openid) {
      return res.status(400).json({
        code: 400,
        message: '获取用户 openid 失败'
      });
    }

    // 根据 openid 查找用户
    let user = await User.findByOpenid(openid);

    if (!user) {
      // 新用户，自动注册（默认角色为家长）
      user = await User.create({
        openid,
        nickname: nickname || '',
        avatar_url: avatar_url || '',
        role: 'parent'
      });
    } else {
      // 已有用户，更新昵称和头像（如果传入了新值）
      if (nickname || avatar_url) {
        const updateData = {};
        if (nickname) updateData.nickname = nickname;
        if (avatar_url) updateData.avatar_url = avatar_url;
        await User.updateById(user.id, updateData);
        Object.assign(user, updateData);
      }
    }

    // 生成 JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        openid: user.openid,
        role: user.role,
        nickname: user.nickname
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 0,
      message: 'success',
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          role: user.role,
          phone: user.phone
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
