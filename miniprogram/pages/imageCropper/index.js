Page({
  data: {
      src:'',
      width:250,//宽度
      height: 250,//高度
  },
  onLoad: function (options) {
      this.cropper = this.selectComponent("#image-cropper");
      //开始裁剪
      this.setData({
          src:options.src,
      });
      wx.showLoading({
          title: '加载中'
      })
  },
  cropperload(e){
      console.log("cropper初始化完成");
  },
  loadimage(e){
      console.log("图片加载完成",e.detail);
      wx.hideLoading();
      //重置图片角度、缩放、位置
      this.cropper.imgReset();
  },
  clickcut(e) {
      console.log(e.detail);
      //点击裁剪框阅览图片
      wx.previewImage({
          current: e.detail.url, // 当前显示图片的http链接
          urls: [e.detail.url] // 需要预览的图片http链接列表
      })
  },
  confirm(e){
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];  //上一个页面
    
    //直接调用上一个页面的setData()方法，把数据存到上一个页面中去

    this.cropper.getImg((obj)=>{
      prevPage.setData({
        tempImage: obj.url
      })
      wx.showToast({
        title: '成功选择图片',
        duration:1000,
        success(){
          setTimeout(() =>{
            wx.navigateBack({
              delta: 1,
            })
          }, 500
          )
        }
      })
    });
  },
  cancel(e){
    wx.navigateBack({
      delta: -1
    })
  }
})