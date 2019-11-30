# hls-duration-checker
A command line tool to monitor HLS playlists and check if there's any violation of [the target duration rule](https://tools.ietf.org/html/rfc8216#section-4.3.3.1):

> The EXTINF duration of each Media Segment in the Playlist file, when rounded to the nearest integer, MUST be less than or equal to the target duration; longer segments can trigger playback stalls or other errors.



## Install
You need `git`[and the latest node](https://nodejs.org/en/)
```
$ git clone https://github.com/kuu/hls-duration-checker.git
$ cd hls-duration-checker
```

## Run
### Start
Specify a URL of a master or media playlist file
```
$ npm start http://example.com/master.m3u8
```
### Stop
```
$ npm stop
```

## Check the output
### To see the file download logs
```
$ tail -f server.log
```
### To see the error messages
```
$ tail -f error.log
```

## Features
* It takes url of HLS master or media playlist
* It periodically downloads all renditions listed in the master playlist
* It never downloads segment files
* It checks if the EXTINF duration of each segment exceeds the EXT-X-TARGETDURATION and, if it does, outputs an error like this:
```
=== Violation: EXTINF duration exceeds #EXT-X-TARGETDURATION ===
    Playlist URI: xxx
    TargetDuration: 6
    Segment URI: xxx
    SegmentDuration: 8
--- Contents of .m3u8 file: Start ---
{.m3u8 file}
--- Contents of .m3u8 file: End ---
```
