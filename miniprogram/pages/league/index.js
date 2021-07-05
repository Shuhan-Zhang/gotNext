const app = getApp();
Page({

  data: {
    allTeamData: [],
    leagueOnlyTeamData: [],
    leagueOnlyGames: [],
    allPlayerData: [],
    allGames: [],
    pastGames: [],
    upcomingGames: [],
    league: "U16",
    pointLeader: {},
    reboundLeader: {},
    assistLeader: {},
    allLeagues: [],
    clickedButtonColor: "#FF784B",
    unclickedButtonColor: "#ffb38e",
    isShowUserName: false,
    userStatus: wx.getStorageSync('userStatus'),
    userTeamInfo: {},
    gotNextID:wx.getStorageSync('gotNextID')
  },
  onLoad: function (options) {
    wx.showLoading({title: "加载中"});
    this.processAllGames();
    this.getPlayers();
    this.getTeamData();
    this.processTeams();
    this.getLeagues();
    this.getUserStatus();
    this.getUserPlayerInfo();
  },
  onShow() {
    //页面显示后获取用户信息
    this.refreshUserStatus(wx.getStorageSync('user'));
  },



  //LOAD DATA FUNCTIONS START

  //获取所有所属联盟的球员信息
  getPlayers() {
    wx.cloud.database().collection("players").where({
        league: this.data.league
      }).get()
      .then(res => {
        this.processPlayers(res.data);
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon: 'error'
        });
      })
  },

  //获取所有球队
  getTeamData() {
    var teams = wx.getStorageSync('allTeams');
    this.setData({
      allTeamData: teams
    })
  },

  //获取所有联盟名称
  getLeagues() {
    wx.cloud.database().collection("league").get()
      .then(res => {
        this.setData({  
          allLeagues: res.data
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

  //获取用户信息和其所属球队信息
  getUserPlayerInfo() {
    try {
      var userId = wx.getStorageSync('openid');
      wx.cloud.database().collection("players").where({
          player_id: userId
        }).get()
        .then(res => {
          var userTeam = res.data[0].team_name;
          //获取用户的球队信息
          this.getUserTeam(userTeam);
          wx.hideLoading()
        }).catch(err => {
          console.log("failed to pull data", err);
          wx.hideLoading();
        })
    } catch {
      console.log("user not logged in");
      wx.hideLoading();
    }
  },

  //获取用户的球队信息
  getUserTeam(team) {
    var userTeam = team;
    wx.cloud.database().collection("teams").where({
      team_name: userTeam
    }).get().then(res => {
      let teamInfo = res.data[0];
      //处理球队信息
      this.processTeamInfo(teamInfo);
    }).catch(err => {
      console.log("error fetching user team", err);
      wx.hideLoading();
    })
  },

  //获取用户登陆状态
  getUserStatus() {
    var userStatus = wx.getStorageSync('userStatus');
    this.setData({
      userStatus: userStatus
    })
  },
  //LOAD DATA FUNCTIONS END



  //PROCESS DATA FUNCTIONS START

  //处理所有比赛数据
  processAllGames(e) {
    var all_games = wx.getStorageSync('allGames');
    var today = wx.getStorageSync('today');
    var league_games = []
    var finishedGames = [];
    var upcomingGames = [];
    var finalTeams = [];

    //循环所有比赛数据，如果比赛属于当前联盟，添加到联盟比赛列表
    all_games.forEach(v => {
      if (v.league_name == this.data.league) {
        league_games.push(v);
      }
    })

    //检查比赛是否结束
    league_games.forEach(v => {
      //如果比赛没比分而且比赛结束时间大于当前时间，将比赛添加到未来比赛列表
      if (!v.team_1_score && Date.parse(v.end_time) > Date.parse(today)) {
        upcomingGames.push(v);
      }//如果比赛有比分，将比赛添加到结束比赛列表
      else if (v.team_1_score) {
        finishedGames.push(v);
      }
    })

    //将所有比赛列表按开始时间升序排序
    finishedGames.sort(function (a, b) {
      var value1 = Date.parse(a.start_time);
      var value2 = Date.parse(b.start_time);
      return value2 - value1;
    })
    upcomingGames.sort(function (a, b) {
      var value1 = Date.parse(a.start_time);
      var value2 = Date.parse(b.start_time);
      return value1 - value2;
    })
    this.setData({
      allGames: all_games,
      pastGames: finishedGames,
      upcomingGames: upcomingGames,
      leagueOnlyGames: league_games
    })
  },

  //处理数据王信息
  processPlayers(data) {
    //如果没有球员信息则所有数据王不存在
    if (data.length == 0) {
      players = data;
      points_leader = false;
      assists_leader = false;
      rebounds_leader = false;
      this.setData({
        allPlayerData: players,
        pointLeader: points_leader,
        assistLeader: assists_leader,
        reboundLeader: rebounds_leader
      })
    }else {
      var players = data;
      //循环所有球员，加入球员平均数据
      players.forEach(v => {
        if(v.total_games_played == 0){
          v.average_points = 0;
          v.average_rebounds = 0;
          v.average_assists = 0;
          v.total_percentage = 0;
          v.three_percentage = 0;
          v.average_turnover = 0;
        }else{
          v.average_points = v.total_points / v.total_games_played
          v.average_rebounds = v.total_rebounds / v.total_games_played
          v.average_assists = v.total_assists / v.total_games_played
          v.average_points_string = (v.total_points / v.total_games_played).toFixed(1);
          v.average_rebounds_string = (v.total_rebounds / v.total_games_played).toFixed(1);
          v.average_assists_string = (v.total_assists / v.total_games_played).toFixed(1);
        }
      })
      
      //把所有球员按平均得分升序排序
      players.sort(function (first, second) {
        return second.average_points - first.average_points;
      });
      var points_leader = players[0]

      //把所有球员按平均助攻升序排序
      players.sort(function (first, second) {
        return second.average_assists - first.average_assists;
      });
      var assists_leader = players[0]

      //把所有球员按平均篮板升序排序
      players.sort(function (first, second) {
        return second.average_rebounds - first.average_rebounds;
      });
      var rebounds_leader = players[0]
      this.setData({
        allPlayerData: players,
        pointLeader: points_leader,
        assistLeader: assists_leader,
        reboundLeader: rebounds_leader
      })
    }
  },

  //处理选择联盟的所属球队列表
  processTeams() {
    var all_teams = wx.getStorageSync('allTeams');
    var league_teams = []
    all_teams.forEach(v => {
      if (v.league_name == this.data.league) {
        league_teams.push(v);
      }
    })

    //把球队按赢场数升序排序
    league_teams.sort(function (first, second) {
      return second.win - first.win;
    });
    this.setData({
      leagueOnlyTeamData: league_teams
    })
  },

  //处理球队平均数据
  processTeamInfo(data) {
    var teamData = data;
    var total_games = data.win + data.loss;
    if (data.win + data.loss == 0) {
      teamData.average_points = 0;
      teamData.average_rebounds = 0;
      teamData.average_assists = 0;
    } else {
      teamData.average_points = (teamData.total_point / total_games).toFixed(1);
      teamData.average_rebounds = (teamData.total_rebound / total_games).toFixed(1);
      teamData.average_assists = (teamData.total_assist / total_games).toFixed(1);
    }
    this.setData({
      userTeamInfo: teamData
    })
  },
  //PROCESS DATA FUNCTIONS END



  //BUTTON FUNCTIONS START

  //用户登录
  login(e) {
    wx.showLoading({title: "加载中"});
    wx.getUserProfile({
      desc:"所有活动/联赛相关服务"
    }).then(res=>{
      if (res.userInfo) {
        var user = res.userInfo;
        user.openid = wx.getStorageSync('openid');
        this.refreshUserStatus(user);
        wx.setStorageSync('user', user);
        wx.showToast({
          title: '登录成功',
          icon:'success'
        })
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
              userStatus: 1
            })
          } else if (!res.data[0].team_name) {
            //2，用户登陆并且在gotNext注册了，但是没有参加gotNext联盟
            wx.setStorageSync('userStatus', 2);
            wx.setStorageSync('gotNextID', res.data[0]._id);
            this.setData({
              userStatus: 2
            })
          } else {
            //3，用户登陆了，gotNext注册了，并且参加了gotNext联盟(有所属球队和联盟)
            wx.setStorageSync('userStatus', 3);
            wx.setStorageSync('gotNextID', res.data[0]._id);
            this.setData({
              userStatus: 3
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

  //处理联盟更改
  changeLeague(e) {
    this.setData({
      league: e.currentTarget.dataset.league
    })
    this.onLoad();
  },

  //注册球员
  registerUser(e) {
    wx.navigateTo({
      url: "/pages/player_form/index"
    })
  },

  //跳转到球员卡
  playerNavigator(e) {
    wx.navigateTo({
      url: "/pages/player_card/index?openid=" + e.currentTarget.dataset.id
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

  //跳转到过去比赛列表页
  pastGameNavigator(e) {
    wx.navigateTo({
      url: "/pages/item_list/index?function=getPastGames&league=" + e.currentTarget.dataset.league
    })
  },
  confirmationNavigator(e){
    if(!this.data.gotNextID){
      wx.showToast({
        title: '请前往个人主页登陆/注册',
        icon: 'none'
      })
    }else{
      wx.navigateTo({
        url: "/pages/paymentConfirmation/index?name=" + e.currentTarget.dataset.name + "&price=" + e.currentTarget.dataset.price + "&location=" + e.currentTarget.dataset.location + "&time=" + e.currentTarget.dataset.time + "&category=" + "game" + "&playerID=" + this.data.gotNextID + "&gameID=" + e.currentTarget.dataset.eventid + "&participant_list=" + e.currentTarget.dataset.participant_list
      })
    }
  },
  checkInNavigator(e){
    wx.navigateTo({
      url:"/pages/checkIn/index"
    })
  },
  //BUTTON FUNCTIONS END
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading() //启用标题栏显示加载状态
    this.onLoad();
    setTimeout(() => {
      wx.hideNavigationBarLoading() //隐藏标题栏显示加载状态
      wx.stopPullDownRefresh() //结束刷新
    }, 1000); //设置执行时间
  }
})