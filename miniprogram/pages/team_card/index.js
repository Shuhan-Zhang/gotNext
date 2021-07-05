var getDate = require('../../getDate.js');
Page({
  data: {
    finishedGames: [],
    upcomingGames: [],
    allPlayers: [],
    teamInfo: {}
  },
  onLoad: function (options) {
    wx.showLoading({title: "加载中"});
    this.getAllGames(options.league, options.team);
    this.getAllPlayers(options.league, options.team);
    this.getTeamInfo(options.league, options.team);
  },

  //LOAD DATA FUNCTIONS

  //获取所有球队比赛
  getAllGames(league, team) {
    let db = wx.cloud.database()
    const _ = db.command

    //获取所有历史比赛
    wx.cloud.database().collection("game").where({
        team_list: team,
        league_name: league,
        team_1_score: _.exists(true),
        team_1_score: _.gt(0)
      }).get()
      .then(res => {
        //处理历史比赛信息
        this.processFinishedGames(res.data);
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon:"error"
        });
      })

    //获取所有未来比赛
    wx.cloud.database().collection("game").where({
        team_list: team,
        league_name: league,
        team_1_score: 0
      }).get()
      .then(res => {
        //处理未来比赛信息
        this.processUpcomingGames(res.data);
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon:"error"
        });
      })
  },

  //获取球队的所有所属球员
  getAllPlayers(league, team) {
    wx.cloud.database().collection("players").where({
        team_name: team,
        league: league
      }).get()
      .then(res => {
        this.setData({
          allPlayers: res.data
        })
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon:"error"
        });
      })
  },

  //获取球队信息
  getTeamInfo(league, team) {
    wx.cloud.database().collection("teams").where({
        team_name: team,
        league_name: league
      }).get()
      .then(res => {
        this.processTeamInfo(res.data[0]);
        wx.hideLoading();
      }).catch(err => {
        console.log("failed to pull data", err);
        wx.hideLoading();
        wx.showToast({
          title: '加载出错',
          icon:"error"
        });
      })
  },



  //PROCESS DATA FUNCTIONS

  //处理球队信息
  processTeamInfo(data) {
    var teamData = data;
    var total_games = data.win + data.loss;

    //如果球队没有打过比赛则所有数据为0
    if (total_games == 0) {
      teamData.average_points = 0;
      teamData.average_rebounds = 0;
      teamData.average_assists = 0;
    } 
    //处理球队平均数据
    else {
      teamData.average_points = (teamData.total_point / total_games).toFixed(1);
      teamData.average_rebounds = (teamData.total_rebound / total_games).toFixed(1);
      teamData.average_assists = (teamData.total_assist / total_games).toFixed(1);
    }
    this.setData({
      teamInfo: teamData
    })
  },

  //处理历史比赛
  processFinishedGames(data) {
    var gameList = data;
    var loaded_teams = wx.getStorageSync('allTeams');
    gameList.forEach(v => {

      //处理比赛时间
      v.written_time = getDate.formatTime(new Date(v.start_time));
      v.specific_time = getDate.formatSpecific(new Date(v.start_time));
      v.specific_endtime = getDate.formatSpecific(new Date(v.end_time));

      //添加具体球队数据
      loaded_teams.forEach(i => {
        if (i.team_name == v.team_list[0]) {
          v.team_1_data = i
        } else if (i.team_name == v.team_list[1]) {
          v.team_2_data = i
        }
      })
    })
    this.setData({
      finishedGames: gameList
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
      
      //添加具体球队数据
      loaded_teams.forEach(i => {
        if (i.team_name == v.team_list[0]) {
          v.team_1_data = i
        } else if (i.team_name == v.team_list[1]) {
          v.team_2_data = i
        }
      })
    })
    this.setData({
      upcomingGames: gameList
    })
  },

  

  //BUTTON FUNCTIONS

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
  }
})