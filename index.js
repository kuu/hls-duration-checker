const fs = require('fs');
const path = require('path');
const {URL} = require('url');
const {Transform} = require('stream');
const hlx = require('hlx-lib');
const validUrl = require('valid-url');
const timestamp = require('time-stamp');
const fetch = require('node-fetch');
const date = require('date-and-time');

const srcUrl = process.argv[2];

if (!validUrl.isUri(srcUrl)) {
  throw new Error(`Invalid URL: ${srcUrl}`);
}

process.setMaxListeners(0);

function print(msg) {
  console.log(`${timestamp.utc('YYYY-MM-DD HH:mm:ss')} ${msg}`);
}

function printErr(msg) {
  console.error(`${timestamp.utc('YYYY-MM-DD HH:mm:ss')} ${msg}`);
}

function createTmpDir(root, suffix = '') {
  const dirName = `${date.format(new Date(), 'YYYY-MM-DD_HHmmss', true)}${suffix}`;
  fs.mkdirSync(`${root}/${dirName}`, {recursive: true});
  return dirName;
}

function resolveUrl(url, relativePath) {
  const base = new URL(url);
  base.pathname = path.resolve(base.pathname, relativePath);
  return base.href;
}

function storeVariantData(dirPath, uri) {
  const url = new URL(uri);
  const fileName = path.basename(url.pathname);
  const filePath = path.resolve(dirPath, fileName);
  return fetch(uri)
    .then(res => res.text())
    .then(data => {
      fs.writeFileSync(filePath, data);
    })
    .catch(err => err.stack);
}

class DurationChecker extends Transform {
  constructor() {
    super({objectMode: true});
    this.variantUrls = [];
    this.dirPath = `${__dirname}/${createTmpDir(__dirname)}`;
  }

  _extractVariantUrls({uri: baseUri, variants}) {
    this.variantUrls = [];
    for (const variant of variants) {
      this.variantUrls.push(resolveUrl(baseUri, variant.uri));
    }
  }

  _storeVariants(suffix) {
    const dirPath = `${this.dirPath}/${createTmpDir(this.dirPath, suffix)}`;
    const promiseList = [];
    for (const uri of this.variantUrls) {
      const promise = storeVariantData(dirPath, uri);
      promiseList.push(promise);
    }
    return Promise.all(promiseList).then(() => dirPath);
  }

  _transform(data, _, cb) {
    if (data.type === 'playlist') {
      if (data.isMasterPlaylist) {
        print(`Loading master playlist.`);
        print(`\tURI: ${data.uri}`);
        this._extractVariantUrls(data);
        return cb(null, data);
      }
      print(`Loading media playlist.`);
      print(`\tURI: ${data.uri}`);
      const {targetDuration} = data;
      for (const segment of data.segments) {
        if (Math.round(segment.duration) > targetDuration) {
          printErr('=== Violation: EXTINF duration exceeds #EXT-X-TARGETDURATION ===');
          printErr(`\tPlaylist URI: ${data.uri}`);
          printErr(`\tTargetDuration: ${targetDuration}`);
          printErr(`\tSegment URI: ${segment.uri}`);
          printErr(`\tSegmentDuration: ${segment.duration}`);
          printErr('--- Contents of .m3u8 file: Start ---');
          printErr(data.source);
          printErr('--- Contents of .m3u8 file: End ---');
          this._storeVariants('_invalid-duration').then(filePath => {
            printErr(`All .m3u8 file are stored at: ${filePath}`);
          });
        }
      }
    }
    cb(null, data);
  }
}

hlx.src(srcUrl, {playlistOnly: true, noUriConversion: true})
  .pipe(new DurationChecker())
  .pipe(hlx.dest())
  .on('error', err => {
    console.error(err.stack);
  });
