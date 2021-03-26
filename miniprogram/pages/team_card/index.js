var getDate = require('../../getDate.js');
Page({
  data: {
    finishedGames:[],
    upcomingGames:[],
    allPlayers:[],
    teamInfo:{}
  },
  onLoad: function (options) {
    this.getAllGames(options.league, options.team);
    this.getAllPlayers(options.league, options.team);
    this.getTeamInfo(options.league, options.team);
  },
  getAllGames(league, team){
    let db = wx.cloud.database()
    const _ = db.command
    wx.cloud.database().collection("game").where({
      team_list: team,
      league_name:league,
      team_1_score: _.exists(true)
    }).get()
    .then(res => {
      this.processFinishedGames(res.data);
    }).catch(err => {
      console.log("failed to pull data",err);
    })
    wx.cloud.database().collection("game").where({
      team_list: team,
      league_name:league,
      team_1_score: _.exists(false)
    }).get()
    .then(res => {
      this.processUpcomingGames(res.data);
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getAllPlayers(league, team){
    wx.cloud.database().collection("players").where({
      team_name: team,
      league:league
    }).get()
    .then(res => {
      this.setData({
        allPlayers:res.data
      })
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getTeamInfo(league, team){
    wx.cloud.database().collection("teams").where({
      team_name: team,
      league_name:league
    }).get()
    .then(res => {
      this.processTeamInfo(res.data[0]);
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  processTeamInfo(data){
    var teamData = data;
    var total_games = data.win + data.loss;
    if(data.win+data.loss == 0){
      teamData.average_points = 0;
      teamData.average_rebounds = 0;
      teamData.average_assists = 0;
    }else{
      teamData.average_points = (teamData.total_point/total_games).toFixed(1);
      teamData.average_rebounds = (teamData.total_rebound/total_games).toFixed(1);
      teamData.average_assists = (teamData.total_assist/total_games).toFixed(1);
    }
    console.log(teamData);
    this.setData({
      teamInfo: teamData
    })
  },
  processFinishedGames(data){
    var gameList = data;
    var loaded_teams = wx.getStorageSync('allTeams');
    gameList.forEach(v=>{
      v.written_time = getDate.formatTime(new Date(v.time));
      v.specific_time = getDate.formatSpecific(new Date(v.time));
      loaded_teams.forEach(i=>{
        if(i.team_name == v.team_list[0]){
          v.team_1_data = i
        }else if(i.team_name == v.team_list[1]){
          v.team_2_data = i
        }
      })
    })
    this.setData({
      finishedGames: gameList
    })
  },
  processUpcomingGames(data){
    var gameList = data;
    var loaded_teams = wx.getStorageSync('allTeams');
    gameList.forEach(v=>{
      v.written_time = getDate.formatTime(new Date(v.time));
      v.specific_time = getDate.formatSpecific(new Date(v.time));
      loaded_teams.forEach(i=>{
        if(i.team_name == v.team_list[0]){
          v.team_1_data = i
        }else if(i.team_name == v.team_list[1]){
          v.team_2_data = i
        }
      })
    })
    this.setData({
      upcomingGames: gameList
    })
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
  },
  gameNavigator(e){
    wx.navigateTo({
      url:"/pages/game_detail/index?id=" + e.currentTarget.dataset.id
    })
  },
})