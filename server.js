const http = require('http');
const {Writable} = require('stream');
const {unzipSync} = require('zlib');
const HLS = require('hls-parser');
const DurationChecker = require('.');

const port = process.env.PORT || 8080;

console.log(`port = ${port}`);

const checker = new DurationChecker();

class Terminator extends Writable {
  constructor() {
    super({objectMode: true});
  }

  _write(chunk, encoding, cb) {
    setImmediate(cb);
  }
}

checker.pipe(new Terminator());

function isPlaylistPutRequest(request = {}) {
  const method = request.method;
  if (method !== 'PUT') {
    return false;
  }
  const type = request.headers['content-type'];
  if (type === 'application/vnd.apple.mpegurl' || type === 'audio/mpegurl') {
    return true;
  }
  const url = request.url;
  if (typeof url === 'string' && url.includes('.m3u8')) {
    return true;
  }
  return false;
}

http.createServer((req, res) => {
  // console.log(`Incoming message: ${req.url}`);
  const needUnzip = req.headers['content-encoding'] === 'gzip';
  if (isPlaylistPutRequest(req)) {
    const body = [];
    req.on('data', chunk => {
      if (needUnzip) {
        chunk = unzipSync(chunk);
      }
      body.push(chunk);
    }).on('end', () => {
      const text = Buffer.concat(body).toString();
      const playlist = HLS.parse(text);
      playlist.url = req.url;
      checker.write(playlist);
    });
  }
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello!');
}).listen(port);

console.log(`HTTP server listening on port ${port}`);
