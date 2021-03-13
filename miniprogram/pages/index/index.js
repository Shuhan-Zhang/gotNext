// pages/index/index.js
var getDate = require('../../getDate.js');
Page({
  data:{
    user_location:{},
    today:0,
    swiper_image:[],
    closeby_items:[],
    recent:[],
    news:[],
    events:[],
    games:[],
    mvp:{},
    markers:[],
    points:[],
    past:[],
    MVPTeamImage:"",
    show:true,
    content:"",
    options: [{
      city_id: '001',
      city_name: 'NBA'
    }, {
      city_id: '002',
      city_name: '联盟比赛'
    }, {
      city_id: '003',
      city_name: '最新活动'
    }],
    selected: {}
  },
  onLoad(){
    var time = getDate.formatTime(new Date());
    this.setData({
      today:time
    })

    wx.setStorageSync('today', time);

    wx.getLocation({
    }).then(res=>{
      wx.setStorageSync('user_location', res);
      this.setData({
        user_location: res
      })
    })

    

    this.getEventGames();
    this.getMVP();
    this.getSwiperImage();
    this.getNews();
  },


  // SET UP FUNCTIONS START



  getEventGames(){
    wx.cloud.database().collection("event").orderBy("time",'asc').get()
    .then(res => {
      this.setData({
        events: res.data
      })
      wx.setStorageSync('allEvents', res.data);
    }).catch(err => {
      console.log("failed to pull data",err);
    })


    wx.cloud.database().collection("game").orderBy("time",'asc').get()
    .then(res => {
      this.setData({
        games: res.data
      })
      wx.setStorage({
        data: res.data,
        key: 'allGames',
      })
      this.setToday();
    }).catch(err => {
      console.log("failed to pull data",err);
    })
    
  },
  getSwiperImage(){
    wx.cloud.database().collection("index_swiper").get()
    .then(res => {
      this.setData({
        swiper_image:res.data
      })
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getMVP(){
    wx.cloud.database().collection("MVP").get()
    .then(res => {
      this.setData({
        mvp:res.data[0],
      })
      this.getLeagueInfo(res.data[0].league, res.data[0].team);
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getLeagueInfo(league, team){
    console.log(league, team)
    wx.cloud.database().collection("teams").where({
      league_name:league,
      team_name:team
    }).get()
    .then(res => {
      this.setData({
        MVPTeamImage: res.data[0].logo
      })
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getNews(){
    wx.cloud.database().collection("news").get()
    .then(res => {
      this.setData({
        news:res.data
      })
      wx.setStorageSync('allNews', res.data);
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  setMap(point_list){
    var map = wx.createMapContext('123', this);
    // map.moveToLocation({
    //   longitude:116.29845,
    //   latitude:39.95933
    // }
    // )
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
  setToday(){
    var today = wx.getStorageSync('today');
    var final_closeby = [];
    var final_recent = [];
    var final_past = [];
    var final_markers=[];
    var final_points = [];
    var user_location = wx.getStorageSync('user_location');
    var user_latitude = user_location.latitude;
    var user_longitude = user_location.longitude;
    const all_events = wx.getStorageSync('allEvents');
    const all_games = wx.getStorageSync('allGames');

    all_events.slice(0,3).forEach(v=>{
      if(this.getDistance(user_latitude, user_longitude, v.location_specific.latitude, v.location_specific.longitude) <= 20 && v.written_time == today){
        final_closeby.push(v);
      }else if(Date.parse(v.time) > Date.parse(today)){
        final_recent.push(v);
      }else{
        final_past.push(v);
      }
    })

    all_games.slice(0,3).forEach(v=>{
      if(this.getDistance(user_latitude, user_longitude, v.location_specific.latitude, v.location_specific.longitude) <= 20 && v.written_time == today){
        final_closeby.push(v);
      }else if(Date.parse(v.time) > Date.parse(today)){
        final_recent.push(v);
      }else{
        final_past.push(v);
      }
    }) 
    
    var counter = 0;
    final_closeby.forEach(v=>{
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
    final_points.push(
      {
        longitude:user_location.longitude,
        latitude:user_location.latitude
      }
    )
      
    final_recent.sort(function(a, b) {
      var value1 = Date.parse(a.time);
      var value2 = Date.parse(b.time);
      return value1 - value2;
    });

    final_closeby.sort(function(a, b) {
      var value1 = Date.parse(a.time);
      var value2 = Date.parse(b.time);
      return value1 - value2;
    });

    final_past.sort(function(a, b) {
      var value1 = Date.parse(a.time);
      var value2 = Date.parse(b.time);
      return value1 - value2;
    });


    
    this.setData({
      points: final_points,
      markers: final_markers,
      closeby_items: final_closeby,
      recent: final_recent,
      past:final_past
    })
    this.setMap(final_points);
    wx.setStorage({
      data: final_closeby,
      key: 'close_by',
    })
    wx.setStorage({
      data: final_recent,
      key: 'recent',
    })
  },


  // SET UP FUNCTIONS END

  // EXTERNAL FUNCTIONS START
  Rad: function(d) { //根据经纬度判断距离
      return d * Math.PI / 180.0;
  },
  getDistance: function(lat1, lng1, lat2, lng2) {
    // lat1用户的纬度
    // lng1用户的经度
    // lat2商家的纬度
    // lng2商家的经度
    var radLat1 = this.Rad(lat1);
    var radLat2 = this.Rad(lat2);
    var a = radLat1 - radLat2;
    var b = this.Rad(lng1) - this.Rad(lng2);
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137;
    s = Math.round(s * 10000) / 10000;
    s = s.toFixed(2) //保留两位小数
    return s
},
  change (e) {
    this.setData({
      selected: { ...e.detail }
    })
    var category = e.detail.name;
    var list = wx.getStorageSync('allNews');
    var processedList = [];
    if(category == "全部分类"){
      processedList = list;
    }
    list.forEach(v=>{
      if(v.category == category){
        processedList.push(v);
      }
    })
      this.setData({
        news: processedList
      })
  },
  close () {
    // 关闭select
    this.selectComponent('#select').close()
  },
  // EXTERNAL FUNCTIONS END

  // BUTTON FUNCTIONS START

  eventOnly(e){
    var type = e.currentTarget.dataset.type;
    if(type=="close_by"){
      var list = wx.getStorageSync("close_by");
    }else{
      var list = wx.getStorageSync("recent");
    }
    var processedList = [];
    list.forEach(v=>{
      if(v.category.includes("活动")){
        processedList.push(v);
      }
    })
    if(type=="close_by"){
      this.setData({
        closeby_items: processedList
      })
    }else{
      this.setData({
        recent: processedList
      })
    }
  },
  gameOnly(e){
    var type = e.currentTarget.dataset.type;
    if(type=="close_by"){
      var list = wx.getStorageSync("close_by");
    }else{
      var list = wx.getStorageSync("recent");
    }
    var processedList = [];
    list.forEach(v=>{
      if(v.category.includes("比赛")){
        processedList.push(v);
      }
    })
    if(type=="close_by"){
      this.setData({
        closeby_items: processedList
      })
    }else{
      this.setData({
        recent: processedList
      })
    }
  },
  allItems(e){
    var type = e.currentTarget.dataset.type;
    if(type=="close_by"){
      var list = wx.getStorageSync("close_by");
      this.setData({
        closeby_items: list
      })
    }else{
      var list = wx.getStorageSync("recent");
      this.setData({
        recent: list
      })
    }
  },
  rowNavigator(e){

    if(e.currentTarget.dataset.category.includes("活动")){
      wx.navigateTo({
        url:"/pages/event_detail/index?id=" + e.currentTarget.dataset.id
      })
    }else{
      wx.navigateTo({
        url:"/pages/game_detail/index?id=" + e.currentTarget.dataset.id
      })
    }
},

  // BUTTON FUNCTIONS END
})