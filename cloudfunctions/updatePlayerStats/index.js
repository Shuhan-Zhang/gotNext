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
      total_assists: _.inc(playerStat.assist),
      total_games_played: _.inc(1),
      total_shots: _.inc(playerStat.miss + playerStat.makes),
      total_threes_taken: _.inc(playerStat.threePointMakes + playerStat.threePointMiss),
      total_made_shots: _.inc(playerStat.makes),
      total_made_threes: _.inc(playerStat.threePointMakes),
      total_points: _.inc(playerStat.point),
      total_rebounds: _.inc(playerStat.rebound),
      total_turnovers: _.inc(playerStat.turnover),
      total_blocks: _.inc(playerStat.block),
      total_steals: _.inc(playerStat.steal)
    }
  })
}