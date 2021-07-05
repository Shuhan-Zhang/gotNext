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
      total_assists: _.inc(teamStat.assist),
      total_points: _.inc(teamStat.point),
      total_rebounds: _.inc(teamStat.rebound),
      total_shots: _.inc(teamStat.miss + teamStat.makes),
      total_threes_taken: _.inc(teamStat.threePointMakes + teamStat.threePointMiss),
      total_made_shots: _.inc(teamStat.makes),
      total_made_threes: _.inc(teamStat.threePointMakes),
      total_turnovers: _.inc(teamStat.turnover),
      total_blocks: _.inc(teamStat.block),
      total_steals: _.inc(teamStat.steal)
    }
  })
}