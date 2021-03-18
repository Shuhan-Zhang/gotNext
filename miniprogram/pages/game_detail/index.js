var getDate = require('../../getDate.js');
Page({

  data: {
    game:{},
    marker:[],
    point:[],
    team1:{},
    team2:{}
  },

  onLoad: function (options) {
    var id = options.id;
    this.getGame(id);
  },
  getGame(gameID){
    wx.cloud.database().collection("game").doc(gameID).get()
    .then(res=>{
      console.log("data pulled successfully",res);
      res.data.written_time = getDate.formatTime(new Date(res.data.time));
      res.data.specific_time = getDate.formatSpecific(new Date(res.data.time));
      this.setLocation(res.data);
      this.getLeagueInfo(res.data.league, res.data.team_1, res.data.team_2);
      this.setData({
        game: res.data
      })
    }).catch(err=>{
      console.log("failed to pull data",err);
    })
  },
  setLocation(event){
    var user_location = wx.getStorageSync('user_location');
    var user_latitude = user_location.latitude;
    var user_longitude = user_location.longitude;
    var final_markers = [];
    var final_points = [];
    final_markers.push(
      {
        id:0,
        latitude:user_latitude,
        longitude:user_longitude,
        iconPath:"../../img/index/定位.png",
        width:35,
        height:35
      },
      {
        id:1,
        latitude:event.location_specific.latitude,
        longitude:event.location_specific.longitude,
        iconPath:event.img,
        width:35,
        height:35
      }
    )
    final_points.push(
      {
        longitude:user_longitude,
        latitude:user_latitude
      },
      {
        longitude:event.location_specific.longitude,
        latitude:event.location_specific.latitude
      }
    )
    this.setMap(final_points);
    this.setData({
      points:final_points,
      marker:final_markers
    })
  },
  setMap(point_list){
    var map = wx.createMapContext('12345', this);
    map.includePoints(
      {
        points:point_list,
        success(res){
          console.log(res);
        },
        fail(err){
          console.log(err);
        }
      }
    )
  },
  getLeagueInfo(league, team1, team2){
    wx.cloud.database().collection("teams").where({
      team_name:team1,
      league_name: league
    }).get()
    .then(res => {
      this.setData({
        team1: res.data[0]
      })
    }).catch(err => {
      console.log("failed to pull data",err);
    })
    wx.cloud.database().collection("teams").where({
      team_name:team2,
      league_name: league
    }).get()
    .then(res => {
      this.setData({
        team2: res.data[0]
      })
    }).catch(err => {
      console.log("failed to pull data",err);
    })
  },

})