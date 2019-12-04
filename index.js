const {Transform} = require('stream');
const hlx = require('hlx-lib');
const validUrl = require('valid-url');
const timestamp = require('time-stamp');

const srcUrl = process.argv[2];

if (!validUrl.isUri(srcUrl)) {
  throw new Error(`Invalid URL: ${srcUrl}`);
}

function print(msg) {
  console.log(`${timestamp.utc('YYYY-MM-DD HH:mm:ss')} ${msg}`);
}

function printErr(msg) {
  console.error(`${timestamp.utc('YYYY-MM-DD HH:mm:ss')} ${msg}`);
}

class DurationChecker extends Transform {
  constructor() {
    super({objectMode: true});
  }

  _transform(data, _, cb) {
    if (data.type === 'playlist') {
      if (data.isMasterPlaylist) {
        print(`Loading master playlist.`);
        print(`\tURI: ${data.uri}`);
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
