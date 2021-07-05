const {
  formatTime
} = require('../../getDate.js');
var getDate = require('../../getDate.js');
Page({
  data: {
    allEvents: [],
    selectedDateEvents: [],
    closeBy: [],
    recent: [],
    points: [],
    markers: [],
    swiper_image: [],
    userOpenId: wx.getStorageSync('openid'),
    userStatus: wx.getStorageSync('userStatus'),
    userPlayerInfo: {},
    participatedEvents: []
  },
  onLoad: function (options) {
    wx.showLoading({title: "加载中"});
    this.getEvents();
    this.getEventSwiper();
    this.processParticipatedEvents(wx.getStorageSync('gotNextID'));
  },
  onShow(){
    this.processParticipatedEvents(wx.getStorageSync('gotNextID'));
  },

  //LOAD DATA FUNCTIONS START
  //处理活动数据
  getEvents() {
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
    //处理附近活动列表
    allCloseby.forEach(v => {
      if (v.category.includes("活动")) {
        closebyEvents.push(v)
      }
    })
    //处理最近活动列表
    allRecent.forEach(v => {
      if (v.category.includes("活动")) {
        recentEvents.push(v)
      }
    })
    //处理地图地标数据
    var counter = 0;
    closebyEvents.forEach(v => {
      final_markers.push({
        id: counter,
        latitude: v.location_specific.latitude,
        longitude: v.location_specific.longitude,
        name: v.location_specific.name,
        iconPath: v.img,
        width: 35,
        height: 35
      })
      final_points.push({
        longitude: v.location_specific.longitude,
        latitude: v.location_specific.latitude,
        name: v.location_specific.name,
      })
      counter++;
    })
    //在地标数据里加入用户位置
    final_markers.push({
      id: counter,
      latitude: user_location.latitude,
      longitude: user_location.longitude,
      iconPath: "cloud://gotnext-7gc174phedbcfbb9.676f-gotnext-7gc174phedbcfbb9-1306413881/fuck.png",
      width: 35,
      height: 35
    })
    final_points.push({
      longitude: user_location.longitude,
      latitude: user_location.latitude
    })

    //将所有活动列表按开始时间升序排列
    recentEvents.sort(function (a, b) {
      var value1 = Date.parse(a.start_time);
      var value2 = Date.parse(b.start_time);
      return value1 - value2;
    });

    closebyEvents.sort(function (a, b) {
      var value1 = Date.parse(a.start_time);
      var value2 = Date.parse(b.start_time);
      return value1 - value2;
    });

    //初始化当日日程表
    allEvents.forEach(v => {
      if (v.written_time == today) {
        selectedDate.push(v);
      }
    })
    this.setData({
      closeBy: closebyEvents,
      recent: recentEvents,
      allEvents: allEvents,
      points: final_points,
      markers: final_markers,
      selectedDateEvents: selectedDate
    })
    //处理地图信息
    this.processMap(final_points);
  },
  //获取活动页轮播图
  getEventSwiper() {
    wx.cloud.database().collection("event_swiper").get()
      .then(res => {
        this.setData({
          swiper_image: res.data
        })
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
  },
  //LOAD DATA FUNCTIONS END



  //PROCESS DATA FUNCTIONS START

  //处理篮球地图的标记信息
  processMap(point_list) {
    var map = wx.createMapContext('123', this);
    map.includePoints({
      points: point_list,
      success(res) {},
      fail(err) {}
    })
  },
  //处理用户参加的活动
  processParticipatedEvents(id) {
    let db = wx.cloud.database()
    const _ = db.command
    wx.cloud.database().collection("event").where({
        participant_list: id,
        //活动结束时间必须大于现在
        end_time: _.gte(new Date())
      }).get()
      .then(res => {
        //处理活动时间
        this.processEventTime(res.data);
        wx.hideLoading()
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
  },
  //处理活动时间
  processEventTime(data) {
    var loaded_events = data;
    loaded_events.forEach(v => {
      v.written_time = getDate.formatTime(new Date(v.start_time));
      v.specific_time = getDate.formatSpecific(new Date(v.start_time));
      v.specific_endtime = getDate.formatSpecific(new Date(v.end_time));
    })
    this.setData({
      participatedEvents: loaded_events
    })
  },

  //PROCESS DATA FUNCTIONS END



  //BUTTON FUNCTIONS START

  //跳转到活动详情页
  eventNavigator(e) {
    wx.navigateTo({
      url: "/pages/event_detail/index?id=" + e.currentTarget.dataset.id
    })
  },

  //选择活动时间表的日期时触发
  onConfirm(e) {
    var selectedDate = [];
    //循环所有活动，如果活动时间等于选中日期则加入选中日期活动列表
    this.data.allEvents.forEach(v => {
      if (v.written_time == getDate.formatTime(e.detail)) {
        selectedDate.push(v);
      }
    })
    this.setData({
      selectedDateEvents: selectedDate
    })
  },

  //跳转到个人活动列表
  personalNavigator(e) {
    wx.navigateTo({
      url: "/pages/item_list/index?function=getPersonalEvents&league=none"
    })
  },

  //跳转到团队活动列表
  teamNavigator(e) {
    wx.navigateTo({
      url: "/pages/item_list/index?function=getTeamEvents&league=none"
    })
  },

  //跳转到挑战活动列表
  challengeNavigator(e) {
    wx.navigateTo({
      url: "/pages/item_list/index?function=getChallengeEvents&league=none"
    })
  },

  //跳转到社交活动列表
  socialNavigator(e) {
    wx.navigateTo({
      url: "/pages/item_list/index?function=getSocialEvents&league=none"
    })
  },

  //跳转到所有附近活动列表
  closeByNavigator(e) {
    wx.navigateTo({
      url: "/pages/item_list/index?function=getNearbyEvents&league=none"
    })
  },

  //跳转到轮播图对应的活动详情页
  swiperNavigator(e){
    var eventid = e.currentTarget.dataset.eventid;
    wx.navigateTo({
      url: "/pages/event_detail/index?id=" + eventid
    })
  },
  confirmationNavigator(e){
    wx.navigateTo({
      url: "/pages/paymentConfirmation/index?name=" + e.currentTarget.dataset.name + "&price=" + e.currentTarget.dataset.price + "&location=" + e.currentTarget.dataset.location + "&time=" + e.currentTarget.dataset.time + "&category=" + "event" + "&playerID=" + this.data.gotNextID + "&eventID=" + e.currentTarget.dataset.eventid + "&participant_list=" + e.currentTarget.dataset.participant_list
    })
  },
  checkInNavigator(e){
    wx.navigateTo({
      url:"/pages/checkIn/index"
    })
  },

  gotohere:function(res){
    let lat = ''; // 获取点击的markers经纬度
    let lon = ''; // 获取点击的markers经纬度
    let name = '';
    let markerId = res.detail.markerId;// 获取点击的markers  id
    let markers = this.data.markers;// 获取markers列表
 
    for (let item of markers){
      if (item.id === markerId) {
        lat = item.latitude;
        lon = item.longitude;
        name = item.name;
        wx.openLocation({ // 打开微信内置地图，实现导航功能（在内置地图里面打开地图软件）
          latitude: lat,
          longitude: lon,
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
  //BUTTON FUNCTIONS END,

  onPullDownRefresh: function () {
    wx.showNavigationBarLoading() //启用标题栏显示加载状态
    this.getEvents();
    this.getEventSwiper();
    this.processParticipatedEvents(wx.getStorageSync('gotNextID'));
    setTimeout(() => {
      wx.hideNavigationBarLoading() //隐藏标题栏显示加载状态
      wx.stopPullDownRefresh() //结束刷新
    }, 1000); //设置执行时间
  }
})