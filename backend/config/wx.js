// 微信小程序配置
const wxConfig = {
  // 小程序 AppID
  appid: process.env.WX_APPID || '',
  // 小程序 AppSecret
  secret: process.env.WX_SECRET || '',
  // 微信支付商户号
  mchId: process.env.WX_MCH_ID || '',
  // 微信支付 API 密钥
  apiKey: process.env.WX_API_KEY || '',
  // 微信登录接口地址
  loginUrl: 'https://api.weixin.qq.com/sns/jscode2session',
  // 微信统一下单接口地址
  unifiedOrderUrl: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
  // 微信支付回调通知地址（部署时需要替换为实际域名）
  notifyUrl: process.env.WX_NOTIFY_URL || 'https://your-domain.com/api/payment/wx-notify'
};

module.exports = wxConfig;
