#!/usr/bin/env node
// Serves src/ as real, unbundled ES modules (the shell page with <script type="module" src="/main.js">) on http://127.0.0.1:PORT/
// so the import/export graph can be checked exactly as a browser loads it. Usage: node tools/serve-esm.js [port]
const http = require('http'), fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src'), port = +process.argv[2] || 5199;
// the shell is read on every request, so edits show up without restarting
const shellOf = () => fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8').replace('/*@@FONTS@@*/', () => require('./fonts')()).replace('<script>\n/*@@MAIN@@*/\n</script>', '<script type="module" src="/main.js"></script>');
if (!shellOf().includes('src="/main.js"')) throw new Error('shell marker not found');
http.createServer((q, r) => {
  const u = q.url.split('?')[0];
  if (u === '/' || u === '/index.html') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end(shellOf()); }
  if (u === '/sw.js') { r.writeHead(200, { 'content-type': 'text/javascript' }); return r.end('// no service worker in the dev server: the page registers one, and a missing script is a console error'); }
  const f = path.join(SRC, path.normalize(u));
  if (!f.startsWith(SRC) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  const body = f === path.join(SRC, 'data', 'templates.js') ? require('./templates/folders').withFolders(fs.readFileSync(f, 'utf8')) : fs.readFileSync(f);   // the templates/ folders join the built-in list
  r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); r.end(body);
}).listen(port, '127.0.0.1', () => console.log('serving src/ as ES modules on http://127.0.0.1:' + port + '/'));
