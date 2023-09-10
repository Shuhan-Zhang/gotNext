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
  makeid(length) {
      var result = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * 
        charactersLength));
      } 
    return result;
  },


  
  //BUTTON FUNCTIONS
  createOrder(order, id, type){
    wx.cloud.database().collection('orders').add({
      data:{
        time: new Date(),
        name: this.data.name,
        totalPrice: this.data.price,
        userID: this.data.playerID,
        nonceStr: order.result.nonceStr,
        good_id: id,
        category: type
      }
    }).then(res=>{
      console.log("successfully created order data",res);
    }).catch(err=>{
      console.log("order creation failed",err);
      wx.showToast({
        title: '无法创建订单'
      })
    })
  },


  //购买活动
  registerEvent(e){
    let that = this;
    var finalGoodID = this.data.eventID;
    //检查用户登录状态
    if(this.data.userStatus == 0){
      wx.showToast({
        title: '请先去主页登陆',
        icon:'none'
      })
    }//检查用户注册状态
    else if(this.data.userStatus == 1){
      wx.showToast({
        title: '请先去主页注册',
        icon:'none'
      })
    }else{
      wx.showLoading({title: "加载中"});

      //微信支付
      wx.cloud.callFunction({
        name: 'payment',
        data: {
          outTradeNo: this.makeid(30),
          price: this.data.price
        },
        success: res => {
          const payment = res.result.payment
          that.createOrder(res, finalGoodID, "event");
          wx.requestPayment({
            ...payment,
            success (res) {
              //用户预约
              wx.cloud.callFunction({
                name: "registerEvent",
                data: {
                  playerID: that.data.playerID,
                  eventID: that.data.eventID
                }
              }).then(res => {
                wx.showToast({
                  title: '成功预约活动',
                  icon: 'success',
                  duration: 1500,
                }).then(res => {
                  //跳转到用户主页
                  wx.hideLoading();
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
            },
            fail (err) {
              wx.showToast({
                title: '支付错误',
                icon: 'error'
              });
              console.error('pay fail', err)
            }
          })
        },
        fail(err) {
          wx.showToast({
            title: '支付错误',
            icon: 'error'
          });
          console.error('pay fail', err)
        }
      })
    }
  },
  
  //订球票
  registerGame(e){
    let that = this;
    var finalGoodID = this.data.gameID;
    //检查用户登录状态
    if(this.data.userStatus == 0){
      wx.showToast({
        title: '请先去主页登陆',
        icon:'none'
      })
    }//检查用户注册状态
    else if(this.data.userStatus == 1){
      wx.showToast({
        title: '请先去主页注册',
        icon:'none'
      })
    }else{
      wx.showLoading({title: "加载中"});

      //微信支付
      wx.cloud.callFunction({
        name: 'payment',
        data: {
          outTradeNo: this.makeid(30),
          price: this.data.price
        },
        success: res => {
          const payment = res.result.payment
          that.createOrder(res, finalGoodID, "game");
          wx.requestPayment({
            ...payment,
            success (res) {
              //用户预约
              wx.cloud.callFunction({
                name: "registerGame",
                data: {
                  playerID: that.data.playerID,
                  gameID: that.data.gameID
                }
              }).then(res => {
                wx.showToast({
                  title: '成功预约比赛',
                  icon: 'success',
                  duration: 1500,
                }).then(res => {
                  //跳转到用户主页
                  wx.hideLoading();
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
            },
            fail (err) {
              wx.showToast({
                title: '支付错误',
                icon: 'error'
              });
              console.error('pay fail', err)
            }
          })
        },
        fail(err) {
          wx.showToast({
            title: '支付错误',
            icon: 'error'
          });
          console.error('pay fail', err)
        }
      })
    }
  },

  // //购买球票
  // registerGame(e){
  //   if(this.data.userStatus == 0){
  //     wx.showToast({
  //       title: '请先去主页登陆',
  //       icon:'none'
  //     })
  //   }else if(this.data.userStatus == 1){
  //     wx.showToast({
  //       title: '请先去主页注册',
  //       icon:'none'
  //     })
  //   }else{
  //     wx.cloud.callFunction({
  //       name: "registerGame",
  //       data: {
  //         playerID: this.data.playerID,
  //         gameID: this.data.gameID
  //       }
  //     }).then(res => {
  //       wx.showToast({
  //         title: '成功预约比赛',
  //         icon: 'success',
  //         duration: 1500,
  //       }).then(res => {
  //         setTimeout(function () {
  //           wx.switchTab({
  //             url: "/pages/player/index"
  //           })
  //         }, 1000)
          
  //       })
  //       console.log("successfully registered game", res);
  //     }).catch(err=>{
  //       console.log("registration failed", err);
  //       wx.hideLoading();
  //       wx.showToast({
  //         title: '加载出错',
  //         icon: 'error'
  //       });
  //     }) 
  //   }
  // },
})