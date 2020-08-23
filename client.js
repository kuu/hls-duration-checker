const DurationChecker = require('.');
const hlx = require('hlx-lib');
const validUrl = require('valid-url');

const srcUrl = process.argv[2];

if (!validUrl.isUri(srcUrl)) {
  throw new Error(`Invalid URL: ${srcUrl}`);
}

process.setMaxListeners(0);

hlx.src(srcUrl, {playlistOnly: true, noUriConversion: true})
  .pipe(new DurationChecker())
  .pipe(hlx.dest())
  .on('error', err => {
    console.error(err.stack);
  });
