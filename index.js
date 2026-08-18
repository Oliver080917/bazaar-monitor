// 阿里云函数计算（FC）HTTP 函数入口（部署包根目录）
process.env.IS_FC = '1';

const app = require('./server/index');

// FC 的 req/res 不是完整的 Node EventEmitter，缺 listeners 等方法，
// Express 收尾（finalhandler/unpipe）会调用，这里补上
function patchStream(obj) {
  if (obj && typeof obj.listeners !== 'function') {
    obj.listeners = function () { return []; };
    obj.addListener = obj.addListener || function () { return obj; };
    obj.removeListener = obj.removeListener || function () { return obj; };
    obj.removeAllListeners = obj.removeAllListeners || function () { return obj; };
    obj.once = obj.once || function () { return obj; };
    obj.emit = obj.emit || function () { return false; };
  }
}

exports.handler = (req, res) => {
  patchStream(req);
  patchStream(res);
  app(req, res);
};
