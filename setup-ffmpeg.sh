#!/bin/bash

mkdir -p ./bin

curl -L -o ffmpeg-release.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz

tar -xf ffmpeg-release.tar.xz

mv ffmpeg-*-amd64-static/ffmpeg ./bin/ffmpeg

chmod +x ./bin/ffmpeg

rm -rf ffmpeg-*-amd64-static
rm -f ffmpeg-release.tar.xz
