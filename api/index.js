// Vercel serverless 入口：把 Express app 导出给 Vercel 调用
const app = require('../server/index');

module.exports = app;
