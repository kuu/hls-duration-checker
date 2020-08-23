# hls-duration-checker
A command line tool to monitor HLS playlists and check if there's any violation of [the target duration rule](https://tools.ietf.org/html/rfc8216#section-4.3.3.1):

> The EXTINF duration of each Media Segment in the Playlist file, when rounded to the nearest integer, MUST be less than or equal to the target duration; longer segments can trigger playback stalls or other errors.

You can run `hls-duration-checker` as either a client or a server program. Run it as a client to monitor an existing HLS endpoint. Whereas run it as a server to monitor an HTTP PUT ingestion stream from upstream.

## Features

### Features common to both Client and Server

* It monitors HLS media playlists
* It checks if the EXTINF duration of each segment exceeds the EXT-X-TARGETDURATION
* If it detect the violation, it outputs an error like this:
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
## Client specific features

* It takes a url of HLS master playlist
* It periodically downloads all renditions listed in the master playlist
* It never downloads segment files

## Server specific features

* It listens on a TCP port specified via an environment variable: `PORT`
* It receives all PUT requests but only pick up HLS playlists
* It ignores HLS segment files


## Install
You need `git`[and the latest node](https://nodejs.org/en/)
```
$ git clone https://github.com/kuu/hls-duration-checker.git
$ cd hls-duration-checker
```

## Run
### Start (Client)
Specify a URL of a master playlist file
```
$ npm run client-start http://example.com/master.m3u8
```
### Stop (Client)
```
$ npm run client-stop
```
### Start (Server)
Specify a port number (if you omit, the default is 8080)
```
$ PORT=80 npm run server-start
```

### Stop (Server)
```
$ npm run server-stop
```

### Check the output/errors
```
$ npm run logs
```

### Reset logs and processes
```
$ npm run reset
```
