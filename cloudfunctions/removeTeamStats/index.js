// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "gotnext-7gc174phedbcfbb9"
})
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  var teamName = event.teamName
  var teamStat = JSON.parse(event.teamStat);
  var teamLeague = event.teamLeague;
  cloud.database().collection("teams").where({
    team_name: teamName,
    league_name: teamLeague
  }).update({
    data:{
      total_assists: _.inc((teamStat.assist)*-1),
      total_points: _.inc((teamStat.point)*-1),
      total_rebounds: _.inc((teamStat.rebound)*-1),
      total_shots: _.inc((teamStat.miss + teamStat.makes)*-1),
      total_threes_taken: _.inc((teamStat.threePointMakes + teamStat.threePointMiss)*-1),
      total_made_shots: _.inc((teamStat.makes)*-1),
      total_made_threes: _.inc((teamStat.threePointMakes)*-1),
      total_turnovers: _.inc((teamStat.turnover)*-1),
      total_blocks: _.inc((teamStat.block)*-1),
      total_steals: _.inc((teamStat.steal)*-1)
    }
  })
}