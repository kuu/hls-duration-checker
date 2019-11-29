# hls-duration-checker
A command to monitor HLS playlists and check if the duration of each segment exceeds the target duration

## Install
```
$ git clone https://github.com/kuu/hls-duration-checker.git
```

## Run
Specify URL of a master or media playlist file
```
$ npm start http://example.com/master.m3u8
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

## Stop
```
$ npm stop
```

## Features
* It takes url of HLS master or media playlist
* It periodically downloads all renditions listed in the master playlist
* It checks if the EXTINF duration of each segment exceeds the EXT-X-TARGETDURATION and outputs an error if it exceeds
* It never downloads segment files
