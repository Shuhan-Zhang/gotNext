Page({

  data: {
    allTeamData:[],
    leagueOnlyTeamData:[],
    leagueOnlyGames:[],
    allPlayerData:[],
    allGames:[],
    pastGames:[],
    upcomingGames:[],
    league:"U16",
    pointLeader:{},
    reboundLeader:{},
    assistLeader:{},
    allLeagues:[],
    clickedButtonColor:"#FF784B",
    unclickedButtonColor:"#ffb38e"
  },
  onLoad: function (options) {
    this.processAllGames();
    this.getPlayers();
    this.getTeamData();
    this.processTeams();
    this.getLeagues();
  },

  //LOAD DATA FUNCTIONS START
  getPlayers(){
    wx.cloud.database().collection("players").where({
      league:this.data.league
    }).get()
    .then(res => {
      // this.setData({
      //   allPlayerData: res.data
      // })
      this.processPlayers(res.data);
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getTeamData(){
    var teams = wx.getStorageSync('allTeams');
    this.setData({
      allTeamData: teams
    })
  },
  getLeagues(){
    wx.cloud.database().collection("league").get()
    .then(res => {
      this.setData({
        allLeagues: res.data
      })
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  //LOAD DATA FUNCTIONS END

  //PROCESS DATA FUNCTIONS START
  processAllGames(e){
    var all_games = wx.getStorageSync('allGames');
    var today = wx.getStorageSync('today');
    var league_games = []
    var finishedGames = [];
    var upcomingGames = [];
    var finalTeams = [];
    all_games.forEach(v=>{
      if(v.league_name == this.data.league){
        league_games.push(v);
      }
    })
    
    league_games.forEach(v=>{
      if(!finalTeams.includes(v.team_1)){
        finalTeams.push(v.team_1)
      }
      if (!finalTeams.includes(v.team_2)){
        finalTeams.push(v.team_2)
      }
      if(!v.team_1_score && Date.parse(v.time) > Date.parse(today)){
        upcomingGames.push(v);
      }else if(v.team_1_score){
        finishedGames.push(v);
      }
    }) 

    finishedGames.sort(function(a, b) {
      var value1 = Date.parse(a.time);
      var value2 = Date.parse(b.time);
      return value2 - value1;
    })
    upcomingGames.sort(function(a, b) {
      var value1 = Date.parse(a.time);
      var value2 = Date.parse(b.time);
      return value1 - value2;
    })
    this.setData({
      allGames: all_games,
      pastGames: finishedGames,
      upcomingGames: upcomingGames,
      leagueOnlyGames: league_games
    })
  },
  processPlayers(data){
    if(data.length == 0){
      players = data;
      points_leader = false;
      assists_leader = false;
      rebounds_leader = false;
      this.setData({
        allPlayerData:players,
        pointLeader:points_leader,
        assistLeader:assists_leader,
        reboundLeader:rebounds_leader
      })
    }else{
      var players = data;
      players.forEach(v=>{
        v.average_points = v.total_points/v.total_games_played
        v.average_rebounds = v.total_rebounds/v.total_games_played
        v.average_assists = v.total_assists/v.total_games_played
        v.average_points_string = (v.total_points/v.total_games_played).toFixed(2);
        v.average_rebounds_string = (v.total_rebounds/v.total_games_played).toFixed(2);
        v.average_assists_string = (v.total_assists/v.total_games_played).toFixed(2);
      })
      players.sort(function(first, second) {
        return second.average_points - first.average_points;
       });
       var points_leader = players[0]
       players.sort(function(first, second) {
        return second.average_assists - first.average_assists;
       });
       var assists_leader = players[0]
       players.sort(function(first, second) {
        return second.average_rebounds - first.average_rebounds;
       });
       var rebounds_leader = players[0]
      this.setData({
        allPlayerData:players,
        pointLeader:points_leader,
        assistLeader:assists_leader,
        reboundLeader:rebounds_leader
      })
    }
  },
  processTeams(){
    var all_teams = wx.getStorageSync('allTeams');
    var league_teams = []
    all_teams.forEach(v=>{
      if(v.league_name == this.data.league){
        league_teams.push(v);
      }
    })
    league_teams.sort(function(first, second) {
      return second.win - first.win;
     });
    this.setData({
      leagueOnlyTeamData: league_teams
    })
  },
  //PROCESS DATA FUNCTIONS END

  //BUTTON FUNCTIONS START
  login(e){
    wx.login({
      timeout: 3000
    }).then(res=>{
      console.log("successful login", res);
      wx.getUserInfo({
      }).then(res=>{
        console.log("successfully got user info", res);
      }).catch(err=>{
        console.log("faield to get user info", err);
      })
    }).catch(err=>{
      console.log("login failed",err);
    })
  },
  changeLeague(e){
    console.log(e);
    this.setData({
      league:e.currentTarget.dataset.league
    })
    this.onLoad();
  },
  gameNavigator(e){
    wx.navigateTo({
      url:"/pages/game_detail/index?id=" + e.currentTarget.dataset.id
    })
  }
  //BUTTON FUNCTIONS END
})