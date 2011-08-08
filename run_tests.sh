#!/bin/sh

PHANTOMJS=/Applications/phantomjs.app/Contents/MacOS/phantomjs
WD=`pwd`

${PHANTOMJS} test.js ${WD}/test/headless.html
