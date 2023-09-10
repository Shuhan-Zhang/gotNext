const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const res = await cloud.cloudPay.unifiedOrder({
    "body" : "GotNext接波", //商品名称/描述
    "outTradeNo" : event.outTradeNo, //订单号(唯一)
    "spbillCreateIp" : "127.0.0.1", //后台终端
    "subMchId" : "1602234522", //商户号****
    "totalFee" : event.price * 100, //支付金额,单位分
    "envId": "gotnext-7gc174phedbcfbb9", //环境id
    "functionName": "pay_cb", //回调函数名称
  })
  return res
}