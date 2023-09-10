const app = getApp();
Page({
  data: {
    heightRange: [],
    ageRange: [],
    weightRange: [],
    heightIndex: 0,
    ageIndex: 0,
    weightIndex: 0,
    allPositions: ["PG", "SG", "SF", "PF", "C"],
    finalID: wx.getStorageSync('openid'),
    tempImage: "cloud://gotnext-7gc174phedbcfbb9.676f-gotnext-7gc174phedbcfbb9-1306413881/球员照片.png",
    finalName: "",
    selectedPosition: "PG",
    finalHeight: 150,
    finalAge: 10,
    finalWeight: 40,
  },

  onLoad: function (options) {
    this.getHeightRange();
    this.getAgeRange();
    this.getWeightRange();
    this.setData({
      finalID: wx.getStorageSync('openid')
    })
  },

  //LOAD DATA FUNCTIONS

  //获取头像
  getProfileImage(e) {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    }).then(res => {
      //设置暂时图片url为所选图片url
      wx.navigateTo({
        url: "/pages/imageCropper/index?src=" + res.tempFilePaths[0]
      })
    }).catch(err => {
      console.log("error when uploading image", err);
      wx.showToast({
        title: '图片上传出错',
        icon:"none"
      });
    })
  },

  //获取球员名称
  getName(e) {
    var name = e.detail.value;
    this.setData({
      finalName: name
    })
  },

  //获取所有身高数据列表
  getHeightRange() {
    var finalRange = []
    var i;

    //最矮身高150cm，最高身高221cm
    for (i = 150; i < 221; i++) {
      finalRange.push(i);
    }
    this.setData({
      heightRange: finalRange
    })
  },

  //获取用户身高数据
  changeHeight(e) {
    var height = parseInt(e.detail.value) + 150
    this.setData({
      heightIndex: e.detail.value,
      finalHeight: height
    })
  },

  //获取用户场上位置
  getPosition(e) {
    this.setData({
      selectedPosition: e.currentTarget.dataset.position
    })
  },

  //获取所有年龄列表
  getAgeRange() {
    var finalRange = []
    var i;

    //最小10岁，最大80岁
    for (i = 10; i < 80; i++) {
      finalRange.push(i);
    }
    this.setData({
      ageRange: finalRange
    })
  },

  //获取用户年龄
  changeAge(e) {
    var age = parseInt(e.detail.value) + 10
    this.setData({
      ageIndex: e.detail.value,
      finalAge: age
    })
  },

  //获取所有身高列表
  getWeightRange() {
    var finalRange = []
    var i;

    //最轻40公斤，最重201公斤
    for (i = 40; i < 201; i++) {
      finalRange.push(i);
    }
    this.setData({
      weightRange: finalRange
    })
  },

  //获取用户体重
  changeWeight(e) {
    var weight = parseInt(e.detail.value) + 40
    this.setData({
      weightIndex: e.detail.value,
      finalWeight: weight
    })
  },

  //注册用户信息
  uploadInformation(e) {
    var finalPath = "";
    var finalAge = this.data.finalAge;
    var finalWeight = this.data.finalWeight;
    var finalName = this.data.finalName;
    var finalHeight = this.data.finalHeight;
    var finalPosition = this.data.selectedPosition;
    var finalID = this.data.finalID;
    var tempPath = this.data.tempImage;
    var cloudpath = finalName + "ProfileImage.jpg"
    
    //检查名称是否为空
    if (finalName == "") {
      wx.showToast({
        title: '名称不能为空',
        icon: 'none'
      })
    }else if(finalName.length > 5){
      wx.showToast({
        title: '名称不能超过5个字符',
        icon: 'none'
      })
    }else if(tempPath == "cloud://gotnext-7gc174phedbcfbb9.676f-gotnext-7gc174phedbcfbb9-1306413881/球员照片.png"){
      wx.showToast({
        title: '未选择头像照片',
        icon: 'none'
      })
    }else {
      //确认用户是否想注册
      wx.showModal({
        title: '确认注册球员?',
        content: '请确认您的球员信息',
      }).then(res => {
        if (res.confirm) {
          //上传图片
          wx.showLoading({title: "加载中"});
          wx.cloud.uploadFile({
            cloudPath: cloudpath,
            filePath: tempPath
          }).then(res => {
            finalPath = res.fileID
            //提交信息至云函数并注册
            wx.cloud.callFunction({
              name: "uploadPlayerInfo",
              data: {
                finalWeight: finalWeight,
                finalID: finalID,
                finalHeight: finalHeight,
                finalName: finalName,
                finalProfileImage: finalPath,
                finalPosition: finalPosition,
                finalAge: finalAge
              }
            }).then(res => {
              //提醒用户成功
              wx.hideLoading()
              wx.showToast({
                title: '成功注册球员',
                icon: 'success',
                duration: 1500,
              }).then(res => {
                const that = this
                this.getUserStatus();
                //等待1秒后跳转到对应球员卡页面
                setTimeout(function () {
                  wx.redirectTo({
                    url: "/pages/player_card/index?openid=" + that.data.finalID
                  })
                }, 1000)
                console.log("successfully created a player", res);
              })
              
            }).catch(err => {
              //提醒用户注册失败
              wx.hideLoading()
              wx.showToast({
                title: '注册球员失败',
                icon: 'error'
              })
              console.log("error creating player", err)
            })
          }).catch(err => {
            //提醒用户图片上传失败
            wx.hideLoading()
            wx.showToast({
              title: '无法上传图片',
              icon: 'error'
            })
            console.log("error uploading image", err)
          })
        } else if (res.cancel) {
        }
      }).catch(err => {
        wx.hideLoading()
        console.log("用户上传信息出错", err);
        wx.showToast({
          title: '上传出错出错',
          icon: 'error'
        });
      })
    }
  },
  getUserStatus() {
    try {
      var userInfo = wx.getStorageSync('user');
      if(userInfo){
        wx.cloud.database().collection("players").where({
          player_id: userInfo.openid
        }).get()
        .then(res => {
          if (res.data.length == 0) {
            //1，用户登陆了但是没有在gotNext注册
            wx.setStorageSync('userStatus', 1);
          } else if (!res.data[0].team_name) {
            //2，用户登陆并且在gotNext注册了，但是没有参加gotNext联盟
            wx.setStorageSync('userStatus', 2);
          } else {
            //3，用户登陆了，gotNext注册了，并且参加了gotNext联盟(有所属球队和联盟)
            wx.setStorageSync('userStatus', 3);
          }
        }).catch(err => {
          console.log("failed to pull data", err);
          wx.setStorageSync('userStatus', 0);
        })
      }else{
        wx.setStorageSync('userStatus', 0);
      }
    } catch (err) {
      //0,用户没有登陆
      wx.setStorageSync('userStatus', 0);
    }
  }
})