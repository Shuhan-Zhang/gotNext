var getDate = require('../../getDate.js');
Page({
  data: {
    itemList:[],
    backgroundColor:"#FF5400",
    titleText:"列表"
  },
  onLoad: function (options) {
    switch(options.function) {
      case "getAllCloseby":
        this.getAllCloseby();
        this.setData({
          backgroundColor:"#FF5400",
          titleText:"附近活动/比赛"
        })
        break
      case "getAllRecent":
        this.getAllRecent();
        this.setData({
          backgroundColor:"#FF2E2E",
          titleText:"最近活动/比赛"
        })
        break
      case "getPastGames":
        this.getPastGames(options.league);
        this.setData({
          backgroundColor:"#FF5400",
          titleText:"最新比赛"
        })
        break
      case "getPersonalEvents":
        this.getPersonalEvents();
        this.setData({
          backgroundColor:"#FF5400",
          titleText:"个人活动"
        })
        break
      case "getTeamEvents":
        this.getTeamEvents();
        this.setData({
          backgroundColor:"#147CE5",
          titleText:"团队活动"
        })
        break
      case "getChallengeEvents":
        this.getChallengeEvents();
        this.setData({
          backgroundColor:"#51976A",
          titleText:"挑战活动"
        })
        break
      case "getSocialEvents":
        this.getSocialEvents();
        this.setData({
          backgroundColor:"#DA463C",
          titleText:"社交活动"
        })
        break
      case "getNearbyEvents":
        this.getNearbyEvents();
        this.setData({
          backgroundColor:"#FF5400",
          titleText:"附近活动"
        })
        break
      default:
        console.log("error loading item list");
    }
  },
  //actual functions used
  getAllCloseby(){
    this.setData({
      itemList: wx.getStorageSync('close_by')
    })
  },
  getAllRecent(){
    this.setData({
      itemList: wx.getStorageSync('recent')
    })
  },
  getPastGames(league){
    var league = league
    wx.cloud.database().collection("game").where({
      league_name: league
    }).get()
    .then(res => {
      this.processFinishedGames(res.data);
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getPersonalEvents(){
    wx.cloud.database().collection("event").where({
      category: "个人"
    }).get()
    .then(res => {
      this.processEventTime(res.data)
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getTeamEvents(){
    wx.cloud.database().collection("event").where({
      category: "团队"
    }).get()
    .then(res => {
      this.processEventTime(res.data)
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getChallengeEvents(){
    wx.cloud.database().collection("event").where({
      category: "挑战"
    }).get()
    .then(res => {
      this.processEventTime(res.data)
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getSocialEvents(){
    wx.cloud.database().collection("event").where({
      category: "社交"
    }).get()
    .then(res => {
      this.processEventTime(res.data)
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },
  getNearbyEvents(){
    var allNearby = wx.getStorageSync('close_by');
    var nearbyEvents = [];
    allNearby.forEach(v=>{
      if(v.category.includes("活动")){
        nearbyEvents.push(v);
      }
    })
    this.setData({
      itemList: nearbyEvents
    })
  },

  //process functions
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
      itemList: gameList
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
      itemList: gameList
    })
  },
  playerNavigator(e){
    wx.navigateTo({
      url:"/pages/player_card/index?openid=" + e.currentTarget.dataset.id
    })
  },
  processEventTime(data){
    var loaded_events = data;
    loaded_events.forEach(v=>{
      v.written_time = getDate.formatTime(new Date(v.time));
      v.specific_time = getDate.formatSpecific(new Date(v.time));
    })
    this.setData({
      itemList: loaded_events
    })
  },

  //button functions
  rowNavigator(e){
    //转到game_detail或者event_detail页面
    if(e.currentTarget.dataset.category.includes("活动")){
      wx.navigateTo({
        url:"/pages/event_detail/index?id=" + e.currentTarget.dataset.id
      })
    }else{
      wx.navigateTo({
        url:"/pages/game_detail/index?id=" + e.currentTarget.dataset.id
      })
    }
  },
})