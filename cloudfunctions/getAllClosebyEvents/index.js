// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "gotnext-7gc174phedbcfbb9"
})
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
  }

  return cloud.database().collection("event").where(_.and([
    {
    end_time: _.gte(new Date())
  },{
    end_time: _.lte(new Date().addHours(12))
  },
  {
    'location_specific.latitude': _.gte(event.userLatitude - 0.15),
    'location_specific.latitude': _.lte(event.userLatitude + 0.15)
  },
  {
    'location_specific.longitude': _.gte(event.userLongitude - 0.15),
    'location_specific.longitude': _.lte(event.userLongitude + 0.15)
  }
])).get()
}