var getDate = require('../../getDate.js');
Page({
  data: {
    itemList: [],
    backgroundColor: "#FF5400",
    titleText: "列表",
    gotNextID:wx.getStorageSync('gotNextID'),
  },
  onLoad: function (options) {
    wx.showLoading({title: "加载中"});
    //确认列表种类
    switch (options.function) {
      case "getAllCloseby":
        this.getAllCloseby();
        this.setData({
          backgroundColor: "#FF5400",
          titleText: "附近活动/比赛"
        })
        wx.hideLoading()
        break
      case "getAllRecent":
        this.getAllRecent();
        this.setData({
          backgroundColor: "#FF2E2E",
          titleText: "最近活动/比赛"
        })
        wx.hideLoading()
        break
      case "getPastGames":
        this.getPastGames(options.league);
        this.setData({
          backgroundColor: "#FF5400",
          titleText: "最新比赛"
        })
        wx.hideLoading()
        break
      case "getPersonalEvents":
        this.getPersonalEvents();
        this.setData({
          backgroundColor: "#FF5400",
          titleText: "个人活动"
        })
        wx.hideLoading()
        break
      case "getTeamEvents":
        this.getTeamEvents();
        this.setData({
          backgroundColor: "#147CE5",
          titleText: "团队活动"
        })
        wx.hideLoading()
        break
      case "getChallengeEvents":
        this.getChallengeEvents();
        this.setData({
          backgroundColor: "#51976A",
          titleText: "挑战活动"
        })
        wx.hideLoading()
        break
      case "getSocialEvents":
        this.getSocialEvents();
        this.setData({
          backgroundColor: "#DA463C",
          titleText: "社交活动"
        })
        wx.hideLoading()
        break
      case "getNearbyEvents":
        this.getNearbyEvents();
        this.setData({
          backgroundColor: "#FF5400",
          titleText: "附近活动"
        })
        wx.hideLoading()
        break
      case "getHistory":
        this.getHistory(options.league, options.team, options.id);
        this.setData({
          titleText: "活动+比赛历史"
        })
        break
      default:
        wx.hideLoading()
        wx.showToast({
          title: '无法加载列表',
          icon: 'error'
        })
        console.log("error loading item list");
    }
  },
  
  //LOAD DATA FUNCTIONS
  
  //获取所有附近活动+比赛
  getAllCloseby() {
    this.setData({
      itemList: wx.getStorageSync('close_by')
    })
  },

  //获取所有最近活动+比赛
  getAllRecent() {
    this.setData({
      itemList: wx.getStorageSync('recent')
    })
  },

  //获取所有过去比赛
  getPastGames(league) {
    var league = league
    wx.cloud.database().collection("game").where({
        league_name: league
      }).get()
      .then(res => {
        this.processFinishedGames(res.data);
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
  },

  //获取所有个人活动
  getPersonalEvents() {
    wx.cloud.database().collection("event").where({
        category: "个人"
      }).get()
      .then(res => {
        this.processEventTime(res.data)
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
  },

  //获取所有团队活动
  getTeamEvents() {
    wx.cloud.database().collection("event").where({
        category: "团队"
      }).get()
      .then(res => {
        this.processEventTime(res.data)
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
  },

  //获取所有挑战活动
  getChallengeEvents() {
    wx.cloud.database().collection("event").where({
        category: "挑战"
      }).get()
      .then(res => {
        this.processEventTime(res.data)
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
  },

  //获取所有社交活动
  getSocialEvents() {
    wx.cloud.database().collection("event").where({
        category: "社交"
      }).get()
      .then(res => {
        this.processEventTime(res.data)
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
  },

  //获取所有附近活动
  getNearbyEvents() {
    var allNearby = wx.getStorageSync('close_by');
    var nearbyEvents = [];
    allNearby.forEach(v => {
      if (v.category.includes("活动")) {
        nearbyEvents.push(v);
      }
    })
    this.setData({
      itemList: nearbyEvents
    })
  },

  getHistory(league, team, id){
    let db = wx.cloud.database()
    const _ = db.command
    
    wx.cloud.database().collection("event").where({
      participant_list: id
    }).get()
    .then(res => {
      this.processEventTime(res.data)
    }).catch(err => {
      console.log("failed to pull data", err);
      wx.showToast({
        title: '加载出错',
        icon: 'error'
      });
    })
    
    if(league && team){
      wx.cloud.database().collection("game").where(_.or([
        {
          league_name: league,
          team_list: team
        },  
        {
          participant_list: id
        }
      ])
        ).get()
      .then(res => {
        wx.hideLoading();
        this.processFinishedGames(res.data);
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
    }
  },

  //PROCESS DATA FUNCTIONS

  //处理过去比赛数据
  processFinishedGames(data) {
    var gameList = data;
    var loaded_teams = wx.getStorageSync('allTeams');
    gameList.forEach(v => {
      //处理比赛时间
      v.written_time = getDate.formatTime(new Date(v.start_time));
      v.specific_time = getDate.formatSpecific(new Date(v.start_time));
      v.specific_endtime = getDate.formatSpecific(new Date(v.end_time));
      //添加具体球队信息
      loaded_teams.forEach(i => {
        if (i.team_name == v.team_list[0]) {
          v.team_1_data = i
        } else if (i.team_name == v.team_list[1]) {
          v.team_2_data = i
        }
        if(new Date(v.end_time) < new Date()){
          v.past = true;
        }else{
          v.past = false;
        }
      })
    })
    var final = this.data.itemList.concat(gameList);
    final.sort(function (a, b) {
      var value1 = Date.parse(a.start_time);
      var value2 = Date.parse(b.start_time);
      return value1 - value2;
    });
    this.setData({
      itemList: final
    })
  },
  //处理未来比赛数据
  processUpcomingGames(data) {
    var gameList = data;
    var loaded_teams = wx.getStorageSync('allTeams');
    gameList.forEach(v => {
      //处理比赛时间
      v.written_time = getDate.formatTime(new Date(v.start_time));
      v.specific_time = getDate.formatSpecific(new Date(v.start_time));
      v.specific_endtime = getDate.formatSpecific(new Date(v.end_time));

      //添加具体球队信息
      loaded_teams.forEach(i => {
        if (i.team_name == v.team_list[0]) {
          v.team_1_data = i
        } else if (i.team_name == v.team_list[1]) {
          v.team_2_data = i
        }
        if(new Date(v.end_time) < new Date()){
          v.past = true;
        }else{
          v.past = false;
        }
      })
    })
    var final = this.data.itemList.concat(gameList);
    final.sort(function (a, b) {
      var value1 = Date.parse(a.start_time);
      var value2 = Date.parse(b.start_time);
      return value1 - value2;
    });
    this.setData({
      itemList: final
    })
  },

  //处理活动时间
  processEventTime(data) {
    var loaded_events = data;
    loaded_events.forEach(v => {
      v.written_time = getDate.formatTime(new Date(v.start_time));
      v.specific_time = getDate.formatSpecific(new Date(v.start_time));
      v.specific_endtime = getDate.formatSpecific(new Date(v.end_time));
      if(v.participant_list.includes(wx.getStorageSync('gotNextID'))){
        v.participated = true;
      }else{
        v.participated = false;
      }
      if(new Date(v.end_time) < new Date()){
        v.past = true;
      }else{
        v.past = false;
      }
    })
    var final = this.data.itemList.concat(loaded_events);
    final.sort(function (a, b) {
      var value1 = Date.parse(a.start_time);
      var value2 = Date.parse(b.start_time);
      return value1 - value2;
    });
    this.setData({
      itemList: final
    })
  },



  //BUTTON FUNCTIONS

  //跳转到球员卡
  playerNavigator(e) {
    wx.navigateTo({
      url: "/pages/player_card/index?openid=" + e.currentTarget.dataset.id
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
  }
})