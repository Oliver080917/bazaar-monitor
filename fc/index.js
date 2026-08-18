// 阿里云函数计算（FC）入口
// 必须在本文件 require server/index 之前设置 IS_FC，用于跳过本地 app.listen 和定时任务
process.env.IS_FC = '1';

const serverless = require('serverless-http');
const app = require('../server/index');

exports.handler = serverless(app);
