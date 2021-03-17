// pages/event/index.js
Page({
  data: {
    allEvents:[]
  },
  onLoad: function (options) {
    this.getEvents();
  },

  //LOAD DATA FUNCTIONS START
  getEvents(){
    var allEvent = wx.getStorageSync('allEvents');
    this.setData({
      allEvents: allEvent
    })
  },
  //LOAD DATA FUNCTIONS END



  //PROCESS DATA FUNCTIONS START

  //PROCESS DATA FUNCTIONS END



  //BUTTON FUNCTIONS START

  //BUTTON FUNCTIONS END
})