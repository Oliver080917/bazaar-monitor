// 阿里云函数计算（FC）HTTP 函数入口（部署包根目录）
// 注意：server/ 与 index.js 同级，必须用 ./server/index
process.env.IS_FC = '1';

const app = require('./server/index');

exports.handler = (req, res) => {
  app(req, res);
};
