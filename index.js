const {Transform} = require('stream');
const hlx = require('hlx-lib');

const srcUrl = process.argv[2];

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
        if (segment.duration > targetDuration) {
          console.error('=== Vioration: Duration exceeds #EXT-X-TARGETDURATION ===');
          console.error(`\tPlaylist URI: ${data.uri}`);
          console.error(`\tTargetDuration: ${targetDuration}`);
          console.error(`\tSegment URI: ${segment.uri}`);
          console.error(`\tDuration: ${segment.uri}`);
        }
      }
    }
    cb(null, data);
  }
}

hlx.src(srcUrl, {playlistOnly: true})
  .pipe(new DurationChecker())
  .pipe(hlx.dest())
  .on('error', err => {
    console.error(err.stack);
  });
