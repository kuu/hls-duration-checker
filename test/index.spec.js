const test = require('ava');
const HLS = require('hls-parser');
const DurationChecker = require('..');

test.cb('index.masterPlaylist', t => {
  const playlist = HLS.parse(`
    #EXTM3U
    #EXT-X-STREAM-INF:BANDWIDTH=1280000,AUDIO="audio"
    /video/main.m3u8
    #EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="en",DEFAULT=YES,URI="/audio/en.m3u8"
  `);
  const checker = new DurationChecker();
  checker.write(playlist, () => {
    t.is(checker.invalidSegments.size, 0);
    t.end();
  });
});

test.cb('index.mediaPlaylist.valid', t => {
  const playlist = HLS.parse(`
    #EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXTINF:9.9,
    http://example.com/1
    #EXTINF:10.4,
    http://example.com/2
  `);
  const checker = new DurationChecker();
  checker.write(playlist, () => {
    t.is(checker.invalidSegments.size, 0);
    t.end();
  });
});

test.cb('index.mediaPlaylist.invalid', t => {
  const playlist = HLS.parse(`
    #EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXTINF:9.9,
    http://example.com/1
    #EXTINF:10.6,
    http://example.com/2
  `);
  const checker = new DurationChecker();
  checker.write(playlist, () => {
    t.is(checker.invalidSegments.size, 1);
    t.end();
  });
});
