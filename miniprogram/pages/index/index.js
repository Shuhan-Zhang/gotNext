// pages/index/index.js
var getDate = require('../../getDate.js');
Page({
  data:{
    user_location:{},
    markers:[],
    points:[],
    today:0,
    swiper_image:[],
    closeby_items:[],
    news:[],
    events:[],
    games:[],
    recent:[],
    past:[],
    mvp:{},
    MVPTeamImage:"",
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
    //获取今天的时间
    var time = getDate.formatTime(new Date());
    this.setData({
      today:time
    })
    wx.setStorageSync('today', time);


    //获取用户的地址
    wx.getLocation({
    }).then(res=>{
      wx.setStorageSync('user_location', res);
      this.setData({
        user_location: res
      })
    })

    //读取所有云开发的数据
    this.getEventGames();
    this.getMVP();
    this.getSwiperImage();
    this.getNews();
    this.getTeams();
    this.getPlayerStatus();
  },

  // LOAD DATA FUNCTIONS START
  getEventGames(){
    //读取活动数据
    wx.cloud.database().collection("event").orderBy("time",'asc').get()
    .then(res => {
      this.processEventTime(res.data);
    }).catch(err => {
      console.log("failed to pull data",err);
    })
    //读取比赛数据
    wx.cloud.database().collection("game").orderBy("time",'asc').get()
    .then(res => {
      this.setData({
        games: res.data
      })
      wx.setStorageSync('allGames', res.data)
      //处理比赛和游戏数据
      this.processToday();
      this.processGames();
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getSwiperImage(){
    //读取轮播图图片
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
    //读取今日最佳球员的信息
    wx.cloud.database().collection("MVP").get()
    .then(res => {
      this.setData({
        mvpInfo:res.data[0],
      })
      this.getMVPPlayerData(res.data[0].player_id);
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getMVPPlayerData(id){
    wx.cloud.database().collection("players").where({
      player_id: id
    }).get()
    .then(res => {
      this.setData({
        MVPplayerData: res.data[0]
      })
      this.getLeagueInfo(res.data[0].league, res.data[0].team_name);
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getLeagueInfo(league, team){
    //读取今日最佳球员的球队信息
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
    //读取新闻信息
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
  getTeams(){
    //读取所有的球队信息
    wx.cloud.database().collection("teams").get()
    .then(res => {
      this.setData({
        allTeams:res.data
      })
      wx.setStorage({
        data: res.data,
        key: 'allTeams',
      })
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getPlayerStatus(){
    try{
      var userInfo = wx.getStorageSync('user');
      wx.cloud.database().collection("players").where({
        player_id: userInfo.openid
      }).get()
      .then(res => {
        if(res.data.length == 0){
          this.setData({
            userStatus: 1
          })
          wx.setStorageSync('userStatus', 1);
        }else{
          this.setData({
            userStatus: 2
          })
          wx.setStorageSync('userStatus', 2);
        }
      }).catch(err => {
        console.log("failed to pull data",err);
      })
    }catch(err){
      this.setData({
        userStatus: 0
      })
      wx.setStorageSync('userStatus', 0);
    }
  },
  // LOAD DATA FUNCTIONS END

  // DATA PROCESSING FUNCTIONS START

  processGames(){
    //在所有的比赛数据里加入对应的球队信息
    var loaded_teams = wx.getStorageSync('allTeams');
    var loaded_games = wx.getStorageSync('allGames');
  
    loaded_games.forEach(v=>{
      v.written_time = getDate.formatTime(new Date(v.time));
      var team_1_name = v.team_1;
      var team_2_name = v.team_2;
      loaded_teams.forEach(j=>{
        if(team_1_name == j.team_name){
          v.team_1_data = j
        }else if(team_2_name == j.team_name){
          v.team_2_data = j
        }
      })
    })
    this.processGameTime(loaded_games);
  },

  processEventTime(data){
    var loaded_events = data;
    loaded_events.forEach(v=>{
      v.written_time = getDate.formatTime(new Date(v.time));
      v.specific_time = getDate.formatSpecific(new Date(v.time));
    })
    this.setData({
      events: loaded_events
    })
    wx.setStorageSync('allEvents', loaded_events);
  },

  processGameTime(data){
    var loaded_games = data;
    loaded_games.forEach(v=>{
      v.written_time = getDate.formatTime(new Date(v.time));
      v.specific_time = getDate.formatSpecific(new Date(v.time));
    })
    this.setData({
      games: loaded_games
    })
    wx.setStorageSync('allGames', loaded_games);
  },

  processMap(point_list){
    //处理篮球地图的标记信息
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
  processToday(){
    //处理所有最近信息以及附近信息
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
    all_games.forEach(v=>{
      v.written_time = getDate.formatTime(new Date(v.time));
      v.specific_time = getDate.formatSpecific(new Date(v.time));
    })
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
    final_points.push({
        longitude:user_location.longitude,
        latitude:user_location.latitude
      })
      
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
    this.processMap(final_points);

    wx.setStorage({
      data: final_closeby,
      key: 'close_by',
    })
    wx.setStorage({
      data: final_recent,
      key: 'recent',
    })
  },


  // PROCESS DATA FUNCTIONS END



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
    //实现新闻的分类选择功能
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
    //实现活动按钮功能
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
    //实现比赛按钮功能
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
    //实现全部按钮功能
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
    //转到game_detail或者event_detail页面
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
  playerNavigator(e){
    wx.navigateTo({
      url:"/pages/player_card/index?openid=" + e.currentTarget.dataset.id
    })
  },
  teamNavigator(e){
    wx.navigateTo({
      url:"/pages/team_card/index?league=" + e.currentTarget.dataset.league + "&team=" + e.currentTarget.dataset.team
    })
  }
  // BUTTON FUNCTIONS END
})