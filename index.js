const {Transform} = require('stream');
const hlx = require('hlx-lib');
const validUrl = require('valid-url');

const srcUrl = process.argv[2];

if (!validUrl.isUri(srcUrl)) {
  throw new Error(`Invalid URL: ${srcUrl}`);
}

class DurationChecker extends Transform {
  constructor() {
    super({objectMode: true});
  }

  _transform(data, _, cb) {
    if (data.type === 'playlist') {
      if (data.isMasterPlaylist) {
        console.log(`Loading master playlist.`);
        console.log(`\tURI: ${data.uri}`);
        return cb(null, data);
      }
      console.log(`Loading media playlist.`);
      console.log(`\tURI: ${data.uri}`);
      const {targetDuration} = data;
      for (const segment of data.segments) {
        if (Math.round(segment.duration) > targetDuration) {
          console.error('=== Violation: EXTINF duration exceeds #EXT-X-TARGETDURATION ===');
          console.error(`\tPlaylist URI: ${data.uri}`);
          console.error(`\tTargetDuration: ${targetDuration}`);
          console.error(`\tSegment URI: ${segment.uri}`);
          console.error(`\tSegmentDuration: ${segment.duration}`);
          console.error('--- Contents of .m3u8 file: Start ---');
          console.error(data.source);
          console.error('--- Contents of .m3u8 file: End ---');
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
