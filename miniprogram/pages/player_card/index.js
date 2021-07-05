var getDate = require('../../getDate.js');
Page({
  data: {
    playerID: "",
    playerData: {}
  },
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中'
    })
    this.getPlayerData(options.openid);
    this.setData({
      playerID: options.openid
    })
  },

  //LOAD DATA FUNCTIONS

  //获取球员信息
  getPlayerData(id) {
    wx.cloud.database().collection("players").where({
        player_id: id
      }).get()
      .then(res => {

        //处理球员数据
        this.processPlayerData(res.data[0]);

        //如果球员有所属球队和联盟则获取球队信息
        if (res.data[0].team_name.length != 0 && res.data[0].league.length != 0) {
          //获取球队信息
          this.getTeamData(res.data[0].league, res.data[0].team_name)
        }
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

  //获取球员的所属球队信息
  getTeamData(league, team) {
    wx.cloud.database().collection("teams").where({
        league_name: league,
        team_name: team
      }).get()
      .then(res => {
        //获取历史比赛数据
        this.getPastGame(res.data[0].team_name, res.data[0].league_name);
        this.setData({
          teamInfo: res.data[0]
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

  //获取历史比赛数据
  getPastGame(team, league){
    let db = wx.cloud.database()
    const _ = db.command
    wx.cloud.database().collection("game").where({
      team_1_score: _.gt(0),
      team_list: team,
      league_name: league
      // team_1_score: _.exists(true),
      // team_1_score: _.neq(null)
    }).get()
    .then(res => {
      //处理过去比赛数据
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


  
  //PROCESS DATA FUNCTIONS

  //处理过去比赛数据
  processFinishedGames(data) {
    var gameList = data;
    var loaded_teams = wx.getStorageSync('allTeams');

    gameList.forEach(v => {
      //处理时间数据
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
      })
    })
    this.setData({
      finishedGame: gameList
    })
  },

  //处理球员数据
  processPlayerData(data) {
    var playerData = data;

    //如果球员没有参加过比赛则所有数据为0
    if (playerData.total_games_played == 0) {
      playerData.average_points = 0;
      playerData.average_rebounds = 0;
      playerData.average_assists = 0;
      playerData.total_percentage = 0;
      playerData.three_percentage = 0;
      playerData.average_turnover = 0;
    }
    //处理球员平均数据
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
  teamNavigator(e) {
    wx.navigateTo({
      url: "/pages/team_card/index?league=" + e.currentTarget.dataset.league + "&team=" + e.currentTarget.dataset.team
    })
  },
})