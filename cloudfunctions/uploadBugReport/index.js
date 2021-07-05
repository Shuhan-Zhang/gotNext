// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: "gotnext-7gc174phedbcfbb9"
})

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.database().collection("bugReport").add({
    data:{
      content: event.content
  }})
}