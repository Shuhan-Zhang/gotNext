// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.database().collection("players").add({
    data:{      
      MVP_number: 0,
      ROY_number: 0,
      assist_champion_number: 0,
      challenge_event_reward_number:0,
      other_reward_number: 0,
      rebound_champion_number: 0,
      rings: 0,
      scoring_champion_number: 0,
      social_event_number: 0,
      solo_event_reward_number: 0,
      team_event_reward_number: 0,
      total_assists: 0,
      total_games_played: 0,
      total_made_shots: 0,
      total_points: 0,
      total_rebounds: 0,
      total_shots: 0,
      total_turnovers: 0,
      league: "",
      team_name: "",
      weight: event.finalWeight,
      player_id: event.finalID,
      height: event.finalHeight,
      player_name: event.finalName,
      player_pic: event.finalProfileImage,
      position: event.finalPosition,
      age: event.finalAge
  }})
}