var getDate = require('../../getDate.js');
Page({

  data: {
    orders:[],
    userOpenID:""
  },

  onLoad: function (options) {
    this.setData({
      userOpenID: options.openid
    })
    this.getOrders(options.openid);
  },

  getOrders(id){
    wx.cloud.database().collection("orders").where({
      _openid: id
    }).get().then(res=>{
      this.processTime(res.data);
    }).catch(err=>{
      wx.showToast({
        title: '无法获得订单列表',
        icon:'error'
      })
      console.log("can't get orders", err);
    })
  },

  processTime(data) {
    var loaded_orders = data;
    loaded_orders.forEach(v => {
      v.written_time = getDate.formatTime(new Date(v.time));
      v.specific_time = getDate.formatSpecific(new Date(v.time));
    })
    this.setData({
      orders: loaded_orders
    })
  },

  onPullDownRefresh: function () {
    wx.showNavigationBarLoading() //启用标题栏显示加载状态
    this.onLoad();
    setTimeout(() => {
      wx.hideNavigationBarLoading() //隐藏标题栏显示加载状态
      wx.stopPullDownRefresh() //结束刷新
    }, 1000); //设置执行时间
  }
})