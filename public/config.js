// 后端 API 地址配置（前后端分离部署用）
// 默认空字符串 = 同源：前端和 API 在同一个域名/端口（本地 npm start 或前后端都在朋友服务器上）。
//
// 分离部署时改成朋友服务器的地址，例如：
//   window.API_BASE = 'https://api.你的域名.com';
//
// ⚠️ 重要：如果前端放在 https 的 GitHub Pages 上，后端必须是 https，
//    否则浏览器会拦截「混合内容」请求（https 页面请求 http 接口）。
window.API_BASE = '';
