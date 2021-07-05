var QR = require('../../weapp-qrcode.js');;
Page({

  data: {
    QRCode:""
  },


  onLoad: function(options){
    var imgData = QR.createQrCodeImg(wx.getStorageSync('gotNextID'));
    this.setData({
      QRCode:imgData
    })
  },
})