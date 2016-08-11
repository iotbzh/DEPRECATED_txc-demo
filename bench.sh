#!/bin/sh

make --quiet

TIME() {
	#\time -f "r=%e s=%S u=%U l=%P m=%Mk" "$@"
	time -v "$@"
}

echo ----------------------------------------------------------
echo time to read the trace file
TIME cat nyc-downtown-crosstown.json > /dev/null
echo

echo ----------------------------------------------------------
echo time to read+scan the trace file
TIME ./txc-parse-only nyc-downtown-crosstown.json
echo

echo ----------------------------------------------------------
echo time to read+scan+print the trace file
TIME ./txc-parse-print nyc-downtown-crosstown.json > /dev/null
echo

echo ----------------------------------------------------------
echo time to play the trace file
TXC_NOWAIT= TIME ./txc-play nyc-downtown-crosstown.json > /dev/null
echo

echo ----------------------------------------------------------
echo time to play at full speed the trace file
TXC_SPEED=99999 TIME ./txc-play-speed nyc-downtown-crosstown.json > /dev/null
echo

echo ----------------------------------------------------------
echo time to virtualy play at speed the trace file
TXC_NOWAIT= TXC_SPEED=3.14159 TIME ./txc-play-speed nyc-downtown-crosstown.json > /dev/null
echo


