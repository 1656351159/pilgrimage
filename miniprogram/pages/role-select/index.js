// 角色选择页逻辑
Page({
  data: {},

  // 点击卡片
  onSelectRole(e) {
    const role = e.currentTarget.dataset.role; // parent / teacher / admin

    // 内存+本地双存储，刷新仍保留
    getApp().globalData.role = role;
    wx.setStorageSync('role', role);

    // 根据角色跳对应首页
    const pages = {
      parent: '/pages/parent/index/index',
      teacher: '/pages/teacher/index/index',
      admin: '/pages/admin/index/index'
    };
    if (role === 'parent') {
      wx.switchTab({ url: pages[role] });
    } else {
      wx.reLaunch({ url: pages[role] });
    }
  }
});