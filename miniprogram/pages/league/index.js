const app = getApp();
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
    unclickedButtonColor:"#ffb38e",
    isShowUserName: false,
    userInfo: null,
    userStatus:0,
    userTeamInfo:{}
  },
  onLoad: function (options) {
    this.processAllGames();
    this.getPlayers();
    this.getTeamData();
    this.processTeams();
    this.getLeagues();
    this.getUserStatus();
    this.getUserPlayerInfo();
  },
  onShow() {
    var user = app.globalData.userInfo;
    if (user && user.nickName) {
      this.setData({
        isShowUserName: true,
        userInfo: user,
      })
    }
  },
  //LOAD DATA FUNCTIONS START
  getPlayers(){
    wx.cloud.database().collection("players").where({
      league:this.data.league
    }).get()
    .then(res => {
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
  getUserPlayerInfo(){
    try{
      var userId = wx.getStorageSync('openid');
      wx.cloud.database().collection("players").where({
        player_id : userId
      }).get()
      .then(res => {
        var userTeam = res.data.team_name;
        this.getUserTeam(userTeam);
      }).catch(err => {
        console.log("failed to pull data",err);
      })
    }catch{
      console.log("user not logged in");
    }
  },
  getUserTeam(team){
    var userTeam = team;
    wx.cloud.database().collection("teams").where({
      team_name : userTeam
    }).get().then(res=>{
      // this.setData({
      //   userTeamInfo: res.data[0]
      // })
      let teamInfo = res.data[0];
      this.processTeamInfo(teamInfo);
    }).catch(err=>{
      console.log("error fetching user team",err);
    })
  },
  getUserStatus(){
    var userStatus = wx.getStorageSync('userStatus');
    this.setData({
      userStatus: userStatus
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
        v.average_points_string = (v.total_points/v.total_games_played).toFixed(1);
        v.average_rebounds_string = (v.total_rebounds/v.total_games_played).toFixed(1);
        v.average_assists_string = (v.total_assists/v.total_games_played).toFixed(1);
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
    this.setData({
      userTeamInfo: teamData
    })
  },
  //PROCESS DATA FUNCTIONS END

  //BUTTON FUNCTIONS START
  login(e){
    console.log('用户信息', e)
    if (e.detail.userInfo) {
      var user = e.detail.userInfo;
      this.setData({
        isShowUserName: true,
        userInfo: e.detail.userInfo,
      })
      user.openid = app.globalData.openid;
      app._saveUserInfo(user);
    } else {
      app.showErrorToastUtils('登陆需要允许授权');
    }
  },
  changeLeague(e){
    console.log(e);
    this.setData({
      league:e.currentTarget.dataset.league
    })
    this.onLoad();
  },
  registerUser(e){
    wx.navigateTo({
      url:"/pages/player_form/index?openid=" + e.currentTarget.dataset.openid
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
  pastGameNavigator(e){
    wx.navigateTo({
      url:"/pages/item_list/index?function=getPastGames&league=" + e.currentTarget.dataset.league
    })
  },
  //BUTTON FUNCTIONS END
})