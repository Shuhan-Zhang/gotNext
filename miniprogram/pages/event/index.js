const { formatTime } = require('../../getDate.js');
var getDate = require('../../getDate.js');
Page({
  data: {
    allEvents:[],
    selectedDateEvents:[],
    closeBy:[],
    recent:[],
    points:[],
    markers:[],
    swiper_image:[]
  },
  onLoad: function (options) {
    this.getEvents();
    this.getEventSwiper();
  },

  //LOAD DATA FUNCTIONS START
  getEvents(){
    var today = wx.getStorageSync('today');
    var closebyEvents = [];
    var recentEvents = [];
    var final_markers = [];
    var final_points = [];
    var allEvents = wx.getStorageSync('allEvents')
    var allCloseby = wx.getStorageSync('close_by');
    var allRecent = wx.getStorageSync('recent')
    var user_location = wx.getStorageSync('user_location');
    var selectedDate = [];

    allCloseby.forEach(v=>{
      if(v.category.includes("活动")){
        closebyEvents.push(v)
      }
    })
    allRecent.forEach(v=>{
      if(v.category.includes("活动")){
        recentEvents.push(v)
      }
    })

    var counter = 0;
    closebyEvents.forEach(v=>{
      final_markers.push(
        {
          id:counter,
          latitude:v.location_specific.latitude,
          longitude:v.location_specific.longitude,
          iconPath:v.img,
          width:35,
          height:35
        }
      )
      final_points.push(
        {
          longitude:v.location_specific.longitude,
          latitude:v.location_specific.latitude
        }
      )
      counter++;
    })

    final_markers.push({
      id:counter,
      latitude:user_location.latitude,
      longitude:user_location.longitude,
      iconPath:"../../img/index/定位.png",
      width:35,
      height:35
    })
    final_points.push({
        longitude:user_location.longitude,
        latitude:user_location.latitude
      })
      recentEvents.sort(function(a, b) {
      var value1 = Date.parse(a.time);
      var value2 = Date.parse(b.time);
      return value1 - value2;
    });

    closebyEvents.sort(function(a, b) {
      var value1 = Date.parse(a.time);
      var value2 = Date.parse(b.time);
      return value1 - value2;
    });

    allEvents.forEach(v=>{
      if(v.written_time == today){
        selectedDate.push(v);
      }
    })
    this.setData({
      closeBy:closebyEvents,
      recent:recentEvents,
      allEvents:allEvents,
      points: final_points,
      markers: final_markers,
      selectedDateEvents:selectedDate
    })
    this.processMap(final_points);
  },
  getEventSwiper(){
    wx.cloud.database().collection("event_swiper").get()
    .then(res => {
      this.setData({
        swiper_image:res.data
      })
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  //LOAD DATA FUNCTIONS END



  //PROCESS DATA FUNCTIONS START
  processMap(point_list){
    //处理篮球地图的标记信息
    var map = wx.createMapContext('123456', this);
    map.includePoints(
      {
        points:point_list,
        success(res){
        },
        fail(err){
        }
      }
    )
  },

  //PROCESS DATA FUNCTIONS END



  //BUTTON FUNCTIONS START
  eventNavigator(e){
    wx.navigateTo({
      url:"/pages/event_detail/index?id=" + e.currentTarget.dataset.id
    })
  },

  onConfirm(e){
    var selectedDate = [];
    this.data.allEvents.forEach(v=>{
      if(v.written_time == getDate.formatTime(e.detail)){
        selectedDate.push(v);
      }
    })
    this.setData({
      selectedDateEvents:selectedDate
    })
  }
  //BUTTON FUNCTIONS END
})