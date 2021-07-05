// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "gotnext-7gc174phedbcfbb9"
})
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  cloud.database().collection("game").doc(event.actionRes.id).get()
  .then(res=>{
    var teamLeague = res.data.league_name;
    var teamWon = res.data.winner;
    var teamLost = res.data.loser;
    var team1GameStats = res.data.team_1_stats;
    var team1StatsKeys = Object.keys(team1GameStats);
    var team1Name = res.data.team_list[0];
    var team2GameStats = res.data.team_2_stats;
    var team2StatsKeys = Object.keys(team2GameStats);
    var team2Name = res.data.team_list[1];
    team1StatsKeys.forEach(v=>{
      var playerOpenID = v;
      var playerStat = JSON.stringify(team1GameStats[v]);
      cloud.callFunction({
        name: "updateTeamStats",
        data: {
          teamName : team1Name,
          teamLeague: teamLeague,
          teamStat: playerStat
        }
      }).then(res=>{
        console.log("successfully updated team stats",res)
      }).catch(err=>{
        console.log("failed to update team stats", err)
      })

      cloud.callFunction({
        name: "updatePlayerStats",
        data: {
          playerOpenID: playerOpenID,
          playerStat: playerStat
        }
      }).then(res=>{
        console.log("successfully updated player stats",res)
      }).catch(err=>{
        console.log("failed to update player stats", err)
      })
    })
    team2StatsKeys.forEach(v=>{
      var playerOpenID = v;
      var playerStat = JSON.stringify(team2GameStats[v]);
      cloud.callFunction({
        name: "updateTeamStats",
        data: {
          teamName : team2Name,
          teamLeague: teamLeague,
          teamStat: playerStat
        }
      }).then(res=>{
        console.log("successfully updated team stats",res)
      }).catch(err=>{
        console.log("failed to update team stats", err)
      })

      cloud.callFunction({
        name: "updatePlayerStats",
        data: {
          playerOpenID: playerOpenID,
          playerStat: playerStat
        }
      }).then(res=>{
        console.log("successfully updated player stats",res)
      }).catch(err=>{
        console.log("failed to update player stats", err)
      })
    })

    cloud.database().collection("teams").where({
      team_name: teamWon,
      league_name: teamLeague
    }).update({
      data:{
        win: _.inc(1)
      }
    }
  )
  cloud.database().collection("teams").where({
    team_name: teamLost,
    league_name: teamLeague
  }).update({
    data:{
      loss: _.inc(1)
    }
  }
)
  }).catch(err=>{
    console.log("failed",err)
  })
  
}