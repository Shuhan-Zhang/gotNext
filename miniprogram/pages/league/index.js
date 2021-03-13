Page({

  data: {
    allGames:[],
    pastGames:[],
    upcomingGames:[],
    allTeamNames:[],
    allTeamData:[],
    league:"U16"
  },
  onLoad: function (options) {
    this.getAllGames()
  },
  //setup functions start
  getAllGames(e){
    var all_games = wx.getStorageSync('allGames');
    var today = wx.getStorageSync('today');
    var finishedGames = [];
    var upcomingGames = [];
    var finalTeams = [];
    all_games.forEach(v=>{
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
    this.getLeagueInfo("U16", finalTeams);
    this.setData({
      allGames: all_games,
      pastGames: finishedGames,
      upcomingGames: upcomingGames,
      allTeamNames: finalTeams
    })
  },
  getLeagueInfo(league, team_list){
    var final_list = []
    team_list.forEach(v=>{
      wx.cloud.database().collection("teams").where({
        league_name:league,
        team_name:v
      }).get()
      .then(res => {
        final_list.push(res.data[0])
      }).catch(err => {
        console.log("failed to pull data",err);
      })
    })
    console.log(final_list)
      this.setData({
        allTeamData: final_list
      })
    // wx.cloud.database().collection("teams").where({
    //   league_name:league,
    //   team_name:team
    // }).get()
    // .then(res => {
    //   this.setData({
    //     [team]:res.data[0]
    //   })
    // }).catch(err => {
    //   console.log("failed to pull data",err);
    // })
  },
  //setup functions end
  //button functions start
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
  //button functions end
})