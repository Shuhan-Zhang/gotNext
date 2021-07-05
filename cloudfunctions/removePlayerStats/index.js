// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "gotnext-7gc174phedbcfbb9"
})
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  var playerOpenID = event.playerOpenID
  var playerStat = JSON.parse(event.playerStat);
  cloud.database().collection("players").where({
    player_id: playerOpenID
  }).update({
    data:{
      total_assists: _.inc((playerStat.assist)*-1),
      total_games_played: _.inc(-1),
      total_shots: _.inc((playerStat.miss + playerStat.makes)*-1),
      total_threes_taken: _.inc((playerStat.threePointMakes + playerStat.threePointMiss_*-1)),
      total_made_shots: _.inc((playerStat.makes)*-1),
      total_made_threes: _.inc((playerStat.threePointMakes)*-1),
      total_points: _.inc((playerStat.point)*-1),
      total_rebounds: _.inc((playerStat.rebound)*-1),
      total_turnovers: _.inc((playerStat.turnover)*-1),
      total_blocks: _.inc((playerStat.block)*-1),
      total_steals: _.inc((playerStat.steal)*-1)
    }
  })
}