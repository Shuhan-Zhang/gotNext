Page({
  data: {
    content:""
  },
  onLoad: function (options) {

  },
  //如果用户改变信息的话则改变信息框内容
  contentChange(e){
    this.setData({
      content: e.detail.value
    })
  },
  //提交用户信息
  submit(e){
    if(this.data.content == ""){
      wx.showToast({
        title: '内容不能为空',
        icon: 'error'
      })
    }else{
      wx.cloud.callFunction({
        name: "uploadBugReport",
        data: {
          content: this.data.content
        }
      }).then(res => {
        wx.showToast({
          title: '谢谢您的反馈',
          icon: 'success',
          duration: 1500,
        }).then(res => {
          setTimeout(function () {
            wx.navigateBack({
              delta: 1,
            })
          }, 1000)
  
        })
        console.log("successfully uploaded bug report", res);
      }).catch(err => {
        wx.showToast({
          title: '提交失败',
          icon: 'error'
        })
        console.log("error creating a bug report", err)
      })
    }
  }
})