var getDate = require('../../getDate.js');
const app = getApp();
Page({
  data: {
    gotNextID: wx.getStorageSync('gotNextID'),
    playerID: "",
    playerData: {},
    allEvent: [],
    allGame: [],
    selected:[],
    recentEvent:[],
    recentGame:[],
    finishedGame:[],
    playerStatus: wx.getStorageSync('userStatus')
  },
  onLoad: function (options) {
    wx.showLoading({title: "加载中"});
    //获取球员openid
    wx.getStorage({
      key:'openid'
    }).then(res=>{
      this.setData({
        playerID: res.data
      })
      this.getPlayerData(res.data);
    }).catch(err=>{
      console.log("no id", err);
      wx.hideLoading();
      wx.showToast({
        title: '加载出错',
        icon: 'error'
      });
    })
  },
  onShow(){
    wx.getStorage({
      key:'openid'
    }).then(res=>{
      this.setData({
        playerID: res.data
      })
      this.getPlayerData(res.data);
    }).catch(err=>{
      console.log("no id", err);
      wx.hideLoading();
      wx.showToast({
        title: '加载出错',
        icon: 'error'
      });
    })
    this.refreshUserStatus(wx.getStorageSync('user'));
  },


  //LOAD DATA FUNCTIONS

  //获取球员数据数据
  getPlayerData(id) {
    wx.cloud.database().collection("players").where({
        player_id: id
      }).get()
      .then(res => {
        this.processPlayerData(res.data[0]);
        if (res.data[0].team_name.length != 0 && res.data[0].league.length != 0) {
          this.getTeamData(res.data[0].league, res.data[0].team_name)
        }else{
          this.setData({
            teamInfo:{
              logo:"https://676f-gotnext-7gc174phedbcfbb9-1306413881.tcb.qcloud.la/nbalogo.png?sign=d469e7ce49654ba929b7990f87c9a032&t=1627118302"
            }
          })
        }
        wx.hideLoading();
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
      })
  },

  //获取球员所属球队信息
  getTeamData(league, team) {
    wx.cloud.database().collection("teams").where({
        league_name: league,
        team_name: team
      }).get()
      .then(res => {
        this.setData({
          teamInfo: res.data[0]
        })
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
      })
  },

  //获取所有用户参加的活动
  getAllEvent(id){
    wx.cloud.database().collection("event").where({
      participant_list: id
    }).get()
    .then(res => {
      this.processEventTime(res.data);
    }).catch(err => {
      console.log("failed to pull data", err);
      wx.hideLoading();
    })
  },

  //获取所有用户参加的比赛
  getAllGame(team,league){
    let db = wx.cloud.database()
    const _ = db.command
    wx.cloud.database().collection("game").where(
      //用户在比赛球队里或者在观众列表里则添加到比赛列表里
      _.or([
        {
          team_list: team,
          league_name: league
        },
        {
          participant_list: wx.getStorageSync('gotNextID')
        }
      ])
    ).get()
    .then(res => {
      this.processGameTime(res.data);
    }).catch(err => {
      console.log("failed to pull data", err);
      wx.hideLoading();
    })
  },

  //获取所有用户之前的比赛
  getPastGame(team, league){
    let db = wx.cloud.database()
    const _ = db.command
    wx.cloud.database().collection("game").where({
      team_1_score: _.gt(0),
      team_list: team,
      league_name: league
    }).get()
    .then(res => {
      //处理比赛数据
      this.processFinishedGames(res.data);
    }).catch(err => {
      console.log("failed to pull data", err);
      wx.hideLoading();
    })
    },



  //PROCESS DATA FUNCTIONS

  //处理活动时间
  processEventTime(data) {
    var loaded_events = data;
    loaded_events.forEach(v => {
      v.written_time = getDate.formatTime(new Date(v.start_time));
      v.specific_time = getDate.formatSpecific(new Date(v.start_time));
      v.specific_endtime = getDate.formatSpecific(new Date(v.end_time));
    })
    this.processRecentEvents(loaded_events);
    this.setData({
      allEvent: loaded_events
    })
  },

  //处理比赛时间
  processGameTime(data) {
    var loaded_game = data;
    loaded_game.forEach(v => {
      v.written_time = getDate.formatTime(new Date(v.start_time));
      v.specific_time = getDate.formatSpecific(new Date(v.start_time));
      v.specific_endtime = getDate.formatSpecific(new Date(v.end_time));
    })
    this.processRecentGames(loaded_game);
    this.setData({
      allGame: loaded_game
    })
  },

  //处理用户的细节数据
  processPlayerData(data) {
    var playerData = data;
    this.getAllEvent(playerData._id);
    this.getAllGame(playerData.team_name, playerData.league);
    this.getPastGame(playerData.team_name, playerData.league);
    //如果用户没有打过比赛的话则所有数据为0
    if (playerData.total_games_played == 0) {
      playerData.average_points = 0;
      playerData.average_rebounds = 0;
      playerData.average_assists = 0;
      playerData.total_percentage = 0;
      playerData.three_percentage = 0;
      playerData.average_turnover = 0;
    }
    //处理用户平均数据 
    else {
      playerData.average_points = (playerData.total_points / playerData.total_games_played).toFixed(1);
      playerData.average_rebounds = (playerData.total_rebounds / playerData.total_games_played).toFixed(1);
      playerData.average_assists = (playerData.total_assists / playerData.total_games_played).toFixed(1);
      playerData.total_percentage = ((playerData.total_made_shots / playerData.total_shots) * 100).toFixed(1);
      playerData.three_percentage = ((playerData.total_made_threes / playerData.total_threes_taken) * 100).toFixed(1);
      playerData.average_turnover = (playerData.total_turnovers / playerData.total_games_played).toFixed(1);
    }
    this.setData({
      playerData: playerData
    })
  },
  processRecentEvents(data){
    var recent = [];
    data.forEach(v=>{
      if(new Date(v.end_time) >= new Date()){
        recent.push(v);
      }
    });
    this.setData({
      recentEvent: recent.splice(0,3)
    });
  },
  processRecentGames(data){
    var recent = [];
    data.forEach(v=>{
      if(new Date(v.end_time) >= new Date()){
        recent.push(v);
      }
    });
    
    this.setData({
      recentGame: recent.splice(0,3)
    })
  },

  //处理历史比赛数据
  processFinishedGames(data) {
    var gameList = data;
    var loaded_teams = wx.getStorageSync('allTeams');
    gameList.forEach(v => {
      //处理比赛时间数据
      v.written_time = getDate.formatTime(new Date(v.start_time));
      v.specific_time = getDate.formatSpecific(new Date(v.start_time));
      v.specific_endtime = getDate.formatSpecific(new Date(v.end_time));

      //添加所属球队信息
      loaded_teams.forEach(i => {
        if (i.team_name == v.team_list[0]) {
          v.team_1_data = i
        } else if (i.team_name == v.team_list[1]) {
          v.team_2_data = i
        }
      })
    })
    this.setData({
      finishedGame: gameList
    })
  },

  
  //BUTTON FUNCTIONS

  //用户日程表选择日期时触发
  onConfirm(e) {
    var selectedDate = [];
    this.data.allEvent.forEach(v => {
      if (v.written_time == getDate.formatTime(e.detail)) {
        selectedDate.push(v);
      }
    })
    this.data.allGame.forEach(v => {
      if (v.written_time == getDate.formatTime(e.detail)) {
        selectedDate.push(v);
      }
    })
    selectedDate.sort(function (a, b) {
      var value1 = Date.parse(a.start_time);
      var value2 = Date.parse(b.start_time);
      return value1 - value2;
    });
    this.setData({
      selected: selectedDate
    })
  },

  //用户登录
  login(e) {
    wx.showLoading({title: "加载中"});
    wx.getUserProfile({
      desc:"所有活动/联赛相关服务"
    }).then(res=>{
      if (res.userInfo) {
        
        var user = res.userInfo;
        user.openid = wx.getStorageSync('openid');
        // app._saveUserInfo(user);
        this.refreshUserStatus(user);
        wx.showToast({
          title: '登录成功',
          icon:'success'
        })
        wx.setStorageSync('user', user);
        wx.hideLoading();
      } else {
        app.showErrorToastUtils('登陆需要允许授权');
      }
    }).catch(err=>{
      console.log("login error", err);
      wx.showToast({
        title: '登录错误',
        icon: 'error'
      })
    })
  },
  refreshUserStatus(user){
    try {
      var userInfo = user;
      if(userInfo){
        wx.cloud.database().collection("players").where({
          player_id: userInfo.openid
        }).get()
        .then(res => {
          if (res.data.length == 0 || !res.data) {
            //1，用户登陆了但是没有在gotNext注册
            wx.setStorageSync('userStatus', 1);
            this.setData({
              playerStatus: 1
            })
          } else if (!res.data[0].team_name) {
            //2，用户登陆并且在gotNext注册了，但是没有参加gotNext联盟
            wx.setStorageSync('userStatus', 2);
            wx.setStorageSync('gotNextID', res.data[0]._id);
            this.setData({
              playerStatus: 2
            })
          } else {
            //3，用户登陆了，gotNext注册了，并且参加了gotNext联盟(有所属球队和联盟)
            wx.setStorageSync('userStatus', 3);
            wx.setStorageSync('gotNextID', res.data[0]._id);
            this.setData({
              playerStatus: 3
            })
          }
        }).catch(err => {
          console.log("failed to pull data", err);
          wx.hideLoading();
          wx.setStorageSync('userStatus', 0);
          this.setData({
            playerStatus: 0
          })
        })
      }else{
        wx.setStorageSync('userStatus', 0);
        this.setData({
          playerStatus: 0
        })
      }
    } catch (err) {
      //0,用户没有登陆
      wx.setStorageSync('userStatus', 0);
      this.setData({
        playerStatus: 0
      })
      wx.hideLoading();
    }
  },

  //跳转到注册页面
  registerUser(e) {
    wx.navigateTo({
      url: "/pages/player_form/index"
    })
  },

  //跳转到球队卡
  teamNavigator(e) {
    wx.navigateTo({
      url: "/pages/team_card/index?league=" + e.currentTarget.dataset.league + "&team=" + e.currentTarget.dataset.team
    })
  },

  //跳转到比赛详情页
  gameNavigator(e) {
    wx.navigateTo({
      url: "/pages/game_detail/index?id=" + e.currentTarget.dataset.id
    })
  },

  historyNavigator(e) {
    wx.navigateTo({
      url: "/pages/item_list/index?function=getHistory&league=" + this.data.teamInfo.league_name + "&team=" + this.data.teamInfo.team_name + "&id=" + this.data.gotNextID
    })
  },

  //跳转到建议页
  adviceNavigator(e){
    wx.navigateTo({
      url: "/pages/advice/index"
    })
  },

  //跳转到错误反馈页
  errorNavigator(e){
    wx.navigateTo({
      url: "/pages/bugReport/index"
    })
  },

  //跳转到开发者信息页
  developerNavigator(e){
    wx.navigateTo({
      url: "/pages/developerInfo/index"
    })
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

  orderListNavigator(e){
    wx.navigateTo({
      url: "/pages/orderList/index?openid=" + this.data.playerData
    })
  },
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading() //启用标题栏显示加载状态
    this.onLoad();
    setTimeout(() => {
      wx.hideNavigationBarLoading() //隐藏标题栏显示加载状态
      wx.stopPullDownRefresh() //结束刷新
    }, 1000); //设置执行时间
  }
})