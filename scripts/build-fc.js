// 打包 bazaar-fc.zip（阿里云 FC 部署包）
// 用 archiver：路径用正斜杠（Linux 可解压），bootstrap 带 0755 执行权限
const archiver = require('archiver');
const fs = require('fs');

const out = fs.createWriteStream('bazaar-fc.zip');
const archive = archiver('zip', { zlib: { level: 9 } });
out.on('close', () => console.log('done:', archive.pointer(), 'bytes'));
archive.on('error', (e) => { throw e; });
archive.pipe(out);

archive.file('bootstrap', { name: 'bootstrap', mode: 0o755 });
archive.file('index.js', { name: 'index.js' });
archive.file('package.json', { name: 'package.json' });
archive.file('package-lock.json', { name: 'package-lock.json' });
archive.directory('node_modules', 'node_modules');
archive.directory('server', 'server');
archive.directory('public', 'public');
archive.directory('data', 'data');

archive.finalize();
