// EdgeOne Makers Cloud Function 入口
// 承载既有 Express 应用，处理 /api/* 请求；前端静态文件由 Pages 静态托管优先服务
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// 复用 serverless 守卫：跳过 app.listen 和后台定时任务（server/index.js 检查该变量）
process.env.IS_FC = '1';

const app = require('../../server/index.js');

export default app;
