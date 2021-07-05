// pages/index/index.js
var getDate = require('../../getDate.js');
Page({
  data: {
    user_location: {},
    markers: [],
    points: [],
    today: 0,
    swiper_image: [],
    closeby_items: [],
    news: [],
    events: [],
    games: [],
    recent: [],
    past: [],
    mvp: {},
    gotNextID:wx.getStorageSync('gotNextID'),
    userStatus:wx.getStorageSync('userStatus'),
    MVPTeamImage: "",
    loaded:false,
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
    selected: {},

  },

  onLoad() {
    wx.showLoading({title: "加载中"});
    Date.prototype.addHours = function(h) {
      this.setTime(this.getTime() + (h*60*60*1000));
      return this;
    }
    //获取今天的时间
    var time = getDate.formatTime(new Date());
    this.setData({
      today: time,
      gotNextID: wx.getStorageSync('gotNextID')
    })
    wx.setStorageSync('today', time);


    //获取用户的地址
    wx.getLocation().then(res => {
      wx.setStorageSync('user_location', res);
      this.setData({
        user_location: res
      })
      this.getEventGames();
    })
    //读取所有云开发的数据
    this.getEventGames();
    this.getMVP();
    this.getSwiperImage();
    this.getNews();
    this.getTeams();
  },
  onShow(){
    this.getEventGames();
    this.setData({
      userStatus: wx.getStorageSync('userStatus'),
      gotNextID: wx.getStorageSync('gotNextID')
    })
  },

  // LOAD DATA FUNCTIONS START

  //读取所有活动和数据
  getEventGames() {
    let db = wx.cloud.database()
    const _ = db.command
    wx.cloud.database().collection("event").where({
        //活动的结束时间必须大于现在时间
        end_time: _.gte(new Date())
      }).orderBy("start_time", 'asc').get()
      .then(res => {
        
        //处理活动时间
        this.processEventTime(res.data);
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
      })
    //读取比赛数据
    wx.cloud.database().collection("game").orderBy("start_time", 'asc').get()
      .then(res => {
        //处理当日数据
        this.processGameTime(res.data);
        this.processToday();
        //添加比赛的球队数据
        this.processGames();
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
      })
  },
  //读取轮播图图片
  getSwiperImage() {
    wx.cloud.database().collection("index_swiper").get()
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
  //读取今日最佳球员的MVP信息
  getMVP() {
    wx.cloud.database().collection("MVP").get()
      .then(res => {
        this.setData({
          mvpInfo: res.data[0],
        })
        //读取今日最佳球员的球员信息
        this.getMVPPlayerData(res.data[0].player_id);
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
      })
  },
  //读取今日最佳球员的球员信息
  getMVPPlayerData(id) {
    wx.cloud.database().collection("players").where({
        player_id: id
      }).get()
      .then(res => {
        this.setData({
          MVPplayerData: res.data[0]
        })
        //读取MVP球员的球队信息
        this.getLeagueInfo(res.data[0].league, res.data[0].team_name);
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
      })
  },
  //读取指定球员的球队信息
  getLeagueInfo(league, team) {
    wx.cloud.database().collection("teams").where({
        league_name: league,
        team_name: team
      }).get()
      .then(res => {
        this.setData({
          MVPTeamImage: res.data[0].logo
        })
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
      })
  },
  //读取所有新闻信息
  getNews() {
    wx.cloud.database().collection("news").get()
      .then(res => {
        this.setData({
          news: res.data
        })
        wx.setStorageSync('allNews', res.data);
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
  },
  //读取所有的球队信息
  getTeams() {
    wx.cloud.database().collection("teams").get()
      .then(res => {
        this.setData({
          allTeams: res.data
        })
        wx.setStorage({
          data: res.data,
          key: 'allTeams',
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

  // LOAD DATA FUNCTIONS END

  // DATA PROCESSING FUNCTIONS START

  //在所有的比赛数据里加入对应的球队信息
  processGames() {
    var loaded_teams = wx.getStorageSync('allTeams');
    var loaded_games = wx.getStorageSync('allGames');
    //循环过每个比赛，在里面加入对应的球队信息
    loaded_games.forEach(v => {
      var team_1_name = v.team_list[0];
      var team_2_name = v.team_list[1];
      loaded_teams.forEach(j => {
        if (team_1_name == j.team_name) {
          v.team_1_data = j
        } else if (team_2_name == j.team_name) {
          v.team_2_data = j
        }
      })
    })
    this.processGameTime(loaded_games);
  },
  //在所有的活动里里加入时间数据
  processEventTime(data) {
    var loaded_events = data;
    loaded_events.forEach(v => {
      //只有日期的开始时间
      v.written_time = getDate.formatTime(new Date(v.start_time));
      //有日期和时间的开始时间
      v.specific_time = getDate.formatSpecific(new Date(v.start_time));
      //有日期和时间的结束时间
      v.specific_end_time = getDate.formatSpecific(new Date(v.end_time));
      if(v.participant_list.includes(wx.getStorageSync('gotNextID'))){
        v.participated = true;
      }else{
        v.participated = false;
      }
    })
    this.setData({
      events: loaded_events
    })
    wx.setStorageSync('allEvents', loaded_events);
  },
  //在所有的比赛里里加入时间数据
  processGameTime(data) {
    var loaded_games = data;
    loaded_games.forEach(v => {
      //只有日期的开始时间
      v.written_time = getDate.formatTime(new Date(v.start_time));
      //有日期和时间的开始时间
      v.specific_time = getDate.formatSpecific(new Date(v.start_time));
      //有日期和时间的结束时间
      v.specific_end_time = getDate.formatSpecific(new Date(v.end_time));
      //确认用户是否参加了该比赛
      if(v.participant_list.includes(wx.getStorageSync('gotNextID'))){
        v.participated = true;
      }else{
        v.participated = false;
      }
    })
    this.setData({
      games: loaded_games
    })
    wx.setStorageSync('allGames', loaded_games);
  },
  //处理地图数据
  processMap(point_list) {
    //创建map
    var map = wx.createMapContext('123', this);
    //在map里加入坐标点
    map.includePoints({
      points: point_list,
      success(res) {
        console.log("successfully processed map", res);
      },
      fail(err) {
        console.log("failed to process map", err);
      }
    })
  },
  //处理所有最近信息以及附近信息
  processToday() {
    var today = wx.getStorageSync('today');
    var currentTime = new Date()
    var final_closeby = [];
    var final_recent = [];
    var final_past = [];
    var final_markers = [];
    var final_points = [];
    var user_location = wx.getStorageSync('user_location');
    var user_latitude = user_location.latitude;
    var user_longitude = user_location.longitude;
    const all_events = wx.getStorageSync('allEvents');
    const all_games = wx.getStorageSync('allGames');
    //处理活动
    all_events.slice(0, 3).forEach(v => {
      //如果活动地址和用户地址的直线距离小于20公里，活动的开始日期在今天，并且活动的结束时间大于现在的时间，则加入附近列表
      if (this.getDistance(user_latitude, user_longitude, v.location_specific.latitude, v.location_specific.longitude) <= 20 && v.written_time == today && Date.parse(v.end_time) >= currentTime) {
        final_closeby.push(v);
        
      }//如果活动的开始日期大于今天，则加入最近列表
      else if (Date.parse(v.start_time) > Date.parse(today)) {
        final_recent.push(v);
      }
    })
    //处理活动
    all_games.slice(0, 3).forEach(v => {
      //如果比赛地址和用户地址的直线距离小于20公里，比赛的开始日期在今天，并且比赛的结束时间大于现在的时间，则加入附近列表
      if (this.getDistance(user_latitude, user_longitude, v.location_specific.latitude, v.location_specific.longitude) <= 20 && v.written_time == today && Date.parse(v.end_time) >= currentTime) {
        final_closeby.push(v);
      }//如果比赛的开始日期大于今天，则加入最近列表
      else if (Date.parse(v.start_time) > Date.parse(today)) {
        final_recent.push(v);
      } //如果比赛不是附近也不是最近则加入过去列表
      else {
        final_past.push(v);
      }
    })

    //创建地标数组
    var counter = 0;
    final_closeby.forEach(v => {
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
        name: v.location_specific.name
      })
      counter++;
    })
    //在地标数组里加入用户的位置
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

    //将最近数组按开始时间升序排序
    final_recent.sort(function (a, b) {
      var value1 = Date.parse(a.start_time);
      var value2 = Date.parse(b.start_time);
      return value1 - value2;
    });
    //将附近数组按开始时间升序排序
    final_closeby.sort(function (a, b) {
      var value1 = Date.parse(a.start_time);
      var value2 = Date.parse(b.start_time);
      return value1 - value2;
    });


    //处理地图数据
    this.processMap(final_points);

    this.setData({
      points: final_points,
      markers: final_markers,
      closeby_items: final_closeby,
      recent: final_recent,
      past: final_past
    })
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
  Rad: function (d) { //根据经纬度判断距离
    return d * Math.PI / 180.0;
  },
  getDistance: function (lat1, lng1, lat2, lng2) {
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
  change(e) {
    //实现新闻的分类选择功能
    this.setData({
      selected: {
        ...e.detail
      }
    })
    var category = e.detail.name;
    var list = wx.getStorageSync('allNews');
    var processedList = [];
    if (category == "全部分类") {
      processedList = list;
    }
    list.forEach(v => {
      if (v.category == category) {
        processedList.push(v);
      }
    })
    this.setData({
      news: processedList
    })
  },
  close() {
    // 关闭select
    this.selectComponent('#select').close()
  },
 
  // EXTERNAL FUNCTIONS END




  // BUTTON FUNCTIONS START
  //实现活动按钮功能
  eventOnly(e) {
    var type = e.currentTarget.dataset.type;
    if (type == "close_by") {
      var list = wx.getStorageSync("close_by");
    } else {
      var list = wx.getStorageSync("recent");
    }
    var processedList = [];
    list.forEach(v => {
      if (v.category.includes("活动")) {
        processedList.push(v);
      }
    })
    if (type == "close_by") {
      this.setData({
        closeby_items: processedList
      })
    } else {
      this.setData({
        recent: processedList
      })
    }
  },
  //实现比赛按钮功能
  gameOnly(e) {
    var type = e.currentTarget.dataset.type;
    if (type == "close_by") {
      var list = wx.getStorageSync("close_by");
    } else {
      var list = wx.getStorageSync("recent");
    }
    var processedList = [];
    list.forEach(v => {
      if (v.category.includes("比赛")) {
        processedList.push(v);
      }
    })
    if (type == "close_by") {
      this.setData({
        closeby_items: processedList
      })
    } else {
      this.setData({
        recent: processedList
      })
    }
  },
  //实现全部按钮功能
  allItems(e) {
    var type = e.currentTarget.dataset.type;
    if (type == "close_by") {
      var list = wx.getStorageSync("close_by");
      this.setData({
        closeby_items: list
      })
    } else {
      var list = wx.getStorageSync("recent");
      this.setData({
        recent: list
      })
    }
  },
  //转到game_detail或者event_detail页面
  rowNavigator(e) {
    if (e.currentTarget.dataset.category.includes("活动")) {
      wx.navigateTo({
        url: "/pages/event_detail/index?id=" + e.currentTarget.dataset.id
      })
    } else {
      wx.navigateTo({
        url: "/pages/game_detail/index?id=" + e.currentTarget.dataset.id
      })
    }
  },
  //转到球员卡
  playerNavigator(e) {
    wx.navigateTo({
      url: "/pages/player_card/index?openid=" + e.currentTarget.dataset.id
    })
  },
  //转到球队卡
  teamNavigator(e) {
    wx.navigateTo({
      url: "/pages/team_card/index?league=" + e.currentTarget.dataset.league + "&team=" + e.currentTarget.dataset.team
    })
  },
  //转到附近活动+比赛列表
  closeByNavigator(e) {
    wx.navigateTo({
      url: "/pages/item_list/index?function=getAllCloseby&league=none"
    })
  },
  //转到最近活动+比赛列表
  recentNavigator(e) {
    wx.navigateTo({
      url: "/pages/item_list/index?function=getAllRecent&league=none"
    })
  },
  //转到轮播图对应的活动/比赛
  swiperNavigator(e){
    var eventid = e.currentTarget.dataset.eventid;
    var gameid = e.currentTarget.dataset.gameid;
    if(eventid){
      wx.navigateTo({
        url: "/pages/event_detail/index?id=" + eventid
      })
    }else{
      wx.navigateTo({
        url: "/pages/game_detail/index?id=" + gameid
      })
    }
  },
  //转到确认购买页面
  confirmationNavigator(e){
    if(!this.data.gotNextID){
      wx.showToast({
        title: '请前往个人主页登陆/注册',
        icon: 'none'
      })
    }else{
      if(e.currentTarget.dataset.category.includes("活动")){
        wx.navigateTo({
          url: "/pages/paymentConfirmation/index?name=" + e.currentTarget.dataset.name + "&price=" + e.currentTarget.dataset.price + "&location=" + e.currentTarget.dataset.location + "&time=" + e.currentTarget.dataset.time + "&category=" + "event" + "&playerID=" + this.data.gotNextID + "&eventID=" + e.currentTarget.dataset.eventid + "&participant_list=" + e.currentTarget.dataset.participant_list
        })
      }else{
        wx.navigateTo({
          url: "/pages/paymentConfirmation/index?name=" + e.currentTarget.dataset.name + "&price=" + e.currentTarget.dataset.price + "&location=" + e.currentTarget.dataset.location + "&time=" + e.currentTarget.dataset.time + "&category=" + "game" + "&playerID=" + this.data.gotNextID + "&gameID=" + e.currentTarget.dataset.eventid + "&participant_list=" + e.currentTarget.dataset.participant_list
        })
      }
    }
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
  // BUTTON FUNCTIONS END
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading() //启用标题栏显示加载状态
    this.onLoad();
    setTimeout(() => {
      wx.hideNavigationBarLoading() //隐藏标题栏显示加载状态
      wx.stopPullDownRefresh() //结束刷新
    }, 1000); //设置执行时间
  },
})