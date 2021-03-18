var getDate = require('../../getDate.js');
Page({

  data: {
    event:{},
    marker:[],
    points:[]
  },
  onLoad: function (options) {
    var id=options.id;
    this.getEvent(id);
  },
  getEvent(eventID){
    wx.cloud.database().collection("event").doc(eventID).get()
    .then(res=>{
      console.log("data pulled successfully",res);
      res.data.written_time = getDate.formatTime(new Date(res.data.time));
      res.data.specific_time = getDate.formatSpecific(new Date(res.data.time));
      this.setLocation(res.data);
      this.setData({
        event: res.data
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
    var map = wx.createMapContext('1234', this);
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
  setTime(data){
    var loaded_events = data;
    loaded_events.written_time = getDate.formatTime(new Date(v.time));
    loaded_events.specific_time = getDate.formatSpecific(new Date(v.time));
    this.setData({
      event: loaded_events
    })
  }
})