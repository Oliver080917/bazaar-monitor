// 阿里云函数计算（FC）HTTP 函数入口
// HTTP 函数的 handler 签名是 (req, res, context)，req/res 是 Node 兼容对象
process.env.IS_FC = '1';

const app = require('../server/index');

exports.handler = (req, res) => {
  app(req, res);
};
