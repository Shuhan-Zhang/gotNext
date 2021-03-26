// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
data:{

}
// 云函数入口函数
exports.main = async (event, context) => {
  return cloud.database().collection("teams").where({
      league_name: event.league,
      team_name: event.team
    }).get()




  // cloud.database().collection("teams").where({
  //   league_name: event.league,
  //   team_name: event.team
  // }).get().then(res=>{
  //   return{
  //     team_data: res.data[0]
  //   } 
  // }).catch(err=>{
  //   return err
  // })
  // cloud.database().collection("game").where({
  //   league_name: event.league,
  //   team_1: event.team
  // }).get().then(res=>{
  //   return{
  //     all_games: res.data
  //   } 
  // }).catch(err=>{
  //   return err
  // })
  // cloud.database().collection("game").where({
  //   league_name: event.league,
  //   team_2: event.team
  // }).get().then(res=>{
  //   all_games.push(res.data)
  // }).catch(err=>{
  //   return err
  // })
  // cloud.database().collection("players").where({
  //   league: event.league,
  //   team_name: event.team
  // }).get().then(res=>{
  //   all_players = res.data
  // }).catch(err=>{
  //   return err
  // })

  // return{
  //   all_players: all_players,
  //   all_games: all_games,
  //   team_data: team_data
  // }
}