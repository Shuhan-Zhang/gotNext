// pages/paymentConfirmation/index.js
Page({
  data: {
    category:"",
    price:0,
    time:"",
    name:"",
    location:"",
    playerID:"",
    eventID:"",
    participants:[],
    participated:false,
    userStatus:0
  },
  onLoad: function (options) {
    wx.showLoading({title: "加载中"});
    this.setData({
      category: options.category,
      price: options.price,
      time: options.time,
      name: options.name,
      location: options.location,
      playerID: options.playerID,
      eventID: options.eventID,
      gameID: options.gameID,
      participants: options.participant_list,
      userStatus: wx.getStorageSync('userStatus')
    })

    //检查用户是否已经参加过该活动/比赛
    this.checkParticipation(options.participant_list);
  },

  //PROCESS DATA FUNCTIONS

  //检查用户是否已经参加过该活动/比赛
  checkParticipation(participantList){
    if(!this.data.playerID){
      this.setData({
        participated: false
      })
    }else if(participantList.includes(this.data.playerID)){
      this.setData({
        participated: true
      })
    }else{
      this.setData({
        participated: false
      })
    }
    wx.hideLoading({});
  },


  
  //BUTTON FUNCTIONS

  //购买活动
  registerEvent(e){
    if(this.data.userStatus == 0){
      wx.showToast({
        title: '请先去主页登陆',
        icon:'none'
      })
    }else if(this.data.userStatus == 1){
      wx.showToast({
        title: '请先去主页注册',
        icon:'none'
      })
    }else{
      wx.showLoading({title: "加载中"});
      wx.cloud.callFunction({
        name: "registerEvent",
        data: {
          playerID: this.data.playerID,
          eventID: this.data.eventID
        }
      }).then(res => {
        wx.hideLoading({});
        wx.showToast({
          title: '成功预约活动',
          icon: 'success',
          duration: 1500,
        }).then(res => {
          setTimeout(function () {
            wx.switchTab({
              url: "/pages/player/index"
            })
          }, 1000)
          
        })
        console.log("successfully registered event", res);
      }).catch(err=>{
        console.log("registration failed", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
    }
  },

  //购买球票
  registerGame(e){
    if(this.data.userStatus == 0){
      wx.showToast({
        title: '请先去主页登陆',
        icon:'none'
      })
    }else if(this.data.userStatus == 1){
      wx.showToast({
        title: '请先去主页注册',
        icon:'none'
      })
    }else{
      wx.cloud.callFunction({
        name: "registerGame",
        data: {
          playerID: this.data.playerID,
          gameID: this.data.gameID
        }
      }).then(res => {
        wx.showToast({
          title: '成功预约比赛',
          icon: 'success',
          duration: 1500,
        }).then(res => {
          setTimeout(function () {
            wx.switchTab({
              url: "/pages/player/index"
            })
          }, 1000)
          
        })
        console.log("successfully registered game", res);
      }).catch(err=>{
        console.log("registration failed", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      }) 
    }
  },
})