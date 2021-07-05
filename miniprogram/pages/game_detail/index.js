var getDate = require('../../getDate.js');
Page({

  data: {
    game: {},
    marker: [],
    point: [],
    team1: {},
    team2: {},
    gameID:"",
    playerID: wx.getStorageSync('openid'),
    participated:false,
    past:false
  },

  onLoad: function (options) {
    wx.showLoading({title: "加载中"});
    var id = options.id;
    this.getGame(id);
    this.setData({
      playerID: wx.getStorageSync('openid'),
      gameID:id
    })
  },

  //LOAD DATA FUNCTIONS

  //获取比赛信息
  getGame(gameID) {
    wx.cloud.database().collection("game").doc(gameID).get()
      .then(res => {
        console.log("data pulled successfully", res);
        this.setTime(res.data);
        this.setLocation(res.data);
        this.getLeagueInfo(res.data.league, res.data.team_list[0], res.data.team_list[1]);
        this.setData({
          game: res.data
        })
        this.checkAttended(res.data);
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

  //获取比赛两个球队的球队数据
  getLeagueInfo(league, team1, team2) {
    wx.cloud.database().collection("teams").where({
        team_name: team1,
        league_name: league
      }).get()
      .then(res => {
        this.setData({
          team1: res.data[0]
        })
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
    wx.cloud.database().collection("teams").where({
        team_name: team2,
        league_name: league
      }).get()
      .then(res => {
        this.setData({
          team2: res.data[0]
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


  //PROCESS DATA FUNCTIONS

  //检查用户是否已经购买球票
  checkAttended(gameData){
    if(gameData.participant_list.includes(wx.getStorageSync('gotNextID'))){
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
      latitude: user_latitude,
    }, {
      longitude: event.location_specific.longitude,
      latitude: event.location_specific.latitude,
      name: event.location_specific.name
    })
    this.setMap(final_points);
    this.setData({
      points: final_points,
      marker: final_markers
    })
  },

  //设置地图
  setMap(point_list) {
    var map = wx.createMapContext('12345', this);
    map.includePoints({
      points: point_list,
      success(res) {
        console.log(res);
      },
      fail(err) {
        console.log(err);
      }
    })
  },

  //处理时间数据
  setTime(data) {
    var loaded_games = data;
    loaded_games.written_time = getDate.formatTime(new Date(loaded_games.start_time));
    loaded_games.specific_time = getDate.formatSpecific(new Date(loaded_games.start_time));
    loaded_games.specific_endtime = getDate.formatSpecific(new Date(loaded_games.end_time));
    if(new Date(loaded_games.end_time) > new Date()){
      this.setData({
        past:false
      })
    }else{
      this.setData({
        past:true
      })
    }
    this.setData({
      event: loaded_games
    })
  },

  //BUTTON FUNCTIONS

  //跳转到付款详情页
  confirmationNavigator(e){
    wx.navigateTo({
      url: "/pages/paymentConfirmation/index?name=" + this.data.game.name + "&price=" + this.data.game.price + "&location=" + this.data.game.location_name + "&time=" + this.data.game.specific_time + "&category=" + "game" + "&playerID=" + this.data.playerID + "&gameID=" + this.data.gameID + "&participant_list=" + this.data.game.participant_list
    })
  },

  //跳转到登记页面
  checkIn(e){
    wx.navigateTo({
      url:"/pages/checkIn/index"
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

  onPullDownRefresh: function () {
    wx.showNavigationBarLoading() //启用标题栏显示加载状态
    this.getGame(this.data.gameID);
    setTimeout(() => {
      wx.hideNavigationBarLoading() //隐藏标题栏显示加载状态
      wx.stopPullDownRefresh() //结束刷新
    }, 1000); //设置执行时间
  },
  teamNavigator(e) {
    wx.navigateTo({
      url: "/pages/team_card/index?league=" + e.currentTarget.dataset.league + "&team=" + e.currentTarget.dataset.team
    })
  },
})