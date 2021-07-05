var getDate = require('../../getDate.js');
Page({

  data: {
    eventID:"",
    event: {},
    marker: [],
    points: [],
    playerID: wx.getStorageSync('openid'),
    past:false,
    participated: false
  },
  onLoad: function (options) {
    wx.showLoading({title: "加载中"});
    var id = options.id;
    this.getEvent(id);
    this.setData({
      playerID: wx.getStorageSync('openid'),
      eventID: id
    })
  },

  //LOAD DATA FUNCTIONS

  //获得活动数据
  getEvent(eventID) {
    wx.cloud.database().collection("event").doc(eventID).get()
      .then(res => {
        console.log("data pulled successfully", res);

        //处理活动时间
        this.setTime(res.data);

        //处理活动地图信息
        this.setLocation(res.data);

        //检查用户是否参与了活动
        this.checkAttended(res.data);

        if(res.data.first_place){
          this.getFirstPlace(res.data.first_place);
        }
        if(res.data.second_place){
          this.getSecondPlace(res.data.second_place);
        }
        if(res.data.third_place){
          this.getThirdPlace(res.data.third_place);
        }

        this.setData({
          event: res.data
        })
        wx.hideLoading();
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
  },

  getFirstPlace(id){
    wx.cloud.database().collection("players").doc(id).get()
      .then(res => {
        this.setData({
          firstPlaceData:res.data
        })
      }).catch(err=>{
        console.log(err);
      })
  },
  getSecondPlace(id){
    wx.cloud.database().collection("players").doc(id).get()
      .then(res => {
        this.setData({
          secondPlaceData:res.data
        })
      }).catch(err=>{
        console.log(err);
      })
  },
  getThirdPlace(id){
    wx.cloud.database().collection("players").doc(id).get()
      .then(res => {
        this.setData({
          thirdPlaceData:res.data
        })
      }).catch(err=>{
        console.log(err);
      })
  },


  //PROCESS DATA FUNCTIONS

  //检查用户是否已经参加该活动
  checkAttended(eventData){
    if(eventData.participant_list.includes(wx.getStorageSync('gotNextID'))){
      this.setData({
        participated: true
      })
    }else{
      this.setData({
        participated: false
      })
    }
  },

  //处理地图信息
  setLocation(event) {
    var user_location = wx.getStorageSync('user_location');
    var user_latitude = user_location.latitude;
    var user_longitude = user_location.longitude;
    var final_markers = [];
    var final_points = [];
    final_markers.push({
      id: 0,
      latitude: user_latitude,
      longitude: user_longitude,
      iconPath: "cloud://gotnext-7gc174phedbcfbb9.676f-gotnext-7gc174phedbcfbb9-1306413881/fuck.png",
      width: 35,
      height: 35
    }, {
      id: 1,
      latitude: event.location_specific.latitude,
      longitude: event.location_specific.longitude,
      name: event.location_specific.name,
      iconPath: event.img,
      width: 35,
      height: 35
    })
    final_points.push({
      longitude: user_longitude,
      latitude: user_latitude
    }, {
      longitude: event.location_specific.longitude,
      latitude: event.location_specific.latitude
    })
    this.setMap(final_points);
    this.setData({
      points: final_points,
      marker: final_markers
    })
  },
  //设置地图
  setMap(point_list) {
    var map = wx.createMapContext('1234', this);
    map.includePoints({
      points: point_list,
      success(res) {
      },
      fail(err) {
        console.log("failed to set map",err);
      }
    })
  },

  //处理时间信息
  setTime(data) {
    var loaded_events = data;
    loaded_events.written_time = getDate.formatTime(new Date(loaded_events.start_time));
    loaded_events.specific_time = getDate.formatSpecific(new Date(loaded_events.start_time));
    loaded_events.specific_endtime = getDate.formatSpecific(new Date(loaded_events.end_time));
    if((new Date(loaded_events.end_time)) > (new Date())){
      this.setData({
        past:false
      })
    }else{
      this.setData({
        past:true
      })
    }
    this.setData({
      event: loaded_events
    })
  },

  //BUTTON FUNCTIONS
  
  //跳转到付款详情页面
  eventPayment(e){
    wx.navigateTo({
      url: "/pages/paymentConfirmation/index?name=" + e.currentTarget.dataset.name + "&price=" + e.currentTarget.dataset.price + "&location=" + e.currentTarget.dataset.location + "&time=" + e.currentTarget.dataset.time + "&category=" + "event" + "&playerID=" + this.data.playerID + "&eventID=" + this.data.eventID + "&participant_list=" + this.data.event.participant_list
    })
  },

  gotohere:function(res){
    let lat = ''; // 获取点击的markers经纬度
    let lon = ''; // 获取点击的markers经纬度
    let name = '';
    let markerId = res.detail.markerId;// 获取点击的markers  id
    let markers = this.data.marker;// 获取markers列表
 
    for (let item of markers){
      if (item.id === markerId) {
        lat = item.latitude;
        lon = item.longitude;
        name = item.name;
        console.log(lat,lon,name);
        wx.openLocation({ // 打开微信内置地图，实现导航功能（在内置地图里面打开地图软件）
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          name: name,
          success:function(res){
            console.log(res);
          },
          fail:function(res){
            console.log(res);
          }
        })
        break;
      }else{
        console.log("error");
      }
    }
  },

  //跳转到登记页面
  checkIn(e){
    wx.navigateTo({
      url:"/pages/checkIn/index"
    })
  },
  playerNavigator(e) {
    wx.navigateTo({
      url: "/pages/player_card/index?openid=" + e.currentTarget.dataset.id
    })
  },
})