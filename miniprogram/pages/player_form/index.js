Page({
  data: {
    heightRange:[],
    ageRange:[],
    weightRange:[],
    heightIndex:0,
    ageIndex:0,
    weightIndex:0,
    allPositions:["PG","SG","SF","PF","C"],
    finalID:"",
    tempImage:"../../img/player_form/profilePic.png",
    finalName:"",
    selectedPosition:"PG",
    finalHeight:150,
    finalAge:10,
    finalWeight:40,
  },

  onLoad: function (options) {
    this.getHeightRange();
    this.getAgeRange();
    this.getWeightRange();
    this.setData({
      finalID: options.openid
    })
  },
  getProfileImage(e){
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    }).then(res=>{
      console.log(res.tempFilePaths[0]);
      this.setData({
        tempImage:res.tempFilePaths[0]
      });
      wx.showToast({
        title: '成功选择图片'
      })
    }).catch(err=>{
      console.log("error when uploading image",err);
    })
  },
  getName(e){
    var name = e.detail.value;
    this.setData({
      finalName:name
    })
  },
  getHeightRange(){
    var finalRange = []
    var i;
    for (i = 150; i < 221; i++) {
      finalRange.push(i);
    }
    this.setData({
      heightRange: finalRange
    })
  },
  changeHeight(e){
    var height = parseInt(e.detail.value) + 150
    this.setData({
      heightIndex: e.detail.value,
      finalHeight: height
    })
  },
  getPosition(e){
    this.setData({
      selectedPosition:e.currentTarget.dataset.position
    })
  },
  getAgeRange(){
    var finalRange = []
    var i;
    for (i = 10; i < 80; i++) {
      finalRange.push(i);
    }
    this.setData({
      ageRange: finalRange
    })
  },
  changeAge(e){
    var age = parseInt(e.detail.value) + 10
    this.setData({
      ageIndex: e.detail.value,
      finalAge:age
    })
  },
  getWeightRange(){
    var finalRange = []
    var i;
    for (i = 40; i < 201; i++) {
      finalRange.push(i);
    }
    this.setData({
      weightRange: finalRange
    })
  },
  changeWeight(e){
    var weight = parseInt(e.detail.value) + 40
    this.setData({
      weightIndex: e.detail.value,
      finalWeight:weight
    })
  },
  uploadInformation(e){
    var finalPath = "";
    var finalAge = this.data.finalAge;
    var finalWeight = this.data.finalWeight;
    var finalName = this.data.finalName;
    var finalHeight = this.data.finalHeight;
    var finalPosition = this.data.selectedPosition;
    var finalID = this.data.finalID;
    var tempPath = this.data.tempImage;
    var cloudpath = finalName + "ProfileImage.jpg"
    console.log(finalName);
    if(finalName == ""){
      wx.showToast({
        title: '名称不能为空',
        icon:'error'
      })
    }else{
      wx.showModal({
        title: '确认注册球员?',
        content: '请确认您的球员信息',
      }).then(res=>{
        if (res.confirm) {
          wx.cloud.uploadFile({
              cloudPath: cloudpath,
              filePath: tempPath
            }).then(res=>{
              finalPath = res.fileID
              wx.cloud.callFunction({
                name:"uploadPlayerInfo",
                data:{
                  finalWeight:finalWeight,
                  finalID: finalID,
                  finalHeight: finalHeight,
                  finalName: finalName,
                  finalProfileImage: finalPath,
                  finalPosition: finalPosition,
                  finalAge: finalAge
                }
              }).then(res=>{
                wx.showToast({
                  title: '成功注册球员',
                  icon:'success',
                  duration: 1500,
                }).then(res=>{
                  const that=this
                  setTimeout(function () {
                    wx.redirectTo({
                      url:"/pages/player_card/index?openid=" + that.data.finalID
                    })
                  }, 1500)
  
                })
                console.log("successfully created a player",res);
              }).catch(err=>{
                wx.showToast({
                  title: '注册球员失败',
                  icon:'error'
                })
                console.log("error creating player",err)
              })
            }).catch(err=>{
              wx.showToast({
                title: '无法上传图片',
                icon:'error'
              })
              console.log("error uploading image", err)
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }).catch(err=>{
        console.log("用户上传信息出错",err)
      })
    }
  }
})