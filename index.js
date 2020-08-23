const {Transform} = require('stream');
const timestamp = require('time-stamp');

function print(msg) {
  console.log(`${timestamp.utc('YYYY-MM-DD HH:mm:ss')} ${msg}`);
}

function printErr(msg) {
  console.error(`${timestamp.utc('YYYY-MM-DD HH:mm:ss')} ${msg}`);
}

function logInvalidSegment({uri: playlistUrl, targetDuration, source}, {uri: segmentUrl, duration}) {
  printErr('=== Violation: EXTINF duration exceeds #EXT-X-TARGETDURATION ===');
  printErr(`\tPlaylist URI: ${playlistUrl}`);
  printErr(`\tTargetDuration: ${targetDuration}`);
  printErr(`\tSegment URI: ${segmentUrl}`);
  printErr(`\tSegmentDuration: ${duration}`);
  printErr('--- Contents of .m3u8 file: Start ---');
  printErr(source);
  printErr('--- Contents of .m3u8 file: End ---');
}

function extractInvalidSegments(playlist) {
  const list = [];
  if (playlist.isMasterPlaylist) {
    return list;
  }
  for (const segment of playlist.segments) {
    if (Math.round(segment.duration) > playlist.targetDuration) {
      list.push(segment);
    }
  }
  return list;
}

class DurationChecker extends Transform {
  constructor() {
    super({objectMode: true});
    this.invalidSegments = new Set();
  }

  _transform(data, _, cb) {
    if (data.type === 'playlist') {
      const invalidSegments = extractInvalidSegments(data);
      for (const segment of invalidSegments) {
        if (!this.invalidSegments.has(segment.url)) {
          this.invalidSegments.add(segment.url);
          logInvalidSegment(data, segment);
        }
      }
      print(`Playlist checked: ${data.url}`);
    }
    cb(null, data);
  }
}

module.exports = DurationChecker;
