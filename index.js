const fs = require('fs');
const path = require('path');
const {URL} = require('url');
const {Transform} = require('stream');
const hlx = require('hlx-lib');
const validUrl = require('valid-url');
const timestamp = require('time-stamp');
const fetch = require('node-fetch');
const date = require('date-and-time');

const {DEBUG} = process.env;
console.log(`DEBUG=${DEBUG}`);

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
    this.invalidSegments = new Set();
    this.dirPath = `${__dirname}/${createTmpDir(__dirname)}`;
    this.debugFlag = false;
    this._scheduleDebug(10);
  }

  _scheduleDebug(nSecLater) {
    if (!DEBUG) {
      return;
    }
    setTimeout(() => {
      this.debugFlag = true;
    }, nSecLater * 1000);
  }

  _checkDebug({segments, targetDuration}) {
    if (!this.debugFlag) {
      return;
    }
    segments[0].duration = targetDuration * 2;
    this.debugFlag = false;
    this._scheduleDebug(targetDuration * segments.length);
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

  _logInvalidSegment({uri: playlistUrl, targetDuration, source}, {uri: segmentUrl, duration}) {
    if (this.invalidSegments.has(segmentUrl)) {
      return;
    }
    this.invalidSegments.add(segmentUrl);
    printErr('=== Violation: EXTINF duration exceeds #EXT-X-TARGETDURATION ===');
    printErr(`\tPlaylist URI: ${playlistUrl}`);
    printErr(`\tTargetDuration: ${targetDuration}`);
    printErr(`\tSegment URI: ${segmentUrl}`);
    printErr(`\tSegmentDuration: ${duration}`);
    printErr('--- Contents of .m3u8 file: Start ---');
    printErr(source);
    printErr('--- Contents of .m3u8 file: End ---');
    this._storeVariants('_invalid-duration').then(filePath => {
      printErr(`All .m3u8 file are stored at: ${filePath}\n`);
    });
  }

  _transform(data, _, cb) {
    if (data.type === 'playlist') {
      const playlist = data;
      if (playlist.isMasterPlaylist) {
        print(`Loading master playlist.`);
        print(`\tURI: ${playlist.uri}`);
        this._extractVariantUrls(playlist);
      } else {
        print(`Loading media playlist.`);
        print(`\tURI: ${playlist.uri}`);
        this._checkDebug(playlist);
        for (const segment of playlist.segments) {
          if (Math.round(segment.duration) > playlist.targetDuration) {
            this._logInvalidSegment(playlist, segment);
          }
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
