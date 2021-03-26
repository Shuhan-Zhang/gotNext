Page({
  data: {
    playerID:"",
    playerData:{}
  },
  onLoad: function (options) {
    this.setData({
      playerID: options.openid
    })
    console.log(options.openid);
    this.getPlayerData(options.openid);
  },
  getPlayerData(id){
    wx.cloud.database().collection("players").where({
      player_id: id
    }).get()
    .then(res => {
      this.processPlayerData(res.data[0]);
      if(res.data[0].team_name.length != 0 && res.data[0].league.length != 0){
        this.getTeamData(res.data[0].league, res.data[0].team_name)
      }
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getTeamData(league, team){
    wx.cloud.database().collection("teams").where({
      league_name:league,
      team_name:team
    }).get()
    .then(res => {
      this.setData({
        teamInfo: res.data[0]
      })
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  processPlayerData(data){
    var playerData = data;
    if(playerData.total_games_played == 0){
      playerData.average_points = 0;
      playerData.average_rebounds = 0;
      playerData.average_assists = 0;
      playerData.total_percentage = 0;
      playerData.three_percentage = 0;
      playerData.average_turnover = 0;
    }else{
      playerData.average_points = (playerData.total_points/playerData.total_games_played).toFixed(1);
      playerData.average_rebounds = (playerData.total_rebounds/playerData.total_games_played).toFixed(1);
      playerData.average_assists = (playerData.total_assists/playerData.total_games_played).toFixed(1);
      playerData.total_percentage = ((playerData.total_made_shots/playerData.total_shots)*100).toFixed(1);
      playerData.three_percentage = ((playerData.total_made_threes/playerData.total_threes_taken)*100).toFixed(1);
      playerData.average_turnover = (playerData.total_turnovers/playerData.total_games_played).toFixed(1);
    }
    this.setData({
      playerData: playerData
    })
  }
})