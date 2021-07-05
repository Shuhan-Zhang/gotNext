// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "gotnext-7gc174phedbcfbb9"
})

const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  cloud.database().collection("game").doc(event.gameID).update({
    data:{
      participant_list: _.addToSet(event.playerID)
    }
  })
}